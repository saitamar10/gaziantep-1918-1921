class_name Menu
extends Control
## ÜST MENÜ VE PENCERELER — giriş ekranı, üstteki düğmeler (Günlük · Harita · Ayarlar), günlük (kronoloji, bölüm seçimi,
## Tanıdıklar) ve ayarlar. Bir pencere açıkken fare serbesttir ve oyuncu hareket etmez; kapanınca fare yeniden kilitlenir.

const GOLD := Color(0.85, 0.71, 0.42)
const INK := Color(0.96, 0.91, 0.8)
const DIM := Color(0.8, 0.73, 0.58)
## Günlükte her gün için kısa açıklama. Tarihî dayanak ve kurgu ayrımı: antep/docs/hikaye-ana-dosya.md
const OZET := {
	"a": "Çarşı açık, sokak kalabalık. Bir dükkân çırağı olarak şehri tanırsın; aynı gün İngiliz birlikleri şehre girer.",
	"b": "Fransız kuvvetleri İngilizlerin yerini alır. Çırak, şehrin ileri gelenleri arasında gizlice haber taşımaya başlar.",
	"c": "Cemiyet-i İslamiye'nin çağrısıyla halk işgale karşı meydanda toplanır.",
	"heyet": "Heyet-i Merkeziye evlerde gizlice toplanır: yirmi yedi semt, her semtten yüz kişi, yedi komisyon.",
	"k1": "Karabıyıklı'da Fransız koluna baskın. Karayılan (Molla Mehmet) öne çıkar.",
	"k2": "Yerel anlatı: on dört yaşındaki Mehmet Kâmil, annesine uzanan askerlere karşı çıkar ve öldürülür. Tanıklık sahnesidir.",
	"k3": "Şahin Bey Kilis–Antep yolunu kapatır. 3 Şubat: Kertil'de ikmal koluna saldırı.",
	"k4": "Anlatı: Şahin Bey'in kuvvetlerine yiyecek götüren on dört çocuk dönüşte değirmende öldürülür. Hafıza sahnesidir.",
	"k5": "Şahin Bey'in son çatışması ve şehadeti. Tarih kaynaklarda 28 ya da 29 Mart'tır.",
	"b1": "Savaş şehrin içine taşınır. Barikatlar kurulur, yaralılar taşınır, gizli geçitler öğrenilir.",
	"b2": "Tepeler için çatışma. Sarımsak Tepe'de Karayılan şehit düşer; şehir bombardıman altındadır.",
	"b3": "30 Mayıs'ta kısa bir ateşkes. Yaralar sarılır; Haziran'da çatışmalar yeniden başlar.",
	"b4": "Mahalleler nöbettedir: gece nöbeti, taş ve kereste, sağlık ekibi, haber zinciri. (Tarih yaklaşık.)",
	"b5": "8 Ağustos: Özdemir Bey komutayı alır. 13 Ağustos: teslim talebi halkın önünde görüşülür; cevap bayraktır.",
	"b6": "9–10 Eylül ağır bombardımanı. Enkazdan insan çıkarılır; yardım mektubu gece şehirden çıkarılır.",
	"b7": "5 ve 14 Ekim: Çınarlı çevresinde çatışmalar. Savaş evlerin arasındadır.",
	"b8": "21 Kasım: takviyelerle kuşatma sıkılaşır. 28 Kasım: tayın yarıya iner.",
	"b9": "Erzak tükenmek üzeredir. Ekmek dağıtılır, boş kovanlar toplanır, haber güvercinle gider. (Tarih yaklaşık.)",
	"b10": "Kar, soğuk ve açlık. Acı zerdali çekirdeği una karıştırılır; zehirlenmeler olur. Beklenen yardım gelmez.",
	"b11": "5–7 Şubat: şehirden çıkış girişimi. 8–9 Şubat: teslim görüşmesi ve protokol.",
	"ep": "İşgal altındaki şehir, 20 Ekim 1921 Ankara Antlaşması ve 25 Aralık 1921'de son Fransız askerlerinin ayrılışı.",
}

var game: Node
var world: Node3D
var player: CharacterBody3D
var bar: HBoxContainer
var tabs := {}
var f_title: Font
var journal: PanelContainer
var settings: PanelContainer
var intro: ColorRect
var j_buttons: Array = []
var j_text: RichTextLabel
var j_met: RichTextLabel
var j_go: Button
var j_sel := 0


func _box(bg: Color, border := true) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	# büyük paneller: antrasit zemin, ince altın kenar, hafif gölge (eski kahverengi kutu yerine)
	sb.bg_color = Color(0.04, 0.042, 0.047, maxf(bg.a, 0.9))
	if border:
		sb.border_color = Color(GOLD, 0.4)
		sb.set_border_width_all(1)
		sb.shadow_color = Color(0, 0, 0, 0.5)
		sb.shadow_size = 14
	sb.set_corner_radius_all(4)
	sb.set_content_margin_all(22)
	return sb


## Liste satırı / düğme: çerçevesiz; altında ince ayraç, üzerine gelince solda altın çizgi ve koyu zemin
func _row_box(state: String) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(1, 1, 1, 0.0 if state == "normal" else (0.06 if state == "hover" else 0.1))
	sb.border_color = Color(GOLD, 0.95) if state != "normal" else Color(1, 1, 1, 0.09)
	if state == "normal":
		sb.border_width_bottom = 1
	else:
		sb.border_width_left = 2
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


func _button(text: String, size := 16) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", size - 1)
	b.add_theme_color_override("font_color", INK)
	b.add_theme_color_override("font_hover_color", GOLD)
	for st in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(st, _row_box(st))
	return b


func _label(text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


## Sekme simgesi: çizgilerle çizilir (yazı tipinde bulunmayan simgelere bağlı kalmamak için)
class Glyph extends Control:
	var kind := ""
	var col := Color(0.85, 0.71, 0.42)
	func _draw() -> void:
		var c := size * 0.5
		if kind == "journal":
			draw_rect(Rect2(c + Vector2(-6, -7), Vector2(12, 14)), col, false, 1.5)
			draw_line(c + Vector2(-2, -7), c + Vector2(-2, 7), col, 1.5)
			for y in [-3.0, 0.0, 3.0]:
				draw_line(c + Vector2(1, y), c + Vector2(4, y), col, 1.0)
		elif kind == "map":
			draw_polyline(PackedVector2Array([c + Vector2(-7, -5), c + Vector2(-2, -7), c + Vector2(2, -5), c + Vector2(7, -7), c + Vector2(7, 5), c + Vector2(2, 7), c + Vector2(-2, 5), c + Vector2(-7, 7), c + Vector2(-7, -5)]), col, 1.5)
			draw_line(c + Vector2(-2, -7), c + Vector2(-2, 5), col, 1.0)
			draw_line(c + Vector2(2, -5), c + Vector2(2, 7), col, 1.0)
		else:
			draw_arc(c, 4.0, 0, TAU, 20, col, 1.5)
			for i in 8:
				var d := Vector2.from_angle(TAU * i / 8.0)
				draw_line(c + d * 5.5, c + d * 8.0, col, 1.8)


func _tab_box(state: String, active: bool) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.03, 0.035, 0.34 if (state == "normal" and not active) else 0.66)
	sb.border_color = Color(GOLD, 1.0) if (active or state != "normal") else Color(INK, 0.45)
	sb.border_width_bottom = 2 if active else 1
	sb.content_margin_left = 34
	sb.content_margin_right = 12
	sb.content_margin_top = 7
	sb.content_margin_bottom = 8
	return sb


## Sağ üst sekme: çizgi simge + ad + kısayol. Zemin saydamdır; üzerine gelince koyulaşır, açık olan sekmenin altı altın çizgidir.
func _tab(kind: String, text: String, key: String, f: Callable) -> void:
	var b := Button.new()
	b.text = "%s    %s" % [text.to_upper(), key]
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", 12)
	b.add_theme_color_override("font_color", INK)
	b.add_theme_color_override("font_hover_color", GOLD)
	b.add_theme_color_override("font_pressed_color", GOLD)
	b.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.5))
	b.add_theme_constant_override("outline_size", 3)
	var gl := Glyph.new()
	gl.kind = kind
	gl.col = INK
	gl.custom_minimum_size = Vector2(18, 18)
	gl.size = Vector2(18, 18)
	gl.position = Vector2(9, 6)
	gl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(gl)
	b.mouse_entered.connect(func() -> void:
		gl.col = GOLD
		gl.queue_redraw()
		create_tween().tween_property(gl, "position:y", 4.0, 0.12))
	b.mouse_exited.connect(func() -> void:
		gl.col = GOLD if tabs[kind]["on"] else INK
		gl.queue_redraw()
		create_tween().tween_property(gl, "position:y", 6.0, 0.16))
	b.pressed.connect(f)
	bar.add_child(b)
	tabs[kind] = {"b": b, "g": gl, "on": false}
	_tab_style(kind)


func _tab_style(kind: String) -> void:
	var t: Dictionary = tabs[kind]
	for st in ["normal", "hover", "pressed"]:
		t["b"].add_theme_stylebox_override(st, _tab_box(st, t["on"]))
	t["b"].add_theme_color_override("font_color", GOLD if t["on"] else INK)
	t["g"].col = GOLD if t["on"] else INK
	t["g"].queue_redraw()


## Açık olan bölümün sekmesini işaretler: "journal" | "map" | "gear" | "" (hiçbiri)
func set_active(kind: String) -> void:
	for k in tabs:
		tabs[k]["on"] = k == kind
		_tab_style(k)


func setup() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	# ---- üst düğmeler
	bar = HBoxContainer.new()
	bar.add_theme_constant_override("separation", 8)
	add_child(bar)
	bar.add_theme_constant_override("separation", 4)
	_tab("journal", "Günlük", "J", func() -> void: toggle("journal"))
	_tab("map", "Harita", "M", func() -> void: game.toggle_map())
	_tab("gear", "Ayarlar", "O", func() -> void: toggle("settings"))
	bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	bar.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	bar.offset_left = -18
	bar.offset_right = -18
	bar.offset_top = 12
	bar.offset_bottom = 12
	_journal()
	_settings()
	_intro()


# ---------------------------------------------------------------- günlük
const P_INK := Color(0.2, 0.14, 0.09)
const P_RED := Color(0.55, 0.14, 0.09)
const P_DIM := Color(0.42, 0.33, 0.24)


## Kâğıt sayfa: krem zemin, koyu kahve çerçeve, gölge; üstüne ince kâğıt dokusu
func _page() -> PanelContainer:
	var pg := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.87, 0.81, 0.67)
	sb.border_color = Color(0.3, 0.21, 0.13)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(3)
	sb.shadow_color = Color(0, 0, 0, 0.55)
	sb.shadow_size = 16
	sb.content_margin_left = 34
	sb.content_margin_right = 34
	sb.content_margin_top = 28
	sb.content_margin_bottom = 26
	pg.add_theme_stylebox_override("panel", sb)
	pg.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pg.size_flags_vertical = Control.SIZE_EXPAND_FILL
	return pg


func _ink(text: String, size: int, color: Color, serif := false) -> Label:
	var l := _label(text, size, color)
	if serif and f_title != null:
		l.add_theme_font_override("font", f_title)
	return l


func _line(parent: Control, col: Color) -> void:
	var r := ColorRect.new()
	r.color = col
	r.custom_minimum_size = Vector2(0, 1)
	parent.add_child(r)


func _page_row(selected: bool, hover: bool) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.8, 0.62, 0.24, 0.62) if selected else (Color(0.3, 0.2, 0.1, 0.1) if hover else Color(0, 0, 0, 0))
	sb.border_color = Color(0.3, 0.21, 0.13, 0.22)
	sb.border_width_bottom = 0 if selected else 1
	sb.content_margin_left = 12
	sb.content_margin_right = 10
	sb.content_margin_top = 7
	sb.content_margin_bottom = 7
	return sb


func _journal() -> void:
	# günlük: açık bir kitabın iki sayfası. Sol: günlerin listesi; sağ: seçilen günün sayfası.
	journal = PanelContainer.new()
	var back := StyleBoxFlat.new()
	back.bg_color = Color(0.03, 0.025, 0.02, 0.82)
	back.content_margin_left = 90
	back.content_margin_right = 90
	back.content_margin_top = 70
	back.content_margin_bottom = 46
	journal.add_theme_stylebox_override("panel", back)
	add_child(journal)
	journal.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	journal.add_child(h)
	# ---- sol sayfa
	var lp := _page()
	h.add_child(lp)
	var lv := VBoxContainer.new()
	lv.add_theme_constant_override("separation", 6)
	lp.add_child(lv)
	lv.add_child(_ink("Günlük", 34, P_RED, true))
	lv.add_child(_ink("BİR ŞEHRİN 11 AYI   ·   1918 – 1921", 11, P_DIM))
	_line(lv, Color(0.3, 0.21, 0.13, 0.6))
	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	lv.add_child(sc)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 0)
	sc.add_child(list)
	for i in game.ORDER.size():
		var k: String = game.ORDER[i]
		var b := Button.new()
		b.text = "%s      %s" % [game.META[k]["tarih"], game.META[k]["ad"]]
		b.focus_mode = Control.FOCUS_NONE
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.clip_text = true
		b.add_theme_font_size_override("font_size", 14)
		if f_title != null:
			b.add_theme_font_override("font", f_title)
		for st in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
			b.add_theme_color_override(st, P_INK)
		b.pressed.connect(_select.bind(i))
		list.add_child(b)
		j_buttons.append(b)
	_line(lv, Color(0.3, 0.21, 0.13, 0.6))
	lv.add_child(_ink("J  ya da  Esc  ·  kapat", 11, P_DIM))
	# ---- sağ sayfa
	var rp := _page()
	h.add_child(rp)
	var right := VBoxContainer.new()
	right.add_theme_constant_override("separation", 8)
	rp.add_child(right)
	j_text = RichTextLabel.new()
	j_text.bbcode_enabled = true
	j_text.fit_content = true
	j_text.custom_minimum_size = Vector2(360, 0)
	j_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	j_text.add_theme_font_size_override("normal_font_size", 16)
	j_text.add_theme_color_override("default_color", P_INK)
	if f_title != null:
		j_text.add_theme_font_override("normal_font", f_title)
	right.add_child(j_text)
	j_go = Button.new()
	j_go.text = "Bu güne geç"
	j_go.focus_mode = Control.FOCUS_NONE
	j_go.add_theme_font_size_override("font_size", 14)
	for st in ["normal", "hover", "pressed"]:
		var gb := StyleBoxFlat.new()
		gb.bg_color = Color(0.3, 0.21, 0.13) if st == "normal" else Color(0.55, 0.14, 0.09)
		gb.set_corner_radius_all(2)
		gb.content_margin_left = 16
		gb.content_margin_right = 16
		gb.content_margin_top = 7
		gb.content_margin_bottom = 8
		j_go.add_theme_stylebox_override(st, gb)
	j_go.add_theme_color_override("font_color", Color(0.93, 0.88, 0.74))
	j_go.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	j_go.pressed.connect(func() -> void:
		close_all()
		game.set_chapter(game.ORDER[j_sel]))
	right.add_child(j_go)
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(0, 6)
	right.add_child(sp)
	right.add_child(_ink("Tanıdıklar", 20, P_RED, true))
	_line(right, Color(0.3, 0.21, 0.13, 0.6))
	var ms := ScrollContainer.new()
	ms.size_flags_vertical = Control.SIZE_EXPAND_FILL
	ms.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	right.add_child(ms)
	j_met = RichTextLabel.new()
	j_met.fit_content = true
	j_met.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	j_met.add_theme_font_size_override("normal_font_size", 14)
	j_met.add_theme_color_override("default_color", P_DIM)
	ms.add_child(j_met)
	journal.visible = false


func _select(i: int) -> void:
	j_sel = i
	var k: String = game.ORDER[i]
	for n in j_buttons.size():
		var here: bool = game.ORDER[n] == game.ch
		j_buttons[n].add_theme_stylebox_override("normal", _page_row(n == i, false))
		j_buttons[n].add_theme_stylebox_override("hover", _page_row(n == i, true))
		j_buttons[n].add_theme_stylebox_override("pressed", _page_row(true, false))
		for st in ["font_color", "font_hover_color", "font_pressed_color"]:
			j_buttons[n].add_theme_color_override(st, P_RED if here else P_INK)
	var sabit: String = game.SABIT.get(k, "")
	var cur: String = ("\n\n[color=#3a5a2a]Şimdiki görev:[/color] " + String(game.objective)) if (k == game.ch and String(game.objective) != "") else ""
	j_text.text = "[color=#6b5540][font_size=12]%s%s[/font_size][/color]\n\n[color=#8c2417][font_size=28]%s[/font_size][/color]\n[color=#8a6a3a]———  ◆  ———[/color]\n\n%s%s%s" % [String(game.META[k]["tarih"]).to_upper(), "      ·      ŞU AN BURADASIN" if k == game.ch else "", game.META[k]["ad"], OZET.get(k, ""), cur,
		("\n\n[color=#8c2417]Değişmeyen tarihî sonuç[/color]\n" + sabit) if sabit != "" else ""]
	j_go.visible = k != game.ch
	var names: Array = game.met.keys()
	j_met.text = "Henüz kimseyle konuşmadın. (E ile konuş)" if names.is_empty() else "\n".join(PackedStringArray(names))


# ---------------------------------------------------------------- ayarlar
func _row(parent: Control, text: String, c: Control) -> void:
	var h := HBoxContainer.new()
	var l := _ink(text, 16, P_INK, true)
	l.custom_minimum_size = Vector2(250, 0)
	h.add_child(l)
	c.custom_minimum_size = Vector2(280, 28)
	h.add_child(c)
	parent.add_child(h)
	_line(parent, Color(0.3, 0.21, 0.13, 0.18))


func _slider(lo: float, hi: float, val: float, step: float, f: Callable) -> HSlider:
	var s := HSlider.new()
	s.min_value = lo
	s.max_value = hi
	s.step = step
	s.value = val
	s.focus_mode = Control.FOCUS_NONE
	# kâğıt üstünde okunsun: koyu kahve ray, kırmızı mürekkep dolgu
	var tr := StyleBoxFlat.new()
	tr.bg_color = Color(0.3, 0.21, 0.13, 0.35)
	tr.content_margin_top = 2
	tr.content_margin_bottom = 2
	var fl := StyleBoxFlat.new()
	fl.bg_color = Color(0.55, 0.14, 0.09)
	fl.content_margin_top = 2
	fl.content_margin_bottom = 2
	s.add_theme_stylebox_override("slider", tr)
	s.add_theme_stylebox_override("grabber_area", fl)
	s.add_theme_stylebox_override("grabber_area_highlight", fl)
	s.value_changed.connect(f)
	return s


## Kâğıt üstündeki koyu düğme (kitap sayfalarında)
func _ink_button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", 14)
	for st in ["normal", "hover", "pressed"]:
		var gb := StyleBoxFlat.new()
		gb.bg_color = Color(0.3, 0.21, 0.13) if st == "normal" else Color(0.55, 0.14, 0.09)
		gb.set_corner_radius_all(2)
		gb.content_margin_left = 16
		gb.content_margin_right = 16
		gb.content_margin_top = 7
		gb.content_margin_bottom = 8
		b.add_theme_stylebox_override(st, gb)
	for st in ["font_color", "font_hover_color", "font_pressed_color"]:
		b.add_theme_color_override(st, Color(0.93, 0.88, 0.74))
	return b


func _settings() -> void:
	# ayarlar: karartılmış ekranın ortasında tek bir kâğıt sayfa (günlükle aynı görünüm)
	settings = PanelContainer.new()
	var back := StyleBoxFlat.new()
	back.bg_color = Color(0.03, 0.025, 0.02, 0.82)
	settings.add_theme_stylebox_override("panel", back)
	add_child(settings)
	settings.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var cc := CenterContainer.new()
	settings.add_child(cc)
	var pg := _page()
	pg.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	pg.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	cc.add_child(pg)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 9)
	pg.add_child(v)
	v.add_child(_ink("Ayarlar", 34, P_RED, true))
	v.add_child(_ink("GÖRÜNTÜ   ·   SES   ·   DENETİM", 11, P_DIM))
	_line(v, Color(0.3, 0.21, 0.13, 0.6))
	_row(v, "Fare hassasiyeti", _slider(0.0006, 0.005, player.sens, 0.0001, func(x: float) -> void: player.sens = x))
	_row(v, "Görüş açısı", _slider(55.0, 95.0, player.base_fov, 1.0, func(x: float) -> void: player.base_fov = x))
	_row(v, "Ses", _slider(0.0, 1.0, 0.8, 0.05, func(x: float) -> void: AudioServer.set_bus_volume_db(0, linear_to_db(maxf(x, 0.001)))))
	AudioServer.set_bus_volume_db(0, linear_to_db(0.8))
	var q := OptionButton.new()
	q.focus_mode = Control.FOCUS_NONE
	for name in world.ORDER:
		q.add_item(world.QUALITY[name]["ad"])
	q.select(world.ORDER.find(world.quality))
	q.item_selected.connect(func(i: int) -> void:
		world.quality = world.ORDER[i]
		world._apply_quality())
	_row(v, "Görüntü kalitesi", q)
	var fs := CheckBox.new()
	fs.focus_mode = Control.FOCUS_NONE
	fs.button_pressed = DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN
	fs.toggled.connect(func(on: bool) -> void: DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if on else DisplayServer.WINDOW_MODE_WINDOWED))
	_row(v, "Tam ekran", fs)
	var nu := CheckBox.new()
	nu.focus_mode = Control.FOCUS_NONE
	nu.button_pressed = MapView.north_up
	nu.toggled.connect(func(on: bool) -> void: MapView.north_up = on)
	_row(v, "Mini harita: kuzey yukarıda", nu)
	var note := _ink("Yüksek ve ultra kalite ayrı ekran kartı ister; tümleşik kartta düşük ya da orta kullanın.", 12, P_DIM)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note.custom_minimum_size = Vector2(530, 0)
	v.add_child(note)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 10)
	v.add_child(hb)
	var close := _ink_button("Kapat   O")
	close.pressed.connect(func() -> void: close_all())
	hb.add_child(close)
	var gap := Control.new()
	gap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hb.add_child(gap)
	var quit := _ink_button("Oyundan çık")
	quit.pressed.connect(func() -> void: get_tree().quit())
	hb.add_child(quit)
	settings.visible = false


# ---------------------------------------------------------------- giriş ekranı
func _intro() -> void:
	# açılış: arkada şehrin kâğıt haritası (koyultulmuş), ortada başlık, altında tuşlar ve giriş düğmesi
	intro = ColorRect.new()
	intro.color = Color(0.06, 0.045, 0.03, 1.0)
	intro.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(intro)
	if MapView.paper_tex != null:
		var bg := TextureRect.new()
		bg.texture = MapView.paper_tex
		bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		bg.modulate = Color(0.42, 0.36, 0.28, 1.0)
		bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
		bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		intro.add_child(bg)
	var shade := ColorRect.new()
	shade.color = Color(0.03, 0.022, 0.015, 0.62)
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	intro.add_child(shade)
	var cc := CenterContainer.new()
	cc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	intro.add_child(cc)
	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 6)
	cc.add_child(v)
	var yr := _label("1 9 1 8      —      1 9 2 1", 15, GOLD)
	yr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(yr)
	var tt := _ink("GAZİANTEP", 76, INK, true)
	tt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(tt)
	var orn := HBoxContainer.new()
	orn.alignment = BoxContainer.ALIGNMENT_CENTER
	orn.add_theme_constant_override("separation", 14)
	v.add_child(orn)
	for i in 3:
		if i == 1:
			orn.add_child(_ink("Bir Şehrin 11 Ayı", 24, Color(0.9, 0.84, 0.7), true))
		else:
			var ln := ColorRect.new()
			ln.color = Color(GOLD, 0.8)
			ln.custom_minimum_size = Vector2(70, 1)
			ln.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			orn.add_child(ln)
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(0, 26)
	v.add_child(sp)
	# tuşlar: iki sütunlu sade liste
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 18)
	grid.add_theme_constant_override("v_separation", 7)
	grid.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(grid)
	for kv in [["W A S D", "Yürü"], ["FARE", "Bak"], ["SHIFT", "Koş"], ["C", "Çömel"], ["E", "Konuş"], ["J", "Günlük ve bölüm seçimi"], ["M", "Harita"], ["O", "Ayarlar"], ["SOL TIK", "Ateş (tüfek varken)"], ["SAĞ TIK", "Nişan"], ["R", "Doldur"], ["ESC", "Fareyi bırak"]]:
		var kl := _label(kv[0], 12, GOLD)
		kl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		kl.custom_minimum_size = Vector2(90, 0)
		grid.add_child(kl)
		var vl := _label(kv[1], 14, Color(0.86, 0.8, 0.68))
		vl.custom_minimum_size = Vector2(200, 0)
		grid.add_child(vl)
	var sp2 := Control.new()
	sp2.custom_minimum_size = Vector2(0, 26)
	v.add_child(sp2)
	var b := Button.new()
	b.text = "ŞEHRE GİR"
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", 18)
	if f_title != null:
		b.add_theme_font_override("font", f_title)
	for st in ["normal", "hover", "pressed"]:
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(GOLD, 0.0 if st == "normal" else 0.9)
		sb.border_color = GOLD
		sb.set_border_width_all(1)
		sb.set_corner_radius_all(2)
		sb.content_margin_left = 46
		sb.content_margin_right = 46
		sb.content_margin_top = 11
		sb.content_margin_bottom = 12
		b.add_theme_stylebox_override(st, sb)
	b.add_theme_color_override("font_color", GOLD)
	b.add_theme_color_override("font_hover_color", Color(0.1, 0.07, 0.04))
	b.add_theme_color_override("font_pressed_color", Color(0.1, 0.07, 0.04))
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	b.pressed.connect(func() -> void: close_all())
	v.add_child(b)
	var note := _label("Kişiler ve konuşmalar kurgudur; tarihler ve olaylar için günlüğe bakın. Karakterlerin çoğu yer tutucu figürdür.", 11, Color(DIM, 0.8))
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	note.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	note.grow_horizontal = Control.GROW_DIRECTION_BOTH
	note.offset_top = -34
	note.offset_bottom = -16
	intro.add_child(note)
	intro.visible = false


# ---------------------------------------------------------------- aç / kapa
func is_open() -> bool:
	return journal.visible or settings.visible or intro.visible


func show_panel(name: String) -> void:
	journal.visible = name == "journal"
	settings.visible = name == "settings"
	intro.visible = name == "intro"
	bar.visible = name != "intro"
	set_active("journal" if name == "journal" else ("gear" if name == "settings" else ""))
	if name == "journal":
		_select(maxi(0, game.ORDER.find(game.ch)))
	# açılış geçişi: hafif büyüyerek belirir
	var pn: Control = journal if name == "journal" else (settings if name == "settings" else null)
	if pn != null:
		pn.pivot_offset = pn.size * 0.5
		pn.modulate.a = 0.0
		pn.scale = Vector2(0.97, 0.97)
		var tw := create_tween().set_parallel(true)
		tw.tween_property(pn, "modulate:a", 1.0, 0.18)
		tw.tween_property(pn, "scale", Vector2.ONE, 0.22).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	player.enabled = false
	if game.ui.has("play"):
		game.ui.play.visible = false      # panel açıkken oynanış göstergeleri arkada görünmesin


func close_all() -> void:
	journal.visible = false
	settings.visible = false
	intro.visible = false
	bar.visible = true
	set_active("")
	if game.ui.has("play"):
		game.ui.play.visible = true
	player.enabled = true
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func toggle(name: String) -> void:
	if intro.visible:
		return
	if (name == "journal" and journal.visible) or (name == "settings" and settings.visible):
		close_all()
	else:
		show_panel(name)
