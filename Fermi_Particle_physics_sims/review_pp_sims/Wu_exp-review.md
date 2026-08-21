# Review — Wu_exp.html ("Wu Experiment and the Death of Parity", Lecture ~17) — re-review

> **UPDATE (fix pass, same session):** both P1s fixed and re-verified
> (`_review/wu-verify.mjs`, screenshots `08`, `09`).
> - PHY-P1-1 ✅ mirror coil current no longer drawn/labeled "reversed": `dirSign = 1`
>   with a geometry comment, caption now "coil current (unchanged — loops lie parallel
>   to the mirror)", and card 6's parenthetical rewritten to the correct horizontal-
>   mirror story ("the mirrored world differs in exactly one thing: where the electrons
>   go"). Verified on screen: spins and B up in BOTH panels, mirrored electron tracks
>   flipped — internally consistent.
> - NP-P1-1 ✅ `Shell.init` now passes `cfg:{restartOnParamChange:false}` and the B/T
>   handlers call a new `clearStatistics()` (counts + histograms only). Verified
>   mid-fire: moving B keeps firing ("⏸ Stop firing") AND mirror view alive, clears the
>   statistics, and the asymmetry re-converges to the new prediction (B=8 → P=0.817,
>   pred −0.245 exact; measured −0.196 at N=500, 1.1σ). Minor known transient: the few
>   in-flight electrons sampled under the old P land after the clear (~15 events) —
>   statistically negligible.
> - 0 console errors throughout.

**Verdict:** The statistical physics is exact — Brillouin polarization verified to 4
decimals, predicted asymmetry ½·A·P·β matches the hemisphere integral, the measured
asymmetry converges to it with the right (negative) sign, and the P→0 limit kills the
signal as it must. Two P1s remain: the mirror panel labels/draws the coil current as
"reversed", which is inconsistent with the horizontal mirror plane the sim itself
implements (PHY-P1-1), and moving a slider silently stops the firing run (NP-P1-1).
**Console:** clean (0 errors across ~45 states). **States tested:** 27 (generic probe) +
16 targeted flows incl. a 35 s, ~1,400-electron statistics run — evidence in
`_review/probe-out/`, `_review/wu-out/` (`wu-flows.mjs`, `wu-repro.mjs`).

## Verified-correct highlights (browser-observed, hand-checked)
- **Polarization exact:** B = 5 T, T = 3.02 mK (slider-step) → P = 0.672 via the J = 5
  Brillouin function — matches my independent evaluation to 4 decimals; B/T readout
  1656 T/K ✓; warm limit P = 0.003 at 1 K, and B = 0 → P = 0.000 exactly.
- **Asymmetry physics exact and sign-correct:** predicted −0.202 = ½·(−1)·0.672·0.6 (the
  hemisphere-averaged ½·A·P·⟨v/c⟩, which I verified by integrating W(θ)·sinθ — the sim's
  comment even cites the matching Formal eq2); after 1,387 electrons measured −0.220
  (0.7σ), with counts DOWN 846 > UP 541 — electrons opposite the up-aligned spins, the
  Wu result with the right sign (`02-fired.png`). Audit exposes coefficient −0.403 =
  A·P·β and both intensities (0.597 along / 1.403 against spin ✓).
- **Engine module:** parityTransform (polar flips, axial doesn't), pseudoscalar
  classification of spin·p, W(θ) = 1 + A·P·β·cosθ with mirrored intensity, Brillouin
  with the honest hyperfine-field caveat, Fermi beta spectrum — all canonical.
- **Mirror mechanics (particles):** momentum vertical component flips, spins stay up,
  polar histogram shows the real (blue) and mirrored (red) lobes on opposite sides —
  the parity contradiction rendered live (`04-mirror.png`).
- **Flows:** fire toggle resumes play; clear scopes counts only; reset restores full
  defaults incl. mirror/fire buttons; 8 inquiry cards with 3 predict-gates ending in the
  CP-rescue story; Formal equations exact (A₆₀Co = −1, ½APβ, B_J, axial/polar); 0 DOM
  overlaps; no overflow at 1100 px; 0 console errors.

## PHYSICS
### P0
- none
### P1
- **[PHY-P1-1] [high]** Mirror panel draws the coil-current arrows REVERSED and captions
  them "coil current (reversed)" — inconsistent with the sim's own mirror geometry.
  The mirror plane is HORIZONTAL (drawParticles comment states it): under z-reflection a
  polar vector's components PARALLEL to the plane are unchanged, and the coil currents
  are horizontal — so the current does NOT reverse; that is exactly WHY B (drawn up,
  "axial — same in both panels") and the spins stay up. A reversed current would give
  B down and contradict the same panel's B arrow and aligned spins. Card 7's
  parenthetical repeats the claim ("the coil current that makes B also reverses
  handedness"). Repro: Show mirror (`04-mirror.png`, red "(reversed)" caption).
  Anchors: `drawApparatus()` `dirSign = mirrored ? -1 : 1` ~line 1833 and caption
  ~line 1856; card 7 text ~line 821. → **Fix:** `dirSign = 1` always; caption
  "coil current (unchanged — the loops lie parallel to the mirror)"; card 7: replace the
  parenthetical with "it is axial — under this mirror the horizontal current loops are
  unchanged, so B and the spins stay up; only the electrons' vertical momentum flips."
### P2
- none

## NON-PHYSICS
### P0
- none
### P1
- **[NP-P1-1] [flow] [high]** Moving the B or T slider silently STOPS the firing run
  (button flips back to "▶ Fire decays") and — by the same path — exits mirror view.
  Repro: Fire decays → drag B one tick → firing stops, counts wiped (verified:
  fire label reverted, counts 0 after 2.5 s; `wu-repro.mjs`). Cause: `Shell.init` passes
  no cfg (~line 2256), so the shell default `restartOnParamChange: true` fires
  `restartWithCurrentParams()` → `onReset()` on every slider input; onReset sets
  `firing = false` and `showMirror = false`. NOTE the count wipe itself is physically
  CORRECT (a new P must not inherit old statistics) and must be kept. → **Fix:** pass
  `cfg: { restartOnParamChange: false }` and clear the statistics explicitly in the B/T
  input handlers (`countsUp/Down = 0`, `histAngles/histMirror = []`), preserving
  `firing` and `showMirror` — the sibling sims (Gold Foil, Cloud Chamber) use exactly
  this pattern.
### P2
- none — (the theme-var `cssVar()` here also reads `documentElement`, but this sim's
  canvas colors are hard-pinned hex values and `--surface`/`--muted` remain legible in
  light theme; no visible defect found.)

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Default P/B-T/prediction readouts vs hand calc | ✅ 4-decimal match | flows JSON |
| 2 | 35 s fire → sign + convergence | ✅ −0.220 vs −0.202 (0.7σ) | 02 |
| 3 | Warm (P→0) and B=0 limits | ✅ signal vanishes | 03 |
| 4 | Mirror toggle + stacked panels | ✅ mechanics; ❌ current caption (PHY-P1-1) | 04 |
| 5 | Slider during firing | ❌ silent stop (NP-P1-1) | wu-repro |
| 6 | Clear during fire; reset scope | ✅ exact | flows JSON |
| 7 | Inquiry: 8 cards, 3 gates, staged scenes | ✅ | 05 |
| 8 | Light theme + narrow 1100 | ✅ | 06, 07 |

## Inquiry-question check
- "If P is conserved, what would you expect to measure?" → yes: P→0 flat distribution is
  reachable by the T slider; the dashed isotropic circle on the polar plot is the
  P-conserved reference.
- "Interpret the results — what can we conclude about P conservation?" → yes: measured
  vs predicted asymmetry converging to a non-zero value + the mirror comparison.
- The planned "CHARGE-PARITY rescue" beat → present as card 8.

## To verify (human)
- PHY-P1-1's fix wording — if you would rather keep the classic "current reverses"
  narrative, the mirror must become a VERTICAL plane (side-by-side panels, spins and B
  flipped down, electron verticals unchanged); the current stacked layout requires the
  unchanged-current story.
