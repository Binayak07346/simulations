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
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(500);
const cv = await page.evaluate(()=>{const r=document.getElementById('main-canvas').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
// zooms on the two former collision sites
await page.screenshot({path:join(HERE,'sm-out/18-cluster-100gev.png'), clip:{x:cv.x+cv.w*0.70, y:cv.y+cv.h*0.10, width:cv.w*0.22, height:cv.h*0.22}});
await page.screenshot({path:join(HERE,'sm-out/19-cluster-mus.png'), clip:{x:cv.x+cv.w*0.70, y:cv.y+cv.h*0.42, width:cv.w*0.22, height:cv.h*0.16}});
// click sweep down the label column
const det=()=>page.evaluate(()=>document.getElementById('detail-title').innerText.replace(/\s+/g,' ').trim());
const hits=[];
for(let fy=0.08;fy<0.90;fy+=0.006){
  await page.evaluate(({fy})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*0.782,clientY:r.top+r.height*fy}));},{fy});
  const d=await det();
  if(d && d!=='Selection' && !hits.includes(d)) hits.push(d);
}
console.log(JSON.stringify({labelClicks:hits, jsErrors:errors},null,1));
await browser.close();
