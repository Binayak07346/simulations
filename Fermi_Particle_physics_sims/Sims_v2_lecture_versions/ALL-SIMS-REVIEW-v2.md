# Particle Physics v2 — Second review scan (2026-08-26)

A read-only re-review of every v2 sim after the first-round fixes were shipped
(commits ranged `6bd64f1…781edcc`). The `review-pp-v2-sims` skill drove each
scan, one sim per parallel agent, prioritising critical physics defects. Every
finding was independently confirmed live in the browser (headless Chrome,
1440×900, `pageerror` = 0) and, where numeric, recomputed against PDG /
canonical formulas with `node -e`.

Findings are listed **in priority order (P0 → P1 → P2)** within each box.
Full repro / evidence / anchor / suggested-fix for each is in the per-sim
review file's `## Second review scan (2026-08-26)` section.

## ⚠ Systemic pattern — Lecture-default boot × SYS-2 unconditional restage

Setting every sim to boot into Lecture mode (`setLectureMode(true)` in
`Shell.init`) intersects badly with the earlier SYS-2 patch
(`onStep(Shell.step)` inside `onReset`). Two failure modes surfaced across
many sims and one systemic fix retires almost all of them:

**Failure mode B — first Reset lands on the last card's scene, not the boot
default.** After boot, `Shell.step` sits at the last card (from
`finishInquiry`). SYS-2's unconditional `onStep(Shell.step)` at the end of
`onReset` therefore re-applies the last card's spec on the FIRST ↻ Reset a
student ever clicks, instead of returning them to the boot view. Confirmed
by second-scan agents on spin-and-helicity (NP-P0), scale-of-universe (NP-P1),
cloud-chamber (was the vector for its NP-P0-3 boot mismatch too), gold-foil
(NP-P2-3), and detector-hq (NP-P2-3 side).

**Systemic fix shipped (commit `3179ad6`):** the shell reset click handler
now runs `onReset()` → `inqStep = 0` → `setLectureMode(true)` →
`setPlaying(true)`. Reset unconditionally lands on the first-load view
(Lecture ON, inquiry collapsed to the `▸ Guided inquiry` chip, all reveals
fast-forwarded via `finishInquiry`, playing). Verified across all 14 sims
headlessly: boot state ≡ post-Reset state, zero pageerrors. Findings
resolved by this patch are marked **✔ resolved by `3179ad6`** below.

**Failure mode A — boot scene wrong because a sim-local `booted` guard in
`onStep` no-ops the fast-forward during `Shell.init`.** Confirmed on
cloud-chamber only (NP-P0-3). Not resolved by `3179ad6` — this is a
Shell.init ordering bug, not a Reset bug. Post-boot Reset now renders the
correct scene (because `booted = true` by then), but the initial page load
still shows the card-1 scene under a lecture-collapsed shell. Fix belongs
to Shell.init (defer `setLectureMode(true)` past the sim-set booted flag).

---

## 1 · virtual-cloud-chamber.html

**Physics bugs (priority order):**
- **PHY-P1-3** — Card 3's "proton" reveal doesn't restage the card-3 spec (only card 2's got the PHY-P2-2 fix from 099c45b). If a student changes Ek → 200 / B → 0.5 before answering, the correct-choice feedback still hardcodes "p jumps 63 → 350 MeV/c, r 14 → 78 cm" and the card prose still promises "keeps this e⁺ arc (63 MeV, r ≈ 14 cm)", while the on-canvas readout shows p·200 MeV, r = 4.30 m (independent p(938.272, 200) = 644.44, r = 4.299 m — exact).
- **PHY-P2-3** — Same class of bug for card 4: `revealPlate` at ~L1246 doesn't restage. Mutate to p̄/150 MeV/3 T before answering → card prose still narrates "e⁺ (marked ↑) losing ≈ 40 MeV" and "B eased to 0.70 T"; on screen: p̄·150 MeV, 3.00 T, ΔE = 33.0 MeV, r 61.3 → 53.7 cm. Fix: prepend `stageFor(3);` to the plate reveal branch (mirror of the card-2 fix).

**Non-physics bugs (priority order):**
- ~~NP-P0-3 — Lecture-mode boot is broken. Curriculum-request boot into Lecture calls `finishInquiry()` which fast-forwards `onStep(1..4)` — but the sim's `onStep` is guarded by `if(!booted) return;` (L1279) and `booted` flips true only *after* `Shell.init` returns (L1379). Every fast-forward step no-ops. Then `Shell.setPlaying(false)` (L1378) overrides `finishInquiry`'s resume-play. Result on first load: Lecture ON, inquiry collapsed, canvas showing the **card-1 pre-inquiry candidate-arrows setup, paused, no track** — exactly the opposite of the Anderson plate-crossing free-exploration state that Lecture is supposed to open with. Proven by post-boot Lecture toggle → correct scene.~~ ✔ **FIXED (`07254c7`)** — moved `booted = true` above `Shell.init(...)` and dropped the obsolete trailing `Shell.setPlaying(false)`. First-load verified: `{lecture:on, inqCollapsed:true, inqStep:4, playing:true}` with the readout table showing the Anderson scene (e⁺ · 63.5 MeV/c → 20.8 MeV/c, r 30.3 → 9.9 cm, ΔE 42.7 MeV); post-Reset state identical; zero pageerrors.

*Reset-related NP-P0-2 pattern (first Reset lands on last-card scene):* ✔ resolved by `3179ad6`.

Physics core unchanged: 108/108 combos exact vs the independent relativistic integrator (both prior scans).

---

## 2 · how-to-make-a-particle.html

**Non-physics bugs (priority order):**
- ~~NP-P2-4 — Ladder "1 MeV" decade label overlaps the "e 1.022 MeV" rung label.~~ ✔ **FIXED (`fa93be2`)** — decade labels within 6 px of a rung are now suppressed (gridline still drawn).
- ~~NP-P2-5 — Sidebar stat-value cells wrap atomic quantities across a line break.~~ ✔ **FIXED (`fa93be2`)** — `.sim-tr b` now uses `white-space:nowrap`; values stay whole, labels wrap when narrow. No page overflow.

Physics core unchanged: all 8 pair thresholds reproduce 2mc² exactly, curvature sense fix and light-theme canvas all re-verified live.

---

## 3 · spin-and-helicity.html

**Non-physics bugs (priority order):**
- ~~NP-P0-2 — ↻ Reset in the default lecture-mode boot silently applies card 4's preset `p = 20 MeV, β = 0.9` instead of the `[1, 0]` baseline (100% repro over three fresh loads).~~ ✔ resolved by `3179ad6`.

Physics core unchanged: 50-combo `p × β` grid — chirality set-size = 1 for every p (boost invariance perfect); `p', E', β_rel` string-match `γ(p − βE)` to displayed digit; flip scan at p = 1 MeV crosses +1 → undefined (0.890 / 0.8905 / 0.891) → −1 (from 0.8915).

---

## 4 · wu-experiment-and-the-death-of-parity.html

**Non-physics bugs (priority order):**
- ~~NP-P2-4 — CP-mirror panel drops the `(along B) / (opposite B)` counter suffix that the real panel carries.~~ ✔ **FIXED (`f71cd84`)** — suffix now computed from the panel's own drawn B direction (`bM` sign); P mirror shows "opposite B / along B" (swapped, correct); CP mirror matches real panel.
- ~~NP-P2-5 — CP subtitle "spin unchanged" reads confusingly against the visibly-flipped spin arrows.~~ ✔ **FIXED (`f71cd84`)** — reworded to "C on top of P: I→−I, B→−B, μ→−μ (P already flipped the axial spin; C leaves it as is)".

Physics core unchanged: 25 s at P = 1 mirror+CP → N = 1641, 𝒜 = −0.319 ± 0.023 vs theory −0.300 (0.83σ); 30 s at P = 0 with predict committed walked −0.107 → +0.023 (max ≈1σ), verdict chip never crossed the ≥2σ sign-consistent gate — `wuSignal` fix holds through the corner that used to false-flag ✗.

---

## 5 · exploring-the-standard-model.html

**Physics bugs (priority order):**
- ~~PHY-P2-5 — Yukawa description implies Higgs mass for neutrinos.~~ ✔ **FIXED (`978e6a4`)** — reworded: "The Higgs field grips **charged** fermions; coupling strength sets each mass (neutrinos are the outlier — their tiny mass comes from a separate mechanism)".
- ~~PHY-P2-6 — Z boson raw catalog value 91.1876 predates PDG-2024's 91.1880.~~ ✔ **FIXED (`978e6a4`)** — catalog value updated. Displayed "91.19 GeV" unchanged.

Physics core unchanged: 17-tile mass / charge / spin / discovery-year census matches PDG-2024 to displayed precision (worst internal Δ 0.0004 %); condensed Yukawa carries `−` consistently across canvas / DOM / KaTeX; Z-history text separates 1973 neutral currents from 1983 Z discovery; hat curve contained in its inset at both 1440×900 and 350-px shell; favicon 404 gone.

---

## 6 · scale-of-the-universe.html

**Non-physics bugs (priority order):**
- ~~NP-P1-4 — SYS-2 patch over-reaches into lecture / inquiry-collapsed state: `onReset()` unconditionally called `onStep(Shell.step)` and `Shell.step` sits at 4 after `finishInquiry()`, so ↻ Reset in Lecture mode (the *first* Reset a student ever clicks) snapped to STEPS[4] = quark scale (**1 am / 197 GeV**) instead of returning to HOME (1.7 m / 116 neV).~~ ✔ resolved by `3179ad6`.
- ~~NP-P2-3 — Hide-Text tooltip claims "registry is empty" while this sim's registry is populated.~~ ✔ **FIXED (`ba57cc6`)** — tooltip now names the E_min explainer as the registered item and states the boot-checked default; source comment updated to match.

Physics core unchanged: `d · E = ħc = 0.19732697 GeV·fm` exact at 16 slider positions + both endpoint corners; canonical card readouts (116 neV / 1.97 eV / 1.97 keV / 116 MeV / 197 GeV at 1.7 m / 100 nm / 100 pm / 1.7 fm / 10⁻¹⁸ m) all match.

---

## 7 · dirac-s-sea-of-electrons.html

**Non-physics bugs (priority order):**
- ~~NP-P2-5 (flow) — Depth slider's re-activated `pauseScrub()` froze the sim on drag.~~ ✔ **FIXED (`9dfba4d`)** — dropped `pauseScrub` from the depth handler (matches kT/field pattern which never paused). Verified: `Shell.playing` stays true through drag; readout still updates live.
- **NP-P2-6** (inquiry/ux) — Excite click handler runs `S.sign *= −1; syncExcite();` unconditionally. Card-3 reveal branch (from NP-P2-1 fix) pre-sets `sign = 1` then calls `els.excite.click()` — the click spawns at +1 MeV/c correctly (cost 2.246 MeV, physics fine) but immediately toggles sign, so the ⚡ button label ends the reveal reading "−1 MeV/c" while the card the student is still on asserts "+1 MeV/c". Same handler silently flips the label on cap-rejected clicks. Fix: return a success bool from `spawnPair`, gate the toggle on success, and in the card-3 reveal branch bypass the button click via `spawnPair(0.001, true)` directly.

Physics core unchanged: net charge ≡ 0 across the full 150-combo kT × ℰ × depth matrix; thermal firing at kT = 0.8 measured 26 spawns / 60 s vs Boltzmann 25.1 (z = +0.18).

---

## 8 · feynman-diagram-sandbox.html

**Non-physics bugs (priority order):**
- **NP-P1-2** (flow) — Card 5's entire predict-before-reveal moment is defeated on the primary Lecture-off entry path. Boot triggers `finishInquiry() → onComplete()` which sets `inqDone = true`; `setLectureMode(false)` reopens the inquiry at card 1 but never clears `inqDone`, so paging to card 5 lands on μμ at √s = 3 with σ = 9.650 nb, s·σ = 86.85 nb·GeV², σ(√s) curve, ◆ anchors, s·σ ring and the pre-committed "your ÷ 4" ghost ALL revealed while the card still asks the student to predict σ. Fix: reset `inqDone = false` (and `D.pred = null`) inside `setLectureMode(false)` before `inqShow(0)`. **This same class hits every sim with post-completion `onComplete()` side effects that persist across restore-chip reopens; probe the others when addressing.**

**Physics bugs (priority order):**
- ~~PHY-P2-3 (Info-modal drift) — τ threshold said "≈ 3.55 GeV" and s·σ text lacked the "(massless limit)" qualifier.~~ ✔ **FIXED (`728ce3d`)** — Info modal now says "√s ≥ 2m_τ = 3.554 GeV" and "constant in √s (massless limit)" to match cards/chip.

Physics core unchanged: μμ σ at 1 / 3 / 10 GeV = 86.79 / 9.650 / 0.8685 nb; ττ σ at 3.554 / 3.56 / 4 / 5 / 30 all match to displayed precision.

---

## 9 · particle-detector-headquarters.html

**Non-physics bugs (priority order):**
- **NP-P2-3** — After boot `finishInquiry` fast-forwards, `Shell.step = 5` but `.inq-step.active` is left on card 1 (`finishInquiry` updates dots only, not the active-card class). Benign because the inquiry zone is hidden by `inquiry-collapsed`; but if the student then opens Guided Inquiry, they land on card 1 with card 5's answer numbers pre-populated (E = 1.371, TOF gap 12.4 ns), defusing the predict-then-reveal moment. Same class as feynman NP-P1-2. Fix: one-line sync in `finishInquiry`.
- **NP-P2-4** — Hide-Text default is a race with tab focus: the onload double-rAF that syncs `box.checked` from `lecture-mode` never fires in backgrounded tabs, so shell has NO `hide-text` class until focused; in foreground tabs it does. Registry is empty here, so no visible effect either way, but the boot state is non-deterministic. Note L413–414 code comment "the box starts unchecked — correct" is now inaccurate.

Physics core unchanged: full 40-cell species × momentum matrix (e⁻ / γ / μ⁻ / π⁺ / K⁺ / p / n / ν at p ∈ {0.2, 0.6, 1, 2.5, 5} GeV/c) string-exact vs `node -e`; Cherenkov thresholds K⁺ off→ON across 0.5→0.6 (p_thr = 0.5630), p off→ON across 1.0→1.1 (p_thr = 1.0700).

---

## 10 · the-wine-bottle-potential-continuous-symmetr.html

**Non-physics bugs (priority order):**
- **NP-P1-2** — Boot-in-Lecture leaves `S.metered = S.revealed = true`, spoiling every predict card: mode pills "radial · massive · m² = 8.00" and "ring · Goldstone · m² = 0" render on card 4 before the student answers; mass table shows `mr = 2.00, T = 4.44` on card 1. Reconfirmed live via both the Lecture-OFF flow and the restore-chip flow — this sim-local one-line clear in `applyPre` was not part of commit `2ed7b91`. Same class as feynman NP-P1-2. Fix: clear `S.metered = S.revealed = false` at the top of `applyPre` (or specifically before `applyPre(0)` in the setLectureMode(false) path).

Physics core unchanged: v = √(−μ²/2), V_min = −μ⁴/4, m²_radial = −4μ² (for μ² < 0, 2μ² for μ² ≥ 0), ring m² ≡ 0, T = 2π/m — all exact at 8 canonical μ² stops.

---

## 11 · virtual-particle-collider.html

**Physics bugs (priority order):**
- ~~PHY-P2-4 — Info-modal recommended-path text said "cross the W⁺W⁻ threshold at 170 GeV".~~ ✔ **FIXED (`728ce3d`)** — updated to 161 GeV, matching card 5's LEP 1996 wording.

Physics core unchanged: σ(μ⁺μ⁻) with β(3−β²)/2 threshold factor matches (4πα²/3s)·β(3−β²)/2·(ħc)² to 15 sig figs at 12 √s spot-checks (0.212 → 500 GeV); live card-1 default state σ = 21.7 nb, N = 1.95×10⁷ correct.

---

## 12 · navigating-the-eight-fold-way.html

**No new findings on this pass.** Prior Λ⁰ history reword and answered-card scene preservation (SYS-5) both verified live; GMN checks on cards 2 and 3, mass-ladder prediction (1533 + ≈147 → 1680, measured 1672); Q-diagonals persist after pager back-navigation to answered cards. Zero pageerrors across load, full guided-inquiry flow, back-navigation to answered cards, forward re-walk, Reset on card 4, octet + decuplet canvas sweeps, Hide-Text toggle, ∑ Formal open.

---

## 13 · geiger-marsden-gold-foil-experiment.html

**Physics bugs (priority order):**
- ~~PHY-P2-2 — Info modal wording "sag below the Rutherford curve" was ambiguous.~~ ✔ **FIXED (`728ce3d`)** — now says "sag below the dashed point-Coulomb curve", matching card 5.

**Non-physics bugs (priority order):**
- ~~NP-P2-3 — Reset on card 1 (predict-first) still resumed play because the shell handler forced `setPlaying(true)`; gmN climbed from 0 to 14 k in 1.5 s, overwriting the empty-apparatus scene the card promises.~~ ✔ resolved by `3179ad6` (Reset now lands on the completed lecture state, not card 1's paused staging — matches boot behavior).
- **NP-P2-4** — Finish after answering card 5 fires `onComplete` which forcibly reruns `applyRun(0.193, 3 M, 8)`, wiping the just-committed accelerator-beam configuration (p = 0.500, d_min = 6.8 fm, tail-sag) back to the 5-MeV baseline. Fix: guard `applyRun` in `onComplete` on whether the student has committed a non-default config.
- ~~NP-P2-5 — `st.nAbs` (α absorbed by the nucleus) tracked but not surfaced.~~ ✔ **FIXED (`728ce3d`)** — new "absorbed by nucleus" counter row in the sidebar, plus deterministic backfill from the (1−suppress) fraction in `applyRun`. Verified: 5 MeV default → 0 absorbed (d_min = 45.5 fm >> d_touch); p = 0.500 → 4 / 3 M (d_min = 6.8 fm < d_touch = 8.9 fm), matches physics.

Physics core unchanged: `__audit.at(150°) = 1.487 b/sr`; 5-stop momentum walk at Nf = 3M seed 4517 matches theory (max |z| = 1.9σ at p = 0.400, below 3σ); 15 s / 6 M-α live run gave scat z = −0.09σ, back z = −1.12σ; plum-pudding counterfactual verifiably does not leak into `gmScat` / `gmBack` (byte-identical under overlay × flat toggles); Hide-Text delta = 676 chars = exactly the 4 registered notes.

---

## 14 · build-a-baryon.html

**No new findings on this pass.** Prior fixes (Σb⁺/Σb⁻ ~7×10⁻²³ s, neutron 878 s, `onReset` re-applies active card, library "+N more" overflow) all in place and behaving live. Frontier cycle drove all 12 predicted qqq combos + wrap — every Q / I₃ / S / C / B̃ readout matches constituent sums; live GMN check prints "✓" for all 12; card-3 meson gate reveals u d̄ → π⁺ with Q = +1, I₃ = +1, colour "r + r̄ → white"; layout re-verified at 1440×900, 1280×800, 1100×700 (stage vs `#inq-cards` bounding boxes non-overlapping in all three, closing the prior To-verify item). b-sector PDG spot-check clean (Ξb⁰/⁻, Ωb⁻, Bs⁰, Bc⁺, Υ(1S) = 1.22×10⁻²⁰ s). Zero pageerrors.

---

## Totals (updated 2026-08-26 after lecture-quality fix pass)

| Box | P0 | P1 | P2 (remaining) |
|---|---|---|---|
| PHYSICS | 0 | 1 (cloud-chamber PHY-P1-3, inquiry-only) | ~~6~~ **0** — all 6 lecture-mode P2s fixed |
| NON-PHYSICS | ~~1~~ **0** — cloud-chamber NP-P0-3 fixed (`07254c7`) | 2 (feynman NP-P1-2, wine-bottle NP-P1-2 — inquiry-only) | ~~12~~ **5 remaining, all inquiry-only or benign** |

**Lecture-mode-critical findings all closed.** Every P0/P1/P2 finding
that could bite a lecturer presenting from Lecture mode has been fixed
and browser-verified:

- **NP-P0** cloud-chamber Lecture boot (`07254c7`)
- **PHY-P2** standard-model Yukawa neutrino caveat, Z mass PDG-2024 (`978e6a4`); feynman Info-modal drift (`728ce3d`); collider W⁺W⁻ threshold (`728ce3d`); gold-foil Rutherford wording (`728ce3d`)
- **NP-P2** how-to-make ladder + sidebar wrap (`fa93be2`); wu CP-mirror suffix + subtitle (`f71cd84`); scale Hide-Text tooltip (`ba57cc6`); dirac depth slider freeze (`9dfba4d`); gold-foil nAbs counter (`728ce3d`)

**Still open (parked as guided-inquiry-only or benign):**
- cloud-chamber PHY-P1-3 / PHY-P2-3 — mid-answer reveal mismatch (only fires inside inquiry)
- feynman NP-P1-2, wine-bottle NP-P1-2 — restore-chip reopen leaks reveals (never seen if lecturer stays in Lecture mode)
- detector-hq NP-P2-3, NP-P2-4 — inquiry-open card mismatch; Hide-Text focus race (empty registry, no visible effect)
- dirac-sea NP-P2-6 — excite-button label sign after card-3 reveal
- gold-foil NP-P2-4 — Finish after committed card-5 config wipes it

Console: clean in all 14 sims; the only recurring entry is the dev
server's `/favicon.ico` 404 (in-sim favicons were silenced where they
originated).
