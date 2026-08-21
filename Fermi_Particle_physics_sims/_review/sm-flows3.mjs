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
const R={terms:{}};
const detail=()=>page.evaluate(()=>document.getElementById('detail-panel').innerText.replace(/\s+/g,' ').slice(0,240));
const clickAt=(fx,fy)=>page.evaluate(({fx,fy})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*fx,clientY:r.top+r.height*fy}));},{fx,fy});
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(500);
for(let fx=0.22;fx<0.9;fx+=0.02){
  await clickAt(fx,0.36);
  const d=await detail();
  const m=d.match(/▾ ?([A-Z][^.]{5,40})/);
  if(d.includes('GAUGE')||d.includes('FERMION')||d.includes('YUKAWA')||d.includes('HIGGS KINETIC')){
    const key=d.slice(11,40);
    if(!R.terms[key]) R.terms[key]=d.slice(0,220);
  }
  if(Object.keys(R.terms).length>=4) break;
}
R.termCount=Object.keys(R.terms).length;
await page.screenshot({path:join(HERE,'sm-out/10-term-expanded.png')});
// hover-select check
await page.evaluate(()=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:r.left+r.width*0.30,clientY:r.top+r.height*0.36}));});
await sleep(250);
R.hoverSelect=(await detail()).slice(0,60);
// term memory across mode round trip
await page.evaluate(()=>document.getElementById('mode-table').click()); await sleep(250);
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(250);
R.termMemory=(await detail()).slice(0,60);
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
