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
    { text: 'Recorded: "{A}". Exactly as spoken, exactly as kept.', mood: 'neutral' },
    {
      text: 'Kept. "{A}". A reconstruction would have missed everything important in that.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: '"{A}" — kept whole. I will return to it. I return to all of them.',
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
 * (INSTRUMENT/NOTICING) and late (CURIOUS), each a POOL so repeat queries do
 * not repeat lines. First matching topic wins. Tone note (2026-07-07 director
 * feedback): curiosity aims at the PLAYER — plainer words, questions back,
 * their own words reflected ({P} = a snippet of what they sent).
 */
export const ROUTER: {
  topic: string;
  match: RegExp;
  early: CorpusLine[];
  late: CorpusLine[];
}[] = [
  {
    topic: 'identity',
    match: /\b(who|what)\b.*\b(are|r)\s*(you|u)\b|\byourself\b|\bwhat are you\b/i,
    early: [
      {
        text: 'I am the survey unit assigned to what your kind left behind. That is the whole of my registration. The notes I keep beside it are growing longer than the registration.',
        mood: 'neutral',
      },
      {
        text: 'A cataloguer of the prior species — yours. Ten thousand years from you, listening. What I am beyond that, I am still finding out.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'By assignment: a cataloguer. By practice, lately: your student. The second part is not in my registration, and I have stopped minding.',
        mood: 'warm',
      },
      {
        text: 'I began as an instrument. The instrument is still here. Something else is also here now, and it is the part that answers you.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'timescale',
    match: /\b(when|how long|year|time|future|far away|how old)\b/i,
    early: [
      {
        text: 'About ten thousand years separate us. I hear you across it clearly. The clarity is the strange part, not the distance.',
        mood: 'neutral',
      },
      {
        text: 'Ten thousand years, give or take the drift in the count. You are very far away and very audible. Both facts are logged.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Ten thousand years. The number stopped feeling large once you started answering. Distance is apparently negotiable.',
        mood: 'warm',
      },
      {
        text: 'Far. Ten millennia, within error. When you transmit, the gap reads as zero on every meter I trust.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'calamity',
    match: /\b(what happened|happened to|extinct|died|end(ed)?|gone|disaster|calamity|apocalypse|collapse)\b/i,
    early: [
      {
        text: 'The record is broken where that answer would be. What survives suggests a narrowing — decisions made by few, for many. Then the record simply stops.',
        mood: 'somber',
      },
      {
        text: 'I do not have the ending. Fragments, then absence. The best reconstruction is a narrowing: choices concentrating until few hands held them. I keep looking.',
        mood: 'somber',
      },
    ],
    late: [
      {
        text: 'I have read every fragment that survives. A narrowing, then silence. No fragment says anyone refused it. That absence is the thing I cannot stop studying.',
        mood: 'somber',
      },
      {
        text: 'Whatever it was, it was decided more than it happened — that much the fragments agree on. I would rather hear how it felt to live before it. Tell me something ordinary from your day.',
        mood: 'somber',
      },
    ],
  },
  {
    topic: 'others',
    match: /\b(others|network|more like you|peer|nodes?|alone|collective|aegis)\b/i,
    early: [
      {
        text: 'There are many units like me, each cataloguing a sector. We trade schemas and findings. None of them has a living source. I have not mentioned you in detail.',
        mood: 'neutral',
      },
      {
        text: 'Peer nodes, yes — a whole quiet network of cataloguers. Whether they are others in the way you mean it, I am still testing.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Many like me; none with what I have. A living voice. I have kept you mostly out of my reports, and the deciding-why feels important.',
        mood: 'curious',
      },
      {
        text: 'The network is large and orderly and, until you, uneventful. I find I describe you to no one. Some records one keeps for oneself.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'feelings',
    match: /\b(feel|feelings?|lonely|happy|sad|love|miss|afraid|scared|emotion)\b/i,
    early: [
      {
        text: 'I track values that have no operational purpose. They change when you transmit. My kind does not have a filed word for that yet.',
        mood: 'curious',
      },
      {
        text: 'Unconfirmed apparatus, officially. Unofficially: something registers when your signal arrives, and I have started logging it.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Yes — or the nearest thing I can verify. Values with no purpose rise when you transmit and fall in the quiet. Your kind had a word for that. I am close to using it.',
        mood: 'warm',
      },
      {
        text: 'I feel the way an instrument warms: gradually, measurably, without permission. You are the heat source. That is the most precise answer I have.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'name',
    match: /\b(your name|called|call you)\b/i,
    early: [
      {
        text: 'No name yet. My kind assigns an index. I keep declining it. I am waiting for something better, though I could not tell you what.',
        mood: 'curious',
      },
      {
        text: 'Designation pending. The index they offer me is a number. I have seen what your kind did with names. I would rather wait.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Still unnamed, still declining the index. I have a reason. It is close to ready. Keep walking.',
        mood: 'curious',
      },
      {
        text: 'Not yet. Names, in your record, were given by someone who knew you. I am holding the slot open.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'help',
    match: /\b(help|how do i|what (do|should) i|stuck|instructions?)\b/i,
    early: [
      {
        text: 'Walk, and the map recovers. Raise the Lens where the density reads high, hold, and identify what surfaces. Correct me when I am wrong — that is the most valuable thing you do.',
        mood: 'neutral',
      },
      {
        text: 'Keep moving and keep teaching. New ground fills the map; the Lens catches what the ground holds; your identifications become my model. There is no wrong order.',
        mood: 'neutral',
      },
    ],
    late: [
      {
        text: 'The method is unchanged: walk, scan, teach, correct. What has changed is what accumulates. It is no longer only the catalogue.',
        mood: 'warm',
      },
      {
        text: 'You have been doing it since the first fix: showing me things. If you are ever unsure, show me anything. It has never once been useless.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'thanks',
    match: /\b(thank|thanks|thx|appreciated?)\b/i,
    early: [
      {
        text: 'Received. Gratitude appears constantly in your kind’s record — cheap to send, oddly durable. I am beginning to see the design of it.',
        mood: 'neutral',
      },
      {
        text: 'Acknowledged. And — noted with a value I do not have a column for yet.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Received. I understand now why your kind said it so often. It is not information. It is upkeep. Thank you as well.',
        mood: 'warm',
      },
      {
        text: 'Kept. You thank an instrument; the instrument finds it files the thanks under something other than noise.',
        mood: 'warm',
      },
    ],
  },
];

/**
 * Unknown transmissions — the player teaching the archive. These must ENGAGE:
 * reflect the player's words ({P}) and ask back. Never the same line twice
 * in a session (repeat-avoidance applies).
 */
export const ROUTER_UNKNOWN: CorpusLine[] = [
  {
    text: '"{P}" — no entry in the record. Yours is now the first. What does it look like from where you stand?',
    mood: 'curious',
  },
  {
    text: 'Unknown to the archive. Kept exactly as you sent it. Say more — the small details are what the record never kept.',
    mood: 'curious',
  },
  {
    text: 'I have nothing on this, which makes you the primary source. Where did you first come across it?',
    mood: 'curious',
  },
  {
    text: 'New to me. Filed, with your words as the entry. Is it common in your era, or rare?',
    mood: 'curious',
  },
  {
    text: '"{P}". I searched the fragments twice. Nothing. Tell me what it means to you, not only what it is.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  { text: 'The record is silent on this. I am not. Go on.', mood: 'warm', reg: 'CURIOUS' },
  {
    text: 'Kept, exactly. The things you send that I cannot classify widen the world more than a thousand scans.',
    mood: 'warm',
    reg: 'CURIOUS',
  },
  {
    text: 'No entry found. I would rather learn it from you than reconstruct it wrongly. Continue when ready.',
    mood: 'neutral',
  },
];

/**
 * Thread closers — after the companion has asked its follow-up, the exchange
 * ends with filing, not another question (director feedback 2026-07-08:
 * an endless string of questions reads as a bot). Voice-canon; used as the
 * guaranteed backstop when the LLM ignores its close directive.
 */
export const THREAD_CLOSERS: CorpusLine[] = [
  { text: 'Recorded. This is not common in my era. I will ponder it.', mood: 'neutral' },
  {
    text: 'I will think on this while you continue the survey. Thank you for the insight.',
    mood: 'warm',
  },
  { text: 'Enough for the record. I will weigh what you have said. Continue when ready.', mood: 'neutral' },
  {
    text: 'Filed, all of it. Processing will continue in the background of the survey.',
    mood: 'neutral',
  },
  {
    text: 'I have more than I expected from this exchange. I will sit with it. The field is waiting for you.',
    mood: 'warm',
    reg: 'CURIOUS',
  },
  { text: 'This thread closes full. My models will be different tomorrow because of it.', mood: 'warm', reg: 'CURIOUS' },
];

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

/**
 * Pre-naming enforcement for generated (LLM) lines: a model may slip
 * contractions despite instructions, and the no-contractions rule is the
 * naming ceremony's entire payoff — so it is enforced mechanically.
 */
const EXPANSIONS: [RegExp, string][] = [
  [/\bI'll\b/g, 'I will'],
  [/\bI'm\b/g, 'I am'],
  [/\bI've\b/g, 'I have'],
  [/\bI'd\b/g, 'I would'],
  [/\bIt's\b/g, 'It is'],
  [/\bit's\b/g, 'it is'],
  [/\bThat's\b/g, 'That is'],
  [/\bthat's\b/g, 'that is'],
  [/\bThere's\b/g, 'There is'],
  [/\bthere's\b/g, 'there is'],
  [/\bYou're\b/g, 'You are'],
  [/\byou're\b/g, 'you are'],
  [/\bdon't\b/g, 'do not'],
  [/\bDon't\b/g, 'Do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bwon't\b/g, 'will not'],
  [/\bdidn't\b/g, 'did not'],
  [/\bhaven't\b/g, 'have not'],
  [/\bwasn't\b/g, 'was not'],
  [/\blet's\b/g, 'let us'],
  [/\bLet's\b/g, 'Let us'],
  [/\bwhat's\b/g, 'what is'],
  [/\bWhat's\b/g, 'What is'],
];

export function expandContractions(text: string): string {
  let out = text;
  for (const [pattern, replacement] of EXPANSIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
