extends Node3D
## GAZİANTEP 1918–1921 · Bir Şehrin 11 Ayı — Godot sürümü, ana sahne.
## Kurar: gökyüzü ve ışık (kalite kademesine göre), şehir (city.gd), kahraman sokak (street.gd), oyuncu,
## sakinler (npcs.gd), çatışma (combat.gd) ve bütün senaryolar (game.gd).
##
## Komut satırı (proje argümanları `--` işaretinden sonra):
##   --quality dusuk|orta|yuksek|ultra   görüntü kalitesi (verilmezse çizim yöntemine göre seçilir)
##   --bench <png yolu>                  8 sn kare hızı ölçer, ekran görüntüsü kaydeder ve çıkar
##   --at x,z[,yaw[,yukseklik]]          oyuncuyu şehirde bu noktaya koyar (ölçüm ve görüntü almak için)
##   --chapter a|b|c|heyet|b1|b2|b3      doğrudan o bölümden başlar (verilmezse prolog)
##   --step N                            bölümün N. adımından başlar (sınama ve görüntü almak için)
##   --pos x,z[,yaw]                     bölüm kurulduktan sonra oyuncuyu bu noktaya koyar (görüntü almak için)
##   --autoplay                          bütün senaryoları kendiliğinden oynatıp sonucu yazar ve çıkar (sınama)
## Oyun içinde F5: kalite kademesini değiştirir.

const Player := preload("res://scripts/player.gd")
const Game := preload("res://scripts/game.gd")
const Street := preload("res://scripts/street.gd")

## Kalite profilleri res://grafik/<ad>.tres dosyalarından okunur (GraphicsProfile); editörde açıp değiştirebilirsiniz.
## DÜŞÜK tümleşik ekran kartı içindir ve eski "hafif" ayarın aynısıdır.
const ORDER := ["dusuk", "orta", "yuksek", "ultra"]
var QUALITY := {}
## Hava durumları res://grafik/gunduz.tres, gece.tres, kis.tres dosyalarından okunur (Atmosphere).
var atm := {}

var city: City
var street: Node3D
var player: CharacterBody3D
var npcs: Npcs
var combat: Combat
var sfx: Sfx
var game: Node
var env: Environment
var sun: DirectionalLight3D
var quality := "dusuk"
var night := false
var winter := false
var weather := "gunduz"      # gece ve kış dışındaki hava/saat profili (res://grafik/<ad>.tres)
var snowfall: CPUParticles3D
var sky_mat: ShaderMaterial
var bench_path := ""
## Renk eşlemesi: "aces" (varsayılan) ya da "agx" (--tonemap ile denenir)
var tonemap := "aces"
## Gölge aydınlığı ve güneş gücü çarpanları (bütün gündüz profillerine uygulanır). Dar sokakta gölgedeki duvar okunabilir kalsın,
## güneş alan yüzle karşıtlık sert olsun diye. --amb / --sunk ile denenir.
var shade_lift := 1.6
var sun_gain := 1.1
## Güneşli havada renk doygunluğu çarpanı ve güneş ışığının beyaza çekilme oranı (sarı/turuncu "çöl" havasını kırmak için)
var sunny_saturation := 0.8
var sun_whiten := 0.6
## Gölgeye taş duvarlardan seken ışığın sıcaklığı (0 = profilin soğuk gök ışığı, 1 = tamamen sıcak taş tonu)
var bounce_warmth := 0.08
var bench_t := 0.0
var bench_frames := 0
var bench_min := 9999.0
var load_s := 0.0          # açılış süresi (sn)
var look_test := 0
var bak_done := 0
var bak_npc: Npc
var bak_kt := 0.0
var bak_k := 0
var look_yaw := 0.0


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	for id in ORDER:
		var gp: GraphicsProfile = load("res://grafik/%s.tres" % id)
		QUALITY[id] = gp.to_dict()
	for id in ["gunduz", "gece", "kis", "sabah", "ogle", "gunbatimi", "bulutlu", "tozlu"]:
		atm[id] = load("res://grafik/%s.tres" % id)
	# Compatibility (OpenGL) tümleşik kartlar içindir: düşük başla. Forward+ (Vulkan) ayrı ekran kartı demektir: yüksek başla.
	quality = "dusuk" if RenderingServer.get_current_rendering_method() == "gl_compatibility" else "yuksek"
	# tarayıcı (tek iş parçacığı, WebGL): düşük kademeyi daha da hafiflet — yakın ayrıntı ve görüş mesafesi kısa, çözünürlük düşük
	if OS.has_feature("web"):
		var w: Dictionary = QUALITY["dusuk"]
		w["draw"] = 300.0
		w["detail"] = 65.0
		w["shadow"] = 35.0
		w["scale"] = 0.7
		w["aniso"] = 0
	var at := ""
	var chapter := "a"
	var step := 0
	var pos := ""
	for i in args.size():
		if args[i] == "--bench" and i + 1 < args.size():
			bench_path = args[i + 1]
		if args[i] == "--quality" and i + 1 < args.size() and QUALITY.has(args[i + 1]):
			quality = args[i + 1]
		if args[i] == "--amb" and i + 1 < args.size():
			shade_lift = float(args[i + 1])
		if args[i] == "--sunk" and i + 1 < args.size():
			sun_gain = float(args[i + 1])
		if args[i] == "--tonemap" and i + 1 < args.size():
			tonemap = args[i + 1]
		if args[i] == "--at" and i + 1 < args.size():
			at = args[i + 1]
		if args[i] == "--chapter" and i + 1 < args.size():
			chapter = args[i + 1]
		if args[i] == "--pos" and i + 1 < args.size():
			pos = args[i + 1]
		if args[i] == "--step" and i + 1 < args.size():
			step = int(args[i + 1])
	_environment()
	city = City.new()
	add_child(city)
	city.setup(QUALITY[quality])
	var hero: Dictionary = city.data["hero"]
	street = Street.new()
	street.city = city
	street.position = Vector3(hero["origin"][0], city.hero_y, hero["origin"][1])
	street.rotation.y = hero["theta"]
	add_child(street)
	player = Player.new()
	player.city = city
	add_child(player)
	street.player = player
	player.place(street.to_global(Vector3(street.cx(-2.0), 0.0, -2.0)), street.rotation.y)
	if "--kapi-ac" in args:
		for dr in city.doors:
			city.door_toggle(dr)
	if "--ev-ici" in args and city.ic_rect.has_area():
		at = "%f,%f,%f" % [city.ic_spawn.x, city.ic_spawn.z, float(args[args.find("--ev-ici") + 1]) if args.size() > args.find("--ev-ici") + 1 and args[args.find("--ev-ici") + 1].is_valid_float() else 0.0]
	if at != "":
		var v := at.split_floats(",")
		player.place(Vector3(v[0], 0.0, v[1]), v[2] if v.size() > 2 else 0.0)
		if v.size() > 3:
			player.lift = v[3]
			player.pitch = -0.28
	if "--hasar" in args:      # sınama: hasar düzeyini doğrudan uygula (0..1)
		city.set_damage(float(args[args.find("--hasar") + 1]))
	city.warm(player.global_position.x, player.global_position.z)
	sfx = Sfx.new()
	add_child(sfx)
	player.sfx = sfx
	npcs = Npcs.new()
	npcs.city = city
	npcs.street = street
	npcs.player = player
	npcs.nav = Nav.new().load_file("res://city/nav.json")
	add_child(npcs)
	npcs.setup(QUALITY[quality]["npc"])
	if at == "":
		combat = Combat.new()
		combat.city = city
		combat.npcs = npcs
		combat.player = player
		combat.sfx = sfx
		add_child(combat)
		combat.setup()
		game = Game.new()
		game.world = self
		game.city = city
		game.street = street
		game.npcs = npcs
		game.player = player
		game.combat = combat
		game.sfx = sfx
		game.autoplay = "--autoplay" in args
		add_child(game)
		if game.chapters.has(chapter):
			game.prog[chapter] = step
		game.set_chapter(chapter if game.chapters.has(chapter) else "a")
		# giriş ekranı (sınama ve ölçüm kiplerinde atlanır); --ui journal|settings|intro: görüntü almak için o pencereyi açık başlatır
		var ui_arg := ""
		for i in args.size():
			if args[i] == "--ui" and i + 1 < args.size():
				ui_arg = args[i + 1]
		if ui_arg != "":
			game.menu.show_panel(ui_arg)
		elif bench_path == "" and not game.autoplay:
			game.menu.show_panel("intro")
		# --karakter <res yolu>: üretilen bir karakter modelini dükkânın önüne koyar (deneme görüntüsü için)
		for i in args.size():
			if args[i] == "--karakter" and i + 1 < args.size() and ResourceLoader.exists(args[i + 1]):
				var km: Node3D = load(args[i + 1]).instantiate()
				add_child(km)
				var kp := street.to_global(Vector3(street.cx(-4.2) + 0.2, 0, -4.2))
				km.global_position = Vector3(kp.x, city.ground(kp.x, kp.z), kp.z)
				km.rotation.y = street.rotation.y + PI + deg_to_rad(float(args[args.find("--karakter-yaw") + 1]) if "--karakter-yaw" in args else 90.0)
				km.scale = Vector3.ONE * 1.68
				# --karakter-anim <ad>: o animasyonu oynatır (yoksa bekleme)
				var kap := km.find_child("AnimationPlayer", true, false) as AnimationPlayer
				if kap != null:
					var want := "idle"
					if "--karakter-anim" in args:
						want = args[args.find("--karakter-anim") + 1]
					if kap.has_animation(want):
						kap.play(want)
						kap.seek(0.6, true)
		if "--routetest" in args:
			game.route_test()
		if "--map" in args:   # görüntü almak için büyük haritayı açık başlat
			game.big_map.visible = true
			game.big_map.open_full()
			game.ui.play.visible = false
			game.menu.set_active("map")
			game._route()
		if pos != "":
			var pv := pos.split_floats(",")
			player.place(Vector3(pv[0], 0.0, pv[1]), pv[2] if pv.size() > 2 else 0.0)
			city.warm(pv[0], pv[1])
	if bench_path != "":
		player.enabled = false
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_apply_quality()
	load_s = Time.get_ticks_msec() / 1000.0


func _environment() -> void:
	env = Environment.new()
	var sky := Sky.new()
	# gökyüzü: ufka doğru tozlu, tepede derin mavi; yavaş kayan bulutlar ve güneş hâlesi
	var sh := Shader.new()
	sh.code = """shader_type sky;
// Gökyüzü: tepeye doğru koyulaşan, ufukta puslu atmosfer; ince yüksek bulut katmanı ve güneşe göre aydınlanıp gölgelenen
// kümülüs katmanı; güneş diski ve hâlesi; ufukta uzak dağ silueti (şehrin ve arazinin gökle birleştiği çizgi).
uniform vec3 sky_top_color : source_color = vec3(0.2, 0.4, 0.72);
uniform vec3 sky_horizon_color : source_color = vec3(0.78, 0.81, 0.84);
uniform vec3 ground_horizon_color : source_color = vec3(0.68, 0.62, 0.5);
uniform vec3 ground_bottom_color : source_color = vec3(0.3, 0.26, 0.2);
uniform vec3 cloud_color : source_color = vec3(1.0, 0.97, 0.9);
uniform float cover = 0.56;
uniform float mountains = 1.0;
uniform sampler2D noise : repeat_enable, filter_linear_mipmap;
float layer(vec2 uv) {
	return texture(noise, uv).r * 0.62 + texture(noise, uv * 2.7 + 0.37).r * 0.38;
}
void sky() {
	vec3 d = EYEDIR;
	float h = clamp(d.y, 0.0, 1.0);
	// atmosfer: ufka yakın kalın pus bandı, tepeye doğru hızla açılan gök
	vec3 col = mix(sky_horizon_color, sky_top_color, 1.0 - exp(-h * 3.4));
	float s = max(dot(d, LIGHT0_DIRECTION), 0.0);
	col += LIGHT0_COLOR * pow(s, 5.0) * 0.16 * (1.0 - h);
	if (d.y > 0.01) {
		// yüksek, ince katman
		vec2 uv2 = d.xz / (d.y + 0.34) * 0.06 + vec2(TIME * 0.0005, 0.0);
		float ci = smoothstep(0.5, 0.86, texture(noise, uv2 * 1.9 + 0.11).r) * smoothstep(0.02, 0.3, d.y);
		col = mix(col, mix(cloud_color, sky_horizon_color, 0.3), ci * 0.3);
		// kümülüs: güneşe bakan kenar aydınlık, taban gölgeli
		vec2 uv = d.xz / (d.y + 0.16) * 0.16 + vec2(TIME * 0.0016, TIME * 0.0006);
		float n = layer(uv);
		float c = smoothstep(cover, cover + 0.2, n);
		float ns = layer(uv + LIGHT0_DIRECTION.xz * 0.03);
		float lit = clamp((n - ns) * 7.0 + 0.55, 0.0, 1.0);
		float depth = smoothstep(cover + 0.05, cover + 0.42, n);
		vec3 cc = mix(cloud_color * 0.5, cloud_color * 1.1, lit) * mix(1.0, 0.8, depth);
		cc = mix(cc, sky_horizon_color, (1.0 - smoothstep(0.0, 0.26, d.y)) * 0.65);
		col = mix(col, cc, c * smoothstep(0.012, 0.11, d.y) * 0.96);
	}
	col += LIGHT0_COLOR * LIGHT0_ENERGY * (pow(s, 900.0) * 2.5 + pow(s, 12.0) * 0.1);
	// uzak dağ silueti: iki katmanlı sırt çizgisi, pusla açılmış
	float az = atan(d.x, d.z) / 6.2831853;
	float r1 = (texture(noise, vec2(az * 2.0, 0.21)).r * 0.7 + texture(noise, vec2(az * 9.0, 0.63)).r * 0.3) * 0.085 * mountains;
	float r2 = (texture(noise, vec2(az * 3.0 + 0.4, 0.47)).r * 0.75 + texture(noise, vec2(az * 13.0, 0.83)).r * 0.25) * 0.05 * mountains;
	vec3 far_m = mix(sky_horizon_color, sky_top_color * 0.6 + sky_horizon_color * 0.2, 0.34);
	vec3 near_m = mix(sky_horizon_color, ground_horizon_color * 0.75, 0.55);
	col = mix(col, far_m, (1.0 - smoothstep(r1 - 0.003, r1 + 0.001, d.y)) * step(0.0005, r1));
	col = mix(col, near_m, (1.0 - smoothstep(r2 - 0.003, r2 + 0.001, d.y)) * step(0.0005, r2));
	if (d.y < 0.0) {
		col = mix(mix(col, ground_horizon_color, 0.6), ground_bottom_color, clamp(-d.y * 4.0, 0.0, 1.0));
	}
	COLOR = col;
}"""
	var sm := ShaderMaterial.new()
	sm.shader = sh
	var nz := FastNoiseLite.new()
	nz.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	nz.frequency = 0.012
	nz.fractal_octaves = 4
	var nt := NoiseTexture2D.new()
	nt.width = 256
	nt.height = 256
	nt.seamless = true
	nt.noise = nz
	sm.set_shader_parameter("noise", nt)
	sky.sky_material = sm
	sky_mat = sm
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	# gölgedeki taş maviye çalmasın: ortam ışığı sıcak sabit bir tondan (taştan seken ışık hissi)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.66, 0.6, 0.52)
	env.ambient_light_energy = 0.8
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_AGX if tonemap == "agx" else Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 1.0
	env.tonemap_white = 6.0
	env.fog_enabled = true
	env.fog_light_color = Color(0.8, 0.77, 0.68)
	env.fog_density = 0.7
	env.fog_sky_affect = 0.25
	env.fog_aerial_perspective = 0.4
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.08
	env.adjustment_contrast = 1.06
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.light_color = Color(1.0, 0.9, 0.74)
	sun.light_energy = 1.55
	sun.rotation_degrees = Vector3(-38, -128, 0)   # öğleden sonra, güneybatıdan
	sun.shadow_enabled = true
	sun.shadow_bias = 0.05
	sun.shadow_normal_bias = 1.2
	sun.directional_shadow_blend_splits = true
	add_child(sun)


## Kalite kademesini ışık ve efektlere uygular. Efektlerin çoğu yalnız Forward+ (Vulkan) yönteminde çalışır;
## Compatibility'de sessizce yok sayılır.
func _apply_quality() -> void:
	var q: Dictionary = QUALITY[quality]
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS if q["splits"] == 4 else DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = q["shadow"]
	env.glow_enabled = q["glow"]
	env.glow_intensity = 0.5
	env.glow_bloom = 0.05
	env.glow_hdr_threshold = 1.1
	env.ssao_enabled = q["ssao"]
	env.ssao_radius = 1.6
	env.ssao_intensity = 2.2
	env.ssil_enabled = q["gi"]
	env.sdfgi_enabled = q["gi"]
	env.sdfgi_cascades = 4
	env.sdfgi_use_occlusion = true
	env.ssr_enabled = q["gi"]
	env.volumetric_fog_enabled = q["vfog"]
	env.volumetric_fog_density = 0.006
	env.volumetric_fog_albedo = Color(0.9, 0.86, 0.76)
	_light()
	var vp := get_viewport()
	vp.scaling_3d_scale = q["scale"]
	vp.msaa_3d = q["msaa"] as Viewport.MSAA
	vp.set("anisotropic_filtering_level", int(q["aniso"]))   # eğik açıda yüzey netliği
	city.detail_dist = q["detail"]
	if player:
		player.cam.far = maxf(1500.0, q["draw"] * 1.6)


## Bölümün hava ve saat profili (sabah, ogle, gunduz, gunbatimi, bulutlu, tozlu). Gece ve kış bunun üstüne yazar.
func set_weather(id: String) -> void:
	if not atm.has(id) or id == weather:
		return
	weather = id
	_light()


## Kış: kar örtüsü, kapalı gök, yoğun pus ve kar yağışı (Ocak–Şubat 1921 bölümleri)
func set_winter(on: bool) -> void:
	if on == winter:
		return
	winter = on
	city.set_snow(1.0 if on else 0.0)
	street.set_snow(on)
	if snowfall == null:
		snowfall = CPUParticles3D.new()
		snowfall.amount = maxi(1, int(QUALITY[quality]["snow"]))
		snowfall.lifetime = 5.0
		snowfall.preprocess = 5.0
		snowfall.local_coords = false
		snowfall.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
		snowfall.emission_box_extents = Vector3(14, 0.5, 14)
		snowfall.direction = Vector3(0.2, -1, 0.1)
		snowfall.spread = 12.0
		snowfall.gravity = Vector3(0, -0.6, 0)
		snowfall.initial_velocity_min = 1.6
		snowfall.initial_velocity_max = 2.6
		var qm := QuadMesh.new()
		qm.size = Vector2(0.05, 0.05)
		var sm := StandardMaterial3D.new()
		sm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		sm.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		sm.albedo_color = Color(0.95, 0.96, 1.0)
		qm.material = sm
		snowfall.mesh = qm
		snowfall.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		snowfall.position = Vector3(0, 9, 0)
		player.add_child(snowfall)
	sfx.set_wind(on)
	snowfall.emitting = on
	snowfall.visible = on
	_light()


## Gece/gündüz. Gece: ay ışığı (soğuk, zayıf), koyu gök; siluetler seçilecek kadar aydınlık kalır.
func set_night(on: bool) -> void:
	if on == night:
		return
	night = on
	_light()


func _light() -> void:
	var a: Atmosphere = atm["gece"] if night else (atm["kis"] if winter else atm[weather])
	# Gölge açma ve güneş güçlendirme yalnız GÜNEŞLİ profillerde tam uygulanır; kapalı hava ve kışta (güneşi zayıf, ortam ışığı
	# zaten yüksek profiller) uygulanmaz, yoksa sahne ağarır.
	var sunny := 0.0 if night else clampf((a.sun_energy - 0.8) / 0.5, 0.0, 1.0)
	sun.light_energy = a.sun_energy * lerpf(1.0, sun_gain, sunny)
	sun.light_color = a.sun_color.lerp(Color(1.0, 0.99, 0.97), sun_whiten * sunny)
	sun.rotation_degrees = Vector3(a.sun_elevation, a.sun_azimuth, 0)
	env.ambient_light_color = a.ambient_color.lerp(Color(0.76, 0.67, 0.54), bounce_warmth * sunny)
	sun.shadow_blur = 1.0 if night else 0.6      # gündüz gölgesi keskin kenarlı
	# seken ışık (SDFGI) açıksa sabit ortam ışığını kıs, yoksa sahne fazla aydınlanır
	env.ambient_light_energy = a.ambient_energy * (0.45 if (QUALITY[quality]["gi"] and not night) else 1.0) * lerpf(1.0, shade_lift, sunny)
	env.fog_light_color = a.fog_color
	# uzak pus: yakın net, uzaklaştıkça yapılar ufuk rengine bürünür (atmosferik perspektif); kış gecesinde kış pusu geçerli
	var fz: Atmosphere = atm["kis"] if (night and winter) else a
	env.fog_mode = Environment.FOG_MODE_DEPTH
	env.fog_density = fz.haze
	env.fog_depth_begin = fz.fog_begin
	env.fog_depth_end = fz.fog_end
	env.fog_depth_curve = 1.4
	sky_mat.set_shader_parameter("mountains", a.mountains)
	env.tonemap_exposure = a.exposure
	env.adjustment_saturation = a.saturation * lerpf(1.0, sunny_saturation, sunny)
	env.adjustment_contrast = a.contrast
	sky_mat.set_shader_parameter("sky_top_color", a.sky_top)
	sky_mat.set_shader_parameter("sky_horizon_color", a.sky_horizon)
	sky_mat.set_shader_parameter("ground_horizon_color", a.ground_horizon)
	sky_mat.set_shader_parameter("ground_bottom_color", a.ground_bottom)
	sky_mat.set_shader_parameter("cloud_color", a.cloud_color)
	sky_mat.set_shader_parameter("cover", a.cloud_cover)
	if "--doku-deneme" in OS.get_cmdline_user_args() and not night and not winter:
		_demo_hava()


## Sınama havası (--doku-deneme): tozlu, sıcak ama doygunluğu düşük gün ışığı; gölgeler kara değil sıcak kahve (taştan seken
## ışık), sokak boyunca kısa mesafede başlayan sıcak pus. Hedef görüntü: kullanıcının gönderdiği ara sokak örnekleri.
func _demo_hava() -> void:
	sun.light_color = Color(1.0, 0.91, 0.79)
	sun.light_energy = 1.6
	sun.shadow_blur = 1.6
	env.ambient_light_color = Color(0.72, 0.67, 0.6)
	env.ambient_light_energy = 1.2
	env.fog_mode = Environment.FOG_MODE_DEPTH
	env.fog_light_color = Color(0.82, 0.78, 0.7)
	env.fog_density = 0.55
	env.fog_depth_begin = 12.0
	env.fog_depth_end = 260.0
	env.fog_depth_curve = 1.1
	env.fog_sky_affect = 0.35
	env.adjustment_saturation = 0.68
	env.adjustment_contrast = 1.0
	env.tonemap_exposure = 1.05
	sky_mat.set_shader_parameter("sky_top_color", Color(0.42, 0.58, 0.76))
	sky_mat.set_shader_parameter("sky_horizon_color", Color(0.86, 0.82, 0.74))
	sky_mat.set_shader_parameter("cover", 0.75)


func _unhandled_input(e: InputEvent) -> void:
	# kapılar: en yakın kemerli kapıyı aç/kapat (E) — ev giriş kapısı aşağıda ayrıca ele alınır
	if e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_E and city != null and not city.doors.is_empty():
		var pp0 := player.global_position
		var near_ev := city.ic_door != Vector3.ZERO and Vector2(pp0.x, pp0.z).distance_to(Vector2(city.ic_door.x, city.ic_door.z)) < 2.2
		if not near_ev:
			var d0: Dictionary = city.door_near(pp0, 2.0)
			if not d0.is_empty():
				city.door_toggle(d0)
				return
	# sınama: test sokağındaki kapıdan Nazaretyan Evi içine giriş / çıkış (E)
	if e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_E and city != null and city.ic_door != Vector3.ZERO:
		var pp := player.global_position
		if Vector2(pp.x, pp.z).distance_to(Vector2(city.ic_door.x, city.ic_door.z)) < 2.2:
			# ev kapısı: kapalıysa önce açılır, açıkken E ile içeri girilir
			var dd: Dictionary = city.door_near(pp, 2.4)
			if not dd.is_empty() and not dd["open"]:
				city.door_toggle(dd)
				return
			player.place(city.ic_spawn, 0.0)
			print("EV_ICI giris")
			return
		if city.ic_rect.has_point(Vector2(pp.x, pp.z)) and Vector2(pp.x, pp.z).distance_to(Vector2(city.ic_spawn.x, city.ic_spawn.z)) < 3.0:
			player.place(city.ic_door, city.ic_door_yaw + PI)
			print("EV_ICI cikis")
			return
	if e is InputEventKey and e.pressed and not e.echo and e.keycode == KEY_F5:
		quality = ORDER[(ORDER.find(quality) + 1) % ORDER.size()]
		_apply_quality()
		print("Kalite: ", quality)


func _process(dt: float) -> void:
	city.stream(player.global_position.x, player.global_position.z, dt)
	# ev içinde pus yok (taramanın ışığı fotoğrafta; sis odayı beyaza boğuyor)
	if city.ic_rect.has_area():
		env.fog_enabled = not city.ic_rect.has_point(Vector2(player.global_position.x, player.global_position.z))
	if bench_path == "":
		return
	bench_t += dt
	# --bak <etiket>: görüntü kipinde oyuncuyu o kişinin 3 m önüne, yüzü ona dönük koyar (karakter denetimi için)
	if bak_done == 0 and bench_t > 1.5 and "--bak" in OS.get_cmdline_user_args() and game:
		bak_done = 1
		var args2 := OS.get_cmdline_user_args()
		var want_tag: String = args2[args2.find("--bak") + 1]
		for a in game.npcs.agents:
			if a.tag == want_tag:
				var fw := Vector3(sin(a.global_rotation.y), 0.0, cos(a.global_rotation.y))
				var side := fw.cross(Vector3.UP) * float(args2[args2.find("--bak-yan") + 1]) if "--bak-yan" in args2 else Vector3.ZERO
				var dist := float(args2[args2.find("--bak-mesafe") + 1]) if "--bak-mesafe" in args2 else 3.0
				var p: Vector3 = a.global_position + fw * dist + side
				var d: Vector3 = a.global_position - p
				if "--bak-yuru" in args2:      # kişi kameraya doğru yürür; kamera yürüyüş yolunun ucunda
					var yol := float(args2[args2.find("--bak-yol") + 1]) if "--bak-yol" in args2 else 7.0
					a.route = [a.global_position + fw * yol]
					a.speed = 1.2
					p = a.global_position + fw * (yol + 1.8) + side
					d = a.global_position - p
					bak_npc = a
				player.place(p, atan2(-d.x, -d.z))
				player.enabled = false
				print("BAK ", want_tag, " ", a.global_position, " gizli=", a.hidden)
	# --bak-yuru: yürüyüş kare kare kaydedilir (<bench>_kare_NNN.png), sonra hareketli görüntü yapılır
	if bak_npc != null and bench_t > 2.5 and bench_t < 10.5:
		bak_kt += dt
		if bak_kt >= 0.066:
			bak_kt = 0.0
			get_viewport().get_texture().get_image().save_png(bench_path.replace(".png", "_kare_%03d.png" % bak_k))
			bak_k += 1
	# --looktest: fare kilitliyken gönderilen bir fare hareketinin bakışı döndürdüğünü doğrular (sınama)
	if look_test == 0 and bench_t > 2.0 and "--looktest" in OS.get_cmdline_user_args():
		look_test = 1
		if game:
			game.menu.close_all()
		player.enabled = true
		look_yaw = player.yaw
		var ev := InputEventMouseMotion.new()
		ev.relative = Vector2(150, 0)
		ev.position = get_viewport().get_visible_rect().size * 0.5
		Input.parse_input_event(ev)
	elif look_test == 1 and bench_t > 2.5:
		look_test = 2
		print("LOOKTEST fare_kilitli=%s yaw_degisimi=%.3f" % [Input.mouse_mode == Input.MOUSE_MODE_CAPTURED, player.yaw - look_yaw])
		player.enabled = false
	if bench_t > 3.0:
		bench_frames += 1
		bench_min = minf(bench_min, 1.0 / maxf(dt, 0.0001))
	if bench_t > 11.0:
		var fps := bench_frames / (bench_t - 3.0)
		var img := get_viewport().get_texture().get_image()
		img.save_png(bench_path)
		print("BENCH ortalama_fps=%.1f en_dusuk_fps=%.1f cizim_cagrisi=%d ucgen=%d kalite=%s detay_hucre=%d yontem=%s bellek_mb=%d doku_mb=%d yukleme_sn=%.1f" % [
			fps, bench_min,
			RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME),
			RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_PRIMITIVES_IN_FRAME),
			quality, city.stats.detay, RenderingServer.get_current_rendering_method(), OS.get_static_memory_usage() / 1048576,
			RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TEXTURE_MEM_USED) / 1048576, load_s])
		get_tree().quit()
