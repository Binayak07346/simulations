#!/usr/bin/env python3
"""UI step: put ONE user-version sim on the shared Fermi sim stylesheet (fermi-sim.css, the Horizon "A" look).

    python3 ui_build.py <in.html> <out.html> [--layout qm-legacy] [--canvas-light] [--sim-id ID] [--no-shared]

Run it LAST, after every UX skill (guided-inquiry, controls-tutorial / sim-guide-kit, welcome-overlay, physics sheet).
It never edits the input. In order, stopping at the first failure:
  1. build   design-system/fermi-sim-css/tools/apply.py --channel v1 --guide-mark --shared  (+ the options above):
             - <head> block: theme seed, loader, Inter, the inline FALLBACK copy and the <link> to the CDN address
               https://d6jsp0m3kqowo.cloudfront.net/fermi-sim/v1/fermi-sim.css (every sim reads this one address);
             - stamps <html data-theme="light"> and <body class="light-theme">;
             - guide patch: page controls are marked .fsim-guide-target and outlined by the stylesheet, and the last
               card keeps clear of Play and its "Press Play to start" tip;
             - shared blocks that are byte-identical (whitespace aside) to a registered copy move into the stylesheet
               (<html data-fsim-shared="...">); the same stylesheet is delivered again before </body>.
  2. static  tools/check_static.py: the output is the input plus exactly those edits.
  3. report  which shared blocks moved, which <style> blocks stay inline.
Then run the gates (SKILL.md): sim-guide-kit/check.mjs, lastcard.mjs, fallback.mjs, and look at the screenshots.

--sim-id is ONLY for sims whose frame values the stylesheet has measured (design-system/fermi-sim-css/_generated/
calibrated-ids.json; apply.py refuses others). Leave it out for a new sim or a new family: the sim keeps its own spacing.
The stylesheet kit lives at $FERMI_SIM_CSS (default: design-system/fermi-sim-css in this repo); never copy it.
"""
import os, pathlib, re, subprocess, sys

KIT = pathlib.Path(os.environ.get('FERMI_SIM_CSS', pathlib.Path(__file__).resolve().parents[3] / 'design-system' / 'fermi-sim-css'))
CDN = 'https://d6jsp0m3kqowo.cloudfront.net'


def main(a):
    if len(a) < 2 or a[0].startswith('-'): sys.exit(__doc__)
    src, out, rest = pathlib.Path(a[0]).resolve(), pathlib.Path(a[1]).resolve(), a[2:]
    assert (KIT / 'tools' / 'apply.py').exists(), f'stylesheet kit not found at {KIT} (set FERMI_SIM_CSS)'
    html = src.read_text(encoding='utf-8', errors='surrogateescape')
    assert 'FERMI-SIM CSS' not in html, 'input already carries the stylesheet block: start from the UX build, not a UI build'
    if 'id="gv-engine"' not in html: print('  WARN no guide v2 engine (#gv-engine): run the UX skills first; --guide-mark has nothing to patch')
    opts = ['--channel', 'v1']
    if 'id="gv-engine"' in html: opts.append('--guide-mark')
    if '--no-shared' not in rest: opts.append('--shared')
    for k in ('--layout', '--sim-id'):
        if k in rest: opts += [k, rest[rest.index(k) + 1]]
    if '--canvas-light' in rest: opts.append('--canvas-light')
    r = subprocess.run([sys.executable, str(KIT / 'tools/apply.py'), str(src), str(out), '--cdn', CDN, *opts], capture_output=True, text=True)
    print((r.stdout + r.stderr).strip().splitlines()[-1] if (r.stdout + r.stderr).strip() else '')
    if r.returncode: sys.exit('build FAILED')
    r = subprocess.run([sys.executable, str(KIT / 'tools/check_static.py'), str(src), str(out)], capture_output=True, text=True)
    print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr.strip()[-300:])
    if r.returncode: sys.exit('static check FAILED')
    b = out.read_text(encoding='utf-8', errors='surrogateescape')
    m = re.search(r'<html\b[^>]*\bdata-fsim-shared="([^"]*)"', b)
    left = [re.sub(r'\s+', ' ', x)[:60] for x in re.findall(r'<style\b([^>]*)>', b) if 'fermi-sim-inline' not in x]
    print(f'  moved into the stylesheet: {m.group(1) if m else "none"}')
    print(f'  <style> blocks still inline: {len(left)} (the sim\'s own CSS; a skill block that is not byte-identical to its '
          f'registered copy also stays, and works: the stylesheet only adds the A look)')
    print(f'ok {out}')


if __name__ == '__main__':
    main(sys.argv[1:])
