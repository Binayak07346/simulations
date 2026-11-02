"""Guide v2 engine patch: DIRECT landing, switched by the stylesheet (owner, 2026-10-06).

When the stylesheet sets  --fsim-landing: direct  (on :root, or html[data-fsim-id="..."] for one sim), the sim opens
straight into the simulation: no start board, Explore-freely mode, paused until the learner starts it, and ONE
plain-text tip under the header's Simulation guide button (highlighted: white ring + lighter fill + pulse) says a guided tour is there. It is the same
box, type and one-line form as the Explore-freely trigger hint. It closes after 5 s, or earlier on its x, on the
Simulation guide or Guided Inquiry, or as soon as the learner uses the sim; no voice, it never comes back. Without the token (or with an older stylesheet, e.g. the inline fallback) the start board shows as
before. So after this patch is pushed once, the landing is switched for any sim, or all of them, from the CDN.

Exact anchors in the installed engine (each must occur once), fully reversible (MARK).
    apply(html) -> html        reverse(html) -> html
"""
MARK = 'fsimLanding'

TIP = 'Open the <b>Simulation guide</b> for a 2-minute tour.'   # one line, <= 12 words, like the Explore-freely hint
TIP_MS = 5000                                                    # owner, 2026-10-06: the tip closes itself after 5 s

PAIRS = [
    # 1. the start board shows only when the stylesheet does not ask for the direct landing
    ("""  startEl.hidden=false; hold(1e9);
  setTimeout(function(){ $('gv-go-guide').focus({preventScroll:true}); },60);""",
     """  var fsimLanding=(getComputedStyle(document.documentElement).getPropertyValue('--fsim-landing')||'').trim();   /* stylesheet token */
  if(fsimLanding==='direct'){ hold(1e9);   /* paused until the sim is ready: some sims define __setMode only after load */
    var fsimGo=function(){ var n=0; (function t(){ if(window.__setMode||n++>=40){ enterFree(false); setTimeout(showGuideTip,500); } else setTimeout(t,75); })(); };
    if(document.readyState==='complete') setTimeout(fsimGo,200); else addEventListener('load',function(){ setTimeout(fsimGo,200); }); }
  else { startEl.hidden=false; hold(1e9);
  setTimeout(function(){ $('gv-go-guide').focus({preventScroll:true}); },60); }"""),
    # 2. the hint box is placed under the Simulation guide button while it carries the tip
    ("""    var t=hintTarget(); if(hintEl.hidden||!t||!vis(t)) return;""",
     """    var t=tipOn?$('btn-cg'):hintTarget(); if(hintEl.hidden||!t||!vis(t)) return;"""),
    # 3. the tip itself; hideHint (x, Simulation guide, Guided Inquiry) also closes it
    ("""  function hideHint(){ clearTimeout(hintAuto); if(hintOff) hintOff(); hintOff=null; hintEl.hidden=true; VOICE.stop(); }""",
     """  function hideHint(){ clearTimeout(hintAuto); if(hintOff) hintOff(); hintOff=null; hintEl.hidden=true; VOICE.stop(); if(tipOff) tipOff(); }
  /* direct landing: ONE plain-text tip under the Simulation guide button (the Explore-freely hint's box and form);
     closes after 5 s, or on x, on the guide or Guided Inquiry, or as soon as the learner uses the sim. No voice. */
  var tipOn=false, tipOff=null, tipT=0;
  function showGuideTip(){
    var t=$('btn-cg'); if(!t||!vis(t)||!startEl.hidden||tourOn) return;
    tipOn=true; $('gv-hint-text').innerHTML='""" + TIP + """';
    hintEl.classList.remove('done'); hintEl.classList.add('gv-guidetip'); hintEl.hidden=false; placeHint(); t.classList.add('gv-attn');
    var HL=[['outline','2px solid #ffffff'],['outline-offset','2px'],['background-color','rgba(255,255,255,0.22)']];   /* the button stands out on the navy bar */
    HL.forEach(function(d){ t.style.setProperty(d[0],d[1],'important'); });
    function use(e){ var x=e.target; if(!x||!x.closest||x.closest('#gv-hint,#btn-cg,#btn-gi')) return;
      if(x.closest('header,.shell-header,.top-bar')&&!x.closest('button,select,input,a,label')) return; hideHint(); }
    document.addEventListener('pointerdown',use,true); document.addEventListener('keydown',use,true);
    tipT=setTimeout(hideHint,""" + str(TIP_MS) + """);
    tipOff=function(){ clearTimeout(tipT); tipOff=null; tipOn=false; document.removeEventListener('pointerdown',use,true); document.removeEventListener('keydown',use,true);
      t.classList.remove('gv-attn'); HL.forEach(function(d){ t.style.removeProperty(d[0]); }); hintEl.classList.remove('gv-guidetip'); };
  }"""),
]


def apply(s):
    assert MARK not in s, 'landing patch already applied'
    for a, b in PAIRS:
        assert s.count(a) == 1, ('landing patch anchor not found exactly once', a[:70])
        s = s.replace(a, b)
    return s


def reverse(s):
    if MARK not in s: return s
    for a, b in reversed(PAIRS):
        assert s.count(b) == 1, ('landing patch not reversible', b[:70])
        s = s.replace(b, a)
    return s
