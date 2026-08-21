import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1400);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(500);
const R={};
// click the muon neutrino tile (bottom row, gen 2 → around fx 0.20, fy 0.85)
const clickAt=(fx,fy)=>page.evaluate(({fx,fy})=>{const c=document.getElementById('main-canvas');const r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*fx,clientY:r.top+r.height*fy}));},{fx,fy});
await clickAt(0.20,0.85); await sleep(300);
R.nuPanel = await page.evaluate(()=>({
  title: document.getElementById('detail-title').innerText.replace(/\s+/g,' ').trim(),
  symbolRaw: document.querySelector('#detail-title span')?.textContent,
  massValue: [...document.querySelectorAll('#detail-body .stat-value')][2]?.textContent,
  massValueSingleLine: (()=>{const v=[...document.querySelectorAll('#detail-body .stat-value')][2]; if(!v)return null; const r=v.getBoundingClientRect(); return r.height<22;})(),
  notes: [...document.querySelectorAll('#detail-body .detail-note .dn-tag')].map(e=>e.textContent),
}));
const pr = await page.evaluate(()=>{const r=document.getElementById('detail-panel').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
await page.screenshot({path:join(HERE,'sm-out/20-panel-nu.png'), clip:{x:pr.x-4,y:pr.y-4,width:pr.w+8,height:Math.min(pr.h+8,560)}});
// regression: massive particle (top) + photon (0 exactly)
await clickAt(0.31,0.18); await sleep(250);
R.topPanel = await page.evaluate(()=>({title:document.getElementById('detail-title').innerText.replace(/\s+/g,' ').trim(), mass:[...document.querySelectorAll('#detail-body .stat-value')][2]?.textContent}));
await clickAt(0.47,0.22); await sleep(250);
R.photonPanel = await page.evaluate(()=>({title:document.getElementById('detail-title').innerText.replace(/\s+/g,' ').trim(), mass:[...document.querySelectorAll('#detail-body .stat-value')][2]?.textContent}));
const pr2 = await page.evaluate(()=>{const r=document.getElementById('detail-panel').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
await page.screenshot({path:join(HERE,'sm-out/21-panel-photon.png'), clip:{x:pr2.x-4,y:pr2.y-4,width:pr2.w+8,height:Math.min(pr2.h+8,560)}});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
