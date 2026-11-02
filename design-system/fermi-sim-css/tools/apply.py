#!/usr/bin/env python3
"""Install fermi-sim.css into ONE sim (writes a new file; never edits the source).

    python3 tools/apply.py SRC.html OUT.html --cdn https://host/path      # the real build
    python3 tools/apply.py SRC.html OUT.html --oracle SKIN.html           # verification oracle

Build (the only two edits):
  1. Theme stamp: data-theme="light" on the first <html>, class "light-theme" on the
     first <body>. The sims' theme-repair script syncs body from html at load, so
     both are stamped and the page is light from its first frame (no dark flash,
     unlike the old skin, which clicked the toggle after load).
  2. One marked block before the real </head>:
       Inter (Google Fonts) · loader · inline fallback <style media="not all"> ·
       <link> to the versioned CDN file with SRI.
     The loader keeps the CDN sheet on `load`; on `error` (network, CSP, SRI
     mismatch) or after 3 s it removes the link and switches the inline copy on.
     <html data-fermi-css="cdn|inline"> records which one is live.

Oracle: the same theme stamp + data-hz="A", then the locked A skin's <style> (and
its Inter link) before </body> exactly as the approved mocks had it, minus the
skin's script. Oracle and build differ ONLY in how the colours are delivered.

The block is removable: everything between the BEGIN/END markers, plus the two
stamps, is all this tool changes (tools/check_static.py proves it).
"""
import argparse, json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import flow_patch, guide_patch, shared_extract

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION = (ROOT / 'VERSION').read_text().strip()
BEGIN = f'<!-- FERMI-SIM CSS v{VERSION} BEGIN · design-system/fermi-sim-css · generated, do not edit -->'
END = f'<!-- FERMI-SIM CSS v{VERSION} END -->'
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">')
LOADER = ("<script id=\"fermi-sim-loader\">(function(d){var done=0,t;function use(m){if(done)return;done=1;clearTimeout(t);"
          "d.documentElement.setAttribute('data-fermi-css',m);if(m!=='cdn'){var s=d.getElementById('fermi-sim-inline');"
          "['','-2'].forEach(function(k){var s=d.getElementById('fermi-sim-inline'+k);if(s)s.media='all';var l=d.getElementById('fermi-sim-css'+k);if(l&&l.parentNode)l.parentNode.removeChild(l);});}}"
          "window.__fermiCss=use;t=setTimeout(function(){use('inline');},3000);})(document);</script>")

def theme_seeds(s):
    """Sims that remember (and default) their theme in localStorage: return [(key, light value)].
    They read the key at startup and fall back to DARK, which would override the stamp; seeding the
    key with the sim's own light value before its scripts run keeps the page light from frame one."""
    keys = set(re.findall(r"localStorage\.getItem\(\s*'([^']+)'", s))
    for name in set(re.findall(r'localStorage\.getItem\(\s*([A-Z_]+)\s*\)', s)):
        m = re.search(name + r"\s*=\s*['\"]([^'\"]+)['\"]", s)
        if m: keys.add(m.group(1))
    keys = sorted(k for k in keys if 'theme' in k.lower())
    light = 'bright' if re.search(r"""===\s*['"]bright['"]""", s) else 'light'
    return [(k, light) for k in keys]

def seed_script(seeds):
    if not seeds: return ''
    body = ''.join(f"try{{localStorage.setItem({k!r},{v!r});}}catch(e){{}}" for k, v in seeds)
    return f'<script id="fermi-sim-theme">/* light-only: the sim remembers its theme here; start it light */{body}</script>'

def locate(s):
    """Indices of the real <html …>, </head>, <body …> tags (JS strings also contain them)."""
    h = s.find('</head>'); assert h > 0, 'no </head>'
    m_html = re.search(r'<html\b[^>]*>', s); assert m_html and m_html.start() < h, 'no <html> before </head>'
    m_body = re.compile(r'<body\b[^>]*>').search(s, h); assert m_body, 'no <body> after </head>'
    assert s.count('</body>') >= 1
    return m_html, h, m_body

def head_open(s):
    h = s.find('</head>'); m = re.search(r'<head\b[^>]*>', s)
    assert m and m.end() <= h, 'no <head> before </head>'
    return m.end()

def stamp(s, extra_html_attrs=''):
    m_html, h, m_body = locate(s)
    tag = m_html.group(0)
    tag = re.sub(r'\s+data-theme\s*=\s*"[^"]*"', '', tag)   # a pinned theme (e.g. "dark") becomes light
    new_html = tag[:-1].rstrip() + ' data-theme="light"' + extra_html_attrs + '>'
    btag = m_body.group(0)
    cls = 'light-theme' + (' light-mode' if re.search(r"classList\.contains\(\s*['\"]light-mode['\"]", s) else '')
    if re.search(r'\bclass\s*=', btag):
        new_body = re.sub(r'class\s*=\s*"([^"]*)"', lambda m: f'class="{(m.group(1) + " " + cls).strip()}"', btag, count=1)
    else:
        new_body = btag[:-1].rstrip() + f' class="{cls}">'
    s = s[:m_body.start()] + new_body + s[m_body.end():]
    return s[:m_html.start()] + new_html + s[m_html.end():]

def build(src, cdn, layout=None, version=None, canvas_light=False, channel=None, guide_mark=False, sim_id=None, shared=False):
    s = flow_patch.apply(guide_patch.apply(src)) if guide_mark else src   # guide: CSS outlines + Play-tip; landing: stylesheet switch (--fsim-landing)
    removed = []
    if shared: s, removed = shared_extract.remove_shared(s)   # Wave 3: duplicated shared blocks now live in the stylesheet
    V = version or VERSION
    assert 'fermi-sim-loader' not in s and 'FERMI-SIM CSS v' not in s, 'already installed'
    css = (ROOT / 'dist' / f'fermi-sim.{V}.css').read_text()   # a PUBLISHED build: dist files are never rebuilt per version
    fbp = ROOT / 'dist' / f'fermi-sim.{V}.fallback.css'; tlp = ROOT / 'dist' / f'fermi-sim.{V}.tail.css'
    fallback = fbp.read_text() if fbp.exists() else css          # slim inline copy (no frame rules: they re-assert own values)
    tailcss = tlp.read_text() if tlp.exists() else css
    sri = (ROOT / 'dist' / f'fermi-sim.{V}.sri').read_text().strip()
    assert '</style' not in css.lower() and '</body' not in css.lower(), 'markup in CSS: dev servers inject at the first </body> text'
    # channel (e.g. v1): the sim follows the latest published 1.x from one CDN address (no SRI: its bytes change by design);
    # without it the sim is pinned to the exact version V with SRI. The inline fallback is always version V.
    href = f'{cdn.rstrip("/")}/fermi-sim/{channel or V}/fermi-sim.css'
    integrity = '' if channel else f'integrity="{sri}" '
    begin = BEGIN.replace(f'v{VERSION} ', f'v{V} '); end = END.replace(f'v{VERSION} ', f'v{V} ')
    canvas = []
    if canvas_light:   # opt-in: remap a dark-only canvas palette for the light page (runtime/canvas-light.js)
        js = (ROOT / 'runtime' / 'canvas-light.js').read_text(); assert '</script' not in js.lower()
        canvas = [f'<script id="fermi-sim-canvas-light">\n{js}</script>']
    block = '\n'.join([begin, *([seed_script(theme_seeds(s))] if theme_seeds(s) else []), *canvas, FONTS, LOADER,
        f'<style id="fermi-sim-inline" media="not all">\n{fallback}</style>',
        f'<link id="fermi-sim-css" rel="stylesheet" href="{href}" {integrity}crossorigin="anonymous" '
        f'onload="__fermiCss(\'cdn\')" onerror="__fermiCss(\'inline\')">', end, ''])
    s = stamp(s, (f' data-fsim-layout="{layout}"' if layout else '') + (f' data-fsim-id="{sim_id}"' if sim_id else '') + (f' data-fsim-shared="{" ".join(removed)}"' if removed else ''))   # id: per-sim token overrides live in the stylesheet
    i = head_open(s)   # FIRST thing in <head>: runs before any sim script (some read their theme in <head>)
    s = s[:i] + '\n' + block + s[i:]
    if removed:   # the same stylesheet again just before </body>: its unlayered shared section keeps end-of-page order
        tail = '\n'.join([begin.replace(' BEGIN', ' TAIL BEGIN'), f'<style id="fermi-sim-inline-2" media="not all">\n{tailcss}</style>',
            f'<link id="fermi-sim-css-2" rel="stylesheet" href="{href}" {integrity}crossorigin="anonymous">', end.replace(' END', ' TAIL END'), ''])
        j = s.rfind('</body>'); s = s[:j] + tail + s[j:]
    return s

def oracle(src, skin_path):
    skin = pathlib.Path(skin_path).read_text()
    style = re.search(r'<style id="hz-skin">.*?</style>', skin, re.S).group(0)
    links = '\n'.join(re.findall(r'<link [^>]*fonts\.googleapis[^>]*>', skin))
    s = stamp(src, ' data-hz="A"')
    seeds = theme_seeds(src)
    if seeds:
        j = head_open(s); s = s[:j] + '\n<!-- ORACLE theme seed -->' + seed_script(seeds) + s[j:]
    i = s.rfind('</body>')
    return s[:i] + '<!-- ORACLE: locked A skin (style only) -->\n' + links + '\n' + style + '\n' + s[i:]

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--cdn'); g.add_argument('--oracle')
    ap.add_argument('--version', help='install a specific PUBLISHED version from dist/ (default: VERSION)')
    ap.add_argument('--sim-id', help='stamp <html data-fsim-id> so the stylesheet can hold per-sim token overrides')
    ap.add_argument('--channel', help='follow a mutable channel address, e.g. v1 (no SRI; fallback = --version)')
    ap.add_argument('--guide-mark', action='store_true', help='patch the guide engine: mark page controls, the stylesheet draws their outlines')
    ap.add_argument('--allow-uncalibrated-id', action='store_true', help='stamp --sim-id even if the sim is not calibrated (fleet default frame values)')
    ap.add_argument('--shared', action='store_true', help='Wave 3: remove the registered shared blocks; deliver the stylesheet a second time before </body>')
    ap.add_argument('--canvas-light', action='store_true', help='also install runtime/canvas-light.js (sims whose canvas only has a dark palette)')
    ap.add_argument('--layout', help='layout family stamp, e.g. qm-legacy (scopes the v1.1 rules for older QM sims)')
    a = ap.parse_args()
    src = pathlib.Path(a.src).read_text()
    cal = ROOT / '_generated' / 'calibrated-ids.json'
    if a.sim_id and cal.exists() and a.sim_id not in json.loads(cal.read_text()) and not a.allow_uncalibrated_id:
        sys.exit(f'--sim-id {a.sim_id}: not a calibrated sim (_generated/calibrated-ids.json). The frame rules would give it the fleet '
                 'DEFAULT spacing, measured on other shells. Leave --sim-id out (the sim keeps its own spacing), or calibrate its family first.')
    out = build(src, a.cdn, a.layout, a.version, a.canvas_light, a.channel, a.guide_mark, a.sim_id, a.shared) if a.cdn else oracle(src, a.oracle)
    pathlib.Path(a.out).write_text(out)
    print('ok', a.out, f'{len(out) - len(src):+,} bytes')
