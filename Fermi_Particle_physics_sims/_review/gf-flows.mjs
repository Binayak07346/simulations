import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'gf-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Gold_foil_exp_v3.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};
const set=(id,v)=>page.evaluate(({id,v})=>{const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},{id,v});
const txt=id=>page.evaluate(id=>document.getElementById(id)?.textContent,id);
const clickSel=s=>page.evaluate(s=>document.querySelector(s)?.click(),s);
const reads=async()=>({rmin:await txt('r-min'),thSingle:await txt('theta-single'),thThom:await txt('theta-thomson'),dsig90:await txt('dsig-90'),fired:await txt('n-fired'),hits:await txt('n-hits'),caption:await txt('mode-caption')});
// 0. initial boot state (inquiry card 1: thomson, beam, paused)
R.boot = await reads();
await shot('01-boot');
// 1. free-explore for testing
await clickSel('#shell-lecture'); await sleep(400);
// 2. numeric spot checks (defaults Au 7.7)
R.defaults = await reads();
// audit cross-checks
R.audit = await page.evaluate(()=>({
  d90: window.__audit.at({thetaDegrees:90}).differentialCrossSectionFm2PerSr,
  dClose: window.__audit.at({}).closestApproachFm,
  b90: window.__audit.at({thetaDegrees:90}).impactParameterFm,
  inv: window.__audit.invariants.crossSectionDecreasesWithAngle()
}));
// 3. KE/Z sweeps
await set('ke',20); await sleep(200); R.ke20 = { rmin: await txt('r-min') };
await set('ke',7.7); await set('z',6); await sleep(200);
R.z6 = { rmin: await txt('r-min'), note: await page.evaluate(()=>{const n=document.getElementById('coulomb-note');return n.style.display!=='none'?n.textContent.slice(0,120):'hidden';}) };
await set('z',79); await sleep(200);
// 4. single-shot theta(b) checks
await clickSel('[data-mode="single"]'); await clickSel('[data-model="nuclear"]'); await sleep(200);
for(const b of [0, 30, 50, 100, 500]){ await set('b',b); await sleep(150); R['thB'+b] = await txt('theta-single'); }
await set('b',50); await sleep(600);
await shot('02-single-b50');
await set('b',0); await sleep(600); await shot('03-single-headon');
// 5. nuclear beam: run and measure histogram bar lengths from pixels
await clickSel('[data-mode="beam"]'); await sleep(150);
await page.evaluate(()=>{ if(document.getElementById('shell-play').textContent.includes('Play')) document.getElementById('shell-play').click(); });
await page.evaluate(()=>{const s=document.getElementById('shell-speed'); if(s){s.value='4'; s.dispatchEvent(new Event('change',{bubbles:true}));}});
await sleep(12000);
R.beamNuclear = await reads();
await shot('04-nuclear-histogram');
// measure radial bar lengths at bin centers from pixels (yellow bars, outside ring R)
R.bars = await page.evaluate(()=>{
  const c=document.getElementById('stage'); const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;
  const w=c.width,h=c.height; const dpr=window.devicePixelRatio||1;
  // reconstruct layout: find ring center/R via the sim's own drawing? use computeLayout equivalent:
  // easier: scan for bright yellow rgba(250,204,21) pixels; group by angle around best-fit center.
  // Approximate center: canvas center-ish; find via foil position (light grey vertical strip) — instead
  // use moments of yellow pixels' base... Simplest robust: return list of yellow pixels; process in Node.
  const pts=[];
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
    const k=(y*w+x)*4;
    if(img[k]>200&&img[k+1]>160&&img[k+1]<225&&img[k+2]<90) pts.push([x,y]);
  }
  return {pts: pts.slice(0,20000), w, h};
});
// 6. flow: model switch mid-run keeps nuclear counts?
const hitsBefore = await txt('n-hits');
await clickSel('[data-model="thomson"]'); await sleep(1500);
await clickSel('[data-model="nuclear"]'); await sleep(300);
R.modelRoundTrip = { hitsBefore, hitsAfter: await txt('n-hits') };
await shot('05-after-roundtrip');
// 7. KE change clears (intended)
await set('ke',10); await sleep(300);
R.keClears = { hits: await txt('n-hits'), fired: await txt('n-fired') };
// 8. pause -> slider -> play
await page.evaluate(()=>document.getElementById('shell-play').click()); await sleep(100);
await set('ke',7.7); await sleep(100);
await page.evaluate(()=>document.getElementById('shell-play').click()); await sleep(800);
R.pausePlay = { fired: await txt('n-fired') };
// 9. reset scope
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(300);
R.afterReset = { ...(await reads()), ke: await page.evaluate(()=>document.getElementById('ke').value), z: await page.evaluate(()=>document.getElementById('z').value), b: await page.evaluate(()=>document.getElementById('b').value),
  model: await page.evaluate(()=>document.querySelector('[data-model].active')?.getAttribute('data-model')),
  mode: await page.evaluate(()=>document.querySelector('[data-mode].active')?.getAttribute('data-mode')) };
// 10. plum beam: flashes only forward — run then pixel-scan ring back half
await clickSel('[data-model="thomson"]'); await sleep(100);
await page.evaluate(()=>{ if(document.getElementById('shell-play').textContent.includes('Play')) document.getElementById('shell-play').click(); });
await sleep(4000);
R.plum = await reads();
await shot('06-plum-beam');
// 11. formal open + overlap check
await clickSel('#toggle-formal'); await sleep(600);
await shot('07-formal-open');
R.formalOverlap = await page.evaluate(()=>{
  const els=[...document.querySelectorAll('.eq-label, .ctrl-box, input[type=range], .mode-btn')].filter(e=>{const r=e.getBoundingClientRect();return r.width>2&&r.height>2;});
  const out=[];
  for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){
    const a=els[i].getBoundingClientRect(), b=els[j].getBoundingClientRect();
    if(els[i].contains(els[j])||els[j].contains(els[i]))continue;
    const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left);
    const oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(ox>4&&oy>4) out.push([els[i].className||els[i].id, els[j].className||els[j].id, Math.round(ox), Math.round(oy)]);
  }
  return out.slice(0,10);
});
await clickSel('#toggle-formal');
// 12. narrow
await page.setViewport({width:1100,height:800}); await sleep(500); await shot('08-narrow');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'gf-flows.json'),JSON.stringify(R,null,2));
const {pts,...rest}=R.bars||{}; R.bars='saved';
console.log(JSON.stringify(R,null,1).slice(0,5500));
await browser.close();
