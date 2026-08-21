# Review — Standard_model.html ("Exploring the Standard Model", Lecture 1) — re-review

> **UPDATE (fix pass, same session):** NP-P2-1 fixed at the root and re-verified
> (`_review/sm-verify.mjs`, `11-light-fixed.png`, dark regression `12`). Cause was the
> same class as Scale_of_universe's theme bug: the canvas `css()` helper read variables
> from `documentElement` while the light-theme class toggles on `body` — so every canvas
> color stayed dark-theme (near-white glyphs washing out on pale fills). `css()` now
> reads from `document.body` (with a comment), fixing tiles, mass ladder, Lagrangian,
> and titles in one line. Verified: light theme now renders dark, crisp glyphs
> (min glyph luminance 23 vs washed-out before); dark theme pixel-identical (body
> inherits the root vars); 0 console errors.
>
> **UPDATE 2 (user-reported overlap issues, fixed):** the mass ladder had two overlap
> classes (`13/14-overlap-*.png` evidence):
> 1. The floating DOM legend sat on top of the "MASS (log scale)" header and the 1 TeV
>    tick (worse when it wraps to two rows at narrow widths). `drawTable()` now measures
>    the legend's actual rect each frame and starts the ladder below it.
> 2. Marker labels overprinted in the mass clusters — t/H/Z⁰/W⁺/W⁻ at ~100 GeV (the W±
>    share an identical mass, so their dots AND labels coincided exactly) and μ⁻/s at
>    ~100 MeV. `drawMassLadder()` now runs a two-pass label de-collision (12 px minimum
>    spacing, clamped to the axis) — dots stay at their TRUE mass position, only labels
>    move, with leader lines when displaced; coincident dots stagger in x. Verified:
>    every cluster label on its own line (`14-ladder-wide.png`), and a click-sweep down
>    the label column selects 11 distinct particles including the displaced W⁻ and the
>    formerly-overlapping μ⁻/s (hit regions follow the moved labels). 0 console errors.
> 3. Per user follow-up, the legend moved UP into the top-right corner (same row as the
>    plot title, `.legend` top 42→8 px) and the freed strip expands the log-scale axis —
>    the dynamic clearance shrank from 74 to 36 px, giving the ladder ~38 px more height;
>    title–legend gap verified healthy at 1440 (588 px) and 1100 (248 px)
>    (`15-legend-up-*.png`).
> 4. User-reported: the ν marker row straddled the MASSLESS/UNRESOLVED box's bottom
>    border — the band reserved 54 px but its content needs ~68. `bandH` 54→76 with the
>    marker rows re-spaced (exact +32, ν +50); all contents now inside the rounded box
>    with margin, markers still clickable (`16-band-fixed.png`). 0 console errors.
> 5. User follow-up: band made COMPACT and tucked into the bottom-right corner so the
>    axis maximizes height — the two marker rows merged into one inline row (γ, g, νe,
>    νμ, ντ; spacing adaptive to box width), `bandH` 76→56, and the explainer text is
>    width-aware (falls back to "γ, g exactly 0 · ν tiny mass ≠ 0" when the full line
>    would clip). Axis gained 20 px; all five band markers verified clickable
>    (`17-band-compact-*.png`). 0 console errors.
> 6. Final marker-layout iteration (user zooms showed the x-staggered dots colliding
>    with each other and the Z⁰ label): switched to the slope-chart pattern — dots in
>    ONE fixed column at true mass positions (identical masses like W⁺/W⁻ legitimately
>    superimpose), all disambiguation in a separate label column dots can never reach,
>    fanned leader lines, and label-anchored hit regions (unique per particle even when
>    dots coincide). Verified: both former collision sites clean (`18/19-cluster-*.png`),
>    10 particles clickable down the label column incl. the previously-buried Z⁰.
> 7. User-requested detail-panel restructure (`20-panel-nu.png`): (a) the header's
>    uppercase rule was turning "νμ" into "ΝΜ" (reads as Latin NM) — symbol span now
>    `text-transform:none`; (b) the long "(stored 0; actually tiny non-zero)" mass value
>    that wrapped raggedly is now a compact "≈ 0 *" with the honest explanation moved to
>    a tagged "* MASS" footnote block; (c) rows get hairline separators + nowrap values,
>    and the discovery story becomes a labeled "DISCOVERY" note block. Verified: νμ panel
>    renders all values single-line with both note blocks; massive-particle path
>    unchanged (charm 1.270 GeV). 0 console errors.
> 8. User-reported Lagrangian rendering issues (`22/23-lagr-*.png`): the canvas-drawn
>    equation could not typeset the notation — Unicode has no subscript Greek, so F_μν
>    degraded to "F_uv", ℒ_SM showed a literal underscore, and D̸/Yukawa indices were
>    mangled. Restructured: the equation row is now a KaTeX DOM overlay (`#lagr-eq`) of
>    clickable term chips (real \mathcal{L}_{SM}, F_{μν}, \not{D}, ψ_i y_{ij} ψ_j) using
>    the LAGRANGIAN_TERMS latex fields; canvas keeps only headers + the expansion tray,
>    which now positions below the overlay's MEASURED bottom (wrap-safe). Verified: 4
>    chips KaTeX-rendered, click+hover select with highlight, detail panel syncs, term
>    memory survives mode round-trips, overlay hides in table mode and on reset, no
>    overflow at 1100 px, 0 console errors.
> 9. Two follow-ups (`26-tray-card.png`, `27-sidebar-eq.png`): (a) the expansion tray
>    was a full-height canvas box dwarfing its two lines of text — now a content-sized
>    DOM card (#lagr-tray, max-width 740 px, measured 127 px tall) under the equation,
>    with an accent-tagged term name and 1.6-line-height prose; hidden when nothing is
>    selected; canvas keeps only the headers. (b) the sidebar/chip equation's Feynman
>    slash rendered as a detached slash with an awkward gap — KaTeX's `\not{D}` is a
>    relation-negation overlay, replaced with `\cancel{D}` (and tightened spacing) in
>    LAGRANGIAN_TERMS and the formal-drawer compact equation. Verified: card sizes to
>    content, ✓ \cancel renders in chips/sidebar/formal, no overflow at 1100 px,
>    0 console errors.
> 10. User follow-up (`29-centered-large.png`): the equation + expansion card group is
>    now vertically CENTERED in the canvas (`#lagr-overlay` justify-content:center;
>    measured 0 px off the midline) and the equation enlarged — chips 17→22 px with
>    bigger padding, ℒ_SM/=/+ 19→25 px, card max-width 740→860 px. Wraps cleanly at
>    1100 px (126 px, no overflow); 0 console errors.
> 11. User follow-up — first-load interaction (`33-firstload-note.png`, `34`): term
>    selection is now CLICK-only (the previous hover-select popped the explanation box
>    before the student chose; CSS :hover remains as the affordance), first load shows
>    NO pre-selected term, and a boxed "Click a term to show its explanation" note sits
>    in the bottom-left corner (shown only in Lagrangian mode). Also fixed: the
>    updateDetailPanel early-return paths skipped the overlay sync calls. Verified:
>    fresh entry → note + no selection + hidden card; hover → still nothing; click →
>    chip highlights and the explanation card appears; table mode hides the note.

**Verdict:** Physics data is PDG-exact for all 17 fundamental particles, both planned
modes work fully (tile table with detail panel; Lagrangian with hover/click term
expansion), selection memory survives mode round-trips, and the mass ladder makes the
inquiry pattern visible. No physics findings; no functional findings. One P2: light-theme
tile glyphs are washed out.
**Console:** clean (0 errors across ~45 states). **States tested:** 14 (generic probe) +
30 targeted (17 tile clicks + 4 term clicks + hover + flows) — evidence in
`_review/probe-out/`, `_review/sm-out/` (`sm-flows*.mjs`).
**Method note:** an initial "Lagrangian terms don't respond" observation was my own
click-coordinate error (window-fraction vs canvas-fraction, ~24 px low); precise clicks
at the term row (canvas y = 0.36 h) select every term by click AND hover.

## Verified-correct highlights (browser-observed)
- **All 17 particles clicked; every value PDG-exact:** u 2.16 MeV, d 4.67 MeV,
  e⁻ 511.00 keV (1897 Thomson), νe/νμ/ντ with the honest label "Mass 0 (stored 0;
  actually tiny non-zero)" and correct discovery stories (1956 Cowan–Reines, 1962
  Lederman–Schwartz–Steinberger, 2000 DONUT), c 1.27 GeV (1974 "November Revolution"),
  s 93.4 MeV, μ 106 MeV (1936), t 172.7 GeV (1995 CDF/DØ, "heaviest known"), b 4.18 GeV
  (1977 Υ), τ 1.777 GeV (1975 Perl), γ/g "Mass 0 (exactly)" (1905/1979 three-jet),
  W± 80.38 GeV, Z⁰ 91.19 GeV (1983 UA1/UA2), H 125.3 GeV spin 0 (2012 ATLAS/CMS).
  Charges and spins all correct; families color-coded with legend.
- **Mass ladder (log scale):** correct clustering — t/H/Z/W at ~10²GeV, b/τ/c around a
  GeV, μ/s near 100 MeV, d/u/e in the MeV band, plus a "MASSLESS / UNRESOLVED" callout
  separating exact zeros (γ, g) from neutrino oscillation masses. This is the "patterns
  in mass across families" inquiry affordance, working (`01-table.png`).
- **Lagrangian mode:** the canonical 4-term compact form (−¼F², iψ̄D̸ψ, Yukawa + h.c.,
  |Dφ|²−V); clicking OR hovering a term highlights it, opens an expansion tray on canvas
  AND a KaTeX-rendered detail panel; all four plain-language expositions are physically
  accurate (gluon self-interaction → confinement; covariant derivative = force coupling;
  Yukawa sets mass, top strongest; Higgs vacuum value gives W/Z mass vs massless photon)
  (`10-term-expanded.png`).
- **Flows:** selection memory per mode survives round-trips (W⁻ restored on return to
  table; gauge term restored on return to Lagrangian); reset restores table mode +
  placeholder; 6 inquiry cards with 3 working gates; 0 DOM overlaps; no overflow at
  1100 px; 0 console errors.

## PHYSICS
### P0
- none
### P1
- none
### P2
- none — every displayed mass, charge, spin, year, and story checks against PDG/history.

## NON-PHYSICS
### P0
- none
### P1
- none
### P2
- **[NP-P2-1] [ux] [high]** Light theme: the large tile glyphs and mass values are
  washed out — family-colored text at dark-tuned alpha sits on family-tinted pale fills
  (e.g. "u" pale pink on pale pink, "511.00 keV" pale blue on pale blue, Higgs
  "125.3 GeV" nearly invisible on pale green), while charges and small names stay
  legible (evidence: `09-light-table.png` vs `01-table.png`). Anchor: `drawTile()`
  ~line 1407 (symbol/mass fillStyle) with `familyColor()`/`withAlpha()`. → **Fix:** in
  light theme render the symbol and mass in a dark ink (e.g. `css('--text')`) or deepen
  the family color (no alpha) — keep the tile fill tint as-is.

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Click all 17 tiles → detail values | ✅ PDG-exact | flows JSON |
| 2 | Higgs tile | ✅ 125.3 GeV, spin 0, 2012 | flows2 |
| 3 | All 4 Lagrangian terms, click + hover | ✅ tray + panel + KaTeX | 10 |
| 4 | Mode round-trip selection memory | ✅ both directions | flows JSON |
| 5 | Reset scope | ✅ table + placeholder | flows JSON |
| 6 | Inquiry: 6 cards, 3 gates | ✅ | 04 |
| 7 | Narrow 1100 | ✅ no overflow | 06 |
| 8 | Light theme | ⚠ tile glyph contrast (NP-P2-1) | 09 vs 01 |

## Inquiry-question check
- "Which particles are familiar, which are new?" → yes: card 1 asks exactly this over
  the full chart with per-tile detail.
- "Patterns in mass or charge across the particle families?" → **yes, doubly**: charge
  patterns from the corner badges down columns (+2/3, −1/3, −1, 0), and the mass ladder
  renders the generational hierarchy explicitly; cards 2–4 walk rows, ladder, and the
  zero-mass band.

## To verify (human)
- none beyond NP-P2-1.
