#!/usr/bin/env python3
"""ai-v2 prep for ONE AI-course sim:  python3 prep.py <slug> [--root ~/ai-courses-physics-v2]

Starts from the other session's pristine (the sim + the v1 sheet, before the guide), then
  1. v1/        harvests the old sheet: article.html, article.txt, svgs/, persim.js (MINI/LIVE/SHOW + helpers)
  2. raw.in.html the sim with the v1 sheet cut out (back to the <!-- PHYSICS_SHEET --> marker state)
  3. install    kit/install.py -> pristine.html, raw.html, config.json, starter article.html / persim.html / edits.py
  4. recon.json + RECON.md   controls, manifest params, GI cards (with the correct choice), scene API, notes anchors
Everything is written under <root>/work/<slug>/ . Nothing outside it is touched.
"""
import json, os, re, subprocess, sys, html, pathlib, shutil
HERE = pathlib.Path(__file__).resolve().parent
SK = HERE.parent
sys.path.insert(0, str(SK / 'ai-courses'))
from assemble_ai import strip_layer, INSTALLED, END  # noqa
ROOT = pathlib.Path(os.path.expanduser('~/ai-courses-physics-v2'))
if '--root' in sys.argv: ROOT = pathlib.Path(sys.argv[sys.argv.index('--root') + 1])
slug = [a for a in sys.argv[1:] if not a.startswith('--') and a != str(ROOT)][0]
R = {r['slug']: r for r in json.load(open(HERE / 'roster.json'))}[slug]
D = ROOT / 'work' / slug; D.mkdir(parents=True, exist_ok=True)
env = dict(os.environ, PUPPETEER_CORE='/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',
           PSV2_SLOTS_DIR=os.environ.get('PSV2_SLOTS_DIR', '/tmp/psv2-slots-ai'), CHROME=str(HERE / 'chrome-quiet.sh'))
guide_pristine = pathlib.Path(R['guide_dir']) / 'pristine.html'
base = guide_pristine.read_text()
assert INSTALLED in base, 'guide pristine has no v1 sheet marker: ' + str(guide_pristine)
(D / 'base.guide-pristine.html').write_text(base)

# 1. harvest v1
i = base.index(INSTALLED); j = base.index(END, i); L = base[i:j]
V = D / 'v1'; (V / 'svgs').mkdir(parents=True, exist_ok=True)
a = L.index('<article'); b = L.index('</article>', a) + len('</article>')
art = L[a:b]; (V / 'article.html').write_text(art)
svgs = re.findall(r'<svg\b.*?</svg>', art, flags=re.S)
for n, sv in enumerate(svgs, 1): (V / 'svgs' / f'S{n}.svg').write_text(sv)
txt = re.sub(r'<svg\b.*?</svg>', '[figure]', art, flags=re.S)
txt = re.sub(r'</(h3|p|li|div|tr)>', '\n', txt); txt = re.sub(r'<br\s*/?>', '\n', txt)
txt = html.unescape(re.sub(r'<[^>]+>', '', txt)); (V / 'article.txt').write_text(re.sub(r'\n\s*\n+', '\n\n', txt))
pa = L.index('/* ===== PER-SIM'); pb = L.index('/* ===== END PER-SIM')
(V / 'persim.js').write_text(L[pa:pb])
mt = re.search(r"var TITLE='((?:[^'\\]|\\.)*)'", L[pa:pb]); title = mt.group(1).replace("\\'", "'") if mt else slug

# 2. strip -> raw.in.html
raw = strip_layer(base)
assert 'phys-art' not in raw and 'phys-backdrop' not in raw, 'v1 residue after strip'
(D / 'raw.in.html').write_text(raw)

# 3. install
if not (D / 'pristine.html').exists():
    spec = {'title': title.replace("'", '\u2019'), 'slug': slug, 'sim': str(D / 'out.html')}
    (D / 'install.json').write_text(json.dumps(spec))
    r = subprocess.run([sys.executable, str(SK / 'kit' / 'install.py'), str(D / 'raw.in.html'), str(D), '--spec', str(D / 'install.json')], capture_output=True, text=True)
    sys.stdout.write(r.stdout[-600:]); assert r.returncode == 0, r.stderr[-800:]
    cfg = json.load(open(D / 'config.json')); cfg['sim'] = str(D / 'out.html'); json.dump(cfg, open(D / 'config.json', 'w'))

# 4. recon
r = subprocess.run([str(SK / 'kit' / 'slot.sh'), 'node', str(HERE / 'recon.mjs'), str(D / 'raw.html'), str(D / 'recon.json')], capture_output=True, text=True, env=env)
assert r.returncode == 0, r.stderr[-600:]
C = json.load(open(D / 'recon.json'))
N = json.load(open(SK / 'ai-courses' / 'notes_anchors.json'))
key = os.path.relpath(R['repo'], '/Users/admin/Desktop/simulations-1/AI courses sims')
na = N.get(key) or N.get(key.replace('.polished', '').replace('.prebuild', '')) or {}
md = [f"# RECON — {slug}  ({R['family']} family)", f"title: {C['title']}   course: {R['course']}",
      f"hooks present: {', '.join(C['hooks'])}", f"header buttons: {' | '.join(C['header'])}", '']
md.append('## Lecture notes (see ' + str(ROOT / 'notes' / (R['course'] + '.txt')) + ')')
md.append(json.dumps(na, indent=1, ensure_ascii=False)); md.append('')
md.append('## Controls (live DOM, free mode)')
for c in C['controls']:
    md.append('- ' + ' '.join(f'{k}={v}' for k, v in c.items() if v not in ('', None, False) and k not in ('cls', 'vis')) + ('' if c.get('vis') else '  [hidden at load]'))
if C['manifest']:
    md.append(''); md.append('## Kit manifest — scene() accepts these param ids (+ launch/playing)')
    for p in C['manifest']['params']: md.append('- ' + json.dumps(p, ensure_ascii=False))
    md.append('time: ' + json.dumps(C['manifest']['time']))
    md.append('readouts: ' + json.dumps(C['manifest'].get('readouts'), ensure_ascii=False)[:1500])
    md.append('buttons: ' + json.dumps(C['manifest'].get('buttons'), ensure_ascii=False)[:600])
md.append(''); md.append('## Scene function (window.__physicsHooks.scene)')
md.append('```js\n' + (C['sceneSrc'] or '(none)') + '\n```')
md.append(''); md.append('## Readout ids'); md.append(', '.join(C['readouts']))
md.append(''); md.append('## Guided Inquiry cards — the sheet must not give these answers away before data-gate-from')
for c in C['cards']:
    md.append(f"### card {c['i']}: {c['h']}\n{c['prompt']}")
    for ch in c['choices']: md.append('  - ' + ch)
md.append(''); md.append('## Sim info text (source of truth)'); md.append(C['info']); md.append(''); md.append('## Old bottom-strip text'); md.append(C['formal'])
(D / 'RECON.md').write_text('\n'.join(md))
print('prepped', slug, 'cards', len(C['cards']), 'controls', len(C['controls']), 'svgs', len(svgs))
