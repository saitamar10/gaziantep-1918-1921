extends SceneTree
func _init() -> void:
	var lib: AnimationLibrary = load("res://modeller/karakter/ortak/anim_tripo.glb")
	print("KUTUPHANE ", lib.get_animation_list())
	var an: Animation = lib.get_animation("walk")
	var paths := PackedStringArray()
	for t in mini(an.get_track_count(), 60):
		paths.append(String(an.track_get_path(t)))
	print("IZLER ", an.get_track_count(), " ", ", ".join(paths))
	var s: Node = load("res://modeller/karakter/K02_sehirli_erkek/K02_mpfb.glb").instantiate()
	var sk: Skeleton3D = s.find_child("*", true, false) if false else null
	for n in s.find_children("*", "Skeleton3D", true, false):
		sk = n
	var names := PackedStringArray()
	for i in sk.get_bone_count():
		names.append(sk.get_bone_name(i))
	print("MPFB_ISKELET ", s.get_path_to(sk), " unique=", sk.is_unique_name_in_owner(), " motion_scale=", sk.motion_scale, " kemik=", ",".join(names))
	quit()
