# Review — Gold_foil_exp_v3.html ("Geiger-Marsden Gold Foil Experiment", Lectures 3–4) — re-review

> **UPDATE (fix pass, same session):** both findings fixed and re-verified
> (`_review/gf-verify.mjs`, screenshots `09-fixed-readouts.png`, `10-fixed-narrow.png`).
> - NP-P1-1 ✅ `.stat-value` is now `white-space:nowrap` (no mid-number fracture) and
>   `.stat-label` wraps instead (dropped `flex-shrink:0`/`display:flex`, added
>   `overflow-wrap:break-word`). Verified single-line values at 1440 and 1100 px:
>   "29.55 fm", "2.95e-4 rad", "2.18e+2 fm²/sr".
> - NP-P2-1 ✅ the redundant "Total α fired" row removed; a single honest
>   "Scintillations recorded" counter remains (with a code comment recording why), and
>   `updateCounters()` no longer references `n-fired` (zero dangling refs). Counts
>   accumulate normally; 0 console errors.
>
> **UPDATE 2 (user-reported layout defect, fixed):** at wide/short windows the detector
> ring's lower arc ran off the canvas bottom, the 0° label sat on the right edge, and the
> 5° histogram bar rendered off-screen (user screenshot, 2440×1426). Cause:
> `computeLayout()` budgeted only for labels — not the bars (which extend 0.28·R beyond
> the ring) — and deliberately reserved space for just the foil half-height below centre,
> letting the ring's lower half clip. Rewrote the solver: four binding constraints
> (width/height × labels/bars bind), full-ring vertical budget, and outer clearance
> ext(R) = max(labelMargin, 0.28R + 18) used in the centring. Verified by edge-scanning
> the canvas at 1440×900, 2440×1426, 1600×760, and 1100×800: **zero drawn pixels within
> 3 px of any edge** in all four (`11-layout-*.png`). Histogram re-measured post-change —
> distribution still matches the bin-integrated Rutherford expectation.
>
> **UPDATE 3 (user-reported, fixed):** in single-shot mode the θ angle-arc floated with a
> visible gap below the trajectory. Cause: the arc was centred on the NUCLEUS, but the
> outgoing asymptote does not pass through the nucleus. The arc is now anchored at the
> asymptote crossing point — which for a Rutherford hyperbola is exactly (−d/2, b) in
> world coords, since tan(θ/2) = d/2b — with a short dashed "undeflected path" guide as
> the zero-ray, so both arc ends lie ON real lines (the classic textbook deflection-angle
> construction). Verified by pixel measurement at four configs (b=50/KE=10 → 25.6°,
> b=100 → 16.8°, b=15 → 89.1°, head-on → 180°): arc-to-track distance 1.4–3 px, i.e.
> stroke-adjacent (`12-arc-*.png`). θ label rides the arc bisector.
>
> **UPDATE 4 (user-reported, fixed):** in plum-pudding mode the sidebar row
> "Single-shot θ (from b)" displayed the Thomson value without the ≤ sign — reading as a
> computed deflection from b when it is actually the b-INDEPENDENT upper bound on any
> single-atom deflection (the physics is correct: Thomson deflection is tiny but not
> zero). The row now relabels per model: plum mode shows "θ (Thomson max): ≤ 2.95e-4 rad"
> (verified b-independent — unchanged as b sweeps), nuclear mode keeps
> "Single-shot θ (from b)" with the exact 2·atan(d/2b) value (b=300 → 5.6° ✓). Verified
> across model round-trips, 0 console errors (`13-theta-plum.png`).
>
> **UPDATE 5 (user-reported, fixed):** the canvas Thomson label "θ ≲ … rad (Thomson)" was
> drawn at a fixed height (cy − 0.12R) and collided with the track whenever
> b·pxPerFm ≈ 0.12R. Now anchored to the track itself: text bottom 10 px above the line
> at y = b, following the track as b changes. Verified min label-to-track pixel distance
> = 8 px at b = 10/50/91/300/500 fm (`14-thomson-label-fixed.png`); 0 console errors.
>
> **UPDATE 6 (user-reported, fixed):** the single-shot trajectory stopped visually rising
> beyond b ≈ 80–114 fm. Cause: the world scale was `Lfm = max(…, b*5)`, so once b*5 won
> the max, the screen height b·halfLen/Lfm collapsed to the constant halfLen/5 — the view
> zoomed out exactly as fast as b grew (a real autoscale artifact, no physics error).
> Both trajectory drawers now use a FIXED zoom pinned to the slider range
> (`Lfm = max(400, bMax·1.25[, d·10])`). Verified: incoming-track screen height strictly
> monotonic across b = 0…500 fm in both models (427→185 px, exactly linear at
> halfLen/625 px/fm), full containment at b = 500 (0 edge pixels), θ readouts unchanged,
> arc/label anchors follow correctly (`16`, `17` screenshots).

**Verdict:** Physics is exact and impressively verified end-to-end — the on-screen
histogram was *measured from pixels* and matches sinθ·sin⁻⁴(θ/2); every readout number,
θ(b) mapping, and the drawn hyperbola check out; the plum-pudding counterfactual is
labeled and behaves exactly as Thomson predicts. No physics findings. One NON-PHYSICS P1
(readout numbers fracture across lines) and one P2 (redundant counters).
**Console:** clean (0 errors across ~50 states). **States tested:** 31 (generic probe) +
18 targeted flows + a 12k-shot histogram measurement — evidence in `_review/probe-out/`,
`_review/gf-out/` (`gf-flows.mjs`, `gf-hist.mjs`).
**Probe note:** the probe's initial "z resets on shell-lecture" flag was another
click-targeting artifact (modal-open shifting visible-button indices); the probe now
clicks by identity and reports 0 persistence failures. z/KE/b all survive lecture
toggles and mode switches.

## Verified-correct highlights (browser-observed)
- **Numbers exact:** r_min = 29.55 fm (Au, 7.7 MeV) ✓; KE 20 → 11.38 fm ✓; Z 6 →
  2.24 fm **with an honest "pure Coulomb is an approximation here" warning** when
  d ≲ 2R_nucleus ✓; dσ/dΩ(90°) = 2.18e2 fm²/sr ✓ (hand calc 218.3).
- **θ(b) mapping exact at 5 points:** b=0→180.0°, 30→52.4°, 50→32.9°, 100→16.8°,
  500→3.4° — all match 2·atan(d/2b) to the displayed digit.
- **Histogram IS the Rutherford law:** 12,038-shot run, bar lengths measured from canvas
  pixels using the sim's own layout math: bin ratios 0.245 and 0.102 vs expected 0.216
  and 0.079 (within pixel + Poisson tolerance). Card 6's claim "the sin⁻⁴(θ/2) shape is
  not drawn; it is measured" is literally true (`04-nuclear-histogram.png`, gf-hist).
- **Single-shot trajectory:** numerically integrated Coulomb hyperbola (symplectic Euler,
  adaptive substeps; Kp = d/2 is the exact scaled coupling) — bends away from the
  nucleus, exit angle matches the θ readout, b marker + θ arc annotated; b=0 gives the
  1D climb-and-return at 180° (`02`, `03`).
- **Plum-pudding counterfactual:** clearly labeled (caption, button, card copy); all
  flashes pile at 0° with the forward bar, back arc dark (`06-plum-beam.png`);
  Thomson max deflection 2.95e−4 rad ✓ ~10⁻⁴ rad as taught. No leakage into nuclear mode.
- **Flows:** KE/Z changes clear the accumulated histogram (physically necessary,
  self-consistent); model round-trip PRESERVES the nuclear histogram; pause→slider→play
  fine; reset restores exact defaults; speed ×4 works; inquiry steps drive
  model/mode/pause correctly (card 3 auto-paused plum beam, card 5 single-shot b=0);
  formal drawer equations all correct in SI form (16πε₀ factors right); no overflow at
  1100px. The earlier fired≠hits observation was my instrumentation race — a single-read
  check shows exact equality at 12k shots.

## PHYSICS
### P0
- none
### P1
- none
### P2
- none — formulas, samples, trajectory, and counterfactual all verified.

## NON-PHYSICS
### P0
- none
### P1
- **[NP-P1-1] [ux] [high]** Live-readout values fracture mid-number at the default
  window: "Closest approach (head-on)" renders as "29. / 55 / fm" over three lines,
  "Thomson max deflection" as "2.95e- / 4 rad", "dσ/dΩ at 90°" as "2.18e / +2 / fm²/s…"
  — every quantitative readout in free-explore view (evidence: `02`, `04`, `06`
  screenshots). Cause: `.stat-value{overflow-wrap:anywhere}` (line 118) combined with
  `.stat-label{flex-shrink:0}` (line 117) — long labels squeeze the value box and the
  numbers break at any character. → **Fix:** `.stat-value{white-space:nowrap;
  overflow-wrap:normal}` and let the LABEL wrap instead (drop `flex-shrink:0`, add
  `overflow-wrap:break-word` on the label).
### P2
- **[NP-P2-1] [pedagogy] [med]** "Total α fired" and "Scintillations recorded" are equal
  by construction in both models (every sampled shot lands in a bin — the beam represents
  only the ≥5° subsample, as the sidebar note explains), so the counter pair is redundant
  and the "fired" label overstates what is counted. Anchor: `fire()` ~line 1888,
  labels ~lines 819–820. → **Fix:** merge into one counter labeled "α scattered ≥ 5°
  (sampled)" or relabel "Total α fired" accordingly.

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Boot state (card 1: plum, beam, paused) | ✅ | 01 |
| 2 | r_min / dσ(90°) / Thomson-max readouts vs hand calc | ✅ exact | flows JSON |
| 3 | θ(b) at 5 values incl. head-on | ✅ exact | flows JSON |
| 4 | KE & Z sweeps + low-Z Coulomb warning | ✅ | flows JSON |
| 5 | Nuclear beam 12k shots → histogram shape | ✅ Rutherford | 04, gf-hist |
| 6 | Model round-trip preserves histogram | ✅ | 05 |
| 7 | KE change clears histogram (intended, self-consistent) | ✅ | flows JSON |
| 8 | Pause→slider→play; speed ×4; reset scope | ✅ | flows JSON |
| 9 | Plum beam: forward-only flashes | ✅ | 06 |
| 10 | Lecture toggle × sliders persistence | ✅ (probe artifact disproven) | probe |
| 11 | Formal drawer + narrow 1100 | ✅ equations right; readout wrap = NP-P1-1 | 07, 08 |

## Inquiry-question check
- "What can we conclude about the structure of gold atoms?" → **Yes**: the model toggle
  is the controlled experiment — plum piles at 0°, nuclear lights the back arc; card 4
  drives the inference explicitly.
- "Can the diameter of the nucleus be estimated?" → **Yes**: card 5's single-shot b=0
  flow reads the live r_min ≈ 29.5 fm as the upper bound — the planned Excel affordance,
  working.

## To verify (human)
- Whether the ≥5°-conditioned beam presentation (documented in the sidebar note) is the
  desired framing vs. showing a forward pass-through stream with rare scatters — current
  choice is defensible and honest.
