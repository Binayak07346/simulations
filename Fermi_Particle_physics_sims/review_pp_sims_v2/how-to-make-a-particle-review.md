# Review — how-to-make-a-particle.html ("How To Make a Particle", curriculum: Simulation Descriptions row "How To Make a Particle" · Syllabus V2 Lecture 11 Pair Production; row is sparse — "Pair production events: change energy to see what kind of pair production is possible")

**Verdict:** Threshold physics is exact — all 8 rungs verified at 2mc² against PDG with born-at-rest events, correct T = Eγ − 2mc², and a quantitatively correct r = p/qB — but the one physics defect is a real one: **track curvature sense is inverted relative to the declared B ⊗ into page** (the track labelled e⁻ bends the way a positron should). One P1 (light-theme canvas keeps dark-theme colours; ladder text nearly invisible), rest is polish.
**Console:** clean — zero pageerrors across all runs (incl. 40-event slider scrub); the only console entry is a benign `favicon.ico` 404 from the static server (not a sim resource).
**Combos tested:** 24 exhaustive threshold combos (8 rungs × below/at/above, event captured at each "at" and "above") + full snap-up (9) and snap-down (10) cycles + ~45 sampled (inquiry walkthrough, pager round-trip, flow mutations, stress).
**Method note:** headless Chrome (puppeteer) at 1440×900; frames driven deterministically via `window.__inq.frame` (deliberate debug handle); screenshots in scratchpad `hmp-*.png`.

## PHYSICS

### P0
- **[PHY-P0-1] [high]** Track curvature sense is inverted for BOTH pair members relative to the declared field ("B = 1 T ⊗ into page" is drawn in the chamber). A negative particle moving +x in B-into-page must bend DOWN (screen) / clockwise; the sim's track k=0 — labelled `lab[0]` = e⁻/μ⁻/… — gets `sg=-1` and curls UP/counterclockwise (and the positive twin the mirror). Repro: Lecture mode → set Eγ = 10 MeV → Fire γ → watch the two e spirals. Observed: e⁻ track points go (341.2,404) → (365.7,388.9) → (341.9,344.4) — canvas-y decreasing = upward = positron sense; screenshot `hmp-G-curvature-10MeV.png` (e⁻ is the upper circle). Expected: F = qv×B (canon: curvature sense from qv×B; Anderson signature) → e⁻ lower/clockwise. A student applying the right-hand rule to the on-screen ⊗ label reads every particle/antiparticle assignment backwards — this is the same sign convention the Lecture-10 cloud-chamber sim teaches. Anchor: `buildTracks`, L911 `var sg=k?1:-1;`. → **Fix:** flip the sign–track binding: `var sg=k?-1:1;` (labels `lab[k]` and everything else already follow `tracks[k]`, so this one line corrects both twins).

### P1
none

### P2
- **[PHY-P2-1] [high]** "√s for γ + Pb is ≈ 195 GeV" (Info modal Caveats, ~L354; formal-layer note, L520). Explicit calc: M(Pb-208) = 207.9767 u × 0.9314941 = 193.73 GeV → √s = √(193.73² + 2·0.001·193.73) = 193.73 GeV at Eγ = 1 MeV. The 195 figure is 208·m_p (ignores neutron/binding), ~0.7 % high. → **Fix:** say "≈ 194 GeV" in both places.
- **[PHY-P2-2] [high]** At an exact rung the sidebar shows "Kinetic energy T (heaviest pair): 0" with no unit — the only unitless value in the readout table (`fmtE`, L829, returns `'0'` for E ≤ 0). Repro: ↑ Rung above to any rung. Chamber pill correctly says "born at rest, T = 0". → **Fix:** return `'0 MeV'` (or `'0 GeV'`) from `fmtE` for the zero case.

## NON-PHYSICS

### P0
none

### P1
- **[NP-P1-1] [ux] [high]** Light theme leaves the whole canvas on dark-theme colours: `tokens()` reads `getComputedStyle(document.documentElement)` (L792) but the theme toggle sets `body.light-theme`, and the light CSS variables are defined on `body` — so the canvas never sees them. Effect: chamber stays dark (tolerable), but the ladder sits on the now-light plot-box and its heading "Thresholds 2mc²", the "log scale · thin tick = mc²" caption, decade labels (1 MeV…10 GeV) and muted/unknown rung labels are pale-grey-on-white, near-invisible; the Eγ marker pill is dark-styled on the light page. Repro: ☾ toggle → light; evidence `hmp-F-light-12GeV-formal.png`, `hmp-D-max-light.png`. → **Fix:** in `tokens()` read `getComputedStyle(document.body)` instead of `document.documentElement`.

### P2
- **[NP-P2-1] [flow] [high]** Reset on card 1 breaks the sim's own "boots PAUSED" prediction-first staging: `onReset` re-applies STEPS[0] (`pause:true` → `setPlaying(false)`), but the shell reset handler (L656) then forces `setPlaying(true)`. Verified live: boot playing=false; ↻ Reset on card 1 → playing=true. Only cosmetic (chamber is empty either way; Play button state is the visible difference). → **Fix:** in `onReset`, after `applyStep`, defer the pause: `if(STEPS[Shell.step] && STEPS[Shell.step].pause) requestAnimationFrame(()=>Shell.setPlaying(false));`.
- **[NP-P2-2] [overlap] [med]** Track endpoint labels pile up at the interaction vertex in the tight-spiral / full-circle regime: at 10 MeV both e spirals close on the nucleus, so the tiny e⁻/e⁺ endpoint labels land on the nucleus sprite and on each other (`hmp-G-curvature-10MeV.png`; also visible on `hmp-B-c3-bornAtRest.png` where the e⁺ dot label grazes the nucleus). Readable but scruffy. Anchor: `drawEvents` label clamp (~L1059). → **Fix:** offset each label radially away from the vertex by ≥ 14 px when the endpoint is within ~20 px of (nx, ny).
- **[NP-P2-3] [ux] [low]** Repeated ⚡ Fire γ clicks build an unbounded photon train (15 clicks → 16 photons in flight; each does convert/expire correctly, one labelled event at a time, no listener duplication — rate exactly 1 per click). Purely visual noise. → **Fix (optional):** ignore Fire while ≥ 3 photons are in flight, or cap the train.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| eSlider (0–1000, log 0.5 MeV–12 GeV) | 9 stops min→max while running + 40-event random scrub | state.E = vToE(v) at every stop; eReadout text; events cleared + photon respawn on change; readouts re-derive | OK |
| ⚡ Fire γ | single, ×15 stress | beamOn set, photon per click (16/16), auto-respawn every 3.8 s, resumes play | OK (NP-P2-3 cosmetic) |
| ↑ Rung above | 9 presses from EMIN + 1 at 12 GeV | parks EXACTLY on 0.001022 / 0.21132 / 0.27914 / 0.98736 / 1.87654 / 3.55372 / 3.73932 / 10.55868 → 12 (EMAX, stays) | OK |
| ↓ Rung below | 10 presses from 12 GeV + at e-rung | exact reverse rung sequence → 0.0005 (EMIN, stays) | OK |
| Inquiry choices (12) | card 2 wrong-path + correct-path; cards 3–5 correct; double-click guard | disabled+styled (wrong/correct/dim), feedback shows, gate unlocks on ANY choice, second answer ignored | OK |
| Next / Finish | full walkthrough | gated until choice/stepReady; Finish collapses + onComplete state | OK |
| ‹ › pager | 5→1→5 round trip | per-card scene fingerprints identical both passes (E/beam/revealed/rows/playing) | OK |
| Play/Pause | toggled; pause→slide→play | paused change honoured (E kept), resume clean | OK |
| Speed | 1×→2×→4× | sim-time advance ratio 4.08 at 4× vs 1×; persists across changes | OK |
| ↻ Reset | on card 4 (unanswered), on card 1 | re-applies ACTIVE card's STEPS spec (card-4 scene byte-identical) | OK (card 1: NP-P2-1) |
| 🎓 Lecture / restore chip | on from card 1, off; restore after Finish | ON state ≡ manual-Finish state (fingerprint match); OFF/restore → card 1, answers preserved [–,✓,✓,✓,✓] | OK |
| Hide Text | check→uncheck | `hide-text` class toggles; innerText length unchanged (registry empty — correct per manifest) | OK |
| ∑ Formal | open/close | 5 KaTeX equations rendered; content verified (see Inquiry check) | OK |
| ⓘ Info / Esc | open, Esc close | modal opens, content matches curriculum framing | OK (PHY-P2-1 text) |
| ☾ Theme | dark↔light | DOM re-themes; canvas does NOT (NP-P1-1) | FINDING |
| ⛶ Maximize | on/off | aside+formal collapse, canvas refits, state preserved | OK |
| Panel collapse heads | click ×2 on both panels | `.collapsed` toggles and restores | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| Threshold rungs × {below −1e-6, exact, ×1.6 above} | exhaustive | 24 | channel absent below / present at rung; roThr = 2m (PDG cross-check ≤0.03 % all 8: e 1.0220 MeV, μ 211.32, π 279.14, K 987.35, p 1876.54, τ 3553.72, D 3739.32, B 10558.68 MeV); at-rung event atRest with β=0, p=0, "born at rest, T = 0"; above-rung T = Eγ−2mc² exact and ev.p = √((Eγ/2)²−m²) exact per spawned species | 24/24 pass |
| Snap cycles (↑ from EMIN, ↓ from 12 GeV, ends) | exhaustive | 21 presses | exact rung parking both directions; open-count monotone 1..8; roNext names next rung then "all rungs open"; roKE = 0 at every rung | pass |
| Slider sweep + scrub stress | sampled | 9 stops + 40 events | E=vToE, readout consistent, stale events cleared, zero errors | pass |
| r = p/qB quantitative | spot | 10 MeV e-pair | p = 4.974 MeV → r = 16.6 mm → 29.9 px at 720 px/0.40 m; on-screen circle diameter ≈ 60 px | pass |
| Inquiry walkthrough + reveals | exhaustive (5 cards) | — | see Inquiry check | pass (curvature P0 visible here too) |
| Flow mutations | sampled | E×{theme, maximize, speed, pause-edit-play}; reset-on-card; lecture from mid-inquiry; fire-while-running | non-default E and beamOn persist through every unrelated control; Reset scope = active card's spec | pass |
| Stress | sampled | 15× Fire, 40-event scrub, double-answer, ×2 panel toggles | 1 photon per click (no listener duplication), answer idempotent, zero console errors | pass |
| Skipped | — | wrong-path choices on cards 3–5 (same handler as card 2's verified wrong path — code-identical; correct paths verified live); species-sampling frequency statistics (70 % lightest + β/thr² weighting read from code, spot-seen as "rare channel" tags — labelled schematic per Info caveat) | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 Can light become matter? | boots PAUSED, Eγ=0.8 MeV, empty chamber, unlabeled rungs + "?" at e; "press Fire γ" pill | ✓ (Shell.stepReady via inqSaw on photon pass — Next stays disabled until fired) | — | photon sails through below every rung ✓ | OK |
| 2 Predict: protons from light? | E 0.8 MeV, beam on, panel hidden — nothing pre-answers the prediction | ✓ (wrong path unlocks too) | goal-p: E→1.000 GeV, panel reveals "e μ π K (4)", p-rung "?" pulses | "ONE proton — charge and baryon number demand a p̄" ✓; K-pair event T = 12.64 MeV = 1 − 0.98736 GeV ✓ | OK |
| 3 Born at rest — then what? | E exactly 1.022 MeV; e⁺e⁻ event atRest, two dots, "born at rest, T = 0"; T row hidden pre-answer (deliberate staging) | ✓ | show-T: row appears, roKE = 0 | T = Eγ−2mc², r = p/qB grows ✓ (p trend verified: 0.549→2.447→4.974 MeV at 1.5/5/10 MeV) | OK |
| 4 Price a τ⁺τ⁻ pair | E 3.400 GeV; roKE 1.523 GeV = 3.4−1.87654 ✓; τ rung is the unlabeled "?"; Next-threshold row hidden pre-answer | ✓ | show-next: row appears "tau at 3.554 GeV" | 2×1.777 = 3.554 ✓; ↑ Rung above parks 3.55372 exactly, τ born at rest, roNext → "D meson at 3.739 GeV" ✓ | OK |
| 5 PET rung | E 1.022 MeV, both rows shown, roNext "muon at 0.2113 GeV" ✓ | ✓ | .inq-after none→block on answer | 2×511 keV annihilation photons ✓; Blackett & Occhialini 1933 ✓ | OK |
| pager | 5→1→5 fingerprints identical per card; Finish state ≡ Lecture-ON state; restore reopens card 1 with answers kept | | | | OK |
| ∑ Formal | Eγ ≥ 2mc²(1+m/M_N) ✓; √s = √((M_Nc²)²+2EγM_Nc²) ✓; pc = √((Eγ/2)²−(mc²)²) (M_N→∞, stated) ✓; T = Eγ−2mc² ✓; r = p/qB ✓; single-photon-in-vacuum prohibition note ✓ | | | "≈195 GeV" → PHY-P2-1 | OK |

## Curriculum checklist
- "Pair production events: change energy to see what kind of pair production is possible" → **met** (log slider 0.5 MeV–12 GeV, threshold ladder, Open-pair-channels panel, per-event labels)
- L11 LO: pair production shows matter can be created/destroyed → **met** (cards 1–2, chamber events)
- L11 LO: invariant-mass quantity via four-momentum → **met at display level** (∑ Formal √s row + note explaining why √s is not the knob for a fixed-target photon; the sim deliberately teaches the lab-frame threshold — Info modal states this)
- L11 LO: e⁺e⁻ cannot annihilate to a single photon in vacuum → **met** (formal note + Info Misconception + card 5 runs the rung in reverse to two 511 keV photons)
- Inquiry question "Why is there a minimum energy to produce an e⁺e⁻ pair?" → **answerable from the screen** (card 2 commit → ladder climb → rung lights at exactly 2mc²; mc² half-ticks show the single-particle intuition failing)
- Learning mode: Guided Inquiry → **met** (5 cards, all gated; Lecture mode + pager + Hide Text all present and working)

## To verify (human)
- Favicon 404 is the static server lacking `favicon.ico` — harmless here; check whether the production host ships one.
- KaTeX comes from the jsdelivr CDN; offline the formal layer silently shows empty equation slots (guarded, no error). Confirm the deployment target is always online or inline KaTeX.
- After fixing PHY-P0-1, re-check card 3's screenshots — the spiral figure-of-eight around the nucleus will mirror vertically (labels swap sides).
- Rare-channel tag appears on every rung-parked demo event (e.g. card 4's τ) because the freshly opened species is by definition not the lightest; physically correct (rate → 0 at threshold) and labelled, but confirm the wording reads well in class.
- Reviewed headless at 1440×900 (dark + light, normal + maximized); a quick human pass at a projector aspect (1280×720) is still worthwhile.
