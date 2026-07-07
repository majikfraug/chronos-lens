import { Directory, File, Paths } from 'expo-file-system';
import type { Scale, TypeName } from '../config/taxonomy';
import { getDb } from './db';

export type ReliquarySlot = {
  count: number;
  thumbUri: string | null;
  taughtFirst: boolean;
};

export type ClassifierState = {
  taughtCounts: Partial<Record<TypeName, number>>;
  taughtTotal: number;
  corrections: number;
  reliquary: Partial<Record<TypeName, ReliquarySlot>>;
};

export async function loadClassifierState(): Promise<ClassifierState> {
  const db = await getDb();
  const [modelRows, reliquaryRows, correctionRow] = await Promise.all([
    db.getAllAsync<{ type: string; taught_count: number }>('SELECT * FROM ai_model'),
    db.getAllAsync<{ type: string; count: number; thumb_path: string | null; taught_first: number }>(
      'SELECT * FROM reliquary'
    ),
    db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM scans WHERE corrected = 1'),
  ]);

  const taughtCounts: Partial<Record<TypeName, number>> = {};
  let taughtTotal = 0;
  for (const row of modelRows) {
    taughtCounts[row.type as TypeName] = row.taught_count;
    taughtTotal += row.taught_count;
  }

  const reliquary: Partial<Record<TypeName, ReliquarySlot>> = {};
  for (const row of reliquaryRows) {
    reliquary[row.type as TypeName] = {
      count: row.count,
      thumbUri: row.thumb_path,
      taughtFirst: row.taught_first === 1,
    };
  }

  return { taughtCounts, taughtTotal, corrections: correctionRow?.n ?? 0, reliquary };
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
  // First filing of a type keeps its thumbnail and whether the player taught it first.
  await db.runAsync(
    `INSERT INTO reliquary (type, count, thumb_path, taught_first) VALUES (?, 1, ?, ?)
     ON CONFLICT(type) DO UPDATE SET count = count + 1`,
    [args.type, args.thumbUri, args.taught || args.corrected ? 1 : 0]
  );
}
