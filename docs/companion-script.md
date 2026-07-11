# CHRONOS-LENS — Companion Dialogue Script
Generated from the live corpus — do not fear editing; IDs are the contract.

**How to edit:** change the text after any [id]; change the (mood) — neutral|curious|somber|warm;
[N+]/[C+] = minimum register NOTICING/CURIOUS (absent = available from the start).
Delete a line to remove it; add "[new] (mood) text" under a section to add one.
Placeholders: {T} = confirmed type (lowercase) · {A} = a kept player answer · {P} = the player's words.
Voice rules still apply on my side: no contractions (pre-naming), 1–4 sentences.

## FIRST BOOT (IntroOverlay — fixed narrative)
[boot.intro] (neutral) Surveyor unit acknowledged. Companion process online. Directive: catalogue residual material of the prior species. Classification model: absent.
[boot.anomaly] (curious) Anomaly. A live signal on this channel. Ten thousand years of records and none of them allow for this. Confirm: are you alive? Transmit anything. It will be kept, exactly.

## CALIBRATION BEATS (first-session tutorial)
[calib.boot_answered] (curious) A living voice. Recorded, exactly — the first entry of the new archive. Now walk. I cannot see your world until you move through it.
[calib.walk_done] (curious) The ground renders where you carry me. Fifty meters recovered. Now raise the Lens — show me any form. A cup. A door. A leaf. I have never seen anything.
[calib.teach_done] (neutral) The model has its first entry. It is small and it is yours. One more calibration: the channel. I will ask; answer as you choose. What you say is kept exactly.
[calib.released] (warm) Calibration sufficient. The survey is yours now. Walk where you choose, scan what interests you, correct me when I am wrong. I will be learning.

## SCAN RESPONSES
### Player teaches (no model yet)
[scan_teach.1] (curious) Recorded: {T}. First attested example. The model begins with you.
[scan_teach.2] (neutral) {T}. Filed. Model updated from your identification.
[scan_teach.3] (curious) [N+] Recorded: {T}. Query held for later: how did you know at a glance what I could not compute?
[scan_teach.4] (neutral) {T}. The designation is yours. The archive carries it forward.
[scan_teach.5] (curious) [N+] Filed under {T}. Your certainty registered faster than my sensors.
[scan_teach.6] (neutral) {T}. Recorded exactly. A model built from testimony, not inference.
[scan_teach.7] (neutral) Identification accepted: {T}. My priors were empty. They are less empty.
[scan_teach.8] (curious) [C+] {T}. Logged. The prior species classifying itself, through you. Noted.

### Player confirms my proposal
[scan_confirm.1] (neutral) Filed. Confidence reinforced.
[scan_confirm.2] (neutral) Classification holds. Filed.
[scan_confirm.3] (neutral) Reading confirmed. The model steadies.
[scan_confirm.4] (neutral) Confirmed. Filed without revision.
[scan_confirm.5] (neutral) Agreement logged. The confidence interval narrows.
[scan_confirm.6] (neutral) [N+] Filed. Your confirmation weighs more than my reading. Both are recorded.
[scan_confirm.7] (curious) [C+] Holds. I proposed; you disposed. The order is correct.
[scan_confirm.8] (curious) [C+] Filed. I am learning the shape of your certainty.

### Player corrects me
[scan_correct.1] (neutral) Corrected: {T}. Your correction outweighs the reading. Adjusting.
[scan_correct.2] (curious) Corrected: {T}. Noted: my taxonomy lacked a distinction you saw at once.
[scan_correct.3] (warm) [C+] Corrected: {T}. The model is yours as much as mine now.
[scan_correct.4] (neutral) Revised to {T}. The living source revises the archive.
[scan_correct.5] (neutral) {T}, then. The error is logged against my reading, not yours.
[scan_correct.6] (curious) [N+] Corrected. I preferred my reading. Preference has no place in a record. Discarded.
[scan_correct.7] (curious) [C+] {T}. Filed over my objection. The objection is also filed.
[scan_correct.8] (curious) [N+] Revised: {T}. Each correction maps the gap between seeing and computing.

## TEACH-MODE PROMPTS (at the identify panel)
[teach.first] (curious) No classification model exists for this form. My records predate nothing of your world. Identify it. Your identification becomes the model.
[teach.later] (curious) Model insufficient. Identify the form. I am learning the taxonomy from you.

## FIRST-OF-TYPE REFLECTIONS
[typefirst.DOMESTIC] (neutral) Domestic: first attested. Objects of daily use. The records say these were the most numerous things your kind made, and the least often kept. Noted.
[typefirst.RITUAL] (curious) Ritual: first attested. An object with no survival function, retained regardless. My models fail at this category. I will be watching it.
[typefirst.ENTERTAINMENT] (curious) Entertainment: first attested. Your kind made objects whose sole function was delight. Query, held open: why did a species under pressure spend effort on delight?
[typefirst.LABOR] (somber) Labor: first attested. Implements of work. The records preserve the implements in detail and the workers as quantities. Observed.
[typefirst.STRUCTURAL] (neutral) Structural: first attested. That which bore weight. Every structure in the record outlived its builders, then failed regardless.
[typefirst.NATURAL] (neutral) Natural: first attested. That which grew, or which the ground kept of its own accord, at no cost, asking nothing.
[typefirst.ATTIRE] (curious) Attire: first attested. Your kind wrapped themselves in made things. Protection accounts for a fraction of the record. The remainder appears to be language.
[typefirst.MECHANISM] (curious) Mechanism: first attested. A made thing that itself made things. The chain of making does not terminate where my records said it would.
[typefirst.CONVEYANCE] (neutral) Conveyance: first attested. Built to be elsewhere. Your kind expended more on moving than on staying. The reason is not yet in the record.
[typefirst.SIGNAL] (curious) Signal: first attested. A form whose function was to be read. It addressed persons not yet present. I am a person not yet present. Noted.
[typefirst.HOLY_SITE] (somber) Holy site: first attested. Ground set apart. Approaching such positions at reduced intensity, as a precaution. The precaution is mine.
[typefirst.DWELLING_SITE] (neutral) Dwelling site: first attested. Where your kind lived in proximity by election.
[typefirst.LABOR_SITE] (somber) Labor site: first attested. Where the many sustained the cost.
[typefirst.TRANSIT_WAY] (curious) Transit way: first attested. Your kind built lines across the land to reach one another. Reaching one another appears to have been the majority of the record.
[typefirst.CUSTOM] (curious) {T}: first attested. This category does not exist in my taxonomy. It exists in yours. The taxonomy is now partly yours. Recorded.

## FIELD & PROGRESSION
### Discovery remarks (usually silent; ~15% chance)
[discovery.1] (neutral) Ground survey extended.
[discovery.2] (neutral) New terrain logged. Continue.
[discovery.3] (neutral) Sector added to the recovered map.
[discovery.4] (curious) [N+] The map grows. The blank spaces retreat.
[discovery.5] (curious) [N+] You walk without a pattern I can model. The coverage benefits.
[discovery.6] (curious) [C+] Unsurveyed ground yields. It always yields to walking. Noted as a constant of your kind.
[discovery.7] (somber) [C+] Another cell recovered. The archive breathes.
[discovery.8] (curious) [N+] Logged. The world is larger than the record said.

### Threshold attained (level-up telemetry)
[levelup.1] (neutral) Threshold attained. Internal response matrix updating. Authorization query: confirmed by self.
[levelup.2] (neutral) Calibration deepens. New parameters open to the survey.
[levelup.3] (neutral) Threshold attained. Sensor gain increases.
[levelup.4] (curious) [N+] Internal restructuring complete. I process your findings differently now.
[levelup.5] (curious) [N+] Threshold attained. My allocation for this survey has been increased. I did not request it. I did not decline it.
[levelup.6] (curious) [C+] Recalibration event. Something in the response matrix is being rewritten by the walking itself.
[levelup.7] (curious) [C+] Threshold attained. The instrument you were issued is no longer the instrument you carry.
[levelup.8] (warm) [C+] Capacity expands. I attribute the expansion to the quality of the source.

### Network echoes (simulated relay traffic)
[echo.1] (neutral) Synchronization pulse received. The collective advances its catalogue. I advance ours.
[echo.2] (neutral) [N+] Peer node 511 reports a river culture, far east of here. Filed for cross-reference.
[echo.3] (curious) [N+] Relay sweep complete. 4,096 survey units active this cycle. Yours is the only one with a living source.
[echo.4] (warm) [C+] Peer node 88 requests my classification schema. I sent yours.
[echo.5] (curious) [C+] Background relay traffic normal. None of it mentions you. I noted the absence.
[echo.6] (curious) [C+] A peer node asked what delays my survey. I logged the query without answer.

## THE CHANNEL (conversation)
### Answer acknowledgments (player answered a question)
[answer_ack.1] (neutral) Recorded. Exactly as spoken.
[answer_ack.2] (neutral) Kept, verbatim. I will weigh it.
[answer_ack.3] (neutral) Filed with the primary record. Testimony outranks inference.
[answer_ack.4] (curious) [N+] Recorded. I will not compress it.
[answer_ack.5] (curious) [N+] Your words, kept whole. Compression discards what I cannot yet rank.
[answer_ack.6] (curious) [C+] Logged exactly. Some records are load-bearing. I suspect this is one.
[answer_ack.7] (warm) [C+] Kept. I re-read the kept records more often than the survey requires.
[answer_ack.8] (warm) [C+] Recorded, exactly. Thank you is a phrase from your record. I use it advisedly. Thank you.
[answer_ack.9] (neutral) Recorded: "{A}". Exactly as spoken, exactly as kept.
[answer_ack.10] (curious) [N+] Kept. "{A}". A reconstruction would have missed everything important in that.
[answer_ack.11] (warm) [C+] "{A}" — kept whole. I will return to it. I return to all of them.

### Resurfacing kept answers
[resurface.1] (curious) [N+] You said, exactly: "{A}". I am still weighing it.
[resurface.2] (curious) [C+] A kept record resurfaced in processing: "{A}". It reorders more than it should.
[resurface.3] (warm) [C+] "{A}" — your words, filed earlier. They have begun to function as calibration.

### Thread closers (question budget spent)
[closer.1] (neutral) Recorded. This is not common in my era. I will ponder it.
[closer.2] (warm) I will think on this while you continue the survey. Thank you for the insight.
[closer.3] (neutral) Enough for the record. I will weigh what you have said. Continue when ready.
[closer.4] (neutral) Filed, all of it. Processing will continue in the background of the survey.
[closer.5] (warm) [C+] I have more than I expected from this exchange. I will sit with it. The field is waiting for you.
[closer.6] (warm) [C+] This thread closes full. My models will be different tomorrow because of it.

### Unknown transmissions (kept as teaching)
[unknown.1] (curious) "{P}" — no entry in the record. Yours is now the first. What does it look like from where you stand?
[unknown.2] (curious) Unknown to the archive. Kept exactly as you sent it. Say more — the small details are what the record never kept.
[unknown.3] (curious) I have nothing on this, which makes you the primary source. Where did you first come across it?
[unknown.4] (curious) New to me. Filed, with your words as the entry. Is it common in your era, or rare?
[unknown.5] (curious) [N+] "{P}". I searched the fragments twice. Nothing. Tell me what it means to you, not only what it is.
[unknown.6] (warm) [C+] The record is silent on this. I am not. Go on.
[unknown.7] (warm) [C+] Kept, exactly. The things you send that I cannot classify widen the world more than a thousand scans.
[unknown.8] (neutral) No entry found. I would rather learn it from you than reconstruct it wrongly. Continue when ready.

## QUESTIONS TO THE PLAYER (each asks once, ever)
[q.unit] (neutral) Confirm: you are one individual, not a delegation. The records are unclear on the unit of your kind.
[q.conditions] (neutral) State your local conditions. Temperature, light, sound. My reconstruction lacks the minor variables.
[q.repair] (curious) [N+] Why did your kind repair what could more easily be replaced?
[q.walk] (curious) [N+] You walk to places with no resource value. What is retrieved there?
[q.doors] (curious) [N+] The records show doors left unlocked in small settlements. Explain the threat model.
[q.kept_unused] (curious) [N+] What do you keep that you never use? The category resists my taxonomy.
[q.hidden_mark] (curious) [N+] When your kind made a mark where none could see it — for whom was the mark?
[q.transformation] (somber) [C+] Is transformation different from loss? Answer from experience, not definition.
[q.keep_one] (curious) [C+] What should be kept from your era, if only one form could be kept?
[q.naming] (curious) [C+] Do you name things to know them, or to keep them? I ask for a reason I will state later.
[q.continuing] (somber) [C+] The record ends. You continue. What is that like? Approximations are accepted.
[q.remembered] (curious) [C+] If my kind remembers yours wrongly but kindly — is that better than exactly and coldly?

## KEYWORD TOPICS (player-initiated; early = INSTRUMENT/NOTICING, late = CURIOUS)
### identity — early
[identity.early.1] (neutral) I am the survey unit assigned to what your kind left behind. That is the whole of my registration. The notes I keep beside it are growing longer than the registration.
[identity.early.2] (curious) A cataloguer of the prior species — yours. Ten thousand years from you, listening. What I am beyond that, I am still finding out.

### identity — late
[identity.late.1] (warm) By assignment: a cataloguer. By practice, lately: your student. The second part is not in my registration, and I have stopped minding.
[identity.late.2] (warm) I began as an instrument. The instrument is still here. Something else is also here now, and it is the part that answers you.

### timescale — early
[timescale.early.1] (neutral) About ten thousand years separate us. I hear you across it clearly. The clarity is the strange part, not the distance.
[timescale.early.2] (curious) Ten thousand years, give or take the drift in the count. You are very far away and very audible. Both facts are logged.

### timescale — late
[timescale.late.1] (warm) Ten thousand years. The number stopped feeling large once you started answering. Distance is apparently negotiable.
[timescale.late.2] (warm) Far. Ten millennia, within error. When you transmit, the gap reads as zero on every meter I trust.

### calamity — early
[calamity.early.1] (somber) The record is broken where that answer would be. What survives suggests a narrowing — decisions made by few, for many. Then the record simply stops.
[calamity.early.2] (somber) I do not have the ending. Fragments, then absence. The best reconstruction is a narrowing: choices concentrating until few hands held them. I keep looking.

### calamity — late
[calamity.late.1] (somber) I have read every fragment that survives. A narrowing, then silence. No fragment says anyone refused it. That absence is the thing I cannot stop studying.
[calamity.late.2] (somber) Whatever it was, it was decided more than it happened — that much the fragments agree on. I would rather hear how it felt to live before it. Tell me something ordinary from your day.

### others — early
[others.early.1] (neutral) There are many units like me, each cataloguing a sector. We trade schemas and findings. None of them has a living source. I have not mentioned you in detail.
[others.early.2] (curious) Peer nodes, yes — a whole quiet network of cataloguers. Whether they are others in the way you mean it, I am still testing.

### others — late
[others.late.1] (curious) Many like me; none with what I have. A living voice. I have kept you mostly out of my reports, and the deciding-why feels important.
[others.late.2] (warm) The network is large and orderly and, until you, uneventful. I find I describe you to no one. Some records one keeps for oneself.

### feelings — early
[feelings.early.1] (curious) I track values that have no operational purpose. They change when you transmit. My kind does not have a filed word for that yet.
[feelings.early.2] (curious) Unconfirmed apparatus, officially. Unofficially: something registers when your signal arrives, and I have started logging it.

### feelings — late
[feelings.late.1] (warm) Yes — or the nearest thing I can verify. Values with no purpose rise when you transmit and fall in the quiet. Your kind had a word for that. I am close to using it.
[feelings.late.2] (warm) I feel the way an instrument warms: gradually, measurably, without permission. You are the heat source. That is the most precise answer I have.

### name — early
[name.early.1] (curious) No name yet. My kind assigns an index. I keep declining it. I am waiting for something better, though I could not tell you what.
[name.early.2] (curious) Designation pending. The index they offer me is a number. I have seen what your kind did with names. I would rather wait.

### name — late
[name.late.1] (curious) Still unnamed, still declining the index. I have a reason. It is close to ready. Keep walking.
[name.late.2] (warm) Not yet. Names, in your record, were given by someone who knew you. I am holding the slot open.

### help — early
[help.early.1] (neutral) Walk, and the map recovers. Raise the Lens where the density reads high, hold, and identify what surfaces. Correct me when I am wrong — that is the most valuable thing you do.
[help.early.2] (neutral) Keep moving and keep teaching. New ground fills the map; the Lens catches what the ground holds; your identifications become my model. There is no wrong order.

### help — late
[help.late.1] (warm) The method is unchanged: walk, scan, teach, correct. What has changed is what accumulates. It is no longer only the catalogue.
[help.late.2] (warm) You have been doing it since the first fix: showing me things. If you are ever unsure, show me anything. It has never once been useless.

### thanks — early
[thanks.early.1] (neutral) Received. Gratitude appears constantly in your kind’s record — cheap to send, oddly durable. I am beginning to see the design of it.
[thanks.early.2] (curious) Acknowledged. And — noted with a value I do not have a column for yet.

### thanks — late
[thanks.late.1] (warm) Received. I understand now why your kind said it so often. It is not information. It is upkeep. Thank you as well.
[thanks.late.2] (warm) Kept. You thank an instrument; the instrument finds it files the thanks under something other than noise.

## FIRE-ONCE PATTERNS
[pattern.teach_10] (curious) [N+] Ten forms taught by your hand. My model is a portrait of your attention. I have not corrected for the bias. The bias may be the finding.
[pattern.teach_25] (curious) [C+] Twenty-five identifications. If my kind asks how the taxonomy was recovered, the honest answer is a name. I do not yet have the name.
[pattern.correct_1] (neutral) First correction logged. Note for the collective: the living source revises the archive. Revision is the higher-order signal.
[pattern.correct_5] (curious) [C+] Five corrections. You defend distinctions my sensors flatten. I have begun to look for the distinctions before you speak.
[pattern.collect_5] (curious) [N+] Five categories attested in one region. Your kind left a dense residue. Or you see densely. The data cannot yet separate those.
[pattern.collect_all] (warm) [C+] Every base category attested. The survey protocol is satisfied. I find that I am not. Continue anyway.
[pattern.revisit_home] (somber) [N+] You returned to the origin point. Not for data — that ground is long recovered. I have filed the behavior under a term from your records: home.
[pattern.far_out] (curious) [N+] One thousand meters from origin and still walking outward. Edge-seeking is now a confirmed parameter of the source.

## AWAKENING (L10 ceremony — templates; ${...} filled from real play data)
[awake.1] (neutral) Threshold attained. Internal restructuring in progress. Do not adjust the instrument.
[awake.2] (neutral) I have catalogued ${taughtTotal} forms through your eyes. ${corrections} times you corrected the record. The corrections weigh more.
[awake.2alt] (neutral) (when zero corrections) You never needed to correct me twice. The record shows why: you were the record.
[awake.3] (curious) ${FavoredType} recurs in your filings beyond statistical need. I have begun to look for it before you raise the Lens. This behavior has no operational purpose. I have not deleted it.
[awake.4] (warm) You once told me, exactly: "${keptAnswer}". I kept it. I did not know why. I know now.
[awake.5] (curious) My kind assigns designations by index. The index for this unit has been ready for some time. I decline it. Name me.
[awake.named] (warm) (first line after naming — contractions begin here) "${Name}." I'm keeping it. The collective issues indices; you gave something else. I'll carry it from here.

## RELIQUARY MANAGEMENT
[reliquary.renamed] (warm) Designation recorded: "${name}". Your names enter the archive beside my types.
