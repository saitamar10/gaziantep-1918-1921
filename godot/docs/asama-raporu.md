# Grafik ve dünya geliştirme yol haritası — aşama raporları

Yol haritası 16 aşamadır (kullanıcının 18 Kasım 2026 tarihli yönergesi). Her aşama: yedek → uygulama → çalıştırma →
hata denetimi → ölçüm → ekran görüntüsü → rapor. Ölçümler `tools/olcum.py` ile dokuz sabit kamera konumundan alınır;
ham değerler `olcum/olcum.csv`, görüntüler `olcum/<etiket>/` altındadır. Yedekler `../yedek/` klasöründedir.

## Aşama 0 — Proje analizi ve yedek (tamamlandı)

| Konu | Durum |
|---|---|
| Godot sürümü | 4.7.2 stable |
| Çizim yöntemi | Compatibility (OpenGL 3.3). Forward+ (Vulkan) bu dizüstünde ~10 fps verdiği için varsayılan değil; `Oyunu-Baslat-Yuksek.bat` onu açar |
| Sahneler | Tek sahne: `world.tscn`; her şey koddan kurulur (`scripts/world.gd`) |
| GLB modelleri | **Yok.** Şehir, web sürümünün üreticisinden pişirilmiş ağlardır (`city/`, 790 kaynak); karakterler koddan çizilen yer tutucu figürlerdir |
| PBR doku setleri | 15 set (Poly Haven, CC0, 1K): stone, stone2, rubble, basalt, cobble, dirt, planks, wood, tiles, flat, fabric, sack, iron, grass, field |
| Gölgelendiriciler | Arazi karışımı (`city.gd`), gökyüzü ve bulut (`world.gd`); diğer her şey StandardMaterial3D |
| Kamera | Birinci şahıs, `scripts/player.gd` (CharacterBody3D + 2B şehir çarpışması) |
| Hikâye bağlantıları | `scripts/game.gd` (21 bölüm), `npcs.gd`, `combat.gd`, `menu.gd`, `map.gd`. Otomatik sınama: `--autoplay` → `ALL_DONE` |
| Yedek | `yedek/godot_asama0_20261118_2130.zip` (292 dosya, 54 MB) |

**Başlangıç ölçümü** (DÜŞÜK ayar, 1280×720): tabloda "Aşama 0" sütunu.

## Aşama 1 — Tüm şehirde gerçek doku sistemi (tamamlandı)

**Yapılanlar**
- Çarşı sokağı: taş cepheler, bazalt kuşaklar ve döşeme artık şehrin geri kalanıyla **aynı** gerçek doku setlerini kullanıyor
  (dünya ekseninde üç yönden kaplama). Ahşap kapılar, kepenkler, tente kumaşı, demir parmaklık ve cam sokağa özgü dokularında bırakıldı.
- Bahçe duvarları evlerden ayrıldı: yeni `rubble` yüzeyi, moloz taş duvar dokusu (`rustic_stone_wall_02`).
- Tenteler: gerçek dokuma kumaş (`rough_linen`), üç boya tonu. Demir işleri: paslı demir (`rusty_metal_02`). Çuvallar: çuval bezi (`hessian_380`).
- Arazi: ot (`sparse_grass`) ve tarla (`dry_mud_field_001`) gerçek dokuya bağlandı.
- Kale, hanlar, camiler ve kırsal yapılar aynı setleri kullandığı için kendiliğinden güncellendi.
- Yeni araçlar: `tools/doku_indir.py`, `tools/doku_ayar.py`, `tools/fill_dokular.gd`, `tools/yedek.py`, `tools/olcum.py`.

**Yönergedeki bölge adları hakkında:** Akyol, İncirlipınar, Balıklı, Kırkayak, Çınarlı, Tabakhane ve Çukur Bostan haritada ayrı
adlandırılmış bölgeler DEĞİLDİR; şehir tek bir üretilmiş dokudur ve malzemeler her yere birlikte uygulanır. Bu mahallelerin
gerçek yerleri ve sınırları doğrulanmadı (Aşama 16'nın işi).

**Sınırlar**
- "Taş merdiven" için ayrı yüzey yok; merdivenler duvar taşıyla kaplı.
- Çarşı sokağının bahçe duvarı da kesme taşa döndü (önceki moloz örgüsü sokağa özgü dokudaydı).
- Çarşı sokağında taş blokları şehrin geri kalanından iri görünüyor (aynı doku, farklı kaplama yöntemi).

**Güncellenen dosyalar:** `scripts/city.gd`, `scripts/street.gd`, `scripts/world.gd`, `scripts/texture_set.gd`,
`tools/import_hero.gd`, `tools/import_city.gd`, `tools/bake_city.mjs`, `tools/make_grafik.gd`, `dokular/*`, `city/*`, `hero/*`.

**Ölçüm** (DÜŞÜK ayar, 1280×720, ortalama / en düşük fps)

| Bölge | Aşama 0 | Aşama 1 | Çizim çağrısı | Üçgen |
|---|---|---|---|---|
| 01 Kale önü | 35 / 15 | 45 / 22 | 414 | 281 bin |
| 02 Kale girişi | 48 / 31 | 49 / 30 | 376 | 230 bin |
| 03 Kale çevresi | 31 / 13 | 38 / 20 | 606 | 342 bin |
| 04 Tarihî çarşı | 33 / 15 | 27–32 / 11–16 (dört ölçüm) | 786 | 713 bin |
| 05 Dar mahalle sokağı | 34 / 16 | 37 / 18 | 572 | 502 bin |
| 06 Antep evi avlusu | 37 / 18 | 35 / 14 | 640 | 515 bin |
| 08 Cami çevresi | 35 / 19 | 31 / 14 | 718 | 769 bin |
| 09 Kırsal yol | 51 / 19 | 59 / 36 | 98 | 41 bin |
| 10 Kalabalık meydan | 33 / 16 | 27 / 11 | 938 | 674 bin |

Doku belleği 62 MB → 54 MB, bellek 81–98 MB, açılış 3–5 sn. Ölçümler sırasında işlemci başka programlar yüzünden
%35–65 yüklüydü; aynı sahne ölçümden ölçüme ±5 fps oynuyor. Bu yüzden "çarşı ve meydan birkaç kare düştü" de,
"düşmedi" de kesin söylenemez; iki aşama aynı aralıkta kabul edildi. 07 Büyük konak: haritada henüz ayrı bir konak yok.

Hikâye: 21 bölümün tamamı otomatik sınamadan hatasız geçti.

## Aşama 2 — Malzeme derinliği ve gerçekçi yüzeyler (tamamlandı, kısmi)

**Yapılanlar**
- Yeni "yaşanmış taş yüzey" gölgelendiricisi (`scripts/city.gd`, SURFACE_SHADER): duvar, bazalt, moloz duvar ve damlarda
  doku tekrarını kıran iri ton lekeleri, sıcak/soğuk renk kayması, saçak altından inen nem ve kir izleri, yatay yüzeylerde
  toz, pürüz farkı. Dünya koordinatında çalışır: aynı leke iki evde tekrar etmez.
- Zemin: kaldırım taşlarının koyu derzlerine toprak dolar; iri kir lekeleri.
- Ayarlar `grafik/yuzey.tres` dosyasında (SurfaceLook): leke gücü ve boyutu, nem izi, toz, derz dolgusu.
- Kalite profiline bağlı: `surface_detail` ORTA, YÜKSEK ve ULTRA'da açık; **DÜŞÜK'te kapalı** (düşük ayarın kodu Aşama 1 ile aynı).
- Düzeltilen hata: kar kalkınca damların rengi doku setinin renk dengesini kaybediyordu.
- Ölçüm konumu düzeltildi: "dar mahalle sokağı" bir duvarın dibine bakıyordu; yol ağı düğümüne ve sokak boyunca bakışa alındı.

**Yönergeden yapılmayanlar ve nedeni**
- *Decal sistemi:* Godot'nun Decal düğümü Compatibility yönteminde çalışmaz; lekeler gölgelendiricide üretildi.
- *Height mapping (derinlik yanılsaması):* yükseklik dokuları indirilmedi; tümleşik kartta pahalıdır. YÜKSEK profil için eklenebilir.
- *Çatlaklar, kırık taşlar, aşınmış köşeler:* bunlar dokunun kendisinden geliyor; ayrıca geometriyle işlenmedi.
- *Triplanar:* yalnız çarşı sokağında ve kumaş/demir/çuvalda kullanılıyor; şehir duvarlarının UV'si düzgün olduğu için gerekmedi.
- Çarşı sokağının yüzeyleri bu gölgelendiriciyi kullanmıyor (kendi malzemeleri).

**Güncellenen dosyalar:** `scripts/city.gd`, `scripts/game.gd`, `scripts/graphics_profile.gd`, `scripts/surface_look.gd` (yeni),
`tools/make_grafik.gd`, `tools/olcum.py`, `grafik/orta.tres`, `yuksek.tres`, `ultra.tres`, `grafik/yuzey.tres` (yeni).

**Ölçüm** (1280×720, ortalama / en düşük fps)

| Bölge | DÜŞÜK (Aşama 2) | ORTA (Aşama 2) |
|---|---|---|
| 01 Kale önü | 28 / 10 | 54 / 29 |
| 02 Kale girişi | 24 / 8 | 57 / 22 |
| 03 Kale çevresi | 31 / 10 | 47 / 20 |
| 04 Tarihî çarşı | 28 / 15 | 40 / 19 |
| 05 Dar mahalle sokağı | 33 / 21 | 36 / 12 |
| 06 Antep evi avlusu | 33 / 23 | 42 / 18 |
| 08 Cami çevresi | 31 / 23 | 27 / 10 |
| 09 Kırsal yol | 60 / 54 | 58 / 25 |
| 10 Kalabalık meydan | 40 / 12 | 38 / 11 |

**Bu tablo güvenilir değil ve öyle okunmalı:** daha ağır olan ORTA ayar, DÜŞÜK'ten hızlı çıktı; bu yalnızca iki ölçüm
turu arasında bilgisayardaki yükün değişmesiyle açıklanabilir. DÜŞÜK ayarın bu aşamada değişen tek yanı zemin
gölgelendiricisine eklenen ve kapalıyken etkisiz kalan birkaç satırdır. Aynı anda yapılan karşılaştırma: ORTA'da iki noktada
öncesi 22–27 fps, sonrası 25–32 fps. Doku belleği DÜŞÜK 52 MB, ORTA 63 MB. Hikâye: 21 bölüm hatasız.

**Görsel not (Aşama 7'ye):** öğleden sonra ışığında taş fazla turuncuya kaçıyor; yönerge "aşırı sarı/turuncu filtre" istemiyor.
Işık ve renk dengesi Aşama 7'de ele alınacak.

## Kritik düzeltme — gökyüzü, yaşayan şehir, tarihî sonuçlar (18 Kasım 2026, ikinci yönerge)

Geri dönüş noktası: `yedek/godot_kritik_once_…zip`, sonrası `godot_kritik_…zip`.

**1–2. Gökyüzü, ışık, atmosfer**
- Gökyüzü gölgelendiricisi yeniden yazıldı (`world.gd`): ufukta kalın pus bandı, yüksek ince bulut katmanı, güneşe bakan
  kenarı aydınlık ve tabanı gölgeli kümülüs katmanı, güneş hâlesi, iki katmanlı uzak dağ silueti.
- Uzak pus mesafeye bağlı hale geldi (yakın net, uzak yapılar ufuk rengine bürünür); `haze`, `fog_begin`, `fog_end` ayarlanır.
- Sekiz hava/saat profili (`grafik/`): sabah, ogle, gunduz, gunbatimi, bulutlu, tozlu, gece, kis. Her bölüm kendi profiliyle
  açılır (`game.gd` HAVA tablosu); bazı adımlar havayı değiştirir (işgal günü bulutlanır, 25 Aralık 1921 sabahı).
- Sarı/turuncu patlama giderildi: güneş rengi nötre çekildi, gölgeler gökten gelen hafif soğuk ışıkla doluyor, doygunluk 1,0.
- YAPILMADI: gerçek hacimli (ışın yürüten) bulutlar ve fiziksel saçılma; tümleşik kart için çok pahalı. Ortam kapatması ve
  seken ışık yalnız Forward+ profillerinde.

**3. "Boş harita" hissi (kısmen)**
- Ufuk artık keskin bitmiyor: dağ silueti + mesafe pusu. Şehir silueti, yükseklik farkları ve minareler zaten vardı.
- YAPILMADI: boş meydanların doldurulması, şehir kenarının araziye bağlanması, kayalık yamaçlar. Bunlar yol haritasının
  Aşama 3 ve 5'ine ait geometri işleri.

**4–5. Nüfus yöneticisi** (`npcs.gd`, profiller `game.gd` NUFUS tablosu)
- Oyuncunun çevresinde: dolaşanlar, sohbet eden duran ikililer (sırayla konuşurlar), kuşatmada silahlı nöbetçi ikilileri,
  duvar dibinde oturanlar, işgal dönemlerinde İngiliz / Fransız devriyeleri. Uzakta kalanlar oyuncunun yakınına yeniden yerleşir.
- Yoğunluk bölüme göre değişir (1918 tam; kuşatmada azalır, nöbetçi artar; açlık aylarında sokak seyrek, oturan çok).
  Çatışma sürerken siviller saklanır. Boş bırakılan yerlerin gerekçesi tabloda `neden` olarak yazılı.
- Acar köyüne köylüler eklendi.
- YAPILMADI: hayvanlar, at arabaları, doktor figürü (model yok); dükkân açma, kahvehane, su taşıma gibi saatli rutinler
  (şu an: yürüme, durma, sohbet, oturma, nöbet). Mahalle bazlı ayrı profil yok: harita mahallelere bölünmüş değil.

**6–7. Tarihî dünya durumu** (`combat.gd` "endless", `game.gd` SABIT tablosu)
- Tarihte kaybedilen ya da geri çekilmeyle biten çatışmalarda düşman TÜKENMEZ: vurulanın yerine yenisi gelir, dalgalar büyür,
  isabet zamanla artar. Süre dolunca "ÇEKİLME EMRİ" kartı çıkar; düşman siperlerinden çıkıp ilerler ve çatışma, oyuncu geri
  çekilme hedefine varana kadar sürer. Oyuncu vurulursa sonuç değişmez: arkadaşları onu ateş altından çeker.
- Bu kipteki çatışmalar: Karabıyıklı, Elmalı Köprüsü, Sarımsak Tepe ikinci hücum, Çınarlı (iki siper), huruç.
- Kazanılabilir bırakılanlar (taktik başarı): Kertil pususu (yol o gün tutuldu), Sarımsak Tepe ilk hücum, gece nöbeti (kurgu).
- Görev metinleri "düşmanı yen" yerine "dayan / hattı tut / çekil" olarak değişti. Günlükte her günün altında
  "Değişmeyen tarihî sonuç" satırı var.

**9. Sekiz sahne** (DÜŞÜK ayar, 1280×720; görüntüler `olcum/kritik/`)

| Sahne | Ortalama / en düşük fps | Çizim çağrısı | Üçgen |
|---|---|---|---|
| 1918 hareketli çarşı | 43 / 15 | 827 | 736 bin |
| 1919 İngiliz işgali | 44 / 14 | 804 | 636 bin |
| 1919 Fransız kontrol noktası | 52 / 21 | 776 | 633 bin |
| 1920 çatışma mahallesi | 45 / 12 | 700 | 507 bin |
| Sağlık yeri, yaralı tedavisi | 14 / 7 | 850 | 570 bin |
| 1920 bombardıman altında sokak | 21 / 8 | 846 | 701 bin |
| Ocak 1921 açlık | 39 / 13 | 843 | 697 bin |
| Şubat 1921 teslim sonrası | 38 / 12 | 864 | 761 bin |

"Bekirbey Camii yaralı tedavi sahnesi" haritada yoktur (caminin yeri ve sağlık yeri olarak kullanımı doğrulanmadı); yerine
bahçedeki sağlık yeri sahnesi ölçüldü. Sağlık yeri ve bombardıman sahnelerindeki düşük değerlerin nedeni incelenmedi
(tek ölçüm; bu makinede ölçümler oynak). Çarşıda çizim çağrısı nüfus artışıyla 786 → 827 oldu.
Hikâye: 21 bölüm otomatik sınamadan hatasız geçti. Çatışmaların yeni kipi elle oynanmadı.

## Sokak genişletme ve navigasyon (18 Kasım 2026, üçüncü yönerge)

Geri dönüş noktası: `yedek/godot_sokak_once_…zip`, sonrası `godot_sokak_…zip`.

**Sokak genişlikleri** (`tools/bake_city.mjs`, GERI sabiti; şehir ve yol ağı yeniden üretildi)
- Parseller sokak cephesinden geri çekildi (konutta 0,55 m, çarşıda 0,4 m): her sokak yaklaşık 1 m genişledi; sokak dokusu,
  bağlantılar ve organik biçim aynı kaldı. 10.343 parselin 10.252'si geri çekildi (kalanı çok küçük olduğu için dokunulmadı).
- Önce → sonra (sokak parçası sayısı): 2,5 m 122 → yok · 3,0 m 396 → yok · 3,5 m 388 → 44 · 4,0 m 143 → 409 · 4,5 m → 411 ·
  5,0 m → 185 · ana akslar 5,5–8 m → 6,5–9 m. Yani en dar sokak artık 3,5 m.
- Ölçüler oyun tasarım ölçüsüdür, tarihî ölçüm değildir.
- YAPILMADI: 1,5–2,5 m'lik dar tarihî geçitler (hepsi genişledi; yalnız çarşı sokağındaki 3,6 m'lik kabaltı dar kaldı),
  köşelerde ayrıca dönüş alanı, yeni küçük meydanlar (mevcut meydanlar duruyor), at arabası güzergâhı ayrımı.

**Mini harita** (`scripts/map.gd`): sağ üstte, oyuncuya göre döner (Ayarlar: "Mini harita: kuzey yukarıda"); görev hedefi,
yol ağını izleyen renkli rota, alt şeritte kalan yol (m), yakın anıtlar, dönen kuzey işareti.

**Rota** (`game.gd` route_between / _route): mevcut yol ağı üzerinde A*; 1,5 sn'de bir ve hedef değişince yeniden hesaplanır
(oyuncu saparsa kendiliğinden yenilenir). Öncelik: oyuncunun işareti → görev hedefi → dükkâna dönüş yolu (mavi).
Yol ağı olmayan kırsalda: şehir kenarına kadar sokaklardan, sonrası düz çizgi.

**Tam ekran harita (M)**: fare tekeri yakınlaştırır, sürükleyerek kaydırılır, tık hedef işareti koyar, sağ tık kaldırır;
anıt adları, hikâye yerleri (kırsal olanlar "varsayım" etiketiyle), çatışma noktaları, şehir + kırsal tek haritada.
Mini harita ile aynı veriyi ve aynı rotayı kullanır.

**Rota sınaması** (`--routetest`)

| Senaryo | Yol | Kuş uçuşu | Yapıyı kesen parça |
|---|---|---|---|
| Kale'den çarşıya | 206 m | 172 m | 0 |
| Çarşıdan camiye (Alaüddevle) | 79 m | 69 m | 0 |
| Şehir dışına (Acar köyü) | 2.249 m | 1.931 m | 1 |
| Sapma: başka sokaktan aynı hedefe | 174 m | 80 m | 0 |
| Dönüş: hedeften dükkâna | 249 m | 153 m | 0 |
| Haritadan seçilen hedef | 518 m | 467 m | 0 |

Şehir dışı rotasındaki tek kesişme, yol ağının bittiği yerden köye giden düz parçadadır. "Bekirbey Camii" haritada
olmadığı için ikinci senaryo Alaüddevle Camii ile yapıldı.

**Yapılmayanlar:** mahalle ve köy adları (doğrulanmış mahalle sınırı yok; yalnız anıtlar ve hikâye yerleri yazıyor),
yan görev işaretleri (yan görev yok), çok duraklı görevde bütün durakların aynı anda gösterimi (yalnız sıradaki durak),
alternatif güzergâh, haritada arazi yükseltisi ve tarım alanı dokusu. Büyük haritadaki fare etkileşimi (teker, sürükleme,
tık) gerçek fareyle denenmedi; yalnız görüntüsü alındı.

Hikâye: 21 bölüm yeni sokaklarla otomatik sınamadan hatasız geçti.

## Sokak genişletme hatasının düzeltilmesi ve kalan aşamalar (18 Kasım 2026, tek rapor)

**Düzeltilen hata (kullanıcı bildirdi):** ilk genişletme parselleri BÜTÜN kenarlarından küçültüyordu; bitişik evlerin arasında
~1 m boşluk açılmış, insanlar oraya yerleşmiş, üst kat kanatları ve çatılar gövdeden kopmuştu. Yeni yöntem yalnız SOKAĞA BAKAN
kenarları geri çeker (`tools/bake_city.mjs` geriCek); komşu parselle ortak kenarlara dokunulmaz. 10.343 parselin 9.078'inde
uygulandı; sivri köşeli ya da çok küçük parseller olduğu gibi bırakıldı. Sakin yerleştirme de sokağın dışına itilmeyi reddediyor.

**Aşama 3 — mimari (ilk adım, KISMİ):** yapı aileleri sayıldı ve yükseklikleri ayrıştırıldı: mütevazı tek katlı ev (860, alçak),
tek katlı ev (1.254), iki katlı ev (1.638), cumbalı ev (2.396), avlulu ev (883), büyük avlulu konak (1.319, yüksek tavan),
dükkân (898), bahçe (1.095). Saçak hizaları artık evden eve değişiyor. YAPILMADI: eyvanlı ev, hayat/gane/ocaklık/hazna gibi
iç düzen unsurları, yeni geometri aileleri (üretici kodunda yeni yapı tipleri yazmak gerekir), kamu/okul/sağlık yapılarının yeniden tasarımı.

**Aşama 12 — ses (KISMİ):** kuş sesleri (gündüz, kış ve çatışma dışında) ve kalabalığa göre açılıp kısılan sokak uğultusu eklendi;
anma sahnelerinde susar. Hepsi koddan üretilir. YAPILMADI: hayvan, zanaat, kapı sesleri; mekâna göre yankı; kayıt tabanlı sesler.

**Yapılmayan aşamalar ve nedeni**
- Aşama 4 (kale rekonstrüksiyonu): tarihî ölçülerle yeniden modelleme ayrı bir geometri işi; başlanmadı.
- Aşama 5 (arazi, kırsal yollar, köyler): başlanmadı; kırsal hâlâ düz arazi.
- Aşama 6 (dükkân içleri, han avluları): yalnız çarşı sokağında mevcut; şehrin geri kalanında yok.
- Aşama 8–9 (fotogerçekçi insanlar, animasyon): koddan üretilemez; model ve animasyon varlığı gerekir. Karakterler yer tutucu.
- Aşama 10 (hayvanlar, arabalar, saatli rutinler): model yok; rutinler yürüme/durma/sohbet/oturma/nöbet ile sınırlı.
- Aşama 11 (tarihe göre hasarlı yapılar): barikat, nüfus, hava ve kar tarihe göre değişiyor; hasarlı yapı ve bombardıman izi yok.
- Aşama 13 (sinematik kamera): yok; yalnız kartlar, kararma ve anma ekranları.
- Aşama 16 (tarihî denetim): kodda dayanak/kurgu/varsayım notları var; varlık başına kaynak bağlantısı tablosu yapılmadı.

**Son ölçüm** (DÜŞÜK ayar, 1280×720; bu ölçüm sırasında bilgisayar öncekilerden boştu)

| Bölge | Ortalama / en düşük fps | Çizim çağrısı | Üçgen |
|---|---|---|---|
| 01 Kale önü | 58 / 23 | 462 | 290 bin |
| 02 Kale girişi | 59 / 21 | 411 | 243 bin |
| 03 Kale çevresi | 54 / 16 | 645 | 349 bin |
| 04 Tarihî çarşı | 50 / 29 | 810 | 760 bin |
| 05 Dar mahalle sokağı | 47 / 14 | 635 | 475 bin |
| 06 Antep evi avlusu | 52 / 19 | 658 | 506 bin |
| 08 Cami çevresi | 50 / 20 | 745 | 780 bin |
| 09 Kırsal yol | 60 / 60 | 98 | 41 bin |
| 10 Kalabalık meydan | 38 / 12 | 924 | 661 bin |

Doku belleği 52–55 MB, açılış 2,3–3,1 sn. Hikâye: 21 bölüm hem ekransız kipte hem gerçek pencerede otomatik oynatıldı; pencerede
hata yok. Ekransız kipte ara sıra "wrong RID" hatası çıkıyor (sahte çizim sunucusuna özgü; pencerede tekrarlamadı).
Rota sınaması: altı senaryo, yalnız kırsal düz parçada 1 kesişme.

## Hazır model araması (18 Kasım 2026)

- **İnsanlar: bulunamadı.** 1900'ler Osmanlı / Antep kıyafetli (fes, şalvar, çarşaf), iskeletli ve serbest lisanslı (CC0) insan
  modeli aramada çıkmadı. Bulunan Osmanlı temalı modeller ücretli (CGTrader, Superhive) ve çoğu başka dönem (yeniçeri, padişah).
  Serbest lisanslı paketler (KayKit, Quaternius, Kenney) genel ve çizgi film biçemli; kullanıcının karakter paftasına uymaz.
  Bu yüzden hiçbir insan modeli indirilmedi; karakterler yer tutucu figür olarak kaldı.
- **Hayvanlar: indirildi.** Quaternius "Farm Animals" paketi (CC0; OpenGameArt, 7 MB). `modeller/hayvan/` altına at, inek, koyun
  (FBX, animasyonlu) ve lisans dosyası kondu. Eşek ve katır pakette yok; serbest lisanslı eşek modeli bulunamadı.
- **Oyuna bağlandı:** şehirde sokak kenarında bekleyen üç at (nüfus profiline bağlı; Aralık 1920'den sonra görünmez),
  Acar köyünde iki inek ve üç koyun. Bekleme animasyonu oynar; yürümez, yük taşımaz.
- **Sınırlar:** modeller sade, çizgi film biçemli; ineğin siyah-beyaz alacası döneme ve yöreye uygun bir ırk değildir. Yer tutucu
  olarak değerlendirilmeli. Kaynaklar: opengameart.org/content/lowpoly-animated-farm-animal-pack, quaternius.itch.io/lowpoly-animated-animals

## Sonraki aşamalar için dürüst öngörü
- **Koddan yapılabilir:** 2 (yüzey derinliği), 3 ve 4 (mimari aileler, kale; tarihî ölçülerle), 5 (arazi), 6 (dükkân içleri),
  7 (ışık ve hava), 11 (tarihe göre dünya), 12 (ses; kayıt indirilerek), 13–16.
- **Dışarıdan varlık gerekir:** 8 ve 9. Fotogerçekçi insan modelleri ve animasyonları koddan üretilemez; hazır model ya da
  bir üretim hattı gerekir. 10'daki hayvanlar ve arabalar için de model gerekir.
- **Donanım sınırı:** ortam kapatması, seken ışık ve hacimli sis yalnız Forward+ yönteminde çalışır; bu dizüstünde akıcı değildir.

## Aşama 4 — Kale rekonstrüksiyonu (19 Kasım 2026, ilk sürüm)

- Höyük tabanı 177 × 145 m, üst düzlük ~114 × 98 m (önce 236 × 208 m idi). 12 burç: dikdörtgen, beş köşeli ve yarım yuvarlak;
  genişlik 6–7 m, çıkıntı 3–4 m, yükseklik 7,5–10 m. Sur 6,4 m; üç kesimde alçalmış/yıkık (yeri VARSAYIM). Kapı güneyde (VARSAYIM),
  batı payandasının üstü yıkık. Rampa yeni höyüğe göre yeniden çizildi. Dosyalar: `antep/src/world/Terrain.js`, `Landmarks.js`, `Streets.js`.
- Kale küçülünce çevresinde açılan halkaya üretici kendiliğinden yeni parseller yerleştirdi (10.343 → 10.452 parsel).
- EKSİK: yamaç tek renk toprak; "kayalık" yalnız saçılmış küp biçimli taşlardan ibaret (kaya dokusu ve gerçek kaya geometrisi yok).
  F.W. Peers fotoğraflarıyla karşılaştırma yapılmadı; burç biçimlerinin sırası ve yıkık kesimler fotoğrafa değil varsayıma dayanıyor.
- Ölçüm (ORTA, 1280×720): kale çevresinde 35–41 fps. Hikâye: 21 bölüm otomatik sınamadan hatasız. Görüntüler `olcum/kale/`.

## Aşama 4 (devam), 5 ve 11 — yamaç, kırsal arazi, tarihe bağlı hasar (19 Kasım 2026)

**Kale yamacı:** eğime göre kaya dokusu (Poly Haven `rock_06`, CC0; `dokular/rock`), yamaçta 3 m'ye varan sekiler, küplerin yerine
üç kalıptan ~400 kaya (`city.gd` `_rocks`, `_boulder`). Ufuk düzlüğü arazinin dışına alındı (hendekte düz şerit görünüyordu).

**Aşama 5 — kırsal (ilk sürüm; HEPSİ TEMSİLÎ/VARSAYIM):** yedi tepe, iki kuru dere yatağı, bir taş ocağı (kesik + istiflenmiş bloklar),
üç meyve bahçesi, iki bağ, Acar köy yolu; ovada kümeler hâlinde çalı, taş ve tek ağaçlar. Üretici: `antep/src/world/Terrain.js`
(HILLS, GULLIES, QUARRY), Godot: `city.gd` `_rural`. Çarpışma eklenmedi. EKSİK: ova hâlâ büyük ölçüde düz ve tek renk; tepeler
alçak (12–22 m); tarla sınırları, taş duvarlar, köy evleri, gerçek topoğrafya ve Kilis/Maraş/Nizip yollarının gerçek güzergâhı yok.

**Aşama 11 — hasar (ilk sürüm):** 1 Nisan 1920'den sonraki bölümlerde sokaklarda mermi çukurları ve duvar dibinde yıkıntı
yığınları; üç kademe (`game.gd` HASAR: b1–b3 0,3 · b4–b7 0,6 · b8–ep 1,0), toplam 287 iz. Yerler rastgele ve temsilîdir;
anıtların 45 m yakınına konmaz. EKSİK: yapıların kendisinde hasar (yıkık duvar, delik, is) yok; yalnız zemindeki izler var.

**Aşama 7 — deneme:** `--tonemap agx` seçeneği eklendi (varsayılan hâlâ ACES); karşılaştırma görüntüleri `olcum/kirsal/aces.png`, `agx.png`.

**Skill'ler:** `gamedev@awesome-gamedev-agent-skills` eklentisi (proje kapsamı) ve `.claude/skills/scenario-godot-*` (8 dosya).
Bu turda `scenario-godot-3d-world` okundu; ondan alınan uygulama: çoklu ağların hücrelere bölünmesi ve eğim/boşluk denetimli saçılım.

**Sınama:** 21 bölüm ekransız otomatik oynatmada hatasız. Hasarlı/hasarsız aynı noktadan art arda: çizim çağrısı 1217 / 1280,
kare hızı 21–30 / 15–32 fps (makine yüklüydü; fark ölçüm gürültüsünün içinde). Rota sınaması: altı senaryo geçti (yalnız kırsal düz parçada 1 kesişme;
Kale'den çarşıya yol yeni rampayla 385 m). Sınama ekransız kipte sonuçları yazdıktan sonra kendiliğinden kapanmıyor. Dokuz noktalı tam ölçüm bu turda YAPILMADI.

## Aşama 9–10 — animasyon ve gündelik işler (19 Kasım 2026, ilk sürüm)

- **Ayak kayması:** yürüme klibinin kaymayan hızı klipten ölçülüyor (`npc.gd` `_measure_walk`): Fransız askeri modelinde adım 0,75 m,
  klipte 2 döngü / 2,37 sn → 1,27 m/sn. Klip, kişinin yürüme hızına göre hızlandırılıp yavaşlatılıyor (0,6–1,8 kat). Hız 2,2 m/sn'yi
  geçince koşu klibi. Konuşurken "agree" klibi bir kez oynar, bitince duruş klibine döner. 60 m'den uzak modelin animasyonu duraklar.
- **Gündelik işler** (`npcs.gd`): hamal bir gidişte sırtında çuvalla ağır yürür, dönüşte boş; sucu en yakın meydan çeşmesine gidip bekler;
  çocuklar bulundukları yerde koşturur; mahalleli esnafın tezgâhına gidip pazarlık eder (oyuncu yakındaysa iki söz); oturanlar ikişer
  yan yana oturur; bir hamalın ardından sırtı yüklü at yürür.
- **EKSİK:** saatli rutin yok (oyunda saat akmıyor: dükkân açma/kapama yapılmadı); eşek/katır/araba modeli yok; yer tutucu figürlerin
  kolu-bacağı olmadığı için yürüyüşleri hâlâ kayar gibi; gerçek animasyon yalnız Fransız askeri modelinde. Rutinler gözle izlenmedi,
  yalnız otomatik oynatma (21 bölüm, hatasız) ve tek kare görüntüyle denetlendi.
- **Ölçüm:** bu sırada makine yüklüydü; AYNI kodla art arda dört ölçüm 14,5 / 16,5 / 28,2 / 27,7 fps verdi (çarşı, DÜŞÜK, 850 çizim
  çağrısı). Bu oturumdaki kare hızı sayıları karşılaştırma için kullanılamaz; çizim çağrısı ve üçgen sayıları güvenilir.

## Arayüz (HUD) yenilemesi — 19 Kasım 2026

Geri dönüş noktası: `yedek/godot_hud_once_…zip`. Oyun dünyası ve görev sistemi değişmedi; yalnız `game.gd` (`_hud`, `_render`, `_toast`,
`_dialogue`) ve `menu.gd` (`_tab`, `Glyph`, panel geçişi).

- **Görev kartı (sol üst):** küçük "GÖREV" başlığı, adım sayacı (biten/toplam), ince ilerleme çizgisi, başlık, bitenlerden son ikisi +
  şimdiki adım. Sayaç ve çizgi görev adımlarından hesaplanır.
- **Bildirim:** adım bitince "TAMAMLANDI · <adım>", başlık değişince "YENİ GÖREV · <ad>" üstten süzülür (0,25 sn giriş, 2,6 sn, 0,5 sn çıkış).
- **Konuşma paneli (alt orta):** E ile konuşulan kişinin adı, mesleği/cemaati ve sözü; baş üstündeki yazı bu durumda gizlenir.
- **Üst orta:** tarih, çizgi simgeli üç sekme (Günlük J · Harita M · Ayarlar O; üzerine gelince alt çizgi ve parlama), altında günün
  vakti (hava profilinden: Sabah, Öğle, Gece…). Oyunda akan saat YOK; saat gösterilmez.
- **Sol alt:** mini harita (190 px, oyuncuya göre döner, hedef ve mesafe şeridi), altında sağlık çubuğu (`combat.hp`), sağında rol ve
  taşınan eşyalar. **Alt orta:** etkileşim ipucu ("[ E ] Konuş · ad").
- **Geçişler:** büyük harita ve günlük/ayarlar panelleri hafif büyüyerek belirir.
- **Bilerek eklenmeyenler:** para ve dayanıklılık (oyunda böyle sistemler yok), mahalle/sokak adları (doğrulanmış ad verisi yok).
- **Sınama:** 21 bölüm otomatik oynatmada hatasız; görüntüler `olcum/hud/`. Bildirim ve konuşma paneli otomatik oynatmada kapalıdır,
  gözle DENENMEDİ; fare üzerine gelme etkisi ve farklı çözünürlükler de denenmedi.

## Arayüz — ikinci ve üçüncü tur (19 Kasım 2026, kullanıcı "olmamış" dedi)

- **HUD baştan:** kutusuz görev alanı (soldan sönen koyu şerit + ince altın çizgi, serif başlık, ilerleme çizgisi), sağ üstte çizgi simgeli
  sekmeler (açık olan altın alt çizgili), üst ortada tarih + günün vakti, sol altta yuvarlak köşeli mini harita + sağlık çubuğu,
  tuş kutulu etkileşim ipucu, konuşma şeridi. Yazı tipleri sistemden: Bahnschrift (gövde), Palatino Linotype (başlık); indirme yok.
- **Harita (kullanıcının AC Mirage örneğine göre):** eskitilmiş kâğıt üstünde bütün Gaziantep; 15.413 yapının gerçek taban izi, sokaklar,
  dere, kale höyüğü ve kırsal tepeler bir kez dokuya çizilir (`map.gd` MapPainter, 2590×1628). Mini harita ve tam ekran aynı dokuyu
  kullanır. Tam ekran: bütün şehir sığacak şekilde açılır, başlık, sağda "etkin görev" paneli (görev, tarih, kalan yol, yer sayıları),
  açıklama, ölçek çubuğu, tuş satırı. Yakınlaştırma, sürükleme, işaret koyma aynen çalışır.
- **Günlük (Kingdom Come örneğine göre):** açık kitabın iki sayfası; solda günler, sağda seçilen günün sayfası, şimdiki görev,
  "Değişmeyen tarihî sonuç" ve Tanıdıklar. Sayfada resim YOK (çizim/illüstrasyon varlığı yok).
- **Eski tasarımdan kalan:** Ayarlar paneli ve açılış ekranı (yalnız renk ve yazı tipi değişti).
- Dosyalar: `scripts/game.gd`, `menu.gd`, `map.gd`, `city.gd` (taban izleri saklanıyor), `world.gd` (sınama kipi).
- Sınama: 21 bölüm otomatik oynatmada hatasız; görüntüler `olcum/hud/k_*.png`. Fareyle kullanım, bildirim ve konuşma şeridi gözle denenmedi.

- **Ayarlar ve açılış ekranı (aynı gün):** ayarlar karartılmış ekranın ortasında tek kâğıt sayfa; açılışta arkada şehrin kâğıt haritası, serif başlık, iki sütunlu tuş listesi. Eski düzenden kalan arayüz parçası yok. Görüntüler `olcum/hud/k_intro.png`, `k_settings.png`.

## Sokak kesiti — ara sokaklar daraltıldı, duvarlar yükseltildi (19 Kasım 2026)

Kullanıcının gönderdiği arşiv tarzı sokak fotoğrafı hedef alındı (dar sokak, yüksek sağır duvar, kabaltı). Geri dönüş: `yedek/godot_sokak_daralt_once_…zip`.
- Geri çekme artık yalnız ana akslara bakan cephelere uygulanıyor; ara sokaklar özgün genişliğinde. Sokak parçaları:
  2,5 m 122 · 3,0 m 396 · 3,5 m 388 · 4,0 m 143 · ana akslar 6,5 m 23 · 9,0 m 6. (Önce en dar sokak 3,5 m idi.)
- Mahalle evlerinde zemin kat 5,0–5,9 m (önce 4,0–4,6), iki katlı ev oranı %62 → %72, avlu/bahçe duvarı 2,1 → 3,3 m,
  sokağa bakan zemin kat penceresi her aralıkta %75 → %18 (dükkânlarda değişmedi). Ölçüler tasarım kararıdır, rölöve değildir.
- Dosyalar: `antep/src/world/Buildings.js`, `godot/tools/bake_city.mjs`. Şehir yeniden pişirildi.
- Sınama: 21 bölüm otomatik oynatmada hatasız; altı rota senaryosu geçti. Görüntüler `olcum/sokak/`. Dar sokakta çatışma ve
  yürüyüş elle DENENMEDİ. YAPILMADI (sıradaki maddeler): kabaltıların üstüne oda ve parmaklıklı pencere, iri/aşınmış taş,
  yuvarlak kaldırım taşı, sarkan asma, sert gölge.

## Kabaltılar, taş ve zemin (19 Kasım 2026)

- **Kabaltı:** 116 geçit (önce ~60, sade kemer). Her biri 6 m derin tünel, kemer üstü dolu duvar, silmeli düz damlı üst oda, iki sokak
  yüzünde demir parmaklıklı kemerli pencereler (`godot/tools/bake_city.mjs`; ek geçitler `Streets.js` içinde ayrı rastgele akışla).
  Düzeltilen eski hata: kemer işlevinin kapı/pencere için eklediği siyah alınlık dolgusu tünelin üst yarısını kapatıyordu.
- **Kaldırım:** yuvarlak, düzensiz taş (Poly Haven `cobblestone_floor_13`, CC0). Eski set `dokular/cobble_eski08` olarak duruyor.
- **Duvar taşı:** bloklar irileşti (stone 3,0 → 4,65 m tekrar; stone2 2,0 → 2,5; rubble 1,5 → 1,8).
- **Dip kararması:** duvarlar yerden ~1,8 m'ye kadar düzensiz bir sınırla kararıyor (zemin yüksekliği dokusundan hesaplanır;
  `city.gd` SURFACE_SHADER, `_bind_ground`). Yalnız ORTA ve üstü; DÜŞÜK ayar değişmedi. Çarşı sokağının kendi malzemelerinde yok.
- **Küp:** kapı yanındaki küp %30 → %7, duvara yakın.
- **Sınama:** 21 bölüm otomatik oynatmada hatasız. Görüntüler `olcum/sokak/`. Gölgedeki duvarlar fazla koyu (5. madde: ışık).

## Işık — gölge aydınlığı ve keskin gölge (19 Kasım 2026)

- `world.gd`: `shade_lift` 1,7 (gündüz ortam ışığı çarpanı), `sun_gain` 1,22, `bounce_warmth` 0,35 (gölgeye taştan seken sıcak ton),
  gündüz gölge bulanıklığı 1,0 → 0,6. Gece profili değişmedi. Renk eşlemesi ACES kaldı: AgX aynı sokakta denendi, gölgeyi açıyor
  ama taşı grileştiriyor (karşılaştırma `_out/L_cmp.png`). Deneme seçenekleri: `--amb`, `--sunk`, `--tonemap`.
- Bu değerler bütün kalite ayarlarında geçerli (DÜŞÜK dahil): ek maliyeti yok, yalnız ışık dengesi.
- Sınama: 21 bölüm otomatik oynatmada hatasız; görüntüler `olcum/sokak/isik*.png`. Kış ve kapalı hava profilleri tek birer kareyle
  denetlendi; tozlu ve gün batımı profilleri yeni değerlerle GÖRÜLMEDİ.
- Düzeltme: gölge açma ve güneş güçlendirme yalnız güneşli profillerde uygulanıyor (güneş gücü 0,8 ve altı olan kış ve kapalı havada sıfır); ilk sürüm kış sahnesini ağartmıştı.

## Asma ve ot (19 Kasım 2026)

- Pişirmede sokağa bakan duvarlar için yerler üretiliyor (`bake_city.mjs`, ayrı rastgele akış): 2.170 asma (bahçe duvarlarının yarısında,
  avlulu evlerin beşte birinde, diğer evlerde %9; dükkânlarda yok), 7.681 ot tutamı (duvar diplerinde).
- Kalıplar oyunda koddan kurulur (`city.gd` `_green`): asma = 14 sarkan dal + duvar üstü öbek, köşe rengiyle boyalı iki yüzlü yapraklar;
  ot = 11 yapraklı tutam. Doku yok. Asma 120 m, ot 45 m'den sonra çizilmez. Kar yağınca ikisi de gizlenir.
- EKSİK: yapraklar düz renkli üçgenler (yakından köşeli görünür), rüzgârda kıpırdamaz; taş arasından çıkan ot ve yosun yok.
- Sınama: 21 bölüm otomatik oynatmada hatasız. Görüntü `olcum/sokak/asma2.png`.
- **Asma yaprağı (ikinci sürüm):** düz üçgenler yerine saydam zeminli yaprak öbeği dokusu taşıyan kartlar (doku koddan çizilir: `city.gd` `_leaf_texture`), kesme eşikli gölgelendirici, sarkan uçlarda hafif rüzgâr salınımı. Rüzgâr hareket hâlinde izlenmedi; yakın plan görüntüsü alınamadı (iki denemede kamera duvara denk geldi). Görüntü `olcum/sokak/yaprak1.png`.

## Hasar — arşiv fotoğraflarına göre yeniden (19 Kasım 2026)

Dayanak: `docs/arsiv-tasarim-notlari.md` (REF-A04 yıkılmış evlerin sokağı, REF-A16 Basmacı Medresesi). Geri dönüş: `yedek/godot_yikik_once_…zip`.
- **Yıkık ev kabuğu:** 284 ev iki sürümle pişiriliyor (sağlam `sag1..3`, yıkık `yik1..3`); oyun tarihe göre birini gösterir
  (`city.gd` `set_damage`, `ruin_nodes`). Yıkık sürüm: yalnız dış duvarlar, tırtıklı üst kenar, gedikler, pencere boşlukları,
  içeride moloz ve devrilmiş kirişler. Kademeler: Nisan 1920 → Temmuz 1920 → Kasım 1920 ve sonrası. Çarpışma değişmedi.
- **HANGİ evlerin yıkıldığı TEMSİLÎDİR** (rastgele, evlerin %3,5'i; bahçe, dükkân ve işaretli anıtların 45 m yakını hariç).
- **Kaldırılan:** sokak ortasındaki mermi çukurları (fotoğraflarda karşılığı yok). Duvar dibi taş yığınları duruyor.
- **YAPILMADI:** kırık minare (REF-A17, A18). Kozanlı ve Handaniye camileri haritada yok; kullanıcı adreslerini verdi,
  koordinatları aranıyor. Basmacı Medresesi'nin yeri belirsiz: eklenmeyecek.
- Sınama seçeneği: `--hasar <0..1>` (kuş bakışı `--at` ile birlikte). 21 bölüm otomatik oynatmada hatasız. Görüntüler `olcum/hasar/`.

## Kozanlı ve Handaniye camileri, kırık minareler (19 Kasım 2026)

- İki cami haritaya eklendi (`historicalReferences.js`): Kozanlı 37.05777, 37.37640 · Handaniye 37.06486, 37.38226. Koordinat:
  Kültür Envanteri; OpenStreetMap bina merkeziyle 7 m ve 4 m içinde tutuyor (tam bağımsız üçüncü kaynak yok). Adresler kullanıcının
  araştırmasından (Kültür Portalı, Şahinbey Belediyesi).
- Minare biçimi kaynaklara göre: Kozanlı kısa ve kalın (17 m, VARSAYIM ölçü), Handaniye onikigen gövdeli. Yapı ölçüleri VARSAYIM.
- **Tarihe göre minare:** tepe (şerefe, korkuluk, petek, külah) sağlam ve hasarlı olarak ayrı pişirilir (`Landmarks.js` GA/GB,
  `sag2`/`yik2` grupları). Kozanlı: şerefe parçalanmış, külah duruyor, gövdede delikler (REF-A17). Handaniye: külah yok, korkuluk
  kırık, petek yarım (REF-A18). Dipte dökülmüş taş.
- **VARSAYIM:** hasarın ayı bilinmiyor; ikisi de Temmuz 1920 kademesine konuldu (fotoğraflar yalnız "1920" der). Fotoğraf altyazısı
  tahribatı Fransızlara atfeder; oyunda kaynağın ifadesi olarak aktarılır. Kozanlı için kuşatma hasarını yazan ikinci kaynak bulunamadı
  (yalnız albüm fotoğrafı). Basmacı Medresesi eklenmedi (yeri belirsiz).
- Sınama: 21 bölüm otomatik oynatmada hatasız. Görüntü `olcum/hasar/minare_cmp.png` (üst sıra Handaniye, alt sıra Kozanlı; sol önce, sağ sonra).

## Dükkân içleri, renk dengesi, Elmalı Köprüsü (19 Kasım 2026)

- **Aşama 6 — dükkân içleri:** çarşı dükkânlarının ağzı artık gerçek boşluk (eski: koyu levha). İçeride sığ oda (1,4–2,6 m), tahta
  zemin, arka duvarda üç raf ve depo kapısı; işleve göre mal: bakırcı, aktar (kavanoz, çuval, terazi), kumaşçı (kumaş topları),
  çömlekçi. İşlev rastgele (TEMSİLÎ). `Buildings.js` shopOpenings / shopInterior. Çarşıda üçgen sayısı belirgin arttı
  (Uzun Çarşı, ORTA: ~1,5–2,0 milyon üçgen); kare hızına etkisi makine yükü yüzünden ölçülemedi — sonraki turda ölçülmeli.
- **Sarılık (kullanıcı: "Dust 2 / Arap çölü"):** güneş ışığı beyaza çekildi (`sun_whiten` 0,6), gölgeye karışan sıcak ton 0,35 → 0,08,
  güneşli havada doygunluk ×0,8, güneş çarpanı 1,22 → 1,1; kaldırım ve toprak dokusuna soğuk renk çarpanı (arazi gölgelendiricisine
  `tint_cob`, `tint_dirt` eklendi). Sahne eşyalarındaki taş/ahşabın maviye kaçması düzeltildi (`plain_stone`, `_plain`).
- **Elmalı Köprüsü (k5):** tek kemerli kesme taş köprü (kullanıcının günümüz fotoğrafına göre: basık kemer, açık renk kemer taşları,
  dolu korkuluk + harpuşta, kanat duvarları) — `game.gd` `_arch_bridge`. Savaş alanı (`_battlefield`): cephane sandıkları, devrik ve
  ayakta araba, fıçılar, çuvallar (sandık ve araba siper), çatışma başlayınca dört duman sütunu. Çatışma: önden üç kol + iki yandan
  dereyi geçen iki kol, üç çıkış noktası. Şahin Bey'in sözleri ve sabit sonuç DEĞİŞMEDİ; şehadet gösterilmez.
  VARSAYIM: köprünün 1920'deki hâli, ölçüler, eşyaların yeri ve "iki yandan çevirme" sahnelemesi. Köprünün yeri de temsilî.

## Karakter hattı — Blender ile iskelet bağlama (19 Kasım 2026)

- Blender 5.3 kuruldu (winget, Blender Foundation). `tools/karakter_bagla.py`: iskeletsiz GLB'yi Fransız askerinin 41 kemikli
  iskeletine bağlar, yedi animasyonu (agree, fall, idle, run, walk, shoot, sit) taşır. Adımlar: yön/boy hizalama → dikişleri
  kaynaklama (aynı yerdeki köşeler birleştirilir) → sadeleştirme (~10 bin üçgen, doku dikişleri korunur) → iskelet kopyası hedefin
  kol açısına getirilip otomatik ağırlık → kollar T duruşuna açılıp ağ dondurulur → özgün iskelete bağlanır. Denetim araçları:
  `blender_bak.py`, `blender_durus.py`. Çıktıdan sonra `glb_onar.py <dosya> 1024` gerekir (Godot gömülü dokuyu açamıyor).
- **İlk karakter: K01 yaşlı esnaf** (CellCog modeli) → `modeller/karakter/K01_yasli_esnaf/K01_iskeletli.glb`; oyunda usta ve K01
  rolündeki herkes artık bu model. Ölçülen kaymayan yürüyüş hızı 1,24 m/sn.
- **Düzeltilen yön hatası:** Tripo iskeletli modellerin önü -X'e bakıyor; oyunda 90° yan duruyorlardı (Fransız askerleri de).
  `npc.gd` `_load_model` artık çeviriyor. Giysi malzemeleri iki yüzlü çiziliyor.
- **Bilinen kusurlar:** oturma klibinde palto bozuluyor (etek bacak kemiklerine bağlı); yüz ve parmak ayrıntısı sadeleştirmede kaba;
  aynı model birden çok kişide tekrar ediyor. Diğer 12 karakterin model dosyaları yok (Manus'ta).
- **Web yayını:** Godot web aktarımı çalışıyor (`export_presets.cfg`, `../web_yayin/`), yerelde tarayıcıda açıldı; Railway 266 MB'lık
  yüklemeyi reddetti (413). Yayındaki eski site değişmedi. Kullanıcı yayını şimdilik bıraktı.

## NVIDIA Kimodo / MotionBricks denemesi (20 Kasım 2026)

- Donanım: AMD Radeon tümleşik (2 GB), NVIDIA yok → CUDA/TensorRT yok. Kimodo (~17 GB VRAM) ve MotionBricks (TensorRT) burada çalışamaz; üretim NVIDIA'nın resmî Hugging Face sayfasında (nvidia/Kimodo, sıra + 5 dk) yapıldı.
- Lisans: Kimodo kodu Apache-2.0, modeller NVIDIA Open Model License (ticari kullanılabilir, çıktılar üzerinde sahiplik iddiası yok). MotionBricks: Apache-2.0 + CC-BY-4.0. Hukuki görüş değildir.
- Örnek: yaralı topallayarak yürüme, 6 sn, 30 fps, BVH (SOMA 77 eklem) → modeller/karakter/test_kimodo/kimodo_yarali_topallama.bvh
- İskelet: SOMA adları Mixamo'ya benzer ama farklı (LeftLeg=uyluk, LeftShin=baldır). BVH'nin yerel eksenleri NVIDIA'nın T duruşu dosyasından farklı; dönüş kopyalamak bükülme hatası verir → eklem konumlarından aktaran tools/kimodo_aktar.py yazıldı. Kemik düzeyinde doğru: 1,37 sn döngü, dikiş 2,4 cm, 0,675 m/sn, diz yönü doğru.
- Godot'ya doğrudan destek YOK. Yol: BVH → Blender (kimodo_aktar.py) → GLB kütüphane → insan profili eşlemesi (tools/kimodo_kur.gd, yalnız test_kimodo).
- İlk deneme bozuktu (kollar başın arkasına kalkıyordu). Kök neden Kimodo değil: MPFB create_human(detailed_helpers=False) MakeHuman'ın "joint-*" eklem gruplarını siliyor; "mixamo" iskeleti bu gruplara oturtulamayınca tanımdaki T duruşu yedek konumlarına düşüyor, ağ ise A duruşunda. El ağı el kemiğinden ~40 cm uzaktaydı. detailed_helpers=True ile ≤4,2 cm. Mevcut anim_mpfb kütüphanesindeki ve K02'deki kol bozukluğunun nedeni de bu (tools/karakter_kur.py:35); karakter oturumuna iletildi.
- Bacak bükülmesi ayak ucu yerine kalça hattından alındı (sürüklenen ayakta 156° tek kare sıçrama vardı).
- SONUÇ (ayrı test gövdesi tools/kimodo_govde.py, Godot anim_sinav): BAŞARILI. Yaralı topallama 1,4 sn döngü; döngü dikişi 0,1°; kare arası en büyük dönüş 14,5° (sağ ayak parmağı); dizler doğru yönde; ayak kaymayan hız 0,65 m/sn; ağ en çok 3,6 cm zemine giriyor (sürüklenen ayak ucu, küçük kusur). Görünüş: kambur, sağ el böğürde, sol kol sarkık.
- Oyundaki karakterlere ve animasyonlara dokunulmadı; test dosyaları yalnız modeller/karakter/test_kimodo.
- Kalan: diğer hareketler (çömelerek yürüme, mermi taşıma, düşüp kalkma, nişan/ateş, duvara yaslanma, yaralı taşıma) Space'te tek tek üretilip indirilecek; her biri aynı sınavdan geçecek. Yerinde olmayan hareketler (düşüp kalkma, nişan) için döngü araması kapatılmalı (kimodo_aktar.py son değişken 0).

## Karakter iskeleti ve animasyon sınavı — K02 şehirli erkek oyunda (20 Kasım 2026)

- **Bağlama hatası bulundu ve düzeltildi.** Deri, ağdan farklı duruştaki iskelete bağlanmıştı: iskelet T duruşu ve ayaklar
  bitişik, ağ A duruşu; dirsek 20 cm, bilek 42 cm, parmaklar 50–60 cm, ayak bileği 11 cm ağın dışındaydı (eklemler yanlış
  yerden dönüyor, kollar gövdeye giriyordu). Kök neden (ana oturumun Kimodo denemesinde bulundu): `create_human(detailed_helpers=False)`
  MakeHuman'ın joint-* eklem yardımcılarını siliyor, mixamo iskeleti de tanımdaki T duruşu konumlarına düşüyor.
  `tools/karakter_kur.py` artık `detailed_helpers=True` (maske sonrası boş joint-/helper- grupları silinir). Sonuç: kol, el,
  parmak ve bacak eklemleri ağa ≤4 cm; yerleşim sapma oranı el 0,04, ayak 0,07, üst kol 0,16. Yedek yol: `--oturt` (ağırlık
  geçişlerinden eklem bulma, `iskeleti_aga_oturt`). Denetim: `tools/bag_sinav.gd` (Godot'da dinlenme + tek kemik bükme,
  kemik çizgileriyle).
- **Animasyon pişirme** (`tools/anim_aktar.py`, Fransız askerinin klipleri → MakeHuman iskeleti, `ortak/anim_mpfb.glb`):
  - Zemin ağa göre: her klipte bükülmüş ağın en alt noktası dünya z=0'a oturtulur (döngülerde tek sabit, yere yatma ve diz
    çökmede kare kare kaldırma). Oyunda ölçülen: tüm kliplerde ağ en altı −0,2…+0,4 cm (önce yerde yatarken omuz −24 cm).
  - Sabit yatay kayma düşüldü (koşuda kalça kökün ~1 m önündeydi).
  - Döngü dikişi son 8 karede ilk kareye bağlanır: koşu dikişi 68° → 0,1°.
  - Gündelik döngülerde (idle, walk, run, agree) kol omuzdan 7° dışa açılır: eller şalvar torbasına girmiyor. Atış/diz çökmede
    açılmaz (iki el tüfekte).
- **Oyuna bağlandı:** `npcs.gd` K02 → `K02_mpfb.glb` (ölçek 1, yaw 0). `npc.gd`: `model_yaw` (Tripo PI/2, MakeHuman 0),
  animasyonu olmayan modele ortak kütüphane eklenir, yürüme **ve koşma** hızı klipten ölçülür (yere değen ayağın hızı;
  `_clip_ref`), silahlı sivil nöbetçide tüfek modelle de görünür.
- **Sınavlar:** `tools/anim_sinav.gd` (klip başına zemin, diz yönü, sıçrama, dikiş, kaymayan hız, geçişler), `tools/npc_sinav.gd`
  (oyun koduyla: bekleme, yürüme, koşma, oturma, diz çökme, düşme, konuşma; önden/yandan/arkadan kare), `tools/rig_sinav.py`
  (dirsek, diz, omuz, bilek, gövde dönüşü, adım). Diz yönü her klipte doğru; yürüyüşte basan ayak 0,14 m/sn; geçişler ≤16,6°/kare.
  21 bölüm `--autoplay`: ALL_DONE, betik hatası yok (ana oturumun şehir pişirmesiyle aynı anda çalışınca dosya çakışması oldu).
- **Bilinen sınırlar:** koşuda basan ayak ~1 m/sn kayıyor (kaynak klipte basan ayağın hızı adım içinde değişiyor; ayak IK gerekir);
  koşuda tek karelik 33° el sıçraması ve düşmede 45° önkol (kaynakta var); dönme, çömelme, yaralı yürüme ve yük taşıma klipleri yok (kaynak gerekli).
- Her K02 yeniden kuruluşundan sonra sıra: `karakter_kur.py` → `glb_alfa.py` → `anim_aktar.py` (hedef: yeni `_rig.glb`) →
  Godot `--import` → `anim_sinav.gd` + `npc_sinav.gd`. Yedek: `../yedek/godot_rig_once_20261120_1820.zip`.
- k1 çömelerek yürüme (tüfek iki elde): kimodo_k1.glb, klip "comelerek_dongu". Döngü 1,3 sn (kaynak kare 77–116), dikiş 0,0°, kare arası en büyük dönüş 15,8° (sağ ayak), dizler doğru, ağ en çok 1,0 cm zemine giriyor, ayak kaymayan hız 0,76 m/sn. Görünüş: alçak çömelme, sağ el yanakta (nişan tutuşu), sol kol önde; tüfek görünmez, oyunda ele bağlanmalı. Sınav aracı: tools/kimodo_sinav.gd (kütüphanedeki bütün klipler).

## Aşama 13 — bölüm açılışı kamera geçişi (20 Kasım 2026)
- Yeni scripts/sinema.gd: bir bölüm ya da sahne kartla açılıp oyuncu yeni bir yere ışınlandığında kamera şehrin üstünden (≈60 m, arkadan-yandan) başlar, Bezier yolla süzülür, son bölümde dikine inip oyuncunun göz hizasında ve bakış yönünde biter; kontrol oyuncuya geçer. 6,5 sn; üst/alt siyah şeritler; küçük harita, görev satırı ve üst çubuk gizli, bölüm kartı görünür. Herhangi bir tuş ya da tık atlar. Menü/açılış ekranı açıkken başlangıç karesinde bekler. Kamera zeminin 1,4 m altına inmez.
- Işınlamasız açılan bölümlerde (ör. b1: oyuncu olduğu yerde devam eder) geçiş yoktur.
- game.gd'de yalnız bağlantı (_auto_steps "tp" ve set_chapter); --autoplay, --bench, --at, --routetest, --sinema-yok kiplerinde çalışmaz. Yedek: yedek/game.gd.20261120_1952.sinema_oncesi.
- Denetim: --sinema-kare <klasör> (6 kare kaydeder, oyunu kapatır). k1 (kırsal) ve k2 (çarşı) kareleri alındı: çarşıda çatılar, kale ve minareler görünüyor, kamera sokağa duvarlara değmeden iniyor. 21 bölüm otomatik oynatma hatasız (ALL_DONE).
- Kalan (Aşama 13): anma/sonuç sahneleri için kamera, ayarlardan kapatma seçeneği.
