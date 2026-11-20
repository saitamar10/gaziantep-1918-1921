"""NVIDIA Kimodo (SOMA 77 eklemli iskelet) BVH hareketini MakeHuman'ın Mixamo adlı iskeletine aktarır.
   blender -b --python godot/tools/kimodo_aktar.py -- <hareket.bvh> <hedef_iskeletli.glb> <cikti.glb> <klip_adi> [yerinde=1]

Neden eklem KONUMLARINDAN: Kimodo'nun BVH'sinde kemiklerin yerel eksenleri (dinlenmede bütün kemikler X boyunca uzanır)
NVIDIA'nın kendi T duruşu dosyasındakinden farklı; dönüşleri doğrudan kopyalamak bükülme (twist) hatası verir.
Bu yüzden her karede kaynağın eklem konumları alınır ve her hedef kemik için iki yön eşlenir:
   ana yön  : eklemden çocuk ekleme
   yan yön  : bükülmeyi belirleyen ikinci bir vektör (kalça/omuz/göz hattı, ayak ucu, dirsek bükümü, avuç enlemesi)
   hedef_dünya_dönüşü = B_şimdi · B_dinlenme⁻¹ · hedef_dinlenme_dönüşü     (B: iki yönden kurulan dik eksen takımı)
Kalça konumu bacak uzunluğu oranıyla ölçeklenir. Parmaklar dinlenmede kalır (Kimodo'da parmak hareketi yok sayılır).
Yerinde: döngü için en benzer iki kare aranır (yürüyüş evresi), aradaki yatay ilerleme düşülür; ilerleme hızı yazdırılır."""
import bpy, sys, math
from mathutils import Matrix, Vector, Quaternion

a = sys.argv[sys.argv.index('--') + 1:]
BVH, TGT, OUT, NAME = a[0], a[1], a[2], a[3]
YERINDE = (a[4] != '0') if len(a) > 4 else True

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=TGT)
tgt = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
tgt.name = 'Armature'
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    bpy.data.objects.remove(o, do_unlink=True)
for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)
before = set(bpy.data.objects)
bpy.ops.import_anim.bvh(filepath=BVH, global_scale=0.01, rotate_mode='NATIVE', update_scene_fps=True, update_scene_duration=False)
src = next(o for o in bpy.data.objects if o not in before and o.type == 'ARMATURE')
sc = bpy.context.scene
sact = src.animation_data.action
F0, F1 = int(sact.frame_range[0]), int(sact.frame_range[1])
FPS = sc.render.fps
P = 'mixamorig:' if any(b.name.startswith('mixamorig:') for b in tgt.data.bones) else ('mixamorig_' if any(b.name.startswith('mixamorig_') for b in tgt.data.bones) else '')
T = lambda n: tgt.pose.bones[P + n]

# ---- kaynak eklem konumları (dünya), her kare
NEED = ['Hips', 'Spine1', 'Spine2', 'Chest', 'Neck1', 'Neck2', 'Head', 'HeadEnd', 'LeftEye', 'RightEye']
for s in ('Left', 'Right'):
    NEED += [s + x for x in ('Shoulder', 'Arm', 'ForeArm', 'Hand', 'HandIndex2', 'HandMiddle2', 'HandPinky2', 'Leg', 'Shin', 'Foot', 'ToeBase', 'ToeEnd')]
POS = {}
for f in range(F0, F1 + 1):
    sc.frame_set(f)
    POS[f] = {n: (src.matrix_world @ src.pose.bones[n].head).copy() for n in NEED}

# ---- hedef dinlenme
for pb in tgt.pose.bones:
    pb.matrix_basis = Matrix.Identity(4)
bpy.context.view_layer.update()
TW = {pb.name[len(P):]: tgt.matrix_world @ pb.matrix for pb in tgt.pose.bones}      # dinlenme dünya matrisleri
TH = {n: m.translation.copy() for n, m in TW.items()}
th = lambda n: TH[n]
L_T = (th('LeftUpLeg') - th('RightUpLeg')).normalized()           # hedefin sol yanı
F_T = (th('LeftToeBase') - th('LeftFoot'))
F_T.z = 0.0
F_T.normalize()                                                    # hedefin önü (ayak ucu yönü)
UP_T = Vector((0, 0, 1))

# tablo: hedef kemik -> (kaynak eklem, kaynak çocuk, hedef çocuk ya da None=kemik ekseni, yan_tür)
MAP = {
    'Hips': ('Hips', 'Spine1', 'Spine', 'kalca'),
    'Spine': ('Spine1', 'Spine2', 'Spine1', 'orta'),
    'Spine1': ('Spine2', 'Chest', 'Spine2', 'omuz'),
    'Spine2': ('Chest', 'Neck1', 'Neck', 'omuz'),
    'Neck': ('Neck1', 'Head', 'Head', 'goz'),
    'Head': ('Head', 'HeadEnd', None, 'goz'),
}
for s in ('Left', 'Right'):
    MAP.update({
        s + 'Shoulder': (s + 'Shoulder', s + 'Arm', s + 'Arm', 'gogus_ust'),
        s + 'Arm': (s + 'Arm', s + 'ForeArm', s + 'ForeArm', 'dirsek_' + s),
        s + 'ForeArm': (s + 'ForeArm', s + 'Hand', s + 'Hand', 'avuc_' + s),
        s + 'Hand': (s + 'Hand', s + 'HandMiddle2', s + 'HandMiddle1', 'avuc_' + s),
        # bacaklarda bükülme kalça hattından: ayak ucu ya da baldır, sürüklenen/uzanan ayakta bacak doğrultusuna yaklaşıp
        # tek karelik ters dönmeye (≈156°) yol açıyordu. Dizin büküm yönü zaten eklem konumlarından gelir.
        s + 'UpLeg': (s + 'Leg', s + 'Shin', s + 'Leg', 'kalca'),
        s + 'Leg': (s + 'Shin', s + 'Foot', s + 'Foot', 'kalca'),
        s + 'Foot': (s + 'Foot', s + 'ToeBase', s + 'ToeBase', 'kalca'),
        s + 'ToeBase': (s + 'ToeBase', s + 'ToeEnd', None, 'kalca'),
    })

prev_bend = {}


def side_src(kind, p, tname):
    """Kaynakta yan vektör (karede)."""
    if kind == 'kalca':
        return p['LeftLeg'] - p['RightLeg']
    if kind == 'omuz':
        return p['LeftArm'] - p['RightArm']
    if kind == 'orta':
        return (p['LeftLeg'] - p['RightLeg']).normalized() + (p['LeftArm'] - p['RightArm']).normalized()
    if kind == 'goz':
        return p['LeftEye'] - p['RightEye']
    if kind == 'gogus_ust':
        return p['Neck1'] - p['Chest']
    s = kind.split('_')[1]
    if kind.startswith('dirsek'):
        d = (p[s + 'ForeArm'] - p[s + 'Arm']).normalized()
        f = p[s + 'Hand'] - p[s + 'ForeArm']
        perp = f - d * f.dot(d)
        if perp.length > 0.25 * f.length:                     # dirsek yeterince bükük: büküm düzlemi güvenilir
            prev_bend[tname] = perp.normalized()
        return prev_bend.get(tname, avuc_normal(p, s))
    if kind.startswith('avuc'):
        return p[s + 'HandIndex2'] - p[s + 'HandPinky2']
    if kind.startswith('ayakucu'):
        return p[s + 'ToeBase'] - p[s + 'Foot']
    if kind.startswith('baldir'):
        return p[s + 'Shin'] - p[s + 'Foot']
    raise KeyError(kind)


def avuc_normal(p, s):
    """Dirsek düz iken yedek yön (ilk karede de tanımlı olsun)."""
    return p[s + 'HandIndex2'] - p[s + 'HandPinky2']        # avuç aşağıyken dirsek işaret parmağı yönüne (öne) bükülür


def side_tgt(kind):
    """Hedefin dinlenmesinde aynı fiziksel vektör."""
    if kind in ('kalca', 'omuz', 'orta', 'goz'):
        return L_T
    if kind == 'gogus_ust':
        return th('Neck') - th('Spine2')
    s = kind.split('_')[1]
    if kind.startswith('dirsek'):
        return F_T                                             # T duruşunda dirsek öne doğru bükülür
    if kind.startswith('avuc'):
        return th(s + 'HandIndex1') - th(s + 'HandPinky1')
    if kind.startswith('ayakucu'):
        return th(s + 'ToeBase') - th(s + 'Foot')
    if kind.startswith('baldir'):
        return th(s + 'Leg') - th(s + 'Foot')
    raise KeyError(kind)


def frame3(d, sv):
    d = d.normalized()
    s = (sv - d * sv.dot(d))
    if s.length < 1e-6:
        s = d.orthogonal()
    s.normalize()
    return Matrix((d, s, d.cross(s))).transposed()             # sütunlar: d, s, d×s


B_REST, T_REST_Q = {}, {}
for t, (sj, sc_, tc, kind) in MAP.items():
    tdir = (th(tc) - th(t)) if tc else (TW[t].to_3x3() @ Vector((0, 1, 0)))
    B_REST[t] = frame3(tdir, side_tgt(kind))
    T_REST_Q[t] = TW[t].to_quaternion()

# dirsek yedeği için ön kolun dinlenme ileri yönü hedefte de aynı formülle: T duruşunda avuç aşağı, ön = F_T. Uyum denetimi:
for s in ('Left', 'Right'):
    p0 = POS[F0]
    print('DENETIM %s dirsek_yedek_kaynak=(%.2f %.2f %.2f)' % (s, *avuc_normal(p0, s).normalized()))
print('DENETIM kaynak_sol_yan=(%.2f %.2f %.2f) hedef_sol_yan=(%.2f %.2f %.2f) hedef_on=(%.2f %.2f %.2f)' % (
    *(POS[F0]['LeftLeg'] - POS[F0]['RightLeg']).normalized(), *L_T, *F_T))

# ölçek: bacak uzunluğu
leg_s = (POS[F0]['LeftLeg'] - POS[F0]['LeftShin']).length + (POS[F0]['LeftShin'] - POS[F0]['LeftFoot']).length
leg_t = (th('LeftUpLeg') - th('LeftLeg')).length + (th('LeftLeg') - th('LeftFoot')).length
K = leg_t / leg_s
print('OLCEK bacak kaynak=%.3f hedef=%.3f oran=%.3f' % (leg_s, leg_t, K))


def feat(f):
    p = POS[f]
    h = p['Hips']
    v = []
    for n in ('LeftFoot', 'RightFoot', 'LeftHand', 'RightHand', 'LeftShin', 'RightShin', 'Head', 'LeftToeBase', 'RightToeBase'):
        v.append(p[n] - h)
    return v


# ---- döngü penceresi: en az bir adım çifti (≥ 0,9 sn) uzunlukta, uçları en benzer iki kare; baştaki 0,5 sn atılır
frames = list(range(F0, F1 + 1))
if YERINDE:
    best = None
    lo = F0 + int(0.5 * FPS)
    FE = {f: feat(f) for f in frames}
    for i in range(lo, F1 + 1):
        for j in range(i + int(0.9 * FPS), F1 + 1):
            e = sum((x - y).length for x, y in zip(FE[i], FE[j])) / 9.0
            e += 0.002 * (F1 - j + i - lo) / FPS                 # eşitlikte uzun pencere
            if best is None or e < best[0]:
                best = (e, i, j)
    _, i0, j0 = best
    frames = list(range(i0, j0 + 1))
    print('DONGU kareler %d..%d (%.2f sn) uc_farki_cm=%.1f' % (i0, j0, (j0 - i0) / FPS, best[0] * 100))
fa, fb = frames[0], frames[-1]
drift = POS[fb]['Hips'] - POS[fa]['Hips']
drift.z = 0.0
speed = drift.length * K / max(1e-6, (fb - fa) / FPS)
print('ILERLEME_HIZI_M_SN %.3f' % speed)

order = sorted(tgt.pose.bones, key=lambda pb: len(pb.parent_recursive))
rest_arm = {pb.name: pb.bone.matrix_local.copy() for pb in tgt.pose.bones}
rel = {pb.name: (rest_arm[pb.parent.name].inverted() @ rest_arm[pb.name]) if pb.parent else rest_arm[pb.name] for pb in tgt.pose.bones}
inv_tw = tgt.matrix_world.inverted()
hip0 = POS[fa]['Hips'].copy()


def solve(f, lift):
    p = POS[f]
    W = {}
    for t, (sj, sc_, tc, kind) in MAP.items():
        Bc = frame3(p[sc_] - p[sj], side_src(kind, p, t))
        R = (Bc @ B_REST[t].inverted()).to_quaternion()
        W[t] = R @ T_REST_Q[t]
    hp = p['Hips'] - hip0
    if YERINDE:
        hp -= drift * ((f - fa) / max(1, fb - fa))
    hip_w = Vector((th('Hips').x + hp.x * K, th('Hips').y + hp.y * K, p['Hips'].z * K + lift))
    pose_arm, basis = {}, {}
    for pb in order:
        n = pb.name[len(P):]
        parent_pose = pose_arm[pb.parent.name] if pb.parent else Matrix.Identity(4)
        base = parent_pose @ rel[pb.name]
        if n in W:
            loc = (inv_tw @ hip_w) if n == 'Hips' else base.translation
            want = Matrix.Translation(loc) @ (inv_tw.to_quaternion() @ W[n]).to_matrix().to_4x4()
        else:
            want = base
        pose_arm[pb.name] = want
        basis[pb.name] = (base.inverted() @ want) if pb.parent else (rest_arm[pb.name].inverted() @ want)
    return pose_arm, basis


# ayak zemine: dinlenmedeki ayak bileği yüksekliğine göre en alçak bilek eşitlenir (±10 cm sınır)
rest_ank = min(th('LeftFoot').z, th('RightFoot').z)
low = min(min((tgt.matrix_world @ solve(f, 0.0)[0][P + x].translation).z for x in ('LeftFoot', 'RightFoot')) for f in frames)
lift = max(-0.1, min(0.1, rest_ank - low))
print('AYAK_DUZELTME_CM %.1f' % (lift * 100))

act = bpy.data.actions.new(NAME)
tgt.animation_data_create()
tgt.animation_data.action = act
prevq = {}
Q = {pb.name: [] for pb in order}
HL = []
for f in frames:
    _, basis = solve(f, lift)
    for pb in order:
        Q[pb.name].append(basis[pb.name].to_quaternion())
    HL.append(basis[P + 'Hips'].translation.copy())
if YERINDE:                                                   # son 6 kare ilk kareye yumuşakça bağlanır
    k = 6
    for name, qs in Q.items():
        for j in range(1, k + 1):
            w = (j / k) ** 2 * (3 - 2 * (j / k))
            qs[-k - 1 + j] = qs[-k - 1 + j].slerp(qs[0], w)
    for j in range(1, k + 1):
        w = (j / k) ** 2 * (3 - 2 * (j / k))
        HL[-k - 1 + j] = HL[-k - 1 + j].lerp(HL[0], w)
for i, f in enumerate(frames):
    fr = i + 1
    for pb in order:
        q = Q[pb.name][i].copy()
        if pb.name in prevq and prevq[pb.name].dot(q) < 0.0:
            q.negate()
        prevq[pb.name] = q.copy()
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = q
        pb.keyframe_insert('rotation_quaternion', frame=fr)
        if pb.name == P + 'Hips':
            pb.location = HL[i]
            pb.keyframe_insert('location', frame=fr)
print('AKTARILDI', NAME, len(frames), 'kare', FPS, 'fps')

# ---- denetim: aktarılan iskeletin eklemleri kaynağın (ölçekli) eklemleriyle örtüşüyor mu (kalçaya göre, cm)
CHK = {'LeftForeArm': 'LeftForeArm', 'LeftHand': 'LeftHand', 'RightForeArm': 'RightForeArm', 'RightHand': 'RightHand', 'LeftLeg': 'LeftShin',
       'LeftFoot': 'LeftFoot', 'RightLeg': 'RightShin', 'RightFoot': 'RightFoot', 'Head': 'Head', 'LeftToeBase': 'LeftToeBase'}
worst = {}
for i, f in enumerate(frames):
    sc.frame_set(i + 1)
    hw = tgt.matrix_world @ T('Hips').head
    for t, s_ in CHK.items():
        e = ((tgt.matrix_world @ T(t).head - hw) - (POS[f][s_] - POS[f]['Hips']) * K).length * 100
        if e > worst.get(t, (0, 0))[0]:
            worst[t] = (round(e, 1), f)
print('ORTUSME_EN_KOTU_CM', worst)
jump = (0.0, '')
for name, qs in Q.items():
    for i in range(1, len(qs)):
        d = math.degrees(qs[i - 1].rotation_difference(qs[i]).angle)
        d = min(d, 360 - d)
        if d > jump[0]:
            jump = (round(d, 1), '%s@%d' % (name, i))
print('EN_BUYUK_KARE_DONUSU_DERECE', jump)

bpy.data.objects.remove(src, do_unlink=True)
tgt.animation_data.action = None
tr = tgt.animation_data.nla_tracks.new()
tr.name = NAME
st = tr.strips.new(NAME, 1, act)
st.name = NAME
sc.render.fps = FPS
bpy.ops.object.select_all(action='DESELECT')
tgt.select_set(True)
bpy.context.view_layer.objects.active = tgt
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_skins=True, export_yup=True, export_force_sampling=True, export_optimize_animation_size=False)
print('YAZILDI', OUT)
