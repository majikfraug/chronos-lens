# Future / Out of v1 Scope

Anything here is aspirational or deferred. Do not build it early just because
it's easy to imagine — see brief §9.5. When a feature tempts scope creep
toward the AEGIS mythology (mesh, swarm learning, emergent AI consensus),
implement the honest, non-mythological v1 version and log the aspiration here
instead.

## v1.5

- **LLMBrain** — an on-device SLM or API-backed implementation of
  `CompanionBrain`, receiving `docs/voice-spec.md` (§5 of the brief) as its
  system prompt. Game code does not change; only the brain implementation
  swaps in behind the existing interface.
- Expanded POI storytelling (deeper per-category "what was this" content).

## M4 (committed roadmap, noting director requests 2026-07-07)

- **Per-relic conversations** — a filed scan should be able to open a short
  companion exchange about that specific object (question queue keyed to the
  relic, player answers stored verbatim and re-surfaced). This is the dialogue
  engine's job; the M3 ack/first-of-type lines are its placeholder.

## v2

- Minimal backend for **real public aggregate counts** and **emergent-type
  consensus** in the Reliquary. v1 simulates these locally and labels the
  mechanism honestly in code comments — see the Reliquary module once built.
  Director's framing (2026-07-07): user-defined categories (shipped locally
  in v1) should eventually merge across players by consensus — "wiki"-style
  additions where a category or naming stabilizes when enough Surveyors
  independently attest it.
- **External verification** — for natural forms especially (plant/animal
  taxonomy), check a capture against a real reference database (e.g. an
  iNaturalist-class API) so the companion can say "your identification is
  corroborated by the wider record." Needs network + a backend proxy; also
  pairs with the real on-device classifier (dev-build TFLite path).
- **Peer-to-peer / nearby-device handshakes**, mesh sync, "network echoes"
  backed by a real network rather than authored/simulated content.
- **Architect** and **Archivist** classes (Surveyor only in v1).
- Accounts of any kind (still none planned; v1's "no accounts" rule is a
  design principle, not just a v1 limitation, but revisit only if a real
  backend requires identity).

## v2+ / hardware side-project

- **LoRa companion hardware** — a physical device pairing, documented in
  `/hardware`. Explicitly a side-project, not on the mobile app roadmap.
