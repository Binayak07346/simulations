# Review — Relativistic_kinematics.html ("Relativistic Kinematics", Lecture 6) — re-review

> **UPDATE (fix pass, same session):** both findings fixed and re-verified
> (`_review/rk-verify.mjs`, screenshots `11-ghost-persistent.png`, `12-lecture-resume.png`).
> - NP-P1-1 ✅ the naïve-2m ghost now persists when the student predicted (A): alpha
>   floors at 0.45 instead of fading to 0 (with a comment recording why). Verified: after
>   answering (A), the dashed grey circle + "naïve M = 2.00 (masses add)" label are on
>   screen inside the larger purple M disc — exactly what the feedback text describes
>   (1637 ghost pixels measured in the settled state).
> - NP-P2-1 ✅ exiting Lecture now resumes at the card the student left
>   (`inqShow(inqStep)` instead of `inqShow(0)`): verified card 3 → lecture → tweak
>   m₁=2.5 → exit → still card 3, m₁ = 2.5 preserved; only the card's own mode/boost
>   staging re-applies (its lesson contract).
> - Regression: boosted-frame audit exact for the modified system (E′ = 5.792,
>   invariant M = 5.480 — both match hand calculation); 0 console errors.

**Verdict:** Physics is exact everywhere — every table entry, boost transform, invariant,
decay energy, and velocity-addition value verified by hand to the displayed digit; the
forbidden-decay affordance is exemplary. One NON-PHYSICS P1 (the prediction feedback
references a "dashed grey circle" that is not visible when the text appears) and one P2
flow note (exiting Lecture mode restages to inquiry defaults — deliberate, code-commented).
**Console:** clean (0 errors across ~55 states). **States tested:** 40 (generic probe) +
16 targeted flows — evidence in `_review/probe-out/`, `_review/rk-out/` (`rk-flows.mjs`).

## Verified-correct highlights (browser-observed, hand-checked)
- **Default merge (±0.8c, m=1):** E = 1.667/p = ±1.333 each, M = 3.333 = 2γm, product at
  rest; conservation row ✓ (`01`).
- **Boost 0.8 — the core lesson:** invariant M stays 3.333 exactly; E′tot = 5.556,
  p′tot = −4.444 (γ_b transforms exact); m₁ boosted by its own velocity lands at
  E = 1.000, p = 0.000 "(at rest)"; m₂ drawn at v = −0.98c — the exact relativistic
  velocity addition (−1.6/1.64) (`02`). Invariant panel says "same value in S and S′" and
  it is.
- **Unequal-mass merge:** Etot = 3.548, ptot = 1.186, M = 3.344 — all exact.
- **Elastic (equal masses):** momenta swap exactly (CM-reflection method is correct
  general-mass 1D elastic).
- **Decay:** E_A = (M²+m_A²−m_B²)/2M = 1.667, back-to-back ±1.333 ✓; parent-rest ZMF and
  boosted-frame views both conserve and keep M invariant ✓. **Forbidden decay** (m_A+m_B
  = 4.00 > M = 3.33): big "✗ Decay forbidden" banner with the inequality, parent stays
  stable, Q = −0.667 with an available-vs-required breakdown, velocity sliders correctly
  dimmed (`05`) — precisely the "which decays are kinematically prohibited" inquiry
  affordance from the course plan.
- **Flows:** mode switches and round-trips preserve ALL slider state (m1=1.5, boost=0.6
  kept); sliders live-update while running and `change` replays the collision; reset
  restores exact defaults paused; prediction gate blocks Next until answered, wrong
  answer highlights the correct one and delivers a complete corrective explanation
  (`07`); no overflow at 1100px; light theme clean; 0 DOM overlaps.

## PHYSICS
### P0
- none
### P1
- none
### P2
- none — every displayed number checked against the canonical formulas.

## NON-PHYSICS
### P0
- none
### P1
- **[NP-P1-1] [pedagogy] [high]** Prediction-A feedback says "The dashed grey circle on
  the canvas is your 2m guess; the solid purple product is the larger real M" — but the
  ghost circle is invisible at that moment. Repro: card 2, choose (A). The click handler
  sets `S.progress = 2` (line ~1363) and the ghost alpha is
  `min(0.8,(1.85−progress)/0.5)` (line ~1086) → 0 at progress 2; pressing ▶ Play does not
  replay (progress already 2), so the referenced visual only flashes for ~1 s if the
  student happens to change a slider. Evidence: `07-prediction-feedback.png` (no dashed
  circle on canvas while the text names one). → **Fix:** keep the ghost persistent when
  `S.prediction==='A'` — e.g. floor the alpha at ~0.45 instead of 0
  (`const alpha = S.prediction==='A' ? Math.max(0.45, …) : …`) so the naïve-2m dashed
  circle + label sit inside the larger purple M disc exactly as the text describes.
### P2
- **[NP-P2-1] [flow] [med]** Exiting Lecture mode (toggling 🎓 off) restages to inquiry
  card 0: mode→inelastic, boost→0, sliders→defaults (probe caught boost 0.99→0).
  Anchor: `setLectureMode(false)` → `inqShow(0)` (line ~716). Entering Lecture was
  deliberately made non-destructive (code comment "do not inqShow(0), which would restage
  and wipe student params") — the exit path accepts the wipe because the inquiry cards
  restage on every step anyway. Defensible; if you want it gentler, resume at the card
  the student left (`inqShow(lastStep)`) instead of 0.

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Default merge: table/invariant/animation | ✅ exact | 01 |
| 2 | Boost sweep: invariance + per-particle transform | ✅ exact incl. rest-frame case | 02 |
| 3 | Unequal masses; conservation | ✅ exact | flows JSON |
| 4 | Elastic mode | ✅ momenta swap | 03 |
| 5 | Decay allowed/forbidden/boosted | ✅ incl. Q<0 banner | 04, 05, 06 |
| 6 | Mode round-trip state persistence | ✅ all sliders kept | flows JSON |
| 7 | Reset scope | ✅ defaults, paused | flows JSON |
| 8 | Prediction gate + feedback | ✅ gate works; ❌ ghost ref (NP-P1-1) | 07 |
| 9 | Exit-Lecture restage | ⚠ by-design wipe (NP-P2-1) | probe |
| 10 | Narrow 1100 + light theme | ✅ | 09, 10 |

## Inquiry-question check
- "What kinds of decays are kinematically prohibited?" → **Yes — exemplary**: decay mode
  with free m_A/m_B/M_parent sliders, an explicit forbidden state with the inequality,
  Q-value, and an available-vs-required energy comparison.
- "Invariant mass the same in every frame?" → **Yes**: the invariant panel + boost slider
  demonstrate it live, and the numbers are exact.

## To verify (human)
- Whether NP-P2-1's exit-Lecture restage should resume the student's card instead of
  card 0 — one-line choice.
