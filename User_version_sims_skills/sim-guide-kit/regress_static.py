"""File-level 'nothing else changed' audit.   python3 regress_static.py <original.html> <built.html>
Strips the changes the guide v2 is ALLOWED to make, then diffs what is left:
  - the guide layer block (<!-- GUIDE V2 LAYER ... /GUIDE V2 LAYER -->)
  - narration clips whose id starts with "gv-" (the manifest is compared clip by clip)
  - the Ask Euler / Ask AI Tutor -> Teach me label and tooltip
Everything else must be byte-identical, except hunks the per-sim hooks.py added (they are listed for review).
Prints a JSON summary on the last line: {"identical": bool, "hunks": n, "added_lines": n, "removed_lines": n, "manifest_ok": bool}"""
import sys, re, json, difflib

o = open(sys.argv[1], encoding='utf-8').read()
b = open(sys.argv[2], encoding='utf-8').read()

def manifest(h):
    i = h.find('const manifest=')
    if i < 0:
        return None, h
    j = i + len('const manifest=')
    m, end = json.JSONDecoder().raw_decode(h, j)
    return m, h[:j] + '__MANIFEST__' + h[end:]

mo, o2 = manifest(o)
mb, b2 = manifest(b)
manifest_ok = True
if mo is not None:
    keep = [c for c in (mb or {}).get('clips', []) if not str(c.get('id', '')).startswith('gv-')]
    manifest_ok = [(c['id'], c['text']) for c in mo['clips']] == [(c['id'], c['text']) for c in keep]
a = b2.find('<!-- GUIDE V2 LAYER'); z = b2.find('<!-- /GUIDE V2 LAYER -->')
layer_ok = a > 0 and z > a
if layer_ok:
    e = z + len('<!-- /GUIDE V2 LAYER -->')
    if b2[e:e + 1] == '\n': e += 1          # build.py adds one newline after the block
    b2 = b2[:a] + b2[e:]
_ol = re.search(r'<span class="ask-euler-label">[^<]*</span>', o2)   # undo build.py's rename: back to the original's label/tooltip
b2 = b2.replace('<span class="ask-euler-label">Teach me</span>', _ol.group(0) if _ol else '<span class="ask-euler-label">Ask Euler</span>')
b2 = re.sub(r'title="Learn this with the AI tutor \(opens in a new tab\)"',
            lambda m: re.search(r'title="Ask (?:Euler|the AI Tutor) about this simulation[^"]*"', o2).group(0) if re.search(r'title="Ask (?:Euler|the AI Tutor) about this simulation[^"]*"', o2) else m.group(0), b2)

ol, bl = o2.splitlines(), b2.splitlines()
hunks, add, rem, show = 0, 0, 0, []
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ol, bl, autojunk=False).get_opcodes():
    if tag == 'equal':
        continue
    hunks += 1; rem += i2 - i1; add += j2 - j1
    if len(show) < 8:
        show.append(f'@@ {tag} orig {i1 + 1}-{i2} / built {j1 + 1}-{j2}')
        show += ['  - ' + l[:150] for l in ol[i1:min(i2, i1 + 3)]] + ['  + ' + l[:150] for l in bl[j1:min(j2, j1 + 3)]]
print('\n'.join(show))
print(json.dumps({'identical': hunks == 0 and manifest_ok and layer_ok, 'layer_found': layer_ok, 'hunks': hunks,
                  'added_lines': add, 'removed_lines': rem, 'manifest_ok': manifest_ok}))
