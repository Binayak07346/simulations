# Review — virtual-cloud-chamber.html ("Virtual Cloud Chamber", curriculum: Simulation Descriptions row "Virtual Cloud Chamber" · Syllabus V2 Lecture 10 Antiparticles)

**FIXES APPLIED (2026-08-26, headless-verified):** NP-P0-1/2 were resolved by the earlier
systemic sweep (negative-dt shell clamp + `window.Shell=Shell`); this pass added the
reviewer's belt-and-braces guards (`ii ≥ 0`, `st.s ≥ 0`) — cards 1–4 sequential walk now
crash-free with the rAF loop alive after card 4 (dE 40.2 / r₂ 11.1 as claimed).
PHY-P2-2 → the card-2 reveal restages the card's spec (e⁺/63 MeV) before forcing B = 3 T,
so the quoted 14.1 → 7.1 cm always matches (verified after sabotaging to p̄ mid-card).
NP-P2-1 → revealed mysteries show "N MeV (revealed)" (verified: "130 MeV (revealed)").
NP-P2-2 → ghost tags nudge below one another (rLab's proven pattern). NP-P2-3 → a
crossed-then-absorbed track keeps its first crossing's numbers ("13.3 MeV/c then
absorbed", "63 MeV (all of it, over 1 crossing)" verified at 1.1 T/63 MeV). NP-P2-4 →
unreachable "trapped" status branch removed. NP-P2-5 → `window.__audit.state()` now
reports live sim state (B, Eₖ, particle, plate, p₁/r₁/p₂/r₂/dE/stopped). NOT fixed by
request scope: PHY-P2-1 (plate-path DS quantization — engine model, internally
consistent, not inquiry-flow). Zero page errors across all verification runs.

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

## FIXES APPLIED (2026-08-26, PHY-P2-1)

**PHY-P2-1 — CONFIRMED and FIXED** (continuous in-plate path length).

*Confirmation (independent, pre-fix):* the `computeTrack` in-plate loop charged a full DS = 1.5 mm of lead for every step whose **endpoint** fell inside |y| < 3 mm, so `pathPb` was quantized to multiples of 1.5 mm and the entry/exit fractions were miscounted. Node re-implementation from the sim's own constants (CC 0.299792458, DEDX_E 6.7 GeV/m, PLATE_T 6 mm, DS 1.5 mm, sub = 6, entry y = −HALF_H+0.0006, th = π/2) reproduced the shipped card-4 numbers exactly — path 6.000 mm, ΔE 40.20 MeV, r₂ 11.11 cm — while the same physics integrated at DS = 2 µm gives path 6.361 mm, ΔE 42.62 MeV, r₂ 9.95 cm. Geometry cross-check: incidence 18.57° from the plate normal → straight chord 6.330 mm (the review's 6.33 mm; the exact curved-path value is 6.36 mm since r shrinks inside the lead). Live browser repro (headless Chrome, restore chip → cards 1–4 answered in order) showed the shipped readout "40.2 MeV over 6.0 mm", p₂ 23.3 MeV/c, r₂ 11.1 cm. Review's numbers verified genuine (its 42.4 MeV chord estimate slightly undershoots the exact 42.6).

*Fix (minimal, at the anchor):* each DS step is now charged only for its in-plate **fraction**, obtained by linear interpolation of the step's y-span against the y = ±PLATE_T/2 faces (`frac = clamp((min(hiY,hp)−max(loY,−hp))/(hiY−loY))`); the energy sub-loop uses `dl = frac·DS/6` and `pathPb += dl`, and the crossing record still fires on the endpoint-membership transition — after the exit fraction has been charged, so `cross[0].{p,r,Ek,path}` include it. The dE/dx model itself (DEDX_E, 1/β² collision term) is untouched, as are all fixes from commit 099c45b.

*Old → new (card-4 scene, e⁺ 63 MeV, 0.70 T, plate):* ΔE 40.2 → **42.7 MeV**, path 6.0 → **6.4 mm**, p₂ 23.3 → **20.8 MeV/c**, r₂ 11.1 → **9.9 cm** (fine-step reference 42.62 MeV / 6.361 mm / 9.95 cm — now ≤0.1% off instead of ~5%). All displayed values stay internally consistent automatically: roDE/roP2/roR2, the on-canvas r chips, and `window.__audit` all read the same `computeTrack` output (verified on screen: r chips 30.3 cm below / 9.9 cm above). Card-4 prose ("losing ≈ 40 MeV") and the formal caption ("⟨dE/dx⟩·t_Pb ≈ 40 MeV") are approximate/normal-incidence statements and were left as written; no other hardcoded number derives from the path.

*Regression sweep (fixed DS = 1.5 mm vs DS = 2 µm reference, node):* e⁺ 200/3.0 T 45.02 vs 44.94 MeV; μ⁻ 115/0.7 T 10.08 vs 10.09 MeV; p 200/3.0 T 25.17 vs 25.22 MeV; stopped cases (p 63/1.5 T, p̄ 63/0.7 T, e⁺ 63/1.5 T cross-then-stop) all still stop with "all of it" messaging. Browser smoke post-fix: card walk 1→5 + Finish, plus p/μ⁻/e⁺ plate scenes — readouts match the model exactly, **zero pageerrors**. Screenshots card4-post.png / finish-post.png in the session scratchpad.

## Second review scan (2026-08-26)

**Verdict:** NP-P0-1 (draw() crash) and NP-P0-2 (`window.Shell` undefined) are truly fixed — sequential card 1→5 walk completes with zero pageerrors and `typeof window.Shell === 'object'`; the plate-path fix stands (dE = 42.7 MeV / path 6.4 mm / r₂ 9.9 cm at the card-4 spec, exact vs the DS = 2 µm reference). But this pass surfaces two new bugs — one NON-PHYSICS P0 that breaks the "Lecture-mode by default" curriculum request, and one PHYSICS P1 that is the same class as PHY-P2-2 but for **cards 3 and 4** (only card 2 got restage-before-reveal).
**Console:** clean (only the environment `/favicon.ico` 404).  **Combos tested (this pass):** 4 sequential card walks + 2 mid-answer mutation scenarios (Ek=200/B=0.5 on card 3; p̄/Ek=150/B=3 on card 4) + 3 Lecture-mode boot/toggle sequences, all headless-Chrome (viewport 1440×900).

### PHYSICS

#### P0
none

#### P1
- **[PHY-P1-3] [flow/inquiry] [high]** Card 3's "proton" reveal does **not** restage the card-3 spec before firing (only card 2's `bfield` reveal does, via the PHY-P2-2 fix). If the student mutates Ek or B on card 3 *before* answering, the correct-answer feedback still hardcodes "**p jumps 63 → 350 MeV/c, so r grows 14 → 78 cm**" and the card prose still promises "keeps this e⁺ arc (63 MeV, r ≈ 14 cm) as a ghost and fires a proton with the **same 63 MeV**" — while the on-screen readout shows the proton fired at the student's current Ek/B. Repro (fresh session → restore chip → walk to card 3 → set Ek slider to 200, B slider to 0.5, then click the correct choice): on-screen Track readout reads **p · q = +1 e / p = 644.4 MeV/c / r = 4.30 m** (independent: p(938.272, 200) = 644.44, r = 644.44/(0.29979·500) = 4.299 m — exact); ghost tag "e⁺ 200 MeV · 0.50 T" is what the student thinks was "the e⁺ 63 MeV arc kept as a ghost". Evidence: `cc-rev2-fresh-c3-mut.png` (fb tile shows 63→350 MeV/c, 14→78 cm; live proton chip reads "p · 200 MeV"; r-chip reads "r 4.30 m"; ghost tags "e⁺ 200 MeV · 1.50 T" and "e⁺ 200 MeV · 0.50 T"). Anchor: `data-reveal="proton"` handler L1352 (no `stageFor(2)` first); card-3 prose + `data-fb` L462–465. → **Fix:** mirror the card-2 pattern — prepend `stageFor(2);` to the `proton` branch at L1352, so Ek reverts to 63 and B to 1.5 before the proton is fired (fb+prose numbers then always match); OR compute the fb string live at answer time from the actual pre-fire e⁺ readout and the post-fire proton readout.

#### P2
- **[PHY-P2-3] [flow/inquiry] [med]** Same class for card 4: `revealPlate()` (L1246) only slides the plate in — it does not restage the card-4 spec (e⁺, 63 MeV, 0.70 T). Repro (fresh session → walk to card 4 → switch to p̄, Ek slider to 150, B slider to 3.0, then click the correct choice): the card prose still reads **"the e⁺ (marked ↑) is about to cross it, losing ≈ 40 MeV inside"** and card 4 promises **"B eased to 0.70 T"**, while the sim now shows p̄ · 150 MeV at 3.00 T with ΔE = 33.0 MeV over 6.1 mm (p1 551.3, r1 61.3 cm, p2 483.0, r2 53.7 cm — all independently exact). The physics *relation* (r shrinks after plate) still holds, so this is P2 not P1 — but the "e⁺" and "≈40 MeV" hardcodes now openly contradict the readout, and card 5 then narrates "**Anderson's** signature — one track, a plate crossing, the tighter arc above" while the on-canvas track is a p̄, not an e⁺. Evidence: `cc-rev2-fresh-c4-mut.png` (status chip "lead plate in", readout "p̄ · q = −1 e / 33.0 MeV over 6.1 mm / r 61.3 cm → 53.7 cm"). Anchor: L1246 (`revealPlate`), card-4 prose L468, card-5 prose L474. → **Fix:** prepend `stageFor(3);` to the `plate` branch at L1353 (mirrors the card-2 fix); OR replace the fixed prose "e⁺ … losing ≈ 40 MeV" with `data-live` spans so the sentence always tracks the sim.

### NON-PHYSICS

#### P0
- **[NP-P0-3] [flow/functional] [high]** **Lecture-mode boot leaves the sim in the card-1 pre-inquiry setup, not the post-completion free-exploration state.** Commit 96b098b requested every sim boot into Lecture mode; the shell wiring runs `setLectureMode(true)` → `finishInquiry()` which fast-forwards by calling `onStep(k)` for k = 1..N-1. But the sim guards `onStep` with `if(!booted)return;` (L1279), and `booted` is set to `true` only *after* `Shell.init(...)` returns (L1379). So during the fast-forward every `onStep(k)` is a **no-op**, `stageFor(1..4)` never runs, and the scene stays exactly where the pre-init `stageFor(0)` (L1373) left it — card 1's spec: B = 1.5 T, no plate, no track, `st.pKey = 'e+'`, `Ek = 63`, the candidate-story arrows "A · e⁺ ↑" and "B · e⁻ ↓" and the "▶ Play (or Fire) to expose the photograph" prompt on the canvas. Worse: right after Shell.init the sim runs `Shell.setPlaying(false)` (L1378), which overrides `finishInquiry`'s `setPlaying(true)`. So on first load the student sees Lecture mode ON, the inquiry collapsed, "▸ Guided inquiry" restore chip present — and an **unfired card-1 setup**, paused. That is the exact opposite of the Anderson-plate-crossing "curriculum request" (`cc-rev2-lec-toggle.png` shows what Lecture mode is *supposed* to show — B = 0.70 T, plate in, e⁺ 63 MeV crossed the lead, r 30.3 → 9.9 cm, ΔE 42.7 MeV, playing = true). Repro: hard-refresh at `?v=rev2` → `Shell.step === 4`, `lecture === true`, `Shell.playing === false`, `__audit.state()` = `{B:1.5, Ek:63, particle:'e+', plate:false, p1:null, r1:null, …}`, canvas shows candidate arrows + "Play to expose" chip (`cc-rev2-01-boot.png`). Verified the very same code path works once `booted` is true: after restore chip → click Lecture again, `__audit.state()` = `{B:0.7, Ek:63, particle:'e+', plate:true, p1:63.51, r1:0.303, p2:20.84, r2:0.0993, dE:42.66}`, `playing = true`, canvas shows Anderson's crossing (`cc-rev2-lec-toggle.png`). Anchors: sim L1266 (`stageFor`), L1278 (`onStep` boot guard), L1372–1380 (init order); shell L649 (`finishInquiry`), L596 (`setLectureMode(true)`), L757 (boot-default Lecture). → **Fix:** flip the init order — set `booted = true` *before* `Shell.init(...)`, and either drop the trailing `Shell.setPlaying(false)` at L1378 or move it inside `stageFor(0)`; the fast-forward's `onStep(1..4)` then runs `stageFor(1..4)`, `onComplete()` opens More/showNums, and the resume-play sticks. (Alt: in `finishInquiry`, call `onStep(N-1)` explicitly *after* the loop, once — safer for other sims that share this pattern.)

> **FIXED — commit `edc7d40` (2026-08-26).** Applied the first option verbatim: moved `booted = true;` above `Shell.init(...)` and removed the trailing `Shell.setPlaying(false);` line (plus the now-obsolete "Prediction-first" comment). Post-fix live verification: first-load state is `{lectureOn:true, inqCollapsed:true, inqStep:4, playing:true}` with the readout table showing the intended Anderson scene (e⁺ · 63.5 MeV/c · r before 30.3 cm · ΔE 42.7 MeV over 6.4 mm · 20.8 MeV/c after · r after 9.9 cm); screenshot `cc-bootfix-postfix.png`. Reset from a mid-inquiry state returns to the identical boot state (verified). Zero pageerrors.

#### P1
none beyond the above.

#### P2
none new.

### Control census delta (this pass — additions to the prior full census)
| control | range walked | observable asserted | verdict |
|---|---|---|---|
| 🎓 Lecture (at boot) | on (default) | scene = free-exploration Anderson scene, playing=true | **NP-P0-3** (shows card-1 setup, paused) |
| 🎓 Lecture (post-boot, after restore) | off → on | scene = free-exploration Anderson scene, playing=true | OK (evidence `cc-rev2-lec-toggle.png`) |
| Card-3 answer with pre-answer Ek/B mutation | Ek 63→200, B 1.5→0.5 | fb text ↔ readout consistency, prose ↔ readout | **PHY-P1-3** |
| Card-4 answer with pre-answer particle/Ek/B mutation | e⁺→p̄, Ek 63→150, B 0.7→3.0 | prose ↔ readout consistency | **PHY-P2-3** |

### Combination coverage manifest (delta)
| combo set | strategy | count | invariants asserted | result |
|---|---|---|---|---|
| Sequential card walk (fresh) | exhaustive 1→5 + Finish | 1 | zero pageerrors, `__audit` at each stage matches STEPS[k].B/plate + independent p,r | pass (NP-P0-1 gone) |
| Mid-answer mutation × card × pre-fire delta | sampled | 2 (card 3, card 4) | fb string numbers ↔ live readout | fail — PHY-P1-3, PHY-P2-3 |
| Lecture boot / post-boot toggle | exhaustive | 3 (boot, restore→lecture, cards-answered→lecture) | scene = card-5 spec, playing=true | fail on boot only (NP-P0-3) |

### Inquiry-layer check (delta)
- Card 3: prose + `data-fb` numbers are **hardcoded** ("63 MeV", "63 → 350 MeV/c", "14 → 78 cm") — no `data-live` spans and no `stageFor(2)` in the reveal → mid-answer mutation makes the reveal narrate the wrong track.
- Card 4: prose hardcodes "e⁺ (marked ↑)", "≈ 40 MeV", "0.70 T" — no restage → same failure mode.
- Card 2: correctly restages (`stageFor(1)` at L1351, per the PHY-P2-2 fix) → **OK** (independently reverified: Ek stays 63 MeV, r goes 14.1 → 7.1 cm exactly).
- Card 5 (Finish): unchanged, works.

*Reviewed read-only; screenshots `cc-rev2-01-boot.png`, `cc-rev2-fresh-c3-mut.png`, `cc-rev2-fresh-c4-mut.png`, `cc-rev2-lec-toggle.png` in the session scratchpad; independent physics values reproduced with `node -e` (see transcript).*
