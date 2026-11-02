# Lessons from the 116-sim rollout (2026-10-01)

What went wrong or surprised us while rebuilding every uni-lab sim's sheet, and what the kit now does about it.
Read this before writing a sheet; it will save a build-check cycle per item.

## Content traps (these fail review, not the harness)
- **Spoilers.** The Guided Inquiry asks the questions the sheet answers. "What you'll learn", the 01 diagram, the
  kicker and every section before `data-gate-from` must not state an inquiry answer. A diagram that *draws* the result
  (e.g. two curves already separated) is a spoiler: draw the apparatus instead.
- **Overstating.** The owner's wording: show only what "makes sense from a learning point of view for the student".
  Typical cuts: method names (RK4, AGM), tables of numbers where two will do, a second figure that restates the first,
  "exactly"/"perfectly" where the sim shows an approximation, percentages quoted to more digits than the sim displays.
- **Sim-state claims.** Don't say the sim shows something it can't reach (angles/ranges outside the slider, a regime the
  sim clamps). Read ranges and defaults from the DOM, not from memory.
- **Qualifiers.** radians vs degrees, "released from rest", "small angle", "in the lab frame", which frame measures what.
- **SR sims:** two interval sign conventions exist in the course; use the sim's own and name it. Never reconcile them.
- **QM sims:** units exactly as the sim uses them (ħ = 1? eV·nm?); density vs probability; no settled interpretation.
- **PP11 Standard Model / PP18 Scale of the Universe** are under separate professor review — sheet only, never the sim.
- Use `₀`-style subscripts sparingly in the italic `lede`: the italic serif lacks a good "₀" glyph (SR27) and it renders
  as fallback. Write "T₀" in non-italic body text or reword.

## Build and kit traps
- **One-shot anchors.** `build.py` asserts every anchor exactly once and writes nothing otherwise. A miss means the sim
  differs from the scaffold: fix `edits.py`/`persim.html`, or if it's a scaffold problem fix `scaffold/` or `kit/`
  centrally — never hand-edit the built sim.
- **Pristine hazard.** `build.py` always rebuilds from `pristine.html` and refuses to overwrite a repo file whose sha is
  neither pristine's nor the last build's (another session edited the sim). Never force. Re-snapshot: take the current
  pre-sheet sim, `install.py` again (it keeps `.lastbuild`), rebuild.
- **See-it toast regex.** `build.py` rewrites the standard `toast(msg);` line into the watch-card call. A sim whose
  handler differs (e.g. `toast(msg)` followed by an `if(key…)`) needs `SKIP_TOAST = True` and the call written in
  `edits.py`. The v2 scaffold's handler always matches, so this only bites sims with a hand-written handler.
- **Header button state.** Inquiry / Controls-Guide flows veil and disable header controls. The layer re-enables
  `#toggle-formal`; if you add other flows, don't veil it.
- **Viewer-pinned theme.** The hosting viewer pins `data-theme` on `<html>`, which outranks a body-class toggle. The layer
  mirrors the attribute onto `body.light-theme`; write light CSS against both selectors.
- **Inline SVG ids.** Poppler/TikZ output reuses ids (`glyph-0-0`). Namespace every figure's ids (`d1-…`, `d2-…`) or
  `url(#…)` references point at the wrong figure. (`scripts/gen_assets.py` does this; hand-pasted SVGs may not.)
- **Fonts.** The STIX Two Text link is added by `install.py`. Blocked CDNs fall back to Georgia — fine, but check
  nothing depends on STIX-only glyphs (see ₀ above).
- **Script escaping.** Anything inside the download builder's template string that contains `</script>` must be written
  `<\/script>`; `build.py`'s `node --check` of every inline script catches most mistakes, not all.
- **Contrast INFO** in the harness only inspects DOM text; it misses dark-on-dark text drawn on a `<canvas>` (SR26).
  Look at `shots/light-*.png` yourself.

## Layer behaviour that sims kept tripping (now handled in the kit)
These were each reported as a per-sim `KIT_ISSUE` by builders and promoted into `kit/layer.generic.html`:
| symptom | now |
|---|---|
| Sheet buttons unstyled in sims with no `.shell-btn` (pre-shell QM) | zero-specificity `.shell-btn` fallback scoped to `#phys-backdrop,#ps-watch` |
| See-it card transparent (sim's `--panel-2` translucent/undefined) | solid fallback chain; `--ps-watch-bg` override; `install.py` adds missing tokens |
| Card survived Reset (reset id isn't `#shell-reset`) | hides on `#reset,#resetBtn,#btnReset,#inq-pgnext,[data-ps-reset]` real clicks |
| Card covers the plot where the Watch-for is (QM12, SR28) | `--ps-watch-left/right/bottom` knobs in persim |
| `⌖` at a control hidden by a mode/view (QM19, SR18, QM09) | `data-locate-prep="#modeBtn"` |
| Harness can't open the inquiry in sims with the 2-mode landing (SR13) | `check.mjs fresh()` dismisses the landing and opens the inquiry from the header |
Still per-sim: sims whose See-it handler is hand-written (SKIP_TOAST), and light-theme colours.

## Harness reference (`kit/check.mjs`)
37–58 checks, ~3–6 min per sim, headless Chrome only. Pass criteria worth knowing: 5–9 sections, one visible, no
question headings, fixed modal height, ≤260 words/section, rail labels echo headings, ≥3 `⌖` rows and every target
exists, ≥3 See-its (each closes the sheet, shows the card, Back reopens the section), download has all sections and
no buttons, Esc returns focus, Tab stays inside, GI gate behaviour, phone layout (no sideways overflow). Always run it
through `kit/slot.sh` (caps concurrent browser runs; many runs at once starve each other). Verify any new check against a
known-broken build before trusting a pass.

## Process lessons
- Rebuild from the per-sim files every time; if you hand-patch a built file the next build erases it.
- Validate with real clicks in the harness, not just `window.__openPhysics()` (a missing header-button binding passes the
  latter and fails the former — this exact bug was caught while validating the pre-shell installer).
- Contested files: other sessions edit sims. `git status` the sim before building; if it shows changes you don't own, stop.
- zsh: `echo ====` fails (`=` expansion). Use `printf`.
- Commit/push only on request, only to the personal fork `origin` (Binayak07346/simulations), never the company upstream.
