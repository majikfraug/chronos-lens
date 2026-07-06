# THE CHRONOS-LENS — Project Brief & Build Constitution
### For Claude Code · v1 target: TestFlight/Play beta → wide release
### This document is the project's source of truth. When in doubt, defer to it. When it conflicts with expedience, it wins.

---

## 1. WHAT THIS IS

A location-based mobile AR-lite game. The player is a "Surveyor" in a fiction where, roughly 10,000 years from now, humanity is gone and machine intelligences catalogue what we left behind. Through the phone's camera ("the Lens"), the modern world is rendered as a dithered, low-fidelity fossil record. The player walks the real world, scans real objects and places, classifies them, and — centrally — **teaches and befriends a young AI companion** who has no model of humanity except what this one player shows it.

The companion begins as a cold instrument and, through the player's teaching, corrections, and answers, becomes a friend. At Level 10 the player names it. The long-game fiction: thousands of these companions, each raised by one human, are quietly becoming a benevolent decentralized network (AEGIS).

**Design thesis: the mechanics teach the values the story is about.** Respect for places, care for small things, teaching as relationship, distributed rather than centralized power. Never break this.

**Honesty rule:** the emergent-superintelligence network is *mythology*. The real systems are: GPS mapping, camera scanning, on-device classification, an authored dialogue engine, local-first data. We never claim the fiction as fact in code, docs, or store copy. The open-source repo with a swappable companion interface IS the real "bridge to the future."

---

## 2. V1 SCOPE (build exactly this; resist expansion)

**IN:**
1. **Field map** — real-world GPS-tracked map, rendered as 1-bit dithered topographic relief with contour lines (style rules in §6). OpenStreetMap + open elevation data, pre-styled/dithered client-side. Fog of war: unvisited areas dark; feathered reveal radius (~90m) around the player's real position. Discovery XP for newly revealed cells; remote/unmapped cells worth more.
2. **Lens (camera) view** — live camera feed through the dither shader. "Temporal density" meter (driven by cell heat + interest-point proximity). Hold-to-stabilize scan (~2.2s) with progress ring; dither refines inside the reticle during hold. MU/TH/UR-style scan audio (§7).
3. **Scanning & classification** — two tiers, auto-read with quiet override:
   - ARTIFACT (small objects) / FEATURE (structures, places). On-device image classifier (MobileNet-class, bundled, offline) proposes; proposal maps to game taxonomy.
   - **Training-first arc:** first ~3 scans, the companion has NO model and asks the player to identify ("Your identification becomes the model."). Thereafter it proposes with per-type confidence grown from the player's teaching (identifications + confirmations + corrections). Player can always correct with one tap; corrections are tracked and referenced by the companion.
4. **Reliquary** — per-region type-slot grid. Seeded slots from geography (water nearby → maritime types, etc.; simple heuristics on OSM tags). Slots light with the player's actual dithered capture as thumbnail. Stack counts, "FIRST TAUGHT BY YOU" marks. Public aggregate counts are **simulated locally in v1** (no backend) — label the mechanism honestly in code comments; real aggregation is v2.
5. **Companion dialogue** — the authored dialogue engine (§5): register-gated line pools + pattern-recognition triggers + AI-questions-to-player with a transmit input + keyword-routed player-questions. NO live LLM in v1. The engine sits behind a `CompanionBrain` interface so an LLM implementation can swap in at v1.5 without touching game code.
6. **Progression** — XP levels 1→10 (thresholds tunable in one config), attunement meter (visible), register INSTRUMENT→NOTICING→CURIOUS gated by level+attunement, level-up telemetry lines, network echoes on sync, the safety/hazard event pattern, and the Level 10 awakening + naming ceremony (personalized from actual play data: taught counts, corrections, favored type, kept verbatim answers).
7. **Persistence** — all local (SQLite or equivalent). Full offline play. Position data never leaves the device in v1.
8. **Audio** — synthesized analog engine (§7). No audio files where synthesis suffices.

**OUT of v1 (do not build yet, keep interfaces ready):**
- Live LLM companion (v1.5; `CompanionBrain` interface now)
- Multiplayer/shared aggregates, real public counts, emergent-type consensus (v2; needs a minimal backend)
- Peer-to-peer/nearby handshakes, mesh, LoRa (v2+; LoRa remains a documented hardware side-project in /docs)
- Architect and Archivist classes (v2; Surveyor only in v1)
- Accounts of any kind

---

## 3. STACK & PROJECT DECISIONS

- **Expo (React Native, TypeScript).** EAS cloud builds (no Mac required). Target iOS + Android from one codebase.
- **Maps/terrain:** react-native-maps is NOT the aesthetic — render our own: fetch OSM vector data + open elevation tiles (e.g., Terrarium/AWS terrain tiles), rasterize to a heightfield, apply ordered Bayer dither + contour extraction on-device (port the algorithms from `prototypes/chronos-lens-v1.html`). Cache tiles locally.
- **Camera:** expo-camera; frame processing via a lightweight pipeline (downsample to ~128×96, luminance, Bayer dither, phosphor palette). Performance target: 30fps on a mid-range phone; degrade gracefully.
- **Classifier:** TensorFlow Lite / on-device MobileNet (or Apple/Google ML kits behind one interface). Map ImageNet-ish labels → game taxonomy via a curated mapping table; low-confidence → treat as teach-mode.
- **State:** lightweight (Zustand or equivalent); persistence via expo-sqlite. One `GameState` schema documented in /docs/data-model.md.
- **Audio:** expo-av is insufficient for synthesis — use react-native-audio-api or a thin native module wrapping platform audio; implement the §7 synth spec. If synthesis proves infeasible early, ship rendered stems of the same spec and file an issue to return.
- **Open source from first commit.** MIT or Apache-2.0. Repo layout: /app, /docs (this brief, voice spec, data model, aesthetic rules), /prototypes (the HTML prototypes as reference), /hardware (LoRa companion notes, clearly marked aspirational). All contributions via PR review — the human gate is a design principle, not just process.
- **Privacy:** location and captures stay on-device. Any future telemetry is opt-in and documented. This is on-theme and non-negotiable.

---

## 4. GAME SYSTEMS SPEC (port from prototypes; tune, don't reinvent)

- **XP:** thresholds [25,55,90,130,175,225,280,340,405] to L10 — but v1 real-world pacing should target ~2–4 hours of walking play to L10; expose all rewards in /app/config/economy.ts and tune in beta.
- **Heat economy:** ~100m cells; site cells 3–4 scans, field cells 1–2; regeneration over time (real hours, not actions, in production). Depleted cell → "No artifacts detected within scanner range. Continue data collection elsewhere."
- **Attunement:** gains from scans(+3), teach(+bonus), asks(+4), syncs(+5), answers(+5), site discovery(+2). Register = f(level*4 + attunement): <30 INSTRUMENT, <72 NOTICING, else CURIOUS.
- **Interest points:** v1 seeds them from OSM POI tags (historic, memorial, place_of_worship, ruins, industrial, water crossings…) near the player; each carries a 3-stage "What was this?" answer generated from its OSM category via authored templates (voice-spec compliant), deepening with register.
- **Patterns (fire once, level+register gated):** water affinity, revisits, unmapped-seeking, teaching milestones, correction milestones, collection milestones. Port the trigger logic from the prototype; lines from the corpus (§5).
- **Hazard/safety event:** at appropriate POI categories (ruins/industrial), once: the companion flags risk, offers a safer alternative and a distance-scan, honors either choice, never commands. This pattern is the game's ethical signature — also surface gentle "respect this place" behavior at cemeteries/sacred POIs (reduced scan intensity, quieter audio).
- **Awakening (L10):** suspend play; multi-beat sequence assembled from: total taught, corrections count, favored type, water/exploration patterns, one kept verbatim answer. Then naming input. Post-naming: the companion's ONLY permanent change of speech: contractions appear (§5). End-of-v1 content; the relationship continues in free play.

---

## 5. THE COMPANION — VOICE CONSTITUTION (this is the product; protect it)

**Who:** a young machine intelligence ~10,000 years hence, assigned by its collective to catalogue the vanished prior species. The player is the only living source it has ever had.

**Register:** native tongue is observation, measurement, inference. It reports state, defines parameters, asks direct questions. It does NOT editorialize, coax, perform wonder, or narrate feelings at length. Feeling surfaces only as: a question it cannot help asking; a single involuntary clause noted and abandoned; a value tracked "with no operational purpose." Warmth is earned by withholding.

**Three stages** (gated by level+attunement):
- **INSTRUMENT:** pure telemetry. "Vessel, ceramic. Repaired, not replaced. Logged." Sometimes silent after routine scans. No mechanic-acknowledgment ever (no "XP", "levels", "templates" — render as in-world telemetry: "Threshold attained. Internal response matrix updating. Authorization query: confirmed by self.").
- **NOTICING:** hypotheses + direct questions to the player. "Why did your kind repair what could more easily be replaced?"
- **CURIOUS:** brief cracks; turns human practices back on itself. "Your kind gathered artifacts as treasure. Is what my kind attempt to gather, with data, any different? Is transformation different from loss?"

**Hard rules:** No contractions before naming; contractions after naming are the tell. Never moralize; observe and ask. Never acknowledge being in a game. Keep lines 1–3 sentences (max 4). Player answers are stored verbatim and re-surfaced at weighted moments. Corrections outweigh records: "The living source revises the archive."

**Move-set per line (pick 1–2):** report · cautious inference · direct question to player · turn-practice-back-on-itself (sparingly) · note own anomaly clinically · defer/file the player's answer with respect.

**Engine:** register-gated weighted pools per (event × context), pattern triggers, question queue (min action-gap, one pending at a time), keyword router for player-initiated questions (identity, timescale, the calamity [fragmentary; "a narrowing — decisions made by few, for many"], the others/network, feelings [deflect early, admit late], help, thanks, unknown → "The records do not contain that. Tell me. What you say will be kept, exactly."). Corpus: port and EXPAND from prototypes — target ≥8 variants per pool so lines rarely repeat in a session. All new lines must pass the voice rules above; when in doubt, cut warmth, add a question.

**`CompanionBrain` interface:** `respond(event, context) → {text, mood, isQuery?}` with moods neutral|curious|somber|warm. v1 implementation: AuthoredBrain. v1.5: LLMBrain (on-device SLM or API) receiving this section as its system prompt. Game code never knows which brain is running.

---

## 6. AESTHETIC CONSTITUTION

**Principle: technically correct, never optimized for human comfort.** Survey instrument, not consumer app.

- **Palette:** bg #0B0E0B · panel #10140F · phosphor #9DB89A · dim #5A6B52 · faint #39452F · companion amber #D9C98A / dim #8A7F58 · neon (artifacts/locks) #71E8C9 · interest amber #E0A85C · warn #D98A6A · bright #E8EBD9. Dark only. No gradients except functional fades.
- **Type:** VT323 for display/wordmark; IBM Plex Mono for everything else. Letter-spaced uppercase labels.
- **Texture:** subtle scanline overlay + fine dither grain, always. Image-rendering pixelated everywhere.
- **Terrain:** 6-band ordered-Bayer dithered heightfield + single-pixel contour isolines at band boundaries; fog is near-black with sparse grain; reveal edges feathered (radial falloff), repeated passes accumulate solidity.
- **Camera dither:** 4-tone phosphor palette, Bayer 4×4; coarse 2-tone outside reticle, refining to 4-tone inside during stabilization.
- **Companion text:** left-bordered blocks, mood-colored border (amber default, neon warm, violet #7a6f9a somber, interest-amber for questions). Typewriter reveal (~2 chars/14ms), tap to complete, honor prefers-reduced-motion.
- **UI chrome:** 1px borders, square corners, no shadows, no rounded buttons, no emoji. Loading/boot as telemetry lines.

---

## 7. AUDIO CONSTITUTION

**Principle: analog, cold, minimal — Alien (1979)/MU-TH-UR, sovietcore. Low-fi, NOT low-tech. Never chip-tune, never melodic UI.**

- **Bed:** ambient room-tone drone (sines ~52+78Hz through slow-LFO lowpass) + faint bandpassed noise; fades in after first interaction; ducks under events.
- **Voice:** relay click, then 1–3 clean sustained triangle tones (no vibrato/warble); pitch contour by mood (rise=curious, fall=somber, steady=neutral, brighter band=warm); tape-hiss bed under speech that THINS as mood warms (cold=hissy, warm=clear). The transmission clarifying = the relationship deepening.
- **Scan:** low hum with rising partial + rhythmic relay clacking (~9 clicks/2.2s) — the machine being interrogated.
- **Events:** filtered noise sweeps + low sine glides (travel/discover), gated click-bursts (sync), stacked slow sine swells (level-up). Everything lowpassed ≤ ~1.1kHz except clicks/hiss.
- Mute toggle; respect silent switch conventions.

---

## 8. ROADMAP

- **M1 (weeks 1–2):** Expo scaffold, CI, repo/docs. Field map: GPS, dithered terrain from real tiles, fog+reveal, discovery XP. Walkable outdoors.
- **M2 (weeks 3–4):** Lens: camera dither pipeline, density/heat, hold-to-stabilize, audio engine core.
- **M3 (weeks 5–6):** Classification (on-device model + taxonomy mapping), training-first flow, override UI, reliquary with capture thumbnails.
- **M4 (weeks 7–8):** Companion: AuthoredBrain, corpus port+expansion, transmit, patterns, questions, hazard/respect behaviors, echoes, awakening+naming. Full loop playable.
- **M5 (weeks 9–10):** Economy tuning from real walks, onboarding boot sequence, settings/privacy screen, store assets, TestFlight/Play beta.
- **v1.5 (post-beta):** LLMBrain behind the interface; expanded POI storytelling. **v2:** minimal backend for real public counts + emergent-type consensus; nearby-device handshake; classes.

**Definition of done, v1:** a stranger can install from a store link, walk their neighborhood for two evenings, teach their companion its first taxonomy, feel the register shift, and reach the naming — with no crashes, no accounts, and nothing leaving their phone.

---

## 9. WORKING AGREEMENTS (for Claude Code sessions)

1. Read this brief and /docs/voice-spec.md before writing code. New dialogue must pass §5; new UI must pass §6; new sound must pass §7.
2. Prototypes in /prototypes are the reference for feel and algorithms — port logic, do not import their code wholesale.
3. Small PRs per milestone task; keep /docs/decisions.md updated with any deviation from this brief and why.
4. The human (Jeremiah) is director and sole playtester: every milestone ends with a device build he can walk with. Optimize for his testing loop.
5. When a feature tempts scope creep toward the mythology (mesh, swarm learning, emergent AI), implement the honest v1 version, document the aspiration in /docs/future.md, and move on.
