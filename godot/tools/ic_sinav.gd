extends SceneTree
## Nazaretyan Evi'ni yalın sahnede açar, iki malzeme yoluyla görüntü alır (sınama).
var n := 0
var cam: Camera3D
func _initialize() -> void:
	var root := get_root()
	var ps: PackedScene = load("res://modeller/nazaretyan/nazaretyan.gltf")
	var m: Node3D = ps.instantiate()
	root.add_child(m)
	var cnt := 0
	for mi in m.find_children("*", "MeshInstance3D", true, false):
		var msh: Mesh = mi.mesh
		for si in msh.get_surface_count():
			var sm = msh.surface_get_material(si)
			var nm: String = sm.resource_name if sm != null else ""
			var m2 := StandardMaterial3D.new()
			m2.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
			m2.cull_mode = BaseMaterial3D.CULL_DISABLED
			m2.albedo_texture = load("res://modeller/nazaretyan/doku/%s_baseColor.jpg" % nm)
			mi.set_surface_override_material(si, m2)
			cnt += 1
	print("SINAV yuzey=", cnt)
	cam = Camera3D.new()
	root.add_child(cam)
	cam.position = Vector3(0, 1.6, 0)
	cam.current = true
func _process(_d: float) -> bool:
	n += 1
	if n == 10:
		get_root().get_texture().get_image().save_png("res://_out/nazaretyan/sinav_a.png")
		cam.rotation.y = PI
	if n == 20:
		get_root().get_texture().get_image().save_png("res://_out/nazaretyan/sinav_b.png")
		return true
	return false
