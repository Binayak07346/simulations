#!/usr/bin/env python3
"""Prove a build changed nothing but our block and the two theme stamps.

    python3 tools/check_static.py PRISTINE.html BUILT.html

Removes the FERMI-SIM CSS block (BEGIN..END markers) and the two stamps
(data-theme="light" on the first <html>, light-theme on the first <body>) from BUILT,
then requires the result to be byte-identical to PRISTINE. Exit 1 otherwise.
"""
import pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import flow_patch, guide_patch, shared_extract
o = open(sys.argv[1], encoding='utf-8').read(); b = open(sys.argv[2], encoding='utf-8').read()
m = re.search(r'\n?<!-- FERMI-SIM CSS v[\w.-]+ BEGIN.*?<!-- FERMI-SIM CSS v[\w.-]+ END -->\n', b, re.S)
if not m: print('FAIL no FERMI-SIM block'); sys.exit(1)
if len(re.findall(r'FERMI-SIM CSS v[\w.-]+ BEGIN', b)) != 1: print('FAIL more than one block'); sys.exit(1)
s = guide_patch.reverse(flow_patch.reverse(b[:m.start()] + b[m.end():]))
tm = re.search(r'<!-- FERMI-SIM CSS v[\w.-]+ TAIL BEGIN.*?<!-- FERMI-SIM CSS v[\w.-]+ TAIL END -->\n', s, re.S)
if tm: s = s[:tm.start()] + s[tm.end():]   # Wave 3 tail copy   # an applied guide patch is reversed exactly (or this fails)
h = s.find('</head>')
mh = re.search(r'<html\b[^>]*>', s); s = s[:mh.start()] + re.sub(r' data-fsim-(?:layout|id|shared)="[^"]*"', '', mh.group(0).replace(' data-theme="light"', '', 1)) + s[mh.end():]
# a sim that pinned its own data-theme on <html> has it replaced by the stamp: compare <html> tags without it
po = re.search(r'<html\b[^>]*>', o); ps = re.search(r'<html\b[^>]*>', s)
if 'data-theme' in po.group(0):
    o = o[:po.start()] + re.sub(r'\s+data-theme\s*=\s*"[^"]*"', '', po.group(0)) + o[po.end():]
mb = re.compile(r'<body\b[^>]*>').search(s, s.find('</head>'))
tag = mb.group(0)
tag2 = re.sub(r' class="light-theme(?: light-mode)?"', '', tag, count=1) if re.search(r' class="light-theme(?: light-mode)?"', tag) else re.sub(r'(class="[^"]*?)\s*light-theme(?: light-mode)?"', r'\1"', tag, count=1)
s = s[:mb.start()] + tag2 + s[mb.end():]
if tm:
    ok, msg = shared_extract.verify_only_removed(o, s)
    print(('PASS ' if ok else 'FAIL ') + 'only the blocks, the stamps and ' + msg); sys.exit(0 if ok else 1)
if s == o: print(f'PASS only the block (+{len(m.group(0)):,} bytes) and the two stamps changed'); sys.exit(0)
i = next(i for i, (x, y) in enumerate(zip(s, o)) if x != y) if any(x != y for x, y in zip(s, o)) else min(len(s), len(o))
print(f'FAIL differs at char {i}: built …{s[max(0,i-60):i+60]!r}… vs pristine …{o[max(0,i-60):i+60]!r}…'); sys.exit(1)
