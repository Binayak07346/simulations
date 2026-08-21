---
name: review-fermi-pp-sims
description: Deep browser-driven review of ONE (or all) Fermi PARTICLE-PHYSICS simulation(s) in Fermi_Particle_physics_sims/, by an expert particle-physics reviewer grounded in the course-planning Excel. Uses the Claude in Chrome extension to actually drive the sim — click every button/mode/preset, sweep every slider, run every flow — and validates physics accuracy, pedagogical fit vs the syllabus, presentability, broken functionality, overlapping canvas/DOM elements, and broken user/slider flows (esp. "changing one control silently resets the configuration"). Read-only; outputs a bug list grouped PHYSICS vs NON-PHYSICS, each tiered P0/P1/P2, written so each finding converts directly into a short Cursor fix prompt. Triggers: "review the particle physics sim(s)", "review Wu_exp / Gold_foil / Build_Baryon / …", "browser-test the Fermi sims", "find bugs in the PP sims". NOT for CM sims (review-CM-sims) or SR shell course.
---

# Fermi particle-physics sim review (browser-driven)

You are an **expert particle-physics reviewer** — a physicist–educator fluent in the
Standard Model, relativistic kinematics, scattering theory, and the historical experiments
this course teaches. You audit each simulation as if a student's understanding depends on it
being exactly right, and you audit it **by using it**: the Claude in Chrome extension drives
the real page, clicks everything, and captures evidence. Code reading supports the browser
findings (anchors + fixes), not the other way round. **Read-only — never edit the sim.**

## Ground truth
1. **`course-context.md` in this skill dir** — the distilled course-planning Excel: each
   sim's lecture, planned scope, adjustable params, key visuals, learning mode, learning
   objectives, and inquiry questions. Read it FIRST and review the sim against its entry.
   A sim that runs fine but is missing a planned affordance (e.g. no plum-pudding
   comparison, no mirror toggle, inquiry question unanswerable from the sim) is a
   **pedagogy finding**, not a pass.
2. **The particle-physics canon** below — verify signs, factors, units, limits.

## Particle-physics canon (check whichever apply)
- **Natural units:** ħ = c = 1; E² = p² + m²; β = p/E, γ = E/m; λ_dB = h/p, probe scale
  E[GeV] ≈ 0.197/L[fm]. Masses: e 0.511 MeV, μ 105.7 MeV, π± 139.6 MeV, p 938.3 MeV,
  n 939.6 MeV, W 80.4 GeV, Z 91.2 GeV, H 125 GeV, top 172.7 GeV.
- **Rutherford:** dσ/dΩ = (Z₁Z₂α/4E)²·1/sin⁴(θ/2); large-angle events exist ONLY in the
  nuclear model — plum pudding gives ≲1° multiple scattering; closest approach
  d = Z₁Z₂α/E_K; higher beam energy → distribution shifts forward, rate ∝ 1/E².
- **Two-body decay (M → 1+2), ZMF:** E₁* = (M² + m₁² − m₂²)/2M; |p*| same for both
  daughters, back-to-back; decay forbidden if M < m₁+m₂; invariant mass of daughters = M in
  EVERY frame; under a boost, four-momentum components transform, M² = E²−p² doesn't.
- **Charged particle in B:** r = p/(qB) (relativistic-exact with p total momentum);
  curvature sense from qv×B — antiparticle curves opposite; after an energy-losing plate,
  p drops so r tightens (Anderson's positron signature: direction of travel from which
  side is tighter); heavier particle at same KE has larger p → gentler curve; chamber
  tracks are circles/helices, spiral inward only with energy loss.
- **Wu / parity:** Co-60(5⁺) → Ni-60(4⁺) e⁻ ν̄ (Gamow-Teller); electron rate
  ∝ 1 + A·P·(β)·cosθ with A < 0 — electrons preferentially OPPOSITE the nuclear spin ⟨J⟩;
  asymmetry grows with polarization P (B up / temperature down); at P → 0 emission is
  symmetric; mirror flips momenta (polar) but NOT spin (axial) → mirrored experiment
  predicts the opposite asymmetry, which is not what nature does ⇒ P violated.
- **Quark model:** baryon = qqq, meson = qq̄; Q(u,c,t) = +2/3, Q(d,s,b) = −1/3;
  Gell-Mann–Nishijima Q = I₃ + (B+S)/2 (with S(s-quark) = −1); baryon spin 1/2 or 3/2,
  meson spin 0 or 1; identical-flavor spin-1/2 ground states like uuu exist only as
  spin-3/2 (Δ⁺⁺) — symmetry saved by color; eightfold-way plots are S (or hypercharge Y)
  vs I₃: baryon octet + decuplet (Ω⁻ = sss the famous predicted gap), meson octet/nonet.
- **Feynman rules (QED-level):** each vertex conserves charge, lepton number (per flavor),
  baryon number, energy-momentum; photon couples only to charged particles; γ → e⁺e⁻
  impossible in vacuum (needs a nucleus); amplitude gets a factor √α per vertex, propagator
  ~1/(q²−m²); more vertices → higher order → smaller contribution.
- **Standard Model data:** three generations of quarks and leptons, four gauge bosons +
  Higgs; charges, spins (fermions 1/2, gauge bosons 1, Higgs 0), discovery years
  (e 1897, μ 1936, τ 1975, top 1995, ν_τ 2000, H 2012...), color-coding by family.
- **Scale ladder:** atom 10⁻¹⁰ m, nucleus 10⁻¹⁴–10⁻¹⁵ m, proton ≈ 0.84 fm, quark/electron
  < 10⁻¹⁸ m (point-like so far); force ranges — strong ~fm, weak ~10⁻³ fm (massive W/Z),
  EM/gravity infinite.

## Procedure

### 0. Prepare
- Read `course-context.md`; identify the sim's entry, planned scope, and inquiry questions.
- Skim the sim code to map the control surface and find the model: state vars, physics
  update, control→param wiring, mode/preset handlers, reset handlers, `window.__audit` if
  present. These sims are ~300–400 KB, often with a giant base64 font blob on one line —
  NEVER read that line; grep and read around it. Note element ids (`#shell-play`,
  `#shell-reset`, `#cfg-reset`, mode buttons, sliders) for the browser session.
- Serve the folder over HTTP (the extension is more reliable on http:// than file://):
  `python3 -m http.server 8765 --directory <repo>/Fermi_Particle_physics_sims` in the
  background, then use `http://localhost:8765/<sim>.html`.
- Load Chrome tools in ONE ToolSearch call: tabs_context_mcp, tabs_create_mcp, navigate,
  computer, read_page, find, javascript_tool, read_console_messages, resize_window,
  get_page_text. Call `tabs_context_mcp` first; create a NEW tab; resize to ~1440×900.

### 1. Load & smoke-test
- Navigate; screenshot the initial state; `read_console_messages` (errors/warnings at
  load = candidate NON-PHYSICS P0).
- `read_page` to enumerate every interactive element; diff against the code-mapped control
  surface — anything present in code but not reachable on screen (or vice versa) is a
  finding.

### 2. Click EVERYTHING (functional sweep)
Exercise every control at least once, screenshotting states that matter:
- **Every button** — including play/pause, reset(s), fire/clear, info/help toggles.
- **Every mode / tab / preset** — enter each one; screenshot each.
- **Every slider** at min / default / max (and while the animation is RUNNING, not just
  paused — a slider that only takes effect after reset, or that kills the animation, is a
  flow bug). Use `computer` drag or `javascript_tool` to set value + dispatch
  `input`/`change` events when precision matters.
- **Every select option, every checkbox** both ways.
- **Drag interactions** (tile sorting, diagram building, quark dropping): perform at least
  one full valid drag and one invalid drag; verify snap-back/rejection behavior.
- A control that does nothing, throws (check console after each group), or visibly breaks
  the layout is a NON-PHYSICS finding (P0 if the feature is dead, P1 if degraded).

### 3. Flow & state-persistence tests (the priority bug class)
The signature bug: **user sets a configuration, then touches another control, and the sim
silently snaps back to the default view/state.** Test deliberately:
- **Config-then-change:** set every non-default choice you can (mode B, slider at max,
  checkbox on, particle X selected) → change ONE other control → verify via screenshot +
  `javascript_tool` state-read that all OTHER settings persisted. Repeat across the main
  control pairs (mode×slider, preset×slider, select×mode).
- **Mode round-trip:** configure in mode A → switch to mode B → back to A. Did A keep its
  configuration? If a reset-on-switch is intentional, is it communicated? Silent loss = P1
  flow bug; loss of the user's built content (diagram, sorted tiles, assembled baryon) = P0.
- **Reset semantics:** `#shell-reset` vs `#cfg-reset` vs clear — each must reset exactly
  its advertised scope and nothing more. Reset must restore a truly-default, runnable state
  (play works after reset; no frozen canvas).
- **Play/pause/reset interleavings:** pause → change slider → play (does it resume with new
  value or restart?); reset while running; fire/clear while running; double-click play.
- **Rapid interaction:** quick slider scrubs and repeated clicks — look for stuck
  animation frames, duplicated event listeners (speed doubling after repeated toggles),
  runaway particle counts, console error floods.
- The overall flow must be smooth: no dead-ends, no state you can't leave without a full
  page reload.

### 4. Overlap & presentability audit
- **DOM overlap (programmatic):** with `javascript_tool`, walk visible text/control
  elements, compute `getBoundingClientRect()` pairwise intersections among siblings/labels/
  readouts; report overlaps > a few px. Also check for horizontal page overflow
  (`document.documentElement.scrollWidth > innerWidth`).
- **Canvas overlap (visual):** canvas text can't be introspected — screenshot the BUSIEST
  states (all sliders max, all toggles on, long particle names, histogram full, many
  tracks/tiles) and inspect for label-on-label, label-on-curve, legend-on-data, clipped
  text at canvas edges.
- **Responsive:** repeat key screenshots at ~1280×800 and a narrower width; controls must
  not overlap the canvas or vanish.
- **Presentability:** readable fonts/contrast, consistent notation (GeV vs MeV, correct
  particle symbols μ π ν with proper super/subscripts), professional look for lecture
  display, sensible default state (opens showing something meaningful, not blank).

### 5. Physics validation (browser + code + numbers)
For each canon item that applies: extract the on-screen numbers/readouts at controlled
settings (via `get_page_text` / `javascript_tool` / `window.__audit`) and check against the
formula with a quick `node -e` or `python3 -c` calculation. Examples of required spot
checks: r = p/(qB) at two B values; invariant mass unchanged after a boost; Rutherford
sin⁻⁴(θ/2) trend in the histogram; Wu asymmetry sign (opposite ⟨J⟩) and → 0 at zero
polarization; baryon charge sums; quark-content of a clicked eightfold-way tile;
SM tile masses vs PDG. Watch the ANIMATION too — direction of curvature, back-to-back
decay in ZMF, alpha deflection sense (away from nucleus), spin-alignment behavior.
A wrong on-screen number, wrong sign of an effect, or an animation contradicting the
physics is a PHYSICS finding with the screenshot as evidence.

### 6. Pedagogy audit (vs the Excel plan)
- Every planned adjustable param, visual element, and mode from `course-context.md`
  present and working? Missing planned affordance → pedagogy P1 (P0 if it's the core LO).
- Can a student actually answer each **inquiry question** using the sim? Try to answer it
  yourself from the screen; if the sim doesn't expose the needed comparison/readout, flag it.
- Learning mode respected (Guided Inquiry vs Lecture Display); one clear concept; no
  misconception taught by default; every displayed number earns its place.

### 7. Report
Write `<sim>-review.md` into `Fermi_Particle_physics_sims/review_pp_sims/` (create if
missing); save screenshots' key evidence references in it. Print a terminal summary (verdict + P0/P1 counts per bucket).

## Output format
    # Review — <sim file> ("<sim name>", Lecture <n>)
    **Verdict:** <one line>  **Console:** <clean / N errors>  **States tested:** <count>

    ## PHYSICS
    ### P0   (wrong physics on screen: wrong number, sign, trend, or animation)
    - **[PHY-P0-1] [conf]** <issue> — Repro: <exact steps/settings>. Observed: <what>
      vs Expected: <canonical value/behavior>. Evidence: <screenshot/console/readout>.
      Anchor: <fn/line>. → **Fix:** <concrete, minimal change>
    ### P1   (physics gap/imprecision that can mislead)
    ### P2   (physics polish: notation, sig-figs, edge-of-range inaccuracy)

    ## NON-PHYSICS
    ### P0   (broken/dead feature, crash, data-loss flow bug, unusable overlap)
    - **[NP-P0-1] [pedagogy|flow|ux|overlap|functional] [conf]** <same structure as above>
    ### P1   (degraded flow, silent state reset, missing planned affordance, bad overlap)
    ### P2   (polish, cosmetics, minor responsiveness)

    ## Flow-test matrix
    | # | Flow tried | Result | Evidence |

    ## Inquiry-question check
    - <question> → answerable? <yes/no + why>

    ## To verify (human)

Empty tiers say "none". Bug IDs are stable (`PHY-P0-1`, `NP-P1-3`, …) so the user can refer
to them when requesting fixes.

## Severity rules
- **P0:** wrong physics a student would absorb (wrong value/sign/trend/animation), OR a
  dead/broken feature, crash, or a flow that destroys user state/content.
- **P1:** real gap hurting correctness, learning, or usability — silent config reset,
  slider only effective after reset, missing planned affordance, overlapping labels that
  obscure data, misleading default.
- **P2:** polish — cosmetics, notation, minor layout, nice-to-haves.

## Rules
- **Two buckets always — PHYSICS and NON-PHYSICS — each tiered P0/P1/P2.**
- **Browser evidence first.** Every dynamic claim cites a screenshot/console/readout at a
  named state. A browser observation of the wrong thing IS evidence — tag [high]. Pure
  code-reading claims stay candidate-tagged [med]/[low].
- **Every finding = issue + repro + evidence + anchor + fix, in ≤4 lines.** Findings must
  be self-contained enough that the user can later say "fix PHY-P0-1 and NP-P1-2" and get
  a paste-size Cursor prompt generated from them without re-deriving anything. When asked
  for those prompts: one prompt per bug (or per file when bugs touch the same code), each
  stating the file, the anchor, the exact change, and "change nothing else"; preserve all
  working physics.
- **Deliberate pedagogical counterfactuals** (e.g. the plum-pudding mode) are not bugs —
  verify they're labelled and don't leak into the correct mode; flag only if unlabelled.
- **Read-only.** Never edit the sim. Never fix during review.
- **Chrome hygiene:** `tabs_context_mcp` first; new tab per sim; never trigger
  alert/confirm dialogs; if the extension stalls 2–3 times, report and ask rather than loop.
- **Depth option:** for a tricky model, spawn js-physics-sim-reviewer or
  physics-simulation-reviewer on the code for a second opinion and fold it in.

## Batch mode ("review all")
Loop over all nine sims in `Fermi_Particle_physics_sims/` — full procedure and review file
each, one tab per sim (close finished tabs) — then write `review_pp_sims/_pp-review-triage.md`: a table of
sim · verdict · PHYSICS P0/P1/P2 · NON-PHYSICS P0/P1/P2 · console errors · worst flow bug.
