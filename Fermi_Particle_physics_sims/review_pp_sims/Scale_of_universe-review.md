# Review — Scale_of_universe.html ("Scale of the Universe", Lecture 2) — re-review

> **UPDATE (fix pass, same session):** NP-P2-1 fixed and re-verified
> (`_review/su-verify.mjs`, `06-light-fixed.png`). Decision: the canvas's hand-tuned dark
> palette is kept deliberately theme-independent (now explicit in code — `draw()` pins
> `bg='#060E11'` with a comment), and the overlay `.plot-title` is pinned to a light tone
> (#9ca3af) that reads on the dark field in BOTH themes instead of following the theme's
> ink color. Verified: title color identical and legible in dark and light themes; the
> light theme now reads as intentional (light chrome framing a dark viewport). Audit
> regression exact (atom → 12.398 keV, λ·p invariant ok); 0 console errors.

**Verdict:** Physics is exact and the planned dual-control affordance (length ↔ photon
energy, locked through E = hc/λ) works perfectly across sliders, ruler drags, and the
energy bar; both energy conventions (hc/λ and ħc/λ) are shown side-by-side and labeled.
No physics findings; no flow findings. One P2: the scene canvas ignores light theme.
**Console:** clean (0 errors across ~35 states). **States tested:** 23 (generic probe) +
14 targeted flows — evidence in `_review/probe-out/`, `_review/su-out/` (`su-flows.mjs`).
**Probe note:** the probe's single "persistence failure" was a float-precision false
positive (slider echoing 12.0933663383594 for …59386); probe comparison now uses a
relative tolerance. All state genuinely persists.

## Verified-correct highlights (browser-observed, hand-checked)
- **Probe-energy physics exact at every landmark:** atom (100 pm) → Eγ = 12.4 keV (hc/λ)
  and 1.97 keV (ħc/λ); nucleus (10 fm) → 124 MeV; proton (0.832 fm) → 1.49 GeV / 237 MeV
  (= 0.197/0.832 exactly); quark (10⁻¹⁸ m) → 1.24 TeV "Collider"; Earth → 1.24×10⁻¹³ eV.
  The audit invariant λ·p ≡ h holds to machine precision. Both conventions are printed
  WITH their formulas in the info box — the honest resolution of the h-vs-ħ ambiguity —
  and the formal drawer separates E_γ = hc/λ from E_probe ≈ ħc/λ ≈ 0.197 GeV/L[fm].
- **Two-way coupling (the planned "scale OR energy" param):** setting the energy slider
  moves length inversely and vice versa; canvas ruler-drag and energy-bar-drag do the
  same; through every path logL + logE ≡ −5.9066 (= −log₁₀(hc/eV·m)) exactly.
- **Ladder + bands:** landmarks pinned on the log ruler (Earth, human, hair, cell, virus,
  molecule, atom, nucleus, proton 0.84 fm, quark); imaging-tech pills flip at the right
  wavelengths (visible → X-ray/UV → e⁻ microscopy → collider → inaccessible below
  10⁻¹⁸ m); dominant-force pills (Gravity → EM → Strong → Weak+Strong) at sensible
  boundaries. Illustrations morph per decade (Bohr atom, nucleon cluster, uud proton,
  quark fuzz) — `01-*.png`.
- **Flows:** reset → logL = −10 exactly; 6 inquiry cards with 3 working gates; pointer
  drags on ruler and energy bar update live; no overflow at 1100 px; 0 DOM overlaps;
  0 console errors.

## PHYSICS
### P0
- none
### P1
- none
### P2
- none — every displayed number, band boundary, and the λ·p invariant check out.

## NON-PHYSICS
### P0
- none
### P1
- none
### P2
- **[NP-P2-1] [ux] [high]** Light theme: the scene canvas stays dark while the header and
  sidebar go light, and the canvas-drawn title "ZOOMING FROM EARTH TO QUARK · λ = h/p"
  becomes dark-on-dark and nearly illegible (evidence: `04-light.png`; compare Gold Foil,
  whose canvas flips correctly). Cause: `draw()` reads `--bg` from
  `document.documentElement` (~line 3248) while the theme class toggles elsewhere, so the
  canvas background never updates. → **Fix:** read the theme vars from the same element
  the theme class is applied to (body, as the other sims do), or check
  `document.body.classList.contains('light-theme')` and pick bg/text colors accordingly
  throughout `draw()`/`drawRuler()`/`drawEnergyBar()`/`drawInfoOverlay()`.

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Audit at 5 canonical scales + invariant | ✅ exact | flows JSON |
| 2 | Landmark sweep with illustrations | ✅ | 01-earth…01-quark |
| 3 | Energy slider → length (both extremes) | ✅ exact inverse | flows JSON |
| 4 | Length slider → energy | ✅ | flows JSON |
| 5 | Canvas ruler drag | ✅ coupled live | 02 |
| 6 | Reset scope | ✅ −10.00 | flows JSON |
| 7 | Inquiry: 6 cards, 3 gates | ✅ | 03 |
| 8 | Narrow 1100 | ✅ clean | 05 |
| 9 | Light theme | ⚠ canvas stays dark (NP-P2-1) | 04 |

## Inquiry-question check
- "Explain how higher momenta can probe shorter distances" → **Yes — the entire sim IS
  this relation**, enforced live in both directions with the formula on screen.
- "Order-of-magnitude comparisons (quark vs molecule etc.)" → yes: log ruler with pinned
  landmarks; e.g. quark-to-molecule is read directly as 9 decades.
- "Why have we still not been able to get a clear look at quarks?" → yes: below 10⁻¹⁸ m
  the tech pill reads "Inaccessible", and the energy bar shows the TeV cost.

## To verify (human)
- Whether the dark canvas in light theme is deliberate art direction; if so, only the
  canvas-title contrast needs fixing rather than the full palette flip.
