"""Denetim: iskeletli modelin dinlenme duruşundaki ve bir animasyon karesindeki köşe konumlarını ve kemik başlarını dosyaya yazar.
   blender -b --python godot/tools/blender_durus.py -- <iskeletli.glb> <cikti_klasoru> [<iskeletsiz.glb>]"""
import bpy, sys, json, os
a = sys.argv[sys.argv.index('--') + 1:]
src, out = a[0], a[1]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
mesh = next(o for o in bpy.data.objects if o.type == 'MESH' and len(o.vertex_groups) > 0)


def dump(tag):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    me = ev.to_mesh()
    pts = [list(ev.matrix_world @ v.co) for v in me.vertices]
    ev.to_mesh_clear()
    bones = {b.name: list(arm.matrix_world @ b.head) for b in arm.pose.bones}
    json.dump({'p': pts, 'b': bones}, open(os.path.join(out, tag + '.json'), 'w'))
    print('YAZILDI', tag, len(pts))


arm.data.pose_position = 'REST'
bpy.context.view_layer.update()
dump('dinlenme')
arm.data.pose_position = 'POSE'
for an in ['idle', 'walk']:
    act = bpy.data.actions.get(an)
    if act:
        if arm.animation_data is None:
            arm.animation_data_create()
        for t in list(arm.animation_data.nla_tracks):
            t.mute = True
        arm.animation_data.action = act
        try:
            arm.animation_data.action_slot = act.slots[0]
        except Exception as e:
            print('slot', e)
        bpy.context.scene.frame_set(int(act.frame_range[0]) + 5)
        bpy.context.view_layer.update()
        dump(an)
if len(a) > 2:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=a[2])
    m2 = next(o for o in bpy.data.objects if o.type == 'MESH')
    json.dump({'p': [list(m2.matrix_world @ v.co) for v in m2.data.vertices], 'b': {}}, open(os.path.join(out, 'hedef.json'), 'w'))
    print('YAZILDI hedef')
