---
name: guided-inquiry
description: Restructure, refine, or add a Guided Inquiry card zone (a FRAME card plus 3–5 gated multiple-choice questions in the SME grammar) in a single-file simulation HTML page built on the L-series shell (inq-dots, inq-step cards, choice buttons, predict-eval feedback). Use this skill whenever the user asks to restructure guided inquiry, refine inquiry/predict questions, fix inquiry cards, add a missing guided-inquiry section, or make inquiry cards more precise — even phrased as "do the inquiry like the Stern-Gerlach golden flow". The result follows the SME card grammar (references/golden-flows.md is canonical): question-before-observation, classical-baseline first, answers that resolve on the spot, plain physics prose with zero UI choreography, and a top-bar 🧭 Guided Inquiry button that owns the zone's visibility (paired with the 🎛 Controls Guide button when both exist).
---

# Guided Inquiry for Simulation Pages

> **Look:** on a finished user-version sim, the colours and type of this part come from the shared stylesheet. Run `../ui-stylesheet/SKILL.md` and then `../mobile-app-mode/SKILL.md` as the last steps. Don't restyle chrome colours here; change the stylesheet (`design-system/fermi-sim-css/`).

Restructure or add the Guided Inquiry zone of an L-series shell sim to the
SME card grammar. **The canonical exemplar set is
`references/golden-flows.md`** — ten flows written by the senior physics
SME (validated 9 Sept 2026). When this skill and an instinct disagree, the
golden flows win. Mechanics blocks (gating, wiring, hooks) are unchanged in
`references/implementation.md`.

**Read `references/golden-flows.md` AND `references/implementation.md`
before writing any code or cards.** Copy the mechanics patterns; write the
card content to the grammar below.

## The card grammar (SME-validated — do not improvise new card types)

The arc: **FRAME → Q1 (baseline) → chained questions**, typically
**4–6 cards total** (frame + 3–5 questions + optional interstitials).
Hard max 6. Never pad to reach a count — the SME's decks run 3–5 cards.

| Type | Job | Hard rules | Budget |
|---|---|---|---|
| FRAME | Define the apparatus and its physical quantities, symbolically | Physics first, UI never (the Simulation guide owns UI reading — its scene tour explains the window, its control steps the controls); one situating clause if a sibling sim precedes this one ("…instead of just a single stage"); shown before the spectacle — the boot state must not decide any pending question | ≤3 sentences |
| QUESTION | One committed question about ONE observable | `data-gate`d; 3–4 choices; each question changes exactly ONE thing in the apparatus vs the previous card; tests an inference or a representation-reading, never a lookup, never trivia, never a UI operation; stem is neutral — no classifying word that entails the answer; answers concrete and countable where possible ("how many regions are lit?") | stem ≤40 words, choices ≤ ~8 words |
| INTERSTITIAL | One connective fact between questions | A single declarative sentence that sets up the next question's premise | 1 sentence |
| OBSERVE-COMPARE | Post-question observation as a comparison task | Asks the student to notice or compare ("How is it different from the critically damped case?"); NEVER states the conclusion; pins the state it assumes | ≤40 words |
| TELL (naming only) | Attach the formal name to something already seen | Permitted ONLY for naming and definitions ("this oscillation is the massive radial mode") — behaviour must always be asked, never told | ≤2 sentences |

**Question ladder** (the golden flows' consistent ordering):
1. **Q1 = the naive/classical baseline** wherever one exists — what
   pre-quantum / pre-relativistic / everyday intuition predicts; the sim
   then breaks it. Q1 must be answerable from prior intuition alone, with
   no sim-specific vocabulary.
2. A deck may **cold-open on its flagship prediction** (settle race,
   constant-force speed limit) — allowed exactly when that question is
   intuition-answerable. A predict requiring the sim's own definitions
   cannot lead.
3. Later questions climb: mechanism → generalization → quantitative
   scaling, each modifying one apparatus element and reading one
   observable.
4. On a generalization question, include at least one distractor that is
   consistent with everything seen so far (SG's 1/j vs 2j+1 both fit
   j = ½ → 2 bands), so the sim — not memory — must decide.

Per-choice feedback rules (1–2 sentences each):
- **The answer resolves on the spot.** Name the principle plainly and
  completely: "B. The magnetic field serves as a measurement device that
  collapses the wavefunction onto eigenstates of σ_z." There is no
  separate resolve card to protect.
- **Claims strictly licensed by the evidence shown so far.** Young's
  interference licenses "classically, light behaves like a wave" — not
  "classical physics is inadequate." Never over-claim.
- Distractors are rival physical mechanisms ("the particle's charge causes
  the split"), never filler, never jokes; wrong-answer feedback names why
  that mechanism fails here.
- Keep and reuse the sim's rebuttal mechanics (ghost objects, mode flips)
  — they are the strongest feedback the sim has.

**Language rules (the "mechanical" fix — absolute):**
- Zero UI-choreography prose. Banned: "Commit to…", "Your answer
  fires/unmasks/recolors…", "watch **X** pull ahead", bold-control-name
  stage direction. Instructions are minimal imperatives naming physical
  objects: "Place an X magnet after the first Z magnet."
- Questions refer to physics objects, never UI objects ("which mode
  remains?", not "which row will not move?").
- Declarative physics prose throughout; no gamification, no meta-narration
  of the reveal machinery.

## Structural rules that outrank copy

1. **Question before observation — inviolable.** No card may show or run
   the phenomenon a later question asks about. When a current deck watches
   first and asks second, MOVE the question in front (the SME did exactly
   this to two decks); do not soften the question instead.
2. **No lookup before commitment** (fact questions only). If a readout or
   label would let the student read off an answer, stage its reveal to
   AFTER the commit (`applyStepReveals`). Inference and
   representation-reading questions are immune — visible data cannot spoil
   "is the last-found particle therefore the heaviest?" — so prefer
   reframing a fact question as an inference over hiding half the screen.
3. **State pinning + clean state between questions.** Every question and
   OBSERVE-COMPARE card declares the state it assumes and `onStep` sets
   it; between questions the apparatus returns to a quiet state (detector
   reset, beam off). Nothing runs before the student acts — UNLESS free
   exploration cannot decide any pending question, in which case the FRAME
   may explicitly invite it ("Explore what happens when you change μ²").
4. **Hero graphic.** The observable a card discusses must be the most
   visually prominent element while that card is active. If the payoff
   plot is a side panel, promote it for that step.
5. **Sanctioned affordance requests.** When a question needs an affordance
   the sim lacks (a source toggle, closable slits, per-question reset, a
   quiet boot state, relocating pre-reveal static text behind its
   question), request the minimal sim change, implement it additively, and
   REPORT it. Do not contort the flow around a missing affordance.
6. **Delete rather than fix** anything that is trivia (Lagrangian term
   counts), a glossary card, or spectacle. If a card can't be an honest
   question, a needed frame, or a naming tell, it goes.

## Refine vs restructure vs add (decide FIRST)

- **Copy polish only** — cards already follow the grammar: question-first
  ordering, resolving answers, plain physics prose, honest inference
  questions. Trim to budgets, strip any choreography phrases, nothing
  structural. (The SME passed two SR decks unchanged — conforming decks
  exist; don't rebuild them.)
- **Refine in place** — mechanics sound but grammar violated (observation
  placed before the question it answers, stem self-spoiling, lookup or
  trivia questions, choreography prose, glossary cards, missing classical
  baseline). Reorder and rewrite the cards — the SME's fixes were mostly
  reorders plus deletions; keep the sim's wiring style and mechanics (see
  below).
- **Full add** — no inquiry zone. Insert the shell blocks from the
  reference and author from scratch.

Wiring styles in the fleet — adapt whichever exists, never convert:
- **JS-config** (L1 style): feedback lives in `wirePredictions()` /
  `setupChoiceCard(card, correctIdx, {correct, wrong[], onWrong})`.
- **Data-attribute** (L2 style): choices carry `data-correct` / `data-fb`
  and the shell wires them.

## Workflow

### 1. Map the sim
Identify: the 2–3 teachable concepts and their on-screen observables; all
readouts/lists that could leak an answer; the wiring style; the step hooks
(`onStep`, `applyStepReveals` or equivalents); existing rebuttal mechanics
(ghosts, contrast modes); any step-driven view/scene switching and the
indices it hardcodes.

### 2. Structure proposal (mandatory — this is the judgment layer)
Before writing any card, produce and reason through, in this order:
- **Concept list**: the 2–3 phenomena worth questions, ordered along the
  ladder (baseline → mechanism → generalization → scaling), each with its
  single best countable observable.
- **Baseline check**: what does classical/naive intuition predict here?
  That is Q1 (or the cold-open flagship predict, if intuition-answerable).
  If genuinely no naive expectation exists, say so explicitly.
- **Misconception table**: for each question, every distractor named as a
  rival physical mechanism or misconception with its everyday origin. If
  you can't name it, the distractor is filler — replace it. On
  generalization questions, engineer ≥1 distractor consistent with the
  seen case.
- **Card plan**: one line per card — type, the one observable or claim,
  the ONE apparatus change vs the previous card, pinned/reset state, hero
  graphic, and which reveals unlock at that step.
- **Affordance list**: any sim change a question needs (toggle, closable
  element, per-question reset, quiet boot, relocated pre-reveal text) —
  each one minimal, additive, and reported.
Then three red-team passes: (a) answer each stem using only the stem — if
a classifying word in it entails the answer, neutralize the stem; (b) walk
the reveals — at each FACT question, list everything visible and confirm
none of it contains the answer (inference questions are immune); (c) read
every feedback string and confirm each claim is licensed by evidence the
student has seen by that card — no over-claiming. On the first few sims,
show this proposal to the user for sign-off before writing cards.

### 3. Write the cards
Follow the grammar table exactly. Number `1 ·, 2 ·, …`. Verify EVERY
factual claim against this sim's code — values, readout names, what
actually changes. Then read the whole deck aloud once: if any sentence
narrates the interface rather than the physics, rewrite it.

### 4. Wire
- Update `wirePredictions` indices (or data attributes) to the new card
  positions — **index drift is the #1 mechanical hazard**: `onStep` view
  maps, ghost-clear conditions, and reveal thresholds all hardcode card
  indices; re-map every one when the card count changes.
- Add state pinning to `onStep` for each OBSERVE card.
- Stage reveals in `applyStepReveals` per rule 1 above.
- Keep gate auto-pause and delayed Next-unlock (the shell has them).

### 5. Verify
```
node scripts/verify.js <patched.html> --baseline <original.html>
```
Config-free invariants: dots == cards; every card with choices is gated;
gated cards block Next until a choice; answering shows non-empty feedback,
marks exactly one choice correct, disables all choices, re-enables Next;
word budgets (card ≤90 pre-answer, feedback ≤60); Finish on the last card;
no NEW runtime errors vs baseline. The script rewinds first — these shells
boot on the LAST card under headless jsdom (a pre-existing quirk, fine in
real browsers).

Manual checks the script cannot judge: gates actually pause the sim; every
factual claim true in THIS sim; pinned states and view switches land on
the right cards; at each PREDICT, nothing visible leaks the answer; the
OBSERVE cards ask rather than tell.

Deliver as a new file (`<simname>-inquiry-v2.html`); never overwrite the
upload.

## The layout contract (measured identical across JEE-C, CM-L, PP-v2 and SR)

Where the inquiry LIVES is as canonical as what it says. All four reference
fleets render it identically (zone at the same coordinates, 18px below the
bar); sims from other stacks (QM) must be restructured to match:

1. **Right column, first block.** The inquiry zone (`#aside-inquiry` /
   `#inq-zone`) is the FIRST visible block in the right sidebar, directly
   below the top bar — gap ≤ 28px, and NOTHING between them. A sim-native
   sidebar header ("CONTROLS") above the zone violates the contract: move
   the zone above it so the header titles only the controls below.
2. **Zone-internal order:** zone head ("Guided Inquiry") → `#inq-dots` →
   `#inq-cards` → `.inq-listen` (once the voice layer is applied) →
   `.inq-nav`.
3. **Controls below.** The sim's control panels start below the zone; a
   bottom border / divider separates the two.
4. When the zone moves outside a padded container, give it its own padding
   (~14–20px) and `flex-shrink:0` so it neither inherits double padding
   nor collapses.

**Gate:** `node ../tests/layout-probe.mjs <build.html>` (course-agnostic,
real Chrome) asserts all of the above — run it alongside `verify.js` on
every build from a non-L-series stack, and after any sidebar restructure.

## The Guided Inquiry button and the two-button template (validated)

Visibility of the inquiry zone is owned by ONE top-bar button, 🧭 Guided
Inquiry (boots active). When the sim also gets a Simulation guide (the
renamed Controls Guide — see the controls-tutorial skill), the two buttons
are mutually exclusive: activating one deactivates the other; both off =
clean sim.

**Entry since 2026-10-01 (two-mode landing).** The welcome overlay offers
only *Simulation guide* and *Free exploration* — there is NO Guided Inquiry
card on the landing. The inquiry still boots active BEHIND the overlay, but
either landing choice turns it off (`__setMode('controls'|'free')`); the
student reaches the inquiry from the 🧭 header button, which resumes it at
its current card (`__giResume`). So: the 🧭 button must stay visible and
un-veiled whenever the guide is closed; never assume a student meets card 1
straight from the landing; and the FRAME card must still work as a cold
entry from free exploration (state is the post-completion `__freeExplore`
scene until card 1's `onStep` restages it — make card 1's step self-contained).

- **No Lecture mode, no restore strip.** Delete any 🎓 Lecture button,
  `setLectureMode`, and "▸ Guided inquiry" restore strip. The inquiry's own
  Finish (and Skip, where present) route through `window.__giOff` so the
  button state and the zone never disagree. (Lecture mode was also the
  cause of the jsdom boot-on-last-card quirk; removing it removes the
  quirk.)
- **Turning the inquiry OFF = free exploration** — the sim hands over its
  POST-COMPLETION state via `window.__freeExplore`. If the sim already has
  an `onComplete()` (L2-style shells do), `__freeExplore` is simply
  `onComplete`; keep the shell's Finish fast-forward (`onStep` for the
  remaining cards) and route only the collapse call through `__giOff`: all staged reveals
  lifted, rebuttal objects (ghosts) cleared, default view/scene restored.
  Never a mid-inquiry snapshot.
- **Turning it back ON resumes** — `window.__giResume` re-applies the
  current card's state (reveals, pinned selection/mode/view, pause on a
  gate). Progress is intact; the step counter is never reset by hiding.
- **Reset = first-load** — `window.__fullReset`: inquiry on at card 1
  (`inqShow(0)`), guide progress cleared, sim defaults restored,
  paused/playing as on boot. (Fleet builds since 2026-09-22 make Reset
  MODE-LOCAL — inquiry → card 1, guide → step 1, free → experiment only;
  see the reset-mode-local skill.) Expose `inqShow`/`step` on the shell object
  if they're private.
- **Boot paused when running would spoil a prediction.** If the author's
  sim boots playing and the first PREDICT concerns what the running sim
  shows, the first-load state pauses it; the Orient card says to press
  Play.
- **Answer-leak boundary with the Simulation guide.** The guide's scene
  steps describe the window and must never state a card's answer; give
  the guide author this deck's answer list. Known leak class to flag (not
  fix silently): the guide opens on the `__freeExplore` post-completion
  scene, which can DISPLAY answers (a revealed readout, a finished
  construction, a spacelike badge) — many fleet sims do (2026-10-01 rollout
  flags list); and old control
  steps / the closing "That's every control" card often state answers
  ("d does not change", "r never budges"). List them in the report.
- The Simulation guide, when entered, lifts inquiry reveals
  (`window.__cgReveals(99)`) and hands them back on exit. Publish
  `applyStepReveals` as `window.__cgReveals` — it lives in the sim's IIFE
  and is otherwise invisible to the template script (a `typeof` guard
  silently no-ops; this shipped once).

Reference code for all of this is §4 of the controls-tutorial skill's
`references/implementation.md` (verbatim from the L1 final build).

## Card voiceover + Auto (the Listen row — validated on C025)

When the sim gets the voiceover layer (controls-tutorial reference §6), the
inquiry side is a **Listen row above `.inq-nav`**: a circular play/pause
(`#inq-voice`) and an Auto pill (`#inq-auto`), both EXACTLY the height of the
sim's existing pager buttons so the sidebar row never grows. Contract:

- Play reads the ACTIVE card from the top — title, body paragraphs, the
  choice options, and (once answered) the visible feedback. Pause keeps the
  position; resume continues; finishing flips to a replay state.
- Card changes re-sync automatically (a MutationObserver watches the active
  card — no shell edits needed for sync).
- **Auto never answers a prediction.** It reads a gated card and goes quiet;
  when the student commits, it reads the feedback aloud, then advances via
  `#inq-next` (gating-aware — NEVER the pager), retrying while Next is
  locked. It turns itself off on the last card rather than pressing Finish.
- Narration hard-stops when the inquiry is hidden (`setGi(false)` calls
  `window.__giVoiceStop`), on mutual-exclusion switches, and on Reset.
- Auto pill states must be unmistakable: muted outline off; solid accent
  fill + glow on.

All code is verbatim in controls-tutorial `references/implementation.md` §6
(engine + markup + CSS + controller deltas + the Chrome TTS pitfalls, each
observed for real). ADAPT only the `norm()` speech replacements to this
sim's symbols.

## Pitfalls (each observed in the fleet)

- **The spoiler observe card**: showing or narrating the phenomenon before
  the question that asks about it ("notice how v is largest when r is
  smallest", a race run before the race predict). Move the question in
  front; observation cards ask the student to notice or compare, never
  state the conclusion.
- **The self-spoiling stem**: a stem containing the classifying word that
  entails the answer ("the origin has become a *hilltop*… what happens?").
  Describe the shape neutrally ("the bottom of a wine bottle"); keep the
  subtlety for the answer ("an equilibrium, but an unstable one").
- **The lookup-leak stem**: a FACT question that invites reading the
  answer off a readout before committing. First try reframing it as an
  inference (immune to visible data); otherwise stage the reveal.
- **Index drift**: changing the card count without re-mapping every
  hardcoded index in `wirePredictions`, `onStep` view/ghost logic, and
  reveal thresholds. Walk each one explicitly.
- **Feedback that withholds**: forward-pointing feedback that saves the
  principle for a later card ("watch the next card to find out"). The
  answer resolves on the spot, 1–2 sentences, principle named — the old
  never-resolve rule is retired.
- **Answers hiding in choice text**: a choice that carries the
  explanation or points at the evidence ("top: 172.6 GeV — rightmost on
  the ladder"). Choices are terse claims; explanation lives only in the
  answer feedback.
- **The mashed closer**: a final card carrying multiple resolutions plus
  implementation trivia at 120+ words. One principle, plainly stated; cut
  internals (integrators, code details) from student copy.
- **jsdom last-card boot** (sims still carrying Lecture mode): headless
  walkthroughs must rewind with `inq-prev` before asserting anything
  about card 1 — and the quirk can MASK bugs by pre-revealing everything;
  test realistic flows from card 1.
- **Theory curves are lookup leaks.** A chart that draws the theoretical
  prediction from boot (the double-slit |ψ₁+ψ₂|² curve) answers the first
  PREDICT; hide that panel until the commit, reveal it on the Observe
  card where dots fill the curve.
- **Hidden-until-step helper text.** Hint paragraphs near controls often
  state the answer ("close one slit to see single-slit diffraction");
  keep them inside the group that stays hidden until after the commit.
- **Mid-inquiry exit leaving a half-built sim** — route every exit
  (button off, Finish, both-off) through `__freeExplore`.
- **Observation-gated cards are outside the grammar** (Coriolis sphere): a
  card that unlocks on sim-side counters ("launch ≥3 parcels") rather than a
  committed choice fails the verifier's invariants by design. Convert to
  commitment gates and keep the action instruction as directed copy — and
  FLAG the conversion to the user, since it trades away enforced observation
  (a deliberate design in some sims).
- **Async-boot sims** (Coriolis sphere): if `Shell.init` waits on a CDN
  library, the inquiry never initializes headlessly and boots late for real
  students. Split into an immediate `Shell.init({})` (inquiry/buttons/chrome
  at parse time) plus a late `Shell.attach(callbacks)` when the library
  lands; move DOM-only prediction wiring out of the library-gated path.
- **Latch-style reveals leak on re-entry** (Galperin): the reference
  `__giResume = () => onStep(Shell.step)` assumes reveals are a pure function
  of the step index. If the sim stages a reveal behind a COMMIT LATCH
  (`step3Committed`-style booleans), `__freeExplore` lifting it can leave the
  answer visible when the inquiry re-enters an uncommitted predict card —
  re-derive such latches from `data-answered` / `Shell.step` inside
  `__giResume`.
- **Early-return guards swallow the wiring** (L30 turntable): if the sim's
  script begins with a guard like `if(!window.THREE) return;`, any prediction
  wiring or hook publication BELOW it silently vanishes when the CDN fails
  (and under jsdom). Hoist DOM-only wiring and hook publication above such
  guards, and publish safe no-op hooks on the guarded path.

## Bulk application

Process one sim at a time with the full workflow; never reuse another
sim's concept list, misconceptions, or card copy — structural similarity
is not conceptual similarity. Always pass `--baseline`. A sim failing any
invariant is fixed or set aside, never shipped with a lowered bar. Log
every forced deviation from this skill and report it to the user at the
end of the batch as skill feedback.
