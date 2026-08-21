import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1400);
// contrast metric: sample the darkest pixel inside the first tile's symbol area in light theme
const glyphContrast = () => page.evaluate(()=>{
  const c=document.getElementById('main-canvas'); const x=c.getContext('2d');
  const dpr=window.devicePixelRatio||1; const r=c.getBoundingClientRect();
  // first tile roughly at 3-14% width, 10-30% height (symbol center ~ y 0.42 of tile)
  const img=x.getImageData(Math.round(r.width*0.05*dpr),Math.round(r.height*0.14*dpr),Math.round(r.width*0.08*dpr),Math.round(r.height*0.16*dpr));
  let minLum=999,maxLum=-1;
  for(let i=0;i<img.data.length;i+=4){
    if(img.data[i+3]<10)continue;
    const l=0.2126*img.data[i]+0.7152*img.data[i+1]+0.0722*img.data[i+2];
    if(l<minLum)minLum=l; if(l>maxLum)maxLum=l;
  }
  return {minLum:Math.round(minLum),maxLum:Math.round(maxLum)};
});
const R={};
R.dark = await glyphContrast();
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(500);
R.light = await glyphContrast();
await page.screenshot({path:join(HERE,'sm-out/11-light-fixed.png')});
// regression: dark theme + detail values intact
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(400);
await page.screenshot({path:join(HERE,'sm-out/12-dark-regression.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
