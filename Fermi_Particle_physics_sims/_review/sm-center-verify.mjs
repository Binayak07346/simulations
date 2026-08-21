import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1600);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(400);
await page.evaluate(()=>document.querySelector('.lagr-term[data-term="yukawa"]').click()); await sleep(400);
const R = await page.evaluate(()=>{
  const c=document.getElementById('main-canvas').getBoundingClientRect();
  const eq=document.getElementById('lagr-eq').getBoundingClientRect();
  const tray=document.getElementById('lagr-tray').getBoundingClientRect();
  const groupTop=eq.top, groupBot=tray.bottom;
  const mid=(groupTop+groupBot)/2, cmid=(c.top+96+c.bottom-24)/2;
  return { centeredOffsetPx: Math.round(mid-cmid), eqH: Math.round(eq.height), chipFont: getComputedStyle(document.querySelector('.lagr-term')).fontSize, eqWraps: eq.height>70 };
});
await page.screenshot({path:join(HERE,'sm-out/29-centered-large.png')});
// narrow: wrap + still centered, no overflow
await page.setViewport({width:1100,height:800}); await sleep(600);
const R2 = await page.evaluate(()=>({wrapH: Math.round(document.getElementById('lagr-eq').getBoundingClientRect().height), overflow: document.documentElement.scrollWidth>window.innerWidth+2}));
await page.screenshot({path:join(HERE,'sm-out/30-centered-narrow.png')});
console.log(JSON.stringify({R,R2,jsErrors:errors},null,1));
await browser.close();
