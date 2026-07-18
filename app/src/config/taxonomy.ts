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

/**
 * Feature trinity by ORIGIN (director 2026-07-18): the changed world is as
 * much the catalogue as the residue, so large features sort in one glance —
 * WROUGHT = shaped by human hands (buildings, roads, ruins); WILD = the
 * world's own work (rivers, hills, groves — the majority, 10,000 years on);
 * OTHER = made by neither (animal architecture, the collective's structures,
 * the unexplained — rare by design). Replaced the function trinity
 * HEARTH/ROAD/TEMPLE same-day; the sacred-ground respect stance re-anchors
 * to OSM POI tags when the interest-point module lands.
 */
export const FEATURE_TYPES = ['WROUGHT', 'WILD', 'OTHER'] as const;

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
  WROUGHT: {
    text: 'Wrought: first attested. Your kind rearranged the world at the scale of the world. Ten thousand years have taken most of it back. The outlines remain.',
    mood: 'neutral',
  },
  WILD: {
    text: 'Wild: first attested. The world’s own work — older than the record, indifferent to it. It is the majority now.',
    mood: 'curious',
  },
  OTHER: {
    text: 'Other: first attested. Not your kind’s making, and not the world’s. The record has no third column. I have opened one.',
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
  WROUGHT: 29,
  WILD: 47,
  OTHER: 2,
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
