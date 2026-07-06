/** Standard slippy-map (OSM/Terrarium) tile math. */

export type TileXY = { x: number; y: number };

export function lonLatToTileFractional(lat: number, lon: number, zoom: number): TileXY {
  const n = 2 ** zoom;
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/** Top-left corner (lat, lon) of a tile. */
export function tileTopLeftLonLat(tx: number, ty: number, zoom: number): { lat: number; lon: number } {
  const n = 2 ** zoom;
  const lon = (tx / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
  return { lat: (latRad * 180) / Math.PI, lon };
}

const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

/** Web Mercator meters-per-pixel at a given latitude and zoom (256px tiles). */
export function metersPerPixelAt(lat: number, zoom: number): number {
  return (EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180)) / (256 * 2 ** zoom);
}
