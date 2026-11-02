#!/usr/bin/env node
/*
 * Real-browser smoke test for a sim carrying the Guided Inquiry / Simulation
 * guide template (two-mode landing, scene tour; see also sim-guide-scene.mjs,
 * which runs without Playwright and covers the scene-tour geometry). Runs the sim's ACTUAL init in Chromium (Playwright).
 *
 *   node browser-smoke.js <patched.html> [--baseline <original.html>]
 *        [--cdn-map cdn-map.json] [--checks sim.checks.js] [--shots dir]
 *
 * --cdn-map  : JSON {url: localFile} — serves vendored libs in place of CDNs
 *              (needed offline; harmless online).
 * --checks   : module exporting {boot, card(i, phase), finished, afterReset}
 *              hooks with sim-specific state assertions.
 * --shots    : directory for step screenshots (visual review).
 * Exit 0 = pass. Generic checks: page errors vs baseline, guide buttons fit
 * their boxes and don't collide, inquiry walk (gates, choices, Finish → GI
 * off), Controls Guide walk (callout visible, arrow, callout within 60px of
 * the glowing target, Done → both off, revisit), Reset → first-load.
 */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const arg = (k, d=null) => args.includes(k) ? args[args.indexOf(k)+1] : d;
const target = path.resolve(args[0]);
const baseline = arg('--baseline') && path.resolve(arg('--baseline'));
const cdnMap = arg('--cdn-map') ? JSON.parse(fs.readFileSync(arg('--cdn-map'),'utf8')) : {};
const checks = arg('--checks') ? require(path.resolve(arg('--checks'))) : {};
const shots = arg('--shots'); if(shots) fs.mkdirSync(shots, {recursive:true});
const vp = (arg('--viewport','1440x900')).split('x').map(Number);
const themeToggle = arg('--theme-toggle');       // e.g. '#shell-theme' — flips theme before the checks
const fails = []; const ok = (c,m)=>{ if(!c) fails.push(m); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function open(browser, file){
  const page = await browser.newPage({ viewport:{ width:vp[0], height:vp[1] } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));
  page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
  await page.addInitScript(() => {
    const ss = window.speechSynthesis;
    if(ss){ const sp = ss.speak.bind(ss), ca = ss.cancel.bind(ss);
      ss.speak = u => { window.__spokenCount = (window.__spokenCount||0)+1; return sp(u); };
      ss.cancel = () => { window.__speechCancelled = true; return ca(); }; }
  });
  await page.route('**/*', route => {
    const u = route.request().url();
    if(cdnMap[u]) return route.fulfill({ path: path.resolve(cdnMap[u]), contentType:'application/javascript' });
    if(/^https?:/.test(u)) return route.abort();       // offline: nothing else leaves the machine
    return route.continue();
  });
  await page.goto('file://'+file, { waitUntil:'load' });
  await sleep(1200);
  return { page, errors };
}
const shot = async (page, name) => { if(shots) await page.screenshot({ path: path.join(shots, name+'.png') }); };

(async()=>{
  const browser = await chromium.launch({ headless:true });
  let baseErrs = [];
  if(baseline){ const b = await open(browser, baseline); baseErrs = b.errors; await b.page.close(); }
  const { page, errors } = await open(browser, target);

  if(themeToggle && await page.$(themeToggle)){ await page.$eval(themeToggle, e => e.click()); await sleep(250); }  // overlay may cover it: dispatch directly
  /* ---- welcome overlay (if present): must show, attempt speech, and dismiss into a mode ---- */
  if(await page.$('#welcome-overlay')){
    ok(await page.$eval('#welcome-overlay', e=>getComputedStyle(e).display!=='none'), 'welcome: overlay shown on landing');
    ok(await page.$$eval('#welcome-overlay .welcome-mode', b=>b.length===2), 'welcome: two mode options (Simulation guide + Free exploration)');
    ok(!(await page.$('#welcome-overlay .welcome-mode[data-mode="inquiry"]')), 'welcome: no Guided Inquiry card (it lives on the header button)');
    ok(await page.evaluate(()=> (window.__spokenCount||0) > 0), 'welcome: read-aloud attempted via speechSynthesis');
    await shot(page, '00-welcome');
    // transport: forward/rewind move the line counter; pause keeps position; play resumes there
    const progress = () => page.$eval('#welcome-progress', e=>e.textContent.trim());
    await page.click('#welcome-next'); await page.click('#welcome-next'); await sleep(100);
    ok((await progress()).startsWith('3 /'), 'welcome transport: forward twice → line 3');
    await page.click('#welcome-prev'); await sleep(100);
    ok((await progress()).startsWith('2 /'), 'welcome transport: rewind → line 2');
    const label = () => page.$eval('#welcome-speak', e=>e.title);
    if(!(await label()).includes('Pause')){ await page.click('#welcome-speak'); await sleep(100); }   // ensure playing
    ok((await label()).includes('Pause'), 'welcome transport: playing shows Pause');
    await page.click('#welcome-speak'); await sleep(100);           // pause
    ok((await label()).includes('Resume'), 'welcome transport: pause shows Resume (position kept)');
    ok((await progress()).startsWith('2 /'), 'welcome transport: pause keeps the position');
    const before = await page.evaluate(()=>window.__spokenCount||0);
    await page.click('#welcome-speak'); await sleep(150);           // resume
    ok((await page.evaluate(()=>window.__spokenCount||0)) > before, 'welcome transport: resume speaks again');
    ok((await progress()).startsWith('2 /'), 'welcome transport: resume did NOT restart from line 1');
    await page.click('#welcome-overlay .welcome-mode[data-mode="free"]'); await sleep(150);
    ok(await page.$eval('#welcome-overlay', e=>getComputedStyle(e).display==='none'), 'welcome: dismissed after choosing a mode');
    if(await page.$('#btn-gi')) ok(!(await page.$eval('#btn-gi', e=>e.classList.contains('active'))), 'welcome free: Guided Inquiry off');
    ok(!(await page.$eval('#btn-cg', e=>e.classList.contains('active'))), 'welcome free: Simulation guide off');
    ok(await page.evaluate(()=> window.__speechCancelled===true), 'welcome: speech stopped when a mode was chosen');
  }
  /* ---- generic boot checks ---- */
  const gi = await page.$('#btn-gi'), cg = await page.$('#btn-cg');
  ok(!!cg, '#btn-cg present');
  for(const [name, h] of [['#btn-gi',gi],['#btn-cg',cg]]){
    if(!h) continue;
    const m = await h.evaluate(e => ({ sw:e.scrollWidth, cw:e.clientWidth, r:e.getBoundingClientRect() }));
    ok(m.sw <= m.cw + 1, `${name}: label fits inside its box (scrollWidth ${m.sw} vs clientWidth ${m.cw})`);
    ok(m.r.width > 40 && m.r.height > 20, `${name}: has a real box`);
  }
  // no overlap between guide buttons and any other top-bar button
  const rects = await page.$$eval('button', bs => bs.filter(b=>b.getBoundingClientRect().top < 80 && b.offsetParent).map(b=>{const r=b.getBoundingClientRect(); return {id:b.id, l:r.left, r:r.right, t:r.top, b:r.bottom};}));
  for(const a of rects) for(const b of rects) if(a!==b && a.id && (a.id==='btn-gi'||a.id==='btn-cg'))
    ok(!(a.l < b.r-1 && b.l < a.r-1 && a.t < b.b-1 && b.t < a.b-1), `top bar: ${a.id} does not overlap ${b.id||'a button'}`);
  // Contrast sanity for template text (both themes): text colour must not equal its own background
  const lowContrast = await page.$$eval('#btn-gi, #btn-cg, .inq-step.active h4, .inq-step.active p, .welcome-name, .wm-title, .wm-desc, .wm-tag, .wm-go, .cg-callout h5, .cg-callout p', els => els.filter(e => {
    const parse = c => { const m = (c||'').match(/[\d.]+/g); if(!m) return null; const v = m.map(Number); return { r:v[0], g:v[1], b:v[2], a: v.length > 3 ? v[3] : 1 }; };
    // composite the element's background over its ancestors (alpha-aware)
    let acc = { r:0, g:0, b:0, a:0 }, n = e;
    while(n && acc.a < 0.999){ const c = parse(getComputedStyle(n).backgroundColor); if(c && c.a > 0){ const w = c.a * (1 - acc.a); acc = { r: acc.r + c.r*w, g: acc.g + c.g*w, b: acc.b + c.b*w, a: acc.a + w }; } n = n.parentElement; }
    if(acc.a < 0.999){ const w = 1-acc.a; acc = { r: acc.r + 255*w, g: acc.g + 255*w, b: acc.b + 255*w, a: 1 }; }
    const fg = parse(getComputedStyle(e).color); if(!fg) return false;
    const lin = x => { x/=255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4); };
    const lum = c => 0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b);
    const L1 = lum(fg), L2 = lum(acc); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05) < 3;
  }).map(e => (e.id||e.className||e.tagName)+':'+e.textContent.trim().slice(0,20)));
  ok(lowContrast.length === 0, 'template text has readable contrast against its background: ' + JSON.stringify(lowContrast.slice(0,3)));
  await shot(page, '01-boot');
  if(checks.boot) await checks.boot(page, ok);

  /* ---- inquiry walk ---- */
  if(gi){
    if(!(await gi.evaluate(e=>e.classList.contains('active')))){ await gi.click(); await sleep(250); }   // after the two-mode landing GI opens from the header
    ok(await gi.evaluate(e=>e.classList.contains('active')), 'Guided Inquiry active (boot, or opened from the header button)');
    const n = await page.$$eval('#inq-cards .inq-step', cs=>cs.length);
    for(let i=0;i<n;i++){
      if(i>0){ await page.click('#inq-next'); await sleep(150); }
      ok(await page.$eval('#inq-cards .inq-step.active', (e,i)=>[...e.parentNode.children].indexOf(e)===i, i), `inquiry: card ${i+1} active`);
      if(checks.card) await checks.card(page, i, 'enter', ok);
      const gated = await page.$eval('#inq-cards .inq-step.active', e=>e.hasAttribute('data-gate') && !e.hasAttribute('data-answered'));
      if(gated){
        ok(await page.$eval('#inq-next', b=>b.disabled), `card ${i+1}: gated Next disabled`);
        await page.click('#inq-cards .inq-step.active .choice');
        await sleep(1100);
        ok(await page.$eval('#inq-cards .inq-step.active .predict-eval', e=>getComputedStyle(e).display!=='none'), `card ${i+1}: feedback shown`);
        ok(!(await page.$eval('#inq-next', b=>b.disabled)), `card ${i+1}: Next re-enabled`);
        if(checks.card) await checks.card(page, i, 'answered', ok);
      }
      if(i===1||i===5||i===n-1) await shot(page, `02-inquiry-card${i+1}`);
    }
    ok((await page.$eval('#inq-next', b=>b.textContent.trim()))==='Finish', 'last card: Finish');
    await page.click('#inq-next'); await sleep(150);
    ok(!(await gi.evaluate(e=>e.classList.contains('active'))), 'Finish: Guided Inquiry off');
    if(checks.finished) await checks.finished(page, ok);
  }

  /* ---- controls guide walk ---- */
  await cg.click(); await sleep(200);
  ok(await cg.evaluate(e=>e.classList.contains('active')), 'CG: button active');
  let step = 0;
  while(true){
    step++;
    const co = await page.$('.cg-callout');
    ok(co && await co.isVisible(), `CG step ${step}: callout visible`);
    const info = await page.evaluate(()=>{
      const c=document.querySelector('.cg-callout'), g=document.querySelector('.cg-glow'), sp=document.getElementById('cg-spot');
      const scene = !!sp && sp.style.display==='block';
      const cr=c.getBoundingClientRect(); const gr=g?g.getBoundingClientRect():null;
      const gap = gr ? Math.max(0, gr.left-cr.right, cr.left-gr.right, gr.top-cr.bottom, cr.top-gr.bottom) : null;
      return { cls:c.className, gap, inView: cr.left>=0 && cr.top>=0 && cr.right<=innerWidth && cr.bottom<=innerHeight,
               glowVisible: g ? (getComputedStyle(g).display!=='none' && getComputedStyle(g).visibility!=='hidden') : null,
               arrowShown: getComputedStyle(c.querySelector('.cg-arrow')).display!=='none',
               scene, inside: !!scene && c.classList.contains('no-arrow'),
               words: c.querySelector('p').textContent.trim().split(/\s+/).filter(w=>/[A-Za-z0-9\u00C0-\u024F\u0370-\u03FF]/.test(w)).length };
    });
    ok(info.inView, `CG step ${step}: callout inside viewport`);
    ok(info.words <= (info.scene ? 24 : 18), `CG step ${step}: text ≤${info.scene ? 24 : 18} words`);
    const done = (await page.$eval('#cg-next', b=>b.textContent.trim()))==='Done';
    if(!done && info.scene){
      ok(info.glowVisible===true, `CG scene step ${step}: spotlight visible`);
      if(!info.inside) ok(info.gap!==null && info.gap <= 60, `CG scene step ${step}: callout beside its spot (gap ${info.gap})`);
    } else if(!done){
      ok(info.glowVisible===true, `CG step ${step}: glowing target visible`);
      ok(info.gap!==null && info.gap <= 60, `CG step ${step}: callout within 60px of its target (gap ${info.gap})`);
      ok(info.arrowShown && /arrow-/.test(info.cls), `CG step ${step}: arrow shown with a side class`);
    } else {
      ok(!info.arrowShown, 'CG closing card: no arrow');
    }
    if(step===4) await shot(page, '03-cg-step4');
    if(done){ await shot(page, '04-cg-done'); break; }
    await page.click('#cg-next'); await sleep(120);
    if(step>40){ ok(false,'runaway'); break; }
  }
  await page.click('#cg-next'); await sleep(150);
  ok(!(await cg.evaluate(e=>e.classList.contains('active'))), 'CG Done: button off');
  if(gi) ok(!(await gi.evaluate(e=>e.classList.contains('active'))), 'CG Done: both off');
  ok(await page.$$eval('.cg-hidden, .cg-veiled', l=>l.length===0), 'CG Done: everything restored');
  await cg.click(); await sleep(150);
  ok((await page.$eval('#cg-next', b=>b.textContent.trim()))==='Done', 'CG revisit: closing card (session memory)');
  await cg.click(); await sleep(100);

  /* ---- Reset (mode-local: from Guided Inquiry → card 1; the guide stays off) ---- */
  const reset = await page.$('#reset-btn, #btn-reset, #shell-reset, [id*="reset" i]');
  if(reset){
    if(gi && !(await gi.evaluate(e=>e.classList.contains('active')))){ await gi.click(); await sleep(250); }
    await reset.click(); await sleep(400);
    if(gi){ ok(await gi.evaluate(e=>e.classList.contains('active')), 'Reset: Guided Inquiry on');
            ok(await page.$eval('#inq-cards .inq-step', e=>e.classList.contains('active')), 'Reset: card 1'); }
    ok(!(await cg.evaluate(e=>e.classList.contains('active'))), 'Reset: Simulation guide off');
    if(checks.afterReset) await checks.afterReset(page, ok);
    await shot(page, '05-after-reset');
  } else ok(false, 'no Reset element found');

  const newErrs = errors.filter(e=>!baseErrs.includes(e));
  ok(newErrs.length===0, 'no new browser errors: '+JSON.stringify(newErrs.slice(0,3)));
  await browser.close();
  if(fails.length){ console.log(`FAIL (${fails.length}):`); fails.forEach(f=>console.log('  ✗ '+f)); process.exit(1); }
  console.log(`PASS — real browser: ${baseErrs.length} baseline errors ignored`+(shots?`, screenshots in ${shots}`:''));
})().catch(e=>{ console.error('harness error:', e.message); process.exit(2); });
