# Brief — write the v2 "⚛︎ The Physics" sheet for AI-course sims (author agent)

You are an expert physicist and teacher. You will write the new-format Physics sheet for each sim assigned to you, run
it through the UX + UI chain, and gate it. The owner is not monitoring: decide, fix, and report. Be careful, not fast.

## Situation
- The 137 AI-course lecture sims already have the Simulation-guide UX and the new Horizon UI (delivered in
  `~/Downloads/ai-courses-user-version/<course>/<slug>.user-version.html`). Their Physics sheet is the OLD v1 format (a
  7-chapter article, mini controls, self-test style). We are replacing it with the v2 sheet the 116 uni-lab sims have.
- v2 shape and rules: read, in this order,
  1. `.cursor/skills/physics-sheet-upgrade/references/builder-guide.md`   (the owner's rules; not negotiable)
  2. `.cursor/skills/physics-sheet-upgrade/references/lessons.md`
  3. `.cursor/skills/physics-sheet-upgrade/examples/L9/{article.html,persim.html,edits.py,install.json}`  (the model)
  (paths are relative to `/Users/admin/Desktop/simulations-1`)
- The old v1 sheets were audited physics: **reuse their correct content**, but re-express it in v2 shape (statement
  headings, 80–200 words per section, See-it box after each physics section, no self-test, no questions). Cut, do not pad.

## Your work dir, per sim: `~/ai-courses-physics-v2/work/<slug>/` (already prepared; write ONLY here)
| file | what |
|---|---|
| `RECON.md` | START HERE: live controls (ids, ranges, defaults), the sim's scene API (kit manifest param ids OR legacy `applyPhysicsScene` source), readout ids, every Guided Inquiry card with its CORRECT choice, lecture-notes anchors, the sim's info text |
| `v1/article.txt`, `v1/svgs/S*.svg`, `v1/persim.js` | the old audited sheet: prose, figures, and MINI/LIVE/SHOW (SHOW holds working scene configs for this sim's hooks; LIVE has the sim's own formulas) |
| `article.html`, `persim.html`, `edits.py`, `test.json` | YOU write these (starters exist). `kit/install.py` has already produced `pristine.html` — never edit it |
| `out.html`, `built.html` | build output (never hand-edit) |
| `final/` | chain output: UX build, `<slug>.user-version.html`, `gates.json`, `gates.log`, `shots/` |

Lecture notes: `~/ai-courses-physics-v2/notes/<course>.txt` (pdftotext; pages are separated by form feeds; `RECON.md`
gives the page/section). The sheet must agree with the notes and **use their symbols and the sim's own labels**. Never
invent or rename a symbol. If notes and sim disagree, say so in REPORT.md — do not "fix" either.

## AI-sim specifics (different from uni-lab)
- **Scene hook.** `window.__physicsHooks.scene(cfg)` already exists and `install.py` left it alone.
  - *kit family* (`window.__kit`, controls generated from a manifest): `cfg` keys are the manifest **param ids** (see
    RECON.md) plus `launch`/`playing`. It calls `freeExplore()` FIRST, which resets every control, so a See-it must pass
    the CURRENT value of every control it wants preserved (read them from `window.__kit.p`), unless it fixes a value
    deliberately. Things not in the manifest (a dragged point, a cone angle…) can't be staged by `scene`; use `run:`
    with the sim's own API if v1's SHOW did, else show the effect with the controls that exist.
  - *legacy family*: `applyPhysicsScene(cfg)`; keys are in the source printed in RECON.md (and in `v1/persim.js` SHOW).
  - The scene may restart/pause the run. Never stage a state the sim cannot reach.
- **Guided Inquiry gate.** Read all `.inq-step` cards in RECON.md. Set `data-gate-from="k"` on `<article>` to the 0-based
  index of the first section that states an inquiry answer. Sections before k, the "What you'll learn" bullets, the 01
  diagram and the kicker must give nothing away (a diagram that draws the result is a spoiler: draw the apparatus).
- **Controls table (section 02).** Real controls only, from the live DOM list in RECON.md. For kit sims the controls
  have ids like `p-<param>` (segmented controls: use the group container id or a `data-locate` on the first button's
  group; verify with the harness "every ⌖ target exists"). Skip theme / Info / Guided Inquiry / Simulation guide /
  Maximize. The header button for the sheet is `#toggle-formal`.
- **Light theme.** The final build is the light "A" look (the UI step), the sheet build still has both themes. Fix
  unreadable sheet/See-it colours only in `persim.html`, scoped to `html[data-theme="light"] …, body.light-theme …`.
- **Equations/figures.** Prefer Unicode + `<sub>/<sup>` (the sim's own notation). For a display equation or a computed
  diagram you may use `scripts/gen_assets.py` (LaTeX is installed) — or adapt a v1 SVG: recolour its black fills to
  `currentColor`, give every id a unique prefix (`d1-…`), and drop anything that states an inquiry answer before
  `data-gate-from`. Draw geometry from the sim's real defaults.
- **Verify every number** with node using the sim's own formulas (v1 LIVE and `window.__audit` help). Qualifiers
  (units, radians, frame, range the sim supports) stay.
- Never change the sim's physics, GI cards, controls or layout. If you find an error in the sim or the old sheet, say so.

## Loop for one sim (all commands from `/Users/admin/Desktop/simulations-1/.cursor/skills/physics-sheet-upgrade`)
```
export CHROME=/Users/admin/Desktop/simulations-1/.cursor/skills/physics-sheet-upgrade/ai-v2/chrome-quiet.sh   # REQUIRED: silent headless Chrome (the owner hears speechSynthesis otherwise)
export PSV2_SLOTS_DIR=/tmp/psv2-slots-ai PSV2_SLOTS=8 PUPPETEER_CORE=/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js
W=~/ai-courses-physics-v2/work/<slug>
python3 kit/build.py $W                                  # asserts anchors; writes $W/out.html + built.html
kit/slot.sh node kit/check.mjs $W                        # sheet gate on the SHEET-ONLY build (3–6 min). every line PASS
python3 ai-v2/chain.py <slug>                            # guide rebuild + UI + guide/landing/lastcard/fallback + sheet gate on the FINAL file
```
- NO SOUND: always `export CHROME=…/ai-v2/chrome-quiet.sh` (above) before ANY browser script, including your own puppeteer snippets (launch with `executablePath: process.env.CHROME`, `headless: 'new'`). The sims narrate with speechSynthesis, which `--mute-audio` alone does not silence. chain.py sets it for its own gates.
- Always run browsers through `kit/slot.sh` (many agents share the machine). Headless Chrome only, never a visible window.
- `kit/check.mjs` writes screenshots to `$W/shots/`: LOOK at every section (dark, light, 720p), every `see-*.png`,
  `gi-gate.png`, `phone-s1.png`. Check each See-it actually shows its Watch-for within ~10 s.
- `chain.py` expected results: `guide` = `20/22 PASS` with fails exactly `L4` (tutor link — owner supplies, never guess)
  and `N1` (voice clips — none for AI sims); `landing`, `lastcard`, `fallback`, `sheet_final` = PASS.
  Any other fail: investigate; fix if it is yours (sheet, persim, edits.py); if it is the sim's pre-existing layout or the
  other session's guide spec, do NOT change the guide spec or the sim — record it in REPORT.md.
- `test.json` demos only if you use scripted `data-demo` runs (see examples/L9).
- Self-review twice (physics professor: correctness, overstatement, qualifiers, spoilers, notes agreement; first-year
  student: clarity, jargon, reading load, does each See-it land). Rebuild and recheck until clean.

## Lessons from the pilots (read before writing)
- Env: do `. /Users/admin/Desktop/simulations-1/.cursor/skills/physics-sheet-upgrade/ai-v2/env.sh` at the start of EVERY Bash call that runs a browser/check/chain (shell state does not persist). It sets quiet CHROME, slots dir, slots. You still export PUPPETEER_CORE as shown below.
- Work dir is `~/ai-courses-physics-v2/work/<slug>/` (ignore `work/v2/<SLUG>` in builder-guide.md).
- Word cap: check.mjs counts ALL text in a section except svg, `.ps-try` and tables. Keep every section under 260 (aim 80-200). Summary is the usual offender.
- SPOILER: the guide kit copies the Summary "In one line" block above section 01 (`.gv-oneline`), so it is visible before the Guided Inquiry gate. The one-liner must state no inquiry answer (no values, rates, ranges, directions a card asks for). After chain.py, LOOK at `final/sheetcheck/shots` (the article-only harness does not catch it).
- Sections before `data-gate-from` only draw the apparatus: no dashed helper curves, rates, or results that a card asks.
- Hand-built SVG figures and `ps-chip` colour variants need their own dark AND light classes defined in persim.html (the guide mentions ps-cy/ps-am but they are not predefined). Figure text scales as `.fig max-width / viewBox width`: with viewBox 300 wide at max-width 460, 10.5px labels render ~16px; size accordingly.
- Legacy sims (thermal, waves): `applyPhysicsScene` calls `freeExplore()` first, which RESETS all controls to defaults, so pass every control you need in the scene cfg. A slider `input` event restarts the run at t=0 and plays; `setSlider` no-ops if the value is unchanged (dispatch an input event to force a restart). A See-it that lands on a degenerate value (e.g. equal frequencies) can stall the demo: guard it.
- Verify every number a See-it or sentence states with a node script using the sim's own formula (keep it as `verify.js` in the work dir).
- check.mjs takes 3-6 min and chain.py longer: batch your edits, do not rebuild per word. Run `kit/build.py` + check once per real change set, chain.py only when the sheet is clean.
- Rail labels: check.mjs requires each `data-short` to be a PREFIX of its `<h3>` text. Write headings whose opening words are the short label ("Same flux at any distance, set by the solid angle" -> data-short "Same flux at any distance"). Avoid `<sub>` in the label part.
- The controls section (02) is a table and legitimately lands ~35-60 words; the 80-word floor does not apply to it (only >260 fails anywhere).
- Use the readout labels the learner SEES in the live DOM, not the kit manifest labels (RECON.md lists both).
- Kit sims, See-it staging: manifest ids go in `scene`; anything else (positions, selections, angles) goes in `run:` which writes `window.__kit.s`, then clears `samples`, `sweep`, `drag`, `phiPos` if the sim has them, then calls `__kit.render()`. Set positions AFTER `scene` (a `surface`-type change can trigger the sim's own fix-up and move things). `scene` calls `freeExplore()` first (resets everything); `closePhys(true)` in a See-it forces the sim to play.
- Probing the sim yourself in free mode: the Guided Inquiry overlay blocks clicks; click `.welcome-mode[data-mode="free"]` first (as check.mjs `fresh()` does).
- Live panel on sims with no mini sliders: mirror the sim's own params with range inputs bound to its controls and derive results from the sim's own audit/readout functions, so sheet and sim cannot disagree.
- The saved-sheet download uses generic CSS: sim-specific SVG classes lose colours there, so put presentation-attribute fallbacks (stroke/fill) on figure parts and let persim.html override for the theme. `.ps-chip` colour classes are not provided; define your own with light-theme overrides.
- `assets/*.svg` previews are uncoloured; judge colours from the built sheet shots, not from assets.
- `final/` may hold stale files from earlier runs; trust only `gates.json` timestamps from your latest chain.py.
- Before your first edit: one old v1 claim can be wrong (a v1 claim ignored tilt in one sim). Re-derive each claim you keep; drop what you cannot verify from the sim's own code.
- Known kit gaps (do not fix, do not report again): download footer text says "self-test"; download CSS lacks `.ps-*` rules.

## Hard limits
- Write only inside your own `~/ai-courses-physics-v2/work/<slug>/`. Never edit `kit/`, `scaffold/`, `references/`,
  `ai-v2/*`, the sim-guide-kit, the ui-stylesheet tools, `design-system/`, `Fermi_university_sim_lab_sims/`, `AI courses sims/`,
  `~/Downloads/**`, or any other sim's dir. If a kit/harness problem blocks you, write it in REPORT.md as `KIT_ISSUE:` and
  work around it inside your own files; do not weaken a check.
- No git commit/push, no S3/CDN, no network except what the sim itself loads. No browser dialogs.
- Do not guess any link (Ask AI Tutor links come from the owner).
- `rm -rf` on variable paths is blocked: use fresh dirs.

## Deliverables per sim
1. `final/<slug>.user-version.html` built by `chain.py` with gates as above.
2. A report per sim, RETURNED IN YOUR FINAL MESSAGE (subagents cannot write report files; do not work around that; the coordinator saves it): sections list, `data-gate-from` and why, notes sections used, numbers verified, exact gate fails and why, `SME:` questions, `KIT_ISSUE:` lines, old-sheet claims changed/dropped (one line each). Max ~12 lines per sim.
Final message to the coordinator: for each sim a header line — `slug | sections | gate-from | guide x/22 | landing/lastcard/fallback/sheet_final | #SME`, then at most 5 lines of anything surprising. No long prose.

## Mobile app mode (2026-11-02)
`chain.py` ends by adding the phone/tablet layer (`User_version_sims_skills/mobile-app-mode/`) to
`final/<slug>.user-version.html`, after every other gate has run on the file without it. It keeps the pre-step copy as
`final/<slug>.pre-app.html` and records `app_mode` / `app_mode_version` in `gates.json`. Ship only finals with
`app_mode: PASS`; delivery holds the rest. Don't add mobile CSS per sim: the layer handles it.
