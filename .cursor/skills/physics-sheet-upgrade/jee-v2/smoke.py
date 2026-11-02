#!/usr/bin/env python3
"""jee-v2 smoke test of the tooling on ONE sim (no authoring): prep_all -> kit/build.py -> chain.py --skip-gates --allow-draft -> load_check.
   python3 smoke.py <slug> [--root ~/jee-physics-v2]     A pass means install + RECON work and the DRAFT spec builds and loads."""
import os, pathlib, subprocess, sys
HERE = pathlib.Path(__file__).resolve().parent; SK = HERE.parent
slug = [a for a in sys.argv[1:] if not a.startswith('--') and not a.startswith('/') and not a.startswith('~')][0]
root = sys.argv[sys.argv.index('--root') + 1] if '--root' in sys.argv else os.path.expanduser('~/jee-physics-v2')
env = dict(os.environ, CHROME=str(SK / 'ai-v2' / 'chrome-quiet.sh'), PUPPETEER_CORE='/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js', PSV2_SLOTS_DIR=os.environ.get('PSV2_SLOTS_DIR', '/tmp/psv2-slots-jee'))
D = pathlib.Path(root) / 'work' / slug
def run(c):
    r = subprocess.run(c, capture_output=True, text=True, env=env); return r.returncode, (r.stdout + r.stderr).strip().splitlines()[-1:] 
for name, cmd in (('prep_all', [sys.executable, str(HERE / 'prep_all.py'), slug, '--root', root]), ('build', [sys.executable, str(SK / 'kit' / 'build.py'), str(D)]),
                  ('chain', [sys.executable, str(HERE / 'chain.py'), slug, '--root', root, '--skip-gates', '--allow-draft']),
                  ('load', [str(SK / 'kit' / 'slot.sh'), 'node', str(HERE / 'load_check.mjs'), str(D / 'final' / f'{slug}.user-version.html')])):
    rc, tail = run(cmd); print(f'{slug} {name}: {"ok" if rc == 0 else "FAIL"} {tail[0][:300] if tail else ""}')
    if rc: sys.exit(1)
