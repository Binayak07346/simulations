// One-off Eightfold Way flow + physics probe (tiles, multiplets, reveal, axis).
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

const file = resolve(HERE, '../Eigenfold_way_v2.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Eigenfold_way_v2';

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
  const active = (sel) => Array.from(document.querySelectorAll(sel + '.active, ' + sel + '.shell-btn.active'))
    .map(b => (b.dataset.mult || b.dataset.axis || b.textContent || '').trim());
  const detail = document.getElementById('detail');
  return {
    title: document.getElementById('plot-inline-title')?.textContent,
    mult: document.querySelector('[data-mult].active')?.dataset.mult,
    axis: document.querySelector('[data-axis].active')?.dataset.axis,
    revealBox: document.getElementById('reveal-box')?.style.display,
    detail: (detail?.innerText || '').slice(0, 400),
    step: document.querySelector('.inq-step.active h4')?.textContent,
    nextDisabled: document.getElementById('inq-next')?.disabled,
    pagerNextDisabled: document.getElementById('inq-pager-next')?.disabled,
    placed: Object.keys(window.__positionsHack || {}),
  };
});

const log = [];
const rec = async (label, extra) => {
  const state = { label, ...(await ui()), ...extra, errors: errors.slice() };
  log.push(state);
  await shot(label);
  return state;
};

const clickText = async (sel, text) => {
  await page.evaluate(({ sel, text }) => {
    const el = Array.from(document.querySelectorAll(sel)).find(b => (b.textContent || '').includes(text));
    el?.click();
  }, { sel, text });
};

const clickTile = async (id) => {
  return page.evaluate((id) => {
    const pos = (window.state && window.state._positions) || {};
    // positions live on the IIFE state — expose via canvas hack
    const canvas = document.getElementById('scene');
    const r = canvas.getBoundingClientRect();
    // read from last draw: we stash on canvas
    const p = canvas.__pos && canvas.__pos[id];
    if (!p) return { ok: false, ids: Object.keys(canvas.__pos || {}) };
    const ev = new MouseEvent('click', { clientX: r.left + p.px, clientY: r.top + p.py, bubbles: true });
    canvas.dispatchEvent(ev);
    return { ok: true, px: p.px, py: p.py };
  }, id);
};

// Stash tile positions after each draw
await page.evaluate(() => {
  const canvas = document.getElementById('scene');
  const orig = canvas.getContext('2d');
  const hook = () => {
    // poll state via draw side-effect: copy from a known global if any
  };
  const iv = setInterval(() => {
    // The sim keeps positions on a closed-over `state`. Patch draw by reading fillText? 
    // Instead monkey-patch after boot: walk Engine.pdata and use eightfoldWayPlacement + worldToPix is not exported.
    // We'll scrape from the last positions by intercepting hitTest via clicking known relative locations.
  }, 500);
  canvas.__hookTimer = iv;
});

const physics = await page.evaluate(() => {
  const pd = window.Engine.pdata;
  const ids = [
    'proton','neutron','lambda','sigma-plus','sigma-zero','sigma-minus','xi-zero','xi-minus',
    'delta-plusplus','delta-plus','delta-zero','delta-minus',
    'sigma*-plus','sigma*-zero','sigma*-minus','xi*-zero','xi*-minus','omega-minus',
    'pion-plus','pion-zero','pion-minus','kaon-plus','kaon-zero','kaon-zerobar','kaon-minus','eta',
  ];
  const rows = ids.map(id => {
    const p = pd.particle(id);
    const pl = pd.eightfoldWayPlacement(id);
    const Qgn = pd.gellMannNishijima(p.isospin3, p.baryonNumber, p.strangeness);
    return {
      id, symbol: p.display, Q: p.charge, Qgn, quarkQ: pl.quarkCharge, consistent: pl.consistent,
      I3: p.isospin3, S: p.strangeness, B: p.baryonNumber, Y: p.baryonNumber + p.strangeness,
      quarks: p.quarks, mass: p.massGeV, year: p.discoveredYear,
    };
  });
  let at0; try { at0 = window.__audit.at(0); } catch (e) { at0 = { error: String(e) }; }
  let at; try { at = window.__audit.at({ isospin3: 0, baryonNumber: 1, strangeness: -3 }); } catch (e) { at = { error: String(e) }; }
  const inv = window.__audit.invariants?.gridChargeMatchesQuarkCharge?.();
  return { rows, at0, at, inv };
});

await rec('00-initial-octet');

// Click proton via coordinates from engine placement + canvas mapping by evaluating internal state
const clickById = async (id) => {
  return page.evaluate((id) => {
    const canvas = document.getElementById('scene');
    // Access closed-over state by drawing's last _positions: not on window.
    // Fallback: dispatch click at each filled circle by scanning? We patch:
    if (!window.__eigState) {
      // recover from Engine + recreate worldToPix using same formula as sim by reading canvas size
    }
    return false;
  }, id);
};

// Patch: expose state._positions by wrapping the existing click handler isn't possible.
// Use CDP to read positions from a injected copy of worldToPix using Engine.pdata + same pad/extent as sim.
const posFor = async (id) => page.evaluate((id) => {
  const canvas = document.getElementById('scene');
  const stashed = canvas.__pos && canvas.__pos[id];
  if (stashed) {
    const r = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new MouseEvent('click', {
      clientX: r.left + stashed.px, clientY: r.top + stashed.py, bubbles: true
    }));
    return { px: stashed.px, py: stashed.py, via: '__pos' };
  }
  return { ok: false };
}, id);

const protonClick = await posFor('proton');
await sleep(150);
const afterProton = await rec('01-click-proton');

const lambdaClick = await posFor('lambda');
await sleep(150);
const afterLambda = await rec('02-click-lambda');

const sigma0Click = await posFor('sigma-zero');
await sleep(150);
const afterSigma0 = await rec('03-click-sigma0');

await clickText('[data-mult]', 'Meson octet');
await sleep(250);
const meson = await rec('04-meson-octet');
await posFor('pion-plus');
await sleep(150);
const afterPi = await rec('05-click-piplus');
await posFor('eta');
await sleep(150);
const afterEta = await rec('06-click-eta');
await posFor('pion-zero');
await sleep(150);
const afterPi0 = await rec('07-click-pi0');

await clickText('[data-mult]', 'Decuplet');
await sleep(300);
const decuplet = await rec('08-decuplet-gap');

await clickText('#btn-reveal', 'Reveal');
await sleep(250);
const revealed = await rec('09-reveal-omega');

await clickText('[data-axis]', 'Y = B+S');
await sleep(250);
const axisY = await rec('10-decuplet-Y');

await clickText('[data-mult]', 'Meson octet');
await sleep(250);
const mesonOnY = await rec('11-meson-on-Y'); // axis should persist if not reset

await clickText('[data-axis]', 'S (strangeness)');
await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(250);
const afterReset = await rec('12-after-reset');

// Inquiry walk with pager skipping a gate
await page.evaluate(() => document.getElementById('inq-pager-next')?.click());
await sleep(150);
const pagerSkip = await rec('13-pager-to-step2');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(100);
const nextBlocked = await rec('14-next-blocked-on-gate');

await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
await sleep(150);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(200);
const step3 = await rec('15-step3-meson-prompt');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(250);
const step4 = await rec('16-step4-decuplet-auto');

await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
await sleep(150);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(250);
const step5 = await rec('17-step5-auto-reveal');

await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(250);
const step6 = await rec('18-step6-auto-Y');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(300);
await rec('19-narrow-1100');

writeFileSync(`${outdir}/${name}-flow.json`, JSON.stringify({
  errors, log, physics, protonClick, lambdaClick, sigma0Click,
}, null, 2));

const badQ = physics.rows.filter(r => Math.abs(r.Q - r.Qgn) > 1e-9 || !r.consistent);
console.log(JSON.stringify({
  jsErrors: errors,
  at0: physics.at0,
  omegaQ: physics.at,
  inv: physics.inv,
  badQ,
  initial: { title: log[0].title, step: log[0].step },
  proton: afterProton.detail.slice(0, 180),
  lambda: afterLambda.detail.slice(0, 180),
  sigma0: afterSigma0.detail.slice(0, 180),
  meson: { title: meson.title, revealBox: meson.revealBox },
  decuplet: { title: decuplet.title, revealBox: decuplet.revealBox },
  revealed: { detail: revealed.detail.slice(0, 220), revealBox: revealed.revealBox },
  mesonOnY: { axis: mesonOnY.axis, title: mesonOnY.title },
  afterReset: { mult: afterReset.mult, axis: afterReset.axis, step: afterReset.step, title: afterReset.title },
  pagerSkip: { step: pagerSkip.step, nextDisabled: pagerSkip.nextDisabled, pagerNextDisabled: pagerSkip.pagerNextDisabled },
  nextBlocked: { step: nextBlocked.step, nextDisabled: nextBlocked.nextDisabled },
  step5: { title: step5.title, revealBox: step5.revealBox, detail: step5.detail.slice(0, 200) },
  step6: { axis: step6.axis, title: step6.title },
}, null, 2));
await browser.close();
