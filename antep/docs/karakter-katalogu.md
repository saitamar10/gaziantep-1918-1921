# Gaziantep 1918–1921 · Karakter Kataloğu (Faz 2 — onay taslağı)

Durum: **TASARIM KULLANICI PAFTASINA GÖRE BELİRLENDİ; 3B MODELLER YOK.**

> **Geçerli tasarım kaynağı:** `docs/ref/karakter-paftasi.webp` (kullanıcının 14 karakterlik paftası). Her karakterin kırpımı `docs/ref/Kxx_*.png`, oyundaki tanımı `src/data/characters.js`. Aşağıdaki §3 (ilk taslak 10 karakter) bu paftayla çeliştiği yerde **pafta geçerlidir**.
>
> **Model durumu (envanter):** oyundaki bütün insan figürleri tek kaynaktan gelir: `src/npc/Mannequin.js` yer tutucu mankeni (ve uzak mesafe silueti). Fotogerçekçi tek bir karakter modeli yoktur. Her arketip, `assets/characters/manifest.json` içine GLB'si yazıldığı anda mankenden gerçek modele geçer; kod değişikliği gerekmez.
>
> **Kabul ölçütü (ortak kalite standardı):** §5'teki şartname + yakın planda (1 m) yüz, el ve kumaşta manken görünümü olmaması; 4 hareket ailesinin ortak klip adları; LOD0/1/2.
>
> **Paftaya tarih notu:** "Fransız yardımcı birliği (Ermeni Lejyonu)" figürü yerel çete kıyafetiyle çizilmiş. Lejyonerlerin Fransız üniforması giydiği genel olarak bilinir; modellemeden önce kaynakla doğrulanmalı. Oyunda `CONFIG.npc.legion` ile kapalı.

Güven etiketleri (historicalReferences.js ile aynı mantık):

- **[F1…F5]** — yüklenen 1–5 numaralı görselde doğrudan görülüyor.
- **[G]** — görsellerde yok; genel dönem bilgisinden geliyor, modellemeden önce kaynakla doğrulanmalı.
- **[V]** — tasarım varsayımı.

---

## 1. Referans analizi

| # | Görsel | Tür | Güvenilirlik | Not |
|---|---|---|---|---|
| F1 | Renkli çarşı sokağı | Temsilî (modern üretim) görsel | Yalnız yardımcı | Renk ve atmosfer fikri verir; kanıt değildir. |
| F2 | Deve ve eşekli pazar yeri | S/B tarihî fotoğraf | Yüksek (kıyafet), **yer/tarih etiketsiz** | Antep olduğu görselden doğrulanamıyor. |
| F3 | "KILLIS" yazılı kartpostal | Sepya tarihî kartpostal | Orta (çözünürlük düşük) | Kilis; birlik türü görselden okunamıyor. |
| F4 | Bando grubu + belge | Renklendirilmiş tarihî fotoğraf (Houshamadyan filigranı) | Yüksek (kesim), **renkler sonradan** | Ermeni harfli belge; şehirli cemaat bandosu. |
| F5 | Tahıl savuran üç kişi | Sepya tarihî fotoğraf (Houshamadyan filigranı) | Yüksek | Arkada sırt üzerinde sur/harabe. |

### Başlıklar
- Fes, püskülsüz ya da kısa püsküllü; şehirli erkeklerde yaygın **[F4]**, temsilî görselde de var **[F1]**.
- Başa dolanmış sarık / bez sargı (çalışan erkeklerde) **[F2, F5]**.
- Çocukta kısa saç üstünde takke benzeri küçük başlık **[F2]**.
- Kadınlarda saçı tamamen örten, enseye bağlanan koyu veya açık başörtüsü **[F5]**.
- Keçe külah **[F1 — yalnız temsilî]**.
- Kalpak, kefiye/poşu, abani sarık: görsellerde **yok** **[G]**.

### Erkek giyimi
- Çizgili, önden kavuşan uzun entari/üçetek; üstüne kuşak **[F2]**. Çizgi deseni Antep kutnu/alaca dokumasıyla uyumlu ama S/B fotoğraftan kumaş türü kesinleştirilemez **[G]**.
- Bol ağlı koyu şalvar, beli büzgülü **[F5]**; temsilî görselde bej/haki **[F1]**.
- Kısa, koyu, yakasız ceket/cepken **[F1, F2 kısmen]**.
- Şehirli kesim: üç parçalı Avrupa takımı, kolalı yaka, kravat/papyon, bıyık **[F4]**.

### Kadın giyimi
- İş başında: başörtüsü, koyu kısa ceket, altında uzun açık renkli etek/entari, önlük **[F5]**.
- Eğilerek çalışan figürde koyu başörtüsü, açık renkli gömlek, bol alt giyim **[F5]**.
- Soldaki figür (sargılı baş, şalvar, yalınayak) kadın da erkek de olabilir; görselden kesin değil **[F5]**.
- Sokak/çarşı kıyafeti (çarşaf, peçe vb.) görsellerde **yok** **[G]**.

### Çocuk giyimi
- Bilek hizasına inen açık renkli entari, belde ince kuşak/ip, kısa saç **[F2]**.
- Mavi kısa ceket, geniş kuşak, paçası kısa pantolon **[F1 — yalnız temsilî]**.

### Kumaş ve renk
- Tarihî fotoğrafların hepsi S/B ya da sepya: **renk bilgisi yok**. F4'ün renkleri modern renklendirme.
- Ton olarak: açık (ağartılmamış pamuk/keten) gömlek ve entariler, koyu yün ceket ve şalvarlar, iki tonlu çizgili dokuma **[F2, F5]**.
- Renk paleti bu yüzden **[V]**: ağartılmamış pamuk, çivit mavisi, kök boya kırmızısı, ceviz kabuğu kahvesi, koyu lacivert/siyah yün.

### Ayakkabı
- Yalınayak çalışma **[F5]**.
- Alçak, topuksuz deri ayakkabı izlenimi **[F2 — net değil]**.
- Şehirli erkekte bağcıklı Avrupa potini **[F4]**.
- Antep yemenisi ve çarık: görsellerde seçilemiyor **[G]**.

### Kuşak
- Entari üstünde geniş, birkaç kat sarılmış kumaş kuşak **[F2]**; çocukta ince bel bağı **[F2]**.

### Gündelik eşya
- Ahşap çatkılı yük semeri, hasır/kıl çuval, çizgili yük örtüsü; deve ve eşek **[F2]**.
- Teneke kova, yayvan metal leğen/tepsi, yere serili bez, tahıl yığını **[F5]**.
- Pirinç nefesliler (kornet, alto, tuba), klarnet, trampet, büyük davul; Thonet tipi sandalye **[F4]**.

### Askerî giyim
- Tek figür net: beli kemerli ceket, çapraz omuz kayışı, külot pantolon, dolak ya da çizme, sert siperli başlık **[F3]**.
- Sıradaki birliğin başlığı, rengi ve silah tipi görselden **okunamıyor**. Bu kartpostal tek başına hiçbir birliği (Fransız anavatan, sömürge, Lejyon) belgelemez.

---

## 2. Tarihsel uyarılar (tasarımı etkileyen)

1. **Tarih çakışması.** Oyunun varsayılan günü 14 Mayıs 1919. Antep Aralık 1918 – Kasım 1919 arasında İngiliz işgalindeydi; Fransız birlikleri devri Kasım 1919 başında aldı **[G]**. Fransız karakterler bu tarihten sonrası için geçerli. **Karar:** oyun tarihi 15 Mart 1920'ye kaydırıldı (`CONFIG.date`; gün seçimi varsayım, kuşatmadan önce). İngiliz karakter ailesi eklenmedi.
2. **Müzisyen.** Tek müzik referansı (F4) geleneksel çalgıcı değil, Avrupa takımlı cemaat bandosu. "Geleneksel müzisyen" (davul-zurna vb.) için ayrı fotoğraf gerekiyor.
3. **Fransız kuvvetleri tek tip değildi** **[G]**: anavatan piyadesi (ufuk mavisi), Kuzey Afrika ve Senegal tirayörleri (haki, şeşiya/Adrian miğferi), sipahi süvarileri, ve 1920'de dağıtılan Ermeni Lejyonu. Her biri ayrı karakter ailesi olacak; ilk aşamada yalnız anavatan piyadesi ve subayı.
4. **Kuvâ-yi Milliye** üniformalı bir ordu değildi; karakterler sivil giyim üstüne teçhizatla kurulacak.

---

## 3. İlk 10 karakter

Ortak: boy 1,60–1,75 m (yetişkin erkek), 1,50–1,62 m (kadın); her karakterde ayrı yüz, yaş ve vücut tipi.

### K01 · Antep esnafı (40–50, tıknaz)
- Baş: fes **[F4]**, kırlaşmış bıyık.
- Üst: çizgili entari **[F2]**, üstüne koyu kısa yelek **[V]**.
- Bel: geniş kuşak **[F2]**. Alt: entari altında şalvar. Ayak: yemeni **[G]**.
- Eşya: kuşakta para kesesi, elde terazi ya da arşın **[V]**.

### K02 · Geleneksel kıyafetli sivil erkek (25–35, ince)
- Baş: sarık sargılı fes ya da düz bez sargı **[F2]**.
- Üst: açık renkli yakasız gömlek, koyu cepken **[F1, F2]**.
- Alt: koyu bol şalvar **[F5]**. Kuşak: orta genişlik. Ayak: yemeni **[G]**.

### K03 · Sivil kadın — ev/avlu kıyafeti (30–40)
- Baş: enseden bağlı başörtüsü **[F5]**.
- Üst: koyu kısa ceket **[F5]**. Alt: uzun açık renkli entari, önlük **[F5]**.
- Ayak: yalınayak ya da takunya/yemeni **[F5 / G]**.
- Eşya: leğen, bakraç, sepet **[F5]**.
- Çarşı varyantı (çarşaf) referans gelene kadar **beklemede** **[G]**.

### K04 · Sokak çocuğu (8–10, erkek)
- Baş: kısa saç, takke **[F2]**.
- Gövde: bilek boyu açık renkli entari, ince bel bağı **[F2]**.
- Ayak: yalınayak **[V]**. Eşya: çember-çubuk ya da su testisi **[V]**.

### K05 · Yaşlı Antep sakini (65+, hafif kambur)
- Baş: beyaz sarıklı fes **[G]**, ak sakal.
- Üst: uzun çizgili entari **[F2]**, üstüne uzun koyu aba/cübbe **[G]**.
- Kuşak: geniş. Ayak: yemeni **[G]**. Eşya: baston, tespih **[V]**.

### K06 · Hamal (30–40, geniş omuzlu)
- Baş: ter bezi/sargı **[F2, F5]**.
- Üst: kolları sıvalı kaba gömlek, sırtta dolgulu hamal semeri **[G]**.
- Alt: dizden bağlı şalvar, yalınayak ya da çarık **[F5 / G]**.
- Eşya: çuval, ip; eşek ve ahşap semer ayrı varlık **[F2]**.

### K07 · Müzisyen — bando üyesi (20–30)
- Baş: fes **[F4]**, bıyık.
- Giyim: koyu üç parçalı takım, kolalı yaka, kravat **[F4]**. Ayak: bağcıklı potin **[F4]**.
- Eşya: kornet, klarnet ya da trampet (modüler) **[F4]**.
- Geleneksel çalgıcı varyantı referans bekliyor.

### K08 · Kuvâ-yi Milliye savaşçısı (25–40)
- Baş: kalpak **[G]**; varyant: sargı ya da fes.
- Giyim: K02'nin sivil kıyafeti **[F2, F5]**; üstüne çapraz iki fişeklik, bel fişekliği **[G]**.
- Ayak: çarık ve yün çorap/dolak **[G]**.
- Silah: Osmanlı Mavzeri (M1903) **[G]**; varyant: ele geçirilmiş Lebel. Kuşakta kama **[V]**.

### K09 · Fransız piyade eri — anavatan alayı (20–25)
- Baş: Adrian M1915 miğferi **[G]**.
- Giyim: ufuk mavisi kaput (etekleri geriye iliklenmiş) ya da ceket, pantolon, dolak, kabaralı postal **[G]**; F3'teki siluetle uyumlu **[F3]**.
- Teçhizat: deri palaska, üç fişeklik, ekmek torbası, matara **[G]**.
- Silah: Lebel 1886/93 ya da Berthier 07/15, süngü **[G]**.

### K10 · Fransız subayı — teğmen/yüzbaşı (30–40)
- Baş: kepi **[G]**.
- Giyim: kemerli ceket, çapraz omuz kayışı, külot pantolon, deri tozluk ya da çizme **[F3, G]**.
- Eşya: tabanca kılıfı, dürbün, harita çantası; rütbe kol şeritleri **[G]**.

---

## 4. Modüler parça planı

Tek iskelet ailesi başına (erkek, kadın, çocuk, yaşlı) değiştirilebilir parçalar:

- Baş/yüz (her karakterde ayrı), saç-sakal-bıyık kartları.
- Başlık: fes, sarıklı fes, bez sargı, takke, kalpak, başörtüsü, Adrian, kepi.
- Üst: gömlek, cepken, yelek, entari, aba, takım ceketi, kaput, subay ceketi.
- Alt: şalvar, entari eteği, pantolon, külot pantolon.
- Ayak: yalınayak, yemeni, çarık, potin, postal+dolak, çizme.
- Aksesuar: kuşak, fişeklik, palaska takımı, çuval, semer, çalgılar, tüfekler.

## 5. GLB teknik şartnamesi

Mevcut `AssetManager` kurallarıyla uyumlu:

- glTF 2.0 ikili (.glb); 1 birim = 1 m; Y yukarı; pivot ayak tabanı ortası; +Z'ye bakar.
- LOD: `*_LOD0` ≈ 35–50 bin üçgen (yakın), `*_LOD1` ≈ 10–12 bin, `*_LOD2` ≈ 2–3 bin.
- Doku: gövde/giysi 2048², baş 2048², aksesuar 1024²; albedo + normal + ORM.
- İskelet: insansı, ~55–65 kemik (parmaklar dahil), ortak kemik adları; yüzde çene + göz kemikleri, konuşma için en az 8 blend shape.
- Animasyon klipleri ortak adla: `idle`, `walk`, `run`, `talk_a`, `talk_b`, `sit`, `carry_walk`, `work_a`, `shop`, `interact`.
- Hareket setleri ayrı: erkek, kadın, çocuk, yaşlı, asker (`march`, `guard`, `aim`, `patrol` ek klipleriyle).
