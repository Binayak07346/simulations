import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const outdir = join(HERE,'sm-out'); mkdirSync(outdir,{recursive:true});
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1400);
const shot=l=>page.screenshot({path:`${outdir}/${l}.png`});
const R={};
const detail=()=>page.evaluate(()=>document.getElementById('detail-panel').innerText.replace(/\s+/g,' ').slice(0,360));
// canvas click helper via hit regions is internal; click by coordinates from a probe of the canvas — instead
// use the sim's own hit test by dispatching clicks at tile positions. We don't have positions… but we can
// read them: the sim rebuilds hitRegions each draw — closure-hidden. Click by scanning: dispatch clicks on a
// grid and record when detail changes. Cheaper: click known layout — table 4 cols? Instead scan coarse grid.
const clickAt=(x,y)=>page.evaluate(({x,y})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+x,clientY:r.top+y}));},{x,y});
const canvasSize=await page.evaluate(()=>{const r=document.getElementById('main-canvas').getBoundingClientRect();return{w:r.width,h:r.height};});
// 1. scan the table: click a grid, collect distinct selections + their detail text
R.tiles={};
for(let gx=0;gx<8;gx++)for(let gy=0;gy<6;gy++){
  await clickAt(canvasSize.w*(0.06+0.088*gx), canvasSize.h*(0.12+0.15*gy));
  const d=await detail();
  const m=d.match(/Selection (.*?) Mass/);
  const name=(d.match(/^[^ ]+ ?[^ ]* — /)||[d.slice(0,24)])[0];
  if(d.includes('Mass') && !R.tiles[name]) R.tiles[name]=d.slice(0,180);
  if(Object.keys(R.tiles).length>=17) break;
}
R.tileCount=Object.keys(R.tiles).length;
await shot('01-table');
// 2. specific checks: click for top quark & Higgs & neutrino details — find by text already collected.
// 3. mode switch to Lagrangian, click each term band
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(500);
await shot('02-lagrangian');
R.lagr={};
for(let gy=0;gy<5;gy++){
  await clickAt(canvasSize.w*0.5, canvasSize.h*(0.15+0.17*gy));
  const d=await detail();
  const key=d.slice(0,40);
  if(!R.lagr[key]) R.lagr[key]=d.slice(0,200);
}
await shot('03-lagr-selected');
// 4. mode round trip: selection memory
await page.evaluate(()=>document.getElementById('mode-table').click()); await sleep(300);
R.backToTableDetail = await detail();
// 5. reset scope
await page.evaluate(()=>document.getElementById('shell-reset').click()); await sleep(300);
R.afterReset = { mode: await page.evaluate(()=>document.getElementById('mode-table').classList.contains('active')?'table':'lagr'), detail: (await detail()).slice(0,80) };
// 6. inquiry walk
let gates=0;
for(let i=0;i<7;i++){
  const dis=await page.evaluate(()=>document.getElementById('inq-next')?.disabled);
  if(dis){gates++;
    await page.evaluate(()=>{const card=[...document.querySelectorAll('#inq-cards .inq-step')].find(c=>c.offsetParent!==null);card?.querySelector('.choice[data-correct]')?.click();});
    await sleep(200);}
  await page.evaluate(()=>{const b=document.getElementById('inq-next');if(b&&!b.disabled)b.click();}); await sleep(250);
}
R.gates=gates;
await shot('04-inq-end');
// 7. theme + narrow
await page.evaluate(()=>document.getElementById('shell-theme').click()); await sleep(400); await shot('05-light');
R.lightBg = await page.evaluate(()=>{
  const c=document.getElementById('main-canvas'); const x=c.getContext('2d');
  const d=x.getImageData(5,5,1,1).data; return [d[0],d[1],d[2]];
});
await page.evaluate(()=>document.getElementById('shell-theme').click());
await page.setViewport({width:1100,height:800}); await sleep(500); await shot('06-narrow');
R.overflow1100 = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
writeFileSync(join(outdir,'sm-flows.json'),JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,1).slice(0,6000));
await browser.close();
