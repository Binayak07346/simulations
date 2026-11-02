"""Physics sheet v2 — build one sim.  python3 build.py <sims/SLUG>

Always builds from <SLUG>/pristine.html (a copy of the sim before any v2 work) and writes the
repo file named in config.json.  Assert-every-anchor-then-write: nothing is written unless every
edit below found exactly the text it expects.

Per-sim inputs in <SLUG>/:
  config.json   {"sim": "/abs/path/to/sim.html", "kicker": "...", "aria": "...", "download_title": "..."}
  article.html  the new <article class="phys-art" id="phys-art" ...> with {{S1}}..{{Sn}} for harvested SVGs
  persim.html   per-sim <style>/<script> (light-theme fixes, window.__psDemos, live extras); may be empty
  edits.py      REPS = [(old, new), ...] sim-specific edits (SHOW map, refreshLive text, CG text ...)
Run `python3 build.py <SLUG> --harvest` first to dump the old sheet's SVGs to <SLUG>/svgs/.
"""
import json, os, re, sys, importlib.util

KIT = os.path.dirname(os.path.abspath(__file__))
D = os.path.abspath(sys.argv[1])
cfg = json.load(open(os.path.join(D, 'config.json')))
src = open(os.path.join(D, 'pristine.html')).read()

i = src.index('<article class="phys-art" id="phys-art">')
j = src.index('</article>', i) + len('</article>')
old_art = src[i:j]
svgs = [m.group(1) for m in re.finditer(r'(<svg\b.*?</svg>)', old_art, re.S)]

if '--harvest' in sys.argv:
    os.makedirs(os.path.join(D, 'svgs'), exist_ok=True)
    listing = []
    for k, svg in enumerate(svgs, 1):
        open(os.path.join(D, 'svgs', 'S%d.svg' % k), 'w').write(svg)
        # caption + the heading of the chapter the svg sat in, to help pick
        pos = old_art.index(svg)
        h = re.findall(r'<h3>(.*?)</h3>', old_art[:pos])
        cap = re.search(r'<div class="cap">(.*?)</div>', old_art[pos:pos + len(svg) + 600], re.S)
        listing.append('S%d  [%s]  chapter: %s  | cap: %s' % (
            k, 'fig' if re.search(r'class="fig[^"]*"\s*>\s*$', old_art[max(0, pos - 80):pos]) else 'board',
            h[-1] if h else '-', re.sub('<[^>]+>', '', cap.group(1)).strip() if cap else '-'))
    open(os.path.join(D, 'svgs', 'INDEX.txt'), 'w').write('\n'.join(listing) + '\n')
    txt = re.sub(r'<svg\b.*?</svg>', lambda m: '[S%d]' % (svgs.index(m.group(0)) + 1), old_art, flags=re.S)
    open(os.path.join(D, 'old-article.txt'), 'w').write(txt)
    print('harvested', len(svgs), 'svgs ->', os.path.join(D, 'svgs'))
    sys.exit(0)

s = src
def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, ('anchor count %d != %d' % (n, count), old[:100])
    s = s.replace(old, new)
def rsub(pat, new, count=1):
    global s
    s2, n = re.subn(pat, new, s)
    if count is None:
        assert n <= 1, ('regex count %d > 1' % n, pat[:100])
    else:
        assert n == count, ('regex count %d != %d' % (n, count), pat[:100])
    s = s2

spec = importlib.util.spec_from_file_location('edits', os.path.join(D, 'edits.py'))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

# ---- 1. article
art = open(os.path.join(D, 'article.html')).read().strip()
for k in range(len(svgs), 0, -1):
    art = art.replace('{{S%d}}' % k, svgs[k - 1])
assert '{{' not in art, 'unresolved placeholder: ' + re.search(r'\{\{[^}]*\}\}', art).group(0)
assert '<article class="phys-art" id="phys-art"' in art
s = s[:i] + art + s[j:]

# ---- 2. header copy
rsub(r'aria-label="The Physics — revision sheet[^"]*"', 'aria-label="%s"' % cfg['aria'])
rsub(r'<p class="phys-kicker">.*?</p>', lambda m: '<p class="phys-kicker">%s</p>' % cfg['kicker'])
HDR_TITLE = 'What this sim shows, the physics behind it, and every control'
rsub(r'(<button\b[^>]*\bid="toggle-formal"[^>]*\btitle=")Open the revision sheet[^"]*(")', r'\g<1>' + HDR_TITLE + r'\g<2>')
rsub(r"btn\.title='Open the revision sheet';", "btn.title='" + HDR_TITLE + "';", count=None)

# ---- 3. See-it toast -> the watching card
if not getattr(mod, 'SKIP_TOAST', False):
    rsub(r"      toast\(msg((?:, ?[^;\n]*)?)\);\n    \}\);\n  \}\);",
         r"      if(!(window.__psWatch&&window.__psWatch(btn,msg))) toast(msg\1);\n    });\n  });")

# ---- 4. download: every section, no on-screen furniture
rsub(r"    Array\.prototype\.forEach\.call\(art\.querySelectorAll\('\.seesim'\),function\((\w+)\)\{\1\.remove\(\);\}\);",
     """    Array.prototype.forEach.call(art.querySelectorAll('.seesim,.ps-try'),function(b){b.remove();});
    Array.prototype.forEach.call(art.querySelectorAll('.ps-sec'),function(x){x.removeAttribute('hidden');});
    Array.prototype.forEach.call(art.querySelectorAll('.ps-loc'),function(b){var c=b.closest('td');if(c)c.remove();});
    Array.prototype.forEach.call(art.querySelectorAll('.ps-ctl thead th:last-child'),function(c){c.remove();});
    Array.prototype.forEach.call(art.querySelectorAll('details.ps-deep'),function(x){x.open=true;});
    Array.prototype.forEach.call(art.querySelectorAll('.ps-p'),function(p){if(/⌖/.test(p.textContent))p.remove();});""")
rep("Printing reveals the self-test answers. Equations and diagrams work fully offline.",
    "Equations and diagrams work fully offline.")
rsub(r"(\+'<div class=\"hd\"><h1>The Physics<small>(?:[^<'\\]|\\')*?) ?(?:·|\\u00[Bb]7|,) revision sheet( ?(?:·|\\u00[Bb]7|,) saved )", r"\1\2", count=None)
rsub(r"toast\('<b>Sheet saved\.(?:</b>|<\\/b>)[^']*'\);",
     "toast('<b>Sheet saved.</b> Every section, equation and diagram, with its own light/dark switch and a print button that turns it into a PDF.');")
SHEET_ADD = open(os.path.join(KIT, 'sheet_css.jsfrag')).read()
rep("    +'.bar{margin-top:26px;display:flex;gap:12px;align-items:center;}'\n",
    SHEET_ADD + "    +'.bar{margin-top:26px;display:flex;gap:12px;align-items:center;}'\n")

# ---- 5. inquiry note: the sheet now holds its answers back
rsub(r"note\.innerHTML = '<b>You’re partway through the Guided Inquiry\.</b> This sheet talks through the answers, '\n\s*\+ '[^']*';",
     "note.innerHTML = '<b>You’re partway through the Guided Inquiry.</b> The See-it buttons are paused so the sim stays '\n"
     "    + 'where the inquiry left it. They come back when you finish the inquiry.';")

# ---- 6. sim-specific edits
#      edits.py: REPS = [(old, new), ...] applied in order, each anchor exactly once;
#      optional def edit(s): return s  for anything a plain replacement can't express.
for old, new in getattr(mod, 'REPS', []):
    rep(old, new)
if hasattr(mod, 'edit'):
    s = mod.edit(s)

# ---- 7. the generic layer + per-sim block, before the Guided-Inquiry pause script
layer = open(os.path.join(KIT, 'layer.generic.html')).read()
persim = open(os.path.join(D, 'persim.html')).read() if os.path.exists(os.path.join(D, 'persim.html')) else ''
rep("<script>\n/* Physics sheet — Guided Inquiry pause",
    layer + "\n<!-- PHYSICS SHEET v2 · PER-SIM -->\n" + persim + "\n<!-- /PHYSICS SHEET v2 · PER-SIM -->\n<script>\n/* Physics sheet — Guided Inquiry pause")

# ---- 8. syntax-check every inline script before writing
import subprocess, tempfile
for k, m in enumerate(re.finditer(r'<script>(.*?)</script>', s, re.S)):
    f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False); f.write(m.group(1)); f.close()
    r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True)
    assert r.returncode == 0, 'script %d syntax: %s' % (k, r.stderr[:400])

import hashlib
def _sha(t): return hashlib.sha256(t.encode()).hexdigest()
_lb = os.path.join(D, '.lastbuild')
if os.path.exists(cfg['sim']):
    _cur = _sha(open(cfg['sim']).read())
    _ok = {_sha(src)} | ({open(_lb).read().strip()} if os.path.exists(_lb) else set())
    assert _cur in _ok, 'repo file changed since pristine.html was snapshotted (someone else edited it) - refusing to overwrite: ' + cfg['sim']
open(cfg['sim'], 'w').write(s)
open(_lb, 'w').write(_sha(s))
open(os.path.join(D, 'built.html'), 'w').write(s)
print('ok', os.path.basename(cfg['sim']), len(src), '->', len(s))
