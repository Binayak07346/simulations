#!/usr/bin/env python3
"""Mobile app mode: the LAST step for every user-version sim (after ui-stylesheet).

    python3 app_mode.py <in.html> <out.html> [--roles roles.json | --roles '{"panel":"#controls",...}']
                                                 insert (or upgrade) the layer; in == out is allowed
    python3 app_mode.py --check <file.html>...   report: current / compatible (same behaviour) / old / none

--roles: for a sim whose structure the layer does not detect by itself (any non-Fermi design), a JSON map
of role -> CSS selector (header, panel, hero, play, reset, guide, physics, inquiry, inquiry-toggle,
readouts, skip). It is written as <script id="fermi-app-mode-roles">window.__FAPP_ROLES=...</script>
right before the layer. A re-run without --roles keeps the map already in the file.

Inserts '<script id="fermi-app-mode">' + ../fermi-app-mode.js + '</script>' immediately before the LAST </body>
(an earlier </body> can sit inside a JS string), or appends it when there is none. An existing fermi-app-mode
block is removed first, so a re-run is byte-identical and a version upgrade replaces the block instead of
adding a second one. No other byte changes; the result is asserted before it is written.
The layer does nothing on a mouse/trackpad device (its first statement returns), so desktop is unchanged.
Importable: apply(text) -> text, version_of(text) -> str|None."""
import json, pathlib, re, sys

KIT = pathlib.Path(__file__).resolve().parent.parent
JS = (KIT / 'fermi-app-mode.js').read_text(encoding='utf-8')
VERSION = (KIT / 'VERSION').read_text().strip()
TAG = '<script id="fermi-app-mode">\n' + JS + '\n</script>'
BLOCK = re.compile(r'<script id="fermi-app-mode">.*?</script>', re.S)
RBLOCK = re.compile(r'<script id="fermi-app-mode-roles">(.*?)</script>', re.S)
#: older layer versions that behave identically on pages without role marks (1.1.0 only ADDED the role contract)
COMPATIBLE = {'1.0.0', '1.1.0'}   # ...EXCEPT on a page whose tutor link sits in the sheet header: 1.1.1 is needed there
ROLE_KEYS = {'header', 'panel', 'hero', 'play', 'reset', 'guide', 'physics', 'inquiry', 'inquiry-toggle', 'readouts', 'skip'}
BODY = re.compile(r'</body\s*>', re.I)
VER = re.compile(r"__fermiAppMode = '([^']+)'")
assert JS.count('</script>') == 0, 'layer source must not contain a literal </script>'
assert '<script' not in JS, 'layer source must not contain a literal <script tag (it would confuse the block regexes)'
assert f"__fermiAppMode = '{VERSION}'" in JS, 'VERSION file and layer source disagree'


def strip(text):
    return RBLOCK.sub('', BLOCK.sub('', text))


def roles_of(text):
    m = RBLOCK.search(text)
    if not m: return None
    js = m.group(1).strip()
    return json.loads(js[js.index('=') + 1:].rstrip(';'))


def roles_tag(roles):
    bad = set(roles) - ROLE_KEYS
    assert not bad, f'unknown role(s): {sorted(bad)}; allowed: {sorted(ROLE_KEYS)}'
    assert all(isinstance(v, str) and v.strip() for v in roles.values()), 'every role needs a CSS selector string'
    js = json.dumps(roles, ensure_ascii=False).replace('</', '<\\/')
    return '<script id="fermi-app-mode-roles">window.__FAPP_ROLES=' + js + ';</script>'


def apply(text, roles=None):
    if roles is None: roles = roles_of(text)          # a re-run keeps the map already in the file
    base = strip(text)
    block = (roles_tag(roles) if roles else '') + TAG
    m = list(BODY.finditer(base))
    out = base[:m[-1].start()] + block + base[m[-1].start():] if m else base + block
    i = out.find(block)
    assert out.count('id="fermi-app-mode"') == 1, 'more than one app-mode block'
    assert out[:i] + out[i + len(block):] == base, 'something other than the layer changed'
    assert not m or BODY.match(out, i + len(block)), 'layer is not right before the last </body>'
    return out


def version_of(text):
    b = BLOCK.search(text)
    if not b: return None
    v = VER.search(b.group(0)); return v.group(1) if v else 'unknown'


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--check']:
        bad = 0
        for f in a[1:]:
            v = version_of(pathlib.Path(f).read_text(encoding='utf-8'))
            txt = pathlib.Path(f).read_text(encoding='utf-8')
            ok_old = v in COMPATIBLE and 'class="phys-title-row"' not in txt
            state = 'current' if v == VERSION else ('compatible' if ok_old else ('none' if v is None else f'old ({v})'))
            bad += state not in ('current', 'compatible'); print(f'{state:12} {(v or ""):8} {f}')
        sys.exit(1 if bad else 0)
    roles = None
    if '--roles' in a:
        k = a.index('--roles'); v = a[k + 1]; del a[k:k + 2]
        roles = json.loads(pathlib.Path(v).read_text() if pathlib.Path(v).is_file() else v)
    if len(a) != 2: sys.exit(__doc__)
    src, dst = map(pathlib.Path, a)
    t = src.read_text(encoding='utf-8'); was = version_of(t); out = apply(t, roles)
    dst.write_text(out, encoding='utf-8')
    print(f'app-mode {VERSION}: {src.name} ({len(t)} -> {len(out)} chars; previous block: {was or "none"})')
