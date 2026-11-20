# 3B modeller (GLB)

Bu klasöre konan karakter modelleri oyundaki yer tutucu mankenlerin yerine geçer. Dosyası olmayan karakter mankenle çizilmeye devam eder; eksik ya da bozuk dosya oyunu çökertmez.

## Klasör yapısı

```
models/
  manifest.json
  characters/
    K01_yasli_esnaf.glb
    K02_sehirli_erkek.glb
    K03_ev_kadini.glb
    K04_cocuk.glb
    K05_su_tasiyan_kadin.glb
    K06_hamal.glb
    K07_muzisyen.glb
    K08_kuvayi_milliye.glb
    K09_fransiz_piyade.glb
    K10_fransiz_subayi.glb
    K11_genc_kadin.glb
    K12_yasli_kadin.glb
    K13_fransiz_makineli.glb
    K14_yardimci_birlik.glb
  props/
    (yapı ve eşya modelleri; manifestteki "models" listesine yazılır)
```

Dosya adları `manifest.json` içinde hazır yazılıdır; dosyayı o adla klasöre koymak yeterlidir. Her karakterin tasarım görseli `docs/ref/Kxx_*.png` içindedir.

## Karakter modeli şartları

- **Biçim:** glTF 2.0 ikili (`.glb`), dokular gömülü.
- **Ölçek ve yön:** 1 birim = 1 m, Y yukarı, ayak tabanı sıfırda, yüz +Z'ye bakar. Boy oyunda karaktere göre otomatik ölçeklenir.
- **İskelet:** rigli (skinned) olmalı. Rigsiz model yüklenir ama kayarak hareket eden bir heykel gibi görünür.
- **Animasyon klipleri:** en az `idle` ve `walk`. Diğerleri: `run talk_a talk_b sit carry_walk carry_idle work_a shop interact play sift guard`. Eksik klip yerine `idle` oynatılır.
- **Üçgen sayısı:** yakın plan için 30–50 bin; sokakta aynı anda 20 kadar karakter çizildiği için daha fazlası kare hızını düşürür.
- **Doku:** 2K yeterli.

## Klip adları farklıysa

Mixamo ya da başka bir kaynaktan gelen klip adlarını manifeste eşleyin:

```json
{ "id": "K01", "url": "models/characters/K01_yasli_esnaf.glb", "walkSpeed": 1.3,
  "clips": { "idle": "Idle", "walk": "Walking", "talk_a": "Talking" } }
```

`walkSpeed`, yürüme klibinin ayak kaymadan ilerlediği hızdır (m/sn); ayaklar kayıyorsa bu değeri değiştirin. Bir karakteri geçici olarak mankene döndürmek için `"enabled": false` yazın.

## Yapı ve eşya modelleri

`manifest.json` içindeki `"models"` listesine yazılır:

```json
{ "id": "ev_avlulu_01", "url": "models/props/ev_avlulu_01.glb", "x": 120, "z": 310, "rotY": 1.57, "scale": 1, "snapGround": true }
```

`x` ve `z` oyundaki konumdur (metre; sol alttaki koordinat göstergesinden okunur). LOD için ağ adları `*_LOD0`, `*_LOD1`, `*_LOD2`; çarpışma için `UCX_*` adlı kutular kullanılır.

## Sınama durumu

Yükleme yolu koddan üretilmiş iki kemikli küçük bir sınama modeliyle doğrulandı: model yüklendi, her sakine ayrı iskelet verildi, `idle` ve `walk` klipleri oynadı, eksik klip `idle`'a düştü. Gerçek bir karakter modeliyle (çok kemikli, dokulu) henüz denenmedi.
