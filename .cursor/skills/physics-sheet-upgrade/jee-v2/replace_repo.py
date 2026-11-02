#!/usr/bin/env python3
"""Copy gate-clean, freshly re-run JEE finals into Fermi_testprep_jee_sims/<Module>/<file>.html (existing files only).
   python3 replace_repo.py [--stamp ~/jee-physics-v2/rerun4.stamp] [--dry]
A sim is copied only when gates.json is newer than the stamp, clean (guide fails N1 or L4+N1, landing/lastcard/fallback/sheet_final/app_mode PASS),
the output has the Ask AI Tutor pill, no TODO-AUTHOR, and no header subtitle span. Idempotent; ledger in ~/jee-physics-v2/replaced.json.
Never commits. Backup of the pre-replace folder: ~/Downloads/jee-repo-backup_2026-10-07_pre-replace."""
import json, os, pathlib, re, shutil, sys
HERE = pathlib.Path(__file__).resolve().parent; REPO = HERE.parents[3]
ROOT = pathlib.Path(os.path.expanduser('~/jee-physics-v2')); TP = REPO / 'Fermi_testprep_jee_sims'
stamp = pathlib.Path(os.path.expanduser(sys.argv[sys.argv.index('--stamp') + 1])) if '--stamp' in sys.argv else ROOT / 'rerun4.stamp'
DRY = '--dry' in sys.argv
roster = json.load(open(HERE / 'roster.json')); led_p = ROOT / 'replaced.json'
led = json.load(open(led_p)) if led_p.exists() else {}
SUB = re.compile(r'<div class="shell-title"[^>]*>[^<]*<span')
new, held = [], []
for r in roster:
    s = r['slug']; F = ROOT / 'work' / s / 'final'; gj = F / 'gates.json'; src = F / f'{s}.user-version.html'
    if not gj.exists() or gj.stat().st_mtime <= stamp.stat().st_mtime: held.append((s, 'not re-run yet')); continue
    g = json.load(open(gj)); h = src.read_text() if src.exists() else ''
    bad = []
    if sorted(g.get('guide_fails', [])) not in (['N1'], ['L4', 'N1']): bad.append('guide ' + ','.join(g.get('guide_fails', [])))
    bad += [f'{k}={g.get(k)}' for k in ('landing', 'lastcard', 'fallback', 'sheet_final') if g.get(k) != 'PASS']
    if 'id="ask-euler"' not in h: bad.append('no tutor pill')
    if 'TODO-AUTHOR' in h: bad.append('TODO-AUTHOR')
    if g.get('app_mode') != 'PASS' or 'id="fermi-app-mode"' not in h: bad.append('no mobile app-mode layer / gate (re-run chain.py)')
    if 'class="phys-title-row"' not in h and not str(g.get('sheet_header', '')).startswith('skipped'): bad.append('no one-line sheet header (re-run chain.py)')
    if SUB.search(h): bad.append('subtitle span present')
    if bad: held.append((s, '; '.join(bad))); continue
    dst = TP / r['module'] / (r['file'] + '.html')
    if not dst.exists(): held.append((s, 'repo file missing: ' + str(dst))); continue
    if dst.read_bytes() == h.encode(): continue
    if not DRY: shutil.copy2(src, dst); led[s] = os.path.getmtime(gj)
    new.append(s)
if not DRY: json.dump(led, open(led_p, 'w'), indent=1)
print(f'copied {len(new)} now; ledger total {len(led)}; held {len(held)}')
for s, w in held:
    if w != 'not re-run yet': print('  HELD', s, w)
