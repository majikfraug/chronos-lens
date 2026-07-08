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
};

export interface CompanionBrain {
  /** May return null: the instrument is sometimes silent after routine events. */
  respond(event: CompanionEvent, context: CompanionContext): CompanionResponse | null;
  /** Next unasked question for this register, or null when none remain. */
  nextQuestion(register: Register, askedIds: string[]): { id: string; response: CompanionResponse } | null;
  /** Routes a player-initiated transmission by keyword. */
  route(text: string, context: CompanionContext): CompanionResponse & { topic: string };
}
