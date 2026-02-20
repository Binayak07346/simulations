# Comprehensive Bug Review: Harmonic Oscillator Simulation

## Bugs Found and Suggested Fixes

### 1. **BUG: Unused variables `fps` and `frameCount` (minor)**

**Location:** Lines 661-662
```javascript
let frameCount = 0;
let fps = 60;
```

**Issue:** These variables are declared but never used after FPS display was removed. `frameCount` is incremented but serves no purpose.

**Fix:** Remove these unused variables:
```javascript
// Remove lines 661-662
```

---

### 2. **BUG: Hardcoded header height in maximized CSS (potential layout issue)**

**Location:** Line 249
```css
top: 48px; /* Below header */
```

**Issue:** The maximized plot position uses a hardcoded `48px` for the header height. If the header height changes (e.g., responsive design, font size changes), the maximized plot will overlap or have gaps.

**Fix:** Use CSS custom property or calculate dynamically:
```css
.plot-container.maximized {
    position: fixed;
    top: var(--header-height, 48px); /* Use CSS variable */
    /* ... rest */
}
```
And set `--header-height` on the header element, or use JavaScript to calculate:
```javascript
const headerHeight = document.querySelector('.header-bar').offsetHeight;
// Then use in CSS or set inline style
```

---

### 3. **BUG: Hardcoded sidebar width in maximized CSS (potential layout issue)**

**Location:** Line 251
```css
right: 320px; /* Keep sidebar width visible */
```

**Issue:** Similar to header height, sidebar width is hardcoded. If sidebar width changes, maximized plots won't align correctly.

**Fix:** Use CSS variable or calculate:
```css
right: var(--sidebar-width, 320px);
```
Or calculate dynamically in JavaScript when maximizing.

---

### 4. **BUG: `min()` function in CSS may not be supported in older browsers**

**Location:** Line 69
```css
max-width: min(420px, 90vw);
```

**Issue:** The `min()` CSS function is not supported in older browsers (e.g., IE, older Safari). This could cause the tooltip to overflow on small screens.

**Fix:** Use a media query fallback:
```css
max-width: 420px; /* Fallback */
max-width: min(420px, 90vw); /* Modern browsers */
```
Or use JavaScript to set max-width dynamically.

---

### 5. **BUG: Potential null reference if canvas elements don't exist**

**Location:** Lines 644-651
```javascript
const wavefunctionCanvas = document.getElementById('wavefunctionCanvas');
// ... other canvases
const ctxWave = wavefunctionCanvas.getContext('2d');
```

**Issue:** If `getElementById` returns `null` (shouldn't happen but defensive programming), calling `.getContext()` will throw an error.

**Fix:** Add null checks:
```javascript
const wavefunctionCanvas = document.getElementById('wavefunctionCanvas');
if (!wavefunctionCanvas) {
    console.error('wavefunctionCanvas not found');
    return;
}
const ctxWave = wavefunctionCanvas.getContext('2d');
// ... repeat for other canvases
```

---

### 6. **BUG: `animate` global variable dependency in `wavefunction()` function**

**Location:** Line 744
```javascript
const phase = animate ? -energy * t / hbar : 0;
```

**Issue:** The `wavefunction()` function depends on the global `animate` variable. This creates a hidden dependency and makes the function less pure/testable. If `animate` changes during a calculation, behavior could be inconsistent.

**Fix:** Pass `animate` as a parameter or use `t` directly (if `t === 0`, no animation):
```javascript
function wavefunction(n, x, t = 0, shouldAnimate = true) {
    // ...
    const phase = shouldAnimate ? -energy * t / hbar : 0;
    // ...
}
// Then call with: wavefunction(n, x, time, animate)
```

---

### 7. **BUG: Edge case when `n2 === n` with superposition enabled**

**Location:** Line 755
```javascript
if (useSuperposition && n2 !== n) {
```

**Issue:** If `useSuperposition` is `true` but `n2 === n`, the code treats it as a single eigenstate. This is mathematically correct (superposition of same state is just that state), but the UI might be confusing - the checkbox is checked but behavior is like single state.

**Fix:** Consider disabling superposition checkbox or showing a message when `n2 === n`:
```javascript
if (useSuperposition && n2 !== n) {
    // ... superposition logic
} else {
    // Single state (including when n2 === n with superposition enabled)
    return wavefunction(n, x, t);
}
// Optionally: warn user or auto-uncheck superposition when n2 === n
```

---

### 8. **BUG: Missing error handling in `resizeCanvases()`**

**Location:** Lines 673-681
```javascript
function resizeCanvases() {
    const containers = document.querySelectorAll('.plot-container');
    containers.forEach((container) => {
        const canvas = container.querySelector('canvas');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    });
}
```

**Issue:** If `canvas` is `null` or `rect` is invalid, this will throw an error. Also, if container has zero width/height, canvas will be 0x0.

**Fix:** Add null checks and validation:
```javascript
function resizeCanvases() {
    const containers = document.querySelectorAll('.plot-container');
    containers.forEach((container) => {
        const canvas = container.querySelector('canvas');
        if (!canvas) return;
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        canvas.width = rect.width;
        canvas.height = rect.height;
    });
}
```

---

### 9. **BUG: Potential division by zero in turning point calculation**

**Location:** Lines 961, 975
```javascript
const turningPoint1 = Math.sqrt(2 * energy1 / (m * omega * omega));
```

**Issue:** If `m` or `omega` is 0 (shouldn't happen with current constants, but defensive), this causes division by zero. Also, if `energy1 < 0` (shouldn't happen), `Math.sqrt()` returns `NaN`.

**Fix:** Add validation:
```javascript
if (m <= 0 || omega <= 0 || energy1 < 0) {
    console.warn('Invalid physics constants or energy');
    return;
}
const turningPoint1 = Math.sqrt(2 * energy1 / (m * omega * omega));
```

---

### 10. **BUG: Missing null check in `updateStateLabels()` for MathJax**

**Location:** Lines 1046-1052
```javascript
if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([...]);
}
```

**Issue:** If MathJax fails to load or `typesetPromise` throws an error, there's no error handling. This could cause silent failures.

**Fix:** Add try-catch:
```javascript
if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([
        stateDescription.parentElement,
        energyLabelEl,
        energyStatEl
    ]).catch(err => {
        console.warn('MathJax typesetting failed:', err);
    });
}
```

---

### 11. **BUG: `resetSimulation()` uses variables before they're declared**

**Location:** Lines 1071-1072
```javascript
n2Slider.disabled = true;
n2SliderContainer.classList.add('disabled');
```

**Issue:** `n2Slider` and `n2SliderContainer` are used here but declared later (lines 1123-1125). However, `resetSimulation()` is only called from event listeners set up after those declarations, so this is actually OK. But it's fragile - if `resetSimulation()` is called earlier, it would fail.

**Fix:** Move variable declarations before `resetSimulation()` definition, or get elements inside the function:
```javascript
function resetSimulation() {
    // ...
    const n2Slider = document.getElementById('n2Slider');
    const n2SliderContainer = document.getElementById('n2SliderContainer');
    n2Slider.disabled = true;
    n2SliderContainer.classList.add('disabled');
    // ...
}
```

---

### 12. **BUG: No validation for slider values**

**Location:** Lines 1116, 1140, 1146
```javascript
n = parseInt(e.target.value);
n2 = parseInt(e.target.value);
scale = parseFloat(e.target.value);
```

**Issue:** If slider value is invalid or out of range, `parseInt`/`parseFloat` could return `NaN`, causing issues in calculations.

**Fix:** Add validation:
```javascript
n = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
n2 = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
scale = Math.max(2, Math.min(20, parseFloat(e.target.value) || 4));
```

---

### 13. **BUG: Click handler for closing maximized view could conflict with maximize button click**

**Location:** Lines 1199-1215

**Issue:** The document click handler checks `!onMaximizeBtn`, but the maximize button click handler calls `e.stopPropagation()`. This should work, but if `stopPropagation()` fails or is removed, clicking the maximize button could toggle twice.

**Fix:** Already handled with `e.stopPropagation()`, but verify it's working correctly. Consider using a flag or checking the event target more carefully.

---

### 14. **BUG: Potential memory leak with event listeners**

**Location:** Multiple `addEventListener` calls throughout

**Issue:** Event listeners are added but never removed. If the page is dynamically reloaded or components are recreated, listeners could accumulate.

**Fix:** Generally OK for a single-page app, but consider cleanup if needed:
```javascript
// Store references for cleanup if needed
const listeners = [];
listeners.push({ element: nSlider, event: 'input', handler: ... });
// Later: listeners.forEach(({element, event, handler}) => element.removeEventListener(event, handler));
```

---

### 15. **BUG: `lastTime` initialization could cause large deltaTime on first frame**

**Location:** Line 660
```javascript
let lastTime = performance.now();
```

**Issue:** If there's a delay between initialization and first `animationLoop()` call, `deltaTime` could be very large, causing a jump in animation.

**Fix:** Initialize `lastTime` right before starting the loop:
```javascript
// In initialization section:
lastTime = performance.now();
animationLoop();
```

---

## Summary

| Bug # | Severity | Category | Status |
|-------|----------|----------|--------|
| 1 | Low | Code cleanup | Unused variables |
| 2 | Medium | Layout | Hardcoded header height |
| 3 | Medium | Layout | Hardcoded sidebar width |
| 4 | Low | Compatibility | CSS `min()` support |
| 5 | Medium | Robustness | Null checks missing |
| 6 | Low | Code quality | Global dependency |
| 7 | Low | Edge case | n2 === n with superposition |
| 8 | Medium | Robustness | Missing error handling |
| 9 | Low | Robustness | Division by zero (edge case) |
| 10 | Low | Robustness | MathJax error handling |
| 11 | Low | Code organization | Variable order |
| 12 | Medium | Validation | Slider value validation |
| 13 | Low | Event handling | Already handled |
| 14 | Low | Memory | Generally OK |
| 15 | Low | Animation | First frame timing |

**Total bugs found: 15** (mostly minor/medium severity)

**Recommended priority fixes:**
1. #12 - Slider value validation (medium priority)
2. #8 - Error handling in `resizeCanvases()` (medium priority)
3. #5 - Null checks for canvas elements (medium priority)
4. #2, #3 - Hardcoded dimensions (medium priority, affects responsive design)
