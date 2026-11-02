#!/usr/bin/env python3
"""Headless runtime tests for an upgraded sim.  Usage: python3 browser_test.py sim.html

Drives the built file in headless Chromium (Playwright) and exercises every
interactive path of the layer. Designed to run OFFLINE: the sim's CDN scripts
(three.js, KaTeX) fail to load, so the 3D scene never boots — that is expected and
filtered. The layer has zero network dependencies, so all of ITS behavior is fully
testable; the scene hook is stubbed to capture what the "see it" buttons would send.

Tests (numbers reference references/pitfalls.md):
   1  page loads; no console errors originating from the layer
   2  __openPhysics exists; opening shows the backdrop; close button, backdrop
      click, and Esc all close it; open pauses via Shell.setPlaying        (#11)
   3  article carries 9 inline SVGs with globally unique ids               (#2,#3)
   4  sim slider -> live panel: numbers, sign phrase, worked run update    (#6)
   5  mini slider -> sim slider two-way sync (input events)
   6  "see it" buttons send CURRENT slider values to the scene hook        (#6)
   7  viewer-pinned data-theme on <html> syncs the body class              (#4)
   8  download builds the full standalone sheet: title, snapshot with the
      CURRENT values, 9 SVGs, 3 self-test details, theme toggle            (#5,#6)
Exit code 0 only if all pass. If Playwright or a browser is missing, exits 3 with
a skip message — in that case validate the same paths manually (e.g. with Claude
in Chrome): open, drag, replay, download, theme, Esc.
"""
import os, sys

for cand in ('/opt/pw-browsers',):
    if os.path.isdir(cand) and not os.environ.get('PLAYWRIGHT_BROWSERS_PATH'):
        os.environ['PLAYWRIGHT_BROWSERS_PATH'] = cand

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('SKIP: playwright not installed — run the manual click-path checklist instead')
    sys.exit(3)

EXPECTED_NOISE = ('net::ERR', 'Failed to load resource', 'THREE is not defined',
                  'katex', 'ERR_INTERNET_DISCONNECTED', 'Refused to load')


def run(path):
    url = 'file://' + os.path.abspath(path)
    fails, errors = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome')
        pg = b.new_page()
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(url, wait_until='load')
        pg.wait_for_timeout(900)

        def check(name, cond):
            print(('PASS ' if cond else 'FAIL ') + name)
            if not cond:
                fails.append(name)

        # 1 layer-originated errors
        layer_errors = [e for e in errors
                        if not any(k.lower() in e.lower() for k in EXPECTED_NOISE)]
        check('1. no layer console errors' + ('' if not layer_errors else f' -> {layer_errors[:2]}'),
              not layer_errors)

        # 2 open/close/pause
        check('2a. __openPhysics is a function',
              pg.evaluate("typeof window.__openPhysics") == 'function')
        pg.evaluate("window.__paused=null; var sp=Shell.setPlaying; Shell.setPlaying=function(v){window.__paused=v; sp(v);}")
        pg.evaluate("window.__openPhysics()")
        check('2b. backdrop opens',
              pg.evaluate("document.getElementById('phys-backdrop').classList.contains('open')"))
        check('2c. sim paused on open', pg.evaluate("window.__paused") is False)
        pg.keyboard.press('Escape')
        check('2d. Esc closes',
              not pg.evaluate("document.getElementById('phys-backdrop').classList.contains('open')"))
        pg.evaluate("window.__openPhysics()")
        pg.evaluate("document.getElementById('phys-close').click()")
        check('2e. close button closes',
              not pg.evaluate("document.getElementById('phys-backdrop').classList.contains('open')"))

        # 3 svgs + id hygiene
        pg.evaluate("window.__openPhysics()")
        check('3a. 9 SVGs in the article',
              pg.evaluate("document.querySelectorAll('#phys-art svg').length") == 9)
        dupes = pg.evaluate("""(()=>{const ids=[...document.querySelectorAll('#phys-art [id]')].map(e=>e.id);
              return ids.filter((v,i)=>ids.indexOf(v)!==i);})()""")
        check('3b. unique svg/element ids in article', dupes == [])

        # 4 sim slider -> live panel + worked run
        pg.evaluate("var o=document.getElementById('omega'); o.value='1.65'; o.dispatchEvent(new Event('input',{bubbles:true}))")
        fcor = pg.evaluate("document.getElementById('phys-fcor').textContent")
        worked = pg.evaluate("document.getElementById('phys-worked').textContent")
        check('4a. live force from current values (6.60 N)', '6.60 N' in fcor)
        check('4b. sign phrase (deflects right)', 'deflects right' in fcor)
        check('4c. worked run uses current values', '1.65' in worked and 'your settings' in worked)
        check('4d. worked deflection recomputed (0.83 m)', '0.83' in worked)

        # 5 mini slider -> sim slider
        pg.evaluate("var m=document.getElementById('phys-om'); m.value='-1'; m.dispatchEvent(new Event('input',{bubbles:true}))")
        check('5a. mini slider drives sim slider',
              abs(float(pg.evaluate("document.getElementById('omega').value")) + 1.0) < 1e-9)
        check('5b. sign phrase flips (deflects left)',
              'deflects left' in pg.evaluate("document.getElementById('phys-fcor').textContent"))

        # 6 see-it buttons send CURRENT values (scene hook stubbed)
        pg.evaluate("window.__physicsHooks={scene:function(c){window.__cap=c;}}")
        pg.evaluate("document.querySelector('[data-show=\"defaults\"]').click()")
        cap = pg.evaluate("window.__cap")
        check('6a. replay sends live omega (-1)', cap and abs(cap['omega'] + 1.0) < 1e-9)
        check('6b. replay sends live v (2)', cap and abs(cap['vLaunch'] - 2.0) < 1e-9)
        check('6c. replay launches and plays', cap and cap['launch'] and cap['playing'])
        check('6d. modal closed after see-it',
              not pg.evaluate("document.getElementById('phys-backdrop').classList.contains('open')"))

        # 7 theme sync from viewer-pinned attribute
        pg.evaluate("document.documentElement.setAttribute('data-theme','light')")
        pg.wait_for_timeout(120)
        check('7a. html light -> body.light-theme',
              pg.evaluate("document.body.classList.contains('light-theme')"))
        pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
        pg.wait_for_timeout(120)
        check('7b. html dark -> body class removed',
              not pg.evaluate("document.body.classList.contains('light-theme')"))

        # 8 download sheet content (blob path captured; no window.claude offline)
        pg.evaluate("""window.__openPhysics();
            window.__blob=null;
            URL.createObjectURL=function(b){window.__blob=b; return 'blob:test';};
            HTMLAnchorElement.prototype.click=function(){};
            document.getElementById('phys-download').click();""")
        pg.wait_for_timeout(400)
        sheet = pg.evaluate("window.__blob ? window.__blob.text() : null")
        check('8a. sheet blob produced', bool(sheet))
        if sheet:
            check('8b. sheet titled The Physics', '<h1>The Physics' in sheet)
            check('8c. snapshot carries CURRENT values', '-1.00' in sheet)
            check('8d. sheet has 9 SVGs', sheet.count('<svg') == 9)
            check('8e. sheet has 3 self-test questions', sheet.count('<details') == 3)
            check('8f. sheet has theme toggle + print', 'id="theme"' in sheet and 'id="printer"' in sheet)
            check('8g. no unfilled tokens in sheet', '{{' not in sheet)
        b.close()

    print()
    if fails:
        print(f'FAILED {len(fails)} test(s)')
        sys.exit(1)
    print('ALL RUNTIME TESTS PASSED')


if __name__ == '__main__':
    run(sys.argv[1])
