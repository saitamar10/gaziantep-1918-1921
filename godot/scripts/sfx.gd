class_name Sfx
extends Node
## SESLER — hepsi açılışta koddan üretilir (kayıt dosyası yoktur): tüfek, mekanizma, doldurma, düşme, top mermisi, adım,
## rüzgâr ve kart sesi. Yer tutucudur; gerçek kayıtlar geldiğinde `sounds` sözlüğündeki akışlar dosyadan yüklenenlerle değişir.
## Uzaktan silah sesi: kuşatma boyunca aralıklı duyulur; ateşkeste (quiet) susar.

const RATE := 22050

var sounds := {}
var pool: Array[AudioStreamPlayer] = []
var pi := 0
var wind: AudioStreamPlayer
var rng := RandomNumberGenerator.new()
var siege := false
var quiet := false
var far_t := 6.0
# AŞAMA 12 — çevre sesleri: kuşlar (gündüz, kış dışında) ve sokak uğultusu (kalabalığa göre). Koddan üretilir; kayıt değildir.
var birds := true
var bird_t := 3.0
var crowd: AudioStreamPlayer
var strong_wind := false
var hush := false        # anma sahnelerinde bütün sesler kesilir
var mute := false        # ekransız sınama kipinde ses çalınmaz


func _ready() -> void:
	rng.seed = 77
	mute = DisplayServer.get_name() == "headless"
	sounds["shot"] = _make(0.55, func(t: float, n: float, lp: float) -> float: return n * exp(-t * 16.0) * 0.9 + sin(TAU * 85.0 * t) * exp(-t * 22.0) * 0.8 + lp * exp(-t * 6.0) * 0.5)
	sounds["far"] = _make(0.9, func(t: float, n: float, lp: float) -> float: return lp * exp(-t * 5.0) * 1.4 + sin(TAU * 60.0 * t) * exp(-t * 9.0) * 0.3)
	sounds["click"] = _make(0.06, func(t: float, n: float, lp: float) -> float: return n * exp(-t * 90.0) * 0.6 + sin(TAU * 2400.0 * t) * exp(-t * 120.0) * 0.4)
	sounds["reload"] = _make(0.9, func(t: float, n: float, lp: float) -> float:
		var a := n * exp(-fposmod(t, 0.42) * 70.0) * 0.5
		return a + sin(TAU * 1700.0 * t) * exp(-fposmod(t, 0.42) * 90.0) * 0.3)
	sounds["thud"] = _make(0.3, func(t: float, n: float, lp: float) -> float: return sin(TAU * 62.0 * t) * exp(-t * 14.0) * 0.9 + lp * exp(-t * 25.0) * 0.5)
	sounds["hurt"] = _make(0.35, func(t: float, n: float, lp: float) -> float: return sin(TAU * 140.0 * t) * exp(-t * 10.0) * 0.7 + lp * exp(-t * 14.0) * 0.6)
	sounds["step"] = _make(0.09, func(t: float, n: float, lp: float) -> float: return lp * exp(-t * 45.0) * 1.2)
	sounds["card"] = _make(0.9, func(t: float, n: float, lp: float) -> float: return (sin(TAU * 196.0 * t) + sin(TAU * 293.7 * t) * 0.6) * exp(-t * 3.5) * 0.4)
	sounds["bird"] = _make(0.28, func(t: float, n: float, lp: float) -> float: return sin(TAU * (2600.0 * t + 14.0 * sin(TAU * 26.0 * t))) * exp(-t * 11.0) * 0.5)
	var cw := _make(5.0, func(t: float, n: float, lp: float) -> float: return lp * (0.5 + 0.5 * sin(TAU * t * 1.3) * sin(TAU * t * 0.37)) * 1.2, 0.06)
	cw.loop_mode = AudioStreamWAV.LOOP_FORWARD
	cw.loop_end = int(5.0 * RATE)
	sounds["crowd"] = cw
	# top mermisi: alçalan ıslık (0,95 sn), ardından patlama
	sounds["shell"] = _make(2.6, func(t: float, n: float, lp: float) -> float:
		if t < 0.95:
			return sin(TAU * (1500.0 * t - 520.0 * t * t)) * (t / 0.95) * 0.35
		var e := t - 0.95
		return lp * exp(-e * 2.6) * 2.2 + sin(TAU * 45.0 * e) * exp(-e * 5.0) * 0.9)
	var w := _make(4.0, func(t: float, n: float, lp: float) -> float: return lp * (0.55 + 0.45 * sin(TAU * t / 4.0)) * (0.7 + 0.3 * sin(TAU * t * 0.75)), 0.02)
	w.loop_mode = AudioStreamWAV.LOOP_FORWARD
	w.loop_end = int(4.0 * RATE)
	sounds["wind"] = w
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		pool.append(p)
	wind = AudioStreamPlayer.new()
	wind.stream = w
	wind.volume_db = -26.0
	add_child(wind)
	crowd = AudioStreamPlayer.new()
	crowd.stream = cw
	crowd.volume_db = -80.0
	add_child(crowd)
	if not mute:
		wind.play()
		crowd.play()


## f(t, gürültü, alçak geçirgen gürültü) -> örnek değeri. cut: alçak geçirgen süzgecin katsayısı (küçük = daha boğuk)
func _make(dur: float, f: Callable, cut := 0.12) -> AudioStreamWAV:
	var n := int(dur * RATE)
	var data := PackedByteArray()
	data.resize(n * 2)
	var lp := 0.0
	for i in n:
		var noise := rng.randf() * 2.0 - 1.0
		lp += (noise - lp) * cut
		var v: float = clampf(f.call(float(i) / RATE, noise, lp * 3.0), -1.0, 1.0)
		data.encode_s16(i * 2, int(v * 30000.0))
	var s := AudioStreamWAV.new()
	s.format = AudioStreamWAV.FORMAT_16_BITS
	s.mix_rate = RATE
	s.data = data
	return s


## vol: 0..1 (uzaklığa göre kısılmış hâli verilir)
func play(name: String, vol := 1.0, pitch := 1.0) -> void:
	if mute or hush or not sounds.has(name) or vol <= 0.01:
		return
	var p := pool[pi % pool.size()]
	pi += 1
	p.stream = sounds[name]
	p.volume_db = linear_to_db(clampf(vol, 0.01, 1.0)) - 4.0
	p.pitch_scale = pitch
	p.play()


func set_wind(strong: bool) -> void:
	strong_wind = strong
	wind.volume_db = -80.0 if hush else (-14.0 if strong else -26.0)


func set_hush(on: bool) -> void:
	hush = on
	set_wind(strong_wind)


## Sokak uğultusu: 0 (boş sokak) .. 1 (kalabalık çarşı)
func set_crowd(v: float) -> void:
	crowd.volume_db = -80.0 if (hush or v <= 0.02) else lerpf(-40.0, -27.0, clampf(v, 0.0, 1.0))


func _process(dt: float) -> void:
	if birds and not hush:
		bird_t -= dt
		if bird_t <= 0.0:
			bird_t = rng.randf_range(0.25, 0.6) if rng.randf() < 0.45 else rng.randf_range(3.0, 11.0)
			play("bird", rng.randf_range(0.05, 0.14), rng.randf_range(0.8, 1.35))
	if not siege or quiet:
		return
	far_t -= dt
	if far_t <= 0.0:
		far_t = rng.randf_range(5.0, 18.0)
		play("far", rng.randf_range(0.12, 0.3), rng.randf_range(0.8, 1.1))
		if rng.randf() < 0.4:
			far_t = rng.randf_range(0.3, 0.9)   # karşılık ateşi
