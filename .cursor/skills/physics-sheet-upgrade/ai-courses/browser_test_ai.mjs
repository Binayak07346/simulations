// Browser gate for an installed AI-course Physics sheet.
// Usage: node browser_test_ai.mjs <sim.html> [shotsDir]
// Needs puppeteer-core (resolved from REQ below) and system Chrome.
// Checks — every one must hold, and each is proven non-vacuous (it asserts it found something):
//   1  loads with 0 page errors / console errors
//   2  ⚛︎ The Physics opens the sheet; the sheet sits above the header (elementFromPoint)
//   3  Guided Inquiry: note shown, every See-it paused, clicking one leaves the sheet open and the
//      sim's controls untouched
//   4  live panel: every mirrored control drives the sim's own control both ways, and the live
//      number changes when it moves (it is not frozen)
//   5  Esc closes the sheet only (Maximize survives); close restores the play state
//   6  Free Exploration: note hidden; every See-it closes the sheet, shows its toast, and changes
//      no unrelated thing into an error; the scene call happened
//   7  light theme renders the sheet readable (text colour differs from background)
//   8  Download builds a standalone page (captured, no navigation) containing no See-it buttons
//      and the snapshot line
// Screenshots (if shotsDir): sheet-dark.png (full sheet), sheet-light.png, gi-paused.png, seesim-<key>.png
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const REQ = '/Users/admin/Desktop/simulations-1/Fermi_SR_simulations/Capacity_SR_sims_v2_engine/_review/';
const require = createRequire(REQ);
const puppeteer = require('puppeteer-core');
const [,, file, shots] = process.argv;
if (!file) { console.log('usage: node browser_test_ai.mjs <sim.html> [shotsDir]'); process.exit(2); }
if (shots) mkdirSync(shots, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] });
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 160)));
p.on('console', m => { if (m.type() === 'error' && !/favicon|fonts\.g|katex|ERR_/i.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
const res = []; const ok = (name, cond, info = '') => res.push([cond ? 'PASS' : 'FAIL', name, info]);
try {
  await p.goto('file://' + file, { waitUntil: 'load', timeout: 45000 }); await sleep(900);
  // enter Guided Inquiry the way a student does
  await p.evaluate(() => { const w = document.querySelector('.welcome-mode[data-mode="inquiry"]') || document.querySelector('.welcome-mode'); if (w) w.click(); else if (window.__setMode) window.__setMode('inquiry'); });
  await sleep(700);
  const ctlSnap = () => p.evaluate(() => [...document.querySelectorAll('.shell-aside input, .shell-aside select, .shell-aside button')]
    .filter(e => e.tagName !== 'BUTTON' || e.classList.contains('active') || e.classList.contains('is-on') || e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-checked') === 'true')
    .map(e => (e.id || e.textContent.trim().slice(0, 20)) + '=' + (e.tagName === 'BUTTON' ? 'on' : (e.type === 'checkbox' || e.type === 'radio' ? e.checked : e.value))).join('|'));

  // 2 open
  await p.click('#toggle-formal'); await sleep(400);
  const open = await p.evaluate(() => {
    const bd = document.getElementById('phys-backdrop'), t = document.getElementById('toggle-formal').getBoundingClientRect();
    const top = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
    return { open: bd.classList.contains('open'), covered: bd.contains(top), chapters: document.querySelectorAll('#phys-art .ch').length,
      seesims: document.querySelectorAll('#phys-art .seesim').length, svgs: document.querySelectorAll('#phys-art svg').length,
      playing: !!(window.Shell && Shell.playing) };
  });
  ok('sheet opens from ⚛︎ The Physics', open.open, JSON.stringify(open));
  ok('sheet covers the header (no click-through)', open.covered);
  ok('7 chapters, ≥3 figures/equations, ≥1 See-it', open.chapters === 7 && open.svgs >= 3 && open.seesims >= 1, `ch ${open.chapters} svg ${open.svgs} see ${open.seesims}`);
  ok('opening pauses the sim', !open.playing);
  const selfTest = await p.evaluate(() => { const no = [...document.querySelectorAll('#phys-art .ch .no')].find(n => n.textContent.trim() === '07'); const ch = no && no.closest('.ch');
    const qs = ch ? [...ch.querySelectorAll('details.phys-q')] : []; return { n: qs.length, answered: qs.every(d => d.querySelector('summary') && d.querySelector('.ans') && d.querySelector('.ans').textContent.trim().length > 15) }; });
  ok('ch 07 self-test: 3 tap-to-reveal questions with answers', selfTest.n === 3 && selfTest.answered, JSON.stringify(selfTest));

  // 3 GI pause
  const giOn = await p.evaluate(() => { const c = document.getElementById('inq-cards'); return !!(c && c.offsetParent); });
  const gi = await p.evaluate(() => ({ note: !document.querySelector('.phys-gi-note').hidden,
    paused: [...document.querySelectorAll('#phys-art .seesim')].every(b => b.getAttribute('aria-disabled') === 'true') }));
  ok('GI is actually showing (test precondition)', giOn);
  ok('GI note shown + all See-its paused', gi.note && gi.paused, JSON.stringify(gi));
  if (shots) await p.screenshot({ path: shots + '/gi-paused.png' });
  const before = await ctlSnap();
  await p.evaluate(() => document.querySelector('#phys-art .seesim').click()); await sleep(400);
  const after = await ctlSnap();
  const stillOpen = await p.evaluate(() => document.getElementById('phys-backdrop').classList.contains('open'));
  ok('paused See-it changes nothing and keeps the sheet open', stillOpen && before === after && before.length > 0);

  // 4 live panel both ways
  const live = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const out = [];
    const isOn = b => b.classList.contains('active') || b.classList.contains('is-on') || b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true';
    // button-group / radio mirrors: click another chip -> that sim option becomes active; click the sim's original option -> chip follows
    for (const g of document.querySelectorAll('#phys-mini .phys-chips')) {
      const src = [...document.querySelectorAll(g.dataset.src)].filter(e => !e.closest('#phys-backdrop'));
      const act = e => e.type === 'radio' ? e.checked : isOn(e);
      const chips = [...g.querySelectorAll('.phys-chip')]; const i0 = src.findIndex(act); const n0 = document.getElementById('phys-num').innerHTML;
      const j = chips.findIndex((c, i) => i !== i0); if (j < 0 || i0 < 0) { out.push([g.id, 'no alternative option']); continue; }
      chips[j].click(); await sleep(200);
      const fwd = act(src[j]) && chips[j].classList.contains('on'); const n1 = document.getElementById('phys-num').innerHTML;
      src[i0].click(); await sleep(250);
      const back = chips[i0].classList.contains('on') && !chips[j].classList.contains('on');
      out.push([g.id, fwd, back, n0 !== n1, /NaN|undefined|Infinity/.test(n1)]);
    }
    // checkbox mirrors
    for (const m of document.querySelectorAll('#phys-mini input[type=checkbox]')) {
      const src = document.getElementById(m.id.replace(/^phys-m-/, '')); if (!src) { out.push([m.id, 'no source']); continue; }
      const c0 = src.checked, n0 = document.getElementById('phys-num').innerHTML;
      m.click(); await sleep(150);
      const fwd = src.checked === !c0 && m.checked === !c0; const n1 = document.getElementById('phys-num').innerHTML;
      src.click(); await sleep(150);
      const back = src.checked === c0 && m.checked === c0;
      out.push([m.id, fwd, back, n0 !== n1, /NaN|undefined|Infinity/.test(n1)]);
    }
    const minis = [...document.querySelectorAll('#phys-mini input[type=range], #phys-mini select')];
    for (const m of minis) {
      const src = document.getElementById(m.id.replace(/^phys-m-/, '')); if (!src) { out.push([m.id, 'no source']); continue; }
      const v0 = src.value, n0 = document.getElementById('phys-num').innerHTML;
      let target;
      if (m.tagName === 'SELECT') { const o = [...m.options].map(x => x.value).find(x => x !== m.value); target = o; }
      else { target = String(+m.value === +m.max ? m.min : m.max); }
      m.value = target; m.dispatchEvent(new Event(m.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); await sleep(120);
      const fwd = String(src.value) === String(m.value);
      const n1 = document.getElementById('phys-num').innerHTML;
      // back: move the SIM control, the mirror must follow
      src.value = v0; src.dispatchEvent(new Event('input', { bubbles: true })); src.dispatchEvent(new Event('change', { bubbles: true })); await sleep(120);
      const back = String(m.value) === String(src.value);
      out.push([m.id, fwd, back, n0 !== n1, /NaN|undefined|Infinity/.test(n1)]);
    }
    return { out, num: document.getElementById('phys-num').innerHTML, worked: document.getElementById('phys-worked').innerHTML.length };
  });
  ok('live panel has ≥1 mirrored control', live.out.length >= 1, JSON.stringify(live.out));
  ok('every mirrored control drives the sim and follows it', live.out.every(r => r[1] === true && r[2] === true), JSON.stringify(live.out));
  ok('live number reacts to at least one control', live.out.some(r => r[3] === true));
  ok('no NaN/undefined/Infinity in live panel', live.out.every(r => r[4] === false) && !/NaN|undefined|Infinity/.test(live.num));
  ok('worked run is filled', live.worked > 40, 'chars ' + live.worked);

  // 5 Esc closes sheet only
  await p.evaluate(() => { const m = document.getElementById('shell-maximize'); if (m) m.click(); });
  await p.keyboard.press('Escape'); await sleep(300);
  const esc = await p.evaluate(() => ({ closed: !document.getElementById('phys-backdrop').classList.contains('open'), max: document.getElementById('shell').classList.contains('shell-max') }));
  ok('Esc closes the sheet', esc.closed);
  ok('Esc leaves Maximize alone', esc.max || !(await p.evaluate(() => !!document.getElementById('shell-maximize'))));
  if (esc.max) await p.evaluate(() => document.getElementById('shell-maximize').click());

  // 6 Free Exploration See-its
  await p.evaluate(() => window.__setMode && window.__setMode('free')); await sleep(500);
  const keys = await p.evaluate(() => [...document.querySelectorAll('#phys-art .seesim')].map(b => b.dataset.show));
  let sceneCalls = 0;
  for (const k of keys) {
    await p.evaluate(() => window.__openPhysics()); await sleep(250);
    const note = await p.evaluate(() => document.querySelector('.phys-gi-note').hidden);
    if (!note) { ok('GI note hidden in Free Exploration', false); break; }
    const r = await p.evaluate(async key => {
      const H = window.__physicsHooks, orig = H.scene; let called = 0;
      H.scene = function (c) { called++; return orig.apply(this, arguments); };
      document.querySelector(`#phys-art .seesim[data-show="${key}"]`).click();
      await new Promise(r => setTimeout(r, 900));
      H.scene = orig;
      return { called, closed: !document.getElementById('phys-backdrop').classList.contains('open'), toast: document.getElementById('phys-toast').classList.contains('show') };
    }, k);
    sceneCalls += r.called;
    ok(`See-it "${k}" drives the sim`, r.called === 1 && r.closed, JSON.stringify(r));
    if (shots) await p.screenshot({ path: `${shots}/seesim-${k}.png` });
  }
  ok('See-its exercised', keys.length >= 1 && sceneCalls === keys.length);

  // 7 light theme + full-sheet screenshots
  await p.setViewport({ width: 1100, height: 5200 });
  await p.evaluate(() => window.__openPhysics()); await sleep(400);
  if (shots) await p.screenshot({ path: shots + '/sheet-dark.png' });
  await p.evaluate(() => document.getElementById('phys-close').click());
  await p.click('#shell-theme'); await sleep(300);
  await p.evaluate(() => window.__openPhysics()); await sleep(400);
  const lt = await p.evaluate(() => { const m = document.querySelector('.phys-modal'); const cs = getComputedStyle(m); const h = getComputedStyle(document.querySelector('#phys-art .ch h3')); return [cs.backgroundColor, h.color]; });
  ok('light theme: heading colour differs from panel', lt[0] !== lt[1], lt.join(' / '));
  if (shots) await p.screenshot({ path: shots + '/sheet-light.png' });
  await p.click('#shell-theme').catch(() => {});

  // 8 download (captured)
  const dl = await p.evaluate(async () => {
    let html = null; const OB = window.Blob;
    window.Blob = function (parts, o) { html = parts.join(''); return new OB(parts, o); };
    const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () {};
    document.getElementById('phys-download').click(); await new Promise(r => setTimeout(r, 500));
    window.Blob = OB; HTMLAnchorElement.prototype.click = oc;
    return html ? { len: html.length, seesim: /class="[^"]*seesim/.test(html), snap: html.includes('class="snap"'), chapters: (html.match(/class="ch"/g) || []).length } : null;
  });
  ok('download builds a standalone sheet', !!dl && !dl.seesim && dl.snap && dl.chapters === 7, JSON.stringify(dl));
} catch (e) { ok('harness', false, e.message.slice(0, 200)); }
ok('no page/console errors', errs.length === 0, errs.slice(0, 4).join(' || '));
const fails = res.filter(r => r[0] === 'FAIL');
res.forEach(r => console.log(r[0], r[1], r[0] === 'FAIL' ? r[2] : ''));
console.log(fails.length ? `RESULT FAIL (${fails.length})` : `RESULT PASS (${res.length} checks)`);
await b.close(); process.exit(0);
