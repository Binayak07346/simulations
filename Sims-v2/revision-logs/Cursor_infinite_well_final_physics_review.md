# Final Physics, Architecture & Flow Review: Infinite Potential Well

## 1. Physics equations and concepts

### 1.1 Setup (infinite square well [0, L])
- Well: V = 0 for 0 < x < L, V = ∞ otherwise.
- Normalization: ℏ = 1, m = 1, L = 1 throughout.

### 1.2 Stationary eigenstates
- **Spatial wave function:** ψₙ(x) = √(2/L) sin(nπx/L), x ∈ [0, L].
- **Code:** `spatial = Math.sqrt(2/L) * Math.sin(k*x)` with `k = n*Math.PI/L`. **Correct.**

### 1.3 Energy
- **Formula:** Eₙ = (n² π² ℏ²) / (2m L²). With ℏ = m = L = 1: Eₙ = n² π²/2.
- **Code:** `getEnergy(n)` returns exactly that. **Correct.**
- **UI:** Displays energy as E/E₁ = n² (normalized). **Consistent.**

### 1.4 Time dependence
- **Exact:** ψₙ(x,t) = ψₙ(x) e^{-i Eₙ t/ℏ} ⇒ real part = ψₙ(x) cos(ωₙ t), with ωₙ = Eₙ/ℏ.
- **Code:** ψ(x,t) = √(2/L) sin(kx) · cos(ωt), with ω = `getEffectiveOmega(n)`.
- **Physical mode:** ω = n² × baseOmega (baseOmega = 1), so ω ∝ n². Ratios ωₙ/ω₁ = n² are correct; time is in dimensionless units. **Correct.**
- **Override mode:** ω set by slider (0–10ω₀) for animation only. **Consistent.**

### 1.5 Probability density
- **Formula:** |ψₙ|² = (2/L) sin²(nπx/L); max = 2/L.
- **Code:** `probabilityDensity(x, n)` and `getMaxProbabilityDensity(n) = 2/L`. **Correct.**

### 1.6 Expectation values and uncertainty
- **⟨x⟩:** L/2 for all n. UI shows "0.50 L". **Correct.**
- **⟨p⟩:** 0 for stationary state. UI shows "0.00 ℏ/L". **Correct.**
- **⟨x²⟩:** L²(1/3 − 1/(2n²π²)).
- **σₓ² = ⟨x²⟩ − ⟨x⟩²:** σₓ² = L²(1/12 − 1/(2n²π²)) ⇒ σₓ = L√(1/12 − 1/(2n²π²)).
- **Code:** `Math.sqrt(1/12 - 1/(2*n*n*Math.PI*Math.PI))` for L = 1. **Correct.**
- For n = 1, σₓ ≈ 0.18 L; UI shows "0.18 L". **Correct.**

### 1.7 Wavelength
- **Formula:** For mode n, λ = 2L/n (half-wavelength of sin). UI "2L/n = 2.00" for n = 1, L = 1. **Correct.**

---

## 2. Numerical methods

### 2.1 Rejection sampling (position measurement)
- **Target pdf (in x):** p(x) = (2/L) sin²(nπx/L), x ∈ [0, L]; max = 2/L.
- **Code:** Samples u ∈ [0, 1] (so x = u·L), accepts with probability `prob/2` where `prob = (2/L) sin²(nπu)` ⇒ accept with sin²(nπu) ≤ 1. So the accepted distribution is proportional to the correct pdf. **Correct.**

### 2.2 Histogram as density
- **Bin i:** covers [i/numBins, (i+1)/numBins] in normalized [0, 1] (i.e. width L/numBins in x).
- **Empirical density:** (count_i / totalMeasurements) / (L/numBins) = (count_i/total)·numBins/L. Same units as |ψ|². **Correct.**
- **Normalization:** Bars scaled so max bar height matches max of curve (scale = maxProbDensity / maxEmpiricalDensity). **Correct.**

### 2.3 Time stepping
- **Code:** `time += 0.016` when running (~60 fps). Purely for phase ωt; no numerical integrator. **Appropriate.**

### 2.4 Measurement rate (particles/s)
- **Code:** `measurementBudget += rate * deltaTime` with `deltaTime` from `performance.now()`. When budget ≥ 1, perform one measurement and subtract 1. **Correct** and frame-rate independent.

---

## 3. Architecture and data flow

### 3.1 State variables
- **Physics:** quantumN, time, L (const), hbar, m, baseOmega.
- **Override:** overrideFrequency, animationSpeed.
- **Measurement:** particleX, particleHistory, histogramBins, totalMeasurements, measurementRateParticlesPerSecond, measurementBudget, lastFrameTime.
- **UI:** showHistogram, animationRunning.

### 3.2 Frame flow (animate)
1. Clear canvas.
2. Compute layout (margins, box sizes).
3. **drawBox** (wave) → **drawWaveFunction(waveBox)** (uses time, quantumN).
4. **drawBox** (prob) → **drawProbabilityDensity(probBox)** → **drawHistogram(probBox)** then draw |ψ|² curve.
5. **drawParticle(probBox, particleY):** updates lastFrameTime, measurementBudget; may run measurement loop (sampleParticlePosition, addToHistogram), updates measurement count DOM; draws particle and trail.
6. **drawEnergyLevels(waveBoxTop, waveBoxBottom).**
7. If animationRunning: time += 0.016.
8. updateStats() (all panels).
9. If animationRunning: requestAnimationFrame(animate).

**Assessment:** Order is correct. One design choice: **drawParticle** both advances measurement state and draws; the coupling is clear and acceptable.

### 3.3 Pause/Resume
- **Pause:** animationRunning = false ⇒ no further requestAnimationFrame; time and drawing stop. **Correct.**
- **Resume:** lastFrameTime = null, requestAnimationFrame(animate) ⇒ first frame uses deltaTime ≈ 1/60. **Correct.**

### 3.4 Event handling
- **quantumN:** Updates n, resets particleX, history, histogram, measurement rate, then updateEigenstateInfo + updateStats. **Correct.**
- **Reset:** Restores all state and UI; sets animationRunning = true and Pause button. **Correct.**

---

## 4. Drawing and visualization

### 4.1 Wave function
- **Plot:** ψ(x,t) at x = (i/points)·L, screenY = centerY − ψ·amplitude·0.7. Vertical scale is arbitrary; shape and nodes are correct. **Correct.**

### 4.2 Nodes
- **Positions:** sin(nπx/L) = 0 at x/L = 1/n, 2/n, …, (n−1)/n. **Code:** `nodeX = boxLeft + (i/quantumN)*boxWidth`, i = 1,…, quantumN−1. **Correct.**

### 4.3 Energy strip
- **Scale:** y ∝ n², E1 at bottom, E10 at top. **Correct.**

### 4.4 Canvas resize
- **Code:** `ctx.setTransform(1,0,0,1,0,0)` then `ctx.scale(devicePixelRatio, devicePixelRatio)`. Prevents scale accumulation. **Correct.**

---

## 5. Summary: mistakes and minor notes

| Item | Status |
|------|--------|
| ψₙ(x), |ψₙ|², Eₙ, ωₙ, k | **Correct** |
| Time dependence (real part cos(ωt)) | **Correct** |
| ⟨x⟩, ⟨p⟩, σₓ formula and code | **Correct** |
| Rejection sampling (accept prob, max) | **Correct** |
| Histogram density and normalization | **Correct** |
| Measurement rate (time-based budget) | **Correct** |
| Node positions, energy strip, resize | **Correct** |
| getEnergy(n) | **Unused** (dead code); no impact. |
| “Time (phase)” in UI | **Correct** (it is ωt phase). |

**Conclusion:** No physics, numerical, or architectural mistakes were found. The simulation is consistent with the infinite square well in normalized units. The only optional cleanup is removing or using `getEnergy(n)` if you want to show energy in physical units (e.g. E₁ = π²/2) somewhere.
