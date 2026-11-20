"""GLB içindeki gömülü dokuları Godot'nun sorunsuz açtığı biçime yeniden kaydeder (8 bit, en çok 2048 piksel) ve dosyayı yerinde günceller.
   python godot/tools/glb_onar.py <dosya.glb>
Üretilen bazı modellerde 16 bitlik ya da çok büyük PNG'ler Godot'da "image.is_null()" hatası verip modeli dokusuz bırakıyor.
Özgün dosya <ad>.ozgun.glb olarak saklanır. Pillow gerekir."""
import io, json, os, shutil, struct, sys
from PIL import Image

def main():
    path = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 2048
    raw = open(path, 'rb').read()
    jl, = struct.unpack_from('<I', raw, 12)
    j = json.loads(raw[20:20 + jl])
    bo = 20 + jl
    bl, = struct.unpack_from('<I', raw, bo)
    binb = raw[bo + 8: bo + 8 + bl]
    views = j['bufferViews']
    data = [binb[v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']] for v in views]
    for im in j.get('images', []):
        if 'bufferView' not in im:
            continue
        i = im['bufferView']
        img = Image.open(io.BytesIO(data[i]))
        before = (img.mode, img.size, len(data[i]))
        if img.mode in ('I;16', 'I', 'F'):
            img = img.point(lambda v: v / 256).convert('L')
        jpeg = im.get('mimeType') == 'image/jpeg'
        img = img.convert('RGB' if (jpeg or img.mode not in ('RGBA', 'LA')) else 'RGBA')
        if max(img.size) > limit:
            k = limit / max(img.size)
            img = img.resize((round(img.size[0] * k), round(img.size[1] * k)), Image.LANCZOS)
        out = io.BytesIO()
        if jpeg:
            img.save(out, 'JPEG', quality=90)
        else:
            img.save(out, 'PNG', optimize=True)
        data[i] = out.getvalue()
        print('doku', im.get('mimeType'), before, '->', img.mode, img.size, len(data[i]))
    blob = bytearray()
    for v, d in zip(views, data):
        while len(blob) % 4:
            blob.append(0)
        v['byteOffset'] = len(blob)
        v['byteLength'] = len(d)
        blob += d
    while len(blob) % 4:
        blob.append(0)
    j['buffers'][0]['byteLength'] = len(blob)
    js = json.dumps(j, separators=(',', ':')).encode('utf-8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    keep = os.path.splitext(path)[0] + '.ozgun.glb'
    if not os.path.exists(keep):
        shutil.copyfile(path, keep)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(blob)))
        f.write(struct.pack('<I4s', len(js), b'JSON') + js)
        f.write(struct.pack('<I4s', len(blob), b'BIN\0') + bytes(blob))
    print('GLB_ONAR', path, os.path.getsize(path))

main()
