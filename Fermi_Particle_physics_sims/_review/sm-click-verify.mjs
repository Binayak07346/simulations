import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1400);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
const det=()=>page.evaluate(()=>document.getElementById('detail-title').innerText.replace(/\s+/g,' ').trim());
const clicked=[];
for(let fy=0.10;fy<0.95;fy+=0.008){
  await page.evaluate(({fx,fy})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*fx,clientY:r.top+r.height*fy}));},{fx:0.775,fy});
  const d=await det();
  if(d && d!=='Selection' && !clicked.includes(d)) clicked.push(d);
}
console.log(JSON.stringify({ladderClicks:clicked},null,1));
await browser.close();
