# Review — spin-and-helicity.html ("Spin & Helicity — Overtake an Electron", curriculum: Syllabus-brainstorm L6 "Solutions of the Dirac Equation" · Simulation Descriptions row "Spin and Helicity")
**Verdict:** Physics core is exact — 50/50 p×β grid combos match explicit `p′ = γ(p − βE)` calculations to the displayed digit, the flip/undefined window and chirality boost-invariance behave perfectly — but card 4's feedback prints a wrong β_e (0.99997; true value 0.99967, all three choices) and Reset desyncs the scene from the active inquiry card.
**Console:** clean — zero sim errors/pageerrors at every stage (one `/favicon.ico` 404 from the static file server; no sim asset involved).
**Combos tested:** 50 exhaustive (5 p × 10 β grid) + ~110 sampled (16-point flip scan, 3 jump chips + 10× repeat, flow mutations, 70-event scrub stress, 12 inquiry states).

**Curriculum note (required disclosure):** the curriculum row for this sim is SPARSE — Syllabus-brainstorm L6 gives only "Spin/helicity visualiser: adjust momentum to observe spin projection changing" + inquiry "Reflections on helicity"; the Simulation Descriptions row is one line. Per the skill's rule the LOs were **derived from the Info modal**: (1) helicity h = S·p̂ is frame-dependent for massive particles and flips under an overtaking boost (β > p/E); (2) chirality is frame-invariant, P_R,L = (1±β_e)/2; (3) helicity → chirality as E ≫ mc² (the meaning of "left-handed neutrino"). These match the skill canon's Helicity/chirality entry exactly.

**Review environment:** headless Chrome (puppeteer-core, 1440×900, `document.hidden = false`, rAF live — animation verified running, drift directions measured from live frames). Read-only: the sim file was not touched. Screenshots in the session scratchpad (`sh-initial/card2-revealed/card4-maxboost/reset-desync/formal-light/light-overtaken/…​.png`).

## PHYSICS
### P0   (wrong physics on screen: number, sign, trend, animation, or card/feedback text)
- **[PHY-P0-1] [high]** Card 4 feedback prints β_e = 0.99997 for the p = 20 MeV electron; the true value is p/E = 20/√(20² + 0.511²) = **0.999674** — the claim understates 1−β_e by ×10 (3×10⁻⁵ vs 3.26×10⁻⁴). Repro: card 4, click any choice. Observed: "β_e = 0.99997 sits beyond the slider" (correct-choice fb; the other two choices repeat the number). Evidence: `sh-card4-maxboost.png` + explicit python calc. The qualitative conclusion (flip out of the slider's reach; p′ bottoms at +0.11 MeV — verified: γ(20 − 0.9995·20.00653) = 0.1099 MeV) is unaffected. Anchor: the three `data-fb` strings, lines 454–456. → **Fix:** replace "0.99997" with "0.99967" (and "≈ 0.99997" with "≈ 0.99967") in all three feedbacks.
### P1   (physics gap/imprecision that can mislead)
- none
### P2   (physics polish: notation, sig-figs, edge-of-range inaccuracy)
- **[PHY-P2-1] [high]** The formal box and Info modal write the chiral fraction as P_R,L = (1±β)/2 with a bare β — the same symbol as the **observer boost** slider, whose whole lesson is that it does NOT move this quantity; cards 3–4 carefully write β_e. Repro: ∑ Formal → third box. Anchor: `eqC` KaTeX string L1070 + Info modal L350/363. → **Fix:** subscript it: `P_{R,L}=\dfrac{1\pm\beta_e}{2}` (and "(1±β_e)/2" in the modal).
- **[PHY-P2-2] [med]** At high p the sidebar "h flips at β =" shows **1.000** (toFixed(3) of 0.99967) and the flip tick clamps to 100% of the boost bar — visually placing the flip AT the slider's end while card 4 teaches it is beyond reach (and β = 1 is unphysical). Repro: p = 20 MeV. Evidence: `sh-card4-maxboost.png` (sidebar). Anchor: `flipLab … bP.toFixed(3)` / `flipTick … Math.min(100, …)` L1011–1012. → **Fix:** show 4 decimals when bP > 0.999 (0.9997) or render "> 0.9995 (off scale)" and park the tick just past the bar end.

## NON-PHYSICS
### P0   (dead control, crash, data-loss flow bug, broken gate/reveal, unusable overlap)
- none
### P1   (degraded flow, silent config reset, missing curriculum affordance, bad overlap)
- **[NP-P1-1] [flow] [high]** Reset desyncs the scene from the active inquiry card: `onReset` always applies the baseline `apply(1, 0)`, so with card 2/3/4 active the card's on-screen claims ("Overtaken at β = 0.9, h = −1"; "At p = 20 MeV… the bar ≈100% R") contradict the scene (p = 1 MeV, β = 0, h = +1, 94.5% R). Repro: reach card 4 → ↻ Reset. Observed live: active card = 4, readouts p 1.00 MeV / β 0.0000 / 94.5% (`sh-reset-desync.png`). Anchor: `onReset` L1084–1088. → **Fix:** after the baseline, re-apply the active card's spec when the inquiry is open — `if(!document.getElementById('shell').classList.contains('inquiry-collapsed')) onStep(Shell.step);` — the same pattern used to fix build-a-baryon (its NP-P1-1).
### P2   (polish, cosmetics, minor responsiveness)
- **[NP-P2-1] [cosmetic] [high]** Canvas chip shows "boost β = 1.000" at slider max (toFixed(3) of 0.9995) while the sidebar reads 0.9995 — an on-canvas β = 1 that never happened. Known issue, verified as shipped here. Repro: overtake chip. Evidence: `sh-card4-maxboost.png` / `sh-overtake-max.png` + fillText intercept ("boost β = 1.000"). Anchor: `chipBox(… state.betaObs.toFixed(3) …)` L979. → **Fix:** `toFixed(4)` on the chip (matches the sidebar) — also fixes "boost β = 0.891" at 0.8905.
- **[NP-P2-2] [ux] [med]** Light theme: the canvas keeps the DARK palette (dark chips, grey chirality panel, faint track) because `themeCols()` reads `getComputedStyle(document.documentElement)` while the toggle sets `body.light-theme` — the overridden vars live on body, not html. Everything stays readable (verified `sh-light-overtaken.png`), just inconsistent. Anchor: `themeCols()` L798–807. → **Fix:** read `getComputedStyle(document.body)`.
- **[NP-P2-3] [ux] [low]** Scrubbing either slider auto-pauses the animation (`pauseForScrub` — deliberate, and the Play button visibly flips) but the three jump chips do not, and nothing resumes play afterwards; a student who scrubs once sees a static scene until they press ▶. Anchor: `pauseForScrub` L1037–1039 vs `setBeta` L1051. → **Fix (optional):** resume on `change` (slider release), or leave — but make chips and sliders consistent.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| electron momentum p (log slider −1.31…1.31, step .01) | min → quartiles → max (×10 β each) + 30-event scrub | pVal, rE, rP, rC, flipLab, flipTick all track 10^val exactly (formulas reproduced digit-for-digit) | OK |
| observer boost β (0…0.9995, step .0005) | 10 grid stops + 16-point flip scan + 40-event scrub | rE′/rP′/rH/rV per boost transform; rC strictly invariant | OK |
| lab β=0 chip | clicked | β → 0, baseline readouts | OK |
| ride along chip | clicked | β snaps to 0.8905; rP "≈ 0", rH "undefined (p′ ≈ 0)", **E′ = 0.511 MeV = mc²** (nice invariant) | OK |
| overtake chip | clicked + 10× repeat | β → 0.9995, rH −1, rP −3.87 MeV; repeat idempotent, no listener duplication | OK |
| ‹ › pager | 4→1→4 round trip | scene fingerprints identical per card (presets re-applied), answers preserved | OK |
| Next / Finish | full walk | gate-disabled pre-answer on cards 2–4; Finish collapses + onComplete baseline | OK |
| choices (3 × 3 gated cards) | correct path (c2, c4), wrong path (c3), double-click | styling correct/wrong/dim; feedback shown; reveal fires once (`dataset.answered` guard verified) | OK |
| 🎓 Lecture / restore chip | on→off, chip | collapsed + free-exploration baseline; reopen at card 1 with answers kept | OK |
| Hide Text | check→uncheck | `hide-text` class toggles; registry empty as declared — innerText delta 0, no unregistered content vanishes | OK |
| ☾ theme | round trip | full config (p=10, β=0.75) persists; canvas palette lag → NP-P2-2 | OK (P2) |
| ⛶ Maximize / ∑ Formal / Speed / Info | round trips | config persists through all; 3 KaTeX equations render and are correct (β notation → PHY-P2-1); modal opens/closes | OK |
| ↻ Reset / ⏸ Play | clicked | resets to (1 MeV, 0) + resumes play; card desync → NP-P1-1 | OK (P1) |
| canvas | — | no canvas interactions in this sim (`#cv{cursor:grab}` CSS is a dead template leftover — no `#cv` element exists; harmless) | n/a |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| p × β grid: p ∈ {0.049, 0.224, 1, 4.57, 20.4 MeV (slider-snapped)} × β ∈ {0, .25, .5, .75, .85, .89, .8905, .95, .99, .9995} | exhaustive | 50 | every readout string == node-replicated formula (E′, p′, β_rel, flip β, P_R,L); h ≡ sign(p′) outside \|β_rel\| < 0.004; **rC identical across all 10 β per p** (chirality boost-invariance); no NaN; readouts finite | 50/50 pass |
| Flip scan p = 1 MeV, β = 0.887→0.8945 step .0005 | exhaustive | 16 | +1 below, undefined window exactly at 0.890–0.891 (\|β_rel\| < .004), −1 above — discontinuous jump, no fade | pass |
| Jump chips | exhaustive | 3 (+10× stress) | targets exact; ride-along parks at p′ ≈ 0 with E′ = mc²; idempotent | pass |
| Flow mutations: (p=10, β=.75) × {theme, maximize round-trip, speed 4×, formal, pause/play} | sampled | ~10 | no control silently resets another — full config persisted through every mutation | pass |
| Stress: 40 β-scrub + 30 p-scrub events | sampled | 70 events | zero console errors, final state exactly consistent (rE 0.719 MeV @ (1, 0.5) = γ(E−βp) ✓) | pass |
| Inquiry states: 4 cards fwd, reveals, wrong path, pager back/fwd, Reset-during-card, Finish, restore, Lecture on/off | exhaustive | 12 states | scene == card preset ([1,0],[1,.5],[1,.9],[20,.9]); reveals hit targets (β .9 / p 20 / β .9995) | pass except NP-P1-1 |
| Animation truth | sampled | 2 | live-frame label tracking: drift +155 px (lab, h=+1 moves along +p̂) / −174 px (overtaken — electron falls behind); spin marker sense fixed | pass |
| Skipped (disclosed) | — | flip scans at p ≠ 1 MeV (grid already crosses the sign change at every p); sub-1000-px responsive layout; assistive tech | — |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 · One electron, two arrows | [1, 0]: badge h=+1, p′ +1.00 MeV ✓ | ungated | — | prose ✓ (h = S·p̂ aligned) | OK |
| 2 · Overtake it | [1, 0.5]: p′ +0.51 MeV ✓, flip mark 0.890 ✓ | ✓ disabled pre-answer | overtake → β=0.9; rP −24.5 keV, rH −1 ✓ | all 3 fbs numerically verified (−24.5 keV on screen); double-answer guard ✓ | OK |
| 3 · Chirality ≠ helicity | [1, 0.9]: h −1, rC 94.5% ✓ (same as pre-flip) | ✓ | raisep → p=20 keeping β; rC ≈100% ✓ | wrong-path tested: wrong styled red, correct pops green, fb "chirality is frame-invariant" ✓ | OK |
| 4 · The massless limit | [20, 0.9]: h +1 ✓, ≈100% R ✓, flipLab "1.000" (=prose; see PHY-P2-2) | ✓ | maxboost → β=0.9995; rP +0.11 MeV ✓, h stays +1 ✓; `.inq-after` revealed ✓ | **β_e = 0.99997 wrong → PHY-P0-1**; p′ +0.11 MeV claim exact | PHY-P0-1 |
| pager / finish / restore / lecture | 4→1→4 fingerprints identical; Finish → collapse + baseline; restore & Lecture-off reopen card 1, answers preserved | | | | OK |
| Reset during card | — | | | scene → baseline under cards 2–4's claims | NP-P1-1 |

## Curriculum checklist
- "Adjust momentum to observe spin projection changing" (Syllabus-brainstorm L6 / Sim Descriptions) → **met**: p slider drives β_e, flip point, chirality bar; the spin arrow itself deliberately never moves — the momentum reversal changes h, which is the physically correct reading of the sparse row.
- Inquiry "Reflections on helicity" → **met**: cards 2–4 are precisely predict-commit reflections on helicity's frame-dependence, chirality's invariance, and the massless limit.
- Derived-LO 1 (h flips under overtaking boost, β > p/E) → **met** — flip scan + card 2 (canon: Helicity/chirality entry ✓).
- Derived-LO 2 (chirality boost-invariant, P_R = (1+β_e)/2) → **met** — rC identical across all 50 grid combos; card 3.
- Derived-LO 3 (helicity → chirality as E ≫ mc²; "left-handed neutrino") → **met** — card 4 + inq-after; numeric feedback flaw = PHY-P0-1.
- Guided Inquiry mode with gated predict-first cards → **met** (4 cards, 3 gated, optional — sim fully usable throughout).

## To verify (human)
- Fine print on "chirality is boost-invariant": rigorously, γ⁵ commutes with boosts so L/R components never mix, but the u†u-normalized weight of a helicity eigenstate is frame-dependent; the sim (and the course canon + standard texts) pins P_R,L to the electron's lab-frame β_e. This is the intended teaching — flagged only so a lecturer can decide whether a footnote is wanted.
- Sub-1000-px stacked layout and touch scrubbing were not exercised this run (1440×900 only; wide layout verified clean in dark and light screenshots).
- The favicon 404 is emitted by the plain http.server for every sim; confirm the deployment host serves one (cosmetic, console-noise only).

## FIXES APPLIED (2026-08-26)
Phase-1 reconfirmation: every finding re-reproduced in headless Chrome (1440×900, fresh loads, fillText intercept) and recomputed with node (m_e = 0.511 MeV) before any edit. Card 4's convention is momentum (prose: "At p = 20 MeV"), so β_e = 20/√(20² + 0.511²) = 0.999674 — the review's 0.99967 is correct under the sim's own convention (an E=20-total reading gives the same 0.99967; only T=20 would give 0.99969, and nothing in the sim says kinetic).

| ID | Verdict | Evidence / fix |
|---|---|---|
| PHY-P0-1 | **CONFIRMED + FIXED** | Live `.predict-eval` showed "β_e = 0.99997" (all 3 choices); node: p=20 → β = 0.999674. Fixed all three `data-fb` strings to 0.99967. Post-fix: `grep -c '0.99997'` = 0, `grep -c '0.99967'` = 3; all three feedbacks re-asserted on fresh loads. |
| PHY-P2-1 | **CONFIRMED + FIXED** | Sidebar slider "observer boost β" vs bare-β chiral fraction in ∑ Formal (`eqC` KaTeX L1071 + static fallback L502) and Info modal (L350, L363). All four now read β_e / β<sub>e</sub>; live DOM has zero remaining "(1±β)/2", KaTeX renders `\beta_e`. |
| PHY-P2-2 | **CONFIRMED + FIXED** | Live at p = 20.4 MeV: flipLab "1.000", tick clamped to 100% (slider max 0.9995 → flip shown as reachable). Fixed: `d.bP.toFixed(d.bP > 0.999 ? 4 : 3)` → flipLab now "0.9997" at high p ("0.890" at 1 MeV unchanged); card-4 prose "h flips at β = 1.000" updated to 0.9997 to stay in sync. Tick clamp left as-is (readout now unambiguous). |
| NP-P2-1 | **CONFIRMED + FIXED** | fillText intercept at slider max captured "boost β = 1.000" while sidebar read 0.9995. Chip `toFixed(3)` → `toFixed(4)` (L979); post-fix intercept captures "boost β = 0.9995". |
| NP-P2-3 | **CONFIRMED + FIXED** | Live: slider input → Shell.playing false; jump chip → stayed true. Added `pauseForScrub()` to the three chip click handlers (not inside `setBeta`, so card-reveal `setBeta` calls keep their behaviour). Post-fix: slider + all three chips pause consistently. |
| NP-P1-1 | **ALREADY-RESOLVED** | Fixed by the systemic sweep (SYS-2/SYS-4); not touched this pass. |
| NP-P2-2 | **ALREADY-RESOLVED** | Fixed by the systemic sweep (SYS-2/SYS-4); not touched this pass. |

Post-fix assertion run: zero pageerrors across all fresh loads; screenshots `sh-fix-final-card4.png`, `sh-fix-maxp-maxbeta.png` in the session scratchpad.
