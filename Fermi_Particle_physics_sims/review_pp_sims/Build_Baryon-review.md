# Review — Build_Baryon.html ("Build-A-Baryon", Lectures ~14/21) — post-fix re-review

> **UPDATE (fix pass, same session):** all 7 findings below were fixed in place and
> re-verified in headless Chrome (`_review/bb-verify-fixes.mjs` + full regression via
> `bb-flows.mjs`, 15/15 assertions PASS, 0 console errors).
> - PHY-P1-1 ✅ heavy verdicts now quote the real particle's rest mass (J/ψ 3.1, Υ 9.5,
>   Λ_c⁺ 2.3 GeV…); unknown combos say "at least ≈ 2m_q (quark-pair threshold)".
> - PHY-P2-1 ✅ any t-containing combo now states top decays before hadronizing — no top
>   hadrons at any energy.
> - PHY-P2-2 ✅ primary quark content beats altQuarks match: s s̄ @ J=0 → η′ (η listed as
>   alternative); π⁰/ρ⁰/φ regressions unchanged.
> - NP-P1-1 ✅ bench scrolls (`overflow-y:auto` + `justify-content:safe center`), verdict
>   no longer shrinks — full verdict visible at 1280×800 with Formal open
>   (`flow-out/18-fixed-narrow-1280.png`).
> - NP-P2-1 ✅ bench top padding reserves the caption row; no slot/caption crowding.
> - NP-P2-2 ✅ mode switch with placed quarks now shows "Slots cleared — … Your library
>   is untouched."
> - NP-P2-3 ✅ baryon-mode qq incomplete verdict appends the colour-neutrality note
>   (matches inquiry card 1).
> - NP-P2-4 ✅ positive integer Q/B/S now signed ("+1").
> Also: bottom-quark palette tooltip updated to "≥ ~9.5 GeV" for consistency with Υ.

**Verdict:** Physics core is correct and well-sourced (PDG masses, lifetimes, decay modes,
discovery years, Gell-Mann–Nishijima, colour-neutrality rule, sss/Pauli story all verified
on screen); no broken controls, no state-loss flow bugs, no console errors. Remaining
findings: one P1 physics number (heavy-sector energy estimate), one P1 layout clip, and a
handful of P2 polish items. **No P0s.**
**Console:** clean (0 errors across ~40 driven states, two independent sessions).
**States tested:** 21 (generic probe) + 25 (targeted flows) — screenshots in
`_review/probe-out/` and `_review/flow-out/`.
**Note:** Claude-in-Chrome extension was not connected this session; evidence was gathered
with the bundled headless-Chrome probe + targeted puppeteer flow scripts
(`_review/bb-flows.mjs`, `bb-flows2.mjs`, `bb-visual.mjs`) — same real-browser DOM,
screenshots, and console capture.

## Verified-correct highlights (browser-observed)
- uud J=½ → p (0.9383 GeV, 1919); same slots at J=3⁄2 → Δ⁺ (1.232, 1952); slots persist
  across spin flips. `01-proton.png`, `02-delta.png`.
- sss J=½ → "no known particle" + correct Pauli/symmetry explanation; J=3⁄2 → Ω⁻
  (Q=−1, S=−3, 1.672 GeV, 1964, Λ K⁻ decay). `03/04`.
- Meson mode relabels spin J=0/J=1, 2 slots; u s̄ @J=0 → K⁺; u ū @J=0 → π⁰ (η, η′ as
  alternatives); @J=1 → ρ⁰ (ω alternative). Fresh-user path matches inquiry card 5.
- q+q rejected with colour-singlet reason; 1-of-3 slots → "not enough quarks";
  antibaryons identified with correct negative Q, B; heavy quarks route to "beyond table"
  with real-particle hints (J/ψ, Υ, Λ_c⁺).
- Q/B/S readouts additive and correct incl. thirds ("+1⁄3", "+2⁄3"); −0 never shown.
- Flow/state: shell theme/Formal/maximize toggles never clear slots; library dedupes and
  persists across mode switches; Reset restores full default (mode, spin, slots, library,
  verdict); remove-× per slot works; drop-handler path works (synthetic DnD).
- Guided inquiry: Next gated until a choice is answered, feedback renders, pager works;
  Hide/Show Guided Inquiry round-trips. Formal drawer renders all 4 KaTeX equations
  correctly (S = −N_s + N_s̄ sign convention right). `15-formal-omega.png`.
- No horizontal overflow at 1440/1280/1100. The probe's 2 reported DOM overlaps (H2 vs
  mode buttons) are false positives from a full-width heading box — visually clean.

## PHYSICS
### P0
- none
### P1
- **[PHY-P1-1] [high]** Heavy-sector energy estimate (2·m_q) undershoots the named real
  particle and contradicts the sim's own labels — Repro: meson mode, c + c̄ → Identify.
  Observed: "The real particle: J/ψ … Creating it needs ≈ 2.5 GeV" vs Expected: m(J/ψ) =
  3.097 GeV; palette tooltip says "≥ ~3 GeV" and inquiry card 5 says "≥ 3 GeV". Same for
  b b̄: "≈ 8.4 GeV" vs Υ 9.46 GeV / tooltip "≥ ~9 GeV". Evidence: `08-ccbar.png`,
  flows2 JSON. Anchor: `heavyEnergyEstimate()` ~line 2057. → **Fix:** when
  `realHeavyName()` matches, quote that particle's actual mass as the threshold (J/ψ 3.10,
  Υ 9.46, Λ_c⁺ 2.29, D 1.87, Dₛ 1.97, Λ_b 5.62 GeV); otherwise phrase the fallback as
  "at least ≈ 2·m_q ≈ X GeV (quark-pair threshold)".
### P2
- **[PHY-P2-1] [high]** t-containing verdict implies toponium is reachable with enough
  energy — Repro: t + t̄ → Identify. Observed: "Creating it needs ≈ 345 GeV" with no
  hadronization caveat, while the palette tooltip and card 5 correctly say top decays
  before hadronizing. Anchor: `identify()` heavy branch ~line 2099. → **Fix:** special-case
  any `t`/`anti-t` in the verdict: "top decays (~5×10⁻²⁵ s) before it can hadronize — no
  top hadrons exist, at any energy."
- **[PHY-P2-2] [med]** s s̄ @ J=0 identifies as η with η′ as alternative — Repro: meson
  mode, s + s̄, J=0. Observed: primary = η (flavour-mixed, only ~1/6 ss̄) vs Expected: η′
  (mostly ss̄) as the primary reading. Cause: mass-sort picks the lightest match across
  `altQuarks`, overriding primary-quark-content matches. Anchor: `hadronFromQuarks()`
  ~line 753. → **Fix:** prefer records whose PRIMARY `quarks` equal the input before
  `altQuarks` matches; keep the rest as alternatives.

## NON-PHYSICS
### P0
- none
### P1
- **[NP-P1-1] [overlap] [high]** Verdict box clips its own content on 800px-tall
  viewports when the Formal drawer is open — Repro: identify Ω⁻, toggle ∑ Formal, window
  1280×800 (or 1100×800). Observed: green verdict border closes after "Lifetime";
  "Discovered 1964" and "Decay Λ K⁻, Ξ π" rows render outside the border and are clipped
  by the panel edge; the story line is lost entirely. Evidence: `17-narrow-1280.png`,
  `16-narrow-1100.png` (clean at 1440×900, `15-formal-omega.png`). Anchor: `.verdict` /
  `.bench` CSS height constraints. → **Fix:** let `.verdict` grow (remove the effective
  max-height) and give the workbench column `overflow-y:auto` at small heights so no row
  is ever cut.
### P2
- **[NP-P2-1] [overlap] [high]** Slot row crowds/overlaps the "DRAG QUARKS INTO THE
  SLOTS" caption at ≤1100px width (filled-slot × badges sit on the caption line).
  Evidence: `16-narrow-1100.png`. → **Fix:** add top margin to `#slots` or hide the
  caption once any slot is filled.
- **[NP-P2-2] [flow] [high]** Mode round-trip (baryon → meson → baryon) silently clears
  the workbench slots. Defensible (slot count changes 3↔2; library persists; verdict
  resets to instructions), but uud placed before the round trip is gone without notice.
  Anchor: mode handler ~line 2243. → **Fix (optional):** keep a per-mode slot memory, or
  flash a one-line "slots cleared on mode change" notice.
- **[NP-P2-3] [pedagogy] [med]** Inquiry card 1's experiment ("drop just u and d — what
  should happen?") cannot be reproduced in baryon mode: identifying u+d+empty yields
  "Not enough quarks", never the colour-neutrality verdict the card teaches. The colour
  message is only reachable via meson-mode q+q. → **Fix:** append to the incomplete
  verdict: "…and even u+d alone could never bind — two quarks aren't colour-neutral."
- **[NP-P2-4] [ux] [low]** Sign formatting inconsistent in Q/B/S readouts: fractional
  values are signed ("+2⁄3") but positive integers are not ("1"). Anchor: `fmt()` ~line
  2025. → **Fix:** sign positive integers too ("+1").

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | Build uud, Identify, flip spin (slots kept), re-Identify | ✅ p → Δ⁺, slots persist | 01, 02 |
| 2 | sss at both spins | ✅ Pauli msg / Ω⁻ | 03, 04 |
| 3 | Mode switch relabels spin, resizes slots | ✅ J=0/1, 2 slots | flows JSON |
| 4 | Spin selection carried across mode switch (high↔high) | ✅ by design, inline label always correct | flows JSON |
| 5 | Invalid combos (q+q, incomplete) | ✅ honest rejections | 07 |
| 6 | Heavy sector (cc̄, bb̄, tt̄, cud) | ✅ routed "beyond table" (see PHY-P1-1/P2-1) | 08 |
| 7 | Antibaryon (ū ū d̄) | ✅ correct Q=−1, B=−1 | 09 |
| 8 | Remove-× mid slot | ✅ QNs recompute | 10 |
| 9 | Theme/Formal/Maximize with filled slots | ✅ no state loss | flows JSON |
| 10 | Mode round-trip with content | ⚠ slots cleared silently (NP-P2-2), library kept | flows JSON |
| 11 | Shell Reset scope | ✅ full default incl. library | 11 |
| 12 | Inquiry gating / feedback / pager / hide-restore | ✅ | 12 |
| 13 | Synthetic HTML5 drop | ✅ | flows JSON |
| 14 | Info modal open/close | ✅ | 14 |
| 15 | Narrow 1280/1100 + Formal | ⚠ verdict clips (NP-P1-1) | 16, 17 |

## Inquiry-question check
- "Which combinations aren't possible / haven't been discovered, and what would be
  necessary to discover them?" → **Answerable.** Colour-forbidden combos get the
  singlet-rule verdict; light undiscovered combos get "no known particle" with
  spin-alternatives; heavy combos get real-particle hints + energy estimates (the
  estimate itself is PHY-P1-1). Card 5 walks the student through exactly this split.

## To verify (human)
- Whether the mode-switch slot-clear (NP-P2-2) is intended UX — the code is deliberate.
- Whether η-first for ss̄ @ J=0 (PHY-P2-2) is a deliberate "lightest state wins"
  convention you want to keep.
