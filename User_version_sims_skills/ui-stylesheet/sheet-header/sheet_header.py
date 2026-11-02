#!/usr/bin/env python3
"""The Physics sheet header (owner 2026-10-13), ported 1:1 from sim-builder tools/ux.py sheet_header() for the live
user-version sims, which carry the same sheet with two small variations (a static subtitle without an id; QM sims with
a .top-bar <h1> title and phys-btn buttons).

    python3 sheet_header.py <in.html> <out.html>        apply (in == out allowed); prints what changed
    python3 sheet_header.py --check <files...>          report: done / ready / skip (why)

The change (nothing else is touched):
  1. the tutor link <a id="ask-euler"> leaves the top bar (same element, same href, its pending marker if it has one);
     class += phys-tutor, title + label become "Learn this with the AI tutor";
  2. the sheet's "The Physics" heading + subtitle become ONE line: the sim's own short title + that tutor link
     (+ a hidden #phys-kicker the sheet script may still write into);
  3. the download button becomes icon-only (same id, attributes and handler);
  4. sheet-head.html (the sb-sheet-head style block, byte-identical to sim-builder's) + sheet-head-fit.html (keeps the
     tutor label visible on the live sims' older <=1200px top-bar rule) are added just before the
     mobile app-mode block (or the last </body> when there is none), so app-mode stays the last block.
It is built by replacing exact spans of the original text, and then a SequenceMatcher pass proves that every changed byte
lies inside those spans. Idempotent: a sim that already has the one-line header is left unchanged.
Sims without a Physics sheet (no .phys-head) or without a tutor link are skipped (reported), never half-changed."""
import difflib, html as H, pathlib, re, sys

KIT = pathlib.Path(__file__).resolve().parent
STYLE = ((KIT / 'sheet-head.html').read_text(encoding='utf-8').strip() + '\n'          # byte-identical to sim-builder's
         + (KIT / 'sheet-head-fit.html').read_text(encoding='utf-8').strip() + '\n')     # live-fleet companion (label always shown)
ICON = ('<svg viewBox="0 -960 960 960" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M480-320 280-520l56-58 '
        '104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 '
        '56.5T720-160H240Z"/></svg>')
TUTOR_TITLE = 'Start a session with the AI tutor on this topic (opens in a new tab)'
TUTOR_LABEL = 'Learn this with the AI tutor'
FIT_OLD = "var e=document.getElementById('ask-euler');"
FIT_NEW = FIT_OLD + "if(!e||e.closest('#phys-backdrop'))e=document.getElementById('toggle-formal')||document.getElementById('btn-gi');"


TUTOR_RE = re.compile(r'<a\b[^>]*\bid="ask-euler"[^>]*>[\s\S]*?</a>')   # attribute order varies (QM: class before id)


class Skip(Exception):
    pass


def _text(fragment):
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', '', fragment))).strip()


QM_TITLE = re.compile(r'<(span|div|h1|h2)\b[^>]*class="(?:[^"]*\s)?(top-bar-title|shell-title|title-text|sim-title|app-title|header-title|title)(?:\s[^"]*)?"[^>]*>([\s\S]*?)</\1>|<h1\b[^>]*>([\s\S]*?)</h1>')


def plan(t, title_override=None):
    """The list of (start, end, replacement) edits on the original text, or raise Skip. title_override: the title the
    student sees in the top bar (read from the rendered page), for sims whose top-bar title is not static markup."""
    if 'class="phys-title-row"' in t: raise Skip('already done')
    sheet = t.find('<div class="phys-head">')
    if sheet < 0: raise Skip('no Physics sheet')
    tutors = [m for m in TUTOR_RE.finditer(t) if m.start() < sheet]
    if len(tutors) != 1: raise Skip(f'{len(tutors)} tutor links before the sheet (need exactly 1)')
    tm = tutors[0]
    # the sim's short title: the shell title, else the QM top-bar heading, else the sheet subtitle's first part
    title = None
    hs = t.find('<header class="shell-header">')
    if 0 <= hs < sheet:
        m = re.search(r'<div class="shell-title"[^>]*>([\s\S]*?)</div>', t[hs:t.find('</header>', hs)])
        if m: title = _text(re.sub(r'<span[\s\S]*?</span>', '', m.group(1)))
    if not title:
        tb = t.rfind('class="top-bar"', 0, tm.start())
        if tb >= 0:
            m = re.search(r'<h1[^>]*>([\s\S]*?)</h1>', t[tb:tm.start()])
            if m: title = _text(m.group(1))
    pt = re.search(r'<div class="phys-title">\s*<h2>[^<]*</h2>\s*<p class="phys-kicker"(?: id="phys-kicker")?[^>]*>([\s\S]*?)</p>\s*</div>', t[sheet:])
    if not pt: raise Skip('sheet title block not in the expected shape')
    if title_override:
        title = title_override
    if not title:   # QM bars: the title element right before the tutor link (top-bar-title / sim-title / title / h1 ...)
        ms = list(QM_TITLE.finditer(t[max(0, tm.start() - 4000):tm.start()]))
        if ms: title = _text(ms[-1].group(3) if ms[-1].group(3) is not None else ms[-1].group(4))
    if not title:
        title = _text(pt.group(1)).split(' · ')[0]
    if not title: raise Skip('no title found')
    dl = re.search(r'<button id="phys-download" class="((?:shell|phys)-btn) primary"([^>]*)>[^<]*</button>', t[sheet:])
    if not dl: raise Skip('download button not in the expected shape')
    tutor = tm.group(0)
    if re.search(r'class="[^"]*\bphys-tutor\b', tutor) is None:
        tutor, n = re.subn(r'class="([^"]*)"', lambda m: f'class="{m.group(1)} phys-tutor"', tutor, count=1)
        if not n: tutor = re.sub(r'<a\b', '<a class="ask-euler-btn phys-tutor"', tutor, count=1)
    tutor = re.sub(r'title="[^"]*"', f'title="{TUTOR_TITLE}"', tutor, count=1) if 'title="' in tutor else tutor.replace('<a ', f'<a title="{TUTOR_TITLE}" ', 1)
    tutor, n = re.subn(r'(<span class="ask-euler-label">)[^<]*(</span>)', rf'\g<1>{TUTOR_LABEL}\g<2>', tutor, count=1)
    if not n: raise Skip('tutor link has no .ask-euler-label')
    new_title = (f'<div class="phys-title"><div class="phys-title-row"><h2>{H.escape(title, quote=False)}</h2>{tutor}</div>'
                 '<p class="phys-kicker" id="phys-kicker" hidden></p></div>')
    new_dl = f'<button id="phys-download" class="{dl.group(1)} phys-icon-btn"{dl.group(2)} aria-label="Download sheet">{ICON}</button>'
    am = [m.start() for m in re.finditer(r'<script id="fermi-app-mode(?:-roles)?">', t)]
    bodies = [m.start() for m in re.finditer(r'</body\s*>', t, re.I)]
    at = am[0] if am else (bodies[-1] if bodies else len(t))
    # the older uniform-fit script finds the top bar by walking up from #ask-euler; with the tutor in the sheet it must start
    # from the top bar's Physics / Guided Inquiry button instead (shell sims return earlier at .shell-header: left untouched)
    extra = []
    fs = t.find('<script id="fermi-uniform-fit">')
    if fs >= 0 and '<header class="shell-header"' not in t:
        i = t.find(FIT_OLD, fs, t.find('</script>', fs))
        if i < 0: raise Skip('fermi-uniform-fit without the expected tutor walk')
        extra.append((i, i + len(FIT_OLD), FIT_NEW))
    edits = extra + [(tm.start(), tm.end(), ''),
             (sheet + pt.start(), sheet + pt.end(), new_title),
             (sheet + dl.start(), sheet + dl.end(), new_dl),
             (at, at, STYLE)]
    return sorted(edits), title


def apply(t, title_override=None):
    edits, title = plan(t, title_override)
    out, pos = [], 0
    for s, e, rep in edits:
        assert s >= pos, 'overlapping edits'
        out += [t[pos:s], rep]; pos = e
    out.append(t[pos:]); new = ''.join(out)
    prove(t, new, edits)
    return new, title


def prove(old, new, edits):
    """Line-level proof: every changed line of the original lies inside one of the planned edit spans, and the
    replacement text accounts for every added line."""
    ol, nl = old.splitlines(keepends=True), new.splitlines(keepends=True)
    starts, pos = [], 0
    for ln in ol: starts.append(pos); pos += len(ln)
    import bisect
    line_of = lambda off: max(0, bisect.bisect_right(starts, off) - 1)
    spans = [(line_of(s), line_of(max(s, e - 1))) for s, e, _ in edits]
    allowed = set()
    for s, e in spans: allowed.update(range(s, e + 1))
    sm = difflib.SequenceMatcher(None, ol, nl, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal': continue
        lines = range(i1, i2) if i2 > i1 else [i1]          # an insertion sits at line i1
        bad = [i for i in lines if i not in allowed]
        if bad:
            raise AssertionError(f'unexpected change at line {bad[0]}: {"".join(ol[bad[0]:bad[0] + 2])[:120]!r}')
    assert len(TUTOR_RE.findall(new)) == len(TUTOR_RE.findall(old)), 'tutor link duplicated or lost'
    assert new.count('id="sb-sheet-head"') == 1 and new.count('id="fermi-sheet-head-fit"') == 1


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--check']:
        for f in a[1:]:
            t = pathlib.Path(f).read_text(encoding='utf-8')
            try: plan(t); print(f'ready   {f}')
            except Skip as s: print(f'{"done " if "already" in str(s) else "skip "}   {f}  ({s})')
        sys.exit(0)
    if len(a) != 2: sys.exit(__doc__)
    src, dst = map(pathlib.Path, a); t = src.read_text(encoding='utf-8')
    try:
        new, title = apply(t)
    except Skip as s:
        if str(s) == 'already done': dst.write_text(t, encoding='utf-8'); print(f'already done: {src.name}'); sys.exit(0)
        print(f'SKIP {src.name}: {s}'); sys.exit(3)
    dst.write_text(new, encoding='utf-8')
    print(f'sheet header: {src.name} -> title "{title}"')
