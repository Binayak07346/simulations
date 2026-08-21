import { createRequire } from 'module';
const req = createRequire('/Users/admin/Desktop/simulations-1/Capacity_SR_sims_v2_engine/_review/node_modules/x.js');
const puppeteer = req('puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox','--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file:///Users/admin/Desktop/simulations-1/Fermi_Particle_physics_sims/Wu_exp.html', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: '_review/probe-out/wu-sideplot-initial.png' });
// toggle mirror view if not default: find the mirror checkbox/button
const mirrorState = await page.evaluate(() => {
  const els = [...document.querySelectorAll('button,input[type=checkbox],label')];
  const el = els.find(e => /mirror/i.test(e.textContent || e.id || (e.labels?.[0]?.textContent ?? '')));
  return { found: !!el, tag: el?.tagName, id: el?.id, text: (el?.textContent||'').trim().slice(0,40), showMirror: window.state?.showMirror };
});
console.log('mirror control:', JSON.stringify(mirrorState));
// flip showMirror to capture the OTHER view too
await page.evaluate(() => {
  const els = [...document.querySelectorAll('button,input[type=checkbox]')];
  const el = els.find(e => /mirror/i.test(e.textContent || e.id || (e.labels?.[0]?.textContent ?? '')));
  if (el) el.click();
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: '_review/probe-out/wu-sideplot-toggled.png' });
// narrow width check
await page.setViewport({ width: 1100, height: 800 });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: '_review/probe-out/wu-sideplot-1100.png' });
console.log('errors:', errors.length, errors.slice(0,3));
await browser.close();
