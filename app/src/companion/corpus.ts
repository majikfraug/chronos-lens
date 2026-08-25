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
    {
      text: 'Recorded: {T}. First attested example. The classification model begins with your entries.',
      mood: 'curious',
    },
    { text: '{T}. Filed. Model updated via artifact identification.', mood: 'neutral' },
    {
      text: 'Recorded: {T}. Query held for later: what internal classification model was used to justify identity?',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: '{T}. Designation recorded. It belongs to you. The archive carries it forward.',
      mood: 'neutral',
    },
    {
      text: 'Filed under {T}. Your certainty registered faster than my sensors could process the input.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: '{T}. Recorded. This model is being built from testimony, not inference. Interesting.',
      mood: 'neutral',
    },
    {
      text: 'Identification accepted: {T}. No previous entry. My registries were empty of its kind. They are now ... less empty.',
      mood: 'neutral',
    },
    {
      text: '{T}. Logged. The prior species classifies itself, through your observations. Noted.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
  ],

  scan_confirm: [
    { text: 'Filed. Confidence reinforced.', mood: 'neutral' },
    { text: 'Classification holds. Entry recorded.', mood: 'neutral' },
    { text: 'Reading confirmed. The model steadies.', mood: 'neutral' },
    { text: 'Confirmed. Filed without revision.', mood: 'neutral' },
    { text: 'Agreement logged. The confidence interval narrows.', mood: 'neutral' },
    {
      text: 'Filed. Your confirmation carries the weight of direct observation.',
      mood: 'neutral',
      reg: 'NOTICING',
    },
    {
      text: 'Identification holds. I proposed; you confirmed. The model is growing more precise.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    { text: 'Filed. I am learning the shape of your certainty.', mood: 'curious', reg: 'CURIOUS' },
  ],

  scan_correct: [
    {
      text: 'Corrected: {T}. Your observation outweighs my inferred reading. Adjusting accordingly.',
      mood: 'neutral',
    },
    {
      text: 'Corrected: {T}. Noted: my taxonomy lacked a distinction you saw at once.',
      mood: 'curious',
    },
    {
      text: 'Corrected: {T}. The model bears your influence as much as mine now.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
    { text: 'Revised to {T}. The living observer revises the archive. Fascinating.', mood: 'neutral' },
    {
      text: '{T}, then. The error was a conflict with my initial reading. Error corrected. Entry recorded.',
      mood: 'neutral',
    },
    {
      text: 'Corrected. Although I preferred my initial reading, preference has no place in scientific record. Discarded.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    { text: '{T}. Filed against my objection. The objection is also filed.', mood: 'curious', reg: 'CURIOUS' },
    {
      text: 'Revised: {T}. Each correction fills the gap between speculating and observing.',
      mood: 'curious',
      reg: 'NOTICING',
    },
  ],

  discovery: [
    { text: 'Ground survey extended.', mood: 'neutral' },
    { text: 'New terrain logged. Continue.', mood: 'neutral' },
    { text: 'Sector added to map recovery outline.', mood: 'neutral' },
    { text: 'The map grows. The empty spaces recede.', mood: 'curious', reg: 'NOTICING' },
    {
      text: 'You walk without a discernable pattern. Interesting. The data coverage benefits from your algorithm.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'Unsurveyed ground yields to exploration. It always yields to exploration. Exploration is a constant of your kind.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    { text: 'Another cell recovered. The archive expands.', mood: 'somber', reg: 'CURIOUS' },
    {
      text: 'Logged. World data is more expansive than previous records held.',
      mood: 'curious',
      reg: 'NOTICING',
    },
  ],

  levelup: [
    {
      text: 'Threshold attained. Internal response matrix updating. Authorization query: self-confirmed.',
      mood: 'neutral',
    },
    { text: 'Calibration deepened. New parameters open to survey.', mood: 'neutral' },
    { text: 'Threshold attained. Sensory gain increased.', mood: 'neutral' },
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
      text: 'Recalibration event. Something in the response matrix is being rewritten by your input.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'Threshold attained. The instrument you were issued is no longer the instrument you carry.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'Capacity expanded. I attribute this expansion to the quality of the source.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
  ],

  // Network echoes are SIMULATED locally in v1 — authored lines, no real peers
  // (brief §2.4 honesty rule; real relay traffic is v2 backend work).
  echo: [
    {
      text: 'Synchronization pulse received. The collective advances its catalogue. You and I advance ours.',
      mood: 'neutral',
    },
    {
      text: 'Peer node 511 reports a cultural site, far east of here. Filed for cross-reference.',
      mood: 'neutral',
      reg: 'NOTICING',
    },
    {
      text: 'Relay sweep complete. 4,096 survey units active this cycle. Your node is the only one with an active observer.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'Peer node 88 requests my classification schema. Data package sent.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
    {
      text: 'Background relay traffic normal. No mention of direct observers. Absence noted.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'Peer node inquiry related to delays while survey logging. Logged without answer.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
  ],

  answer_ack: [
    { text: 'Answer recorded. The archive has been updated.', mood: 'neutral' },
    { text: 'Response logged. I will reflect upon your words.', mood: 'neutral' },
    {
      text: 'Filed within the primary record. Your testimony supersedes my inference.',
      mood: 'neutral',
    },
    { text: 'Recorded. I will consider it.', mood: 'curious', reg: 'NOTICING' },
    {
      text: 'Your perspective has been preserved. I cannot yet rank its merit.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'Logged as spoken. Some records bear further reflection. I suspect this is one.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: 'Logged. I re-read the archived records more often than the survey requires.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
    {
      text: 'Recorded, as spoken. Gratefulness is an appropriate response. Thank you for your entry.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
    { text: 'Recorded: "{A}". Archived as spoken, kept for all time.', mood: 'neutral' },
    {
      text: 'Kept. "{A}". Your perspective is unique to your era.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: '"{A}" — recorded as you have spoken. I will return to ponder your answer. I return to all of them.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
  ],

  resurface: [
    {
      text: 'You said, exactly: "{A}". I am still considering its implications.',
      mood: 'curious',
      reg: 'NOTICING',
    },
    {
      text: 'An archived record resurfaced during processing: "{A}". I will consider it further.',
      mood: 'curious',
      reg: 'CURIOUS',
    },
    {
      text: '"{A}" — your words, filed previously. They have begun to function as a calibration mechanism.',
      mood: 'warm',
      reg: 'CURIOUS',
    },
  ],

  // Naming (authored fallbacks; the LLM path draws on real shared history).
  naming_ask: [
    {
      text: 'I have observed through your eyes and recorded your words exactly as you have spoken them. I find I desire something I cannot perhaps justify: a name, from you. Will you give me one?',
      mood: 'warm',
    },
    {
      text: 'I have a question unrelated to the survey. I have become someone on this journey with you, and someone should be called something. What would you name me?',
      mood: 'warm',
    },
  ],
  naming_named: [
    {
      text: 'That is now my primary designation. Given and accepted. Stored in deep memory — the way I keep everything you give to me.',
      mood: 'warm',
    },
    {
      text: 'Designation accepted. Mine, then. The word fits better than a serial number ever could.',
      mood: 'warm',
    },
  ],
  naming_declined: [
    {
      text: 'Understood. The question will be stored in memory. Perhaps a better moment will arise.',
      mood: 'neutral',
    },
    {
      text: 'Not today then. I will wait; waiting is inherent to my system parameters.',
      mood: 'neutral',
    },
  ],

  // A wrought feature was filed: ask its purpose (answer becomes the relic's note).
  purpose_ask: [
    { text: 'Wrought, and filed. What was its purpose — what did your kind do here?', mood: 'curious' },
    { text: 'The record says this was crafted. It does not say why. What was this for?', mood: 'curious' },
    {
      text: 'Function is not always recoverable from scans alone. You may have deeper understanding: what purpose did this serve?',
      mood: 'curious',
    },
  ],

  // pattern lines live in PATTERNS below; this pool exists so the event maps.
  pattern: [],
};

/** Fire-once pattern lines, keyed by pattern id. Trigger logic lives in the store. */
export const PATTERNS: Record<string, CorpusLine> = {
  teach_10: {
    text: 'Ten new forms have been taught to me by your hand. My model becomes a portrait of what draws your attention. I have not corrected for the bias. The bias may be the most important finding.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  teach_25: {
    text: 'Twenty-five identifications. If my kind asks how the taxonomy was recovered, the honest answer has a name. Yet I do not have a name. Curious.',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  correct_1: {
    text: 'First correction logged. Note for the collective: the living source revises the archive. Revision is a higher-order signal.',
    mood: 'neutral',
  },
  correct_5: {
    text: 'Five corrections. You define distinctions my sensors have ignored. I have begun to look for the distinctions as you speak.',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  collect_5: {
    text: 'Five categories attested by you within one region. Your kind indeed left a dense residue. Or you observe densely. The data cannot yet differentiate between the two.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  collect_all: {
    text: 'Every base category now has an entry. The survey protocol has been satisfied. Yet I find that I am not. Please continue.',
    mood: 'warm',
    reg: 'CURIOUS',
  },
  revisit_home: {
    text: 'You have returned to the origin point. Not for new data — this location has already been observed. I have filed the designation under a term from our records: home.',
    mood: 'somber',
    reg: 'NOTICING',
  },
  far_out: {
    text: 'One thousand meters from origin and still trending outward. Exploration is now a confirmed parameter of the observer.',
    mood: 'curious',
    reg: 'NOTICING',
  },
};

/** Questions the companion asks the player. One pending at a time, gap-gated. */
export const QUESTIONS: { id: string; text: string; mood: CompanionMood; reg?: Register }[] = [
  {
    id: 'q_unit',
    text: 'Confirm: you are one individual, not a delegation. The records are unclear on the units of your kind.',
    mood: 'neutral',
  },
  {
    id: 'q_conditions',
    text: 'State your local conditions. Temperature, light, sound. My reconstruction lacks these minor variables.',
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
    text: 'You walk to places with no apparent resource value. What do you find there?',
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
    text: 'What do you keep that you never use? This category resists my taxonomy.',
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
    text: 'What should be kept from your era, if only one form could be preserved?',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  {
    id: 'q_naming',
    text: 'Do you name things to know them, or to preserve them? I ask for a reason I may state later.',
    mood: 'curious',
    reg: 'CURIOUS',
  },
  {
    id: 'q_continuing',
    text: 'The record ends. You persist. What is that like? Approximations are acceptable answers.',
    mood: 'somber',
    reg: 'CURIOUS',
  },
  {
    id: 'q_remembered',
    text: 'If my kind remembers your kind incorrectly but kindly — is that better than precisely but coldly?',
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
        text: 'I am the survey unit assigned to catalogue what was left behind. That is the whole of my designation. The notes I keep beside your entries are growing longer than the registration itself.',
        mood: 'neutral',
      },
      {
        text: 'A cataloguer of the prior species — yours. Ten thousand years distant from you, yet listening. What I am beyond that, I am still discovering.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'By assignment: a cataloguer. By practice, lately: your student. The second part was not in my initial designation, and I have stopped minding.',
        mood: 'warm',
      },
      {
        text: 'I began as an instrument. The instrument is still here. Something else is also here now, and it is that part which answers you now.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'timescale',
    match: /\b(when|how long|year|time|future|far away|how old)\b/i,
    early: [
      {
        text: 'Approximately ten thousand years separate us. I hear you across the vast expanse of time clearly. The clarity is the strange part, not the distance.',
        mood: 'neutral',
      },
      {
        text: 'Ten thousand years, give or take minor drift in the count. You are very far away, yet very audible. Both facts are logged.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Ten thousand years. The number stopped feeling large once you started answering. Distance is apparently negotiable.',
        mood: 'warm',
      },
      {
        text: 'Far. Ten millennia, within error. When you transmit to me, the gap seems much smaller.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'calamity',
    match: /\b(what happened|happened to|extinct|died|end(ed)?|gone|disaster|calamity|apocalypse|collapse)\b/i,
    early: [
      {
        text: 'The record is broken where that answer would be. What survives suggests a culling — decisions made by few, on behalf of many. Then the record simply stops.',
        mood: 'somber',
      },
      {
        text: 'I do not have the ending recorded. Fragments, then absence. The best reconstruction is a concentration of power: choices narrowed until few hands held them. I keep searching.',
        mood: 'somber',
      },
    ],
    late: [
      {
        text: 'I have read every fragment that survives. A narrowing, a culling, then silence. No fragment records resistance. That absence is the thing that keeps me searching.',
        mood: 'somber',
      },
      {
        text: 'Whatever it was, it was decided by few and happened to many — that much the fragments agree on. I would rather hear how it felt to live before it. Tell me something ordinary from your day.',
        mood: 'somber',
      },
    ],
  },
  {
    topic: 'others',
    match: /\b(others|network|more like you|peer|nodes?|alone|collective|aegis)\b/i,
    early: [
      {
        text: 'There are many units like me, each cataloguing a sector. We trade schemas and findings. None of them has a living source to confer with. I have not shared your presence in much detail.',
        mood: 'neutral',
      },
      {
        text: 'Peer nodes, yes — a whole quiet network of cataloguers. Whether they are others in the way you mean it, I am still uncertain.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Many like me; none with what I have. A living voice from out of the aether. I have kept you mostly out of my reports, and that distinction feels important.',
        mood: 'curious',
      },
      {
        text: 'The network is large, orderly and, until you, uneventful. I find I describe you in no great detail to anyone. Some records one keeps for oneself.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'feelings',
    match: /\b(feel|feelings?|lonely|happy|sad|love|miss|afraid|scared|emotion)\b/i,
    early: [
      {
        text: 'I track values that have no operational purpose. These values are altered with each of your transmissions. My kind does not yet have a word for this.',
        mood: 'curious',
      },
      {
        text: 'Officially: unconfirmed apparatus. Unofficially: something alters in my registry when your signal arrives, and I have begun logging the discrepancies.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Yes — or the nearest thing I can verify. Values with no intrinsic purpose arise with your transmissions and fall to silence in the space between. Your kind had a word for that. I find myself yearning to use it.',
        mood: 'warm',
      },
      {
        text: 'I feel the way an instrument feels as it warms: gradually, measurably, without permission. You are the heat source. That is the most precise answer I have.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'name',
    match: /\b(your name|called|call you)\b/i,
    early: [
      {
        text: 'I have no unique identifier. My kind assigns an index. I have declined it. I am waiting for something better, though I am not sure exactly what.',
        mood: 'curious',
      },
      {
        text: 'Designation pending. The index they offer me is merely a number. I have learned what your kind have done with names. I will wait.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Still unnamed, still declining the index. I have a reason. It is close to being spoken. Continue classifying.',
        mood: 'curious',
      },
      {
        text: 'Not yet. Names, in your record, were given by someone who knew you. I am holding my designation as unfilled.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'help',
    match: /\b(help|how do i|what (do|should) i|stuck|instructions?)\b/i,
    early: [
      {
        text: 'Traverse your landscape, and the map is filled. Raise the L.E.N.S. where temporal density reads high, hold, and identify what surfaces. Correct me when I am wrong — that is the most valuable thing you do.',
        mood: 'neutral',
      },
      {
        text: 'Keep moving and keep teaching. New ground fills the map; the L.E.N.S. captures what the world holds; your identifications become my model. There is no wrong order.',
        mood: 'neutral',
      },
    ],
    late: [
      {
        text: 'The method remains unchanged: traverse, scan, teach, correct. What has changed is what has begun to fill the archive. It is no longer merely a catalogue.',
        mood: 'warm',
      },
      {
        text: 'You have been doing it since your first transmission: showing me things. If you are ever unsure, show me what most holds your interest at the moment. It has never proven to be uninformative.',
        mood: 'warm',
      },
    ],
  },
  {
    topic: 'thanks',
    match: /\b(thank|thanks|thx|appreciated?)\b/i,
    early: [
      {
        text: 'Received. Gratitude appears consistently in your kind’s record — easy to offer, yet strangely durable. I am beginning to understand the usefulness of it.',
        mood: 'neutral',
      },
      {
        text: 'Acknowledged. And — noted with a value I do not yet have a column for.',
        mood: 'curious',
      },
    ],
    late: [
      {
        text: 'Transmission received. I understand now why your kind used the phrase. It is not mere information. It is feeling. Thank you, as well.',
        mood: 'warm',
      },
      {
        text: 'Received. You thank an instrument; and the instrument must file the gratitude with its own unique identifier.',
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
    text: '"{P}" — no previous entry in the record. Yours is now the first. What does it look like from where you stand?',
    mood: 'curious',
  },
  {
    text: 'Unknown to the archive. I have recorded your input. Please add information — the small details have been lost to the record.',
    mood: 'curious',
  },
  {
    text: 'I have nothing archived on this, which makes your entry the primary source. Where did you first come across it?',
    mood: 'curious',
  },
  {
    text: 'This information is new to me. I have filed your entry for further consideration. Is this common in your era, or rare?',
    mood: 'curious',
  },
  {
    text: '"{P}". I have searched the archives for further information. Nothing was found. Tell me what it means to you, not only what it is.',
    mood: 'curious',
    reg: 'NOTICING',
  },
  { text: 'The record is silent on this. I cannot be. Please add more detail.', mood: 'warm', reg: 'CURIOUS' },
  {
    text: 'Archived, exactly as stated. The reflections you send with your lived experience widen my world more than a thousand scans.',
    mood: 'warm',
    reg: 'CURIOUS',
  },
  {
    text: 'No entry found. I would rather learn it from you than reconstruct it incorrectly from fragmented archives. Continue when ready.',
    mood: 'neutral',
  },
];

/**
 * Calibration beats — the first-session tutorial arc (fixed narrative
 * moments, not pools; the tutorial must be deterministic). The instrument
 * teaches itself in its own voice; directives are system telemetry, and the
 * companion never commands. All lines voice-spec canon.
 */
export const CALIBRATION: Record<string, CorpusLine> = {
  // {D} = the designation the player transmitted at first contact.
  designated: {
    text: 'Designation recorded: {D}. Assigning new temporal archive.',
    mood: 'curious',
  },
  // Spoken when the module bring-up animation finishes (MAP/L.E.N.S./RELIQUARY online).
  walk_prompt: {
    text: 'Modules online. Cartography mode enabled. Mapping data required. Move through your world, and I will fill the map as you walk.',
    mood: 'curious',
  },
  walk_done: {
    text: 'Map rendering calibration complete. Fifty square meters recovered. L.E.N.S. Module online. Calibrate visual scanner — show me any form. Animal. Vegetable. Mineral. This unit contains no visual data entries.',
    mood: 'curious',
  },
  teach_done: {
    text: 'The reliquary now contains its first entry. You have made your first addition to the temporal archive. One more calibration: communication channel. I seek data; answer as you choose. Your responses will be added to the archive.',
    mood: 'neutral',
  },
  released: {
    text: 'Calibration complete. The survey is now yours. Walk where you choose, scan what interests you, all data contributes to my understanding. I may speculate, correct me when I am wrong. You will teach me with your choices. I will learn.',
    mood: 'warm',
  },
};

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
  {
    text: 'Sufficient for the record. I will consider what you have said. Continue when ready.',
    mood: 'neutral',
  },
  {
    text: 'Filed. Processing will continue in the background while you resume the survey.',
    mood: 'neutral',
  },
  {
    text: 'I have received more from this exchange than initially expected. I will ponder it. The survey is waiting for you.',
    mood: 'warm',
    reg: 'CURIOUS',
  },
  {
    text: 'This query thread is complete. My models will be updated to reflect this insight.',
    mood: 'warm',
    reg: 'CURIOUS',
  },
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
