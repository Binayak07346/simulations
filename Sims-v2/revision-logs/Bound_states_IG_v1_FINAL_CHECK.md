# Bound States Simulation — Final Check Report

**File:** `Bound_states_IG_v1 (1).html`  
**Scope:** Physics concepts, equations, numerical methods, architecture, animations/visuals.

---

## 1. Physics concepts — **Correct**

- **Finite square well:** V(x) = 0 for |x| < a, V(x) = V₀ for |x| > a. Bound states have 0 < E < V₀.
- **Dimensionless variables:** ξ = ka, η = κa with k = √(2mE)/ℏ, κ = √(2m(V₀−E))/ℏ. Constraint ξ² + η² = z₀² where z₀ = a√(2mV₀)/ℏ.
- **Transcendental equations:** Even solutions η = ξ tan(ξ); odd solutions η = −ξ cot(ξ). Intersections with the circle ξ² + η² = z₀² in the first quadrant give bound states.
- **Energy:** E = ℏ²k²/(2m) = HBAR2_2M · k² with k = ξ/a.
- **Wavefunctions:** Inside |x| < a: even ψ = A cos(kx), odd ψ = B sin(kx). Outside: exponential decay matched at x = ±a; even ψ(−x) = ψ(x), odd ψ(−x) = −ψ(x).
- **Penetration depth:** δ = 1/κ (displayed correctly).
- **Constant HBAR2_2M:** Documented as pedagogical (0.0381 eV·nm²) so typical a, V₀ give several bound states.

---

## 2. Equations (code vs theory) — **Correct**

| Item | Formula | Code / location |
|------|---------|------------------|
| z₀ | a√(V₀/(ℏ²/2m)) | `a * Math.sqrt(V0 / HBAR2_2M)` (calculateZ0) |
| Even f(ξ) | ξ²(1+tan²ξ) − z₀² | `xi*xi*(1+tanXi*tanXi)-z0*z0` (findIntersection) |
| Odd f(ξ) | ξ²(1+cot²ξ) − z₀² | `xi*xi*(1+cotXi*cotXi)-z0*z0` (findIntersection) |
| η from ξ | ξ tan ξ / −ξ cot ξ | `xi*Math.tan(xi)` / `-xi/Math.tan(xi)` (calculateBoundStates) |
| E | ℏ²k²/(2m) | `HBAR2_2M * k * k`, k = ξ/a |
| κ | η/a | `eta / a` |
| δ | 1/κ | `1 / kappa` |
| ψ inside | cos(kx) / sin(kx) | Math.cos(k*x) / Math.sin(k*x) (drawPhysicalSpace) |
| ψ outside x>a | ψ(a) e^{-κ(x−a)} | psiAtBoundary * Math.exp(-kappa*(x-a)) |
| ψ outside x<−a (even) | ψ(a) e^{-κ(−x−a)} | psiAtBoundary * Math.exp(-kappa*distFromWall) |
| ψ outside x<−a (odd) | −ψ(a) e^{-κ(−x−a)} | -psiAtBoundary * Math.exp(-kappa*distFromWall) |

Branch ranges: even ξ ∈ [nπ, (n+½)π]; odd ξ ∈ [(n−½)π, nπ] (n ≥ 1). Implemented correctly.

---

## 3. Numerical methods — **Correct**

- **Bisection:** findIntersection uses bisection on f(ξ) with 50 iterations, tolerance 1e-10, bracket [xiMin, xiMax] with 0.001 inset from asymptotes. Guards for non-finite fLo/fHi (return null).
- **Branch loop:** maxBranches = ceil(z₀/(π/2)) + 2; loop breaks when xiMin ≥ z₀; xiMax clamped to z₀ − 0.001.
- **Post-solution:** η derived from ξ so (ξ,η) lies on the circle; no inconsistency.
- **Dynamic view bounds:** targetMaxXi / targetMaxEta from z₀ with padding; targetMaxXi rounded to π/2 multiples. Smoothing in drawMathSpace (factor 0.08) for currentZ0, currentMaxXi, currentMaxEta.

No issues found.

---

## 4. Architecture and flow — **Correct**

- **Init:** Canvas/context null checks → resizeCanvases → setupControls, setupInfoPopover, setupMaximizeButtons → calculateBoundStates → renderLatexFormulas → animate.
- **Controls:** Sliders and parity/reset update V₀, a, showEven and call calculateBoundStates(), which recomputes targetZ0, boundStates, and view bounds, then updateInfoPanel().
- **Animation:** animate() advances animationTime (bounded modulo 2π), calls drawPhysicalSpace() and drawMathSpace(), then requestAnimationFrame(animate). No physics state is updated in the draw loop; only rendering and smooth view parameters.
- **Maximize:** maximizedPanel toggles null / 'physical' / 'math'; updateMaximizeUI() updates container classes and calls resizeCanvases() so visible canvas(es) get correct size.
- **Resize:** resizeCanvases() guards for missing canvas/context/panels; sets canvas dimensions from parent client size × devicePixelRatio; setTransform then scale for HiDPI.

Flow is clear and consistent.

---

## 5. Front-end / animations / visuals — **Checked**

- **Physical panel:** Axes, V(x) step at ±a, well fill, energy lines and ψ(x) with waveScale = V₀×0.12; continuity and parity at ±a correct. X-range ±3a, V-range includes 0 and V₀.
- **Math panel:** Quarter circle ξ²+η² = z₀²; tan/cot curves; asymptotes; intersection points with hover; grid and axis labels. Glow uses animationTime (bounded).
- **Hover:** handleMathCanvasHover uses logical size (canvas size / dpr) and scales event coordinates; guards for currentMaxXi/currentMaxEta ≤ 0.
- **Panel header:** Title and maximize button; pointer-events so button remains clickable.

---

## 6. Bug found and fix applied

### Zero-size canvas when one panel is maximized

- **Issue:** When the math (resp. physical) panel is maximized, the physical (resp. math) panel has `display: none`, so its parent’s clientWidth/clientHeight are 0. resizeCanvases() then sets that canvas to 0×0. drawPhysicalSpace() and drawMathSpace() still ran with w = 0, h = 0, giving negative plotW/plotH and unnecessary work (and potential edge-case behavior in some environments).
- **Fix applied:** At the start of drawPhysicalSpace() and drawMathSpace(), after computing w and h, add:
  - `if (w <= 0 || h <= 0) return;`
  - Use `(window.devicePixelRatio || 1)` when computing w, h so a zero or undefined devicePixelRatio does not produce Infinity.

**Location:** drawPhysicalSpace (lines ~1024–1028), drawMathSpace (lines ~1201–1206).

---

## 7. Summary

| Area | Status |
|------|--------|
| Physics concepts | Correct |
| Equations (z₀, ξ, η, E, κ, δ, ψ) | Correct |
| Numerical methods (bisection, branches) | Correct |
| Architecture and data flow | Correct |
| Animations and rendering | Correct; one robustness fix applied (zero-size canvas + dpr guard) |

No further physics or rendering bugs were found. The simulation is consistent and correct; the only change made was the zero-size canvas guard and devicePixelRatio fallback in the draw functions.
