# Review — exploring-the-standard-model.html ("Exploring the Standard Model", curriculum: Simulation Descriptions row "Exploring the Standard Model" · Syllabus V2 Lecture 1 "Why Particle Physics?")
**Verdict:** Physics data layer is fully clean — all 17 tiles' mass/charge/spin/discovery-year verified against PDG (worst deviation 0.64%, a PDG-2022-vs-2024 vintage effect inside quoted uncertainties) and all five Lagrangian terms are structurally correct — but two real P1 rendering/flow bugs: the Higgs-potential inset curve overflows its box across the whole canvas (missing-max normalisation, 47.8% overshoot), and Reset desyncs the scene from the active inquiry card.
**Console:** clean (only a favicon.ico 404 — no favicon declared; see NP-P2-3).  **Combos tested:** 58 exhaustive (3 tile-colors × 17 tiles = 51, + 5 Lagrangian terms + 2 view-mode round-trips) + ~40 sampled (flow mutations, stress, inquiry paths, 3 viewports).
**Method note:** headless puppeteer (claude-in-chrome extension unavailable); tab visible (`document.hidden:false`), rAF live. Canvas assertions via a `fillText` interceptor (text census per frame) + synthetic clicks at replicated layout geometry. Screenshots in the session scratchpad: sm-01…sm-15.

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** "Matter in motion" term description overreaches: "Quarks and leptons propagate; D couples them to all three forces" — leptons feel no strong force and neutrinos feel neither strong nor EM; a student can absorb "leptons couple to gluons". Repro: Lagrangian view → click 2nd chip. Evidence: canvas text census + sm-04 family. Anchor: `TERMS[1].desc` (~L790). → **Fix:** "Quarks and leptons propagate; D couples each to the forces it feels — quarks to all three, neutrinos only to the weak force."
- **[PHY-P2-2] [high]** Yukawa sign convention flips between levels: condensed chip/mug-form reads "+ ψ̄ᵢyᵢⱼψⱼφ + h.c." while the expansion shows "− y_e L̄φe_R …". Both are valid (sign absorbable into y) but the on-screen inconsistency can puzzle a sharp student. Anchor: `TERMS[2].toks` vs `TERMS[2].segs` (~L793-798), `#fmMain`. → **Fix:** unify (use − in the condensed chip too, or drop the explicit − in the segs).
- **[PHY-P2-3] [med]** Z-boson tidbit "Neutral weak currents — caught at CERN's proton–antiproton collider" conflates the neutral-current *discovery* (Gargamelle, 1973) with the Z-boson discovery (SppS, 1983) — reads as "neutral currents caught 1983". Repro: click Z tile. Anchor: CAT Z entry (~L768). → **Fix:** "Carrier of the neutral weak current — the boson itself caught 1983 at CERN's proton–antiproton collider."
- **[PHY-P2-4] [high]** Mass values are pinned to PDG 2022: d 4.67 MeV (PDG24: 4.70, −0.64%), s 93.4 (93.5), c 1.27 (1.273), top 172.7 (direct avg now 172.57), W 80.38 (80.369 → rounds 80.37). All inside/near quoted uncertainties — explicit python comparison run for every tile, all Q/spin/years exact. → **Fix (optional):** refresh d→4.70 MeV, s→93.5 MeV, W→80.37 GeV on the next data pass.

## NON-PHYSICS
### P1
- **[NP-P1-1] [overlap] [high]** Higgs-potential inset curve escapes its box and slashes across the entire canvas: `drawHat` normalises the quartic by its **edge** value `norm=(1.35²−1)²≈0.677`, but the max on the plotted interval is the central bump at u=0 (value 1) → v(0)=1/0.677=1.478, overshooting the box top by 47.8% (python-verified). At 1440×900 the tall inset makes the bump cross the term panel, the "− V(φ)" chip and run off the canvas top. Repro: Lagrangian view → click "− V(φ)" (also fires via card 4's `data-build`). Evidence: sm-15-hat-overflow.png, sm-04. Anchor: `drawHat`, `const norm = Math.pow(1.35*1.35-1, 2)` (~L1237). → **Fix:** `const norm = 1;` (max of (u²−1)² at u=0 on [−1.35,1.35]) — or wrap the curve in `ctx.save(); rr(x,y,w,h,10); ctx.clip(); … ctx.restore();`.
- **[NP-P1-2] [flow] [high]** Reset desyncs the scene from the active inquiry card: `onReset` ends at mode=particles/family/sel=3 (Higgs) regardless of card, so with card 1 active ("Selected: the **electron**, found 1897") the panel and halo show the Higgs; card 3's mass-ladder claim and card 4's Lagrangian reveal are likewise dropped. Repro: any card active → ↻ Reset; observed live (activeCard:0, selName:"Higgs boson", colorBy:family). Evidence: sm-14-reset-desync.png. Anchor: `onReset` (~L1337). → **Fix:** end `onReset` with `if (typeof Shell!=='undefined' && Shell.totalSteps) onStep(Shell.step); else { syncDom(); draw(); }` — the pattern the build-a-baryon fix used.
### P2
- **[NP-P2-1] [ux] [high]** Canvas ignores the in-sim light-theme toggle: `themeVals()` reads CSS vars from `document.documentElement`, but ☾ toggles `light-theme` on `document.body` (vars scoped `body.light-theme`, L41) — html never sees them, so the canvas keeps the dark palette while all DOM chrome goes light. Self-consistent and readable (hence P2), but visibly unthemed. Evidence: sm-07-light-theme.png. Anchor: `themeVals` (~L849). → **Fix:** `getComputedStyle(document.body)` (host `html[data-theme=light]` path already works).
- **[NP-P2-2] [ux] [med]** Small-canvas typography collisions (~670-870px canvas): "mass — log scale" title overlaps the ν zero-zone labels; "u"/"τ" ladder labels collide with the "1 MeV"/"1 GeV" ticks; "gauge"/"scalar" column heads touch; detail-card fact text overflows the card border; at ~700px the "W, Z masses"/"symmetry breaking" chip captions overlap and clip. Evidence: sm-13-700-particles.png, sm-12-700-lagrangian.png, sm-10. → **Fix:** suppress ladder tick labels / chip captions below a width threshold; clamp fact lines to the card (`maxLines` from remaining height).
- **[NP-P2-3] [functional] [low]** Every load logs one console error: `favicon.ico 404` (no favicon declared, browser auto-request). → **Fix:** add `<link rel="icon" href="data:,">`.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| View seg Particles/Lagrangian | both, + 20× rapid toggles | sim-on class, canvas caption ("17 fundamental particles" ↔ "Standard Model Lagrangian — condensed"), colorBy+sel persist across round-trip | OK |
| Tile colors Family/Charge/Mass | all 3 × 17 tiles (51 combos) | legend set per mode (family dots / +⅔ −⅓ −1 0 ±1 / light→heavy bar), sim-on class, forces Particles view (visible, syncDom) | OK |
| Canvas tile click | all 17 tiles | panel name/mass/charge/spin/year sync + selection halo + ladder label "sym mass" | OK |
| Canvas ladder-dot click | top, electron, zero-zone (photon) + 1 invalid (empty area) | selName changes; invalid = no-op | OK |
| Canvas Lagrangian chip click | all 5 chips (cursor-probe located) | term panel title, seg labels, desc, acts-on row; hat only on term 5 | OK |
| Canvas hover | tiles + chips | cursor→pointer, hover-preview panel (chip 1 previewed while term 5 selected), mouseleave clears | OK |
| Play/Pause | pause → recolor → resume | paused label; recolor still redraws (charge legend in census while paused) | OK |
| Speed 0.25–4× | set 4×, mode round-trip | value persists | OK |
| ↻ Reset | with non-default config | restores particles/family/Higgs, replays intro, resumes play — but desyncs from card (NP-P1-2) | flow bug |
| ☾ Theme | on/off | body class + config preserved; canvas palette unchanged (NP-P2-1) | P2 |
| ⛶ Maximize | on/off | shell-max class, config preserved, refit | OK |
| ∑ Formal | open/close | section shown; KaTeX rendered in all 3 slots (ℒ_SM, Dμ, V) | OK |
| ⓘ Info | open/close | modal open class; content matches sim (47 GeV gap = 47.49 computed) | OK |
| Hide Text | check/uncheck | hide-text class toggles; 0 registered items, innerText delta 0 (registry empty — correct per manifest) | OK |
| 🎓 Lecture / restore chip | on/off | collapsed+dots done+onComplete state (family/Higgs); OFF reopens card 1 | OK |
| ‹ › pager, Next/Finish, choices | full walks | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| colorBy × all tiles | exhaustive | 3×17 = 51 | correct legend per mode; panel mass string exact per catalog; no NaN/undefined in census or panel; caption present; mode/color button states consistent; selected ladder label shows sym+mass | 51/51 pass |
| Lagrangian terms | exhaustive | 5 (+ hover preview) | title, seg labels (gluons/weak/hypercharge · motion/strong/weak/EM · leptons/down-type/up-type/antiparticles · Higgs kinetic/boson masses · wrong-sign mass/self-interaction), desc, acts-on; hat only term 5 | pass (NP-P1-1 overlap on term 5) |
| PDG data cross-check | exhaustive | 17 particles × {mass, Q, spin, year} | explicit python table vs PDG 2024; Q and spin exact ×17; years all accepted; masses ≤0.64% | pass (PHY-P2-4 vintage note) |
| Flow mutations | sampled | mode×color×sel × {pause, speed, theme, maximize, formal, hideText} | nothing resets on unrelated control change (config fingerprint identical) | pass |
| Reset scope | targeted | 2 | advertised scope vs card sync | NP-P1-2 |
| Stress | sampled | 30× color clicks + 20× mode toggles + tile click after | zero errors, selection still responsive, no listener duplication symptoms | pass |
| Viewports | sampled | 1440×900, 900×650, 700×600 (+ maximize) | layout usable, no crash | pass (NP-P2-2 collisions at small sizes) |
| Skipped | — | per-tile clicks in Lagrangian mode (tiles absent there by design); Esc-key paths (buttons verified instead) | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 Seventeen particles | particles/family/electron; "found 1897" = panel; ladder present | ungated (Next enabled) | — | — | OK |
| 2 Heavier copies? | particles/family/**muon** pre-answer | ✓ Next disabled → enabled on answer | wrong AND correct paths recolor by charge (commit-then-learn, by design); double-answer guarded | "each row keeps one charge across I–III" ✓ (verified visually, sm-02); "spin stays ½" ✓ | OK |
| 3 Meet the newest | particles/charge/**Higgs**, panel 125.2 GeV = card claim | ✓ | mass recolor + sel=top (11) ✓ | top 172.7 > H 125.2 ✓; Z 91.19 ✓; "tungsten atom" ✓ (183.84 u = 171.2 GeV, python) | OK |
| 4 One equation | particles/mass/**top** pre-answer; inq-after hidden | ✓ | mode→lagrangian, term 0 ✓; inq-after revealed ✓ | "Five terms" = TERMS.length ✓; "iψ̄D̸ψ moves all twelve fermions" ✓; "three forces through one Dμ" ✓ | OK |
| pager | 4→1→4: fingerprints (mode|color|sel) identical to forward pass per card; prev/next disabled at ends; answers preserved (0,1,1,1) | | | | OK |
| Finish / Lecture / restore | Finish: collapsed, onComplete (family/Higgs), playing, restore chip visible. Lecture ON from fresh load = same completed state, dots done; OFF/restore = card 1, answers kept | | | | OK |
| Hide Text | registry empty (manifest says so); check/uncheck: class toggles, innerText delta 0, nothing unregistered disappears | | | | OK |
| ∑ Formal | KaTeX renders ℒ_SM, Dμ = ∂μ − igsGμ − igWμ − ig′Bμ, V = −μ²φ†φ + λ(φ†φ)² — all correct, consistent with canvas segs (sign note: PHY-P2-2) | | | | OK |

## Curriculum checklist
- Two modes: SM particle table + condensed Lagrangian → **met** (View segment, both browser-verified)
- Click a tile → mass, charge, spin, year of discovery + context tidbit → **met** (17/17 verified vs PDG; every tidbit historically checked — one wording nit PHY-P2-3)
- Tiles color-coded by particle type (lepton, boson, quark, Higgs) → **met** (Family mode + legend; symmetry-magazine layout)
- Lagrangian pieces expand on hover/click into more verbose representations → **met** (5 chips → seg expansions with labels; hover previews; term-5 rendering bug NP-P1-1)
- Plain-language descriptions per portion (e.g. gluon/color, EM coupling) → **met** ("gluon self-coupling conserves color charge", "EM / hypercharge"; precision nit PHY-P2-1)
- Adjustable params: N/A per curriculum → consistent (bonus recolor/selection controls are additive)
- LO "Summarize the SM; explain 'experimentally well-tested'" → **met**: discovery years 1897–2012 on every tile, Info modal, card-4 after-text makes the claim explicit
- Inquiry Q "Which familiar, which new? Patterns in mass or charge across families?" → **answerable from screen**: card 1 (familiar electron), charge recolor shows charges repeat across I–III, mass recolor + log ladder shows masses grow — both patterns quantitative on screen
- Learning mode: Guided Inquiry → **met** (4 cards, 3 gated, predict-before-reveal, misconception chip "famous Higgs must be heaviest")

## To verify (human)
- KaTeX loads from cdn.jsdelivr.net (L7-8): offline/air-gapped hosting falls back to the Unicode plain-text formal block (correct content, verified present) — confirm the CDN dependency is acceptable for the deployment target.
- Data-vintage policy (PHY-P2-4): confirm whether the course standardises on PDG 2022 or 2024 values before touching d/s/W/top digits.
- The photon "Found 1923" (Compton) is a defensible editorial choice (vs 1905 Einstein); the tidbit states the Compton rationale on screen — flagged for awareness only.
- Card-2/3 reveals (recolor) are not re-applied when paging BACK to an answered card (onStep restores the pre-reveal spec) — this matches the deterministic-per-card pattern used across the v2 family (build-a-baryon behaves identically), so not filed as a bug.
