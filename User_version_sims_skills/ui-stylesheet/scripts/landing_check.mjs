// Direct-landing gate (headless).   node landing_check.mjs <ui-build.html> [<control: same build, stylesheet WITHOUT the switch>] [--shots DIR]
// Needs the stylesheet that sets --fsim-landing: direct (fermi-sim.css >= 1.3.2 on the CDN channel, or a local stand-in).
// D1 no start board / old welcome · D2 one tip about the Simulation guide · D3 tip under #btn-cg, button highlighted
// (ring + pulse) · D4 sim waits · D5 tip on screen ~5 s (measured in the page), highlight gone · D6 x closes it ·
// D7 the Simulation guide opens the tour and closes the tip · D8 last tour card clear of Play + its tip · D9 Play starts
// the sim and closes the tip · D10 a control closes it · D11 Guided Inquiry closes it · D12 phone width (info) ·
// C1 (control file) without the switch the start board still shows · X1 no page errors. Exit 1 on any FAIL.
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
import fs from 'fs';
const a = process.argv.slice(2); const SH = a.includes('--shots') ? a[a.indexOf('--shots') + 1] : null; const files = a.filter((x, i) => !x.startsWith('--') && a[i - 1] !== '--shots');
const [f, ctrl] = files.map(x => (x.startsWith('/') ? x : process.cwd() + '/' + x)); if (SH) fs.mkdirSync(SH, { recursive: true });
const b = await P.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--hide-scrollbars','--mute-audio'] });
const W = ms => new Promise(r => setTimeout(r, ms)); let fails = 0;
const R = (ok, id, msg) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${id} — ${msg}`); };
async function open(file, vp = [1280, 763], settle = 1800) { const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: vp[0], height: vp[1] });
  await p.evaluateOnNewDocument(() => { window.__tipLog = {}; const iv = setInterval(() => { const h = document.getElementById('gv-hint'); if (!h) return;
    const on = !h.hidden && h.classList.contains('gv-guidetip'); const L = window.__tipLog;
    if (on && L.on == null) L.on = performance.now(); if (!on && L.on != null && L.off == null) { L.off = performance.now(); clearInterval(iv); } }, 25); });
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 100))); await p.goto('file://' + encodeURI(file), { waitUntil:'load', timeout:120000 }); await p.waitForFunction(() => window.__tipLog && window.__tipLog.on != null, { timeout: 12000 }).catch(() => {}); await W(Math.min(settle, 300)); return { p, ctx, errs }; }
const st = p => p.evaluate(() => { const v = e => e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
  const h = document.getElementById('gv-hint'), c = document.getElementById('btn-cg'), hr = h.getBoundingClientRect(), cr = c.getBoundingClientRect();
  return { board: v(document.getElementById('gv-start')), welcome: v(document.getElementById('welcome-overlay')), tip: v(h) && h.classList.contains('gv-guidetip'), text: document.getElementById('gv-hint-text').textContent,
    below: hr.top >= cr.bottom - 2 && hr.left < cr.right && hr.right > cr.left, gap: Math.round(hr.top - cr.bottom), pulse: c.classList.contains('gv-attn'), ring: getComputedStyle(c).outlineStyle !== 'none' && parseFloat(getComputedStyle(c).outlineWidth) >= 2, playing: window.__gv && window.__gv.isPlaying(), tour: window.__gv && window.__gv.active,
    tipBox: [hr.left, hr.top, hr.width, hr.height].map(Math.round) }; });
{ const { p, ctx, errs } = await open(f); const s = await st(p);
  R(!s.board && !s.welcome, 'D1', `no landing board / old welcome: board=${s.board} welcome=${s.welcome}`);
  R(s.tip && /Simulation guide/.test(s.text), 'D2', `one tip about the Simulation guide: "${s.text}"`);
  R(s.below && s.pulse && s.ring, 'D3', `tip under the Simulation guide button (gap ${s.gap}px), button highlighted: ring=${s.ring} pulse=${s.pulse} box=${s.tipBox}`);
  R(!s.playing, 'D4', `sim waits for the learner: playing=${s.playing}`);
  if (SH) await p.screenshot({ path: SH + '/1-open.png' });
  await p.waitForFunction(() => window.__tipLog && window.__tipLog.off != null, { timeout: 15000 }).catch(() => {}); const L = await p.evaluate(() => window.__tipLog); const s2 = await st(p);
  const dur = L.off != null ? Math.round(L.off - L.on) : null;
  R(dur != null && dur >= 4800 && dur <= 5900 && !s2.pulse && !s2.ring, 'D5', `closes itself after 5 s and the highlight goes: on screen ${dur} ms, ring=${s2.ring} pulse=${s2.pulse}`);
  R(!errs.length, 'X1', `no page errors ${errs.join(' | ')}`); await ctx.close(); }
{ const { p, ctx, errs } = await open(f); await p.evaluate(() => { const x = document.getElementById('gv-hint-x'); if (x) x.click(); }); await W(400); const s3 = await st(p); R(!s3.tip && !s3.pulse, 'D6', `x closes it: tip=${s3.tip} pulse=${s3.pulse}`);
  R(!errs.length, 'X1', `no page errors ${errs.join(' | ')}`); await ctx.close(); }
{ const { p, ctx } = await open(f); await p.click('#btn-cg'); await W(1500); const s = await st(p);
  R(s.tour && !s.tip, 'D7', `Simulation guide opens the tour and closes the tip: tour=${s.tour} tip=${s.tip}`);
  for (let k = 0; k < 10; k++) { const fin = await p.evaluate(() => { const e = document.getElementById('gv-final'); return e && !e.hidden; }); if (fin) break; await p.click('#gv-next'); await W(1100); }
  await W(1200); const ov = await p.evaluate(() => { const R = e => e && e.getBoundingClientRect(); const c = R(document.getElementById('gv-card')), t = R(document.getElementById('gv-playtip')), pl = R(document.querySelector('#shell-play,#playpause-btn,#btnPlayPause'));
    const o = (a, b) => a && b && a.width && b.width ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0; return [o(c, t), o(c, pl)]; });
  R(!ov[0] && !ov[1], 'D8', `last tour card clear of Play and its tip: overlap ${ov}`); if (SH) await p.screenshot({ path: SH + '/2-tour-last.png' }); await ctx.close(); }
{ const { p, ctx } = await open(f); const ps = await p.evaluate(() => window.__GV_SPEC && window.__GV_SPEC.play); if (ps) { const c = await p.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, ps); await p.mouse.click(c[0], c[1]); await W(900); const s = await st(p);
  R(!s.tip && s.playing, 'D9', `Play starts the sim and closes the tip: tip=${s.tip} playing=${s.playing}`); } else R(true, 'D9', 'static sim (no Play): skipped'); await ctx.close(); }
{ const { p, ctx } = await open(f); const ok = await p.evaluate(() => { for (const r of document.querySelectorAll('input[type=range]')) { const q = r.getBoundingClientRect(); if (!q.width || !q.height || q.top < 0 || q.bottom > innerHeight || q.left < 0 || q.right > innerWidth) continue; const x = q.left + q.width / 2, y = q.top + q.height / 2, h = document.elementFromPoint(x, y); if (h === r || r.contains(h)) return [x, y]; } return false; });
  if (ok) { await p.mouse.click(ok[0], ok[1]); await W(500); } const s = await st(p); R(!ok || !s.tip, 'D10', ok ? `using a control closes the tip: tip=${s.tip}` : 'no range input: skipped'); await ctx.close(); }
{ const { p, ctx } = await open(f); await p.click('#btn-gi'); await W(900); const s = await st(p); R(!s.tip, 'D11', `Guided Inquiry closes the tip: tip=${s.tip}`); if (SH) await p.screenshot({ path: SH + '/3-gi.png' }); await ctx.close(); }
{ const { p, ctx } = await open(f, [390, 844]); const s = await st(p); R(s.tip || true, 'D12', `phone 390: tip shown=${s.tip} box=${s.tipBox} (info)`); if (SH) await p.screenshot({ path: SH + '/4-phone.png' }); await ctx.close(); }
if (ctrl) { const { p, ctx } = await open(ctrl); const s = await st(p); R(s.board && !s.tip, 'C1', `without the token the start board shows as before: board=${s.board} tip=${s.tip}`); await ctx.close(); }
await b.close(); console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails ? 1 : 0);
