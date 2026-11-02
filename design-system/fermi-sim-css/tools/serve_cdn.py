#!/usr/bin/env python3
"""Local stand-in for the CDN, for tests only: serves dist/fermi-sim.<V>.css at
/fermi-sim/<V>/fermi-sim.css with CORS (needed for crossorigin + SRI).
    python3 tools/serve_cdn.py [port] [--tamper]   # --tamper serves a modified file (SRI must reject it)
"""
import http.server, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
V = (ROOT / 'VERSION').read_text().strip()
TAMPER = '--tamper' in sys.argv
PORT = int(next((a for a in sys.argv[1:] if a.isdigit()), 8766))
class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] != f'/fermi-sim/{V}/fermi-sim.css':
            self.send_response(404); self.end_headers(); return
        body = (ROOT / 'dist' / f'fermi-sim.{V}.css').read_bytes()
        if TAMPER: body = body.replace(b'#1a2461', b'#ff0000')
        self.send_response(200)
        self.send_header('Content-Type', 'text/css; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
