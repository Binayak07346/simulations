#!/usr/bin/env python3
"""Guided Inquiry control glow (the EM course sims' kit-try) for the live user-version sims.

    python3 gi_glow.py <in.html> <out.html> <map.json>     apply; map.json = {"0": ["#box-x"], "2": ["#shell-play"], ...}
    python3 gi_glow.py --check <files...>                  report: done / ready

While a Guided Inquiry card is open, the controls it asks the student to use pulse with the accent outline, until the
student uses one, the card changes, or Guided Inquiry is closed. The card -> control map is data (one per sim); the
layer reads the open card from the page (#inq-cards .inq-step.active) and never touches the sim's own code.
Inserted as one <style> + one <script> just before the mobile app-mode block; a byte proof checks nothing else changed.
Idempotent: a re-run replaces the old block (a new map wins)."""
import json, re, sys, pathlib

CSS = ('<style id="fermi-gi-try-css">\n'
       '/* Guided Inquiry: the control a card asks the student to use glows (as in the EM course sims), until it is used. In\n'
       '   fermi.tokens, the first cascade layer, so it beats fermi-sim.css\'s layered !important borders and shadows. */\n'
       '@layer fermi.tokens{.fermi-try{border-color:var(--color-accent,#4169e1) !important;'
       'box-shadow:0 0 0 2px var(--color-accent,#4169e1),0 0 12px 3px color-mix(in srgb,var(--color-accent,#4169e1) 40%,transparent) !important;'
       'animation:fermiTry 1.2s ease-in-out infinite alternate !important;border-radius:8px;}}\n'
       '@keyframes fermiTry{from{box-shadow:0 0 0 2px var(--color-accent,#4169e1),0 0 5px 1px color-mix(in srgb,var(--color-accent,#4169e1) 28%,transparent);}'
       'to{box-shadow:0 0 0 2px var(--color-accent,#4169e1),0 0 16px 4px color-mix(in srgb,var(--color-accent,#4169e1) 45%,transparent);}}\n'
       '@media (prefers-reduced-motion:reduce){.fermi-try{animation:none !important;}}\n'
       '</style>\n')
JS = ('<script id="fermi-gi-try">(function(){\n'
      '  /* card index -> the controls that card asks the student to use (selectors of their control boxes / buttons) */\n'
      '  var MAP = __MAP__;\n'
      '  var d = document, root = d.documentElement, cur = -2, timer = 0;\n'
      '  function clear(){ var l = d.querySelectorAll(".fermi-try"); for (var i = 0; i < l.length; i++) l[i].classList.remove("fermi-try"); }\n'
      '  function active(){\n'
      '    if (root.classList.contains("gi-off")) return -1;\n'
      '    var cards = d.querySelectorAll("#inq-cards .inq-step");\n'
      '    for (var i = 0; i < cards.length; i++) if (cards[i].classList.contains("active") && cards[i].getBoundingClientRect().height > 0) return i;\n'
      '    return -1;\n'
      '  }\n'
      '  function check(){\n'
      '    var a = active(); if (a === cur) return; cur = a; clearTimeout(timer); clear();\n'
      '    var s = MAP[a]; if (!s || !s.length) return;\n'
      '    timer = setTimeout(function(){   /* after the card\'s own set-up has landed */\n'
      '      if (active() !== a) return;\n'
      '      for (var k = 0; k < s.length; k++) { var e = d.querySelector(s[k]); if (e && e.getBoundingClientRect().width > 0) e.classList.add("fermi-try"); }\n'
      '    }, 450);\n'
      '  }\n'
      '  ["pointerdown", "input", "click", "keydown"].forEach(function(ev){ d.addEventListener(ev, function(e){\n'
      '    var t = e.isTrusted && e.target && e.target.closest && e.target.closest(".fermi-try"); if (t) t.classList.remove("fermi-try");\n'
      '  }, true); });\n'
      '  function start(){\n'
      '    var box = d.getElementById("inq-cards"); if (!box || !window.MutationObserver) return;\n'
      '    var mo = new MutationObserver(function(){ check(); });\n'
      '    mo.observe(box, { subtree: true, attributes: true, attributeFilter: ["class", "hidden", "style"] });\n'
      '    mo.observe(root, { attributes: true, attributeFilter: ["class"] });\n'
      '    check();\n'
      '  }\n'
      '  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", start); else start();\n'
      '})();</script>\n')
BLOCK_RE = re.compile(r'<style id="fermi-gi-try-css">[\s\S]*?</style>\n<script id="fermi-gi-try">[\s\S]*?</script>\n')

def block(mp):
    clean = {str(int(k)): [s for s in v if re.fullmatch(r'#[A-Za-z][\w\-:.]*', s)] for k, v in mp.items() if v}
    clean = {k: v for k, v in clean.items() if v}
    return CSS + JS.replace('__MAP__', json.dumps(clean, separators=(',', ':'), sort_keys=True))

def apply(t, mp):
    t0 = BLOCK_RE.sub('', t)
    am = [m.start() for m in re.finditer(r'<script id="fermi-app-mode(?:-roles)?">', t0)]
    bodies = [m.start() for m in re.finditer(r'</body\s*>', t0, re.I)]
    at = am[0] if am else (bodies[-1] if bodies else len(t0))
    blk = block(mp)
    new = t0[:at] + blk + t0[at:]
    assert new.replace(blk, '', 1) == t0 and new.count('id="fermi-gi-try"') == 1
    assert '<script' not in blk[blk.index('>') + 1:blk.rindex('</script>')].replace('<script id="fermi-gi-try">', '')
    return new

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--check']:
        for f in a[1:]: print(('done ' if 'id="fermi-gi-try"' in pathlib.Path(f).read_text(encoding='utf-8') else 'ready'), f)
        sys.exit(0)
    if len(a) != 3: sys.exit(__doc__)
    src, dst, mp = pathlib.Path(a[0]), pathlib.Path(a[1]), json.loads(pathlib.Path(a[2]).read_text())
    dst.write_text(apply(src.read_text(encoding='utf-8'), mp), encoding='utf-8'); print('gi glow:', src.name, len(mp), 'cards mapped')
