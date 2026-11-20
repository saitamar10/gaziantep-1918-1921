# Gaziantep 1918–1921 — Godot sürümü

Oyunun Godot 4.7 sürümü. Şehrin tamamı (arazi, 10.343 parsel, kale, camiler, hanlar), kahraman sokak ve Bölüm 1 buradadır.

## Çalıştırma
- `Oyunu-Baslat.bat` — düşük ayar (tümleşik ekran kartı).
- `Oyunu-Baslat-Yuksek.bat` — yüksek ayar (ayrı ekran kartı; Vulkan, ortam kararması, uzun gölge).
- Oyun içinde **F5** kalite kademesini değiştirir: düşük → orta → yüksek → ultra.

## Oynanış
- **E** konuş · **M** harita (köşede küçük harita hep açık; altın çizgi hedefe giden yol) · **J** günlük (ok tuşlarıyla seç, Enter ile o güne/bölüme geç) · **C** çömel · tüfek varken sol tık ateş, sağ tık nişan, **R** doldur.
- Senaryolar: Prolog (17 Aralık 1918, 25 Ekim 1919, 23 Kasım 1919), Gizli Toplantı ve yedi komisyon görevi, Savaşa Giden Yol (Karabıyıklı, Şehit Kâmil, Kilis Yolu, Dokurcum, Elmalı Köprüsü), Bölüm 1–11 ve Epilog (hikâye baştan sona oynanır).
  Bir bölüm bitince tarih kendiliğinden ilerler.

## Dosyalar
- `scripts/world.gd` ana sahne, kalite kademeleri · `scripts/city.gd` şehir, arazi, çarpışma, detay akışı
- `scripts/game.gd` görev motoru ve bütün senaryolar · `scripts/combat.gd` çatışma
- `scripts/npcs.gd` sakinler, kimlikler · `scripts/npc.gd` tek kişi (yer tutucu figür) · `scripts/nav.gd` yol ağı
- `scripts/sfx.gd` sesler (koddan üretilir) · `scripts/map.gd` harita · `scripts/street.gd` kahraman sokak · `scripts/player.gd` oyuncu
- `city/` pişirilmiş şehir ve yol ağı (üretilir; elle düzenlenmez)

## Sınama
    godot --headless --path godot -- --autoplay

Bütün senaryoları baştan sona kendiliğinden oynatır; her bölüm için `CHAPTER_DONE`, sonunda `ALL_DONE` yazar.
Bu sınama hedeften hedefe ışınlanır: yürüyerek ulaşılabilirliği ve çatışma dengesini ölçmez.

## Şehri yeniden üretmek
Şehir, web sürümünün üreticisinden (`../antep/src/world`) pişirilir. Üretici değişirse:

    node godot/tools/bake_city.mjs
    godot --headless --path godot --script res://tools/import_city.gd

İlk komut `city_src/city.bin` (1,2 GB, ara dosya; iş bitince silinebilir) yazar, ikincisi `city/` klasörünü kurar.
Yalnız yol ağı ve hikâye yerleri için: `node godot/tools/bake_city.mjs --nav`.

## Henüz taşınmayanlar
Tanıdıklar defteri, sakinlerin kendi aralarındaki sohbeti, işgal devriyeleri, web'deki ayrıntılı kahraman sokak.
Karakterler yer tutucu figürdür; gerçek modeller gelince `scripts/npc.gd` içindeki figür kısmı değişecek.
