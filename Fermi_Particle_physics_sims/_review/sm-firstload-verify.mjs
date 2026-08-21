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
// 1. first load: hint shown, no selection
R.firstLoad = await page.evaluate(()=>({
  hint: document.getElementById('lagr-tray').classList.contains('hint'),
  hintText: document.getElementById('lagr-tray').innerText.trim(),
  anySelected: !!document.querySelector('.lagr-term.selected'),
}));
await page.screenshot({path:join(HERE,'sm-out/31-firstload-hint.png')});
// 2. HOVER must NOT select
const chip = await page.evaluate(()=>{const r=document.querySelector('.lagr-term[data-term="yukawa"]').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
await page.mouse.move(chip.x, chip.y); await sleep(400);
R.afterHover = await page.evaluate(()=>({anySelected: !!document.querySelector('.lagr-term.selected'), stillHint: document.getElementById('lagr-tray').classList.contains('hint')}));
// 3. CLICK selects and shows the box
await page.mouse.click(chip.x, chip.y); await sleep(400);
R.afterClick = await page.evaluate(()=>({
  selected: document.querySelector('.lagr-term.selected')?.dataset.term,
  boxName: document.querySelector('#lagr-tray .lt-name')?.textContent,
  hint: document.getElementById('lagr-tray').classList.contains('hint'),
}));
await page.screenshot({path:join(HERE,'sm-out/32-after-click.png')});
R.jsErrors=errors;
console.log(JSON.stringify(R,null,1));
await browser.close();
