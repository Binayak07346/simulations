# Bound States Simulation — Line-by-Line Bug Report

**File:** `Bound_states_IG_v1 (1).html`  
**Scope:** Full code review (HTML, CSS, JavaScript). Bugs listed with severity and suggested fixes.

---

## 1. **Null / missing element checks (init, setupInfoPopover, setupControls)**

**Location:** Lines 580–583, 596–597, 621–632, 649–654, 657, 663, 693–694, 834, 836.

**Issue:** `document.getElementById(...)` and `physCanvas.getContext('2d')` are used without null checks. If an ID is changed, removed, or the script runs in an environment where an element is missing, or canvas 2D is unavailable, the code will throw and the simulation will not run.

**Suggested fix:**
- In `init()`, after getting canvas and context:
  - If `physCanvas == null || mathCanvas == null`, log an error and return (or show a message).
  - If `physCtx == null || mathCtx == null`, treat as no canvas support and exit or show fallback.
- In `setupInfoPopover()`, guard: `if (!trigger || !popover) return;` before adding listeners.
- In `renderLatexFormulas()`, either guard each `getElementById` and only call `katex.render` when the element exists, or wrap in `if (typeof katex !== 'undefined') { ... }` and check for formula elements to avoid throwing if KaTeX failed to load or IDs change.
- In `setupControls()`, check that v0Slider, aSlider, evenBtn, oddBtn, resetBtn exist before attaching listeners and before using `document.getElementById('v0Value')` / `'aValue'` in handlers.
- In `updateInfoPanel()`, check that `document.getElementById('nStates')` and `document.getElementById('energyList')` exist before using them.

**Severity:** Low under normal use; Medium if the page is ever refactored or embedded in a context where DOM structure differs.

---

## 2. **KaTeX undefined when CDN fails**

**Location:** Lines 621–632 (`renderLatexFormulas`).

**Issue:** If the KaTeX script fails to load (network error, blocked, etc.), `katex` is undefined and `katex.render(...)` will throw. The rest of the simulation (canvases, controls) will still work, but `init()` will abort after `renderLatexFormulas()`.

**Suggested fix:** Guard the block:
```javascript
if (typeof katex !== 'undefined') {
    const xiEl = document.getElementById('xiFormula');
    const etaEl = document.getElementById('etaFormula');
    const z0El = document.getElementById('z0Formula');
    if (xiEl) katex.render("\\xi = ka", xiEl, { displayMode: true, throwOnError: false });
    if (etaEl) katex.render("\\eta = \\kappa a", etaEl, { displayMode: true, throwOnError: false });
    if (z0El) katex.render("\\xi^2 + \\eta^2 = z_0^2", z0El, { displayMode: true, throwOnError: false });
}
```

**Severity:** Low (only when CDN is unavailable).

---

## 3. **Bisection can receive NaN / non-finite f(ξ) at boundaries**

**Location:** Lines 809–812 in `findIntersection`.

**Issue:** At the edges of odd-parity branches, `Math.tan(xi)` can be very large in magnitude, and `1/Math.tan(xi)` (cot) can produce Infinity or NaN. Then `f(lo)` or `f(hi)` can be NaN. The check `if (fLo * fHi > 0) return null` does not treat NaN (e.g. `NaN > 0` is false), so the loop may run with NaN and never converge or return a meaningless result.

**Suggested fix:** After computing `fLo` and `fHi`, add:
```javascript
if (!Number.isFinite(fLo) || !Number.isFinite(fHi)) return null;
```

**Severity:** Low; with the current 0.001 inset from asymptotes this is unlikely, but it makes the solver more robust.

---

## 4. **Dead CSS: `.about-section`**

**Location:** Lines 349–354.

**Issue:** The class `.about-section` is defined but no longer used in the HTML. The “About the Simulation” content now lives in the popover (`.about-popover`), which does not use `.about-section`. The rule only adds visual styles that are unused.

**Suggested fix:** Remove the `.about-section` rule (lines 349–354) to avoid confusion and keep the stylesheet accurate.

**Severity:** Low (cosmetic / maintainability).

---

## 5. **Info popover not available to keyboard users**

**Location:** Info trigger (lines 435–436) and `setupInfoPopover()` (lines 604–618).

**Issue:** The popover is shown only on `mouseenter` and hidden on `mouseleave`. Users who focus the “i” button via keyboard (Tab) and activate it (Enter/Space) do not see the popover, and there is no way to open or close it from the keyboard.

**Suggested fix:**
- On the info button, add `focus`/`blur` handlers that show/hide the popover (with a short delay on blur so that moving focus into the popover does not close it), and/or
- Add a `click` handler to toggle the popover (e.g. add/remove `is-visible`), so that keyboard activation opens it; ensure the popover content is focusable (e.g. `tabindex="-1"` and focus it when opened) and that Escape closes it.
- Ensure the popover is associated with the button for accessibility (e.g. `aria-describedby` or `aria-controls` and `aria-expanded` on the button, and corresponding `id` on the popover).

**Severity:** Medium for accessibility.

---

## 6. **Popover can extend off the left edge of the viewport**

**Location:** Lines 79–81 (`.about-popover`).

**Issue:** The popover is positioned with `left: 0` relative to the info trigger. When the trigger is near the left edge of the window (e.g. on small screens or when the title is long), the popover can extend past the left edge of the viewport and be clipped or hard to read.

**Suggested fix:** Use a positioning strategy that keeps the popover on-screen, e.g.:
- Use `right: 0` and `left: auto` so the popover opens to the right of the icon and stays in view when the icon is on the left, or
- Use JavaScript to set `left`/`right` based on `getBoundingClientRect()` of the trigger and the viewport (e.g. prefer opening to the right; if there is not enough space, open to the left).

**Severity:** Low on typical desktop; can be noticeable on narrow viewports.

---

## 7. **resizeCanvases: context state not reset before scale**

**Location:** Lines 635–644.

**Issue:** Assigning `canvas.width` and `canvas.height` resets the context’s drawing state (including transform). The code then applies `scale(devicePixelRatio, devicePixelRatio)`. So after a resize there is no accumulation of scale. However, the comment in the code does not state that relying on this reset is intentional; future changes might add other state (e.g. transform) before this block and then assume a clean state.

**Suggested fix:** Either add a short comment that “Setting canvas.width/height resets the context, so we reapply scale each time,” or explicitly reset the transform before scaling, e.g. `physCtx.setTransform(1, 0, 0, 1, 0, 0);` then `physCtx.scale(...)`, so behavior is clear and robust to other code that might modify the context.

**Severity:** Very low (current behavior is correct; improvement is for clarity and future-proofing).

---

## 8. **Hover hit-test uses CSS pixel size; canvas may use device pixel size**

**Location:** Lines 612–633 (`handleMathCanvasHover`).

**Issue:** `rect = mathCanvas.getBoundingClientRect()` and `x = e.clientX - rect.left`, `y = e.clientY - rect.top`, and `w = rect.width`, `h = rect.height`. The canvas element’s displayed size is in CSS pixels. The code uses `w` and `h` as the “logical” size and computes plot coordinates with `margin`, `plotW`, `plotH`. The drawing code uses `w = mathCanvas.width / window.devicePixelRatio`, which is the same logical width. So for a canvas that is displayed at CSS size equal to its logical size (typical when the canvas is not stretched by CSS), the hover coordinates and drawing coordinates match. If the canvas were ever styled to a different size (e.g. `width: 100%` with a different aspect ratio), the coordinate systems could diverge.

**Suggested fix:** For consistency and to match the drawing logic, use the same logical size in the hover handler: e.g. `const w = mathCanvas.width / window.devicePixelRatio;` and `const h = mathCanvas.height / window.devicePixelRatio;`, and compute `x`, `y` by scaling `e.clientX - rect.left` and `e.clientY - rect.top` from the element’s displayed size to this logical size (scale factor = logical / displayed). That way hover stays correct even if the canvas is styled to a different size.

**Severity:** Low with current layout (canvas fills panel; no explicit CSS size); becomes important if layout or styling changes.

---

## 9. **animationTime grows unbounded**

**Location:** Line 1285: `animationTime += 0.016;`

**Issue:** `animationTime` is only used for the circle glow (`Math.sin(circlePhase)`) and the point glow (`Math.sin(animationTime + i)`). It is never reset. After a long time (e.g. days if the tab is left open), it could become very large. In practice, `Math.sin` remains in [-1,1] and floating-point behavior is still fine for this use, so there is no functional bug, but the variable is conceptually a “phase” that could be kept bounded (e.g. modulo 2π) for clarity.

**Suggested fix:** Optional: use a bounded phase, e.g. `animationTime = (animationTime + 0.016) % (2 * Math.PI);` so the value stays in [0, 2π). Not strictly necessary.

**Severity:** Very low.

---

## 10. **No cleanup of requestAnimationFrame**

**Location:** Line 1291: `requestAnimationFrame(animate);` inside `animate()`.

**Issue:** The animation loop is never cancelled. If the simulation is removed from the DOM (e.g. SPA navigation or dynamic removal of the widget), the loop keeps running until the page is closed, causing unnecessary work and possible leaks if the closure holds references.

**Suggested fix:** Store the frame id (e.g. `let animationId = requestAnimationFrame(animate)` and in the next frame `animationId = requestAnimationFrame(animate)`). Expose a `stop()` or `destroy()` that calls `cancelAnimationFrame(animationId)`. Call it when the component is torn down, if applicable. For a static single-page simulation this is optional.

**Severity:** Low.

---

## Summary Table

| #  | Severity | Category   | Brief description                                      |
|----|----------|------------|--------------------------------------------------------|
| 1  | Low–Med  | Robustness | Null checks for getElementById, getContext, controls   |
| 2  | Low      | Robustness | Guard KaTeX in renderLatexFormulas when CDN fails      |
| 3  | Low      | Numerical  | Guard against non-finite f in findIntersection         |
| 4  | Low      | CSS        | Remove unused .about-section                          |
| 5  | Medium   | A11y       | Keyboard and focus support for info popover           |
| 6  | Low      | UX         | Keep popover on-screen (e.g. right-align or JS)        |
| 7  | Very low | Clarity    | Comment or explicit reset before scale in resize       |
| 8  | Low      | Layout     | Align hover coordinates with drawing coordinate system|
| 9  | Very low | Clarity    | Optional: bound animationTime phase                   |
| 10 | Low      | Lifecycle  | Optional: cancelAnimationFrame on teardown            |

No physics, transcendental-equation, or wavefunction logic bugs were found in the solver or drawing code; the issues above are robustness, accessibility, UX, and maintainability.
