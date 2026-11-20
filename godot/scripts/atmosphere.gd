class_name Atmosphere
extends Resource
## Bir ışık ve hava durumu: güneş, ortam ışığı, pus, gökyüzü renkleri ve renk düzeltme.
## res://grafik/gunduz.tres, gece.tres, kis.tres bu türdendir; editörde açıp değerleri değiştirebilirsiniz.

@export var ad := "Gündüz"

@export_group("Güneş / ay")
@export var sun_color := Color(1.0, 0.94, 0.84)
@export_range(0.0, 4.0, 0.05) var sun_energy := 1.45
## Ufkun üstündeki açı (derece; -90 tam tepe)
@export_range(-90.0, 0.0, 1.0) var sun_elevation := -34.0
@export_range(-180.0, 180.0, 1.0) var sun_azimuth := -128.0

@export_group("Ortam ışığı")
## Gölgelerin rengi: gökten gelen ışık (hafif soğuk) + yerden seken ışık
@export var ambient_color := Color(0.6, 0.62, 0.66)
@export_range(0.0, 2.0, 0.05) var ambient_energy := 0.72

@export_group("Uzak pus (atmosferik perspektif)")
## Uzaktaki yapıların büründüğü renk; ufuk rengine yakın tutun ki şehir silueti gökle birleşsin
@export var fog_color := Color(0.76, 0.79, 0.83)
## Pusun en uzakta ulaştığı yoğunluk (0 = yok, 1 = tamamen kapatır). Aşırı sis istenmiyorsa 0,6–0,8
@export_range(0.0, 1.0, 0.01) var haze := 0.72
## Pusun başladığı ve tamamlandığı mesafe (metre)
@export_range(0.0, 500.0, 5.0) var fog_begin := 45.0
@export_range(100.0, 4000.0, 10.0) var fog_end := 1500.0
## (eski üstel sis yoğunluğu; kullanılmıyor)
@export_range(0.0, 0.02, 0.0001) var fog_density := 0.0022

@export_group("Gökyüzü")
@export var sky_top := Color(0.25, 0.43, 0.72)
@export var sky_horizon := Color(0.78, 0.81, 0.84)
@export var ground_horizon := Color(0.68, 0.64, 0.56)
@export var ground_bottom := Color(0.3, 0.26, 0.2)
@export var cloud_color := Color(1.0, 0.96, 0.88)
## Küçük değer = daha kapalı gök (0,3 kapalı · 0,56 parçalı bulutlu · 0,8 açık)
@export_range(0.0, 1.0, 0.01) var cloud_cover := 0.56
## Ufuktaki uzak dağ silueti (0 = yok)
@export_range(0.0, 1.0, 0.01) var mountains := 1.0

@export_group("Renk düzeltme")
@export_range(0.3, 2.0, 0.01) var exposure := 1.0
@export_range(0.0, 2.0, 0.01) var saturation := 1.0
@export_range(0.5, 1.5, 0.01) var contrast := 1.08
