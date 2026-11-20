# Geliştirme sunucusu: `python serve.py` -> http://localhost:8000
# Düz `python -m http.server`dan farkı: tarayıcının .js modüllerini önbelleğe almasını engeller.
# (Önbellek, kod güncellendikten sonra eski ve yeni dosyaların karışmasına ve oyunun açılmamasına yol açıyordu.)
import functools, http.server, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
# Barındırmada (Railway vb.) PORT ortam değişkeni verilir ve bütün arayüzler dinlenir; yerelde 127.0.0.1:8000
PORT = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else 8000))
HOST = '0.0.0.0' if os.environ.get('PORT') else '127.0.0.1'
GIZLI = ('/docs/', '/.claude/', '/serve.py', '/Dockerfile', '/.dockerignore', '/railway.json')   # yayında sunulmayan yollar


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        p = self.path.split('?')[0]
        if HOST != '127.0.0.1' and any(p.startswith(g) or p == g for g in GIZLI):
            self.send_error(404)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')   # her yüklemede sunucuya sorulur; değişmediyse 304 döner, eski dosya asla kullanılmaz
        super().end_headers()


if __name__ == '__main__':
    srv = http.server.ThreadingHTTPServer((HOST, PORT), functools.partial(Handler, directory=ROOT))
    print(f'Gaziantep 1918-1921: http://{HOST}:{PORT}', flush=True)
    srv.serve_forever()
