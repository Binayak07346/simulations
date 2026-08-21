import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Scale_of_universe.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const titleContrast = () => page.evaluate(()=>{
  const t=document.querySelector('.plot-title');
  const c=getComputedStyle(t).color;
  return c;
});
const R={};
R.darkTitle = await titleContrast();
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(400);
R.lightTitle = await titleContrast();
await page.screenshot({path:join(HERE,'su-out/06-light-fixed.png')});
// regression: audit + coupling still exact after edits
R.audit = await page.evaluate(()=>({atomKeV: window.__audit.at({logL:-10}).probeEnergyEV/1e3, inv: window.__audit.invariants.lambdaMomentumProduct().ok}));
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
