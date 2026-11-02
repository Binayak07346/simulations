#!/usr/bin/env python3
"""Wave 2: frame components as token-driven stylesheet rules that reproduce today's look exactly.

    python3 tools/gen_sim_tokens.py --map OUT_MAP.json                 # write the component map for the probe
    python3 tools/gen_sim_tokens.py --gen PROBE.json                   # write the three CSS outputs below

Outputs (all generated; edit the MAP here, never the files):
  _tokens/frame.css             fleet default per token (the most common value among participating sims)
  _styles/frame.css             one rule per (component, property): `prop: var(--fsim-<comp>-<prop>) !important`
                                (layer fermi.override), scoped to stamped sims in the NON-tight header state, minus
                                the sims excluded from that pair
  _generated/sim-overrides.css  html[data-fsim-id="<id>"]{--tok:value} where a sim's value differs from the default

WHY THIS IS A NO-OP for every sim it touches (the proof the self-test checks):
  * two width bands, each with its own tokens (-ph suffix for phone) and its own @media-wrapped rules:
    desk = min-width 641px (probes 1440x900, 1280x763, 1100x700, 900x700, 1440x900 with Guided Inquiry open) and
    phone = max-width 640px (probes 560x800, 390x844); 640 is the sims' own most common small-screen breakpoint;
  * within a band, a sim takes part in a (component, prop) rule only if, in EVERY captured non-tight state of
    that band (header not fu-tight/fu-tighter), EVERY element its selector matches (hidden ones too) has the SAME
    computed value v; its token resolves to exactly v, so the !important rule re-asserts v;
  * otherwise (values differ by element, by width, or no non-tight capture) the sim is EXCLUDED from that rule
    and keeps its own CSS untouched;
  * in the tight states the rules do not apply at all (scoped :not(.fu-tight):not(.fu-tighter)), so the header
    fit script's own !important spacing keeps working;
  * every selector is inside :where(), so these rules add no specificity and cannot out-rank anything else in the
    override layer; they only set geometry/type properties no other override rule sets on these elements.
Residual risk (not provable from captures): a state none of the captures reaches (hover/active, a JS-added class),
or a sim media query that changes one of these properties between the probed widths (probes at 1440/1280/1100/
900/560/390 straddle the common breakpoints 1200/1000/760/620/480/420; 641-899 and <390 are not probed).
"""
import collections, json, pathlib, re, sys

KIT = pathlib.Path(__file__).resolve().parent.parent
PAD = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']
RAD = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']
QH = 'html[data-fsim-layout="qm-legacy"] :is(.title-bar,.app-header,.header-bar,header.upper-menu,header.sim-header,div.header,body > header)'
QS = 'html[data-fsim-layout="qm-legacy"] :is(aside#rightPanel,.ho-sidebar)'
HDR = f':is(.shell-header,.top-bar,{QH})'
PLAY = '#shell-play,#playpause-btn,#btnPlayPause,#btnPlay,#playBtn,#playPauseBtn,#plB'
NOTPLAY = ''.join(f':not({p})' for p in PLAY.split(','))
MAP = collections.OrderedDict([
    ('topbar',         {'sel': HDR, 'props': PAD + ['column-gap', 'row-gap']}),
    ('topbar-title',   {'sel': '.shell-title,.top-bar-title,.sim-title,.simulation-title,#simTitle,#simTitleText', 'props': ['font-size', 'font-weight', 'letter-spacing', 'line-height', 'font-family']}),
    ('topbar-button',  {'sel': f'{HDR} :is(button,.shell-btn):not(#ask-euler){NOTPLAY}', 'props': PAD + ['font-size', 'font-weight', 'letter-spacing'] + RAD}),
    ('button-play',    {'sel': PLAY, 'props': PAD + ['font-size', 'font-weight', 'letter-spacing'] + RAD}),
    ('button-tutor',   {'sel': '#ask-euler', 'props': PAD + ['font-size', 'font-weight']}),
    ('topbar-select',  {'sel': f'{HDR} select', 'props': PAD + ['font-size'] + RAD}),
    ('sidebar',        {'sel': f'.shell-aside,#sb-sidebar,{QS}', 'props': PAD + ['row-gap', 'column-gap']}),
    ('sidebar-head',   {'sel': '.aside-zone-head,.shell-panel-head', 'props': PAD + ['font-size', 'font-weight', 'letter-spacing', 'text-transform']}),
    ('control-box',    {'sel': '.ctrl-box', 'props': PAD + RAD + ['row-gap']}),
    ('control-label',  {'sel': '.ctrl-box-label', 'props': ['font-size', 'font-weight', 'letter-spacing', 'font-family']}),
    ('control-value',  {'sel': '.slider-val', 'props': ['font-size', 'font-weight', 'font-family']}),
    ('readout-row',    {'sel': '.stat-row', 'props': PAD + ['font-size']}),
    ('readout-label',  {'sel': '.stat-label', 'props': ['font-size', 'font-weight', 'font-family']}),
    ('readout-value',  {'sel': '.stat-value,.stat-val', 'props': ['font-size', 'font-weight', 'font-family']}),
    ('stage',          {'sel': '.plot-box', 'props': PAD + RAD}),
    ('legend-item',    {'sel': '.legend-item', 'props': PAD + ['font-size', 'column-gap']}),
])
SHORT = {'padding-top': 'pad-t', 'padding-right': 'pad-r', 'padding-bottom': 'pad-b', 'padding-left': 'pad-l', 'border-top-left-radius': 'r-tl',
         'border-top-right-radius': 'r-tr', 'border-bottom-right-radius': 'r-br', 'border-bottom-left-radius': 'r-bl', 'column-gap': 'col-gap',
         'row-gap': 'row-gap', 'font-size': 'fs', 'font-weight': 'fw', 'letter-spacing': 'ls', 'line-height': 'lh', 'font-family': 'ff', 'text-transform': 'tt'}
# Sims taken out of EVERY frame rule because the in-page swap check (harness/swapcheck.mjs) found a difference
# the probe could not predict (a breakpoint between probed widths, a header-fit state flip, a layout script
# reading the header height). Written from the swap results; a sim leaves this list only after a clean swap check.
_EX = KIT / '_generated' / 'frame-exclude.json'
SIM_EXCLUDE = json.loads(_EX.read_text()) if _EX.exists() else {}
tok = lambda c, p: f'--fsim-{c}-{SHORT[p]}'

def sim_id_of(path):
    m = re.search(r'<html\b[^>]*\bdata-fsim-id="([^"]+)"', pathlib.Path(path).read_text(errors='replace')[:4000])
    return m.group(1) if m else None

def gen(probe_path, BAND='desk'):
    probe = json.loads(pathlib.Path(probe_path).read_text())
    vals = {}                       # (comp, prop) -> {sim: value}
    excluded = collections.defaultdict(set)
    seen = set()
    for f, vps in probe.items():
        sid = sim_id_of(f)
        if not sid: print('  no data-fsim-id:', f); continue
        seen.add(sid)
        if sid in SIM_EXCLUDE:      # verified by the swap check to differ: keeps its own CSS for every frame rule
            for comp, d in MAP.items():
                for prop in d['props']: excluded[(comp, prop)].add(sid)
            continue
        for comp, d in MAP.items():
            for prop in d['props']:
                vs, present = set(), False
                for vp, snap in vps.items():
                    if (int(vp.split('x')[0]) <= 640) != (BAND == 'phone'): continue
                    if 'error' in snap: vs.add('ERROR'); continue
                    if re.search(r'\bfu-tight', snap.get('_html', '')): continue          # rules do not apply in tight states
                    els = snap.get(comp) or []
                    present = present or bool(els)
                    for e in els: vs.add(e[prop])
                    if not els: vs.add('__absent__')
                # absent everywhere -> nothing matches -> rule is a no-op; present but non-uniform -> exclude
                real = vs - {'__absent__'}
                if not present: continue
                if len(real) == 1 and 'ERROR' not in real and '__absent__' not in vs:
                    vals.setdefault((comp, prop), {})[sid] = next(iter(real))
                elif len(real) == 1 and '__absent__' in vs and 'ERROR' not in real:
                    vals.setdefault((comp, prop), {})[sid] = next(iter(real))   # appears at some widths only, same value
                else:
                    excluded[(comp, prop)].add(sid)
    tokens, rules, overrides = [], [], collections.defaultdict(list)
    for comp, d in MAP.items():
        for prop in d['props']:
            sims = vals.get((comp, prop), {})
            if not sims: continue
            default = collections.Counter(sims.values()).most_common(1)[0][0]
            t = tok(comp, prop) + ('-ph' if BAND == 'phone' else ''); tokens.append(f'  {t}: {default};')
            for sid, v in sorted(sims.items()):
                if v != default: overrides[sid].append(f'{t}:{v}')
            ex = tuple(sorted(excluded.get((comp, prop), set())))
            rules.append((ex, f':where({d["sel"]}){{{prop}:var({t}) !important;}}'))
    return tokens, rules, overrides, excluded, seen

def write(probe_path):
    T, R, O, E, seen = gen(probe_path, 'desk'); Tp, Rp, Op, Ep, _ = gen(probe_path, 'phone')
    BREAK = 640   # phone band: the sims' own most common small-screen breakpoint (max-width 640, 340 rules); probe 390 sits in it
    tokens = T + Tp; overrides = {k: O.get(k, []) + Op.get(k, []) for k in set(O) | set(Op)}
    # Rules sharing one exclusion list are NESTED under one scope (CSS nesting), so each list is written once.
    # A browser without nesting drops the nested rules: the sim then keeps its own CSS (the rules only re-assert it).
    def band(rs):
        groups = collections.OrderedDict()
        for ex, r in rs: groups.setdefault(ex, []).append(r)
        out = []
        for ex, rr in groups.items():
            scope = 'html[data-fsim-id]:not(.fu-tight):not(.fu-tighter)' + (':not(' + ','.join(f'[data-fsim-id="{s}"]' for s in ex) + ')' if ex else '')
            out += [f'  :where({scope}) {{'] + [f'    & {r}' for r in rr] + ['  }']
        return out
    rules = [f'@media (min-width: {BREAK + 1}px) {{'] + band(R) + ['}', f'@media (max-width: {BREAK}px) {{'] + band(Rp) + ['}']
    excluded = E; [excluded.setdefault(k, set()).update(v) for k, v in Ep.items()]
    hdr = '/* GENERATED by tools/gen_sim_tokens.py from the live fleet probe. Do not edit; edit MAP there. */\n'
    (KIT / '_tokens').mkdir(exist_ok=True); (KIT / '_styles').mkdir(exist_ok=True); (KIT / '_generated').mkdir(exist_ok=True)
    (KIT / '_tokens/frame.css').write_text(hdr + '/* Fleet defaults for the frame components (the most common value today). */\n:root {\n' + '\n'.join(tokens) + '\n}\n')
    (KIT / '_styles/frame.css').write_text(hdr + '/* Frame components, token-driven. Layer: fermi.override (!important). Zero specificity (:where).\n   Applies to stamped sims outside the header-fit tight states; a sim is excluded from a rule when its\n   own value for that property is not uniform across its elements and captured widths. */\n' + '\n'.join(rules) + '\n')
    (KIT / '_generated/sim-overrides.css').write_text(hdr + '/* Per-sim values that differ from the fleet default: today\'s look, exactly. Normalising a sim =\n   deleting its line(s) here. */\n' + '\n'.join(f'html[data-fsim-id="{s}"]{{{";".join(v)}}}' for s, v in sorted(overrides.items()) if v) + '\n')
    # The sims whose frame values were measured: only these may carry data-fsim-id (tools/apply.py --sim-id checks it).
    # Any other stamped sim would get the fleet DEFAULTS, which fit only the shells they were measured on.
    (KIT / '_generated/calibrated-ids.json').write_text(json.dumps(sorted(seen), indent=0) + '\n')
    n_rules = len(R) + len(Rp); n_ex = sum(len(v) for v in excluded.values())
    full = [s for s in seen if s not in overrides]
    print(f'sims {len(seen)} · tokens {len(tokens)} · rules {n_rules} · per-sim overrides {sum(len(v) for v in overrides.values())} '
          f'across {len(overrides)} sims · sims fully on defaults {len(full)} · (sim,pair) exclusions {n_ex}')
    worst = collections.Counter({k: len(v) for k, v in excluded.items()}).most_common(8)
    print('  most-excluded pairs:', ', '.join(f'{c}/{SHORT[p]}={n}' for (c, p), n in worst))

if __name__ == '__main__':
    if '--map' in sys.argv:
        out = sys.argv[sys.argv.index('--map') + 1]
        pathlib.Path(out).write_text(json.dumps({k: {'sel': f':where({v["sel"]})', 'props': v['props']} for k, v in MAP.items()}))
        print('map ->', out)
    elif '--gen' in sys.argv:
        write(sys.argv[sys.argv.index('--gen') + 1])
