extends SceneTree
## Bağlama (bind) sınavı: model Godot'da dinlenme duruşunda ve tek kemik bükülünce nasıl görünüyor.
##   godot --path godot --resolution 900x700 --script res://tools/bag_sinav.gd -- <model.glb> <cikti_klasoru>
## Kemik ile ağ ayrı duruşlarda bağlanmışsa (ör. kemik T, ağ A) dinlenmede kol kemiğin yönünü izlemez; bükünce eklem
## yanlış yerden döner. Kemik çizgileri kırmızıyla ağın üstüne çizilir.

var out := ""
var model: Node3D
var sk: Skeleton3D
var cam: Camera3D
var lines: MeshInstance3D
var jobs := ["dinlenme", "sol_onkol_90", "sol_kol_asagi"]
var wait := 0


func _initialize() -> void:
	var a := OS.get_cmdline_user_args()
	out = a[1]
	DirAccess.make_dir_recursive_absolute(out)
	var root := get_root()
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color(0.6, 0.62, 0.65)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.8, 0.8, 0.8)
	env.environment = e
	root.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-30, -20, 0)
	root.add_child(sun)
	model = load(a[0]).instantiate()
	root.add_child(model)
	for n in model.find_children("*", "Skeleton3D", true, false):
		sk = n
	cam = Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = 2.0
	cam.position = Vector3(0, 1.0, 4)
	root.add_child(cam)
	cam.current = true
	lines = MeshInstance3D.new()
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = Color(1, 0, 0)
	m.no_depth_test = true
	lines.material_override = m
	root.add_child(lines)


func _draw_bones() -> void:
	var im := ImmediateMesh.new()
	im.surface_begin(Mesh.PRIMITIVE_LINES)
	for i in sk.get_bone_count():
		var p := sk.get_bone_parent(i)
		if p < 0:
			continue
		im.surface_add_vertex((sk.global_transform * sk.get_bone_global_pose(p)).origin)
		im.surface_add_vertex((sk.global_transform * sk.get_bone_global_pose(i)).origin)
	im.surface_end()
	lines.mesh = im


func _process(_dt: float) -> bool:
	if wait > 0:
		wait -= 1
		if wait == 0:
			get_root().get_texture().get_image().save_png("%s/bag_%s.png" % [out, jobs.pop_front()])
		return false
	if jobs.is_empty():
		print("BITTI")
		return true
	sk.reset_bone_poses()
	var j: String = jobs[0]
	if j == "sol_onkol_90":
		var i := sk.find_bone("LeftLowerArm")
		sk.set_bone_pose_rotation(i, sk.get_bone_rest(i).basis.get_rotation_quaternion() * Quaternion(Vector3(0, 0, 1), deg_to_rad(90)))
	elif j == "sol_kol_asagi":
		var i := sk.find_bone("LeftUpperArm")
		sk.set_bone_pose_rotation(i, sk.get_bone_rest(i).basis.get_rotation_quaternion() * Quaternion(Vector3(0, 0, 1), deg_to_rad(60)))
	_draw_bones()
	wait = 3
	return false
