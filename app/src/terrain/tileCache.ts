import { Directory, File, Paths } from 'expo-file-system';

/**
 * Public, keyless elevation tiles (Terrarium PNG encoding) — see
 * docs/decisions.md, 2026-07-05 "Elevation source". Cached to disk forever;
 * elevation data for a tile never changes.
 */
function terrariumUrl(zoom: number, x: number, y: number): string {
  return `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${x}/${y}.png`;
}

let tilesDir: Directory | null = null;
function getTilesDir(): Directory {
  if (!tilesDir) tilesDir = new Directory(Paths.document, 'terrain-tiles');
  return tilesDir;
}

/** Downloads (if needed) and returns a local file:// URI for a tile's PNG. */
export async function getCachedTileUri(zoom: number, x: number, y: number): Promise<string> {
  const dir = new Directory(getTilesDir(), String(zoom), String(x));
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const file = new File(dir, `${y}.png`);
  if (file.exists) return file.uri;

  const downloaded = await File.downloadFileAsync(terrariumUrl(zoom, x, y), file, {
    idempotent: true,
  });
  return downloaded.uri;
}
