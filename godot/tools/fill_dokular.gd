extends SceneTree
## res://dokular/<ad>/ klasörlerindeki görselleri (albedo.jpg, normal.jpg, roughness.jpg, ao.jpg) ilgili doku setine (<ad>.tres) bağlar.
## Setin ölçü (tile_metres) ve renk (tint) ayarlarına dokunmaz.
##   godot --headless --path godot --script res://tools/fill_dokular.gd


func _init() -> void:
	var n := 0
	for key in DirAccess.get_directories_at("res://dokular"):
		var sp := "res://dokular/%s.tres" % key
		if not ResourceLoader.exists(sp):
			continue
		var ts: TextureSet = load(sp)
		var dir := "res://dokular/%s/" % key
		for q in [["albedo", "albedo"], ["normal", "normal"], ["roughness", "roughness"], ["ao", "ambient_occlusion"]]:
			var f: String = dir + q[0] + ".jpg"
			if ResourceLoader.exists(f):
				ts.set(q[1], load(f))
		ResourceSaver.save(ts, sp)
		n += 1
	print("DOKU_OK set=%d" % n)
	quit()
