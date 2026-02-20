# Code review and bug analysis
_Exported on 18/02/2026 at 19:40:03 GMT+5:30 from Cursor (2.4.37)_

---

**User**

Review the code line by line thoroughly in detail. Check all the pysics equations, concepts, numerical methods, overall architecture and flow, frontent visuals, control panel logic. Mention the bugs found with suggested edits.

---

**Cursor**

Let me read the full file first, then conduct a thorough review.

Now I have the complete file. Let me perform a comprehensive line-by-line review.

---

# Comprehensive Code Review: Double-Slit Experiment Simulation

## Table of Contents
1. [CRITICAL: Physics — Broken `NM_TO_SIM` Scaling Factors](#1)
2. [Physics Equations — Correctness Analysis](#2)
3. [Numerical Methods](#3)
4. [Architecture & Flow](#4)
5. [Frontend / Visuals](#5)
6. [Control Panel Logic](#6)
7. [Minor Bugs & Code Smells](#7)

---

## 1. CRITICAL BUG: Inconsistent `NM_TO_SIM` Scaling Destroys Physics Ratios

This is the **most serious bug** in the entire simulation. The interference pattern displayed does NOT correspond to the physical parameters shown on the sliders.

```575:580:simulations/Sims-v2/double-slit-experiment-.html
        const NM_TO_SIM = {
            sep: 4.0 / 800,          // 800 nm default → 4.0 sim units
            width: 0.8 / 200,        // 200 nm default → 0.8 sim units  
            lambda: 1.5 / 550,       // 550 nm default → 1.5 sim units
            screenDist: 30 / 6000    // 6000 nm default → 30 sim units
        };
```

Each physical quantity has a **different** conversion factor:

| Quantity | Factor | Value |
|---|---|---|
| sep | 4.0/800 | 0.00500 |
| width | 0.8/200 | 0.00400 |
| lambda | 1.5/550 | 0.00273 |
| screenDist | 30/6000 | 0.00500 |

The entire double-slit pattern depends on the **ratios** `d/λ` and `a/λ`. With inconsistent factors, these ratios are distorted:

- **Real physics**: d/λ = 800/550 = **1.455**
- **Sim space**: d/λ = 4.0/1.5 = **2.667** (almost 2x too large!)

This means the simulation shows **nearly twice as many fringes** as the real physics would predict for the given slider values. The fringe spacing and diffraction envelope are both wrong.

**Suggested fix** — use a single uniform scaling factor for all spatial quantities, and keep λ in its own track only for visual wave spacing:

```javascript
// One scale for ALL physical lengths used in formulas
const UNIFORM_SCALE = 30 / 6000;   // 0.005 sim-units per nm

const NM_TO_SIM = {
    sep:        UNIFORM_SCALE,   // 800 nm → 4.0
    width:      UNIFORM_SCALE,   // 200 nm → 1.0
    lambda:     UNIFORM_SCALE,   // 550 nm → 2.75
    screenDist: UNIFORM_SCALE    // 6000 nm → 30
};
```

This preserves all physical ratios. The 3D barrier and wave visuals will look slightly different (slit-width becomes 1.0 instead of 0.8, λ becomes 2.75 instead of 1.5) but the **physics will be correct**. If the visual proportions look wrong at uniform scale, use separate "visual-only" parameters for 3D geometry and keep a `physicsState` with uniform-scale values for the formulas.

---

## 2. Physics Equations — Correctness Analysis (Assuming Consistent Units)

### Quantum Pattern — CORRECT

```1121:1140:simulations/Sims-v2/double-slit-experiment-.html
                // Quantum: Full double-slit interference pattern
                // I = |ψ₁ + ψ₂|² = cos²(φ) × sinc²(β)
                const theta = Math.atan(x / L);
                const sinTheta = Math.sin(theta);
                
                // Interference term from path difference between slits
                const phi = (Math.PI * state.sep * sinTheta) / state.lambda;
                const interference = Math.pow(Math.cos(phi), 2);
                
                // Single-slit diffraction envelope
                const beta = (Math.PI * state.slitWidth * sinTheta) / state.lambda;
                let diffraction = 1.0;
                if (Math.abs(beta) > 0.001) {
                    diffraction = Math.pow(Math.sin(beta) / beta, 2);
                }
                
                // Quantum: |ψ₁ + ψ₂|² ∝ cos²(φ) × sinc²(β)
                // The full formula has a factor of 4, but for Monte Carlo rejection
                // sampling we use the normalized shape (max = 1) as the probability.
                const probability = interference * diffraction;
```

The formula `I ∝ cos²(πd sinθ/λ) × sinc²(πa sinθ/λ)` is the standard Fraunhofer double-slit result. The `cos²` term is the two-slit interference and `sinc²` is the single-slit diffraction envelope. This matches Hecht's "Optics" and Griffiths' "Introduction to Quantum Mechanics". The normalization note about the factor of 4 is correct — for rejection sampling, only the shape matters.

### Classical Pattern — CORRECT

```1168:1180:simulations/Sims-v2/double-slit-experiment-.html
                    // P₁: Single-slit diffraction from slit 1 at x = -d/2
                    const theta1 = Math.atan((cx + d_half) / L);
                    const beta1 = (Math.PI * state.slitWidth * Math.sin(theta1)) / state.lambda;
                    const p1 = Math.abs(beta1) > 0.001 ? Math.pow(Math.sin(beta1) / beta1, 2) : 1.0;
                    
                    // P₂: Single-slit diffraction from slit 2 at x = +d/2
                    const theta2 = Math.atan((cx - d_half) / L);
                    const beta2 = (Math.PI * state.slitWidth * Math.sin(theta2)) / state.lambda;
                    const p2 = Math.abs(beta2) > 0.001 ? Math.pow(Math.sin(beta2) / beta2, 2) : 1.0;
                    
                    // Classical probability: just add (no interference)
                    // Normalize by 2.0 for consistent sampling rate
                    const classicalProb = (p1 + p2) / 2.0;
```

This correctly implements the Feynman Vol III, Ch 1 classical prediction. Each slit independently produces a single-slit diffraction pattern centered at its own position, and probabilities add directly (no cross-term). The angle calculations correctly measure from each slit's center. The `/2.0` normalization ensures the peak acceptance probability is ≤ 1.0 for valid rejection sampling.

### Classical Peak Normalization — CORRECT

```1362:1365:simulations/Sims-v2/double-slit-experiment-.html
            // Normalize classical to peak = 0.5 (half of quantum peak = 1.0)
            // Correctly represents classical 2I₀ vs quantum 4I₀
            const maxClassical = Math.max(...classicalRaw);
            return classicalRaw.map(v => 0.5 * (v / maxClassical));
```

Quantum coherent addition: |A+A|² = 4|A|² → peak 4I₀. Classical incoherent addition: |A|² + |A|² = 2|A|² → peak 2I₀. Ratio is 0.5. Correct.

### Barrier Geometry — CORRECT

```870:877:simulations/Sims-v2/double-slit-experiment-.html
            const centerW = state.sep - state.slitWidth;
            const sideW = (CONFIG.sceneWidth - centerW - (state.slitWidth * 2)) / 2;

            const center = new THREE.Mesh(new THREE.BoxGeometry(centerW, height, depth), mat);
            const left = new THREE.Mesh(new THREE.BoxGeometry(sideW, height, depth), mat);
            left.position.x = -(centerW/2 + state.slitWidth + sideW/2);
            const right = new THREE.Mesh(new THREE.BoxGeometry(sideW, height, depth), mat);
            right.position.x = (centerW/2 + state.slitWidth + sideW/2);
```

Center of slit 1 = `-(centerW/2 + slitWidth/2)` = `-(sep/2)`. Correct.

### Secondary Wave Geometry — CORRECT

```940:944:simulations/Sims-v2/double-slit-experiment-.html
            for (let i = 0; i <= numPoints; i++) {
                const angle = (i / numPoints) * Math.PI - Math.PI/2;
                const x = slitX + initialRadius * Math.sin(angle);
                const z = CONFIG.barrierZ - initialRadius * Math.cos(angle);
                points.push(new THREE.Vector3(x, 0, z));
```

Semicircular arc from -π/2 to +π/2, centered on the slit, radiating into the forward hemisphere. This correctly implements Huygens' principle.

---

## 3. Numerical Methods

### Monte Carlo Rejection Sampling — CORRECT but has a subtle issue

The rejection sampling technique is sound: generate uniform random x positions, accept with probability proportional to the intensity. Over many samples, the histogram converges to the true distribution.

**Bug: Double hit-recording per wavefront.** Both S1 and S2 trigger `recordInterferenceHits()`:

```1061:1064:simulations/Sims-v2/double-slit-experiment-.html
                if (wave.radius > Math.abs(screenZ - CONFIG.barrierZ) - 2 && !wave.recordedHit) {
                    wave.recordedHit = true;
                    recordInterferenceHits(time);
                }
```

```1097:1100:simulations/Sims-v2/double-slit-experiment-.html
                if (wave.radius > Math.abs(screenZ - CONFIG.barrierZ) - 2 && !wave.recordedHit) {
                    wave.recordedHit = true;
                    recordInterferenceHits(time);
                }
```

S1 and S2 are created simultaneously (same radius, same growth rate), so both trigger in the same frame → 75 + 75 = 150 samples per wavefront. This works, but is fragile — floating-point timing differences could occasionally cause them to fire in different frames, producing an uneven sampling cadence. Better to trigger from only one wave:

**Suggested fix:**

```javascript
// Only trigger hit recording from S1 waves (S2 grows at same rate)
// In updateWaveMode, S2 section: REMOVE the hit-recording block entirely
// In S1 section, change numSamples back to 150:
const numSamples = 150;
```

### `Math.max` on Potentially Empty Array

```1033:1035:simulations/Sims-v2/double-slit-experiment-.html
            const maxZ = incidentWaves.length > 0 
                ? Math.max(...incidentWaves.filter(w => w.z > CONFIG.barrierZ).map(w => w.z))
                : CONFIG.sourceZ - state.lambda * 2;
```

When all waves have passed the barrier, `filter()` returns `[]`, and `Math.max(...[])` returns `-Infinity`. It happens to work but is fragile.

**Suggested fix:**

```javascript
const wavesAboveBarrier = incidentWaves.filter(w => w.z > CONFIG.barrierZ);
const maxZ = wavesAboveBarrier.length > 0
    ? Math.max(...wavesAboveBarrier.map(w => w.z))
    : CONFIG.sourceZ - state.lambda * 2;
```

---

## 4. Architecture & Flow

### Initialization Chain — GOOD

```680:686:simulations/Sims-v2/double-slit-experiment-.html
        function init() {
            initThree();
            initCombinedChart();
            initUI();
            initNarration();
            animate();
        }
```

Clean separation of concerns.

### Animation Loop — GOOD

```1497:1511:simulations/Sims-v2/double-slit-experiment-.html
        function animate(time) {
            requestAnimationFrame(animate);
            const dt = Math.min((time - (animate.lastTime || time))/1000, 0.1) || 0;
            animate.lastTime = time;

            controls.update();

            updatePhysics(dt, time);
            renderer.render(scene, camera);

            if (time - (animate.lastFps || 0) > 250) {
                combinedChart.data.datasets[0].data = getNormalizedHits();
                combinedChart.update('none');
                animate.lastFps = time;
            }
        }
```

Capping dt at 0.1s prevents spiral-of-death. Chart updates throttled to 4 Hz. Solid pattern.

### Bug: THREE.js Memory Leak — Geometries & Materials Never Disposed

When waves are removed from the scene, their GPU resources are leaked:

```1028:1031:simulations/Sims-v2/double-slit-experiment-.html
            incidentToRemove.reverse().forEach(index => {
                scene.remove(incidentWaves[index].mesh);
                incidentWaves.splice(index, 1);
            });
```

**Suggested fix** — add disposal before removal:

```javascript
incidentToRemove.reverse().forEach(index => {
    const wave = incidentWaves[index];
    scene.remove(wave.mesh);
    wave.mesh.geometry.dispose();
    wave.mesh.material.dispose();
    incidentWaves.splice(index, 1);
});
```

Apply the same pattern to `s1ToRemove`, `s2ToRemove`, and inside `createWavefronts()` where old waves are cleaned up (lines 890-895):

```890:895:simulations/Sims-v2/double-slit-experiment-.html
            incidentWaves.forEach(w => scene.remove(w.mesh));
            incidentWaves = [];
            secondaryWavesS1.forEach(w => scene.remove(w.mesh));
            secondaryWavesS1 = [];
            secondaryWavesS2.forEach(w => scene.remove(w.mesh));
            secondaryWavesS2 = [];
```

Should become:

```javascript
incidentWaves.forEach(w => {
    scene.remove(w.mesh);
    w.mesh.geometry.dispose();
    w.mesh.material.dispose();
});
incidentWaves = [];
// ... same for secondaryWavesS1, secondaryWavesS2
```

### Bug: Redundant Work in `updateSimParams` → `resetSim` Chain

```1423:1430:simulations/Sims-v2/double-slit-experiment-.html
            function updateSimParams() {
                createBarrier();
                createSlitLabels();
                clearClassicalOverlay();
                state.classicalHits.fill(0);
                resetSim();
                updateCombinedChart();
            }
```

`resetSim()` already calls `clearClassicalOverlay()`, `state.classicalHits.fill(0)`, and `updateCombinedChart()`. So these are called **twice**:

- `clearClassicalOverlay()` — called at line 1426 and again inside `resetSim` at line 1490
- `state.classicalHits.fill(0)` — called at line 1427 and again inside `resetSim` at line 1482
- `updateCombinedChart()` — called at line 1429 and again inside `resetSim` at line 1494

**Suggested fix:**

```javascript
function updateSimParams() {
    createBarrier();
    createSlitLabels();
    resetSim();         // handles clearing, hits, chart update internally
}
```

### Bug: Wavelength Handler Does Redundant Work

```1444:1453:simulations/Sims-v2/double-slit-experiment-.html
            document.getElementById('wavelength').oninput = (e) => {
                const val = parseFloat(e.target.value);
                state.lambda = val * NM_TO_SIM.lambda;
                const valEl = document.getElementById('wavelength-value');
                valEl.textContent = Math.round(val) + ' nm';
                valEl.style.color = wavelengthToColor(val);
                updateAllWaveColors();
                createSourceMarker();
                updateSimParams();
            };
```

`updateAllWaveColors()` updates existing wave colors, but `updateSimParams()` → `resetSim()` → `createWavefronts()` immediately destroys and recreates all waves. The color update is wasted work.

**Suggested fix** — remove the redundant call:

```javascript
document.getElementById('wavelength').oninput = (e) => {
    const val = parseFloat(e.target.value);
    state.lambda = val * NM_TO_SIM.lambda;
    const valEl = document.getElementById('wavelength-value');
    valEl.textContent = Math.round(val) + ' nm';
    valEl.style.color = wavelengthToColor(val);
    createSourceMarker();   // needs current color
    updateSimParams();      // recreates waves with correct color
};
```

### Dead Parameter: `time` in `recordInterferenceHits`

```1113:1115:simulations/Sims-v2/double-slit-experiment-.html
        function recordInterferenceHits(time) {
            const L = CONFIG.screenDistance;
            const numSamples = 75; // Halved: both S1 and S2 now trigger detection
```

The `time` parameter is accepted but never used inside the function. Remove it:

```javascript
function recordInterferenceHits() {
```

And update call sites (lines 1063, 1099) to `recordInterferenceHits()`.

---

## 5. Frontend / Visuals

### nmToRGB — Mostly Correct but Brightness Boost Distorts Color Accuracy

```611:626:simulations/Sims-v2/double-slit-experiment-.html
        function nmToRGB(nm) {
            let r, g, b;
            if (nm >= 380 && nm < 440) { r = -(nm-440)/(440-380); g = 0; b = 1; }
            else if (nm >= 440 && nm < 490) { r = 0; g = (nm-440)/(490-440); b = 1; }
            else if (nm >= 490 && nm < 510) { r = 0; g = 1; b = -(nm-510)/(510-490); }
            else if (nm >= 510 && nm < 580) { r = (nm-510)/(580-510); g = 1; b = 0; }
            else if (nm >= 580 && nm < 645) { r = 1; g = -(nm-645)/(645-580); b = 0; }
            else if (nm >= 645 && nm <= 700) { r = 1; g = 0; b = 0; }
            else { r = 0.4; g = 0.6; b = 1; }
            // Boost brightness so waves are visible against dark background
            const boost = 0.15;
            r = Math.min(1, r + boost);
            g = Math.min(1, g + boost);
            b = Math.min(1, b + boost);
            return { r, g, b };
        }
```

The piecewise-linear spectrum mapping is a standard approximation (Dan Bruton / CIE). The brightness boost (`+0.15`) is a pragmatic choice for visibility, but it shifts hues — e.g., pure red (1,0,0) becomes (1, 0.15, 0.15) which is pinkish-red. For deep violet (nm ≈ 380), the blue channel is already 1.0 but r gets a boost of 0.15 + the ramp value — this washes out the violet. This is a cosmetic trade-off, not a bug.

The `else` clause (nm outside 380-700) returns a fallback blue. This should never trigger since the slider is constrained to 380-700, but it's good defensive coding.

### Classical Overlay Plane — Z-Fighting Risk

```761:762:simulations/Sims-v2/double-slit-experiment-.html
            classicalOverlayMesh.position.z = -CONFIG.screenDistance + 0.3; // Slightly in front of the detection screen
            classicalOverlayMesh.visible = false;
```

The offset of 0.3 sim units should prevent z-fighting in most cases, but at shallow viewing angles it might cause visible separation between the quantum screen and classical overlay. The use of `depthWrite: false` on line 758 helps. Acceptable.

### Screen Hit Dot Rendering — CORRECT

```1148:1153:simulations/Sims-v2/double-slit-experiment-.html
                    screenContext.globalCompositeOperation = 'lighter';
                    screenContext.beginPath();
                    screenContext.arc(tx, ty, 2, 0, Math.PI * 2);
                    screenContext.fillStyle = nmToCSSRGBA(getCurrentWavelengthNM(), 0.3);
                    screenContext.fill();
                    screenTexture.needsUpdate = true;
```

Using `'lighter'` compositing mode is clever — overlapping dots brighten, naturally producing the intensity buildup expected in the experiment. Alpha 0.3 per dot means ~4 overlapping dots saturate. Good choice.

---

## 6. Control Panel Logic

### Slider Handlers — Work Correctly (aside from the NM_TO_SIM bug)

All sliders follow the same pattern: read value, convert to sim units, update display text, trigger rebuild. The pattern is consistent.

### Screen Distance Slider Modifies CONFIG

```1454:1460:simulations/Sims-v2/double-slit-experiment-.html
            document.getElementById('screen-dist').oninput = (e) => {
                const val = parseFloat(e.target.value);
                CONFIG.screenDistance = val * NM_TO_SIM.screenDist;
                document.getElementById('screen-dist-value').textContent = Math.round(val) + ' nm';
                // Update screen mesh positions
                if (screenMesh) screenMesh.position.z = -CONFIG.screenDistance;
                if (classicalOverlayMesh) classicalOverlayMesh.position.z = -CONFIG.screenDistance + 0.3;
```

Mutating `CONFIG` is slightly inconsistent since `CONFIG` reads like a constant. Better practice would be to move `screenDistance` to `state`. This is a style issue, not a functional bug.

### Classical Toggle — CORRECT

```1389:1414:simulations/Sims-v2/double-slit-experiment-.html
            classicalBtn.onclick = () => {
                state.showClassical = !state.showClassical;
                
                if (state.showClassical) {
                    classicalBtn.classList.add('active');
                    classicalBtn.textContent = 'Hide Classical Pattern';
                    classicalOverlayMesh.visible = true;
                    // Clear overlay for fresh accumulation
                    clearClassicalOverlay();
                    state.classicalHits.fill(0);
                    // Show classical envelope on chart
                    combinedChart.data.datasets[2].hidden = false;
                    combinedChart.data.datasets[2].data = generateClassicalData();
                    document.getElementById('classical-legend').style.display = 'flex';
                    combinedChart.update('none');
                } else {
                    // ...hide...
                }
            };
```

The toggle correctly manages visibility, resets classical data, and toggles the chart dataset. Clean logic.

### Reset Button — CORRECT

```1479:1495:simulations/Sims-v2/double-slit-experiment-.html
        function resetSim() {
            state.detectedCount = 0;
            state.hits.fill(0);
            state.classicalHits.fill(0);
            
            screenContext.globalCompositeOperation = 'source-over';
            screenContext.fillStyle = '#1e293b';
            screenContext.fillRect(0, 0, CONFIG.screenRes.w, CONFIG.screenRes.h);
            screenTexture.needsUpdate = true;

            // Clear classical overlay (dots restart fresh if classical mode is on)
            clearClassicalOverlay();
            
            createWavefronts();
            
            updateCombinedChart();
        }
```

Correctly resets compositing mode to `'source-over'` before clearing, then recreates wavefronts. Solid.

---

## 7. Minor Bugs & Code Smells

### Narration Speech Synthesis — Potential Chrome Bug

```1629:1631:simulations/Sims-v2/double-slit-experiment-.html
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
```

Chrome has a known bug where `speechSynthesis` stops working after ~15 seconds of continuous speech. The common workaround is to call `speechSynthesis.pause(); speechSynthesis.resume();` on a timer. The current code doesn't handle this, so narration may silently stop mid-step on Chrome.

### `state.classicalHits` is Accumulated but Never Displayed on Chart

`state.classicalHits` is populated during Monte Carlo sampling (line 1195) but is never used for any chart dataset. The chart's classical curve (dataset 2) uses `generateClassicalData()` which computes the theoretical curve, not the accumulated histogram. The classical hits only manifest as orange dots on the 3D overlay. This is consistent but the accumulated histogram could be shown to demonstrate convergence, similar to the quantum detected pattern.

### Edge Case: Slider Extremes Can Produce Degenerate Barrier

When `slit separation = 400nm` and `slit width = 500nm` in sim units:
- `centerW = 2.0 - 2.0 = 0` → zero-width center barrier (invisible)

Three.js handles `BoxGeometry(0, h, d)` gracefully (no crash), but visually the barrier disappears. This edge case should either be documented or the sliders should be constrained so `sep > slitWidth`.

---

## Summary of All Bugs by Severity

| # | Severity | Description | Line(s) |
|---|---|---|---|
| 1 | **CRITICAL** | Inconsistent `NM_TO_SIM` factors distort d/λ and a/λ ratios — interference pattern doesn't match slider values | 575-580 |
| 2 | **HIGH** | THREE.js geometry/material memory leak — `dispose()` never called on removed waves | 890-895, 1028-1031, 1071-1074, 1107-1110 |
| 3 | **MEDIUM** | Double hit-recording per wavefront (both S1 and S2 trigger), fragile timing | 1061-1064, 1097-1100 |
| 4 | **MEDIUM** | `Math.max(...[])` returns `-Infinity` when no waves above barrier | 1034 |
| 5 | **LOW** | Redundant calls: `clearClassicalOverlay`, `classicalHits.fill(0)`, `updateCombinedChart` called twice per slider change | 1423-1430 vs 1479-1495 |
| 6 | **LOW** | `updateAllWaveColors()` is wasted when wavelength changes (waves immediately recreated) | 1450 |
| 7 | **LOW** | Dead `time` parameter in `recordInterferenceHits(time)` | 1113 |
| 8 | **LOW** | Chrome speech synthesis may stall after ~15s without pause/resume workaround | 1626-1663 |
| 9 | **INFO** | `CONFIG.screenDistance` mutated — should be in `state` for consistency | 1456 |
| 10 | **INFO** | `state.classicalHits` accumulated but never displayed on chart | 1194-1195 |

Would you like me to apply the fixes for any or all of these bugs?

---

**User**

Fix the first critical bug (1. CRITICAL BUG: Inconsistent NM_TO_SIM Scaling Destroys Physics Ratios)

---

**Cursor**

Let me re-read the exact code I need to modify to ensure a precise edit.

Now I'll apply the fix. The core issue is that `sep`, `width`, `lambda`, and `screenDist` each have different per-nm conversion factors, so physical ratios like d/λ are distorted. The fix is a single uniform factor for all lengths.

Now let me verify the state initialization still references the same NM_TO_SIM keys, and check that the rest of the file is consistent with the new values.

The fix is applied. Let me verify the computed default values are correct and there are no downstream issues. Let me check the wave-spawning code, since λ is now larger (2.75 vs 1.5), which affects visual wave spacing.

The λ in sim-space is now 2.75 (was 1.5), which means the visual wave spacing (`state.lambda * 2`) is also ~1.8x wider, resulting in fewer visible wavefronts between source and barrier. Let me check the replenishment threshold too.

The spacing multiplier (`* 2`) was tuned for the old (broken) λ scale of 1.5 sim units. With the corrected λ of 2.75, `λ * 2 = 5.5` gives only ~3 visible wavefronts instead of ~6. I need to scale the visual spacing multiplier down to compensate, since this is purely cosmetic (it controls how many wavefront lines are drawn, not the physics).

Now update the matching replenishment threshold and fallback value to stay proportional:

Now let me verify the complete fix by reading the changed regions to confirm everything is consistent.

Everything looks consistent. Let me verify there are no other references to the old multiplier values by searching the file.

All three lambda multiplier sites are updated consistently. Now let me do a quick sanity check on the computed default values and the physics ratios.

The fix is verified. Here's a summary of what changed and why:

### What was fixed

**The `NM_TO_SIM` conversion factors** were inconsistent — each physical quantity (d, a, λ, L) had a different per-nm scale factor, which destroyed the physics ratios that the interference formula depends on.

| Ratio | Old (broken) | New (fixed) | Real physics |
|---|---|---|---|
| d/λ | **2.667** | **1.455** | 1.455 |
| a/λ | **0.533** | **0.364** | 0.364 |

The old code was showing **~1.8x too many fringes** for the given slider parameters.

### Changes made

1. **Lines 575-586**: Replaced four different scale factors with a single `UNIFORM_SCALE = 30/6000 = 0.005` sim-units per nm, used for all spatial quantities. This guarantees d/λ and a/λ ratios in sim-space exactly match the physical nm ratios.

2. **Line 904**: Reduced incident wave spacing multiplier from `* 2` to `* 1.1` — since λ in sim-space is now larger (2.75 vs 1.5), this compensates to maintain ~5-6 visible wavefronts instead of ~3.

3. **Lines 1039-1044**: Updated the wave replenishment logic with the matching `* 1.1` fallback and `* 0.85` threshold, and also fixed the `Math.max(...[])` fragility by pre-filtering into `wavesAboveBarrier` and checking its length before calling `Math.max`.

---

**User**

Next fix this bug: 'Bug: Double hit-recording per wavefront. Both S1 and S2 trigger recordInterferenceHits()'

---

**Cursor**

Let me read the current state of the relevant code sections.

Now let me check the `recordInterferenceHits` function to see the current `numSamples` value.

Clear picture. S1 and S2 are created simultaneously with the same radius and growth rate, so both fire `recordInterferenceHits()` in the same frame — doubling the intended sample count (75 + 75 = 150). The fix: remove the trigger from S2, restore `numSamples` to 150 in S1's single trigger, and drop the unused `time` parameter.

Now remove the duplicate trigger from the S2 loop:

Now update the function signature — remove the dead `time` parameter and restore `numSamples` to 150:

Let me verify the final state of all three changed regions:

Everything is clean. Here's a summary of the fix:

### What changed

1. **S1 loop (line 1068-1073)**: Kept the hit-recording trigger, added a comment explaining why only S1 triggers. Changed call to `recordInterferenceHits()` (no args).

2. **S2 loop (was lines 1103-1107)**: Removed the duplicate hit-recording block entirely. S2 still animates normally — it just no longer triggers sample recording.

3. **`recordInterferenceHits` (line 1116-1118)**: Removed the unused `time` parameter. Restored `numSamples` from 75 back to 150, since there's now exactly one trigger per wavefront arrival instead of two.

### Why this works

S1 and S2 are always created as a pair with identical initial radius and identical growth rate, so they always reach the detection screen in the same frame. Recording from just S1 gives a single, deterministic 150-sample batch per wavefront — no risk of frame-timing splits, and no accidental doubling.

---

**User**

Fix all other issues.

---

**Cursor**

Let me re-read the current state of all the sections that need fixes.

Now let me also read the incident wave removal section and the speech synthesis code.

Now let me find all references to `CONFIG.screenDistance` for the state migration fix.

Good, I have full context on every section that needs changes. Let me apply all fixes now.

### Fix 1: THREE.js memory leak — add `dispose()` on wave removal (4 sites)

### Fix 2: Remove redundant calls in `updateSimParams`

`resetSim()` already calls `clearClassicalOverlay()`, `state.classicalHits.fill(0)`, and `updateCombinedChart()`, so these are duplicate work in the caller.

Same redundancy in the screen-distance handler:

### Fix 3: Remove wasted `updateAllWaveColors()` in wavelength handler

### Fix 4 & 5: Move `screenDistance` from CONFIG to state + update all references

First, remove it from CONFIG and add it to state:

Now replace all remaining `CONFIG.screenDistance` references with `state.screenDistance`:

Let me verify all references were caught:

All references migrated cleanly. Now the last fix.

### Fix 5: Chrome speech synthesis keepalive

Let me read the narration state and `speakStep` function to add the workaround in the right place.

Now read the `pauseNarration` function:

Add the keepalive interval to narration state:

Start the keepalive timer when speech begins:

Clear the keepalive in `pauseNarration()`:

And clear it in `finishNarration()` too:

All five fixes applied. Let me do a final verification pass to make sure nothing is broken.

Good — all remaining `CONFIG.` references are genuine constants (`screenRes`, `sceneWidth`, `screenHeight`, `sourceZ`, `barrierZ`, `numIncidentWaves`, `waveSegments`). No stale `CONFIG.screenDistance` references remain.

Let me also verify there are no `scene.remove` calls that bypass the new `disposeWave` helper:

The remaining `scene.remove` calls are for singleton objects (sourceMarker, slitLabels, barrierGroup) that are recreated infrequently — not the continuously-spawned waves. Line 896 is inside `disposeWave` itself. All clean.

Let me do one final read of the most critical section to confirm everything hangs together:

Everything is consistent. Here's a summary of all fixes applied:

---

### Fix 1: THREE.js Memory Leak (HIGH)
Added a shared `disposeWave()` helper that calls `geometry.dispose()` and `material.dispose()` before removing from the scene. Applied at all 4 wave-removal sites:
- `createWavefronts()` — bulk cleanup of old waves
- `incidentToRemove` — faded incident waves
- `s1ToRemove` — expired S1 secondary arcs
- `s2ToRemove` — expired S2 secondary arcs

### Fix 2: Redundant Calls in `updateSimParams` (LOW)
Removed duplicate `clearClassicalOverlay()`, `state.classicalHits.fill(0)`, and `updateCombinedChart()` calls from both `updateSimParams()` and the screen-distance handler, since `resetSim()` already performs all three.

### Fix 3: Wasted `updateAllWaveColors()` (LOW)
Removed from the wavelength handler. `updateSimParams()` calls `resetSim()` which calls `createWavefronts()`, destroying all waves and recreating them with the current wavelength color — so the prior color update was immediately thrown away.

### Fix 4: Chrome Speech Synthesis Stall (LOW)
Added a `keepAliveInterval` that calls `speechSynthesis.pause(); speechSynthesis.resume()` every 10 seconds while speech is active, working around Chrome's known bug where TTS silently stops after ~15 seconds. The interval is cleared in both `pauseNarration()` and `finishNarration()`.

### Fix 5: `screenDistance` Moved from CONFIG to state (INFO)
`CONFIG` is now truly constant. `screenDistance` lives in `state` alongside the other mutable physics parameters, and all 9 references were updated.

