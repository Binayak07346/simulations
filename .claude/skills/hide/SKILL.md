---
name: hide
description: Register text into a sim's Hide-Text container (CM sims AND v2 particle-physics sims in Fermi_Particle_physics_sims/Sims_v2_lecture_versions/) from screenshots or quoted strings — the friendly front-end to the hide-text mechanism. Use when the user invokes /hide with attached/pasted screenshots (annotated or cropped) or names text to hide ("hide 'perihelion' and the legend in L37"). Locates each item in the sim file (DOM or canvas), gates it behind the Hide Text checkbox, updates the registry, and verifies both toggle states in a real browser. Hide-only — never deletes.
---

# /hide — put text into the Hide-Text container

Front-end to the registration workflow. **Canonical mechanism spec:
`.cursor/rules/hide-text-checkbox.mdc`** (tokens: `#ht-toggle`, `.ht-hide`, `HT()`,
`HIDE-TEXT REGISTRY`). Installation is `add-hide-text`'s job; this skill only registers.

## Inputs

- **Target sim**: from the argument, or inferred from the screenshot's title bar
  (every CM sim shows its name top-left). If neither resolves, ask.
- **Items to hide**, any mix of:
  - **Annotated screenshot** (circles / boxes / arrows / highlighter): hide **only the
    annotated** text items.
  - **Plain crop** (no annotations): treat **every text element fully inside the crop**
    as a target, and say so explicitly in the report so mis-scoping is caught.
  - **Quoted strings**: `/hide L37 "perihelion" "e =" legend` — match by content.

## Procedure

1. **Pre-flight**: grep the target file for `id="ht-toggle"`. If the container is not
   installed, install it first per the `add-hide-text` skill, then continue.
2. **Enumerate targets** from the inputs. List them before editing — one line each,
   exactly as understood (e.g. `canvas label "perihelion"`, `DOM legend block`,
   `canvas dynamic text 'e = ' + p.e.toFixed(3)`).
3. **Locate each item in the source** (grep; never read the base64 font line):
   - Screen text is often **built dynamically** — search for stable substrings
     (`'perihelion'`, `'e = '`, `fillText`, label-helper calls), not the rendered string.
   - **DOM item** → add `ht-hide` to the smallest element containing the **complete
     visible item — text plus its swatch/icon/pill chrome** (a legend entry includes its
     colour dot; don't tag a bare text node and leave an orphaned dot — this exact
     failure occurred in L4). But don't take a whole panel to get one row.
     **No orphaned chrome:** if hiding an item leaves its container with no visible
     children (e.g. a legend chip whose other entries are `display:none`), register the
     container instead.
   - **Canvas item** → wrap the draw call in `if(!HT()){ … }`. If the text goes through
     a label helper (`placeCanvasLabel`, `guideLabel`, …), gate the *call site*, not the
     helper.
   - **On canvas, physics stays.** If an annotation circles a physics drawing (arrow,
     marker, trajectory) + its label, hide the label and keep the drawing, unless the
     user explicitly says otherwise. DOM UI chrome is NOT physics — it goes with its text.
   - Same string drawn in **multiple places/modes**: gate the instance the screenshot
     shows; report the other occurrences found and ask only if intent is unclear.
4. **Update the registry** comment — one line per item, replacing "(empty — …)" on
   first registration. Format:
   `- [canvas|dom] "<visible text or code anchor>" — <function/element>, ~L<line>`
5. **Verify in a real browser** (same puppeteer pattern as the review skill —
   `createRequire('<repo>/Capacity_SR_sims_v2_engine/_review/')`, system Chrome,
   `page.goto(file://…)`):
   - checkbox **checked** → every registered item absent (screenshot), **and no orphaned
     remnants**: no lone swatches, empty pills/chips, or dangling separators where the
     item was;
   - **unchecked** → every item back (screenshot) — reversibility is the contract;
   - console `errors: []` in both states;
   - if an item only appears in a specific mode/step/slider state, drive to that state
     before screenshotting.
6. **Report**: table of item → mechanism (dom/canvas) → anchor → hidden/restored
   verified. Flag anything not found, ambiguous, or appearing in additional modes.
   Cite the before/after screenshot filenames.

## Particle-physics sims: two extra rules

- **Never register inquiry-layer elements** (`#inq-cards`, `.inq-step`, `.choice`,
  `.predict-eval`, dots, pager, the `▸ Guided inquiry` chip) — the 🎓 Lecture button
  already owns hiding the inquiry; Hide Text is for sim labels/readouts only.
- **Check for card conflicts before registering**: PP inquiry cards name controls and
  readouts in `<strong>` ("watch **cost to make the last pair**"). Grep the item's
  visible text against `#inq-cards` — if a card references it, hiding it breaks that
  card's instruction; flag the conflict and get explicit confirmation before gating it.

## Hard rules

- **Hide-only, ever.** Never delete text or code through this skill; the registry must
  keep the mechanism fully reversible for user-facing builds.
- **Never gate physics, geometry, marker shapes, or control wiring** — text only,
  unless the user explicitly asks for a shape.
- If an item cannot be confidently located, **do not guess** — report it as unresolved
  with what was searched.
- Keep edits minimal and localized; nothing outside the registered items and the
  registry comment changes.
