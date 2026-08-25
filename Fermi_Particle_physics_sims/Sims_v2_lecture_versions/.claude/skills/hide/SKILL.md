---
name: hide
description: Register text into a particle-physics sim's Hide-Text container from screenshots or quoted strings. Use when the user invokes /hide with attached/pasted screenshots (annotated or cropped) or names text to hide ("hide 'pair cost' and the legend in build-a-baryon"). Locates each item in the sim file (DOM or canvas), gates it behind the top-bar Hide Text checkbox, updates the registry, and verifies both toggle states in a real browser. Hide-only — never deletes. Self-contained copy for the Sims_v2_lecture_versions folder (mirrors the repo-root hide skill).
---

# /hide — put text into a sim's Hide-Text container

Every sim in this folder ships a **Hide Text** checkbox in the top bar (beside 🎓
Lecture) wired to an initially empty registry. This skill REGISTERS items into that
registry so checking the box hides them. Hidden, never deleted — unchecking brings
everything back.

## The mechanism (fixed tokens — automation greps for these)

| Token | Meaning |
|---|---|
| `#ht-ctl` / `#ht-toggle` | the label / checkbox in the top bar |
| `hide-text` | class toggled on `#shell` when checked |
| `.ht-hide` | class that registered **DOM** text elements receive |
| `HT()` | global guard for registered **canvas** text draw calls |
| `HIDE-TEXT REGISTRY` | manifest comment near the top of each file listing everything registered |

## Inputs

- **Target sim**: from the argument, or inferred from the screenshot's title bar
  (every sim shows its name top-left). If neither resolves, ask.
- **Items to hide**, any mix of:
  - **Annotated screenshot** (circles / boxes / arrows / highlighter): hide **only the
    annotated** text items.
  - **Plain crop** (no annotations): treat **every text element fully inside the crop**
    as a target, and say so explicitly in the report so mis-scoping is caught.
  - **Quoted strings**: `/hide build-a-baryon "Charge Q" "colour:" legend` — match by
    content.

## Procedure

1. **Pre-flight**: grep the target file for `id="ht-toggle"` (all sims in this folder
   have it; if somehow absent, stop and report — installation is a separate step).
2. **Enumerate targets** from the inputs. List them before editing — one line each,
   exactly as understood (e.g. `canvas label "colour neutral ✓"`, `DOM readout row
   "Charge Q"`, `canvas dynamic text 'cost '+S.lastCostMeV.toFixed(2)`).
3. **Locate each item in the source** (grep; NEVER read the giant base64 font line —
   these files are ~300 KB with the blob on one line; work by grep + targeted edits):
   - Screen text is often **built dynamically** — search for stable substrings
     (`'cost '`, `fillText`, label-helper calls), not the rendered string.
   - **DOM item** → add class `ht-hide` to the smallest element containing the
     **complete visible item — text plus its swatch/icon/pill chrome** (a legend entry
     includes its colour dot; don't tag a bare text node and leave an orphaned dot).
     But don't take a whole panel to hide one row. **No orphaned chrome:** if hiding
     leaves a container with no visible children, register the container instead.
   - **Canvas item** → wrap the draw call in `if(!HT()){ … }`. If the text goes through
     a label helper, gate the *call site*, not the helper.
   - **On canvas, physics stays.** If an annotation circles a physics drawing (arrow,
     marker, trajectory) + its label, hide the label and keep the drawing, unless the
     user explicitly says otherwise. DOM UI chrome is NOT physics — it goes with its text.
   - Same string drawn in **multiple places/modes**: gate the instance the screenshot
     shows; report the other occurrences found and ask only if intent is unclear.
4. **Update the registry** comment — one line per item, replacing "(empty — …)" on
   first registration. Format:
   `- [canvas|dom] "<visible text or code anchor>" — <function/element>, ~L<line>`
5. **Verify in a real browser** (serve the folder over http, e.g.
   `python3 -m http.server 8765`; if the tab is backgrounded, rAF is frozen — drive
   frames via the sim's `onFrame(dt)` in a javascript loop):
   - checkbox **checked** → every registered item absent (screenshot), **and no orphaned
     remnants**: no lone swatches, empty pills, or dangling separators;
   - **unchecked** → every item back (screenshot) — reversibility is the contract;
   - console clean in both states;
   - if an item only appears in a specific mode/card/slider state, drive to that state
     before screenshotting.
6. **Report**: table of item → mechanism (dom/canvas) → anchor → hidden/restored
   verified. Flag anything not found, ambiguous, or appearing in additional modes.

## Particle-physics guardrails

- **Never register inquiry-layer elements** (`#inq-cards`, `.inq-step`, `.choice`,
  `.predict-eval`, the step dots, the ‹ › pager, the `▸ Guided inquiry` chip) — the 🎓
  Lecture button already owns hiding the inquiry; Hide Text is for sim labels/readouts.
- **Check for card conflicts before registering**: the inquiry cards name controls and
  readouts in `<strong>` ("watch **cost to make the last pair**"). Grep the item's
  visible text against `#inq-cards` — if a card references it, hiding it breaks that
  card's instruction; flag the conflict and get explicit confirmation before gating it.

## Hard rules

- **Hide-only, ever.** Never delete text or code through this skill; the registry must
  keep the mechanism fully reversible.
- **Never gate physics, geometry, marker shapes, or control wiring** — text only,
  unless the user explicitly asks for a shape.
- If an item cannot be confidently located, **do not guess** — report it as unresolved
  with what was searched.
- Keep edits minimal and localized; nothing outside the registered items and the
  registry comment changes.
