import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1600);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
const R={};
// enter Lagrangian mode
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(600);
R.overlay = await page.evaluate(()=>{
  const host=document.getElementById('lagr-eq');
  return { shown: host.classList.contains('show'), chips: host.querySelectorAll('.lagr-term').length,
           katexRendered: host.querySelectorAll('.katex').length,
           text: host.innerText.replace(/\s+/g,' ').slice(0,80) };
});
await page.screenshot({path:join(HERE,'sm-out/22-lagr-katex.png')});
// click each chip, verify selection + detail + tray clearance
R.chips={};
for(const id of ['gauge-kinetic','fermion-kinetic','yukawa','higgs']){
  await page.evaluate(id=>{document.querySelector(`.lagr-term[data-term="${id}"]`).click();},id); await sleep(300);
  R.chips[id] = await page.evaluate(id=>({
    selected: document.querySelector(`.lagr-term[data-term="${id}"]`).classList.contains('selected'),
    detail: document.getElementById('detail-title').innerText.trim().slice(0,40),
  }),id);
}
await page.screenshot({path:join(HERE,'sm-out/23-lagr-selected.png')});
// mode round trip: term memory + overlay hides in table
await page.evaluate(()=>document.getElementById('mode-table').click()); await sleep(300);
R.tableHidesOverlay = await page.evaluate(()=>!document.getElementById('lagr-eq').classList.contains('show'));
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(300);
R.termMemory = await page.evaluate(()=>document.querySelector('.lagr-term.selected')?.dataset.term);
// reset hides overlay + table mode
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(400);
R.afterReset = await page.evaluate(()=>({overlayHidden:!document.getElementById('lagr-eq').classList.contains('show'), mode:document.getElementById('mode-table').classList.contains('active')}));
// narrow wrap behavior + light theme
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(300);
await page.setViewport({width:1100,height:800}); await sleep(600);
await page.screenshot({path:join(HERE,'sm-out/24-lagr-narrow.png')});
R.overflowNarrow = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(400);
await page.screenshot({path:join(HERE,'sm-out/25-lagr-light.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
