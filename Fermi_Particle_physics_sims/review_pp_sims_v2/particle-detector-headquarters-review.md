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
