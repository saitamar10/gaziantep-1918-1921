"""Blender katmanlı çalışma alanı: tarihî batı mahalleleri + hizalanmış (yerel düzeltmeli) tarihî plan.
   blender -b --python godot/tools/tarihi_blender.py -- <doku_xz.json> <tarihiMahalle.js> <plan.jpg> <kayit.blend> <cikti_klasoru> [eski_city.json]
Koleksiyonlar: 0_Plan (bükülmüş görüntü ızgarası), 1_Sokaklar (plan / çıkmaz-tahmin / halka / kopuk bağlantı-tahmin), 2_Parseller (yapı kütleleri),
3_Bahceler, 4_Meydanlar, 5_Simgeler (sabit noktalar), 9_Eski_Uretim (karşılaştırma: önceki BSP sokakları).
Blender ekseni: X = doğu (oyun x), Y = kuzey (= -oyun z). Üstten dik (ortografik) görüntüler kaydedilir."""
import bpy, json, sys, os, math

a = sys.argv[sys.argv.index('--') + 1:]
dxz, mjs, plan, blend, out = a[:5]
old = a[5] if len(a) > 5 else None
os.makedirs(out, exist_ok=True)
D = json.load(open(dxz, encoding='utf-8'))
s = open(mjs, encoding='utf-8').read()
M = json.loads(s[s.index('= {') + 2:s.rindex(';')])
T = D['transform']

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def coll(name):
    c = bpy.data.collections.new(name)
    sc.collection.children.link(c)
    return c


def mat(name, rgba):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = rgba
    b.inputs['Roughness'].default_value = 1.0
    return m


def W(x, z, y=0.0):
    return (x, -z, y)


# 0) plan görüntü düzlemi: hizalama yerel düzeltmeli olduğu için tek dörtgen değil, bükülmüş ızgara (tarihi_hizala.py plan_grid)
c0 = coll('0_Plan_Houshamadyan_1919-1920')
img = bpy.data.images.load(plan)
G = D['plan_grid']
nu, nv = len(G['us']), len(G['vs'])
verts = [W(G['xz'][j][i][0], G['xz'][j][i][1], -0.2) for j in range(nv) for i in range(nu)]
faces = [(j * nu + i, (j + 1) * nu + i, (j + 1) * nu + i + 1, j * nu + i + 1) for j in range(nv - 1) for i in range(nu - 1)]
me = bpy.data.meshes.new('plan')
me.from_pydata(verts, [], faces)
uvl = me.uv_layers.new()
for poly in me.polygons:
    for li, vi in zip(poly.loop_indices, poly.vertices):
        j, i = divmod(vi, nu)
        uvl.data[li].uv = (G['us'][i] / G['w'], 1 - G['vs'][j] / G['h'])
pm = bpy.data.materials.new('plan')
pm.use_nodes = True
nt = pm.node_tree
tex = nt.nodes.new('ShaderNodeTexImage')
tex.image = img
em = nt.nodes.new('ShaderNodeEmission')
nt.links.new(tex.outputs['Color'], em.inputs['Color'])
nt.links.new(em.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
nt.nodes.remove(nt.nodes['Principled BSDF'])
me.materials.append(pm)
ob = bpy.data.objects.new('Plan_goruntusu', me)
c0.objects.link(ob)


def ribbon(name, segs, col, y, m):
    verts, faces = [], []
    for sg in segs:
        (x0, z0), (x1, z1), w = sg['a'], sg['b'], sg['w']
        L = math.hypot(x1 - x0, z1 - z0) or 1
        nx, nz = -(z1 - z0) / L * w / 2, (x1 - x0) / L * w / 2
        i = len(verts)
        verts += [W(x0 + nx, z0 + nz, y), W(x1 + nx, z1 + nz, y), W(x1 - nx, z1 - nz, y), W(x0 - nx, z0 - nz, y)]
        faces.append((i, i + 1, i + 2, i + 3))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o


c1 = coll('1_Sokaklar')
ribbon('Sokak_plandan', [g for g in M['segments'] if g['hist'] == 1], c1, 0.05, mat('sokak_plan', (0.85, 0.15, 0.1, 1)))
ribbon('Cikmaz_TAHMIN', [g for g in M['segments'] if g['hist'] == 3], c1, 0.05, mat('cikmaz', (0.95, 0.6, 0.1, 1)))
ribbon('Halka_baglanti', [g for g in M['segments'] if g['hist'] == 2], c1, 0.04, mat('halka', (0.5, 0.5, 0.5, 1)))
ribbon('Kopuk_baglanti_TAHMIN', [g for g in M['segments'] if g['hist'] == 4], c1, 0.05, mat('baglanti', (0.75, 0.2, 0.75, 1)))


def prisms(name, polys, col, h, m):
    verts, faces = [], []
    for P in polys:
        i = len(verts)
        n = len(P)
        verts += [W(x, z, 0) for x, z in P] + [W(x, z, h) for x, z in P]
        faces.append(tuple(range(i + n, i + 2 * n)))
        for k in range(n):
            faces.append((i + k, i + (k + 1) % n, i + n + (k + 1) % n, i + n + k))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o


prisms('Parseller_TAHMIN', M['lots'], coll('2_Parseller'), 6.0, mat('parsel', (0.78, 0.68, 0.55, 0.85)))
prisms('Bahceler_TAHMIN', M['gardens'], coll('3_Bahceler'), 0.6, mat('bahce', (0.45, 0.62, 0.38, 1)))
c4 = coll('4_Meydanlar')
for x, z, ar in M['squares']:
    bpy.ops.mesh.primitive_circle_add(radius=math.sqrt(ar / math.pi), fill_type='NGON', location=W(x, z, 0.1))
    o = bpy.context.object
    for cc in o.users_collection:
        cc.objects.unlink(o)
    c4.objects.link(o)
c5 = coll('5_Sabit_noktalar')
for n, p, q, g in T['anchors']:
    e = bpy.data.objects.new('Sabit: ' + n, None)
    e.empty_display_type = 'CONE'
    e.empty_display_size = 6
    e.location = W(q[0], q[1], 12)
    e.rotation_euler = (math.pi, 0, 0)
    c5.objects.link(e)
if old and os.path.exists(old):
    O = json.load(open(old, encoding='utf-8'))
    xs = [p[0] for p in D['box_xz']]
    zs = [p[1] for p in D['box_xz']]
    segs = [{'a': [s[0], s[1]], 'b': [s[2], s[3]], 'w': s[4]} for s in O['segments']
            if min(xs) - 40 < (s[0] + s[2]) / 2 < max(xs) + 40 and min(zs) - 40 < (s[1] + s[3]) / 2 < max(zs) + 40]
    c9 = coll('9_Eski_Uretim_karsilastirma')
    ribbon('Eski_BSP_sokaklar', segs, c9, 0.03, mat('eski', (0.15, 0.3, 0.9, 1)))
bpy.ops.wm.save_as_mainfile(filepath=blend)

# üstten dik görüntüler
xs = [p[0] for p in D['box_xz']]
zs = [p[1] for p in D['box_xz']]
cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
cam = bpy.data.cameras.new('ust')
cam.type = 'ORTHO'
cam.ortho_scale = max(max(xs) - min(xs), max(zs) - min(zs)) + 30
co = bpy.data.objects.new('UstKamera', cam)
sc.collection.objects.link(co)
co.location = W(cx, cz, 300)
sc.camera = co
sun = bpy.data.objects.new('Gunes', bpy.data.lights.new('g', 'SUN'))
sun.rotation_euler = (0.5, 0.3, 0.6)
sc.collection.objects.link(sun)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'FLAT'
sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x, sc.render.resolution_y = 1400, int(1400 * (max(zs) - min(zs) + 30) / (max(xs) - min(xs) + 30))
sc.view_settings.view_transform = 'Standard'
layers = {c.name: c for c in sc.collection.children}


def shot(name, show):
    for n, c in layers.items():
        c.hide_render = n not in show
    sc.render.filepath = os.path.join(out, name)
    bpy.ops.render.render(write_still=True)


shot('ust_plan.png', ['0_Plan_Houshamadyan_1919-1920', '5_Sabit_noktalar'])
sc.display.shading.color_type = 'MATERIAL'
shot('ust_yeni.png', ['1_Sokaklar', '2_Parseller', '3_Bahceler', '4_Meydanlar'])
sc.display.shading.color_type = 'TEXTURE'
shot('ust_plan_ustune_sokak.png', ['0_Plan_Houshamadyan_1919-1920', '1_Sokaklar'])
if '9_Eski_Uretim_karsilastirma' in layers:
    sc.display.shading.color_type = 'MATERIAL'
    shot('ust_eski.png', ['9_Eski_Uretim_karsilastirma'])
print('BLENDER_OK')
