"""NOTE: this file contains an OWNER-APPROVED sim fix specific to this sim; do not copy it to other sims.
Per-sim hooks for the ds example: read-only geometry hooks the spec uses (and any approved sim fix).
build.py calls patch(html) before the guide layer is inserted. Every edit asserts its anchor."""
import re
def once(html, a, b, what):
    assert html.count(a) == 1, (what, html.count(a))
    return html.replace(a, b)

def patch(html):
    m = re.search(r'\n(\s*)const cgDom = [^\n]*\n', html); assert m
    ind = m.group(1)
    hook = (ind + '/* guide v2 (read-only): the projected corner points of each part, for silhouette outlines */\n'
      + ind + "const gvProj = pts => { const c = cgCv(); if(!c || !window.THREE || typeof camera === 'undefined' || !camera) return null; const out = [];\n"
      + ind + "  pts.forEach(p => { const v = new THREE.Vector3(p[0],p[1],p[2]).project(camera); if(v.z > 1) return; out.push([c.left+(v.x+1)/2*c.width, c.top+(1-v.y)/2*c.height]); }); return out.length ? out : null; };\n"
      + ind + 'const gvParts = {\n'
      + ind + '  source: () => cgCube(-1.3,1.3,-1.3,1.3,CONFIG.sourceZ-1.3,CONFIG.sourceZ+1.3).concat(cgCube(-4,4,2,4,CONFIG.sourceZ,CONFIG.sourceZ)),\n'
      + ind + '  barrier: () => { const h = CONFIG.sceneWidth/2, s = state.sep/2; return cgCube(-h,h,-7.5,7.5,CONFIG.barrierZ-0.5,CONFIG.barrierZ+0.5).concat(cgCube(-s-2.5,-s+2.5,8.75,11.25,CONFIG.barrierZ,CONFIG.barrierZ), cgCube(s-2.5,s+2.5,8.75,11.25,CONFIG.barrierZ,CONFIG.barrierZ)); },\n'
      + ind + '  screen: () => { const h = CONFIG.sceneWidth/2, v = CONFIG.screenHeight/2, z = -state.screenDistance; return cgCube(-h,h,-v,v,z-0.25,z+0.25); } };\n'
      + ind + 'window.__gvGeo = { source:cgSource, barrier:cgBarrier, screen:cgScreen, dom:cgDom, pts:k => gvParts[k] ? gvProj(gvParts[k]()) : null };\n')
    html = html[:m.end()] + hook + html[m.end():]
    # SME: after Reset (and on load) no frozen wavefronts; Play makes the source start emitting
    # (the animation loop creates a new incident wave whenever none exist)
    old = re.search(r"\n(\s*)const distanceSourceToBarrier = CONFIG\.sourceZ - CONFIG\.barrierZ;\n\s*for \(let i = 0; i < CONFIG\.numIncidentWaves; i\+\+\) \{\n\s*const radius = 0\.5 \+ i \* state\.lambda \* 1\.1;\n\s*if \(radius < distanceSourceToBarrier\) \{\n\s*createIncidentWave\(radius\);\n\s*\}\n\s*\}\n", html)
    assert old and html.count(old.group(0)) == 1, 'wavefront prefill'
    html = html.replace(old.group(0), '\n' + old.group(1) + '/* guide v2: no pre-filled wave train; the source starts emitting when Play runs */\n')
    return html
