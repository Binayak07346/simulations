# Review — particle-detector-headquarters.html ("Particle Detector Headquarters", curriculum: Simulation Descriptions row "Particle Detector Headquarters" · Lecture 24 The Future of Particle Physics — ATLAS-style layered detector)

**Verdict:** Physics layer is fully clean — all 40 species×momentum readout combos match independent calculation to the last digit, every card number verified, all eight signatures canonical on screen. Two real non-physics flow bugs: Reset desyncs the scene from the active inquiry card, and a dead `window.Shell` guard silently kills the slider auto-pause and the reveal auto-resume.
**Console:** clean (the single 404 is the local test server's missing /favicon.ico — not a sim defect).
**Combos tested:** 45 exhaustive (40 species×momentum matrix + 5 Cherenkov-threshold walk) + ~60 sampled (flow mutations, stress, inquiry walk, pager round trip, lecture/hide-text/pause flows).
**Method:** headless puppeteer (Chrome, 1440×900, `document.hidden=false` — animation live), full readout extraction per combo, python cross-check of every number, 20+ screenshots.

## PHYSICS

### P0
none

### P1
none

### P2
- **[PHY-P2-1] [high]** Track bend angle saturates for p ≲ 1.06 GeV: bend = `min(0.62, 0.34/p, atan(clear/dxRun))` and the geometric clip term (≈0.32 rad at 1440×900) wins below ~1.06 GeV, so the proton track at p = 0.2 is pixel-identical to p = 1.0 — the r = p/qB "curvature measures momentum" trend is invisible over the lower half of the slider (it works 1→5 GeV: 0.34 → 0.068 rad). Repro: fire p at 0.2 then 1.0, compare. Evidence: dhq-F-pr02.png vs dhq-F-pr1.png (identical curvature). Anchor: `buildEvent`, `const mag = Math.min(0.62, 0.34 / p, Math.atan(clear / dxRun))` (~L874). → **Fix:** raise/remove the geometric cap (allow the low-p track to exit through the tracker's top/bottom edge, as real low-p tracks curl out) or lower the 0.34 constant so `0.34/p` is the binding term across the whole 0.2–5 range.
- **[PHY-P2-2] [med]** Hadronic-calorimeter deposit shown = kinetic energy for ALL hadrons (π⁺@1 GeV: ECAL 0.26 + HCAL 0.61 = KE 0.87 vs E 1.010; K⁺@1: total 0.62 vs E 1.115). KE-only is right for p and n (baryon number protects the rest mass) but mesons carry no such conservation law — a π's rest energy does end up in the shower, so real calorimetric response for mesons ≈ E. A student cross-checking "Energy E 1.010 GeV" against the meters sees an unexplained 0.14 GeV gap. Evidence: readouts + meter labels in dhq-F-pi5.png / matrix data. Anchor: `buildEvent` deposit block, `dep.hcal = Math.max(0, kin.KE - mip)` (~L925). → **Fix:** deposit ≈E for π/K and KE for p/n (or add one caption word, e.g. "kinetic energy deposited"). Flagged for human physics judgement — the KE idealization is defensible.
- **[PHY-P2-3] [high]** Electron/muon TOF delay renders as "+0.000" at high p (e⁻@1 GeV true delay 4×10⁻⁶ ns) — floor "<0.001" would avoid implying an exactly-zero delay for a massive particle. Anchor: `fmtDelay` (~L1201). → **Fix:** return `'<0.001'` when dns < 0.001.

## NON-PHYSICS

### P0
none

### P1
- **[NP-P1-1] [flow] [high]** Reset desyncs the scene from the active inquiry card: `onReset` hard-sets π⁺ @ 1 GeV, so with card 1 active ("An e⁻ enters from the left: curved track…") the sim fires a pion under prose describing an electron; same for cards 2–6. Repro: fresh load (card 1, e⁻ on screen) → ↻ Reset → chip π⁺ pressed, "pion · m = 0.1396 GeV". Evidence: dhq-reset-desync.png; browser state {card:0, sel:"pion…"}. Anchor: `onReset` (~L1302). → **Fix:** when the inquiry is open, re-apply the active card's spec after the default reset — `onStep(Shell.step)` — the pattern build-a-baryon adopted for the identical bug (its NP-P1-1).
- **[NP-P1-2] [functional] [high]** `window.Shell` is `undefined` (the shell's `const Shell` is lexical, never assigned to `window`), so both `if (window.Shell && Shell.setPlaying)` guards are dead code — verified live (`typeof window.Shell === 'undefined'`): (a) the momentum slider's intended pause-and-show-completed-event never engages — playPaused stays false after every scrub; the one-frame instant event is immediately re-fired as a fresh animation; (b) card reveals never force-resume play — a student who pressed Pause mid-inquiry and then commits card 6 gets `buildEvent(false)` frozen at clock 0: blank scene + race at the start line while the feedback claims "p−π falls 12 ns → 0.6 ns", until they notice Play. Repro: (a) drag slider while running, Play button never flips; (b) Pause → answer card 6 → frozen scene. Anchor: `momEl.addEventListener('input',…)` (~L1237) and the `data-reveal` handler (~L1258). → **Fix:** drop the `window.` — `Shell` is in scope in the same script — or add `window.Shell = Shell;` after the shell IIFE.

### P2
- **[NP-P2-1] [ux] [med]** TOF-race lane roster drops the proton when a non-π/K/p massive species is selected (`laneKeys`: selected + fill from π,K → μ⁻ selected gives lanes light/μ/π/K, no p) — the heaviest reference racer, the star of cards 5–6, silently vanishes. Repro: fire μ⁻; strip shows no p lane. Evidence: dhq-race-mu.png. Anchor: `laneKeys()` (~L1128). → **Fix:** fill from the far end (['pr','ka','pi']) or allow a 5th lane so p is always present.
- **[NP-P2-2] [inquiry] [med]** Revisiting an answered card restores the PRE-answer scene under POST-answer feedback: pager back to card 6 shows p = 1.0 GeV/c while the visible green feedback cites the 5-GeV gaps ("0.6 ns"), and Finish from there leaves p = 1 — so Lecture-ON / pager-Finish free-exploration state (pr @ 1.0) differs from a straight click-through completion (pr @ 5.0). Deterministic per-card STEPS re-application is by design; only the answered-card + reveal-referencing-feedback pairing confuses. Repro: complete inquiry → ‹ back → › forward to card 6. Evidence: pager trace (momVal "1.0 GeV/c" at card 6 revisit). Anchor: `onStep` + `STEPS[5]` (~L814). → **Fix:** for answered cards with a `data-reveal`, re-apply the revealed state (e.g. store a post-answer spec per card), or accept as design.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| 8 particle chips e⁻ γ μ⁻ π⁺ K⁺ p n ν | each ×5 momenta + 12-click stress on K⁺ | aria-pressed, sel-name, all 5 readouts, canvas signature (screenshots) | OK |
| Momentum p slider 0.2–5 (step 0.1) | 0.2 / 0.6 / 1 / 2.5 / 5 ×8 species + 35 rapid scrubs | slider value, momVal label, E/β/TOF/Cherenkov readouts move as physics predicts; no error floods | OK (auto-pause intent dead → NP-P1-2) |
| Play/Pause | pause → fire → play | paused fire renders instant completed event; selection persists on resume | OK |
| Reset | during card 1 | resets to π⁺@1 — desyncs from card (NP-P1-1); loop restarts | P1 |
| Speed select | 1× default exercised; others not asserted (pure dt multiplier in shell) | — | OK (code-verified) |
| Theme ☾/☀ | toggle + back at K⁺@2.5 | selection, momentum, readouts all persist; canvas refits | OK |
| ⛶ Maximize | on/off at K⁺@2.5 | config persists; aside+formal collapse; header restore reachable | OK |
| ∑ Formal | open/close | all 5 equations KaTeX-rendered (screenshot); config persists | OK |
| 🎓 Lecture / restore | on→off | ON: collapsed+playing, free exploration (pr@1); OFF: card 1, e⁻ scene, answers preserved | OK |
| Hide Text | check→uncheck | hide-text class toggles; innerText delta 0 — registry empty, matches manifest | OK |
| ⓘ Info modal | content code-reviewed (numbers verified: β>0.75188, muon caveat) | — | OK |
| ‹ › pager, Next/Finish | full round trip 6→1→6 | see inquiry table; ends disabled correctly | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| species × momentum {0.2, 0.6, 1, 2.5, 5} | exhaustive | 40 | E=√(p²+m²), β=p/E, γ=E/m (∞ for m=0), TOF=10 m/βc + delay, Cherenkov state vs β≷1/1.33 & q, signature string canonical, sel-name mass = PDG (e .000511, μ .10566, π .13957, K .49368, p .93827, n .93957 GeV), momVal echo — all string-exact vs python | 40/40 pass, 0 mismatches |
| Cherenkov threshold walk | sampled at boundaries | 5 (p@1.0/1.1, K@0.5/0.6, π@0.2) | flips off→ON across p_thr = m/√(n²−1) (p 1.070, K 0.563, π 0.159 GeV) | 5/5 pass |
| mass-shell invariant (`__audit`) | sampled | 4 (p = 0.2, 1, 2.5, 5) | E²−p²−m² residual ≤ 1.2e−15 GeV² | pass |
| card-quoted numbers | exhaustive | 8 (1.371/1.010 GeV, 45.74/33.68 ns, 12 ns, 0.57→"0.6", 0.149→"0.15" ns, ~1.07→"~1.1" GeV, 0.752) | explicit python recomputation | all match |
| flow mutations | sampled | K⁺@2.5 × {theme, maximize, formal, pause→fire→play} | no silent config reset; readouts identical before/after | pass |
| stress | sampled | 35 rapid slider scrubs + 12 repeated chip clicks | no console errors, state consistent (K⁺@2.0 after last scrub), no listener duplication symptoms | pass |
| inquiry walk incl. wrong path + double-answer | exhaustive over cards | 6 cards + pager round trip ×2 + finish/restore + lecture on/off | see below | pass |
| skipped | — | speed multiplier visual timing at 0.25–4× (shell-owned dt scaling, code-verified only); light-theme full visual pass (readouts asserted, pixels not re-inspected) | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 Reading the layers | e⁻@1: curved track (bends down, q<0) → EM shower, 1.00 GeV meter | ungated | — | — | OK |
| 2 Now fire a photon | e⁻ held pre-answer; reveal fires γ | ✓ Next disabled pre-answer | fire:ph — wavy line, "no track (neutral)" chip, EM shower | correct; "no track — yet ECAL absorbs it" matches screen | OK |
| 3 Muon chambers | γ settled pre-answer | ✓ | choice — wrong pick "p" fired p (stops in HCAL), wrong red + correct μ⁻ green, Next unlocked | "Mass ≠ reach" + proton visibly one layer short | OK (wrong path verified) |
| 4 Invisible particle | μ settled pre-answer | ✓ | fire:nu — dashed ghost, red "missing p" arrow + chip | feedback's named red arrow really on screen | OK |
| 5 Three fingerprints | π@1 (E 1.010 shown); race π 33.68 / p 45.74 ns | ✓ | fire:pr — E flips to 1.371 GeV, TOF 45.74 (+12.4) | E²=p²+m² numbers all verified | OK |
| 6 Turn up momentum | pr@1 pre-answer | ✓ | mom5 — slider→5.0, race bunches 33.37/33.52/33.94 ns, Cherenkov ON | 0.6 / 0.15 ns gaps verified; .inq-after appears (Cherenkov ~1.1 GeV verified = 1.070) | OK |
| guards | double-answer on card 2 ignored (state unchanged); pager 6→1→6 scenes deterministic per STEPS both passes; answers preserved; prev/next disabled at ends; Finish collapses + restore reopens card 1 with answers | | | | OK (revisit nuance → NP-P2-2) |

## Curriculum checklist
- Fire different particles through an ATLAS-style layered detector → **met** (8 species: e⁻ γ μ⁻ π⁺ K⁺ p n ν; Tracker → ECAL → HCAL → 3 muon stations, matching the referenced ATLAS figure's layer logic)
- See how each interacts with different sub-detectors → **met** (canonical signatures browser-verified for all 8: charged-only tracker hits, e/γ EM shower, hadron HCAL shower ± MIP dots, μ crosses all with chamber ✗ hits, n dashed + HCAL, ν nothing + missing-p arrow)
- How we measure momentum → **met qualitatively** (slider sets p; bend visibly loosens 1→5 GeV; p_T ≈ 0.3 B r in Formal; PHY-P2-1 limits the trend below ~1 GeV)
- How we measure energy → **met** (calorimeter deposit meters in GeV + live E readout; PHY-P2-2 nuance for mesons)
- How we identify species → **met** (Signature readout, TOF race with per-lane ns times, Cherenkov threshold, E at fixed p; card 6 shows TOF ID dying as β→1 — the "future colliders need other tricks" hook of Lecture 24)
- Guided inquiry present and answerable from the screen → **met** (6 cards, 5 gated, all reveals fire correctly; every quoted number reproduced on screen)

## To verify (human)
- PHY-P2-2 judgement call: whether KE-only hadronic deposits for mesons is an acceptable idealization for this course, or worth the E-for-mesons split (or just a caption).
- Speed selector at 0.25×/4× and light theme: asserted via state/readouts, not visually timed/re-inspected this run.
- Muon race lane at p=0.2 (β=0.884): muon still crosses all layers per the sim's idealization — Info modal discloses this ("Real muons below a few GeV can range out"); confirm the disclosure is deemed sufficient.
- Screenshots for every claim are in the review scratchpad (dhq-*.png) if needed before fixes.

## FIXES APPLIED (2026-08-26)

| ID | Verdict | Evidence / change |
|---|---|---|
| PHY-P2-1 | **CONFIRMED + FIXED** | Confirmed live (lineTo intercept, 1440×900): proton track at p 0.2 vs 1.0 GeV max pointwise deviation 1.8 px over 223 points (pixel-near-identical); node check: geo term atan(clear/dxRun)=0.323 rad at the live canvas beats 0.34/p for all p ≲ 1.06. The geo term is genuine containment (post-tracker straight run must not cross top/bottom before xEnd), so it was kept as the ceiling and the hard `min()` replaced with a soft clamp `mag = geo·(0.34/p)/(0.34/p + geo)` — strictly monotone over 0.2–5 (proton y@x=600: 203.4/230.9/247.4/275.8/291.6 px at p 0.2/0.6/1/2.5/5, yMid=314) and always < geo, so tracks stay inside. Containment re-verified at p=0.2 for μ⁻ (full traversal, maxY 583 < yBot−10=604), e⁻ and p. Anchor: `buildEvent` (~L876). |
| PHY-P2-2 | **ASSESSED-ONLY (no change)** | Confirmed on screen: hadron deposits sum to KE for all hadrons — π⁺@1 GeV ECAL 0.26 + HCAL 0.61 = 0.87 = KE (E=1.010), K⁺@1 sum 0.62 = KE, p@1 sum 0.43 = KE. Recommendation: keep KE for p/n; for mesons either deposit ≈E or (cheapest) add one caption word "kinetic energy deposited" to the meters — the E−KE gap (0.14 GeV for π@1) is otherwise unexplained to a student cross-checking the E readout. Left for the user's call. |

**PHY-P2-2 resolution (2026-08-26):** two caption wordings were shipped and then reverted at the user's request — "kinetic energy deposited" (implied the HCAL value alone equals KE) and "ECAL + HCAL = kinetic energy" (still judged misleading on screen). Decision: no caption; the KE-for-all-hadrons deposit stands as the documented idealization (deposit numbers were never changed at any point). Reopen only if the fuller fix (deposit ≈E for π/K, KE for p/n) is requested.
| PHY-P2-3 | **CONFIRMED + FIXED** | Confirmed live: e⁻ readout was "33.36 ns (+0.000)" at p=1 and p=5 (true delay 4.4e-6 / 1.7e-7 ns per node check). `fmtDelay` now floors at `'<0.001'`; the '+' moved inside fmtDelay so the readout renders "33.36 ns (<0.001)" rather than "(+<0.001)". All other species unchanged and re-verified string-exact: μ@5 "(+0.007)", μ@1 "(+0.19)", π@1 "(+0.32)", p@1 "45.74 ns (+12.4)", K@2.5 "(+0.64)", n@0.6 "(+28.6)", γ/ν "(light)". Anchor: `fmtDelay` (~L1205). |
| NP-P2-1 | **CONFIRMED + FIXED** | Confirmed live (fillText intercept): μ⁻ selected gave lanes light/μ/π/K — no proton (same for e⁻ and n). `laneKeys()` now always keeps all three reference racers (fill loop no longer breaks at 3), giving a 5th lane when e/μ/n is selected; lane height made dynamic (`(yB−yA)/(keys.length+1)`). Verified: μ → light/μ⁻/π⁺/K⁺/p with all five finish times rendered (33.36/33.54/33.68/37.20/45.74 ns @1 GeV, all match kinematics); π/p/γ selections unchanged at 4 lanes; strip renders without overlap (screenshot dhq-fixed-race-mu.png). Anchors: `laneKeys` (~L1132), `drawStrip` (~L1150). |
| NP-P1-1 | **ALREADY-RESOLVED** (systemic sweep SYS-1/SYS-2/SYS-5) | Not touched. |
| NP-P1-2 | **ALREADY-RESOLVED** (`window.Shell = Shell` present at L755) | Not touched. |
| NP-P2-2 | **ALREADY-RESOLVED** (systemic sweep) | Not touched. |

Post-fix regression: zero pageerrors; readout spot-checks (E, β/γ, TOF, Cherenkov) string-exact vs the review-verified values for π⁺@1, p@1, K⁺@2.5, n@0.6, μ⁻@1/5, e⁻@1/5, γ@1, ν@1.

## Second review scan (2026-08-26)

**Verdict:** Physics layer remains fully clean — full 40-cell species×momentum matrix re-verified string-exact vs `node -e` (E=√(p²+m²), β=p/E, γ=E/m, TOF=10 m/βc, Δt, Cherenkov β>1/n): 40/40 pass. All rev1 fixes intact — soft-clamp bend (L878 `mag = geo*(0.34/p)/(0.34/p+geo)`), TOF `<0.001` floor (L1206), race-lane always keeps π/K/p (L1132-1138), `window.Shell = Shell` (L755), `onReset` re-syncs via `onStep(Shell.step)` (L1314). Cherenkov threshold walk re-verified: K⁺ off@0.5 → ON@0.6 (p_thr = 0.5630 GeV); p off@1.0 → ON@1.1 (p_thr = 1.0700 GeV). Console clean; no NaN/undefined in any readout.

**Combos re-tested:** 40 exhaustive species×momentum + 4 Cherenkov-threshold boundary walks + boot/lecture/reset flow probes.

New findings all belong to one issue class — boot-state changes since rev1 introduced `setLectureMode(true)` at shell init (L734, "curriculum request"). No physics regressions.

### PHYSICS
#### P0 none  #### P1 none  #### P2 none new

### NON-PHYSICS

#### P0 none

#### P1 none

#### P2
- **[NP-P2-3] [ux] [med]** Fresh boot lands in **Lecture mode** with the STEPS[5] free-exploration scene (proton@1 GeV, roE 1.371 GeV, TOF 45.74 ns, Cherenkov off, Signature "track → HCAL shower") — this is by design (`setLectureMode(true)` at L734, comment "curriculum request"), but has two side-effects worth noting: (a) a first-time student sees the "answer key" for card 5 pre-populated (E = 1.371 GeV, TOF gap 12.4 ns are exactly card 5's quoted numbers), reducing the predict-then-reveal surprise if they later open Guided Inquiry via the ▶ chip; (b) after `finishInquiry` fast-forwards, `Shell.step` = 5 but `.inq-step.active` is left on card 1 (finishInquiry only updates `.inq-dot` classes, not `.inq-step.active`) — benign because the inquiry zone is hidden by `inquiry-collapsed`, but a DOM/state inconsistency. Repro: fresh load `?v=fresh1` → `Shell.step === 5`, `sel === "proton · m = 0.9383 GeV"`, `htmlClasses` contains `lecture-mode inquiry-collapsed`, but `[...cards].findIndex(c=>c.classList.contains('active')) === 0`. Restore chip / 🎓 click correctly reopens at card 1 with e⁻@1 GeV (`Shell.step=0`, roE 1.000 GeV, roSig "curved track → EM shower") — that path is fine. Evidence: dhq-rev2-boot-lecture.png. → **Fix (optional):** in `finishInquiry` add `inqCards().forEach((c,i)=>c.classList.toggle('active',i===inqStep));` after the dot update loop, to keep the DOM `.active` class in sync with `inqStep`.
- **[NP-P2-4] [flow] [low]** Hide-Text boot state is a race between the Lecture-mode-follower onload handler (L415-419: `window.load` → `rAF(rAF(...box.checked = shell.classList.contains('lecture-mode'); apply()))`) and Shell's synchronous `setLectureMode(true)`. In a backgrounded tab (`document.hidden === true`), rAF is throttled/frozen, so the double-rAF callback never fires until the tab is focused — box.checked stays `false` and shell has NO `hide-text` class. In a foreground tab the rAF fires and shell picks up `hide-text`. Registry is empty so no visible effect either way, but this makes the boot state non-deterministic w.r.t. tab focus. Additionally, the pre-existing comment at L413-414 ("Default: follow lecture mode at boot. Inert in the PP sims (they boot into the guided inquiry, so the class is absent and the box starts unchecked — correct)") is now inaccurate for THIS sim — the sim boots into Lecture mode, so the class IS present and the box does become checked in the foreground path. Repro: `document.hidden=true` fresh loads at `?v=fresh1&t=1`, `?v=fresh2&t=2` → both `{htToggleChecked:false, shellHasHideText:false, htmlClasses:"...lecture-mode inquiry-collapsed"}` (no `hide-text`); manually running `box.checked = shell.classList.contains('lecture-mode'); apply();` flips to `{checked:true, hasHideText:true}`. Anchor: L415-419. → **Fix (optional):** run the sync eagerly rather than on `load`+2rAF — e.g., invoke apply after `DOMContentLoaded` or fold the Lecture-follow default into `setLectureMode` itself (`box.checked=on; shell.classList.toggle('hide-text',on)` inside setLectureMode) so the checkbox state deterministically tracks Lecture regardless of tab focus. Then update the L413-414 comment to match.

### Notes on things checked and re-confirmed clean
- Toggle Lecture OFF (or restore chip) → `Shell.step=0`, e⁻@1 GeV scene, `htmlClasses="hide-formal"` (both lecture-mode and inquiry-collapsed cleared). Toggle Lecture ON → returns to pr@1 GeV/step=5. All matches the "post-completion free exploration" contract.
- Reset in Lecture mode → stays in Lecture mode, scene resyncs to STEPS[5] = pr@1 GeV (via the L1314 `onStep(Shell.step)`). Reset outside Lecture with an answered card → SYS-5 branch restores the answered card's revealed particle (verified card 2 answered → after Reset: photon@1 GeV, roSig "no track → EM shower"). Both correct.
- μ⁻@1 GeV race strip shows all 5 lanes correctly (light 33.36 / μ⁻ 33.54 / π⁺ 33.68 / K⁺ 37.20 / p 45.74 ns — every finish time matches kinematics to the last digit) and the μ⁻ track crosses all layers with the three chamber ✗ hits. dhq-rev2-mu-race.png.
- Muon MIP-like deposits (ECAL 0.10 GeV + HCAL 0.20 GeV at μ⁻@1 GeV) are the documented idealization (L934: `dep.ecal = Math.min(0.10, 0.3*KE); dep.hcal = Math.min(0.20, 0.3*KE)`), physically correct sign/scale for a minimum-ionizing particle. Not re-flagged.

### Combination coverage manifest (second scan)
| combo set | strategy | count | invariants | result |
|---|---|---|---|---|
| species × momentum {0.2, 0.6, 1, 2.5, 5} | exhaustive | 40 | E=√(p²+m²), β=p/E, γ=E/m, TOF=10 m/βc, Δt, Cherenkov β≷1/n, signature, sel-name mass = PDG | 40/40 pass (string-exact vs node -e) |
| Cherenkov threshold walk | boundary | 4 (K⁺ 0.5/0.6, p 1.0/1.1) | flips off↔ON across p_thr = m/√(n²−1) | 4/4 pass |
| boot / Lecture-toggle / restore | flow | 6 | Shell.step, sel, roE, htmlClasses cycle correctly across boot → 🎓 off → 🎓 on → restore | pass — see NP-P2-3/NP-P2-4 for observations |
| Reset in Lecture mode + Reset with answered card | flow | 2 | scene re-syncs to `onStep(Shell.step)`, SYS-5 revisit re-applies answered card's reveal | pass |
| Cherenkov threshold + race lane μ⁻@1 | animation | 1 | all 5 finish times match kinematics; μ track crosses all layers | pass |

### Curriculum re-check
- All curriculum requirements from rev1 remain met (species set, layer interactions, momentum/energy/species-ID visualisations, guided inquiry). No regression. Lecture-mode-on-boot is a curriculum-owner-requested behaviour (L734 comment) and is respected.

### To verify (human)
- **NP-P2-3 vs NP-P2-4** are stylistic/latent — no student-visible physics or flow bug, but both would matter if the Hide Text registry is later populated or if a lecturer expects "fresh load = card 1". Confirm whether the boot-into-Lecture behaviour is the desired student-facing default (screenshot dhq-rev2-boot-lecture.png shows what they see) or only the lecturer-facing default (in which case the boot behaviour might warrant a query parameter e.g. `?mode=inquiry`).
