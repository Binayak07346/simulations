import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1400);
const R={};
const detail=()=>page.evaluate(()=>document.getElementById('detail-panel').innerText.replace(/\s+/g,' ').slice(0,300));
const clickAt=(fx,fy)=>page.evaluate(({fx,fy})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*fx,clientY:r.top+r.height*fy}));},{fx,fy});
// Higgs tile: scan bottom-right region of the table for it
for(let fx=0.55;fx<0.95;fx+=0.06){ for(let fy=0.55;fy<0.9;fy+=0.08){
  await clickAt(fx,fy); const d=await detail();
  if(/HIGGS/.test(d)){ R.higgs=d.slice(0,220); R.higgsAt=[fx.toFixed(2),fy.toFixed(2)]; break; }
} if(R.higgs) break; }
// Lagrangian terms
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(500);
R.terms={};
for(const fx of [0.30,0.42,0.575,0.755]){
  await clickAt(fx,0.41); await sleep(250);
  const d=await detail();
  R.terms[fx]=d.slice(0,200);
}
await page.screenshot({path:join(HERE,'sm-out/07-term-expanded.png')});
// term selection memory across mode round trip
await page.evaluate(()=>document.getElementById('mode-table').click()); await sleep(250);
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(250);
R.termMemory=(await detail()).slice(0,80);
// light theme visual
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(400);
await page.screenshot({path:join(HERE,'sm-out/08-light-lagr.png')});
await page.evaluate(()=>document.getElementById('mode-table').click()); await sleep(300);
await page.screenshot({path:join(HERE,'sm-out/09-light-table.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
