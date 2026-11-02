// app_mode_check.mjs <input.html> <output.html> [--shots <dir>]
// The gate for the mobile app-mode step. Headless only. Exit 0 = PASS.
//   input  = the finished sim BEFORE app_mode.py (what every other gate checked)
//   output = the same sim AFTER app_mode.py (what ships)
// A  bytes:   output minus the one fermi-app-mode block == input; the block sits right before the last </body>.
// B  desktop: 1440x900 + 1100x760, mouse: the layer never runs and the layout equals the input's.
// C  phone:   608x348 touch: app mode on, top bar hidden, drawing >= 60%, no sideways scroll, state() parses,
//             toggle-play flips (when the sim has an enabled Play), the drawer opens on screen,
//             the Physics sheet opens full width and Back closes it, no page errors the input doesn't also throw.
// D  tablet:  1184x800 touch: app mode on, panel docked and visible, drawing >= 50%, no sideways scroll.
// Notes (not failures): a panel without sliders (button-only sims); a Play the sim keeps disabled.
// Browser: puppeteer-core from $PUPPETEER_CORE, Chrome from $CHROME (the chains set both; defaults below).
import fs from 'fs'; import path from 'path';
const args = process.argv.slice(2);
const si = args.indexOf('--shots');
const [IN, OUT] = args.filter((a, i) => !a.startsWith('--') && !(si >= 0 && i === si + 1));
if (!IN || !OUT) { console.error('usage: node app_mode_check.mjs <input.html> <output.html> [--shots dir]'); process.exit(2); }
const SHOTS = si >= 0 ? args[si + 1] : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const PC = process.env.PUPPETEER_CORE || '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const P = (await import(PC)).default;
const W = ms => new Promise(r => setTimeout(r, ms));
const res = []; const ok = (id, pass, msg) => { res.push({ id, pass, msg }); console.log(`${pass === null ? 'NOTE' : pass ? 'PASS' : 'FAIL'} ${id}  ${msg}`); };

// ---- A: bytes
const tin = fs.readFileSync(IN, 'utf8'), tout = fs.readFileSync(OUT, 'utf8');
const BLOCK = /<script id="fermi-app-mode">[\s\S]*?<\/script>/;
const blocks = (tout.match(/id="fermi-app-mode"/g) || []).length;
const m = tout.match(BLOCK);
const rest = m ? tout.slice(m.index + m[0].length) : '';
ok('A1-bytes', blocks === 1 && !!m && tout.replace(BLOCK, '') === tin.replace(BLOCK, '') && !/id="fermi-app-mode"/.test(tin.replace(BLOCK, '')),
  blocks === 1 ? 'output = input + one app-mode block' : `found ${blocks} app-mode blocks`);
ok('A2-place', !!m && (/^<\/body\s*>/i.test(rest) && !/<\/body\s*>/i.test(rest.slice(7)) || !/<\/body\s*>/i.test(tin)), 'block sits right before the last </body>');

const b = await P.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio', '--disable-features=WebSpeechSynthesis', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
const url = f => 'file://' + encodeURI(path.resolve(f)).replace(/#/g, '%23');
async function open(file, vp) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
  await p.evaluateOnNewDocument(() => { try { speechSynthesis.speak = () => {}; } catch (e) {} try { HTMLMediaElement.prototype.play = function () { return Promise.resolve(); }; } catch (e) {} });
  await p.setViewport(vp);
  await p.goto(url(file), { waitUntil: 'load', timeout: 120000 });
  return { ctx, p, errs };
}
const SIG = () => [...document.querySelectorAll('body *')].filter(e => e.id !== 'fermi-app-mode').slice(0, 4000).map(e => { const r = e.getBoundingClientRect(); return e.tagName + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height); }).join('|');
const PROBE = () => {
  const vw = innerWidth, vh = innerHeight, H = document.documentElement;
  const vis = e => { if (!e) return false; const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 2 && r.height > 2; };
  const area = e => { const r = e.getBoundingClientRect(); return Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)); };
  let best = 0;
  for (const c of document.querySelectorAll('.fapp-hero, .shell-hero, #canvas-container, canvas, svg, .plot-box')) {
    if (!vis(c) || c.closest('.fapp-panel,#phys-backdrop,#welcome-overlay,#gv-card,.fapp-float,.fapp-rail')) continue; best = Math.max(best, area(c));
  }
  const hdr = document.querySelector('.fapp-hdr') || document.querySelector('.shell-header, .top-bar');
  const panel = document.querySelector('.fapp-panel');
  let st = null; try { st = window.FermiAppMode ? JSON.parse(FermiAppMode.state()) : null; } catch (e) {}
  return { active: H.classList.contains('fapp'), docked: H.classList.contains('fapp-docked'), open: H.classList.contains('fapp-open'), st,
    hdrVisible: vis(hdr), frac: +(best / (vw * vh)).toFixed(2), hScroll: document.scrollingElement.scrollWidth > vw + 2,
    panelOn: !!panel && getComputedStyle(panel).visibility !== 'hidden' && getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().left >= -1 && panel.getBoundingClientRect().right <= vw + 1,
    ranges: panel ? [...panel.querySelectorAll('input[type=range]')].filter(vis).length : 0 };
};

try {
  // ---- B: desktop
  for (const [w, h] of [[1440, 900], [1100, 760]]) {
    let same = false, ran = false, noisy = false;
    for (let t = 0; t < 2 && !same; t++) {
      const A = await open(IN, { width: w, height: h }); await A.p.evaluate(() => document.fonts.ready); await W(4000); const sa = await A.p.evaluate(SIG); await A.ctx.close();
      const Bp = await open(OUT, { width: w, height: h }); await Bp.p.evaluate(() => document.fonts.ready); await W(4000);
      const sb = await Bp.p.evaluate(SIG); ran = ran || await Bp.p.evaluate(() => !!window.__fermiAppMode || document.documentElement.classList.contains('fapp')); await Bp.ctx.close();
      same = sa === sb;
      if (!same) { const C = await open(IN, { width: w, height: h }); await C.p.evaluate(() => document.fonts.ready); await W(4000); noisy = noisy || (await C.p.evaluate(SIG)) !== sa; await C.ctx.close(); }
    }
    ok(`B-desktop-${w}`, !ran && (same || noisy), ran ? 'app mode RAN on a mouse device' : same ? 'layer inert, layout identical' : 'layout differs, but the input alone also varies between loads (noisy sim)');
  }
  // ---- C: phone
  const touch = (w, h) => ({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const ph = await open(OUT, touch(608, 348)); await W(3000);
  const coarse = await ph.p.evaluate(() => matchMedia('(pointer: coarse)').matches);
  let r = await ph.p.evaluate(PROBE);
  if (SHOTS) await ph.p.screenshot({ path: path.join(SHOTS, 'app-phone.png') });
  ok('C1-active', r.active, `app mode on a touch phone (pointer:coarse=${coarse})`);
  if (r.active) {
    ok('C2-header', !r.hdrVisible, 'sim top bar hidden');
    ok('C3-drawing', r.frac >= 0.6, `drawing covers ${Math.round(r.frac * 100)}% of the screen`);
    ok('C4-scroll', !r.hScroll, 'no sideways scroll');
    ok('C5-state', !!r.st, 'FermiAppMode.state() parses');
    await ph.p.evaluate(() => FermiAppMode.handle({ cmd: 'native-rails' }));
    const playEl = await ph.p.evaluate(() => { const s = JSON.parse(FermiAppMode.state()); const b = document.querySelector('.fapp-play'); return { has: s.caps.play, disabled: !!(b && b.disabled), before: s.playing }; });
    if (playEl.has && !playEl.disabled) {
      await ph.p.evaluate(() => FermiAppMode.handle({ cmd: 'toggle-play' })); await W(900);
      const after = await ph.p.evaluate(() => JSON.parse(FermiAppMode.state()).playing);
      ok('C6-play', after !== playEl.before, 'toggle-play flips playing');
    } else ok('C6-play', null, playEl.has ? 'the sim keeps Play disabled at load (by design)' : 'sim has no Play button');
    await ph.p.evaluate(() => FermiAppMode.handle({ cmd: 'panel', open: true, tab: 'controls' })); await W(1500);
    r = await ph.p.evaluate(PROBE);
    if (SHOTS) await ph.p.screenshot({ path: path.join(SHOTS, 'app-phone-open.png') });
    ok('C7-drawer', r.panelOn, 'drawer opens on screen');
    if (!r.ranges) ok('C7n-sliders', null, 'panel has no sliders (button-only sim?)');
    await ph.p.evaluate(() => FermiAppMode.handle({ cmd: 'panel', open: false })); await W(400);
    if (r.st && r.st.caps.physics) {
      await ph.p.evaluate(() => FermiAppMode.handle({ cmd: 'physics' })); await W(1000);
      const full = await ph.p.evaluate(() => { const e = document.getElementById('phys-backdrop'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width >= innerWidth - 2; });
      await ph.p.evaluate(() => FermiAppMode.handle({ cmd: 'back' })); await W(600);
      const closed = await ph.p.evaluate(() => { const e = document.getElementById('phys-backdrop'); return !e || getComputedStyle(e).display === 'none' || e.getBoundingClientRect().width === 0 || getComputedStyle(e).opacity === '0'; });
      ok('C8-physics', full && closed, `Physics sheet full width: ${full}; Back closes it: ${closed}`);
    }
  }
  const pe = ph.errs; await ph.ctx.close();
  let fresh = pe;
  if (pe.length) { const o = await open(IN, touch(608, 348)); await W(3000); fresh = pe.filter(x => !o.errs.includes(x)); await o.ctx.close(); }
  ok('C9-errors', fresh.length === 0, fresh.length ? 'new page errors: ' + fresh.slice(0, 3).join(' | ') : 'no new page errors');
  // ---- D: tablet
  const tb = await open(OUT, touch(1184, 800)); await W(3000); const t = await tb.p.evaluate(PROBE);
  if (SHOTS) await tb.p.screenshot({ path: path.join(SHOTS, 'app-tablet.png') });
  ok('D1-tablet', t.active && t.docked && t.panelOn && t.frac >= 0.5 && !t.hScroll, `active ${t.active}, docked ${t.docked}, panel ${t.panelOn}, drawing ${Math.round(t.frac * 100)}%, sideways scroll ${t.hScroll}`);
  await tb.ctx.close();
} catch (e) { ok('X-crash', false, String(e.message).slice(0, 200)); }
await b.close();
const fails = res.filter(x => x.pass === false);
console.log(`\napp-mode check: ${fails.length ? 'FAIL' : 'PASS'} (${res.filter(x => x.pass).length} pass, ${fails.length} fail, ${res.filter(x => x.pass === null).length} notes)`);
process.exit(fails.length ? 1 : 0);
