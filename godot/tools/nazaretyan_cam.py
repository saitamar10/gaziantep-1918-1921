"""Nazaretyan Evi: cam ardında fotoğraflanmış yaprak ve gök gösteren yüzeyleri siler (pencereden gerçek avlu görünsün).
   blender -b --python nazaretyan_cam.py -- <nazaretyan.gltf> <maske_klasoru> <cikti.gltf>
Maske: tools/cam_maske.py ile her doku için (<malzeme>_baseColor.png). Yalnız dikey (|n.z|<0.5) ve 0.4–4.2 m yükseklikteki yüzeyler.
Dokular yeniden yazılmaz (Godot dokuları malzeme adından kendisi bağlar)."""
import bpy, bmesh, sys, os
import numpy as np
a = sys.argv[sys.argv.index('--') + 1:]
src, mdir, outp = a
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
masks = {}


def mask_for(name):
    if name not in masks:
        p = os.path.join(mdir, name + '_baseColor.png')
        if os.path.exists(p):
            im = bpy.data.images.load(p)
            w, h = im.size
            px = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, im.channels)[..., 0]
            masks[name] = px          # Blender piksel dizisi alttan üste (v yukarı)
            bpy.data.images.remove(im)
        else:
            masks[name] = None
    return masks[name]


tot = 0
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    mname = o.data.materials[0].name if o.data.materials else ''
    mk = mask_for(mname)
    if mk is None:
        continue
    H, W = mk.shape
    bm = bmesh.new()
    bm.from_mesh(o.data)
    uvl = bm.loops.layers.uv.active
    mw = o.matrix_world
    kill = []
    for f in bm.faces:
        n = (mw.to_3x3() @ f.normal).normalized()
        z = (mw @ f.calc_center_median()).z
        if abs(n.z) > 0.5 or z < 0.4 or z > 4.2:
            continue
        hits = 0
        pts = [l[uvl].uv for l in f.loops]
        pts.append(sum((p for p in pts), pts[0] * 0) / len(pts))
        for uv in pts:
            x = int(min(W - 1, max(0, uv.x * W)))
            y = int(min(H - 1, max(0, uv.y * H)))
            hits += mk[y, x] > 0.5
        if hits >= 3:
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bm.to_mesh(o.data)
    bm.free()
    tot += len(kill)
    print('CAM', o.name, mname, 'silinen', len(kill), flush=True)
for o in bpy.context.scene.objects:
    o.select_set(o.type == 'MESH')
bpy.ops.export_scene.gltf(filepath=outp, export_format='GLTF_SEPARATE', use_selection=True, export_image_format='NONE')
print('CAM_OK toplam silinen', tot, flush=True)
