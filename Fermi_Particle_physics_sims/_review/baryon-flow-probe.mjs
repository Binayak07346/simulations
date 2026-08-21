// One-off Build_Baryon flow + physics probe (HTML5 drop, identify, mode/spin).
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
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean);

let puppeteer = null;
for (const base of REQUIRE_BASES) {
  try { puppeteer = createRequire(base)('puppeteer-core'); break; } catch {}
}
const CHROME = CHROME_CANDIDATES.find(p => existsSync(p));

const file = resolve(HERE, '../Build_Baryon.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });

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
  await page.screenshot({ path: `${outdir}/Build_Baryon__FLOW-${label}.png` });
};

async function ui() {
  return page.evaluate(() => ({
    modeInline: document.getElementById('mode-inline')?.textContent,
    Q: document.getElementById('qns-Q')?.textContent,
    B: document.getElementById('qns-B')?.textContent,
    S: document.getElementById('qns-S')?.textContent,
    slots: Array.from(document.querySelectorAll('#slots .slot')).map(s => s.textContent.replace('×','').trim()),
    slotCount: document.querySelectorAll('#slots .slot').length,
    verdict: document.getElementById('verdict')?.innerText,
    libCount: document.getElementById('lib-count')?.textContent,
    lib: document.getElementById('library')?.innerText,
    baryonActive: document.querySelector('.mode-btn[data-mode="baryon"]')?.classList.contains('active'),
    mesonActive: document.querySelector('.mode-btn[data-mode="meson"]')?.classList.contains('active'),
    spinLow: document.getElementById('spin-low')?.textContent,
    spinHigh: document.getElementById('spin-high')?.textContent,
    spinLowActive: document.getElementById('spin-low')?.classList.contains('active'),
    spinHighActive: document.getElementById('spin-high')?.classList.contains('active'),
    pdataHasRho: (() => { try { return !!window.Engine?.pdata?.particle('rho+'); } catch { return false; } })(),
    pdataHasPi: (() => { try { return !!window.Engine?.pdata?.particle('pion-plus'); } catch { return false; } })(),
    pdataKeys: Object.keys(window.Engine?.pdata || {}),
  }));
}

async function drop(quark, slotIndex) {
  return page.evaluate(({ quark, slotIndex }) => {
    const slot = document.querySelectorAll('#slots .slot')[slotIndex];
    if (!slot) return { ok: false, reason: 'no slot' };
    const ev = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'dataTransfer', {
      value: { getData: (t) => (t === 'text/quark' ? quark : '') },
    });
    slot.dispatchEvent(ev);
    return { ok: true, text: slot.textContent };
  }, { quark, slotIndex });
}

async function click(sel) {
  await page.evaluate(sel => {
    const el = typeof sel === 'string' && sel.startsWith('text:')
      ? Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').includes(sel.slice(5)))
      : document.querySelector(sel);
    el?.click();
  }, sel);
}

const log = [];
const rec = async (label, extra) => {
  const state = await ui();
  const entry = { label, errors: errors.slice(), ...state, ...extra };
  log.push(entry);
  await shot(label);
  return entry;
};

await rec('00-initial');

// Place uud via drop events
await drop('u', 0); await drop('u', 1); await drop('d', 2);
const afterDrop = await rec('01-uud-dropped');

// Identify (THE critical flow: does capture-phase onReset wipe slots?)
await click('#identify-btn');
await sleep(200);
const afterId = await rec('02-identify-uud');

// Spin high without re-dropping — do slots persist?
await click('#spin-high');
await sleep(150);
const afterSpin = await rec('03-spin-high-same-uud');
await click('#identify-btn');
await sleep(200);
const afterId32 = await rec('04-identify-uud-j32');

// Spin back to 1/2, identify again
await click('#spin-low');
await click('#identify-btn');
await sleep(150);
await rec('05-identify-uud-j12-again');

// Mode round-trip: meson then baryon — does library/slots survive?
await click('text:Meson');
await sleep(150);
const meson = await rec('06-switch-meson');
await drop('u', 0); await drop('anti-d', 1);
await rec('07-meson-u-antid');
await click('#identify-btn');
await sleep(200);
const piplus = await rec('08-identify-piplus');

// J=1 meson (rho?)
await click('#spin-high');
await click('#identify-btn');
await sleep(150);
const rho = await rec('09-identify-vector-udbar');

await click('text:Baryon');
await sleep(150);
const backBaryon = await rec('10-mode-back-baryon');

// sss at J=1/2 then 3/2
await drop('s', 0); await drop('s', 1); await drop('s', 2);
await rec('11-sss-dropped');
await click('#identify-btn');
await sleep(150);
await rec('12-identify-sss-j12');
await click('#spin-high');
await click('#identify-btn');
await sleep(150);
await rec('13-identify-sss-j32');

// two quarks only (colour)
await click('#clear-btn');
await drop('u', 0); await drop('d', 1);
await rec('14-two-quarks');
await click('#identify-btn');
await sleep(150);
await rec('15-identify-two-quarks');

// d dbar meson (pi0 mixing)
await click('text:Meson');
await click('#spin-low');
await drop('d', 0); await drop('anti-d', 1);
await rec('16-ddbar');
await click('#identify-btn');
await sleep(150);
await rec('17-identify-ddbar');

// antibaryon
await click('text:Baryon');
await drop('anti-u', 0); await drop('anti-u', 1); await drop('anti-d', 2);
await rec('18-antiproton-quarks');
await click('#identify-btn');
await sleep(150);
await rec('19-identify-antiproton');

// antineutron
await click('#clear-btn');
await drop('anti-u', 0); await drop('anti-d', 1); await drop('anti-d', 2);
await click('#identify-btn');
await sleep(150);
await rec('20-identify-antineutron');

// heavy c in baryon with u,d
await click('#clear-btn');
await drop('u', 0); await drop('d', 1); await drop('c', 2);
await rec('21-udc');
await click('#identify-btn');
await sleep(150);
await rec('22-identify-udc');

// J/psi attempt: meson c + anti-c (no anti-c in palette)
await click('text:Meson');
await drop('c', 0);
const antiC = await drop('anti-c', 1);
await rec('23-ccbar-attempt', { antiCdrop: antiC });
await click('#identify-btn');
await sleep(150);
await rec('24-identify-ccbar');

// uuu J=1/2
await click('text:Baryon');
await click('#spin-low');
await drop('u', 0); await drop('u', 1); await drop('u', 2);
await click('#identify-btn');
await sleep(150);
await rec('25-identify-uuu-j12');

// uds = lambda vs sigma0
await click('#clear-btn');
await drop('u', 0); await drop('d', 1); await drop('s', 2);
await click('#identify-btn');
await sleep(150);
await rec('26-identify-uds');

// library after several IDs, then Reset
const preReset = await rec('27-pre-reset');
await click('#shell-reset');
await sleep(200);
const postReset = await rec('28-after-reset');

// Click-to-place? click a quark disc, see if a slot fills
await click('#clear-btn');
await page.evaluate(() => document.querySelector('.quark-disc[data-q="u"]')?.click());
await rec('29-click-quark-disc');

// Identify with empty after filling then spin change clearing?
await drop('u', 0); await drop('u', 1); await drop('d', 2);
const slotsBeforeIdentify = await ui();
// Rapid identify double-click
await click('#identify-btn');
await click('#identify-btn');
await rec('30-double-identify');

// Formal panel
await click('#toggle-formal');
await sleep(400);
await rec('31-formal-open');

// Physics audit table via __audit (guarded)
const audit = await page.evaluate(() => {
  const tests = [
    { quarks:['u','u','d'], spin:0.5, expect:'p' },
    { quarks:['u','u','d'], spin:1.5, expect:'Δ⁺' },
    { quarks:['u','d','d'], spin:0.5, expect:'n' },
    { quarks:['u','u','u'], spin:0.5, expect:null },
    { quarks:['u','u','u'], spin:1.5, expect:'Δ⁺⁺' },
    { quarks:['s','s','s'], spin:0.5, expect:null },
    { quarks:['s','s','s'], spin:1.5, expect:'Ω⁻' },
    { quarks:['u','d','s'], spin:0.5, expect:'Λ⁰ or Σ⁰' },
    { quarks:['u','d','s'], spin:1.5, expect:'Σ*⁰' },
    { quarks:['u','u','s'], spin:0.5, expect:'Σ⁺' },
    { quarks:['u','anti-d'], spin:0, expect:'π⁺' },
    { quarks:['u','anti-d'], spin:1, expect:'ρ⁺' },
    { quarks:['u','anti-u'], spin:0, expect:'π⁰' },
    { quarks:['u','anti-u'], spin:1, expect:'ρ⁰/ω' },
    { quarks:['d','anti-d'], spin:0, expect:'π⁰' },
    { quarks:['d','anti-d'], spin:1, expect:'ρ⁰/ω' },
    { quarks:['s','anti-s'], spin:0, expect:'η/η′' },
    { quarks:['s','anti-s'], spin:1, expect:'ϕ' },
    { quarks:['anti-u','anti-u','anti-d'], spin:0.5, expect:'p̄' },
    { quarks:['anti-u','anti-d','anti-d'], spin:0.5, expect:'n̄' },
    { quarks:['c','anti-c'], spin:0, expect:'beyond' },
    { quarks:['u','d','c'], spin:0.5, expect:'beyond' },
    { quarks:['u','d'], spin:0.5, expect:'not colour-neutral' },
  ];
  return tests.map(t => {
    let r;
    try { r = window.__audit.at({ quarks: t.quarks, spin: t.spin }); }
    catch (e) { r = { error: String(e) }; }
    return { ...t, result: r };
  });
});

// Engine table identity: which pdata is live?
const whichPdata = await page.evaluate(() => {
  const p = window.Engine.pdata;
    const tryIds = ['proton','pion-plus','pi+','rho-plus','rho+','rho-zero','omega-minus','lambda','sigma-zero','antiproton','antineutron'];
  const found = {};
  for (const id of tryIds) {
    try { const rec = p.particle(id); found[id] = rec; } catch (e) { found[id] = { error: String(e) }; }
  }
  // hadronFromQuarks for vector
  const vec = p.hadronFromQuarks(['u','anti-d'], 1);
  const pi = p.hadronFromQuarks(['u','anti-d'], 0);
  const pbar = p.hadronFromQuarks(['anti-u','anti-u','anti-d'], 0.5);
  const nbar = p.hadronFromQuarks(['anti-u','anti-d','anti-d'], 0.5);
  const ddbar = p.hadronFromQuarks(['d','anti-d'], 0);
  const ssbar0 = p.hadronFromQuarks(['s','anti-s'], 0);
  const ssbar1 = p.hadronFromQuarks(['s','anti-s'], 1);
  const uds = p.hadronFromQuarks(['u','d','s'], 0.5);
  let eta = null;
  try { eta = p.particle('eta'); } catch (e) { eta = { error: String(e) }; }
  return {
    found: Object.fromEntries(Object.entries(found).map(([k,v]) => [k, v && v.display ? {display:v.display, mass:v.massGeV, spin:v.spin, year:v.discoveredYear, life:v.lifetimeSeconds, quarks:v.quarks} : v])),
    vec: { particle: vec.particle?.display, alts: (vec.alternatives||[]).map(a=>a.display), reason: vec.reason },
    pi: { particle: pi.particle?.display, alts: (pi.alternatives||[]).map(a=>a.display) },
    pbar: { particle: pbar.particle?.display, alts: (pbar.alternatives||[]).map(a=>a.display), reason: pbar.reason },
    nbar: { particle: nbar.particle?.display, reason: nbar.reason },
    ddbar: { particle: ddbar.particle?.display, reason: ddbar.reason },
    ssbar0: { particle: ssbar0.particle?.display, reason: ssbar0.reason },
    ssbar1: { particle: ssbar1.particle?.display, reason: ssbar1.reason },
    uds: { particle: uds.particle?.display, alts: (uds.alternatives||[]).map(a=>a.display+' J='+a.spin) },
    eta,
    secondPdataSkipped: !!(window.Engine && window.Engine.pdata && window.Engine.pdata.particleIds),
  };
});

const overlaps = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll(
    'button, label, .qns, .qns-value, .plot-title, .bench-hint, .quark-disc, .lib-entry, .verdict'))
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== 'hidden'; })
    .map(el => ({
      key: el.id || (el.className && el.className.toString().slice(0, 40)) || el.tagName,
      text: (el.textContent||'').trim().slice(0, 40),
      r: (({ left, top, right, bottom }) => ({ left, top, right, bottom }))(el.getBoundingClientRect()),
    }));
  const hits = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j];
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
    const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox > 8 && oy > 8) hits.push({ a: a.key+'|'+a.text, b: b.key+'|'+b.text, ox: Math.round(ox), oy: Math.round(oy) });
  }
  return hits.slice(0, 25);
});

writeFileSync(`${outdir}/Build_Baryon-flow.json`, JSON.stringify({
  errors, log, audit, whichPdata, overlaps, slotsBeforeIdentify,
  afterDrop, afterId, afterSpin, afterId32, meson, piplus, rho, backBaryon, preReset, postReset,
}, null, 2));
console.log(JSON.stringify({
  jsErrors: errors,
  afterDropSlots: afterDrop.slots,
  afterIdVerdict: afterId.verdict,
  afterIdSlots: afterId.slots,
  afterSpinSlots: afterSpin.slots,
  afterId32Verdict: afterId32.verdict,
  mesonSlots: meson.slots,
  piplusVerdict: piplus.verdict,
  rhoVerdict: rho.verdict,
  backBaryonSlots: backBaryon.slots,
  backBaryonLib: backBaryon.libCount,
  postResetLib: postReset.libCount,
  postResetSlots: postReset.slots,
  pdataHasRho: afterDrop.pdataHasRho,
  pdataHasPi: afterDrop.pdataHasPi,
  pdataKeys: afterDrop.pdataKeys,
  secondPdataHasParticleIds: whichPdata.secondPdataSkipped,
  vec: whichPdata.vec,
  pbar: whichPdata.pbar,
  nbar: whichPdata.nbar,
  ddbar: whichPdata.ddbar,
  uds: whichPdata.uds,
  auditSummary: audit.map(a => ({ q: a.quarks.join(','), J: a.spin, expect: a.expect, got: a.result.identified ?? a.result.error, beyond: a.result.beyondTable, cn: a.result.colourNeutral, Q: a.result.charge })),
}, null, 2));
await browser.close();
