#!/usr/bin/env node
/*
 * Simulation guide (overlay; formerly Controls Guide) invariant verifier —
 * config-free. Covers the scene tour (spot steps, #cg-spot) + the controls walk.
 * Geometry (spot placement, callout overlap, HIDE-tab follow) needs a real
 * browser — see SKILL.md §4 scene-tour checks; jsdom has no layout.
 * Usage: node verify.js <patched.html> [--baseline <original.html>]
 * Discovers the guide from the DOM (#btn-cg, .cg-callout, .cg-nav) and
 * asserts the validated behavior. With --baseline, pre-existing runtime
 * errors (CDN libs failing headlessly) are subtracted. Exit 0 = pass.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const args = process.argv.slice(2);
const target = args[0];
const baseline = args.includes('--baseline') ? args[args.indexOf('--baseline') + 1] : null;
if (!target) { console.error('usage: node verify.js <patched.html> [--baseline <original.html>]'); process.exit(1); }

const h = {};
// Canvas stub: every property is callable, every call returns the same callable,
// numeric coercion gives 0 and `.width` gives 10 — so sim draw loops never throw headlessly.
const anyFn = new Proxy(function () {}, { get: (t, k) => (k === 'width' || k === 'height' ? 10 : k === Symbol.toPrimitive ? () => 0 : anyFn), apply: () => anyFn });
h.o = anyFn;
let cssDropped = false;   // jsdom drops a stylesheet it cannot parse → computed styles become unreliable
function boot(file) {
  const html = fs.readFileSync(file, 'utf8');
  const errors = [];
  const { VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (/Could not parse CSS stylesheet/.test(String(e && e.message))) cssDropped = true; });
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => h.o;
    w.Element.prototype.scrollIntoView = function () {};
    w.requestAnimationFrame = cb => setTimeout(() => cb(16), 16);
  }});
  dom.window.addEventListener('error', e => errors.push(String(e.message)));
  return new Promise(res => setTimeout(() => res({ dom, errors }), 500));
}
const fails = [], warns = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const warn = (c, m) => { if (!c) warns.push(m); };
// words = tokens containing a letter or digit ("—", "=", "·" are not words)
const words = t => t.trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;

(async () => {
  const baseErrs = baseline ? (await boot(baseline)).errors : [];
  const { dom, errors } = await boot(target);
  const d = dom.window.document;
  const $ = s => d.querySelector(s);
  const $$ = s => Array.from(d.querySelectorAll(s));
  // Double-application guard: a skill applied twice must be caught, not tolerated
  for (const id of ['btn-gi','btn-cg','inq-zone','aside-inquiry','welcome-overlay','cg-callout','ctlZone']) {
    const n = d.querySelectorAll('#' + id + ', .' + id).length; ok(n <= 1, `no duplicate #${id} (found ${n})`);
  }
  { const tpl = [...d.querySelectorAll('script')].map(x => x.textContent).filter(t => /Controls Guide|Welcome overlay|Two-button template|Guided Inquiry \+ Controls Guide/.test(t)); ok(tpl.length === new Set(tpl).size, 'no duplicated template script blocks (' + tpl.length + ' template scripts)'); }
  const btn = $('#btn-cg');
  ok(!!btn, '#btn-cg present');
  if (!btn) return report();
  const hiddenSet = () => new Set($$('.cg-hidden, .cg-veiled'));
  const glows = () => $$('.cg-glow');
  const realGlows = () => glows().filter(e => e.id !== 'cg-spot');
  const spotOn = () => { const sp = $('#cg-spot'); return !!sp && sp.style.display === 'block'; };
  { const lab = btn.textContent; ok(/Simulation guide/.test(lab) && !/Controls Guide/i.test(lab), `header #btn-cg labelled "Simulation guide" (got "${lab.trim()}")`);
    ok(/simulation guide/i.test(btn.getAttribute('title') || ''), '#btn-cg title mentions the simulation guide'); }

  // Boot: original untouched
  ok(!$('.cg-callout') && !$('.cg-nav'), 'boot: no callout/nav in DOM');
  ok(hiddenSet().size === 0 && glows().length === 0, 'boot: no cg classes applied');
  ok(!btn.classList.contains('active'), 'boot: guide button inactive');

  // Open
  btn.click();
  const co = $('.cg-callout'), nav = $('.cg-nav');
  ok(btn.classList.contains('active'), 'open: button active');
  ok(!!co && !!nav && co.style.display !== 'none', 'open: callout + nav shown');
  ok(!!co && !!co.querySelector('.cg-arrow'), 'open: arrow element present');
  ok(!!$('#cg-spot'), 'open: #cg-spot spotlight element created with the callout');
  warn(!!$('#cg-spot') && $('#cg-spot').hasAttribute('data-no-reset'), '#cg-spot should carry data-no-reset (reference §7.2; harmless without it — pointer-events:none)');
  const next = () => $('#cg-next'), prev = () => $('#cg-prev');
  ok(hiddenSet().size > 0, 'step 1: later elements hidden/veiled');
  ok(glows().length <= 1, 'step 1: at most one glowing element');
  // scene step = no real element glows (the spot, or an unanchored callout when jsdom has no geometry)
  // (a kept whole-canvas opener glows a real element, so it is not counted — that's fine)
  let sceneSteps = 0;
  const tallyScene = () => { if (realGlows().length === 0 && next().textContent.trim() !== 'Done') sceneSteps++; };
  tallyScene();
  { const n = words(co.querySelector('p').textContent); ok(n <= 26, `step 1: text ≤24 words (${n})`); warn(n <= 24, `step 1: text ${n} words (budget 24)`); }

  // Forward walk: monotone reveal; glow never hidden; side class per step
  let prevHidden = hiddenSet().size, steps = 1;
  const titles = [co.querySelector('h5').textContent];
  while (next().textContent.trim() !== 'Done') {
    next().click(); steps++;
    const hs = hiddenSet();
    ok(hs.size <= prevHidden, `step ${steps}: reveal monotone (${hs.size} <= ${prevHidden})`);
    prevHidden = hs.size;
    const g = glows();
    const isScene = realGlows().length === 0;
    tallyScene();
    if (g.length) {
      ok(g.length === 1, `step ${steps}: one glow`);
      ok(!g[0].classList.contains('cg-hidden') && !g[0].classList.contains('cg-veiled'), `step ${steps}: glowing element is visible`);
      { const cs = dom.window.getComputedStyle(g[0]); (cssDropped ? warn : ok)(cs.display !== 'none' && cs.visibility !== 'hidden', `step ${steps}: glowing element not hidden by the sim itself (computed style${cssDropped ? ' — unreliable: jsdom dropped a stylesheet; confirm in the browser smoke' : ''})`); }
      if (!isScene) ok(/arrow-(top|bottom|left|right)/.test(co.className), `step ${steps}: callout has a side arrow class`);
      else ok(spotOn() && g[0].id === 'cg-spot', `step ${steps}: on a scene step only #cg-spot glows`);
    }
    if (isScene) ok(!spotOn() || g.length === 1, `step ${steps}: a shown spot carries the glow`);
    titles.push(co.querySelector('h5').textContent);
    { const n = words(co.querySelector('p').textContent), lim = isScene ? 24 : 18;
      ok(n <= lim + 2, `step ${steps}: text ≤${lim} words (${n})`); warn(n <= lim, `step ${steps}: text ${n} words (budget ${lim})`); }
    if (steps > 40) { ok(false, 'runaway walk'); break; }
  }
  ok(co.classList.contains('no-arrow'), 'closing card: no arrow');
  ok(glows().length === 0, 'closing card: no glow');
  ok(!spotOn(), 'closing card: spotlight hidden');
  ok(sceneSteps >= 4 && sceneSteps <= 6, `scene tour: 4–6 scene steps before the controls (found ${sceneSteps})`);
  ok(hiddenSet().size === 0, 'closing card: everything revealed');
  ok(new Set(titles).size === titles.length, 'step titles unique');

  // Back-nav never re-hides
  prev().click(); prev().click();
  ok(hiddenSet().size === 0, 'back-nav: nothing re-hides');
  while (next().textContent.trim() !== 'Done') next().click();

  // Done: restore + deactivate; revisit = closing card, all visible
  next().click();
  ok(!btn.classList.contains('active'), 'done: button inactive');
  ok(co.style.display === 'none' && nav.style.display === 'none', 'done: callout + nav hidden');
  ok(hiddenSet().size === 0 && glows().length === 0, 'done: all cg classes cleared');
  ok(!spotOn(), 'done: spotlight hidden');
  btn.click();
  ok(co.classList.contains('no-arrow') && hiddenSet().size === 0, 'revisit after done: closing card, all visible (session memory)');
  btn.click();

  // Reset during the guide. Current product rule (reset-mode-local skill): the
  // tour restarts at step 1 and stays open. Legacy builds: the guide closes and
  // its progress clears (reopen = step 1). Either passes; a mid-tour step does not.
  const reset = $('#reset-btn, #btn-reset, #shell-reset, [id*="reset" i]');
  if (reset) {
    btn.click(); prev().click(); reset.click();   // reopen lands on the closing card (session memory); step back so Reset fires mid-tour
    await new Promise(r => setTimeout(r, 120)); // reset handlers may defer a tick
    if (btn.classList.contains('active')) {
      ok(co.querySelector('h5').textContent === titles[0] && hiddenSet().size > 0, 'reset (mode-local): guide restarted at step 1 with elements re-hidden');
      btn.click();
    } else {
      btn.click();
      ok(hiddenSet().size > 0 && co.querySelector('h5').textContent === titles[0], 'reset (legacy): reopen starts at step 1 with elements re-hidden');
      btn.click();
    }
  } else ok(false, 'no Reset element found (expected id containing "reset")');

  const newErrs = errors.filter(e => !baseErrs.includes(e));
  ok(newErrs.length === 0, 'no new runtime errors: ' + JSON.stringify(newErrs.slice(0, 3)));
  report();

  function report() {
    warns.forEach(w => console.log('  ⚠ ' + w));
    if (fails.length) { console.log(`FAIL (${fails.length}):`); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
    console.log(`PASS — ${steps} steps (${sceneSteps} scene), all Simulation guide invariants hold` + (baseline ? ` (${baseErrs.length} baseline errors ignored)` : ''));
    process.exit(0);
  }
})().catch(e => { console.log('FAIL (harness): ' + (e && e.message)); process.exit(1); });
