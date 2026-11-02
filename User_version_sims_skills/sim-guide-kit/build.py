"""Install the guide v2 (blackboard landing + Simulation guide + Explore-freely trigger hint) on ONE user-version sim.

usage:  python3 build.py <workdir> [--out FILE] [--no-voice]
<workdir> holds the per-sim inputs (see SPEC_FORMAT.md):
  config.json  {"sim": "<path under Fermi_university_sim_lab_sims/, or an absolute path>", "slug": "..."}
  spec.js      window.__GV_SPEC = {...}            (required)
  hooks.py     def patch(html): return html         (optional: read-only geometry hooks the spec needs)

What it does, in order, asserting every anchor (nothing is written unless every step succeeds):
  1. snapshot  : the first run copies the repo sim to <workdir>/pristine.html; every later run rebuilds from it
  2. rename    : header "Ask Euler" / "Ask AI Tutor" -> "Teach me" (owner, 2026-10-09) and "Controls Guide" -> "Simulation guide" (label + tooltip)
  3. hooks     : hooks.patch(html)
  4. layer     : layer.html + fonts + spec inserted before </body>
  5. voice     : ElevenLabs clips for every new spoken line, appended to the sim's narration manifest
  6. checks    : node --check on the guide scripts, plain-language lint on every card/hint line
  7. write     : the repo file (or --out), refusing if the repo file changed since pristine.html (another session)
Side files: work/<slug>/built.html is ALWAYS written (also with --out); pristine.html is written on the first build,
only after the spec passes the lint. Spec lines are read by evaluating spec.js in node (stub window/document), so quote
style and key order don't matter; every `say` must be a plain string.
"""
import sys, re, json, base64, pathlib, hashlib, urllib.request, urllib.error, time, os, subprocess, tempfile, importlib.util, shutil

K = pathlib.Path(__file__).resolve().parent
ROOT = pathlib.Path('/Users/admin/Desktop/simulations-1/Fermi_university_sim_lab_sims')
VOICE, MODEL, FMT = 'JBFqnCBsd6RMkjVDRZzb', 'eleven_flash_v2_5', 'mp3_44100_32'
CACHE = pathlib.Path(os.path.expanduser('~/sim-narration/audio-cache'))
norm = lambda s: re.sub(r'\s+', ' ', s).strip()
sha = lambda t: hashlib.sha256(t.encode()).hexdigest()


def tts(text):
    h = hashlib.sha256(f'{MODEL}\0{VOICE}\0{FMT}\0{text}'.encode()).hexdigest()[:16]
    out = CACHE / f'{h}.mp3'
    if out.exists() and out.stat().st_size > 500:
        return out.read_bytes()
    key = open(os.path.expanduser('~/.config/elevenlabs/api_key')).read().strip()
    body = json.dumps({'text': text, 'model_id': MODEL}).encode()
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format={FMT}'
    for a in range(6):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'}), timeout=120)
            d = r.read(); CACHE.mkdir(parents=True, exist_ok=True); out.write_bytes(d); return d
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and a < 5:
                time.sleep(2 ** a); continue
            raise


PARSE_JS = r'''
const fs = require('fs'); const src = fs.readFileSync(process.argv[1], 'utf8');
const nul = () => null;
const el = new Proxy({}, { get: (t, k) => (k === 'getBoundingClientRect' ? () => ({left:0,top:0,width:0,height:0,right:0,bottom:0}) : (typeof k === 'string' && /^(querySelector|getElementById|closest)$/.test(k) ? nul : (k === 'querySelectorAll' || k === 'getElementsByClassName' ? () => [] : undefined))) });
global.window = global; global.document = { getElementById: nul, querySelector: nul, querySelectorAll: () => [], body: el, documentElement: el, addEventListener(){}, createElement: () => el };
global.addEventListener = () => {}; global.innerWidth = 1440; global.innerHeight = 900; global.getComputedStyle = () => ({});
try { (0, eval)(src); } catch (e) { console.log(JSON.stringify({ error: String(e.message) })); process.exit(0); }
const S = global.__GV_SPEC; if (!S) { console.log(JSON.stringify({ error: 'spec.js did not set window.__GV_SPEC' })); process.exit(0); }
const val = v => typeof v === 'function' ? { fn: true } : v;
console.log(JSON.stringify({ title: S.title, blurb: S.blurb, play: S.play || null, reset: S.reset || null, playText: S.playText, playSay: val(S.playSay),
  trigger: S.trigger ? { at: S.trigger.at || null, text: val(S.trigger.text), say: val(S.trigger.say) } : null,
  steps: (S.steps || []).map(st => ({ title: val(st.title), text: val(st.text), say: val(st.say), final: !!st.final })) }));
'''


def parse_spec(path):
    r = subprocess.run(['node', '-e', PARSE_JS, str(path)], capture_output=True, text=True)
    assert r.returncode == 0 and r.stdout.strip(), ('could not evaluate spec.js', r.stderr[:400])
    S = json.loads(r.stdout.strip().splitlines()[-1])
    assert 'error' not in S, ('spec.js', S.get('error'))
    for k, st in enumerate(S['steps']):
        assert isinstance(st.get('say'), str) and st['say'].strip(), f'step {k + 1}: say must be a plain, non-empty string (it is pre-voiced at build time)'
    for k in ('playSay',):
        assert S.get(k) is None or isinstance(S[k], str), f'{k} must be a plain string'
    if S.get('trigger'):
        assert isinstance(S['trigger'].get('say'), str), 'trigger.say must be a plain string'
    return S


def spec_lines(S):
    """Every line the engine speaks, plus the combined last-step + Play line it speaks as one."""
    L = [norm(st['say']) for st in S['steps']]
    if S.get('playSay'): L.append(norm(S['playSay']))
    if S.get('trigger') and S['trigger'].get('say'): L.append(norm(S['trigger']['say']))
    if S['steps'] and S.get('playSay'): L.append(norm(S['steps'][-1]['say'] + ' ' + S['playSay']))
    return L


def says(js):
    return [norm(m.group(2)) for m in re.finditer(r"\b(say|finalSay|playSay)\s*:\s*'((?:[^'\\]|\\.)*)'", js)]


def add_clips(html, texts, prefix):
    i = html.find('const manifest=')
    if i < 0:
        print('  WARN no narration manifest in this sim: lines will use the browser voice'); return html, 0
    j = i + len('const manifest=')
    man, end = json.JSONDecoder().raw_decode(html, j)
    have = [norm(c['text']) for c in man['clips']]
    n = 0
    for k, t in enumerate(texts):
        if not t or any(h == t or h.endswith(t) for h in have):
            continue
        man['clips'].append({'id': f'{prefix}-{k:02d}', 'text': t, 'audio': 'data:audio/mpeg;base64,' + base64.b64encode(tts(t)).decode()})
        have.append(t); n += 1
    pub = json.dumps(man, separators=(',', ':'), ensure_ascii=True).replace('<', '\\u003c')
    return html[:j] + pub + html[end:], n


def rename_tutor(html):
    html, n1 = re.subn(r'(<span class="ask-euler-label">)(?:Ask Euler|Ask AI Tutor)(</span>)', r'\1Teach me\2', html)
    html, n2 = re.subn(r'title="Ask (?:Euler|the AI Tutor) about this simulation[^"]*"', 'title="Learn this with the AI tutor (opens in a new tab)"', html)
    assert n1 <= 1 and n2 <= 1, ('Ask Euler label/tooltip not unique', n1, n2)
    if n1 == 0 and '>Teach me<' not in html:
        print('  WARN no Ask Euler / Ask AI Tutor button found')
    return html


def rename_cg(html):
    """Header button: older shells say "Controls Guide"; guide v2 calls it "Simulation guide" (label + tooltip)."""
    html, n1 = re.subn(r'(<button id="btn-cg"[^>]*>\s*🎛\s*)Controls Guide(\s*</button>)', r'\1Simulation guide\2', html)
    html, n2 = re.subn(r'(<button id="btn-cg"[^>]*\btitle=")Show or hide the controls guide(")', r'\1Show or hide the simulation guide\2', html)
    assert n1 <= 1 and n2 <= 1, ('Controls Guide label/tooltip not unique', n1, n2)
    return html


def preflight(html, S):
    """What the engine needs from the sim. Warnings only: they explain later gate failures."""
    need = {'#btn-gi': 'id="btn-gi"', '#btn-cg': 'id="btn-cg"', 'window.__setMode': '__setMode'}
    for k, v in need.items():
        if v not in html: print(f'  WARN preflight: {k} not found (the engine hands over to it)')
    if not re.search(r'class="shell-header|<header\b|class="top-bar', html): print('  WARN preflight: no header (.shell-header / header / .top-bar)')
    if S.get('play'):
        pid = S['play'].lstrip('#')
        m = re.search(r'<button[^>]*\bid="%s"[^>]*>(.*?)</button>' % re.escape(pid), html, re.S)
        if not m: print(f"  WARN preflight: Play button {S['play']} not found in the HTML")
        elif not re.search(r'play|pause', re.sub(r'<[^>]+>', ' ', m.group(0)), re.I):
            print(f"  WARN preflight: {S['play']} has no Play/Pause text or aria-label; the engine reads 'pause' in it to know the sim is running")
    elif not (S.get('trigger') or {}).get('at'):
        print('  WARN preflight: no SPEC.play and no trigger.at: a static sim must name its trigger control')


def node_check(html):
    for m in re.finditer(r'<script id="(gv-spec|gv-engine)">(.*?)</script>', html, re.S):
        f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False); f.write(m.group(2)); f.close()
        r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True); os.unlink(f.name)
        assert r.returncode == 0, (m.group(1), r.stderr[:500])


def lint(S):
    sys.path.insert(0, str(K))
    from lint_plain import issues
    texts = []
    raw = [S.get('blurb'), S.get('playText')] + [st.get('text') for st in S['steps']] + [(S.get('trigger') or {}).get('text')]
    for h in raw:
        if not isinstance(h, str): continue
        for para in re.split(r'</p>|<br\s*/?>', h):   # each paragraph is checked on its own
            t = norm(re.sub(r'<[^>]+>', ' ', para))
            if t: texts.append((t, False))
    texts += [(norm(st['say']), False) for st in S['steps']]
    texts += [(norm(x), False) for x in [S.get('playSay'), (S.get('trigger') or {}).get('say'), S.get('title')] if isinstance(x, str)]
    for k, st in enumerate(S['steps']):
        if isinstance(st.get('title'), str): texts.append((st['title'], False))
    bad = [(t[:60], d) for t, q in texts for kind, d in issues(t, q) if kind.startswith('FAIL')]
    assert not bad, ('plain-language lint', bad[:6])


def build(work, out=None, voice=True):
    work = pathlib.Path(work).resolve()
    cfg = json.load(open(work / 'config.json'))
    sim = pathlib.Path(cfg['sim']) if os.path.isabs(cfg['sim']) else ROOT / cfg['sim']   # absolute: a sim outside the uni lab (AI courses, JEE)
    pristine = work / 'pristine.html'
    spec = (work / 'spec.js').read_text()
    assert 'window.__GV_SPEC' in spec, 'spec.js must set window.__GV_SPEC'
    S = parse_spec(work / 'spec.js')
    lint(S)                                        # lint first: a failing spec never snapshots
    if not pristine.exists():
        try:
            d = subprocess.run(['git', '-C', str(ROOT), 'diff', '--quiet', '--', str(sim)], capture_output=True)
            if d.returncode == 1: print('  WARN the repo sim has uncommitted changes vs git HEAD; pristine.html snapshots the WORKING copy')
        except Exception: pass
        shutil.copy(sim, pristine)
    src = pristine.read_text(encoding='utf-8')
    assert 'gv-engine' not in src, 'pristine.html already carries the guide v2 layer: re-snapshot from a clean sim'
    preflight(src, S)
    html = rename_cg(rename_tutor(src))
    hp = work / 'hooks.py'
    if hp.exists():
        m = importlib.util.spec_from_file_location('hooks', hp); mod = importlib.util.module_from_spec(m); m.loader.exec_module(mod)
        html = mod.patch(html)
    layer = (K / 'layer.html').read_text()
    block = layer.replace('__FONTS__', (K / 'fonts' / 'chalkfonts.css').read_text()).replace('__SPEC__', spec)
    k = html.rfind('</body>'); assert k > 0 and html.count('</body>') == 1
    html = html[:k] + block + '\n' + html[k:]
    nc = 0
    if voice:
        html, nc = add_clips(html, says(layer) + spec_lines(S), 'gv')
    node_check(html)
    target = pathlib.Path(out) if out else sim
    lb = work / '.lastbuild'
    if not out and target.exists():
        cur = sha(target.read_text(encoding='utf-8'))
        ok = {sha(src)} | ({lb.read_text().strip()} if lb.exists() else set())
        assert cur in ok, f'{target} changed since pristine.html was taken (another session?) - refusing to overwrite'
    target.write_text(html, encoding='utf-8')
    if not out:
        lb.write_text(sha(html))
    (work / 'built.html').write_text(html, encoding='utf-8')
    print(f"ok {cfg.get('slug', work.name)}: clips+{nc} -> {target} ({len(html) / 1e6:.2f} MB)")


if __name__ == '__main__':
    a = sys.argv[1:]
    out = a[a.index('--out') + 1] if '--out' in a else None
    build(a[0], out, voice='--no-voice' not in a)
