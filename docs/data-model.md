# Data Model

The single `GameState` schema, persisted locally via `expo-sqlite`. Nothing in
this schema ever leaves the device in v1 (see brief §3, Privacy).

This document is grown milestone by milestone — it should always describe
what's actually implemented, not the full v1 target ahead of the code. Sections
marked **(planned)** are not yet implemented.

## M1 — Field / progression core

Table `game_state` (single row, key-value blob is fine at this size):

| field | type | notes |
|---|---|---|
| `level` | integer | 1–10, see `economy.ts` `XP_THRESHOLDS` |
| `xp` | integer | cumulative |
| `attunement` | integer | 0–100, gates register |
| `originLat` / `originLon` | real | the player's first GPS fix; local meter-space origin for the whole world coordinate system |
| `homeCellKey` | text | coarse-cell key of the origin, used to score "remote" cells for discovery XP |

Table `discovered_cells(cell_key TEXT PRIMARY KEY)`: coarse (~100 m) cells
already accounted for discovery XP — see `economy.ts` `FIELD.cellSizeM`.

Table `reveal_cells(cell_key TEXT PRIMARY KEY)`: fine (~20 m snap) cells the
fog-of-war has been revealed at — see `economy.ts` `FIELD.revealSnapM`.

Table `flags(key TEXT PRIMARY KEY, value TEXT)`: one-shot booleans and small
scalars (currently `intro_seen`).

Table `fog_reveal` (or a single PNG on disk, see below):

- The fog-of-war reveal mask is persisted as a raster (PNG) per world region on
  disk via `expo-file-system`, not as rows in SQLite — it's an image, and SQLite
  blob-per-frame would be wasteful. SQLite stores only the file path/region key.

## M3 — Reliquary / classification

- `scans(id, ts, scale, type, taught, corrected, thumb_path)` — every
  confirmed filing; `corrected` count is derived from here on load.
- `ai_model(type PRIMARY KEY, taught_count)` — the companion's entire
  classification model: player-taught example counts per type
  (identifications + confirmations + corrections). Drives proposal weighting
  and confidence; see `taxonomy.ts` `proposeType()`.
- `reliquary(type PRIMARY KEY, count, thumb_path, taught_first)` — slot state;
  `thumb_path` keeps the FIRST capture's dithered PNG (stored as files under
  `Paths.document/thumbs/`, only the URI lives in SQLite).
- "Recorded by others" counts are simulated authored constants
  (`taxonomy.ts` `SIMULATED_PUBLIC_COUNTS`) — no backend in v1, brief §2.4.

## (planned) M4 — Companion

- `companion_name` (null until L10 naming ceremony).
- `answers`: player's verbatim transmit answers, `{question, answer, keep,
  timestamp}` — re-surfaced at weighted moments, never paraphrased.
- `patterns_fired`, `echoes_fired`, `asked_registry` (site+register keys
  already asked about), `corrections_count`, `taught_total`.

## Coordinate system

World space is local meters from `(originLat, originLon)`, projected with an
equirectangular approximation (see `docs/decisions.md`, 2026-07-05 entry).
This is intentionally not a global projection — see that entry before changing
it for a reason that isn't "the play area got bigger than a few km."
