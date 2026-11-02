---
name: ui-stylesheet
description: The LAST step for every user-version simulation. It puts the sim on the shared Fermi sim stylesheet (fermi-sim.css, the locked Horizon "A" look). That is a navy top bar, a light-blue sidebar, the royal-blue Play pill, the navy HIDE tab, the guide cards and outlines, the Physics sheet and the Guided Inquiry colours, all from ONE CDN file that every sim reads. It also adds the inline fallback copy, light theme from the first paint, the guide outline/Play-tip patch, and moves the shared skill blocks into the stylesheet. Use it after the UX skills (guided-inquiry, controls-tutorial/sim-guide-kit, welcome-overlay, physics sheet) on any uni-lab, AI-course or JEE user-version sim. Also use it when asked to "apply the new UI/design/stylesheet", "wire the CSS file/CDN", or "decouple the CSS".
---

# UI step: the shared stylesheet (fermi-sim.css)

**What the sim gets.** Every user-version sim reads ONE stylesheet:

`https://d6jsp0m3kqowo.cloudfront.net/fermi-sim/v1/fermi-sim.css`

This is the shared address (the "channel"). It holds:
- the design tokens, named as in the main app (`study-tools-v2/frontend/src/design-system`);
- the `.fsim-*` component classes;
- the A look on the shells' own class names;
- the frame values of every calibrated sim;
- the CSS blocks that the skills used to copy into every sim.

A look change ships by publishing a new stylesheet version and moving the channel to it. **No sim is rebuilt.**

**Sources of truth.**
- The stylesheet source and build tools are in `design-system/fermi-sim-css/`; start with its README, CLASSES.md and TOKENS.md. **Never copy the kit, and never edit `dist/`.**
- The UX skills still write their own markup, behaviour and CSS. This step runs on top of them and changes nothing else.

## Landing: DIRECT (owner + manager, 2026-10-06)
There is **no landing overlay** any more:
- The sim opens straight into the simulation, ready to explore and paused until the learner starts it.
- ONE plain-text tip sits under the header's **Simulation guide** button: *"Open the **Simulation guide** for a 2-minute tour."*
  - It uses the Explore-freely hint's box, type and one-line form.
  - While it shows, the button is highlighted (white ring, lighter fill, pulse).
  - It closes after **5 s**, or earlier on ×, on the Simulation guide or Guided Inquiry, or when the learner uses the sim. No voice.
- The tour itself is unchanged and is opened from the header button.

**How it is built:**
- **This step installs it:** `apply.py --guide-mark` also applies `design-system/fermi-sim-css/tools/flow_patch.py` to the guide engine.
- **The stylesheet switches it on:** the engine reads the token `--fsim-landing: direct` (`_tokens/sim.css`, fermi-sim.css ≥ 1.3.2 on the shared address).
- **Fallback:** without the token (an older sheet, or the switch turned off on the CDN), the old start board shows. The landing can therefore be switched for one sim (`html[data-fsim-id="…"]{--fsim-landing:…}`) or for all of them from the CDN, with no push.

**Spec fields:**
- `title` and `blurb` only feed the board, which is the fallback now. Keep them correct.
- The Explore-freely `trigger` still drives the static-sim last card. Its hint no longer shows at landing.
- Don't add landing UI in a sim or a skill. Change `flow_patch.py` plus the token instead.

## When
Run it after every UX skill, and immediately before the mobile step:
1. guided-inquiry;
2. sim-guide-kit (controls-tutorial + welcome-overlay);
3. the physics sheet;
4. narration;
5. **ui-stylesheet** (this step), with all its gates;
6. **one-line sheet header** (`sheet-header/README.md`, `sheet_header.py` + `sheet_header_check.mjs`): moves the tutor
   link from the top bar into the Physics sheet header (owner 2026-10-13).
7. **mobile-app-mode** (`../mobile-app-mode/SKILL.md`, v1.1.1+): adds the phone/tablet layer to the finished file. Its
   gate proves the file changed by that block only and that desktop is untouched. Run every gate of this step
   on the file **before** steps 6–7.

Re-running a UX skill means rebuilding from its output and then running this step again. `ui_build.py` refuses an input that already carries the stylesheet block.

## Workflow for one sim
Set `U=User_version_sims_skills/ui-stylesheet/scripts` and `K=User_version_sims_skills/sim-guide-kit`.

0. **Tutor button first (before the guide build).** The guide builder only RENAMES an existing "Ask Euler" button to "Ask AI Tutor"; it never creates one. A sim that still has the legacy **ⓘ Info** button (every AI-course and JEE sim) must get the pill from this step, or it ships with Info and someone replaces it by hand:
   - `python3 $U/tutor_slot.py <in.html> <out.html>` puts `<a id="ask-euler" data-tutor-pending="1">✦ Ask AI Tutor</a>` where Info was (no `href` yet), and adds the `ask-euler.v1` token to `html[data-fsim-shared]` (re-run it on the UI build, because `ui_build.py` creates that attribute). Idempotent; `jee-v2/chain.py` and the AI chain call it.
   - **Wiring is a separate, later step:** `python3 $U/wire_tutor.py <map.json> <files...>` sets each `href` from the owner's link list; `wire_tutor.py --audit <files...>` lists buttons still pending. Run the audit before any publish. Links come from the owner; never guess one.
   - With the pill present, L4 passes (it only checks the label), so a built sim reads 21/22 with only N1 failing.
1. **Choose the options:**
   - `--layout qm-legacy`: the 13 older QM layouts (a `.top-bar` header or a bespoke header, not `.shell-header`). It scopes their extra selectors.
   - `--canvas-light`: only for a sim whose stage is painted dark by its canvas code even in light theme. The 15 SR sims need it. It maps canvas colours to light, keeping their hue.
   - `--sim-id <id>`: **only** for a calibrated sim, one listed in `design-system/fermi-sim-css/_generated/calibrated-ids.json` (the 116 uni-lab sims). It applies that sim's measured frame values.
     - **Leave it out for any other sim** (AI courses, JEE, a new sim). The sim then keeps its own spacing and gets the full A look.
     - The build refuses an uncalibrated id, because the fleet defaults were measured on other shells. On the AI pilot they removed the sidebar heading padding.
2. **Build:** `python3 $U/ui_build.py <ux-build.html> <scratchpad>/<slug>.ui.html [options]`. It prints which shared blocks moved into the stylesheet and how many `<style>` blocks stay inline.
3. **Gates (all must PASS):**
   - `node $K/check.mjs <ui.html> --shots <dir>`: the guide gate L1–X1. G3 counts the stylesheet-drawn outlines (`.fsim-guide-target`) as well as the chalk ones.
     - L4 (Ask AI Tutor) only needs the pill (step 0). The link itself is wired later from the owner's list; **never guess one.**
     - N1 (voice clips) fails on sims without the ElevenLabs narration manifest, such as the AI courses. Report both; neither is a UI failure.
   - `node $U/landing_check.mjs <ui.html> [--shots <dir>]`: the direct landing D1–D12 + X1. It needs the stylesheet with the switch on the CDN (≥ 1.3.2), or a local stand-in.
     - Run `check.mjs` (above) on the **UX build** (before this step). It has no stylesheet, so it shows the board, and its L/F checks still apply. On the UI build the board is gone by design, so use `landing_check.mjs` there.
   - `node $U/lastcard.mjs <slug> <ui.html> 1280x763 1512x860`: the last guide card overlaps neither Play nor "Press Play to start". It opens the tour from the board, or from the header button on a direct landing.
   - `node $U/fallback.mjs <ui.html>`: a normal load uses the CDN copy (`data-fermi-css="cdn"`). With the CDN blocked, the built-in copy takes over (`"inline"`) and every top-bar, sidebar, stage and HIDE-tab element looks the same.
4. **Look at the screenshots.** Use `check.mjs --shots`, plus Guided Inquiry with an answer picked, the Physics sheet open, and the sim running. Compare them with a live uni-lab sim of the same shell:
   - navy top bar with a white title;
   - light-blue sidebar with white controls;
   - royal-blue Play (Pause while running);
   - navy HIDE tab;
   - the new guide card with blue outlines (solid for controls, dashed for the scene parts they change).
5. **Sheet header:** `python3 User_version_sims_skills/ui-stylesheet/sheet-header/sheet_header.py <ui.html> <sheet.html>`, then
   `node .../sheet-header/sheet_header_check.mjs <ui.html> <sheet.html>`. It must PASS. Use `<sheet.html>` as the input below.
5b. **Mobile app mode:** `python3 User_version_sims_skills/mobile-app-mode/scripts/app_mode.py <ui.html> <final.html>`,
   then `node User_version_sims_skills/mobile-app-mode/scripts/app_mode_check.mjs <ui.html> <final.html>`. It must PASS.
   Ship `<final.html>`.
6. **Push:** stage S3, backup first, `--if-match` (`design-system/fermi-sim-css/tools/push_stage.sh --list`). The owner runs pushes.

## What NOT to do
- **Don't hand-edit chrome colours, fonts or spacing in a sim or a skill to restyle it.** The stylesheet wins (`!important` in a higher cascade layer), so the edit either does nothing or splits the look.
  - A fleet-wide look change goes in the stylesheet: a new version, verified on every live sim (`harness/swapcheck.mjs --ref <current version>`), then published.
  - A new UI component gets one `.fsim-*` class and its tokens there.
- **Don't stamp `--sim-id` on an uncalibrated sim.** Don't remove the inline fallback, the theme seed or the loader.
- **Don't rewrite the shells' class names.** The scripts rewrite `className` thousands of times; the stylesheet binds the legacy names instead.

## New shell family (first AI-course or JEE batch)
- **The A look:** the AI-course sims use the same 2-D shell as the uni-lab CM/condensed-matter sims (`.shell-header`, `.shell-btn`, `.ctrl-box`, `.shell-panel`), so it applies as it is. AI pilot: `wv-plucked-string`, 2026-10-06.
- **A family with other class names:** it needs its selectors bound in the stylesheet first. That means a new version, the swap check on all live sims (zero differences), and then publishing.
- **Frame values (spacing)** for a new family: probe it (`harness/component_values.mjs`) and regenerate (`tools/gen_sim_tokens.py`). Its ids then become calibrated.

## Report per sim
- the options used;
- the shared blocks moved;
- the gate results, with L4/N1 reasons when they fail;
- a screenshot set.
