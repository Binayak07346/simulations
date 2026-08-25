# Review — Collisions

**System:** 1-D two-body collisions — elastic (KE conserved), inelastic with coefficient of restitution e, perfectly inelastic (stick), and explosion (internal energy Q → KE); Galilean frame boost; guided inquiry targeting the misconception "KE lost ⇒ momentum lost."

**Verdict:** Core collision model is correct. Elastic, inelastic, and explosion formulas all match the canonical forms. Momentum is conserved in every mode and every frame. One P1: the "Worked" section in ∑ Formal shows lab-frame Σp/ΣKE values even when the frame caption says "Moving frame."

**Browser-probe:** Not run (node unavailable in this environment). Code-only review with analytic cross-checks.

---

## PHYSICS

### P0
None.

### P1
- **[high] Formal "Worked" section uses lab-frame values in a boosted frame** (`renderFormal`, lines 1264–1270; `katexFallback`, lines 1226–1234). Both code paths call `computePhysics()` (which returns lab-frame quantities) without applying `boost(p, S.boost)`. The caption at line 1263 reads `"Worked: current values — " + frameNameHtml(S.boost)`, so when v_b ≠ 0 the header says "Moving frame (v_b = …)" but the rendered Σp and ΣKE values are still the lab-frame numbers. ΔKE is accidentally correct (frame-invariant), but the individual Σp_before, Σp_after, ΣKE_before, ΣKE_after are wrong for the stated frame.
  Example: defaults (m₁=m₂=1, u₁=+2, u₂=−2, e=0) with v_b=+1 → lab Σp = 0 → 0, but boosted Σp = −2 → −2; the section shows 0, labelled "Moving frame."
  → **Fix:** In `renderFormal` (and `katexFallback`), boost the physics particles before summing:
  ```js
  const vb = S.boost;
  const beforeB = phys.before.map(p => boost(p, vb));
  const afterB  = phys.after.map(p => boost(p, vb));
  ```
  then sum `beforeB`/`afterB` for `pB`, `pA`, `keB`, `keA`. The main readout panels (`buildTable`, `buildInvariant`, `buildRestEnergy`) already do this correctly (line 1205–1206).

### P2
None.

---

## NON-PHYSICS

### P0
None.

### P1
None.

### P2
- **[low][functional] Dead variable `VB` in `buildTable`** (line 1134). `VB = sum(beforeB, 'v')` is computed but never rendered. Summing velocities is not physically meaningful. Harmless, but noisy.
  → **Fix:** Remove the `VB` assignment.

- **[low][ux] No collision flash for the perfectly inelastic case (e < 0.02).** The elastic and partial-inelastic (e ≥ 0.02) paths get a brief radial-tick flash at the contact point (lines 1082–1101). The perfectly inelastic path falls through to the generic `else` branch (line 1103), so two approaching discs become one product disc with no visual contact event. Not incorrect, but visually abrupt compared to the other modes.
  → **Fix:** Add a brief flash at the merge point (reuse the existing flash code gated on `Math.abs(S.progress - 1) / 0.05`).

- **[low][pedagogy] "heavy-on-light" explore bullet approximation** (line 586): "set m₁ = 5, m₂ = 0.5, u₂ = 0 — watch v₂′ → 2u₁." With the available slider extremes (m₁/m₂ = 10), v₂′ = 2·5·u₁/5.5 ≈ 1.82 u₁, which is ~9% below 2u₁. The "→" correctly denotes a limit, but a student using these exact values may expect v₂′ ≈ 4.0 and see ≈ 3.6. Consider appending "(limiting case as m₁ ≫ m₂)" to set expectations.

---

## Analytical cross-checks (in lieu of browser probe)

| Check | Canonical | Code | Match? |
|---|---|---|---|
| Elastic v₁′ | ((m₁−m₂)u₁ + 2m₂u₂)/(m₁+m₂) | line 959 | ✓ |
| Elastic v₂′ | ((m₂−m₁)u₂ + 2m₁u₁)/(m₁+m₂) | line 960 | ✓ |
| Inelastic v₁′ (restitution e) | ((m₁−em₂)u₁ + (1+e)m₂u₂)/(m₁+m₂) | line 970 | ✓ |
| Inelastic v₂′ (restitution e) | ((m₂−em₁)u₂ + (1+e)m₁u₁)/(m₁+m₂) | line 971 | ✓ |
| e=1 reduces to elastic | v₁′ = elastic formula | algebra ✓ | ✓ |
| e=0 reduces to v_cm | v₁′ = v₂′ = (m₁u₁+m₂u₂)/M | algebra ✓ | ✓ |
| Perfectly inelastic v_cm | (m₁u₁+m₂u₂)/(m₁+m₂) | line 966 | ✓ |
| Explosion p* | √(2μQ), μ = m₁m₂/M | line 948 | ✓ |
| Explosion KE_after = Q | p*²/(2m₁) + p*²/(2m₂) = Q | algebra ✓ | ✓ |
| Explosion Σp = 0 | m₁(p*/m₁) + m₂(−p*/m₂) = 0 | lines 949–950 | ✓ |
| ΔKE formula | −½μ(1−e²)u²_rel | line 1142 | ✓ |
| ΔKE frame-invariant | ΔKE′ = ΔKE − v_b·ΔP; ΔP=0 ⇒ ΔKE′=ΔKE | physics ✓ | ✓ |
| Galilean boost | v′ = v − v_b; p,KE recomputed | `boost()` line 938 | ✓ |
| v_cm | (m₁u₁+m₂u₂)/M | line 1187, 1471, 1521 | ✓ |
| Momentum conserved (code) | Σp_before − Σp_after < 10⁻⁶ | `pOk` line 1136 | ✓ |
| Equal-mass elastic swap | v₁′=u₂, v₂′=u₁ | algebra on line 959–960 | ✓ |
| Slider boundaries | m∈[0.5,5], v∈[−5,5], e∈[0,1], Q∈[0,10], v_b∈[−5,5] — no ÷0 | HTML lines 622–672 | ✓ |

### Numerical spot-check (defaults: m₁=m₂=1, u₁=+2, u₂=−2, e=0)
- Σp_before = 1·2 + 1·(−2) = 0; Σp_after = 2·0 = 0 ✓
- ΣKE_before = ½·1·4 + ½·1·4 = 4 J; ΣKE_after = 0 J ✓
- ΔKE = −4 J; formula ½μ(1−e²)u²_rel = ½·0.5·1·16 = 4 J ✓

---

## Browser-test evidence
Browser probe could not be run (node not available in this environment). The findings above are code-analysis only; the P1 (Formal section frame mismatch) can be confirmed by opening ∑ Formal with a non-zero v_b.

## To verify (human)
- Open ∑ Formal with v_b ≠ 0 and confirm the "Worked" Σp and ΣKE numbers disagree with the Momentum & energy table (which is correct).
- Confirm the perfectly inelastic animation (e=0) merges smoothly enough for lecture use.
- Run the browser probe when node is available to check console errors, slider sweeps, and screenshot evidence.
