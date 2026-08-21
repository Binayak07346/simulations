// One-off Feynman sandbox flows: presets, conservation, q² persistence, drag, inquiry gates.
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

const file = resolve(HERE, '../Feynmann_diagram_sandbox.html');
const outdir = resolve(HERE, 'probe-out');
mkdirSync(outdir, { recursive: true });
const name = 'Feynmann_diagram_sandbox';

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
  const banner = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const show = el.classList.contains('show');
    return { show, display: getComputedStyle(el).display, text: (el.innerText || '').slice(0, 280) };
  };
  return {
    step: document.querySelector('.inq-step.active h4')?.textContent,
    nextDisabled: document.getElementById('inq-next')?.disabled,
    pagerNextDisabled: document.getElementById('inq-pager-next')?.disabled,
    q2slider: document.getElementById('sl-q2')?.value,
    q2label: document.getElementById('v-q2')?.textContent,
    force: document.getElementById('s-force')?.textContent,
    alpha: document.getElementById('s-alpha')?.textContent,
    N: document.getElementById('s-N')?.textContent,
    amp: document.getElementById('s-amp')?.textContent,
    prob: document.getElementById('s-prob')?.textContent,
    vlog: document.getElementById('vlog')?.innerText,
    med: document.getElementById('p-med')?.textContent,
    mass: document.getElementById('p-mass')?.textContent,
    off: document.getElementById('p-off')?.textContent,
    prop: document.getElementById('p-prop')?.textContent,
    onShell: document.getElementById('p-on')?.textContent,
    reason: document.getElementById('p-reason')?.textContent,
    refusal: banner('refusal'),
    allowed: banner('allowed'),
    dragBtn: document.getElementById('btn-drag')?.textContent,
    presetActive: Array.from(document.querySelectorAll('#preset-list .shell-btn.active')).map(b => b.textContent.trim()),
    playVisible: (() => {
      const b = document.getElementById('shell-play');
      if (!b) return false;
      const s = getComputedStyle(b);
      return s.display !== 'none' && s.visibility !== 'hidden';
    })(),
  };
});

const physics = await page.evaluate(() => {
  const feyn = window.Engine.feyn;
  const rows = [];
  const cases = [
    { id: 'qed-ok', force: 'electromagnetic', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:+1, flavour:'electron', antiparticle:true },
      { kind:'boson', charge:0, flavour:'photon' },
    ]},
    { id: 'moller-as-drawn', force: 'electromagnetic', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'boson', charge:0, flavour:'photon' },
    ]},
    { id: 'moller-incoming', force: 'electromagnetic', legs: [
      { kind:'fermion', charge:-1, flavour:'electron', incoming:true },
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'boson', charge:0, flavour:'photon' },
    ]},
    { id: 'moller-all-outgoing', force: 'electromagnetic', legs: [
      { kind:'fermion', charge:+1, flavour:'electron', antiparticle:true },
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'boson', charge:0, flavour:'photon' },
    ]},
    { id: 'weak-cc-as-drawn', force: 'weak-charged', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:0, flavour:'electron-neutrino', antiparticle:true },
      { kind:'boson', charge:-1, flavour:'W' },
    ]},
    { id: 'weak-cc-incoming-W', force: 'weak-charged', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:0, flavour:'electron-neutrino', antiparticle:true },
      { kind:'boson', charge:-1, flavour:'W', incoming:true },
    ]},
    { id: 'lepton-fail', force: 'weak-charged', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:0, flavour:'electron-neutrino' },
      { kind:'boson', charge:+1, flavour:'W' },
    ]},
    { id: 'weak-cc-all-outgoing', force: 'weak-charged', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:0, flavour:'electron-neutrino', antiparticle:true },
      { kind:'boson', charge:+1, flavour:'W' },
    ]},
    { id: 'fcnc', force: 'electromagnetic', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:+1, flavour:'muon', antiparticle:true },
      { kind:'boson', charge:0, flavour:'photon' },
    ]},
    { id: 'gluon-lepton', force: 'strong', legs: [
      { kind:'fermion', charge:-1, flavour:'electron' },
      { kind:'fermion', charge:+1, flavour:'electron', antiparticle:true },
      { kind:'boson', charge:0, flavour:'gluon' },
    ]},
    { id: 'nu-photon', force: 'electromagnetic', legs: [
      { kind:'fermion', charge:0, flavour:'neutrino' },
      { kind:'fermion', charge:0, flavour:'neutrino', antiparticle:true },
      { kind:'boson', charge:0, flavour:'photon' },
    ]},
    { id: 'W-ud', force: 'weak-charged', legs: [
      { kind:'fermion', charge:+2/3, flavour:'up' },
      { kind:'fermion', charge:+1/3, flavour:'down', antiparticle:true },
      { kind:'boson', charge:-1, flavour:'W' },
    ]},
  ];
  for (const c of cases) {
    const v = feyn.validateVertex(c.force, c.legs);
    rows.push({ id: c.id, allowed: v.allowed, rules: v.violations.map(x => x.rule), details: v.violations.map(x => x.detail) });
  }
  const vf = feyn.vertexFactor(feyn.couplingConstants().electromagnetic);
  const prop0 = feyn.propagator(0, 0);
  const propNeg = feyn.propagator(-1, 0);
  const rangeW = feyn.interactionRangeFm(80.377);
  let at0; try { at0 = window.__audit.at(0); } catch (e) { at0 = { error: String(e) }; }
  let atQED; try { atQED = window.__audit.at({ presetId: 'qed-tree', q2: -1 }); } catch (e) { atQED = { error: String(e) }; }
  let atEE; try { atEE = window.__audit.at({ presetId: 'ee-scatter', q2: -1 }); } catch (e) { atEE = { error: String(e) }; }
  let atW; try { atW = window.__audit.at({ presetId: 'weak-cc', q2: -1 }); } catch (e) { atW = { error: String(e) }; }
  return { rows, vf, prop0, propNeg, rangeW, at0, atQED, atEE, atW, couplings: feyn.couplingConstants() };
});

const clickPreset = async (text) => {
  await page.evaluate((text) => {
    const el = Array.from(document.querySelectorAll('#preset-list .shell-btn'))
      .find(b => (b.textContent || '').includes(text));
    el?.click();
  }, text);
  await sleep(200);
};

const log = [];
const rec = async (label, extra) => {
  const state = { label, ...(await ui()), ...extra, errors: errors.slice() };
  log.push(state);
  await shot(label);
  return state;
};

await rec('00-initial');

await clickPreset('t-channel');
const tchan = await rec('01-tchannel');

const q2AfterT = await page.evaluate(() => {
  const el = document.getElementById('sl-q2');
  el.value = '0';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return {
    slider: el.value,
    label: document.getElementById('v-q2')?.textContent,
    med: document.getElementById('p-med')?.textContent,
    prop: document.getElementById('p-prop')?.textContent,
    on: document.getElementById('p-on')?.textContent,
    N: document.getElementById('s-N')?.textContent,
    preset: Array.from(document.querySelectorAll('#preset-list .shell-btn.active')).map(b => b.textContent.trim()),
    allowed: document.getElementById('allowed')?.classList.contains('show'),
    refusal: document.getElementById('refusal')?.innerText,
  };
});
await rec('02-tchannel-q2-zero', { q2AfterT });

await clickPreset('charged current');
const weak = await rec('03-weak-cc');

await clickPreset('refused)'); // first refused in list is FCNC if we click poorly
await clickPreset('γ · e⁻ · μ⁺');
const fcnc = await rec('04-fcnc');

await clickPreset('gluon');
const gluon = await rec('05-gluon-lepton');

await clickPreset('e⁻ · e⁻ · γ');
const chargeFail = await rec('06-charge-fail');

await clickPreset('W⁺ · e⁻ · νₑ');
const leptonFail = await rec('06b-lepton-fail');

await clickPreset('QCD');
const qcd = await rec('07-qcd');

await clickPreset('Z ·');
const zff = await rec('08-z');

await clickPreset('QED vertex');
const qed = await rec('09-qed');

// q2 persist vs lecture and vs drag
await page.evaluate(() => {
  const el = document.getElementById('sl-q2');
  el.value = '5';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
await sleep(150);
const q2set = await page.evaluate(() => document.getElementById('sl-q2').value);
await page.evaluate(() => document.getElementById('shell-lecture')?.click());
await sleep(200);
const afterLecture = await rec('10-q2-after-lecture', {
  q2set,
  q2now: await page.evaluate(() => document.getElementById('sl-q2').value),
});

await page.evaluate(() => document.getElementById('shell-lecture')?.click()); // restore inquiry
await sleep(150);

await clickPreset('t-channel');
await sleep(150);
await page.evaluate(() => document.getElementById('btn-drag')?.click());
await sleep(150);
const afterDragBtn = await rec('11-drag-after-tchannel');

// drag a vertex; read amp before/after
const dragAmp = await page.evaluate(() => {
  const canvas = document.getElementById('c-diagram');
  const r = canvas.getBoundingClientRect();
  const amp0 = document.getElementById('s-amp')?.textContent;
  const w = r.width, h = r.height;
  // default single-vertex at 0.5,0.5; t-channel may have been reset
  const vx = 90 + 0.5 * (w - 180);
  const vy = 90 + 0.5 * (h - 180);
  canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: r.left + vx, clientY: r.top + vy, bubbles: true }));
  canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + vx + 80, clientY: r.top + vy - 40, bubbles: true }));
  window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  return { amp0, amp1: document.getElementById('s-amp')?.textContent, N: document.getElementById('s-N')?.textContent, preset: Array.from(document.querySelectorAll('#preset-list .shell-btn.active')).map(b => b.textContent.trim()) };
});
await rec('12-after-drag', { dragAmp });

await page.evaluate(() => document.getElementById('shell-reset')?.click());
await sleep(200);
const afterReset = await rec('13-after-reset');

// inquiry pager vs gate
await page.evaluate(() => document.getElementById('inq-pager-next')?.click());
await sleep(120);
const pagerSkip = await rec('14-pager-to-step2');
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(80);
const nextBlocked = await rec('15-next-blocked');

// walk to card 6/7 for propagator lesson
await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
await sleep(100);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
await page.evaluate(() => document.querySelector('.inq-step.active .choice[data-correct]')?.click());
await sleep(100);
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const step5 = await rec('16-step5-refusals');
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const step6 = await rec('17-step6-virtual');
await page.evaluate(() => document.getElementById('inq-next')?.click());
await sleep(150);
const step7 = await rec('18-step7-pole');

await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(300);
await rec('19-narrow-1100');

writeFileSync(`${outdir}/${name}-flow.json`, JSON.stringify({ errors, log, physics, q2AfterT, dragAmp }, null, 2));
console.log(JSON.stringify({
  jsErrors: errors,
  physicsRows: physics.rows,
  atEE: physics.atEE,
  atW: physics.atW,
  vf: physics.vf,
  prop0: { onShell: physics.prop0.onShell, prop: physics.prop0.propagator },
  tchan: { N: tchan.N, amp: tchan.amp, allowed: tchan.allowed, refusal: tchan.refusal, vlog: tchan.vlog?.slice(0, 180) },
  q2AfterT,
  weak: { N: weak.N, amp: weak.amp, allowed: weak.allowed, refusal: weak.refusal, vlog: weak.vlog?.slice(0, 180) },
  fcnc: { N: fcnc.N, refusal: fcnc.refusal?.text, amp: fcnc.amp },
  gluon: { N: gluon.N, refusal: gluon.refusal?.text },
  chargeFail: { N: chargeFail.N, refusal: chargeFail.refusal?.text },
  leptonFail: { N: leptonFail.N, refusal: leptonFail.refusal?.text },
  qcd: { N: qcd.N, allowed: qcd.allowed?.show, force: qcd.force },
  afterLecture: { q2set, q2now: afterLecture.q2now, q2slider: afterLecture.q2slider },
  afterDragBtn: { preset: afterDragBtn.presetActive, drag: afterDragBtn.dragBtn, N: afterDragBtn.N },
  dragAmp,
  afterReset: { preset: afterReset.presetActive, q2: afterReset.q2slider, N: afterReset.N },
  pagerSkip: { step: pagerSkip.step, nextDisabled: pagerSkip.nextDisabled, pagerNextDisabled: pagerSkip.pagerNextDisabled },
  nextBlocked: { step: nextBlocked.step, nextDisabled: nextBlocked.nextDisabled },
  step6: { step: step6.step, N: step6.N, med: step6.med, preset: step6.presetActive },
  step7: { step: step7.step, med: step7.med },
  playVisible: log[0].playVisible,
}, null, 2));
await browser.close();
