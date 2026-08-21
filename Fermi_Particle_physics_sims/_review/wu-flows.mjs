import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'wu-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Wu_exp.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1400);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};
const reads=()=>page.evaluate(()=>({B:document.getElementById('B-val').textContent,T:document.getElementById('T-val').textContent,BT:document.getElementById('BT-val').textContent,P:document.getElementById('P-val').textContent,Nup:document.getElementById('N-up').textContent,Ndn:document.getElementById('N-down').textContent,asym:document.getElementById('asym-val').textContent,pred:document.getElementById('asym-pred').textContent}));
const set=(id,v)=>page.evaluate(({id,v})=>{const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},{id,v});
// free explore
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
// 1. default readouts (P from Brillouin)
R.defaults = await reads();
R.audit = await page.evaluate(()=>window.__audit.at ? window.__audit.at({}) : null);
await shot('01-default');
// 2. fire ~35s at default → sign + convergence
await page.evaluate(()=>document.getElementById('fire-btn').click());
await page.evaluate(()=>{const s=document.getElementById('shell-speed'); if(s){s.value='4'; s.dispatchEvent(new Event('change',{bubbles:true}));}});
await sleep(35000);
R.afterFire = await reads();
await shot('02-fired');
// 3. P->0: warm up (T slider max) with counts cleared; fire briefly
const Trange = await page.evaluate(()=>({min:document.getElementById('T').min,max:document.getElementById('T').max}));
await set('T', Trange.max); await sleep(200);
await page.evaluate(()=>document.getElementById('clear-btn').click());
await sleep(8000);
R.warm = await reads();
await shot('03-warm');
// 4. B=0 exact zero
await set('B', 0); await sleep(200);
R.B0 = await reads();
// restore
await set('B',5); await set('T',Trange.min); await sleep(300);
// 5. mirror view while firing
await page.evaluate(()=>document.getElementById('mirror-btn').click()); await sleep(1500);
R.mirrorOn = await page.evaluate(()=>document.getElementById('mirror-btn').textContent.trim());
await shot('04-mirror');
// 6. persistence: sliders/mirror/clear during fire; then stop fire
R.midFire = await reads();
await page.evaluate(()=>document.getElementById('clear-btn').click()); await sleep(1500);
R.afterClear = await reads();
await page.evaluate(()=>document.getElementById('fire-btn').click()); // stop
// 7. reset scope
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(400);
R.afterReset = { ...(await reads()), mirror: await page.evaluate(()=>document.getElementById('mirror-btn').textContent.trim()), fire: await page.evaluate(()=>document.getElementById('fire-btn').textContent.trim()) };
// 8. inquiry walk
let gates=0, caps=[];
for(let i=0;i<9;i++){
  const dis=await page.evaluate(()=>document.getElementById('inq-next')?.disabled);
  if(dis){gates++;
    await page.evaluate(()=>{const card=[...document.querySelectorAll('#inq-cards .inq-step')].find(c=>c.offsetParent!==null);card?.querySelector('.choice[data-correct]')?.click();});
    await sleep(200);}
  caps.push(await page.evaluate(()=>document.getElementById('scene-caption').textContent.slice(0,40)));
  await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(300);
}
R.gates=gates; R.captionsSeen=caps.length;
await shot('05-inq-end');
// 9. light theme + narrow
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(400); await shot('06-light');
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.setViewport({width:1100,height:800}); await sleep(500); await shot('07-narrow');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'wu-flows.json'),JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,1).slice(0,5000));
await browser.close();
