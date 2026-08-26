# Curriculum — authoritative source of truth for review-pp-v2-sims

Contents:
- **`Particle Physics Syllabus and Course Planning.xlsx`** — the authoritative course
  curriculum (7 sheets: Syllabus V2, Syllabus brainstorm, Lessons + Resources,
  Timeline, Simulation Descriptions, Misc Problem Statement, Misc Tutorial Ideas).
- **`curriculum-extract.md`** — a full machine extract of every non-empty row of every
  sheet (pipe-separated cells) so the reviewer can grep it without xlsx tooling.
  Regenerate after any xlsx update (openpyxl one-liner; see the extract header).

Reviewer usage: the **Simulation Descriptions** sheet is the per-sim requirements
source (description, adjustable params, key visuals, learning mode, inquiry
questions); **Syllabus V2** (lectures 1–11) and **Syllabus brainstorm** (1–24) supply
the learning objectives and lecture mapping. Where a sim's row is empty or marked
scrapped (e.g. Virtual Particle Collider), derive the LO from the sim's Info modal and
say so in the report.
