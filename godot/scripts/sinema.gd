class_name Sinema
extends Node3D
## Aşama 13 — bölüm açılışı kamera geçişi.
## Bir bölüm yeni bir yerde başlarken kamera şehrin üstünden (yüksek, uzak) başlar, yerin üstüne süzülür ve
## oyuncunun göz hizasına iner; son karede oyuncu kamerasıyla aynı yere ve yöne bakar, kontrol oyuncuya geçer.
## Üst ve alt siyah şeritler (sinema çerçevesi) geçiş boyunca görünür. Herhangi bir tuş ya da tık geçişi atlar.
## Otomatik sınamada (--autoplay), ölçümde (--bench) ve görüntü almada (--at) çalışmaz.
## Yol: Bezier eğrisi. Son bölüm yerin hemen üstünden dikine iner: sokak duvarlarının içinden geçmemek için.

const SURE := 6.5
const BAR := 0.11            # şerit yüksekliği (ekran oranı)

var player: CharacterBody3D
var city: City
var cam: Camera3D
var bars: Array = []
var t := -1.0
var p0 := Vector3.ZERO
var p1 := Vector3.ZERO
var p2 := Vector3.ZERO
var p3 := Vector3.ZERO
var look0 := Vector3.ZERO
var look1 := Vector3.ZERO
var fov0 := 50.0
var bar_a := 0.0
var kare_dir := ""          # --sinema-kare <klasör>: geçişten kareler kaydedilir, sonra oyun kapanır (denetim)
var kare_i := 0
const KARE_AN := [0.3, 1.6, 3.0, 4.2, 5.3, 6.2]


func setup(ui_root: Control) -> void:
	var args := OS.get_cmdline_user_args()
	var i := args.find("--sinema-kare")
	if i >= 0 and i + 1 < args.size():
		kare_dir = args[i + 1]
		DirAccess.make_dir_recursive_absolute(kare_dir)
	cam = Camera3D.new()
	cam.near = 0.1
	cam.far = 2500.0
	add_child(cam)
	for top in [true, false]:
		var r := ColorRect.new()
		r.color = Color(0, 0, 0, 1)
		r.mouse_filter = Control.MOUSE_FILTER_IGNORE
		r.anchor_left = 0.0
		r.anchor_right = 1.0
		r.anchor_top = 0.0 if top else 1.0 - BAR
		r.anchor_bottom = BAR if top else 1.0
		r.modulate.a = 0.0
		ui_root.add_child(r)
		bars.append(r)


func active() -> bool:
	return t >= 0.0


## p: oyuncunun varacağı yer (x, z), yaw: bakış yönü
func play(p: Vector2, yaw: float) -> void:
	var gy := city.ground(p.x, p.y) if city else 0.0
	var eye := Vector3(p.x, gy + 1.62, p.y)
	var fwd := Vector3(-sin(yaw), 0.0, -cos(yaw))            # oyuncunun önü (Godot: -Z)
	var side := Vector3(fwd.z, 0.0, -fwd.x)
	# başlangıç: arkadan ve yandan, yüksekte (şehrin dokusu ve kale görünsün)
	p0 = eye - fwd * 95.0 + side * 55.0 + Vector3.UP * 62.0
	p1 = eye - fwd * 40.0 + side * 18.0 + Vector3.UP * 34.0
	p2 = eye - fwd * 3.0 + Vector3.UP * 14.0                  # yerin üstü: buradan dikine iner
	p3 = eye
	look0 = eye + fwd * 25.0
	look1 = eye + fwd * 30.0
	fov0 = 50.0
	cam.global_position = p0
	cam.look_at(look0, Vector3.UP)
	cam.fov = fov0
	cam.make_current()
	player.enabled = false
	t = 0.0


func _bez(a: float) -> Vector3:
	var b := 1.0 - a
	return p0 * b * b * b + p1 * 3.0 * b * b * a + p2 * 3.0 * b * a * a + p3 * a * a * a


func _process(dt: float) -> void:
	var want := 1.0 if t >= 0.0 else 0.0
	bar_a = move_toward(bar_a, want, dt * 2.5)
	for r in bars:
		r.modulate.a = bar_a
	if t < 0.0:
		return
	# menü ya da açılış ekranı açıkken geçiş başlamaz (başlangıç karesinde bekler); kapanınca oynar
	var m = get_parent().get("menu")
	if m != null and m.is_open():
		if kare_dir != "":
			m.close_all()        # denetim kipi: açılış ekranını kendiliğinden geç
		return
	if not cam.current:
		cam.make_current()
	player.enabled = false   # menü kapanırken oyuncu açılır; geçiş bitene kadar kapalı kalsın
	_gostergeler(false)      # küçük harita, görev satırı, üst çubuk geçişte gizli; bölüm kartı görünür kalır
	t += dt
	var a := clampf(t / SURE, 0.0, 1.0)
	var e := a * a * (3.0 - 2.0 * a)                           # yumuşak başla, yumuşak dur
	var pos := _bez(e)
	var floor_y := (city.ground(pos.x, pos.z) + 1.4) if city else -INF
	pos.y = maxf(pos.y, floor_y)
	cam.global_position = pos
	var target := look0.lerp(look1, e)
	target.y = lerpf(look0.y - 9.0, p3.y, minf(1.0, e * 1.4))   # önce aşağı, sona doğru göz hizasına bakar
	if pos.distance_to(target) > 0.05:
		cam.look_at(target, Vector3.UP)
	cam.fov = lerpf(fov0, player.base_fov if "base_fov" in player else 72.0, e)
	if kare_dir != "" and kare_i < KARE_AN.size() and t >= KARE_AN[kare_i]:
		get_viewport().get_texture().get_image().save_png("%s/sinema_%d.png" % [kare_dir, kare_i])
		kare_i += 1
	if a >= 1.0:
		finish()


func finish() -> void:
	if t < 0.0:
		return
	t = -1.0
	player.enabled = true
	player.cam.make_current()
	_gostergeler(true)
	if kare_dir != "":
		get_tree().quit()


func _unhandled_input(e: InputEvent) -> void:
	if t < 0.3:
		return
	if (e is InputEventKey and e.pressed and not e.echo) or (e is InputEventMouseButton and e.pressed):
		finish()
		get_viewport().set_input_as_handled()


func _gostergeler(on: bool) -> void:
	var g = get_parent()
	var ui = g.get("ui")
	if ui is Dictionary and ui.has("play"):
		ui["play"].visible = on
	var m = g.get("menu")
	if m != null and m.get("bar") != null:
		m.bar.visible = on
