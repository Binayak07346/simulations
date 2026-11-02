#!/usr/bin/env python3
"""Render a sim's equations (LaTeX) and diagrams (TikZ) to theme-aware inline SVGs.

Usage:
    python3 gen_assets.py path/to/spec.py [outdir]

The spec module (copy example_spec_coriolis.py) defines:
    EQS   : dict name -> LaTeX math string (rendered with $...$, amsmath loaded)
    DIAGS : dict name -> full tikzpicture body (arrows.meta available)
    EQ_SCALE : optional float, px-per-pt scale for equations (default 1.5)

Outputs into <outdir> (default ./assets_build):
    <name>.svg for every asset, art.json mapping name -> post-processed SVG string,
    and <name>.png rasters at 160 dpi.

VIEW EVERY PNG before assembly (pitfalls #7) — clipping and layout flaws are only
caught by looking.

Post-processing (do not remove — each step is a fixed bug):
  * fill/stroke rgb(0%,0%,0%) -> currentColor          (theme-aware, pitfalls #4)
  * per-file id namespacing for id=/xlink:href/url(#)  (poppler collisions, #3)
  * XML prolog stripped                                (inline embedding)
  * equations: width/height scaled by EQ_SCALE + max-width:100% inline style
  * diagrams: width/height removed (CSS-fluid), viewBox kept
Colors predefined for TikZ/xcolor: acc (RGB 47,143,132), cyn (6,182,212),
amb (245,158,11) — acc is the sheet accent; cyn/amb match the shell's trail colors.
Requires: pdflatex with tikz + pdftocairo (poppler). Fully offline.
"""
import importlib.util, io, os, re, subprocess, sys, json

PRE = r"""\documentclass[preview,border=%(border)s]{standalone}
\usepackage{amsmath,amssymb,xcolor}
\usepackage{tikz}
\usetikzlibrary{arrows.meta}
\definecolor{acc}{RGB}{47,143,132}
\definecolor{cyn}{RGB}{6,182,212}
\definecolor{amb}{RGB}{245,158,11}
\begin{document}
"""
POST = "\n\\end{document}\n"


def render(name, body, border):
    io.open(f'{name}.tex', 'w').write(PRE % {'border': border} + body + POST)
    r = subprocess.run(['pdflatex', '-interaction=nonstopmode', f'{name}.tex'],
                       capture_output=True, text=True)
    if not os.path.exists(f'{name}.pdf'):
        sys.stderr.write(r.stdout[-2000:])
        raise SystemExit(f'{name}: pdflatex failed — see log above')
    subprocess.run(['pdftocairo', '-svg', f'{name}.pdf', f'{name}.svg'], check=True)
    subprocess.run(['pdftocairo', '-png', '-r', '160', '-singlefile',
                    f'{name}.pdf', name], check=True)
    svg = io.open(f'{name}.svg').read()
    svg = re.sub(r'(fill|stroke)="rgb\(0%,\s*0%,\s*0%\)"', r'\1="currentColor"', svg)
    svg = re.sub(r'id="', f'id="{name}-', svg)
    svg = re.sub(r'xlink:href="#', f'xlink:href="#{name}-', svg)
    svg = re.sub(r'url\(#', f'url(#{name}-', svg)
    svg = re.sub(r'^<\?xml[^>]*\?>\s*', '', svg)
    return svg


def scale_eq(svg, k):
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w, h = float(m.group(1)), float(m.group(2))
    def fix_tag(mm):
        tag = mm.group(0)
        tag = re.sub(r'\bwidth="[^"]+"', f'width="{w*k:.1f}"', tag)
        tag = re.sub(r'\bheight="[^"]+"', f'height="{h*k:.1f}"', tag)
        return tag
    # Only the root <svg> tag — a naive width="..." replace also hits
    # stroke-width on fraction bars / sqrt vinculums and blobs the glyph.
    svg = re.sub(r'<svg\b[^>]*>', fix_tag, svg, count=1)
    return svg.replace('<svg ', '<svg style="max-width:100%;height:auto" aria-hidden="true" ', 1)


def fluid(svg):
    svg = re.sub(r'width="[\d.]+"\s+height="[\d.]+"\s+', '', svg, count=1)
    return svg.replace('<svg ', '<svg aria-hidden="true" ', 1)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    spec_path = os.path.abspath(sys.argv[1])
    outdir = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else 'assets_build')
    m = importlib.util.spec_from_file_location('spec', spec_path)
    spec = importlib.util.module_from_spec(m); m.loader.exec_module(spec)
    k = getattr(spec, 'EQ_SCALE', 1.5)
    os.makedirs(outdir, exist_ok=True)
    os.chdir(outdir)
    art = {}
    for name, tex in spec.EQS.items():
        # The docstring promises math mode: wrap bare strings in $...$ (strings that
        # already carry $ or a display environment are left exactly as written).
        if '$' not in tex and '\\[' not in tex and '\\begin{' not in tex:
            tex = '$' + tex + '$'
        art[name] = scale_eq(render(name, tex, '2pt'), k)
        print(f'{name}: ok ({len(art[name])} chars)')
    for name, tikz in spec.DIAGS.items():
        art[name] = fluid(render(name, tikz, '7pt'))
        print(f'{name}: ok ({len(art[name])} chars)')
    io.open('art.json', 'w').write(json.dumps(art))
    print(f'\nart.json written ({sum(len(v) for v in art.values())} total chars).')
    print(f'NOW VIEW every PNG in {outdir}/ before assembling — see pitfalls #7.')


if __name__ == '__main__':
    main()
