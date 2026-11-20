# Gerçek doku setleri

> **Durum (18 Kasım 2026):** dokuz set Poly Haven'dan (CC0, 1K) indirildi ve bağlandı: stone = `sandstone_blocks_05`, stone2 = `white_sandstone_blocks_02`,
> basalt, cobble, dirt, planks, wood, tiles, flat aşağıdaki tablodaki gibi. Her klasördeki `KAYNAK.txt` kaynağı yazar. `grass` ve `field` boş.
> Bir seti değiştirmek için klasördeki görselleri aynı adlarla değiştirip `tools/fill_dokular.gd` aracını çalıştırın.

Bu klasördeki `.tres` dosyaları **boş** doku setleridir. Boş kaldıkça oyun koddan üretilmiş dokuları kullanır.
Bir seti doldurduğunuzda o yüzey şehrin tamamında gerçek dokuya geçer; başka hiçbir şey değiştirmek gerekmez.

## Nasıl doldurulur
1. Aşağıdaki dokuyu Poly Haven'dan **1K, JPG** olarak indirin (hepsi CC0, ücretsiz; kaynak göstermek zorunlu değil).
   Gerekli haritalar: **Diffuse**, **Normal (GL)**, **Roughness**; varsa **AO**.
2. Dosyaları bu klasöre koyun (ör. `dokular/stone/`).
3. Godot editöründe ilgili `.tres` dosyasına çift tıklayın, görselleri `Albedo`, `Normal`, `Roughness`, `Ambient Occlusion`
   alanlarına sürükleyin. `Tile Metres` değerini tablodaki ölçüye ayarlayın.
4. Normal görselini seçip Import sekmesinde **Normal Map: Enable** yapın ve Reimport'a basın.

İndirme adresi: `https://polyhaven.com/a/<ad>`

## İhtiyaç listesi

| Dosya | Oyundaki yüzey | Önerilen doku (Poly Haven) | Bir tekrar | Not |
|---|---|---|---|---|
| `stone.tres` | Evlerin kesme taş duvarı (açık renk kalker) | `sandstone_blocks_08` | 3,0 m | Temiz, açık bej kesme taş. Seçenek: `white_sandstone_blocks_02` (2,0 m) |
| `stone2.tres` | İkinci duvar türü, kemerler, siper taşları | `sandstone_blocks_05` | 3,0 m | Daha yıpranmış kesme taş |
| `basalt.tres` | Su basmanı, kuşaklar, kemer taşları (koyu taş) | `castle_wall_slates` | 2,5 m | Koyu gri blok taş. Seçenek: `medieval_blocks_05` (2,0 m) |
| `cobble.tres` | Sokak döşemesi | `cobblestone_floor_08` | 2,0 m | Kirli arnavut kaldırımı. Seçenek: `cobblestone_floor_04` (1,5 m) |
| `dirt.tres` | Toprak zemin, küpler | `brown_mud_dry` | 1,3 m | Kuru çatlak toprak. Seçenek: `dry_ground_rocks` (4,0 m) |
| `planks.tres` | Kapılar, kepenkler, tezgâhlar | `weathered_brown_planks` | 1,8 m | Yıpranmış kahverengi tahta |
| `wood.tres` | Direkler, kirişler, ağaç gövdesi | `old_planks_02` | 2,0 m | Eski ahşap |
| `tiles.tres` | Kiremit çatılar | `clay_roof_tiles_02` | 2,5 m | Kırmızı alaturka kiremit |
| `flat.tres` | Toprak damlar, çuvallar | `beige_wall_001` | 3,0 m | Bej sıva/toprak yüzey. Seçenek: `plastered_wall` (2,0 m) |
| `grass.tres` | (henüz bağlı değil) arazi otu | `sparse_grass` | 2,0 m | Arazi şimdilik kendi karışım gölgelendiricisini kullanıyor |
| `field.tres` | (henüz bağlı değil) tarla | `dry_mud_field_001` | 3,0 m | Aynı not |

Seçenek olarak moloz taş duvar için `rustic_stone_wall_02` (1,5 m) da uygundur; şu an ayrı bir yüzey türü yoktur.

## Bilinmesi gerekenler
- Evlerin taş rengi ağlara köşe rengi olarak da işlenmiştir (her ev biraz farklı tonda). Gerçek doku fazla sarı çıkarsa
  setin `Tint` alanını griye doğru çekin.
- Çarşı sokağı (kahraman sokak) kendi dokularını kullanır; bu setlerden etkilenmez.
- DÜŞÜK kalite profilinde normal dokuları kullanılmaz (hız için).
