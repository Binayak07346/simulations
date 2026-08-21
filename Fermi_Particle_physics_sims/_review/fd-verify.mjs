import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1100,height:800});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Feynmann_diagram_sandbox.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const R={};
const pal=l=>page.evaluate(l=>{[...document.querySelectorAll('#palette-tray .palette-item')].find(b=>b.textContent===l)?.click();},l);
const refused=()=>page.evaluate(()=>document.getElementById('refusal').innerText.replace(/\s+/g,' ').slice(0,140));
// NP-P2-2: 3 fermions with unbalanced Q → structure first now
for(const l of ['e⁻','e⁺','μ⁻']){ await pal(l); await sleep(120); }
R.threeFermions = await refused();
// Q-balanced trio d̄ u e⁻ (Q=0, L=1) → structure must still come first
await page.evaluate(()=>document.getElementById('btn-clear-slots').click()); await sleep(100);
for(const l of ['d̄','u','e⁻']){ await pal(l); await sleep(120); }
R.qBalancedTrio = await refused();
// regression: normal refusals unchanged (charge-fail preset)
await page.evaluate(()=>{[...document.querySelectorAll('#preset-list button')].find(b=>b.textContent.startsWith('e⁻ · e⁻ · γ'))?.click();}); await sleep(200);
R.chargeFail = await refused();
// regression: allowed preset + engine validateVertex direct
R.engineCheck = await page.evaluate(()=>{
  const v = Engine.feyn.validateVertex('electromagnetic',[
    {kind:'fermion',charge:-1,flavour:'electron'},
    {kind:'fermion',charge:+1,flavour:'electron',antiparticle:true},
    {kind:'boson',charge:0,flavour:'photon'}]);
  return { allowed: v.allowed, n: v.violations.length };
});
// NP-P2-1: caption gone from canvas — screenshot bottom strip
await page.evaluate(()=>{[...document.querySelectorAll('#preset-list button')].find(b=>b.textContent.startsWith('e⁻e⁻'))?.click();}); await sleep(300);
await page.screenshot({path:join(HERE,'fd-out/09-fixed-caption-narrow.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
