"""Kit parçalarını yan yana dizip önden-yandan görüntüler.  blender -b --python kit_bak.py -- <klasor> <cikti.png>"""
import bpy, sys, os, glob, math
a = sys.argv[sys.argv.index('--') + 1:]
d, outp = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
x = 0.0
for f in sorted(glob.glob(os.path.join(d, '*.glb'))):
    bpy.ops.import_scene.gltf(filepath=f)
    objs = bpy.context.selected_objects
    w = max(max((o.matrix_world @ v.co).x for v in o.data.vertices) - min((o.matrix_world @ v.co).x for v in o.data.vertices) for o in objs if o.type == 'MESH')
    for o in objs:
        o.location.x += x + w / 2
    x += w + 0.6
# duvar düzlemi
bpy.ops.mesh.primitive_plane_add(size=1, location=(x / 2, 0.01, 1.5), rotation=(math.pi / 2, 0, 0))
bpy.context.object.scale = (x + 2, 4, 1)
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c'))
sc.collection.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = x + 1
cam.location = (x / 2 + 2.5, -14, 2.4)
cam.rotation_euler = (math.radians(86), 0, math.radians(10))
sc.camera = cam
sun = bpy.data.objects.new('s', bpy.data.lights.new('s', 'SUN'))
sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(-30))
sc.collection.objects.link(sun)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_shadows = True
sc.display.shading.show_cavity = True
sc.render.resolution_x, sc.render.resolution_y = 2400, 700
sc.render.filepath = outp
bpy.ops.render.render(write_still=True)
print('BAK_OK')
