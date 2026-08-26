# Review — build-a-baryon.html ("Build-a-Baryon — quark combination lab", curriculum: Simulation Descriptions row "Build-A-Baryon" · Lecture 14 The Quark Model)
**Verdict:** Physics data layer and combination logic are fully clean (58/58 exhaustive combos, full PDG cross-check); one real flow bug (Reset desyncs the scene from the active inquiry card) and three polish items.

**FIXES APPLIED (browser-verified):** PHY-P2-1 → Σb⁺/Σb⁻ now "~7×10⁻²³ s"; PHY-P2-2 → neutron "878 s (free)"; NP-P1-1 → `onReset` re-applies the active card's spec via `onStep(Shell.step)` (card 3 + Reset now restores uuu, verified live); NP-P2-1 → library draws a "+N more" overflow marker when the strip is full ("+46 more" verified via fillText intercept at 50 discoveries on a small canvas). Console clean after all fixes.
**Console:** clean at every stage.  **Combos tested:** 58 exhaustive (35 baryons + 5 top-combos + 15 mesons + 3 antiquark orders) + ~40 sampled (13-click frontier cycle incl. wrap, flow mutations, stress).
**Note:** reviewed in a backgrounded tab (rAF frozen → frames driven via `onFrame`; canvas 319×300, so layout/overlap at full viewport was NOT visually re-verified this run — prior sessions verified 1440/1100; see To verify).

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** Σb⁺/Σb⁻ lifetime shown as "~10⁻²² s"; ħ/Γ with Γ ≈ 9.7/10.4 MeV gives ≈ 6.8×10⁻²³ s — the tilde claim is ~1.5× high. Repro: build uub or ddb. Evidence: BARYONS table + explicit calc (ħ = 6.582×10⁻²² MeV·s). Anchor: BARYONS uub/ddb entries (~L700). → **Fix:** display "~7×10⁻²³ s".
- **[PHY-P2-2] [high]** Free-neutron lifetime "880 s (free)" vs PDG 878.4 ± 0.5 s (0.18% high; pre-2018 world average). Anchor: BARYONS udd. → **Fix:** "878 s (free)".

## NON-PHYSICS
### P0
none
### P1
- **[NP-P1-1] [flow] [high]** Reset desyncs the scene from the active inquiry card: `onReset` replays ALL STEPS and ends at the last spec (empty slots, heavy on), so with card 1/3/4 active the card claims an on-screen combo ("On screen: u u d — the proton") while the slots are empty. Repro: any card active → ↻ Reset → scene = empty; observed live (card 1 active, resolved:null, lib reseeded to 3). Anchor: `onReset` (`for(let i=0;i<STEPS.length;i++)onStep(i)`), ~L1105. → **Fix:** after the library-reseed loop, re-apply the ACTIVE card's spec — `onStep(Shell.step)` — the pattern the dirac/collider sims use.
### P2
- **[NP-P2-1] [ux] [med]** Library truncates silently: chips render row-by-row and `break` past the strip height (libH = clamp(0.27·H, 86, 200) → ~3 rows ≈ 40 chips on short windows) with no "+N more" indicator, while the label invites completing "x / 60 explored"; hidden entries also lose click-to-reload. Repro: discover 40+ on a short window. Anchor: `drawLib` (~L1083, the `if(y>maxY)break`). → **Fix:** compact overflow marker chip ("+N more") or shrink chip font when count > capacity.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| Baryon qqq / Meson qq̄ seg | both, ×20 rapid toggles | state.mode, slot count 3↔2, seg active class; single-effect after stress | OK |
| Heavy quarks c·b·t | on→off→on | state.heavy; OFF blocks real tray click on c with toast "Turn on 'Heavy quarks'…" | OK |
| Frontier combo ▶ | 13 clicks (full cycle + wrap) + 24-click stress | each of 12 pred combos in order, wrap to dcc, heavy forced on, frontI consistent | OK |
| Clear | after builds | slots emptied, resolved null | OK |
| Canvas tray click | valid (u ×3 → uuu) + invalid (c with heavy off) | slots fill/fuse; toast + no add | OK |
| Canvas slot click | on filled slot | quark removed (3→2), resolved null | OK |
| Canvas library chip | direct + center synthetic click | combo reloaded (uud, uuu) with mode | OK (corner-click ambiguity → To verify) |
| Play/Pause, Speed, Reset, Theme, Maximize, Info, Formal | each toggled/round-tripped | pause honored during config change; speed persists; reset scope (see NP-P1-1); theme/maximize preserve full config; formal renders | OK (Reset → NP-P1-1) |
| 🎓 Lecture / restore | on→off | collapsed+active+completed; reopen card 1, answers kept "01111" | OK |
| Hide Text | check→uncheck | class toggles; 0 registered items; innerText delta 0 (registry empty — correct) | OK |
| ‹ › pager, Next | full round trips | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| All baryon keys (light+c+b sectors) | exhaustive | 35 | displayed Q = independent Σq charges; GMN live check ✓; colour "r g b → white ✓"; kind had/pred matches disc flag | 35/35 pass |
| Top-quark combos | sampled corners | 5 (uut, ust, ctt, ttt, dtb) | kind = imp ("impossible") | 5/5 pass |
| All meson keys | exhaustive | 15 | Q = q − q̄ charge; GMN ✓; colour "r + r̄ → white ✓"; kind had | 15/15 pass |
| Antiquark-order mesons | sampled | 3 (du→π⁻, su→K⁻, dc→D⁻) | conjugate symbol + correct sign of Q | 3/3 pass |
| Frontier cycle | exhaustive | 12 + wrap | pred kind each; order matches FRONTIER; pair cost 2m (ccc: 9.6 GeV = 2×4.8) | pass |
| Flow mutations | sampled | mode×heavy×pause×speed × {theme, maximize} | nothing resets on unrelated control change | pass |
| Stress | sampled | 20× mode toggles, 24× frontier, double-answer | no listener duplication; answer idempotent | pass |
| PDG data cross-check | exhaustive (discovered entries) | 40 particles | mass ≤0.1%, spin, year, lifetime ≤12% or "~" | pass except PHY-P2-1/2 |
| Skipped | — | per-quark tray clicks for all 58 combos (drove the same click pipeline via buildCombo; real clicks spot-checked ×5) | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 hadron factory | uud→p, Q +1, GMN "½+½(1)=+1 ✓" | ungated | — | — | OK |
| 2 three of a kind | empty slots | ✓ | uuu fuses (data-build) | Δ⁺⁺ 1952, colour r g b ✓ | OK (wrong path + double-answer guard verified) |
| 3 white with two | uuu held pre-reveal | ✓ | meson ud̄ → π⁺, "r + r̄ → white ✓" | anticolour ✓ | OK |
| 4 strangeness ladder | dss (Ξ⁻), S −2 | ✓ | sss → Ω⁻, S −3 | predicted '62 found '64 ✓ | OK |
| 5 not yet ≠ never | empty + heavy | ✓ | student-built ccc → pred card | 2mc² cost, top 5×10⁻²⁵ vs 10⁻²³ s ✓ | OK (.inq-after hidden→shown) |
| pager | 5→1→5 fingerprints identical per card; ends disabled correctly; answers preserved | | | | OK |

## Curriculum checklist
- Combine quarks → baryons (qqq) / quark–antiquark → mesons; Baryon vs Meson modes → **met**
- On discovery: mass, spin, lifetime, decay modes + real discovery story → **met** (card rows verified vs PDG)
- Heavy sector allowed; theoretical particles revealed with energy-needed estimate → **met** (✧ predicted-only cards with pair cost 2mc² + "to find it" line)
- Visuals: quark ingredients section / sandbox / library of discovered particles → **met** (library: NP-P2-1 at scale)
- Learning mode: Guided Inquiry → **met** (5 cards, 4 gated)
- Inquiry question "Which combinations aren't possible / haven't been discovered — and what would it take?" → **answerable**: top combos show "impossible" with lifetime-vs-hadronization numbers; pred cards show cost + experimental need; card 5 commits the distinction.

## To verify (human)
- Layout/overlap at real viewports this run (backgrounded 319×300 tab); previously verified at 1440/1100 during the build sessions — one fresh visual pass at 1280 recommended.
- Library chip corner-click: one synthetic click at a chip's exact top-left failed to register while center clicks work; likely synthetic-event artefact, but a quick manual click along chip edges would settle it.
- Σc⁺⁺/Σc⁰ "~3×10⁻²² s" accepted (PDG ħ/Γ ≈ 3.5×10⁻²² s — inside the tilde); listed here for transparency.

## Second review scan (2026-08-26)

No new findings — physics + non-physics core clean on this pass.

Evidence:
- All prior fixes verified in code and live: Σb⁺/Σb⁻ line 785–786 shows "~7×10⁻²³ s"; udd line 765 shows "878 s (free)"; `onReset` re-applies active card via `onStep(Shell.step)` (line 1154); `drawLib` overflow marker `'+'+(state.lib.length-chipsDrawn)+' more'` (line 1093–1097).
- Frontier cycle (12 unseen combos + wrap) driven live via btnFrontier — every readout Q/I3/S/C/Bb matches constituent sums, and the live GMN check `Q = I3 + ½(B+S+C+B̃+T)` prints "= <Q> ✓" for all 12 (dcc,scc,ucb,dcb,scb,ccb,ubb,dbb,sbb,cbb,bbb,ccc); frontier wraps to dcc at click 13. Screenshot: `bab-rev2-frontier.png`.
- Card 3 gated reveal (u d̄ → π⁺) live: Q=+1, I3=+1, S=0, C=0, Bb=0, colour "r + r̄ → white ✓" — matches π⁺ isospin triplet member and colour-singlet requirement.
- Layout re-verified at 1440×900, 1280×800, 1100×700 viewports: stage and inq-cards boxes non-overlapping in all three (`overlap:false`); ERRS `[]` in each; screenshots `bab-rev2-1440x900-*`, `bab-rev2-1280x800-*`, `bab-rev2-1100x700-*`.
- Meson tray in meson mode correctly shows both q and q̄ rows with all 6 flavours (drawTray rows array); top-in-either-slot returns `{kind:'imp',key:'TOPX'}` in resolveCurrent so no undefined-meson-entry crash is reachable.
- PDG cross-check spot re-run on b-sector: Ξb⁰ 5791.9 MeV / 1.5 ps ✓; Ξb⁻ 5797 MeV / 1.57 ps ✓; Ωb⁻ 6045.8 MeV / 1.64 ps ✓; Bs⁰ 5366.9 MeV / 1.52 ps ✓; Bc⁺ 6274.5 MeV / 0.51 ps ✓; Υ(1S) 9460.3 MeV / 1.22×10⁻²⁰ s ✓ (Γ=54.02 keV → τ=ħ/Γ verified).
- Console: **clean** on all three viewports (only pre-existing 404 for the shared favicon-like asset, present on every v2 sim). Zero `pageerror`.
- Combos tested this pass: 12 frontier + 3 viewport-layout runs (each fully walking cards 1→5 with correct answers) + 1 meson gate reveal. Prior 58-exhaustive still holds — data layer unchanged since prior review.

Nothing to raise. The two P2 tilde/lifetime rounds and the flow bug from the first pass all remain fixed; no regression, no new number/sign/trend/animation defect surfaced across the drive.
