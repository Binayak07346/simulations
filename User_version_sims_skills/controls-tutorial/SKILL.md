---
name: controls-tutorial
description: Install the agreed guide v2 on a university-lab user-version simulation. The guide v2 has three parts. (1) The Simulation guide: a 4–6 step tour that outlines the real scene parts with chalk lines, then the controls, and ends by pointing at Play. (2) The Explore-freely trigger hint: one small note on one control that closes itself within 3 s. (3) The blackboard landing (see welcome-overlay). It is built from one spec file per sim with the shared sim-guide-kit. Use when asked to add, upgrade or roll out the Simulation guide, controls guide, scene tour, "guide me", the free-exploration hint, or the SME-approved guide flow on one sim or a batch. Production sims: additive layer, anchor-asserted, gated by check.mjs.
---

# Simulation guide v2 (+ Explore-freely trigger hint)

This is the flow the owner and senior SME signed off on 2026-10-05, after three pilot rounds (pendulum, double slit, time-dilation train). It replaces the October "Simulation guide" (the purple-callout walk through every control). The old body is in `references/legacy-v1.md`.

Kit: `../sim-guide-kit/`. Read before writing anything:
- `GUIDE_STRUCTURE.md`: the shape of the tour;
- `PLAIN_LANGUAGE.md`: the wording;
- `SPEC_FORMAT.md`: how to write the per-sim spec;
- the finished `examples/`.

## What the learner gets
- **Landing (blackboard):** "Welcome to" plus the title, one line on what it is, what you do and what you see, and two choices: **Guide me →** (a 2-minute tour) and **Explore freely** (all controls open). The sim does not run. See the welcome-overlay skill.
- **Guide me:** 4–6 chalk-board cards.
  - First 2–3 "The simulation" steps outline the exact parts of the scene: silhouettes for 3-D parts, ellipses for small objects.
  - Then "Controls" steps, at most 3 controls each, grouped by the part they change. Each control card says what the control changes, with a yellow outline and a chalk symbol on that part.
  - The last step adds "Press Play to…"; Play pulses with a "Press Play to start" tag.
  - Pressing Play ends the tour with the experiment running. Done ends it with a ~3 s Play cue.
  - **Static sims** (no Play): the last card pulses the trigger control with a "Try …" line, and Done shows a ~3 s "Try it" cue on it. See "Static variant" in `GUIDE_STRUCTURE.md`.
  - The sim stays paused for the whole tour.
  - Every card, **the last one included**, has the voice control.
- **Explore freely:** no guide card. One compact chalk note (≤ 12 words) points at ONE control, which pulses.
  - Dynamic sims: ALWAYS Play.
  - Static sims: the most telling slider or toggle.
  - It closes with a tick when the learner uses that control.
  - It **closes by itself after 3 s at most**; its spoken line may finish.
- **Never explained:** top-bar buttons, Reset, Play/Pause, speed, theme, Hide Text, legends, axes, badges, the HIDE tab.
- The header's "Ask Euler" becomes **"Ask AI Tutor"**; the builder does this.

## Safety stance (production sims)
- Additive layer only. The sim's physics, drawing, controls and Guided Inquiry are untouched.
- `hooks.py` may add **read-only** geometry hooks. Any sim fix needs the owner's OK and is listed in the report.
- `build.py` rebuilds from `work/<slug>/pristine.html` every time. It asserts every anchor and syntax-checks the guide scripts. It refuses to overwrite a repo file that changed since the snapshot (another session): stop and report, never force.
- Headless Chrome only (`check.mjs`). No visible windows.
- Commit only on request, one sim per commit, to the personal fork `origin` (Binayak07346/simulations). Never push to the company upstream.

## Workflow for one sim
Set `K=User_version_sims_skills/sim-guide-kit`.
1. **Set up:** `mkdir -p $K/work/<slug>`, and write `config.json` `{"sim":"<path under Fermi_university_sim_lab_sims/, or an absolute path>","slug":"<slug>"}`.
2. **Read the sim:**
   - **Its current Simulation-guide steps.** Look for `const steps = [`, `const cgSteps = [`, `cgSceneSteps`, `spot:` functions, and `window.__cgGeo` / `__cgSceneBox`. If its `cg*` helpers are private (inside a closure), copy their maths into spec.js or expose them with one read-only hooks.py line (`SPEC_FORMAT.md` → "Outlines").
   - **The ids:** Play, Reset and the sidebar controls.
   - **The engine contract** (`SPEC_FORMAT.md`): `#btn-gi`, `#btn-cg`, `__setMode`, a header, and a Play button whose text or aria-label says Play / Pause.
   - **EVERY Guided Inquiry card,** with its prompt AND its correct choice. The guide must state none of them, in text, in voice or in what the stage shows.
   - **What `__setMode('free')` reveals on this sim.** If it shows answers (shaded results, selected states), stage a neutral view with `__cgPrepare` / `start` / `end` / `onReset`.
3. **Write `spec.js`** (`SPEC_FORMAT.md`):
   - title and blurb;
   - 4–6 steps whose outlines come from the sim's own geometry;
   - `playText` / `playSay`;
   - the trigger.

   Add `hooks.py` only if a part has no geometry yet.
4. **Preview build:** `python3 $K/build.py $K/work/<slug> --out <scratchpad>/<slug>.html`. This adds the ElevenLabs clips; `--no-voice` skips them for quick layout passes. build.py also always writes `work/<slug>/built.html`, and warns if the repo file differs from git HEAD: mention that in your report.
5. **Gates (both must PASS):**
   - `$K/slot.sh node $K/check.mjs <scratchpad>/<slug>.html --shots $K/work/<slug>/shots`. Always run it through `slot.sh`, which caps parallel browsers.
   - `node $K/regress.mjs <original sim> <scratchpad>/<slug>.html $K/work/<slug>`: nothing else in the sim changed or broke.

   The check.mjs checks:
   - landing L1–L5;
   - guide G1–G11:
     - 4–6 steps, every target found, outlines drawn, ≤ 3 controls a step;
     - card on screen and off its targets, outlines on screen (G11), sim paused;
     - voice on every card, last card points at Play (static: at the trigger control);
     - Done cue, Play (static: the trigger) starts the run;
   - free F1–F4: one hint, at its control, gone within 3 s, sim waiting;
   - N1 every line voiced, including the combined last-card line;
   - X1 no page errors.

   Every check always prints a line. Any FAIL blocks the install.

   Then **look** at `shots/`:
   - every outline must sit on the part it names;
   - no card covers a key label;
   - the title fits;
   - direction words (left/right/top) match the picture.
6. **Install:** `python3 $K/build.py $K/work/<slug>` writes the repo file. Then run both gates on the repo file.
7. **UI step (last):** it also installs the **direct landing** (no overlay; one 5 s tip under the Simulation guide button, which opens this tour). Gate it there with `ui-stylesheet/scripts/landing_check.mjs`. `check.mjs` L1–L5/F1–F4 apply to the UX build only. Details are in `ui-stylesheet/SKILL.md` → "Landing: DIRECT".
   Also on the UI step: `ui-stylesheet/SKILL.md` puts the built sim on the shared stylesheet, which gives the A look. It also patches this engine: page controls are marked `.fsim-guide-target` and outlined by the stylesheet, and the last card keeps clear of Play and its tip. `check.mjs` counts those outlines (G3), so the same gate runs before and after the UI step.
   - **Sims outside the uni lab** (AI courses, JEE): `config.json` takes an absolute `"sim"` path.
   - **Older shells:** build.py renames "Controls Guide" to "Simulation guide" (label and tooltip).

## Batches (fleet rollout)
- **Size:** 8–12 sims per batch, one sub-agent per sim, each given this skill and one slug. Agents write only in their own `work/<slug>/`, and install only after their gate passes.
- **Coordinator, after each batch:**
  - re-runs `check.mjs` on every installed repo file;
  - spot-checks the screenshots;
  - updates the rollout list (`work/ROLLOUT.md`: slug, sim, steps, trigger, gate result, notes).
- **Families:**
  - 2-D canvas shells: the pendulum is the template;
  - Three.js / pre-shell QM: the double slit;
  - 3-D shells with `__cgSceneBox`: the train.
- **Static sims (no Play):** leave `play` out; `trigger.at` names the control; the last step's `playText` becomes a "Try …" line ("Static variant" in `GUIDE_STRUCTURE.md`).
- **Requirements:** python3, node, Chrome, puppeteer-core (`PUPPETEER_CORE`) and the ElevenLabs key. See `SPEC_FORMAT.md`.
- **Canonical examples:** `sim-guide-kit/examples/`. The Downloads pilots are older builds.
- **Status before the first batch** (2026-10-05): the three pilots are built in `~/Downloads/logged-in web's flows/`. 89 of the 116 sims expose `__cgGeo` / `__cgSceneBox`; 114 have scene-spot code to reuse.

## Report per sim (≤ 120 words)
- slug;
- the steps (titles);
- the trigger;
- results of both gates (check.mjs n/n, regress.mjs n/n);
- whether the repo file differed from git HEAD;
- any hook added;
- anything you could not outline, and why;
- open questions.

_`scripts/verify.js` and `references/implementation.md` in this folder belong to the v1 design (legacy). The v2 gate is `../sim-guide-kit/check.mjs`._
