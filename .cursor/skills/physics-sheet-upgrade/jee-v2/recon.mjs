// jee-v2 recon: node recon.mjs <raw.html> <out.json>   (headless; run through kit/slot.sh)
// Live facts of ONE JEE testprep Shell sim: controls, cards (with the CORRECT choice), readouts, hooks, Play/Reset behaviour, canvases.
import fs from 'fs'; import path from 'path';
const PC = [process.env.PUPPETEER_CORE, '/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].find(f => f && fs.existsSync(f));
const puppeteer = (await import(PC)).default;
const [, , rawPath, outPath] = process.argv;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const W = ms => new Promise(r => setTimeout(r, ms));
try {
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + encodeURI(path.resolve(rawPath)).replace(/#/g, '%23'), { waitUntil: 'load' }); await W(1200);
  const f = await p.$('.welcome-mode[data-mode="free"]'); if (f) { await f.click(); await W(500); }
  const snap = () => p.evaluate(() => {
    const txt = e => (e && e.textContent || '').replace(/\s+/g, ' ').trim();
    const pb = document.getElementById('shell-play');
    const vals = {}; document.querySelectorAll('#aside-controls input, #aside-controls select').forEach(e => { if (e.id) vals[e.id] = e.type === 'checkbox' ? e.checked : e.value; });
    return { play: pb ? { text: txt(pb), aria: pb.getAttribute('aria-label') || '', disabled: !!pb.disabled, shown: !!(pb.offsetWidth || pb.offsetHeight) } : null, vals,
      playing: typeof Shell !== 'undefined' ? !!Shell.playing : null };
  });
  const R = await p.evaluate(() => {
    const txt = e => (e && e.textContent || '').replace(/\s+/g, ' ').trim();
    const vis = e => !!(e.offsetWidth || e.offsetHeight);
    const lab = e => { const l = e.id && document.querySelector('label[for="' + e.id + '"]'); if (l) return txt(l);
      const box = e.closest('.ctrl-box,.kit-ctl,.ctrl,fieldset,.control,.shell-panel'); if (box) { const h = box.querySelector('.ctrl-box-label,h3,h4,.ctrl-title,legend,label'); if (h && !h.contains(e)) return txt(h); } return ''; };
    const skip = e => e.closest('#welcome-overlay,#aside-inquiry,#inq-cards,.cg-callout,#phys-backdrop,#gv-root,.shell-modal-backdrop,.shell-header,.inq-pager,#qfbBackdrop');
    const controls = [...document.querySelectorAll('.shell-aside input, .shell-aside select, .shell-aside button, .shell-hero input, .shell-hero select, .shell-hero button, #aside-controls input, #aside-controls select, #aside-controls button')]
      .filter((e, i, a) => a.indexOf(e) === i && !skip(e))
      .map(e => ({ tag: e.tagName.toLowerCase(), type: e.type || '', id: e.id || '', label: lab(e) || txt(e).slice(0, 40), min: e.min, max: e.max, step: e.step,
        value: e.type === 'checkbox' || e.type === 'radio' ? e.checked : e.value, name: e.name || '', box: (e.closest('[id^="box-"],.ctrl-box') || {}).id || '', opts: e.tagName === 'SELECT' ? [...e.options].map(o => o.value + '=' + txt(o)) : undefined,
        cls: e.className && String(e.className).slice(0, 50), vis: vis(e) }));
    const cards = [...document.querySelectorAll('.inq-step')].map((c, i) => ({ i, gate: c.hasAttribute('data-gate'), h: txt(c.querySelector('h4')),
      ps: [...c.querySelectorAll('p')].map(txt), attrs: [...c.attributes].map(a => a.name).filter(n => n.startsWith('data-')),
      choices: [...c.querySelectorAll('.choice')].map(x => ({ correct: x.hasAttribute('data-correct'), text: txt(x), fb: (x.getAttribute('data-fb') || '').replace(/<[^>]+>/g, '') })) }));
    const hdr = [...document.querySelectorAll('.shell-header button, .shell-header select')].map(e => (e.id || e.tagName) + ':' + txt(e).slice(0, 24));
    const canv = [...document.querySelectorAll('canvas')].filter(c => !c.closest('#welcome-overlay,#phys-backdrop,#gv-root')).map(c => { const r = c.getBoundingClientRect(); return { id: c.id, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; });
    const hero = document.querySelector('.shell-hero'); const hr = hero && hero.getBoundingClientRect();
    const ro = [...document.querySelectorAll('#aside-controls [id], .shell-formal [id], .shell-hero [id]')].filter(e => !/^(btn-|cg-|inq-)/.test(e.id) && e.tagName !== 'INPUT' && e.tagName !== 'BUTTON' && e.tagName !== 'CANVAS' && !e.closest('.cg-callout'))
      .slice(0, 40).map(e => e.id + '=' + txt(e).slice(0, 36));
    const S = typeof Shell !== 'undefined' ? Shell : null;
    return { title: document.title, h1: txt(document.querySelector('.shell-title')), hasShell: !!S, shellKeys: S ? Object.keys(S).slice(0, 40) : [],
      three: typeof THREE !== 'undefined' || !!document.querySelector('script[src*="three"]') || /THREE\./.test(document.documentElement.innerHTML.slice(0, 3e6)),
      hooks: ['__physicsHooks', '__freeExplore', '__cgReveals', '__cgPrepare', '__giResume', '__setMode', '__fullReset', 'applyInquiryScene', 'applyPhysicsScene', '__audit'].filter(k => typeof window[k] !== 'undefined'),
      hookSrc: Object.fromEntries(['__freeExplore', '__cgReveals', '__cgPrepare', '__giResume', 'applyInquiryScene', '__fullReset'].filter(k => typeof window[k] === 'function').map(k => [k, String(window[k]).slice(0, 2500)])),
      controls, cards, header: hdr, canvases: canv, hero: hr ? { x: Math.round(hr.left), y: Math.round(hr.top), w: Math.round(hr.width), h: Math.round(hr.height) } : null,
      formal: txt(document.querySelector('.shell-formal')).slice(0, 3000), info: txt(document.querySelector('#shell-info-modal .shell-modal-body, #shell-info-modal')).slice(0, 3000), readouts: ro,
      hasPanelBars: !!document.querySelector('#panel-bars'), asideCtl: !!document.querySelector('#aside-controls') };
  });
  const before = await snap();
  const pb = await p.$('#shell-play'); let afterPlay = null, afterReset = null, playClicked = false;
  if (pb && before.play && before.play.shown) { try { await pb.click(); playClicked = true; await W(700); afterPlay = await snap(); } catch (e) { afterPlay = { err: String(e).slice(0, 80) }; } }
  const rb = await p.$('#shell-reset'); if (rb) { try { await rb.click(); await W(500); afterReset = await snap(); } catch (e) { afterReset = { err: String(e).slice(0, 80) }; } }
  R.behaviour = { before, afterPlay, afterReset, playClicked };
  R.errs = errs; fs.writeFileSync(outPath, JSON.stringify(R, null, 1));
} finally { await b.close(); }
