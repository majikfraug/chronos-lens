import { Directory, File, Paths } from 'expo-file-system';
import type { CustomType, Scale, TypeName } from '../config/taxonomy';
import { getDb } from './db';

export type ReliquarySlot = {
  count: number;
  thumbUri: string | null;
  taughtFirst: boolean;
  /** Timestamp of the most recent filing — drives the RECENT sort. */
  lastTs: number;
};

export type ScanRecord = {
  id: number;
  ts: number;
  scale: Scale;
  type: TypeName;
  taught: boolean;
  corrected: boolean;
  thumbUri: string | null;
  name: string | null;
};

export type ClassifierState = {
  taughtCounts: Partial<Record<TypeName, number>>;
  taughtTotal: number;
  corrections: number;
  reliquary: Partial<Record<TypeName, ReliquarySlot>>;
  customTypes: CustomType[];
};

/**
 * Reliquary slots derive from the scans table (not a separate aggregate),
 * so renaming/reclassifying/expunging individual filings stays consistent.
 */
export async function loadClassifierState(): Promise<ClassifierState> {
  const db = await getDb();
  const [modelRows, slotRows, correctionRow, customRows] = await Promise.all([
    db.getAllAsync<{ type: string; taught_count: number }>('SELECT * FROM ai_model'),
    db.getAllAsync<{
      type: string;
      n: number;
      first_thumb: string | null;
      first_taught: number;
      last_ts: number;
    }>(
      `SELECT type, COUNT(*) AS n, MAX(ts) AS last_ts,
              (SELECT thumb_path FROM scans s2 WHERE s2.type = s1.type ORDER BY ts ASC LIMIT 1) AS first_thumb,
              (SELECT taught + corrected FROM scans s3 WHERE s3.type = s1.type ORDER BY ts ASC LIMIT 1) AS first_taught
       FROM scans s1 GROUP BY type`
    ),
    db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM scans WHERE corrected = 1'),
    db.getAllAsync<{ name: string; scale: string }>('SELECT * FROM custom_types'),
  ]);

  const taughtCounts: Partial<Record<TypeName, number>> = {};
  let taughtTotal = 0;
  for (const row of modelRows) {
    taughtCounts[row.type] = row.taught_count;
    taughtTotal += row.taught_count;
  }

  const reliquary: Partial<Record<TypeName, ReliquarySlot>> = {};
  for (const row of slotRows) {
    reliquary[row.type] = {
      count: row.n,
      thumbUri: row.first_thumb,
      taughtFirst: row.first_taught > 0,
      lastTs: row.last_ts,
    };
  }

  return {
    taughtCounts,
    taughtTotal,
    corrections: correctionRow?.n ?? 0,
    reliquary,
    customTypes: customRows.map((r) => ({ name: r.name, scale: r.scale as Scale })),
  };
}

/** Writes the dithered capture PNG to disk and returns its file URI. */
export function saveThumbnail(png: Uint8Array): string {
  const dir = new Directory(Paths.document, 'thumbs');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `scan-${Date.now()}-${Math.floor(Math.random() * 1e6)}.png`);
  file.write(png);
  return file.uri;
}

export async function recordScan(args: {
  scale: Scale;
  type: TypeName;
  taught: boolean;
  corrected: boolean;
  thumbUri: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO scans (ts, scale, type, taught, corrected, thumb_path) VALUES (?, ?, ?, ?, ?, ?)',
    [Date.now(), args.scale, args.type, args.taught ? 1 : 0, args.corrected ? 1 : 0, args.thumbUri]
  );
  await db.runAsync(
    `INSERT INTO ai_model (type, taught_count) VALUES (?, 1)
     ON CONFLICT(type) DO UPDATE SET taught_count = taught_count + 1`,
    [args.type]
  );
}

export async function addCustomType(name: string, scale: Scale): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO custom_types (name, scale) VALUES (?, ?)', [
    name,
    scale,
  ]);
}

/**
 * Renames a player-defined category, carrying its scans and its weight in the
 * taught model along. Renaming onto an existing type merges into it.
 */
export async function renameCustomType(oldName: TypeName, newName: TypeName): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ scale: string }>(
    'SELECT scale FROM custom_types WHERE name = ?',
    [oldName]
  );
  if (!row || oldName === newName) return;
  await db.runAsync('INSERT OR IGNORE INTO custom_types (name, scale) VALUES (?, ?)', [
    newName,
    row.scale,
  ]);
  await db.runAsync('DELETE FROM custom_types WHERE name = ?', [oldName]);
  await db.runAsync('UPDATE scans SET type = ? WHERE type = ?', [newName, oldName]);
  const model = await db.getFirstAsync<{ taught_count: number }>(
    'SELECT taught_count FROM ai_model WHERE type = ?',
    [oldName]
  );
  if (model) {
    await db.runAsync(
      `INSERT INTO ai_model (type, taught_count) VALUES (?, ?)
       ON CONFLICT(type) DO UPDATE SET taught_count = taught_count + ?`,
      [newName, model.taught_count, model.taught_count]
    );
    await db.runAsync('DELETE FROM ai_model WHERE type = ?', [oldName]);
  }
}

/** Deletes an EMPTY player-defined category. Returns false if it still holds records. */
export async function deleteCustomType(name: TypeName): Promise<boolean> {
  const db = await getDb();
  const held = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM scans WHERE type = ?',
    [name]
  );
  if ((held?.n ?? 0) > 0) return false;
  await db.runAsync('DELETE FROM custom_types WHERE name = ?', [name]);
  await db.runAsync('DELETE FROM ai_model WHERE type = ?', [name]);
  return true;
}

export async function listScansOfType(type: TypeName): Promise<ScanRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    ts: number;
    scale: string;
    type: string;
    taught: number;
    corrected: number;
    thumb_path: string | null;
    name: string | null;
  }>('SELECT * FROM scans WHERE type = ? ORDER BY ts DESC', [type]);
  return rows.map((r) => ({
    id: r.id,
    ts: r.ts,
    scale: r.scale as Scale,
    type: r.type,
    taught: r.taught === 1,
    corrected: r.corrected === 1,
    thumbUri: r.thumb_path,
    name: r.name,
  }));
}

export async function renameScan(id: number, name: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE scans SET name = ? WHERE id = ?', [name, id]);
}

/** Moving a filing between types also moves its weight in the taught model. */
export async function reclassifyScan(id: number, newType: TypeName): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ type: string }>('SELECT type FROM scans WHERE id = ?', [id]);
  if (!row || row.type === newType) return;
  await db.runAsync('UPDATE scans SET type = ?, corrected = 1 WHERE id = ?', [newType, id]);
  await db.runAsync(
    'UPDATE ai_model SET taught_count = MAX(0, taught_count - 1) WHERE type = ?',
    [row.type]
  );
  await db.runAsync(
    `INSERT INTO ai_model (type, taught_count) VALUES (?, 1)
     ON CONFLICT(type) DO UPDATE SET taught_count = taught_count + 1`,
    [newType]
  );
}

/** Expunging removes the filing, its model weight, and its thumbnail file. */
export async function deleteScan(id: number): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ type: string; thumb_path: string | null }>(
    'SELECT type, thumb_path FROM scans WHERE id = ?',
    [id]
  );
  if (!row) return;
  await db.runAsync('DELETE FROM scans WHERE id = ?', [id]);
  await db.runAsync(
    'UPDATE ai_model SET taught_count = MAX(0, taught_count - 1) WHERE type = ?',
    [row.type]
  );
  if (row.thumb_path) {
    try {
      new File(row.thumb_path).delete();
    } catch {
      // already gone
    }
  }
}
