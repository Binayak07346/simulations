// gi_glow_check.mjs <before.html> <after.html> [--shots dir] : gate for the Guided Inquiry control glow. Headless.
// G1 every card, walked in order (gated cards answered correctly): exactly the mapped controls that are on screen glow
// G2 a real click on a glowing control ends its glow
// G3 free exploration: nothing glows
// G4 nothing outside the glow moved (layout of the page at load equals the before-file's)
// G5 no page error the before-file does not also throw on the same walk
import fs from 'fs'; import path from 'path';
const a = process.argv.slice(2); const si = a.indexOf('--shots');
const [BEFORE, AFTER] = a.filter((x, i) => !x.startsWith('--') && !(si >= 0 && i === si + 1));
const SHOTS = si >= 0 ? a[si + 1] : null; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const b = await P.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--mute-audio', '--disable-features=WebSpeechSynthesis', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const W = ms => new Promise(r => setTimeout(r, ms));
const url = f => 'file://' + encodeURI(path.resolve(f)).replace(/#/g, '%23');
const res = []; const ok = (id, pass, msg) => { res.push({ id, pass }); console.log(`${pass === null ? 'NOTE' : pass ? 'PASS' : 'FAIL'} ${id}  ${msg}`); };
const src = fs.readFileSync(AFTER, 'utf8'); const mm = src.match(/<script id="fermi-gi-try">[\s\S]*?var MAP = (\{[\s\S]*?\});/);
const MAP = mm ? JSON.parse(mm[1]) : null;
async function open(file) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 140))); p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.evaluateOnNewDocument(() => { try { speechSynthesis.speak = () => {}; } catch (e) {} try { HTMLMediaElement.prototype.play = function () { return Promise.resolve(); }; } catch (e) {} });
  await p.setViewport({ width: 1440, height: 900 }); await p.goto(url(file), { waitUntil: 'load', timeout: 120000 }); await W(3500);
  await p.evaluate(() => { const x = document.getElementById('gv-hint-x'); x && x.click(); }); await W(300);
  return { ctx, p, errs };
}
const SIG = () => [...document.querySelectorAll('body *')].filter(e => !['fermi-gi-try', 'fermi-gi-try-css'].includes(e.id)).slice(0, 4000).map(e => { const r = e.getBoundingClientRect(); return e.tagName + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height); }).join('|');
async function enterGI(p) { await p.evaluate(() => { try { window.__setMode && __setMode('inquiry'); } catch (e) {} if (document.documentElement.classList.contains('gi-off')) { const g = document.getElementById('btn-gi'); g && g.click(); } }); await W(900); }
async function walk(p, onCard) {
  const n = await p.evaluate(() => document.querySelectorAll('#inq-cards .inq-step').length);
  for (let k = 0; k < n; k++) {
    const idx = await p.evaluate(() => [...document.querySelectorAll('#inq-cards .inq-step')].findIndex(c => c.classList.contains('active')));
    if (idx !== k) return { reached: k, n, stuck: idx };
    await W(1000); if (onCard) await onCard(k);
    if (k === n - 1) break;
    // answer: the marked correct choice, else each choice in turn until Next unlocks (as a student would)
    const nch = await p.evaluate(() => { const c = document.querySelector('#inq-cards .inq-step.active'); return c ? c.querySelectorAll('.choice').length : 0; });
    const nextOpen = () => p.evaluate(() => !![...document.querySelectorAll('#inq-next,#inq-pager-next')].find(x => x.offsetParent && !x.disabled && !x.classList.contains('disabled')));
    const marked = await p.evaluate(() => { const c = document.querySelector('#inq-cards .inq-step.active'); const ch = c && (c.querySelector('.choice[data-correct="1"]') || c.querySelector('.choice[data-correct]:not([data-correct="0"])')); if (ch) { ch.click(); return true; } return false; });
    if (marked) await W(500);
    for (let j = 0; !marked && j < nch && !(await nextOpen()); j++) { await p.evaluate(j => { const c = document.querySelector('#inq-cards .inq-step.active'); const ch = c && c.querySelectorAll('.choice')[j]; ch && ch.click(); }, j); await W(500); }
    await p.evaluate(() => { const nx = [...document.querySelectorAll('#inq-next,#inq-pager-next')].find(x => x.offsetParent && !x.disabled); nx && nx.click(); }); await W(700);
  }
  return { reached: n, n };
}
try {
  if (!MAP) throw new Error('no glow block in the after-file');
  const A = await open(BEFORE), B = await open(AFTER);
  const same = (await A.p.evaluate(SIG)) === (await B.p.evaluate(SIG));
  ok('G4-layout', same, same ? 'page layout at load identical to the before-file' : 'LAYOUT DIFFERS AT LOAD');
  await enterGI(A.p); const wa = await walk(A.p);
  await enterGI(B.p);
  const bad = []; let glowed = 0, mapped = 0;
  const wb = await walk(B.p, async k => {
    const exp = await B.p.evaluate(s => (s || []).filter(q => { const e = document.querySelector(q); return e && e.getBoundingClientRect().width > 0; }), MAP[k]);
    const got = await B.p.evaluate(() => [...document.querySelectorAll('.fermi-try')].map(e => '#' + e.id));
    if (exp.length) mapped++;
    if (got.length) glowed++;
    if (exp.sort().join() !== got.sort().join()) bad.push(`card ${k + 1}: expected ${JSON.stringify(exp)} got ${JSON.stringify(got)}`);
    if (SHOTS && got.length) await B.p.screenshot({ path: path.join(SHOTS, `card-${k + 1}.png`) });
    if (got.length && k === Number(Object.keys(MAP)[0])) {   // G2 on the first mapped card: a real click ends the glow
      const r = await B.p.evaluate(q => { const e = document.querySelector(q); const x = e.getBoundingClientRect(); const h = e.querySelector('.ctrl-box-label,.ctrl-box-head,label,h3,span') || e; const y = h.getBoundingClientRect(); return { x: y.left + Math.min(8, y.width / 2), y: y.top + y.height / 2 }; }, got[0]);
      await B.p.mouse.click(r.x, r.y); await W(300);
      const still = await B.p.evaluate(q => document.querySelector(q).classList.contains('fermi-try'), got[0]);
      ok('G2-click-ends-glow', !still, `clicked ${got[0]}: glow ${still ? 'STILL ON' : 'ended'}`);
    }
  });
  ok('G1-cards', !bad.length && wb.reached === wb.n, `${wb.reached}/${wb.n} cards walked (before-file ${wa.reached}/${wa.n}); ${mapped} cards with an on-screen mapped control, ${glowed} glowed${bad.length ? '; ' + bad.slice(0, 3).join(' | ') : ''}`);
  await B.p.evaluate(() => { try { __setMode('free'); } catch (e) {} }); await W(900);
  const free = await B.p.evaluate(() => document.querySelectorAll('.fermi-try').length);
  ok('G3-free', free === 0, `free exploration: ${free} glowing`);
  const fresh = B.errs.filter(x => !A.errs.includes(x)); ok('G5-errors', !fresh.length, fresh.length ? 'new errors: ' + fresh.slice(0, 2).join(' | ') : 'no new page errors');
  await A.ctx.close(); await B.ctx.close();
} catch (e) { ok('X-crash', false, String(e.message).slice(0, 200)); }
await b.close();
const fails = res.filter(x => x.pass === false);
console.log(`\ngi-glow check: ${fails.length ? 'FAIL' : 'PASS'} (${res.filter(x => x.pass).length} pass, ${fails.length} fail)`);
process.exit(fails.length ? 1 : 0);
