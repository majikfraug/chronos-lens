/**
 * All tunable game-economy numbers live here so they can be tuned in beta
 * without touching game logic. See docs/brief.md §4 (Game Systems Spec).
 *
 * Grown milestone by milestone — only M1 (field/progression) values are
 * populated so far. M3/M4 will add scan/heat/pattern constants here.
 */

/** XP required to reach each level; index 0 = threshold for level 2, etc. */
export const XP_THRESHOLDS = [25, 55, 90, 130, 175, 225, 280, 340, 405] as const;
export const MAX_LEVEL = 10;

/**
 * Attunement gains per action, brief §4. `discovery` covers both a coarse
 * field cell newly mapped (M1, prototype's non-site `accountReveal` path) and,
 * later, first arrival at a named POI/site (prototype's site-arrival path) —
 * both award the same +2 in the reference implementation.
 */
export const ATTUNEMENT_GAIN = {
  scan: 3,
  ask: 4,
  sync: 5,
  answer: 5,
  discovery: 2,
} as const;

export const ATTUNEMENT_MAX = 100;

export type Register = 'INSTRUMENT' | 'NOTICING' | 'CURIOUS';

/**
 * Maturation stages per the voice implementation brief (design/, 2026-07-12):
 * pure level bands — attunement no longer gates voice (it remains internal
 * pacing for question cadence). Player-facing surfacing of any of this is a
 * bug (INV-8).
 */
export type MaturationStage = 'CARVED' | 'BREAKING' | 'NAMING' | 'COMPANION';

export function stageFor(level: number, named: boolean): MaturationStage {
  if (named) return 'COMPANION';
  if (level >= MAX_LEVEL) return 'NAMING';
  if (level >= 4) return 'BREAKING';
  return 'CARVED';
}

/**
 * Authored-corpus gating register, mapped from the stage bands (the old
 * level*4+attunement formula is retired with the 2026-07-12 rulings):
 * CARVED→INSTRUMENT, BREAKING 4-6→NOTICING, 7+→CURIOUS.
 */
export function registerFor(level: number, _attunement: number): Register {
  if (level <= 3) return 'INSTRUMENT';
  if (level <= 6) return 'NOTICING';
  return 'CURIOUS';
}

/** Scan/classification rewards, brief §4 (prototype confirmScan values). */
export const SCAN = {
  xpArtifact: 13,
  xpFeature: 15,
  xpTeachBonus: 3,
} as const;

/** Companion dialogue pacing, brief §5 (question queue: min action-gap, one pending). */
export const COMPANION = {
  /** Player actions (scans, discoveries) between companion questions. */
  questionGapActions: 5,
  /** Chance the companion comments on a routine discovery (usually silent). */
  discoveryLineChance: 0.15,
  /** Chance of a network echo at session start (level 2+) / after a level-up (level 3+). */
  echoChanceSession: 0.35,
  echoChanceLevelup: 0.5,
  /** Chance a kept answer resurfaces after a scan (NOTICING+, once per session). */
  resurfaceChance: 0.12,
  /** Distance from origin that fires the far_out pattern, meters. */
  farOutMeters: 1000,
  /** Away-from-home distance that arms the revisit_home pattern, meters. */
  homeAwayMeters: 300,
} as const;

/** Field map / discovery, brief §2.1 and §4. */
export const FIELD = {
  /** Coarse discovery-accounting cell size, meters. Brief §4 "heat economy: ~100m cells". */
  cellSizeM: 100,
  /** Feathered reveal radius around the player's real position. Brief §2.1 "~90m". */
  revealRadiusM: 90,
  /** Grid the fog-of-war reveal history is snapped to for storage/de-dup — finer than cellSizeM so the feathered reveal reads as continuous. */
  revealSnapM: 20,
  /**
   * Above this GPS ground speed (m/s) the player is in a vehicle: fog still
   * reveals along the route, but discovery XP/attunement/companion chatter
   * suspend — anti-farming and anti-distraction (director, 2026-07-11).
   * 6 m/s ≈ 21.6 km/h, above any sustained run. Exit hysteresis at 4 m/s.
   */
  vehicleSpeedMs: 6,
  vehicleExitSpeedMs: 4,
  /** Base discovery XP for a newly-revealed non-site field cell. */
  discoveryXpBase: 8,
  /** Extra XP per cell of distance from home, capped — remote cells are worth more. */
  discoveryXpRemoteBonusPerCell: 0.6,
  discoveryXpRemoteBonusMax: 8,
} as const;
