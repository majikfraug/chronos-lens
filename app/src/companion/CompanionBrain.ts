import type { Register } from '../config/economy';

/**
 * The companion's brain interface — brief §5. Game code only ever talks to
 * this; v1 ships AuthoredBrain, v1.5 swaps in LLMBrain behind the same
 * surface without touching game code.
 */

export type CompanionMood = 'neutral' | 'curious' | 'somber' | 'warm';

export type CompanionResponse = {
  text: string;
  mood: CompanionMood;
  /** True when the line is a question awaiting the player's transmission. */
  isQuery?: boolean;
};

export type CompanionEvent =
  | 'scan_teach'
  | 'scan_confirm'
  | 'scan_correct'
  | 'discovery'
  | 'levelup'
  | 'echo'
  | 'answer_ack'
  | 'resurface'
  | 'pattern';

export type CompanionContext = {
  register: Register;
  /** The player-given name, once the awakening has happened. Contractions follow it. */
  named: string | null;
  /** Confirmed type for scan events, lowercased into lines via {T}. */
  type?: string;
  /** Which fire-once pattern, for event 'pattern'. */
  patternKey?: string;
  /** A kept verbatim answer, quoted into lines via {A}. */
  keptAnswer?: string;
  /** The player's transmission text, reflected into lines via {P}. */
  playerText?: string;

  // Richer context, consumed by LLMBrain (AuthoredBrain ignores it):
  taughtTotal?: number;
  corrections?: number;
  favoredType?: string | null;
  /** Kept verbatim answers, oldest first (capped by caller). */
  keptAnswers?: string[];
  /** Recent log excerpt (companion lines and player transmissions), oldest first. */
  recentTranscript?: string[];
};

/**
 * All methods are async: AuthoredBrain resolves immediately, LLMBrain after
 * on-device generation. Game code treats every brain identically.
 */
export interface CompanionBrain {
  /** May resolve null: the instrument is sometimes silent after routine events. */
  respond(event: CompanionEvent, context: CompanionContext): Promise<CompanionResponse | null>;
  /** Next unasked question for this register, or null when none remain. */
  nextQuestion(
    register: Register,
    askedIds: string[],
    context: CompanionContext
  ): Promise<{ id: string; response: CompanionResponse } | null>;
  /** Responds to a player-initiated transmission. */
  route(text: string, context: CompanionContext): Promise<CompanionResponse & { topic: string }>;
}
