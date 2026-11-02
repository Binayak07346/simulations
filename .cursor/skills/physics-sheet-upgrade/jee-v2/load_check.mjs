// jee-v2 load check for a DRAFT build: node load_check.mjs <final.user-version.html>  (through kit/slot.sh). Fails on page errors; reports guide + sheet presence.
import fs from 'fs'; import path from 'path';
const PC = [process.env.PUPPETEER_CORE, '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].find(f => f && fs.existsSync(f));
const puppeteer = (await import(PC)).default; const W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME, headless: 'new' });
try {
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + encodeURI(path.resolve(process.argv[2])).replace(/#/g, '%23'), { waitUntil: 'load' }); await W(1500);
  const R = await p.evaluate(() => ({ spec: !!window.__GV_SPEC, steps: window.__GV_SPEC && window.__GV_SPEC.steps.length, root: !!document.getElementById('gv-root') || !!document.querySelector('[id^="gv-"]'),
    sheetBtn: !!document.getElementById('toggle-formal'), art: !!document.getElementById('phys-art'), hooks: !!window.__physicsHooks, tgt: (window.__GV_SPEC ? window.__GV_SPEC.steps.map(s => { try { return s.targets().length; } catch (e) { return 'ERR ' + e.message; } }) : []) }));
  console.log(JSON.stringify({ ...R, errs })); process.exit(errs.length || !R.spec || !R.art || !R.hooks ? 1 : 0);
} finally { await b.close(); }
