import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let dbPromise: Promise<SQLiteDatabase> | null = null;

/** The one local database for GameState. See docs/data-model.md. */
export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('chronos-lens.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          level INTEGER NOT NULL DEFAULT 1,
          xp INTEGER NOT NULL DEFAULT 0,
          attunement INTEGER NOT NULL DEFAULT 0,
          origin_lat REAL,
          origin_lon REAL,
          home_cell_key TEXT
        );

        CREATE TABLE IF NOT EXISTS discovered_cells (
          cell_key TEXT PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS reveal_cells (
          cell_key TEXT PRIMARY KEY
        );
      `);
      return db;
    });
  }
  return dbPromise;
}
