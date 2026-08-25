---
name: add-guided-inquiry-and-lecture-mode
description: Detect, rebuild, or create the GUIDED-INQUIRY card flow for a particle-physics sim in Fermi_Particle_physics_sims/Sims_v2_lecture_versions/ (or any sim on the v2 embedded shell). First CLASSIFIES the sim — no inquiry / weak-or-broken inquiry / well-formed — then either creates a card spine from scratch or reorganises the existing one into a gated, predict-before-reveal card structure with excellent pedagogy, driving the scene step by step via onStep. Also installs LECTURE MODE on every sim (header 🎓 Lecture button - hides the inquiry, jumps to the post-completion free-exploration state; restore chip reopens at card 1; replaces Skip; adds the ‹ › pager) so no separate lecture-mode pass is needed. Uses subagent (LLM) design+critique loops to settle the best card spine before implementing. STRICTLY inquiry-layer only — never changes sim controls, visuals, physics, readouts, or layout. Triggers - "add guided inquiry", "structure the guided inquiry", "rebuild the inquiry cards", "guided inquiry for <sim>", "inquiry for all v2 sims". NOT the SR .mdc rule (Capacity_SR_sims_v2_engine) and NOT a review skill.
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
- **The ONE sanctioned shell change — inquiry re-enablement.** The v2 "lecture" exports
  retire the inquiry inside `Shell.init` (comment "Guided inquiry is retired…",
  `root.classList.add('no-inquiry')`, fast-forward all steps, `onComplete()`): with it in
  place, no cards ever render. Replace ONLY that init block with: if cards exist → build
  the `#inq-dots` dots (one `div.inq-dot` per card — this shell never builds them),
  `onResize(); onReset(); inqShow(0);`; else keep the retired path verbatim as the
  zero-cards fallback. Touch nothing else in the runtime. (Also note: this shell has NO
  ‹ › pager — Next/Skip/dots only — so verification substitutes Finish fast-forward +
  Reset for the pager round-trip.)

ALSO allowed — the fold-and-remove rule for inquiry leftovers:
- Sim-side PREDICT / quiz / teaching widgets (predict question + chips, step lists,
  standing inquiry prose in the sidebar) are inquiry content in the wrong place. FOLD
  their question, choices, and feedback into the cards, then REMOVE them from the
  sidebar: markup, their JS wiring (builder fns, listeners, state fields like
  `state.pred`), and CSS that styled only them. After the rebuild, the cards are the
  ONLY place guided-inquiry/predict content lives — zero leftovers. Verify no dangling
  references (the sim loads clean).

NEVER touch (even if it looks wrong or redundant):
- Genuine sim controls: mode buttons, sliders, action buttons (Fire/Clear/Frontier…),
  checkboxes, live readouts, legends — add nothing, remove nothing, rename nothing.
  (Only inquiry-content widgets fall under fold-and-remove above.)
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
usage. Also grep `no-inquiry` in `Shell.init`: the lecture exports RETIRE the inquiry
there — if present, the sanctioned re-enablement (see the hard-boundary section) is part
of the work regardless of card state. Classify into exactly one state and SAY WHICH,
with evidence, before editing:

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

### Card count is DERIVED, not chosen (hard ceiling: 6)
Before drafting cards, derive the exact count the content flow needs — no fixed target:
1. List the concepts the LO requires a student to COMMIT to (each → one gated card).
2. Add one orient/ground card ONLY if the first commitment card can't carry the
   orientation in a sentence; merge otherwise.
3. Resolve/extend rides the final card's post-answer reveal (`.inq-after`) — never its
   own card unless it introduces a new commitment.
4. The derived count IS the card count. Beyond 6 the inquiry starts feeling lengthy —
   6 is a HARD MAX: if the derivation exceeds it, merge the two most-related concepts
   or move the least load-bearing one into a post-answer reveal / free exploration.
   A thin sim may legitimately need only 3–4 — do not pad to reach a number.
State the derivation (concepts → count) in the report.

Fuse beats to keep the count honest: orient merges into the first ground card, and each
predict card's ANSWER is its own observe — the correct/wrong feedback names what to
watch, and (where the sim exposes a setter) the answer itself triggers the reveal via
the handler's `data-build` hook, so no separate observe card is needed. A pure observe
card is justified only when a reveal needs watching BEFORE the next question makes
sense and the feedback line can't carry it. **One new idea per card.** Predict-before-reveal, no
forward references, no standing-misconception text. Every card's prose must be TRUE OF THE
SCREEN at that step — each claim checkable against the `onStep` state in the same row.
Every action names its control/readout in **bold**, matching the on-screen label exactly.

**Brevity is a hard budget, not a style note.** Card prose ≤ 45 words (1–2 sentences per
beat); choice labels ≤ 10 words; each `data-fb` ONE sentence ≤ 25 words. Numbers beat
adjectives; never restate what an earlier card or the current scene already shows. If a
sentence survives deletion without losing a checkable fact, delete it.

### LLM calls (subagent design + critique — use when the Agent tool is available)
Settle the spine with independent brains before implementing; this is where quality is won:
1. **Independent designer**: spawn a general-purpose agent with the fact sheet (Step 1)
   + the beats rubric above — NOT your draft — and ask for its best spine table.
   Prompt skeleton: *"You are a physics-education designer. Here is a sim's fact sheet:
   [controls / scenes / physics spine / LO / misconceptions]. Derive the exact number of
   cards this content flow needs (one gated card per concept requiring commitment; hard
   max 6 — merge or demote to post-answer reveals if over) and design that spine as a
   table [columns as above] following these beats + word budgets: [rubric]. State your
   count derivation, return the table + one paragraph of rationale."*
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
Fold and remove (see the hard-boundary section): the widget's question and choices become
a gated card's `.choice` buttons (reuse the author's wording), its reveal behaviour moves
to the handler's `data-build` hook, and the widget itself — markup, listeners, builder
fns, its state fields, its dead CSS — is deleted. No predict/inquiry content may remain
outside the cards.

### The `data-build` hook — answer-triggered reveal (fuses predict + observe)
Put `data-build="mode:letters"` (e.g. `data-build="baryon:uuu"`, `data-build="meson:ud"`)
on a gated card to have the FIRST choice click drive the sim to the reveal state via the
sim's own builder/setter. Add to the feedback handler, after the styling block:
    const spec=card.dataset.build;
    if(spec){ const m=spec.split(':'); buildCombo(m[0], m[1].split(''), false);
      syncControls(); updateReadout(); updateFormal(); draw(); }
(Adapt the setter names to the sim. Only ever call setters the sim's own controls call.)

### Existing broken choices (gold-foil pattern: `.choice` with no data attrs, static
`.predict-eval` text, no handler)
That is inquiry-layer markup — you own it. Rewrite those cards to the convention above
(add `data-gate`, `data-correct`, per-choice `data-fb`, empty `.predict-eval`), keeping
the author's question and choice wording wherever it is good.

## STEP 3½ — Lecture mode (merged from the old add-lecture-mode rule; apply to EVERY sim)

Every sim gets a header **`🎓 Lecture`** button so the inquiry never needs a separate
skill pass. Behaviour (this supersedes the old SR rule's jump-to-last-card):
- **ON (every click that enters it):** hide the guided inquiry to the `▸ Guided inquiry`
  restore chip AND put the sim in its **post-completion state with free exploration** —
  exactly what Finish produces. In the v2 shell that is one call: `finishInquiry()`
  (fast-forwards every remaining `onStep`, runs `onComplete()`, collapses the zone,
  resumes play). Do NOT reimplement it.
- **OFF (second click, or the restore chip):** reopen the inquiry **at card 1** via
  `setInquiryCollapsed(false); inqShow(0);`. Answered cards stay answered (review walk,
  not a fresh quiz) — a full wipe is a separate opt-in, never added by default.

The five edits (surgical, anchor-based — never swap the runtime block):
1. **Header button** after `#shell-theme`:
   `<button id="shell-lecture" class="shell-btn" title="Lecture display mode — hide the guided inquiry, show the full simulation">🎓 Lecture</button>`
2. **Runtime fn** next to `setInquiryCollapsed`:
       function setLectureMode(on){
         root.classList.toggle('lecture-mode', on);
         const b=document.getElementById('shell-lecture');
         if(b) b.classList.toggle('active', on);
         if(on){ finishInquiry(); }
         else { setInquiryCollapsed(false); if(inqCards().length) inqShow(0); }
       }
3. **Wiring** in `wire()`: lecture click → `setLectureMode(!root.classList.contains('lecture-mode'))`;
   re-point the restore chip from `setInquiryCollapsed(false)` to `setLectureMode(false)`.
4. **Remove the `Skip ✕` button** (markup + its lookup + listener) — the Lecture button
   owns hiding now. Keep `finishInquiry`/`setInquiryCollapsed` themselves.
5. **`‹ ›` pager** (v2 sims ship none — add unless `inq-prev` already exists): pager
   markup before `#inq-next` inside `.inq-nav`; `inqUpdatePager`/`inqPrev`/`inqPagerNext`
   helpers calling ONLY `inqShow(inqStep±1)`; one `inqUpdatePager();` call inside
   `inqShow` right before `onStep(inqStep);`; wiring beside the `inq-next` listener; CSS
   `.inq-pager{display:flex;align-items:center;gap:8px;}` and
   `.inq-pager-btn{min-width:36px;padding:6px 11px;justify-content:center;font-size:13px;line-height:1;}`
   next to `.inq-nav`, plus `margin-left:auto` on `#inq-next` if missing. The pager is
   deliberately ungated free navigation; `Next →` gating is untouched. Because `inqShow`
   calls `onStep`, back/forward restores each card's exact scene — add NO other state logic.
6. **Zero-cards sims** (`no-inquiry` fallback): hide the Lecture button
   (`style.display='none'`) in that init branch.

Known interactions (checked, safe — do not "fix"): entering Lecture skips gates exactly
like Skip did; Finish and Lecture converge on the same collapsed+completed state, and the
restore chip reopens at card 1 from either path; repeated Lecture clicks are idempotent
(`onStep` specs are self-contained, `onComplete` is a flag-set).

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
5. Finish: end state = fully-revealed completed state; restore chip reopens at card 1.
   Reset: replays to a sane default with the inquiry intact.
5b. Lecture mode: `🎓 Lecture` from card 1 → collapsed + post-completion scene + all
   controls live (compare against a manual full click-through); button shows `.active`;
   second click AND the restore chip both reopen at card 1 with answers preserved; the
   old `Skip ✕` is gone. Pager: `‹` disabled on card 1, `›` on the last; forward-back-
   forward lands on identical scenes; gating unchanged.
6. Layout: no overflow/overlap in the cards zone at ~1280px; long feedback doesn't
   push the controls off-screen.
7. Leftovers sweep: the sidebar shows NO predict/inquiry content outside the cards —
   grep the folded widget's ids/classes to prove markup, JS, and CSS are gone with no
   dangling references.
8. Console clean at every stage.

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
- Change genuine sim controls, visuals, physics, readouts, layout, shell runtime (beyond
  the sanctioned re-enablement), or shell ids.
- Leave ANY predict/inquiry content outside the cards (sidebar predict widgets, quiz
  prose, step lists — fold and remove). Never remove genuine controls or readouts.
- Exceed 6 cards; blow the word budgets; put two ideas in one card; reveal a payoff
  before its prerequisite; write a standing-misconception card; use generic feedback
  ("Wrong, try again").
- Build dots/Next/Skip/pager; gate the sim itself (inquiry gates only its own Next).
- Ship without the browser verification pass, or claim scene≍card agreement untested.

## Self-check
- [ ] Classification stated with evidence BEFORE editing; C-state sims left unrebuilt.
- [ ] Spine passed the designer-merge-critic loop (or explicit self-passes); LO and every
      course-context inquiry affordance covered by a specific card.
- [ ] Card count DERIVED from the concept list (stated in the report), never more than 6,
      never padded; dependency-ordered, one idea each; word budgets respected (prose ≤ 45,
      labels ≤ 10, fb ≤ 25); gated predicts carry misconception distractors; correct
      position varies; predict+observe fused via feedback / `data-build`.
- [ ] Existing good card content recycled, not discarded; existing broken choices rebuilt;
      sim-side predict/inquiry widgets folded in and REMOVED (markup + JS + CSS, no
      dangling refs).
- [ ] Feedback handler present exactly once; CSS not duplicated.
- [ ] `onStep` deterministic + self-contained; pager round-trip verified; Finish/Skip/
      Reset/restore verified; onComplete leaves free exploration open.
- [ ] Lecture mode installed (button, setLectureMode→finishInquiry, restore re-pointed,
      Skip removed, pager added-or-already-present, hidden on zero-cards sims) and
      verified per 5b.
- [ ] Sim body untouched — diff shows changes only in `#inq-cards`, the handler, onStep/
      onComplete/STEPS, stepReady wiring, and the lecture-mode/pager edits.
- [ ] Console clean; per-card screenshots confirm every on-card claim.
