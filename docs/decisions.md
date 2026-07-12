# Decisions Log

Deviations from `docs/brief.md`, and why. Newest first.

---

## 2026-07-11 — iOS minimum deployment target: 17.0

react-native-executorch (the on-device LLM runtime) requires iOS 17.0; Expo
SDK 54 defaults to 15.1, which failed the first dev-client build. Set via
expo-build-properties. Consequence for release: the App Store build requires
iOS 17+ (iPhone XS and newer, ~2018+) — an acceptable floor for v1; revisit
only if beta feedback surfaces older devices.

## 2026-07-08 — Companion model: Llama 3.2 3B (1B failed the audition)

Desktop-harness evaluation, same prompt modules the phone uses: 1B produced
one genuinely good question but could not hold the character — third-person
"the player" slips, invented player quotes, meta-commentary about its own
instructions. 3B held second person, engaged with the player's actual words,
asked back naturally, and improvised on-voice telemetry ("Calibration 4.2:
'Purpose and obligation'"). LLMBrain pins LLAMA3_2_3B_SPINQUANT (~2.5GB
download on first enable; 15 Pro-class hardware). Remaining prompt tuning
tracked in the harness; revisit model choice only if older devices must be
supported. Also hardened the system prompt from observed failures: not part
of the residue, never assert unstated player actions, "my model" not "your
model".

## 2026-07-08 — LLMBrain pulled forward from v1.5 (on-device model, director decision)

The director evaluated the authored corpus in the field and concluded the
"scripted responses" ceiling is the binding constraint on further voice
feedback — the LLM companion must be evaluable now. Decisions:

- **On-device only** (no API): Llama 3.2 1B instruct (QAT/LoRA quantized) via
  react-native-executorch behind the existing CompanionBrain interface, which
  became async. Nothing the player says leaves the device — privacy rule
  intact. AuthoredBrain remains the default and the per-call fallback whenever
  the model is unavailable or busy; a CORE toggle in the header switches
  brains (persisted in flags.brain_mode).
- **Voice enforcement is mechanical where it matters**: generated lines are
  post-processed — think-blocks stripped, capped at 4 sentences, and
  contractions EXPANDED pre-naming so the naming ceremony's tell cannot be
  spoiled by a model slip. The character itself lives in
  src/companion/systemPrompt.ts (voice-spec §5 as a system prompt + live play
  context: register, taught counts, corrections, favored type, kept verbatim
  answers, recent transcript).
- **Hard constraint**: executorch cannot run inside Expo Go. On-phone LLM
  requires an Expo dev-client build; installing one on the director's iPhone
  requires the Apple Developer Program ($99/yr) — which M5's TestFlight beta
  requires anyway. Until then, tools/companion-harness.ts runs the SAME
  system-prompt modules against the same model family (Llama 3.2 1B GGUF) on
  the desktop for voice evaluation and prompt tuning.

## 2026-07-07 — Conversational tone pass on the companion (voice spec intact)

Director field feedback: the companion read as "too obscure … scripted
responses," and the single unknown-transmission line repeated verbatim.
Changes, all within voice-spec bounds: (1) every router topic and the unknown
response became a register-banded POOL with repeat-avoidance (the unknown
single-line was a violation of the brief's own ≥8-variants rule); (2) unknown
responses and answer acks now reflect the player's words back ({P}/{A}
snippets — full text stays verbatim in the answers table) and end on questions
to the player; (3) wording across the router made plainer — curiosity aimed at
the player rather than delivered as pronouncements. The register arc
(INSTRUMENT→CURIOUS) and no-contractions-before-naming rules are unchanged.
Boundary note: an authored corpus is ultimately scripted; the real remedy for
"feels like a conversation" is the LLMBrain implementation the CompanionBrain
interface was built for (v1.5) — candidate for pulling forward after M5.

## 2026-07-07 — Audio plays through the iOS silent switch (deviation from §7's first reading)

Brief §7 says "respect silent switch conventions." First implementation used
the ambient session category (silent switch mutes the app) and the director
heard nothing across multiple field tests — a phone that lives in silent mode
makes the app appear silently broken, and nothing in the UI can even detect or
explain it. Convention among games is genuinely mixed; the app has its own
prominent mute toggle in the header. Switched to playsInSilentMode: true.
Revisit at M5: the settings/privacy screen should carry a "hardware silent
switch mutes the Lens" toggle, defaulting to on-through-silent.

## 2026-07-07 — Audio ships as rendered stems of the §7 spec (Expo Go limit)

Brief §3 names react-native-audio-api for live synthesis, but it contains
custom native code and cannot run in Expo Go (confirmed against its docs) —
and Expo Go is currently the only device path (see the SDK 54 entry). Brief §3
pre-authorizes the fallback: "ship rendered stems of the same spec and file an
issue to return." Implementation: `tools/render-audio-stems.mjs` is the §7
synth spec in executable form (a direct port of the prototype's Snd module —
same oscillators, envelopes, RBJ biquad filters, frequencies, mix levels); it
renders 13 WAV stems (22.05 kHz mono; everything in the spec is lowpassed
≤ ~1.1 kHz) into app/assets/audio, played via expo-audio behind the
`src/audio/engine.ts` facade. Game code only talks to the facade, so live
react-native-audio-api synthesis swaps in behind it at dev-build time (same
philosophy as CompanionBrain). Return condition: dev-client build (Apple
account or M5). This is the "filed issue" until a GitHub remote exists.

## 2026-07-07 — Camera dither applies at capture time, not per-frame (Expo Go limit)

Brief §2.2 calls for the live camera feed through the dither shader at 30fps.
Expo Go has no camera frame processors (that needs react-native-vision-camera
or an expo-gl camera texture in a dev-client build, which currently requires a
paid Apple developer account to install on the tester's iPhone). Honest v1-now
version per brief §9.5: live feed shows with a phosphor tint + the global
scanline/grain overlays; the full 128×96 luminance → Bayer 4×4 → 4-tone
phosphor dither applies to the captured still at scan resolution (the same
pipeline the reliquary thumbnails need anyway). Revisit when a dev-client
build becomes possible (Apple account, or M5 TestFlight); the prototype's
per-frame renderFeed() remains the reference.

## 2026-07-06 — Pinned to Expo SDK 54 (down from 57) to match the tester's Expo Go

The director's iPhone (iOS 26.5) can only get Expo Go supporting SDK 54 from
the App Store, and Expo Go is our only no-Mac, no-paid-Apple-account path to
on-device iOS testing (brief §9.4: optimize for the director's testing loop).
Downgraded expo ~57 → ~54 via `expo install --fix`; no source changes were
needed (the new expo-file-system File/Directory API, expo-sqlite async API,
and the Skia pixel APIs we use all exist in SDK 54). Revert condition: when
the App Store serves an SDK 55+ Expo Go, or when we move to EAS dev builds /
TestFlight distribution (M5), upgrade back to the latest SDK.

## 2026-07-06 — Added react-dom/react-native-web for local dev-loop only

Brief §3 targets iOS + Android from one codebase; web is not a shipping
platform. `react-dom` and `react-native-web` were added anyway so the app can
be smoke-tested with `npm run web` in environments without a device, emulator,
or Mac (this is how M1 was verified during development — no Android
SDK/emulator or iOS hardware was available). Real verification still requires
an EAS device build or an emulator — see the note in this file about what web
testing can't cover: `expo-file-system` and `expo-sqlite` do not work on web
(confirmed during M1 verification), so the terrain/GPS/persistence pipeline
only actually runs on native. If this trade-off stops being useful, drop both
packages and remove `"web"` from any platform arrays.

## 2026-07-05 — M1 scope: terrain only, no OSM vector/POI fetch yet

The brief's stack section (§3) describes fetching "OSM vector data + open
elevation tiles," but the M1 roadmap line (§8) only calls for "GPS, dithered
terrain from real tiles, fog+reveal, discovery XP." Interest points (§4) are
seeded from OSM POI tags but are not required until later milestones that
consume them (companion patterns, hazard/respect events, reliquary seeding).

Decision: M1 fetches only open elevation tiles (Terrarium PNG tiles via the
public AWS `elevation-tiles-prod` bucket, no API key) to build the dithered
heightfield. OSM vector/POI fetching is deferred to the milestone that first
needs it, to avoid building unused plumbing now. Tracked as future work.

## 2026-07-05 — Elevation source: Terrarium PNG tiles (AWS, public, keyless)

The brief names "Terrarium/AWS terrain tiles" as an example. Using
`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` at a
fixed zoom (z15, ~4.8 m/px at the equator) — no API key required, tiles are
cached to disk via `expo-file-system` after first fetch. Elevation is decoded
from the PNG's RGB channels per the Terrarium encoding:
`height = (R * 256 + G + B / 256) - 32768`.

## 2026-07-05 — Rendering: react-native-skia instead of HTML canvas

The prototype uses `<canvas>` + `ImageData` directly. React Native has no DOM
canvas. `@shopify/react-native-skia` gives per-pixel raster access
(`Skia.Surface`, `readPixels`/pixel buffers) close enough to port the
prototype's `bakeTerrain`/`revealAt`/dither loops almost line-for-line, so this
is the renderer for the terrain, fog, and (later) camera-dither pipelines.

## 2026-07-05 — Local projection instead of true Mercator math for player position

For a single walkable region at city scale (few km), lat/lon is projected to
local meters with a simple equirectangular approximation around a fixed origin
(the player's first GPS fix), not a full Web Mercator transform. This matches
the prototype's flat `WORLD` coordinate space and is accurate enough at this
scale; documented here so it isn't mistaken for a global-scale projection if
the world size grows later.
