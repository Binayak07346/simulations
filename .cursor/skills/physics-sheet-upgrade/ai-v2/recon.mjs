// ai-v2 recon: node recon.mjs <raw.html> <out.json>   (headless; run through kit/slot.sh)
import fs from 'fs'; import path from 'path';
const PC = [process.env.PUPPETEER_CORE, '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].find(f => f && fs.existsSync(f));
const puppeteer = (await import(PC)).default;
const [, , rawPath, outPath] = process.argv;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const W = ms => new Promise(r => setTimeout(r, ms));
try {
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + encodeURI(path.resolve(rawPath)).replace(/#/g, '%23'), { waitUntil: 'load' }); await W(900);
  const f = await p.$('.welcome-mode[data-mode="free"]'); if (f) { await f.click(); await W(400); }
  const R = await p.evaluate(() => {
    const txt = e => (e && e.textContent || '').replace(/\s+/g, ' ').trim();
    const lab = e => { const l = e.id && document.querySelector('label[for="' + e.id + '"]'); if (l) return txt(l);
      const box = e.closest('.ctrl-box,.kit-ctl,.ctrl,fieldset,.control'); if (box) { const h = box.querySelector('h3,h4,.ctrl-title,.kit-lbl,label,legend,.lbl,span'); if (h && !h.contains(e)) return txt(h); } return ''; };
    const controls = [...document.querySelectorAll('.shell-side input, .shell-side select, .shell-side button, .ctrl-box input, .ctrl-box select, .ctrl-box button, #shell-root input, #shell-root select')]
      .filter((e, i, a) => a.indexOf(e) === i && !e.closest('#phys-backdrop,#gv-root,.inq-step'))
      .map(e => ({ tag: e.tagName.toLowerCase(), type: e.type || '', id: e.id || '', label: lab(e) || txt(e).slice(0, 40), min: e.min, max: e.max, step: e.step, value: e.type === 'checkbox' ? e.checked : e.value,
        val: e.dataset && e.dataset.value, opts: e.tagName === 'SELECT' ? [...e.options].map(o => o.value + '=' + txt(o)) : undefined, kit: e.closest('[data-kit-seg]') ? e.closest('[data-kit-seg]').dataset.kitSeg : undefined, cls: e.className && String(e.className).slice(0, 60), vis: !!(e.offsetWidth || e.offsetHeight) }));
    const cards = [...document.querySelectorAll('.inq-step')].map((c, i) => ({ i, h: txt(c.querySelector('h4')), prompt: txt(c.querySelector('p')),
      choices: [...c.querySelectorAll('.choice')].map(x => (x.hasAttribute('data-correct') ? '[CORRECT] ' : '') + txt(x)) }));
    const K = window.__kit, man = K && K.manifest;
    const sceneSrc = window.__physicsHooks && window.__physicsHooks.scene ? String(window.__physicsHooks.scene).slice(0, 6000) : null;
    const hdr = [...document.querySelectorAll('.shell-header button, header button')].map(e => (e.id || '') + ':' + txt(e)).slice(0, 14);
    return { title: document.title, h1: txt(document.querySelector('h1,.shell-title')), family: K ? 'kit' : 'legacy', hasShell: typeof Shell !== 'undefined',
      hooks: ['__physicsHooks', '__freeExplore', '__cgReveals', '__giResume', '__audit', '__kit', 'applyPhysicsScene', 'applyInquiryScene'].filter(k => typeof window[k] !== 'undefined'),
      sceneSrc, manifest: man ? { params: man.params, time: man.time, readouts: man.readouts, buttons: man.buttons, keys: Object.keys(man) } : null, kitState: K ? { p: K.p, q: K.q, s: Object.keys(K.s || {}) } : null,
      controls, cards, header: hdr, formal: txt(document.querySelector('.shell-formal')).slice(0, 2500), info: txt(document.querySelector('#shell-info-modal,.shell-info')).slice(0, 2500),
      readouts: [...document.querySelectorAll('[id^="ro-"],[id^="rd-"],[id*="readout"] [id],.kit-ro [id]')].slice(0, 30).map(e => e.id + '=' + txt(e).slice(0, 40)) };
  });
  R.errs = errs; fs.writeFileSync(outPath, JSON.stringify(R, null, 1));
} finally { await b.close(); }
