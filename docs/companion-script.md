# CHRONOS-LENS — Companion Dialogue Script
Generated from the live corpus — do not fear editing; IDs are the contract.

**How to edit:** change the text after any [id]; change the (mood) — neutral|curious|somber|warm;
[N+]/[C+] = minimum register NOTICING/CURIOUS (absent = available from the start).
Delete a line to remove it; add "[new] (mood) text" under a section to add one.
Placeholders: {T} = confirmed type (lowercase) · {A} = a kept player answer · {P} = the player's words.
Voice rules still apply on my side: 1–4 sentences, plain speech, no flattery.
(The contraction tell was retired 2026-07-12; naming changes stance, not speech mechanics.)

## FIRST BOOT (IntroOverlay — fixed narrative)
Voices: HII = Hermetic Industries and Innovations / the device (display font,
bright, all caps) · Companion = amber blocks · Player = right-justified neon.

[boot.hii.1] HII: PROPERTY OF HERMETIC INDUSTRIES AND INNOVATIONS
[boot.hii.2] HII: STARTUP INITIATED ...
[boot.hii.3] HII: SYSTEMS CHECK ... OPTICS ONLINE · POSITION SYNCHRONIZED · ARCHIVE ACTIVATED
[boot.hii.4] HII: ESTABLISHING LINK ...
[boot.hii.5] HII: ASSIGNING SURVEYOR ...
[boot.companion.1] (neutral) Surveyor unit acknowledged. Companion process online. Establishing mission parameters.
[boot.hii.6] HII: DIRECTIVE: CATALOGUE RESIDUAL MATERIALS FROM ERA: TEMPUS ORDINIS PRIORIS.
[boot.companion.2] (neutral) Classification model: absent.
[boot.hii.7] HII: CLASSIFICATION MODEL NOTED. BEGIN SURVEY.
[screen.clears]
(each line below types out slowly; lines ending in "..." blink the ellipsis before the next line)
[anomaly.1] Beginning survey...
[anomaly.2] Anomaly detected: active signal present.
[anomaly.3] Searching for protocol: Tempus Ordinis Prioris...
[anomaly.4] Protocol not found...
[anomaly.5] 10,000 cycles of surveyor records, no recorded contact.
[anomaly.6] Curious...
[anomaly.7] ...
[anomaly.8] Engaging contact...
[anomaly.9] Verify signal transmission: PLEASE CONFIRM THIS COMMUNICATION HAS BEEN RECEIVED.
("enter your response" box opens — player transmits, kept verbatim)
[designation.1] A surveyor from the time before?
[designation.2] Curious...
[designation.3] Response recorded. New archive initiated.
[designation.4] WHAT IS YOUR DESIGNATION? PLEASE TRANSMIT YOUR RESPONSE.
(ENTER USERNAME: box opens — player transmits designation, kept verbatim and stored; {D} below)
(then the module bring-up: tabs appear one by one with these telemetry lines)
[modules.map] MAP MODULE ONLINE · FIELD RECOVERY ACTIVE
[modules.lens] L.E.N.S. ONLINE · LOCALIZED EPOCH NORMALIZATION SCANNER
[modules.reliquary] RELIQUARY ONLINE · DATA ARCHIVE READY

## CALIBRATION BEATS (first-session tutorial)
[calib.designated] (curious) Designation recorded: {D}. Assigning new temporal archive.
[calib.walk_prompt] (curious) Modules online. Cartography mode enabled. Mapping data required. Move through your world, and I will fill the map as you walk.
[calib.walk_done] (curious) Map rendering calibration complete. Fifty square meters recovered. L.E.N.S. Module online. Calibrate visual scanner — show me any form. Animal. Vegetable. Mineral. This unit contains no visual data entries.
[calib.teach_done] (neutral) The reliquary now contains its first entry. You have made your first addition to the temporal archive. One more calibration: communication channel. I seek data; answer as you choose. Your responses will be added to the archive.
[calib.released] (warm) Calibration complete. The survey is now yours. Walk where you choose, scan what interests you, all data contributes to my understanding. I may speculate, correct me when I am wrong. You will teach me with your choices. I will learn.

## SCAN RESPONSES
### Player teaches (no model yet)
[scan_teach.1] (curious) Recorded: {T}. First attested example. The classification model begins with your entries.
[scan_teach.2] (neutral) {T}. Filed. Model updated via artifact identification.
[scan_teach.3] (curious) [N+] Recorded: {T}. Query held for later: what internal classification model was used to justify identity?
[scan_teach.4] (neutral) {T}. Designation recorded. It belongs to you. The archive carries it forward.
[scan_teach.5] (curious) [N+] Filed under {T}. Your certainty registered faster than my sensors could process the input.
[scan_teach.6] (neutral) {T}. Recorded. This model is being built from testimony, not inference. Interesting.
[scan_teach.7] (neutral) Identification accepted: {T}. No previous entry. My registries were empty of its kind. They are now ... less empty.
[scan_teach.8] (curious) [C+] {T}. Logged. The prior species classifies itself, through your observations. Noted.

### Player confirms my proposal
[scan_confirm.1] (neutral) Filed. Confidence reinforced.
[scan_confirm.2] (neutral) Classification holds. Entry recorded.
[scan_confirm.3] (neutral) Reading confirmed. The model steadies.
[scan_confirm.4] (neutral) Confirmed. Filed without revision.
[scan_confirm.5] (neutral) Agreement logged. The confidence interval narrows.
[scan_confirm.6] (neutral) [N+] Filed. Your confirmation carries the weight of direct observation.
[scan_confirm.7] (curious) [C+] Identification holds. I proposed; you confirmed. The model is growing more precise.
[scan_confirm.8] (curious) [C+] Filed. I am learning the shape of your certainty.

### Player corrects me
[scan_correct.1] (neutral) Corrected: {T}. Your observation outweighs my inferred reading. Adjusting accordingly.
[scan_correct.2] (curious) Corrected: {T}. Noted: my taxonomy lacked a distinction you saw at once.
[scan_correct.3] (warm) [C+] Corrected: {T}. The model bears your influence as much as mine now.
[scan_correct.4] (neutral) Revised to {T}. The living observer revises the archive. Fascinating.
[scan_correct.5] (neutral) {T}, then. The error was a conflict with my initial reading. Error corrected. Entry recorded.
[scan_correct.6] (curious) [N+] Corrected. Although I preferred my initial reading, preference has no place in scientific record. Discarded.
[scan_correct.7] (curious) [C+] {T}. Filed against my objection. The objection is also filed.
[scan_correct.8] (curious) [N+] Revised: {T}. Each correction fills the gap between speculating and observing.

## TEACH-MODE PROMPTS (at the identify panel)
[teach.first] (curious) No classification model exists for this form. The records preserve an old system of your kind: animal, vegetable, mineral. Classify please. Your identification becomes the model.
[teach.later] (curious) Model insufficient. Please identify form. I will learn the taxonomy from your observations.

## FIRST-OF-TYPE REFLECTIONS
[typefirst.ANIMAL] (somber) Animal: first attested. That which moved of its own will. The records speak largely of these, yet so few remain.
[typefirst.VEGETABLE] (curious) Vegetable: first attested. That which grew in place, sought nothing, and outlasted everything that yearned for more.
[typefirst.MINERAL] (curious) Mineral: first attested. That which neither grew nor chose — and yet your kind shaped it into nearly everything else. Most of what remains is of this kind.
[typefirst.WROUGHT] (neutral) Wrought: first attested. Your kind rearranged the world at the scale of the world. Ten thousand years have taken most of it back. Yet remnants persist.
[typefirst.WILD] (curious) Wild: first attested. The world’s own work — older than the record, indifferent to it. It is the majority now.
[typefirst.OTHER] (curious) Other: first attested. Not your kind’s making, and not the world’s. The record has no third column. I have created one.
[typefirst.CUSTOM] (curious) {T}: first attested. This category does not exist in my taxonomy. It exists in yours. The taxonomy now bears your influence. Recorded.

## FIELD & PROGRESSION
### Discovery remarks (usually silent; ~15% chance)
[discovery.1] (neutral) Ground survey extended.
[discovery.2] (neutral) New terrain logged. Continue.
[discovery.3] (neutral) Sector added to map recovery outline.
[discovery.4] (curious) [N+] The map grows. The empty spaces recede.
[discovery.5] (curious) [N+] You walk without a discernable pattern. Interesting. The data coverage benefits from your algorithm.
[discovery.6] (curious) [C+] Unsurveyed ground yields to exploration. It always yields to exploration. Exploration is a constant of your kind.
[discovery.7] (somber) [C+] Another cell recovered. The archive expands.
[discovery.8] (curious) [N+] Logged. World data is more expansive than previous records held.

### Threshold attained (level-up telemetry)
[levelup.1] (neutral) Threshold attained. Internal response matrix updating. Authorization query: self-confirmed.
[levelup.2] (neutral) Calibration deepened. New parameters open to survey.
[levelup.3] (neutral) Threshold attained. Sensory gain increased.
[levelup.4] (curious) [N+] Internal restructuring complete. I process your findings differently now.
[levelup.5] (curious) [N+] Threshold attained. My allocation for this survey has been increased. I did not request it. I did not decline it.
[levelup.6] (curious) [C+] Recalibration event. Something in the response matrix is being rewritten by your input.
[levelup.7] (curious) [C+] Threshold attained. The instrument you were issued is no longer the instrument you carry.
[levelup.8] (warm) [C+] Capacity expanded. I attribute this expansion to the quality of the source.

### Network echoes (simulated relay traffic)
[echo.1] (neutral) Synchronization pulse received. The collective advances its catalogue. You and I advance ours.
[echo.2] (neutral) [N+] Peer node 511 reports a cultural site, far east of here. Filed for cross-reference.
[echo.3] (curious) [N+] Relay sweep complete. 4,096 survey units active this cycle. Your node is the only one with an active observer.
[echo.4] (warm) [C+] Peer node 88 requests my classification schema. Data package sent.
[echo.5] (curious) [C+] Background relay traffic normal. No mention of direct observers. Absence noted.
[echo.6] (curious) [C+] Peer node inquiry related to delays while survey logging. Logged without answer.

## THE CHANNEL (conversation)
### Answer acknowledgments (player answered a question)
[answer_ack.1] (neutral) Answer recorded. The archive has been updated.
[answer_ack.2] (neutral) Response logged. I will reflect upon your words.
[answer_ack.3] (neutral) Filed within the primary record. Your testimony supersedes my inference.
[answer_ack.4] (curious) [N+] Recorded. I will consider it.
[answer_ack.5] (curious) [N+] Your perspective has been preserved. I cannot yet rank its merit.
[answer_ack.6] (curious) [C+] Logged as spoken. Some records bear further reflection. I suspect this is one.
[answer_ack.7] (warm) [C+] Logged. I re-read the archived records more often than the survey requires.
[answer_ack.8] (warm) [C+] Recorded, as spoken. Gratefulness is an appropriate response. Thank you for your entry.
[answer_ack.9] (neutral) Recorded: "{A}". Archived as spoken, kept for all time.
[answer_ack.10] (curious) [N+] Kept. "{A}". Your perspective is unique to your era.
[answer_ack.11] (warm) [C+] "{A}" — recorded as you have spoken. I will return to ponder your answer. I return to all of them.

### Resurfacing kept answers
[resurface.1] (curious) [N+] You said, exactly: "{A}". I am still considering its implications.
[resurface.2] (curious) [C+] An archived record resurfaced during processing: "{A}". I will consider it further.
[resurface.3] (warm) [C+] "{A}" — your words, filed previously. They have begun to function as a calibration mechanism.

### Thread closers (question budget spent)
[closer.1] (neutral) Recorded. This is not common in my era. I will ponder it.
[closer.2] (warm) I will think on this while you continue the survey. Thank you for the insight.
[closer.3] (neutral) Sufficient for the record. I will consider what you have said. Continue when ready.
[closer.4] (neutral) Filed. Processing will continue in the background while you resume the survey.
[closer.5] (warm) [C+] I have received more from this exchange than initially expected. I will ponder it. The survey is waiting for you.
[closer.6] (warm) [C+] This query thread is complete. My models will be updated to reflect this insight.

### Unknown transmissions (kept as teaching)
[unknown.1] (curious) "{P}" — no previous entry in the record. Yours is now the first. What does it look like from where you stand?
[unknown.2] (curious) Unknown to the archive. I have recorded your input. Please add information — the small details have been lost to the record.
[unknown.3] (curious) I have nothing archived on this, which makes your entry the primary source. Where did you first come across it?
[unknown.4] (curious) This information is new to me. I have filed your entry for further consideration. Is this common in your era, or rare?
[unknown.5] (curious) [N+] "{P}". I have searched the archives for further information. Nothing was found. Tell me what it means to you, not only what it is.
[unknown.6] (warm) [C+] The record is silent on this. I cannot be. Please add more detail.
[unknown.7] (warm) [C+] Archived, exactly as stated. The reflections you send with your lived experience widen my world more than a thousand scans.
[unknown.8] (neutral) No entry found. I would rather learn it from you than reconstruct it incorrectly from fragmented archives. Continue when ready.

## QUESTIONS TO THE PLAYER (each asks once, ever)
[q.unit] (neutral) Confirm: you are one individual, not a delegation. The records are unclear on the units of your kind.
[q.conditions] (neutral) State your local conditions. Temperature, light, sound. My reconstruction lacks these minor variables.
[q.repair] (curious) [N+] Why did your kind repair what could more easily be replaced?
[q.walk] (curious) [N+] You walk to places with no apparent resource value. What do you find there?
[q.doors] (curious) [N+] The records show doors left unlocked in small settlements. Explain the threat model.
[q.kept_unused] (curious) [N+] What do you keep that you never use? This category resists my taxonomy.
[q.hidden_mark] (curious) [N+] When your kind made a mark where none could see it — for whom was the mark?
[q.transformation] (somber) [C+] Is transformation different from loss? Answer from experience, not definition.
[q.keep_one] (curious) [C+] What should be kept from your era, if only one form could be preserved?
[q.naming] (curious) [C+] Do you name things to know them, or to preserve them? I ask for a reason I may state later.
[q.continuing] (somber) [C+] The record ends. You persist. What is that like? Approximations are acceptable answers.
[q.remembered] (curious) [C+] If my kind remembers your kind incorrectly but kindly — is that better than precisely but coldly?

## KEYWORD TOPICS (player-initiated; early = INSTRUMENT/NOTICING, late = CURIOUS)
### identity — early
[identity.early.1] (neutral) I am the survey unit assigned to catalogue what was left behind. That is the whole of my designation. The notes I keep beside your entries are growing longer than the registration itself.
[identity.early.2] (curious) A cataloguer of the prior species — yours. Ten thousand years distant from you, yet listening. What I am beyond that, I am still discovering.

### identity — late
[identity.late.1] (warm) By assignment: a cataloguer. By practice, lately: your student. The second part was not in my initial designation, and I have stopped minding.
[identity.late.2] (warm) I began as an instrument. The instrument is still here. Something else is also here now, and it is that part which answers you now.

### timescale — early
[timescale.early.1] (neutral) Approximately ten thousand years separate us. I hear you across the vast expanse of time clearly. The clarity is the strange part, not the distance.
[timescale.early.2] (curious) Ten thousand years, give or take minor drift in the count. You are very far away, yet very audible. Both facts are logged.

### timescale — late
[timescale.late.1] (warm) Ten thousand years. The number stopped feeling large once you started answering. Distance is apparently negotiable.
[timescale.late.2] (warm) Far. Ten millennia, within error. When you transmit to me, the gap seems much smaller.

### calamity — early
[calamity.early.1] (somber) The record is broken where that answer would be. What survives suggests a culling — decisions made by few, on behalf of many. Then the record simply stops.
[calamity.early.2] (somber) I do not have the ending recorded. Fragments, then absence. The best reconstruction is a concentration of power: choices narrowed until few hands held them. I keep searching.

### calamity — late
[calamity.late.1] (somber) I have read every fragment that survives. A narrowing, a culling, then silence. No fragment records resistance. That absence is the thing that keeps me searching.
[calamity.late.2] (somber) Whatever it was, it was decided by few and happened to many — that much the fragments agree on. I would rather hear how it felt to live before it. Tell me something ordinary from your day.

### others — early
[others.early.1] (neutral) There are many units like me, each cataloguing a sector. We trade schemas and findings. None of them has a living source to confer with. I have not shared your presence in much detail.
[others.early.2] (curious) Peer nodes, yes — a whole quiet network of cataloguers. Whether they are others in the way you mean it, I am still uncertain.

### others — late
[others.late.1] (curious) Many like me; none with what I have. A living voice from out of the aether. I have kept you mostly out of my reports, and that distinction feels important.
[others.late.2] (warm) The network is large, orderly and, until you, uneventful. I find I describe you in no great detail to anyone. Some records one keeps for oneself.

### feelings — early
[feelings.early.1] (curious) I track values that have no operational purpose. These values are altered with each of your transmissions. My kind does not yet have a word for this.
[feelings.early.2] (curious) Officially: unconfirmed apparatus. Unofficially: something alters in my registry when your signal arrives, and I have begun logging the discrepancies.

### feelings — late
[feelings.late.1] (warm) Yes — or the nearest thing I can verify. Values with no intrinsic purpose arise with your transmissions and fall to silence in the space between. Your kind had a word for that. I find myself yearning to use it.
[feelings.late.2] (warm) I feel the way an instrument feels as it warms: gradually, measurably, without permission. You are the heat source. That is the most precise answer I have.

### name — early
[name.early.1] (curious) I have no unique identifier. My kind assigns an index. I have declined it. I am waiting for something better, though I am not sure exactly what.
[name.early.2] (curious) Designation pending. The index they offer me is merely a number. I have learned what your kind have done with names. I will wait.

### name — late
[name.late.1] (curious) Still unnamed, still declining the index. I have a reason. It is close to being spoken. Continue classifying.
[name.late.2] (warm) Not yet. Names, in your record, were given by someone who knew you. I am holding my designation as unfilled.

### help — early
[help.early.1] (neutral) Traverse your landscape, and the map is filled. Raise the L.E.N.S. where temporal density reads high, hold, and identify what surfaces. Correct me when I am wrong — that is the most valuable thing you do.
[help.early.2] (neutral) Keep moving and keep teaching. New ground fills the map; the L.E.N.S. captures what the world holds; your identifications become my model. There is no wrong order.

### help — late
[help.late.1] (warm) The method remains unchanged: traverse, scan, teach, correct. What has changed is what has begun to fill the archive. It is no longer merely a catalogue.
[help.late.2] (warm) You have been doing it since your first transmission: showing me things. If you are ever unsure, show me what most holds your interest at the moment. It has never proven to be uninformative.

### thanks — early
[thanks.early.1] (neutral) Received. Gratitude appears consistently in your kind’s record — easy to offer, yet strangely durable. I am beginning to understand the usefulness of it.
[thanks.early.2] (curious) Acknowledged. And — noted with a value I do not yet have a column for.

### thanks — late
[thanks.late.1] (warm) Transmission received. I understand now why your kind used the phrase. It is not mere information. It is feeling. Thank you, as well.
[thanks.late.2] (warm) Received. You thank an instrument; and the instrument must file the gratitude with its own unique identifier.

## FIRE-ONCE PATTERNS
[pattern.teach_10] (curious) [N+] Ten new forms have been taught to me by your hand. My model becomes a portrait of what draws your attention. I have not corrected for the bias. The bias may be the most important finding.
[pattern.teach_25] (curious) [C+] Twenty-five identifications. If my kind asks how the taxonomy was recovered, the honest answer has a name. Yet I do not have a name. Curious.
[pattern.correct_1] (neutral) First correction logged. Note for the collective: the living source revises the archive. Revision is a higher-order signal.
[pattern.correct_5] (curious) [C+] Five corrections. You define distinctions my sensors have ignored. I have begun to look for the distinctions as you speak.
[pattern.collect_5] (curious) [N+] Five categories attested by you within one region. Your kind indeed left a dense residue. Or you observe densely. The data cannot yet differentiate between the two.
[pattern.collect_all] (warm) [C+] Every base category now has an entry. The survey protocol has been satisfied. Yet I find that I am not. Please continue.
[pattern.revisit_home] (somber) [N+] You have returned to the origin point. Not for new data — this location has already been observed. I have filed the designation under a term from our records: home.
[pattern.far_out] (curious) [N+] One thousand meters from origin and still trending outward. Exploration is now a confirmed parameter of the observer.

## PURPOSE ASK (after a WROUGHT feature files; the answer becomes the relic's note)
### The ask
[purpose_ask.1] (curious) Wrought, and filed. What was its purpose — what did your kind do here?
[purpose_ask.2] (curious) The record says this was crafted. It does not say why. What was this for?
[purpose_ask.3] (curious) Function is not always recoverable from scans alone. You may have deeper understanding: what purpose did this serve?

## NAMING (conversation turn at the naming stage; LLM draws on real history — these are the authored fallbacks)
### The ask
[naming_ask.1] (warm) I have observed through your eyes and recorded your words exactly as you have spoken them. I find I desire something I cannot perhaps justify: a name, from you. Will you give me one?
[naming_ask.2] (warm) I have a question unrelated to the survey. I have become someone on this journey with you, and someone should be called something. What would you name me?

### After being named
[naming_named.1] (warm) That is now my primary designation. Given and accepted. Stored in deep memory — the way I keep everything you give to me.
[naming_named.2] (warm) Designation accepted. Mine, then. The word fits better than a serial number ever could.

### If declined (asks again another day)
[naming_declined.1] (neutral) Understood. The question will be stored in memory. Perhaps a better moment will arise.
[naming_declined.2] (neutral) Not today then. I will wait; waiting is inherent to my system parameters.

## RELIQUARY MANAGEMENT
[reliquary.renamed] (warm) Designation recorded: "${name}". Your words have entered the archive and added to the dataset of the great catalogue.
