# Malzeme denemesi ve test sokağı (20 Kasım 2026)

## İncelenen araçlar
| Araç | Sonuç |
|---|---|
| Material Maker 1.8 (MIT, bağımsız uygulama, Godot 4.7.2 tabanlı) | Komut satırından dışa aktarma var; kurulmadı (indirme izni gerekir) |
| Texture Mixer 0.1.1 (GPL, Blender 4.5+ eklentisi, alfa) | Elle boyama aracı; betikle kullanılamıyor, bu iş için uygun değil |
| Mat-Baker 1.2.0 (GPL, Blender eklentisi, Godot hazır ayarı, OpenGL normal, ORM) | Yalnız arayüzden çalışıyor, komut satırı belgelenmemiş; 7 yıldızlı küçük proje. Kurulmadı: dışarıdan kod çalıştırmak izin ister |

Mevcut Poly Haven setleri (`dokular/`) değiştirilmedi.

## Deneme dokuları (`dokular_deneme/`, üretici `tools/malzeme_uret.py`)
- Duvar (2 m döşeme) ve kaldırım (2.4 m döşeme): Base Color, Normal (OpenGL), Roughness, AO, Height (16 bit).
- Oyunda yalnız `--doku-deneme` verilince kullanılır; varsayılan oyun eski dokularla açılır.
- **Sonuç: reddedildi.** Oyun içinde duvar fabrika tuğlası, zemin modern parke gibi göründü
  (`_out/test_sokagi/00_reddedilen_deneme_dokulari.png`). Kodla kurulan taş dizilimi gerçek fotoğraf dokusunun yerini tutmuyor.

## Kare hızı (1280×720, Compatibility, aynı nokta, sıra değiştirilerek)
| Durum | Ortalama FPS (8 ölçüm) | Doku belleği |
|---|---|---|
| Eski (Poly Haven 1K) | ≈ 49 | 78 MB |
| Yeni 2K, mip haritası kapalı | ≈ 26 | 93 MB |
| Yeni 2K, mip haritası açık | ≈ 42 (≈ %14 düşük) | 93 MB |
| Yeni 1K'ya sınırlı (3 ölçüm) | ≈ 45 (eski: 54 / 18* / 58) | 81 MB |
*Bu makinede tek ölçümler arasında %30'a varan sapma var; farklar gürültüye yakın. Ders: yeni doku eklerken mip haritası açık olmalı.

## Test sokağı
Konum `--at -709,799,2.70` (tarihî plan deneme mahallesinin içinde). Yedek: `yedek/test_sokagi_once_20261120.zip`.
Her aşamadan sonra aynı açıdan görüntü: `_out/test_sokagi/NN_*.png`.
