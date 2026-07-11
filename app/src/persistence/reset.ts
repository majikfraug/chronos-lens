import { Directory, Paths } from 'expo-file-system';
import { getDb } from './db';

/**
 * Full survey reset: empties every gameplay table and deletes capture
 * thumbnails. The schema stays in place; flags are cleared wholesale (the
 * caller re-persists any device-level settings it wants to survive, e.g.
 * brain_mode). Irreversible by design — guard it in the UI.
 */
export async function wipeAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM game_state;
    DELETE FROM discovered_cells;
    DELETE FROM reveal_cells;
    DELETE FROM flags;
    DELETE FROM scans;
    DELETE FROM ai_model;
    DELETE FROM reliquary;
    DELETE FROM custom_types;
    DELETE FROM answers;
    DELETE FROM asked_questions;
    DELETE FROM patterns_fired;
  `);
  try {
    new Directory(Paths.document, 'thumbs').delete();
  } catch {
    // never created, or already gone
  }
}
