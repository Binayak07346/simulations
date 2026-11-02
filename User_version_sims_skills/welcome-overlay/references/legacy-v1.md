---
name: welcome-overlay-legacy-v1
description: Add (or migrate) the first-landing Welcome overlay on a single-file simulation HTML page that carries the Guided Inquiry / Simulation guide two-button template. Use this skill whenever the user asks for a welcome screen, landing overlay, intro card, mode picker, "start screen", "the two-mode landing", "liquid-glass landing buttons", or "the welcome we did for the solar-system sim". The result is a centered, immersive overlay over the live sim: a hero strip that draws the sim's core physical idea, a small "Welcome to" kicker over the big sim name, a one-line description, TWO liquid-glass cards side by side (Simulation guide, Free exploration — Guided Inquiry is NOT offered on the landing; it stays on the header 🧭 button), and a Spotify-style read-aloud player using the browser's speech synthesis. Purely additive: two CSS blocks, one overlay element, one script, one hook.
---

# Welcome overlay (centered, immersive, two modes)

The reference build is the user-validated `L1-Solar_System_Orbits` centered
welcome, upgraded on 2026-10-01 to the owner-approved **two-mode liquid-glass
landing** (first approved on `CM_sims/cm-phase-plane.polished.html`, then
rolled out to all 116 uni-lab user sims). Verbatim blocks are in
`references/implementation.md`. **Read it before writing code.** Copy the
blocks; adapt only the ADAPT parts.

> The three-card landing (Guided inquiry · Recommended / Controls guide /
> Free exploration) is RETIRED. Senior-manager feedback: three entry modes
> confused first-time users. Never build it again; migrate it when you meet
> it (§Migrating a live three-mode sim).

## Production-safety contract (read this twice)

These sims are shipped products. The overlay must be impossible to blame
for a regression:

1. **Additive only.** The ONLY changes to a sim are: the base welcome CSS
   block and the liquid-glass landing block (§1 + §1b, both before
   `</style>`, glass block AFTER the base block); one `#welcome-overlay`
   element as the first child of `body` after the header (fixed-position,
   so placement is cosmetic); one `<script>` before `</body>`; and one
   5-line `window.__setMode` hook inside the existing two-button
   controller. Never edit the sim's own functions, styles, or markup.
2. **The sim boots exactly as before behind the overlay** — same
   playing/paused state, same panels, same inquiry card (Guided Inquiry is
   still the boot mode behind the dim; only the landing no longer offers
   it). The overlay only dims and blurs; choosing a mode calls
   `window.__setMode`, which routes to the SAME `setGi` / `setCg` the
   top-bar buttons use.
3. **Nothing leaks after dismissal.** Dismissing hides the overlay
   (`display:none`, so it intercepts nothing), stops speech, and leaves
   no timers or listeners that touch the sim.
4. **No hard dependencies.** Speech synthesis is feature-detected; if
   absent, the player disables itself and nothing throws. No external
   assets, fonts, or libraries.
5. **Z-order.** Overlay z-index 5000 sits above the guide callout/nav
   (4000) and the guide spotlight `#cg-spot` (3990). Nothing in the sim
   should exceed it; check.
6. **Gate before delivery** with BOTH verifiers (§Verify), and look at the
   screenshots — both themes.

## Anatomy (validated — do not restructure)

- Backdrop: radial dim over the live sim, 2px blur — dark tones on the dark
  theme, light tones on the light theme; the composition is IDENTICAL in
  both (no card box appears in light mode).
- Hero: a full-width band (`#welcome-fringes` canvas, masked to fade at
  both sides) above the title, drawing the sim's core idea from its own
  equations — see "The hero is the one per-sim decision".
- Title `h2` = a small muted kicker "Welcome to" (fixed) over the sim
  name in the big weight (`.welcome-name`, ≤22ch, e.g. "Solar system
  orbits"). One-line description beneath (≤ ~18 words).
- "How would you like to begin?" then **TWO LIQUID-GLASS CARDS** in a row,
  centred (`max-width:510px` → each card 248×181 at 1440 wide, i.e. the
  ORIGINAL single-card size of the old three-up row, 244×181, ±4px; use
  `max-width:502px` if you want it exact), stacking on narrow screens.
  Same icons, text and text colours as the old cards; only the surface
  changed to one whitish glass material: translucent white gradient fill,
  `backdrop-filter: blur(20px) saturate(180%)`, 18px radius, inset top
  highlight, a specular sheen (`::before`) and a light-catching rim
  (`::after`, bright top-left/bottom-right), spring hover lift, press
  scale. ONE colour only (whitish) — no per-mode tinted glass (a
  blue-tinted variant was rejected). Each card: icon tile, title,
  one-line description, a "Start ›" affordance at the bottom.
  **Simulation guide** (purple icon tile) → `data-mode="controls"`;
  **Free exploration** (amber icon tile) → `data-mode="free"`.
  Descriptions are fixed HOUSE COPY: "What’s on screen, then every
  control — one at a time." / "Everything open. Experiment on your own."
- **No Guided Inquiry card on the landing.** The 🧭 Guided Inquiry header
  button still opens it (and it is still the boot/Reset mode behind the
  overlay). The inquiry-specific CSS selectors
  (`.welcome-mode[data-mode="inquiry"] …`, `.wm-tag`) may stay — harmless.
- Footer: "Listen to the intro" + transport inline on ONE row: skip-back,
  44px circular play/pause (SVG icons switch by `data-state`),
  skip-forward, then the segment-per-line progress bar beside them.
  Icon-only buttons; state in `title`/`aria-label`. (A variant with the
  bar beneath the buttons was tried and rejected — keep it inline.)
- Read-aloud: 5-line script spoken one utterance per line; true
  pause/resume via a tracked (line, char) position from boundary events;
  skip-back restarts the line or steps back; auto-attempts on load with a
  timed fallback; stops on mode choice.

## Rules

- **Offer only modes that exist.** The landing has at most two cards:
  `controls` (Simulation guide) iff the sim has `#btn-cg`; `free` always.
  Never a `data-mode="inquiry"` card. If the sim has no guide, the landing
  is the single Free-exploration card (centred; set
  `grid-template-columns:1fr` and `max-width:248px` in the glass block —
  derived, not yet exercised: every fleet sim has a guide).
- **Copy is per sim and short.** `.welcome-name` = the sim name only (the
  kicker supplies "Welcome to"); description = the phenomenon in one
  sentence a student can picture; hero caption = what the dots literally
  are. Speech lines 1–2 are sim-specific; line 4 names THIS sim's main
  on-screen components (2–4 of them, the same ones the guide's scene steps
  spotlight); lines 3 and 5 are house copy (reference §3).
- **Counts in narration.** No line may promise "three ways in", "three
  options", etc. — two ways in. Grep the script for `three`/`3` after every
  migration.
- **Theme + font hooks.** Replace `var(--font-sans)` with the sim's font
  variable. Light-theme rules target both `html[data-theme="light"]` and
  `body.light-theme`; add a selector only for a third hook (fleet has
  `body.theme-bright`, `body.theme-light`). No other CSS edits.
- **Light theme: match the glass to the overlay, not to the theme flag.**
  The glass block's light variant (whitish glass, `rgba(255,255,255,.72)`)
  is only correct when the overlay itself turns light in light theme
  (the base welcome CSS has `html[data-theme="light"] #welcome-overlay{…}`
  and dark `.welcome-card` text). Measure, then pick one of three cases
  (reference §1c):
  1. overlay turns light, card text turns dark → keep the light-glass rules
     as shipped (105 of 116 fleet sims);
  2. overlay stays DARK in every theme (no light welcome rules) → DROP the
     light-glass rules, leave the comment; the dark glass stays (10 QM sims;
     7 of them shipped pale text on whitish glass first and were fixed);
  3. overlay turns light but `.welcome-mode` hard-codes a pale `color` →
     keep the light glass AND add the dark title/description/Start rules
     (stern-gerlach-NEW).
- **Show-once.** `WELCOME_ONCE` in the script controls a `localStorage`
  flag (try/catch). Keep it `false` while the user reviews; set `true` for
  production. Reset must NOT re-show the welcome (it doesn't — Reset is
  the sim's first-load state, not a first visit).
- **Reduced motion.** The hero draws in one frame, the card entrance is
  disabled, and the glass transition is off under `prefers-reduced-motion`.
- **Header label.** The landing and the header must agree: the `#btn-cg`
  label reads "Simulation guide" (title "Show or hide the simulation
  guide") — owned by the controls-tutorial skill, checked here.

## The hero is the one per-sim decision

Everything else is fixed. The hero must:
- Draw the sim's central idea **from its own physics**, not a stock
  image: interference intensity sampled into dots (double-slit); orbits as
  equal-time-step dots so density shows speed (solar system). Ask: what
  single picture IS this sim?
- Accumulate as the single orchestrated entrance moment; never loop.
- Carry a caption that names what is drawn, not the conclusion.
- Known trade-off (accepted by the user): the hero may show the phenomenon
  the first Predict asks about. Keep the caption neutral so it doesn't
  spell out the answer.
Two exemplars are in the reference (§4). Write a new `drawHero` for each
sim; keep the canvas id, size (1280×240), and the `reduce` handling.

## Workflow (new build)

1. Confirm the sim has the two-button template (`#btn-gi` / `#btn-cg`,
   `setGi` / `setCg`) with the Simulation guide scene steps. If not, apply
   the guided-inquiry / controls-tutorial skills first.
2. Insert the blocks (reference §1, §1b, §2, §3, §5). Map font + theme
   hooks; decide the light-theme case (§1c).
3. Write the sim's copy and speech lines; write `drawHero`.
4. Verify (below). Deliver as a new file; never overwrite the upload.

## Migrating a live three-mode sim (what was done to all 116 on 2026-10-01)

Surgical, A–D only — every hunk of the diff must be one of these:

- **A. Landing markup** — delete the whole
  `<button … class="welcome-mode" data-mode="inquiry">…</button>`; in the
  controls card change `.wm-title` "Controls guide" → "Simulation guide"
  and `.wm-desc` → "What’s on screen, then every control — one at a time."
  Free card unchanged. Keep ids, `data-mode`, icons.
- **B. Welcome narration** — delete the `'Choose Guided Inquiry …'` line;
  reword the `'Choose Controls Guide …'` line to introduce the Simulation
  Guide as a tour of what's on screen naming this sim's components, then
  every control (fleet form: `'Choose Simulation Guide for a tour of
  what’s on screen — the two panels and the colour key — and then every
  control.'`); fix any "three ways in" → "two ways in". Run new text
  through the sim's `norm()` mentally (symbols spoken as words).
- **C. Glass CSS** — append reference §1b verbatim right after the sim's
  welcome-overlay CSS (it wins by `#welcome-overlay` specificity either
  way); apply the light-theme case from §1c.
- **D. Header** — `#btn-cg` label/title rename (controls-tutorial skill,
  item C there), then the header-wrap check at 1536/1440/1366/1280 (the
  label is ~11px wider; Bloch oscillations and L01-s1 wrapped — fix with
  `.shell-header #btn-cg{padding-left:8px;padding-right:8px;}`, 6px if 8
  still wraps).

The guide's scene steps (controls-tutorial §7) ship in the same change —
the new landing promises "What's on screen", so the guide must deliver it.

Production procedure that kept 116 live sims safe:
- Work on a scratch copy (`orig.html` = fresh snapshot → `new.html` via an
  exact-anchor patcher that asserts each anchor matches once). Never edit
  the live file by hand.
- Compare ORIGINAL vs NEW headless: no new console/page errors; Guided
  Inquiry from the header has the same card count and walks identically to
  Finish; The Physics sheet, Reset, theme, sidebar HIDE tab and Play/Pause
  behave the same (before and during the guide).
- Copy `new.html` over the live file ONLY if `cmp` shows the live file is
  still byte-identical to `orig.html` (other sessions edit these files).
- If another session has uncommitted edits in the same file, commit ONLY
  your diff (apply `diff(orig→new)` to the index with `git apply --cached`
  onto HEAD, plain `git commit`, never `git commit -- <path>`), and keep
  every hunk ≥4 lines away from their edited ranges so it applies cleanly.
- One commit per sim, so any sim can be reverted alone.

## Verify
```
node scripts/verify.js <patched.html> [--baseline <original.html>]  # headless invariants
node ../tests/browser-smoke.js <patched.html> --baseline <original.html> \
     [--cdn-map ../tests/cdn-map.json] --shots shots/     # real browser (Playwright)
node ../tests/sim-guide-scene.mjs <patched.html> --original <original.html>  # landing + guide, headless Chrome
```
Add `--theme-toggle <selector>` (sims with a theme switch) and a second run
with `--viewport 1024x768`; the smoke's alpha-aware contrast check covers
template text in both themes. Headless: overlay present once, z-index
5000, exactly two cards (`controls` iff `#btn-cg`, `free` always), no
`inquiry` card, house copy, the liquid-glass block present once, `__setMode`
wired, `controls` lands on the guide (GI off), `free` lands on both-off,
dismissal hides + cancels speech, hero canvas present, the sim's boot state
(GI active behind the overlay) unchanged, `#btn-cg` labelled "Simulation
guide". Browser: shown on landing, speech attempted, transport
(forward/rewind/pause keeps position/resume), dismiss, then the full
inquiry (opened from the header) + guide + Reset walk with zero new
console errors.

**Light-theme measurement (mandatory, the jsdom gate cannot do it):** load
the page, THEN set `document.documentElement.setAttribute('data-theme',
'light')` (or click the sim's theme button), wait ~250ms, and read the
computed colour of `.welcome-mode[data-mode="controls"] .wm-title` and the
card's `background-image`. Pass = dark title (#0F172A) on whitish glass,
or pale title (#E6EDF5) on dark glass. Setting the attribute BEFORE load
measures nothing — every sim resets its theme at boot (a 115-sim scan
once "passed" this way; verify the verifier). Look at `00-welcome.png` and
a crop of the two cards in both themes.

## Pitfalls (each observed)
- Light mode once fell back to an opaque white card with a dark hero strip
  — a different design. Both themes must share one composition: transparent
  card, hero drawn on the dim with theme-aware colours.
- Light theme was never screenshotted until the final eval — and it hid two
  defects (an unreadable pill, a callout that stayed dark). Test both themes.
- Whitish light-glass on a dark-only overlay: pale title on pale glass in
  light theme (7 QM sims shipped it; host viewers can force
  `data-theme="light"` on `<html>`). Apply the §1c case analysis.
- The first liquid-glass mock was too big and recoloured the cards; the
  approved form keeps the original card size, icons and text colours and
  changes only the surface, in ONE whitish material.
- Headless Chromium has no voices: auto-read must attempt on a timer, not
  only on `voiceschanged`.
- Stopping speech by cancelling loses position; track (line, charAt) from
  `onboundary` and re-speak from there. Don't rely on native pause().
- Icon glyphs (emoji) render inconsistently; use the inline SVGs.
- Three equal boxes as a vertical list read as a dialog; three horizontal
  cards then confused first-timers; the approved form is TWO horizontal
  glass cards with a Start affordance.
- Narration left saying "three ways in" after the inquiry card was
  removed (L06-s1, L10-s1, L18-s0/s1/s2) — grep for counts.
- The hero must be drawn at the canvas's own aspect; stretching a strip
  canvas into a different box turns dots into dashes.
- A theory curve drawn over the dots reads as clutter; the centered layout
  has no curve.
- Test click-counting: assert state (labels, progress text), not clicks.
- Never open a visible (headful) browser for these checks — it blocks the
  owner's screen. Headless only, one browser at a time, always closed.
- The original `pickVoice` regex matched whichever local voice listed first
  (Daniel/Samantha — mechanical). The reference now carries the quality-ranked
  picker (Google US English first); keep it identical to the card-voiceover
  engine's ranking (controls-tutorial reference §6) so all narration on a sim
  shares one voice. Chrome TTS hazards (deferred speak, idle-cancel wedging
  the browser-wide service, remote-voice hangs) are documented in §6.5 there
  and apply to this player too. Builds shipped BEFORE Sept 2026 still carry
  the old regex picker — retrofit the ranked picker whenever such a build is
  touched for any reason. (Future retrofit candidate: the welcome player still
  calls `synth.cancel()` unguarded — the idle-cancel hazard of §6.5; route it
  through a `safeCancel` if the player is ever reworked.)
- Pre-recorded narration: sims carrying a `<script data-fermi-static-narration>`
  block play ElevenLabs clips keyed by the exact line text; any new or
  reworded line falls back to the browser voice until the narration
  pipeline is re-run. Never edit that block by hand; report the new lines.
