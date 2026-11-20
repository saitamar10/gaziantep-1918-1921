extends SceneTree
## Görüntü ayarı kaynaklarını (res://grafik/*.tres) ve boş doku seti yer tutucularını (res://dokular/*.tres) oluşturur.
## Var olan dosyalara DOKUNMAZ: editörde yaptığınız değişiklikler korunur. Varsayılana dönmek için dosyayı silip yeniden çalıştırın.
##   godot --headless --path godot --script res://tools/make_grafik.gd

const GP := preload("res://scripts/graphics_profile.gd")
const AT := preload("res://scripts/atmosphere.gd")
const TS := preload("res://scripts/texture_set.gd")


func _save(res: Resource, path: String) -> void:
	if FileAccess.file_exists(path):
		return
	ResourceSaver.save(res, path)
	print("yazıldı: ", path)


func _profile(id: String, ad: String, v: Dictionary) -> void:
	var p := GP.new()
	p.ad = ad
	for k in v:
		p.set(k, v[k])
	_save(p, "res://grafik/%s.tres" % id)


func _atm(id: String, v: Dictionary) -> void:
	var a := AT.new()
	for k in v:
		a.set(k, v[k])
	_save(a, "res://grafik/%s.tres" % id)


func _init() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://grafik"))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://dokular"))
	# DÜŞÜK: önceki "hafif" ayarın aynısı (hız düşmesin diye hiçbir şey açılmadı)
	_profile("dusuk", "DÜŞÜK", {"draw_distance": 450.0, "detail_distance": 95.0, "shadow_distance": 55.0, "shadow_splits": 2, "render_scale": 0.8, "msaa": 0, "anisotropy": 2, "normal_maps": false, "npc_count": 12, "snow_particles": 260})
	_profile("orta", "ORTA", {"draw_distance": 800.0, "detail_distance": 150.0, "shadow_distance": 95.0, "shadow_splits": 2, "render_scale": 1.0, "msaa": 0, "anisotropy": 3, "normal_maps": true, "glow": true, "npc_count": 20, "snow_particles": 500})
	_profile("yuksek", "YÜKSEK", {"draw_distance": 1300.0, "detail_distance": 190.0, "shadow_distance": 170.0, "shadow_splits": 4, "render_scale": 1.0, "msaa": 1, "anisotropy": 4, "normal_maps": true, "glow": true, "ssao": true, "volumetric_fog": true, "npc_count": 30, "snow_particles": 700})
	_profile("ultra", "ULTRA", {"draw_distance": 2000.0, "detail_distance": 230.0, "shadow_distance": 260.0, "shadow_splits": 4, "render_scale": 1.0, "msaa": 2, "anisotropy": 4, "normal_maps": true, "glow": true, "ssao": true, "global_illumination": true, "volumetric_fog": true, "npc_count": 40, "snow_particles": 900})
	# hava durumları
	_atm("gunduz", {"ad": "Gündüz"})
	_atm("gece", {"ad": "Gece", "sun_color": Color(0.4, 0.55, 1.0), "sun_energy": 0.3, "sun_elevation": -52.0, "sun_azimuth": 40.0, "ambient_color": Color(0.22, 0.3, 0.5), "ambient_energy": 0.95,
		"fog_color": Color(0.06, 0.08, 0.14), "fog_density": 0.0017, "sky_top": Color(0.01, 0.015, 0.04), "sky_horizon": Color(0.05, 0.07, 0.13), "ground_horizon": Color(0.04, 0.05, 0.08), "ground_bottom": Color(0.01, 0.01, 0.02),
		"cloud_color": Color(0.07, 0.09, 0.14), "cloud_cover": 0.6, "exposure": 0.85, "saturation": 0.5, "contrast": 1.06})
	_atm("kis", {"ad": "Kış", "sun_color": Color(0.9, 0.93, 1.0), "sun_energy": 0.8, "ambient_color": Color(0.62, 0.66, 0.72), "ambient_energy": 1.0, "fog_color": Color(0.8, 0.82, 0.85), "fog_density": 0.006,
		"sky_top": Color(0.6, 0.63, 0.68), "sky_horizon": Color(0.8, 0.82, 0.84), "ground_horizon": Color(0.8, 0.82, 0.84), "cloud_color": Color(0.74, 0.76, 0.8), "cloud_cover": 0.3, "saturation": 0.8, "contrast": 1.06})
	_save(load("res://scripts/surface_look.gd").new(), "res://grafik/yuzey.tres")
	# günün saatleri ve hava (kritik düzeltme: her sahnede aynı sabit ışık kullanılmaz)
	_atm("sabah", {"ad": "Sabah", "sun_color": Color(1.0, 0.9, 0.76), "sun_energy": 1.25, "sun_elevation": -17.0, "sun_azimuth": 105.0, "ambient_color": Color(0.56, 0.6, 0.68), "ambient_energy": 0.7,
		"fog_color": Color(0.8, 0.8, 0.8), "haze": 0.8, "fog_begin": 30.0, "fog_end": 1100.0, "sky_top": Color(0.3, 0.46, 0.7), "sky_horizon": Color(0.86, 0.82, 0.76), "cloud_color": Color(1.0, 0.94, 0.86), "cloud_cover": 0.6})
	_atm("ogle", {"ad": "Öğle", "sun_color": Color(1.0, 0.98, 0.93), "sun_energy": 1.55, "sun_elevation": -66.0, "sun_azimuth": -170.0, "ambient_color": Color(0.62, 0.64, 0.68), "ambient_energy": 0.78,
		"fog_color": Color(0.74, 0.79, 0.86), "haze": 0.66, "fog_begin": 60.0, "fog_end": 1800.0, "sky_top": Color(0.2, 0.4, 0.74), "sky_horizon": Color(0.74, 0.8, 0.88), "cloud_cover": 0.62})
	_atm("gunbatimi", {"ad": "Gün batımı", "sun_color": Color(1.0, 0.72, 0.46), "sun_energy": 1.1, "sun_elevation": -8.0, "sun_azimuth": -105.0, "ambient_color": Color(0.5, 0.5, 0.6), "ambient_energy": 0.62,
		"fog_color": Color(0.84, 0.7, 0.6), "haze": 0.8, "fog_begin": 30.0, "fog_end": 1100.0, "sky_top": Color(0.24, 0.3, 0.52), "sky_horizon": Color(0.96, 0.7, 0.48), "ground_horizon": Color(0.6, 0.5, 0.42),
		"cloud_color": Color(1.0, 0.78, 0.6), "cloud_cover": 0.5, "contrast": 1.1})
	_atm("bulutlu", {"ad": "Bulutlu", "sun_color": Color(0.9, 0.92, 0.95), "sun_energy": 0.7, "sun_elevation": -45.0, "sun_azimuth": -140.0, "ambient_color": Color(0.62, 0.64, 0.68), "ambient_energy": 0.95,
		"fog_color": Color(0.7, 0.72, 0.75), "haze": 0.82, "fog_begin": 25.0, "fog_end": 950.0, "sky_top": Color(0.5, 0.54, 0.6), "sky_horizon": Color(0.74, 0.76, 0.78), "ground_horizon": Color(0.62, 0.62, 0.6),
		"cloud_color": Color(0.8, 0.81, 0.84), "cloud_cover": 0.3, "saturation": 0.88})
	_atm("tozlu", {"ad": "Tozlu", "sun_color": Color(1.0, 0.86, 0.66), "sun_energy": 1.15, "sun_elevation": -40.0, "sun_azimuth": -135.0, "ambient_color": Color(0.62, 0.58, 0.52), "ambient_energy": 0.85,
		"fog_color": Color(0.78, 0.7, 0.58), "haze": 0.9, "fog_begin": 12.0, "fog_end": 520.0, "sky_top": Color(0.5, 0.52, 0.56), "sky_horizon": Color(0.8, 0.73, 0.6), "ground_horizon": Color(0.7, 0.62, 0.5),
		"cloud_color": Color(0.9, 0.84, 0.72), "cloud_cover": 0.5, "mountains": 0.4, "saturation": 0.92})
	# boş doku setleri (yer tutucu): ad -> bir tekrarın metre karşılığı (önerilen dokunun ölçüsü)
	for q in [["stone", 3.0], ["stone2", 3.0], ["basalt", 2.5], ["cobble", 2.0], ["dirt", 1.3], ["planks", 1.8], ["wood", 2.0], ["tiles", 2.5], ["flat", 3.0], ["grass", 2.0], ["field", 3.0], ["rubble", 1.5], ["fabric", 0.8], ["sack", 0.6], ["iron", 1.0]]:
		var t := TS.new()
		t.tile_metres = q[1]
		_save(t, "res://dokular/%s.tres" % q[0])
	quit()
