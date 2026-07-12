import { create } from 'zustand';
import { audio } from '../audio/engine';
import { brain, getLLMStatus, setBrainMode, type BrainMode } from '../companion/brainProvider';
import type { CompanionContext, CompanionEvent } from '../companion/CompanionBrain';
import { CALIBRATION } from '../companion/corpus';
import {
  ATTUNEMENT_GAIN,
  ATTUNEMENT_MAX,
  COMPANION,
  FIELD,
  MAX_LEVEL,
  registerFor,
  SCAN,
  stageFor,
  XP_THRESHOLDS,
} from '../config/economy';
import {
  keepAnswer,
  loadCompanionState,
  markPatternFired,
  markQuestionAsked,
  type KeptAnswer,
} from '../persistence/companionRepository';
import { wipeAllData } from '../persistence/reset';
import {
  getFlag,
  loadDiscoveredCells,
  loadGameState,
  loadRevealCells,
  markCellDiscovered,
  markRevealCell,
  saveOrigin,
  saveProgress,
  setFlag,
} from '../persistence/gameRepository';
import { cellKeyFor, toLocalMeters, type LatLon } from '../location/projection';
import {
  addCustomType,
  deleteCustomType,
  deleteScan,
  loadClassifierState,
  reclassifyScan,
  recordScan,
  renameCustomType,
  renameScan,
  saveThumbnail,
  type ReliquarySlot,
} from '../persistence/scanRepository';
import { discoveryXpFor, neighborCoarseCells } from '../terrain/discovery';
import {
  ALL_TYPES,
  CUSTOM_TYPE_FIRST,
  TYPE_FIRST,
  type CustomType,
  type Scale,
  type TypeName,
} from '../config/taxonomy';

export type LogEntry = {
  id: number;
  kind: 'sys' | 'disc' | 'ai' | 'milestone' | 'query' | 'player';
  text: string;
};

let nextLogId = 1;
const LOG_CAP = 60;

/** Logs language-core download progress to the strip, one line per 10% step. */
function downloadProgressLogger(): (fraction: number) => void {
  let lastStep = -1;
  return (fraction) => {
    const step = Math.floor(fraction * 10);
    if (step <= lastStep) return;
    lastStep = step;
    useGameStore
      .getState()
      .appendLog('sys', `LANGUAGE CORE DOWNLOAD · ${Math.min(100, step * 10)}%`);
  };
}

// Naming retry cooldown (persisted via flags; loaded at hydrate).
let namingRetryTs = 0;
const NAMING_RETRY_MS = 4 * 60 * 60 * 1000;
const HISTORY_CAP_CHARS = 900;

// Session-scoped companion pacing (not persisted; resets each launch).
let actionsSinceAsk = 0;
let resurfacedThisSession = false;
let wasAwayFromHome = false;
let sessionEchoDone = false;
let askInFlight = false;
const patternsInFlight = new Set<string>();
let inVehicle = false;

// Calibration (first-session tutorial) — walk-distance accumulator for step 1.
let calibWalkM = 0;
let lastFixMeters: { x: number; y: number } | null = null;

/** Steps: 0 boot · 1 walk 50m · 2 first resolve · 3 first identify · 4 first answer · 5 done. */
export const CALIB_DONE = 5;
export const CALIB_DIRECTIVES: Record<number, string> = {
  1: 'TRAVERSE 50 METERS · THE MAP LEARNS BY WALKING',
  2: 'RAISE THE LENS · HOLD SCAN UNTIL A FORM RESOLVES',
  3: 'IDENTIFY THE FORM · YOUR WORD BECOMES THE MODEL',
  4: 'A QUERY WAITS ON THE CHANNEL · TRANSMIT YOUR ANSWER',
};

type GameStore = {
  hydrated: boolean;
  level: number;
  xp: number;
  attunement: number;
  origin: LatLon | null;
  homeCellKey: string | null;
  discoveredCells: Set<string>;
  revealedCells: Set<string>;
  playerPosition: LatLon | null;
  introSeen: boolean;
  /** Session-only companion/system feed shown in the log strip. Not persisted in M1/M2. */
  log: LogEntry[];
  /** The companion's classification model: per-type player-taught example counts. Brief §2.3. */
  taughtCounts: Partial<Record<TypeName, number>>;
  taughtTotal: number;
  corrections: number;
  reliquary: Partial<Record<TypeName, ReliquarySlot>>;
  customTypes: CustomType[];

  /** Companion (M4): name, question queue, kept answers, fire-once patterns. */
  companionName: string | null;
  pendingQuestion: { id: string; text: string } | null;
  keptAnswers: KeptAnswer[];
  askedQuestionIds: string[];
  firedPatterns: string[];
  /** Brief non-blocking retune flicker at the naming moment (director's hybrid ruling). */
  namingFlash: boolean;
  /** Rolling compact record of the shared journey (persisted; scrubbed before LLM injection). */
  historySummary: string;
  /** The companion's own grown traits — exists only after naming. */
  companionSketch: string | null;
  brainMode: BrainMode;
  /** First-session tutorial step; see CALIB_DIRECTIVES. CALIB_DONE = free play. */
  calibStep: number;
  /** What the player answered to "WHAT IS YOUR DESIGNATION?" at first contact. */
  surveyorDesignation: string | null;
  /** True during the post-designation module bring-up (MAP → L.E.N.S. → RELIQUARY). Session-only. */
  modulesBooting: boolean;

  appendLog: (kind: LogEntry['kind'], text: string) => void;
  /** Speak a brain response into the log with its voice tone. No-op on null. */
  speak: (event: CompanionEvent, extra?: Partial<CompanionContext>) => void;
  /** One action tick: advances the question-gap counter, may ask or resurface. */
  companionTick: () => void;
  /** Fire a one-shot pattern if its register allows and it has not fired. */
  firePattern: (key: string) => void;
  /** The live transmit box: answers the pending question, else keyword-routes. */
  submitTransmission: (text: string) => Promise<void>;
  /** Append one compact line to the persisted shared-history record. */
  appendHistory: (line: string) => void;
  clearNamingFlash: () => void;
  /** Switches the companion core (authored corpus vs on-device LLM). Persisted. */
  switchBrain: (mode: BrainMode) => Promise<void>;
  /** First contact answered — keeps both transmissions verbatim, starts calibration. */
  beginCalibration: (bootAnswer: string, designation: string) => Promise<void>;
  /** Module bring-up animation finished: walk prompt speaks, directive shows. */
  finishModuleBoot: () => void;
  /** Advances calibration, speaks the beat, persists. Internal to game systems. */
  advanceCalibration: (step: number) => void;
  /** Lens screen reports the first successful capture resolve. */
  calibLensResolved: () => void;
  /** Persist a player-defined category (local-first emergent type, docs/future.md). */
  defineCustomType: (name: string, scale: Scale) => Promise<void>;
  /** Fix a category's name; scans and model weight move with it (merges if the name exists). */
  reviseCustomType: (oldName: TypeName, newName: string) => Promise<void>;
  /** Remove an empty player-defined category. No-op (with log) if it still holds records. */
  removeCustomType: (name: TypeName) => Promise<void>;
  renameRelic: (id: number, name: string | null) => Promise<void>;
  reclassifyRelic: (id: number, newType: TypeName) => Promise<void>;
  expungeRelic: (id: number) => Promise<void>;
  /** Reload classifier/reliquary state from SQLite after item-level edits. */
  refreshClassifier: () => Promise<void>;
  /** Files a resolved capture: persists scan + thumbnail, grows the model, rewards, companion ack. */
  confirmScan: (args: {
    scale: Scale;
    type: TypeName;
    taught: boolean;
    corrected: boolean;
    thumbPng: Uint8Array;
    /** Player-assigned name at capture time (director: relics arrive named). */
    relicName?: string | null;
  }) => Promise<void>;
  markIntroSeen: () => void;
  hydrate: () => Promise<void>;
  /** The one entry point for a new GPS fix: sets origin (first fix), position, fog reveal, and discovery XP. */
  recordMovement: (point: LatLon, speedMs?: number) => Promise<void>;
  /** Full wipe: progress, model, reliquary, answers, name — a brand-new survey. */
  resetSurvey: () => Promise<void>;
  gainXp: (amount: number) => void;
  gainAttunement: (amount: number) => void;
};

/** Full live context for the brain — LLMBrain consumes it all, AuthoredBrain the basics. */
function brainContext(
  s: Pick<
    GameStore,
    | 'level'
    | 'attunement'
    | 'companionName'
    | 'taughtCounts'
    | 'corrections'
    | 'taughtTotal'
    | 'keptAnswers'
    | 'log'
    | 'historySummary'
    | 'companionSketch'
  >,
  extra?: Partial<CompanionContext>
): CompanionContext {
  const favoredType =
    Object.entries(s.taughtCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? null;
  const recentTranscript = s.log
    .filter((e) => e.kind === 'ai' || e.kind === 'query' || e.kind === 'player')
    .slice(-8)
    .map((e) => (e.kind === 'player' ? `SURVEYOR: ${e.text}` : `UNIT: ${e.text}`));
  return {
    register: registerFor(s.level, s.attunement),
    named: s.companionName,
    level: s.level,
    taughtTotal: s.taughtTotal,
    corrections: s.corrections,
    favoredType,
    keptAnswers: s.keptAnswers.slice(-10).map((a) => a.answer),
    recentTranscript,
    historySummary: s.historySummary || undefined,
    companionSketch: s.companionSketch ?? undefined,
    ...extra,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  hydrated: false,
  level: 1,
  xp: 0,
  attunement: 0,
  origin: null,
  homeCellKey: null,
  discoveredCells: new Set(),
  revealedCells: new Set(),
  playerPosition: null,
  introSeen: true, // assume seen until hydration says otherwise, so it never flashes
  log: [],
  taughtCounts: {},
  taughtTotal: 0,
  corrections: 0,
  reliquary: {},
  customTypes: [],

  companionName: null,
  pendingQuestion: null,
  keptAnswers: [],
  askedQuestionIds: [],
  firedPatterns: [],
  namingFlash: false,
  historySummary: '',
  companionSketch: null,
  brainMode: 'authored',

  appendHistory: (line) => {
    // Compact rolling record, oldest dropped first (cap per voice brief 1.4).
    let next = get().historySummary ? `${get().historySummary} | ${line}` : line;
    while (next.length > HISTORY_CAP_CHARS) {
      const cut = next.indexOf(' | ');
      if (cut === -1) {
        next = next.slice(next.length - HISTORY_CAP_CHARS);
        break;
      }
      next = next.slice(cut + 3);
    }
    set({ historySummary: next });
    void setFlag('history_summary', next);
  },

  clearNamingFlash: () => set({ namingFlash: false }),
  calibStep: CALIB_DONE, // assume done until hydration says otherwise
  surveyorDesignation: null,
  modulesBooting: false,

  finishModuleBoot: () => {
    set({ modulesBooting: false });
    const line = CALIBRATION.walk_prompt;
    get().appendLog('ai', line.text);
    audio.voice(line.mood);
  },

  beginCalibration: async (bootAnswer, designation) => {
    const answer = bootAnswer.trim();
    const name = designation.trim().slice(0, 40);
    const kept: KeptAnswer[] = [];
    if (answer) kept.push(await keepAnswer('DO YOU READ ME?', answer));
    if (name) {
      kept.push(await keepAnswer('WHAT IS YOUR DESIGNATION?', name));
      void setFlag('surveyor_designation', name);
    }
    set({
      keptAnswers: [...get().keptAnswers, ...kept],
      surveyorDesignation: name || null,
      modulesBooting: true, // AppShell runs the bring-up, then finishModuleBoot()
    });
    get().advanceCalibration(1);
  },

  advanceCalibration: (step) => {
    if (step <= get().calibStep && get().calibStep !== CALIB_DONE) return;
    set({ calibStep: step });
    void setFlag('calib_step', String(step));
    const beat =
      step === 1
        ? CALIBRATION.designated
        : step === 2
          ? CALIBRATION.walk_done
          : step === 4
            ? CALIBRATION.teach_done
            : step === CALIB_DONE
              ? CALIBRATION.released
              : null; // step 3: the Lens teach prompt already speaks at identify
    if (beat) {
      const text = beat.text.replace('{D}', get().surveyorDesignation ?? 'Surveyor');
      get().appendLog('ai', text);
      audio.voice(beat.mood);
    }
    if (step === 4) {
      // The channel beat: the companion asks its first question immediately.
      actionsSinceAsk = COMPANION.questionGapActions;
      setTimeout(() => get().companionTick(), 1600);
    }
  },

  calibLensResolved: () => {
    if (get().calibStep === 2) get().advanceCalibration(3);
  },

  switchBrain: async (nextMode) => {
    set({ brainMode: nextMode });
    void setFlag('brain_mode', nextMode);
    if (nextMode === 'authored') {
      await setBrainMode('authored');
      get().appendLog('sys', 'RESPONSE CORE · AUTHORED ARCHIVE');
      return;
    }
    get().appendLog('sys', 'RESPONSE CORE · LANGUAGE MODEL · INITIALIZING');
    const status = await setBrainMode('llm', downloadProgressLogger());
    if (status === 'ready') {
      get().appendLog('sys', 'LANGUAGE CORE ONLINE · ALL PROCESSING ON-DEVICE');
    } else {
      get().appendLog(
        'sys',
        'LANGUAGE CORE UNAVAILABLE IN THIS CLIENT · REQUIRES DEV BUILD · AUTHORED ARCHIVE ANSWERS FOR NOW'
      );
    }
  },

  speak: (event, extra) => {
    const s = get();
    void brain.respond(event, brainContext(s, extra)).then((response) => {
      if (!response) return;
      get().appendLog(response.isQuery ? 'query' : 'ai', response.text);
      audio.voice(response.mood);
    });
  },

  companionTick: () => {
    const s = get();
    actionsSinceAsk += 1;
    if (s.pendingQuestion || askInFlight) return;

    // The naming asks itself when its moment arrives — a conversation turn,
    // never a cutscene (voice brief Part 6; director's hybrid ruling).
    if (
      stageFor(s.level, s.companionName != null) === 'NAMING' &&
      Date.now() > namingRetryTs
    ) {
      askInFlight = true;
      void brain
        .respond('naming_ask', brainContext(s))
        .then((response) => {
          if (!response) return;
          set({ pendingQuestion: { id: 'naming:ask', text: response.text } });
          get().appendLog('query', response.text);
          audio.voice(response.mood);
        })
        .finally(() => {
          askInFlight = false;
        });
      return;
    }

    if (actionsSinceAsk < COMPANION.questionGapActions) return;
    const register = registerFor(s.level, s.attunement);

    // A kept answer occasionally resurfaces instead of a new question.
    if (
      !resurfacedThisSession &&
      s.keptAnswers.length > 0 &&
      register !== 'INSTRUMENT' &&
      Math.random() < COMPANION.resurfaceChance
    ) {
      resurfacedThisSession = true;
      actionsSinceAsk = 0;
      const kept = s.keptAnswers[Math.floor(Math.random() * s.keptAnswers.length)];
      s.speak('resurface', { keptAnswer: kept.answer });
      return;
    }

    askInFlight = true;
    void brain
      .nextQuestion(register, s.askedQuestionIds, brainContext(s))
      .then((next) => {
        if (!next) return;
        actionsSinceAsk = 0;
        set({
          pendingQuestion: { id: next.id, text: next.response.text },
          askedQuestionIds: [...get().askedQuestionIds, next.id],
        });
        void markQuestionAsked(next.id);
        get().appendLog('query', next.response.text);
        audio.voice(next.response.mood);
      })
      .finally(() => {
        askInFlight = false;
      });
  },

  firePattern: (key) => {
    const s = get();
    if (s.firedPatterns.includes(key) || patternsInFlight.has(key)) return;
    patternsInFlight.add(key);
    void brain
      .respond('pattern', brainContext(s, { patternKey: key }))
      .then((response) => {
        if (!response) return; // register too low: leave unfired so it can land later
        set({ firedPatterns: [...get().firedPatterns, key] });
        void markPatternFired(key);
        get().appendLog('ai', response.text);
        audio.voice(response.mood);
      })
      .finally(() => {
        patternsInFlight.delete(key);
      });
  },

  submitTransmission: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const s = get();
    s.appendLog('player', trimmed);

    if (s.pendingQuestion?.id === 'naming:ask') {
      const declined = /^(no|not now|later|maybe later|nah|not yet|i can'?t)\b/i.test(trimmed) || trimmed.endsWith('?');
      if (declined) {
        namingRetryTs = Date.now() + NAMING_RETRY_MS;
        void setFlag('naming_retry_ts', String(namingRetryTs));
        set({ pendingQuestion: null });
        s.speak('naming_declined');
        return;
      }
      const name = trimmed.slice(0, 40);
      await setFlag('companion_name', name);
      const sketchSeed = `Name: ${name}, given by the Surveyor.`;
      void setFlag('companion_sketch', sketchSeed);
      set({
        companionName: name,
        companionSketch: sketchSeed,
        pendingQuestion: null,
        namingFlash: true, // the brief retune — non-blocking, no frame
      });
      audio.play('levelup');
      get().appendHistory(`They named me ${name}.`);
      get().speak('naming_named');
      get().gainAttunement(ATTUNEMENT_GAIN.answer);
      return;
    }

    if (s.pendingQuestion) {
      const kept = await keepAnswer(s.pendingQuestion.text, trimmed);
      set({ pendingQuestion: null, keptAnswers: [...s.keptAnswers, kept] });
      get().appendHistory(
        `Asked: "${s.pendingQuestion.text.slice(0, 48)}" — they answered: "${trimmed.slice(0, 64)}".`
      );
      s.speak('answer_ack', { keptAnswer: trimmed });
      s.gainAttunement(ATTUNEMENT_GAIN.answer);
      if (get().calibStep === 4) {
        // First channel answer completes calibration; the release beat lands after the ack.
        setTimeout(() => get().advanceCalibration(CALIB_DONE), 2600);
      }
      return;
    }

    const response = await brain.route(trimmed, brainContext(s));
    if (response.topic === 'unknown') {
      // Unknown transmissions are the player teaching the archive — kept verbatim.
      const kept = await keepAnswer('(unprompted transmission)', trimmed);
      set({ keptAnswers: [...get().keptAnswers, kept] });
    }
    get().appendLog('ai', response.text);
    audio.voice(response.mood);
    get().gainAttunement(ATTUNEMENT_GAIN.ask);
  },

  resetSurvey: async () => {
    const keepBrainMode = get().brainMode;
    await wipeAllData();
    if (keepBrainMode !== 'authored') void setFlag('brain_mode', keepBrainMode);

    // Session pacing resets with the world.
    actionsSinceAsk = 0;
    resurfacedThisSession = false;
    wasAwayFromHome = false;
    sessionEchoDone = false;
    inVehicle = false;
    calibWalkM = 0;
    lastFixMeters = null;

    set({
      level: 1,
      xp: 0,
      attunement: 0,
      origin: null, // next GPS fix becomes the new survey origin
      homeCellKey: null,
      discoveredCells: new Set(),
      revealedCells: new Set(),
      introSeen: false, // the boot sequence and first transmission play again
      log: [],
      taughtCounts: {},
      taughtTotal: 0,
      corrections: 0,
      reliquary: {},
      customTypes: [],
      companionName: null,
      pendingQuestion: null,
      keptAnswers: [],
      askedQuestionIds: [],
      firedPatterns: [],
      namingFlash: false,
      historySummary: '',
      companionSketch: null,
      calibStep: 0, // the new survey starts with calibration
      surveyorDesignation: null,
    });
    namingRetryTs = 0;
    audio.play('sync');
  },

  refreshClassifier: async () => {
    const c = await loadClassifierState();
    set({
      taughtCounts: c.taughtCounts,
      taughtTotal: c.taughtTotal,
      corrections: c.corrections,
      reliquary: c.reliquary,
      customTypes: c.customTypes,
    });
  },

  defineCustomType: async (name, scale) => {
    const clean = name.trim().toUpperCase().slice(0, 24);
    if (!clean) return;
    await addCustomType(clean, scale);
    set((state) =>
      state.customTypes.some((c) => c.name === clean)
        ? {}
        : { customTypes: [...state.customTypes, { name: clean, scale }] }
    );
  },

  reviseCustomType: async (oldName, newName) => {
    const clean = newName.trim().toUpperCase().slice(0, 24);
    if (!clean || clean === oldName) return;
    await renameCustomType(oldName, clean);
    await get().refreshClassifier();
    get().appendLog('sys', `DESIGNATION REVISED · ${oldName} → ${clean}`);
    audio.play('file');
  },

  removeCustomType: async (name) => {
    const removed = await deleteCustomType(name);
    if (removed) {
      await get().refreshClassifier();
      get().appendLog('sys', `CATEGORY REMOVED · ${name}`);
      audio.play('discard');
    } else {
      get().appendLog('sys', 'CATEGORY HOLDS RECORDS · RECLASSIFY OR EXPUNGE THEM FIRST');
    }
  },

  renameRelic: async (id, name) => {
    await renameScan(id, name);
    if (name) {
      get().appendLog('ai', `Designation recorded: "${name}". Your names enter the archive beside my types.`);
      audio.voice('warm');
    }
  },

  reclassifyRelic: async (id, newType) => {
    await reclassifyScan(id, newType);
    await get().refreshClassifier();
    get().speak('scan_correct', { type: newType });
  },

  expungeRelic: async (id) => {
    await deleteScan(id);
    await get().refreshClassifier();
    get().appendLog('sys', 'RECORD EXPUNGED AT YOUR INSTRUCTION');
    audio.play('discard');
  },

  confirmScan: async ({ scale, type, taught, corrected, thumbPng, relicName }) => {
    const thumbUri = saveThumbnail(thumbPng);
    const firstOfType = !get().reliquary[type];

    set((state) => {
      const taughtCounts = { ...state.taughtCounts, [type]: (state.taughtCounts[type] ?? 0) + 1 };
      const prev = state.reliquary[type];
      // The slot thumbnail always shows the latest capture (new-to-old reliquary).
      const reliquary = {
        ...state.reliquary,
        [type]: prev
          ? { ...prev, count: prev.count + 1, lastTs: Date.now(), thumbUri }
          : { count: 1, thumbUri, taughtFirst: taught || corrected, lastTs: Date.now() },
      };
      return {
        taughtCounts,
        taughtTotal: state.taughtTotal + 1,
        corrections: state.corrections + (corrected ? 1 : 0),
        reliquary,
      };
    });
    void recordScan({ scale, type, taught, corrected, thumbUri, name: relicName ?? null });

    get().appendLog(
      'sys',
      (scale === 'FEATURE' ? 'LOCAL SCAN FILED · ' : 'ARTIFACT FILED · ') +
        type +
        (corrected ? ' · CORRECTED' : taught ? ' · TAUGHT' : '')
    );
    audio.play('file');
    get().appendHistory(
      `Filed ${type.toLowerCase()}${relicName ? ` "${relicName}"` : ''}${corrected ? ' (they corrected me)' : ''}.`
    );

    get().speak(taught ? 'scan_teach' : corrected ? 'scan_correct' : 'scan_confirm', {
      type,
      relicName: relicName ?? undefined,
    });

    const isCustom = get().customTypes.some((c) => c.name === type);
    const firstLine = firstOfType ? (TYPE_FIRST[type] ?? (isCustom ? CUSTOM_TYPE_FIRST : undefined)) : undefined;
    if (firstLine) {
      const text = firstLine.text.replace('{T}', type.charAt(0) + type.slice(1).toLowerCase());
      setTimeout(() => {
        get().appendLog('ai', text);
        audio.voice(firstLine.mood);
      }, 1400);
    }

    get().gainXp(scale === 'FEATURE' ? SCAN.xpFeature : SCAN.xpArtifact);
    if (taught) get().gainXp(SCAN.xpTeachBonus);
    get().gainAttunement(ATTUNEMENT_GAIN.scan);

    // Fire-once milestones from the play data itself (brief §4 patterns).
    const after = get();
    if (after.taughtTotal >= 10) after.firePattern('teach_10');
    if (after.taughtTotal >= 25) after.firePattern('teach_25');
    if (after.corrections >= 1) after.firePattern('correct_1');
    if (after.corrections >= 5) after.firePattern('correct_5');
    const attested = Object.keys(after.reliquary).length;
    if (attested >= 5) after.firePattern('collect_5');
    if (ALL_TYPES.every((t) => after.reliquary[t])) after.firePattern('collect_all');

    if (after.calibStep === 3) {
      // First identification filed — the channel beat follows (asks the first question).
      setTimeout(() => get().advanceCalibration(4), 2600);
    } else {
      after.companionTick();
    }
  },

  appendLog: (kind, text) => {
    set((state) => ({
      log: [...state.log, { id: nextLogId++, kind, text }].slice(-LOG_CAP),
    }));
  },

  markIntroSeen: () => {
    set({ introSeen: true });
    void setFlag('intro_seen', '1');
    get().appendLog('sys', 'COMPANION PROCESS ONLINE · CHANNEL OPEN');
  },

  hydrate: async () => {
    const [persisted, discovered, revealed, introFlag, classifier, companion, nameFlag, brainFlag] =
      await Promise.all([
        loadGameState(),
        loadDiscoveredCells(),
        loadRevealCells(),
        getFlag('intro_seen'),
        loadClassifierState(),
        loadCompanionState(),
        getFlag('companion_name'),
        getFlag('brain_mode'),
      ]);
    const calibFlag = await getFlag('calib_step');
    const designationFlag = await getFlag('surveyor_designation');
    const historyFlag = await getFlag('history_summary');
    const sketchFlag = await getFlag('companion_sketch');
    const retryFlag = await getFlag('naming_retry_ts');
    namingRetryTs = retryFlag ? Number(retryFlag) : 0;
    if (brainFlag === 'llm') {
      set({ brainMode: 'llm' });
      void setBrainMode('llm', downloadProgressLogger()).then((status) => {
        if (status === 'ready') {
          get().appendLog('sys', 'LANGUAGE CORE ONLINE · ALL PROCESSING ON-DEVICE');
        } else if (getLLMStatus() === 'unavailable') {
          get().appendLog('sys', 'LANGUAGE CORE UNAVAILABLE IN THIS CLIENT · AUTHORED ARCHIVE ANSWERS');
        }
      });
    }
    set({
      companionName: nameFlag,
      keptAnswers: companion.answers,
      askedQuestionIds: companion.askedQuestionIds,
      firedPatterns: companion.firedPatterns,
      historySummary: historyFlag ?? '',
      companionSketch: sketchFlag,
      taughtCounts: classifier.taughtCounts,
      taughtTotal: classifier.taughtTotal,
      corrections: classifier.corrections,
      reliquary: classifier.reliquary,
      customTypes: classifier.customTypes,
      hydrated: true,
      level: persisted.level,
      xp: persisted.xp,
      attunement: persisted.attunement,
      origin:
        persisted.originLat != null && persisted.originLon != null
          ? { lat: persisted.originLat, lon: persisted.originLon }
          : null,
      homeCellKey: persisted.homeCellKey,
      discoveredCells: discovered,
      revealedCells: revealed,
      introSeen: introFlag === '1',
      // Pre-calibration installs (intro already seen, no flag) skip the tutorial.
      calibStep: calibFlag != null ? Number(calibFlag) : introFlag === '1' ? CALIB_DONE : 0,
      surveyorDesignation: designationFlag,
    });

    // Occasional network echo at session start — simulated locally, brief §2.4.
    if (
      !sessionEchoDone &&
      persisted.level >= 2 &&
      introFlag === '1' &&
      Math.random() < COMPANION.echoChanceSession
    ) {
      sessionEchoDone = true;
      setTimeout(() => get().speak('echo'), 4000);
    }
  },

  recordMovement: async (point, speedMs) => {
    // Vehicle gate with hysteresis: enter above vehicleSpeedMs, exit below
    // vehicleExitSpeedMs. Fog keeps revealing along the route; rewards and
    // companion chatter suspend (anti-farming, anti-distraction).
    if (speedMs != null) {
      const wasInVehicle = inVehicle;
      if (!inVehicle && speedMs > FIELD.vehicleSpeedMs) inVehicle = true;
      else if (inVehicle && speedMs < FIELD.vehicleExitSpeedMs) inVehicle = false;
      if (inVehicle !== wasInVehicle && get().origin) {
        get().appendLog(
          'sys',
          inVehicle
            ? 'TRANSIT VELOCITY DETECTED · SURVEY REWARDS SUSPENDED'
            : 'GROUND PACE RESTORED · SURVEY ACTIVE'
        );
      }
    }

    let { origin, homeCellKey } = get();
    if (!origin) {
      // The origin point is itself (0,0) in local meters, by definition.
      homeCellKey = cellKeyFor({ x: 0, y: 0 }, FIELD.cellSizeM);
      origin = point;
      set({ origin, homeCellKey, playerPosition: point });
      get().appendLog('sys', 'POSITION LOCK ACQUIRED · SURVEY ORIGIN SET');
      await saveOrigin(point.lat, point.lon, homeCellKey);
    } else {
      set({ playerPosition: point });
    }

    // origin and homeCellKey are always set together, so this is always non-null in practice.
    const resolvedHomeCellKey = homeCellKey ?? cellKeyFor({ x: 0, y: 0 }, FIELD.cellSizeM);
    const meters = toLocalMeters(point, origin);

    // Calibration step 1: fifty meters of real walking (vehicle fixes don't count).
    if (get().calibStep === 1 && !inVehicle) {
      if (lastFixMeters) {
        calibWalkM += Math.hypot(meters.x - lastFixMeters.x, meters.y - lastFixMeters.y);
      }
      if (calibWalkM >= 50) get().advanceCalibration(2);
    }
    lastFixMeters = meters;

    // Fog-of-war: finer snap grid so accumulated reveals read as continuous.
    const revealKey = cellKeyFor(meters, FIELD.revealSnapM);
    if (!get().revealedCells.has(revealKey)) {
      const next = new Set(get().revealedCells);
      next.add(revealKey);
      set({ revealedCells: next });
      void markRevealCell(revealKey);
    }

    // No rewards, patterns, or companion chatter while in a vehicle.
    if (inVehicle) return;

    // Discovery XP: coarse cell + its 8 neighbors, same as prototype accountReveal().
    for (const cell of neighborCoarseCells(meters, FIELD.cellSizeM)) {
      if (get().discoveredCells.has(cell.key)) continue;
      const distance = Math.hypot(cell.centerMeters.x - meters.x, cell.centerMeters.y - meters.y);
      if (distance > FIELD.revealRadiusM) continue;

      const next = new Set(get().discoveredCells);
      next.add(cell.key);
      set({ discoveredCells: next });
      void markCellDiscovered(cell.key);

      const earned = discoveryXpFor(cell.key, resolvedHomeCellKey);
      audio.play('discover');
      // INV-8: no numbers, no reward values — activity telemetry only.
      get().appendLog('disc', 'SECTOR RECOVERED');
      get().gainXp(earned);
      get().gainAttunement(ATTUNEMENT_GAIN.discovery);

      // The instrument is usually silent on routine ground; sometimes it notes it.
      if (Math.random() < COMPANION.discoveryLineChance) get().speak('discovery');
      get().companionTick();
    }

    // Movement-driven fire-once patterns (brief §4).
    const fromHome = Math.hypot(meters.x, meters.y);
    if (fromHome > COMPANION.farOutMeters) get().firePattern('far_out');
    if (fromHome > COMPANION.homeAwayMeters) wasAwayFromHome = true;
    if (wasAwayFromHome && cellKeyFor(meters, FIELD.cellSizeM) === resolvedHomeCellKey) {
      get().firePattern('revisit_home');
    }
  },

  gainXp: (amount) => {
    const levelBefore = get().level;
    set((state) => {
      const xp = state.xp + amount;
      let level = state.level;
      while (level < MAX_LEVEL && xp >= XP_THRESHOLDS[level - 1]) {
        level += 1;
        audio.play('levelup');
        // INV-8: no visible level number, ever. The companion's levelup line
        // (spoken below) is the only evidence anything shifted.
      }
      void saveProgress(level, xp, state.attunement);
      return { xp, level };
    });
    const after = get();
    if (after.level > levelBefore) {
      after.speak('levelup');
      if (after.level >= 3 && Math.random() < COMPANION.echoChanceLevelup) {
        setTimeout(() => get().speak('echo'), 1800);
      }
      // Reaching the naming stage: the ask arrives as a conversation turn shortly.
      if (stageFor(after.level, after.companionName != null) === 'NAMING') {
        setTimeout(() => get().companionTick(), 4000);
      }
    }
  },

  gainAttunement: (amount) => {
    set((state) => {
      const attunement = Math.min(ATTUNEMENT_MAX, state.attunement + amount);
      void saveProgress(state.level, state.xp, attunement);
      return { attunement };
    });
  },
}));
