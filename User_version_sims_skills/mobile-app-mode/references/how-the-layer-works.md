# How the layer works (fermi-app-mode.js v1.1.1)

It is read top to bottom. Every step runs only on the touch path.

1. **Guard (first statement).** It runs only if `?app=1` is in the URL, or `matchMedia('(pointer: coarse)')` matches
   and `?app=0` isn't. A mouse or trackpad (desktop, laptop, touch-laptop with a mouse primary) returns
   immediately, so the desktop is untouched. A second copy on the page is ignored (`window.__fermiAppMode`).
2. **Viewport.** If the page has no `<meta name=viewport>`, one is added. Without it a phone lays the page out
   980 px wide.
3. **Find the parts.** Roles first (`data-fapp` marks, then `window.__FAPP_ROLES` selectors), then automatic
   detection:
   - `panel`: `.shell-aside` → the inquiry zone's parent → `.sidebar` / `.control-panel` / `.right-col` → a
     floating `aside.panel` over a big canvas.
   - `header`: `.shell-header` / `.top-bar` / `.top-bar-app` → the top strip that holds the inquiry/physics buttons
     (accepted only if top ≤ 12 px, 24–170 px tall, ≥ 50% wide).
   - `hero`: `.shell-hero` → a fixed `#canvas-container` → the panel's one big visual sibling (or the row, when the
     drawing is split) → `#canvasContainer`.
   - **Stage family:** the inquiry's parent holds a canvas covering > 35% of the screen. The floating cards with
     inputs move into a new drawer.
   - **3D shell:** `#shell` without `.shell-hero` uses `#canvas-area` / `.main-container > .plot-area` (fixed family).
   - **Nothing found:** `post({type:'ready', supported:false})` and stop.
4. **Family:** `shell` | `fixed` | `stage` (class `fapp-<family>` on `<html>`). A role-mapped page is `fixed` unless
   its hero is a `.shell-hero`.
5. **Buttons:** `B.play` / `B.reset` come from roles, else known ids whose label or id must read as the action
   (Reset is never the Play button), else the header's own Play/Start and Reset. `guide` / `physics` /
   `inquiry` / `tutor` come from roles or `#btn-cg` / `#toggle-formal` / `#btn-gi` / `#ask-euler`. Since v1.1.1, a tutor
   link that lives in the Physics sheet header (the one-line sheet head) is left there and not moved to the drawer.
6. **Header extras:** the header's *visible* buttons, selects, links, labels and inputs are collected before the
   header is hidden, minus the skip list (theme toggles, maximize, info, the buttons above, the `skip` role).
7. **CSS.** One `<style id="fermi-app-mode-css">` is appended. Most rules are `html.fapp …` with `!important`. A second
   block sits inside `@layer fermi.tokens{…}`, because a design-system sheet with layered `!important` beats
   unlayered `!important`, and joining its first layer wins.
   - Phone: the drawer is `position:fixed`, right of the hero, slides in on `.fapp-open`.
   - Tablet (`fapp-docked`): the panel is docked at 340 px; the shell grid becomes `"hero aside"`, and the fixed
     family hero is narrowed.
   - The sim's top bar, HIDE tab, formal strip and landing hint are hidden; the Physics sheet becomes full screen.
8. **Drawer DOM:**
   - The panel gets `fapp-panel`, a head (tabs + ×) and the **quick card**, which holds, in this order:
     Play/Reset · header extras · Simulation guide | The Physics · Teach me. These are the sim's **own** elements,
     moved, so their listeners and ids keep working.
   - Children are tagged `fapp-iq` (inquiry) / `fapp-ct` (controls), and the tab shows one set.
9. **In-page rail** (Controls · Play/Pause · Reset) fades to 35% after 3 s idle. It is hidden by
   `{cmd:'native-rails'}` and while the tablet panel is open.
10. **Read-out chip:** `.shell-panel` / `.ctrl-box` blocks with `.stat-row` / `.ro-row` / `.readout-*` and no inputs,
    or the `readouts` role, are cloned (ids stripped) into a draggable chip. The clone is refreshed at most
    every 100 ms via MutationObserver. The chip starts folded on a phone if it covers > 15% of the screen.
11. **Tour hook:** if the page has a guide spec (`window.__GV_SPEC.steps`), a step that targets an element inside
    the closed drawer opens the drawer first (no transition, so the highlight lands right).
12. **Fit passes (phone):**
    - `shrinkOverlays`: absolutely positioned hero children covering 25–80% are scaled to 0.62 toward their corner.
    - `fitHero`: frees `min-height` larger than the hero; puts 2–3 stacked grid panes side by side.
    - `fitScroll` (shell): drops the sim's own active `max-width` rules that target the hero, then, if still
      clipped, lets the hero scroll.
    - Stage family: lab panels covering ≥ 30% fold once with their own fold/minimise button, and a self-collapsing
      sidebar is expanded.
13. **Refit:** a synthetic `resize` (next frame and after 260 ms). For non-shell families, a canvas that had ink and
    went blank while paused gets a net-zero Play+Play so it paints one frame.
14. **Back:** closes, in this order, the Physics sheet → info modal → guide tour → phone drawer, and replies
    `{type:'back', handled}`.
15. **Messages:** `post()` goes to `window.FermiApp.postMessage` (an androidx WebMessageListener) if present, else to
    `window.parent` (iframe hosts). Incoming: `message` events with `source:'fermi-app'`, `FermiApp.onmessage`, or
    direct calls to `FermiAppMode.handle()`.

## Classes you will see
- On `<html>`:
  - `fapp`, `fapp-shell` | `fapp-fixed` | `fapp-stage`;
  - `fapp-open` (drawer open or panel docked open), `fapp-docked` (tablet);
  - `fapp-native` (app rails), `fapp-idle` (rail faded), `fapp-hero-scroll`, `fapp-ownbg`.
- On elements:
  - `fapp-hdr`, `fapp-hero`, `fapp-panel`;
  - `fapp-quick`, `fapp-play`, `fapp-reset`, `fapp-half`;
  - `fapp-iq`, `fapp-ct`, `fapp-card`;
  - `fapp-shrink`, `fapp-minh`, `fapp-sbs`, `fapp-scrolly`, `fapp-hero-ctx`, `fapp-hdrp`.

All are added only on the touch path, so desktop CSS never sees them.
