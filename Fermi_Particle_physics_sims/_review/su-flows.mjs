import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'su-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Scale_of_universe.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};
const setL=v=>page.evaluate(v=>{const el=document.getElementById('logL');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},v);
const setE=v=>page.evaluate(v=>{const el=document.getElementById('logE');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},v);
const vals=()=>page.evaluate(()=>({L:document.getElementById('logL').value, E:document.getElementById('logE').value, Lval:document.getElementById('logL-val')?.textContent, Eval:document.getElementById('logE-val')?.textContent}));
// 1. audit spot checks at canonical scales
R.audit = await page.evaluate(()=>({
  atom: window.__audit.at({logL:-10}),
  nucleus: window.__audit.at({logL:-14}),
  proton: window.__audit.at({logL:Math.log10(0.84e-15)}),
  quark: window.__audit.at({logL:-18}),
  earth: window.__audit.at({logL:7}),
  inv: window.__audit.invariants.lambdaMomentumProduct()
}));
// 2. landmark screenshots
for(const [l,tag] of [[7,'earth'],[0,'human'],[-10,'atom'],[-14,'nucleus'],[Math.log10(0.84e-15),'proton'],[-18,'quark']]){
  await setL(l); await sleep(300); await shot('01-'+tag);
}
// 3. two-way coupling: set ENERGY slider → length must follow inversely
await setE(4.09); await sleep(200); // ~12.4 keV → atom 1e-10
R.coupleE4 = await vals();
await setE(12.09); await sleep(200); // 1.24 TeV → 1e-18
R.coupleE12 = await vals();
await setL(-14); await sleep(200);
R.coupleL14 = await vals();
// 4. canvas ruler drag + energy bar drag (pointer events)
const layout = await page.evaluate(()=>{
  const c=document.getElementById('scene'); const r=c.getBoundingClientRect();
  return {x:r.left,y:r.top,w:r.width,h:r.height};
});
// ruler is near bottom; energy bar right side — drag mid-ruler
await page.mouse.move(layout.x+layout.w*0.3, layout.y+layout.h-40);
await page.mouse.down(); await page.mouse.move(layout.x+layout.w*0.6, layout.y+layout.h-40,{steps:5}); await page.mouse.up();
await sleep(200);
R.afterRulerDrag = await vals();
await shot('02-after-ruler-drag');
// 5. reset scope
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(300);
R.afterReset = await vals();
// 6. inquiry walk (count cards/gates)
let gates=0, cards=await page.evaluate(()=>document.querySelectorAll('#inq-cards .inq-step').length);
for(let i=0;i<cards+1;i++){
  const dis = await page.evaluate(()=>document.getElementById('inq-next')?.disabled);
  if(dis){ gates++;
    await page.evaluate(()=>{const card=[...document.querySelectorAll('#inq-cards .inq-step')].find(c=>c.offsetParent!==null);card?.querySelector('.choice[data-correct]')?.click();});
    await sleep(200);
  }
  await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(250);
}
R.inquiry = {cards, gates};
await shot('03-inq-end');
// 7. theme + narrow
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(300); await shot('04-light');
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.setViewport({width:1100,height:800}); await sleep(500); await shot('05-narrow');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'su-flows.json'),JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,1).slice(0,4500));
await browser.close();
