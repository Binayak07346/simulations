# Hide Text — guide for the curriculum team

Every simulation in this folder has a **Hide Text** checkbox in the top bar, right
beside the **🎓 Lecture** button. It lets you hide selected labels, readouts, or
captions for a cleaner lecture display — and get them back with one click.

- **Nothing is hidden out of the box.** Each sim ships with an *empty* registry, so
  checking the box changes nothing until you register the text you want hidden.
- **Hidden, never deleted.** Unchecking the box always brings everything back. Every
  registered item is also listed in a `HIDE-TEXT REGISTRY` comment inside the sim file,
  so there's a full manifest of what the checkbox controls.

## Setup (one time)

The skill file lives next to this guide: `Hide-text-skill/SKILL.md`.

- **Claude Code**: copy it to `.claude/skills/hide/SKILL.md` under the folder you open
  Claude in (or under the repo root) — it then appears as the `/hide` skill.
- **Cursor**: add `SKILL.md` to your rules/context (e.g. copy it into `.cursor/rules/`
  as `hide-text.mdc`, or just @-reference the file in your prompt).

## How to hide text

Open the sims folder in Claude Code or Cursor and invoke **`/hide`** (or reference the
skill file). You tell it *which sim* and *what text* — in any of three ways, and you
can mix them:

### 1 · Annotated screenshot (recommended)
Take a screenshot of the sim, circle / box / highlight the text you want hidden, and
attach it:

> `/hide` — hide the circled items *(attach the annotated screenshot)*

Only the annotated items are hidden. The sim is identified automatically from the
title in the screenshot's top-left corner.

### 2 · Plain cropped screenshot
Crop the screenshot down to just the region containing the text:

> `/hide build-a-baryon` — hide everything in this crop *(attach the crop)*

**Every** text element fully inside the crop becomes a target — the report will list
exactly what was interpreted, so you can catch anything mis-scoped.

### 3 · Exact text in the prompt
Name the sim and quote the text as it appears on screen:

> `/hide wu-experiment "coil current" "B / T"`
> Hide the "colour: r g b → white" line and the legend in build-a-baryon.

Dynamic text (numbers that change) is fine — quote the stable part, e.g. `"cost "` or
`"≈ ×10⁹ K"`.

## What happens when you run it

1. Claude locates each item in the sim file (both HTML text and canvas-drawn labels).
2. It gates each one behind the checkbox and adds a line to the sim's
   `HIDE-TEXT REGISTRY` manifest.
3. It verifies in a real browser: checked → items gone (with no orphaned leftovers
   like a lone colour dot); unchecked → everything back; no console errors.
4. You get a report table: each item, where it was found, and its verified
   hidden/restored state. Anything it couldn't find is flagged as unresolved rather
   than guessed at.

## Rules the skill enforces (so you don't have to worry)

- **Reversible only** — it hides, it never deletes.
- **Physics is safe** — arrows, trajectories, markers, and controls are never touched;
  only text (a label's colour swatch or pill background goes with its text, though, so
  you're never left with an empty chip).
- **The guided inquiry is off-limits** — the inquiry cards and their buttons can't be
  registered; use the **🎓 Lecture** button to hide the whole guided-inquiry panel.
- **Conflict warnings** — if a card's instructions reference the text you're hiding
  (e.g. a card says *watch "cost to make the last pair"*), the skill flags it and asks
  before proceeding, since hiding it would break that card's instruction.

## Un-hiding

- **Temporarily**: just uncheck the Hide Text box in the sim.
- **Permanently**: ask in the same way — e.g. `/hide` *"un-register 'coil current' in
  wu-experiment"* — and the item is removed from the registry (the manifest comment is
  updated too).

## Tips

- One sim per request keeps reports easy to review; batch multiple items for the same
  sim into one request.
- If a label only appears in a certain mode / card / slider position, mention that
  ("the label that appears when the mirror is on") — the skill will drive the sim to
  that state to verify.
- The same text sometimes appears in more than one place; the report lists any other
  occurrences it found so you can decide whether to hide those too.
