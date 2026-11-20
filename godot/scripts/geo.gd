class_name Geo
extends RefCounted
## Birleştirilmiş geometri kurucu: aynı malzemeyi kullanan bütün kutular tek ağda toplanır (az çizim çağrısı).
## Koordinatlar web sürümüyle aynı: x doğu, y yukarı, z güney; 1 birim = 1 m.

var st := SurfaceTool.new()
var count := 0


func _init() -> void:
	st.begin(Mesh.PRIMITIVE_TRIANGLES)


## a, b, c, d: dışarıdan bakınca saat yönünün tersine sıralı köşeler; n: dış normal.
func quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3, n: Vector3, ua: Vector2, ub: Vector2, uc: Vector2, ud: Vector2) -> void:
	var vs := [a, c, b, a, d, c]
	var us := [ua, uc, ub, ua, ud, uc]
	for i in 6:
		st.set_normal(n)
		st.set_uv(us[i])
		st.add_vertex(vs[i])
	count += 2


## Dönmüş kutu. size = (genişlik x, yükseklik y, derinlik z); yaw: y ekseni çevresinde dönüş; uvs: dokunun kapladığı metre.
func box(center: Vector3, size: Vector3, yaw: float = 0.0, uvs: float = 3.0, tilt: Vector3 = Vector3.ZERO) -> void:
	var b := Basis.from_euler(Vector3(tilt.x, yaw, tilt.z))
	var h := size * 0.5
	var o := Vector2(center.x + center.z, center.y) / uvs  # doku her kutuda aynı yerden başlamasın
	var faces := [
		[Vector3(0, 0, 1), Vector3(-h.x, -h.y, h.z), Vector3(h.x, -h.y, h.z), Vector3(h.x, h.y, h.z), Vector3(-h.x, h.y, h.z), size.x, size.y],
		[Vector3(0, 0, -1), Vector3(h.x, -h.y, -h.z), Vector3(-h.x, -h.y, -h.z), Vector3(-h.x, h.y, -h.z), Vector3(h.x, h.y, -h.z), size.x, size.y],
		[Vector3(1, 0, 0), Vector3(h.x, -h.y, h.z), Vector3(h.x, -h.y, -h.z), Vector3(h.x, h.y, -h.z), Vector3(h.x, h.y, h.z), size.z, size.y],
		[Vector3(-1, 0, 0), Vector3(-h.x, -h.y, -h.z), Vector3(-h.x, -h.y, h.z), Vector3(-h.x, h.y, h.z), Vector3(-h.x, h.y, -h.z), size.z, size.y],
		[Vector3(0, 1, 0), Vector3(-h.x, h.y, h.z), Vector3(h.x, h.y, h.z), Vector3(h.x, h.y, -h.z), Vector3(-h.x, h.y, -h.z), size.x, size.z],
		[Vector3(0, -1, 0), Vector3(-h.x, -h.y, -h.z), Vector3(h.x, -h.y, -h.z), Vector3(h.x, -h.y, h.z), Vector3(-h.x, -h.y, h.z), size.x, size.z],
	]
	for f in faces:
		var w: float = f[5] / uvs
		var hh: float = f[6] / uvs
		quad(center + b * f[1], center + b * f[2], center + b * f[3], center + b * f[4], b * f[0],
			o + Vector2(0, hh), o + Vector2(w, hh), o + Vector2(w, 0), o + Vector2(0, 0))


func commit(material: Material, shadows: bool = true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	if count == 0:
		return mi
	st.generate_tangents()
	mi.mesh = st.commit()
	mi.material_override = material
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi
