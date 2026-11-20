class_name Combat
extends Node
## SAVAŞ MEKANİĞİ — birinci şahıs tüfek, sınırlı mühimmat, siper, düşman ve müttefik davranışı (web: src/game/Combat.js).
## Dönem: sürgülü mekanizmalı piyade tüfeği (5 fişeklik şarjör, her atıştan sonra mekanizma kurulur). Model yer tutucudur, ses yoktur.
## Siper: çömelmiş (C) oyuncu ile atıcı arasında alçak bir siper varsa isabet olasılığı çok düşer; yapılar ve arazi görüşü keser.
## Tarihî sonuç sabittir. `endless` (bitmeyen) çatışmalar tarihte kaybedilen ya da geri çekilmeyle biten çatışmalardır:
##   düşman tükenmez (vurulanın yerine yenisi gelir), dalgalar büyür, isabet zamanla artar; düşmanı yok ederek kazanmak mümkün
##   değildir. Süre dolunca "çekilme emri" gelir; çatışma BASKIN kipinde sürer (düşman siperlerinden çıkıp oyuncuya yürür)
##   ve oyuncu geri çekilme hedefine varana kadar durmaz.
## Şiddet gösterimi sadedir: vurulan asker yere düşer; kan ve parçalanma yoktur.

const CLIP := 5
const BOLT := 1.25
const RELOAD := 2.6
const POOL := 9
const FOV := 72.0

var city: City
var npcs: Npcs
var player: CharacterBody3D
var sfx: Sfx
var rng := RandomNumberGenerator.new()
var covers: Array = []      # {p: Vector2, r: float}
var active := false
var result := ""            # "" | won | lost
var equipped := false
var clip := CLIP
var reserve := 25
var cool := 0.0
var reload_t := 0.0
var ads := 0.0
var ads_on := false
var kick := 0.0
var hp := 100.0
var hurt_t := 0.0
var since_hit := 99.0
var enemies: Array = []     # {a, lane, ci, goal, state, t, fire_t, aim_t, kneel, wave}
var allies: Array = []      # {a, hp, fire_t, down, safe}
var pool: Array[Npc] = []
var cfg := {}
var t := 0.0
var wave := -1
var wave_t := 0.0
var spawned := 0
var spawn_t := 0.0
var overrun := false      # çekilme emrinden sonra: düşman ilerliyor
var gun: Node3D
var bolt: MeshInstance3D
var flash: MeshInstance3D
var tracers: Array = []
var ti := 0
var ammo_lbl: Label
var vig: ColorRect


func setup() -> void:
	rng.seed = 1920
	for i in POOL:
		var a := npcs.add_story("K09", "dusman", {"x": 0.0, "z": 0.0}, {"grp": "cmb", "role": "dusman"})
		a.external = true
		pool.append(a)
	_weapon()
	for i in 10:
		var mi := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(0.018, 0.018, 1.0)
		mi.mesh = bm
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.albedo_color = Color(1.0, 0.95, 0.76)
		mi.material_override = m
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.visible = false
		add_child(mi)
		tracers.append({"m": mi, "t": 0.0})
	var layer := CanvasLayer.new()
	add_child(layer)
	vig = ColorRect.new()
	vig.color = Color(0.45, 0.0, 0.0, 0.0)
	vig.set_anchors_preset(Control.PRESET_FULL_RECT)
	vig.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(vig)
	ammo_lbl = Label.new()
	ammo_lbl.add_theme_font_size_override("font_size", 26)
	ammo_lbl.add_theme_color_override("font_color", Color(0.96, 0.91, 0.8))
	ammo_lbl.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	ammo_lbl.add_theme_constant_override("outline_size", 5)
	layer.add_child(ammo_lbl)
	ammo_lbl.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	ammo_lbl.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	ammo_lbl.grow_vertical = Control.GROW_DIRECTION_BEGIN
	ammo_lbl.offset_right = -18
	ammo_lbl.offset_left = -18
	ammo_lbl.offset_top = -44
	ammo_lbl.offset_bottom = -44
	_hud()


func can_act() -> bool:
	return equipped and player.enabled and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED and hp > 0.0


# ---------------------------------------------------------------- siper ve görüş
func add_cover(p: Vector2, r := 0.7) -> void:
	covers.append({"p": p, "r": r})


## Hedef (tp) ile atıcı (sp) arasında, hedefin hemen önünde alçak siper var mı
func cover_factor(tp: Vector2, sp: Vector2, crouched: bool) -> float:
	var d := (sp - tp).normalized()
	for c in covers:
		var v: Vector2 = c["p"] - tp
		var l := v.length()
		if l > 1.9 + c["r"] or l < 0.05:
			continue
		if v.dot(d) / l > 0.35:
			return 0.12 if crouched else 0.6
	return 1.0


## Görüş: yapı çokgenleri ve arazi keser
func los(a: Vector3, b: Vector3) -> bool:
	if city.los_blocked(Vector2(a.x, a.z), Vector2(b.x, b.z)):
		return false
	var n := int(ceil(Vector2(b.x - a.x, b.z - a.z).length() / 5.0))
	for i in range(1, n):
		var p := a.lerp(b, float(i) / n)
		if p.y < city.ground(p.x, p.z) + 0.15:
			return false
	return true


# ---------------------------------------------------------------- oyuncunun tüfeği
func _box(parent: Node3D, c: Color, size: Vector3, pos: Vector3, metal := 0.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mi.mesh = bm
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = 0.5 if metal > 0.0 else 0.8
	m.metallic = metal
	mi.material_override = m
	mi.position = pos
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	return mi


func _weapon() -> void:
	gun = Node3D.new()
	var wood := Color(0.35, 0.23, 0.13)
	var steel := Color(0.17, 0.17, 0.18)
	_box(gun, wood, Vector3(0.05, 0.07, 0.62), Vector3(0, 0, -0.18))
	_box(gun, wood, Vector3(0.045, 0.11, 0.3), Vector3(0, -0.035, 0.22)).rotation.x = 0.12
	_box(gun, steel, Vector3(0.022, 0.022, 0.78), Vector3(0, 0.04, -0.3), 0.8)
	_box(gun, steel, Vector3(0.03, 0.03, 0.14), Vector3(0, 0.045, 0.08), 0.8)
	bolt = _box(gun, steel, Vector3(0.07, 0.02, 0.02), Vector3(0.045, 0.045, 0.1), 0.8)
	_box(gun, steel, Vector3(0.008, 0.03, 0.008), Vector3(0, 0.07, -0.66), 0.8)
	flash = MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.05
	sm.height = 0.1
	flash.mesh = sm
	var fm := StandardMaterial3D.new()
	fm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	fm.albedo_color = Color(1.0, 0.94, 0.78)
	flash.material_override = fm
	flash.position = Vector3(0, 0.05, -0.75)
	flash.visible = false
	gun.add_child(flash)
	gun.visible = false
	player.cam.add_child(gun)


func _tracer(a: Vector3, b: Vector3) -> void:
	var tr: Dictionary = tracers[ti % tracers.size()]
	ti += 1
	var mi: MeshInstance3D = tr["m"]
	var l := a.distance_to(b)
	if l < 0.05:
		return
	mi.global_position = (a + b) * 0.5
	mi.look_at(b, Vector3.UP if absf((b - a).normalized().y) < 0.99 else Vector3.RIGHT)
	mi.scale = Vector3(1, 1, l)
	mi.visible = true
	tr["t"] = 0.09


func equip(on: bool) -> void:
	equipped = on
	gun.visible = on
	if not on:
		ads_on = false
	_hud()


func resupply(n := 25) -> void:
	reserve = maxi(reserve, n)
	clip = CLIP
	_hud()


func fire() -> void:
	if cool > 0.0 or reload_t > 0.0:
		return
	if clip <= 0:
		if sfx:
			sfx.play("click", 0.7)
		if reserve > 0:
			reload()
		return
	clip -= 1
	cool = BOLT
	kick = 1.0
	flash.visible = true
	if sfx:
		sfx.play("shot", 1.0)
	_hud()
	var cam: Camera3D = player.cam
	var o := cam.global_position
	var d := -cam.global_transform.basis.z
	var sp := (0.0025 if ads > 0.7 else 0.012) + minf(0.012, Vector2(player.velocity.x, player.velocity.z).length() * 0.002)
	d += Vector3(rng.randf() - 0.5, rng.randf() - 0.5, rng.randf() - 0.5) * sp * 2.0
	d = d.normalized()
	# en yakın isabet: düşmanın dikey ekseni
	var best = null
	var bt := 260.0
	var h2 := d.x * d.x + d.z * d.z
	if h2 > 0.000001:
		for e in enemies:
			var a: Npc = e["a"]
			if e["state"] == "down" or a.hidden:
				continue
			var ap := a.global_position
			var tt := ((ap.x - o.x) * d.x + (ap.z - o.z) * d.z) / h2
			if tt <= 0.0 or tt >= bt:
				continue
			var mx := o.x + d.x * tt - ap.x
			var mz := o.z + d.z * tt - ap.z
			if mx * mx + mz * mz > 0.38 * 0.38:
				continue
			var y := o.y + d.y * tt
			if y < ap.y + 0.1 or y > ap.y + (1.25 if e["kneel"] else 1.82):
				continue
			best = e
			bt = tt
	var end := o + d * (bt if best != null else 120.0)
	if best != null and not los(o, end):
		best = null
	_tracer(o + d * 0.9 - Vector3(0, 0.08, 0), end)
	if best != null:
		_down(best)


func reload() -> void:
	if reload_t > 0.0 or clip >= CLIP or reserve <= 0:
		return
	reload_t = RELOAD
	if sfx:
		sfx.play("reload", 0.6)
	_hud()


func _hud() -> void:
	if ammo_lbl == null:
		return
	ammo_lbl.visible = equipped
	if reload_t > 0.0:
		ammo_lbl.text = "dolduruluyor…"
	else:
		ammo_lbl.text = "%d / %d%s" % [clip, reserve, "   R: doldur" if clip == 0 else ""]


## Oyuncu hasarı (düşman atışı, şarapnel)
func damage(n: float) -> void:
	if hp <= 0.0:
		return
	hp = maxf(0.0, hp - n)
	hurt_t = 1.0
	since_hit = 0.0
	if sfx:
		sfx.play("hurt", 0.9)
	if hp <= 0.0 and active:
		result = "lost"


func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventMouseButton:
		if e.button_index == MOUSE_BUTTON_LEFT and e.pressed and can_act():
			fire()
		elif e.button_index == MOUSE_BUTTON_RIGHT:
			ads_on = e.pressed and can_act()
	elif e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_R and can_act():
		reload()


# ---------------------------------------------------------------- çatışma sahnesi
## c: {allies: [Npc], spawns: [Vector2], lanes: [[Vector2…]], waves: [{n, gap}], limit: sn, on_tick: Callable(t), target_bias}
func start(c: Dictionary) -> void:
	stop()
	cfg = c
	active = true
	result = ""
	t = 0.0
	wave = -1
	wave_t = 2.0
	spawned = 0
	spawn_t = 0.0
	hp = 100.0
	overrun = false
	npcs.groups["cmb"] = true
	for a in c.get("allies", []):
		if a == null:
			continue
		a.external = true
		a.set_pose("kneel")
		allies.append({"a": a, "hp": 2, "fire_t": 2.0 + rng.randf() * 3.0, "down": false, "safe": a.tag == "karayilan"})


func stop() -> void:
	active = false
	overrun = false
	for e in enemies:
		npcs.set_hidden(e["a"], true)
	enemies.clear()
	for al in allies:
		al["a"].external = false
	allies.clear()
	for a in pool:
		npcs.set_hidden(a, true)
	if result != "lost":
		hp = maxf(hp, 60.0)


func _endless() -> bool:
	return cfg.get("endless", false)


## Dalganın asker sayısı (bitmeyen çatışmada her turda iki kişi artar)
func _wave_n() -> int:
	var w: Array = cfg["waves"]
	return int(w[wave % w.size()]["n"]) + ((wave / w.size()) * 2 if _endless() else 0)


## Çekilme emri: süre doldu, hat tutulamıyor. Çatışma baskın kipinde sürer.
func set_overrun() -> void:
	overrun = true
	result = ""
	cfg.erase("limit")


func _spawn() -> bool:
	var a: Npc = null
	for p in pool:
		if p.hidden:
			a = p
			break
	if a == null and _endless():
		# havuz doldu: yerde yatan bir askerin yerine yenisi gelir (düşman tükenmez)
		for e in enemies:
			if e["state"] == "down":
				a = e["a"]
				enemies.erase(e)
				break
	if a == null:
		return false
	var s: Vector2 = cfg["spawns"][spawned % cfg["spawns"].size()]
	var lane: Array = cfg["lanes"][(spawned + wave) % cfg["lanes"].size()]
	a.put(s.x + (rng.randf() - 0.5) * 6.0, s.y + (rng.randf() - 0.5) * 6.0)
	npcs.set_hidden(a, false)
	a.set_pose("idle")
	enemies.append({"a": a, "lane": lane, "ci": 0, "goal": lane[0], "state": "advance", "t": 0.0, "fire_t": 1.0, "aim_t": 0.0, "kneel": false, "wave": wave})
	return true


func _down(e: Dictionary) -> void:
	e["state"] = "down"
	e["kneel"] = false
	e["a"].set_pose("down")
	if sfx:
		sfx.play("thud", clampf(1.0 - e["a"].xz().distance_to(Vector2(player.global_position.x, player.global_position.z)) / 90.0, 0.1, 0.7))


func _process(dt: float) -> void:
	# tüfek: geri tepme, nişan, doldurma
	cool = maxf(0.0, cool - dt)
	kick = maxf(0.0, kick - dt * 5.0)
	if flash.visible and cool < BOLT - 0.06:
		flash.visible = false
	if reload_t > 0.0:
		reload_t -= dt
		if reload_t <= 0.0:
			var n := mini(CLIP - clip, reserve)
			clip += n
			reserve -= n
			_hud()
	ads = lerpf(ads, 1.0 if (ads_on and equipped and reload_t <= 0.0) else 0.0, minf(1.0, dt * 10.0))
	if equipped:
		var low := clampf((RELOAD - absf(reload_t - RELOAD * 0.5) * 2.0) / 0.6, 0.0, 1.0) if reload_t > 0.0 else 0.0
		gun.position = Vector3(0.2 * (1.0 - ads), -0.2 * (1.0 - ads) - 0.112 * ads - low * 0.16 + sin(player.bob) * 0.006, -0.42 + 0.06 * ads + kick * 0.07)
		gun.rotation = Vector3(kick * 0.09 - low * 0.5, low * 0.5, 0)
		bolt.position.z = 0.1 + (0.07 if (cool > BOLT - 0.7 and cool < BOLT - 0.15) else 0.0)
	player.cam.fov = lerpf(player.base_fov, 46.0, ads if equipped else 0.0)
	for tr in tracers:
		if tr["t"] > 0.0:
			tr["t"] -= dt
			if tr["t"] <= 0.0:
				tr["m"].visible = false
	# sağlık: vurulmadan 6 sn geçince yavaşça toparlan
	since_hit += dt
	hurt_t = maxf(0.0, hurt_t - dt * 1.6)
	if hp > 0.0 and hp < 100.0 and since_hit > 6.0:
		hp = minf(100.0, hp + dt * 7.0)
	vig.color.a = clampf((100.0 - hp) / 100.0, 0.0, 1.0) * 0.5 + hurt_t * 0.3
	if not active or result != "":
		return
	var pp := player.global_position
	var p2 := Vector2(pp.x, pp.z)
	t += dt
	if cfg.has("on_tick"):
		cfg["on_tick"].call(t)
	# dalgalar
	var waves: Array = cfg["waves"]
	var alive := 0
	for e in enemies:
		if e["state"] != "down" and e["state"] != "gone":
			alive += 1
	if wave < 0 or (spawned >= _wave_n() and (alive == 0 or (_endless() and alive <= 2))):
		wave_t -= dt
		if wave_t <= 0.0:
			if wave + 1 >= waves.size() and not _endless():
				result = "won"
				return
			wave += 1
			spawned = 0
			spawn_t = 0.0
			wave_t = 2.5 if _endless() else 5.0
			# önceki dalganın askerleri havuza döner
			var keep := []
			for e in enemies:
				if e["wave"] < wave and (not _endless() or e["state"] == "down" or e["state"] == "gone"):
					npcs.set_hidden(e["a"], true)
				else:
					keep.append(e)
			enemies = keep
	elif spawned < _wave_n():
		spawn_t -= dt
		if spawn_t <= 0.0 and _spawn():
			spawned += 1
			spawn_t = waves[wave % waves.size()].get("gap", 2.5)
	if cfg.has("limit") and t > cfg["limit"]:
		result = "won"
		return
	# kayıp çoğalınca kalanlar çekilir
	if wave >= 0:
		var n: int = _wave_n()
		var up := []
		for e in enemies:
			if e["wave"] == wave and e["state"] != "down" and e["state"] != "gone":
				up.append(e)
		if not _endless() and spawned >= n and n >= 3 and up.size() <= int(floor(n * 0.34)):
			for e in up:
				e["state"] = "retreat"
				e["kneel"] = false
	var eye: float = 1.62 - player.crouch * 0.55
	var ups := []
	for al in allies:
		if not al["down"]:
			ups.append(al)
	for e in enemies:
		var a: Npc = e["a"]
		if e["state"] == "down" or e["state"] == "gone":
			continue
		var ap := a.global_position
		if e["state"] == "advance" or e["state"] == "retreat":
			var g: Vector2 = cfg["spawns"][0] if e["state"] == "retreat" else e["goal"]
			var dv := g - Vector2(ap.x, ap.z)
			var dl := dv.length()
			var sp := 4.2 if e["state"] == "retreat" else 3.3
			e["kneel"] = false
			if dl < 0.7:
				if e["state"] == "retreat":
					e["state"] = "gone"
					npcs.set_hidden(a, true)
					continue
				e["state"] = "cover"
				e["t"] = 2.0 + rng.randf() * 3.5
				e["fire_t"] = 0.6 + rng.randf() * 1.6
			else:
				var np := Vector2(ap.x, ap.z) + dv / dl * sp * dt
				a.global_position = Vector3(np.x, city.ground(np.x, np.y), np.y)
				a.global_rotation.y = atan2(dv.x, dv.y)
				a.set_pose("run")
			continue
		# siperde: çök, nişan al, ateş et
		e["kneel"] = true
		e["fire_t"] -= dt
		e["t"] -= dt
		a.set_pose("kneel")
		if e["fire_t"] <= 0.0:
			e["fire_t"] = (2.2 + rng.randf() * 2.0) * (0.6 if overrun else 1.0)
			var at_player: bool = hp > 0.0 and (ups.is_empty() or rng.randf() < cfg.get("target_bias", 0.6))
			var muzzle := ap + Vector3(0, 1.15, 0)
			if sfx:
				sfx.play("shot", clampf(1.1 - p2.distance_to(Vector2(ap.x, ap.z)) / 120.0, 0.15, 0.8), 0.92)
			if at_player:
				var d := p2.distance_to(Vector2(ap.x, ap.z))
				var target := pp + Vector3(0, eye, 0)
				if d < 150.0 and los(muzzle, target):
					a.face(p2)
					var pr := clampf(0.75 - d / 90.0, 0.08, 0.55) * cover_factor(p2, Vector2(ap.x, ap.z), player.crouch > 0.5)
					if _endless():
						pr *= 1.6 if overrun else 1.0 + minf(t / 120.0, 0.5)   # baskı zamanla artar
					if Vector2(player.velocity.x, player.velocity.z).length() > 4.0:
						pr *= 0.7
					var hit := rng.randf() < pr
					var miss := Vector3.ZERO if hit else Vector3((rng.randf() - 0.5) * 2.4, (rng.randf() - 0.2) * 1.6, (rng.randf() - 0.5) * 2.4)
					_tracer(muzzle, target + miss + (Vector3(0, -0.25, 0) if hit else Vector3.ZERO))
					if hit:
						damage(34.0)
			elif not ups.is_empty():
				var al: Dictionary = ups[rng.randi() % ups.size()]
				var b: Npc = al["a"]
				a.face(b.xz())
				_tracer(muzzle, b.global_position + Vector3(rng.randf() - 0.5, 1.1 + rng.randf() - 0.3, rng.randf() - 0.5))
				if not al["safe"] and rng.randf() < 0.07:
					al["hp"] -= 1
					if al["hp"] <= 0:
						al["down"] = true
						b.set_pose("down")
		if overrun and e["t"] <= 0.0 and e["ci"] >= e["lane"].size() - 1 and Vector2(ap.x, ap.z).distance_to(p2) > 9.0:
			# baskın: siperden çıkıp oyuncunun bulunduğu yere doğru sıçrar
			e["goal"] = Vector2(ap.x, ap.z).move_toward(p2, 14.0)
			e["state"] = "advance"
		if e["t"] <= 0.0 and e["ci"] < e["lane"].size() - 1:
			e["ci"] += 1
			e["goal"] = e["lane"][e["ci"]]
			e["state"] = "advance"
	# müttefikler
	for al in allies:
		if al["down"]:
			continue
		var b: Npc = al["a"]
		al["fire_t"] -= dt
		var tg = null
		var bd := 115.0
		for e in enemies:
			if e["state"] == "down" or e["state"] == "gone":
				continue
			var d2: float = e["a"].xz().distance_to(b.xz())
			if d2 < bd:
				bd = d2
				tg = e
		if tg != null:
			b.face(tg["a"].xz())
		if al["fire_t"] <= 0.0:
			al["fire_t"] = 3.0 + rng.randf() * 3.5
			if tg != null:
				var from := b.global_position + Vector3(0, 1.15, 0)
				var to: Vector3 = tg["a"].global_position + Vector3(0, 1.0, 0)
				if los(from, to):
					if sfx:
						sfx.play("shot", clampf(0.9 - p2.distance_to(b.xz()) / 60.0, 0.25, 0.7), 1.06)
					_tracer(from, to + Vector3(rng.randf() - 0.5, (rng.randf() - 0.5) * 0.8, rng.randf() - 0.5))
					if rng.randf() < clampf(0.09 - bd / 1500.0, 0.02, 0.07):
						_down(tg)
