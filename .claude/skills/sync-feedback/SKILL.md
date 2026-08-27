---
name: sync-feedback
description: Pull reviewer feedback from the Sims_Feedback Google Sheet (tabs PP/QM/SR/CM) and regenerate a triage-structured feedback.md in each course's folder — one section per sim, split into Physics vs Non-Physics, then P0/P1/P2. All categorization happens inside the current Claude Code session (no separate API cost). Use when the user invokes /sync-feedback, /sync-feedback <course>, or asks to "sync reviewer feedback", "pull the latest bugs from the sheet", "refresh the feedback.md files".
---

# /sync-feedback — sync reviewer notes from the sheet into per-course feedback.md

Pull the latest reviewer feedback from the Sims_Feedback Google Sheet, triage each
note against the P0/P1/P2 rubric YOU (Claude) apply in-session, and regenerate one
`feedback.md` per course folder ready to open in Cursor.

**Never asks a separate LLM** — triage is done in the same Claude turn that runs
this skill, so there is no extra API cost. Everything else (fetch, parse, write) is
plain Bash/Python one-liners.

## When to use

- `/sync-feedback` — sync all four courses.
- `/sync-feedback PP` (or QM/SR/CM) — sync one course only.
- `/sync-feedback PP QM` — sync a subset.
- Any user request like "pull latest feedback", "refresh the .md files", "sync the
  sheet into Cursor", "regenerate the feedback triage".

If invoked on its own with no arg, default to ALL four courses.

## Constants (baked in — update in this file if URLs or paths change)

The Google Sheet is published-to-web per tab as CSV. If the user ever republishes,
the URLs below are the source of truth; edit them here.

```
PP  https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7dThpCdKIQexGehQj0094ZJect3gkpG7tuo9ygywNs5fsTDVeMvw-txTKjF7MVr7vgM-0_6QZvIWo/pub?gid=1831774232&single=true&output=csv
QM  https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7dThpCdKIQexGehQj0094ZJect3gkpG7tuo9ygywNs5fsTDVeMvw-txTKjF7MVr7vgM-0_6QZvIWo/pub?gid=1270591113&single=true&output=csv
SR  https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7dThpCdKIQexGehQj0094ZJect3gkpG7tuo9ygywNs5fsTDVeMvw-txTKjF7MVr7vgM-0_6QZvIWo/pub?gid=551662187&single=true&output=csv
CM  https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7dThpCdKIQexGehQj0094ZJect3gkpG7tuo9ygywNs5fsTDVeMvw-txTKjF7MVr7vgM-0_6QZvIWo/pub?gid=220760794&single=true&output=csv
```

Output paths (write `feedback.md` here — overwrite each run):

```
PP  Fermi_Particle_physics_sims/Sims_v2_lecture_versions/feedback.md
QM  Capacity_Quantum_simulations/Sims_user_versions/feedback.md
SR  Capacity_SR_sims_v2_engine/shell-versions/feedback.md
CM  Capacity_CM_simulations/feedback.md
```

Human names (for the `.md` heading):
`PP`→Particle Physics, `QM`→Quantum Mechanics, `SR`→Special Relativity, `CM`→Classical Mechanics.

## Procedure

For each course code requested:

### 1. Fetch the CSV and parse it into structured notes

Run this in Bash (fill in `$URL` from the constants block) — it prints JSON to stdout:

```bash
python3 - <<'PY'
import csv, io, re, json, urllib.request, sys
URL = "<paste-course-url-here>"
text = urllib.request.urlopen(URL, timeout=30).read().decode("utf-8")
r = csv.reader(io.StringIO(text))
header = next(r)
notes = []
for row in r:
    if not row: continue
    sim = row[0].strip()
    if not sim: continue
    for i, cell in enumerate(row[1:11]):
        cell = (cell or "").strip()
        if not cell: continue
        m = re.match(r"^\s*\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?)\]\s*", cell)
        date, text_ = (m.group(1), cell[m.end():].strip()) if m else ("", cell)
        notes.append({"sim": sim, "version": header[i+1], "date": date, "text": text_})
print(json.dumps(notes, ensure_ascii=False))
PY
```

Fetch all requested courses in parallel using multiple Bash calls in one message
when convenient — but do NOT parallelize the categorization step; that's yours to
do inline.

### 2. Triage each note in-session (this is the LLM-free part)

For every note, decide (using ONLY the reviewer's own words — do not speculate):

**Category:**
- `physics` — the reviewer flagged a physics-correctness or physics-pedagogy issue:
  wrong number/sign/trend/animation, misleading physics claim, missing physics
  affordance a student needs, incorrect equation display, card/label teaching a
  misconception.
- `non-physics` — anything else: broken control, dead slider, crash, layout/overlap,
  silent state reset, missing feature/enhancement request, UX polish, notation
  cosmetics, guided-inquiry flow issues, general suggestions.

**Severity** (matches the review-pp-v2-sims / review-fermi-pp-sims skills' rubric):
- `P0` — wrong physics a student would absorb (wrong value/sign/trend/animation),
  OR a dead/broken feature, crash, or flow that destroys user state/content.
- `P1` — real gap hurting correctness, learning, or usability: silent config reset,
  slider only effective after reset, missing planned affordance, overlapping labels,
  misleading default.
- `P2` — polish: cosmetics, notation, minor layout, nice-to-haves, feature enhancements.

**One-liner:** compact ≤14-word restatement of the note. No speculation.

Ambiguity rule: if the reviewer's note is vague ("something feels off"), keep the
LOWER severity (safer default is P2) and NON-PHYSICS. Never invent detail.

### 3. Assemble the markdown

For each course, build the file body in this exact structure. Only include sims that
have at least one note — do NOT list every sim in the course. If a course has zero
notes total, still write the file but with a single line saying no feedback yet.

```markdown
# <Human course name> — reviewer feedback

_Synced from Sims_Feedback / tab `<CODE>` on <YYYY-MM-DD HH:MM> (local time)._  
_Regenerated by the `sync-feedback` skill — do not edit by hand; changes will be overwritten on the next sync._

## <Sim name exactly as it appears in the sheet's column A>

### Physics
- **P0:**
  - `v<N>` · <YYYY-MM-DD HH:MM> — <one-liner>
    > <verbatim reviewer text>
- **P1:**
  _(none)_
- **P2:**
  _(none)_

### Non-Physics
- **P0:**
  _(none)_
- **P1:**
  - `v<N>` · <YYYY-MM-DD HH:MM> — <one-liner>
    > <verbatim reviewer text>
- **P2:**
  _(none)_

## <Next sim>
...
```

Notes for rendering:
- Order sims by first appearance in the sheet (top-down).
- Within each bucket, order notes oldest → newest.
- Empty buckets get `_(none)_` on the line below the bullet (keeps all six buckets
  visible so the reviewer can see coverage at a glance).
- Always include the `>` blockquote of the verbatim reviewer text so the reader can
  double-check your categorization against the source.

Write the file with the `Write` tool. `mkdir -p` the parent directory first if the
folder somehow doesn't exist yet (shouldn't happen, but be safe).

### 4. Report to the user

One line per course processed:
```
[PP] N note(s) across M sim(s) → <relative path to feedback.md>
```
At the end print a total, then stop. Do NOT open the .md files or dump their bodies
into the chat — the user reads them in Cursor.

If any course had zero notes, still emit its line (`0 note(s) across 0 sim(s)`) so
the user knows it was checked.

## Rules

- **Never invent or embellish**. If the reviewer wrote three words, you get three
  words to categorize. Don't add technical context they didn't write.
- **Idempotent overwrite**. Always overwrite the target `feedback.md`; never append.
  Stale entries removed from the sheet must disappear from the .md.
- **URL updates go in this file only**. The four CSV URLs are baked into the
  constants block above. If the user reports "wrong sheet" or republishes, ask
  which URLs changed and edit this file — no other source of truth.
- **Argument parsing**. Accept course codes case-insensitive (`pp`, `PP`, `Pp`
  all map to `PP`). Unknown codes → report error and skip.
- **No API calls**. Don't call the anthropic SDK or any external LLM endpoint —
  YOU are the LLM in this session. Fetch + parse + write are Bash/Python only.
- **Do not commit** the resulting `feedback.md` files unless the user explicitly
  asks. They are triage scratchpads, not shipped artifacts.
- **Don't edit sim HTML**. This skill NEVER touches sim files. Its only outputs
  are the four `feedback.md` files.
- **Fetch failure** (network error, non-200): print the error, skip that course,
  keep going with the rest. Do not delete or overwrite an existing `feedback.md`
  when the fetch failed — leave the previous triage in place.

## Related

- Pipeline architecture and how the sheet is populated: `[[sims-feedback-pipeline]]`
- Severity rubric (canonical): `review-fermi-pp-sims` and `review-pp-v2-sims` skills.
