import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,1400));
await page.evaluate(()=>document.getElementById('shell-lecture').click());
await new Promise(r=>setTimeout(r,500));
const cv = await page.evaluate(()=>{const r=document.getElementById('main-canvas').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
await page.screenshot({path:join(HERE,'sm-out/16-band-fixed.png'), clip:{x:cv.x+cv.w*0.62, y:cv.y+cv.h*0.78, width:cv.w*0.38+20, height:cv.h*0.22+10}});
// band markers still clickable
const det=()=>page.evaluate(()=>document.getElementById('detail-title').innerText.replace(/\s+/g,' ').trim());
const hits=[];
for(const fx of [0.745,0.775,0.805]){
  for(const fy of [0.930,0.952]){
    await page.evaluate(({fx,fy})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*fx,clientY:r.top+r.height*fy}));},{fx,fy});
    const d=await det();
    if(d && d!=='Selection' && !hits.includes(d)) hits.push(d);
  }
}
console.log(JSON.stringify({bandClicks:hits, jsErrors:errors},null,1));
await browser.close();
