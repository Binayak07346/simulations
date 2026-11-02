#!/usr/bin/env python3
"""Deliver finished JEE v2 sims.  python3 deliver.py <slug ...|--all> [--root ~/jee-physics-v2] [--out ~/Downloads/jee-user-version] [--dry]
Copies work/<slug>/final/<slug>.user-version.html to <out>/<Module>/<file>.html (roster module + file), only when gates.json is
clean (guide fails exactly L4+N1, landing/lastcard/fallback/sheet_final/app_mode PASS, no TODO-AUTHOR). Never touches Module-*/.
Writes <out>/ROLLUP.md: one gate row per sim + every `SME:` / `KIT_ISSUE:` line found in <root>/reports/*.md (batch reports saved by the
coordinator) and in work/<slug>/REPORT.md.  Existing files are moved to <out>/_replaced/<timestamp>/ first, never deleted."""
import json, os, pathlib, re, shutil, sys, time
HERE = pathlib.Path(__file__).resolve().parent
args = sys.argv[1:]
def opt(k, d):
    return pathlib.Path(os.path.expanduser(args[args.index(k) + 1])) if k in args else pathlib.Path(os.path.expanduser(d))
ROOT = opt('--root', '~/jee-physics-v2'); OUT = opt('--out', '~/Downloads/jee-user-version'); DRY = '--dry' in args
skip = {ROOT, OUT}; vals = {str(ROOT), str(OUT)}
slugs = [a for a in args if not a.startswith('--') and a not in vals and os.path.expanduser(a) not in vals]
roster = {r['slug']: r for r in json.load(open(HERE / 'roster.json'))}
if '--all' in args or not slugs: slugs = [s for s in roster if (ROOT / 'work' / s / 'final' / 'gates.json').exists()]

def clean(g):
    bad = []
    if sorted(g.get('guide_fails', [])) not in (['N1'], ['L4', 'N1']): bad.append('guide fails ' + ','.join(g.get('guide_fails', [])) + ' (' + str(g.get('guide')) + ')')
    for k in ('landing', 'lastcard', 'fallback', 'sheet_final'):
        if g.get(k) != 'PASS': bad.append(f'{k}={g.get(k)}')
    if g.get('app_mode') != 'PASS': bad.append(f"app_mode={g.get('app_mode')} (re-run chain.py: mobile app mode is its last step)")
    if g.get('sheet_header') != 'applied' or g.get('sheet_header_check') != 'PASS':
        if not str(g.get('sheet_header', '')).startswith('skipped'): bad.append(f"sheet_header={g.get('sheet_header')}/{g.get('sheet_header_check')} (re-run chain.py)")
    return bad

notes = {}   # slug -> [lines]
files = sorted((ROOT / 'reports').glob('*.md')) if (ROOT / 'reports').exists() else []
for s in slugs:
    p = ROOT / 'work' / s / 'REPORT.md'
    if p.exists(): files.append(p)
for f in files:
    cur = None
    for ln in f.read_text().splitlines():
        m = re.match(r'^[#*\s`]*([A-Za-z0-9][\w.\-]*)\s*\|', ln)   # header line: slug | sections | ...
        if m and m.group(1) in roster: cur = m.group(1)
        elif f.name == 'REPORT.md': cur = f.parent.name
        if cur and re.search(r'\b(SME|KIT_ISSUE):', ln): notes.setdefault(cur, []).append(ln.strip())

rows, delivered, held = [], [], []
stamp = time.strftime('%Y%m%d-%H%M%S')
for s in slugs:
    r = roster.get(s); D = ROOT / 'work' / s; F = D / 'final'; gj = F / 'gates.json'
    if not r or not gj.exists(): held.append((s, 'no gates.json (chain not run)')); continue
    g = json.load(open(gj)); src = F / f'{s}.user-version.html'; bad = clean(g)
    if not src.exists(): bad.append('no user-version.html')
    elif 'TODO-AUTHOR' in src.read_text(): bad.append('TODO-AUTHOR in output')
    if src.exists() and gj.stat().st_mtime < (D / 'built.html').stat().st_mtime: bad.append('gates older than built.html (stale)')
    if bad: held.append((s, '; '.join(bad))); rows.append((s, r, g, 'HELD')); continue
    dst = OUT / r['module'] / (r['file'] + '.html')
    if not DRY:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            old = OUT / '_replaced' / stamp / r['module']; old.mkdir(parents=True, exist_ok=True); shutil.move(str(dst), str(old / dst.name))
        shutil.copy2(src, dst)
    delivered.append(s); rows.append((s, r, g, 'delivered'))

L = [f'# JEE user-version roll-up ({time.strftime("%Y-%m-%d %H:%M")})', '',
     f'Delivered {len(delivered)} / {len(slugs)}; held {len(held)}. Target: `{OUT}/<Module>/<file>.html`. `Module-*/` in the repo is untouched.', '',
     '| slug | module | guide | landing | lastcard | fallback | sheet_final | status | SME/KIT |', '|---|---|---|---|---|---|---|---|---|']
for s, r, g, st in rows:
    n = len(notes.get(s, []))
    L.append(f"| {s} | {r['module']} | {g.get('guide')} | {g.get('landing')} | {g.get('lastcard')} | {g.get('fallback')} | {g.get('sheet_final')} | {st} | {n or ''} |")
if held:
    L += ['', '## Held (not delivered)'] + [f'- {s}: {why}' for s, why in held]
if notes:
    L += ['', '## SME questions and kit issues (from batch reports)']
    for s in slugs:
        for ln in notes.get(s, []): L.append(f'- **{s}**: {ln}')
if not DRY:
    OUT.mkdir(parents=True, exist_ok=True); (OUT / 'ROLLUP.md').write_text('\n'.join(L) + '\n')
print('\n'.join(L[:3])); print('held:', len(held)); [print('  ', s, why) for s, why in held[:20]]
