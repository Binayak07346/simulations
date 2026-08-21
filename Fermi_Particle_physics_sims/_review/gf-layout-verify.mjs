import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const R={};
for(const [w,h,tag] of [[1440,900,'1440x900'],[2440,1426,'wide'],[1600,760,'short-wide'],[1100,800,'narrow']]){
  await page.setViewport({width:w,height:h});
  await page.goto(pathToFileURL(resolve(HERE,'../Gold_foil_exp_v3.html')).href,{waitUntil:'networkidle2'});
  await sleep(900);
  await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
  await page.evaluate(()=>document.querySelector('[data-model="nuclear"]').click());
  await page.evaluate(()=>{ if(document.getElementById('shell-play').textContent.includes('Play')) document.getElementById('shell-play').click(); });
  await page.evaluate(()=>{const s=document.getElementById('shell-speed'); if(s){s.value='4'; s.dispatchEvent(new Event('change',{bubbles:true}));}});
  await sleep(6000);
  R[tag] = await page.evaluate(()=>{
    const c=document.getElementById('stage'); const ctx=c.getContext('2d');
    const img=ctx.getImageData(0,0,c.width,c.height).data;
    const W=c.width,H=c.height;
    // background color varies with theme; sample corner pixel as bg
    const bg=[img[0],img[1],img[2]];
    const differs=k=>Math.abs(img[k]-bg[0])+Math.abs(img[k+1]-bg[1])+Math.abs(img[k+2]-bg[2])>28;
    let edgeHits={top:0,bottom:0,left:0,right:0};
    const M=3; // px band at each edge (device px)
    for(let x=0;x<W;x+=2){ for(let y=0;y<M;y++){ if(differs((y*W+x)*4)) {edgeHits.top++;break;} }
      for(let y=H-M;y<H;y++){ if(differs((y*W+x)*4)) {edgeHits.bottom++;break;} } }
    for(let y=0;y<H;y+=2){ for(let x=0;x<M;x++){ if(differs((y*W+x)*4)) {edgeHits.left++;break;} }
      for(let x=W-M;x<W;x++){ if(differs((y*W+x)*4)) {edgeHits.right++;break;} } }
    // exclude the bottom-left caption text (drawn at 12,h-14 deliberately)
    return {edgeHits, W, H};
  });
  await page.screenshot({path:join(HERE,`gf-out/11-layout-${tag}.png`)});
}
console.log(JSON.stringify(R,null,1));
await browser.close();
