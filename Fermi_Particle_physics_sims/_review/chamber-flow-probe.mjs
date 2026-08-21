// One-off cloud-chamber flow + physics probe.
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const REQUIRE_BASES = [
  join(HERE, '/'),
  join(REPO_ROOT, '_review/'),
  join(REPO_ROOT, 'Capacity_SR_sims_v2_engine/_review/'),
];
const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find(p => existsSync(p));

let puppeteer = null;
for (const base of REQUIRE_BASES) {
  try { puppeteer = createRequire(base)('puppeteer-core'); break; } catch {}
}

const file = resolve(HERE, '../Charged_particle_in_a_magnetic_field_v2.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Charged_particle_in_a_magnetic_field_v2';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => {
  if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text());
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle2', timeout: 20000 });
await sleep(1200);

const shot = async (label) => {
  await page.screenshot({ path: `${outdir}/${name}__FLOW-${label}.png` });
};
const ui = () => page.evaluate(() => {
  const active = sel => Array.from(document.querySelectorAll(sel + ' .seg-btn.active')).map(b => (b.dataset.particle || b.dataset.dir || b.textContent).trim());
  return {
    particle: active('#particle-seg')[0],
    dir: active('#dir-seg')[0],
    ke: document.getElementById('ke')?.value,
    keLabel: document.getElementById('ke-val')?.textContent,
    B: document.getElementById('bfield')?.value,
    bLabel: document.getElementById('b-val')?.textContent,
    p: document.getElementById('stat-p')?.textContent,
    r: document.getElementById('stat-r')?.textContent,
    curl: document.getElementById('stat-curl')?.textContent,
    ghostP: document.getElementById('stat-ghost-p')?.textContent,
    match: document.getElementById('stat-match')?.textContent,
    ghostBox: document.getElementById('ghost-box')?.style.display,
    plate: document.getElementById('lead-plate')?.checked,
    play: document.getElementById('shell-play')?.textContent,
    step: document.querySelector('.inq-step.active h4')?.textContent,
  };
});

const rec = async (label, extra) => {
  const state = { label, ...(await ui()), ...extra, errors: errors.slice() };
  log.push(state);
  await shot(label);
  return state;
};
const log = [];

const clickText = async (sel, text) => {
  await page.evaluate(({ sel, text }) => {
    const el = Array.from(document.querySelectorAll(sel)).find(b => (b.textContent || '').includes(text));
    el?.click();
  }, { sel, text });
};

await rec('00-initial-playing');

const auditDefault = await page.evaluate(() => {
  const a = window.__audit;
  let at;
  try { at = a.at({ massMeV: 0.5109989, chargeUnits: -1, kineticEnergyMeV: 5, fieldTesla: 0.5 }); }
  catch (e) { at = { error: String(e) }; }
  let at0;
  try { at0 = a.at(0); } catch (e) { at0 = { error: String(e) }; }
  const engineCurl = window.Engine?.pdet?.trackCurvatureDirection?.(-1, 'out-of-screen');
  const engineCurlPos = window.Engine?.pdet?.trackCurvatureDirection?.(+1, 'out-of-screen');
  const engineR = window.Engine?.pdet?.magneticTrackRadiusMetres?.(0.005487, 1, 0.5);
  return { at, at0, engineCurl, engineCurlPos, engineR };
});

// Pause, then screenshot a developed track
await page.evaluate(() => document.getElementById('shell-play')?.click());
await sleep(200);
await rec('01-paused-electron');

// Positron
await clickText('#particle-seg .seg-btn', 'e⁺');
await page.evaluate(() => document.getElementById('shell-play')?.click());
await sleep(900);
await page.evaluate(() => document.getElementById('shell-play')?.click());
const positron = await rec('02-positron');

// Persistence: positron + KE=100, then change B — does particle snap to electron?
await clickText('#particle-seg .seg-btn', 'e⁺');
await page.evaluate(() => {
  const ke = document.getElementById('ke');
  ke.value = 100;
  ke.dispatchEvent(new Event('input', { bubbles: true }));
  ke.dispatchEvent(new Event('change', { bubbles: true }));
});
await sleep(200);
const afterKe = await rec('03-positron-then-KE100');
await page.evaluate(() => {
  const b = document.getElementById('bfield');
  b.value = 1.0;
  b.dispatchEvent(new Event('input', { bubbles: true }));
  b.dispatchEvent(new Event('change', { bubbles: true }));
});
await sleep(200);
const afterB = await rec('04-after-B-change');

// Dir flip persistence of KE/particle
await clickText('#particle-seg .seg-btn', 'μ⁻');
await page.evaluate(() => {
  const ke = document.getElementById('ke');
  ke.value = 50;
  ke.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(150);
await clickText('#dir-seg .seg-btn', 'Into screen');
await sleep(200);
const afterDir = await rec('05-muon-then-flip-Bdir');

// Reset then proton vs electron radius at same KE
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(400);
await clickText('#particle-seg .seg-btn', 'p⁺');
await page.evaluate(() => document.getElementById('shell-play')?.click());
await sleep(800);
const proton = await rec('06-proton-5MeV');

await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(200);
await clickText('#particle-seg .seg-btn', 'n');
await sleep(400);
const neutron = await rec('07-neutron');

// Ghost step: walk inquiry to step 5 (index 4)
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(200);
// answer gates: step 2 (index 1) and step 4 (index 3)
const walkInquiry = async () => {
  for (let s = 0; s < 6; s++) {
    const gated = await page.evaluate(() => {
      const card = document.querySelector('.inq-step.active');
      return !!(card && card.hasAttribute('data-gate') && !card.hasAttribute('data-ready') && !card.hasAttribute('data-answered'));
    });
    if (gated) {
      await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
      await sleep(150);
    }
    const title = await page.evaluate(() => document.querySelector('.inq-step.active h4')?.textContent);
    await rec(`inq-${s}-${(title || 'step').slice(0, 24).replace(/[^\w.-]+/g, '_')}`);
    if (s === 4) break; // capture ghost step then continue
    await page.evaluate(() => document.getElementById('inq-next')?.click());
    await sleep(250);
  }
};
await walkInquiry();
const ghostBefore = await rec('08-ghost-step');
await page.evaluate(() => {
  const ke = document.getElementById('ke');
  ke.value = 80;
  ke.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
const ghostAfterKe = await rec('09-ghost-after-KE-scrub');

// Same p as muon ghost (~68 MeV/c) but opposite charge must NOT match
await clickText('#particle-seg .seg-btn', 'p⁺');
await page.evaluate(() => {
  const ke = document.getElementById('ke');
  ke.value = 2.5;
  ke.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
const ghostProton = await rec('09b-ghost-proton-opposite-curl');
await clickText('#particle-seg .seg-btn', 'e⁻');
await page.evaluate(() => {
  const ke = document.getElementById('ke');
  ke.value = 67.5;
  ke.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
const ghostElectronMatch = await rec('09c-ghost-electron-same-p');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(250);
await rec('10-step6-before-flip');
await clickText('#dir-seg .seg-btn', 'Into screen');
await sleep(400);
const ghostFlip = await rec('11-step6-after-flip-dir');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(400);
await rec('12-narrow-no-modal');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(300);
const plateStep = await rec('13-step7-plate');

writeFileSync(`${outdir}/${name}-flow.json`, JSON.stringify({
  errors, log, auditDefault, positron, afterKe, afterB, afterDir, proton, neutron, ghostBefore, ghostAfterKe, ghostProton, ghostElectronMatch, ghostFlip, plateStep,
}, null, 2));
console.log(JSON.stringify({
  jsErrors: errors,
  auditDefault,
  initial: log[0],
  positron: { particle: positron.particle, curl: positron.curl, r: positron.r, p: positron.p },
  afterKe: { particle: afterKe.particle, ke: afterKe.ke, p: afterKe.p, r: afterKe.r, curl: afterKe.curl },
  afterB: { particle: afterB.particle, B: afterB.B, p: afterB.p, r: afterB.r },
  afterDir: { particle: afterDir.particle, dir: afterDir.dir, ke: afterDir.ke },
  proton: { particle: proton.particle, r: proton.r, p: proton.p, curl: proton.curl },
  neutron: { r: neutron.r, curl: neutron.curl },
  ghostBefore: { ghostBox: ghostBefore.ghostBox, ghostP: ghostBefore.ghostP, step: ghostBefore.step },
  ghostAfterKe: { ghostBox: ghostAfterKe.ghostBox, ghostP: ghostAfterKe.ghostP, particle: ghostAfterKe.particle, ke: ghostAfterKe.ke, p: ghostAfterKe.p },
  ghostProton: { particle: ghostProton.particle, match: ghostProton.match, p: ghostProton.p },
  ghostElectronMatch: { particle: ghostElectronMatch.particle, match: ghostElectronMatch.match, p: ghostElectronMatch.p },
  ghostFlip: { dir: ghostFlip.dir, curl: ghostFlip.curl, ghostP: ghostFlip.ghostP },
  plateStep: { plate: plateStep.plate, step: plateStep.step },
}, null, 2));
await browser.close();
