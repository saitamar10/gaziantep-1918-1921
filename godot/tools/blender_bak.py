"""Blender'da bir GLB'yi açıp iskelet, ağ ve animasyon bilgisini yazar (denetim).
   blender -b --python godot/tools/blender_bak.py -- <dosya.glb> [<dosya2.glb> ...]"""
import bpy, sys
from mathutils import Vector

for path in sys.argv[sys.argv.index('--') + 1:]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    print('DOSYA', path)
    for o in bpy.data.objects:
        if o.type == 'MESH':
            ws = [o.matrix_world @ Vector(c) for c in o.bound_box]
            mn = Vector((min(w.x for w in ws), min(w.y for w in ws), min(w.z for w in ws)))
            mx = Vector((max(w.x for w in ws), max(w.y for w in ws), max(w.z for w in ws)))
            print('  AG', o.name, 'kose', len(o.data.vertices), 'ucgen~', sum(len(p.vertices) - 2 for p in o.data.polygons), 'min', [round(v, 3) for v in mn], 'max', [round(v, 3) for v in mx], 'grup', len(o.vertex_groups), 'malzeme', [m.name for m in o.data.materials if m])
        if o.type == 'ARMATURE':
            print('  ISKELET', o.name, 'kemik', len(o.data.bones), 'olcek', [round(s, 3) for s in o.scale])
            for bn in ['Hip', 'Head', 'L_Upperarm', 'L_Forearm', 'L_Hand', 'R_Upperarm', 'L_Thigh', 'L_Foot']:
                b = o.data.bones.get(bn)
                if b:
                    h = o.matrix_world @ b.head_local; t = o.matrix_world @ b.tail_local
                    print('    ', bn, 'bas', [round(v, 3) for v in h], 'uc', [round(v, 3) for v in t])
    print('  EYLEM', [(a.name, round(a.frame_range[1] - a.frame_range[0])) for a in bpy.data.actions])
