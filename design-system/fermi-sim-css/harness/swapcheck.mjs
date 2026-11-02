// FAST VERIFIER for CSS-only waves: one page load per sim per viewport, before/after in the same page.
//   node harness/swapcheck.mjs --css CANDIDATE.css --out OUT.json [--parallel 4] [--vp=1280x763,1440x900,390x844]
//        [--states=free,gi,sheet] [--ref REF.css] file1.html file2.html ...
// For each sim + viewport: load the file with its OWN stylesheet (CDN link or inline fallback, as built), then per
// state: capture computed styles + boxes of every chrome element (same ROOTS/PROPS as capture.mjs) = REFERENCE;
// swap in the candidate (inline <style id="fermi-sim-inline"> text <- candidate, media all, CDN <link> removed),
// dispatch 'resize' (lets layout scripts such as the uniform-ui header fit re-run), wait, re-capture = CANDIDATE;
// restore the original stylesheet before moving to the next state. Diff -> OUT.json + one summary line per sim.
// Headless only. Exit 1 if any sim differs.
import fs from 'fs';
import path from 'path';
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const argv = process.argv.slice(2), files = [], opt = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--') && a.includes('=')) { const [k, v] = a.slice(2).split('='); opt[k] = v; }
  else if (a.startsWith('--')) { opt[a.slice(2)] = argv[++i]; }
  else files.push(a);
}
if (!opt.css || !opt.out || !files.length) { console.error('usage: --css CANDIDATE.css --out OUT.json [--parallel N] files...'); process.exit(2); }
const CAND = fs.readFileSync(opt.css, 'utf8');
// --ref REF.css: the REFERENCE is captured after swapping REF in the same way (same resize event), so layout
// scripts that react to the swap itself (header fit) cancel out; REF = the version the candidate replaces.
const REF = opt.ref ? fs.readFileSync(opt.ref, 'utf8') : null;
const PAR = +(opt.parallel || 4);
const VPS = (opt.vp || '1280x763,1440x900,390x844').split(',').map(v => { const [w, h] = v.split('x').map(Number); return { w, h, mobile: w < 600 }; });
const STATES = (opt.states || 'free,gi,sheet').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));

const ROOTS = 'html, body, #shell, .shell-header, .top-bar, .shell-aside, #sb-sidebar, #sb-hide-tab, .plot-box, .canvas-frame, ' +
  '#gv-start, #gv-tour, #gv-free, #gv-hint, #gv-playtip, #phys-backdrop, #ps-watch, #phys-toast, #welcome-overlay, #inq-cards, #shell-info-modal, ' +
  '.title-bar, .app-header, .header-bar, header.upper-menu, header.sim-header, aside#rightPanel, .ho-sidebar';
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'outline-color', 'outline-style', 'outline-width', 'outline-offset', 'opacity', 'visibility', 'display',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-shadow',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-left',
  'fill', 'stroke', 'stroke-width', 'accent-color', 'filter', 'backdrop-filter', 'mask-image', 'transform', 'color-scheme',
  'height', 'width', 'gap'];

function snapFn(ROOTS, PROPS) {      // runs in the page
  for (const a of document.getAnimations()) { try { if (a.constructor.name === 'CSSTransition') a.finish(); else { a.pause(); a.currentTime = 0; } } catch (e) {} }
  const seen = new Set(), out = {};
  const key = e => { const a = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const p = n.parentElement;
    a.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (p ? ':' + [...p.children].indexOf(n) : '')); } return a.join('>'); };
  for (const r of document.querySelectorAll(ROOTS)) for (const e of [r, ...r.querySelectorAll('*')]) {
    if (seen.has(e)) continue; seen.add(e);
    if (e.closest('#gv-lines')) continue;                                   // hand-drawn guide outlines jitter run to run
    const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (!(b.width && b.height) || cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
    const st = {}; for (const p of PROPS) st[p] = cs.getPropertyValue(p);
    out[key(e)] = { box: [b.left, b.top, b.width, b.height].map(v => Math.round(v * 10) / 10), style: st };
  }
  return out;
}

function diff(a, b) {
  const norm = v => String(v).replace(/\s+/g, ' ').trim().replace(/rgba\((\d+), (\d+), (\d+), 1\)/g, 'rgb($1, $2, $3)');
  const changedStyles = [], movedBoxes = [], appeared = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k], y = b[k];
    if (!x || !y) { appeared.push((x ? 'gone ' : 'new ') + k.split('>').slice(-2).join('>')); continue; }
    if (x.box.some((v, i) => Math.abs(v - y.box[i]) > 0.5)) movedBoxes.push({ path: k.split('>').slice(-2).join('>'), before: x.box, after: y.box });
    for (const p of Object.keys(x.style)) if (norm(x.style[p]) !== norm(y.style[p]))
      changedStyles.push({ path: k.split('>').slice(-2).join('>'), prop: p, before: x.style[p].slice(0, 80), after: (y.style[p] || '').slice(0, 80) });
  }
  return { changedStyles, movedBoxes, appeared };
}

async function swapIn(page, css) {
  await page.evaluate(css => {
    const s = document.getElementById('fermi-sim-inline'), l = document.getElementById('fermi-sim-css');
    if (!s) throw new Error('no #fermi-sim-inline (not a fermi-sim build)');
    if (!window.__swapOrig) window.__swapOrig = { text: s.textContent, media: s.media, link: l, linkParent: l && l.parentNode, linkNext: l && l.nextSibling };
    s.textContent = css; s.media = 'all'; if (l && l.parentNode) l.parentNode.removeChild(l);
    dispatchEvent(new Event('resize'));
  }, css);
  await wait(450);
}
async function swapBack(page) {
  await page.evaluate(() => {
    const o = window.__swapOrig; if (!o) return; const s = document.getElementById('fermi-sim-inline');
    s.textContent = o.text; s.media = o.media; if (o.link && !o.link.parentNode) o.linkParent.insertBefore(o.link, o.linkNext);
    dispatchEvent(new Event('resize'));
  });
  await wait(450);
}
const click = async (page, sel) => { const ok = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel); await wait(1300); return ok; };

const browser = await P.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const result = {}; let anyDiff = false;

async function runSim(file) {
  const t0 = Date.now(), rec = {};
  for (const vp of VPS) {
    const ctx = await browser.createBrowserContext(); const page = await ctx.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, isMobile: vp.mobile, hasTouch: vp.mobile });
    await page.evaluateOnNewDocument(() => {
      let s = 42; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      const T = 1767225600000, D = Date; class FD extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } } window.Date = FD;
    });
    // --ref mode: no CSS transitions, so layout scripts that measure right after a resize (the header fit) see
    // settled geometry and decide the same way for reference and candidate (with transitions they flip-flop).
    if (REF) await page.evaluateOnNewDocument(() => { document.addEventListener('DOMContentLoaded', () => {
      const st = document.createElement('style'); st.id = 'swapcheck-no-transitions';
      st.textContent = '*,*::before,*::after{transition:none !important}'; document.head.appendChild(st); }); });
    const errors = []; page.on('pageerror', e => errors.push(String(e.message).slice(0, 140)));
    const vk = `${vp.w}x${vp.h}`; rec[vk] = {};
    try {
      await page.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'load', timeout: 120000 }); await wait(3500);
      await click(page, '#gv-go-free'); await wait(3500);                 // hint closes itself (~3 s)
      await page.evaluate(() => { const x = document.getElementById('gv-hint-x'), h = document.getElementById('gv-hint'); if (h && !h.hidden && x) x.click(); });
      await page.mouse.move(2, vp.h - 2); await wait(300);
      for (const st of STATES) {
        if (st === 'gi') { if (!(await click(page, '#btn-gi'))) { rec[vk][st] = { skipped: 'no #btn-gi' }; continue; } }
        if (st === 'sheet') { if (!(await click(page, '#toggle-formal'))) { rec[vk][st] = { skipped: 'no #toggle-formal' }; continue; } await wait(600); }
        if (REF) await swapIn(page, REF);
        const before = await page.evaluate(snapFn, ROOTS, PROPS);
        await swapIn(page, CAND);
        const after = await page.evaluate(snapFn, ROOTS, PROPS);
        await swapBack(page);
        const d = diff(before, after); d.errors = errors.splice(0); d.elements = Object.keys(before).length;
        rec[vk][st] = d;
        if (st === 'sheet') await click(page, '#phys-close');
      }
    } catch (e) { rec[vk].error = String(e.message).slice(0, 200); }
    await ctx.close();
  }
  let n = 0, err = 0, elems = 0;
  for (const v of Object.values(rec)) { if (v.error) err++; for (const s of Object.values(v)) if (s && s.changedStyles) { n += s.changedStyles.length + s.movedBoxes.length + s.appeared.length; elems += s.elements; err += s.errors.length; } }
  result[file] = rec; if (n || err) anyDiff = true;
  console.log(`${(n || err) ? 'DIFF ' + n + (err ? ' errors ' + err : '') : 'OK'}\t${((Date.now() - t0) / 1000).toFixed(0)}s\t${elems} elements\t${path.basename(file)}`);
}

const queue = files.slice();
await Promise.all(Array.from({ length: Math.min(PAR, files.length) }, async () => { while (queue.length) await runSim(queue.shift()); }));
await browser.close();
fs.writeFileSync(opt.out, JSON.stringify(result, null, 1));
const bad = Object.entries(result).filter(([, r]) => Object.values(r).some(v => v.error || Object.values(v).some(s => s && s.changedStyles && (s.changedStyles.length || s.movedBoxes.length || s.appeared.length || s.errors.length))));
console.log(`\n${files.length - bad.length}/${files.length} sims unchanged under the candidate stylesheet → ${opt.out}`);
process.exit(anyDiff ? 1 : 0);
