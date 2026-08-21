// Targeted flow tests for Build_Baryon.html — exercises the real user journeys
// the generic probe can't: click-to-place quarks, identify, spin flips with
// content kept, mode switches, heavy sector, antibaryons, remove-buttons,
// inquiry gating, reset semantics, and a synthetic drag-drop.
import { createRequire } from 'node:module';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(join(resolve(HERE, '../..'), 'Capacity_SR_sims_v2_engine/_review/'))('puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outdir = join(HERE, 'flow-out'); mkdirSync(outdir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = l => page.screenshot({ path: `${outdir}/${l}.png` });
const R = {}; // results

await page.goto(pathToFileURL(resolve(HERE, '../Build_Baryon.html')).href, { waitUntil: 'networkidle2' });
await sleep(1000);

// helpers that mirror a real user's click path
const clickDisc = q => page.evaluate(q => document.querySelector(`.quark-disc[data-q="${q}"]`)?.click(), q);
const clickBtn = sel => page.evaluate(sel => document.querySelector(sel)?.click(), sel);
const clickByText = txt => page.evaluate(txt => {
  const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(txt));
  if (b) { b.click(); return true; } return false;
}, txt);
const verdict = () => page.evaluate(() => ({
  cls: document.getElementById('verdict').className,
  text: document.getElementById('verdict').innerText.replace(/\s+/g, ' ').slice(0, 300),
}));
const qns = () => page.evaluate(() => ({
  Q: document.getElementById('qns-Q').textContent,
  B: document.getElementById('qns-B').textContent,
  S: document.getElementById('qns-S').textContent,
}));
const slots = () => page.evaluate(() => [...document.querySelectorAll('#slots .slot')].map(s => s.textContent.replace('×', '').trim()));
const libCount = () => page.evaluate(() => document.getElementById('lib-count').textContent);
const modeInline = () => page.evaluate(() => document.getElementById('mode-inline').textContent);

// ---- 1. proton: u,u,d @ J=1/2 (click-to-place path) ----
for (const q of ['u', 'u', 'd']) { await clickDisc(q); await sleep(120); }
R.protonQNs = await qns(); R.protonSlots = await slots();
await clickBtn('#identify-btn'); await sleep(300);
R.protonVerdict = await verdict(); R.libAfterProton = await libCount();
await shot('01-proton');

// ---- 2. keep uud, flip to J=3/2 → slots persist? → Delta+ ----
await clickBtn('#spin-high'); await sleep(200);
R.slotsAfterSpinFlip = await slots(); R.modeAfterSpinFlip = await modeInline();
await clickBtn('#identify-btn'); await sleep(300);
R.deltaVerdict = await verdict(); R.libAfterDelta = await libCount();
await shot('02-delta');

// ---- 3. sss @ J=1/2 → Pauli message; @ J=3/2 → Omega- ----
await clickBtn('#clear-btn'); await clickBtn('#spin-low'); await sleep(150);
for (const q of ['s', 's', 's']) { await clickDisc(q); await sleep(100); }
await clickBtn('#identify-btn'); await sleep(300);
R.sssLowVerdict = await verdict();
await shot('03-sss-jhalf');
await clickBtn('#spin-high'); await sleep(150);
await clickBtn('#identify-btn'); await sleep(300);
R.sssHighVerdict = await verdict(); R.sssQNs = await qns();
await shot('04-omega');

// ---- 4. meson mode: labels, slot count; u + anti-s @ J=0 → K+ ----
await clickByText('Meson'); await sleep(250);
R.mesonSpinLabels = await page.evaluate(() => [document.getElementById('spin-low').textContent, document.getElementById('spin-high').textContent]);
R.mesonSlotCount = (await slots()).length;
R.mesonModeInline = await modeInline();
R.mesonSpinActive = await page.evaluate(() => document.getElementById('spin-low').classList.contains('active') ? 'low' : 'high');
await clickDisc('u'); await sleep(100); await clickDisc('anti-s'); await sleep(100);
R.kaonQNs = await qns();
await clickBtn('#identify-btn'); await sleep(300);
R.kaonVerdict = await verdict();
await shot('05-kaon');

// ---- 5. u + anti-u @ J=0 → pi0 (+eta alternatives); @ J=1 → rho0 (+omega) ----
await clickBtn('#clear-btn'); await sleep(100);
await clickDisc('u'); await clickDisc('anti-u'); await sleep(150);
await clickBtn('#identify-btn'); await sleep(300);
R.pi0Verdict = await verdict();
await clickBtn('#spin-high'); await sleep(150);
await clickBtn('#identify-btn'); await sleep(300);
R.rho0Verdict = await verdict();
await shot('06-rho0');

// ---- 6. invalid: u + u in meson mode → not colour-neutral ----
await clickBtn('#clear-btn'); await sleep(100);
await clickDisc('u'); await clickDisc('u'); await sleep(150);
await clickBtn('#identify-btn'); await sleep(300);
R.uuVerdict = await verdict();
await shot('07-uu-invalid');

// ---- 7. heavy: c + anti-c → beyond table, J/psi hint ----
await clickBtn('#clear-btn'); await sleep(100);
await clickDisc('c'); await clickDisc('anti-c'); await sleep(150);
await clickBtn('#identify-btn'); await sleep(300);
R.ccVerdict = await verdict();
await shot('08-ccbar');

// ---- 8. antibaryon: anti-u anti-u anti-d @ J=1/2 → antiproton ----
await clickByText('Baryon'); await sleep(250);
R.spinAfterModeReturn = await modeInline();
for (const q of ['anti-u', 'anti-u', 'anti-d']) { await clickDisc(q); await sleep(100); }
R.pbarQNs = await qns();
await clickBtn('#identify-btn'); await sleep(300);
R.pbarVerdict = await verdict();
await shot('09-antiproton');

// ---- 9. incomplete: 1 quark → not enough ----
await clickBtn('#clear-btn'); await sleep(100);
await clickDisc('u'); await sleep(100);
await clickBtn('#identify-btn'); await sleep(300);
R.incompleteVerdict = await verdict();

// ---- 10. remove-x button on middle slot ----
await clickBtn('#clear-btn'); await sleep(100);
for (const q of ['u', 'd', 's']) { await clickDisc(q); await sleep(100); }
await page.evaluate(() => document.querySelectorAll('#slots .slot .rmv')[1]?.click()); await sleep(150);
R.slotsAfterRemove = await slots(); R.qnsAfterRemove = await qns();
await shot('10-after-remove');

// ---- 11. shell toggles must not clear slots (uds still in 1st+3rd) ----
await clickBtn('#shell-theme'); await sleep(150);
await clickBtn('#toggle-formal'); await sleep(150);
R.slotsAfterToggles = await slots();
await clickBtn('#shell-theme'); await clickBtn('#toggle-formal'); await sleep(100);

// ---- 12. mode round-trip content behavior (documented, is it silent?) ----
await clickBtn('#clear-btn');
for (const q of ['u', 'u', 'd']) { await clickDisc(q); await sleep(80); }
await clickByText('Meson'); await sleep(150);
await clickByText('Baryon'); await sleep(150);
R.slotsAfterModeRoundTrip = await slots();

// ---- 13. library count now (proton, Delta+, Omega-, K+, pi0, rho0, antiproton = 7) ----
R.libBeforeReset = await libCount();
R.libEntries = await page.evaluate(() => [...document.querySelectorAll('.lib-entry .lib-name')].map(e => e.textContent));

// ---- 14. shell reset: everything back to default ----
await clickBtn('#shell-reset'); await sleep(400);
R.afterReset = { lib: await libCount(), mode: await modeInline(), slots: await slots(), verdict: (await verdict()).text.slice(0, 60) };
await shot('11-after-reset');

// ---- 15. inquiry gating: Next disabled before answering? ----
R.inqNextDisabledBefore = await page.evaluate(() => document.getElementById('inq-next').disabled);
await page.evaluate(() => document.querySelector('#inq-cards .inq-step:first-child .choice[data-correct]')?.click()); await sleep(200);
R.inqNextDisabledAfter = await page.evaluate(() => document.getElementById('inq-next').disabled);
R.inqFeedbackShown = await page.evaluate(() => (document.querySelector('#inq-cards .inq-step:first-child .predict-eval')?.textContent || '').length > 0);
await shot('12-inquiry-answered');

// ---- 16. synthetic HTML5 drop on slot 0 (drop-handler path) ----
await clickBtn('#clear-btn'); await sleep(100);
R.dropWorked = await page.evaluate(() => {
  const slot = document.querySelector('#slots .slot');
  const dt = new DataTransfer();
  dt.setData('text/quark', 's');
  slot.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  return [...document.querySelectorAll('#slots .slot')][0].textContent.replace('×', '').trim();
});

// ---- 17. lecture mode (hide guided inquiry) and restore ----
await clickBtn('#shell-lecture'); await sleep(250);
R.inquiryHidden = await page.evaluate(() => { const z = document.getElementById('aside-inquiry'); return !z || z.offsetParent === null; });
await shot('13-lecture-mode');
await clickBtn('#shell-lecture'); await sleep(250);
R.inquiryRestored = await page.evaluate(() => document.getElementById('aside-inquiry')?.offsetParent !== null);

// ---- 18. info modal open/close ----
await clickBtn('#shell-info'); await sleep(250);
R.infoOpen = await page.evaluate(() => document.getElementById('shell-info-modal')?.classList.contains('open'));
await shot('14-info-modal');
await clickBtn('#shell-info-close'); await sleep(150);
R.infoClosed = await page.evaluate(() => !document.getElementById('shell-info-modal')?.classList.contains('open'));

// ---- 19. __audit cross-checks ----
R.audit = await page.evaluate(() => ({
  proton: window.__audit.at({ quarks: ['u', 'u', 'd'], spin: 0.5 }),
  omega: window.__audit.at({ quarks: ['s', 's', 's'], spin: 1.5 }),
  sssHalf: window.__audit.at({ quarks: ['s', 's', 's'], spin: 0.5 }),
  kplus: window.__audit.at({ quarks: ['u', 'anti-s'], spin: 0 }),
  ccbar: window.__audit.at({ quarks: ['c', 'anti-c'], spin: 0 }),
  uu: window.__audit.at({ quarks: ['u', 'u'], spin: 0 }),
}));

R.jsErrors = errors;
writeFileSync(join(outdir, 'flows.json'), JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));
await browser.close();
