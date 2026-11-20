extends SceneTree
## Kimodo deneyi için içe aktarma ayarları — yalnız modeller/karakter/test_kimodo klasörüne dokunur.
##   godot --headless --path godot --import ; godot --headless --path godot --script res://tools/kimodo_kur.gd ; godot --headless --path godot --import
## Oyundaki karakterler ve ortak kütüphaneler değişmez. Kemik eşlemesi ortak bonemap_mixamo.tres'ten okunur (yazılmaz).

const KLASOR := "res://modeller/karakter/test_kimodo"
const ESLEME := "res://modeller/karakter/ortak/bonemap_mixamo.tres"


func _sub(bm: BoneMap, remove_unmapped: bool) -> Dictionary:
	return {"nodes": {"PATH:Armature/Skeleton3D": {
		"retarget/bone_map": bm,
		"retarget/bone_renamer/rename_bones": true,
		"retarget/bone_renamer/unique_node/make_unique": true,
		"retarget/bone_renamer/unique_node/skeleton_name": "GeneralSkeleton",
		"retarget/remove_tracks/except_bone_transform": false,
		"retarget/remove_tracks/unimportant_positions": true,
		"retarget/remove_tracks/unmapped_bones": remove_unmapped,
		"retarget/rest_fixer/apply_node_transforms": true,
		"retarget/rest_fixer/normalize_position_tracks": true,
		"retarget/rest_fixer/retarget_method": 1,
		"retarget/rest_fixer/fix_silhouette/enable": true,
		"retarget/rest_fixer/fix_silhouette/threshold": 15.0,
	}}}


func _ayarla(path: String, sub: Dictionary, lib: bool) -> void:
	var cf := ConfigFile.new()
	if cf.load(path + ".import") != OK:
		push_error("içe aktarma dosyası yok (önce --import): " + path)
		return
	if lib:
		cf.set_value("remap", "importer", "animation_library")
		cf.set_value("remap", "type", "AnimationLibrary")
	cf.set_value("params", "_subresources", sub)
	cf.save(path + ".import")
	print("AYAR ", path, " kutuphane=", lib)


func _init() -> void:
	var bm: BoneMap = load(ESLEME)
	_ayarla(KLASOR + "/test_govde.glb", _sub(bm, false), false)
	for f in DirAccess.get_files_at(KLASOR):
		if f.begins_with("kimodo_") and f.ends_with(".glb"):
			_ayarla(KLASOR + "/" + f, _sub(bm, true), true)
	quit()
