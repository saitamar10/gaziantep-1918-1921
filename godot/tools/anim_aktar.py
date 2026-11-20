"""Animasyonları bir iskeletten (Tripo: Fransız askeri) MakeHuman'ın Mixamo adlı iskeletine dünya uzayında aktarır ve pişirir.
   blender -b --python godot/tools/anim_aktar.py -- <kaynak.glb> <hedef_iskeletli.glb> <cikti.glb>
Yöntem (her karede, eşlenen her kemik için):
   hedef_dünya_dönüşü = (Y · kaynak_poz) · (Y · kaynak_dinlenme)⁻¹ · H · hedef_dinlenme
   Y: yön düzeltmesi (kaynağın önü +X, hedefin önü -Y), H: hedef kemiğin dinlenme yönünü kaynak kemiğin dinlenme yönüne
   çeviren en kısa dönüş (T duruşu ile A duruşu arasındaki farkı giderir).
   Kalça konumu: dinlenmeden sapma, kalça yüksekliği oranında ölçeklenir. Eşlenmeyen hedef kemikler (parmaklar) dinlenmede kalır.
Çıktı yalnız iskelet + animasyonlardır (ağ yok); Godot'da "Animation Library" olarak içe aktarılır."""
import bpy, sys, math
from mathutils import Matrix, Quaternion, Vector

a = sys.argv[sys.argv.index('--') + 1:]
SRC, TGT, OUT = a[0], a[1], a[2]
MAP = {  # hedef (mixamo) : kaynak (tripo)
    'Hips': 'Hip', 'Spine': 'Waist', 'Spine1': 'Spine01', 'Spine2': 'Spine02', 'Neck': 'NeckTwist01', 'Head': 'Head',
    'LeftShoulder': 'L_Clavicle', 'LeftArm': 'L_Upperarm', 'LeftForeArm': 'L_Forearm', 'LeftHand': 'L_Hand',
    'RightShoulder': 'R_Clavicle', 'RightArm': 'R_Upperarm', 'RightForeArm': 'R_Forearm', 'RightHand': 'R_Hand',
    'LeftUpLeg': 'L_Thigh', 'LeftLeg': 'L_Calf', 'LeftFoot': 'L_Foot', 'LeftToeBase': 'L_ToeBase',
    'RightUpLeg': 'R_Thigh', 'RightLeg': 'R_Calf', 'RightFoot': 'R_Foot', 'RightToeBase': 'R_ToeBase',
}
CHILD = {'Hips': 'Spine', 'Spine': 'Spine1', 'Spine1': 'Spine2', 'Spine2': 'Neck', 'Neck': 'Head', 'LeftShoulder': 'LeftArm', 'LeftArm': 'LeftForeArm',
         'LeftForeArm': 'LeftHand', 'LeftHand': 'LeftHandMiddle1', 'RightShoulder': 'RightArm', 'RightArm': 'RightForeArm', 'RightForeArm': 'RightHand',
         'RightHand': 'RightHandMiddle1', 'LeftUpLeg': 'LeftLeg', 'LeftLeg': 'LeftFoot', 'LeftFoot': 'LeftToeBase', 'RightUpLeg': 'RightLeg',
         'RightLeg': 'RightFoot', 'RightFoot': 'RightToeBase'}
SCHILD = {'Hip': 'Waist', 'Waist': 'Spine01', 'Spine01': 'Spine02', 'Spine02': 'NeckTwist01', 'NeckTwist01': 'Head', 'L_Clavicle': 'L_Upperarm',
          'L_Upperarm': 'L_Forearm', 'L_Forearm': 'L_Hand', 'R_Clavicle': 'R_Upperarm', 'R_Upperarm': 'R_Forearm', 'R_Forearm': 'R_Hand',
          'L_Thigh': 'L_Calf', 'L_Calf': 'L_Foot', 'L_Foot': 'L_ToeBase', 'R_Thigh': 'R_Calf', 'R_Calf': 'R_Foot', 'R_Foot': 'R_ToeBase'}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=TGT)
tgt = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
tgt.name = 'Armature'
TMESH = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]     # hedef ağı: zemine girme ölçümü için tutulur, dışa aktarmadan önce silinir
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=SRC)
src = next(o for o in bpy.data.objects if o not in before and o.type == 'ARMATURE')
src.name = 'Kaynak'
for o in [o for o in bpy.data.objects if o not in before and o.type == 'MESH']:
    bpy.data.objects.remove(o, do_unlink=True)
for act in list(bpy.data.actions):
    if not act.users:
        pass
src_actions = [act for act in bpy.data.actions if any(fc for fc in getattr(act, 'fcurves', []) ) or True]
src_actions = [act for act in bpy.data.actions]
if tgt.animation_data:
    tgt.animation_data.action = None
P = next((b.name.split(':')[0] + ':' for b in tgt.data.bones if ':' in b.name), '')
if not P and any(b.name.startswith('mixamorig_') for b in tgt.data.bones):
    P = 'mixamorig_'
T = lambda n: tgt.pose.bones[P + n]
S = lambda n: src.pose.bones[n]

## Döngülü gündelik kliplerde kol açısı (derece -> radyan, sol +, sağ -). Atış/diz çökmede iki el tüfekte birleşir: açılmaz.
ACIK_KOL = ('idle', 'walk', 'run', 'agree')
KOL = {n: math.radians(7.0) * (1 if n.startswith('Left') else -1) for n in ('LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand')}
YON = Matrix.Rotation(math.radians(-90), 4, 'Z')      # kaynağın önü +X -> -Y

# ---- dinlenme (iki iskeleti de dinlenmeye al)
def rest_all(o):
    if o.animation_data:
        o.animation_data.action = None
    for pb in o.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
rest_all(src); rest_all(tgt)
bpy.context.view_layer.update()
sw = lambda n: src.matrix_world @ S(n).matrix           # kaynak kemik dünya matrisi
tw = lambda n: tgt.matrix_world @ T(n).matrix
S_REST = {s: YON @ sw(s) for s in MAP.values()}
S_REST_HEAD = {s: (YON @ sw(s)).translation for s in list(MAP.values()) + list(SCHILD.values())}
T_REST = {t: tw(t) for t in MAP}
ALIGN = {}
for t, s in MAP.items():
    tc = CHILD.get(t); sc = SCHILD.get(s)
    if tc and (P + tc) in tgt.pose.bones and sc:
        td = (tw(tc).translation - T_REST[t].translation).normalized()
        sd = ((YON @ sw(sc)).translation - S_REST[s].translation).normalized()
        ALIGN[t] = td.rotation_difference(sd)
    else:
        ALIGN[t] = Quaternion()
src_hip_h = S_REST['Hip'].translation.z - min(S_REST_HEAD[x].z for x in ('L_Foot', 'R_Foot'))
tgt_hip_h = T_REST['Hips'].translation.z - min(tw(x).translation.z for x in ('LeftFoot', 'RightFoot'))
K = tgt_hip_h / max(src_hip_h, 1e-5)
print('OLCEK kalca kaynak=%.3f hedef=%.3f oran=%.3f' % (src_hip_h, tgt_hip_h, K))

# ---- hedef hiyerarşisi (ebeveyn önce) ve dinlenme ilişkileri (iskelet uzayında)
order = sorted(tgt.pose.bones, key=lambda pb: len(pb.parent_recursive))
rest_arm = {pb.name: pb.bone.matrix_local.copy() for pb in tgt.pose.bones}
rel = {pb.name: (rest_arm[pb.parent.name].inverted() @ rest_arm[pb.name]) if pb.parent else rest_arm[pb.name] for pb in tgt.pose.bones}
inv_tw = tgt.matrix_world.inverted()


def mesh_low():
    """Hedef ağın (kemiklerle bükülmüş) en alt noktası, dünya z."""
    dg = bpy.context.evaluated_depsgraph_get()
    low = 1e9
    for o in TMESH:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        mw = ev.matrix_world
        for v in me.vertices:
            z = (mw @ v.co).z
            if z < low:
                low = z
        ev.to_mesh_clear()
    return low


bpy.context.view_layer.update()
REST_MESH_LOW = mesh_low()
print('DINLENME ag_en_alt=%.3f' % REST_MESH_LOW)

tgt.animation_data_create()
done = []
for act in src_actions:
    if act.name.startswith('Armature') and len(src_actions) > 7:
        continue
    src.animation_data_create()
    src.animation_data.action = act
    try:
        src.animation_data.action_slot = act.slots[0]
    except Exception:
        pass
    f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
    new = bpy.data.actions.new(act.name.split('.')[0] if act.name.count('.') == 1 and act.name.split('.')[1].isdigit() else act.name)
    base_name = new.name.split('.')[0]
    LOOP = base_name in ('idle', 'walk', 'run')

    def solve(f, off):
        """f karesinin hedef pozu (iskelet uzayı). off: kalçaya eklenecek dünya uzayı kayması."""
        bpy.context.scene.frame_set(f)
        pose_arm, basis = {}, {}
        for pb in order:
            n = pb.name[len(P):] if pb.name.startswith(P) else pb.name
            parent_pose = pose_arm[pb.parent.name] if pb.parent else Matrix.Identity(4)
            base = parent_pose @ rel[pb.name]
            if n in MAP:
                s = MAP[n]
                sp = YON @ sw(s)
                d = sp.to_quaternion() @ S_REST[s].to_quaternion().inverted()
                wq = d @ ALIGN[n] @ T_REST[n].to_quaternion()
                if n in KOL and base_name in ACIK_KOL:
                    # kol omuzdan dışa açılır (gövde önü ekseni çevresinde): geniş giysiye (şalvar torbası, entari) el girmesin
                    cq = (tgt.matrix_world @ pose_arm[P + 'Spine2']).to_quaternion() @ T_REST['Spine2'].to_quaternion().inverted()
                    wq = Quaternion(cq @ Vector((0.0, -1.0, 0.0)), KOL[n]) @ wq
                rot_arm = inv_tw.to_quaternion() @ wq
                loc = base.translation
                if n == 'Hips':
                    dl = (sp.translation - S_REST[s].translation) * K + off(f)
                    loc = inv_tw @ (T_REST['Hips'].translation + dl)
                want = Matrix.Translation(loc) @ rot_arm.to_matrix().to_4x4()
            else:
                want = base
            pose_arm[pb.name] = want
            basis[pb.name] = base.inverted() @ want if pb.parent else rest_arm[pb.name].inverted() @ want
        return pose_arm, basis

    # 1. geçiş: ayakların en alçak noktası ve kalçanın klip boyunca yatay kayması
    FEET = [P + x for x in ('LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase')]
    rest_low = min((tgt.matrix_world @ rest_arm[b].translation).z for b in FEET)
    low = 1e9
    hip_first = hip_last = None
    hip_sum = Vector()
    for f in range(f0, f1 + 1):
        pa, _ = solve(f, lambda f: Vector())
        low = min(low, min((tgt.matrix_world @ pa[b].translation).z for b in FEET))
        hp = (tgt.matrix_world @ pa[P + 'Hips'].translation)
        hip_first = hp if hip_first is None else hip_first
        hip_last = hp
        hip_sum += hp
    lift = max(-0.1, min(0.1, rest_low - low))                 # ayak zemine otursun (en çok ±10 cm düzeltme)
    drift = (hip_last - hip_first) if LOOP else Vector()
    drift.z = 0.0                                              # döngüler yerinde kalsın: yatay ilerleme düşülür, iniş-çıkış kalır
    span = max(1, f1 - f0)
    # sabit yatay kayma: kaynağın kalçası yerinden ileride/yanda durabilir. Döngülerde ortalama (kayma düşüldükten sonra),
    # diğerlerinde ilk kare dinlenme yerine çekilir; böylece karakter kendi kökünün üstünde durur.
    rest_hip = tgt.matrix_world @ rest_arm[P + 'Hips'].translation
    ref = (hip_sum / (f1 - f0 + 1) - drift * 0.5) if LOOP else hip_first
    center = ref - rest_hip
    center.z = 0.0
    off = lambda f: Vector((0.0, 0.0, lift)) - center - drift * ((f - f0) / span)
    print('DUZELTME %s ayak_kaldirma_cm=%.1f yatay_kayma_cm=%.1f sabit_kayma_cm=%.1f' % (base_name, lift * 100, drift.length * 100, center.length * 100), flush=True)

    # 2. geçiş: düzeltilmiş pozlar toplanır, kaynaktaki sıçramalar süzülür, sonra dörtlük işaret sürekliliğiyle anahtarlanır
    frames = list(range(f0, f1 + 1))
    Q = {pb.name: [] for pb in order}
    HL = []
    for f in frames:
        _, basis = solve(f, off)
        for pb in order:
            Q[pb.name].append(basis[pb.name].to_quaternion())
        HL.append(basis[P + 'Hips'].translation.copy())
    ang = lambda a_, b_: math.degrees(a_.rotation_difference(b_).angle) % 360.0
    angd = lambda a_, b_: min(ang(a_, b_), 360.0 - ang(a_, b_))
    nspike = nseam = 0
    for name, qs in Q.items():
        # tek karelik sıçrama: iki komşusuna da uzak, komşuları birbirine yakın -> ortalarına çekilir
        for i in range(1, len(qs) - 1):
            if angd(qs[i - 1], qs[i]) > 20 and angd(qs[i], qs[i + 1]) > 20 and angd(qs[i - 1], qs[i + 1]) < 20:
                qs[i] = qs[i - 1].slerp(qs[i + 1], 0.5)
                nspike += 1
        # döngü dikişi: son 8 kare, bütün kemiklerde ilk kareye doğru giderek artan ağırlıkla çekilir.
        # Kaynak kopukluğu tek kemikte değil zincir boyunca olabilir (koşuda ön kol + el); hepsi birlikte yumuşar.
        if LOOP and len(qs) > 10:
            k = 8
            end = qs[0]                                        # son kare = ilk kare: döngü sarınca kopukluk olmaz
            if angd(qs[-1], end) > 2:
                for j in range(1, k + 1):
                    w = (j / k) ** 2 * (3 - 2 * (j / k))       # yumuşak (smoothstep) artış
                    qs[-k - 1 + j] = qs[-k - 1 + j].slerp(end, w)
                nseam += 1
    if LOOP and len(HL) > 10:                                 # kalça konumu da dikişte ilk kareye bağlanır
        for j in range(1, 9):
            w = (j / 8) ** 2 * (3 - 2 * (j / 8))
            HL[-9 + j] = HL[-9 + j].lerp(HL[0], w)
    print('SUZGEC %s tek_kare_sicrama=%d dongu_kopmasi=%d' % (base_name, nspike, nseam), flush=True)
    tgt.animation_data.action = new
    prevq = {}
    for i, f in enumerate(frames):
        for pb in order:
            q = Q[pb.name][i].copy()
            if pb.name in prevq and prevq[pb.name].dot(q) < 0.0:   # q ile -q aynı dönüştür; kısa yoldan gitsin
                q.negate()
            prevq[pb.name] = q.copy()
            pb.rotation_mode = 'QUATERNION'
            pb.rotation_quaternion = q
            pb.keyframe_insert('rotation_quaternion', frame=f)
            if pb.name == P + 'Hips':
                pb.location = HL[i]
                pb.keyframe_insert('location', frame=f)
    # 3. geçiş: ağa göre zemin (dünya z=0). Tek seferlik kliplerde (yere yatma, diz çökme) ağ zemine girdiği her karede
    # kalça o kadar kaldırılır (±4 karelik en büyükle genişletilip yumuşatılır, ani zıplama olmaz). Döngülerde tek sabit
    # düzeltme: klibin en alçak ağ noktası zemine değer (ayak ne gömülür ne havada kalır).
    if TMESH:
        lows = []
        for f in frames:
            bpy.context.scene.frame_set(f)
            lows.append(mesh_low())
        if LOOP:
            c = max(-0.1, min(0.1, -min(lows)))
            smooth = [c] * len(lows)
        else:
            need = [max(0.0, -z) for z in lows]
            n_ = len(need)
            wide = [max(need[max(0, i - 4):i + 5]) for i in range(n_)]
            smooth = [sum(wide[max(0, i - 3):i + 4]) / len(wide[max(0, i - 3):i + 4]) for i in range(n_)]
            smooth = [max(a, b) for a, b in zip(smooth, need)]
        if max(abs(x) for x in smooth) > 0.002:
            hb = tgt.pose.bones[P + 'Hips']
            to_local = rest_arm[P + 'Hips'].to_3x3().inverted() @ inv_tw.to_3x3()
            for i, f in enumerate(frames):
                hb.location = HL[i] + to_local @ Vector((0.0, 0.0, smooth[i]))
                hb.keyframe_insert('location', frame=f)
        print('ZEMIN %s en_alt_cm=%.1f kaldirma_cm=%.1f' % (base_name, min(lows) * 100, max(smooth, key=abs) * 100), flush=True)
    done.append((new.name, f1 - f0 + 1))
    print('AKTARILDI', new.name, f1 - f0 + 1, 'kare', flush=True)

for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    bpy.data.objects.remove(o, do_unlink=True)
# ---- yalnız hedef iskelet + eylemler (her eylem bir NLA izine: glTF dışa aktarımı her izi ayrı animasyon yazar)
bpy.data.objects.remove(src, do_unlink=True)
tgt.animation_data.action = None
for name, _ in done:
    base = name.split('.')[0]      # Blender çakışan adlara .001 ekler; animasyon adı kaynağınki olsun
    tr = tgt.animation_data.nla_tracks.new()
    tr.name = base
    st = tr.strips.new(base, int(bpy.data.actions[name].frame_range[0]), bpy.data.actions[name])
    st.name = base
bpy.ops.object.select_all(action='DESELECT')
tgt.select_set(True)
bpy.context.view_layer.objects.active = tgt
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_skins=True, export_yup=True, export_force_sampling=True, export_optimize_animation_size=False)
print('YAZILDI', OUT, [d[0] for d in done])
