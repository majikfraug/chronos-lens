# THE CHRONOS-LENS

A location-based mobile AR-lite game. The player is a "Surveyor" cataloguing the
vanished world for a young machine intelligence, ~10,000 years hence, who has
no model of humanity except what this one player shows it.

This repo is open source from its first commit — the swappable companion
interface (`CompanionBrain`) is the real "bridge to the future" the game's
fiction gestures at. See [`docs/brief.md`](docs/brief.md) for the full design
and build constitution; that document is the source of truth for this project.

## Repo layout

- `/app` — the Expo (React Native + TypeScript) game client.
- `/docs` — brief, voice spec, data model, aesthetic/audio rules, decisions log.
- `/prototypes` — reference HTML prototypes (feel + algorithms; not imported wholesale).
- `/hardware` — LoRa companion hardware notes. Aspirational, v2+, not built yet.

## Getting started

```
cd app
npm install
npm run android   # or: npm run ios / npm run web
```

Location permission is required to test the Field map — this is a walk-outside game.

## Working agreements

- Read `docs/brief.md` and `docs/voice-spec.md` before writing companion dialogue,
  UI, or audio. New dialogue must pass the voice constitution (§5); new UI must
  pass the aesthetic constitution (§6); new sound must pass the audio constitution (§7).
- Small PRs per milestone task. Log any deviation from the brief, and why, in
  `docs/decisions.md`.
- Every milestone should produce a build the director (and sole playtester) can
  walk with outdoors.
- Position data and captures never leave the device in v1. No accounts.
