#!/usr/bin/env python3
"""Mobile app mode: the LAST step for every user-version sim (after ui-stylesheet).

    python3 app_mode.py <in.html> <out.html>     insert (or upgrade) the layer; in == out is allowed
    python3 app_mode.py --check <file.html>...   report: current / old version / none

Inserts '<script id="fermi-app-mode">' + ../fermi-app-mode.js + '</script>' immediately before the LAST </body>
(an earlier </body> can sit inside a JS string), or appends it when there is none. An existing fermi-app-mode
block is removed first, so a re-run is byte-identical and a version upgrade replaces the block instead of
adding a second one. No other byte changes; the result is asserted before it is written.
The layer does nothing on a mouse/trackpad device (its first statement returns), so desktop is unchanged.
Importable: apply(text) -> text, version_of(text) -> str|None."""
import pathlib, re, sys

KIT = pathlib.Path(__file__).resolve().parent.parent
JS = (KIT / 'fermi-app-mode.js').read_text(encoding='utf-8')
VERSION = (KIT / 'VERSION').read_text().strip()
TAG = '<script id="fermi-app-mode">\n' + JS + '\n</script>'
BLOCK = re.compile(r'<script id="fermi-app-mode">.*?</script>', re.S)
BODY = re.compile(r'</body\s*>', re.I)
VER = re.compile(r"__fermiAppMode = '([^']+)'")
assert JS.count('</script>') == 0, 'layer source must not contain a literal </script>'
assert f"__fermiAppMode = '{VERSION}'" in JS, 'VERSION file and layer source disagree'


def strip(text):
    return BLOCK.sub('', text)


def apply(text):
    base = strip(text)
    m = list(BODY.finditer(base))
    out = base[:m[-1].start()] + TAG + base[m[-1].start():] if m else base + TAG
    i = out.find(TAG)
    assert out.count('id="fermi-app-mode"') == 1, 'more than one app-mode block'
    assert out[:i] + out[i + len(TAG):] == base, 'something other than the layer changed'
    assert not m or BODY.match(out, i + len(TAG)), 'layer is not right before the last </body>'
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
            state = 'current' if v == VERSION else ('none' if v is None else f'old ({v})')
            bad += state != 'current'; print(f'{state:12} {f}')
        sys.exit(1 if bad else 0)
    if len(a) != 2: sys.exit(__doc__)
    src, dst = map(pathlib.Path, a)
    t = src.read_text(encoding='utf-8'); was = version_of(t); out = apply(t)
    dst.write_text(out, encoding='utf-8')
    print(f'app-mode {VERSION}: {src.name} ({len(t)} -> {len(out)} chars; previous block: {was or "none"})')
