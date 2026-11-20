"""Antep cephe ve sokak kiti (Blender, gerçek geometri).
   blender -b --python godot/tools/cephe_kiti.py -- <cikti_klasoru>
Her parça ayrı GLB. Eksen (Blender): X duvar boyunca, -Y duvardan dışarı (sokağa), Z yukarı; köken: duvar yüzü, parçanın alt-orta noktası.
glTF'de (Y yukarı) dışarı = +Z olur. Malzemeler yalnız adla gelir (doku gömülmez); Godot bu adlara oyunun malzemelerini bağlar:
  tas, tas_koyu, ahsap, tahta, demir, karanlik, kil, hasir, kilim, kiremit, kirec
Ölçüler Antep geleneksel evlerine göre YAKLAŞIK (söve 18–22 cm, pencere 70×110, kapı 120×220, cumba çıkması 70–90 cm)."""
import bpy, bmesh, sys, os, math
from mathutils import Vector, Matrix

out = sys.argv[sys.argv.index('--') + 1]
os.makedirs(out, exist_ok=True)
MATS = {}
COL = {'tas': (0.78, 0.7, 0.56), 'tas_koyu': (0.3, 0.29, 0.28), 'ahsap': (0.36, 0.25, 0.16), 'tahta': (0.45, 0.33, 0.22), 'demir': (0.08, 0.08, 0.08),
       'karanlik': (0.03, 0.025, 0.02), 'kil': (0.62, 0.36, 0.22), 'hasir': (0.66, 0.55, 0.33), 'kilim': (0.55, 0.12, 0.1), 'kiremit': (0.55, 0.25, 0.15), 'kirec': (0.85, 0.82, 0.76)}


def mat(n):
    if n not in MATS:
        m = bpy.data.materials.new(n)
        m.use_nodes = True
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*COL[n], 1)
        MATS[n] = m
    return MATS[n]


def reset():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)


def box(name, m, sx, sy, sz, x=0, y=0, z=0, rx=0, ry=0, rz=0, bevel=0.0):
    """kenarları sx,sy,sz; merkezi (x,y,z)"""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(sx, sy, sz) * 0.45), segments=1, affect='EDGES', profile=0.5)
    R = Matrix.Rotation(rx, 4, 'X') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rz, 4, 'Z')
    bmesh.ops.transform(bm, matrix=Matrix.Translation((x, y, z)) @ R, verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat(m))
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def cyl(name, m, r, h, x=0, y=0, z=0, seg=10, rx=0, ry=0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h)
    R = Matrix.Rotation(rx, 4, 'X') @ Matrix.Rotation(ry, 4, 'Y')
    bmesh.ops.transform(bm, matrix=Matrix.Translation((x, y, z)) @ R, verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat(m))
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def lathe(name, m, prof, seg=16, x=0, y=0, z=0):
    """prof: [(yarıçap, yükseklik)] alttan üste; kapalı dönel cisim (testi, küp)"""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for r, h in prof:
        ring = [bm.verts.new((x + r * math.cos(2 * math.pi * i / seg), y + r * math.sin(2 * math.pi * i / seg), z + h)) for i in range(seg)]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat(m))
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def arch_ring(name, m, span, rise, thick, depth, x=0, y=0, z=0, seg=9):
    """basık/yarım kemer taşı halkası: iç açıklık span, yükseklik rise; taşlar ayrı (kilit taşı dahil)"""
    objs = []
    R = (span * span / 4 + rise * rise) / (2 * rise)     # basık kemer: daire parçası
    cz = z - (R - rise)
    a0 = math.asin(min(1, span / 2 / R))
    for i in range(seg):
        t0 = -a0 + 2 * a0 * i / seg
        t1 = -a0 + 2 * a0 * (i + 1) / seg
        tm = (t0 + t1) / 2
        k = 1.25 if i == seg // 2 else 1.0
        rin, rout = R, R + thick * k
        L = 2 * rin * math.sin((t1 - t0) / 2) * 0.97
        rc = (rin + rout) / 2
        o = box('%s_%d' % (name, i), m, L, depth, (rout - rin), x + rc * math.sin(tm), y, cz + rc * math.cos(tm), ry=tm, bevel=0.01)
        objs.append(o)
    return objs


def export(name):
    for o in bpy.context.scene.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bpy.context.scene.objects[0]
    if len(bpy.context.scene.objects) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    bpy.ops.object.shade_flat()
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, name + '.glb'), export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT', export_image_format='NONE')
    n = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print('PARCA', name, 'ucgen', n)
    reset()


# ---------------------------------------------------------------- PENCERE (söveli, demir parmaklıklı, kepenkli)
def pencere(name, w=0.72, h=1.05, kepenk=True, kemer=True):
    jw, d = 0.2, 0.09                          # söve genişliği, dışa taşma
    rec = 0.24                                  # pencere boşluğu derinliği hissi: söve önü ile cam arası
    # yanlar (dikmeler) ve eşik
    for sx in (-1, 1):
        box(name + '_dikme', 'tas', jw, d + rec, h + 0.02, sx * (w / 2 + jw / 2), -(d + rec) / 2 + rec * 0.0 - 0.0, h / 2, bevel=0.012)
    box(name + '_esik', 'tas', w + 2 * jw + 0.12, d + rec + 0.06, 0.1, 0, -(d + rec + 0.06) / 2, -0.05, bevel=0.015)
    if kemer:
        arch_ring(name + '_kemer', 'tas', w + 0.04, 0.16, 0.2, d + rec, 0, -(d + rec) / 2, h + 0.02, seg=7)
        box(name + '_ust', 'tas', w + 2 * jw, d + rec, 0.12, 0, -(d + rec) / 2, h + 0.36, bevel=0.01)
        # kemer altı dolgu (karanlık lünet)
        box(name + '_lunet', 'karanlik', w, 0.02, 0.18, 0, -0.005, h + 0.09)
    else:
        box(name + '_lento', 'tas', w + 2 * jw, d + rec, 0.24, 0, -(d + rec) / 2, h + 0.12, bevel=0.012)
    # boşluğun içi: karanlık iç + ahşap kasa + cam bölmeler (duvar düzleminde)
    box(name + '_ic', 'karanlik', w, 0.02, h, 0, -0.005, h / 2)
    for sx in (-1, 0, 1):
        box(name + '_kasa_d', 'ahsap', 0.05, 0.05, h, sx * (w / 2 - 0.025), -0.03, h / 2)
    for zz in (0.03, h / 2, h - 0.03):
        box(name + '_kasa_y', 'ahsap', w, 0.05, 0.05, 0, -0.03, zz)
    # demir parmaklık (söve hizasında, dışarıda)
    yb = -(rec * 0.55)
    for i in range(5):
        x = -w / 2 + w * (i + 0.5) / 5
        cyl(name + '_demir', 'demir', 0.011, h - 0.04, x, yb, h / 2, seg=6)
    for zz in (0.25, h - 0.25):
        box(name + '_demir_y', 'demir', w, 0.012, 0.03, 0, yb, zz)
    if kepenk:
        # yarı açık ahşap kepenkler: menteşe söve dış kenarında
        for sx in (-1, 1):
            hw = w / 2
            ang = sx * math.radians(70)
            px = sx * (w / 2 + jw)
            cx = px + sx * hw / 2 * math.cos(math.radians(70))
            cy = -(d + rec) - hw / 2 * math.sin(math.radians(70))
            box(name + '_kepenk', 'tahta', hw, 0.035, h - 0.04, cx, cy, h / 2, rz=-ang * 0 + sx * math.radians(-70) * -1, bevel=0.005)
            for zz in (0.2, h / 2, h - 0.2):
                box(name + '_kepenk_k', 'ahsap', hw * 0.96, 0.05, 0.06, cx, cy - 0.01 * 0, zz, rz=sx * math.radians(70))
    export(name)


# ---------------------------------------------------------------- KAPI (kemerli taş kapı, çift kanat, demir çivili)
def kapi(name, w=1.2, h=2.1):
    jw, d = 0.26, 0.16
    for sx in (-1, 1):
        box(name + '_dikme', 'tas', jw, d, h, sx * (w / 2 + jw / 2), -d / 2, h / 2, bevel=0.015)
        box(name + '_kaide', 'tas_koyu', jw + 0.06, d + 0.04, 0.35, sx * (w / 2 + jw / 2), -(d + 0.04) / 2, 0.175, bevel=0.02)
    arch_ring(name + '_kemer', 'tas', w, 0.42, 0.28, d, 0, -d / 2, h, seg=9)
    box(name + '_alin', 'tas', w + 2 * jw + 0.1, d + 0.04, 0.12, 0, -(d + 0.04) / 2, h + 0.78, bevel=0.012)
    # kemer içi lünet (taş dolgu); kanatlar ayrı parça (kapi_kanat_sol/sag), burada yalnız açılınca görünen karanlık iç
    box(name + '_lunet', 'tas', w, 0.05, 0.4, 0, -0.06, h + 0.18)
    # kapı ardı giriş (75 cm): yan duvarlar, tavan, döşeme taşı, dipte karanlık — açılan kanatlar burada görünür
    dd = 0.78
    box(name + '_ic', 'karanlik', w, 0.02, h, 0, dd, h / 2)
    for sx in (-1, 1):
        box(name + '_yan', 'tas', 0.06, dd, h, sx * (w / 2 + 0.03), dd / 2, h / 2)
    box(name + '_tavan', 'tas', w + 0.12, dd, 0.08, 0, dd / 2, h + 0.04)
    box(name + '_doseme', 'tas_koyu', w + 0.12, dd, 0.04, 0, dd / 2, 0.02)
    box(name + '_esik', 'tas_koyu', w + 0.2, 0.45, 0.14, 0, -0.225, 0.07, bevel=0.02)
    box(name + '_basamak', 'tas', w + 0.5, 0.35, 0.12, 0, -0.55, 0.06, bevel=0.02)
    export(name)


def kapi_kanat(name, side, w=1.2, h=2.1):
    """tek kapı kanadı; köken menteşe ekseni (zemin hizası, duvar yüzü). side=-1: sol kanat +X'e uzanır, +1: sağ kanat -X'e."""
    lw = w / 2 - 0.01
    cx = -side * lw / 2
    box(name, 'tahta', lw, 0.06, h - 0.02, cx, -0.04, h / 2, bevel=0.006)
    for zz in (0.35, h / 2, h - 0.35):
        box(name + '_kusak', 'ahsap', lw - 0.07, 0.03, 0.08, cx, -0.085, zz)
    for i in range(4):
        for j in range(6):
            cyl(name + '_civi', 'demir', 0.012, 0.02, cx - lw / 2 + 0.09 + i * (lw - 0.18) / 3, -0.08, 0.25 + j * (h - 0.5) / 5, seg=6, rx=math.pi / 2)
    for zz in (0.3, h - 0.3):
        box(name + '_mentese', 'demir', 0.16, 0.02, 0.04, -side * 0.08, -0.075, zz)
    if side > 0:
        cyl(name + '_tokmak', 'demir', 0.05, 0.015, -lw + 0.12, -0.1, h * 0.55, seg=10, rx=math.pi / 2)
    export(name)


# ---------------------------------------------------------------- CUMBA (ahşap çıkma, payandalı, kafesli)
def cumba(name, w=2.6, h=2.2, dp=0.8):
    # taban kirişleri ve döşeme
    box(name + '_doseme', 'ahsap', w + 0.1, dp + 0.05, 0.14, 0, -(dp + 0.05) / 2, 0.07, bevel=0.01)
    # eli böğründe payandalar (çapraz), duvardan tabana
    for sx in (-0.42, 0, 0.42):
        L = math.hypot(dp * 0.85, 0.9)
        a = math.atan2(0.9, dp * 0.85)
        box(name + '_payanda', 'ahsap', 0.12, L, 0.12, sx * w, -dp * 0.85 / 2, -0.45, rx=a, bevel=0.01)
        box(name + '_dikme_alt', 'ahsap', 0.12, 0.1, 0.9, sx * w, -0.05, -0.45)
    # köşe dikmeleri, ara dikmeler, kuşaklar
    for sx in (-1, 1):
        box(name + '_kose', 'ahsap', 0.1, 0.1, h, sx * (w / 2 - 0.05), -dp + 0.05, h / 2 + 0.14)
        box(name + '_yan_dikme', 'ahsap', 0.08, 0.08, h, sx * (w / 2 - 0.04), -0.06, h / 2 + 0.14)
    n = 4
    for i in range(1, n):
        box(name + '_ara', 'ahsap', 0.07, 0.07, h, -w / 2 + w * i / n, -dp + 0.04, h / 2 + 0.14)
    for zz in (0.14 + 0.85, 0.14 + h - 0.06):
        box(name + '_kusak_on', 'ahsap', w, 0.09, 0.09, 0, -dp + 0.045, zz)
        for sx in (-1, 1):
            box(name + '_kusak_yan', 'ahsap', 0.09, dp, 0.09, sx * (w / 2 - 0.045), -dp / 2, zz)
    # alt panolar (tahta) ve üst kafesli pencereler
    box(name + '_pano_on', 'tahta', w - 0.1, 0.04, 0.82, 0, -dp + 0.03, 0.14 + 0.43)
    for sx in (-1, 1):
        box(name + '_pano_yan', 'tahta', 0.04, dp - 0.1, 0.82, sx * (w / 2 - 0.02), -dp / 2, 0.14 + 0.43)
    zw0, zw1 = 0.14 + 0.92, 0.14 + h - 0.12
    box(name + '_cam_on', 'karanlik', w - 0.1, 0.02, zw1 - zw0, 0, -dp + 0.06, (zw0 + zw1) / 2)
    for sx in (-1, 1):
        box(name + '_cam_yan', 'karanlik', 0.02, dp - 0.12, zw1 - zw0, sx * (w / 2 - 0.06), -dp / 2, (zw0 + zw1) / 2)
    # kafes: çapraz çıtalar, pencere dikdörtgenine kırpılmış (ön yüz)
    x0r, x1r = -w / 2 + 0.06, w / 2 - 0.06
    step = 0.14
    for sgn in (1, -1):
        c = -w - (zw1 - zw0)
        while c < w + (zw1 - zw0):
            # doğru: z - zw0 = sgn * (x - c)
            pts = []
            for xx in (x0r, x1r):
                zz = zw0 + sgn * (xx - c)
                if zw0 <= zz <= zw1:
                    pts.append((xx, zz))
            for zz in (zw0, zw1):
                xx = c + (zz - zw0) / sgn
                if x0r <= xx <= x1r:
                    pts.append((xx, zz))
            pts = sorted(set((round(px, 5), round(pz, 5)) for px, pz in pts))
            if len(pts) >= 2:
                (ax, az), (bx, bz) = pts[0], pts[-1]
                L = math.hypot(bx - ax, bz - az)
                if L > 0.05:
                    box(name + '_kafes', 'ahsap', 0.022, 0.018, L, (ax + bx) / 2, -dp + 0.02, (az + bz) / 2, ry=math.atan2(bx - ax, bz - az))
            c += step
    # saçaklı küçük çatı (kiremit) ve tavan
    box(name + '_tavan', 'ahsap', w + 0.3, dp + 0.35, 0.08, 0, -(dp + 0.35) / 2, 0.14 + h + 0.04, bevel=0.01)
    box(name + '_cati', 'kiremit', w + 0.4, dp + 0.45, 0.06, 0, -(dp + 0.45) / 2, 0.14 + h + 0.16, rx=math.radians(-12))
    for i in range(9):
        box(name + '_mertek', 'ahsap', 0.06, 0.4, 0.06, -w / 2 - 0.1 + (w + 0.2) * i / 8, -dp - 0.15, 0.14 + h - 0.02)
    export(name)


# ---------------------------------------------------------------- SAÇAK, KUŞAK, ÇÖRTEN
def sacak(name, L=1.0):
    box(name + '_alin', 'ahsap', L, 0.04, 0.16, 0, -0.62, -0.06)
    box(name + '_tavan', 'tahta', L, 0.62, 0.025, 0, -0.31, 0.0)
    for i in range(2):
        box(name + '_mertek', 'ahsap', 0.07, 0.65, 0.09, -L / 2 + L * (i + 0.25) / 2, -0.32, -0.05)
    box(name + '_kiremit', 'kiremit', L, 0.7, 0.05, 0, -0.33, 0.1, rx=math.radians(-14))
    export(name)


def kusak(name, L=1.0):
    box(name + '_alt', 'tas', L, 0.07, 0.08, 0, -0.035, 0.0)
    box(name + '_ust', 'tas', L, 0.12, 0.07, 0, -0.06, 0.075, bevel=0.015)
    export(name)


def corten(name):
    box(name, 'tas', 0.16, 0.55, 0.14, 0, -0.27, 0, rx=math.radians(-8), bevel=0.02)
    box(name + '_oluk', 'karanlik', 0.07, 0.5, 0.03, 0, -0.3, 0.06, rx=math.radians(-8))
    export(name)


# ---------------------------------------------------------------- SOKAK EŞYALARI (köken: zemin, merkez)
def testi(name):
    lathe(name, 'kil', [(0.0, 0), (0.07, 0.0), (0.11, 0.05), (0.15, 0.15), (0.16, 0.24), (0.13, 0.33), (0.07, 0.4), (0.045, 0.44), (0.05, 0.48), (0.035, 0.49)], seg=14)
    box(name + '_kulp', 'kil', 0.02, 0.1, 0.16, 0.15, 0, 0.36, ry=0.3)
    export(name)


def kup(name):
    lathe(name, 'kil', [(0.0, 0), (0.12, 0.0), (0.25, 0.12), (0.34, 0.38), (0.33, 0.62), (0.24, 0.82), (0.17, 0.9), (0.19, 0.94), (0.16, 0.95)], seg=16)
    export(name)


def sepet(name):
    lathe(name, 'hasir', [(0.0, 0.0), (0.16, 0.0), (0.21, 0.08), (0.24, 0.26), (0.245, 0.28), (0.225, 0.28), (0.22, 0.27)], seg=14)
    lathe(name + '_ic', 'karanlik', [(0.0, 0.25), (0.2, 0.25), (0.21, 0.26)], seg=14)
    for i in range(5):
        cyl(name + '_orgu', 'hasir', 0.243, 0.012, 0, 0, 0.05 + i * 0.05, seg=14)
    export(name)


def sandik(name, w=0.6, d=0.42, h=0.4):
    for zz in range(4):
        box(name + '_on', 'tahta', w, 0.02, h / 4 - 0.01, 0, -d / 2, h / 8 + zz * h / 4, bevel=0.003)
        box(name + '_arka', 'tahta', w, 0.02, h / 4 - 0.01, 0, d / 2, h / 8 + zz * h / 4, bevel=0.003)
    for sx in (-1, 1):
        box(name + '_yan', 'tahta', 0.02, d, h, sx * w / 2, 0, h / 2)
        for sy in (-1, 1):
            box(name + '_kose', 'ahsap', 0.04, 0.04, h, sx * (w / 2 - 0.02), sy * (d / 2 - 0.02), h / 2)
    box(name + '_dip', 'tahta', w, d, 0.02, 0, 0, 0.01)
    export(name)


def sedir(name, L=1.8):
    box(name + '_tas', 'tas', L, 0.55, 0.4, 0, 0, 0.2, bevel=0.02)
    box(name + '_minder', 'kilim', L - 0.06, 0.5, 0.08, 0, 0, 0.44, bevel=0.02)
    box(name + '_yastik', 'kilim', L - 0.1, 0.12, 0.35, 0, 0.24, 0.62, rx=math.radians(-12), bevel=0.04)
    export(name)


def cuval(name):
    lathe(name, 'hasir', [(0.0, 0), (0.18, 0.0), (0.24, 0.12), (0.25, 0.4), (0.21, 0.6), (0.12, 0.66), (0.05, 0.7), (0.0, 0.71)], seg=12)
    export(name)


def kiris_ucu(name):
    # dam kirişi ucu: duvardan 55–65 cm çıkan kaba yontulmuş ahşap (tek parça, köken duvar yüzü)
    box(name, 'ahsap', 0.15, 0.62, 0.17, 0, -0.31, 0, rx=math.radians(-2), bevel=0.02)
    box(name + '_uc', 'ahsap', 0.13, 0.04, 0.15, 0, -0.63, -0.01, bevel=0.01)
    export(name)


def kup_sehpa(name):
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(name + '_ayak', 'ahsap', 0.06, 0.06, 0.78, sx * 0.24, sy * 0.24, 0.39, ry=sx * 0.06, bevel=0.008)
    for zz in (0.18,):
        for sx in (-1, 1):
            box(name + '_kusak', 'ahsap', 0.04, 0.5, 0.04, sx * 0.24, 0, zz)
            box(name + '_kusak2', 'ahsap', 0.5, 0.04, 0.04, 0, sx * 0.24, zz)
    box(name + '_ust', 'tahta', 0.62, 0.62, 0.05, 0, 0, 0.8, bevel=0.01)
    lathe(name + '_kup', 'kil', [(0.0, 0.82), (0.14, 0.82), (0.26, 0.95), (0.3, 1.15), (0.27, 1.32), (0.18, 1.42), (0.15, 1.46), (0.17, 1.49), (0.14, 1.5)], seg=16)
    box(name + '_kapak', 'tahta', 0.3, 0.3, 0.025, 0, 0, 1.51)
    export(name)


def kilim_yer(name):
    box(name, 'kilim', 1.3, 0.8, 0.012, 0, 0, 0.006)
    for sx in (-1, 1):
        for i in range(12):
            box(name + '_saçak', 'hasir', 0.008, 0.06, 0.004, -0.36 + i * 0.065, sx * 0.43, 0.004, rz=math.pi / 2 * 0)
    export(name)


def iskemle(name):
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(name + '_ayak', 'ahsap', 0.035, 0.035, 0.32, sx * 0.15, sy * 0.15, 0.16)
    box(name + '_oturak', 'hasir', 0.36, 0.36, 0.04, 0, 0, 0.33, bevel=0.01)
    export(name)


def el_arabasi(name):
    box(name + '_kasa', 'tahta', 1.4, 0.8, 0.05, 0, 0, 0.55, bevel=0.008)
    for sy in (-1, 1):
        box(name + '_yan', 'tahta', 1.4, 0.04, 0.22, 0, sy * 0.4, 0.68)
    box(name + '_arka', 'tahta', 0.04, 0.8, 0.22, -0.7, 0, 0.68)
    for sy in (-1, 1):
        box(name + '_sap', 'ahsap', 1.1, 0.05, 0.05, 1.1, sy * 0.3, 0.6, ry=math.radians(-6))
        cyl(name + '_teker', 'ahsap', 0.3, 0.06, -0.25, sy * 0.47, 0.3, seg=14, rx=math.pi / 2)
        cyl(name + '_gobek', 'demir', 0.06, 0.1, -0.25, sy * 0.47, 0.3, seg=8, rx=math.pi / 2)
    box(name + '_dingil', 'demir', 0.05, 1.0, 0.05, -0.25, 0, 0.3)
    box(name + '_ayak', 'ahsap', 0.05, 0.05, 0.5, 0.5, 0, 0.27)
    box(name + '_cuval', 'hasir', 0.5, 0.4, 0.25, -0.3, 0.1, 0.7, bevel=0.06)
    export(name)


reset()
pencere('pencere_kemerli_kepenkli')
pencere('pencere_duz', w=0.62, h=0.9, kepenk=False, kemer=False)
pencere('pencere_kemerli', w=0.7, h=1.1, kepenk=False)
kapi('kapi_kemerli')
kapi_kanat('kapi_kanat_sol', -1)
kapi_kanat('kapi_kanat_sag', 1)
cumba('cumba')
cumba('cumba_buyuk', w=4.2, h=2.6, dp=1.1)
sacak('sacak_1m')
kusak('kusak_1m')
corten('corten')
testi('testi')
kup('kup')
sepet('sepet')
sandik('sandik')
sedir('sedir')
cuval('cuval')
kiris_ucu('kiris_ucu')
kup_sehpa('kup_sehpa')
kilim_yer('kilim_yer')
iskemle('iskemle')
el_arabasi('el_arabasi')
print('KIT_OK')
