# Canonical implementation — Welcome overlay (centered, card layout)

Blocks are verbatim from the validated `L1-Solar_System_Orbits` card-layout
welcome build (bundled as `examples/L1-Solar_System_Orbits.welcome-cards.html`),
upgraded 2026-10-01 to the owner-approved TWO-MODE liquid-glass landing
(§1b–§1c, §2, §3 lines; first shipped on `Fermi_university_sim_lab_sims/CM_sims/
cm-phase-plane.polished.html`, commit 7820a2b, then on all 116 uni-lab sims).
Copy; adapt only the ADAPT parts.

## 1. CSS — insert before `</style>`

ADAPT: `var(--font-sans)` → the sim's font variable. Light-theme rules already
target BOTH `html[data-theme="light"]` and `body.light-theme`; add a third
selector only if the sim uses a different hook. Nothing else.

```css
        /* ===== Welcome overlay (first landing) ===== */
        #welcome-overlay{position:fixed;inset:0;z-index:5000;background:radial-gradient(ellipse at center,rgba(2,6,12,.94) 0%,rgba(2,6,12,.86) 55%,rgba(2,6,12,.7) 100%);backdrop-filter:blur(2px);
          display:flex;align-items:center;justify-content:center;font-family:var(--font-sans);}
        #welcome-overlay.hidden{display:none;}
        .welcome-card{position:relative;width:min(760px,92vw);margin:0 auto;background:transparent;color:#E6EDF5;border-radius:0;overflow:visible;
          box-shadow:none;
          animation:wcIn .55s cubic-bezier(.2,.8,.2,1) both;}
        @keyframes wcIn{from{opacity:0;transform:translateY(14px) scale(.985);}to{opacity:1;transform:none;}}
        .welcome-hero{position:absolute;left:50%;transform:translateX(-50%);width:100vw;top:0;height:140px;background:transparent;pointer-events:none;-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);opacity:.9;}
        .welcome-hero canvas{display:block;width:100%;height:100%;}
        .welcome-hero::after{content:none;}
        .welcome-hero .hero-label{display:none;}
        .welcome-body{padding:156px 0 0;}
        .welcome-card h2{margin:0 auto 10px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
        .welcome-kicker{font-size:.95rem;font-weight:500;letter-spacing:.02em;color:#AAB6C6;}
        .welcome-name{font-size:2.3rem;line-height:1.08;letter-spacing:-.02em;font-weight:700;max-width:22ch;}
        .welcome-blurb{margin:0 auto 26px;font-size:1rem;line-height:1.55;color:#AAB6C6;max-width:44ch;text-align:center;}
        .welcome-ask{margin:0 0 8px;font-size:.82rem;font-weight:600;color:#E6EDF5;text-align:center;}
        html[data-theme="light"] .welcome-ask, body.light-theme .welcome-ask{color:#0F172A;}
        .welcome-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:0;}
        .welcome-mode{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;
          padding:18px 16px 16px;border-radius:14px;cursor:pointer;color:#E6EDF5;font-family:var(--font-sans);
          background:rgba(255,255,255,.045);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          border:1px solid rgba(148,163,184,.18);box-shadow:0 8px 24px rgba(0,0,0,.25);
          transition:transform .16s,border-color .16s,background .16s,box-shadow .16s;}
        .welcome-mode:hover,.welcome-mode:focus-visible{transform:translateY(-3px);background:rgba(255,255,255,.075);outline:none;box-shadow:0 14px 34px rgba(0,0,0,.35);}
        .welcome-mode[data-mode="inquiry"]:hover,.welcome-mode[data-mode="inquiry"]:focus-visible{border-color:rgba(52,211,153,.7);}
        .welcome-mode[data-mode="controls"]:hover,.welcome-mode[data-mode="controls"]:focus-visible{border-color:rgba(167,139,250,.7);}
        .welcome-mode[data-mode="free"]:hover,.welcome-mode[data-mode="free"]:focus-visible{border-color:rgba(251,191,36,.7);}
        .wm-icon{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;}
        .wm-icon svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .welcome-mode[data-mode="inquiry"] .wm-icon{background:rgba(16,185,129,.16);color:#34d399;}
        .welcome-mode[data-mode="controls"] .wm-icon{background:rgba(139,92,246,.18);color:#a78bfa;}
        .welcome-mode[data-mode="free"] .wm-icon{background:rgba(245,158,11,.16);color:#fbbf24;}
        .wm-text{min-width:0;display:flex;flex-direction:column;gap:4px;}
        .wm-title{display:flex;flex-wrap:nowrap;align-items:center;gap:6px;font-weight:600;font-size:.95rem;white-space:nowrap;}
        .wm-tag{font-size:.6rem;font-weight:600;padding:2px 6px;border-radius:999px;background:rgba(52,211,153,.16);color:#6ee7b7;letter-spacing:.01em;}
        .wm-desc{display:block;font-size:.8rem;line-height:1.45;color:#AAB6C6;}
        .wm-go{margin-top:auto;padding-top:6px;display:flex;align-items:center;gap:4px;font-size:.78rem;font-weight:600;color:#94A3B8;}
        .wm-go svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
        .welcome-mode:hover .wm-go{color:#E6EDF5;}
        @media (max-width:760px){.welcome-modes{grid-template-columns:1fr;}}
        .welcome-foot{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:22px;padding-top:0;border-top:none;}
        .welcome-listen{font-size:.8rem;color:#AAB6C6;line-height:1.35;}
        .welcome-listen b{display:block;color:#E6EDF5;font-weight:600;font-size:.84rem;}
        .welcome-audio{display:flex;align-items:center;gap:10px;}
        .welcome-audio button{display:grid;place-items:center;border:none;cursor:pointer;background:transparent;color:#C7D2E0;padding:0;font-family:var(--font-sans);}
        .welcome-audio button:disabled{opacity:.3;cursor:default;}
        .welcome-audio .wa-skip{width:34px;height:34px;border-radius:50%;}
        .welcome-audio .wa-skip:hover:not(:disabled){color:#fff;background:rgba(148,163,184,.12);}
        .welcome-audio .wa-skip svg{width:20px;height:20px;fill:currentColor;}
        #welcome-speak{width:44px;height:44px;border-radius:50%;background:#F4F7FA;color:#0B1220;transition:transform .12s;}
        #welcome-speak:hover{transform:scale(1.06);}
        #welcome-speak svg{width:20px;height:20px;fill:currentColor;}
        #welcome-speak[data-state="playing"] svg.i-play,#welcome-speak[data-state="playing"] svg.i-again{display:none;}
        #welcome-speak:not([data-state="playing"]) svg.i-pause{display:none;}
        #welcome-speak[data-state="done"] svg.i-play{display:none;}
        #welcome-speak:not([data-state="done"]) svg.i-again{display:none;}
        .welcome-seg{display:flex;gap:4px;margin-left:4px;}
        .welcome-seg i{display:block;width:14px;height:3px;border-radius:2px;background:rgba(148,163,184,.25);}
        .welcome-seg i.on{background:#34d399;}
        .welcome-seg i.cur{background:#F4F7FA;}
        .welcome-progress{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
        @media (prefers-reduced-motion: reduce){.welcome-card{animation:none;}}
        html[data-theme="light"] #welcome-overlay, body.light-theme #welcome-overlay{background:radial-gradient(ellipse at center,rgba(241,245,249,.94) 0%,rgba(241,245,249,.86) 55%,rgba(241,245,249,.72) 100%);}
        html[data-theme="light"] .welcome-card, body.light-theme .welcome-card{background:transparent;color:#0F172A;box-shadow:none;}
        html[data-theme="light"] .welcome-hero, body.light-theme .welcome-hero{background:transparent;}
        html[data-theme="light"] .welcome-blurb,body.light-theme .wm-desc,body.light-theme .welcome-listen, body.light-theme .welcome-blurb,body.light-theme .wm-desc,body.light-theme .welcome-listen{color:#475569;}
        html[data-theme="light"] .welcome-listen b, body.light-theme .welcome-listen b{color:#0F172A;}
        html[data-theme="light"] .welcome-mode, body.light-theme .welcome-mode{color:#0F172A;background:rgba(255,255,255,.55);border-color:rgba(15,23,42,.12);}
        html[data-theme="light"] .wm-tag, body.light-theme .wm-tag{color:#047857;background:rgba(16,185,129,.14);}
        html[data-theme="light"] .wm-go, body.light-theme .wm-go{color:#475569;}
        html[data-theme="light"] .welcome-mode:hover, body.light-theme .welcome-mode:hover{background:rgba(15,23,42,.07);}
        html[data-theme="light"] .welcome-audio button, body.light-theme .welcome-audio button{color:#334155;}
        html[data-theme="light"] #welcome-speak, body.light-theme #welcome-speak{background:#0F172A;color:#fff;}
        html[data-theme="light"] .welcome-seg i.cur, body.light-theme .welcome-seg i.cur{background:#0F172A;}
```

## 1b. Liquid-glass landing choices — insert right AFTER the §1 block

VERBATIM (the owner approved this exact material). It wins over §1 by
`#welcome-overlay` specificity, so order is not load-bearing, but keep it
after §1 for readability. ADAPT only: the stack breakpoint (`640px`) may be
raised to the sim's own §1 breakpoint (e.g. `760px`) if two columns look
cramped between them; `max-width:510px` → `502px` if you want the two cards
EXACTLY the old single-card width (244px); and the light-theme rules per §1c.

```css
/* ===== Landing choices: liquid glass (two modes) =====
   Same card size, icons, text and colours as before; only the surface becomes clear, whitish glass. */
#welcome-overlay .welcome-modes{grid-template-columns:repeat(2,1fr);max-width:510px;margin:0 auto;}
@media (max-width:640px){#welcome-overlay .welcome-modes{grid-template-columns:1fr;}}
#welcome-overlay .welcome-mode{isolation:isolate;border-radius:18px;
  background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.05) 55%,rgba(255,255,255,.08));
  -webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);
  border:1px solid rgba(255,255,255,.2);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.42),inset 0 -1px 0 rgba(255,255,255,.07),0 8px 24px rgba(0,0,0,.28);
  transition:transform .35s cubic-bezier(.2,.9,.3,1.2),background .2s,border-color .2s,box-shadow .2s;}
/* specular sheen across the top of the glass */
#welcome-overlay .welcome-mode::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;
  background:radial-gradient(130% 60% at 30% 0%,rgba(255,255,255,.16),rgba(255,255,255,0) 60%);}
/* light-catching rim: bright at the top-left and bottom-right corners */
#welcome-overlay .welcome-mode::after{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;padding:1px;
  background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,.08) 35%,rgba(255,255,255,.04) 65%,rgba(255,255,255,.35));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;}
#welcome-overlay .welcome-mode:hover,#welcome-overlay .welcome-mode:focus-visible{transform:translateY(-3px);
  background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.08) 55%,rgba(255,255,255,.11));border-color:rgba(255,255,255,.3);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 14px 34px rgba(0,0,0,.35);}
#welcome-overlay .welcome-mode:active{transform:scale(.98);}
html[data-theme="light"] #welcome-overlay .welcome-mode,body.light-theme #welcome-overlay .welcome-mode{
  background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,255,255,.45) 55%,rgba(255,255,255,.58));border-color:rgba(255,255,255,.9);
  box-shadow:inset 0 1px 0 #fff,0 1px 1px rgba(15,23,42,.05),0 8px 24px rgba(15,23,42,.12);}
html[data-theme="light"] #welcome-overlay .welcome-mode::after,body.light-theme #welcome-overlay .welcome-mode::after{
  background:linear-gradient(135deg,#fff,rgba(255,255,255,.4) 35%,rgba(15,23,42,.06) 65%,rgba(255,255,255,.9));}
html[data-theme="light"] #welcome-overlay .welcome-mode:hover,body.light-theme #welcome-overlay .welcome-mode:hover{
  background:linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,.6) 55%,rgba(255,255,255,.7));box-shadow:inset 0 1px 0 #fff,0 14px 34px rgba(15,23,42,.16);}
@media (prefers-reduced-motion:reduce){#welcome-overlay .welcome-mode{transition:none;}}
```

The Simulation guide's spotlight rule ships in the same `<style>` (it is the
controls-tutorial skill's, §7.1 there) — insert it right after this block:

```css
/* ===== Simulation guide: spotlight for canvas regions ===== */
#cg-spot{position:fixed;z-index:3990;pointer-events:none;display:none;border-radius:10px;}
```

## 1c. Light theme — pick the case by MEASURING, not by reading the CSS

Load the page, then force light theme the way a host viewer does
(`document.documentElement.setAttribute('data-theme','light')`, or click the
sim's theme button), wait ~250ms, read the computed colour of
`.welcome-mode[data-mode="controls"] .wm-title` and the card's
`background-image`, and screenshot the two cards.

1. **Overlay turns light, title turns dark (#0F172A)** — the §1 light rules
   are in effect. Keep §1b as is. (105 of 116 fleet sims.)
2. **Overlay stays dark in every theme** (the sim never shipped light welcome
   rules; title stays #E6EDF5) — the whitish light glass would put pale text
   on a pale card. Replace the three `html[data-theme="light"] …` rules of
   §1b with this comment, so the dark glass stays in light theme:
   ```css
   /* no light-glass variants: this sim's welcome overlay stays dark in every theme */
   ```
   (10 QM sims: A(k)-vs-k-plot, Time_evolution_Gaussian_Fourier-comps,
   Time_evolution_Gaussian_wavepacket — built this way — and
   2d_wavefunction_collapse_measurement, Harmonic-oscillator,
   Multi_Stage_Stern_Gerlach_New, Spherical_harmonics_Explorer,
   Spin-X-measurement-probability, Spin_Measurement,
   wavefunctions-and-probability, which shipped pale-on-pale and were fixed.)
3. **Overlay turns light but the title stays pale** — the sim's §1 copy
   hard-codes `color:#E6EDF5` on `.welcome-mode` with no light override. Keep
   §1b and add, before its reduced-motion line:
   ```css
   html[data-theme="light"] #welcome-overlay .welcome-mode,body.light-theme #welcome-overlay .welcome-mode{color:#0F172A;}
   html[data-theme="light"] #welcome-overlay .wm-desc,body.light-theme #welcome-overlay .wm-desc,html[data-theme="light"] #welcome-overlay .wm-go,body.light-theme #welcome-overlay .wm-go{color:#475569;}
   ```
   (stern-gerlach-NEW.)

Sims whose light theme uses a third hook (`body.theme-bright`,
`body.theme-light`) add that selector to every light rule of §1b.

## 2. Markup — first child of `body` after the header (it is fixed-position)

ADAPT: the `.welcome-name` text (sim name; "Welcome to" kicker is fixed),
the description, the hero caption; delete the `controls` card if the sim has
no guide (`#btn-cg`). Exactly two cards — there is NO `inquiry` card (Guided
Inquiry is reached from the header 🧭 button). The two card titles and
descriptions are HOUSE COPY — do not rewrite them. Keep every id and
`data-mode`.

```html
    <div id="welcome-overlay" role="dialog" aria-labelledby="welcome-title">
        <div class="welcome-card">
            <div class="welcome-hero">
                <canvas id="welcome-fringes" width="1280" height="240" aria-hidden="true"></canvas>
                <span class="hero-label">Equal time steps along each orbit — closer to the Sun means faster</span>
            </div>
            <div class="welcome-body">
                <h2 id="welcome-title"><span class="welcome-kicker">Welcome to</span><span class="welcome-name">Solar system orbits</span></h2>
                <p class="welcome-blurb">Watch the planets trace their orbits — each one speeds up near the Sun and slows down far from it.</p>
                <p class="welcome-ask">How would you like to begin?</p>
                <div class="welcome-modes">
                    <button type="button" class="welcome-mode" data-mode="controls">
                        <span class="wm-icon"><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></span>
                        <span class="wm-text"><span class="wm-title">Simulation guide</span>
                            <span class="wm-desc">What’s on screen, then every control — one at a time.</span></span>
                        <span class="wm-go">Start <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
                    </button>
                    <button type="button" class="welcome-mode" data-mode="free">
                        <span class="wm-icon"><svg viewBox="0 0 24 24"><path d="M4 20l5-5M4 20v-4M4 20h4M20 4l-5 5M20 4v4M20 4h-4"/></svg></span>
                        <span class="wm-text"><span class="wm-title">Free exploration</span>
                            <span class="wm-desc">Everything open. Experiment on your own.</span></span>
                        <span class="wm-go">Start <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
                    </button>
                </div>
                <div class="welcome-foot">
                    <div class="welcome-listen"><b>Listen to the intro</b></div>
                    <div class="welcome-audio" aria-label="Read aloud controls">
                        <button type="button" class="wa-skip" id="welcome-prev" title="Previous line" aria-label="Previous line"><svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM19 5L9 12l10 7z"/></svg></button>
                        <button type="button" id="welcome-speak" data-state="idle" title="Play" aria-label="Play" aria-pressed="false">
                            <svg class="i-play" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>
                            <svg class="i-pause" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                            <svg class="i-again" viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.3 4h2.2A5 5 0 1 0 12 7v3l-4-4 4-4z"/></svg>
                        </button>
                        <button type="button" class="wa-skip" id="welcome-next" title="Next line" aria-label="Next line"><svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM5 5l10 7-10 7z"/></svg></button>
                        <span class="welcome-seg" id="welcome-seg" aria-hidden="true"></span>
                        <span id="welcome-progress" class="welcome-progress"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>

```

## 3. Script — insert before `</body>` INCLUDING the `<script>` wrapper

ADAPT: the five `script` lines — lines 1–2 are sim-specific; line 4 is house
copy with THIS sim's 2–4 main on-screen components filled in (the same things
the guide's scene steps spotlight: panels, apparatus, graphs, colour key);
lines 3 and 5 are house copy. Never mention Guided Inquiry or a count of
"three" ways in. Warm-narration sims may phrase line 4 as the fleet does:
`'Choose Simulation Guide for a tour of what’s on screen — <components> — and
then every control.'` Then the `drawHero` body (see §4), and `WELCOME_ONCE`
(false → true for production). Everything else — transport, position
tracking, auto-attempt, guards — stays as is.

```html
    <script>
    /* ===== Welcome overlay + read-aloud transport (browser speech synthesis) ===== */
    (function(){
      const ov = document.getElementById('welcome-overlay');
      if(!ov) return;
      const $ = id => document.getElementById(id);
      // Show-once: keep false while the welcome is under review; true for production.
      const WELCOME_ONCE = false;
      const WELCOME_KEY = 'welcome:' + (document.title || location.pathname);
      try { if(WELCOME_ONCE && localStorage.getItem(WELCOME_KEY)) { ov.classList.add('hidden'); return; } } catch(e){}
      const playBtn = $('welcome-speak'), prevBtn = $('welcome-prev'), nextBtn = $('welcome-next'), prog = $('welcome-progress');
      const script = [
        'Welcome to solar system orbits.',
        'Here you watch the planets trace their orbits around the Sun. Every orbit is an ellipse with the Sun at one focus, and each planet speeds up as it swings close to the Sun and slows down far away.',
        'Choose how you would like to begin.',
        'Simulation Guide shows you what’s on screen — the Sun, the planets and their orbits — and then introduces every control, one at a time.',
        'Free Exploration opens everything from the start, so you can experiment entirely on your own.'
      ];
      /* Hero: orbits drawn as EQUAL-TIME-STEP dots — dense where the planet is slow (far
         from the Sun), sparse where it is fast (near it). Kepler's second law, honestly drawn. */
      function drawHero(){
        const c = $('welcome-fringes'); if(!c) return;
        const ctx = c.getContext('2d'), W = c.width, H = c.height;
        const LIGHT = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
        const tile = c.dataset.tile === '1';
        const DOTS_H = tile ? H*0.62 : H;
        ctx.clearRect(0,0,W,H);   // transparent: the overlay's dim is the background in both themes
        const orbits = [ {a:0.28, e:0.06}, {a:0.55, e:0.32}, {a:0.86, e:0.58} ];
        const S = tile ? Math.min(W*0.36, DOTS_H*0.78) : W*0.235, YS = tile ? 0.62 : 0.40;
        const cx = W*0.50 + S*0.18, cy = DOTS_H*0.52;
        const kepler = (M, e) => { let E = M; for(let i=0;i<8;i++) E -= (E - e*Math.sin(E) - M)/(1 - e*Math.cos(E)); return E; };
        const pos = (o, M) => { const E = kepler(M, o.e); const x = o.a*(Math.cos(E) - o.e), y = o.a*Math.sqrt(1-o.e*o.e)*Math.sin(E); return {x: cx + x*S, y: cy - y*S*YS}; };
        // faint orbit outlines + Sun
        ctx.strokeStyle = LIGHT ? 'rgba(15,23,42,.18)' : 'rgba(148,163,184,.16)'; ctx.lineWidth = 1;
        orbits.forEach(o => { ctx.beginPath(); for(let k=0;k<=240;k++){ const p = pos(o, k/240*2*Math.PI); k===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y); } ctx.closePath(); ctx.stroke(); });
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26); g.addColorStop(0,'rgba(255,224,130,1)'); g.addColorStop(.35,'rgba(255,196,60,.9)'); g.addColorStop(1,'rgba(255,196,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 7); ctx.fill();
        if(tile){
          // speed along the outermost orbit, v = sqrt(2/r - 1/a), drawn in its own band beneath
          const o = orbits[2], base = H - 40, amp = H*0.24, top = DOTS_H + 20;
          ctx.strokeStyle = 'rgba(52,211,153,.55)'; ctx.lineWidth = 2.5; ctx.beginPath();
          let vmin = 1e9, vmax = 0, vs = [];
          for(let i=0;i<=W;i++){ const M = (i/W)*2*Math.PI + Math.PI; const E = kepler(M, o.e); const r = o.a*(1 - o.e*Math.cos(E)); const v = Math.sqrt(2/r - 1/o.a); vs.push(v); vmin = Math.min(vmin,v); vmax = Math.max(vmax,v); }
          vs.forEach((v,i) => { const y = base - (v - vmin)/(vmax - vmin)*amp; i===0 ? ctx.moveTo(i,y) : ctx.lineTo(i,y); });
          ctx.stroke(); ctx.lineTo(W, base); ctx.lineTo(0, base); ctx.closePath(); ctx.fillStyle = 'rgba(52,211,153,.07)'; ctx.fill();
          ctx.strokeStyle = 'rgba(148,163,184,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, base+0.5); ctx.lineTo(W, base+0.5); ctx.stroke();
          ctx.fillStyle = 'rgba(159,224,198,.7)'; ctx.font = '600 20px ' + getComputedStyle(document.body).fontFamily;
          ctx.fillText('speed along the outer orbit', 18, top + 6);
        }
        // equal-time dots accumulating around each orbit (one orchestrated entrance)
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const N = 140; let k = 0;
        function batch(){
          const per = reduce ? N : 3;
          for(let s=0;s<per && k<N;s++,k++){
            orbits.forEach((o,i) => { const p = pos(o, k/N*2*Math.PI + i*0.9);
              ctx.fillStyle = LIGHT ? (i===2 ? 'rgba(5,150,105,.9)' : i===1 ? 'rgba(2,132,199,.85)' : 'rgba(217,119,6,.85)') : (i===2 ? 'rgba(110,231,183,.9)' : i===1 ? 'rgba(125,211,252,.85)' : 'rgba(253,224,171,.85)');
              ctx.beginPath(); ctx.arc(p.x, p.y, tile ? 3.4 : 3.0, 0, 7); ctx.fill(); });
          }
          if(k < N) requestAnimationFrame(batch);
          else orbits.forEach((o,i) => { const p = pos(o, i*0.9); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, tile ? 5 : 4, 0, 7); ctx.fill(); });
        }
        batch();
      }
      drawHero();
      // Theme can change while the overlay is open (keyboard/system): redraw the hero in the new colours
      new MutationObserver(()=>{ if(!ov.classList.contains('hidden')) drawHero(); })
        .observe(document.documentElement, { attributes:true, attributeFilter:['data-theme','class'] });
      new MutationObserver(()=>{ if(!ov.classList.contains('hidden')) drawHero(); })
        .observe(document.body, { attributes:true, attributeFilter:['class'] });
      const synth = window.speechSynthesis;
      // Transport state: current line, char offset inside it (from boundary events), playing flag.
      let idx = 0, charAt = 0, playing = false, current = null, finished = false;

      // Quality-ranked: Chrome's remote Google voices sound natural; macOS's
      // local compact voices (Samantha/Daniel/Fred…) are mechanical — last resort.
      function pickVoice(){
        const vs = synth ? synth.getVoices() : [];
        const en = vs.filter(v => /^en/i.test(v.lang));
        return en.find(v => v.name === 'Google US English')
            || en.find(v => v.name === 'Google UK English Female')
            || en.find(v => v.name === 'Google UK English Male')
            || en.find(v => /Natural|Enhanced|Premium|Neural/i.test(v.name) && v.localService)
            || en.find(v => v.name === 'Samantha')
            || en[0] || null;
      }
      function render(){
        playBtn.dataset.state = playing ? 'playing' : (finished ? 'done' : 'idle');
        playBtn.title = playing ? 'Pause' : (finished ? 'Play again' : (idx===0 && charAt===0 ? 'Play' : 'Resume'));
        playBtn.setAttribute('aria-label', playBtn.title);
        playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
        prog.textContent = (Math.min(idx, script.length-1)+1) + ' / ' + script.length;
        const seg = $('welcome-seg');
        if(seg){ if(!seg.children.length) script.forEach(()=>seg.appendChild(document.createElement('i')));
          [...seg.children].forEach((el,i)=>{ el.className = i < idx || finished ? 'on' : (i===idx ? 'cur' : ''); }); }
        prevBtn.disabled = idx===0 && charAt===0 && !playing;
        nextBtn.disabled = idx>=script.length-1;
      }
      // Speak line `idx` starting at `charAt`; chain to the next line on end.
      function speakCurrent(){
        if(!synth) return;
        synth.cancel();
        const text = script[idx].slice(charAt);
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice(); if(v) u.voice = v;
        u.rate = 0.98; u.pitch = 1;
        const base = charAt, myIdx = idx;
        u.onboundary = e => { if(current === u && typeof e.charIndex === 'number') charAt = base + e.charIndex; };
        u.onend = () => {
          if(current !== u || !playing) return;
          if(myIdx < script.length-1){ idx = myIdx+1; charAt = 0; speakCurrent(); }
          else { playing = false; finished = true; idx = script.length-1; charAt = 0; render(); }
        };
        current = u; finished = false;
        synth.speak(u);
        render();
      }
      function play(){
        if(!synth) return;
        if(finished){ idx = 0; charAt = 0; }
        playing = true;
        speakCurrent();                 // resumes from the recorded char offset of the current line
      }
      function pause(){
        if(!synth) return;
        playing = false;
        synth.cancel();                 // stop now; idx/charAt keep the position for resume
        current = null;
        render();
      }
      function jump(delta){
        idx = Math.max(0, Math.min(script.length-1, idx + delta));
        charAt = 0; finished = false;
        if(playing) speakCurrent(); else { synth && synth.cancel(); current = null; render(); }
      }
      playBtn.addEventListener('click', () => playing ? pause() : play());
      prevBtn.addEventListener('click', () => {
        // Rewind: restart the current line if we're inside it, else go to the previous line
        if(charAt > 0){ charAt = 0; if(playing) speakCurrent(); else render(); }
        else jump(-1);
      });
      nextBtn.addEventListener('click', () => jump(+1));
      // Auto-start; browsers that block audio before a gesture leave the button as the entry point.
      if(synth){
        let attempted = false;
        const tryAuto = () => { if(attempted) return; attempted = true; play();
          setTimeout(() => { if(!synth.speaking && !synth.pending){ playing = false; current = null; render(); } }, 700); };
        if(synth.getVoices().length) tryAuto();
        else { synth.addEventListener('voiceschanged', tryAuto, { once:true }); setTimeout(tryAuto, 800); }
      } else { playBtn.disabled = true; prevBtn.disabled = true; nextBtn.disabled = true; prog.textContent = ''; }
      render();
      ov.querySelectorAll('.welcome-mode').forEach(b => b.addEventListener('click', () => {
        pause();
        ov.classList.add('hidden');
        try { if(WELCOME_ONCE) localStorage.setItem(WELCOME_KEY, '1'); } catch(e){}
        if(window.__setMode) window.__setMode(b.dataset.mode);
      }));
    })();
    </script>
```

## 4. Hero exemplars — write a new one per sim

Contract: canvas `#welcome-fringes` (1280×240), TRANSPARENT background
(`clearRect` — the overlay's dim is the backdrop in both themes), read `LIGHT`
from the document and pick deeper colours for the light theme, draw the
sim's core idea from its own equations, accumulate over ~1–2 s via
`requestAnimationFrame` (one frame under reduced motion), never loop.
Replace the `drawHero` function body in §3 with yours (keep the name — the
theme-change observer calls it to redraw).

Orbits (solar system) — equal-time-step dots along ellipses sharing the
Sun at a focus; density shows speed:

```js
      /* Hero: orbits drawn as EQUAL-TIME-STEP dots — dense where the planet is slow (far
         from the Sun), sparse where it is fast (near it). Kepler's second law, honestly drawn. */
      function drawHero(){
        const c = $('welcome-fringes'); if(!c) return;
        const ctx = c.getContext('2d'), W = c.width, H = c.height;
        const LIGHT = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
        const tile = c.dataset.tile === '1';
        const DOTS_H = tile ? H*0.62 : H;
        ctx.clearRect(0,0,W,H);   // transparent: the overlay's dim is the background in both themes
        const orbits = [ {a:0.28, e:0.06}, {a:0.55, e:0.32}, {a:0.86, e:0.58} ];
        const S = tile ? Math.min(W*0.36, DOTS_H*0.78) : W*0.235, YS = tile ? 0.62 : 0.40;
        const cx = W*0.50 + S*0.18, cy = DOTS_H*0.52;
        const kepler = (M, e) => { let E = M; for(let i=0;i<8;i++) E -= (E - e*Math.sin(E) - M)/(1 - e*Math.cos(E)); return E; };
        const pos = (o, M) => { const E = kepler(M, o.e); const x = o.a*(Math.cos(E) - o.e), y = o.a*Math.sqrt(1-o.e*o.e)*Math.sin(E); return {x: cx + x*S, y: cy - y*S*YS}; };
        // faint orbit outlines + Sun
        ctx.strokeStyle = LIGHT ? 'rgba(15,23,42,.18)' : 'rgba(148,163,184,.16)'; ctx.lineWidth = 1;
        orbits.forEach(o => { ctx.beginPath(); for(let k=0;k<=240;k++){ const p = pos(o, k/240*2*Math.PI); k===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y); } ctx.closePath(); ctx.stroke(); });
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26); g.addColorStop(0,'rgba(255,224,130,1)'); g.addColorStop(.35,'rgba(255,196,60,.9)'); g.addColorStop(1,'rgba(255,196,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 7); ctx.fill();
        if(tile){
          // speed along the outermost orbit, v = sqrt(2/r - 1/a), drawn in its own band beneath
          const o = orbits[2], base = H - 40, amp = H*0.24, top = DOTS_H + 20;
          ctx.strokeStyle = 'rgba(52,211,153,.55)'; ctx.lineWidth = 2.5; ctx.beginPath();
          let vmin = 1e9, vmax = 0, vs = [];
          for(let i=0;i<=W;i++){ const M = (i/W)*2*Math.PI + Math.PI; const E = kepler(M, o.e); const r = o.a*(1 - o.e*Math.cos(E)); const v = Math.sqrt(2/r - 1/o.a); vs.push(v); vmin = Math.min(vmin,v); vmax = Math.max(vmax,v); }
          vs.forEach((v,i) => { const y = base - (v - vmin)/(vmax - vmin)*amp; i===0 ? ctx.moveTo(i,y) : ctx.lineTo(i,y); });
          ctx.stroke(); ctx.lineTo(W, base); ctx.lineTo(0, base); ctx.closePath(); ctx.fillStyle = 'rgba(52,211,153,.07)'; ctx.fill();
          ctx.strokeStyle = 'rgba(148,163,184,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, base+0.5); ctx.lineTo(W, base+0.5); ctx.stroke();
          ctx.fillStyle = 'rgba(159,224,198,.7)'; ctx.font = '600 20px ' + getComputedStyle(document.body).fontFamily;
          ctx.fillText('speed along the outer orbit', 18, top + 6);
        }
        // equal-time dots accumulating around each orbit (one orchestrated entrance)
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const N = 140; let k = 0;
        function batch(){
          const per = reduce ? N : 3;
          for(let s=0;s<per && k<N;s++,k++){
            orbits.forEach((o,i) => { const p = pos(o, k/N*2*Math.PI + i*0.9);
              ctx.fillStyle = LIGHT ? (i===2 ? 'rgba(5,150,105,.9)' : i===1 ? 'rgba(2,132,199,.85)' : 'rgba(217,119,6,.85)') : (i===2 ? 'rgba(110,231,183,.9)' : i===1 ? 'rgba(125,211,252,.85)' : 'rgba(253,224,171,.85)');
              ctx.beginPath(); ctx.arc(p.x, p.y, tile ? 3.4 : 3.0, 0, 7); ctx.fill(); });
          }
          if(k < N) requestAnimationFrame(batch);
          else orbits.forEach((o,i) => { const p = pos(o, i*0.9); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, tile ? 5 : 4, 0, 7); ctx.fill(); });
        }
        batch();
      }
      drawHero();
```

Fringes (double-slit) — arrivals rejection-sampled from the interference
intensity:

```js
      /* Hero: the real interference intensity, drawn as dots accumulating into fringes */
      function drawHero(){
        const c = $('welcome-fringes'); if(!c) return;
        const ctx = c.getContext('2d'), W = c.width, H = c.height;
        const LIGHT = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
        const sinc = u => u===0 ? 1 : Math.sin(u)/u;
        const I = x => { const k = (x-0.5)*36; return Math.pow(Math.cos(k*1.0),2) * Math.pow(sinc(k*0.22),2); };
        ctx.clearRect(0,0,W,H);
        // faint theoretical curve along the bottom

        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let n = 0, total = reduce ? 1 : 42;
        function batch(){
          ctx.fillStyle = LIGHT ? 'rgba(5,150,105,.85)' : 'rgba(110,231,183,.85)';
          const count = reduce ? 9000 : 220;
          for(let k=0;k<count;k++){
            let x; for(let t=0;t<40;t++){ x = Math.random(); if(Math.random() <= I(x)) break; }
            const y = 14 + Math.random()*(H-44);
            ctx.fillRect(x*W, y, 2.2, 2.2);
          }
          if(++n < total) requestAnimationFrame(batch);
        }
        batch();
      }
      drawHero();
```

## 5. Hook — inside the two-button controller, right after `__giOff`

Unchanged by the two-mode landing (the landing now only ever sends
`controls` or `free`; the inquiry branch stays as the default so the header
button and any older caller keep working):

```js
    window.__setMode = mode => {           // welcome overlay entry points
      if(mode === 'controls') setCg(true);
      else if(mode === 'free') { if(cgOn) setCg(false); setGi(false); }
      else setGi(true);
    };
```
