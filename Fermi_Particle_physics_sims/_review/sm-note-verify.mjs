import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve(HERE,'../Standard_model.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1600);
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(300);
await page.evaluate(()=>document.getElementById('mode-lagr').click()); await sleep(400);
const R={};
R.firstLoad = await page.evaluate(()=>({
  noteShown: document.getElementById('lagr-note').classList.contains('show'),
  noteText: document.getElementById('lagr-note').textContent,
  trayHidden: document.getElementById('lagr-tray').classList.contains('hidden'),
  anySelected: !!document.querySelector('.lagr-term.selected'),
}));
await page.screenshot({path:join(HERE,'sm-out/33-firstload-note.png')});
// hover no-select, click selects
const chip = await page.evaluate(()=>{const r=document.querySelector('.lagr-term[data-term="gauge-kinetic"]').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
await page.mouse.move(chip.x, chip.y); await sleep(300);
R.afterHover = await page.evaluate(()=>!!document.querySelector('.lagr-term.selected'));
await page.mouse.click(chip.x, chip.y); await sleep(400);
R.afterClick = await page.evaluate(()=>({selected:document.querySelector('.lagr-term.selected')?.dataset.term, boxShown:!document.getElementById('lagr-tray').classList.contains('hidden'), noteStill:document.getElementById('lagr-note').classList.contains('show')}));
await page.screenshot({path:join(HERE,'sm-out/34-note-after-click.png')});
// table mode hides note
await page.evaluate(()=>document.getElementById('mode-table').click()); await sleep(300);
R.tableHidesNote = await page.evaluate(()=>!document.getElementById('lagr-note').classList.contains('show'));
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
