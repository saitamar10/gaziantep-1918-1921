"""dokular/ altındaki görsellerin içe aktarma ayarını düzeltir: ekran kartı sıkıştırması + mip haritaları; normal.jpg normal haritası olarak işaretlenir.
   Önce bir kez `godot --headless --path godot --import` çalıştırılmış olmalı (.import dosyaları oluşsun); sonra bu betik, sonra yeniden --import."""
import glob, io, os

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dokular')
n = 0
for f in glob.glob(os.path.join(ROOT, '*', '*.jpg.import')):
    s = io.open(f, encoding='utf-8').read()
    t = s.replace('compress/mode=0', 'compress/mode=2').replace('mipmaps/generate=false', 'mipmaps/generate=true')
    if os.path.basename(f) == 'normal.jpg.import':
        t = t.replace('compress/normal_map=0', 'compress/normal_map=1')
    if t != s:
        io.open(f, 'w', encoding='utf-8', newline='\n').write(t)
        n += 1
print('DOKU_AYAR degisen=%d' % n)
