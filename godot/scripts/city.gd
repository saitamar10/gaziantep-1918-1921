class_name City
extends Node3D
## Şehrin tamamı: arazi, 10 bin parselin yapıları, anıtlar (kale, camiler, hanlar…), ağaçlar ve eşyalar.
## Geometri web sürümünün şehir üreticisinden pişirilmiştir (tools/bake_city.mjs -> tools/import_city.gd -> res://city).
## Taban ağları (kütle, dam) açılışta yüklenir; yakın detay (kapı, pencere, cumba…) oyuncuya yaklaştıkça arka planda yüklenir.
## Çarpışma web sürümündeki gibi 2B'dir: yapı ayak izleri (çokgen) + daireler (ağaç, çeşme), 16 m'lik ızgarada aranır.

const CELL := 16.0
## Koddan üretilen dokuların bir tekrarının metre karşılığı (ağların UV ölçeği buna göredir)
const NOMINAL := {"stone": 3.0, "stone2": 3.0, "basalt": 3.0, "cobble": 4.0, "dirt": 6.0, "planks": 1.0, "wood": 1.0, "tiles": 2.0, "flat": 3.0, "rubble": 3.0}

var data: Dictionary
var mats := {}
var hero_y := 0.0
# arazi
var nx := 0
var nz := 0
var step := 5.0
var min_x := 0.0
var min_z := 0.0
var hgt: PackedFloat32Array
var bridges: Array = []
# çarpışma
var polys: Array[PackedVector2Array] = []
var circles: PackedVector3Array = PackedVector3Array()   # x, z, r
var grid := {}             # Vector2i -> PackedInt32Array (>=0 çokgen, <0 daire: -(i+1))
var off := {}              # kapatılmış engeller (indeks -> true)
# akış
var chunks: Array = []     # {key, c: Vector2, path, node, loading}
var detail_dist := 150.0
var draw_dist := 800.0
var tick := 0.0
var surface := false      # yüzey derinliği gölgelendiricisi (profil: surface_detail)
var base_tint := {}       # kar için: malzemenin kendi rengi
var noise_tex: ImageTexture
var lite := false         # hafif kademe: kabartma (normal) dokuları kullanılmaz
var stats := {"detay": 0}
var protos := {}           # eşya ve ağaç kalıpları (agac1…3, kup, cuval…)


func setup(q: Dictionary) -> void:
	detail_dist = q.get("detail", 150.0)
	draw_dist = q.get("draw", 800.0)
	lite = not q.get("normal", true)
	surface = q.get("surface", false)
	var t0 := Time.get_ticks_msec()
	data = JSON.parse_string(FileAccess.get_file_as_string("res://city/city.json"))
	hero_y = data["hero"]["y"]
	_materials()
	_terrain()
	_collision()
	_meshes()
	_bind_ground()
	_plants()
	_rocks()
	_rural()
	_kit()
	_ev_ici()
	print("Şehir: %d parça, %d çarpışma çokgeni, %.1f sn" % [chunks.size(), polys.size(), (Time.get_ticks_msec() - t0) / 1000.0])


# ---------------------------------------------------------------- malzemeler
## Sınama: --doku-deneme verilirse res://dokular_deneme/<ad>.tres varsa o kullanılır (şehirde toplu değişiklik yapmadan karşılaştırma)
func _set_path(key: String) -> String:
	var d := "res://dokular_deneme/%s.tres" % key
	if "--doku-deneme" in OS.get_cmdline_user_args() and ResourceLoader.exists(d):
		return d
	return "res://dokular/%s.tres" % key


func tex(name: String) -> Texture2D:
	var p := "res://textures/%s.png" % name
	return load(p) if ResourceLoader.exists(p) else null


func _pbr(key: String, tint := Color.WHITE, vc := true, two_sided := false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.roughness = 1.0
	m.vertex_color_use_as_albedo = vc
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if two_sided:
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	# gerçek doku seti (res://dokular/<ad>.tres) doldurulmuşsa o kullanılır; boşsa koddan üretilen doku
	var sp := _set_path(key)
	var ts: TextureSet = load(sp) if ResourceLoader.exists(sp) else null
	if ts != null and ts.albedo != null:
		m.albedo_texture = ts.albedo
		m.albedo_color = tint * ts.tint
		if ts.normal != null and not lite:
			m.normal_enabled = true
			m.normal_texture = ts.normal
		if ts.roughness != null:
			m.roughness_texture = ts.roughness
		if ts.ambient_occlusion != null:
			m.ao_enabled = true
			m.ao_texture = ts.ambient_occlusion
		var k: float = NOMINAL.get(key, 1.0) / ts.tile_metres
		m.uv1_scale = Vector3(k, k, k)
		return m
	m.albedo_texture = tex(key + "_c")
	m.albedo_color = tint
	var n = null if lite else tex(key + "_n")
	if n:
		m.normal_enabled = true
		m.normal_texture = n
	var r := tex(key + "_r")
	if r:
		m.roughness_texture = r
		m.roughness_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_GREEN
	return m


## Dört kanalında dört ayrı gürültü taşıyan küçük doku (r: iri ton lekesi, g: sıcak/soğuk kayma, b: akıntı izi, a: toz)
func _noise() -> ImageTexture:
	if noise_tex != null:
		return noise_tex
	var layers := []
	for i in 4:
		var n := FastNoiseLite.new()
		n.seed = 11 + i * 7
		n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
		n.frequency = [0.012, 0.02, 0.05, 0.03][i]
		n.fractal_octaves = 4
		layers.append(n.get_seamless_image(256, 256))
	var img := Image.create(256, 256, false, Image.FORMAT_RGBA8)
	for y in 256:
		for x in 256:
			img.set_pixel(x, y, Color(layers[0].get_pixel(x, y).r, layers[1].get_pixel(x, y).r, layers[2].get_pixel(x, y).r, layers[3].get_pixel(x, y).r))
	img.generate_mipmaps()
	noise_tex = ImageTexture.create_from_image(img)
	return noise_tex


const SURFACE_SHADER := """shader_type spatial;
// AŞAMA 2 — yaşanmış taş yüzey: doku tekrarını kıran iri ton lekeleri, sıcak/soğuk renk kayması, saçak altından inen nem ve
// kir izleri, yatay yüzeylerde birikmiş toz, pürüz farkı. Değerler res://grafik/yuzey.tres dosyasından gelir.
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D normal_tex : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform vec3 tint = vec3(1.0);
uniform float uv_scale = 1.0;
uniform float use_normal = 1.0;
uniform float macro_strength = 0.22;
uniform float macro_size = 22.0;
uniform float warm_shift = 0.5;
uniform float streak_strength = 0.4;
uniform vec3 stain_color : source_color = vec3(0.55, 0.5, 0.44);
uniform float dust_strength = 0.3;
uniform vec3 dust_color : source_color = vec3(0.6, 0.52, 0.4);
// zemin yüksekliği dokusu: duvarın o noktasının yerden kaç metre yukarıda olduğunu verir
uniform sampler2D ground_tex : filter_linear, repeat_disable;
uniform vec4 ground_rect = vec4(0.0, 0.0, 1.0, 1.0);
uniform float base_dark = 0.0;
uniform vec3 base_color : source_color = vec3(0.5, 0.46, 0.42);
// deneme (--doku-deneme): dökülmüş kireç sıva — taşın üstünde yer yer sıva, kenarları kırık, dibe yakın daha çok dökülmüş
uniform float use_plaster = 0.0;
uniform sampler2D plaster_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D plaster_n : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform float plaster_scale = 0.66;
uniform float plaster_cover = 0.55;
uniform vec3 plaster_tint : source_color = vec3(0.86, 0.8, 0.7);
varying vec3 wpos;
varying vec3 wnrm;
void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnrm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
}
void fragment() {
	vec2 uv = UV * uv_scale;
	vec3 a = texture(albedo_tex, uv).rgb;
	// duvar boyunca dünya koordinatı: yüzeyin baktığı yöne dik yatay eksen
	float along = abs(wnrm.x) > abs(wnrm.z) ? wpos.z : wpos.x;
	vec4 n1 = texture(noise_tex, vec2(along, wpos.y) / macro_size);
	vec4 n2 = texture(noise_tex, vec2(along * 0.33, wpos.y * 0.035));
	a *= mix(1.0 - macro_strength, 1.0 + macro_strength * 0.6, n1.r);
	a = mix(a, a * vec3(1.07, 1.0, 0.88), n1.g * warm_shift);
	float wall = 1.0 - smoothstep(0.35, 0.6, abs(wnrm.y));
	float streak = smoothstep(0.52, 0.8, n2.b) * wall;
	a = mix(a, a * stain_color, streak * streak_strength);
	// dip kararması: yerden ~1,8 m'ye kadar, düzensiz bir üst sınırla
	float rel = wpos.y - texture(ground_tex, (wpos.xz - ground_rect.xy) / ground_rect.zw).r;
	float bd = (1.0 - smoothstep(0.15, 1.9, rel + (n1.g - 0.5) * 1.1)) * wall * step(-4.0, rel) * base_dark;
	a = mix(a, a * base_color, bd);
	float up = smoothstep(0.6, 0.95, wnrm.y);
	a = mix(a, dust_color, up * dust_strength * n1.a);
	vec3 alb = a * tint * COLOR.rgb;
	float rough = mix(0.8, 1.0, n1.r) - streak * 0.12 - bd * 0.1;
	vec3 nm = mix(vec3(0.5, 0.5, 1.0), texture(normal_tex, uv).rgb, use_normal);
	if (use_plaster > 0.5 && wall > 0.5) {
		vec2 pu = vec2(along, wpos.y) * plaster_scale;
		// dökülme maskesi: iri leke + kırık kenar gürültüsü; dibe (nem) ve köşelere yakın daha çok dökülür
		float big = texture(noise_tex, vec2(along, wpos.y) / 6.5).r;
		float fine = texture(noise_tex, vec2(along, wpos.y) / 1.3).b;
		float lowp = 1.0 - smoothstep(0.3, 2.6, rel);
		float m = big * 0.8 + fine * 0.28 - lowp * 0.3 + (n2.r - 0.5) * 0.2;
		float cov = smoothstep(plaster_cover - 0.02, plaster_cover + 0.02, m);
		float edge = smoothstep(plaster_cover - 0.07, plaster_cover - 0.01, m) * (1.0 - cov);
		vec3 pc = texture(plaster_tex, pu).rgb * plaster_tint * mix(0.9, 1.06, n1.r);
		// sıvaya da dip kiri ve akıntı izi biner
		pc = mix(pc, pc * base_color, bd * 0.8);
		pc = mix(pc, pc * stain_color, streak * streak_strength * 1.2);
		alb = mix(alb, pc, cov);
		alb *= 1.0 - edge * 0.35;               // kırık kenarın gölgesi
		rough = mix(rough, 0.95, cov);
		nm = mix(nm, texture(plaster_n, pu).rgb, cov);
	}
	ALBEDO = alb;
	ROUGHNESS = rough;
	NORMAL_MAP = nm;
}"""


## Yaşanmış taş yüzey malzemesi (yüzey derinliği açıkken duvar, dam ve bazalt için). Set boşsa null döner.
func _surface_mat(key: String) -> ShaderMaterial:
	var sp := _set_path(key)
	var ts: TextureSet = load(sp) if ResourceLoader.exists(sp) else null
	if ts == null or ts.albedo == null:
		return null
	var look: SurfaceLook = load("res://grafik/yuzey.tres")
	var sh := Shader.new()
	sh.code = SURFACE_SHADER
	var m := ShaderMaterial.new()
	m.shader = sh
	m.set_shader_parameter("albedo_tex", ts.albedo)
	m.set_shader_parameter("normal_tex", ts.normal)
	m.set_shader_parameter("use_normal", 1.0 if (ts.normal != null and not lite) else 0.0)
	m.set_shader_parameter("noise_tex", _noise())
	m.set_shader_parameter("tint", Vector3(ts.tint.r, ts.tint.g, ts.tint.b))
	m.set_shader_parameter("uv_scale", NOMINAL.get(key, 1.0) / ts.tile_metres)
	m.set_shader_parameter("macro_strength", look.macro_strength)
	m.set_shader_parameter("macro_size", look.macro_size)
	m.set_shader_parameter("warm_shift", look.warm_shift)
	m.set_shader_parameter("streak_strength", look.streak_strength * (0.4 if key == "basalt" else 1.0))
	m.set_shader_parameter("stain_color", look.stain_color)
	m.set_shader_parameter("dust_strength", look.dust_strength)
	m.set_shader_parameter("dust_color", look.dust_color)
	base_tint[key] = ts.tint
	if "--doku-deneme" in OS.get_cmdline_user_args() and key in ["stone", "stone2"] and ResourceLoader.exists("res://dokular_deneme/siva_ph/albedo.jpg"):
		m.set_shader_parameter("use_plaster", 1.0)
		m.set_shader_parameter("plaster_tex", load("res://dokular_deneme/siva_ph/albedo.jpg"))
		m.set_shader_parameter("plaster_n", load("res://dokular_deneme/siva_ph/normal.jpg"))
		m.set_shader_parameter("plaster_cover", 0.5 if key == "stone" else 0.62)
	return m


## Sahne eşyaları için (barikat taşı, siper, kır evi) düz, köşe rengi kullanmayan taş malzemesi
func plain_stone(c: Color) -> StandardMaterial3D:
	var m := _pbr("stone2", Color.WHITE, false)
	m.albedo_color = c      # doku setinin renk çarpanı köşe renkli yapılar içindir; köşe rengi olmayan eşyada taşı maviye çekiyordu
	return m


## Gerçek doku setini dünya ekseninde üç yönden (triplanar) kaplayan malzeme: UV'si olmayan ya da UV'si başka bir dokuya göre
## kurulmuş yüzeyler için (tente, demir, çuval). Set boşsa null döner.
func _tri(key: String, tint: Color, metal := 0.0, two_sided := false) -> StandardMaterial3D:
	var sp := _set_path(key)
	var ts: TextureSet = load(sp) if ResourceLoader.exists(sp) else null
	if ts == null or ts.albedo == null:
		return null
	var m := StandardMaterial3D.new()
	m.albedo_texture = ts.albedo
	m.albedo_color = tint * ts.tint
	if ts.normal != null and not lite:
		m.normal_enabled = true
		m.normal_texture = ts.normal
	if ts.roughness != null:
		m.roughness_texture = ts.roughness
	m.roughness = 1.0
	m.metallic = metal
	m.uv1_triplanar = true
	m.uv1_world_triplanar = true
	var k := 1.0 / ts.tile_metres
	m.uv1_scale = Vector3(k, k, k)
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if two_sided:
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


func _flat(c: Color, rough := 0.9, metal := 0.0, two_sided := false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	m.metallic = metal
	if two_sided:
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


func _cutout(img: Image, vc: bool) -> StandardMaterial3D:
	img.generate_mipmaps()
	var m := StandardMaterial3D.new()
	m.albedo_texture = ImageTexture.create_from_image(img)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	m.alpha_scissor_threshold = 0.45
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.roughness = 0.88
	m.vertex_color_use_as_albedo = vc
	return m


## Yaprak dokusu: saydam zemin üstünde rastgele yaprak lekeleri
func _leaf_image() -> Image:
	var img := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	img.fill(Color(0.24, 0.33, 0.14, 0.0))
	var r := RandomNumberGenerator.new()
	r.seed = 77
	for i in 46:
		var cx := r.randf_range(10, 118)
		var cy := r.randf_range(10, 118)
		var a := r.randf() * PI
		var rl := r.randf_range(9, 16)
		var rw := rl * r.randf_range(0.32, 0.5)
		var col := Color(r.randf_range(0.2, 0.36), r.randf_range(0.34, 0.5), r.randf_range(0.1, 0.2), 1.0)
		for y in range(int(cy - rl), int(cy + rl) + 1):
			for x in range(int(cx - rl), int(cx + rl) + 1):
				if x < 0 or y < 0 or x > 127 or y > 127:
					continue
				var dx := (x - cx) * cos(a) + (y - cy) * sin(a)
				var dy := -(x - cx) * sin(a) + (y - cy) * cos(a)
				if (dx * dx) / (rl * rl) + (dy * dy) / (rw * rw) < 1.0:
					img.set_pixel(x, y, col.darkened(absf(dy) / rw * 0.25))
	return img


## Kafes (ahşap pencere kafesi) dokusu
func _lattice_image() -> Image:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:
			var on := (x + y) % 16 < 4 or (x - y + 64) % 16 < 4
			img.set_pixel(x, y, Color(0.36, 0.25, 0.16, 1.0 if on else 0.0))
	return img


func _materials() -> void:
	mats.stone = _pbr("stone")
	mats.stone2 = _pbr("stone2")
	mats.basalt = _pbr("basalt")
	mats.planks = _pbr("planks")
	mats.wood = _pbr("wood")
	mats.tiles = _pbr("tiles", Color.WHITE, true, true)
	mats.flat = _pbr("flat")
	mats.fabR = _pbr("fabr", Color.WHITE, false, true)
	mats.fabG = _flat(Color(0.3, 0.42, 0.3), 1.0, 0.0, true)
	mats.fabB = _flat(Color(0.62, 0.44, 0.26), 1.0, 0.0, true)
	mats.rubble = mats.stone2
	# gerçek doku setleri varsa: moloz bahçe duvarı, dokuma tente kumaşı (kök boya tonları), paslı demir, çuval bezi
	var sp_r := "res://dokular/rubble.tres"
	if ResourceLoader.exists(sp_r) and (load(sp_r) as TextureSet).albedo != null:
		mats.rubble = _pbr("rubble")
	for q in [["fabR", Color(1.15, 0.42, 0.34)], ["fabG", Color(0.62, 0.8, 0.6)], ["fabB", Color(1.2, 0.9, 0.58)]]:
		var fm := _tri("fabric", q[1], 0.0, true)
		if fm != null:
			mats[q[0]] = fm
	mats.dark = _flat(Color(0.085, 0.07, 0.055), 1.0)
	mats.glass = _flat(Color(0.1, 0.12, 0.15), 0.12)
	mats.iron = _flat(Color(0.15, 0.14, 0.12), 0.55, 0.7)
	var im := _tri("iron", Color(0.5, 0.46, 0.44), 0.55)
	if im != null:
		mats.iron = im
	mats.lead = _flat(Color(0.5, 0.52, 0.54), 0.5, 0.55)
	mats.copper = _flat(Color(0.7, 0.42, 0.23), 0.35, 0.9)
	mats.sack = _pbr("flat", Color(0.8, 0.73, 0.58), false)
	var sm := _tri("sack", Color(1.1, 1.05, 0.95))
	if sm != null:
		mats.sack = sm
	mats.spice = _flat(Color(0.72, 0.3, 0.16), 1.0)
	mats.pot = _pbr("dirt", Color(0.75, 0.43, 0.27), false)
	mats.bark = _pbr("wood", Color(0.54, 0.48, 0.41), false)
	mats.leaves = _cutout(_leaf_image(), true)
	mats.kafes = _cutout(_lattice_image(), false)
	# AŞAMA 2: yüzey derinliği açıksa taş yüzeyler yaşanmış yüzey gölgelendiricisine geçer
	var deneme := "--doku-deneme" in OS.get_cmdline_user_args()
	if surface or deneme:
		for key in ["stone", "stone2", "rubble", "basalt", "flat"]:
			var sm2 := _surface_mat(key)
			if sm2 != null:
				mats[key] = sm2
	var w := _flat(Color(0.2, 0.31, 0.32, 0.92), 0.06, 0.1)
	w.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mats.water = w
	var sh := Shader.new()
	sh.code = """shader_type spatial;
// Arazi: köşe renginde dört zemin ağırlığı taşınır (r kaldırım, g toprak, b ot, a tarla)
uniform sampler2D t_cob : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D t_cob_n : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D t_dirt : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform vec3 grass : source_color = vec3(0.36, 0.37, 0.2);
uniform vec3 field : source_color = vec3(0.52, 0.44, 0.27);
uniform float snow = 0.0;
uniform float s_cob = 4.0;
uniform float s_dirt = 6.0;
uniform vec3 tint_cob = vec3(1.0);
uniform vec3 tint_dirt = vec3(1.0);
uniform float gap_lo = 0.16;
uniform float gap_hi = 0.4;
uniform float gap_fill = 0.0;
uniform float ground_stain = 0.0;
uniform sampler2D t_grass : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D t_field : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform float use_grass = 0.0;
uniform float use_field = 0.0;
uniform float s_grass = 2.0;
uniform float s_field = 3.0;
// kayalık: dik yamaçlarda toprağın altından kaya çıkar (eğime ve iri lekelere göre)
uniform sampler2D t_rock : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D t_rock_n : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform float use_rock = 0.0;
uniform float s_rock = 3.0;
uniform float rock_lo = 0.07;
uniform float rock_hi = 0.2;
// deneme zemini (--doku-deneme): pürüz ve AO dokusu, tekrar kırma, değişken parlaklık. Kapalıyken eski davranış.
uniform float use_cob_extra = 0.0;
uniform sampler2D t_cob_r : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D t_cob_ao : filter_linear_mipmap_anisotropic, repeat_enable;
varying vec4 w;
varying float slope;
// sokak dokusu (deneme): r = sokak ortasına göre konum (0 orta, 1 kenar), g = sokak içinde mi
uniform sampler2D street_tex : filter_linear, repeat_disable;
uniform vec4 street_rect = vec4(0.0, 0.0, 1.0, 1.0);
uniform float use_street = 0.0;
varying vec3 wp;
void vertex() { w = COLOR; slope = 1.0 - normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz).y; wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec2 p = UV;
	float n1 = texture(t_dirt, p / 53.0).r;
	float n2 = texture(t_dirt, p / 17.0).g;
	vec3 dirt = texture(t_dirt, p / s_dirt).rgb * mix(0.85, 1.1, n1) * tint_dirt;
	vec2 cu = p / s_cob;
	// tekrar kırma: ikinci örnek döndürülüp kaydırılır, iri gürültüyle karışır (taş döşemede dikiş göze batmaz)
	vec2 cu2 = mat2(vec2(0.62, 0.78), vec2(-0.78, 0.62)) * cu + vec2(0.37, 0.71);
	float bm = smoothstep(0.4, 0.6, texture(t_dirt, p / 23.0).b) * use_cob_extra;
	vec3 cob = mix(texture(t_cob, cu).rgb, texture(t_cob, cu2).rgb, bm) * mix(0.9, 1.1, n1) * tint_cob;
	// deneme: uzaktan tekdüze görünmesin — iri koyu/kirli kesimler ve yer yer sıcak toprak lekesi
	float big = texture(t_dirt, p / 41.0).g;
	float big2 = texture(t_dirt, p / 97.0).r;
	cob *= mix(1.0, mix(0.74, 1.06, smoothstep(0.25, 0.75, big)) * mix(0.9, 1.04, big2), use_cob_extra);
	cob = mix(cob, cob * vec3(1.04, 0.96, 0.86), use_cob_extra * smoothstep(0.55, 0.8, big2) * 0.6);
	float cao = mix(1.0, mix(texture(t_cob_ao, cu).r, texture(t_cob_ao, cu2).r, bm), use_cob_extra);
	float crough = mix(texture(t_cob_r, cu).r, texture(t_cob_r, cu2).r, bm);
	// AŞAMA 2: taş aralarındaki koyu derzlere toprak dolar; yer yer iri kir lekeleri
	float gap = 1.0 - smoothstep(gap_lo, gap_hi, dot(cob, vec3(0.333)));
	cob = mix(cob, dirt * 0.85, gap * gap_fill);
	cob *= mix(1.0 - ground_stain, 1.0, smoothstep(0.3, 0.7, texture(t_dirt, p / 37.0).g));
	vec3 g = grass * mix(0.7, 1.25, n2) * mix(0.85, 1.1, texture(t_dirt, p / 3.0).r * 1.6);
	vec3 f = field * mix(0.8, 1.15, n1) * mix(0.9, 1.1, sin(p.x * 2.2 + p.y * 0.7) * 0.5 + 0.5);
	g = mix(g, texture(t_grass, p / s_grass).rgb * mix(0.8, 1.15, n2), use_grass);
	f = mix(f, texture(t_field, p / s_field).rgb * mix(0.85, 1.1, n1), use_field);
	vec4 k = w;
	k.x = smoothstep(0.25, 0.75, k.x + (n2 - 0.5) * 0.5);
	k.y += (1.0 - k.x) * w.x;
	k /= max(0.001, k.x + k.y + k.z + k.w);
	ALBEDO = cob * k.x + dirt * k.y + g * k.z + f * k.w;
	float rk = use_rock * smoothstep(rock_lo, rock_hi, slope + (n2 - 0.5) * 0.1) * (1.0 - k.x) * mix(0.35, 1.0, smoothstep(0.35, 0.6, n1));
	ALBEDO = mix(ALBEDO, texture(t_rock, p / s_rock).rgb * mix(0.8, 1.05, n2), rk);
	// kar: taş döşemede ezilmiş ve ince, toprakta kalın
	ALBEDO = mix(ALBEDO, vec3(0.86, 0.88, 0.92), snow * mix(0.92, 0.6, k.x) * mix(0.75, 1.0, n2));
	vec3 cn = mix(texture(t_cob_n, cu).rgb, texture(t_cob_n, cu2).rgb, bm);
	NORMAL_MAP = mix(mix(vec3(0.5, 0.5, 1.0), cn, k.x), texture(t_rock_n, p / s_rock).rgb, rk);
	// aşınmış taş üstleri daha parlak, toprak ve kirli kesimler mat; iri lekelerle değişir
	float r_old = mix(1.0, 0.9, k.x);
	float r_new = mix(1.0, clamp(crough * mix(0.85, 1.12, n2) + (1.0 - n1) * 0.06, 0.45, 1.0), k.x);
	ROUGHNESS = mix(r_old, r_new, use_cob_extra);
	AO = mix(1.0, cao, k.x);
	AO_LIGHT_AFFECT = 0.1 * use_cob_extra;
	if (use_street > 0.5) {
		vec2 sq = (wp.xz - street_rect.xy) / street_rect.zw;
		vec4 st = texture(street_tex, sq);
		float inside = st.g * step(0.0, sq.x) * step(sq.x, 1.0) * step(0.0, sq.y) * step(sq.y, 1.0);
		float dc = st.r * 4.0;          // orta çizgiye uzaklık (m)
		float dw = st.b * 4.0;          // duvara uzaklık (m)
		float rel = 1.0 - st.r;          // 0 = sokak ortası
		float ns = texture(t_dirt, wp.xz / 9.0).g;
		float nf = texture(t_dirt, wp.xz / 2.3).r;
		// duvar dibi: toz ve toprak birikintisi (taş üstüne de taşar), düzensiz sınır
		float edge = (1.0 - smoothstep(0.15, 0.85, dw + (ns - 0.5) * 0.6)) * step(0.001, st.g + 1.0);
		vec3 dust = mix(dirt, vec3(0.58, 0.48, 0.36), 0.5) * mix(0.85, 1.05, nf);
		ALBEDO = mix(ALBEDO, dust, edge * 0.85);
		ROUGHNESS = mix(ROUGHNESS, 1.0, edge);
		NORMAL_MAP = mix(NORMAL_MAP, vec3(0.5, 0.5, 1.0), edge * 0.7);
		// orta su yolu: hafif çukur, koyu ve nemli, kenarları taşla
		float ch = smoothstep(0.25, 0.6, st.r) * inside * smoothstep(1.0, 1.5, dw);     // duvarların tam ortası
		ALBEDO = mix(ALBEDO, ALBEDO * vec3(0.62, 0.58, 0.52), ch);
		ROUGHNESS = mix(ROUGHNESS, 0.42, ch * 0.8);
		// nem ve döküntü lekeleri: koyu, biraz parlak; ortaya yakın daha sık
		float wet = smoothstep(0.66, 0.78, texture(t_dirt, wp.xz / 13.0 + 0.31).b + (1.0 - rel) * 0.08) * inside * (1.0 - edge);
		ALBEDO = mix(ALBEDO, ALBEDO * vec3(0.66, 0.64, 0.62), wet);
		ROUGHNESS = mix(ROUGHNESS, 0.5, wet * 0.7);
		// iri ton farkı: sokak boyunca bazı kesimler daha tozlu/açık
		ALBEDO *= mix(0.92, 1.06, ns);
	}
}"""
	var tm := ShaderMaterial.new()
	tm.shader = sh
	tm.set_shader_parameter("t_cob", tex("cobble_c"))
	tm.set_shader_parameter("t_cob_n", tex("cobble_n"))
	tm.set_shader_parameter("t_dirt", tex("dirt_c"))
	# gerçek doku setleri doldurulmuşsa arazi de onları kullanır (res://dokular/cobble.tres, dirt.tres)
	for q in [["cobble", "t_cob", "s_cob", 1.0], ["dirt", "t_dirt", "s_dirt", 2.0]]:
		var sp := _set_path(q[0])
		var ts: TextureSet = load(sp) if ResourceLoader.exists(sp) else null
		if ts != null and ts.albedo != null:
			tm.set_shader_parameter(q[1], ts.albedo)
			tm.set_shader_parameter(q[2], ts.tile_metres * q[3])
			tm.set_shader_parameter("tint_cob" if q[0] == "cobble" else "tint_dirt", Vector3(ts.tint.r, ts.tint.g, ts.tint.b))
			if q[0] == "cobble" and ts.normal != null:
				tm.set_shader_parameter("t_cob_n", ts.normal)
			if q[0] == "cobble" and "--doku-deneme" in OS.get_cmdline_user_args() and ts.roughness != null and ts.ambient_occlusion != null:
				tm.set_shader_parameter("t_cob_r", ts.roughness)
				tm.set_shader_parameter("t_cob_ao", ts.ambient_occlusion)
				tm.set_shader_parameter("use_cob_extra", 1.0)
	if surface:
		var lk: SurfaceLook = load("res://grafik/yuzey.tres")
		tm.set_shader_parameter("gap_fill", lk.ground_gap_fill)
		tm.set_shader_parameter("ground_stain", lk.ground_stain)
	for q in [["grass", "t_grass", "use_grass", "s_grass"], ["field", "t_field", "use_field", "s_field"]]:
		var sp2 := _set_path(q[0])
		var ts2: TextureSet = load(sp2) if ResourceLoader.exists(sp2) else null
		if ts2 != null and ts2.albedo != null:
			tm.set_shader_parameter(q[1], ts2.albedo)
			tm.set_shader_parameter(q[2], 1.0)
			tm.set_shader_parameter(q[3], ts2.tile_metres * 1.5)
	var rsp := "res://dokular/rock.tres"
	var rts: TextureSet = load(rsp) if ResourceLoader.exists(rsp) else null
	if rts != null and rts.albedo != null:
		tm.set_shader_parameter("t_rock", rts.albedo)
		tm.set_shader_parameter("t_rock_n", rts.normal if rts.normal != null else tex("cobble_n"))
		tm.set_shader_parameter("use_rock", 1.0)
		tm.set_shader_parameter("s_rock", rts.tile_metres * 2.4)
	if "--doku-deneme" in OS.get_cmdline_user_args():
		_street_mask(tm)
	mats.terrain = tm


## Sınama: test sokağı çevresinde sokak dokusu (orta = 0, kenar = 1) — sokak çizgilerinden (segments) tarama
func _street_mask(tm: ShaderMaterial) -> void:
	var cx := TEST_XZ.x
	var cz := TEST_XZ.y
	var half := 90.0
	var res := 0.25
	var n := int(half * 2.0 / res)
	var img := Image.create(n, n, false, Image.FORMAT_RGB8)
	img.fill(Color(1.0, 0.0, 1.0))
	var x0 := cx - half
	var z0 := cz - half
	for sg in data["segments"]:
		var a := Vector2(sg[0], sg[1])
		var b := Vector2(sg[2], sg[3])
		var hw: float = float(sg[4]) * 0.5
		if a.distance_to(Vector2(cx, cz)) > half + 60.0 and b.distance_to(Vector2(cx, cz)) > half + 60.0:
			continue
		var mn := Vector2(minf(a.x, b.x), minf(a.y, b.y)) - Vector2(hw, hw)
		var mx := Vector2(maxf(a.x, b.x), maxf(a.y, b.y)) + Vector2(hw, hw)
		var i0 := clampi(int((mn.x - x0) / res), 0, n - 1)
		var i1 := clampi(int((mx.x - x0) / res), 0, n - 1)
		var j0 := clampi(int((mn.y - z0) / res), 0, n - 1)
		var j1 := clampi(int((mx.y - z0) / res), 0, n - 1)
		for j in range(j0, j1 + 1):
			for i in range(i0, i1 + 1):
				var p := Vector2(x0 + (i + 0.5) * res, z0 + (j + 0.5) * res)
				var q := Geometry2D.get_closest_point_to_segment(p, a, b)
				var dd := p.distance_to(q)
				if dd < hw + 3.0:
					var c := img.get_pixel(i, j)
					if dd / 4.0 < c.r:
						img.set_pixel(i, j, Color(minf(dd / 4.0, 1.0), 1.0, c.b))
	# duvar dibine uzaklık: yapıların taban izleri (çarpışma çokgenleri)
	for poly in data["polys"]:
		var P: Array = poly
		if P.is_empty() or Vector2(P[0][0], P[0][1]).distance_to(Vector2(cx, cz)) > half + 40.0:
			continue
		for k in P.size():
			var a2 := Vector2(P[k][0], P[k][1])
			var b2 := Vector2(P[(k + 1) % P.size()][0], P[(k + 1) % P.size()][1])
			var mn2 := Vector2(minf(a2.x, b2.x), minf(a2.y, b2.y)) - Vector2(4.0, 4.0)
			var mx2 := Vector2(maxf(a2.x, b2.x), maxf(a2.y, b2.y)) + Vector2(4.0, 4.0)
			for j in range(clampi(int((mn2.y - z0) / res), 0, n - 1), clampi(int((mx2.y - z0) / res), 0, n - 1) + 1):
				for i in range(clampi(int((mn2.x - x0) / res), 0, n - 1), clampi(int((mx2.x - x0) / res), 0, n - 1) + 1):
					var p2 := Vector2(x0 + (i + 0.5) * res, z0 + (j + 0.5) * res)
					var d2 := p2.distance_to(Geometry2D.get_closest_point_to_segment(p2, a2, b2)) / 4.0
					var c2 := img.get_pixel(i, j)
					if d2 < c2.b:
						img.set_pixel(i, j, Color(c2.r, c2.g, d2))
	# sokak ortası = duvar uzaklığının sırt çizgisi (iki yandaki duvara eşit uzak); R kanalına yazılır (1 = orta)
	var bw := PackedFloat32Array()
	bw.resize(n * n)
	for j in n:
		for i in n:
			bw[j * n + i] = img.get_pixel(i, j).b
	for j in range(2, n - 2):
		for i in range(2, n - 2):
			var c := img.get_pixel(i, j)
			if c.g < 0.5:
				continue
			var v := bw[j * n + i]
			var ridge := 0.0
			if v * 4.0 > 0.9 and v < 0.99:
				if (v >= bw[j * n + i - 2] and v >= bw[j * n + i + 2]) or (v >= bw[(j - 2) * n + i] and v >= bw[(j + 2) * n + i]):
					ridge = 1.0
			img.set_pixel(i, j, Color(ridge, c.g, c.b))
	tm.set_shader_parameter("street_tex", ImageTexture.create_from_image(img))
	tm.set_shader_parameter("street_rect", Vector4(x0, z0, half * 2.0, half * 2.0))
	tm.set_shader_parameter("use_street", 1.0)


## ---------------------------------------------------------------- girilebilir ev içi (sınama)
## Nazaretyan Evi taraması (Gaziantep; Azad Balabanian, CC BY 4.0 — docs/KATKIDA_BULUNANLAR.md), tools/nazaretyan_hazirla.py
## ile sadeleştirildi. Şehrin dışında ayrı bir yerde durur; test sokağındaki kapıdan E ile girilir (world.gd).
const IC_ORIGIN := Vector3(4200.0, 0.0, 4200.0)
## test sokağı merkezi (bake_city.mjs TEST_SOKAK ile aynı tutulmalı)
const TEST_XZ := Vector2(-700.4, 775.9)
var ic_rect := Rect2()
var ic_spawn := Vector3.ZERO
var ic_door := Vector3.ZERO        # sokaktaki giriş kapısının önü
var ic_door_yaw := 0.0


func _ev_ici() -> void:
	if not "--doku-deneme" in OS.get_cmdline_user_args() or not ResourceLoader.exists("res://modeller/nazaretyan/nazaretyan.gltf"):
		return
	var ps: PackedScene = load("res://modeller/nazaretyan/nazaretyan.gltf")
	var n: Node3D = ps.instantiate()
	n.name = "NazaretyanEvi"
	add_child(n)
	n.position = IC_ORIGIN
	# tarama ışığı fotoğrafın içinde: gölgelendirmesiz göster
	for mi in n.find_children("*", "MeshInstance3D", true, false):
		var msh: Mesh = (mi as MeshInstance3D).mesh
		for si in msh.get_surface_count():
			var sm = msh.surface_get_material(si)
			var nm: String = sm.resource_name if sm != null else ""
			var tp := "res://modeller/nazaretyan/doku/%s_baseColor.jpg" % nm
			var m2 := StandardMaterial3D.new()
			m2.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
			m2.cull_mode = BaseMaterial3D.CULL_DISABLED
			m2.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
			if ResourceLoader.exists(tp):
				m2.albedo_texture = load(tp)
			else:
				print("EV_ICI doku yok: ", nm, " ", tp)
			(mi as MeshInstance3D).set_surface_override_material(si, m2)
	var d: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://modeller/nazaretyan/duvar.json"))
	var o := Vector2(IC_ORIGIN.x, IC_ORIGIN.z)
	for w in d["walls"]:
		var a := Vector2(w[0], w[1]) + o
		var b := Vector2(w[2], w[3]) + o
		var t := (b - a).normalized()
		var nn := Vector2(-t.y, t.x) * 0.06
		add_poly(PackedVector2Array([a - nn - t * 0.03, b - nn + t * 0.03, b + nn + t * 0.03, a + nn - t * 0.03]))
	var bx: Array = d["box"]
	# AVLU (taramada yok; kendi kitimizle — TAHMİN): odalar batıya açılıyor, avlu batıda geniş
	var lo := Vector2(bx[0], bx[1]) + o - Vector2(10.0, 4.0)
	var hi := Vector2(bx[2], bx[3]) + o + Vector2(4.0, 4.0)
	ic_rect = Rect2(lo - Vector2(0.5, 0.5), hi - lo + Vector2(1.0, 1.0))
	_avlu(lo, hi, Vector2(bx[0], bx[1]) + o, Vector2(bx[2], bx[3]) + o)
	ic_spawn = IC_ORIGIN + Vector3(0.0, 0.0, 0.0)
	# giriş: test sokağına en yakın kemerli kapı
	var best := 1e9
	for e2 in data.get("kit", []):
		if e2[0] != "kapi_kemerli":
			continue
		var dd := Vector2(e2[1], e2[3]).distance_to(TEST_XZ)
		if dd < best:
			best = dd
			var yaw: float = e2[4]
			ic_door = Vector3(e2[1], e2[2], e2[3]) + Vector3(sin(yaw), 0.0, cos(yaw)) * 1.0
			ic_door_yaw = yaw
	print("EV_ICI hazir duvar=%d giris=%s" % [(d["walls"] as Array).size(), ic_door])


## Avlu: taş döşeme, çevre duvarları (kit cepheleriyle), havuz ve eşyalar. lo/hi avlu sınırı, hlo/hhi evin taban kutusu.
func _avlu(lo: Vector2, hi: Vector2, hlo: Vector2, hhi: Vector2) -> void:
	var y0 := IC_ORIGIN.y
	var root := Node3D.new()
	root.name = "Avlu"
	add_child(root)
	# avlu duvarı: moloz kalker + kireç harcı (deneme setinde "stone"); setin mavi çarpanı köşe rengi olmayan yüzeyde geri çevrilir
	var tas := _tri("stone", Color(0.9, 0.74, 0.5))
	if tas == null:
		tas = _tri("stone2", Color(0.92, 0.78, 0.52))
	var doseme := _tri("cobble", Color.WHITE)
	if doseme == null:
		doseme = tas
	var add_box := func(c: Vector3, size: Vector3, m: Material) -> void:
		var mi := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = size
		mi.mesh = bm
		mi.material_override = m
		mi.position = c
		root.add_child(mi)
	# döşeme
	add_box.call(Vector3((lo.x + hi.x) * 0.5, y0 - 0.1, (lo.y + hi.y) * 0.5), Vector3(hi.x - lo.x, 0.2, hi.y - lo.y), doseme)
	# çevre duvarları (6 m) + çarpışma
	var H := 6.0
	var T := 0.6
	var walls := [[Vector2(lo.x, lo.y), Vector2(hi.x, lo.y)], [Vector2(hi.x, lo.y), Vector2(hi.x, hi.y)], [Vector2(hi.x, hi.y), Vector2(lo.x, hi.y)], [Vector2(lo.x, hi.y), Vector2(lo.x, lo.y)]]
	for w in walls:
		var a: Vector2 = w[0]
		var b: Vector2 = w[1]
		var t := (b - a).normalized()
		var nrm := Vector2(-t.y, t.x)          # içe (avluya) bakan normal (saat yönü tersi sıra)
		var L := a.distance_to(b)
		var mid := (a + b) * 0.5 - nrm * (T * 0.5)
		var mi := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(L + T * 2.0, H, T)
		mi.mesh = bm
		mi.material_override = tas
		mi.position = Vector3(mid.x, y0 + H * 0.5, mid.y)
		mi.rotation.y = atan2(nrm.x, nrm.y)
		root.add_child(mi)
		var n2 := nrm * T
		add_poly(PackedVector2Array([a - t * T, b + t * T, b + t * T - n2, a - t * T - n2]))
		# duvar yüzüne kit parçaları (yüz = a..b çizgisi, dışarı = nrm)
		var yaw := atan2(nrm.x, nrm.y)
		var put := func(nm: String, along: float, y: float, sx := 1.0) -> void:
			var p := a + t * along + nrm * 0.02
			_kit_parca(root, nm, Vector3(p.x, y0 + y, p.y), yaw, sx)
		var k := 0
		var x := 2.2
		while x < L - 1.5:
			if k == 1 and L > 12.0:
				put.call("kapi_kemerli", x, 0.0)
			elif k == 3 and L > 14.0:
				put.call("cumba", x, 3.0)
			else:
				put.call("pencere_duz", x, 2.0)
				put.call("pencere_kemerli_kepenkli" if k % 2 == 0 else "pencere_kemerli", x, 3.6)
			k += 1
			x += 3.4
		put.call("kusak_1m", L * 0.5, 3.0, L)
		put.call("sacak_1m", L * 0.5, H - 0.05, L + 0.3)
	# havuz (batı avlusunun ortası): taş kenar + su, çarpışma
	var pc := Vector2((lo.x + hlo.x) * 0.5, (lo.y + hi.y) * 0.5)
	var pw := Vector2(minf(4.0, hlo.x - lo.x - 3.0), 3.0)
	if pw.x > 1.5:
		add_box.call(Vector3(pc.x, y0 + 0.25, pc.y - pw.y * 0.5), Vector3(pw.x + 0.5, 0.5, 0.25), tas)
		add_box.call(Vector3(pc.x, y0 + 0.25, pc.y + pw.y * 0.5), Vector3(pw.x + 0.5, 0.5, 0.25), tas)
		add_box.call(Vector3(pc.x - pw.x * 0.5, y0 + 0.25, pc.y), Vector3(0.25, 0.5, pw.y), tas)
		add_box.call(Vector3(pc.x + pw.x * 0.5, y0 + 0.25, pc.y), Vector3(0.25, 0.5, pw.y), tas)
		add_box.call(Vector3(pc.x, y0 + 0.38, pc.y), Vector3(pw.x - 0.1, 0.02, pw.y - 0.1), mats.water)
		var h2 := pw * 0.5 + Vector2(0.15, 0.15)
		add_poly(PackedVector2Array([pc - h2, pc + Vector2(h2.x, -h2.y), pc + h2, pc + Vector2(-h2.x, h2.y)]))
	# eşyalar: batı duvarı dibinde sedir ve kilim, köşelerde küp ve testi
	var props := [["sedir", Vector2(lo.x + 0.4, pc.y - 2.5), PI * 0.5], ["sedir", Vector2(lo.x + 0.4, pc.y + 2.5), PI * 0.5],
		["kilim_yer", Vector2(lo.x + 1.6, pc.y), PI * 0.5], ["kup_sehpa", Vector2(lo.x + 0.6, lo.y + 0.7), 0.3], ["testi", Vector2(lo.x + 1.3, lo.y + 0.6), 0.0],
		["kup", Vector2(lo.x + 0.6, hi.y - 0.7), 0.0], ["sandik", Vector2(hlo.x - 0.8, hi.y - 0.8), 0.5], ["sepet", Vector2(hlo.x - 1.6, lo.y + 0.7), 0.0],
		["iskemle", Vector2(pc.x - 2.6, pc.y + 1.0), 0.4], ["iskemle", Vector2(pc.x + 2.6, pc.y - 1.0), 2.0]]
	for pr in props:
		var q: Vector2 = pr[1]
		_kit_parca(root, pr[0], Vector3(q.x, y0, q.y), pr[2], 1.0)
		if pr[0] != "kilim_yer":
			add_circle(q.x, q.y, 0.8 if pr[0] == "sedir" else 0.35)


var _kit_mm := {}
var _kit_protos := {}


func _kit_mats() -> Dictionary:
	var mm := {
		"tas": _tri("stone2", Color(0.92, 0.78, 0.52)), "tas_koyu": _tri("basalt", Color.WHITE), "ahsap": _tri("wood", Color(0.3, 0.17, 0.085)),
		"tahta": _tri("planks", Color(0.36, 0.21, 0.11)), "kiremit": _tri("tiles", Color.WHITE), "kilim": mats.fabR,
		"demir": mats.iron, "karanlik": mats.dark, "kil": _tri("flat", Color(0.78, 0.42, 0.22)), "hasir": _tri("sack", Color(0.95, 0.8, 0.52)),
		"kirec": _tri("flat", Color(0.9, 0.78, 0.55))}
	for k in mm.keys():
		if mm[k] == null:
			mm[k] = _flat(Color(0.6, 0.55, 0.48), 0.95)
	return mm


## Açılır kapılar: her kemerli kapıda menteşe ekseninde dönen iki kanat. doors: [{pos, yaw, l, r, open}]
var doors: Array = []


func _kapi_kanatlari(parent: Node3D, pos: Vector3, yaw: float) -> void:
	var d := Node3D.new()
	parent.add_child(d)
	d.position = pos
	d.rotation.y = yaw
	var rec := {"pos": pos, "yaw": yaw, "open": false}
	for side in [-1, 1]:
		var nm := "kapi_kanat_sol" if side < 0 else "kapi_kanat_sag"
		if not _kit_protos.has(nm):
			var path := "res://modeller/cephe/%s.glb" % nm
			_kit_protos[nm] = load(path) if ResourceLoader.exists(path) else null
		var ps: PackedScene = _kit_protos[nm]
		if ps == null:
			return
		var pivot := Node3D.new()
		pivot.position = Vector3(0.6 * side, 0.0, 0.0)
		d.add_child(pivot)
		var leaf: Node3D = ps.instantiate()
		pivot.add_child(leaf)
		if _kit_mm.is_empty():
			_kit_mm = _kit_mats()
		for mi in leaf.find_children("*", "MeshInstance3D", true, false):
			var msh: Mesh = (mi as MeshInstance3D).mesh
			for si in msh.get_surface_count():
				var sm := msh.surface_get_material(si)
				var key := sm.resource_name if sm != null else ""
				if _kit_mm.has(key):
					(mi as MeshInstance3D).set_surface_override_material(si, _kit_mm[key])
		rec["l" if side < 0 else "r"] = pivot
	doors.append(rec)


## En yakın kapı (kapının önündeki noktaya göre), yoksa boş sözlük
func door_near(p: Vector3, r := 2.0) -> Dictionary:
	var best := {}
	var bd := r
	for dr in doors:
		var y: float = dr["yaw"]
		var front: Vector3 = dr["pos"] + Vector3(sin(y), 0.0, cos(y)) * 0.8
		var dd := Vector2(p.x, p.z).distance_to(Vector2(front.x, front.z))
		if dd < bd:
			bd = dd
			best = dr
	return best


## Kapıyı aç/kapat (kanatlar içeri döner)
func door_toggle(dr: Dictionary) -> void:
	dr["open"] = not dr["open"]
	var a := 1.7 if dr["open"] else 0.0
	var tw := create_tween().set_parallel(true).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tw.tween_property(dr["l"], "rotation:y", a, 0.9)
	tw.tween_property(dr["r"], "rotation:y", -a, 0.9)


## Tek kit parçası (malzemeleri _kit ile aynı eşlemeyle bağlanır)
func _kit_parca(parent: Node3D, nm: String, pos: Vector3, yaw: float, sx: float) -> void:
	if _kit_mm.is_empty():
		_kit_mm = _kit_mats()
	if nm == "kapi_kemerli":
		_kapi_kanatlari(parent, pos, yaw)
	if not _kit_protos.has(nm):
		var path := "res://modeller/cephe/%s.glb" % nm
		_kit_protos[nm] = load(path) if ResourceLoader.exists(path) else null
	var ps: PackedScene = _kit_protos[nm]
	if ps == null:
		return
	var n: Node3D = ps.instantiate()
	parent.add_child(n)
	n.position = pos
	n.rotation.y = yaw
	n.scale = Vector3(sx, 1.0, 1.0)
	for mi in n.find_children("*", "MeshInstance3D", true, false):
		var msh: Mesh = (mi as MeshInstance3D).mesh
		for si in msh.get_surface_count():
			var sm := msh.surface_get_material(si)
			var key := sm.resource_name if sm != null else ""
			if _kit_mm.has(key):
				(mi as MeshInstance3D).set_surface_override_material(si, _kit_mm[key])


## Test sokağı cephe kiti (modeller/cephe/*.glb, tools/cephe_kiti.py): pişirmede yerleşimi yazılan parçalar.
## GLB'lerde doku yoktur; malzeme adına göre oyunun malzemesi dünya ekseninde (triplanar) bağlanır.
func _kit() -> void:
	if not data.has("kit") or (data["kit"] as Array).is_empty():
		return
	var mm := _kit_mats()
	_kit_mm = mm
	# setlerin renk çarpanı evlerin köşe rengini dengelemek içindir (ahşapta 1.5/2/3); köşe rengi olmayan kitte geri çevrilir (_kit_mats)
	# toplu çizim: her parça türü tek MultiMesh (yüzlerce ayrı düğüm yerine birkaç çizim çağrısı)
	var groups := {}
	for e in data["kit"]:
		if not groups.has(e[0]):
			groups[e[0]] = []
		groups[e[0]].append(e)
	var root := Node3D.new()
	root.name = "CepheKiti"
	add_child(root)
	for nm in groups.keys():
		var path := "res://modeller/cephe/%s.glb" % nm
		if not ResourceLoader.exists(path):
			continue
		var proto: Node3D = (load(path) as PackedScene).instantiate()
		for mi in proto.find_children("*", "MeshInstance3D", true, false):
			var src: Mesh = (mi as MeshInstance3D).mesh
			var msh: Mesh = src.duplicate()
			for si in msh.get_surface_count():
				var sm := src.surface_get_material(si)
				var key := sm.resource_name if sm != null else ""
				if mm.has(key):
					msh.surface_set_material(si, mm[key])
			var local: Transform3D = proto.global_transform.affine_inverse() * (mi as Node3D).global_transform if proto.is_inside_tree() else (mi as Node3D).transform
			var list: Array = groups[nm]
			var mmesh := MultiMesh.new()
			mmesh.transform_format = MultiMesh.TRANSFORM_3D
			mmesh.mesh = msh
			mmesh.instance_count = list.size()
			for i in list.size():
				var e2: Array = list[i]
				var b3 := Basis(Vector3.UP, e2[4]) * Basis.from_scale(Vector3(e2[5], 1.0, 1.0))
				mmesh.set_instance_transform(i, Transform3D(b3, Vector3(e2[1], e2[2], e2[3])) * local)
			var mmi := MultiMeshInstance3D.new()
			mmi.name = nm
			mmi.multimesh = mmesh
			root.add_child(mmi)
		proto.free()
	for e3 in groups.get("kapi_kemerli", []):
		_kapi_kanatlari(root, Vector3(e3[1], e3[2], e3[3]), e3[4])


## Kar örtüsü (0..1): arazi beyazlar, damlar ve kiremitler ağarır
func set_snow(v: float) -> void:
	mats.terrain.set_shader_parameter("snow", v)
	for gn in greens:
		gn.visible = v < 0.3      # karlı aylarda asma yapraksız, ot yok
	for key in ["flat", "tiles"]:
		var m = mats[key]
		var k := Color.WHITE.lerp(Color(1.7, 1.75, 1.85) if key == "flat" else Color(1.5, 1.55, 1.65), v)
		if m is ShaderMaterial:
			var t: Color = base_tint.get(key, Color.WHITE) * k
			m.set_shader_parameter("tint", Vector3(t.r, t.g, t.b))
		else:
			if not base_tint.has(key + "#"):
				base_tint[key + "#"] = m.albedo_color
			m.albedo_color = base_tint[key + "#"] * k


func _apply(mesh: Mesh) -> void:
	for i in mesh.get_surface_count():
		var k: String = mesh.surface_get_name(i)
		if mats.has(k):
			mesh.surface_set_material(i, mats[k])


static func res_name(group: String, cell: String) -> String:
	return "res://city/%s_%s.res" % [group, cell.replace(",", "_").replace("-", "m")]


# ---------------------------------------------------------------- arazi
func _terrain() -> void:
	var t: Dictionary = data["terrain"]
	nx = int(t["nx"])
	nz = int(t["nz"])
	step = t["step"]
	min_x = t["minX"]
	min_z = t["minZ"]
	hgt = FileAccess.get_file_as_bytes("res://city/terrain.bin").to_float32_array()
	bridges = data.get("bridges", [])
	for i in int(t["tiles"]):
		var mi := MeshInstance3D.new()
		mi.mesh = load("res://city/terrain_%d.res" % i)
		mi.material_override = mats.terrain
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mi)
		# uzaktaki karo seyrek ağla çizilir (üçgen yükü 1/16)
		var fp := "res://city/terrain_%d_far.res" % i
		if ResourceLoader.exists(fp):
			mi.visibility_range_end = 380.0
			var fi := MeshInstance3D.new()
			fi.mesh = load(fp)
			fi.material_override = mats.terrain
			fi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			fi.visibility_range_begin = 380.0
			add_child(fi)
	# ufka kadar uzanan düzlük
	# Arazinin DIŞINDA dört parça: tek parça düzlük, arazinin -3 m'nin altına inen yerlerinde (kale hendeği, dere yatağı)
	# zeminin üstüne çıkıp düz bir şerit olarak görünüyordu.
	var x0: float = min_x
	var x1: float = min_x + (nx - 1) * step
	var z0: float = min_z
	var z1: float = min_z + (nz - 1) * step
	var far_mat := _flat(Color(0.5, 0.46, 0.3), 1.0)
	for q in [[x0 - 3000.0, (z0 + z1) * 0.5, 6000.0, 12000.0], [x1 + 3000.0, (z0 + z1) * 0.5, 6000.0, 12000.0],
			[(x0 + x1) * 0.5, z0 - 3000.0, x1 - x0, 6000.0], [(x0 + x1) * 0.5, z1 + 3000.0, x1 - x0, 6000.0]]:
		var far := MeshInstance3D.new()
		var pm := PlaneMesh.new()
		pm.size = Vector2(q[2], q[3])
		far.mesh = pm
		far.position = Vector3(q[0], -3.0, q[1])
		far.material_override = far_mat
		far.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(far)


## Zemin yüksekliği (köprü döşemeleri dahil)
func ground(x: float, z: float) -> float:
	if ic_rect.has_point(Vector2(x, z)):
		return IC_ORIGIN.y
	var fx := clampf((x - min_x) / step, 0.0, nx - 1.001)
	var fz := clampf((z - min_z) / step, 0.0, nz - 1.001)
	var i := int(fx)
	var j := int(fz)
	var u := fx - i
	var v := fz - j
	var a := hgt[j * nx + i]
	var b := hgt[j * nx + i + 1]
	var c := hgt[(j + 1) * nx + i]
	var d := hgt[(j + 1) * nx + i + 1]
	var h := lerpf(lerpf(a, b, u), lerpf(c, d, u), v)
	for br in bridges:
		var ang: float = -br["ang"]
		var dx: float = x - br["x"]
		var dz: float = z - br["z"]
		var bu := dx * cos(ang) + dz * sin(ang)
		var bv := -dx * sin(ang) + dz * cos(ang)
		if absf(bu) < br["len"] * 0.5 and absf(bv) < br["w"] * 0.5:
			h = maxf(h, br["y"])
	return h


# ---------------------------------------------------------------- çarpışma
func _insert(id: int, x0: float, z0: float, x1: float, z1: float) -> void:
	for cz in range(int(floor(z0 / CELL)), int(floor(z1 / CELL)) + 1):
		for cx in range(int(floor(x0 / CELL)), int(floor(x1 / CELL)) + 1):
			var k := Vector2i(cx, cz)
			if not grid.has(k):
				grid[k] = PackedInt32Array()
			grid[k].append(id)


func add_poly(pts: PackedVector2Array) -> int:
	var x0 := 1e9
	var z0 := 1e9
	var x1 := -1e9
	var z1 := -1e9
	for p in pts:
		x0 = minf(x0, p.x)
		z0 = minf(z0, p.y)
		x1 = maxf(x1, p.x)
		z1 = maxf(z1, p.y)
	polys.append(pts)
	_insert(polys.size() - 1, x0, z0, x1, z1)
	return polys.size() - 1


func add_circle(x: float, z: float, r: float) -> int:
	circles.append(Vector3(x, z, r))
	_insert(-circles.size(), x - r, z - r, x + r, z + r)
	return -circles.size()


func _collision() -> void:
	for p in data["polys"]:
		var pts := PackedVector2Array()
		for q in p:
			pts.append(Vector2(q[0], q[1]))
		add_poly(pts)
	for c in data["circles"]:
		add_circle(c[0], c[1], c[2])
	footprints = data["polys"]      # harita çizimi için saklanır (yapıların gerçek taban izleri)
	data.erase("polys")
	data.erase("circles")


func _near(x: float, z: float, r: float) -> Array:
	var out := []
	var seen := {}
	for cz in range(int(floor((z - r) / CELL)), int(floor((z + r) / CELL)) + 1):
		for cx in range(int(floor((x - r) / CELL)), int(floor((x + r) / CELL)) + 1):
			var arr = grid.get(Vector2i(cx, cz))
			if arr == null:
				continue
			for id in arr:
				if not seen.has(id) and not off.has(id):
					seen[id] = true
					out.append(id)
	return out


## Konumu engellerin dışına iter
func resolve(pos: Vector2, r: float) -> Vector2:
	for iter in 3:
		var moved := false
		for id in _near(pos.x, pos.y, r + 1.0):
			if id < 0:
				var c := circles[-id - 1]
				var d := pos - Vector2(c.x, c.y)
				var l := d.length()
				if l < c.z + r and l > 0.000001:
					pos = Vector2(c.x, c.y) + d / l * (c.z + r)
					moved = true
				continue
			var p := polys[id]
			var best := 1e9
			var bp := Vector2.ZERO
			for i in p.size():
				var q := Geometry2D.get_closest_point_to_segment(pos, p[i], p[(i + 1) % p.size()])
				var dd := pos.distance_to(q)
				if dd < best:
					best = dd
					bp = q
			if Geometry2D.is_point_in_polygon(pos, p):
				var o := bp - pos
				pos = bp + (o / best if best > 0.000001 else Vector2.RIGHT) * r
				moved = true
			elif best < r:
				var o2 := pos - bp
				pos = bp + (o2 / best if best > 0.000001 else Vector2.RIGHT) * r
				moved = true
		if not moved:
			break
	return pos


func blocked(x: float, z: float, r := 0.1) -> bool:
	var pos := Vector2(x, z)
	for id in _near(x, z, r + 1.0):
		if id < 0:
			var c := circles[-id - 1]
			if pos.distance_to(Vector2(c.x, c.y)) < c.z + r:
				return true
		elif Geometry2D.is_point_in_polygon(pos, polys[id]):
			return true
	return false


## İki nokta arasındaki görüşü bir yapı kesiyor mu (daireler kesmez)
func los_blocked(a: Vector2, b: Vector2) -> bool:
	var n := maxi(1, int(ceil(a.distance_to(b) / 0.7)))
	for i in range(1, n):
		var p := a.lerp(b, float(i) / n)
		for id in _near(p.x, p.y, 0.0):
			if id >= 0 and Geometry2D.is_point_in_polygon(p, polys[id]):
				return true
	return false


# ---------------------------------------------------------------- ağlar
func _inst(path: String, range_end: float, shadows: bool) -> MeshInstance3D:
	var mesh: Mesh = load(path)
	_apply(mesh)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.visibility_range_end = range_end
	if not shadows:
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	return mi


func _meshes() -> void:
	var c: float = data["config"]["chunk"]
	for key in data["cells"]:
		var groups: Array = data["cells"][key]
		if not key.contains(","):
			if "water" in groups:
				_inst(res_name("water", key), 0.0, false)
			continue
		var xy: PackedStringArray = key.split(",")
		var centre := Vector2((float(xy[0]) + 0.5) * c, (float(xy[1]) + 0.5) * c)
		if "base" in groups:
			_inst(res_name("base", key), draw_dist + 80.0, true)
		for t in range(1, 4):
			if ("sag%d" % t) in groups:
				ruin_nodes.append([t, _inst(res_name("sag%d" % t, key), draw_dist + 80.0, true), true])
			if ("sad%d" % t) in groups:      # yıkılabilir evin ince ayrıntısı: yalnız yakından çizilir
				ruin_nodes.append([t, _inst(res_name("sad%d" % t, key), detail_dist + 40.0, false), true])
			if ("yik%d" % t) in groups:
				var yn := _inst(res_name("yik%d" % t, key), draw_dist + 80.0, true)
				yn.visible = false
				if OS.get_cmdline_user_args().has("--yiklog"):
					var bb: AABB = yn.mesh.get_aabb()
					print("YIKIK kademe=%d merkez=%.1f,%.1f boyut=%.0fx%.0f" % [t, bb.get_center().x, bb.get_center().z, bb.size.x, bb.size.z])
				ruin_nodes.append([t, yn, false])
		if "kab" in groups:      # kabaltılar: yapılarla aynı mesafeden
			_inst(res_name("kab", key), draw_dist + 80.0, true)
		if "lm" in groups:
			_inst(res_name("lm", key), maxf(draw_dist, 1400.0), true)   # anıtlar uzaktan da görünsün
		if "detail" in groups:
			chunks.append({"key": key, "c": centre, "path": res_name("detail", key), "node": null, "loading": false})


## Yakın detayın akışı: yaklaşılan hücreler arka planda yüklenir, uzaklaşılanlar bellekten atılır.
func stream(px: float, pz: float, dt: float) -> void:
	tick -= dt
	if tick > 0.0:
		return
	tick = 0.25
	var pos := Vector2(px, pz)
	var added := false
	for ch in chunks:
		var d: float = pos.distance_to(ch["c"])
		if ch["node"] == null and not ch["loading"] and d < detail_dist + 70.0:
			ResourceLoader.load_threaded_request(ch["path"])
			ch["loading"] = true
		elif ch["loading"] and not added:
			if ResourceLoader.load_threaded_get_status(ch["path"]) == ResourceLoader.THREAD_LOAD_LOADED:
				var mesh: Mesh = ResourceLoader.load_threaded_get(ch["path"])
				_apply(mesh)
				var mi := MeshInstance3D.new()
				mi.mesh = mesh
				mi.visibility_range_end = detail_dist + 60.0
				mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
				add_child(mi)
				ch["node"] = mi
				ch["loading"] = false
				stats.detay += 1
				added = true   # kare başına en çok bir hücre: takılma olmasın
		elif ch["node"] != null and d > detail_dist * 1.6 + 120.0:
			ch["node"].queue_free()
			ch["node"] = null
			stats.detay -= 1


## Verilen noktanın çevresindeki detayı bekleyerek yükler (açılış ve ışınlanma için)
func warm(px: float, pz: float) -> void:
	var pos := Vector2(px, pz)
	for ch in chunks:
		if ch["node"] == null and pos.distance_to(ch["c"]) < detail_dist:
			# arka planda yüklenmekte olan dosya ikinci kez açılmaz: o yüklemenin bitmesi beklenir
			if ch["loading"]:
				ResourceLoader.load_threaded_get(ch["path"])
			var mi := _inst(ch["path"], detail_dist + 60.0, false)
			ch["node"] = mi
			ch["loading"] = false
			stats.detay += 1


# ---------------------------------------------------------------- ağaçlar ve eşyalar
func _multi(mesh: Mesh, xf: Array, r0: float, r1: float, shadows: bool) -> void:
	if xf.is_empty():
		return
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = xf.size()
	for i in xf.size():
		mm.set_instance_transform(i, xf[i])
	var mi := MultiMeshInstance3D.new()
	mi.multimesh = mm
	mi.visibility_range_begin = r0
	mi.visibility_range_end = r1
	if not shadows:
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


## Yaşanmış yüzey malzemelerine zemin yüksekliği dokusunu bağlar (duvar diplerinin kararması için). Yalnız yüzey derinliği açıkken.
func _bind_ground() -> void:
	if (not surface and not "--doku-deneme" in OS.get_cmdline_user_args()) or hgt.is_empty():
		return
	var img := Image.create_from_data(nx, nz, false, Image.FORMAT_RF, hgt.to_byte_array())
	var tex := ImageTexture.create_from_image(img)
	var rect := Vector4(min_x - 0.5 * step, min_z - 0.5 * step, nx * step, nz * step)
	for key in ["stone", "stone2", "rubble", "basalt"]:
		var m = mats.get(key)
		if m is ShaderMaterial:
			m.set_shader_parameter("ground_tex", tex)
			m.set_shader_parameter("ground_rect", rect)
			m.set_shader_parameter("base_dark", 0.3 if key == "basalt" else 0.62)


var _green_cache := {}


## Yaprak öbeği dokusu (koddan çizilir, indirme yok): saydam zeminde dokuz dilimli asma yaprağı — kenarı koyu, damarları açık.
func _leaf_texture() -> ImageTexture:
	var n := 256
	var img := Image.create(n, n, true, Image.FORMAT_RGBA8)
	img.fill(Color(0.16, 0.3, 0.1, 0.0))
	var rng := RandomNumberGenerator.new()
	rng.seed = 31
	var spots := [[0.5, 0.5, 0.2], [0.24, 0.27, 0.17], [0.76, 0.25, 0.16], [0.22, 0.74, 0.16], [0.78, 0.76, 0.17], [0.5, 0.16, 0.12], [0.5, 0.86, 0.12], [0.13, 0.5, 0.11], [0.88, 0.5, 0.11]]
	for sp in spots:
		var cx: float = sp[0] * n
		var cy: float = sp[1] * n
		var r: float = sp[2] * n
		var rot := rng.randf() * TAU
		var base := Color(0.13, 0.27, 0.08).lerp(Color(0.27, 0.42, 0.13), rng.randf())
		for y in range(int(cy - r), int(cy + r) + 1):
			for x in range(int(cx - r), int(cx + r) + 1):
				if x < 0 or y < 0 or x >= n or y >= n:
					continue
				var d := Vector2(x - cx, y - cy)
				var th := d.angle() - rot
				var lobe := absf(cos(th * 2.5))
				var rr := r * (0.5 + 0.5 * pow(lobe, 0.6))
				var dl := d.length()
				if dl > rr:
					continue
				var edge := dl / rr
				var vein := smoothstep(0.93, 1.0, lobe) * (1.0 - edge * 0.5)      # dilim ekseni boyunca damar
				var col := base.lerp(base * 0.55, edge * edge)                     # kenara doğru koyulaşır
				col = col.lerp(Color(0.46, 0.56, 0.26), vein * 0.75)
				col.a = 1.0
				img.set_pixel(x, y, col)
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


## Asma (duvar üstünden sokağa sarkan yaprak öbeği) ve ot (duvar dibinde tutam) kalıpları. Yerel +z duvarın dışına bakar;
## asmanın kökü duvarın üst kenarındadır, ot zemindedir. Yapraklar köşe rengiyle boyanır (doku yok), iki yüzlüdür.
func _green(kind: String) -> Mesh:
	if _green_cache.has(kind):
		return _green_cache[kind]
	var rng := RandomNumberGenerator.new()
	rng.seed = 7 if kind == "asma" else 9
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	if kind == "asma":
		# Sarkan dallar boyunca yaprak KARTLARI: her kart, saydam zeminli bir yaprak öbeği dokusu taşır (bkz. _leaf_texture).
		# Köşe renginin alfası rüzgâr ağırlığıdır: duvara tutunan üst kısım sabit, sarkan uçlar salınır.
		for strand in 12:
			var sx := rng.randf_range(-0.95, 0.95)
			var drop := rng.randf_range(1.3, 3.6)
			var sway := rng.randf_range(-0.3, 0.3)
			var s0 := Vector3(sx, 0.2, 0.05)
			var s1 := Vector3(sx + sway, 0.2 - drop, 0.12)
			var n := maxi(3, int(drop / 0.24))
			for i in n:
				var t := float(i) / n
				var cen := Vector3(sx + sway * t + rng.randf_range(-0.1, 0.1), 0.2 - drop * t, 0.08 + 0.12 * sin(t * PI) + rng.randf_range(0.0, 0.06))
				var sz := rng.randf_range(0.2, 0.34) * (1.0 - 0.25 * t)
				var ang := rng.randf() * TAU
				var tilt := rng.randf_range(-0.5, 0.5)
				var u := Vector3(cos(ang), sin(ang), 0.0) * sz
				var w := Vector3(-sin(ang), cos(ang), 0.0) * sz
				u.z = tilt * sz * 0.6
				w.z = -tilt * sz * 0.4
				var k := rng.randf_range(0.72, 1.08)
				var col := Color(k * rng.randf_range(0.85, 1.0), k, k * rng.randf_range(0.8, 0.95), 0.25 + 0.75 * t)
				var uvs := [Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 0), Vector2(1, 1), Vector2(0, 1)]
				var vs := [cen - u - w, cen + u - w, cen + u + w, cen - u - w, cen + u + w, cen - u + w]
				for j in 6:
					st.set_color(col)
					st.set_normal(Vector3(0, 0.3, 1).normalized())
					st.set_uv(uvs[j])
					st.add_vertex(vs[j])
		# duvarın üstüne yayılan öbek: yatık kartlar
		for i in 16:
			var cen2 := Vector3(rng.randf_range(-1.0, 1.0), rng.randf_range(0.08, 0.34), rng.randf_range(-0.28, 0.14))
			var sz2 := rng.randf_range(0.24, 0.36)
			var a2 := rng.randf() * TAU
			var u2 := Vector3(cos(a2), rng.randf_range(0.0, 0.5), sin(a2)).normalized() * sz2
			var w2 := Vector3(-sin(a2), rng.randf_range(0.2, 0.7), cos(a2)).normalized() * sz2
			var k2 := rng.randf_range(0.75, 1.1)
			var col2 := Color(k2, k2, k2 * 0.9, 0.12)
			var uvs2 := [Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 0), Vector2(1, 1), Vector2(0, 1)]
			var vs2 := [cen2 - u2 - w2, cen2 + u2 - w2, cen2 + u2 + w2, cen2 - u2 - w2, cen2 + u2 + w2, cen2 - u2 + w2]
			for j in 6:
				st.set_color(col2)
				st.set_normal(Vector3.UP)
				st.set_uv(uvs2[j])
				st.add_vertex(vs2[j])
		var vmesh := st.commit()
		var sh := Shader.new()
		sh.code = """shader_type spatial;
render_mode cull_disabled;
// Asma yaprağı: saydam zeminli yaprak dokusu (kesme eşiğiyle; saydam çizim sırasına girmez), köşe rengiyle ton, hafif rüzgâr.
uniform sampler2D leaf : source_color, filter_linear_mipmap, repeat_disable;
void vertex() {
	vec3 w = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float s = sin(TIME * 1.3 + w.x * 0.7 + w.z * 0.9) * 0.035 + sin(TIME * 2.9 + w.y * 2.0) * 0.012;
	VERTEX.x += s * COLOR.a;
	VERTEX.z += s * 0.6 * COLOR.a;
}
void fragment() {
	vec4 t = texture(leaf, UV);
	ALBEDO = t.rgb * COLOR.rgb * 0.7;      // güneşte ağarmasın
	SPECULAR = 0.05;
	ALPHA = t.a;
	ALPHA_SCISSOR_THRESHOLD = 0.4;
	ROUGHNESS = 0.8;
}"""
		var vm := ShaderMaterial.new()
		vm.shader = sh
		vm.set_shader_parameter("leaf", _leaf_texture())
		vmesh.surface_set_material(0, vm)
		_green_cache[kind] = vmesh
		return vmesh
	else:
		# ot tutamı: ince, hafif dışa eğik yapraklar
		for i in 11:
			var a3 := rng.randf() * TAU
			var root := Vector3(cos(a3), 0, sin(a3)) * rng.randf_range(0.0, 0.1)
			var h := rng.randf_range(0.18, 0.5)
			var lean := Vector3(cos(a3), 0, sin(a3)) * h * rng.randf_range(0.2, 0.6)
			var side := Vector3(-sin(a3), 0, cos(a3)) * 0.022
			var col3 := Color(0.33, 0.42, 0.17).lerp(Color(0.52, 0.5, 0.24), rng.randf())
			for v in [root - side, root + side, root + lean + Vector3(0, h, 0)]:
				st.set_color(col3)
				st.set_normal(Vector3.UP)
				st.add_vertex(v)
	var mesh := st.commit()
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo = true
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.roughness = 0.9
	mesh.surface_set_material(0, m)
	_green_cache[kind] = mesh
	return mesh


## Kaya biçimi: küre ağı gürültüyle ezilip kırılır (üç ayrı kalıp); doku üç yönden kaplanır
func _boulder(v: int, mat: Material) -> Mesh:
	var sm := SphereMesh.new()
	sm.radius = 1.0
	sm.height = 2.0
	sm.radial_segments = 12
	sm.rings = 7
	var arr := sm.get_mesh_arrays()
	var vs: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	var n := FastNoiseLite.new()
	n.seed = 11 + v * 7
	n.frequency = 0.8
	for i in vs.size():
		var p: Vector3 = vs[i]
		p *= 1.0 + 0.4 * n.get_noise_3dv(p) + 0.16 * n.get_noise_3dv(p * 3.1)
		p.y = maxf(p.y, -0.4)                                   # tabanı düz: toprağa oturur
		p.x = clampf(p.x, -0.8 + 0.1 * v, 0.9)                  # bir yüzü kırık
		if v == 2:
			p.y = minf(p.y, 0.55)                                # yassı seki kayası
		vs[i] = p
	arr[Mesh.ARRAY_VERTEX] = vs
	var am := ArrayMesh.new()
	am.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	var st := SurfaceTool.new()
	st.create_from(am, 0)
	st.generate_normals()
	var out := st.commit()
	out.surface_set_material(0, mat)
	return out


## Kale höyüğünün yamacındaki kayalar (yerleri temsilîdir). Rampanın üstüne ve yakınına konmaz.
func _rocks() -> void:
	var c: Dictionary = data.get("castle", {})
	if c.is_empty() or not ResourceLoader.exists("res://dokular/rock.tres"):
		return
	var mat := _tri("rock", Color(0.92, 0.9, 0.84))
	var rng := RandomNumberGenerator.new()
	rng.seed = 1920
	var ramp: Array = c["ramp"]
	var rx: float = c["rx"]
	var rz: float = c["rz"]
	var top: float = c["topK"]
	var xf := [[], [], []]
	for i in 420:
		var a := rng.randf() * TAU
		var kk := lerpf(top + 0.03, 1.02, pow(rng.randf(), 0.75))
		var s := rng.randf_range(0.5, 2.1) * (2.2 if rng.randf() < 0.07 else 1.0)
		var tilt := Vector3(rng.randf_range(-0.4, 0.4), rng.randf() * TAU, rng.randf_range(-0.4, 0.4))
		var sq := Vector3(s, s * rng.randf_range(0.55, 0.95), s * rng.randf_range(0.7, 1.25))
		if sin(a * 5.0 + 1.3) + sin(a * 11.0) * 0.5 < -0.15 and rng.randf() < 0.75:
			continue                                              # kümeler arasında boş yamaç
		var p := Vector2(cos(a) * rx * kk, sin(a) * rz * kk)
		var near := false
		for q in ramp.size() - 1:
			var cp := Geometry2D.get_closest_point_to_segment(p, Vector2(ramp[q][0], ramp[q][1]), Vector2(ramp[q + 1][0], ramp[q + 1][1]))
			if cp.distance_to(p) < 6.5 + s:
				near = true
		if near:
			continue
		xf[i % 3].append(Transform3D(Basis.from_euler(tilt).scaled(sq), Vector3(p.x, ground(p.x, p.y) - 0.2 * s, p.y)))
	for v in 3:
		_multi(_boulder(v, mat), xf[v], 0.0, 450.0, true)
	stats["kaya"] = xf[0].size() + xf[1].size() + xf[2].size()


## AŞAMA 11 — tarihe bağlı hasar. Kuşatma boyunca şehir top ateşi altındaydı (genel olgu); TEK TEK İSABET YERLERİ BİLİNMİYOR.
## Buradaki izler temsilîdir: sokaklarda mermi çukurları ve duvar diplerinde yıkıntı yığınları, rastgele yerlerde.
## Anıtların (cami, han, kilise…) 45 m yakınına konmaz: belirli bir yapının vurulduğu izlenimi verilmesin.
## Çarpışma eklenmez (görevlerin ve yol ağının geçtiği yerler değişmez). level: 0 yok · 0.3 kuşatmanın başı · 0.6 · 1.0 son aylar
var damage_nodes: Array = []
## Yıkılabilir evler: [kademe, düğüm, sağlam_mı]. Kademe: 1 = kuşatmanın başı, 2 = ortası, 3 = son aylar
var ruin_nodes: Array = []
## Asma ve ot düğümleri: kar yağınca gizlenir (yaprak dökülmüş)
var greens: Array = []
var footprints: Array = []


## Dönüşümleri `cell` metrelik hücrelere ayırır ve her hücre için ayrı çoklu ağ kurar (görünürlük mesafesi hücre merkezinden
## ölçülsün diye). Kurulan düğümleri döndürür.
func _multi_cells(mesh: Mesh, xf: Array, r1: float, shadows: bool, cell := 160.0) -> Array:
	var buckets := {}
	for t in xf:
		var k := Vector2i(floori(t.origin.x / cell), floori(t.origin.z / cell))
		if not buckets.has(k):
			buckets[k] = []
		buckets[k].append(t)
	var out := []
	for k in buckets:
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = mesh
		var list: Array = buckets[k]
		mm.instance_count = list.size()
		for i in list.size():
			mm.set_instance_transform(i, list[i])
		var mi := MultiMeshInstance3D.new()
		mi.multimesh = mm
		mi.visibility_range_end = r1
		if not shadows:
			mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mi)
		out.append(mi)
	return out
var damage_level := -1.0


func set_damage(level: float) -> void:
	if is_equal_approx(level, damage_level):
		return
	damage_level = level
	# yıkık ev kabukları: kademesi gelen evin sağlam hâli gizlenir, yıkık hâli gösterilir
	var lim := [0.0, 0.3, 0.6, 1.0]
	for q in ruin_nodes:
		var hit: bool = level + 0.001 >= lim[q[0]]
		q[1].visible = hit != q[2]
	if damage_nodes.is_empty():
		if level <= 0.0:
			return
		_build_damage()
	print("HASAR duzey=%s iz=%s parca=%d ornek=%s" % [level, stats.get("hasar", 0), damage_nodes.size(), str(stats.get("hasar_ornek", ""))])
	for q in damage_nodes:
		q[1].visible = q[0] <= level + 0.001


func _damage_node(tier: float, mesh: Mesh, xf: Array, r1: float, shadows: bool) -> void:
	for mi in _multi_cells(mesh, xf, r1, shadows, 240.0):
		mi.visible = false
		damage_nodes.append([tier, mi])


func _build_damage() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 19200401
	var marks: Array = data.get("markers", [])
	var disc := CylinderMesh.new()
	disc.top_radius = 1.0
	disc.bottom_radius = 1.15
	disc.height = 0.05
	disc.radial_segments = 12
	disc.rings = 1
	disc.material = _flat(Color(0.13, 0.115, 0.1), 1.0)
	var rb := _boulder(1, _tri("rock", Color(0.8, 0.77, 0.7)))
	var tiers := [0.3, 0.6, 1.0]
	var n := 0
	for ti in 3:
		var craters := []
		var stones := []
		for sg in data["segments"]:
			var a := Vector2(sg[0], sg[1])
			var b := Vector2(sg[2], sg[3])
			var ln := a.distance_to(b)
			if ln < 14.0 or rng.randf() > 0.1:
				continue
			var dir := (b - a) / ln
			var nor := Vector2(-dir.y, dir.x)
			var p := a + dir * rng.randf_range(5.0, ln - 5.0)
			var near_mark := false
			for mk in marks:
				if Vector2(mk["x"], mk["z"]).distance_to(p) < 45.0:
					near_mark = true
			if near_mark:
				continue
			var w: float = sg[4]
			if rng.randf() < 0.55:
				continue      # (eski: sokak ortasında mermi çukuru — arşiv fotoğraflarında karşılığı yok, kaldırıldı)
			if false:
				# mermi çukuru: kararmış toprak + çevresine saçılmış taş
				var cp := p + nor * rng.randf_range(-0.3, 0.3) * w
				var cs := rng.randf_range(0.9, 1.8)
				if ti == 2 and craters.size() == 6:
					stats["hasar_ornek"] = [cp, dir]
				craters.append(Transform3D(Basis().scaled(Vector3(cs, 1.0, cs)), Vector3(cp.x, ground(cp.x, cp.y) + 0.01, cp.y)))
				for k in rng.randi_range(5, 9):
					var ang := rng.randf() * TAU
					var rp := cp + Vector2(cos(ang), sin(ang)) * cs * rng.randf_range(0.9, 1.6)
					var ss := rng.randf_range(0.12, 0.3)
					stones.append(Transform3D(Basis.from_euler(Vector3(rng.randf(), rng.randf() * TAU, rng.randf())).scaled(Vector3(ss, ss, ss)), Vector3(rp.x, ground(rp.x, rp.y) + ss * 0.3, rp.y)))
			else:
				# yıkıntı yığını: duvar dibinde, sokağın kenarında
				var side := -1.0 if rng.randf() < 0.5 else 1.0
				var hp := p + nor * side * (w * 0.5 - 0.5)
				for k in rng.randi_range(7, 13):
					var off := Vector2(rng.randfn(0.0, 0.9), rng.randfn(0.0, 0.45))
					var rp2 := hp + dir * off.x - nor * side * absf(off.y)
					var ss2 := rng.randf_range(0.2, 0.6)
					var lift := maxf(0.0, 0.7 - off.length() * 0.5)
					stones.append(Transform3D(Basis.from_euler(Vector3(rng.randf(), rng.randf() * TAU, rng.randf())).scaled(Vector3(ss2, ss2 * 0.8, ss2)), Vector3(rp2.x, ground(rp2.x, rp2.y) + lift * rng.randf() + ss2 * 0.3, rp2.y)))
			n += 1
		_damage_node(tiers[ti], disc, craters, 140.0, false)
		_damage_node(tiers[ti], rb, stones, 120.0, false)
	stats["hasar"] = n


## Şehir dışı yollar ve kuru dere yatakları (kaynak: antep/src/world/Streets.js ROADS; orada değişirse burada da güncelleyin).
## Kır örtüsü bunların üstüne konmaz.
const RURAL_ROADS := [[[-300, -265], [-700, -480], [-1200, -700]], [[250, 1230], [210, 1400]], [[960, 960], [1400, 1330]], [[1160, 300], [1400, 330]],
	[[-1480, 1000], [-1560, 1090]], [[-692, 420], [-760, 220], [-900, 120], [-1300, 60], [-2000, 40]], [[-1300, 60], [-1500, -150], [-1750, -380]]]


var _urban_cells := {}


## Şehir içi mi? Sokak ağının geçtiği 60 m'lik hücreler (ve komşuları) şehir sayılır: kır örtüsü meydanlara konmasın.
func _urban(p: Vector2) -> bool:
	if _urban_cells.is_empty():
		for sg in data["segments"]:
			for q in [Vector2(sg[0], sg[1]), Vector2(sg[2], sg[3])]:
				_urban_cells[Vector2i(floori(q.x / 60.0), floori(q.y / 60.0))] = true
	var k := Vector2i(floori(p.x / 60.0), floori(p.y / 60.0))
	for dx in range(-1, 2):
		for dz in range(-1, 2):
			if _urban_cells.has(k + Vector2i(dx, dz)):
				return true
	return false


func _near_road(p: Vector2, r: float) -> bool:
	var lines: Array = RURAL_ROADS + (data.get("rural", {}).get("gullies", []) as Array)
	for ln in lines:
		for i in ln.size() - 1:
			if Geometry2D.get_closest_point_to_segment(p, Vector2(ln[i][0], ln[i][1]), Vector2(ln[i + 1][0], ln[i + 1][1])).distance_to(p) < r:
				return true
	for i in data["river"].size() - 1:
		var rv: Array = data["river"]
		if Geometry2D.get_closest_point_to_segment(p, Vector2(rv[i][0], rv[i][1]), Vector2(rv[i + 1][0], rv[i + 1][1])).distance_to(p) < r + 6.0:
			return true
	return false


## AŞAMA 5 — kırsal: tepelerde kaya kümeleri, taş ocağında kesilmiş bloklar, meyve bahçeleri ve bağ sıraları.
## Yerler temsilîdir (VARSAYIM). Çarpışma eklenmez: kırsal hikâye yerleri açık arazi aramasını aynen yapar.
func _rural() -> void:
	var r: Dictionary = data.get("rural", {})
	if r.is_empty() or not ResourceLoader.exists("res://dokular/rock.tres"):
		return
	var rng := RandomNumberGenerator.new()
	rng.seed = 1921
	var mat := _tri("rock", Color(0.92, 0.9, 0.84))
	var xf := [[], [], []]
	for h in r["hills"]:
		for i in 70:
			var a := rng.randf() * TAU
			var d: float = absf(rng.randfn(0.0, 0.55)) * h[3]
			var p := Vector2(h[0] + cos(a) * d, h[1] + sin(a) * d)
			var s := rng.randf_range(0.5, 1.9) * (2.0 if rng.randf() < 0.08 else 1.0)
			var tilt := Vector3(rng.randf_range(-0.35, 0.35), rng.randf() * TAU, rng.randf_range(-0.35, 0.35))
			var sq := Vector3(s, s * rng.randf_range(0.5, 0.9), s * rng.randf_range(0.7, 1.25))
			if blocked(p.x, p.y, 3.0):
				continue
			xf[i % 3].append(Transform3D(Basis.from_euler(tilt).scaled(sq), Vector3(p.x, ground(p.x, p.y) - 0.2 * s, p.y)))
	# taş ocağı: ağız çevresinde dökülmüş moloz, tabanda sıra sıra kesilmiş bloklar
	var q: Array = r["quarry"]
	for i in 60:
		var a2 := rng.randf() * TAU
		var d2: float = q[2] * rng.randf_range(0.75, 1.1)
		var p2 := Vector2(q[0] + cos(a2) * d2, q[1] + sin(a2) * d2)
		var s2 := rng.randf_range(0.4, 1.3)
		xf[i % 3].append(Transform3D(Basis.from_euler(Vector3(rng.randf(), rng.randf() * TAU, rng.randf())).scaled(Vector3(s2, s2 * 0.7, s2)), Vector3(p2.x, ground(p2.x, p2.y) - 0.1, p2.y)))
	for v in 3:
		_multi_cells(_boulder(v, mat), xf[v], 420.0, true)
	var bm := BoxMesh.new()
	bm.size = Vector3(1.1, 0.55, 0.6)
	bm.material = _tri("stone", Color(0.95, 0.92, 0.84))
	var blocks := []
	for row in 5:
		for k in 7:
			for lay in (2 if (row + k) % 3 else 1):
				var bx: float = q[0] - 12.0 + k * 1.25 + (0.6 if lay else 0.0)
				var bz: float = q[1] - 6.0 + row * 4.2
				blocks.append(Transform3D(Basis(Vector3.UP, rng.randf_range(-0.06, 0.06)), Vector3(bx, ground(bx, bz) + 0.28 + lay * 0.56, bz)))
	_multi(bm, blocks, 0.0, 260.0, true)
	# meyve bahçeleri: aralıklı sıra ağaçlar (fıstık, zeytin yerine genel ağaç kalıbı — tür VARSAYIM)
	var trees := []
	for o in [[-1620.0, 620.0, 130.0, 90.0, 0.2], [1290.0, 650.0, 90.0, 120.0, -0.1], [-950.0, -330.0, 110.0, 80.0, 0.5]]:
		var ob := Basis(Vector3.UP, o[4])
		var ix: float = -o[2] * 0.5
		while ix < o[2] * 0.5:
			var iz: float = -o[3] * 0.5
			while iz < o[3] * 0.5:
				var w := ob * Vector3(ix + rng.randf_range(-1.0, 1.0), 0, iz + rng.randf_range(-1.0, 1.0)) + Vector3(o[0], 0, o[1])
				if rng.randf() > 0.12 and not blocked(w.x, w.z, 2.0):
					var sc := rng.randf_range(0.55, 0.8)
					trees.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc, sc)), Vector3(w.x, ground(w.x, w.z), w.z)))
				iz += 9.0
			ix += 9.0
	if protos.has("agac1"):
		_multi_cells(protos["agac1"], trees, 300.0, true)
	# bağ: alçak asma öbekleri, sıra sıra
	var vine := SphereMesh.new()
	vine.radius = 0.55
	vine.height = 0.8
	vine.radial_segments = 6
	vine.rings = 3
	vine.material = _flat(Color(0.3, 0.38, 0.16), 1.0)
	var vines := []
	for o in [[1290.0, 1000.0, 100.0, 70.0, 0.3], [-900.0, -600.0, 90.0, 70.0, -0.4]]:
		var vb := Basis(Vector3.UP, o[4])
		var vx: float = -o[2] * 0.5
		while vx < o[2] * 0.5:
			var vz: float = -o[3] * 0.5
			while vz < o[3] * 0.5:
				var w2 := vb * Vector3(vx, 0, vz + rng.randf_range(-0.2, 0.2)) + Vector3(o[0], 0, o[1])
				if rng.randf() > 0.1 and not blocked(w2.x, w2.z, 1.0):
					var vs := rng.randf_range(0.8, 1.2)
					vines.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(vs, vs, vs)), Vector3(w2.x, ground(w2.x, w2.z) + 0.25, w2.z)))
				vz += 1.5
			vx += 2.4
	_multi_cells(vine, vines, 190.0, false)
	# kır örtüsü: şehrin dışındaki ova boş kalmasın — çalı öbekleri, taşlar, tek tük ağaçlar (kümeler hâlinde)
	var patch := FastNoiseLite.new()
	patch.seed = 77
	patch.frequency = 0.006
	var shrub := SphereMesh.new()
	shrub.radius = 0.7
	shrub.height = 0.95
	shrub.radial_segments = 7
	shrub.rings = 4
	shrub.material = _flat(Color(0.33, 0.35, 0.19), 1.0)
	var shrubs := []
	var stones := [[], [], []]
	var lone := []
	var x1: float = min_x + (nx - 1) * step
	var z1: float = min_z + (nz - 1) * step
	var gx: float = min_x + 20.0
	while gx < x1 - 20.0:
		var gz: float = min_z + 20.0
		while gz < z1 - 20.0:
			var w3 := Vector2(gx + rng.randf_range(-6.0, 6.0), gz + rng.randf_range(-6.0, 6.0))
			var dens: float = patch.get_noise_2d(w3.x, w3.y) * 0.5 + 0.5
			var roll := rng.randf()
			gz += 13.0
			if roll > 0.34 * dens + 0.02 or blocked(w3.x, w3.y, 28.0) or _urban(w3) or _near_road(w3, 7.0):
				continue
			var y := ground(w3.x, w3.y)
			var kind := rng.randf()
			if kind < 0.62:
				for k in rng.randi_range(1, 4):
					var q2 := w3 + Vector2(rng.randfn(0.0, 1.6), rng.randfn(0.0, 1.6))
					var ss := rng.randf_range(0.5, 1.4)
					shrubs.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(ss, ss * rng.randf_range(0.6, 1.0), ss)), Vector3(q2.x, ground(q2.x, q2.y) + 0.15 * ss, q2.y)))
			elif kind < 0.93:
				for k in rng.randi_range(1, 5):
					var q3 := w3 + Vector2(rng.randfn(0.0, 2.2), rng.randfn(0.0, 2.2))
					var s3 := rng.randf_range(0.25, 1.1) * (2.2 if rng.randf() < 0.06 else 1.0)
					stones[k % 3].append(Transform3D(Basis.from_euler(Vector3(rng.randf_range(-0.4, 0.4), rng.randf() * TAU, rng.randf_range(-0.4, 0.4))).scaled(Vector3(s3, s3 * 0.7, s3)), Vector3(q3.x, ground(q3.x, q3.y) - 0.15 * s3, q3.y)))
			else:
				var ts := rng.randf_range(0.6, 1.0)
				lone.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(ts, ts, ts)), Vector3(w3.x, y, w3.y)))
		gx += 13.0
	_multi_cells(shrub, shrubs, 230.0, false)
	for v in 3:
		_multi_cells(_boulder(v, mat), stones[v], 260.0, false)
	if protos.has("agac3"):
		_multi_cells(protos["agac3"], lone, 420.0, true)
	stats["kir_ortusu"] = {"cali": shrubs.size(), "tas": stones[0].size() + stones[1].size() + stones[2].size(), "agac": lone.size()}
	stats["kirsal"] = {"kaya": xf[0].size() + xf[1].size() + xf[2].size(), "blok": blocks.size(), "agac": trees.size(), "asma": vines.size()}


func _plants() -> void:
	for key in data["cells"]:
		if "proto" in data["cells"][key]:
			var m: Mesh = load(res_name("proto", key))
			_apply(m)
			protos[key] = m
	# uzak ağaç: tek bir yumru (ucuz)
	var blob := SphereMesh.new()
	blob.radius = 2.6
	blob.height = 4.4
	blob.radial_segments = 7
	blob.rings = 4
	blob.material = _flat(Color(0.3, 0.36, 0.17), 1.0)
	var near_end := minf(detail_dist + 30.0, 170.0)
	var n_tree := 0
	for ch in data["chunks"]:
		var trees := {1: [], 2: [], 3: []}
		var far := []
		for t in ch["trees"]:
			var sc: float = t[4]
			var kind := int(t[5])
			var b := Basis(Vector3.UP, t[3]).scaled(Vector3(sc, sc, sc))
			trees[kind if trees.has(kind) else 1].append(Transform3D(b, Vector3(t[0], t[1], t[2])))
			var fs := sc * (0.8 if kind == 3 else 1.0)
			far.append(Transform3D(Basis().scaled(Vector3(fs, fs * (1.4 if kind == 2 else 1.0), fs)), Vector3(t[0], t[1] + 3.6 * fs, t[2])))
			n_tree += 1
		for kind in trees:
			if protos.has("agac%d" % kind):
				_multi(protos["agac%d" % kind], trees[kind], 0.0, near_end, true)
		_multi(blob, far, near_end - 8.0, draw_dist, false)
		var props := {}
		for p in ch["props"]:
			if not props.has(p[0]):
				props[p[0]] = []
			var s: float = p[5]
			props[p[0]].append(Transform3D(Basis(Vector3.UP, p[4]).scaled(Vector3(s, s, s)), Vector3(p[1], p[2], p[3])))
		for k in props:
			if k == "asma" or k == "ot":
				greens.append_array(_multi_cells(_green(k), props[k], 120.0 if k == "asma" else 45.0, false, 400.0))
			elif protos.has(k):
				_multi(protos[k], props[k], 0.0, 110.0, false)
	stats["agac"] = n_tree
	data.erase("chunks")
