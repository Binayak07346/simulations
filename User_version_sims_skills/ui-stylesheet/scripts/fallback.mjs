// The inline fallback looks the same as the CDN stylesheet.   node fallback.mjs <built.html> [WxH]   (headless)
// Loads the build twice in Explore-freely mode: (1) normally (expects html[data-fermi-css="cdn"]), (2) with every
// fermi-sim/ CDN request blocked (expects "inline": the loader switched to the built-in copy). Compares the computed
// style + box of every element in the top bar, sidebar, stage frame and HIDE tab. Exit 1 on any difference.
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const [f, vp = '1280x763'] = process.argv.slice(2); const [w, h] = vp.split('x').map(Number);
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-top-width', 'border-radius', 'box-shadow',
  'font-family', 'font-size', 'font-weight', 'letter-spacing', 'padding-top', 'padding-left', 'visibility', 'display', 'outline-style'];
const ROOTS = 'header, .shell-header, .top-bar, .shell-aside, #sb-sidebar, aside, #sb-hide-tab, .plot-box, .canvas-frame, .sim-stage';
const b = await P.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new' });
async function snap(block) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width:w, height:h });
  if (block) { await p.setRequestInterception(true); p.on('request', q => /\/fermi-sim\/[^/]+\/fermi-sim\.css/.test(q.url()) ? q.abort() : q.continue()); }
  await p.goto((f.startsWith('http') ? '' : 'file://') + encodeURI(f), { waitUntil:'load', timeout:120000 }); await new Promise(r => setTimeout(r, 4000));
  await p.evaluate(() => { const g = document.getElementById('gv-go-free'), st = document.getElementById('gv-start'); if (g && st && !st.hidden) g.click(); }); await new Promise(r => setTimeout(r, 4500));
  const out = await p.evaluate((ROOTS, PROPS) => { for (const a of document.getAnimations()) { try { a.finish(); } catch (e) {} }
    const o = { _css: document.documentElement.getAttribute('data-fermi-css') }, seen = new Set();
    const key = e => { const a = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) a.unshift(n.tagName + (n.id ? '#' + n.id : '') + ':' + (n.parentElement ? [...n.parentElement.children].indexOf(n) : 0)); return a.join('>'); };
    for (const r of document.querySelectorAll(ROOTS)) for (const e of [r, ...r.querySelectorAll('*')]) { if (seen.has(e)) continue; seen.add(e);
      const q = e.getBoundingClientRect(); if (!q.width || !q.height || e.closest('svg') && e.tagName !== 'svg') continue;
      const cs = getComputedStyle(e); o[key(e)] = PROPS.map(x => cs.getPropertyValue(x)).join('|') + '|' + [q.left, q.top, q.width, q.height].map(v => Math.round(v)).join(','); }
    return o; }, ROOTS, PROPS);
  await ctx.close(); return out;
}
const A = await snap(false), B = await snap(true); await b.close();
let n = 0; const diffs = [];
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) { if (k === '_css') continue; if (A[k] !== B[k]) { n++; if (diffs.length < 8) diffs.push(k.split('>').slice(-2).join('>') + '\n     cdn    ' + A[k] + '\n     inline ' + B[k]); } }
const ok = A._css === 'cdn' && B._css === 'inline' && !n;
console.log(`${ok ? 'PASS' : 'FAIL'} fallback — normal load: ${A._css} · CDN blocked: ${B._css} · ${Object.keys(A).length - 1} elements · ${n} differ`);
diffs.forEach(d => console.log('   ' + d));
process.exit(ok ? 0 : 1);
