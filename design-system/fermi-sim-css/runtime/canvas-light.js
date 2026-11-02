/* fermi-sim canvas-light adapter (opt-in per sim; installed by tools/apply.py --canvas-light)
 * Sims whose canvas code only knows a DARK palette (near-black fills, pale neon strokes and labels) keep
 * drawing dark inside the light frame. This remaps every colour the 2-D canvas is given, while the page is
 * light: lightness is flipped for a white ground, hue and saturation are kept, so every colour keeps its
 * meaning (Alice blue, light-cone gold, axis teal). Geometry, physics and numbers are untouched.
 * Affects only CanvasRenderingContext2D colours (fill/stroke/shadow and gradient stops); never WebGL,
 * images, the DOM or the page CSS.
 */
(function () {
  if (window.__fsimCanvasLight) return; window.__fsimCanvasLight = true;
  var root = document.documentElement;
  function light() { return root.getAttribute('data-theme') === 'light' || (document.body && document.body.classList.contains('light-theme')); }
  var P = CanvasRenderingContext2D.prototype, FILL = Object.getOwnPropertyDescriptor(P, 'fillStyle');
  var probe = document.createElement('canvas').getContext('2d'), cache = new Map();
  function parse(c) {                                   // any CSS colour -> [r,g,b,a] via the ORIGINAL canvas parser (never the patched setter)
    FILL.set.call(probe, '#000'); FILL.set.call(probe, c); var v = FILL.get.call(probe);
    if (v[0] === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16), 1];
    var m = v.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]] : null;
  }
  function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
    if (mx !== mn) { var d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l]; }
  function rgb(h, s, l) { function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    if (!s) return [l, l, l].map(function (v) { return Math.round(v * 255); });
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map(function (v) { return Math.round(v * 255); }); }
  function map(c) {
    if (typeof c !== 'string' || !light()) return c;
    var k = cache.get(c); if (k) return k;
    var p = parse(c); if (!p) return c;
    var t = hsl(p[0], p[1], p[2]), h = t[0], s = t[1], l = t[2], L;
    if (l < .3) L = 1 - l * .55;                         // dark grounds and panels -> near-white
    else if (s > .35) L = .30 + (1 - l) * .35;           // saturated accents -> the deeper shade of the same hue
    else L = Math.min(.42, 1 - l);                       // pale greys (grid, axes, labels) -> dark slate
    var o = rgb(h, s, L), out = 'rgba(' + o[0] + ',' + o[1] + ',' + o[2] + ',' + p[3] + ')';
    cache.set(c, out); return out;
  }
  ['fillStyle', 'strokeStyle', 'shadowColor'].forEach(function (name) {
    var d = Object.getOwnPropertyDescriptor(P, name); if (!d || !d.set) return;
    Object.defineProperty(P, name, { configurable: true, enumerable: d.enumerable, get: d.get,
      set: function (v) { d.set.call(this, map(v)); } });
  });
  var G = window.CanvasGradient && CanvasGradient.prototype, stop = G && G.addColorStop;
  if (stop) G.addColorStop = function (o, c) { return stop.call(this, o, map(c)); };
  // The stage around the canvas is often dark too: the <canvas> element's own CSS background, its wrappers, and
  // HTML readout cards, hint pills and formula boxes floating on it, all styled for a dark page only. Inside the
  // simulation window (.plot-box, else the canvas's near ancestors) give every dark ground the same lightness flip
  // and darken every pale text colour (same hue), so the whole window reads as one light surface.
  function stageOf(c) { return (c.closest && c.closest('.plot-box')) || (c.parentElement && c.parentElement.parentElement) || c.parentElement; }
  function lum(p) { return hsl(p[0], p[1], p[2])[2]; }
  function fix(e) {
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return;
    var cs = getComputedStyle(e), bg = parse(cs.backgroundColor), fg = parse(cs.color);
    if (bg && bg[3] > .5 && lum(bg) < .3) e.style.setProperty('background-color', map(cs.backgroundColor), 'important');
    if (e.tagName.toLowerCase() !== 'canvas' && fg && lum(fg) > .62 && [].some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); }))
      e.style.setProperty('color', map(cs.color), 'important');
    var bc = parse(cs.borderTopColor);
    if (bc && bc[3] > .3 && parseFloat(cs.borderTopWidth) > 0 && lum(bc) < .3) e.style.setProperty('border-color', map(cs.borderTopColor), 'important');
  }
  var stages = new Set(), queued = false;
  function grounds() {
    queued = false; if (!light()) return;
    document.querySelectorAll('canvas').forEach(function (c) {
      var st = stageOf(c); if (!st) return;
      for (var e = c; e && e !== st.parentElement; e = e.parentElement) fix(e);   // canvas + wrappers up to the stage
      st.querySelectorAll('*').forEach(fix);                                       // HTML on the stage
      if (!stages.has(st)) { stages.add(st); new MutationObserver(later).observe(st, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] }); }
    });
  }
  function later() { if (!queued) { queued = true; setTimeout(function () { requestAnimationFrame(grounds); }, 250); } }   // throttled: sims toggle classes while animating
  document.addEventListener('DOMContentLoaded', later); addEventListener('load', function () { later(); setTimeout(later, 1200); });
  addEventListener('resize', later);
  // the theme can change after load (e.g. the sim re-reads it): drop cached results when it does
  new MutationObserver(function () { cache.clear(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
})();
