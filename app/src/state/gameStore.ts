import { create } from 'zustand';
import { audio } from '../audio/engine';
import {
  ATTUNEMENT_GAIN,
  ATTUNEMENT_MAX,
  FIELD,
  MAX_LEVEL,
  XP_THRESHOLDS,
 SCAN } from '../config/economy';
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
  loadClassifierState,
  recordScan,
  saveThumbnail,
  type ReliquarySlot,
} from '../persistence/scanRepository';
import { discoveryXpFor, neighborCoarseCells } from '../terrain/discovery';
import {
  ACK_CONFIRM,
  ACK_CORRECT,
  ACK_TEACH,
  TYPE_FIRST,
  type Scale,
  type TypeName,
} from '../config/taxonomy';

export type LogEntry = {
  id: number;
  kind: 'sys' | 'disc' | 'ai' | 'milestone';
  text: string;
};

let nextLogId = 1;
const LOG_CAP = 60;

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

  appendLog: (kind: LogEntry['kind'], text: string) => void;
  /** Files a resolved capture: persists scan + thumbnail, grows the model, rewards, companion ack. */
  confirmScan: (args: {
    scale: Scale;
    type: TypeName;
    taught: boolean;
    corrected: boolean;
    thumbPng: Uint8Array;
  }) => Promise<void>;
  markIntroSeen: () => void;
  hydrate: () => Promise<void>;
  /** The one entry point for a new GPS fix: sets origin (first fix), position, fog reveal, and discovery XP. */
  recordMovement: (point: LatLon) => Promise<void>;
  gainXp: (amount: number) => void;
  gainAttunement: (amount: number) => void;
};

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

  confirmScan: async ({ scale, type, taught, corrected, thumbPng }) => {
    const thumbUri = saveThumbnail(thumbPng);
    const firstOfType = !get().reliquary[type];

    set((state) => {
      const taughtCounts = { ...state.taughtCounts, [type]: (state.taughtCounts[type] ?? 0) + 1 };
      const prev = state.reliquary[type];
      const reliquary = {
        ...state.reliquary,
        [type]: prev
          ? { ...prev, count: prev.count + 1 }
          : { count: 1, thumbUri, taughtFirst: taught || corrected },
      };
      return {
        taughtCounts,
        taughtTotal: state.taughtTotal + 1,
        corrections: state.corrections + (corrected ? 1 : 0),
        reliquary,
      };
    });
    void recordScan({ scale, type, taught, corrected, thumbUri });

    get().appendLog(
      'sys',
      (scale === 'FEATURE' ? 'LOCAL SCAN FILED · ' : 'ARTIFACT FILED · ') +
        type +
        (corrected ? ' · CORRECTED' : taught ? ' · TAUGHT' : '')
    );
    audio.play('file');

    const ackPool = taught ? ACK_TEACH : corrected ? ACK_CORRECT : ACK_CONFIRM;
    const ack = ackPool[Math.floor(Math.random() * ackPool.length)];
    get().appendLog('ai', ack.text.replace('{T}', type.toLowerCase()));
    audio.voice(ack.mood);

    const firstLine = firstOfType ? TYPE_FIRST[type] : undefined;
    if (firstLine) {
      setTimeout(() => {
        get().appendLog('ai', firstLine.text);
        audio.voice(firstLine.mood);
      }, 1400);
    }

    get().gainXp(scale === 'FEATURE' ? SCAN.xpFeature : SCAN.xpArtifact);
    if (taught) get().gainXp(SCAN.xpTeachBonus);
    get().gainAttunement(ATTUNEMENT_GAIN.scan);
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
    const [persisted, discovered, revealed, introFlag, classifier] = await Promise.all([
      loadGameState(),
      loadDiscoveredCells(),
      loadRevealCells(),
      getFlag('intro_seen'),
      loadClassifierState(),
    ]);
    set({
      taughtCounts: classifier.taughtCounts,
      taughtTotal: classifier.taughtTotal,
      corrections: classifier.corrections,
      reliquary: classifier.reliquary,
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
    });
  },

  recordMovement: async (point) => {
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

    // Fog-of-war: finer snap grid so accumulated reveals read as continuous.
    const revealKey = cellKeyFor(meters, FIELD.revealSnapM);
    if (!get().revealedCells.has(revealKey)) {
      const next = new Set(get().revealedCells);
      next.add(revealKey);
      set({ revealedCells: next });
      void markRevealCell(revealKey);
    }

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
      get().appendLog('disc', `+${earned} XP · DISCOVERY`);
      get().gainXp(earned);
      get().gainAttunement(ATTUNEMENT_GAIN.discovery);
    }
  },

  gainXp: (amount) => {
    set((state) => {
      const xp = state.xp + amount;
      let level = state.level;
      let log = state.log;
      while (level < MAX_LEVEL && xp >= XP_THRESHOLDS[level - 1]) {
        level += 1;
        audio.play('levelup');
        // Rendered as in-world telemetry, never as game mechanics — brief §5.
        log = [
          ...log,
          { id: nextLogId++, kind: 'milestone' as const, text: `THRESHOLD ATTAINED · LEVEL ${level}` },
        ].slice(-LOG_CAP);
      }
      void saveProgress(level, xp, state.attunement);
      return { xp, level, log };
    });
  },

  gainAttunement: (amount) => {
    set((state) => {
      const attunement = Math.min(ATTUNEMENT_MAX, state.attunement + amount);
      void saveProgress(state.level, state.xp, attunement);
      return { attunement };
    });
  },
}));
