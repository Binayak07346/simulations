# Review — dirac-s-sea-of-electrons.html ("Dirac's Sea of Electrons", curriculum: Simulation Descriptions row "Dirac's Sea of Electrons" · Lecture 7 Antimatter / Lecture 10 Antiparticles arc)
**Verdict:** Physics core is fully clean — E±(p) branches, 2E(p) pair cost, hole↔positron map, opposite drift, and the net-charge ≡ 0 e invariant all hold exactly across the entire 80-combo kT × ℰ × depth matrix, and the thermal firing rate matches its Boltzmann law to z = −0.07. Two real flow bugs (dead `window.Shell` guard kills the pause/resume plumbing; Reset desyncs the scene from the active card) and four polish items.
**Console:** clean at every stage (only a server-level `/favicon.ico` 404 — not a sim asset, not a finding).  **Combos tested:** 80 exhaustive (kT × ℰ × depth) + ~35 sampled (census walks, flow mutations, stress, statistics runs).
**Method note:** reviewed headless (1440×900, visible tab semantics — rAF live, `document.hidden:false`); deterministic runs drove `onFrame(0.05)` directly with the shell loop paused. Screenshots in the session scratchpad: `dirac-boot.png`, `dirac-card2-pair0.png`, `dirac-card4-seed5.png`, `dirac-card5-ghosts.png`, `dirac-depth15-hot.png`, `dirac-lecture.png`, `dirac-light-theme.png`, `dirac-legend-light.png`, `dirac-1150.png`.

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** Card-3 feedback ("2E(p) ≈ 2.25 MeV at 1 MeV/c — see **cost to make the last pair** and **net momentum (matter)**") points the student at the momentum readout, but the excite pair is created momentum-symmetric (e⁻ at +1 MeV/c, h⁺ at −1 MeV/c) so the readout stays "0 MeV/c" — verified live (`roP` = "0 MeV/c" after the reveal). The 0 is *correct physics*; the pointer implies a change that never comes. Anchor: card 3 `data-fb` (~L462); `updateReadouts` (~L1251). → **Fix:** reword the fb tail to "…net momentum (matter) stays 0: e⁻ carries +1 MeV/c and h⁺ carries −1 MeV/c".

## NON-PHYSICS
### P0
none
### P1
- **[NP-P1-1] [flow] [high]** `window.Shell` is `undefined` (Shell is a top-level `const`, never attached to `window`), so `pauseScrub()` and `play()` (~L1285) are permanent no-ops: (a) the documented depth-scrub pause never happens (depth drag keeps running — benign), and critically (b) ⚡ Excite, sea clicks, and every card reveal fail to auto-resume a paused sim — clicking ⚡ while paused changes nothing on screen (no draw, flight frozen, cost readout stale) even though the handlers call `play()`. Repro: Pause → ⚡ Excite → observed `Shell.playing:false`, no visible pair. Evidence: census run (`afterClick1.playing:false`). → **Fix:** in `pauseScrub`/`play` replace `window.Shell&&Shell.setPlaying` with `typeof Shell!=='undefined'&&Shell.setPlaying`, and add `draw()` after `spawnPair` in the excite handler.
- **[NP-P1-2] [flow] [high]** Reset desyncs the scene from the active inquiry card: `onReset()` → `applyOpening()` (kT 0.25, sea cleared) regardless of card, so with card 4 active the card claims "At **Temperature kT** = 0.80 MeV the sea fires pairs on its own" while the slider/scene show 0.25 MeV and nothing fires. Repro: card 4 → ↻ Reset → observed `S.ktMeV:0.25`, step still 3, card 4 active. Anchor: `onReset` ~L1364 (comment says opening state is deliberate, but it contradicts the on-card numbers). → **Fix:** when the inquiry is open, re-apply the active card's spec — `onStep(Shell.step)` — the build-a-baryon fix pattern; keep `applyOpening()` for the collapsed/completed state.
### P2
- **[NP-P2-1] [inquiry] [high]** Card 3 promises "The ⚡ Excite button makes the next pair at **p = +1 MeV/c**", but the reveal clicks the button, which uses the *persisting* `S.sign`: if the student pressed ⚡ an odd number of times earlier, the reveal fires at −1 MeV/c (and the button label then reads "+1 MeV/c" while the pair sits at −1). Repro: ⚡ once on card 1 → answer cards 2–3 → observed `revealFlightP:−1`. Cost story (2.25 MeV) unaffected. Anchor: `applyStep(2)` ~L1335 (doesn't reset `S.sign`). → **Fix:** set `S.sign=1` inside `applyStep(2)`.
- **[NP-P2-2] [ux] [med]** Silent rejection at caps: with 3 user flights in progress or 14 electrons present, sea clicks and ⚡ do nothing with no feedback (no chip/toast). Repro: fill to cap → sea click → `flightsAdded:0`, cost unchanged, nothing on screen. Anchor: `spawnPair` guards ~L889-891. → **Fix:** transient "sea is busy — wait for the flight" chip on rejected clicks.
- **[NP-P2-3] [cosmetic] [high]** Light theme: the DOM legend keeps its hard-coded dark pill `rgba(6,14,17,.72)` while its text switches to dark ink `rgb(15,23,42)` → dark-on-dark, low-contrast, and the pill clashes with the light canvas. Evidence: `dirac-legend-light.png` (measured colors). Anchor: `.legend` CSS ~L143. → **Fix:** theme-aware pill (`body.light-theme .legend{background:rgba(255,255,255,.8)}`) or `color:#e2e8f0` fixed.
- **[NP-P2-4] [ux] [low]** Info modal claims "eℰ is given as 4.0 MeV/c per second at ℰ = 1", but no on-screen element states that unit — `#fieldNote` only says "ℰ = applied electric field." (the 4.0 MeV/c·s⁻¹ exists only in a code comment, L781). → **Fix:** extend `#fieldNote` to "ℰ = applied electric field (eℰ = 4.0 MeV/c per s at ℰ = 1)".

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| Temperature kT slider | 0.05 → 0.4 → 0.75 → 1.1 → 1.5 while running + 40-event scrub | `S.ktMeV`, ktVal text, Kelvin readout (0.6→17.4×10⁹ K, factor 11.6045 verified), firing rate (0 spawns cold, 83 vs 83.6 expected hot) | OK |
| Field ℰ slider | −1 → −0.5 → 0 → +0.5 → +1 | `S.field`, "← 1.00 / off / → 1.00" label, drift arrows + opposite carrier velocities, ℰ chips on both canvases | OK |
| Axis depth slider | 2 → 5 → 8 → 11.5 → 15 | `S.depthMeV`, "±N MeV" label, axis ticks/tick-step rescale, lattice fills to depth (screenshot dirac-depth15-hot.png) | OK (intended scrub-pause is dead code → NP-P1-1a) |
| ⚡ Excite button | 2 clicks + 10-click stress | flight at ±1 MeV/c alternating, label sign flips, cost 2.25 MeV, flight cap 3 holds, no listener duplication | OK (no-resume while paused → NP-P1-1) |
| Sea canvas click | valid p=+2 MeV/c + invalid (margin) + at-cap | pair at clicked p, cost 4.1285 MeV = 2E(2) exact; invalid rejected; at-cap silent → NP-P2-2 | OK |
| Play/Pause, Speed, Reset | toggled; speed 1→2→1; Reset from card 4 | pause honored, `Shell.speed` follows, Reset scope (→ NP-P1-2) | OK / NP-P1-2 |
| Theme ☾/☀ | on→off | full config (kT 1.2, ℰ −0.5, depth 9, 6 pairs) preserved; canvas recolors; legend pill → NP-P2-3 | OK |
| ⛶ Maximize | on→off | `shell-max` class, config preserved | OK |
| ∑ Formal | open/close | readout labels switch to symbolic ("last pair cost 2E(p)", "net p of matter (γγ carry the rest)"), 5 KaTeX equations render correctly | OK |
| ⓘ Info | open/close (Esc path in code) | modal opens/closes | OK |
| 🎓 Lecture / restore chip | on→off→restore | see Inquiry-layer check | OK |
| Hide Text | check→uncheck | `hide-text` class toggles; 0 registered items; innerText delta 0 (registry empty by design — correct) | OK |
| ‹ › pager, Next/Finish | full round trips | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| kT {0.05, 0.25, 0.8, 1.5} × ℰ {−1, −0.5, 0, +0.5, +1} × depth {2, 3, 8, 15}, each with 2 seeded user pairs + 6 s sim time | exhaustive | 80 | net charge ≡ "0 e" (text) AND `ne===nh` (state); readouts finite, no NaN; last cost ≥ 1.0219 MeV; every particle |p| ≤ PMAX, x ∈ [0,1); sliders never silently reset | 80/80 pass |
| Drift-direction trend | corners | 2 (ℰ = ±1) | ⟨v(e⁻)⟩ opposite ⟨v(h⁺)⟩, e⁻ against ℰ (v = ∓0.983 c) | pass |
| Terminal drift momentum | spot | 1 (ℰ = 0.6) | p → −ℰ·G·τ: −1.64 vs −1.68 MeV/c (jig noise) | pass |
| Thermal firing statistics (kT = 0.8, population held < 5) | long-run MC | 200 s sim | 83 spawns vs λT = 83.6 ± 9.1 (λ = 1.5e^(−1.022/kT)); z = −0.07 | pass |
| Cold corner kT = 0.05 | long-run MC | 100 s sim | 0 spawns vs 2×10⁻⁷ expected | pass |
| `sampleP` momentum distribution (kT = 0.8) | MC, 4000 draws | 1 | ⟨\|p\|⟩ 0.516 vs 0.514 MeV/c theory (w ∝ e^(−2(E−m)/kT)); 0 fallback returns | pass |
| Flow mutations | sampled | ~10 | theme/maximize/speed/pause preserve kT+ℰ+depth+population; pause→change→(no)play (→ NP-P1-1); 40-event kT scrub clean | pass except NP-P1-1 |
| Stress | sampled | 10× ⚡, double-answer, 40-event scrub | flight cap 3; answer idempotent (`data-answered` guard verified); no listener duplication, no error flood | pass |
| Narrow viewport 1150×800 | spot | 1 | no horizontal overflow, stage intact | pass |
| Skipped | — | real-pointer drag gestures (synthetic `input`/`pointerdown` events used throughout); multi-hour soak | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 sea with no bottom | opening spec kT 0.10, empty sea, filled lattice to any depth | ungated | — | — | OK |
| 2 what does one pair cost? | empty sea pre-answer | ✓ (Next disabled pre-choice) | `pair0`: pair spawns at p=0, cost readout → "1.02 MeV" | "ΔE = 2E(p) ≥ 2mc² = 1.022 MeV" ✓ (2×0.511 verified) | OK (double-answer guarded) |
| 3 costlier further out? | seeded pair at 0, cost 1.02 | ✓ | `excite`: pair at ±1 MeV/c, cost → "2.25 MeV" (2√(1+0.511²) = 2.246 ✓) | wrong path styled + correct highlighted ✓; sign parity → NP-P2-1; momentum pointer → PHY-P2-1 | OK w/ P2s |
| 4 charging up the vacuum? | kT 0.80 spec, sea firing | ✓ | `seed5`: +5 pairs, thermal growth, net charge held "0 e" at 3+ pairs | "net charge holds at 0 e however hot" ✓ (80-combo matrix) | OK |
| 5 which way does the hole go? | 3 pairs, ℰ = 0 pre-answer (question not pre-answered) | ✓ | `drift`: ℰ → 0.6, wrong answer draws 3 dashed ghost h⁺ labelled "your prediction" that fall behind the real holes (dirac-card5-ghosts.png); `.inq-after` reveals | "h⁺ drifts opposite e⁻ … carries +e" ✓ (measured ±0.983 c) | OK |
| pager | 5→1→5: deterministic per-card specs identical to forward pass (kT/ℰ/depth/population fingerprints match); prev disabled at 1, pager-next at 5; answers preserved "01111" | | | | OK |
| Lecture 🎓 | ON = finishInquiry → collapsed + opening free-exploration state + playing (dirac-lecture.png); OFF & restore chip = card 1, answers kept | | | | OK |
| Hide Text | registry empty (as declared, boots unchecked); toggle changes class only, innerText delta 0, nothing unregistered disappears | | | | OK |
| ∑ Formal | E±(p) = ±√((pc)²+(mc²)²); ΔE_pair = 2√(…) ≥ 1.022 MeV; P ∝ e^(−ΔE/k_BT); hole:(+e, −p_sea, +E₊) ⇒ positron; ṗ(e⁻) = −eℰ, ṗ(h⁺) = +eℰ — all canon-correct and consistent with the sim's own dynamics (verified in code: field term −f·G on electron p, positron p = −p_sea) | | | | OK |

## Curriculum checklist
- Vacuum as an infinitely deep sea of filled negative-energy states → **met** (bottomless fade + "⋯ continues to −∞", every uncovered state filled at depth up to ±15 MeV)
- Electrons jump out as energy/temperature increases, "based on the Boltzmann factor" → **met and quantitatively honest**: spawn probability ∝ e^(−2E(p)/kT) (rate × momentum sampling verified: 83 vs 83.6 spawns; ⟨|p|⟩ 0.516 vs 0.514 MeV/c)
- Holes left behind are positively charged → **met** (hole chip "vacancy (p, −E)" + dashed partner "h⁺ : (−p, +E)"; net charge 0 e in all 80 combos)
- Apply an electric field: free electrons one way, holes the other → **met** (verified v(e⁻) = −v(h⁺), e⁻ against ℰ; drift arrows consistent)
- Adjustable param: Temperature/energy → **met** (kT 0.05–1.5 MeV with Kelvin conversion ≈ kT×11.6×10⁹ K, verified)
- Adjustable param: vertical axis height ("appreciate the depth") → **met** (Axis depth ±2 → ±15 MeV)
- Key visuals: sea, positive-energy electrons, holes → **met** (plus real-space drift strip that answers the mobility misconception)
- Learning mode "Lecture Display" → **met** (🎓 Lecture collapses the inquiry into the free-exploration display; the guided inquiry is a bonus beyond the curriculum row)
- Lecture-10 LO tie-in (interpret negative-energy solutions as +e holes / positrons) → **answerable from the screen** (card 5 + hole map chip + Anderson/Dirac dates in `.inq-after`)

## To verify (human)
- Real-pointer slider drags and sea clicks (this run used synthetic `input`/`pointerdown` events; behaviour should be identical but a 30-second manual pass would close it).
- Whether Reset-to-opening while a card is active is wanted pedagogy (the code comments claim it is) — NP-P1-2 stands either way because card 4's on-screen kT claim is contradicted.
- Light-theme legend styling choice (NP-P2-3): fixed-light text on the dark pill vs a theme-aware pill — either resolves the contrast; pick one.

## FIXES APPLIED (2026-08-26)
Each finding re-reproduced live (headless Chrome 1440×900, zero pageerrors) before any edit; fixes verified in the real restored-inquiry flow (the sim boots in Lecture mode — probes exit it via 🎓 first).

| ID | Verdict | Evidence / fix |
|---|---|---|
| NP-P1-1 | ALREADY-RESOLVED | Systemic sweep SYS-1: `window.Shell = Shell` attached at ~L763; guards in `pauseScrub`/`play` now find it. Not touched. |
| NP-P1-2 | ALREADY-RESOLVED | Systemic sweep SYS-2: `onReset()` now calls `onStep(Shell.step)` (~L1374). Not touched. |
| PHY-P2-1 | CONFIRMED + FIXED | Repro: after card-3 reveal `roP` stayed "0 MeV/c" (pair is momentum-symmetric) while the fb pointed at **net momentum (matter)** as if it would change. Fix: card-3 correct `data-fb` reworded — "…**net momentum (matter)** stays 0: e⁻ carries +1 MeV/c and h⁺ carries −1 MeV/c." Physics untouched. |
| NP-P2-1 | CONFIRMED + FIXED | Repro: ⚡ once (S.sign→−1) then card-3 reveal fired at −1 MeV/c (`flightP:−1`) against the card's "+1 MeV/c" promise. Fix: `S.sign=1` set in `applyStep(2)` (card entry: button label reads +1) AND forced in the `r==='excite'` reveal branch (covers ⚡ presses made while card 3 is open). Verified: mid-card ⚡ → sign −1 → answer → `flightP:+1`, cost 2.25 MeV. |
| NP-P2-2 | CONFIRMED + FIXED | Repro: 4th/5th ⚡ at the 3-flight cap and sea click at cap → no flight, no chip, silence; same at the 14-electron cap. Fix: `rejectNote()` helper reuses the existing transient gold cost-chip mechanic — "sea is busy — wait for the flight" (flight cap) / "sea is full — wait for annihilation" (14-cap) at the clicked p, user actions only, duplicate-stacking guarded, fades like any chip (screenshot `dirac-cap-chip.png`). No new UI panel. |
| NP-P2-3 | CONFIRMED + FIXED | Repro (light theme): `.legend` computed bg `rgba(6,14,17,.72)` with ink `rgb(15,23,42)` — dark-on-dark. Fix: one CSS line `body.light-theme .legend,html[data-theme="light"] .legend{background:rgba(255,255,255,.8)}`. Verified: light bg `rgba(255,255,255,0.8)` (screenshot `dirac-legend-light-after.png`); dark theme unchanged (`rgba(6,14,17,0.72)` / `rgb(226,232,240)`). |
| NP-P2-4 | CONFIRMED + FIXED | Repro: "4.0 MeV/c per s" appears only in the Info-modal table row + a code comment; `#fieldNote` says just "ℰ = applied electric field." Fix per task directive (Info text corrected to match the screen, no new readout): modal row now reads "…both axes carry units (MeV and MeV/c); internally the ℰ slider applies eℰ = 4.0 MeV/c per second at ℰ = 1." — no longer claims the value is shown on-screen. |

Post-fix spot-checks: full inquiry walk (cards 1→5 + Finish) then kT = 0.8 hot run — net charge readout "0 e", `ne===nh` (3/3), `roP` "0 MeV/c", pageerrors [].
