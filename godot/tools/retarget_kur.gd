extends SceneTree
## Godot insan profili (SkeletonProfileHumanoid) ile yeniden eşleme kurulumu.
##   godot --headless --path godot --script res://tools/retarget_kur.gd -- [incele]
## 1) Kemik eşleme dosyaları: tripo (Fransız askeri iskeleti, 41 kemik) ve mixamo (MakeHuman'ın Mixamo adlı iskeleti, 52 kemik).
## 2) İçe aktarma ayarları (.import _subresources): kemikler profil adlarına çevrilir, iskelet %GeneralSkeleton olur,
##    dinlenme duruşu profilin duruşuna oturtulur (fix_silhouette). Böylece askerin animasyonları her insan bedeninde oynar.
## 3) Ortak animasyon kütüphanesi: askerin dosyasının bir kopyası "Animation Library" olarak içe aktarılır; eşlenmeyen
##    kemiklerin (bükülme kemikleri) izleri atılır.
## Ardından: godot --headless --path godot --import

const ORTAK := "res://modeller/karakter/ortak"
const ASKER := "res://modeller/karakter/K13_fransiz_makineli/fransiz_makineli_tufekci.glb"
const KUTUPHANE := ORTAK + "/anim_tripo.glb"
## Blender'da MakeHuman iskeletine aktarılmış kütüphane (tools/anim_aktar.py): insan profiliyle her MakeHuman bedenine paylaşılır
const KUTUPHANE_MPFB := ORTAK + "/anim_mpfb.glb"

const TRIPO := {
	"Root": "Root", "Hips": "Hip", "Spine": "Waist", "Chest": "Spine01", "UpperChest": "Spine02", "Neck": "NeckTwist01", "Head": "Head",
	"LeftShoulder": "L_Clavicle", "LeftUpperArm": "L_Upperarm", "LeftLowerArm": "L_Forearm", "LeftHand": "L_Hand",
	"RightShoulder": "R_Clavicle", "RightUpperArm": "R_Upperarm", "RightLowerArm": "R_Forearm", "RightHand": "R_Hand",
	"LeftUpperLeg": "L_Thigh", "LeftLowerLeg": "L_Calf", "LeftFoot": "L_Foot", "LeftToes": "L_ToeBase",
	"RightUpperLeg": "R_Thigh", "RightLowerLeg": "R_Calf", "RightFoot": "R_Foot", "RightToes": "R_ToeBase",
}
const MIXAMO := {
	"Hips": "Hips", "Spine": "Spine", "Chest": "Spine1", "UpperChest": "Spine2", "Neck": "Neck", "Head": "Head",
	"LeftShoulder": "LeftShoulder", "LeftUpperArm": "LeftArm", "LeftLowerArm": "LeftForeArm", "LeftHand": "LeftHand",
	"RightShoulder": "RightShoulder", "RightUpperArm": "RightArm", "RightLowerArm": "RightForeArm", "RightHand": "RightHand",
	"LeftUpperLeg": "LeftUpLeg", "LeftLowerLeg": "LeftLeg", "LeftFoot": "LeftFoot", "LeftToes": "LeftToeBase",
	"RightUpperLeg": "RightUpLeg", "RightLowerLeg": "RightLeg", "RightFoot": "RightFoot", "RightToes": "RightToeBase",
	"LeftThumbMetacarpal": "LeftHandThumb1", "LeftThumbProximal": "LeftHandThumb2", "LeftThumbDistal": "LeftHandThumb3",
	"LeftIndexProximal": "LeftHandIndex1", "LeftIndexIntermediate": "LeftHandIndex2", "LeftIndexDistal": "LeftHandIndex3",
	"LeftMiddleProximal": "LeftHandMiddle1", "LeftMiddleIntermediate": "LeftHandMiddle2", "LeftMiddleDistal": "LeftHandMiddle3",
	"LeftRingProximal": "LeftHandRing1", "LeftRingIntermediate": "LeftHandRing2", "LeftRingDistal": "LeftHandRing3",
	"LeftLittleProximal": "LeftHandPinky1", "LeftLittleIntermediate": "LeftHandPinky2", "LeftLittleDistal": "LeftHandPinky3",
	"RightThumbMetacarpal": "RightHandThumb1", "RightThumbProximal": "RightHandThumb2", "RightThumbDistal": "RightHandThumb3",
	"RightIndexProximal": "RightHandIndex1", "RightIndexIntermediate": "RightHandIndex2", "RightIndexDistal": "RightHandIndex3",
	"RightMiddleProximal": "RightHandMiddle1", "RightMiddleIntermediate": "RightHandMiddle2", "RightMiddleDistal": "RightHandMiddle3",
	"RightRingProximal": "RightHandRing1", "RightRingIntermediate": "RightHandRing2", "RightRingDistal": "RightHandRing3",
	"RightLittleProximal": "RightHandPinky1", "RightLittleIntermediate": "RightHandPinky2", "RightLittleDistal": "RightHandPinky3",
}
## MakeHuman tabanlı karakterler (Mixamo adlı iskelet)
const MPFB_KARAKTERLER := ["res://modeller/karakter/K02_sehirli_erkek/K02_mpfb.glb", "res://modeller/karakter/K08_sahin_bey/K08_sahin.glb"]


func _bonemap(table: Dictionary, prefix: String, path: String) -> BoneMap:
	var bm := BoneMap.new()
	bm.profile = SkeletonProfileHumanoid.new()
	for prof in table:
		bm.set_skeleton_bone_name(prof, prefix + String(table[prof]))
	ResourceSaver.save(bm, path)
	return load(path)


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


func _set_import(path: String, sub: Dictionary, as_library: bool) -> void:
	var cf := ConfigFile.new()
	if cf.load(path + ".import") != OK:
		push_error("içe aktarma dosyası yok: " + path)
		return
	if as_library:
		cf.set_value("remap", "importer", "animation_library")
		cf.set_value("remap", "type", "AnimationLibrary")
	cf.set_value("params", "_subresources", sub)
	cf.save(path + ".import")
	print("AYAR ", path, " kutuphane=", as_library)


func _incele() -> void:
	var s: Node = load(ASKER).instantiate()
	var ap: AnimationPlayer = s.find_child("AnimationPlayer", true, false)
	for an_name in ["walk", "run", "idle"]:
		var an: Animation = ap.get_animation(an_name)
		for t in an.get_track_count():
			var p := String(an.track_get_path(t))
			if p.ends_with(":Pelvis") or p.ends_with(":Hip") or p.ends_with(":Root") or p.ends_with(":Waist"):
				var lo := INF
				var hi := -INF
				for k in an.track_get_key_count(t):
					var v = an.track_get_key_value(t, k)
					var deg := 0.0
					if v is Quaternion:
						deg = rad_to_deg(v.get_angle())
					elif v is Vector3:
						deg = v.length() * 100.0
					lo = minf(lo, deg)
					hi = maxf(hi, deg)
				print("IZ %s %s tur=%d anahtar=%d aralik=%.2f..%.2f" % [an_name, p, an.track_get_type(t), an.track_get_key_count(t), lo, hi])


func _init() -> void:
	if "incele" in OS.get_cmdline_user_args():
		_incele()
		quit()
		return
	DirAccess.make_dir_recursive_absolute(ORTAK)
	var bt := _bonemap(TRIPO, "", ORTAK + "/bonemap_tripo.tres")
	var bmx := _bonemap(MIXAMO, "mixamorig_", ORTAK + "/bonemap_mixamo.tres")
	print("ESLEME tripo=", TRIPO.size(), " mixamo=", MIXAMO.size())
	_set_import(KUTUPHANE, _sub(bt, true), true)
	if FileAccess.file_exists(KUTUPHANE_MPFB + ".import"):
		_set_import(KUTUPHANE_MPFB, _sub(bmx, true), true)
	for p in MPFB_KARAKTERLER:
		_set_import(p, _sub(bmx, false), false)
	quit()
