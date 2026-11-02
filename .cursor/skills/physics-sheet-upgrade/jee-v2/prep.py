#!/usr/bin/env python3
"""jee-v2 pre-patch: make a JEE testprep sim installable by kit/install.py.
   python3 prep.py <jee-sim.html> <prepped-raw.html>
The JEE shell wires '∑ Formal' with spaced code (`if (tFormal) tFormal.addEventListener('click', () => {...toggle strip...});`)
which install.py's compact-form regex misses. This rewrites ONLY that listener body to open the Physics sheet (the same edit
install.py makes on the other shells). Anchor-asserted: exactly one match, else abort with nothing written."""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
# C024-style Shell sims ship without the header Formal button: add the same button the other 100 have (right after Maximize) so install.py takes its normal Shell path.
if 'id="toggle-formal"' not in s:
    m = re.search(r'(<button id="shell-maximize"[^>]*>[^<]*</button>)', s); assert m, 'no toggle-formal button and no shell-maximize anchor'
    s = s[:m.end()] + '\n        <button id="toggle-formal" class="shell-btn">\u2211 Formal</button>' + s[m.end():]
pat = r"(if\s*\(tFormal\)\s*tFormal\.addEventListener\('click',\s*\(\)\s*=>\s*\{)[^}]*(\}\);)"
s2, n = re.subn(pat, "if (tFormal) tFormal.addEventListener('click', () => {" + r"\n      // Physics layer: open the revision sheet instead of toggling the strip.\n      if(window.__openPhysics) window.__openPhysics();\n    \2", s)
assert n == 1, 'tFormal listener matched %d times' % n
# some sims embed a save-config feature whose JS strings contain the literal tags '</body>' / '</head>' (doc.replace('</body>', ...)); install.py and the guide
# build need exactly one real </body>. '<\/body>' is the same JS string value, so behaviour is unchanged.
for tag in ('body', 'head'):
    k = s2.rfind('</%s>' % tag)   # the real closing tag is the LAST one; the others sit inside JS strings
    s2 = s2[:k].replace('</%s>' % tag, '<\\/%s>' % tag) + s2[k:]
assert s2.count('</body>') == 1 and s2.count('</head>') == 1
open(dst, 'w').write(s2)
print('prepped', src, '->', dst)
