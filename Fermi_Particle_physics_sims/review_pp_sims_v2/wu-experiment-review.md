# Review — wu-experiment-and-the-death-of-parity.html ("Wu Experiment — parity violation in ⁶⁰Co β decay", curriculum: Simulation Descriptions row "Wu Experiment and the Death of Parity" · Lecture 17 Radioactivity and Beta Decay)
**Verdict:** Physics core is statistically exact (sampler, hemisphere probabilities, histogram line all verified to <1σ over 60k-event runs at 5 polarizations; A = −1, β̄ = 0.60, theory 𝒜 = −0.300 at P = 1 all internally consistent); the mirror/CP panels draw a fully self-consistent plane reflection — but the mirror panel's on-canvas subtitle states the opposite transformation from the one drawn, and the verdict chip ignores the sign of 𝒜 (reproduced spurious "✗ Mirror disagrees" at P = 0). Plus one Reset-desync flow bug and small inquiry-revisit polish.
**Console:** clean (only a benign `favicon.ico` 404 from the review http server — not a sim asset).  **Combos tested:** 15 exhaustive (P × panel) + 5 × 60k-event statistical runs + ~50 sampled (slider walks, flow mutations, stress).
**Method note:** headless Chrome (puppeteer-core, 1440×900, `document.hidden = false` — rAF live, real-time accumulation verified at the ramped 10/s rate); long runs driven through the sim's own `onFrame`/`tallyOne`; draw-call directions probed by instrumenting `arrow()`/`tri()`.

## PHYSICS
### P0
none
### P1
- **[PHY-P1-1] [high]** Mirror panel's on-canvas subtitle contradicts the drawn transformation. The panel is a (correct, fully self-consistent) plane reflection: spins and B visibly FLIP (probe: spin mean dir −1, B down, I triangles reversed on the mirror side) while the electron tracks keep their vertical direction — exactly what the card-3 text and Info modal describe ("reversed current, reversed B and reversed spin, while the electron paths are unchanged"). But the subtitle under "MIRROR IMAGE — what parity predicts" reads "P: momenta flip · spin and B do not" — the point-inversion convention, the opposite of every arrow on screen. Repro: card 3 commit, or Mirror image: ON. Evidence: wu-r-card3-mirror.png + arrow/tri probe (mirror side: B down, spins down, tri dir −1; e⁻ dz unchanged). Anchor: `drawApp` tag block, `sub = 'P: momenta flip · spin and B do not'` (~L1103). → **Fix:** make the subtitle describe the reflection actually drawn, e.g. "reflection: tracks mirrored · axial J, B and I reverse" (keep the physics conclusion wording in the cards as is).
- **[PHY-P1-2] [high]** Verdict chip tests only |𝒜| ≥ 2σ with a prediction committed — it never checks the SIGN of 𝒜 (or its agreement with theory A·P·β/2), so a statistical fluctuation at P = 0 flips it to wrong physics. Reproduced: P = 0, mirror ON, pred committed, N = 30 000 → 𝒜 = +0.0123 ± 0.0058 (2.1σ, pure fluctuation, POSITIVE) → chip showed "✗ Mirror disagrees with the data"; with + Charge conjugation it would read "✓ CP mirror matches the data" for an excess ALONG B — the mirror-world's law. Continuous monitoring makes an eventual transient 2σ crossing at P = 0 likely on long runs (repeated-testing). Anchor: `verdict()` (~L1140) and `revealReady()`. → **Fix:** require sign consistency (`m.a * A_COEF > 0`, i.e. 𝒜 significantly NEGATIVE) — or better, compare |𝒜 − 𝒜_theory| vs |𝒜 − 0| — before emitting the ✗/✓ mirror wording; otherwise fall back to the neutral "𝒜 = x ± s" chip.
### P2
- **[PHY-P2-1] [med]** Stale/inconsistent audit hook vs its own change-log: the header comment (L342) claims "__audit.at() now reports the live P, A and v/c", but `window.__audit.at()` returns the fixed reference model (P = 1, v/c → 1, slope −1) per its own MANDATORY AUDIT HOOK comment — slope −1 ≠ the sim's actual on-screen slope A·P·(v/c) = −0.60 at P = 1. Anchor: L342 vs L766–783. → **Fix:** either report live `S.P`, `A_COEF`, `VC` in `at()` or correct the L342 change-log claim.

## NON-PHYSICS
### P0
none
### P1
- **[NP-P1-1] [flow] [high]** Reset desyncs the scene from the active inquiry card and silently discards the committed prediction. Repro: card 2 active ("Spin polarization P = 1.00, every J locked") → ↻ Reset → P = 0 warm scene under a card asserting P = 1.00; `S.pred` cleared to null (theory row back to "—") while all card answers stay marked answered; playback also force-starts (Shell reset → `setPlaying(true)`), defeating the card's paused-until-commit design. Observed live (before: step 1, P 1, pred "down", paused → after: step 1, P 0, pred null, playing). Anchor: `onReset` (`S.pred=null; setState(OPEN)`, ~L1305) + shell reset listener. → **Fix:** in `onReset`, re-apply the active card's spec when the inquiry is open — `onStep(Shell.step)` (build-a-baryon's fixed pattern) — and keep `S.pred` if the active card is already answered; restore the card's `pause` flag instead of unconditionally playing.
### P2
- **[NP-P2-1] [inquiry] [med]** Revisiting answered cards 3/4 via the pager shows the pre-reveal scene under post-reveal feedback: card 4 revisited renders the P-mirror only (a: false) while its shown feedback says "✓ CP mirror matches the data: anti-⁶⁰Co would decay this way", and card 3 revisited has no mirror panel while its feedback references "the dashed panel". Deterministic STEPS specs are pre-commit states and `data-build` reveals fire only once (`dataset.answered` guard). Evidence: wu-r-card3-revisit.png (card 4 active, MIRROR IMAGE panel, "No counts yet" chip, green CP feedback in sidebar). Anchor: `STEPS` (~L1247) + choice handler answered-guard (~L1330). → **Fix:** in `onStep`, if the target card is already answered, apply its post-reveal spec (m/a from `data-build`).
- **[NP-P2-2] [flow] [low]** Advancing card 2 → 3 wipes the counts the card-3 prose cites: "Your counters record the law…" opens over N = 0 (setState clears counts; they rebuild within seconds at the ramped rate since play continues). Observed: card2 N = 404 → card3 entry N = 0. Anchor: `STEPS[2]` via `setState` → `clearCounts()`. → **Fix (optional):** preserve counts when only advancing 2→3 (same P, no panel change), or soften the card-3 opening line.
- **[NP-P2-3] [ux] [low]** Formal-layer equation lines wrap mid-formula at 1440px (e.g. "W(θ) ∝ 1 + / A P v/c cos θ" and p↑'s "APβ/4" dropping to the next line). Evidence: wu-r-formal-P1.png, wu-r-light-mirror.png. Anchor: `.sim-eqrow` layout. → **Fix:** `white-space:nowrap` per equation span or wider eq column.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| Spin polarization P slider | 0 → 25 → 50 → 75 → 100 while running + 36-event rapid scrub | S.P, polVal text, counts cleared per advertised note, 𝒜_meas within ~2σ of A·P·β/2 at every stop, theory row tracks (−0.000/−0.075/−0.150/−0.225/−0.300) | OK |
| Mirror image btn | off→on→off ×2 + 30-toggle stress | S.mirror, btn text/aria-pressed, split-panel render, counts PRESERVED across toggle, mirror-off forces anti-off, no listener duplication (toggle parity exact after 31 clicks) | OK |
| + Charge conjugation btn | off→on→off, incl. anti-on forcing mirror-on | S.anti, btn text, positron colour + B/I restored in CP panel, counts preserved | OK |
| Play/Pause | opens PAUSED; play→2.5 s real-time rAF run; pause→change P→play | ramped accumulation (≈10/s first 60), playing flag, config kept across pause-edit | OK |
| Speed select | 1×→4×→1× | Shell.speed, persists across P change and pause | OK |
| ↻ Reset | pressed mid-inquiry and free-run | returns to OPEN (P 0, counts 0, panels off) — but see NP-P1-1 (card desync, pred wipe, auto-play) | NP-P1-1 |
| ⛶ Maximize | on→off | shell-max class, canvas 1090→1410 px, full state kept (P, mirror, counts) | OK |
| ∑ Formal | on→off | formal section shown, distCanvas 692×110 live, KaTeX rendered | OK |
| ☾ Theme | dark→light→dark | light-theme class, canvas re-themed (spin colour swap), state kept | OK |
| ⓘ Info | open→Esc/close | modal open class, correct title | OK |
| 🎓 Lecture / restore chip | on→off | inquiry hidden + free exploration at OPEN state; restore reopens card 1 with answers kept ("1111") | OK |
| Hide Text | check→uncheck | hide-text class toggles; registry empty (0 items), innerText delta 0 — matches the declared empty registry | OK |
| ‹ › pager, Next → | full round trips 4→1→4 | see inquiry table | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| P {0,.25,.5,.75,1} × panel {plain, mirror, CP} | exhaustive | 15 (8 135 events each) | 𝒜 within 3σ of A·P·β/2 (max dev 1.27σ), counts non-negative, N↑+N↓ = N, readouts finite/no NaN, config persisted after run, verdict wording matches data state | 15/15 pass |
| Long-run statistics per P | sampled (60 000 events each) | 5 | 𝒜 vs −0.3P (max dev 0.72σ); histogram least-squares slope vs A·P·β (all ≤0.003 absolute) | 5/5 pass |
| P = 0 corner, mirror + pred, N = 30 000 | corner probe | 1 | chip must stay neutral at P = 0 | FAIL → PHY-P1-2 |
| Flow mutations | sampled | ~12 | pause→P change→play; speed×P; theme×mirror; maximize×mirror+counts; P-change count-clear is the advertised behaviour (not silent) | pass |
| Stress | sampled | 30× mirror toggles, 36-event slider scrub, double-answer per card | end-state parity exact, no error flood, answer idempotent | pass |
| Drawn-vector direction probe | exhaustive over 3 panels | 3 | plain: J↑ B↑ I→; mirror: J↓ B↓ I←, e⁻ paths unchanged; CP: J↓ B↑ I→, e⁺ | pass (drawing) — caption mismatch → PHY-P1-1 |
| Skipped | — | real mouse-drag on the range input (drove `input` events instead — same handler); viewports other than 1440×900/maximized | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 · A warm start | P = 0, spins random (screenshot), counts 0, PAUSED | ✓ Next disabled pre-answer | data-play starts source on commit (incl. wrong choice); both counters climb together (30 events: 11/19, 1.5σ) | "random spins average out… 𝒜 near 0" ✓ | OK |
| 2 · Cool it down | P = 1.00, all spin targets exactly 0 (locked onto B), paused until commit | ✓ | data-play; pred committed → theory row −0.300 appears | "↓ collects ~65%, 𝒜 → −0.30" ✓ measured −0.262 ± 0.048 at N = 404 | OK |
| 3 · Hold up a mirror | counters running; mirror revealed on commit, counts PRESERVED across reveal | ✓ | data-build="mirror" fires once | axial/polar argument ✓; chip "✗ Mirror disagrees" at N ≥ 200, 2σ ✓ | OK fwd (revisit → NP-P2-1; entry count-wipe → NP-P2-2; caption → PHY-P1-1) |
| 4 · The antimatter repair | mirror panel on; C applied on commit (B↑, I→, e⁺, spin kept ↓ — probe-verified) | ✓ | data-build="cp" | "✓ CP mirror matches"; .inq-after (Wu 1956–57, Lee–Yang Nobel, 1964 kaons) shown ✓ | OK fwd (revisit → NP-P2-1) |
| pager | 4→1→4 round trip: every scene = its STEPS spec, deterministic; answers preserved "1111"; completion collapses inquiry to free exploration at OPEN; restore chip reopens card 1 with answers | | | | OK |

## Curriculum checklist
- Cold ⁶⁰Co in strong B undergo β decay to Ni-60, electrons to N/S counters → **met** (e⁻ tracks terminate at the two hemisphere counter planes)
- Polarization control (curriculum frames it as "strength of B field") → **met with a documented deviation**: slider sets P directly, with an on-screen note that P is really Brillouin(μB/kT) and that Wu held I and B fixed — physically more accurate than a B-slider; flagged for awareness, not a defect
- Spins random at low polarization, align as P grows → **met** (random cluster at P = 0 screenshot; wrapped-normal sampler ⟨cosθ⟩ = P exact; all targets 0 at P = 1)
- Detection builds a per-direction record → **met** (proportional fill bars + live counts/percentages); the full (1/N)dN/dcosθ histogram lives behind ∑ Formal (hidden by default) — acceptable, formal layer is declared optional
- Cumulative asymmetry approaching the real value as alignment grows → **met** (𝒜 ± √((1−𝒜²)/N) live; → −0.30 = A·P·β/2 at P = 1, matching Wu's v/c ≈ 0.6 regime)
- Mirror toggle showing spin reversed in the mirror ⇒ measurements can't be identical ⇒ P violated → **met** (dashed hypothesis panel, ✗ chip) — subtitle wording issue is PHY-P1-1
- Guided-inquiry stages incl. individual spin alignment, coil current, mirror comparison, CP/antimatter resolution → **met** (4 gated predict-commit cards; I drawn+labelled in both panels; CP card + panel)
- "If P is conserved, what would you expect to measure?" (Lecture 17 inquiry) → **answerable from the screen**: card 2's "Equal — a mirror image can't tell ↑ from ↓" choice is exactly this prediction, refuted by the student's own counts

## To verify (human)
- Wu's historically measured asymmetry (~0.25 at her P ≈ 0.6) is not quoted anywhere; the sim anchors to the idealized P = 1 value −0.30. Decide whether the lecture wants the historical number on screen.
- Layout at viewports narrower than 1440 (e.g. 1280/1100) was not walked this run; 1440×900 and maximized (1410 px canvas) are clean.
- KaTeX comes from the jsdelivr CDN; offline classrooms fall back to the plain-text equation strings (fallback verified present, rendering verified online only).

## FIXES APPLIED (2026-08-26)
All five open findings were independently re-confirmed in a live headless-Chrome session (1440×900, zero pageerrors) before any edit; NP-P1-1/NP-P2-1 were re-checked as already resolved by the systemic sweep. Note for repro: the sim now OPENS IN LECTURE MODE (inquiry collapsed, `inqStep` at the last card) — inquiry-flow tests must first click the "▸ Guided inquiry" restore chip, otherwise `inq-next` hits Finish/`onComplete` and wipes state.

| ID | verdict | evidence / fix |
|---|---|---|
| PHY-P1-1 | **CONFIRMED + FIXED** | Code: `drawApp` uses `spinM=mir?-1:1`, `bM=-1`, current triangles reversed, tracks keep vertical direction; screenshot at P = 1 shows mirror panel with spins/B down, ◀ triangles — while the subtitle read "P: momenta flip · spin and B do not". Fix: subtitle now "reflection: tracks mirrored · axial J, B and I reverse" (drawing untouched; matches Info-modal L358 wording). |
| PHY-P1-2 | **CONFIRMED + FIXED** | Pre-fix, P = 0 + committed pred + mirror ON, continuous monitoring over 30 000-event runs: 5/10 runs transiently showed "✗ Mirror disagrees", including POSITIVE 𝒜 excursions (+0.087 @ 2.03σ, +0.120 @ 2.0σ — the mirror-world's sign). Fix: new `wuSignal()` — 𝒜 must be ≥2σ from zero, signed like A·P·β (A = −1 ⇒ negative), AND closer to 𝒜_theory = A·P·(v/c)/2 than to zero (the review's "better" option; kills the repeated-testing false ✗ at P = 0 entirely since 𝒜_theory = 0 there). `verdict()` and `revealReady()` both use it. Post-fix: 20 × 30k continuous-monitoring runs at P = 0 → 0 false verdicts (max excursion seen 3.07σ, chip stayed numeric); P = 1 → 𝒜 = −0.303 @ 55σ → "✗ Mirror disagrees" ✓, CP → "✓ CP mirror matches" ✓; P = 0.5 → ✗ @ 28.7σ ✓. |
| PHY-P2-1 | **CONFIRMED + FIXED** | Pre-fix `__audit.at(0.5)` returned `polarization:1, slope:-1` before AND after moving the slider to P = 0.40. Fix: `at()` now reports live `S.P`, `A_COEF`, mean beta `VC`, `slope = A_COEF·S.P·VC` and the matching density (top-level script scope — sim state visible; comment updated). Post-fix: P = 0 → slope 0; P = 0.4 → slope −0.24; P = 1, cosθ = −1 → density 0.8, slope −0.6 — all match the on-screen theory line, L342 change-log claim now true. |
| NP-P1-1 | **ALREADY-RESOLVED** (SYS-2) | `onReset` re-applies the active card via `onStep(Shell.step)`; live: Reset mid-card-4 → P = 1, mirror + CP re-applied, counts zeroed, playback per card spec. Left alone per instruction. |
| NP-P2-1 | **ALREADY-RESOLVED** (SYS-5) | `onStep` re-applies `data-build` reveals for answered cards; live pager round trip: card 3 revisit shows the mirror panel, card 4 revisit shows the CP panel with its ✓ chip. Left alone per instruction. |
| NP-P2-2 | **CONFIRMED + FIXED** | Pre-fix `setState` called `clearCounts()` unconditionally, so 2→3 (and 3→4) wiped the counts card 3's prose cites. Fix: STEPS 3/4 carry `keep:true`; `setState` preserves counts (and spin phases) when `keep` is set and P is unchanged — specs stay absolute/deterministic for the pager. Live: card 2 N = 1082 → card 3 entry N = 1082 (P = 1 kept) → card 4 N = 1092; pager 4→3→4 keeps counts + reveals; Reset still zeroes (P changes through OPEN, so the wipe path runs). |
| NP-P2-3 | **CONFIRMED + FIXED** | Pre-fix at 1440×900 with ∑ Formal: `#eqW`/`#eqProb` rendered 334 px wide × 2.6 lines — "W(θ) ∝ 1 +" broke mid-formula (screenshot). Fix: `.sim-eqrow>span{flex:0 0 auto;white-space:nowrap}` (was `flex:1 1 220px;min-width:200px;overflow-wrap:anywhere`) — the flex row wraps BETWEEN formulas, never inside one. Post-fix: spans content-sized (386/390/170 px), single KaTeX line each, no horizontal overflow (screenshot). |
