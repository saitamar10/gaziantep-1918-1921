extends SceneTree
## Şehir içe aktarma aracı: tools/bake_city.mjs çıktısını (city_src/city.bin + city.json) Godot kaynaklarına çevirir.
##   godot --headless --path godot --script res://tools/import_city.gd
## Çıktı (res://city): her 100 m hücre için taban / detay / anıt ağları (.res, sıkıştırılmış), arazi karoları,
## yükseklik ızgarası (terrain.bin) ve oyunun okuyacağı yerleşim verisi (city.json).

const TANGENT_MATS := ["stone", "stone2", "rubble", "basalt", "planks", "wood", "tiles", "flat"]
const TILE := 48
const FLATTEN := false   # eski kutu sokak düz kurulmuştu; ayrıntılı sokak araziyi izler

var f: FileAccess
var head3: PackedByteArray
var head2: PackedByteArray
var headc: PackedByteArray


func _init() -> void:
	var t0 := Time.get_ticks_msec()
	head3 = var_to_bytes(PackedVector3Array()).slice(0, 4)
	head2 = var_to_bytes(PackedVector2Array()).slice(0, 4)
	headc = var_to_bytes(PackedColorArray()).slice(0, 4)
	var js: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://city_src/city.json"))
	f = FileAccess.open("res://city_src/city.bin", FileAccess.READ)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://city"))
	# --- ağlar: (grup, hücre) başına tek kaynak, malzeme başına bir yüzey
	var groups := {}
	for m in js["meshes"]:
		var key: String = "%s|%s" % [m["g"], m["c"]]
		if not groups.has(key):
			groups[key] = []
		groups[key].append(m)
	var cells := {}
	var n := 0
	for key in groups:
		var parts: PackedStringArray = key.split("|")
		var mesh := ArrayMesh.new()
		for m in groups[key]:
			_surface(mesh, m)
		var name := "%s_%s" % [parts[0], parts[1].replace(",", "_").replace("-", "m")]
		ResourceSaver.save(mesh, "res://city/%s.res" % name, ResourceSaver.FLAG_COMPRESS)
		if not cells.has(parts[1]):
			cells[parts[1]] = []
		cells[parts[1]].append(parts[0])
		n += 1
		if n % 100 == 0:
			print("ağ ", n, "/", groups.size())
	# --- arazi
	var hero: Dictionary = js["hero"]
	var h0 := _terrain(js["terrain"], hero)
	hero["y"] = h0
	js.erase("meshes")
	js["cells"] = cells
	var out := FileAccess.open("res://city/city.json", FileAccess.WRITE)
	out.store_string(JSON.stringify(js))
	out.close()
	print("IMPORT_OK kaynak=%d sure=%.1fs kahraman_sokak_kotu=%.2f" % [n, (Time.get_ticks_msec() - t0) / 1000.0, h0])
	quit()


func _raw(off: float, bytes: int) -> PackedByteArray:
	f.seek(int(off))
	return f.get_buffer(bytes)


func _typed(head: PackedByteArray, raw: PackedByteArray, stride: int) -> Variant:
	var b := head.duplicate()
	b.resize(8)
	b.encode_u32(4, raw.size() / stride)
	b.append_array(raw)
	return bytes_to_var(b)


func _surface(mesh: ArrayMesh, m: Dictionary) -> void:
	var v := int(m["v"])
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = _typed(head3, _raw(m["p"], v * 12), 12)
	arr[Mesh.ARRAY_NORMAL] = _typed(head3, _raw(m["n"], v * 12), 12)
	arr[Mesh.ARRAY_TEX_UV] = _typed(head2, _raw(m["u"], v * 8), 8)
	if m["k"] >= 0:
		arr[Mesh.ARRAY_COLOR] = _typed(headc, _raw(m["k"], v * 16), 16)
	arr[Mesh.ARRAY_INDEX] = _raw(m["x"], int(m["i"]) * 4).to_int32_array()
	var idx := mesh.get_surface_count()
	if m["m"] in TANGENT_MATS:
		var st := SurfaceTool.new()
		st.create_from_arrays(arr)
		st.generate_tangents()
		st.commit(mesh)
	else:
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	mesh.surface_set_name(idx, m["m"])


## Arazi: yükseklik ızgarasını okur, kahraman sokağın altını düzler, karolara böler. Sokağın kotunu döndürür.
func _terrain(t: Dictionary, hero: Dictionary) -> float:
	var nx := int(t["nx"])
	var nz := int(t["nz"])
	var st: float = t["step"]
	var x0: float = t["minX"]
	var z0: float = t["minZ"]
	var h := _raw(t["h"], nx * nz * 4).to_float32_array()
	var s := _raw(t["s"], nx * nz * 4)
	# kahraman sokak düz kurulmuştur: altındaki araziyi sokağın başlangıç kotuna çek, kenarlarda 14 m'de eski araziye kavuş
	var ox: float = hero["origin"][0]
	var oz: float = hero["origin"][1]
	var th: float = hero["theta"]
	var ci := clampi(int(round((ox - x0) / st)), 0, nx - 1)
	var cj := clampi(int(round((oz - z0) / st)), 0, nz - 1)
	var h0 := h[cj * nx + ci]
	var cs := cos(th)
	var sn := sin(th)
	for j in nz:
		for i in nx:
			var dx := x0 + i * st - ox
			var dz := z0 + j * st - oz
			if absf(dx) > 200.0 or absf(dz) > 200.0:
				continue
			# dünya -> sokak yerel (Y ekseni etrafında -theta)
			var lx := dx * cs - dz * sn
			var lz := dx * sn + dz * cs
			var ex := maxf(0.0, absf(lx) - 26.0)
			var ez := maxf(0.0, maxf(lz - 18.0, -120.0 - lz))
			var d := sqrt(ex * ex + ez * ez)
			if FLATTEN and d < 14.0:
				var k := smoothstep(14.0, 0.0, d)
				h[j * nx + i] = lerpf(h[j * nx + i], h0, k)
				if d <= 0.0:
					# sokak çevresi: toprak zemin
					s[(j * nx + i) * 4] = 0
					s[(j * nx + i) * 4 + 1] = 255
					s[(j * nx + i) * 4 + 2] = 0
					s[(j * nx + i) * 4 + 3] = 0
	var tf := FileAccess.open("res://city/terrain.bin", FileAccess.WRITE)
	tf.store_buffer(h.to_byte_array())
	tf.close()
	var tiles := 0
	var tj := 0
	while tj < nz - 1:
		var ti := 0
		while ti < nx - 1:
			var i1 := mini(nx - 1, ti + TILE)
			var j1 := mini(nz - 1, tj + TILE)
			var w := i1 - ti + 1
			var d2 := j1 - tj + 1
			var pos := PackedVector3Array()
			var nor := PackedVector3Array()
			var uv := PackedVector2Array()
			var col := PackedColorArray()
			var ind := PackedInt32Array()
			pos.resize(w * d2)
			nor.resize(w * d2)
			uv.resize(w * d2)
			col.resize(w * d2)
			for j in range(tj, j1 + 1):
				for i in range(ti, i1 + 1):
					var k := (j - tj) * w + (i - ti)
					var g := j * nx + i
					var x := x0 + i * st
					var z := z0 + j * st
					pos[k] = Vector3(x, h[g], z)
					var hl := h[j * nx + maxi(i - 1, 0)]
					var hr := h[j * nx + mini(i + 1, nx - 1)]
					var hu := h[maxi(j - 1, 0) * nx + i]
					var hd := h[mini(j + 1, nz - 1) * nx + i]
					nor[k] = Vector3(hl - hr, 2.0 * st, hu - hd).normalized()
					uv[k] = Vector2(x, z)
					col[k] = Color(s[g * 4] / 255.0, s[g * 4 + 1] / 255.0, s[g * 4 + 2] / 255.0, s[g * 4 + 3] / 255.0)
			for j in d2 - 1:
				for i in w - 1:
					var a := j * w + i
					var b := a + 1
					var c := a + w
					var e := c + 1
					ind.append_array([a, b, c, b, e, c])
			var arr := []
			arr.resize(Mesh.ARRAY_MAX)
			arr[Mesh.ARRAY_VERTEX] = pos
			arr[Mesh.ARRAY_NORMAL] = nor
			arr[Mesh.ARRAY_TEX_UV] = uv
			arr[Mesh.ARRAY_COLOR] = col
			arr[Mesh.ARRAY_INDEX] = ind
			var mesh := ArrayMesh.new()
			mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
			ResourceSaver.save(mesh, "res://city/terrain_%d.res" % tiles, ResourceSaver.FLAG_COMPRESS)
			# uzak sürüm: her 4 köşeden biri (üçgen sayısı 1/16); uzaktaki karolar bununla çizilir
			var fw := (w - 1) / 4 + 1
			var fd := (d2 - 1) / 4 + 1
			if (w - 1) % 4 == 0 and (d2 - 1) % 4 == 0:
				var fp := PackedVector3Array()
				var fn := PackedVector3Array()
				var fu := PackedVector2Array()
				var fc := PackedColorArray()
				var fi := PackedInt32Array()
				for j in fd:
					for i in fw:
						var k := j * 4 * w + i * 4
						fp.append(pos[k])
						fn.append(nor[k])
						fu.append(uv[k])
						fc.append(col[k])
				for j in fd - 1:
					for i in fw - 1:
						var a := j * fw + i
						fi.append_array([a, a + 1, a + fw, a + 1, a + fw + 1, a + fw])
				var fa := []
				fa.resize(Mesh.ARRAY_MAX)
				fa[Mesh.ARRAY_VERTEX] = fp
				fa[Mesh.ARRAY_NORMAL] = fn
				fa[Mesh.ARRAY_TEX_UV] = fu
				fa[Mesh.ARRAY_COLOR] = fc
				fa[Mesh.ARRAY_INDEX] = fi
				var fm := ArrayMesh.new()
				fm.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, fa)
				ResourceSaver.save(fm, "res://city/terrain_%d_far.res" % tiles, ResourceSaver.FLAG_COMPRESS)
			tiles += 1
			ti += TILE
		tj += TILE
	t["tiles"] = tiles
	t.erase("h")
	t.erase("s")
	return h0
