extends SceneTree
## Bir model sahnesinin düğüm yollarını, iskelet kemik adlarını ve animasyonlarını yazar.
##   godot --headless --path godot --script res://tools/sahne_bak.gd -- res://.../model.glb
func _walk(n: Node, root: Node) -> void:
	var line := "DUGUM %s (%s)" % [root.get_path_to(n), n.get_class()]
	if n is Skeleton3D:
		var names := PackedStringArray()
		for i in n.get_bone_count():
			names.append(n.get_bone_name(i))
		line += " kemik=%d %s" % [n.get_bone_count(), ",".join(names)]
	if n is AnimationPlayer:
		line += " anim=%s kok=%s" % [str(n.get_animation_list()), n.root_node]
		if n.has_animation("walk"):
			var an: Animation = n.get_animation("walk")
			line += " ornek_iz=%s" % [an.track_get_path(0)]
	print(line)
	for c in n.get_children():
		_walk(c, root)

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	for p in args:
		var s: Node = load(p).instantiate()
		print("SAHNE ", p)
		_walk(s, s)
	quit()
