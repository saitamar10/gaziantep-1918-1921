"""İskeletsiz bir karakter modelini (GLB) iskeletli ve animasyonlu kaynak karakterin (Fransız askeri, 41 kemik, 7 animasyon)
iskeletine bağlar ve animasyonlarıyla birlikte tek GLB olarak yazar. Kredi/servis gerektirmez.
   blender -b --python godot/tools/karakter_bagla.py -- <kaynak_iskeletli.glb> <hedef_iskeletsiz.glb> <cikti.glb> [donus_derece=90] [ucgen=9000]
Yöntem: hedef, kaynağın boyuna ve yönüne getirilir -> iskeletin bir kopyası hedefin kol açısına (A duruşu) getirilip o duruş
"dinlenme" yapılır -> otomatik ağırlıkla bağlanır -> kollar T duruşuna geri açılıp ağ o hâlde dondurulur -> özgün iskelete bağlanır.
Kaynak iskelet: yan eksen Y, yüz +X, boy 1,0 (Tripo). donus_derece: hedefin yüzünü +X'e çevirmek için Z çevresinde dönüş."""
import bpy, sys, math
from mathutils import Vector, Matrix

a = sys.argv[sys.argv.index('--') + 1:]
SRC, DST, OUT = a[0], a[1], a[2]
TURN = math.radians(float(a[3])) if len(a) > 3 else math.radians(90.0)
TRIS = int(a[4]) if len(a) > 4 else 9000
# kaynak eşiği (m): üretilmiş (Tripo/CellCog) modellerde dikişleri kapatır; MakeHuman bedeni zaten tek parça: 0 ver (göz kapağı göze yapışmasın)
WELD = float(a[5]) if len(a) > 5 else 0.0012


import json, os
DBG = os.environ.get('KARAKTER_DBG', '')


def dbg(tag, mesh, armo):
    if not DBG:
        return
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg); me = ev.to_mesh()
    pts = [list(ev.matrix_world @ v.co) for v in me.vertices]; ev.to_mesh_clear()
    bones = {b.name: list(armo.matrix_world @ b.head) for b in armo.pose.bones}
    json.dump({'p': pts, 'b': bones}, open(os.path.join(DBG, tag + '.json'), 'w'))


def only(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
for o in [o for o in bpy.data.objects if o.type == 'MESH']:      # kaynağın kendi gövdesi ve yardımcı ağlar gitmeli
    bpy.data.objects.remove(o, do_unlink=True)
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=DST)
new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
only(new[0])
for o in new:
    o.select_set(True)
if len(new) > 1:
    bpy.ops.object.join()
ch = bpy.context.view_layer.objects.active
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
for o in [o for o in bpy.data.objects if o not in before and o is not ch]:
    bpy.data.objects.remove(o, do_unlink=True)

# ---- yön, boy, yer
ch.matrix_world = Matrix.Rotation(TURN, 4, 'Z') @ ch.matrix_world
only(ch)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
vs = [v.co for v in ch.data.vertices]
zmin = min(v.z for v in vs); zmax = max(v.z for v in vs)
head = arm.data.bones['Head']
top = (arm.matrix_world @ head.tail_local).z
src_h = 1.0
k = src_h / (zmax - zmin)
cx = sum(v.x for v in vs) / len(vs); cy = (min(v.y for v in vs) + max(v.y for v in vs)) / 2
hip = arm.matrix_world @ arm.data.bones['Hip'].head_local
ch.matrix_world = Matrix.Translation(Vector((hip.x, 0.0, 0.0))) @ Matrix.Scale(k, 4) @ Matrix.Translation(Vector((-cx, -cy, -zmin)))
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print('HEDEF olcek=%.3f kose=%d iskelet_donus=%s' % (k, len(ch.data.vertices), [round(x, 2) for x in arm.matrix_world.to_euler()]))

# ---- dikişleri kaynakla: üretilmiş modellerde gövde, doku dikişlerinde birbirine bağlı olmayan parçalardan oluşur;
# bağlanmazsa hareket edince dikişler açılır ve içi görünür. Aynı yerdeki köşeler birleştirilir (dokular köşe başına değil,
# yüz köşesi başına saklandığı için bozulmaz).
only(ch)
n0 = len(ch.data.vertices)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
if WELD > 0.0:
    bpy.ops.mesh.remove_doubles(threshold=WELD)
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
print('KAYNAK %d -> %d kose' % (n0, len(ch.data.vertices)))

# ---- sadeleştir
tri = sum(len(p.vertices) - 2 for p in ch.data.polygons)
if tri > TRIS * 1.15:
    md = ch.modifiers.new('dec', 'DECIMATE')
    md.ratio = TRIS / tri
    md.delimit = {'UV'}          # doku dikişlerini koru
    bpy.ops.object.modifier_apply(modifier=md.name)
    print('SADELESTIRME %d -> %d ucgen' % (tri, sum(len(p.vertices) - 2 for p in ch.data.polygons)))

# ---- hedefin kol açısı: omuzdan el ucuna
sh = arm.matrix_world @ arm.data.bones['L_Upperarm'].head_local
tip = max((v.co for v in ch.data.vertices), key=lambda c: c.y)
theta = math.atan2(sh.z - tip.z, max(0.01, tip.y - sh.y))
theta = max(0.0, min(math.radians(80), theta))
print('KOL ACISI %.1f derece (el ucu y=%.3f z=%.3f)' % (math.degrees(theta), tip.y, tip.z))


def swing(ob, ang):
    """Üst kolları omuz çevresinde aşağı (ang>0) ya da yukarı döndürür (iskelet uzayında X ekseni çevresinde)."""
    only(ob)
    bpy.ops.object.mode_set(mode='POSE')
    for name, sgn in [('L_Upperarm', -1.0), ('R_Upperarm', 1.0)]:
        pb = ob.pose.bones[name]
        mw = ob.matrix_world
        h = mw @ pb.head          # dünya uzayında omuz: iskelet nesnesinin kendi dönüşü olabilir
        pb.matrix = mw.inverted() @ Matrix.Translation(h) @ Matrix.Rotation(sgn * ang, 4, 'X') @ Matrix.Translation(-h) @ mw @ pb.matrix
        bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode='OBJECT')


# ---- kopya iskelet: A duruşu dinlenme yapılır, otomatik ağırlık
only(arm)
bpy.ops.object.duplicate()
arm2 = bpy.context.view_layer.objects.active
arm2.animation_data_clear()
for pb in arm2.pose.bones:      # kopya, o andaki animasyon karesinin duruşunu taşır: önce dinlenmeye sıfırla
    pb.matrix_basis = Matrix.Identity(4)
bpy.context.view_layer.update()
swing(arm2, theta)
only(arm2)
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.armature_apply(selected=False)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
ch.select_set(True)
arm2.select_set(True)
bpy.context.view_layer.objects.active = arm2
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
dbg('dinlenme', ch, arm2)
used = sum(1 for v in ch.data.vertices if len(v.groups) > 0)
print('AGIRLIK kose=%d agirlikli=%d grup=%d' % (len(ch.data.vertices), used, len(ch.vertex_groups)))
if used < len(ch.data.vertices) * 0.9:
    print('UYARI otomatik agirlik basarisiz: zarf agirligina geciliyor')
    for m in list(ch.modifiers):
        ch.modifiers.remove(m)
    ch.vertex_groups.clear()
    bpy.ops.object.select_all(action='DESELECT')
    ch.select_set(True)
    arm2.select_set(True)
    bpy.context.view_layer.objects.active = arm2
    bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')

# ---- kolları T duruşuna aç, ağı o hâlde dondur
swing(arm2, -theta)
bpy.context.view_layer.update()
dbg('idle', ch, arm2)
only(ch)
for m in [m for m in ch.modifiers if m.type == 'ARMATURE']:
    bpy.ops.object.modifier_apply(modifier=m.name)
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.data.objects.remove(arm2, do_unlink=True)

# ---- özgün iskelete bağla (ağırlık grupları aynı adlarla duruyor)
ch.parent = arm
md = ch.modifiers.new('Armature', 'ARMATURE')
md.object = arm
ch.name = 'govde'
bpy.context.view_layer.update()
dbg('walk', ch, arm)

# ---- dokuları küçült (1024) ve yaz
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        img.scale(1024, 1024)
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
ch.select_set(True)
bpy.context.view_layer.objects.active = arm
kw = dict(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_skins=True, export_image_format='JPEG', export_yup=True)
try:
    bpy.ops.export_scene.gltf(export_animation_mode='ACTIONS', **kw)
except Exception as e:
    print('ACTIONS kipi olmadi:', e)
    bpy.ops.export_scene.gltf(**kw)
print('YAZILDI', OUT)
