import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'ew-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Eigenfold_way_v2.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};
const clickMult=m=>page.evaluate(m=>document.querySelector(`[data-mult="${m}"]`)?.click(),m);
const clickAxis=a=>page.evaluate(a=>document.querySelector(`[data-axis="${a}"]`)?.click(),a);
const clickTile=id=>page.evaluate(id=>{
  const pos=document.getElementById('scene').__pos||{};
  if(!pos[id])return false;
  const c=document.getElementById('scene');const r=c.getBoundingClientRect();
  c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+pos[id].px,clientY:r.top+pos[id].py}));
  return true;
},id);
const detail=()=>page.evaluate(()=>document.getElementById('detail').innerText.replace(/\s+/g,' ').slice(0,300));
const positions=()=>page.evaluate(()=>{const p=document.getElementById('scene').__pos||{};const o={};for(const k in p)o[k]=[Math.round(p[k].px),Math.round(p[k].py)];return o;});
// 1. octet initial + click every octet tile, record detail QNs
await shot('01-octet');
R.octetPositions = await positions();
R.octetDetails = {};
for(const id of ['proton','neutron','lambda','sigma-plus','sigma-zero','sigma-minus','xi-zero','xi-minus']){
  const hit = await clickTile(id); await sleep(120);
  R.octetDetails[id] = hit ? await detail() : 'NOT CLICKABLE';
}
await shot('02-octet-selected');
// 2. audit invariant per multiplet
R.invOctet = await page.evaluate(()=>window.__audit.invariants.gridChargeMatchesQuarkCharge());
// 3. meson octet
await clickMult('meson'); await sleep(300);
await shot('03-meson');
R.mesonPositions = await positions();
R.invMeson = await page.evaluate(()=>window.__audit.invariants.gridChargeMatchesQuarkCharge());
for(const id of ['kaon-zerobar','pion-zero','eta']){
  await clickTile(id); await sleep(120);
  R['meson_'+id] = await detail();
}
// 4. decuplet: 9 tiles + gap; reveal box visible
await clickMult('decuplet'); await sleep(300);
await shot('04-decuplet-gap');
R.decupletPositionsBefore = await positions();
R.revealBoxVisible = await page.evaluate(()=>document.getElementById('reveal-box').style.display!=='none');
R.invDecuplet = await page.evaluate(()=>window.__audit.invariants.gridChargeMatchesQuarkCharge());
// 5. reveal
await page.evaluate(()=>document.getElementById('btn-reveal').click()); await sleep(400);
await shot('05-revealed');
R.afterReveal = { detail: await detail(), boxHidden: await page.evaluate(()=>document.getElementById('reveal-box').style.display==='none'), omegaPlaced: !!(await positions())['omega-minus'] };
// 6. reveal persists across multiplet round-trip
await clickMult('octet'); await sleep(200); await clickMult('decuplet'); await sleep(300);
R.revealAfterRoundTrip = !!(await positions())['omega-minus'];
// 7. axis toggle: Y — every baryon shifts up equally, shape invariant
const before = await positions();
await clickAxis('Y'); await sleep(300);
const after = await positions();
R.axisShift = Object.keys(before).map(id=>({id, dx:after[id][0]-before[id][0], dy:after[id][1]-before[id][1]})).slice(0,4);
await shot('06-decuplet-Y');
// selection retained across axis toggle?
await clickTile('delta-plusplus'); await sleep(150);
await clickAxis('S'); await sleep(200);
R.selectionAfterAxis = await detail();
// 8. meson axis toggle: no shift expected
await clickMult('meson'); await sleep(250);
const mb = await positions(); await clickAxis('Y'); await sleep(250);
const ma = await positions();
R.mesonAxisShift = Object.keys(mb).map(id=>({id, dy:ma[id][1]-mb[id][1]})).slice(0,3);
await clickAxis('S');
// 9. inquiry walk: gates + step-back unreveal behavior
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(400);
R.afterReset = { positions: Object.keys(await positions()).length, revealBox: await page.evaluate(()=>document.getElementById('reveal-box').style.display) };
let hud=[];
for(let i=0;i<6;i++){
  await page.evaluate(()=>{const card=[...document.querySelectorAll('#inq-cards .inq-step')].find(c=>c.offsetParent!==null);card?.querySelector('.choice[data-correct]')?.click();});
  await sleep(150);
  const adv = await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled){b.click();return true;}return false;});
  await sleep(250);
  hud.push({step:i, advanced:adv, mult: await page.evaluate(()=>document.querySelector('[data-mult].active')?.dataset.mult)});
}
R.inqWalk = hud;
await shot('07-inq-end');
// on step 5 (reveal card): press reveal, then go BACK to card 4 — unreveal?
await page.evaluate(()=>document.getElementById('btn-reveal')?.click()); await sleep(200);
const revealedNow = !!(await positions())['omega-minus'];
await page.evaluate(()=>document.getElementById('inq-prev').click()); await sleep(300);
R.stepBack = { revealedBefore: revealedNow, revealedAfterBack: !!(await positions())['omega-minus'] };
// 10. theme toggle legibility + narrow
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(300);
await shot('08-light-theme');
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.setViewport({width:1100,height:800}); await sleep(500);
await shot('09-narrow-1100');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'ew-flows.json'),JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,1).slice(0,6000));
await browser.close();
