/**
 * Local equirectangular projection around a fixed origin (the player's first
 * GPS fix). Not a global-scale projection — see docs/decisions.md
 * (2026-07-05, "Local projection instead of true Mercator math") before
 * changing this for a reason other than the play area outgrowing a few km.
 */

const METERS_PER_DEG_LAT = 111_320;

export type LatLon = { lat: number; lon: number };
export type LocalMeters = { x: number; y: number }; // x = east, y = north

export function metersPerDegLon(atLat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((atLat * Math.PI) / 180);
}

export function toLocalMeters(point: LatLon, origin: LatLon): LocalMeters {
  return {
    x: (point.lon - origin.lon) * metersPerDegLon(origin.lat),
    y: (point.lat - origin.lat) * METERS_PER_DEG_LAT,
  };
}

export function cellKeyFor(meters: LocalMeters, cellSizeM: number): string {
  const cx = Math.floor(meters.x / cellSizeM);
  const cy = Math.floor(meters.y / cellSizeM);
  return `${cx},${cy}`;
}

export function cellCoordsFor(meters: LocalMeters, cellSizeM: number): { cx: number; cy: number } {
  return { cx: Math.floor(meters.x / cellSizeM), cy: Math.floor(meters.y / cellSizeM) };
}
