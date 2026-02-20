---
name: Time Evolution QHO Review
overview: A thorough review of the Time_evolution_QHO_v2.html simulation identified several physics bugs (wrong coherent width, double-omega in time evolution, static ellipse for squeezed state), one rendering quirk, and clear suggested fixes. The overall architecture and flow are sound.
todos: []
isProject: false
---

# Time Evolution QHO Simulation – Physics and Code Review

## Scope

Review covered: physics equations and concepts, numerical methods, physics-engine flow, front-end rendering, and animation. No edits were made (plan mode).

---

## 1. Architecture and data flow

The simulation is a single-file HTML app with a clear structure:

- **State**: `omega`, `x0`, `sigma`, `sigma0`, `time`, `isPlaying`, `showClassical`.
- **Time variable**: The animation loop does `time += deltaTime * omega`, so `**time` is phase in radians** (ω·t_physical), not physical time in seconds.
- **Physics functions**: `getExpectationX(t)`, `getExpectationP(t)`, `getWidthAtTime(t)`, `getMomentumWidthAtTime(t)` take this phase and drive both the main canvas (position/wave packet/classical particle) and the phase-space canvas (ellipse and classical orbit).
- **Rendering**: One animation frame calls `draw()` (main canvas: grid, potential, wave function, classical particle, labels) and `drawPhaseSpace()` (phase-space canvas). No separate numerical integrator; all dynamics are closed-form.

Flow is consistent; the only issues are **incorrect use of the phase `t**` in the physics functions (see bugs below).

---

## 2. Physics equations – what’s correct

- **Potential**: `V(x) = 0.5 * omega * omega * x * x` — correct for QHO with m = 1 (`V = (1/2)mω²x²`).
- **Expectation values** (formulas): ⟨x⟩ = x₀ cos(ωt), ⟨p⟩ = −ω x₀ sin(ωt) with m = 1 are correct.
- **Width evolution** (structure): σₓ²(t) = σ² cos²(ωt) + (σ₀⁴/σ²) sin²(ωt) and the corresponding σₚ(t) expression are the right form for a Gaussian in the QHO.
- **Gaussian**: `gaussian(x, mean, width)` is a correctly normalized probability density (integral 1).
- **Classical orbit**: Phase-space trajectory (x₀ cos(θ), −ω x₀ sin(θ)) and drawing the classical particle at (x, V(x)) on the potential are correct.
- **Velocity arrow**: Horizontal arrow for ⟨p⟩ on the (x, V(x)) plot is correct (motion is along x).

---

## 3. Bugs and suggested fixes

### Bug 1: Wrong coherent-state width (physics)

**Location**: [Time_evolution_QHO_v2.html](simulations/Sims-v2/Time_evolution_QHO_v2.html) (e.g. lines 576–577, 610).

**Issue**: With ℏ = m = 1, the coherent-state width is σ₀ = √(ℏ/(2mω)) = **1/√(2ω)**. For ω = 1 this is 1/√2 ≈ **0.707**, not 0.50. Using `COHERENT_WIDTH = 0.50` makes “coherent” mode use the wrong width and misstates the formula in the UI.

**Fix**:

- Define coherent width from ω, e.g. `function getCoherentWidth() { return 1 / Math.sqrt(2 * omega); }`, and use that wherever the coherent width is needed (including σ₀ in width-evolution formulas).
- If ω is fixed at 1, at minimum set `COHERENT_WIDTH = 1/Math.sqrt(2)` (≈ 0.707) and use it consistently; update the KaTeX formula and any “0.50” text in the About section to show the correct value (and ideally the symbolic expression).

---

### Bug 2: Time argument treated as physical time (double-omega)

**Location**: [Time_evolution_QHO_v2.html](simulations/Sims-v2/Time_evolution_QHO_v2.html) — `getExpectationX`, `getExpectationP`, `getWidthAtTime`, `getMomentumWidthAtTime` (lines 647–672), and ellipse rotation (line 947).

**Issue**: The variable `time` is **phase** (ω·t_physical). The physics functions receive this phase but use **ω·t** again:

- `getExpectationX(t)`: uses `Math.cos(omega * t)` → effectively cos(ω²·t_phys). Should be cos(ω·t_phys) = cos(phase) = **cos(t)**.
- `getExpectationP(t)`: uses `Math.sin(omega * t)` → same; should use **sin(t)** (and keep the −ω·x₀ factor).
- `getWidthAtTime(t)` and `getMomentumWidthAtTime(t)`: use `cos(omega*t)`, `sin(omega*t)`; should use **cos(t)** and **sin(t)**.
- Ellipse rotation: `rotationAngle = -omega * time` → rotation at ω²·t_phys; should be **−time** (rotation at ω).

For ω = 1 the motion looks correct by accident; for any ω ≠ 1 the period and breathing would be wrong.

**Fix**:

- In **getExpectationX(t)**: use `return x0 * Math.cos(t);`
- In **getExpectationP(t)**: use `return -omega * x0 * Math.sin(t);`
- In **getWidthAtTime(t)** and **getMomentumWidthAtTime(t)**: replace `Math.cos(omega * t)` and `Math.sin(omega * t)` with `Math.cos(t)` and `Math.sin(t)`.
- In **drawUncertaintyEllipse**: set `rotationAngle = -time` (not `-omega * time`).

---

### Bug 3: Phase-space ellipse for squeezed state uses fixed axes

**Location**: [Time_evolution_QHO_v2.html](simulations/Sims-v2/Time_evolution_QHO_v2.html) (lines 941–952).

**Issue**: For the squeezed state, the uncertainty ellipse is drawn with **constant** semi-axes `a = sigma * scale` and `b = (sigma0*sigma0/sigma)*omega*scale` and only rotation changes. Physically, σₓ(t) and σₚ(t) **both** change with time (“breathing”), so the ellipse should change shape as well as rotate.

**Fix**:

- For the squeezed branch, set axes from the time-dependent widths already computed:
  - `a = sigmaX * scale` (with `sigmaX = getWidthAtTime(time)` from line 932),
  - `b = sigmaP * scale` (with `sigmaP = getMomentumWidthAtTime(time)` from line 933),
  and keep `rotationAngle = -time` (after fixing Bug 2). Remove the fixed `a`/`b` formulas in the squeezed branch so the ellipse breathes correctly.

---

### Bug 4: Potential path stroked twice

**Location**: [Time_evolution_QHO_v2.html](simulations/Sims-v2/Time_evolution_QHO_v2.html) (lines 658–669).

**Issue**: After `ctx.stroke()` (line 664), the same path is stroked again with different style (lines 666–669). The second stroke has no new path, so it re-strokes the same curve. This is likely intended as a “thick outline” effect but is fragile (depends on path not being cleared).

**Fix**: Either start a new path and redraw the potential for the thick stroke, or use a single stroke with the desired visual (e.g. one lineWidth). If keeping two strokes, call `ctx.beginPath()` and redraw the curve before the second `ctx.stroke()` so behavior is well-defined.

---

### Bug 5: Coherent-width tolerance and UI consistency

**Location**: [Time_evolution_QHO_v2.html](simulations/Sims-v2/Time_evolution_QHO_v2.html) (e.g. 643, 561, 514).

**Issue**: `isCoherentState()` uses `Math.abs(sigma - COHERENT_WIDTH) < 0.001`. If COHERENT_WIDTH is changed to 1/√(2ω), the slider and “Snap to Coherent” should set σ to that value, and the UI text (e.g. “σ = 0.50”) and sigma display should reflect the actual coherent width so the user sees a consistent “exactly coherent” state.

**Fix**: Use the same computed coherent width (e.g. `getCoherentWidth()`) for the constant, the snap button, the tolerance in `isCoherentState()`, and all UI strings that refer to the coherent value. Show the symbolic formula and the numeric value (e.g. for current ω) in the About section.

---

## 4. Numerical methods

There is **no numerical integration**: expectation values and widths are **closed-form** expressions in t. The only “numerics” are:

- **Animation time**: `time += deltaTime * omega` (Euler in phase). For smooth 60 fps this is fine; no stability issues.
- **Gaussian and potential**: Evaluated per pixel/sample; no iteration.

So there are no numerical-method bugs; fixing the use of `t` (phase vs ω·t) is the main correction.

---

## 5. Rendering and visuals

- **Coordinate transforms**: `physicsToCanvas` and `phaseToCanvas` are consistent (x right, y up in physics; canvas y flipped). Scale factors (e.g. `size.width/12`, `size.height/8`) are fixed but reasonable for the chosen x/V range.
- **Device pixel ratio**: Canvas size and `ctx.scale(devicePixelRatio, devicePixelRatio)` are set in `resizeCanvas()`; setting `canvas.width`/`height` resets the context, so scale does not compound. `getCanvasSize()` correctly returns logical size.
- **Wave function**: Drawn as a filled shape plus outline; vertical scale uses a fixed factor (2.5) for visibility — no physics error.
- **Phase-space ellipse**: Contours and dashed axes are clear; after fixing Bugs 2 and 3, the ellipse will both rotate and breathe correctly for squeezed states.
- **Velocity arrow**: Direction and horizontal placement are correct; arrowhead logic (dir, length > 5) is fine.

The only rendering issue noted is the double stroke on the potential (Bug 4).

---

## 6. Summary table


| Item                      | Severity | Description                                                               |
| ------------------------- | -------- | ------------------------------------------------------------------------- |
| Coherent width 0.50       | High     | Wrong value; should be 1/√(2ω) (≈0.707 for ω=1).                          |
| Double-omega in time      | High     | `time` is phase; functions use ω·t again → wrong period/breathing if ω≠1. |
| Static ellipse (squeezed) | Medium   | Ellipse should use time-dependent σₓ, σₚ for breathing.                   |
| Potential double stroke   | Low      | Same path stroked twice; clarify or redraw for second stroke.             |
| UI/formula coherence      | Low      | After fixing width, update all “0.50” and formula display.                |


---

## 7. Recommended implementation order

1. Fix time semantics: use phase `t` (not `omega*t`) in all four physics functions and in ellipse rotation (Bug 2).
2. Set coherent width to 1/√(2ω) and use it everywhere (Bugs 1 and 5).
3. Use time-dependent `sigmaX` and `sigmaP` for the squeezed-state ellipse (Bug 3).
4. Clean up potential drawing (single or explicit double path) (Bug 4).

After these changes, the simulation will be correct for arbitrary ω, the phase-space ellipse will breathe for squeezed states, and the UI will consistently reflect the coherent state width.