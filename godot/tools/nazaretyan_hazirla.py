"""Nazaretyan Evi taramasını oyuna hazırlar (CC BY 4.0, Azad Balabanian — godot/docs/KATKIDA_BULUNANLAR.md).
   blender -b --python nazaretyan_hazirla.py -- <scene.gltf> <cikti.glb> <duvar.json> [oran=0.06]
- gök/avlu fotoğraf düzlemi atılır, parçalar sadeleştirilir (Decimate), dokular 2K'ya indirilir
- 1.0 m yükseklikten yatay kesit: duvar çizgileri (Godot çarpışması için), Godot ekseninde [x1,z1,x2,z2]
- köken korunur: zemin z≈0 (Godot y=0)."""
import bpy, bmesh, sys, json
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
src, outg, outj = a[0], a[1], a[2]
ratio = float(a[3]) if len(a) > 3 else 0.06
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name.startswith('Plane_'):
        bpy.data.objects.remove(o, do_unlink=True)
for im in bpy.data.images:
    if im.size[0] > 2048:
        im.scale(2048, 2048)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
tri0 = sum(len(p.vertices) - 2 for o in ms for p in o.data.polygons)
for o in ms:
    m = o.modifiers.new('dec', 'DECIMATE')
    m.ratio = ratio
    m.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier='dec')
tri1 = sum(len(p.vertices) - 2 for o in ms for p in o.data.polygons)
# duvar kesiti (dünya koordinatında)
segs = []
for o in ms:
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.transform(o.matrix_world)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    r = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, 1.0), plane_no=(0, 0, 1))
    for e in [g for g in r['geom_cut'] if isinstance(g, bmesh.types.BMEdge)]:
        p, q = e.verts[0].co, e.verts[1].co
        if (p - q).length > 0.02:
            segs.append([round(p.x, 3), round(-p.y, 3), round(q.x, 3), round(-q.y, 3)])
    bm.free()
pts = [o.matrix_world @ Vector(c) for o in ms for c in o.bound_box]
box = [min(p.x for p in pts), min(-p.y for p in pts), max(p.x for p in pts), max(-p.y for p in pts)]
json.dump({'walls': segs, 'box': [round(v, 3) for v in box], 'floor': 0.0}, open(outj, 'w'))
for o in bpy.context.scene.objects:
    o.select_set(o.type == 'MESH')
bpy.ops.export_scene.gltf(filepath=outg, export_format='GLTF_SEPARATE', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88, export_texture_dir='doku')
print('HAZIR ucgen %d -> %d, duvar parca %d, kutu %s' % (tri0, tri1, len(segs), [round(v, 2) for v in box]), flush=True)
