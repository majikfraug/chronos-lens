import type { VoiceMood } from '../audio/engine';

/**
 * The game taxonomy and the companion's classification lines, ported from
 * prototypes/chronos-lens-v1.html. All lines are voice-spec canon (docs/
 * voice-spec.md): observation/measurement register, no contractions.
 */

export type Scale = 'ARTIFACT' | 'FEATURE';

/**
 * The base taxonomy is deliberately ancient and simple (director,
 * 2026-07-11): the parlor-game trinity the companion recovered from the
 * records — ANIMAL, VEGETABLE, MINERAL. Everything fits (a bottle is
 * mineral; a shoe is animal or vegetable or mineral depending on its
 * making — the ambiguity is the conversation). Depth comes from the
 * player's own "+ NEW CATEGORY" definitions, so the taxonomy grows the
 * way the relationship does. Detailed 2026-07-08-era categories retired.
 */
export const ARTIFACT_TYPES = ['ANIMAL', 'VEGETABLE', 'MINERAL'] as const;

export const FEATURE_TYPES = ['DWELLING SITE', 'LABOR SITE', 'HOLY SITE', 'TRANSIT WAY'] as const;

export const ALL_TYPES: readonly string[] = [...ARTIFACT_TYPES, ...FEATURE_TYPES];

/**
 * Open string, not a union: the player can define categories of their own
 * (local-first version of v2's emergent-type consensus — see docs/future.md).
 */
export type TypeName = string;

export type CustomType = { name: TypeName; scale: Scale };

export function poolForScale(scale: Scale, customTypes: CustomType[] = []): TypeName[] {
  const builtIn = scale === 'ARTIFACT' ? ARTIFACT_TYPES : FEATURE_TYPES;
  return [...builtIn, ...customTypes.filter((c) => c.scale === scale).map((c) => c.name)];
}

/** First ~N scans: the companion has no model and the player identifies. Brief §2.3. */
export const TEACH_PHASE = 3;

export type CompanionLine = { text: string; mood: VoiceMood };

export const TEACH_PROMPT_FIRST: CompanionLine = {
  text: 'No classification model exists for this form. The records preserve one old system of your kind: animal, vegetable, mineral. Identify it. Your identification becomes the model.',
  mood: 'curious',
};

export const TEACH_PROMPT_LATER: CompanionLine = {
  text: 'Model insufficient. Identify the form. I am learning the taxonomy from you.',
  mood: 'curious',
};

// Scan acknowledgment pools moved to src/companion/corpus.ts (M4): the brain
// owns event-response lines; taxonomy keeps only per-type content.

/** First attestation of a category the player invented. */
export const CUSTOM_TYPE_FIRST: CompanionLine = {
  text: '{T}: first attested. This category does not exist in my taxonomy. It exists in yours. The taxonomy is now partly yours. Recorded.',
  mood: 'curious',
};

/** First-of-type reflections — the companion wonders about the CATEGORY. */
export const TYPE_FIRST: Partial<Record<TypeName, CompanionLine>> = {
  ANIMAL: {
    text: 'Animal: first attested. That which moved of its own will. The record is loudest about these, and kept the fewest.',
    mood: 'somber',
  },
  VEGETABLE: {
    text: 'Vegetable: first attested. That which grew in place, asked nothing, and outlasted everything that hurried.',
    mood: 'curious',
  },
  MINERAL: {
    text: 'Mineral: first attested. That which neither grew nor chose — and yet your kind shaped it into nearly everything else. Most of what remains is this.',
    mood: 'curious',
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
export const SIMULATED_PUBLIC_COUNTS: Partial<Record<TypeName, number>> = {
  ANIMAL: 57,
  VEGETABLE: 64,
  MINERAL: 71,
  'DWELLING SITE': 14,
  'LABOR SITE': 9,
  'HOLY SITE': 12,
  'TRANSIT WAY': 3,
};

/** Proposal from taught counts — the model IS the player's teaching (brief §2.3). */
export function proposeType(
  scale: Scale,
  taughtCounts: Partial<Record<TypeName, number>>,
  customTypes: CustomType[] = []
): { type: TypeName; confidence: number } {
  const pool = poolForScale(scale, customTypes);
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
