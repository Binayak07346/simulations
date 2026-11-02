// node lastcard.mjs <label> <built.html> 1280x763 [1512x860 ...]   (headless)
// At the guide's LAST step: does the card overlap the "Press Play to start" tip (#gv-playtip)? Several viewports.
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const b = await P.launch({ executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new' });
const [label, f, ...vps] = process.argv.slice(2); let bad = 0;
for (const vp of vps) { const [w, h] = vp.split('x').map(Number);
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width:w, height:h });
  await p.goto(f.startsWith('http') ? f : 'file://' + encodeURI(f), { waitUntil:'load', timeout:120000 }); await new Promise(r => setTimeout(r, 3000));
  await p.evaluate(() => { const g = document.getElementById('gv-go-guide'), st = document.getElementById('gv-start');   // board landing, or direct landing (header button)
    if (g && st && !st.hidden) g.click(); else document.getElementById('btn-cg').click(); }); await new Promise(r => setTimeout(r, 1200));
  for (let k = 0; k < 10; k++) { const fin = await p.evaluate(() => { const e = document.getElementById('gv-final'); return e && !e.hidden; }); if (fin) break; await p.click('#gv-next'); await new Promise(r => setTimeout(r, 1100)); }
  await new Promise(r => setTimeout(r, 1500));
  const r = await p.evaluate(() => { const R = e => { if (!e) return null; const q = e.getBoundingClientRect(); return q.width ? q : null; };
    const c = R(document.getElementById('gv-card')), t = R(document.getElementById('gv-playtip')), pl = R(document.querySelector('#shell-play,#playpause-btn,#btnPlayPause'));
    const ov = (a, b) => a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0;
    return { card: c && [Math.round(c.left), Math.round(c.top), Math.round(c.width), Math.round(c.height)], tip: t && [Math.round(t.left), Math.round(t.top), Math.round(t.width), Math.round(t.height)], overlapTip: Math.round(ov(c, t)), overlapPlay: Math.round(ov(c, pl)) }; });
  if (!r.card || r.overlapTip || r.overlapPlay) bad++;
  console.log((r.card && !r.overlapTip && !r.overlapPlay ? 'PASS ' : 'FAIL ') + label.padEnd(8), vp.padEnd(10), JSON.stringify(r)); await ctx.close(); }
await b.close(); process.exit(bad ? 1 : 0);
