# Physics & Code Review: Quantum Harmonic Oscillator Simulation

## 1. Physics equations and concepts

### 1.1 Wavefunction and normalization — **Correct**

- **Formula (sidebar):** \(\psi_n(x) = \left(\frac{m\omega}{\pi\hbar}\right)^{1/4} \frac{1}{\sqrt{2^n n!}} e^{-\frac{m\omega x^2}{2\hbar}} H_n\!\left(\sqrt{\frac{m\omega}{\hbar}}\,x\right)\)
- **Code:** `alpha = sqrt(m*omega/hbar)`, `normalization = (alpha/π)^(1/4) / sqrt(2^n n!)`, `exponential = exp(-alpha² x²/2)`, `hermite(n, alpha*x)`. Matches the standard QHO eigenstate.

### 1.2 Hermite polynomials — **Correct**

- Recurrence in `hermite()`: \(H_0 = 1\), \(H_1 = 2x\), \(H_n = 2x\,H_{n-1} - 2(n-1)\,H_{n-2}\). Produces correct \(H_2 = 4x^2 - 2\), etc.

### 1.3 Energy levels — **Correct**

- \(E_n = \hbar\omega(n + \tfrac{1}{2})\). Implemented as `hbar * omega * (n + 0.5)`.

### 1.4 Time evolution — **Correct**

- \(\psi_n(x,t) = \psi_n(x)\,e^{-i E_n t/\hbar}\). Phase `-energy*t/hbar`, with `re = base*cos(phase)`, `im = base*sin(phase)`, so \(\psi = \mathrm{re} + i\,\mathrm{im} = \mathrm{base}\,e^{-i E_n t/\hbar}\). Convention is correct.

### 1.5 Superposition — **Correct**

- \(\psi = (\psi_n + \psi_m)/\sqrt{2}\) with equal weights; normalization for two orthogonal eigenstates is correct. Time-dependent probability density for \(n \neq m\) is correct.

### 1.6 Probability density — **Correct**

- \(|\psi|^2 = \mathrm{re}^2 + \mathrm{im}^2\). Stationary state uses `probTime = 0`; superposition uses `time`.

### 1.7 Potential and classical turning points — **Correct**

- \(V(x) = \tfrac{1}{2}m\omega^2 x^2\). Turning points \(x_{\mathrm{tp}} = \pm\sqrt{2E/(m\omega^2)}\) implemented correctly for both energy levels in superposition.

---

## 2. Architecture and flow

- **State:** `n`, `n2`, `useSuperposition`, `scale`, `time`, `animate`, `showReal`, `showImag`.
- **Flow:** Single `requestAnimationFrame` loop updates `time`, then calls `drawWavefunction`, `drawProbability`, `drawPotential`. No side effects inside draw functions other than drawing; time advance is in the loop. Clear separation.
- **Init:** Scale and scale display are synced from the scale slider on load. Scale slider has valid `min="2"`, `max="20"`, `value="4"`.

---

## 3. Front-end visuals and rendering

- **Axes:** Wavefunction plot uses horizontal axis at `height/2` (ψ = 0); probability and potential use baseline at `height - 20`. `drawXAxisTicks` draws ticks at `height - 20` for all three. On the wavefunction panel, x-axis ticks sit at the bottom; consistent with the other two panels but slightly disconnected from the wavefunction zero line (cosmetic).
- **Scaling:** Wavefunction amplitude uses fixed `height/4`; probability uses `prob * height * 0.7`. For large \(n\), \(|\psi|^2\) is more spread and has a lower peak, so the probability curve can look flat (cosmetic only).
- **Parity:** Correctly shows "Mixed" when in superposition with \(n \neq m\), and "Even"/"Odd" for a single eigenstate.
- No `devicePixelRatio` scaling in this file, so no accumulated-transform-on-resize issue.

---

## 4. Bugs and suggested fixes

**Status:** The three bugs below were identified in a previous review and have been **fixed** in the current code.

### 4.1 **FPS can be Infinity when deltaTime is 0 (minor) — FIXED**

- **Where:** `animationLoop()`: FPS was updated when `frameCount % 30 === 0` without checking `deltaTime`.
- **Fix applied:** Only update FPS when `deltaTime > 0 && frameCount % 30 === 0`.

### 4.2 **Phase display ambiguous in superposition (minor) — FIXED**

- **Where:** Phase was always shown as `(time % (2*π)).toFixed(2)`.
- **Fix applied:** When `useSuperposition && n2 !== n`, phase display is set to `"N/A"`; otherwise the single phase is shown.

### 4.3 **Redundant assignment in n-slider handler (cosmetic) — FIXED**

- **Where:** n-slider handler set `currentEnergy` with plain text before `updateStateLabels()`.
- **Fix applied:** Removed the redundant `currentEnergy` assignment; only `updateStateLabels()` updates that element.

**Current review:** No additional bugs were found. Physics, architecture, and rendering remain correct.

---

## 5. Optional improvements (non-bugs)

- **Probability vertical scale:** Scale the probability curve by the max \(|\psi|^2\) over the visible x-range so the fill height is more consistent across different \(n\) and superpositions.
- **Wavefunction vertical scale:** Similarly, scale real/imaginary parts by max magnitude in view for comparable amplitude across states.
- **Wavefunction panel x-axis:** Optionally draw the wavefunction panel’s x-axis and ticks at `height/2` so the x-axis aligns with ψ = 0.

---

## 6. Summary

| Area              | Status | Notes                                                                 |
|-------------------|--------|-----------------------------------------------------------------------|
| Physics equations | OK     | Wavefunction, Hermite, energy, time evolution, superposition, \(V\), turning points all correct. |
| Architecture      | OK     | Single loop, clear state, scale/parity/init fixes applied.           |
| Rendering         | OK     | No transform bugs; axis/scale choices consistent.                     |
| Bugs              | 0      | All three previously identified bugs have been fixed.                 |

No remaining bugs identified in the current code.
