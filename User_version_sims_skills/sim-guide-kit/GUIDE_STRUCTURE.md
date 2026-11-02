# Simulation guide: structure rules

Language rules are in PLAIN_LANGUAGE.md. These rules set the shape of the tour. The spec fields are in SPEC_FORMAT.md.

## Guide me
1. **Simulation window: 2–3 steps.** Each step outlines the exact parts it names:
   - silhouettes for 3-D parts (outlines from projected bounding-box corners are acceptable);
   - ellipses for small objects.
2. **Sidebar: controls, readouts and charts.**
   - At most 3 controls per step. A group of controls counts as that many controls.
   - With 4 or more controls, split them into steps of 2 (or 3), grouped by the part of the scene they change.
3. **The last step points at the first action.**
   - **Dynamic sims (they have Play):**
     - It adds one line ("Press Play to …"). Play pulses, with a small "Press Play to start" tag under it. There is no long arrow.
     - Pressing Play ends the tour with the experiment running.
     - Done ends it with a short (~3 s) Play cue.
   - **Static sims (no Play):** see "Static variant" below.
- **Total: 4–6 steps.** Never go beyond 6. If the sim has more than fits, keep in this order:
  1. scene parts;
  2. the controls that change the main effect;
  3. readouts.
- **Voice on every card.** The last card keeps the same voice control as the others; the engine moves it into the last card's footer.
- **No top-bar steps.** Ask AI Tutor, Guided Inquiry, The Physics, theme, speed, Reset and Play/Pause are not explained.
- **No step about the legend, axes, number lines, the HIDE tab or animation-speed controls.** Describing what a curve or colour means inside a scene step is fine.
- **No spoilers.** Read every Guided Inquiry card: its prompt AND its correct choice. The tour must state none of them, in text, in voice or in what the stage shows.

## Explore freely
- There is no "where to start" card and no guide card.
- **One small trigger hint:** a compact chalk note with one line and a close ×.
  - The line is ≤ 12 words.
  - It has no title, step counter, voice bar or footer.
  - The voice says the line once.
- The hint points at **one control** with a notch, and that control pulses. The scene is not dimmed.
- **Choosing the trigger:**
  - **Dynamic sims (they have Play):** ALWAYS Play. Leave `trigger.at` out and write "Press **Play** and watch …", naming what changes in the window. If a second action matters (e.g. Release ball), name it in the line: "Press **Play**, then **Release ball**, and watch its path."
  - **Static sims (no Play):** the control whose change is most visible:
    - a slider: "Drag **θ** and watch the vector rotate";
    - a toggle: "Switch on **Contours** and watch …";
    - or a canvas drag.

    Set `trigger:{ at:'<selector>', text, say }`. A wrapper box (`#box-P`) is fine; the engine listens to the inputs inside it.
- **When the hint is done:** when the student uses that control (Play: the sim is running; other controls: the first input, change or click). It then shows a tick and closes.
- **It never stays longer than 3 seconds** (owner rule, 2026-10-05). After 3 s it closes by itself; its spoken line is allowed to finish.
- Close (×), the Simulation guide and Guided Inquiry also close it. It never comes back on Reset.

## Static variant (sims with no Play button)
- `play` is left out of the spec, and `trigger.at` names the most telling control.
- The **last card** pulses `trigger.at` (not Play). Its added line is a "Try …" line (`playText`), e.g. "Try it: drag **P** and watch the E–k curve change."
- **Done** ends the tour with a brief (~3 s) "Try it" cue on that control.
- Explore freely uses the same `trigger`.

## Control cards
- One line per control.
- Say what the control CHANGES in the sim. Never restate the label, range or value shown on the control.
- Readouts: say what each readout SHOWS, in one line.
- **Outlines:** the controls in white; the scene part each control changes in yellow (`sec:true`).
- **Tags:** tag a yellow outline with the control's symbol (for example `d, a` on the barrier), but only when the control shows a symbol. No symbol, no tag.
- **Controls that add parts that are not on stage yet** (a palette, empty slots): outline where the part will appear, or leave the yellow outline out.

## Look before you sign off
- In the screenshots, check that:
  - every outline sits on the part it names;
  - no card covers a key label;
  - the title fits on one or two lines;
  - direction words in the text and voice ("left", "right", "top") match the picture.
