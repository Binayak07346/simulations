"""NOTE: this file contains an OWNER-APPROVED sim fix specific to this sim; do not copy it to other sims.
Per-sim hooks for the pend example: read-only geometry hooks the spec uses (and any approved sim fix).
build.py calls patch(html) before the guide layer is inserted. Every edit asserts its anchor."""
import re
def once(html, a, b, what):
    assert html.count(a) == 1, (what, html.count(a))
    return html.replace(a, b)

def patch(html):
    # the θ₀ label was drawn under the bob: put it beside the release position, under the L label
    html = once(html, "let lx=px+Math.sin(a0)*(Ls+18), ly=py+Math.cos(a0)*(Ls+18)+4;",
                "let lx=px+Math.sin(a0)*Ls+bobR+8, ly=py+Math.cos(a0)*Ls+bobR*0.5+10;", 'theta label')
    a = 'badge:{ x:bx, y:by, w:gw+padX*2, h:boxH } });\n'
    html = once(html, a, a + '  window.__gvState = () => ({ th:state.th, t:state.t });\n', 'gvState hook')
    return html
