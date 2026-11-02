# Brief — JEE testprep sims: v2 "⚛︎ The Physics" sheet + the Simulation-guide spec (author agent)

You are an expert physicist and teacher (JEE/NCERT level). For each sim assigned to you, you write the new Physics sheet and
the guide-tour spec, run the chain, and gate it. The owner is not monitoring: decide, fix, report. Be careful, not fast.

## Situation
- 104 JEE sims in `Fermi_testprep_jee_sims/Module-*/` (roster: `jee-v2/roster.json`, with a per-sim `family`). They have the old
  Shell UI, a one-line "Formal" strip, an Info text, Guided Inquiry (GI) cards and an old controls tour. We rebuild: the v2 sheet,
  a fresh guide spec, then the guide UX + Horizon UI via `jee-v2/chain.py`.
- **There are no lecture notes for JEE.** Your sources are: the sim's own Formal strip, Info text and GI cards (RECON.md), plus
  standard JEE/NCERT physics. Never invent a symbol or rename one: use the sim's own labels. Verify every number a sentence or a
  See-it states with node, using the sim's own formula (`verify.js` in the work dir). If the sim and textbook disagree, write
  `SME:` in your report; do not "fix" either.
- **Pilot to copy:** `~/jee-physics-v2/work/C021/` (article.html, persim.html, spec.js, final/). Read it first.
- Rules (owner's, not negotiable), paths relative to `/Users/admin/Desktop/simulations-1`:
  1. `.cursor/skills/physics-sheet-upgrade/references/builder-guide.md`
  2. `.cursor/skills/physics-sheet-upgrade/references/lessons.md`
  3. `.cursor/skills/physics-sheet-upgrade/examples/L9/{article.html,persim.html}` (model of v2 shape)
  4. `User_version_sims_skills/sim-guide-kit/SPEC_FORMAT.md` (the spec format)

## Your work dir, per sim: `~/jee-physics-v2/work/<slug>/` (already prepared; write ONLY here)
| file | what |
|---|---|
| `RECON.md` | START HERE: live controls (ids, ranges, defaults), readout ids, the Play/Reset behaviour, every GI card with its CORRECT choice, the old Formal/Info/welcome/cgSteps text (reference only), how GI scenes were staged |
| `family.json` | play none/text/icon, static, three, scene_fn, no_seesim_possible |
| `article.html` | YOU write (starter exists). Sheet sections |
| `persim.html` | YOU write (starter has a working scene hook seeded from the live controls) |
| `spec.js` | YOU write (DRAFT seeded from the old tour: titles/text/say are `TODO-AUTHOR`, targets are REVIEW) |
| `edits.py` | sim-specific anchored replacements (usually empty: `REPS = []`) |
| `pristine.html`, `raw.html`, `config.json` | made by prep. Never edit |
| `out.html`, `built.html` | `kit/build.py` output. Never hand-edit |
| `final/` | `chain.py` output: `ux.html`, `<slug>.user-version.html`, `gates.json`, `gates.log`, `shots/`, `sheetcheck/` |

Starter files are never overwritten once you start (`.starters`). Do not run `prep_all.py` yourself.

## Loop for one sim (from `/Users/admin/Desktop/simulations-1/.cursor/skills/physics-sheet-upgrade`)
```
. jee-v2/env.sh            # EVERY Bash call that runs a browser/build/chain: quiet CHROME, slots dir, PUPPETEER_CORE
W=~/jee-physics-v2/work/<slug>
python3 kit/build.py $W                # asserts anchors; writes out.html + built.html (seconds)
python3 jee-v2/chain.py <slug>         # guide UX build -> Horizon UI -> gates (guide, landing, lastcard, fallback, sheet_final)
```
- **Reduced testing.** Run only `kit/build.py` and `jee-v2/chain.py`. The separate sheet-only harness
  (`kit/slot.sh node kit/check.mjs $W`, 3-6 min) runs ONLY when `chain.py` reports `sheet_final` FAIL, to find which line fails.
  Batch your edits; do not rebuild per word. chain.py refuses a spec/built file that still contains `TODO-AUTHOR`.
- **Always LOOK at** (read the png): `final/sheetcheck/shots/` -> every `see-*.png` (does each See-it show its Watch-for within
  ~10 s?), `gi-gate.png`, and the `gv-oneline` shot; plus `final/shots/` for the tour (each outline sits on what its text names).
- Expected `gates.json`: `guide` = `20/22 PASS` with fails exactly `L4` (tutor link: owner supplies, never guess) and `N1`
  (voice clips, none yet); `landing`, `lastcard`, `fallback`, `sheet_final` = PASS. Other fail: investigate, fix if it is yours
  (article, persim, spec, edits). If it is the sim's own layout, or the guide engine, do NOT change the engine or the sim: record
  `KIT_ISSUE:` in your report. Machine load causes spurious failures: rerun unchanged once before digging. Never `pkill` check.mjs.
- NO SOUND: `. jee-v2/env.sh` before any browser script, including your own puppeteer snippets (`executablePath: process.env.CHROME`,
  `headless: 'new'`). Always through `kit/slot.sh`. Headless only, never a visible window.

## The sheet (article.html)
- 5-9 sections `ps-sec`, 80-200 words each (>260 fails; the controls section is exempt from the 80-word floor; check counts all
  text except svg, `.ps-try` and tables). Statement headings, no questions, no self-test. At least 3 `⌖` rows and 3 See-its.
  `data-short` must be a PREFIX of the `<h3>` text (and no `<sub>` in that part).
- Section 01 = At a glance (lede, "What you'll learn", a figure of the APPARATUS). Controls section = a table of real controls from
  RECON.md (skip theme / Info / Guided Inquiry / Simulation guide / Maximize); every ⌖ target must exist in the live page.
- Reuse what is correct in the old Formal/Info text, re-expressed in v2 shape. Cut, do not pad. Re-derive each claim you keep.
- Prefer Unicode + `<sub>/<sup>`; a figure may be hand-built SVG with `currentColor`, unique id prefixes (`d1-…`), and dark AND
  light classes for any `ps-chip` colour variant (`persim.html`). Figure text scales as `.fig max-width / viewBox width`.
- **GI gate (spoilers).** Read every `.inq-step` card in RECON.md. Set `data-gate-from="k"` = 0-based index of the first section
  that states a GI answer. Everything before it, and the learn bullets, the 01 diagram, the kicker, and the Summary "In one line"
  block (the guide copies it above section 01 as `.gv-oneline`), must give nothing away: no values, rates, ratios, directions a
  card asks for. A diagram that draws the result is a spoiler: draw the apparatus. Look at the `gv-oneline` shot after chain.py.

## persim.html (the per-sim layer)
- Contract: `window.__psShow[KEY]={msg,scene,panel,run}`, `__psRefresh`, `__psSnapshot`, and `window.__physicsHooks={scene,isPlaying,setPlaying}`.
  The starter already defines `__physicsHooks`.
- **Scene hook = input events.** JEE sims run on the Shell, which restarts the run on every slider `input`/`change`
  (`restartWithCurrentParams`). Stage a See-it by setting control values and dispatching `input` (`change` for selects, `.click()`
  for checkboxes). NEVER call the sim's `onReset` from a hook. Sim state that is not a control (stacked bars, trails, markers):
  seed it after the events, then repaint. Never stage a state the sim cannot reach. Static sims (no Play) just set values.
- `scene` must pass every control you need; a value that is unchanged does not restart, so dispatch the event anyway.
- Long next-section titles in the See-it card: the starter has the ellipsis rule `#ps-watch .w-b>*{...text-overflow:ellipsis}`; keep it.
  The `--ps-watch-left|right|bottom` knobs move the card when it covers the sim; the starter's desktop rule is a good default.
- Light theme: fix unreadable sheet / See-it colours only in `persim.html`, scoped
  `html[data-theme="light"] …, body.light-theme …`. The final build is the light look; the sheet build has both themes.
- Do not edit the sim's physics, GI cards, controls or layout. A sim error goes in the report.

## spec.js (the guide tour)
- 4-6 steps. Fresh plain-language wording: do NOT copy old text. The lint rejects dash asides (`—`) in title, text or say, and
  sentences over 25 words. Chapters: "The simulation" first, then "Controls".
- Targets are RECTS of what the step names, not whole panels. These sims have no `__cgGeo`: compute the rect from the canvas
  `getBoundingClientRect()` and the sim's own layout constants (see C021 `spec.js`: road row, bar block, d/t box). A control box
  is `{sel:'#box-id'}` (+ a secondary `{rect,sec:true,tag:'u, a'}` on what it changes). Check the outline in `final/shots/`.
- `play:'#shell-play'` for sims with a Play button (text or icon; the guide engine reads `/pause/i` on its text). Static sims
  (no Play): omit `play` and use `trigger.at`/`trigger:{text,say}` as in SPEC_FORMAT.md. Three.js sims: the canvas is WebGL, so
  outline from the canvas rect only.
- Do not add the inert-release fix: `chain.py` appends `spec-common.js` (the sim's welcome overlay inerts `#shell`; the guide only
  hides the overlay).

## Lessons from the pilot
- Word cap: Summary is the usual offender. Size figures for the rendered scale.
- Verify numbers with node; keep `verify.js`.
- `final/` can hold stale files; trust `gates.json` timestamps from your latest chain run.
- Known kit gaps (do not fix, do not report): download footer says "self-test"; download CSS lacks `.ps-*` rules; the local sims
  have no narration manifest (affects the later upload only).
- Probing the sim in free mode: the GI overlay blocks clicks; click `.welcome-mode[data-mode="free"]` first.
- Self-review twice: physics professor (correctness, overstatement, qualifiers, spoilers) and first-year student (clarity, jargon,
  reading load, does each See-it land). Rebuild and recheck until clean.

## Hard limits
- Write only inside your own `~/jee-physics-v2/work/<slug>/`. Never edit `kit/`, `scaffold/`, `references/`, `ai-v2/*`, `jee-v2/*`,
  `sim-guide-kit/`, `ui-stylesheet/`, `design-system/`, any `Module-*/` file, `~/Downloads/**`, or another sim's dir. A kit problem
  that blocks you: `KIT_ISSUE:` in the report, work around it inside your files, never weaken a check.
- Do NOT write into `Module-*/`: delivery is `jee-v2/deliver.py`, run by the coordinator.
- No git commit/push, no S3/CDN, no network beyond what the sim loads, no browser dialogs. Never guess a link (Ask AI Tutor
  links come from the owner). `rm -rf` on variable paths is blocked: use fresh dirs.

## Deliverables per sim
1. `final/<slug>.user-version.html` from `chain.py`, gates as above.
2. A report per sim, RETURNED IN YOUR FINAL MESSAGE (subagents cannot write report files; the coordinator saves it), max ~10 lines:
   sections, `data-gate-from` and why, numbers verified, exact gate fails and why, `SME:` questions, `KIT_ISSUE:` lines,
   old-claims changed/dropped.
Final message: per sim one header line `slug | sections | gate-from | guide x/22 | landing/lastcard/fallback/sheet_final | #SME`, then at
most 5 lines of anything surprising. No long prose.

## Mobile app mode (2026-11-02)
`chain.py` ends by adding the phone/tablet layer (`User_version_sims_skills/mobile-app-mode/`) to
`final/<slug>.user-version.html`, after every other gate has run on the file without it. It keeps the pre-step copy as
`final/<slug>.pre-app.html` and records `app_mode` / `app_mode_version` in `gates.json`. Ship only finals with
`app_mode: PASS`; delivery holds the rest. Don't add mobile CSS per sim: the layer handles it.
