#!/usr/bin/env python3
"""Compare two captures (A = reference, B = candidate).

    python3 harness/diff.py <capA> <capB> [--pixel-max 0.1] [--quiet]

Fails (exit 1) when, in any state at any viewport:
  - a chrome element's computed style differs (colour strings normalised),
  - an element box moves or resizes by more than 0.5 px, or appears/disappears,
  - more than --pixel-max % (default 0.25: measured noise floor 0.165% on the last guide card, which sits over the live scene) of screenshot pixels differ (canvas areas masked),
  - a canvas bitmap differs (theme forcing / cached palettes),
  - a state exists in one capture and not the other,
  - the live CSS path or theme stamp differs (reported, not failed, when --allow-path).
"""
import json, pathlib, re, sys
from PIL import Image, ImageChops, ImageDraw

A, B = map(pathlib.Path, sys.argv[1:3])
PIX_MAX = float(next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--pixel-max'), 0.25))
QUIET = '--quiet' in sys.argv
ALLOW_PATH = '--allow-path' in sys.argv

def norm(v):
    v = re.sub(r'\s+', ' ', v.strip())
    v = re.sub(r'rgba\((\d+), (\d+), (\d+), 1\)', r'rgb(\1, \2, \3)', v)
    return v

fails, report = 0, []
for va in sorted(p for p in A.iterdir() if p.is_dir()):
    vb = B / va.name
    sa = {p.stem for p in va.glob('*.png')}; sb = {p.stem for p in vb.glob('*.png')} if vb.exists() else set()
    for miss in sorted(sa ^ sb):
        fails += 1; report.append(f'{va.name} {miss}: state only in {"A" if miss in sa else "B"}')
    for st in sorted(sa & sb):
        ja = json.loads((va / f'{st}.json').read_text()); jb = json.loads((vb / f'{st}.json').read_text())
        style, box, gone = [], [], []
        for k in sorted(set(ja['els']) | set(jb['els'])):
            ea, eb = ja['els'].get(k), jb['els'].get(k)
            if not ea or not eb: gone.append(('only A ' if ea else 'only B ') + k.split('>')[-1]); continue
            if ea['box'] and eb['box'] and any(abs(x - y) > 0.5 for x, y in zip(ea['box'], eb['box'])):
                box.append(f"{k.split('>')[-1]} {ea['box']}→{eb['box']}")
            for p, x in ea['style'].items():
                y = eb['style'].get(p, '')
                if norm(x) != norm(y): style.append(f"{k.split('>')[-1]} {p}: {x[:70]} → {y[:70]}")
        # pixels, canvas masked
        ia = Image.open(va / f'{st}.png').convert('RGB'); ib = Image.open(vb / f'{st}.png').convert('RGB')
        pix = 100.0
        if ia.size == ib.size:
            d = ImageChops.difference(ia, ib).convert('L').point(lambda v: 255 if v > 8 else 0)
            m = ImageDraw.Draw(d)
            for c in ja['canvases'] + jb['canvases'] + ja.get('noise', []) + jb.get('noise', []): m.rectangle([c[0], c[1], c[0] + c[2], c[1] + c[3]], fill=0)
            pix = 100.0 * sum(d.histogram()[255:]) / (d.size[0] * d.size[1])
            if pix > PIX_MAX: d.save(vb / f'{st}.diff.png')
        ca = json.loads((va / f'{st}.canvas.json').read_text()); cb = json.loads((vb / f'{st}.canvas.json').read_text())
        # canvases compared by average colour: per-channel tolerance 12 (animation noise), a theme error moves ~100+
        canvas_bad = len(ca) != len(cb) or any((x is None) != (y is None) or (x and max(abs(p - q) for p, q in zip(x, y)) > 12) for x, y in zip(ca, cb))
        path_note = '' if (ja['css'], ja['theme'], ja['bodyLight']) == (jb['css'], jb['theme'], jb['bodyLight']) else \
            f" path/theme {ja['css']},{ja['theme']},{ja['bodyLight']} → {jb['css']},{jb['theme']},{jb['bodyLight']}"
        bad = bool(style or box or gone or pix > PIX_MAX or canvas_bad or (path_note and not ALLOW_PATH))
        fails += bad
        line = f"{'FAIL' if bad else 'ok  '} {va.name} {st:18s} els={len(ja['els']):4d} style={len(style)} box={len(box)} appear={len(gone)} pix={pix:.3f}% canvas={'DIFF' if canvas_bad else 'same'}{path_note}"
        report.append(line)
        if bad and not QUIET:
            for x in (style[:8] + box[:5] + gone[:5]): report.append('      ' + x)
print('\n'.join(report))
print(f'\n{"PASS" if not fails else "FAIL"}: {fails} failing state(s)')
sys.exit(1 if fails else 0)
