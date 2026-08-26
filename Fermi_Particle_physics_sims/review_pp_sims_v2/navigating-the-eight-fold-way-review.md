# Review — navigating-the-eight-fold-way.html ("Navigating the Eightfold Way", curriculum: Simulation Descriptions row "Navigating the Eight Fold Way" · Lecture 14 The Quark Model)
**Verdict:** Physics is fully clean — all 18 tiles verified against PDG (≤0.05% mass error), every tile position satisfies the (I₃, S) axes, GMN holds on every readout and diagonal, the Ω⁻ gap/reveal story is correct at (I₃ = 0, S = −3, Q = −1) — with only one historical-caption P2 and one inquiry-revisit P2 in polish.
**Console:** clean (zero JS errors across all runs; one favicon.ico 404 on first load only — browser chrome, not a sim asset).  **Combos tested:** 31 exhaustive (18 tile-node clicks + 17 tray-slot identities + gap before/after reveal + 12/12 discrete mode×qlines×arrangement×reveal states) + ~45 sampled (drags, flow mutations, stress).
**Method note:** reviewed headless (puppeteer-core, Chrome, 1440×900, page visible so rAF live); all dynamic claims browser-evidenced; PDG/GMN numbers checked by explicit python calc.

## PHYSICS
### P0
none
### P1
none
### P2
- **[PHY-P2-1] [high]** Λ⁰ tile note reads "≈1950 — first 'strange' particle"; the first strange particles were the 1947 Rochester–Butler V-particles (kaons) — the Λ (Hopper & Biswas, 1950) is the first strange **baryon**. Repro: click Λ⁰ (octet centre-right). Evidence: Particle card note (screenshot ew-01/02 run). Anchor: `TILES` entry `P('L0',…,'≈1950 — first “strange” particle.',0.24)` (~L784). → **Fix:** "≈1950 — first strange baryon."

## NON-PHYSICS
### P0
none
### P1
none
### P2
- **[NP-P2-1] [inquiry] [high]** Revisiting an **answered** reveal card re-applies its pre-answer scene: pager back to card 2 (answered, feedback "watch the dashed constant-Q diagonals appear" still shown) re-hides the diagonals; Reset on answered card 4 re-hides the Ω⁻ while the feedback "the Ω⁻ appears — measured 1672 MeV" stays visible. First-entry re-hide is the deliberate anti-spoiler (waived); the contradiction only exists for already-answered cards. Repro: answer card 2 → Next → ‹ back; or answer card 4 → Scatter → ↻ Reset. Evidence: pagerTrip (card idx 1 qlines:false with feedback shown) + ew-07-reset-card4.png. Anchor: `stepState(i)` (~L1166) ignores `card.dataset.answered`. → **Fix:** in `stepState`, if the target card has `dataset.answered`, re-apply its `data-reveal` (qlines → `state.qlines=true`; omega → `revealOmega()`).

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| Octet / Decuplet segment | both directions, + 30-toggle stress | is-on class + aria-pressed, chart minS/i3slot changes (fp), per-multiplet tray state preserved | OK |
| Scatter tiles | dec ×3, oct ×1 | 9 (dec, Ω excluded) / 8 (oct) tiles into tray (all identified by slot-click), Ω re-hidden, hint → "drag tiles onto the chart" | OK |
| Place all | dec ×3, oct ×1 | all tiles to correct nodes, gap "?" appears when unrevealed (card → gap, hint → "click the ? gap") | OK |
| Charge diagonals (constant Q) checkbox | on↔off in both modes + 20-toggle stress | canvas fingerprint changes both ways; checked-state persists across mode switch; cards override per spec | OK |
| Canvas tile click | all 8 octet + all 10 decuplet nodes + empty-space click | Particle card name/quarks/Q/I₃/S/mass/note correct for every tile (PDG-checked); empty click deselects ("—") | OK |
| Canvas gap click | before reveal + after reveal | before: Ω⁻ revealed + gold pulse + card = Ω⁻ 1672 MeV; after: plain select (no double-reveal) | OK |
| Canvas drag | correct drop (Δ⁺⁺→(3/2,0); Σ⁰ and Λ⁰ both →(0,−1)), wrong drop (Ξ*⁰→(0,−2)), drop into tray, Ω⁻→tray | correct: placed + selectable at node; wrong: rejected, stays in tray; tray drop: stays; Ω⁻ shelved then restored by Place all | OK |
| Play/Pause | pause → click tile → qlines toggle → play | card updates and canvas redraws while paused (interactions call draw directly) | OK |
| Speed select | all 5 values + 35-scrub stress | value persists across mode change; no errors | OK |
| Reset | inquiry open (card 4, after scatter) + collapsed | open: re-syncs to active card's spec (no build-a-baryon-style desync); collapsed: completedState (Ω stays revealed) | OK (see NP-P2-1 for answered-card nuance) |
| Theme / Maximize / ⓘ Info / Esc | round trips | light-theme legible (ew-14), state preserved; shell-max class; modal opens, Esc closes | OK |
| ∑ Formal | open/close | KaTeX renders GMN + mass-ladder equations, consistent with sim values | OK |
| Hide Text | check→uncheck | hide-text class toggles; innerText delta 0 (registry empty — correct, boots unchecked) | OK |
| 🎓 Lecture / restore chip | on→off, + restore | ON: completed free-exploration (Ω revealed, all placed, qlines on); OFF/chip: card 1, answers preserved ("0111") | OK |
| ‹ › pager, Next/Finish | full round trips | see Inquiry-layer check | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| Tile-position ↔ identity | exhaustive | 18 (8 oct + 10 dec) | click at independently-computed (I₃,S) pixel node returns the right particle; card Q = I₃+(B+S)/2 = Σ quark charges; S = −(#s); masses ≤0.05% of PDG (python table in transcript) | 18/18 pass |
| Tray identities after scatter | exhaustive | 17 (9 dec + 8 oct) | every scattered tile present, clickable, card correct; Ω never in scatter set | pass |
| mode × qlines × arrangement × revealed | exhaustive over reachable states | 12 | fp changes with qlines both ways in both modes; gap iff dec+all-placed+unrevealed; hint text matches state; no NaN readouts | pass |
| Gap / reveal round trip | exhaustive | gap-click pre/post reveal + scatter→place-all→gap→click ×2 | reveal idempotent; gold pulse; Ω card 1672 MeV; re-scatter re-hides and replays | pass |
| Drag gestures | sampled | 6 (3 correct, 1 wrong-node, 1 tray-drop, 1 Ω-shelve) | correct → placed at node; wrong → red-X path, remains in tray, no tile loss; Place all restores Ω | pass |
| Flow mutations | sampled | scatter×mode-switch, qlines×mode, speed×mode, pause×interact, theme×state, maximize×state | nothing resets on unrelated control change (dec scatter survives oct round trip: 9/9 same tiles) | pass |
| Stress | sampled | 30 mode toggles + 20 qlines toggles + 35 speed scrubs + double-answer clicks | zero console errors, no listener duplication symptoms, UI state consistent after | pass |
| Skipped (conscious) | — | drag-while-paused (isLive() teleport path, code-read only); per-tile drag of all 17 tiles (same pipeline as the 3 sampled, rest placed via Place all); <1000px responsive layout | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 A map of baryons | octet hexagon, doubled centre Λ⁰/Σ⁰, colour tracks S, proton selected with Q/I₃/S/mass | ungated | — | — | OK (ew-01) |
| 2 charge down a column | proton selected (I₃ +½, S 0, Q +1); Ξ⁰ at (+½,−2) confirmed by click | ✓ Next disabled pre-answer | qlines (fires on wrong path too — commit-then-learn) | GMN ½+(1−2)/2 = 0 ✓; wrong-path rebuttals correct (Ξ⁻ one slot left; n/Σ⁰/Ξ⁰ share Q=0) | OK (wrong path + double-answer guard verified, ew-03) |
| 3 the empty corner | decuplet triangle, pulsing "?" at (0,−3), qlines re-hidden (anti-spoiler), gap card shows I₃ 0 / S −3 | ✓ | qlines | Q = 0+(1−3)/2 = −1 ✓; "Q=+1 diagonal off-chart by S=−3" ✓ (I₃ would be +2); misconception choice "I₃=0 means neutral" rebutted only when chosen ✓ | OK (ew-04) |
| 4 predict its mass | qlines on, Ω hidden, ladder tiles clickable: Δ⁰ 1232 → Σ*⁰ 1384 → Ξ*⁰ 1532 | ✓ | omega (re-hides on entry — deliberate anti-spoiler, waived) | 1533+≈147→1680 (1962) vs measured 1672 ✓; Ω⁻ card: sss, Q −1, 1672 MeV, Brookhaven 1964 ✓; .inq-after appears | OK (ew-05/06) |
| pager | 4→1→4; cards 1–2 fingerprint-identical on revisit; card 3/4 scene = card spec (answered-card nuance → NP-P2-1); answers preserved 0111 | | | | OK |
| Finish / Lecture / restore | Finish → collapsed completedState (Ω revealed); Lecture ON ≡ manual completion state; restore → card 1, answers kept | | | | OK |
| Hide Text | registry empty as declared; class toggles; zero unregistered content disappears | | | | OK |
| ∑ Formal | KaTeX GMN + mass ladder render; values match tiles (1232/1385/1533/1680/1672) | | | | OK |

## Curriculum checklist
- "Sort particles by their symmetries" — tiles + scatter + drag-to-chart with accept/reject → **met**
- "Notice gaps that point to predicted particles; when students find a gap, the predicted (and later discovered) particle is revealed" — gap "?" appears on completing the decuplet; click reveals Ω⁻ with prediction/discovery story → **met**
- "Tiles for particles, space to sort them" → **met** (tray shelf + chart)
- "Additional information about prediction/discovery in a side panel when you click on the tile" → **met** (Particle card: Q, I₃, S, mass + discovery note, all PDG-verified)
- Learning mode: Guided Inquiry → **met** (4 cards, 3 gated, predict-before-reveal)
- Inquiry Qs "What patterns and symmetries help you sort? Do you notice any gaps? What might a gap represent?" → **answerable from screen**: S-coloured rows + constant-Q diagonals; pulsing "?" corner; gap card "Empty point — the pattern says a particle belongs here" + Ω⁻ reveal
- Lecture 14 "Patterns in charge and strangeness?" → **answerable**: Q constant on dashed diagonals (labelled −1…+2), S constant on rows, GMN in card 2/3 feedback and ∑ Formal
- L14 objective "Determine the allowed quark content of a baryon from its charge and strangeness" → **supported**: every tile shows quark content beside Q/I₃/S (deeper practice lives in build-a-baryon, per curriculum split)

## To verify (human)
- Σ⁰/Λ⁰ are drawn at I₃ ±0.24 horizontal offsets ("doubled centre" convention, explained in card 1 and Info) — standard textbook practice, accepted; confirm the lecturer is happy the offset never reads as I₃ ≠ 0 (the card readout always says I₃ = 0).
- Dragging a **placed** tile to a wrong/empty node sends it to the tray (not back to its node) — consistent staging-shelf behaviour, verified non-destructive; flagging only in case a "snap back to origin" feel is preferred.
- KaTeX loads from CDN (katex@0.16.9); offline the ∑ Formal panel falls back to correct plain-text equations (graceful, verified in code path) — confirm CDN use is acceptable for deployment.
- "Charge diagonals (constant Q)" checkbox label hints card 2's answer — waived by design (genuine control), per review brief.
