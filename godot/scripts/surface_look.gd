class_name SurfaceLook
extends Resource
## Yüzey derinliği ayarları (AŞAMA 2). res://grafik/yuzey.tres bu türdendir; editörde açıp değiştirebilirsiniz.
## Yalnız "yüzey derinliği" açık olan kalite profillerinde (ORTA ve üstü) etkilidir.

@export_group("Taş duvarlar")
## Doku tekrarını kıran iri ton lekelerinin gücü
@export_range(0.0, 0.6, 0.01) var macro_strength := 0.22
## Lekelerin büyüklüğü (metre)
@export_range(4.0, 80.0, 1.0) var macro_size := 22.0
## Sıcak/soğuk renk kayması
@export_range(0.0, 1.0, 0.01) var warm_shift := 0.5
## Saçak altından inen nem ve kir izleri
@export_range(0.0, 1.0, 0.01) var streak_strength := 0.4
@export var stain_color := Color(0.55, 0.5, 0.44)
## Dam, korkuluk üstü ve çıkıntılarda birikmiş toz
@export_range(0.0, 1.0, 0.01) var dust_strength := 0.3
@export var dust_color := Color(0.6, 0.52, 0.4)

@export_group("Zemin")
## Kaldırım taşlarının arasına dolan toprak
@export_range(0.0, 1.0, 0.01) var ground_gap_fill := 0.7
## Zemindeki iri kir lekeleri
@export_range(0.0, 0.5, 0.01) var ground_stain := 0.16
