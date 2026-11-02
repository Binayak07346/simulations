# Lessons learned (each cost real time once)

## Detection and layout
- **Width-based media queries are the trap.** A landscape phone is 667–932 px wide but only 360–430 px tall, so
  desktop "≤ 1000 px" rules stack the page into a scrolling column. Key mobile behaviour on `pointer: coarse` plus
  an explicit `?app=1`, never on width.
- **Let the sim keep its own elements.** Move the real buttons, selects and panels (`appendChild`) instead of
  cloning or rebuilding them. Listeners, ids and the sim's own state logic keep working. Only the read-out chip is
  a clone, refreshed by a MutationObserver with ids stripped.
- **A native control-list bridge isn't enough to rebuild a panel.** On real sims it returned:
  - about 46 "controls" per sim, mostly internal buttons;
  - unlabelled sliders in 84 of 214 sims;
  - controls without ids in 50 sims.

  Use the sim's own panel as the drawer.
- **Layered `!important` beats unlayered `!important`.** A design-system sheet in `@layer` won every tab, button
  and padding fight until the layer's own rules joined its first layer (`@layer fermi.tokens{…}`).
- **Sim CSS fights the drawer:** sticky or absolute panel children, `flex-wrap`, `min-width:360px`,
  `.panel button{width:100%}`, content-box panels 28 px wider than expected, inline `flex:0 0 auto !important`
  set at DOMContentLoaded. Neutralise them generically on direct panel children and the drawer chrome.
- **Canvases:**
  - some sims size their canvas once and repaint only in the animation loop, so a synthetic resize leaves them
    blank while paused (repaint trick: net-zero Play+Play, non-shell families only);
  - WebGL canvases read blank to pixel checks, so skip them;
  - CSS zoom/transform breaks pointer maths, so never scale a page to fit.
- **Phone height is tiny:**
  - desktop `min-height`, stacked panes and fixed-height plots are cut off, so the layer frees `min-height`, puts
    panes side by side, and scrolls as a last resort;
  - a sim's own `@media (max-width)` stacking rules for mobile web are counter-productive inside a fixed app
    viewport (drop the ones that target the hero).
- **Self-collapsing UI:**
  - a lab sidebar collapsed itself to an icon strip on narrow screens, and re-collapsed when an experiment loaded
    (keep it expanded, observing class changes);
  - floating lab panels (guide card, instrument dock, schematic) together covered the whole bench on a phone
    (fold each once, the first time it opens; never re-fold after the student opens it).
- **Header detection:** QM sims had six different header class names. Deriving the header from the buttons it
  holds (the inquiry/physics buttons) plus a "strip across the top" check found all of them.
- **Missing viewport meta:** a phone lays the page out 980 px wide. Add the meta on the touch path only.
- **Play/Reset matching:** a class like `.btn-topbar-reset` sat on a Start/Pause button. Require that the label
  or id *reads* as the action, and never let Reset be the Play button.
- **Guide tours** that point at controls inside a closed drawer must open it first, with no transition, or the
  highlight lands off-screen.

## Process
- **Verify the verifier:** every gate was run on a build without the layer and on one with the guard removed
  before it was trusted. Both failed as expected.
- **Most first-pass flags are gate false positives.** About 64 of 69 flags in one group were. Screenshot review
  found the real defects the gate couldn't see.
- **Load flakes:** 15+ headless pages on one machine gave `page.goto` timeouts and mid-transition snapshots.
  Re-run at low concurrency before calling a sim broken.
- **Desktop "differences" were load timing.** Sims shift their own layout for about 1 s after load. Wait about 4 s
  and re-check orig vs orig before flagging; the byte proof plus the first-line guard is the real guarantee.
- **Owner sign-off is on pictures.** Mocks in a device frame with emulated app rails settled more questions than
  any spec, e.g. "two pills side by side", "buttons touching the border", "don't show a permanent pill".
- **Deploy surgically:** fetch with ETags, back up, canary, conditional writes, verify served pages. Then sync the
  repo by inserting in place, and make the pipeline add the layer last. Otherwise the next rebuild silently drops
  the mobile view.
- **Automated pushes to shared storage may be blocked by safety tooling.** Hand the owner a ready, self-checking
  script (re-verify ETags, back up, IfMatch, verify) rather than working around the block.
