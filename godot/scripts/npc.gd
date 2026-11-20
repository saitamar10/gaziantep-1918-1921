class_name Npc
extends Node3D
## Yer tutucu sakin: basit bir figür (gövde, baş, başlık). Web sürümündeki mankenlerin karşılığıdır; NİHAİ KARAKTER DEĞİLDİR.
## Görünüşte esas, kullanıcının karakter paftasıdır; gerçek GLB modelleri geldiğinde bu sınıfın figür kısmı model yüklemeyle değişecek.
## Kimlik, rol ve davranış (yürüme, duruş, konuşma balonu) burada kalır.

var id := 0
var tag := ""
var def := ""            # karakter paftasındaki kod (K01…K15)
var role := ""           # esnaf, gezen, hamal, sucu, evkadini, cocuk, yasli, dusman, sabit
var grp := ""            # hikâye grubu (bölüme göre açılıp kapanır); boşsa her zaman sokaktadır
var story := false
var family := "male"     # male | female | child | soldier
var kimlik := {}         # ad, cemaat, meslek, etiket
var kisi := ""           # etikette görünen kısa tanım
var hidden := false      # sahneden çekilmiş (grup kapalı, mahzene inmiş, sırtlanmış)
var hide_t := 0.0        # > 0 ise bu süre sonunda yeniden görünür
var external := false    # başka bir sistem (çatışma) yönetiyor: kendi kendine yürümez
var pose := ""
var height := 1.7
var city: City
var route: Array = []    # gidilecek noktalar (dünya konumu); boşalınca durur
var speed := 1.2
var wait := 0.0
var say_t := 0.0
var label: Label3D
var body_root: Node3D
var legs: MeshInstance3D
var phase := 0.0
var s := 1.0
# Gerçek karakter modeli (iskeletli, animasyonlu GLB). Varsa yer tutucu figür kurulmaz.
var model: Node3D
var anim: AnimationPlayer
var cur_anim := ""
var moving := false
## Rotanın sonuna varınca bir kez çağrılır (gündelik işler: çeşmede bekleme, pazarlık, oyunun bitmesi)
var arrive_cb := Callable()
var carry_node: Node3D
## Yürüme klibinin ayak kaydırmayan hızı (m/sn, bu bedenin ölçeğinde). -1: henüz ölçülmedi, 0: ölçülemedi.
var walk_ref := -1.0
var run_ref := 0.0
var model_path := ""
var anim_far := false
static var _walk_cache := {}
## Oyundaki duruş -> modeldeki animasyon adı (yoksa bekleme oynar)
const POSE_ANIM := {"idle": "idle", "sit": "sit", "kneel": "shoot", "down": "fall", "run": "run", "talk": "agree"}
const LOOPED := ["idle", "walk", "run", "shoot", "sit"]

const SKIN := Color(0.72, 0.55, 0.41)
static var _mats := {}


## Aynı renk için tek malzeme (yüzlerce parça için yüzlerce malzeme üretilmesin)
static func mat(c: Color) -> StandardMaterial3D:
	var k := c.to_html()
	if not _mats.has(k):
		var m := StandardMaterial3D.new()
		m.albedo_color = c
		m.roughness = 0.9
		_mats[k] = m
	return _mats[k]


func _part(mesh: Mesh, y: float, c: Color) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position.y = y
	mi.material_override = mat(c)
	mi.visibility_range_end = 140.0
	body_root.add_child(mi)
	return mi


func setup(o: Dictionary) -> Npc:
	tag = o.get("tag", "")
	kisi = o.get("kisi", "")
	speed = o.get("speed", 1.2)
	family = o.get("family", "male")
	body_root = Node3D.new()
	add_child(body_root)
	height = o.get("height", 1.7)
	s = height / 1.7
	if o.has("model") and ResourceLoader.exists(o["model"]):
		model_path = o["model"]
		_load_model(o["model"], o.get("model_h", 1.0), o.get("model_yaw", PI * 0.5))
		model.position.y = o.get("model_y", 0.0)      # ortak animasyonun zemini bu bedenden farklıysa ayak düzeltmesi
		if o.get("rifle", false) and family != "soldier":      # silahlı nöbetçi sivil: tüfek sırtta asılı
			_rifle()
		_label()
		phase = randf() * 6.28
		set_pose(o.get("pose", "idle"))
		return self
	var top: Color = o.get("top", Color(0.25, 0.22, 0.2))
	var bot: Color = o.get("bot", top.darkened(0.2))
	var long_dress: bool = o.get("dress", false)
	var lm := CylinderMesh.new()
	lm.top_radius = 0.17 * s
	lm.bottom_radius = (0.3 if long_dress else 0.2) * s
	lm.height = 0.85 * s
	lm.radial_segments = 8
	legs = _part(lm, 0.425 * s, bot)
	var tm := CapsuleMesh.new()
	tm.radius = 0.2 * s
	tm.height = 0.72 * s
	tm.radial_segments = 8
	tm.rings = 3
	var torso := _part(tm, 1.16 * s, top)
	torso.scale = Vector3(1.0, 1.0, 0.72)
	if o.has("sash"):
		var sm := CylinderMesh.new()
		sm.top_radius = 0.2 * s
		sm.bottom_radius = 0.21 * s
		sm.height = 0.1 * s
		sm.radial_segments = 8
		_part(sm, 0.9 * s, o["sash"]).scale = Vector3(1.0, 1.0, 0.76)
	var hm := SphereMesh.new()
	hm.radius = 0.105 * s
	hm.height = 0.24 * s
	hm.radial_segments = 10
	hm.rings = 6
	var head := _part(hm, 1.6 * s, SKIN)
	var hat: String = o.get("hat", "")
	if hat == "fes" or hat == "kalpak" or hat == "helmet":
		var fm := CylinderMesh.new()
		fm.top_radius = (0.078 if hat == "fes" else 0.11) * s
		fm.bottom_radius = (0.09 if hat == "fes" else (0.135 if hat == "helmet" else 0.105)) * s
		fm.height = (0.12 if hat == "fes" else (0.1 if hat == "helmet" else 0.17)) * s
		fm.radial_segments = 10
		var hc := Color(0.5, 0.13, 0.11) if hat == "fes" else Color(0.1, 0.09, 0.08)
		_part(fm, (1.72 if hat == "helmet" else 1.74) * s, o.get("hat_color", hc))
	elif hat == "scarf":
		var scm := SphereMesh.new()
		scm.radius = 0.125 * s
		scm.height = 0.3 * s
		scm.radial_segments = 10
		scm.rings = 6
		_part(scm, 1.6 * s, o.get("scarf", Color(0.85, 0.8, 0.72))).position.z = -0.02
		head.position.z = 0.035
	elif hat == "sarik":
		var srm := SphereMesh.new()
		srm.radius = 0.12 * s
		srm.height = 0.13 * s
		_part(srm, 1.7 * s, Color(0.8, 0.76, 0.66))
	if o.get("rifle", false):
		_rifle()
	_label()
	phase = randf() * 6.28
	set_pose(o.get("pose", "idle"))
	return self


func _rifle() -> void:
	var rm := BoxMesh.new()
	rm.size = Vector3(0.04, 1.15, 0.05)
	var r := _part(rm, 1.15 * s, Color(0.22, 0.16, 0.11))
	r.position = Vector3(0.05, 1.15 * s, -0.17)
	r.rotation.z = 0.5
	# gerçek modelde: tüfek modeli (modeller/silah/tufek.glb). Atış/nişan klibinde kabza sağ elde, namlu sol ele doğru;
	# diğer kliplerde sırtta, göğüs kemiğine göre (oturunca, düşünce bedenle gider). Her kare _rifle_update().
	if model == null:
		return
	var sks := model.find_children("*", "Skeleton3D", true, false)
	if sks.is_empty():
		return
	r_sk = sks[0]
	r_chest = r_sk.find_bone("UpperChest")
	r_rh = r_sk.find_bone("RightHand")
	r_lh = r_sk.find_bone("LeftHand")
	if r_chest < 0 or r_rh < 0 or r_lh < 0:
		r_sk = null
		return
	if ResourceLoader.exists(TUFEK):
		r.queue_free()
		rifle_node = (load(TUFEK) as PackedScene).instantiate()
		body_root.add_child(rifle_node)
	else:
		rifle_node = r
	# sırtta duruş (gövde uzayında): kabza bel hizasında arkada, namlu sağ omzun üstünden yukarı, nişangâh dışa
	var mdir := Vector3(-sin(0.42), cos(0.42), 0.0)
	var back := Transform3D(Basis.looking_at(mdir, Vector3(0, 0, -1)), Vector3(0.1, 0.92 * s, -0.17))
	var to_body := Transform3D.IDENTITY          # iskeletten gövdeye (model ile iskelet arasındaki ara düğümler dahil)
	var nd: Node = r_sk
	while nd != null and nd != body_root:
		to_body = (nd as Node3D).transform * to_body
		nd = nd.get_parent()
	r_back = r_sk.get_bone_global_rest(r_chest).affine_inverse() * to_body.affine_inverse() * back
	_setup_aim_ik()


const TUFEK := "res://modeller/silah/tufek.glb"
## kişinin tüfeği (gerçek modelde): iskelet, göğüs/sağ el/sol el kemikleri, sırttaki yeri (göğüs kemiğine göre)
var rifle_node: Node3D
var r_sk: Skeleton3D
var r_chest := -1
var r_rh := -1
var r_lh := -1
var r_back := Transform3D.IDENTITY


func _rifle_update() -> void:
	if r_sk == null or rifle_node == null or not is_inside_tree() or not visible:
		return
	if cur_anim == "shoot" and r_aim_ok:
		return                      # nişanda tüfek ve kollar _aim_apply'da (animasyondan hemen sonra) kurulur
	var t := r_sk.global_transform * r_sk.get_bone_global_pose(r_chest) * r_back
	rifle_node.global_transform = t.orthonormalized()


## Nişan: animasyon uygulandıktan hemen sonra (AnimationPlayer.mixer_applied) tüfek gövdenin önüne konur — dipçik sağ
## omuz çukurunda, namlu ileri ve hafif aşağı, nişangâh yukarı — ve iki kol iki-kemik IK ile kabzaya ve kundağa uzanır.
## (Godot'nun TwoBoneIK3D düğümü bu iskelette etki etmedi; çözüm burada elle.)
var r_aim_ok := false
var r_bones := {}


func _setup_aim_ik() -> void:
	for n in ["RightShoulder", "RightUpperArm", "RightLowerArm", "RightHand", "LeftShoulder", "LeftUpperArm", "LeftLowerArm", "LeftHand"]:
		var i := r_sk.find_bone(n)
		if i < 0:
			return
		r_bones[n] = i
	if anim == null:
		return
	anim.mixer_applied.connect(_aim_apply)
	r_aim_ok = true


func _aim_apply() -> void:
	if cur_anim != "shoot" or r_sk == null or rifle_node == null or not is_inside_tree() or not visible:
		return
	var skg := r_sk.global_transform
	var ch := r_sk.get_bone_global_pose(r_chest)
	var rsh := r_sk.get_bone_global_pose(r_bones["RightUpperArm"]).origin
	var lsh := r_sk.get_bone_global_pose(r_bones["LeftUpperArm"]).origin
	# iskelet uzayında gövde çerçevesi: yukarı = göğüs kemiği, ileri = modelin önü (+Z), sağ = ileri x yukarı
	var u := ch.basis.y.normalized()
	# ileri: göğsün baktığı yön (klipte gövde dönebilir); işaret, modelin önüyle aynı yarı uzayda olacak şekilde
	var fm := (skg.basis.inverse() * global_transform.basis.z).normalized()
	var f := ch.basis.z.normalized()
	if f.dot(fm) < 0.0:
		f = -f
	f = (f - u * f.dot(u)).normalized()
	var r := f.cross(u).normalized()
	var dirv := (f - u * 0.05).normalized()
	var grip := rsh + dirv * 0.19 - r * 0.11 - u * 0.02      # dipçik omuz çukurunda, tüfek yanak hizasında
	var fore := grip + dirv * 0.25
	_two_bone("RightUpperArm", "RightLowerArm", "RightHand", grip - u * 0.035 - dirv * 0.03, rsh + r * 0.3 - u * 0.4)
	_two_bone("LeftUpperArm", "LeftLowerArm", "LeftHand", fore - u * 0.05, lsh - r * 0.25 - u * 0.45 + dirv * 0.1)
	if OS.has_environment("NISAN_IZ") and Engine.get_process_frames() % 20 == 0:
		print("NISAN on_uyum=%.2f sag=%.3f sol=%.3f" % [ch.basis.z.normalized().dot(fm), r_sk.get_bone_global_pose(r_bones["RightHand"]).origin.distance_to(grip - u * 0.035 - dirv * 0.03), r_sk.get_bone_global_pose(r_bones["LeftHand"]).origin.distance_to(fore - u * 0.05)])
	rifle_node.global_transform = skg * Transform3D(Basis.looking_at(dirv, u), grip)
	rifle_node.global_transform = rifle_node.global_transform.orthonormalized()


## İki kemikli zinciri (kol: üst kol, ön kol, el) iskelet uzayındaki hedefe uzatır; dirsek pole noktasına doğru bükülür.
func _two_bone(up_n: String, lo_n: String, end_n: String, target: Vector3, pole: Vector3) -> void:
	var bu: int = r_bones[up_n]
	var bl: int = r_bones[lo_n]
	var be: int = r_bones[end_n]
	var gu := r_sk.get_bone_global_pose(bu)
	var gl := r_sk.get_bone_global_pose(bl)
	var ge := r_sk.get_bone_global_pose(be)
	var A := gu.origin
	var B := gl.origin
	var C := ge.origin
	var l1 := A.distance_to(B)
	var l2 := B.distance_to(C)
	var tv := target - A
	var d := clampf(tv.length(), 0.05, l1 + l2 - 0.002)
	var dt := tv.normalized()
	var pv := (pole - A) - dt * (pole - A).dot(dt)
	if pv.length() < 1e-4:
		return
	pv = pv.normalized()
	var ca := clampf((l1 * l1 + d * d - l2 * l2) / (2.0 * l1 * d), -1.0, 1.0)
	var B2 := A + dt * l1 * ca + pv * l1 * sqrt(1.0 - ca * ca)
	var T2 := A + dt * d
	var q1 := Quaternion((B - A).normalized(), (B2 - A).normalized())
	var c_rot := q1 * (C - B)
	var q2 := Quaternion(c_rot.normalized(), (T2 - B2).normalized())
	var new_gu := Basis(q1) * gu.basis
	var new_gl := Basis(q2 * q1) * gl.basis
	var par_u := r_sk.get_bone_parent(bu)
	var pgu := r_sk.get_bone_global_pose(par_u).basis if par_u >= 0 else Basis.IDENTITY
	r_sk.set_bone_pose_rotation(bu, (pgu.inverse() * new_gu).get_rotation_quaternion())
	r_sk.set_bone_pose_rotation(bl, (new_gu.inverse() * new_gl).get_rotation_quaternion())


func _label() -> void:
	label = Label3D.new()
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = true
	label.pixel_size = 0.0045
	label.font_size = 40
	label.outline_size = 10
	label.modulate = Color(0.97, 0.92, 0.82)
	label.visible = false
	label.width = 620
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(label)


## Modeli yükler, boyunu `height` metreye ölçekler, döngülü animasyonları işaretler.
## yaw: Tripo iskeletli modellerin önü -X'e bakar (PI/2); MakeHuman (MPFB) modellerinin önü zaten +Z'dir (0).
## Kendi animasyonu olmayan MakeHuman modelleri ortak kütüphaneyi (insan profiline eşlenmiş, tools/anim_aktar.py) oynatır.
const ORTAK_ANIM := "res://modeller/karakter/ortak/anim_mpfb.glb"


func _load_model(path: String, model_h: float, yaw: float) -> void:
	model = load(path).instantiate()
	body_root.add_child(model)
	var k := height / maxf(0.01, model_h)
	model.scale = Vector3(k, k, k)
	# oyunda kişiler +Z'ye doğru yürür (ölçülerek doğrulandı: --karakter-yaw)
	model.rotation.y = yaw
	anim = model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if (anim == null or not anim.has_animation("walk")) and ResourceLoader.exists(ORTAK_ANIM):
		if anim == null:
			anim = AnimationPlayer.new()
			model.add_child(anim)
			anim.root_node = NodePath("..")
		anim.add_animation_library("", load(ORTAK_ANIM) as AnimationLibrary)
	if anim != null:
		for a in LOOPED:
			if anim.has_animation(a):
				anim.get_animation(a).loop_mode = Animation.LOOP_LINEAR
		# tek seferlik klip (baş sallama) bitince duruşun klibine dönülür; araya giren yürüyüş onu zaten keser
		anim.animation_finished.connect(func(nm: StringName) -> void:
			if nm == &"agree":
				cur_anim = ""
				_play(POSE_ANIM.get(pose, "idle")))
	for mi in model.find_children("*", "MeshInstance3D", true, false):
		mi.visibility_range_end = 160.0
		# giysinin iç yüzü de çizilsin (etek, yen, palto altı): tek yüzlü kalırsa içinden bakınca delik gibi görünür
		for si in mi.mesh.get_surface_count():
			var sm: Material = mi.mesh.surface_get_material(si)
			if sm is BaseMaterial3D:
				sm.cull_mode = BaseMaterial3D.CULL_DISABLED


func _play(a: String) -> void:
	if anim == null or a == cur_anim:
		return
	if not anim.has_animation(a):
		a = "idle"
		if a == cur_anim or not anim.has_animation(a):
			return
	cur_anim = a
	anim.play(a, 0.25)
	if a in LOOPED:
		anim.seek(randf() * 0.8, false)


## Yürüme klibinde ayağın bir adımda kat ettiği yolu ölçer -> ayağın yerde kaymadığı yürüyüş hızı.
## (Animasyon skill'inin kuralı: hız göz kararı seçilmez, klipten ölçülür.) Aynı model için bir kez ölçülür.
func _measure_walk() -> void:
	walk_ref = 0.0
	run_ref = 0.0
	if anim == null or not anim.has_animation("walk"):
		return
	var sks := model.find_children("*", "Skeleton3D", true, false)
	if sks.is_empty():
		return
	var keep := cur_anim
	walk_ref = _clip_ref(sks[0], "walk") * model.scale.x
	if anim.has_animation("run"):
		run_ref = _clip_ref(sks[0], "run") * model.scale.x
	cur_anim = ""
	_play(keep if keep != "" else "idle")


## Klipte yere basan (alttaki) ayağın geriye kayma hızının ortancası (m/sn, model ölçeği 1). Oyunda kişi bu hızla
## ilerlerse basan ayak yerde durur. Aynı model ve klip için bir kez ölçülür.
func _clip_ref(sk: Skeleton3D, clip: String) -> float:
	var key := model_path + ":" + clip
	if _walk_cache.has(key):
		return _walk_cache[key]
	var lf := sk.find_bone("L_Foot")
	var rf := sk.find_bone("R_Foot")
	if lf < 0:
		lf = sk.find_bone("LeftFoot")      # insan profiline eşlenmiş iskelet
		rf = sk.find_bone("RightFoot")
	if lf < 0 or rf < 0:
		_walk_cache[key] = 0.0
		return 0.0
	var an := anim.get_animation(clip)
	anim.play(clip)
	var n := 60
	var dtc := an.length / n
	var prev: Array[Vector3] = []
	var pts: Array = []
	for i in n + 1:
		anim.seek(dtc * i, true)
		pts.append([sk.get_bone_global_pose(lf).origin, sk.get_bone_global_pose(rf).origin])
	# ilerleme ekseni: ayakların en çok gidip geldiği yatay eksen
	var span := Vector3.ZERO
	for q in pts:
		span = span.max((q[0] - pts[0][0]).abs())
	var ax := 0 if span.x > span.z else 2
	# yalnız yere değen ayak sayılır: alttaki ayak, klipteki en alçak ayak yüksekliğine 3 cm'den yakınsa
	var ylo := INF
	for q in pts:
		ylo = minf(ylo, minf(q[0].y, q[1].y))
	var sp: Array[float] = []
	for i in range(1, pts.size()):
		var j := 0 if pts[i][0].y < pts[i][1].y else 1
		if pts[i][j].y < ylo + 0.03 and pts[i - 1][j].y < ylo + 0.03:
			sp.append(absf(pts[i][j][ax] - pts[i - 1][j][ax]) / dtc)
	if sp.is_empty():
		_walk_cache[key] = 0.0
		return 0.0
	sp.sort()
	var v: float = sp[sp.size() / 2]
	_walk_cache[key] = v
	print("YURUYUS_OLCUM %s %s hiz=%.2f m/sn sure=%.2f sn" % [model_path.get_file(), clip, v * model.scale.x, an.length])
	return v


## Uzaktaki modelin animasyonu duraklatılır (iskelet her kare yeniden hesaplanmasın)
func set_far(f: bool) -> void:
	if anim == null or f == anim_far:
		return
	anim_far = f
	if f:
		anim.pause()
	else:
		anim.play()


## Taşınan yük: "sack" (sırtta çuval) | "jug" (elde testi) | "" (yok)
func set_carry(kind: String) -> void:
	if carry_node != null:
		carry_node.queue_free()
		carry_node = null
	if kind == "":
		return
	carry_node = Node3D.new()
	body_root.add_child(carry_node)
	var mi := MeshInstance3D.new()
	if kind == "sack":
		var b := BoxMesh.new()
		b.size = Vector3(0.52, 0.4, 0.34) * s
		mi.mesh = b
		mi.position = Vector3(0, 1.32 * s, -0.2 * s)
		mi.rotation.x = 0.25
		mi.material_override = mat(Color(0.6, 0.5, 0.34))
	else:
		var c := CylinderMesh.new()
		c.top_radius = 0.07 * s
		c.bottom_radius = 0.13 * s
		c.height = 0.34 * s
		c.radial_segments = 8
		mi.mesh = c
		mi.position = Vector3(0.27 * s, 0.72 * s, 0.05)
		mi.material_override = mat(Color(0.55, 0.32, 0.2))
	mi.visibility_range_end = 90.0
	carry_node.add_child(mi)


## Duruş: idle | sit (taşa oturmuş) | kneel (siperde çökmüş) | down (yere düşmüş) | run
func set_pose(p: String) -> void:
	if p == pose:
		return
	pose = p
	if model != null:
		label.position.y = (1.25 if p == "sit" else (0.7 if p == "down" else height + 0.3))
		_play(POSE_ANIM.get(p, "idle"))
		return
	body_root.position = Vector3.ZERO
	body_root.rotation = Vector3.ZERO
	legs.scale.y = 1.0
	legs.position.y = 0.425 * s
	if p == "sit":
		body_root.position.y = -0.42 * s
		legs.scale.y = 0.55
		legs.position.y = 0.62 * s
	elif p == "kneel":
		body_root.position.y = -0.38 * s
		legs.scale.y = 0.6
		legs.position.y = 0.6 * s
	elif p == "down":
		body_root.rotation.x = -PI * 0.5
		body_root.position = Vector3(0, 0.22, 0.6 * s)
	label.position.y = (1.35 if p == "sit" or p == "kneel" else (0.9 if p == "down" else 2.0)) * s


func say(text: String, dur: float = 4.0) -> void:
	label.text = text
	label.visible = true
	say_t = dur
	if anim != null and not moving and pose == "idle" and anim.has_animation("agree") and not anim_far:
		cur_anim = ""
		_play("agree")


func xz() -> Vector2:
	return Vector2(global_position.x, global_position.z)


## Verilen yere koyar (yükseklik araziden)
func put(x: float, z: float, yaw := 0.0) -> void:
	global_position = Vector3(x, city.ground(x, z) if city else 0.0, z)
	global_rotation.y = yaw
	route.clear()
	arrive_cb = Callable()


func face(p: Vector2) -> void:
	global_rotation.y = atan2(p.x - global_position.x, p.y - global_position.z)


func _process(dt: float) -> void:
	_rifle_update()
	if say_t > 0.0:
		say_t -= dt
		if say_t <= 0.0:
			label.visible = false
	if hide_t > 0.0:
		hide_t -= dt
	if external or hidden or route.is_empty() or say_t > 0.0:
		if model != null and moving and not external:
			moving = false
			anim.speed_scale = 1.0
			_play(POSE_ANIM.get(pose, "idle"))
		return
	if wait > 0.0:
		wait -= dt
		if model != null and moving:
			moving = false
			anim.speed_scale = 1.0
			_play(POSE_ANIM.get(pose, "idle"))
		return
	if model != null and walk_ref < 0.0 and is_inside_tree():
		_measure_walk()
	if model != null and not moving:
		moving = true
		_play("run" if speed > 2.2 else "walk")
		var ref := run_ref if speed > 2.2 else walk_ref
		anim.speed_scale = clampf(speed / ref, 0.6, 1.8) if ref > 0.05 else 1.0
	var target: Vector3 = route[0]
	var d := target - global_position
	d.y = 0
	var l := d.length()
	if l < 0.4:
		route.pop_front()
		if route.is_empty() and arrive_cb.is_valid():
			var cb := arrive_cb
			arrive_cb = Callable()
			cb.call()
		return
	var p := global_position + d / l * speed * dt
	if city:
		p.y = city.ground(p.x, p.z)
	global_position = p
	global_rotation.y = lerp_angle(global_rotation.y, atan2(d.x, d.z), minf(1.0, dt * 6.0))
	phase += dt * 7.0
	if pose == "idle" and model == null:
		body_root.position.y = absf(sin(phase)) * 0.025
