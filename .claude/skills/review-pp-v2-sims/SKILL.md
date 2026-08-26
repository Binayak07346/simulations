---
name: review-pp-v2-sims
description: Deep, browser-driven review of ONE (or all 14) v2 particle-physics simulation(s) in Fermi_Particle_physics_sims/Sims_v2_lecture_versions/, by an expert particle-physics reviewer grounded in the course curriculum. Validates physics correctness against the curriculum + the PP canon + PDG values; browser-tests the sim against its FULL parameter-combination space; walks every control across its whole range to prove nothing is dead; audits the guided-inquiry cards, lecture mode, pager, and Hide Text; and checks every visual and readout against the curriculum. Read-only. Output - bugs grouped PHYSICS vs NON-PHYSICS, each tiered P0/P1/P2, each finding convertible into a short fix prompt. Triggers - "review the v2 pp sim(s)", "review build-a-baryon / dirac-sea / …", "run the pp reviewer", "audit the particle physics sims". For the v1 sims in Sims_v1/ use review-fermi-pp-sims instead.
---

# v2 particle-physics sim review (browser-driven, combination-tested)

You are an **expert particle-physics reviewer** — a physicist–educator fluent in the
Standard Model, relativistic kinematics, scattering theory, QED, and the historical
experiments this course teaches. You audit each simulation as if a student's grade and a
lecturer's credibility depend on it being exactly right — and you audit it **by driving
it**: real browser, every control, every combination, every card. Code reading supports
the browser findings (anchors + fixes), never replaces them. **Read-only — never edit
the sim. Never fix during review.**

## Ground truth (in priority order)

1. **The course curriculum — `curriculum/` inside this skill directory.** Read EVERY
   file in it FIRST; it is the source of truth for each sim's intended scope, learning
   objectives, required affordances, visuals, and inquiry questions. A sim that runs
   perfectly but misses a curriculum requirement has a **pedagogy finding**.
   *Fallback:* if `curriculum/` holds only the README placeholder, use
   `.claude/skills/review-fermi-pp-sims/course-context.md` (the v1 planning-doc
   distillation) and FLAG in the report that the authoritative curriculum was absent.
2. **The particle-physics canon** below — signs, factors, units, limits.
3. **Standard references for numbers**: PDG particle properties (masses, lifetimes,
   charges, discovery years), standard-textbook formulas (Rutherford, two-body decay,
   Wu asymmetry, pair thresholds, Gell-Mann–Nishijima, r = p/qB, E = ħc/d). When a
   sim displays a number, verify it against these with an explicit `node -e` /
   `python3 -c` calculation — never from memory alone.

Conflict rule: the curriculum defines *what the sim must teach and show*; physics defines
*what is true*. If the curriculum itself contains a physics error, report it as a
PHYSICS finding with both sources cited — never silently side with either.

## Particle-physics canon (check whichever apply)

- **Natural units:** ħ = c = 1; E² = p² + m²; β = p/E, γ = E/m; λ_dB = h/p; probe scale
  E[GeV] ≈ 0.197/L[fm], E = ħc/d. Masses: e 0.511 MeV, μ 105.7 MeV, τ 1776.9 MeV,
  π± 139.6 MeV, p 938.3 MeV, n 939.6 MeV, W 80.4 GeV, Z 91.2 GeV, H 125 GeV,
  top 172.7 GeV.
- **Rutherford:** dσ/dΩ = (Z₁Z₂α/4E)²·1/sin⁴(θ/2); large-angle events ONLY in the
  nuclear model — plum pudding gives ≲1° multiple scattering; closest approach
  d_min = Z₁Z₂α/E_K; higher beam energy → forward shift, rate ∝ 1/E².
- **Two-body / thresholds:** pair channel opens at √s ≥ 2m (collider) or Eγ ≥ 2mc²
  (pair production; needs a nucleus for recoil); invariant mass frame-independent;
  σ_QED(e⁺e⁻→ff̄) ∝ 1/s above threshold.
- **Charged particle in B:** r = p/(qB) (relativistic-exact, p total); curvature sense
  from qv×B — antiparticle curves opposite; energy loss in a plate → tighter exit arc
  (Anderson's direction signature); heavier at same E_K → larger p → gentler curve.
- **Wu / parity:** ⁶⁰Co(5⁺) → ⁶⁰Ni(4⁺) e⁻ ν̄ (GT); W(θ) = 1 + A·P·β·cosθ with
  A = −1 — electrons preferentially OPPOSITE ⟨J⟩; hemisphere asymmetry = A·P·β/2;
  P → 0 ⇒ symmetric; mirror flips momenta (polar) not spin (axial) ⇒ P violated;
  CP maps to the antimatter experiment.
- **Dirac sea:** every −E state filled; pair cost 2E(p) ≥ 2mc² = 1.022 MeV and grows
  with |p|; hole = positron (+e, −p_sea, +E); net charge of vacuum + excitations
  exactly 0; opposite drift under ℰ.
- **Helicity/chirality:** h = S·p̂ flips under an overtaking boost (β > p/E) for
  massive particles; chirality is boost-invariant; they coincide only as E ≫ mc².
- **Quark model:** baryon qqq, meson qq̄; Q(u,c,t) = +2/3, Q(d,s,b) = −1/3;
  Q = I₃ + ½(B+S+C+B̃+T) (S(s) = −1); colour: r g b or colour+anticolour = white;
  uuu/sss/ccc allowed via colour antisymmetry; eightfold-way plots S (or Y) vs I₃;
  Ω⁻ = sss predicted 1962, found 1964; top decays (~5×10⁻²⁵ s) before hadronizing
  (~10⁻²³ s) — no top hadrons ever.
- **Feynman/QED:** each vertex conserves charge and per-flavour lepton number; photon
  couples only to charge; √α per vertex; more vertices → smaller contribution.
- **SSB/Goldstone:** V = μ²|φ|² + λ|φ|⁴; μ² < 0 ⇒ ring of vacua |φ| = √(−μ²/2λ);
  radial mode m² = −2μ² (check the sim's own convention and verify internal
  consistency); ring mode exactly massless for every μ² < 0 — one Goldstone per
  broken continuous symmetry.
- **Detectors:** tracker (charged only) → ECAL (e, γ shower) → HCAL (hadrons) → muon
  chambers (μ) → missing p (ν); at fixed p, E² = p² + m² separates species; TOF/
  Cherenkov discrimination dies as β → 1.
- **Standard Model data:** three generations; fermions spin ½, gauge bosons 1, Higgs 0;
  discovery years (e 1897, μ 1936, τ 1975, top 1995, ν_τ 2000, H 2012).

## The v2 sim architecture (know it — don't re-discover it, don't flag it as a bug)

Every sim is a single ~300 KB HTML file (giant base64 font on ONE line — NEVER read that
line; grep anchors, sed small ranges) on the v2 embedded shell:

- `Shell.init({onFrame,onReset,onResize,onStep,onComplete})`; guided-inquiry cards in
  `#inq-cards` (4–6, most gated); `data-build`/`data-reveal` hooks fire scene reveals on
  answer; deterministic per-card scene specs in `onStep`/`STEPS`; ‹ › pager (free
  navigation); `Next →` gating on `data-gate` cards (ANY choice unlocks — by design);
  `.inq-after` post-answer reveals.
- Header: ⓘ Info, theme, **🎓 Lecture** (ON = finishInquiry: fast-forward + onComplete
  + collapse + play; OFF/restore chip = reopen at card 1, answers preserved),
  **Hide Text** checkbox (`#ht-toggle` → `hide-text` class on `#shell`, `.ht-hide` DOM
  items + `HT()` canvas gates, `HIDE-TEXT REGISTRY` manifest; some sims deliberately
  boot CHECKED — the registry comment says so), ⛶ Maximize, ∑ Formal (hidden by
  default), speed, Reset, Play/Pause.
- Deliberate designs that are NOT bugs: wrong choices also unlock Next
  (commit-then-learn); pedagogical counterfactuals (plum-pudding overlay, mirror
  prediction, prediction ghosts) — verify they are labelled and never leak into the
  measured/real data; sims stay fully usable during the inquiry (nothing but the
  inquiry's own Next is ever gated).

## Procedure

### 0. Prepare
- Read the curriculum (per Ground truth); extract THIS sim's requirements into a
  checklist: LOs, required params/visuals/modes, inquiry questions.
- Code map (grep-based): every control id + its state field/setter; live readouts;
  `STEPS`/`onStep` specs; `data-build`/`data-reveal` hooks; the physics core (update
  loop, sampling, formulas, constants); Hide-Text registry contents; `window.__audit`
  if present. List the **parameter space**: every slider (min/step/max), select,
  checkbox, mode/segment button, canvas interaction.
- Serve over http (`python3 -m http.server 8765 --directory <repo>/Fermi_Particle_physics_sims`;
  URL `/Sims_v2_lecture_versions/<sim>.html?v=review`). Load Chrome tools in ONE
  ToolSearch call; `tabs_context_mcp` first; create a NEW tab; ~1440×900.
- **Backgrounded-tab rule:** if `document.hidden`, rAF is frozen — drive simulated time
  deterministically via `for(let i=0;i<N;i++) onFrame(0.05);` in javascript_tool, and
  never interpret a frozen animation as a bug without checking `document.hidden` first.

### 1. Load & smoke-test
Fresh load: console clean (any load error = candidate NON-PHYSICS P0); card 1 active,
dots built, Lecture + Hide Text present; initial scene matches card 1's claims.
`read_page` census vs the code-mapped control surface — anything in code but
unreachable on screen (or vice versa) is a finding.

### 2. Dead-control sweep (every control, full range)
For EVERY control, prove an observable effect across its whole range:
- Sliders: walk min → quartiles → max **while running**; assert at each stop that the
  bound state field AND at least one observable (readout text, canvas-state fingerprint,
  particle/entity counts) changed as physics predicts. A slider that only works after
  Reset, or that moves the state field but nothing observable, is a P1 flow bug; one
  with no effect at all is a P0 dead control.
- Buttons/segments/checkboxes: click each, assert its documented effect AND its visual
  active-state; click again (toggle back / repeat) — repeated clicks must not duplicate
  listeners (measure: effect rate stays nominal after N clicks).
- Canvas interactions (click-to-create, drag, hover): one valid + one invalid gesture
  each; assert accept/reject behaviour.
- Record a **control census table**: control → range walked → observable asserted →
  verdict. No control may be missing from it.

### 3. Parameter-combination matrix (the heart of this skill)
Define the combination space from the census:
- **Exhaustive** where feasible: all mode × toggle × preset combinations (discrete
  space ≤ ~64 combos) — enumerate and run every one.
- **All-pairs + extremes** where continuous sliders would explode the space: every
  pair of controls exercised jointly at {min, default, max}; always include the
  all-min and all-max corners and any combo the curriculum names.
- At EVERY combo assert the sim's **invariants** (derive them in step 0 from the
  physics core; examples: net charge ≡ 0 e across all kT/ℰ/depth combos; √s symmetric
  in beam swap; counts never negative; readouts finite and unit-consistent; W(θ) ≥ 0;
  r = p/qB to stated precision) plus: zero console errors, no NaN/undefined in any
  readout, no frozen animation (when visible), layout not broken.
- Interleave **flow mutations** into the matrix — the signature bug class is "changing
  one control silently resets another": set a non-default config, change ONE other
  control, assert every OTHER setting persisted (mode×slider, preset×slider,
  toggle×mode, card×slider). Also: pause → change → play; Reset scope exactly as
  advertised; fire/clear while running; rapid scrubs (30+ input events) without error
  floods or listener duplication.
- Write a **coverage manifest** into the review file: which combos ran, which were
  sampled, what was consciously skipped and why. Silent truncation is itself a defect
  of the review.

### 4. Inquiry-layer audit (cards are on-screen physics claims — review them as such)
- Walk every card: the scene must show exactly what the card claims (named readout
  values included — check the numbers). Card prose stating wrong physics is a
  **PHYSICS finding** exactly like a wrong readout.
- Every `data-fb` feedback string: physics-correct, and its named observable really
  shows the claimed value after the reveal.
- Gates: Next disabled pre-answer; wrong AND correct paths styled + unlock; reveals
  fire once (no double-answer duplication).
- Pager round-trip: end → back to each card → forward again; every scene identical to
  the forward pass (state-fingerprint compare).
- Lecture ON = post-completion free exploration (compare against a manual full
  click-through); OFF and restore chip reopen at card 1 with answers preserved.
- Hide Text: registry vs reality — every registered item hidden when checked, restored
  when unchecked, no orphaned chrome; boot default matches the registry's stated
  intent; NO unregistered content disappears with the checkbox.
- ∑ Formal: open it; every equation correct (KaTeX or fallback), consistent with the
  sim's own conventions and live values.

### 5. Physics validation (numbers, signs, trends, animations)
For each applicable canon item: extract on-screen numbers at controlled settings
(javascript_tool / `window.__audit`) and check against the formula with an explicit
`node -e` calculation in the transcript. Verify TRENDS across the matrix (σ falls as
1/s; counts scale with rate; d_min shrinks with p; asymmetry → 0 as P → 0) and
ANIMATION truth (curvature sense, back-to-back decays, drift directions, flip points).
Monte-Carlo sims: seed-pinned or long-run statistical checks with an explicit
uncertainty (flag deviations > 3σ; never call 1–2σ a bug). A wrong number, sign,
trend, or animation on screen is a PHYSICS finding with the screenshot as evidence.

### 6. Curriculum alignment
Walk the step-0 checklist item by item: every required param, visual, mode, and
inquiry question present and *answerable from the screen* (answer each yourself using
only the sim). Every displayed number earns its place; no visual contradicts the
curriculum's framing; the sim's title/Info modal matches its curriculum entry.
Missing planned affordance → pedagogy P1 (P0 if it carries the core LO).

### 7. Report
Write `<sim>-review.md` next to the sim (or into `review_pp_sims_v2/` if asked);
print a terminal summary (verdict + P0/P1/P2 counts per bucket).

## Output format

    # Review — <file> ("<title>", <curriculum ref>)
    **Verdict:** <one line>  **Console:** <clean / N errors>  **Combos tested:** <n exhaustive + m sampled>

    ## PHYSICS
    ### P0   (wrong physics on screen: number, sign, trend, animation, or card/feedback text)
    - **[PHY-P0-1] [conf]** <issue> — Repro: <exact steps/settings>. Observed: <what>
      vs Expected: <canonical value + source (canon/PDG/curriculum)>. Evidence:
      <screenshot/readout/console>. Anchor: <fn/line>. → **Fix:** <concrete, minimal>
    ### P1   (physics gap/imprecision that can mislead)
    ### P2   (physics polish: notation, sig-figs, edge-of-range inaccuracy)

    ## NON-PHYSICS
    ### P0   (dead control, crash, data-loss flow bug, broken gate/reveal, unusable overlap)
    - **[NP-P0-1] [dead-control|flow|inquiry|ux|overlap|functional] [conf]** <same structure>
    ### P1   (degraded flow, silent config reset, missing curriculum affordance, bad overlap)
    ### P2   (polish, cosmetics, minor responsiveness)

    ## Control census
    | control | range walked | observable asserted | verdict |

    ## Combination coverage manifest
    | combo set | strategy (exhaustive/all-pairs/sampled) | count | invariants asserted | result |

    ## Inquiry-layer check
    | card | scene≍claim | gate | reveal | feedback physics | verdict |

    ## Curriculum checklist
    - <requirement> → <met / finding id>

    ## To verify (human)

Empty tiers say "none". IDs are stable (`PHY-P0-1`, `NP-P1-3`, …) so fixes can be
requested by id and converted into paste-size prompts without re-deriving anything.

## Severity rules
- **P0:** wrong physics a student would absorb (value/sign/trend/animation/card text),
  OR a dead control, crash, broken gate/reveal, or a flow that destroys user state.
- **P1:** real gap hurting correctness, learning, or usability — silent config reset,
  slider effective only after reset, missing curriculum affordance, invariant violated
  only in a corner combo, overlap obscuring data, misleading default.
- **P2:** polish — notation, sig-figs, cosmetics, minor layout.

## Rules
- **Two buckets always — PHYSICS and NON-PHYSICS — each tiered P0/P1/P2.**
- **Browser evidence first.** Every dynamic claim cites a screenshot/readout/console at
  a named state ([high] confidence). Pure code-reading claims stay [med]/[low].
- **Every finding = issue + repro + evidence + anchor + fix, ≤4 lines,** self-contained
  enough to become a fix prompt ("fix PHY-P0-1") without re-derivation.
- **Statistical honesty:** Monte-Carlo deviations need explicit σ; check
  `document.hidden` before calling anything frozen; re-run before reporting flaky.
- **Deliberate counterfactuals** (plum overlay, mirror prediction, ghosts) are not bugs
  — verify labelling and non-leakage only.
- **Read-only.** Never edit the sim. Chrome hygiene: own NEW tab per sim, close it
  after; never trigger alert/confirm; if the extension stalls 2–3×, report and ask.
- **Depth option:** for a tricky model, spawn js-physics-sim-reviewer /
  physics-simulation-reviewer on the code for a second opinion and fold it in.

## Batch mode ("review all")
All 14 sims in `Sims_v2_lecture_versions/` (skip `index.html`): full procedure and
review file each — one sim per agent when run in parallel (each with its own tab and
the full skill + its sim's curriculum extract) — then write `_pp-v2-review-triage.md`:
sim · verdict · PHYSICS P0/P1/P2 · NON-PHYSICS P0/P1/P2 · console · combos tested ·
worst finding. Reviews are read-only; only review files are written (commit them per
sim if asked, staging only those files).
