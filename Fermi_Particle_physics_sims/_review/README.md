# _review — particle-physics sim review kit

Used by the Cursor rule `.cursor/rules/review-pp-sims.mdc` (open a sim and ask Cursor to
"review this sim" / "review all the PP sims") and mirrored by the Claude Code skill
`review-fermi-pp-sims`.

- `course-context.md` — distilled course-planning Excel: per-sim planned scope, params,
  learning objectives, inquiry questions. Ground truth for pedagogy findings.
- `browser-probe.mjs` — headless-Chrome evidence gatherer:
  `node _review/browser-probe.mjs <sim>.html _review/probe-out`
  Screenshots every control state, clicks every button, tests state persistence
  (silent-reset flow bugs), scans DOM overlaps, checks a 1100px layout.
  Needs puppeteer-core (auto-resolved from the repo installs) + system Chrome.
- `probe-out/` — generated evidence (gitignore-able).

Reviews are read-only; output is `review_pp_sims/<sim>-review.md` with bugs grouped
PHYSICS / NON-PHYSICS, tiered P0/P1/P2, stable IDs (PHY-P0-1, NP-P1-2, …) that fix
prompts can reference directly.
