"""Deneme: MPFB (MakeHuman) ile bir insan bedeni üretip ölçülerini ve eklentide hangi varlıkların bulunduğunu yazar.
   blender -b --python godot/tools/mh_dene.py -- <cikti.glb>"""
import bpy, sys, os
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.preferences.addon_enable(module='bl_ext.blender_org.mpfb')
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
from bl_ext.blender_org.mpfb.services.locationservice import LocationService

print('HS', [n for n in dir(HumanService) if not n.startswith('_')])
print('TS', [n for n in dir(TargetService) if not n.startswith('_')][:60])
print('AS', [n for n in dir(AssetService) if not n.startswith('_')])
md = TargetService.get_default_macro_info_dict()
print('MAKRO', md)
for sub in ['skins', 'clothes', 'hair', 'eyes', 'eyebrows', 'eyelashes', 'teeth', 'proxymeshes', 'rigs', 'poses']:
    try:
        lst = AssetService.list_mhclo_assets(sub) if sub not in ('skins',) else AssetService.list_mhmat_assets(sub)
        print('VARLIK', sub, len(lst), [os.path.basename(x) for x in lst][:8])
    except Exception as e:
        print('VARLIK', sub, 'hata', e)
print('YER', LocationService.get_user_data(), LocationService.get_mpfb_data('rigs'))
print('RIG', os.listdir(LocationService.get_mpfb_data('rigs')), os.listdir(os.path.join(LocationService.get_mpfb_data('rigs'), 'standard')) if os.path.isdir(os.path.join(LocationService.get_mpfb_data('rigs'), 'standard')) else '')
h = HumanService.create_human(mask_helpers=True, detailed_helpers=False, extra_vertex_groups=True, feet_on_ground=True, scale=0.1, macro_detail_dict=md)
print('INSAN', h.name, 'kose', len(h.data.vertices), 'boyut', [round(d, 3) for d in h.dimensions], 'grup', len(h.vertex_groups), 'anahtar', len(h.data.shape_keys.key_blocks) if h.data.shape_keys else 0, 'mod', [m.type for m in h.modifiers])
