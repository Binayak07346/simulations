import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
await page.goto(pathToFileURL(resolve(HERE,'../Feynmann_diagram_sandbox.html')).href,{waitUntil:'networkidle2'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); await sleep(1000);
await page.evaluate(()=>{
  const el=document.getElementById('sl-q2');
  const proto=Object.getPrototypeOf(el);
  const desc=Object.getOwnPropertyDescriptor(proto,'value');
  window.__writes=[];
  Object.defineProperty(el,'value',{
    get(){ return desc.get.call(this); },
    set(v){ window.__writes.push({v:String(v), stack:(new Error()).stack.split('\n').slice(1,12).join(' | ')}); desc.set.call(this,v); }
  });
});
const setVal=v=>page.evaluate(v=>{const el=document.getElementById('sl-q2');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},v);
const clickIdx=i=>page.evaluate(i=>document.querySelectorAll('button')[i]?.click(),i);
// replicate probe: sliders min/mid/max, then buttons in probe order
for(const v of [-5,0,5]){ await setVal(v); await sleep(150); }
const order=[0,1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,5,33];
for(const i of order){ await clickIdx(i); await sleep(120); }
// persistence phase
await setVal(5); await page.evaluate(()=>window.__writes.splice(0));
for(const i of [0,1,2]){ // shell-info, shell-theme, shell-lecture
  await clickIdx(i); await sleep(200);
  const r=await page.evaluate(()=>({val:document.getElementById('sl-q2').value, writes:window.__writes.splice(0)}));
  console.log('after btn',i,JSON.stringify(r));
  if(r.val!=='5') break;
}
await browser.close();
