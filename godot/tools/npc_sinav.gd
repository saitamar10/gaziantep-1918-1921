extends SceneTree
## Oyun kodu (scripts/npc.gd) üzerinden karakter sınavı: oyundaki gibi kurulur, yürür, koşar, duruş değiştirir.
##   godot --path godot --resolution 800x900 --script res://tools/npc_sinav.gd -- <K kodu> <cikti_klasoru>
## Önden, yandan, arkadan kareler alınır; ayağın zemine göre yüksekliği ve yürüyüşte ayak kayması ölçülür.

var out := ""
var npc: Npc
var cam: Camera3D
var t := 0.0
var steps: Array = []
var si := 0
var step_t := 0.0
var rapor := {}
var foot_prev := Vector3.ZERO
var slide := []
var sk: Skeleton3D
var pending := ""


func _initialize() -> void:
	var a := OS.get_cmdline_user_args()
	out = a[1]
	DirAccess.make_dir_recursive_absolute(out)
	var root := get_root()
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color(0.62, 0.66, 0.7)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.75, 0.73, 0.7)
	e.ambient_light_energy = 0.7
	env.environment = e
	root.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-45, -35, 0)
	sun.shadow_enabled = true
	root.add_child(sun)
	var fl := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(40, 40)
	fl.mesh = pm
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color(0.55, 0.47, 0.36)
	fl.material_override = fm
	root.add_child(fl)
	var o: Dictionary = Npcs.LOOKS[a[0]].duplicate()
	o["tag"] = "sinav"
	npc = Npc.new().setup(o)
	root.add_child(npc)
	npc.put(0.0, 0.0, 0.0)
	for n in npc.model.find_children("*", "Skeleton3D", true, false):
		sk = n
	cam = Camera3D.new()
	cam.fov = 35.0
	root.add_child(cam)
	cam.current = true
	# [ad, duruş, hız (0: durur), süre, kare alınacak yönler]
	steps = [
		["idle", "idle", 0.0, 1.5, ["on", "yan", "arka"]],
		["walk", "idle", 1.2, 2.6, ["on", "yan", "arka"]],
		["run", "idle", 3.2, 2.0, ["on", "yan"]],
		["sit", "sit", 0.0, 2.5, ["on", "yan"]],
		["kneel", "kneel", 0.0, 2.5, ["on", "yan", "capraz", "capraz2"]],
		["down", "down", 0.0, 2.8, ["on", "yan"]],
		["talk", "idle", 0.0, 1.8, ["on"]],
	]
	_begin()


func _begin() -> void:
	var s: Array = steps[si]
	step_t = 0.0
	slide = []
	npc.put(0.0, 0.0, 0.0)
	npc.set_pose(s[1])
	npc.speed = s[2]
	npc.moving = false        # yeni hızın klibi (yürüme/koşma) seçilsin
	npc.anim.speed_scale = 1.0
	if s[2] > 0.0:
		npc.route = [Vector3(0, 0, 60)]
	if s[0] == "talk":
		npc.say("Sınav", 2.0)


## Kemiklerle bükülmüş ağın en alt noktası (dünya y): ayak tabanı zemine değiyor mu
func _foot_low() -> float:
	var lo := INF
	for mi in npc.model.find_children("*", "MeshInstance3D", true, false):
		if mi.skin == null or not (mi.mesh is ArrayMesh):      # yalnız iskeletli ağ (kemiğe takılı tüfek sayılmaz)
			continue
		var baked: ArrayMesh = mi.bake_mesh_from_current_skeleton_pose()
		if baked == null:
			continue
		var xf: Transform3D = mi.global_transform
		for si2 in baked.get_surface_count():
			for v in baked.surface_get_arrays(si2)[Mesh.ARRAY_VERTEX]:
				lo = minf(lo, (xf * v).y)
	return lo


func _process(dt: float) -> bool:
	t += dt
	if pending != "":
		get_root().get_texture().get_image().save_png(pending)
		pending = ""
	if si >= steps.size():
		print("NPC_SINAV ", JSON.stringify(rapor))
		print("BITTI")
		return true
	var s: Array = steps[si]
	step_t += dt
	var dirs: Array = s[4]
	var shot_ts := []
	for k in dirs.size():
		shot_ts.append(s[3] - 0.2 * (dirs.size() - k))
	# basan ayağın dünya hızı (yürürken ayak yerde kaymamalı)
	if s[2] > 0.0 and step_t > 0.6:
		var lf := (sk.global_transform * sk.get_bone_global_pose(sk.find_bone("LeftFoot"))).origin
		var rf := (sk.global_transform * sk.get_bone_global_pose(sk.find_bone("RightFoot"))).origin
		var f := lf if lf.y < rf.y else rf
		if foot_prev != Vector3.ZERO and dt > 0.0:
			slide.append([f.y, Vector2(f.x - foot_prev.x, f.z - foot_prev.z).length() / dt])
		foot_prev = f
	else:
		foot_prev = Vector3.ZERO
	var c := npc.global_position + Vector3(0, 0.95, 0)
	for k in dirs.size():
		if absf(step_t - shot_ts[k]) < dt * 0.5 + 0.001 or (step_t >= shot_ts[k] and step_t - dt < shot_ts[k]):
			var off: Vector3 = {"on": Vector3(0, 0.6, 5.2), "yan": Vector3(5.2, 0.6, 0), "arka": Vector3(0, 0.6, -5.2), "capraz": Vector3(2.2, 0.5, 2.2), "capraz2": Vector3(-2.2, 0.5, 2.2)}[dirs[k]]
			cam.position = c + off
			cam.look_at(c)
			pending = "%s/oyun_%s_%s.png" % [out, s[0], dirs[k]]      # bu kare çizilince kaydedilir
	if step_t >= s[3]:
		var r := {"anim": npc.cur_anim, "ayak_zemin_cm": snappedf(_foot_low() * 100.0, 0.1), "hiz_olcegi": snappedf(npc.anim.speed_scale, 0.01)}
		if slide.size() > 4:
			# yere değen ayak: alttaki ayak, bu adımdaki en alçak ayak yüksekliğine 3 cm'den yakın
			var ylo := INF
			for q in slide:
				ylo = minf(ylo, q[0])
			var vs := []
			for q in slide:
				if q[0] < ylo + 0.03:
					vs.append(q[1])
			vs.sort()
			r["basan_ayak_hizi_m_sn_medyan"] = snappedf(vs[vs.size() / 2], 0.02)
		rapor[s[0]] = r
		si += 1
		if si < steps.size():
			_begin()
	return false
