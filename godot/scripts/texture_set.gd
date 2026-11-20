class_name TextureSet
extends Resource
## Bir yüzey için gerçek (fotoğraftan) doku seti. res://dokular/<ad>.tres dosyaları bu türdendir ve BOŞ gelir (yer tutucu):
## `albedo` doldurulmadıkça oyun koddan üretilmiş dokuyu kullanır. Doldurmak için indirdiğiniz görselleri res://dokular/
## klasörüne koyup editörde bu dosyayı açın ve ilgili alanlara sürükleyin. Hangi doku nereye: dokular/BENIOKU.md

@export var albedo: Texture2D
## OpenGL biçimli normal dokusu (Poly Haven'da "nor_gl")
@export var normal: Texture2D
@export var roughness: Texture2D
@export var ambient_occlusion: Texture2D
## Dokunun bir tekrarı gerçekte kaç metre (Poly Haven sayfasındaki "dimensions")
@export_range(0.25, 20.0, 0.05) var tile_metres := 2.0
## Renk çarpanı: doku fazla koyu ya da doygunsa buradan dengeleyin
@export var tint := Color.WHITE
