#!/usr/bin/env python3
"""The full-screen button of the new (EM course / sim-builder) sims, added to the top bar of the live user-version sims.

    python3 fullscreen.py <in.html> <out.html>        apply (in == out allowed)
    python3 fullscreen.py --check <files...>          report: done / ready / skip (why)

The change (nothing else is touched):
  1. the EM button, byte for byte (#shell-fullscreen, the expand / collapse icons, data-no-reset), placed
       - shell-header sims: at the end of .shell-controls (exactly where the EM sims have it);
       - older top bars (QM lab .top-bar / .title-bar / .app-header ...): right after the top bar's Reset / Play
         group, inside it, with the Reset button's own classes so it looks like its neighbours;
       - a bar with no such group: at the end of the bar;
  2. <style id="fermi-fullscreen-css"> (the EM icon rules + an icon-button size for bars without .shell-icon-btn) and
     <script id="fermi-fullscreen"> (browser full screen on the whole page; the icon flips; a resize is sent so the sim
     refits; the button hides itself where full screen is not allowed), both just before the mobile app-mode block.
Built from exact insertions on the original text; a line-level proof checks nothing else changed. Idempotent."""
import difflib, re, sys, pathlib, bisect

ICON_ON = ('<svg class="fs-on" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 7.5V3h4.5M12.5 3H17v4.5M17 12.5V17h-4.5M7.5 17H3v-4.5" '
           'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>')
ICON_OFF = ('<svg class="fs-off" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7.5 3v4.5H3M17 7.5h-4.5V3M12.5 17v-4.5H17M3 12.5h4.5V17" '
            'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>')
def button(cls):
    return (f'<button id="shell-fullscreen" class="{cls}" type="button" data-no-reset title="Full screen" aria-label="Full screen" '
            f'aria-pressed="false">{ICON_ON}{ICON_OFF}</button>')
EM_CLASS = 'shell-btn shell-icon-btn'

STYLE = ('<style id="fermi-fullscreen-css">\n'
         '/* Full-screen button (EM course sims, owner 2026-10-12), at the right end of the top bar; the icon flips while on. */\n'
         '#shell-fullscreen{display:inline-flex;align-items:center;justify-content:center;min-width:36px;padding-left:9px !important;padding-right:9px !important;flex:0 0 auto;}\n'
         '#shell-fullscreen[hidden]{display:none !important;}\n'
         '#shell-fullscreen svg{display:block;}\n'
         '#shell-fullscreen .fs-off{display:none;}\n'
         '#shell-fullscreen.active .fs-on{display:none;}\n'
         '#shell-fullscreen.active .fs-off{display:block;}\n'
         '/* The top bar never wraps and never grows (owner 2026-11-11): only the title gives way. The script first tightens the\n'
         '   gaps (fs-tight), then steps the title size down, and a title that still does not fit ends in "..." (full text on hover). */\n'
         '.shell-header{flex-wrap:nowrap !important;}\n'
         '.shell-header .shell-title{flex:0 1 auto !important;min-width:0 !important;overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important;}\n'
         '.shell-header .shell-nav,.shell-header .shell-controls,.shell-header .shell-group{flex-wrap:nowrap !important;flex-shrink:0 !important;}\n'
         'html.fs-tight .shell-header{column-gap:10px !important;}\n'
         'html.fs-tight .shell-header .shell-controls,html.fs-tight .shell-header .shell-group,html.fs-tight .shell-header .shell-nav{gap:5px !important;}\n'
         'html.fs-tight .shell-header .shell-btn{padding-left:8px !important;padding-right:8px !important;}\n'
         'html.fs-tight .shell-header .shell-sep{margin-left:0 !important;margin-right:0 !important;}\n'
         '@layer fermi.tokens{.shell-header{flex-wrap:nowrap !important;}.shell-header .shell-title{min-width:0 !important;overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important;}'
         'html.fs-tight .shell-header .shell-controls,html.fs-tight .shell-header .shell-group,html.fs-tight .shell-header .shell-nav{gap:5px !important;}html.fs-tight .shell-header .shell-btn{padding-left:8px !important;padding-right:8px !important;}}\n'
         '</style>\n')
SCRIPT = ('<script id="fermi-fullscreen">(function(){\n'
          '  var d = document, el = d.documentElement, b = d.getElementById("shell-fullscreen");\n'
          '  /* One-line top bar: tighten the gaps, then step the title size down; a title that still does not fit ends in "...". */\n'
          '  function fit(){\n'
          '    var h = d.querySelector(".shell-header"); if (!h) return; var t = h.querySelector(".shell-title"), c = el.classList;\n'
          '    c.remove("fs-tight"); if (t) t.style.fontSize = "";\n'
          '    var over = function(){ return h.scrollWidth > h.clientWidth + 1 || (t && t.scrollWidth > t.clientWidth + 1); };\n'
          '    if (over()) { c.add("fs-tight");\n'
          '      if (t && over()) { var base = parseFloat(getComputedStyle(t).fontSize) || 18, k = [0.92, 0.85, 0.78];\n'
          '        for (var i = 0; i < k.length && over(); i++) t.style.fontSize = (base * k[i]).toFixed(1) + "px"; } }\n'
          '    if (t) { if (!t.hasAttribute("data-fs-t0")) t.setAttribute("data-fs-t0", t.getAttribute("title") || "");\n'
          '      var cut = t.scrollWidth > t.clientWidth + 1; var t0 = t.getAttribute("data-fs-t0");\n'
          '      if (cut) t.setAttribute("title", t.textContent.trim()); else if (t0) t.setAttribute("title", t0); else t.removeAttribute("title"); }\n'
          '  }\n'
          '  var ft; window.addEventListener("resize", function(){ clearTimeout(ft); ft = setTimeout(fit, 60); });\n'
          '  if (d.readyState === "complete") fit(); else window.addEventListener("load", fit); setTimeout(fit, 400);\n'
          '  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);\n'
          '  /* Browser full screen for the whole sim page (the EM course sims\' #shell-fullscreen). Hidden where the page\n'
          '     may not go full screen (an iframe without allow="fullscreen", some phones). */\n'
          '  if (!b) return;\n'
          '  if (!(d.fullscreenEnabled || d.webkitFullscreenEnabled)) { b.hidden = true; fit(); return; }\n'
          '  function cur(){ return d.fullscreenElement || d.webkitFullscreenElement; }\n'
          '  b.addEventListener("click", function(e){\n'
          '    e.stopPropagation();\n'
          '    if (cur()) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }\n'
          '    var r = el.requestFullscreen || el.webkitRequestFullscreen; var p = r && r.call(el);\n'
          '    if (p && p.catch) p.catch(function(){});\n'
          '  });\n'
          '  function sync(){\n'
          '    var on = !!cur(); b.classList.toggle("active", on);\n'
          '    b.title = on ? "Exit full screen" : "Full screen"; b.setAttribute("aria-label", b.title); b.setAttribute("aria-pressed", String(on));\n'
          '    requestAnimationFrame(function(){ window.dispatchEvent(new Event("resize")); });\n'
          '  }\n'
          '  d.addEventListener("fullscreenchange", sync); d.addEventListener("webkitfullscreenchange", sync);\n'
          '})();</script>\n')

class Skip(Exception):
    pass

TAG = re.compile(r'<(/?)(div|header|nav|section|span)\b[^>]*?(/?)>', re.I)
def close_of(t, start):
    """Index of the closing tag that matches the element opening at `start`."""
    name = re.match(r'<(\w+)', t[start:]).group(1).lower(); depth = 0
    for m in re.finditer(r'<(/?)' + name + r'\b[^>]*>', t[start:], re.I):
        if m.group(1): depth -= 1
        else: depth += 1
        if depth == 0: return start + m.start()
    raise Skip('unbalanced ' + name)
def open_parent(t, lo, pos):
    """Start of the innermost <div>/<header> that is open at `pos` (searching from `lo`)."""
    stack = []
    for m in re.finditer(r'<(/?)(div|header)\b[^>]*>', t[lo:pos], re.I):
        if m.group(1): stack and stack.pop()
        else: stack.append(lo + m.start())
    if not stack: raise Skip('no parent group')
    return stack[-1]

BAR_RE = re.compile(r'<(header|div)\b[^>]*class="(?:[^"]*\s)?(top-bar|title-bar|app-header|header-bar|top-bar-app|sim-header)(?:\s[^"]*)?"[^>]*>', re.I)
RESET_RE = re.compile(r'<button\b[^>]*\bid="(shell-reset|resetBtn|btnReset|btnResetDefault|btn-reset|reset-btn|resetButton|reset)"[^>]*>', re.I)

def plan(t):
    if 'id="shell-fullscreen"' in t: raise Skip('already done')
    sheet = t.find('id="phys-backdrop"'); limit = sheet if sheet > 0 else len(t)
    hs = t.find('<header class="shell-header"')
    if 0 <= hs < limit:
        he = close_of(t, hs)
        cs = t.find('<div class="shell-controls"', hs, he)
        if cs < 0: at, cls, where = he, EM_CLASS, 'shell-header end'
        else: at, cls, where = close_of(t, cs), EM_CLASS, 'shell-controls end'
    else:
        bm = next((m for m in BAR_RE.finditer(t, 0, limit)), None)
        if not bm:   # bars without a known class: the playback group right after The Physics button
            tf = t.find('id="toggle-formal"', 0, limit)
            gm = re.search(r'<div class="sim-playback-btn-group"[^>]*>', t[tf:limit]) if tf >= 0 else None
            if not gm: raise Skip('no top bar')
            gs = tf + gm.start(); ge = close_of(t, gs)
            fb = re.search(r'<button\b[^>]*class="([^"]*)"', t[gs:ge])
            base = [c for c in (fb.group(1).split() if fb else []) if not re.search(r'primary|danger|reset|play|active|warn|success|start|on$|paused', c)]
            cls = ' '.join(base + ['fermi-fs-btn']); return finish(t, ge, cls, 'end of the playback group after The Physics')
        be = close_of(t, bm.start())
        rm = next((m for m in RESET_RE.finditer(t, bm.end(), be)), None)
        if rm:
            ps = open_parent(t, bm.start(), rm.start())
            at = close_of(t, ps) if ps != bm.start() else be
            rc = re.search(r'class="([^"]*)"', rm.group(0))
            base = [c for c in (rc.group(1).split() if rc else []) if not re.search(r'primary|danger|reset|play|active|warn|success', c)]
            cls = ' '.join(base + ['fermi-fs-btn']) or 'fermi-fs-btn'; where = 'after the top-bar Reset group'
        else:
            at, cls, where = be, 'fermi-fs-btn', 'top-bar end'
    return finish(t, at, cls, where)

def finish(t, at, cls, where):
    am = [m.start() for m in re.finditer(r'<script id="fermi-app-mode(?:-roles)?">', t)]
    bodies = [m.start() for m in re.finditer(r'</body\s*>', t, re.I)]
    tail = am[0] if am else (bodies[-1] if bodies else len(t))
    if tail <= at: raise Skip('layer tail before the bar')
    return [(at, at, button(cls)), (tail, tail, STYLE + SCRIPT)], where

def apply(t):
    edits, where = plan(t)
    out, pos = [], 0
    for s, e, rep in sorted(edits):
        out += [t[pos:s], rep]; pos = e
    out.append(t[pos:]); new = ''.join(out)
    prove(t, new, edits)
    return new, where

def prove(old, new, edits):
    ol, nl = old.splitlines(keepends=True), new.splitlines(keepends=True)
    starts, pos = [], 0
    for ln in ol: starts.append(pos); pos += len(ln)
    line_of = lambda off: max(0, bisect.bisect_right(starts, off) - 1)
    allowed = {line_of(s) for s, e, _ in edits}
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ol, nl, autojunk=False).get_opcodes():
        if tag == 'equal': continue
        for i in (range(i1, i2) if i2 > i1 else [i1]):
            if i not in allowed: raise AssertionError(f'unexpected change at line {i}')
    stripped = new
    for _, _, rep in edits: stripped = stripped.replace(rep, '', 1)
    assert stripped == old, 'output minus the insertions != input'
    assert new.count('id="shell-fullscreen"') == 1 and new.count('id="fermi-fullscreen"') == 1

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--check']:
        for f in a[1:]:
            try: _, w = plan(pathlib.Path(f).read_text(encoding='utf-8')); print(f'ready   {f}  ({w})')
            except Skip as s: print(f'{"done " if "already" in str(s) else "skip "}   {f}  ({s})')
        sys.exit(0)
    if len(a) != 2: sys.exit(__doc__)
    src, dst = map(pathlib.Path, a); t = src.read_text(encoding='utf-8')
    try: new, where = apply(t)
    except Skip as s:
        if 'already' in str(s): dst.write_text(t, encoding='utf-8'); print(f'already done: {src.name}'); sys.exit(0)
        print(f'SKIP {src.name}: {s}'); sys.exit(3)
    dst.write_text(new, encoding='utf-8'); print(f'full screen: {src.name} ({where})')
