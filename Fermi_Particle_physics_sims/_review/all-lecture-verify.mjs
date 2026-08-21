import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE,'../..'),'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox'] });
const files=["Build_Baryon","Charged_particle_in_a_magnetic_field_v2","Eigenfold_way_v2","Feynmann_diagram_sandbox","Gold_foil_exp_v3","Relativistic_kinematics","Scale_of_universe","Standard_model","Wu_exp"];
const R={};
for(const f of files){
  const page = await browser.newPage(); await page.setViewport({width:1440,height:900});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
  try{
    await page.goto(pathToFileURL(resolve(HERE,`../${f}.html`)).href,{waitUntil:'networkidle2',timeout:20000});
    await new Promise(r=>setTimeout(r,1500));
    R[f] = await page.evaluate(()=>{
      const shell=document.getElementById('shell');
      const inq=document.getElementById('aside-inquiry');
      const btn=document.getElementById('shell-lecture');
      const inqHidden = !inq || inq.offsetParent===null || getComputedStyle(inq).display==='none' ||
                        shell.classList.contains('lecture-mode') || shell.classList.contains('inquiry-collapsed');
      // canvas non-blank check: any canvas with drawn pixels
      let drawn=false;
      for(const c of document.querySelectorAll('canvas')){
        try{const x=c.getContext('2d');const d=x.getImageData(0,0,Math.min(c.width,400),Math.min(c.height,300)).data;
          for(let i=0;i<d.length;i+=397){if(d[i+3]>0&&(d[i]|d[i+1]|d[i+2])>0){drawn=true;break;}}
        }catch(e){}
        if(drawn)break;
      }
      return { inqHidden, btnActive: btn?btn.classList.contains('active'):null, btnLabel: btn?btn.textContent.trim().slice(0,26):null, drawn };
    });
    R[f].errors=errors.length;
  }catch(e){ R[f]={fail:String(e).slice(0,80)}; }
  await page.close();
}
console.log(JSON.stringify(R,null,1));
await browser.close();
