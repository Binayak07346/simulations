"""Guide v2 engine patch: the guide MARKS the page controls a step points at; the stylesheet draws their outlines.

Before: for every target (canvas region or page control) the engine drew a hand-drawn SVG path, padded 3 px,
so stacked sidebar controls 8 px apart got outlines that touched and crossed.
After:  a target that is a page control (spec `{sel:...}`) gets the class `fsim-guide-target`
(`fsim-guide-target--sec` for a secondary target) and NO drawn path; fermi-sim.css >= 1.2.0 draws a clean,
separate outline on it. Canvas regions (rect / poly / ellipse) keep the drawn path. Marks are removed when the
step redraws and when the tour ends. Spotlight holes, tags and pointers are unchanged. On the LAST step the card
also keeps clear of the Play button and its "Press Play to start" tip (pairs 7).

apply(html) / reverse(html): every anchor must occur exactly once, else AssertionError (nothing is written).
"""
MARK = 'fsimUnmark'

PAIRS = [
    # 1. remember the element of a page-control target
    ("return {r:rectOf(t),sec:!!(t&&t.sec),tag:t&&t.tag}; }).filter(function(o){ return o.r&&o.r.width>2&&o.r.height>2; });",
     "return {r:rectOf(t),sec:!!(t&&t.sec),tag:t&&t.tag,el:(t&&t.sel&&t.rect===undefined)?q(t.sel):null}; }).filter(function(o){ return o.r&&o.r.width>2&&o.r.height>2; });"),
    # 2. the "same step, things moved" fast path only follows DRAWN outlines
    ("loopsNow.length===ts.length&&lines.dataset.step===String(i)",
     "loopsNow.length===ts.filter(function(o){return !o.el;}).length&&lines.dataset.step===String(i)"),
    ("ts.forEach(function(o,k){ loopsNow[k].setAttribute('d',o.poly?polyPath(o.poly):roughRect(o.r,5)); });",
     "ts.filter(function(o){return !o.el;}).forEach(function(o,k){ loopsNow[k].setAttribute('d',o.poly?polyPath(o.poly):roughRect(o.r,5)); });"),
    # 3. a redraw clears the previous step's marks
    ("lastKey=key; lines.innerHTML=''; lines.dataset.step=String(i);",
     "lastKey=key; lines.innerHTML=''; lines.dataset.step=String(i); fsimUnmark();"),
    # 4. page controls are marked, not drawn
    ("ts.forEach(function(o,k){ var p=document.createElementNS('http://www.w3.org/2000/svg','path');",
     "ts.forEach(function(o,k){ if(o.el){ o.el.classList.add('fsim-guide-target'); if(o.sec) o.el.classList.add('fsim-guide-target--sec'); } else { var p=document.createElementNS('http://www.w3.org/2000/svg','path');"),
    ("p.setAttribute('d',o.poly?polyPath(o.poly):roughRect(o.r,5)); lines.appendChild(p);",
     "p.setAttribute('d',o.poly?polyPath(o.poly):roughRect(o.r,5)); lines.appendChild(p); }"),
    # 5. ending the tour clears every mark
    ("tourOn=false; gen++; clearInterval(poll); tour.hidden=true;",
     "tourOn=false; gen++; clearInterval(poll); tour.hidden=true; fsimUnmark();"),
    # 7. the LAST step: keep the card off the Play button and its "Press Play to start" tip (the reskinned card is
    #    shorter, so the top-right spot under Play started to win and the card covered the tip)
    ("var av=all0.filter(function(t){ return t&&t.avoid&&t.rect; }).map(function(t){ return t.rect; });",
     "var av=all0.filter(function(t){ return t&&t.avoid&&t.rect; }).map(function(t){ return t.rect; }); var fsimCue=st.final?fsimCueZone():null;"),
    ("av.forEach(function(r){ var ox=Math.max(0,Math.min(cx+cw,r.left+r.width)-Math.max(cx,r.left)), oy=Math.max(0,Math.min(cy+ch,r.top+r.height)-Math.max(cy,r.top)); s+=ox*oy*3; });",
     "av.forEach(function(r){ var ox=Math.max(0,Math.min(cx+cw,r.left+r.width)-Math.max(cx,r.left)), oy=Math.max(0,Math.min(cy+ch,r.top+r.height)-Math.max(cy,r.top)); s+=ox*oy*3; }); if(fsimCue){ var fx=Math.max(0,Math.min(cx+cw,fsimCue.left+fsimCue.width)-Math.max(cx,fsimCue.left)), fy=Math.max(0,Math.min(cy+ch,fsimCue.top+fsimCue.height)-Math.max(cy,fsimCue.top)); s+=fx*fy*60; }"),
    # 6. the helper
    ("function rectOf(t){",
     "function fsimUnmark(){ document.querySelectorAll('.fsim-guide-target').forEach(function(e){ e.classList.remove('fsim-guide-target','fsim-guide-target--sec'); }); }\n"
     "  function fsimCueZone(){ var b=cueEl(); if(!b||!vis(b)) return null; var r=b.getBoundingClientRect(), cx=r.left+r.width/2; return {left:cx-110,top:r.top-4,width:220,height:r.height+62}; }\n  function rectOf(t){"),
]


def _engine(s):
    i = s.find('id="gv-engine"'); assert i > 0, 'no guide v2 engine in this sim'
    j = s.find('</script>', i); return i, j


def apply(s):
    assert MARK not in s, 'guide patch already applied'
    i, j = _engine(s); js = s[i:j]
    for a, b in PAIRS:
        assert js.count(a) == 1, f'anchor not found exactly once: {a[:60]}'
        js = js.replace(a, b)
    return s[:i] + js + s[j:]


def reverse(s):
    if MARK not in s: return s
    i, j = _engine(s); js = s[i:j]
    for a, b in reversed(PAIRS):
        assert js.count(b) == 1, f'patched text not found exactly once: {b[:60]}'
        js = js.replace(b, a)
    return s[:i] + js + s[j:]
