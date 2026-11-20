"""Geri dönüş noktası: godot klasörünün kaynaklarını (betikler, araçlar, ayar ve doku dosyaları) zip olarak yedekler.
   python godot/tools/yedek.py <etiket>      ör.  python godot/tools/yedek.py asama1_once
Yeniden üretilebilen büyük klasörler (pişirilmiş şehir, içe aktarma önbelleği, ara dosyalar, ölçüm görüntüleri) yedeğe girmez.
Geri dönmek için: zip'i godot klasörünün üstüne açın."""
import os, sys, time, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {'.godot', 'city', 'city_src', 'hero_src', '_out', 'olcum'}

def main():
    label = sys.argv[1] if len(sys.argv) > 1 else 'yedek'
    out_dir = os.path.join(os.path.dirname(ROOT), 'yedek')
    os.makedirs(out_dir, exist_ok=True)
    name = os.path.join(out_dir, 'godot_%s_%s.zip' % (label, time.strftime('%Y%m%d_%H%M')))
    n = 0
    with zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED) as z:
        for d, ds, fs in os.walk(ROOT):
            rel = os.path.relpath(d, ROOT)
            if rel.split(os.sep)[0] in SKIP:
                ds[:] = []
                continue
            for f in fs:
                z.write(os.path.join(d, f), os.path.join(rel, f))
                n += 1
    print('YEDEK %s  %d dosya  %.1f MB' % (name, n, os.path.getsize(name) / 1048576.0))

main()
