# A(k) vs k Plot — Line-by-Line Bug Report

## Bugs Found (with suggested fixes)

### 1. **Annotation panel values go stale when "Show Annotations" is unchecked**
- **Location:** `drawAnnotationMarkers()` (line 766) returns early when `!showAnnotations`, so the block that updates `annoPeak`, `annoFWHM`, `anno1e2`, `annoPm1Sigma`, `annoPm2Sigma` (lines 889–894) never runs.
- **Effect:** With annotations hidden, changing k₀ or σ leaves the Annotations sidebar showing old values until the user re-enables annotations.
- **Fix:** Update the annotation panel values every frame regardless of `showAnnotations`. Either: (a) compute and set those five values at the end of `draw()` (or in a small helper) so they always run, or (b) move the "Update annotation values" block (lines 888–894) to run before the `if (!showAnnotations) return;` so the DOM is updated even when on-canvas annotations are hidden.

---

### 2. **Unused variable `time`**
- **Location:** Line 518 (`let time = 0`) and line 1056 (`time += dt`).
- **Effect:** Dead code; no other reference to `time`.
- **Fix:** Remove `let time = 0` and the line `time += dt` in `animate()`.

---

### 3. **No null check for `probeSliderGroup`**
- **Location:** Line 505 (`const probeSliderGroup = document.getElementById('probeSliderGroup')`), and line 551 (`probeSliderGroup.style.display = ...`).
- **Effect:** If the element ID were missing or changed, `probeSliderGroup` would be null and setting `.style.display` would throw.
- **Fix:** In `updateProbeSliderVisibility()`, guard with `if (probeSliderGroup) probeSliderGroup.style.display = ...`.

---

### 4. **`ctx.roundRect` compatibility**
- **Location:** Line 951 (`ctx.roundRect(tx - 6, tooltipY - 14, tw + 12, 22, 4)`).
- **Effect:** `CanvasRenderingContext2D.roundRect` is not supported in older browsers (e.g. older Safari); calling it can throw and break the draw loop.
- **Fix:** Either (a) use a polyfill (draw a path with rounded corners manually), or (b) check for `ctx.roundRect` and fall back to `ctx.rect()` for the tooltip box when absent.

---

### 5. **Modal overlay not focusable / no escape key**
- **Location:** Modal overlay (lines 346–371); no key handler.
- **Effect:** Keyboard users cannot close the modal with Escape; focus is not managed when the modal opens.
- **Fix:** Add `document.addEventListener('keydown', ...)` to close the modal when `e.key === 'Escape'` and the overlay is active; optionally set focus to the close button when opening and trap focus inside the modal for a11y.

---

### 6. **Info button has no accessible name when focused**
- **Location:** Line 341: `<button class="info-btn" id="infoBtn" title="About this simulation">i</button>`.
- **Effect:** The `title` attribute is used, but for screen readers a more robust accessible name (e.g. `aria-label="About this simulation"`) is preferred.
- **Fix:** Add `aria-label="About this simulation"` (and keep or remove `title` as desired).

---

## Summary

| # | Severity | Bug | Fix |
|---|----------|-----|-----|
| 1 | Medium | Annotation values stale when annotations hidden | Update annotation DOM values every frame regardless of `showAnnotations` |
| 2 | Low | Unused `time` variable | Remove declaration and update |
| 3 | Low | Null dereference if `probeSliderGroup` missing | Null check in `updateProbeSliderVisibility()` |
| 4 | Low | `roundRect` may throw in old browsers | Polyfill or fallback to `rect()` |
| 5 | Low | No Escape to close modal | Add keydown handler for Escape |
| 6 | Low | Info button a11y | Add `aria-label` |

No other logic or physics bugs were found in the Gaussian formula, coordinate transforms, FWHM/1/e² math, draw order, or probe tooltip clamping.
