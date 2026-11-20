extends Node
## HİKÂYE VE GÖREV MOTORU — bütün senaryolar (web: Prolog.js, Story.js, Bolum1–3.js).
##   a  17 Aralık 1918   Prolog: Son Normal Gün · Yabancı Askerler
##   b  25 Ekim 1919     Prolog: Bayrak Değişiyor · Gizli Haber
##   c  23 Kasım 1919    Prolog: Halk Toplantısı
##   heyet  Kasım 1919   Gizli Toplantı ve yedi komisyon görevi
##   k1–k5  Ocak–Mart 1920  Savaşa Giden Yol: Karabıyıklı Baskını · Şehit Kâmil · Kilis Yolu · Dokurcum Değirmeni · Elmalı Köprüsü
##   b1  1 Nisan 1920    Bölüm 1: Şehir Ayağa Kalkıyor
##   b2  24 Mayıs 1920   Bölüm 2: Ateş Çemberi (Sarımsak Tepe çatışması, bombardıman)
##   b3  30 Mayıs 1920   Bölüm 3: Kırılgan Ateşkes
##   b4  Temmuz 1920     Bölüm 4: Mahallelerin Nöbeti (gece nöbeti ve sızma; ertesi gün taş, kereste, sargı, haber zinciri)
##   b5  8–13 Ağustos 1920  Bölüm 5: Ya Hürriyet Ya Ölüm (yeni komuta düzeni; teslim talebi ve halk toplantısı)
##   b6  9–10 Eylül 1920  Bölüm 6: Yardım Bekleyen Şehir (bombardıman ve enkaz; gece yardım mektubunun dışarı çıkarılması)
##   b7  5 ve 14 Ekim 1920  Bölüm 7: Çınarlı Cephesi (sokak sokak savunma, arka hatta çekilme, yaralı taşıma)
##   b8  21 ve 28 Kasım 1920  Bölüm 8: Çember Daralıyor (ikinci kuşatma haberi; azalan tayın)
##   b9  Aralık 1920     Bölüm 9: Son Erzak (ekmek dağıtımı, hayvanların yemi; boş kovan toplama, güvercinle haber)
##   b10 Ocak 1921       Bölüm 10: Açlığın İçinde (son un, acı zerdali çekirdeği ve zehirlenme, hayvanların sonu, gelmeyen yardım)
##   b11 5–9 Şubat 1921  Bölüm 11: Son Gün (huruç; teslim)
##   ep  Şubat–Aralık 1921  Epilog: Bir Şehir Sustu (işgal altında, Ankara Antlaşması, 25 Aralık 1921)
## TARİHÎ DAYANAK ve bağlayıcı kurallar: antep/docs/hikaye-ana-dosya.md. Oynanan karakterler (çırak/haberci, mahalle savunmacısı,
## gönüllü yardımcı) ve bütün konuşmalar KURGUDUR; gerçek kişilere söz atfedilmez (Karayılan'a yazılan sözler kurgu olarak işaretlidir).
## Tarihî sonuçlar sabittir: Sarımsak Tepe "kazanılmaz", sahne çekilme emriyle biter.
## Adım türleri: card, groups, title, role, tp, talk, talkN, goto, sneak, listen, wait, combat, date.

const GOLD := Color(0.85, 0.71, 0.42)
const INK := Color(0.96, 0.91, 0.8)
const ORDER := ["a", "b", "c", "heyet", "k1", "k2", "k3", "k4", "k5", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10", "b11", "ep"]
const META := {
	"a": {"tarih": "17 Aralık 1918", "ad": "Prolog · Son Normal Gün", "donem": "1918 · İŞGALDEN ÖNCE"},
	"b": {"tarih": "25 Ekim 1919", "ad": "Prolog · Bayrak Değişiyor", "donem": "1919 · FRANSIZ İŞGALİ"},
	"c": {"tarih": "23 Kasım 1919", "ad": "Prolog · Halk Toplantısı", "donem": "1919 · FRANSIZ İŞGALİ"},
	"heyet": {"tarih": "Kasım 1919", "ad": "Gizli Toplantı ve komisyonlar", "donem": "1919 · FRANSIZ İŞGALİ"},
	"k1": {"tarih": "20 Ocak 1920", "ad": "Savaşa Giden Yol · Karabıyıklı Baskını", "donem": "1920 · FRANSIZ İŞGALİ"},
	"k2": {"tarih": "21 Ocak 1920", "ad": "Savaşa Giden Yol · Şehit Kâmil", "donem": "1920 · FRANSIZ İŞGALİ"},
	"k3": {"tarih": "Şubat 1920", "ad": "Savaşa Giden Yol · Kilis Yolu", "donem": "1920 · FRANSIZ İŞGALİ"},
	"k4": {"tarih": "27 Mart 1920", "ad": "Savaşa Giden Yol · Dokurcum Değirmeni", "donem": "1920 · FRANSIZ İŞGALİ"},
	"k5": {"tarih": "28/29 Mart 1920", "ad": "Savaşa Giden Yol · Elmalı Köprüsü", "donem": "1920 · FRANSIZ İŞGALİ"},
	"b1": {"tarih": "1 Nisan 1920", "ad": "Bölüm 1 · Şehir Ayağa Kalkıyor", "donem": "1920 · KUŞATMA"},
	"b2": {"tarih": "24 Mayıs 1920", "ad": "Bölüm 2 · Ateş Çemberi", "donem": "1920 · KUŞATMA"},
	"b3": {"tarih": "30 Mayıs 1920", "ad": "Bölüm 3 · Kırılgan Ateşkes", "donem": "1920 · ATEŞKES"},
	"b4": {"tarih": "Temmuz 1920", "ad": "Bölüm 4 · Mahallelerin Nöbeti", "donem": "1920 · KUŞATMA"},
	"b5": {"tarih": "8 Ağustos 1920", "ad": "Bölüm 5 · Ya Hürriyet Ya Ölüm", "donem": "1920 · KUŞATMA"},
	"b6": {"tarih": "9 Eylül 1920", "ad": "Bölüm 6 · Yardım Bekleyen Şehir", "donem": "1920 · KUŞATMA"},
	"b7": {"tarih": "5 Ekim 1920", "ad": "Bölüm 7 · Çınarlı Cephesi", "donem": "1920 · KUŞATMA"},
	"b8": {"tarih": "21 Kasım 1920", "ad": "Bölüm 8 · Çember Daralıyor", "donem": "1920 · KUŞATMA"},
	"b9": {"tarih": "Aralık 1920", "ad": "Bölüm 9 · Son Erzak", "donem": "1920 · KUŞATMA"},
	"b10": {"tarih": "1 Ocak 1921", "ad": "Bölüm 10 · Açlığın İçinde", "donem": "1921 · KUŞATMA"},
	"b11": {"tarih": "5 Şubat 1921", "ad": "Bölüm 11 · Son Gün", "donem": "1921 · KUŞATMA"},
	"ep": {"tarih": "Şubat 1921", "ad": "Epilog · Bir Şehir Sustu", "donem": "1921 · İŞGAL ALTINDA"},
}
## NÜFUS PROFİLLERİ — bölüme (tarihe ve savaş durumuna) göre sokaktaki yoğunluk. walk: dolaşanlar, civ: sohbet eden ikililer,
## def: silahlı nöbetçi ikilileri, seat: duvar dibinde oturanlar (yaşlı, hasta, sığınan); hepsi 0..1 oran. İşgal devriyeleri
## dönem etiketinden eklenir. Çatışma sürerken siviller saklanır (npcs.shelter).
## hayvan: false ise sokakta at görünmez (Aralık 1920 sonrası: yem bitmiş, hayvan kalmamıştır — Bölüm 9–10 anlatısı).
## "neden": sokağın boş ya da seyrek olmasının tarihî / oynanış gerekçesi. Oranlar oyun tasarımıdır, nüfus verisi değildir.
## Tarihe bağlı hasar düzeyi (city.set_damage). Kuşatma Nisan 1920'de başlar; izler aylar içinde artar ve 1921 boyunca kalır.
## Düzeyler ve iz yerleri temsilîdir (VARSAYIM); belgelenmiş tek tek yıkımları göstermez.
const HASAR := {"b1": 0.3, "b2": 0.3, "b3": 0.3, "b4": 0.6, "b5": 0.6, "b6": 0.6, "b7": 0.6, "b8": 1.0, "b9": 1.0, "b10": 1.0, "b11": 1.0, "ep": 1.0}
const NUFUS := {
	"a": {"walk": 1.0, "civ": 1.0, "def": 0.0, "seat": 0.4},
	"b": {"walk": 0.9, "civ": 0.8, "def": 0.0, "seat": 0.4},
	"c": {"walk": 0.9, "civ": 0.8, "def": 0.0, "seat": 0.4},
	"heyet": {"walk": 0.8, "civ": 0.7, "def": 0.0, "seat": 0.4},
	"k1": {"walk": 0.0, "civ": 0.0, "def": 0.0, "seat": 0.0, "neden": "Şehir dışında pusu yeri: sivil yok, yalnız baskın kolu."},
	"k2": {"walk": 0.6, "civ": 0.5, "def": 0.0, "seat": 0.2, "neden": "Olay günü sokak gergin; halk kalabalığın çevresinde toplanmış."},
	"k3": {"walk": 0.0, "civ": 0.0, "def": 0.0, "seat": 0.0, "neden": "Kırsal: yalnız köydeki köylüler ve savunmacılar (hikâye kişileri)."},
	"k4": {"walk": 0.0, "civ": 0.0, "def": 0.0, "seat": 0.0, "neden": "Hafıza sahnesi: köy ve değirmen bilerek sessizdir."},
	"k5": {"walk": 0.0, "civ": 0.0, "def": 0.0, "seat": 0.0, "neden": "Köprü başı siperi: yalnız savunmacılar."},
	"b1": {"walk": 0.6, "civ": 0.5, "def": 1.0, "seat": 0.4},
	"b2": {"walk": 0.5, "civ": 0.4, "def": 1.0, "seat": 0.6, "neden": "Bombardıman: siviller mahzenlerde; sokakta savunmacılar ve yaralılar."},
	"b3": {"walk": 0.8, "civ": 0.7, "def": 0.7, "seat": 0.6},
	"b4": {"walk": 0.5, "civ": 0.4, "def": 1.0, "seat": 0.4},
	"b5": {"walk": 0.7, "civ": 0.6, "def": 0.7, "seat": 0.4},
	"b6": {"walk": 0.4, "civ": 0.3, "def": 0.7, "seat": 0.8, "neden": "Ağır bombardıman: sokak boşalmış."},
	"b7": {"walk": 0.2, "civ": 0.0, "def": 1.0, "seat": 0.2, "neden": "Çatışma mahallesi: siviller tahliye edilmiş ya da mahzende."},
	"b8": {"walk": 0.5, "civ": 0.4, "def": 0.7, "seat": 0.8},
	"b9": {"hayvan": false, "walk": 0.4, "civ": 0.3, "def": 0.7, "seat": 1.0, "neden": "Erzak tükeniyor: ticaret durmuş, sokak seyrek."},
	"b10": {"hayvan": false, "walk": 0.25, "civ": 0.15, "def": 0.4, "seat": 1.0, "neden": "Açlık ve kar: insanlar evlerinde; sokakta hasta ve sığınanlar."},
	"b11": {"hayvan": false, "walk": 0.25, "civ": 0.15, "def": 0.4, "seat": 1.0, "neden": "Kuşatmanın son günleri."},
	"ep": {"walk": 0.6, "civ": 0.5, "def": 0.0, "seat": 0.6},
}
## TARİHÎ DÜNYA DURUMU — değiştirilemeyen sonuçlar. Oyuncu taktik anları yaşar ama bu sonuçları değiştiremez; ilgili
## çatışmalar "bitmeyen" kiptedir (bkz. combat.gd) ve görev hedefleri düşman öldürmek değil dayanmak, taşımak, çekilmektir.
const SABIT := {
	"k1": "Baskın yapılır ve kol geri çekilir; kol yok edilmez.",
	"k2": "Mehmet Kâmil'in ölümü. Oyuncu müdahale edemez.",
	"k4": "Dokurcum'da on dört çocuğun ölümü. Sahne oynatılmaz; anılır.",
	"k5": "Şahin Bey Elmalı Köprüsü'nde şehit düşer; köprü tutulamaz.",
	"b1": "1 Nisan 1920'de şehir savunması başlar.",
	"b2": "Karayılan Sarımsak Tepe'de şehit düşer; tepe bırakılır.",
	"b7": "Çınarlı'da çatışma sürer; kesin bir zafer yoktur.",
	"b10": "Beklenen yardım şehre ulaşamaz.",
	"b11": "Çıkış girişimi hattı yaramaz; 9 Şubat 1921'de şehir teslim olur.",
	"ep": "25 Aralık 1921'de Fransız kuvvetleri şehirden ayrılır.",
}
## Bölümün başladığı hava ve saat (res://grafik/<ad>.tres). Adımlar "hava" anahtarıyla değiştirebilir. Gece ve kış ayrıca yönetilir.
const HAVA := {"a": "sabah", "b": "ogle", "c": "gunduz", "heyet": "gunbatimi", "k1": "sabah", "k2": "bulutlu", "k3": "ogle", "k4": "gunduz", "k5": "gunbatimi",
	"b1": "gunduz", "b2": "tozlu", "b3": "sabah", "b4": "sabah", "b5": "ogle", "b6": "tozlu", "b7": "bulutlu", "b8": "bulutlu", "b9": "bulutlu", "b10": "bulutlu", "b11": "bulutlu", "ep": "gunduz"}
const ROLLER := {"haberci": "Haberci (çırak)", "savunmaci": "Mahalle savunmacısı", "yardimci": "Gönüllü yardımcı", "esnaf": "Esnaf"}
const ESYA := {"bez": "Temiz bez", "su": "Su", "fisek": "Fişek sandığı", "tas": "Taş", "kereste": "Kapı kanadı", "pusula": "Pusula", "malzeme": "Sargı malzemesi", "mektup": "Yardım mektubu", "tayin": "Tayın payı", "ekmek": "Ekmek", "kovan": "Boş kovan", "un": "Bir avuç un", "erzak": "Erzak ve mesaj", "cikin": "Yiyecek çıkını"}
const YON := ["kuzey", "kuzeydoğu", "doğu", "güneydoğu", "güney", "güneybatı", "batı", "kuzeybatı"]
const KOMISYON := ["mali", "iase", "muhimmat", "saglik", "tahkimat", "yardim", "haber"]
const SARIMSAK := Vector2(780, -450)
const R0 := 62.0

var world: Node3D
var city: City
var street: Node3D
var npcs: Npcs
var player: CharacterBody3D
var combat: Combat
var sfx: Sfx
var autoplay := false
var sinema: Sinema                 # Aşama 13: bölüm açılışı kamera geçişi
var route := PackedVector2Array()   # hedefe giden yol (harita çizer)
var route_t := 0.0
var route_len := 0.0            # rotanın yol üzerinden uzunluğu (m)
var route_kind := ""            # hedef | isaret | donus
var waypoint = null             # oyuncunun büyük haritada koyduğu işaret (Vector2) ya da null
var mini_map: MapView
var big_map: MapView

var chapters := {}
var prog := {}
var ch := ""
var seen := {}
var inv := {}
var role := ""
var carrying := false
var cards: Array = []
var card_t := 0.0
var fade_t := 0.0
var listen_sc = null           # dinleme sahnesi: {i, t}
var ui := {}
var marks: Array = []
# ---- ARAYÜZ (HUD). Hepsi mevcut verilere bağlıdır: görev adımları, konuşmalar, sağlık (çatışma), rol, taşınan eşya, rota.
# Oyunda para ve dayanıklılık sistemi YOKTUR; bu yüzden gösterilmezler (sahte veri üretilmez).
const DIM := Color(0.78, 0.72, 0.6)
const GUN_ADI := {"sabah": "Sabah", "ogle": "Öğle", "gunduz": "Gündüz", "gunbatimi": "Akşamüstü", "gece": "Gece", "bulutlu": "Kapalı hava", "tozlu": "Tozlu hava", "kis": "Kış günü"}
var hud_root: Control
## Şimdiki görev adımının metni (harita bilgi paneli ve günlük için)
var objective := ""
## Yazı tipleri: sistemde kurulu olanlardan (indirme yok). Gövde: Bahnschrift / Segoe UI; başlık: Palatino / Georgia (dönem havası)
var f_ui: SystemFont
var f_title: SystemFont
var toast: PanelContainer
var toast_tw: Tween
var dlg: PanelContainer
var dlg_tw: Tween
var hud_prev := {"ch": "", "i": -1, "title": ""}
var menu: Menu
var met := {}              # Tanıdıklar: konuşulan kişilerin etiketleri
var auto_t := 0.0
var all_done := false
var end_t := -1.0
var pt := {}
var garden := {}
# gizli toplantı
var st_stage := 0
var st_done := {}
var st_job = null           # {id, i, seen}
var st_script = null
var st_end := -1.0
var jobs := {}
var heads := {}
var members: Array = []
var lookout: Npc
var hatip: Npc
var crowd: Array = []
# bölüm 1
var bars: Array = []        # {layers, solids, buildable}
var pile: Node3D
var seats1: Node3D
var b1_stage := 0
var yarali: Array = []      # {a, from, to}
var carry1 := [false, false]
# bölüm 2
var karayilan: Npc
var b2_allies: Array = []
var ally0: Npc
var y_h := {}
var y_c := {}
var hill: Node3D
var city2: Node3D
var hill_cols: Array = []
var rubble_col := 0
var lanes: Array = []
var spawns: Array = []
var ix := {}
var fallen := false
var shelling := false
var shell_t := 6.0
var pending = null
var puffs: Array = []
var seats3: Node3D
# bölüm 4
var lanes4: Array = []
var spawns4: Array = []
var door4: Node3D
var i_day4 := 0
# bölüm 5
var flag5: Node3D
# bölüm 6
var y6 := {}
var ruin6: Node3D
var ruin6_col := 0
var i_night6 := 0
# bölüm 7
var site7: Node3D
var cols7: Array = []
var dir7 := Vector2(1, 0)
var lanes7a: Array = []
var lanes7b: Array = []
var spawns7: Array = []
var y7 := {}
# bölüm 10
var y10: Array = []
# kırsal hikâyeler
var rural: Node3D
var i_mill := 0
var i_kamil := 0
var i_elmali := 0
var lanes_k := {}
# bölüm 11
var site11: Node3D
var cols11: Array = []
var lanes11: Array = []
var i_day11 := 0
var i_break := 0
var rng := RandomNumberGenerator.new()


func _ready() -> void:
	rng.seed = 2405
	garden = npcs.nav.info["garden"]
	_hud()
	_cast()
	_props()
	_build()
	for k in ORDER:
		prog[k] = 0


# ================================================================ yardımcılar
func _v(d) -> Vector2:
	return Vector2(d["x"], d["z"])


func _is(tag: String) -> Callable:
	return func(a: Npc) -> bool: return a.tag == tag


func _usta(a: Npc) -> bool:
	return a == npcs.usta


func _gezen(a: Npc) -> bool:
	return not a.story and a.family != "child" and a.family != "soldier" and a != npcs.usta


func _sivil(a: Npc) -> bool:
	return not a.story and a.kimlik.get("ad", "") != "" and a.family != "child" and a.role != "esnaf"


func _pp() -> Vector2:
	return Vector2(player.global_position.x, player.global_position.z)


func yon(d: Vector2) -> String:
	var a := atan2(d.x, -d.y)
	return YON[int(round(fposmod(a, TAU) / (PI / 4.0))) % 8]


## Göreve eşlik eden konuşma: görevle ilgisi olmayan bir sakine sorulduğunda o anki hedefe yol tarif eder
func yol_tarifi(a: Npc) -> String:
	var tg := targets()
	if tg.is_empty():
		return ""
	var t: Dictionary = tg[0]
	var bd := 1e9
	for k in tg:
		var d: float = a.xz().distance_to(Vector2(k["p"].x, k["p"].z))
		if d < bd:
			bd = d
			t = k
	var adim := maxi(10, int(round(bd * 1.3 / 10.0)) * 10)
	var y := yon(Vector2(t["p"].x, t["p"].z) - a.xz())
	var lbl: String = t.get("label", "")
	if bd < 8.0:
		return ("%s hemen şurası, gözünün önünde." % lbl) if lbl != "" else "Aradığın hemen şurada, dön bak."
	if lbl != "":
		return ["%s mi? %s tarafında, %d adım kadar." % [lbl, y.capitalize(), adim], "%s için %s yönüne yürü; %d adım ya var ya yok." % [lbl, y, adim], "Şaşırma: %s %s yönünde kalır, %d adımlık yol." % [lbl, y, adim]][randi() % 3]
	return ["Aradığın kişi %s tarafında, %d adım kadar ileride." % [y, adim], "%s yönüne git; %d adım sonra görürsün." % [y.capitalize(), adim], "Az önce %s tarafında gördüm, %d adım ötede." % [y, adim]][randi() % 3]


func _stone_mat(c: Color) -> StandardMaterial3D:
	return city.plain_stone(c)


func _seat(parent: Node3D, p: Vector2) -> void:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(0.5, 0.4, 0.5)
	mi.mesh = bm
	mi.material_override = Npc.mat(Color(0.78, 0.73, 0.62))
	parent.add_child(mi)
	mi.global_position = Vector3(p.x, city.ground(p.x, p.y) + 0.2, p.y)


func _spot(p: Vector2, yaw := 0.0) -> Dictionary:
	return {"x": p.x, "z": p.y, "yaw": yaw}


# ================================================================ kişiler
func _cast() -> void:
	var m := street
	var n := npcs
	var c := _v(garden["center"])
	pt = {"cesme": n.hp(m.cx(-24.0) + 1.2, -24.0), "kontrol": n.hp(m.cx(0.0), 6.0), "sargi": c, "kapi": _v(garden["out"]),
		"depo": n.hp(m.cx(0.0), 9.0), "uc_kuzey": n.hp(m.cx(-100.0), -108.0), "kabalti": n.hp(m.cx(-46.0), -46.0), "uc_guney": n.hp(m.cx(0.0), 9.0),
		"yigin": n.hp(m.xr(-82.0) - 2.2, -82.0), "barikat": n.hp(m.cx(-97.0) - 1.6, -95.4), "carsi": n.hp(m.cx(4.0), 4.6), "kabalti2": n.hp(m.cx(-50.0), -50.4), "kale": n.hp(m.cx(-97.0), -95.0),
		"cikis": n.hp(m.cx(-100.0), -106.0), "enkaz": n.hp(m.xr(-60.0) - 1.8, -60.0), "sokak": n.hp(m.cx(-30.0), -30.0), "depo3": n.hp(m.cx(0.0), 2.0)}
	for k in ["han", "cami", "meydan"]:
		if n.nav.info.get(k) != null:
			pt[k] = _v(n.nav.info[k])
	# ---- kırsal hikâyeler (Savaşa Giden Yol): yerler ve kişiler
	_rural_sites()
	var s1: Vector2 = pt["k1"]
	n.add_story("K08", "karayilan1", _spot(s1 + Vector2(-1.7, 2.2), PI * 0.5), {"grp": "k1", "kimlik": {"ad": "Karayılan", "cemaat": "Türk", "meslek": "Molla Mehmet", "etiket": "Karayılan (Molla Mehmet)"}})
	for q in [-5.5, 5.0, 9.0]:
		n.add_story("K02", "k1s", _spot(s1 + Vector2(-1.5, q), PI * 0.5), {"grp": "k1", "pose": "kneel", "rifle": true, "kimlik": _kim("Baskıncı")})
	# Şehit Kâmil sahnesi: sokakta toplanmış kalabalık, sonrasında anne ve komşusu. Çocuk figürü ve olayın kendisi GÖSTERİLMEZ.
	for q in [[-27.0, -1.2, "K02"], [-28.2, 0.6, "K01"], [-29.0, -0.4, "K05"], [-27.6, 1.5, "K06"], [-29.6, 1.2, "K02"]]:
		n.add_story(q[2], "k2kalabalik", n.spot(m.cx(q[0]) + q[1], q[0], 0, -1), {"grp": "k2a", "kimlik": _kim("Mahalleli")})
	n.add_story("K03", "k2anne", n.spot(m.cx(-33.0) - 0.4, -33.0, 0, 1), {"grp": "k2b", "pose": "kneel", "kimlik": _kim("Kâmil'in annesi")})
	n.add_story("K11", "k2komsu", n.spot(m.cx(-31.6) + 1.0, -31.6, 0, -1), {"grp": "k2b", "kimlik": _kim("Komşu kadın")})
	# Kilis yolu: Acar köyündeki karargâh, yol üstündeki Fransız konvoy nöbetçileri, gözcü ve pusudaki savunmacılar
	var s3: Vector2 = pt["k3"]
	n.add_story("K08S", "sahin", _spot(s3 + Vector2(2.2, 2.0), -PI * 0.5), {"grp": "k3", "kimlik": {"ad": "Şahin Bey", "cemaat": "Türk", "meslek": "Mehmet Sait", "etiket": "Şahin Bey (Mehmet Sait)"}})
	n.add_story("K02", "k3cavus", _spot(s3 + Vector2(3.6, -1.4), -PI * 0.5), {"grp": "k3", "rifle": true, "kimlik": _kim("Çavuş")})
	for q in [Vector2(60, 9), Vector2(108, -8)]:
		n.add_story("K09", "k3fr", _spot(s3 + q, PI), {"grp": "k3f"})
	n.add_story("K02", "k3gozcu", _spot(pt["k3_goz"] + Vector2(-1.4, 1.2), PI * 0.5), {"grp": "k3", "pose": "kneel", "kimlik": _kim("Gözcü")})
	for q in [-5.0, 4.5, 8.5]:
		n.add_story("K02", "k3s", _spot(pt["k3_goz"] + Vector2(0.4, q), PI * 0.5), {"grp": "k3s", "pose": "kneel", "rifle": true, "kimlik": _kim("Savunmacı")})
	# Acar köyünün ahalisi (kırsalda da insan olsun): köylüler evlerin önünde
	for q in [["K06", -6.0, -4.5], ["K03", -9.5, 8.6], ["K12", 6.2, 6.4], ["K01", 11.5, -5.5], ["K04", 1.0, -9.8], ["K05", 12.0, 6.5]]:
		var vp := city.resolve(s3 + Vector2(q[1], q[2]), 0.5)
		n.add_story(q[0], "k3koylu", _spot(vp, atan2(s3.x - vp.x, s3.y - vp.y)), {"grp": "k3v", "role": "gezen", "kimlik": _kim("Köylü")})
	# köyün hayvanları (kalıcı): iki inek, üç koyun
	for q in [["Cow", 2.2, -15.0, 9.0, 0.6], ["Cow", 2.2, -17.5, 6.0, 2.1], ["Sheep", 1.2, 16.0, -11.0, 1.0], ["Sheep", 1.2, 17.6, -9.4, 3.0], ["Sheep", 1.2, 14.4, -9.0, 4.4]]:
		var an := n.make_animal(q[0], q[1])
		if an != null:
			n.put_animal(an, city.resolve(s3 + Vector2(q[2], q[3]), 0.8), q[4])
	# Elmalı Köprüsü
	var b5k: Vector2 = pt["k5"]
	var d5: Vector2 = pt["k5_dir"]
	var sd5 := Vector2(-d5.y, d5.x)
	var yaw5 := atan2(d5.x, d5.y)
	n.add_story("K08S", "sahin5", _spot(b5k - d5 * 20.6 + sd5 * 2.2, yaw5), {"grp": "k5", "kimlik": {"ad": "Şahin Bey", "cemaat": "Türk", "meslek": "Mehmet Sait", "etiket": "Şahin Bey (Mehmet Sait)"}})
	for q in [-4.5, -2.0, 4.6]:
		n.add_story("K02", "k5s", _spot(b5k - d5 * 20.4 + sd5 * q, yaw5), {"grp": "k5", "pose": "kneel", "rifle": true, "kimlik": _kim("Savunmacı")})
	# ---- prolog
	n.add_story("K02", "firinci", n.spot(m.xr(-10.0) - 0.8, -10.0, -1, 0), {"grp": "p1", "kimlik": {"ad": "Fırıncı", "cemaat": "Türk", "meslek": "fırıncı", "etiket": "Fırıncı"}})
	for sx in [-1.7, 1.7]:
		var sp := n.spot(m.cx(8.0) + sx, 8.0, 0, -1)
		n.add_story("K15", "ing", sp, {"grp": "p2"})
		n.add_story("K09", "fr", sp, {"grp": "p3"})
	n.add_story("K01", "ileri1", n.spot(m.xr(-66.0) - 0.8, -66.0, -1, 0), {"grp": "p4", "kimlik": {"ad": "İhtiyar", "cemaat": "Türk", "meslek": "mahalleli", "etiket": "İhtiyar"}})
	n.add_story("K02", "ileri2", garden["lookout"], {"grp": "p4", "kimlik": {"ad": "Kapıdaki adam", "cemaat": "Türk", "meslek": "", "etiket": "Kapıdaki adam"}})
	if pt.has("meydan"):
		var sp: Vector2 = pt["meydan"]
		for k in 12:
			if not city.blocked(sp.x, sp.y, 0.4):
				break
			sp.x += 1.0
		hatip = n.add_story("K01", "hatip", _spot(sp), {"grp": "p5", "kimlik": {"ad": "Hatip", "cemaat": "Türk", "meslek": "hatip", "etiket": "Hatip"}})
		var defs := ["K02", "K01", "K11", "K02", "K12", "K02", "K04", "K01", "K02", "K11", "K02", "K06", "K02", "K05", "K01", "K02"]
		var i := 0
		for r in [3.4, 4.9, 6.4]:
			var a := -1.0
			while a <= 1.01 and i < defs.size():
				var q: Vector2 = sp + Vector2(sin(a), cos(a)) * r
				a += 0.5 if r < 4.0 else 0.4
				if city.blocked(q.x, q.y, 0.32):
					continue
				crowd.append(n.add_story(defs[i], "kalabalik", _spot(q, atan2(sp.x - q.x, sp.y - q.y)), {"grp": "p5"}))
				i += 1
	# ---- gizli toplantı ve komisyonlar
	lookout = n.add_story("K02", "gozcu", garden["lookout"], {"grp": "heyet", "kimlik": {"ad": "Gözcü", "cemaat": "Türk", "meslek": "", "etiket": "Gözcü"}})
	var mdef := ["K01", "K02", "K02", "K01", "K02"]
	for i in garden["circle"].size():
		members.append(n.add_story(mdef[i % 5], "lider" if i == 0 else "uye", garden["circle"][i], {"grp": "heyet", "kimlik": {"ad": "Heyet üyesi", "cemaat": "Türk", "meslek": "", "etiket": "Heyet üyesi"}}))
	var hs := {"mali": ["K01", m.xr(-12.0) - 0.8, -12.0, -1], "iase": ["K02", m.xr(-3.0) - 0.8, -3.0, -1], "muhimmat": ["K02", m.xr(-80.0) - 0.9, -80.0, -1], "saglik": ["K11", m.xl(-34.0) + 0.8, -34.0, 1],
		"tahkimat": ["K02", m.xl(-57.0) + 0.7, -57.0, 1], "yardim": ["K12", m.xr(-66.0) - 0.8, -66.0, -1], "haber": ["K02", m.xl(-95.0) + 0.8, -95.0, 1]}
	for k in hs:
		var h: Array = hs[k]
		heads[k] = n.add_story(h[0], "kom:" + k, n.spot(h[1], h[2], h[3], 0), {"grp": "heyet"})
	n.add_story("K06", "demirci", n.spot(m.xr(-90.0) - 1.2, -90.0, -1, 0), {"grp": "heyet", "kimlik": {"ad": "Demirci", "cemaat": "Türk", "meslek": "demirci", "etiket": "Demirci"}})
	# ---- bölüm 1
	n.add_story("K08", "komutan", n.spot(m.xl(-92.0) + 0.9, -92.0, 1, 0), {"grp": "b1", "kimlik": {"ad": "Mahalle komutanı", "cemaat": "Türk", "meslek": "", "etiket": "Mahalle komutanı"}})
	for q in [["K02", m.cx(4.8) - 1.9, 4.8, 1.0], ["K08", m.cx(4.8) + 1.9, 4.6, 1.0], ["K02", m.cx(-50.8) + 1.2, -50.8, -1.0], ["K01", m.cx(-95.0) + 1.8, -95.0, -1.0]]:
		n.add_story(q[0], "savunmaci", n.spot(q[1], q[2], 0, q[3]), {"grp": "b1", "rifle": true, "kimlik": {"ad": "Nöbetçi", "cemaat": "Türk", "meslek": "", "etiket": "Nöbetçi"}})
	n.add_story("K02", "kilavuz", garden["lookout"], {"grp": "b1", "kimlik": {"ad": "Kılavuz", "cemaat": "Türk", "meslek": "", "etiket": "Kılavuz"}})
	var y1 := n.spot(m.xr(1.5) - 0.8, 1.5, -1, 0)
	var y2 := n.spot(m.xl(-41.0) + 0.8, -41.0, 1, 0)
	yarali = [{"a": n.add_story("K02", "yarali1", y1, {"grp": "b1y1", "pose": "sit", "kimlik": {"ad": "Yaralı savunmacı", "cemaat": "Türk", "meslek": "", "etiket": "Yaralı savunmacı"}}), "from": y1, "to": _spot(c + Vector2(1.4, 0.6), 2.2)},
		{"a": n.add_story("K06", "yarali2", y2, {"grp": "b1y2", "pose": "sit", "kimlik": {"ad": "Yaralı hamal", "cemaat": "Türk", "meslek": "", "etiket": "Yaralı hamal"}}), "from": y2, "to": _spot(c + Vector2(-1.3, 0.9), -2.2)}]
	n.add_story("K12", "sargici", _spot(c + Vector2(0, -1.2)), {"grp": "b1", "kimlik": {"ad": "Sargıcı kadın", "cemaat": "Türk", "meslek": "", "etiket": "Sargıcı kadın"}})
	# ---- bölüm 2: Sarımsak Tepe
	var face := atan2(0.6, -0.8)
	karayilan = n.add_story("K08", "karayilan", _at(5.6, 1.6, face), {"grp": "b2h", "kimlik": {"ad": "Karayılan", "cemaat": "Türk", "meslek": "Molla Mehmet", "etiket": "Karayılan (Molla Mehmet)"}})
	for q in [["K02", -9.5], ["K01", -5.5], ["K08", 9.5]]:
		b2_allies.append(n.add_story(q[0], "b2a", _at(q[1], 1.5, face), {"grp": "b2h", "pose": "kneel", "rifle": true, "kimlik": {"ad": "Savunmacı", "cemaat": "Türk", "meslek": "", "etiket": "Savunmacı"}}))
	ally0 = n.add_story("K02", "b2a0", _at(-2.6, 1.5, face), {"grp": "b2ha0", "pose": "kneel", "rifle": true, "kimlik": {"ad": "Savunmacı", "cemaat": "Türk", "meslek": "", "etiket": "Savunmacı"}})
	var rear := _rot(0.0, R0 - 28.0)
	y_h = {"from": _at(-2.6, 2.6, face), "to": _spot(rear + Vector2(1.2, 0))}
	y_h["a"] = n.add_story("K02", "yaraliH", y_h["from"], {"grp": "b2hy", "pose": "sit", "kimlik": {"ad": "Yaralı savunmacı", "cemaat": "Türk", "meslek": "", "etiket": "Yaralı savunmacı"}})
	var ek: Vector2 = pt["enkaz"]
	y_c = {"from": _spot(ek, atan2(c.x - ek.x, c.y - ek.y)), "to": _spot(c + Vector2(1.5, -0.4), 2.4)}
	y_c["a"] = n.add_story("K11", "enkaz", y_c["from"], {"grp": "b2cy", "pose": "sit", "kimlik": {"ad": "Enkazdaki kadın", "cemaat": "Türk", "meslek": "", "etiket": "Enkazdaki kadın"}})
	n.add_story("K06", "b2y2", _spot(c + Vector2(-1.4, 0.8), -2.2), {"grp": "b2c", "pose": "sit", "kimlik": {"ad": "Yaralı", "cemaat": "Türk", "meslek": "", "etiket": "Yaralı"}})
	pt["post"] = _rot(2.6 / R0, R0 - 1.7)
	pt["rear"] = rear
	# ---- bölüm 3
	for q in [["K02", 2.0, 0.3, 2.3], ["K06", -1.9, 0.6, -2.2], ["K01", 0.4, 2.1, 3.0]]:
		var sp := c + Vector2(q[1], q[2])
		if not city.blocked(sp.x, sp.y, 0.3):
			n.add_story(q[0], "b3y", _spot(sp, q[3]), {"grp": "b3", "pose": "sit", "kimlik": {"ad": "Yaralı", "cemaat": "Türk", "meslek": "", "etiket": "Yaralı"}})
	# dere boyu geçiş noktaları (bölüm 6 ve 10)
	pt["dere0"] = city.resolve(Vector2(20, -157), 0.4)
	pt["dere1"] = city.resolve(Vector2(215, -130), 0.4)
	# ---- bölüm 10: son ununu paylaşan anne ve komşusu; avluda çekirdek kıranlar; zehirlenen iki yetişkin; han avlusundaki
	#      hamal ve yaşlı adam; kar altında bekleyen haberci. (Çocuklara yönelik hiçbir zarar sahnelenmez.)
	n.add_story("K03", "b10anne", n.spot(m.xl(-34.0) + 0.8, -34.0, 1, 0), {"grp": "b10a", "kimlik": {"ad": "Anne", "cemaat": "Türk", "meslek": "", "etiket": "Anne"}})
	n.add_story("K11", "b10komsu", n.spot(m.xr(-58.0) - 0.8, -58.0, -1, 0), {"grp": "b10a", "kimlik": {"ad": "Komşu kadın", "cemaat": "Türk", "meslek": "", "etiket": "Komşu kadın"}})
	var kiran := []
	for q in [["K05", 1.9, -0.4], ["K03", -1.7, 0.2], ["K12", 0.3, 1.9]]:
		var sp10 := c + Vector2(q[1], q[2])
		if not city.blocked(sp10.x, sp10.y, 0.3):
			kiran.append(n.add_story(q[0], "b10kiran", _spot(sp10, atan2(c.x - sp10.x, c.y - sp10.y)), {"grp": "b10b", "pose": "kneel", "kimlik": {"ad": "Çekirdek kıran kadın", "cemaat": "Türk", "meslek": "", "etiket": "Çekirdek kıran kadın"}}))
	pt["b10kiran"] = kiran
	for q in [["K02", m.xr(-22.0) - 0.8, -22.0, -1, 1.4, 0.5, 2.3], ["K01", m.xl(-70.6) + 0.8, -70.6, 1, -1.4, 0.8, -2.2]]:
		var fr10 := n.spot(q[1], q[2], q[3], 0)
		var d10 := {"from": fr10, "to": _spot(c + Vector2(q[4], q[5]), q[6])}
		d10["a"] = n.add_story(q[0], "b10z%d" % (y10.size() + 1), fr10, {"grp": "b10z%d" % (y10.size() + 1), "pose": "sit", "kimlik": {"ad": "Hastalanan adam", "cemaat": "Türk", "meslek": "", "etiket": "Hastalanan adam"}})
		y10.append(d10)
	var han10: Vector2 = pt.get("han", pt["kale"])
	n.add_story("K06", "b10hamal", _spot(city.resolve(han10 + Vector2(1.6, 0.8), 0.4), 3.0), {"grp": "b10h", "kimlik": {"ad": "Hamal", "cemaat": "Türk", "meslek": "hamal", "etiket": "Hamal"}})
	n.add_story("K01", "b10ihtiyar", _spot(city.resolve(han10 + Vector2(-1.8, 1.4), 0.4), -2.6), {"grp": "b10h", "kimlik": {"ad": "Yaşlı adam", "cemaat": "Türk", "meslek": "", "etiket": "Yaşlı adam"}})
	n.add_story("K02", "b10haberci", _spot(pt["dere1"] + Vector2(2.2, -0.8), -PI * 0.5), {"grp": "b10k", "kimlik": {"ad": "Dışarıdan gelen haberci", "cemaat": "Türk", "meslek": "", "etiket": "Dışarıdan gelen haberci"}})
	# ---- bölüm 11: huruç kolundaki savunmacılar (dere boyu); Şeyh Fethullah Camii çevresinde bekleyenler ve haberi getiren adam
	var d11 := (pt["dere1"] - pt["dere0"]).normalized() as Vector2
	var s11 := Vector2(-d11.y, d11.x)
	for q in [[-1.6, "K08"], [0.2, "K02"], [1.7, "K01"]]:
		n.add_story(q[1], "b11s", _spot(pt["dere0"] + d11 * 3.8 + s11 * q[0], atan2(d11.x, d11.y)), {"grp": "b11a", "pose": "kneel", "rifle": true, "kimlik": {"ad": "Savunmacı", "cemaat": "Türk", "meslek": "", "etiket": "Savunmacı"}})
	var sfn := n.nav.nearest(Vector2(683, 780), 140.0)
	pt["sfc"] = n.nav.pos[sfn] if sfn >= 0 else pt.get("meydan", pt["kale"])
	var bd11 := ["K01", "K02", "K06", "K01", "K02", "K02", "K01"]
	for k in bd11.size():
		var a11 := k * TAU / bd11.size()
		var q11: Vector2 = pt["sfc"] + Vector2(cos(a11), sin(a11)) * (2.6 + (k % 2) * 1.3)
		if not city.blocked(q11.x, q11.y, 0.32):
			n.add_story(bd11[k], "b11bekleyen", _spot(q11, atan2(pt["sfc"].x - q11.x, pt["sfc"].y - q11.y)), {"grp": "b11c"})
	n.add_story("K02", "b11haberci", _spot(pt["sfc"] + Vector2(0.4, 0.3), 0.0), {"grp": "b11d", "kimlik": {"ad": "Camiden çıkan adam", "cemaat": "Türk", "meslek": "", "etiket": "Camiden çıkan adam"}})
	# ---- epilog: Fransız satın alma memuru, haberi getiren yolcu
	n.add_story("K09", "memur", n.spot(m.cx(-4.0) + 0.6, -4.0, -1, 0), {"grp": "ep1"})
	n.add_story("K06", "epyolcu", n.spot(m.xr(-14.0) - 0.8, -14.0, -1, 0), {"grp": "ep2", "kimlik": {"ad": "Yolcu", "cemaat": "Türk", "meslek": "", "etiket": "Yolcu"}})
	# ---- bölüm 9: fırıncı, yaşlı kadın ve torunu, iki çocuk, hamal; atölyedeki usta ve bahçedeki güvercinci
	n.add_story("K02", "firinci9", n.spot(m.xr(-10.0) - 0.8, -10.0, -1, 0), {"grp": "b9", "kimlik": {"ad": "Fırıncı", "cemaat": "Türk", "meslek": "fırıncı", "etiket": "Fırıncı"}})
	n.add_story("K12", "b9nine", n.spot(m.xl(-66.0) + 0.8, -66.0, 1, 0), {"grp": "b9", "pose": "sit", "kimlik": {"ad": "Yaşlı kadın", "cemaat": "Türk", "meslek": "", "etiket": "Yaşlı kadın"}})
	n.add_story("K04", "b9torun", n.spot(m.xl(-64.4) + 0.9, -64.4, 1, 0), {"grp": "b9", "kimlik": {"ad": "Torun", "cemaat": "Türk", "meslek": "çocuk", "etiket": "Yaşlı kadının torunu"}})
	n.add_story("K04", "b9cocuk", n.spot(m.xl(-30.0) + 0.8, -30.0, 1, 0), {"grp": "b9", "kimlik": {"ad": "Çocuk", "cemaat": "Türk", "meslek": "çocuk", "etiket": "Çocuk"}})
	n.add_story("K04", "b9cocuk", n.spot(m.xr(-53.0) - 0.8, -53.0, -1, 0), {"grp": "b9", "kimlik": {"ad": "Çocuk", "cemaat": "Türk", "meslek": "çocuk", "etiket": "Çocuk"}})
	n.add_story("K06", "b9hamal", n.spot(m.xr(-38.6) - 0.8, -38.6, -1, 0), {"grp": "b9", "kimlik": {"ad": "Hamal", "cemaat": "Türk", "meslek": "hamal", "etiket": "Hamal"}})
	pt["ahir"] = n.hp(m.xr(-36.7) - 0.6, -36.7)
	n.add_story("K06", "b9usta", n.spot(m.xr(-90.0) - 1.2, -90.0, -1, 0), {"grp": "b9a", "kimlik": {"ad": "Atölye ustası", "cemaat": "Türk", "meslek": "tüfekçi", "etiket": "Atölye ustası"}})
	n.add_story("K01", "b9kuscu", _spot(c + Vector2(1.0, 1.3), -2.4), {"grp": "b9a", "kimlik": {"ad": "Güvercinci", "cemaat": "Türk", "meslek": "", "etiket": "Güvercinci"}})
	# ---- bölüm 8: gözcü, kuşatma hattındaki komşu mahallenin sorumlusu ve dışarıdan gelen yolcu; yol üstünde Fransız nöbetçileri;
	#      tayına itiraz eden adam
	_b8_route()
	n.add_story("K02", "gozcu8", _spot(pt["cikis"] + Vector2(1.2, 0), street.rotation.y), {"grp": "b8", "kimlik": {"ad": "Gözcü", "cemaat": "Türk", "meslek": "", "etiket": "Gözcü"}})
	n.add_story("K08", "b8m", _spot(pt["b8_hedef"] + Vector2(1.0, 0.6), 0.0), {"grp": "b8m", "kimlik": {"ad": "Komşu mahallenin sorumlusu", "cemaat": "Türk", "meslek": "", "etiket": "Komşu mahallenin sorumlusu"}})
	n.add_story("K06", "b8yolcu", _spot(pt["b8_hedef"] + Vector2(-1.1, 0.8), 0.6), {"grp": "b8m", "kimlik": {"ad": "Dışarıdan gelen yolcu", "cemaat": "Türk", "meslek": "", "etiket": "Dışarıdan gelen yolcu"}})
	for q8 in pt["b8_guards"]:
		n.add_story("K09", "fr8", _spot(q8, 0.0), {"grp": "b8f"})
	n.add_story("K01", "b8itiraz", n.spot(m.xr(-20.0) - 0.8, -20.0, -1, 0), {"grp": "b8t", "kimlik": {"ad": "Öfkeli adam", "cemaat": "Türk", "meslek": "", "etiket": "Öfkeli adam"}})
	# ---- bölüm 7: sokak savunması. Çınarlı haritada yok; şehrin güneybatısında düz ve açık bir sokak seçilir (VARSAYIM)
	_b7_site()
	var a7: Vector2 = pt["b7_a"]
	var side7 := Vector2(-dir7.y, dir7.x)
	var yaw7 := atan2(dir7.x, dir7.y)
	var kim7 := {"ad": "Savunmacı", "cemaat": "Türk", "meslek": "", "etiket": "Savunmacı"}
	n.add_story("K08", "b7bas", _spot(a7 + dir7 * 5.6 + side7 * 1.6, yaw7), {"grp": "b7a", "kimlik": {"ad": "Sokak başı", "cemaat": "Türk", "meslek": "", "etiket": "Sokak başı"}})
	for q in [[-1.7, "K02"], [0.2, "K01"]]:
		n.add_story(q[1], "b7s", _spot(a7 + dir7 * 6.6 + side7 * q[0], yaw7), {"grp": "b7a", "pose": "kneel", "rifle": true, "kimlik": kim7})
	for q in [[-1.6, "K02"], [1.5, "K08"], [0.3, "K02"]]:
		n.add_story(q[1], "b7s", _spot(a7 - dir7 * 11.4 + side7 * q[0], yaw7), {"grp": "b7b", "pose": "kneel", "rifle": true, "kimlik": kim7})
	n.add_story("K03", "b7sivil", _spot(a7 - dir7 * 16.0 + side7 * 1.4, yaw7 + PI), {"grp": "b7c", "kimlik": {"ad": "Mahalleli kadın", "cemaat": "Türk", "meslek": "", "etiket": "Mahalleli kadın"}})
	n.add_story("K01", "b7sivil", _spot(a7 - dir7 * 18.5 - side7 * 1.3, yaw7 + PI), {"grp": "b7c", "kimlik": {"ad": "Yaşlı adam", "cemaat": "Türk", "meslek": "", "etiket": "Yaşlı adam"}})
	y7 = {"from": _spot(a7 - dir7 * 12.6 - side7 * 0.9, yaw7 + PI), "to": _spot(pt["b7_rear"] + side7 * 1.0, yaw7)}
	y7["a"] = n.add_story("K02", "b7y", y7["from"], {"grp": "b7y", "pose": "sit", "kimlik": {"ad": "Yaralı savunmacı", "cemaat": "Türk", "meslek": "", "etiket": "Yaralı savunmacı"}})
	# ---- bölüm 6: enkazdaki kadın, ikinci enkazın başındaki komşu; dere boyunda Fransız nöbetçileri ve hattın dışında bekleyen ulak
	y6 = {"from": _spot(pt["enkaz"], atan2(c.x - pt["enkaz"].x, c.y - pt["enkaz"].y)), "to": _spot(c + Vector2(1.5, -0.4), 2.4)}
	y6["a"] = n.add_story("K05", "b6k", y6["from"], {"grp": "b6k", "pose": "sit", "kimlik": {"ad": "Enkazdaki kadın", "cemaat": "Türk", "meslek": "", "etiket": "Enkazdaki kadın"}})
	pt["enkaz2"] = n.hp(m.xl(-86.0) + 2.4, -86.0)
	n.add_story("K12", "b6komsu", n.spot(m.xl(-86.0) + 2.0, -84.6, 0, -1), {"grp": "b6", "pose": "kneel", "kimlik": {"ad": "Komşu kadın", "cemaat": "Türk", "meslek": "", "etiket": "Komşu kadın"}})
	# dere yatağı (Alleben): güney kıyı boyunca geçiş; yerler VARSAYIMDIR
	for q in [Vector2(74, -142), Vector2(158, -131)]:
		var gq := city.resolve(q, 0.4)
		n.add_story("K09", "fr6", _spot(gq, PI), {"grp": "b6f"})
	n.add_story("K06", "ulak", _spot(pt["dere1"] + Vector2(2.2, 0.6), -PI * 0.5), {"grp": "b6u", "kimlik": {"ad": "Ulak", "cemaat": "Türk", "meslek": "", "etiket": "Ulak"}})
	# ---- bölüm 5: karargâhtan gelen haberci (kurmaca), toplantıyı uzaktan izleyen Fransız askerleri
	n.add_story("K08", "yaver", n.spot(m.xr(-14.0) - 0.8, -14.0, -1, 0), {"grp": "b5", "kimlik": {"ad": "Karargâh habercisi", "cemaat": "Türk", "meslek": "", "etiket": "Karargâh habercisi"}})
	if pt.has("meydan"):
		var md: Vector2 = pt["meydan"]
		var gz := n.nav.random_near(md, 24.0, 38.0, rng)
		pt["gozlem"] = n.nav.pos[gz] if gz >= 0 else md + Vector2(26, 0)
		var away: Vector2 = (pt["gozlem"] - md).normalized()
		var fn := n.nav.nearest(pt["gozlem"] + away * 22.0, 30.0)
		var fp: Vector2 = n.nav.pos[fn] if fn >= 0 else pt["gozlem"] + away * 20.0
		for k in 2:
			var q5 := fp + Vector2(-away.y, away.x) * (k * 1.6 - 0.8)
			n.add_story("K09", "fr", _spot(q5, atan2(-away.x, -away.y)), {"grp": "b5f"})
	# ---- bölüm 4
	n.add_story("K02", "gelen", n.spot(m.cx(-99.6), -99.6, 0, 1), {"grp": "b4g", "kimlik": {"ad": "Karanlıktaki gölge", "cemaat": "Türk", "meslek": "", "etiket": "Karanlıktaki gölge"}})
	n.add_story("K03", "b4kadin", n.spot(m.xr(-40.0) - 0.8, -40.0, -1, 0), {"grp": "b4", "kimlik": {"ad": "Mahalleli kadın", "cemaat": "Türk", "meslek": "", "etiket": "Mahalleli kadın"}})
	for q in [["K02", 2.0, 0.3, 2.3], ["K06", -1.9, 0.6, -2.2]]:
		var sp4 := c + Vector2(q[1], q[2])
		if not city.blocked(sp4.x, sp4.y, 0.3):
			n.add_story(q[0], "b4y", _spot(sp4, q[3]), {"grp": "b4", "pose": "sit", "kimlik": {"ad": "Yaralı nöbetçi", "cemaat": "Türk", "meslek": "", "etiket": "Yaralı nöbetçi"}})
	pt["bar_kabalti"] = n.hp(m.cx(-52.5), -51.0)
	n.add_story("K03", "aile1", n.spot(m.xl(-36.0) + 0.8, -36.0, 1, 0), {"grp": "b3"})
	n.add_story("K12", "aile2", n.spot(m.xr(-70.0) - 0.8, -70.0, -1, 0), {"grp": "b3"})


func _kim(ad: String) -> Dictionary:
	return {"ad": ad, "cemaat": "Türk", "meslek": "", "etiket": ad}


## Çevresinde r metre boyunca yapı olmayan açık arazi mi
func _clear(p: Vector2, r: float) -> bool:
	var x1 := city.min_x + (city.nx - 1) * city.step
	var z1 := city.min_z + (city.nz - 1) * city.step
	if p.x < city.min_x + r + 60.0 or p.y < city.min_z + r + 60.0 or p.x > x1 - r - 60.0 or p.y > z1 - r - 60.0:
		return false
	for ix2 in range(-3, 4):
		for iz2 in range(-3, 4):
			if city.blocked(p.x + ix2 * r / 3.0, p.y + iz2 * r / 3.0, 8.0):
				return false
	return true


## İstenen noktaya en yakın açık arazi
func _open_site(want: Vector2, r: float) -> Vector2:
	for ring in 18:
		var cnt := maxi(1, ring * 6)
		for k in cnt:
			var p := want + Vector2(cos(TAU * k / cnt), sin(TAU * k / cnt)) * ring * 45.0
			if _clear(p, r):
				return p
	push_warning("Kırsal sahne için açık yer bulunamadı: %s" % want)
	return want


## Kırsal sahnelerin yerleri. HEPSİ VARSAYIMDIR: şehir dışı haritası yok; yerler mevcut arazide yapı olmayan açıklıklara
## ve Alleben Deresi'nin şehir dışındaki kesimine yerleştirilir. Gerçek coğrafyayı (Kilis yolu, Kertil, Acar, Elmalı) göstermez.
func _rural_sites() -> void:
	pt["k1"] = _open_site(Vector2(1180, -180), 130.0)       # Karabıyıklı: pusu hattı
	pt["k3"] = _open_site(Vector2(-1750, -380), 170.0)      # Acar köyü; yol doğuya uzanır
	pt["k3_goz"] = pt["k3"] + Vector2(150, -18)
	# dere üstünde köprü ve değirmen yeri: şehrin batısında, iki yanı açık bir kesim
	var rv: Array = city.data["river"]
	var found := []
	for i in rv.size() - 1:
		var a := Vector2(rv[i][0], rv[i][1])
		var b := Vector2(rv[i + 1][0], rv[i + 1][1])
		var steps := int(a.distance_to(b) / 30.0)
		for k in steps:
			var p := a.lerp(b, float(k) / steps)
			if p.x > -1150.0 or p.x < -1980.0:
				continue
			if _clear(p, 110.0):
				found.append([p, (b - a).normalized()])
	if found.is_empty():
		found = [[Vector2(-1500, 172), Vector2(1, 0)], [Vector2(-1800, 186), Vector2(1, 0)]]
	var kb: Array = found[found.size() - 1]      # en doğudaki açık kesim: köprü
	var km: Array = found[0]                     # en batıdaki: değirmen
	pt["k5"] = kb[0]
	var across := Vector2(-kb[1].y, kb[1].x)
	pt["k5_dir"] = across if across.y < 0.0 else -across      # düşman kuzey yakadan gelir
	pt["k4"] = km[0] + Vector2(-km[1].y, km[1].x) * (16.0 if km[1].x > 0.0 else -16.0)   # değirmen güney kıyıda


## Alçak taş siper sırası (kalıcı): taşlar, siper kaydı ve çarpışma
## Dört köşeli yüz; sıra yanlışsa çevirir (dış normal n'ye göre)
func _q(g: Geo, a: Vector3, b: Vector3, c: Vector3, d: Vector3, n: Vector3, uv: Callable) -> void:
	if (b - a).cross(c - a).dot(n) < 0.0:
		g.quad(a, d, c, b, n, uv.call(a), uv.call(d), uv.call(c), uv.call(b))
	else:
		g.quad(a, b, c, d, n, uv.call(a), uv.call(b), uv.call(c), uv.call(d))


## ELMALI KÖPRÜSÜ — tek kemerli kesme taş köprü (kullanıcının gönderdiği günümüz fotoğrafına göre: basık yuvarlak kemer, açık renk
## kemer taşları, alçak dolu korkuluk ve üstünde harpuşta, iki başta kanat duvarları). 1920'deki hâli için ayrı bir belge yok:
## biçim fotoğraftan, ölçüler oyun arazisine göre VARSAYIM. c: orta nokta, d: köprü ekseni, deck: döşeme kotu, bed: dere tabanı.
func _arch_bridge(g: Geo, ring: Geo, c: Vector2, d: Vector2, deck: float, bed: float) -> void:
	var s := Vector2(-d.y, d.x)
	var yaw := atan2(d.x, d.y)
	var hl := 17.0
	var hw := 2.6
	var half := 6.0
	var crown := deck - 0.7
	var spring := minf(bed + 0.35, crown - 1.3)
	var rise := crown - spring
	var rr := (half * half + rise * rise) / (2.0 * rise)
	var cy := crown - rr
	var th0 := asin(clampf(half / rr, -1.0, 1.0))
	var y0 := bed - 1.6
	var p3 := func(u: float, v: float, y: float) -> Vector3: return Vector3(c.x + d.x * u + s.x * v, y, c.y + d.y * u + s.y * v)
	var n_seg := 14
	for sg in [-1.0, 1.0]:
		var v: float = sg * hw
		var nrm: Vector3 = Vector3(s.x, 0, s.y) * sg
		var uvf := func(q: Vector3) -> Vector2: return Vector2((q.x - c.x) * d.x + (q.z - c.y) * d.y, -q.y) / 2.6
		_q(g, p3.call(-hl, v, y0), p3.call(-half, v, y0), p3.call(-half, v, deck), p3.call(-hl, v, deck), nrm, uvf)
		_q(g, p3.call(half, v, y0), p3.call(hl, v, y0), p3.call(hl, v, deck), p3.call(half, v, deck), nrm, uvf)
		for i in n_seg:
			var t0 := lerpf(-th0, th0, float(i) / n_seg)
			var t1 := lerpf(-th0, th0, float(i + 1) / n_seg)
			var u0 := rr * sin(t0)
			var u1 := rr * sin(t1)
			_q(g, p3.call(u0, v, cy + rr * cos(t0)), p3.call(u1, v, cy + rr * cos(t1)), p3.call(u1, v, deck), p3.call(u0, v, deck), nrm, uvf)
			# kemer taşları: açık renk kuşak, yüzeyden 5 cm önde; taş taş ayrı görünsün diye aralıklı
			var r2 := rr + 0.5
			var vo: float = sg * (hw + 0.05)
			var ta := t0 + (t1 - t0) * 0.04
			var tb := t1 - (t1 - t0) * 0.04
			_q(ring, p3.call(rr * sin(ta), vo, cy + rr * cos(ta)), p3.call(rr * sin(tb), vo, cy + rr * cos(tb)), p3.call(r2 * sin(tb), vo, cy + r2 * cos(tb)), p3.call(r2 * sin(ta), vo, cy + r2 * cos(ta)), nrm, uvf)
	# kemer içi (alt yüz) ve ayakların iç yüzleri
	for i in n_seg:
		var t0b := lerpf(-th0, th0, float(i) / n_seg)
		var t1b := lerpf(-th0, th0, float(i + 1) / n_seg)
		var tm := (t0b + t1b) * 0.5
		var nd := -(Vector3(d.x, 0, d.y) * sin(tm) + Vector3.UP * cos(tm))
		var uvs := func(q: Vector3) -> Vector2: return Vector2((q.x - c.x) * s.x + (q.z - c.y) * s.y, (q.x - c.x) * d.x + (q.z - c.y) * d.y) / 2.6
		_q(g, p3.call(rr * sin(t0b), -hw, cy + rr * cos(t0b)), p3.call(rr * sin(t1b), -hw, cy + rr * cos(t1b)), p3.call(rr * sin(t1b), hw, cy + rr * cos(t1b)), p3.call(rr * sin(t0b), hw, cy + rr * cos(t0b)), nd, uvs)
	for sg2 in [-1.0, 1.0]:
		var uu: float = sg2 * half
		var uvi := func(q: Vector3) -> Vector2: return Vector2((q.x - c.x) * s.x + (q.z - c.y) * s.y, -q.y) / 2.6
		_q(g, p3.call(uu, -hw, y0), p3.call(uu, hw, y0), p3.call(uu, hw, spring), p3.call(uu, -hw, spring), Vector3(d.x, 0, d.y) * -sg2, uvi)
	# döşeme, korkuluk ve harpuşta
	g.box(Vector3(c.x, deck - 0.15, c.y), Vector3(hw * 2.0, 0.3, hl * 2.0), yaw)
	for sg3 in [-1.0, 1.0]:
		var pp: Vector2 = c + s * sg3 * (hw - 0.22)
		g.box(Vector3(pp.x, deck + 0.36, pp.y), Vector3(0.44, 0.72, hl * 2.0), yaw)
		ring.box(Vector3(pp.x, deck + 0.78, pp.y), Vector3(0.62, 0.12, hl * 2.0), yaw)
		# kanat duvarları: iki başta dışa açılan alçak duvarlar
		for e in [-1.0, 1.0]:
			var wp: Vector2 = c + d * e * (hl + 2.2) + s * sg3 * (hw + 1.3)
			g.box(Vector3(wp.x, city.ground(wp.x, wp.y) + 0.35, wp.y), Vector3(0.6, 1.5, 5.4), yaw + e * sg3 * 0.55)


## Köprü başındaki savaş alanı (Gaziantep Savunması panorama tablosundaki öğelerden esinlenildi: devrik araba, sandıklar, fıçılar,
## çuvallar, duman). Yerleşim oyun sahnelemesidir (VARSAYIM); sandık ve araba siper olarak da kullanılır.
func _battlefield(c: Vector2, d: Vector2, s: Vector2) -> void:
	var wood := Geo.new()
	var yaw := atan2(d.x, d.y)
	var crate := func(p: Vector2, sz: Vector3, rot: float, lift: float) -> void:
		wood.box(Vector3(p.x, city.ground(p.x, p.y) + sz.y * 0.5 + lift, p.y), sz, rot, 1.0)
	# cephane sandıkları: siperin arkasında iki öbek
	for q in [[-22.6, -6.6, 0.2], [-22.9, -5.6, -0.3], [-22.7, -6.1, 0.9], [-23.4, 3.2, 0.5], [-24.2, 3.9, -0.2]]:
		var cp: Vector2 = c + d * q[0] + s * q[1]
		crate.call(cp, Vector3(0.95, 0.5, 0.55), yaw + q[2], 0.5 if q == [-22.7, -6.1, 0.9] else 0.0)
	for q in [[-22.7, -6.1], [-23.8, 3.5]]:
		var kp: Vector2 = c + d * q[0] + s * q[1]
		combat.add_cover(kp, 0.9)
		city.add_circle(kp.x, kp.y, 0.75)
	rural.add_child(wood.commit(_plain("planks", Color(0.62, 0.5, 0.36))))
	# devrik araba (yan yatmış) ve geride ayakta bir araba
	_cart(c - d * 25.5 + s * 8.4, yaw + 0.5, true)
	_cart(c - d * 41.0 - s * 6.0, yaw - 0.3, false)
	# fıçılar
	var bar := CylinderMesh.new()
	bar.top_radius = 0.3
	bar.bottom_radius = 0.3
	bar.height = 0.85
	bar.radial_segments = 10
	bar.material = _plain("wood", Color(0.5, 0.38, 0.27))
	for q in [[-24.6, -9.2, false], [-25.3, -9.6, false], [-26.4, 6.0, true]]:
		var bp: Vector2 = c + d * q[0] + s * q[1]
		var mi := MeshInstance3D.new()
		mi.mesh = bar
		mi.position = Vector3(bp.x, city.ground(bp.x, bp.y) + (0.3 if q[2] else 0.43), bp.y)
		if q[2]:
			mi.rotation = Vector3(0, yaw + 0.8, PI * 0.5)
		rural.add_child(mi)
	# çuvallar: siperin iki ucunu uzatır
	if city.protos.has("cuval"):
		var xf := []
		for sg in [-1.0, 1.0]:
			for k in 5:
				var sp: Vector2 = c - d * (19.6 + (k % 2) * 0.35) + s * sg * (6.3 + k * 0.55)
				xf.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(1.1, 1.1, 1.1)), Vector3(sp.x, city.ground(sp.x, sp.y) + (0.32 if k % 2 else 0.0), sp.y)))
		city._multi(city.protos["cuval"], xf, 0.0, 160.0, true)
	# duman sütunları (yalnız Elmalı bölümünde çatışma başlayınca görünür)
	k5_smoke = Node3D.new()
	k5_smoke.visible = false
	rural.add_child(k5_smoke)
	var qm := QuadMesh.new()
	qm.size = Vector2(1.0, 1.0)
	var sm := StandardMaterial3D.new()
	sm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	sm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	sm.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	sm.vertex_color_use_as_albedo = true
	sm.albedo_texture = _puff_texture()
	qm.material = sm
	var grad := Gradient.new()
	grad.set_color(0, Color(0.2, 0.19, 0.18, 0.0))
	grad.add_point(0.12, Color(0.24, 0.22, 0.2, 0.85))
	grad.set_color(grad.get_point_count() - 1, Color(0.62, 0.6, 0.57, 0.0))
	var curve := Curve.new()
	curve.add_point(Vector2(0, 0.25))
	curve.add_point(Vector2(1, 1.0))
	for q in [[62.0, -14.0], [84.0, 20.0], [-27.0, 9.4], [36.0, 34.0]]:
		var pp: Vector2 = c + d * q[0] + s * q[1]
		var ps := CPUParticles3D.new()
		ps.mesh = qm
		ps.amount = 70
		ps.lifetime = 9.0
		ps.preprocess = 9.0
		ps.direction = Vector3(0.25, 1, 0.1)
		ps.spread = 9.0
		ps.gravity = Vector3(0.22, 0.0, 0.08)
		ps.initial_velocity_min = 1.3
		ps.initial_velocity_max = 2.2
		ps.scale_amount_min = 9.0
		ps.scale_amount_max = 17.0
		ps.scale_amount_curve = curve
		ps.color_ramp = grad
		ps.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
		ps.emission_sphere_radius = 0.8
		ps.position = Vector3(pp.x, city.ground(pp.x, pp.y) + 0.5, pp.y)
		ps.visibility_aabb = AABB(Vector3(-12, -2, -12), Vector3(24, 34, 24))
		k5_smoke.add_child(ps)


var k5_smoke: Node3D


## Yumuşak kenarlı duman topağı dokusu
func _puff_texture() -> GradientTexture2D:
	var gr := Gradient.new()
	gr.set_color(0, Color(1, 1, 1, 1))
	gr.set_color(1, Color(1, 1, 1, 0))
	var t := GradientTexture2D.new()
	t.gradient = gr
	t.fill = GradientTexture2D.FILL_RADIAL
	t.fill_from = Vector2(0.5, 0.5)
	t.fill_to = Vector2(0.5, 0.0)
	t.width = 64
	t.height = 64
	return t


## İki tekerlekli yük arabası (kağnı benzeri; biçim VARSAYIM). tipped: yan yatmış.
var _plain_cache := {}


## Köşe rengi kullanmayan düz ahşap/tahta malzemesi (sahne eşyaları için)
func _plain(key: String, c: Color) -> StandardMaterial3D:
	if not _plain_cache.has(key):
		var m: StandardMaterial3D = city._pbr(key, Color.WHITE, false)
		m.albedo_color = c
		_plain_cache[key] = m
	return _plain_cache[key]


func _cart(p: Vector2, yaw: float, tipped: bool) -> void:
	var root := Node3D.new()
	root.position = Vector3(p.x, city.ground(p.x, p.y) + (0.62 if tipped else 0.0), p.y)
	root.rotation = Vector3(0, yaw, 1.32 if tipped else 0.0)
	rural.add_child(root)
	var wd: Material = _plain("planks", Color(0.62, 0.5, 0.36))
	var add := func(mesh: Mesh, pos: Vector3, rot: Vector3, mat: Material) -> void:
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		mi.position = pos
		mi.rotation = rot
		mi.material_override = mat
		root.add_child(mi)
	var bed := BoxMesh.new()
	bed.size = Vector3(1.25, 0.1, 2.4)
	add.call(bed, Vector3(0, 0.78, 0), Vector3.ZERO, wd)
	var side := BoxMesh.new()
	side.size = Vector3(0.06, 0.42, 2.4)
	for sx in [-1.0, 1.0]:
		add.call(side, Vector3(sx * 0.6, 1.02, 0), Vector3.ZERO, wd)
	var pole := BoxMesh.new()
	pole.size = Vector3(0.09, 0.09, 2.2)
	add.call(pole, Vector3(0, 0.7, 2.2), Vector3(0.12, 0, 0), _plain("wood", Color(0.5, 0.38, 0.27)))
	var axle := BoxMesh.new()
	axle.size = Vector3(1.7, 0.1, 0.1)
	add.call(axle, Vector3(0, 0.6, 0), Vector3.ZERO, _plain("wood", Color(0.5, 0.38, 0.27)))
	var rim := TorusMesh.new()
	rim.inner_radius = 0.52
	rim.outer_radius = 0.6
	rim.rings = 18
	rim.ring_segments = 6
	var spoke := BoxMesh.new()
	spoke.size = Vector3(0.05, 1.08, 0.06)
	for sx in [-1.0, 1.0]:
		add.call(rim, Vector3(sx * 0.8, 0.6, 0), Vector3(0, 0, PI * 0.5), _plain("wood", Color(0.5, 0.38, 0.27)))
		for k in 4:
			add.call(spoke, Vector3(sx * 0.8, 0.6, 0), Vector3(k * PI * 0.25, 0, 0), _plain("wood", Color(0.5, 0.38, 0.27)))
	combat.add_cover(p, 1.1)
	city.add_circle(p.x, p.y, 0.95)


func _cover_line(g: Geo, center: Vector2, along: Vector2, half: float) -> void:
	var lat := -half
	while lat <= half + 0.01:
		var p := center + along * lat
		var y := city.ground(p.x, p.y)
		g.box(Vector3(p.x, y + 0.2, p.y), Vector3(0.85, 0.42, 0.5), rng.randf() * 3.0)
		g.box(Vector3(p.x, y + 0.58, p.y), Vector3(0.72, 0.36, 0.46), rng.randf() * 3.0)
		combat.add_cover(p, 0.65)
		city.add_circle(p.x, p.y, 0.45)
		lat += 0.85


func _lanes(key: String, post: Vector2, e: Vector2, dists: Array) -> void:
	var side := Vector2(-e.y, e.x)
	var out := []
	for off in [-9.0, -3.0, 3.0, 9.0]:
		var l := []
		for d in dists:
			l.append(post + e * d + side * (off + rng.randf_range(-1.5, 1.5)))
		out.append(l)
	lanes_k[key] = out


## Düz damlı taş kır evi (kalıcı; çarpışmalı)
func _hut(st: Geo, roof: Geo, p: Vector2, size: Vector3, yaw: float) -> void:
	var y := city.ground(p.x, p.y)
	st.box(Vector3(p.x, y + size.y * 0.5 - 0.3, p.y), size + Vector3(0, 0.6, 0), yaw)
	roof.box(Vector3(p.x, y + size.y + 0.06, p.y), Vector3(size.x + 0.5, 0.14, size.z + 0.5), yaw)
	var b := Basis(Vector3.UP, yaw)
	var poly := PackedVector2Array()
	for c in [Vector3(-1, 0, -1), Vector3(1, 0, -1), Vector3(1, 0, 1), Vector3(-1, 0, 1)]:
		var v := b * Vector3(c.x * size.x * 0.5, 0, c.z * size.z * 0.5)
		poly.append(p + Vector2(v.x, v.z))
	city.add_poly(poly)


func _rural_props() -> void:
	rural = Node3D.new()
	add_child(rural)
	var stones := Geo.new()
	var walls := Geo.new()
	var roofs := Geo.new()
	var rocks := Geo.new()
	# Karabıyıklı: pusu hattı (kuzey–güney), düşman doğudan
	_cover_line(stones, pt["k1"], Vector2(0, 1), 11.0)
	_lanes("k1", pt["k1"], Vector2(1, 0), [78.0, 50.0, 27.0])
	# Acar köyü ve Kertil pususu
	var s3: Vector2 = pt["k3"]
	for q in [[-9, -8, 7, 6, 0.2], [-12, 5, 6, 8, -0.1], [4, 10, 8, 6, 0.4], [9, -9, 6, 7, 0.0], [-2, -14, 7, 5, 0.3], [14, 3, 6, 6, -0.3]]:
		_hut(walls, roofs, s3 + Vector2(q[0], q[1]), Vector3(q[2], 3.4, q[3]), q[4])
	_cover_line(stones, pt["k3_goz"] + Vector2(2.0, 0), Vector2(0, 1), 10.0)
	_lanes("k3", pt["k3_goz"], Vector2(1, 0), [80.0, 52.0, 28.0])
	for key in ["k1", "k3"]:
		for l in lanes_k[key]:
			for p in l:
				var y := city.ground(p.x, p.y)
				rocks.box(Vector3(p.x + 1.3, y + 0.4, p.y), Vector3(1.8, 0.9, 1.3), rng.randf() * 3.0)
	# Dokurcum Değirmeni: tek taş yapı
	_hut(walls, roofs, pt["k4"], Vector3(8.0, 4.6, 11.0), 0.15)
	# Elmalı Köprüsü: dere üstünde taş döşeme ve korkuluklar; güney başında siper
	var b5: Vector2 = pt["k5"]
	var d5: Vector2 = pt["k5_dir"]
	var s5 := Vector2(-d5.y, d5.x)
	var yaw := atan2(d5.x, d5.y)
	var deck := maxf(city.ground((b5 - d5 * 16.0).x, (b5 - d5 * 16.0).y), city.ground((b5 + d5 * 16.0).x, (b5 + d5 * 16.0).y)) + 0.25
	var ring5 := Geo.new()
	_arch_bridge(walls, ring5, b5, d5, deck, city.ground(b5.x, b5.y))
	rural.add_child(ring5.commit(_stone_mat(Color(0.97, 0.93, 0.82))))
	city.bridges.append({"x": b5.x, "z": b5.y, "ang": -atan2(d5.y, d5.x), "len": 34.0, "w": 4.8, "y": deck})
	_battlefield(b5, d5, s5)
	print("KIRSAL k5=%.1f,%.1f yon=%.3f,%.3f" % [b5.x, b5.y, d5.x, d5.y])
	_cover_line(stones, b5 - d5 * 19.4, s5, 5.6)
	var out5 := []
	# YANDAN ÇEVİRME (oyun sahnelemesi, VARSAYIM): iki kol köprünün iki yanından dereyi geçip siperin yanlarına sarkar
	for sg5 in [-1.0, 1.0]:
		var fl := [b5 + d5 * 70.0 + s5 * sg5 * 40.0, b5 + d5 * 15.0 + s5 * sg5 * 37.0, b5 - d5 * 11.0 + s5 * sg5 * 23.0]
		for q5 in [fl[0], fl[2]]:
			rocks.box(Vector3(q5.x, city.ground(q5.x, q5.y) + 0.4, q5.y) - Vector3(d5.x, 0, d5.y) * 1.3, Vector3(1.8, 0.9, 1.3), rng.randf() * 3.0)
		out5.append(fl)
	for off in [-6.0, 0.0, 6.0]:
		var l5 := []
		for dd in [72.0, 46.0, 24.0]:
			l5.append(b5 + d5 * dd + s5 * off)
			var y5 := city.ground(l5[l5.size() - 1].x, l5[l5.size() - 1].y)
			rocks.box(Vector3(l5[l5.size() - 1].x, y5 + 0.4, l5[l5.size() - 1].y) - Vector3(d5.x, 0, d5.y) * 1.3, Vector3(1.8, 0.9, 1.3), rng.randf() * 3.0)
		out5.append(l5)
	lanes_k["k5"] = out5
	rural.add_child(stones.commit(_stone_mat(Color(0.8, 0.75, 0.64))))
	rural.add_child(walls.commit(_stone_mat(Color(0.86, 0.8, 0.66))))
	rural.add_child(roofs.commit(street.mats.flat, false))
	rural.add_child(rocks.commit(_stone_mat(Color(0.6, 0.57, 0.51))))


func _cfg_k(key: String, tag: String, spawn: Vector2, waves: Array, limit: float) -> Dictionary:
	var al := []
	for x in npcs.agents:
		if (x.tag == tag or x.tag == "karayilan1" or x.tag == "sahin5") and not x.hidden and x.grp in npcs.groups and npcs.groups[x.grp]:
			al.append(x)
	return {"allies": al, "spawns": [spawn, spawn + Vector2(0, 12), spawn - Vector2(0, 12)], "lanes": lanes_k[key], "waves": waves, "target_bias": 0.5, "limit": limit}


## Sarımsak Tepe: siper yayı üzerinde açı a, yarıçap r
func _rot(a: float, r: float) -> Vector2:
	var u := Vector2(0.6, -0.8)
	return SARIMSAK + Vector2(u.x * cos(a) - u.y * sin(a), u.x * sin(a) + u.y * cos(a)) * r


func _at(m: float, back: float, yaw: float) -> Dictionary:
	return _spot(_rot(m / R0, R0 - back), yaw)


# ================================================================ sahne eşyaları
## Kahraman sokağın yerel z konumunda sokağı kapatan barikat (3 katman). Ortada dar bir geçit kalır: sakinler ve oyuncu oradan geçer.
func _barricade(z: float, narrow: bool) -> Array:
	var m := street
	var layers := []
	var gap := 1.3 if narrow else 1.6
	var c: float = m.cx(z)
	for li in 3:
		var st := Geo.new()
		var wood := Geo.new()
		var sack := Geo.new()
		for half in [[m.xl(z) + 0.15, c - gap * 0.5], [c + gap * 0.5, m.xr(z) - 0.15]]:
			var x: float = half[0] + 0.25
			while x < half[1] - 0.1:
				if li == 0:
					st.box(Vector3(x, 0.19, z + randf_range(-0.08, 0.08)), Vector3(0.48, 0.36, 0.46), randf_range(-0.2, 0.2))
					st.box(Vector3(x + 0.05, 0.2, z + 0.46), Vector3(0.44, 0.3, 0.4), randf_range(-0.25, 0.25))
				elif li == 1:
					st.box(Vector3(x + 0.2, 0.55, z + 0.12), Vector3(0.46, 0.34, 0.42), randf_range(-0.25, 0.25))
				else:
					sack.box(Vector3(x, 0.9, z + 0.14), Vector3(0.6, 0.3, 0.42), randf_range(-0.4, 0.4), 1.0)
				x += 0.52
			var mid: float = (half[0] + half[1]) * 0.5
			var w: float = half[1] - half[0]
			if li == 1 and w > 0.5:
				wood.box(Vector3(mid, 0.78, z - 0.2), Vector3(w * 0.94, 0.14, 0.16), 0.0, 1.2)
			if li == 2 and w > 0.5:
				wood.box(Vector3(mid, 1.02, z - 0.3), Vector3(w * 0.7, 0.05, 0.8), 0.0, 1.2)
		var group := Node3D.new()
		group.add_child(st.commit(m.mats.stone2))
		group.add_child(wood.commit(m.mats.planks))
		group.add_child(sack.commit(m.mats.sack))
		m.add_child(group)
		layers.append(group)
	# çarpışma: iki yarım, ortada geçit
	var sol := []
	for half in [[m.xl(z) + 0.15, c - gap * 0.5], [c + gap * 0.5, m.xr(z) - 0.15]]:
		var cs := CollisionShape3D.new()
		var b := BoxShape3D.new()
		b.size = Vector3(half[1] - half[0], 1.1, 0.9)
		cs.shape = b
		cs.position = Vector3((half[0] + half[1]) * 0.5, 0.55, z + 0.15)
		m.solids.add_child(cs)
		sol.append(cs)
	return [layers, sol]


func _props() -> void:
	var m := street
	_rural_props()
	# ---- bölüm 1: barikatlar (çarşı ucu, kabaltı önü hazır; kale ucundaki oyuncunun taşıdığı taşlarla yükselir), taş yığını
	for q in [[6.5, false, false], [-52.5, true, false], [-97.0, false, true]]:
		var b := _barricade(q[0], q[1])
		for lay in b[0]:
			lay.position.y = m.drop(m.cx(q[0]), q[0])
		for sol in b[1]:
			sol.position.y += m.drop(m.cx(q[0]), q[0])
		bars.append({"layers": b[0], "solids": b[1], "buildable": q[2]})
	var g := Geo.new()
	for i in 22:
		var a := rng.randf() * TAU
		var r := rng.randf()
		g.box(Vector3(m.xr(-82.0) - 1.3 + cos(a) * r, 0.14 + (1.0 - r) * 0.5 * rng.randf(), -82.0 + sin(a) * r * 0.8), Vector3(rng.randf_range(0.3, 0.6), rng.randf_range(0.22, 0.42), rng.randf_range(0.28, 0.5)), rng.randf() * 3.0)
	pile = g.commit(m.mats.stone2)
	m.add_child(pile)
	pile.position.y = m.drop(m.xr(-82.0) - 1.3, -82.0)
	seats1 = Node3D.new()
	add_child(seats1)
	for y in yarali:
		for s in [y["from"], y["to"]]:
			_seat(seats1, _v(s) - Vector2(sin(s["yaw"]), cos(s["yaw"])) * 0.1)
	# ---- bölüm 2: Sarımsak Tepe'nin ön yamacında taş siper (dorukta durunca yamaç tümsekten görünmez), düşmanın sıçradığı kayalar
	hill = Node3D.new()
	add_child(hill)
	city2 = Node3D.new()
	add_child(city2)
	var wall := Geo.new()
	var mm := -14.0
	while mm <= 14.01:
		if absf(mm) >= 0.8:   # ortada dar geçit
			var p := _rot(mm / R0, R0)
			var y := city.ground(p.x, p.y)
			wall.box(Vector3(p.x, y + 0.2, p.y), Vector3(0.9, 0.42, 0.5), rng.randf() * 3.0)
			wall.box(Vector3(p.x + (rng.randf() - 0.5) * 0.2, y + 0.58, p.y + (rng.randf() - 0.5) * 0.2), Vector3(0.8, 0.36, 0.46), rng.randf() * 3.0)
			if rng.randf() < 0.6:
				wall.box(Vector3(p.x, y + 0.9, p.y), Vector3(0.6, 0.3, 0.4), rng.randf() * 3.0)
			combat.add_cover(p, 0.7)
			hill_cols.append(city.add_circle(p.x, p.y, 0.5))
		mm += 0.92
	hill.add_child(wall.commit(_stone_mat(Color(0.81, 0.76, 0.65))))
	var rocks := Geo.new()
	for a in [-0.36, -0.12, 0.12, 0.36]:
		var lane := []
		for r in [R0 + 75.0, R0 + 47.0, R0 + 25.0]:
			var p := _rot(a + (rng.randf() - 0.5) * 0.1, r + (rng.randf() - 0.5) * 6.0)
			var y := city.ground(p.x, p.y)
			rocks.box(Vector3(p.x, y + 0.4, p.y), Vector3(1.7 + rng.randf() * 0.6, 0.9 + rng.randf() * 0.4, 1.2 + rng.randf() * 0.4), rng.randf() * 3.0)
			rocks.box(Vector3(p.x + 0.3, y + 0.9, p.y - 0.2), Vector3(0.9, 0.6, 0.8), rng.randf() * 3.0)
			lane.append(_rot(a, r + 1.4))
		lanes.append(lane)
	hill.add_child(rocks.commit(_stone_mat(Color(0.6, 0.57, 0.51))))
	for a in [-0.32, 0.0, 0.32]:
		spawns.append(_rot(a, R0 + 112.0))
	_seat(hill, _v(y_h["to"]))
	# enkaz yığını (bombardımanda yıkılan ev) ve oturma taşları
	var rub := Geo.new()
	var lx: float = m.xr(-60.0) - 1.2
	for i in 30:
		var a := rng.randf() * TAU
		var r := rng.randf() * 1.6
		rub.box(Vector3(lx + cos(a) * r * 0.7, 0.15 + (1.6 - r) * 0.45 * rng.randf(), -60.0 + sin(a) * r), Vector3(0.3 + rng.randf() * 0.5, 0.2 + rng.randf() * 0.35, 0.3 + rng.randf() * 0.4), rng.randf() * 3.0)
	var rm := rub.commit(m.mats.stone2)
	city2.add_child(rm)
	rm.global_transform = m.global_transform
	rm.global_position.y += m.drop(lx, -60.0)
	var rc := npcs.hp(lx + 0.5, -60.0)
	rubble_col = city.add_circle(rc.x, rc.y, 1.0)
	var c: Vector2 = pt["sargi"]
	for s in [_v(y_c["from"]), _v(y_c["to"]), c + Vector2(-1.4, 0.8)]:
		_seat(city2, s)
	for i in 3:
		var mi := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 1.0
		sm.height = 2.0
		sm.radial_segments = 10
		sm.rings = 6
		mi.mesh = sm
		var pm := StandardMaterial3D.new()
		pm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		pm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		pm.albedo_color = Color(0.72, 0.66, 0.54, 0.0)
		mi.material_override = pm
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.visible = false
		add_child(mi)
		puffs.append({"m": mi, "t": 0.0})
	# ---- bölüm 4: kale ucundaki barikat siperdir; kabaltı barikatına dayanan kapı kanadı; sızma kolunun geldiği sokak
	var bx: float = m.xl(-97.0) + 0.4
	while bx < m.xr(-97.0) - 0.3:
		combat.add_cover(npcs.hp(bx, -97.0), 0.6)
		bx += 0.8
	var dg := Geo.new()
	dg.box(Vector3(m.cx(-52.5) - 1.6, 0.95, -52.05), Vector3(0.9, 1.9, 0.07), 0.0, 1.2, Vector3(0.16, 0, 0))
	door4 = dg.commit(m.mats.planks)
	m.add_child(door4)
	door4.position.y = m.drop(m.cx(-52.5), -52.0)
	_b4_lanes()
	# ---- bölüm 11: huruç kolunun arkasına sindiği alçak taş sıra; düşmanın geldiği duraklar
	site11 = Node3D.new()
	add_child(site11)
	var d11 := (pt["dere1"] - pt["dere0"]).normalized() as Vector2
	var sd11 := Vector2(-d11.y, d11.x)
	var w11 := Geo.new()
	var lt := -2.6
	while lt <= 2.61:
		var p11: Vector2 = pt["dere0"] + d11 * 5.2 + sd11 * lt
		if not city.blocked(p11.x, p11.y, 0.2):
			var g11 := city.ground(p11.x, p11.y)
			w11.box(Vector3(p11.x, g11 + 0.2, p11.y), Vector3(0.8, 0.42, 0.5), rng.randf() * 3.0)
			w11.box(Vector3(p11.x, g11 + 0.58, p11.y), Vector3(0.7, 0.36, 0.46), rng.randf() * 3.0)
			combat.add_cover(p11, 0.65)
			cols11.append(city.add_circle(p11.x, p11.y, 0.45))
		lt += 0.8
	site11.add_child(w11.commit(_stone_mat(Color(0.8, 0.75, 0.64))))
	var len11: float = pt["dere0"].distance_to(pt["dere1"])
	for off in [-1.5, 0.0, 1.5]:
		var l11 := []
		for f in [0.7, 0.45, 0.24]:
			l11.append(pt["dere0"] + d11 * (len11 * f) + sd11 * off)
		lanes11.append(l11)
	# ---- bölüm 7: iki taş siper (ön hat ve arka hat), ortalarında dar geçit
	site7 = Node3D.new()
	add_child(site7)
	var w7 := Geo.new()
	var s7 := Vector2(-dir7.y, dir7.x)
	for off in [8.0, -10.0]:
		var lat := -2.3
		while lat <= 2.31:
			if absf(lat) >= 0.65:
				var p7: Vector2 = pt["b7_a"] + dir7 * off + s7 * lat
				if not city.blocked(p7.x, p7.y, 0.2):
					var y7g := city.ground(p7.x, p7.y)
					w7.box(Vector3(p7.x, y7g + 0.2, p7.y), Vector3(0.8, 0.42, 0.5), rng.randf() * 3.0)
					w7.box(Vector3(p7.x, y7g + 0.58, p7.y), Vector3(0.7, 0.36, 0.46), rng.randf() * 3.0)
					if rng.randf() < 0.6:
						w7.box(Vector3(p7.x, y7g + 0.9, p7.y), Vector3(0.55, 0.3, 0.4), rng.randf() * 3.0)
					combat.add_cover(p7, 0.65)
					cols7.append(city.add_circle(p7.x, p7.y, 0.45))
			lat += 0.78
	site7.add_child(w7.commit(_stone_mat(Color(0.8, 0.75, 0.64))))
	_seat(site7, _v(y7["from"]))
	_seat(site7, _v(y7["to"]))
	# ---- bölüm 6: ikinci yıkıntı (kurtarılamayan ev)
	var r6 := Geo.new()
	var l6: float = m.xl(-86.0) + 1.1
	for i in 34:
		var a6 := rng.randf() * TAU
		var d6 := rng.randf() * 1.8
		r6.box(Vector3(l6 + cos(a6) * d6 * 0.6, 0.15 + (1.8 - d6) * 0.5 * rng.randf(), -86.0 + sin(a6) * d6), Vector3(0.3 + rng.randf() * 0.6, 0.2 + rng.randf() * 0.4, 0.3 + rng.randf() * 0.5), rng.randf() * 3.0)
	ruin6 = r6.commit(m.mats.stone2)
	m.add_child(ruin6)
	ruin6.position.y = m.drop(l6, -86.0)
	var rc6 := npcs.hp(l6, -86.0)
	ruin6_col = city.add_circle(rc6.x, rc6.y, 1.0)
	# ---- bölüm 5: toplantı yerinde çekilen bayrak (direk + kumaş)
	flag5 = Node3D.new()
	add_child(flag5)
	if pt.has("meydan"):
		var fp5: Vector2 = pt["meydan"] + Vector2(-2.6, -2.2)
		var pole := MeshInstance3D.new()
		var pb := BoxMesh.new()
		pb.size = Vector3(0.09, 7.0, 0.09)
		pole.mesh = pb
		pole.material_override = Npc.mat(Color(0.3, 0.22, 0.15))
		flag5.add_child(pole)
		pole.position = Vector3(0, 3.5, 0)
		var cloth := MeshInstance3D.new()
		var qm := QuadMesh.new()
		qm.size = Vector2(2.4, 1.6)
		cloth.mesh = qm
		var fm := StandardMaterial3D.new()
		fm.albedo_texture = ImageTexture.create_from_image(_flag_image())
		fm.cull_mode = BaseMaterial3D.CULL_DISABLED
		fm.roughness = 1.0
		cloth.material_override = fm
		flag5.add_child(cloth)
		cloth.position = Vector3(1.25, 6.1, 0)
		flag5.global_position = Vector3(fp5.x, city.ground(fp5.x, fp5.y), fp5.y)
	# ---- bölüm 3
	seats3 = Node3D.new()
	add_child(seats3)
	for a in npcs.agents:
		if a.tag == "b3y":
			_seat(seats3, a.xz())


## Bölüm 8: sokağın kale ucundan 110–140 m ötede, yürüyerek varılan bir düğüm seçer; yolun üstüne iki nöbetçi yeri koyar.
func _b8_route() -> void:
	var nav := npcs.nav
	var north := npcs.hp(street.cx(-100.0), -112.0)
	var a := nav.nearest(north, 40.0)
	var cand := Array(nav._around(north, 140.0))
	cand.sort_custom(func(x: int, y: int) -> bool: return nav.pos[x].distance_to(north) > nav.pos[y].distance_to(north))
	var path := PackedInt32Array()
	for c in cand:
		var d := nav.pos[c].distance_to(north)
		if d < 110.0:
			break
		if npcs.hp(0, -50).distance_to(nav.pos[c]) < d:
			continue   # kahraman sokağın öbür yanına düşmesin
		path = nav.path(a, c, 4000)
		if path.size() >= 6:
			break
	var pts: Array = []
	for i in path:
		pts.append(nav.pos[i])
	if pts.size() < 6:
		var dv := (north - npcs.hp(street.cx(-100.0), -100.0)).normalized()
		pts = []
		for k in 8:
			pts.append(north + dv * (k * 16.0))
	pt["b8_hedef"] = pts[pts.size() - 1]
	var gs := []
	for f in [0.45, 0.75]:
		var k := int(f * (pts.size() - 1))
		var dirv: Vector2 = (pts[mini(k + 1, pts.size() - 1)] - pts[maxi(k - 1, 0)]).normalized()
		var best: Vector2 = pts[k]
		var bd := 0.0
		for sgn in [-1.0, 1.0]:
			var q := city.resolve(pts[k] + Vector2(-dirv.y, dirv.x) * sgn * 9.0, 0.4)
			var dd := q.distance_to(pts[k])
			if dd > bd:
				bd = dd
				best = q
		gs.append(best)
	pt["b8_guards"] = gs


## Bölüm 7: şehrin güneybatısında en az 95 m boyunca düz ve açık (iki yanı da görüş kesmeyen) bir sokak arar.
## b7_a: savunmanın merkezi (sokağın 25. metresi), dir7: düşmanın geldiği yön, b7_rear: geri (sokağın başı).
func _b7_site() -> void:
	var nav := npcs.nav
	var want := Vector2(-150, 480)
	var cand := Array(nav._around(want, 260.0))
	cand.sort_custom(func(x: int, y: int) -> bool: return nav.pos[x].distance_to(want) < nav.pos[y].distance_to(want))
	var a0 := pt.get("meydan", Vector2(160, 368)) as Vector2
	var b0 := a0 + Vector2(100, 0)
	var found := false
	for i in mini(cand.size(), 160):
		var p: Vector2 = nav.pos[cand[i]]
		for j in nav._around(p, 125.0):
			var q: Vector2 = nav.pos[j]
			var l := p.distance_to(q)
			if l < 95.0 or l > 125.0:
				continue
			var sd := Vector2(-(q - p).y, (q - p).x).normalized() * 1.6
			if city.los_blocked(p, q) or city.los_blocked(p + sd, q + sd) or city.los_blocked(p - sd, q - sd):
				continue
			a0 = p
			b0 = q
			found = true
			break
		if found:
			break
	if not found:
		push_warning("Bölüm 7: düz sokak bulunamadı, meydan kullanılıyor")
	dir7 = (b0 - a0).normalized()
	var a := a0 + dir7 * 25.0
	pt["b7_a"] = a
	pt["b7_rear"] = a0 + dir7 * 3.0
	pt["b7_start"] = a0 + dir7 * 6.0
	pt["b7_post1"] = a + dir7 * 6.3 - Vector2(-dir7.y, dir7.x) * 0.9
	pt["b7_post2"] = a - dir7 * 11.7 + Vector2(-dir7.y, dir7.x) * 0.6
	spawns7 = [b0]
	var len7 := a0.distance_to(b0) - 25.0
	for off in [-1.4, 0.0, 1.4]:
		var la := []
		var lb := []
		for f in [0.62, 0.42, 0.26]:
			la.append(a + dir7 * (8.0 + (len7 - 8.0) * f) + Vector2(-dir7.y, dir7.x) * off)
		for f in [0.6, 0.3, 0.08]:
			lb.append(a + dir7 * (len7 * f) + Vector2(-dir7.y, dir7.x) * off)
		lanes7a.append(la)
		lanes7b.append(lb)


func _cfg7(second: bool) -> Dictionary:
	var al := []
	for x in npcs.agents:
		if x.tag == "b7s" and not x.hidden and x.pose != "down":
			al.append(x)
	if second:
		return {"allies": al, "spawns": spawns7, "lanes": lanes7b, "waves": [{"n": 6, "gap": 2.2}, {"n": 4, "gap": 2.0}], "target_bias": 0.55, "limit": 130.0}
	return {"allies": al, "spawns": spawns7, "lanes": lanes7a, "waves": [{"n": 5, "gap": 2.5}], "target_bias": 0.55, "limit": 120.0}


## Ay yıldızlı bayrak dokusu (kırmızı zemin, beyaz hilal ve yıldız)
func _flag_image() -> Image:
	var img := Image.create(240, 160, false, Image.FORMAT_RGBA8)
	var red := Color(0.78, 0.06, 0.09)
	img.fill(red)
	var star := PackedVector2Array()
	for i in 10:
		var a := -PI * 0.5 + i * PI / 5.0 + PI
		star.append(Vector2(138, 80) + Vector2(cos(a), sin(a)) * (20.0 if i % 2 == 0 else 8.0))
	for y in 160:
		for x in 240:
			var p := Vector2(x, y)
			var moon := p.distance_to(Vector2(88, 80)) < 40.0 and p.distance_to(Vector2(98, 80)) > 32.0
			if moon or Geometry2D.is_point_in_polygon(p, star):
				img.set_pixel(x, y, Color(0.96, 0.95, 0.92))
	img.generate_mipmaps()
	return img


## Bölüm 4: sızma kolu kale ucundaki barikata, sokağın şehre açılan ucundan yol ağını izleyerek yaklaşır
func _b4_lanes() -> void:
	var nav := npcs.nav
	var north := npcs.hp(street.cx(-100.0), -112.0)
	var dirv := (north - npcs.hp(street.cx(-100.0), -100.0)).normalized()
	var a := nav.nearest(north, 40.0)
	var best := -1
	var bs := -1e9
	for i in nav._around(north, 90.0):
		var v := nav.pos[i] - north
		var l := v.length()
		if l < 55.0 or l > 90.0:
			continue
		var sc := v.normalized().dot(dirv)
		if sc > bs:
			bs = sc
			best = i
	var pts: Array = []
	if a >= 0 and best >= 0:
		for i in nav.path(a, best, 2500):
			pts.append(nav.pos[i])
	if pts.size() < 3:
		pts = [north + dirv * 5.0, north + dirv * 30.0, north + dirv * 60.0]
	pts.reverse()   # uzaktan yakına
	spawns4 = [pts[0]]
	for off in [-1.0, 0.0, 1.0]:
		var lane := []
		for f in [0.45, 0.7, 0.92]:
			var q: Vector2 = pts[int(f * (pts.size() - 1))]
			lane.append(q + Vector2(-dirv.y, dirv.x) * off)
		lanes4.append(lane)


func _cfg4() -> Dictionary:
	var al := []
	for x in npcs.agents:
		if x.tag == "savunmaci" and not x.hidden and x.xz().distance_to(pt["kale"]) < 14.0:
			al.append(x)
	return {"allies": al, "spawns": spawns4, "lanes": lanes4, "waves": [{"n": 4, "gap": 3.0}, {"n": 3, "gap": 2.5}], "target_bias": 0.55, "limit": 120.0}


# ================================================================ senaryolar
func _build() -> void:
	var usta := Callable(self, "_usta")
	var gezen := Callable(self, "_gezen")
	var sivil := Callable(self, "_sivil")
	# ---------------- PROLOG
	var a := [
		{"t": "card", "big": "GAZİANTEP · 17 ARALIK 1918", "small": "Bir zamanlar bu şehirde hayat vardı…"}, {"t": "groups", "on": ["p1"]},
		{"t": "title", "title": "Son Normal Gün"},
		{"t": "talk", "who": usta, "text": "Ustanla konuş", "line": "Günaydın çırak. Fırından ekmeği al, sonra çeşmeden su getir."},
		{"t": "talk", "who": _is("firinci"), "text": "Fırıncıdan ekmek al", "line": "Sıcak sıcak, daha yeni çıktı. Ustana selam söyle."},
		{"t": "goto", "p": pt["cesme"], "r": 3.0, "text": "Çeşmeden su doldur", "label": "Çeşme"},
		{"t": "talk", "who": usta, "text": "Ekmeği ve suyu ustana götür", "line": "Aferin. Şu siparişi Millet Hanı'na bırak; dönüşte Alaüddevle Camii'nin önünden geç, çarşıyı tanı."},
	]
	if pt.has("han"):
		a.append({"t": "goto", "p": pt["han"], "r": 14.0, "text": "Siparişi Millet Hanı'na götür", "label": "Millet Hanı"})
	if pt.has("cami"):
		a.append({"t": "goto", "p": pt["cami"], "r": 14.0, "text": "Alaüddevle Camii'nin önünden geç", "label": "Alaüddevle Camii"})
	a.append_array([
		{"t": "talk", "who": usta, "text": "Dükkâna dön", "line": "Geç kaldın. Sokakta bir hareket var, duydun mu?"},
		{"t": "card", "big": "İŞGAL BAŞLIYOR", "small": "17 Aralık 1918 · İngiliz birlikleri şehre giriyor", "donem": "1918 · İNGİLİZ İŞGALİ", "hava": "bulutlu"}, {"t": "groups", "on": ["p2"]},
		{"t": "title", "title": "Yabancı Askerler"},
		{"t": "goto", "p": pt["kontrol"], "r": 7.0, "text": "Sokağın başındaki askerleri gör", "label": "Askerler"},
		{"t": "talkN", "who": gezen, "n": 2, "text": "İki kişiye ne olduğunu sor", "line": "Şehre asker girmiş diyorlar. Hayırlısı olsun…"},
		{"t": "talk", "who": usta, "text": "Ustana haber ver", "line": "Kepengi indir. Bugün erken kapatıyoruz."},
		{"t": "date", "to": "b"},
	])
	var b := [
		{"t": "card", "big": "BAYRAK DEĞİŞİYOR", "small": "25 Ekim 1919 · Fransız kuvvetleri İngilizlerin yerini alıyor"}, {"t": "groups", "on": ["p3"]},
		{"t": "title", "title": "Bayrak Değişiyor"},
		{"t": "goto", "p": pt["kontrol"], "r": 7.0, "text": "Kontrol noktasındaki yeni askerleri gör", "label": "Kontrol noktası"},
		{"t": "talkN", "who": gezen, "n": 2, "text": "İki kişiyle konuş", "line": "İngiliz gitti, Fransız geldi. Dükkânlar yine erken kapanıyor."},
		{"t": "talk", "who": usta, "text": "Ustanla konuş", "line": "Değişen yalnız üniforma değil. Al şu kâğıdı; kimseye gösterme."},
		{"t": "groups", "on": ["p4"]}, {"t": "title", "title": "Gizli Haber"},
		{"t": "talk", "who": _is("ileri1"), "text": "Kâğıdı sokağın ilerisindeki ihtiyara götür", "line": "Okudum. Cevabı kâğıtla değil, sözle götüreceksin: \"Pazar günü, meydanda.\""},
		{"t": "talk", "who": _is("ileri2"), "text": "Cevabı bahçe kapısındaki adama ilet", "line": "Pazar günü, meydanda… Anlaşıldı. Sen bir şey görmedin."},
		{"t": "talk", "who": usta, "text": "Ustana dön", "line": "İyi iş çıkardın. Pazar günü sen de gel."},
		{"t": "date", "to": "c"},
	]
	var c := [
		{"t": "card", "big": "HALK TOPLANTISI", "small": "23 Kasım 1919 · Cemiyet-i İslamiye'nin çağrısıyla halk işgale karşı toplanıyor"}, {"t": "groups", "on": ["p3", "p5"], "off": ["p4"]},
		{"t": "title", "title": "Halk Toplantısı"},
	]
	if hatip != null:
		c.append({"t": "listen", "p": pt["meydan"], "r": 12.0, "text": "Meydandaki toplantıya git ve dinle", "label": "Meydan",
			"lines": [[hatip, "Bu şehir bizimdir."], [hatip, "İşgali tanımıyoruz. Sesimizi dünyaya duyuracağız."], [crowd[1 % crowd.size()], "Tanımıyoruz!"], [crowd[4 % crowd.size()], "Tanımıyoruz!"], [hatip, "Dağılmayın. Birlik olursak ayakta kalırız."]]})
	c.append_array([{"t": "card", "big": "Şehir artık eskisi gibi olmayacaktı.", "small": ""}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "heyet"}])
	chapters["a"] = a
	chapters["b"] = b
	chapters["c"] = c
	chapters["heyet"] = []
	# ================= SAVAŞA GİDEN YOL (Ocak – Mart 1920): dört ayrı tarihî hikâye, beş sahne =================
	# Olaylar birbirine KARIŞTIRILMAZ: Şehit Kâmil (21 Ocak 1920) ile Dokurcum'da öldürülen 14 çocuk (27–28 Mart 1920) ayrı olaylardır.
	# Çocuklara yönelik şiddet OYNATILMAZ ve GÖSTERİLMEZ; iki sahnede de çocuk figürü yoktur, olay bir yetişkin tanığın gözünden
	# ve ekrandaki yazıyla anlatılır. Tarihî sonuçlar SABİTTİR; çatışmalar "kazanılmaz".
	# Gerçek kişiler: Karayılan (Molla Mehmet) ve Şahin Bey (Mehmet Sait). Onlara yazılan sözler sahne veritabanındaki
	#   (antep/src/data/scenes.js) sözlerdir ve KURGUDUR; yalnız Şahin Bey'in "Düşman cesedimi çiğnemeden…" sözü ona ATFEDİLEN
	#   bilinen sözdür. Başka söz yazılmamıştır.
	# VARSAYIM: bütün kırsal yerler (bkz. _rural_sites); şehir dışı haritası yoktur.
	# ---------------- K1 · Karabıyıklı Baskını — 20 Ocak 1920 (doğrulanmış). KURGU: pusunun ayrıntısı, kişiler.
	var e1 := Vector2(1, 0)
	var post1 := {"p": pt["k1"] - e1 * 1.7, "yaw": atan2(-e1.x, -e1.y)}
	var cfgk1 := func() -> Dictionary: return _cfg_k("k1", "k1s", pt["k1"] + e1 * 125.0, [{"n": 6, "gap": 2.2}], 95.0)
	chapters["k1"] = [
		{"t": "card", "big": "SAVAŞA GİDEN YOL", "small": "Karabıyıklı Baskını — 20 Ocak 1920 · Bir mahalle savunmacısının gözünden"}, {"t": "groups", "on": ["k1"]}, {"t": "role", "role": "savunmaci", "weapon": true, "ammo": 25}, {"t": "tp", "p": pt["k1"] - e1 * 42.0, "yaw": post1["yaw"]},
		{"t": "title", "title": "Karabıyıklı Baskını"},
		{"t": "goto", "p": post1["p"], "r": 3.0, "text": "Pusu yerine ulaş", "label": "Pusu yeri"},
		{"t": "talk", "who": _is("karayilan1"), "text": "Karayılan'ı dinle", "line": "İşaret vermeden kimse kıpırdamasın."},
		{"t": "wait", "dur": 9.0, "text": "İşaret gelene kadar ateş açma"},
		{"t": "combat", "endless": true, "emir": "Kol toparlandı ve takviye aldı. Baskın bitti; geri çekil.", "text": "İşaret verildi — baskına katıl; çekilme emrine kadar dayan (sol tık: ateş, sağ tık: nişan, C: çömel)", "cfg": cfgk1, "start": post1},
		{"t": "goto", "p": pt["k1"] - e1 * 42.0, "r": 5.0, "text": "Geri çekilme emrine uy", "label": "Geri"},
		{"t": "card", "big": "Baskın yapıldı, kol çekildi.", "small": "Karabıyıklı · 20 Ocak 1920"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "k2"},
	]
	# ---------------- K2 · Şehit Kâmil — 21 Ocak 1920 (yerel anlatı; kaynakla doğrulanmadı).
	# Oyuncu müdahale edemez; olay ve çocuk gösterilmez. Anneye söz yazılmaz. KURGU: kalabalık, komşu ve esnafın sözleri.
	var k2 := [
		{"t": "card", "big": "SAVAŞA GİDEN YOL", "small": "21 Ocak 1920 · Bir esnafın gözünden"}, {"t": "groups", "on": ["p3", "k2a"]}, {"t": "role", "role": "esnaf"}, {"t": "tp", "p": pt["depo3"], "yaw": street.rotation.y},
		{"t": "title", "title": "21 Ocak 1920"},
		{"t": "goto", "p": npcs.hp(street.cx(-21.0), -21.0), "r": 4.0, "text": "Dükkânın önünden sokaktaki kalabalığa doğru yürü", "label": "Kalabalık"},
		{"t": "tp", "p": npcs.hp(street.cx(-25.0), -25.0), "yaw": street.rotation.y, "id": "kamil"},
		{"t": "card", "big": "21 OCAK 1920 · MEHMET KÂMİL", "small": "On dört yaşındaydı. Annesine uzanan askerlere karşı çıktı; öldürüldü. (yerel anlatı)", "dur": 10.0}, {"t": "groups", "on": ["k2b"], "off": ["p3"]},
		{"t": "wait", "dur": 10.0},
		{"t": "talk", "who": _is("k2komsu"), "text": "Annenin yanındaki komşuya ulaş", "line": "Anasının yanına kimse yaklaşamıyor. Sen git, mahalleye duyur."},
		{"t": "talkN", "who": gezen, "n": 3, "text": "Haberi üç kişiye duyur", "line": "Çocuktu daha…", "again": "Duydum… Çocuktu daha."},
		{"t": "card", "big": "Şehir o günü unutmadı.", "small": "Şehit Kâmil · 21 Ocak 1920", "dur": 7.0}, {"t": "wait", "dur": 7.0}, {"t": "date", "to": "k3"},
	]
	chapters["k2"] = k2
	for i in k2.size():
		if k2[i].get("id", "") == "kamil":
			i_kamil = i
	# ---------------- K3 · Kilis Yolu — Şubat 1920; 3 Şubat: Kertil (ana hikâye dosyası; kaynakla doğrulanmadı).
	# KURGU: çavuş, gözcü, konvoy nöbetçilerinin yeri, pusunun ayrıntısı. Şahin Bey'in sözü sahne veritabanındandır (kurgu).
	var goz: Vector2 = pt["k3_goz"]
	var post3 := {"p": goz, "yaw": atan2(-1.0, 0.0)}
	var cfgk3 := func() -> Dictionary: return _cfg_k("k3", "k3s", goz + Vector2(125, 0), [{"n": 6, "gap": 2.4}, {"n": 4, "gap": 2.0}], 110.0)
	chapters["k3"] = [
		{"t": "card", "big": "KİLİS YOLU", "small": "Şubat 1920 · Şahin Bey yolu kapatıyor · Bir habercinin gözünden"}, {"t": "groups", "on": ["k3", "k3f", "k3v"]}, {"t": "role", "role": "haberci"}, {"t": "tp", "p": pt["k3"] + Vector2(-48, 6), "yaw": atan2(-1.0, 0.0)},
		{"t": "title", "title": "Kilis Yolu"},
		{"t": "goto", "p": pt["k3"], "r": 6.0, "text": "Erzak ve mesajı Acar köyündeki karargâha ulaştır", "label": "Acar köyü", "give": {"erzak": 1}},
		{"t": "talk", "who": _is("sahin"), "text": "Erzakı ve mesajı Şahin Bey'e teslim et", "need": {"erzak": 1}, "line": "Bu yoldan araba geçmeyecek."},
		{"t": "talk", "who": _is("k3cavus"), "text": "Çavuştan görevini al", "line": "Gözcü yerine çık. Konvoyun nöbetçileri yol üstünde; yanlarından çömelerek geç, görünme."},
		{"t": "sneak", "p": goz, "r": 5.0, "near": 3.0, "guards": "k3fr", "start": {"p": pt["k3"] + Vector2(8, 0), "yaw": atan2(-1.0, 0.0)}, "text": "Konvoya görünmeden gözcü yerine çık (C: çömel)", "label": "Gözcü yeri"},
		{"t": "talk", "who": _is("k3gozcu"), "text": "Gözcüyle konuş", "line": "Araba, katır, piyade… Kertil'e varmadan durduracağız. Al şu tüfeği."},
		{"t": "card", "big": "3 ŞUBAT 1920 · KERTİL", "small": "İkmal koluna saldırı", "tarih": "3 Şubat 1920", "dur": 4.5}, {"t": "groups", "on": ["k3s"], "off": ["k3f"]}, {"t": "role", "role": "haberci", "weapon": true, "ammo": 25}, {"t": "tp", "p": goz, "yaw": post3["yaw"]},
		{"t": "combat", "text": "İkmal koluna yapılan saldırıya katıl", "cfg": cfgk3, "start": post3},
		{"t": "card", "big": "Yol o gün geçilmedi.", "small": "Kilis–Antep yolu · Şubat 1920"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "k4"},
	]
	# ---------------- K4 · Dokurcum Değirmeni — 27–28 Mart 1920 (anlatı; dayanak: 2019 TBMM konuşması ve resmî anma içerikleri).
	# HAFIZA SAHNESİ: oynanabilir çocuk çatışması yoktur, çocuk figürü yoktur, çocuklara ad uydurulmaz. Değirmene varınca
	# sesler kesilir; ekranda tarih ve olayın anısı belirir. KURGU: yardımcının sözü ("Dün buradan geçtiler…").
	var s3k: Vector2 = pt["k3"]
	var away4: Vector2 = (pt["k4"] - pt["k5"]).normalized()
	var k4 := [
		{"t": "card", "big": "DOKURCUM DEĞİRMENİ", "small": "27 Mart 1920 · Bir yardımcının gözünden"}, {"t": "groups", "on": ["k3v"]}, {"t": "role", "role": "yardimci"}, {"t": "tp", "p": s3k + Vector2(-3, 3), "yaw": 0.0},
		{"t": "title", "title": "Çıkınlar"},
		{"t": "goto", "p": s3k + Vector2(-9, -3.6), "r": 2.6, "text": "Ekmeği çıkınla", "label": "Ekmek", "give": {"cikin": 1}},
		{"t": "goto", "p": s3k + Vector2(4, 5.6), "r": 2.6, "text": "Bulguru çıkınla", "label": "Bulgur", "give": {"cikin": 1}},
		{"t": "goto", "p": s3k + Vector2(1, -2), "r": 2.6, "text": "Çıkınları yola çıkacak çocuklara bırak", "label": "Köy meydanı", "take": ["cikin"]},
		{"t": "card", "big": "28 MART 1920", "small": "Ertesi gün · Çocuklar dönmedi", "tarih": "28 Mart 1920", "dur": 5.0, "hava": "bulutlu"}, {"t": "tp", "p": city.resolve(pt["k4"] + away4 * 95.0 + Vector2(0, 30), 0.4), "yaw": 0.0},
		{"t": "title", "title": "Dokurcum Değirmeni"},
		{"t": "goto", "p": pt["k4"] + Vector2(0, 9.5), "r": 7.0, "text": "Değirmene ulaş", "label": "Dokurcum Değirmeni", "id": "mill"},
		{"t": "card", "big": "DOKURCUM DEĞİRMENİ · 27–28 MART 1920", "small": "Anlatıya göre yaşları dokuz ile on dört arasında on dört çocuk burada öldürüldü. Adları kaynaklarda yok.", "dur": 13.0},
		{"t": "wait", "dur": 13.0, "text": "«Dün buradan geçtiler. Gülüyorlardı.»"},
		{"t": "date", "to": "k5"},
	]
	chapters["k4"] = k4
	for i in k4.size():
		if k4[i].get("id", "") == "mill":
			i_mill = i
	# ---------------- K5 · Elmalı Köprüsü — 28 ya da 29 Mart 1920 (tarih kaynaklarda AYRIŞIR; fark korunur).
	# SABİT: Şahin Bey'in Elmalı Köprüsü'ndeki şehadeti değiştirilemez; çatışma kazanılamaz. Oyuncu son anda haberle gönderilir.
	# Şehadet gösterilmez; oyuncu çekildikten sonra yazıyla bildirilir.
	var b5v: Vector2 = pt["k5"]
	var d5v: Vector2 = pt["k5_dir"]
	var post5 := {"p": b5v - d5v * 20.9, "yaw": atan2(-d5v.x, -d5v.y)}
	var cfgk5 := func() -> Dictionary:
		var c5 := _cfg_k("k5", "k5s", b5v + d5v * 118.0, [{"n": 6, "gap": 2.0}, {"n": 7, "gap": 1.8}, {"n": 7, "gap": 1.8}], 80.0)
		var s5v := Vector2(-d5v.y, d5v.x)
		c5["spawns"] = [b5v + d5v * 118.0, b5v + d5v * 108.0 + s5v * 46.0, b5v + d5v * 108.0 - s5v * 46.0]
		return c5
	var k5 := [
		{"t": "card", "big": "ELMALI KÖPRÜSÜ", "small": "28 ya da 29 Mart 1920 · Kaynaklar tarihte ayrışır · Bir habercinin gözünden"}, {"t": "groups", "on": ["k5"]}, {"t": "role", "role": "haberci", "weapon": true, "ammo": 20}, {"t": "tp", "p": b5v - d5v * 62.0, "yaw": post5["yaw"]},
		{"t": "title", "title": "Elmalı Köprüsü"},
		{"t": "goto", "p": post5["p"], "r": 3.5, "text": "Köprü başındaki sipere mühimmat taşı", "label": "Köprü siperi", "give": {"fisek": 1}, "take": ["fisek"]},
		{"t": "talk", "who": _is("sahin5"), "text": "Şahin Bey'in yanına var", "line": "Düşman cesedimi çiğnemeden Antep'e giremez."},
		{"t": "combat", "endless": true, "emir": "Köprü tutulamıyor. Şahin Bey seni çağırıyor.", "text": "Köprü başında savunmaya katıl; önden yükleniyor, iki yandan dereyi geçiyorlar (düşman tükenmez)", "cfg": cfgk5, "start": post5},
		{"t": "talk", "who": _is("sahin5"), "text": "Şahin Bey'i dinle", "line": "Sen git. Bu haberi şehre biri götürmeli."},
		{"t": "goto", "p": b5v - d5v * 88.0, "r": 6.0, "text": "Emre uy: çekil, haberi şehre götür", "label": "Şehir yolu", "id": "elmali"},
		{"t": "card", "big": "Şahin Bey, Elmalı Köprüsü'nde şehit düştü.", "small": "28 ya da 29 Mart 1920", "dur": 11.0}, {"t": "wait", "dur": 11.0}, {"t": "date", "to": "b1"},
	]
	chapters["k5"] = k5
	for i in k5.size():
		if k5[i].get("id", "") == "elmali":
			i_elmali = i
	# ---------------- GİZLİ TOPLANTI: komisyon görevleri
	var esnaf := func(x: Npc) -> bool: return x.role == "esnaf" and not x.story
	var evk := func(x: Npc) -> bool: return x.role == "evkadini" and not x.story
	jobs = {
		"mali": {"ad": "Mali işler", "giris": "Savunma parasız olmaz. Çarşıdaki üç esnaftan iane topla.", "steps": [
			{"t": "talkN", "who": esnaf, "n": 3, "text": "Çarşıdaki üç esnaftan iane topla", "line": "Al kardeşim, hakkımız helal olsun."},
			{"t": "talk", "who": _is("kom:mali"), "text": "Parayı sorumluya teslim et", "line": "Eline sağlık. Kuruşu kuruşuna deftere yazacağım."}]},
		"iase": {"ad": "Erzak ve iaşe", "giris": "Esnaftan bir çuval bulgur al, sokağın başındaki depoya bırak.", "steps": [
			{"t": "talk", "who": esnaf, "text": "Bir esnaftan bulgur çuvalını al", "line": "Çuval ağırdır, belini incitme."},
			{"t": "goto", "p": pt["depo"], "r": 3.0, "text": "Çuvalı sokağın başındaki depoya götür"},
			{"t": "talk", "who": _is("kom:iase"), "text": "Sorumluya haber ver", "line": "İyi. Ambar doldukça içimiz rahat eder."}]},
		"muhimmat": {"ad": "Mühimmat ve silah tamiri", "giris": "Bu tüfeğin mekanizması tutukluk yapıyor. Demirciye götür, baksın.", "steps": [
			{"t": "talk", "who": _is("demirci"), "text": "Tüfeği demirciye götür", "line": "Yayı yorulmuş. Değiştirdim, al götür."},
			{"t": "talk", "who": _is("kom:muhimmat"), "text": "Tamir edilen tüfeği geri getir", "line": "Eyvallah. Her tüfek sayılıdır."}]},
		"saglik": {"ad": "Sağlık hizmetleri", "giris": "Sargı bezi lazım. Sokaktaki ev kadınlarından temiz bez iste.", "steps": [
			{"t": "talk", "who": evk, "text": "Ev kadınından temiz bez al", "line": "Kaynatıp kuruttum, tertemizdir. Al götür."},
			{"t": "talk", "who": _is("kom:saglik"), "text": "Bezleri sağlık sorumlusuna teslim et", "line": "Sağ ol. Yaralıya ilk bunlar lazım olur."}]},
		"tahkimat": {"ad": "Tahkimat ve mühendislik", "giris": "Sokağın iki ucuna ve kabaltıya bak; nereye siper kurulur, bana söyle.", "steps": [
			{"t": "goto", "p": pt["uc_guney"], "r": 3.5, "text": "Sokağın çarşı ucunu incele"}, {"t": "goto", "p": pt["kabalti"], "r": 3.0, "text": "Kabaltıyı incele"}, {"t": "goto", "p": pt["uc_kuzey"], "r": 3.5, "text": "Sokağın kale ucunu incele"},
			{"t": "talk", "who": _is("kom:tahkimat"), "text": "Gördüklerini sorumluya anlat", "line": "Kabaltı dar, orası tutulur. Aklımda."}]},
		"yardim": {"ad": "Asker ailelerine yardım", "giris": "Şu çıkını duvar dibinde oturan yaşlı kadına götür. Oğlu cephede.", "steps": [
			{"t": "talk", "who": func(x: Npc) -> bool: return x.role == "yasli" and x.def == "K12", "text": "Çıkını yaşlı kadına götür", "line": "Allah razı olsun evladım. Unutulmadık demek."},
			{"t": "talk", "who": _is("kom:yardim"), "text": "Sorumluya haber ver", "line": "İyi ettin. Kimse sahipsiz kalmayacak."}]},
		"haber": {"ad": "Haberleşme ve tedarik", "giris": "Bahçe kapısındaki arkadaşa söyle: yarın aynı saatte. Cevabını getir.", "steps": [
			{"t": "talk", "who": _is("gozcu"), "text": "Haberi bahçe kapısındaki gözcüye ilet", "line": "Anlaşıldı. Yarın aynı saatte, de."},
			{"t": "talk", "who": _is("kom:haber"), "text": "Cevabı geri getir", "line": "Tamam. Ağızdan ağıza, kâğıtsız; en sağlamı budur."}]},
	}
	# ---------------- BÖLÜM 1
	var b1 := [
		{"t": "card", "big": "BÖLÜM 1 · NİSAN 1920", "small": "Şehir Ayağa Kalkıyor — 1 Nisan 1920, savaş şehrin içine taşınıyor"}, {"t": "groups", "on": ["b1", "b1y1", "b1y2"]}, {"t": "role", "role": "haberci"},
		{"t": "title", "title": "Şehir Ayağa Kalkıyor"},
		{"t": "talk", "who": usta, "text": "Ustanla konuş", "line": "Dükkân kapalı artık, çırak. Bugünden sonra habercisin. Şu pusulayı kale ucundaki mahalle komutanına götür."},
		{"t": "talk", "who": _is("komutan"), "text": "Pusulayı mahalle komutanına ulaştır", "line": "Heyetten mi? İyi. Bu ucu kapatacağız; elin boş durmasın, yığından taş taşı."},
		{"t": "title", "title": "Barikat"},
	]
	for n in [1, 2, 3]:
		b1.append({"t": "goto", "p": pt["yigin"], "r": 2.6, "text": "Yığından taş al (%d/3)" % n, "label": "Taş yığını"})
		b1.append({"t": "goto", "p": pt["barikat"], "r": 3.0, "text": "Taşı barikata götür (%d/3)" % n, "label": "Barikat", "fx": "grow"})
	b1.append_array([
		{"t": "talk", "who": _is("komutan"), "text": "Komutana haber ver", "line": "Oldu bu. Geçmek isteyen düşünsün."},
		{"t": "title", "title": "Yaralılar"},
		{"t": "talk", "who": _is("yarali1"), "text": "Çarşı ucundaki yaralıyı sırtla", "line": "Bacağım… Beni burada bırakma.", "fx": "pick1"},
		{"t": "goto", "p": pt["sargi"], "r": 3.2, "text": "Yaralıyı bahçedeki sargı yerine götür", "label": "Sargı yeri", "fx": "drop1"},
		{"t": "talk", "who": _is("yarali2"), "text": "Kabaltı yanındaki yaralıyı sırtla", "line": "Kolumdan vuruldum. Yürürüm ama düşerim.", "fx": "pick2"},
		{"t": "goto", "p": pt["sargi"], "r": 3.2, "text": "Onu da sargı yerine götür", "label": "Sargı yeri", "fx": "drop2"},
		{"t": "title", "title": "Gizli Geçişler"},
		{"t": "talk", "who": _is("kilavuz"), "text": "Bahçe kapısındaki kılavuzla konuş", "line": "Sokaktan gidersen görürler. Bahçelerin içinden, kabaltının altından geçeceksin. Aklında tut."},
		{"t": "goto", "p": pt["sargi"], "r": 4.0, "text": "Bahçe geçidinden geç", "label": "Bahçe geçidi"},
		{"t": "goto", "p": pt["kabalti2"], "r": 3.0, "text": "Kabaltının altındaki geçidi öğren", "label": "Kabaltı"},
		{"t": "title", "title": "Savunma Hatları"},
		{"t": "goto", "p": pt["carsi"], "r": 3.5, "text": "Çarşı ucundaki siperi gör", "label": "Çarşı ucu siperi"},
		{"t": "goto", "p": pt["kabalti2"], "r": 3.0, "text": "Kabaltı nöbetini gör", "label": "Kabaltı nöbeti"},
		{"t": "goto", "p": pt["kale"], "r": 3.5, "text": "Kale ucundaki barikata dön", "label": "Kale ucu barikatı"},
		{"t": "talk", "who": _is("komutan"), "text": "Gördüklerini komutana bildir", "line": "Yedi cephe, yirmi yedi semt… Herkes kendi sokağını tutacak. Sen haberi taşıyacaksın."},
		{"t": "card", "big": "Şehir ayağa kalktı.", "small": "Bölüm 1 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b2"},
	])
	chapters["b1"] = b1
	# ---------------- BÖLÜM 2
	var post_yaw := atan2(-0.6, 0.8)   # oyuncu kuzeydoğuya bakar (kamera -z'ye bakar: yaw = atan2(-dx, -dz))
	var start := {"p": pt["post"], "yaw": post_yaw}
	var cfg1 := func() -> Dictionary: return _cfg([{"n": 5, "gap": 2.6}], 150.0, Callable())
	var cfg2 := func() -> Dictionary: return _cfg([{"n": 7, "gap": 2.1}], 95.0, Callable(self, "_tick2"))
	var b2 := [
		{"t": "card", "big": "BÖLÜM 2 · MAYIS 1920", "small": "Ateş Çemberi — tepeler için çatışma"}, {"t": "groups", "on": ["b1"]}, {"t": "role", "role": "haberci"},
		{"t": "title", "title": "Sarımsak Tepe'ye Haber"},
		{"t": "talk", "who": _is("komutan"), "text": "Kale ucundaki mahalle komutanıyla konuş", "line": "Sarımsak Tepe sıkışmış, fişekleri bitiyor. Bu sandığı şehirden çıkar; ötesini oradakiler taşır.", "give": {"fisek": 1}},
		{"t": "goto", "p": pt["cikis"], "r": 4.0, "text": "Fişek sandığını şehir çıkışına götür", "label": "Şehir çıkışı", "take": ["fisek"]},
		{"t": "card", "big": "SARIMSAK TEPE", "small": "24 Mayıs 1920 · Bir mahalle savunmacısının gözünden", "id": "hill"}, {"t": "groups", "on": ["b2h"], "off": ["b1"]}, {"t": "role", "role": "savunmaci", "weapon": true, "ammo": 30}, {"t": "tp", "p": pt["post"], "yaw": post_yaw},
		{"t": "title", "title": "Sarımsak Tepe"},
		{"t": "talk", "who": _is("karayilan"), "text": "Karayılan'la konuş", "line": "Tepeyi bırakırsak şehir açıkta kalır. Yerine geç; fişeğini sayarak at."},
		{"t": "combat", "id": "c1", "text": "Siperi savun — ilk hücum (sol tık: ateş, sağ tık: nişan, C: çömel)", "cfg": cfg1, "start": start},
		{"t": "talk", "who": _is("yaraliH"), "text": "Vurulan arkadaşını sırtla", "line": "Omzum… Tüfeği tutamıyorum.", "fx": "pickH"},
		{"t": "goto", "p": pt["rear"], "r": 4.0, "text": "Onu geriye, yamacın yukarısına taşı", "label": "Geri", "fx": "dropH"},
		{"t": "goto", "p": pt["post"], "r": 3.0, "text": "Sipere dön", "label": "Siper"},
		{"t": "combat", "id": "c2", "endless": true, "emir": "Tepe tutulamıyor. Çekilme emri geldi.", "text": "Siperi savun — ikinci hücum; çekilme emrine kadar dayan (düşman tükenmez)", "cfg": cfg2, "start": start},
		{"t": "card", "big": "24 MAYIS 1920", "small": "Karayılan, Sarımsak Tepe'de şehit düştü.", "dur": 7.0}, {"t": "wait", "dur": 7.0},
		{"t": "goto", "p": pt["rear"], "r": 5.0, "text": "Çekilme emri geldi — tepeden in", "label": "Çekil"},
		{"t": "card", "big": "BOMBARDIMAN", "small": "Aynı gün, şehrin içinde · Bir gönüllü yardımcının gözünden", "id": "city"}, {"t": "groups", "on": ["b2c", "b1"], "off": ["b2h"]}, {"t": "role", "role": "yardimci"}, {"t": "tp", "p": pt["sokak"], "yaw": street.rotation.y},
		{"t": "title", "title": "Bombardıman Altında", "id": "shell"},
		{"t": "talkN", "who": sivil, "n": 3, "send": true, "text": "Sokaktaki üç kişiyi mahzene yolla", "line": "Mahzene iniyorum. Allah razı olsun.", "again": "İniyorum, iniyorum!"},
		{"t": "goto", "p": pt["enkaz"], "r": 3.5, "text": "Yıkılan evin enkazına git", "label": "Enkaz"},
		{"t": "talk", "who": _is("enkaz"), "text": "Enkazdaki kadını çıkar ve sırtla", "line": "Ayağım sıkıştı… Çek, ne olur!", "fx": "pickC"},
		{"t": "goto", "p": pt["sargi"], "r": 3.2, "text": "Onu bahçedeki sargı yerine götür", "label": "Sargı yeri", "fx": "dropC"},
		{"t": "talk", "who": _is("sargici"), "text": "Sargıcı kadından temiz bez al", "line": "Kaynattım, kuruttum. İkisini al; boşa harcama.", "give": {"bez": 2}},
		{"t": "talk", "who": _is("enkaz"), "text": "Kadının yarasını sar", "need": {"bez": 1}, "fail": "Önce temiz bez bul.", "line": "Sıktın… ama kan durdu."},
		{"t": "talk", "who": _is("b2y2"), "text": "Öbür yaralının yarasını sar", "need": {"bez": 1}, "fail": "Önce temiz bez bul.", "line": "Eline sağlık, kardeş."},
		{"t": "goto", "p": pt["cesme"], "r": 3.0, "text": "Çeşmeden su doldur", "label": "Çeşme", "give": {"su": 3}},
		{"t": "talkN", "who": func(x: Npc) -> bool: return x.kimlik.get("ad", "") != "" and x.family != "child", "n": 3, "need": {"su": 1}, "fail": "Testin boş; önce çeşmeye git.", "text": "Üç kişiye su ver", "line": "Bir yudum su… Allah senden razı olsun.", "again": "Sağ ol, içtim."},
		{"t": "card", "big": "Ateş çemberi daralıyordu.", "small": "Bölüm 2 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b3"},
	]
	chapters["b2"] = b2
	for k in ["hill", "c1", "c2", "city", "shell"]:
		for i in b2.size():
			if b2[i].get("id", "") == k:
				ix[k] = i
	# ---------------- BÖLÜM 3
	var b3 := [
		{"t": "card", "big": "BÖLÜM 3 · HAZİRAN 1920", "small": "Kırılgan Ateşkes — 30 Mayıs 1920, silahlar sustu"}, {"t": "groups", "on": ["b1", "b3"]}, {"t": "role", "role": "yardimci"},
		{"t": "title", "title": "Sağlık Yeri"},
		{"t": "talk", "who": _is("sargici"), "text": "Bahçedeki sargıcı kadınla konuş", "line": "Silahlar sustu ama yaralar susmadı. Al şu bezleri; sırayla sar.", "give": {"bez": 3}},
		{"t": "talkN", "who": _is("b3y"), "n": 3, "need": {"bez": 1}, "fail": "Bezin kalmadı; sargıcıdan iste.", "text": "Üç yaralının yarasını sar", "line": "Eline sağlık. Dün gece hiç uyuyamadım.", "again": "Sardın ya, sağ ol."},
		{"t": "goto", "p": pt["cesme"], "r": 3.0, "text": "Çeşmeden su doldur", "label": "Çeşme", "give": {"su": 3}},
		{"t": "talkN", "who": _is("b3y"), "n": 3, "need": {"su": 1}, "fail": "Testin boş; önce çeşmeye git.", "text": "Yaralılara su ver", "line": "Su… Allah razı olsun.", "again": "İçtim, sağ ol."},
		{"t": "title", "title": "Nefes"},
		{"t": "talk", "who": _is("aile1"), "send": true, "text": "Hasarlı evdeki aileyi dışarı çıkar", "line": "Tavan çatladı diyorsun… Çıkıyoruz, komşuya geçeriz."},
		{"t": "talk", "who": _is("aile2"), "send": true, "text": "Öbür hasarlı evdeki yaşlı kadını çıkar", "line": "Elli yıllık evim… Peki evladım, çıkayım."},
		{"t": "goto", "p": pt["depo3"], "r": 3.5, "text": "Sokağın başındaki erzak deposuna git", "label": "Erzak deposu"},
		{"t": "talk", "who": usta, "text": "Depoda ne kaldığını ustaya sor", "line": "Bulgur var, un az, yağ hiç yok. Ateşkes uzarsa belki yol açılır."},
		{"t": "card", "big": "ATEŞKES BOZULDU", "small": "Haziran 1920 · Çatışmalar yeniden başlıyor", "id": "break", "donem": "1920 · KUŞATMA"}, {"t": "role", "role": "haberci"},
		{"t": "title", "title": "Yeniden"},
		{"t": "talkN", "who": _is("savunmaci"), "n": 3, "text": "Haberi üç nöbet yerine ulaştır", "line": "Anlaşıldı. Herkes yerine!", "again": "Duydum, hazırız."},
		{"t": "talk", "who": _is("komutan"), "text": "Mahalle komutanına bildir", "line": "Bir nefes aldık, o kadar. Şimdi yeniden."},
		{"t": "card", "big": "Barış gelmemişti.", "small": "Bölüm 3 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b4"},
	]
	chapters["b3"] = b3
	# ---------------- BÖLÜM 4 — TEMMUZ 1920 · "Mahallelerin Nöbeti"
	# TARİHÎ DAYANAK: kuşatma boyunca savunmanın mahalle mahalle yürütülmesi; sağlık, iaşe, mühimmat ve tahkimat işlerinin
	#   Heyet-i Merkeziye teşkilatıyla halk tarafından üstlenilmesi. Tarih YAKLAŞIKTIR (Temmuz 1920; kaynakla doğrulanmadı).
	# KURGU: gece nöbeti, parola, sızma girişimi ve püskürtülmesi, kapı kanadını söken kadın, yaralı nöbetçiler, haber zinciri
	#   ve bütün konuşmalar. Belirli bir tarihî çatışmayı canlandırmaz.
	var nobet := {"p": pt["barikat"], "yaw": street.rotation.y}
	var cfg4 := Callable(self, "_cfg4")
	var tas := func(n: int) -> Array: return [
		{"t": "goto", "p": pt["yigin"], "r": 2.6, "text": "Yığından taş al (%d/2)" % n, "label": "Taş yığını", "give": {"tas": 1}},
		{"t": "goto", "p": pt["carsi"], "r": 3.5, "text": "Taşı çarşı ucundaki sipere taşı (%d/2)" % n, "label": "Çarşı ucu siperi", "take": ["tas"]}]
	var b4 := [
		{"t": "card", "big": "BÖLÜM 4 · TEMMUZ 1920", "small": "Mahallelerin Nöbeti — savaş kadar dayanışma"}, {"t": "groups", "on": ["b1"]}, {"t": "role", "role": "savunmaci", "weapon": true, "ammo": 20}, {"t": "tp", "p": pt["barikat"], "yaw": street.rotation.y},
		{"t": "title", "title": "Nöbet"},
		{"t": "talk", "who": func(x: Npc) -> bool: return x.tag == "savunmaci" and x.xz().distance_to(pt["kale"]) < 14.0, "text": "Barikattaki nöbetçiden nöbeti devral", "line": "Ses gelirse ateş etme; önce parola sor. Bu gece parola: «Hayırlı işler.»"},
		{"t": "goto", "p": pt["barikat"], "r": 2.5, "text": "Barikatın ardındaki nöbet yerine geç", "label": "Nöbet yeri"},
		{"t": "wait", "dur": 9.0, "text": "Karanlığı dinle"},
		{"t": "groups", "on": ["b4g"]},
		{"t": "talk", "who": _is("gelen"), "text": "Barikatın önündeki gölgeye parola sor (ateş etme)", "line": "«Hayırlı işler.» Öbür mahalleden haberciyim. Arkamdan geliyorlar; sokağın ucunda kıpırtı var."},
		{"t": "groups", "off": ["b4g"]},
		{"t": "talk", "who": _is("komutan"), "text": "Sızmayı mahalle komutanına haber ver", "line": "Herkes yerine! Barikatın ardına çömel; yaklaşmadan ateş açma."},
		{"t": "goto", "p": pt["barikat"], "r": 3.0, "text": "Nöbet yerine dön", "label": "Nöbet yeri"},
		{"t": "combat", "text": "Siperi savun (sol tık: ateş, sağ tık: nişan, C: çömel)", "cfg": cfg4, "start": nobet},
		{"t": "card", "big": "Sızma püskürtüldü.", "small": "Mahalle o gece uyumadı.", "dur": 6.0}, {"t": "wait", "dur": 6.0},
		{"t": "card", "big": "TAŞ VE KERESTE", "small": "Ertesi sabah · Bir gönüllü yardımcının gözünden", "id": "day", "hava": "sabah"}, {"t": "groups", "on": ["b4"]}, {"t": "role", "role": "yardimci"}, {"t": "tp", "p": pt["sokak"], "yaw": street.rotation.y},
		{"t": "title", "title": "Taş ve Kereste"},
		{"t": "talk", "who": _is("b4kadin"), "text": "Kapısını söken kadınla konuş", "line": "Kapıyı söktük, barikata götür. Ev kapısız da durur; sokak barikatsız durmaz.", "give": {"kereste": 1}},
		{"t": "goto", "p": pt["bar_kabalti"], "r": 3.0, "text": "Kapı kanadını kabaltı barikatına götür", "label": "Kabaltı barikatı", "take": ["kereste"], "fx": "door"},
	]
	b4.append_array(tas.call(1))
	b4.append_array(tas.call(2))
	b4.append_array([
		{"t": "title", "title": "Sağlık Ekibi"},
		{"t": "talk", "who": _is("sargici"), "text": "Bahçedeki sargıcı kadına yardım et", "line": "Dün geceden iki yaralı nöbetçi var. Al şu bezleri; ben suyu kaynatıyorum.", "give": {"bez": 2}},
		{"t": "talkN", "who": _is("b4y"), "n": 2, "need": {"bez": 1}, "fail": "Bezin kalmadı; sargıcıdan iste.", "text": "İki yaralı nöbetçinin yarasını sar", "line": "Sıyırıp geçmiş. Sar da nöbete döneyim.", "again": "Sardın ya, sağ ol."},
		{"t": "title", "title": "Haber Zinciri"},
		{"t": "talk", "who": _is("kilavuz"), "text": "Bahçe kapısındaki kılavuzla konuş", "line": "Zincir koptu; kabaltıdaki haberci yaralandı. Haberi sen götür: «Bu gece nöbet iki kat.»"},
		{"t": "talkN", "who": _is("savunmaci"), "n": 3, "text": "Haberi üç nöbet yerine ulaştır", "line": "«Bu gece nöbet iki kat.» Anlaşıldı.", "again": "Duydum, iki kat."},
		{"t": "talk", "who": _is("komutan"), "text": "Mahalle komutanına bildir", "line": "Taşı taşıyan da, yarayı saran da, haberi götüren de bu savunmanın neferi."},
		{"t": "card", "big": "Mahalle nöbetteydi.", "small": "Bölüm 4 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b5"},
	])
	chapters["b4"] = b4
	for i in b4.size():
		if b4[i].get("id", "") == "day":
			i_day4 = i
	# ---------------- BÖLÜM 5 — AĞUSTOS 1920 · "Ya Hürriyet Ya Ölüm"
	# TARİHÎ DAYANAK: 8 Ağustos 1920'de Özdemir Bey'in cepheler komutanlığını üstlenmesi ve savunmanın yeniden düzenlenmesi (doğrulanmış);
	#   Fransızların teslim baskısı; 13 Ağustos Karatarla Camii toplantısı, teslim olmama iradesi ve beyaz bayrak yerine Türk bayrağı
	#   çekilmesi ANLATISI (tarih ve ayrıntı kaynakla doğrulanmadı).
	# KURGU: karargâh habercisi, hatip, kalabalığın ve bütün kişilerin sözleri. Özdemir Bey sahnede görünmez ve ona söz yazılmaz;
	#   emri bir haberci aktarır. VARSAYIM: Karatarla Camii haritada yok; toplantı çarşı yakınındaki meydanda geçer ve yere cami adı verilmez.
	var b5 := [
		{"t": "card", "big": "BÖLÜM 5 · AĞUSTOS 1920", "small": "Ya Hürriyet Ya Ölüm — 8 Ağustos 1920, savunma yeniden düzenleniyor"}, {"t": "groups", "on": ["b1", "b5"]}, {"t": "role", "role": "haberci"}, {"t": "tp", "p": pt["sokak"], "yaw": street.rotation.y + PI},
		{"t": "title", "title": "Yeni Komutan"},
		{"t": "talk", "who": _is("yaver"), "text": "Karargâhtan gelen haberciyle konuş", "line": "Cepheler komutanlığını Özdemir Bey üstlendi. Her cephe kime bağlı, bugün herkes bilecek. Bu pusulaları nöbet yerlerine götür.", "give": {"pusula": 3}},
		{"t": "talkN", "who": _is("savunmaci"), "n": 3, "need": {"pusula": 1}, "fail": "Pusulan kalmadı.", "text": "Yeni komuta düzenini üç nöbet yerine bildir", "line": "Kime bağlı olduğumuzu bilelim, yeter. Aldım.", "again": "Pusulayı aldım ya."},
		{"t": "talk", "who": _is("komutan"), "text": "Mahalle komutanına bildir", "line": "Düzen değişti, karar değişmedi. Fransız «teslim ol» diyor; cevabı halk verecek."},
		{"t": "card", "big": "13 AĞUSTOS 1920", "small": "Teslim talebi halkın önünde görüşülecek · Karatarla Camii toplantısı (anlatıya göre)", "tarih": "13 Ağustos 1920"}, {"t": "groups", "on": ["p5", "b5f"], "off": ["b5"]},
		{"t": "title", "title": "Toplantı Haberi"},
		{"t": "talkN", "who": sivil, "n": 3, "text": "Toplantı haberini üç mahalleliye ulaştır", "line": "Toplanılıyormuş… Geliyorum, komşuya da söylerim.", "again": "Duydum, geliyorum."},
		{"t": "title", "title": "Toplantı"},
	]
	if hatip != null:
		b5.append_array([
			{"t": "goto", "p": pt["gozlem"], "r": 6.0, "text": "Toplantı yerinin çevresini gözle: asker var mı?", "label": "Gözlem yeri"},
			{"t": "talk", "who": func(x: Npc) -> bool: return x.tag == "kalabalik", "text": "Gördüğünü kalabalıktan birine söyle", "line": "Uzaktan bakıyorlar demek. Baksınlar; biz buradayız."},
			{"t": "listen", "p": pt["meydan"], "r": 12.0, "text": "Toplantıyı dinle", "label": "Toplantı", "fx": "flag",
				"lines": [[hatip, "Fransız kumandanı teslim olmamızı istiyor."], [hatip, "Cevabı ben vermeyeceğim. Cevabı siz vereceksiniz."], [crowd[1 % crowd.size()], "Teslim olmayız!"], [crowd[4 % crowd.size()], "Teslim olmayız!"], [crowd[7 % crowd.size()], "Teslim olmayız!"], [hatip, "Öyleyse beyaz bayrak değil, kendi bayrağımız çekilecek."]]},
			{"t": "wait", "dur": 6.0, "text": "Bayrağın çekilişini izle"},
		])
	b5.append_array([
		{"t": "title", "title": "Karar"},
		{"t": "talkN", "who": gezen, "n": 3, "text": "Kararı üç kişiye duyur", "line": "Teslim yok demek… Allah utandırmasın.", "again": "Duydum; teslim yok."},
		{"t": "card", "big": "Ya hürriyet ya ölüm.", "small": "Bölüm 5 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b6"},
	])
	chapters["b5"] = b5
	# ---------------- BÖLÜM 6 — EYLÜL 1920 · "Yardım Bekleyen Şehir"
	# TARİHÎ DAYANAK: 9–10 Eylül 1920 ağır bombardımanı, yıkılan yapılar ve sivil kayıplar; şehirden dışarıya yardım çağrıları
	#   gönderilmesi (ana hikâye dosyası; kaynakla doğrulanmadı).
	# KURGU: enkazdaki kişiler, komşu kadın, mektup, ulak, devriyelerin yeri ve bütün konuşmalar.
	# KURAL: herkes kurtarılamaz — ikinci evde oyuncunun yapabileceği bir şey yoktur; ölüm gösterilmez, yalnız söylenir.
	# VARSAYIM: mektubun dere yatağından (Alleben) çıkarılması ve geçiş yeri.
	var dere_yaw := atan2(-(pt["dere1"].x - pt["dere0"].x), -(pt["dere1"].y - pt["dere0"].y))
	var b6 := [
		{"t": "card", "big": "BÖLÜM 6 · EYLÜL 1920", "small": "Yardım Bekleyen Şehir — 9–10 Eylül 1920, ağır bombardıman"}, {"t": "groups", "on": ["b1", "b6", "b6k"]}, {"t": "role", "role": "yardimci"}, {"t": "tp", "p": pt["sokak"], "yaw": street.rotation.y},
		{"t": "title", "title": "Enkaz"},
		{"t": "goto", "p": pt["enkaz"], "r": 3.5, "text": "Yıkılan eve koş", "label": "Enkaz"},
		{"t": "wait", "dur": 3.5, "text": "Seslen: «Ses ver! Neredesin?»"},
		{"t": "talk", "who": _is("b6k"), "text": "Enkazdaki kadını çıkar ve sırtla", "line": "Buradayım… Kiriş bacağımın üstünde. Çek!", "fx": "pick6"},
		{"t": "goto", "p": pt["sargi"], "r": 3.2, "text": "Onu bahçedeki sargı yerine götür", "label": "Sargı yeri", "fx": "drop6"},
		{"t": "goto", "p": pt["enkaz2"], "r": 3.5, "text": "Öbür yıkılan eve koş", "label": "İkinci enkaz"},
		{"t": "wait", "dur": 3.5, "text": "Seslen: «Ses ver! Neredesin?»"},
		{"t": "talk", "who": _is("b6komsu"), "text": "Enkazın başındaki komşuyla konuş", "line": "Seslenme evladım, ses veren yok. Geç kaldık. Sen yaşayana koş."},
		{"t": "title", "title": "Sağlık Yeri"},
		{"t": "talk", "who": usta, "text": "Depodaki son sargı malzemesini ustadan al", "line": "Son sandık bu. Biterse çarşaf yırtacağız. Götür.", "give": {"malzeme": 1}},
		{"t": "talk", "who": _is("sargici"), "text": "Malzemeyi bahçedeki sargıcıya teslim et", "need": {"malzeme": 1}, "fail": "Önce depodan malzemeyi al.", "line": "Tam vaktinde. Dünden beri bezsiz sarıyoruz."},
		{"t": "card", "big": "Herkes kurtarılamadı.", "small": "10 Eylül 1920", "dur": 6.0}, {"t": "wait", "dur": 6.0},
		{"t": "card", "big": "MEKTUP", "small": "Eylül 1920 · Şehirden dışarıya yardım çağrısı", "id": "night", "tarih": "Eylül 1920"}, {"t": "groups", "off": ["b6", "b6k"]}, {"t": "role", "role": "haberci"}, {"t": "tp", "p": pt["kale"], "yaw": street.rotation.y},
		{"t": "title", "title": "Mektup"},
		{"t": "talk", "who": _is("komutan"), "text": "Mahalle komutanından mektubu al", "line": "Bu kâğıt çıkmazsa kimse geldiğimizi bilmeyecek. Dere yatağından geç; devriyeye görünme.", "give": {"mektup": 1}},
		{"t": "talk", "who": _is("kilavuz"), "text": "Bahçe kapısındaki kılavuzla konuş", "line": "Seni dereye kadar ben indiririm. Ötesi sende: nöbetçinin yanından çömelerek geç, koşma."},
		{"t": "card", "big": "DERE YATAĞI", "small": "Gece · Kuşatma hattı", "dur": 4.0}, {"t": "groups", "on": ["b6f", "b6u"], "off": ["b1"]}, {"t": "tp", "p": pt["dere0"], "yaw": dere_yaw},
		{"t": "sneak", "p": pt["dere1"], "r": 4.0, "guards": "fr6", "start": {"p": pt["dere0"], "yaw": dere_yaw}, "text": "Dere boyunca hattın dışına çık; nöbetçilerin yakınında çömel (C)", "label": "Hattın dışı"},
		{"t": "talk", "who": _is("ulak"), "text": "Mektubu bekleyen ulağa ver", "need": {"mektup": 1}, "line": "Kâğıt bende. Sabaha kadar yoldayım; sen geldiğin yoldan dön."},
		{"t": "card", "big": "Yardım çağrısı şehirden çıktı.", "small": "Bölüm 6 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b7"},
	]
	chapters["b6"] = b6
	# ---------------- BÖLÜM 7 — EKİM 1920 · "Çınarlı Cephesi"
	# TARİHÎ DAYANAK: 5 ve 14 Ekim 1920'de Çınarlı çevresinde çatışmalar; savaşın mahallelerin içine yayılması; evler arasında
	#   duvarlara açılan geçitlerle yer değiştirme (ana hikâye dosyası; tarihler ve görev yerleri özgün belgelerle doğrulanmadı).
	# KURGU: sokak başı, savunmacılar, siviller, yaralı ve bütün konuşmalar; çatışmanın gidişi.
	# VARSAYIM: Çınarlı haritada yok. Sahne, şehrin güneybatısında otomatik seçilen düz bir sokakta geçer; yere ad verilmez.
	# SINIR: binaların içi gezilemediği için duvar deliğinden geçiş bir kararma ile anlatılır. Çatışma "kazanılmaz": sonuç yazılmaz.
	var yawp := atan2(-dir7.x, -dir7.y)
	var s71 := {"p": pt["b7_post1"], "yaw": yawp}
	var s72 := {"p": pt["b7_post2"], "yaw": yawp}
	var cfg7a := func() -> Dictionary: return _cfg7(false)
	var cfg7b := func() -> Dictionary: return _cfg7(true)
	var b7 := [
		{"t": "card", "big": "BÖLÜM 7 · EKİM 1920", "small": "Çınarlı Cephesi — 5 Ekim 1920, savaş mahallelerin içinde"}, {"t": "groups", "on": ["b7a", "b7b", "b7c"]}, {"t": "role", "role": "savunmaci", "weapon": true, "ammo": 25}, {"t": "tp", "p": pt["b7_start"], "yaw": yawp},
		{"t": "title", "title": "Sokak Sokak"},
		{"t": "talk", "who": _is("b7bas"), "text": "Fişeği ön siperdeki sokak başına ulaştır", "line": "Fişek mi? Tam vaktinde. Yerine geç; sokağın ucundan geliyorlar.", "give": {"fisek": 1}, "take": ["fisek"]},
		{"t": "goto", "p": pt["b7_post1"], "r": 2.6, "text": "Ön siperde yerini al", "label": "Ön siper"},
		{"t": "combat", "endless": true, "emir": "Ön siper tutulamıyor. Sokak başı arka sipere çağırıyor.", "text": "Sokağı savun; arka sipere çekilme emrine kadar dayan (sol tık: ateş, sağ tık: nişan, C: çömel)", "cfg": cfg7a, "start": s71},
		{"t": "talk", "who": _is("b7bas"), "text": "Sokak başıyla konuş", "line": "Burası tutulmaz oldu. Duvarın deliğinden geç, sokağa çıkma! Arka sipere toplanıyoruz."},
		{"t": "card", "big": "Evlerin içinden", "small": "Duvarlara açılan deliklerden arka sipere", "dur": 4.0}, {"t": "groups", "off": ["b7a"]}, {"t": "tp", "p": pt["b7_post2"], "yaw": yawp},
		{"t": "card", "big": "14 EKİM 1920", "small": "Çatışma mahallenin içine yayıldı", "tarih": "14 Ekim 1920", "dur": 4.0},
		{"t": "title", "title": "Arka Siper"},
		{"t": "talkN", "who": _is("b7sivil"), "n": 2, "send": true, "text": "Sokaktaki iki kişiyi mahzene yolla", "line": "İniyoruz evladım. Allah yardımcınız olsun.", "again": "İniyorum."},
		{"t": "goto", "p": pt["b7_post2"], "r": 2.6, "text": "Arka siperde yerini al", "label": "Arka siper"},
		{"t": "combat", "endless": true, "emir": "Çatışma sürüyor. Vurulan arkadaşını ateş altından çıkar.", "text": "Arka siperi savun; yaralıyı çıkarana kadar hattı tut (düşman tükenmez)", "cfg": cfg7b, "start": s72},
		{"t": "groups", "on": ["b7y"]},
		{"t": "talk", "who": _is("b7y"), "text": "Vurulan savunmacıyı sırtla", "line": "Dizim… Kalkamıyorum. Tüfeğimi al.", "fx": "pick7"},
		{"t": "goto", "p": pt["b7_rear"], "r": 3.5, "text": "Onu sokağın gerisine taşı", "label": "Geri", "fx": "drop7"},
		{"t": "card", "big": "Savaş artık evlerin arasındaydı.", "small": "Bölüm 7 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b8"},
	]
	chapters["b7"] = b7
	# ---------------- BÖLÜM 8 — KASIM 1920 · "Çember Daralıyor"
	# TARİHÎ DAYANAK: 21 Kasım 1920'de Fransız takviyeleriyle kuşatmanın yeniden sıkılaşması (doğrulanmış; bir kaynak 20 Kasım der);
	#   28 Kasım'da erzakın kritik seviyeye inmesi ve iaşe paylarının azaltılması (ana hikâye dosyası; kaynakla doğrulanmadı).
	# KURGU: gözcü, komşu mahallenin sorumlusu, yolcu ve söylediği söylenti, tayın miktarları ("okka" ölçüsü dahil),
	#   itiraz eden adam ve bütün konuşmalar. Yardım kuvvetiyle ilgili söz bilerek belirsizdir: bir söylenti olarak verilir.
	var k8 := {"p": pt["cikis"], "yaw": street.rotation.y}
	var b8 := [
		{"t": "card", "big": "BÖLÜM 8 · KASIM 1920", "small": "Çember Daralıyor — 21 Kasım 1920, kuşatma yeniden sıkılaşıyor"}, {"t": "groups", "on": ["b1", "b8", "b8m", "b8f"]}, {"t": "role", "role": "haberci"}, {"t": "tp", "p": pt["kale"], "yaw": street.rotation.y},
		{"t": "title", "title": "İkinci Kuşatma"},
		{"t": "talk", "who": _is("komutan"), "text": "Mahalle komutanıyla konuş", "line": "Fransız'a takviye gelmiş diyorlar. Barikatın ötesindeki gözcüye sor; sonra hattaki komşu mahalleye haber götür."},
		{"t": "talk", "who": _is("gozcu8"), "text": "Barikatın ötesindeki gözcüye sor", "line": "Yeni çadırlar kurmuşlar. Saydım, bitmedi."},
		{"t": "sneak", "p": pt["b8_hedef"], "r": 5.0, "near": 2.5, "guards": "fr8", "start": k8, "text": "Komşu mahalleye ulaş; nöbetçilerin yakınında çömel (C)", "label": "Komşu mahalle"},
		{"t": "talk", "who": _is("b8m"), "text": "Haberi mahallenin sorumlusuna ver", "line": "Takviye mi? Demek çember daralıyor. Biz buradayız, de; sokağımızı bırakmadık."},
		{"t": "talk", "who": _is("b8yolcu"), "text": "Dışarıdan gelen yolcuya yardım kuvvetini sor", "line": "Yolda duydum: yardım kolu yola çıkmış diyorlar. Varır mı, ne zaman varır, onu bilen yok."},
		{"t": "card", "big": "Dönüş", "small": "Geldiğin yoldan, gölgelerden", "dur": 3.5}, {"t": "tp", "p": pt["kale"], "yaw": street.rotation.y + PI},
		{"t": "talk", "who": _is("komutan"), "text": "Duyduklarını komutana bildir", "line": "Söylentiyle karın doymaz, siper de tutulmaz. Biz elimizdekiyle hesap yapacağız."},
		{"t": "card", "big": "TAYIN", "small": "28 Kasım 1920 · Erzak kritik seviyede · Bir esnafın gözünden", "tarih": "28 Kasım 1920"}, {"t": "groups", "on": ["b8t"], "off": ["b8", "b8m", "b8f"]}, {"t": "role", "role": "esnaf"}, {"t": "tp", "p": pt["depo3"], "yaw": street.rotation.y},
		{"t": "title", "title": "Tayın"},
		{"t": "goto", "p": npcs.hp(street.xl(-4.0) + 1.7, -4.0), "r": 2.2, "text": "Bulgur çuvallarını say", "label": "Bulgur"},
		{"t": "goto", "p": npcs.hp(street.xl(-15.0) + 1.7, -15.0), "r": 2.2, "text": "Un çuvallarını say", "label": "Un"},
		{"t": "goto", "p": npcs.hp(street.xr(-8.0) - 1.4, -8.0), "r": 2.2, "text": "Yağ küplerini say", "label": "Yağ küpleri"},
		{"t": "talk", "who": usta, "text": "Sayımı ustaya bildir", "line": "Dün bir okkaydı, bugün yarım. Yarın ne olur bilmem. Al, payları sen dağıt.", "give": {"tayin": 4}},
		{"t": "talkN", "who": sivil, "n": 4, "need": {"tayin": 1}, "fail": "Dağıtacak pay kalmadı.", "text": "Azaltılmış payları dört kişiye dağıt", "line": "Yarım okka… Çocuklara yeter mi bu?", "again": "Payımı aldım."},
		{"t": "talk", "who": _is("b8itiraz"), "text": "İtiraz eden adamı dinle", "line": "Yarım okkayla ev mi döner? Depoda saklıyorsunuz, biliyorum!"},
		{"t": "talk", "who": _is("b8itiraz"), "text": "Ona depoda ne kaldığını say", "line": "…Demek sahiden bu kadar kaldı. Hakkını helal et evlat."},
		{"t": "card", "big": "Çember daralıyordu.", "small": "Bölüm 8 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b9"},
	]
	chapters["b8"] = b8
	# ---------------- BÖLÜM 9 — ARALIK 1920 · "Son Erzak"
	# TARİHÎ DAYANAK: erzakın tükenmeye yüz tutması, günlük hayatın mücadeleye dönüşmesi; çevre ayrıntıları olarak gizli haberleşme
	#   (kuryeler, güvercinler) ve mühimmat tamir atölyeleri (ana hikâye dosyası; tarih YAKLAŞIKTIR, kaynakla doğrulanmadı).
	# KURGU: fırıncı, yaşlı kadın ve torunu, hamal, atölye ustası, güvercinci, somun ve fişek sayıları, bütün konuşmalar.
	# NOT: hayvan modeli olmadığı için ahır yalnız kapısından ve hamalın sözünden anlatılır.
	var pay := func(x: Npc) -> bool: return x.tag == "b9cocuk" or x.role == "yasli" or (x.family == "child" and not x.story)
	var b9 := [
		{"t": "card", "big": "BÖLÜM 9 · ARALIK 1920", "small": "Son Erzak — günlük hayat da mücadeleye dönüşüyor"}, {"t": "groups", "on": ["b1", "b9"]}, {"t": "role", "role": "esnaf"}, {"t": "tp", "p": pt["depo3"], "yaw": street.rotation.y},
		{"t": "title", "title": "Ekmek"},
		{"t": "talk", "who": _is("firinci9"), "text": "Fırıncıdan günün ekmeğini al", "line": "Una arpa kattım, yine yetmedi. Sana dört somun düştü. Önce yaşlıya, çocuğa.", "give": {"ekmek": 4}},
		{"t": "talk", "who": _is("b9nine"), "text": "Duvar dibindeki yaşlı kadına ekmek götür", "line": "Benimkini torunuma ver. Ben dünkünden sakladım."},
		{"t": "talk", "who": _is("b9torun"), "text": "Ekmeği torununa ver", "need": {"ekmek": 1}, "fail": "Elinde ekmek kalmadı.", "line": "Ninem yedi mi? …Sağ ol amca."},
		{"t": "talkN", "who": pay, "n": 3, "need": {"ekmek": 1}, "fail": "Elinde ekmek kalmadı.", "text": "Üç kişiye daha pay ulaştır (yaşlılar ve çocuklar)", "line": "Allah razı olsun.", "again": "Benimkini aldım."},
		{"t": "goto", "p": pt["ahir"], "r": 3.0, "text": "Ahırdaki hayvanların yemine bak", "label": "Ahır kapısı"},
		{"t": "talk", "who": _is("b9hamal"), "text": "Ahırın önündeki hamalla konuş", "line": "Saman bitti. Dut kabuğu, kuru yaprak veriyorum. Yük taşıyacak hali kalmadı garibin."},
		{"t": "card", "big": "ATÖLYE", "small": "Aralık 1920 · Mühimmat tamiri ve gizli haberleşme", "dur": 4.5}, {"t": "groups", "on": ["b9a"], "off": ["b9"]}, {"t": "role", "role": "haberci"},
		{"t": "title", "title": "Atölye"},
		{"t": "talk", "who": _is("b9usta"), "text": "Atölyedeki ustayla konuş", "line": "Boş kovanı atma; dolduracağız. Siperleri dolaş, ne kadar kovan varsa topla getir."},
		{"t": "goto", "p": pt["kale"], "r": 3.5, "text": "Kale ucundaki siperden boş kovanları topla", "label": "Kale ucu", "give": {"kovan": 1}},
		{"t": "goto", "p": pt["kabalti2"], "r": 3.0, "text": "Kabaltı nöbetinden boş kovanları topla", "label": "Kabaltı", "give": {"kovan": 1}},
		{"t": "goto", "p": pt["carsi"], "r": 3.5, "text": "Çarşı ucundaki siperden boş kovanları topla", "label": "Çarşı ucu", "give": {"kovan": 1}},
		{"t": "talk", "who": _is("b9usta"), "text": "Kovanları atölyeye getir", "need": {"kovan": 3}, "fail": "Önce üç siperden kovanları topla.", "line": "Üç avuç kovan. Barut yeterse yarına fişek olur. Şimdi şu pusulayı al; güvercinciye götür, kimseye gösterme.", "give": {"pusula": 1}},
		{"t": "title", "title": "Gizli Haber"},
		{"t": "talk", "who": _is("b9kuscu"), "text": "Pusulayı bahçedeki güvercinciye ver", "need": {"pusula": 1}, "line": "Kuşun ayağına bağlarım. Varırsa varır; kuş yolunu bilir ama kurşun da bilir."},
		{"t": "card", "big": "Ekmek azalıyor, direniş sürüyordu.", "small": "Bölüm 9 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b10"},
	]
	chapters["b9"] = b9
	# ---------------- BÖLÜM 10 — OCAK 1921 · "Açlığın İçinde" (oyunun en ağır insani bölümü)
	# TARİHÎ DAYANAK: 1 Ocak 1921 ağır açlık, kar ve soğuk; acı zerdali çekirdeğinin (ve acı bademin) öğütülüp una karıştırılması
	#   (olay doğrulanmış, gün doğrulanmamış: 10 Ocak); 12 Ocak'ta bu karışıma bağlı zehirlenmeler (tek kaynak: 40–50 ölüm aktarımı,
	#   başka belgeyle karşılaştırılmadı); ölen at ve eşeklerin etine yönelinmesi; 18–25 Ocak başarısız yardım girişimleri.
	# KURALLAR: "şeftali" değil ACI ZERDALİ çekirdeği. Ölüm sayısı kesin rakam gibi sunulmaz, aktarım olarak ve belirsizliğiyle verilir.
	#   Çocuklara yönelik zarar sahnelenmez: hastalananlar yetişkindir. Ölüm ve hayvan gösterilmez, yalnız söylenir.
	#   "Atın önündeki yem" ifadesi doğrulanamadığı için kullanılmaz.
	# KURGU: bütün kişiler ve konuşmalar; yardımın gelememesinin gerekçesi olarak söylenen "yol kapalı" sözü.
	var kr: Array = pt["b10kiran"]
	var b10 := [
		{"t": "card", "big": "BÖLÜM 10 · OCAK 1921", "small": "Açlığın İçinde — 1 Ocak 1921, kar, soğuk ve açlık"}, {"t": "groups", "on": ["b1", "b10a"]}, {"t": "role", "role": "yardimci"}, {"t": "tp", "p": pt["sokak"], "yaw": street.rotation.y},
		{"t": "title", "title": "Son Un"},
		{"t": "talk", "who": _is("b10anne"), "text": "Kapı önündeki anneyle konuş; kalan unu birlikte ölçün", "line": "Çuvalın dibi bu: üç avuç. Yarısını onlara götür. Onların hiç yok.", "give": {"un": 1}},
		{"t": "talk", "who": _is("b10komsu"), "text": "Bir avuç unu komşu eve götür", "need": {"un": 1}, "line": "Kendi çocuğunun boğazından… Allah bin katını versin."},
		{"t": "wait", "dur": 6.0, "text": "Sessiz sokakta dur; kar yağıyor"},
		{"t": "card", "big": "ZERDALİ ÇEKİRDEĞİ", "small": "10 Ocak 1921 · Acı zerdali çekirdeği öğütülüp una karıştırılıyor", "tarih": "10 Ocak 1921"}, {"t": "groups", "on": ["b10b"], "off": ["b10a"]},
		{"t": "title", "title": "Zerdali Çekirdeği"},
	]
	if kr.size() >= 2:
		b10.append({"t": "listen", "p": pt["sargi"], "r": 5.0, "text": "Avluda çekirdek kıran ailelere tanık ol", "label": "Avlu",
			"lines": [[kr[0], "Taşla kır, kabuğunu ayır. İçini dibekte dövüyoruz."], [kr[1], "Acı bademi de kattık. Un diye bir şey kalmadı."], [kr[0], "Acı ama karın doyuruyor."]]})
	b10.append_array([
		{"t": "card", "big": "12 OCAK 1921", "small": "Çekirdekli ekmekten yiyenler hastalanıyor", "tarih": "12 Ocak 1921"}, {"t": "groups", "on": ["b10z1", "b10z2"], "off": ["b10b"]},
		{"t": "title", "title": "Hastalananlar"},
		{"t": "talk", "who": _is("b10z1"), "text": "Çeşme yanında yığılan adamı sırtla", "line": "Midem… Başım dönüyor. Ekmekten yedim.", "fx": "pickZ1"},
		{"t": "goto", "p": pt["sargi"], "r": 3.2, "text": "Onu sağlık yerine taşı", "label": "Sağlık yeri", "fx": "dropZ1"},
		{"t": "talk", "who": _is("b10z2"), "text": "Duvar dibindeki öbür hastayı sırtla", "line": "Gözüm kararıyor… Evdekiler de yedi.", "fx": "pickZ2"},
		{"t": "goto", "p": pt["sargi"], "r": 3.2, "text": "Onu da sağlık yerine taşı", "label": "Sağlık yeri", "fx": "dropZ2"},
		{"t": "talk", "who": _is("sargici"), "text": "Sargıcı kadına ne yapılacağını sor", "line": "Su içir, kusturmaya çalış; elimizden başka bir şey gelmiyor. Kapı kapı getiriyorlar."},
		{"t": "card", "big": "Kaç kişinin öldüğü kesin bilinmiyor.", "small": "Bir aktarım kırk–elli kişi der; başka belgeyle doğrulanmamıştır.", "dur": 8.0}, {"t": "wait", "dur": 8.0},
		{"t": "card", "big": "HAN AVLUSU", "small": "Ocak 1921 · Bir esnafın gözünden", "tarih": "Ocak 1921"}, {"t": "groups", "on": ["b10h"], "off": ["b10z1", "b10z2", "b1"]}, {"t": "role", "role": "esnaf"}, {"t": "tp", "p": pt.get("han", pt["kale"]), "yaw": 0.0},
		{"t": "title", "title": "Hayvanların Sonu"},
		{"t": "talk", "who": _is("b10hamal"), "text": "Son hayvanın sahibiyle konuş", "line": "Yirmi yıl yükümü taşıdı. Dün gece öldü. Sabah gelip etini istediler; ver de diyemedim, verme de diyemedim."},
		{"t": "talk", "who": _is("b10ihtiyar"), "text": "Avludaki yaşlı adamı dinle", "line": "Açlık insana her şeyi yedirir evlat. Kimseyi ayıplama."},
		{"t": "card", "big": "KAR VE YARDIM", "small": "18–25 Ocak 1921 · Dışarıdan beklenen yardım", "tarih": "18 Ocak 1921"}, {"t": "groups", "on": ["b6f"], "off": ["b10h"]}, {"t": "role", "role": "haberci"}, {"t": "tp", "p": pt["dere0"], "yaw": dere_yaw},
		{"t": "title", "title": "Kar ve Yardım"},
		{"t": "sneak", "p": pt["dere1"], "r": 4.0, "guards": "fr6", "start": {"p": pt["dere0"], "yaw": dere_yaw}, "text": "Dere boyunca buluşma yerine git; nöbetçilerin yakınında çömel (C)", "label": "Buluşma yeri"},
		{"t": "wait", "dur": 10.0, "text": "Karda haberciyi bekle"},
		{"t": "groups", "on": ["b10k"]},
		{"t": "talk", "who": _is("b10haberci"), "text": "Gelen haberciyle konuş", "line": "Gelemiyorlar. Yol kapalı."},
		{"t": "card", "big": "Dönüş", "small": "Geldiğin yoldan, karın içinden", "dur": 3.5}, {"t": "groups", "on": ["b1"], "off": ["b6f", "b10k"]}, {"t": "tp", "p": pt["kale"], "yaw": street.rotation.y + PI},
		{"t": "talk", "who": _is("komutan"), "text": "Haberi mahalle komutanına götür", "line": "…Demek kendi başımızayız. Soranlara yalan söyleme; ama umudu da sen kesme."},
		{"t": "card", "big": "Yardım gelmedi.", "small": "Bölüm 10 tamamlandı"}, {"t": "wait", "dur": 6.0}, {"t": "date", "to": "b11"},
	])
	chapters["b10"] = b10
	# ---------------- BÖLÜM 11 — ŞUBAT 1921 · "Son Gün"
	# TARİHÎ DAYANAK: 5–7 Şubat 1921'de savunmacıların kuşatmayı yararak şehirden çıkma girişimi (huruç; doğrulanmış);
	#   8 Şubat teslim görüşmesi, 9 Şubat teslim protokolü. 8/9 Şubat ayrımı kaynaklarda TARTIŞMALIDIR; "sabah 10.00" saati ve
	#   Şeyh Fethullah Camii bilgisi yalnız ana hikâye metnindedir (oyunda saat verilmez).
	# SABİT: çıkışın sonucu ve 9 Şubat 1921 teslimi değiştirilemez. Çatışma "kazanılmaz"; süre dolunca kol dağılır.
	#   Oynanan savunmacıdan bir daha haber alınmaz; hikâye esnafın gözünden sürer.
	# KURGU: bütün kişiler ve konuşmalar. VARSAYIM: huruç kolunun dere boyundan çıkması.
	var s11p := {"p": pt["dere0"] + (pt["dere1"] - pt["dere0"]).normalized() * 4.2, "yaw": dere_yaw}
	var cfg11 := func() -> Dictionary:
		var al := []
		for x in npcs.agents:
			if x.tag == "b11s" and not x.hidden:
				al.append(x)
		return {"allies": al, "spawns": [pt["dere1"]], "lanes": lanes11, "waves": [{"n": 6, "gap": 2.0}, {"n": 6, "gap": 1.8}, {"n": 6, "gap": 1.8}], "target_bias": 0.5, "limit": 75.0}
	var b11 := [
		{"t": "card", "big": "BÖLÜM 11 · ŞUBAT 1921", "small": "Son Gün — 5–7 Şubat 1921, yiyecek ve mühimmat tükendi"}, {"t": "groups", "on": ["b1"]}, {"t": "role", "role": "savunmaci", "weapon": true, "ammo": 15}, {"t": "tp", "p": pt["depo3"], "yaw": street.rotation.y},
		{"t": "title", "title": "Huruç"},
		{"t": "talk", "who": usta, "text": "Geride kalan ustana veda et", "line": "Git evlat. Dükkânı ben beklerim. Hakkını helal et."},
		{"t": "goto", "p": pt["kale"], "r": 3.5, "text": "Gece toplanma yerine ulaş", "label": "Toplanma yeri"},
		{"t": "talk", "who": _is("komutan"), "text": "Mahalle komutanını dinle", "line": "Çıkabilen çıksın. Kalan, şehri teslim edecek."},
		{"t": "card", "big": "HURUÇ", "small": "Gece · Kuşatma hattı", "dur": 4.0}, {"t": "groups", "on": ["b11a"], "off": ["b1"]}, {"t": "tp", "p": s11p["p"], "yaw": dere_yaw},
		{"t": "combat", "endless": true, "emir": "Hat yarılamadı. Kol dağılıyor.", "text": "Hattı yarmaya çalışan kola katıl (düşman tükenmez; sol tık: ateş, sağ tık: nişan, C: çömel)", "cfg": cfg11, "start": s11p},
		{"t": "card", "big": "Kol karanlıkta dağıldı.", "small": "Çıkabilen çıktı. Savunmacıdan bir daha haber alınmadı.", "dur": 7.0}, {"t": "wait", "dur": 7.0},
		{"t": "card", "big": "TESLİM", "small": "8 Şubat 1921 · Bir esnafın gözünden", "id": "day", "tarih": "8 Şubat 1921"}, {"t": "groups", "on": ["b11c"], "off": ["b11a"]}, {"t": "role", "role": "esnaf"}, {"t": "tp", "p": pt["sfc"] + Vector2(9, 6), "yaw": 0.0},
		{"t": "title", "title": "Teslim"},
		{"t": "goto", "p": pt["sfc"], "r": 6.0, "text": "Cami çevresindeki bekleyişe katıl", "label": "Şeyh Fethullah Camii çevresi"},
		{"t": "talkN", "who": _is("b11bekleyen"), "n": 2, "text": "Bekleyenlerden iki kişiyle konuş", "line": "İçeride görüşüyorlar. Ekmek yok, fişek yok; geriye söz kaldı.", "again": "Bekliyoruz."},
		{"t": "wait", "dur": 8.0, "text": "Bekle"},
		{"t": "card", "big": "9 ŞUBAT 1921", "small": "Teslim protokolü imzalandı.", "tarih": "9 Şubat 1921", "donem": "1921 · TESLİM", "dur": 7.0}, {"t": "groups", "on": ["b11d"]},
		{"t": "talk", "who": _is("b11haberci"), "text": "Camiden çıkan adamı dinle", "line": "İmzalandı."},
		{"t": "card", "big": "Dönüş", "small": "Dükkânının önüne", "dur": 3.5}, {"t": "groups", "off": ["b11c", "b11d"]}, {"t": "tp", "p": pt["depo3"], "yaw": street.rotation.y},
		{"t": "talk", "who": usta, "text": "Dükkânın önünde komşu esnafla konuş", "line": "Aç kaldık, teslim olmadık. Bugün ekmek bitti."},
		{"t": "card", "big": "9 Şubat 1921", "small": "Sessizlik.", "dur": 8.0}, {"t": "wait", "dur": 8.0}, {"t": "date", "to": "ep"},
	]
	chapters["b11"] = b11
	for i in b11.size():
		if b11[i].get("id", "") == "day":
			i_day11 = i
	# ---------------- EPİLOG — "Bir Şehir Sustu"
	# TARİHÎ DAYANAK: teslimden sonra Fransız idaresi ve halkın Fransızlara tahıl ve kereste satmayı reddetmesi (tek kaynak,
	#   doğrulanmadı); 20 Ekim 1921 Ankara Antlaşması (doğrulanmış); 25 Aralık 1921'de son Fransız askerlerinin şehri terk etmesi (doğrulanmış).
	# SABİT: 25 Aralık 1921 kurtuluşu. KURGU: memur, yolcu ve konuşmalar. EKSİK: hasarlı şehir görünümü modellenmedi.
	var ep := [
		{"t": "card", "big": "EPİLOG", "small": "Şubat – Ekim 1921 · Şehir işgal altında"}, {"t": "groups", "on": ["p3", "ep1"]}, {"t": "role", "role": "esnaf"}, {"t": "tp", "p": pt["depo3"], "yaw": street.rotation.y},
		{"t": "title", "title": "İşgal Altında"},
		{"t": "talk", "who": usta, "text": "Dükkânı yeniden aç; komşu esnafla konuş", "line": "Kepengi kaldır. Satacak az şey var ama dükkân kapalı durmasın."},
		{"t": "talk", "who": _is("memur"), "text": "Fransız satın alma memurunu dinle", "line": "Du blé, du bois ?  — «Buğday, kereste?»"},
		{"t": "wait", "dur": 5.0, "text": "Cevabın: «Malım var. Sana yok.»"},
		{"t": "card", "big": "20 EKİM 1921", "small": "Ankara Antlaşması", "tarih": "20 Ekim 1921", "dur": 5.0}, {"t": "groups", "on": ["ep2"], "off": ["ep1"]},
		{"t": "title", "title": "Ankara Antlaşması"},
		{"t": "talk", "who": _is("epyolcu"), "text": "Haberi getiren yolcuyu dinle", "line": "İmzalamışlar. Gidecekler."},
		{"t": "card", "big": "25 ARALIK 1921", "small": "Son Fransız askerleri şehri terk ediyor", "tarih": "25 Aralık 1921", "donem": "1921 · KURTULUŞ", "dur": 6.0, "hava": "sabah"}, {"t": "groups", "off": ["p3", "ep2"]}, {"t": "tp", "p": pt["depo3"], "yaw": street.rotation.y},
		{"t": "title", "title": "25 Aralık 1921"},
		{"t": "goto", "p": pt["kale"], "r": 4.0, "text": "Prologda dolaştığın sokağı baştan sona yürü", "label": "Sokağın sonu"},
		{"t": "card", "big": "Bir şehir sustu. Ama unutmadı.", "small": "Gaziantep 1918–1921", "dur": 12.0}, {"t": "wait", "dur": 6.0},
	]
	chapters["ep"] = ep
	for i in b6.size():
		if b6[i].get("id", "") == "night":
			i_night6 = i
	for i in b3.size():
		if b3[i].get("id", "") == "break":
			i_break = i


func _cfg(waves: Array, limit: float, on_tick: Callable) -> Dictionary:
	var al := []
	for a in b2_allies + [karayilan, ally0]:
		if a != null and not a.hidden and a.pose != "down":
			al.append(a)
	var c := {"allies": al, "spawns": spawns, "lanes": lanes, "waves": waves, "target_bias": 0.6, "limit": limit}
	if on_tick.is_valid():
		c["on_tick"] = on_tick
	return c


## İkinci hücum: 42. saniyede Karayılan vurulur (tarihî sonuç sabittir)
func _tick2(t: float) -> void:
	if t > 42.0 and not fallen:
		fallen = true
		karayilan.external = true
		karayilan.set_pose("down")
		for al in combat.allies:
			if al["a"] == karayilan:
				al["down"] = true


# ================================================================ bölüm geçişi
func set_chapter(k: String) -> void:
	var prev := ch
	ch = k
	listen_sc = null
	seen = {}
	combat.stop()
	_set_role({})
	_set_carry(false)
	inv = {}
	for g in ["k3v", "k1", "k2a", "k2b", "k3", "k3f", "k3s", "k5", "p1", "p2", "p3", "p4", "p5", "heyet", "b1", "b1y1", "b1y2", "b2h", "b2ha0", "b2hy", "b2c", "b2cy", "b3", "b4", "b4g", "b5", "b5f", "b6", "b6k", "b6f", "b7a", "b7b", "b7c", "b7y", "b8", "b8m", "b8f", "b8t", "b9", "b9a", "b6u", "b10a", "b10b", "b10z1", "b10z2", "b10h", "b10k", "b11a", "b11c", "b11d", "ep1", "ep2"]:
		npcs.set_group(g, false)
	for a in npcs.agents:
		if a.grp == "" and a.hidden:
			npcs.set_hidden(a, false)
	var S: Array = chapters[k]
	if prog[k] >= S.size():
		prog[k] = 0
	for s in S:
		s.erase("_on")
		s.erase("_t")
	_donem(META[k]["donem"])
	ui.date.text = META[k]["tarih"]
	world.set_weather(HAVA.get(k, "gunduz"))
	city.set_damage(HASAR.get(k, 0.0))
	npcs.siege = k.begins_with("b") and k != "b"   # 1 Nisan 1920 ve sonrası: kuşatma
	var tp = null
	for i in prog[k]:
		var s: Dictionary = S[i]
		if s["t"] == "groups":
			_groups(s)
		elif s["t"] == "role":
			_set_role(s)
		elif s["t"] == "tp":
			tp = s
		if s.has("donem"):
			_donem(s["donem"])
		if s.has("tarih"):
			ui.date.text = s["tarih"]
		if s.has("hava"):
			world.set_weather(s["hava"])
		_items(s, true)
	if tp != null and prev != k:
		_teleport(tp["p"], tp.get("yaw", 0.0))
		if _sinema_ok():
			sinema.play(tp["p"], tp.get("yaw", 0.0))
	if k == "heyet":
		npcs.set_group("heyet", true)
		st_stage = 1
		st_done = {}
		st_job = null
		st_script = null
		st_end = -1.0
		cards.append({"big": "GİZLİ TOPLANTI", "small": "Kasım 1919 · Heyet-i Merkeziye evlerde gizlice toplanıyor"})
	_sync()
	_render()
	_render_inv()


## Bölüm açılışı kamera geçişi yalnız gerçek oyunda: sınama, ölçüm ve görüntü alma kiplerinde atlanır.
func _sinema_ok() -> bool:
	var a := OS.get_cmdline_user_args()
	return sinema != null and not autoplay and not ("--bench" in a or "--at" in a or "--sinema-yok" in a or "--routetest" in a)


func _teleport(p: Vector2, yaw: float) -> void:
	if combat.active and combat.overrun:
		combat.stop()
	fade_t = 0.7
	ui.fade.color.a = 1.0
	player.place(Vector3(p.x, 0, p.y), yaw)
	city.warm(p.x, p.y)


func _groups(s: Dictionary) -> void:
	for g in s.get("on", []):
		npcs.set_group(g, true)
	for g in s.get("off", []):
		npcs.set_group(g, false)


## Adımın verdiği ve harcadığı eşyalar (bez, su, fişek sandığı)
func _items(s: Dictionary, replay := false) -> void:
	for k in s.get("give", {}):
		inv[k] = inv.get(k, 0) + s["give"][k]
	if replay and s.has("need"):
		var n: int = s["n"] if s["t"] == "talkN" else 1
		for k in s["need"]:
			inv[k] = maxi(0, inv.get(k, 0) - s["need"][k] * n)
	for k in s.get("take", []):
		inv.erase(k)


## Oyuncunun karakteri (kurmaca). weapon: tüfek kuşanılır
func _set_role(s: Dictionary) -> void:
	role = s.get("role", "")
	combat.equip(s.get("weapon", false))
	if s.get("weapon", false):
		combat.resupply(s.get("ammo", 25))
	ui.role.text = String(ROLLER.get(role, "")).to_upper()


## Dönem etiketini yazar ve nüfusu o döneme göre ayarlar (işgal devriyeleri dönem metninden okunur)
func _donem(t: String) -> void:
	ui.donem.text = "GAZİANTEP   ·   " + t
	_population()


## Bölümün nüfus profilini uygular. Dönem metni işgal altını gösteriyorsa devriyeler eklenir.
func _population() -> void:
	var p: Dictionary = NUFUS.get(ch, NUFUS["a"]).duplicate()
	var d: String = ui.donem.text
	if d.contains("İNGİLİZ"):
		p["patrol"] = "ingiliz"
	elif d.contains("FRANSIZ") or d.contains("İŞGAL ALTINDA") or d.contains("TESLİM"):
		p["patrol"] = "fransiz"
	elif d.contains("KURTULUŞ"):
		p["walk"] = 1.0
		p["civ"] = 1.0
	if not p.has("patrol"):
		p["patrol"] = ""
	npcs.set_population(p)


## Sırtta yaralı taşırken oyuncu yavaşlar ve koşamaz
func _set_carry(on: bool) -> void:
	carrying = on
	player.speed_scale = 0.62 if on else 1.0
	_render_inv()


func step() -> Dictionary:
	if ch == "" or prog[ch] >= chapters[ch].size():
		return {}
	return chapters[ch][prog[ch]]


func next() -> void:
	var s := step()
	if not s.is_empty():
		_items(s)
	prog[ch] += 1
	seen = {}
	_sync()
	_render()
	_render_inv()


## Kendiliğinden geçilen adımlar: kart, grup, başlık, karakter, ışınlama
func _auto_steps() -> void:
	var kart := false     # bu turda bir bölüm/sahne kartı açıldı mı: öyleyse ardından gelen ışınlama sinematik geçişle yapılır
	for guard in 12:
		var s := step()
		if s.is_empty():
			return
		if s.has("donem"):
			_donem(s["donem"])
		if s.has("tarih"):
			ui.date.text = s["tarih"]
		if s.has("hava"):
			world.set_weather(s["hava"])
		match s["t"]:
			"card":
				cards.append(s)
				kart = true
				next()
			"groups":
				_groups(s)
				next()
			"title":
				next()
			"role":
				_set_role(s)
				next()
			"tp":
				_teleport(s["p"], s.get("yaw", 0.0))
				if kart and _sinema_ok():
					sinema.play(s["p"], s.get("yaw", 0.0))
				next()
			_:
				return


# ================================================================ sahne eşlemesi
func _fx_done(S: Array, fx: String, i: int) -> bool:
	for k in S.size():
		if S[k].get("fx", "") == fx:
			return k < i
	return false


func _move(y: Dictionary, dropped: bool) -> void:
	var sp: Dictionary = y["to"] if dropped else y["from"]
	var a: Npc = y["a"]
	if a.xz().distance_to(_v(sp)) > 0.05:
		a.put(sp["x"], sp["z"], sp.get("yaw", 0.0))


func _sync() -> void:
	var i: int = prog.get(ch, 0)
	var in_b1 := ch == "b1"
	var in_b2 := ch == "b2"
	# ---- bölüm 1: barikatın yüksekliği, yaralıların yeri
	if in_b1:
		var S: Array = chapters["b1"]
		b1_stage = 0
		for k in mini(i, S.size()):
			if S[k].get("fx", "") == "grow":
				b1_stage += 1
		for n in 2:
			var picked := _fx_done(S, "pick%d" % (n + 1), i)
			var dropped := _fx_done(S, "drop%d" % (n + 1), i)
			_move(yarali[n], dropped)
			carry1[n] = picked and not dropped
			if npcs.groups.get("b1y%d" % (n + 1), false) or carry1[n]:
				npcs.set_hidden(yarali[n]["a"], carry1[n])   # sırtlanan yaralı sokakta görünmez
		_set_carry(carry1[0] or carry1[1])
	var vis := npcs.siege
	for b in bars:
		var st: int = b1_stage if (b["buildable"] and in_b1) else 3
		for k in b["layers"].size():
			b["layers"][k].visible = vis and k < st
		for c in b["solids"]:
			c.disabled = not (vis and st >= 2)
	pile.visible = in_b1 or ch == "b4"
	seats1.visible = in_b1
	# ---- bölüm 2
	var on_hill: bool = in_b2 and i > ix["hill"] and i <= ix["city"]
	var in_city: bool = in_b2 and i > ix["city"]
	hill.visible = in_b2
	var b6_day: bool = ch == "b6" and i < i_night6
	city2.visible = in_city or b6_day
	ruin6.visible = ch == "b6"
	if ch == "b6":
		city.off.erase(ruin6_col)
	else:
		city.off[ruin6_col] = true
	for c in hill_cols:
		if in_b2:
			city.off.erase(c)
		else:
			city.off[c] = true
	if in_city or b6_day:
		city.off.erase(rubble_col)
	else:
		city.off[rubble_col] = true
	shelling = (in_b2 and i >= ix["shell"] and i < chapters["b2"].size() - 3) or (ch == "b6" and i > 3 and i < i_night6 - 1)
	if in_b2:
		var S2: Array = chapters["b2"]
		var after1: bool = i > ix["c1"]
		var carry_h := _fx_done(S2, "pickH", i) and not _fx_done(S2, "dropH", i)
		var carry_c := _fx_done(S2, "pickC", i) and not _fx_done(S2, "dropC", i)
		_move(y_h, _fx_done(S2, "dropH", i))
		_move(y_c, _fx_done(S2, "dropC", i))
		npcs.set_group("b2ha0", on_hill and not after1)
		npcs.set_group("b2hy", on_hill and after1 and not carry_h)
		npcs.set_group("b2cy", in_city and not carry_c)
		fallen = i > ix["c2"]
		karayilan.external = fallen
		karayilan.set_pose("down" if fallen else "idle")
		_set_carry(carry_h or carry_c)
	# ---- bölüm 3
	seats3.visible = ch == "b3" or ch == "b4"
	# ---- bölüm 4: gece nöbeti karanlıkta geçer; kapı kanadı barikata dayanınca görünür
	world.set_night((ch == "b4" and i <= i_day4) or (ch == "b6" and i > i_night6) or (ch == "b11" and i < i_day11))
	# ---- anma sahneleri: sesler kesilir (Şehit Kâmil yazısı, Dokurcum Değirmeni, Şahin Bey'in şehadeti)
	if sfx:
		sfx.set_hush((ch == "k2" and i > i_kamil and i <= i_kamil + 3) or (ch == "k4" and i > i_mill) or (ch == "k5" and i > i_elmali))
	# ---- bölüm 10: kış; hastalananların taşınması
	world.set_winter(ch == "b10" or ch == "b11")
	# ---- bölüm 11: huruç siperi
	site11.visible = ch == "b11"
	for c11 in cols11:
		if ch == "b11":
			city.off.erase(c11)
		else:
			city.off[c11] = true
	if ch == "b10":
		var S10: Array = chapters["b10"]
		var any10 := false
		for n10 in 2:
			var pk := _fx_done(S10, "pickZ%d" % (n10 + 1), i)
			var dp := _fx_done(S10, "dropZ%d" % (n10 + 1), i)
			_move(y10[n10], dp)
			if npcs.groups.get("b10z%d" % (n10 + 1), false) or (pk and not dp):
				npcs.set_hidden(y10[n10]["a"], pk and not dp)
			any10 = any10 or (pk and not dp)
		_set_carry(any10)
	# ---- bölüm 7: siperler ve yaralı
	site7.visible = ch == "b7"
	for c7 in cols7:
		if ch == "b7":
			city.off.erase(c7)
		else:
			city.off[c7] = true
	if ch == "b7":
		var S7: Array = chapters["b7"]
		var carry7 := _fx_done(S7, "pick7", i) and not _fx_done(S7, "drop7", i)
		_move(y7, _fx_done(S7, "drop7", i))
		if npcs.groups.get("b7y", false) or carry7:
			npcs.set_hidden(y7["a"], carry7)
		_set_carry(carry7)
	# ---- bölüm 6: enkazdan çıkarılan kadın
	if ch == "b6":
		var S6: Array = chapters["b6"]
		var carry6 := _fx_done(S6, "pick6", i) and not _fx_done(S6, "drop6", i)
		_move(y6, _fx_done(S6, "drop6", i))
		npcs.set_group("b6k", b6_day and not carry6)
		_set_carry(carry6)
	door4.visible = ch == "b4" and _fx_done(chapters["b4"], "door", i)
	flag5.visible = ch == "b5" and _fx_done(chapters["b5"], "flag", i)
	if ch == "b3":
		_donem(("1920 · ATEŞKES" if i <= i_break else "1920 · KUŞATMA"))


# ================================================================ konuşma
func talk(a: Npc) -> void:
	var line := _on_talk(a)
	if line == "":
		line = npcs.greeting(a)
	a.face(_pp())
	a.say(line, 5.0)
	if dlg != null and not autoplay:
		a.label.visible = false      # söz alt ortadaki konuşma panelinde gösterilir
		_dialogue(a, line, 5.0)
	if a.kisi != "":
		met[a.kisi] = true


func _on_talk(a: Npc) -> String:
	if ch == "":
		return ""
	if ch == "heyet":
		return _story_talk(a)
	_auto_steps()
	var s := step()
	if not s.is_empty() and (s["t"] == "talk" or s["t"] == "talkN") and s["who"].call(a):
		if s["t"] == "talkN" and seen.has(a.id):
			return s.get("again", "Bildiğim bu kadar.")
		if s.has("need"):
			for k in s["need"]:
				if inv.get(k, 0) < s["need"][k]:
					return s.get("fail", "Elin boş gelmişsin.")
			for k in s["need"]:
				inv[k] -= s["need"][k]
			_render_inv()
		var line: String = s["line"]
		if s.get("send", false):
			npcs.send_away(a)   # mahzene iner: sokaktan çekilir
		if s["t"] == "talkN":
			seen[a.id] = true
			if seen.size() < s["n"]:
				_render()
				return line
		next()
		return line
	match a.tag:
		"ing":
			return "Move along.  — «Yürü, durma.»"
		"fr", "dusman":
			return "Circulez.  — «Dağılın.»"
		"kalabalik":
			return "Sus, dinleyelim."
		"firinci":
			return "Ekmek taze, afiyet olsun."
		"karayilan":
			return "Gözün ileride olsun."
		"b2a", "b2a0":
			return "Fişek az. Boşa atma."
		"sargici":
			return "Bez az, su az. Elimizdekiyle idare edeceğiz."
		"komutan":
			return "Önce verdiğim işi bitir."
		"b7bas":
			return "Başını kaldırma; fişeğini say."
		"b7s":
			return "Fişek az. Boşa atma."
		"b6komsu":
			return "Sen yaşayana koş evladım."
		"k3koylu":
			return ["Yol kapalı diyorlar; iyi ki kapalı.", "Erzakı karargâha götür evlat.", "Tarlaya çıkamaz olduk."][randi() % 3]
		"k2anne":
			return "…"
		"k2kalabalik":
			return "Yaklaşma. Askerler orada."
		"karayilan1":
			return "İşaret vermeden kimse kıpırdamasın."
		"sahin":
			return "Bu yoldan araba geçmeyecek."
		"sahin5":
			return "…"
		"k1s", "k3s", "k5s":
			return "Fişeğini sayarak at."
		"k3fr":
			return "Halte !  — «Dur!»"
		"b11bekleyen":
			return "Bekliyoruz."
		"b11s":
			return "Son fişekler. Allah'a emanet."
		"memur":
			return "Du blé, du bois ?  — «Buğday, kereste?»"
		"b10kiran":
			return "Acı ama karın doyuruyor."
		"b10anne", "b10komsu":
			return "Allah kimseyi açlıkla sınamasın."
		"b10hamal":
			return "Yirmi yıl yükümü taşıdı."
		"firinci9":
			return "Yarın un gelir mi, bilmem."
		"b9usta":
			return "Boş kovanı atma; dolduracağız."
		"b9kuscu":
			return "Kuşlar da aç evlat."
		"b9hamal":
			return "Yük yok, yem yok."
		"gozcu8":
			return "Gözüm çadırlarda."
		"b8itiraz":
			return "Açız evlat, açız."
		"fr6", "fr8":
			return "Halte !  — «Dur!»"
		"yaver":
			return "Emir açık: herkes bağlı olduğu cepheyi bilecek."
		"b4kadin":
			return "Elimizde ne varsa barikata."
		"b4y":
			return "Gece uzun sürdü."
	if a == npcs.usta:
		return "İşin bitmeden dönme."
	if not a.story and a.kimlik.get("ad", "") != "" and a.family != "child":
		return yol_tarifi(a)   # sıradan sakin: göreve eşlik eder, yol tarif eder
	return ""


# ---------------- gizli toplantı
func _story_talk(a: Npc) -> String:
	if st_stage == 1 and a == npcs.usta:
		st_stage = 2
		_render()
		return "Bu akşam bahçeli evde toplanılıyor. Kapıdakine \"Hayırlı işler\" de."
	if st_stage == 2 and a == lookout:
		st_stage = 3
		_render()
		return "Hayırlı işler… Geç içeri, bekliyorlar."
	if st_stage == 2 and a in members:
		return "Seni tanımıyorum. Kapıdaki arkadaşla konuş."
	if st_stage == 3 and a in members:
		return "Sus, dinle."
	if st_stage >= 4:
		if st_job != null:
			var s: Dictionary = jobs[st_job["id"]]["steps"][st_job["i"]]
			if (s["t"] == "talk" or s["t"] == "talkN") and s["who"].call(a):
				if s["t"] == "talkN":
					if st_job["seen"].has(a.id):
						return "Ben verdim ya, öbür dükkânlara da uğra."
					st_job["seen"][a.id] = true
					if st_job["seen"].size() < s["n"]:
						_render()
						return s["line"]
				_story_advance()
				return s["line"]
			if a.tag == "kom:" + st_job["id"]:
				return "Önce verdiğim işi bitir."
		if a.tag.begins_with("kom:"):
			var id := a.tag.substr(4)
			if st_done.has(id):
				return "Senin işin burada tamam. Sağ ol."
			if st_job != null:
				return "Elindeki işi bitir, sonra gel."
			st_job = {"id": id, "i": 0, "seen": {}}
			_render()
			return jobs[id]["giris"]
		if not members.is_empty() and a == members[0]:
			return "Bütün kollar işliyor. Antep hazırlanıyor." if st_done.size() >= 7 else "Kollara git, ne iş verirlerse yap."
	if not a.story and a.kimlik.get("ad", "") != "" and a.family != "child" and st_stage < 5:
		return yol_tarifi(a)
	return ""


func _story_advance() -> void:
	st_job["i"] += 1
	st_job["seen"] = {}
	if st_job["i"] >= jobs[st_job["id"]]["steps"].size():
		st_done[st_job["id"]] = true
		st_job = null
		if st_done.size() >= 7:
			st_stage = 5
			cards.append({"big": "Teşkilat kuruldu.", "small": "Yirmi yedi semt, yedi komisyon — Antep hazırlanıyor"})
			st_end = 7.0
	_render()


func _story_update(dt: float) -> void:
	var c: Vector2 = pt["sargi"]
	if st_stage == 3 and st_script == null and _pp().distance_to(c) < 4.2 and members.size() >= 3:
		var l: Npc = members[0]
		var a: Npc = members[1]
		var b: Npc = members[2]
		st_script = {"i": -1, "t": 0.5, "lines": [[l, "Şehri yirmi yedi semte ayıracağız."], [l, "Her semtten yüz kişi yazılacak."], [a, "Hepsine silah bulamayız."], [l, "Silah tutamayan siper kazar, erzak taşır, yaralıya bakar."],
			[b, "Para, erzak, mühimmat, sağlık, tahkimat, asker ailelerine yardım, haberleşme… Her işe bir kol kuralım."], [l, "Sen de boş durma. Kollardan birine git, ne iş verirlerse yap."]]}
	if st_script != null:
		st_script["t"] -= dt * (12.0 if autoplay else 1.0)
		if st_script["t"] <= 0.0:
			st_script["i"] += 1
			if st_script["i"] >= st_script["lines"].size():
				st_script = null
				st_stage = 4
				_render()
			else:
				var ln: Array = st_script["lines"][st_script["i"]]
				npcs.say(ln[0], ln[1], 4.2)
				st_script["t"] = 4.4
	if st_job != null:
		var s: Dictionary = jobs[st_job["id"]]["steps"][st_job["i"]]
		if s["t"] == "goto" and _pp().distance_to(s["p"]) < s["r"]:
			_story_advance()
	if st_end > 0.0:
		st_end -= dt * (12.0 if autoplay else 1.0)
		if st_end <= 0.0:
			print("CHAPTER_DONE heyet")
			set_chapter("k1")


# ================================================================ hedefler
func _mark_npc(out: Array, a: Npc, label: String) -> void:
	if a != null and not a.hidden:
		out.append({"p": a.global_position + Vector3(0, a.height + 0.55, 0), "label": label, "a": a})


func _mark_pt(out: Array, p: Vector2, label: String) -> void:
	out.append({"p": Vector3(p.x, city.ground(p.x, p.y) + 2.4, p.y), "label": label})


func _matching(who: Callable, skip: Dictionary) -> Array:
	var c := []
	for a in npcs.agents:
		if not a.hidden and not skip.has(a.id) and who.call(a):
			c.append(a)
	var pp := _pp()
	c.sort_custom(func(x: Npc, y: Npc) -> bool: return x.xz().distance_to(pp) < y.xz().distance_to(pp))
	return c.slice(0, 3)


## İki nokta arasında yol ağını izleyen rota (sokaklardan; yapıların içinden geçmez). Yol ağı olmayan yerde (kırsal)
## en yakın düğüme kadar sokak, kalanı düz çizgi.
func route_between(a: Vector2, b: Vector2) -> PackedVector2Array:
	var out := PackedVector2Array()
	var nav := npcs.nav
	var na := nav.nearest(a, 90.0)
	var nb := nav.nearest(b, 90.0)
	# uçlardan biri yol ağının dışındaysa (kırsal): öbür uca doğru ilerleyip şehrin kenarındaki ilk düğümü bul
	if nb < 0 and na >= 0:
		for k in range(1, 45):
			nb = nav.nearest(b.move_toward(a, k * 80.0), 90.0)
			if nb >= 0:
				break
	if na < 0 and nb >= 0:
		for k in range(1, 45):
			na = nav.nearest(a.move_toward(b, k * 80.0), 90.0)
			if na >= 0:
				break
	out.append(a)
	if na >= 0 and nb >= 0 and na != nb:
		var pth := nav.path(na, nb, 9000)
		for i in pth:
			out.append(nav.pos[i])
	out.append(b)
	return out


func set_waypoint(p) -> void:
	waypoint = p
	route_t = 0.0


## Rota: önce oyuncunun işareti, yoksa görev hedefi, o da yoksa dükkâna dönüş yolu. İki saniyede bir (ve hedef değişince)
## yeniden hesaplanır; oyuncu başka sokağa saparsa rota kendiliğinden yenilenir.
func _route() -> void:
	route = PackedVector2Array()
	route_len = 0.0
	route_kind = ""
	var goal = null
	var tg := targets()
	if waypoint != null:
		if _pp().distance_to(waypoint) < 6.0:
			waypoint = null
		else:
			goal = waypoint
			route_kind = "isaret"
	if goal == null and not tg.is_empty():
		goal = Vector2(tg[0]["p"].x, tg[0]["p"].z)
		route_kind = "hedef"
	if goal == null:
		var home := npcs.hp(street.cx(-2.0), -2.0)
		if _pp().distance_to(home) > 30.0 and _pp().distance_to(home) < 1500.0:
			goal = home
			route_kind = "donus"
	if goal == null:
		return
	route = route_between(_pp(), goal)
	for i in route.size() - 1:
		route_len += route[i].distance_to(route[i + 1])


## Rota sınaması (--routetest): yönergedeki senaryolar için rotayı hesaplar; her parçanın bir yapıyı kesip kesmediğini sayar.
func route_test() -> void:
	var home := npcs.hp(street.cx(-2.0), -2.0)
	var cases := [["Kale'den çarşıya", Vector2(50, 92), home], ["Çarşıdan camiye (Alaüddevle)", home, pt.get("cami", home)],
		["Şehir dışına (Acar köyü)", home, pt["k3"]], ["Sapma: başka sokaktan aynı hedefe", home + Vector2(70, -40), pt.get("cami", home)],
		["Dönüş: hedeften dükkâna", pt.get("han", home), home], ["Haritadan seçilen hedef", home, Vector2(-300, 600)]]
	for c in cases:
		var r := route_between(c[1], c[2])
		var l := 0.0
		var hit := 0
		for i in r.size() - 1:
			l += r[i].distance_to(r[i + 1])
			# uçlardaki bağlantı parçaları (oyuncu -> ilk düğüm, son düğüm -> hedef) sayılmaz
			if i > 0 and i < r.size() - 2 and city.los_blocked(r[i].lerp(r[i + 1], 0.1), r[i].lerp(r[i + 1], 0.9)):
				hit += 1
		print("ROTA_TEST %-36s nokta=%4d  yol=%6.0f m  kuş_uçuşu=%6.0f m  yapıyı_kesen_parça=%d" % [c[0], r.size(), l, c[1].distance_to(c[2]), hit])


## Şu an gidilecek yerler / konuşulacak kişiler
func targets() -> Array:
	var out := []
	if ch == "heyet":
		if st_stage == 1:
			_mark_npc(out, npcs.usta, "Esnaf")
		elif st_stage == 2:
			_mark_npc(out, lookout, "Gözcü")
		elif st_stage == 3:
			_mark_pt(out, pt["sargi"], "Toplantı")
		elif st_stage == 4:
			if st_job == null:
				for id in KOMISYON:
					if not st_done.has(id):
						_mark_npc(out, heads[id], jobs[id]["ad"])
			else:
				var s: Dictionary = jobs[st_job["id"]]["steps"][st_job["i"]]
				if s["t"] == "goto":
					_mark_pt(out, s["p"], "")
				else:
					for a in _matching(s["who"], st_job["seen"]):
						_mark_npc(out, a, "")
		return out
	var s := step()
	if s.is_empty():
		return out
	if s["t"] == "goto" or s["t"] == "listen" or s["t"] == "sneak":
		_mark_pt(out, s["p"], s.get("label", ""))
	elif s["t"] == "talk" or s["t"] == "talkN":
		for a in _matching(s["who"], seen):
			_mark_npc(out, a, "")
	return out


# ================================================================ her kare
func _process(dt: float) -> void:
	ui.fps.text = "%d fps · %s" % [Engine.get_frames_per_second(), world.quality]
	if fade_t > 0.0:
		fade_t -= dt
		ui.fade.color.a = clampf(fade_t / 0.4, 0.0, 1.0)
	# bölüm kartları
	if card_t > 0.0:
		card_t -= dt * (10.0 if autoplay else 1.0)
		var al := clampf(card_t, 0.0, 1.0)
		ui.card.modulate.a = al
		ui.sub.modulate.a = al
	elif not cards.is_empty():
		var cd: Dictionary = cards.pop_front()
		ui.card.text = cd["big"]
		ui.sub.text = cd.get("small", "")
		ui.card.modulate.a = 1.0
		ui.sub.modulate.a = 1.0
		if sfx and not autoplay:
			sfx.play("card", 0.6)
		card_t = cd.get("dur", 5.5)
	var f := npcs.focus
	ui.hint.text = ("Konuş   ·   " + f.kisi) if (f != null and f.kisi != "") else ("Konuş" if f != null else "")
	ui.hint_panel.visible = ui.hint.text != "" and dlg.modulate.a < 0.05
	ui.hp.size = Vector2(ui.hp_w * clampf(combat.hp / 100.0, 0.0, 1.0), 4)
	ui.hp.color = Color(0.56, 0.7, 0.42) if combat.hp > 45.0 else Color(0.8, 0.3, 0.22)
	ui.qline.size.y = maxf(40.0, ui.qbox.size.y - 6.0)
	ui.qstrip.size.y = ui.qbox.size.y + 44.0
	ui.daypart.text = GUN_ADI.get(world.weather, "")
	if k5_smoke != null:
		k5_smoke.visible = ch == "k5" and prog["k5"] >= 4
	if ch == "":
		return
	if ch == "heyet":
		_story_update(dt)
	else:
		_chapter_update(dt)
	_shell(dt)
	_draw_marks()
	# baskın altında vurulmak: sonuç değişmez; arkadaşları oyuncuyu ateş altından çeker
	if combat.overrun and combat.result == "lost":
		combat.stop()
		combat.result = ""
		combat.hp = 60.0
		cards.append({"big": "Yaralandın", "small": "Arkadaşların seni ateş altından çekti.", "dur": 4.0})
		var cs := step()
		if not cs.is_empty() and cs["t"] == "goto":
			_teleport(cs["p"], player.yaw)
	# çatışma sürerken siviller saklanır
	if npcs.shelter != combat.active:
		npcs.shelter = combat.active
		npcs._apply_pop()
	if sfx:
		sfx.siege = npcs.siege and not combat.active
		sfx.quiet = ch == "b3" and prog["b3"] <= i_break   # ateşkes: uzaktan silah sesi susar
		sfx.birds = not world.night and not world.winter and not combat.active
		sfx.set_crowd(0.0 if npcs.shelter else float(npcs.pop.get("walk", 0.0)))
	route_t -= dt
	if route_t <= 0.0 and not autoplay:
		route_t = 1.5
		_route()
	if autoplay:
		_auto(dt)
	if end_t > 0.0:
		end_t -= dt
		if end_t <= 0.0:
			get_tree().quit()


func _chapter_update(dt: float) -> void:
	_auto_steps()
	var s := step()
	if s.is_empty():
		if not all_done and ch == ORDER[ORDER.size() - 1]:
			all_done = true
			print("CHAPTER_DONE ", ch)
			print("ALL_DONE")
			if autoplay:
				end_t = 1.0
		return
	match s["t"]:
		"date":
			prog[ch] += 1
			print("CHAPTER_DONE ", ch)
			set_chapter(s["to"])
		"goto":
			if _pp().distance_to(s["p"]) < s["r"]:
				if combat.overrun:
					combat.stop()   # geri çekilme tamamlandı
				next()
		"sneak":
			# Gizlenerek geçiş: nöbetçinin 18 m yakınında ayakta durmak ya da 5 m'ye sokulmak fark edilmek demektir
			if _pp().distance_to(s["p"]) < s["r"]:
				next()
			elif not autoplay and fade_t <= 0.0:
				for a in npcs.agents:
					if a.tag != s["guards"] or a.hidden:
						continue
					var gd := a.xz().distance_to(_pp())
					if gd < s.get("near", 5.0) or (gd < 18.0 and player.crouch < 0.5):
						a.say("Halte !  — «Dur!»", 3.0)
						_teleport(s["start"]["p"], s["start"]["yaw"])
						cards.append({"big": "Görüldün", "small": "Nöbetçinin yakınından çömelerek geç (C); koşma.", "dur": 4.0})
						break
		"wait":
			s["_t"] = s.get("_t", s["dur"]) - dt * (12.0 if autoplay else 1.0)
			if s["_t"] <= 0.0:
				s.erase("_t")
				next()
		"listen":
			if listen_sc == null and _pp().distance_to(s["p"]) < s["r"]:
				listen_sc = {"i": -1, "t": 1.0}
			if listen_sc != null:
				listen_sc["t"] -= dt * (12.0 if autoplay else 1.0)
				if listen_sc["t"] <= 0.0:
					listen_sc["i"] += 1
					if listen_sc["i"] >= s["lines"].size():
						listen_sc = null
						next()
					else:
						var ln: Array = s["lines"][listen_sc["i"]]
						npcs.say(ln[0], ln[1], 3.8)
						listen_sc["t"] = 1.4 if ln[0].tag == "kalabalik" else 4.0
		"combat":
			if not s.get("_on", false):
				var cf: Dictionary = s["cfg"].call()
				if s.get("endless", false):
					cf["endless"] = true   # tarihte kaybedilen / geri çekilmeyle biten çatışma: düşman tükenmez
				combat.start(cf)
				s["_on"] = true
			if autoplay and combat.t > 1.0 and combat.result == "":
				if combat.cfg.has("on_tick"):
					combat.cfg["on_tick"].call(999.0)
				combat.result = "won"
			if combat.result == "won":
				s["_on"] = false
				if s.get("endless", false):
					# süre doldu: çekilme emri. Çatışma baskın kipinde sürer; oyuncu geri çekilme hedefine varınca biter.
					combat.set_overrun()
					cards.append({"big": "ÇEKİLME EMRİ", "small": s.get("emir", "Hat tutulamıyor."), "dur": 5.0})
				else:
					combat.stop()
				next()
			elif combat.result == "lost":
				combat.stop()
				combat.result = ""
				combat.hp = 100.0
				s["_on"] = false
				_teleport(s["start"]["p"], s["start"]["yaw"])
				cards.append({"big": "Yaralandın", "small": "Siperin arkasında çömel (C); mekanizma kurulurken başını kaldırma.", "dur": 4.0})


## Bombardıman: rastgele bir noktaya top mermisi düşer (toz, sarsıntı). Yakına düşerse oyuncu yaralanır.
func _shell(dt: float) -> void:
	for p in puffs:
		if p["t"] > 0.0:
			p["t"] -= dt
			var k: float = 1.0 - p["t"] / 2.2
			p["m"].scale = Vector3.ONE * (1.5 + k * 9.0)
			p["m"].material_override.albedo_color.a = maxf(0.0, 0.55 * (1.0 - k))
			if p["t"] <= 0.0:
				p["m"].visible = false
	player.shake = maxf(0.0, player.shake - dt * 1.4)
	if not shelling:
		pending = null
		return
	shell_t -= dt
	if pending != null:
		pending["t"] -= dt
		if pending["t"] <= 0.0:
			var q: Vector2 = pending["p"]
			pending = null
			var d := _pp().distance_to(q)
			var pf: Dictionary = puffs[0]
			for p in puffs:
				if p["t"] <= 0.0:
					pf = p
					break
			pf["m"].global_position = Vector3(q.x, city.ground(q.x, q.y) + 1.2, q.y)
			pf["m"].visible = true
			pf["t"] = 2.2
			player.shake = maxf(player.shake, minf(1.0, 26.0 / (d + 6.0)))
			if d < 7.0 and not autoplay:
				combat.damage(25.0)
	if shell_t <= 0.0 and pending == null:
		shell_t = 6.0 + rng.randf() * 8.0
		var a := rng.randf() * TAU
		var r := 16.0 + rng.randf() * 50.0
		pending = {"p": _pp() + Vector2(cos(a), sin(a)) * r, "t": 0.95}
		if sfx and not autoplay:
			sfx.play("shell", clampf(22.0 / r, 0.15, 1.0))


func _draw_marks() -> void:
	var tg := targets()
	var cam: Camera3D = player.cam
	var size := get_viewport().get_visible_rect().size
	for i in marks.size():
		var m: Label = marks[i]
		if i >= tg.size() or cam.is_position_behind(tg[i]["p"]):
			m.visible = false
			continue
		var p: Vector3 = tg[i]["p"]
		var sp := cam.unproject_position(p)
		sp.x = clampf(sp.x, 40.0, size.x - 40.0)
		sp.y = clampf(sp.y, 60.0, size.y - 60.0)
		var lbl: String = tg[i].get("label", "")
		m.text = "◆ %s%d m" % [(lbl + " · ") if lbl != "" else "", int(_pp().distance_to(Vector2(p.x, p.z)))]
		m.visible = true
		m.position = sp - Vector2(m.size.x * 0.5, 22)


func toggle_map() -> void:
	if menu.is_open():
		return
	big_map.visible = not big_map.visible
	ui.play.visible = not big_map.visible
	menu.set_active("map" if big_map.visible else "")
	# büyük harita açıkken fare serbesttir (yakınlaştır, sürükle, tıkla) ve karakter durur
	if big_map.visible:
		big_map.pivot_offset = big_map.size * 0.5
		big_map.modulate.a = 0.0
		big_map.scale = Vector2(0.965, 0.965)
		var tw := create_tween().set_parallel(true)
		tw.tween_property(big_map, "modulate:a", 1.0, 0.22)
		tw.tween_property(big_map, "scale", Vector2.ONE, 0.26).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		big_map.open_full()
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		player.enabled = false
	else:
		player.enabled = true
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _unhandled_input(e: InputEvent) -> void:
	if not (e is InputEventKey and e.pressed and not e.echo):
		return
	if e.physical_keycode == KEY_J:
		menu.toggle("journal")
	elif e.physical_keycode == KEY_O:
		menu.toggle("settings")
	elif e.keycode == KEY_ESCAPE and (menu.journal.visible or menu.settings.visible):
		menu.close_all()
	elif (e.keycode == KEY_ESCAPE or e.physical_keycode == KEY_M) and big_map.visible:
		toggle_map()
	elif menu.is_open():
		return
	elif e.physical_keycode == KEY_E and npcs.focus != null:
		talk(npcs.focus)
	elif e.physical_keycode == KEY_M:
		toggle_map()


# ================================================================ kendiliğinden oynatma (sınama)
## Her adımda hedefe ışınlanır ve adımı tamamlar; bütün bölümleri baştan sona geçer.
func _auto(dt: float) -> void:
	auto_t -= dt
	if auto_t > 0.0 or all_done:
		return
	auto_t = 0.12
	if ch == "heyet":
		if st_stage == 1:
			_auto_talk(npcs.usta)
		elif st_stage == 2:
			_auto_talk(lookout)
		elif st_stage == 3:
			player.place(Vector3(pt["sargi"].x, 0, pt["sargi"].y), 0.0)
		elif st_stage == 4:
			if st_job == null:
				for id in KOMISYON:
					if not st_done.has(id):
						_auto_talk(heads[id])
						return
			else:
				_auto_step(jobs[st_job["id"]]["steps"][st_job["i"]], st_job["seen"])
		return
	var s := step()
	if not s.is_empty():
		_auto_step(s, seen)


func _auto_step(s: Dictionary, skip: Dictionary) -> void:
	if s["t"] == "goto" or s["t"] == "listen" or s["t"] == "sneak":
		player.place(Vector3(s["p"].x, 0, s["p"].y), player.yaw)
		# çarpışma oyuncuyu hedefin dışına ittiyse adım yine de geçilsin diye konumu doğrudan ver
		player.global_position = Vector3(s["p"].x, city.ground(s["p"].x, s["p"].y), s["p"].y)
	elif s["t"] == "talk" or s["t"] == "talkN":
		var c := _matching(s["who"], skip)
		if c.is_empty():
			push_warning("Sınama: konuşulacak kişi bulunamadı — " + s.get("text", ""))
			var any := []
			for a in npcs.agents:
				if s["who"].call(a):
					any.append(a)
			print("AUTO_STUCK ", ch, " ", s.get("text", ""), " eşleşen=", any.size())
			auto_t = 2.0
			# sokaktan çekilenleri geri getir (ör. mahzene yollananlar)
			for a in any:
				if a.grp == "" and a.hidden:
					npcs.set_hidden(a, false)
			return
		_auto_talk(c[0])


func _auto_talk(a: Npc) -> void:
	player.place(a.global_position + Vector3(0.9, 0, 0), 0.0)
	talk(a)


# ================================================================ arayüz
func _lbl(parent: Control, text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	# ince gölge + hafif dış çizgi: kutusuz yazı her zeminde okunur, ama kalın siyah kenar olmaz
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.55))
	l.add_theme_constant_override("outline_size", 3)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.6))
	l.add_theme_constant_override("shadow_offset_x", 1)
	l.add_theme_constant_override("shadow_offset_y", 1)
	parent.add_child(l)
	return l


## Soldan sağa (ya da yukarıdan aşağıya) sönen koyu şerit: kutu çizmeden yazının arkasını koyulaştırır
func _fade_strip(parent: Control, a0: float, a1: float, vertical := false) -> TextureRect:
	var gr := Gradient.new()
	gr.set_color(0, Color(0.02, 0.02, 0.025, a0))
	gr.set_color(1, Color(0.02, 0.02, 0.025, a1))
	var gt := GradientTexture2D.new()
	gt.gradient = gr
	gt.width = 64
	gt.height = 64
	if vertical:
		gt.fill_from = Vector2(0, 0)
		gt.fill_to = Vector2(0, 1)
	var tr := TextureRect.new()
	tr.texture = gt
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_SCALE
	tr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(tr)
	return tr


## Etiketi ekranın bir köşesine/ortasına sabitler; metin uzadıkça ekrandan taşmaz.
func _place(l: Control, preset: int, dx: float, dy: float, gh: int = Control.GROW_DIRECTION_END, gv: int = Control.GROW_DIRECTION_END) -> void:
	l.set_anchors_and_offsets_preset(preset)
	l.grow_horizontal = gh
	l.grow_vertical = gv
	l.offset_left += dx
	l.offset_right += dx
	l.offset_top += dy
	l.offset_bottom += dy


## Ortak panel stili: koyu yarı saydam zemin, ince altın kenar, küçük köşe yuvarlaması
func _sb(alpha := 0.74, accent := false) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.045, 0.04, 0.035, alpha)
	sb.border_color = Color(GOLD, 0.5)
	sb.set_border_width_all(1)
	if accent:
		sb.border_width_left = 3
		sb.border_color = Color(GOLD, 0.85)
	sb.set_corner_radius_all(3)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 9
	sb.content_margin_bottom = 10
	return sb


func _panel(root: Control, accent := true) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _sb(0.74, accent))
	root.add_child(panel)
	return panel


## Çerçevesiz, ince yazı (panel içi): dış çizgi yok, okunaklılık panelin zemininden gelir
func _txt(parent: Control, text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	parent.add_child(l)
	return l


## Üstten süzülen kısa bildirim (görev adımı tamamlandı, yeni görev)
func _toast(head: String, text: String) -> void:
	if autoplay or toast == null:
		return
	ui.toast_head.text = head
	ui.toast_text.text = text
	toast.reset_size()
	toast.position = Vector2((hud_root.size.x - toast.size.x) * 0.5, 92)
	if toast_tw != null:
		toast_tw.kill()
	toast.modulate.a = 0.0
	toast_tw = create_tween()
	toast_tw.tween_property(toast, "modulate:a", 1.0, 0.25)
	toast_tw.parallel().tween_property(toast, "position:y", 104.0, 0.3).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	toast_tw.tween_interval(2.6)
	toast_tw.tween_property(toast, "modulate:a", 0.0, 0.5)


## Konuşma paneli (alt orta): konuşanın adı + sözü
func _dialogue(a: Npc, line: String, dur: float) -> void:
	if autoplay or dlg == null:
		return
	var who: String = a.kimlik.get("ad", "")
	if who == "":
		who = a.kimlik.get("etiket", a.kisi)
	ui.dlg_name.text = who.to_upper()
	ui.dlg_sub.text = " · ".join(PackedStringArray([a.kimlik.get("meslek", ""), a.kimlik.get("cemaat", "")]).duplicate()) if a.kimlik.get("ad", "") != "" else ""
	ui.dlg_text.text = line
	if dlg_tw != null:
		dlg_tw.kill()
	dlg.modulate.a = 0.0
	dlg_tw = create_tween()
	dlg_tw.tween_property(dlg, "modulate:a", 1.0, 0.2)
	dlg_tw.tween_interval(maxf(1.0, dur - 0.6))
	dlg_tw.tween_property(dlg, "modulate:a", 0.0, 0.4)


func _hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(root)
	hud_root = root
	f_ui = SystemFont.new()
	f_ui.font_names = PackedStringArray(["Bahnschrift", "Segoe UI", "Arial"])
	f_title = SystemFont.new()
	f_title.font_names = PackedStringArray(["Palatino Linotype", "Georgia", "Times New Roman"])
	var th := Theme.new()
	th.default_font = f_ui
	root.theme = th
	# oynanış göstergeleri tek kapta: tam ekran harita açılınca hepsi birden gizlenir
	var play := Control.new()
	play.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	play.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(play)
	ui.play = play

	# ---------------- SOL ÜST: görev (kutu yok; soldan sönen koyu şerit + ince altın çizgi)
	var qs := _fade_strip(play, 0.62, 0.0)
	qs.position = Vector2(0, 0)
	qs.size = Vector2(470, 190)
	ui.qstrip = qs
	var line := ColorRect.new()
	line.color = Color(GOLD, 0.9)
	line.position = Vector2(22, 22)
	line.size = Vector2(2, 96)
	play.add_child(line)
	ui.qline = line
	var qv := VBoxContainer.new()
	qv.position = Vector2(36, 18)
	qv.custom_minimum_size = Vector2(380, 0)
	qv.add_theme_constant_override("separation", 4)
	play.add_child(qv)
	ui.qbox = qv
	ui.donem = _lbl(qv, "GAZİANTEP", 11, Color(GOLD, 0.85))
	ui.title = _lbl(qv, "", 24, INK)
	ui.title.add_theme_font_override("font", f_title)
	var pr := HBoxContainer.new()
	pr.add_theme_constant_override("separation", 10)
	qv.add_child(pr)
	var track := ColorRect.new()
	track.color = Color(1, 1, 1, 0.16)
	track.custom_minimum_size = Vector2(220, 3)
	track.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	pr.add_child(track)
	ui.qfill = ColorRect.new()
	ui.qfill.color = GOLD
	ui.qfill.size = Vector2(0, 3)
	track.add_child(ui.qfill)
	ui.qcount = _lbl(pr, "", 11, DIM)
	ui.list = VBoxContainer.new()
	ui.list.add_theme_constant_override("separation", 2)
	qv.add_child(ui.list)

	# ---------------- ÜST ORTA: tarih (iki yanında ince çizgi) + günün vakti
	var dv := VBoxContainer.new()
	dv.add_theme_constant_override("separation", 0)
	play.add_child(dv)
	var dh := HBoxContainer.new()
	dh.alignment = BoxContainer.ALIGNMENT_CENTER
	dh.add_theme_constant_override("separation", 12)
	dv.add_child(dh)
	for side in 2:
		if side == 1:
			ui.date = _lbl(dh, "", 19, INK)
			ui.date.add_theme_font_override("font", f_title)
		var ln := ColorRect.new()
		ln.color = Color(GOLD, 0.7)
		ln.custom_minimum_size = Vector2(34, 1)
		ln.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		dh.add_child(ln)
	dh.move_child(ui.date, 1)
	ui.daypart = _lbl(dv, "", 10, Color(DIM, 0.9))
	ui.daypart.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_place(dv, Control.PRESET_CENTER_TOP, 0, 14, Control.GROW_DIRECTION_BOTH)

	# ---------------- SOL ALT: GPS mini harita (yuvarlak köşe) + sağlık çubuğu + rol / taşınanlar
	var ms := 204.0
	var clip := Panel.new()
	var csb := StyleBoxFlat.new()
	csb.bg_color = Color(0.07, 0.075, 0.08, 1.0)
	csb.set_corner_radius_all(16)
	clip.add_theme_stylebox_override("panel", csb)
	clip.clip_children = CanvasItem.CLIP_CHILDREN_ONLY
	clip.custom_minimum_size = Vector2(ms, ms)
	clip.size = Vector2(ms, ms)
	play.add_child(clip)
	_place(clip, Control.PRESET_BOTTOM_LEFT, 22, -44, Control.GROW_DIRECTION_END, Control.GROW_DIRECTION_BEGIN)
	ui.mini_clip = clip
	var rim := Panel.new()
	var rsb := StyleBoxFlat.new()
	rsb.draw_center = false
	rsb.border_color = Color(GOLD, 0.75)
	rsb.set_border_width_all(1)
	rsb.set_corner_radius_all(16)
	rsb.shadow_color = Color(0, 0, 0, 0.45)
	rsb.shadow_size = 6
	rim.add_theme_stylebox_override("panel", rsb)
	rim.custom_minimum_size = Vector2(ms, ms)
	rim.size = Vector2(ms, ms)
	play.add_child(rim)
	_place(rim, Control.PRESET_BOTTOM_LEFT, 22, -44, Control.GROW_DIRECTION_END, Control.GROW_DIRECTION_BEGIN)
	var hp_track := ColorRect.new()
	hp_track.color = Color(0, 0, 0, 0.6)
	hp_track.custom_minimum_size = Vector2(ms - 28, 4)
	play.add_child(hp_track)
	_place(hp_track, Control.PRESET_BOTTOM_LEFT, 36, -30, Control.GROW_DIRECTION_END, Control.GROW_DIRECTION_BEGIN)
	ui.hp = ColorRect.new()
	ui.hp.color = Color(0.56, 0.7, 0.42)
	ui.hp.size = Vector2(ms - 28, 4)
	hp_track.add_child(ui.hp)
	ui.hp_w = ms - 28
	var sv := VBoxContainer.new()
	sv.add_theme_constant_override("separation", 2)
	sv.alignment = BoxContainer.ALIGNMENT_END
	play.add_child(sv)
	ui.role = _lbl(sv, "", 11, Color(GOLD, 0.95))
	ui.inv = _lbl(sv, "", 13, INK)
	_place(sv, Control.PRESET_BOTTOM_LEFT, 22 + ms + 16, -44, Control.GROW_DIRECTION_END, Control.GROW_DIRECTION_BEGIN)

	# ---------------- ALT ORTA: etkileşim ipucu (tuş kutusu + yazı) ve konuşma şeridi
	var hh := HBoxContainer.new()
	hh.add_theme_constant_override("separation", 10)
	play.add_child(hh)
	var cap := PanelContainer.new()
	var ksb := StyleBoxFlat.new()
	ksb.bg_color = Color(0.03, 0.03, 0.035, 0.78)
	ksb.border_color = Color(INK, 0.85)
	ksb.set_border_width_all(1)
	ksb.set_corner_radius_all(4)
	ksb.content_margin_left = 8
	ksb.content_margin_right = 8
	ksb.content_margin_top = 1
	ksb.content_margin_bottom = 2
	cap.add_theme_stylebox_override("panel", ksb)
	hh.add_child(cap)
	_txt(cap, "E", 13, INK)
	ui.hint = _lbl(hh, "", 15, INK)
	ui.hint_panel = hh
	_place(hh, Control.PRESET_CENTER_BOTTOM, 0, -92, Control.GROW_DIRECTION_BOTH, Control.GROW_DIRECTION_BEGIN)
	hh.visible = false
	dlg = PanelContainer.new()
	var dsb := StyleBoxFlat.new()
	dsb.bg_color = Color(0.03, 0.03, 0.035, 0.66)
	dsb.border_color = Color(GOLD, 0.8)
	dsb.border_width_top = 1
	dsb.content_margin_left = 26
	dsb.content_margin_right = 26
	dsb.content_margin_top = 10
	dsb.content_margin_bottom = 12
	dlg.add_theme_stylebox_override("panel", dsb)
	dlg.custom_minimum_size = Vector2(560, 0)
	play.add_child(dlg)
	var dv2 := VBoxContainer.new()
	dv2.add_theme_constant_override("separation", 3)
	dlg.add_child(dv2)
	var dh2 := HBoxContainer.new()
	dh2.alignment = BoxContainer.ALIGNMENT_CENTER
	dh2.add_theme_constant_override("separation", 10)
	dv2.add_child(dh2)
	ui.dlg_name = _txt(dh2, "", 12, GOLD)
	ui.dlg_sub = _txt(dh2, "", 11, DIM)
	ui.dlg_text = _txt(dv2, "", 17, INK)
	ui.dlg_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.dlg_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ui.dlg_text.custom_minimum_size = Vector2(508, 0)
	_place(dlg, Control.PRESET_CENTER_BOTTOM, 0, -126, Control.GROW_DIRECTION_BOTH, Control.GROW_DIRECTION_BEGIN)
	dlg.modulate.a = 0.0

	# ---------------- bildirim: kutusuz, iki yanında ince çizgi
	toast = PanelContainer.new()
	var tsb := StyleBoxFlat.new()
	tsb.bg_color = Color(0.03, 0.03, 0.035, 0.5)
	tsb.border_color = Color(GOLD, 0.85)
	tsb.border_width_bottom = 1
	tsb.content_margin_left = 22
	tsb.content_margin_right = 22
	tsb.content_margin_top = 6
	tsb.content_margin_bottom = 7
	toast.add_theme_stylebox_override("panel", tsb)
	play.add_child(toast)
	var tv := VBoxContainer.new()
	tv.add_theme_constant_override("separation", 0)
	toast.add_child(tv)
	ui.toast_head = _txt(tv, "", 10, GOLD)
	ui.toast_head.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.toast_text = _txt(tv, "", 16, INK)
	ui.toast_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.modulate.a = 0.0

	# ---------------- bölüm kartı (ortada), küçük göstergeler
	ui.card = _lbl(root, "", 34, INK)
	ui.card.add_theme_font_override("font", f_title)
	ui.card.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_place(ui.card, Control.PRESET_CENTER, 0, -110, Control.GROW_DIRECTION_BOTH, Control.GROW_DIRECTION_BOTH)
	ui.sub = _lbl(root, "", 15, Color(0.89, 0.82, 0.67))
	ui.sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_place(ui.sub, Control.PRESET_CENTER, 0, -62, Control.GROW_DIRECTION_BOTH, Control.GROW_DIRECTION_BOTH)
	ui.fps = _lbl(play, "", 10, Color(DIM, 0.6))
	_place(ui.fps, Control.PRESET_BOTTOM_RIGHT, -14, -8, Control.GROW_DIRECTION_BEGIN, Control.GROW_DIRECTION_BEGIN)
	for i in 8:
		var m := _lbl(play, "", 13, GOLD)
		m.visible = false
		marks.append(m)
	var cross := ColorRect.new()
	cross.color = Color(1, 0.97, 0.9, 0.7)
	cross.custom_minimum_size = Vector2(3, 3)
	play.add_child(cross)
	_place(cross, Control.PRESET_CENTER, 0, 0, Control.GROW_DIRECTION_BOTH, Control.GROW_DIRECTION_BOTH)

	# ---------------- haritalar: mini (yuvarlak çerçevenin içinde) ve tam ekran
	MapView.build_paper(self, city)
	mini_map = MapView.new()
	big_map = MapView.new()
	for mv in [mini_map, big_map]:
		mv.city = city
		mv.player = player
		mv.game = self
		mv.font = f_ui
		mv.font_title = f_title
	clip.add_child(mini_map)
	root.add_child(big_map)
	mini_map.setup()
	big_map.setup()
	mini_map.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	big_map.mini = false
	big_map.mouse_filter = Control.MOUSE_FILTER_STOP
	big_map.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	big_map.visible = false
	sinema = Sinema.new()
	sinema.player = player
	sinema.city = city
	add_child(sinema)
	sinema.setup(root)
	ui.fade = ColorRect.new()
	ui.fade.color = Color(0, 0, 0, 0)
	ui.fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	ui.fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(ui.fade)
	# hiçbir gösterge fareyi yutmasın (nişangâh noktası ekranın ortasındadır; fare kilitliyken imleç de oradadır)
	_ignore_mouse(root)
	big_map.mouse_filter = Control.MOUSE_FILTER_STOP   # tam ekran harita fareyle kullanılır
	menu = Menu.new()
	menu.game = self
	menu.world = world
	menu.player = player
	menu.f_title = f_title
	root.add_child(menu)
	menu.setup()


func _ignore_mouse(n: Node) -> void:
	if n is Control:
		n.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for ch2 in n.get_children():
		_ignore_mouse(ch2)


func _li(text: String, done: bool, sub := false) -> void:
	var l := _lbl(ui.list, ("      " if sub else "") + ("✓  " if done else "›  ") + text, 13 if done else 16, Color(DIM, 0.7) if done else INK)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(380, 0)


func _qprogress(done: int, total: int) -> void:
	ui.qcount.text = ("%d / %d" % [done, total]) if total > 0 else ""
	var w := 220.0 * (float(done) / total if total > 0 else 0.0)
	create_tween().tween_property(ui.qfill, "size", Vector2(w, 3), 0.35).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)


## Sol üstteki görev listesi: etkin görevin biten adımları + şimdiki adım
func _render() -> void:
	for c in ui.list.get_children():
		c.queue_free()
	if ch == "":
		return
	if ch == "heyet":
		var s := st_stage
		ui.title.text = "Teşkilat Kuruldu" if s >= 5 else "Gizli Toplantı"
		_qprogress(mini(s - 1, 3) + (1 if st_done.size() >= 7 else 0), 5)
		_li("Çarşıdaki esnaftan haber al.", s > 1)
		if s >= 2:
			_li("Bahçe kapısındaki gözcüye parolayı söyle.", s > 2)
		if s >= 3:
			_li("Bahçeye gir, toplantıyı dinle.", s > 3)
		if s >= 4:
			_li("Komisyonlara yardım et (%d/7)." % st_done.size(), st_done.size() >= 7)
			if st_job != null:
				var jd: Dictionary = jobs[st_job["id"]]
				var stp: Dictionary = jd["steps"][st_job["i"]]
				_li(jd["ad"] + ":", false, true)
				_li(stp["text"] + ((" (%d/%d)" % [st_job["seen"].size(), stp["n"]]) if stp["t"] == "talkN" else "") + ".", false, true)
			elif st_done.size() < 7:
				_li("Bir komisyon sorumlusuyla konuş (E).", false, true)
		return
	var S: Array = chapters[ch]
	var i: int = prog[ch]
	var start := 0
	var title := "Prolog"
	for k in mini(i + 1, S.size()):
		if S[k]["t"] == "title":
			start = k
			title = S[k]["title"]
	ui.title.text = title
	# ilerleme: bu başlığın altındaki yazılı adımlardan kaçı bitti (sonraki başlığa ya da bölüm sonuna kadar)
	var total := 0
	var done_n := 0
	for k in range(start, S.size()):
		if k > start and S[k]["t"] == "title":
			break
		if S[k].has("text"):
			total += 1
			if k < i:
				done_n += 1
	_qprogress(done_n, total)
	# bildirim: adım tamamlandı / yeni görev
	if hud_prev["ch"] == ch and hud_prev["title"] != title and hud_prev["title"] != "":
		_toast("YENİ GÖREV", title)
	elif hud_prev["ch"] == ch and i > hud_prev["i"] and hud_prev["i"] >= 0 and hud_prev["i"] < S.size() and S[hud_prev["i"]].has("text"):
		_toast("TAMAMLANDI", S[hud_prev["i"]]["text"])
	hud_prev = {"ch": ch, "i": i, "title": title}
	objective = String(S[i]["text"]) if (i < S.size() and S[i].has("text")) else ""
	var shown := 0
	for k in range(start, mini(i + 1, S.size())):
		var s: Dictionary = S[k]
		if not s.has("text"):
			continue
		# kart büyümesin: bitenlerden yalnız son ikisi görünür
		var later := 0
		for k2 in range(k + 1, i):
			if S[k2].has("text"):
				later += 1
		if k < i and later >= 1:
			continue
		shown += 1
		_li(s["text"] + ((" (%d/%d)" % [seen.size(), s["n"]]) if (s["t"] == "talkN" and k == i) else "") + ".", k < i)


## Taşınan eşyalar (sağ alt)
func _render_inv() -> void:
	var p := PackedStringArray()
	if carrying:
		p.append("Sırtında yaralı var")
	for k in inv:
		if inv[k] > 0:
			p.append("%s %d" % [ESYA.get(k, k), inv[k]])
	ui.inv.text = " · ".join(p)
