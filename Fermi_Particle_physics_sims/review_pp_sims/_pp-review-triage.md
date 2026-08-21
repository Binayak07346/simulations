# Fermi PP sims — full-sweep triage (all nine re-reviewed & fixed)

Re-review sweep completed 2026-08-21 with the `review-fermi-pp-sims` skill (headless-Chrome
evidence via `_review/browser-probe.mjs` + per-sim targeted flow scripts; Claude-in-Chrome
extension unavailable this session). Every finding below was FIXED in place the same
session and re-verified in the browser; details + evidence in each `<sim>-review.md`.

| Sim | Physics verdict | Findings fixed (P0/P1/P2) | Worst issue found |
|---|---|---|---|
| Build_Baryon | exact (PDG tables, Pauli/Ω⁻ story) | 0/2/5 | heavy-sector threshold used 2m_q, undershooting the named particle (J/ψ 2.5 vs 3.1 GeV) |
| Charged_particle_in_a_magnetic_field_v2 | exact numerics; **curl labels inverted** | **1 PHY-P0**/1/0 | curl readout/cards contradicted the (correct) drawn tracks; plate was one-shot |
| Eigenfold_way_v2 | flawless (all 26 placements exact) | 0/0/2 | card-6 wording vs auto-recentered axis toggle |
| Feynmann_diagram_sandbox | exact (rules, √α, propagator) | 0/0/2 | tripled "drawing convention" caption; structure violation not shown first |
| Gold_foil_exp_v3 | exact (histogram measured = Rutherford) | 0/1/1 + 5 user-reported | readouts fractured mid-number; ring/bars clipped at wide windows |
| Relativistic_kinematics | exact (invariants, decays, boosts) | 0/1/1 | prediction feedback referenced a ghost circle that had already faded |
| Scale_of_universe | exact (E=hc/λ ladder, dual coupling) | 0/0/1 | canvas ignored light theme (title illegible) |
| Standard_model | exact (17 particles PDG; Lagrangian) | 0/0/1 | light-theme tile glyphs washed out (documentElement theme-var bug) |
| Wu_exp | exact (Brillouin, ½APβ, signs) | 0/2/0 | mirror coil labeled "reversed" — inconsistent with its own horizontal-mirror geometry; sliders silently stopped the run |

**Cross-cutting patterns worth remembering**
- `documentElement` vs `body` theme-var reads bit THREE sims (Scale, Standard_model, and
  latently Wu's `cssVar`) — the theme class toggles on `body`; any canvas `css()` helper
  must read from `document.body`.
- The shell default `restartOnParamChange: true` is wrong for accumulator-style sims
  (Wu); the sibling pattern is `false` + explicit statistics-clear in slider handlers.
- The review probe itself was hardened twice during the sweep (identity-based button
  clicking; float-tolerant persistence comparison) — earlier probe "persistence
  failures" on Feynman/Gold-foil/Relativistic were probe artifacts, each disproven by
  targeted by-id tests.

**Console errors across all nine: zero. All flows (mode round-trips, resets, sliders
mid-run, drag interactions, inquiry gates) verified clean post-fix.**
