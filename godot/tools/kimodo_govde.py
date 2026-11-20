"""Kimodo deneyi için yalın sınama gövdesi: kıyafetsiz MakeHuman bedeni + MakeHuman'ın hazır "mixamo" iskeleti ve
   elle boyanmış CC0 ağırlıkları. Oyundaki karakterlerden bağımsızdır; yalnız hareket aktarımını sınamak içindir.
   blender -b --python godot/tools/kimodo_govde.py -- <cikti.glb>"""
import bpy, sys, math

OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.preferences.addon_enable(module='bl_ext.blender_org.mpfb')
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
import os

AssetService.update_all_asset_lists()
md = TargetService.get_default_macro_info_dict()
md.update({'gender': 1.0, 'age': 0.5, 'weight': 0.5, 'muscle': 0.5, 'height': 0.5})
# detailed_helpers=True ŞART: iskelet MakeHuman'ın 'joint-*' eklem gruplarına oturtulur. False iken gruplar silinir,
# MPFB tanımdaki T duruşu yedek konumlarına düşer ve kemikler A duruşundaki ağın dışında kalır (kollar 45° kayık bükülür).
h = HumanService.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True, feet_on_ground=True, scale=0.1, macro_detail_dict=md)
skin = next(x for x in AssetService.list_mhmat_assets('skins') if os.path.basename(os.path.dirname(x)) == 'middleage_caucasian_male')
HumanService.set_character_skin(skin, h, skin_type='GAMEENGINE', material_instances=False)
rig = HumanService.add_builtin_rig(h, 'mixamo', import_weights=True)
TargetService.bake_targets(h)
bpy.context.view_layer.objects.active = h
for m in list(h.modifiers):
    if m.type == 'MASK':
        bpy.ops.object.modifier_apply(modifier=m.name)
    elif m.type != 'ARMATURE':
        h.modifiers.remove(m)
rig.name = 'Armature'
for g in [g for g in h.vertex_groups if g.name.startswith(('joint-', 'helper-'))]:
    h.vertex_groups.remove(g)                                  # yardımcı gruplar: iskelet oturtulduktan sonra gereksiz
h.name = 'TestGovde'
print('ISKELET', len(rig.data.bones), 'agirlik_grubu', len(h.vertex_groups), 'yuz', len(h.data.polygons))
bpy.ops.object.select_all(action='DESELECT')
h.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        img.scale(1024, 1024)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_image_format='JPEG', export_yup=True)
print('YAZILDI', OUT)
