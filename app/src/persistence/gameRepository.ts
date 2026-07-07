import { getDb } from './db';

export type PersistedGameState = {
  level: number;
  xp: number;
  attunement: number;
  originLat: number | null;
  originLon: number | null;
  homeCellKey: string | null;
};

type GameStateRow = {
  level: number;
  xp: number;
  attunement: number;
  origin_lat: number | null;
  origin_lon: number | null;
  home_cell_key: string | null;
};

export async function loadGameState(): Promise<PersistedGameState> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO game_state (id) VALUES (1)');
  const row = await db.getFirstAsync<GameStateRow>('SELECT * FROM game_state WHERE id = 1');
  if (!row) {
    return { level: 1, xp: 0, attunement: 0, originLat: null, originLon: null, homeCellKey: null };
  }
  return {
    level: row.level,
    xp: row.xp,
    attunement: row.attunement,
    originLat: row.origin_lat,
    originLon: row.origin_lon,
    homeCellKey: row.home_cell_key,
  };
}

export async function saveProgress(level: number, xp: number, attunement: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE game_state SET level = ?, xp = ?, attunement = ? WHERE id = 1', [
    level,
    xp,
    attunement,
  ]);
}

export async function saveOrigin(lat: number, lon: number, homeCellKey: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE game_state SET origin_lat = ?, origin_lon = ?, home_cell_key = ? WHERE id = 1',
    [lat, lon, homeCellKey]
  );
}

export async function loadDiscoveredCells(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ cell_key: string }>('SELECT cell_key FROM discovered_cells');
  return new Set(rows.map((r) => r.cell_key));
}

export async function markCellDiscovered(cellKey: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO discovered_cells (cell_key) VALUES (?)', [cellKey]);
}

export async function getFlag(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM flags WHERE key = ?', [
    key,
  ]);
  return row?.value ?? null;
}

export async function setFlag(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO flags (key, value) VALUES (?, ?)', [key, value]);
}

/** Finer-grained "has fog been revealed here" cells — see fogReveal.ts. */
export async function loadRevealCells(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ cell_key: string }>('SELECT cell_key FROM reveal_cells');
  return new Set(rows.map((r) => r.cell_key));
}

export async function markRevealCell(cellKey: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO reveal_cells (cell_key) VALUES (?)', [cellKey]);
}
