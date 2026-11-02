#!/usr/bin/env python3
"""Build _shared/registry.json: <style> blocks (normalised) shared by >=10 user-version sims."""
import glob, re, hashlib, collections, json, os, sys
R = '/Users/admin/Desktop/simulations-1/Fermi_university_sim_lab_sims/'
K = os.path.dirname(os.path.abspath(__file__))
STYLE = re.compile(r'<style\b([^>]*)>(.*?)</style>', re.S | re.I)
def norm(t): return re.sub(r'\s+', ' ', t).strip()
blocks = collections.defaultdict(list); raw = {}; attrs = {}
for f in sorted(glob.glob(R + '*/*.html')):
    s = open(f, encoding='utf-8', errors='replace').read(); hd = s.find('</head>')
    ms = list(STYLE.finditer(s))
    for idx, m in enumerate(ms):
        n = norm(m.group(2))
        if len(n) < 200: continue
        h = hashlib.md5(n.encode()).hexdigest()[:10]
        blocks[h].append({'sim': f[len(R):], 'position': 'head' if m.start() < hd else 'body', 'order': idx, 'of': len(ms)})
        raw.setdefault(h, m.group(2)); attrs.setdefault(h, m.group(1))
shared = sorted(((h, v) for h, v in blocks.items() if len(v) >= 10), key=lambda x: -len(x[1]) * len(raw[x[0]]))
def name_of(h):
    t = raw[h]; a = attrs[h]
    if 'fermi-uniform-ui' in a: return 'uniform-ui'
    if 'gv-style' in a: return 'gv-style'
    if '@font-face' in t[:400] and 'DMSansUser' in t[:600]: return 'fonts-dmsans-jbmono'
    if '.phys-body.ps-on' in t[:400]: return 'sheet-v2'
    if 'round 3' in t[:300]: return 'sheet-round3'
    if '#sb-hide-tab' in t or 'sb-collapsed' in t: return 'hide-tab'
    if 'ask-euler' in t: return 'ask-euler'
    c = re.search(r'/\*\s*(.{0,60}?)\s*\*/', t); return 'misc-' + h[:6]
reg = []; seen = collections.Counter()
for h, v in shared:
    nm = name_of(h); seen[nm] += 1
    reg.append({'name': nm, 'hash': h, 'attrs': attrs[h].strip(), 'bytes': len(raw[h]), 'sims': [x['sim'] for x in v],
                'position': collections.Counter(x['position'] for x in v).most_common(1)[0][0],
                'order': collections.Counter(f"{x['order']}/{x['of']}" for x in v).most_common(3)})
# variant numbering
cnt = collections.Counter(r['name'] for r in reg); k = collections.Counter()
for r in reg:
    if cnt[r['name']] > 1: k[r['name']] += 1; r['file'] = f"{r['name']}.v{k[r['name']]}.css"
    else: r['file'] = f"{r['name']}.css"
    open(os.path.join(K, r['file']), 'w').write(raw[r['hash']])
json.dump(reg, open(os.path.join(K, 'registry.json'), 'w'), indent=1)
for r in reg: print(f"{r['name']:22s} {r['file']:28s} sims={len(r['sims']):3d} {r['bytes']/1024:7.1f}KB pos={r['position']} order={r['order'][:2]} attrs={r['attrs'][:30]}")
