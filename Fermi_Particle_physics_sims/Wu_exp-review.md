# Review — Wu_exp.html ("Wu Experiment and the Death of Parity", Lecture ~17)
**Re-review after fix sweep + W(θ) side-plot change (2026-08-25).**
**Verdict:** Physics engine, sampling, readouts, flows, and layout are all solid; one real physics inconsistency remains in the mirror panel (detector counts not reflected), plus two stale-text contradictions about the coil current left over from the old vertical-mirror geometry.

**FIXES APPLIED (2026-08-25, browser-verified):** PHY-P0-1 (mirror detectors drawn in reflected positions — S image on top), PHY-P1-1 (card 8 CP text reworded, no reversed-current claim), PHY-P1-2 (Info H1 row reworded), PHY-P2-1 (single-spin swing amplitude = acos(P), tumbles at P=0), NP-P1-1 (card 4 reworded to counts + W(θ) plot), NP-P2-1 (axis labels "θ = 0° (along J)" / "θ = 180° (opposite J)"), NP-P2-3 (dead histAngles/histMirror removed). Skipped: NP-P2-2 (restore-to-card-1 is shared shell behavior across all nine sims; left as designed). Verified: mirror counters match mirrored flux at P≈0.99, asym −0.251 (N=390) vs pred −0.296 ✓, labels clear at 743px canvas, clear/reset/mirror flows intact, zero console errors.
**Console:** clean — zero errors/warnings across the whole session (load, firing, mirror, steps, theme, formal, info, maximize, rapid-scrub stress).
**States tested:** ~30 (all controls, all 8 inquiry cards incl. gates/choices, slider min/def/max while running, mirror on/off ×8, reset, pause interleavings, speed 1×/4×, light theme, formal, info, maximize, 1440/1280/1100 widths).

Environment note (not a sim bug): with the Chrome window fully occluded, `document.hidden` throttles rAF to 0 and the sim freezes; counts collected around such a period made the running asymmetry look ~2σ low. A controlled fresh run plus a 2M-draw in-page test of `sampleTheta` confirmed the pipeline is unbiased.

## PHYSICS

### P0
- **[PHY-P0-1] [high]** Mirror panel's detector counters are not reflected — the mirrored electron flux streams into a counter showing the SMALLER count. Repro: high P (B=10, T=1 mK), Fire decays, Show mirror. Observed: both panels draw N=countsUp on top, S=countsDown on bottom (e.g. mirror panel: N 380 top, S 532 bottom) while ~2/3 of the drawn mirrored electrons fly UP into the top counter. Expected: reflection across the horizontal plane maps the real S counter (the big number) to the mirror panel's top slot — the image's top counter must display countsDown (and carry the 'S' label), bottom countsUp/'N'. As shown, a student reads "the mirror records identical counts", which inverts the distinguishability lesson. Evidence: ss_5064t1c6q, ss_5790f0lg7. Anchor: `drawApparatus` lines 1876–77 (`drawDetector(ctx, 0, -ch-22*scale, state.countsUp, 'N', scale)` / `... state.countsDown, 'S' ...` with no `mirrored` branch). Historical note: the old "detector-count swap" was removed as spurious during the geometry fix — it was spurious for the old side-by-side/vertical-plane layout, but the stacked horizontal-plane layout needs it. → **Fix:** in `drawApparatus`, when `mirrored`: top = `drawDetector(..., state.countsDown, 'S', ...)`, bottom = `drawDetector(..., state.countsUp, 'N', ...)`. Change nothing else.

### P1
- **[PHY-P1-1] [high]** Inquiry card 8 contradicts card 6 and the canvas label about the coil current. Card 8: "In the mirror, the coil current reversed — but the charges carrying it did not." Card 6 + canvas label: "coil current (unchanged — loops lie parallel to the mirror)" — which is correct for the horizontal mirror plane (a horizontal circulation keeps its sense under a vertical flip; that is exactly why B and J don't flip). Card 8's CP mechanism is a leftover from the old vertical-mirror geometry. Evidence: card texts at lines ~830 (step 8) vs ~824 (step 6); canvas label ss_5064t1c6q. → **Fix:** reword card 8 to carry the CP story without the reversed-current claim, e.g.: "The mirror image is not an experiment Nature runs. But apply C as well — turn every particle into its antiparticle — and it becomes one: anti-⁶⁰Co decaying by β⁺, with positrons emitted preferentially along J. CP is (very nearly) conserved even though P alone is not." Keep the Wu-1957 note line.
- **[PHY-P1-2] [high]** Info modal repeats the same stale claim: H1 row says "the student sees the reversed coil current for themselves". Anchor: pedagogy table row near line 730. → **Fix:** reword to "…sees that the coil current, spin, and B are unchanged under the horizontal mirror while the electron momenta flip".

### P2
- **[PHY-P2-1] [med]** Single-spin arrow (cards 1–2) barely responds to P: wobble amplitude is `0.15·(1−P)` rad (≤ 8.6°), so at B=0/P=0 the lone spin still points essentially up, while card 1 says "Turn up the field B and cool the crystal… watch how the arrow behaves." The ensemble view (card 3+) shows disorder properly. Anchor: draw loop ~line 1986. → **Fix (optional):** raise the single-spin wobble amplitude at low P (e.g. `0.15 + 1.2·(1−P)` rad or slow random tumbling at P≈0).

## NON-PHYSICS

### P0
none

### P1
- **[NP-P1-1] [pedagogy] [high]** Card 4 instructs "Press Fire decays and watch the histogram" — there is no histogram anymore; the angular histogram was replaced by the analytic W(θ) side plot, and detected electrons register only in the numeric N/S counters. Anchor: card text line 810; dead data `state.histAngles`/`histMirror` (pushed at 1812–1815, consumed nowhere). → **Fix:** reword to "…and watch the detector counts (and the W(θ) plot)"; optionally delete the now-dead histAngles/histMirror bookkeeping.

### P2
- **[NP-P2-1] [ux] [med]** W(θ) plot axis labels "θ = 0 ∥ J" / "θ = 180°" are easy to misread in the monospace numeral font (a user read "180°" as "100°") and "∥ J" is cryptic. Anchor: `drawWPlot` ~line 2041. → **Fix:** reword to "0° (along J)" and "180° (opposite J)".
- **[NP-P2-2] [flow] [low]** After Finish, the "▸ Guided inquiry" restore chip reopens at card 1 rather than where the student left off. Acceptable as a deliberate restart; flag only if step-persistence is wanted.
- **[NP-P2-3] [functional] [low]** `state.histAngles`/`state.histMirror` are maintained on every decay (push/shift at 400) but never drawn — dead work each emission.

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Load → console → control census | 16 controls, all reachable, 0 errors | read_page |
| 2 | Fire decays → counts accumulate | ✓ rate ≈10/s emission; more S than N (correct sign) | js state reads |
| 3 | Asymmetry convergence vs Predicted | ✓ sampler unbiased (2M draws: −0.2021 vs −0.2015); Predicted = A·P·β/2 matches formal eq | js MC test |
| 4 | B→0 while firing | ✓ P=0.000, coef=0, Predicted 0.000, W(θ)→isotropic circle; firing persists, counts cleared by design | ss_8116xrjio |
| 5 | B=10, T=1 mK | ✓ P=0.987, coef −0.592, Predicted −0.296, strong south lobe | ss_9550wbs4x |
| 6 | Show mirror while firing | ✓ firing continues; panels exact vertical mirror (paused-frame check); counter issue → PHY-P0-1 | ss_5790f0lg7 |
| 7 | Slider change with mirror ON | ✓ mirror + firing preserved (counts cleared) | js reads |
| 8 | Inquiry cards 1→8, gates, wrong+right choices | ✓ gating works, feedback correct, Finish hides inquiry, restore chip works | ss_8649frx30 |
| 9 | Step change with mirror ON (1→2) | scene re-staged to single panel; mirror state + button label stay consistent | js reads |
| 10 | Reset | ✓ exact scope: defaults, counts 0, firing off, mirror off, play resumes, buttons relabelled; speed (shell) kept | ss_0424tix0m |
| 11 | Pause → slider → still paused | ✓ student pause honored; P updates live | js reads |
| 12 | Mirror toggle ×6 rapid + 30-step T scrub + speed change | ✓ no errors, no listener duplication (emission rate stays nominal) | js rate test |
| 13 | Formal / Info / theme / Maximize round-trips | ✓ all work; KaTeX equations correct incl. ½APv/c; light theme keeps dark canvas with readable text | ss_842475byc, ss_89752vp1l, ss_9514zkgeg |
| 14 | Overlap: DOM pairwise + hScroll at 1440/1280/1100, busiest state | ✓ 0 overlaps, no overflow; in-flow legend wraps cleanly | ss_7548yy6ja, ss_9688vebsy |

## Inquiry-question check
- "What would you expect if parity were conserved?" → **answerable**: dotted isotropic reference on the W(θ) plots, P→0 limit kills the asymmetry live, card 4 choice A states the parity-conserving prediction.
- "Align spins, fire, compare real vs mirror; discover only the charge-flipped mirror is real" → **mostly answerable** via W(θ) plots + tracks; weakened by PHY-P0-1 (mirror counters read identical to real) and PHY-P1-1 (card 8's wrong CP mechanism).

## To verify (human)
- Confirm the intended semantics of the mirror panel counters (literal reflected image vs annotated copy) before applying PHY-P0-1 — either way the top counter of the mirror panel should show the larger (south) count.
- Card 8 rewording is a physics-text change; have the course owner sign off on the suggested CP phrasing.
