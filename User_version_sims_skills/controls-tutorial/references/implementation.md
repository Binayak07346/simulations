# Canonical implementation — Simulation guide (overlay; formerly "Controls Guide") + two-button template

User-visible name: **Simulation guide** (2026-10-01). Ids, classes and JS
identifiers keep their `cg` names. §7 adds the scene tour + spotlight engine
that every guide now opens with.

Every block below is verbatim from a bundled example:
`examples/Double-slit-experiment.full-template.html` (standalone sim with its
own top bar; §1–3) and `examples/L1-Solar_System_Orbits.welcome-center.html`
(L-series shell; §4). `examples/L2-Newtons-laws.all-three-skills.html` is the
dry-run proof on an untouched prod sim (§4b). Copy; adapt only ADAPT parts.

## 1. CSS — insert before `</style>`

Guide-button wrapper (its OWN wrapper beside the sim's action box; text-only
labels; ADAPT the `--text-main`-free colours only if the sim's top bar is dark):

```css
        /* Placement: the pair sits in the LEFT cluster right after the theme
           toggle (JEE fleet reference). margin-left:auto here right-anchors it —
           keep it ONLY if the sim has no theme/left cluster; otherwise override
           with margin-left:0 (or 12px) and give Reset/Play's group the auto. */
        .guide-actions{display:flex;gap:8px;align-items:center;margin-left:auto;flex-shrink:0;}
        .top-bar-actions{margin-left:12px;}
        .guide-actions .btn-guide{height:36px;padding:0 14px;background:#fff;color:#334155;}
        .guide-actions .btn-guide.active{background:#065f46;color:#fff;border-color:#065f46;}
```

Zone hide rule — ADAPT the selector to the sim's inquiry-zone id:

```css
        .gi-off #inq-zone{display:none !important;}
```

Overlay guide (purple callout + purple nav, veil/hide classes, glow). Light-theme rules
target BOTH `html[data-theme="light"]` and `body.light-theme` — no
adaptation unless the sim uses a third hook.

```css
        .cg-hidden{display:none !important;}
        .cg-veiled{visibility:hidden !important;pointer-events:none;}
        .cg-glow{outline:1px solid #10b981;border-radius:8px;
          box-shadow:0 0 0 1px #10b981,0 0 14px rgba(16,185,129,.55);
          animation:cgPulse 1.6s ease-in-out infinite;}
        @keyframes cgPulse{0%,100%{box-shadow:0 0 0 1px #10b981,0 0 10px rgba(16,185,129,.4);}
          50%{box-shadow:0 0 0 2px #10b981,0 0 20px rgba(16,185,129,.7);}}
        .cg-callout{position:fixed;z-index:4000;max-width:260px;background:#0d1522;color:#e2e8f0;
          border:1.5px solid #8b5cf6;border-radius:10px;padding:10px 12px;box-shadow:0 10px 26px rgba(0,0,0,.45);font-family:var(--font-family);}
        .cg-callout h5{margin:0 0 4px;font-size:0.8rem;font-weight:700;color:#a78bfa;}
        .cg-callout p{margin:0;font-size:0.78rem;line-height:1.45;}
        .cg-arrow{position:absolute;width:12px;height:12px;background:#0d1522;transform:rotate(45deg);}
        .cg-callout.arrow-top .cg-arrow{top:-7px;border-top:1.5px solid #8b5cf6;border-left:1.5px solid #8b5cf6;}
        .cg-callout.arrow-bottom .cg-arrow{bottom:-7px;border-bottom:1.5px solid #8b5cf6;border-right:1.5px solid #8b5cf6;}
        .cg-callout.arrow-right .cg-arrow{right:-7px;border-top:1.5px solid #8b5cf6;border-right:1.5px solid #8b5cf6;}
        .cg-callout.arrow-left .cg-arrow{left:-7px;border-bottom:1.5px solid #8b5cf6;border-left:1.5px solid #8b5cf6;}
        .cg-callout.no-arrow .cg-arrow{display:none;}
        html[data-theme="light"] .cg-callout, body.light-theme .cg-callout{background:#fff;color:#0f172a;border-color:#7c3aed;}
        html[data-theme="light"] .cg-callout h5, body.light-theme .cg-callout h5{color:#7c3aed;}
        html[data-theme="light"] .cg-arrow, body.light-theme .cg-arrow{background:#fff;border-color:#7c3aed !important;}
        /* Nav bar matches the purple callout: same panel fill, purple border, purple buttons */
        .cg-nav{position:fixed;z-index:4000;right:18px;bottom:16px;display:flex;gap:8px;align-items:center;
          background:#0d1522;border:1.5px solid #8b5cf6;border-radius:10px;padding:8px 10px;box-shadow:0 10px 26px rgba(0,0,0,.45);font-family:var(--font-family);}
        .cg-nav button{height:30px;padding:0 12px;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;
          background:transparent;border:1px solid #8b5cf6;color:#a78bfa;font-family:var(--font-family);transition:background .15s,color .15s;}
        .cg-nav button:hover:not(:disabled){background:rgba(139,92,246,.18);color:#e2e8f0;}
        .cg-nav button:disabled{opacity:.35;cursor:default;}
        .cg-nav #cg-next{background:#8b5cf6;border-color:#8b5cf6;color:#fff;min-width:76px;}
        .cg-nav #cg-next:hover:not(:disabled){background:#7c3aed;border-color:#7c3aed;color:#fff;}
        html[data-theme="light"] .cg-nav, body.light-theme .cg-nav{background:#fff;border-color:#7c3aed;}
        html[data-theme="light"] .cg-nav button, body.light-theme .cg-nav button{border-color:#7c3aed;color:#7c3aed;}
        html[data-theme="light"] .cg-nav button:hover:not(:disabled), body.light-theme .cg-nav button:hover:not(:disabled){background:rgba(124,58,237,.12);color:#5b21b6;}
        html[data-theme="light"] .cg-nav #cg-next, body.light-theme .cg-nav #cg-next{background:#7c3aed;color:#fff;}
```

## 2. Buttons — a `.guide-actions` wrapper placed BEFORE the sim's action box

```html
        <div class="guide-actions">
            <button type="button" class="btn-topbar btn-guide active" id="btn-gi" title="Show or hide the guided inquiry">Guided Inquiry</button>
            <button type="button" class="btn-topbar btn-guide" id="btn-cg" title="Show or hide the simulation guide">Simulation guide</button>
        </div>
```

## 3. Controller — inside the template `<script>` (see the example for the
full file; the inquiry machinery precedes this block when the sim has one)

ADAPT only `cgSteps` (selectors, `mode` veil/hide, `also`, title, ≤15-word
text; last entry `sel:null` is the closing card). Keep `__cgReveals` /
`__cgPrepare` calls, positioning (incl. the scroll-into-view before measuring —
short viewports), `cgMax` reveal, session memory, teardown:

```js
      /* ---------------- Two-button template ---------------- */
      const giBtn = $('btn-gi'), cgBtn = $('btn-cg'), root = document.documentElement;
      let cgOn = false, cgStep = 0, cgMax = 0, callout = null, nav = null;
      const cgSteps = [
        { sel:'#playpause-btn', mode:'veil', title:'Play / Pause', text:'Runs and pauses the particle source.' },
        { sel:'#reset-btn',     mode:'veil', title:'Reset',        text:'Clears detections and restarts the waves.' },
        { sel:'#classical-btn', mode:'veil', title:'Classical Pattern', text:'Overlays the classical bullets prediction P\u2081+P\u2082 for comparison.' },
        { sel:'#sep-box',       mode:'hide', also:['#width-box'], title:'Slit geometry', text:'Slit separation d and slit width a.' },
        { sel:'#wavelength-group', mode:'hide', title:'Wavelength', text:'Sets the photon wavelength \u03bb \u2014 colors follow it.' },
        { sel:'#dist-box',      mode:'hide', title:'Screen distance', text:'Distance L from the slits to the screen.' },
        { sel:'#animation-speed-group', mode:'hide', title:'Animation speed', text:'How fast waves expand and detections accumulate.' },
        { sel:'#slit-control-group', mode:'hide', title:'Slit control', text:'Opens or closes each slit \u2014 S1 and S2.' },
        { sel:'.detector-chart-panel', mode:'hide', title:'Detection chart', text:'Detected pattern beside the theoretical quantum curve.' },
        { sel:null, title:'That\u2019s every control', text:'Explore freely \u2014 reopen either guide from the top bar.' }
      ];
      const cel = sel => sel ? document.querySelector(sel) : null;
      function ensureUi(){
        if(callout) return;
        callout = document.createElement('div'); callout.className='cg-callout';
        callout.innerHTML = '<div class="cg-arrow"></div><h5></h5><p></p>';
        nav = document.createElement('div'); nav.className='cg-nav';
        nav.innerHTML = '<button id="cg-prev">\u2039</button><button id="cg-pgnext">\u203a</button><button id="cg-next">Next \u2192</button>';
        document.body.appendChild(callout); document.body.appendChild(nav);
        nav.querySelector('#cg-prev').addEventListener('click', ()=>cgShow(cgStep-1));
        nav.querySelector('#cg-pgnext').addEventListener('click', ()=>cgShow(cgStep+1));
        nav.querySelector('#cg-next').addEventListener('click', ()=>{ cgStep >= cgSteps.length-1 ? setCg(false) : cgShow(cgStep+1); });
        window.addEventListener('resize', positionCallout);
        window.addEventListener('scroll', positionCallout, true);
      }
      function positionCallout(){
        if(!cgOn || !callout) return;
        const st = cgSteps[cgStep], t = cel(st.sel), arrow = callout.querySelector('.cg-arrow');
        callout.classList.remove('arrow-top','arrow-bottom','arrow-left','arrow-right','no-arrow');
        const cw = callout.offsetWidth||260, ch = callout.offsetHeight||100;
        let x = innerWidth/2-cw/2, y = innerHeight/2-ch/2;
        if(!t){ callout.classList.add('no-arrow'); }
        else{
          if(t.scrollIntoView) t.scrollIntoView({ block:'nearest', inline:'nearest' });   // short viewports: bring the target on screen first
          const r = t.getBoundingClientRect();
          if(r.left > innerWidth*0.66){ x = r.left-cw-14; y = r.top+r.height/2-ch/2; callout.classList.add('arrow-right'); }
          else { x = r.left+r.width/2-cw/2; y = r.bottom+12;
            if(y+ch > innerHeight-8){ y = r.top-ch-12; callout.classList.add('arrow-bottom'); } else callout.classList.add('arrow-top'); }
          x = Math.max(8, Math.min(x, innerWidth-cw-8)); y = Math.max(8, Math.min(y, innerHeight-ch-8));
          if(arrow){
            if(callout.classList.contains('arrow-right')||callout.classList.contains('arrow-left')){ arrow.style.left=''; arrow.style.top = Math.max(10, Math.min(r.top+r.height/2-y-6, ch-22))+'px'; }
            else { arrow.style.top=''; arrow.style.left = Math.max(12, Math.min(r.left+r.width/2-x-6, cw-24))+'px'; }
          }
        }
        callout.style.left = Math.max(8, Math.min(x, innerWidth-cw-8))+'px';
        callout.style.top  = Math.max(8, Math.min(y, innerHeight-ch-8))+'px';
      }
      function cgShow(n){
        cgStep = Math.max(0, Math.min(n, cgSteps.length-1));
        cgMax = Math.max(cgMax, cgStep);
        const introduced = new Set(cgSteps.slice(0, cgMax+1).map(s=>s.sel));
        cgSteps.forEach(st=>{ [st.sel].concat(st.also||[]).forEach(sl=>{ const t=cel(sl); if(!t) return;
          t.classList.remove('cg-glow'); t.classList.toggle(st.mode==='hide'?'cg-hidden':'cg-veiled', !introduced.has(st.sel)); }); });
        const cur = cel(cgSteps[cgStep].sel); if(cur) cur.classList.add('cg-glow');
        callout.querySelector('h5').textContent = cgSteps[cgStep].title;
        callout.querySelector('p').textContent = cgSteps[cgStep].text;
        nav.querySelector('#cg-prev').disabled = cgStep<=0;
        nav.querySelector('#cg-pgnext').disabled = cgStep>=cgSteps.length-1;
        nav.querySelector('#cg-next').textContent = cgStep>=cgSteps.length-1 ? 'Done' : 'Next \u2192';
        positionCallout();
      }
      function setGi(on){
        root.classList.toggle('gi-off', !on);
        giBtn.classList.toggle('active', on);
        if(on){ if(cgOn) setCg(false, true); if(window.__giResume) window.__giResume(); }
        else  { if(window.__freeExplore) window.__freeExplore(); }
      }
      function setCg(on, keepGiState){
        cgOn = on;
        cgBtn.classList.toggle('active', on);
        if(on){
          if(!keepGiState) setGi(false);
          ensureUi();
          if(window.__cgReveals) window.__cgReveals(99);
          if(window.__cgPrepare) window.__cgPrepare();   // sims with scene/mode-dependent controls
          callout.style.display='block'; nav.style.display='flex';
          cgShow(cgStep);
        } else {
          if(callout){ callout.style.display='none'; nav.style.display='none'; }
          cgSteps.forEach(st=>[st.sel].concat(st.also||[]).forEach(sl=>{ const t=cel(sl); if(t) t.classList.remove('cg-hidden','cg-veiled','cg-glow'); }));
          if(keepGiState){ /* setGi(true) resumes */ } else if(window.__freeExplore) window.__freeExplore();
        }
      }
      window.__giOff = ()=> setGi(false);
      window.__setMode = mode => {           // welcome overlay entry points
        if(mode === 'controls') setCg(true);
        else if(mode === 'free') { if(cgOn) setCg(false); setGi(false); }
        else setGi(true);
      };
      /* Reset = the state of a fresh page load */
      const DEFAULTS = { 'slit-sep':1600, 'slit-width':490, 'wavelength':525, 'screen-dist':4000, 'rate':10 };
      window.__fullReset = ()=>{
        Object.keys(DEFAULTS).forEach(id=>{ const el=$(id); if(el && parseFloat(el.value)!==DEFAULTS[id]){ el.value=DEFAULTS[id]; el.dispatchEvent(new Event('input',{bubbles:true})); } });
        setSlit2(true); if(!slit1Open()){ const b=$('slit1-toggle'); if(wired(b)) b.click(); }
        setClassical(false);
        if(cgOn) setCg(false, true);
        cgStep = 0; cgMax = 0;
        setGi(true);
        inqShow(0);
        setPaused(false);                       // the sim's first-load state is running
      };
      giBtn.addEventListener('click', ()=> setGi(!giBtn.classList.contains('active')));
      cgBtn.addEventListener('click', ()=> setCg(!cgOn));
      $('reset-btn').addEventListener('click', ()=>{ setTimeout(()=>{ if(window.__fullReset) window.__fullReset(); }, 0); });
```

## 4. L-series shell variant (Guided Inquiry present, shell API)

Buttons in the header's left cluster (GI boots active):

```html
      <button id="btn-gi" class="shell-btn active" title="Show or hide the guided inquiry">Guided Inquiry</button>
      <button id="btn-cg" class="shell-btn" title="Show or hide the simulation guide">Simulation guide</button>
```

Hooks published by the sim script (inside its scope):

```js
  window.__cgReveals = applyStepReveals; // controls-guide hook: lift/restore inquiry-step reveals
  // Free exploration = the post-completion state: everything revealed, no
  // inquiry leftovers (ghost, inner zoom). Applied when GI is turned off.
  window.__freeExplore = function(){
    applyStepReveals(99);
    state.ghostActive = false;
    if(state.view !== 'outer') setView('outer');
    render(0);
  };
  // Re-entering the inquiry restores its own step state (reveals, view, pause).
  window.__giResume = function(){
    onStep((typeof Shell !== 'undefined' && Shell.step) || 0);
  };
```

Mutual exclusion + handover:

```js
    function setGi(on){
      root.classList.toggle('gi-off', !on);
      giBtn.classList.toggle('active', on);
      if(on){
        if(cgOn) setCg(false, true);
        // Show the cards directly — clear any lingering collapsed state
        if(typeof Shell !== 'undefined' && Shell.setInquiryCollapsed) Shell.setInquiryCollapsed(false);
        // Restore the inquiry's own step state (reveals, view, pause-on-gate)
        if(window.__giResume) window.__giResume();
      } else {
        // Turning the inquiry off = free exploration: the completed state,
        // never a mid-inquiry snapshot.
        if(window.__freeExplore) window.__freeExplore();
      }
    }
    function setCg(on, keepGiState){
      cgOn = on;
      cgBtn.classList.toggle('active', on);
      if(on){
        if(!keepGiState) setGi(false);           // mutual exclusion
        ensureUi();
        // Controls guide needs everything visible: lift inquiry-step reveals
        if(window.__cgReveals) window.__cgReveals(99);
        if(window.__cgPrepare) window.__cgPrepare();   // sims with scene/mode-dependent controls
        callout.style.display = 'block'; nav.style.display = 'flex';
        show(cgStep);
      } else {
        if(callout){ callout.style.display = 'none'; nav.style.display = 'none'; }
        steps.forEach(st => [st.sel].concat(st.also || []).forEach(sl => {
          const t = el(sl); if(t) t.classList.remove('cg-hidden','cg-veiled','cg-glow');
        }));
        // Hand over: to the inquiry's step state if GI takes over, otherwise
        // to free exploration (both-off, or guide completed/toggled off).
        if(keepGiState){ /* setGi(true) runs __giResume right after */ }
        else if(window.__freeExplore) window.__freeExplore();
      }
    }
```

Single-owner routing + Reset = first-load (`Shell.inqShow` / `Shell.step`
exposed on the shell):

```js
    window.__giOff = ()=> setGi(false);   // shell's Skip/Finish route here
    window.__setMode = mode => {           // welcome overlay entry points
      if(mode === 'controls') setCg(true);
      else if(mode === 'free') { if(cgOn) setCg(false); setGi(false); }
      else setGi(true);
    };
    // Reset = the state of a fresh page load: Guided Inquiry on at card 1,
    // Controls Guide off with its session progress cleared.
    window.__fullReset = ()=>{
      if(cgOn) setCg(false, true);        // silent CG off (GI takes over next)
      cgStep = 0; cgMax = 0;              // guide progress like a fresh load
      setGi(true);
      if(typeof Shell !== 'undefined' && Shell.inqShow) Shell.inqShow(0);
    };
```

Finish routes through the Guided Inquiry button (Skip likewise); delete the
Lecture button, `setLectureMode`, and the restore strip:

```js
  function inqNext(){
    const cards=inqCards();
    if(inqStep>=cards.length-1){ if(window.__giOff) window.__giOff(); else setInquiryCollapsed(true); }
    else inqShow(inqStep+1);
  }
```

## 4b. `window.__cgPrepare` — controls that exist only in some scene/mode

Publish from the sim a hook that pins a scene where EVERY guided target is
present; the controller calls it on guide entry. Found on Newton's laws,
whose completed inquiry ends in scene ③ where the F and m sliders are hidden:

```js
window.__cgPrepare = function(){ applyInquiryScene({ scene:2, mode:'newton', F:4, m:1, playing:true }); };
```

## 5. Verification

`node scripts/verify.js <patched.html> --baseline <original.html>` then the
real-browser gate `node ../tests/browser-smoke.js …` (SKILL.md §4).

## 6. Card voiceover + Auto walkthrough (validated on C025 projectile)

Adds narration to BOTH flows: a **Listen row** (circular play/pause + Auto
pill) above the Guided Inquiry pager, and a **two-row nav** in the Controls
Guide (Listen row with ⏮ ▶ ⏭ transport + Auto above the card-nav row, split
by a hairline). One shared engine drives both. Apply AFTER §1–4. All changes
are additive except the nav `innerHTML` (replaced by the two-row version) and
the small controller deltas in §6.4.

Behaviour contract (validated — do not change):
- Play reads the CURRENT card from the top; pause keeps the (line, char)
  position; resume continues from it; when a card finishes, the button flips
  to a replay state and the next press reads the same card from the top.
- A card CHANGE re-syncs: narration playing → it continues on the new card;
  idle → the position silently re-arms. All navigation routes stay in sync
  (pager, Next, transport ⏮ ⏭, Auto).
- **Auto (Controls Guide)**: narrate step → 700 ms dwell → advance → repeat;
  turns itself off on the closing card (guide stays open at Done).
- **Auto (Guided Inquiry) NEVER answers for the student**: it reads a gated
  predict card and goes quiet; when the student commits, it reads the
  feedback aloud (`playLines`), then advances via `#inq-next` — never the
  pager, which would bypass gating — retrying while Next is still locked.
  Turns itself off on the last card (never presses Finish).
- Hard stops (voice + Auto): guide/inquiry closed, mutual-exclusion switch,
  Reset (`__fullReset`), engine declared dead.
- Auto pill states must be unmistakable: muted outline off, solid accent
  fill + glow on.

### 6.1 CSS — append AFTER the sim's existing `.cg-nav` rules

Anchor precisely: this block overrides `.cg-nav` at equal specificity, so it
must come LATER in the cascade than the base `.cg-nav{…align-items:center}`
rules — append to the end of the `<style>` block that contains them (some
builds keep template CSS in a second or third style block, not the first).
Appending to an earlier block silently loses the two-row layout.

ADAPT: only the `--accent` / `--accent-soft` / `--ctrl-border` / `--ink-mute`
var names if the sim differs (C-series sims share these), and the
27px `#inq-voice`/`#inq-auto` height — it MUST equal the sim's existing
pager-button height so the sidebar row does not grow. Measure the computed
height of `#inq-prev` (padding + border + line-height under border-box —
the standard C-series shell, 13px font / line-height 1 / 6px padding / 1px
border, computes to exactly 27px without needing a browser); if
it differs from 27px, change all six values together: `#inq-voice`
width/height/min-width/max-height and `#inq-auto` height/max-height.

```css
/* ===== Card voiceover (controls guide + guided inquiry) ===== */
/* Two-row layout: a "Listen" narration row (transport + Auto) above the
   card-navigation row, separated by a hairline — audio is secondary, the
   Next progression stays the anchor action. */
.cg-nav{flex-direction:column;align-items:stretch;gap:7px;}
.cg-nav-row{display:flex;align-items:center;gap:8px;}
.cg-row-nav{border-top:1px solid rgba(139,92,246,.28);padding-top:7px;}
html[data-theme="light"] .cg-row-nav, body.light-theme .cg-row-nav{border-top-color:rgba(124,58,237,.22);}
.cg-flex{flex:1;}
.cg-listen-lab{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b93a7;margin-right:2px;}
html[data-theme="light"] .cg-listen-lab, body.light-theme .cg-listen-lab{color:#64748b;}
.cg-nav .cg-voice{width:26px;height:26px;min-width:26px;padding:0;border:none !important;background:transparent;
  border-radius:50%;display:grid;place-items:center;color:#a78bfa;}
.cg-nav .cg-voice:hover:not(:disabled){background:rgba(139,92,246,.22);color:#e2e8f0;}
.cg-nav .cg-voice svg{width:12px;height:12px;fill:currentColor;stroke:none;}
.cg-nav #cg-voice-play{width:30px;height:30px;min-width:30px;border:1px solid #8b5cf6 !important;}
.cg-nav #cg-voice-play[data-vstate="playing"]{background:#8b5cf6;color:#fff;}
.cg-nav #cg-voice-play svg{width:13px;height:13px;}
.cg-nav .cg-sep{width:1px;height:20px;background:rgba(139,92,246,.4);margin:0 4px;flex-shrink:0;}
html[data-theme="light"] .cg-nav .cg-voice, body.light-theme .cg-nav .cg-voice{color:#7c3aed;}
html[data-theme="light"] .cg-nav #cg-voice-play, body.light-theme .cg-nav #cg-voice-play{border-color:#7c3aed !important;}
html[data-theme="light"] .cg-nav #cg-voice-play[data-vstate="playing"], body.light-theme .cg-nav #cg-voice-play[data-vstate="playing"]{background:#7c3aed;color:#fff;}
html[data-theme="light"] .cg-nav .cg-sep, body.light-theme .cg-nav .cg-sep{background:rgba(124,58,237,.35);}
.cg-nav #cg-auto{height:22px;min-width:0;padding:0 9px;border-radius:999px;font-size:0.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  background:transparent;border:1px solid rgba(139,146,167,.45);color:#8b93a7;display:inline-flex;align-items:center;transition:background .15s,color .15s,border-color .15s,box-shadow .15s;}
.cg-nav #cg-auto:hover:not(.active){border-color:#8b5cf6;color:#a78bfa;}
.cg-nav #cg-auto.active{background:#8b5cf6;border-color:#8b5cf6;color:#fff;box-shadow:0 0 10px rgba(139,92,246,.55);}
html[data-theme="light"] .cg-nav #cg-auto, body.light-theme .cg-nav #cg-auto{border-color:rgba(100,116,139,.5);color:#64748b;}
html[data-theme="light"] .cg-nav #cg-auto:hover:not(.active), body.light-theme .cg-nav #cg-auto:hover:not(.active){border-color:#7c3aed;color:#7c3aed;}
html[data-theme="light"] .cg-nav #cg-auto.active, body.light-theme .cg-nav #cg-auto.active{background:#7c3aed;border-color:#7c3aed;color:#fff;box-shadow:0 0 10px rgba(124,58,237,.4);}
#inq-auto{height:27px;max-height:27px;min-width:0;padding:0 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;box-sizing:border-box;
  border-color:var(--ctrl-border);color:var(--ink-mute);transition:background .15s,color .15s,border-color .15s,box-shadow .15s;}
#inq-auto:hover:not(.active){border-color:var(--accent-soft);color:var(--accent);}
#inq-auto.active{background:var(--accent) !important;border-color:var(--accent) !important;color:#06231c !important;box-shadow:0 0 10px rgba(59,155,143,.45);}
body.light-theme #inq-auto.active, html[data-theme="light"] #inq-auto.active{color:#fff !important;}
.inq-listen{display:flex;align-items:center;gap:8px;margin:10px 0 0;}
.inq-listen-lab{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-mute);margin-right:2px;}
#inq-voice{width:27px;height:27px;min-width:27px;max-height:27px;padding:0;border-radius:50%;justify-content:center;display:inline-flex;align-items:center;box-sizing:border-box;}
#inq-voice svg{width:12px;height:12px;fill:currentColor;stroke:none;}
[data-vstate] svg.i-play,[data-vstate] svg.i-pause,[data-vstate] svg.i-again{display:none;}
[data-vstate="idle"] svg.i-play{display:block;}
[data-vstate="playing"] svg.i-pause{display:block;}
[data-vstate="done"] svg.i-again{display:block;}
```

### 6.2 Guided Inquiry markup — Listen row inserted ABOVE `.inq-nav`

Anchor: inside the inquiry aside, immediately AFTER the closing `</div>` of
the `#inq-cards` container and immediately BEFORE the `<div class="inq-nav">`
line. Nothing moves into `.inq-pager`; the pager keeps its original two
buttons.

```html
      <div class="inq-listen">
        <span class="inq-listen-lab">Listen</span>
        <button id="inq-voice" class="shell-btn primary inq-pager-btn" data-vstate="idle" title="Read this card aloud" aria-label="Read this card aloud">
          <svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>
          <svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          <svg class="i-again" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.3 4h2.2A5 5 0 1 0 12 7v3l-4-4 4-4z"/></svg>
        </button>
        <button id="inq-auto" class="shell-btn primary inq-pager-btn" title="Auto walkthrough — narrates each card and moves on; waits for your answers" aria-label="Auto walkthrough">Auto</button>
      </div>
```

### 6.3 The engine `<script>` — insert BEFORE the two-button controller script

Verbatim, including the GI voice wiring, Auto, and both MutationObservers.
ADAPT only the `norm()` speech replacements. The general symbol/punctuation
rules (θ, °, −, ×, ·, —, ≈, subscript digits, whitespace collapse) are the
FLOOR — keep them. The sim-specific token rules (`v₀`, `\bvx\b`, `m/s`, …)
are EXAMPLES — replace them with rules for the tokens that actually occur in
the target sim's card text (Φ, ε, λ, ω, primes, units…), and delete the ones
that don't apply. Everything else in the engine is load-bearing Chrome
defense (see §6.5).

```html
<script>
/* ===== Card voiceover engine (speech synthesis) =====
   Shared by the Controls Guide transport and the Guided Inquiry play button.
   Semantics per card: play = read from the top; pause keeps the (line, char)
   position; resume continues from it; finishing flips the button to the
   replay state and the next press reads the same card from the beginning.
   A card CHANGE re-syncs: playing → the new card starts speaking; idle →
   the position just resets so the next play starts at the new card's top. */
(function(){
  const synth = window.speechSynthesis;
  // Physics-notation → speakable text (textContent flattens <sub>y</sub> into "vy" etc.)
  const norm = s => s
    .replace(/v₀|\bv0\b/g,'v zero').replace(/vₓ₀|\bvx0\b/g,'v x zero').replace(/\bvy0\b/g,'v y zero')
    .replace(/\bvx\b/g,'v x').replace(/\bvy\b/g,'v y').replace(/\bay\b/g,'a y').replace(/\bax\b/g,'a x')
    .replace(/θ/g,'theta').replace(/₀/g,' zero').replace(/ₓ/g,' x')
    .replace(/°/g,' degrees').replace(/−/g,' minus ').replace(/×/g,' times ').replace(/≈/g,' approximately ')
    .replace(/·/g,' ').replace(/—/g,', ').replace(/\bm\/s\b/g,'meters per second')
    .replace(/\s+/g,' ').trim();
  // Quality-ranked: Chrome's remote Google voices sound natural; macOS's local
  // compact voices (Samantha/Daniel/Fred…) are the mechanical ones — last resort.
  // Remote voices can silently hang (no start/end/error events); when the
  // watchdog catches that, preferLocal flips and the session falls back.
  let preferLocal = false;
  let engineDead = false;   // set when even the local-voice fallback won't start — stop retry storms
  // Cancelling an idle engine is what wedges Chrome's TTS service — guard it.
  function safeCancel(){ if(synth && (synth.speaking || synth.pending)) synth.cancel(); }
  function pickVoice(){
    const vs = synth ? synth.getVoices() : [];
    const en = vs.filter(v => /^en/i.test(v.lang));
    const remote = [en.find(v => v.name === 'Google US English'),
                    en.find(v => v.name === 'Google UK English Female'),
                    en.find(v => v.name === 'Google UK English Male')].filter(Boolean);
    const local  = [en.find(v => /Natural|Enhanced|Premium|Neural/i.test(v.name) && v.localService),
                    en.find(v => v.name === 'Samantha'),
                    en.find(v => v.localService && /US|GB/i.test(v.lang))].filter(Boolean);
    const order = preferLocal ? local.concat(remote) : remote.concat(local);
    return order[0] || en[0] || null;
  }
  // btn: the play/pause button (uses data-vstate idle|playing|done).
  // getLines: () => array of raw strings for the CURRENT card.
  // opts.onCardDone: called when a card's narration completes (drives Auto mode).
  function makeCardVoice(btn, getLines, opts){
    let lines = [], idx = 0, charAt = 0, playing = false, current = null, done = false, lineRetries = 0;
    function state(){
      btn.dataset.vstate = playing ? 'playing' : (done ? 'done' : 'idle');
      btn.title = playing ? 'Pause' : (done ? 'Play again' : (idx === 0 && charAt === 0 ? 'Read this card aloud' : 'Resume'));
      btn.setAttribute('aria-label', btn.title);
    }
    function speak(){
      if(!synth) return;
      const text = lines[idx].slice(charAt);
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice(); if(v) u.voice = v;
      u.rate = 1.0; u.pitch = 1;
      const base = charAt, my = idx;
      let started = false;
      u.onstart = () => { started = true; };
      u.onboundary = e => { if(current === u && typeof e.charIndex === 'number'){ charAt = base + e.charIndex; lineRetries = 0; } };
      u.onerror = () => {   // cold-start hiccup on remote voices: retry the line once or twice
        if(current === u && playing && lineRetries < 2){
          lineRetries++;
          setTimeout(() => { if(current === u && playing) speak(); }, 250);
        }
      };
      u.onend = () => {
        if(current !== u || !playing) return;
        if(my < lines.length - 1){ idx = my + 1; charAt = 0; lineRetries = 0; speak(); }
        else {
          playing = false; done = true; idx = 0; charAt = 0; lineRetries = 0; current = null; state();
          if(opts && opts.onCardDone) opts.onCardDone();
        }
      };
      current = u; done = false;
      // Chrome swallows a speak() issued in the same tick as cancel() — defer it;
      // resume() unsticks the engine when cancel() left it internally paused.
      safeCancel();
      setTimeout(() => { if(current === u && playing){ synth.speak(u); if(synth.paused) synth.resume(); } }, 60);
      // Watchdog: a remote voice can hang with NO events at all. Retry once,
      // then flip the whole session to a local voice and retry again.
      setTimeout(() => {
        if(current !== u || !playing || started) return;
        safeCancel();
        if(lineRetries < 1){ lineRetries++; speak(); }
        else if(!preferLocal){ preferLocal = true; lineRetries = 0; speak(); }
        else {   // even local voices won't start: the browser's TTS service is hung
          engineDead = true; playing = false; current = null; state();
          btn.title = 'Voice unavailable — restart the browser to re-enable narration';
          btn.setAttribute('aria-label', btn.title);
        }
      }, 1500);
      state();
    }
    function play(){
      if(!synth || engineDead) return;
      if(done || !lines.length){ lines = getLines().map(norm).filter(Boolean); idx = 0; charAt = 0; }
      if(!lines.length) return;
      playing = true; lineRetries = 0; speak();
    }
    function pause(){
      playing = false;
      safeCancel();                  // stop now; idx/charAt keep the resume position
      current = null; state();
    }
    function stop(){                  // hard reset (zone hidden, guide closed, Reset)
      playing = false; done = false; lines = []; idx = 0; charAt = 0;
      safeCancel();
      current = null; state();
    }
    function sync(){                  // the current card changed
      const was = playing;
      playing = false;
      safeCancel();
      current = null;
      lines = getLines().map(norm).filter(Boolean); idx = 0; charAt = 0; done = false;
      if(was && lines.length){ playing = true; speak(); } else state();
    }
    function restart(){               // read the current card again from the top
      idx = 0; charAt = 0; done = false;
      if(playing) speak(); else state();
    }
    function playLines(arr){          // one-off narration (e.g. a just-revealed feedback box)
      lines = arr.map(norm).filter(Boolean);
      if(!lines.length) return;
      idx = 0; charAt = 0; done = false; playing = true; lineRetries = 0; speak();
    }
    btn.addEventListener('click', () => playing ? pause() : play());
    if(!synth) btn.disabled = true;
    state();
    return { sync, stop, restart, play, playLines, atStart: () => idx === 0 && charAt === 0 && !playing };
  }
  window.__makeCardVoice = makeCardVoice;

  /* ---- Guided Inquiry voice: play/pause + Auto in the pager row ----
     Auto walks the whole inquiry hands-free BUT never answers for the student:
     at a gated predict card it reads the question and waits; when the student
     commits, it reads the feedback aloud, then moves on. */
  const giBtn = document.getElementById('inq-voice');
  if(giBtn){
    const activeCard = () => document.querySelector('#inq-cards .inq-step.active');
    const giAutoBtn = document.getElementById('inq-auto');
    let giAuto = false;
    function setGiAuto(on){
      giAuto = on;
      if(giAutoBtn) giAutoBtn.classList.toggle('active', on);
      if(on) giVoice.play();
    }
    const giVoice = makeCardVoice(giBtn, () => {
      const card = activeCard();
      if(!card) return [];
      const out = [];
      const h = card.querySelector('h4'); if(h) out.push(h.textContent);
      card.querySelectorAll('p, button.choice, .predict-eval').forEach(el => {
        if(el.classList.contains('predict-eval') && getComputedStyle(el).display === 'none') return;
        const t = el.textContent.trim(); if(t) out.push(t);
      });
      return out;
    }, { onCardDone: () => {
      if(!giAuto) return;
      const card = activeCard();
      if(!card) return;
      if(card.hasAttribute('data-gate') && !card.hasAttribute('data-answered')) return;  // wait for the student
      const next = document.getElementById('inq-next');
      if(!next || next.textContent === 'Finish'){ setGiAuto(false); return; }            // tour ends on the last card
      const tryAdvance = () => {
        if(!giAuto) return;
        if(next.disabled){ setTimeout(tryAdvance, 300); return; }   // Next unlocks shortly after feedback
        next.click();
        setTimeout(() => { if(giAuto) giVoice.play(); }, 300);
      };
      setTimeout(tryAdvance, 900);
    }});
    if(giAutoBtn) giAutoBtn.addEventListener('click', () => setGiAuto(!giAuto));
    window.__giVoiceStop = () => { setGiAuto(false); giVoice.stop(); };
    const cardsEl = document.getElementById('inq-cards') || document.body;
    // Card changes (pager, Next, gates, Reset) re-sync the narration.
    let lastCard = activeCard();
    new MutationObserver(() => {
      const cur = activeCard();
      if(cur !== lastCard){
        lastCard = cur;
        if(document.documentElement.classList.contains('gi-off')){ setGiAuto(false); giVoice.stop(); }
        else giVoice.sync();
      }
    }).observe(cardsEl, { subtree: true, attributes: true, attributeFilter: ['class'] });
    // In Auto, an answered gate = read the feedback aloud, then onCardDone advances.
    new MutationObserver(muts => {
      if(!giAuto) return;
      for(const m of muts){
        if(m.attributeName === 'data-answered' && m.target.hasAttribute('data-answered')){
          const ev = m.target.querySelector('.predict-eval');
          const t = ev && ev.textContent.trim();
          setTimeout(() => { if(giAuto){ if(t) giVoice.playLines([t]); else giVoice.play(); } }, 600);
          return;
        }
      }
    }).observe(cardsEl, { subtree: true, attributes: true, attributeFilter: ['data-answered'] });
  }
})();
</script>
```

### 6.4 Controller deltas (inside the §3/§4 two-button template)

Identifier map: the snippets below use the §4 names. A §3-style controller
names the same things differently — translate consistently everywhere:
`steps` → `cgSteps`, `show()` → `cgShow()`, `position()` → `positionCallout()`.
Nothing else differs.

State + Auto setter beside the existing declarations:

```js
  let cgOn = false, cgStep = 0, cgMax = 0;
  let callout = null, nav = null, cgVoice = null, cgAuto = false;
  function setCgAuto(on){
    cgAuto = on;
    if(nav) nav.querySelector('#cg-auto').classList.toggle('active', on);
    if(on && cgVoice) cgVoice.play();
  }
```

`ensureUi()` — the two-row nav replaces the single-row `innerHTML`; voice
creation with the Auto `onCardDone`; transport + Auto listeners (the four
original listeners stay identical):

```js
    nav.innerHTML = '<div class="cg-nav-row cg-row-voice">'+
                      '<span class="cg-listen-lab">Listen</span>'+
                      '<button id="cg-rew" class="cg-voice" title="Restart narration" aria-label="Restart narration"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM19 5L9 12l10 7z"/></svg></button>'+
                      '<button id="cg-voice-play" class="cg-voice" data-vstate="idle" title="Read this step aloud" aria-label="Read this step aloud">'+
                        '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>'+
                        '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'+
                        '<svg class="i-again" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.3 4h2.2A5 5 0 1 0 12 7v3l-4-4 4-4z"/></svg>'+
                      '</button>'+
                      '<button id="cg-fwd" class="cg-voice" title="Next step" aria-label="Next step"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM5 5l10 7-10 7z"/></svg></button>'+
                      '<span class="cg-flex"></span>'+
                      '<button id="cg-auto" title="Auto walkthrough — narrates every step in sequence" aria-label="Auto walkthrough">Auto</button>'+
                    '</div>'+
                    '<div class="cg-nav-row cg-row-nav">'+
                      '<button id="cg-prev" aria-label="Previous">‹</button>'+
                      '<button id="cg-pgnext" aria-label="Next">›</button>'+
                      '<span class="cg-flex"></span>'+
                      '<button id="cg-next">Next →</button>'+
                    '</div>';
    document.body.appendChild(callout);
    document.body.appendChild(nav);
    // Voiceover: reads the current step's `say` (spoken prose, symbols in words)
    // when it has one, else its title + text; forward/rewind stay card-synced
    // (rewind restarts this step's narration, or steps back from its top).
    // Auto = hands-free tour: each step is narrated, then the guide advances itself.
    if(window.__makeCardVoice){
      cgVoice = window.__makeCardVoice(nav.querySelector('#cg-voice-play'),
        () => steps[cgStep].say ? [steps[cgStep].say] : [steps[cgStep].title, steps[cgStep].text],
        { onCardDone: () => {
            if(!cgAuto) return;
            if(cgStep >= steps.length-1){ setCgAuto(false); return; }   // tour ends on the closing card
            setTimeout(() => {
              if(!cgAuto) return;
              show(cgStep+1);
              setTimeout(() => { if(cgAuto && cgVoice) cgVoice.play(); }, 200);
            }, 700);
        }});
    }
    nav.querySelector('#cg-auto').addEventListener('click', ()=> setCgAuto(!cgAuto));
    nav.querySelector('#cg-rew').addEventListener('click', ()=>{
      if(cgVoice && !cgVoice.atStart()) cgVoice.restart();
      else show(cgStep-1);
    });
    nav.querySelector('#cg-fwd').addEventListener('click', ()=>show(cgStep+1));
    nav.querySelector('#cg-prev').addEventListener('click', ()=>show(cgStep-1));
    nav.querySelector('#cg-pgnext').addEventListener('click', ()=>show(cgStep+1));
```

`show()` tail — forward-disable + card sync:

```js
    nav.querySelector('#cg-prev').disabled   = cgStep <= 0;
    nav.querySelector('#cg-pgnext').disabled = cgStep >= steps.length-1;
    nav.querySelector('#cg-fwd').disabled    = cgStep >= steps.length-1;
    nav.querySelector('#cg-next').textContent = (cgStep >= steps.length-1) ? 'Done' : 'Next →';
    if(cgVoice) cgVoice.sync();   // narration follows the card: keeps speaking on change, else re-arms
    position();
  }
```

`setGi(off)` — stop the inquiry narration:

```js
      if(window.__giResume) window.__giResume();
    } else {
      if(window.__giVoiceStop) window.__giVoiceStop();
      // Turning the inquiry off = free exploration: the completed state,
      // never a mid-inquiry snapshot.
      if(window.__freeExplore) window.__freeExplore();
    }
```

`setCg(off)` — stop the guide narration + Auto:

```js
    } else {
      if(cgAuto) setCgAuto(false);
      if(cgVoice) cgVoice.stop();
      if(callout){ callout.style.display = 'none'; nav.style.display = 'none'; }
      steps.forEach(st => [st.sel].concat(st.also || []).forEach(sl => {
```

`__fullReset` — everything silent, Auto off, like first load:

```js
  // shell's own reset listener (setTimeout 0) so sim defaults land first.
  window.__fullReset = ()=>{
    if(cgAuto) setCgAuto(false);
    if(cgVoice) cgVoice.stop();
    if(window.__giVoiceStop) window.__giVoiceStop();
    if(cgOn) setCg(false, true);        // silent CG off (GI takes over next)
    cgStep = 0; cgMax = 0;              // guide progress like a fresh load
    setGi(true);
    if(typeof Shell !== 'undefined' && Shell.inqShow) Shell.inqShow(0);
  };
  giBtn.addEventListener('click', ()=> setGi(!giBtn.classList.contains('active')));
```

### 6.4b Sims with the `restartOnParamChange` click-watcher (e.g. C203)

Shells whose runtime restarts the run on any "parameter" click are already
compatible, for two reasons you must NOT break: the Listen-row ids keep the
`inq-` prefix (`#inq-voice`, `#inq-auto`) so `isShellOwned` exempts them, and
the guide nav/callout carry `data-no-reset` (checked via `closest()`, so the
two-row nav's children are covered). When applying §6 to such a sim, keep the
existing `nav.setAttribute('data-no-reset','')` / `callout.setAttribute(...)`
lines from its controller, and verify after: changing a slider, then using
every voice/Auto button, must NOT restart the run or reset parameters.

### 6.5 Voice pitfalls (every one observed on C025; the engine encodes the fixes)

- **Chrome swallows a `speak()` issued in the same tick as `cancel()`** — the
  engine defers the speak by 60 ms. Never call them back-to-back.
- **`cancel()` on an IDLE engine wedges Chrome's TTS service browser-wide**
  (survives page reload; only a full browser restart clears it). Every cancel
  routes through `safeCancel()`, which no-ops unless speaking/pending. Don't
  cancel-storm in tests either — that is what wedged it.
- **Remote Google voices can hang with NO events at all** (no start/end/error;
  `synth.speaking` stuck true). The `onstart` watchdog (1.5 s) retries once,
  flips `preferLocal` for the session, and finally declares `engineDead` with
  a "restart the browser" tooltip instead of retrying forever. Detect hangs
  by the missing `onstart`, never via `synth.speaking`.
- **`resume()` when not paused can hang macOS TTS** — only call it when
  `synth.paused` (the engine already guards this).
- **Cold-start utterance errors** on the first remote-voice line — `onerror`
  retries the line (≤2); the counter resets on boundary events / line advance.
- **Remote voices fire no boundary events** → pause/resume restarts the
  current line rather than resuming mid-line. Accepted trade-off.
- **Synthetic (scripted) clicks do not grant audio permission** — narration
  must be tested with real user gestures; scripted walkthroughs see
  `not-allowed` or silent zombies.
- **Voice ranking**: Google US English → Google UK Female → Google UK Male →
  any Natural/Enhanced/Premium/Neural local → Samantha → any English. Google
  voices are Chrome-only and network-fetched; other browsers/offline fall
  down the ranking (more mechanical — accepted). Apply the same ranking to
  the welcome overlay's `pickVoice` so both share one voice.
- The engine and the welcome player never fight: welcome speech is paused on
  mode selection before either flow can start narrating.
- **The GI Auto observer requires `data-answered` on committed cards.**
  L1/L2-style shells set it; sims with custom choice wiring may not
  (Galperin's didn't) — add `card.setAttribute('data-answered','')` in the
  commit handler as a one-line additive edit, or Auto will wait forever at
  answered gates.

## 7. Scene tour + spotlight engine (approved 2026-10-01; all 116 uni-lab sims)

The guide opens with 4–6 **scene steps** that spotlight regions of the
simulation window, then continues into the control steps unchanged. Scene
steps carry `spot:()=>rect` instead of `sel`; the engine draws `#cg-spot`
(a fixed-position box with the `.cg-glow` pulse) over the rect and aims the
callout at it. Every block is verbatim from shipped commits — Phase Plane
`7820a2b` (§3-style controller: `cgSteps`/`cel`/`positionCallout`/`cgShow`)
and L12-s2 Twin Paradox `971b0e7` + `160c76a` (§4 shell controller:
`steps`/`el`/`position`/`show`). Translate names consistently for your
controller; nothing else differs.

### 7.1 CSS — one rule, in the same `<style>` (after the welcome glass block)

```css
/* ===== Simulation guide: spotlight for canvas regions ===== */
#cg-spot{position:fixed;z-index:3990;pointer-events:none;display:none;border-radius:10px;}
```
(z 3990: under the callout/nav at 4000, over the sim. The glow comes from
the existing `.cg-glow` rule, toggled on the spot by `placeSpot()`.)

### 7.2 Engine hooks — five edits to the controller

(1) Create the spot with the callout, in `ensureUi()`:
```js
    if(!document.getElementById('cg-spot')){ const sp=document.createElement('div'); sp.id='cg-spot'; sp.setAttribute('data-no-reset',''); document.body.appendChild(sp); }
    callout = document.createElement('div'); callout.className='cg-callout';
```

(2) `placeSpot()` before the positioning function, called at its top; spot
steps target the spot:
```js
  function placeSpot(){
    const sp=document.getElementById('cg-spot'); if(!sp) return;
    const st=cgSteps[cgStep], r=(cgOn&&st&&st.spot)?st.spot():null;
    sp.classList.toggle('cg-glow', !!r); sp.style.display = r ? 'block' : 'none';
    if(r){ sp.style.left=r.left+'px'; sp.style.top=r.top+'px'; sp.style.width=r.width+'px'; sp.style.height=r.height+'px'; }
  }
  function positionCallout(){
    if(!cgOn || !callout) return;
    placeSpot();
    const st = cgSteps[cgStep], t = st.spot ? document.getElementById('cg-spot') : cel(st.sel), arrow = callout.querySelector('.cg-arrow');
```
Shell form (a spot getter may return null — then target nothing, so the
callout centres with no arrow):
```js
    placeSpot();
    const spEl = document.getElementById('cg-spot');
    const t = st.spot ? (spEl && spEl.style.display === 'block' ? spEl : null) : el(st.sel);
```

(3) `inside` placement — between the `if(!t)` branch and the arrow branch:
```js
    if(!t){ callout.classList.add('no-arrow'); }
    else if(st.inside){ const r=t.getBoundingClientRect(); callout.classList.add('no-arrow');
      const a = typeof st.inside === 'function' ? st.inside(cw, ch) : null;
      if(a){ x = a.x; y = a.y; }
      else { x = r.left+r.width/2-cw/2; y = st.inside==='top' ? r.top+18 : r.top+r.height/2-ch/2; } }
    else{
```
`inside:'center'` centres the callout in the region; `'top'` puts it 18px
below the region's top edge; a function `(cw,ch)=>({x,y})|null` returns an
empty patch you computed (null falls back to centre). The common clamp to the
viewport still runs after.

(4) The sel-glow path skips spot steps (in `cgShow`/`show`):
```js
    const cur = cgSteps[cgStep].spot ? null : cel(cgSteps[cgStep].sel); if(cur) cur.classList.add('cg-glow');
```
Spot steps have no `sel`, so the hide/veil loop leaves every control
hidden/veiled during the tour (nothing is "introduced" yet) — correct, and
the spot itself is never given `cg-hidden`/`cg-veiled`.

(5) Hide the spot when the guide closes (in `setCg(false…)`, after hiding
the callout/nav):
```js
      if(callout){ callout.style.display='none'; nav.style.display='none'; }
      placeSpot();
```

### 7.3 ResizeObserver — MANDATORY (in `ensureUi()`, after the window listeners)

The sidebar HIDE/OPEN tab (`#sb-hide-tab`) resizes the canvas without a
window `resize` event. Observe the canvas or stage element the spots are
measured from (several, if the spots span more than one):
```js
    const sc = document.getElementById('scene');
    if(sc && window.ResizeObserver) new ResizeObserver(()=>{ if(cgOn && cgSteps[cgStep].spot) positionCallout(); }).observe(sc);
```
Shell form — re-aim again next frame, once the sim has redrawn at the new size:
```js
    { // the sidebar HIDE/OPEN tab resizes the canvas with no window resize: re-aim a spot step (again next frame, once the sim has redrawn)
      const cgRe = () => { if(cgOn && steps[cgStep].spot){ position(); requestAnimationFrame(() => { if(cgOn && steps[cgStep].spot) position(); }); } };
      const sc = document.getElementById('mink');
      if(sc && window.ResizeObserver) new ResizeObserver(cgRe).observe(sc); }
```
If the sim refits on a debounced timer (e.g. 80 ms), add a second re-aim
after that delay.

### 7.4 Geometry — the sim's own, never pixels

Spot rects are built from the canvas's LIVE box plus the sim's own layout:
plot-area constants (`GEO.x0`, `getPlotArea()`), coordinate mappers, its 3D
camera, or DOM boxes (legends, readout overlays, `.plot-box`). If those live
inside the sim's closure, add ONE read-only hook next to the sim's other
`window.__…` hooks:
```js
  /* Simulation guide: read-only diagram geometry so the guide can spotlight
     canvas regions with the sim's own mappers. Changes nothing. */
  window.__cgGeo = function(){
    const s = uniScale(), vxMin = view.xMin - xOffset()/s;
    return { X, Y, M, xMin:vxMin, xMax:vxMin + plotW()/s, tMin:view.tMin, tMax:view.tMin + plotH()/s,
             ev:eventsS(), inF:eventInFrame, alice:aliceLine(), bella:bellaLine() };
  };
```
It may only READ existing values/functions — no state writes, no draw
calls, no timers. Return `null` when the geometry doesn't apply (another
view mode) so the step degrades to a centred callout. 3D: project the sim's
own objects through its own camera (`vector.project(camera)`) into the
canvas box.

### 7.5 Scene steps — the Phase Plane set (verbatim, §3-style controller)

Defined right after the `cgSteps` array, then prepended. (Prepend with
`cgSteps.unshift(...cgSceneSteps)` or `const steps = [ ...cgSceneSteps,` —
pick whichever anchor keeps your hunk away from lines other sessions edit.)
```js
const cgPlate = () => { const c=document.getElementById('scene'); if(!c||!GEO) return null; const b=c.getBoundingClientRect();
  return { l:b.left+GEO.x0-4, r:b.left+GEO.x1+4, t:b.top+GEO.uTop-4, b:b.top+GEO.pBot+4, c:b, g:GEO }; };
const cgRect = (l,t,r,b) => ({ left:l, top:t, width:r-l, height:b-t });
const cgSceneSteps = [
  { spot:()=>{ const p=cgPlate(); return p && cgRect(p.l,p.t,p.r,p.b); }, inside:'center', title:'The simulation window',
    text:'One particle, shown two ways. Both panels share the same x axis, so they always line up.',
    say:'Before the controls, let’s look at the simulation window itself. It shows one particle in two linked views. Both panels share the same x axis, so anything in the lower panel sits directly under its spot on the curve above.' },
  { spot:()=>{ const p=cgPlate(); return p && cgRect(p.l,p.t,p.r,p.c.top+p.g.uBot+4); }, title:'Top: the potential U(x)',
    text:'The energy landscape the particle moves through. Here it’s the double well: two valleys split by a hump.',
    say:'The top panel is the potential energy, U of x — the landscape the particle moves through. Right now it’s the double well: two valleys, separated by a hump in the middle.' },
  { spot:()=>{ const p=cgPlate(); return p && cgRect(p.l,p.c.top+p.g.pTop-4,p.r,p.b); }, inside:'top', title:'Bottom: the phase plane',
    text:'Position x across, momentum p up. A single point here is the particle’s whole state — click to place one.',
    say:'The bottom panel is the phase plane. Position runs across, momentum runs up. A single point here captures the particle’s entire state — where it is, and how fast it’s moving. Click anywhere in it to place one, and press Play to set it going.' },
  { spot:()=>{ const p=cgPlate(); return p && cgRect(p.l,p.c.top+p.g.pTop-4,p.r,p.b); }, inside:'top', title:'The faint curves',
    text:'Each grey curve is a path of constant energy H — a point you place rides along one. The orange one is special: the separatrix.',
    say:'Those faint grey curves are paths of constant energy, H. A point you place will ride along one of them. The orange curve is a special one, called the separatrix — keep an eye on it.' },
  { spot:()=>{ const l=document.getElementById('scene-legend'); if(!l) return null; const r=l.getBoundingClientRect(); return r.width ? cgRect(r.left-6,r.top-4,r.right+6,r.bottom+4) : null; }, title:'The colour key',
    text:'Names every line on the canvas. New entries appear as you place points and switch overlays on.',
    say:'Finally, the colour key in the corner names every line on the canvas. New entries appear as you place points and switch the overlays on. Now, let’s meet the controls.' }
];
cgSteps.unshift(...cgSceneSteps);
```
(This guide's `__cgPrepare` switches to the double well on open — that is
why step 2 may say "Here it's the double well". Write to YOUR guide's
opening state.)

### 7.6 Scene steps — patterns from the shell controllers

`inside` as a function that parks the callout in an empty corner of the
diagram, falling back when the window is short (Twin Paradox, verbatim):
```js
  const cgG = () => { const c = document.getElementById('cv'), g = window.__cgGeo && window.__cgGeo();
    if(!c || !g) return null; const b = c.getBoundingClientRect();
    const px = x => b.left + g.X(x), py = t => b.top + g.Y(t);
    return { g, b, px, py, L:px(g.xMin), R:px(g.xMax), T:py(g.tMax), B:py(g.tMin) }; };
  const cgRect = (l,t,r,b) => ({ left:l, top:t, width:r-l, height:b-t });
  const cgLowRight = (cw,ch) => { const q = cgG(); return q && { x:q.R - cw - 14, y:q.py(0) - ch - 18 }; };
  // above the reception badge, left of Alice; on a short window there is no room, so use the lower-right
  const cgUpLeft = (cw,ch) => { const q = cgG(); if(!q) return null; const er = q.g.inF(q.g.ev.ER), y = q.py(er.t) - ch - 34;
    return y < q.T + 4 ? cgLowRight(cw,ch) : { x:Math.max(q.L + 8, q.px(0) - cw - 34), y }; };
  // …a step:
    { spot:()=>{ const q = cgG(); if(!q) return null;
        const xs = q.g.alice.concat(q.g.bella).map(p => q.px(p.x));
        return cgRect(Math.max(q.L-4, Math.min(...xs)-16), q.T-4, Math.min(q.R+4, Math.max(...xs)+56), q.py(0)+12); }, inside:cgUpLeft,
      title:'Two worldlines',
      text:'Cyan: Alice, at rest at x = 0 — straight up. Amber: Bella, coasting away — tilted. The bright dots show where each twin is now.',
      say:'Each twin traces a worldline. Alice, in cyan, stays at x equals zero, so her line goes straight up. Bella, in amber, coasts away at constant speed, so her line tilts over. The bright dot on each line shows where that twin is right now.' },
```
Other placements that shipped: the empty sidebar column level with the spot
(sidebar open; beside the region when hidden); a grid scan of the canvas
scoring candidate boxes against markers, labels, the spot and the `.cg-nav`
box; the quadrant diagonally opposite a draggable marker.

State-adaptive text — `title`/`text`/`say` as getters (the callout reads
them through `.textContent`, the voice through the getter). Schematic below;
shipped examples: `QM_sims/wavefunctions-and-probability.html` (View Mode,
measurement count), `QM_sims/Vector_Space_Finite_Vectors_Updated.html`
(view + overlay toggles), `SR_sims/L11-s2-light-clock-…-shell.html`
(construction stage):
```js
  { spot:()=>topPlotRect(), get title(){ return viewMode()==='prob' ? 'Top: the prepared state' : 'Top: the wave'; },
    get text(){ return viewMode()==='prob' ? 'Purple curve: |ψ(x)|², …' : 'Blue curve: Re(ψ), …'; },
    get say(){ return viewMode()==='prob' ? 'The top plot shows …' : '…'; } },
```
Use getters whenever the student can change what the region shows (view
mode, frame, a layer toggle, a construction stage, data present or not) —
never switch the sim to match the text.

### 7.7 Header label

Markup (keep the element's spans/ids/classes):
```html
<button id="btn-cg" class="shell-btn" data-no-reset title="Show or hide the simulation guide">🎛 Simulation guide</button>
```
Header-wrap fix when the longer label wraps where the original didn't:
```css
.shell-header #btn-cg{padding-left:8px;padding-right:8px;}
```
Fallback used ONLY when another session holds uncommitted edits within 3
lines of the button markup (so a markup hunk would not apply to HEAD): set
the label from the guide script, right after `cgBtn` is looked up, and move
it into the markup once that session commits:
```js
  cgBtn.textContent = 'Simulation guide'; cgBtn.title = 'Show or hide the simulation guide';
```
(for a button with a `.btn-lbl` span, set that span's `textContent`).
