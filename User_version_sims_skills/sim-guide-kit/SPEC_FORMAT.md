# Writing a sim's guide spec (`spec.js`)

A spec is the only thing written by hand for each sim:
- the engine (`layer.html`) reads it;
- the builder (`build.py`) adds the voice and installs it;
- the gates (`check.mjs`, `regress.mjs`) test it.

Read `GUIDE_STRUCTURE.md` (the shape of the tour) and `PLAIN_LANGUAGE.md` (the wording) first. The canonical finished examples are in `examples/`:
- `pend`: 2-D canvas;
- `ds`: Three.js, older QM layout;
- `tr`: 3-D shell.

The pilot files in `~/Downloads/logged-in web's flows/` are OLDER builds; don't copy from them.

## Requirements (once per machine)
- `python3`, `node`, and Google Chrome in /Applications (`CHROME` env overrides the path).
- puppeteer-core: the default path is `~/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js`; set `PUPPETEER_CORE` to override.
- ElevenLabs key in `~/.config/elevenlabs/api_key` (clips are cached in `~/sim-narration/audio-cache`).

## Per-sim work folder: `work/<slug>/`
| file | what |
|---|---|
| `config.json` | `{"sim": "<path under Fermi_university_sim_lab_sims/>", "slug": "<short-name>"}` |
| `spec.js` | `window.__GV_SPEC = {…}` inside an IIFE (below) |
| `hooks.py` | optional `def patch(html): return html`: **read-only** geometry hooks the spec needs (see "Outlines"). Every edit asserts its anchor with `once()`. |
| `pristine.html` | written by the first build: the sim before guide v2, taken from the **working copy**. build.py warns if that differs from git HEAD; mention it in your report. Never edit it. |
| `built.html` | always written by build.py, even with `--out`. |

## The spec
```js
(function(){
  var $=function(id){return document.getElementById(id);};
  window.__GV_SPEC={
    title:'The Nonlinear Pendulum',                 // the landing board's title (rules below)
    blurb:'A real pendulum swings next to … Change the release angle and compare the two.',   // ONE line: what it is, what you do, what you see
    reset:'#shell-reset', play:'#shell-play',        // this sim's Reset and Play/Pause (static sims: leave play out)
    start:function(){ … },                           // optional: put the sim in the view the tour describes (e.g. 3D, split view)
    end:function(mode){ … },                         // optional: undo anything start() did; mode = 'free' | 'inquiry'
    onReset:function(){ … },                         // optional: re-stage the tour after the sim's own Reset
    stage:false,                                     // optional: do NOT call the sim's window.__cgPrepare() staging
    steps:[                                          // 4–6 steps: 2–3 "The simulation" steps, then "Controls" steps
      { chap:'The simulation', title:'The pendulum',
        targets:function(){ return [ {rect:…}, {sel:'#box-len'}, {poly:…, sec:true, tag:'L'} ]; },
        enter:function(){ … },                       // optional: open a collapsed panel, recentre a 3D view …
        text:'<p>One sentence.</p><p>One sentence.</p>',   // ≤ 2–3 short <p>
        say:'The same idea, said conversationally (not read word for word).' }
    ],
    playText:'<p>Press <b>Play</b> to release the bob.</p>',   // added to the LAST card. Static sims: '<p>Try it: drag <b>P</b> and watch …</p>'
    playSay:'When you’re ready, press Play in the top bar to release the bob.',
    trigger:{ text:'<p>Press <b>Play</b> and watch both bobs swing.</p>', say:'Press Play, and watch both bobs swing.' }
    //        static sims: trigger:{ at:'#box-P', text:'<p>Drag <b>P</b> and watch the E–k curve change.</p>', say:'…' }
  };
})();
```

### String rules
- `say`, `playSay` and `trigger.say` must be **plain strings**: no functions, no getters. They are voiced at build time.
- `text` may be a string (preferred) or a function.
- build.py evaluates the spec in node, so any quote style works. Use ’ for apostrophes.
- **Lengths:** aim for ≤ 18 words per sentence; 25 is the lint's hard limit. The hint line is ≤ 12 words.

### Title rule
- Use the sim's `<title>` verbatim.
- If it carries a subtitle after a dash ("Centrifugal Force — Ball on a Merry-Go-Round"), drop the subtitle.
- Inside compound names use a non-breaking hyphen (U+2011: "Stern‑Gerlach", "Kronig‑Penney") so the board never breaks the line there.
- Titles are linted like every other line.

## Targets (what gets outlined)
| key | value | use for |
|---|---|---|
| `sel` | CSS selector | a sidebar control, panel or readout (white outline). The engine scrolls `sel` targets into view, so **use `sel` for anything that may be below the fold**. |
| `rect` | `{left,top,width,height}` in page px | a 2-D canvas part |
| `ellipse` | same box, drawn as an ellipse | a small round object (bob, source, particle) |
| `poly` | `[[x,y],…]` page px | a 3-D part's projected silhouette. **It is drawn as its convex hull:** split non-convex parts (e.g. a double cone) into several convex polys. |
| `sec:true` | flag | the scene part a control changes (yellow), with `tag:'θ₀, L'` only when the control shows a symbol |
| `avoid:true` | flag | not outlined; the card keeps clear of it. **Only honoured on `rect`.** Use it for key labels a card might cover. |
| `pad` | number | extra px around the outline |

- Targets are functions, so they are re-read on every frame: outlines follow moving parts and resizes.
- Return `null` for a part that is off-screen, and nothing is drawn.
- The gate's G11 fails any outline that is not on screen.
- A group of controls counts as that many controls (≤ 3 per step).

## Outlines: reuse the sim's existing geometry
Most user-version sims already expose their layout for the October scene tour (counted 2026-10-05, 116 sims):
- 89 have `window.__cgGeo()` (canvas px plus named parts) or `window.__cgSceneBox(part)` (3-D projected boxes);
- 114 have the old guide's steps, which you can find by searching for any of:
  - `const steps = [`
  - `const cgSteps = [`
  - `cgSceneSteps`
  - `spot:` functions

Those spot functions are often built on private `cg*` helpers inside a closure, which the spec can't call. Then either:
- **copy their maths into spec.js**, using the public `__cgGeo` (what the harmonic-oscillator and centrifugal trials did); or
- **expose them with one read-only hooks.py line** (template: `examples/ds/hooks.py`, which exports `window.__gvGeo`).

Hooks are read-only: they never change what the sim draws or does. A sim fix needs the owner's OK. The `pend` and `ds` example hooks contain owner-approved fixes for those sims only.

**Pseudo-3-D drawn on a 2-D canvas** (e.g. a cone panel): export the drawing function's projected points into a `window.__gv*` global from hooks.py, then build `poly` targets from them.

## Engine contract (what the sim must provide)
The engine relies on:
- `#btn-gi` (Guided Inquiry) and `#btn-cg` (Simulation guide) in the header;
- `window.__setMode`;
- a header: `.shell-header`, `header` or `.top-bar`;
- a Play button whose visible text or aria-label says Play / Pause. The engine reads `/pause/i` to know the sim is running, so an icon-only button breaks "the sim waits for Play".

What it does:
- **Tour begin:** calls `__setMode('free')`. Then, if `window.__cgPrepare` exists, it calls it for the sim's own no-spoiler staging (`stage:false` opts out). Then it calls `SPEC.start()`.
- **Tour end:** calls `SPEC.end(mode)`, then hands over to free exploration or the Guided Inquiry.
- **Reset during the tour:** keeps the tour open, then calls `SPEC.onReset()`.
- **Physics sheet:** gets an "In one line" summary block at the top (approved UX). This comes from the sheet's own "In one line" key.
- **Staging must not reveal Guided Inquiry answers** (shaded results, selected states, answer readouts). If `__setMode('free')` reveals them on this sim, use `__cgPrepare`, `start` and `end` to stage a neutral view.

## Voice
- Every `say`, `playSay` and `trigger.say` gets an ElevenLabs clip at build time (voice JBFqnCBsd6RMkjVDRZzb, flash v2.5).
- The last step's `say` and `playSay` are also voiced as one combined line.
- The engine falls back to the browser voice only if a clip is missing; then the gate's N1 fails.
- The welcome board itself is not narrated.

## Gates (both must pass before install)
```
$K/slot.sh node $K/check.mjs <built.html> --shots <dir>
node $K/regress.mjs <original.html> <built.html> $K/work/<slug>
```
Previews go to the session scratchpad, not /tmp.
