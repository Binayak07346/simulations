# Review — Eigenfold_way_v2.html ("Navigating the Eightfold Way", Lecture ~14) — re-review

> **UPDATE (fix pass, same session):** both P2 findings fixed and re-verified
> (`_review/ew-verify.mjs`, screenshots 10–12).
> - NP-P2-1 ✅ card 6 rewritten: "The tiles hold their arrangement — only the ruler
>   relabels. The baryon rows now read Y = +1, 0, −1, −2 (every baryon's number went up
>   by B = 1), while the mesons' numbers don't change at all (B = 0)…" — matches the
>   actual on-screen behavior.
> - NP-P2-2 ✅ apex-ghost caption, "?" glyph, ghost ring, AND the revealed-Ω⁻ pulse ring
>   are now theme-aware (amber-700/800 in light theme, original amber in dark) — legible
>   in both themes (`10-light-ghost-fixed.png`, `11-light-revealed-fixed.png`,
>   dark regression `12`).
> - Regression: audit invariant still exact (maxErr 0), reveal flow intact, 0 console
>   errors.

**Verdict:** Physics is flawless — every placement, quantum number, and Gell-Mann–Nishijima
charge verified exact on screen across all three multiplets; the gap→prediction→reveal
arc works precisely as the course plan specifies. No P0/P1 anywhere. Two P2 polish items
(a card wording that overpromises tile motion, and one illegible caption in light theme).
**Console:** clean (0 errors across ~30 states). **States tested:** 17 (generic probe) +
13 targeted flows — evidence in `_review/probe-out/`, `_review/ew-out/`.
**Note:** Claude-in-Chrome extension not connected; evidence via bundled headless-Chrome
probe + `_review/ew-flows.mjs` (tile clicks driven through the canvas hit-test, positions
read from `canvas.__pos`).

## Verified-correct highlights (browser-observed)
- **Baryon octet:** hexagon + Λ/Σ⁰ center pair at (0,−1); all 8 tiles clickable
  (including the offset pair); detail panel I₃/S/B/Y/Q exact for every member; proton
  1919/stable, Σ⁰ EM decay ~10⁻²⁰ s with the I=1 vs I=0 distinction. `01-octet.png`.
- **Meson octet:** identical hexagon on the same grid sites as the baryon octet (pixel-
  identical outer sites — the SU(3) point made visually); K̄⁰ at (+½,−1) with Q=0; π⁰/η
  flavour wavefunctions (uū−dd̄)/√2 and (uū+dd̄−2ss̄)/√6 shown; K_S/K_L lifetime note ✓.
- **Decuplet:** 9 tiles in 4-3-2 rows + pulsing "?" gap at (0,−3) with "empty site — what
  belongs here?"; reveal box appears only on decuplet; **Reveal Ω⁻** places the pink apex
  tile, selects it (Q=−1, S=−3, m=1.673, predicted 1962/discovered 1964), hides the box,
  and persists across multiplet round-trips. `04-decuplet-gap.png`, `05-revealed.png`.
- **Audit invariant** `gridChargeMatchesQuarkCharge`: ok with maxErr 0 in all three
  multiplets (GMN charge ≡ quark-sum charge for all 26 hadrons).
- **Axis toggle S↔Y:** mesons unmoved (Y=S at B=0 ✓); ruler relabels for baryons
  (0→+1 … −3→−2) with axis title update; hexagon shape invariant — matching the sim's own
  "what's invariant" panel. Selection survives the toggle. `06-decuplet-Y.png`.
- **Flows:** reset restores octet/S/unrevealed/no-selection exactly; inquiry gates
  (cards 2, 4) block Next until answered; step-back from the reveal card re-hides Ω⁻
  (deliberate — card 4 re-asks the prediction); no overflow at 1100px; 0 DOM overlaps;
  light theme fine except the one caption below. Formal equations all correct.

## PHYSICS
### P0
- none
### P1
- none
### P2
- none — placements, charges, masses, lifetimes, spins, years, flavour mixes all check.

## NON-PHYSICS
### P0
- none
### P1
- none
### P2
- **[NP-P2-1] [pedagogy] [high]** Inquiry card 6 says "Watch the tiles carefully… every
  tile shifts by the same amount (baryons all shift up by 1…)" — but the auto-fit viewport
  recenters, so tiles are pixel-stationary on toggle; only the axis numbers relabel
  (measured shift: 0 px for every tile; evidence: ew-flows.json `axisShift`,
  `04` vs `06` screenshots). The card's own conclusion ("you've only relabelled the
  ruler") describes what actually happens. Anchor: card 6 text ~line 347. → **Fix:**
  reword to "the tiles hold their arrangement — only the ruler relabels: the baryon rows
  now read Y = +1, 0, −1, −2 while mesons' numbers don't change."
- **[NP-P2-2] [ux] [high]** Light theme: the apex-ghost caption "empty site — what
  belongs here?" is drawn in pale amber `#fde68a` on the near-white canvas — barely
  legible (evidence: `08-light-theme.png`). Anchor: `draw()` ~line 897. → **Fix:**
  theme-aware caption color, e.g. `document.body.classList.contains('light-theme') ?
  '#b45309' : '#fde68a'` (and consider the '?' glyph likewise).

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Click all 8 octet tiles (incl. Λ/Σ⁰ pair) | ✅ all clickable, QNs exact | 02, flows JSON |
| 2 | Multiplet switching ×3 | ✅ occupants change, grid fixed, selection cleared by design | 03, 04 |
| 3 | Reveal Ω⁻ → detail + box hide | ✅ | 05 |
| 4 | Reveal persistence across multiplet round-trip | ✅ kept | flows JSON |
| 5 | Axis toggle with selection | ✅ selection + reveal survive | flows JSON |
| 6 | Inquiry walk with gates | ✅ 6 cards, gates block, auto-switch to decuplet on cards 4–6 | 07 |
| 7 | Step back from reveal card | ✅ re-hides Ω⁻ (intentional re-prediction) | flows JSON |
| 8 | Reset scope | ✅ octet/S/unrevealed/cleared | flows JSON |
| 9 | Theme + narrow 1100 | ✅ except NP-P2-2 caption | 08, 09 |

## Inquiry-question check
- "What patterns and symmetries help you sort the particles?" → yes: I₃/S grid, hexagon +
  triangle geometry, color-by-strangeness legend, Q diagonals readable off tile labels.
- "Do you notice any gaps? What might a gap represent?" → yes — THE feature: pulsing
  empty apex, commit-then-reveal flow, Ω⁻ prediction story with dates. Exactly the
  planned Excel affordance.

## To verify (human)
- Step-back unreveal (flow 7) is coded deliberately (onStep 3/4 reset `revealed`); if you
  prefer reveal to be sticky once earned, that's a one-line choice.
