#!/usr/bin/env python3
"""jee-v2 prep for ONE (or all) JEE testprep sim(s):
   python3 prep_all.py <slug|--all> [--root ~/jee-physics-v2] [--write-roster] [--redo-starters]
For each roster entry with shell+formal true (the 104 standard-family sims):
  1. prep       raw.in.html  = the sim made installable.  Plain sims: jee-v2/prep.py (formal-strip listener -> __openPhysics).
                Sims that already carry a v1 sheet (the 4 Module-04 foundry/book sims): harvest v1/ then strip the layer (ai-courses/assemble_ai.strip_layer).
  2. install    kit/install.py -> pristine.html, raw.html, config.json, starter article.html / persim.html / edits.py  (title = the sim's own <title>)
  3. recon      recon.json (runtime: controls, cards, hooks, Play/Reset behaviour) + family.json  (headless, through kit/slot.sh)
  4. RECON.md   everything the author needs, incl. the old cgSteps / welcome script / staging hooks (as REFERENCE ONLY - never copy)
  5. starters   persim.html (scene hook seeded from the live controls), spec.js (DRAFT from the old cgSteps), edits.py
Everything is written under <root>/work/<slug>/ . Nothing in the repo is touched (the roster only with --write-roster).
Starter files are written once (work/<slug>/.starters); --redo-starters rewrites them (it will overwrite authored work - back up first)."""
import json, os, re, subprocess, sys, html, pathlib, shutil
HERE = pathlib.Path(__file__).resolve().parent; SK = HERE.parent; REPO = SK.parent.parent.parent
AIV2 = SK / 'ai-v2'; SRC = REPO / 'Fermi_testprep_jee_sims'
sys.path.insert(0, str(SK / 'ai-courses'))
from assemble_ai import MARK, INSTALLED, END  # noqa
args = sys.argv[1:]
ROOT = pathlib.Path(os.path.expanduser('~/jee-physics-v2'))
if '--root' in args: ROOT = pathlib.Path(args[args.index('--root') + 1])
pos = [a for a in args if not a.startswith('--') and a != str(ROOT)]
assert pos or '--all' in args, __doc__
ROSTER = json.load(open(HERE / 'roster.json'))
todo = [r for r in ROSTER if r['shell']] if '--all' in args else [r for r in ROSTER if r['slug'] == pos[0] and r['shell']]
assert todo, 'slug not in roster (or not a Shell sim): %s' % pos
env = dict(os.environ, PUPPETEER_CORE='/Users/admin/Downloads/sim-foundry-v2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',
           PSV2_SLOTS_DIR=os.environ.get('PSV2_SLOTS_DIR', '/tmp/psv2-slots-jee'), PSV2_SLOTS=os.environ.get('PSV2_SLOTS', '8'), CHROME=str(AIV2 / 'chrome-quiet.sh'))

# ---------- source scanning helpers (the old sim code is REFERENCE; nothing here is copied into the new sheet/spec) ----------
def balanced(s, i, open_ch, close_ch, cap=3000):
    """text from index i (at open_ch) to its matching close_ch; string/comment aware; truncated at cap chars"""
    d = 0; k = i; q = None
    while k < len(s) and k - i < 60000:
        c = s[k]
        if q:
            if c == '\\': k += 2; continue
            if c == q: q = None
        elif c in '\'"`': q = c
        elif s.startswith('//', k): k = s.find('\n', k); k = len(s) if k < 0 else k; continue
        elif s.startswith('/*', k): k = s.find('*/', k); k = len(s) if k < 0 else k + 1
        elif c == open_ch: d += 1
        elif c == close_ch:
            d -= 1
            if d == 0: return s[i:k + 1]
        k += 1
    return s[i:i + cap]
def grab_fn(s, name, cap=2600):
    m = re.search(r'(?:function\s+%s\s*\(|(?:const|let|var)\s+%s\s*=\s*(?:async\s*)?(?:function\s*)?\()' % (name, name), s) or re.search(r'(?:window\.)?%s\s*=\s*(?:async\s*)?(?:function\s*)?\(' % name, s)
    if not m: return None
    b = s.find('{', m.end())
    if b < 0: return None
    return s[m.start():b] + balanced(s, b, '{', '}')[:cap]
def old_cgsteps(s):
    m = re.search(r'const\s+cgSteps\s*=\s*\[', s)
    if not m: return []
    arr = balanced(s, m.end() - 1, '[', ']', 20000)
    r = subprocess.run(['node', '-e', 'console.log(JSON.stringify(eval("(" + process.argv[1] + ")")))', arr], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except Exception: return []
def old_welcome(s):
    for m in re.finditer(r'const\s+script\s*=\s*\[', s):
        if 'welcome' in s[max(0, m.start() - 600):m.start()]:
            arr = balanced(s, m.end() - 1, '[', ']', 6000)
            r = subprocess.run(['node', '-e', 'console.log(JSON.stringify(eval("(" + process.argv[1] + ")")))', arr], capture_output=True, text=True)
            try: return json.loads(r.stdout)
            except Exception: pass
    return []
def one_line(t): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html.unescape(t or ''))).strip()

def v1_span(text):
    """(start, end) of an already-installed v1 sheet layer, or None. The layer runs from its marker (or its 'THE PHYSICS LAYER' banner comment) to the last </body>."""
    i = text.find(INSTALLED)
    if i < 0:
        k = text.find('THE PHYSICS LAYER \u2014')
        if k < 0: return None
        i = text.rfind('<!--', 0, k)
    j = text.find(END, i); j = j + len(END) if j >= 0 else text.rindex('</body>')
    return i, j

GENERIC = {'#shell-play', '#shell-speed', '#shell-reset', '#shell-maximize', '#toggle-formal', '#shell-info', '#shell-theme', '#btn-gi', '#btn-cg', '#lbl-speed'}

def prep_one(R):
    slug = R['slug']; D = ROOT / 'work' / slug; D.mkdir(parents=True, exist_ok=True)
    src = SRC / R['module'] / (R['file'] + '.html'); text = src.read_text()
    (D / 'source.path').write_text(str(src))
    span = v1_span(text); has_v1 = span is not None
    mt = re.search(r'<title>(.*?)</title>', text, re.S)
    title = html.unescape(mt.group(1)).strip() if mt else slug
    # 1. prep -> raw.in.html
    if not (D / 'pristine.html').exists():
        if has_v1:
            i, j = span; L = text[i:j]
            V = D / 'v1'; V.mkdir(exist_ok=True)
            a = L.find('<article')
            if a >= 0:
                b = L.index('</article>', a) + len('</article>'); art = L[a:b]; (V / 'article.html').write_text(art)
                t = re.sub(r'<svg\b.*?</svg>', '[figure]', art, flags=re.S); t = re.sub(r'</(h3|p|li|div|tr)>', '\n', t); t = re.sub(r'<br\s*/?>', '\n', t)
                (V / 'article.txt').write_text(re.sub(r'\n\s*\n+', '\n\n', html.unescape(re.sub(r'<[^>]+>', '', t))))
            (D / 'v1.in.html').write_text(text[:i] + MARK + '\n' + text[j:])
            r = subprocess.run([sys.executable, str(HERE / 'prep.py'), str(D / 'v1.in.html'), str(D / 'raw.in.html')], capture_output=True, text=True)
            assert r.returncode == 0, 'prep.py (after v1 strip): ' + (r.stderr or r.stdout)[-600:]
            raw = (D / 'raw.in.html').read_text()
            assert 'phys-art' not in raw and 'phys-backdrop' not in raw, 'v1 residue after strip'
        else:
            r = subprocess.run([sys.executable, str(HERE / 'prep.py'), str(src), str(D / 'raw.in.html')], capture_output=True, text=True)
            assert r.returncode == 0, 'prep.py: ' + (r.stderr or r.stdout)[-600:]
        # 2. install
        spec = {'title': title.replace("'", '’'), 'slug': slug.lower(), 'sim': str(D / 'out.html')}
        (D / 'install.json').write_text(json.dumps(spec, ensure_ascii=False))
        r = subprocess.run([sys.executable, str(SK / 'kit' / 'install.py'), str(D / 'raw.in.html'), str(D), '--spec', str(D / 'install.json')], capture_output=True, text=True)
        assert r.returncode == 0, 'install.py: ' + (r.stderr or r.stdout)[-800:]
        cfg = json.load(open(D / 'config.json')); cfg['sim'] = str(D / 'out.html'); json.dump(cfg, open(D / 'config.json', 'w'), ensure_ascii=False, indent=2)
    # 3. recon (runtime)
    r = subprocess.run([str(SK / 'kit' / 'slot.sh'), 'node', str(HERE / 'recon.mjs'), str(D / 'raw.html'), str(D / 'recon.json')], capture_output=True, text=True, env=env)
    assert r.returncode == 0 and (D / 'recon.json').exists(), 'recon: ' + (r.stderr or r.stdout)[-600:]
    C = json.load(open(D / 'recon.json'))
    fam = classify(C, text); (D / 'family.json').write_text(json.dumps(fam, indent=1))
    # 4. static facts from the ORIGINAL source
    cg = old_cgsteps(text); wel = old_welcome(text)
    fn = {n: grab_fn(text, n) for n in ('onReset', 'onStep', 'applyInquiryScene', 'applyCompletedScene', 'restartWithCurrentParams')}
    inits = [m for m in re.finditer(r'Shell\.init\(\{.*?\}\s*\)', text, re.S) if 'onFrame' in m.group(0) or 'cfg' in m.group(0)]
    init = inits[-1] if inits else None
    md = recon_md(R, D, C, fam, cg, wel, fn, init.group(0)[:300] if init else '(no Shell.init found)', has_v1, title)
    (D / 'RECON.md').write_text(md)
    # 5. starters (once)
    authored = any((D / f).exists() and 'TODO-AUTHOR' not in (D / f).read_text() for f in ('persim.html', 'spec.js'))
    if authored and '--redo-starters' not in args: (D / '.starters').write_text('ok\n')   # never overwrite authored work
    if not (D / '.starters').exists() or '--redo-starters' in args:
        (D / 'persim.html').write_text(starter_persim(R, C, fam)); (D / 'spec.js').write_text(draft_spec(R, C, fam, cg, title))
        (D / 'edits.py').write_text('REPS = []\nSKIP_TOAST = False\n'); (D / '.starters').write_text('ok\n')
    return {'slug': slug, 'family': fam, 'cards': len(C['cards']), 'controls': len([c for c in C['controls'] if c['id']]), 'cg': len(cg), 'v1': has_v1, 'errs': C.get('errs')}

def classify(C, text):
    pl = (C['behaviour']['before'] or {}).get('play')
    if not pl or not pl.get('shown'): play = 'none'
    else:
        label = pl['text'] + ' ' + pl['aria']
        play = 'text' if len(re.findall(r'[A-Za-z]', label)) >= 3 else 'icon'
    live = [c for c in C['controls'] if c['id'] and c['vis'] and c['tag'] in ('input', 'select')]
    return {'play': play, 'static': play == 'none', 'three': bool(C['three']) and bool(re.search(r'THREE\.|three(\.min)?\.js', text)),
            'scene_fn': ('applyInquiryScene' in C['hooks']) or bool(re.search(r'function\s+applyInquiryScene', text)),
            'no_seesim_possible': play == 'none' and not live, 'live_controls': len(live)}

def recon_md(R, D, C, fam, cg, wel, fn, init, has_v1, title):
    b = C['behaviour']; M = []
    M += [f"# RECON — {R['slug']}  ({R['module']} / {R['file']})", f"title: {title}   h1: {C['h1']}", f"family: {json.dumps(fam)}",
          f"hooks present: {', '.join(C['hooks'])}   Shell: {C['hasShell']}   header: {' | '.join(C['header'])}", f"Shell.init: `{init}`"]
    if has_v1: M.append('**This sim ALREADY carried a v1 sheet** (harvested in v1/article.txt for reference only; layer stripped before install).')
    if C.get('errs'): M.append('page errors at load: ' + '; '.join(C['errs'])[:300])
    M += ['', '## Controls (live DOM, free mode) — scene() must drive these through `input`/`change` events, never onReset']
    for c in C['controls']:
        M.append('- ' + ' '.join(f'{k}={v}' for k, v in c.items() if v not in ('', None, False, []) and k not in ('cls', 'vis', 'tag')) + f"  <{c['tag']}>" + ('' if c['vis'] else '  [hidden at load]'))
    M += ['', '## Readout / panel ids', ', '.join(C['readouts']) or '(none found)']
    M += ['', f"## Canvases (1440x900, free mode)  hero={C['hero']}"] + [f"- #{c['id'] or '(no id)'}  x={c['x']} y={c['y']} w={c['w']} h={c['h']}" for c in C['canvases']]
    M += ['', '## Play / Reset', f"Play button type: **{fam['play']}**  (none = no run loop, static sim; icon = engine reads /pause/i, needs an aria-label fix; text = normal)",
          f"before: {json.dumps(b['before'])}", f"after clicking Play: {json.dumps(b['afterPlay'])}", f"after clicking Reset: {json.dumps(b['afterReset'])}",
          f"Reset restores slider defaults: {('yes' if b['afterReset'] and b['afterReset'].get('vals') == b['before'].get('vals') else 'check the diff above')}"]
    M += ['', '## How Guided-Inquiry scenes are staged (old code, REFERENCE ONLY)']
    for k, v in (C.get('hookSrc') or {}).items(): M += [f'### window.{k}', '```js', v, '```']
    for k, v in fn.items():
        if v: M += [f'### {k}', '```js', v, '```']
    if not fam['scene_fn']: M.append('\nNo applyInquiryScene: define `window.__physicsHooks.scene` in persim.html (starter is seeded from the controls above). Stage with slider values + `input` events.')
    M += ['', '## Guided Inquiry cards — the sheet must not give these answers away before data-gate-from']
    first_gate = None
    for c in C['cards']:
        M.append(f"### card {c['i']}{' [GATE]' if c['gate'] else ''}: {c['h']}")
        if c['gate'] and first_gate is None: first_gate = c['i']
        M += ['  ' + p for p in c['ps']]
        for ch in c['choices']: M.append('  - ' + ('[CORRECT] ' if ch['correct'] else '') + ch['text'][:200])
        for ch in c['choices']:
            if ch['correct']: M.append('  - correct feedback: ' + ch['fb'][:400])
    M.append(f'\nfirst gated card index: {first_gate} (sheet sections that state a card answer must sit at or after data-gate-from)')
    M += ['', '## Formal strip text (old; source of the physics, rewrite — do not paste)', C['formal'], '', '## Info text (old)', C['info']]
    M += ['', '## Old welcome script (REFERENCE ONLY — the new landing/narration is generated; do not reuse the wording)'] + ['- ' + one_line(w) for w in wel]
    M += ['', '## Old cgSteps (sel | title | text) — REFERENCE ONLY, rewrite everything'] + [f"- {s.get('sel')} | {s.get('title')} | {one_line(s.get('text'))}" for s in cg]
    return '\n'.join(M) + '\n'

def starter_persim(R, C, fam):
    ctl = []
    for c in C['controls']:
        if not c['id'] or c['tag'] not in ('input', 'select'): continue
        k = re.sub(r'(-slider|-input|-select|-sld|_slider|-range)$', '', c['id'])
        kind = 'check' if c['type'] == 'checkbox' else ('select' if c['tag'] == 'select' else 'range')
        ctl.append({'id': c['id'], 'key': k, 'kind': kind, 'def': c['value']})
    play_line = ("    if(typeof Shell!=='undefined'){ if(Shell.setPlayEnabled) Shell.setPlayEnabled(true); Shell.setPlaying(cfg.playing!==false); }\n"
                 if fam['play'] != 'none' else "    /* static sim (no Play button): nothing to start */\n")
    return f"""<style>
/* {R['slug']} · persim CSS. Light-theme fixes go here, scoped html[data-theme="light"] #phys-art … , body.light-theme #phys-art … */
#ps-watch .w-b>*{{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}}
@media (min-width:1200px){{:root{{--ps-watch-left:auto;--ps-watch-right:12px;--ps-watch-bottom:12px;}} #ps-watch{{width:min(318px,calc(100vw - 32px));}}}}
</style>
<script>
(function(){{
  'use strict';
  var $=function(id){{return document.getElementById(id);}};
  /* TODO-AUTHOR: STARTER seeded from the live controls (RECON.md). Edit, then delete every TODO-AUTHOR marker. */
  var CTL={json.dumps(ctl)};
  function setCtl(c,v){{
    var el=$(c.id); if(!el) return;
    if(c.kind==='check'){{ if(el.checked!==!!v) el.click(); return; }}
    el.value=String(v); el.dispatchEvent(new Event(c.kind==='select'?'change':'input',{{bubbles:true}}));
  }}
  /* the Shell restarts the run on slider input; never call the sim's onReset from here */
  function scene(cfg){{
    cfg=cfg||{{}};
    CTL.forEach(function(c){{ setCtl(c, cfg[c.key]!=null?cfg[c.key]:c.def); }});
    /* TODO-AUTHOR: sim-state that is NOT a control (stacked bars, trails, markers…): seed it here from cfg, then repaint */
{play_line}  }}
  window.__physicsHooks={{
    scene:scene,
    isPlaying:function(){{return typeof Shell!=='undefined'&&!!Shell.playing;}},
    setPlaying:function(on){{if(typeof Shell!=='undefined'&&Shell.setPlaying) Shell.setPlaying(!!on);}}
  }};
  window.__psRefresh=function(){{ /* TODO-AUTHOR: re-read the sim's controls into the #phys-live panel */ }};
  window.__psSnapshot=function(){{ return ''; /* TODO-AUTHOR: one sentence of current values for the download */ }};
  /* See-it staging: key = the data-show of a .seesim button in article.html. scene may be an object or a function returning one. */
  window.__psShow={{
    /* TODO-AUTHOR  setup:{{scene:{{}}, msg:'<b>…</b> what to watch'}}, */
  }};
}})();
</script>
"""

def draft_spec(R, C, fam, cg, title):
    steps = []
    for s in cg:
        sel = s.get('sel')
        if not sel or sel in GENERIC: continue
        steps.append(s)
    ctl_ids = [c['id'] for c in C['controls'] if c['id'] and c['vis'] and c['tag'] in ('input', 'select')]
    boxes = {'#' + c['box'] for c in C['controls'] if c.get('box')}
    def chap(sel): return 'Controls' if sel in boxes or re.search(r'slider|select|toggle|seg', sel or '') else 'The simulation'
    sim_steps = [s for s in steps if chap(s['sel']) == 'The simulation'][:3]
    ctl_steps = [s for s in steps if chap(s['sel']) == 'Controls']
    if len(sim_steps) + len(ctl_steps) > 6:
        keep = 6 - len(sim_steps); extra = ctl_steps[keep - 1:]; ctl_steps = ctl_steps[:keep - 1] + [dict(extra[0], also_sels=[e['sel'] for e in extra[1:]])]
    out = [f"/* {R['slug']} — guide v2 spec, DRAFT seeded from the old controls-guide structure (selectors + order only). {fam['play']=='none' and 'Static sim (no Play).' or 'Dynamic sim (Play).'}",
           "   AUTHOR: every TODO-AUTHOR must go. Write the titles/text/say fresh (do not reuse the old wording), and replace the REVIEW target selectors",
           "   by rects of what each step names (see AUTHOR-BRIEF: rect outlines). chain.py refuses a spec that still has TODO-AUTHOR. */",
           "(function(){", "  var $=function(id){return document.getElementById(id);};",
           "  function cv(sel){ var c=document.querySelector(sel||'canvas'); return c?c.getBoundingClientRect():null; }   /* REVIEW: the sim's drawing canvas */",
           "  window.__GV_SPEC={", f"    title:%s,   /* plain-language lint: no dash asides, so the sim title's dash is a colon */" % json.dumps(re.sub(r'\s*[\u2014\u2013]\s*', ': ', title), ensure_ascii=False), "    blurb:'TODO-AUTHOR one line: what it is, what you do, what you see',",
           "    reset:'#shell-reset',"]
    if fam['play'] != 'none': out.append("    play:'#shell-play',")
    out.append("    steps:[")
    rows = []
    for s in sim_steps + ctl_steps:
        sels = [s['sel']] + s.get('also_sels', [])
        tg = ','.join("{sel:%s%s}" % (json.dumps(x), ',sec:true' if k else '') for k, x in enumerate(sels))
        rows.append("      {chap:%s, title:'TODO-AUTHOR',   /* old title: %s */\n       targets:function(){ return [%s]; },   /* REVIEW target: %s */\n       text:'<p>TODO-AUTHOR</p>',\n       say:'TODO-AUTHOR'}"
                    % (json.dumps(chap(s['sel'])), (s.get('title') or '').replace('*/', '').replace("'", ''), tg, 'rect of what the step names' if chap(s['sel']) == 'The simulation' else 'the control box (+ a secondary rect on what it changes)'))
    cvs = [c for c in C['canvases'] if c['id']]
    n_sim = len(sim_steps)
    for k in range(max(0, 2 - n_sim)):
        sel = ('#' + cvs[0]['id']) if cvs else '.shell-hero'
        rows.insert(n_sim + k, "      {chap:'The simulation', title:'TODO-AUTHOR',   /* STUB: the old guide had no second sim step; name what the canvas shows */\n       targets:function(){ return [{sel:%s}]; },   /* REVIEW target: a rect of the part this step names */\n       text:'<p>TODO-AUTHOR</p>',\n       say:'TODO-AUTHOR'}" % json.dumps(sel))
    while len(rows) < 4:
        rows.append("      {chap:'Controls', title:'TODO-AUTHOR',\n       targets:function(){ return []; },   /* REVIEW target */\n       text:'<p>TODO-AUTHOR</p>',\n       say:'TODO-AUTHOR'}")
    out.append(',\n'.join(rows)); out.append('    ],')
    if fam['play'] != 'none':
        out += ["    playText:'<p>TODO-AUTHOR press <b>Play</b> …</p>',", "    playSay:'TODO-AUTHOR',", "    trigger:{ text:'<p>TODO-AUTHOR</p>', say:'TODO-AUTHOR' }"]
    else:
        at = ('#box-' + ctl_ids[0]) if ctl_ids else '#shell-reset'
        out += ["    playText:'<p>TODO-AUTHOR try it: …</p>',", "    playSay:'TODO-AUTHOR',", "    trigger:{ at:%s, text:'<p>TODO-AUTHOR</p>', say:'TODO-AUTHOR' }   /* REVIEW: the control the student should use */" % json.dumps(at)]
    out += ['  };', '})();', '']
    return '\n'.join(out)

res = []
for R in todo:
    try: res.append(prep_one(R)); print('prepped', R['slug'], json.dumps(res[-1]['family']), 'cards', res[-1]['cards'], 'controls', res[-1]['controls'], 'cgSteps', res[-1]['cg'], 'v1' if res[-1]['v1'] else '')
    except Exception as e:
        print('FAILED', R['slug'], str(e)[:500]); res.append({'slug': R['slug'], 'error': str(e)[:500]})
if '--write-roster' in args:
    fam = {r['slug']: r['family'] for r in res if 'family' in r}
    for r in ROSTER:
        if r['slug'] in fam: r['family'] = fam[r['slug']]
    json.dump(ROSTER, open(HERE / 'roster.json', 'w'), indent=1, ensure_ascii=False)
    print('roster updated for', len(fam))

sys.exit(1 if any('error' in r for r in res) else 0)
