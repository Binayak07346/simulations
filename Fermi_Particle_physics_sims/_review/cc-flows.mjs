// Targeted flow tests for Charged_particle_in_a_magnetic_field_v2.html (cloud chamber).
// The key measurement: the DRAWN rotation sense of each track, computed from its
// actual sampled points in screen coords (cross_z > 0 == viewer-clockwise), compared
// against the on-screen "Curl direction" readout.
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'cc-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Charged_particle_in_a_magnetic_field_v2.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1000);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};

const setSlider=(id,val)=>page.evaluate(({id,val})=>{const el=document.getElementById(id);el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},{id,val});
const pickParticle=p=>page.evaluate(p=>document.querySelector(`#particle-seg .seg-btn[data-particle="${p}"]`)?.click(),p);
const readStats=()=>page.evaluate(()=>({
  p: document.getElementById('stat-p').textContent,
  r: document.getElementById('stat-r').textContent,
  curl: document.getElementById('stat-curl').textContent,
}));
// Rotation sense of the LIVE track from its sampled points. Screen coords (y down):
// cross_z > 0 => viewer-CLOCKWISE. Uses points spread across the arc.
const liveTrackInfo=()=>page.evaluate(()=>{
  const dbg = window.__ccDebug ? window.__ccDebug() : null;
  return dbg;
});
// expose internal state once
await page.evaluate(()=>{
  // reach into the sim closure via a repaint hook: we can't, so reconstruct from canvas-
  // independent data: fire our own reader using __audit for record values, and infer the
  // drawn sense from pixel data instead if state is unreachable.
  window.__trackSense = null;
});
// Instead of closure access, sample the drawn arc from PIXELS: find the live (amber)
// track pixels frame-by-frame and record the centroid path of the newest segment.
// Simpler + robust: record the track tip position over time (the amber dot).
const tipPositions = async (n, dt) => {
  const tips=[];
  for(let i=0;i<n;i++){
    const t = await page.evaluate(()=>{
      const c=document.getElementById('chamber');
      const ctx=c.getContext('2d');
      const w=c.width,h=c.height;
      const img=ctx.getImageData(0,0,w,h).data;
      // amber live color #fbbf24 ≈ (251,191,36)
      let sx=0,sy=0,cnt=0;
      for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
        const k=(y*w+x)*4;
        if(Math.abs(img[k]-251)<28&&Math.abs(img[k+1]-191)<32&&Math.abs(img[k+2]-36)<40){sx+=x;sy+=y;cnt++;}
      }
      return cnt?{x:sx/cnt,y:sy/cnt,cnt}:null;
    });
    if(t) tips.push(t);
    await sleep(dt);
  }
  return tips;
};
// sense from centroid drift is unreliable; use full-arc fit at the end instead:
const arcSense = () => page.evaluate(()=>{
  const c=document.getElementById('chamber');
  const ctx=c.getContext('2d');
  const w=c.width,h=c.height;
  const img=ctx.getImageData(0,0,w,h).data;
  const pts=[];
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
    const k=(y*w+x)*4;
    if(Math.abs(img[k]-251)<28&&Math.abs(img[k+1]-191)<32&&Math.abs(img[k+2]-36)<40) pts.push([x,y]);
  }
  if(pts.length<12) return {n:pts.length,sense:null};
  // entry slit is top-middle: order points by path — approximate by angle around the
  // least-squares circle centre
  let mx=0,my=0; for(const p of pts){mx+=p[0];my+=p[1];} mx/=pts.length;my/=pts.length;
  // crude circle centre: average of perpendicular bisector intersections is overkill —
  // use algebraic (Kasa) fit
  let Sxx=0,Sxy=0,Syy=0,Sxz=0,Syz=0;
  for(const [x,y] of pts){const u=x-mx,v=y-my,z=u*u+v*v;Sxx+=u*u;Sxy+=u*v;Syy+=v*v;Sxz+=u*z;Syz+=v*z;}
  const det=2*(Sxx*Syy-Sxy*Sxy);
  const uc=(Syy*Sxz-Sxy*Syz)/det, vc=(Sxx*Syz-Sxy*Sxz)/det;
  const cx=mx+uc, cy=my+vc;
  const rr = Math.sqrt(uc*uc+vc*vc+(Sxx+Syy)/pts.length);
  // entry point = topmost track pixel (min y)
  let entry=pts[0]; for(const p of pts) if(p[1]<entry[1]) entry=p;
  const a0=Math.atan2(entry[1]-cy,entry[0]-cx);
  // classify each point by signed angular offset from entry; the arc grows from the
  // entry in ONE direction: majority sign of small offsets = rotation sense
  let pos=0,neg=0;
  for(const [x,y] of pts){
    let d=Math.atan2(y-cy,x-cx)-a0;
    while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
    if(d>0.05)pos++; else if(d<-0.05)neg++;
  }
  // screen coords y-down: increasing atan2 angle = viewer-clockwise sweep
  return {n:pts.length, cx, cy, entry, rScreenPx: rr, sense: pos>neg?'viewer-CW':'viewer-CCW', pos, neg};
});

// ---- 1. default electron ----
await sleep(2500);
R.electron = { stats: await readStats(), arc: await arcSense(), audit: await page.evaluate(()=>window.__audit.at({})) };
await shot('01-electron');
// ---- 2. positron ----
await pickParticle('positron'); await sleep(2500);
R.positron = { stats: await readStats(), arc: await arcSense() };
await shot('02-positron');
// ---- 3. B scaling: r at 0.5 T vs 2.0 T (audit + readout) ----
R.audit_B05 = await page.evaluate(()=>window.__audit.at({massMeV:0.5109989, chargeUnits:-1, kineticEnergyMeV:5, fieldTesla:0.5}));
R.audit_B20 = await page.evaluate(()=>window.__audit.at({massMeV:0.5109989, chargeUnits:-1, kineticEnergyMeV:5, fieldTesla:2.0}));
await setSlider('bfield',2.0); await sleep(600); R.statsB2 = await readStats();
await setSlider('bfield',0.5); await sleep(300);
// ---- 4. heavy vs light at same KE: proton vs electron at 5 MeV ----
await pickParticle('proton'); await sleep(1500);
R.proton = { stats: await readStats(), audit: await page.evaluate(()=>window.__audit.at({})) };
await shot('03-proton');
// ---- 5. neutron: no track + message ----
await pickParticle('neutron'); await sleep(1200);
R.neutron = { stats: await readStats() };
await shot('04-neutron');
// ---- 6. dir flip mid-flight: live curl flips, ghosts keep theirs ----
await pickParticle('electron'); await sleep(1500);
await page.evaluate(()=>document.querySelector('#dir-seg .seg-btn[data-dir="into-screen"]')?.click()); await sleep(800);
R.dirFlip = { stats: await readStats(), arc: await arcSense() };
await shot('05-dir-flip');
await page.evaluate(()=>document.querySelector('#dir-seg .seg-btn[data-dir="out-of-screen"]')?.click()); await sleep(300);
// ---- 7. Anderson plate: electron 8 MeV, plate on ----
await page.evaluate(()=>{const p=document.getElementById('lead-plate'); if(!p.checked)p.click();});
await setSlider('ke',8); await sleep(3500);
R.plate = { stats: await readStats(), arc: await arcSense() };
await shot('06-plate');
await page.evaluate(()=>{const p=document.getElementById('lead-plate'); if(p.checked)p.click();});
// ---- 8. ghosts accumulate + clear ----
for(const ke of [20, 40, 80, 160, 320]){ await setSlider('ke', ke); await sleep(700); }
await shot('07-ghosts');
R.ghostCountBefore = await page.evaluate(()=>{
  // count grey ghost pixels? cheaper: trust readouts; instead count distinct tracks via canvas grey arcs — skip; use click of clear and visual shots
  return 'see screenshot';
});
await page.evaluate(()=>document.getElementById('clear-ghosts')?.click()); await sleep(500);
await shot('08-ghosts-cleared');
// ---- 9. pause → change KE → play; reset while running ----
await page.evaluate(()=>document.getElementById('shell-play')?.click()); await sleep(200); // pause
await setSlider('ke', 5); await sleep(200);
await page.evaluate(()=>document.getElementById('shell-play')?.click()); await sleep(800); // play
R.afterPausePlay = await readStats();
await page.evaluate(()=>document.getElementById('shell-reset')?.click()); await sleep(600);
R.afterReset = { stats: await readStats(), ke: await page.evaluate(()=>document.getElementById('ke').value), b: await page.evaluate(()=>document.getElementById('bfield').value), plate: await page.evaluate(()=>document.getElementById('lead-plate').checked) };
await shot('09-after-reset');
// ---- 10. inquiry walk to the match step (ghost target HUD) ----
let steps=0;
for(let i=0;i<8;i++){
  await page.evaluate(()=>{
    const card=[...document.querySelectorAll('#inq-cards .inq-step')].find(c=>c.offsetParent!==null);
    card?.querySelector('.choice[data-correct]')?.click();
  });
  await sleep(250);
  const advanced = await page.evaluate(()=>{const b=document.getElementById('inq-next'); if(b && !b.disabled){b.click(); return true;} return false;});
  await sleep(350);
  if(advanced) steps++;
  const hud = await page.evaluate(()=>document.getElementById('ghost-box').style.display !== 'none');
  if(hud) break;
}
R.inqStepsAdvanced = steps;
R.matchHUD = await page.evaluate(()=>({shown: document.getElementById('ghost-box').style.display !== 'none', target: document.getElementById('stat-ghost-p').textContent, match: document.getElementById('stat-match').textContent}));
await shot('10-match-hud');
// try to match: muon at 20 MeV
await pickParticle('muon'); await setSlider('ke',20); await sleep(1200);
R.matchAttempt = await page.evaluate(()=>({match: document.getElementById('stat-match').textContent, p: document.getElementById('stat-p').textContent}));
await shot('11-match-attempt');
// ---- narrow ----
await page.setViewport({width:1100,height:800}); await sleep(600); await shot('12-narrow-1100');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'cc-flows.json'),JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,1));
await browser.close();
