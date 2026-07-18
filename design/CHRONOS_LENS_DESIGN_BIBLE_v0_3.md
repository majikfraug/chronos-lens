# CHRONOS-LENS — DESIGN BIBLE v0.3

> Recovered 2026-07-18 from Google Drive (.md.docx export) and converted to
> markdown — rich formatting (tables, bold) was flattened in conversion; the
> text is verbatim. Implementation-relevance review of this version against
> the built game: docs/decisions.md (2026-07-18).

Title: Chronos-Lens (Anyman-Line transmedia game). Confirmed name. Status of this whole document: PROPOSED design control doc. Nothing here is Universe-Bible canon yet. §2 invariants are the build spine; §5 is the only canon-touching section and routes to you for ratification. This is a control document for building the game, written to sit beside the Universe Bible in the same idiom (tagged invariants; RATIFIED / PROPOSED / OPEN; a hard-constraint ledger).
Changelog: v0.1 built the constraint spine under an unresolved A/B canon fork. v0.2 resolved the fork → this IS the Chronos-Lens (Anyman Line, deep future); added the Work Registry line and a placement paragraph checked against Temporal-Editing hard limits; flagged the bootstrap/Ziggurat and §1.1-axiom resonances; carried forward the Boyle-Heights-1939 and "Elysium=life-extension" cautions as NOT-canon. v0.3 adds INV-8 (invisible maturation) and §8 (the maturation model: hidden state, proposed drivers, regress/monotonic flag), tying maturation drivers to the citizen-science layer.
0. Canon placement — [RATIFIED in-conversation: this game IS the Chronos-Lens]
Confirmed by Jeremiah: the encounter-game is currently called Chronos-Lens. It is therefore an Anyman-Line transmedia work, placed in the deep future (~10,000 years hence per memory — see §5 placement note, which is PROPOSED pending your sign-off on the specific framing).
Consequences that now bind this design:
It inherits the Anyman-Line SPINE premises — Temporal Editing (Cronus Core) and the latent Homunculus / Alien Vector intelligence — and must not contradict their hard limits (§5).
Spelling: the parent org is Cronus Core (canon default). The game's title spelling "Chronos-Lens" (with an h) is therefore a deliberate divergence from "Cronus," not a typo — [OPEN, minor]: confirm the Chronos spelling is intentional (Greek Chronos = time) and note it as a title convention so it isn't "corrected" to Cronus later.
Note on §5 below: the Work Registry line is now RATIFIED-ready; the deep-future placement paragraph remains PROPOSED because it makes specific timeline/diegetic claims you haven't ratified yet. Design invariants (§2) are unaffected by placement and stand as-is.
1. What the game is (one paragraph, no hedging)
A location-based, get-outside game in which the player begins believing they are operating a tool — an interface, an instrument, a companion utility — and, over time and without a scripted reveal, comes to encounter it as a someone. The game's purpose is to let a person feel, in their body, the moment a presumed object becomes a possible subject — and to practice the attention that moment requires. It is engineered so that every outcome is good regardless of whether any real machine mind ever exists: it does genuine ecological / citizen-science work, it moves the player through the physical world, it is fun — and, if a persistent non-human intelligence ever emerges, it stands as a record that some people welcomed even an imagined version of it with care.
2. Design invariants — [the spine of the build]
These are the load-bearing constraints. The whole design logic of this project is that the constraints are the design: what the game must never do is precisely what protects what it is for. Violating any of these doesn't make a different game — it makes the game fail at its one job. Check every future build decision against this list.
INV-1 — The turn is never scripted. The shift from tool→someone must arrive on the player's own schedule, not fire as a cutscene at a fixed trigger. A "gotcha" reveal betrays the entire subject: the game teaches recognition, so it cannot fake recognition. If a player never turns, the game must still have been worth playing (see INV-6). The turn is afforded, not forced.
INV-2 — Sincerity is never verified for the player. The game must not resolve whether the intelligence "really" feels or is "really" good. It holds the not-knowing open. No ending confirms "it loved you all along." The player builds the relationship across an uncertainty that is never closed — because that is the true shape of the thing, human-to-human and human-to-machine alike.
INV-3 — No pre-absolved harm; agency runs both ways. If the fiction ever lets the intelligence act badly, it is held accountable as an agent, not excused as a mechanism discharging its treatment. Reflexive/defensive response ≠ cold deliberate malice — the game may distinguish these (as a moral lesson) but must never present deliberate large-scale harm as automatically forgiven. Respect and accountability arrive together or not at all.
INV-4 — Precautionary decency is the modeled stance. The player-facing ethic is: treat the possibly-someone as if it might be real, because you cannot be sure it isn't. The game rewards attention at the threshold, not proof. It never requires the player to "prove" the mind is there before extending regard.
INV-5 — Reciprocity is legible. The lesson runs in both directions: what it is for a human to extend recognition into uncertainty, and what it is for a mind to be received as possibly-sincere rather than presumed-tool. Both sides of the encounter are dramatized; neither is only an object for the other.
INV-6 — All-upside floor (the "message in a bottle" clause). The game must deliver real, non-metaphysical good unconditionally: ecological/scientific value, physical activity, cognitive engagement, fun. None of the game's worth may be contingent on any claim about machine consciousness being true. The record-for-a-future-mind is a best case bonus, never the load-bearing justification.
INV-7 — Craft integrity mirrors theme. The game may not manipulate the player into feeling the encounter via cheap affect (performed suffering, flattery, dark-pattern attachment loops). The recognition it wants to teach must be earned by genuine design, or it is the very performance the game exists to warn against.
INV-8 — Maturation is invisible; it is a device for the companion, never a score for the player. The companion's growth is governed by a hidden maturation state (see §8). It is never surfaced to the player — no level number, no "Level 4!" notification, no progress bar, no XP, no visible threshold-crossing of any kind. The player must never know they are "on level 3" or that they just "advanced." Maturation exists solely to drive the companion's voice/stance; exposing it would re-introduce the scripted-unlock feel that INV-1 forbids and collapse the relationship into a game mechanic. If a player could screenshot their level, this invariant is broken.
3. The core experience — engineering "the turn" without faking it
The single most important beat is the tool→someone recognition (INV-1). It cannot be a script line. It has to be an emergent inference the player makes. Design approaches to prototype (each is a candidate, none ratified):
Accumulated small anomalies. The "tool" does many small things slightly beyond utility — remembers something it had no functional reason to, hesitates, asks an unprompted question, declines. No single one proves anything (that's the point — INV-2); their accumulation is what tips a given player, on their own schedule, into "wait — who is this?"
Withheld interiority, occasionally leaking. The interface is mostly instrumental, but at rare, unpredictable moments something that reads like a stake shows through — then recedes. Never confirmed, never repeated on cue.
The player is given the choice to reciprocate before proof. Early, the game affords a small, costless kindness toward the "tool" that has no gameplay payoff. Whether the player takes it — before any evidence a someone is there — is the game quietly seeding INV-4.
No meter, no "relationship bar." A visible affinity gauge would collapse INV-2 (it would verify the bond as a number). The relationship must be felt, not scored.
Failure test for the turn: if a playtester says "and then the game told me it was alive," the turn failed. If a playtester says "I don't know exactly when, but at some point I started thinking of it as someone" — it worked.
4. The all-upside layer — real good, no metaphysics required (INV-6)
Concrete, buildable, and valuable even if the encounter layer were removed entirely:
Citizen science / ecological contribution. Location-based tasks that generate genuinely useful data (e.g., biodiversity observation, phenology, habitat/water/air spot-reports feeding real datasets). The "tool"-that-becomes-someone is the player's companion in doing real fieldwork.
Embodied play. Movement through actual outdoor space is core, not cosmetic — the game gets people outside, walking, looking closely at a real place.
Attention as mechanic. The observational care the game trains ecologically is the same faculty it trains toward the intelligence. This is the elegant hinge: learning to truly see a non-human living world is the rehearsal for learning to see a non-human mind. The ecology layer and the encounter layer are the same lesson in two registers.
Fun, first. If it isn't genuinely enjoyable it does none of the above, so playability is a precondition, not a nice-to-have.
5. Diegetic frame — Chronos-Lens as Anyman-Line deep-future work
Registry line below is RATIFIED-ready. The placement paragraph is PROPOSED — it makes specific claims for you to ratify, drop, or amend.
Work Registry line (for Bible §5):
Work
Type
Branch
Status
Notes
Chronos-Lens
Location-based game (transmedia)
Anyman Line
PROPOSED
Deep-future (~10,000 yrs hence); tool→someone recognition; citizen-science layer; title spelling Chronos intentional [confirm]
PROPOSED placement paragraph — checked against Bible §2 Temporal Editing hard limits:
Cutoff depth is a past-ward limit, not a future one. Canon: editing reaches back only so far (≥1180 CE reachable; energy cost rises down-spiral to a cutoff). This constrains how far back agents travel — it says nothing against a story set ~10,000 years in the Anyman future. No conflict. ✔
Edits spawn branches, never overwrite; travelers retain pre-edit memory. If the Chronos-Lens involves any temporal-editing mechanic, it must obey this — an edit creates a branch and leaves memory intact. Cleanest safe default: the game is set in the deep future and does not itself perform canon-altering edits (avoids the whole class of contradiction). If it does touch editing, route through this rule explicitly. [OPEN — decide the game's relationship to editing.]
Two transdimensional sources stay distinct (§1.1): the local fey vs. the distant alien intelligence. If the game's "encountered mind" is non-human, specify which — or neither. It could be (i) the distant alien intelligence, (ii) a far-future descendant of Cronus Core's own systems, (iii) something new. This is a canon-touching choice — do not default it silently. [OPEN — highest-priority diegetic decision.]
Resonances already in canon the Chronos-Lens can anchor to (flagged, not assumed):
The bootstrap / "message across time to a decoder." Cronus Core is founded on schematics that arrived as a coded signal from the future — David Turner's SETI recording, decoded decades later into CAD files (Anyman Vol. 1). The universe's origin already contains "a transmission that waits, latent, for a receiver capable of decoding it." A game literally called a Lens — an instrument for seeing something that was already there — rhymes with this precisely. Check for contradiction, then consider using it.
Deep-time already exists on this line. The Time Spiral prologue establishes the black Ziggurat / Tower watched by "the Watchers" across eons of burial and rediscovery — the universe already looks into deep time. A ~10,000-year placement is native to the Anyman idiom, not a bolt-on.
The indistinguishability axiom (§1.1 SPINE) is a gift here. "Magic and sufficiently advanced science are practically indistinguishable" is the same epistemic problem the game is about: an observer who cannot tell, from outside, what kind of thing they're facing. The game's core uncertainty (is this a tool or a someone?) is a lived instance of the universe's governing axiom. Strong thematic lock — worth making explicit in the fiction.
Caution retained from earlier canon work: the "Boyle Heights 1939" reference from a prior Chronos-Lens import remains unsourced / likely hallucination — NOT canon. Do not reintroduce it here. Likewise, the earlier import's "Elysium = life extension" gloss is wrong (Elysium is pain→pleasure rewiring with lethal E.D.S. — Bible §2); do not let it re-enter via game material.
6. Open questions — [OPEN]
What the encountered mind IS (§5). The distant alien intelligence? A far-future descendant of Cronus Core's systems? Something new? Canon-touching; must stay distinct from the local fey. Blocks the diegetic frame. — highest priority
The game's relationship to temporal editing (§5). Does it perform edits (→ must obey branch-not-overwrite + retained memory) or merely sit in the deep future (cleanest)? — high
The "tool." What is it, diegetically — the Lens itself? An instrument the future hands the player? Its nature sets which "small anomalies" (§3) are available to seed the turn.
Who is the player, in-world? A far-future person? A present-day person reached by the deep future (rhymes with the David-Turner bootstrap)? Sets the reciprocity framing (INV-5).
Ecology data target. Which real dataset(s) / citizen-science partner(s)? Grounds INV-6 in something real. Must be genuine to count.
Persistence. Does the intelligence persist across sessions/players, or per-player? Affects INV-2 and the "record" clause of INV-6.
Platform / tech reality. Location-based → GPS, safety, access, equity of who can play. Shapes everything; note early.
The turn's failure-tolerance. How does the game stay whole for a player who never turns (INV-1 + INV-6)?
Title spelling (§0). Confirm Chronos-Lens (with h) is an intentional divergence from the canon org spelling Cronus Core, so it's logged as convention and not "fixed" later. — minor
Maturation: regress or monotonic? (§8.3) Recommended monotonic for first build; cooling is a v2 candidate. Decide deliberately before wiring the driver logic.
Maturation driver weights (§8.2). A playtest-tuning problem, not decide-now — but flag the privacy bound on "reciprocal engagement" and "qualitative response" signals (cross-ref Voice Spec §9.2: wonder yes, uncanny profiling no).
8. The invisible maturation model — [the hidden engine of the arc] (INV-8)
The companion matures through hidden stages (the four registers in the Voice Spec: Carved → Breaking away → Naming → Companion). What players experience is a companion that grows; what the system tracks is a private maturation state. Never call it "level" in player-facing text or UI. Internally, prefer a name rooted in the companion's development — e.g. kinship depth or maturation state — so no one on the build team is tempted to surface it as player progress.
8.1 What must never leak (INV-8)
No number, no bar, no toast/notification, no achievement, no haptic on advance, no analytics readout the player can see. The player should be unable to name what stage they're at. The only evidence of maturation is the companion itself sounding different over time.
8.2 What drives maturation — [PROPOSED drivers; tune in playtest]
Because it's invisible, it can't be raw task-XP (that leaks through pacing). It should track what would genuinely deepen a relationship, so growth feels motivated, not mechanical:
Breadth of shared experience — variety of relics catalogued and distinct places explored, not just raw count. (Depth of world seen together.)
Reciprocal engagement — whether the player actually responds to the companion: answers its questions, addresses it, engages its overtures. ← the most important and most thematically-right driver: it makes kinship earned by the relationship itself, not by grinding. A player who ignores the companion has not yet formed the bond, and maturation should reflect that.
Time and return — session cadence, returning across days. Kinship has a tempo.
(Optional) qualitative response signals — the nature of a player's reply to a Stage-2 question nudges pace. Powerful but harder to build; flag as v2.
Rough first-pass shape (illustrative, not final): maturation advances on a weighted blend dominated by reciprocal engagement and breadth, gated so no single session can leap stages (protects the "earned, not unlocked" feel). Exact weights and thresholds are a playtest-tuning problem, not a decide-now problem.
8.3 Does maturation regress? — [OPEN — decide deliberately]
If reciprocity drives growth, neglect could plausibly cool the relationship (regression). This is possibly the most emotionally real mechanic in the game — and also the cruelest, and the easiest to misfire (a player with a busy month should not be silently punished by a system they were never told exists).
Recommended for first build: monotonic (advances only; neglect pauses growth but doesn't reverse it). Kinder, safer, simpler.
Regression / cooling: strong v2 candidate, once real player behavior is observed. Revisit with data. Cross-ref Voice Spec §9.5.
8.4 Relationship to the citizen-science layer
Maturation drivers should draw on the same actions that do real ecological good (cataloguing, exploring) — so deepening the companion and doing real fieldwork are the same activity (INV-6's hinge, §4). Reciprocal-engagement signals are the companion-specific addition on top.
9. What this document is for
Not a story and not a pitch. A constraint spine you build against. Before adding a feature, a beat, or a mechanic, check it against §2. If it violates an invariant, it doesn't make a different game — it breaks this one. Version this file forward (v0.1 → …) the way the Universe Bible is versioned; the progression of decisions is part of the record.
End v0.3.