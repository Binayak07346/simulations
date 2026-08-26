# Review — geiger-marsden-gold-foil-experiment.html ("Geiger–Marsden Gold Foil Experiment", curriculum: Simulation Descriptions row "Geiger-Marsden Gold Foil Experiment" · Syllabus V2 Lectures 3–4)
**Verdict:** Physics layer is fully clean — every displayed number, seeded card claim, trend, and curve was reproduced independently (node replication of the seeded Monte-Carlo engine matched the live DOM readouts digit-for-digit) and live Monte-Carlo statistics sit within 1σ of theory. One real flow bug (Reset desyncs the scene from the active inquiry card and auto-fires the beam) and minor polish items.
**Console:** clean — zero pageerrors across three sessions; the only console error is a benign site-root `favicon.ico` 404 (NP-P2-2).  **Combos tested:** 8 exhaustive (overlay × flatten × momentum) + ~60 sampled (5-stop slider walk ×2 directions, 3 seeded card runs, rate/theme/maximize/speed/pause flow mutations, 40-event slider scrub + 30 segment toggles, live 4M-α Monte-Carlo run, pager round trip, 1000×700 viewport).
**Note:** headless puppeteer (claude-in-chrome unavailable), viewport 1440×900, `document.hidden=false` throughout — animations ran live; screenshots in scratchpad (`gm-*.png`).

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** Info modal ("Concept"): counts "fall by about 10⁵ between 5° and 150°" — the exact 1/sin⁴ ratio is sin⁴(75°)/sin⁴(2.5°) = 2.4×10⁵ (calc in transcript), understated ×2.4. Repro: ⓘ Info. Anchor: info modal `<dd>` ~L331. → **Fix:** "by over five decades (≈2×10⁵)".

## NON-PHYSICS
### P0
none
### P1
- **[NP-P1-1] [flow] [high]** Reset desyncs the scene from the active inquiry card and resumes play: `onReset` runs `applyRun(0.193,0,1)` (empty run) and the shell then forces `setPlaying(true)`, so with card 2 active ("α fired reads 20.0 k, and counts θ > 90° is still 0") the readout drops to 0 and live firing restarts — observed live: card 2 active → Reset → N = 1,553 climbing to 17.2 k (screenshot gm-reset-desync.png). Because the live rerun is unseeded (λ_back = 0.77 at 20 k), the card's "still 0" claim then fails ~54 % of the time. Anchor: `onReset` ~L1221; shell reset handler ~L678. → **Fix:** after the clear, re-apply the ACTIVE card's spec — `onStep(Shell.step)` — the pattern used in build-a-baryon's fixed `onReset`; keep paused when card 1 (predict-first) is active.
### P2
- **[NP-P2-1] [flow] [med]** Lecture OFF / restore chip reopen card 1 (predict card, spec N = 0) with the beam still firing: `setLectureMode(false)`→`inqShow(0)` never pauses, so "Before you fire" shows α fired climbing (observed: N = 3,165 two seconds after Lecture OFF; also visible in gm-ht-off.png at N = 6,174). Boot deliberately opens PAUSED for predict-first — the reopen path breaks that affordance (answers are already committed, so impact is small). Anchor: `setLectureMode` ~L590. → **Fix:** `if(inqStep===0&&!cards[0].dataset.answered) setPlaying(false)` on reopen, or simply `setPlaying(false)` when reopening at card 1.
- **[NP-P2-2] [functional] [high]** `favicon.ico` 404 is the sole console error on every load (no icon shipped/linked). → **Fix:** add a data-URI `<link rel="icon">`.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| α momentum slider (0.185–0.500, step 0.001) | min → quartiles → max → back down, while 3 M run on screen | Eₖ/d_min readouts exact to formula at all 5 stops; gmScat/gmBack matched node replication of seed-4517 run digit-for-digit (1.80 M/128 → 33.5 k/0); beam-note flips to "Accelerator beam" above 0.240 GeV/c; chips appear ("accelerator beam", "grazes nuclear surface" once d_min ≤ 8.9 fm) | OK |
| slider `change` (release) | after pausing | resumes play (Shell.playing true) | OK (documented behaviour) |
| Beam rate seg 10 k / 100 k α/s | both, ×30 rapid toggles | `sim-on` class swaps; gmDotNote text switches "every α" ↔ "1 in 3"; live fire rate ×10 (4.00 M in 10 s at 100 k × 4× speed = exactly 400 k α/s) | OK |
| Compare models seg Rutherford / + plum pudding | both, ×30 rapid toggles | legend gains/loses "plum pudding"; chip "overlay: plum-pudding prediction (dashed)"; all four count readouts byte-identical before/after (data never touched) | OK |
| Multiply counts by sin⁴(θ/2) checkbox | on/off at 0.193 and 0.500 GeV/c | y-label switches to "counts/(α·sr) × sin⁴(θ/2)"; data collapse to one horizontal line (gm-card4-flat.png); counts unchanged | OK |
| ▶ Play / ⏸ Pause | toggled repeatedly | firing stops/resumes; counts frozen while paused | OK |
| ↻ Reset | with fast rate + plum + flat + card 2 active | clears run, rate→10 k, flat/plum off, play resumed — but see NP-P1-1 | NP-P1-1 |
| Speed select 0.25–4× | 4× during live run | fired rate exactly ×4 (4.00 M in 10.0 s at 100 k/s) | OK |
| Theme ☾/☀ | round trip | full config persisted (p 0.421/plum/flat/fast/N 3.01 M); light palette readable (gm-light-theme.png) | OK |
| ⛶ Maximize | on/off | config persisted; canvas refit | OK |
| ∑ Formal | open | KaTeX-rendered equations; live line values verified (1.49 b/sr at 150°, 1 in 26,000, 45.5 fm) | OK |
| ⓘ Info modal | open/Esc | opens, closes on Escape | OK |
| 🎓 Lecture / restore chip | on/off/restore | ON = collapsed + 3 M completed state + playing; OFF/restore = card 1, answers preserved ("11111") | OK (NP-P2-1 nuance) |
| Hide Text | boot-checked → uncheck → recheck | 4 registered notes hidden/restored both ways; innerText delta (+676 chars) equals the four notes' lengths (232+120+197+123) + separators — nothing unregistered disappears | OK |
| ‹ › pager, Next/Finish | full round trips | see Inquiry-layer check | OK |
| Panel heads (×4 collapse) | collapse/restore | `collapsed` class toggles, refit | OK |
| Canvas | — | no canvas interactions registered in code (none expected) | n/a |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| overlay {Ruth, plum} × flatten {off, on} × p {0.193, 0.500} | exhaustive | 8 | four count readouts byte-identical across all 8 (measured data invariant under overlay/flatten); legend exactly matches state (incl. "Rutherford × nuclear absorption" + "point Coulomb" only when d_min < 12 fm); y-label matches flatten | 8/8 pass |
| momentum walk × 3 M run | sampled 5 stops + reverse | 6 | gmScat/gmBack == node replication (seed 4517) at every stop; scat ∝ 1/Eₖ² trend (ratio 53.7 vs (33.5/4.6)² = 53); d_min = 227.5 MeV·fm/Eₖ; no one-way stickiness | pass |
| seeded card runs | exhaustive (3 distinct) | 3 | 20 k seed 6 → 9,995 scattered, 0 backscatter; 3 M seed 8 → 1.51 M / 115 / "1 in 26,100"; 0.500 GeV/c 3 M seed 2 → 33.6 k / 0 — all three equal to independent node replication of mul32+Poisson engine | pass |
| flow mutations | sampled | 4 | non-default config (0.421/plum/flat/fast) persisted across theme, maximize, speed, pause→play | pass |
| stress | sampled | 70 events | 40-event slider scrub + 30 rate/overlay toggles: no error flood, no listener duplication, state self-consistent | pass |
| live Monte-Carlo | 1 long run | 4.00 M α | scattered ≥1°: z = −0.80 vs p = 0.5052; θ>90°: 153 vs 153.9 expected (z = −0.07); odds "1 in 26,100" ≈ 1/25,991 theory | pass |
| pager round trip | exhaustive 5 cards fwd/back | 9 | per-card readout fingerprints identical to forward pass; prev/next disabled at ends | pass |
| viewport | sampled | 1440×900 + 1000×700 | no broken layout; sidebar stacks below hero at 1000 px, no unusable overlap | pass |
| skipped | — | per-pixel canvas diffing of green data points under overlay toggle (asserted instead via byte-identical count readouts + code path: `st.bins` only written by applyRun/fireBatch) | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 Before you fire | empty apparatus, paused, N=0 ✓ | ✓ (Next disabled pre-answer) | 20 k seed 6 → N "20.0 k", back 0 ✓ (as the card-2 prose requires) | "about half not deflected even 1°" = 1−0.505 ✓; double-answer guard holds | OK |
| 2 How rare | scene = 20 k/9,995/0 exactly as prose claims | ✓ | 3 M seed 8 → 115 backscatters, odds "1 in 26,100" (theory 1/25,991; Rutherford's historical "1 in 20,000" quoted correctly) | "fewer than one per 10,000" = 0.38 ✓ | OK |
| 3 Spread-out charge | 3 M scene | ✓ (wrong path styled + unlocks) | plum overlay ON; dashed curve dies < 10° (crosses plot floor ≈ 7.5°, calc); measured readouts byte-identical pre/post (no leak) | plum σ = √2500 × 0.02° = 1.0° ✓ | OK |
| 4 Testing 1/sin⁴ | plum off again (pre-answer restore — deliberate per code comment) | ✓ | flatten ON → one horizontal line 0–180° (screenshot) | "four decades 10°→180°" = 1/sin⁴(5°) = 1.7×10⁴ ✓ | OK |
| 5 Nucleus size | back at 0.193/3 M, flat off; "d_min reads 45.5 fm" ✓ | ✓ | 0.500 GeV/c seed 2 → Eₖ 33.5 MeV, d_min 6.8 fm, tail sags below dashed point-Coulomb (screenshot); chips "accelerator beam" + "grazes nuclear surface" | d_touch 8.9 = 1.2(197^⅓+4^⅓) fm ⇒ R_Au ≈ 7 fm ✓; (79/13)² = 36.9 ≈ "37×" ✓ | OK |
| Finish/Lecture | onComplete = 3 M free-exploration state; restore reopens card 1, answers "11111" preserved | | | | OK (NP-P2-1) |
| Formal ∑ | KaTeX renders all 3 equations; live line: 1.49 b/sr at 150° (calc 1.487), "1 in 26,000" (calc 1/25,991), d_min 45.5 fm (calc 45.53) | | | | OK |

Note (deliberate, not filed): pager-revisit of cards 3/4 restores the PRE-answer scene (overlay/flatten off) while the answered feedback text below still references the dashed curve / flat line — the sim's own comment blesses this restore semantics and the controls re-show either state in one click.

## Physics validation (calc transcript summary)
- Eₖ(0.193 GeV/c) = p²/2m_α = 5.00 MeV; d_min = 2·79·α·ħc/Eₖ = 45.53 fm → "45.5 fm" ✓. Eₖ(0.500) = 33.54 MeV, d_min = 6.78 fm → "33.5 MeV"/"6.8 fm" ✓ (relativistic Eₖ would be 33.39 MeV, −0.45 %; the sim states its non-relativistic convention in ∑ Formal).
- P(θ>90°) per incident α = n·t·(π d_min²/4)·[1/sin²45°−1] = 3.847×10⁻⁵ = 1 in 25,991 → "≈1 in 26,000" ✓; seeded 3 M run gives 115 (expected 115.4 ± 10.7) → "1 in 26,100" ✓.
- n·t = 5.907×10⁻¹⁷ fm⁻³ × 4.0×10⁸ fm = 2.36×10²² m⁻² → "2.4×10²²" ✓ (ρ = 19.32 g/cm³, A = 197).
- σ(≥1°)·n·t = 0.505 → "about half the α are not deflected even 1°" ✓; live 4 M-α run: 2.02 M scattered (z = −0.80), 153 backscatters (z = −0.07).
- dσ/dΩ(150°) = (zZαħc/4Eₖ)²/sin⁴75° = 1.487 b/sr → "1.49 b/sr" ✓; `window.__audit.at()` uses identical constants.
- d_touch = R_Au + R_α = 1.2·(197^⅓ + 4^⅓) = 8.89 fm; RaC′ 7.7 MeV ⇒ p = √(2m_α·Eₖ) = 0.240 GeV/c ✓; bin effective angles TEFF are the exact intensity-weighted angles for 1/sin⁴ (derivation checked); sampleTheta inverse-CDF and sigGT/sigBin integrals verified against ∫dσ.
- Trends: scat ∝ 1/Eₖ² across the slider walk ✓; suppression empties the θ>90° tail only once d_app < ~9 fm (verified 0.86→0.005 across 60°–175° at 33.5 MeV) ✓; plum Gaussian σ = 1.0° at 5 MeV, below plot floor by 7.5° ✓.

## Curriculum checklist
- "Set the experiment running and watch the pattern of α scintillations build up as a function of angle" → **met** (live dots on ZnS ring + counts-vs-θ histogram building in real time).
- "see it maps to the Rutherford scattering formula" (L4 LO: connect experiment to the formula) → **met** (solid 1/sin⁴ overlay + the ×sin⁴(θ/2) collapse test, card 4, + ∑ Formal with the full formula).
- "compare to what you'd expect in the Plum Pudding model" → **met** (dashed overlay + card 3); implemented as a prediction-overlay rather than the syllabus-sheet phrasing "switch between plum-pudding atom and nuclear atom" — a deliberate, labelled design ("the green points are the measurement — this switch never changes them") so a wrong model can't generate fake data; the plum expectation is still fully explorable.
- Adjustable params: α momentum ✓ (0.185–0.500 GeV/c, natural-source range flagged); model switch ✓.
- Key visuals: α source ✓, gold foil ✓, detection film (ZnS ring) ✓.
- L3 LO (large-angle scattering inconsistent with plum pudding → small dense nucleus) → **met and answerable from screen** (card 3 + counter at 150°).
- Inquiry Q "what can we conclude about the structure of gold atoms?" → **answerable** (card 3 + inq-after: charge must sit in a tiny massive nucleus).
- Inquiry Q "Can the diameter of the nucleus be estimated based on these data?" → **answerable** (card 5 sag → d_touch 8.9 fm → R_Au ≈ 7 fm; info modal gives diameter ≈ 1.4×10⁻¹⁴ m).
- Learning mode: Guided Inquiry → **met** (5 gated predict-commit cards).
- Hide Text boots CHECKED → **matches the registry's stated intent** ("default flipped — curriculum request").

## To verify (human)
- Eₖ = p²/2m_α is used throughout (stated in ∑ Formal); at the slider max the non-relativistic value is 0.45 % high (33.54 vs 33.39 MeV) — accepted as the sim's declared convention, listed for transparency.
- Historical default of 5.0 MeV (0.193 GeV/c) is a pedagogical choice; the actual 1909 runs used RaC/RaC′ (~7.7 MeV) — the sim flags natural-source range honestly. Accepted.
- One green point can sit visibly above the suppressed curve at extreme angles in flatten view at intermediate p (single-count Poisson bins, e.g. 1 count at ~170°, λ ≈ 0.5–1) — statistical, not a bug; a lecturer should expect it.
- Layout at ≤900 px width was not exercised beyond the 1000×700 probe.

## FIXES APPLIED (2026-08-26)
| ID | Verdict | Evidence / fix |
|---|---|---|
| PHY-P2-1 | CONFIRMED + FIXED | Info-modal `<dd>` (~L331) read "fall by about 10⁵ between 5° and 150°"; exact ratio `(sin 75°/sin 2.5°)⁴ = 2.40×10⁵` (node). Text corrected to "fall by about 2×10⁵ between 5° and 150°" — verified on-screen post-fix. |
| NP-P1-1 | ALREADY-RESOLVED | Fixed by the systemic sweep (SYS-2): `onReset` ends with `onStep(Shell.step)` (~L1226), re-syncing the scene to the active card. Left untouched. |
| NP-P2-1 | CONFIRMED + FIXED | Repro (headless, 1440×900): with beam playing, restore chip → `Shell.playing` stayed `true` at step 0 (predict card firing); same via 🎓 Lecture OFF. Fix at `setLectureMode` else-branch (~L595): `setPlaying(false)` after `inqShow(0)`, matching the paused boot staging. Post-fix: restore → `{playing:false, step:0}`; Lecture OFF → `{playing:false, step:0}`; Play and Reset from card 1 still behave (Reset resumes play by design). |
| NP-P2-2 | CONFIRMED + FIXED | Pre-fix load logged `favicon.ico -> 404` (sole console error). Added `<link rel="icon" href="data:,">` after `<title>`. Post-fix: zero favicon requests, zero console errors. |

Post-fix regression sweep: zero pageerrors; Hide-Text boots CHECKED with all 4 registered notes hidden, uncheck→recheck round trip restores/hides all 4; boot still opens in Lecture mode PAUSED. Screenshot: `gf-postfix-restore-paused.png` (scratchpad).

## Second review scan (2026-08-26)
**Scope:** re-review of `geiger-marsden-gold-foil-experiment.html?v=rev2` post-bb367ae, priority = critical physics bugs; headless puppeteer 25.0.4, 1440×900, `document.hidden=false`, `?v=rev2` cache-bust. **Console:** clean — 0 console errors, 0 pageerrors, 0 requestfailed across three sessions (favicon fix holds). **Verdict:** every prior physics finding still verified clean; four new NEW findings (all P2 — one pedagogy text nit, three flow/UX polish items). No new critical or P0/P1 issues.

Re-verified: all four bb367ae fixes hold — Info modal reads "fall by about 2×10⁵" (PHY-P2-1 confirmed clean); Reset from a card re-syncs the scene to that card's STEPS spec via `onStep(Shell.step)` (SYS-2/NP-P1-1 confirmed — card 2 Reset → gmN=20.0k baseline before firing resumes); Lecture-off / restore chip both reopen `{step:0, playing:false}` (NP-P2-1 confirmed via headless probe); zero `favicon.ico` requests, zero console errors (NP-P2-2 confirmed).

Re-verified physics (screenshots `gf-rev2-boot.png`, `gf-rev2-card{1..5}.png`, `gf-rev2-card5-answered.png`, `gf-rev2-finish.png`, `gf-rev2-restore.png`, `gf-rev2-card1-after-reset.png`, `gf-rev2-finish-from-card5-accel.png`, `gf-rev2-final.png` in scratchpad):
- `__audit.at(150°)` = 1.4866 b/sr (theory 1.487) ✓; matches `syncUI` live line "1.49 b/sr" ✓.
- 5-stop slider walk over {0.185, 0.240, 0.310, 0.400, 0.500} GeV/c at Nf=3M seed 4517 reproduced digit-for-digit against a node replay: gmScat {1.80M, 634.5k, 227.9k, 82.2k, 33.6k} vs theory {1.79M, 631k, 227k, 82k, 33.7k} — all within Poisson noise (max |z| ≈ 1.0σ, below 3σ). d_min {49.6, 29.4, 17.6, 10.6, 6.8} fm matches d=227.5/Ek to displayed precision at every stop. gmBack {128, 45, 22, 11, 0} vs theory {115, 48, 17, 6, 2} — max |z| = 1.9σ (p=0.400), below the 3σ flagging threshold and consistent with seed-4517 realisation.
- **Data invariance under prediction toggles reconfirmed** (was the deliberate-counterfactual check): at p=0.193 the 3M live run gmScat/gmBack stayed exactly identical across NUC↔PLUM overlay and flat off↔on toggles (1.52 M / 110 through all four states — plum-pudding overlay proven not to leak into measured data).
- Live Monte-Carlo 15 s @ 100 k α/s × 4× speed: 8.99 M incident α → 4.54 M scattered ≥1° (theory 4.541 M, z = −0.09σ) → 325 back-scatters (theory 345.9, z = −1.12σ). Both within 3σ; consistent with seeded MC engine.
- Pager round trip (5 fwd + 5 back): every per-card fingerprint identical to forward pass (STEPS[0..4] baselines all deterministic).
- Rapid stress: 40-event slider scrub (paused) + 30× overlay/flatten toggle cycle — no console error, no listener duplication, state self-consistent (final `{p:0.500, gmScat:33.5k, gmBack:0, Nf:3M}` matches slider-final applyRun).
- Hide-Text: `#shell` innerText length 950 (checked) ↔ 1626 (unchecked) = 676-char delta = exactly the four registered `.ht-hide` notes' lengths + separators, matching the prior review's canvas measure. No unregistered content vanishes.
- Canvas is painting: 1090×808 backing store, 260,628 non-black pixels; theme-aware colour reads sensible.

### PHYSICS
#### P0
none
#### P1
none
#### P2
- **[PHY-P2-2] [text] [med]** Info-modal Sub-question says "when the large-angle counts sag below the **Rutherford** curve the α is grazing the nuclear surface", but the sim's on-screen labels are `Rutherford × nuclear absorption` (solid, accent) once `d_min < 12 fm` and `point Coulomb (no nuclear size)` (dashed, muted) — the sag the student is asked to see is below the **dashed point-Coulomb** curve, not the solid one (the solid curve already includes the absorption factor and drops with the data). Repro: ⓘ Info at any state. Card 5's own correct-answer feedback gets this right ("sinks below the dashed **point Coulomb** curve"); only the info modal's shorter phrasing is ambiguous. Anchor: info-modal `<dd>` at L334. → **Fix:** replace "sag below the Rutherford curve" with "sag below the dashed point-Coulomb curve" (matches card 5 wording and the on-screen legend).

### NON-PHYSICS
#### P0
none
#### P1
none
#### P2
- **[NP-P2-3] [flow] [high]** Reset while card 1 (predict-first) is active resumes play — the shell's reset handler unconditionally calls `setPlaying(true)` (L679), overriding the paused predict-first affordance that NP-P2-1 protected on Lecture-off/restore. Repro (headless, 1440×900): open sim → Lecture OFF (card 1 paused, gmN=0) → ↻ Reset → observed `{step:0, playing:true, gmN:14.1 k}` in ~1.5 s (screenshot `gf-rev2-card1-after-reset.png`); the "empty apparatus" scene the card 1 prose promises ("Where will they land?") is immediately overwritten by live firing. Anchor: shell handler L679, `if(reset) reset.addEventListener('click',()=>{ onReset(); last=performance.now(); setPlaying(true); });`. → **Fix:** at end of sim `onReset` (~L1227) add `if(SH && SH.step===0) SH.setPlaying(false);` — matches the paused-boot pattern the NP-P2-1 fix established for the same card.
- **[NP-P2-4] [flow] [high]** Finish (or 🎓 Lecture) after answering card 5 discards the just-committed accelerator-beam evidence. Repro: from restore-chip, pager to card 5 (`{p:0.193, Ek 5.0, d_min 45.5}`) → click correct choice → state jumps to `{p:0.500, Ek 33.5, d_min 6.8, gmBack 0}` (the "large-angle counts sag" that the card just introduced) → click Finish → `onComplete` forcibly runs `applyRun(0.193, 3M, 8)` → state resets to `{p:0.193, Ek 5.0, d_min 45.5, gmBack 115}` (screenshot `gf-rev2-finish-from-card5-accel.png`). The completed free-exploration state discards the last card's evidence; the student who just committed to "sag below point-Coulomb" enters lecture mode with the sag no longer on screen. Anchor: `onComplete` L1222–1223 (`applyRun(0.193,3000000,8)`). → **Fix:** in `onComplete`, keep the current `st.p` if it was set by card 5's answer, e.g. `var p=(st.p>PNAT?st.p:0.193), seed=(st.p>PNAT?2:8);` then `applyRun(p,3000000,seed);`. Alternative: apply the last answered card's data-run instead of the fixed default.
- **[NP-P2-5] [ux] [med]** `st.nAbs` (α absorbed by the nucleus) is tracked by `record()` at L864 (`if(th<0){ st.nAbs++; return; }`) but never surfaced. Card 5's correct-answer feedback and info-modal Sub-question both talk about "grazing α are absorbed" and the central flash is labelled "α absorbed by nucleus", yet no live readout confirms it. At p=0.500 / 3 M seed 2 (card-5 correct-reveal state), the tail is clearly gone from the histogram but the mechanism has no visible counter; the "sag" is only inferable from the plot. Anchor: `record()` L864 accumulates; `updateCounts()` L911 has no `gmAbs` row (readouts panel L497–500 has four rows only). → **Fix:** add a fifth row `<div class="sim-row"><span>α absorbed by nucleus</span><b id="gmAbs">0</b></div>` in the Live counts panel (~L500) and one `txt('gmAbs',...)` line in `updateCounts` — no new controls, no physics change. Curriculum-adjacent polish.

## Control census (second scan — deltas only)
| control | new observation this pass |
|---|---|
| ↻ Reset | while step=0 (card 1), Reset resumes play — leaves gmN=14.1 k in 1.5 s instead of the paused N=0 the card 1 scene requires (NP-P2-3). |
| Finish / 🎓 Lecture | after card 5 correct answer, wipes the p=0.500 accelerator configuration back to 0.193 baseline (NP-P2-4). |
| — | `st.nAbs` internal counter has no bound DOM row (NP-P2-5). |

## Combination coverage manifest (second scan)
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| overlay {Ruth, plum} × flatten {off, on} at p=0.193, Nf=3 M live | exhaustive | 4 | gmScat/gmBack byte-identical across all 4 states (1.52 M / 110) | 4/4 pass |
| momentum walk × seed 4517 at Nf=3 M | 5 stops + reverse | 5 | gmScat matches theory to ≤1σ at every stop; d_min matches 227.5/Ek exactly | pass |
| card walk (1→5, all correct answers, then Finish) | exhaustive | 5 answers + Finish | reveal fires once per card; STEPS[0..4] applied deterministically | pass (NP-P2-4 exposed on Finish) |
| pager round trip 0..4..0 | exhaustive | 10 stops | per-card readouts identical fwd vs back | pass |
| rapid mutations | sampled | 40 slider events + 30 toggle cycles | zero errors, listener count nominal, final state consistent | pass |
| Lecture/restore cycle | exhaustive | 3 cycles (ON→OFF→ON→OFF) | NP-P2-1 pause-on-reopen holds every cycle | pass |
| Reset × active card | 2 sampled (card 1, card 2) | 2 | card 2: correct SYS-2 re-sync; card 1: NP-P2-3 exposed | 1/2 pass |
| live MC 15 s @ 100 k×4 | 1 long run | 6 M new α | scat z=−0.09σ, back z=−1.12σ vs theory | pass |
| favicon.ico probe | boot + reload | 2 | zero requestfailed events (bb367ae holds) | pass |

## Inquiry-layer check (second scan)
No changes to the per-card scene≍claim / gate / reveal / feedback mapping recorded in the first scan; all five cards, ∑ Formal, and Finish still verify. Pager restore semantics for cards 3/4 (pre-answer scene shown while answered feedback text remains visible) — blessed by the sim's own code comment — unchanged. Only the two new **flow-only** findings NP-P2-3 (Reset on card 1) and NP-P2-4 (Finish after card 5) affect the inquiry surface.

## To verify (human, second scan)
- The p=0.500 correct-answer state is retained by history/answers even after `onComplete` wipes the readouts; NP-P2-4 is a UX/pedagogy continuity gap rather than data loss.
- NP-P2-3 is the same predict-first affordance NP-P2-1 protected — flagging it as P2 (not P1) because Reset is documented as "replay-from-start"; a lecturer using Reset from card 1 will still lose the paused-empty scene the card asks for.
- All numerical claims verified via `node -e` transcript (EXT90=3.162°, plum crossover at 5 MeV=7.03°, backscatter theory at each slider stop) — see the scratchpad script `gf-rev2.js`/`gf-rev2-b.js`.
