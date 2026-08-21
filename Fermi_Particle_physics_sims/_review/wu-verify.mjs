import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Wu_exp.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
const R={};
const st=()=>page.evaluate(()=>({fire:document.getElementById('fire-btn').textContent.trim(), mirror:document.getElementById('mirror-btn').textContent.trim(), up:+document.getElementById('N-up').textContent, dn:+document.getElementById('N-down').textContent, asym:document.getElementById('asym-val').textContent, pred:document.getElementById('asym-pred').textContent}));
// free-explore lands mirror ON (card 8 staging) — ensure mirror ON and fire ON
const mstate = await page.evaluate(()=>document.getElementById('mirror-btn').textContent.includes('Hide'));
if(!mstate) await page.evaluate(()=>document.getElementById('mirror-btn').click());
await page.evaluate(()=>document.getElementById('fire-btn').click());
await page.evaluate(()=>{const s=document.getElementById('shell-speed'); if(s){s.value='4'; s.dispatchEvent(new Event('change',{bubbles:true}));}});
await sleep(5000);
R.before = await st();
// NP-P1-1: move B slider mid-fire — firing + mirror must survive, stats must clear
await page.evaluate(()=>{const el=document.getElementById('B');el.value=8;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
await sleep(400);
R.justAfterSlider = await st();      // counts should be ~0 (cleared), fire still "Stop firing", mirror still "Hide"
await sleep(12000);
R.accumulating = await st();          // counts growing again under new P
await page.screenshot({path:join(HERE,'wu-out/08-fixed-slider-midfire.png')});
// PHY-P1-1: caption text on mirror panel — pixel-free check via drawn string? read from source of truth:
R.captionFix = await page.evaluate(()=>{
  // re-render and grab via function source (caption is canvas text; assert code path)
  return document.documentElement.outerHTML.includes('coil current (unchanged') && !document.documentElement.outerHTML.includes("'coil current (reversed)'");
});
await page.screenshot({path:join(HERE,'wu-out/09-fixed-mirror.png')});
// physics regression: sign + prediction at new B=8 (T unchanged 3 mK → higher P)
R.audit = await page.evaluate(()=>window.__audit.at({}));
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
