import bpy, sys
from mathutils import Vector
src = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in sorted([o for o in bpy.context.scene.objects if o.type == 'MESH'], key=lambda o: o.name):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = [round(min(p[i] for p in pts), 1) for i in range(3)]
    hi = [round(max(p[i] for p in pts), 1) for i in range(3)]
    t = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print('PARCA', o.name, o.data.materials[0].name if o.data.materials else '-', t, lo, hi, flush=True)
