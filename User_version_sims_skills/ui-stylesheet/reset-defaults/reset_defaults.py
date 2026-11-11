#!/usr/bin/env python3
"""Reset in free exploration returns the sim to its first-load view (owner 2026-11-11).

    python3 reset_defaults.py <in.html> <out.html>

The sims' own Reset restarts the run; in many it keeps the sliders where the student left them. This layer records the
starting value of every control in the side panel at load (sliders, number boxes, dropdowns, checkboxes, radios) and,
when Reset is pressed in free exploration, puts them back first (setting each value and firing input + change, as a hand
would), so the sim's own Reset then rebuilds the first-load view. Guided Inquiry and the Simulation guide keep their own
(mode-local) Reset. One <script> just before the mobile app-mode block; a byte proof checks nothing else changed."""
import re, sys, pathlib

JS = ('<script id="fermi-reset-defaults">(function(){\n'
      '  /* Reset in free exploration = the first-load view: the panel\'s controls go back to their starting values, then\n'
      '     the sim\'s own Reset runs (this listener runs first: capture phase). Guided Inquiry / the guide are untouched. */\n'
      '  var d = document, root = d.documentElement, snap = null;\n'
      '  var RESET = "#shell-reset,#resetBtn,#btnReset,#btnResetDefault,#rsB,#reset,#reset-btn,#btn-reset,#resetButton";\n'
      '  var CTRL = "input[type=range],input[type=number],select,input[type=checkbox],input[type=radio]";\n'
      '  function panel(){ return d.body; }   /* every control on the page (side panel, stage, top bar), minus the zones below */\n'
      '  function take(){\n'
      '    var p = panel(); if (!p) return; var l = p.querySelectorAll(CTRL); snap = [];\n'
      '    for (var i = 0; i < l.length; i++) { var e = l[i]; if (e.closest("#inq-cards,#phys-backdrop,[id^=gv-],.fapp-rail,#welcome-overlay")) continue; snap.push({ e: e, id: e.id, v: e.value, c: e.checked }); }\n'
      '  }\n'
      '  function free(){\n'
      '    if (!root.classList.contains("gi-off")) return false;\n'
      '    var t = d.getElementById("gv-tour"); return !(t && !t.hidden && t.getBoundingClientRect().width > 0);\n'
      '  }\n'
      '  function fire(e){ e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }\n'
      '  function restore(){\n'
      '    for (var i = 0; i < snap.length; i++) { var s = snap[i], e = s.e;\n'
      '      if (!e.isConnected && s.id) e = d.getElementById(s.id);   /* panels some sims rebuild: find the control again by id */\n'
      '      if (!e || !e.isConnected || e.disabled) continue;\n'
      '      if (e.type === "checkbox" || e.type === "radio") { if (e.checked !== s.c) { e.checked = s.c; fire(e); } }\n'
      '      else if (e.value !== s.v) {\n'
      '        var proto = e.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;\n'
      '        Object.getOwnPropertyDescriptor(proto, "value").set.call(e, s.v); fire(e); } }\n'
      '  }\n'
      '  d.addEventListener("click", function(ev){\n'
      '    var r = ev.target && ev.target.closest && ev.target.closest(RESET);\n'
      '    if (!r || !snap || !free() || r.closest("#inq-cards,[id^=gv-]")) return;\n'
      '    try { restore(); } catch (e) {}\n'
      '    /* and again once the sim\'s own Reset has run: some reset to their own internal defaults, not the first-load ones */\n'
      '    [0, 350, 900].forEach(function(ms){ setTimeout(function(){ try { restore(); } catch (e) {} }, ms); });\n'
      '  }, true);\n'
      '  /* the defaults = what a fresh entry into free exploration shows: recorded once the sim has booted and is in free\n'
      '     exploration (some sims stage their own free-mode values on entry), after it settles */\n'
      '  var tk = 0; function arm(){ if (snap || !free()) return; clearTimeout(tk); tk = setTimeout(function(){ if (!snap && free()) take(); }, 900); }\n'
      '  function boot(){ arm(); if (window.MutationObserver) new MutationObserver(arm).observe(root, { attributes: true, attributeFilter: ["class"] }); }\n'
      '  if (d.readyState === "complete") setTimeout(boot, 300); else window.addEventListener("load", function(){ setTimeout(boot, 300); });\n'
      '})();</script>\n')

def apply(t):
    if 'id="fermi-reset-defaults"' in t: return t
    am = [m.start() for m in re.finditer(r'<script id="fermi-app-mode(?:-roles)?">', t)]
    bodies = [m.start() for m in re.finditer(r'</body\s*>', t, re.I)]
    at = am[0] if am else (bodies[-1] if bodies else len(t))
    new = t[:at] + JS + t[at:]
    assert new.replace(JS, '', 1) == t and new.count('id="fermi-reset-defaults"') == 1
    return new

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) != 2: sys.exit(__doc__)
    s, o = map(pathlib.Path, a); o.write_text(apply(s.read_text(encoding='utf-8')), encoding='utf-8'); print('reset defaults:', s.name)
