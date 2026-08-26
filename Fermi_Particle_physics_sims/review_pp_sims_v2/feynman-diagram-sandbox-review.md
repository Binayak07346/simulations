# Review — feynman-diagram-sandbox.html ("Feynman Diagram Sandbox", curriculum: Simulation Descriptions row "Feynman Diagram Sandbox" · Lecture 12 Scattering and Feynman Diagrams)
**Verdict:** Physics core fully clean — all 1296 in/out lepton-pair combinations produce exactly the independently-derived vertex verdict (charge vs per-flavour lepton number vs threshold), every σ number on screen matches LO QED to display precision, and the τ threshold, γ* q² = s label, sweep, gates and one-shot σ commit all behave as designed. One physics-presentation P1 (band curve stays the massless 1/s reference while titled as the built process) and one flow P1 (Reset desyncs the scene from the active inquiry card), plus polish.
**Console:** clean across 4 sessions (no pageerror; one 404 = `/favicon.ico` — the page ships no favicon link; server artifact, not a sim asset).  **Combos tested:** 1296 exhaustive (all in-pair × out-pair at √s = 3) + 42 threshold-grid (6 key combos × 7 √s incl. 3.54/3.55 straddle) + ~60 sampled (census walks, flow mutations, stress, corners).
**Method note:** headless Chrome (puppeteer) at 1440×900 + 1100×760; verdict chip lives on canvas, so it was read via a `fillText` interceptor; all synthetic pointer events (real-device drag → To verify).

## PHYSICS
### P0
none
### P1
- **[PHY-P1-1] [high]** The σ(√s) band always plots the massless reference σ₀ = 4πα²/3s but titles it with the built process: with e⁻e⁺ → τ⁻τ⁺ at √s = 4.00, header reads "σ(e⁻ e⁺ → τ⁻ τ⁺), log–log", yet the curve shows no τ threshold (curve ≈ 5.4 nb at 4 GeV; the measured point σ = 3.477 nb sits visibly below it), and the s·σ ring rides the 86.85 line while the Result panel reads s·σ = 55.69 nb·GeV². Card 5 sends students to "hunt the τ threshold" on this plot — the point dives, the curve doesn't. Repro: commit σ prediction → build e⁻e⁺→τ⁻τ⁺ → √s 4 GeV. Evidence: fds-08-band-tau4.png + roInv readout. Anchor: `drawBand` — 1/s curve loop uses `sigma0(v)`, title uses `r.proc` (~L1191–1205). → **Fix:** when a valid massive process is built, plot `sigmaOf(v, r.mf)` (threshold-cut curve, e.g. as a second line) or retitle the drawn curve "massless 1/s reference" and keep the process name only on the measured point.
### P2
- **[PHY-P2-1] [high]** "s·σ = 86.85 nb·GeV² (constant in √s)" line/label vs readout: at √s = 1.00 GeV (μ⁻μ⁺) roInv shows 86.79 nb·GeV² — the μ-mass β(3−β²)/2 factor (0.99927). Physically correct readout; the "constant" claim holds only in the massless limit. Evidence: numerics table, √s = 1 row. Anchor: `drawBand` invLong string. → **Fix:** append "(massless limit)" to the constant-line label.
- **[PHY-P2-2] [med]** Threshold message "✗ needs √s ≥ 3.55 GeV" rounds 2m_τ = 3.5537 down, so the literal claim is false for √s ∈ [3.550, 3.5537); unreachable via the log slider (adjacent ticks land at 3.5394 → 3.5539, so displayed "3.55 GeV" is always already allowed) — code-path only. Anchor: `analyze()` `thr.toFixed(2)` (~L860). → **Fix:** display `Math.ceil(thr*100)/100` ("3.56") or "3.554".

## NON-PHYSICS
### P0
none
### P1
- **[NP-P1-1] [flow] [high]** Reset desyncs the scene from the active inquiry card: `onReset` empties all four legs and resumes play, so with card 2/3/4/5 active the card asserts an on-screen state ("μ⁻μ⁺ passes both counts: ✓ QED allowed") while the canvas shows "empty diagram · legs 0/4". Repro: pager to card 3 → ↻ Reset. Observed live: before {proc e⁻e⁺→μ⁻μ⁺, ✓ QED allowed} → after {proc —, legs 0/4, card index unchanged}. Anchor: `onReset` (~L1443). → **Fix:** when the inquiry is open, re-apply the active card's spec after the field reset — `onStep(Shell.step)` — the same pattern applied to build-a-baryon's NP-P1-1.
### P2
- **[NP-P2-1] [overlap] [high]** Band x-axis title "√s (GeV)" (right-aligned at px1) overlaps the "30" tick label (centred at lx(30) = px1): renders as "√s (GeV)0" at every viewport tested (1440 dark, 1100 light). Evidence: fds-06/08/13 screenshots, bottom-right of band. Anchor: `drawBand` axis-title fillText at (px1, py1+4) vs tick loop. → **Fix:** right-align the 30 tick label or draw the axis title above the tick row / at px1 − 24.
- **[NP-P2-2] [ux] [med]** In the short band strip (118–190 px) the measured-point label "σ = 9.650 nb" can collide with the s·σ ring marker + label when √s sits near an anchor (seen at 1100×760, light, √s = 3). Legibility only. Evidence: fds-13-light-1100.png. Anchor: `drawBand` point-label offset logic (only avoids px1/py0 edges). → **Fix:** include the s·σ marker y in the label-offset test.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| √s slider (`slS`) | 0 → 250 → 438 → 500 → 750 → 1000 (0.50 → 30.0 GeV) while sim live | vS text; γ* label q² = s (0.25 → 900.0 GeV²); verdict flips at thresholds; band point/readouts | OK (snap to 1/3/10 verified: tick 438 → exactly 3.00) |
| sweep slider (`slT`) | 0 → 300 → 520 → 700 → 1000 | vT text; "virtual exchange — no trajectory" glow only mid-exchange (0.52 yes, 0.30/0.70 no) | OK |
| 6 particle chips (e∓ μ∓ τ∓) | select-toggle + drag + used across all 1296 combos | `.sel` class; slot fill; verdict updates | OK |
| Canvas slot click | assign (with selection), clear (filled, no selection), no-op (empty, no selection) | roProc, slot glyphs | OK |
| Canvas drag-drop | valid drop on in1; miss-drop outside slots | assign on hit; no assign + ghost removed on miss | OK (synthetic events; real drag → To verify) |
| Canvas scrub | click + 30-move drag across axis region | vT follows x; auto-pause | OK |
| `btnAuto` e⁻e⁺→μ⁻μ⁺ | single + 15× rapid | slots set, ✓ QED allowed; no listener duplication | OK |
| `btnClear` | after builds | slots emptied, panel hidden, "empty diagram" | OK |
| Play/Pause | toggle + 15× rapid | button text/state; sweep advances 0.17/s×speed, wraps 1.16→0.16 | OK |
| Speed select | 1× → 2× | wrap timing exactly 2× (0.65 + 2·0.17·1.5 s = 1.16) | OK |
| ↻ Reset | during inquiry + post-commit | fields reset, band re-locks until valid; D.pred deliberately survives (σ stays revealed) | NP-P1-1 (card desync) |
| Theme ☾/☀ | round trip | light vars applied; config persisted | OK |
| ⛶ Maximize | on/off | class + refit; config persisted | OK |
| ∑ Formal | on/off | section visible; KaTeX rendered (`#fEq2 .katex` present) | OK |
| ⓘ Info | open/close | modal open class; config persisted | OK |
| 🎓 Lecture / restore chip | on → off | completed state (μμ, σ revealed, collapsed, playing); reopen at card 1, answers preserved | OK |
| Hide Text | check → uncheck | `hide-text` class toggles; canvas-text delta 0, DOM-text delta 0 (registry empty — correct); boots unchecked | OK |
| ‹ › pager, Next/Finish | full round trips | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| in-pair × out-pair, all 6⁴ ordered slot fillings at √s = 3 | exhaustive | 1296 | on-canvas verdict === independent oracle (charge first, then per-flavour lepton number, then in-threshold 2m_in, then out-threshold "needs √s ≥ 2m_f", then ✓ QED allowed / ✓ + t-channel note / near-threshold β suffix); roProc symbol string; σ readout stays locked "—" pre-prediction (0 violations in 1296) | 1296/1296 match, 16 valid / 1280 flagged |
| Threshold grid: {ee→ττ, ee→μμ, ee→ee, ττ→μμ, μμ→ττ, ττ→ττ} × √s ∈ {0.5, 1, 3, 3.54, 3.55, 10, 30} | exhaustive on named corners | 42 | ✗↔✓ flip exactly between the 3.54/3.55 slider ticks (3.5394 < 2m_τ < 3.5539); β suffix values (0.01, 0.28, 0.46, 0.91, 0.93) match √(1−4m²/s); in-state τ beams flagged "✗ √s < 2m(τ)"; Bhabha always "+ t-channel (not included)" | all pass |
| σ numerics post-reveal | sampled | 6 (√s = 1, 2, 3, 6, 10, 30) | roSig = σ₀·β(3−β²)/2 to display precision (86.79 / 21.64 / 9.650 / 2.411 / 0.8685 / 0.0965 nb — 21.64 & 2.411 exactly explained by log-slider quantisation 2.0033/6.0024); roInv = s·σ = 86.85 (86.79 at 1 GeV → PHY-P2-1); anchors ◆ 86.85/9.65/0.87 = node calc | pass |
| Flow mutations | sampled | ττ + √s≈5 + 2× speed + paused × {theme, maximize×2, formal, info, pause→change→play} | no setting silently reset by any unrelated control | pass |
| Stress | sampled | 40× slT scrub + 40× slS scrub + 15× btnAuto + 15× play toggle + 30-move canvas drag | zero errors, readouts finite, single verdict chip, state consistent | pass |
| Corner cases | sampled | slider min 0.50 (μμ β = 0.91 near-threshold) / max 30.0 (q² = 900.0); exact √s = 2m_τ (code: `<` ⇒ allowed with β = 0, σ = 0 — slider cannot land there) | verdict + labels correct | pass |
| Skipped | — | σ-lock check re-run for every √s (checked at 1296 combos + 6 numerics points only); real-device pointer drag | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 recipe, not a picture | empty diagram, legs 0/4, paused, ▶ Play prominent; Play → sweep runs | ungated | — | — | OK |
| 2 what may V₂ emit? | e⁻e⁺ in only (legs 2/4), paused at 0.30 | ✓ (Next disabled pre-answer) | data-build e⁻e⁺→e⁻μ⁺ on answer → chip "✗ V₂: lepton number" exactly as all three choices claim; roProc gets ✗ | wrong path styled, correct highlighted, double-answer guarded; "fix it" btnAuto flips to ✓ QED allowed | OK |
| 3 now try τ⁻τ⁺ | μμ ✓ QED allowed baseline at √s = 3.00 | ✓ | data-build ττ → "✗ needs √s ≥ 3.55 GeV"; drag to 3.70 → "✓ · near threshold (β = 0.28)" (β verified) | 2m_τ = 3.55 GeV cost claim correct (3.5537) | OK |
| 4 read the γ* line | sweep at 0.52 mid-exchange; "virtual exchange — no trajectory" glowing; "γ* (virtual) q² = s = 9.00 GeV²" | ungated | — | — | OK |
| 5 double √s → σ? | μμ at 3 GeV, σ still locked "—" until commit | ✓ | one-shot commit: σ = 9.650 nb, s·σ = 86.85 revealed; curve + ◆ anchors + "your ÷4"/"your ×4" ghost + "actual at 2√s" drawn; ghost + reveal survive Reset (deliberate, per code comment) | "σ fall 9.65 → 2.41" and "s·σ stays 86.85" both verified live at 6.00 GeV; ×4/same/÷4 feedbacks each numerically right | OK |
| pager | 1→5→1→5: per-card fingerprints (canvas text census + readouts) identical across passes; answers preserved (cards 2/3/5 answered, 1/4 have no choices); prev/next disabled at ends; Finish collapses to free exploration, playing | | | | OK |
| lecture | ON from boot = completed state (μμ, σ revealed via inqDone, collapsed, playing, restore chip visible); OFF/restore → card 1, scene = card 1 spec, answers preserved | | | | OK |
| Hide Text | registry empty (registry comment says so); toggle produces zero canvas-text and zero DOM-text delta both ways; boots unchecked | | | | OK |
| ∑ Formal | KaTeX renders all 4 equations; M, ⟨\|M\|²⟩ = e⁴(1+cos²θ), dσ/dΩ = ⟨\|M\|²⟩/64π²s ⇒ σ = 4πα²/3s, β(3−β²)/2 factor — all canonical; the "1/s from flux×phase-space, not propagator" note is correct and matches the Info modal | | | | OK |

## Curriculum checklist
- Lecture 12 "Cross sections, exchange particles, interaction vertices, virtual particles" → **met** (σ readout + band; γ* exchange; V₁/V₂ enforce rules; "virtual — no trajectory" labelling)
- The lesson: invalid vertices rejected with the right conservation law (charge vs per-flavour lepton number) → **met** — 1296/1296 exhaustive verdict match; charge flagged before lepton number, each family counted separately
- "Feynman diagram builder / cross section calculator (simple interactions only, one-loop)" → **met as tree-level LO** (single s-channel γ*; no loop diagrams — see To verify on the "one-loop" phrase)
- Adjustable param "Scrub through time" → **met** (sweep slider + canvas scrub + Play sweep with replay flash)
- "Drag interactions or particles into the diagram builder" → **met** (drag and click-assign chips onto legs)
- "Compute amplitude off to the side" → **met** (Result panel σ / s·σ; full amplitude chain behind ∑ Formal)
- LO "Interpret a Feynman diagram qualitatively, then construct one" → **answerable from the screen** (card 1/4 interpret; cards 2/3 + sandbox construct)
- "Fermi's golden rule and cross section computation" → **partially**: no golden-rule statement by name; the flux × phase-space 1/(64π²s) narrative carries the equivalent point (reasonable for the sim's scope; the lecture column assigns golden rule to tutorial, not this sim)
- Learning mode Guided Inquiry → **met** (5 cards, gates on 2/3/5, predict-before-reveal σ)
- Title/Info modal vs curriculum entry → **met** (Info physics all verified: 86.85 nb·GeV², anchors, Bhabha t-channel caveat, √s ≪ M_Z validity)

## To verify (human)
- Curriculum phrase "one-loop": the sim is tree-level (one photon exchange, zero loops). If "one-loop" was meant literally (radiative corrections / running α), that is absent — the sim even pins α = 1/137.036 "no running" explicitly. Most likely the planning doc meant "single diagram"; confirm with curriculum owner.
- Chip drag-and-drop was exercised with synthetic PointerEvents (assign on drop verified); a quick manual drag on a real pointer/touch device would close the loop.
- PHY-P1-1 fix choice (threshold-cut curve vs relabel) is a design call — the current caption "◆ reference anchors · … massless beams" does partially disclose the massless curve.
- Exact threshold √s = 2m_τ uses strict `<` (allowed with β = 0, σ = 0) — only reachable programmatically; behaviour is physically sensible either way.

## FIXES APPLIED (2026-08-26)
Each finding was independently reproduced (headless Chrome 1440×900 + 1100×760, canvas `fillText` interceptor, `node -e` LO-QED recomputation) before any edit. Zero pageerrors before and after; post-fix σ readouts re-verified against σ = (4πα²/3s)·β(3−β²)/2 (86.79 nb at √s = 1 μμ, 9.650 nb at 3, 2.047 nb at 6.51, ττ 3.477 nb / s·σ 55.69 at 4.002 — all match node to display precision, slider snap/quantisation accounted for).

| ID | verdict | evidence / change |
|---|---|---|
| PHY-P1-1 | **CONFIRMED + FIXED** | Repro: ττ at √s = 4.00 → title "σ(e⁻ e⁺ → τ⁻ τ⁺)" over the smooth σ₀ curve (5.43 nb at 4 GeV), point σ = 3.477 nb visibly off it, no threshold (fds-pre-band-tau4-1440.png). Fix (threshold-curve option, keeps card 5's "hunt the τ threshold" truthful): `analyze()` now sets `r.mf`/`r.outOK` whenever the final-state pair is well-formed (even below threshold); `drawBand` draws the accent curve as `sigmaOf(v, r.mf)` cut exactly at √s = 2m_f, with the massless 1/s curve kept as a dashed muted "massless 1/s reference" (drawn only when the threshold is inside the plotted range, so μμ/ee stay a single curve). Point now sits on the labelled curve; threshold dive visible at 3.554 (fds-post-band-tau4-1440.png). |
| PHY-P2-1 | **CONFIRMED + FIXED** | Repro: chip "s·σ = 86.85 nb·GeV² (constant in √s)" vs roInv 86.79 nb·GeV² at √s = 1.00 (μ-mass factor; node: σ₀(1) = 86.8545, s·σ(μμ,1) = 86.79). Fix per review: chip now reads "(constant in √s, massless limit)" (short form "(massless limit)"). |
| PHY-P2-2 | **CONFIRMED + FIXED** | Repro: chip "✗ needs √s ≥ 3.55 GeV" at √s = 3.54 while 2m_τ = 3.55372; literal claim false on [3.550, 3.5537) (unreachable — adjacent log-slider ticks 3.5394/3.5539 — code-path only, as reviewed). Fix: `thr.toFixed(3)` → "✗ needs √s ≥ 3.554 GeV" (exact-value option); card 3's choice text, feedback (2m_τ = 3.554 GeV) and inq-after updated to keep the card's verbatim quote of the chip true. Live: card-3 build shows "✗ needs √s ≥ 3.554 GeV", drag past → "✓ QED allowed · near threshold (β = 0.01)". |
| NP-P1-1 | **ALREADY-RESOLVED** | Fixed by the systemic sweep (SYS-2) per task instruction — not touched. |
| NP-P2-1 | **CONFIRMED + FIXED** | Repro: axis title right edge at px1 = 1074 vs "30" tick spanning [1066.8, 1081.2] at the same y → 7.2 px overlap ("√s (GeV)0") at both 1440 and 1100. Fix: title drawn at px1 − 24 (review's option); post-fix bboxes disjoint at both viewports. |
| NP-P2-2 | **CONFIRMED + FIXED** | Repro at 1100×760, μμ, √s = 3: "σ = 9.650 nb" bbox [362.7–463.5]×[43.6–60.6] overlaps the "s·σ" label bbox [360.7–377.2]×[45.7–57.7]. Fix: point-label offset test now also dodges the s·σ ring + label zone (pushes the label to mY + 34, clamped above py1, which also clears the ◆ "9.65 nb" anchor caption); post-fix bboxes disjoint (fds-post2-band-mumu3-1100.png). |

Post-fix regression pass: full inquiry walk (cards 1→5, gates, card-3 data-build, card-5 one-shot commit) — σ locked "—" pre-commit, reveal + "your ÷4" ghost + "actual at 2√s" drawn, s·σ stays 86.85 as √s doubles; lecture-mode boot unchanged. Screenshots in the session scratchpad (fds-pre-*/fds-post-*/fds-post2-*).
