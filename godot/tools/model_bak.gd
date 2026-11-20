extends SceneTree
## res://modeller altındaki model dosyalarını açıp boyutunu, ağ ve animasyon adlarını yazar (içe aktarma denetimi).
##   godot --headless --path godot --script res://tools/model_bak.gd


func _walk(n: Node, out: Dictionary) -> void:
	if n is MeshInstance3D and n.mesh != null:
		var bb: AABB = n.global_transform * n.mesh.get_aabb() if n.is_inside_tree() else n.mesh.get_aabb()
		out["aabb"] = bb if not out.has("aabb") else out["aabb"].merge(bb)
		out["mesh"] = out.get("mesh", 0) + 1
		for si in n.mesh.get_surface_count():
			out["tri"] = out.get("tri", 0) + n.mesh.surface_get_array_index_len(si) / 3
	if n is Skeleton3D:
		out["kemik"] = n.get_bone_count()
	if n is AnimationPlayer:
		out["anim"] = n.get_animation_list()
	for c in n.get_children():
		_walk(c, out)


func _init() -> void:
	var files := []
	for d in ["res://modeller/hayvan", "res://modeller/karakter/K01_yasli_esnaf"]:
		for f0 in DirAccess.get_files_at(d):
			if f0.ends_with(".fbx") or f0.ends_with(".glb"):
				files.append(d + "/" + f0)
	for f in files:
		var ps: PackedScene = load(f)
		if ps == null:
			print("MODEL ", f, " yüklenemedi")
			continue
		var inst := ps.instantiate()
		get_root().add_child(inst)
		var o := {}
		_walk(inst, o)
		print("MODEL %s ağ=%d üçgen=%d kemik=%d boyut=%s animasyon=%s" % [f.get_file(), o.get("mesh", 0), o.get("tri", 0), o.get("kemik", 0), str(o.get("aabb", AABB()).size), str(o.get("anim", []))])
		inst.queue_free()
	quit()
