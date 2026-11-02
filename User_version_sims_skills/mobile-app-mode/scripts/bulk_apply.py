#!/usr/bin/env python3
"""Add (or upgrade) the mobile app-mode layer on many sims at once, with a byte proof per file.

    python3 bulk_apply.py <dir | list.txt | file.html ...> (--out <dir> | --in-place) [--roles roles.json] [--manifest m.json]

- A directory is walked for *.html (hidden files and node_modules skipped); a .txt is one path per line.
- --out writes converted copies under <dir> keeping relative paths; --in-place rewrites the files themselves
  (in a git repo that is the safe way to sync repo copies: never copy deployed files over the repo).
- --roles applies ONE role map to every file (only for a batch that shares one structure).
- Each output is proven to be its input plus only the app-mode block(s); the manifest records md5 before/after,
  the previous version and the role map, so a later deploy can be checked against it.
Exit code 1 if any file failed."""
import hashlib, json, os, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import app_mode

a = sys.argv[1:]
def take(flag, has_val=True):
    if flag not in a: return None
    i = a.index(flag); v = a[i + 1] if has_val else True; del a[i:i + (2 if has_val else 1)]; return v
out_dir = take('--out'); in_place = take('--in-place', False); roles_arg = take('--roles'); man = take('--manifest')
if not a or bool(out_dir) == bool(in_place): sys.exit(__doc__)
roles = json.loads(pathlib.Path(roles_arg).read_text()) if roles_arg else None

files, base = [], None
for x in a:
    p = pathlib.Path(x)
    if p.is_dir():
        base = base or p
        for r, ds, fs in os.walk(p):
            ds[:] = [d for d in ds if not d.startswith('.') and d != 'node_modules']
            files += [pathlib.Path(r, f) for f in fs if f.endswith('.html') and not f.startswith('.')]
    elif p.suffix == '.txt': files += [pathlib.Path(l.strip()) for l in p.read_text().splitlines() if l.strip()]
    else: files.append(p)

md5 = lambda b: hashlib.md5(b).hexdigest(); rows = []; bad = 0
for f in files:
    try:
        t = f.read_text(encoding='utf-8'); before = app_mode.version_of(t)
        out = app_mode.apply(t, roles)
        assert app_mode.strip(out) == app_mode.strip(t), 'byte proof failed'
        dst = f if in_place else pathlib.Path(out_dir) / (f.relative_to(base) if base and f.is_relative_to(base) else f.name)
        dst.parent.mkdir(parents=True, exist_ok=True); dst.write_text(out, encoding='utf-8')
        rows.append({'src': str(f), 'dst': str(dst), 'md5_before': md5(t.encode()), 'md5_after': md5(out.encode()),
                     'previous': before, 'version': app_mode.VERSION, 'roles': app_mode.roles_of(out)})
    except Exception as e:
        bad += 1; rows.append({'src': str(f), 'error': str(e)[:200]}); print('FAILED', f, e)
if man: json.dump(rows, open(man, 'w'), indent=1)
print(f'converted {len(rows) - bad} / {len(rows)} (layer {app_mode.VERSION}); previous: ' +
      json.dumps({str(k): sum(1 for r in rows if r.get('previous') == k) for k in {r.get('previous') for r in rows if 'error' not in r}}))
sys.exit(1 if bad else 0)
