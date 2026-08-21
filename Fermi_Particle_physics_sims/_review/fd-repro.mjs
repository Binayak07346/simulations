import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Feynmann_diagram_sandbox.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1000);
// spy on value writes to #sl-q2
await page.evaluate(()=>{
  const el=document.getElementById('sl-q2');
  const proto=Object.getPrototypeOf(el);
  const desc=Object.getOwnPropertyDescriptor(proto,'value');
  window.__writes=[];
  Object.defineProperty(el,'value',{
    get(){ return desc.get.call(this); },
    set(v){ window.__writes.push({v:String(v), stack:(new Error()).stack.split('\n').slice(1,5).join(' | ')}); desc.set.call(this,v); }
  });
});
const setVal=v=>page.evaluate(v=>{const el=document.getElementById('sl-q2');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},v);
const read=()=>page.evaluate(()=>({val:document.getElementById('sl-q2').value, writes:window.__writes.splice(0)}));
// scenario A: fresh page, set 5, click lecture (enter lecture mode)
await setVal(5); await page.evaluate(()=>window.__writes.splice(0));
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
const A = await read();
// scenario B: click lecture again (exit)
await setVal(5); await page.evaluate(()=>window.__writes.splice(0));
await page.evaluate(()=>document.getElementById('shell-lecture').click()); await sleep(400);
const B = await read();
console.log(JSON.stringify({A,B},null,1));
await browser.close();
