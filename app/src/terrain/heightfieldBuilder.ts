import { toLocalMeters, type LatLon, type LocalMeters } from '../location/projection';
import { decodeElevationTile, TILE_PX } from './elevationDecode';
import { getCachedTileUri } from './tileCache';
import { lonLatToTileFractional, metersPerPixelAt, tileTopLeftLonLat } from './tileMath';

export const TILE_ZOOM = 15;
/** 1 => a 3x3 tile composite around the player's tile. */
const GRID_RADIUS = 1;

export type Heightfield = {
  /** Texels per side of the square composite. */
  size: number;
  /** Row-major, size*size. heights[y*size+x], y increasing southward. */
  heights: Float32Array;
  /** Local meters (relative to the world origin) of texel [0,0] — the composite's NW corner. */
  originMeters: LocalMeters;
  metersPerPixel: number;
  centerTile: { x: number; y: number; zoom: number };
};

/**
 * Fetches the 3x3 tile neighborhood around the player and composites it into
 * one heightfield. Placement is an affine approximation (see
 * docs/decisions.md) — each tile is placed by its own top-left corner and a
 * constant meters-per-pixel, without correcting Mercator's per-pixel
 * north-south stretch within a tile. Negligible at zoom 15 / 256px tiles.
 */
export async function buildLocalHeightfield(
  playerPosition: LatLon,
  worldOrigin: LatLon,
  zoom = TILE_ZOOM
): Promise<Heightfield> {
  const { x: fx, y: fy } = lonLatToTileFractional(playerPosition.lat, playerPosition.lon, zoom);
  const centerTx = Math.floor(fx);
  const centerTy = Math.floor(fy);
  const gridSize = GRID_RADIUS * 2 + 1;
  const size = gridSize * TILE_PX;
  const heights = new Float32Array(size * size);

  const offsets: { i: number; j: number }[] = [];
  for (let j = -GRID_RADIUS; j <= GRID_RADIUS; j++) {
    for (let i = -GRID_RADIUS; i <= GRID_RADIUS; i++) {
      offsets.push({ i, j });
    }
  }

  await Promise.all(
    offsets.map(async ({ i, j }) => {
      const tx = centerTx + i;
      const ty = centerTy + j;
      const uri = await getCachedTileUri(zoom, tx, ty);
      const tileHeights = await decodeElevationTile(uri);
      const baseCol = (i + GRID_RADIUS) * TILE_PX;
      const baseRow = (j + GRID_RADIUS) * TILE_PX;
      for (let row = 0; row < TILE_PX; row++) {
        const srcOffset = row * TILE_PX;
        const destOffset = (baseRow + row) * size + baseCol;
        heights.set(tileHeights.subarray(srcOffset, srcOffset + TILE_PX), destOffset);
      }
    })
  );

  const nwCorner = tileTopLeftLonLat(centerTx - GRID_RADIUS, centerTy - GRID_RADIUS, zoom);
  const originMeters = toLocalMeters(nwCorner, worldOrigin);
  const metersPerPixel = metersPerPixelAt(playerPosition.lat, zoom);

  return {
    size,
    heights,
    originMeters,
    metersPerPixel,
    centerTile: { x: centerTx, y: centerTy, zoom },
  };
}
