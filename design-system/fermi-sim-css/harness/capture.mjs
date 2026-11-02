// Capture one sim build in every chrome state, headless (never a visible window).
//   node harness/capture.mjs <file.html> <outdir> [--only=state,state] [--vp=1440x900,...]
// Per state and viewport it writes:
//   <vp>/<state>.json   computed styles + boxes of every visible chrome element (keyed by DOM path),
//                       canvas rects (masked in the pixel diff) and which CSS path is live
//   <vp>/<state>.png    viewport screenshot
//   <vp>/<state>.canvas.json  pixel hash of each <canvas> (theme-forcing check)
// Determinism: Math.random seeded, Date frozen, CSS transitions finished and CSS
// animations paused at t=0 before every capture.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [file, outdir, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map(a => a.replace(/^--/, '').split('=')));
const VPS = (opt.vp || '1440x900,1280x763,390x844').split(',').map(v => { const [w, h] = v.split('x').map(Number); return { w, h, mobile: w < 600 }; });
const ONLY = opt.only ? new Set(opt.only.split(',')) : null;
const wait = ms => new Promise(r => setTimeout(r, ms));

const ROOTS = 'html, body, #shell, .shell-header, .top-bar, .shell-aside, #sb-sidebar, #sb-hide-tab, .plot-box, .canvas-frame, ' +
  '#gv-start, #gv-tour, #gv-free, #gv-hint, #gv-playtip, #phys-backdrop, #ps-watch, #phys-toast, #welcome-overlay, #inq-cards, #shell-info-modal';
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'outline-color', 'outline-style', 'outline-width', 'outline-offset', 'opacity', 'visibility', 'display',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-shadow',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-left',
  'fill', 'stroke', 'stroke-width', 'accent-color', 'filter', 'backdrop-filter', 'mask-image', 'transform', 'color-scheme'];

async function snap(page, dir, name) {
  if (ONLY && !ONLY.has(name)) return;
  await page.evaluate(() => { for (const a of document.getAnimations()) { try { if (a.constructor.name === 'CSSTransition') a.finish(); else { a.pause(); a.currentTime = 0; } } catch (e) {} } });
  await wait(150);
  await page.screenshot({ path: path.join(dir, name + '.png') });   // first: timed UI (3 s hint) must not change under it
  const data = await page.evaluate((ROOTS, PROPS) => {
    const seen = new Set(), out = {};
    const key = e => { const a = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const p = n.parentElement; a.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (p ? ':' + [...p.children].filter(c => !/^(STYLE|SCRIPT|LINK|META|TEMPLATE|NOSCRIPT)$/.test(c.tagName)).indexOf(n) : '')); } return a.join('>'); };   // <style>/<script> siblings do not shift keys (Wave 3 removes some)
    const take = (e, pseudo) => { const cs = getComputedStyle(e, pseudo); const o = {}; for (const p of PROPS) o[p] = cs.getPropertyValue(p); return o; };
    for (const r of document.querySelectorAll(ROOTS)) for (const e of [r, ...r.querySelectorAll('*')]) {
      if (seen.has(e)) continue; seen.add(e);
      const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!(b.width && b.height) || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg' && !e.closest('#gv-svg')) continue;   // skip inline equation glyphs
      const k = key(e); out[k] = { box: [b.left, b.top, b.width, b.height].map(v => Math.round(v * 10) / 10), style: take(e, null) };
      if (['#gv-playtip', '.gv-board'].some(s => e.matches(s))) out[k + '::before'] = { box: null, style: take(e, '::before') };
    }
    // hand-drawn guide outlines jitter run to run (timing-dependent Math.random draws): masked, styles still compared
    const noise = [...document.querySelectorAll('#gv-lines, #gv-lines *')].map(e => { const b = e.getBoundingClientRect(); return [b.left - 6, b.top - 6, b.width + 12, b.height + 12]; }).filter(b => b[2] > 12 && b[3] > 12);
    for (const k of Object.keys(out)) if (k.includes('#gv-lines')) out[k].box = null;
    const canvases = [...document.querySelectorAll('canvas')].map(c => { const b = c.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }).filter(b => b[2] && b[3]);
    return { els: out, canvases, noise, css: document.documentElement.getAttribute('data-fermi-css'), theme: document.documentElement.getAttribute('data-theme'), bodyLight: document.body.classList.contains('light-theme') };
  }, ROOTS, PROPS);
  // canvas: average colour of each bitmap (theme forcing / cached palettes show up as a large shift)
  const cv = await page.evaluate(() => [...document.querySelectorAll('canvas')].filter(c => c.width && c.height).map(c => {
    try { const t = document.createElement('canvas'); t.width = t.height = 8; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 8, 8);
      const d = x.getImageData(0, 0, 8, 8).data; const m = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) { m[0] += d[i]; m[1] += d[i + 1]; m[2] += d[i + 2]; }
      return m.map(v => Math.round(v / 64)); } catch (e) { return null; } }));
  fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(data));
  fs.writeFileSync(path.join(dir, name + '.canvas.json'), JSON.stringify(cv));
}

async function fresh(browser, vp) {
  const ctx = await browser.createBrowserContext(); const page = await ctx.newPage();
  await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
  await page.evaluateOnNewDocument(() => {
    let s = 42; window.__reseed = () => { s = 42; }; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const T = 1767225600000, D = Date; class FD extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } }
    window.Date = FD;
  });
  page.__errors = []; page.on('pageerror', e => page.__errors.push(String(e.message).slice(0, 160)));
  await page.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'load', timeout: 120000 });
  await wait(4500);
  page.__ctx = ctx; return page;
}
const click = async (page, sel) => { const ok = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; window.__reseed && window.__reseed(); e.click(); return true; }, sel); await wait(1300); return ok; };
const visible = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const b = e.getBoundingClientRect(); return !!(b.width && b.height) && getComputedStyle(e).visibility !== 'hidden' && !e.hidden; }, sel);

const browser = await P.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--mute-audio'] });
const log = { file, errors: {} };
for (const vp of VPS) {
  const dir = path.join(outdir, `${vp.w}x${vp.h}`); fs.mkdirSync(dir, { recursive: true });
  // Branch 1: landing → guide steps
  let page = await fresh(browser, vp);
  await snap(page, dir, 'landing');
  const wantGuide = !ONLY || ['guide-first', 'guide-middle', 'guide-last'].some(x => ONLY.has(x));
  if (wantGuide && await click(page, '#gv-go-guide')) {
    await snap(page, dir, 'guide-first');
    await click(page, '#gv-next'); await snap(page, dir, 'guide-middle');
    for (let i = 0; i < 10 && !(await visible(page, '#gv-final')); i++) await click(page, '#gv-next');
    await snap(page, dir, 'guide-last');
  }
  log.errors[`${vp.w}:guide`] = page.__errors; await page.__ctx.close();
  // Branch 2: Explore freely → hint → settled free mode → hovers/focus → sidebar hidden → GI → Physics sheet → lecture
  page = await fresh(browser, vp);
  await click(page, '#gv-go-free'); await snap(page, dir, 'free-hint');
  await wait(3500); await snap(page, dir, 'free');
  for (const [nm, sel] of [['hover-play', '#shell-play'], ['hover-tutor', '#ask-euler'], ['hover-hidetab', '#sb-hide-tab'], ['hover-sidebar-btn', '.shell-aside button:not([disabled])']].filter(([nm]) => !ONLY || ONLY.has(nm))) {
    const h = await page.$(sel); if (h) { try { await h.hover(); await wait(400); await snap(page, dir, nm); } catch (e) {} }
  }
  await page.mouse.move(2, vp.h - 2); await wait(300);
  await page.focus('#shell-play').catch(() => {}); await page.keyboard.press('Tab'); await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await wait(300); await snap(page, dir, 'focus-play');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  if (await click(page, '#sb-hide-tab')) { await snap(page, dir, 'sidebar-hidden'); await click(page, '#sb-hide-tab'); }
  if (await click(page, '#btn-gi')) {
    await snap(page, dir, 'gi');
    const picked = await page.evaluate(() => { const c = [...document.querySelectorAll('#inq-cards .choice')].find(e => e.offsetParent); if (!c) return false; c.click(); return true; });
    if (picked) { await wait(1300); await snap(page, dir, 'gi-answered'); }
  }
  if (await click(page, '#toggle-formal')) { await wait(800); await snap(page, dir, 'physics-sheet'); await click(page, '#phys-close'); }
  if (await click(page, '#shell-lecture')) { await snap(page, dir, 'lecture'); }
  log.errors[`${vp.w}:free`] = page.__errors; await page.__ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(outdir, 'run.json'), JSON.stringify(log, null, 1));
console.log('captured', file, '→', outdir);
