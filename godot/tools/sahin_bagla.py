"""Kullanıcının gönderdiği Şahin Bey ağını (white_mesh.glb: yalnız konum verisi, tek parça, 10 bin üçgen) oyuna hazırlar.
   blender -b --python godot/tools/sahin_bagla.py -- <white_mesh.glb> <cikti.glb> [onizleme.png]
Adımlar:
 1) Boy 1,86 m (kalpak dahil), ayak tabanı z=0, ortalanır; önü -Y (Godot'da +Z).
 2) Eklemler: oransal tahmin -> o yükseklikteki uzuv kesitinin merkezi (yakın köşelerin ortalaması). Mixamo adlı 22 kemik.
    (Eller yumruk hâlinde kaynaşık: parmak kemiği yok.)
 3) Ağırlık: Blender ısı yöntemi; ağırlıksız kalan köşe olursa en yakın kemik kesitine göre uzaklık ağırlığı.
 4) Renk: kullanıcının görseline göre bölge malzemeleri — siyah kalpak, ten, pala bıyık, haki-kahve ceket ve pantolon,
    çapraz fişeklik, fişek kutulu kemer, kahve çizme.
Görünüşte esas kullanıcının modelidir; biçim değiştirilmez."""
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix

a = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = a[0], a[1]
PNG = a[2] if len(a) > 2 else ''
BOY = 1.86

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
ob = next(o for o in bpy.data.objects if o.type == 'MESH')
for o in [o for o in bpy.data.objects if o != ob]:
    bpy.data.objects.remove(o, do_unlink=True)
ob.name = 'K08_sahin_bey'
# dünya dönüşümünü ağa uygula, ölçekle, ayakları z=0'a, ortaya al
ob.data.transform(ob.matrix_world)
ob.matrix_world = Matrix.Identity(4)
vs = ob.data.vertices
lo = Vector([min(v.co[i] for v in vs) for i in range(3)])
hi = Vector([max(v.co[i] for v in vs) for i in range(3)])
k = BOY / (hi.z - lo.z)
ob.data.transform(Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))))
ob.data.transform(Matrix.Scale(k, 4))
ob.data.update()
# biçimi değiştirmeden bir kez böl (her üçgen 4'e): renk bölgelerinin sınırı incelir
bm = bmesh.new()
bm.from_mesh(ob.data)
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, use_grid_fill=True)
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bm.to_mesh(ob.data)
bm.free()
vs = ob.data.vertices
P = [v.co.copy() for v in vs]
H = BOY
print('AG kose=%d boy=%.3f' % (len(P), H))


def center(guess, rz=0.03, rx=0.09, side=0):
    """guess yakınındaki (z bandı ±rz, x farkı < rx, istenirse yalnız bir yan) köşelerin ortası: uzvun kesit merkezi."""
    g = Vector(guess)
    for _ in range(3):
        pts = [p for p in P if abs(p.z - g.z) < rz and abs(p.x - g.x) < rx and (side == 0 or p.x * side > 0.02)]
        if len(pts) < 4:
            return g
        c = sum(pts, Vector()) / len(pts)
        g = Vector((c.x, c.y, g.z))
    return g


f = lambda t: t * H
J = {}
# bacaklar (sol = +X; model -Y'ye bakar)
for S, sg in (('Left', 1), ('Right', -1)):
    J[S + 'UpLeg'] = center((0.09 * sg, 0, f(0.49)), side=sg)
    J[S + 'Leg'] = center((0.13 * sg, 0, f(0.27)), side=sg)
    J[S + 'Foot'] = center((0.15 * sg, 0, f(0.05)), side=sg)
    toe = max((p for p in P if p.z < f(0.03) and p.x * sg > 0.02 and abs(p.x - J[S + 'Foot'].x) < 0.08), key=lambda p: -p.y)
    J[S + 'ToeBase'] = Vector((J[S + 'Foot'].x, (J[S + 'Foot'].y + toe.y) / 2 - 0.02, f(0.015)))
    J[S + 'ToeEnd'] = Vector((J[S + 'Foot'].x, toe.y, f(0.015)))
    # kollar: omuz, dirsek, bilek; el ucu yumruğun alt ucu
    J[S + 'Shoulder'] = center((0.05 * sg, 0, f(0.80)), rx=0.05)
    J[S + 'Shoulder'].x = 0.04 * sg
    J[S + 'Arm'] = center((0.19 * sg, 0, f(0.79)), rz=0.04, rx=0.06, side=sg)
    J[S + 'ForeArm'] = center((0.32 * sg, 0, f(0.635)), rx=0.06, side=sg)
    J[S + 'Hand'] = center((0.37 * sg, 0, f(0.535)), rx=0.06, side=sg)
    fist = [p for p in P if p.x * sg > 0.25 and f(0.43) < p.z < f(0.53)]
    J[S + 'HandEnd'] = (sum(fist, Vector()) / len(fist)) if fist else J[S + 'Hand'] + Vector((0, 0, -0.09))
# diz eklemi kalça-bilek çizgisinin biraz önünde olsun (anatomik; düz duruşta bile bükülme yönü belli olur)
for S in ('Left', 'Right'):
    mid_y = (J[S + 'UpLeg'].y + J[S + 'Foot'].y) / 2
    J[S + 'Leg'].y = min(J[S + 'Leg'].y, mid_y - 0.02)
hipc = (J['LeftUpLeg'] + J['RightUpLeg']) / 2
J['Hips'] = Vector((hipc.x, hipc.y, f(0.53)))
J['Spine'] = center((hipc.x, 0, f(0.59)), rx=0.12)
J['Spine1'] = center((hipc.x, 0, f(0.66)), rx=0.12)
J['Spine2'] = center((hipc.x, 0, f(0.73)), rx=0.12)
J['Neck'] = center((0, 0, f(0.835)), rx=0.08)
J['Head'] = center((0, 0, f(0.865)), rx=0.08)
J['HeadTop'] = Vector((J['Head'].x, J['Head'].y, f(0.985)))
# omurga: kalça ile boyun arasında düz bir çizgi, gövde ortasının 2 cm gerisinde (kesit merkezleri gürültülü)
for n, t_ in (('Spine', 0.25), ('Spine1', 0.5), ('Spine2', 0.75)):
    J[n] = J['Hips'].lerp(J['Neck'], t_)
    J[n].y = J['Hips'].y + 0.02
for n, p in sorted(J.items()):
    print('EKLEM %-14s (%.3f, %.3f, %.3f)' % (n, p.x, p.y, p.z))

# ---- iskelet
arm_d = bpy.data.armatures.new('Armature')
rig = bpy.data.objects.new('Armature', arm_d)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_d.edit_bones
PFX = 'mixamorig:'
BONES = [  # ad, baş, uç, ebeveyn
    ('Hips', 'Hips', 'Spine', None), ('Spine', 'Spine', 'Spine1', 'Hips'), ('Spine1', 'Spine1', 'Spine2', 'Spine'),
    ('Spine2', 'Spine2', 'Neck', 'Spine1'), ('Neck', 'Neck', 'Head', 'Spine2'), ('Head', 'Head', 'HeadTop', 'Neck'),
]
for S in ('Left', 'Right'):
    BONES += [
        (S + 'Shoulder', S + 'Shoulder', S + 'Arm', 'Spine2'), (S + 'Arm', S + 'Arm', S + 'ForeArm', S + 'Shoulder'),
        (S + 'ForeArm', S + 'ForeArm', S + 'Hand', S + 'Arm'), (S + 'Hand', S + 'Hand', S + 'HandEnd', S + 'ForeArm'),
        (S + 'UpLeg', S + 'UpLeg', S + 'Leg', 'Hips'), (S + 'Leg', S + 'Leg', S + 'Foot', S + 'UpLeg'),
        (S + 'Foot', S + 'Foot', S + 'ToeBase', S + 'Leg'), (S + 'ToeBase', S + 'ToeBase', S + 'ToeEnd', S + 'Foot'),
    ]
for n, h_, t_, par in BONES:
    b = eb.new(PFX + n)
    b.head = J[h_]
    b.tail = J[t_]
    if par:
        b.parent = eb[PFX + par]
# burulma: kol ve bacak kemiklerinin z ekseni öne (-Y) baksın; gövde zincirinin z ekseni öne
for b in eb:
    d = (b.tail - b.head).normalized()
    up = Vector((0, -1, 0)) if abs(d.y) < 0.9 else Vector((0, 0, 1))
    b.align_roll(up)
bpy.ops.object.mode_set(mode='OBJECT')

# ---- ağırlık
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
gi = {g.index: g.name for g in ob.vertex_groups}
bos = [v.index for v in ob.data.vertices if not any(g.weight > 0.01 for g in v.groups)]
print('AGIRLIK grup=%d agirliksiz_kose=%d' % (len(ob.vertex_groups), len(bos)))
if bos:
    segs = [(PFX + n, J[h_], J[t_]) for n, h_, t_, _ in BONES]

    def dseg(p, a_, b_):
        ab = b_ - a_
        t = max(0.0, min(1.0, (p - a_).dot(ab) / max(ab.length_squared, 1e-9)))
        return (p - (a_ + ab * t)).length
    for vi in bos:
        p = ob.data.vertices[vi].co
        best = sorted(((dseg(p, a_, b_), n) for n, a_, b_ in segs))[:2]
        w0 = 1.0 / max(best[0][0], 1e-4); w1 = 1.0 / max(best[1][0], 1e-4)
        for (d_, n), w in zip(best, (w0, w1)):
            g = ob.vertex_groups.get(n) or ob.vertex_groups.new(name=n)
            g.add([vi], w / (w0 + w1), 'REPLACE')

# ---- bölge malzemeleri (kullanıcının görseli)
# arka ve yan yüzlerin renkleri kullanıcının görselinden örneklendi (doğrusal renk): ön dokuyla aynı ton
COL = {'kalpak': (0.029, 0.019, 0.011), 'ten': (0.32, 0.17, 0.1), 'biyik': (0.02, 0.014, 0.01),
       'ceket': (0.16, 0.08, 0.033), 'pantolon': (0.18, 0.088, 0.035), 'deri': (0.06, 0.027, 0.011),
       'fiseklik': (0.07, 0.035, 0.015), 'cizme': (0.1, 0.05, 0.025), 'yaka': (0.16, 0.08, 0.033)}
mats = {}
for n, c in COL.items():
    m = bpy.data.materials.new(n)
    m.use_nodes = True
    bs = m.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*c, 1.0)
    bs.inputs['Roughness'].default_value = 0.85 if n not in ('deri', 'fiseklik', 'cizme') else 0.55
    ob.data.materials.append(m)
    mats[n] = len(ob.data.materials) - 1
hand_g = {ob.vertex_groups[PFX + 'LeftHand'].index, ob.vertex_groups[PFX + 'RightHand'].index}
head_front = min(p.y for p in P if f(0.84) < p.z < f(0.9))
KALPAK_ALT = float(a[3]) if len(a) > 3 and '=' not in a[3] else 0.928
NOSE = min((p for p in P if f(0.84) < p.z < f(0.9)), key=lambda p: p.y)      # burun ucu: yüzün en öndeki noktası
print('BURUN', tuple(round(x, 3) for x in NOSE))


def handw(vi):
    return sum(g.weight for g in ob.data.vertices[vi].groups if g.group in hand_g)


def region(poly):
    c = poly.center
    t = c.z / H
    r_head = math.hypot(c.x - J['Head'].x, c.y - J['Head'].y)
    if t > KALPAK_ALT:
        return 'kalpak'
    if t > 0.845:
        if c.y < NOSE.y + 0.045 and NOSE.z - 0.04 < c.z < NOSE.z - 0.008 and abs(c.x - NOSE.x) < 0.05:
            return 'biyik'
        return 'ten'
    if t > 0.815:
        return 'ten' if r_head < 0.058 else 'yaka'        # boyun ten, dik yaka ceket
    for S, sg in (('Left', 1), ('Right', -1)):            # yumruk: bilekten aşağısı
        if c.x * sg > 0.25 and f(0.42) < c.z < J[S + 'Hand'].z - 0.02:
            return 'ten'
    # çapraz fişeklik: sol omuzdan (+X) sağ kalçaya, önde ve arkada
    zt, zb = f(0.80), f(0.585)
    if zb - 0.02 < c.z < zt:
        xl = 0.17 + (-0.15 - 0.17) * (zt - c.z) / (zt - zb)
        if abs(c.x - xl) < 0.035:
            return 'fiseklik'
    if 0.565 < t < 0.6 and abs(c.x - J['Hips'].x) < 0.235:
        return 'deri'                     # kemer (kollar hariç)
    if 0.6 <= t < 0.64 and c.y < -0.06 and abs(c.x) < 0.22:
        return 'deri'                     # fişek kutuları
    if t > 0.47:
        return 'ceket'
    if t > 0.215:
        return 'pantolon'
    return 'cizme'


cnt = {}
for poly in ob.data.polygons:
    r = region(poly)
    poly.material_index = mats[r]
    poly.use_smooth = True
    cnt[r] = cnt.get(r, 0) + 1
print('BOLGE', cnt)

# ---- kullanıcının görseli önden yansıtılır: yüz, bıyık, cepler, düğmeler, fişekler, dolak görselden gelir.
# Ağ bu görselden üretilmiş (aynı duruş), figürün sınır kutusu ağın önden sınır kutusuna oturtulur. Yalnız öne bakan yüzler
# (normal -Y) dokuyu alır; yan ve arka yüzler bölge renklerinde kalır. Doku: referans_sahin_bey/doku_on.jpg (kenarları
# figür rengiyle doldurulmuş kırpım; figür kutusu kırpımda x 20..565 / 585, y 10..1419 / 1429).
RESIM = next((x.split('=', 1)[1] for x in a if x.startswith('resim=')), '')
if RESIM:
    img = bpy.data.images.load(RESIM)
    m = bpy.data.materials.new('on_doku')
    m.use_nodes = True
    nt = m.node_tree
    bs = nt.nodes['Principled BSDF']
    tx = nt.nodes.new('ShaderNodeTexImage')
    tx.image = img
    nt.links.new(tx.outputs['Color'], bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = 0.8
    ob.data.materials.append(m)
    mi = len(ob.data.materials) - 1
    xs_ = [p_.x for p_ in P]
    mx0, mx1 = min(xs_), max(xs_)
    FX0, FX1, FY0, FY1, IW, IH = 20.0, 565.0, 10.0, 1419.0, 585.0, 1429.0
    uv = ob.data.uv_layers.new(name='UVMap')
    for lp in ob.data.loops:
        co = ob.data.vertices[lp.vertex_index].co
        u = (FX0 + (co.x - mx0) / (mx1 - mx0) * (FX1 - FX0)) / IW
        row = FY0 + (H - co.z) / H * (FY1 - FY0)
        uv.data[lp.index].uv = (u, 1.0 - row / IH)
    n_on = 0
    for poly in ob.data.polygons:
        if poly.normal.y < -0.15:         # öne bakan yüzler (yanlar görselden örneklenen bölge renginde)
            poly.material_index = mi
            n_on += 1
    print('ON_DOKU yuz=%d' % n_on)

# ---- önizleme (A duruşu, önden/yandan/arkadan)
if PNG:
    sc = bpy.context.scene
    cam_d = bpy.data.cameras.new('k'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = H * 1.1
    cam = bpy.data.objects.new('k', cam_d); sc.collection.objects.link(cam); sc.camera = cam
    for ang, en in ((20, 3.0), (140, 1.6), (-120, 1.2)):
        l = bpy.data.lights.new('l%d' % ang, 'SUN'); l.energy = en
        lo_ = bpy.data.objects.new('l%d' % ang, l); lo_.rotation_euler = (math.radians(55), 0, math.radians(ang)); sc.collection.objects.link(lo_)
    sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.4, 0.41, 0.43)
    sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = 600; sc.render.resolution_y = 900
    for tag, pos, rz in (('on', (0, -6, H / 2), 0), ('yan', (6, 0, H / 2), 90), ('arka', (0, 6, H / 2), 180)):
        cam.location = pos; cam.rotation_euler = (math.radians(90), 0, math.radians(rz))
        sc.render.filepath = PNG.replace('.png', '_%s.png' % tag)
        bpy.ops.render.render(write_still=True)

bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_yup=True, export_image_format='JPEG')
print('YAZILDI', OUT)
