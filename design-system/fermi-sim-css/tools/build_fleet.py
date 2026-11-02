#!/usr/bin/env python3
"""Build every user-version sim onto the single stylesheet, from the repo copies (never edits them).

    python3 tools/build_fleet.py OUTDIR [--only rel1,rel2] [--shared]   (--shared: Wave 3, shared blocks -> stylesheet)

Each sim: spec fixes from fleet.json (exact, once) -> tools/apply.py --channel v1 --guide-mark
          [+ --layout qm-legacy] [+ --canvas-light] -> tools/check_static.py (spec fixes reversed first).
Writes OUTDIR/stage/<stage name>, OUTDIR/build.tsv (rel, stage name, S3 key, md5, options) and stops on any failure.
The S3 key comes from the stage catalogue (https://stage.fermi.ai/api/simulations-library/catalog).
"""
import hashlib, json, os, pathlib, re, subprocess, sys, tempfile, urllib.request

KIT = pathlib.Path(__file__).resolve().parent.parent
# SOURCES: the user-version sims BEFORE the stylesheet step (UX layers only). Since 2026-10-06 the repo folder holds the
# LIVE builds (synced from stage), so the clean sources live in a snapshot outside the repo; override with FERMI_SIM_SOURCES.
REPO = pathlib.Path(os.environ.get('FERMI_SIM_SOURCES', os.path.expanduser('~/Desktop/user-version-sims-backup_2026-10-05/sims-ux-sources_2026-10-06')))
cfg = json.loads((KIT / 'fleet.json').read_text())
out = pathlib.Path(sys.argv[1]); (out / 'stage').mkdir(parents=True, exist_ok=True)
SHARED = '--shared' in sys.argv
only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
cat = json.load(urllib.request.urlopen('https://stage.fermi.ai/api/simulations-library/catalog'))['sims']
by = {}
for c in cat: by.setdefault(c['filename'].split('/', 1)[1], []).append(c)
rows, bad = [], []
for f in sorted(REPO.glob('*/*.html')):
    rel = str(f.relative_to(REPO))
    if only and rel not in only: continue
    sb = cfg['stage_name'].get(rel, f.name); c = by.get(sb, [])
    if len(c) != 1: bad.append(f'{rel}: {len(c)} catalogue rows'); continue
    key = f"simulations/{c[0]['db_id']}/{sb}"
    src = f.read_text()
    for a, b in cfg['spec_fixes'].get(rel, []):
        if src.count(a) != 1: bad.append(f'{rel}: spec fix anchor not found once'); break
        src = src.replace(a, b)
    tl = cfg.get('tutor_links', {}).get(rel)   # Ask AI Tutor: this sim's stage seed link -> its beta seed link (exactly once)
    if tl:
        if src.count(tl['stage']) != 1: bad.append(f'{rel}: stage tutor link not found exactly once'); continue
        src = src.replace(tl['stage'], tl['beta'])
    sim_id = re.sub(r'[^a-z0-9]+', '-', rel.lower().replace('_sims/', '-').replace('.html', '')).strip('-')
    opts = ['--channel', 'v1', '--guide-mark', '--sim-id', sim_id]
    if rel in cfg['layout_qm_legacy']: opts += ['--layout', 'qm-legacy']
    if rel in cfg['canvas_light']: opts += ['--canvas-light']
    if SHARED and rel not in cfg.get('shared_exclude', {}): opts += ['--shared']
    with tempfile.TemporaryDirectory() as td:
        pre = pathlib.Path(td) / 'pre.html'; pre.write_text(src)
        dst = out / 'stage' / sb
        r = subprocess.run(['python3', str(KIT / 'tools/apply.py'), str(pre), str(dst), '--cdn', 'https://d6jsp0m3kqowo.cloudfront.net', *opts], capture_output=True, text=True)
        if r.returncode: bad.append(f'{rel}: apply failed: {r.stderr.strip()[-200:]}'); continue
        r = subprocess.run(['python3', str(KIT / 'tools/check_static.py'), str(pre), str(dst)], capture_output=True, text=True)
        if r.returncode: bad.append(f'{rel}: static check failed: {r.stdout.strip()[:200]}'); continue
    built = dst.read_text()
    if tl and (built.count(tl['beta']) != 1 or 'stage.fermi.ai/t/' in built): bad.append(f'{rel}: tutor link check failed after build'); continue
    rows.append((rel, sb, key, hashlib.md5(dst.read_bytes()).hexdigest(), ' '.join(o for o in opts if o.startswith('--') and o != '--sim-id') + f' id={sim_id}' + (' +specfix' if rel in cfg['spec_fixes'] else '') + (' +betatutor' if tl else '')))
with open(out / 'build.tsv', 'w') as o:
    for r in rows: o.write('\t'.join(r) + '\n')
print(f'built {len(rows)} sims into {out}/stage'); [print('  FAIL', b) for b in bad]
sys.exit(1 if bad else 0)
