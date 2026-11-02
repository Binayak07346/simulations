"""Per-sim hooks for the tr example: read-only geometry hooks the spec uses (and any approved sim fix).
build.py calls patch(html) before the guide layer is inserted. Every edit asserts its anchor."""
import re
def once(html, a, b, what):
    assert html.count(a) == 1, (what, html.count(a))
    return html.replace(a, b)

def patch(html):
    i = html.find('window.__cgSceneBox = function (part) {'); j = html.find('\n  };', i) + 5
    src = html[i:j]
    a = 'l = Math.min(l, sx); r = Math.max(r, sx); t = Math.min(t, sy); b = Math.max(b, sy); n++;'
    z = src.find('if (!n) return null;')
    assert a in src and z > 0
    pts = src[:z].replace('window.__cgSceneBox = function (part) {', 'window.__gvScenePts = function (part) {\n    var out = [];').replace(a, 'out.push([sx, sy]); n++;') + 'return n ? out : null;\n  };'
    html = html[:j] + '\n  /* guide v2 (read-only): the same projection, as points, for silhouette outlines */\n  ' + pts + html[j:]
    a2 = '  function resetLook() {\n'
    k2 = html.find(a2); assert k2 > 0; e2 = html.find('\n  }\n', k2) + 4
    html = html[:e2] + '  window.__gvResetLook = resetLook;   /* guide v2: camera only, recentres a scene step */\n' + html[e2:]
    return html
