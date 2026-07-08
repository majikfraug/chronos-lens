import type { Register } from '../config/economy';
import type {
  CompanionBrain,
  CompanionContext,
  CompanionEvent,
  CompanionResponse,
} from './CompanionBrain';
import {
  applyContractions,
  PATTERNS,
  POOLS,
  QUESTIONS,
  registerAtLeast,
  ROUTER,
  ROUTER_UNKNOWN,
  type CorpusLine,
} from './corpus';

/**
 * v1 companion brain: register-gated weighted pools with a no-recent-repeat
 * memory, keyword routing, and the post-naming contraction tell. Brief §5.
 */
export class AuthoredBrain implements CompanionBrain {
  private recent: string[] = [];

  respond(event: CompanionEvent, context: CompanionContext): CompanionResponse | null {
    if (event === 'pattern') {
      const line = context.patternKey ? PATTERNS[context.patternKey] : undefined;
      return line ? this.finish(line, context) : null;
    }
    const pool = POOLS[event].filter((l) => registerAtLeast(context.register, l.reg));
    if (pool.length === 0) return null;
    const line = this.pickAvoidingRepeats(pool);
    return this.finish(line, context);
  }

  nextQuestion(
    register: Register,
    askedIds: string[]
  ): { id: string; response: CompanionResponse } | null {
    const candidates = QUESTIONS.filter(
      (q) => !askedIds.includes(q.id) && registerAtLeast(register, q.reg)
    );
    if (candidates.length === 0) return null;
    const q = candidates[Math.floor(Math.random() * candidates.length)];
    return { id: q.id, response: { text: q.text, mood: q.mood, isQuery: true } };
  }

  route(text: string, context: CompanionContext): CompanionResponse & { topic: string } {
    const late = context.register === 'CURIOUS';
    for (const entry of ROUTER) {
      if (entry.match.test(text)) {
        const line = late ? entry.late : entry.early;
        return { ...this.finish(line, context), topic: entry.topic };
      }
    }
    return { ...this.finish(ROUTER_UNKNOWN, context), topic: 'unknown' };
  }

  private pickAvoidingRepeats(pool: CorpusLine[]): CorpusLine {
    const fresh = pool.filter((l) => !this.recent.includes(l.text));
    const source = fresh.length > 0 ? fresh : pool;
    const line = source[Math.floor(Math.random() * source.length)];
    this.recent.push(line.text);
    if (this.recent.length > 12) this.recent.shift();
    return line;
  }

  private finish(line: CorpusLine, context: CompanionContext): CompanionResponse {
    let text = line.text;
    if (context.type) {
      text = text.replace('{T}', context.type.toLowerCase());
    }
    if (context.keptAnswer) {
      text = text.replace('{A}', context.keptAnswer);
    }
    if (context.named) {
      text = applyContractions(text);
    }
    return { text, mood: line.mood };
  }
}

/** The one brain the game talks to. Swappable for LLMBrain at v1.5. */
export const brain: CompanionBrain = new AuthoredBrain();
