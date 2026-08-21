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
await page.evaluate(()=>document.querySelector('[data-model="nuclear"]').click());
await page.evaluate(()=>document.querySelector('[data-mode="single"]').click()); await sleep(200);
const set=(id,v)=>page.evaluate(({id,v})=>{const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},{id,v});
// gap measurement: nearest distance between the arc's END point pixels (green) and the orange track
const gap = () => page.evaluate(()=>{
  const c=document.getElementById('stage'); const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  const W=c.width,H=c.height;
  const green=[],orange=[];
  for(let y=0;y<H;y+=1)for(let x=0;x<W;x+=1){
    const k=(y*W+x)*4;
    if(img[k]<110&&img[k+1]>170&&img[k+2]>110&&img[k+2]<200) green.push([x,y]);
    else if(img[k]>200&&img[k+1]>120&&img[k+1]<190&&img[k+2]<70) orange.push([x,y]);
  }
  if(!green.length||!orange.length) return {green:green.length,orange:orange.length,gap:null};
  // for each green pixel find min distance to orange; report the MIN over green ENDS:
  // approximate: overall min distance green->orange (the arc end should touch the track)
  let best=1e9;
  for(const g of green){ for(let i=0;i<orange.length;i+=3){ const o=orange[i];
    const d=(g[0]-o[0])**2+(g[1]-o[1])**2; if(d<best)best=d; } }
  return {green:green.length, orange:orange.length, gapPx: Math.sqrt(best)/ (window.devicePixelRatio||1)};
});
const R={};
for(const [ke,b,tag] of [[10,50,'b50ke10'],[7.7,100,'b100'],[7.7,0,'headon'],[7.7,15,'b15-large-angle']]){
  await set('ke',ke); await set('b',b); await sleep(700);
  R[tag] = { theta: await page.evaluate(()=>document.getElementById('theta-single').textContent), ...(await gap()) };
  await page.screenshot({path:join(HERE,`gf-out/12-arc-${tag}.png`)});
}
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
