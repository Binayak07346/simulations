import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Relativistic_kinematics.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const R={};
// 1. card 2: answer A → ghost must be visible in settled state
await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(400);
await page.evaluate(()=>{[...document.querySelectorAll('#inq-cards .inq-step.active .choice')].find(b=>b.dataset.c==='A')?.click();}); await sleep(600);
R.ghost = await page.evaluate(()=>{
  const c=document.getElementById('cv-top'); const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  let grey=0; // dashed ghost stroke #94a3b8 at alpha .45 over dark bg
  for(let i=0;i<img.length;i+=4){
    const r=img[i],g=img[i+1],b=img[i+2];
    if(r>55&&r<130&&g>65&&g<145&&b>85&&b<165&&Math.abs(g-r)<25&&b>g) grey++;
  }
  return {greyPx: grey};
});
await page.screenshot({path:join(HERE,'rk-out/11-ghost-persistent.png')});
// 2. lecture round-trip resume: advance to card 4 (answer gate first), enter+exit lecture
await sleep(200);
for(let i=0;i<2;i++){ await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(300); }
R.cardBefore = await page.evaluate(()=>[...document.querySelectorAll('#inq-cards .inq-step')].findIndex(c=>c.classList.contains('active')));
// enter lecture, tweak m1, exit
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
await page.evaluate(()=>{const el=document.getElementById('s-m1');el.value=2.5;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(300);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
R.cardAfter = await page.evaluate(()=>[...document.querySelectorAll('#inq-cards .inq-step')].findIndex(c=>c.classList.contains('active')));
R.m1After = await page.evaluate(()=>document.getElementById('s-m1').value);
R.boostAfter = await page.evaluate(()=>document.getElementById('s-boost').value);
await page.screenshot({path:join(HERE,'rk-out/12-lecture-resume.png')});
// 3. regression: invariant + audit still exact
R.audit = await page.evaluate(()=>{const a=window.__audit.at({});return{M:a.M,E:a.totalEnergy};});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
