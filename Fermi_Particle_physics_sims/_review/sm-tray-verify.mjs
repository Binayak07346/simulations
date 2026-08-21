import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1600);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(500);
const R={};
// no selection: tray hidden
R.noSelTrayHidden = await page.evaluate(()=>document.getElementById('lagr-tray').classList.contains('hidden'));
// select fermion term: tray card + sizes
await page.evaluate(()=>document.querySelector('.lagr-term[data-term="fermion-kinetic"]').click()); await sleep(400);
R.tray = await page.evaluate(()=>{
  const t=document.getElementById('lagr-tray');
  const r=t.getBoundingClientRect();
  return { hidden:t.classList.contains('hidden'), h:Math.round(r.height), w:Math.round(r.width),
           name:t.querySelector('.lt-name')?.textContent, textLen:t.querySelector('.lt-plain')?.textContent.length };
});
// cancel-D rendered in chip (KaTeX .cancel produces a <span class="cancel-lap"> or svg strike)
R.cancelRendered = await page.evaluate(()=>{
  const chip=document.querySelector('.lagr-term[data-term="fermion-kinetic"]');
  return { hasKatex: !!chip.querySelector('.katex'), html: chip.innerHTML.includes('cancel') || chip.innerHTML.includes('svg') };
});
await page.screenshot({path:join(HERE,'sm-out/26-tray-card.png')});
// sidebar equation zoom
const pr = await page.evaluate(()=>{const r=document.getElementById('detail-panel').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width}});
await page.screenshot({path:join(HERE,'sm-out/27-sidebar-eq.png'), clip:{x:pr.x-4,y:pr.y-4,width:pr.w+8,height:160}});
// narrow
await page.setViewport({width:1100,height:800}); await sleep(600);
await page.screenshot({path:join(HERE,'sm-out/28-tray-narrow.png')});
R.overflowNarrow = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
