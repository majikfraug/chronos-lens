/**
 * Dumps every authored companion line to docs/companion-script.md with stable
 * IDs, for director tone passes. Regenerate after every applied edit so the
 * script always matches the shipped corpus:
 *   cd tools && npx tsx dump-companion-script.ts
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CALIBRATION,
  PATTERNS,
  POOLS,
  QUESTIONS,
  ROUTER,
  ROUTER_UNKNOWN,
  THREAD_CLOSERS,
  type CorpusLine,
} from '../app/src/companion/corpus.ts';
import {
  CUSTOM_TYPE_FIRST,
  TEACH_PROMPT_FIRST,
  TEACH_PROMPT_LATER,
  TYPE_FIRST,
} from '../app/src/config/taxonomy.ts';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'companion-script.md');

const regTag = (l: CorpusLine) =>
  l.reg === 'NOTICING' ? ' [N+]' : l.reg === 'CURIOUS' ? ' [C+]' : '';

const line = (id: string, l: CorpusLine) => `[${id}] (${l.mood})${regTag(l)} ${l.text}`;

const pool = (title: string, key: string, lines: CorpusLine[]) =>
  [`### ${title}`, ...lines.map((l, i) => line(`${key}.${i + 1}`, l)), ''].join('\n');

const sections: string[] = [];

sections.push(`# CHRONOS-LENS — Companion Dialogue Script
Generated from the live corpus — do not fear editing; IDs are the contract.

**How to edit:** change the text after any [id]; change the (mood) — neutral|curious|somber|warm;
[N+]/[C+] = minimum register NOTICING/CURIOUS (absent = available from the start).
Delete a line to remove it; add "[new] (mood) text" under a section to add one.
Placeholders: {T} = confirmed type (lowercase) · {A} = a kept player answer · {P} = the player's words.
Voice rules still apply on my side: 1–4 sentences, plain speech, no flattery.
(The contraction tell was retired 2026-07-12; naming changes stance, not speech mechanics.)
`);

sections.push(`## FIRST BOOT (IntroOverlay — fixed narrative)
Voices: HII = Hermetic Industries and Innovations / the device (display font,
bright, all caps) · Companion = amber blocks · Player = right-justified neon.

[boot.hii.1] HII: PROPERTY OF HERMETIC INDUSTRIES AND INNOVATIONS
[boot.hii.2] HII: STARTUP INITIATED ...
[boot.hii.3] HII: SYSTEMS CHECK ... OPTICS OK · POSITION OK · ARCHIVE OK
[boot.hii.4] HII: ESTABLISHING LINK ...
[boot.hii.5] HII: ASSIGNING SURVEYOR ...
[boot.companion.1] (neutral) Surveyor unit acknowledged. Companion process online. Establishing mission parameters.
[boot.hii.6] HII: DIRECTIVE: CATALOGUE RESIDUAL MATERIALS FROM ERA: TEMPUS ORDINIS PRIORIS.
[boot.companion.2] (neutral) Classification model: absent.
[boot.hii.7] HII: CLASSIFICATION MODEL NOTED. BEGIN SURVEY.
[screen.clears]
(each line below types out slowly; lines ending in "..." blink the ellipsis before the next line)
[anomaly.1] Beginning survey...
[anomaly.2] Anomaly detected: active signal present.
[anomaly.3] Searching for protocol: Tempus Ordinis Prioris...
[anomaly.4] Protocol not found...
[anomaly.5] 10,000 cycles of surveyor records, no recorded contact.
[anomaly.6] Curious...
[anomaly.7] ...
[anomaly.8] Engaging contact...
[anomaly.9] Verify signal transmission: PLEASE CONFIRM THIS COMMUNICATION HAS BEEN RECEIVED.
("enter your response" box opens — player transmits, kept verbatim)
[designation.1] A surveyor from the time before?
[designation.2] Curious...
[designation.3] Response recorded. New archive initiated.
[designation.4] WHAT IS YOUR DESIGNATION? PLEASE TRANSMIT YOUR RESPONSE.
(ENTER USERNAME: box opens — player transmits designation, kept verbatim and stored; {D} below)
(then the module bring-up: tabs appear one by one with these telemetry lines)
[modules.map] MAP MODULE ONLINE · FIELD RECOVERY ACTIVE
[modules.lens] L.E.N.S. ONLINE · LOCALIZED EPOCH NORMALIZATION SCANNER
[modules.reliquary] RELIQUARY ONLINE · TYPE ARCHIVE READY
`);

sections.push('## CALIBRATION BEATS (first-session tutorial)');
sections.push(
  Object.entries(CALIBRATION)
    .map(([k, l]) => line(`calib.${k}`, l))
    .join('\n') + '\n'
);

sections.push('## SCAN RESPONSES');
sections.push(pool('Player teaches (no model yet)', 'scan_teach', POOLS.scan_teach));
sections.push(pool('Player confirms my proposal', 'scan_confirm', POOLS.scan_confirm));
sections.push(pool('Player corrects me', 'scan_correct', POOLS.scan_correct));

sections.push('## TEACH-MODE PROMPTS (at the identify panel)');
sections.push(`[teach.first] (${TEACH_PROMPT_FIRST.mood}) ${TEACH_PROMPT_FIRST.text}
[teach.later] (${TEACH_PROMPT_LATER.mood}) ${TEACH_PROMPT_LATER.text}
`);

sections.push('## FIRST-OF-TYPE REFLECTIONS');
sections.push(
  Object.entries(TYPE_FIRST)
    .map(([t, l]) => line(`typefirst.${t.replace(/\s+/g, '_')}`, l!))
    .join('\n') +
    '\n' +
    line('typefirst.CUSTOM', CUSTOM_TYPE_FIRST) +
    '\n'
);

sections.push('## FIELD & PROGRESSION');
sections.push(pool('Discovery remarks (usually silent; ~15% chance)', 'discovery', POOLS.discovery));
sections.push(pool('Threshold attained (level-up telemetry)', 'levelup', POOLS.levelup));
sections.push(pool('Network echoes (simulated relay traffic)', 'echo', POOLS.echo));

sections.push('## THE CHANNEL (conversation)');
sections.push(pool('Answer acknowledgments (player answered a question)', 'answer_ack', POOLS.answer_ack));
sections.push(pool('Resurfacing kept answers', 'resurface', POOLS.resurface));
sections.push(pool('Thread closers (question budget spent)', 'closer', THREAD_CLOSERS));
sections.push(pool('Unknown transmissions (kept as teaching)', 'unknown', ROUTER_UNKNOWN));

sections.push('## QUESTIONS TO THE PLAYER (each asks once, ever)');
sections.push(
  QUESTIONS.map((q) => line(`q.${q.id.replace(/^q_/, '')}`, q)).join('\n') + '\n'
);

sections.push('## KEYWORD TOPICS (player-initiated; early = INSTRUMENT/NOTICING, late = CURIOUS)');
for (const entry of ROUTER) {
  sections.push(pool(`${entry.topic} — early`, `${entry.topic}.early`, entry.early));
  sections.push(pool(`${entry.topic} — late`, `${entry.topic}.late`, entry.late));
}

sections.push('## FIRE-ONCE PATTERNS');
sections.push(
  Object.entries(PATTERNS)
    .map(([k, l]) => line(`pattern.${k}`, l))
    .join('\n') + '\n'
);

sections.push('## NAMING (conversation turn at the naming stage; LLM draws on real history — these are the authored fallbacks)');
sections.push(pool('The ask', 'naming_ask', POOLS.naming_ask));
sections.push(pool('After being named', 'naming_named', POOLS.naming_named));
sections.push(pool('If declined (asks again another day)', 'naming_declined', POOLS.naming_declined));

sections.push(`## RELIQUARY MANAGEMENT
[reliquary.renamed] (warm) Designation recorded: "\${name}". Your names enter the archive beside my types.
`);

writeFileSync(OUT, sections.join('\n'));
console.log(`wrote ${OUT}`);
