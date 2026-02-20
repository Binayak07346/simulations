---
name: A(k) vs k physics review
overview: A code and physics review of the A(k) vs k Gaussian momentum simulation, covering equations, numerics, architecture, rendering, and a list of bugs with suggested fixes.
todos: []
isProject: false
---

# A(k) vs k Plot Simulation — Physics and Code Review

## 1. Physics concepts and equations

**Gaussian amplitude A(k)**  
The implementation uses the standard normalized form:

- **Formula:** A(k) = (2\pi\sigma^2)^{-1/4} \exp[-(k-k_0)^2/(4\sigma^2)]
- **Code:** [A(k)-vs-k-plot.html](simulations/Sims-v2/A(k)-vs-k-plot.html) lines 564–568: `norm = (2*π*σ²)^{-1/4}`, exponent `-(k-k₀)²/(4σ²)`. **Correct.**

**Normalization**  
|A(k)|^2 integrates to 1 over k, so the (2\pi\sigma^2)^{-1/4} factor is correct for a normalized momentum-space amplitude. **Correct.**

**FWHM (full width at half maximum)**  

- **Physics:** A(k) = A(k_0)/2 \Rightarrow (k-k_0)^2/(4\sigma^2) = \ln 2 \Rightarrow \mathrm{FWHM} = 4\sigma\sqrt{\ln 2}.
- **Code:** line 797: `fwhmActual = 4 * sigma * Math.sqrt(Math.log(2))`. **Correct.**

**1/e² width (amplitude)**  

- **Physics:** Width where A(k) = A(k_0)/e^2 \Rightarrow (k-k_0)^2/(4\sigma^2) = 2 \Rightarrow full width = 4\sqrt{2}\sigma.
- **Code:** line 829: `w1e2 = 2 * 2 * Math.sqrt(2) * sigma`. **Correct.**  
- **Note:** The label “1/e² Width” is ambiguous (amplitude vs intensity); the code implements the amplitude definition.

**±σ and ±2σ regions**  

- **Physics:** 68.27% and 95.45% are the fractions of \int |A(k)|^2dk in [k_0-\sigma,k_0+\sigma] and [k_0-2\sigma,k_0+2\sigma].
- **Implementation:** Shading is under **A(k)** (amplitude), not |A(k)|^2. So the drawn areas are \int A(k)dk over those intervals, **not** the probabilities that justify 68.27% / 95.45%. **Bug:** the UI implies those percentages apply to the shaded regions; they do not.

---

## 2. Numerical methods

- **Curve sampling:** Gaussian and shaded regions use uniform k steps (600 and 300 steps). No integration or ODEs; only evaluation of the closed-form A(k). Adequate for plotting.
- **Coordinate mapping:** Linear map k \in [K_{\min}, K_{\max}] \to x, a \in [0, A_{\max}] \to y. No numerical issues.
- **No time evolution:** This is a static (in the physics sense) distribution; sliders only change parameters. No numerical stability concerns.

---

## 3. Architecture and flow

```mermaid
flowchart LR
  subgraph inputs [Inputs]
    k0Slider[k0 slider]
    sigmaSlider[sigma slider]
    probeSlider[probe slider]
    toggles[Toggles]
  end
  subgraph state [State]
    k0[k0 sigma probeK]
    flags[showProbe showShading showAnnotations]
  end
  subgraph draw [Draw loop]
    draw[draw]
    grid[drawGrid]
    shade[drawShadedRegions]
    curve[drawGaussianCurve]
    pulse[drawPeakPulse]
    particles[drawGlowingParticles]
    annotations[drawAnnotationMarkers]
    probe[drawProbeLine]
    axes[drawAxes]
  end
  inputs --> state
  state --> draw
  draw --> grid --> shade --> curve --> pulse --> particles --> annotations --> probe --> axes
```



- **Single IIFE:** Canvas, state, and draw loop live in one closure; no separate “physics engine” module.
- **Draw order:** Grid → shaded regions → Gaussian curve → peak pulse → particles → annotations → probe line → axes. Order is correct (axes on top, curve and shading below).
- **Resize:** `resize()` sets canvas size and `ctx.setTransform(dpr,0,0,dpr,0,0)` for sharpness; plot layout uses `container.clientWidth/Height` (CSS pixels). Mouse coordinates use `getBoundingClientRect()`; with this transform, context and CSS coordinates match, so **no DPI bug** in hit-testing or probe drag.

---

## 4. Front-end animations and rendering

- **Peak pulse:** `drawPeakPulse()` uses `animPhase` and a sine wave for radius and alpha. Purely cosmetic; no physics.
- **Glowing particles:** 20 particles with phases; k is sampled linearly in [k_0-6\sigma, k_0+6\sigma] with a sinusoidal t; height uses `gaussian(pk, k0, sigma)`. Rendered only when p_a \ge 0.001 and within plot horizontal bounds. **Correct** for a decorative effect.
- **Probe tooltip:** Horizontal flip when near the right edge (line 941) is implemented. **Missing:** when the probe is near the top, `tooltipY = probeY - 10` can place the tooltip box above the plot (box top = `tooltipY - 14`); no vertical clamping.
- **1/e² annotation:** Only drawn when both endpoints are inside the plot (lines 837–858). Reasonable.

---

## 5. Bugs and suggested fixes


| #     | Bug                                   | Location / cause                                                                                                     | Suggested fix                                                                                                                                                                                          |
| ----- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | **68.27% / 95.45% labels misleading** | Shading is under A(k); percentages refer to \int                                                                     | A(k)                                                                                                                                                                                                   |
| **2** | **First-frame animation jump**        | `lastTime` starts at 0; first frame uses `dt = (timestamp - 0)/1000`, which can be large and makes `animPhase` jump. | At the start of `animate()`, use: `if (lastTime === 0) lastTime = timestamp;` then compute `dt = (timestamp - lastTime) / 1000` and set `lastTime = timestamp`.                                        |
| **3** | **Probe tooltip can go above plot**   | `tooltipY = probeY - 10`; box top is `tooltipY - 14`. For probe near top, box extends above `plotTop`.               | Clamp tooltip vertical position so the tooltip rectangle stays inside the plot: e.g. ensure `tooltipY - 14 >= plotTop` (place box below point if needed), and optionally `tooltipY + 8 <= plotBottom`. |
| **4** | **1/e² label ambiguity**              | “1/e² Width” can mean amplitude or intensity; code uses amplitude definition.                                        | Add a short tooltip or modal sentence: e.g. “Width where amplitude A(k) falls to 1/e² of its peak.”                                                                                                    |


---

## 6. Summary

- **Physics and formulas:** Gaussian A(k), normalization, FWHM, and 1/e² (amplitude) width are implemented correctly.
- **Numerics:** Only closed-form evaluation and linear mapping; no issues.
- **Architecture:** Simple, single-file draw loop; coordinate and DPI handling are consistent.
- **Rendering:** Draw order and clipping are fine; only the probe tooltip needs vertical clamping.
- **Bugs to fix:** (1) Clarify or correct the 68.27% / 95.45% labeling vs amplitude shading; (2) fix first-frame `dt` to avoid animation jump; (3) clamp probe tooltip vertically; (4) optionally clarify “1/e² Width” in the UI or modal.

