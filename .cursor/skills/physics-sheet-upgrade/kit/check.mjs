// Physics sheet v2 — generic gate.  node check.mjs <sims/SLUG> [--quick]
// Reads <SLUG>/config.json (sim path) and optional <SLUG>/test.json:
//   { "demos": { "<name>": { "until": "<regex on #ps-w-m text>", "timeoutMs": 30000 } },
//     "skipShots": false }
// Writes screenshots to <SLUG>/shots/ and prints PASS/FAIL lines; exit code 1 on any FAIL.
import fs from 'fs'; import path from 'path';
// puppeteer-core: set PUPPETEER_CORE to its puppeteer-core.js, or install it next to this kit / in the repo.
const PC = [process.env.PUPPETEER_CORE,
  path.resolve(path.dirname(new URL(import.meta.url).pathname), 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'),
  path.resolve(path.dirname(new URL(import.meta.url).pathname), '../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'),
  '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].find(f => f && fs.existsSync(f));
if (!PC) { console.error('puppeteer-core not found: set PUPPETEER_CORE=/path/to/puppeteer-core.js (npm i puppeteer-core)'); process.exit(2); }
const puppeteer = (await import(PC)).default;
const D = path.resolve(process.argv[2]); const QUICK = process.argv.includes('--quick');
const cfg = JSON.parse(fs.readFileSync(path.join(D, 'config.json'), 'utf8'));
const tcfg = fs.existsSync(path.join(D, 'test.json')) ? JSON.parse(fs.readFileSync(path.join(D, 'test.json'), 'utf8')) : {};
const SIM = 'file://' + encodeURI(cfg.sim).replace(/#/g, '%23');
const OUT = path.join(D, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const W = ms => new Promise(r => setTimeout(r, ms));
const R = []; const ok = (n, c, x = '') => R.push((c ? 'PASS ' : 'FAIL ') + n + (x ? ' — ' + String(x).slice(0, 220) : ''));
const info = (n, x) => R.push('INFO ' + n + ' — ' + String(x).slice(0, 400));
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });   // headless only, never a visible window
async function fresh(w = 1440, h = 900, mode = 'free', theme) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h });
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(SIM, { waitUntil: 'load' }); await W(700);
  if (theme) await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  let m = await p.$(`.welcome-mode[data-mode="${mode}"]`);
  if (!m && mode === 'inquiry') {   // sims with the 2-mode Simulation-guide landing have no inquiry card: dismiss it, then open the inquiry from the header
    const f = await p.$('.welcome-mode[data-mode="free"]'); if (f) { await f.click(); await W(350); }
    const g = await p.$('#btn-gi'); if (g) { await g.click(); await W(350); }
    return p;
  }
  if (m) { await m.click(); await W(350); }
  return p;
}
const vis = p => p.evaluate(() => [...document.querySelectorAll('.ps-sec')].findIndex(s => !s.hidden));
const open = async (p, i) => { await p.evaluate(i => window.__openPhysics(i), i); await W(180); };

try {
  // ---------- structure, free mode ----------
  let p = await fresh();
  await p.click('#toggle-formal'); await W(300);
  ok('sheet opens from header', await p.$eval('#phys-backdrop', e => e.classList.contains('open')));
  const N = await p.$$eval('.ps-sec', a => a.length);
  ok('5–9 sections', N >= 5 && N <= 9, N);
  ok('one section visible', (await p.$$eval('.ps-sec', a => a.filter(s => !s.hidden).length)) === 1);
  const qs = await p.$$eval('.ps-sec h3, .ps-sec h4', a => a.map(h => h.textContent).filter(t => t.includes('?')));
  ok('no question headings', qs.length === 0, qs.join(' | '));
  const nq = await p.$$eval('.ps-sec', a => a.reduce((n, s) => n + (s.textContent.match(/\?/g) || []).length, 0));
  info('question marks anywhere in sheet text', nq);
  const hs = []; for (let i = 0; i < N; i++) { await open(p, i); hs.push(await p.$eval('.phys-modal', e => Math.round(e.getBoundingClientRect().height))); }
  ok('fixed modal height on every section', new Set(hs).size === 1, hs.join(','));
  const words = []; for (let i = 0; i < N; i++) words.push(await p.evaluate(i => { const s = document.querySelectorAll('.ps-sec')[i]; const c = s.cloneNode(true); c.querySelectorAll('svg,.ps-try,table').forEach(x => x.remove()); return c.textContent.trim().split(/\s+/).length; }, i));
  info('words per section (excl. figures/tables/See-it)', words.join(','));
  ok('no section over 260 words', Math.max(...words) <= 260, Math.max(...words));
  const rail = await p.$$eval('.ps-rail button .l', a => a.map(x => x.textContent));
  const heads = await p.$$eval('.ps-sec h3', a => a.map(x => x.textContent));
  const mism = rail.map((r, i) => [r, heads[i]]).filter(([r, h]) => !h.toLowerCase().startsWith(r.toLowerCase().replace(/…$/, '')) && r.toLowerCase() !== h.toLowerCase());
  ok('rail labels echo headings', mism.length === 0, JSON.stringify(mism));
  // ⌖ targets
  const locs = await p.$$eval('.ps-loc', a => a.map(b => [b.getAttribute('data-locate'), !!document.querySelector(b.getAttribute('data-locate')), b.getAttribute('aria-label')]));
  ok('⌖ rows exist', locs.length >= 3, locs.length);
  ok('every ⌖ target exists', locs.every(l => l[1]), JSON.stringify(locs.filter(l => !l[1])));
  ok('every ⌖ labelled', locs.every(l => /^Show .+ in the sim$/.test(l[2] || '')));
  if (!QUICK) for (let i = 0; i < N; i++) {
    await open(p, i); await p.screenshot({ path: `${OUT}/dark-s${i + 1}.png` });
    const sh = await p.$eval('.phys-body', e => e.scrollHeight - e.clientHeight);
    if (sh > 40) { await p.evaluate(() => { const b = document.querySelector('.phys-body'); b.scrollTop = b.scrollHeight; }); await W(120); await p.screenshot({ path: `${OUT}/dark-s${i + 1}-end.png` }); }
  }
  ok('free: no page errors', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // ---------- every See-it, each from a fresh page ----------
  p = await fresh();
  const btns = await p.$$eval('.ps-sec .seesim', a => a.map(b => ({ sec: [...document.querySelectorAll('.ps-sec')].indexOf(b.closest('.ps-sec')), show: b.getAttribute('data-show'), demo: b.getAttribute('data-demo'), label: b.textContent.trim() })));
  await p.close();
  ok('at least 3 See-its', btns.length >= 3, btns.length);
  for (const [k, bt] of btns.entries()) {
    p = await fresh();
    await open(p, bt.sec);
    const sel = bt.demo ? `.ps-sec:not([hidden]) .seesim[data-demo="${bt.demo}"]` : `.ps-sec:not([hidden]) .seesim[data-show="${bt.show}"]`;
    await p.click(sel); await W(400);
    const tag = `see ${bt.sec + 1}:${bt.demo || bt.show}`;
    ok(tag + ' closes sheet + shows card', !(await p.$eval('#phys-backdrop', e => e.classList.contains('open'))) && await p.$eval('#ps-watch', e => e.classList.contains('show')));
    if (bt.demo && tcfg.demos && tcfg.demos[bt.demo]) {
      const d = tcfg.demos[bt.demo]; let m = ''; const t0 = Date.now();
      while (Date.now() - t0 < (d.timeoutMs || 30000)) { await W(400); m = await p.$eval('#ps-w-m', e => e.textContent); if (new RegExp(d.until).test(m)) break; }
      ok(tag + ' demo reaches its result', new RegExp(d.until).test(m), m);
    } else await W(3000);
    info(tag + ' card text', await p.$eval('#ps-watch', e => e.innerText.replace(/\s+/g, ' ')));
    if (!QUICK) await p.screenshot({ path: `${OUT}/see-${k + 1}-s${bt.sec + 1}-${bt.demo || bt.show}.png` });
    await p.click('#ps-w-back'); await W(250);
    ok(tag + ' Back reopens its section', await p.$eval('#phys-backdrop', e => e.classList.contains('open')) && (await vis(p)) === bt.sec);
    ok(tag + ' no page errors', p.errs.length === 0, p.errs.join(' | '));
    await p.close();
  }

  // ---------- download ----------
  p = await fresh();
  await p.evaluate(() => { window.__blob = null; URL.createObjectURL = b => { window.__blob = b; return 'blob:x'; }; });
  await open(p, 0); await p.click('#phys-download'); await W(600);
  const html = await p.evaluate(async () => window.__blob ? await window.__blob.text() : '');
  ok('download: all sections, none hidden', (html.match(/class="ps-sec"/g) || []).length === N && !/class="ps-sec"[^>]*hidden/.test(html), (html.match(/class="ps-sec"/g) || []).length);
  ok('download: no buttons/See-it', !/class="[^"]*(seesim|ps-loc|ps-try)/.test(html));
  fs.writeFileSync(path.join(OUT, 'download.html'), html);
  // focus + keyboard
  await p.focus('#toggle-formal'); await p.click('#toggle-formal'); await W(200); await p.keyboard.press('Escape'); await W(120);
  ok('Esc returns focus to opener', await p.evaluate(() => document.activeElement.id === 'toggle-formal'));
  await p.click('#toggle-formal'); await W(200);
  let inside = true, where = ''; for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); where = await p.evaluate(() => { const a = document.activeElement; return document.getElementById('phys-backdrop').contains(a) ? '' : a.tagName + '#' + a.id + '.' + String(a.className).slice(0, 40) + ' «' + (a.textContent || '').trim().slice(0, 30) + '» open=' + document.getElementById('phys-backdrop').classList.contains('open'); }); if (where) { inside = false; where = 'press ' + (i + 1) + ': ' + where; break; } }
  ok('Tab stays inside the sheet', inside, where);
  await p.keyboard.press('Escape'); await W(100);
  await p.evaluate(() => window.__openPhysics(0)); await p.keyboard.press('ArrowRight'); await W(100);
  ok('→ pages', (await vis(p)) === 1);
  await p.close();

  // ---------- Guided Inquiry: gate ----------
  p = await fresh(1440, 900, 'inquiry');
  const gf = await p.$eval('#phys-art', a => parseInt(a.getAttribute('data-gate-from') || '2', 10));
  await open(p, 0); ok('GI: section 01 readable', (await vis(p)) === 0);
  await open(p, gf); ok(`GI: section ${gf + 1} gated`, (await vis(p)) === -1 && !(await p.$eval('.ps-gate', e => e.hidden)));
  ok('GI: gate shows no See-it chip', await p.$eval('#ps-more', e => getComputedStyle(e).display === 'none'));
  if (!QUICK) await p.screenshot({ path: `${OUT}/gi-gate.png` });
  await p.click('#ps-gate-read'); await W(200);
  ok('GI: Read anyway reveals', (await vis(p)) === gf);
  const anyBtn = await p.$('.ps-sec:not([hidden]) .seesim');
  if (anyBtn) { await anyBtn.click(); await W(300); ok('GI: See-it stays paused', await p.$eval('#phys-backdrop', e => e.classList.contains('open')) && !(await p.$eval('#ps-watch', e => e.classList.contains('show')))); }
  ok('GI: no page errors', p.errs.length === 0, p.errs.join(' | '));
  await p.close();

  // ---------- light theme, 720p, phone ----------
  p = await fresh(1440, 900, 'free', 'light');
  if (!QUICK) for (let i = 0; i < N; i++) { await open(p, i); await p.screenshot({ path: `${OUT}/light-s${i + 1}.png` }); }
  // low-contrast text in the sim chrome, after the first live See-it
  const live = btns.find(x => x.show); if (live) { await open(p, live.sec); await p.click(`.ps-sec:not([hidden]) .seesim[data-show="${live.show}"]`); await W(2500); if (!QUICK) await p.screenshot({ path: `${OUT}/light-see.png` }); }
  const low = await p.evaluate(() => {
    const parse = c => (c.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const bgOf = e => { for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > .5)) return c.slice(0, 3); } return [255, 255, 255]; };
    const out = [];
    document.querySelectorAll('.shell-aside *, .scene-legend *, .canvas-frame > div *').forEach(e => {
      if (!e.offsetParent || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      const fg = parse(getComputedStyle(e).color).slice(0, 3), bg = bgOf(e);
      const L1 = lum(fg), L2 = lum(bg), cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      if (cr < 2.5) out.push(e.textContent.trim().slice(0, 24) + ' (' + cr.toFixed(1) + ')');
    });
    return out;
  });
  info('light theme: sim text under 2.5:1 contrast (check the screenshot before trusting)', low.length ? low.join(' · ') : 'none');
  await p.close();
  p = await fresh(1280, 720);
  if (!QUICK) for (let i = 0; i < N; i++) { await open(p, i); await p.screenshot({ path: `${OUT}/720-s${i + 1}.png` }); }
  await p.close();
  p = await fresh(390, 844);
  await open(p, 0);
  const gap = await p.evaluate(() => { const r = document.querySelector('.ps-rail').getBoundingClientRect(), h = document.querySelector('.ps-sec:not([hidden]) .ps-h').getBoundingClientRect(); return h.top - r.bottom; });
  ok('phone: rail clear of heading', gap >= 4, gap);
  let over = []; for (let i = 0; i < N; i++) { await open(p, i); if (await p.$eval('.phys-body', b => b.scrollWidth > b.clientWidth + 1)) over.push(i + 1); }
  ok('phone: no sideways overflow', over.length === 0, over.join(','));
  if (!QUICK) { await open(p, 0); await p.screenshot({ path: `${OUT}/phone-s1.png` }); }
  await p.close();
} catch (e) { ok('harness ran to the end', false, e.message); }
await b.close();
console.log(R.join('\n'));
process.exit(R.some(l => l.startsWith('FAIL')) ? 1 : 0);
