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
