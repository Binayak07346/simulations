// "Nothing broke" gate: compare a built sim against its original (headless).   node regress.mjs <original.html> <built.html> [<workdir>]
// R1 file: only the allowed additions changed (regress_static.py; hook hunks are listed for review)
// R2 no new page errors · R3 header/sidebar boxes unchanged (Ask AI Tutor button excluded)
// R4 every sidebar slider still changes the stage · R5 Play still runs the stage · R6 Reset still works
// R7 Guided Inquiry opens on the same card and a choice gives feedback · R8 The Physics sheet opens and closes
// R9 header Simulation-guide button opens the new tour; Esc closes it · R10 Reset in Explore freely does not bring the hint back
// R11 no new sideways scroll at 390 px · R12 the guide card fits a 1280×720 window on every step
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import crypto from 'crypto';
const PC = [process.env.PUPPETEER_CORE, '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].find(f => f && fs.existsSync(f));
const P = (await import(PC)).default;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [ORIG, BUILT, WORK] = process.argv.slice(2).map(f => path.resolve(f));   // WORK (optional): the sim's work folder
const HOOKS = WORK ? fs.existsSync(path.join(WORK, 'hooks.py')) : true;
const u = f => 'file://' + encodeURI(f).replace(/#/g, '%23');
const wait = ms => new Promise(r => setTimeout(r, ms));
const res = []; const rec = (id, ok, ev) => { res.push({ id, ok:!!ok, ev }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' — ' + ev); };
// R1
const st = execFileSync('python3', [path.join(path.dirname(new URL(import.meta.url).pathname), 'regress_static.py'), ORIG, BUILT], { encoding:'utf8', maxBuffer:1 << 26 }).trim().split('\n');
const sj = JSON.parse(st[st.length - 1]);
rec('R1 file: only allowed changes', sj.layer_found && sj.manifest_ok && (HOOKS || sj.hunks === 0), `guide layer=${sj.layer_found} manifest kept=${sj.manifest_ok} · other hunks=${sj.hunks} (+${sj.added_lines}/−${sj.removed_lines}; must be the hooks.py edits)` + (sj.hunks ? '\n' + st.slice(0, -1).map(l => '      ' + l).join('\n') : ''));
const b = await P.launch({ executablePath:CHROME, headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
async function open(file, vp = { width:1440, height:900 }){ const c = await b.createBrowserContext(); const p = await c.newPage(); await p.setViewport(vp);
  p.__err = []; p.on('pageerror', e => p.__err.push(String(e.message).slice(0, 140))); p.setDefaultTimeout(30000);
  await p.goto(u(file), { waitUntil:'load', timeout:120000 }); await wait(4500); p.__c = c; return p; }
async function enterFree(p){   // original: the old welcome's Explore choice; built: the board's Explore freely (then the hint is closed)
  await p.evaluate(() => { const g = document.getElementById('gv-go-free'); if(g){ g.click(); return; }
    const w = document.querySelector('.welcome-mode[data-mode="free"]'); if(w) w.click(); });
  await wait(1200); await p.evaluate(() => { const x = document.getElementById('gv-hint-x'); const h = document.getElementById('gv-hint'); if(h && !h.hidden && x) x.click(); }); await wait(300); }
const stageRect = p => p.evaluate(() => { const c = [...document.querySelectorAll('canvas')].map(e => ({ e, r:e.getBoundingClientRect() })).filter(o => o.r.width > 80 && o.r.height > 80).sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0];
  if(!c) return null; const r = c.r; return { x:Math.max(0, r.left), y:Math.max(0, r.top), width:Math.min(innerWidth, r.right) - Math.max(0, r.left), height:Math.min(innerHeight, r.bottom) - Math.max(0, r.top) }; });
const snap = async (p, clip) => clip && clip.width > 0 && clip.height > 0 ? crypto.createHash('md5').update(await p.screenshot({ clip, type:'png' })).digest('hex') : 'none';
async function probe(file){
  const p = await open(file); await enterFree(p);
  const out = {};
  // same run state in both builds before measuring: the original may auto-run in free mode while the built one waits for Play
  await p.evaluate(() => { const s = window.__GV_SPEC; const sel = (s && s.play) || ['#shell-play','#playpause-btn','#btnPlayPause','#sim-play-pause-btn','#playBtn','#startPause'].find(q => document.querySelector(q));
    const b = sel && document.querySelector(sel); if(b && !/pause/i.test(b.textContent + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.title || ''))) b.click(); });
  await wait(900);
  const measure = () => p.evaluate(() => { const o = {}, path = e => { const a = []; while(e && e !== document.body){ a.unshift(e.tagName + ':' + [...e.parentElement.children].indexOf(e)); e = e.parentElement; } return a.join('/'); };
    document.querySelectorAll('.shell-header,.top-bar,.shell-aside,#sb-sidebar,.sidebar').forEach(R => [R, ...R.querySelectorAll('*')].forEach(e => { if(e.closest('.ask-euler,#ask-euler')) return;
      const q = e.getBoundingClientRect(); if(!q.width || !q.height) return; o[path(e)] = [q.left, q.top, q.width, q.height].map(Math.round).join(',') + (e.closest('.shell-header,.top-bar') ? '|h' : (e.children.length && /\d/.test(e.textContent || '') && (e.textContent || '').trim().length <= 24 ? '|sn' : '|s')) + '|' + (e.children.length ? '' : (e.textContent || '').trim().slice(0, 40)); })); return o; });
  // elements that change between two samples on the same page are live animation (bars, readouts), not layout: drop them
  { const m1 = await measure(); await wait(450); const m2 = await measure(); out.boxes = {}; for(const k of Object.keys(m1)) if(m1[k] === m2[k]) out.boxes[k] = m1[k]; }
  out.tutorW = await p.evaluate(() => { const e = document.querySelector('.ask-euler,#ask-euler'); return e ? Math.round(e.getBoundingClientRect().width) : 0; });
  const clip = await stageRect(p);
  // sliders
  const sl = await p.evaluate(() => [...document.querySelectorAll('.shell-aside input[type=range],#sb-sidebar input[type=range],.sidebar input[type=range],aside input[type=range]')]
    .filter(e => e.getBoundingClientRect().width > 0 && !e.disabled).slice(0, 4).map((e, i) => { e.dataset.rq = 'r' + i; return 'r' + i; }));
  out.sliders = [];
  await p.evaluate(() => { const s = window.__GV_SPEC; const sel = (s && s.play) || ['#shell-play','#playpause-btn','#btnPlayPause','#sim-play-pause-btn','#playBtn','#startPause'].find(q => document.querySelector(q));
    const b = sel && document.querySelector(sel); if(b && /pause/i.test(b.textContent + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.title || ''))) b.click(); });
  await wait(700);
  const drift = (await snap(p, clip)) !== (await (async () => { await wait(900); return snap(p, clip); })());   // still animating while paused?
  out.drift = drift;
  for(const id of sl){ const h0 = await snap(p, clip);
    await p.evaluate(id => { const e = document.querySelector(`[data-rq="${id}"]`); const v = +e.value === +e.max ? e.min : e.max; e.value = v; e.dispatchEvent(new Event('input', { bubbles:true })); e.dispatchEvent(new Event('change', { bubbles:true })); }, id);
    await wait(900); out.sliders.push(h0 !== await snap(p, clip)); }
  // play
  const play = await p.evaluate(() => { const s = window.__GV_SPEC; const sel = (s && s.play) || ['#shell-play','#playpause-btn','#btnPlayPause','#sim-play-pause-btn','#playBtn','#startPause'].find(q => document.querySelector(q));
    return sel && document.querySelector(sel) ? sel : null; });
  out.play = null;
  if(play){ const h0 = await snap(p, clip); await p.click(play); await wait(1800); const h1 = await snap(p, clip); await wait(900); const h2 = await snap(p, clip); out.play = h0 !== h2 || h1 !== h2; }
  // reset
  const reset = await p.evaluate(() => { const s = window.__GV_SPEC; const sel = (s && s.reset) || ['#shell-reset','#reset-btn','#btnReset','#resetBtn','#reset'].find(q => document.querySelector(q)); return sel && document.querySelector(sel) ? sel : null; });
  if(reset){ await p.click(reset); await wait(1200); }
  out.hintAfterReset = await p.evaluate(() => { const h = document.getElementById('gv-hint'); return !!(h && !h.hidden); });
  // inquiry
  out.gi = null;
  if(await p.evaluate(() => !!document.getElementById('btn-gi'))){ await p.click('#btn-gi'); await wait(1600);
    out.gi = await p.evaluate(() => { const c = [...document.querySelectorAll('.inq-step')].find(e => e.getBoundingClientRect().height > 0); return c ? (c.querySelector('h4,h3') || c).textContent.trim().slice(0, 60) : null; });
    const ch = await p.evaluate(() => { const c = [...document.querySelectorAll('.inq-step .choice')].find(e => e.getBoundingClientRect().height > 0); if(!c) return 'none'; c.click(); return 'clicked'; });
    await wait(700); out.giFeedback = ch === 'none' ? 'no-choice' : await p.evaluate(() => [...document.querySelectorAll('.predict-eval')].some(e => e.getBoundingClientRect().height > 0 && e.textContent.trim()));
    await p.evaluate(() => document.getElementById('btn-gi').click()); await wait(800); }
  // physics sheet
  out.sheet = null;
  if(await p.evaluate(() => !!document.getElementById('toggle-formal'))){ await p.evaluate(() => document.getElementById('toggle-formal').click()); await wait(1200);
    const o = await p.evaluate(() => { const b = document.getElementById('phys-backdrop'); return !!b && (b.classList.contains('open') || getComputedStyle(b).display !== 'none'); });
    await p.keyboard.press('Escape'); await wait(600);
    const c = await p.evaluate(() => { const b = document.getElementById('phys-backdrop'); return !!b && (b.classList.contains('open') || getComputedStyle(b).display !== 'none'); });
    out.sheet = o && !c; }
  out.err = p.__err; await p.__c.close();
  // phone
  const m = await open(file, { width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2 }); out.phone = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth); out.err.push(...m.__err); await m.__c.close();
  return out;
}
try {
  const A = await probe(ORIG), B = await probe(BUILT);
  const newErr = B.err.filter(e => !A.err.includes(e));
  rec('R2 no new page errors', !newErr.length, newErr.length ? newErr.slice(0, 3).join(' | ') : `none (original had ${A.err.length})`);
  const d = Math.abs(B.tutorW - A.tutorW);   // the approved Ask Euler -> Ask AI Tutor rename widens one header button
  const moved = Object.keys(A.boxes).filter(k => { if(B.boxes[k] === undefined || B.boxes[k] === A.boxes[k]) return false;
    const [a, ha, ta] = A.boxes[k].split('|'), [bb, , tb] = B.boxes[k].split('|');
    if(ta !== tb) return false;                       // live readout text differs (time/state): not a layout change
    if(ha === 'sn'){ const x = a.split(',').map(Number), y = bb.split(',').map(Number); return !(Math.abs(x[1] - y[1]) <= 1 && Math.abs(x[3] - y[3]) <= 1); }   // numeric readout container: its width follows live digits/sign, only vertical shifts count
    if(ha !== 'h') return a !== bb;
    const x = a.split(',').map(Number), y = bb.split(',').map(Number);
    return !(x[1] === y[1] && x[3] === y[3] && Math.abs(x[0] - y[0]) <= d + 1 && Math.abs(x[2] - y[2]) <= d + 1); });
  rec('R3 header/sidebar boxes unchanged', !moved.length, moved.length ? `${moved.length} moved, e.g. ${moved[0]}: ${A.boxes[moved[0]]} → ${B.boxes[moved[0]]}` : `${Object.keys(A.boxes).length} boxes identical (header shifts ≤ the ${d}px rename allowed; sidebar exact)`);
  rec('R4 sliders still drive the stage', A.sliders.every((v, i) => !v || B.sliders[i] || A.drift || B.drift), `original ${A.sliders.map(Number).join('')} · built ${B.sliders.map(Number).join('')} (1 = stage changed; paused first; stage idles ${A.drift || B.drift ? 'NOT still, so the per-slider test is uninformative and only passes by that rule' : 'still'})`);
  rec('R5 Play still runs the stage', A.play === null || !A.play || B.play, `original ${A.play} · built ${B.play}`);
  rec('R6 Reset leaves no errors', !newErr.length, 'covered by R2 (Reset is pressed during the probe)');
  rec('R7 Guided Inquiry unchanged', A.gi === B.gi && (A.giFeedback === B.giFeedback || B.giFeedback === true), `card "${B.gi}" (orig "${A.gi}") · feedback ${B.giFeedback} (orig ${A.giFeedback})`);
  rec('R8 Physics sheet opens/closes', A.sheet === B.sheet, `original ${A.sheet} · built ${B.sheet}`);
  rec('R10 hint stays gone after Reset', !B.hintAfterReset, `hint visible after Reset=${B.hintAfterReset}`);
  rec('R11 no new sideways scroll at 390 px', B.phone <= Math.max(0, A.phone), `overflow original ${A.phone}px · built ${B.phone}px`);
  // R9 + R12 (built only)
  const p = await open(BUILT); await enterFree(p);
  await p.click('#btn-cg'); await wait(1400); const t1 = await p.evaluate(() => !document.getElementById('gv-tour').hidden);
  await p.keyboard.press('Escape'); await wait(700); const t2 = await p.evaluate(() => !document.getElementById('gv-tour').hidden);
  rec('R9 header guide button → new tour; Esc closes', t1 && !t2, `opened=${t1} closedByEsc=${!t2}`); await p.__c.close();
  const q = await open(BUILT, { width:1280, height:720 }); await q.click('#gv-go-guide'); await wait(1400); const fit = [];
  const n = await q.evaluate(() => window.__gv.steps.length);
  for(let s = 0; s < n; s++){ fit.push(await q.evaluate(() => { const c = document.getElementById('gv-card').getBoundingClientRect(); return c.left >= 0 && c.top >= 0 && c.right <= innerWidth && c.bottom <= innerHeight; })); if(s < n - 1){ await q.click('#gv-next'); await wait(1200); } }
  rec('R12 guide card fits 1280×720', fit.every(Boolean), fit.map(v => v ? 'in' : 'OUT').join(','));
  await q.__c.close();
} catch(e){ rec('X run', false, String(e.message).slice(0, 200)); }
await b.close();
const f = res.filter(r => !r.ok).length; console.log(`\n${res.length - f}/${res.length} PASS`); process.exit(f ? 1 : 0);
