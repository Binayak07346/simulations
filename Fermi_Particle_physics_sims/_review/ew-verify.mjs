import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Eigenfold_way_v2.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const R={};
// card 6 text updated?
R.card6 = await page.evaluate(()=>[...document.querySelectorAll('#inq-cards .inq-step')][5]?.innerText.replace(/\s+/g,' ').slice(0,320));
// light theme + decuplet ghost
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.evaluate(()=>document.querySelector('[data-mult="decuplet"]').click()); await sleep(500);
await page.screenshot({path:join(HERE,'ew-out/10-light-ghost-fixed.png')});
// reveal in light theme
await page.evaluate(()=>document.getElementById('btn-reveal').click()); await sleep(400);
await page.screenshot({path:join(HERE,'ew-out/11-light-revealed-fixed.png')});
// dark theme regression
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(300);
await page.evaluate(()=>document.querySelector('[data-mult="decuplet"]').click()); await sleep(400);
await page.screenshot({path:join(HERE,'ew-out/12-dark-ghost-regression.png')});
// invariants + full tile sweep regression
R.inv = await page.evaluate(()=>window.__audit.invariants.gridChargeMatchesQuarkCharge());
R.omega = await page.evaluate(()=>{document.getElementById('btn-reveal').click(); return document.getElementById('detail').innerText.replace(/\s+/g,' ').slice(0,120);});
R.jsErrors = errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
