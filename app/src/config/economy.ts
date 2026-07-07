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

/** register = f(level*4 + attunement): <30 INSTRUMENT, <72 NOTICING, else CURIOUS. Brief §4. */
export function registerFor(level: number, attunement: number): Register {
  const score = level * 4 + attunement;
  if (score < 30) return 'INSTRUMENT';
  if (score < 72) return 'NOTICING';
  return 'CURIOUS';
}

/** Scan/classification rewards, brief §4 (prototype confirmScan values). */
export const SCAN = {
  xpArtifact: 13,
  xpFeature: 15,
  xpTeachBonus: 3,
} as const;

/** Field map / discovery, brief §2.1 and §4. */
export const FIELD = {
  /** Coarse discovery-accounting cell size, meters. Brief §4 "heat economy: ~100m cells". */
  cellSizeM: 100,
  /** Feathered reveal radius around the player's real position. Brief §2.1 "~90m". */
  revealRadiusM: 90,
  /** Grid the fog-of-war reveal history is snapped to for storage/de-dup — finer than cellSizeM so the feathered reveal reads as continuous. */
  revealSnapM: 20,
  /** Base discovery XP for a newly-revealed non-site field cell. */
  discoveryXpBase: 8,
  /** Extra XP per cell of distance from home, capped — remote cells are worth more. */
  discoveryXpRemoteBonusPerCell: 0.6,
  discoveryXpRemoteBonusMax: 8,
} as const;
