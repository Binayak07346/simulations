"""Anchor check for build.py. Importable (checks list) or: python3 preflight.py <dir-of-sim-folders> to scan sims that still have a v1 sheet."""
import re,sys,glob,os
checks=[
 ('article', lambda s: s.count('<article class="phys-art" id="phys-art">')==1 and '</article>' in s),
 ('aria', lambda s: len(re.findall(r'aria-label="The Physics — revision sheet[^"]*"',s))==1),
 ('kicker', lambda s: len(re.findall(r'<p class="phys-kicker">[^<]*</p>',s))==1),
 ('hdrbtn', lambda s: len(re.findall(r'<button\b[^>]*\bid="toggle-formal"[^>]*\btitle="Open the revision sheet[^"]*"[^>]*>',s))==1),
 ('toast', lambda s: len(re.findall(r"      toast\(msg((?:, ?[^;\n]*)?)\);\n    \}\);\n  \}\);",s))==1),
 ('dl-seesim', lambda s: len(re.findall(r"    Array\.prototype\.forEach\.call\(art\.querySelectorAll\('\.seesim'\),function\((\w+)\)\{\1\.remove\(\);\}\);",s))==1),
 ('dl-print', lambda s: s.count("Printing reveals the self-test answers. Equations and diagrams work fully offline.")==1),
 ('dl-hdr', lambda s: len(re.findall(r"(\+'<div class=\"hd\"><h1>The Physics<small>(?:[^<'\\]|\\')*?) ?(?:·|\\u00[Bb]7|,) revision sheet( ?(?:·|\\u00[Bb]7|,) saved )",s))==1),
 ('dl-toast', lambda s: len(re.findall(r"toast\('<b>Sheet saved\.(?:</b>|<\\/b>)[^']*'\);",s))==1),
 ('dl-bar', lambda s: s.count("    +'.bar{margin-top:26px;display:flex;gap:12px;align-items:center;}'\n")==1),
 ('gi-note', lambda s: len(re.findall(r"note\.innerHTML = '<b>You’re partway through the Guided Inquiry\.</b> This sheet talks through the answers, '\n\s*\+ '[^']*';",s))==1),
 ('gi-script', lambda s: s.count("<script>\n/* Physics sheet — Guided Inquiry pause")==1),
]
if __name__=='__main__':
    R=sys.argv[1] if len(sys.argv)>1 else os.getcwd()
    rows=[]
    for d in ['Condensed_matter_sims','PP_sims','QM_sims','SR_sims']:
        for f in sorted(glob.glob(f'{R}/{d}/*.html')):
            s=open(f).read()
            if 'PHYSICS SHEET v2' in s or 'class="phys-art"' not in s: continue
            bad=[n for n,c in checks if not c(s)]
            rows.append((d,os.path.basename(f),bad))
    ok=[r for r in rows if not r[2]]
    print('total',len(rows),'all-anchors-ok',len(ok))
    from collections import Counter
    print(Counter(b for r in rows for b in r[2]))
    for r in rows: print(r[0][:4],r[1][:55].ljust(55),','.join(r[2]) or 'OK')
