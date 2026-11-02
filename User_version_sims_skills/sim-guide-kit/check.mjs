// Guide v2 gate for ONE built sim (headless Chrome only).   node check.mjs <built.html> [--shots DIR]
// Everything is read from the sim's own window.__GV_SPEC, so no per-sim config is needed. Dynamic sims (SPEC.play)
// and static sims (no Play: SPEC.trigger.at names the key control) are both covered.
// Every phase runs in its own try, so all 22 checks always print; a throw fails only that phase's checks.
// Exits 1 on any FAIL. Run it on an unbuilt sim once to see it fail.
import fs from 'fs'; import path from 'path';
const PC = [process.env.PUPPETEER_CORE, '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].find(f => f && fs.existsSync(f));
const P = (await import(PC)).default;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const file = path.resolve(process.argv[2]); const a = process.argv.slice(3);
const SHOTS = a.includes('--shots') ? a[a.indexOf('--shots') + 1] : null; if(SHOTS) fs.mkdirSync(SHOTS, { recursive:true });
const url = 'file://' + encodeURI(file).replace(/#/g, '%23');
const wait = ms => new Promise(r => setTimeout(r, ms));
const res = []; const rec = (id, ok, ev) => { res.push({ id, ok:!!ok, ev }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' — ' + ev); };
const failAll = (ids, e) => ids.forEach(id => rec(id, false, 'phase threw: ' + String(e && e.message || e).slice(0, 160)));
const b = await P.launch({ executablePath:CHROME, headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
async function fresh(){ const c = await b.createBrowserContext(); const p = await c.newPage(); await p.setViewport({ width:1440, height:900 });
  p.__err = []; p.on('pageerror', e => p.__err.push(String(e.message).slice(0, 160))); p.setDefaultTimeout(30000);
  await p.goto(url, { waitUntil:'load', timeout:120000 }); await wait(4000); p.__c = c; return p; }
const close = async p => { try{ errs.push(...p.__err); await p.__c.close(); }catch(_){} };
const shot = async (p, n) => { if(SHOTS) await p.screenshot({ path:path.join(SHOTS, n + '.jpg'), type:'jpeg', quality:75 }); };
// the card writes its text word by word: wait until every word is visible (max 4 s) before measuring or shooting
const settle = async p => { for(let i = 0; i < 20; i++){ const done = await p.evaluate(() => [...document.querySelectorAll('#gv-card .gv-w, #gv-card .gv-write')].every(w => +getComputedStyle(w).opacity > 0.98));
  if(done && i >= 4) return; await wait(200); } };
const errs = [];
let SP = null;   // runtime spec summary
// ---------------------------------------------------------------- landing
try {
  const p = await fresh();
  const L = await p.evaluate(() => { const S = window.__GV_SPEC, st = document.getElementById('gv-start'), wo = document.getElementById('welcome-overlay');
    const vis = e => { if(!e) return false; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== 'none' && c.visibility !== 'hidden' && !e.hidden; };
    const str = v => typeof v === 'string' ? v : null;
    return { spec:!!S, title:S && S.title, h2:(document.getElementById('gv-start-title') || {}).textContent, blurb:(document.getElementById('gv-start-blurb') || {}).textContent,
      start:vis(st), oldWelcome:vis(wo), choices:[...document.querySelectorAll('#gv-start .gv-choice')].filter(vis).length,
      tutor:/Teach me/.test(document.body.innerText), playing:!!(window.__gv && window.__gv.isPlaying()),
      sp:S ? { n:S.steps.length, play:S.play || null, at:(S.trigger && S.trigger.at) || null,
        lines:[...S.steps.map(s => str(s.say)), str(S.playSay), S.trigger && str(S.trigger.say)].filter(Boolean),
        combined:S.steps.length && str(S.playSay) && str(S.steps[S.steps.length - 1].say) ? S.steps[S.steps.length - 1].say + ' ' + S.playSay : null,
        nonString:S.steps.filter(s => typeof s.say !== 'string').length } : null }; });
  SP = L.sp;
  await shot(p, '1-landing');
  rec('L1 landing board', L.spec && L.start && !L.oldWelcome, `spec=${L.spec} board=${L.start} oldWelcomeVisible=${L.oldWelcome}`);
  rec('L2 title + blurb', L.h2 && L.h2.trim() === (L.title || '').trim() && (L.blurb || '').trim().split(/\s+/).length >= 8, `"${(L.h2 || '').trim()}" · blurb ${(L.blurb || '').trim().split(/\s+/).length} words`);
  rec('L3 two choices', L.choices === 2, `${L.choices} visible`);
  rec('L4 Teach me (AI tutor) label', L.tutor, L.tutor ? 'present' : 'missing');
  rec('L5 sim waits on landing', !L.playing, `playing=${L.playing}`);
  await close(p);
} catch(e){ failAll(['L1 landing board','L2 title + blurb','L3 two choices','L4 Teach me (AI tutor) label','L5 sim waits on landing'], e); }
const STATIC = SP && !SP.play;
// ---------------------------------------------------------------- guide
try {
  const p = await fresh();
  await p.click('#gv-go-guide'); await wait(1200);
  const n = SP ? SP.n : 0; rec('G1 4–6 steps', n >= 4 && n <= 6, `${n} steps${STATIC ? ' (static sim)' : ''}`);
  const per = [];
  for(let s = 0; s < n; s++){
    await settle(p);
    const r = await p.evaluate(() => { const g = window.__gv, st = g.steps[g.step], c = document.getElementById('gv-card').getBoundingClientRect();
      const tg = (st.targets ? st.targets() : []).filter(t => t && !t.avoid);
      const sels = tg.filter(t => t.sel && !t.sec).map(t => t.sel);
      const box = t => { if(t.sel){ const e = document.querySelector(t.sel); if(!e) return null; const r = e.getBoundingClientRect(); return r.width ? [r.left, r.top, r.width, r.height] : null; }
        const rr = t.rect || t.ellipse; if(rr) return [rr.left, rr.top, rr.width, rr.height];
        if(t.poly){ const xs = t.poly.map(q => q[0]), ys = t.poly.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; } return null; };
      const boxes = tg.filter(t => !t.sec).map(box);
      const cover = boxes.filter(Boolean).map(q => { const ix = Math.max(0, Math.min(c.right, q[0] + q[2]) - Math.max(c.left, q[0])), iy = Math.max(0, Math.min(c.bottom, q[1] + q[3]) - Math.max(c.top, q[1])); return ix * iy / Math.max(1, q[2] * q[3]); });
      const lines = [...document.querySelectorAll('#gv-lines > *')].map(e => { try{ const q = e.getBBox(); return [q.x, q.y, q.width, q.height]; }catch(_){ return null; } }).filter(q => q && q[2] * q[3] > 4)
      // fermi-sim >= 1.2.0: page controls are MARKED by the guide and outlined by the stylesheet; count one only if
      // its outline really renders (a missing stylesheet rule leaves outline-style none and does not count)
      lines.push(...[...document.querySelectorAll('.fsim-guide-target')].filter(e => { const cs = getComputedStyle(e); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0; })
        .map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }).filter(q => q[2] * q[3] > 4));
      const inside = lines.map(q => { const ix = Math.max(0, Math.min(innerWidth, q[0] + q[2]) - Math.max(0, q[0])), iy = Math.max(0, Math.min(innerHeight, q[1] + q[3]) - Math.max(0, q[1])); return ix * iy / Math.max(1, q[2] * q[3]); });
      const S = window.__GV_SPEC, att = document.querySelector((S.play || (S.trigger && S.trigger.at)) || '#__none');
      return { i:g.step, title:st.title, final:!!st.final, ntg:tg.length, missing:boxes.filter(q => !q).length, sels:sels.length,
        lines:lines.length, minInside:inside.length ? Math.min(...inside) : 1, inView:c.left >= 0 && c.top >= 0 && c.right <= innerWidth && c.bottom <= innerHeight,
        cover:cover.length ? Math.max(...cover) : 0, playing:g.isPlaying(),
        voice:(() => { const v = document.getElementById('gv-voice'), r = v && v.getBoundingClientRect(); return v && r.width > 0 && !v.hidden ? v.parentNode.id : null; })(),
        attn:!!(att && att.classList.contains('gv-attn')) }; });
    per.push(r); await shot(p, `2-step${s + 1}`);
    if(s < n - 1){ await p.click('#gv-next'); await wait(900); }
  }
  rec('G2 every target found', per.every(r => r.missing === 0), per.map(r => `${r.i + 1}:${r.ntg - r.missing}/${r.ntg}`).join(' '));
  rec('G3 outlines drawn', per.every(r => r.ntg === 0 || r.lines > 0), per.map(r => r.lines).join(','));
  rec('G4 ≤ 3 controls per step', per.every(r => r.sels <= 3), per.map(r => r.sels).join(','));
  rec('G5 card on screen, off its targets', per.every(r => r.inView && r.cover < 0.15), per.map(r => `${r.inView ? 'in' : 'OUT'}/${Math.round(r.cover * 100)}%`).join(' '));
  rec('G6 sim paused through the tour', per.every(r => !r.playing), per.map(r => r.playing ? 'run' : 'paused').join(','));
  rec('G7 voice control on every card', per.every(r => r.voice), per.map(r => r.voice || 'none').join(','));
  const last = per[per.length - 1] || {};
  rec('G8 last card points at ' + (STATIC ? 'the trigger control' : 'Play'), last.final && last.attn, `final=${last.final} pulse on ${STATIC ? (SP && SP.at) : 'Play'}=${last.attn}`);
  rec('G11 outlines ≥ 90% on screen', per.every(r => r.minInside >= 0.9), per.map(r => Math.round(r.minInside * 100) + '%').join(','));
  await p.click('#gv-fin-free'); await wait(600);
  const tip1 = await p.evaluate(() => !document.getElementById('gv-playtip').hidden); await wait(3200);
  const tip2 = await p.evaluate(() => !document.getElementById('gv-playtip').hidden);
  rec('G9 Done → brief ' + (STATIC ? 'Try cue' : 'Play cue'), tip1 && !tip2, `shown=${tip1} after3.8s=${tip2}`);
  await close(p);
} catch(e){ failAll(['G1 4–6 steps','G2 every target found','G3 outlines drawn','G4 ≤ 3 controls per step','G5 card on screen, off its targets','G6 sim paused through the tour','G7 voice control on every card','G8 last card points at Play/trigger','G11 outlines ≥ 90% on screen','G9 Done → brief cue'], e); }
// ---------------------------------------------------------------- G10: the learner's first action works
try {
  const p = await fresh();
  if(!STATIC){
    await p.click('#gv-go-guide'); await wait(1200);
    await p.evaluate(() => window.__gv.go(window.__gv.steps.length - 1)); await wait(1200);
    await p.click(SP.play);   // a real click, as a learner would
    let seenRun = false;       // sims that run one short event then pause themselves still count as started
    for(let i = 0; i < 17; i++){ await wait(150); if(await p.evaluate(() => window.__gv.isPlaying())) seenRun = true; }
    const pe = await p.evaluate(() => ({ on:window.__gv.active, run:window.__gv.isPlaying() }));
    pe.run = pe.run || seenRun;
    rec('G10 Play on the last card starts the run', !pe.on && pe.run, `tourOpen=${pe.on} playing=${pe.run}`);
  } else {
    await p.click('#gv-go-free'); await wait(600);
    const before = p.__err.length;
    const how = await p.evaluate(sel => { const t = document.querySelector(sel); if(!t) return 'missing';
      const r = t.matches('input[type=range]') ? t : t.querySelector('input[type=range]');
      if(r){ const v = +r.value === +r.max ? r.min : r.max; r.value = v; r.dispatchEvent(new Event('input', { bubbles:true })); r.dispatchEvent(new Event('change', { bubbles:true })); return 'slider'; }
      (t.matches('button,input,select,[role=button]') ? t : (t.querySelector('button,input,select,[role=button]') || t)).click(); return 'click'; }, SP.at);
    await wait(1600);
    const h = await p.evaluate(() => { const e = document.getElementById('gv-hint'); return e.hidden || e.classList.contains('done'); });
    rec('G10 using the trigger control works', how !== 'missing' && h && p.__err.length === before, `used=${how} hintCompleted=${h} newErrors=${p.__err.length - before}`);
  }
  await close(p);
} catch(e){ failAll(['G10 learner\'s first action'], e); }
// ---------------------------------------------------------------- Explore freely
try {
  const p = await fresh(); await p.click('#gv-go-free'); await wait(900);
  const h1 = await p.evaluate(() => { const h = document.getElementById('gv-hint'), S = window.__GV_SPEC, t = document.querySelector((S.trigger && S.trigger.at) || S.play);
    const r = h.getBoundingClientRect(), q = t && t.getBoundingClientRect();
    const d = q ? Math.hypot((r.left + r.width / 2) - (q.left + q.width / 2), (r.top + r.height / 2) - (q.top + q.height / 2)) : 1e9;
    const txt = (document.getElementById('gv-hint-text') || {}).textContent || '';
    return { shown:!h.hidden, words:txt.trim().split(/\s+/).filter(Boolean).length, dist:Math.round(d), pulse:!!(t && t.classList.contains('gv-attn')),
      card:!document.getElementById('gv-tour').hidden, playing:window.__gv.isPlaying() }; });
  await shot(p, '3-free');
  await wait(2700); const h2 = await p.evaluate(() => !document.getElementById('gv-hint').hidden);
  rec('F1 one trigger hint (≤ 12 words)', h1.shown && !h1.card && h1.words <= 12, `shown=${h1.shown} guideCard=${h1.card} words=${h1.words}`);
  rec('F2 hint points at its control', h1.dist < 420 && h1.pulse, `distance=${h1.dist}px pulse=${h1.pulse}`);
  rec('F3 hint gone within 3 s', !h2, `visible at 3.6 s=${h2}`);
  rec('F4 sim waits for the learner', !h1.playing, `playing=${h1.playing}`);
  await close(p);
} catch(e){ failAll(['F1 one trigger hint (≤ 12 words)','F2 hint points at its control','F3 hint gone within 3 s','F4 sim waits for the learner'], e); }
// ---------------------------------------------------------------- N1: every spoken line has a clip (lines from the RUNTIME spec)
try {
  const html = fs.readFileSync(file, 'utf8'); const norm = s => s.replace(/\s+/g, ' ').trim();
  const lines = SP ? SP.lines.concat(SP.combined ? [SP.combined] : []).map(norm) : [];
  const mi = html.indexOf('const manifest='); let have = [];
  if(mi > 0){ let depth = 0, j = mi + 15, k = j, inStr = false, esc = false;
    for(; k < html.length; k++){ const ch = html[k];
      if(inStr){ if(esc) esc = false; else if(ch === '\\') esc = true; else if(ch === '"') inStr = false; continue; }
      if(ch === '"') inStr = true; else if(ch === '{') depth++; else if(ch === '}'){ depth--; if(!depth){ k++; break; } } }
    have = JSON.parse(html.slice(j, k)).clips.map(c => norm(c.text)); }
  const miss = lines.filter(t => !have.some(h => h === t || h.endsWith(t)));
  rec('N1 every guide line has a voice clip', lines.length && !miss.length && !(SP && SP.nonString),
    `${lines.length - miss.length}/${lines.length}` + (SP && SP.nonString ? ` · ${SP.nonString} step say(s) not plain strings` : '') + (miss.length ? ' missing: ' + miss[0].slice(0, 50) : ''));
} catch(e){ failAll(['N1 every guide line has a voice clip'], e); }
rec('X1 no page errors', !errs.length, errs.length ? errs.slice(0, 2).join(' | ') : 'none');
await b.close();
const fails = res.filter(r => !r.ok).length; console.log(`\n${res.length - fails}/${res.length} PASS`); process.exit(fails ? 1 : 0);
