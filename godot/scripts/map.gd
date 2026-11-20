class_name MapView
extends Control
## HARİTA — mini harita (sağ üst) ve M tuşuyla açılan tam ekran harita aynı veriyi kullanır: şehrin gerçek sokak geometrisi
## (pişirilmiş sokak parçaları), Alleben Deresi, anıtlar, hikâye yerleri, oyuncu, görev hedefleri ve yol ağı üzerinden
## hesaplanan rota (game.route). Coğrafya uydurulmaz; kırsal hikâye yerleri "varsayım" olarak etiketlenir.
##   Mini harita: oyuncuya göre döner (Ayarlar'dan "kuzey yukarıda" seçilebilir), 170 m yarıçap, alt şeritte kalan mesafe.
##   Tam ekran: fare tekeri yakınlaştırır, sol tuşla sürüklenir, sol tık hedef işareti koyar, sağ tık işareti kaldırır.

# Eskitilmiş kâğıt harita: şehrin tamamı, yapıların gerçek taban izleriyle bir kez dokuya çizilir (MapPainter);
# mini harita ve tam ekran harita aynı dokuyu kullanır.
const PAPER := Color(0.8, 0.72, 0.57)
const PAPER_D := Color(0.5, 0.42, 0.31)
const BUILD := Color(0.37, 0.29, 0.21)
const ROADC := Color(0.9, 0.84, 0.7)
const WATER := Color(0.42, 0.51, 0.53)
const INKD := Color(0.2, 0.14, 0.09)
const RED := Color(0.62, 0.17, 0.1)
const GOLD := Color(0.9, 0.72, 0.36)
const BACK := Color(0.2, 0.36, 0.52)
const INK := Color(0.94, 0.9, 0.8)
const DIM := Color(0.66, 0.63, 0.56)
const PX_PER_M := 0.74
static var paper_tex: Texture2D


## Kâğıt haritayı bir kez çizen yardımcı (SubViewport içinde çalışır)
class MapPainter extends Control:
	var city: City
	var rural: Dictionary
	var castle: Dictionary
	var k := 0.74
	var o := Vector2.ZERO
	func q(x: float, z: float) -> Vector2:
		return (Vector2(x, z) - o) * k
	func _draw() -> void:
		var rng := RandomNumberGenerator.new()
		rng.seed = 1918
		draw_rect(Rect2(Vector2.ZERO, size), Color(0.8, 0.72, 0.57))
		# kâğıt lekeleri
		for i in 260:
			draw_circle(Vector2(rng.randf() * size.x, rng.randf() * size.y), rng.randf_range(30.0, 150.0), Color(0.55, 0.45, 0.3, 0.035) if i % 2 else Color(0.95, 0.9, 0.76, 0.04))
		# tepeler: iç içe taramalı halkalar
		for h in rural.get("hills", []):
			for r in 4:
				draw_arc(q(h[0], h[1]), h[3] * k * (1.15 - r * 0.25), 0, TAU, 48, Color(0.42, 0.33, 0.22, 0.28), 1.5)
		for g in rural.get("gullies", []):
			var gp := PackedVector2Array()
			for v in g:
				gp.append(q(v[0], v[1]))
			draw_polyline(gp, Color(0.5, 0.42, 0.3, 0.6), 2.0)
		# dere
		var rv := PackedVector2Array()
		for v in city.data["river"]:
			rv.append(q(v[0], v[1]))
		draw_polyline(rv, Color(0.3, 0.38, 0.4), 13.0 * k + 3.0)
		draw_polyline(rv, Color(0.42, 0.51, 0.53), 13.0 * k)
		# sokaklar (açık), sonra yapılar (koyu): sokak dokusu yapıların arasında kendiliğinden belirir
		for s in city.data["segments"]:
			draw_line(q(s[0], s[1]), q(s[2], s[3]), Color(0.9, 0.84, 0.7), maxf(2.0, (s[4] + 3.0) * k))
		var n := 0
		for poly in city.footprints:
			if poly.size() < 3 or poly.size() > 24:
				continue
			var pts := PackedVector2Array()
			for v in poly:
				pts.append(q(v[0], v[1]))
			if Geometry2D.triangulate_polygon(pts).is_empty():
				continue
			draw_colored_polygon(pts, Color(0.37, 0.29, 0.21, 0.92))
			n += 1
		# kale: höyük (taramalı), üst düzlük ve sur
		if not castle.is_empty():
			var rx: float = castle["rx"] * k
			var rz: float = castle["rz"] * k
			var tk: float = castle["topK"]
			var pts2 := PackedVector2Array()
			var top := PackedVector2Array()
			for i in 49:
				var a := TAU * i / 48.0
				pts2.append(q(0, 0) + Vector2(cos(a) * rx, sin(a) * rz))
				top.append(q(0, 0) + Vector2(cos(a) * rx * tk, sin(a) * rz * tk))
			draw_colored_polygon(pts2, Color(0.62, 0.53, 0.38))
			for i in 48:
				draw_line(pts2[i], top[i], Color(0.36, 0.28, 0.19, 0.55), 1.0)
			draw_colored_polygon(top, Color(0.84, 0.77, 0.62))
			draw_polyline(top, Color(0.24, 0.17, 0.11), 3.0)
			for i in 12:
				var a2 := PI * 0.5 + TAU * (i + 0.5) / 12.0
				draw_circle(q(0, 0) + Vector2(cos(a2) * rx * tk, sin(a2) * rz * tk), 3.2, Color(0.24, 0.17, 0.11))
		print("HARITA_DOKUSU yapi=%d boyut=%s" % [n, str(size)])


static var north_up := false

var city: City
var player: CharacterBody3D
var game: Node
var mini := true
var seg_a := PackedVector2Array()
var seg_b := PackedVector2Array()
var seg_w := PackedFloat32Array()
var river := PackedVector2Array()
var marks: Array = []        # {p, name, kind}
var hero := PackedVector2Array()
var t := 0.0
var font: Font
var font_title: Font
var zoom := 1.0              # tam ekran: piksel / metre
var center := Vector2.ZERO   # tam ekran: haritanın ortasındaki dünya noktası
var follow := true
var drag := false
var moved := 0.0


func setup() -> void:
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_IGNORE if mini else Control.MOUSE_FILTER_STOP
	if font == null:
		font = ThemeDB.fallback_font
	if font_title == null:
		font_title = font
	for s in city.data["segments"]:
		seg_a.append(Vector2(s[0], s[1]))
		seg_b.append(Vector2(s[2], s[3]))
		seg_w.append(s[4])
	for p in city.data["river"]:
		river.append(Vector2(p[0], p[1]))
	for m in city.data["markers"]:
		marks.append({"p": Vector2(m["x"], m["z"]), "name": m["name"], "kind": "anit"})
	# hikâye yerleri (kırsal olanların konumu varsayımdır; bkz. game.gd _rural_sites)
	for q in [["k3", "Acar köyü (varsayım)", "koy"], ["k4", "Dokurcum Değirmeni (varsayım)", "koy"], ["k1", "Karabıyıklı (varsayım)", "savas"], ["k5", "Elmalı Köprüsü (varsayım)", "savas"], ["k3_goz", "Kertil pususu (varsayım)", "savas"], ["post", "Sarımsak Tepe (varsayım)", "savas"], ["b7_a", "Çınarlı siperi (varsayım)", "savas"], ["sargi", "Sağlık yeri", "yer"], ["meydan", "Meydan", "yer"]]:
		if game.pt.has(q[0]):
			marks.append({"p": game.pt[q[0]], "name": q[1], "kind": q[2]})
	var st: Node3D = game.street
	for z in [12.0, -20.0, -50.0, -80.0, -112.0]:
		hero.append(game.npcs.hp(st.cx(z), z))
	marks.append({"p": game.npcs.hp(st.cx(-50.0), -50.0), "name": "Çarşı sokağı", "kind": "yer"})


## Harita dokusunu (bir kez) hazırlar: şehrin tamamı görünmez bir çizim alanına çizilir
static func build_paper(host: Node, city: City) -> void:
	if paper_tex != null:
		return
	var b: Dictionary = city.data["config"]["bounds"]
	var vp := SubViewport.new()
	vp.size = Vector2i(int((b["maxX"] - b["minX"]) * PX_PER_M), int((b["maxZ"] - b["minZ"]) * PX_PER_M))
	vp.disable_3d = true
	vp.transparent_bg = false
	vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	host.add_child(vp)
	var mp := MapPainter.new()
	mp.city = city
	mp.rural = city.data.get("rural", {})
	mp.castle = city.data.get("castle", {})
	mp.k = PX_PER_M
	mp.o = Vector2(b["minX"], b["minZ"])
	mp.size = Vector2(vp.size)
	vp.add_child(mp)
	paper_tex = vp.get_texture()


## Tam ekran harita açılışı: bütün şehir ekrana sığacak şekilde
func open_full() -> void:
	follow = false
	var b: Dictionary = city.data["config"]["bounds"]
	var sz := size if size.x > 10.0 else get_viewport_rect().size
	zoom = clampf(minf(sz.x / (b["maxX"] - b["minX"]), (sz.y - 110.0) / (b["maxZ"] - b["minZ"])) * 1.9, 0.2, 5.0)
	center = Vector2(-120.0, 430.0)      # şehir dokusunun ortası


func _process(dt: float) -> void:
	if not visible:
		return
	t -= dt
	if t <= 0.0:
		t = 0.1 if mini else 0.03
		queue_redraw()


func _scale() -> float:
	return (size.x * 0.5) / 170.0 if mini else zoom


func _center() -> Vector2:
	if mini or follow:
		return Vector2(player.global_position.x, player.global_position.z)
	return center


func _rot() -> float:
	return player.yaw if (mini and not north_up) else 0.0


## dünya (x, z) -> ekran
func w2s(p: Vector2) -> Vector2:
	return size * 0.5 + ((p - _center()) * _scale()).rotated(_rot())


## ekran -> dünya (tam ekran harita)
func s2w(q: Vector2) -> Vector2:
	return _center() + (q - size * 0.5) / _scale()


func _gui_input(e: InputEvent) -> void:
	if mini:
		return
	if e is InputEventMouseButton:
		if e.button_index == MOUSE_BUTTON_WHEEL_UP and e.pressed:
			_zoom_at(e.position, 1.2)
		elif e.button_index == MOUSE_BUTTON_WHEEL_DOWN and e.pressed:
			_zoom_at(e.position, 1.0 / 1.2)
		elif e.button_index == MOUSE_BUTTON_LEFT:
			if e.pressed:
				drag = true
				moved = 0.0
			else:
				drag = false
				if moved < 6.0:
					game.set_waypoint(s2w(e.position))   # tık: hedef işareti
		elif e.button_index == MOUSE_BUTTON_RIGHT and e.pressed:
			game.set_waypoint(null)
	elif e is InputEventMouseMotion and drag:
		moved += e.relative.length()
		if moved >= 6.0:
			if follow:
				center = _center()
				follow = false
			center -= e.relative / zoom


func _zoom_at(at: Vector2, k: float) -> void:
	var before := s2w(at)
	if follow:
		center = _center()
		follow = false
	zoom = clampf(zoom * k, 0.2, 5.0)
	center += before - s2w(at)


func _poly(pts: PackedVector2Array, col: Color, w: float) -> void:
	var o := PackedVector2Array()
	for p in pts:
		o.append(w2s(p))
	if o.size() >= 2:
		draw_polyline(o, col, w)


func _txt_ink(pos: Vector2, s: String, sz: int, col: Color, f: Font = null) -> void:
	var ff: Font = f if f != null else font
	draw_string_outline(ff, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, sz, 4, Color(0.86, 0.79, 0.64, 0.85))
	draw_string(ff, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, sz, col)


func _draw() -> void:
	var c := _center()
	var sc := _scale()
	draw_rect(Rect2(Vector2.ZERO, size), PAPER_D)
	var b: Dictionary = city.data["config"]["bounds"]
	if paper_tex != null:
		draw_set_transform(size * 0.5, _rot(), Vector2(sc / PX_PER_M, sc / PX_PER_M))
		draw_texture(paper_tex, (Vector2(b["minX"], b["minZ"]) - c) * PX_PER_M)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	# rota: yol ağını izler. Kırmızı mürekkep = görev hedefi ya da işaret, mavi = dönüş yolu
	if game.route.size() >= 2:
		var rc: Color = BACK if game.route_kind == "donus" else RED
		_poly(game.route, Color(0.95, 0.9, 0.78, 0.9), 7.0 if not mini else 6.0)
		_poly(game.route, rc, 3.5 if not mini else 3.0)
	# anıtlar ve yerler
	for m in marks:
		var q: Vector2 = w2s(m["p"])
		if q.x < -60 or q.y < -20 or q.x > size.x + 60 or q.y > size.y + 20:
			continue
		var col := RED if m["kind"] == "savas" else (Color(0.25, 0.4, 0.22) if m["kind"] == "koy" else INKD)
		if m["kind"] == "savas":
			draw_line(q + Vector2(-5, -5), q + Vector2(5, 5), col, 2.5)
			draw_line(q + Vector2(-5, 5), q + Vector2(5, -5), col, 2.5)
		else:
			draw_circle(q, 5.0 if mini else 7.0, col)
			draw_circle(q, 2.6 if mini else 4.0, Color(0.93, 0.87, 0.72))
			draw_circle(q, 1.2 if mini else 1.8, col)
		if not mini and (zoom > 0.7 or m["kind"] == "anit"):
			_txt_ink(q + Vector2(11, 5), m["name"], 14 if m["kind"] == "anit" else 12, INKD, font_title if m["kind"] == "anit" else font)
	# hedefler (harita dışındaysa kenarda)
	var pad := Vector2(16, 16)
	for tg in game.targets():
		var q2: Vector2 = w2s(Vector2(tg["p"].x, tg["p"].z)).clamp(pad, size - pad)
		_diamond(q2, GOLD)
		if not mini and tg.get("label", "") != "":
			_txt_ink(q2 + Vector2(13, 5), tg["label"], 14, RED, font_title)
	if game.waypoint != null:
		var q3: Vector2 = w2s(game.waypoint).clamp(pad, size - pad)
		draw_line(q3, q3 + Vector2(0, -16), INKD, 2.0)
		draw_colored_polygon(PackedVector2Array([q3 + Vector2(0, -16), q3 + Vector2(11, -12), q3 + Vector2(0, -8)]), RED)
	# oyuncu oku: krem kenarlı kırmızı ok
	var pp := w2s(Vector2(player.global_position.x, player.global_position.z))
	var f := Vector2(-sin(player.yaw), -cos(player.yaw)).rotated(_rot())
	var r := Vector2(-f.y, f.x)
	draw_colored_polygon(PackedVector2Array([pp + f * 12.5, pp - f * 8.5 + r * 8.5, pp - f * 3.5, pp - f * 8.5 - r * 8.5]), Color(0.96, 0.92, 0.8))
	draw_colored_polygon(PackedVector2Array([pp + f * 9.5, pp - f * 6.0 + r * 6.0, pp - f * 2.5, pp - f * 6.0 - r * 6.0]), RED)
	if mini:
		# kenarlarda kâğıdın koyulaşması + kuzey işareti + mesafe şeridi
		var north := Vector2(0, -1).rotated(_rot())
		var np := size * 0.5 + north * (size.x * 0.5 - 15.0)
		draw_circle(np, 9.5, Color(0.16, 0.11, 0.07, 0.92))
		draw_string(font, np - Vector2(4, -4), "K", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, INK)
		if game.route_len > 0.0:
			draw_rect(Rect2(0, size.y - 26, size.x, 26), Color(0.12, 0.085, 0.055, 0.88))
			var kind := "DÖNÜŞ" if game.route_kind == "donus" else ("İŞARET" if game.route_kind == "isaret" else "HEDEF")
			_diamond(Vector2(20, size.y - 13), GOLD)
			draw_string(font, Vector2(34, size.y - 9), kind, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, DIM)
			draw_string(font, Vector2(0, size.y - 8), "%d m" % int(game.route_len), HORIZONTAL_ALIGNMENT_RIGHT, size.x - 18, 14, INK)
		return
	# ---------------- tam ekran: kenarlarda kâğıdın sönmesi, başlık, bilgi paneli, açıklama, ölçek, tuş satırı
	for e in 26:
		var al := 0.022 * (26 - e)
		var w := 5.0
		draw_rect(Rect2(e * w, 0, w, size.y), Color(0.2, 0.14, 0.08, al))
		draw_rect(Rect2(size.x - (e + 1) * w, 0, w, size.y), Color(0.2, 0.14, 0.08, al))
		draw_rect(Rect2(0, e * w, size.x, w), Color(0.2, 0.14, 0.08, al))
		draw_rect(Rect2(0, size.y - (e + 1) * w, size.x, w), Color(0.2, 0.14, 0.08, al))
	draw_string_outline(font_title, Vector2(34, 46), "GAZİANTEP", HORIZONTAL_ALIGNMENT_LEFT, -1, 34, 6, Color(0.86, 0.79, 0.64, 0.7))
	draw_string(font_title, Vector2(34, 46), "GAZİANTEP", HORIZONTAL_ALIGNMENT_LEFT, -1, 34, INKD)
	_txt_ink(Vector2(37, 68), String(game.ui.donem.text).replace("GAZİANTEP   ·   ", "") + "   ·   " + String(game.ui.date.text), 12, RED)
	# bilgi paneli (sağ): etkin görev, hedefe kalan yol, haritadaki yer sayıları — hepsi oyunun kendi verisi
	var pw := 290.0
	var px := size.x - pw - 30.0
	var py := 96.0
	var anit := 0
	var yer := 0
	for m2 in marks:
		if m2["kind"] == "anit":
			anit += 1
		else:
			yer += 1
	var rows := [["Tarih", String(game.ui.date.text)], ["Hedefe kalan yol", ("%d m" % int(game.route_len)) if game.route_len > 0.0 else "—"], ["Anıt ve yapı", str(anit)], ["Hikâye yeri", str(yer)], ["Tanıdık", str(game.met.size())]]
	var ph := 132.0 + rows.size() * 24.0
	draw_rect(Rect2(px, py, pw, ph), Color(0.12, 0.09, 0.065, 0.93))
	draw_rect(Rect2(px + 5, py + 5, pw - 10, ph - 10), Color(GOLD, 0.45), false, 1.0)
	draw_string(font, Vector2(px + 20, py + 30), "ETKİN GÖREV", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, GOLD)
	draw_string(font_title, Vector2(px + 20, py + 56), String(game.ui.title.text), HORIZONTAL_ALIGNMENT_LEFT, pw - 40, 20, INK)
	draw_multiline_string(font, Vector2(px + 20, py + 78), String(game.objective), HORIZONTAL_ALIGNMENT_LEFT, pw - 40, 12, 2, DIM)
	draw_line(Vector2(px + 20, py + 112), Vector2(px + pw - 20, py + 112), Color(GOLD, 0.4), 1.0)
	for i in rows.size():
		var ry := py + 136.0 + i * 24.0
		draw_string(font, Vector2(px + 20, ry), rows[i][0], HORIZONTAL_ALIGNMENT_LEFT, -1, 13, DIM)
		draw_string(font, Vector2(px + 20, ry), rows[i][1], HORIZONTAL_ALIGNMENT_RIGHT, pw - 40, 13, INK)
	# açıklama (sol alt)
	var leg := [["Hedef", GOLD, "d"], ["İşaret", RED, "f"], ["Anıt / yapı", INKD, "c"], ["Köy", Color(0.25, 0.4, 0.22), "c"], ["Çatışma yeri", RED, "x"]]
	var ly := size.y - 62.0 - leg.size() * 21.0
	draw_rect(Rect2(28, ly - 16, 170, leg.size() * 21.0 + 20), Color(0.12, 0.09, 0.065, 0.9))
	for i in leg.size():
		var q4 := Vector2(46, ly + i * 21.0 + 4)
		if leg[i][2] == "d":
			_diamond(q4, leg[i][1])
		elif leg[i][2] == "x":
			draw_line(q4 + Vector2(-4, -4), q4 + Vector2(4, 4), leg[i][1], 2.5)
			draw_line(q4 + Vector2(-4, 4), q4 + Vector2(4, -4), leg[i][1], 2.5)
		elif leg[i][2] == "f":
			draw_line(q4 + Vector2(-3, 6), q4 + Vector2(-3, -7), INK, 2.0)
			draw_colored_polygon(PackedVector2Array([q4 + Vector2(-3, -7), q4 + Vector2(6, -4), q4 + Vector2(-3, -1)]), leg[i][1])
		else:
			draw_circle(q4, 5.0, Color(0.93, 0.87, 0.72))
			draw_circle(q4, 3.0, leg[i][1])
		draw_string(font, q4 + Vector2(18, 5), leg[i][0], HORIZONTAL_ALIGNMENT_LEFT, -1, 12, INK)
	# ölçek çubuğu
	var metres := 1000.0
	for cand in [50.0, 100.0, 250.0, 500.0, 1000.0]:
		if cand * zoom >= 80.0:
			metres = cand
			break
	var sx := size.x - 46.0 - metres * zoom
	draw_line(Vector2(sx, size.y - 56), Vector2(size.x - 46, size.y - 56), INKD, 2.5)
	for ex in [sx, size.x - 46.0]:
		draw_line(Vector2(ex, size.y - 62), Vector2(ex, size.y - 50), INKD, 2.5)
	_txt_ink(Vector2(sx, size.y - 66), "%d m" % int(metres), 12, INKD)
	# tuş satırı
	draw_rect(Rect2(0, size.y - 34, size.x, 34), Color(0.12, 0.09, 0.065, 0.92))
	var info := "M  Kapat          TEKER  Yakınlaştır          SÜRÜKLE  Kaydır          TIK  İşaret koy          SAĞ TIK  İşareti kaldır"
	draw_string(font, Vector2(34, size.y - 13), info, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, INK)


func _diamond(q: Vector2, col: Color) -> void:
	draw_colored_polygon(PackedVector2Array([q + Vector2(0, -9), q + Vector2(9, 0), q + Vector2(0, 9), q + Vector2(-9, 0)]), Color(0.16, 0.1, 0.06))
	draw_colored_polygon(PackedVector2Array([q + Vector2(0, -6), q + Vector2(6, 0), q + Vector2(0, 6), q + Vector2(-6, 0)]), col)
