import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'fd-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Feynmann_diagram_sandbox.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1200);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};
const preset=label=>page.evaluate(l=>{[...document.querySelectorAll('#preset-list button')].find(b=>b.textContent.startsWith(l))?.click();},label);
const pal=label=>page.evaluate(l=>{[...document.querySelectorAll('#palette-tray .palette-item')].find(b=>b.textContent===l)?.click();},label);
const banners=()=>page.evaluate(()=>({
  refused: document.getElementById('refusal').classList.contains('show') ? document.getElementById('refusal').innerText.replace(/\s+/g,' ').slice(0,160) : null,
  allowed: document.getElementById('allowed').classList.contains('show') ? document.getElementById('allowed').innerText.replace(/\s+/g,' ').slice(0,120) : null,
}));
const stats=()=>page.evaluate(()=>({force:document.getElementById('s-force').textContent,alpha:document.getElementById('s-alpha').textContent,N:document.getElementById('s-N').textContent,amp:document.getElementById('s-amp').textContent,prob:document.getElementById('s-prob').textContent}));
const propPanel=()=>page.evaluate(()=>({med:document.getElementById('p-med').textContent,off:document.getElementById('p-off').textContent,prop:document.getElementById('p-prop').textContent,on:document.getElementById('p-on').textContent}));
const setQ2=v=>page.evaluate(v=>{const el=document.getElementById('sl-q2');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},v);
R.initial = { banners: await banners(), stats: await stats() };
await shot('01-initial');
R.presets = {};
for(const [key,l] of [['qed','e⁻ · e⁺ · γ'],['ee','e⁻e⁻ → e⁻e⁻'],['qcd','q · q̄ · g'],['wcc','e⁻ · ν̄ₑ · W⁻'],['fcnc','γ · e⁻ · μ⁺'],['glep','gluon · e⁻ · e⁺'],['chg','e⁻ · e⁻ · γ'],['lep','W⁺ · e⁻ · νₑ'],['zff','Z · μ · μ̄']]){
  await preset(l); await sleep(250);
  R.presets[key] = { banners: await banners(), stats: await stats() };
}
await shot('02-last-preset');
await preset('e⁻e⁻ → e⁻e⁻'); await sleep(250);
R.q2 = {};
for(const v of [-5,0,5]){ await setQ2(v); await sleep(200); R.q2['q'+v] = await propPanel(); }
await shot('03-onshell');
await setQ2(-1);
const buildCombo = async (labels)=>{
  await page.evaluate(()=>document.getElementById('btn-clear-slots').click()); await sleep(100);
  for(const l of labels){ await pal(l); await sleep(120); }
  return { banners: await banners(), slots: await page.evaluate(()=>[0,1,2].map(i=>document.getElementById('slot-'+i).textContent)) };
};
R.custom_eeg = await buildCombo(['e⁻','e⁺','γ']);
R.custom_emug = await buildCombo(['e⁻','μ⁺','γ']);
R.custom_uug = await buildCombo(['u','ū','g']);
R.custom_eeGluon = await buildCombo(['e⁻','e⁺','g']);
R.custom_enuW = await buildCombo(['e⁻','ν̄ₑ','W⁺']);
R.custom_3f = await buildCombo(['e⁻','e⁺','μ⁻']);
await shot('04-custom-3fermion');
await buildCombo(['e⁻','e⁺','γ']);
await pal('μ⁻'); await sleep(150);
R.fourthClick = await page.evaluate(()=>[0,1,2].map(i=>document.getElementById('slot-'+i).textContent));
await preset('e⁻e⁻ → e⁻e⁻'); await sleep(200);
const ampBefore = (await stats()).amp;
await page.evaluate(()=>document.getElementById('btn-drag').click());
R.dragBtnActive = await page.evaluate(()=>document.getElementById('btn-drag').classList.contains('active'));
const box = await page.evaluate(()=>{const r=document.getElementById('c-diagram').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
const vx = box.x + 90 + 0.25*(box.w-180), vy = box.y + 90 + 0.5*(box.h-180);
await page.mouse.move(vx,vy); await page.mouse.down(); await page.mouse.move(vx+80,vy-60,{steps:8}); await page.mouse.up(); await sleep(200);
R.ampBefore = ampBefore;
R.ampAfterDrag = (await stats()).amp;
R.invariant = await page.evaluate(()=>window.__audit.invariants.amplitudeInvariantUnderVertexPosition());
await shot('05-after-drag');
await setQ2(4.3); await preset('Z · μ · μ̄'); await sleep(200); await preset('e⁻e⁻ → e⁻e⁻'); await sleep(200);
R.q2Persist = await page.evaluate(()=>document.getElementById('sl-q2').value);
await setQ2(3.7); await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
R.q2AfterLecture = await page.evaluate(()=>document.getElementById('sl-q2').value);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
R.q2AfterLectureBack = await page.evaluate(()=>document.getElementById('sl-q2').value);
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(300);
R.afterReset = { q2: await page.evaluate(()=>document.getElementById('sl-q2').value), stats: await stats(),
  slots: await page.evaluate(()=>[0,1,2].map(i=>document.getElementById('slot-'+i).textContent)), drag: await page.evaluate(()=>document.getElementById('btn-drag').textContent) };
let gated=0;
for(let i=0;i<8;i++){
  const wasDisabled = await page.evaluate(()=>document.getElementById('inq-next').disabled);
  if(wasDisabled){ gated++;
    await page.evaluate(()=>{const card=[...document.querySelectorAll('#inq-cards .inq-step')].find(c=>c.offsetParent!==null);card?.querySelector('.choice[data-correct]')?.click();});
    await sleep(200);
  }
  await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(250);
}
R.gatesEncountered = gated;
await shot('06-inq-end');
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(300); await shot('07-light');
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.setViewport({width:1100,height:800}); await sleep(500); await shot('08-narrow');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'fd-flows.json'),JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,1).slice(0,7500));
await browser.close();
