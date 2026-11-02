---
name: mobile-app-mode
description: Make ANY HTML simulation adapt to phones and tablets (landscape app WebViews and mobile browsers) while its desktop view stays byte-for-byte unchanged. One inline layer (fermi-app-mode.js) that switches on only on touch screens. It hides the sim's top bar, makes the drawing fill the screen, turns the sidebar into a drawer (phone) or a docked panel (tablet), floats the read-outs, and exposes a tiny protocol a native app drives. Fermi page designs are detected automatically. Any other design (book sims, new templates) is mapped with a role map or data-fapp marks. Includes a probe (diagnose a sim), app_mode.py (insert/upgrade, byte-proven), bulk_apply.py, app_mode_check.mjs (gate: bytes, desktop inert, phone, tablet), a device preview, worked examples and the rollout playbook used for 363 live sims. Use when asked to make sims mobile/tablet friendly, phone/app ready, landscape ready, or to add the app mode to a sim or a pipeline.
---

# Mobile app mode: make any simulation phone- and tablet-ready

**What it is.** One self-contained script, `fermi-app-mode.js` (v1.1.1). It is inserted inline right before the
**last** `</body>` of a sim, plus an optional one-line role map before it. Nothing else in the file changes.

- **Mouse / trackpad (desktop, laptop):** its first statement returns, so the page is exactly as before.
  The gate proves it by comparing the layout against the original.
- **Touch screen** (`pointer: coarse`), with no URL flag needed:
  - The sim's own top bar is hidden. The drawing fills the screen and is told to refit (synthetic `resize`).
  - **Phone:** the sidebar or controls become a 300 px **drawer** with *Guided Inquiry / Controls* tabs, or one
    *Controls* tab when the sim has no inquiry. A top card holds Play/Reset, the top bar's other visible controls
    (Speed, modes…), Simulation guide, Physics and Teach me, spread full width.
  - **Tablet** (≥ 900×560): the same panel is **docked** on the right at 340 px and collapses with ›.
  - Read-outs float as a draggable chip. It starts folded on a phone if it would cover > 15% of the screen, and
    is hidden while the tablet panel is open.
  - The Physics/info sheet opens full screen. Big floating charts are scaled down, and drawings cut off at the
    bottom are refitted or made scrollable.
  - The sim shows its own small Controls / Play / Reset rail, unless a native app says it has rails.
- **Overrides:** `?app=1` forces the mobile view on (testing on desktop); `?app=0` forces it off.
- **Native-app protocol:** `FermiAppMode.handle({cmd})` and `FermiAppMode.state()` (see `references/native-app.md`).

It has been live on 363 Fermi sims since 2026-10-30: university lab, AI courses, JEE test prep and
testprep-stage.

## Files
| file | what |
|---|---|
| `fermi-app-mode.js`, `VERSION` | the layer (single source; `VERSION` must match its `__fermiAppMode` line) |
| `scripts/probe.mjs` | **start here for any sim**: before/after diagnosis on phone and tablet, what the layer detected, role-map candidates, screenshots |
| `scripts/app_mode.py` | insert or upgrade the layer in one file (`--roles` for a role map; `--check` reports versions) |
| `scripts/bulk_apply.py` | the same for a folder or list, with a per-file byte proof and a manifest |
| `scripts/app_mode_check.mjs` | the gate (A bytes · B desktop inert · C phone · D tablet). It must say PASS |
| `preview/index.html` | look at a sim inside a phone/tablet frame, with or without app rails, in a desktop browser |
| `examples/` | three non-Fermi "book" sims (header+sidebar, floating box, grid with marks) and their role maps; all pass the gate |
| `references/` | `adapt-a-new-design.md` · `how-the-layer-works.md` · `native-app.md` · `qa-and-rollout.md` · `lessons.md` |

**Needs:** Python 3.8+, Node 18+, and `puppeteer-core` (`npm i puppeteer-core`, or `$PUPPETEER_CORE` = path to its
entry) plus Chrome (`$CHROME`, else the standard install). Full `puppeteer` with its bundled Chrome works too.
Everything runs headless.

## Workflow for one sim (any design)
`A=<this folder>/scripts`

1. **Probe:** `node $A/probe.mjs sim.html --shots /tmp/p`
   - **BEFORE** shows today's problems on a landscape phone (844×390) and tablet: header height, the share of the
     screen the drawing gets, sliders below the fold, controls off the edge.
   - **AFTER** shows whether the layer switches on, which family it chose and which elements it took as
     header / panel / hero. Look at the shots.
2. **If it says "not detected"**, or it picked the wrong parts, map the roles. Prefer a role map: it doesn't touch
   the sim's markup.
   - Write `roles.json`, e.g. `{"header":".topnav","panel":".left","hero":".stage","play":"#play","reset":"#reset","readouts":"#readouts"}`,
     taking the candidates the probe printed.
   - Re-probe with `--roles roles.json` until AFTER is right. All roles and recipes for common structures are in
     `references/adapt-a-new-design.md`.
   - Alternatively, mark the markup with `data-fapp="header|panel|hero|play|reset|…"`. Marks win over the map.
3. **Convert:** `python3 $A/app_mode.py sim.html out.html [--roles roles.json]`
   - It is idempotent: a re-run is byte-identical and keeps the role map; an old block is replaced.
4. **Gate:** `node $A/app_mode_check.mjs sim.html out.html --shots /tmp/g` must print `app-mode check: PASS`. Notes are fine.
   - A FAIL means a real defect, with one exception: a `B-desktop` "noisy" note on a random or animated sim is
     reported, not failed.
5. **Look:** serve a folder holding the preview and the sim (`python3 -m http.server 8765 --bind 127.0.0.1`) and open
   `preview/index.html?sim=/path/out.html`. Check the phone with and without app rails, and the tablet.
   Open the drawer, run the sim, open its sheet, and press Back.
6. **Ship `out.html`.** Before any deploy, `app_mode.py --check <files>` must say `current` (or `compatible` for 1.0.0).

## Many sims / a whole site
Follow `references/qa-and-rollout.md`. The order that worked for 363 live sims:

1. **Probe a sample** of every page family.
2. **Pilot 3–5 sims** in the preview and get owner sign-off on the look before any bulk work.
3. **Fetch the deployed files** with their ETags or versions, and never assume the repo is what's live.
4. **Convert with `bulk_apply.py`**, then prove every output is its input plus the layer only.
5. **Gate every sim**, in parallel (≤ 3 browser pages per process; re-run timeouts at low concurrency before
   calling a failure). Triage flags into real defects and gate false positives. Fix real defects **in the layer**,
   never per file, bump `VERSION`, rebuild and re-gate everything.
6. **Push:** back up the deployed objects, push one canary and verify it, then push the rest with conditional
   writes (only if the deployed object is still the fetched one), then verify every served page.
7. **Sync the repo copies by inserting the layer in place.** Never copy deployed files over a repo that may hold
   newer uncommitted work. Then commit.
8. **Make the finishing pipeline add it:** the layer is the **last** step, after every other gate (next section).

## In a build pipeline
Every existing gate runs on the file **before** this step, then `app_mode.py`, then `app_mode_check.mjs`. Record the
result, and make delivery refuse a file without `app_mode: PASS`.

Gates that emulate touch screens (`isMobile`/`hasTouch`) would switch app mode on. Run them on the pre-step file, or
load the finished file with `?app=0`.

In this repo, jee-v2 and ai-v2 `chain.py` already do this (see the ui-stylesheet SKILL, step 6, for uni-lab).
Sims built outside a pipeline must run steps 3–4 before they go live.

## Changing the layer
- Edit `fermi-app-mode.js` and bump `VERSION` and the `__fermiAppMode` line together; `app_mode.py` refuses a mismatch.
  The layer must never contain a literal `<script` or `</script>`.
- Keep the desktop guard as the first statement. Keep fixes generic (keyed on page features, never on file names).
  Keep the `@layer fermi.tokens{…}` CSS block: it is how the layer beats stylesheets that use layered `!important`.
- Re-gate a sample of every family and the `examples/`. To prove the change is a no-op for existing pages, compare
  the old and new layer on real sims: same `<html>` classes, panel and hero rects, quick card and `state()`.
- Deployed sims carry their own inline copy. A new version is live only after re-running `app_mode.py` and redeploying.

## Don't
- Don't edit the block inside a built sim; edit the source here.
- Don't add per-sim mobile CSS to the sims or other skills. Map roles, or improve the layer.
- Don't insert the layer before the sim's own scripts. It must run after them, at the end of the body.
- Don't scale the page with CSS zoom or transform to "fit". Pointer maths in sims (`clientX - rect.left`) breaks.
  The layer refits, stacks side by side, or scrolls instead.
- Don't push without a backup and conditional writes. Don't trust a gate you haven't seen fail on a broken build.
