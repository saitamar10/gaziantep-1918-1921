"""GLB malzemelerinin saydamlık kipini düzeltir (yerinde). MakeHuman'dan gelen beden ve göz BLEND kipinde dışa aktarılıyor:
bu, bedenin kıyafetle yanlış sırada çizilmesine yol açar. Kural: adında 'eyebrow'/'eyelash'/'hair' geçen -> MASK (0,5);
diğer bütün malzemeler -> OPAQUE.
   python godot/tools/glb_alfa.py <dosya.glb>"""
import json, struct, sys
p = sys.argv[1]
raw = open(p, 'rb').read()
jl, = struct.unpack_from('<I', raw, 12)
j = json.loads(raw[20:20 + jl])
binpart = raw[20 + jl:]
for m in j.get('materials', []):
    n = m.get('name', '').lower()
    if any(k in n for k in ('eyebrow', 'eyelash', 'hair')):
        m['alphaMode'] = 'MASK'
        m['alphaCutoff'] = 0.5
    else:
        m.pop('alphaMode', None)
        m.pop('alphaCutoff', None)
    print('MALZEME', m.get('name'), m.get('alphaMode', 'OPAQUE'))
js = json.dumps(j, separators=(',', ':')).encode('utf-8')
js += b' ' * ((4 - len(js) % 4) % 4)
with open(p, 'wb') as f:
    f.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + len(binpart)))
    f.write(struct.pack('<I4s', len(js), b'JSON') + js)
    f.write(binpart)
print('GLB_ALFA', p)
