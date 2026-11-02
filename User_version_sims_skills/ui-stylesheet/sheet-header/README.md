# One-line Physics sheet header (owner 2026-10-13)

A port of sim-builder's `tools/ux.py sheet_header()` for the user-version sims. In the Physics sheet, the header becomes ONE
line: the sim's own title, **"Learn this with the AI tutor"** (the tutor link `<a id="ask-euler">` moved here from the top bar:
same element, same href or pending marker), the icon-only download, and ✕. The bar is 71 px tall instead of 94, and the top bar
loses its "Teach me" button (it often stops wrapping as a result).

- `sheet_header.py <in> <out>` | `--check <files>`: applies it by replacing exact spans, with a line-level proof that nothing
  else changed. It is idempotent and skips (without touching) sims that have no sheet or no single tutor link. It handles
  the shell header (`.shell-title`) and the QM `.top-bar` (`<h1>`), with either attribute order on the tutor link and either
  `shell-btn` or `phys-btn` sheet buttons.
- `sheet-head.html`: sim-builder's `sb-sheet-head` style block, **byte-identical**.
  `sheet-head-fit.html`: its live-fleet companion. It keeps the label visible against the older ≤1200 px top-bar rule and
  keeps the header on one line on phones.
- `sheet_header_check.mjs <before> <after> [--shots dir]`: the gate. It checks:
  - desktop 1440/1100 layout outside the top bar and the sheet is unchanged;
  - the tutor link left the bar and keeps the same link;
  - one line, ≤ 80 px, label visible;
  - Download and ✕ work;
  - on a phone, the sheet opens full screen and keeps the tutor;
  - no new page errors.
- **Order in a build:** ui-stylesheet (+ its gates) → **sheet header** → mobile app mode (v1.1.1+, which leaves a sheet-hosted
  tutor in place). The jee-v2 and ai-v2 `chain.py` do this; delivery holds finals without it.
- **Live rollout 2026-11-02:** 362 live sims (Circuit Lab has no sheet), same playbook as mobile app mode:
  fetch with ETags → build → byte proof → both gates → backup → canary → IfMatch push → verify → repo sync in place.
