// Relativistic kinematics flows: merge mass, boost invariance, decay threshold, inquiry.
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

const file = resolve(HERE, '../Relativistic_kinematics.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Relativistic_kinematics';

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
await sleep(700);

const shot = async (label) => {
  await page.screenshot({ path: `${outdir}/${name}__FLOW-${label}.png` });
};

const ui = () => page.evaluate(() => {
  const active = (sel) => Array.from(document.querySelectorAll(sel))
    .filter(b => b.classList.contains('active')).map(b => (b.textContent || '').trim());
  const audit0 = (() => {
    try { return window.__audit.at(0); } catch (e) { return { error: String(e) }; }
  })();
  const shell = document.getElementById('shell');
  return {
    title: document.querySelector('.shell-title')?.textContent,
    lecture: document.getElementById('shell-lecture')?.textContent,
    lectureActive: document.getElementById('shell-lecture')?.classList.contains('active'),
    inquiryCollapsed: shell?.classList.contains('inquiry-collapsed'),
    lectureMode: shell?.classList.contains('lecture-mode'),
    step: document.querySelector('.inq-step.active h4')?.textContent,
    nextDisabled: document.getElementById('inq-next')?.disabled,
    pagerNextDisabled: document.getElementById('inq-pager-next')?.disabled,
    play: document.getElementById('shell-play')?.textContent,
    mode: active('#mode-seg .seg-btn'),
    m1: document.getElementById('r-m1')?.textContent,
    m2: document.getElementById('r-m2')?.textContent,
    v1: document.getElementById('r-v1')?.textContent,
    v2: document.getElementById('r-v2')?.textContent,
    boost: document.getElementById('r-boost')?.textContent,
    Mp: document.getElementById('r-mp')?.textContent,
    mpDisabled: document.getElementById('s-mp')?.disabled,
    frame: document.getElementById('fourmom-frame')?.textContent,
    table: (document.getElementById('fourmom-table')?.innerText || '').slice(0, 500),
    inv: (document.getElementById('invariant-body')?.innerText || '').slice(0, 280),
    rest: (document.getElementById('restenergy-body')?.innerText || '').slice(0, 320),
    dual: document.getElementById('hero-wrap')?.classList.contains('dual'),
    botDisplay: document.getElementById('box-bot') ? getComputedStyle(document.getElementById('box-bot')).display : null,
    audit0,
  };
});

const rec = async (label) => {
  const u = await ui();
  await shot(label);
  return u;
};

const setSlider = (id, val) => page.evaluate(({ id, val }) => {
  const el = document.getElementById(id); if (!el) return;
  el.value = String(val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, { id, val });

const clickText = (sel, includes) => page.evaluate(({ sel, includes }) => {
  const el = Array.from(document.querySelectorAll(sel))
    .find(b => (b.textContent || '').includes(includes));
  if (el) el.click();
}, { sel, includes });

const physics = await page.evaluate(() => {
  // Recompute expected merge / decay with the same formulas as the sim,
  // plus Engine.pint if present.
  const g = 1 / Math.sqrt(1 - 0.8 * 0.8);
  const Mmerge = 2 * g * 1;
  const Mp = 3.33, mA = 1, mB = 1;
  const EA = (Mp * Mp + mA * mA - mB * mB) / (2 * Mp);
  const p = Math.sqrt(Math.max(0, EA * EA - mA * mA));
  const engine = window.Engine && window.Engine.pint
    ? window.Engine.pint.twoBodyDecay(3.33, 1, 1)
    : null;
  return { g, Mmerge, EA, p, vStar: p / EA, engine, hasEngine: !!(window.Engine && window.Engine.pint) };
});

const initial = await rec('00-initial');

// Inquiry should already be visible (lecture off). Only toggle if collapsed.
const needInquiry = await page.evaluate(() =>
  document.getElementById('shell')?.classList.contains('lecture-mode')
    || document.getElementById('shell')?.classList.contains('inquiry-collapsed'));
if (needInquiry) {
  await page.evaluate(() => document.getElementById('shell-lecture')?.click());
  await sleep(250);
}
const inquiryOn = await rec('01-inquiry-shown');

await page.evaluate(() => document.getElementById('shell-play')?.click());
await sleep(1200);
const afterPlay = await rec('02-after-play');

await clickText('#mode-seg .seg-btn', 'Elastic');
await sleep(400);
const elastic = await rec('03-elastic');

await clickText('#mode-seg .seg-btn', 'Decay');
await sleep(400);
const decayOk = await rec('04-decay-ok');

await setSlider('s-mp', 1.5);
await sleep(300);
const decayForbidden = await rec('05-decay-forbidden');

await clickText('#mode-seg .seg-btn', 'Inelastic');
await sleep(200);
await setSlider('s-m1', 1);
await setSlider('s-m2', 1);
await setSlider('s-v1', 0.8);
await setSlider('s-v2', -0.8);
await sleep(200);
const inv0 = await page.evaluate(() => document.getElementById('invariant-body')?.innerText);
await setSlider('s-boost', 0.6);
await sleep(300);
const boosted = await rec('06-boost-0.6');
const invBoost = await page.evaluate(() => document.getElementById('invariant-body')?.innerText);

// Boost to particle-1 rest frame
await setSlider('s-boost', 0.8);
await sleep(250);
const restFrame = await rec('07-boost-v1-rest');

await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(250);
const afterReset = await rec('08-after-reset');

// Persistence: set v1 then switch mode
await setSlider('s-v1', 0.5);
await clickText('#mode-seg .seg-btn', 'Elastic');
await sleep(200);
const persistMode = await rec('09-v1-then-elastic');

await setSlider('s-m1', 4);
await setSlider('s-boost', 0.3);
await sleep(150);
const persistBoost = await rec('10-m1-then-boost');

// Decay + custom M, then Hide Guided Inquiry — params must persist
await clickText('#mode-seg .seg-btn', 'Decay');
await setSlider('s-mp', 1.5);
await sleep(150);
await page.evaluate(() => document.getElementById('shell-lecture')?.click());
await sleep(150);
const afterLecture = await rec('10b-lecture-keeps-decay');

// Inquiry: gated card 2 — pager must NOT skip
await page.evaluate(() => {
  const on = document.getElementById('shell')?.classList.contains('lecture-mode')
    || document.getElementById('shell')?.classList.contains('inquiry-collapsed');
  if (on) document.getElementById('shell-lecture')?.click();
});
await sleep(200);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const onCard2 = await rec('11-card2-gated');
await page.evaluate(() => document.getElementById('inq-pager-next')?.click());
await sleep(150);
const pagerSkip = await rec('12-pager-skip');

await page.evaluate(() => {
  const on = document.getElementById('shell')?.classList.contains('lecture-mode');
  if (on) document.getElementById('shell-lecture')?.click();
});
await sleep(100);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(80);
const stillGated = await ui();
await page.evaluate(() => document.querySelector('.choice[data-correct="1"]')?.click());
await sleep(150);
const afterChoice = await rec('13-after-choice');
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const card3 = await rec('14-card3-boost');
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const card4 = await rec('15-card4-dual');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(250);
const narrow = await rec('16-narrow-1100');
const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

const out = {
  jsErrors: errors,
  physics,
  overflowX,
  initial,
  inquiryOn,
  afterPlay,
  elastic,
  decayOk,
  decayForbidden,
  inv0,
  boosted,
  invBoost,
  restFrame,
  afterReset,
  persistMode,
  persistBoost,
  afterLecture,
  onCard2,
  pagerSkip,
  stillGated: { step: stillGated.step, nextDisabled: stillGated.nextDisabled, pagerNextDisabled: stillGated.pagerNextDisabled },
  afterChoice,
  card3,
  card4,
  narrow: { dual: narrow.dual, overflowX, frame: narrow.frame },
};

writeFileSync(join(outdir, `${name}-flow.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
