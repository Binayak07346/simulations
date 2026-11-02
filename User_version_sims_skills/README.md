# User-version sim skills (guide v2: agreed 2026-10-05)

These are the skills for Cursor/Claude Code that bring the university-lab user-version sims to the agreed flow:
- a blackboard landing;
- a 4–6 step Simulation guide;
- a single Explore-freely trigger hint, closed within 3 s;
- voice on every card.

Plus the Guided Inquiry, Physics sheet and reset skills.

**The look comes from ONE shared stylesheet** (`fermi-sim.css`, the locked Horizon "A" look, on the CDN). `ui-stylesheet/` is the **last step for every sim**, after the UX skills. It wires the stylesheet in, with an inline fallback, light theme from the first paint, the guide outline/Play-tip patch, and the shared blocks moved into the stylesheet. Don't restyle sims or skills by hand; see `ui-stylesheet/SKILL.md`. The stylesheet source is `../design-system/fermi-sim-css/`. Start with `controls-tutorial/SKILL.md`. The shared engine and gates are in `sim-guide-kit/`, and its canonical examples are in `sim-guide-kit/examples/`. The top-level `examples/` folder holds older v1 builds.

- **Landing (2026-10-06): sims open DIRECTLY.** There is no overlay; ONE 5 s tip sits under the highlighted Simulation guide button. It is installed by the UI step and switched by the stylesheet (`--fsim-landing`). The blackboard board below remains only as a fallback.
- `mobile-app-mode/`: the **very last step**, after ui-stylesheet. `scripts/app_mode.py` adds the phone/tablet layer
  (fermi-app-mode; the desktop view is unchanged), and `scripts/app_mode_check.mjs` is its gate. Built into the
  jee-v2 and ai-v2 chains; run it by hand for uni-lab builds and for any sim made elsewhere before it goes live.
- `ui-stylesheet/`: the **UI step (run LAST, then mobile-app-mode)**. `scripts/ui_build.py` puts a UX-built sim on the shared stylesheet. Its gates are `sim-guide-kit/check.mjs` (outline-aware since 2026-10-06), `scripts/lastcard.mjs` (last card clear of Play) and `scripts/fallback.mjs` (the built-in copy looks the same when the CDN is blocked). It reproduces the live uni-lab builds byte for byte. AI-course pilot: `wv-plucked-string` (2026-10-06).
- `sim-guide-kit/`: the shared **guide v2** engine (2026-10-05, owner and senior-SME approved). It contains:
  - `layer.html`: the blackboard landing, the 4–6 step Simulation guide and the Explore-freely trigger hint;
  - `build.py`: installs it from one per-sim `spec.js` and adds ElevenLabs clips;
  - `check.mjs`: the 21-check headless gate;
  - rules: `GUIDE_STRUCTURE.md`, `PLAIN_LANGUAGE.md`, `SPEC_FORMAT.md`;
  - three finished examples: pendulum, double slit, train.
- `controls-tutorial/`: the **Simulation guide v2** and the Explore-freely hint. One sim or batched fleet rollout via `sim-guide-kit`. The October purple-callout guide is in `references/legacy-v1.md`.
- `welcome-overlay/`: the **blackboard landing board** (part of guide v2). "Welcome to" plus the title, one line, and two choices (Guide me / Explore freely); the sim waits for Play. The October two-mode liquid-glass welcome is in `references/legacy-v1.md`.
- `guided-inquiry/`  — the POE card grammar for Guided Inquiry (gated
  predicts with misconception feedback, observe-asks / resolve-tells, staged
  anti-lookup reveals) plus the 🧭 Guided Inquiry button contract
  (mutual exclusion with Controls Guide, free-exploration handover,
  no Lecture mode).
- `physics-sheet-upgrade/` — the ⚛︎ **The Physics** sheet (v2): fixed-size, statement-led, sectioned pop-up with a
  See-it box after each physics section. Works from a RAW sim (no sheet): `kit/install.py` → author
  `article.html`/`persim.html`/`edits.py` → `kit/build.py` → `kit/check.mjs` gate. Shell and pre-shell QM families
  both supported. Start at its `SKILL.md`.
- `examples/` (**v1, legacy**: the October welcome and guide design; for the v2 guide use `sim-guide-kit/examples/`). `L2-Newtons-laws.all-three-skills.html` is the dry-run
  proof: all three skills applied in order to an untouched prod sim (copy
  polish + Lecture removal, 9-step guide, welcome), browser-tested. `L4-Forces_on_objects.all-three-skills.html` is the second
  dry-run proof (incline-only controls via `__cgPrepare`). `Double-slit-experiment.welcome-cards.html` (all three skills on a
  production Three.js sim — browser-tested) and
  `L1-Solar_System_Orbits.final-two-button.html` (both flows together).

For the **guide v2** (welcome-overlay + controls-tutorial), the gates are `sim-guide-kit/check.mjs` and `sim-guide-kit/regress.mjs`. In those two skills, `references/implementation.md` and `scripts/verify.js` are v1 legacy. The other skills keep their `SKILL.md` (rules + workflow), `references/implementation.md`
(verbatim code blocks with ADAPT markers) and `scripts/verify.js`
(config-free jsdom gate; `npm i jsdom` once; always pass `--baseline
<original.html>` so CDN-library errors don't count against you).

## Safety + layout gates (run on every build)

- `tests/kernel-diff.mjs <original> <build>` — the production sim is intact:
  every original script byte-identical (physics/controls untouched), no id,
  canvas or visible text removed, styles append-only. `--allow-script-edits`
  downgrades sanctioned L-series in-script deltas to reviewed warnings.
- `tests/canvas-check.mjs` — proves the layers did not corrupt any rendering
  buffer (parse-time-sized canvases ship stretched while every structural gate
  passes; caught two builds this way).
- `tests/layout-probe.mjs <build>` — the inquiry sits in the cross-course
  layout (right column, first block under the top bar, controls below).
- `tests/sim-guide-scene.mjs <build> --original <orig>` — the Simulation
  guide scene tour in real headless Chrome (puppeteer-core + system Chrome;
  runs where Playwright is missing): two-card landing, header label + no
  header wrap vs the original, every spot step on screen with its callout,
  no state change from scene steps, spotlight follows the sidebar HIDE tab
  (ResizeObserver), clean teardown. Validated against known-broken builds
  (pre-ResizeObserver Twin Paradox; a step that moves a slider).

## Browser test (mandatory before delivery)
`tests/browser-smoke.js` runs the templated sim in real Chromium:
`npm i playwright && npx playwright install chromium` once, then
`node tests/browser-smoke.js patched.html --baseline original.html --shots shots/`.
Offline, add `--cdn-map tests/cdn-map.json` after vendoring the sim's CDN
libs (`npm pack three@0.128.0 chart.js@4.4.0`, extract, fix paths in the
map). Add a `<sim>.checks.js` for per-card state assertions
(`tests/double-slit.checks.js` is the worked example). Run it again with `--theme-toggle <selector>` on sims with a theme switch and
once with `--viewport 1024x768`; it includes an alpha-aware contrast check.
Review screenshots (both themes).

Suggested order per sim: guided-inquiry first (if the sim has/needs one),
then controls-tutorial (controls walk + scene tour — the scene tour needs the
inquiry's answer list), then welcome-overlay, then every verifier plus the
browser smoke and `tests/sim-guide-scene.mjs`, then `ui-stylesheet` (its own gates), and **last `mobile-app-mode`** (`app_mode.py` + `app_mode_check.mjs`).

## Card voiceover + Auto walkthrough (added Sept 2026, validated on C025)

Both flows can carry narration: a Listen row (play/pause + Auto pill) above
the Guided Inquiry pager, and a two-row Controls Guide nav (transport + Auto
over the card nav). One shared speech engine drives both — per-card
play/pause/resume/replay, card-synced narration on every navigation route,
and Auto walkthroughs (the inquiry Auto waits at prediction gates, reads the
feedback after the student commits, then continues; it never answers).
Everything — engine, markup, CSS, controller deltas, the behaviour contract,
and the hard-won Chrome TTS pitfalls (deferred speak, guarded cancel, remote-
voice hang watchdog, real-gesture-only testing) — is verbatim in
`controls-tutorial/references/implementation.md` §6; the guided-inquiry and
welcome-overlay SKILLs point there. Apply it after the three base skills.
The reference build is `../sim-use-builds/C025-projectile-motion-ground-to-ground.html`.
