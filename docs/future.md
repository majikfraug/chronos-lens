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

## v2

- Minimal backend for **real public aggregate counts** and **emergent-type
  consensus** in the Reliquary. v1 simulates these locally and labels the
  mechanism honestly in code comments — see the Reliquary module once built.
- **Peer-to-peer / nearby-device handshakes**, mesh sync, "network echoes"
  backed by a real network rather than authored/simulated content.
- **Architect** and **Archivist** classes (Surveyor only in v1).
- Accounts of any kind (still none planned; v1's "no accounts" rule is a
  design principle, not just a v1 limitation, but revisit only if a real
  backend requires identity).

## v2+ / hardware side-project

- **LoRa companion hardware** — a physical device pairing, documented in
  `/hardware`. Explicitly a side-project, not on the mobile app roadmap.
