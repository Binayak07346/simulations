#!/usr/bin/env python3
"""Shared-layer consolidation (Wave 3): the <style> blocks that sims carry as identical copies move into the
superset stylesheet; each sim keeps exactly the version it had.

Registry: _shared/registry.json (from _shared/scan_registry.py): {name, file, hash, sims, position, ...}.

    remove_shared(html, registry)          -> (html_without_registered_blocks, [names removed])
    verify_only_removed(pristine, built)   -> (ok, message): `built` == pristine minus registered blocks
    shared_attr(rel, registry)             -> value for <html data-fsim-shared="...">: the variants this sim had
    build_shared_css(registry)             -> the CSS section for the superset (fonts + blocks, canonical order)

Cascade rules (see _shared/REPORT.md): the blocks keep their relative order (CANONICAL) and must be applied AFTER
every sim block (deliver the superset a second time just before </body>); a block is scoped with a ZERO-specificity
`:where(html[data-fsim-shared~="<variant>"])` prefix whenever not all 116 sims carried that exact version, so no
sim gets a rule it did not have. Embedded @font-face data URIs are dropped (fonts.css serves the same fonts).
"""
import json, pathlib, re

KIT = pathlib.Path(__file__).resolve().parent.parent
SH = KIT / '_shared'
CANONICAL = ['fonts-dmsans-jbmono', 'ask-euler', 'sheet-v2', 'sheet-round3', 'hide-tab', 'uniform-ui', 'gv-style']
STYLE = re.compile(r'<style\b[^>]*>(.*?)</style>', re.S | re.I)
_norm = lambda t: re.sub(r'\s+', ' ', t).strip()


def load_registry():
    reg = json.loads((SH / 'registry.json').read_text())
    for r in reg:
        r['_norm'] = _norm((SH / r['file']).read_text()); r['variant'] = r['file'][:-4]   # e.g. hide-tab.v1
    return reg


def remove_shared(html, registry=None):
    registry = registry or load_registry(); by = {r['_norm']: r for r in registry}
    names = []
    def drop(m):
        r = by.get(_norm(m.group(1)))
        if not r: return m.group(0)
        names.append(r['variant']); return ''
    out = STYLE.sub(drop, html)
    return out, names


def verify_only_removed(pristine, built, registry=None):
    expect, names = remove_shared(pristine, registry)
    if expect == built: return True, f'only registered shared blocks removed: {", ".join(names) or "none"}'
    i = next((k for k, (a, b) in enumerate(zip(expect, built)) if a != b), min(len(expect), len(built)))
    return False, f'differs at {i}: expected …{expect[max(0, i - 50):i + 50]!r}… got …{built[max(0, i - 50):i + 50]!r}…'


def shared_attr(rel, registry=None):
    registry = registry or load_registry()
    return ' '.join(r['variant'] for r in sorted(registry, key=lambda r: CANONICAL.index(r['name'])) if rel in r['sims'])


def _strip_fonts(css):
    return re.sub(r'@font-face\s*\{[^{}]*url\(\s*[\'"]?data:[^{}]*\}', '', css)


def _split_top(sel):
    out, depth, cur = [], 0, ''
    for ch in sel:
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == ',' and depth == 0: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur); return out


def _scope(css, variant):
    """Prefix every top-level/@media rule selector with :where(html[data-fsim-shared~="variant"]) (zero specificity)."""
    pre = f':where(html[data-fsim-shared~="{variant}"])'
    def one(sel):
        sel = sel.strip()
        if not sel: return sel
        m = re.match(r'(html|:root)((?:[.#:\[][^\s>+~]*)?)(.*)$', sel, re.S)
        if m: return f'{m.group(1)}{m.group(2)}:where([data-fsim-shared~="{variant}"]){m.group(3)}'
        return f'{pre} {sel}'
    out, i, depth = [], 0, 0
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    tok = re.compile(r'([^{}]*)\{|\}')
    pos = 0; stack = []
    for m in tok.finditer(css):
        if m.group(0) == '}':
            out.append(css[pos:m.start()] + '}'); stack.pop() if stack else None; pos = m.end(); continue
        head = m.group(1); body_start = m.end()
        h = head.strip()
        if h.startswith('@'):
            out.append(css[pos:m.start()] + head + '{'); stack.append('@')
        elif re.match(r'^(from|to|\d+%)', h) and stack and stack[-1] == '@kf':
            out.append(css[pos:m.start()] + head + '{'); stack.append('kf-step')
        else:
            out.append(css[pos:m.start()] + ','.join(one(s) for s in _split_top(head)) + '{'); stack.append('rule')
        if h.startswith('@keyframes') or h.startswith('@-webkit-keyframes'): stack[-1] = '@kf'
        pos = body_start
    out.append(css[pos:])
    return ''.join(out)


def build_shared_css(registry=None):
    registry = registry or load_registry(); n_all = 116
    parts = ['/* ════ SHARED LAYERS (Wave 3) · formerly copied into every sim; emitted UNLAYERED and delivered a second',
             '   time just before the closing body tag so they keep their end-of-page cascade position. Canonical order: '
             + ' < '.join(CANONICAL[1:]) + '. Scoped variants use :where(html[data-fsim-shared~=…]) (zero specificity). ════ */',
             (SH / 'fonts.css').read_text()]
    for name in CANONICAL[1:]:
        for r in sorted((r for r in registry if r['name'] == name), key=lambda r: r['variant']):
            css = _strip_fonts((SH / r['file']).read_text())
            scoped = len(r['sims']) < n_all or sum(1 for x in registry if x['name'] == name) > 1
            parts.append(f'/* ── {r["variant"]} · {len(r["sims"])} sims{" · scoped" if scoped else ""} ── */')
            parts.append(_scope(css, r['variant']) if scoped else css)
    return '\n'.join(parts) + '\n'


if __name__ == '__main__':
    import sys
    reg = load_registry()
    if sys.argv[1:2] == ['css']:
        (SH / 'shared-layers.css').write_text(build_shared_css(reg)); print('wrote _shared/shared-layers.css')
    elif sys.argv[1:2] == ['test']:
        R = pathlib.Path('/Users/admin/Desktop/simulations-1/Fermi_university_sim_lab_sims')
        for rel in sys.argv[2:]:
            s = (R / rel).read_text(); built, names = remove_shared(s, reg)
            ok, msg = verify_only_removed(s, built, reg)
            bad_built = built.replace('</body>', '<style>x{}</style></body>', 1); ok2, _ = verify_only_removed(s, bad_built, reg)
            print(f'{rel}: removed {len(names)} ({", ".join(names)}), -{(len(s) - len(built)) / 1024:.0f} KB · verify {ok} · tamper detected {not ok2} · attr="{shared_attr(rel, reg)}"')
