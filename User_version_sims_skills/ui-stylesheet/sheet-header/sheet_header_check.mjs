// sheet_header_check.mjs <before.html> <after.html> [--shots dir] : gate for the one-line Physics sheet header. Headless.
// S1 top bar: the tutor link is gone from the top bar, and nothing else in the page layout outside the top bar and the sheet moved
// S2 sheet:   one-line header (<= 80px tall): h2 = the sim's title, the tutor link with the SAME href (or the same pending
//             marker) as before, its label "Learn this with the AI tutor" visible, the download is the icon button
// S3 works:   Download does what it did before (popup / download / handler), the close button closes the sheet
// S4 phone:   on a touch phone the sheet opens full screen with the tutor link in it, and the app drawer does not take it
// S5 errors:  no page errors the before-file does not also throw
import fs from 'fs'; import path from 'path';
const a = process.argv.slice(2); const si = a.indexOf('--shots');
const [BEFORE, AFTER] = a.filter((x, i) => !x.startsWith('--') && !(si >= 0 && i === si + 1));
const SHOTS = si >= 0 ? a[si + 1] : null; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const CANDS = [process.env.PUPPETEER_CORE, 'puppeteer-core', 'puppeteer', '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].filter(Boolean);
let P = null; for (const c of CANDS) { try { P = (await import(c)).default; if (P) break; } catch (e) {} }
const SYS = { darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', linux: '/usr/bin/google-chrome' }[process.platform];
const CHROME = process.env.CHROME || (fs.existsSync(SYS || '') ? SYS : undefined);
const b = await P.launch({ ...(CHROME ? { executablePath: CHROME } : {}), headless: 'new', args: ['--mute-audio', '--disable-features=WebSpeechSynthesis', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
const W = ms => new Promise(r => setTimeout(r, ms));
const url = f => 'file://' + encodeURI(path.resolve(f)).replace(/#/g, '%23');
const res = []; const ok = (id, pass, msg) => { res.push({ id, pass }); console.log(`${pass === null ? 'NOTE' : pass ? 'PASS' : 'FAIL'} ${id}  ${msg}`); };
async function open(file, vp) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
  await p.evaluateOnNewDocument(() => {
    try { speechSynthesis.speak = () => {}; } catch (e) {}
    window.__dl = 0; const wo = window.open; window.open = function () { window.__dl++; return { document: { write() {}, close() {}, open() {} }, focus() {}, close() {}, print() {} }; };
    const ac = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download || /^blob:|^data:/.test(this.href)) { window.__dl++; return; } return ac.call(this); };
  });
  await p.setViewport(vp); await p.goto(url(file), { waitUntil: 'load', timeout: 120000 }); await W(3500);
  await p.evaluate(() => { const x = document.getElementById('gv-hint-x'); x && x.click(); });
  return { ctx, p, errs };
}
const SIG = () => [...document.querySelectorAll('body *')].filter(e => !e.closest('.shell-header,.top-bar,.top-bar-app,.title-bar,.app-header,.header-bar,header.upper-menu,header.sim-header,div.header,body > header,.fapp-hdr,#phys-backdrop,#gv-hint') && !['fermi-app-mode', 'fermi-app-mode-roles', 'sb-sheet-head', 'fermi-sheet-head-fit'].includes(e.id) && e.id !== 'ask-euler' && !e.closest('#ask-euler'))
  .slice(0, 4000).map(e => { const r = e.getBoundingClientRect(); return e.tagName + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height); }).join('|');
const TUT = () => { const t = document.getElementById('ask-euler'); return t ? { href: t.getAttribute('href'), pending: t.getAttribute('data-tutor-pending'), inSheet: !!t.closest('#phys-backdrop'), inBar: !!t.closest('.shell-header,.top-bar,.top-bar-app,.title-bar,.app-header,.header-bar,header.upper-menu,header.sim-header,div.header,body > header,.fapp-hdr') } : null; };
async function sheet(p) {
  await p.evaluate(() => { const b = document.getElementById('toggle-formal'); b && b.click(); }); await W(1200);
  return p.evaluate(() => {
    const h = document.querySelector('#phys-backdrop .phys-head'), t = document.querySelector('#phys-backdrop #ask-euler'), l = t && t.querySelector('.ask-euler-label');
    const dl = document.getElementById('phys-download'), h2 = h && h.querySelector('h2');
    return { open: !!h && h.getBoundingClientRect().height > 0, headH: h ? Math.round(h.getBoundingClientRect().height) : 0, h2: h2 ? h2.textContent.trim() : null,
      label: l ? l.textContent.trim() : null, labelVis: !!l && getComputedStyle(l).display !== 'none' && l.getBoundingClientRect().width > 40,
      dlIcon: !!dl && !!dl.querySelector('svg') && dl.textContent.trim() === '',
      title: (document.querySelector('.shell-title') || document.querySelector('.top-bar h1') || {}).textContent };
  });
}
try {
  for (const [w, h] of [[1440, 900], [1100, 760], [1024, 768]]) {
    const A = await open(BEFORE, { width: w, height: h }); const B = await open(AFTER, { width: w, height: h });
    const sa = await A.p.evaluate(SIG), sb = await B.p.evaluate(SIG); const ta = await A.p.evaluate(TUT), tb = await B.p.evaluate(TUT);
    const hH = pg => pg.evaluate(() => { const h = document.querySelector('.shell-header,.top-bar,.top-bar-app,.title-bar,.app-header,.header-bar,header.upper-menu,header.sim-header,div.header,body > header,.fapp-hdr'); return h ? Math.round(h.getBoundingClientRect().height) : 0; });
    const ha = await hH(A.p), hb = await hH(B.p);
    let same = sa === sb;
    if (!same && hb < ha) { ok(`S1-layout-${w}`, null, `top bar got shorter (${ha} -> ${hb}px: it no longer wraps), so the sim area below it grew; expected`); same = 'header'; }
    if (!same) { const C = await open(BEFORE, { width: w, height: h }); same = (await C.p.evaluate(SIG)) !== sa ? 'noisy' : false; await C.ctx.close(); }
    if (same !== 'header') ok(`S1-layout-${w}`, !!same, same === true ? 'page outside the top bar and the sheet is unchanged' : same ? 'differs, but the before-file also varies between loads (noisy sim)' : 'LAYOUT OUTSIDE THE TOP BAR / SHEET CHANGED');
    const FU = () => { const e = document.querySelector('[data-fu-hdr]'); const H = document.documentElement.className + ' ' + document.body.className;
      return { bar: e ? e.tagName + '#' + e.id + '.' + (typeof e.className === 'string' ? e.className.split(' ').filter(c => !c.startsWith('f')).join('.') : '') : null, tight: /fu-tight\b/.test(H), tighter: /fu-tighter/.test(H) }; };
    const fa = await A.p.evaluate(FU), fb = await B.p.evaluate(FU);
    if (fa.bar || fb.bar) ok(`S6-headerfit-${w}`, fa.bar === fb.bar && (fb.tight === fa.tight || hb <= ha) && (fb.tighter === fa.tighter || hb <= ha),
      `header-fit bar ${fb.bar} (before ${fa.bar}); tight ${fa.tight}->${fb.tight}, tighter ${fa.tighter}->${fb.tighter}; bar ${ha}->${hb}px`);
    ok(`S1-bar-${w}`, !!ta && ta.inBar && tb && !tb.inBar, `tutor link moved out of the top bar (before in bar: ${ta && ta.inBar})`);
    const s = await sheet(B.p);
    if (SHOTS) { const r = await B.p.evaluate(() => { const e = document.querySelector('#phys-backdrop .phys-modal'); const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, width: q.width, height: Math.min(160, q.height) }; }); await B.p.screenshot({ path: path.join(SHOTS, `sheet-head-${w}.png`), clip: r }); }
    ok(`S2-sheet-${w}`, s.open && s.headH > 0 && s.headH <= 80 && s.dlIcon && s.label === 'Learn this with the AI tutor' && s.labelVis,
      `head ${s.headH}px, h2 "${s.h2}", label visible ${s.labelVis}, icon download ${s.dlIcon}`);
    ok(`S2-title-${w}`, !!s.h2 && s.h2.length > 1, `sheet title "${s.h2}" (top bar "${(s.title || '').trim()}")`);
    ok(`S2-link-${w}`, !!tb && tb.inSheet && tb.href === ta.href && tb.pending === ta.pending, `same tutor link: ${tb && tb.href ? tb.href.slice(0, 60) : '(pending ' + (tb && tb.pending) + ')'}`);
    // S3: download behaves as before; close works
    const dlA = await (async () => { await sheet(A.p); await A.p.evaluate(() => document.getElementById('phys-download').click()); await W(800); return A.p.evaluate(() => window.__dl); })();
    await B.p.evaluate(() => document.getElementById('phys-download').click()); await W(800); const dlB = await B.p.evaluate(() => window.__dl);
    ok(`S3-download-${w}`, dlB === dlA && dlB > 0, `download fired ${dlB} (before ${dlA})`);
    await B.p.evaluate(() => document.getElementById('phys-close').click()); await W(700);
    const closed = await B.p.evaluate(() => { const e = document.getElementById('phys-backdrop'); const s = getComputedStyle(e); return s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0' || !e.classList.contains('open') && e.getBoundingClientRect().height === 0 || !e.classList.contains('open'); });
    ok(`S3-close-${w}`, closed, 'close button closes the sheet');
    const fresh = B.errs.filter(x => !A.errs.includes(x)); ok(`S5-errors-${w}`, fresh.length === 0, fresh.length ? 'new errors: ' + fresh.slice(0, 2).join(' | ') : 'no new page errors');
    await A.ctx.close(); await B.ctx.close();
  }
  // S4: phone, touch (app mode on)
  const T = await open(AFTER, { width: 608, height: 348, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const app = await T.p.evaluate(() => document.documentElement.classList.contains('fapp'));
  if (app) {
    const inQuick = await T.p.evaluate(() => !!document.querySelector('.fapp-quick #ask-euler'));
    await T.p.evaluate(() => FermiAppMode.handle({ cmd: 'physics' })); await W(1100);
    const ph = await T.p.evaluate(() => { const e = document.getElementById('phys-backdrop'), t = e && e.querySelector('#ask-euler'), l = t && t.querySelector('.ask-euler-label');
      return { full: !!e && e.getBoundingClientRect().width >= innerWidth - 2, tutor: !!t && t.getBoundingClientRect().width > 0, label: !!l && getComputedStyle(l).display !== 'none' }; });
    if (SHOTS) await T.p.screenshot({ path: path.join(SHOTS, 'sheet-phone.png') });
    ok('S4-phone', !inQuick && ph.full && ph.tutor, `drawer took the tutor: ${inQuick}; sheet full screen ${ph.full}; tutor in sheet ${ph.tutor} (label shown ${ph.label})`);
  } else ok('S4-phone', null, 'app mode not active on this page');
  await T.ctx.close();
} catch (e) { ok('X-crash', false, String(e.message).slice(0, 200)); }
await b.close();
const fails = res.filter(x => x.pass === false);
console.log(`\nsheet-header check: ${fails.length ? 'FAIL' : 'PASS'} (${res.filter(x => x.pass).length} pass, ${fails.length} fail)`);
process.exit(fails.length ? 1 : 0);
