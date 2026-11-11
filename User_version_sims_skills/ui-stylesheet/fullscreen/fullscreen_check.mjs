// fullscreen_check.mjs <before.html> <after.html> [--shots dir] : gate for the full-screen button. Headless.
// F1 layout (1440, 1100, 1024): the button is visible inside the top bar, inside the viewport, overlaps no other top-bar
//    control; the top bar keeps its height (or a NOTE if it changed); nothing outside the top bar moved
// F2 works: a click puts the page in browser full screen (icon flips, aria-pressed true), a second click leaves it
// F3 phone (touch, app mode): no page error; the button is either in the drawer's quick card or hidden
// F4 errors: no page errors the before-file does not also throw
import fs from 'fs'; import path from 'path';
const a = process.argv.slice(2); const si = a.indexOf('--shots');
const [BEFORE, AFTER] = a.filter((x, i) => !x.startsWith('--') && !(si >= 0 && i === si + 1));
const SHOTS = si >= 0 ? a[si + 1] : null; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const b = await P.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--mute-audio', '--disable-features=WebSpeechSynthesis', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const W = ms => new Promise(r => setTimeout(r, ms));
const url = f => 'file://' + encodeURI(path.resolve(f)).replace(/#/g, '%23');
const res = []; const ok = (id, pass, msg) => { res.push({ id, pass }); console.log(`${pass === null ? 'NOTE' : pass ? 'PASS' : 'FAIL'} ${id}  ${msg}`); };
const BAR = '.shell-header,.top-bar,.top-bar-app,.title-bar,.app-header,.header-bar,header.sim-header,body > header';
async function open(file, vp) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
  await p.evaluateOnNewDocument(() => { try { speechSynthesis.speak = () => {}; } catch (e) {} });
  await p.setViewport(vp); await p.goto(url(file), { waitUntil: 'load', timeout: 120000 }); await W(3500);
  await p.evaluate(() => { const x = document.getElementById('gv-hint-x'); x && x.click(); }); await W(300);
  return { ctx, p, errs };
}
const SIG = BAR => [...document.querySelectorAll('body *')].filter(e => !e.closest(BAR + ',#phys-backdrop,#gv-hint,.fapp-hdr') && !['fermi-fullscreen', 'fermi-fullscreen-css', 'fermi-app-mode', 'fermi-app-mode-roles'].includes(e.id))
  .slice(0, 4000).map(e => { const r = e.getBoundingClientRect(); return e.tagName + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height); }).join('|');
try {
  for (const [w, h] of [[1440, 900], [1280, 800], [1100, 760], [1024, 768]]) {
    const A = await open(BEFORE, { width: w, height: h }), B = await open(AFTER, { width: w, height: h });
    const sa = await A.p.evaluate(SIG, BAR), sb = await B.p.evaluate(SIG, BAR);
    const bh = pg => pg.evaluate(BAR => { const e = document.querySelector(BAR); return e ? Math.round(e.getBoundingClientRect().height) : 0; }, BAR);
    const ha = await bh(A.p), hb = await bh(B.p);
    const geo = await B.p.evaluate(BAR => {
      const f = document.getElementById('shell-fullscreen'); if (!f) return { found: false };
      const r = f.getBoundingClientRect(); const bar = f.closest(BAR);
      const others = bar ? [...bar.querySelectorAll('button,a,select')].filter(e => e !== f && e.getBoundingClientRect().width > 0) : [];
      const hit = others.filter(e => { const q = e.getBoundingClientRect(); return !(q.right <= r.left + 1 || q.left >= r.right - 1 || q.bottom <= r.top + 1 || q.top >= r.bottom - 1); }).map(e => e.id || e.textContent.trim().slice(0, 12));
      const items = bar ? [...bar.querySelectorAll('button,a,select,input')].filter(e => e.getBoundingClientRect().width > 0) : [];
      const right = Math.max(...items.map(e => e.getBoundingClientRect().right));
      const tt = bar && bar.querySelector('.shell-title,.top-bar-title,.title-text,.sim-title,.header-title,h1');
      return { found: true, inBar: !!bar, vis: r.width > 20 && r.height > 16 && getComputedStyle(f).visibility !== 'hidden', inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0, hit, w: Math.round(r.width), h: Math.round(r.height),
        rightmost: Math.round(r.right) >= Math.round(right) - 1, title: tt ? tt.textContent.trim().replace(/\s+/g, ' ') : '', titlePx: tt ? getComputedStyle(tt).fontSize : '', cut: tt ? tt.scrollWidth > tt.clientWidth + 1 : false };
    }, BAR);
    ok(`F1-button-${w}`, geo.found && geo.inBar && geo.vis && geo.inView && !geo.hit.length && geo.rightmost, `in top bar ${geo.inBar}, visible ${geo.vis} ${geo.w}x${geo.h}, inside the window ${geo.inView}, rightmost ${geo.rightmost}, overlaps ${JSON.stringify(geo.hit)}`);
    if (w === 1440) globalThis.ONE = hb;
    ok(`F1-bar-${w}`, hb <= ha && hb <= globalThis.ONE + 1, `top bar ${ha} -> ${hb}px (one line ${globalThis.ONE}px); title ${geo.titlePx}${geo.cut ? ' CUT' : ''}`);
    if (geo.cut || geo.titlePx !== globalThis.PX0) console.log(`TITLE ${w} ${geo.cut ? 'cut' : 'smaller'} ${geo.titlePx} :: ${geo.title}`);
    if (w === 1440) globalThis.PX0 = geo.titlePx;
    let same = sa === sb;
    if (!same && hb < ha) { ok(`F1-layout-${w}`, null, `the page below moved up with the top bar (${ha} -> ${hb}px: it no longer wraps)`); }
    else {
      if (!same) { const C = await open(BEFORE, { width: w, height: h }); same = (await C.p.evaluate(SIG, BAR)) !== sa ? 'noisy' : false; await C.ctx.close(); }
      ok(`F1-layout-${w}`, !!same, same === true ? 'nothing outside the top bar moved' : same ? 'differs, but the before-file also varies between loads' : 'LAYOUT OUTSIDE THE TOP BAR CHANGED');
    }
    if (SHOTS) { const r = await B.p.evaluate(BAR => { const e = document.querySelector(BAR); const q = e.getBoundingClientRect(); return { x: 0, y: 0, width: innerWidth, height: Math.min(innerHeight, q.bottom + 8) }; }, BAR); await B.p.screenshot({ path: path.join(SHOTS, `bar-${w}.png`), clip: r }); }
    if (w === 1440) {
      await B.p.click('#shell-fullscreen'); await W(700);
      const on = await B.p.evaluate(() => { const f = document.getElementById('shell-fullscreen'); return { fs: !!document.fullscreenElement, active: f.classList.contains('active'), pressed: f.getAttribute('aria-pressed'), offIcon: getComputedStyle(f.querySelector('.fs-off')).display !== 'none' }; });
      if (SHOTS) await B.p.screenshot({ path: path.join(SHOTS, 'fullscreen-on.png') });
      await B.p.click('#shell-fullscreen'); await W(700);
      const off = await B.p.evaluate(() => ({ fs: !!document.fullscreenElement, active: document.getElementById('shell-fullscreen').classList.contains('active') }));
      ok('F2-fullscreen', on.fs && on.active && on.pressed === 'true' && on.offIcon && !off.fs && !off.active, `on: full screen ${on.fs}, icon flipped ${on.offIcon}, aria-pressed ${on.pressed}; off: ${!off.fs && !off.active}`);
    }
    const fresh = B.errs.filter(x => !A.errs.includes(x)); ok(`F4-errors-${w}`, !fresh.length, fresh.length ? 'new errors: ' + fresh.slice(0, 2).join(' | ') : 'no new page errors');
    await A.ctx.close(); await B.ctx.close();
  }
  const T0 = await open(BEFORE, { width: 844, height: 390, isMobile: true, hasTouch: true }); const phoneErr0 = T0.errs.slice(); await T0.ctx.close();
  const T = await open(AFTER, { width: 844, height: 390, isMobile: true, hasTouch: true });
  const ph = await T.p.evaluate(() => { const f = document.getElementById('shell-fullscreen'); return { app: document.documentElement.classList.contains('fapp'), inQuick: !!(f && f.closest('.fapp-quick')), hidden: !f || f.hidden || f.getBoundingClientRect().width === 0 }; });
  if (SHOTS) { await T.p.evaluate(() => window.FermiAppMode && FermiAppMode.handle({ cmd: 'panel' })); await W(800); await T.p.screenshot({ path: path.join(SHOTS, 'phone-drawer.png') }); }
  const newErr = T.errs.filter(x => !phoneErr0.includes(x));
  ok('F3-phone', newErr.length === 0 && (!ph.app || ph.inQuick || ph.hidden), `app mode ${ph.app}; button in the quick card ${ph.inQuick}, hidden ${ph.hidden}; new errors ${newErr.length}`);
  await T.ctx.close();
} catch (e) { ok('X-crash', false, String(e.message).slice(0, 200)); }
await b.close();
const fails = res.filter(x => x.pass === false);
console.log(`\nfullscreen check: ${fails.length ? 'FAIL' : 'PASS'} (${res.filter(x => x.pass).length} pass, ${fails.length} fail)`);
process.exit(fails.length ? 1 : 0);
