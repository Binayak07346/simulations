# Line-by-Line Code Review: infinite-potential-well.html

## Summary of issues found

| # | Location | Severity | Description |
|---|----------|----------|--------------|
| 1 | 699 | Minor | Unused parameter `label` in `drawBox()` |
| 2 | 597, 1145–1156, 1192–1212 | Minor | `particleX` not reset when changing n or on Reset |
| 3 | 1145–1156 | Minor | Changing n doesn’t call `updateStats()` (one-frame lag in panel) |
| 4 | 688 | Minor | DOM updated in `addToHistogram()` every measurement (can be batched) |
| 5 | 1081 | Edge | `deltaX` formula: for very large n, 1/12 - 1/(2n²π²) could theoretically go negative; safe for n=1–10 |
| 6 | 666–682 | Minor | Rejection sampling fallback returns 0.5 after maxAttempts; could increase maxAttempts for high n |
| 7 | 1144, 1158, 1165 | Style | `parseInt(e.target.value)` — prefer `parseInt(e.target.value, 10)` |
| 8 | 619 | Edge | `toSubscript(2.5)` would yield undefined for '.'; quantumN is always integer from slider |

---

## Section-by-section review

### Lines 1–430: HTML & CSS
- **1–5:** DOCTYPE, html, head, title — correct.
- **6–430:** Styles: no issues found. Layout, panels, sliders, buttons, legend all consistent.

### Lines 431–583: HTML body (structure)
- **478:** `id="quantumN"` min=1 max=10 — correct.
- **492:** Speed min=0 max=1000 value=100; when 100, display 1.00ω₀ — correct.
- **505:** Measurement rate min=1 max=25 value=10 — correct.
- **541:** Eigenstate section uses `<sub id="eigenN">1</sub>` — updated by JS; correct.
- **545:** Initial waveEq "√(2/L) sin(πx/L)" — correct for n=1 (π = 1π).

### Lines 584–631: Script start, state, resize
- **590:** `canvas` and `ctx` — assume script runs after DOM; no defer/async, so OK.
- **592–593:** `width, height` — set in `resize()` before first `animate()`; OK.
- **620–621:** `toSubscript(num)`: works for integers 0–9 and 10 (₁₀). Non-integer or negative could give undefined; not used that way.
- **625–629:** `resize()`: `setTransform` before `scale` prevents accumulation — correct (already fixed in earlier review).

### Lines 632–696: Physics and histogram logic
- **632–634:** `getEnergy(n)` — correct formula; never called (normalized energy used in UI); dead code, harmless.
- **637–645:** `getEffectiveOmega(n)` — correct; override and physical modes.
- **647–653:** `waveFunction(x, n, t)` — ψ = √(2/L) sin(kx) cos(ωt); correct.
- **655–658:** `probabilityDensity(x, n)` — (2/L) sin²(kx); correct.
- **661–664:** `getMaxProbabilityDensity(n)` — 2/L; correct.
- **666–682:** `sampleParticlePosition()` — rejection sampling with max 2/L; accept with prob/2 = sin²; correct. Fallback 0.5 after 1000 attempts; for high n consider more attempts.
- **684–690:** `addToHistogram(x)` — bin index from `x*numBins`, clamped to numBins-1; correct. DOM update every call (see fix 4).
- **692–696:** `clearHistogram()` — resets bins and totalMeasurements; correct.

### Lines 698–771: drawBox, drawWaveFunction
- **699:** `drawBox(..., label, isWaveFunction)` — `label` never used (always passed `''`). Minor: remove or use.
- **770:** Node x: `boxLeft + (i / quantumN) * boxWidth` — nodes at x/L = i/n, i=1..n-1; correct.

### Lines 813–896: drawProbabilityDensity, drawParticle
- **891:** `createLinearGradient(0, centerY - amplitude, 0, centerY)` — vertical gradient in canvas coords; fill path uses it; OK.
- **902–904:** `deltaTime`: first frame uses 1/60; `lastFrameTime` set in drawParticle; OK.
- **906–916:** Measurement budget and while loop — correct.
- **922:** `particleHistory[i] * boxWidth` — history is normalized [0,1]; correct.
- **929:** `particleScreenX` — uses current `particleX`; if no measurement yet or after reset/n change, particleX can be stale (see fix 2).

### Lines 961–1003: drawEnergyLevels
- **976–977:** y = levelBottom - (energy/100)*(levelBottom - levelTop - 10); E1 at bottom, E10 at top; correct.
- **977:** The `-10` gives padding; OK.

### Lines 1005–1096: update* functions
- **1024:** `omegaValue` when override: uses (animationSpeed/100).toFixed(2); speed 0→0.00, 100→1.00; correct.
- **1081:** Δx = √(1/12 − 1/(2n²π²)); correct for L=1. Safe for n=1..10.

### Lines 1098–1141: animate
- **1100–1101:** `fillRect(0,0,width,height)` — width/height set by resize(); OK.
- **1119–1126:** drawBox called with empty string for label; correct.
- **1135–1138:** time += 0.016; updateStats(); requestAnimationFrame(animate); OK.

### Lines 1143–1218: Event listeners and init
- **1144:** `quantumN = parseInt(e.target.value)` — no radix; suggest 10. When n changes we don’t reset particleX or call updateStats() (fixes 2 and 3).
- **1172:** `e.target.classList.toggle('active', overrideFrequency)` — e.target is the toggle div; correct.
- **1192–1212:** Reset: doesn’t set particleX = 0.5 or lastFrameTime (lastFrameTime null is intentional for next delta); particleX should be reset (fix 2).
- **1214–1218:** Init order: resize, updateSpeedSliderState, updateEigenstateInfo, updateHistogramButton, animate; OK.

---

## Recommended fixes (applied in code)

1. **Reset particleX** when changing energy level n and on Reset, so the dot isn’t left at a position from the previous state.
2. **Call updateStats()** in the quantumN input handler so Current State and Quantum Statistics update immediately.
3. **Batch measurement count update**: update the “Measurements” DOM element once per frame after the measurement loop in drawParticle, and remove the update from addToHistogram (optional; improves performance when many measurements per frame).
4. **parseInt(..., 10)** in slider handlers for clarity and safety.
