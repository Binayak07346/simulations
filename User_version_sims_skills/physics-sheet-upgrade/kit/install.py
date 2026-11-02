"""Physics sheet v2 - install the sheet layer into a sim that has none.

  python3 install.py <raw-sim.html> <SIMDIR> [--spec install.json]

Stage 1 of 2.  Reads the raw sim (no sheet), adds a generic, family-agnostic sheet scaffold, and writes
  SIMDIR/pristine.html   the raw sim + scaffold. It satisfies the 12 text anchors build.py needs.
  SIMDIR/raw.html        the untouched input.
  SIMDIR/config.json     {sim, kicker, aria}   (only if absent)
  SIMDIR/{article.html,persim.html,edits.py}   starter files (only if absent)
  SIMDIR/.lastbuild      sha of raw.html, so build.py may overwrite the raw file in the repo
Stage 2 is  python3 build.py SIMDIR  which turns the scaffold into the finished v2 sheet.

install.json (all keys optional except title/slug):
  title, slug       "Forces on objects" / "forces-on-objects"  (sheet header and the download file name)
  sim               where build.py will write the finished sim (default: the raw path)
  kicker            kicker line (default "<title> . what this sim shows, the physics behind it, and every control")
  z                 {"backdrop":6200,"toast":6300}    stacking numbers; pre-shell QM sims use 99992 / 99993
  toast_top         px for #phys-toast (default 64)
  button            {"before":"<literal html>", "class":"btn-topbar"}  pre-shell: insert a NEW header button
                    immediately before this exact snippet (must occur once).  Omit for Shell sims.
  hooks             {"before":"<literal js>", "code":"window.__physicsHooks = {...};"}  pre-shell: insert
                    the hook block immediately before this exact snippet (inside the sim's scene scope).
                    Omit for Shell sims that define applyInquiryScene (auto-wired).
  tokens            true (default): add fallback values for any theme token the sim does not define
Exit code 0 = installed; any anchor miss aborts before anything is written.
"""
import hashlib, json, os, re, sys

KIT = os.path.dirname(os.path.abspath(__file__))
SK = os.path.join(os.path.dirname(KIT), 'scaffold')
args = [a for a in sys.argv[1:] if not a.startswith('--')]
raw_path, D = os.path.abspath(args[0]), os.path.abspath(args[1])
spec = {}
if '--spec' in sys.argv:
    spec = json.load(open(sys.argv[sys.argv.index('--spec') + 1]))
for k in ('title', 'slug'):
    assert spec.get(k), 'install.json needs "%s"' % k
raw = open(raw_path).read()
assert 'phys-backdrop' not in raw and 'phys-art' not in raw, 'sim already has a sheet - use build.py, or restore the pre-sheet file'
assert raw.count('</body>') == 1 and raw.count('</head>') == 1, 'expected exactly one </head> and </body>'
s = raw


def rep(old, new, why):
    global s
    assert s.count(old) == 1, 'anchor for %s found %d times: %r' % (why, s.count(old), old[:90])
    s = s.replace(old, new)


def rsub(pat, new, why, flags=0):
    global s
    s2, n = re.subn(pat, new, s, flags=flags)
    assert n == 1, 'pattern for %s matched %d times: %s' % (why, n, pat[:90])
    s = s2


def read(n):
    return open(os.path.join(SK, n)).read()


title, slug = spec['title'], spec['slug']
shell = bool(re.search(r'<button id="toggle-formal" class="shell-btn"[^>]*>', s))
BTN_TXT = '⚛︎ The Physics'

# ---- 1. header button + hooks
if shell:
    rsub(r'<button id="toggle-formal" class="shell-btn"[^>]*>[^<]*</button>',
         '<button id="toggle-formal" class="shell-btn" title="Open the revision sheet">%s</button>' % BTN_TXT, 'header button')
    prewired = bool(re.search(r"tFormal\) tFormal\.addEventListener\('click', ?\(\) ?=> ?\{[^}]*if ?\(window\.__openPhysics\) window\.__openPhysics\(\);", s))   # AI-course sims ship wired
    if not prewired:
        rsub(r"(if\(tFormal\) tFormal\.addEventListener\('click',\(\)=>\{)[^}]*(\}\);)",
             r"\1\n      // Physics layer: open the revision sheet instead of toggling the strip.\n      if(window.__openPhysics) window.__openPhysics();\n    \2", 'tFormal listener')
    if prewired and '__physicsHooks' in s:
        print('NOTE: pre-wired sim (listener + __physicsHooks already present): structural patches skipped')
    elif 'function applyInquiryScene' in s:
        i = s.index('function applyInquiryScene')
        # the final "})();" of the script that defines it
        j = s.index('</script>', i)
        k = s.rindex('})();', i, j)
        s = s[:k] + 'window.__physicsHooks = { scene:applyInquiryScene };\n' + s[k:]
    else:
        print('NOTE: no applyInquiryScene - See-it scenes need hooks.scene from persim.html')
else:
    b = spec.get('button')
    assert b and b.get('before'), 'pre-shell sim: install.json needs button.before (an exact snippet the new button goes before)'
    btn = '<button type="button" class="%s" id="toggle-formal" title="Open the revision sheet">%s</button>\n' % (b.get('class', 'btn-topbar'), BTN_TXT)
    rep(b['before'], btn + b['before'], 'button.before')
    h = spec.get('hooks')
    assert h and h.get('before') and h.get('code'), 'pre-shell sim: install.json needs hooks.{before,code}'
    assert 'setPlaying' in h['code'] and 'isPlaying' in h['code'] and 'scene' in h['code'], 'hooks need scene, isPlaying, setPlaying'
    rep(h['before'], h['code'] + '\n' + h['before'], 'hooks.before')

# ---- 1b. Controls Guide step for the header button (only if the sim has one)
m = re.search(r"\{\s*sel:'#toggle-formal'[^}]*\}", s)
if m:
    has_say = len(re.findall(r"\bsay:'", s)) > 3
    step = ("{ sel:'#toggle-formal',  mode:'veil', title:'The Physics', text:'Explains the sim section by section, with a See-it button that shows each idea in the sim.'"
            + (", say:'Whenever you want the full story, The Physics explains this sim section by section: what it shows, the physics behind it, and every control. Each section ends with a button that shows you the idea right here in the sim.'" if has_say else '')
            + " }")
    assert 'mode:' in m.group(0), 'unexpected Controls Guide step shape: ' + m.group(0)[:120]
    s = s[:m.start()] + step + s[m.end():]
else:
    print('NOTE: no Controls Guide step for #toggle-formal - add one by hand if the sim has a Controls Guide')

# ---- 2. font
if 'STIX+Two+Text' not in s:
    rep('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,500&display=swap">\n</head>', 'head')

# ---- 3. the scaffold, before </body>
z = spec.get('z', {})
css = read('head.css.html')
css = css.replace('z-index:6200;', 'z-index:%d;' % z.get('backdrop', 6200)).replace('z-index:6300;', 'z-index:%d;' % z.get('toast', 6300))
css = css.replace('#phys-toast{position:fixed;top:64px;', '#phys-toast{position:fixed;top:%dpx;' % spec.get('toast_top', 64))
TOK = {'--panel-2': '#0f1b1e', '--line': 'rgba(255,255,255,.14)', '--text': '#e6edf0', '--ink-mid': '#b4c0c6',
       '--ink-mute': '#8a979e', '--accent': '#3b9b8f', '--accent-soft': 'rgba(59,155,143,.35)',
       '--surface-soft': 'rgba(255,255,255,.04)', '--font-nums': 'ui-monospace,SFMono-Regular,Menlo,monospace'}
missing = [t for t in TOK if not re.search(re.escape(t) + r'\s*:', raw)]
tok = ''
if spec.get('tokens', True) and missing:
    tok = '<style>/* Physics sheet - fallbacks for theme tokens this sim does not define */\n#phys-backdrop,#phys-toast{%s}</style>\n' % ';'.join('%s:%s' % (t, TOK[t]) for t in missing)
    print('NOTE: sim lacks tokens', missing, '- fallbacks added (check light theme in the shots)')
art = read('article.skeleton.html')
modal = read('modal.html').replace('{{ARTICLE}}', art.strip()).replace('{{TITLE}}', title)
layer = read('layer.js.html').replace('{{TITLE}}', title).replace('{{SLUG}}', slug)
binder = '' if shell else ("<script>/* pre-shell sims have no Shell listener: bind the new header button here */\n"
                           "document.getElementById('toggle-formal').addEventListener('click',function(){ if(window.__openPhysics) window.__openPhysics(); });</script>\n")
block = tok + css + '\n' + modal + '\n' + read('seat.js.html') + layer + '\n' + binder + read('gi-pause.js.html')
s = s.replace('</body>', block + '</body>')

# ---- 4. anchors build.py needs
sys.path.insert(0, KIT)
import importlib.util
spc = importlib.util.spec_from_file_location('preflight', os.path.join(KIT, 'preflight.py'))
pf = importlib.util.module_from_spec(spc); spc.loader.exec_module(pf)
bad = [n for n, c in pf.checks if not c(s)]
assert not bad, 'scaffold anchors missing: %s' % bad

# ---- 5. every inline script still parses
import subprocess, tempfile
for n, m in enumerate(re.finditer(r'<script>(.*?)</script>', s, re.S)):
    f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False); f.write(m.group(1)); f.close()
    r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True)
    os.unlink(f.name)
    assert r.returncode == 0, 'script %d syntax: %s' % (n, r.stderr[:300])

# ---- 6. write
os.makedirs(D, exist_ok=True)
open(os.path.join(D, 'raw.html'), 'w').write(raw)
open(os.path.join(D, 'pristine.html'), 'w').write(s)
if not os.path.exists(os.path.join(D, '.lastbuild')):   # a re-install must keep the sha of the last build, or build.py's overwrite guard misfires
    open(os.path.join(D, '.lastbuild'), 'w').write(hashlib.sha256(raw.encode()).hexdigest())
kicker = spec.get('kicker', '%s · what this sim shows, the physics behind it, and every control' % title)
if not os.path.exists(os.path.join(D, 'config.json')):
    json.dump({'sim': spec.get('sim', raw_path), 'kicker': kicker,
               'aria': 'The Physics — revision sheet for %s' % title}, open(os.path.join(D, 'config.json'), 'w'), indent=2, ensure_ascii=False)
for n, body in (('article.html', '<article class="phys-art" id="phys-art" data-gate-from="2">\n</article>\n'),
                ('persim.html', ''),
                ('edits.py', 'REPS = []\nSKIP_TOAST = False\n')):
    p = os.path.join(D, n)
    if not os.path.exists(p): open(p, 'w').write(body)
print('installed', os.path.basename(raw_path), 'family=%s' % ('shell' if shell else 'pre-shell'), len(raw), '->', len(s), '->', D)
