// Measure the nuclear histogram bars using the sim's exact layout math.
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Gold_foil_exp_v3.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1000);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
await page.evaluate(()=>document.querySelector('[data-model="nuclear"]').click());
await page.evaluate(()=>document.querySelector('[data-mode="beam"]').click());
await page.evaluate(()=>{ if(document.getElementById('shell-play').textContent.includes('Play')) document.getElementById('shell-play').click(); });
await page.evaluate(()=>{const s=document.getElementById('shell-speed'); if(s){s.value='4'; s.dispatchEvent(new Event('change',{bubbles:true}));}});
await sleep(25000); // ~12k samples
const out = await page.evaluate(()=>{
  const c=document.getElementById('stage'); const ctx=c.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  const r=c.getBoundingClientRect(); const w=r.width,h=r.height;
  // replicate computeLayout exactly
  const labelPad=18,labelHW=18,labelHH=8,srcW=60,foilLabelBelow=20,bottomCaption=20,tickOverhang=8;
  const marginX=labelPad+labelHW+tickOverhang, marginY=labelPad+labelHH+tickOverhang;
  const barGlow=18;
  const RmaxwL=(w-srcW-marginX-4)/2.35, RmaxwB=(w-srcW-barGlow-4)/2.63;
  const RmaxhL=(h-marginY-bottomCaption-4)/2, RmaxhB=(h-barGlow-bottomCaption-4)/2.28;
  const R=Math.max(20,Math.min(RmaxwL,RmaxwB,RmaxhL,RmaxhB));
  const extX=Math.max(marginX,R*0.28+barGlow), extTop=Math.max(marginY,R*0.28+barGlow);
  const cx=w/2-(extX-R*0.35-srcW)/2;
  const cy=h/2+(extTop-bottomCaption)/2;
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  const isBar=(x,y)=>{ // sample device px
    const X=Math.round(x*dpr), Y=Math.round(y*dpr);
    const k=(Y*c.width+X)*4;
    return img[k]>55&&img[k]>img[k+2]+30&&img[k+1]>img[k+2]+18; // amber at any bar alpha (>=0.25)
  };
  const bars={};
  for(let bin=0;bin<10;bin++){
    const deg=5+(bin+0.5)*5;
    const th=deg*Math.PI/180;
    // walk outward from ring radius R to R*1.35 along the spoke
    let len=0;
    for(let rr=R+2; rr<R*1.4; rr+=1){
      const x=cx+Math.cos(th)*rr, y=cy-Math.sin(th)*rr;
      if(isBar(x,y)) len=rr-R;
    }
    bars[deg]=len;
  }
  const hits=document.getElementById('n-hits').textContent;
  return {bars,R:Math.round(R),hits};
});
// expected ratios from sin(th)*sigma(th)
const sig=(d)=>Math.sin(d*Math.PI/180)/Math.pow(Math.sin(d/2*Math.PI/180),4);
const e1=sig(7.5);
const expct={};
for(const d of [7.5,12.5,17.5,22.5,27.5]) expct[d]=+(sig(d)/e1).toFixed(3);
console.log(JSON.stringify({...out, expectedRel:expct},null,1));
await browser.close();
