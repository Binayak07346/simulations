// Scale-of-universe flows: E–λ coupling, landmarks, force badges, inquiry gates.
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

const file = resolve(HERE, '../Scale_of_universe.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Scale_of_universe';

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
  return {
    title: document.querySelector('.shell-title')?.textContent?.trim(),
    lectureMode: shell?.classList.contains('lecture-mode'),
    inquiryCollapsed: shell?.classList.contains('inquiry-collapsed'),
    timeless: shell?.classList.contains('no-transport'),
    playVisible: play ? getComputedStyle(play).display !== 'none' : null,
    step: document.querySelector('.inq-step.active h4')?.textContent,
    nextDisabled: document.getElementById('inq-next')?.disabled,
    pagerNextDisabled: document.getElementById('inq-pager-next')?.disabled,
    logL: document.getElementById('logL')?.value,
    logLVal: document.getElementById('logL-val')?.textContent,
    logE: document.getElementById('logE')?.value,
    logEVal: document.getElementById('logE-val')?.textContent,
    logLMin: document.getElementById('logL')?.min,
    logLMax: document.getElementById('logL')?.max,
    audit0: audit(0),
    auditAtom: audit({ logL: -10 }),
    auditNucleus: audit({ logL: -14 }),
    auditProton: audit({ logL: -15 }),
    auditQuark: audit({ logL: -18 }),
    auditHair: audit({ logL: -4 }),
    auditPm: audit({ logL: -11 }),
    auditEarth: audit({ logL: 7 }),
    auditHuman: audit({ logL: 0 }),
  };
});

const rec = async (label) => {
  const u = await ui();
  await shot(label);
  return u;
};

const setLogL = (val) => page.evaluate((val) => {
  const el = document.getElementById('logL');
  el.value = String(val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, val);

const initial = await rec('00-initial');

const physics = await page.evaluate(() => {
  const HBAR = 1.054571817e-34, EV = 1.602176634e-19, C = 2.99792458e8;
  const hc_eV_m = 2 * Math.PI * HBAR * C / EV; // hc in eV·m
  const hbarc_eV_m = HBAR * C / EV;
  const at = (logL) => {
    const lambda = Math.pow(10, logL);
    const p = 2 * Math.PI * HBAR / lambda;
    const E = p * C;
    const L_fm = lambda / 1e-15;
    return {
      logL, lambda,
      E_eV: E / EV,
      E_GeV_hc: (E / EV) / 1e9,
      E_GeV_hbarc: 0.197327 / L_fm,
      p_eVc: p * C / EV,
      hc_over_lambda_eV: hc_eV_m / lambda,
      hbarc_over_lambda_eV: hbarc_eV_m / lambda,
    };
  };
  return {
    atom: at(-10),
    proton: at(-15),
    quark: at(-18),
    hair: at(-4),
    hc_eV_m, hbarc_eV_m,
  };
});

await setLogL(7);
await sleep(200);
const earth = await rec('00b-earth');

await setLogL(0);
await sleep(200);
const human = await rec('00c-human');

await setLogL(-4);
await sleep(200);
const hair = await rec('01-hair');

await setLogL(-10);
await sleep(200);
const atom = await rec('02-atom');

const energySlider = await page.evaluate(() => {
  const el = document.getElementById('logE');
  if (!el) return { missing: true };
  const beforeL = document.getElementById('logL').value;
  el.value = el.max;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  const afterL = +document.getElementById('logL').value;
  const afterE = +el.value;
  return { beforeL: +beforeL, afterL, afterE, maxE: +el.max, minE: +el.min };
});
await sleep(150);
const afterLogE = await rec('02b-logE-to-quark');
await setLogL(-10);
await sleep(100);

await setLogL(-11);
await sleep(200);
const atPm = await rec('03-log-11');

await setLogL(-14);
await sleep(200);
const nucleus = await rec('04-nucleus');

await setLogL(-15);
await sleep(200);
const proton = await rec('05-proton');

await setLogL(-18);
await sleep(200);
const quark = await rec('06-quark');

await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(200);
const afterReset = await rec('07-after-reset');

await setLogL(-15);
await sleep(100);
await page.evaluate(() => document.getElementById('shell-lecture')?.click());
await sleep(200);
const afterLecture = await rec('08-after-lecture');

await page.evaluate(() => {
  const on = document.getElementById('shell')?.classList.contains('lecture-mode')
    || document.getElementById('shell')?.classList.contains('inquiry-collapsed');
  if (on) document.getElementById('shell-lecture')?.click();
});
await sleep(200);
const onCard1 = await rec('09-card1-gated');
await page.evaluate(() => document.getElementById('inq-pager-next')?.click());
await sleep(150);
const pagerSkip = await rec('10-pager-skip');

await page.evaluate(() => {
  const on = document.getElementById('shell')?.classList.contains('lecture-mode')
    || document.getElementById('shell')?.classList.contains('inquiry-collapsed');
  if (on) document.getElementById('shell-lecture')?.click();
});
await sleep(100);
const stillOn1 = await ui();
await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
await sleep(150);
const afterChoice = await rec('11-after-choice');
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const card2 = await rec('12-card2');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(250);
const narrow = await rec('13-narrow-1100');
const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

const out = {
  jsErrors: errors,
  physics,
  overflowX,
  energySlider,
  initial, earth, human,
  hair, atom, atPm, nucleus, proton, quark,
  afterReset, afterLecture,
  onCard1, pagerSkip,
  stillOn1: { step: stillOn1.step, nextDisabled: stillOn1.nextDisabled, pagerNextDisabled: stillOn1.pagerNextDisabled },
  afterChoice, card2, narrow,
};

writeFileSync(join(outdir, `${name}-flow.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
