import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Gold_foil_exp_v3.html')).href,{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,900));
await page.evaluate(()=>document.getElementById('shell-lecture').click());
await new Promise(r=>setTimeout(r,300));
const R = await page.evaluate(()=>{
  const b=document.querySelector('[data-model="nuclear"]');
  b.click();
  return { label: b.textContent.trim(), active: b.classList.contains('active'),
           caption: document.getElementById('mode-caption').textContent };
});
await page.screenshot({path:join(HERE,'gf-out/15-renamed-btn.png'), clip:{x:1150,y:160,width:280,height:120}});
console.log(JSON.stringify({R, jsErrors:errors}));
await browser.close();
