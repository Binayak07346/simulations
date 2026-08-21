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
const setB=v=>page.evaluate(v=>{const el=document.getElementById('b');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},v);
// incoming-track screen height: find orange pixels at the LEFT third of canvas, take their y
const trackY = () => page.evaluate(()=>{
  const c=document.getElementById('stage'); const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  const W=c.width,H=c.height; const xs=Math.floor(W*0.25), xe=Math.floor(W*0.35);
  let sy=0,n=0;
  for(let y=0;y<H;y++)for(let x=xs;x<xe;x+=2){
    const k=(y*W+x)*4;
    if(img[k]>200&&img[k+1]>120&&img[k+1]<190&&img[k+2]<70){sy+=y;n++;}
  }
  return n? sy/n/(window.devicePixelRatio||1) : null;
});
const R={plum:{},nuclear:{}};
await page.evaluate(()=>document.querySelector('[data-model="thomson"]').click()); await sleep(200);
for(const b of [0,50,100,114,150,200,300,400,500]){ await setB(b); await sleep(200); R.plum['b'+b]=Math.round(await trackY()); }
await page.evaluate(()=>document.querySelector('[data-model="nuclear"]').click()); await sleep(200);
for(const b of [50,100,150,300,500]){ await setB(b); await sleep(250); R.nuclear['b'+b]=Math.round(await trackY()); }
// edge containment + arc contact at b=500 and b=150 nuclear
const edge = () => page.evaluate(()=>{
  const c=document.getElementById('stage'); const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  const W=c.width,H=c.height; const bg=[img[0],img[1],img[2]];
  const diff=k=>Math.abs(img[k]-bg[0])+Math.abs(img[k+1]-bg[1])+Math.abs(img[k+2]-bg[2])>28;
  let hits=0;
  for(let x=0;x<W;x+=2){ for(const y of [0,1,2,H-3,H-2,H-1]) if(diff((y*W+x)*4)) {hits++;break;} }
  for(let y=0;y<H;y+=2){ for(const x of [0,1,2,W-3,W-2,W-1]) if(diff((y*W+x)*4)) {hits++;break;} }
  return hits;
});
await setB(500); await sleep(250); R.edgeHitsB500 = await edge();
R.thetaB500 = await page.evaluate(()=>document.getElementById('theta-single').textContent);
await page.screenshot({path:join(HERE,'gf-out/16-fixed-scale-b500.png')});
await setB(150); await sleep(250);
await page.screenshot({path:join(HERE,'gf-out/17-fixed-scale-b150.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
