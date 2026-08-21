# Fermi Particle-Physics Course Context

Distilled from `Particle Physics Syllabus and Course Planning.xlsx` (sheets: Syllabus V2,
Syllabus brainstorm, Lessons + Resources, Simulation Descriptions). This is the ground truth
for each sim's **planned scope** — review every sim against its entry here. A sim that works
but doesn't deliver its planned scope / learning objective / inquiry-question affordances has
a pedagogy finding.

## Course arc (Syllabus V2, lectures 1–11 drafted; brainstorm fills 12–24)

1. Why Particle Physics? — LHC, Higgs discovery, Standard Model overview
2. Scales — de Broglie wavelength; high momenta ↔ short distances; collider constraints
3. Scattering to Probe Structure — elastic/inelastic, cross sections, Geiger-Marsden
4. Rutherford Scattering Formula — Fermi's Golden Rule, matrix elements
5. Units for Particle Physicists — natural units, eV, ħ=c=1
6. Relativistic Kinematics — four-vectors, invariants, decays in ZMF and lab frame
7. Relativistic QM — Klein-Gordon equation, negative-energy solutions
8. The Dirac Equation — spinors, 4×4 matrices
9. Solving the Dirac Equation — gamma matrices, spin, negative-energy solutions
10. Antiparticles — Dirac-sea holes, positron discovery, cloud chamber
11. Pair Production — creation/destruction of matter, invariant mass
12+ (brainstorm): QED/Feynman diagrams, cosmic rays & strange particles, quark model /
    eightfold way, DIS, QCD, beta decay & parity (Wu), neutrinos, symmetry breaking,
    electroweak, building the SM, Higgs, beyond-SM, future colliders

## Per-sim reference (file → plan)

### Standard_model.html — "Exploring the Standard Model" (Lecture 1)
- **Planned scope:** Two modes. (1) SM tile table — click a particle tile → mass, charge,
  spin, year of discovery, short discovery tidbit; tiles color-coded by type (lepton, quark,
  boson, Higgs). (2) Condensed SM Lagrangian — hover/click a term expands it to a more
  verbose form with a plain-language description ("gluon interactions that conserve color
  charge", "coupling to EM forces").
- **Params:** none planned. **Learning mode:** Guided Inquiry.
- **LO:** Summarize the Standard Model and what "experimentally well-tested" means.
- **Inquiry affordances to verify:** patterns in mass/charge across families must be visible
  (comparable units, ordered generations); familiar vs new particles distinguishable.

### Scale_of_universe.html — "Scale of the Universe" (Lecture 2)
- **Planned scope:** Zoom from Earth down to quark scale; pinned landmarks (Earth, human,
  hair, cell, virus, molecule, atom, nucleus, quarks). Info panel tracks length scale,
  energy required to probe that length, imaging technology (visible light, x-ray, electron
  microscope, collider), and strength of the fundamental forces at that scale.
- **Params:** scale OR probe energy — the two sliders must stay consistent with the inverse
  relation (the point of the sim). **Learning mode:** Lecture Display.
- **LO:** Explain how higher momenta probe shorter distances.
- **Inquiry affordances:** order-of-magnitude comparisons readable off the log ruler; why
  quarks still can't be "seen".

### Gold_foil_exp_v3.html — "Geiger-Marsden Gold Foil Experiment" (Lectures 3–4)
- **Planned scope:** Run the experiment; alpha scintillation pattern builds up vs angle and
  maps onto the Rutherford scattering formula. Side-by-side/plum-pudding comparison mode.
- **Params:** alpha momentum/energy; plum-pudding vs nuclear model. **Visuals:** alpha
  source, gold foil, detection film. **Learning mode:** Guided Inquiry.
- **LO:** Connect the experiment to the Rutherford scattering formula.
- **Inquiry affordances:** angular distribution data good enough to conclude nuclear
  structure and estimate nucleus size; large-angle events present in nuclear mode, absent
  in plum-pudding mode.

### Relativistic_kinematics.html — "Relativistic Kinematics" (Lecture 6)
- **Planned scope:** Decays/collisions in the zero-momentum frame and the lab frame under
  various boosts; energy-momentum conservation. Derived from the SR course L16-s1
  energy-momentum-conservation shell sim.
- **LOs:** compute relativistic E and p in natural units; four-vectors, boosts, invariants.
- **Inquiry affordances:** should let a student see which decays are kinematically
  prohibited; invariant mass the same in every frame.

### Charged_particle_in_a_magnetic_field_v2.html — "Virtual Cloud Chamber" (Lecture 10)
- **Planned scope:** Variable B field; metal plate that slows passing particles (gives
  direction of approach — the Anderson positron signature); choose which particles to put
  in; interpret/match tracks by momentum and deflection. Ghost tracks persist for
  comparison.
- **Params:** B field; particle type (charge & mass); kinetic energy. **Learning mode:**
  Guided Inquiry.
- **LO:** Interpret negative-energy solutions as antiparticles.
- **Inquiry affordances:** particle vs antiparticle distinguishable by curvature sense;
  B-strength vs radius; heavy vs light distinguishable.

### Feynmann_diagram_sandbox.html — "Feynman Diagram Sandbox" (Lecture ~12)
- **Planned scope:** Drag interactions/particles into a diagram builder; simple
  interactions only (tree/one-loop); amplitude/cross-section shown off to the side; scrub
  through time.
- **Inquiry affordances:** invalid vertices must be rejected (or clearly flagged) —
  conservation of charge, lepton number, baryon number at each vertex is the lesson.

### Eigenfold_way_v2.html — "Navigating the Eightfold Way" (Lecture ~14)
- **Planned scope:** Sort particle tiles by their symmetries; gaps in the pattern point to
  predicted particles; when a student finds a gap, the predicted (later discovered)
  particle is revealed. Side panel with prediction/discovery info on tile click.
- **Params:** none planned. **Learning mode:** Guided Inquiry.
- **Inquiry affordances:** patterns in charge and strangeness must emerge from the layout
  (axes/ordering consistent with S vs I₃ multiplet plots); the Ω⁻ gap story.

### Build_Baryon.html — "Build-A-Baryon" (Lectures ~14/21)
- **Planned scope:** Combine quarks → baryons (qqq) or quark-antiquark → mesons. On
  discovery, show properties (mass, spin, lifetime, decay modes) + real discovery story.
  Heavy sector allowed; theoretical/undiscovered combos revealed with an estimate of the
  energy needed to create them.
- **Params:** Baryon vs Meson mode. **Learning mode:** Guided Inquiry.
- **Inquiry affordances:** which combinations aren't possible / haven't been discovered,
  and why.

### Wu_exp.html — "Wu Experiment and the Death of Parity" (Lecture ~17)
- **Planned scope:** Cold Co-60 nuclei in a strong B field beta-decay to Ni-60 emitting
  electrons + antineutrinos. Spins random at low field/high temp, align as polarization
  increases. Detection histogram of electrons N vs S; cumulative asymmetry factor that
  approaches the real measured value as spins align. Mirror toggle: the mirrored setup
  reverses spin (axial vector) but not emission direction, so the mirror world is
  distinguishable → parity violated.
- **Params:** polarization (B strength); mirror toggle. **Learning mode:** Guided Inquiry.
- **Inquiry affordances:** "what would you expect if P were conserved" must be answerable
  from the sim (symmetric emission limit at zero polarization / conserved-P reference).

## Not yet built (don't expect files): How To Make a Particle (pair production), Wine
Bottle Potential, Particle Detector Headquarters, Virtual Particle Collider, Dirac's Sea
of Electrons, Spin and Helicity, KG-solution plotter, photoelectric effect, galaxy
rotation curves.
