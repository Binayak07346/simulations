import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage();
const R={}; const errors=[]; page.on('pageerror',e=>errors.push(e.message));
for(const [w,h,tag] of [[1440,900,'wide'],[1100,800,'narrow']]){
  await page.setViewport({width:w,height:h});
  await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
  await new Promise(r=>setTimeout(r,1400));
  await page.evaluate(()=>document.getElementById('shell-lecture').click());
  await new Promise(r=>setTimeout(r,500));
  R[tag] = await page.evaluate(()=>{
    const l=document.getElementById('legend').getBoundingClientRect();
    const t=document.querySelector('.plot-title').getBoundingClientRect();
    const c=document.getElementById('main-canvas').getBoundingClientRect();
    const ox=Math.min(t.right,l.left); // gap>0 means no title/legend collision
    return { legendBottomInCanvas: Math.round(l.bottom-c.top), titleLegendGap: Math.round(l.left-t.right) };
  });
  const cv = await page.evaluate(()=>{const r=document.getElementById('main-canvas').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
  await page.screenshot({path:join(HERE,`sm-out/15-legend-up-${tag}.png`), clip:{x:cv.x+cv.w*0.60, y:cv.y-40, width:cv.w*0.40+30, height:cv.h+50}});
}
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
