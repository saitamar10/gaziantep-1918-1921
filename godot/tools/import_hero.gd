extends SceneTree
## Kahraman sokak içe aktarma aracı: web oyunundan (tarayıcıda) dışa aktarılan ayrıntılı çarşı sokağını Godot kaynaklarına çevirir.
##   godot --headless --path godot --script res://tools/import_hero.gd
## Girdi: hero_src/ (hero.json, g*.f32, g*.u32, t*.png)  ·  Çıktı: res://hero (hero.res, dokular, hero.json)
## Dokular ekran kartı sıkıştırmasıyla (S3TC) kaydedilir: tümleşik kartta bellek yükü dörtte bire iner.
## AŞAMA 1: taş cepheler, bazalt ve döşeme şehrin geri kalanıyla AYNI gerçek doku setlerini kullanır (res://dokular), dünya
## ekseninde üç yönden kaplanarak (triplanar). Ahşap kapılar, kepenkler, kumaş, demir ve cam sokağa özgü dokularında kalır.
## Doku setleri değişirse bu araç yeniden çalıştırılmalıdır (malzemeler hero.res içine gömülüdür).

var head3: PackedByteArray
var head2: PackedByteArray
var headc: PackedByteArray
var tex := {}


func _typed(head: PackedByteArray, raw: PackedByteArray, stride: int) -> Variant:
	var b := head.duplicate()
	b.resize(8)
	b.encode_u32(4, raw.size() / stride)
	b.append_array(raw)
	return bytes_to_var(b)


func _tex(name, normal: bool, max_side: int) -> Texture2D:
	if name == null:
		return null
	var key := "%s|%s" % [name, normal]
	if tex.has(key):
		return tex[key]
	var img := Image.new()
	if img.load(ProjectSettings.globalize_path("res://hero_src/" + name)) != OK:
		tex[key] = null
		return null
	var s := minf(1.0, float(max_side) / maxi(img.get_width(), img.get_height()))
	# sıkıştırma 4'ün katı boyut ister
	var w := maxi(4, int(round(img.get_width() * s / 4.0)) * 4)
	var h := maxi(4, int(round(img.get_height() * s / 4.0)) * 4)
	if w != img.get_width() or h != img.get_height():
		img.resize(w, h, Image.INTERPOLATE_LANCZOS)
	img.generate_mipmaps()
	var t := PortableCompressedTexture2D.new()
	t.keep_compressed_buffer = true   # yoksa sikistirilmis veri dosyaya yazilmaz
	t.create_from_image(img, PortableCompressedTexture2D.COMPRESSION_MODE_S3TC, normal)
	var path := "res://hero/%s%s.res" % [String(name).get_basename(), "_n" if normal else ""]
	ResourceSaver.save(t, path)
	t = load(path)
	tex[key] = t
	return t


## Dokunun ortalama rengi (sRGB)
func _mean(name) -> Color:
	var img := Image.new()
	if name == null or img.load(ProjectSettings.globalize_path("res://hero_src/" + name)) != OK:
		return Color.WHITE
	img.resize(8, 8, Image.INTERPOLATE_BILINEAR)
	var c := Color(0, 0, 0)
	for y in 8:
		for x in 8:
			c += img.get_pixel(x, y)
	return c / 64.0


## Yüzeyin türü: "" = kendi dokusunda kalır
func _kind(g: Dictionary, eff: Color, is_ground: bool) -> String:
	if g["map"] == null or g["alphaTest"] > 0.0 or g["basic"] or g["transparent"]:
		return ""
	if is_ground:
		return "cobble" if (eff.r - eff.b) < 0.2 else "dirt"
	if eff.r >= eff.g and eff.g >= eff.b and eff.r > 0.45 and eff.g > 0.36 and (eff.r - eff.b) < 0.34:
		return "stone"
	if maxf(eff.r, maxf(eff.g, eff.b)) < 0.36 and absf(eff.r - eff.b) < 0.08:
		return "basalt"
	return ""


func _set_mat(key: String, g: Dictionary) -> StandardMaterial3D:
	var ts: TextureSet = load("res://dokular/%s.tres" % key)
	if ts == null or ts.albedo == null:
		return null
	var m := StandardMaterial3D.new()
	m.albedo_texture = ts.albedo
	m.albedo_color = Color(g["color"][0], g["color"][1], g["color"][2])
	if ts.normal != null:
		m.normal_enabled = true
		m.normal_texture = ts.normal
	# üç yönden kaplamada her doku üç kez örneklenir: pürüz ve ortam kapatması dokuları bilerek bağlanmaz (hız)
	m.roughness = 0.92
	m.vertex_color_use_as_albedo = g["vc"]
	m.uv1_triplanar = true
	m.uv1_world_triplanar = true
	var k := 1.0 / ts.tile_metres
	m.uv1_scale = Vector3(k, k, k)
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if int(g["side"]) == 2:
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


func _init() -> void:
	var t0 := Time.get_ticks_msec()
	head3 = var_to_bytes(PackedVector3Array()).slice(0, 4)
	head2 = var_to_bytes(PackedVector2Array()).slice(0, 4)
	headc = var_to_bytes(PackedColorArray()).slice(0, 4)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://hero"))
	var man: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://hero_src/hero.json"))
	var mesh := ArrayMesh.new()
	var tris := 0
	var ground := []
	for g in man["groups"]:
		var v := int(g["v"])
		var f := FileAccess.get_file_as_bytes("res://hero_src/%s.f32" % g["id"])
		var arr := []
		arr.resize(Mesh.ARRAY_MAX)
		arr[Mesh.ARRAY_VERTEX] = _typed(head3, f.slice(0, v * 12), 12)
		arr[Mesh.ARRAY_NORMAL] = _typed(head3, f.slice(v * 12, v * 24), 12)
		arr[Mesh.ARRAY_TEX_UV] = _typed(head2, f.slice(v * 24, v * 32), 8)
		if g["vc"]:
			arr[Mesh.ARRAY_COLOR] = _typed(headc, f.slice(v * 32, v * 48), 16)
		arr[Mesh.ARRAY_INDEX] = FileAccess.get_file_as_bytes("res://hero_src/%s.u32" % g["id"]).to_int32_array()
		tris += int(g["i"]) / 3
		# yukarı bakan ve dokulu yüzey = döşeme
		var nn: PackedVector3Array = arr[Mesh.ARRAY_NORMAL]
		var up := 0.0
		var cnt := 0
		for k in range(0, nn.size(), maxi(1, nn.size() / 200)):
			up += nn[k].y
			cnt += 1
		var is_ground: bool = g["map"] != null and up / maxi(1, cnt) > 0.92 and v > 400
		if is_ground:
			ground.append(mesh.get_surface_count())
		var eff := _mean(g["map"]) * Color(g["color"][0], g["color"][1], g["color"][2]).linear_to_srgb()
		var kind := _kind(g, eff, is_ground)
		var sm: StandardMaterial3D = _set_mat(kind, g) if kind != "" else null
		print("  yüzey %2d  köşe=%6d  renk=(%.2f %.2f %.2f)  %s%s" % [mesh.get_surface_count(), v, eff.r, eff.g, eff.b, "döşeme " if is_ground else "", kind if sm != null else "kendi dokusu"])
		if sm != null:
			var si := mesh.get_surface_count()
			var st2 := SurfaceTool.new()
			st2.create_from_arrays(arr)
			st2.generate_tangents()
			st2.commit(mesh)
			mesh.surface_set_material(si, sm)
			continue
		var m := StandardMaterial3D.new()
		m.albedo_color = Color(g["color"][0], g["color"][1], g["color"][2])
		m.albedo_texture = _tex(g["map"], false, 2048)
		var nt := _tex(g["normal"], true, 1024)
		if nt:
			m.normal_enabled = true
			m.normal_texture = nt
			m.normal_scale = g["ns"]
		var rt := _tex(g["rough"], false, 1024)
		if rt:
			m.roughness_texture = rt
			m.roughness_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_GREEN
		m.roughness = g["roughness"]
		m.metallic = g["metalness"]
		m.vertex_color_use_as_albedo = g["vc"]
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
		if int(g["side"]) == 2:
			m.cull_mode = BaseMaterial3D.CULL_DISABLED
		if g["alphaTest"] > 0.0:
			m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
			m.alpha_scissor_threshold = g["alphaTest"]
		elif g["transparent"] and g["opacity"] < 0.99:
			m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			m.albedo_color.a = g["opacity"]
		if g["basic"]:
			m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		var idx := mesh.get_surface_count()
		if nt:
			var st := SurfaceTool.new()
			st.create_from_arrays(arr)
			st.generate_tangents()
			st.commit(mesh)
		else:
			mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
		mesh.surface_set_material(idx, m)
	ResourceSaver.save(mesh, "res://hero/hero.res", ResourceSaver.FLAG_COMPRESS)
	man.erase("groups")
	man["ground"] = ground
	var out := FileAccess.open("res://hero/hero.json", FileAccess.WRITE)
	out.store_string(JSON.stringify(man))
	out.close()
	print("HERO_OK yuzey=%d ucgen=%d doku=%d carpisma=%d+%d sure=%.1fs" % [mesh.get_surface_count(), tris, tex.size(), man["polys"].size(), man["circles"].size(), (Time.get_ticks_msec() - t0) / 1000.0])
	quit()
