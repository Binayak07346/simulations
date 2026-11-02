#!/usr/bin/env python3
"""Drop the header subtitle span inside .shell-title (it pushes Play off-screen at 1280 px). Idempotent.
   python3 drop_subtitle.py <html> [<html>...]   -> prints 'dropped' or 'none' per file"""
import re, sys, pathlib
PAT = re.compile(r'(<div class="shell-title"[^>]*>)([^<]*)(?:\s*<span[^>]*>[^<]*</span>)(\s*</div>)')   # no DOTALL, no tags in the title text: must never reach past the title div
def strip(t):
    return PAT.subn(lambda m: m.group(1) + m.group(2).rstrip() + m.group(3).lstrip(), t, count=1)
if __name__ == '__main__':
    for p in sys.argv[1:]:
        f = pathlib.Path(p); new, n = strip(f.read_text())
        if n: f.write_text(new)
        print(p, 'dropped' if n else 'none')
