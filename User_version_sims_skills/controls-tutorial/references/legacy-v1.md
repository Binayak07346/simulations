---
name: controls-tutorial-legacy-v1
description: Add (or upgrade) the "Simulation guide" overlay tutorial (formerly "Controls Guide") on a single-file interactive simulation HTML page. Use this skill whenever the user asks to add a simulation guide, controls tutorial, controls guide, control walkthrough, scene tour, "explain what's on screen", onboarding for the controls, or "the guide like the phase-plane sim" — even on sims that already have a guided inquiry. The result is a top-bar 🎛 Simulation guide button that FIRST tours the simulation window like a lab attendant — 4–6 scene steps that spotlight canvas regions (panels, graphs and their axes, the apparatus, readouts, the colour key) computed from the sim's own geometry — and THEN walks through every control and readout one at a time with a purple chat-bubble callout pointing at it, everything else hidden until its turn, terse descriptions, narration, and a bottom-right ‹ › Next nav.
---

# Simulation guide (overlay tutorial) for Simulation Pages

> **Naming (2026-10-01).** The user-visible name is **Simulation guide**
> everywhere a student can read or hear it: header label, its `title`, the
> landing card, narration, info text, aria-labels. Internal names stay as
> they are — `#btn-cg`, `cg*` classes, `cgSteps`/`steps`, `setCg`,
> `data-mode="controls"` — never rename ids, classes, JS identifiers or
> comments. Below, "the guide" = the Simulation guide; "Controls Guide" in
> older builds and in code comments means the same thing.

Retrofit an existing sim with the Simulation guide. The guide has two parts:
the **scene tour** (§7 of the reference, approved 2026-10-01 on the Phase
Plane sim and rolled out to all 116 uni-lab user sims) followed by the
**controls walk** (the original Controls Guide). The reference builds are
the user-validated `Double-slit-experiment.html` (guide-only, minimal
integration) and `L1-Solar_System_Orbits-two-button-mock.html` (guide +
guided inquiry with the two-button template). Verbatim blocks are in
`references/implementation.md`. **Read it before writing code.** Copy the
blocks; adapt only the parts marked ADAPT.

> This design SUPERSEDES the earlier sidebar-card tutorial (sticky card
> zone, "Try:" lines, title-bar Hide/Show toggle). Do not build that.

## Acceptance criteria (the validated behavior — all mandatory)

1. **Original sim untouched at boot.** Until the guide button is pressed,
   the sim behaves exactly as before: same boot state (playing or paused
   as the author made it), all controls and readouts visible, no callout
   or nav in the DOM. The only persistent additions are ids on wrapper
   elements, one CSS block, one button, and one script.
2. **One top-bar button, 🎛 Simulation guide** (title "Show or hide the
   simulation guide"), in the sim's own top-bar button style, filled
   dark-green when active. It toggles the guide on and off. Keep the
   button's element structure (emoji/`.btn-lbl` spans, id, classes); change
   only the visible text and `title`. The longer label must not wrap the
   header — measure (§4). If the sim has a guided-inquiry zone, it gets a sibling
   🧭 Guided Inquiry button and the two are MUTUALLY EXCLUSIVE (see
   "Two-button template" below). No Lecture mode anywhere.
3. **Overlay, not cards.** Each step shows a floating callout anchored
   beside its control: PURPLE border and title (so it never blends with
   the green glow on the control), a speech-bubble arrow on the edge
   facing the target, aimed at the target's centre. Placement is
   side-aware: right-sidebar targets get the callout to their LEFT with a
   right-edge arrow; top-bar/canvas targets get it BELOW with a top arrow,
   flipping above when cramped. The closing card is centred with no arrow.
   Nav is a floating bottom-right bar in the callout's purple identity
   (purple border, outlined purple pager buttons, solid-purple Next):
   ‹ › pager + `Next →` (reads `Done` on the closing card).
4. **Hidden until its turn — by location.** Not-yet-introduced elements
   are hidden, never merely dimmed: sidebar panels and boxes collapse
   (`.cg-hidden`, display:none); top-bar controls go invisible but keep
   their slot (`.cg-veiled`, visibility:hidden) so the bar never reflows.
   The current control glows (`.cg-glow`, green pulse). A `cgMax`
   high-water mark makes reveal monotone: back-navigation never re-hides.
5. **Session memory.** Completing the guide (Done) or toggling it off
   restores everything. Reopening in the same session resumes at the step
   left, with everything introduced so far still visible; after completion
   it opens on the closing card with everything visible, and stepping
   back never re-hides. A browser reload is what restarts the guide from
   step 1. **Reset restores first-load**: the guide closes and its
   progress clears (`cgStep = cgMax = 0`); with the two-button template,
   Reset also puts Guided Inquiry back on at card 1. (Fleet builds since
   2026-09-22 are MODE-LOCAL: Reset during the guide restarts the tour at
   step 1 — scene step 1 — and keeps it open; see the reset-mode-local
   skill. The verifier accepts either form.)
6. **Copy is terse.** One line per CONTROL step: what it is and what it
   controls, ≤15 words. No "Try:" lines, no observable-effect sentence.
   The closing card: "That's every control — explore freely; reopen the
   guide from the top bar." (Scene steps have their own budget — item 9.)
7. **Complete coverage.** Every control and every readout panel gets a
   step or a written reason it doesn't (meta-UI only: theme toggle, info,
   hover-hint switches). A missed panel (the View panel was missed once)
   fails the manual check.
8. **Card voiceover + Auto walkthrough** (validated on C025). The nav is
   TWO rows: a "Listen" row (⏮ ▶ ⏭ transport + Auto pill) above the card-nav
   row (‹ › Next), split by a hairline — a single wide row would overflow
   onto the canvas. Play reads the current step (its `say` when present, else
   title + text) from the top; pause
   keeps position; resume continues; finish flips to replay. Navigation by
   ANY route keeps narration card-synced. Auto narrates each step then
   advances after a 700 ms dwell, turning itself off on the closing card.
   Auto pill: muted outline off, solid purple + glow on. Voice: quality-
   ranked (Google US English first, locals as fallback). All code + the
   Chrome TTS pitfalls (deferred speak, guarded cancel, hang watchdog,
   engineDead) are verbatim in `references/implementation.md` §6 — the
   defenses are load-bearing, copy them exactly; ADAPT only the `norm()`
   speech replacements for the sim's symbols.

9. **Scene tour first (the window, before any control).** 4–6 scene steps
   are PREPENDED before the first control step. They explain the
   SIMULATION WINDOW the way a lab attendant introduces an experiment: what
   the canvas shows overall, each panel/graph (its axes and what they
   mean), the experimental setup and its parts, on-canvas readouts, the
   colour key. Each scene step spotlights a REGION with the `#cg-spot`
   element (purple callout + green-glow box), computed every time from the
   sim's own geometry — never hard-coded pixels. Rules:
   - **True of the screen.** Describe only what is on screen at that
     moment of the guide. Find what opening the guide sets up
     (`__cgPrepare`, `__freeExplore`, `__cgReveals(99)`) and write to that
     state; where the student can leave the sim in another state (view
     mode, frame, a toggle off, a stage), make `title`/`text`/`say` getters
     that adapt — the step must stay true for whatever is showing.
   - **Never change sim state** from a scene step beyond what the guide's
     own open/prepare hook already does in the original — no scenario/mode
     switches, resets, clearing. Opening the guide must not destroy student
     work earlier than it did before.
   - **Never give away a Guided Inquiry answer.** Read every card first;
     list the answers; no step may state or name them (e.g. never "the path
     is a parabola", "d stays the same", "the span collapses to a line").
     If the opening state already DISPLAYS an answer, don't change it —
     flag it in the report.
   - `title` 2–5 words, unique across the WHOLE guide (a scene step named
     like a control step — "Carrier energy E" twice — shipped once);
     `text` ≤ 24 words (the callout is 260 px wide);
     `say` = 1–3 warm spoken sentences in plain words, symbols written out
     ("forty-five degrees", "v over c", "psi squared", "E one"), checked
     against the sim's `norm()`.
   - Physics exactly right — verify every claim against the sim's code
     (signs, directions, units, ranges, what is drawn in which colour).
   - The first scene step opens "Before the controls, let's look at the
     simulation window…" (in `say`); the last hands off: "…Now, let's meet
     the controls."
   - An existing whole-canvas first step ("The scene", "The apparatus",
     "The plane"): EITHER keep it as the opener and add spot steps after
     it, OR replace it and fold its content in — never two steps saying
     the same thing. If its old wording spoils a card, replace it.
   - Leave the closing "That's every control" step as it is.
10. **Spotlight engine invariants** (reference §7, verbatim). The spot is
    created with the callout (`data-no-reset`), positioned on every step by
    `placeSpot()`, used as the callout's target on spot steps, never gets
    `cg-hidden`/`cg-veiled` put on real elements, never glows a real
    element (the sel-glow path skips spot steps), and is hidden when the
    guide closes. `inside:'center'|'top'|fn(cw,ch)` puts the callout INSIDE
    or beside the region with no arrow; the callout must never cover the
    thing its step describes. A **ResizeObserver** on the canvas/stage
    re-runs positioning while a spot step is showing — MANDATORY: the
    sidebar HIDE/OPEN tab resizes the canvas with no window `resize`
    event, and the spot must follow it.

**Scene/mode-dependent controls.** If a guided control is hidden by the sim
in some scenes or modes, publish `window.__cgPrepare` from the sim (pin a
scene where every guided target exists) — the controller calls it on entry.
The browser test catches the failure (glowing target not visible); the
headless gate cannot, because it never reaches that scene.

## Workflow

### 1. Map the sim
List every top-bar control, every sidebar panel/box, every readout panel,
in layout order. Classify by LOCATION: top bar → `veil`; sidebar/canvas
panels → `hide`. Identify the sim's top-bar button class (reuse it for the
guide button), its Reset element, and whether a guided-inquiry zone exists.
Give wrappers ids where missing (`sep-box`, `params-group`, …) — markup
only, no behaviour change. Group tightly-coupled controls with `also`
(e.g. slit separation + slit width; a select + its label) so they reveal
and glow together.

### 2. Insert the blocks (reference §1–3, then §7)
CSS before `</style>`; the button pair in the top bar's LEFT cluster,
immediately AFTER the theme toggle (order: title/info → theme → Guided
Inquiry → Simulation guide … Reset/Play stay right-anchored — the JEE fleet
reference; never glue the pair to Reset with margin-left:auto); the
controller `<script>` before `</body>` —
INCLUDING its `<script>` wrapper. ADAPT only the `steps` array (selectors,
mode, `also`, title, text) and the Reset selector. Then add the spotlight
engine and the scene steps (§7): the `#cg-spot` CSS rule, the five engine
hooks, the ResizeObserver, and `cgSceneSteps` prepended to the step array.

### 2b. Write the scene steps (reference §7.4–7.6)
1. Read the sim's layout/draw code and find its geometry: canvas boxes,
   plot-area constants, coordinate mappers (`X()`, `Y()`, `toScreen`,
   `labToScreen`), 3D projection, DOM legends/readout overlays. Spot rects
   come from those, on the canvas's LIVE `getBoundingClientRect()`.
2. If the geometry is private to the sim's closure, add ONE read-only hook
   `window.__cgGeo = () => ({…})` that exposes existing values (mappers,
   layout, current state) — it must not change state, drawing or timing.
   3D scenes: project the sim's own objects through its own camera.
3. Plan 4–6 steps (window → panels/apparatus → readouts → key), read the
   Guided Inquiry deck, list its answers, then write title/text/say.
4. Choose callout placement per step: arrow beside a narrow spot (default);
   `inside` for large regions — `'top'`/`'center'`, or a function returning
   an empty patch (a quadrant away from markers, the sidebar column level
   with the spot, a clear area found by scanning) so it never covers what
   the step names, the tour nav box, or the spot.
5. Narration: the guide's voice getter must read `say` when present
   (`() => st.say ? [st.say] : [st.title, st.text]`, reference §6.4).

### 3. If the sim has a guided-inquiry zone: two-button template (reference §4)
Add the 🧭 Guided Inquiry button (boot: active) beside 🎛 Simulation guide.
Wire `setGi`/`setCg` for mutual exclusion and expose the four hooks:
- `window.__giOff` — the inquiry's own Finish/Skip route here (the GI
  button is the single owner of inquiry visibility; delete any restore
  strip and any Lecture button/mode).
- `window.__freeExplore` — turning the inquiry OFF, or reaching both-off,
  hands over the POST-COMPLETION state (all inquiry reveals lifted, no
  mid-inquiry leftovers such as ghost objects or zoomed views).
- `window.__giResume` — turning the inquiry back ON re-applies its current
  step's state (reveals, view, pause-on-gate), so progress is intact.
- `window.__fullReset` — Reset = first-load: GI on at card 1, CG off with
  progress cleared, sim defaults restored, then paused/playing as on boot.
Entering the guide lifts inquiry-step reveals (`window.__cgReveals(99)`)
so hidden-by-inquiry panels can be described; the guide's own hide/veil
then takes over.

**Scope hazard:** functions inside the sim's IIFEs (`applyStepReveals`,
`setInquiryCollapsed`, …) are NOT visible to a separate `<script>`. Expose
them on `window` or the sim's public object; a `typeof fn === 'function'`
guard silently no-ops otherwise — this bug shipped once and only showed in
a real browser.

### 3b. Voiceover + Auto (reference §6)
Insert the engine script BEFORE the controller, append the voiceover CSS,
apply the controller deltas (two-row nav, `setCgAuto`, sync/stop hooks).
Extend `norm()` with this sim's physics symbols. Match the Listen-row button
height to the sim's existing pager buttons — never grow the sidebar row.

### 3c. Header label
`#btn-cg` visible text "Simulation guide", `title` "Show or hide the
simulation guide"; landing card + welcome narration renamed with it
(welcome-overlay skill). Rename every other user-visible "Controls Guide"
string (tooltips, the guide's own text, Info modal, aria-labels); report
each. Header-wrap check: measure header height at 1536/1440/1366/1280 on
the original and the build; if the build wraps where the original didn't,
add `.shell-header #btn-cg{padding-left:8px;padding-right:8px;}` (adapt the
selector to the sim's header; 6px if 8 still wraps) and re-measure.

### 4. Verify
```
node scripts/verify.js <patched.html> --baseline <original.html>
```
Config-free: boot untouched (no callout, no cg classes); button toggles;
callout + arrow + side class per step; hidden/veiled set non-empty at step
1 and monotone; glow present and never on a hidden element; back-nav
never re-hides; closing card has no arrow and `Done`; Done restores
everything and deactivates; revisit lands on the closing card fully
visible; Reset deactivates and clears progress (reopen = step 1 re-hidden);
no NEW runtime errors vs baseline (CDN libs like Three.js/KaTeX throw
headlessly — baseline subtracts them).

Run the browser test twice: default, and with `--theme-toggle <selector>` on
sims that have a theme switch (plus once at `--viewport 1024x768`).
Manual checks (browser): callout placement and arrow aim on real
geometry; every control/readout covered; copy true for THIS sim.

Scene-tour checks (headless browser, 1440×900 AND 1280×720 — the jsdom
gate cannot see geometry, so these are mandatory). Automated by
`node ../tests/sim-guide-scene.mjs <build> --original <orig> [--viewport 1280x720] --shots shots/`
(everything below except LOOKING at the screenshots, the alternative-state
walks and the `say` comparison):
- Walk EVERY step to Done. For each scene step log: spot shown, spot inside
  the viewport, callout fully inside the viewport, callout not overlapping
  the spot unless it is an `inside` step (then it must not cover the thing
  named), no real element carrying `cg-glow`.
- Screenshot each scene step and LOOK: spotlight on the right thing, text
  true of the picture, callout not covering it. Repeat from 2–3 other
  states a student can leave (other view/frame/mode, a toggle off, dragged
  objects, after the inquiry) — text adapts, spots follow.
- Press the sidebar HIDE tab (`#sb-hide-tab`) during a spot step: the spot
  moves with the canvas; OPEN puts it back exactly.
- Narration: stub `speechSynthesis.speak` (volume 0) and record — each scene
  step speaks exactly its `say`.
- Production safety, ORIGINAL vs BUILD: no new console/page errors; Guided
  Inquiry from the header has the same card count and walks identically to
  Finish; The Physics sheet, Reset, theme, HIDE tab and Play/Pause behave
  the same before and during the guide; opening the guide leaves the sim
  state (params, play, student work) exactly as the original did.
- After Done / header close: spot hidden, zero leftover `cg-*` classes.

Deliver as a new file; never overwrite the upload in place.

## Pitfalls (each observed)
- Scene tour (2026-10-01 rollout, 116 sims):
  - A scene step that switched the sim's scenario "to show the right
    picture" destroyed the student's work on guide open — never change
    state; adapt the text instead.
  - Missing ResizeObserver: the sidebar HIDE tab left the spot stranded
    over the old canvas position on 9 sims — now mandatory.
  - Old whole-canvas openers spoiled cards ("straight up in one frame, a
    parabola in the other", "same light, longer path", "the order can
    flip") — replaced, never copied into a new step.
  - Text describing things not drawn in the current state (a legend still
    veiled, a curve hidden by a toggle, a wrong colour in light theme) —
    screenshot every step from more than one state.
  - Callouts covering the very region they describe; fixed with `inside`
    functions that score empty patches against markers/labels/nav.
  - A spot getter returning a rect for an element hidden in the current
    view — return `null` (the callout then centres with no arrow).
  - Narration said "proj" as "the projection" through `norm()` — read new
    `say` lines through the sim's `norm()` before shipping.
  - The longer label wrapped the header at 1440 (Bloch) and 1280 (L01-s1)
    — measure every build.
  - New `say` lines have no pre-recorded ElevenLabs clip until the
    narration pipeline is re-run; the browser voice covers them. Never
    edit a `<script data-fermi-static-narration>` block.
- Dim instead of hide — un-introduced controls stayed readable. Hide.
- Hiding top-bar buttons with display:none — the bar reflows. Veil.
- Callout in the same colour as the glow — two jobs, two colours.
- Scope bug above — hooks must be on `window`.
- Lecture mode conflicting with the buttons — remove it; both-off is the
  presenter view.
- Forgetting a sidebar panel (View/Zoom) — enumerate everything.
- Reset leaving a hybrid (closing card lingering, inquiry gone) — Reset
  must route through `__fullReset` / clear guide progress.
- The controller pasted without `<script>` tags is inert text.
- Light-theme selector mismatch (`html[data-theme]` vs `body.light-theme`)
  left the callout dark on a light UI; the CSS now targets both hooks.
- On a 1024×768 viewport the last sidebar panel sat below the fold and the
  clamped callout drifted 119px from it; the controller now scrolls the
  target into view before measuring. Always run the smoke at 1024×768 too.
- Applying a skill twice (bulk re-runs) duplicates ids — every verifier
  now fails on duplicate template ids or script blocks.
- Green/white nav shipped in one reference while the agreed design was purple — the nav
  must match the callout; the reference CSS now carries the purple nav.
- Testing: jsdom walkthroughs must count clicks exactly; several "bugs"
  were test off-by-ones. Assert state, not click counts.
- Voiceover: every Chrome TTS pitfall in reference §6.5 was hit for real on
  C025 — deferred speak after cancel, `safeCancel` (an idle cancel wedges the
  browser's TTS service until a FULL browser restart), the no-events remote-
  voice hang caught by the `onstart` watchdog, `resume()` only when paused,
  and real-gesture-only audio testing. Never re-derive this from scratch.

## Bulk application
One sim at a time, full mapping each time; never reuse another sim's
`steps`, ids, or copy. Always `--baseline`. Log deviations and report
them as skill feedback.

Upgrading a LIVE sim's existing Controls Guide (the 2026-10-01 rollout —
production procedure in the welcome-overlay skill, §Migrating): the change
is items C (header + other user-visible renames), E (spotlight engine,
§7.1–7.3) and F (scene steps, §7.4–7.6), shipped together with the
welcome's A (landing), B (narration) and D (glass CSS). Every hunk of the
diff must be one of A–F or the single `__cgGeo` hook; nothing else.
Parallel agents (one sim each) worked well: fresh snapshot → exact-anchor
`build.py` → headless orig-vs-new checks → `cmp`-guarded copy-in → the
orchestrator commits one sim per commit staging ONLY that diff. Reference
patchers that shipped: Phase Plane (`cgSteps` controller, plate geometry),
L12-s2 Twin Paradox (shell `steps` controller, `__cgGeo` mappers,
`inside` functions), L11-s1 train (3D, projected rects).
