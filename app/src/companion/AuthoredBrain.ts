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

  async respond(event: CompanionEvent, context: CompanionContext): Promise<CompanionResponse | null> {
    if (event === 'pattern') {
      const line = context.patternKey ? PATTERNS[context.patternKey] : undefined;
      return line ? this.finish(line, context) : null;
    }
    const pool = POOLS[event].filter((l) => registerAtLeast(context.register, l.reg));
    if (pool.length === 0) return null;
    const line = this.pickAvoidingRepeats(pool);
    return this.finish(line, context);
  }

  async nextQuestion(
    register: Register,
    askedIds: string[],
    _context: CompanionContext
  ): Promise<{ id: string; response: CompanionResponse } | null> {
    const candidates = QUESTIONS.filter(
      (q) => !askedIds.includes(q.id) && registerAtLeast(register, q.reg)
    );
    if (candidates.length === 0) return null;
    const q = candidates[Math.floor(Math.random() * candidates.length)];
    return { id: q.id, response: { text: q.text, mood: q.mood, isQuery: true } };
  }

  async route(
    text: string,
    context: CompanionContext
  ): Promise<CompanionResponse & { topic: string }> {
    const late = context.register === 'CURIOUS';
    const ctx = { ...context, playerText: text };
    for (const entry of ROUTER) {
      if (entry.match.test(text)) {
        const line = this.pickAvoidingRepeats(late ? entry.late : entry.early);
        return { ...this.finish(line, ctx), topic: entry.topic };
      }
    }
    const unknownPool = ROUTER_UNKNOWN.filter((l) => registerAtLeast(context.register, l.reg));
    const line = this.pickAvoidingRepeats(unknownPool.length ? unknownPool : ROUTER_UNKNOWN);
    return { ...this.finish(line, ctx), topic: 'unknown' };
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
      text = text.replace('{A}', snippet(context.keptAnswer));
    }
    if (context.playerText) {
      text = text.replace('{P}', snippet(context.playerText));
    }
    if (context.named) {
      text = applyContractions(text);
    }
    return { text, mood: line.mood };
  }
}

/** Short enough to quote inline; the FULL text stays kept in the answers table. */
function snippet(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length <= 60 ? clean : `${clean.slice(0, 57)}…`;
}
