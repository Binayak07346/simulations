# Review — scale-of-the-universe.html ("Smaller Things Need Higher-Energy Probes", curriculum: Simulation Descriptions row "Scale of the Universe" · Syllabus V2 Lecture 2 "Scales")
**Verdict:** Core physics is exact — d × E_min = ħc holds at every sampled position of both sliders (31 log-spaced points, both drive directions) and both animated reveals land on the stated values (1.70 mm/116 µeV; 1.70 fm/116 MeV) — but three P1 non-physics bugs need fixing: the paused-state transport is dead (`window.Shell` is undefined so `play()` is a no-op — buttons and card reveals silently do nothing while paused), Reset desyncs the scene from the active inquiry card, and the Formal layer renders a red literal `\cdotp` inside ħc ≈ 0.1973 GeV·fm; plus the curriculum's fundamental-forces panel is absent (deliberate, per in-file POLISH note).
**Console:** clean (only `GET /favicon.ico` 404 from the python dev server — not a sim asset; zero pageerrors, zero sim console errors across all five sessions).  **Combos tested:** 58 exhaustive (pin-step cycles both directions incl. 4 extreme no-ops, 5-card walk correct+wrong paths, all header toggles both states) + ~150 sampled (31 slider points, 8 band boundaries, flow-mutation grid, 80-event scrub stress).
**Method note:** headless Chrome (puppeteer, 1440×900, `document.hidden = false` — rAF live, animations real); driven via DOM events + `window.__audit`; screenshots in scratchpad (`sotu-*.png`).

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** Card 4 states "The proton is 100,000× smaller still (1.7 fm)" — actual 10⁻¹⁰ m / 1.7 fm = 58,824× (4.77 decades). The correct-choice label "About 100,000× more" and fb "five decades" carry the same rounding; stated as plain fact in the card prose. Repro: open card 4. Evidence: explicit calc in transcript. Anchor: card 4 `<p>`, L460. → **Fix:** "~60,000× (nearly five decades) smaller still" or "about 10⁵× smaller"; keep the choice labels' "About".

## NON-PHYSICS
### P0
none
### P1
- **[NP-P1-1] [flow] [high]** Paused-state transport is dead: `play()` guards on `window.Shell`, but `const Shell` is a top-level lexical binding, so `typeof window.Shell === 'undefined'` (verified) and `play()` never resumes. While paused: ◀ bigger/smaller ▶ clicks show nothing (d frozen at "1.70 m" for 3 s; state DID move — resuming manually then eased to 80.8 µm), and answering card 2 leaves the promised zoom frozen ("the zoom runs and tests it" / "watch E_min climb" — nothing moves, still "▶ Play"; card 4's proton reveal same path). Evidence: sotu-E run + sotu-paused-reveal.png. Anchor: `function play(){ ... if (window.Shell && Shell.setPlaying) ... }` L1555. → **Fix:** drop the `window.` qualifier — `if (typeof Shell!=='undefined' && Shell.setPlaying) Shell.setPlaying(true);` (Shell is defined before the sim IIFE runs).
- **[NP-P1-2] [flow] [high]** Reset desyncs the scene from the active inquiry card: `onReset` always returns to HOME. Repro: pager to card 3 ("d = 100 nm — a virus, E_min reads 1.97 eV") → ↻ Reset → readouts 1.70 m / 116 neV, card 3 still active and now contradicted. Evidence: sotu-reset-desync.png; card3before/afterReset in transcript. Anchor: `onReset()` L1654. → **Fix:** after zeroing, re-apply the active card's spec — `onStep(Shell.step)` — the pattern used in build-a-baryon's fix (guard for the collapsed/completed state, where HOME is correct).
- **[NP-P1-3] [functional] [high]** ∑ Formal eq2 renders "ℏc ≈ 0.1973 GeV**\cdotp**fm" with the literal macro name in red — KaTeX cannot take "·" inside `\text{}`. The sim's headline constant is the one garbled. Repro: toggle ∑ Formal. Evidence: sotu-formal.png. Anchor: `katex.render('E_{\\min}=pc=...\\text{GeV·fm}', b, ...)` L1626. → **Fix:** `\\text{GeV}\\cdot\\text{fm}` (also keeps the plain-text fallback unchanged).
- **[NP-P1-4] [pedagogy] [high]** Curriculum affordance absent: Simulation Descriptions requires "Info panel also notes the strength of fundamental forces at this scale", and the Lecture-2 inquiry "What scales do each of the forces matter at?" is not answerable from the screen. The in-file POLISH note documents this as a deliberate cut ("one concept only — force bars … are gone"). Anchor: POLISH comment L338; no force UI anywhere. → **Fix:** product decision — either restore a minimal per-scale force note in the "At this scale" panel, or amend the curriculum row; report both sources per skill conflict rule.
### P2
- **[NP-P2-1] [flow] [high]** The first slider input after load is swallowed once per session: the input handler calls `userMove()` → `revealScale()` → `Shell.refit()` → `onResize` → `updateUI`, which rewrites the slider from `S.view` *before* the handler reads its value. Repro: fresh load → set size slider to −8 → value snaps back to −0.22, d stays ~1.7 m; second identical input works. A single click-on-track or first keyboard arrow is visibly ignored; drags lose only the first event. Anchor: `eScale`/`eEnergy` input handlers L1562–1571 (`userMove()` before the read). → **Fix:** read `parseFloat(e.target.value)` into a local *before* calling `userMove()`, or set `S.logd/S.view` first and call `userMove()` after.
- **[NP-P2-2] [cosmetic] [med]** Endpoint precision: energy-slider min corner displays d = "99,997 km" (not 100,000 km) because the hard-coded slider bounds use LOGC to 4 decimals (−23.7048) vs log10(ħc) = −15.704806…; boot slider position also snaps −0.23 → −0.22 (step 0.02 grid from min −8), so the first touch lands at 1.66 m rather than 1.70 m. Anchor: `#sim-energy` min/max L494, `HOME=0.23` vs step grid L489. → **Fix:** derive slider bounds from LOGC at full precision in JS (or accept; display-only).

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| Size slider `#sim-scale` | 17 log-spaced points, −8 → 19 (full range + endpoints) | d readout, E readout, energy-slider value (link error = 0.00000 at all points), tech chip, d×E product | OK (first-touch swallow → NP-P2-1) |
| Energy slider `#sim-energy` | 14 points, −23.7048 → 3.2952 (full range + endpoints) | size-slider follows exactly (ev − sv ≡ LOGC), d/E readouts, product | OK (corner display → NP-P2-2) |
| ◀ bigger | 10 clicks from quark → Earth + no-op at Earth + no-op at hard min (10⁸ m) | pin sequence proton→nucleus→atom→molecule→virus→cell→hair→human→Earth; readouts settle on pin values; no overshoot | OK |
| smaller ▶ | 10 clicks from HOME → quark + no-op at quark + no-op at hard max (10⁻¹⁹ m) | hair→cell→virus→molecule→atom→nucleus→proton→quark(197 GeV); no overshoot past clamps | OK |
| Canvas ruler drag | drag 0.8W→0.6W on bottom strip | scrubs 12,765 km → 5.23 nm; cursor `ew-resize` on strip | OK |
| Canvas scene drag | drag in scene area | no scrub (sv unchanged) — correct reject | OK |
| Play/Pause | toggled, + 20-click stress | text/state flips; single-action after stress (no listener duplication) | OK (paused transport → NP-P1-1) |
| Speed select | 0.5× vs 4× timed on identical ease | 6.04 s vs 1.76 s settle — speed drives animation | OK |
| ↻ Reset | from card 3, from free exploration | returns to HOME, ghost cleared, resumes play, answers preserved | NP-P1-2 (card desync) |
| Theme ☾/☀ | both ways + 10-click stress | body class, icon swap, canvas redraw, config preserved | OK |
| ⛶ Maximize | on/off | shell-max class, refit, config preserved | OK |
| ∑ Formal | on/off | formal section + p-row + canvas eq captions (ƛ ≈ d chip, E = ħc/d axis caption) gated | OK (eq2 render → NP-P1-3) |
| ⓘ Info | open, Esc close | modal open class; Esc closes | OK |
| Hide Text | boot CHECKED (registry-documented), uncheck, recheck | exactly the ONE registered item (E_min explainer `p.sim-note.ht-hide`, 246 chars) hides/restores; nothing unregistered disappears | OK |
| 🎓 Lecture / restore chip | on from fresh, off | fast-forward + collapse + panel staged + HOME; off/restore → card 1 expanded, answers kept | OK |
| ‹ › pager, Next → | full round trips, gates | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| Slider sweep (size-driven) | sampled, 17 log-spaced incl. both endpoints | 17 | ev − sv = LOGC exact; d×E ∈ [197.0, 197.8] MeV·fm (= ħc within 3-sig-fig readout rounding); readouts finite; tech band per code map | pass |
| Slider sweep (energy-driven) | sampled, 14 points incl. both endpoints | 14 | same invariants, link verified in reverse direction | pass |
| Pin-step cycles | exhaustive (both directions + 4 extreme no-ops) | 24 clicks | monotone pin sequence, exact pin landings, hard-clamp no-overshoot | pass |
| Tech-band boundaries | sampled ±ε around all 4 hand-offs | 8 | naked-eye/light at 70 µm; light/electron at 105 nm (1.88 eV); electron/collider at 40 pm (4.9 keV); collider/beyond at 2×10⁻¹⁹ m (~1 TeV) — all consistent with the sim's ƛ ≈ d convention | pass |
| Inquiry walk | exhaustive (5 cards; correct path all; wrong path card 2) | 6 answers | gates, reveals, fb text vs on-screen values, ghost labelling, double-answer guard | pass |
| Reveal convergence | exhaustive (both animated reveals, 1× speed, full settle) | 2 | card-2 zoom: 1.70 m → 1.70 mm, 116 neV → 116 µeV (exactly 1000×); card-4: 100 pm → 1.70 fm, 1.97 keV → 116 MeV | pass |
| Flow mutations | sampled grid: non-default d × {theme, maximize, formal, HT}; pause × slider; pause × button; pause × card-reveal | 8 | config (d, E, HT, formal) never silently reset; slider works while paused | pass except NP-P1-1 (paused transport) |
| Stress | sampled: 40+40 slider input events, 20 play toggles, 10 theme toggles | 90 events | zero errors, final state = last input, single-action buttons after stress | pass |
| Skipped | real keyboard-arrow slider input and touch gestures (synthetic input events only); viewports other than 1440×900/maximize; `prefers-reduced-motion` | — | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 resolution ladder | human 1.7 m, E_min 116 neV (= ħc/1.7 m ✓), probe wave, ruler bands | ungated | — | — | OK |
| 2 price of 1000× | starts at human; zoom drops exactly 3 decades → 1.70 mm/116 µeV | ✓ disabled pre-answer, any choice unlocks | zoom + ghost wave ('before' on choices 1–2; labelled 'stale' "better lens" ghost on choice 3 — counterfactual clearly captioned, never enters readouts) | "locked together" verified: both readouts moved 1000× | OK (breaks only if paused → NP-P1-1) |
| 3 where light gives up | 100 nm / 1.97 eV / band = electron side of the hand-off | ✓ | — | 2 eV photon ƛ ~100 nm ✓ (ħc/1.97 eV = 100 nm) | OK |
| 4 decades for decades | 100 pm / 1.97 keV shown; descent lands 1.70 fm / 116 MeV (= ħc/1.7 fm ✓) | ✓ | proton zoom on any choice | "116 MeV" claims verified on screen | OK ("100,000×" → PHY-P2-1) |
| 5 why no one has seen a quark | 1.00 am / 197 GeV / collider band, "collision debris only" note | ✓ (Next → Finish) | .inq-after hidden pre-answer, shown post | 197 GeV = ħc/10⁻¹⁸ m ✓; 2×10⁻¹⁹ m cutoff matches band code | OK |
| pager | 5→1→5: state fingerprints (card, d, E, tech) identical both passes; prev disabled at 1, pager-next at 5; answers "01111" preserved; double-answer guard holds (2nd click ignored, fb unchanged) | | | | OK |
| lecture/finish | Finish and 🎓 both → collapsed + "At this scale" staged + playing + HOME; restore/off → card 1, answers kept | | | | OK |
| Hide Text | registry = 1 DOM item, boots CHECKED per registry note ("curriculum request") — verified hidden at boot, restored on uncheck, re-hidden on recheck; text delta 246 chars = exactly the registered note | | | | OK |

## Curriculum checklist
- Zoom Earth → quark scale with pinned landmarks (Earth, human, hair, cell, virus, molecule, atom, nucleus, proton, quark) → **met** (all 10 pins at canonical sizes: 1.27×10⁷ m, 1.7 m, 80 µm, 12 µm, 100 nm, 1 nm, 10⁻¹⁰ m, 10 fm, 1.7 fm, <10⁻¹⁸ m — checked vs canon/PDG-scale values)
- Scale OR energy of probe as control, emphasizing the inverse relationship → **met** (two locked log sliders; link exact both directions — the sim's headline invariant)
- Log ruler at bottom with slider/cursor + log energy bar → **met** (drag-scrubbing cursor, dual axes, decade ticks)
- Info panel: length scale, energy to probe it, imaging tech (visible light / x-ray / electron microscope / collider) → **met** ("At this scale" panel + min-probe chip: radio/IR/visible/UV/X-ray/γ/collider + 4-band tech strip)
- Info panel notes strength of fundamental forces at this scale → **NOT met → NP-P1-4** (deliberately removed per POLISH note)
- LO "Explain how higher momenta can probe shorter distances" → **met** (answerable: E = ħc/d on every readout, card spine is exactly this claim)
- Inquiry "order-of-magnitude comparison quark vs molecule" → **answerable** (ruler: 1 nm vs 10⁻¹⁸ m = 9 decades; card 5 after-text says it explicitly)
- Inquiry "Why have we still not been able to get a clear look at quarks?" → **answerable** (card 5 + "collision debris only — never a photograph" band note)
- "Lecture Display" learning mode → **met** (🎓 Lecture verified)
- Optional "extension could go big to galaxy clusters" → not implemented (ruler tops at 10⁸ m); optional wording, no finding

## To verify (human)
- The "beyond any machine" cutoff at d < 2×10⁻¹⁹ m (≈ 1 TeV momentum transfer) is a defensible round number for the LHC's direct spatial resolution, but contact-interaction limits are often quoted as probing ~10⁻¹⁹–10⁻²⁰ m; confirm the course wants the conservative teaching value.
- Whether Hide-Text booting CHECKED (hiding the E_min massless-probe caveat by default) is still the curriculum team's intent — the registry note says so, and behaviour matches, but it hides the sim's one model-honesty caveat from first-time viewers.
- NP-P1-2's fix should keep HOME on Reset when the inquiry is collapsed/completed (free-exploration mode) and only re-apply the card spec while a card is open.
