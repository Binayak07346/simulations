// Standard Model explorer: tile clicks, Lagrangian terms, PDG dump, pager gate.
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

const file = resolve(HERE, '../Standard_model.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Standard_model';

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
  const detail = document.getElementById('detail-body')?.innerText?.trim();
  const detailTitle = document.getElementById('detail-title')?.textContent?.trim();
  return {
    title: document.querySelector('.shell-title')?.textContent?.trim(),
    plotTitle: document.getElementById('plot-title')?.textContent?.trim(),
    lectureMode: shell?.classList.contains('lecture-mode'),
    inquiryCollapsed: shell?.classList.contains('inquiry-collapsed'),
    timeless: shell?.classList.contains('no-transport'),
    playVisible: play ? getComputedStyle(play).display !== 'none' : null,
    step: document.querySelector('.inq-step.active h4')?.textContent,
    nextDisabled: document.getElementById('inq-next')?.disabled,
    pagerNextDisabled: document.getElementById('inq-pager-next')?.disabled,
    modeTable: document.getElementById('mode-table')?.classList.contains('active'),
    modeLagr: document.getElementById('mode-lagr')?.classList.contains('active'),
    detailTitle,
    detail,
    audit0: audit(0),
    auditElectron: audit({ id: 'electron' }),
    auditTop: audit({ id: 'top' }),
    auditHiggs: audit({ id: 'higgs' }),
    auditPhoton: audit({ id: 'photon' }),
    auditNu: audit({ id: 'electron-neutrino' }),
    auditW: audit({ id: 'w-plus' }),
  };
});

const rec = async (label) => {
  const u = await ui();
  await shot(label);
  return u;
};

const CANON = {
  electron: { massGeV: 0.00051099895, charge: -1, spin: 0.5, year: 1897 },
  muon: { massGeV: 0.1057, charge: -1, spin: 0.5, year: 1936 },
  tau: { massGeV: 1.777, charge: -1, spin: 0.5, year: 1975 },
  top: { massGeV: 172.7, charge: 2 / 3, spin: 0.5, year: 1995 },
  'w-plus': { massGeV: 80.4, charge: 1, spin: 1, year: 1983 },
  'z-boson': { massGeV: 91.2, charge: 0, spin: 1, year: 1983 },
  higgs: { massGeV: 125, charge: 0, spin: 0, year: 2012 },
  'tau-neutrino': { massGeV: 0, charge: 0, spin: 0.5, year: 2000 },
  photon: { massGeV: 0, charge: 0, spin: 1, year: 1905 },
};

const pdataDump = await page.evaluate((canon) => {
  const pdata = window.Engine.pdata;
  const SM_IDS = [
    'up', 'charm', 'top', 'down', 'strange', 'bottom',
    'electron', 'muon', 'tau',
    'electron-neutrino', 'muon-neutrino', 'tau-neutrino',
    'photon', 'gluon', 'w-plus', 'w-minus', 'z-boson', 'higgs',
  ];
  const allIds = pdata.particleIds();
  const all = allIds.map(id => {
    const p = pdata.particle(id);
    return {
      id: p.id, display: p.display, family: p.family, generation: p.generation,
      massGeV: p.massGeV, charge: p.charge, spin: p.spin, year: p.discoveredYear,
    };
  });
  const sm = SM_IDS.map(id => pdata.particle(id)).map(p => ({
    id: p.id, display: p.display, family: p.family, generation: p.generation,
    massGeV: p.massGeV, charge: p.charge, spin: p.spin, year: p.discoveredYear,
  }));
  const ladderMassive = all.filter(p => p.massGeV > 0);
  const ladderZero = all.filter(p => p.massGeV === 0);
  const vsCanon = Object.entries(canon).map(([id, c]) => {
    const p = pdata.particle(id);
    return {
      id,
      dMass: Math.abs(p.massGeV - c.massGeV) / Math.max(c.massGeV, 1e-12),
      dCharge: p.charge - c.charge,
      dSpin: p.spin - c.spin,
      year: p.year ?? p.discoveredYear,
      expectYear: c.year,
      massGeV: p.massGeV,
    };
  });
  return {
    allCount: allIds.length,
    families: [...new Set(all.map(p => p.family))],
    sm,
    ladderMassiveIds: ladderMassive.map(p => p.id),
    ladderZeroIds: ladderZero.map(p => p.id + ':' + p.family),
    hadronsOnLadder: ladderMassive.filter(p => p.family === 'baryon' || p.family === 'meson').map(p => p.id),
    vsCanon,
  };
}, CANON);

function tileClickPoint(box, row, col, kind) {
  const padTop = 54, padBottom = 30, padLeft = 24, padRight = 20;
  const totalW = Math.max(1, box.width - padLeft - padRight);
  const chartW = totalW * 0.64;
  const fermionW = chartW * 0.72;
  const bosonW = chartW * 0.24;
  const bosonX = padLeft + fermionW + chartW * 0.04;
  const chartTop = padTop + 8;
  const chartBot = Math.max(chartTop + 40, box.height - padBottom - 8);
  if (kind === 'fermion') {
    const rowH = (chartBot - chartTop) / 4;
    const colW = fermionW / 3;
    return {
      x: box.x + padLeft + colW * (col + 0.5),
      y: box.y + chartTop + rowH * (row + 0.5),
    };
  }
  const bRowH = (chartBot - chartTop) / 3;
  const bColW = bosonW / 2;
  return {
    x: box.x + bosonX + bColW * (col + 0.5),
    y: box.y + chartTop + bRowH * (row + 0.5),
  };
}

const canvasBox = () => page.$('#main-canvas').then(el => el.boundingBox());

const clickTile = async (row, col, kind = 'fermion') => {
  const box = await canvasBox();
  const p = tileClickPoint(box, row, col, kind);
  await page.mouse.click(p.x, p.y);
  await sleep(200);
};

const initial = await rec('00-initial');

await clickTile(2, 0, 'fermion'); // electron
const electron = await rec('01-electron');

await clickTile(0, 2, 'fermion'); // top
const top = await rec('02-top');

await clickTile(3, 2, 'fermion'); // tau neutrino
const nuTau = await rec('03-nu-tau');

await clickTile(2, 1, 'boson'); // higgs  (boson rows: 0 photon/gluon, 1 W+/W-, 2 Z/H)
const higgs = await rec('04-higgs');

await clickTile(1, 0, 'boson'); // W+
const wplus = await rec('05-wplus');

await clickTile(0, 0, 'boson'); // photon
const photon = await rec('06-photon');

const ladderClick = await page.evaluate(() => {
  const c = document.getElementById('main-canvas');
  const r = c.getBoundingClientRect();
  const padLeft = 24, padRight = 20, padTop = 54, padBottom = 30;
  const totalW = r.width - padLeft - padRight;
  const ladderX = padLeft + totalW * 0.64 + totalW * 0.06;
  const axX = ladderX + 70;
  const axTop = padTop + 8;
  const axBot = r.height - padBottom - 54 - 8;
  const t = 4.2 / 7.4; // ~1 GeV on the log axis
  const py = axBot - t * (axBot - axTop);
  return { x: r.x + axX + 20, y: r.y + py };
});
await page.mouse.click(ladderClick.x, ladderClick.y);
await sleep(200);
const nearGeV = await rec('06b-ladder-1GeV');

await page.click('#mode-lagr');
await sleep(250);
const lagr = await rec('07-lagrangian');

const lagrClick = await page.evaluate(() => {
  const c = document.getElementById('main-canvas');
  const r = c.getBoundingClientRect();
  return { x: r.x + r.width * 0.38, y: r.y + r.height * 0.36 };
});
await page.mouse.click(lagrClick.x, lagrClick.y);
await sleep(250);
const lagrTerm = await rec('08-lagr-term');

await page.click('#mode-table');
await sleep(250);
const backTable = await rec('09-back-table');

await page.click('#mode-lagr');
await sleep(100);
await page.click('#shell-reset');
await sleep(300);
const afterReset = await rec('10-after-reset');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const card2 = await rec('11-card2-gated');
await page.evaluate(() => document.getElementById('inq-pager-next')?.click());
await sleep(150);
const pagerSkip = await rec('12-pager-skip');

await page.evaluate(() => {
  const on = document.getElementById('shell')?.classList.contains('lecture-mode')
    || document.getElementById('shell')?.classList.contains('inquiry-collapsed');
  if (on) document.getElementById('shell-lecture')?.click();
});
await sleep(100);
await page.evaluate(() => {
  const cards = document.querySelectorAll('#inq-cards .inq-step');
  // go to card 2 if not there
});
const still = await ui();
await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
await sleep(150);
const afterChoice = await rec('13-after-choice');

await clickTile(0, 0, 'fermion');
await page.click('#shell-lecture');
await sleep(200);
const afterLecture = await rec('14-after-lecture');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(300);
const narrow = await rec('15-narrow-1100');
const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

const out = {
  jsErrors: errors,
  overflowX,
  pdataDump,
  initial, electron, top, nuTau, higgs, wplus, photon, nearGeV,
  lagr, lagrTerm, backTable, afterReset,
  card2, pagerSkip, stillOnAfterPager: { step: still.step, nextDisabled: still.nextDisabled, pagerNextDisabled: still.pagerNextDisabled },
  afterChoice, afterLecture, narrow,
};

writeFileSync(join(outdir, `${name}-flow.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
