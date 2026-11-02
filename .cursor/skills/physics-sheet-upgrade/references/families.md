# Sim families and how `install.py` handles each

`install.py` detects the family from the sim and applies the matching structural patches. Both families end up with the
same scaffold (CSS, modal, seat script, generic layer JS, Guided-Inquiry pause).

## Shell family (CM, PP, SR, most QM-course foundry sims)
Marker: `<button id="toggle-formal" class="shell-btn">∑ Formal</button>` in the header, a `Shell` object, and (usually)
`function applyInquiryScene(cfg)` for Guided-Inquiry scenes.
Automatic patches (each anchor must match exactly once or install aborts, writing nothing):
1. Button → `<button id="toggle-formal" class="shell-btn" title="Open the revision sheet">⚛︎ The Physics</button>`
   (U+269B U+FE0E, text presentation).
2. The `tFormal` click listener body → `if(window.__openPhysics) window.__openPhysics();`.
3. `window.__physicsHooks = { scene:applyInquiryScene };` inserted before the final `})();` of the script that defines
   `applyInquiryScene`. No `applyInquiryScene` → install says so; define `__physicsHooks.scene` yourself in persim.
4. The Controls-Guide step for `#toggle-formal` (if any) → "The Physics" with the standard text (and `say` if the sim's
   other steps have narration).
Install spec: just `{"title","slug","sim"}`.
Pause/resume goes through `Shell.setPlaying`/`Shell.playing`.

## Pre-shell family (the older QM sims: `.top-bar-actions`, `.btn-topbar`/`.phys-btn`, no `Shell`)
No header button and no Shell, so the spec must supply:
```json
{ "title": "Double slit with measurement", "slug": "double-slit-measurement", "sim": "/abs/path/to/final-sim.html",
  "z": {"backdrop": 99992, "toast": 99993}, "toast_top": 74,
  "button": {"before": "<div class=\"sim-playback-btn-group\">", "class": "btn-topbar"},
  "hooks": {"before": "</body>", "code": "<script>window.__physicsHooks = { scene:function(cfg){…},\n  isPlaying:function(){…}, setPlaying:function(p){…} };</script>"} }
```
- `button.before`: an exact snippet occurring once; the new button is inserted immediately before it (left of Reset/Pause).
- `hooks`: must define `scene`, `isPlaying`, `setPlaying`. If the sim's scene/pause functions live inside an IIFE, put the
  `before` anchor inside that scope (as the old QM07 layer did) and write bare JS; for a top-level anchor wrap in `<script>`.
  Prefer driving pause through the sim's own Play/Pause button when its state isn't reachable.
- `z`: these sims carry a fixed feedback pill at z-index 99990 and a modal at 99991; the sheet must sit above both.
- Install binds the new button's click (`__openPhysics`) itself, since there is no Shell listener.
- Install adds fallbacks for any missing theme token (`--panel-2 --line --text --ink-mid --ink-mute --accent
  --accent-soft --surface-soft --font-nums`) — check the light-theme shots.
- Reset ids vary (`#reset`, `#resetBtn`, `#btnReset`); the layer already hides the See-it card on all three. Anything else:
  mark the button `data-ps-reset`.

## Not covered
- **AI-courses variant** (`ai-courses/`, `layer.ai.html`, `browser_test_ai.mjs`): the repo copies were replaced with the
  v2 versions on 2026-10-07. The 137 user versions in `~/Downloads/ai-courses-user-version/` were upgraded to v2 on 2026-10-07 with the
  `ai-v2/` pipeline (`chain.py <slug>`, roster in `ai-v2/roster.json`, author brief in `ai-v2/AUTHOR-BRIEF.md`; two
  families: kit = `__kit` manifest sims, legacy = `applyPhysicsScene` sims). Roll-up: `PHYSICS-V2-ROLLOUT.md` in that
  folder. Repo `AI courses sims/` already holds these v2 files (owner OK'd the replace).
- **Testprep / JEE sims, Fermi stage sims:** different shells; run `install.py` on a scratch copy and read its error —
  the anchors that miss tell you what to add to the spec.
- **v1 shipped sheets:** sims still carrying the old question-led sheet (`<article class="phys-art" id="phys-art">` without
  `data-gate-from`) can be moved to v2 with the old flow (`references/legacy-v1.md` → `build.py` against their v1
  `pristine.html`); `kit/preflight.py <dir>` lists which v1 sims have all 12 anchors.
