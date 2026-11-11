// reset_check.mjs <file.html> [more.html ...] : free exploration Reset -> the first-load view? Headless.
// R1 every slider / dropdown / checkbox in the panel is back at its first-load value after Reset
// R2 the panel and stage text (readouts) equals the first-load text, ignoring lines that also change while the sim just
//    runs (a clock, a live count) — measured by a second untouched copy
// R3 no new page errors
import path from 'path';
const files = process.argv.slice(2);
const P = (await import('/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).default;
const b = await P.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--mute-audio', '--disable-features=WebSpeechSynthesis', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const W = ms => new Promise(r => setTimeout(r, ms));
const url = f => 'file://' + encodeURI(path.resolve(f)).replace(/#/g, '%23');
const CTRL = 'input[type=range],input[type=number],select,input[type=checkbox],input[type=radio]';
async function open(f) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 120))); p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.evaluateOnNewDocument(() => { try { speechSynthesis.speak = () => {}; } catch (e) {} try { HTMLMediaElement.prototype.play = function () { return Promise.resolve(); }; } catch (e) {} Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); });
  await p.setViewport({ width: 1440, height: 900 }); await p.goto(url(f), { waitUntil: 'load', timeout: 120000 }); await W(4000);
  await p.evaluate(() => { const x = document.getElementById('gv-hint-x'); x && x.click(); try { window.__setMode && __setMode('free'); } catch (e) {} }); await W(1000);
  return { ctx, p, errs };
}
const state = p => p.evaluate(CTRL => {
  const panel = document.querySelector('.shell-aside,#aside-controls,#sb-sidebar,.sidebar,.control-panel,aside') || document.body;
  const vals = [...panel.querySelectorAll(CTRL)].filter(e => !e.closest('#inq-cards,#phys-backdrop,[id^=gv-]')).map(e => (e.id || e.name || e.type) + '=' + (e.type === 'checkbox' || e.type === 'radio' ? e.checked : e.value));
  const hero = document.querySelector('.shell-hero,main');
  return { vals, text: ((panel.innerText || '') + '\n' + (hero && hero !== panel ? hero.innerText : '')).split('\n').map(s => s.trim()).filter(Boolean) };
}, CTRL);
const RESET = '#shell-reset,#resetBtn,#btnReset,#btnResetDefault,#rsB,#reset,#reset-btn,#btn-reset,#resetButton';
for (const f of files) {
  let out;
  try {
    const A = await open(f); const s0 = await state(A.p);
    // a second, untouched copy over the same time: lines that change on their own are not readout regressions
    const C = await open(f); const c0 = await state(C.p);
    // move everything: sliders to max (or min if at max), dropdowns to the next option, checkboxes toggled
    await A.p.evaluate(CTRL => {
      const panel = document.querySelector('.shell-aside,#aside-controls,#sb-sidebar,.sidebar,.control-panel,aside') || document.body;
      for (const e of panel.querySelectorAll(CTRL)) { if (e.closest('#inq-cards,#phys-backdrop,[id^=gv-]') || e.disabled || e.getBoundingClientRect().width === 0) continue;
        const fire = () => { e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
        if (e.type === 'checkbox') { e.click(); continue; }
        if (e.type === 'radio') continue;
        const proto = e.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; const set = v => Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, String(v));
        if (e.tagName === 'SELECT') { if (e.options.length > 1) { set(e.options[(e.selectedIndex + 1) % e.options.length].value); fire(); } }
        else if (e.type === 'range' || e.type === 'number') { const v = +e.value === +e.max ? e.min : e.max; if (v !== '' && v != null) { set(v); fire(); } } }
    }, CTRL);
    await W(900);
    const rb = await A.p.$(RESET.split(',').map(s => s + ':not([hidden])').join(','));
    if (!rb) { out = 'NO RESET BUTTON'; }
    else {
      await rb.click(); await W(1800);
      const s1 = await state(A.p); const c1 = await state(C.p);
      const valsBack = s1.vals.join('|') === s0.vals.join('|');
      const notBack = s0.vals.filter((v, i) => s1.vals[i] !== v).slice(0, 4);
      const volatile = new Set(c0.text.filter(l => !c1.text.includes(l)));
      const lost = s0.text.filter(l => !s1.text.includes(l) && !volatile.has(l)).slice(0, 4);
      out = `${valsBack ? 'R1 PASS' : 'R1 FAIL ' + JSON.stringify(notBack)}  ${lost.length ? 'R2 FAIL ' + JSON.stringify(lost) : 'R2 PASS'}  ${A.errs.length ? 'R3 errors ' + A.errs.slice(0, 1) : 'R3 PASS'}`;
    }
    await A.ctx.close(); await C.ctx.close();
  } catch (e) { out = 'CRASH ' + String(e.message).slice(0, 100); }
  console.log(`${out}  ::  ${f}`);
}
await b.close();
