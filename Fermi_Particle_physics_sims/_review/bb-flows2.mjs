import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Build_Baryon.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(900);
const disc=q=>page.evaluate(q=>document.querySelector(`.quark-disc[data-q="${q}"]`)?.click(),q);
const btn=s=>page.evaluate(s=>document.querySelector(s)?.click(),s);
const byText=t=>page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(t));b?.click();},t);
const verdict=()=>page.evaluate(()=>document.getElementById('verdict').innerText.replace(/\s+/g,' ').slice(0,260));
const R={};
// fresh page: card-5 path — meson mode from J=1/2 default → should land J=0 → K+
await byText('Meson'); await sleep(200);
await disc('u'); await disc('anti-s'); await sleep(150); await btn('#identify-btn'); await sleep(250);
R.kplusFreshPath = await verdict();
// u + anti-u at J=0 → pi0
await btn('#clear-btn'); await disc('u'); await disc('anti-u'); await sleep(150); await btn('#identify-btn'); await sleep(250);
R.pi0 = await verdict();
// t + anti-t → toponium wording?
await btn('#clear-btn'); await disc('t'); await disc('anti-t'); await sleep(150); await btn('#identify-btn'); await sleep(250);
R.ttbar = await verdict();
// b + anti-b → Upsilon estimate
await btn('#clear-btn'); await disc('b'); await disc('anti-b'); await sleep(150); await btn('#identify-btn'); await sleep(250);
R.bbbar = await verdict();
// baryon c,u,d at J=1/2 → Lambda_c hint
await byText('Baryon'); await sleep(200);
for(const q of ['c','u','d']){await disc(q); await sleep(80);} await btn('#identify-btn'); await sleep(250);
R.cud = await verdict();
// s,anti-s at J=0 -> eta (with eta' alt)?
await byText('Meson'); await sleep(200);
await disc('s'); await disc('anti-s'); await sleep(150); await btn('#identify-btn'); await sleep(250);
R.ssbarJ0 = await verdict();
console.log(JSON.stringify(R,null,1));
await browser.close();
