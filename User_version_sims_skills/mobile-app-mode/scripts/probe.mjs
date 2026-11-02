// probe.mjs <sim.html> [--roles roles.json|'{"panel":"#x",...}'] [--shots dir]
// Diagnose ANY simulation for mobile/tablet BEFORE converting it. Headless; the sim file is never modified
// (a temp copy with the layer is made next to the OS temp dir).
//   1. BEFORE: the sim as it is today on a landscape phone (844x390) and tablet (1180x820): header height,
//      share of the screen the drawing gets, sliders reachable without scrolling, controls pushed off-screen,
//      sideways scroll.
//   2. AFTER: the same sim with fermi-app-mode (and the role map, if given) on a 608x348 phone and a 1184x800
//      tablet: did app mode switch on, which page family and which elements it took as header / panel / hero,
//      what moved into the quick card, read-out chip, caps. If it did NOT switch on, it lists candidate
//      elements for a role map.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const KIT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const SIM = args.filter((a, i) => !a.startsWith('--') && !['--roles', '--shots'].includes(args[i - 1]))[0];
if (!SIM) { console.error('usage: node probe.mjs <sim.html> [--roles roles.json|json] [--shots dir]'); process.exit(2); }
const SHOTS = opt('--shots'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
let roles = opt('--roles'); if (roles) roles = JSON.parse(fs.existsSync(roles) ? fs.readFileSync(roles, 'utf8') : roles);

const CANDS = [process.env.PUPPETEER_CORE, 'puppeteer-core', 'puppeteer',
  '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].filter(Boolean);   // last: the Fermi build machine
let P = null; for (const c of CANDS) { try { P = (await import(c)).default; if (P) break; } catch (e) {} }
if (!P) { console.error('install puppeteer-core (npm i puppeteer-core) or set PUPPETEER_CORE'); process.exit(2); }
const SYS = { darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', linux: '/usr/bin/google-chrome', win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }[process.platform];
const CHROME = process.env.CHROME || (fs.existsSync(SYS || '') ? SYS : undefined);

// temp copy with the layer (same insertion rule as app_mode.py: right before the LAST </body>)
const JS = fs.readFileSync(path.join(KIT, 'fermi-app-mode.js'), 'utf8');
const src = fs.readFileSync(SIM, 'utf8').replace(/<script id="fermi-app-mode-roles">[\s\S]*?<\/script>/, '').replace(/<script id="fermi-app-mode">[\s\S]*?<\/script>/, '');
const block = (roles ? '<script id="fermi-app-mode-roles">window.__FAPP_ROLES=' + JSON.stringify(roles).replace(/<\//g, '<\\/') + ';</script>' : '') + '<script id="fermi-app-mode">\n' + JS + '\n</script>';
const bodies = [...src.matchAll(/<\/body\s*>/gi)]; const at = bodies.length ? bodies[bodies.length - 1].index : src.length;
const TMP = path.join(path.dirname(path.resolve(SIM)), '.probe-' + path.basename(SIM));   // same folder, so relative assets load
fs.writeFileSync(TMP, src.slice(0, at) + block + src.slice(at));

const b = await P.launch({ ...(CHROME ? { executablePath: CHROME } : {}), headless: 'new', args: ['--mute-audio', '--disable-features=WebSpeechSynthesis', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
const W = ms => new Promise(r => setTimeout(r, ms));
const url = f => 'file://' + encodeURI(path.resolve(f)).replace(/#/g, '%23');
async function open(file, vp) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
  await p.evaluateOnNewDocument(() => { try { speechSynthesis.speak = () => {}; } catch (e) {} });
  await p.setViewport({ ...vp, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.goto(url(file), { waitUntil: 'load', timeout: 120000 }); await W(3000);
  return { ctx, p, errs };
}
const desc = e => e ? (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).filter(c => !c.startsWith('fapp')).slice(0, 3).join('.') : '')) : null;
const BEFORE = () => {
  const vw = innerWidth, vh = innerHeight, vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 2 && r.height > 2; };
  let best = 0; for (const c of document.querySelectorAll('canvas,svg,video,img')) { if (!vis(c)) continue; const r = c.getBoundingClientRect(); best = Math.max(best, Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))); }
  const top = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return vis(e) && r.top <= 2 && r.width >= vw * 0.6 && r.height >= 30 && r.height <= 200; }).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  const ranges = [...document.querySelectorAll('input[type=range]')].filter(vis);
  const off = [...document.querySelectorAll('button,select,input,a')].filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.left >= vw - 2 || r.right > vw + 2; }).length;
  return { header_px: top ? Math.round(top.getBoundingClientRect().height) : 0, drawing_pct: Math.round(best / (vw * vh) * 100), sliders: ranges.length,
    sliders_on_screen: ranges.filter(r => { const q = r.getBoundingClientRect(); return q.top >= 0 && q.bottom <= vh; }).length, controls_off_right_edge: off,
    page_scrolls: document.scrollingElement.scrollHeight > vh + 4, sideways_scroll: document.scrollingElement.scrollWidth > vw + 4 };
};
const AFTER = (descSrc) => {
  const desc = eval(descSrc); const H = document.documentElement, q = s => document.querySelector(s);
  const fam = ['shell', 'fixed', 'stage'].find(f => H.classList.contains('fapp-' + f)) || null;
  let st = null; try { st = window.FermiAppMode ? JSON.parse(FermiAppMode.state()) : null; } catch (e) {}
  const out = { active: H.classList.contains('fapp'), family: fam, version: window.__fermiAppMode || null, role_map: window.__FAPP_ROLES || null,
    header: desc(q('.fapp-hdr')), panel: desc(q('.fapp-panel')), hero: desc(q('.fapp-hero') || q('.shell-hero')),
    quick_card: [...document.querySelectorAll('.fapp-quick > *')].filter(e => !e.classList.contains('fapp-br')).map(desc), readout_chip: !!q('.fapp-chip'), state: st };
  if (!out.active) {   // help the author write a role map
    const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 2 && r.height > 2; };
    const vw = innerWidth, vh = innerHeight, area = e => { const r = e.getBoundingClientRect(); return r.width * r.height; };
    const ctl = [...document.querySelectorAll('input,select,button')].filter(vis);
    const box = new Map(); ctl.forEach(c => { let a = c.parentElement; for (let i = 0; i < 6 && a && a !== document.body; i++, a = a.parentElement) box.set(a, (box.get(a) || 0) + 1); });
    out.candidates = {
      hero: [...document.querySelectorAll('canvas,svg,main,#stage,[class*="stage"],[class*="canvas"],[id*="canvas"]')].filter(vis).sort((a, b) => area(b) - area(a)).slice(0, 4).map(e => desc(e) + ' ' + Math.round(area(e) / (vw * vh) * 100) + '%'),
      panel: [...box.entries()].filter(([e, n]) => { const r = e.getBoundingClientRect(); return n >= 2 && area(e) < 0.6 * vw * vh && !(r.top <= 2 && r.height <= 200); }).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([e, n]) => desc(e) + ' (' + n + ' controls)'),
      header: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return vis(e) && r.top <= 2 && r.width >= vw * 0.6 && r.height >= 30 && r.height <= 200; }).slice(0, 3).map(desc),
      play: ctl.filter(e => /^\W*(play|pause|start|run)\b/i.test(e.textContent || e.value || '') || /play|start/i.test(e.id)).slice(0, 3).map(desc),
      reset: ctl.filter(e => /^\W*reset\b/i.test(e.textContent || e.value || '') || /reset/i.test(e.id)).slice(0, 3).map(desc) };
  }
  return out;
};
try {
  const report = { sim: SIM, before: {}, after: {} };
  for (const [k, vp] of [['phone_844x390', { width: 844, height: 390 }], ['tablet_1180x820', { width: 1180, height: 820 }]]) {
    const o = await open(SIM, vp); report.before[k] = await o.p.evaluate(BEFORE); report.before[k].page_errors = o.errs.length; await o.ctx.close();
  }
  for (const [k, vp] of [['phone_608x348', { width: 608, height: 348 }], ['tablet_1184x800', { width: 1184, height: 800 }]]) {
    const o = await open(TMP, vp); report.after[k] = await o.p.evaluate(AFTER, desc.toString());
    if (SHOTS) { await o.p.screenshot({ path: path.join(SHOTS, k + '.png') });
      if (report.after[k].active && k.startsWith('phone')) { await o.p.evaluate(() => FermiAppMode.handle({ cmd: 'panel', open: true, tab: 'controls' })); await W(1200); await o.p.screenshot({ path: path.join(SHOTS, k + '-drawer.png') }); } }
    report.after[k].page_errors = o.errs; await o.ctx.close();
  }
  console.log(JSON.stringify(report, null, 1));
  const a = report.after.phone_608x348;
  console.log('\nVERDICT: ' + (a.active ? `app mode works as is (family ${a.family}); review the shots, then run app_mode.py + app_mode_check.mjs`
    : 'not detected: write a role map (see references/adapt-a-new-design.md) from the candidates above, then re-run this probe with --roles'));
} finally { await b.close(); fs.rmSync(TMP, { force: true }); }
