class_name GraphicsProfile
extends Resource
## Görüntü kalitesi profili. res://grafik/dusuk.tres, orta.tres, yuksek.tres, ultra.tres dosyaları bu türdendir;
## değerleri Godot editöründe dosyaya çift tıklayarak değiştirebilirsiniz. Oyun içinde Ayarlar'dan ya da F5 ile seçilir.

@export var ad := "DÜŞÜK"

@export_group("Mesafeler (metre)")
## Yapıların çizildiği en uzak mesafe
@export_range(200.0, 3000.0, 50.0) var draw_distance := 450.0
## Kapı, pencere, cumba gibi yakın detayın yüklendiği mesafe
@export_range(60.0, 300.0, 5.0) var detail_distance := 95.0
## Güneş gölgesinin uzandığı mesafe
@export_range(30.0, 400.0, 5.0) var shadow_distance := 55.0

@export_group("Gölge ve çözünürlük")
@export_enum("2 kademe:2", "4 kademe:4") var shadow_splits := 2
## İç çözünürlük ölçeği (1 = ekran çözünürlüğü; düşürmek hızı artırır)
@export_range(0.5, 1.0, 0.05) var render_scale := 0.8
@export_enum("Kapalı", "2x", "4x", "8x") var msaa := 0
## Eğik açıdan bakılan yüzeylerin netliği
@export_enum("Kapalı", "2x", "4x", "8x", "16x") var anisotropy := 2

@export_group("Malzeme")
## Kabartma (normal) dokuları: taş derzleri ve yüzey pürüzü ışığa tepki verir
@export var normal_maps := false
## Yüzey derinliği: taş duvarlarda ton farkı, nem izi, toz; doku tekrarını kırar (duvar başına iki ek doku örneği)
@export var surface_detail := false

@export_group("Efektler (çoğu yalnız Forward+ / Vulkan yönteminde çalışır)")
@export var glow := false
## Ortam kapatması: köşe ve girintilerde yumuşak gölge
@export var ssao := false
## Seken ışık (SDFGI) ve ekran yansımaları
@export var global_illumination := false
@export var volumetric_fog := false

@export_group("Kalabalık ve parçacık")
@export_range(0, 80, 1) var npc_count := 12
@export_range(0, 2000, 20) var snow_particles := 260


func to_dict() -> Dictionary:
	return {"ad": ad, "draw": draw_distance, "detail": detail_distance, "shadow": shadow_distance, "splits": shadow_splits, "scale": render_scale,
		"msaa": msaa, "aniso": anisotropy, "normal": normal_maps, "surface": surface_detail, "glow": glow, "ssao": ssao, "gi": global_illumination, "vfog": volumetric_fog,
		"npc": npc_count, "snow": snow_particles}
