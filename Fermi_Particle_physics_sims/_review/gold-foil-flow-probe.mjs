// Gold-foil flows: Rutherford numbers, plum-pudding vs nuclear, slider/mode persistence, inquiry.
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

const file = resolve(HERE, '../Gold_foil_exp_v3.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Gold_foil_exp_v3';

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
  const active = (sel) => Array.from(document.querySelectorAll(sel))
    .filter(b => b.classList.contains('active')).map(b => (b.textContent || '').trim());
  const audit0 = (() => {
    try { return window.__audit.at(0); } catch (e) { return { error: String(e) }; }
  })();
  const auditOk = (() => {
    try {
      return window.__audit.at({ z1: 2, z2: 79, kineticEnergyMeV: 7.7, thetaDegrees: 90 });
    } catch (e) { return { error: String(e) }; }
  })();
  return {
    step: document.querySelector('.inq-step.active h4')?.textContent,
    nextDisabled: document.getElementById('inq-next')?.disabled,
    pagerNextDisabled: document.getElementById('inq-pager-next')?.disabled,
    caption: document.getElementById('mode-caption')?.textContent,
    ke: document.getElementById('ke')?.value,
    keVal: document.getElementById('ke-val')?.textContent,
    z: document.getElementById('z')?.value,
    zVal: document.getElementById('z-val')?.textContent,
    b: document.getElementById('b')?.value,
    bVal: document.getElementById('b-val')?.textContent,
    rMin: document.getElementById('r-min')?.textContent,
    thetaSingle: document.getElementById('theta-single')?.textContent,
    thetaThomson: document.getElementById('theta-thomson')?.textContent,
    dsig90: document.getElementById('dsig-90')?.textContent,
    nFired: document.getElementById('n-fired')?.textContent,
    nHits: document.getElementById('n-hits')?.textContent,
    model: active('[data-model]'),
    mode: active('[data-mode]'),
    play: document.getElementById('shell-play')?.textContent,
    audit0,
    auditOk,
  };
});

const setSlider = (id, val) => page.evaluate(({ id, val }) => {
  const el = document.getElementById(id); if (!el) return;
  el.value = String(val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, { id, val });

const clickText = async (sel, includes) => {
  await page.evaluate(({ sel, includes }) => {
    const el = Array.from(document.querySelectorAll(sel))
      .find(b => (b.textContent || '').includes(includes));
    if (el) el.click();
  }, { sel, includes });
};

const rec = async (label) => {
  const u = await ui();
  await shot(label);
  return u;
};

const clickPlay = () => page.evaluate(() => {
  const b = document.getElementById('shell-play');
  if (b && /play/i.test(b.textContent || '')) b.click();
});

// --- Engine numbers ---
const physics = await page.evaluate(() => {
  const pint = window.Engine.pint;
  const rows = {};
  const ke = 7.7, z1 = 2, z2 = 79;
  rows.d77 = pint.distanceOfClosestApproachFm(z1, z2, ke).distanceFm;
  rows.dsig90 = pint.rutherfordDifferentialCrossSection(z1, z2, ke, Math.PI / 2).differentialCrossSectionFm2PerSr;
  rows.dsig90_E20 = pint.rutherfordDifferentialCrossSection(z1, z2, 20, Math.PI / 2).differentialCrossSectionFm2PerSr;
  rows.dsig90_E1 = pint.rutherfordDifferentialCrossSection(z1, z2, 1, Math.PI / 2).differentialCrossSectionFm2PerSr;
  rows.dsig90_C = pint.rutherfordDifferentialCrossSection(z1, 6, ke, Math.PI / 2).differentialCrossSectionFm2PerSr;
  rows.b50 = pint.impactParameterFm(z1, z2, ke, 2 * Math.atan(rows.d77 / (2 * 50))).impactParameterFm;
  rows.thetaFromB50 = 2 * Math.atan(rows.d77 / (2 * 50)) * 180 / Math.PI;
  rows.thomson = pint.thomsonModelMaxDeflectionRad(z1, z2, ke, 1.35e5);
  rows.ratioE = rows.dsig90_E1 / rows.dsig90_E20; // expect 400
  rows.ratioZ = rows.dsig90 / rows.dsig90_C; // expect (79/6)^2
  const sin4 = Math.pow(Math.sin(Math.PI / 4), 4);
  const a = z1 * z2 * 1.43996454 / (4 * ke);
  rows.dsig90_hand = (a * a) / sin4;
  return rows;
});

const initial = await rec('00-initial');

await clickText('[data-model]', 'Plum pudding');
await clickPlay();
await sleep(1400);
const plumBeam = await rec('01-plum-beam');

await clickText('[data-model]', 'Nuclear');
await sleep(1800);
const nuclearBeam = await rec('02-nuclear-beam');

const hist = await page.evaluate(() => {
  // peek via __audit isn't enough; scrape canvas is hard. Re-read nHits and fire more.
  return {
    nFired: document.getElementById('n-fired')?.textContent,
    nHits: document.getElementById('n-hits')?.textContent,
  };
});

// Large-angle presence: keep nuclear running, sample counts by firing many via time
await sleep(2500);
const nuclearLong = await rec('03-nuclear-long');
const bins = await page.evaluate(() => {
  // No public bins. Infer large-angle from flashes / we inject a sampler copy.
  const pint = window.Engine.pint;
  const ke = parseFloat(document.getElementById('ke').value);
  const Z = parseFloat(document.getElementById('z').value);
  const BIN_MIN = 5, BIN_MAX = 175, BIN_STEP = 5;
  const BINS = Math.round((BIN_MAX - BIN_MIN) / BIN_STEP);
  const counts = new Array(BINS).fill(0);
  const cross = (th) => pint.rutherfordDifferentialCrossSection(2, Z, ke, th).differentialCrossSectionFm2PerSr;
  const thMin = BIN_MIN * Math.PI / 180, thMax = BIN_MAX * Math.PI / 180;
  const wMax = cross(thMin) * Math.sin(thMin);
  const sample = () => {
    for (let i = 0; i < 200; i++) {
      const th = thMin + Math.random() * (thMax - thMin);
      const w = cross(th) * Math.sin(th);
      if (Math.random() * wMax < w) return th * 180 / Math.PI;
    }
    return thMin * 180 / Math.PI;
  };
  for (let n = 0; n < 8000; n++) {
    const ang = sample();
    const bin = Math.min(BINS - 1, Math.floor((ang - BIN_MIN) / BIN_STEP));
    counts[bin]++;
  }
  const binDeg = (i) => BIN_MIN + (i + 0.5) * BIN_STEP;
  const gt90 = counts.reduce((s, c, i) => s + (binDeg(i) >= 90 ? c : 0), 0);
  const gt150 = counts.reduce((s, c, i) => s + (binDeg(i) >= 150 ? c : 0), 0);
  const forward = counts.slice(0, 3).reduce((a, b) => a + b, 0);
  return { n: 8000, gt90, gt150, forward, maxBin: binDeg(counts.indexOf(Math.max(...counts))) };
});

const thomsonHits = await page.evaluate(() => {
  const pint = window.Engine.pint;
  const ke = 7.7, Z = 79;
    const thMax = pint.thomsonModelMaxDeflectionRad(2, Z, ke, 1.00e5).thetaRad;
  let nAbove5 = 0, nAbove1 = 0, maxDeg = 0;
  for (let n = 0; n < 20000; n++) {
    const u1 = Math.random(), u2 = Math.random();
    const g = Math.sqrt(-2 * Math.log(u1 + 1e-12)) * Math.cos(2 * Math.PI * u2);
    const th = Math.abs(g) * thMax * 0.5;
    const deg = th * 180 / Math.PI;
    if (deg > maxDeg) maxDeg = deg;
    if (deg >= 1) nAbove1++;
    if (deg >= 5) nAbove5++;
  }
  return { n: 20000, nAbove5, nAbove1, maxDeg, thMaxRad: thMax };
});

await clickText('[data-mode]', 'Single shot');
await sleep(400);
const single = await rec('04-single-nuclear');

await setSlider('b', 0);
await sleep(300);
const b0 = await rec('05-single-b0');

await clickText('[data-mode]', 'Single shot');
await sleep(200);
await clickText('[data-model]', 'Plum pudding');
await sleep(400);
const plumSingle = await rec('06-single-plum');

await setSlider('b', 50);
await sleep(250);
const plumThenB = await rec('07-plum-then-b');

await clickText('[data-model]', 'Plum pudding');
await clickText('[data-mode]', 'Single shot');
await sleep(200);
await setSlider('ke', 20);
await sleep(200);
const plumThenKe = await rec('08-plum-then-ke');

await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(300);
const afterReset = await rec('09-after-reset');

await setSlider('ke', 20);
await sleep(200);
const ke20 = await rec('10-ke-20');
await setSlider('ke', 1);
await sleep(200);
const ke1 = await rec('11-ke-1');
await setSlider('z', 6);
await sleep(200);
const z6 = await rec('12-z-6');

// Inquiry pager vs Next on gated card 2
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(200);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const onCard2 = await rec('13-card2-gated');
await page.evaluate(() => document.getElementById('inq-pager-next')?.click());
await sleep(150);
const pagerSkip = await rec('14-pager-skip');

await page.evaluate(() => {
  const next = document.getElementById('inq-next');
  if (next) next.click();
});
await sleep(100);
const nextBlocked = await ui();

// Walk to card 5 (index 4) via answering
await page.evaluate(() => document.querySelector('.choice[data-correct]')?.click());
await sleep(150);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
await page.evaluate(() => document.querySelector('.choice[data-correct]')?.click());
await sleep(150);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(400);
const card5 = await rec('15-card5-bound');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(200);
const card6 = await rec('16-card6');

await page.evaluate(() => document.getElementById('shell-lecture')?.click());
await sleep(200);
const afterLecture = await rec('17-hide-inquiry');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(250);
const narrow = await rec('18-narrow-1100');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

const out = {
  jsErrors: errors,
  physics,
  bins,
  thomsonHits,
  overflowX: overflow,
  initial,
  plumBeam,
  nuclearBeam,
  hist,
  nuclearLong,
  single,
  b0,
  plumSingle,
  plumThenB,
  plumThenKe,
  afterReset,
  ke20,
  ke1,
  z6,
  onCard2,
  pagerSkip,
  nextBlocked: { step: nextBlocked.step, nextDisabled: nextBlocked.nextDisabled, pagerNextDisabled: nextBlocked.pagerNextDisabled },
  card5,
  card6,
  afterLecture,
  narrow: { caption: narrow.caption, overflowX: overflow },
};

writeFileSync(join(outdir, `${name}-flow.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
