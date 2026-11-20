// Oyunun tarihî kronolojisi ve direniş teşkilatı. Kaynak: kullanıcının verdiği kronoloji metni (17 Kasım 2026) +
// aşağıdaki kaynaklarla karşılaştırma. status: 'verified' = taranan kaynaklarla uyuşuyor · 'disputed' = kaynaklar farklı tarih veriyor ·
// 'unverified' = yalnız kullanıcı metninde var, bağımsız kaynakla doğrulanamadı.
export const KAYNAKLAR = [
  { ad: 'Küre Ansiklopedi — Antep Savunması', url: 'https://kureansiklopedi.com/tr/detay/antep-savunmasi-1b956' },
  { ad: 'TÜBA — Millî Mücadele\'nin Yerel Tarihi, c. 4: Antep\'in işgali ve kurtuluşu', url: 'https://tuba.gov.tr/en/publications/non-periodical-publications/history/local-history-of-the-national-struggle-1918-1923-vol-4-adana-kahramanmaras-sanliurfa-kilis-gaziantep-hatay-mersin-osmaniye/occupation-and-liberation-of-antep' },
  { ad: 'TÜBA — Mustafa Can, Antep\'in İşgali ve Kurtuluşu (bölüm 5, PDF)', url: 'https://www.tuba.gov.tr/files/yayinlar/tarih-serisi/TUBA-978-625-8352-66-5_ch05.pdf' },
  { ad: 'Şahinbey Belediyesi — Antep Savunması', url: 'https://www.sahinbey.bel.tr/idet/88/28/turkce' }
];

// occupier: o günden itibaren şehirdeki işgal kuvveti (none | british | french)
export const KRONOLOJI = [
  { id: 'mondros', date: { y: 1918, m: 10, d: 30 }, baslik: 'Mondros Mütarekesi', oyun: 'Savaş sonrası şehirde belirsizlik', occupier: 'none', status: 'verified',
    metin: 'Osmanlı Devleti savaştan çekilir. Antep henüz işgal edilmemiştir; şehirde ne olacağı bilinmiyor.' },
  { id: 'ingiliz', date: { y: 1918, m: 12, d: 17 }, baslik: 'İngilizlerin Antep\'i işgali', oyun: 'İşgal dönemi başlar', occupier: 'british', status: 'verified',
    metin: 'İngiliz birlikleri şehre girer. İşgal yılları başlar.' },
  { id: 'fransiz', date: { y: 1919, m: 10, d: 25 }, baslik: 'Fransızların İngilizlerin yerini alması', oyun: 'Yeni işgal kuvvetleri', occupier: 'french', status: 'disputed',
    metin: 'Fransız kuvvetleri İngilizlerin yerini alır.',
    not: 'Tarih kaynağa göre değişiyor: ilk Fransız subayları 25 Ekim\'de gelir, devir 1 Kasım\'dan geçerlidir, resmî işgal çoğu kaynakta 5 Kasım 1919\'dur.' },
  { id: 'miting', date: { y: 1919, m: 11, d: 23 }, baslik: 'İşgale karşı büyük halk toplantısı', oyun: 'Halkın örgütlü tepkisi', occupier: 'french', status: 'verified',
    metin: 'Geniş katılımlı bir mitingde işgalin kabul edilmediği dile getirilir.' },
  { id: 'heyet', date: { y: 1919, m: 11, d: 30 }, baslik: 'Heyet-i Merkeziye\'nin örgütlenmesi', oyun: 'Gizli toplantılar ve haberleşme', occupier: 'french', status: 'verified', yaklasik: true, etiket: 'Kasım 1919',
    metin: 'Direniş bir anda ortaya çıkmaz: ileri gelenler, yerel yöneticiler, din adamları ve halk temsilcileri önce evlerde gizlice toplanır. Heyet 23 Kasım\'dan sonra resmî nitelik kazanır.',
    not: 'Kesin gün yok ("Kasım 1919"); oyunda ay sonu alındı.' },

  // ---- 1920 – Ocak 1921: kullanıcının ana hikâye dosyasından (docs/hikaye-ana-dosya.md). bolum = ana oyundaki bölüm numarası ----
  { id: 'araptar', date: { y: 1920, m: 1, d: 12 }, baslik: 'Araptar olayları', oyun: 'Direniş şehir dışında başlar', occupier: 'french', status: 'verified',
    metin: 'İşgale karşı ilk silahlı olaylar şehrin dışında, kırsalda yaşanır.' },
  { id: 'catalmazi', date: { y: 1920, m: 1, d: 13 }, baslik: 'Çatalmazı çevresinde çatışmalar', oyun: 'Kırsal çatışmalar', occupier: 'french', status: 'unverified',
    metin: 'Çatalmazı çevresinde çatışmalar olur.' },
  { id: 'karabiyikli', date: { y: 1920, m: 1, d: 20 }, baslik: 'Karabıyıklı baskını', oyun: 'Karayılan hikâyesinin başlangıcı', occupier: 'french', status: 'verified',
    metin: 'Karabıyıklı\'da Fransız koluna baskın yapılır. Karayılan (Molla Mehmet) bu baskında öne çıkar.' },
  { id: 'kamil', date: { y: 1920, m: 1, d: 21 }, baslik: 'Şehit Kâmil olayı', oyun: 'Tanıklık sahnesi', occupier: 'french', status: 'unverified',
    metin: 'Yerel anlatıya göre 14 yaşındaki Mehmet Kâmil, annesine müdahale eden Fransız askerlerine karşı çıkar ve öldürülür.',
    not: 'Dokurcum Değirmeni\'ndeki 14 çocukla ayrı bir olaydır. Oyunda oynanabilir şiddet sahnesi yapılmaz.' },
  { id: 'kilisyolu', date: { y: 1920, m: 2, d: 3 }, baslik: 'Şahin Bey\'in Kilis–Antep yolunda savunması', oyun: 'Kilis Yolu bölümü', occupier: 'french', status: 'unverified', etiket: 'Şubat 1920',
    metin: 'Şahin Bey (Mehmet Sait), Kilis–Antep yolunu kapatmak ve Fransız ikmal birliklerini durdurmakla görevlidir. 3 Şubat\'ta Kertil civarında ikmal koluna saldırılır.',
    not: 'Adı geçen noktalar: Kızılburun, Kertil, Elmalı Köprüsü, Bostancık tepeleri. Karargâhın Acar köyünde olduğu aktarılır.' },
  { id: 'dokurcum', date: { y: 1920, m: 3, d: 27 }, baslik: 'Dokurcum Değirmeni — 14 çocuk', oyun: 'Tanıklık sahnesi', occupier: 'french', status: 'unverified', etiket: '27–28 Mart 1920',
    metin: 'Aktarılan anlatıya göre yaşları 9–14 arasındaki 14 çocuk Şahin Bey ve arkadaşlarına yiyecek götürür, dönüşte değirmende kalır ve çatışma ortamında öldürülür.',
    not: 'Dayanak: 2019\'da TBMM\'de yapılan bir konuşma ve anma içerikleri; çocukların adları bu kaynaklarda yok. Oyunda çocuk çatışması oynatılmaz.' },
  { id: 'sahinbey', date: { y: 1920, m: 3, d: 28 }, baslik: 'Şahin Bey\'in şehadeti', oyun: 'Elmalı Köprüsü — sinematik anlatım', occupier: 'french', status: 'disputed',
    metin: 'Şahin Bey, Elmalı Köprüsü\'ndeki son çatışmada şehit düşer.',
    not: 'Tarih kaynaklarda 28 ya da 29 Mart 1920. Oyuncuya zafer görevi verilmez; olayın sonucu değiştirilmez.' },
  { id: 'direnis', date: { y: 1920, m: 4, d: 1 }, baslik: 'Şehir içi direnişin başlaması', oyun: 'Bölüm 1 — Şehir Ayağa Kalkıyor', occupier: 'french', status: 'verified', bolum: 1,
    metin: 'Savaş şehrin içine taşınır. Mahalleler savunmaya hazırlanır: barikatlar, mazgallar, evler arasında açılan geçişler; yedi cephe ve 27 semt.' },
  { id: 'karayilan', date: { y: 1920, m: 5, d: 24 }, baslik: 'Karayılan\'ın şehadeti ve ağır bombardıman', oyun: 'Bölüm 2 — Ateş Çemberi', occupier: 'french', status: 'disputed', bolum: 2,
    metin: 'Fransız topçusu şehri ağır biçimde döver. Karayılan\'ın Sarımsak Tepe\'de şehit düştüğü aktarılır.',
    not: 'Taranan kaynaklarda farklı tarihler geçiyor (Sarımsak Tepe taarruzu için 27 Nisan da veriliyor); birincil kaynakla netleştirilmeli.' },
  { id: 'ateskes', date: { y: 1920, m: 5, d: 30 }, baslik: 'Kısa süreli ateşkes', oyun: 'Bölüm 3 — Kırılgan Ateşkes', occupier: 'french', status: 'verified', bolum: 3,
    metin: 'Ateşkes şehre kısa bir nefes aldırır ama kalıcı barış getirmez.',
    not: 'Çatışmaların yeniden başlaması: ana hikâyede Haziran başı, bir kaynakta 17 Haziran.' },
  { id: 'nobet', date: { y: 1920, m: 7, d: 15 }, baslik: 'Mahallelerin nöbeti', oyun: 'Bölüm 4 — Mahallelerin Nöbeti', occupier: 'french', status: 'unverified', bolum: 4, yaklasik: true, etiket: 'Temmuz 1920',
    metin: 'Savaş kadar dayanışma: sağlık, iaşe, mühimmat ve tahkimat işleri mahalle mahalle yürütülür.',
    not: 'Belirli bir olay değil, dönemin genel durumu. Gün seçimi oyun içindir.' },
  { id: 'ozdemir', date: { y: 1920, m: 8, d: 8 }, baslik: 'Özdemir Bey\'in komutayı alması', oyun: 'Bölüm 5 — Ya Hürriyet Ya Ölüm', occupier: 'french', status: 'verified', bolum: 5,
    metin: 'Özdemir Bey cepheler komutanı olur; savunma yeniden düzenlenir. Fransızların teslim baskısı artar.' },
  { id: 'karatarla', date: { y: 1920, m: 8, d: 13 }, baslik: 'Karatarla Camii toplantısı', oyun: 'Bölüm 5 — ana sahne', occupier: 'french', status: 'unverified', bolum: 5,
    metin: 'Teslim talebi halkın önünde görüşülür; teslim olmama iradesi ortaya konur. Beyaz bayrak yerine Türk bayrağı çekildiği anlatılır.' },
  { id: 'bombardiman', date: { y: 1920, m: 9, d: 9 }, baslik: 'Ağır bombardıman', oyun: 'Bölüm 6 — Yardım Bekleyen Şehir', occupier: 'french', status: 'unverified', bolum: 6, etiket: '9–10 Eylül 1920',
    metin: 'Bombardıman yapıları yıkar, sivil kayıplar artar. Şehirden dışarıya yardım çağrıları gönderilir.' },
  { id: 'cinarli', date: { y: 1920, m: 10, d: 5 }, baslik: 'Çınarlı çevresindeki çatışmalar', oyun: 'Bölüm 7 — Çınarlı Cephesi', occupier: 'french', status: 'unverified', bolum: 7, etiket: '5 ve 14 Ekim 1920',
    metin: 'Çatışmalar mahallelerin içine kadar yayılır.' },
  { id: 'cember', date: { y: 1920, m: 11, d: 21 }, baslik: 'Kuşatmanın yeniden sıkılaşması', oyun: 'Bölüm 8 — Çember Daralıyor', occupier: 'french', status: 'verified', bolum: 8,
    metin: 'Fransız takviyelerinin gelmesiyle şehir yeniden kuşatılır.', not: 'Bir kaynak 20 Kasım der.' },
  { id: 'iase', date: { y: 1920, m: 11, d: 28 }, baslik: 'Erzak kritik seviyede', oyun: 'Bölüm 8', occupier: 'french', status: 'unverified', bolum: 8,
    metin: 'Erzak durumu kritik seviyeye iner; iaşe payları azaltılır.' },
  { id: 'sonerzak', date: { y: 1920, m: 12, d: 15 }, baslik: 'Son erzak', oyun: 'Bölüm 9 — Son Erzak', occupier: 'french', status: 'unverified', bolum: 9, yaklasik: true, etiket: 'Aralık 1920',
    metin: 'Yalnız cephe değil, günlük hayat da mücadeleye dönüşür: ekmek ve un dağıtımı, gizli haberleşme, mühimmat atölyeleri.',
    not: 'Belirli bir olay değil, dönemin genel durumu. Gün seçimi oyun içindir.' },
  { id: 'soguk', date: { y: 1921, m: 1, d: 1 }, baslik: 'Ağır açlık, kar ve soğuk', oyun: 'Bölüm 10 — Açlığın İçinde', occupier: 'french', status: 'unverified', bolum: 10,
    metin: 'Yiyecek ve yakacak sıkıntısı çok ağırlaşır.' },
  { id: 'zerdali', date: { y: 1921, m: 1, d: 10 }, baslik: 'Acı zerdali çekirdekli ekmek', oyun: 'Bölüm 10', occupier: 'french', status: 'verified', bolum: 10,
    metin: 'Un tükenir; acı zerdali çekirdeği kırılıp öğütülerek una karıştırılır.', not: 'Olay kaynaklarda geçiyor; 10 Ocak günü yalnız ana hikâyede.' },
  { id: 'zehirlenme', date: { y: 1921, m: 1, d: 12 }, baslik: 'Çekirdek karışımından zehirlenme', oyun: 'Bölüm 10', occupier: 'french', status: 'unverified', bolum: 10,
    metin: 'Çekirdek karışımından zehirlenenler olur; 40–50 kişinin öldüğü aktarılır.',
    not: 'Sayı, H. İbrahim Yakar\'ın yerel tarih çalışmasında iaşe kayıtlarından aktarılır; başka belgeyle karşılaştırılmalı.' },
  { id: 'yardim', date: { y: 1921, m: 1, d: 18 }, baslik: 'Başarısız yardım ve takviye girişimleri', oyun: 'Bölüm 10', occupier: 'french', status: 'unverified', bolum: 10, etiket: '18–25 Ocak 1921',
    metin: 'Dışarıdan şehre yardım ve takviye ulaştırma girişimleri sonuç vermez.' },

  // ---- Şubat 1921 ve sonrası: internetten araştırıldı (17 Kasım 2026). Kaynaklar yukarıda; ayrıntı düzeyi sınırlı. ----
  { id: 'huruc', date: { y: 1921, m: 2, d: 6 }, baslik: 'Huruç harekâtı', oyun: 'Bölüm 11 — Son Gün', occupier: 'french', status: 'verified', bolum: 11, etiket: '5–7 Şubat 1921',
    metin: 'Açlık son haddine varmıştır. Savunmacılar 6/7 Şubat gecesi bir huruç (yarma) hareketiyle şehirden çıkar.',
    not: 'Ana hikâyede 5–7 Şubat arası çıkış girişimleri; taranan kaynakta 6/7 Şubat gecesi.' },
  { id: 'gazi', date: { y: 1921, m: 2, d: 8 }, baslik: 'Ayıntab\'a "Gazi" unvanı verilmesi', oyun: 'Şehrin adı Gaziayıntab olur', occupier: 'french', status: 'disputed',
    metin: 'Türkiye Büyük Millet Meclisi şehre "Gazi" unvanını verir; Ayıntab\'ın adı Gaziayıntab olur.',
    not: 'Tarih: teklif 6 Şubat 1921\'de Meclis\'te kabul edilir, 8 Şubat 1921 tarihli 93 sayılı kararla yürürlüğe girer. Kaynaklar ikisini de veriyor.' },
  { id: 'teslim', date: { y: 1921, m: 2, d: 9 }, baslik: 'Şehrin teslimi', oyun: 'Bölüm 11 — Son Gün', occupier: 'french', status: 'disputed', bolum: 11,
    metin: 'Yaklaşık on ay kendi imkânlarıyla direnen şehir açlık yüzünden düşer. 11 maddelik teslim protokolü imzalanır: şehir Fransız idaresine girer, askerler savaş esiri sayılır, silah ve cephane teslim edilir, Türk ve Ermeni halka eşit davranılacağı yazılır.',
    not: 'Tarih: kimi kaynak şehrin 8 Şubat\'ta ele geçirildiğini, protokolün 9 Şubat\'ta imzalandığını yazar. Süre: "11 ay" yerine çoğu kaynak 10 ay 7–9 gün verir (1 Nisan 1920 – 7/9 Şubat 1921). Yaygın anılan kayıp: 6.317 şehit. Protokolün tam metni bulunamadı; maddeler ikincil kaynaktan özetlendi. Ana hikâyede: 8 Şubat\'ta teslim görüşülür (Şeyh Fethullah Camii çevresi), protokol 9 Şubat sabahı 10.00\'da imzalanır.' },
  { id: 'idare', date: { y: 1921, m: 2, d: 15 }, baslik: 'Teslimden sonra Fransız idaresi', oyun: 'İşgal altında sessiz direniş', occupier: 'french', status: 'unverified', yaklasik: true, etiket: 'Şubat – Ekim 1921',
    metin: 'Protokole aykırı olarak bazı görevliler tutuklanıp koleje hapsedilir. Halk ve köylüler Fransızlara tahıl ve kereste satmayı reddeder; Fransızlar yiyeceği başka bölgelerden getirmek zorunda kalır.',
    not: 'Bu dönem için bulunan bilgi az ve tek kaynağa dayanıyor. Gün seçimi (15 Şubat) oyun içindir.' },
  { id: 'ankara', date: { y: 1921, m: 10, d: 20 }, baslik: 'Ankara Antlaşması', oyun: 'Güney Cephesi kapanır', occupier: 'french', status: 'verified',
    metin: 'TBMM Hükûmeti ile Fransa arasında imzalanır. Türkiye–Suriye sınırı çizilir; Fransızlarla savaşılan Güney Cephesi kapanır.' },
  { id: 'cekilme', date: { y: 1921, m: 11, d: 15 }, baslik: 'Fransız birliklerinin çekilmeye başlaması', oyun: 'Boşalan karakollar', occupier: 'french', status: 'unverified', yaklasik: true, etiket: 'Kasım 1921',
    metin: 'Antlaşmanın ardından Fransız birliklerinin büyük kısmı Kasım ayında şehirden ayrılır.',
    not: 'Tek kaynak; Antep\'e özgü bir tahliye takvimi bulunamadı. Gün seçimi oyun içindir.' },
  { id: 'kurtulus', date: { y: 1921, m: 12, d: 25 }, baslik: 'Fransızların şehri terk etmesi — Kurtuluş', oyun: 'İşgalin sonu', occupier: 'free', status: 'verified',
    metin: 'Son Fransız askerleri Antep\'ten ayrılır. 25 Aralık, şehrin kurtuluş günü olarak anılır.',
    not: 'Türk birliklerinin şehre girişine ve Ermeni nüfusun ayrılışına dair Antep\'e özgü ayrıntı bulunamadı.' }
];

export const TESKILAT = {
  ad: 'Heyet-i Merkeziye', status: 'verified',
  plan: { semt: 27, kadro: 100, toplam: 2700 },
  metin: 'Şehir 27 semte ayrılır; her semt için 100 kişilik kadro öngörülür: toplam 2.700 kişilik bir teşkilat planı. Bu, herkesin silahlı savaşçı olduğu anlamına gelmez; silah taşıyamayanlar tahkimat, erzak, sağlık ve lojistik işlerinde görev alır.',
  // Semt adları kaynak metinde yok: uydurulmadı.
  komisyonlar: [
    { id: 'mali', ad: 'Mali işler ve para toplama' }, { id: 'iase', ad: 'Erzak ve iaşe' }, { id: 'muhimmat', ad: 'Mühimmat ve silah tamiri' }, { id: 'saglik', ad: 'Sağlık hizmetleri' },
    { id: 'tahkimat', ad: 'Tahkimat ve mühendislik' }, { id: 'yardim', ad: 'Asker ailelerine yardım' }, { id: 'haber', ad: 'Haberleşme ve tedarik' }
  ],
  komisyonStatus: 'unverified'   // komisyon listesi yalnız kullanıcı metninde; taranan kaynaklarda doğrulanamadı
};

const key = d => d.y * 10000 + d.m * 100 + d.d;
/** Verilen günde şehirdeki durum: son gerçekleşmiş olay ve işgal kuvveti */
export function donem(date) { let e = null; for (const k of KRONOLOJI) if (key(k.date) <= key(date)) e = k; const kusatma = key(date) >= 19200401 && key(date) < 19210209;
  return { olay: e, occupier: e ? e.occupier : 'none', kusatma, ad: kusatma ? 'KUŞATMA' : { none: 'MÜTAREKE GÜNLERİ', british: 'İNGİLİZ İŞGALİ', french: 'FRANSIZ İŞGALİ', free: 'KURTULUŞ' }[e ? e.occupier : 'none'] }; }
export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const tarihYaz = d => `${d.d} ${AYLAR[d.m - 1]} ${d.y}`;
