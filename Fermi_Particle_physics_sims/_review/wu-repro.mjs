import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Wu_exp.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
const R={};
// fire on + mirror on
await page.evaluate(()=>document.getElementById('fire-btn').click());
await page.evaluate(()=>document.getElementById('mirror-btn').click());
await sleep(3000);
R.before = await page.evaluate(()=>({fire:document.getElementById('fire-btn').textContent.trim(), mirror:document.getElementById('mirror-btn').textContent.trim(), up:+document.getElementById('N-up').textContent, dn:+document.getElementById('N-down').textContent}));
// move B slider one tick
await page.evaluate(()=>{const el=document.getElementById('B');el.value=4.5;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
await sleep(2500);
R.afterSlider = await page.evaluate(()=>({fire:document.getElementById('fire-btn').textContent.trim(), mirror:document.getElementById('mirror-btn').textContent.trim(), up:+document.getElementById('N-up').textContent, dn:+document.getElementById('N-down').textContent, B:document.getElementById('B-val').textContent}));
console.log(JSON.stringify(R,null,1));
await browser.close();
