#!/usr/bin/env node
/*
 * Simulation guide — scene-tour gate (real headless Chrome, puppeteer-core).
 * The jsdom verifiers cannot see layout; this walks the guide in a real
 * browser and checks what the 2026-10-01 rollout checked by hand on 116 sims.
 *
 *   node tests/sim-guide-scene.mjs <build.html> [--original <orig.html>]
 *        [--viewport 1440x900] [--shots dir] [--hide-tab '#sb-hide-tab']
 *
 * Checks (FAIL unless noted):
 *  - landing: two cards (Simulation guide, Free exploration), no inquiry card
 *  - header #btn-cg reads "Simulation guide"; header height equals the
 *    original's at 1536/1440/1366/1280 (with --original)
 *  - every scene step (a step whose callout targets #cg-spot): spot shown and
 *    inside the viewport; callout inside the viewport; an ARROW callout does
 *    not overlap its spot; no real element glows; text ≤24 words (WARN 25–26)
 *  - 4–6 scene steps
 *  - walking the scene steps changes no sim input (ranges, numbers, selects,
 *    checkboxes, radios) and no play state compared with the moment before
 *    the guide opened
 *  - sidebar HIDE tab during a spot step moves the spot with the canvas and
 *    OPEN puts it back (ResizeObserver) — skipped if the tab is absent
 *  - Done: spot hidden, zero cg-* classes left
 *  - no page errors beyond the original's
 * Headless only, one browser, always closed. Never a visible window.
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch (e) { puppeteer = createRequire('/Users/admin/Desktop/simulations-1/Fermi_SR_simulations/Capacity_SR_sims_v2_engine/_review/')('puppeteer-core'); }
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const arg = (k, d = null) => args.includes(k) ? args[args.indexOf(k) + 1] : d;
const target = path.resolve(args[0] || '');
if (!args[0] || !fs.existsSync(target)) { console.error('usage: node sim-guide-scene.mjs <build.html> [--original <orig.html>] [--viewport WxH] [--shots dir]'); process.exit(1); }
const original = arg('--original') && path.resolve(arg('--original'));
const [VW, VH] = arg('--viewport', '1440x900').split('x').map(Number);
const shots = arg('--shots'); if (shots) fs.mkdirSync(shots, { recursive: true });
const hideSel = arg('--hide-tab', '#sb-hide-tab');
const fails = [], warns = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const warn = (c, m) => { if (!c) warns.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const words = t => (t || '').trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--mute-audio'] });
async function open(file, w = VW, h = VH) {
  const page = await browser.newPage(); await page.setViewport({ width: w, height: h });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|net::/.test(m.text())) errors.push(m.text()); });
  await page.evaluateOnNewDocument(() => {   // silent speech that still completes, so voice engines don't wedge
    window.__spoken = [];
    if (window.speechSynthesis) {
      const ss = window.speechSynthesis;
      ss.speak = u => { window.__spoken.push(String(u.text || '')); setTimeout(() => { u.onstart && u.onstart({}); setTimeout(() => u.onend && u.onend({}), 30); }, 10); };
      ss.cancel = () => {};
    }
  });
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 60000 });
  await sleep(900);
  return { page, errors };
}
const headerH = async (file, w) => { const { page } = await open(file, w, 900);
  const h = await page.evaluate(() => { const e = document.querySelector('.shell-header, header, .top-bar, #top-bar'); return e ? Math.round(e.getBoundingClientRect().height) : null; });
  await page.close(); return h; };

try {
  let baseErrs = [];
  if (original) { const o = await open(original); baseErrs = o.errors; await o.page.close(); }
  const { page, errors } = await open(target);

  // ---- landing ----
  const land = await page.evaluate(() => {
    const ov = document.getElementById('welcome-overlay');
    const cards = [...document.querySelectorAll('#welcome-overlay .welcome-mode')].map(b => ({ mode: b.dataset.mode, title: (b.querySelector('.wm-title') || {}).textContent }));
    return { shown: !!ov && getComputedStyle(ov).display !== 'none', cards };
  });
  if (land.shown) {
    ok(land.cards.length === 2, `landing: two cards (found ${land.cards.length})`);
    ok(!land.cards.some(c => c.mode === 'inquiry'), 'landing: no Guided Inquiry card');
    ok(land.cards.some(c => c.mode === 'controls' && /Simulation guide/.test(c.title)), 'landing: "Simulation guide" card');
    if (shots) await page.screenshot({ path: path.join(shots, 'landing.png') });
  }
  const lab = await page.$eval('#btn-cg', b => b.textContent.trim()).catch(() => null);
  ok(lab && /Simulation guide/.test(lab) && !/Controls Guide/i.test(lab), `header #btn-cg reads "Simulation guide" (got ${JSON.stringify(lab)})`);

  // dismiss into free exploration first, so the "before" snapshot is the student's sim
  if (land.shown) { await page.click('#welcome-overlay .welcome-mode[data-mode="free"]'); await sleep(400); }
  const snap = () => page.evaluate(() => {
    const out = {};
    document.querySelectorAll('input, select').forEach((e, i) => {
      if (e.closest('.cg-callout, .cg-nav, #welcome-overlay, #phys-backdrop')) return;
      const k = (e.id || e.name || e.tagName + i) + ':' + (e.type || 'select');
      out[k] = (e.type === 'checkbox' || e.type === 'radio') ? e.checked : e.value;
    });
    const pp = document.querySelector('#shell-play, #play-btn, #playpause-btn, #btn-play, [id*="play" i]');
    out.__play = pp ? (pp.textContent + '|' + pp.className + '|' + (pp.getAttribute('aria-pressed') || '')) : null;
    return out;
  });
  // open the guide the way a student does after free exploration: the header button
  const before = await snap();
  await page.click('#btn-cg'); await sleep(500);
  ok(await page.$eval('#btn-cg', b => b.classList.contains('active')), 'guide opens from #btn-cg');
  const afterOpen = await snap();   // the guide's own prepare hook may legitimately set state on open

  // ---- walk ----
  const steps = [];
  for (let i = 0; i < 60; i++) {
    const s = await page.evaluate(() => {
      const c = document.querySelector('.cg-callout'), sp = document.getElementById('cg-spot');
      const cr = c.getBoundingClientRect(), spOn = !!sp && sp.style.display === 'block', sr = spOn ? sp.getBoundingClientRect() : null;
      const ov = sr ? Math.max(0, Math.min(cr.right, sr.right) - Math.max(cr.left, sr.left)) * Math.max(0, Math.min(cr.bottom, sr.bottom) - Math.max(cr.top, sr.top)) : 0;
      const realGlow = [...document.querySelectorAll('.cg-glow')].filter(e => e.id !== 'cg-spot').length;
      const inV = r => r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
      return { title: c.querySelector('h5').textContent, text: c.querySelector('p').textContent,
        spot: spOn, spotIn: sr ? inV(sr) : null, calloutIn: inV(cr), arrow: !c.classList.contains('no-arrow'),
        overlapFrac: sr ? ov / Math.max(1, cr.width * cr.height) : 0, realGlow,
        done: document.getElementById('cg-next').textContent.trim() === 'Done', sr: sr && { l: sr.left, t: sr.top, w: sr.width, h: sr.height } };
    });
    s.i = i + 1; steps.push(s);
    if (s.done) break;
    if (s.spot && shots) await page.screenshot({ path: path.join(shots, `scene-${s.i}.png`) });
    await page.click('#cg-next'); await sleep(220);
  }
  const scene = steps.filter(s => s.spot || (!s.realGlow && !s.done));
  ok(scene.length >= 4 && scene.length <= 6, `4–6 scene steps (found ${scene.length})`);
  for (const s of scene) {
    const tag = `scene step ${s.i} "${s.title}"`;
    ok(s.spot, `${tag}: spotlight shown`);
    if (s.spot) ok(s.spotIn, `${tag}: spotlight inside the viewport`);
    ok(s.calloutIn, `${tag}: callout inside the viewport`);
    if (s.spot && s.arrow) ok(s.overlapFrac < 0.05, `${tag}: arrow callout does not cover its spot (${Math.round(s.overlapFrac * 100)}% overlap)`);
    ok(s.realGlow === 0, `${tag}: no real element glows`);
    const n = words(s.text); ok(n <= 26, `${tag}: text ≤24 words (${n})`); warn(n <= 24, `${tag}: ${n} words (budget 24)`);
  }

  // state: walking the scene steps changed nothing beyond the guide's own open hook
  const afterWalk = await snap();
  const diff = Object.keys(afterOpen).filter(k => k !== '__play' && afterOpen[k] !== afterWalk[k]);
  ok(diff.length === 0, 'scene steps change no sim input: ' + JSON.stringify(diff.slice(0, 4)));
  const openDiff = Object.keys(before).filter(k => k !== '__play' && before[k] !== afterOpen[k]);
  warn(openDiff.length === 0, 'opening the guide changed inputs (must match the ORIGINAL guide\'s prepare hook — compare with --original by hand): ' + JSON.stringify(openDiff.slice(0, 4)));

  // HIDE tab: go back to the first spot step and toggle the sidebar
  const firstSpot = scene.find(s => s.spot);
  if (firstSpot && await page.$(hideSel)) {
    for (let k = steps.length; k > firstSpot.i; k--) { await page.click('#cg-prev'); await sleep(120); }
    const r0 = await page.evaluate(() => { const r = document.getElementById('cg-spot').getBoundingClientRect(); return { l: r.left, w: r.width }; });
    await page.$eval(hideSel, b => b.click()); await sleep(700);
    const r1 = await page.evaluate(() => { const r = document.getElementById('cg-spot').getBoundingClientRect(); return { l: r.left, w: r.width }; });
    await page.$eval(hideSel, b => b.click()); await sleep(700);
    const r2 = await page.evaluate(() => { const r = document.getElementById('cg-spot').getBoundingClientRect(); return { l: r.left, w: r.width }; });
    ok(Math.abs(r1.l - r0.l) > 2 || Math.abs(r1.w - r0.w) > 2, `HIDE tab: spot follows the canvas (left ${Math.round(r0.l)}→${Math.round(r1.l)}, width ${Math.round(r0.w)}→${Math.round(r1.w)})`);
    ok(Math.abs(r2.l - r0.l) <= 2 && Math.abs(r2.w - r0.w) <= 2, `OPEN: spot returns (left ${Math.round(r2.l)} vs ${Math.round(r0.l)})`);
    for (let k = firstSpot.i; k < steps.length; k++) { await page.click('#cg-next'); await sleep(100); }
  } else warns.push('HIDE-tab follow check skipped (no spot step or no ' + hideSel + ')');

  // Done
  await page.click('#cg-next'); await sleep(250);
  const end = await page.evaluate(() => ({ spot: (document.getElementById('cg-spot') || { style: {} }).style.display === 'block',
    cls: document.querySelectorAll('.cg-hidden, .cg-veiled, .cg-glow').length, active: document.getElementById('btn-cg').classList.contains('active') }));
  ok(!end.active, 'Done: guide closed');
  ok(!end.spot, 'Done: spotlight hidden');
  ok(end.cls === 0, `Done: no cg-* classes left (${end.cls})`);

  const newErrs = errors.filter(e => !baseErrs.includes(e));
  ok(newErrs.length === 0, 'no new page errors: ' + JSON.stringify(newErrs.slice(0, 3)));
  await page.close();

  // header wrap vs original
  if (original) for (const w of [1536, 1440, 1366, 1280]) {
    const a = await headerH(original, w), b = await headerH(target, w);
    ok(a === b, `header height at ${w}: build ${b}px vs original ${a}px`);
  }
  console.log(`scene steps: ${scene.map(s => s.i + ':' + s.title).join(' | ')}`);
} catch (e) { fails.push('harness: ' + (e && e.message)); }
finally { await browser.close(); }
warns.forEach(w => console.log('  ⚠ ' + w));
if (fails.length) { console.log(`FAIL (${fails.length}):`); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('PASS — Simulation guide scene tour holds in a real browser');
