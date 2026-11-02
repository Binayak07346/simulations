#!/usr/bin/env python3
"""Build dist/fermi-sim.<VERSION>.css from the sources, lint it, and write its SRI hash.

    python3 tools/build.py            # build + lint (fails on any lint error)

Layer order (declared once, at the top of the file):
    fermi.tokens      _tokens/*.css          custom properties only
    fermi.base        (empty in v1: element defaults would leak into live sims)
    fermi.components  _styles/*.css          canonical .fsim-* classes
    fermi.override    override.css           temporary !important look layer

The built file is the ONE artifact: the CDN copy and every sim's inline
fallback copy are byte-identical to it (checked by the sha recorded here).
"""
import base64, hashlib, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION = (ROOT / 'VERSION').read_text().strip()
TOKENS = ['colors', 'typography', 'spacing', 'radius', 'elevation', 'motion', 'sim', 'frame']
STYLES = ['primitives', 'chrome']

def read(p): return (ROOT / p).read_text()

def lint():
    errs = []
    tok_src = {t: read(f'_tokens/{t}.css') for t in TOKENS}
    sty_src = {s: read(f'_styles/{s}.css') for s in STYLES}
    ovr = read('override.css')
    strip = lambda css: re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    # 1. one definition per token
    seen = {}
    for t, css in tok_src.items():
        for name in re.findall(r'(?<![\w-])(--[a-z0-9-]+)\s*:', strip(css)):
            if name in seen: errs.append(f'token {name} defined twice ({seen[name]}, {t})')
            seen[name] = t
    # 2. no colour literals outside _tokens/ (url(data:...) masks live in tokens too)
    for name, css in [*[(f'_styles/{k}.css', v) for k, v in sty_src.items()], ('override.css', ovr)]:
        body = strip(css)
        for m in re.finditer(r'#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|url\(', body):
            line = body[:m.start()].count('\n') + 1
            errs.append(f'{name}:{line} literal "{m.group(0)}" (put it in a token)')
    # 3. !important only in override.css; no tokens declared outside _tokens (except the
    #    sims' own legacy vars re-pointed by the override layer)
    for k, v in sty_src.items():
        if '!important' in strip(v): errs.append(f'_styles/{k}.css uses !important (override.css only)')
        for name in re.findall(r'(?<![\w-])(--[a-z0-9-]+)\s*:', strip(v)): errs.append(f'_styles/{k}.css declares {name}')
    for name in re.findall(r'(?<![\w-])(--(?:color|fsim|font|radius|space|shadow|text|leading|duration|ease)-[a-z0-9-]*)\s*:', strip(ovr)):
        errs.append(f'override.css declares design token {name} (tokens live in _tokens/)')
    # 4. no prefers-color-scheme anywhere
    for name, css in [*tok_src.items(), *sty_src.items(), ('override', ovr)]:
        if 'prefers-color-scheme' in strip(css): errs.append(f'{name}: prefers-color-scheme is banned')
    # 5. every design token referenced is defined (catches a var() pointing at nothing)
    used = set()
    for css in [*tok_src.values(), *sty_src.values(), ovr]:
        used |= set(re.findall(r'var\(\s*(--(?:color|fsim|font|radius|space|shadow|text|leading|duration|ease|control)-[a-z0-9-]*)', strip(css)))
    for u in sorted(used - set(seen)): errs.append(f'var({u}) is used but never defined')
    return errs

def build():
    parts = [f"""/*! fermi-sim.css v{VERSION} · Fermi simulation design system
 * Tokens follow the main app (study-tools-v2 frontend/src/design-system).
 * One file: tokens + canonical .fsim-* classes + the temporary override layer.
 * Load: see README.md. Source: design-system/fermi-sim-css/ · do not edit this build. */
@layer fermi.contrast, fermi.tokens, fermi.base, fermi.components, fermi.override;
"""]
    def layer(name, srcs):
        body = '\n'.join(f'/* ── {s} ── */\n' + read(s).strip() + '\n' for s in srcs)
        return f'@layer {name} {{\n{body}}}\n'
    gen = ['_generated/sim-overrides.css'] if (ROOT / '_generated' / 'sim-overrides.css').exists() else []
    frame = ['_styles/frame.css'] if (ROOT / '_styles' / 'frame.css').exists() else []
    sh = ROOT / '_shared' / 'shared-layers.css'
    shared = ('/* ── _shared/shared-layers.css (unlayered) ── */\n' + sh.read_text().strip() + '\n') if sh.exists() else ''
    def assemble(with_frame):
        ps = parts[:1]
        toks = [f'_tokens/{t}.css' for t in TOKENS if with_frame or t != 'frame']
        ps.append(layer('fermi.tokens', toks + (gen if with_frame else [])))   # per-sim frame values last: html[data-fsim-id] wins
        ps.append(layer('fermi.components', [f'_styles/{s}.css' for s in STYLES]))
        ps.append(layer('fermi.override', ['override.css'] + (frame if with_frame else [])))   # Wave 2: generated frame rules
        # Readable text (1.3.1): per-sim colour fixes, generated (tools/gen_contrast.py). The layer is declared FIRST, so
        # for !important it outranks every other layer (the A-look overrides included) without extra specificity.
        if (ROOT / '_generated' / 'contrast.css').exists(): ps.append(layer('fermi.contrast', ['_generated/contrast.css']))
        # Wave 3: the shared layers the sims carried as identical copies, UNLAYERED and last. Sims built with
        # apply.py --shared load this same file a second time just before </body>, so these rules keep their
        # end-of-page cascade position (moving them earlier flips ~1,470 contests: _shared/cascade_flips.json).
        if shared: ps.append(shared)
        return ps
    fb = '\n'.join(assemble(False))   # inline FALLBACK (used only if the CDN copy fails): no Wave 2 frame rules/tokens,
                                         # which only re-assert each sim's own values; the end-of-page copy needs only `shared`
    parts = assemble(True)
    css = '\n'.join(parts)
    out = ROOT / 'dist' / f'fermi-sim.{VERSION}.css'
    out.write_text(css)
    # host layout: <base>/fermi-sim/<VERSION>/fermi-sim.css (same path on any CDN; immutable per version)
    hosted = ROOT / 'dist' / 'fermi-sim' / VERSION / 'fermi-sim.css'
    hosted.parent.mkdir(parents=True, exist_ok=True); hosted.write_text(css)
    raw = css.encode('utf-8')
    sri = 'sha384-' + base64.b64encode(hashlib.sha384(raw).digest()).decode()
    (ROOT / 'dist' / f'fermi-sim.{VERSION}.sri').write_text(sri + '\n')
    (ROOT / 'dist' / f'fermi-sim.{VERSION}.sha256').write_text(hashlib.sha256(raw).hexdigest() + '\n')
    (ROOT / 'dist' / f'fermi-sim.{VERSION}.fallback.css').write_text(fb)
    (ROOT / 'dist' / f'fermi-sim.{VERSION}.tail.css').write_text(shared)
    return out, len(raw), sri

if __name__ == '__main__':
    errs = lint()
    if errs:
        print('LINT FAILED'); [print('  ' + e) for e in errs]; sys.exit(1)
    out, n, sri = build()
    print(f'ok  {out.relative_to(ROOT)}  {n:,} bytes  {sri}')
