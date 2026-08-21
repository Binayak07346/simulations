import { createRequire } from 'node:module';
import { writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REQUIRE_BASES = [
  join(HERE, '/'),
  join(HERE, '../../_review/'),
  join(HERE, '../../Capacity_SR_sims_v2_engine/_review/'),
];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let puppeteer;
for (const base of REQUIRE_BASES) {
  try { puppeteer = createRequire(base)('puppeteer-core'); break; } catch {}
}

const file = resolve(HERE, '../Charged_particle_in_a_magnetic_field_v2.html');
const outdir = resolve(HERE, 'probe-out');
const name = 'Charged_particle_in_a_magnetic_field_v2';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle2', timeout: 20000 });
await sleep(800);

const ensurePlaying = async () => {
  await page.evaluate(() => {
    const b = document.getElementById('shell-play');
    if (b && /Play/.test(b.textContent || '')) b.click();
  });
};

const setParticle = async (label) => {
  await page.evaluate((label) => {
    const el = Array.from(document.querySelectorAll('#particle-seg .seg-btn'))
      .find(b => (b.textContent || '').includes(label));
    el?.click();
  }, label);
};

const setSlider = async (id, value) => {
  await page.evaluate(({ id, value }) => {
    const el = document.getElementById(id);
    el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { id, value });
};

const snap = async (label) => {
  await ensurePlaying();
  await sleep(700);
  const data = await page.evaluate(() => ({
    particle: document.querySelector('#particle-seg .seg-btn.active')?.dataset.particle,
    ke: document.getElementById('ke')?.value,
    B: document.getElementById('bfield')?.value,
    dir: document.querySelector('#dir-seg .seg-btn.active')?.dataset.dir,
    p: document.getElementById('stat-p')?.textContent,
    r: document.getElementById('stat-r')?.textContent,
    curl: document.getElementById('stat-curl')?.textContent,
    ghostBox: document.getElementById('ghost-box')?.style.display,
    ghostP: document.getElementById('stat-ghost-p')?.textContent,
    match: document.getElementById('stat-match')?.textContent,
    play: document.getElementById('shell-play')?.textContent,
  }));
  await page.screenshot({ path: `${outdir}/${name}__PLAY-${label}.png` });
  return { label, ...data };
};

const results = {};
results.e_default = await snap('e-5MeV-0.5T');
await setParticle('e⁺');
results.eplus = await snap('eplus-5MeV-0.5T');
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(300);
await setParticle('p⁺');
results.proton = await snap('proton-5MeV-0.5T');
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(300);
await setParticle('μ⁻');
results.muon = await snap('muon-5MeV-0.5T');
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(300);
await setSlider('bfield', 2);
results.e_B2 = await snap('e-5MeV-2T');
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(300);
await setSlider('bfield', 0.05);
results.e_Bmin = await snap('e-5MeV-0.05T');
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(300);
await setSlider('ke', 500);
results.e_KEmax = await snap('e-500MeV-0.5T');

// Ghost while playing: walk to step 5
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(250);
for (let i = 0; i < 4; i++) {
  await page.evaluate(() => {
    const card = document.querySelector('.inq-step.active');
    if (card && card.hasAttribute('data-gate')) {
      card.querySelector('.choice[data-correct]')?.click();
    }
    document.getElementById('inq-next')?.click();
  });
  await sleep(200);
}
results.ghost = await snap('ghost-step-playing');

writeFileSync(`${outdir}/${name}-playnums.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
