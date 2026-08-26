# Review — virtual-particle-collider.html ("Virtual e⁺e⁻ Collider", curriculum: Simulation Descriptions row "Virtual Particle Collider" — row is EMPTY)
**Verdict:** Physics engine is exact — √s, σ = 4πα²/3s, N = σ·∫L dt·ε, lost-to-boost, and all six channel thresholds verified numerically at every tested combo; the full inquiry/lecture/pager/reset machinery works; findings are three physics-polish items and two cosmetic items, nothing above P2.
**Console:** clean (single benign `/favicon.ico` 404 from the bare http.server; zero page errors through census, 14-combo matrix, 40-event scrub stress, and full inquiry walk).
**Combos tested:** 14 (E1,E2) beam combos + 5 ∫L dt × ε corners with numeric asserts (exhaustive over the named-value grid) + ~60 sampled states (control walks, flow mutations, inquiry paths, stress).

**CURRICULUM NOTE (required disclosure):** the "Virtual Particle Collider" row in `curriculum-extract.md` (Simulation Descriptions sheet) is empty, with an adjacent "Scrapped" row. Per the skill's fallback rule the learning objective was **derived from the sim's own Info modal** (which itself states "Spec inferred from engine capabilities — curriculum row was blank; flagged for curriculum review"): *√s is the creation budget (pair channel opens at √s ≥ 2m); above threshold σ(e⁺e⁻→μ⁺μ⁻) = 4πα²/3s falls as 1/s; N = σ·∫L dt·ε; unequal beams waste energy on CM motion (E₁+E₂ − √s).* Nearest curriculum anchors consistent with this: Lecture 24 brainstorm "Collider explorer: adjust energy… discover what collision particles/masses become accessible" and Lecture 11 "Use four-momentum to construct an invariant mass quantity". The sim serves both. Curriculum team should confirm this sim is not the "Scrapped" row.

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** σ(μ⁺μ⁻) omits the threshold phase-space factor β(3−β²)/2: at √s = 2m_μ the displayed σ jumps discontinuously from "0 · closed" to ~1.94×10³ nb (true σ → 0 at threshold; ~27% overestimate at √s = 0.25 GeV, <0.01% by √s = 2 GeV). Repro: link beams, walk E₁ across 0.105–0.13 GeV; the chart curve also starts at a finite dot at threshold. Evidence: vpc-06/18 screenshots + explicit calc (β factor 0.725 at √s = 0.25). Anchor: `sigNb()` (~L774) and the QED-curve start dot (~L1136). → **Fix:** multiply `sigNb` by `b*(3-b*b)/2` with `b=Math.sqrt(Math.max(0,1-4*MMU*MMU/(rs*rs)))` (curve then rises from 0 at threshold), or keep the massless form and say "high-energy limit" in the ∑ Formal label.
- **[PHY-P2-2] [high]** Below-threshold canvas caption "μ⁺μ⁻ closed — √s < 0.21 GeV" contradicts the readout in the sliver 0.210 ≤ √s < 0.2113: screen simultaneously shows "√s = 0.211 GeV" and "closed — √s < 0.21". Repro: E₁ = E₂ = 0.1055 GeV. Evidence: vpc-18-closed-caption-0.211.png. Anchor: the `'μ⁺μ⁻ closed — √s < 0.21 GeV'` literal (~L1046). → **Fix:** "√s < 2m_μ = 0.211 GeV".
- **[PHY-P2-3] [med]** W⁺W⁻ threshold constant 160.77 GeV encodes m_W = 80.385 (pre-2022 PDG); current PDG m_W = 80.3692 ± 0.0133 → 2m_W = 160.74 GeV (0.02% high; invisible at the chart's log scale and at the readout's precision). Anchor: `THR` W⁺W⁻ entry (L761). → **Fix:** 160.74. (For transparency: μ⁺μ⁻ 0.21132 = 2m_μ ✓, τ⁺τ⁻ 3.55372 = 2m_τ ✓, bb̄ 10.558 = 2m_B± — the physically correct open-bottom threshold, previously corrected ✓, ZZ 182.37 = 2m_Z ✓, tt̄ 345.4 = 2m_t ✓ and deliberately unreachable at max √s = 210 GeV.)

## NON-PHYSICS
### P0
none
### P1
none
### P2
- **[NP-P2-1] [functional] [high]** `pauseShell()` is a silent no-op: it guards on `window.Shell`, but the shell is a top-level `const` (lexical binding, never attached to `window`), so `typeof window.Shell === 'undefined'` and the documented "sliders pause + live redraw" behaviour never happens — the animation keeps running while scrubbing. Verified live: `Shell.playing === true` after slider input. No user harm (live scrub is arguably better; state stays consistent every frame), but the code intent is dead. Anchor: `pauseShell` (~L821) + comment "(sliders pause + live redraw)" (~L823). → **Fix:** either call `Shell.setPlaying(false)` directly (the binding is in scope) or delete `pauseShell` and its call sites + comment to match actual behaviour.
- **[NP-P2-2] [cosmetic] [high]** Card 1 quotes the headline as "√s = 2.00 GeV" but the canvas headline renders "√s = 2.000 GeV" (`fmtRS` gives 3 decimals below 9.995). Same class of mismatch as any card-claim/readout drift, at trivial severity. Evidence: vpc-01/10 screenshots. Anchor: card 1 prose (L431) vs `fmtRS` (L798). → **Fix:** card text "√s = 2.000 GeV" (readout precision is the sim's own convention).

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| e⁻ energy E₁ (log slider, 0.1–105 GeV) | min → −0.25 → default → 25 → max, while running | S.E1, E₁ readout, √s (0.200→210.0), σ (closed→1.97×10⁻³ nb), events; linked E₂ tracked | OK |
| e⁺ energy E₂ | min/default/max with link OFF | S.E2, √s, lost-to-boost (98.6→0.00 GeV) | OK |
| link beams checkbox | on→off→on | independent E₂ when off; E₂ snaps to E₁ on relink; state survives reveals (card 4 unchecks it) | OK |
| ∫L dt (log slider) | 0.01/0.1/1/10/100 fb⁻¹ | readout + events scale exactly ×10 per decade (7816 → 7.82×10⁷) | OK |
| efficiency ε | 0/0.25/0.5/0.9/1 | readout + events ∝ ε; ε = 0 → 0 events, no NaN | OK |
| 40-event rapid scrub on E₁ | 11-value cycle ×40 | final state exact, no error flood, no listener duplication | OK |
| Speed select | 1×→4×→2× | Shell.speed follows | OK |
| Play/Pause, Reset | toggled; reset in 3 scopes | pause honored; paused slider change redraws (√s 22.36 correct); reset scope: active card's spec when inquiry open, defaults when collapsed (deliberate — see Inquiry check) | OK |
| Theme ☾/☀ | round trip | light palette renders (vpc-03), full config (25+1, link off, L=10, ε=0.5) persists | OK |
| ⛶ Maximize | on/off | canvas refits (vpc-04), config persists | OK |
| ∑ Formal | open/close | all 4 equations KaTeX-rendered and correct (vpc-05) | OK |
| ⓘ Info | open/close | modal opens/closes; content matches sim behaviour | OK |
| Hide Text | check→uncheck | `hide-text` class toggles; innerText delta 0 — registry empty, matches manifest "(empty)" | OK |
| 🎓 Lecture / restore chip / ‹ › pager / Next | full round trips | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| (E1,E2) beam grid incl. corners: (0.1,0.1),(0.1,105),(105,0.1),(1,1),(1.8,1.8),(5,5),(25,1),(1,25),(10,10),(50,2),(0.1055,0.1055),(85,85),(92,92),(105,105) | exhaustive over named grid | 14 | displayed √s = √((E₁+E₂)²−(p₁−p₂)²) to 4 sig figs vs python (all 14 ✓, incl. 25+1 → 10.00 and 2√(E₁E₂) head-on form: 105+0.1 → 6.481 = 2√10.5); s·σ ≡ 86.85 nb·GeV² (σ ratio 10→20 GeV exactly 4.0); waste = E₁+E₂−√s ≥ 0 (16.0 at 25+1, 32.0 at 50+2, 98.6 at 105+0.1); swap symmetry 25+1 ≡ 1+25; channel open flags exactly at √s ≥ 2m (0.211 closed, 0.2113 wall; τ open at 3.600; bb̄ open at 20; W⁺W⁻ open at 170; ZZ open at 184; tt̄ never); no NaN; console clean | pass |
| ∫L dt × ε corners at 5+5 | exhaustive corners | 5 | N = σ·L·ε·10⁶ exact at (0.01,0),(0.01,1),(100,0),(100,1),(100,0.5) | pass |
| Flow mutations | sampled | ~10 | non-default config (25+1, link off, L=10, ε≠0.9) survives theme, maximize, formal, speed, eff-change, pause→change→play; nothing silently resets | pass |
| Stress | sampled | 40-event scrub + double-answer + repeated toggles | no listener duplication, no error flood | pass |
| Inquiry paths | sampled (1 wrong path + 3 correct + guards) | 5 cards | reveals apply exact REVEAL specs; card-claimed numbers match readouts (see below) | pass |
| Skipped consciously | — | intermediate slider positions between grid points (continuous space; formula verified exact at grid, engine is closed-form so interpolation risk nil); multi-tab/mobile layouts | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 creation budget | E=1+1, √s headline 2.000, μ⁺μ⁻ chip solid, others dashed (vpc-01/10) | ungated, Next enabled | — | — | OK (NP-P2-2 wording nit) |
| 2 τ⁺τ⁻ cost | scene holds 1+1 pre-answer | ✓ Next disabled pre-answer (also on fresh load + after pager-back) | tau → 1.8+1.8, √s 3.600, τ chip lights | √s ≥ 2m_τ = 3.554 ✓; lone-τ violates charge/lepton number ✓; double-click guarded | OK |
| 3 energy vs rate | 5+5, events readout 7.82×10⁵ exactly as claimed | ✓ | double → 10+10: σ 0.217 nb, events 1.95×10⁵ (×4 fewer) — wrong path "≈4× more" styled red, correct green, rebuttal σ=4πα²/3s shown (vpc-12) | ✓ all numbers verified | OK |
| 4 do energies add | back to 5+5 | ✓ | asym → 25+1, link unchecked, √s 10.00, lost-to-boost 16.0 in both the readout and the canvas center label (vpc-13/08) | √(26²−24²)=10 ✓; p₁−p₂=24 ✓ | OK |
| 5 count events | 5+5, 7.82×10⁵/fb⁻¹ | ✓ | lum10 → L=10 fb⁻¹, events 7.82×10⁶ | N∝L ✓; ε≤1 "+11%" = 1/0.9 ✓; `.inq-after` reveals post-answer: LEP W⁺W⁻ 161 GeV/1996 ✓ (2m_W=160.8; first LEP2 161-GeV run July 1996), "reach tt̄?" answerable: no (max √s 210 < 345.4) ✓ | OK |
| pager | full 5→1→5 round trip: per-card scenes identical to forward pass; prev disabled at 1, pager-next at 5; answers preserved "01111"; gates re-enforced on unanswered cards after back-navigation | | | | OK |
| Reset | with card N active replays card N's PRE-reveal spec (verified cards 1 and 5); with inquiry collapsed → defaults (5+5, L=1, ε=0.9). Deliberate design (documented in onReset); note it also unwinds an applied reveal (card 5 answered + Reset → L back to 1 while feedback text still cites 7.82×10⁶) — accepted, listed under To verify | | | | OK (by design) |
| Lecture / restore | Lecture ON from card 1: fast-forwards (final spec 5+5), collapses, plays; OFF and restore chip both reopen at card 1 with answers preserved | | | | OK |
| Hide Text | empty registry — toggling hides nothing, matches manifest comment; boots unchecked (inquiry-first boot, correct per the embedded note) | | | | OK |
| ∑ Formal | √s invariant, σ = 4πα²/3s, dσ/dΩ = α²/4s(1+cos²θ), N = σ∫Ldt·ε — all correct and consistent with engine (vpc-05); `window.__audit` cross-checked against `sigNb` ✓ | | | | OK |

## Physics validation highlights (browser + explicit calc)
- √s formula exact (relativistic, with m_e in p(E)) at all 14 combos; head-on symmetric √s = 2E exactly (waste 0.00).
- σ(√s=10) = 0.869 nb on screen vs 4πα²ħ²c²/3s = 0.8685 nb ✓; s·σ constant 86.85 nb·GeV² across 0.2–210 GeV ✓ (1/s trend).
- N = σ·∫L dt·ε consistent at every combo incl. ε = 0 and L extremes; card-claimed 7.82×10⁵ / 1.95×10⁵ / 7.82×10⁶ all reproduced.
- Animation truth: pinned-phase check at 25+1 GeV — both muons drawn boosted forward (+z), lab p_z = 19.80/4.20 GeV; analytic check Σp_z = 24.000 = p₁−p₂ and ΣE = 26.000 = E₁+E₂ exactly (vpc-17); symmetric case back-to-back ✓; below threshold the beams pass through as labelled e⁻/e⁺ — no fake muons ✓; bunch size grows with log E ✓.
- Chips open exactly at √s ≥ 2m for all six channels; newest-open chip highlighted; chip rows collision-resolved, no overlap at 1440×900 (dark, light, maximized).

## Curriculum checklist (derived LO — see CURRICULUM NOTE)
- √s as creation budget; thresholds unlock visually at √s ≥ 2m → **met** (six channels, exact gating)
- σ ∝ 1/s above threshold; "more energy ≠ more events" misconception → **met** (card 3 + chart + readouts; PHY-P2-1 at the extreme threshold edge only)
- N = σ·∫L dt·ε; luminosity vs energy roles → **met** (card 5 + Run-plan panel)
- Asymmetric beams: invariant √s vs "lost to boost" → **met** (card 4, link toggle, canvas + table readouts)
- Lecture-24 brainstorm "adjust energy… discover what masses become accessible" → **met** in e⁺e⁻ form
- Guided Inquiry mode → **met** (5 cards, 4 gated, predict-before-reveal, wrong-path rebuttals)

## To verify (human)
- Confirm with the curriculum team that "Virtual Particle Collider" is a live deliverable (empty row sits next to a "Scrapped" row) and back-fill its row; the Info modal already flags this.
- Reset while a card's reveal is applied rolls the scene back to the card's PRE-reveal spec while the feedback text (with its post-reveal numbers) stays visible — accepted deliberate design; confirm it reads acceptably in class use.
- W crossing is taught only via the card-5 `.inq-after` note (demoted from a full card — deliberate); confirm that emphasis is intended.
- KaTeX comes from the jsdelivr CDN; offline the ∑ Formal panel falls back to plain-text equivalents (present and correct) — acceptable, but worth knowing for air-gapped lecture halls.
- σ readout label is σ(μ⁺μ⁻) only; W⁺W⁻/ZZ/bb̄ chips are pure thresholds with no rate claim — correct scoping, no action.

## FIXES APPLIED (2026-08-26)
| ID | Verdict | Evidence / action |
|---|---|---|
| PHY-P2-1 | **CONFIRMED + FIXED** | Reproduced live pre-fix: readout matched the massless 4πα²/3s exactly — 1.39×10³ nb at √s = 0.250 (exact LO: 1.01×10³, β-factor 0.725), discontinuous 1.94×10³ nb at √s = 0.2114. Fix: `sigNb()` now multiplies by β(3−β²)/2 with β = √(1−4m_μ²/s); `window.__audit.totalCrossSectionNb`, the ∑ Formal QED-rate equation (KaTeX + plain fallback), and the Info-modal prose updated to the same exact form. τ⁺τ⁻ has NO analogous omission — `sigNb` is μμ-only (readout labelled σ(μ⁺μ⁻); τ/b/W/Z/t chips are pure thresholds with no rate claim), so no τ change. Post-fix readouts match exact calc: 1.01e+3 nb @ 0.250, 343 nb @ 0.500, 86.8 nb @ 1.000, 0.868 nb @ 10.00 (unchanged); curve now rises from zero at threshold (dot sits on the axis floor at 2m_μ); N = σLε tracks (9.07×10⁸ @ 0.250, L=1, ε=0.9); engine σ ≡ in-page independent exact calc to machine precision at the actual slider state (87.5435535… nb at √s = 0.211412). Card-quoted numbers (7.82×10⁵ / 0.217 nb / 1.95×10⁵ / 7.82×10⁶, all at √s ≥ 10 where the β correction is <10⁻⁷) re-verified unchanged — no card text needed updating. Zero pageerrors. |
| PHY-P2-2 | **CONFIRMED + FIXED** | Reproduced: at E₁ = E₂ = 0.1055 the headline shows "√s = 0.211 GeV" while the canvas caption claimed "closed — √s < 0.21 GeV". Caption literal changed to "μ⁺μ⁻ closed — √s < 2m_μ = 0.2113 GeV" (0.2113 chosen over 0.211 so the 3-decimal headline can never display a value ≥ the stated boundary while closed). Screenshot vpc-fix-closed-0211.png. |
| PHY-P2-3 | **CONFIRMED + FIXED** | `THR` W⁺W⁻ entry was 160.77 = 2×80.385 (pre-2022 PDG). Updated to 160.74 (2×80.3692, current PDG m_W = 80.3692 ± 0.0133), matching the sim's display precision. Card-5 LEP note "√s = 161 GeV in 1996" remains historically correct and above the new wall. |
| NP-P2-2 | **CONFIRMED + FIXED** | Card 1 said "√s = 2.00 GeV"; `fmtRS(2)` renders "2.000" (toFixed(3) below 9.995). Card text harmonized to "√s = 2.000 GeV"; verified live that no stale "2.00 GeV" string remains. |
| NP-P2-1 | **ALREADY-RESOLVED** | Addressed by the systemic sweep (SYS-1): `window.Shell = Shell;` is now exposed at the shell's end (with comment "expose for the sim's window.Shell guards"), so `pauseShell()` is live. Left alone per instruction. |

## Second review scan (2026-08-26)
**Verdict:** All five prior fixes (PHY-P2-1/2/3, NP-P2-1/2, SYS-1) live-verified end-to-end; one new physics-polish item (Info-modal walkthrough prose calls the W⁺W⁻ "threshold at 170 GeV" when 2m_W = 160.74 GeV — card-5 elsewhere gets it right); nothing above P2.
**Console:** clean (zero page errors across fresh reload, `sigNb` numeric census over 12 √s values, Formal-panel + Info-modal audit, restore-chip probe).
**Combos re-tested:** 12 √s spot-checks (0.212, 0.213, 0.22, 0.25, 0.30, 0.50, 1, 2, 3.55372, 10, 91.2, 200) — engine `sigNb` ≡ manual (4πα²/3s)·β(3−β²)/2·(ħc)² at ALL 12 points to machine precision; live readout at card-1 defaults (E₁=E₂=1) matches (σ = 21.7 nb, N = 1.95×10⁷ at L=1 fb⁻¹, ε=0.9); fresh-reload boot state (Lecture-mode ON, inquiry collapsed, restore chip "▸ Guided inquiry" visible, inqStep=4, E₁=E₂=5, √s=10.00 GeV) verified against `setLectureMode(true)` at line 719.

### PHYSICS
#### P0
none
#### P1
none
#### P2
- **[PHY-P2-4] [med]** Info-modal "Recommended lecture path" prose (line 342) reads "…cross the W⁺W⁻ threshold at 170 GeV…". The W⁺W⁻ pair-production threshold is 2m_W = 160.74 GeV (encoded exactly in `THR` line 763 and cited correctly by card 5's `.inq-after`: "LEP crossed the W⁺W⁻ wall (√s = 161 GeV) in 1996"). Read charitably, "170 GeV" is a walkthrough target √s comfortably above the wall — but the phrasing "the W⁺W⁻ threshold at 170 GeV" grammatically implies the threshold itself sits at 170 GeV, contradicting card 5 and the constant. Repro: Info → read the third arrow of the path. Anchor: line 342. → **Fix:** reword to "cross the W⁺W⁻ threshold (2m_W ≈ 160.7 GeV) — try both beams at 85 GeV" (or similar), matching card-5's phrasing.

### NON-PHYSICS
#### P0
none
#### P1
none
#### P2
none

### Re-verification of prior FIXES APPLIED
| ID | Verdict this scan | Evidence |
|---|---|---|
| PHY-P2-1 (β threshold factor) | **HOLDS** | `sigNb` (line 776–780) contains `b*(3-b*b)/2` with `b=sqrt(1-4·MMU²/rs²)`; live `window.sigNb(rs)` ≡ manual formula at 12 √s pts (0.212→232 nb; 0.213→358; 0.22→729; 0.25→1008; 0.30→855; 0.50→343; 1→86.79; 2→21.71; 3.55372→6.88; 10→0.869; 91.2→0.0104; 200→2.17×10⁻³) — matches ref calc to 15 sig figs. Rises from 0 at 2m_μ, peaks ~0.25 GeV, then 1/s. Formal panel (line 504) and Info-modal prose (line 338) show the corrected formula with β = √(1−4m_μ²/s). `window.__audit.at(rs).totalCrossSectionNb` (line 749) also includes β factor. |
| PHY-P2-2 (closed caption) | **HOLDS** | Line 1052 literal is "μ⁺μ⁻ closed — √s < 2m_μ = 0.2113 GeV". No stale "< 0.21" or "< 0.211" caption anywhere. Consistent with `fmtRS` 3-decimal display: while chip is closed, headline can only show ≤ 0.211 which is < 0.2113. |
| PHY-P2-3 (m_W → PDG) | **HOLDS** | `THR` line 763 `{ sym: 'W⁺W⁻', m: 160.74 }` (= 2 × 80.3692, current PDG). All other threshold constants also PDG-current: μμ 2·MMU (MMU 0.1056583755), ττ 3.55372, bb̄ 10.558 (B±), ZZ 182.37 (2·91.185), tt̄ 345.4 (2·172.7). Card 5's "LEP … √s = 161 GeV in 1996" remains historically correct and above the new 160.74 wall. |
| NP-P2-1 (window.Shell) | **HOLDS** | `typeof window.Shell === 'function-ish object'` — `Shell.step`, `Shell.totalSteps`, `Shell.setPlaying` all reachable from the page. `pauseShell()` guard now succeeds. |
| NP-P2-2 (card-1 precision) | **HOLDS** | Card 1 prose (line 431) contains "**√s = 2.000 GeV**"; live headline at card-1 default (E=1+1) reads exactly "2.000 GeV" via `fmtRS(2)`. Grep for stale "√s = 2.00" in file returns none. |

### Coverage manifest (second scan)
| combo set | strategy | count | result |
|---|---|---|---|
| σ numeric spot-check (0.212 → 500 GeV log-sampled + at every 6 THR values) | exhaustive over named grid | 12 | engine ≡ ref calc to 15 sig figs |
| Live readouts at card-1 defaults (E₁=E₂=1, L=1, ε=0.9) | one-shot verification | 1 | √s=2.000, σ=21.7 nb, N=1.95×10⁷, waste=0.00 — exact |
| Boot mode after location.reload() | one-shot | 1 | Lecture ON, inqCollapsed, inqStep=4/5, E₁=E₂=5, √s=10.00 — matches line 719 intent |
| Slider ranges (E₁ log 0.1–105 GeV; ∫L dt log 0.01–100 fb⁻¹; ε 0–1) | endpoints | 4 | E_max=105.003 (log2.0212), L_max=100, no NaN, all readouts finite |
| Restore chip DOM audit | one-shot | 1 | `#aside-inquiry-restore` = BUTTON with text "▸ Guided inquiry", rect (1211,80) 283×32.5, visible when Lecture ON |
| Info-modal + Formal-panel prose sweep for physics-content correctness | grep + read | full | all σ / √s / N / dσ/dΩ expressions match canon; **one prose ambiguity found (PHY-P2-4)** |

### To verify (human, unchanged from first scan)
- Curriculum-team confirmation that VPC is a live deliverable (empty row next to "Scrapped"; Info modal flags this).
- Reset-during-reveal rolls scene back to card pre-reveal spec while feedback text remains — deliberate; confirm class-use readability.
- KaTeX CDN fallback in the Formal panel — plain-text fallback present and correct.
- Note (new observation, not a defect): `window.__audit.at(rs).differentialCrossSectionNbPerSteradian` (line 750) still returns α²/(4s)·(ħc)² without the (1+cos²θ) angular factor. Dev-only (no user path), student-facing Formal panel line 505 shows the correct dσ/dΩ = α²/(4s)·(1+cos²θ). Optional harmonize.

### FIX-PROMPT ready
```
fix PHY-P2-4  →  reword Info-modal line 342 walkthrough
current: "cross the W⁺W⁻ threshold at 170 GeV"
new:     "cross the W⁺W⁻ threshold (2m_W ≈ 160.7 GeV; try both beams at 85 GeV)"
(mirrors card-5's phrasing; unambiguously separates the threshold value from the walk-target √s)
```

