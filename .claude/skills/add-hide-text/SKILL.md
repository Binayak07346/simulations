---
name: add-hide-text
description: Install the "Hide Text" checkbox + empty hide-registry into CM lecture sims AND the v2 particle-physics sims (Fermi_Particle_physics_sims/Sims_v2_lecture_versions/) — one sim, a list, or "all" — following the canonical spec in .cursor/rules/hide-text-checkbox.mdc. Also handles the later "register" step — putting named text items into a sim's hide container. Use when asked to add the Hide Text checkbox/container, roll it out across sims, or register/hide specific labels. Install mode NEVER hides anything — the container ships empty.
---

# Add Hide-Text container (CM sims + v2 particle-physics sims)

**Canonical spec: `.cursor/rules/hide-text-checkbox.mdc` — read it FIRST, follow it
exactly.** This skill is the executor; the MDC is the single source of truth for the
markup, CSS, wiring script, registry format, naming tokens, and rules. If the two ever
disagree, the MDC wins.

## Mode 1 — install (default)

Given one sim, a list, or "all":

1. Read the MDC. Resolve targets; for "all": CM = `Capacity_CM_simulations/*.html`
   minus `index.html`, `vendor/`, `CM_lecture_sims_backup/`; particle physics =
   `Fermi_Particle_physics_sims/Sims_v2_lecture_versions/*.html` minus `index.html`.
   Both families carry the same anchors (`#shell-lecture`, `</header>`, `#shell`) —
   the PP sims got their Lecture button from `add-guided-inquiry-and-lecture-mode`.
2. Per sim, **idempotency check first**: if `id="ht-toggle"` is already present, skip
   and report "already installed".
3. Locate the three anchors and make exactly the MDC's three insertions:
   - markup after the `#shell-lecture` button,
   - CSS appended to the main `<style>` block (NOT the `data-sim-fonts` style, and
     never near the base64 FONT blob line — grep for anchors, don't read that line),
   - registry comment + wiring script immediately after the top bar's `</header>`.
4. Change nothing else. No text is hidden at install time; physics is untouched.

### Verify (per sim)
- Grep: exactly one `ht-toggle`, one `HIDE-TEXT REGISTRY`, one `#shell.hide-text .ht-hide`.
- Browser smoke: CM — the bundled probe works unchanged
  (`node .claude/skills/review-CM-sims/browser-probe.mjs "<sim>" "<scratch-dir>"`);
  PP — use the Chrome/`onFrame`-driving pattern from `add-guided-inquiry-and-lecture-mode`
  (backgrounded tabs have frozen rAF). Either way: `errors: []`, checkbox beside 🎓 Lecture.
- **Boot default differs by family**: CM sims boot into lecture mode → checkbox CHECKED
  at load; PP sims boot into guided inquiry → the load-sync is inert and the checkbox
  is UNCHECKED at load (correct — text visible by default). Hide Text stays independent
  of the 🎓 Lecture toggle in PP; do not couple them unless explicitly asked.
- For one deeper check (first install / spot checks): assert that clicking `#ht-toggle`
  toggles class `hide-text` on `#shell`, with zero console errors and no visual change
  (registry is empty).

### Batch report
End with a table: sim · installed / already present / skipped (+why) · probe errors.

## Mode 2 — register (later, on explicit request only)

When asked to put specific texts into a sim's container ("register/hide X in <sim>"):
- DOM text → add class `ht-hide`; canvas text → wrap the draw call in `if(!HT()){ … }`.
- Text only — never gate physics, geometry, or marker shapes unless explicitly asked.
- Append one line per item to that sim's `HIDE-TEXT REGISTRY` comment (replace the
  "(empty …)" line on first registration). The registry must always list exactly what
  is registered — it is the reversibility manifest for the user-facing builds.
- Verify in the browser: checked → items gone; unchecked → items back; `errors: []`.

## Hard rules
- Install mode never hides or deletes anything.
- Hide-only, ever — this mechanism must stay fully reversible.
- Never modify physics code, the shell loop, or the auto-lecture script.
- These files are ~300 KB with a giant base64 font line — work by grep + targeted
  edits, never read the blob.
