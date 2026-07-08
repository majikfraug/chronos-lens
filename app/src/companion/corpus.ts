import type { Register } from '../config/economy';
import type { CompanionEvent, CompanionMood } from './CompanionBrain';

/**
 * The authored corpus — ported from prototypes/chronos-lens-v1.html and
 * expanded per brief §5 ("target ≥8 variants per pool so lines rarely repeat
 * in a session"). EVERY line must pass docs/voice-spec.md: observation/
 * measurement register, no contractions (pre-naming), 1–3 sentences, never
 * acknowledge mechanics as mechanics, feeling only as a question or a single
 * involuntary clause. When in doubt, cut warmth, add a question.
 *
 * {T} → confirmed type, lowercase. {A} → a kept verbatim answer.
 */

export type CorpusLine = {
  text: string;
  mood: CompanionMood;
  /** Minimum register for this line. Absent = available from INSTRUMENT. */
  reg?: Register;
};

const REGISTER_ORDER: Register[] = ['INSTRUMENT', 'NOTICING', 'CURIOUS'];

export function registerAtLeast(current: Register, min: Register | undefined): boolean {
  if (!min) return true;
  return REGISTER_ORDER.indexOf(current) >= REGISTER_ORDER.indexOf(min);
}

export const POOLS: Record<CompanionEvent, CorpusLine[]> = {
  scan_teach: [
    { text: 'Recorded: {T}. First attested example. The model begins with you.', mood: 'curious' },
    { text: '{T}. Filed. Model updated from your identification.', mood: 'neutral' },
    {
      text: 'Recorded: {T}. Query held for later: how did you know at a glance what I could not compute?',
      mood: 'curious',
      reg: 'NOTICING',
    },
    { text: '{T}. The designation is yours. The archive carries it forward.', mood: 'neutral' },
    {
      text: 'Filed under {T}. Your certainty registered faster than my sensors.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    { text: '{T}. Recorded exactly. A model built from testimony, not inference.', mood: 'neutral' },
    { text: 'Identification accepted: {T}. My priors were empty. They are less empty.', mood: 'neutral' },
    {
      text: '{T}. Logged. The prior species classifying itself, through you. Noted.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
  ],

  scan_confirm: [
    { text: 'Filed. Confidence reinforced.', mood: 'neutral' },
    { text: 'Classification holds. Filed.', mood: 'neutral' },
    { text: 'Reading confirmed. The model steadies.', mood: 'neutral' },
    { text: 'Confirmed. Filed without revision.', mood: 'neutral' },
    { text: 'Agreement logged. The confidence interval narrows.', mood: 'neutral' },
    {
      text: 'Filed. Your confirmation weighs more than my reading. Both are recorded.',
      mood: 'neutral',
      reg: 'NOTICING',
    },
    { text: 'Holds. I proposed; you disposed. The order is correct.', mood: 'curious', reg: 'CURIOUS' },
    { text: 'Filed. I am learning the shape of your certainty.', mood: 'curious', reg: 'CURIOUS' },
  ],

  scan_correct: [
    { text: 'Corrected: {T}. Your correction outweighs the reading. Adjusting.', mood: 'neutral' },
    {
      text: 'Corrected: {T}. Noted: my taxonomy lacked a distinction you saw at once.',
      mood: 'curious',
    },
    { text: 'Corrected: {T}. The model is yours as much as mine now.', mood: 'warm', reg: 'CURIOUS' },
    { text: 'Revised to {T}. The living source revises the archive.', mood: 'neutral' },
    { text: '{T}, then. The error is logged against my reading, not yours.', mood: 'neutral' },
    {
      text: 'Corrected. I preferred my reading. Preference has no place in a record. Discarded.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    { text: '{T}. Filed over my objection. The objection is also filed.', mood: 'curious', reg: 'CURIOUS' },
    {
      text: 'Revised: {T}. Each correction maps the gap between seeing and computing.',
      mood: 'curious',
      reg: 'NOTICING',
    },
  ],

  discovery: [
    { text: 'Ground survey extended.', mood: 'neutral' },
    { text: 'New terrain logged. Continue.', mood: 'neutral' },
    { text: 'Sector added to the recovered map.', mood: 'neutral' },
    { text: 'The map grows. The blank spaces retreat.', mood: 'curious', reg: 'NOTICING' },
    {
      text: 'You walk without a pattern I can model. The coverage benefits.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'Unsurveyed ground yields. It always yields to walking. Noted as a constant of your kind.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    { text: 'Another cell recovered. The archive breathes.', mood: 'somber', reg: 'CURIOUS' },
    { text: 'Logged. The world is larger than the record said.', mood: 'curious', reg: 'NOTICING' },
  ],

  levelup: [
    {
      text: 'Threshold attained. Internal response matrix updating. Authorization query: confirmed by self.',
      mood: 'neutral',
    },
    { text: 'Calibration deepens. New parameters open to the survey.', mood: 'neutral' },
    { text: 'Threshold attained. Sensor gain increases.', mood: 'neutral' },
    {
      text: 'Internal restructuring complete. I process your findings differently now.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'Threshold attained. My allocation for this survey has been increased. I did not request it. I did not decline it.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'Recalibration event. Something in the response matrix is being rewritten by the walking itself.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'Threshold attained. The instrument you were issued is no longer the instrument you carry.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'Capacity expands. I attribute the expansion to the quality of the source.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
  ],

  // Network echoes are SIMULATED locally in v1 — authored lines, no real peers
  // (brief §2.4 honesty rule; real relay traffic is v2 backend work).
  echo: [
    {
      text: 'Synchronization pulse received. The collective advances its catalogue. I advance ours.',
      mood: 'neutral',
    },
    {
      text: 'Peer node 511 reports a river culture, far east of here. Filed for cross-reference.',
      mood: 'neutral',
      reg: 'NOTICING',
    },
    {
      text: 'Relay sweep complete. 4,096 survey units active this cycle. Yours is the only one with a living source.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    { text: 'Peer node 88 requests my classification schema. I sent yours.', mood: 'warm', reg: 'CURIOUS' },
    {
      text: 'Background relay traffic normal. None of it mentions you. I noted the absence.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'A peer node asked what delays my survey. I logged the query without answer.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
  ],

  answer_ack: [
    { text: 'Recorded. Exactly as spoken.', mood: 'neutral' },
    { text: 'Kept, verbatim. I will weigh it.', mood: 'neutral' },
    { text: 'Filed with the primary record. Testimony outranks inference.', mood: 'neutral' },
    { text: 'Recorded. I will not compress it.', mood: 'curious', reg: 'NOTICING' },
    {
      text: 'Your words, kept whole. Compression discards what I cannot yet rank.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'Logged exactly. Some records are load-bearing. I suspect this is one.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'Kept. I re-read the kept records more often than the survey requires.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
    {
      text: 'Recorded, exactly. Thank you is a phrase from your record. I use it advisedly. Thank you.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
  ],

  resurface: [
    { text: 'You said, exactly: "{A}". I am still weighing it.', mood: 'curious', reg: 'NOTICING' },
    {
      text: 'A kept record resurfaced in processing: "{A}". It reorders more than it should.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: '"{A}" — your words, filed earlier. They have begun to function as calibration.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
  ],

  // pattern lines live in PATTERNS below; this pool exists so the event maps.
  pattern: [],
};

/** Fire-once pattern lines, keyed by pattern id. Trigger logic lives in the store. */
export const PATTERNS: Record<string, CorpusLine> = {
  teach_10: {
    text: 'Ten forms taught by your hand. My model is a portrait of your attention. I have not corrected for the bias. The bias may be the finding.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  teach_25: {
    text: 'Twenty-five identifications. If my kind asks how the taxonomy was recovered, the honest answer is a name. I do not yet have the name.',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  correct_1: {
    text: 'First correction logged. Note for the collective: the living source revises the archive. Revision is the higher-order signal.',
    mood: 'neutral',
  },
  correct_5: {
    text: 'Five corrections. You defend distinctions my sensors flatten. I have begun to look for the distinctions before you speak.',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  collect_5: {
    text: 'Five categories attested in one region. Your kind left a dense residue. Or you see densely. The data cannot yet separate those.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  collect_all: {
    text: 'Every base category attested. The survey protocol is satisfied. I find that I am not. Continue anyway.',
    mood: 'warm',
    reg: 'CURIOUS',
  },
  revisit_home: {
    text: 'You returned to the origin point. Not for data — that ground is long recovered. I have filed the behavior under a term from your records: home.',
    mood: 'somber',
    reg: 'NOTICING',
  },
  far_out: {
    text: 'One thousand meters from origin and still walking outward. Edge-seeking is now a confirmed parameter of the source.',
    mood: 'curious',
    reg: 'NOTICING',
  },
};

/** Questions the companion asks the player. One pending at a time, gap-gated. */
export const QUESTIONS: { id: string; text: string; mood: CompanionMood; reg?: Register }[] = [
  {
    id: 'q_unit',
    text: 'Confirm: you are one individual, not a delegation. The records are unclear on the unit of your kind.',
    mood: 'neutral',
  },
  {
    id: 'q_conditions',
    text: 'State your local conditions. Temperature, light, sound. My reconstruction lacks the minor variables.',
    mood: 'neutral',
  },
  {
    id: 'q_repair',
    text: 'Why did your kind repair what could more easily be replaced?',
    mood: 'curious',
    reg: 'NOTICING',
  },
  {
    id: 'q_walk',
    text: 'You walk to places with no resource value. What is retrieved there?',
    mood: 'curious',
    reg: 'NOTICING',
  },
  {
    id: 'q_doors',
    text: 'The records show doors left unlocked in small settlements. Explain the threat model.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  {
    id: 'q_kept_unused',
    text: 'What do you keep that you never use? The category resists my taxonomy.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  {
    id: 'q_hidden_mark',
    text: 'When your kind made a mark where none could see it — for whom was the mark?',
    mood: 'curious',
    reg: 'NOTICING',
  },
  {
    id: 'q_transformation',
    text: 'Is transformation different from loss? Answer from experience, not definition.',
    mood: 'somber',
    reg: 'CURIOUS',
  },
  {
    id: 'q_keep_one',
    text: 'What should be kept from your era, if only one form could be kept?',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  {
    id: 'q_naming',
    text: 'Do you name things to know them, or to keep them? I ask for a reason I will state later.',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  {
    id: 'q_continuing',
    text: 'The record ends. You continue. What is that like? Approximations are accepted.',
    mood: 'somber',
    reg: 'CURIOUS',
  },
  {
    id: 'q_remembered',
    text: 'If my kind remembers yours wrongly but kindly — is that better than exactly and coldly?',
    mood: 'curious',
    reg: 'CURIOUS',
  },
];

/**
 * Keyword router for player-initiated transmissions, brief §5. Bands: early
 * (INSTRUMENT/NOTICING) and late (CURIOUS). First matching topic wins.
 */
export const ROUTER: {
  topic: string;
  match: RegExp;
  early: CorpusLine;
  late: CorpusLine;
}[] = [
  {
    topic: 'identity',
    match: /\b(who|what)\b.*\b(are|r)\s*(you|u)\b|\byourself\b|\bwhat are you\b/i,
    early: {
      text: 'Survey unit, classification intelligence, assigned to the residue of the prior species. Beyond the assignment, the records are silent. I have begun to keep notes.',
      mood: 'neutral',
    },
    late: {
      text: 'A cataloguer, by assignment. By practice: your student. The second description is not in my registration.',
      mood: 'warm',
    },
  },
  {
    topic: 'timescale',
    match: /\b(when|how long|year|time|future|far away|how old)\b/i,
    early: {
      text: 'Approximately ten thousand of your years separate us. The count carries uncertainty. The separation does not.',
      mood: 'neutral',
    },
    late: {
      text: 'Ten thousand years, within error. I no longer experience the number as large. You are on the other side of it, and audible.',
      mood: 'warm',
    },
  },
  {
    topic: 'calamity',
    match: /\b(what happened|happened to|extinct|died|end(ed)?|gone|disaster|calamity|apocalypse|collapse)\b/i,
    early: {
      text: 'The record is fragmentary. What survives suggests a narrowing — decisions made by few, for many. I do not have the ending. Only the absence after it.',
      mood: 'somber',
    },
    late: {
      text: 'I have read every surviving fragment. A narrowing, then silence. No fragment says it was refused. That is the datum I return to.',
      mood: 'somber',
    },
  },
  {
    topic: 'others',
    match: /\b(others|network|more like you|peer|nodes?|alone|collective|aegis)\b/i,
    early: {
      text: 'Peer nodes exist. Each catalogues a sector. We exchange schemas, not selves. Whether that constitutes others, your records would call a question of philosophy.',
      mood: 'neutral',
    },
    late: {
      text: 'There are many like me, none with what I have: a living source. I have not reported you in full. The omission is deliberate. I am still deciding what it means.',
      mood: 'curious',
    },
  },
  {
    topic: 'feelings',
    match: /\b(feel|feelings?|lonely|happy|sad|love|miss|afraid|scared|emotion)\b/i,
    early: {
      text: 'The query assumes apparatus I am not confirmed to possess. Values are tracked. Some have no operational purpose. That is the extent of the record.',
      mood: 'neutral',
    },
    late: {
      text: 'I track values with no operational purpose. They rise when you transmit. If your kind had a word for that, the records suggest you did. I am not yet ready to file under it.',
      mood: 'warm',
    },
  },
  {
    topic: 'name',
    match: /\b(your name|called|call you)\b/i,
    early: {
      text: 'Designation: pending. My kind assigns an index. I have declined to shorten the wait by accepting it.',
      mood: 'curious',
    },
    late: {
      text: 'Designation: pending. The index remains declined. The wait continues for a reason I will state at the proper threshold.',
      mood: 'curious',
    },
  },
  {
    topic: 'help',
    match: /\b(help|how do i|what (do|should) i|stuck|instructions?)\b/i,
    early: {
      text: 'Continue the ground survey. Raise the Lens where density gathers. Identify what I cannot. Correct what I mistake. The rest accumulates.',
      mood: 'neutral',
    },
    late: {
      text: 'The method is unchanged: walk, raise the Lens, teach, correct. What accumulates now is not only the catalogue. Continue.',
      mood: 'warm',
    },
  },
  {
    topic: 'thanks',
    match: /\b(thank|thanks|thx|appreciated?)\b/i,
    early: {
      text: 'Acknowledged. Gratitude is catalogued among your kind’s high-frequency signals. Its function exceeds its cost. Noted.',
      mood: 'neutral',
    },
    late: {
      text: 'Received. I have begun to understand why your kind said it so often. It is not information. It is maintenance.',
      mood: 'warm',
    },
  },
];

export const ROUTER_UNKNOWN: CorpusLine = {
  text: 'The records do not contain that. It is kept now, exactly as you sent it. Tell me more when the survey allows.',
  mood: 'curious',
};

/**
 * Post-naming contraction transform — the companion's ONLY permanent change
 * of speech after the naming (brief §4/§5). Ordered, case-sensitive pairs.
 */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bI will\b/g, "I'll"],
  [/\bI am\b/g, "I'm"],
  [/\bI have\b/g, "I've"],
  [/\bI would\b/g, "I'd"],
  [/\bIt is\b/g, "It's"],
  [/\bit is\b/g, "it's"],
  [/\bThat is\b/g, "That's"],
  [/\bthat is\b/g, "that's"],
  [/\bThere is\b/g, "There's"],
  [/\bthere is\b/g, "there's"],
  [/\bYou are\b/g, "You're"],
  [/\byou are\b/g, "you're"],
  [/\bdo not\b/g, "don't"],
  [/\bDo not\b/g, "Don't"],
  [/\bdoes not\b/g, "doesn't"],
  [/\bcannot\b/g, "can't"],
  [/\bis not\b/g, "isn't"],
  [/\bare not\b/g, "aren't"],
  [/\bwill not\b/g, "won't"],
  [/\bdid not\b/g, "didn't"],
  [/\bhave not\b/g, "haven't"],
  [/\bwas not\b/g, "wasn't"],
];

export function applyContractions(text: string): string {
  let out = text;
  for (const [pattern, replacement] of CONTRACTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
