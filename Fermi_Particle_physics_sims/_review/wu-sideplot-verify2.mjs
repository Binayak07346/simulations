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
await new Promise(r => setTimeout(r, 1000));
const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(e => /show mirror/i.test(e.textContent));
  if (b) { b.click(); return b.textContent.trim(); }
  return null;
});
console.log('clicked:', clicked);
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: '_review/probe-out/wu-sideplot-mirror.png' });
await page.setViewport({ width: 1100, height: 800 });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: '_review/probe-out/wu-sideplot-mirror-1100.png' });
console.log('errors:', errors.length, errors.slice(0,3));
await browser.close();
