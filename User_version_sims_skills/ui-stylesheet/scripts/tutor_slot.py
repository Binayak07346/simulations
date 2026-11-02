#!/usr/bin/env python3
"""Put the "Teach me" (AI tutor) header button in place of the legacy Info affordance, with NO link yet.
   python3 tutor_slot.py <in.html> <out.html>      -> prints 'slot: <how>' or 'slot: already present'

The button is the same markup the wired sims carry (<a id="ask-euler" class="ask-euler-btn">), minus href, and carries
data-tutor-pending until wire_tutor.py sets the real URL. Styling comes from fermi-sim.css (#ask-euler rules); the
`ask-euler.v1` token is added to html[data-fsim-shared] so the pill layout rules apply. Idempotent. Run it on the
sim BEFORE the guide build (the guide build only renames an existing button; it never creates one).
Links come from the owner; this script never invents a URL.
"""
import re, sys, pathlib

A = ('<a id="ask-euler" class="ask-euler-btn" data-tutor-pending="1" target="_blank" rel="noopener noreferrer" '
     'title="Learn this with the AI tutor (opens in a new tab)"><span class="ask-euler-icon" aria-hidden="true">✦</span>'
     '<span class="ask-euler-label">Teach me</span></a>')
HIDE_LEGACY = '<style data-fsim-shared-extra="tutor-slot">.info-container,.info-icon-wrapper{display:none !important}</style>'

def slot(h):
    how = 'already present' if 'id="ask-euler"' in h else None
    # 1. shell family: swap the Info button
    if not how:
        h2, n = re.subn(r'<button[^>]*id="shell-info"[^>]*>[^<]*</button>', A, h, count=1)
        if n: h, how = h2, 'replaced #shell-info'
    # 2. shell header without an Info button: first group in the shell header
    if not how:
        h2, n = re.subn(r'(<header class="shell-header">.*?<div class="shell-group">)', lambda m: m.group(1) + A, h, count=1, flags=re.S)
        if n: h, how = h2, 'inserted in shell-header group'
    # 3. top-bar families: before the guide buttons, legacy info icon hidden
    if not how:
        h2, n = re.subn(r'(<div class="guide-actions">)', lambda m: HIDE_LEGACY + A + m.group(1), h, count=1)
        if n:
            h = h2
            how = 'inserted before .guide-actions (legacy info icon hidden)'
    if not how:
        return h, None
    h = re.sub(r'(<html[^>]*data-fsim-shared=")([^"]*)(")',
               lambda m: m.group(1) + (m.group(2) if 'ask-euler.v1' in m.group(2) else (m.group(2) + ' ask-euler.v1').strip()) + m.group(3), h, count=1)
    return h, how

if __name__ == '__main__':
    src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    out, how = slot(src.read_text())
    if how is None:
        print('slot: NO HEADER SLOT FOUND (add by hand)'); sys.exit(2)
    dst.write_text(out); print('slot:', how)
