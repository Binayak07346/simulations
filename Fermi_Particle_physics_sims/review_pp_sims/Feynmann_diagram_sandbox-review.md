# Review — Feynmann_diagram_sandbox.html ("Feynman Diagram Sandbox", Lecture ~12) — re-review

> **UPDATE (fix pass, same session):** both P2 findings fixed and re-verified
> (`_review/fd-verify.mjs`, screenshot `09-fixed-caption-narrow.png`).
> - NP-P2-1 ✅ canvas-drawn "drawing convention: time →" caption removed from `draw()`;
>   only the DOM badge remains at bottom-left (title bar still carries the note). Clean
>   at 1100px.
> - NP-P2-2 ✅ `validateVertex()` now unshifts the vertex-structure violation so it
>   displays first: 3-fermion combos — including the Q-balanced d̄ u e⁻ trio that
>   previously surfaced "lepton number" — now read "REFUSED · VERTEX STRUCTURE: …two
>   fermion lines and one boson, got 3 fermion(s) and 0 boson(s)". Regressions clean:
>   charge-fail preset still names charge conservation, valid QED vertex still allowed,
>   0 console errors.

**Verdict:** Physics is exact everywhere it can be checked — all 9 presets validate with
the right rule names, all 6 custom-builder combos accept/refuse correctly, every coupling
and scaling number is right to the displayed digits, the propagator pole behaves, and the
core lesson (amplitude invariant under vertex dragging) is enforced and true. No P0/P1.
Two P2 polish items. **One important meta-finding:** the generic probe's reported
"persistence failure" (q² resetting on Hide Guided Inquiry) was a **probe artifact** — a
button-indexing bug in `_review/browser-probe.mjs` (visible-filtered index used against
the unfiltered button list, shifted by the invisible SimCfg editor buttons inside the
closed Info modal). The probe was clicking the config editor's own "Back to original
values" button. Probe fixed; re-run reports 0 persistence failures, and targeted by-id
tests prove q² survives preset switches AND lecture toggles.
**Console:** clean (0 errors across ~60 states). **States tested:** 41 (fixed generic
probe) + 20 targeted flows — evidence in `_review/probe-out/`, `_review/fd-out/`,
repro scripts `fd-repro*.mjs`.

## Verified-correct highlights (browser-observed)
- **Couplings & scalings exact:** α = 7.297e-3 (1/137.036); single QED vertex amp √α =
  8.542e-2, prob α; ee-scatter (N=2) amp α, prob α² = 5.325e-5; QCD α_s = 0.1179, amp
  0.3434; weak α_w = 0.0338 labeled "unified α_w, simplified" ✓.
- **All 9 presets:** allowed ones pass with force named; refused ones name the RIGHT rule
  — γe⁻μ⁺ → flavour conservation (no tree-level FCNC), gluon-lepton → colour charge,
  e⁻e⁻γ → charge (−2), W⁺e⁻νₑ → lepton number (+2). Amp/prob read "0 (refused)".
- **Custom vertex builder:** e⁻e⁺γ ✓ allowed; e⁻μ⁺γ ✓ refused (flavour); uūg ✓ allowed;
  e⁻e⁺g ✓ refused (colour); e⁻ν̄ₑW⁺ ✓ ALLOWED (crossed W→eν, physically right);
  3 fermions ✓ refused. 4th palette click restarts the tray (by design). Invalid vertex
  draws a red ✗ marker (`04-custom-3fermion.png`).
- **Propagator panel:** photon, q² = −5 → −0.200; q² = 0 → "∞ (on shell!) YES — pole";
  q² = +5 → +0.200; single-vertex presets say "no internal line" ✓. The q² slider is
  honestly labeled a "what-if probe", not a physical control ✓.
- **Drag-a-vertex:** toggle works, mouse-drag moves V1, amplitude readout unchanged and
  the audit invariant `amplitudeInvariantUnderVertexPosition` passes — exactly the
  topology-not-geometry lesson card 1 teaches (`05-after-drag.png`).
- **Flows:** q² persists across preset switches and lecture-mode round-trips (3.7 stayed
  3.7); reset restores preset 1/q²=−1/empty tray/drag-off exactly; 3 inquiry gates block
  until answered; 8 cards complete; no overflow at 1100px; light theme clean.

## PHYSICS
### P0
- none
### P1
- none
### P2
- none — every number, rule, and refusal message checked out.

## NON-PHYSICS
### P0
- none
### P1
- none
### P2
- **[NP-P2-1] [overlap] [high]** Bottom-left caption doubled: the canvas draws
  "drawing convention: time →" at (60, h−14) and the DOM badge `.canvas-note` ("Drawing
  convention only. Fermion arrow direction…") sits on top of it — at 1100px the canvas
  text pokes out half-obscured under the wrapped badge (`08-narrow.png`; visible at
  1440px too). The plot title ALSO says "— time → (drawing convention only)": three
  copies. Anchor: `draw()` fillText ~line 2269. → **Fix:** delete the canvas fillText;
  the title bar and badge already carry the message.
- **[NP-P2-2] [pedagogy] [med]** For structurally invalid combos (e.g. 3 fermions) the
  refusal banner shows the first conservation violation (charge, or lepton number for a
  Q-balanced trio like d̄ u e⁻) instead of the more fundamental "vertex structure: two
  fermions + one boson". Anchor: `validateVertex()` — structure check runs after the
  conservation sums (~line 415); banner shows `violations[0]`. → **Fix:** when
  fermions.length !== 2 || bosons.length !== 1, unshift the structure violation so it
  displays first (keep the others listed).

## Flow-test matrix
| # | Flow tried | Result | Evidence |
|---|---|---|---|
| 1 | All 9 presets → banner + stats | ✅ correct rules & numbers | fd-flows.json |
| 2 | q² sweep incl. exact on-shell 0 | ✅ pole flagged | 03 |
| 3 | 6 custom combos + tray-overflow restart | ✅ | 04, flows JSON |
| 4 | Drag vertex; amp invariance | ✅ invariant passes | 05 |
| 5 | q² × preset persistence | ✅ 4.3 kept | flows JSON |
| 6 | q² × lecture-mode round trip | ✅ 3.7 kept (probe artifact disproven) | fd-repro.mjs |
| 7 | Reset scope | ✅ exact | flows JSON |
| 8 | Inquiry: 8 cards, 3 gates | ✅ | 06 |
| 9 | Light theme + narrow 1100 | ✅ except NP-P2-1 caption | 07, 08 |

## Inquiry-question check
- "Invalid vertices rejected with the conservation law named?" → **Yes — the core
  affordance**: refusal banner names the rule, vertex log shows ×0, red ✗ on canvas, and
  the refused presets are a curated tour of the four failure modes.
- "More vertices → smaller contribution?" → yes: N=1 vs N=2 amp/prob readouts + formal
  panel M_N ∝ α^(N/2).

## To verify (human)
- Probe infrastructure note: `_review/browser-probe.mjs` click-indexing bug fixed this
  session (affects only the probe's button-sweep labeling in past runs; all review
  conclusions came from by-id targeted scripts).
