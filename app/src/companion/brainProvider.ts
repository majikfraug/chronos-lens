import type { Register } from '../config/economy';
import { AuthoredBrain } from './AuthoredBrain';
import type {
  CompanionBrain,
  CompanionContext,
  CompanionEvent,
  CompanionResponse,
} from './CompanionBrain';
import { LLMBrain, type LLMStatus } from './LLMBrain';

export type BrainMode = 'authored' | 'llm';

const authored = new AuthoredBrain();
const llm = new LLMBrain();
let mode: BrainMode = 'authored';

export function getBrainMode(): BrainMode {
  return mode;
}

export function getLLMStatus(): LLMStatus {
  return llm.getStatus();
}

/** Switches brains; 'llm' kicks off model init (download + load on first use). */
export async function setBrainMode(
  next: BrainMode,
  onDownloadProgress?: (fraction: number) => void
): Promise<LLMStatus | 'authored'> {
  mode = next;
  if (next === 'llm') return llm.init(onDownloadProgress);
  return 'authored';
}

function active(): CompanionBrain {
  // LLM mode with an unavailable/unready model still routes through LLMBrain,
  // which falls back to the authored corpus internally per call.
  return mode === 'llm' ? llm : authored;
}

/** The one brain the game talks to — delegates to the active implementation. */
export const brain: CompanionBrain = {
  respond: (event: CompanionEvent, context: CompanionContext): Promise<CompanionResponse | null> =>
    active().respond(event, context),
  nextQuestion: (register: Register, askedIds: string[], context: CompanionContext) =>
    active().nextQuestion(register, askedIds, context),
  route: (text: string, context: CompanionContext) => active().route(text, context),
};
