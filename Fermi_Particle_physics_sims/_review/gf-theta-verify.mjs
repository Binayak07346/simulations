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
const row=()=>page.evaluate(()=>({label:document.getElementById('theta-single-label').textContent, value:document.getElementById('theta-single').textContent}));
const R={};
await page.evaluate(()=>document.querySelector('[data-model="thomson"]').click()); await sleep(300);
R.plum = await row();
await page.screenshot({path:join(HERE,'gf-out/13-theta-plum.png')});
// b slider in plum mode: bound must not change (b-independent)
await page.evaluate(()=>{const el=document.getElementById('b');el.value=300;el.dispatchEvent(new Event('input',{bubbles:true}));}); await sleep(200);
R.plumB300 = await row();
// nuclear regression
await page.evaluate(()=>document.querySelector('[data-model="nuclear"]').click()); await sleep(300);
R.nuclear = await row();
// round trip back to plum
await page.evaluate(()=>document.querySelector('[data-model="thomson"]').click()); await sleep(300);
R.plumAgain = await row();
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
