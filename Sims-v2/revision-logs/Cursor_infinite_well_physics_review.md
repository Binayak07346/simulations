# Physics & Code Review: Infinite Potential Well Simulation

## 1. Physics equations and concepts

### 1.1 Wave function and probability density — **Correct**
- **ψₙ(x,t):** ψ = √(2/L) sin(nπx/L) cos(ωt) with k = nπ/L and ω = E/ℏ ∝ n². Matches the standard infinite well eigenstate and time evolution.
- **|ψ|²:** (2/L) sin²(nπx/L). Correct, time-independent for a single eigenstate.
- **Max density:** 2/L. Correct (getMaxProbabilityDensity).

### 1.2 Energy — **Correct**
- **Eₙ:** (n² π² ℏ²)/(2mL²). Implemented correctly in `getEnergy(n)` (not used in UI but correct).
- **ωₙ = Eₙ/ℏ:** Proportional to n²; baseOmega = 1 and ω = n²ω₀ is consistent.

### 1.3 Expectation values and uncertainty — **Correct**
- **⟨x⟩ = L/2:** Displayed as "0.50 L". Correct.
- **⟨p⟩ = 0:** Correct for stationary state.
- **Δx:** σₓ = L√(1/12 − 1/(2n²π²)). Code uses `Math.sqrt(1/12 - 1/(2*n*n*Math.PI*Math.PI))` for L=1. Correct.

### 1.4 Wavelength — **Correct**
- λ = 2L/n for the nth state. Display "2L/n = ... nm" is correct.

---

## 2. Numerical methods

### 2.1 Rejection sampling — **Correct**
- Sampling x in [0,1] (i.e. [0,L]) with pdf ∝ (2/L)sin²(nπx/L). Max of pdf = 2/L; acceptance probability = pdf/(2/L) = sin²(nπx/L) ≤ 1. Code uses `prob/2` with `prob = (2/L)*sin²(...)`, so accept with sin². Correct.

### 2.2 Possible improvement — **Minor**
- For large n, sin²(nπx) has many peaks; uniform proposal gives low acceptance. `maxAttempts = 1000` may occasionally hit the fallback `return 0.5`. Consider increasing `maxAttempts` for n > 5 or using inverse-transform sampling for robustness.

### 2.3 Histogram normalization — **Correct**
- Empirical density: (count/total)/bin_width = (count/total)×numBins/L. Same units as |ψ|². Normalizing so max bar matches curve peak is consistent.

### 2.4 Time stepping — **Correct**
- `time += 0.016` (~60 fps) for animation. Purely visual; no physics time step. Fine.
- Measurement rate uses `performance.now()` and a budget (particles/s × Δt); correct for frame-rate-independent rate.

---

## 3. Architecture and flow

### 3.1 Data flow — **Sensible**
- State: quantumN, time, particleX, particleHistory, histogramBins, totalMeasurements, measurementBudget, lastFrameTime.
- One animation loop: resize → boxes → wave function → probability + histogram → particle (which updates measurements) → energy levels → time step → requestAnimationFrame. Clear.

### 3.2 Side effect in drawParticle — **Design quirk**
- **Issue:** `drawParticle()` both draws and advances physics (measurements, lastFrameTime, measurementBudget). So “draw” has side effects.
- **Suggestion:** Rename to e.g. `updateAndDrawParticle()` or split into `updateMeasurements()` and `drawParticle()` and call both from `animate()`. Improves clarity.

### 3.3 lastFrameTime in drawParticle — **Correct**
- Time delta is computed where the budget is updated; first frame uses 1/60. Correct.

---

## 4. Bugs and mistakes (with suggested fixes)

### 4.1 **BUG: Canvas context scale accumulates on resize (critical)**
- **Where:** `resize()` calls `ctx.scale(window.devicePixelRatio, window.devicePixelRatio)` without resetting the current transform.
- **Effect:** Each window resize adds another scale; drawing coordinates get scaled repeatedly and the layout becomes wrong or disappears.
- **Fix:** Reset the transform before scaling, e.g. immediately before the scale:
  ```js
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ```

### 4.2 **Rendering: Gradient in probability box uses (0, y)**
- **Where:** `createLinearGradient(0, centerY - amplitude, 0, centerY)`.
- **Note:** Gradient is in canvas coordinates. If the context has been scaled by devicePixelRatio, (0, centerY) is still correct in the current transform. No bug if resize is fixed; if you ever draw in a transformed subregion, gradient coordinates would need to be in the same space.

### 4.3 **Edge case: No measurements yet**
- **Where:** `drawHistogram` returns early when `totalMeasurements === 0`. `drawParticle` still runs and can update `particleX` and `particleHistory` from the budget. So the “current” particle position can update even when the histogram is empty. This is acceptable; the only subtlety is that the first time the user enables the histogram they may already have a non-zero count if measurements were running. No code bug.

### 4.4 **Energy level strip vertical scale**
- **Formula:** `y = levelBottom - (energy / (maxLevels*maxLevels)) * (levelBottom - levelTop - 10)`. For n=1..10, energy = 1..100; higher n → higher y. Correct for “E1 at bottom, E10 at top.”

### 4.5 **Node positions for wave function**
- **Where:** Nodes at `boxLeft + (i / quantumN) * boxWidth` for i = 1, 2, ..., quantumN−1. So positions at x/L = 1/n, 2/n, ..., (n−1)/n. Correct for sin(nπx/L) zeros.

---

## 5. Summary table

| Item                         | Status   | Notes |
|-----------------------------|----------|--------|
| ψₙ(x,t), |ψ|², Eₙ, ωₙ           | OK      | Correct formulas. |
| ⟨x⟩, ⟨p⟩, Δx                | OK      | Correct. |
| Rejection sampling          | OK      | Correct; consider stronger robustness for large n. |
| Histogram density & scale  | OK      | Correct normalization. |
| Time-based measurement rate| OK      | Budget and deltaTime correct. |
| Canvas resize scale        | **BUG** | Reset transform before scale. |
| Side effects in drawParticle| Design  | Optional rename/split for clarity. |

---

## 6. Recommended code change (resize fix)

In `resize()`, replace:
```javascript
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
```
with:
```javascript
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
```

This prevents the transformation from accumulating on every resize and fixes incorrect layout/blank or distorted canvas after resizing the window.
