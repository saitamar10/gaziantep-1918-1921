# Tarihî şehir planı — batı mahalleleri (genişletme: 20 Kasım 2026)

## Amaç
"CS haritası" görüntüsünün kaynağı: `antep/src/world/Streets.js` şehri düz çizgilerle özyinelemeli böler (BSP). Bunun yerine
1919–1920 planından çıkarılan sokak ağı kullanılır. Deneme mahallesi (Şeyh Camii – Kozanlı Camii – Vartanyan Okulu) kullanıcı
tarafından onaylandı (20 Kasım 2026); ardından planın kapsadığı bütün yoğun batı yerleşimine genişletildi.

## Kaynak
`docs/harita/houshamadyan_ayntab_plan_1919-1920.jpg` — Houshamadyan yeniden kurulum planı, yalnız batı mahalleleri, yalnız referans
(oyunda gösterilmez). Bugünkü OSM verisi sokak ağı için KULLANILMADI. Sabit nokta koordinatları: Kültür Envanteri
(kulturenvanteri.com), oyundaki yer işaretleriyle (historicalReferences.js) aynı kaynak.

## Kapsam
Bölge (plan pikseli): Akyol/Kırkayak (kuzeybatı) – Çınarlı, Naum Khayat, Su Burcu (kuzey) – Nersesyan, Transversal, Balıklı
(doğu, plan kenarı) – Paşa Sokağı'nın hemen altı (güney) – Beyazın Oğlu Hanı, Sahag-Mesrop Okulu (batı).
Dünyada x −1211..−101, z 245..1076 (~1.1 × 0.83 km). Bölge dışı: aşağıya bakınız (organikleştirilmiş üretim, TAHMİN).

## Hizalama (godot/tools/tarihi_hizala.py)
Tek benzerlik dönüşümü kuzeyde 20–46 m sapıyordu (plan şematik çizim). Yeni model:
1. 14 sabit noktayla en küçük kareler benzerlik dönüşümü (ölçek 1.78 m/piksel, dönme −2.1°),
2. üstüne YEREL düzeltme: her noktadaki artık Gauss çekirdekli (σ = 70 piksel ≈ 125 m, λ = 0.01) bir alanla dağıtılır.
Sabit noktalarda plan oyundaki yapıya ≤ 4.5 m oturur; noktalardan uzaklaştıkça benzerlik dönüşümüne döner. Katlanma yok
(alan oranı 0.70–1.48).

| Sabit nokta (plan no.) | Güven | Yalnız benzerlik | Yerel düzeltmeyle |
|---|---|---|---|
| Meryem Ana Kilisesi (37) = Kurtuluş Camii | kesin | 6 m | ≤ 4.5 m |
| Kozanlı Camii (50) | kesin | 31 m | ≤ 4.5 m |
| Şeyh Camii (51) ≈ Şahveli (Yukarı Şeyh) Camii | **olası** | 20 m | ≤ 4.5 m |
| Çınarlı Camii (15) | kesin | 41 m | ≤ 4.5 m |
| Vartanyan Okulu (38) | kesin | 7 m | ≤ 4.5 m |
| Protestanların İkinci Kilisesi (40) | kesin | 21 m | ≤ 4.5 m |
| Protestanların Birinci Kilisesi (21) | kesin | 7 m | ≤ 4.5 m |
| İbn Eyüp Camii (43) = Eyüpoğlu Camii | kesin | 41 m | ≤ 4.5 m |
| Anglikan Kilisesi (46) | kesin | 22 m | ≤ 4.5 m |
| Nersesyan Okulu (24) | kesin | 46 m | ≤ 4.5 m |
| Hallacyan Yetimhanesi (36) | kesin | 19 m | ≤ 4.5 m |
| Beyazın Oğlu Hanı (31) = Bayaz Han | **olası** | 15 m | ≤ 4.5 m |
| Latin Manastırı (7) ≈ Kendirli Kilisesi (oyundaki yer işareti) | **varsayım** | 14 m | ≤ 4.5 m |
| Amerikan Hastanesi (30) = oyundaki hastane yer işareti | **varsayım** | 13 m | ≤ 4.5 m |

Kullanılmayan: Kültür Envanteri'ndeki "Amerikan Kız Koleji" (plan 35) planla 500 m'den fazla çelişiyor (bugünkü bina başka yerde).
**Belirsizlik:** birini dışarıda bırakma sınaması ortalama 28 m. Sabit noktaların ARASINDA kalan sokaklar 20–30 m kayık olabilir
(plan ölçekli bir ölçüm değil, yeniden kurulum çizimi).

## Çıkarma ve doku (godot/tools/tarihi_doku.py, tarihi_mahalle.py)
- Plan pikseli 470–1115 × 110–578; sokak bandı maskesi → inceltme → düğüm/kenar grafiği → yazı yüzünden kopan uçlar bağlandı.
  Yeni: dolu gri/mor lekeler (yapı dolguları, Çukur Bostan) 4×4 açılmayla ayıklanıyor (önceki sahte kısa sokakların kaynağı).
- **Plandan (hist=1):** sokak orta çizgileri, kavşaklar.
- **TAHMİN:**
  - sokak genişlikleri (plan kalınlığı ölçekli değil: geniş çizilen 5 m, ara sokak 3.4 m, kısa çıkmaz 2.4 m),
  - çıkmazlar (hist=3, 2.2–2.6 m): adaların dış ve iç kenarından 34–52 m'de bir, 22–60 m (plan iç yolları göstermiyor),
  - kopuk bağlantılar (hist=4, 2.6 m): plandaki yazı/simgeler sokakları kestiği için ağ ağaç gibi kalıyordu; (1) boşta kalan
    uç kendi doğrultusunda ≤ 22 m uzatıldı, (2) iç bileşenler köprüyle bağlandı (≤ 120 m), (3–4) ağ üzerinden 2–3 kat
    dolanılan yerlere ≤ 70 m'lik, 25 m üstünde hafif kırık kısa yollar açıldı. Toplam 181 bağlantı,
  - bölge kenarı halka sokağı (hist=2, 4 m, kenardan 1.4 m içeride): dış dokuya bağlantı,
  - parsel bölümü (cepheye dik, 15–19 m derinlik, cephe aralığı 12–18 m; avlulu ev), ada içi bahçeler.
- Sonuç: 3889 parsel (ortalama 146 m²), 480 bahçe parseli, 302 çıkmaz, 2184 sokak parçası.
- Yer işareti (cami/kilise) alanının ortasından geçen plan sokağı parçası Streets.js'te atılır.

## Plan dışı mahalleler (doğu, kale çevresi, güney) — TAHMİN
Bu kesimler için 1918 sokak planı kaynağı yok. Özyinelemeli bölme korunuyor, ama düz bölme çizgileri yumuşak bir gürültü
alanıyla bükülüyor (`organicWarp`, dalga boyu ~160 m, genlik ~9 m). Sokaklar 9 m'lik parçalara bölünüp bükülür; parsel ve ada
köşeleri aynı alanla taşınır, böylece parseller sokağa oturmaya devam eder. Bu bir görünüm düzeltmesidir, tarihî iddia değildir.

## Ortak veri
`antep/src/data/tarihiMahalle.js` → `Streets.js` bölge (içbükey çokgen) içindeki üretilmiş parsel, sokak ve aksları atar,
bunları koyar. Harita, küçük harita, NPC yol ağı (nav.json) ve görev rotaları (toplantı bahçesi, han, cami, meydan) aynı
`layout.segments` verisinden beslenir (bake_city.mjs).

## Yol ağı sınaması (pişirmeden önce, NavGraph + çarpışma, aynı pişirme kodu)
| Ölçü | Eski (deneme mahallesi) | Yeni |
|---|---|---|
| Kahraman sokağından test sokağına rota | 1240 m | 1274 m |
| Bölge içi rastgele çiftler, ağ/düz oranı (ortanca, %90) | 1.25 / 1.50 | 1.41 / 1.88 |
| Rota bulunan sabit nokta (8 sınandı) | 8 | 8 |
Organik dokuda biraz daha fazla dolanma beklenir. Bilinen engel: test sokağı kitindeki el arabası çarpışması (0.9 m daire) dar plan
sokaklarında yaya ağını kesebiliyor — görsel revizyon oturumuna bildirildi.

## Pişirme (20 Kasım 2026, 22:32)
`bake_city.mjs` 1 dk 19 sn: 11.886 parsel (önce 10.785, +%10), city.bin 1,24 GB; `import_city.gd` IMPORT_OK (1.573 kaynak, 35 sn);
city.bin silindi. Yol ağı 14.656 düğüm. Oyun 6 noktada `--bench` ile hatasız açıldı (kalite düşük, Compatibility, 21–53 fps).
- Birinci şahıs kareleri: `godot/_out/doku2/fp/` (a Meryem Ana yakını, b Kozanlı yakını, c test sokağı, d Şeyh yakını,
  e doğu organikleştirilmiş doku, f bölge sınırı) ve hepsi bir arada `godot/_out/doku2/fp_pano.png`.
- Aynı noktalar üstten: `godot/_out/doku2/ust_sehir_noktalar.png`; plan/eski/yeni: `godot/_out/doku2/karsilastirma_ust.png`.
- Not: bu pişirmede test sokağı kiti eski noktada (-709,799) kaldı; görsel revizyon oturumu TEST_SOKAK'ı (-700.4, 775.9) yaptı,
  kendi pişirmesiyle güncelleyecek.

## Blender
`blender/tarihi_mahalleler.blend` — katmanlar: 0_Plan (yerel düzeltmeyle bükülmüş görüntü ızgarası), 1_Sokaklar (plan / çıkmaz /
halka / kopuk bağlantı), 2_Parseller, 3_Bahceler, 4_Meydanlar, 5_Sabit_noktalar, 9_Eski_Uretim. Üstten görüntüler `godot/_out/doku2/`.
Deneme mahallesi dosyası (`blender/tarihi_mahalle_deneme.blend`, `godot/_out/doku/`) kayıt olarak duruyor.

## Bilinen eksikler
- Sabit noktalar arası belirsizlik 20–30 m (yukarıda).
- Kopuk bağlantılar ve çıkmazlar tahmin; plan iç yolları göstermiyor.
- Arazi eğimi plandan gelmiyor; mevcut arazi modeli kullanılıyor.
- Plan dışı mahalleler hâlâ üretim (organikleştirilmiş); kaynak bulunursa aynı hatla eklenebilir.

## Yeniden üretmek
```
python -I godot/tools/tarihi_doku.py godot/docs/harita/houshamadyan_ayntab_plan_1919-1920.jpg 470,110,1115,578 godot/_out/doku2
python -I godot/tools/tarihi_hizala.py godot/_out/doku2/doku_px.json godot/_out/doku2/doku_xz.json
python -I godot/tools/tarihi_mahalle.py godot/_out/doku2/doku_xz.json antep/src/data/tarihiMahalle.js godot/_out/doku2/mahalle_ust.png
```
Yedekler: `yedek/sehirplani_once_20261120.zip` (deneme öncesi), `yedek/sehirplani_genisletme_once_20261120.zip` (genişletme öncesi:
antep/src, godot/tools, pişirilmiş godot/city).
