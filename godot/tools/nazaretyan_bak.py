"""Nazaretyan Evi taramasını açar, ölçer, görüntüler.  blender -b --python nazaretyan_bak.py -- <scene.gltf> <cikti_klasoru>"""
import bpy, sys, os, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
src, out = a[0], a[1]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
pts = [o.matrix_world @ Vector(c) for o in ms for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
tri = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in ms)
for im in bpy.data.images:
    if im.size[0] > 2048:
        im.scale(2048, 2048)
print('OLCU m', [round(v, 2) for v in (hi - lo)], 'alt', [round(v, 2) for v in lo], 'ucgen', tri, 'parca', len(ms), flush=True)
c = (lo + hi) / 2
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'FLAT'
sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x, sc.render.resolution_y = 1600, 1000
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c'))
sc.collection.objects.link(cam)
sc.camera = cam
R = (hi - lo).length
views = {'ust': (c + Vector((0, 0, R * 1.2)), (0, 0, 0)),
         'on1': (c + Vector((0, -R * 0.9, R * 0.35)), (math.radians(72), 0, 0)),
         'on2': (c + Vector((R * 0.9, 0, R * 0.35)), (math.radians(72), 0, math.radians(90))),
         'ic': (c + Vector((0, 0, 0.3 - (hi.z - lo.z) / 2 + 1.6)), (math.radians(90), 0, math.radians(30)))}
for k, (loc, rot) in views.items():
    cam.location = loc
    cam.rotation_euler = rot
    cam.data.lens = 18 if k == 'ic' else 28
    sc.render.filepath = os.path.join(out, 'nazaretyan_' + k + '.png')
    bpy.ops.render.render(write_still=True)
print('BAK_OK')
