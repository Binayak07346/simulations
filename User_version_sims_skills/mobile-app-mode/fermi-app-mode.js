/* fermi-app-mode 0.1.0 (pilot, 2026-10-30) - the mobile-app view of a Fermi sim.
 *
 * INERT unless the page URL carries app=1. Desktop and mobile web never send it, so
 * for them this script returns on its first line and the page is exactly what is live.
 *
 * With app=1 (the Android player loads serve?...&app=1):
 *  - the sim's own top bar, HIDE tab and formal strip are hidden; the drawing fills the WebView;
 *  - the sidebar becomes a 300px drawer over the sim (phone) or a 340px docked panel
 *    (tablet, >= 900x560), with Guided Inquiry / Controls tabs;
 *  - Play, Reset and the top bar's own extra controls (Speed, mode buttons, Teach me) move
 *    to the top of the Controls tab;
 *  - read-outs float as a draggable chip; a Guided Inquiry pill opens the inquiry tab;
 *  - the Physics sheet opens full screen; a guide-tour step that points into the closed
 *    drawer opens it first.
 *
 * App <-> sim protocol (postMessage, JSON-able objects):
 *  app -> sim {source:"fermi-app", cmd:"hello"|"insets"|"play"|"pause"|"toggle-play"|"reset"|
 *              "panel"|"inquiry"|"guide"|"physics"|"back"|"state", ...}
 *              insets: {left,right,top,bottom} px kept clear for native rails
 *              panel:  {open?:bool, tab?:"controls"|"inquiry"}  (no open = toggle)
 *  sim -> app {source:"fermi-sim-app", type:"ready"|"state"|"back"|"touch", ...}
 *              ready: {caps:{play,reset,inquiry,guide,physics,controls}, title, family, playing}
 *              state: {playing, panelOpen, tab, docked}
 *              back:  {handled:bool}   (reply to cmd "back": false => app closes the player)
 *  Transport: an androidx WebMessageListener object window.FermiApp (postMessage(string),
 *  onmessage) when present; else window.parent (iframe hosts, the pilot harness).
 */
(function () {
  'use strict';
  var Qs = location.search, FORCE_ON = /[?&]app=1(?:&|$)/.test(Qs), FORCE_OFF = /[?&]app=0(?:&|$)/.test(Qs);
  var TOUCH = false; try { TOUCH = matchMedia('(pointer: coarse)').matches; } catch (e) {}
  if (FORCE_OFF || !(FORCE_ON || TOUCH)) return;                    // mouse / trackpad (desktop): nothing runs
  if (window.__fermiAppMode) return;
  var VER = window.__fermiAppMode = '1.1.1';
  var d = document, H = d.documentElement;
  function $(s, r) { try { return (r || d).querySelector(s); } catch (e) { return null; } }
  function $$(s, r) { try { return [].slice.call((r || d).querySelectorAll(s)); } catch (e) { return []; } }
  function first(list) { for (var i = 0; i < list.length; i++) { var e = $(list[i]); if (e) return e; } return null; }
  function shown(e) { if (!e) return false; var s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden'; }
  function txt(e) { return ((e && e.textContent) || '').replace(/\s+/g, ' ').trim(); }

  /* ---------- transport ---------- */
  function post(m) {
    m.source = 'fermi-sim-app'; m.v = VER;
    try { if (window.FermiApp && typeof window.FermiApp.postMessage === 'function') { window.FermiApp.postMessage(JSON.stringify(m)); return; } } catch (e) {}
    try { if (window.parent && window.parent !== window) window.parent.postMessage(m, '*'); } catch (e) {}
  }

  /* ---------- find the page's parts (two families) ---------- */
  /* A page with no viewport meta lays out 980px wide on a phone (zoomed out); app mode wants
     device width. Only the touch path gets here, so desktop is untouched. */
  if (!$('meta[name="viewport"]')) {
    var vm = d.createElement('meta'); vm.name = 'viewport'; vm.content = 'width=device-width,initial-scale=1';
    (d.head || H).appendChild(vm);
  }
  /* Explicit roles (v1.1): a sim of ANY structure opts in by marking its parts with data-fapp=
       "header"  the top bar (hidden; its visible controls move to the drawer's top card) - optional
       "panel"   the controls/sidebar that becomes the drawer (phone) / docked panel (tablet)
       "hero"    the drawing area that fills the screen
       "play" "reset" "guide" "physics" "inquiry-toggle"   the sim's own buttons for those actions
       "inquiry" the guided-inquiry block inside the panel (gets its own drawer tab)
       "readouts" a panel block to mirror in the floating read-out chip
       "skip"    a header control that must NOT move to the drawer
     Marked parts win over the automatic detection below; pages with no marks behave exactly as v1.0. */
  /* ...or, without touching the sim's markup, a role map of CSS selectors set before this script:
       window.__FAPP_ROLES = {header:'.topbar', panel:'#controls', hero:'#stage', play:'#go', ...}
     (app_mode.py --roles writes it as its own script, id fermi-app-mode-roles). A data-fapp mark wins over the map. */
  var RMAP = (window.__FAPP_ROLES && typeof window.__FAPP_ROLES === 'object') ? window.__FAPP_ROLES : {};
  var ROLES = !!$('[data-fapp]') || Object.keys(RMAP).length > 0;
  function role(r) { return $('[data-fapp="' + r + '"]') || (RMAP[r] ? $(RMAP[r]) : null); }
  var shell = $('#shell');
  var iqZone = role('inquiry') || first(['#aside-inquiry', '#inq-zone']);
  function bigCanvasIn(el) { return $$('canvas', el).filter(function (c) { var r = c.getBoundingClientRect(); return r.width * r.height > 0.35 * innerWidth * innerHeight; })[0] || null; }
  function labPanel() {
    return $$('aside.panel, aside#side, aside[class*="panel"]').filter(function (a) {
      var ps = getComputedStyle(a).position; return (ps === 'absolute' || ps === 'fixed') && shown(a) && a.parentElement && !!bigCanvasIn(a.parentElement);
    })[0] || null;
  }
  var panel = role('panel') || $('.shell-aside') || (iqZone && iqZone.parentElement) || first(['.sidebar', '.control-panel', '.right-col']) || labPanel();
  function vArea(e) { var r = e.getBoundingClientRect(); return Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); }
  /* The top bar: named (.shell-header / .top-bar) or, for sims that call it something else
     (.title-bar, .app-header, .upper-menu, a Tailwind <header>...), the bar that holds the
     Guided Inquiry / Physics buttons - the child of their common ancestor with the panel,
     accepted only when it is a strip across the top of the page. */
  function derivedHeader() {
    var a = first(['#btn-gi', '#toggle-formal', '#btn-cg', '#ask-euler']);
    if (!a || !panel || panel.contains(a)) return null;
    var c = a; while (c.parentElement && c.parentElement !== H && !c.parentElement.contains(panel)) c = c.parentElement;
    if (c === d.body || c.contains(panel)) return null;
    var r = c.getBoundingClientRect();
    return r.top <= 12 && r.height >= 24 && r.height <= 170 && r.width >= innerWidth * 0.5 ? c : null;
  }
  var header = role('header') || first(['.shell-header', '.top-bar', '.top-bar-app']) || derivedHeader();
  if (!header && ROLES && role('panel') && role('hero')) header = d.createElement('div');   /* a marked page may have no top bar */
  /* The drawing: the shell hero; the QM fixed #canvas-container; else (flow sims: a flex/grid
     row of drawing + sidebar) the panel's one big visual sibling, or the whole row when the
     drawing is split across several siblings. */
  var OVERLAY = /modal|overlay|backdrop|toast|tooltip|dialog|^gv-|ps-watch|welcome/i;
  function heroOf() {
    var h = $('.shell-hero'); if (h) return h;
    h = $('#canvas-container'); if (h && !panel.contains(h) && getComputedStyle(h).position === 'fixed') return h;
    var p = panel, min = innerWidth * innerHeight * 0.05;
    for (var lv = 0; lv < 3 && p.parentElement && p.parentElement !== H; lv++) {
      var row = p.parentElement;
      var c = [].filter.call(row.children, function (k) {
        if (k === p || /^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/.test(k.tagName)) return false;
        if (header && (k === header || k.contains(header))) return false;
        if (OVERLAY.test(k.id || '') || OVERLAY.test(typeof k.className === 'string' ? k.className : '') || k.getAttribute('role') === 'dialog') return false;
        return shown(k) && !!k.querySelector('canvas,svg,img,video,.js-plotly-plot') && vArea(k) >= min;
      });
      if (c.length === 1) return c[0];
      if (c.length > 1) return row === d.body ? c.sort(function (x, y) { return vArea(y) - vArea(x); })[0] : row;
      p = row;
    }
    return null;
  }
  /* stage family: no sidebar - the inquiry and control cards float over a full-bleed canvas
     inside the inquiry's own parent; the layer builds the drawer and moves those cards in. */
  var hero = role('hero'), FAM = null, floatCards = [];
  if (hero) FAM = (shell && hero.classList.contains('shell-hero')) ? 'shell' : 'fixed';
  if (!hero && !shell && iqZone && panel === iqZone.parentElement && panel !== d.body) {
    var stageCv = $$('canvas', panel).filter(function (c) { var r = c.getBoundingClientRect(); return r.width * r.height > 0.35 * innerWidth * innerHeight; })[0];
    if (stageCv) {
      floatCards = [].slice.call(panel.children).filter(function (k) {
        if (k === iqZone) return true;
        if (k.contains(stageCv) || !shown(k)) return false;
        var ps = getComputedStyle(k).position;
        return (ps === 'absolute' || ps === 'fixed') && !!k.querySelector('input,select,button');
      });
      hero = panel; FAM = 'stage';
      panel = d.createElement('div'); panel.className = 'fapp-cards';
    }
  }
  if (!hero && !shell && !iqZone && panel && panel.matches('aside') && bigCanvasIn(panel.parentElement)) { hero = panel.parentElement; FAM = 'stage'; }
  /* 3D shell variant (#shell.mm-3d-shell: fixed header, positioned #canvas-area or a .plot-area beside a
     .sidebar, no .shell-hero): laid out like the fixed family */
  var hero3d = (!hero && shell && !$('.shell-hero')) ? first(['#shell #canvas-area', '#shell .main-container > .plot-area']) : null;
  if (hero3d) { hero = hero3d; FAM = 'fixed'; }
  if (!hero) { var cc = $('#canvasContainer'); hero = (panel && heroOf()) || (cc && !panel.contains(cc) ? cc : null); }
  if (!header || !panel || !hero) { post({ type: 'ready', supported: false }); return; }
  FAM = FAM || (shell ? 'shell' : 'fixed');
  if (!shell || hero3d) hero.classList.add('fapp-hero');
  header.classList.add('fapp-hdr');

  /* Play / Reset: the known ids, else the top bar's own Play/Pause/Start and Reset buttons.
     A match must also read as that action (a class like .btn-topbar-reset sits on some sims'
     Start/Pause button), and Reset is never the Play button. */
  var PLAY_RE = /^[^a-z0-9]*(play|pause|start|resume|stop|run)\b/i, RESET_RE = /^[^a-z0-9]*reset\b/i;
  function known(sels, re, idre, not) {
    for (var i = 0; i < sels.length; i++) { var e = $(sels[i]); if (e && e !== not && (re.test(txt(e)) || idre.test(e.id || ''))) return e; }
    return null;
  }
  function barBtn(re, idre, not) {
    return $$('button', header).filter(function (e) {
      return e !== not && !/^(btn-gi|btn-cg|toggle-formal)$/.test(e.id) && shown(e) && (re.test(txt(e)) || idre.test(e.id || ''));
    })[0] || null;
  }
  var B = { inquiry: role('inquiry-toggle') || $('#btn-gi'), guide: role('guide') || $('#btn-cg'), physics: role('physics') || $('#toggle-formal'),
    /* v1.1.1: a tutor link that lives in the Physics sheet header (the one-line sheet head) stays there */
    tutor: (function () { var a = $('#ask-euler'); return a && !a.closest('#phys-backdrop, .phys-head') ? a : null; })() };
  B.play = role('play') || known(['#shell-play', '#playpause-btn', '#btnPlayPause', '#sim-play-pause', '#btnStart', '.btn-topbar-playpause', '#playBtn'], PLAY_RE, /play|pause|start/i) ||
    barBtn(PLAY_RE, /play|pause/i);
  B.reset = role('reset') || known(['#shell-reset', '#reset-btn', '#btnReset', '.btn-topbar-reset', '#resetBtn', '.shell-header #resetBtn'], RESET_RE, /reset/i, B.play) ||
    barBtn(RESET_RE, /reset/i, B.play);
  var TITLE = txt(first(['.shell-title', '.top-bar h1'])) || txt($('h1', header)) || d.title;

  /* The top bar's other controls (Speed, mode buttons, Hide Text...) - collected while the
     bar is still visible, so controls the sim keeps hidden stay out. */
  var SKIP = ['#btn-gi', '#btn-cg', '#toggle-formal', '#ask-euler', '#shell-maximize', '#shell-theme', '#fu-theme',
    '.theme-toggle-wrap', '#theme-checkbox', '.shell-title', '#shell-info-btn', '#sb-hide-tab', '[data-fapp="skip"]', '[data-fapp="guide"]', '[data-fapp="physics"]', '[data-fapp="inquiry-toggle"]',
    '[id*="theme" i]', '[class*="theme-toggle" i]'];
  function skipped(e) {
    if (e === B.play || e === B.reset || e === B.guide || e === B.physics || e === B.inquiry) return true;
    if (RMAP.skip) { try { if (e.matches(RMAP.skip) || e.closest(RMAP.skip)) return true; } catch (x) {} }
    for (var i = 0; i < SKIP.length; i++) { if (e.matches(SKIP[i]) || e.closest(SKIP[i])) return true; }
    return false;
  }
  var cands = $$('button,select,a,label,input', header).filter(function (e) { return !skipped(e) && shown(e) && e.getBoundingClientRect().width > 0; });
  var extras = cands.filter(function (e) { return !cands.some(function (o) { return o !== e && o.contains(e); }); });

  /* ---------- styles ---------- */
  var css = [
    ':root{--fapp-l:0px;--fapp-r:0px;--fapp-t:0px;--fapp-b:0px;--fapp-ink:#0f172a;--fapp-mute:#475569;--fapp-line:#b0c3dd;--fapp-bg:#eaf1fa;--fapp-acc:#4169e1;}',
    'html.fapp,html.fapp body{height:100%!important;overflow:hidden!important;overscroll-behavior:none;}',
    'html.fapp body{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
    'html.fapp #phys-backdrop,html.fapp #phys-backdrop *{-webkit-user-select:text;user-select:text;}',
    'html.fapp .shell-header,html.fapp .top-bar,html.fapp .fapp-hdr,html.fapp #sb-hide-tab,html.fapp .shell-formal,html.fapp #gv-hint{display:none!important;}',
    /* a sim's own narrow-screen sidebar toggle (fixed ☰) duplicates the drawer: hidden */
    'html.fapp .sidebar-toggle,html.fapp #sidebarToggle{display:none!important;}',
    'html.fapp .shell-hero canvas,html.fapp .fapp-hero canvas{touch-action:none;}',
    /* shell family: the hero takes the whole page */
    'html.fapp-shell #shell,html.fapp-shell #shell.hide-aside,html.fapp-shell #shell.shell-max{grid-template-areas:"hero"!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;height:100%!important;min-height:0!important;}',
    'html.fapp-shell .shell-hero{padding:8px calc(62px + var(--fapp-r)) calc(8px + var(--fapp-b)) calc(8px + var(--fapp-l))!important;}',
    'html.fapp-shell.fapp-docked.fapp-open .shell-hero{padding-right:8px!important;}',
    /* fixed family (QM sims: fixed #canvas-container, or a flex/grid row): the drawing fills the page */
    'html.fapp-fixed .fapp-hero{position:fixed!important;top:var(--fapp-t)!important;left:var(--fapp-l)!important;right:auto!important;bottom:auto!important;width:calc(100% - var(--fapp-l) - var(--fapp-r) - 58px)!important;height:calc(100% - var(--fapp-t) - var(--fapp-b))!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;margin:0!important;box-sizing:border-box!important;}',
    'html.fapp .fapp-panel{box-sizing:border-box!important;}',
    'html.fapp-fixed .fapp-hero-ctx{z-index:auto!important;}',
    'html.fapp .fapp-minh{min-height:0!important;}',
    'html.fapp .fapp-sbs{grid-template-columns:repeat(var(--fapp-n),minmax(0,1fr))!important;grid-template-rows:minmax(0,1fr)!important;grid-auto-rows:minmax(0,1fr)!important;flex:1 1 0%!important;min-height:0!important;max-height:100%!important;}',
    'html.fapp .fapp-sbs > *{min-height:0!important;min-width:0!important;}',
    '.fapp-quick .gbtn-lab,.fapp-quick .btn-lbl{display:inline!important;visibility:visible!important;}',
    'html.fapp .fapp-hdrp{grid-template-rows:minmax(0,1fr)!important;}',
    /* a sim's own welcome / mode-choice overlay: scrolls on a short phone, decorative banner dropped */
    'html.fapp:not(.fapp-docked) #welcome-overlay{overflow-y:auto!important;align-items:flex-start!important;padding:10px!important;}',
    'html.fapp:not(.fapp-docked) #welcome-overlay .welcome-hero{display:none!important;}',
    'html.fapp:not(.fapp-docked) #welcome-overlay .welcome-card{margin:0 auto!important;max-height:none!important;}',
    /* stage family: the stage keeps clear of the rail (phone) or the docked panel (tablet) */
    'html.fapp-stage .fapp-hero{margin:var(--fapp-t) calc(58px + var(--fapp-r)) var(--fapp-b) var(--fapp-l)!important;}',
    'html.fapp-native.fapp-stage .fapp-hero{margin-right:var(--fapp-r)!important;}',
    'html.fapp-stage.fapp-docked.fapp-open .fapp-hero{margin-right:340px!important;}',
    'html.fapp-stage.fapp-docked .fapp-panel{position:fixed!important;top:0!important;bottom:0!important;right:0!important;height:auto!important;z-index:4600!important;}',
    'html.fapp-stage .fapp-panel > *{flex:0 0 auto!important;min-height:auto!important;max-height:none!important;}',
    'html.fapp-stage .fapp-panel > .fapp-card{position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto!important;min-width:0!important;max-width:none!important;max-height:none!important;transform:none!important;margin:0!important;box-shadow:none!important;z-index:auto!important;overflow:visible!important;}',
    'html.fapp:not(.fapp-docked) .fapp-shrink{transform:scale(.62)!important;transform-origin:var(--fapp-so,right top)!important;}',
    'html.fapp .fapp-panel #sideCollapse,html.fapp .fapp-panel .sd-collapse{display:none!important;}',
    'html.fapp-ownbg .fapp-head{background:#eaf1fa!important;border-radius:16px 16px 0 0;}',
    'html.fapp-ownbg.fapp-docked .fapp-head{border-radius:0;}',
    'html.fapp-stage:not(.fapp-docked) .fapp-hero > .panel:not(.fapp-panel):not(.min){max-height:52%!important;overflow-y:auto!important;}',
    /* phone: the sidebar is a drawer over the sim */
    'html.fapp .fapp-panel{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;min-width:0!important;max-width:none!important;gap:12px!important;background:var(--fapp-bg)!important;color:var(--fapp-ink);overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}',
    'html.fapp:not(.fapp-docked) .fapp-panel{position:fixed!important;top:calc(8px + var(--fapp-t))!important;bottom:calc(8px + var(--fapp-b))!important;right:calc(66px + var(--fapp-r))!important;left:auto!important;width:min(300px,calc(100vw - 74px - var(--fapp-r) - var(--fapp-l)))!important;height:auto!important;max-height:none!important;min-height:0!important;margin:0!important;padding:0 12px 14px!important;z-index:4600!important;border:1px solid var(--fapp-line)!important;border-radius:16px!important;box-shadow:0 18px 48px rgba(15,23,42,.28)!important;backdrop-filter:none!important;transform:translateX(calc(100% + 32px + var(--fapp-r)));visibility:hidden;transition:transform .22s ease,visibility 0s linear .22s;}',
    'html.fapp.fapp-open:not(.fapp-docked) .fapp-panel{transform:none;visibility:visible;transition:transform .22s ease;}',
    'html.fapp.fapp-instant .fapp-panel{transition:none!important;}',
    /* tablet: docked 340px, collapsible */
    'html.fapp-docked .fapp-panel{width:340px!important;padding:0 14px 16px!important;border-left:1px solid var(--fapp-line)!important;box-shadow:none!important;}',
    'html.fapp-docked:not(.fapp-open) .fapp-panel{display:none!important;}',
    'html.fapp-shell.fapp-docked.fapp-open #shell{grid-template-areas:"hero aside"!important;grid-template-columns:minmax(0,1fr) 340px!important;}',
    'html.fapp-shell.fapp-docked .fapp-panel{position:relative!important;grid-area:aside!important;top:auto!important;right:auto!important;}',
    'html.fapp-fixed.fapp-docked .fapp-panel{position:fixed!important;top:0!important;bottom:0!important;right:0!important;height:auto!important;}',
    'html.fapp-fixed.fapp-docked.fapp-open .fapp-hero{width:calc(100% - var(--fapp-l) - 340px)!important;}',
    '.fapp-reopen{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:4500;display:none;border:1px solid var(--fapp-line);border-right:none;border-radius:10px 0 0 10px;background:#1a2461;color:#fff;font:600 12px/1 var(--font-sans,system-ui);padding:14px 8px;writing-mode:vertical-rl;letter-spacing:.08em;cursor:pointer;}',
    'html.fapp-docked:not(.fapp-open) .fapp-reopen{display:block;}',
    /* drawer head + tabs */
    '.fapp-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;margin:0 -12px;padding:10px 12px 8px;background:var(--fapp-bg);border-bottom:1px solid var(--fapp-line);flex-shrink:0;}',
    'html.fapp-docked .fapp-head{margin:0 -14px;padding:12px 14px 10px;}',
    '.fapp-tabs{display:flex;gap:4px;flex:1;min-width:0;background:#dde7f5;border-radius:10px;padding:3px;}',
    '.fapp-tabs button{flex:1;min-width:0;border:0;background:transparent;border-radius:8px;padding:8px 6px;font:600 13px/1.1 var(--font-sans,system-ui);color:var(--fapp-mute);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.fapp-tabs button[aria-selected="true"]{background:#fff;color:var(--fapp-ink);box-shadow:0 1px 2px rgba(15,23,42,.15);}',
    '.fapp-tabs.single button{cursor:default;text-align:left;background:transparent!important;box-shadow:none!important;color:var(--fapp-ink);font-size:14px;}',
    'html.fapp .fapp-panel .fapp-tabs button{width:auto!important;margin:0!important;}',
    'html.fapp .fapp-panel .fapp-x{flex:0 0 36px!important;width:36px!important;min-width:36px!important;margin:0!important;padding:0!important;}',
    '.fapp-x{flex-shrink:0;width:36px;height:36px;border:1px solid var(--fapp-line);border-radius:10px;background:#fff;color:var(--fapp-ink);font:400 20px/1 system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.fapp-panel[data-fapp-tab="controls"] > .fapp-iq,.fapp-panel[data-fapp-tab="inquiry"] > .fapp-ct{display:none!important;}',
    /* quick row: play/reset + the top bar\'s own controls */
    '.fapp-quick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;flex-shrink:0;padding:10px;background:#fff;border:1px solid var(--fapp-line);border-radius:10px;}',
    '.fapp-quick > *{margin:0!important;}',
    '.fapp-quick > button,.fapp-quick > a,.fapp-quick > select{height:34px!important;min-height:34px;max-width:100%;border-radius:8px!important;font:600 13px/1 var(--font-sans,system-ui)!important;padding:0 12px!important;display:inline-flex!important;align-items:center;justify-content:center;gap:5px;box-sizing:border-box!important;white-space:nowrap;}',
    '.fapp-quick > *{flex:1 1 100%;}',
    '.fapp-quick > .fapp-play,.fapp-quick > .fapp-reset,.fapp-quick > .fapp-half{flex:1 1 0;min-width:0;}',
    '.fapp-quick > .fapp-half{background:#fff!important;border:1px solid var(--fapp-line)!important;color:var(--fapp-ink)!important;font-size:12.5px!important;padding:0 8px!important;overflow:hidden;text-overflow:ellipsis;}',
    '.fapp-quick > .fapp-half.active{background:#e3eafb!important;border-color:var(--fapp-acc)!important;color:#2f55cc!important;}',
    /* in-page rail: Controls, Play/Pause, Reset (the app has no channel to drive the sim) */
    '.fapp-rail{position:fixed;z-index:4700;right:calc(8px + var(--fapp-r));top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;padding:8px 6px;background:rgba(11,22,64,.92);border-radius:26px;box-shadow:0 8px 24px rgba(15,23,42,.25);transition:opacity .3s;}',
    '.fapp-rail button{width:42px;height:42px;border:0;border-radius:21px;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}',
    '.fapp-rail button.on{background:var(--fapp-acc);}',
    '.fapp-rail button:disabled{opacity:.35;}',
    '.fapp-rail svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    'html.fapp-idle .fapp-rail{opacity:.35;}',
    'html.fapp-docked.fapp-open .fapp-rail,html.fapp-native .fapp-rail{display:none;}',
    'html.fapp-native.fapp-shell .shell-hero{padding-right:calc(8px + var(--fapp-r))!important;}',
    'html.fapp-native.fapp-fixed .fapp-hero{width:calc(100% - var(--fapp-l) - var(--fapp-r))!important;}',
    'html.fapp-native:not(.fapp-docked) .fapp-panel{right:calc(8px + var(--fapp-r))!important;width:min(300px,calc(100vw - 16px - var(--fapp-r) - var(--fapp-l)))!important;}',
    'html.fapp-native .fapp-pill{right:calc(12px + var(--fapp-r))!important;}',
    '.fapp-quick > label{flex:0 0 auto!important;}',
    '.fapp-quick > label + select{flex:1 1 0!important;}',
    '.fapp-quick > .fapp-play{background:var(--fapp-acc)!important;border:1px solid var(--fapp-acc)!important;color:#fff!important;}',
    '.fapp-quick > .fapp-reset{background:#fff!important;border:1px solid var(--fapp-line)!important;color:var(--fapp-ink)!important;}',
    '.fapp-quick > label{font:600 12px/1 var(--font-sans,system-ui);color:var(--fapp-mute)!important;display:inline-flex;align-items:center;gap:6px;}',
    '.fapp-quick > select{background:#fff!important;border:1px solid var(--fapp-line)!important;color:var(--fapp-ink)!important;}',
    '.fapp-quick > #ask-euler{flex:1 1 100%;gap:5px!important;text-decoration:none!important;}',
    '.fapp-quick > #ask-euler{background:#fff!important;border:1.5px solid var(--fapp-acc)!important;color:#2f55cc!important;opacity:1!important;}',
    '.fapp-quick > #ask-euler .ask-euler-label,.fapp-quick > #ask-euler .ask-euler-icon{display:inline!important;color:#2f55cc!important;opacity:1!important;}',
    'html.fapp .fapp-panel > *{flex-shrink:0!important;}',
    'html.fapp .fapp-panel > .fapp-ct,html.fapp .fapp-panel > .fapp-iq{position:relative!important;top:auto!important;bottom:auto!important;}',
    'html.fapp .fapp-panel #aside-controls,html.fapp .fapp-panel .aside-zone{min-height:auto!important;max-height:none!important;overflow:visible!important;height:auto!important;}',
    '.fapp-quick > .fapp-br{flex:0 0 100%!important;height:0;margin:0 0 -8px!important;}',
    '.fapp-quick > select{width:auto!important;min-width:0;padding:0 8px!important;}',
    'html.fapp #gv-card{width:min(380px,calc(100vw - 32px - var(--fapp-l) - var(--fapp-r)))!important;}',
    /* touch sizes inside the panel */
    'html.fapp .fapp-panel input[type=range]{box-sizing:content-box!important;height:6px!important;padding:11px 0!important;background-clip:content-box!important;touch-action:pan-y;}',
    'html.fapp .fapp-panel input[type=range]::-webkit-slider-thumb{width:24px!important;height:24px!important;}',
    'html.fapp .fapp-panel input[type=range]::-moz-range-thumb{width:24px!important;height:24px!important;}',
    'html.fapp .fapp-panel .choice{min-height:44px;}',
    /* physics sheet + info modal: full screen */
    'html.fapp #phys-backdrop{padding:0!important;align-items:stretch!important;justify-content:stretch!important;}',
    'html.fapp #phys-backdrop .phys-modal{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;margin:0!important;border-radius:0!important;}',
    'html.fapp .shell-modal-backdrop{padding:0!important;}html.fapp .shell-modal{max-width:none!important;max-height:none!important;height:100%!important;border-radius:0!important;}',
    /* floating read-outs + inquiry pill */
    '.fapp-float{position:fixed;z-index:4400;font-family:var(--font-sans,system-ui);touch-action:none;}',
    '.fapp-chip{left:calc(12px + var(--fapp-l));top:calc(12px + var(--fapp-t));max-width:min(260px,42vw);background:rgba(255,255,255,.94);border:1px solid var(--fapp-line);border-radius:12px;box-shadow:0 6px 20px rgba(15,23,42,.16);overflow:hidden;}',
    '.fapp-chip-h .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}',
    '.fapp-chip-h{display:flex;align-items:center;gap:6px;width:100%;border:0;background:transparent;padding:7px 10px;font:700 11px/1 var(--font-sans,system-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--fapp-mute);cursor:grab;}',
    '.fapp-chip-h .g{opacity:.5;letter-spacing:0;}.fapp-chip-h .c{margin-left:auto;transition:transform .15s;}',
    '.fapp-chip.min .fapp-chip-h .c{transform:rotate(-90deg);}.fapp-chip.min .fapp-chip-b{display:none;}',
    '.fapp-chip-b{padding:0 10px 8px;font-size:12px;max-height:40vh;overflow:auto;}',
    '.fapp-chip-b .stat-row{padding:3px 0!important;font-size:13px!important;gap:10px;}',
    '.fapp-chip-b .ctrl-box,.fapp-chip-b .ro-card,.fapp-chip-b .readout-card{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0 0 4px!important;border-radius:0!important;}',
    '.fapp-chip-b .ro-head{font-size:10px!important;margin:4px 0 1px!important;padding:0!important;}',
    '.fapp-chip-b .stat-row,.fapp-chip-b .ro-row{display:flex!important;flex-wrap:nowrap!important;align-items:baseline!important;gap:8px!important;padding:2px 0!important;font-size:12px!important;}',
    '.fapp-chip-b .stat-row > :first-child,.fapp-chip-b .ro-row > :first-child{flex:1 1 auto!important;min-width:0!important;max-width:none!important;white-space:normal!important;font-size:12px!important;}',
    '.fapp-chip-b .stat-row > :last-child,.fapp-chip-b .ro-row > :last-child{flex:0 0 auto!important;margin-left:auto!important;white-space:nowrap!important;font-size:12.5px!important;}',
    '.fapp-chip-b .stat-row > :only-child,.fapp-chip-b .ro-row > :only-child{white-space:normal!important;}',
    'html.fapp:not(.fapp-docked) .fapp-chip{max-width:min(250px,42vw);}',
    'html.fapp-docked.fapp-open .fapp-chip{display:none!important;}',
    'html.fapp-hero-scroll .shell-hero{overflow-y:auto!important;-webkit-overflow-scrolling:touch;}',
    'html.fapp-hero-scroll .fapp-scrolly{overflow-y:auto!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}',
    '.fapp-pill{right:calc(66px + var(--fapp-r));bottom:calc(12px + var(--fapp-b));display:none;align-items:center;gap:8px;border:1px solid var(--fapp-acc);border-radius:999px;background:#fff;color:#2f55cc;padding:9px 14px;font:600 13px/1 var(--font-sans,system-ui);box-shadow:0 6px 20px rgba(15,23,42,.16);cursor:pointer;}',
    '.fapp-pill .n{color:var(--fapp-mute);font-weight:500;}',
    'html.fapp-pill-on .fapp-pill{display:none;}'
  ].join('\n');
  /* fermi-sim.css styles every button with LAYERED !important, which beats unlayered
     !important; joining its first layer (fermi.tokens) is what lets these win. */
  css += '\n@layer fermi.tokens{' + [
    '.fapp-tabs{background:#dde7f5!important;}',
    '.fapp-tabs button{background:transparent!important;border:0!important;box-shadow:none!important;color:#475569!important;}',
    '.fapp-tabs button:hover{background:rgba(255,255,255,.5)!important;}',
    '.fapp-tabs button[aria-selected="true"]{background:#fff!important;color:#2f55cc!important;box-shadow:0 1px 3px rgba(15,23,42,.18)!important;}',
    '.fapp-tabs.single button{background:transparent!important;box-shadow:none!important;color:#0f172a!important;}',
    '.fapp-x{background:#fff!important;border:1px solid #b0c3dd!important;color:#0f172a!important;}',
    '.fapp-quick > .fapp-play{background:#4169e1!important;border-color:#4169e1!important;color:#fff!important;}',
    '.fapp-quick > .fapp-reset{background:#fff!important;border-color:#b0c3dd!important;color:#0f172a!important;}',
    '.fapp-pill{background:#fff!important;border:1px solid #4169e1!important;color:#2f55cc!important;}',
    '.fapp-chip-h{background:transparent!important;border:0!important;}',
    '.fapp-reopen{background:#1a2461!important;color:#fff!important;}',
    'html.fapp:not(.fapp-docked) .fapp-panel{padding:0 12px 14px!important;}',
    'html.fapp.fapp-docked .fapp-panel{padding:0 14px 16px!important;}',
    '.fapp-quick{padding:12px!important;background:#fff!important;border:1px solid #b0c3dd!important;border-radius:10px!important;margin:0!important;}',
    '.fapp-quick .gbtn-lab,.fapp-quick .btn-lbl{display:inline!important;visibility:visible!important;}',
    '.fapp-quick > button:not(.fapp-play):not(.fapp-reset){background:#fff!important;border:1px solid #b0c3dd!important;color:#0f172a!important;}',
    '.fapp-quick > button:not(.fapp-play):not(.fapp-reset) *{color:inherit!important;}',
    '.fapp-quick > button.active:not(.fapp-play):not(.fapp-reset),.fapp-quick > button.on:not(.fapp-play):not(.fapp-reset),.fapp-quick > button[aria-pressed="true"]:not(.fapp-play):not(.fapp-reset){background:#e3eafb!important;border-color:#4169e1!important;color:#2f55cc!important;}',
    '.fapp-chip-b *{font-size:12px!important;line-height:1.3!important;letter-spacing:0!important;margin-top:0!important;margin-bottom:0!important;min-height:0!important;}',
    '.fapp-chip-b div{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important;}',
    '.fapp-chip-b .stat-row,.fapp-chip-b .readout-row{padding:2px 0!important;gap:10px!important;}',
    '.fapp-chip-b .stat-value,.fapp-chip-b .readout-value{white-space:nowrap!important;}',
    '.fapp-chip-b p,.fapp-chip-b .hint,.fapp-chip-b .note,.fapp-chip-b .note-text,.fapp-chip-b .eq-note,.fapp-chip-b canvas{display:none!important;}',
    '.fapp-chip-b > .fapp-ro-m > h2:first-child,.fapp-chip-b > .fapp-ro-m > h3:first-child,.fapp-chip-b > .fapp-ro-m > h4:first-child{display:none!important;}',
    '.fapp-chip-b .readout-card + .readout-card,.fapp-chip-b .ctrl-box + .ctrl-box{margin-top:6px!important;}'
  ].join('') + '}';
  var st = d.createElement('style'); st.id = 'fermi-app-mode-css'; st.textContent = css; d.head.appendChild(st);

  var hp = header.parentElement;
  if (FAM !== 'shell' && hp && hp !== d.body && getComputedStyle(hp).display === 'grid' &&
      [].slice.call(hp.children).filter(function (k) { if (k === header || !shown(k)) return false; var ps = getComputedStyle(k).position; return ps !== 'absolute' && ps !== 'fixed'; }).length === 1) hp.classList.add('fapp-hdrp');
  if (FAM === 'stage' && floatCards.length) {
    hero.insertBefore(panel, iqZone);
    floatCards.forEach(function (k) { k.classList.add('fapp-card'); panel.appendChild(k); });
  }
  /* a lab's own floating sidebar is styled for its own (dark) ground: keep that ground in the drawer */
  if (FAM === 'stage' && !floatCards.length) {
    var ob = getComputedStyle(panel).backgroundColor, m = ob.match(/rgba?\(([^)]+)\)/);
    if (m) { var c = m[1].split(',').map(function (x) { return parseFloat(x); }); H.style.setProperty('--fapp-bg', (c.length < 4 || c[3] > 0.6) ? 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' : 'rgb(17,24,39)'); }
    H.classList.add('fapp-ownbg');
  }
  H.classList.add('fapp', 'fapp-' + FAM);
  panel.classList.add('fapp-panel');
  if (hero3d) {
    /* a positioned, z-indexed wrapper round the sidebar would trap the drawer under the floats */
    for (var an = panel.parentElement; an && an !== d.body; an = an.parentElement) { if (an !== shell && getComputedStyle(an).zIndex !== 'auto') an.classList.add('fapp-hero-ctx'); }
  }
  /* a lab sidebar that collapses itself on narrow screens is the drawer now: keep it expanded */
  function expandSide() { var ex = $('#sideExpand') || panel.querySelector('[id$="Expand"]'); if (ex && getComputedStyle(ex).display !== 'none' && ex.offsetParent !== null) { try { ex.click(); } catch (e) {} } }
  expandSide();
  if (FAM === 'stage') {
    var foldedOnce = typeof WeakSet === 'function' ? new WeakSet() : null, foldT = 0;
    /* phone: the lab's own floating cards (guide, instrument dock, schematic) start folded the first
       time they open, so the bench shows; the student can open them again (we never re-fold) */
    var foldFloats = function () {
      foldT = 0; expandSide();
      if (S.docked || !foldedOnce) return;
      var hr = hero.getBoundingClientRect(), A = hr.width * hr.height || 1;
      [].slice.call(hero.children).forEach(function (k) {
        if (k === panel || !shown(k) || foldedOnce.has(k) || getComputedStyle(k).position !== 'absolute') return;
        var r = k.getBoundingClientRect(); if (r.width * r.height / A < 0.3) return;
        var fb = $$('button', k).filter(function (x) { return /collapse|minimi[sz]e|fold/i.test((x.title || '') + ' ' + (x.getAttribute('aria-label') || '') + ' ' + (x.id || '') + ' ' + (x.className || '')) && shown(x); })[0];
        if (fb) { foldedOnce.add(k); try { fb.click(); } catch (e) {} }
      });
    };
    var fo = new MutationObserver(function () { if (!foldT) foldT = setTimeout(foldFloats, 350); });
    fo.observe(hero, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'] });
    [].slice.call(hero.children).forEach(function (k) { fo.observe(k, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); });
    var ap = panel.parentElement; while (ap && ap !== d.body) { fo.observe(ap, { attributes: true, attributeFilter: ['class'] }); ap = ap.parentElement; }
    setTimeout(foldFloats, 600);
  }

  /* ---------- drawer: head, tabs, quick row ---------- */
  var kids = [].slice.call(panel.children);
  kids.forEach(function (k) {
    var iq = iqZone && (k === iqZone || k.id === 'aside-inquiry-restore' || k.contains(iqZone));
    k.classList.add(iq ? 'fapp-iq' : 'fapp-ct');
  });
  var head = d.createElement('div'); head.className = 'fapp-head';
  head.innerHTML = '<div class="fapp-tabs" role="tablist"></div><button type="button" class="fapp-x" aria-label="Close the panel">×</button>';
  var tabs = head.firstChild;
  if (iqZone) tabs.innerHTML = '<button type="button" role="tab" data-tab="inquiry">Guided Inquiry</button><button type="button" role="tab" data-tab="controls">Controls</button>';
  else { tabs.className += ' single'; tabs.innerHTML = '<button type="button" role="tab" data-tab="controls" aria-selected="true">Controls</button>'; }
  panel.insertBefore(head, panel.firstChild);

  var quick = d.createElement('div'); quick.className = 'fapp-quick fapp-ct';
  if (B.play) { B.play.classList.add('fapp-play'); quick.appendChild(B.play); }
  if (B.reset) { B.reset.classList.add('fapp-reset'); quick.appendChild(B.reset); }
  /* some sims pin their top-bar Play/Reset to flex:0 0 auto with an inline !important */
  function pinFlex() { [B.play, B.reset].forEach(function (e) { if (e && e.style.getPropertyPriority('flex') && e.style.flex !== '1 1 0px') e.style.setProperty('flex', '1 1 0', 'important'); }); }
  pinFlex(); d.addEventListener('DOMContentLoaded', pinFlex); window.addEventListener('load', pinFlex);
  function br() { var s = d.createElement('span'); s.className = 'fapp-br'; quick.appendChild(s); }
  if (quick.children.length && extras.length) br();
  extras.forEach(function (e) { quick.appendChild(e); });
  if (B.guide || B.physics) { br(); [B.guide, B.physics].forEach(function (e) { if (e) { e.classList.add('fapp-half'); quick.appendChild(e); } }); }
  if (B.tutor) { br(); quick.appendChild(B.tutor); }
  if (quick.children.length) {
    var firstCt = $$('.fapp-ct', panel).filter(function (k) { return k.parentElement === panel; })[0];
    panel.insertBefore(quick, firstCt || null);
  }

  var reopen = d.createElement('button'); reopen.type = 'button'; reopen.className = 'fapp-reopen'; reopen.textContent = 'CONTROLS';
  d.body.appendChild(reopen);

  var ICO = { controls: '<path d="M21 6h-7M10 6H3M21 18h-11M6 18H3"/><circle cx="12" cy="6" r="2"/><circle cx="8" cy="18" r="2"/>',
    play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M8 4v16M16 4v16"/>', reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>' };
  function ico(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[k] + '</svg>'; }
  var rail = d.createElement('div'); rail.className = 'fapp-rail'; rail.setAttribute('role', 'toolbar');
  rail.innerHTML = '<button type="button" data-r="controls" aria-label="Controls">' + ico('controls') + '</button>' +
    (B.play ? '<button type="button" data-r="play" aria-label="Play">' + ico('play') + '</button>' : '') +
    (B.reset ? '<button type="button" data-r="reset" aria-label="Reset">' + ico('reset') + '</button>' : '');
  d.body.appendChild(rail);
  var idleT = 0;
  function wakeRail() { H.classList.remove('fapp-idle'); clearTimeout(idleT); idleT = setTimeout(function () { H.classList.add('fapp-idle'); }, 3000); }
  function paintRail() {
    var pb = rail.querySelector('[data-r=play]'); if (pb) { var on = isPlaying(); pb.innerHTML = ico(on ? 'pause' : 'play'); pb.setAttribute('aria-label', on ? 'Pause' : 'Play'); pb.disabled = !!(B.play && B.play.disabled); }
    var cb = rail.querySelector('[data-r=controls]'); cb.classList.toggle('on', S.open && S.tab === 'controls');
  }
  rail.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-r]'); if (!b) return; var r = b.getAttribute('data-r');
    if (r === 'controls') setPanel(!(S.open && S.tab === 'controls'), 'controls');
    else if (r === 'play') click(B.play);
    else if (r === 'reset') click(B.reset);
    setTimeout(paintRail, 60);
  });

  /* ---------- state ---------- */
  var S = { open: false, tab: iqZone ? 'inquiry' : 'controls', docked: false };
  function isPlaying() {
    if (!B.play) return false;
    if (B.play.classList.contains('paused')) return false;
    var t = (txt(B.play) + ' ' + (B.play.getAttribute('aria-label') || '')).toLowerCase();
    if (/pause|❚|⏸/.test(t)) return true;
    return false;
  }
  function giOn() { return !!(iqZone && (shown(iqZone) || shown($('#aside-inquiry-restore')))); }
  function giActive() { return !!(B.inquiry ? B.inquiry.classList.contains('active') : giOn()); }
  var stTimer = 0;
  function sendState() { clearTimeout(stTimer); stTimer = setTimeout(function () { paintRail(); post({ type: 'state', playing: isPlaying(), panelOpen: S.open, tab: S.tab, docked: S.docked }); }, 30); }
  /* Re-layout: a synthetic resize so the sim re-measures its (now larger) drawing area. Some
     sims re-size their canvas on resize (which clears it) and only repaint from the animation
     loop, so while paused the drawing went blank. A canvas that had ink before the resize and
     has none two frames after gets a net-zero Play+Pause tap so the sim paints one frame. */
  var inkC = null;
  function inked(c) {
    try {
      if (!c.width || !c.height) return false;
      inkC = inkC || d.createElement('canvas'); inkC.width = inkC.height = 24;
      var x = inkC.getContext('2d'); x.clearRect(0, 0, 24, 24); x.drawImage(c, 0, 0, 24, 24);
      var a = x.getImageData(0, 0, 24, 24).data; for (var i = 3; i < a.length; i += 4) if (a[i]) return true;
      return false;
    } catch (e) { return null; }
  }
  function fireResize() {
    var cs = $$('canvas', hero).filter(function (c) { return shown(c) && inked(c) === true; });
    window.dispatchEvent(new Event('resize'));
    if (!cs.length || !B.play || FAM === 'shell') return;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (isPlaying() || !cs.some(function (c) { return d.contains(c) && shown(c) && inked(c) === false; })) return;
      B.play.click(); B.play.click();
    }); });
  }
  function refit() { requestAnimationFrame(fireResize); setTimeout(fireResize, 260); }

  function render() {
    H.classList.toggle('fapp-open', S.open);
    H.classList.toggle('fapp-docked', S.docked);
    panel.setAttribute('data-fapp-tab', S.tab);
    $$('button', tabs).forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === S.tab)); });
    head.lastChild.setAttribute('aria-label', S.docked ? 'Collapse the panel' : 'Close the panel');
    head.lastChild.textContent = S.docked ? '›' : '×';
    pill();
    sendState();
  }
  function setPanel(open, tab, instant) {
    var wasDocked = S.docked, was = S.open;
    if (tab) S.tab = tab;
    S.open = !!open;
    if (instant) { H.classList.add('fapp-instant'); }
    render();
    if (instant) { void panel.offsetWidth; setTimeout(function () { H.classList.remove('fapp-instant'); }, 30); }
    if (S.docked && (was !== S.open || wasDocked !== S.docked)) refit();
  }
  function layout() {
    var docked = innerWidth >= 900 && innerHeight >= 560;
    if (docked !== S.docked) { S.docked = docked; S.open = docked; render(); refit(); }
    shrinkOverlays(); fitHero();
  }
  /* A drawing given a desktop min-height taller than the whole phone hero is cut off at the bottom;
     let just those boxes shrink (kept only if they stay usable). Panes a sim stacks for a narrow
     window go side by side on a landscape phone. Phone only. */
  var fitT = 0;
  function fitHero() {
    clearTimeout(fitT); fitT = setTimeout(function () {
      var was = $$('.fapp-minh,.fapp-sbs', hero);
      was.forEach(function (e) { e.classList.remove('fapp-minh', 'fapp-sbs'); });
      var hs = getComputedStyle(hero), avail = hero.clientHeight - (parseFloat(hs.paddingTop) || 0) - (parseFloat(hs.paddingBottom) || 0), changed = was.length > 0;
      if (!S.docked && avail > 0 && FAM !== 'stage') {
        var hb = hero.getBoundingClientRect();
        if (hb.width > hb.height) $$('*', hero).forEach(function (g) {
          var cs = getComputedStyle(g); if (cs.display !== 'grid' || !shown(g) || g.closest('svg')) return;
          var cols = cs.gridTemplateColumns.split(' ').length, kids = [].slice.call(g.children).filter(shown);
          if (cols !== 1 || kids.length < 2 || kids.length > 3) return;
          if (g.getBoundingClientRect().bottom <= hb.bottom + 4 && kids[kids.length - 1].getBoundingClientRect().bottom <= hb.bottom + 4) return;
          if (kids.some(function (k) { var ks = getComputedStyle(k); return ks.gridRowStart !== 'auto' || ks.gridColumnStart !== 'auto' || ks.position === 'absolute' || ks.position === 'fixed'; })) return;
          g.style.setProperty('--fapp-n', kids.length); g.classList.add('fapp-sbs');
        });
        $$('*', hero).forEach(function (e) {
          if (e.closest('svg,button,.fapp-float,.fapp-panel') || !shown(e)) return;
          if ((parseFloat(getComputedStyle(e).minHeight) || 0) > avail - 4) e.classList.add('fapp-minh');
        });
        $$('.fapp-minh', hero).forEach(function (e) { if (e.getBoundingClientRect().height < 0.4 * avail) e.classList.remove('fapp-minh'); });
        var now = $$('.fapp-minh,.fapp-sbs', hero);
        changed = now.length !== was.length || now.some(function (e, i) { return e !== was[i]; });
      }
      if (changed) window.dispatchEvent(new Event('resize'));
    }, 120);
  }
  /* The drawing must fit the app viewport (shell family). Step 1, once: drop the sim's own currently
     matching max-width rules that target the hero (they stack plots for a scrolling mobile-web page).
     fitHero then shrinks / places side by side. Last resort: the hero (and clipping boxes) scroll. */
  var heroFitDone = false, heroFitT2 = 0;
  function heroClipped() {
    var hr = hero.getBoundingClientRect();
    return $$('canvas, .plot-box, svg', hero).some(function (e) {
      if (e.tagName.toLowerCase() === 'svg' && e.parentElement && e.parentElement.closest('svg')) return false;
      var r = e.getBoundingClientRect(); if (r.width < 24 || r.height < 24) return false;
      return r.bottom > hr.bottom + 2 && r.top < hr.bottom - 1 || r.top >= hr.bottom + 2 && shown(e);
    });
  }
  function hitsHero(sel) { return $$(sel).some(function (e) { return hero.contains(e); }); }
  function dropNarrowHeroRules() {
    var n = 0;
    function walk(rules) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i], mt = r.media && r.media.mediaText;
        if (mt != null && r.cssRules) {
          var on = false; try { on = /max-width/i.test(mt) && !/min-width/i.test(mt) && matchMedia(mt).matches; } catch (e) {}
          if (!on) continue;
          for (var j = r.cssRules.length - 1; j >= 0; j--) { var s = r.cssRules[j]; if (s.selectorText && hitsHero(s.selectorText)) { try { r.deleteRule(j); n++; } catch (e) {} } }
        } else if (r.cssRules && !r.selectorText) walk(r.cssRules);
      }
    }
    [].forEach.call(d.styleSheets, function (sh) { if (sh.ownerNode === st) return; var rules; try { rules = sh.cssRules; } catch (e) { return; } walk(rules); });
    return n;
  }
  function fitScroll() {
    if (FAM !== 'shell' || heroFitT2 || S.docked) return;
    heroFitT2 = setTimeout(function () {
      heroFitT2 = 0;
      if (H.classList.contains('fapp-hero-scroll') || !heroClipped()) return;
      if (!heroFitDone) { heroFitDone = true; if (dropNarrowHeroRules()) { refit(); fitHero(); setTimeout(fitScroll, 600); return; } }
      H.classList.add('fapp-hero-scroll');
      var hb = hero.getBoundingClientRect().bottom;
      $$('canvas, .plot-box, svg', hero).forEach(function (e) {
        var r = e.getBoundingClientRect(); if (r.width < 24 || r.height < 24 || r.bottom <= hb + 2) return;
        for (var a = e.parentElement; a && a !== hero; a = a.parentElement) { if (a.scrollHeight > a.clientHeight + 2 && /hidden|clip/.test(getComputedStyle(a).overflowY)) a.classList.add('fapp-scrolly'); }
      });
    }, 500);
  }
  /* phone: a card the sim floats over its own drawing (a chart, a legend box) that would cover
     a quarter or more of the shrunken stage is scaled down toward its own corner */
  function shrinkOverlays() {
    var hr = hero.getBoundingClientRect(), A = hr.width * hr.height; if (!A) return;
    var big = null, bigA = 0;
    $$('canvas', hero).forEach(function (c) { var r = c.getBoundingClientRect(); if (r.width * r.height > bigA) { bigA = r.width * r.height; big = c; } });
    [].slice.call(hero.children).forEach(function (k) {
      if (k === panel || k.classList.contains('fapp-panel') || (big && k.contains(big)) || !shown(k)) return;
      if (getComputedStyle(k).position !== 'absolute') return;
      var was = k.classList.contains('fapp-shrink'); if (was) k.classList.remove('fapp-shrink');
      var r = k.getBoundingClientRect(), f = r.width * r.height / A;
      if (!S.docked && f >= 0.25 && f < 0.8) {
        k.style.setProperty('--fapp-so', ((r.left + r.width / 2 > hr.left + hr.width / 2) ? 'right' : 'left') + ' ' + ((r.top + r.height / 2 > hr.top + hr.height / 2) ? 'bottom' : 'top'));
        k.classList.add('fapp-shrink');
      }
    });
  }

  /* ---------- inquiry pill ---------- */
  var pillEl = d.createElement('button'); pillEl.type = 'button'; pillEl.className = 'fapp-float fapp-pill';
  pillEl.innerHTML = '<span aria-hidden="true">🧭</span><span>Guided Inquiry</span><span class="n"></span>';
  d.body.appendChild(pillEl);
  function pill() {
    var on = !!iqZone && !(S.open && S.tab === 'inquiry');
    H.classList.toggle('fapp-pill-on', on);
    var dots = $$('#inq-dots .inq-dot');
    pillEl.lastChild.textContent = '';
    if (dots.length && giActive()) {
      var i = dots.findIndex(function (x) { return x.classList.contains('active'); });
      pillEl.lastChild.textContent = (i < 0 ? dots.length : i + 1) + '/' + dots.length;
    }
  }

  /* ---------- floating read-outs ---------- */
  var RO = /read-?outs?|reading|measure|result|live|values?|output|stats?/i;
  var roMarked = $$('[data-fapp="readouts"]').concat(RMAP.readouts ? $$(RMAP.readouts) : []);
  var roSrc = roMarked.length ? roMarked : $$('.shell-panel, .ctrl-box', panel).filter(function (p) {
    if (p.closest('.fapp-iq')) return false;
    var h = txt(p.querySelector('.shell-panel-head, h3, .section-title'));
    var looks = RO.test(p.id || '') || RO.test(h);
    var hasRO = p.querySelector('.stat-row, .ro-row, .readout-card, .readout-row, .sim-ro');
    var hasIn = p.querySelector('input, select, button:not(.shell-panel-head *)');
    return hasRO && !hasIn && (looks || p.classList.contains('shell-panel'));
  }).filter(function (p, i, a) { return !a.some(function (o) { return o !== p && o.contains(p); }); });
  if (roSrc.length) {
    var chip = d.createElement('div'); chip.className = 'fapp-float fapp-chip';
    var roTitle = txt(roSrc[0].querySelector('.shell-panel-head h3') || roSrc[0].querySelector('h3') || roSrc[0].querySelector('.section-title')) || 'Read-outs';
    chip.innerHTML = '<button type="button" class="fapp-chip-h"><span class="g" aria-hidden="true">⠿</span><span class="t"></span><span class="c" aria-hidden="true">▾</span></button><div class="fapp-chip-b"></div>';
    chip.querySelector('.t').textContent = roTitle.replace(/[▾▸▼]/g, '').trim();
    d.body.appendChild(chip);
    var body = chip.lastChild, mt = 0;
    var mirror = function () {
      mt = 0; body.innerHTML = '';
      roSrc.forEach(function (p) {
        var src = p.querySelector('.shell-panel-body') || p, c = src.cloneNode(true);
        c.removeAttribute('id'); $$('[id]', c).forEach(function (x) { x.removeAttribute('id'); });
        c.style.display = 'block'; if (roMarked.length) c.classList.add('fapp-ro-m'); body.appendChild(c);
      });
    };
    mirror();
    var mo = new MutationObserver(function () { if (!mt) mt = setTimeout(mirror, 100); });
    roSrc.forEach(function (p) { mo.observe(p, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] }); });
    var chipTapped = false;
    draggable(chip, chip.firstChild, function () { chipTapped = true; chip.classList.toggle('min'); });
    /* phone: a chip that would cover much of the drawing starts folded to its title bar */
    var foldChip = function () {
      if (chipTapped || chip.classList.contains('min') || (innerWidth >= 900 && innerHeight >= 560)) return;
      var r = chip.getBoundingClientRect(); if (r.width * r.height > 0.15 * innerWidth * innerHeight) chip.classList.add('min');
    };
    foldChip(); window.addEventListener('load', function () { foldChip(); setTimeout(foldChip, 1500); });
  }
  function draggable(box, grip, onTap) {
    var sx, sy, ox, oy, moved = false, id = null;
    try { var p = JSON.parse(sessionStorage.getItem('fapp-pos:' + location.pathname) || 'null'); if (p) { box.style.left = p.x + 'px'; box.style.top = p.y + 'px'; } } catch (e) {}
    grip.addEventListener('pointerdown', function (e) { id = e.pointerId; moved = false; sx = e.clientX; sy = e.clientY; var r = box.getBoundingClientRect(); ox = r.left; oy = r.top; try { grip.setPointerCapture(id); } catch (x) {} });
    grip.addEventListener('pointermove', function (e) {
      if (e.pointerId !== id) return; var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return; moved = true;
      var r = box.getBoundingClientRect();
      box.style.left = Math.max(4, Math.min(innerWidth - r.width - 4, ox + dx)) + 'px';
      box.style.top = Math.max(4, Math.min(innerHeight - r.height - 4, oy + dy)) + 'px';
    });
    grip.addEventListener('pointerup', function (e) {
      if (e.pointerId !== id) return; id = null;
      if (!moved) { onTap && onTap(); return; }
      try { sessionStorage.setItem('fapp-pos:' + location.pathname, JSON.stringify({ x: parseFloat(box.style.left), y: parseFloat(box.style.top) })); } catch (x) {}
    });
  }

  /* ---------- the guide tour: a step pointing into the closed drawer opens it ---------- */
  function inPanel(sel) { var e = typeof sel === 'string' ? $(sel) : null; return !!(e && panel.contains(e)); }
  function needsPanel(list) {
    return (list || []).some(function (t) { return t && (typeof t === 'string' ? inPanel(t) : inPanel(t.sel)); });
  }
  (function hookTour() {
    var spec = window.__GV_SPEC; if (!spec || !spec.steps) return;
    spec.steps.forEach(function (step) {
      var orig = step.targets; if (!orig) return;
      var wrapped = typeof orig === 'function'
        ? function () { var r = orig.apply(this, arguments); if (needsPanel(r) && !(S.open && S.tab === 'controls')) setPanel(true, 'controls', true); return r; }
        : orig;
      Object.defineProperty(step, 'targets', { configurable: true, enumerable: true, get: function () {
        if (Array.isArray(orig) && needsPanel(orig) && !(S.open && S.tab === 'controls')) setPanel(true, 'controls', true);
        return wrapped;
      } });
    });
  })();

  /* ---------- actions ---------- */
  function click(e) { if (e) { e.click(); return true; } return false; }
  function overlayOpen(sel) { var e = $(sel); if (!e || !shown(e)) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function back() {
    if (overlayOpen('#phys-backdrop') && click($('#phys-close'))) return true;
    if (overlayOpen('#shell-info-modal.open') && click($('#shell-info-close'))) return true;
    if ((overlayOpen('#gv-card') || overlayOpen('#gv-tour')) && click($('#gv-close'))) return true;
    if (S.open && !S.docked) { setPanel(false); return true; }
    return false;
  }
  function handle(m) {
    var ret;
    switch (m.cmd) {
      case 'native-rails': H.classList.add('fapp-native'); ready(); break;
      case 'hello': case 'state': ready(); break;
      case 'insets':
        ['left', 'right', 'top', 'bottom'].forEach(function (k) { if (m[k] != null) H.style.setProperty('--fapp-' + k[0], (+m[k] || 0) + 'px'); });
        refit(); break;
      case 'play': if (!isPlaying()) click(B.play); break;
      case 'pause': if (isPlaying()) click(B.play); break;
      case 'toggle-play': click(B.play); break;
      case 'reset': click(B.reset); break;
      case 'panel': setPanel(m.open == null ? !S.open : !!m.open, m.tab); break;
      case 'inquiry':
        if (B.inquiry && !B.inquiry.classList.contains('active')) click(B.inquiry);
        setPanel(true, 'inquiry'); break;
      case 'guide': if (!S.docked) setPanel(false); click(B.guide); break;
      case 'physics': click(B.physics); break;
      case 'back': ret = back(); post({ type: 'back', handled: ret }); break;
    }
    setTimeout(sendState, 80);
    return ret;   /* {cmd:'back'} returns true when it closed something (an app closes the player on false) */
  }
  window.addEventListener('message', function (ev) {
    var m = ev.data; if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { return; } }
    if (!m || m.source !== 'fermi-app') return;
    if (ev.source && ev.source !== window.parent && ev.source !== window) return;
    handle(m);
  });
  try { if (window.FermiApp) window.FermiApp.onmessage = function (e) { try { var m = JSON.parse(e.data); if (m && m.source === 'fermi-app') handle(m); } catch (x) {} }; } catch (e) {}
  /* For a native app with no listener: evaluateJavascript("FermiAppMode.handle({cmd:'toggle-play'})"),
     and evaluateJavascript("FermiAppMode.state()") returns a JSON string to paint its buttons. */
  window.FermiAppMode = { version: VER, handle: handle,
    state: function () { return JSON.stringify({ playing: isPlaying(), panelOpen: S.open, tab: S.tab, docked: S.docked,
      caps: { play: !!B.play, reset: !!B.reset, guide: !!B.guide, physics: !!B.physics, inquiry: !!(B.inquiry && iqZone) } }); } };

  /* ---------- wiring ---------- */
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-tab]'); if (!b) return;
    var t = b.getAttribute('data-tab');
    if (t === 'inquiry' && B.inquiry && !B.inquiry.classList.contains('active')) click(B.inquiry);
    setPanel(true, t);
  });
  head.lastChild.addEventListener('click', function () { setPanel(false); });
  if (B.guide) B.guide.addEventListener('click', function () { if (!S.docked) setPanel(false); });
  if (B.physics) B.physics.addEventListener('click', function () { if (!S.docked) setPanel(false); });
  reopen.addEventListener('click', function () { setPanel(true); });
  pillEl.addEventListener('click', function () { handle({ cmd: 'inquiry' }); });
  var touchT = 0;
  d.addEventListener('pointerdown', function (e) {
    wakeRail();
    if (!e.isTrusted || Date.now() - touchT < 400) return; touchT = Date.now();
    post({ type: 'touch', inPanel: panel.contains(e.target) });
  }, true);
  if (B.play) new MutationObserver(sendState).observe(B.play, { attributes: true, childList: true, subtree: true, characterData: true });
  var watch = [$('#inq-dots'), iqZone, shell, B.inquiry].filter(Boolean);
  var po = new MutationObserver(function () { if (S.tab === 'inquiry' && !giActive() && !giOn()) { S.tab = 'controls'; render(); } pill(); });
  watch.forEach(function (w) { po.observe(w, { attributes: true, attributeFilter: ['class', 'style'], childList: true, subtree: w.id === 'inq-dots' }); });
  window.addEventListener('resize', function () { layout(); fitScroll(); });
  /* inquiry steps reveal plots later: re-check the fit when the hero's own boxes change */
  new MutationObserver(fitScroll).observe(hero, { attributes: true, attributeFilter: ['class', 'hidden'], subtree: true, childList: true });
  if (shell) new MutationObserver(fitScroll).observe(shell, { attributes: true, attributeFilter: ['class'] });

  function ready() {
    post({ type: 'ready', supported: true, family: FAM, title: TITLE, playing: isPlaying(), docked: S.docked,
      caps: { play: !!B.play, reset: !!B.reset, inquiry: !!(B.inquiry && iqZone), guide: !!B.guide, physics: !!B.physics, controls: true, readouts: roSrc.length > 0 } });
  }
  S.docked = innerWidth >= 900 && innerHeight >= 560; S.open = S.docked;
  if (!giActive()) S.tab = 'controls';
  render(); refit(); ready(); wakeRail(); shrinkOverlays(); fitHero();
  window.addEventListener('load', function () { pill(); refit(); ready(); fitHero(); setTimeout(shrinkOverlays, 300); setTimeout(fitScroll, 300); });
  fitScroll();
})();
