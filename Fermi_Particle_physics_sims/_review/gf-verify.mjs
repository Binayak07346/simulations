import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Gold_foil_exp_v3.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1000);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
await page.evaluate(()=>document.querySelector('[data-model="nuclear"]').click());
await page.evaluate(()=>{ if(document.getElementById('shell-play').textContent.includes('Play')) document.getElementById('shell-play').click(); });
await sleep(3000);
const R = await page.evaluate(()=>{
  const oneLine = id => { const el=document.getElementById(id); const r=el.getBoundingClientRect();
    const lh=parseFloat(getComputedStyle(el).lineHeight)||20; return {text:el.textContent, singleLine: r.height < lh*1.6}; };
  return {
    rmin: oneLine('r-min'), thThom: oneLine('theta-thomson'), dsig: oneLine('dsig-90'),
    hits: document.getElementById('n-hits').textContent,
    firedRowGone: !document.getElementById('n-fired'),
  };
});
await page.screenshot({path:join(HERE,'gf-out/09-fixed-readouts.png')});
await page.setViewport({width:1100,height:800}); await sleep(500);
const R2 = await page.evaluate(()=>{
  const el=document.getElementById('dsig-90'); const r=el.getBoundingClientRect();
  const lh=parseFloat(getComputedStyle(el).lineHeight)||20;
  return { dsigSingleLine: r.height < lh*1.6, text: el.textContent };
});
await page.screenshot({path:join(HERE,'gf-out/10-fixed-narrow.png')});
console.log(JSON.stringify({R,R2,jsErrors:errors},null,1));
await browser.close();
