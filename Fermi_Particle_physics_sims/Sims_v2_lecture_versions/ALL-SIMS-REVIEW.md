# Particle Physics v2 — consolidated review (all 14 sims)

Compiled from the per-sim reviews in this folder (each has full repro/evidence/anchor/fix
detail — this file is the validation checklist). Findings are listed **in priority order
(P0 → P1 → P2)** within each box. To request a fix, quote the sim + finding id
(e.g. "fix cloud-chamber NP-P0-1").

## ⚠ Systemic bugs (same root cause across many sims — fixable as one sweep)

> **STATUS: ALL FIVE VERIFIED GENUINE AND FIXED** (per-sim commits `af676da…cc636de`,
> 2026-08-26). Independent verification before fixing found the scope slightly WIDER
> than reported: SYS-1 also hit gold-foil (a 7th guard the agents missed); SYS-2 was
> missing in 9 sims (+ how-to-make); SYS-4 affected 6 sims (+ detector-hq, scale,
> dirac latent). Fixes applied: `window.Shell = Shell` exposure (6 sims);
> `onStep(Shell.step)` re-sync in onReset (9 sims) + force-play dropped from the wu /
> wine-bottle reset wires so per-card pause specs survive Reset; negative-dt clamp in
> the shell loop (all 14); palette reads switched to `document.body` (6 sims);
> answered-card reveal re-fire in onStep (eight-fold-way, detector-hq, wu — incl.
> routing 8fold's onReset through onStep). Headless-verified: all 14 load clean; probes
> confirm fire-while-paused resumes, Reset preserves the active card's scene AND pause
> state, theme reaches the canvas, and answered reveals survive pager + Reset.
> The per-sim findings below that map to SYS-1…SYS-5 are therefore RESOLVED; remaining
> per-sim findings (PHY-P0s, hat overflow, KaTeX, etc.) are still open.

- **SYS-1 · `window.Shell` dead-guard** — `const Shell` is lexical, so every
  `if(window.Shell && Shell.xxx)` guard silently no-ops. Hit in **6 sims** with varying
  impact: cloud-chamber (P0: blank chamber on Fire-while-paused, Reset restages wrong
  card), detector-hq (P1: frozen scene under feedback), dirac-sea (P1: excite/reveals
  never auto-resume), scale-of-universe (P1: transport + reveals dead while paused),
  particle-collider (P2: dead code only), plus already-repaired guards in
  spin-and-helicity / how-to-make-a-particle. One-line fix per sim: `window.Shell=Shell`.
- **SYS-2 · Reset desyncs the scene from the active inquiry card** — `onReset` restages
  a fixed/first/last spec while the open card claims a different scene. Hit in **7
  sims**: dirac-sea, feynman, gold-foil, detector-hq, standard-model, spin-and-helicity,
  wu (+ cloud-chamber via SYS-1; wine-bottle in a force-resume variant; scale-of-universe).
  Proven one-line fix (already shipped in build-a-baryon): `onStep(Shell.step)` after reset.
- **SYS-3 · Missing negative-dt clamp in the v2 shell loop** — first rAF frame after
  `setPlaying(true)` can carry a timestamp earlier than the stored `performance.now()`
  → dt < 0 → state corruption. Crashed cloud-chamber (NP-P0-1); latent in all 14 (the
  v1 shell had this exact clamp). Fix: `if(!(dt>=0)) dt=0;` in the shell loop.
- **SYS-4 · Light-theme canvas mismatch** — theme class set on `body`, canvas palette
  read from `documentElement`: canvas ignores the in-sim theme toggle
  (how-to-make-a-particle P1 — labels near-invisible; standard-model, spin-and-helicity P2).
- **SYS-5 · Answered-card revisits re-apply pre-answer scenes** under post-answer
  feedback (eight-fold-way, detector-hq, wu; P2) — `onStep` should re-fire the card's
  reveal when `dataset.answered` is set.

---

## 1 · virtual-cloud-chamber.html  (review: virtual-cloud-chamber-review.md)

> **CLOSED — e6ac154** (2026-08-26, confirmed genuine before fixing): PHY-P2-1 — plate ΔE really was quantized to 1.5 mm steps; each step now charges its true in-plate fraction. Card-4 scene 40.2 MeV/6.0 mm → 42.7 MeV/6.4 mm, ≤0.1% from a fine-step reference. All this sim's findings are now resolved (rest were fixed in 099c45b).

**Physics bugs (priority order):**
- PHY-P2-1 — Plate path/ΔE quantized to 1.5 mm steps: card 4 shows "40.2 MeV over 6.0 mm" where the continuous oblique-path model gives 6.33 mm → 42.4 MeV (~5% low); internally self-consistent and matches Anderson's ≈40 MeV.
- PHY-P2-2 — Card 2 feedback hardcodes "14.1 → 7.1 cm" while its B/R spans are live — wrong numbers if the student changes config mid-card before answering.

**Non-physics bugs (priority order):**
- NP-P0-1 — Intermittent crash answering card 4 (4/6 sessions): negative dt on resume → `pts[-1].x` TypeError in draw() → **rAF loop dies permanently**. (Root cause = SYS-3.)
- NP-P0-2 — `window.Shell` undefined (SYS-1): ▶ Fire while paused (the boot state) leaves a blank chamber; Reset always restages card 1's spec; pause-on-scrub dead.
- NP-P2 (5) — revealed-mystery Eₖ shows the slider's stale value; ghost-tag chip overlap; crossed-then-stopped tracks drop the first exit r; "trapped — r too small" status unreachable; `window.__audit` is a stale stub.

*Physics core: 108/108 combos exact vs independent relativistic integrator; curvature senses correct.*

## 2 · how-to-make-a-particle.html  (review: how-to-make-a-particle-review.md)

**Physics bugs (priority order):**
- ~~PHY-P0-1 — **Both pair tracks curve the wrong way** for the declared "B = 1 T ⊗ into page" (e⁻ label curls with positron sense); proven numerically + visually. One-line sign fix (L911).~~ **FIXED (6bd64f1)** — `sg=k?-1:1;` in `buildTracks`; browser-verified: e⁻ endpoint now below the axis (clockwise-as-seen), e⁺ above (counterclockwise), exact mirror of the pre-fix capture, zero console errors.
- ~~PHY-P2-1 — "√s ≈ 195 GeV for γ+Pb" in Info/formal; true Pb-208 value 193.7 GeV.~~ **FIXED (7fc2ffe)** — "≈ 194 GeV" in both places (node-verified: 193.730 GeV at Eγ = 1 MeV).
- ~~PHY-P2-2 — Kinetic-energy readout shows unitless "0" at exact thresholds.~~ **FIXED (7fc2ffe)** — `fmtE` zero branch returns "0 MeV".

**Non-physics bugs (priority order):**
- NP-P1-1 — Light theme never reaches the canvas (SYS-4): ladder/decade labels near-invisible on the light plot. *(resolved by the SYS-4 sweep)*
- ~~NP-P2-1 — Reset on card 1 leaves the sim playing, defeating the deliberate boot-paused staging.~~ **FIXED (7fc2ffe)** — shell reset no longer forces play; the card's step spec owns pause (wu/wine-bottle pattern). Verified: Reset on card 1 stays paused; Reset in completed state still resumes.
- ~~NP-P2-2 — Endpoint labels pile onto the nucleus in the tight-spiral regime.~~ **FIXED (7fc2ffe)** — labels within 20 px of the nucleus pushed 16 px radially outward; verified at 1.5 and 10 MeV.
- ~~NP-P2-3 — Unbounded photon train under rapid Fire γ clicks (cosmetic; no listener duplication).~~ **FIXED (7fc2ffe)** — Fire ignored while ≥ 3 photons in flight (15 rapid clicks → 3, was 16).

*Physics core: all 8 pair thresholds exact (2mc², PDG); T = Eγ − 2mc² everywhere; r = p/qB magnitudes confirmed.*

## 3 · spin-and-helicity.html  (review: spin-and-helicity-review.md)

> **CLOSED — d5b75dc** (confirmed genuine before fixing): all 5 open findings fixed — card-4 β_e strings → 0.99967 (node-verified, zero 0.99997 left), formal/Info β → β_e, flip readout shows 0.9997 (no longer clamps to 1.000), canvas chip shows 0.9995 at slider max, jump chips now auto-pause like sliders.

**Physics bugs (priority order):**
- PHY-P0-1 — Card 4 feedback (all 3 choices) claims β_e = 0.99997 for the 20 MeV electron; true value **0.99967** (1−β overstated ×10). String swap ×3.
- PHY-P2-1 — Formal/Info write P_R,L = (1±β)/2 with bare β, colliding with the boost slider's symbol (cards correctly use β_e).
- PHY-P2-2 — "h flips at β =" clamps to 1.000 / bar end at high p, visually placing the flip at the "unreachable" slider max.

**Non-physics bugs (priority order):**
- NP-P1-1 — Reset desyncs scene from active card (SYS-2; verified on card 4).
- NP-P2-1 — Canvas chip "boost β = 1.000" at 0.9995 (toFixed(3)).
- NP-P2-2 — Light-theme canvas keeps dark palette (SYS-4).
- NP-P2-3 — Sliders auto-pause (deliberate) but jump chips don't, and nothing resumes play.

*Physics core: 50/50 p×β combos digit-for-digit vs p′ = γ(p − βE); chirality boost-invariant at every combo.*

## 4 · wu-experiment-and-the-death-of-parity.html  (review: wu-experiment-review.md)

> **CLOSED — 8bf1ed8** (confirmed genuine before fixing): all 5 open findings fixed — mirror subtitle reworded to the drawn convention; verdict chip now sign-aware (pre-fix 5/10 30k-event runs at P=0 fired false "✗", post-fix 0/20; P=1 still fires at 55σ); __audit.at() reports live P/A/β; counts persist across cards 2→3→4 (pager-safe); formal equations no longer wrap mid-formula.

**Physics bugs (priority order):**
- PHY-P1-1 — Mirror panel's on-canvas subtitle "P: momenta flip · spin and B do not" states the **opposite** of the drawn transformation (spins/B visibly flip, tracks don't); cards + Info describe the drawn convention correctly. Reword the subtitle.
- PHY-P1-2 — Verdict chip tests only |𝒜| ≥ 2σ, never the sign: spurious "✗ Mirror disagrees with the data" reproduced at P = 0 from a +2.1σ fluctuation. Require sign consistency with A = −1.
- PHY-P2-1 — `__audit.at()` returns static reference values while the change-log claims live P/A/β reporting.

**Non-physics bugs (priority order):**
- NP-P1-1 — Reset desyncs scene from active card (SYS-2), silently wipes the committed prediction, and force-plays.
- NP-P2-1 — Answered cards 3/4 revisited show pre-reveal scenes under post-reveal feedback (SYS-5).
- NP-P2-2 — Card 2→3 advance wipes the counts card 3's prose cites.
- NP-P2-3 — Formal equations wrap mid-formula.

*Physics core: sampler/hemispheres/histogram all <1σ over 60k-event runs at 5 polarizations; theory −0.300 internally consistent (A·P·β/2, β = 0.6).*

## 5 · exploring-the-standard-model.html  (review: exploring-the-standard-model-review.md)

> **CLOSED — 4d196a5** (confirmed genuine before fixing): all 7 open findings fixed — Higgs-hat inset normalized by the true max (bump stays in the box), Yukawa unified on the −y convention in all three renderings, Z panel wording separates 1973 neutral currents from the 1983 discovery, force-coupling sentence now species-accurate, PDG-2024 masses (d/s/W/top + the four 172.7 prose spots), small-width chip captions declutter, favicon 404 gone. One NP-P2-2 sub-claim (ladder-title overlap at 700 px) did not reproduce — left as-is.

**Physics bugs (priority order):**
- PHY-P2-1 — "Matter in motion" description: "D couples them to all three forces" overreaches (leptons feel no strong force; ν no EM).
- PHY-P2-2 — Yukawa sign flips between the condensed chip (+ψ̄yψφ) and the expansion (−y_e L̄φe_R).
- PHY-P2-3 — Z tidbit conflates the 1973 neutral-current discovery with the 1983 Z discovery.
- PHY-P2-4 — Masses pinned to PDG 2022 vintage (all within uncertainties).

**Non-physics bugs (priority order):**
- NP-P1-1 — Higgs-potential inset: hat normalized by the edge value, so the central bump **overshoots the box by 48%** and slashes across the canvas.
- NP-P1-2 — Reset desyncs scene from active card (SYS-2; card 1 says electron, Reset selects Higgs).
- NP-P2-1 — Canvas ignores the light-theme toggle (SYS-4).
- NP-P2-2 — Small-canvas typography collisions (~700 px).
- NP-P2-3 — favicon 404 console noise.

*Physics core: all 17 tiles PDG-verified (worst dev 0.64% = data vintage); Lagrangian terms structurally correct.*

## 6 · scale-of-the-universe.html  (review: scale-of-the-universe-review.md)

> **0dab193** (confirmed genuine before fixing): PHY-P2-1 (card-4 ratio → "almost five orders of magnitude, 1.7 fm"), NP-P1-3 (KaTeX now renders "GeV·fm"), NP-P2-2 (clean endpoint corners both slider ends) fixed. **NP-P2-1 REFUTED** — the swallow path exists in code but is unreachable since the lecture-default boot reveals the scale before any input; did not reproduce in 3/3 fresh loads. **NP-P1-4 assess-only**: change-log cut verified; recommendation is keep the cut and amend the curriculum row — awaiting user's call.

**Physics bugs (priority order):**
- PHY-P2-1 — Card 4 "proton is 100,000× smaller" than the atom; actual 58,824× (4.77 decades).

**Non-physics bugs (priority order):**
- NP-P1-1 — `window.Shell` dead-guard (SYS-1): while paused, ◀/▶ buttons and card-2/card-4 zoom reveals silently do nothing.
- NP-P1-2 — Reset desyncs scene from active card (SYS-2; card 3 claims 100 nm, Reset shows 1.70 m).
- NP-P1-3 — ∑ Formal renders a red literal `\cdotp` inside "ħc ≈ 0.1973 GeV·fm" (KaTeX rejects "·" inside \text{}).
- NP-P1-4 — Curriculum's "strength of the fundamental forces at this scale" panel absent (deliberate cut per the sim's own change-log — curriculum conflict, needs a call).
- NP-P2-1 — First slider input after load swallowed once per session.
- NP-P2-2 — Energy-slider min corner shows "99,997 km" (endpoint rounding).

*Physics core: d × E_min = ħc = 197.327 MeV·fm exact at all 31 sampled points, both drive directions; reveals land exactly on stated values.*

## 7 · dirac-s-sea-of-electrons.html  (review: dirac-s-sea-of-electrons-review.md)

> **CLOSED — 987c28a** (confirmed genuine before fixing): all 5 open findings fixed — card-3 feedback now says net matter momentum *stays* 0 (+1/−1 split), card-3 reveal pinned to the promised +1 MeV/c, cap rejections flash a transient chip ("sea is busy/full") via the existing chip mechanic, light-theme legend pill readable, Info modal no longer claims an absent readout. Net-charge ≡ 0 and ne = nh re-verified post-fix.

**Physics bugs (priority order):**
- PHY-P2-1 — Card-3 feedback points at "net momentum (matter)", which (correctly) never changes for the symmetric pair — the pointer implies a change that never comes.

**Non-physics bugs (priority order):**
- NP-P1-1 — `window.Shell` dead-guard (SYS-1): ⚡ Excite, sea clicks, and card reveals fail to auto-resume a paused sim.
- NP-P1-2 — Reset desyncs scene from active card (SYS-2; card 4 claims kT = 0.80, Reset returns 0.25).
- NP-P2-1 — Card 3 promises "+1 MeV/c" but the reveal inherits stale sign and can fire at −1 MeV/c.
- NP-P2-2 — Silent rejection of sea clicks/⚡ at the 3-flight/14-electron caps.
- NP-P2-3 — Light theme: legend pill stays dark while its text switches to dark ink.
- NP-P2-4 — Info modal claims "eℰ = 4.0 MeV/c per s at ℰ = 1" is shown on screen; it isn't.

*Physics core: net charge ≡ 0 across the full 80-combo kT×ℰ×depth matrix; pair costs, hole map, drift all exact; thermal rate z = −0.07.*

## 8 · feynman-diagram-sandbox.html  (review: feynman-diagram-sandbox-review.md)

> **CLOSED — 290d03a** (confirmed genuine before fixing): all 5 open findings fixed — the band now plots the actual process curve with its real threshold (ττ dives at √s = 3.554; measured point sits on the labelled curve) with the massless 1/s kept only as a dashed labelled reference; s·σ chip says "massless limit"; threshold text shows the exact 3.554 (card-3 quotes updated in sync); axis-title and σ/s·σ label overlaps decluttered. All σ readouts re-verified against LO QED.

**Physics bugs (priority order):**
- PHY-P1-1 — The σ(√s) band always plots the **massless 1/s reference but titles it as the built process** — for τ⁻τ⁺ the labelled curve shows no τ threshold and the plotted point sits off it; card 5 sends students threshold-hunting on this plot.
- PHY-P2-1 — "s·σ constant" chip says 86.85 while the readout correctly shows 86.79 at √s = 1 (μ-mass factor) — label should say "massless limit".
- PHY-P2-2 — "needs √s ≥ 3.55 GeV" rounds 2m_τ = 3.5537 down (slider can't land in the gap; code-path only).

**Non-physics bugs (priority order):**
- NP-P1-1 — Reset desyncs scene from active card (SYS-2; card 3 claims μμ ✓ on screen, Reset empties the diagram).
- NP-P2-1 — Band x-axis title overlaps the "30" tick ("√s (GeV)0") at every viewport tested.
- NP-P2-2 — σ point label collides with the s·σ marker in the short band at 1100×760.

*Physics core: all 1296 slot combinations match an independent vertex oracle (16 valid / 1280 flagged, right rule order); every σ matches LO QED.*

## 9 · particle-detector-headquarters.html  (review: particle-detector-headquarters-review.md)

> **e2d003f** (confirmed genuine before fixing): PHY-P2-1 (bend clamp softened — proton bend now strictly monotone 0.2→5 GeV while containment holds), PHY-P2-3 (TOF shows "(<0.001)" instead of "+0.000"), NP-P2-1 (race strip keeps the proton reference lane for e/μ/n) fixed. **PHY-P2-2 CLOSED** (user chose the caption option): HCAL meter now shows "ECAL + HCAL = kinetic energy" under its value for hadron events only (reworded from "kinetic energy deposited" so the caption names the sum, not the HCAL value alone); deposit numbers unchanged, verified per species.

**Physics bugs (priority order):**
- PHY-P2-1 — Track bend saturates at a geometric clamp below p ≈ 1.06 GeV (0.2 GeV proton pixel-identical to 1.0 GeV); r = p/qB trend only visible 1→5 GeV.
- PHY-P2-2 — HCAL deposits show kinetic energy for mesons too (right for p/n; an idealization for π/K) — needs a human judgement call.
- PHY-P2-3 — e/μ TOF delay renders "+0.000" at high p; suggest "<0.001".

**Non-physics bugs (priority order):**
- NP-P1-1 — Reset desyncs scene from active card (SYS-2; card 1 says e⁻, Reset fires π⁺).
- NP-P1-2 — `window.Shell` dead-guard (SYS-1): slider auto-pause never engages; card reveals never auto-resume → pause + commit card 6 = frozen blank scene under feedback.
- NP-P2-1 — Race strip drops the proton lane when μ/e selected.
- NP-P2-2 — Answered-card revisits restore pre-answer scenes (SYS-5), so Lecture/Finish ends at p@1 vs p@5 from a straight run.

*Physics core: all 40 species×momentum readouts string-exact; Cherenkov thresholds and β→1 TOF bunching quantitatively verified.*

## 10 · the-wine-bottle-potential-continuous-symmetr.html  (review: the-wine-bottle-potential-review.md)

> **CLOSED — 2ed7b91** (confirmed genuine before fixing): all 6 open findings fixed — period label gains "(small oscillations)" (kick kept, card-3 prose depends on it), wall bounce now truly elastic (ΔV returned to KE: ~1%/bounce loss → ~4×10⁻⁷), card-4 prose softened, symmetry-breaking azimuth randomized per run (was fixed ≈31°; no card depends on an angle), V_min/φ tag collision decluttered, inert 'use strict' removed. v/V_min/m² invariants re-verified.

**Physics bugs (priority order):**
- PHY-P2-1 — "Radial period 2π/m = 2.22" vs measured 2.443 at the default card-3 kick (10% anharmonic); smaller kick or "(small oscillations)" label.
- PHY-P2-2 — Wall labelled "elastic bounce" loses ~2–3% energy per bounce (radial projection discards ΔV).
- PHY-P2-3 — Card-4 "|φ| holds at 1.00 / never climbs" slightly overstated (coast rides 1.000–1.065 about the V_eff minimum — correct physics, imprecise prose).
- PHY-P2-4 — Symmetry-breaking azimuth is deterministic (fixed seed → always ≈31°), undermining the "which direction was an accident" lesson.

**Non-physics bugs (priority order):**
- NP-P1-1 — Reset on card 2 force-resumes the deliberately-paused hilltop (SYS-2 variant), leaking the roll-off pre-commitment.
- NP-P2-1 — "V_min = −1.00" and "φ" tags overlap garbled whenever the field rests at the vacuum (default cards 4/5 state).
- NP-P2-2 — Inert mid-script `'use strict';`.

*Physics core: v = √(−μ²/2), V_min = −μ⁴/4, m²_radial = −4μ² (convention-consistent with the −2μ² textbook form), ring m² ≡ 0 — all exact across 63 combos.*

## 11 · virtual-particle-collider.html  (review: virtual-particle-collider-review.md)

> **CLOSED — 7039800** (confirmed genuine before fixing): all 4 open findings fixed — σ(μ⁺μ⁻) gains the β(3−β²)/2 threshold factor (now exact LO QED at 0.25/0.5/1/10 GeV; curve rises from zero at threshold; no inquiry-card numbers changed), caption boundary now exactly 2m_μ = 0.2113 GeV, m_W → PDG 80.3692 (threshold 160.74), card-1 precision harmonized. ττ verified free of the same omission.

**Physics bugs (priority order):**
- PHY-P2-1 — σ(μ⁺μ⁻) omits the β(3−β²)/2 threshold factor: σ steps discontinuously to ~1.94×10³ nb at √s = 2m_μ (27% high at 0.25 GeV; negligible above ~1 GeV).
- PHY-P2-2 — Caption "μ⁺μ⁻ closed — √s < 0.21 GeV" contradicts the readout in the 0.210–0.2113 sliver.
- PHY-P2-3 — W⁺W⁻ threshold uses m_W = 80.385 (old PDG; 160.77 vs current 160.74 GeV).

**Non-physics bugs (priority order):**
- NP-P2-1 — `pauseShell()` silent no-op (SYS-1; harmless here — live-scrub behaviour is consistent).
- NP-P2-2 — Card 1 quotes "√s = 2.00 GeV" vs headline "2.000 GeV".

*Physics core: √s / σ = 4πα²/3s / N = σLε / lost-to-boost exact at every combo; thresholds exact (μ/τ/bb̄/ZZ); curriculum row blank — LO derived from Info modal (confirm the sim isn't the "Scrapped" row).*

## 12 · navigating-the-eight-fold-way.html  (review: navigating-the-eight-fold-way-review.md)

> **CLOSED — aeb9742** (confirmed genuine before fixing): PHY-P2-1 fixed — Λ⁰ note now reads "≈1950 — first "strange" baryon (kaons, 1947, were the first strange particles)"; verified rendering without overflow on the live tile card.

**Physics bugs (priority order):**
- PHY-P2-1 — Λ⁰ note "≈1950 — first 'strange' particle": the 1947 Rochester–Butler V-particles (kaons) were first; Λ is the first strange **baryon**.

**Non-physics bugs (priority order):**
- NP-P2-1 — Revisiting an **answered** reveal card re-applies its pre-answer scene (SYS-5: pager-back re-hides Q-diagonals; Reset on answered card 4 re-hides Ω⁻) under feedback claiming they're visible.

*Physics core: fully clean — all 18 tiles at exact (I₃,S) nodes, GMN everywhere, equal-spacing ladder, Ω⁻ gap correct; Reset already re-syncs here.*

## 13 · geiger-marsden-gold-foil-experiment.html  (review: geiger-marsden-gold-foil-experiment-review.md)

> **CLOSED — bb367ae** (confirmed genuine before fixing): all 3 open findings fixed — Info modal ratio → "about 2×10⁵" (exact sin⁻⁴ ratio 2.4×10⁵), restore chip / Lecture-off now reopens paused matching the boot staging, favicon 404 silenced. Hide-Text boot state (checked, 4 notes hidden) re-verified.

**Physics bugs (priority order):**
- PHY-P2-1 — Info modal: counts "fall by about 10⁵ between 5° and 150°"; exact 1/sin⁴ ratio is 2.4×10⁵.

**Non-physics bugs (priority order):**
- NP-P1-1 — Reset desyncs scene from active card AND auto-resumes (SYS-2): card 2's "α fired reads 20.0 k … still 0" breaks; the unseeded rerun violates "still 0" ~54% of the time.
- NP-P2-1 — Lecture-off/restore chip reopens the predict card with the beam still firing (boot deliberately opens paused).
- NP-P2-2 — favicon 404 console noise.

*Physics core: fully clean — node re-implementation of the seeded MC matches digit-for-digit; 4M-α live run within 1σ; plum overlay never leaks into measured points.*

## 14 · build-a-baryon.html  (review: build-a-baryon-review.md) — **already fixed**

All four findings from its earlier review (Σb lifetimes, neutron 878 s, Reset desync,
library "+N more" overflow marker) were fixed and browser-verified in commit `65368df`.
Physics core: 58/58 exhaustive combos + full PDG cross-check clean.

---

### Totals — FINAL STATUS (2026-08-26 verify-and-fix sweep)

Every open finding was independently re-confirmed (live browser repro + explicit
calculation) before fixing; each sim committed separately (revert per hash).

| Sim | Commit | Outcome |
|---|---|---|
| virtual-cloud-chamber | e6ac154 | closed (1 confirmed+fixed; rest in 099c45b) |
| how-to-make-a-particle | 6bd64f1, 7fc2ffe | closed (6 confirmed+fixed) |
| spin-and-helicity | d5b75dc | closed (5 confirmed+fixed) |
| wu-experiment | 8bf1ed8 | closed (5 confirmed+fixed) |
| exploring-the-standard-model | 4d196a5 | closed (7 confirmed+fixed; 1 sub-claim not reproduced) |
| scale-of-the-universe | 0dab193 | 3 confirmed+fixed; **NP-P2-1 refuted**; NP-P1-4 awaiting user call |
| dirac-s-sea-of-electrons | 987c28a | closed (5 confirmed+fixed) |
| feynman-diagram-sandbox | 290d03a | closed (5 confirmed+fixed) |
| particle-detector-headquarters | e2d003f | 3 confirmed+fixed; PHY-P2-2 awaiting user call |
| the-wine-bottle-potential | 2ed7b91 | closed (6 confirmed+fixed) |
| virtual-particle-collider | 7039800 | closed (4 confirmed+fixed) |
| navigating-the-eight-fold-way | aeb9742 | closed (1 confirmed+fixed) |
| geiger-marsden-gold-foil | bb367ae | closed (3 confirmed+fixed) |
| build-a-baryon | 65368df | closed (earlier) |

**Open items remaining (1):**
1. scale NP-P1-4 — curriculum's forces-strength panel was deliberately cut per the sim's change-log; recommendation: keep the cut, amend the curriculum row.
2. ~~detector-hq PHY-P2-2~~ **CLOSED** — user chose the caption option: HCAL meter now says "ECAL + HCAL = kinetic energy" for hadron events (deposit numbers unchanged).

Console: clean in all 14 sims; the in-sim favicon 404s were silenced where they originated (standard-model, gold-foil).
