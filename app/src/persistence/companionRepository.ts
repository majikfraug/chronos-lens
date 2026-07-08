import { getDb } from './db';

export type KeptAnswer = { id: number; ts: number; question: string; answer: string };

export type CompanionPersisted = {
  answers: KeptAnswer[];
  askedQuestionIds: string[];
  firedPatterns: string[];
};

export async function loadCompanionState(): Promise<CompanionPersisted> {
  const db = await getDb();
  const [answers, asked, fired] = await Promise.all([
    db.getAllAsync<KeptAnswer>('SELECT * FROM answers ORDER BY ts ASC'),
    db.getAllAsync<{ id: string }>('SELECT id FROM asked_questions'),
    db.getAllAsync<{ key: string }>('SELECT key FROM patterns_fired'),
  ]);
  return {
    answers,
    askedQuestionIds: asked.map((r) => r.id),
    firedPatterns: fired.map((r) => r.key),
  };
}

/** The answer is stored exactly as transmitted — never trimmed beyond whitespace, never edited. */
export async function keepAnswer(question: string, answer: string): Promise<KeptAnswer> {
  const db = await getDb();
  const ts = Date.now();
  const result = await db.runAsync('INSERT INTO answers (ts, question, answer) VALUES (?, ?, ?)', [
    ts,
    question,
    answer,
  ]);
  return { id: result.lastInsertRowId, ts, question, answer };
}

export async function markQuestionAsked(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO asked_questions (id) VALUES (?)', [id]);
}

export async function markPatternFired(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO patterns_fired (key) VALUES (?)', [key]);
}
