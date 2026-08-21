// Browser probe for the FERMI PARTICLE-PHYSICS sims (shell-engine, button/mode-heavy).
// Drives system Chrome headless via puppeteer-core to gather evidence for a review:
//   1. initial + after-play screenshots, console/page errors
//   2. every <select> option, every checkbox on/off, every range slider min/mid/max
//   3. every <button> clicked once (screenshot after each), reset buttons last
//   4. STATE-PERSISTENCE test: set each slider to a non-default value, click a
//      non-reset button, re-read the slider — a snap-back to default is the
//      "config silently resets" flow bug. Same for selects.
//   5. DOM overlap scan: pairwise boundingRect intersections of visible
//      labels/readouts/controls (canvas-drawn text still needs eyeball checks
//      on the screenshots).
//
// Usage:  node browser-probe.mjs <sim.html> [outdir]      (any cwd)
// Writes: <outdir>/<sim>__<label>.png and <outdir>/<sim>-probe.json
//
// puppeteer-core resolved from the repo installs; Chrome from CHROME_PATH or
// the system app. Script path (not cwd) anchors all resolution.

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, basename, dirname, join } from 'node:path';

// This file lives at <repo>/Fermi_Particle_physics_sims/_review/ → repo root is 2 up.
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

let puppeteer = null, requireBase = null;
for (const base of REQUIRE_BASES) {
  try { puppeteer = createRequire(base)('puppeteer-core'); requireBase = base; break; } catch {}
}
if (!puppeteer) {
  console.error(`puppeteer-core not found. Tried:\n  ${REQUIRE_BASES.join('\n  ')}\n` +
    `Install with: npm i puppeteer-core --prefix "${REQUIRE_BASES[0]}"`);
  process.exit(1);
}
const CHROME = CHROME_CANDIDATES.find(p => existsSync(p));
if (!CHROME) {
  console.error(`No Chrome/Chromium found. Set CHROME_PATH=/path/to/chrome.`);
  process.exit(1);
}

const file = resolve(process.cwd(), process.argv[2] || '');
const outdir = resolve(process.cwd(), process.argv[3] || './_review/probe-out');
mkdirSync(outdir, { recursive: true });
const name = basename(file).replace(/\.html$/, '');

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
const readState = (page) => page.evaluate(() => {
  const txt = sel => Array.from(document.querySelectorAll(sel))
    .map(e => (e.textContent || '').trim()).filter(Boolean);
  let audit = null;
  try { if (window.__audit && typeof window.__audit.at === 'function') audit = window.__audit.at(0); } catch (e) { audit = { error: String(e) }; }
  return {
    readouts: txt('.shell-readout, .drow, #data-body, output, [id^="ro-"]').slice(0, 40),
    playLabel: (document.getElementById('shell-play') || {}).textContent || null,
    audit,
  };
});

const probe = { sim: name, errors, states: [], persistence: [], overlaps: [], overflowX: false };
const capture = async (label) => {
  probe.states.push({ label, ...(await readState(page)) });
  await page.screenshot({ path: `${outdir}/${name}__${label.replace(/[^\w.-]+/g, '_')}.png` });
};

await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle2', timeout: 20000 });
await sleep(900);
await capture('initial');

// --- play, let physics evolve ---
await page.evaluate(() => document.getElementById('shell-play')?.click());
await sleep(1600);
await capture('after-play');

// --- enumerate the control surface ---
const controls = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const ident = (el, i) => el.id || `${el.tagName.toLowerCase()}#${i}`;
  return {
    sliders: Array.from(document.querySelectorAll('input[type=range]')).filter(vis)
      .map(s => ({ id: s.id, min: +s.min, max: +s.max, value: +s.value })),
    selects: Array.from(document.querySelectorAll('select')).filter(vis)
      .map((s, i) => ({ id: s.id, key: ident(s, i), options: Array.from(s.options).map(o => o.value), value: s.value })),
    checkboxes: Array.from(document.querySelectorAll('input[type=checkbox]')).filter(vis)
      .map(c => ({ id: c.id, checked: c.checked })),
    buttons: Array.from(document.querySelectorAll('button')).filter(vis)
      .map((b, i) => ({ id: b.id, idx: i, label: (b.textContent || '').trim().slice(0, 30) })),
  };
});
probe.controls = controls;

const setVal = (id, val) => page.evaluate(({ id, val }) => {
  const el = document.getElementById(id); if (!el) return;
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, { id, val });
const getVal = id => page.evaluate(id => document.getElementById(id)?.value, id);

// --- select options ---
for (const s of controls.selects) {
  if (!s.id) continue;
  for (const opt of s.options) { await setVal(s.id, opt); await sleep(400); await capture(`${s.id}-${opt}`); }
  await setVal(s.id, s.value);
}

// --- checkboxes both ways ---
for (const c of controls.checkboxes) {
  if (!c.id) continue;
  for (const on of [!c.checked, c.checked]) {
    await page.evaluate(({ id, on }) => {
      const el = document.getElementById(id); if (!el || el.checked === on) return;
      el.click();
    }, { id: c.id, on });
    await sleep(350);
    await capture(`${c.id}-${on ? 'on' : 'off'}`);
  }
}

// --- sliders min/mid/max ---
for (const s of controls.sliders) {
  if (!s.id) continue;
  const mid = Math.round(((s.min + s.max) / 2) * 100) / 100;
  for (const [tag, val] of [['min', s.min], ['mid', mid], ['max', s.max]]) {
    await setVal(s.id, val); await sleep(450); await capture(`${s.id}-${tag}`);
  }
  await setVal(s.id, s.value);
}

// --- click every button once (reset/clear-ish ones deferred to the end) ---
// Click by IDENTITY (id, else exact label among visible buttons), never by
// index: index-based clicking shifts whenever earlier clicks change which
// buttons are visible (e.g. opening the Info modal exposes the SimCfg editor's
// own reset/save buttons ahead of the header in DOM order).
const clickButton = b => page.evaluate(({ id, label }) => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  let el = id ? document.getElementById(id) : null;
  if (!el) el = Array.from(document.querySelectorAll('button')).filter(vis)
    .find(x => (x.textContent || '').trim().slice(0, 30) === label);
  el?.click();
}, { id: b.id, label: b.label });
const isReset = b => /reset|clear/i.test(b.id + ' ' + b.label);
const ordered = [...controls.buttons.filter(b => !isReset(b)), ...controls.buttons.filter(isReset)];
for (const b of ordered) {
  const before = errors.length;
  await clickButton(b);
  await sleep(450);
  await capture(`btn-${b.id || b.idx}`);
  if (errors.length > before) probe.states.at(-1).newErrors = errors.slice(before);
}

// --- STATE-PERSISTENCE: non-default value survives clicking other controls? ---
const probeButtons = ordered.filter(b => !isReset(b) && !/play|pause|info/i.test(b.id + b.label)).slice(0, 3);
for (const s of controls.sliders) {
  if (!s.id) continue;
  await setVal(s.id, s.max); await sleep(300);
  for (const b of probeButtons) {
    await clickButton(b);
    await sleep(350);
    await page.keyboard.press('Escape');
    const now = await getVal(s.id);
    if (Math.abs(+now - +s.max) > Math.max(1e-9, Math.abs(+s.max) * 1e-9)) {
      probe.persistence.push({ control: s.id, setTo: s.max, after: `click ${b.id || b.label}`, became: now });
      await capture(`RESETBUG-${s.id}-after-${b.id || b.idx}`);
      break;
    }
  }
  await setVal(s.id, s.value);
}
for (const s of controls.selects) {
  if (!s.id || s.options.length < 2) continue;
  const alt = s.options.find(o => o !== s.value);
  await setVal(s.id, alt); await sleep(300);
  const b = probeButtons[0];
  if (b) {
    await clickButton(b);
    await sleep(350);
    await page.keyboard.press('Escape');
    const now = await getVal(s.id);
    if (now !== alt) probe.persistence.push({ control: s.id, setTo: alt, after: `click ${b.id || b.label}`, became: now });
  }
  await setVal(s.id, s.value);
}

// --- DOM overlap + horizontal overflow ---
const layout = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll(
    'button, label, select, input, .shell-readout, .drow, output, h1, h2, h3, legend, [class*=label], [class*=readout], [class*=value]'))
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; })
    .map(el => ({
      key: el.id || el.className.toString().slice(0, 30) || el.tagName,
      r: (({ left, top, right, bottom }) => ({ left, top, right, bottom }))(el.getBoundingClientRect()),
      el,
    }));
  const overlaps = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
    const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox > 4 && oy > 4) overlaps.push({ a: a.key, b: b.key, ox: Math.round(ox), oy: Math.round(oy) });
  }
  return {
    overlaps: overlaps.slice(0, 30),
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
  };
});
probe.overlaps = layout.overlaps;
probe.overflowX = layout.overflowX;

// --- narrow-width layout check ---
await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await sleep(600);
await capture('narrow-1100');

writeFileSync(`${outdir}/${name}-probe.json`, JSON.stringify(probe, null, 2));
console.log(`probe: ${probe.states.length} states | ${errors.length} js-errors | ` +
  `${probe.persistence.length} persistence-failures | ${probe.overlaps.length} DOM-overlaps` +
  `${probe.overflowX ? ' | X-OVERFLOW' : ''} → ${outdir}`);
console.log(`       chrome: ${CHROME} | puppeteer-core: ${requireBase}`);
await browser.close();
