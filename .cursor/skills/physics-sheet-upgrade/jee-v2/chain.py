#!/usr/bin/env python3
"""jee-v2 chain for ONE JEE testprep sim, after the v2 sheet is built (work/<slug>/built.html):
   built.html -> guide UX rebuild (spec.js of the other session, --no-voice) -> ui_build -> gates -> mobile app mode (+ its gate).
   python3 chain.py <slug> [--root ~/ai-courses-physics-v2] [--skip-gates]
Writes work/<slug>/final/{ux.html, <slug>.user-version.html, gates.json, gates.log, shots/}.  Never touches the guide work dirs.
"""
import json, os, pathlib, re, shutil, subprocess, sys
HERE = pathlib.Path(__file__).resolve().parent; SK = HERE.parent; AIV2 = SK / 'ai-v2'   # quiet gates + chrome-quiet live in ai-v2
REPO = SK.parent.parent.parent
K = REPO / 'User_version_sims_skills' / 'sim-guide-kit'; U = REPO / 'User_version_sims_skills' / 'ui-stylesheet' / 'scripts'
ROOT = pathlib.Path(os.path.expanduser('~/jee-physics-v2'))
if '--root' in sys.argv: ROOT = pathlib.Path(sys.argv[sys.argv.index('--root') + 1])
slug = [a for a in sys.argv[1:] if not a.startswith('--') and a != str(ROOT)][0]
D = ROOT / 'work' / slug; F = D / 'final'; G = D / 'guide'
F.mkdir(exist_ok=True); (F / 'shots').mkdir(exist_ok=True); G.mkdir(exist_ok=True)
env = dict(os.environ, PUPPETEER_CORE='/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',
           PSV2_SLOTS_DIR=os.environ.get('PSV2_SLOTS_DIR', '/tmp/psv2-slots-jee'), CHROME=str(AIV2 / 'chrome-quiet.sh'))   # no sound while testing
slot = [str(SK / 'kit' / 'slot.sh')]
log = open(F / 'gates.log', 'w')
def run(name, cmd, timeout=900):
    log.write(f'\n##### {name}: {" ".join(map(str, cmd))}\n'); log.flush()
    r = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=timeout)
    log.write(r.stdout + r.stderr); log.flush()
    return r

built = D / 'built.html'; assert built.exists(), 'build the v2 sheet first (kit/build.py)'
assert (D / 'spec.js').exists(), 'author work/<slug>/spec.js first'
if '--allow-draft' not in sys.argv:   # starters from prep_all.py carry TODO-AUTHOR markers; a finished sim has none anywhere
    for f in ('spec.js', 'built.html'):
        assert 'TODO-AUTHOR' not in (D / f).read_text(), f + ' still has TODO-AUTHOR markers (starter text not authored)'   # JEE: spec.js lives in the sheet work dir; the guide dir is generated
(G / 'spec.js').write_text((D / 'spec.js').read_text() + (HERE / 'spec-common.js').read_text())   # + the family fix (releases the welcome overlay's inert)
sys.path.insert(0, str(HERE)); import drop_subtitle
sys.path.insert(0, str(U)); import tutor_slot
bt = drop_subtitle.strip(built.read_text())[0]   # header subtitle span dropped fleet-wide (owner 2026-10-07)
bt, _how = tutor_slot.slot(bt); assert _how, 'no header slot for the Ask AI Tutor button'   # pill in place of Info, no link yet (wire_tutor.py)
bt = bt.replace('appended before </body>', 'appended at the end of the body')   # the guide build needs exactly one </body>; this comment is the only extra one
(G / 'pristine.html').write_text(bt)
json.dump({'sim': str(built), 'slug': 'jee-' + slug}, open(G / 'config.json', 'w'))
ux = F / 'ux.html'
r = run('ux-build', [sys.executable, str(K / 'build.py'), str(G), '--out', str(ux), '--no-voice'])
assert r.returncode == 0 and ux.exists(), 'UX build failed:\n' + (r.stdout + r.stderr)[-1500:]
out = F / f'{slug}.user-version.html'
r = run('ui-build', [sys.executable, str(U / 'ui_build.py'), str(ux), str(out)])
assert r.returncode == 0 and out.exists(), 'UI build failed:\n' + (r.stdout + r.stderr)[-1500:]
out.write_text(tutor_slot.slot(out.read_text())[0])   # ui_build adds data-fsim-shared; add the ask-euler.v1 token
res = {'slug': slug, 'ux': str(ux), 'out': str(out)}
if '--skip-gates' not in sys.argv:
    r = run('guide-check(ux)', slot + ['node', str(K / 'check.mjs'), str(ux), '--shots', str(F / 'shots' / 'guide')])
    m = re.findall(r'(\d+)\s*/\s*(\d+)', r.stdout); res['guide'] = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else 'no output'
    res['guide_fails'] = re.findall(r'^FAIL\s+(\S+)', r.stdout, flags=re.M) or re.findall(r'FAIL[^\n]{0,60}', r.stdout)[:6]
    for nm, cmd in (('landing', ['node', str(AIV2 / 'quiet' / 'landing_check.mjs'), str(out), '--shots', str(F / 'shots' / 'landing')]),
                    ('lastcard', ['node', str(AIV2 / 'quiet' / 'lastcard.mjs'), slug, str(out), '1280x763', '1512x860']),
                    ('fallback', ['node', str(AIV2 / 'quiet' / 'fallback.mjs'), str(out)])):
        r = run(nm, slot + cmd); res[nm] = 'PASS' if (r.returncode == 0 and 'FAIL' not in r.stdout) else 'FAIL'
    cd = F / 'sheetcheck'; cd.mkdir(exist_ok=True)
    json.dump({'sim': str(out)}, open(cd / 'config.json', 'w'))
    if (D / 'test.json').exists(): shutil.copy(D / 'test.json', cd / 'test.json')
    r = run('sheet-check(final)', slot + ['node', str(AIV2 / 'check_final.mjs'), str(cd)], timeout=1500)
    res['sheet_final'] = 'PASS' if (r.returncode == 0 and not re.search(r'^FAIL', r.stdout, re.M)) else 'FAIL'
    res['sheet_final_fails'] = re.findall(r'^FAIL[^\n]*', r.stdout, flags=re.M)[:8]
# ---- mobile app mode: the LAST step. Every gate above ran on the file without it; the layer is inert on desktop.
AM = REPO / 'User_version_sims_skills' / 'mobile-app-mode' / 'scripts'
sys.path.insert(0, str(AM)); import app_mode
pre = F / f'{slug}.pre-app.html'; pre.write_text(out.read_text())
out.write_text(app_mode.apply(pre.read_text())); res['app_mode_version'] = app_mode.VERSION
if '--skip-gates' not in sys.argv:
    r = run('app-mode-check', slot + ['node', str(AM / 'app_mode_check.mjs'), str(pre), str(out), '--shots', str(F / 'shots' / 'app-mode')], timeout=1500)
    res['app_mode'] = 'PASS' if r.returncode == 0 else 'FAIL'
    res['app_mode_fails'] = re.findall(r'^FAIL[^\n]*', r.stdout, flags=re.M)[:8]
json.dump(res, open(F / ('gates.json' if '--skip-gates' not in sys.argv else 'gates.skip.json'), 'w'), indent=1)   # a skip run must not clobber the real gates
print(json.dumps(res, indent=1))
