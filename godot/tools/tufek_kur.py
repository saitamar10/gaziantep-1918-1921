"""Dönem tüfeği (Mauser tipi, ~1,25 m): kişilerin elinde ve sırtında taşınan model.
   blender -b --python godot/tools/tufek_kur.py -- <cikti.glb> [onizleme.png]
Eksen: namlu Blender +Y (Godot -Z, yani düğümün "ileri"si), üst +Z (Godot +Y). Başlangıç noktası kabzada (sağ elin
tuttuğu yer); sol el kundakta yaklaşık 0,36 m öndedir. Dipçik ucu -0,33 m, namlu ağzı +0,92 m."""
import bpy, bmesh, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
OUT = a[0]
PNG = a[1] if len(a) > 1 else ''
bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, col, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1.0)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    return m


AHSAP = mat('ceviz', (0.16, 0.07, 0.025), 0.55)
CELIK = mat('celik', (0.035, 0.035, 0.04), 0.4, 1.0)
DERI = mat('kayis', (0.12, 0.07, 0.035), 0.8)
parts = []


def loft(name, sections, m, n=10):
    """sections: [(y, cx, cz, yarı_genişlik, yarı_yükseklik)] -> kesitlerden yuvarlatılmış kutu tüp (uçlar kapalı)."""
    bm = bmesh.new()
    rings = []
    for (y, cx, cz, hw, hh) in sections:
        ring = []
        for k in range(n):
            t = 2 * math.pi * k / n
            c, s = math.cos(t), math.sin(t)
            # süperelips: köşeleri yumuşak kutu
            px = hw * math.copysign(abs(c) ** 0.6, c)
            pz = hh * math.copysign(abs(s) ** 0.6, s)
            ring.append(bm.verts.new((cx + px, y, cz + pz)))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((r0[k], r0[(k + 1) % n], r1[(k + 1) % n], r1[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    parts.append(ob)
    return ob


def cyl(name, y0, y1, r, cz, m, cx=0.0, seg=12):
    return loft(name, [(y0, cx, cz, r, r), (y1, cx, cz, r, r)], m, n=seg)


# dipçik ve kabza (ceviz): dipçik ucunda geniş, kabzada ince, kundak namlu altında uzanır
loft('dipcik', [
    (-0.33, 0.0, -0.075, 0.021, 0.07), (-0.25, 0.0, -0.06, 0.02, 0.058), (-0.12, 0.0, -0.035, 0.017, 0.038),
    (-0.04, 0.0, -0.02, 0.014, 0.026), (0.0, 0.0, -0.012, 0.014, 0.022)], AHSAP, n=14)
loft('kundak', [
    (0.0, 0.0, -0.01, 0.017, 0.024), (0.12, 0.0, -0.004, 0.019, 0.022), (0.4, 0.0, -0.002, 0.017, 0.018),
    (0.62, 0.0, 0.0, 0.014, 0.014), (0.7, 0.0, 0.003, 0.012, 0.011)], AHSAP, n=14)
loft('ust_el', [(0.2, 0.0, 0.022, 0.011, 0.007), (0.55, 0.0, 0.02, 0.01, 0.006)], AHSAP, n=10)    # namlu üstü ağaç
# mekanizma, namlu, kurma kolu
loft('mekanizma', [(-0.02, 0.0, 0.02, 0.013, 0.014), (0.18, 0.0, 0.02, 0.013, 0.014)], CELIK, n=12)
cyl('namlu', 0.18, 0.92, 0.0095, 0.022, CELIK)
cyl('namlu_agzi', 0.88, 0.92, 0.011, 0.022, CELIK)
loft('kurma_topu', [(0.03, 0.05, 0.014, 0.008, 0.008), (0.042, 0.05, 0.014, 0.008, 0.008)], CELIK, n=10)
loft('tetik_korkuluk', [(-0.03, 0.0, -0.03, 0.004, 0.006), (0.06, 0.0, -0.03, 0.004, 0.006)], CELIK, n=8)
loft('arpacik', [(0.89, 0.0, 0.036, 0.002, 0.006), (0.9, 0.0, 0.036, 0.002, 0.006)], CELIK, n=6)
loft('gez', [(0.24, 0.0, 0.036, 0.009, 0.006), (0.27, 0.0, 0.036, 0.009, 0.006)], CELIK, n=8)
loft('bilezik1', [(0.42, 0.0, 0.009, 0.019, 0.022), (0.44, 0.0, 0.009, 0.019, 0.022)], CELIK, n=12)
loft('bilezik2', [(0.66, 0.0, 0.01, 0.016, 0.019), (0.68, 0.0, 0.01, 0.016, 0.019)], CELIK, n=12)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
rifle = bpy.context.view_layer.objects.active
rifle.name = 'tufek'
print('TUFEK ucgen=%d' % sum(len(p.vertices) - 2 for p in rifle.data.polygons))

if PNG:
    sc = bpy.context.scene
    cam_d = bpy.data.cameras.new('k'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = 1.4
    cam = bpy.data.objects.new('k', cam_d); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (2.0, 0.3, 0.05); cam.rotation_euler = (math.radians(90), 0, math.radians(90))
    l = bpy.data.lights.new('l', 'SUN'); l.energy = 3
    lo = bpy.data.objects.new('l', l); lo.rotation_euler = (math.radians(50), 0, math.radians(60)); sc.collection.objects.link(lo)
    sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.5, 0.5, 0.52)
    sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = 1000; sc.render.resolution_y = 300
    sc.render.filepath = PNG
    bpy.ops.render.render(write_still=True)

bpy.ops.object.select_all(action='DESELECT')
rifle.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_yup=True)
print('YAZILDI', OUT)
