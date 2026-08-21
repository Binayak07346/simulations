import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'rk-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Relativistic_kinematics.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};
const set=(id,v)=>page.evaluate(({id,v})=>{const el=document.getElementById('s-'+id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},{id,v});
const mode=m=>page.evaluate(m=>{[...document.querySelectorAll('#mode-seg .seg-btn')].find(b=>b.dataset.mode===m)?.click();},m);
const audit=(arg)=>page.evaluate(a=>window.__audit.at(a||{}),arg);
const table=()=>page.evaluate(()=>document.getElementById('fourmom-table').innerText.replace(/\s+/g,' ').slice(0,400));
const inv=()=>page.evaluate(()=>document.getElementById('invariant-body').innerText.replace(/\s+/g,' ').slice(0,300));
// go to free explore (Lecture mode) for testing
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
// 1. default inelastic merge, lab frame
R.audit0 = await audit();
R.table0 = await table(); R.inv0 = await inv();
await shot('01-inelastic-lab');
// 2. boost sweep: invariant M must be frame-independent; E,p transform
await set('boost',0.8); await sleep(500);
R.auditBoost = await audit();
R.tableBoost = await table(); R.invBoost = await inv();
await shot('02-inelastic-boosted');
await set('boost',0);
// 3. unequal-mass inelastic: conservation check
await set('m1',2); await set('v1',0.6); await set('m2',1); await set('v2',-0.3); await sleep(400);
R.auditUnequal = await audit();
// 4. elastic mode: E,p conserved; velocities exchange for equal masses
await mode('elastic'); await sleep(400);
R.slidersAfterMode = await page.evaluate(()=>({m1:document.getElementById('s-m1').value,v1:document.getElementById('s-v1').value,m2:document.getElementById('s-m2').value,v2:document.getElementById('s-v2').value}));
await set('m1',1); await set('m2',1); await set('v1',0.8); await set('v2',-0.8); await sleep(400);
R.tableElastic = await table();
await shot('03-elastic');
// 5. decay mode: EA/EB values; Mparent slider enabled?
await mode('decay'); await sleep(400);
R.mpEnabled = await page.evaluate(()=>!document.getElementById('s-mp').disabled);
R.tableDecay = await table();
R.auditDecay = await audit();
await shot('04-decay');
// forbidden decay: m1+m2 > Mp
await set('m1',2); await set('m2',2); await sleep(400);
R.forbidden = { table: await table(), body: await page.evaluate(()=>document.getElementById('restenergy-body').innerText.replace(/\s+/g,' ').slice(0,280)) };
await shot('05-decay-forbidden');
// boosted decay: invariant M still Mparent
await set('m1',1); await set('m2',1); await set('boost',0.6); await sleep(500);
R.invDecayBoost = await inv();
await shot('06-decay-boosted');
// 6. persistence: mode round trip decay->elastic->decay keeps masses+boost?
await set('m1',1.5); await sleep(200);
await mode('elastic'); await sleep(250); await mode('decay'); await sleep(250);
R.roundTrip = await page.evaluate(()=>({m1:document.getElementById('s-m1').value, boost:document.getElementById('s-boost').value, mp:document.getElementById('s-mp').value}));
// 7. reset scope (in lecture mode)
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(400);
R.afterReset = await page.evaluate(()=>({mode:document.querySelector('#mode-seg .seg-btn.active')?.dataset.mode, m1:document.getElementById('s-m1').value, v1:document.getElementById('s-v1').value, boost:document.getElementById('s-boost').value, playing:document.getElementById('shell-play').textContent.trim()}));
// 8. exit lecture: documented restage
await set('boost',0.9); await sleep(200);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
R.exitLecture = await page.evaluate(()=>document.getElementById('s-boost').value);
// 9. inquiry: prediction gate on card 2
await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(300);
R.gateBefore = await page.evaluate(()=>document.getElementById('inq-next').disabled);
await page.evaluate(()=>{[...document.querySelectorAll('#inq-cards .inq-step.active .choice')].find(b=>b.dataset.c==='A')?.click();}); await sleep(300);
R.gateAfterWrongChoice = await page.evaluate(()=>({next:document.getElementById('inq-next').disabled, feedback:document.querySelector('#inq-cards .inq-step.active .predict-eval').className}));
await shot('07-prediction-feedback');
// walk remaining cards
for(let i=0;i<5;i++){ await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(300); }
await shot('08-inq-end');
// 10. narrow + theme
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(300); await shot('09-light');
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.setViewport({width:1100,height:800}); await sleep(500); await shot('10-narrow');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'rk-flows.json'),JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,1).slice(0,6500));
await browser.close();
