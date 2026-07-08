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

        CREATE TABLE IF NOT EXISTS flags (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ts INTEGER NOT NULL,
          scale TEXT NOT NULL,
          type TEXT NOT NULL,
          taught INTEGER NOT NULL DEFAULT 0,
          corrected INTEGER NOT NULL DEFAULT 0,
          thumb_path TEXT
        );

        CREATE TABLE IF NOT EXISTS ai_model (
          type TEXT PRIMARY KEY,
          taught_count INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS reliquary (
          type TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0,
          thumb_path TEXT,
          taught_first INTEGER NOT NULL DEFAULT 0
        );
        -- reliquary is legacy as of M3.1: slots now derive from scans directly
        -- so items can be renamed/reclassified/expunged. Kept for old installs.

        CREATE TABLE IF NOT EXISTS custom_types (
          name TEXT PRIMARY KEY,
          scale TEXT NOT NULL
        );
      `);
      // Additive migration for installs created before scans grew a player-given name.
      try {
        await db.execAsync('ALTER TABLE scans ADD COLUMN name TEXT');
      } catch {
        // column already exists
      }
      return db;
    });
  }
  return dbPromise;
}
