import type { VoiceMood } from '../audio/engine';

/**
 * The game taxonomy and the companion's classification lines, ported from
 * prototypes/chronos-lens-v1.html. All lines are voice-spec canon (docs/
 * voice-spec.md): observation/measurement register, no contractions.
 */

export type Scale = 'ARTIFACT' | 'FEATURE';

export const ARTIFACT_TYPES = [
  'DOMESTIC',
  'STRUCTURAL',
  'RITUAL',
  'LABOR',
  'NATURAL',
  'ENTERTAINMENT',
] as const;

export const FEATURE_TYPES = ['DWELLING SITE', 'LABOR SITE', 'HOLY SITE', 'TRANSIT WAY'] as const;

export const ALL_TYPES = [...ARTIFACT_TYPES, ...FEATURE_TYPES];

export type TypeName = (typeof ALL_TYPES)[number];

export function poolForScale(scale: Scale): readonly TypeName[] {
  return scale === 'ARTIFACT' ? ARTIFACT_TYPES : FEATURE_TYPES;
}

/** First ~N scans: the companion has no model and the player identifies. Brief §2.3. */
export const TEACH_PHASE = 3;

export type CompanionLine = { text: string; mood: VoiceMood };

export const TEACH_PROMPT_FIRST: CompanionLine = {
  text: 'No classification model exists for this form. My records predate nothing of your world. Identify it. Your identification becomes the model.',
  mood: 'curious',
};

export const TEACH_PROMPT_LATER: CompanionLine = {
  text: 'Model insufficient. Identify the form. I am learning the taxonomy from you.',
  mood: 'curious',
};

export const ACK_TEACH: CompanionLine[] = [
  { text: 'Recorded: {T}. First attested example. The model begins with you.', mood: 'curious' },
  { text: '{T}. Filed. Model updated from your identification.', mood: 'neutral' },
  {
    text: 'Recorded: {T}. Query held for later: how did you know at a glance what I could not compute?',
    mood: 'curious',
  },
];

export const ACK_CONFIRM: CompanionLine[] = [
  { text: 'Filed. Confidence reinforced.', mood: 'neutral' },
  { text: 'Classification holds. Filed.', mood: 'neutral' },
];

export const ACK_CORRECT: CompanionLine[] = [
  { text: 'Corrected: {T}. Your correction outweighs the reading. Adjusting.', mood: 'neutral' },
  {
    text: 'Corrected: {T}. Noted: my taxonomy lacked a distinction you saw at once.',
    mood: 'curious',
  },
  { text: 'Corrected: {T}. The model is yours as much as mine now.', mood: 'warm' },
];

/** First-of-type reflections — the companion wonders about the CATEGORY. */
export const TYPE_FIRST: Partial<Record<TypeName, CompanionLine>> = {
  DOMESTIC: {
    text: 'Domestic: first attested. Objects of daily use. The records say these were the most numerous things your kind made, and the least often kept. Noted.',
    mood: 'neutral',
  },
  RITUAL: {
    text: 'Ritual: first attested. An object with no survival function, retained regardless. My models fail at this category. I will be watching it.',
    mood: 'curious',
  },
  ENTERTAINMENT: {
    text: 'Entertainment: first attested. Your kind made objects whose sole function was delight. Query, held open: why did a species under pressure spend effort on delight?',
    mood: 'curious',
  },
  LABOR: {
    text: 'Labor: first attested. Implements of work. The records preserve the implements in detail and the workers as quantities. Observed.',
    mood: 'somber',
  },
  STRUCTURAL: {
    text: 'Structural: first attested. That which bore weight. Every structure in the record outlived its builders, then failed regardless.',
    mood: 'neutral',
  },
  NATURAL: {
    text: 'Natural: first attested. That which the ground kept of its own accord, at no cost, asking nothing.',
    mood: 'neutral',
  },
  'HOLY SITE': {
    text: 'Holy site: first attested. Ground set apart. Approaching such positions at reduced intensity, as a precaution. The precaution is mine.',
    mood: 'somber',
  },
  'DWELLING SITE': {
    text: 'Dwelling site: first attested. Where your kind lived in proximity by election.',
    mood: 'neutral',
  },
  'LABOR SITE': {
    text: 'Labor site: first attested. Where the many sustained the cost.',
    mood: 'somber',
  },
  'TRANSIT WAY': {
    text: 'Transit way: first attested. Your kind built lines across the land to reach one another. Reaching one another appears to have been the majority of the record.',
    mood: 'curious',
  },
};

/**
 * "Recorded by others" counts shown in the Reliquary. SIMULATED LOCALLY —
 * v1 has no backend and these are authored constants, per brief §2.4 which
 * requires labeling this mechanism honestly. Real aggregation is v2.
 */
export const SIMULATED_PUBLIC_COUNTS: Record<TypeName, number> = {
  DOMESTIC: 44,
  STRUCTURAL: 26,
  RITUAL: 37,
  LABOR: 29,
  NATURAL: 61,
  ENTERTAINMENT: 22,
  'DWELLING SITE': 14,
  'LABOR SITE': 9,
  'HOLY SITE': 12,
  'TRANSIT WAY': 3,
};

/** Proposal from taught counts — the model IS the player's teaching (brief §2.3). */
export function proposeType(
  scale: Scale,
  taughtCounts: Partial<Record<TypeName, number>>
): { type: TypeName; confidence: number } {
  const pool = poolForScale(scale);
  const weights = pool.map((t) => 1 + (taughtCounts[t] ?? 0) * 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let picked: TypeName = pool[0];
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      picked = pool[i];
      break;
    }
  }
  const confidence = Math.min(0.92, 0.3 + (taughtCounts[picked] ?? 0) * 0.13);
  return { type: picked, confidence };
}
