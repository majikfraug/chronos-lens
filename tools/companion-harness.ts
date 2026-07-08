/**
 * Companion LLM harness — evaluate the LLMBrain voice on the desktop.
 *
 * Runs the EXACT system prompt + event instructions from the app
 * (app/src/companion/systemPrompt.ts) against Llama 3.2 1B Instruct — the
 * same model family LLMBrain loads on the phone — so the character can be
 * judged and tuned before an Apple dev-client build exists.
 *
 * Usage (from /tools, after `npm install`):
 *   npm run companion            interactive REPL
 *   npm run companion:demo       scripted demo transcript, then exit
 *
 * REPL commands (anything else is transmitted to the companion):
 *   :scan <type> teach|confirm|correct    simulate a scan filing
 *   :discover        simulate new ground        :level     threshold attained
 *   :echo            network echo               :ask       companion asks a question
 *   :register I|N|C  set stage                  :name <x>  simulate the naming
 *   :state           show simulated context     :quit
 *
 * First run downloads the model (~0.8GB) to tools/models/.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { getLlama, LlamaChatSession, resolveModelFile } from 'node-llama-cpp';
import type {
  CompanionContext,
  CompanionEvent,
} from '../app/src/companion/CompanionBrain.ts';
import {
  buildChatMessages,
  CLOSE_AFTER_QUESTIONS,
  CLOSE_DIRECTIVE,
  inferMood,
  pickCloser,
  postProcess,
  questionStreak,
  stripTrailingQuestions,
} from '../app/src/companion/LLMBrain.ts';
import {
  buildEventInstruction,
  buildQuestionInstruction,
} from '../app/src/companion/systemPrompt.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Default matches the phone model pick (Llama 3.2 3B — see decisions.md
// 2026-07-08: 1B cannot hold the character). --model1b compares downward.
const MODEL_URI = process.argv.includes('--model1b')
  ? 'hf:bartowski/Llama-3.2-1B-Instruct-GGUF:Q4_K_M'
  : 'hf:bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M';

// ---- simulated play state (edit freely, or via REPL commands) --------------
const state = {
  register: 'NOTICING' as CompanionContext['register'],
  named: null as string | null,
  taughtTotal: 12,
  corrections: 3,
  favoredType: 'NATURAL' as string | null,
  keptAnswers: [
    'my grandfather kept every broken watch he ever owned',
    'we walk to feel like the day belonged to us',
  ],
  askedQuestions: [] as string[],
  transcript: [] as string[],
};

function ctx(extra?: Partial<CompanionContext>): CompanionContext {
  return {
    register: state.register,
    named: state.named,
    taughtTotal: state.taughtTotal,
    corrections: state.corrections,
    favoredType: state.favoredType,
    keptAnswers: state.keptAnswers.slice(-10),
    recentTranscript: state.transcript.slice(-8),
    ...extra,
  };
}

// ---- model ------------------------------------------------------------------
console.log('▸ resolving model (first run downloads ~0.8GB) …');
const modelPath = await resolveModelFile(MODEL_URI, path.join(HERE, 'models'));
const llama = await getLlama();
const model = await llama.loadModel({ modelPath });
const context = await model.createContext({ contextSize: 2048 });
console.log('▸ language core online (local, CPU)\n');

async function generate(instruction: string, includeTranscript: boolean): Promise<string | null> {
  // Identical to LLMBrain.generate: question budget, then real chat turns.
  const mustClose =
    includeTranscript && questionStreak(state.transcript) >= CLOSE_AFTER_QUESTIONS;
  if (mustClose) instruction = `${instruction}\n\n${CLOSE_DIRECTIVE}`;
  const messages = buildChatMessages(ctx(), instruction, includeTranscript);
  const sequence = context.getSequence();
  try {
    const session = new LlamaChatSession({
      contextSequence: sequence,
      systemPrompt: messages[0].content,
    });
    session.setChatHistory([
      { type: 'system', text: messages[0].content },
      ...messages.slice(1, -1).map((m) =>
        m.role === 'assistant'
          ? ({ type: 'model', response: [m.content] } as const)
          : ({ type: 'user', text: m.content } as const)
      ),
    ]);
    const raw = await session.prompt(messages[messages.length - 1].content, {
      maxTokens: 130,
      temperature: 0.8,
    });
    let text = postProcess(raw, state.named != null);
    if (text && mustClose) text = stripTrailingQuestions(text);
    if (!text && mustClose) text = pickCloser(ctx()).text;
    return text;
  } finally {
    sequence.dispose();
  }
}

function say(text: string | null): void {
  if (!text) {
    console.log('  (silent)');
    return;
  }
  const label = state.named ?? 'LENS';
  console.log(`  [${label} · ${inferMood(text)}] ${text}\n`);
  state.transcript.push(`UNIT: ${text}`);
}

async function fireEvent(event: CompanionEvent, extra?: Partial<CompanionContext>): Promise<void> {
  say(await generate(buildEventInstruction(event, ctx(extra)), false));
}

async function transmit(text: string): Promise<void> {
  const reply = await generate(text, true);
  state.transcript.push(`SURVEYOR: ${text}`);
  say(reply);
}

async function askQuestion(): Promise<void> {
  const q = await generate(buildQuestionInstruction(state.askedQuestions), false);
  if (q) state.askedQuestions.push(q);
  say(q);
}

// ---- demo mode ---------------------------------------------------------------
if (process.argv.includes('--demo')) {
  console.log('=== DEMO · register NOTICING, taught 12, corrections 3 ===\n');
  console.log('> :scan domestic teach');
  await fireEvent('scan_teach', { type: 'DOMESTIC' });
  console.log('> what are you?');
  await transmit('what are you?');
  console.log('> :ask');
  await askQuestion();
  console.log('> (answering) because fixing something is like keeping a promise to it');
  state.keptAnswers.push('because fixing something is like keeping a promise to it');
  await fireEvent('answer_ack', { keptAnswer: 'because fixing something is like keeping a promise to it' });
  console.log('> i found a 3d printer at a garage sale today');
  await transmit('i found a 3d printer at a garage sale today');
  console.log('> :register C   (relationship deepens)');
  state.register = 'CURIOUS';
  console.log('> do you ever get lonely out there?');
  await transmit('do you ever get lonely out there?');
  process.exit(0);
}

// ---- REPL --------------------------------------------------------------------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log('Talk to the companion. Commands start with ":" (see file header). :quit to exit.\n');

for (;;) {
  const line = (await rl.question('> ')).trim();
  if (!line) continue;
  if (line === ':quit') break;

  if (line.startsWith(':')) {
    const [cmd, ...args] = line.slice(1).split(/\s+/);
    if (cmd === 'scan') {
      const type = (args[0] ?? 'domestic').toUpperCase();
      const kind = (args[1] ?? 'confirm') as 'teach' | 'confirm' | 'correct';
      state.taughtTotal += 1;
      if (kind === 'correct') state.corrections += 1;
      await fireEvent(`scan_${kind}` as CompanionEvent, { type });
    } else if (cmd === 'discover') await fireEvent('discovery');
    else if (cmd === 'level') await fireEvent('levelup');
    else if (cmd === 'echo') await fireEvent('echo');
    else if (cmd === 'ask') await askQuestion();
    else if (cmd === 'register') {
      state.register = args[0] === 'I' ? 'INSTRUMENT' : args[0] === 'C' ? 'CURIOUS' : 'NOTICING';
      console.log(`  register → ${state.register}\n`);
    } else if (cmd === 'name') {
      state.named = args.join(' ') || 'Echo';
      console.log(`  named → ${state.named} (contractions unlock)\n`);
    } else if (cmd === 'state') console.log(state, '\n');
    else console.log('  unknown command\n');
    continue;
  }

  await transmit(line);
}

rl.close();
process.exit(0);
