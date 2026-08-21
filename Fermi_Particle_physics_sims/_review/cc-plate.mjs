import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Charged_particle_in_a_magnetic_field_v2.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1000);
// plate on, e- 8 MeV, let the track draw to its full 4pi arc
await page.evaluate(()=>{const p=document.getElementById('lead-plate'); if(!p.checked)p.click();});
await page.evaluate(()=>{const el=document.getElementById('ke');el.value=8;el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(12000);
await page.screenshot({path:join(HERE,'cc-out/13-plate-full-arc.png')});
// count amber pixels above vs below plate line to show re-crossing
const res = await page.evaluate(()=>{
  const c=document.getElementById('chamber'); const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  const dpr=window.devicePixelRatio||1;
  // plate world y=0.028; recompute screen y from canvas box
  const r=c.getBoundingClientRect();
  const marginX=24, marginTop=32, scale=(r.width-48)/0.15;
  const plateY=(marginTop+0.028*scale)*dpr;
  let above=0,below=0;
  for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2){
    const k=(y*c.width+x)*4;
    if(Math.abs(img[k]-251)<28&&Math.abs(img[k+1]-191)<32&&Math.abs(img[k+2]-36)<40){ if(y<plateY)above++; else below++; }
  }
  return {above, below, plateY};
});
console.log(JSON.stringify(res));
await browser.close();
