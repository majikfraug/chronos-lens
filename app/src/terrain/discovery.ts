import { FIELD } from '../config/economy';
import type { LocalMeters } from '../location/projection';

export type CoarseCell = { cx: number; cy: number; key: string; centerMeters: LocalMeters };

/**
 * The player's coarse cell and its 8 neighbors — the same 3x3 neighborhood
 * `accountReveal()` scans in the prototype, since the reveal radius can spill
 * into an adjacent cell without the player having entered it yet.
 */
export function neighborCoarseCells(playerMeters: LocalMeters, cellSizeM: number): CoarseCell[] {
  const pcx = Math.floor(playerMeters.x / cellSizeM);
  const pcy = Math.floor(playerMeters.y / cellSizeM);
  const cells: CoarseCell[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = pcx + dx;
      const cy = pcy + dy;
      cells.push({
        cx,
        cy,
        key: `${cx},${cy}`,
        centerMeters: { x: (cx + 0.5) * cellSizeM, y: (cy + 0.5) * cellSizeM },
      });
    }
  }
  return cells;
}

function parseCellKey(key: string): { cx: number; cy: number } {
  const [cx, cy] = key.split(',').map(Number);
  return { cx, cy };
}

/** XP for newly discovering `cellKey`, boosted the further it is from home — brief §2.1. */
export function discoveryXpFor(cellKey: string, homeCellKey: string): number {
  const cell = parseCellKey(cellKey);
  const home = parseCellKey(homeCellKey);
  const distanceCells = Math.hypot(cell.cx - home.cx, cell.cy - home.cy);
  const remoteBonus = Math.min(
    FIELD.discoveryXpRemoteBonusMax,
    Math.round(distanceCells * FIELD.discoveryXpRemoteBonusPerCell)
  );
  return FIELD.discoveryXpBase + remoteBonus;
}
