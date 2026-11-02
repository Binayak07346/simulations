---
name: physics-sheet-upgrade
description: Upgrade a physics simulation's "Formal" section (the equation strip pinned to the bottom of the shell) into "The Physics" — a pop-up, chapter-structured revision sheet with LaTeX-quality equations, computed TikZ diagrams, a live worked example bound to the sim's real sliders, "see it in the sim" buttons, and a themed downloadable copy. Use this skill whenever the user asks to upgrade, replace, redesign, or modernize the formal section, formula section, equation panel, or "∑ Formal" button of any simulation HTML file; asks for "The Physics" sheet, a revision sheet, cheat sheet, or formula sheet inside a sim; or wants their sim's equations made interactive, engaging, or student-friendly. These are production simulations — the upgrade must be additive and must not change any existing sim behavior.
---

# Physics Sheet Upgrade — LEGACY v1 (historical; use SKILL.md for new work)

Transform a simulation's bottom "Formal" strip into **The Physics**: a pop-up revision
sheet a student would actually read. The target design was reached through many
iterations with the user — reproduce it faithfully. The finished Coriolis example
looked like this: a serif "The Physics" title with breathing room below the top bar;
an outlined one-line hook ("The Coriolis force isn't a push. It's what a straight
line looks like from a spinning room."); seven boxed, numbered chapters headed by
questions; real Computer Modern equations on accent-edged boards; TikZ figures
computed from the sim's actual trajectory; a live panel whose sliders ARE the sim's
sliders; per-chapter "see it in the sim" buttons; and a download that clones the
whole article into a standalone themed sheet.

## Non-negotiable safety stance (production sims)

These files ship to students. The upgrade is a **layer**, never a rewrite:

- Copy the sim to a working directory; never edit the original in place.
- Make exactly **four structural edits** to existing code (listed in
  `references/recon.md`); everything else is appended before `</body>`.
- Every edit uses an exact-match anchor asserted to occur **exactly once**, and the
  file is written only after **all** anchors match — a failed anchor must abort with
  nothing written (use `scripts/patchlib.py`, which enforces this).
- Add no globals except `window.__openPhysics` and `window.__physicsHooks`; wrap the
  layer in an IIFE with `'use strict'`; register listeners only after the sim's own
  boot code so ordering is deterministic; never remove or reorder the sim's listeners.
- Do not touch the sim's physics, guided inquiry, controls guide, welcome overlay,
  canvas code, or CSS outside the layer's own namespaced classes (`phys-*`, `.ch`,
  `.board`, `.fig`, `.pts`, `.lede`, `.m`, `.seesim`, `.live-*`).
- Run `scripts/verify_build.py` before delivering. If any check fails, fix and rerun;
  never ship a file that fails verification.

## Workflow

### 1. Recon (read-only) — `references/recon.md`

Map the sim before changing anything: the four patch anchors, the scene-control
function, the Shell API, every slider (id, symbol, unit, physical meaning), the trail
colors, the theme wiring, and the sim's own physics content (formal strip, info
modal, guided inquiry) — that existing content is the source of truth for what the
sheet must teach. Read `references/recon.md` and follow its checklist; if any anchor
differs from the reference sim, adapt per its fallback guidance.

### 2. Author the sheet — `references/content.md`

Plan the chapters, equations, diagrams, live worked example, traps, and self-test
for THIS sim's topic. `references/content.md` defines the structure, voice, and
quality bar (with the full Coriolis version as the calibration example). Write the
plan first; it determines what assets step 3 must produce.

### 3. Generate assets — `scripts/gen_assets.py`

Equations are LaTeX (pdflatex → pdftocairo → post-processed inline SVG); diagrams
are TikZ with geometry **computed from the sim's real defaults**, not sketched.
Write a `spec.py` (copy `scripts/example_spec_coriolis.py`), run
`python3 gen_assets.py spec.py`, then **rasterize every output to PNG and view each
one** — label clipping and layout flaws are only caught by looking. Fix and rerun
until every render is clean.

### 4. Assemble

- Apply the four structural patches with `patchlib.Patcher` (all-assert-then-write).
- Copy `assets/layer.reference.html`, rewrite its topic content per your step-2 plan
  (the file marks which parts are invariant machinery vs. per-sim content), fill the
  `{{EQn}}`/`{{Dn}}` tokens from `art.json`, and inject the layer before `</body>`.
- The machinery in the reference layer encodes hard-won fixes (theme repair, download
  capability with fallback, live two-way slider binding, clone-based download,
  `<\/script>` escaping). Keep it verbatim unless a check in step 5 forces a change.

### 5. Verify and deliver — all three gates

1. **Static**: `python3 scripts/verify_build.py <built-file> --original <pristine-copy>`.
   Beyond the layer checks (anchors, tokens, `node --check`, combining arrows,
   `</script>` escaping, SVG id hygiene), `--original` is the production-safety
   proof: with the layer stripped, the built file must differ from the pristine
   original at ONLY the four sanctioned patch sites — a single changed line
   anywhere else fails the build. Always run this mode; keep the pristine copy
   for it.
2. **Runtime**: `python3 scripts/browser_test.py <built-file>` drives the file in
   headless Chromium (works fully offline; the sim's CDN failures are expected
   noise) and exercises every layer path: open/close/Esc/pause, the 9 SVGs and id
   uniqueness, two-way slider sync, live worked-run recompute, see-it buttons
   sending CURRENT values, viewer-pinned theme sync, and the downloaded sheet's
   full content. If the environment has no headless browser (exit 3), run the same
   checklist manually — e.g. with Claude in Chrome on the delivered page.
3. **Delivery**: publish as an artifact when hosted viewing is wanted (declare
   `capabilities: {downloads: true}` on the first publish) or present the file.
   Ship only a build that passed gates 1 and 2.

## Pitfalls — read before building

`references/pitfalls.md` is the ledger of every bug hit while reaching the final
design (blocked CDN stylesheets, tofu combining arrows, poppler SVG id collisions,
viewer-pinned themes, inert blob downloads, stale worked-example values, and more).
Each entry says what broke, why, and the required prevention. Skipping this file is
how those bugs come back.

## Quality bar

The user's test is: "would a student mistake this for something a good human TA
authored?" Concretely — question-led chapter headings, 2–4 bullet points instead of
paragraphs, every number in the worked example live and honest (state first-order
estimates as such), diagrams that agree with the sim because they were computed from
it, and a download that is the same artifact, not a lesser one. When in doubt,
compare against the Coriolis calibration example in `references/content.md`.
