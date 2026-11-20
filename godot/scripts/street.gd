extends Node3D
## Kahraman sokak (100 m): elle tasarlanmış çarşı sokağı — dükkânlar, tenteler, cumbalı evler, kabaltı, çeşme, avlu kapısı.
## Geometri ve kendine özgü cephe dokuları web sürümündeki ayrıntılı sokaktan aktarılmıştır (tools/import_hero.gd -> res://hero).
## Bu düğüm sokağın YEREL eksenini taşır: z = 0 çarşı ucu, z = -100 kale ucu, x = sokağın eni. Görev betiği bu ekseni kullanır.
## Sokak arazinin eğimini izler (çarşı ucu kale ucundan yaklaşık 0,6 m yüksektir).

var mats := {}
var city: City
var player: CharacterBody3D
var solids: StaticBody3D
var hero: MeshInstance3D
var ground_mats: Array = []      # döşeme yüzeylerinin malzemeleri (kar için)
var rng := RandomNumberGenerator.new()


# ---------------------------------------------------------------- sokak ekseni (web sürümüyle aynı)
func cx(z: float) -> float:
	return 1.6 * sin(-clampf(z, -100.0, 0.0) * 0.05)


func wid(z: float) -> float:
	if z > -26.0:
		return 6.2
	if z > -40.0:
		return lerpf(6.2, 3.6, clampf((-26.0 - z) / 14.0, 0, 1))
	if z > -56.0:
		return 3.6
	if z > -68.0:
		return lerpf(3.6, 5.0, clampf((-56.0 - z) / 12.0, 0, 1))
	return 5.0


func xl(z: float) -> float:
	return cx(z) - wid(z) * 0.5


func xr(z: float) -> float:
	return cx(z) + wid(z) * 0.5


## Yerel (x, z) noktasında arazinin, sokağın başlangıç kotuna göre yüksekliği (sahne eşyalarını yere oturtmak için)
func drop(x: float, z: float) -> float:
	var g := to_global(Vector3(x, 0, z))
	return city.ground(g.x, g.z) - global_position.y


# ---------------------------------------------------------------- kurulum
func _ready() -> void:
	rng.seed = 19181921
	_materials()
	solids = StaticBody3D.new()
	add_child(solids)
	var man: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://hero/hero.json"))
	hero = MeshInstance3D.new()
	hero.mesh = load("res://hero/hero.res")
	hero.top_level = true      # ağ dünya koordinatlarında pişirilmiştir
	add_child(hero)
	hero.global_transform = Transform3D.IDENTITY
	# DÜŞÜK kalitede kabartma dokuları kapatılır: üç yönden kaplanan yüzeylerde örnekleme yarıya iner
	if city.lite:
		for i in hero.mesh.get_surface_count():
			var sm := hero.mesh.surface_get_material(i) as StandardMaterial3D
			if sm != null and sm.uv1_triplanar:
				sm.normal_enabled = false
	for i in man.get("ground", []):
		ground_mats.append(hero.mesh.surface_get_material(int(i)))
	# çarpışma: yapı ayak izleri ve sütunlar şehrin 2B çarpışmasına eklenir
	for p in man["polys"]:
		var pts := PackedVector2Array()
		for q in p:
			pts.append(Vector2(q[0], q[1]))
		city.add_poly(pts)
	for c in man["circles"]:
		city.add_circle(c[0], c[1], c[2])
	# avlu ve bahçe ağaçları
	for pr in man["props"]:
		var key := "agac%d" % int(pr[6] if pr.size() > 6 else 1)
		if pr[0] == "agac" and city.protos.has(key):
			var t := MeshInstance3D.new()
			t.mesh = city.protos[key]
			t.top_level = true
			add_child(t)
			var s: float = pr[5]
			t.global_transform = Transform3D(Basis(Vector3.UP, pr[4]).scaled(Vector3(s, s, s)), Vector3(pr[1], city.ground(pr[1], pr[3]), pr[3]))
			city.add_circle(pr[1], pr[3], 0.4)


## Kar: döşeme taşları ağarır
func set_snow(on: bool) -> void:
	for m in ground_mats:
		m.albedo_color = Color(1.55, 1.6, 1.7) if on else Color.WHITE


func tex(name: String) -> Texture2D:
	var p := "res://textures/%s.png" % name
	return load(p) if ResourceLoader.exists(p) else null


func pbr(key: String, tint := Color.WHITE, two_sided := false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex(key + "_c")
	m.albedo_color = tint
	var n := tex(key + "_n")
	if n:
		m.normal_enabled = true
		m.normal_texture = n
	var r := tex(key + "_r")
	if r:
		m.roughness_texture = r
		m.roughness_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_GREEN
	m.roughness = 1.0
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if two_sided:
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


## Sahne eşyalarının (barikat, yığın, kapı kanadı…) malzemeleri
func _materials() -> void:
	mats.stone = pbr("stone", Color(0.94, 0.9, 0.82))
	mats.stone2 = pbr("stone2", Color(0.9, 0.86, 0.78))
	mats.basalt = pbr("basalt")
	mats.cobble = pbr("cobble")
	mats.planks = pbr("planks", Color(0.8, 0.72, 0.62))
	mats.wood = pbr("wood")
	mats.flat = pbr("flat")
	mats.sack = pbr("flat", Color(0.82, 0.74, 0.58))
