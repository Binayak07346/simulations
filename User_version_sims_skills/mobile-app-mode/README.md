# mobile-app-mode: make sims phone- and tablet-ready (desktop unchanged)

Start with **SKILL.md**. It holds the whole workflow; `references/` has the details.

**Quick start:**

```bash
cd mobile-app-mode && npm i puppeteer-core   # once, INSIDE this folder (or set PUPPETEER_CORE=/path/to/puppeteer-core/lib/puppeteer/puppeteer-core.js)
export CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   # or your Chrome path
node   scripts/probe.mjs        my-sim.html --shots /tmp/p                # 1. diagnose (file untouched)
python3 scripts/app_mode.py     my-sim.html out.html [--roles roles.json] # 2. convert (byte-proven)
node   scripts/app_mode_check.mjs my-sim.html out.html --shots /tmp/g     # 3. gate: must print PASS
python3 -m http.server 8765 --bind 127.0.0.1                              # 4. look: preview/index.html?sim=/path/out.html
```

- **Sims in the Fermi layout:** detected automatically.
- **A different structure:** map it with a small `roles.json`. See `references/adapt-a-new-design.md` and the three
  worked `examples/`.

**Using it as a Claude Code skill:** copy this folder to `.claude/skills/mobile-app-mode/` in your repo (or to
`~/.claude/skills/`). Then ask Claude to "make this sim mobile and tablet ready".
