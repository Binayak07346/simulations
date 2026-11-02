#!/usr/bin/env python3
"""Wire (or audit) the Ask AI Tutor links.  Links come from the owner; never guess one.
   python3 wire_tutor.py <map.json> <file.html> [...]   map.json = {"<file stem or slug>": "https://...", ...}
        sets href on <a id="ask-euler" data-tutor-pending> and drops the pending marker (in place; back up first)
   python3 wire_tutor.py --audit <file.html> [...]       lists files whose button has no href (still pending) or is missing
A file's key is its name without .html / .user-version.html."""
import json, pathlib, re, sys
def stem(p): return re.sub(r'(\.user-version)?\.html$', '', pathlib.Path(p).name)
args = sys.argv[1:]
if args and args[0] == '--audit':
    bad = 0
    for f in args[1:]:
        h = pathlib.Path(f).read_text(); m = re.search(r'<a id="ask-euler"[^>]*>', h)
        st = 'MISSING' if not m else ('PENDING' if 'data-tutor-pending' in m.group(0) or 'href=' not in m.group(0) else 'wired')
        if st != 'wired': bad += 1; print(st, f)
    print(f'{bad} not wired of {len(args) - 1}'); sys.exit(1 if bad else 0)
mp = json.load(open(args[0])); n = 0
for f in args[1:]:
    p = pathlib.Path(f); h = p.read_text(); url = mp.get(stem(f))
    if not url: print('no link for', stem(f)); continue
    if not re.fullmatch(r'https://[^\s"<>]+', url): print('BAD URL', stem(f), url); continue
    h2, k = re.subn(r'<a id="ask-euler"([^>]*?)\s*data-tutor-pending="1"([^>]*)>', lambda m: f'<a id="ask-euler"{m.group(1)} href="{url}"{m.group(2)}>', h, count=1)
    if k: p.write_text(h2); n += 1
    else: print('no pending button in', f)
print('wired', n)
