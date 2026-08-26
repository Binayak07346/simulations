# Review — virtual-cloud-chamber.html ("Virtual Cloud Chamber", curriculum: Simulation Descriptions row "Virtual Cloud Chamber" · Syllabus V2 Lecture 10 Antiparticles)

**Verdict:** Physics layer is fully clean — all 108 particle×B×Eₖ×plate readout combos reproduce an independent relativistic r = p/(|q|B) + dE/dx integration exactly, curvature senses and the Anderson staging (30.3 → 11.1 cm, ΔE 40.2 MeV) are correct — but two NON-PHYSICS P0s: an intermittent negative-dt crash in `draw()` that permanently kills the animation loop (triggered by answering card 4 in normal sequence, hit in 4 of 6 sessions), and `window.Shell` being undefined, which silently disables Fire-while-paused (blank chamber at the boot state), per-card Reset staging, and pause-on-scrub.
**Console:** clean except (a) an environment `/favicon.ico` 404 (not a sim asset) and (b) the NP-P0-1 pageerror when it triggers.  **Combos tested:** 108 exhaustive (6 particles × {0.2, 0.7, 1.5, 3.0} T × {10, 63, 200} MeV plate-out, + 6 × {0.7, 1.5} T × {10, 63, 200} MeV plate-in) — 108/108 readouts match the independent model — plus ~60 sampled (full card walk ×3 paths, pager round trip, 15 mystery cycles, stress scrubs, flow-mutation set, theme/maximize/1100 px).

## PHYSICS

### P0
none

### P1
none

### P2
- **[PHY-P2-1] [high]** Plate path length (and hence ΔE) is quantized to the integration step DS = 1.5 mm: `pathPb` adds a full DS whenever a step's endpoint is inside the lead, so the card-4 crossing reads "40.2 MeV over 6.0 mm" while the continuous model at the actual 18.6° incidence gives 6.33 mm → 42.4 MeV (~5% low), despite the info modal advertising "the path actually travelled inside it (oblique crossings cost more than 6 mm)". Displayed values are self-consistent (energy deducted over exactly the path counted) and match Anderson's historical ≈40 MeV. Repro: card 4/5 staging (e⁺ 63 MeV, 0.70 T, plate). Anchor: `computeTrack` in-plate substep loop (~L843, `pathPb+=dl` with membership tested once per DS). → **Fix:** count only the in-plate fraction of entry/exit steps (interpolate the y = ±3 mm crossings), or shrink DS inside the plate.
- **[PHY-P2-2] [med]** Card 2's feedback hardcodes "r drops 14.1 → 7.1 cm" (and prose "doubles B to 3.00 T") while the card's B/R spans are live: if the student changes particle/Eₖ/B while on card 2 *before* answering, the reveal still forces B = 3.00 T but the quoted 14.1 → 7.1 no longer matches the readout (e.g. p̄ 63 MeV shows 77.7 → 38.9 cm). Repro: on card 2 pick p̄, then answer. Anchor: card-2 `data-fb` strings (~L457) vs `syncInqText` (~L1277). → **Fix:** compute the two radii into the feedback string at answer time (fmtR(r₁) at current B and at 3 T), or restage the card-2 spec on answer before the reveal.

## NON-PHYSICS

### P0
- **[NP-P0-1] [functional/crash] [high]** Answering card 4 (revealPlate) in the normal sequence intermittently (4/6 sessions) throws `TypeError: Cannot read properties of undefined (reading 'x')` in `draw()` and **permanently kills the rAF loop** (the `requestAnimationFrame(loop)` re-arm never runs after the throw) — everything stops animating for the rest of the session. Root cause captured via CDP pause-on-exception: the first frame after `Shell.setPlaying(true)` can deliver a rAF timestamp *earlier* than the `performance.now()` stored by `setPlaying` → dt < 0 → `st.s = 0 + 0.34·β·dt` goes negative (observed st.s = −7.5e−4) → `fi < 0` → `ii = −1` → `t.pts[−1].x`. Repro: fresh load → answer cards 1–4 correct in order (crash at the card-4 answer). Evidence: pageerror stack at draw L1039 / onFrame L1157 / loop L562; CDP locals ii=−1, fi=−0.4987, st.s=−0.000748, mode='track'. Anchors: L561 (`let dt=(now-last)/1000; if(dt>0.1)dt=0.1;` — no lower clamp), L1145 (st.s advance), L1038 (head lookup). → **Fix:** clamp `if(dt<0)dt=0;` in Shell.loop (and/or `st.s=Math.max(0,…)` at L1145, plus `ii=Math.max(0,ii)` at L1037) — any one prevents the crash; the dt clamp fixes the class.
- **[NP-P0-2] [dead-control/flow] [high]** `window.Shell` is **undefined** (`const Shell` creates a global lexical binding, not a window property — verified `typeof window.Shell === 'undefined'` in-page), so every `if(window.Shell&&…)` guard silently no-ops. Three advertised behaviours are dead: (i) **▶ Fire at the boot state shows a blank chamber** — the canvas says "▶ Play (or Fire) to expose the photograph", but Fire while paused clears the candidate arrows and prompt and never exposes (expo stays 0; the intended `Shell.setPlaying(true)` at L1258 never runs; screenshots vcc-30 vs vcc-31); (ii) **Reset always restages card 1's spec instead of the active card's** (`onReset` guard at L1230 fails → `stageFor(0)`, then the shell's `setPlaying(true)` auto-refires) — observed: Reset on card 2 hides the Track readout that card 2's spec shows; Reset in free exploration jumps from the card-5 plate scene to an unfired e⁺/1.5 T/plate-out scene contradicting nothing on screen but destroying the staged state; (iii) sliders no longer pause the exposure (L1240/L1245), so the documented pause-on-scrub prediction flow is inert. Anchors: L1190, L1202, L1230, L1240, L1245, L1258, L1265. → **Fix:** one line — add `window.Shell=Shell;` after the Shell IIFE (or change the guards to plain `Shell`); every guarded call then behaves as written, including per-card Reset staging.

### P1
none beyond the two P0 root causes (their symptoms above are the P1-class flow bugs).

### P2
- **[NP-P2-1] [ux] [high]** After revealing a "? unknown" particle, the sidebar "Kinetic energy" output reverts to the *slider's* value, not the revealed particle's Eₖ (observed: reveal "μ⁻" whose Eₖ was 115 MeV while the output shows "200 MeV"; only the canvas status chip shows "μ⁻ · 115 MeV"). A student reading the sidebar pair (revealed species + Eₖ output) computes the wrong p vs the displayed 193.7 MeV/c. Anchor: `syncEkOut` (~L926) shows `st.Ek` for phase 2; `mysteryClick` (~L917). → **Fix:** in phase 2 show the mystery's Eₖ (e.g. "115 MeV (revealed)") until the mystery is cancelled.
- **[NP-P2-2] [overlap] [med]** Ghost-tag chips can overlap each other and the r-label chips when tracks share a region (observed: "p 63 MeV · 3.00 T" chip drawn across "p 63 MeV · 0.70 T", and a ghost tag across "r 29.2 cm"). Readable but untidy. Anchor: ghost-tag loop (~L1121, fixed 0.55-fraction anchor point). → **Fix:** stagger tag anchor fractions per ghost index or skip a tag whose chip rect intersects the previous one.
- **[NP-P2-3] [functional] [med]** A track that crosses the plate once and then spirals back in and stops reports only "absorbed in Pb / ΔE = all of it" — the first crossing's exit p/r ("1 of N") info is discarded because `t.stopped` is checked before `t.crossed` (observed: e⁺ 63 MeV, 1.5 T, plate — visible tight arc above the plate, readout shows no r-after). Not wrong physics, but the visible upper arc has no number. Anchor: `updateReadouts` (~L935). → **Fix:** when `stopped && cross.length`, still show p/r after the first crossing with a "then absorbed" suffix.
- **[NP-P2-4] [dead-code] [low]** The "trapped — r too small" status (L1115, `endR==='orbit'`) is unreachable: tracks enter at the bottom edge, so any plate-free orbit dips below the floor within one loop and ends as 'exit' (verified e⁻ 10 MeV @ 3 T draws ¾ loop and exits; status shows "no plate · direction unknown"); with the plate, stopping dominates. Harmless defensive branch. → **Fix (optional):** drop it or nudge the entry point up so tight orbits can genuinely trap.
- **[NP-P2-5] [dev-hygiene] [low]** `window.__audit` (L778) is a stale template stub — hardcoded electron mass and B = 1 T, disconnected from sim state — misleading for any automated audit. → **Fix:** expose real state (e.g. current track's p, r₁, B) or delete.

## Control census
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| e⁻ / e⁺ chips | both, + 20× rapid toggles | active class, roPart sym+q, r readout, track colour/side | OK |
| μ⁻ / μ⁺ / p / p̄ chips | each (via More) | roPart, p₁/r₁ per species mass/charge, curvature side | OK |
| ? unknown chip | 15 full cycles (fire → reveal → new ?) | chip text '? unknown→reveal→new ?', Eₖ output 'hidden', roPart '? (unknown)', revealed p₁ consistent with species+Eₖ (3/3 spot-checked exactly) | OK (NP-P2-1 on revealed Eₖ display) |
| ▶ Fire | paused + playing, 15× stress | playing: refires/animates; paused: **blank chamber** | **NP-P0-2(i)** |
| ＋ More particles & energy | open/close/reopen | sim-hidden class, button text swap, aria-expanded | OK |
| Kinetic energy slider (10–200) | 10/63/200 ×36 combos + 15-step scrub | Eₖ output, p₁/r₁ readouts (all match model), track redraw | OK (no pause-on-scrub — NP-P0-2(iii)) |
| Field B slider (0.2–3.0) | 0.2/0.7/1.5/3.0 ×72 combos + 40-step scrub | B chip + output, r₁ ∝ 1/B exact, arc tightens | OK (same note) |
| Lead plate (6 mm) checkbox | on/off across 36 combos | plate drawn at 6 mm, mode photo↔track, direction chevron gated on plate, ΔE/p₂/r₂ appear | OK |
| Clear old tracks | after 10-ghost pileup | ghosts removed, live track kept | OK |
| ‹ › pager | 5→1→5 round trip | per-card state fingerprints identical both directions | OK |
| Next → / Finish | all 5 cards | disabled pre-answer on every gated card, unlocks on any choice, Finish collapses to free exploration | OK |
| Choice buttons | correct + wrong + double-click | correct/wrong/dim styling, single feedback (double-answer guarded), reveal fires once | OK |
| 🎓 Lecture / restore chip | on/off/on | collapse + card-5 free state; reopen at card 1, answers preserved ('11111') | OK |
| Hide Text | check/uncheck | innerText delta 0 (registry empty — matches manifest), class toggles | OK |
| ☾ theme | dark↔light ×3 | light surface repaints (corner px 248,250,252), chamber stays photograph-dark (deliberate) | OK (one stale frame seen once — transient) |
| ⛶ Maximize | on/off | canvas 1410×808, config preserved | OK |
| ∑ Formal | open | 3 KaTeX equations render, all correct | OK |
| Speed select | 0.25×–4× | Shell.speed 1→4 confirmed in-page; persists across config changes | OK |
| ↻ Reset | on card 2 + free exploration | **always restages card 1's spec** | **NP-P0-2(ii)** |
| ⏸/▶ Play, ⓘ Info | toggles, open/Esc-close | play state label, modal open/close | OK |

## Combination coverage manifest
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| particle × B × Eₖ, plate out | exhaustive (6×4×3) | 72 | p₁ = √(Eₖ²+2Eₖm), r₁ = p/(0.29979·B), sign of q in roPart, formats | 72/72 exact vs independent python |
| particle × B × Eₖ, plate in | exhaustive (6×2×3) | 36 | ΔE + path from independent step-integration, p₂/r₂, "(1 of N)" suffixes, stopped→"absorbed in Pb" | 36/36 exact |
| Card walk (3 independent orderings incl. wrong-answer + pager-first-card-4) | sampled | 3 full walks | scene ≍ card claims, gates, reveals, feedback numbers | pass except NP-P0-1 (sequential path) |
| Pager round trip 5→1→5 | exhaustive | 8 steps | B/plate/readout fingerprints identical to forward pass | pass |
| Mystery cycles | sampled | 15 | hidden state (Eₖ 'hidden', grey track), revealed p₁ ↔ species+Eₖ consistency, slider cancels mystery cleanly | pass (NP-P2-1) |
| Flow mutations | sampled | mu⁻/150 MeV/2.5 T/plate × {theme, maximize ×2, speed, pause/play} | nothing resets on unrelated control change | pass |
| Stress | sampled | 40-step B scrub + 15× Fire + 20× chip toggles | no error flood, no listener duplication, end-state readout exact (8.6 cm @ 2.45 T) | pass |
| Edge cases | sampled | trapped-geometry (e⁻ 10 MeV/3 T), p stopped in Pb, e⁺ stopped @1.5 T plate, min corner (10 MeV/0.2 T), max corner (p 200 MeV/3 T plate) | graceful stop messaging, r readouts exact, multi-cross handling | pass (NP-P2-3/4 notes) |
| Skipped consciously | — | real-pointer (trusted synthetic events for slider/chip driving; buttons clicked via puppeteer); >2 simultaneous plate crossings ("1 of N" seen for N≥2 only in code+model, N=1,2 in browser) | — | noted |

## Inquiry-layer check
| card | scene≍claim | gate | reveal | feedback physics | verdict |
|---|---|---|---|---|---|
| 1 One track, two stories | unfired chamber, paused, both candidate arrows (A e⁺↑ below, B e⁻↓ above), no direction cues | ✓ | mirror guess drawn dashed grey "✗", e⁻↓ slides onto the e⁺ photo (identical curve — physically exact: same geometry traversed in reverse) | correct; wrong path also verified (dashed miss + unlock) | OK |
| 2 Turn the field up | B/R live spans read 1.50 T / 14.1 cm, exposed arc | ✓ | B→3.00 T, r 14.1→7.1 cm on screen + r-chips | r = p/(\|q\|B) exact | OK (PHY-P2-2 corner) |
| 3 Heavy versus light | e⁺ arc ghost kept + tagged; proton fired same 63 MeV | ✓ | p chip 349.6 MeV/c, r 77.7 cm, denser droplets (1/β² ionisation — nice) | "63 → 350 MeV/c, 14 → 78 cm" exact | OK |
| 4 The lead plate breaks the tie | plate in at 0.70 T, e⁺ waiting at entry, paused | ✓ | crossing animates; r 30.3 cm below / 11.1 cm above, ΔE 40.2 MeV | correct (see PHY-P2-1 precision) | **NP-P0-1 fires here** |
| 5 Anderson's photograph | full crossing held, tighter arc above, entry ↑ chevron | ✓ | — (payoff card) | positron discovery narrative correct; `.inq-after` hands off to "? unknown" | OK |
| Lecture / restore / Finish | Finish = card-5 free state + More open + readouts on; restore reopens card 1 with answers kept | | | | OK |

## Curriculum checklist
- Variable magnetic field → **met** (0.2–3.0 T, live everywhere)
- Metal plate to slow particles and give direction of approach → **met** (6 mm Pb; direction cues deliberately appear only with the plate in — strong pedagogy)
- Choose which particles (charge and mass) → **met** (e±, μ±, p, p̄)
- Kinetic energy of incoming particle → **met** (10–200 MeV)
- Mode to interpret/match tracks from momentum and deflection → **met** ("? unknown" fire-read-reveal loop)
- Ghost tracks remain to compare trajectories → **met** (persist with species/E/B tags, cap 6, Clear button)
- Side panel with controls; chamber where tracks show → **met**
- LO "Interpret the negative energy solutions… holes, or antiparticles backward in time" → **partially met**: card 5's afterword names Dirac's negative-energy solutions → antiparticle; the hole/backward-in-time interpretations are (per the sim's own design note) delegated to the Dirac-sea sim. Pedagogy P2 note, not a defect of this sim's single claim.
- Inquiry Q "How can you tell between a particle and an antiparticle?" → **answerable** (cards 1, 4, 5: direction first, then curl sign)
- Inquiry Q "How does B influence the trajectories?" → **answerable** (card 2 + slider, r ∝ 1/B on screen)
- Inquiry Q "Heavier vs lighter particle?" → **answerable** (card 3, p vs e⁺ at same Eₖ)

## To verify (human)
- After fixing NP-P0-1/2, re-run the sequential card walk twice to confirm the crash is gone and Reset restages the *active* card (the code at L1230 already intends this).
- One real-mouse pass over the sliders and chips (all slider driving here used synthetic input events; buttons were real puppeteer clicks).
- Theme toggle showed one stale dark frame in a single session (run-1 vcc-13) with the very next capture correct — believed transient; worth one manual toggle glance.
- The ✎ Refine dev link correctly stays hidden off dev.superstem.ai (code-verified only).

*Reviewed read-only; evidence screenshots vcc-01…vcc-35 in the session scratchpad; 108-combo cross-check script and independent integrator in the transcript.*
