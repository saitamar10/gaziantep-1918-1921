class_name Npcs
extends Node3D
## Şehrin sakinleri: kahraman sokaktaki sabit kişiler (esnaf, ev kadını, yaşlı), yol ağında dolaşan mahalleli ve
## bölümlere göre açılıp kapanan hikâye kişileri. Kimlikler (ad · meslek · cemaat) KURMACADIR.
## Cemaat (Türk / Ermeni) bir kimlik bilgisidir, tutum bilgisi DEĞİLDİR: kimin ne yaptığı kişiye bağlıdır, cemaate değil
## (bkz. antep/docs/hikaye-ana-dosya.md §11). Ermeni oranı varsayımdır: çarşı çevresinde yaklaşık yedide bir.

const ERMENI_ORANI := 1.0 / 7.0
const ADLAR := {
	"turk": {"e": ["Mehmet", "Ali", "Hasan", "Hüseyin", "Mustafa", "Ahmet", "İbrahim", "Ökkeş", "Kâmil", "Sait", "Bekir", "Şakir", "Abdullah", "Memik", "Halil", "Ömer", "Yusuf", "Hamdi"],
		"k": ["Ayşe", "Fatma", "Emine", "Zeynep", "Hatice", "Elif", "Döne", "Zeliha", "Havva", "Meryem", "Şerife", "Hanife"]},
	"ermeni": {"e": ["Artin", "Garabed", "Hagop", "Krikor", "Sarkis", "Nazaret", "Bedros", "Hovsep", "Avedis", "Kevork", "Levon", "Minas"],
		"k": ["Mariam", "Araksi", "Siranuş", "Hripsime", "Azniv", "Takuhi", "Yeğsa", "Verjin"]},
}
const MESLEK := {"esnaf": "esnaf", "gezen": "çarşı ahalisi", "sucu": "su taşıyan", "evkadini": "ev kadını", "cocuk": "çocuk", "yasli": "mahalle büyüğü", "hamal": "hamal", "sabit": "mahalleli"}
const SELAM := {
	"esnaf": ["Buyur ağam, ne lazımdı?", "Hoş geldin. Mal taze, bak istersen.", "Pazarlık sünnettir, gel konuşalım.", "Bugün işler durgun, sen siftah ol."],
	"gezen": ["Selamünaleyküm.", "Hayırlı günler.", "Yabancı mısın buralarda?", "Uzun Çarşı ileride, dümdüz git."],
	"sucu": ["Çeşmeden geliyorum, yol ver hele.", "Su taşımakla gün bitiyor.", "Hayırlı günler."],
	"evkadini": ["Bulguru eliyorum, tozu kaçmasın gözüne.", "İşim başımdan aşkın evladım.", "Hayırlı günler."],
	"cocuk": ["Amca, sen kimsin?", "Bizimle oynar mısın?", "Kaleye çıktın mı hiç?", "Anam çağırır şimdi, gitmem lazım."],
	"yasli": ["Otur evladım, soluklan.", "Biz bu sokakları başka türlü bilirdik.", "Sabır evladım, her şeyin başı sabır.", "Allah selamet versin."],
	"hamal": ["Yol ver, yük ağır!", "Hana kadar taşıyacağım daha.", "Destur!"],
}
## Karşılıklı sohbetler (yazılı). Gündelik, döneme aykırı düşmeyecek genel sözler; tarihî olay iddiası içermez.
const SOHBET := [
	["Selamünaleyküm.", "Aleykümselam, hayırlı işler.", "Çarşı bugün kalabalık.", "Öyle, bereketli olsun."],
	["Hava da iyice ısındı.", "Bağlara çıkma vakti yakın.", "Üzüm bu yıl iyi olur inşallah."],
	["Çocuklar nasıl?", "Şükür, iyiler. Seninkiler?", "Onlar da iyi, ellerinden öperler."],
	["Un yine pahalanmış.", "Her şey pahalı bu günlerde.", "Allah sonumuzu hayır etsin."],
	["Çeşmenin suyu azalmış diyorlar.", "Sabah erken gidince doluyor.", "Yarın erkenden giderim öyleyse."],
	["Bakırcıdan kazanı aldın mı?", "Kalayı bitmemiş, yarına kaldı.", "İyi usta, acele ettirme."],
	["Akşama bize buyurun.", "Zahmet olmasın.", "Ne zahmeti, bekleriz."],
]
const SOHBET_ISGAL := [["Askerler yine devriyedeydi.", "Gördüm. Sessiz olalım.", "Haklısın, yürü gidelim."], ["Dükkânı erken kapatıyorum.", "Ben de. Karanlığa kalmayalım."]]
const SOHBET_KUSATMA := [
	["Yine silah sesi geliyor.", "Kale tarafından.", "Çocukları içeri al."],
	["Barikata taş lazımmış.", "Avludaki yıkık duvarı sökelim.", "Haydi, elbirliğiyle."],
	["Sokaktan geçme, görürler.", "Bahçelerin içinden giderim.", "Dikkat et."],
	["Ekmek kaldı mı sizde?", "Yarım somun. Bölüşürüz.", "Allah razı olsun."],
]
const SOHBET_NOBET := [["Bir kıpırtı var mı?", "Şimdilik yok.", "Gözünü ayırma."], ["Fişeğin kaç?", "On bir.", "Sayarak at."]]
const KUSATMA_SOZ := ["Yine silah sesi geliyor.", "Barikata taş lazımmış.", "Sokaktan geçme, görürler.", "Çocukları içeri al."]

## Karakter paftasındaki kodlara göre yer tutucu görünüşler (renk ve başlık). Paftanın kendisi: antep/docs/ref.
const LOOKS := {
	# Yaşlı esnaf: iskeletli modeli (K01_iskeletli.glb) kalite denetiminden geçmedi (oturmada palto bozuluyor) — oyundan çekildi.
	"K01": {"hat": "fes", "top": Color(0.3, 0.2, 0.15), "sash": Color(0.55, 0.18, 0.15)},                                  # yaşlı esnaf
	# Şehirli erkek: MakeHuman bedeni + paftadan giysi (tools/karakter_kur.py), animasyonlar ortak kütüphaneden.
	# Gerçek boyunda kurulur (ölçek 1); önü +Z (yaw 0). Sınav: tools/anim_sinav.gd, tools/rig_sinav.py (docs/asama-raporu.md).
	"K02": {"model": "res://modeller/karakter/K02_sehirli_erkek/K02_mpfb.glb", "model_h": 1.72, "height": 1.72, "model_yaw": 0.0,
		"hat": "fes", "top": Color(0.2, 0.17, 0.15), "sash": Color(0.72, 0.68, 0.6)},                                  # genç erkek
	"K03": {"hat": "scarf", "top": Color(0.2, 0.16, 0.12), "bot": Color(0.56, 0.59, 0.64), "dress": true, "height": 1.6, "family": "female"},
	"K04": {"top": Color(0.18, 0.23, 0.32), "bot": Color(0.6, 0.55, 0.42), "height": 1.24, "sash": Color(0.66, 0.41, 0.23), "family": "child"},
	"K05": {"hat": "scarf", "scarf": Color(0.84, 0.72, 0.68), "top": Color(0.48, 0.23, 0.2), "bot": Color(0.18, 0.16, 0.23), "dress": true, "height": 1.6, "family": "female"},
	"K06": {"hat": "sarik", "top": Color(0.8, 0.75, 0.63), "bot": Color(0.42, 0.44, 0.5)},                                 # hamal
	"K08": {"hat": "kalpak", "top": Color(0.23, 0.17, 0.13), "rifle": true},
	# Şahin Bey (Mehmet Sait): kullanıcının gönderdiği 3B model (tools/sahin_bagla.py). Gerçek kişi: yalnız hikâyede, tek kişi.
	# Boy kalpak dahil 1,86 m (ölçek 1), önü +Z. Ortak kütüphanenin zemini K02 bedenine göre: ayak 2,5 cm aşağı alınır (anim_sinav ölçümü).
	"K08S": {"model": "res://modeller/karakter/K08_sahin_bey/K08_sahin.glb", "model_h": 1.86, "height": 1.86, "model_yaw": 0.0, "model_y": -0.025,
		"hat": "kalpak", "top": Color(0.23, 0.17, 0.13), "rifle": true},                                              # Kuvâ-yi Milliye
	# Fransız askeri: gerçek model (iskeletli, 7 animasyon). Şimdilik K13 makineli tüfekçi modeli K09 piyade için de kullanılıyor.
	"K09": {"model": "res://modeller/karakter/K13_fransiz_makineli/fransiz_makineli_tufekci.glb", "model_h": 1.0, "height": 1.74, "hat": "helmet", "hat_color": Color(0.36, 0.42, 0.5), "top": Color(0.42, 0.5, 0.6), "bot": Color(0.4, 0.47, 0.56), "rifle": true, "family": "soldier"},   # Fransız piyadesi
	"K11": {"hat": "scarf", "scarf": Color(0.8, 0.78, 0.72), "top": Color(0.3, 0.33, 0.3), "dress": true, "height": 1.62, "family": "female"},
	"K12": {"hat": "scarf", "scarf": Color(0.12, 0.11, 0.13), "top": Color(0.14, 0.13, 0.16), "dress": true, "height": 1.54, "family": "female"},   # yaşlı kadın
	"K15": {"hat": "helmet", "hat_color": Color(0.45, 0.42, 0.3), "top": Color(0.52, 0.47, 0.33), "bot": Color(0.5, 0.45, 0.32), "rifle": true, "family": "soldier"},   # İngiliz (yer tutucu, varsayım)
}

var city: City
var nav: Nav
var street: Node3D
var player: CharacterBody3D
var agents: Array[Npc] = []
var walkers: Array[Npc] = []
var groups := {}
var rng := RandomNumberGenerator.new()
var usta: Npc
var siege := false
var focus: Npc = null
var tick := 0.0
# ---- NÜFUS YÖNETİCİSİ (bütün dünya için tek merkez). Oyuncunun çevresinde yaşayan bir kalabalık tutar; yoğunluk tarihe,
# döneme ve savaş durumuna göre `set_population` ile ayarlanır (profiller: game.gd NUFUS tablosu).
var pairs: Array = []        # duran ikililer: {a, b, kind (sivil | nobet), t, li, si}
var seated: Array[Npc] = []  # duvar dibinde oturanlar (yaşlı, hasta, sığınan)
var patrols: Array[Npc] = [] # işgal devriyeleri (İngiliz / Fransız)
var pop := {"walk": 1.0, "civ": 1.0, "def": 0.0, "seat": 0.3, "patrol": ""}
var animals: Array = []     # sokak kenarına bağlı atlar (res://modeller/hayvan, Quaternius, CC0; biçemi sade, yer tutucu)
var shelter := false         # çatışma sürüyor: siviller saklanır
# ---- AŞAMA 10: gündelik işler. Dolaşanlar rollerine göre davranır (hamal yük taşır, sucu çeşmeye gider, çocuk oynar,
# mahalleli esnafla pazarlık eder); bir hamalın peşinde yüklü at yürür. Sözler geneldir, tarihî olay iddiası içermez.
const PAZARLIK := [["Bunun okkası kaça usta?", "Pazarlık ederiz, gel hele."], ["Biraz in aşağı usta.", "Hatırın için olsun."], ["Malın tazesi var mı?", "Bu sabah geldi, kendi elinle bak."], ["Veresiye yazar mısın?", "Yazarım, sen yabancı değilsin."]]
var pack_horse: Node3D
var pack: Node3D
var pack_leader: Npc
var horse_ap: AnimationPlayer
var horse_anim := ""


func setup(count: int) -> void:
	rng.seed = 191817
	var m := street
	# kahraman sokağın sabit sakinleri: çarşı esnafı, ev kadınları, duvar dibinde oturan yaşlı kadın
	usta = _fixed("K01", "esnaf", spot(m.xl(-1.7) + 1.0, -1.7, 1, 0))
	for z in [-7.0, -12.4, -17.8]:
		_fixed("K02" if z != -12.4 else "K01", "esnaf", spot(m.xl(z) + 1.0, z, 1, 0))
	_fixed("K03", "evkadini", spot(m.xr(-30.0) - 0.8, -30.0, -1, 0))
	_fixed("K05", "evkadini", spot(m.xl(-62.0) + 0.8, -62.0, 1, 0))
	_fixed("K12", "yasli", spot(m.xl(-76.0) + 0.8, -76.0, 1, 0), "sit")
	# dolaşan mahalleli: oyuncunun çevresindeki sokaklarda yürür, uzakta kalan oyuncunun yakınına yeniden yerleşir
	var cast := [["K02", "gezen"], ["K03", "evkadini"], ["K06", "hamal"], ["K01", "gezen"], ["K05", "sucu"], ["K04", "cocuk"], ["K02", "gezen"], ["K11", "evkadini"], ["K02", "hamal"], ["K04", "cocuk"]]
	for i in count:
		var c: Array = cast[i % cast.size()]
		var a := _make(c[0], "", c[1], {})
		a.speed = rng.randf_range(0.95, 1.35) * (1.35 if a.family == "child" else 1.0)
		a.set_meta("base_speed", a.speed)
		if a.role == "sucu":
			a.set_carry("jug")
		if a.role == "hamal" and pack_leader == null:
			pack_leader = a
		walkers.append(a)
		_respawn(a, 15.0, 110.0)
	# duran ikililer: sohbet eden mahalleliler ve (kuşatmada) silahlı nöbetçiler
	var pc := [["K02", "K01"], ["K03", "K05"], ["K01", "K06"], ["K11", "K03"], ["K02", "K02"], ["K05", "K12"], ["K06", "K02"], ["K01", "K01"]]
	for i in maxi(3, count / 3):
		var q: Array = pc[i % pc.size()]
		pairs.append({"a": _make(q[0], "", "sabit", {}), "b": _make(q[1], "", "sabit", {}), "kind": "sivil", "t": rng.randf_range(2.0, 9.0), "li": 0, "si": 0})
	for i in 3:
		var kn := {"ad": "Nöbetçi", "cemaat": "Türk", "meslek": "", "etiket": "Nöbetçi"}
		pairs.append({"a": _make("K08", "nobetci", "sabit", {"kimlik": kn}), "b": _make("K02", "nobetci", "sabit", {"rifle": true, "kimlik": kn}), "kind": "nobet", "t": 4.0, "li": 0, "si": 0})
	for q in ["K01", "K12", "K06", "K11", "K01"]:
		seated.append(_make(q, "", "yasli", {"pose": "sit"}))
	# işgal devriyeleri
	for q in ["K15", "K15", "K09", "K09", "K09"]:
		var s := _make(q, "", "devriye", {})
		s.speed = 1.05
		patrols.append(s)
	for i in 3:
		var h := make_animal("Horse", 2.3)
		if h != null:
			animals.append(h)
	# yük atı: ilk hamalın ardından yürür (sırtında iki çuval ve örtü)
	pack_horse = make_animal("Horse", 2.3)
	if pack_horse != null:
		horse_ap = pack_horse.find_child("AnimationPlayer", true, false) as AnimationPlayer
		pack = Node3D.new()
		add_child(pack)
		for q in [[Vector3(0.36, -0.2, 0.0), Vector3(0.3, 0.46, 0.62), Color(0.6, 0.5, 0.34)], [Vector3(-0.36, -0.2, 0.0), Vector3(0.3, 0.46, 0.62), Color(0.56, 0.47, 0.32)], [Vector3(0, 0.06, 0.0), Vector3(0.62, 0.08, 0.72), Color(0.5, 0.2, 0.17)]]:
			var mi := MeshInstance3D.new()
			var bm := BoxMesh.new()
			bm.size = q[1]
			mi.mesh = bm
			mi.position = q[0]
			mi.material_override = Npc.mat(q[2])
			mi.visibility_range_end = 110.0
			pack.add_child(mi)
	_apply_pop()


func _merge_aabb(n: Node, root: Node3D, acc: Array) -> void:
	if n is MeshInstance3D and n.mesh != null:
		var bb: AABB = (root.global_transform.affine_inverse() * n.global_transform) * n.mesh.get_aabb()
		acc[0] = bb if acc[0] == null else acc[0].merge(bb)
	for c in n.get_children():
		_merge_aabb(c, root, acc)


## Hayvan modeli: en uzun boyutu `length` metre olacak şekilde ölçeklenir, ayakları yere oturtulur, bekleme animasyonu döner.
func make_animal(kind: String, length: float) -> Node3D:
	var path := "res://modeller/hayvan/%s.fbx" % kind
	if not ResourceLoader.exists(path):
		return null
	var n: Node3D = load(path).instantiate()
	add_child(n)
	var acc := [null]
	_merge_aabb(n, n, acc)
	if acc[0] == null:
		n.queue_free()
		return null
	var bb: AABB = acc[0]
	var k := length / maxf(0.0001, maxf(bb.size.x, maxf(bb.size.y, bb.size.z)))
	n.scale *= k
	n.set_meta("lift", -bb.position.y * k)
	var ap := n.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if ap != null and ap.has_animation("Armature|Idle"):
		ap.get_animation("Armature|Idle").loop_mode = Animation.LOOP_LINEAR
		ap.play("Armature|Idle")
		ap.seek(rng.randf() * 2.0)
	return n


func put_animal(n: Node3D, p: Vector2, yaw: float) -> void:
	if OS.get_cmdline_user_args().has("--hayvanlog"):
		print("HAYVAN %s yer=%.1f,%.1f olcek=%.2f" % [n.name, p.x, p.y, n.scale.x])
	n.global_position = Vector3(p.x, city.ground(p.x, p.y) + float(n.get_meta("lift", 0.0)), p.y)
	n.rotation.y = yaw


func _place_animal(n: Node3D) -> void:
	if player == null:
		return
	var pp := Vector2(player.global_position.x, player.global_position.z)
	var nd := nav.random_near(pp, 18.0, 85.0, rng)
	if nd < 0 or nav.adj[nd].size() == 0:
		n.visible = false
		return
	var p := nav.pos[nd]
	var dir := (nav.pos[nav.adj[nd][0]] - p).normalized()
	var q := city.resolve(p + Vector2(-dir.y, dir.x) * (1.3 if rng.randf() < 0.5 else -1.3), 0.7)
	put_animal(n, q, atan2(dir.x, dir.y))


## Kahraman sokağın yerel eksenindeki nokta -> dünya (x, z)
func hp(x: float, z: float) -> Vector2:
	var g := street.to_global(Vector3(x, 0, z))
	return Vector2(g.x, g.z)


## Sokak yerelinde bir yer + (nx, nz) yönüne bakış -> {x, z, yaw}
func spot(x: float, z: float, nx: float, nz: float) -> Dictionary:
	var p := hp(x, z)
	var d := street.global_transform.basis * Vector3(nx, 0, nz)
	return {"x": p.x, "z": p.y, "yaw": atan2(d.x, d.z)}


func _kimlik(a: Npc) -> void:
	if a.family == "soldier":
		var k := "İngiliz" if a.def == "K15" else "Fransız"
		a.kimlik = {"ad": "", "cemaat": k, "meslek": "asker", "etiket": k + " askeri"}
		return
	var kadin := a.family == "female"
	var cocuk := a.family == "child"
	var cem := "turk" if (a.story or a == usta or usta == null) else ("ermeni" if rng.randf() < ERMENI_ORANI else "turk")
	var havuz: Array = ADLAR[cem]["k" if kadin else "e"]
	var ad: String = havuz[rng.randi() % havuz.size()]
	if not cocuk:
		if kadin:
			ad += " Nine" if a.def == "K12" else " Hanım"
		elif a.role == "esnaf":
			ad += " Usta"
		elif a.role != "hamal":
			ad += " Efendi"
	var meslek: String = MESLEK.get(a.role, "mahalleli")
	a.kimlik = {"ad": ad, "cemaat": "Türk" if cem == "turk" else "Ermeni", "meslek": meslek}
	a.kimlik["etiket"] = "%s · %s · %s" % [ad, meslek, a.kimlik["cemaat"]]


func _make(def: String, tag: String, role: String, opt: Dictionary) -> Npc:
	var o: Dictionary = LOOKS.get(def, LOOKS["K02"]).duplicate()
	o["tag"] = tag
	if opt.has("pose"):
		o["pose"] = opt["pose"]
	if opt.has("rifle"):
		o["rifle"] = opt["rifle"]
	var a := Npc.new().setup(o)
	a.id = agents.size()
	a.def = def
	a.role = role
	a.city = city
	a.grp = opt.get("grp", "")
	a.story = opt.get("story", false)
	add_child(a)
	if opt.has("kimlik"):
		a.kimlik = opt["kimlik"]
	else:
		_kimlik(a)
	a.kisi = a.kimlik.get("etiket", "")
	agents.append(a)
	return a


func _fixed(def: String, role: String, sp: Dictionary, pose := "idle") -> Npc:
	var a := _make(def, "", role, {"pose": pose})
	a.put(sp["x"], sp["z"], sp["yaw"])
	return a


## Hikâye kişisi. opt: grp (grup; kapalıyken sahnede yoktur), pose, role, kimlik, rifle
func add_story(def: String, tag: String, sp: Dictionary, opt: Dictionary = {}) -> Npc:
	var o := opt.duplicate()
	o["story"] = true
	var a := _make(def, tag, opt.get("role", "sabit"), o)
	a.put(sp["x"], sp["z"], sp.get("yaw", 0.0))
	if a.grp != "":
		set_hidden(a, not groups.get(a.grp, false))
	return a


func set_hidden(a: Npc, h: bool) -> void:
	a.hidden = h
	a.visible = not h


func set_group(g: String, on: bool) -> void:
	groups[g] = on
	for a in agents:
		if a.grp == g:
			set_hidden(a, not on)
			a.hide_t = 0.0


## Sokaktan çekilir (mahzene iner); süre sonunda geri döner
func send_away(a: Npc, dur := 160.0) -> void:
	set_hidden(a, true)
	a.hide_t = dur


func say(a: Npc, text: String, dur := 4.0) -> void:
	if a and not a.hidden:
		a.say(text, dur)


## Role göre gündelik söz (görevle ilgisi olmayan konuşma)
func greeting(a: Npc) -> String:
	if a.role == "devriye":
		return ["Move along.  — «Yürü, durma.»", "Nothing to see here.  — «Bakacak bir şey yok.»"][rng.randi() % 2] if a.def == "K15" else ["Circulez.  — «Dağılın.»", "Halte !  — «Dur!»", "Rien à signaler.  — «Bildirecek bir şey yok.»"][rng.randi() % 3]
	if a.tag == "nobetci":
		return ["Sokağın başında dur, ileri geçme.", "Gözümüz yolda.", "Parolayı biliyor musun?"][rng.randi() % 3]
	if siege and a.family != "child" and rng.randf() < 0.5:
		return KUSATMA_SOZ[rng.randi() % KUSATMA_SOZ.size()]
	var l: Array = SELAM.get(a.role, SELAM["gezen"])
	return l[rng.randi() % l.size()]


## Nüfus profili: walk/civ/def/seat = 0..1 oran, patrol = "" | "ingiliz" | "fransiz"
func set_population(p: Dictionary) -> void:
	pop = p
	_apply_pop()


func _want(a: Npc, on: bool) -> void:
	if a.hidden == on:
		set_hidden(a, not on)
		if on:
			a.route.clear()
			a.wait = 0.0


func _apply_pop() -> void:
	var civ_on := not shelter
	for i in walkers.size():
		_want(walkers[i], civ_on and i < int(ceil(walkers.size() * pop.get("walk", 1.0))))
	var ci := 0
	var di := 0
	var civ_n := 0
	for d in pairs:
		if d["kind"] == "sivil":
			civ_n += 1
	for d in pairs:
		var on := false
		if d["kind"] == "sivil":
			on = civ_on and ci < int(ceil(civ_n * pop.get("civ", 1.0)))
			ci += 1
		else:
			on = di < int(ceil(3 * pop.get("def", 0.0)))
			di += 1
		var was: bool = not d["a"].hidden
		_want(d["a"], on)
		_want(d["b"], on)
		if on and not was:
			_place_pair(d)
	for i in seated.size():
		var on2: bool = civ_on and i < int(ceil(seated.size() * pop.get("seat", 0.0)))
		var was2 := not seated[i].hidden
		_want(seated[i], on2)
		if on2 and not was2:
			_seat(i)
	for i in animals.size():
		var on4: bool = not shelter and pop.get("hayvan", true) and i < int(round(animals.size() * pop.get("walk", 1.0)))
		if on4 and not animals[i].visible:
			animals[i].visible = true
			_place_animal(animals[i])
		elif not on4:
			animals[i].visible = false
	for s in patrols:
		var on3: bool = (s.def == "K15" and pop.get("patrol", "") == "ingiliz") or (s.def == "K09" and pop.get("patrol", "") == "fransiz")
		var was3 := not s.hidden
		_want(s, on3)
		if on3 and not was3:
			_respawn(s, 25.0, 100.0)


## Oyuncunun çevresinde bir sokak kenarı bulur ve kişiyi (ve varsa eşini) oraya koyar. Yer yoksa false.
func _place_side(a: Npc, b) -> bool:
	if player == null:
		return false
	var pp := Vector2(player.global_position.x, player.global_position.z)
	var nd := nav.random_near(pp, 14.0, 85.0, rng)
	if nd < 0 or nav.adj[nd].size() == 0:
		return false
	var p := nav.pos[nd]
	var dir := (nav.pos[nav.adj[nd][0]] - p).normalized()
	var side := Vector2(-dir.y, dir.x) * (1.9 if rng.randf() < 0.5 else -1.9)
	var q := city.resolve(p + side, 0.5)
	if q.distance_to(p) > 3.2 or city.blocked(q.x, q.y, 0.3):
		q = city.resolve(p + side * 0.35, 0.4)   # çarpışma uzağa ittiyse sokağın ortasına yakın dur
	if b == null:
		a.put(q.x, q.y, atan2(-side.x, -side.y))
		return true
	var q2 := city.resolve(q + dir * 0.95, 0.4)
	a.put(q.x, q.y, atan2(q2.x - q.x, q2.y - q.y))
	b.put(q2.x, q2.y, atan2(q.x - q2.x, q.y - q2.y))
	return true


func _place_pair(d: Dictionary) -> void:
	_place_side(d["a"], d["b"])
	d["li"] = 0
	d["t"] = rng.randf_range(2.0, 8.0)


func _respawn(a: Npc, r0: float, r1: float) -> void:
	var c := Vector2(player.global_position.x, player.global_position.z) if player else hp(0, -50)
	var n := nav.random_near(c, r0, r1, rng)
	if n < 0:
		return
	a.put(nav.pos[n].x, nav.pos[n].y, rng.randf() * TAU)
	a.wait = rng.randf_range(0.0, 3.0)


## Rotayı yol ağı üzerinden verilen hedefe kurar; son adım hedefin kendisidir. Yol yoksa false.
func _route_to(a: Npc, target: Vector2) -> bool:
	var from := nav.nearest(a.xz(), 40.0)
	var to := nav.nearest(target, 40.0)
	if from < 0 or to < 0:
		return false
	var p := nav.path(from, to, 1500)
	if p.is_empty():
		return false
	for i in p:
		a.route.append(Vector3(nav.pos[i].x, 0, nav.pos[i].y))
	var end := city.resolve(target, 0.4)
	if end.distance_to(nav.pos[to]) < 30.0 and not city.los_blocked(nav.pos[to], end):
		a.route.append(Vector3(end.x, 0, end.y))
	a.wait = rng.randf_range(0.5, 3.0)
	return true


func _near_player(a: Npc, r: float) -> bool:
	return player != null and a.xz().distance_to(Vector2(player.global_position.x, player.global_position.z)) < r


## Hamal: bir gidişte yüklü (sırtında çuval, ağır adım), dönüşte boş. Varınca yükü indirmek / yüklenmek için bekler.
func _job_hamal(a: Npc) -> void:
	var loaded: bool = not a.get_meta("yuk", false)
	a.set_meta("yuk", loaded)
	a.set_carry("sack" if loaded else "")
	_wander_default(a)
	a.speed = float(a.get_meta("base_speed", 1.1)) * (0.8 if loaded else 1.05)
	a.wait = rng.randf_range(4.0, 8.0)


## Sucu: en yakın meydan çeşmesine gider, testiyi doldurmak için bekler, sonra mahalleye döner.
func _job_sucu(a: Npc) -> bool:
	if a.get_meta("dolu", false):
		a.set_meta("dolu", false)
		return false
	var best := Vector2.ZERO
	var bd := 220.0
	for q in city.data.get("squares", []):
		var d := a.xz().distance_to(Vector2(q[0], q[1]))
		if d < bd and d > 6.0:
			bd = d
			best = Vector2(q[0], q[1])
	if bd >= 220.0:
		return false
	var stand := best + (a.xz() - best).normalized() * 2.4
	if not _route_to(a, stand):
		return false
	a.arrive_cb = func() -> void:
		a.face(best)
		a.wait = 7.0
		a.set_meta("dolu", true)
		if _near_player(a, 12.0):
			a.say("Çeşme bugün iyi akıyor.", 3.0)
	return true


## Çocuk oyunu: bulunduğu yerin çevresinde koşturur (kovalamaca), sonra soluklanır.
func _job_oyun(a: Npc) -> bool:
	var c := a.xz()
	var pts: Array[Vector2] = []
	for i in 9:
		var q := c + Vector2.from_angle(rng.randf() * TAU) * rng.randf_range(2.5, 7.0)
		var prev: Vector2 = pts[pts.size() - 1] if pts.size() > 0 else c
		if city.blocked(q.x, q.y, 0.5) or city.los_blocked(prev, q):
			continue
		pts.append(q)
	if pts.size() < 3:
		return false
	for q in pts:
		a.route.append(Vector3(q.x, 0, q.y))
	var base: float = a.get_meta("base_speed", 1.4)
	a.speed = base * 1.9
	a.wait = 0.2
	a.arrive_cb = func() -> void:
		a.speed = base
		a.wait = rng.randf_range(2.0, 6.0)
	return true


## Pazarlık: yakındaki bir esnafın tezgâhına gider, önünde durur; oyuncu yakındaysa iki söz edilir.
func _job_pazar(a: Npc) -> bool:
	var e: Npc = null
	var bd := 140.0
	for x in agents:
		if x.role == "esnaf" and not x.hidden and not x.story and x.get_meta("musteri", 0) < Time.get_ticks_msec():
			var d := a.xz().distance_to(x.xz())
			if d < bd and d > 4.0:
				bd = d
				e = x
	if e == null:
		return false
	var fwd := Vector2(sin(e.global_rotation.y), cos(e.global_rotation.y))
	if not _route_to(a, e.xz() + fwd * 1.4):
		return false
	e.set_meta("musteri", Time.get_ticks_msec() + 60000)
	a.arrive_cb = func() -> void:
		if not is_instance_valid(e) or e.hidden or a.xz().distance_to(e.xz()) > 4.0:
			return
		a.face(e.xz())
		a.wait = 8.0
		if _near_player(a, 16.0):
			var ln: Array = PAZARLIK[rng.randi() % PAZARLIK.size()]
			a.say(ln[0], 2.8)
			get_tree().create_timer(3.0).timeout.connect(func() -> void:
				if is_instance_valid(e) and not e.hidden:
					e.say(ln[1], 2.8))
	return true


## Dolaşan kişinin sıradaki işi (role göre). Hiçbiri uymazsa rastgele bir yere yürür.
func _wander(a: Npc) -> void:
	if a.has_meta("base_speed"):
		a.speed = a.get_meta("base_speed")
	var done := false
	match a.role:
		"hamal":
			_job_hamal(a)
			done = true
		"sucu":
			done = _job_sucu(a)
		"cocuk":
			done = rng.randf() < 0.55 and _job_oyun(a)
		"gezen", "evkadini":
			done = rng.randf() < 0.4 and _job_pazar(a)
	if not done:
		_wander_default(a)


## Oturanlar ikişer ikişer yan yana oturur (kahve önü, duvar dibi sohbeti)
func _place_beside(a: Npc, prev: Npc) -> void:
	var yaw := prev.global_rotation.y
	var right := Vector2(cos(yaw), -sin(yaw))
	var q := prev.xz() + right * 0.95
	if city.blocked(q.x, q.y, 0.3):
		q = prev.xz() - right * 0.95
	if city.blocked(q.x, q.y, 0.3):
		_place_side(a, null)
		return
	a.put(q.x, q.y, yaw + rng.randf_range(-0.35, 0.35))


func _seat(i: int) -> void:
	if i % 2 == 1 and not seated[i - 1].hidden:
		_place_beside(seated[i], seated[i - 1])
	else:
		_place_side(seated[i], null)


## Yük atı hamalın 2,3 m ardından yürür; hamal durunca durur.
func _horse(dt: float) -> void:
	if pack_horse == null:
		return
	var on: bool = pack_leader != null and not pack_leader.hidden and not shelter and pop.get("hayvan", true)
	pack_horse.visible = on
	pack.visible = on
	if not on:
		return
	var lp := pack_leader.xz()
	var hpos := Vector2(pack_horse.global_position.x, pack_horse.global_position.z)
	var to := lp - hpos
	var d := to.length()
	var mv := false
	if d > 40.0:
		var back := Vector2(sin(pack_leader.global_rotation.y), cos(pack_leader.global_rotation.y)) * -2.3
		hpos = city.resolve(lp + back, 0.6)
		pack_horse.rotation.y = pack_leader.global_rotation.y
	elif d > 2.3:
		hpos += to / d * minf(d - 2.3, pack_leader.speed * 1.2 * dt)
		pack_horse.rotation.y = lerp_angle(pack_horse.rotation.y, atan2(to.x, to.y), minf(1.0, dt * 4.0))
		mv = true
	var gy := city.ground(hpos.x, hpos.y)
	pack_horse.global_position = Vector3(hpos.x, gy + float(pack_horse.get_meta("lift", 0.0)), hpos.y)
	pack.global_position = Vector3(hpos.x, gy + 1.22, hpos.y)
	pack.rotation.y = pack_horse.rotation.y
	var want := "Armature|Walk" if mv else "Armature|Idle"
	if horse_ap != null and want != horse_anim and horse_ap.has_animation(want):
		horse_anim = want
		horse_ap.get_animation(want).loop_mode = Animation.LOOP_LINEAR
		horse_ap.play(want, 0.3)


func _wander_default(a: Npc) -> void:
	var from := nav.nearest(a.xz(), 40.0)
	var to := nav.random_near(a.xz(), 25.0, 120.0, rng)
	if from < 0 or to < 0:
		a.wait = 4.0
		return
	var side := rng.randf_range(-0.7, 0.7)
	var p := nav.path(from, to, 1200)
	for i in p.size():
		var q := nav.pos[p[i]]
		var dir := (nav.pos[p[mini(i + 1, p.size() - 1)]] - nav.pos[p[maxi(i - 1, 0)]]).normalized()
		q += Vector2(-dir.y, dir.x) * side   # şeridin sağı/solu: karşıdan gelenle üst üste binmesin
		a.route.append(Vector3(q.x, 0, q.y))
	a.wait = rng.randf_range(0.5, 5.0)


func _process(dt: float) -> void:
	if player == null:
		return
	var pp := Vector2(player.global_position.x, player.global_position.z)
	_horse(dt)
	# gizlenmiş kişilerin dönüşü
	for a in agents:
		if a.hidden and a.hide_t < 0.0 and (a.grp == "" or groups.get(a.grp, false)):
			a.hide_t = 0.0
			set_hidden(a, false)
	tick -= dt
	if tick <= 0.0:
		tick = 0.3
		var budget := 2   # kare başına en çok iki rota hesabı
		for a in walkers + patrols:
			if a.hidden:
				continue
			if a.xz().distance_to(pp) > 135.0:
				_respawn(a, 35.0, 100.0)
			elif a.route.is_empty() and budget > 0:
				_wander(a)
				budget -= 1
		# duran ikililer: uzakta kalan oyuncunun yakınına yeniden yerleşir; yakındakiler sırayla konuşur
		for d in pairs:
			var a2: Npc = d["a"]
			if a2.hidden:
				continue
			var dist := a2.xz().distance_to(pp)
			if dist > 115.0:
				_place_pair(d)
				continue
			if dist > 14.0:
				continue
			d["t"] -= 0.3
			if d["t"] <= 0.0:
				var set: Array = SOHBET_NOBET if d["kind"] == "nobet" else (SOHBET_KUSATMA if siege else (SOHBET_ISGAL if (pop.get("patrol", "") != "" and rng.randf() < 0.3) else SOHBET))
				if d["li"] == 0:
					d["si"] = rng.randi() % set.size()
				var lines: Array = set[d["si"] % set.size()]
				if d["li"] < lines.size():
					var sp: Npc = a2 if d["li"] % 2 == 0 else d["b"]
					if sp.say_t <= 0.0:
						sp.say(lines[d["li"]], 2.8)
					d["li"] += 1
					d["t"] = 3.2
				else:
					d["li"] = 0
					d["t"] = rng.randf_range(9.0, 22.0)
		for i in seated.size():
			if not seated[i].hidden and seated[i].xz().distance_to(pp) > 115.0:
				_seat(i)
		for a in agents:
			if a.model != null and not a.hidden:
				a.set_far(a.xz().distance_to(pp) > 60.0)
		for an in animals:
			if an.visible and Vector2(an.global_position.x, an.global_position.z).distance_to(pp) > 120.0:
				_place_animal(an)
	# konuşulabilecek kişi: 2,6 m içinde ve bakış yönünde
	focus = null
	var best := 2.6
	var fwd: Vector3 = -player.global_transform.basis.z
	for a in agents:
		if a.hidden or a.external:
			continue
		var d := a.global_position - player.global_position
		d.y = 0
		var l := d.length()
		if l < best and d.normalized().dot(fwd) > 0.5:
			best = l
			focus = a
