import type { Register } from '../config/economy';
import { AuthoredBrain } from './AuthoredBrain';
import type {
  CompanionBrain,
  CompanionContext,
  CompanionEvent,
  CompanionMood,
  CompanionResponse,
} from './CompanionBrain';
import { applyContractions, expandContractions, THREAD_CLOSERS, registerAtLeast } from './corpus';
import { buildEventInstruction, buildQuestionInstruction, buildSystemPrompt } from './systemPrompt';

export type LLMStatus = 'uninitialized' | 'loading' | 'ready' | 'unavailable' | 'error';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * v1.5 companion brain: an on-device small language model behind the same
 * CompanionBrain interface. Inference runs via react-native-executorch, which
 * requires a dev-client build — inside Expo Go the native module is absent,
 * status becomes 'unavailable', and every call falls back to AuthoredBrain so
 * the game never notices. Nothing the player says leaves the device.
 *
 * The character lives in systemPrompt.ts; evaluate it on the desktop harness
 * (tools/companion-harness.ts) — same prompt, same class of model.
 */
export class LLMBrain implements CompanionBrain {
  private fallback = new AuthoredBrain();
  private status: LLMStatus = 'uninitialized';
  private busy = false;
  private llm: { generate: (messages: ChatMessage[]) => Promise<string> } | null = null;

  getStatus(): LLMStatus {
    return this.status;
  }

  /** Loads the native module and model (first call downloads ~1.2GB). Safe to call repeatedly. */
  async init(): Promise<LLMStatus> {
    if (this.status === 'ready' || this.status === 'loading') return this.status;
    this.status = 'loading';
    try {
      // Lazy require: in Expo Go the native module does not exist and this throws.
      /* eslint-disable @typescript-eslint/no-require-imports */
      const executorch = require('react-native-executorch');
      /* eslint-enable @typescript-eslint/no-require-imports */
      if (!executorch.isAvailable || !executorch.LLMModule) {
        throw new Error('executorch native runtime not present in this client');
      }
      // Llama 3.2 3B (SpinQuant): desktop-harness evaluation 2026-07-08 showed
      // 1B cannot hold the character (third-person slips, invented quotes)
      // while 3B holds register AND engages — see docs/decisions.md. The
      // 15 Pro-class devices run 3B SpinQuant; revisit if older devices join.
      this.llm = await executorch.LLMModule.fromModelName(executorch.LLAMA3_2_3B_SPINQUANT);
      this.status = 'ready';
    } catch {
      this.status = 'unavailable';
    }
    return this.status;
  }

  async respond(
    event: CompanionEvent,
    context: CompanionContext
  ): Promise<CompanionResponse | null> {
    const conversational = event === 'resurface' || event === 'answer_ack';
    const generated = await this.generate(
      context,
      buildEventInstruction(event, context),
      conversational
    );
    if (generated) return generated;
    if (conversational && questionStreak(context.recentTranscript) >= CLOSE_AFTER_QUESTIONS) {
      return pickCloser(context);
    }
    return this.fallback.respond(event, context);
  }

  async nextQuestion(
    register: Register,
    askedIds: string[],
    context: CompanionContext
  ): Promise<{ id: string; response: CompanionResponse } | null> {
    // askedIds carries authored ids AND previously generated question texts
    // (prefixed llmq:) so the model is told what not to re-ask.
    const priorTexts = askedIds.filter((a) => a.startsWith('llmq:')).map((a) => a.slice(5));
    const generated = await this.generate(context, buildQuestionInstruction(priorTexts), false);
    if (generated) {
      return {
        id: `llmq:${generated.text.slice(0, 80)}`,
        response: { ...generated, mood: 'curious', isQuery: true },
      };
    }
    return this.fallback.nextQuestion(register, askedIds, context);
  }

  async route(
    text: string,
    context: CompanionContext
  ): Promise<CompanionResponse & { topic: string }> {
    // The player's message IS the final user turn; the standing behavior
    // (engage, keep unknown things exactly, ask back) lives in the system prompt.
    const generated = await this.generate(context, text, true);
    if (generated) return { ...generated, topic: 'llm' };
    if (questionStreak(context.recentTranscript) >= CLOSE_AFTER_QUESTIONS) {
      return { ...pickCloser(context), topic: 'llm' };
    }
    return this.fallback.route(text, context);
  }

  /** One generation at a time; anything that arrives while busy uses the fallback. */
  private async generate(
    context: CompanionContext,
    instruction: string,
    includeTranscript: boolean
  ): Promise<CompanionResponse | null> {
    if (this.status !== 'ready' || !this.llm || this.busy) return null;
    this.busy = true;
    try {
      // Question budget: after the initial question + one follow-up, the next
      // conversational turn must close the thread, not extend the interrogation.
      const mustClose =
        includeTranscript && questionStreak(context.recentTranscript) >= CLOSE_AFTER_QUESTIONS;
      const finalInstruction = mustClose ? `${instruction}\n\n${CLOSE_DIRECTIVE}` : instruction;
      const raw = await this.llm.generate(
        buildChatMessages(context, finalInstruction, includeTranscript)
      );
      let text = postProcess(raw, context.named != null);
      if (text && mustClose) text = stripTrailingQuestions(text);
      if (!text) return null;
      return { text, mood: inferMood(text) };
    } catch {
      return null;
    } finally {
      this.busy = false;
    }
  }
}

/** Companion questions allowed per exchange before it must close the thread. */
export const CLOSE_AFTER_QUESTIONS = 2;

export const CLOSE_DIRECTIVE =
  'IMPORTANT: You have already asked your questions on this thread. Do NOT ask a question this turn. Close the exchange: briefly acknowledge what you learned, say you will ponder or file it, and release the Surveyor back to the survey.';

/**
 * Consecutive companion turns (walking back from the newest) that asked the
 * player something, each answered — i.e. how deep the current interrogation is.
 */
export function questionStreak(transcript?: string[]): number {
  if (!transcript?.length) return 0;
  let streak = 0;
  for (let i = transcript.length - 1; i >= 0; i--) {
    const line = transcript[i];
    if (line.startsWith('UNIT: ')) {
      if (!line.includes('?')) break;
      streak += 1;
    }
    // SURVEYOR lines between question turns keep the walk going.
  }
  return streak;
}

/** Drops question-sentences from the tail; null if nothing declarative remains. */
export function stripTrailingQuestions(text: string): string | null {
  const sentences = text.match(/[^.!?]+[.!?]+(?:["'”])?|[^.!?]+$/g) ?? [text];
  while (sentences.length > 0 && sentences[sentences.length - 1].trim().endsWith('?')) {
    sentences.pop();
  }
  const remaining = sentences.join(' ').replace(/\s+/g, ' ').trim();
  return remaining.length > 0 ? remaining : null;
}

/** Authored closer — the guaranteed backstop when the model will not stop asking. */
export function pickCloser(context: CompanionContext): CompanionResponse {
  const pool = THREAD_CLOSERS.filter((l) => registerAtLeast(context.register, l.reg));
  const line = pool[Math.floor(Math.random() * pool.length)] ?? THREAD_CLOSERS[0];
  const text = context.named ? applyContractions(line.text) : line.text;
  return { text, mood: line.mood };
}

/**
 * History goes in as REAL chat turns, never as a pasted log — small models
 * continue pasted logs verbatim (emitting "SURVEYOR:" lines, the first demo's
 * failure mode). Shared with the desktop harness.
 */
export function buildChatMessages(
  context: CompanionContext,
  instruction: string,
  includeTranscript: boolean
): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(context) }];
  if (includeTranscript && context.recentTranscript?.length) {
    for (const line of context.recentTranscript) {
      if (line.startsWith('SURVEYOR: ')) {
        messages.push({ role: 'user', content: line.slice('SURVEYOR: '.length) });
      } else if (line.startsWith('UNIT: ')) {
        messages.push({ role: 'assistant', content: line.slice('UNIT: '.length) });
      }
    }
    // The app logs the outgoing transmission before routing; do not send the
    // current message twice (once as history, once as the final turn).
    const last = messages[messages.length - 1];
    if (last.role === 'user' && last.content === instruction) messages.pop();
  }
  messages.push({ role: 'user', content: instruction });
  return messages;
}

/** Trim, un-quote, strip think-blocks and role labels, cap at 4 sentences, enforce the tell. */
export function postProcess(raw: string, named: boolean): string | null {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // If the model starts writing the player's side, cut everything from there on.
  const surveyorIdx = text.indexOf('SURVEYOR:');
  if (surveyorIdx > 0) text = text.slice(0, surveyorIdx);
  if (surveyorIdx === 0) return null; // it answered AS the player: discard
  text = text.replace(/^(UNIT|LENS|COMPANION)\s*:\s*/i, '');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/^["'“”]+|["'“”]+$/g, '').trim();
  if (!text) return null;
  const sentences = text.match(/[^.!?]+[.!?]+(?:["'”])?|[^.!?]+$/g) ?? [text];
  if (sentences.length > 4) text = sentences.slice(0, 4).join(' ').trim();
  if (!named) text = expandContractions(text);
  return text;
}

/** The model emits no mood channel; infer one for the voice synth tones. */
export function inferMood(text: string): CompanionMood {
  const t = text.toLowerCase();
  if (/silence|absence|gone|loss|narrowing|vanish|grief|ende[dr]/.test(t)) return 'somber';
  if (/thank|kept|keep it|warm|glad|with you|friend/.test(t)) return 'warm';
  if (text.includes('?')) return 'curious';
  return 'neutral';
}
