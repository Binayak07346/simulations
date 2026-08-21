# Review — Charged_particle_in_a_magnetic_field_v2.html ("Virtual Cloud Chamber", Lecture 10) — re-review

> **UPDATE (fix pass, same session):** both findings fixed in place and re-verified with
> the pixel-fit measurement (`_review/cc-verify.mjs`, `cc-verify2.mjs`; screenshots 14–18).
> - PHY-P0-1 ✅ curl labels corrected at the source: engine `trackCurvatureDirection` and
>   sim fallback now map +q in B⊙ → 'clockwise' (ω = −qB/γm ẑ); the geometry builders
>   (`buildTrackGeometry`, `samplePoint`, `applyPlateLoss`) were re-keyed to the corrected
>   labels so the drawings are unchanged; card-2 feedback texts and the correct-answer
>   button label rewritten (viewer's left/right, 6→9 vs 6→3 o'clock). Verified: e⁻ drawn
>   CCW + readout "↺ CCW" + audit 'counterclockwise'; e⁺ CW/"↻ CW"; e⁻ in B⊗ CW/"↻ CW";
>   centers at identical pixel positions as pre-fix (770/292/311) — geometry untouched.
> - PHY-P1-1 ✅ plate now costs energy on EVERY crossing, both directions (`advanceLive`
>   crossing test; boundary-point guard prevents double-triggering); MAX_ARC raised to
>   12π so the loss spiral runs to its KE death instead of ending mid-air. Verified:
>   8 MeV e⁻ + plate now draws the classic inward spiral, terminates, and retires as a
>   ghost (`18-final-plate-spiral.png`).
> - Match HUD regression ✅ (target 68.0 MeV/c, "✓ match!"); 0 console errors throughout.

**Verdict:** Numerics, geometry, and every flow are excellent — but there is one P0: the
**curl-direction labels are inverted** relative to the (physically correct) drawn tracks,
in the readout, the engine, and two inquiry cards. One P1: the lead plate only attenuates
the first crossing. Everything else passes.
**Console:** clean (0 errors across ~55 states, three sessions).
**States tested:** 37 (generic probe) + 14 targeted flows + full plate-arc observation —
evidence in `_review/probe-out/` and `_review/cc-out/`.
**Note:** Claude-in-Chrome extension not connected this session; evidence gathered with
the bundled headless-Chrome probe + targeted scripts (`_review/cc-flows.mjs`,
`cc-plate.mjs`). Rotation sense measured *numerically* from the rendered pixels (Kasa
circle fit + signed angular sweep), not by eye.

## Verified-correct highlights (browser-observed)
- **r = p/(0.2998·q·B) exact:** e⁻ @5 MeV → p 5.487 MeV/c, r 36.6 mm (readout 5.5/0.037 ✓);
  B 0.5→2.0 T gives r/4 = 9.15 mm ✓; proton @5 MeV → p 97.0 MeV/c, r 0.647 m ✓ (heavy =
  gentler curve at same KE — inquiry answerable).
- **Drawn geometry is physically right:** e⁻ center right of slit, orbit viewer-CCW;
  e⁺ center left, viewer-CW (pixel-fit: centers x=770 vs x=291, entry 544). F = qv×B ✓.
- Anderson plate: first crossing tightens the arc correctly (r 0.057 → 0.030 m drawn).
- B-flip mid-flight reverses the live arc, ghosts keep their historical curl ✓ (exactly
  what card 6 teaches). Ghost cap (8) + Clear ghosts + live-track survival ✓.
- Neutron: no track + "No charge, no ionisation" message ✓.
- Match HUD (inquiry step 5): muon ghost target 68.0 MeV/c = exact p for μ@20 MeV;
  matching gives "+0.0 MeV/c ✓ match!" ✓.
- Reset restores full default (particle, KE, B, dir, plate, ghosts) ✓; pause→slider→play ✓;
  no overflow at 1100px; 0 DOM overlaps; formal equations all correct (pc = √(KE²+2·KE·mc²)).

## PHYSICS
### P0
- **[PHY-P0-1] [high]** Curl labels inverted everywhere vs the drawn track — Repro: load
  (e⁻ default), watch the arc curl **counterclockwise** (center right of slit) while the
  readout says "↻ CW"; pick e⁺: arc curls **clockwise**, readout says "↺ CCW". Observed:
  pixel-fit sense e⁻ = viewer-CCW / label CW; e⁺ = viewer-CW / label CCW (evidence:
  `01-electron.png`, `02-positron.png`, cc-flows.json arc fits). The *drawn* physics is
  correct (+q pushed left, orbits viewer-clockwise in B⊙: ω = −qB/γm ẑ); only the label
  mapping is backwards. Anchors: engine `trackCurvatureDirection()` ~line 373 (`sign>0 ?
  'counterclockwise' : 'clockwise'` — should be `'clockwise'`), sim fallback
  `chargedTrack()` ~line 1685 (same swap), inquiry card texts ~lines 790–791 ("positive
  particle curls counterclockwise (to its left)" → **clockwise**; "negative… curls
  clockwise (to its right)" → **counterclockwise**; the "to its left/right" parentheticals
  are also inverted — drop them or say "viewer's left/right"), engine docstring ~line 371.
  → **Fix:** swap the two label strings in both functions, correct the two card texts and
  docstring. Match-HUD logic compares labels to labels — unaffected. This is the sim's
  core LO (charge sign from curl), hence P0.
### P1
- **[PHY-P1-1] [high]** Lead plate attenuates only the FIRST crossing — Repro: plate on,
  e⁻ 8 MeV (card 7 preset), let the track run: after the tightened below-plate arc it
  re-crosses the Pb upward and keeps circulating through the plate with no further loss
  (same radius both sides; amber pixels above=167/below=185). Evidence:
  `13-plate-full-arc.png`. Anchor: `advanceLive()` crossing test ~line 2010 gated by
  `!tr.plateHit`; `applyPlateLoss()` ~line 1942. → **Fix:** detect plate crossings in BOTH
  directions on every pass and apply the KE loss each time (existing tangent-preserving
  center-rescale already handles geometry); the track then spirals inward and dies —the
  classic chamber picture.
### P2
- none

## NON-PHYSICS
### P0
- none
### P1
- none
### P2
- none — flows, layout, persistence, reset scope, ghosts, and responsiveness all clean.

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Default e⁻ track + readouts | ✅ numbers exact; ❌ curl label (PHY-P0-1) | 01 |
| 2 | e⁺ antiparticle comparison | ✅ opposite drawn curl; ❌ label | 02 |
| 3 | B slider ×4 while running | ✅ r/4, live rebuild, no state loss | cc-flows.json |
| 4 | Proton/neutron | ✅ gentle curve / no track + message | 03, 04 |
| 5 | ⊙→⊗ flip mid-flight | ✅ live reverses, ghosts keep curl | 05 |
| 6 | Plate (Anderson) | ✅ first tightening; ❌ free re-crossings (PHY-P1-1) | 06, 13 |
| 7 | Ghost accumulation / clear / cap | ✅ | 07, 08 |
| 8 | Pause→KE→play, reset while running | ✅ exact reset scope | 09 |
| 9 | Inquiry gates → match HUD → match | ✅ target 68.0 MeV/c exact, match fires | 10, 11 |
| 10 | Narrow 1100 layout | ✅ clean, no overflow | 12 |

## Inquiry-question check
- "Particle vs antiparticle from curvature?" → **Drawn tracks: yes** (opposite curls,
  side-by-side ghosts). **Readout/cards: currently teach the inverted labels** (PHY-P0-1).
- "How does B strength influence trajectories?" → yes: slider + live rebuild + r readout.
- "Heavier vs lighter distinguishable?" → yes at fixed KE (p⁺ 0.647 m vs e⁻ 0.037 m);
  card 5's muon-match exercise makes the momentum-degeneracy point explicitly. ✓

## To verify (human)
- Whether the 50% plate KE loss (didactic constant) should stay qualitative or be labeled
  with a number on screen — current sidebar text is qualitative and fine.
