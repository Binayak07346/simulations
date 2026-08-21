import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Build_Baryon.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(900);
const disc=q=>page.evaluate(q=>document.querySelector(`.quark-disc[data-q="${q}"]`)?.click(),q);
const btn=s=>page.evaluate(s=>document.querySelector(s)?.click(),s);
const byText=t=>page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(t));b?.click();},t);
const verdict=()=>page.evaluate(()=>document.getElementById('verdict').innerText.replace(/\s+/g,' ').slice(0,300));
const R={};
// FIX 1+2: heavy estimates + top caveat
await byText('Meson'); await sleep(200);
await disc('c'); await disc('anti-c'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.ccbar = await verdict();
await btn('#clear-btn'); await disc('b'); await disc('anti-b'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.bbbar = await verdict();
await btn('#clear-btn'); await disc('t'); await disc('anti-t'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.ttbar = await verdict();
// FIX 3 + regression: ssbar J=0 -> eta-prime; uubar J=0 -> pi0, J=1 -> rho0
await btn('#clear-btn'); await disc('s'); await disc('anti-s'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.ssbarJ0 = await verdict();
await btn('#clear-btn'); await disc('u'); await disc('anti-u'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.uubarJ0 = await verdict();
await btn('#spin-high'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.uubarJ1 = await verdict();
// s sbar J=1 -> phi regression
await btn('#clear-btn'); await disc('s'); await disc('anti-s'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.ssbarJ1 = await verdict();
// FIX 6: mode switch with content -> notice; empty switch -> default text
await byText('Baryon'); await sleep(150); await disc('u'); await disc('d'); await sleep(120);
await byText('Meson'); await sleep(150);
R.modeNotice = await verdict();
await byText('Baryon'); await sleep(150);
R.modeEmptySwitch = await verdict();
// FIX 7: baryon u+d identify -> colour note
await disc('u'); await disc('d'); await sleep(120); await btn('#identify-btn'); await sleep(200);
R.udIncomplete = await verdict();
// FIX 8: signed QNs — proton
await btn('#clear-btn'); await disc('u'); await disc('u'); await disc('d'); await sleep(150);
R.protonQNs = await page.evaluate(()=>({Q:document.getElementById('qns-Q').textContent,B:document.getElementById('qns-B').textContent,S:document.getElementById('qns-S').textContent}));
await btn('#spin-low'); await btn('#identify-btn'); await sleep(200);
R.protonVerdict = (await verdict()).slice(0,120);
// sss omega regression + FIX 4/5: narrow 1280x800 with Formal open — verdict fully visible?
await btn('#clear-btn'); for(const q of ['s','s','s']){await disc(q);} await btn('#spin-high'); await sleep(120); await btn('#identify-btn'); await sleep(200);
await btn('#toggle-formal'); await sleep(500);
await page.setViewport({width:1280,height:800}); await sleep(500);
R.clipCheck = await page.evaluate(()=>{
  const v=document.getElementById('verdict'), b=document.querySelector('.bench');
  const vr=v.getBoundingClientRect(), br=b.getBoundingClientRect();
  return { verdictContentFits: v.scrollHeight <= v.clientHeight+2,
           benchScrollable: b.scrollHeight > b.clientHeight,
           verdictLastRowVisibleInBench: vr.bottom <= br.bottom+2 || b.scrollHeight>b.clientHeight,
           verdictText: v.innerText.includes('Discovered') && v.innerText.includes('Brookhaven') };
});
await page.evaluate(()=>document.querySelector('.bench').scrollTo(0,99999)); await sleep(200);
await page.screenshot({path:join(HERE,'flow-out/18-fixed-narrow-1280.png')});
R.jsErrors = errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
