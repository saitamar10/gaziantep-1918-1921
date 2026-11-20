"""Poly Haven'dan (CC0) doku seti indirir:  python godot/tools/doku_indir.py <set_adi>=<polyhaven_adi> ...
   ör.  python godot/tools/doku_indir.py fabric=rough_linen iron=rusty_metal_02
Dosyalar godot/dokular/<set_adi>/ altına albedo.jpg, normal.jpg, roughness.jpg, ao.jpg olarak yazılır (1K)."""
import json, os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dokular')
MAPS = {'Diffuse': 'albedo', 'nor_gl': 'normal', 'Rough': 'roughness', 'AO': 'ao'}
UA = 'texture-fetch/1.0'

def get(url):
    return subprocess.run(['curl', '-s', '-L', '-A', UA, url], capture_output=True).stdout

for arg in sys.argv[1:]:
    key, aid = arg.split('=')
    try:
        d = json.loads(get('https://api.polyhaven.com/files/' + aid).decode('utf-8'))
    except Exception:
        print(key, aid, 'API hatasi'); continue
    os.makedirs(os.path.join(ROOT, key), exist_ok=True)
    got = []
    for m, name in MAPS.items():
        try:
            url = d[m]['1k']['jpg']['url']
        except (KeyError, TypeError):
            continue
        data = get(url)
        if len(data) > 5000 and data[:2] == b'\xff\xd8':
            open(os.path.join(ROOT, key, name + '.jpg'), 'wb').write(data); got.append(name)
    open(os.path.join(ROOT, key, 'KAYNAK.txt'), 'w', encoding='utf-8').write('Poly Haven: https://polyhaven.com/a/%s  (CC0)\n' % aid)
    print(key, aid, got)
