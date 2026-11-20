"""İskeletli karakter için kalite sınavı (Blender, pencere açmadan).
   blender -b --python godot/tools/rig_sinav.py -- <karakter.glb> <cikti_klasoru>
1) Kemik yerleşimi: her eklemin (omuz, dirsek, bilek, kalça, diz, ayak bileği, omurga, boyun) bedenin o noktadaki kesitinin
   ortasında olup olmadığı ölçülür (sapma / kesit yarıçapı; < 0,35 geçer).
2) Bükme sınavı: dirsek, diz, kalça, omuz, ayak bileği ve gövde dönüşü ayrı ayrı bükülür. Her pozda eklem çevresindeki
   hacmin korunma oranı ölçülür (< 0,75 ezilme sayılır) ve dizin ileri değil geri büküldüğü, ayağın yere gömülmediği denetlenir.
3) Her poz önden ve yandan çizilir (<cikti>/poz_<ad>_on.png, _yan.png) ve tek bir pafta yapılır (<cikti>/sinav.png).
Mixamo adlı iskelet beklenir (mixamorig:...). Karakterin önü -Y, sol yanı +X (MakeHuman)."""
import bpy, sys, os, math, json
from mathutils import Vector, Matrix
from mathutils.kdtree import KDTree

a = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = a[0], a[1]
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
mesh = next(o for o in bpy.data.objects if o.type == 'MESH' and len(o.vertex_groups) > 0)
for o in [o for o in bpy.data.objects if o.type == 'MESH' and o is not mesh]:
    bpy.data.objects.remove(o, do_unlink=True)
if arm.animation_data:
    arm.animation_data.action = None
P = 'mixamorig:'
def B(n):
    b = arm.pose.bones.get(P + n) or arm.pose.bones.get(P.replace(':', '_') + n)
    if b is None:
        raise KeyError(n)
    return b
rapor = {'yerlesim': {}, 'bukme': {}, 'uyari': []}
gidx = {g.name: g.index for g in mesh.vertex_groups}


def posed():
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    me = ev.to_mesh()
    pts = [ev.matrix_world @ v.co for v in me.vertices]
    ev.to_mesh_clear()
    return pts


def joint(n):
    return arm.matrix_world @ B(n).head


def reset():
    for pb in arm.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update()


reset()
REST = posed()
H = max(p.z for p in REST) - min(p.z for p in REST)
zmin = min(p.z for p in REST)

# ---------------------------------------------------------------- 1) kemik yerleşimi
def section(n, child, side):
    J = joint(n)
    d = (joint(child) - J).normalized()
    sel = [p for p in REST if abs((p - J).dot(d)) < 0.02 and (p - J).length < 0.16 and (side == 0 or p.x * side > 0.02)]
    if len(sel) < 12:
        return None
    perp = [(p - J) - d * (p - J).dot(d) for p in sel]
    c = sum(perp, Vector()) / len(perp)
    r = sum(q.length for q in perp) / len(perp)
    return c.length / max(r, 1e-4), r


for name, child, side in [('LeftArm', 'LeftForeArm', 1), ('LeftForeArm', 'LeftHand', 1), ('LeftHand', 'LeftHandMiddle1', 1),
                          ('RightArm', 'RightForeArm', -1), ('RightForeArm', 'RightHand', -1),
                          ('LeftUpLeg', 'LeftLeg', 1), ('LeftLeg', 'LeftFoot', 1), ('LeftFoot', 'LeftToeBase', 1),
                          ('RightUpLeg', 'RightLeg', -1), ('RightLeg', 'RightFoot', -1),
                          ('Spine1', 'Spine2', 0), ('Neck', 'Head', 0)]:
    try:
        r = section(name, child, side)
    except KeyError as e:
        rapor['uyari'].append('kemik yok: %s' % e)
        continue
    if r is None:
        rapor['yerlesim'][name] = 'kesit yok'
        continue
    ok = r[0] < 0.35
    rapor['yerlesim'][name] = {'sapma_orani': round(r[0], 3), 'kesit_yaricap_cm': round(r[1] * 100, 1), 'gecti': ok}

# ---------------------------------------------------------------- 2) bükme sınavı
def rot_world(n, axis, ang):
    pb = B(n)
    h = pb.head.copy()
    pb.matrix = Matrix.Translation(h) @ Matrix.Rotation(ang, 4, axis) @ Matrix.Translation(-h) @ pb.matrix
    bpy.context.view_layer.update()


def bend(n, child_tip, axis, ang, want):
    """want(old_tip, new_tip) -> True ise doğru yön; değilse ters açıyla döner."""
    t0 = joint(child_tip)
    rot_world(n, axis, ang)
    if not want(t0, joint(child_tip)):
        rot_world(n, axis, -2 * ang)


def region(bones, J, rad=0.09):
    ids = [gidx[g] for g in gidx if any(g.endswith(b) for b in bones)]
    out = []
    for v in mesh.data.vertices:
        w = sum(g.weight for g in v.groups if g.group in ids)
        if w > 0.25 and (REST[v.index] - J).length < rad:
            out.append(v.index)
    return out


def keep_ratio(idx, J0, J1, P1):
    if not idx:
        return None
    r0 = sum((REST[i] - J0).length for i in idx) / len(idx)
    r1 = sum((P1[i] - J1).length for i in idx) / len(idx)
    return r1 / max(r0, 1e-5)


FWD = Vector((0, -1, 0))
tests = []


def best_sign(n, axis, ang, score):
    """Bükmeyi iki yöne dener, score() değeri küçük olan yönde bırakır."""
    rot_world(n, axis, ang)
    s1 = score()
    rot_world(n, axis, -2 * ang)
    s2 = score()
    if s1 < s2:
        rot_world(n, axis, 2 * ang)


def t_elbow():      # dirsek: el öne ve yukarı gelir (ön -Y)
    ax = (joint('LeftForeArm') - joint('LeftArm')).normalized().cross(FWD).normalized()
    best_sign('LeftForeArm', ax, math.radians(100), lambda: joint('LeftHand').y - joint('LeftHand').z * 0.5)
    return ('LeftForeArm', ['LeftArm', 'LeftForeArm'])


def t_knee():
    ax = (joint('LeftLeg') - joint('LeftUpLeg')).normalized().cross(FWD).normalized()
    rot_world('LeftLeg', ax, math.radians(100))
    if joint('LeftFoot').y < joint('LeftLeg').y:      # ayak öne gittiyse ters çevir: diz geriye bükülmeli
        rot_world('LeftLeg', ax, math.radians(-200))
    return ('LeftLeg', ['LeftUpLeg', 'LeftLeg'])


def t_hip():
    ax = Vector((1, 0, 0))
    rot_world('LeftUpLeg', ax, math.radians(70))
    if joint('LeftLeg').y > joint('LeftUpLeg').y:
        rot_world('LeftUpLeg', ax, math.radians(-140))
    return ('LeftUpLeg', ['Hips', 'LeftUpLeg'])


def t_shoulder():
    ax = Vector((1, 0, 0))
    rot_world('LeftArm', ax, math.radians(80))
    if joint('LeftForeArm').y > joint('LeftArm').y:
        rot_world('LeftArm', ax, math.radians(-160))
    return ('LeftArm', ['LeftShoulder', 'LeftArm', 'Spine2'])


def t_arms_down():
    for n, s in [('LeftArm', 1), ('RightArm', -1)]:
        rot_world(n, Vector((0, 1, 0)), math.radians(-38) * s)
    return ('LeftArm', ['LeftShoulder', 'LeftArm'])


def t_ankle():
    ax = Vector((1, 0, 0))
    rot_world('LeftFoot', ax, math.radians(30))
    if joint('LeftToeBase').z < joint('LeftFoot').z - 0.02:
        rot_world('LeftFoot', ax, math.radians(-60))
    return ('LeftFoot', ['LeftLeg', 'LeftFoot'])


def t_twist():
    rot_world('Spine1', Vector((0, 0, 1)), math.radians(35))
    return ('Spine1', ['Spine', 'Spine1', 'Spine2'])


def t_crouch():      # çömelme: kalça 90° öne, diz 120° geri; sonra kalça, ayaklar yere değene kadar indirilir
    foot0 = min(joint('LeftFoot').z, joint('RightFoot').z)
    for side in ('Left', 'Right'):
        best_sign(side + 'UpLeg', Vector((1, 0, 0)), math.radians(90), lambda: joint(side + 'Leg').y)
        ax2 = (joint(side + 'Leg') - joint(side + 'UpLeg')).normalized().cross(FWD).normalized()
        best_sign(side + 'Leg', ax2, math.radians(120), lambda: -joint(side + 'Foot').y + abs(joint(side + 'Foot').z - foot0))
    drop = min(joint('LeftFoot').z, joint('RightFoot').z) - foot0
    hb = B('Hips')
    hb.matrix = Matrix.Translation((0, 0, -drop)) @ hb.matrix
    bpy.context.view_layer.update()
    return ('LeftLeg', ['LeftUpLeg', 'LeftLeg'])


def t_stride():      # yürüyüş adımı: sol bacak öne 30°, sağ bacak geri 20°, sağ diz 40°, kollar zıt
    for n, ang in [('LeftUpLeg', 30), ('RightUpLeg', -20)]:
        rot_world(n, Vector((1, 0, 0)), math.radians(ang))
    if joint('LeftLeg').y > joint('LeftUpLeg').y:
        for n, ang in [('LeftUpLeg', -60), ('RightUpLeg', 40)]:
            rot_world(n, Vector((1, 0, 0)), math.radians(ang))
    ax = (joint('RightLeg') - joint('RightUpLeg')).normalized().cross(FWD).normalized()
    rot_world('RightLeg', ax, math.radians(40))
    if joint('RightFoot').y < joint('RightLeg').y:
        rot_world('RightLeg', ax, math.radians(-80))
    return ('LeftUpLeg', ['Hips', 'LeftUpLeg'])


POZLAR = [('dinlenme', None), ('dirsek_100', t_elbow), ('diz_100', t_knee), ('kalca_70', t_hip), ('omuz_80', t_shoulder),
          ('kollar_asagi', t_arms_down), ('bilek_30', t_ankle), ('govde_donus_35', t_twist), ('comelme', t_crouch), ('adim', t_stride)]


def render(tag):
    sc = bpy.context.scene
    if sc.camera is None:
        cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
        cd.type = 'ORTHO'; cd.ortho_scale = H * 1.15
        sd = bpy.data.lights.new('s', 'SUN'); sd.energy = 3.0; sun = bpy.data.objects.new('s', sd); sc.collection.objects.link(sun)
        sun.rotation_euler = (math.radians(55), 0, math.radians(-30))
        w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
        w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.55, 0.55, 1)
        w.node_tree.nodes['Background'].inputs[1].default_value = 0.8
        sc.render.resolution_x = 360; sc.render.resolution_y = 560
        sc.render.engine = 'BLENDER_EEVEE'
        # zemin çizgisi: ayağın yere gömülüp gömülmediği görülsün
        bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, zmin))
        pl = bpy.context.active_object
        pm = bpy.data.materials.new('zemin'); pm.use_nodes = True
        pm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.25, 0.22, 0.2, 1)
        pl.data.materials.append(pm)
    cam = sc.camera
    for side, pos, rz in [('on', (0, -4, zmin + H / 2), 0.0), ('yan', (4, 0, zmin + H / 2), math.radians(90))]:
        cam.location = pos; cam.rotation_euler = (math.radians(90), 0, rz)
        sc.render.filepath = os.path.join(OUT, 'poz_%s_%s.png' % (tag, side))
        bpy.ops.render.render(write_still=True)


for tag, fn in POZLAR:
    reset()
    info = {}
    if fn:
        J0 = None
        jn, bones = fn.__wrapped__() if hasattr(fn, '__wrapped__') else (None, None)
    # poz öncesi eklem konumu
    reset()
    if fn:
        # bükülen eklemin dinlenme konumu, sonra poz
        name_guess = {'dirsek_100': 'LeftForeArm', 'diz_100': 'LeftLeg', 'kalca_70': 'LeftUpLeg', 'omuz_80': 'LeftArm', 'kollar_asagi': 'LeftArm',
                      'bilek_30': 'LeftFoot', 'govde_donus_35': 'Spine1', 'comelme': 'LeftLeg', 'adim': 'LeftUpLeg'}[tag]
        J0 = joint(name_guess)
        jn, bones = fn()
        J1 = joint(jn)
        P1 = posed()
        k = keep_ratio(region(bones, J0), J0, J1, P1)
        info['hacim_korunma'] = round(k, 3) if k is not None else None
        info['ezilme'] = (k is not None and k < 0.75)
        low = min(p.z for p in P1)
        info['en_alt_nokta_cm'] = round((low - zmin) * 100, 1)
        if tag in ('diz_100', 'comelme'):
            info['diz_dogru_yon'] = joint('LeftFoot').y > joint('LeftLeg').y - 0.02
        rapor['bukme'][tag] = info
    render(tag)
    print('POZ', tag, json.dumps(info, ensure_ascii=False), flush=True)

json.dump(rapor, open(os.path.join(OUT, 'rapor.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('RAPOR', json.dumps(rapor, ensure_ascii=False))
