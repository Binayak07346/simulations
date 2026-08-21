import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Build_Baryon.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(900);
const btn=s=>page.evaluate(s=>document.querySelector(s)?.click(),s);
const disc=q=>page.evaluate(q=>document.querySelector(`.quark-disc[data-q="${q}"]`)?.click(),q);
// formal mode with a busy verdict
for(const q of ['s','s','s']){await disc(q);}
await btn('#spin-high'); await sleep(150); await btn('#identify-btn'); await sleep(250);
await btn('#toggle-formal'); await sleep(600);
await page.screenshot({path:join(HERE,'flow-out/15-formal-omega.png')});
const eqs = await page.evaluate(()=>['eq1','eq2','eq3','eq4'].map(id=>{const el=document.getElementById(id);return el?(el.textContent||'').slice(0,40):null;}));
// narrow widths
await page.setViewport({width:1100,height:800}); await sleep(500);
await page.screenshot({path:join(HERE,'flow-out/16-narrow-1100.png')});
const overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth+2);
await page.setViewport({width:1280,height:800}); await sleep(500);
await page.screenshot({path:join(HERE,'flow-out/17-narrow-1280.png')});
console.log(JSON.stringify({eqs, overflow1100}));
await browser.close();
