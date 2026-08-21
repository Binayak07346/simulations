import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Charged_particle_in_a_magnetic_field_v2.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1000);
const pick=p=>page.evaluate(p=>document.querySelector(`#particle-seg .seg-btn[data-particle="${p}"]`)?.click(),p);
const stats=()=>page.evaluate(()=>({p:document.getElementById('stat-p').textContent,r:document.getElementById('stat-r').textContent,curl:document.getElementById('stat-curl').textContent}));
const arcSense=()=>page.evaluate(()=>{
  const c=document.getElementById('chamber');const ctx=c.getContext('2d');
  const img=ctx.getImageData(0,0,c.width,c.height).data;const pts=[];
  for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2){const k=(y*c.width+x)*4;
    if(Math.abs(img[k]-251)<28&&Math.abs(img[k+1]-191)<32&&Math.abs(img[k+2]-36)<40)pts.push([x,y]);}
  if(pts.length<12)return{n:pts.length,sense:null};
  let mx=0,my=0;for(const p of pts){mx+=p[0];my+=p[1];}mx/=pts.length;my/=pts.length;
  let Sxx=0,Sxy=0,Syy=0,Sxz=0,Syz=0;
  for(const[x,y]of pts){const u=x-mx,v=y-my,z=u*u+v*v;Sxx+=u*u;Sxy+=u*v;Syy+=v*v;Sxz+=u*z;Syz+=v*z;}
  const det=2*(Sxx*Syy-Sxy*Sxy);const uc=(Syy*Sxz-Sxy*Syz)/det,vc=(Sxx*Syz-Sxy*Sxz)/det;
  const cx=mx+uc,cy=my+vc;
  let entry=pts[0];for(const p of pts)if(p[1]<entry[1])entry=p;
  const a0=Math.atan2(entry[1]-cy,entry[0]-cx);let pos=0,neg=0;
  for(const[x,y]of pts){let d=Math.atan2(y-cy,x-cx)-a0;
    while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
    if(d>0.05)pos++;else if(d<-0.05)neg++;}
  return{n:pts.length,cx:Math.round(cx),entryX:entry[0],sense:pos>neg?'viewer-CW':'viewer-CCW'};
});
const R={};
// electron: label must now be CCW and drawn CCW
await sleep(2500);
R.electron={stats:await stats(),arc:await arcSense(),audit:await page.evaluate(()=>window.__audit.at({}))};
await page.screenshot({path:join(HERE,'cc-out/14-fixed-electron.png')});
// positron: label CW, drawn CW
await pick('positron');await sleep(2500);
R.positron={stats:await stats(),arc:await arcSense()};
await page.screenshot({path:join(HERE,'cc-out/15-fixed-positron.png')});
// into-screen flip: electron -> CW label + CW drawn
await pick('electron');
await page.evaluate(()=>document.querySelector('#dir-seg .seg-btn[data-dir="into-screen"]')?.click());await sleep(2200);
R.electronInto={stats:await stats(),arc:await arcSense()};
await page.evaluate(()=>document.querySelector('#dir-seg .seg-btn[data-dir="out-of-screen"]')?.click());
// plate spiral: e- 8 MeV, plate on, run long; expect multiple crossings + death
await page.evaluate(()=>{const p=document.getElementById('lead-plate');if(!p.checked)p.click();});
await page.evaluate(()=>{const el=document.getElementById('ke');el.value=8;el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(14000);
await page.screenshot({path:join(HERE,'cc-out/16-fixed-plate-spiral.png')});
R.plateStats=await stats();
await page.evaluate(()=>{const p=document.getElementById('lead-plate');if(p.checked)p.click();});
// match HUD regression: walk inquiry to match step, muon 20 MeV
for(let i=0;i<8;i++){
  await page.evaluate(()=>{const card=[...document.querySelectorAll('#inq-cards .inq-step')].find(c=>c.offsetParent!==null);card?.querySelector('.choice[data-correct]')?.click();});
  await sleep(200);
  await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();});
  await sleep(300);
  if(await page.evaluate(()=>document.getElementById('ghost-box').style.display!=='none'))break;
}
await pick('muon');
await page.evaluate(()=>{const el=document.getElementById('ke');el.value=20;el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(1500);
R.match=await page.evaluate(()=>({target:document.getElementById('stat-ghost-p').textContent,match:document.getElementById('stat-match').textContent}));
await page.screenshot({path:join(HERE,'cc-out/17-fixed-match.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
