extends SceneTree
## Animasyon sınavı (Godot içinde, pencereli çalışır: kare görüntüsü alınır).
##   godot --path godot --resolution 1600x900 --script res://tools/anim_sinav.gd -- <karakter.glb> <cikti_klasoru> [kutuphane]
## Karakter ortak kütüphaneyle (insan profiline eşlenmiş) oynatılır. Her klip için:
##  - ayak gömülmesi: ayak ve parmak kemiklerinin en alt yüksekliği (dinlenme duruşuna göre, cm)
##  - diz yönü: diz, kalça–bilek çizgisinin önünde mi
##  - sıçrama: kareden kareye en büyük kemik dönüşü (derece; döngü dikişi dahil)
##  - kaymayan hız: basan ayağın geriye kayma hızı (m/sn) — oyunda bu hızla yürütülürse ayak kaymaz
##  - geçiş: bekleme -> yürüme -> koşma -> bekleme geçişlerinde (0,25 sn karışım) en büyük kare arası dönüş
## Önden ve yandan kareler <cikti>/kare_<klip>_<t>_<yon>.png olarak kaydedilir.

const DEF_LIB := "res://modeller/karakter/ortak/anim_tripo.glb"
var model: Node3D
var sk: Skeleton3D
var ap: AnimationPlayer
var cam: Camera3D
var out := ""
var jobs: Array = []
var rapor := {}
var wait := 0
var mjobs: Array = []
var ms := {}          # yürüyen ölçüm durumu
var rest_low := INF
var rest_mesh_low := 0.0
const HZ := 30.0


func _initialize() -> void:
	var a := OS.get_cmdline_user_args()
	out = a[1]
	DirAccess.make_dir_recursive_absolute(out)
	var root := get_root()
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color(0.55, 0.56, 0.58)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.7, 0.7, 0.72)
	e.ambient_light_energy = 0.8
	env.environment = e
	root.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-40, -30, 0)
	sun.shadow_enabled = true
	root.add_child(sun)
	var floor_mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(6, 6)
	floor_mi.mesh = pm
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color(0.32, 0.29, 0.25)
	floor_mi.material_override = fm
	root.add_child(floor_mi)
	# zemin çizgisi: gömülme gözle de görülsün
	model = load(a[0]).instantiate()
	root.add_child(model)
	for n in model.find_children("*", "Skeleton3D", true, false):
		sk = n
	ap = AnimationPlayer.new()
	model.add_child(ap)
	ap.root_node = NodePath("..")
	var lib: AnimationLibrary = load(a[2] if a.size() > 2 else DEF_LIB)
	ap.add_animation_library("", lib)
	for nm in ["idle", "walk", "run"]:
		if ap.has_animation(nm):
			ap.get_animation(nm).loop_mode = Animation.LOOP_LINEAR
	cam = Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = 2.1
	root.add_child(cam)
	cam.current = true
	for nm in ["idle", "walk", "run", "shoot", "fall", "sit", "agree"]:
		if ap.has_animation(nm):
			mjobs.append(nm)
	for nm in ["idle", "walk", "run", "sit", "fall", "shoot", "agree"]:
		if not ap.has_animation(nm):
			continue
		var L: float = ap.get_animation(nm).length
		var fs := [0.0, 0.25, 0.5, 0.75] if nm in ["walk", "run"] else ([0.0, 0.5] if nm == "idle" else [0.5, 0.95])
		for f in fs:
			for yon in ["on", "yan"]:
				jobs.append([nm, f * L, yon])


func _bone_g(name: String) -> Vector3:
	var i := sk.find_bone(name)
	return (sk.global_transform * sk.get_bone_global_pose(i)).origin


func _pose_at(nm: String, t: float) -> void:
	ap.play(nm)
	ap.seek(t, true)
	ap.advance(0.0)


func _rots() -> Array:
	var r := []
	for i in sk.get_bone_count():
		r.append(sk.get_bone_global_pose(i).basis.get_rotation_quaternion())
	return r


func _max_delta(r0: Array, r1: Array) -> float:
	var m := 0.0
	for i in r0.size():
		m = maxf(m, rad_to_deg(r0[i].angle_to(r1[i])))
	return m


## Bir klibin bir örneği: kare başına bir kez çağrılır
func _sample(nm: String, k: int) -> bool:
	var an: Animation = ap.get_animation(nm)
	var L := an.length
	var n := int(ceil(L * HZ))
	if k == 0:
		ms = {"mlow": INF, "low": INF, "knee_ok": true, "knee_worst": 0.0, "jump": 0.0, "prev": [], "first": [], "lf": []}
	var t := minf(L, k / HZ)
	_pose_at(nm, t)
	var r := _rots()
	if k == 0:
		ms["first"] = r
	if ms["prev"].size() > 0:
		for bi in r.size():
			var dd := rad_to_deg(ms["prev"][bi].angle_to(r[bi]))
			if dd > ms["jump"]:
				ms["jump"] = dd
				ms["jump_at"] = "%s@%.2fs" % [sk.get_bone_name(bi), t]
	ms["prev"] = r
	if k % 3 == 1 or k == n:      # 0. örnek atlanır: ağ, bir önceki klibin pozunda kalmış olabilir
		var ml := _mesh_low()
		if ml < ms["mlow"]:
			ms["mlow"] = ml
			var best := ""
			var bd := INF
			for bi in sk.get_bone_count():
				var dd2 := _bone_g(sk.get_bone_name(bi)).distance_to(low_pos)
				if dd2 < bd:
					bd = dd2
					best = sk.get_bone_name(bi)
			ms["mlow_at"] = "%.2fs %s" % [t, best]
	var fwd := model.global_transform.basis.z.normalized()
	for side in ["Left", "Right"]:
		var fy := minf(_bone_g(side + "Foot").y, _bone_g(side + "Toes").y)
		ms["low"] = minf(ms["low"], fy)
		var hip := _bone_g(side + "UpperLeg")
		var knee := _bone_g(side + "LowerLeg")
		var foot := _bone_g(side + "Foot")
		var line := foot - hip
		var tt := clampf((knee - hip).dot(line) / maxf(line.length_squared(), 1e-6), 0.0, 1.0)
		var dv := knee - (hip + line * tt)
		if dv.length() > 0.025 and dv.dot(fwd) < -0.01:
			ms["knee_ok"] = false
			ms["knee_worst"] = minf(ms["knee_worst"], dv.dot(fwd))
	ms["lf"].append([_bone_g("LeftFoot"), _bone_g("RightFoot")])
	if k < n:
		return false
	var seam := _max_delta(ms["prev"], ms["first"])
	var speeds := []
	var lf: Array = ms["lf"]
	for i in range(1, lf.size()):
		var j := 0 if lf[i][0].y < lf[i][1].y else 1
		speeds.append(-(lf[i][j] - lf[i - 1][j]).dot(fwd) * HZ)
	speeds.sort()
	rapor[nm] = {"sure_sn": snappedf(L, 0.01), "ag_en_alt_cm": snappedf((ms["mlow"] - rest_mesh_low) * 100.0, 0.1), "ag_en_alt_an": ms.get("mlow_at", ""), "ayak_kemigi_en_alt_cm": snappedf((ms["low"] - rest_low) * 100.0, 0.1),
		"diz_dogru_yon": ms["knee_ok"], "diz_en_kotu_cm": snappedf(ms["knee_worst"] * 100.0, 0.1),
		"en_buyuk_sicrama_derece_30hz": snappedf(ms["jump"], 0.1), "sicrama_yeri": ms.get("jump_at", ""), "dongu_dikisi_derece": snappedf(seam, 0.1),
		"kaymayan_hiz_m_sn": snappedf(speeds[speeds.size() / 2], 0.01)}
	return true


func _transitions() -> void:
	var tr := {}
	for pair in [["idle", "walk"], ["walk", "run"], ["run", "idle"]]:
		ap.play(pair[0])
		ap.seek(0.3, true)
		ap.advance(0.0)
		var r0 := _rots()
		ap.play(pair[1], 0.25)
		var m := 0.0
		for k in 30:
			ap.advance(1.0 / 60.0)
			var r1 := _rots()
			m = maxf(m, _max_delta(r0, r1))
			r0 = r1
		tr["%s>%s" % pair] = snappedf(m, 0.1)
	rapor["gecis_en_buyuk_kare_donusu_derece_60hz"] = tr


var mk := 0
var meshes: Array = []
var low_pos := Vector3.ZERO


## Kemiklerle bükülmüş ağın en alt noktası (dünya y). Zemine gömülme bununla ölçülür.
func _mesh_low() -> float:
	if meshes.is_empty():
		for m in model.find_children("*", "MeshInstance3D", true, false):
			if m.skin != null or m.get_parent() is Skeleton3D:
				meshes.append(m)
	var low := INF
	for mi in meshes:
		var baked: ArrayMesh = mi.bake_mesh_from_current_skeleton_pose()
		if baked == null:
			continue
		var xf: Transform3D = mi.global_transform
		for si in baked.get_surface_count():
			var arr := baked.surface_get_arrays(si)
			for v in arr[Mesh.ARRAY_VERTEX]:
				var wv: Vector3 = xf * v
				if wv.y < low:
					low = wv.y
					low_pos = wv
	return low
var started := false


func _process(_dt: float) -> bool:
	if not started:
		started = true
		ap.stop()
		sk.reset_bone_poses()
		rest_low = minf(minf(_bone_g("LeftToes").y, _bone_g("RightToes").y), minf(_bone_g("LeftFoot").y, _bone_g("RightFoot").y))
		rest_mesh_low = _mesh_low()
		rapor["dinlenme_ag_en_alt_cm"] = snappedf(rest_mesh_low * 100.0, 0.1)
		return false
	if not mjobs.is_empty():
		if _sample(mjobs[0], mk):
			mjobs.pop_front()
			mk = 0
			if mjobs.is_empty():
				_transitions()
				print("SINAV ", JSON.stringify(rapor))
		else:
			mk += 1
		return false
	if wait > 0:
		wait -= 1
		if wait == 0:
			var j: Array = jobs.pop_front()
			var img := get_root().get_texture().get_image()
			img.save_png("%s/kare_%s_%03d_%s.png" % [out, j[0], int(j[1] * 100.0), j[2]])
		return false
	if jobs.is_empty():
		print("BITTI")
		return true
	var j2: Array = jobs[0]
	_pose_at(j2[0], j2[1])
	ap.pause()
	var c := Vector3(0, 0.9, 0)
	cam.position = c + (Vector3(0, 0.9, 4) if j2[2] == "on" else Vector3(4, 0.9, 0))      # hafif yukarıdan: zemin görünsün
	cam.look_at(c)
	wait = 3
	return false
