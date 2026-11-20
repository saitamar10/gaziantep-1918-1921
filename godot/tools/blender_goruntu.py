"""Bir GLB'nin ön / yan / arka görünümünü tek PNG'ye çizer (denetim).
   blender -b --python godot/tools/blender_goruntu.py -- <dosya.glb> <cikti_on_eki>      -> <ek>_on.png, _yan.png, _arka.png"""
import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a[0])
ms = [o for o in bpy.data.objects if o.type == 'MESH']
zs = [(o.matrix_world @ Vector(c)).z for o in ms for c in o.bound_box]
H = max(zs) - min(zs)
z0 = min(zs)
sc = bpy.context.scene
cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
cd.type = 'ORTHO'; cd.ortho_scale = H * 1.12
sd = bpy.data.lights.new('s', 'SUN'); sd.energy = 3.0; sun = bpy.data.objects.new('s', sd); sc.collection.objects.link(sun)
sun.rotation_euler = (math.radians(55), 0, math.radians(-30))
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.55, 0.55, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.7
sc.render.resolution_x = 520; sc.render.resolution_y = 900
sc.render.engine = 'BLENDER_WORKBENCH' if (len(a) > 2 and a[2] == 'wb') else 'BLENDER_EEVEE'
if sc.render.engine == 'BLENDER_WORKBENCH':
    sc.display.shading.color_type = 'TEXTURE'
    sc.display.shading.light = 'STUDIO'
for tag, pos, rz in [('on', (0, -4, z0 + H / 2), 0.0), ('yan', (4, 0, z0 + H / 2), math.radians(90)), ('arka', (0, 4, z0 + H / 2), math.radians(180))]:
    cam.location = pos; cam.rotation_euler = (math.radians(90), 0, rz)
    sc.render.filepath = a[1] + '_' + tag + '.png'
    print('CIZIM', tag, flush=True)
    bpy.ops.render.render(write_still=True)
