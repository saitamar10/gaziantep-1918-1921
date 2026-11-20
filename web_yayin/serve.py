# Gaziantep 1918-1921 (Godot web aktarımı) için küçük statik sunucu. Yerelde: python serve.py -> http://127.0.0.1:8000
# Büyük dosyalar (.pck, .wasm) tarayıcıda önbelleğe alınır; index.html her seferinde sunucuya sorulur.
import functools, http.server, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else 8000))
HOST = '0.0.0.0' if os.environ.get('PORT') else '127.0.0.1'
GIZLI = ('/serve.py', '/Dockerfile', '/.dockerignore', '/railway.json', '/.railwayignore')


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.wasm': 'application/wasm', '.pck': 'application/octet-stream', '.js': 'text/javascript'}

    def do_GET(self):
        p = self.path.split('?')[0]
        if any(p == g for g in GIZLI):
            self.send_error(404)
            return
        # önceden sıkıştırılmış kopya (.gz) varsa ve tarayıcı kabul ediyorsa onu gönder
        if p.endswith(('.wasm', '.pck', '.js')) and 'gzip' in (self.headers.get('Accept-Encoding') or ''):
            gz = os.path.join(ROOT, p.lstrip('/') + '.gz')
            if os.path.isfile(gz):
                ctype = self.extensions_map.get(os.path.splitext(p)[1], 'application/octet-stream')
                self.send_response(200)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Encoding', 'gzip')
                self.send_header('Content-Length', str(os.path.getsize(gz)))
                self.send_header('Vary', 'Accept-Encoding')
                self.end_headers()
                with open(gz, 'rb') as f:
                    while True:
                        b = f.read(1 << 20)
                        if not b:
                            break
                        self.wfile.write(b)
                return
        super().do_GET()

    def end_headers(self):
        p = self.path.split('?')[0]
        self.send_header('Cache-Control', 'public, max-age=3600' if p.endswith(('.pck', '.wasm')) else 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    srv = http.server.ThreadingHTTPServer((HOST, PORT), functools.partial(Handler, directory=ROOT))
    print(f'Gaziantep 1918-1921 (web): http://{HOST}:{PORT}', flush=True)
    srv.serve_forever()
