---
name: mobile-app-mode
description: The LAST step for every user-version simulation, after ui-stylesheet. Adds the fermi-app-mode layer (v1.0.0) so the sim adapts by itself to phones and tablets (the Android app's full-screen landscape player and mobile browsers) while the desktop view stays byte-for-byte unchanged. One command (app_mode.py) plus one gate (app_mode_check.mjs). Built into jee-v2/chain.py and ai-v2/chain.py; run it by hand for uni-lab builds and for any sim made outside these pipelines before it goes live.
---

# Mobile app mode (the step after ui-stylesheet)

**What the sim gets.** One inline `<script id="fermi-app-mode">` right before the last `</body>`. It is the same
layer that has been live on all 356 stage + testprep sims since 2026-10-30.

- **Mouse / trackpad (desktop, laptop):** the layer's first statement returns, so nothing changes.
- **Touch screen** (`pointer: coarse`), with no URL flag needed:
  - The sim's own top bar is hidden and the drawing fills the screen.
  - **Phone:** the sidebar becomes a 300 px drawer with *Guided Inquiry* / *Controls* tabs. A top card holds
    Play/Reset, Speed, the top bar's other controls, Simulation guide, The Physics and Teach me.
  - **Tablet** (≥ 900×560): the panel is docked on the right at 340 px and collapses with ›.
  - Read-outs float as a draggable chip, the Physics sheet opens full screen, and the sim shows its own small
    Controls / Play / Reset rail.
- **Overrides:** `?app=1` forces the mobile view on (testing on desktop); `?app=0` forces it off.
- **Page types handled:**
  - the shell (`#shell` grid);
  - the QM fixed and flow layouts;
  - the 3D shell variant (`#shell.mm-3d-shell`);
  - "stage" pages (floating cards or floating-panel labs such as Circuit Lab, C161).

**Native app protocol.** Vicky's Android player calls these with `evaluateJavascript`; no listener is needed.

| When | Call |
|---|---|
| page loaded | `FermiAppMode.handle({cmd:'native-rails'})` (hides the sim's own rail; the app's rails take over) |
| Controls | `FermiAppMode.handle({cmd:'panel'})` (toggles the drawer; `{open:true/false, tab:'controls'/'inquiry'}` optional) |
| Play/Pause, Reset | `{cmd:'toggle-play'}` / `{cmd:'play'}` / `{cmd:'pause'}`, `{cmd:'reset'}` |
| others | `{cmd:'inquiry'}`, `{cmd:'guide'}`, `{cmd:'physics'}`, `{cmd:'back'}`, `{cmd:'insets', left, right, top, bottom}` (px) |
| icon state | `FermiAppMode.state()` returns a JSON string `{playing, panelOpen, tab, docked, caps:{play,reset,guide,physics,inquiry}}` |

## When
The full order of steps is:

1. guided-inquiry
2. sim-guide-kit (controls-tutorial + welcome-overlay)
3. the physics sheet
4. narration
5. ui-stylesheet, **with all its gates**
6. **mobile-app-mode** (this step)

Every existing gate runs on the file **before** this step, exactly as before. Some gates emulate touch screens
(`sim-guide-kit/regress.mjs` at 390×844; `design-system/fermi-sim-css/harness/capture.mjs`, `swapcheck.mjs` and
`component_values.mjs` mobile viewports), and they would switch app mode on. If one of them has to run on a
finished (app-mode) file, load it with `?app=0`.

## Workflow
`A=User_version_sims_skills/mobile-app-mode/scripts`

1. `python3 $A/app_mode.py <ui-build.html> <final.html>`
   - Inserts the layer, or replaces an older version of it (re-runs are byte-identical).
   - No other byte changes; it asserts that before it writes.
   - In and out may be the same file.
2. `node $A/app_mode_check.mjs <ui-build.html> <final.html> [--shots <dir>]`. It must say `app-mode check: PASS`. The checks:
   - **A, bytes:** final = ui build + one app-mode block, right before the last `</body>`.
   - **B, desktop:** 1440×900 and 1100×760 with a mouse. The layer never runs and the layout equals the input's.
     A sim whose own layout varies between loads is reported as noisy, not failed.
   - **C, phone:** 608×348 with touch. Checks:
     - app mode is on and the top bar is hidden;
     - the drawing covers ≥ 60% of the screen and there is no sideways scroll;
     - `state()` parses and `toggle-play` flips;
     - the drawer opens on screen;
     - the Physics sheet opens full width and Back closes it;
     - there are no page errors that the input doesn't also throw.
   - **D, tablet:** 1184×800 with touch. The panel is docked, the drawing is ≥ 50%, and there is no sideways scroll.
   - **Notes (not failures):** a panel without sliders (button-only sims); a Play button the sim keeps disabled
     (e.g. Galperin's Billiard locks Play until a prediction is committed).
   - **Verified against broken builds:**
     - The input without the layer fails A1, A2, C1 and D1.
     - A layer with its desktop guard removed fails B at both sizes.
3. `python3 $A/app_mode.py --check <files...>` reports, for each file, `current`, `old (x.y.z)` or `none`.
   Run it before an S3 push.

The browser comes from `$PUPPETEER_CORE` and `$CHROME`; the chains set both. Defaults: sim-foundry-v2's
puppeteer-core and the system Chrome. Keep it headless and at ≤ 3 pages at once. Under heavy load `page.goto` can
time out: re-run before calling that a failure.

## In the pipelines
- **jee-v2/chain.py and ai-v2/chain.py:** after the gates, they save `final/<slug>.pre-app.html`, apply app mode to
  `final/<slug>.user-version.html`, and run the check. They record `app_mode`, `app_mode_fails` and
  `app_mode_version` in `gates.json`.
- **deliver.py and replace_repo.py** (jee-v2) hold any final whose `app_mode` isn't `PASS` or which lacks the layer.
  A final from before this step must be re-run through chain.py.
- **Uni-lab user versions** (no chain script): run steps 1–2 by hand after ui-stylesheet.
- **Sims made outside these pipelines** (Sim Foundry, optics, CBSE, hand-built): run steps 1–2 before the sim goes live.

## Changing the layer
`fermi-app-mode.js` is the single source; `VERSION` must match its `__fermiAppMode = '<version>'` line, and
`app_mode.py` refuses a mismatch.

A new version is not live until every sim has been re-run through `app_mode.py` (it replaces the old block) and
pushed. The live sims carry their own inline copy. `app_mode.py --check` lists any file still on an old version.

**Never edit the copy inside a built sim; edit this file.**

## Don't
- Don't hand-edit the block in a sim.
- Don't strip the layer's `@layer fermi.tokens{…}` part: fermi-sim.css uses layered `!important`, and only that layer beats it.
- Don't put the layer before the sim's own scripts. It must run after them, at the end of the body.
- Don't add per-sim mobile CSS in the UX skills. Fix the layer and bump `VERSION`.
