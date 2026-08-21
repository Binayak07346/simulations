import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Gold_foil_exp_v3.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(900);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
await page.evaluate(()=>document.querySelector('[data-mode="single"]').click());
await page.evaluate(()=>document.querySelector('[data-model="thomson"]').click()); await sleep(200);
// check overlap: scan green text pixels vs orange track pixels for min distance
const overlap = () => page.evaluate(()=>{
  const c=document.getElementById('stage'); const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  const W=c.width,H=c.height; const green=[],orange=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const k=(y*W+x)*4;
    if(img[k]<140&&img[k+1]>190&&img[k+2]>140&&img[k+2]<210) green.push([x,y]);
    else if(img[k]>200&&img[k+1]>120&&img[k+1]<190&&img[k+2]<70) orange.push([x,y]);
  }
  let minD=1e9;
  for(const g of green){ for(let i=0;i<orange.length;i+=4){ const o=orange[i];
    const d=(g[0]-o[0])**2+(g[1]-o[1])**2; if(d<minD)minD=d; } }
  return {green:green.length, minGapPx: Math.sqrt(minD)/(window.devicePixelRatio||1)};
});
const R={};
for(const b of [10, 50, 91, 300, 500]){
  await page.evaluate(v=>{const el=document.getElementById('b');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},b);
  await sleep(250);
  R['b'+b] = await overlap();
}
await page.screenshot({path:join(HERE,'gf-out/14-thomson-label-fixed.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
