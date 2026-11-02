# Adapting a new design (any simulation)

The layer needs three things from a page:

1. **panel**: the box of controls a student uses (sliders, buttons, inquiry questions). It becomes the drawer on a
   phone and the docked panel on a tablet.
2. **hero**: the drawing area (canvas / svg / WebGL / plot) that should fill the screen.
3. **header** (optional): a top bar to hide. Its visible controls move into the drawer's top card.

It also uses the sim's own **play** and **reset** buttons, if it has them, to drive the rail and the native app.

## 1. Let it try on its own: `node scripts/probe.mjs sim.html --shots /tmp/p`
**AFTER → active: true** with sensible header / panel / hero means you are done: convert and gate. These designs are
detected without help:

| family | recognised by | how it lays out |
|---|---|---|
| `shell` | `#shell` grid with `.shell-header`, `.shell-hero`, `.shell-aside` | grid collapses to the hero; the aside becomes the drawer |
| `fixed` | `position:fixed` `#canvas-container` + `.sidebar`/`.control-panel`; **or** a header found from the Guided-Inquiry/Physics buttons, plus the panel's big visual sibling (flex/grid rows); **or** `#shell.mm-3d-shell` (`#canvas-area` / `.plot-area`) | the hero is pinned `position:fixed` to the screen (minus the rail); the panel is a fixed drawer |
| `stage` | no sidebar: inquiry + control cards float (absolute) over a full-bleed canvas inside the inquiry's parent; **or** a floating `aside.panel` over a big canvas (Circuit-Lab style) | the cards move into a new drawer, or the aside itself becomes it; floating lab panels start folded on phones |

The header is detected as `.shell-header`, `.top-bar` or `.top-bar-app`, else the strip across the top that holds
`#btn-gi` / `#toggle-formal` / `#btn-cg` / `#ask-euler`. Play/Reset come from known ids or the header's
Play/Pause/Start and Reset buttons. A match must also *read* as that action.

**AFTER → active: false** ("not detected") means the page is none of the above. Go to step 2. Nothing has changed
on that page: the layer posts `{type:'ready', supported:false}` and stops, on phones too.

## 2. Map the roles (no markup changes): a role map
Create `roles.json`, with keys as roles and values as **CSS selectors** (the first match is used):

| role | required | meaning |
|---|---|---|
| `panel` | **yes** | the controls box → drawer / docked panel |
| `hero` | **yes** | the drawing area → fills the screen (a wrapper div is better than the bare canvas when there are overlays such as legends or labels) |
| `header` | no | top bar to hide; its *visible* controls (except roles below and `skip`) move to the top card. Omit it if the sim has none |
| `play`, `reset` | no | the sim's own buttons (the rail and the app click them; Play state is read from `.paused` / the label "Pause") |
| `guide`, `physics` | no | buttons that open a tour / an explanation sheet (moved to the top card; the app can call them) |
| `inquiry` | no | a guided-inquiry block **inside the panel**, which gets its own drawer tab |
| `inquiry-toggle` | no | the button that turns that inquiry on |
| `readouts` | no | block(s) of live values to mirror in the floating chip (selector may match several) |
| `skip` | no | header controls that must NOT move (decorative, desktop-only, theme switches) |

Then `node scripts/probe.mjs sim.html --roles roles.json --shots /tmp/p`, iterating until AFTER is right. Convert
with `python3 scripts/app_mode.py sim.html out.html --roles roles.json`. That writes
`<script id="fermi-app-mode-roles">window.__FAPP_ROLES={…};</script>` right before the layer. Re-runs keep it, and
`bulk_apply.py --roles` applies one map to a batch with the same structure.

**Instead of a map, you may mark the markup:** `<aside data-fapp="panel">`, `<main data-fapp="hero">`,
`<button data-fapp="play">`… Marks win over the map. Use them when you own the template anyway: new templates can
ship already marked.

## Recipes (all tested; see `examples/`)
| structure | roles |
|---|---|
| **top bar + left (or right) controls column + canvas** (`book-a-header-sidebar.html`) | `{"header":".topnav","panel":".left","hero":".stage","play":"#play","reset":"#reset","readouts":"#readouts"}` |
| **full-screen canvas + floating control box**, no header (`book-b-floating-box.html`) | `{"panel":"#box","hero":"#cv","play":"#play","reset":"#reset","readouts":"#readouts"}` |
| **CSS grid bar/side/main**, marked in markup (`book-c-marked.html`) | `data-fapp="header" / "panel" / "hero" / "play" / "reset" / "readouts" / "skip"` |
| controls **below** the canvas (stacked page) | `panel` = the controls block, `hero` = the canvas wrapper; the stacking is undone because the hero is pinned |
| several canvases / plots side by side | `hero` = their common wrapper (not one canvas) |
| controls split over two boxes | wrap them? No: pick the main box as `panel`. Controls left outside stay where they are. If they matter, mark the second box's parent as panel, or move nothing and accept it |
| iframe-embedded or WebGL (Three.js) | `hero` = the canvas wrapper; resize is synthetic, so the sim must listen to `window` `resize` (most do) or use a ResizeObserver |
| a sim with no controls at all | `panel` = any small box (e.g. its legend); or don't convert: a full-screen canvas sim is already fine on a phone |

## 3. Things that commonly go wrong, and the fix
| symptom (probe shots / gate) | cause | fix |
|---|---|---|
| drawing doesn't fill the screen / blank after conversion | the sim sizes its canvas once at load, or only repaints in the animation loop | the layer fires `resize` (and for non-shell families taps Play twice when a paused canvas went blank). If the sim has neither a resize handler nor a ResizeObserver, mark a **wrapper** as hero (CSS sizes it) and report the sim |
| bottom of the plot cut off on a phone | desktop `min-height` taller than the phone, or stacked panes | the layer frees oversized `min-height`, puts 2–3 stacked grid panes side by side, and lastly scrolls the hero. Persistent? Choose a wrapper hero |
| drawer content overlaps itself | the sim's CSS makes panel children `sticky` / `absolute`, or `flex-wrap` | already neutralised for direct panel children; for deeper ones, file it against the layer (generic rule) |
| drawer shows only an icon strip | the sim collapses its own sidebar on narrow screens | the layer clicks a visible `#sideExpand` / `[id$=Expand]`; otherwise add that sim's expand button to the layer generically |
| top-card button text unreadable | the sim's button colours are for a dark header | the layer restyles top-card buttons inside `@layer fermi.tokens`; if a design system uses another layer name, add it there |
| Play from the rail does nothing | the guessed button isn't Play, or the sim ignores synthetic clicks for ~1 s after Reset | set the `play` role; for the hold, have the sim treat `?app=1`/touch like its lab mode |
| a control vanished on the phone | it was in the header and is hidden on desktop too (fine), or it isn't a button/select/input/a/label | add the `skip` role or move it into the panel; the gate's `lost` check ignores invisible ones |
| desktop changed | impossible by design unless the guard was edited: the gate's B check fails then | restore the first-statement guard |

## 4. Gate, look, ship
`node scripts/app_mode_check.mjs sim.html out.html --shots /tmp/g` must PASS. Then look in `preview/index.html`:
- phone with app rails;
- phone without (browser);
- tablet;
- Back.

Sign-off happens on screenshots, not on the gate alone. The gate can't see "the chip covers the important part".
