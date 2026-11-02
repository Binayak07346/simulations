// Record, per sim and per canonical component, the computed geometry/type values of EVERY element the
// component's legacy selector matches, plus the <html> state classes (fu-tight / fu-tighter from the header fit).
//   node harness/component_values.mjs OUT.json [--map MAP.json] [--par N] file1.html [file2.html ...]
// MAP.json: {component: {sel: "css selector list", props: [...]}} (written by tools/gen_sim_tokens.py --map).
// Used to write per-sim token overrides that reproduce today's look exactly (tools/gen_sim_tokens.py).
import fs from 'fs';
import path from 'path';
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const args = process.argv.slice(2); const out = args.shift();
let MAP = null, PAR = 4;
let LIST = null;
while (args[0] && args[0].startsWith('--')) { const k = args.shift(), v = args.shift(); if (k === '--map') MAP = JSON.parse(fs.readFileSync(v, 'utf8')); if (k === '--par') PAR = +v; if (k === '--list') LIST = fs.readFileSync(v, 'utf8').split('\n').filter(Boolean); }
if (LIST) args.push(...LIST);
const files = args.map(f => path.resolve(f));
if (!MAP) { console.error('need --map'); process.exit(2); }
const VPS = [[1280, 763], [1440, 900], [1100, 700], [900, 700], [390, 844], [560, 800], [1440, 900, 'gi']];   // 1100/900/560: between the sims' own breakpoints; last: Guided Inquiry open
const b = await P.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const res = {};
const one = async f => {
  res[f] = {};
  for (const [w, h, st] of VPS) {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: w, height: h, isMobile: w < 600, hasTouch: w < 600 });
    try {
      await p.goto('file://' + encodeURI(f), { waitUntil: 'load', timeout: 120000 }); await new Promise(r => setTimeout(r, 3000));
      await p.evaluate(() => { const g = document.getElementById('gv-go-free'); if (g) g.click(); });
      await new Promise(r => setTimeout(r, 900));
      await p.evaluate(() => { const x = document.getElementById('gv-hint-x'), hh = document.getElementById('gv-hint'); if (x && hh && !hh.hidden) x.click(); });
      await new Promise(r => setTimeout(r, 900));
      if (st === 'gi') { await p.evaluate(() => { const g = document.getElementById('btn-gi'); if (g) g.click(); }); await new Promise(r => setTimeout(r, 1500)); }
      res[f][`${w}x${h}${st ? '-' + st : ''}`] = await p.evaluate(MAP => {
        const o = { _html: document.documentElement.className, _css: document.documentElement.getAttribute('data-fermi-css') };
        for (const [k, def] of Object.entries(MAP)) {
          const els = [...document.querySelectorAll(def.sel)];   // hidden ones too: the rule reaches them when they appear (computed values exist for display:none)
          if (!els.length) continue;
          o[k] = els.slice(0, 60).map(e => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); const v = {};
            def.props.forEach(pn => v[pn] = cs.getPropertyValue(pn)); v._box = [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10];
            v._sel = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''); return v; });
        }
        return o; }, MAP);
    } catch (e) { res[f][`${w}x${h}${st ? '-' + st : ''}`] = { error: String(e.message).slice(0, 120) }; }
    await ctx.close();
  }
};
for (let i = 0; i < files.length; i += PAR) await Promise.all(files.slice(i, i + PAR).map(one));
await b.close(); fs.writeFileSync(out, JSON.stringify(res)); console.log('recorded', Object.keys(res).length, 'sims →', out);
