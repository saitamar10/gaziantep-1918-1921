# GAZİANTEP 1918–1921 · BİR ŞEHRİN 11 AYI

**Ana hikâye dosyası (Story Bible).** Oyunun hikâyesi için tek kaynak bu dosyadır. Tarihî olaylar, karakterler, bölümler, görevler ve tasarım kuralları burada tutulur; oyundaki veri dosyaları (`src/data/chronology.js`) buradan beslenir.

- **Kaynak:** kullanıcının ana hikâye metni (17 Kasım 2026). 9 Şubat 1921 sonrası ayrıca internetten araştırıldı.
- **Durum:** hikâye sabitlendi; prolog ve Bölüm 1–3 oyunda, kalanı planlı (bkz. §12).
- **Sahne veri tabanı:** `src/data/scenes.js` — 14 bölüm, 41 sahne; her sahnede tarih, mekân, olay, oyuncunun rolü, oynanış türü, hedefler, diyalog taslağı, sinematik geçiş, kaynak, güven düzeyi ve oyundaki durum. Bu dosya anlatımı, o dosya sahne ayrıntısını tutar.
- **Etiketler:** ✅ taranan kaynaklarla uyuşuyor · ⚠️ kaynaklar farklı tarih/bilgi veriyor · ◻️ yalnız ana hikâye metninde var, bağımsız kaynakla doğrulanmadı.

---

## 1. Ana fikir

> Bir şehrin hikâyesi yalnızca savaşanların değil, o şehirde yaşayan herkesin hikâyesidir.

Oyuncu yalnızca Şahin Bey'i, Karayılan'ı ve Fransız askerlerini görmez. Antep halkının işgalden önceki hayatını, direnişin nasıl örgütlendiğini, mahallelerin nasıl savunulduğunu, açlığı, çocukların yaşadıklarını ve şehrin teslim oluşunu bizzat yaşar.

**Yapı**

| Kısım | Dönem | İçerik |
|---|---|---|
| Prolog | 1918 – Mart 1920 | İşgalin başlaması, direnişin örgütlenmesi, dört ayrı tarihî hikâye |
| Ana oyun | Nisan 1920 – Şubat 1921 | 11 ay, 11 bölüm |
| Epilog | 20 Ekim – 25 Aralık 1921 | Ankara Antlaşması ve Fransızların çekilişi |

---

## 2. Tasarım kuralları (bağlayıcı)

1. **Oyuncu olayların içinde oynar, sonucu değiştiremez** (Story & Gameplay Directive, 17 Kasım 2026 — ilk metindeki "yalnız sinematik anlatım" kuralının yerini aldı). Oyuncu bazı savaşlara doğrudan katılır: Şahin Bey'le Elmalı Köprüsü'nde, Karayılan'ın kuvvetleriyle Karabıyıklı'da ve şehir içinde. Ama tarihî sonuçlar sabittir: Şehit Kâmil'in ölümü, Şahin Bey'in Elmalı Köprüsü'ndeki ve Karayılan'ın Sarımsak Tepe'deki şehadeti, 9 Şubat 1921 teslimi ve 25 Aralık 1921 kurtuluşu değiştirilemez. Oyuncunun başarısı sonucu değiştirmek değil, olayın içinde yaşadıklarını deneyimlemektir.
2. **Çocuklara yönelik şiddet oynatılmaz.** Oyuncu Şehit Kâmil olayına yakından tanık olur; Dokurcum Değirmeni tarihî bir hafıza sahnesi olarak deneyimlenir. İkisi de oyuncuya şiddet eylemi yaptıran göreve dönüştürülmez.
3. **Olaylar birbirine karıştırılmaz.** Şehit Kâmil (21 Ocak 1920) ile Dokurcum'da öldürülen 14 çocuk (27–28 Mart 1920) ayrı olaylardır.
4. **Tek kahraman yok.** Karayılan, bütün savunmayı tek başına yöneten bir kahraman olarak değil, geniş bir yerel direniş ağının önemli isimlerinden biri olarak anlatılır.
5. **Oynanan karakterler kurmacadır; geçişler Call of Duty tarzındadır.** Bir karakterin hikâyesi tarihî olayla bittiğinde başka bir karakterin gözünden devam edilir. Gerçek tarihî kişiler kendi belgelenmiş rollerine sadık kalır; görevleri ya da yaşamları kurmaca karakterlere mal edilmez.
6. **Oyuncu her şeyi çözemez.** Açlık bölümlerinde bazen yalnızca bir tas su taşımak, bir çocuğu güvenli bir eve ulaştırmak ya da bir hastaya yardım etmek mümkündür.
7. **Kaynak farkları korunur.** Tartışmalı tarihler (Şahin Bey 28/29 Mart gibi) tek tarihe indirgenmez; fark belirtilir.
8. **Doğru adlandırma.** "Şeftali çekirdeği" değil, kaynakların işaret ettiği **acı zerdali çekirdeği** (ve acı badem).
9. **Yer ve cephe adları** kaynaklardaki biçimiyle korunur; görevlerin kesin konumları tarihî haritalarla doğrulanmadan sabitlenmez.

---

## 3. Kronoloji

### 1918–1919: İşgal ve örgütlenme

| Tarih | Olay | Oyunda karşılığı | |
|---|---|---|---|
| 30 Ekim 1918 | Mondros Mütarekesi | Savaş sonrası şehirde belirsizlik | ✅ |
| 17 Aralık 1918 | İngilizlerin Antep'i işgali | İşgal dönemi başlar | ✅ |
| 25 Ekim 1919 | Fransızların İngilizlerin yerini alması | Yeni işgal kuvvetleri | ⚠️ ilk subaylar 25 Ekim, devir 1 Kasım, resmî işgal çoğu kaynakta 5 Kasım |
| 23 Kasım 1919 | İşgale karşı büyük halk toplantısı | Halkın örgütlü tepkisi | ✅ |
| Kasım 1919 | Heyet-i Merkeziye'nin örgütlenmesi | Gizli toplantılar ve haberleşme | ✅ |

**Direniş nasıl örgütlendi?** Direniş bir anda ortaya çıkmadı. Önce ileri gelenler, yerel yöneticiler, din adamları ve halk temsilcileri görüştü; Heyet-i Merkeziye'nin ilk toplantıları evlerde gizlice yapıldı. Şehir 27 semte ayrıldı, her semt için 100 kişilik kadro öngörüldü: toplam 2.700 kişilik plan ✅. Bu, herkesin silahlı olduğu anlamına gelmez; silah taşıyamayanlar tahkimat, erzak, sağlık ve lojistikte görev aldı.

Komisyonlar ◻️: mali işler ve para toplama · erzak ve iaşe · mühimmat ve silah tamiri · sağlık hizmetleri · tahkimat ve mühendislik · asker ailelerine yardım · haberleşme ve tedarik.

### 1920: Şehir savaşa sürükleniyor

| Tarih | Olay | |
|---|---|---|
| 12 Ocak | Araptar olayları | ✅ |
| 13 Ocak | Çatalmazı çevresinde çatışmalar | ◻️ |
| 20 Ocak | Karabıyıklı baskını | ✅ |
| 21 Ocak | Şehit Kâmil olayı | ◻️ yerel anlatı |
| Şubat (3 Şubat: Kertil) | Şahin Bey'in Kilis–Antep yolunda savunması | ◻️ |
| 27–28 Mart | Dokurcum Değirmeni; Şahin Bey'in şehadeti | ⚠️ şehadet tarihi 28 ya da 29 Mart |
| 1 Nisan | Şehir içi direnişin başlaması | ✅ |
| 24 Mayıs | Karayılan'ın şehadeti ve ağır bombardıman | ⚠️ taranan kaynaklarda farklı tarihler geçiyor (bkz. §11) |
| 30 Mayıs | Kısa süreli ateşkes | ✅ bir kaynağa göre çatışmalar 17 Haziran'da yeniden başlar |
| 8–13 Ağustos | Savunmanın yeniden düzenlenmesi, teslim baskısı, Karatarla toplantısı | ✅ Özdemir Bey 8 Ağustos · ◻️ Karatarla 13 Ağustos |
| 9–10 Eylül | Ağır bombardıman | ◻️ |
| Ekim (5 ve 14 Ekim) | Çınarlı çevresindeki çatışmalar | ◻️ |
| 21 Kasım | Kuşatmanın yeniden sıkılaşması | ✅ bir kaynak 20 Kasım der |
| 28 Kasım | Erzak kritik seviyede, iaşe payları azaltılır | ◻️ |

### 1921: Açlık, teslim, kurtuluş

| Tarih | Olay | |
|---|---|---|
| 1 Ocak | Ağır açlık, kar ve soğuk | ◻️ |
| 10 Ocak | Acı zerdali çekirdekli ekmek | ✅ olay · ◻️ gün |
| 12 Ocak | Çekirdek karışımına bağlı zehirlenme (40–50 ölüm aktarımı, H. İbrahim Yakar) | ◻️ başka belgeyle karşılaştırılmalı |
| 18–25 Ocak | Başarısız yardım ve takviye girişimleri | ◻️ |
| 5–7 Şubat | Şehirden çıkma girişimleri (huruç) | ✅ 6/7 Şubat gecesi |
| 6–8 Şubat | TBMM'nin "Gazi" unvanını vermesi | ⚠️ kabul 6 Şubat, yürürlük 8 Şubat (93 sayılı karar) |
| 8 Şubat | Teslim meselesinin görüşülmesi | ◻️ |
| 9 Şubat | Teslim protokolü (sabah 10.00) | ⚠️ kimi kaynak 8 Şubat der · ◻️ saat |
| Şubat – Ekim | Teslimden sonra Fransız idaresi | ◻️ az bilgi (bkz. §10) |
| 20 Ekim | Ankara Antlaşması | ✅ |
| Kasım | Fransız birliklerinin büyük kısmının ayrılması | ◻️ tek kaynak |
| 25 Aralık | Fransız kuvvetlerinin şehirden ayrılması | ✅ |

---

## 4. Prolog: Direnişten önce Antep

Oyuncu Antep'e ilk girdiğinde savaşla karşılaşmaz; önce şehri tanır.

> **GAZİANTEP · 17 ARALIK 1918**
> Bir zamanlar bu şehirde hayat vardı…

Çarşılar açık, insanlar sokakta, çocuklar oynuyor, hamallar yük taşıyor. Ardından: **İŞGAL BAŞLIYOR.**

| Görev | Ad | İçerik |
|---|---|---|
| 0.1 | Son Normal Gün | Oyuncu bir dükkân çırağı olarak sokaklarda dolaşır. Fırın, han, çarşı, cami, çeşme ve evler tanıtılır. |
| 0.2 | Yabancı Askerler | İngiliz birlikleri görünmeye başlar. Kontrol noktaları ve askerî hareketlilik artar. |
| 0.3 | Bayrak Değişiyor | Fransız kuvvetleri gelir. Oyuncu işgalin şehir hayatındaki değişimini görür. |
| 0.4 | Gizli Haber | Bir haberci, şehrin ileri gelenleri arasında mesaj taşımaya başlar. |
| 0.5 | Halk Toplantısı | 23 Kasım 1919 toplantısı canlandırılır. Cemiyet-i İslamiye ve halkın örgütlü tepkisi anlatılır. |

Kapanış yazısı: **"Şehir artık eskisi gibi olmayacaktı."**

---

## 5. Dört ayrı tarihî hikâye

Oyunun duygusal temeli. Birbirine karıştırılmadan, ayrı bölümler olarak anlatılır.

### A. Şahin Bey — Kilis–Antep yolu
- Asıl adı Mehmet Sait. Görevi: Kilis–Antep yolunu kapatmak, Fransız ikmal birliklerinin ilerlemesini engellemek. Karargâhının Acar köyünde olduğu aktarılır.
- Adı geçen noktalar: Kızılburun · Kertil · Elmalı Köprüsü · Bostancık tepeleri.
- 3 Şubat 1920: Kertil civarında Fransız ikmal koluna saldırı. 28 ya da 29 Mart 1920: Elmalı Köprüsü'ndeki son çatışmada şehadeti ⚠️.
- **Oyun bölümü — Kilis Yolu:** oyuncu bir haberci olarak Şahin Bey'in kuvvetlerine erzak ve mesaj ulaştırır. Yol boyunca Fransız konvoyları, gözcüler, taşlık tepeler, siperler, köyler. Final: Elmalı Köprüsü. Zafer görevi yok; sinematik anlatım.

### B. Dokurcum Değirmeni — 14 şehit çocuk
- Aktarılan anlatı: 27 Mart 1920'de yaşları 9–14 arasındaki 14 çocuk Şahin Bey ve arkadaşlarına yiyecek götürür; dönüşte yorulup Dokurcum Değirmeni'nde kalır. Şahin Bey'in şehadetinden sonraki çatışma ortamında değirmende yakalanıp öldürüldükleri anlatılır.
- Dayanak: 2019'da TBMM'de yapılan bir konuşma ve resmî anma içerikleri. Çocukların isimleri bu kaynaklarda yok ◻️.
- **Oyundaki tasarım:** oynanabilir bir çocuk çatışması **yapılmaz**. Yiyecek hazırlama, değirmene ulaşma ve sonrasını bir yetişkin tanığın gözünden görme. Oyuncu değirmene ulaştığında sesler kesilir; ekranda tarih ve olayın anısı belirir.

### C. Şehit Kâmil — 21 Ocak 1920
- Yerel anlatı: 14 yaşındaki Mehmet Kâmil, annesine müdahale eden Fransız askerlerine karşı çıkar, taş atar ve süngülenerek öldürülür ◻️.
- Dokurcum'daki 14 çocukla **karıştırılmaz**.
- **Oyundaki tasarım:** sahne bir çocuğun şiddete maruz kaldığı gerçeğini gösterebilir; olay oyuncuya şiddet eylemi yaptıran bir göreve dönüştürülmez.

### D. Karayılan — Karabıyıklı'dan şehir içine
- Asıl adı Molla Mehmet. Karabıyıklı baskınında öne çıkar. Şehir içi çatışmalarda Bekirbey ve Karagöz camileriyle ilişkilendirilen savunma görevleri üstlenir.
- 24 Mayıs 1920'de Sarımsak Tepe'de şehit düştüğü aktarılır ⚠️.
- **Oyun bölümü:** Karabıyıklı'da kırsal baskın → şehre giriş → mahalle savunması → Sarımsak Tepe'de son mücadele (tanık gözünden).

---

## 6. Ana oyun: 11 ay, 11 bölüm

| # | Ay | Ad | Tarihî omurga | Görevler |
|---|---|---|---|---|
| 1 | Nisan 1920 | **Şehir Ayağa Kalkıyor** | 1 Nisan: şehir içi direniş başlar. Mahalleler savunmaya hazırlanır; yedi cephe, 27 semt. Yüksek binalarda mazgal ve ateş noktaları, evler arasında geçişler, sokaklarda barikatlar. | Mahalle komutanına haber ulaştır · Savunma engellerinin kurulmasına yardım et · Yaralıları güvenli bölgeye taşı · Gizli geçişleri öğren · Savunma hatlarını keşfet |
| 2 | Mayıs 1920 | **Ateş Çemberi** | Fransızlar çevredeki tepeleri ve geçişleri tutmaya çalışır. Ağır topçu ateşi. 24 Mayıs bombardımanı (sivil kayıplarla anlatılır) ve Karayılan'ın şehadeti. | Sarımsak Tepe'ye haber götür · Yaralıları cephe gerisine taşı · Mühimmat ve yiyecek ulaştır · Karayılan'ın son mücadelesini bir tanığın gözünden yaşa |
| 3 | Haziran 1920 | **Kırılgan Ateşkes** | Mayıs sonu ateşkesi; uzun süreli barış getirmez, çatışmalar Haziran'da yeniden yoğunlaşır. | Yaralıları sağlık merkezine ulaştır · Hasarlı evlerden aileleri çıkar · Erzak depolarını kontrol et · Yeniden başlayan çatışma haberini mahallelere götür |
| 4 | Temmuz 1920 | **Mahallelerin Nöbeti** | Savaş kadar dayanışma. Heyet-i Merkeziye'nin sağlık, iaşe, mühimmat ve tahkimat örgütlenmesi. | Mahalle savunma ekibine katıl · Tahkimat için taş ve kereste taşı · Sağlık ekibine yardım et · Haberleşme zincirini koru |
| 5 | Ağustos 1920 | **Ya Hürriyet Ya Ölüm** | Özdemir Bey cepheler komutanı olur, savunma yeniden düzenlenir. Teslim baskısı artar. Ana sahne: 13 Ağustos Karatarla Camii toplantısı; teslim olmama iradesi, beyaz bayrak yerine Türk bayrağı çekilmesi anlatısı. | Toplantıya katılımı sağlayacak haberleri taşı · Cami çevresindeki halkı ve askerî hareketliliği gözlemle · Teslim talebini halka ulaştır · Direniş kararının duyurulmasına yardım et |
| 6 | Eylül 1920 | **Yardım Bekleyen Şehir** | 9–10 Eylül bombardımanı; hasarlı yapılar, sivil kayıplar; dışarıya gönderilen yardım çağrıları. | Yardım mektubunu şehir dışına çıkar · Yaralıları güvenli alana ulaştır · Yıkılmış evlerden insanları kurtarmaya çalış · Sağlık merkezine malzeme ulaştır |
| 7 | Ekim 1920 | **Çınarlı Cephesi** | 5 ve 14 Ekim: Çınarlı çevresinde çatışmalar; savaş mahallelerin içine yayılır. Görev yerleri özgün belgelerle ayrıca doğrulanacak. | Çınarlı çevresinde haber ulaştır · Sokaklar arasındaki geçişleri kullan · Mahalle savunmacılarını destekle · Yaralı ve sivilleri koru |
| 8 | Kasım 1920 | **Çember Daralıyor** | 21 Kasım: Fransız takviyeleriyle kuşatma yeniden sıkılaşır. 28 Kasım: erzak kritik, iaşe payları azaltılır. | Erzak depolarını kontrol et · Yardım kuvvetleriyle ilgili haberleri takip et · Kuşatma hattındaki mahallelere haber ulaştır · Kalan erzakın dağıtımına yardım et |
| 9 | Aralık 1920 | **Son Erzak** | Günlük hayat da mücadeleye dönüşür. Çevre ayrıntıları: gizli haberleşme, güvercinler, kuryeler, mühimmat atölyeleri. | Ekmek ve un dağıtımına katıl · Yaşlılara ve çocuklara yardım ulaştır · Kalan hayvanların yiyecek durumunu gözlemle · Haberleri gizlice ilet · Mühimmat tamir atölyesine malzeme taşı |
| 10 | Ocak 1921 | **Açlığın İçinde** | Oyunun en ağır insani bölümü. 1 Ocak: kar, soğuk, yiyecek ve yakacak sıkıntısı. 10 Ocak: acı zerdali çekirdekli ekmek. 12 Ocak: zehirlenme. 18–25 Ocak: başarısız yardım girişimleri. | Son ekmek kuyruğunda ailelere yardım et · Zerdali çekirdeği öğüten insanlara tanık ol · Zehirlenenleri sağlık merkezine taşı · Ölmüş hayvanların çevresindeki açlığa tanık ol · Dışarıdan gelecek yardımı bekle · Son haberleşme yollarını koru |
| 11 | Şubat 1921 | **Son Gün** | Yiyecek ve mühimmat tükenir. 5–7 Şubat: çıkış girişimleri. 8 Şubat: teslim görüşmesi. 9 Şubat sabahı 10.00: protokol. | Son yardım girişimini takip et · Şehirden çıkma teşebbüsünü yaşa · Şeyh Fethullah Camii'ndeki teslim görüşmesinin çevresindeki gelişmeleri gör · Teslim protokolünün imzalanmasına tanıklık et |

Açlık anlatıları (Bölüm 10): ölmüş at ve eşek etinin yenmesi, hayvan dışkısından arpa ayıklanması dönemin kaynaklarında yer alır. "Atın önündeki yem" ifadesi bağımsız olarak doğrulanamadı ◻️; kullanılmayacak ya da doğrulanana kadar anlatı olarak işaretlenecek.

---

## 7. Açlık ve hayatta kalma sahneleri

Oyuncunun hissetmesi gereken yalnızca açlık değil, bir şehrin bütün hayat düzeninin çökmesidir.

| Sahne | İçerik |
|---|---|
| A — Son un | Bir evde aile kalan unu ölçer. Oyuncu komşu eve bir miktar un taşır. |
| B — Zerdali çekirdeği | Kadınlar ve aile bireyleri çekirdekleri kırar, öğütür, una karıştırır. 10–12 Ocak 1921 zehirlenme anlatısına bağlanır. |
| C — Hayvanların sonu | İnsanlar ölmüş hayvanların etine yönelir. At ve eşeklerin kaybı yalnız yiyecek kaybı değildir; taşıma, ulaşım ve iş gücü de yok olur. |
| D — Kar ve yardım | Oyuncu yoğun kar içinde bir haberciyi bekler; dışarıdan yardım gelip gelmeyeceğini öğrenmeye çalışır. |

---

## 8. Karakter sistemi: tek kahraman yerine farklı hayatlar

Bölümler arasında karakter geçişi kullanılır; tarihî kişilerin yaşamları değiştirilmez. Dört oynanabilir karakterin hepsi **kurmaca bileşik karakterdir**.

| Karakter | Anlattığı |
|---|---|
| Kurmaca haberci | Mahalleler arasında haber taşır. Prolog ve ilk şehir direnişi bölümünün ana karakteri olabilir. |
| Kurmaca gönüllü yardımcı | Sağlık, erzak ve ailelerin yaşadığı zorluklar. |
| Kurmaca mahalle savunmacısı | Siperler, sokak çatışmaları, mahalle savunması. |
| Kurmaca esnaf | Çarşının kapanması, yiyecek sıkıntısı, ailesini ve komşularını koruma çabası. |

Geçiş nedenleri yalnız ölüm olmaz: yaralanma, ayrılık, haber kaybı ya da başka bir cepheye gönderilme de kullanılır. Oyun, karakterlerin sırayla öldüğü bir zincire dönüşmez.

---

## 9. Dönemlere göre çevre ayrıntıları

| Dönem | Çevrede görülecekler |
|---|---|
| 1918 | İşgal öncesi ve ilk işgal dönemi şehir hayatı |
| 1919 | Askerî kontrol noktaları, halk toplantıları, gizli haberleşme |
| Ocak 1920 | Kırsal çatışmalar ve Fransız ikmal kolları |
| Mart 1920 | Kilis yolu siperleri, atlı ulaşım, kırsal gözcüler |
| Nisan 1920 | Barikatlar, mazgallar, mahalle savunması |
| Mayıs 1920 | Topçu ateşi, hasarlı taş evler, yaralılar |
| Yaz 1920 | Tahkimat, iaşe, sağlık ve mahalle organizasyonu |
| Sonbahar 1920 | Bombardıman izleri, hasarlı dükkânlar, kuşatma |
| Kış 1920–1921 | Azalan yiyecek, yakacak sıkıntısı, hastalık, kar |
| Şubat 1921 | Teslim sonrası sessizlik ve yıkılmış şehir |

27 semtin savunması ve yedi cephe oyun haritasına ayrıca eklenecek. Cephe adları kaynaklardaki biçimiyle korunur; kesin konumlar tarihî haritalarla doğrulanır.

---

## 10. Epilog ve final

9 Şubat 1921'de şehir teslim olur, ama işgal o gün bitmez. Ana savaş hikâyesi Şubat'ta biter; son bölüm Aralık'ta kapanır.

**Şubat – Aralık 1921 (araştırma sonucu; ana metinde yoktu):**
- Teslim protokolü 11 maddedir: şehir Fransız idaresine girer, askerler savaş esiri sayılır, silah ve cephane teslim edilir, Türk ve Ermeni halka eşit davranılacağı yazılır ◻️ (ikincil kaynaktan özet; tam metin bulunamadı).
- Protokole aykırı olarak bazı görevliler tutuklanıp koleje hapsedilir ◻️.
- Halk ve köylüler Fransızlara tahıl ve kereste satmayı reddeder; Fransızlar yiyeceği başka bölgelerden getirir ◻️.
- 20 Ekim 1921: Ankara Antlaşması; Türkiye–Suriye sınırı çizilir, Güney Cephesi kapanır ✅.
- Kasım 1921: Fransız birliklerinin büyük kısmı ayrılır ◻️.
- 25 Aralık 1921: son Fransız askerleri şehri terk eder ✅.
- **Bulunamayanlar:** Şubat–Ekim arası günlük hayat ve yönetim, Antep'e özgü tahliye takvimi, Türk birliklerinin şehre girişi, Ermeni nüfusun ayrılışı, Fransız kayıpları.

**Final sahnesi.** Oyuncu, prologda dolaştığı aynı sokağa döner. Artık bazı dükkânlar kapalı, bazı evler hasarlı, bazı insanlar geri dönmemiş, sokaklarda kayıpların izi var; şehirde işgal kuvveti kalmamış.

> **GAZİANTEP · 25 ARALIK 1921**
> Bir şehir sustu.
> Ama unutmadı.
>
> *Bu sokaklarda yaşayanların, direnenlerin, yardım edenlerin ve hayatını kaybedenlerin anısına…*
>
> **GAZİANTEP 1918–1921 · BİR ŞEHRİN 11 AYI**

---

## 11. Açık sorular ve çelişkiler

Karar verilmeden ilgili bölüm yazılmamalı.

| # | Konu | Durum |
|---|---|---|
| 1 | **"11 ay"** | Bölümler Nisan 1920 – Şubat 1921 arasındaki 11 takvim ayını kapsar; bu anlamda doğru. Kuşatmanın süresi ise kaynakların çoğunda 10 ay 7–9 gündür. Oyun içi metinlerde "11 ay süren kuşatma" yerine "11 ay" ya da "yaklaşık on ay" kullanılmalı. |
| 2 | **Prolog başlangıç tarihi** | Ana metinde açılış yazısı "17 Aralık 1918"; final ise "1919'da dolaştığı aynı sokak" diyor. **Uygulanan:** oyun 17 Aralık 1918'de, açılış yazısıyla başlar. Final metni "prologda dolaştığı sokak" olarak okunmalı. |
| 3 | **Karayılan'ın şehadet tarihi** | **Uygulanan:** Bölüm 2 ana metindeki 24 Mayıs 1920'yi kullanır; fark burada notludur. Ana metin: 24 Mayıs 1920, Sarımsak Tepe. Taranan kaynaklardan biri Sarımsak Tepe taarruzunu 27 Nisan 1920 olarak, bir diğeri Karayılan'ın şehadetini Mart sonu olarak veriyor. Birincil kaynakla netleştirilmeli. |
| 4 | **Şahin Bey'in şehadet tarihi** | 28 ya da 29 Mart 1920; fark korunacak. |
| 5 | **Teslim** | 8 Şubat (şehrin ele geçirilmesi/görüşme) ve 9 Şubat (protokol) ayrımı; "sabah 10.00" ve Şeyh Fethullah Camii bilgisi yalnız ana metinde. |
| 6 | **Gazi unvanı** | Meclis'te kabul 6 Şubat, yürürlük 8 Şubat 1921. |
| 7 | **Fransız devri** | 25 Ekim / 1 Kasım / 5 Kasım 1919. |
| 8 | **Ateşkes sonrası** | Ana metin "Haziran başı", bir kaynak "17 Haziran" diyor. |
| 9 | **Kaynak numaraları** | Ana metindeki "163+1" gibi işaretler bir kaynakçaya bağlı değil; hangi yayına karşılık geldikleri bilinmiyor. Kaynakça ayrıca gerekli. Önerilen temel başvuru: Pamuk, *Antep Savunması Kronolojisi (1918–1921)*. |
| 10 | **Ermeni Antepliler** | **Karar (kullanıcı, 17 Kasım 2026):** sokaktaki kişiler Türk ya da Ermeni olarak ayırt edilir. **Uygulanan:** her sakinin adı, mesleği ve cemaati vardır (`src/data/people.js`); konuşurken ve Günlük'teki Tanıdıklar defterinde görünür. Cemaat bir kimlik bilgisidir; kimin ihbarcı ya da yardımcı olduğu **kişiye** bağlanmalı, cemaate değil (hem tarihî doğruluk hem ana fikir için). İhbar mekaniği henüz yok; tasarlanırken bu ayrım korunmalı. Oran (yaklaşık yedide bir) ve mahalle dağılımı varsayım. |
| 11 | **İngiliz askerleri** | Görev 0.2 için yer tutucu eklendi (K15: haki üniforma, düz miğfer — varsayım). Paftada tasarımı yok; birliklerin kimliği (İngiliz / Hint birlikleri) ve üniforması kaynakla doğrulanmalı. |
| 12 | **Kırsal bölümler** | Kilis yolu, Karabıyıklı, Dokurcum ve Sarımsak Tepe oyun haritasının dışında ya da ayrıntısız; ayrı harita gerekir. |

---

## 12. Oyundaki mevcut durum (17 Kasım 2026)

| Hikâye öğesi | Oyunda |
|---|---|
| Kronoloji | Günlük [J] içinde; her olaya "Bu güne git". `src/data/chronology.js` |
| Dönemler | Mütareke / İngiliz işgali / Fransız işgali / Kuşatma / Kurtuluş; tarih yazıları ve devriyeler tarihe göre değişir |
| Bölüm 1 — Nisan 1920 | **Var.** Haberci, barikat (taş taşıdıkça yükselir), iki yaralının sargı yerine taşınması, geçitler, üç nöbet yeri. Kuşatma boyunca barikatlar sokakta kalır; uzaktan silah sesleri; Fransız devriyesi mahalleden çekilir. Çatışma yok. `src/game/Bolum1.js` |
| Bölüm 2 — Mayıs 1920 | **Var.** Üç sahne, üç karakter: haberci fişek sandığını şehirden çıkarır; mahalle savunmacısı Sarımsak Tepe'de iki hücuma karşı siperi savunur ve yaralı arkadaşını geri taşır (Karayılan ikinci hücumda şehit düşer, sahne çekilme emriyle biter); gönüllü yardımcı bombardıman altında üç kişiyi mahzene yollar, enkazdan bir kadını çıkarır, iki yarayı sarar, su dağıtır. Tepenin konumu varsayım. `src/game/Bolum2.js` |
| Bölüm 3 — Haziran 1920 | **Var.** Ateşkes sürerken gönüllü yardımcı üç yaralının yarasını sarar ve su verir, hasarlı iki evden aileleri çıkarır, erzak deposunu sorar; ateşkes bozulunca haberci haberi üç nöbet yerine ve komutana taşır. Ateşkes boyunca silah sesleri susar. Bekirbey Camii haritada olmadığı için sağlık sahnesi bahçedeki sargı yerinde geçer. `src/game/Bolum3.js` |
| Savaş mekaniği | **Var.** Birinci şahıs sürgülü tüfek (5 fişek, mekanizma kurma, doldurma, nişan), sınırlı mühimmat, çömelerek siper alma, dalga dalga ilerleyip siperden ateş eden ve kayıp verince çekilen düşman, ateş eden müttefikler, yaralanma ve sahneyi yeniden başlatma. Tüfek modeli ve sesler yer tutucu. `src/game/Combat.js` |
| Sağlık ve yardım mekaniği | **Kısmen.** Envanter (temiz bez, su), yara sarma, su verme, yaralı sırtlarken yavaşlama. İlaç, sargı animasyonu ve sırttaki yaralının görünmesi yok. |
| Karakter geçişleri | **Var.** Bölüm içinde kartla karakter değişir (haberci → mahalle savunmacısı → gönüllü yardımcı); etkin karakter sol üstte yazar. |
| Bombardıman | **Kısmen.** Top mermisi ıslığı, patlama, toz ve sarsıntı; yakına düşerse yaralanma. Binalar hasar görmüyor; yalnız önceden yerleştirilmiş bir enkaz yığını var. |
| Prolog 0.1–0.5 | **Var.** Son Normal Gün, Yabancı Askerler (17 Aralık 1918) · Bayrak Değişiyor, Gizli Haber (25 Ekim 1919) · Halk Toplantısı (23 Kasım 1919). Bölüm kartları, tarih geçişleri. Oyuncu: dükkân çırağı. Kişiler ve konuşmalar kurgu. `src/game/Prolog.js` |
| Heyet-i Merkeziye | "Gizli Toplantı" ve yedi komisyon görevi (Kasım 1919); prologun ardından kendiliğinden başlar. `src/game/Story.js` |
| Kişiler | Her sakinin adı, mesleği, cemaati; Tanıdıklar defteri (Günlük). Görev sırasında sıradan sakinler yol tarif eder. `src/data/people.js`, `src/game/hints.js` |
| Sokaktaki sakinler | Kahraman sokak çevresinde sabit kadro; şehrin geri kalanında oyuncunun çevresinde dolaşan sakinler |
| Dört tarihî hikâye | Yok (sahneleri veri tabanında planlı) |
| Bölüm 4–11 | Yok (sahneleri veri tabanında planlı) |
| Harita | Görev hedefi ve rota tam haritada ve mini haritada gösterilir |
| Hasar, kar, bombardıman | Yok; barikatlar dışında şehir her tarihte aynı görünür |
| Epilog ve final | Yalnız tarih olarak; sahne yok |

## 13. Kaynaklar

Taranan ve karşılaştırmada kullanılanlar:

- [Küre Ansiklopedi — Antep Savunması](https://kureansiklopedi.com/tr/detay/antep-savunmasi-1b956)
- [TÜBA — Antep'in işgali ve kurtuluşu (özet)](https://tuba.gov.tr/en/publications/non-periodical-publications/history/local-history-of-the-national-struggle-1918-1923-vol-4-adana-kahramanmaras-sanliurfa-kilis-gaziantep-hatay-mersin-osmaniye/occupation-and-liberation-of-antep)
- [TÜBA — Mustafa Can, Antep'in İşgali ve Kurtuluşu (PDF)](https://www.tuba.gov.tr/files/yayinlar/tarih-serisi/TUBA-978-625-8352-66-5_ch05.pdf)
- [TÜBA — Antep Savunması'nın basındaki yansımaları (PDF)](https://www.tuba.gov.tr/files/yayinlar/tarih-serisi/TUBA-978-625-8352-66-5_ch14.pdf)
- [Gaziantep Pusula — Şanlı direnişin gün gün kronolojisi](https://www.gazianteppusula.com/haber/10321040/sanli-direnisin-gun-gun-kronolojisi)
- [ZKÜ Sosyal Bilimler Dergisi 3/6 (2007)](https://www.acarindex.com/dosyalar/makale/acarindex-1423937169.pdf)
- [DergiPark — Antep Savunması ve Açlık](https://dergipark.org.tr/tr/pub/hmkusbed/article/1452993)
- [DergiPark — Antep Savunması Bibliyografyası](https://dergipark.org.tr/tr/download/article-file/2159786)
- [Şahinbey Belediyesi — Antep Savunması](https://www.sahinbey.bel.tr/idet/88/28/turkce)
- [Vikipedi — Türk Kurtuluş Savaşı Güney Cephesi](https://tr.wikipedia.org/wiki/T%C3%BCrk_Kurtulu%C5%9F_Sava%C5%9F%C4%B1_G%C3%BCney_Cephesi)

Karşılaştırma arama özetleri üzerinden yapıldı; bu yayınların tam metinleri baştan sona okunmadı.
