// Wu experiment: polarization, asymmetry sign, P→0, fire/mirror reset, pager gate.
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
  join(REPO_ROOT, '/'),
];
const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find(p => existsSync(p));

let puppeteer = null;
for (const base of REQUIRE_BASES) {
  try { puppeteer = createRequire(base)('puppeteer-core'); break; } catch {}
}

const file = resolve(HERE, '../Wu_exp.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Wu_exp';

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
await sleep(800);

const shot = async (label) => {
  await page.screenshot({ path: `${outdir}/${name}__FLOW-${label}.png` });
};

const ui = () => page.evaluate(() => {
  const audit = (arg) => {
    try { return window.__audit.at(arg); } catch (e) { return { error: String(e) }; }
  };
  const shell = document.getElementById('shell');
  const play = document.getElementById('shell-play');
  const fire = document.getElementById('fire-btn');
  const mirror = document.getElementById('mirror-btn');
  return {
    title: document.querySelector('.shell-title')?.textContent?.trim(),
    caption: document.getElementById('scene-caption')?.textContent?.trim(),
    lectureMode: shell?.classList.contains('lecture-mode'),
    inquiryCollapsed: shell?.classList.contains('inquiry-collapsed'),
    playVisible: play ? getComputedStyle(play).display !== 'none' : null,
    playLabel: play?.textContent?.trim(),
    step: document.querySelector('.inq-step.active h4')?.textContent,
    nextDisabled: document.getElementById('inq-next')?.disabled,
    pagerNextDisabled: document.getElementById('inq-pager-next')?.disabled,
    B: document.getElementById('B')?.value,
    T: document.getElementById('T')?.value,
    Bval: document.getElementById('B-val')?.textContent,
    Tval: document.getElementById('T-val')?.textContent,
    P: document.getElementById('P-val')?.textContent,
    BT: document.getElementById('BT-val')?.textContent,
    Nup: document.getElementById('N-up')?.textContent,
    Ndown: document.getElementById('N-down')?.textContent,
    asym: document.getElementById('asym-val')?.textContent,
    pred: document.getElementById('asym-pred')?.textContent,
    fireLabel: fire?.textContent?.trim(),
    mirrorLabel: mirror?.textContent?.trim(),
    mirrorActive: mirror?.classList.contains('active'),
    nSpins: (audit(0) || {}).nSpins,
    firing: (audit(0) || {}).firing,
    showMirror: (audit(0) || {}).showMirror,
    audit0: audit(0),
    auditDefault: audit({ B: 5, T: 0.003 }),
    auditP0: audit({ B: 0, T: 1 }),
    auditHot: audit({ B: 5, T: 1 }),
  };
});

const rec = async (label) => {
  const u = await ui();
  await shot(label);
  return u;
};

const setSlider = async (id, val) => {
  await page.evaluate((id, val) => {
    const el = document.getElementById(id);
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, id, val);
};

const expected = await page.evaluate(() => {
  const A = -1, beta = 0.6, J = 5;
  const mu = 3.799 * window.Engine.weak.NUCLEAR_MAGNETON_EV_PER_TESLA;
  const at = (B, T) => {
    const pol = window.Engine.weak.nuclearPolarization(mu, B, T, J);
    const asym = window.Engine.weak.parityAsymmetry(A, pol.polarization, beta);
    return {
      P: pol.polarization,
      BT: pol.fieldOverTemperature,
      polarAsym: asym.asymmetry,
      hemisphereAsym: asym.asymmetry / 2,
      W0: window.Engine.weak.wuAngularDistribution(A, pol.polarization, beta, 0).intensity,
      Wpi: window.Engine.weak.wuAngularDistribution(A, pol.polarization, beta, Math.PI).intensity,
    };
  };
  return { def: at(5, 0.003), zeroB: at(0, 0.003), hot: at(5, 1) };
});

const initial = await rec('00-initial');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const card2 = await rec('01-card2-gated');
await page.evaluate(() => document.getElementById('inq-pager-next')?.click());
await sleep(150);
const pagerSkip = await rec('02-pager-skip');

await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
await sleep(100);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const card3 = await rec('03-cluster');

await setSlider('B', 10);
await sleep(100);
const Bmax = await rec('04-Bmax');

await setSlider('B', 0);
await sleep(100);
const Bzero = await rec('05-Bzero');

await setSlider('B', 5);
await setSlider('T', 0);
await sleep(100);
const hot = await rec('06-hot-1K');

await setSlider('T', -2.523);
await sleep(100);

await page.click('#fire-btn');
await sleep(8000);
const firing = await rec('07-firing-2.5s');

await page.click('#fire-btn');
await sleep(200);
const afterStop = await rec('08-after-stop-click');

await page.click('#mirror-btn');
await sleep(300);
const mirrorOn = await rec('09-mirror-on');
await page.click('#mirror-btn');
await sleep(200);
const mirrorOff = await rec('10-mirror-second-click');

await setSlider('B', 8);
await sleep(50);
await page.click('#fire-btn');
await sleep(150);
const persistB = await rec('11-B8-then-fire');

await page.click('#clear-btn');
await sleep(150);
const afterClear = await rec('12-after-clear');

await page.click('#shell-reset');
await sleep(200);
const afterReset = await rec('13-after-reset');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(250);
const narrow = await rec('14-narrow-1100');
const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

const out = {
  jsErrors: errors,
  overflowX,
  expected,
  initial, card2, pagerSkip, card3,
  Bmax, Bzero, hot,
  firing, afterStop,
  mirrorOn, mirrorOff, persistB, afterClear, afterReset, narrow,
};

writeFileSync(join(outdir, `${name}-flow.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
