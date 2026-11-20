"""Kimodo (NVIDIA) BVH çıktısını Blender'da inceler: iskelet, dinlenme duruşu, ölçek, ileri yön, ayak teması.
   blender -b --python godot/tools/kimodo_incele.py -- <hareket.bvh>
Yalnız okur; hiçbir dosya yazmaz."""
import bpy, sys
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_anim.bvh(filepath=a[0], global_scale=0.01, rotate_mode='NATIVE', update_scene_fps=True, update_scene_duration=True)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
sc = bpy.context.scene
print('KEMIK_SAYISI', len(arm.data.bones), 'KARE', sc.frame_start, sc.frame_end, 'FPS', sc.render.fps)
KEY = ['Root', 'Hips', 'Spine1', 'Spine2', 'Chest', 'Neck1', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
       'LeftLeg', 'LeftShin', 'LeftFoot', 'LeftToeBase', 'RightLeg', 'RightShin', 'RightFoot', 'RightToeBase']
for n in KEY:
    b = arm.data.bones[n]
    print('DINLENME %-14s bas=(%.3f %.3f %.3f) uc=(%.3f %.3f %.3f) ebeveyn=%s' % (n, *b.head_local, *b.tail_local, b.parent.name if b.parent else '-'))
pw = lambda n: arm.matrix_world @ arm.pose.bones[n].head
low = 9.0
for f in range(sc.frame_start, sc.frame_end + 1, 15):
    sc.frame_set(f)
    hp = pw('Hips')
    lf, rf = pw('LeftFoot'), pw('RightFoot')
    lt, rt = pw('LeftToeBase'), pw('RightToeBase')
    hd = pw('Head')
    low = min(low, lf.z, rf.z, lt.z, rt.z)
    print('KARE %3d kalca=(%.2f %.2f %.2f) bas=(%.2f %.2f %.2f) sol_ayak_z=%.3f sag_ayak_z=%.3f sol_parmak_z=%.3f sag_parmak_z=%.3f' % (
        f, *hp, *hd, lf.z, rf.z, lt.z, rt.z))
sc.frame_set(sc.frame_start)
h0 = pw('Hips')
sc.frame_set(sc.frame_end)
h1 = pw('Hips')
d = h1 - h0
print('ILERLEME m=(%.2f %.2f %.2f) hiz_m_sn=%.2f' % (*d, Vector((d.x, d.y)).length / ((sc.frame_end - sc.frame_start) / sc.render.fps)))
print('EN_ALT_AYAK_Z', round(low, 3))
