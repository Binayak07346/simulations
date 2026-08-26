# Review — the-wine-bottle-potential-continuous-symmetr.html ("The Wine-Bottle Potential — Spontaneous Breaking of a Continuous Symmetry", curriculum: Lecture 10 "Symmetry in Physics" · Simulation Descriptions row "The Wine Bottle Potential: Continuous Symmetries")
**Verdict:** Physics core is exactly right in the sim's own stated convention (L = ½(∂φ₁)² + ½(∂φ₂)² − V, so v = √(−μ²/2λ), V_min = −μ⁴/4λ, m²_radial = V″ = −4μ², ring m² ≡ 0 — all verified numerically and against the readouts at every slider stop); every control is live, all 5 cards gate/reveal correctly, and the 63-combo matrix passed clean. Findings are four physics P2s (anharmonic period at the default kick, lossy "elastic" wall, over-strong "|φ| holds at 1.00" prose, deterministic symmetry-breaking azimuth) and one flow P1 (Reset on card 2 force-resumes the deliberately paused hilltop scene).
**Console:** clean — zero pageerrors/console errors from the sim; the only network 4xx is the environment's automatic `/favicon.ico` request (no favicon is linked by the sim; not a sim asset).  **Combos tested:** 63 exhaustive (μ² × γ × placement) + ~45 sampled (μ²/γ slider stops, kick stress, flow mutations, pager round trips, wall/coast/period runs).

**Curriculum note (flagged per skill):** the Lecture 10 row is a brainstorm stub — "Wine bottle potential? Exploration of other continuous symmetries?" — with no LOs; the Simulation Descriptions row is empty. The operative LO was therefore derived from the sim's own Info modal (SSB of a global U(1); one massless Goldstone per broken continuous symmetry; radial = Higgs-like massive mode; bridge to Lecture 19's Higgs mechanism) and reviewed against that plus the SSB canon.

**Convention verification (SSB canon item):** the canon's m² = −2μ² belongs to the textbook normalisation L = |∂φ|² − V. This sim explicitly declares L = ½(∂φ₁)² + ½(∂φ₂)² − V with V = μ²|φ|² + λ|φ|⁴, |φ|² = φ₁² + φ₂², λ = 1 — under which V′(v) = 0 ⇒ v = √(−μ²/2λ) and m²_radial = V″(v) = 2μ² + 12λv² = −4μ². Checked by explicit `node -e` calculation and against `window.__audit.at()`, the readout table at 8 slider stops, the Formal-panel equations (which also state the −2μ² convention and the φ → φ/√2 map — correct), the card-3 text (m² = 8 at μ² = −2), and the measured small-oscillation period (2.222 vs 2π/√8 = 2.2214). Internally consistent everywhere; no finding.

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** The "radial period 2π/m" readout (2.22 at μ² = −2) does not match the period a student would time on the default card-3 animation: the card's kick (vx = 0.9) is large-amplitude and the measured period is 2.443 (10% high; anharmonicity of the quartic well). Measured T vs kick: 0.2 → 2.230, 0.4 → 2.256, 0.9 → 2.443 (h = 0.002 leapfrog, 6 periods averaged). Repro: card 3, time the slice-dot oscillation against the table row. Anchor: `PRE[2]` (vx: 0.90) + `syncUI` `roT`. → **Fix:** reduce the card-3/`kickRadial` impulse to ≤0.4 (≤1.6% deviation), or append "(small oscillations)" to the period row label.
- **[PHY-P2-2] [high]** The plot-boundary wall is labelled "hard wall at |φ| = 1.47 — plot edge, elastic bounce" but loses energy each bounce: launched at E = 1.42 (vx = 2.2 from the valley, γ = 0), E fell to 1.299 over ~4 bounces (~2–3%/bounce), while the identical no-wall run conserved E to 6×10⁻⁸. Cause: the radial projection r → RWALL discards the potential difference V(r) − V(RWALL) of the overshoot. Anchor: `phys()` wall branch (`const s = RWALL / r; S.x *= s ...`). Admittedly non-physics territory (the wall itself is declared "not physics"), but the on-canvas label claims elastic. → **Fix:** after projecting, rescale speed so E is conserved (add the discarded ΔV to kinetic energy), or bisect the crossing time.
- **[PHY-P2-3] [high]** Card-4 feedback slightly overstates the ring coast: "the slice dot never climbs" / "|φ| holds at 1.00". Measured (γ = 0, push 0.55): |φ| oscillates 1.000–1.065 about the effective-potential minimum 1.033 (centripetal requirement of the finite push — correct physics), ΔV = 0.018 (≈0.5% of the slice axis, sub-pixel, so the *visual* claim holds; E conserved to 10⁻⁸ over 60 sim-s, 4.9 laps, no angular decay). The drawn dynamics are right; only the prose absolutizes. → **Fix:** soften to "the slice dot stays pinned to the valley floor" / "|φ| stays at ≈1.00 — only the phase advances".
- **[PHY-P2-4] [med]** The card-2 symmetry-breaking azimuth is deterministic, undermining "which azimuth it took was an accident": `PRE[1]` seeds the field at the fixed offset (0.03, 0.018), which is outside the random-fluctuation trigger zone (`rr0 < 0.02`), so every run/Reset rolls off toward the same ≈31° azimuth and the "vacuum fluctuation — random direction" flash never fires on this card (the sim's own polish note says the seed should be a one-off random-direction velocity fluctuation). Repro: card 2 → answer → watch; Reset; repeat — identical direction. Anchor: `PRE[1]` vs the fluctuation branch in `phys()`. → **Fix:** set `PRE[1]` to exactly (0, 0, 0, 0) so the existing random-velocity fluctuation supplies the seed, or randomize the offset azimuth in `applyPre`.

## NON-PHYSICS
### P0
none
### P1
- **[NP-P1-1] [flow] [high]** Reset on card 2 force-resumes the deliberately paused hilltop scene, contradicting the card beside it ("the field sits balanced exactly there — **paused**. When time runs, it will…") and leaking the roll-off before the student commits a prediction. Cause: the shell's reset handler calls `setPlaying(true)` *after* `onReset()`, overriding `applyPre(PRE[1]).pause`. Observed live: card 2 active → ↻ Reset → `{step:1, mu2:−2, x:0.03, playing:true}`. Anchor: shell `reset.addEventListener` (`onReset(); …; setPlaying(true)`) vs `applyPre` / `PRE[1].pause`. → **Fix:** in `onReset`, when the applied spec has `pause`, re-assert it after the shell's resume (e.g. `requestAnimationFrame(() => Shell.setPlaying(false))`), scoped to unanswered gated cards.
### P2
- **[NP-P2-1] [overlap] [high]** In the radial-slice strip, the green "V_min = −1.00" tag and the ball's "φ" tag are drawn at the same point whenever the field rests at the vacuum (the default state of cards 4/5, post-completion, and light theme alike), producing garbled overlapping text. Evidence: wb-05/wb-06/wb-10 screenshots. Anchor: `drawStrip` — `haloText('V_min…', xr(S.v)+10, yv(S.Vmin)+1)` vs `haloText('φ', bx+11, by−2)`. → **Fix:** when |bx − xr(S.v)| < ~14 px, offset the V_min label left of the marker (align right) or drop the φ tag.
- **[NP-P2-2] [functional] [low]** Inert `'use strict';` sits as a bare expression statement after the Shell IIFE (mid-script, so it enables nothing). Harmless dead code. Anchor: line after the `Shell` factory (`})(); 'use strict';`). → **Fix:** delete or move to the top of the script tag.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| μ² slider (−2…+1, step 0.05) | 8 stops {−2,−1.5,−1,−0.5,−0.2,0,0.5,1} + 40-event scrub | readout row = __audit = node formulas at every stop; phase pill broken↔symmetric; ring m² row "0"↔"no ring"; trail cleared on change; slider echo; no error flood | OK |
| damping γ slider (0…0.6) | 5 stops {0,0.15,0.3,0.45,0.6} | echo; energy strictly monotone ↓ at every γ>0 (E −0.849→−0.985…−1.000); warn note toggles; γ=0 conserves (ΔE 10⁻⁸); γ=0.6 from hilltop settles onto ring r=1.0000 | OK |
| Ring push button | click at valley, at hilltop, 10× rapid | Δv exactly (0,0.55) tangential per click ×10 (no listener duplication); hilltop → random-direction impulse + flash; kfx pulse | OK |
| Radial kick button | click at valley, at hilltop | Δv exactly (0.9,0) radial; hilltop random impulse + flash | OK |
| Canvas drag-to-orbit | 160 px real mouse drag | Δyaw = 0.960 = 160×0.006 exactly | OK |
| Canvas click-to-place | valid (surface point) + invalid (corner) | valid: placed \|φ\|=0.92 @154° (nearest sampled radius to the 0.894@153° click), v zeroed, flash text; invalid: state unchanged | OK |
| Play/Pause | toggled throughout | paused state honoured during μ² change (readout still updates live) | OK |
| ↻ Reset | completed state + card 2 | completed: restores PRE[4] load state (μ²=−2, rest at (1,0), yaw reset, meter kept) as advertised; card 2: applies PRE[1] but force-resumes → NP-P1-1 | NP-P1-1 |
| Speed 0.25–4× | 1× vs 4× wall-clock path length | ratio 4.05 observed; setting persists across other control changes | OK |
| ☾ Theme | round trip | canvas re-palettes (light verified in wb-10); config persists | OK |
| ⛶ Maximize | round trip | aside/formal collapse, canvas refits, config persists | OK |
| ∑ Formal | round trip | formal section + all 4 KaTeX equations render; dashed V″ fit parabola appears on slice with caption (wb-09) | OK |
| ⓘ Info | open/close | modal opens, ✕ closes; numeric claims in it (axis ranges −1.05…+1.55 / −1.3…+2.5, wall 1.47) match code constants | OK |
| 🎓 Lecture / restore chip | on→off | ON: lecture-mode class, collapsed, metered/revealed, playing, PRE[4] scene; OFF: card 1, answers preserved | OK |
| Hide Text | check→uncheck | hide-text class toggles; innerText delta 0 (registry empty — matches manifest); boot unchecked | OK |
| ‹ › pager + Next/Finish | full round trips | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| μ² {−2,−1,−0.5,−0.05,0,0.5,1} × γ {0,0.3,0.6} × placement {origin, valley, outer} | exhaustive | 63 | 500-step evolution each: state finite (no NaN); r ≤ 1.4701 (wall holds); energy monotone ↓ for γ>0 (fluctuation zone excepted); v & m²_radial = __audit formulas; ring row "0" (μ²<0) / "no ring" (μ²≥0) | 63/63 pass |
| μ² slider sweep readout check | exhaustive stops | 8 | v=√(−μ²/2), V_min=−μ⁴/4, m²=−4μ² (broken) / 2μ² (symmetric), T=2π/m, ring ≡ 0, trail cleared | 8/8 pass (values exact to display precision) |
| Kick stress | sampled | 10× ring + hilltop cases | per-click Δv nominal 0.5500 ×10; random-direction hilltop path | pass |
| Flow mutations | sampled | theme/max/formal/speed × {μ²=−1.25, γ=0.35}; pause→μ² change→play; kick→immediate γ scrub | nothing silently reset; paused readouts live | pass |
| Scrub stress | sampled | 40 rapid μ² input events | consistent echo/state at end; zero errors | pass |
| Physics runs | sampled | period ×4 amplitudes, ring coast 60 s-t, wall ×2, hilltop roll-off, damped settle | see PHYSICS findings + verification block | pass except PHY-P2-1/2/3 |
| Skipped | — | per-pixel canvas-fingerprint diffs (state-field + screenshot assertions used instead); touch/pointer-cancel path (code-read only) | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 symmetric vacuum | μ²=+1, oscillates through origin (x ∈ [−0.850, 0.850], 13 zero-crossings, E conserved 5×10⁻⁶) | ungated | — | — | OK |
| 2 predict μ²<0 | paused, μ²=−2, r=0.035 hilltop; rolls to ring in 2.1 s-t on play | ✓ (Next disabled pre-answer) | play fires on answer ✓; wrong path styled red + correct pops green; double-answer guarded | "curvature 2μ² < 0" ✓ (V″(0)=−4 at μ²=−2) | OK (PHY-P2-4 azimuth; NP-P1-1 Reset) |
| 3 radial massive | kick vx=0.9, slice dot climbs both walls (wb-04); "m² = V″ = −4μ² = 8" ✓ | ungated | — | — | OK (PHY-P2-1 period mismatch at this amplitude) |
| 4 predict ring push | at rest at (1,0); ring row masked "—" pre-reveal ✓ | ✓ | ring push fires on answer (Δv tangential 0.55); "springs back" spawns labelled dashed ghost that reverses (θ_ghost 0.33→−0.32→0.34) while real ball advances monotonically (0.41→2.87 rad); ghost expires 5 s; judge reveals after 1.6 s watched: ring row "0", other rows still masked (deliberate) | "V is flat along the ring — no force, m² = 0" ✓ | OK (PHY-P2-3 prose) |
| 5 μ² sweep | answer unmasks full table 1.00 / −1.00 / 8.00 / 0 / 2.22; sweep −2→−0.2 tracks formulas with ring pinned 0; invariance note + .inq-after appear | ✓ | meter ✓ | all three feedback formulas ✓ (√(−μ²/2), −4μ²) | OK |
| pager | 5→1→5: state fingerprints identical fwd vs re-fwd; answers preserved (0,1,0,1,1 — cards 1/3 have no choices); prev disabled at 0, pager-next at end; Finish collapses to restore chip, metered+playing | | | | OK |
| symmetric-phase guard | ring push at μ²=+1 does NOT trigger the Goldstone reveal (judge stays −1) | | | | OK |

## Curriculum checklist
(curriculum sparse — brainstorm stub only; LO derived from the Info modal, flagged above)
- Wine-bottle potential V = μ²\|φ\|² + λ\|φ\|⁴ with a sweepable μ² through the symmetric→broken transition → **met** (full-range slider, fixed V axes make the transition visible)
- Continuous U(1) symmetry & its spontaneous breaking → **met** (ring of vacua drawn + labelled, arbitrary-azimuth message — but see PHY-P2-4 on the deterministic seed)
- Goldstone mode (massless, per broken continuous symmetry) → **met** (ring push coasts, ring m² pinned 0 across the sweep, Goldstone 1961 + superfluid + Higgs-mechanism links on card 5)
- Massive radial (Higgs-like) mode with operational mass (curvature = ω², period check) → **met** (PHY-P2-1 on the default amplitude)
- "Exploration of other continuous symmetries" (curriculum's question mark) → **partially met**: only U(1) is simulated; superfluid phase mode + gauged-U(1) forward pointer are textual. Given the row is a brainstorm question, no finding beyond this note.
- Noether/conservation-law tie-in (lecture elements list "conservation laws, Noether's theorem") → **gap (pedagogy P2, folded here)**: the coasting ball's conserved field-space angular momentum IS the U(1) Noether charge, and the sim never names it — one sentence on card 4/5 would connect the sim to the lecture's headline theorem.
- Guided-inquiry mode with predict-before-reveal → **met** (3 gated predictions, order+pause gating, misconception ghost)

## To verify (human)
- The judge-based reveal also fires on a *spontaneous* (pre-card-4) ring push in the broken phase — the Info modal declares exactly this ("reveals are gated by ORDER + PAUSE only"), so it is recorded as design, not a finding; confirm that is still the intent.
- PHY-P2-2 fix choice (energy-conserving wall) should keep the wall label honest without letting repeated kicks accumulate unbounded speed; the current lossy wall accidentally damps runaway energy.
- Compact/mobile layout was spot-checked at 1024×700 (wb-12: clean, no overlap); a phone-width (≤600 px) pass was not run.

---
*Review artifacts: screenshots wb-01…wb-12 + driver scripts wb-a/b/c.mjs in the session scratchpad. Reviewed headless (Chrome, 1440×900, `?v=review`); `document.hidden` = false throughout; deterministic physics runs driven via `phys()`/`onFrame()` with the shell paused.*

## FIXES APPLIED (2026-08-26)

Every finding was independently reproduced headless (Chrome 1440×900, physics driven via `phys()` with the shell paused, h = 0.002) before any edit; zero pageerrors before and after; v/V_min/m²_radial verified exact against `window.__audit` at μ² ∈ {−2, −1, −0.5, 0, +1} after the edits.

| ID | Verdict | Evidence / fix |
|---|---|---|
| PHY-P2-1 | **CONFIRMED + FIXED** | Measured T at kick 0.9 = 2.4426 vs label 2π/√8 = 2.2214 (10.0% high); kick 0.4 → 2.2563, kick 0.2 → 2.2297 — reproduces the review's table. Fix: appended "(small oscillations)" to the period row label (static row + both `syncUI` branches), keeping the physics and the card-3 kick untouched — the label option was chosen because the 0.9 kick's visible wall-climb is load-bearing for card 3's "climbs both walls" prose, and the label now stays honest at any kick amplitude the free-exploration button produces. Post-fix label verified live. |
| PHY-P2-2 | **CONFIRMED + FIXED** | E = 1.4200 fell to 1.3351 over 6 bounces (~1%/bounce lost) while an identical sub-wall run conserved E to 1.2×10⁻⁶ — the r→RWALL projection discards ΔV = V(r)−V(RWALL). Fixed by making the bounce actually elastic (small local change at the `phys()` wall branch): compute the discarded ΔV before projecting and return it to kinetic energy (`f = √(1+2ΔV/k²)` speed rescale) after the reflection. Post-fix: E = 1.42000000 → 1.42000542 over 6 bounces (drift ≈ 4×10⁻⁷/bounce, integrator-level); wall still holds at r ≤ 1.47. Chosen over relabelling because the change is 3 lines at the anchor and keeps the on-canvas "elastic" label true. |
| PHY-P2-3 | **CONFIRMED + FIXED** | Ring coast (push 0.55, γ = 0): \|φ\| rides 1.0000–1.0646 about the V_eff minimum 1.0327; E conserved to 4×10⁻⁹ over 60 sim-s — correct physics, prose overstated. Softened per the review: correct-choice fb "never climbs" → "stays pinned to the valley floor"; wrong-choice fb "\|φ\| holds at 1.00" → "\|φ\| stays at ≈1.00". |
| PHY-P2-4 | **CONFIRMED + FIXED** | Azimuth 30.96° identical on 2 same-page runs + 3 fresh loads; fluctuation flash never fired (seed r = 0.035 > trigger 0.02). No card/feedback text depends on a specific angle (card 2 says "which azimuth it took was an accident"), so determinism was removed via the review's preferred option: `PRE[1]` set to exactly (0, 0, 0, 0) so the sim's own one-off random-direction velocity fluctuation supplies the seed. Post-fix azimuths: −9.0°, 171.0°, −28.9°, −135.6° (same page) and 1.9°, −157.8°, 91.7° (3 fresh loads); the "vacuum fluctuation — random direction" flash now fires on card 2 as the polish note intended. |
| NP-P2-1 | **CONFIRMED + FIXED** | Screenshot at the PRE[4] rest-at-vacuum state reproduced the garbled "φ/V_min = −1.00" collision at the marker. Fix at `drawStrip`: when the ball's tag x is within 14 px of the V_min marker, the V_min label flips to right-aligned left of the marker. Post-fix screenshots: at-vacuum state fully legible (V_min left, φ right); mid-kick state unchanged (label right of marker as before). |
| NP-P2-2 | **CONFIRMED + FIXED** | The sim's single `<script>` spans lines 553–1525 and `'use strict';` sat after the Shell IIFE closes — a mid-script bare expression statement, so it enables nothing. Line deleted; zero pageerrors after. |
| NP-P1-1 | **ALREADY-RESOLVED** | Fixed by the systemic sweep (SYS-2 variant) before this pass — `onReset` now replays the current card's PRE spec (including `pause`); left alone per instruction. |
