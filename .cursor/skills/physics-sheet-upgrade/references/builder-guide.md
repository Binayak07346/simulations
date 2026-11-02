# Writing the sheet — author's guide (v2)

You are writing the **"⚛︎ The Physics" sheet** for ONE simulation. The owner approved this shape on the pendulum
pilot (`examples/L9`) and it now ships on all 116 uni-lab sims. You are an expert physicist and a careful teacher.
Everything is rebuilt from the per-sim files in `work/v2/<SLUG>/` by `kit/build.py`; never hand-edit the sim.

Paths below are relative to the skill root (`.cursor/skills/physics-sheet-upgrade/`).

## What the owner asked for — not negotiable
1. **Statements, not questions.** No heading is a question; there is no self-test. The Guided Inquiry
   (`.inq-step` cards) already asks the questions. The sheet *explains*.
2. **Only what helps the student learn. Never overstate.** Every sentence and number must earn its place.
   Cut implementation trivia (RK4, AGM, method names) unless a student needs it. Cut a second figure that
   repeats the first. Prefer a few meaningful numbers to a table of them. No hype words.
3. **Minimal text on screen.** 80–200 words per section (figures, tables, the See-it box and the
   `At a glance` / `Controls` / `Where` / `Summary` furniture are not counted). The harness fails any section over 260.
4. **One fixed window size** for every section (the layer enforces it; don't fight it).
5. **Physics exactly right.** Verify every number with node, using the sim's own functions where possible.
   Keep qualifiers that matter (radians, "released from rest", ranges the sim supports). Never state something the
   sim cannot show as if the sim shows it.
6. **A See-it box after each physics section** — the read → see loop.

## The section template (5–9 sections, all `<section class="ps-sec" data-short="…">`)
`data-short` is the label in the contents rail; it must equal, or be a prefix of, the heading text.

- **01 At a glance.** `lede` (2 sentences: what the sim races/compares/shows, and why it matters); **What you'll
  learn** (3–4 bullets) that do NOT give inquiry answers ("how X depends on Y", never "X grows with Y"); one small
  diagram (draw a simple theme-aware inline SVG with `currentColor` and the sim's real object colours; no results in it);
  **What's on screen** (`ps-keys` with `ps-chip` swatches for canvas objects and readouts); a See-it with a "Watch for:" line.
- **02 The controls.** A `ps-ctl` table, one row per real control (sliders, toggles, overlay buttons, readout panel,
  Play/Pause, Speed, Reset): what it changes, range and opening value (read both from the DOM), and a `⌖` button
  `data-locate="#id"` (id must exist). Skip meta-UI (theme, Hide Text, Ask Euler, Guided Inquiry / Controls Guide
  buttons). One "Fixed:" `ps-note` line only for constants a student would otherwise wonder about.
- **03 … N-2 · the physics, one idea per section.** Short statement headings ("Why the real pendulum runs late").
  Each ends with a See-it box. Equations and diagrams: see "Assets" below. Keep any live panel (`#phys-live`) in
  ONE section, as 2 plain lines.
- **Where it matters.** 2–3 real-world bullets, each true and specific; optional `<details class="ps-deep">` "Go deeper".
- **Summary.** `ps-key` "In one line", 3–4 key points, 2–3 common mix-ups as `ps-myth` (myth sentence, then the
  correction), 2–3 "Things to try on your own" that are tasks, not questions.

Copy markup and classes from `examples/L9/article.html`: `ps-h / ps-no`, `lede`, `ps-glance`, `ps-card`, `fig f0`,
`ps-keys`, `ps-chip`, `ps-ctl`, `ps-loc`, `ps-note`, `board`, `fig fN`, `pts`, `ps-key`, `ps-num`,
`ps-try / ps-try-tag / ps-watch`, `ps-deep`, `ps-myth`, `ps-sub`.

## The per-sim files (in `work/v2/<SLUG>/`)
| file | what it holds |
|---|---|
| `config.json` | `{sim, kicker, aria}` — written by `install.py`; `sim` is the repo file `build.py` writes. |
| `article.html` | `<article class="phys-art" id="phys-art" data-gate-from="k"> … </article>`. Diagrams inline. |
| `persim.html` | per-sim `<style>` and `<script>`: light-theme fixes, the See-it map, live panel, demos. May be empty. |
| `edits.py` | `REPS=[(old,new),…]` (each `old` must occur exactly once), optional `SKIP_TOAST=True`, optional `def edit(s)`. |
| `test.json` | only if you add scripted demos: `{"demos":{"name":{"until":"<regex on card text>","timeoutMs":40000}}}`. |

### The persim contract (set these on `window`; all optional; the layer looks them up lazily at click time)
```js
window.__psShow = {               // for  <button class="seesim" data-show="KEY">
  KEY: { msg:   'One short factual line (string or function returning one)',
         scene: {…} | function(){ return {…}; },   // handed to window.__physicsHooks.scene(cfg)
         panel: 'panel-readouts',                  // id of a collapsed sidebar panel to open
         run:   function(){ … } }                  // extra steps after the scene is set
};
window.__psRefresh  = function(){ … };    // sheet opened: refresh #phys-live / live numbers
window.__psSnapshot = function(){ return 'Your snapshot when you saved this: <b>…</b>'; };  // download line (replaces #phys-live)
window.__psDemos    = { name: function(api){ … } };   // for data-demo="name": api.show(msg, liveSpec, noWatch), api.alive(), api.close()
```
- **Build scenes from the CURRENT control values** unless the entry fixes a value on purpose (a See-it must never
  silently reset a student's L or θ₀).
- `window.__physicsHooks.scene(cfg)` is the sim's own scene function (Shell sims: `applyInquiryScene`, wired by
  `install.py`). Read what its `cfg` accepts before writing scenes. Never stage a state the sim can't reach.
- `data-live="Label=#readoutId|Label=#otherId"` on a See-it button makes the card mirror those readouts live (this
  also covers phones, where the sidebar is off screen).
- Use `data-demo` (not `data-show`) when a fair comparison needs a scripted run (run A then B; stop at the same
  moment). See `examples/L9/persim.html` (`lcompare`). A demo must never leave the sim in a broken state.
- `data-locate-prep="#modeBtn"` on a `⌖` button clicks that first, for a control that only exists in another mode/view.
- Card/stage knobs (CSS variables in persim): `--ps-watch-left|right|bottom` move the See-it card off a plot;
  `--ps-watch-bg` gives it a solid colour when the sim's `--panel-2` is translucent.

### The Watch-for promise
It must be visible within ~10 s at 1440×900, in both themes. If it depends on a sidebar readout, add `data-live`.
Keep each `msg` to one line; the Watch-for line is appended to the card automatically.

## Guided Inquiry gate
Read every `.inq-step` card. Set `data-gate-from="k"` on the `<article>` to the 0-based index of the first section
that states an inquiry answer (usually 2 = section 03). While the inquiry is running, that section and all later ones
sit behind "Read anyway". Sections before k must give nothing away — including "What you'll learn", the 01 diagram
and the kicker.

## Light theme
Look at `shots/light-*.png`, `light-see.png` and the harness's contrast INFO line. If the sim's own readouts, legend
or labels are unreadable in light theme, fix them in `persim.html` with CSS scoped to
`html[data-theme="light"] …, body.light-theme …` only. Use darker shades of the same hues (amber #b45309, cyan #0e7490,
green #15803d, rose #be123c, violet #6d28d9, blue #1d4ed8). Never touch the sim's own CSS outside that scope.

## Assets (equations and diagrams)
Prefer plain text with Unicode (θ₀, √, ≈) for short formulas. For display equations and computed diagrams use
`scripts/gen_assets.py` (LaTeX → SVG; geometry computed from the sim's real defaults) and paste the resulting `<svg>`s
inline in `article.html`; give every inline SVG unique ids (`id` collisions between figures break `url(#…)` references).
Put a theme-aware `fill/stroke:currentColor` on anything that must follow dark/light. Pick a class like `ps-cy`/`ps-am`
in persim for diagram label colours that need a darker light-theme shade.

## Domain notes
- **Quantum (QM):** state units (ħ, m, eV·nm) exactly as the sim uses them; never present an interpretation (collapse,
  "the particle is here") as settled fact if the sim only shows probabilities; keep probability *density* vs
  *probability* and normalisation straight; verify numbers with node using the sim's own functions.
- **Relativity (SR):** use the lecture notes (the 56-page SR PDF; grep the lecture number from the file name). Use each
  sim's OWN interval sign convention and NAME it — the course has two and the SME has not reconciled them; do not
  "fix" it. State c = 1 or c explicitly. Say which frame measures what for time dilation / length contraction.
- **Particle (PP) and the rest:** same rules. PP11 (Standard Model) and PP18 (Scale of the Universe) are under a separate
  professor review: touch only the sheet, never the sim.
- 3-D / WebGL / canvas-heavy sims are slow in headless Chrome; if a check times out only because the page is slow,
  say so; do not weaken the check.

## Loop
1. Read `examples/L9/*` and `references/lessons.md`.
2. Install (once): `python3 kit/install.py <raw-sim.html> work/v2/<SLUG> --spec work/v2/<SLUG>/install.json`.
3. Read your sim: `.inq-step` cards, the controls panel markup, `applyInquiryScene`/`onStep` (what a scene accepts),
   slider ids/ranges/defaults, the sim's own physics and info text (source of truth).
4. Write `article.html`, `persim.html`, `edits.py` (and `test.json`). Build: `python3 kit/build.py work/v2/<SLUG>`.
   It writes the sim only if every anchor matched and every inline script parses.
5. Gate: `kit/slot.sh node kit/check.mjs work/v2/<SLUG>` (3–6 min). Every line PASS. Then LOOK at `shots/`: every section
   in dark, light and 720p, every `see-*.png`, `gi-gate.png`, `phone-s1.png`. Make sure each See-it really shows its Watch-for.
6. Self-review twice: as a physics professor (correctness, overstatement, qualifiers, sequencing, spoilers) and as a
   first-year student (clarity, jargon, reading load, does each demo land). Fix, rebuild, recheck until clean.

## Hard limits
- Edit ONLY through `build.py` (it rebuilds from `pristine.html`; never hand-edit the repo file).
- Touch nothing outside the sheet except: the Controls-Guide step for `#toggle-formal` (install does it), and
  light-theme CSS in persim. Never change physics, sim code, GI cards or controls.
- Never touch another sim. Don't commit unless asked. No browser dialogs. **Headless Chrome only — never a visible window.**
- If a sim fact is ambiguous, or the old sheet contains a claim you think is wrong, say so. Don't invent.
- If the repo file changed since `pristine.html` was snapshotted (another session editing the same sim), `build.py`
  aborts: re-snapshot with `install.py` from the current pre-sheet file, never force.
