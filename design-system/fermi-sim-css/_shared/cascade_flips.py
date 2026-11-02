#!/usr/bin/env python3
"""Which contests would flip if a shared <style> block moved from its place to the START of <head>?
For each sim that has the block: rules in EARLIER style blocks (which today lose ties to the shared block) with the
same selector target, same property, same importance and EQUAL specificity would start to win. Media context must
match (or either side unconditional). Static and conservative (same normalised selector or same final compound)."""
import re, json, glob, collections, sys, os
R = '/Users/admin/Desktop/simulations-1/Fermi_university_sim_lab_sims/'
K = os.path.dirname(os.path.abspath(__file__)); reg = json.load(open(K + '/registry.json'))
STYLE = re.compile(r'<style\b([^>]*)>(.*?)</style>', re.S | re.I)
def norm(t): return re.sub(r'\s+', ' ', t).strip()
def spec(sel):
    s = re.sub(r':where\((?:[^()]|\([^()]*\))*\)', '', sel)
    s = re.sub(r'::?(?:is|not|has)\(', ' ', s).replace(')', ' ')
    a = len(re.findall(r'#[\w-]+', s)); b = len(re.findall(r'\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+', s))
    c = len(re.findall(r'(?:^|[\s>+~(])([a-zA-Z][\w-]*)', s)) + len(re.findall(r'::[\w-]+', s))
    return (a, b, c)
def rules(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S); out = []; stack = []; cur = ''
    for ch in css:
        if ch == '{': stack.append(cur.strip()); cur = ''
        elif ch == '}':
            if stack:
                head = stack.pop()
                if cur.strip() and not head.startswith('@'):
                    media = ' '.join(h for h in stack if h.startswith('@')) or ''
                    for sel in head.split(','):
                        sel = norm(sel)
                        for d in cur.split(';'):
                            if ':' not in d: continue
                            p, v = d.split(':', 1); p = p.strip().lower()
                            if p.startswith('--') or not p: continue
                            out.append((media, sel, p, '!important' in v))
            cur = ''
        else: cur += ch
    return out
def last_compound(sel): return re.split(r'[\s>+~]+', sel.strip())[-1]
report = {}
for r in reg:
    if r['position'] != 'body' and r['name'] != 'fonts-dmsans-jbmono': pass
    raw = open(K + '/' + r['file']).read(); shared = rules(raw)
    idx = collections.defaultdict(list)
    for m, sel, p, imp in shared: idx[(last_compound(sel), p)].append((m, sel, imp, spec(sel)))
    flips = collections.Counter(); ex = []; sims_hit = set()
    for sim in r['sims']:
        s = open(R + sim, errors='replace').read(); blocks = list(STYLE.finditer(s))
        k = next(i for i, b in enumerate(blocks) if norm(b.group(2)) == norm(raw))
        for b in blocks[:k]:                                  # earlier blocks: today they lose ties
            for m, sel, p, imp in rules(b.group(2)):
                for sm, ssel, simp, ssp in idx.get((last_compound(sel), p), []):
                    if imp != simp or spec(sel) != ssp: continue
                    if m and sm and m != sm: continue
                    if norm(sel) != ssel and last_compound(sel) == sel: pass
                    flips[(ssel, p)] += 1; sims_hit.add(sim)
                    if len(ex) < 6: ex.append(f'{sim.split("/")[-1][:34]}: earlier `{sel[:50]}` {{{p}}} ties shared `{ssel[:50]}`')
    report[r['file']] = {'sims': len(r['sims']), 'sims_with_flips': len(sims_hit), 'contests': sum(flips.values()), 'top': flips.most_common(6), 'examples': ex}
    print(f"{r['file']:28s} sims {len(r['sims']):3d} · sims with flip-risk {len(sims_hit):3d} · contests {sum(flips.values()):5d} · top {[f'{a[0][:28]}{{{a[1]}}}×{n}' for a,n in flips.most_common(3)]}")
json.dump(report, open(K + '/cascade_flips.json', 'w'), indent=1)
