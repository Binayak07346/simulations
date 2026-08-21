import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
for(const [w,h,tag] of [[1440,900,'wide'],[1100,800,'narrow']]){
  await page.setViewport({width:w,height:h});
  await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
  await new Promise(r=>setTimeout(r,1400));
  await page.evaluate(()=>document.getElementById('shell-lecture').click());
  await new Promise(r=>setTimeout(r,500));
  const cv = await page.evaluate(()=>{const r=document.getElementById('main-canvas').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
  await page.screenshot({path:join(HERE,`sm-out/17-band-compact-${tag}.png`), clip:{x:cv.x+cv.w*0.60, y:cv.y, width:cv.w*0.40+30, height:cv.h+10}});
}
// clickability of the inline band markers (wide)
const det=()=>page.evaluate(()=>document.getElementById('detail-title').innerText.replace(/\s+/g,' ').trim());
await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,1400));
await page.evaluate(()=>document.getElementById('shell-lecture').click());
await new Promise(r=>setTimeout(r,500));
const hits=[];
for(let fx=0.72;fx<0.95;fx+=0.012){
  await page.evaluate(({fx})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();
    // band row sits ~30px above canvas bottom-ish: sweep two candidate ys
    for(const fy of [0.955,0.965,0.945]) c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*fx,clientY:r.top+r.height*fy}));},{fx});
  const d=await det();
  if(d && d!=='Selection' && !hits.includes(d)) hits.push(d);
}
console.log(JSON.stringify({bandClicks:hits, jsErrors:errors},null,1));
await browser.close();
