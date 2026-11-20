"""MakeHuman (MPFB) ile sıfırdan karakter kurar: gerçek insan anatomisi + paftaya göre modellenmiş dönem kıyafeti.
   blender -b --python godot/tools/karakter_kur.py -- <karakter_kodu> <cikti.glb> [onizleme.png]
Çıktı iskeletsizdir; ardından tools/karakter_bagla.py ile askerin iskeletine bağlanır.
Kıyafetler bedenin ilgili bölgesinin kopyası dışarı doğru kabartılarak ("kabuk") kurulur; altında kalan beden yüzleri silinir.
Tasarımlar kullanıcının karakter paftasına bakılarak yapılmıştır (antep/docs/ref); yüzler paftadaki kişilere BENZEMEZ."""
import bpy, bmesh, sys, os, math
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
KOD, OUT = a[0], a[1]
PNG = a[2] if len(a) > 2 else ''

# renkler (doğrusal değil, göze göre seçilmiş sRGB): kumaşlar mat
C = {'krem': (0.78, 0.72, 0.6), 'koyu': (0.07, 0.065, 0.06), 'lacivert': (0.07, 0.09, 0.16), 'kahve': (0.2, 0.13, 0.08), 'fes': (0.42, 0.05, 0.05),
     'deri': (0.12, 0.07, 0.04), 'sac': (0.05, 0.04, 0.035), 'gri': (0.3, 0.3, 0.3), 'beyaz': (0.86, 0.84, 0.78), 'siyah': (0.025, 0.025, 0.03),
     'bordo': (0.3, 0.07, 0.07), 'haki': (0.42, 0.38, 0.25), 'ufukmavisi': (0.42, 0.5, 0.6), 'toprak': (0.4, 0.3, 0.2), 'yesil': (0.16, 0.22, 0.14),
     'koyukahve': (0.085, 0.055, 0.04), 'kalpak': (0.035, 0.028, 0.024), 'pirinc': (0.5, 0.36, 0.14), 'dolak': (0.2, 0.14, 0.08), 'kemer': (0.07, 0.045, 0.03), 'kayis': (0.17, 0.1, 0.05),
     'kirli_beyaz': (0.62, 0.58, 0.48), 'kum': (0.5, 0.42, 0.3), 'zeytin': (0.2, 0.22, 0.12), 'mor': (0.18, 0.09, 0.16),
     'kul': (0.33, 0.32, 0.3), 'gok': (0.12, 0.17, 0.26), 'kizil': (0.38, 0.08, 0.05), 'kahverengi': (0.2, 0.12, 0.07), 'gumus': (0.42, 0.4, 0.38)}

KARAKTER = {
    # ad: beden ayarı (cinsiyet 0 kadın..1 erkek, yaş 0.19≈10, 0.5≈25, 0.75≈55, 1≈90), ten, giysiler
    'K02_sehirli_erkek': {'govde': {'gender': 1.0, 'age': 0.62, 'weight': 0.55, 'muscle': 0.45, 'height': 0.5}, 'ten': 'middleage_caucasian_male',
                          'giysi': [('ceket', 'koyu'), ('gogus', 'krem'), ('salvar', 'lacivert'), ('kusak', 'krem'), ('ayakkabi', 'deri'), ('fes', 'fes'), ('sac', 'sac'), ('biyik', 'sac')]},
    # Şahin Bey (Mehmet Sait), Kuvâ-yi Milliye: pafta K08. 1877 doğumlu -> 1920'de 43 yaşında. Dönemin milis giyimi (kullanıcı kararı):
    # kürk kalpak, uyluk ortasına inen koyu kahve cepken, çapraz fişeklik, tokalı deri kemer, dize kadar bol potur,
    # dizden aşağı dolak, kahve ayakkabı, kalın pala bıyık. Tüfek oyunda ayrı (npc.gd).
    'K08_sahin_bey': {'govde': {'gender': 1.0, 'age': 0.6, 'weight': 0.5, 'muscle': 0.62, 'height': 0.56}, 'ten': 'middleage_caucasian_male',
                      'giysi': [('cepken', 'koyukahve'), ('potur', 'koyukahve'), ('dolak', 'dolak'), ('ayakkabi', 'deri'), ('kemer', 'kemer'),
                                ('fiseklik', 'kayis'), ('kalpak', 'kalpak'), ('sac', 'sac'), ('pala_biyik', 'sac')]},
    # Çarşı ve mahalle halkı (kullanıcının gösterdiği hazır paket havasında; tasarım: entari, aba, sarık, başörtüsü, çarşaf)
    'K16_yasli_sarikli': {'govde': {'gender': 1.0, 'age': 0.88, 'weight': 0.45, 'muscle': 0.35, 'height': 0.45}, 'ten': 'old_caucasian_male',
                          'giysi': [('entari', 'kirli_beyaz'), ('aba', 'zeytin'), ('kusak', 'kum'), ('ayakkabi', 'deri'), ('sarik', 'kirli_beyaz'), ('sakal', 'gumus'), ('biyik', 'gumus')]},
    'K17_carsafli_kadin': {'govde': {'gender': 0.0, 'age': 0.55, 'weight': 0.5, 'muscle': 0.3, 'height': 0.45}, 'ten': 'middleage_caucasian_female',
                           'giysi': [('entari', 'siyah'), ('carsaf', 'siyah'), ('ayakkabi', 'deri')]},
    'K18_kizil_abali': {'govde': {'gender': 1.0, 'age': 0.65, 'weight': 0.55, 'muscle': 0.45, 'height': 0.5}, 'ten': 'middleage_caucasian_male',
                        'giysi': [('entari', 'kirli_beyaz'), ('aba', 'kizil'), ('kusak', 'kahverengi'), ('ayakkabi', 'deri'), ('sarik', 'kul'), ('sakal', 'sac'), ('biyik', 'sac')]},
    'K19_gok_abali': {'govde': {'gender': 1.0, 'age': 0.45, 'weight': 0.45, 'muscle': 0.5, 'height': 0.55}, 'ten': 'young_caucasian_male',
                      'giysi': [('entari', 'kum'), ('aba', 'gok'), ('kusak', 'kizil'), ('ayakkabi', 'deri'), ('sarik', 'kirli_beyaz'), ('biyik', 'sac')]},
    'K20_basortulu_kadin': {'govde': {'gender': 0.0, 'age': 0.45, 'weight': 0.45, 'muscle': 0.3, 'height': 0.4}, 'ten': 'young_caucasian_female',
                            'giysi': [('entari', 'mor'), ('ayakkabi', 'deri'), ('basortu', 'kirli_beyaz')]},
}
cfg = KARAKTER[KOD]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.preferences.addon_enable(module='bl_ext.blender_org.mpfb')
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService

AssetService.update_all_asset_lists()
md = TargetService.get_default_macro_info_dict()
md.update(cfg['govde'])
md['race'] = {'asian': 0.0, 'caucasian': 1.0, 'african': 0.0}
# detailed_helpers=True: MakeHuman'ın joint-* eklem yardımcıları kalır; mixamo iskeleti kemikleri bunlara oturtur.
# False olursa iskelet tanımdaki T duruşu konumlarına düşer, ağ A duruşundadır (bilek 42 cm sapıyordu).
h = HumanService.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True, feet_on_ground=True, scale=0.1, macro_detail_dict=md)


def find(sub, name):
    lst = AssetService.list_mhmat_assets(sub) if sub == 'skins' else AssetService.list_mhclo_assets(sub)
    return next(x for x in lst if os.path.basename(os.path.dirname(x)) == name)


HumanService.set_character_skin(find('skins', cfg['ten']), h, skin_type='GAMEENGINE', material_instances=False)
extra = []
for typ, sub, name in [('Eyes', 'eyes', 'low-poly'), ('Eyebrows', 'eyebrows', 'eyebrow001')]:      # dişler yok: ağız kapalı, 3.500 yüz tasarruf
    try:
        before = set(bpy.data.objects)
        HumanService.add_mhclo_asset(find(sub, name), h, asset_type=typ, subdiv_levels=0, material_type='GAMEENGINE', set_up_rigging=False, interpolate_weights=False, import_subrig=False, import_weights=False)
        extra += [o for o in bpy.data.objects if o not in before]
    except Exception as e:
        print('AKSESUAR', typ, 'eklenemedi:', e)

# ---- İSKELET: MakeHuman'ın hazır "mixamo" iskeleti ve bu beden için elle boyanmış ağırlıkları (CC0, MPFB ile gelir).
# İskelet uydurulmaz, otomatik ağırlık kullanılmaz. Kemik adları Mixamo'nunkiyle aynıdır: Godot'nun insan profiline doğrudan eşlenir.
rig = HumanService.add_builtin_rig(h, 'mixamo', import_weights=True)
TargetService.bake_targets(h)
bpy.context.view_layer.objects.active = h
for m in list(h.modifiers):
    if m.type == 'MASK':
        bpy.ops.object.modifier_apply(modifier=m.name)
    elif m.type != 'ARMATURE':
        h.modifiers.remove(m)
for g in [g for g in h.vertex_groups if g.name.startswith(('joint-', 'helper-'))]:
    h.vertex_groups.remove(g)          # maske uygulandı: yardımcı köşeler gitti, boş gruplar dışa aktarılmasın
rig.name = 'Armature'
print('ISKELET', rig.name, 'kemik', len(rig.data.bones), 'agirlik grubu', len(h.vertex_groups))


def iskeleti_aga_oturt():
    """MPFB'nin mixamo iskeleti T duruşunda ve ayakları bitişik gelir; MakeHuman ağı A duruşunda, ayaklar açıktır. Deri bu
    hâliyle bağlanırsa eklemler ağın dışında döner (bilek 42 cm, parmaklar 50-60 cm sapıyordu). Kol, el, parmak ve bacak
    zincirlerinin eklemleri ağın kendi eklem yerine taşınır: eklem = iki komşu kemiğin ağırlık geçiş bölgesinin merkezi
    (ikisinin de ağırlığı > 0,15 olan köşeler). Ağ ve ağırlıklar değişmez; dinlenme = bağlama duruşu = ağın duruşu olur.
    Omurga ve kalça eklemi taşınmaz (omurga gövdenin arkasındadır, geçiş halkasının merkezi değil)."""
    P = next((b.name.split(':')[0] + ':' for b in rig.data.bones if ':' in b.name), '')
    gi = {g.name: g.index for g in h.vertex_groups}
    W = {}
    for v in h.data.vertices:
        for e in v.groups:
            W.setdefault(e.group, {})[v.index] = e.weight
    inv = rig.matrix_world.inverted()

    def J(a, b):
        A = W.get(gi.get(P + a, -1), {}); B = W.get(gi.get(P + b, -1), {})
        pts = [h.matrix_world @ h.data.vertices[i].co for i in A if i in B and A[i] > 0.15 and B[i] > 0.15]
        return inv @ (sum(pts, Vector()) / len(pts)) if len(pts) >= 3 else None

    # kemik: (baş eklemi, uç eklemi); None = baş yerinde kalır / uç önceki kemiğin yönünde eski uzunlukta uzatılır
    T = {}
    for S in ('Left', 'Right'):
        T[S + 'Arm'] = (None, (S + 'Arm', S + 'ForeArm'))
        T[S + 'ForeArm'] = ((S + 'Arm', S + 'ForeArm'), (S + 'ForeArm', S + 'Hand'))
        T[S + 'Hand'] = ((S + 'ForeArm', S + 'Hand'), (S + 'Hand', S + 'HandMiddle1'))
        for f in ('Thumb', 'Index', 'Middle', 'Ring', 'Pinky'):
            n1, n2, n3 = [S + 'Hand' + f + str(k) for k in (1, 2, 3)]
            T[n1] = ((S + 'Hand', n1), (n1, n2))
            T[n2] = ((n1, n2), (n2, n3))
            T[n3] = ((n2, n3), None)
        T[S + 'UpLeg'] = (None, (S + 'UpLeg', S + 'Leg'))
        T[S + 'Leg'] = ((S + 'UpLeg', S + 'Leg'), (S + 'Leg', S + 'Foot'))
        T[S + 'Foot'] = ((S + 'Leg', S + 'Foot'), (S + 'Foot', S + 'ToeBase'))
        T[S + 'ToeBase'] = ((S + 'Foot', S + 'ToeBase'), None)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    eb = rig.data.edit_bones
    old = {b.name: (b.head.copy(), b.tail.copy(), b.z_axis.copy()) for b in eb}
    cache = {}
    def JJ(pair):
        if pair not in cache:
            cache[pair] = J(*pair)
        return cache[pair]
    for b in eb:
        b.use_connect = False
    moved = 0
    for n, (hp, tp) in T.items():
        if (P + n) not in eb:
            continue
        bone = eb[P + n]
        oh, ot, oz = old[P + n]
        hj = JJ(hp) if hp else None
        tj = JJ(tp) if tp else None
        if hp and hj is None or tp and tj is None:
            print('OTURTMA atlandi', n)
            continue
        if hj is not None:
            bone.head = hj
        if tj is not None:
            bone.tail = tj
        elif n.endswith('ToeBase'):
            bone.tail = bone.head + (ot - oh)
        else:                                  # parmak ucu: önceki boğumun yönünde
            pb = eb[P + hp[0]]
            bone.tail = bone.head + (bone.head - pb.head).normalized() * (ot - oh).length
        od = (ot - oh).normalized()
        nd = (bone.tail - bone.head).normalized()
        bone.align_roll(od.rotation_difference(nd) @ oz)   # burulma, yönle birlikte döner
        moved += 1
    bpy.ops.object.mode_set(mode='OBJECT')
    print('OTURTMA kemik=%d' % moved)


if '--oturt' in a:
    iskeleti_aga_oturt()      # yedek yol: eklem yardımcıları yoksa ağırlık geçişlerinden oturtma


def part(nm):
    n = nm.lower()
    if 'head' in n or 'neck' in n or 'jaw' in n or 'eye' in n or 'tongue' in n:
        return 'bas'
    if any(k in n for k in ('hand', 'thumb', 'index', 'middle', 'ring', 'pinky', 'finger')):
        return 'el'
    if 'upperarm' in n or 'lowerarm' in n or 'forearm' in n or n.endswith('arm'):
        return 'kol'
    if 'thigh' in n or 'calf' in n or 'shin' in n or 'leg' in n:
        return 'bacak'
    if 'foot' in n or 'toe' in n or 'ball' in n:
        return 'ayak'
    if any(k in n for k in ('spine', 'pelvis', 'hips', 'root', 'breast', 'clavicle', 'shoulder', 'chest')):
        return 'govde'
    return ''


gnames = {g.index: part(g.name) for g in h.vertex_groups}
REG = []
for v in h.data.vertices:
    best, bw = '', 0.0
    acc = {}
    for g in v.groups:
        p = gnames.get(g.group, '')
        if p:
            acc[p] = acc.get(p, 0.0) + g.weight
    for p, w in acc.items():
        if w > bw:
            best, bw = p, w
    REG.append(best)
scalp = h.vertex_groups.get('scalp')
SCALP = set()
if scalp:
    for v in h.data.vertices:
        if any(g.group == scalp.index and g.weight > 0.3 for g in v.groups):
            SCALP.add(v.index)
H = max(v.co.z for v in h.data.vertices)
print('BEDEN boy=%.3f kose=%d bolgeler=%s grup=%s' % (H, len(h.data.vertices), {p: REG.count(p) for p in set(REG)}, [g.name for g in h.vertex_groups][:40]))
head_v = [v.co for v in h.data.vertices if REG[v.index] == 'bas']
head_top = max(c.z for c in head_v)
top_ring = [c for c in head_v if c.z > head_top - 0.05]
hc = Vector((sum(c.x for c in top_ring) / len(top_ring), sum(c.y for c in top_ring) / len(top_ring), head_top))
wrist_z = {}


def mat(name, col, rough=0.9, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (col[0], col[1], col[2], 1.0)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    return m


pieces = []
covered = set()


def shell(name, keep, offset, col, smooth=2, hide=True, edge=False, metal=0.0, rough=0.9):
    """Bedenin keep(vi, co) koşulunu sağlayan yüzlerinden kabuk; offset: sabit ya da (vi, co) -> metre."""
    bm = bmesh.new()
    bm.from_mesh(h.data)
    bm.verts.ensure_lookup_table()
    ok = [keep(v.index, v.co) for v in bm.verts]
    off = [(offset(v.index, v.co) if callable(offset) else offset) for v in bm.verts]
    dele = [f for f in bm.faces if not all(ok[v.index] for v in f.verts)]
    if hide:
        for f in bm.faces:
            if all(ok[v.index] for v in f.verts):
                covered.update(v.index for v in f.verts)
    keepv = {v: off[v.index] for v in bm.verts}
    bmesh.ops.delete(bm, geom=dele, context='FACES')
    bm.normal_update()
    base = {v: (v.co.copy(), v.normal.copy()) for v in bm.verts}
    for v in bm.verts:
        v.co += v.normal * keepv[v]
    if smooth:
        for _ in range(smooth):
            bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if edge or not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
            # yumuşatma kabuğu içeri çeker: hiçbir köşe bedene istenen mesafenin %80'inden fazla yaklaşamaz (alttaki katman taşmasın)
            for v in bm.verts:
                o, n = base[v]
                d = (v.co - o).dot(n)
                lim = keepv[v] * 0.8
                if d < lim:
                    v.co += n * (lim - d)
    for lay in list(bm.verts.layers.shape.values()):
        bm.verts.layers.shape.remove(lay)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for g in h.vertex_groups:      # kabuk bedenin köşelerinden doğar: ağırlıkları da bedeninkidir (aynı grup sırası gerekir)
        ob.vertex_groups.new(name=g.name)
    ob['agirlikli'] = True
    me.materials.clear()
    me.materials.append(mat(name, C[col], rough, metal))
    for p in me.polygons:
        p.use_smooth = True
    pieces.append(ob)
    return ob


def solid(name, mesh_fn, col):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    mesh_fn(bm)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(mat(name, C[col]))
    for p in me.polygons:
        p.use_smooth = True
    pieces.append(ob)
    return ob


WAIST = 0.6 * H


def ring_at(z, regs, band=0.02):
    """Bedenin z yüksekliğindeki kesiti: (merkez x, merkez y, yarı genişlik, yarı derinlik)."""
    pts = [v.co for v in h.data.vertices if REG[v.index] in regs and abs(v.co.z - z) < band]
    if not pts:
        return (0.0, 0.0, 0.15, 0.1)
    x0 = min(c.x for c in pts); x1 = max(c.x for c in pts); y0 = min(c.y for c in pts); y1 = max(c.y for c in pts)
    return ((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2)


def loft(name, levels, col, n=24, cap_bottom=False, cap_top=False):
    """Kesitlerden dikilmiş tüp: levels = [(z, cx, cy, yarı_genişlik, yarı_derinlik), ...] (aşağıdan yukarı ya da tersi)."""
    def build(bm):
        rings = []
        for (z, cx, cy, ax, by) in levels:
            rings.append([bm.verts.new((cx + ax * math.cos(2 * math.pi * k / n), cy + by * math.sin(2 * math.pi * k / n), z)) for k in range(n)])
        for r0, r1 in zip(rings, rings[1:]):
            for k in range(n):
                bm.faces.new((r0[k], r0[(k + 1) % n], r1[(k + 1) % n], r1[k]))
        caps = []
        if cap_bottom:
            caps.append((bm.faces.new(rings[0]), -1.0))
        if cap_top:
            caps.append((bm.faces.new(list(reversed(rings[-1]))), 1.0))
        # yüzler açıkça dışa baksın (Godot arka yüzü çizmez): yan yüzler eksenden uzağa, alt kapak aşağı, üst kapak yukarı
        acx = sum(l[1] for l in levels) / len(levels)
        acy = sum(l[2] for l in levels) / len(levels)
        capset = {f for f, _ in caps}
        bm.normal_update()
        for f in bm.faces:
            if f in capset:
                continue
            fc = f.calc_center_median()
            if f.normal.dot(Vector((fc.x - acx, fc.y - acy, 0.0))) < 0.0:
                f.normal_flip()
        for f, sg in caps:
            if f.normal.z * sg < 0.0:
                f.normal_flip()
    return solid(name, build, col)


def drape(name, levels, col, n=36, folds=8, amp=0.05, gap=0.0):
    """Kıvrımlı kumaş tüpü (etek, aba eteği, örtü): levels = [(z, cx, cy, yarı_genişlik, yarı_derinlik)] yukarıdan aşağı.
    Kıvrım: yarıçap, aşağı indikçe artan genlikle düzensiz dalgalanır (dikey kırışıklar). gap > 0: önde (−Y) o kadar
    derecelik açıklık (önü açık aba, başörtüsü)."""
    import random
    rnd = random.Random(len(name) * 7 + n)
    ph = [rnd.uniform(0, 6.28) for _ in range(3)]

    def build(bm):
        rings = []
        m = len(levels)
        for li, (z, cx, cy, ax, by) in enumerate(levels):
            t = li / max(1, m - 1)
            ring = []
            for k in range(n + (1 if gap > 0 else 0)):
                if gap > 0:
                    th = math.radians(-90 + gap / 2) + (2 * math.pi - math.radians(gap)) * k / n
                else:
                    th = 2 * math.pi * k / n
                w = 1.0 + amp * t * (0.6 * math.sin(folds * th + ph[0]) + 0.3 * math.sin((folds * 2 + 1) * th + ph[1]) + 0.25 * math.sin(3 * th + ph[2]))
                ring.append(bm.verts.new((cx + ax * w * math.cos(th), cy + by * w * math.sin(th), z)))
            rings.append(ring)
        cnt = len(rings[0])
        for r0, r1 in zip(rings, rings[1:]):
            for k in range(cnt if gap <= 0 else cnt - 1):
                bm.faces.new((r0[k], r0[(k + 1) % cnt], r1[(k + 1) % cnt], r1[k]))
        bm.normal_update()
        acx = sum(l[1] for l in levels) / m
        acy = sum(l[2] for l in levels) / m
        for f in bm.faces:
            fc = f.calc_center_median()
            if f.normal.dot(Vector((fc.x - acx, fc.y - acy, 0.0))) < 0.0:
                f.normal_flip()
    return solid(name, build, col)


def skirt_levels(top_f, bot_f, ex_top, ex_bot):
    """Etek kesitleri (yukarıdan aşağı): belde bedenin kendi kesiti, kalçanın en geniş yerinden sonra genişlik sabitlenir
    ve aşağı doğru doğrusal açılır (kumaş kalçadan düşer, bacakların arasına girmez)."""
    hip = max((ring_at(f * H, ('govde', 'bacak'), 0.02) for f in (0.5, 0.52, 0.54, 0.56)), key=lambda r: r[2])
    out = []
    steps = 9
    for k in range(steps + 1):
        f = top_f + (bot_f - top_f) * k / steps
        t = k / steps
        ex = ex_top + (ex_bot - ex_top) * t
        cx, cy, ax, by = ring_at(f * H, ('govde', 'bacak'), 0.02)
        if f * H < hip[0] * 0 + 0.54 * H:
            ax, by, cy = max(ax, hip[2]), max(by, hip[3]), hip[1]
        out.append((f * H, 0.0, cy, ax + ex, by + ex * 0.85))
    return out


def fabric_image(colname, seed, strength=1.0):
    """Döşenebilir kumaş dokusu (256x256): ince dokuma, lekeler, solgunluk; renk C[colname]."""
    import numpy as np
    N = 256
    rng = np.random.default_rng(seed)

    def lowpass(k):
        f = np.fft.fft2(rng.standard_normal((N, N)))
        fy = np.fft.fftfreq(N)[:, None]
        fx = np.fft.fftfreq(N)[None, :]
        g = np.exp(-(fx ** 2 + fy ** 2) * (N / k) ** 2)
        r = np.real(np.fft.ifft2(f * g))
        return r / (np.abs(r).max() + 1e-6)
    yy, xx = np.mgrid[0:N, 0:N]
    weave = 0.5 * np.sin(2 * np.pi * xx * 64 / N) * np.sin(2 * np.pi * yy * 64 / N) + 0.5 * np.sin(2 * np.pi * (xx + yy) * 32 / N)
    pat = 1.0 + strength * (0.05 * weave + 0.16 * lowpass(6) + 0.08 * lowpass(24) + 0.04 * rng.standard_normal((N, N)))
    c = np.array(C[colname])
    img = np.clip(pat[..., None] * c[None, None, :], 0, 1)
    rgba = np.concatenate([img, np.ones((N, N, 1))], axis=2).astype(np.float32)
    im = bpy.data.images.new('kumas_%s_%d' % (colname, seed), N, N)
    im.pixels.foreach_set(rgba.ravel())
    im.pack()
    return im


def fabricize(ob, colname, seed, scale=6.0):
    """Parçaya silindirik UV ve kumaş dokulu malzeme (glTF'e gömülü doku olarak çıkar)."""
    me = ob.data
    uv = me.uv_layers.get('UVMap') or me.uv_layers.new(name='UVMap')
    for lp in me.loops:
        co = me.vertices[lp.vertex_index].co
        uv.data[lp.index].uv = ((math.atan2(co.x, -co.y) / (2 * math.pi) + 0.5) * scale, co.z * scale * 0.9)
    m = bpy.data.materials.new(ob.name + '_kumas')
    m.use_nodes = True
    nt = m.node_tree
    bs = nt.nodes['Principled BSDF']
    tx = nt.nodes.new('ShaderNodeTexImage')
    tx.image = fabric_image(colname, seed)
    nt.links.new(tx.outputs['Color'], bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = 0.92
    me.materials.clear()
    me.materials.append(m)


def hide_region(pred):
    for v in h.data.vertices:
        if pred(v.index, v.co):
            covered.add(v.index)
upper = lambda i, c: (REG[i] == 'govde' and c.z > WAIST - 0.05) or REG[i] == 'kol'
lower = lambda i, c: (REG[i] == 'govde' and c.z < WAIST + 0.04) or REG[i] == 'bacak'

for kind, col in cfg['giysi']:
    if kind == 'gomlek':
        shell('gomlek', upper, 0.005, col)
    elif kind == 'ceket':      # kapalı kısa ceket
        shell('ceket', upper, 0.03, col, smooth=12, hide=True)      # bol kesim: beden hatlarını göstermez
        # yaka: boyun dibinde dik gömlek yakası
        nz = min(c.z for c in head_v) + 0.02
        cx, cy, ax, by = ring_at(nz, ('bas',), 0.02)
        loft('yaka', [(nz - 0.03, cx, cy, ax + 0.03, by + 0.03), (nz + 0.012, cx, cy, ax + 0.012, by + 0.012)], 'krem', n=20)
    elif kind == 'gogus':      # ceketin önünde, yakadan aşağı inen gömlek göğsü (V açıklık)
        neck = min(c.z for c in head_v)
        shell('gogus', lambda i, c: REG[i] == 'govde' and c.y < -0.02 and neck - 0.2 < c.z < neck + 0.01 and abs(c.x) < 0.05 + (c.z - (neck - 0.2)) * 0.25,
              0.036, col, smooth=6, hide=False, edge=True)      # kenar da yumuşatılır: tırtıklı durmasın
    elif kind == 'salvar':     # ŞALVAR: belden dize kadar tek geniş torba (ağ düşük), dizden bileğe daralan iki paça
        lv = []
        for f, ex in [(0.615, 0.02), (0.56, 0.04), (0.5, 0.06), (0.42, 0.07), (0.35, 0.06), (0.31, 0.04)]:
            cx, cy, ax, by = ring_at(f * H, ('govde', 'bacak'), 0.025)
            lv.append((f * H, 0.0, cy, ax + ex, by + ex * 0.8))
        lv.append((0.295 * H, 0.0, lv[-1][2], lv[-1][3] * 0.55, lv[-1][4] * 0.6))
        loft('salvar', list(reversed(lv)), col, n=28, cap_bottom=True)
        for sg in (-1.0, 1.0):
            legs = []
            for f, r in [(0.36, 0.105), (0.28, 0.1), (0.18, 0.085), (0.1, 0.062), (0.078, 0.05)]:
                pts = [v.co for v in h.data.vertices if REG[v.index] == 'bacak' and abs(v.co.z - f * H) < 0.03 and v.co.x * sg > 0]
                cx = sum(c.x for c in pts) / len(pts) if pts else sg * 0.1
                cy = sum(c.y for c in pts) / len(pts) if pts else 0.0
                legs.append((f * H, cx, cy, r, r))
            loft('paca', list(reversed(legs)), col, n=16)
        hide_region(lambda i, c: lower(i, c) and c.z > 0.075 * H)
    elif kind == 'kusak':      # geniş bel kuşağı: ceketin eteğini ve şalvarın belini örter
        lv = []
        for dz, ex in [(-0.055, 0.03), (-0.03, 0.034), (0.0, 0.034), (0.03, 0.03), (0.05, 0.02)]:
            cx, cy, ax, by = ring_at(WAIST + dz, ('govde', 'bacak') if dz < 0 else ('govde',), 0.025)
            lv.append((WAIST + dz, cx, cy, ax + ex, by + ex))
        loft('kusak', lv, col, n=28)
    elif kind == 'ayakkabi':
        shell('ayakkabi', lambda i, c: REG[i] == 'ayak' or (REG[i] == 'bacak' and c.z < 0.085 * H), 0.03, col, smooth=80)      # parmak araları dolsun, çorap gibi değil kapalı yemeni gibi dursun
    elif kind == 'sac':
        if SCALP:
            shell('sac', lambda i, c: i in SCALP, 0.004, col, smooth=1, hide=False)
    elif kind == 'fes':
        def fez(bm):
            r0, r1, hh = 0.092, 0.076, 0.12
            geo = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=24, radius1=r0, radius2=r1, depth=hh)
            for v in geo['verts']:
                v.co += Vector((hc.x, hc.y + 0.015, hc.z - 0.05 + hh / 2))
        solid('fes', fez, col)
        def tassel(bm):
            geo = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=6, radius1=0.006, radius2=0.004, depth=0.1)
            for v in geo['verts']:
                v.co += Vector((hc.x + 0.082, hc.y + 0.02, hc.z - 0.02))
        solid('puskul', tassel, 'siyah')
    elif kind == 'cepken':     # uyluk ortasına inen kapalı ceket: üst gövde ve kollar kabuk, belden aşağı açılan etek
        shell('cepken', upper, 0.03, col, smooth=12, hide=True)
        lv = []
        for f, ex in [(0.62, 0.035), (0.57, 0.05), (0.52, 0.06), (0.47, 0.068), (0.44, 0.072)]:
            cx, cy, ax, by = ring_at(f * H, ('govde', 'bacak'), 0.025)
            lv.append((f * H, 0.0, cy, ax + ex, by + ex * 0.85))
        loft('cepken_etek', list(reversed(lv)), col, n=32)
        nz = min(c.z for c in head_v) + 0.02
        cx, cy, ax, by = ring_at(nz, ('bas',), 0.02)
        loft('yaka', [(nz - 0.035, cx, cy, ax + 0.032, by + 0.032), (nz + 0.01, cx, cy, ax + 0.014, by + 0.014)], 'krem', n=20)
    elif kind == 'potur':      # dize kadar bol, dizde daralan potur: kalça torbası + iki ayrı bacak (yürürken bacaklar arası gerilmez)
        lv = []
        for f, ex in [(0.6, 0.02), (0.55, 0.035), (0.5, 0.045)]:
            cx, cy, ax, by = ring_at(f * H, ('govde', 'bacak'), 0.025)
            lv.append((f * H, 0.0, cy, ax + ex, by + ex * 0.8))
        loft('potur_kalca', list(reversed(lv)), col, n=28)
        for sg in (-1.0, 1.0):
            legs = []
            for f, ex in [(0.5, 0.05), (0.44, 0.06), (0.38, 0.055), (0.33, 0.035), (0.295, 0.018)]:
                pts = [v.co for v in h.data.vertices if REG[v.index] == 'bacak' and abs(v.co.z - f * H) < 0.02 and v.co.x * sg > 0.01]
                if not pts:
                    continue
                x0 = min(c.x for c in pts); x1 = max(c.x for c in pts); y0 = min(c.y for c in pts); y1 = max(c.y for c in pts)
                legs.append((f * H, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + ex, (y1 - y0) / 2 + ex))
            loft('potur_bacak', list(reversed(legs)), col, n=20)
        hide_region(lambda i, c: lower(i, c) and c.z > 0.29 * H)
    elif kind == 'dolak':      # dizden bileğe sarılı dolak: baldıra oturan kabuk; sargı izleri için hafif kabarık halkalar
        shell('dolak', lambda i, c: REG[i] == 'bacak' and 0.07 * H < c.z < 0.33 * H, lambda i, c: 0.017 + 0.006 * max(0.0, math.sin(c.z * 210.0 + c.x * 35.0)), col, smooth=0, hide=True)
    elif kind == 'kemer':      # tokalı deri kemer (cepkenin üstünde)
        lv = []
        for dz, ex in [(-0.03, 0.05), (0.0, 0.053), (0.028, 0.05)]:
            cx, cy, ax, by = ring_at(WAIST + dz, ('govde',), 0.025)
            lv.append((WAIST + dz, cx, cy, ax + ex, by + ex))
        loft('kemer', lv, col, n=32)
        cx, cy, ax, by = ring_at(WAIST, ('govde',), 0.025)
        def buckle(bm):
            geo = bmesh.ops.create_cube(bm, size=1.0)
            for v in geo['verts']:
                v.co = Vector((v.co.x * 0.06, v.co.y * 0.012, v.co.z * 0.048)) + Vector((cx, cy - by - 0.058, WAIST))
        solid('toka', buckle, 'pirinc')
        pieces[-1].data.materials[0] = mat('toka', C['pirinc'], 0.35, 1.0)
    elif kind == 'fiseklik':   # omuzdan karşı kalçaya iki çapraz fişeklik; önde pirinç fişek sırası. Cepkenin yüzeyine oturur.
        from mathutils.bvhtree import BVHTree
        cep = next(o for o in pieces if o.name.split('.')[0] == 'cepken')
        bvh = BVHTree.FromObject(cep, bpy.context.evaluated_depsgraph_get())
        top = 0.815 * H

        def hit(x, z, side):
            """Cepken yüzeyinde (x, z) noktası: side=-1 ön (dışarıdan +Y yönüne ışın), +1 arka."""
            r = bvh.ray_cast(Vector((x, side * 1.0, z)), Vector((0.0, -side, 0.0)), 2.0)
            return (r[0], r[1]) if r[0] is not None else (None, None)

        for sg in (1.0, -1.0):
            # sg=+1: sol omuzdan sağ kalçaya (önde ve arkada aynı çizgi)
            x_top, x_bot, z_bot = 0.15 * sg, -0.13 * sg, WAIST + 0.03
            dv = Vector((x_top - x_bot, 0.0, top - z_bot)).normalized()
            pv = Vector((-dv.z, 0.0, dv.x))
            lift = 0.004 if sg < 0 else 0.0          # ikinci kayış birincinin üstünden geçer
            for side in (-1, 1):
                def strap(bm, side=side, x_top=x_top, x_bot=x_bot, z_bot=z_bot, pv=pv, lift=lift):
                    rows = []
                    steps = 48
                    for k in range(steps + 1):
                        t = k / steps
                        z0 = z_bot - 0.02 + (top - z_bot + 0.02) * t
                        x0 = x_bot + (x_top - x_bot) * (z0 - z_bot) / (top - z_bot)
                        row = []
                        for w in (-0.03, 0.0, 0.03):
                            p, n = hit(x0 + pv.x * w, z0 + pv.z * w, side)
                            if p is None:
                                row = None
                                break
                            row.append(p + n * (0.006 + lift))
                        rows.append(row)
                    prev = None
                    for row in rows:
                        if row is None:
                            prev = None
                            continue
                        vs = [bm.verts.new(c) for c in row]
                        if prev is not None:
                            for j in range(2):
                                f = bm.faces.new((prev[j], prev[j + 1], vs[j + 1], vs[j]))
                        prev = vs
                    bm.normal_update()
                    for f in bm.faces:                  # dışa baksın
                        if f.normal.y * side < 0:
                            f.normal_flip()
                solid('fiseklik', strap, col)
            # fişekler: kayışın önünde, kayışa dik dizili küçük pirinç gövdeler
            spots = []
            z = z_bot + 0.05
            while z < top - 0.06:
                x0 = x_bot + (x_top - x_bot) * (z - z_bot) / (top - z_bot)
                p, n = hit(x0, z, -1)
                if p is not None:
                    spots.append((p + n * (0.014 + lift), n))
                z += 0.022

            def carts(bm, spots=spots, dv=dv, pv=pv):
                for c0, nm in spots:
                    geo = bmesh.ops.create_cube(bm, size=1.0)
                    for v in geo['verts']:
                        v.co = c0 + pv * (v.co.x * 0.04) + dv * (v.co.z * 0.011) + nm * (v.co.y * 0.012)
            solid('fisek', carts, 'pirinc')
            pieces[-1].data.materials[0] = mat('fisek', C['pirinc'], 0.35, 1.0)
    elif kind == 'kalpak':     # kürk kalpak: başı tepeden kaşın üstüne kadar saran, tüylü (pürüzlü) silindir
        import random
        rnd = random.Random(8)
        def kal(bm):
            n, rows = 48, 13
            r0, hh = 0.108, 0.15
            rings = []
            for j in range(rows):
                t = j / (rows - 1)
                z = hc.z - 0.098 + hh * t
                rr = r0 * (1.0 + 0.1 * math.sin(math.pi * min(1.0, t * 1.2)) * 0.6 + 0.04 * t)
                rings.append([bm.verts.new((hc.x + rr * (1 + rnd.uniform(-0.07, 0.07)) * math.cos(2 * math.pi * k / n),
                                            hc.y + 0.012 + rr * 0.93 * (1 + rnd.uniform(-0.07, 0.07)) * math.sin(2 * math.pi * k / n),
                                            z + rnd.uniform(-0.004, 0.004))) for k in range(n)])
            for a_, b_ in zip(rings, rings[1:]):
                for k in range(n):
                    bm.faces.new((a_[k], a_[(k + 1) % n], b_[(k + 1) % n], b_[k]))
            topc = bm.verts.new((hc.x, hc.y + 0.012, hc.z - 0.098 + hh + 0.015))
            for k in range(n):
                bm.faces.new((rings[-1][k], rings[-1][(k + 1) % n], topc))
            bm.normal_update()
            for f in bm.faces:
                fc = f.calc_center_median()
                if f.normal.dot(fc - Vector((hc.x, hc.y, hc.z))) < 0:
                    f.normal_flip()
        solid('kalpak', kal, col)
        pieces[-1].data.materials[0] = mat('kalpak', C[col], 1.0)
    elif kind == 'pala_biyik':  # kalın pala bıyık: burnun altından ağız köşelerini aşıp aşağı kıvrılan
        nose = min(head_v, key=lambda c: c.y)
        def mous(bm):
            geo = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
            for v in geo['verts']:
                x = v.co.x
                v.co = Vector((x * 0.052, v.co.y * 0.009 + (x * 0.052) ** 2 * 9.0, v.co.z * 0.011 - abs(x) ** 2 * 0.017)) + Vector((nose.x, nose.y + 0.017, nose.z - 0.03))
        solid('biyik', mous, col)
    elif kind == 'entari':     # bileğe inen uzun entari: üst gövde ve kollar ince kabuk, belden aşağı kıvrımlı etek
        shell('entari', upper, 0.012, col, smooth=6, hide=True)
        drape('entari_etek', skirt_levels(WAIST / H - 0.01, 0.045, 0.012, 0.11), col, n=48, folds=11, amp=0.07)
        hide_region(lambda i, c: lower(i, c) and c.z > 0.06 * H)
        nz = min(c.z for c in head_v) + 0.02
        cx, cy, ax, by = ring_at(nz, ('bas',), 0.02)
        loft('entari_yaka', [(nz - 0.035, cx, cy, ax + 0.02, by + 0.02), (nz - 0.005, cx, cy, ax + 0.01, by + 0.01)], col, n=20)
    elif kind == 'aba':        # önü açık üst giysi: omuzdan baldıra; kollar bol, önde açıklık
        shell('aba', lambda i, c: upper(i, c) and not (c.y < -0.02 and abs(c.x) < 0.055 and REG[i] == 'govde'), 0.03, col, smooth=10, hide=False, edge=True)
        drape('aba_etek', skirt_levels(WAIST / H + 0.01, 0.17, 0.04, 0.13), col, n=48, folds=8, amp=0.08, gap=30.0)
    elif kind == 'sarik':      # sarık: başın çevresine sarılmış, hafif eğik katlar ve tepede kubbe
        cz0 = hc.z - 0.075
        def wrap(bm):
            nseg, nmin = 36, 8
            for li in range(6):
                z = cz0 + 0.014 * li
                tilt = (0.022 if li % 2 else -0.022)
                cx, cy, ax, by = ring_at(min(z, cz0 + 0.04), ('bas',), 0.012)
                R0, R1 = ax + 0.02 + 0.003 * li, by + 0.022 + 0.003 * li
                rings = []
                for k in range(nseg):
                    t = 2 * math.pi * k / nseg
                    c0 = Vector((hc.x + R0 * math.cos(t), cy + 0.006 + R1 * math.sin(t), z + tilt * math.sin(t)))
                    out = Vector((math.cos(t), math.sin(t), 0.0))
                    ring = []
                    for j in range(nmin):
                        s_ = 2 * math.pi * j / nmin
                        ring.append(bm.verts.new(c0 + out * (0.019 * math.cos(s_)) + Vector((0, 0, 0.016 * math.sin(s_)))))
                    rings.append(ring)
                for k in range(nseg):
                    r0, r1 = rings[k], rings[(k + 1) % nseg]
                    for j in range(nmin):
                        bm.faces.new((r0[j], r1[j], r1[(j + 1) % nmin], r0[(j + 1) % nmin]))
            geo = bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=10, radius=1.0)
            cx, cy, ax, by = ring_at(cz0 + 0.07, ('bas',), 0.015)
            for v in geo['verts']:
                if v.co.z < 0:
                    v.co.z *= 0.2
                v.co = Vector((hc.x + v.co.x * (ax + 0.02), cy + 0.006 + v.co.y * (by + 0.02), cz0 + 0.075 + v.co.z * 0.06))
            bm.normal_update()
        solid('sarik', wrap, col)
    elif kind in ('basortu', 'carsaf'):   # başörtüsü: yüz açık, baş ve boyun örtülü, omuzlara dökülen örtü; çarşafta bele kadar
        hcy = sum(c.y for c in head_v) / len(head_v)
        nose = min(head_v, key=lambda c: c.y)
        chin = min(c.z for c in head_v if c.y < hcy - 0.03)
        face = lambda c: c.y < hcy - 0.025 and chin - 0.005 < c.z < nose.z + 0.045 and abs(c.x - nose.x) < 0.062
        shell(kind, lambda i, c: REG[i] == 'bas' and not face(c), 0.014, col, smooth=5, hide=False, edge=True)
        nz = min(c.z for c in head_v) + 0.03
        cx, cy, ax, by = ring_at(nz, ('bas',), 0.02)
        low = 0.555 * H if kind == 'carsaf' else 0.79 * H
        top = nz + 0.02 if kind == 'carsaf' else nz - 0.012      # başörtüsü çeneyi örtmez
        lv = [(top, cx, cy, ax + 0.022, by + 0.022), (nz - 0.03, cx, cy, ax + 0.035, by + 0.03)]
        steps = [(0.8, 0.02), (0.75, 0.03)] + ([(0.7, 0.07), (0.63, 0.11), (0.56, 0.15)] if kind == 'carsaf' else [])
        for f, ex in steps:
            if f * H < low - 0.001:
                break
            cx2, cy2, ax2, by2 = ring_at(f * H, ('govde',), 0.025)
            lv.append((f * H, cx2, cy2, (max(ax2, 0.16) if kind == 'carsaf' else min(ax2, 0.15)) + ex, by2 + ex))      # başörtüsü omuz başını aşmaz; çarşaf pelerini kollara dökülür
        drape(kind + '_ortu', lv, col, n=48, folds=9 if kind == 'carsaf' else 7, amp=0.09 if kind == 'carsaf' else 0.045)
    elif kind == 'sakal':      # kısa sakal: çene ve yanak altını saran kabuk
        hcy = sum(c.y for c in head_v) / len(head_v)
        nose = min(head_v, key=lambda c: c.y)
        shell('sakal', lambda i, c: REG[i] == 'bas' and c.y < hcy + 0.01 and c.z < nose.z - 0.025 and c.z > min(cc.z for cc in head_v) - 0.01 and abs(c.x - nose.x) < 0.075, 0.009, col, smooth=3, hide=False, edge=True)
    elif kind == 'biyik':      # burun ucunun altında, dudağın üstünde: yassı, uçları aşağı sarkan bıyık
        nose = min(head_v, key=lambda c: c.y)
        def mous(bm):
            geo = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
            for v in geo['verts']:
                x = v.co.x
                v.co = Vector((x * 0.04, v.co.y * 0.011, v.co.z * 0.008 - abs(x) ** 2 * 0.005)) + Vector((nose.x, nose.y + 0.024, nose.z - 0.03))
        solid('biyik', mous, col)

# ---- kumaş dokusu: düz renk yerine dokuma + leke + solgunluk (kumaş giysilere; metal, saç, bıyık, sakal hariç)
KUMAS_YOK = ('toka', 'fisek', 'sac', 'biyik', 'sakal', 'puskul', 'kalpak')
for i_, o in enumerate(pieces):
    if o.type != 'MESH' or not o.data.materials or o.name.split('.')[0] in KUMAS_YOK:
        continue
    m0 = o.data.materials[0]
    bs0 = m0.node_tree.nodes.get('Principled BSDF') if m0 and m0.use_nodes else None
    if bs0 is None or bs0.inputs['Metallic'].default_value > 0.5:
        continue
    col0 = tuple(bs0.inputs['Base Color'].default_value[:3])
    cname = min(C, key=lambda k: sum((C[k][j] - col0[j]) ** 2 for j in range(3)))
    fabricize(o, cname, 11 + i_, scale=(14.0 if o.name.startswith(('sarik', 'basortu', 'carsaf')) else 6.0))

# ---- ağırlık aktarımı: bedenden doğmayan parçalar (şalvar torbası, paçalar, kuşak, fes, bıyık, göz, kaş) en yakın 4 beden
# köşesinin ağırlıklarını uzaklığa göre harmanlayarak alır. Beden yüzleri silinmeden önce yapılır.
from mathutils.kdtree import KDTree
kd = KDTree(len(h.data.vertices))
for v in h.data.vertices:
    kd.insert(h.matrix_world @ v.co, v.index)
kd.balance()
gname = {g.index: g.name for g in h.vertex_groups}
for o in extra + pieces:
    if o.type != 'MESH' or o.get('agirlikli'):
        continue
    for m in list(o.modifiers):
        o.modifiers.remove(m)
    o.parent = None
    o.vertex_groups.clear()
    groups = {}
    for v in o.data.vertices:
        acc = {}
        near = kd.find_n(o.matrix_world @ v.co, 4)
        tot = 0.0
        for co, bi, d in near:
            wgt = 1.0 / max(d, 0.002)
            tot += wgt
            for g in h.data.vertices[bi].groups:
                acc[g.group] = acc.get(g.group, 0.0) + g.weight * wgt
        for gi, wv in acc.items():
            nm = gname[gi]
            if nm not in groups:
                groups[nm] = o.vertex_groups.new(name=nm)
            if wv / tot > 0.01:
                groups[nm].add([v.index], wv / tot, 'REPLACE')

# ---- kıyafetin altındaki beden yüzlerini sil (el, baş, boyun kalır)
bm = bmesh.new()
bm.from_mesh(h.data)
bm.verts.ensure_lookup_table()
dele = [f for f in bm.faces if all(v.index in covered for v in f.verts)]
bmesh.ops.delete(bm, geom=dele, context='FACES')
bm.to_mesh(h.data)
bm.free()
for p in h.data.polygons:
    p.use_smooth = True

for o in [h] + extra + pieces:
    if o.type == 'MESH':
        print('PARCA', o.name, len(o.data.vertices), len(o.data.polygons), flush=True)
        print('   gecersizdi:', o.data.validate(verbose=False), flush=True)
# ---- tek nesnede birleştir ve yaz
bpy.ops.object.select_all(action='DESELECT')
allobs = [h] + extra + pieces
for o in allobs:
    if o.type == 'MESH':
        o.select_set(True)
        if o is not h:
            for m in list(o.modifiers):
                o.modifiers.remove(m)
            o.parent = None
bpy.context.view_layer.objects.active = h
bpy.ops.object.join()      # h iskelete bağlı kalır (Armature değiştiricisi ve ebeveyn h'de)
h.name = KOD
h.data.update()
print('BIRLESTI', flush=True)
print('KARAKTER', KOD, 'kose', len(h.data.vertices), 'ucgen~', sum(len(p.vertices) - 2 for p in h.data.polygons), 'malzeme', [m.name for m in h.data.materials])

if PNG:
    sc = bpy.context.scene
    cam_d = bpy.data.cameras.new('cam')
    cam = bpy.data.objects.new('cam', cam_d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam_d.type = 'ORTHO'
    cam_d.ortho_scale = H * 1.12
    sun_d = bpy.data.lights.new('sun', 'SUN')
    sun_d.energy = 3.0
    sun = bpy.data.objects.new('sun', sun_d)
    sc.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(55), 0, math.radians(-30))
    sc.world = bpy.data.worlds.new('w')
    sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.55, 0.55, 1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.7
    sc.render.resolution_x = 520
    sc.render.resolution_y = 900
    for eng in ['BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH']:
        try:
            sc.render.engine = eng
            break
        except Exception:
            pass
    for tag, pos, rz in [('on', (0, -4, H / 2), 0.0), ('yan', (4, 0, H / 2), math.radians(90)), ('arka', (0, 4, H / 2), math.radians(180))]:
        cam.location = pos
        cam.rotation_euler = (math.radians(90), 0, rz)
        sc.render.filepath = PNG.replace('.png', '_%s.png' % tag)
        print('CIZIM', tag, flush=True)
        try:
            bpy.ops.render.render(write_still=True)
            print('GORUNTU', sc.render.filepath, sc.render.engine)
        except Exception as e:
            print('GORUNTU alinamadi:', e)

bpy.ops.object.select_all(action='DESELECT')
h.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        img.scale(1024, 1024)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_image_format='JPEG', export_yup=True)
print('YAZILDI', OUT)
