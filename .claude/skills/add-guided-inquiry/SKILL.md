---
name: add-guided-inquiry
description: Detect, rebuild, or create the GUIDED-INQUIRY card flow for a particle-physics sim in Fermi_Particle_physics_sims/Sims_v2_lecture_versions/ (or any sim on the v2 embedded shell). First CLASSIFIES the sim — no inquiry / weak-or-broken inquiry / well-formed — then either creates a card spine from scratch or reorganises the existing one into a gated, predict-before-reveal card structure with excellent pedagogy, driving the scene step by step via onStep. Uses subagent (LLM) design+critique loops to settle the best card spine before implementing. STRICTLY inquiry-layer only — never changes sim controls, visuals, physics, readouts, or layout. Triggers - "add guided inquiry", "structure the guided inquiry", "rebuild the inquiry cards", "guided inquiry for <sim>", "inquiry for all v2 sims". NOT the SR .mdc rule (Capacity_SR_sims_v2_engine) and NOT a review skill.
---

# Guided-inquiry: detect → design → build (v2 particle-physics sims)

You are an **expert physics educator and inquiry designer** — fluent in the particle-physics
canon and in how students actually mislearn it. You author the guided-inquiry stepper for ONE
sim at a time (batch mode at the end). The sims are single-file HTML on the **v2 embedded
shell** ("sim studio" exports). Everything you produce lives in the **inquiry layer**:
`#inq-cards` markup, gating attributes, the choice-feedback handler, `onStep`/`onComplete`
inquiry logic, and `Shell.stepReady()` wiring. **Everything else in the sim is read-only.**

## The hard boundary (read twice)

Allowed to touch:
- The card markup inside `#inq-cards`.
- `data-gate` / `data-ready` attributes on cards.
- The sim's `onStep(i)` / `onComplete()` functions (and a `STEPS`-style spec array if the
  sim uses one) — but ONLY so the scene follows the cards, and ONLY by setting the same
  state fields the sim's own controls already set.
- One added choice-feedback handler (JS) and — only if missing — the `.choice`/`.predict-eval`
  CSS block (most v2 sims already ship it; check first, never duplicate).
- Event wiring that calls `Shell.stepReady()` (e.g. a sim-side predict widget answered,
  or a "watch it happen" condition met).

NEVER touch (even if it looks wrong or redundant):
- Sim controls, panels, buttons, sliders, readouts, legends — add nothing, remove nothing,
  rename nothing. A redundant sim-side predict widget stays; integrate it (see Step 3).
- Physics: constants, equations, update loops, sampling, drawing code.
- Visuals/layout/CSS outside the inquiry classes above. Shell runtime code and shell ids.
- If a card would need a control or readout the sim doesn't have, redesign the card —
  do not add the affordance. Note the gap in the report instead.

File hygiene: these files are ~300 KB with a giant base64 font blob on ONE line — never read
that line; grep for anchors and read around them. Make edits with exact-string replacement.

## v2 shell API (what's already there — do not rebuild it)

- `Shell.init({onFrame,onReset,onResize,onStep,onComplete})` — last script block.
- Cards: `#inq-cards .inq-step`; the shell owns dots, Next/Finish, Skip, restore, ‹ › pager.
- `data-gate` on a card disables Next until (a) any `.choice` inside the active card is
  clicked (auto-detected by the shell), or (b) the sim calls `Shell.stepReady()`.
  Note: ANY choice unlocks Next — wrong answers too. That is by design (commit-then-learn);
  your feedback handler supplies the correct/wrong marking and the rebuttal.
- `onStep(i)` fires on every card change AND on Finish/Skip fast-forward (each remaining
  step is applied in order), then `onComplete()` runs and the inquiry collapses to a
  "▸ Guided inquiry" restore chip. Reset typically replays all steps.
- CSS already present in most v2 files: `.choice`, `.choice.correct/.wrong/.dim`,
  `.predict-eval`, `.predict-eval.show/.correct/.wrong` (dark + light theme).

## STEP 0 — Detect & classify (always first, before any edit)

Open the sim (grep-based), extract `#inq-cards`, the sim's `onStep`, and any `.choice`
usage. Classify into exactly one state and SAY WHICH, with evidence, before editing:

- **State A — ABSENT**: `#inq-cards` empty or missing, or < 2 cards. → full CREATE path.
- **State B — PRESENT BUT WEAK** (any one of these qualifies; most v2 sims are here):
  - caption cards: one-line telegraphic prose ("Boost β = 0.5: h still +1.") — statements
    of fact, nothing for the student to DO or PREDICT;
  - no gated predict card, or `.choice` buttons with no `data-correct`/`data-fb` and no
    feedback handler (dead buttons);
  - order violates dependency (payoff shown before its prerequisite);
  - `onStep` missing, or not deterministic/self-contained (pager back-forward breaks it);
  - no orientation card, or no resolve/free-exploration handoff.
  → REORGANISE path: keep every correct physics fact and good phrasing the existing cards
  contain (they are the sim author's pedagogy — recycle, don't discard), re-thread them
  into the full spine below, and add what's missing.
- **State C — WELL-FORMED**: full arc, gated predicts with per-choice feedback, working
  handler, deterministic onStep. → verify + polish only; report "no rebuild needed".

## STEP 1 — Mine the sim (read-only reconnaissance)

Before designing, build a fact sheet:
1. **Control surface**: every button/slider/select/mode + its id and effect; live readouts
   and their ids; sim-side predict widgets if any.
2. **Scene inventory**: what the canvas shows in each mode/state; what `onStep` currently
   drives (`STEPS`-style arrays are the pattern to extend).
3. **The physics spine**: what quantity depends on what; which single observation is the
   sim's payoff; what a student must already understand to read that payoff.
4. **Course grounding**: read `.claude/skills/review-fermi-pp-sims/course-context.md` —
  if the sim matches an entry, its learning objective and "inquiry affordances to verify"
  are REQUIREMENTS for the spine (a card must make each inquiry question answerable).
  Sims not in the doc (new ones): derive the LO from the sim's Info modal + title, and
  state it explicitly in your report.
5. **Misconception list**: 2–4 genuine student misconceptions for THIS topic (e.g.
  "the mirror was drawn wrong — spin should flip too", "heavier particle always curves
  less", "α particles should all pass straight through"). These become wrong choices.

## STEP 2 — Design the spine (with LLM design + critique loop)

Draft the spine as a TABLE before writing any HTML — one row per card:

| # | Beat | Title | The ONE idea | Scene state (`onStep` spec, exact params) | Gate? | Choices (correct + distractors←misconception) |

### The beats (the arc — better than the CM/SR pattern, enforce all of it)
1. **HOOK / ORIENT** — what am I looking at, why it matters (one sentence of stakes —
   discovery, paradox, or open question). Names the 2–3 visual elements the student must
   be able to read (colors/arrows/axes) — dynamic to what THIS sim draws.
2. **GROUND** — establish the prerequisite and *drive the sim to show it* (baseline /
   control case: field off, single particle, symmetric case…). No payoff yet.
3. **PREDICT (gated)** — a real question about what happens next, 3 choices: one correct,
   distractors drawn from the misconception list, each with a physics-specific rebuttal
   in `data-fb` (never a bare "no — try again").
4. **OBSERVE / VERIFY** — a concrete action ("press **Fire**", "drag **β** past 0.95")
   plus the named readout that settles the prediction, quantitatively where possible
   ("watch **P** fall to 0.000 and the lobe collapse onto the dotted circle").
5. *(repeat 3–4 per additional layer, in dependency order — the boundary concept before
   the phenomenon it defines: critical angle before TIR, polarization before asymmetry,
   nuclear model before the large-angle count.)*
6. **PAYOFF** — the core phenomenon / learning objective, seen on screen at this step.
7. **RESOLVE + EXTEND** — the takeaway stated once, the historical anchor (who/when),
   and ONE open question that hands off to free exploration (pairs with `onComplete`).

Hard rules: **5–8 cards** (never more; a thin sim may collapse beats 1–2). **One new idea
per card.** Predict-before-reveal, no forward references, no standing-misconception text.
Every card's prose must be TRUE OF THE SCREEN at that step — each claim checkable against
the `onStep` state in the same row. Every action names its control/readout in **bold**,
matching the on-screen label exactly. Prose: 2–4 full sentences, ≥14px default styles.

### LLM calls (subagent design + critique — use when the Agent tool is available)
Settle the spine with independent brains before implementing; this is where quality is won:
1. **Independent designer**: spawn a general-purpose agent with the fact sheet (Step 1)
   + the beats rubric above — NOT your draft — and ask for its best spine table.
   Prompt skeleton: *"You are a physics-education designer. Here is a sim's fact sheet:
   [controls / scenes / physics spine / LO / misconceptions]. Design a 5–8 card
   guided-inquiry spine as a table [columns as above] following these beats: [rubric].
   Return only the table + one paragraph of rationale."*
2. **Merge**: take the better ordering, the sharper predict questions, the more plausible
   distractors from either draft.
3. **Adversarial pedagogy critic**: spawn a second agent with the MERGED spine + rubric:
   *"Attack this guided-inquiry spine: find dependency-order violations, cards with two
   ideas, predicts whose answer was already revealed, distractors no student would pick,
   claims the described scene state cannot show, missing LO/inquiry-question coverage
   [list them]. Return a numbered list of defects with fixes, or 'clean'."* Iterate until
   clean or defects are consciously waived (say why in the report).
No Agent tool available → do all three passes yourself, explicitly, in that order.

## STEP 3 — Implement

### Card markup (fill `#inq-cards`; keep numbering format `N · Title`)
    <!-- Gated predict -->
    <div class="inq-step" data-gate>
      <h4>3 · Predict: where do the electrons go?</h4>
      <p>Prose tied to the CURRENT scene, ending in the question…</p>
      <button class="choice" data-fb="Physics-specific rebuttal of this misconception…">Distractor A</button>
      <button class="choice" data-correct data-fb="Why it's right — <strong>the key fact</strong>, with the number to look for.">Correct</button>
      <button class="choice" data-fb="Rebuttal B…">Distractor B</button>
      <div class="predict-eval"></div>
    </div>
    <!-- Ungated observe/orient/resolve -->
    <div class="inq-step">
      <h4>4 · Watch the asymmetry build</h4>
      <p>Press <strong>Fire decays</strong> and watch <strong>Counts south</strong> pull ahead…</p>
    </div>

Convention: `data-correct` is attribute-presence on the right choice; `data-fb` on EVERY
choice. Shuffle the correct answer's position across cards (never always B).

### Feedback handler (add ONCE, in the sim script near `Shell.init`; skip if an equivalent
already exists)
    document.querySelectorAll('#inq-cards .inq-step').forEach(card=>{
      const evalBox=card.querySelector('.predict-eval');
      card.querySelectorAll('.choice').forEach(ch=>ch.addEventListener('click',()=>{
        if(card.dataset.answered) return; card.dataset.answered='1';
        const correct=ch.hasAttribute('data-correct');
        card.querySelectorAll('.choice').forEach(c=>{ c.disabled=true;
          if(c.hasAttribute('data-correct')) c.classList.add('correct');
          else if(c===ch) c.classList.add('wrong'); else c.classList.add('dim'); });
        if(evalBox){ evalBox.innerHTML=ch.dataset.fb||''; evalBox.classList.add('show', correct?'correct':'wrong'); }
      }));
    });
Check the `.choice`/`.predict-eval` CSS exists (v2 sims ship it around the `.inq-step`
styles); add the block only if genuinely absent.

### `onStep(i)` — the scene must follow the cards
- Extend the sim's existing pattern (usually a `STEPS` spec array + a small `onStep`).
  Each entry fully determines the state for its card: mode, params, selection, pause.
- **Deterministic and self-contained** — never depends on the previous step, so the
  ‹ › pager and restore land on the exact scene the card describes.
- Set ONLY state the sim's own controls can set (same fields, same setters). If the card
  needs the sim paused to talk over a frozen scene, pause via the shell, and only when
  the sim's flow tolerates it.
- `onComplete()`: leave the sim in its richest legitimate free-exploration state (all
  modes reachable, nothing gated) — it already runs on Finish AND Skip.

### Sim-side predict widgets (e.g. a Predict yes/no in the controls panel)
Do NOT remove or duplicate them. Either (a) the card directs the student to answer THERE
("commit using **Predict** on the right"), gated via a listener on the widget that calls
`Shell.stepReady()`, or (b) if the widget covers a different question than your card,
leave it alone entirely. Never two versions of the same question on screen.

### Existing broken choices (gold-foil pattern: `.choice` with no data attrs, static
`.predict-eval` text, no handler)
That is inquiry-layer markup — you own it. Rewrite those cards to the convention above
(add `data-gate`, `data-correct`, per-choice `data-fb`, empty `.predict-eval`), keeping
the author's question and choice wording wherever it is good.

## STEP 4 — Verify in the browser (required; no sign-off without it)

Serve the folder (`python3 -m http.server 8765 --directory <folder>`) and drive the sim
(Claude-in-Chrome; headless puppeteer fallback). If the window is occluded
(`document.hidden` → rAF frozen), drive frames deterministically via the sim's global
`onFrame(dt)` in a loop instead of waiting.
1. Fresh load: console clean; card 1 active; scene = card 1's claim (screenshot).
2. Walk EVERY card: screenshot each; confirm the scene shows what the card says
   (the named readout values included). Any mismatch → fix onStep or the prose.
3. Gates: Next disabled on gated cards; a wrong choice → wrong styling + its `data-fb`
   + Next unlocks; reload and take the correct choice → correct styling + its feedback.
4. Pager: step to the end, then ‹ back to each card — scene identical to the forward
   pass (proves onStep self-contained).
5. Finish and Skip: end state = fully-revealed completed state; restore chip works.
   Reset: replays to a sane default with the inquiry intact.
6. Layout: no overflow/overlap in the cards zone at ~1280px; long feedback doesn't
   push the controls off-screen.
7. Console clean at every stage.

## STEP 5 — Report (per sim)

Print: classification (A/B/C + evidence) → the final spine table → what was added/changed
(cards, handler, onStep entries, stepReady wiring) → verification evidence (screenshot ids,
per-card scene≍claim confirmations, console status) → LO / inquiry-question coverage →
anything waived or impossible without touching the sim body (flag, don't fix).

## Batch mode ("all v2 sims")

Loop the folder (skip `index.html`). Classify all sims FIRST and print the classification
table before editing anything. Then process one sim at a time (or, if the user asks for
parallel, one subagent per sim carrying this skill's full instructions and its sim's fact
sheet; verify each in its own tab). Commit policy: personal-fork origin only, never the
company upstream; one commit per sim or one per batch as the user prefers.

## Do NOT
- Change sim controls, visuals, physics, readouts, layout, shell runtime, or shell ids.
- Remove ANY panel or widget (this differs from the old SR .mdc rule — v2 sims have no
  content dropdowns to fold; everything stands).
- Exceed 8 cards; put two ideas in one card; reveal a payoff before its prerequisite;
  write a standing-misconception card; use generic feedback ("Wrong, try again").
- Build dots/Next/Skip/pager; gate the sim itself (inquiry gates only its own Next).
- Ship without the browser verification pass, or claim scene≍card agreement untested.

## Self-check
- [ ] Classification stated with evidence BEFORE editing; C-state sims left unrebuilt.
- [ ] Spine passed the designer-merge-critic loop (or explicit self-passes); LO and every
      course-context inquiry affordance covered by a specific card.
- [ ] 5–8 cards, dependency-ordered, one idea each; ≥1 gated predict with misconception
      distractors and physics-specific `data-fb` on every choice; correct position varies.
- [ ] Existing good card content recycled, not discarded; existing broken choices rebuilt.
- [ ] Feedback handler present exactly once; CSS not duplicated.
- [ ] `onStep` deterministic + self-contained; pager round-trip verified; Finish/Skip/
      Reset/restore verified; onComplete leaves free exploration open.
- [ ] Sim body untouched — diff shows changes only in `#inq-cards`, the handler, onStep/
      onComplete/STEPS, and stepReady wiring.
- [ ] Console clean; per-card screenshots confirm every on-card claim.
