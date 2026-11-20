# Dış dokular (PBR)

Bu klasöre konan doku setleri oyundaki prosedürel dokuların yerine geçer. Klasörü boş olan set prosedürel dokuyla çalışmaya devam eder; eksik ya da bozuk dosya oyunu çökertmez.

## Klasör yapısı

```
textures/
  manifest.json
  stone/    color.jpg  normal.jpg  roughness.jpg  ao.jpg
  stone2/   …
  basalt/   …
  cobble/   …
  dirt/     …
  grass/    …
  field/    …
  planks/   …
  wood/     …
  tiles/    …
  flat/     …
```

## Her setteki dosyalar

| Dosya | Zorunlu | İçerik |
|---|---|---|
| `color.jpg` | evet | Renk (albedo / diffuse / base color), sRGB |
| `normal.jpg` | önerilir | Normal haritası, **OpenGL** biçimi (Poly Haven `nor_gl`, ambientCG `NormalGL`). DirectX biçimi ters gölge verir. |
| `roughness.jpg` | önerilir | Pürüzlülük, gri tonlu |
| `ao.jpg` | isteğe bağlı | Ortam kapanması, gri tonlu |

`color.jpg` yoksa set yok sayılır. `normal.jpg` ya da `roughness.jpg` yoksa düz bir yedek kullanılır. Yükseklik (displacement) ve metalik haritalar kullanılmaz. Çözünürlük: 2K yeterli; 4K bu oyunda belleği zorlar. Dokular dikişsiz (seamless) olmalı.

## Setler ve nerede kullanıldıkları

| Klasör | Yüzey | Aranacak doku türü | `size` (m) |
|---|---|---|---|
| `stone` | Bina duvarları, kale, hanlar (açık kesme taş) | sarımsı-bej kesme kalker taşı duvar, belirgin derz | 3 |
| `stone2` | İkinci duvar çeşidi (bahçe duvarı, kemerler) | aynı tonda, daha kaba/aşınmış kesme taş | 3 |
| `basalt` | Siyah taş kuşaklar, ablak, su basmanı | koyu gri/siyah kesme bazalt | 3 |
| `cobble` | Sokak zemini | düzensiz, eskimiş arnavut kaldırımı | 4 |
| `dirt` | Toprak yollar, kale yamacı | sıkışmış kuru toprak | 6 |
| `grass` | Dere kenarı, boş araziler | kuru-yeşil karışık ot | 5 |
| `field` | Bostan ve tarlalar | sürülmüş toprak / ekili sıra | 9 |
| `planks` | Kapılar, kepenkler | eskimiş koyu ahşap kalaslar (dikey) | 1 |
| `wood` | Kirişler, direkler, ağaç gövdeleri | koyu ahşap damarı | 1 |
| `tiles` | Kiremit çatılar | kırmızı alaturka (oluklu) kiremit | 2 |
| `flat` | Toprak damlar, çuvallar | sıkıştırılmış toprak dam / kaba sıva | 3 |

## `size` ayarı

`manifest.json` içindeki `size`, görüntünün gerçekte kapladığı genişliktir (metre). Taşlar çok büyük görünüyorsa `size`'ı küçültün, çok küçükse büyütün. Poly Haven ve ambientCG sayfalarında bu ölçü genelde yazılıdır.

## Farklı dosya adları

İndirdiğiniz dosyaları yeniden adlandırmak istemezseniz adları manifeste yazın:

```json
"stone": { "size": 2.5, "color": "sandstone_blocks_diff_2k.jpg", "normal": "sandstone_blocks_nor_gl_2k.jpg", "roughness": "sandstone_blocks_rough_2k.jpg", "ao": "sandstone_blocks_ao_2k.jpg" }
```

Bir seti geçici olarak kapatmak için: `"stone": { "enabled": false }`.

## Bilinen sınırlar

- **Kahraman sokak** (oyunun başladığı 100 m'lik sokak) kendi tekrarsız prosedürel cephe ve zemin dokularını kullanır; bu klasör orayı değiştirmez.
- Duvar renkleri binadan binaya hafif bir tonla çarpılır; çok koyu bir taş dokusu daha da koyu görünür. Açık, nötr tonlu dokular en iyi sonucu verir.
- Kumaş (tente), yaprak ve kafes dokuları prosedürel kalır.
- Klasörü boş her set için tarayıcı konsolunda bir "404" satırı görünür; zararsızdır.
