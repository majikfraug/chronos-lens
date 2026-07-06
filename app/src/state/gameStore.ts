import { create } from 'zustand';
import {
  ATTUNEMENT_GAIN,
  ATTUNEMENT_MAX,
  FIELD,
  MAX_LEVEL,
  XP_THRESHOLDS,
  type Register,
  registerFor,
} from '../config/economy';
import {
  loadDiscoveredCells,
  loadGameState,
  loadRevealCells,
  markCellDiscovered,
  markRevealCell,
  saveOrigin,
  saveProgress,
} from '../persistence/gameRepository';
import { cellKeyFor, toLocalMeters, type LatLon } from '../location/projection';
import { discoveryXpFor, neighborCoarseCells } from '../terrain/discovery';

type GameStore = {
  hydrated: boolean;
  level: number;
  xp: number;
  attunement: number;
  origin: LatLon | null;
  homeCellKey: string | null;
  discoveredCells: Set<string>;
  revealedCells: Set<string>;
  playerPosition: LatLon | null;

  register: () => Register;
  xpToNext: () => { current: number; next: number } | null; // null once MAX_LEVEL

  hydrate: () => Promise<void>;
  /** The one entry point for a new GPS fix: sets origin (first fix), position, fog reveal, and discovery XP. */
  recordMovement: (point: LatLon) => Promise<void>;
  gainXp: (amount: number) => void;
  gainAttunement: (amount: number) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  hydrated: false,
  level: 1,
  xp: 0,
  attunement: 0,
  origin: null,
  homeCellKey: null,
  discoveredCells: new Set(),
  revealedCells: new Set(),
  playerPosition: null,

  register: () => registerFor(get().level, get().attunement),

  xpToNext: () => {
    const { level } = get();
    if (level >= MAX_LEVEL) return null;
    const current = level === 1 ? 0 : XP_THRESHOLDS[level - 2];
    const next = XP_THRESHOLDS[level - 1];
    return { current, next };
  },

  hydrate: async () => {
    const [persisted, discovered, revealed] = await Promise.all([
      loadGameState(),
      loadDiscoveredCells(),
      loadRevealCells(),
    ]);
    set({
      hydrated: true,
      level: persisted.level,
      xp: persisted.xp,
      attunement: persisted.attunement,
      origin:
        persisted.originLat != null && persisted.originLon != null
          ? { lat: persisted.originLat, lon: persisted.originLon }
          : null,
      homeCellKey: persisted.homeCellKey,
      discoveredCells: discovered,
      revealedCells: revealed,
    });
  },

  recordMovement: async (point) => {
    let { origin, homeCellKey } = get();
    if (!origin) {
      // The origin point is itself (0,0) in local meters, by definition.
      homeCellKey = cellKeyFor({ x: 0, y: 0 }, FIELD.cellSizeM);
      origin = point;
      set({ origin, homeCellKey, playerPosition: point });
      await saveOrigin(point.lat, point.lon, homeCellKey);
    } else {
      set({ playerPosition: point });
    }

    // origin and homeCellKey are always set together, so this is always non-null in practice.
    const resolvedHomeCellKey = homeCellKey ?? cellKeyFor({ x: 0, y: 0 }, FIELD.cellSizeM);
    const meters = toLocalMeters(point, origin);

    // Fog-of-war: finer snap grid so accumulated reveals read as continuous.
    const revealKey = cellKeyFor(meters, FIELD.revealSnapM);
    if (!get().revealedCells.has(revealKey)) {
      const next = new Set(get().revealedCells);
      next.add(revealKey);
      set({ revealedCells: next });
      void markRevealCell(revealKey);
    }

    // Discovery XP: coarse cell + its 8 neighbors, same as prototype accountReveal().
    for (const cell of neighborCoarseCells(meters, FIELD.cellSizeM)) {
      if (get().discoveredCells.has(cell.key)) continue;
      const distance = Math.hypot(cell.centerMeters.x - meters.x, cell.centerMeters.y - meters.y);
      if (distance > FIELD.revealRadiusM) continue;

      const next = new Set(get().discoveredCells);
      next.add(cell.key);
      set({ discoveredCells: next });
      void markCellDiscovered(cell.key);

      get().gainXp(discoveryXpFor(cell.key, resolvedHomeCellKey));
      get().gainAttunement(ATTUNEMENT_GAIN.discovery);
    }
  },

  gainXp: (amount) => {
    set((state) => {
      let xp = state.xp + amount;
      let level = state.level;
      while (level < MAX_LEVEL && xp >= XP_THRESHOLDS[level - 1]) {
        level += 1;
      }
      void saveProgress(level, xp, state.attunement);
      return { xp, level };
    });
  },

  gainAttunement: (amount) => {
    set((state) => {
      const attunement = Math.min(ATTUNEMENT_MAX, state.attunement + amount);
      void saveProgress(state.level, state.xp, attunement);
      return { attunement };
    });
  },
}));
