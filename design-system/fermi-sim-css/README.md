# fermi-sim.css: the simulation design system

One versioned stylesheet for every Fermi simulation. It holds three things:
- **Tokens:** CSS custom properties. They use the **main app's names and values** (`study-tools-v2/frontend/src/design-system/_tokens`).
- **Class names:** the canonical `.fsim-*` appearance classes.
- **A temporary override layer:** it puts the locked Horizon "A" look on today's sims without editing their markup.

Current version: **1.0.0**. Built file: `dist/fermi-sim.1.0.0.css`, about 50 KB, with SRI hash in `dist/fermi-sim.1.0.0.sri`.

## Load it in a sim
`tools/apply.py` writes this block before the sim's `</head>`. A sim never carries a hand-written copy.

```html
<!-- FERMI-SIM CSS v1.0.0 BEGIN · … -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<script id="fermi-sim-loader">/* keeps the CDN sheet on load; on error / SRI mismatch / 3 s, swaps to the inline copy */</script>
<style id="fermi-sim-inline" media="not all">/* byte-identical copy of the CDN file */</style>
<link id="fermi-sim-css" rel="stylesheet" href="<CDN>/fermi-sim/1.0.0/fermi-sim.css"
      integrity="sha384-…" crossorigin="anonymous" onload="__fermiCss('cdn')" onerror="__fermiCss('inline')">
<!-- FERMI-SIM CSS v1.0.0 END -->
```
It also stamps `data-theme="light"` on `<html>` and `light-theme` on `<body>`, so the page is light from its first frame.

`<html data-fermi-css="cdn|inline">` tells you which copy is live. A CDN outage, a CSP block or a tampered file can't unstyle a sim, because the inline copy takes over.

- **Hosting path:** `<base>/fermi-sim/<version>/fermi-sim.css`, immutable per version (`Cache-Control: immutable`).
- **New versions:** a new version is a new path plus a scripted rewrite of the version in each sim. A file at an existing path never changes.
- **CORS:** the host must send `Access-Control-Allow-Origin: *`, because `crossorigin` and SRI require it.
- **Stage CSP:** `style-src 'self' 'unsafe-inline' https:` already allows any https host.

## The cascade model
`@layer fermi.tokens, fermi.base, fermi.components, fermi.override;`

| layer | contents | can it change a live sim? |
|---|---|---|
| `fermi.tokens` | `_tokens/*.css`: custom properties only | only where the sim defines nothing of the same name |
| `fermi.base` | empty in v1 | — element defaults would leak into live sims |
| `fermi.components` | `_styles/*.css`: `.fsim-*` classes | no: no live sim carries an `.fsim-*` class yet |
| `fermi.override` | `override.css`: the A look on legacy selectors, all `!important` | **yes, deliberately** |

The override layer works by a cascade rule. Normally a layered rule loses to any unlayered (inline) rule. For `!important`, layer order **reverses**, so a layered `!important` beats every unlayered `!important` in the sim. That lets one `<link>` in `<head>` restyle a sim carrying 7–14 inline `<style>` blocks without editing any of them.

`override.css` is scaffolding. It shrinks as each sim's inline chrome CSS moves onto the `.fsim-*` classes (Track R), and it's deleted when empty.

## Rules (enforced by `tools/build.py`, which refuses to build otherwise)
- No colour literals outside `_tokens/`.
- One definition per token, and every `var()` points at a defined token.
- `!important` only in `override.css`.
- Never `prefers-color-scheme`. Light is the one shipped theme; a future dark theme overrides the same names at `:root[data-theme="dark"]`.
- Main-app-named tokens carry the main app's exact value. `tools/parity.py` checks this against `study-tools-v2@stage` and writes `TOKENS.md`.
- Classes are BEM with the `fsim-` prefix. Bare `.btn`/`.card`/`.chip`, and even `sim-*`, already exist in live sim CSS; `fsim-` has 0 hits across uni-lab, AI courses and JEE.

## Files
```
_tokens/    colors · typography · spacing · radius · elevation · motion   (main-app names + values)
            sim.css   --fsim-* feature tokens (top bar, sidebar, hide tab, feedback, sheet, guide)
_styles/    primitives.css (.fsim-btn/-chip/-card/-feedback) · chrome.css (.fsim-topbar/-sidebar/-sheet/…)
override.css   temporary A-look layer on legacy selectors
tools/      build.py (lint+build+SRI) · apply.py (install into one sim / build the oracle)
            check_static.py (prove only the block + stamps changed) · parity.py (main-app token check)
            serve_cdn.py (local CDN stand-in for tests, incl. --tamper for the SRI test)
harness/    capture.mjs (headless: 14 states × 3 viewports: computed styles, boxes, screenshots, canvas)
            diff.py (reference vs candidate; exit 1 on any style/box/pixel/canvas difference)
TOKENS.md  CLASSES.md  MIGRATION.csv  VERSION
```

## How a sim is verified (all headless)
1. `tools/check_static.py pristine built`: nothing changed but the block and the two stamps.
2. `harness/capture.mjs` on the **oracle**, then on the build, and `harness/diff.py`. The oracle is `tools/apply.py --oracle`: the pristine sim plus the approved skin with the same stamps.
   - **States:** landing, guide first/middle/last, free + hint, free, hover on Play/Tutor/Hide tab, keyboard focus, sidebar hidden, Guided Inquiry, Physics sheet, lecture.
   - **Viewports:** 1440×900, 1280×763, 390×844.
   - **Pass:** 0 computed-style differences, 0 box moves, ≤ 0.25% pixels.
3. Run it through both delivery paths: the CDN link, and the inline fallback (dead CDN). Both must pass.
4. The UX gates: `sim-guide-kit/check.mjs` (22) and `regress.mjs` R2–R12.

**The harness is proven, not assumed.** Seven deliberately broken builds must all fail:
- a token off by one unit;
- a deleted rule;
- the block missing;
- a class wiped by JS;
- a 1 px spacing change;
- a hover-only colour change;
- broken theme forcing.

## Open items for the frontend engineer
1. **CDN host.** `d6jsp0m3kqowo.cloudfront.net` serves only `simulations/*/thumb.webp` today (other keys: 403). Serving `fermi-sim/*` from the content bucket needs a cache behaviour in `fermi-infra` (`testprep/media-cdn.tf`), with CORS `*` and immutable caching.
2. Should this source live here, or under `study-tools-v2/frontend/src/design-system/sims/`?
3. **Offline Inter:** embed a subset (+60–100 KB per sim) or accept the system-font fallback offline.
