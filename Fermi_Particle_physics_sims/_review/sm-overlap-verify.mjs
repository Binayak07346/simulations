import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const R={};
for(const [w,h,tag] of [[1440,900,'wide'],[1150,850,'narrow-wrap']]){
  await page.setViewport({width:w,height:h});
  await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
  await new Promise(r=>setTimeout(r,1400));
  await page.evaluate(()=>document.getElementById('shell-lecture').click());
  await new Promise(r=>setTimeout(r,500));
  // legend rows + ladder header clearance
  R[tag] = await page.evaluate(()=>{
    const l=document.getElementById('legend').getBoundingClientRect();
    const c=document.getElementById('main-canvas').getBoundingClientRect();
    return { legendRows: Math.round(l.height/30)>1?2:1, legendBottomInCanvas: Math.round(l.bottom-c.top), legendH: Math.round(l.height) };
  });
  // full + zoomed screenshots of the ladder region
  await page.screenshot({path:join(HERE,`sm-out/13-overlap-${tag}.png`)});
  const cv = await page.evaluate(()=>{const r=document.getElementById('main-canvas').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
  await page.screenshot({path:join(HERE,`sm-out/14-ladder-${tag}.png`), clip:{x:cv.x+cv.w*0.62, y:cv.y, width:cv.w*0.38+20, height:cv.h}});
  // click the displaced W- label region: find via hit test — click ladder area near the cluster labels
  if(tag==='wide'){
    // click t dot then W- label (displaced): sweep small y range at label column x
    const det=()=>page.evaluate(()=>document.getElementById('detail-title').innerText.trim());
    const clicked=[];
    for(let fy=0.10;fy<0.40;fy+=0.012){
      await page.evaluate(({fx,fy})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*fx,clientY:r.top+r.height*fy}));},{fx:0.71,fy});
      const d=await det();
      if(d && !clicked.includes(d) && d!=='Selection') clicked.push(d);
    }
    R.ladderClicks = clicked;
  }
}
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
