# Gaziantep 1918–1921 · Şehir ve Harita Altyapısı (Faz 1)

Tarayıcıda çalışan, birinci şahıs gezilebilir, boş şehir haritası. Three.js r160 (ES modülleri, yerel kopya `lib/`).
Çalıştırmak için: `python serve.py` → `http://localhost:8000`. (Düz `http.server` de çalışır ama tarayıcı .js dosyalarını önbelleğe alır; kod güncellenince eski ve yeni dosyalar karışıp oyun açılmayabilir. Öyle olursa Ctrl+F5.)
Test parametresi: `?q=auto|ultra|high|medium|low` (grafik kalitesi; varsayılan otomatik).

## Klasör yapısı
```
src/config.js                 Genel ayarlar (sınırlar, göz yüksekliği, tarih/saat, LOD mesafeleri)
src/core/MapCoordinates.js    enlem/boylam <-> yerel metre, çokgen yardımcıları, uzamsal indeks
src/core/GeoBuilder.js        birleştirilmiş geometri kurucu (duvar, kapak, kemer, kubbe, kırma çatı)
src/data/historicalReferences.js  KAYNAKLI yapı koordinatları + VARSAYIM kayıtları + plan oturtma
src/data/regions.js           9 tasarım bölgesi
src/world/Terrain.js          yükseklik alanı (kale höyüğü, hendek, rampa, Alleben vadisi), karışım malzemesi
src/world/Streets.js          sokak ağı + parsel üretimi (özyinelemeli blok bölme), ana akslar, şehir dışı yollar
src/world/Buildings.js        parsel -> yapı reçetesi; BASE (kütle) ve DETAIL (cephe) kurulumu
src/world/Landmarks.js        kale, camiler, hanlar, bedesten, arasta, kiliseler, kolej (parametrik), hastane, köprüler
src/world/Materials.js        prosedürel PBR dokular (albedo + normal + roughness)
src/world/Props.js            InstancedMesh eşyalar ve ağaçlar
src/world/Lighting.js         güneş konumu (37,07°K, tarih, saat), Sky, CSM gölgeler, IBL, sis
src/world/Collision.js        2B çarpışma (çokgen + daire)
src/world/WorldManager.js     sistemleri kurar, 100 m parça (chunk) bazlı LOD akışı, zemin yüksekliği
src/player/FirstPersonController.js  birinci şahıs, 1,65–1,75 m göz, 'viewmodel' bağlama noktası
src/render/PostFX.js          MSAA + GTAO + çıktı geçişi
src/render/AerialMap.js       harita ekranı için sahneden tepeden görüntü
src/ui/MapView.js             tam ekran harita + yuvarlak mini harita
```

## NPC sistemi (Faz 2 — pilot)
```
docs/karakter-katalogu.md     referans analizi + ilk 10 karakter (ONAY BEKLİYOR) + GLB şartnamesi
src/data/characters.js        arketipler K01–K10 (kıyafet, hareket ailesi; renkler varsayım)
src/npc/Mannequin.js          YER TUTUCU rigli manken + prosedürel klipler (nihai görsel değil)
src/npc/NavGraph.js           sokak segmentlerinden yaya yol ağı, çarpışmayla doğrulama, A*
src/npc/NpcManager.js         kadro, rol bazlı günlük akış, kaçınma, LOD, GLB yükleme
```
- Pilot: yalnız kahraman sokak çevresi (`CONFIG.npc.radius`), 40 sakin. Asker devriyeleri `CONFIG.npc.military` ile açılır (varsayılan kapalı).
- Gerçek modeller: `models/characters/Kxx_*.glb` dosyası konunca o karakter yer tutucu yerine GLB ile çizilir (adlar `models/manifest.json` içinde hazır; şartlar `models/README.md`).
- Konuşma: `src/data/dialogue.js` (yazılı balonlar, seslendirme yok). Karşılaşan sakinler sohbet eder, esnaf seslenir, oyuncu `E` ile konuşur.
- LOD: < 45 m tam animasyon + gölge · < 95 m seyrek animasyon · < 210 m InstancedMesh siluet.

## Uyarlanabilir grafik (src/render/Quality.js)
- Kademeler: Ultra / Yüksek / Orta / Düşük. Her kademe iç çözünürlük, MSAA, GTAO, gölge menzili ve haritası, detay ve çizim mesafesi, NPC yoğunluğunu birlikte ayarlar.
- Varsayılan `Otomatik`: 2 sn'lik pencerelerle kare hızı ölçülür; 30 fps altında önce iç çözünürlük (%85, %70), sonra kademe düşer; 52 fps üstünde kontrollü geri çıkar.
- Elle seçim: Ayarlar menüsü ya da `?q=auto|ultra|high|medium|low`.
- WebGL bağlamı kaybolursa döngü durur, geri gelince bir alt kademede devam eder.
- Oyun hafif kademede başlar (tümleşik ekran kartında Düşük, diğerlerinde Orta) ve makine kaldırıyorsa yükselir; ilk 12 saniyede kare hızı düşükse 1 saniyede tepki verir.
- Düşük ve Orta kademede gölge haritaları her 3 / 2 karede bir güncellenir, parallax (POM) ve sokak fenerleri kapanır. Arazi 150 karoya bölünmüştür; kamera dışındaki karolar çizilmez.

## Dış dokular (textures/)
- `textures/<set>/color.jpg · normal.jpg · roughness.jpg · ao.jpg` konursa o set prosedürel dokunun yerine geçer (`Materials.loadExternal`). Liste ve ölçek ayarı: `textures/README.md`.
- Dosya yoksa prosedürel doku kullanılır. Kahraman sokak kendi dokularını kullanır, etkilenmez.

## Yayın (Railway)
- Adres: https://oyun-production-2ead5cdf.up.railway.app — proje `gaziantep-1918-1921`, servis `oyun`.
- Güncelleme: bu klasörde `railway up --ci -y --service oyun`.
- `Dockerfile` + `serve.py` ile çalışır; `docs/` ve yerel araç dosyaları yayına gitmez (`.dockerignore`, `.railwayignore`).
- **Mobil engeli:** telefon ve tablette oyun yüklenmez, "bilgisayardan açın" ekranı çıkar (`index.html` sonundaki betik). Sınama için adresin sonuna `?zorla=1`.

## Hikâye
- **Sahne veri tabanı:** `src/data/scenes.js` — 14 bölüm, 41 sahne; her sahnenin tarihi, mekânı, rolü, oynanış türü, hedefleri, diyalog taslağı, kaynağı, güven düzeyi ve oyundaki durumu.
- **Tek kaynak:** `docs/hikaye-ana-dosya.md` (Story Bible): kronoloji, prolog, dört tarihî hikâye, 11 bölüm, karakter sistemi, tasarım kuralları, açık sorular. Hikâyeyle ilgili her değişiklik önce orada yapılır.

## Kronoloji ve dönemler (src/data/chronology.js)
- Oyun 30 Ekim 1918'de başlar. Günlük [J] panelindeki kronolojiden başka bir güne geçilir; tarih yazıları, güneş ve sokaktaki işgal kuvveti tarihe göre değişir.
- Her olay ve teşkilat bilgisi `verified | disputed | unverified` etiketi taşır; kaynaklar dosyanın başında.

## Görevler (src/game/Prolog.js, src/game/Story.js)
- **Prolog (Görev 0.1–0.5):** oyun 17 Aralık 1918'de açılır; bölümler tarihe bağlıdır (17 Aralık 1918, 25 Ekim 1919, 23 Kasım 1919) ve bitince tarih ilerler. Günlük'ten o güne geçmek bölümü açar.
- **Bölüm 1 (Nisan 1920):** `src/game/Bolum1.js`; Günlük'te "Şehir içi direnişin başlaması" gününe geçince başlar. Yeni bölümler `prolog.addChapter(...)` ile aynı motora eklenir.
- **Bölüm 2 (Mayıs 1920):** `src/game/Bolum2.js`; "Karayılan'ın şehadeti ve ağır bombardıman" gününde başlar. Çatışma `src/game/Combat.js` ile çalışır: sol tık ateş, sağ tık nişan, `R` doldur, `C` çömel.
- **Bölüm 3 (Haziran 1920):** `src/game/Bolum3.js`; "Kısa süreli ateşkes" gününde başlar.
- **Kişiler:** her sakinin adı, mesleği ve cemaati vardır (`src/data/people.js`); konuşulanlar Günlük'teki Tanıdıklar defterine yazılır. Görev sırasında sıradan sakinler hedefe yol tarif eder (`src/game/hints.js`).
- "Gizli Toplantı" bölümü Günlük'te Heyet-i Merkeziye gününe (Kasım 1919) geçince başlar: esnaftan haber al, gözcüye parolayı söyle, bahçedeki toplantıyı dinle, yedi komisyona yardım et.
- Tarihî dayanak chronology.js'te; kişiler, konuşmalar, parola ve görev ayrıntıları kurgudur (dosyanın başında belirtilir). İlerleme kaydedilmez.

## Tarihsel doğruluk kuralı
`historicalReferences.js` içinde her kayıt `status: 'verified' | 'assumption'` taşır. Haritada doğrulanmışlar dolu,
varsayımlar kesikli/italik çizilir. Yeni bilgi geldiğinde yalnızca bu dosyalar güncellenir; geometri yeniden üretilir.

## LOD
- LOD0 (< 190 m): cephe detayları, kapılar, pencereler, cumbalar, tenteler, ayrıntılı ağaçlar (zaman bütçeli inşa)
- LOD1 (her mesafe): yapı kütleleri, damlar, kiremit çatılar, basit ağaç taçları
- Frustum culling: her parça kendi sınır küresine sahip; CSM gölgeleri 750 m ile sınırlı.
