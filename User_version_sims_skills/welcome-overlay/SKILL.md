---
name: welcome-overlay
description: RETIRED landing (2026-10-06): sims now open directly with one tip at the Simulation guide button (see ui-stylesheet). This skill documents the old BLACKBOARD landing board of guide v2, which remains only as the fallback when the stylesheet's landing switch is off. It shows "Welcome to" plus the title with a chalk underline, ONE line on what the sim is, what you do and what you see, and two choices: "Guide me → a 2-minute tour" and "Explore freely · all controls open". It replaces the October two-mode liquid-glass welcome overlay. Use when asked to add, upgrade or roll out the welcome screen, landing page, start screen, mode picker or "the blackboard landing". It is installed together with the Simulation guide from one spec via the shared sim-guide-kit (see the controls-tutorial skill).
---

> **RETIRED as the landing (owner + manager, 2026-10-06).** Sims now open DIRECTLY: no overlay, ONE plain-text tip under the **Simulation guide** button (5 s, button highlighted). See `../ui-stylesheet/SKILL.md` → "Landing: DIRECT". The board below still exists in the engine, but only as the fallback when the stylesheet switch `--fsim-landing: direct` is absent. Keep its spec fields (`title`, `blurb`) correct; don't build new landing UI.

# Landing board v2 (blackboard)

The landing, the Simulation guide and the Explore-freely hint are one engine (`../sim-guide-kit/layer.html`), installed together from one per-sim `spec.js`. This skill covers the landing part of that spec and its rules. The install workflow, gate and batches are in **controls-tutorial/SKILL.md**. The old liquid-glass two-mode overlay is in `references/legacy-v1.md`; the engine hides it (`#welcome-overlay`) when the board is shown.

## What the board shows
- **"Welcome to"** (small, grey chalk), then the **sim's title** in large chalk with a hand-drawn yellow underline.
- **One line** (`blurb`), written as three short parts:
  1. **What it is:** "A real pendulum swings next to a pendulum that follows the textbook formula."
  2. **What you do:** "Change the release angle"
  3. **What you see:** "and compare the two."
- **Title rule:** use the sim's `<title>` verbatim, but drop a subtitle after a dash. Use a non-breaking hyphen (U+2011) inside compound names ("Stern‑Gerlach"). The title is linted.

  Plain language (`PLAIN_LANGUAGE.md`). No inquiry answers: read every Guided Inquiry card's prompt and correct choice first. Say "compare", "see how … changes", never what the result is. Keep it to about 20–30 words.
- **Two choices, nothing else:**
  - **Guide me →** / "a 2-minute tour" (yellow chalk, the primary);
  - **Explore freely** / "all controls open".

  No hero diagram, no extra text around the choices. Guided Inquiry is reached from the header, not the board.
- **The sim does not run on the board**, and doesn't start when a choice is made. Play is the learner's first action.
  - In the guide, the last card points at Play.
  - In Explore freely, the trigger hint (≤ 12 words) points at Play or at the sim's key control, and closes within 3 s.

## Spec fields that drive the board
```js
title:'The Nonlinear Pendulum',
blurb:'A real pendulum swings next to a pendulum that follows the textbook formula. Change the release angle and compare the two.',
```
Everything else (layout, chalk fonts, wood frame) comes from the engine. The board is not narrated; voice starts with the guide cards and the free-mode hint.

## Checks (in `check.mjs`)
- L1: the board shows and the old overlay doesn't;
- L2: the title matches `SPEC.title` and the blurb is a real line;
- L3: exactly two choices;
- L4: "Ask AI Tutor" is in the header;
- L5: the sim isn't running on the board.

Look at `shots/1-landing.jpg`: the title must fit on one or two lines with no clipping, inside the board.

## Look
On a finished sim, the board's colours and type come from the shared stylesheet (`ui-stylesheet/`, Horizon "A": a white card, navy title, royal-blue "Guide me", outlined "Explore freely", Inter), not from `layer.html`'s chalk CSS. That CSS remains as the base the stylesheet overrides. Don't restyle the board in `layer.html`; change the stylesheet.

## Design note
This is the UX layer. The visual design language (Fermi Horizon colours via one shared, versioned CSS file) is a separate later release; its mocks are in `~/Downloads/logged-in web's flows/design experiments/`. Don't restyle the board here.

_`scripts/verify.js` and `references/implementation.md` in this folder belong to the v1 design (legacy). The v2 gate is `../sim-guide-kit/check.mjs`._
