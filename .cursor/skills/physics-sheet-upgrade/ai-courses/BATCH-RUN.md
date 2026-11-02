# Batch run — build "The Physics" sheet for a list of AI-course sims

The batch prompt gives you: the course, the sim list (file · title · notes sections · live-panel mirrors ·
scene keys). This file is the shared workflow. Follow it exactly.

## Course details

| course | folder (under `AI courses sims/`) | notes PDF (in that folder) | shell | work dir |
|---|---|---|---|---|
| em | `electromagnetism/courses/` | `Fermi Notes on Physics Vol 5 - Electricity and Magnetism.pdf` | KIT | `/tmp/physics-ai/em/` |
| mm | `mathematical methods/courses/` | `Fermi Notes on Physics Vol 4 - Mathematical Methods for Physics.pdf` | KIT | `/tmp/physics-ai/mm/` |
| wa | `waves and acoustics/courses/` | `Fermi Notes on Physics Vol 6 - Oscillations, Waves, and Acoustics.pdf` | LEGACY | `/tmp/physics-ai/wa/` |
| astro | `astrophysics and cosmology/courses/` | `Fermi Notes on Physics - Astrophysics and Cosmology (Provisional Draft).pdf` | KIT | `/tmp/physics-ai/astro/` |
| th | `thermal and statistical physics/courses/` | `Fermi Notes on Physics Vol 2 - Thermal and Statistical Physics.pdf` | LEGACY | `/tmp/physics-ai/th/` |

- Notes text: reuse `<work dir>/notes.txt`; if missing, `pdftotext -layout "<pdf>" <work dir>/notes.txt`.
- KIT shell: `window.__physicsHooks.scene(cfg)` takes the manifest param ids. LEGACY shell: each sim's own
  `function applyPhysicsScene(cfg)` — read it and use exactly its keys. Both reset every control to its default
  first, so every SHOW entry passes the CURRENT values of the controls it keeps.
- Maths course: ch 05 = where physics uses the method (from the notes' own examples). Astro: use `sci(x,d)` for
  very large/small numbers and keep the notes' units.

## Read first (in full, once per window)

`.cursor/rules/physics-sheet-ai-courses.mdc` · `ai-courses/README.md` · `ai-courses/layer.ai.html` (PER-SIM
contract: MINI accepts `{el}`, `{group,key,value}`, `{radio,key}`) · `references/content.md` · `references/pitfalls.md`.
Then ONE approved example of the same shell (between "PHYSICS_SHEET: layer installed" and "/THE PHYSICS LAYER"):
KIT → `AI courses sims/electromagnetism/courses/em-gauss-cones.html`;
LEGACY → `AI courses sims/waves and acoustics/courses/wv-beats-phasor.polished.html`. Read only that one.

## Per sim — in list order, finish one completely before the next

Skip any sim whose file already contains `PHYSICS_SHEET: layer installed`.

1. **Recon.** Controls (ids, min/max/step, defaults), scene keys, physics code (Kit.sim({...}) or the legacy
   update/derive functions, constants, `window.__audit` if present), readouts, the Info modal, every Guided
   Inquiry card + feedback, the notes sections in notes.txt. Never print a whole sim (giant base64 font line):
   `awk 'length<3000'` / python, read only the ranges you need. Check the batch prompt's mirror ids and scene
   keys against the sim; if one differs, use what the sim actually has.
2. **spec.py** — EQS in the notes' notation; 3 TikZ DIAGS computed from the sim's defaults with asserts on
   signs, directions and shapes. Render:
   `python3 .cursor/skills/physics-sheet-upgrade/scripts/gen_assets.py spec.py assets_build` → LOOK at every PNG.
3. **article.html** — lede + 7 question-led chapters; ch 03 live panel exactly as the README shows
   (phys-live, phys-num, phys-sub, phys-mini, phys-worked); See-it buttons where the sim can show the claim;
   ch 07 = exactly 3 `<details class="phys-q"><summary>…</summary><p class="ans">…</p></details>`
   (a degenerate case, a scaling question, the conceptual question).
   **persim.js** — MINI mirrors EVERY physics control (sliders, selects, checkboxes, button groups, radios —
   never Speed, never a pure action button like Restart or a show/hide view toggle); LIVE with the sim's own
   formulas and CURRENT values plus a worked run; SHOW with the sim's scene keys.
   **meta.json** — `{"topic","kicker","title": <sim title>, "slug": <file stem without .prebuild/.polished>}`.
4. `python3 .cursor/skills/physics-sheet-upgrade/ai-courses/assemble_ai.py "<sim>" <workdir>` (dry).
5. `node .cursor/skills/physics-sheet-upgrade/ai-courses/browser_test_ai.mjs <workdir>/built.html <workdir>/shots`
   → `RESULT PASS`; look at sheet-dark, sheet-light, gi-paused and every seesim-*.png.
6. Recompute every number in the sheet in python from the sim's code; compare at least one with the live readout.
7. `assemble_ai.py "<sim>" <workdir> --apply` → `browser_test_ai.mjs` on the real sim file → `RESULT PASS`.
8. Append to `<work dir>/progress.md`: `<file> | INSTALLED or HELD | numbers checked | reason or "—"`.

## End of batch

Write the batch's installed files (full paths) to `<work dir>/done-<BATCH>.txt`, then
`node .cursor/skills/physics-sheet-upgrade/ai-courses/gi_reset_test.mjs <work dir>/done-<BATCH>.txt 4` → `FAIL 0`.
Report installed / held counts and one line per held sim with the reason. Then STOP.

## Hard rules

- Sims change ONLY via assemble_ai.py. Never hand-edit a sim; never edit the kit — if the kit looks wrong,
  stop and report.
- Physics from the course notes: their symbols and the sim's on-screen labels exactly; never introduce or rename
  a symbol. If notes / sim / Guided Inquiry disagree or any physics looks wrong: don't install — mark HELD with
  the reason. "No slider" is NOT a reason to hold.
- Every number recomputed from the sim's code; figures computed, never sketched; never contradict a GI card;
  the kicker names the topic, never the result.
- No git. If a test fails, fix your work-dir sources and re-run; never weaken or skip a check.
- Keep going without asking; if context runs low, finish the current sim, update progress.md and stop.
