// BÖLÜM VE SAHNE VERİ TABANI — "Bir Şehrin 11 Ayı"
// Kaynak: kullanıcının ana hikâye metni + "Story & Gameplay Directive" (17 Kasım 2026). Anlatım: docs/hikaye-ana-dosya.md.
//
// Her sahne: tarih · mekan · olay (tarihî) · rol (oyuncunun karakteri) · oynanis (tür) · hedefler · diyalog · gecis (sinematik) · kaynak · guven · durum
//   guven : 'verified' taranan kaynaklarla uyumlu · 'disputed' kaynaklar ayrışıyor · 'unverified' yalnız ana hikâyede/anlatıda
//   durum : 'oyunda' oynanabiliyor · 'kismi' bir kısmı var · 'planli' henüz yok
//   sabit : değiştirilemeyecek tarihî sonuç. Oyuncunun başarısı sonucu değiştirmek değil, olayın içinde yaşadıklarını deneyimlemektir.
//   diyalog: [konuşan, söz]. Hepsi KURGU taslağıdır. Gerçek kişilere (Şahin Bey, Karayılan, Özdemir Bey) yazılan sözler de kurgudur;
//            'atif' işaretli olanlar kaynaklarda o kişiye atfedilen sözdür ve kullanılmadan önce doğrulanmalıdır.
//
// OYUNCU KARAKTERLERİ (hepsi kurmaca bileşik karakter; gerçek kişilerin yaşamı bunlara mal edilmez):
export const KARAKTERLER = {
  haberci: { ad: 'Çırak / haberci', tanim: 'Çarşıda bir dükkân çırağı; işgalle birlikte mahalleler arasında haber taşır.' },
  savunmaci: { ad: 'Mahalle savunmacısı', tanim: 'Siperlerde ve sokak çatışmalarında görev alan bir gönüllü.' },
  yardimci: { ad: 'Gönüllü yardımcı', tanim: 'Yaralılara, ailelere ve erzak işlerine koşan bir mahalleli.' },
  esnaf: { ad: 'Esnaf', tanim: 'Çarşının kapanışını, kıtlığı ve teslimi dükkânının önünden yaşayan bir usta.' }
};

// OYNANIŞ SİSTEMLERİ ve oyundaki durumları
export const SISTEMLER = {
  konusma: { ad: 'Konuşma ve yol tarifi', durum: 'oyunda' },
  haber: { ad: 'Haber ve mesaj taşıma', durum: 'oyunda' },
  tasima: { ad: 'Yük taşıma (taş, erzak, mühimmat)', durum: 'kismi', not: 'Nesne görünmez; yalnız hedefler arası taşıma.' },
  yarali: { ad: 'Yaralı taşıma', durum: 'kismi', not: 'Yaralı sırtlanınca sokaktan kaybolur, hedefte yeniden görünür.' },
  barikat: { ad: 'Barikat ve tahkimat', durum: 'oyunda' },
  kart: { ad: 'Bölüm kartları (sinematik geçiş)', durum: 'kismi', not: 'Yazılı kart; kamera sinematiği yok.' },
  harita: { ad: 'Haritada görev hedefi ve rota', durum: 'oyunda' },
  kimlik: { ad: 'Kişi kimlikleri ve Tanıdıklar defteri', durum: 'oyunda' },
  silah: { ad: 'Birinci şahıs silah kullanımı (dönem tüfekleri, sınırlı mühimmat)', durum: 'oyunda', not: 'Tüfek modeli ve sesler yer tutucu.' },
  siper: { ad: 'Siper ve çevreyi kullanarak korunma', durum: 'oyunda', not: 'Çömelerek alçak siperin ardına geçme; duvar ve arazi görüşü keser.' },
  dusman: { ad: 'Düşman askeri davranışı (ateş, ilerleme, geri çekilme)', durum: 'oyunda' },
  sargi: { ad: 'Yara sarma, bez ve ilaç', durum: 'kismi', not: 'Bez ve yara sarma var; ilaç ve sargı animasyonu yok.' },
  su: { ad: 'Su ve erzak dağıtma', durum: 'kismi', not: 'Su var; erzak dağıtımı yok.' },
  bombardiman: { ad: 'Bombardıman, hasar ve enkazdan kurtarma', durum: 'kismi', not: 'Mermi düşüşü, toz, sarsıntı ve enkazdan yaralı çıkarma var; binalar hasar görmüyor.' },
  aclik: { ad: 'Açlık, soğuk ve hastalık', durum: 'planli' },
  gecis: { ad: 'Karakter geçişleri', durum: 'oyunda' },
  kirsal: { ad: 'Şehir dışı haritalar (Kilis yolu, Karabıyıklı, Dokurcum, Sarımsak Tepe)', durum: 'kismi', not: 'Yalnız Sarımsak Tepe (konumu varsayım).' }
};

const K = { kure: 'Küre Ansiklopedi — Antep Savunması', tuba: 'TÜBA — Antep\'in İşgali ve Kurtuluşu', pusula: 'Gaziantep Pusula — gün gün kronoloji', zku: 'ZKÜ Sosyal Bilimler Dergisi 3/6', ana: 'Ana hikâye metni (kaynak numaraları çözülemedi)', tbmm: 'TBMM konuşması (2019) ve anma içerikleri', yakar: 'H. İbrahim Yakar, yerel tarih çalışması' };

export const BOLUMLER = [
  /* =============================== PROLOG =============================== */
  { id: 'prolog', no: 0, ad: 'Prolog — Direnişten Önce Antep', donem: 'Aralık 1918 – Kasım 1919', sahneler: [
    { id: 'p01', ad: 'Son Normal Gün', tarih: '17 Aralık 1918', mekan: 'Çarşı sokağı, çeşme, Millet Hanı, Alaüddevle Camii', olay: 'İşgalden önceki son saatler; şehir hayatı.', rol: 'haberci', oynanis: ['keşif', 'konuşma', 'taşıma'],
      hedefler: ['Ustanla konuş', 'Fırıncıdan ekmek al', 'Çeşmeden su doldur', 'Siparişi Millet Hanı\'na götür', 'Alaüddevle Camii\'nin önünden geç', 'Dükkâna dön'],
      diyalog: [['Usta', 'Günaydın çırak. Fırından ekmeği al, sonra çeşmeden su getir.'], ['Fırıncı', 'Sıcak sıcak, daha yeni çıktı.']], gecis: 'Açılış kartı: "GAZİANTEP · 17 ARALIK 1918 — Bir zamanlar bu şehirde hayat vardı…"', kaynak: [K.ana], guven: 'unverified', durum: 'oyunda', not: 'Sahne kurgu; tarih gerçek.' },
    { id: 'p02', ad: 'Yabancı Askerler', tarih: '17 Aralık 1918', mekan: 'Çarşı sokağı başı', olay: 'İngiliz birliklerinin Antep\'e girişi.', rol: 'haberci', oynanis: ['gözlem', 'konuşma'],
      hedefler: ['Sokağın başındaki askerleri gör', 'İki kişiye ne olduğunu sor', 'Ustana haber ver'], diyalog: [['Mahalleli', 'Şehre asker girmiş diyorlar. Hayırlısı olsun…'], ['Usta', 'Kepengi indir. Bugün erken kapatıyoruz.']],
      gecis: 'Kart: "İŞGAL BAŞLIYOR"', kaynak: [K.kure, K.tuba], guven: 'verified', durum: 'oyunda', not: 'İngiliz askeri yer tutucu; birliklerin kimliği ve üniforması doğrulanmadı.' },
    { id: 'p03', ad: 'Bayrak Değişiyor', tarih: '25 Ekim 1919', mekan: 'Çarşı sokağı, kontrol noktası', olay: 'Fransız kuvvetlerinin İngilizlerin yerini alması.', rol: 'haberci', oynanis: ['gözlem', 'konuşma'],
      hedefler: ['Kontrol noktasındaki yeni askerleri gör', 'İki kişiyle konuş', 'Ustanla konuş'], diyalog: [['Mahalleli', 'İngiliz gitti, Fransız geldi. Dükkânlar yine erken kapanıyor.'], ['Usta', 'Değişen yalnız üniforma değil.']],
      gecis: 'Kart: "BAYRAK DEĞİŞİYOR"', kaynak: [K.kure, K.tuba], guven: 'disputed', durum: 'oyunda', not: 'Devir tarihi: 25 Ekim / 1 Kasım / 5 Kasım 1919.' },
    { id: 'p04', ad: 'Gizli Haber', tarih: '25 Ekim 1919', mekan: 'Çarşı sokağı, bahçe kapısı', olay: 'Şehrin ileri gelenleri arasında gizli haberleşme.', rol: 'haberci', oynanis: ['haber taşıma'],
      hedefler: ['Kâğıdı ihtiyara götür', 'Cevabı bahçe kapısındaki adama ilet', 'Ustana dön'], diyalog: [['İhtiyar', 'Cevabı kâğıtla değil, sözle götüreceksin: "Pazar günü, meydanda."']],
      gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'oyunda' },
    { id: 'p05', ad: 'Halk Toplantısı', tarih: '23 Kasım 1919', mekan: 'Meydan', olay: 'Cemiyet-i İslamiye\'nin çağrısıyla işgale karşı büyük halk toplantısı.', rol: 'haberci', oynanis: ['tanıklık'],
      hedefler: ['Meydandaki toplantıya git ve dinle'], diyalog: [['Hatip', 'İşgali tanımıyoruz. Sesimizi dünyaya duyuracağız.'], ['Kalabalık', 'Tanımıyoruz!']],
      gecis: 'Kart: "Şehir artık eskisi gibi olmayacaktı."', kaynak: [K.kure, K.tuba], guven: 'verified', durum: 'oyunda', not: 'Hatip ve sözleri kurgu; toplantının yeri varsayım.' },
    { id: 'p06', ad: 'Gizli Toplantı ve Komisyonlar', tarih: 'Kasım 1919', mekan: 'Bahçeli ev, çarşı sokağı', olay: 'Heyet-i Merkeziye\'nin örgütlenmesi; 27 semt, 100\'er kişilik kadro, komisyonlar.', rol: 'haberci', oynanis: ['tanıklık', 'haber taşıma', 'taşıma'],
      hedefler: ['Esnaftan haber al', 'Gözcüye parolayı söyle', 'Toplantıyı dinle', 'Yedi komisyona yardım et'], diyalog: [['Toplantıdaki adam', 'Silah tutamayan siper kazar, erzak taşır, yaralıya bakar.']],
      gecis: '—', kaynak: [K.kure, K.ana], guven: 'verified', durum: 'oyunda', not: 'Komisyon listesi yalnız ana hikâyede. Toplantı bahçede geçer (bina içi yok).' }
  ] },

  /* =============================== DÖRT TARİHÎ HİKÂYE =============================== */
  { id: 'kirsal', no: 0.5, ad: 'Savaşa Giden Yol', donem: 'Ocak – Mart 1920', sahneler: [
    { id: 'k01', ad: 'Karabıyıklı Baskını', tarih: '20 Ocak 1920', mekan: 'Karabıyıklı (şehir dışı)', olay: 'Fransız koluna yapılan baskın; Karayılan (Molla Mehmet) öne çıkar.', rol: 'savunmaci', oynanis: ['çatışma', 'siper'],
      hedefler: ['Pusu yerine ulaş', 'İşaret gelene kadar ateş açma', 'Baskına katıl', 'Geri çekilme emrine uy'], diyalog: [['Karayılan', 'İşaret vermeden kimse kıpırdamasın.']],
      gecis: 'Karakter tanıtımı: mahalle savunmacısı', kaynak: [K.pusula, K.ana], guven: 'verified', sabit: 'Baskının sonucu ve Karayılan\'ın rolü.', durum: 'planli', sistem: ['silah', 'siper', 'dusman', 'kirsal'] },
    { id: 'k02', ad: 'Şehit Kâmil', tarih: '21 Ocak 1920', mekan: 'Şehir içi sokak', olay: 'Yerel anlatı: 14 yaşındaki Mehmet Kâmil, annesine müdahale eden askerlere karşı çıkar ve öldürülür.', rol: 'esnaf', oynanis: ['tanıklık'],
      hedefler: ['Dükkânın önünden sokaktaki kalabalığı gör', 'Olaydan sonra anneye ulaş', 'Haberi mahalleye duyur'], diyalog: [['Esnaf', 'Çocuktu daha…']],
      gecis: 'Sesler kesilir; ekranda tarih ve ad belirir.', kaynak: [K.ana], guven: 'unverified', sabit: 'Kâmil\'in ölümü değiştirilemez; oyuncu müdahale edemez.', durum: 'planli',
      kural: 'Çocuğa yönelik şiddet oynatılmaz ve ayrıntılı gösterilmez. Dokurcum\'daki 14 çocukla karıştırılmaz.' },
    { id: 'k03', ad: 'Kilis Yolu', tarih: 'Şubat 1920 (3 Şubat: Kertil)', mekan: 'Kilis–Antep yolu: Kızılburun, Kertil, Bostancık tepeleri; karargâh Acar köyü', olay: 'Şahin Bey\'in (Mehmet Sait) yolu kapatması ve Fransız ikmal kollarını durdurması.', rol: 'haberci', oynanis: ['haber taşıma', 'taşıma', 'gizlenme', 'çatışma'],
      hedefler: ['Erzak ve mesajı Acar köyündeki karargâha ulaştır', 'Konvoya görünmeden gözcü tepesine çık', 'Kertil\'de ikmal koluna yapılan saldırıya katıl'], diyalog: [['Şahin Bey', 'Bu yoldan araba geçmeyecek.']],
      gecis: 'Şehirden kırsala geçiş; at üstünde yol.', kaynak: [K.ana], guven: 'unverified', sabit: 'Yolun tutulması ve çatışmaların sonucu.', durum: 'planli', sistem: ['silah', 'siper', 'dusman', 'kirsal'] },
    { id: 'k04', ad: 'Dokurcum Değirmeni', tarih: '27–28 Mart 1920', mekan: 'Dokurcum Değirmeni', olay: 'Anlatı: yaşları 9–14 arasındaki 14 çocuk Şahin Bey\'in kuvvetlerine yiyecek götürür, dönüşte değirmende kalır ve öldürülür.', rol: 'yardimci', oynanis: ['hafıza sahnesi', 'tanıklık'],
      hedefler: ['Çocuklar için yiyecek çıkınlarını hazırla', 'Ertesi gün değirmene ulaş'], diyalog: [['Yardımcı', 'Dün buradan geçtiler. Gülüyorlardı.']],
      gecis: 'Oyuncu değirmene ulaşınca sesler kesilir; tarih ve olayın anısı belirir.', kaynak: [K.tbmm], guven: 'unverified', sabit: 'Olay tarihî bağlamından koparılamaz.', durum: 'planli',
      kural: 'Oynanabilir çocuk çatışması yapılmaz. Çocukların adları kaynaklarda yok; ad uydurulmaz.', sistem: ['kirsal'] },
    { id: 'k05', ad: 'Elmalı Köprüsü', tarih: '28 ya da 29 Mart 1920', mekan: 'Elmalı Köprüsü', olay: 'Şahin Bey\'in son çatışması ve şehadeti.', rol: 'haberci', oynanis: ['çatışma', 'siper', 'tanıklık'],
      hedefler: ['Köprüdeki siperlere mühimmat taşı', 'Şahin Bey\'in yanında savunmaya katıl', 'Emir gelince son haberi şehre götürmek üzere çekil'],
      diyalog: [['Şahin Bey', 'Düşman cesedimi çiğnemeden Antep\'e giremez.', 'atif'], ['Şahin Bey', 'Sen git. Bu haberi şehre biri götürmeli.']],
      gecis: 'Oyuncu tepeden son çatışmayı görür; ağır, saygılı kapanış. Ardından: "1 Nisan 1920".', kaynak: [K.ana, K.tuba], guven: 'disputed', sabit: 'Şahin Bey\'in Elmalı Köprüsü\'ndeki şehadeti değiştirilemez; çatışma kazanılamaz.', durum: 'planli',
      not: 'Tarih 28/29 Mart; fark korunur. Oyuncu karakter son anda haberle gönderilir (ölüm yerine ayrılık).', sistem: ['silah', 'siper', 'dusman', 'kirsal', 'gecis'] }
  ] },

  /* =============================== ANA OYUN: 11 AY =============================== */
  { id: 'b1', no: 1, ad: 'Şehir Ayağa Kalkıyor', donem: 'Nisan 1920', sahneler: [
    { id: 'b1s1', ad: 'Haberci', tarih: '1 Nisan 1920', mekan: 'Çarşı sokağı, kale ucu', olay: 'Şehir içi direnişin başlaması.', rol: 'haberci', oynanis: ['haber taşıma'], hedefler: ['Ustanla konuş', 'Pusulayı mahalle komutanına ulaştır'],
      diyalog: [['Usta', 'Dükkân kapalı artık, çırak. Bugünden sonra habercisin.']], gecis: 'Kart: "BÖLÜM 1 · NİSAN 1920"', kaynak: [K.tuba, K.kure], guven: 'verified', durum: 'oyunda' },
    { id: 'b1s2', ad: 'Barikat', tarih: '1 Nisan 1920', mekan: 'Kale ucu', olay: 'Sokaklara barikat kurulması.', rol: 'haberci', oynanis: ['taşıma', 'tahkimat'], hedefler: ['Yığından üç kez taş taşı', 'Komutana haber ver'],
      diyalog: [['Komutan', 'Bu ucu kapatacağız; elin boş durmasın.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'oyunda' },
    { id: 'b1s3', ad: 'Yaralılar', tarih: 'Nisan 1920', mekan: 'Çarşı ucu, kabaltı, bahçedeki sargı yeri', olay: 'İlk yaralıların cephe gerisine taşınması.', rol: 'haberci', oynanis: ['yaralı taşıma'], hedefler: ['İki yaralıyı sargı yerine götür'],
      diyalog: [['Yaralı', 'Bacağım… Beni burada bırakma.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'kismi', not: 'Taşıma sırasında yaralı görünmüyor; sargı yok.' },
    { id: 'b1s4', ad: 'Gizli Geçişler ve Savunma Hatları', tarih: 'Nisan 1920', mekan: 'Bahçe geçidi, kabaltı, üç nöbet yeri', olay: 'Evler arasında geçişler; yedi cephe ve 27 semt düzeni.', rol: 'haberci', oynanis: ['keşif'], hedefler: ['Kılavuzla konuş', 'İki geçidi öğren', 'Üç nöbet yerini gör', 'Komutana bildir'],
      diyalog: [['Komutan', 'Yedi cephe, yirmi yedi semt… Herkes kendi sokağını tutacak.']], gecis: 'Kart: "Şehir ayağa kalktı."', kaynak: [K.ana], guven: 'unverified', durum: 'kismi', not: 'Mazgal ve duvar delikleri yok; cephe adları ve yerleri doğrulanmadı.' }
  ] },
  { id: 'b2', no: 2, ad: 'Ateş Çemberi', donem: 'Mayıs 1920', sahneler: [
    { id: 'b2s1', ad: 'Sarımsak Tepe\'ye Haber', tarih: 'Mayıs 1920', mekan: 'Şehir – Sarımsak Tepe', olay: 'Fransızların çevredeki tepeleri tutma girişimi.', rol: 'haberci', oynanis: ['haber taşıma', 'gizlenme'], hedefler: ['Emri Sarımsak Tepe\'deki savunmacılara ulaştır', 'Mühimmat ve yiyecek taşı'],
      diyalog: [['Savunmacı', 'Fişek geldi mi? Sayıyla atıyoruz.']], gecis: 'Karakter geçişi: haberci → mahalle savunmacısı', kaynak: [K.ana], guven: 'unverified', durum: 'oyunda', sistem: ['kirsal', 'tasima', 'gecis'] },
    { id: 'b2s2', ad: 'Sarımsak Tepe', tarih: '24 Mayıs 1920', mekan: 'Sarımsak Tepe', olay: 'Karayılan\'ın son mücadelesi ve şehadeti.', rol: 'savunmaci', oynanis: ['çatışma', 'siper'], hedefler: ['Siper hattını tut', 'Yaralı arkadaşını geri çek', 'Çekilme emrine uy'],
      diyalog: [['Karayılan', 'Tepeyi bırakırsak şehir açıkta kalır.']], gecis: 'Sessiz kapanış; tarih ve ad.', kaynak: [K.ana, K.pusula], guven: 'disputed', sabit: 'Karayılan\'ın Sarımsak Tepe\'deki şehadeti değiştirilemez.', durum: 'oyunda',
      not: 'Tarih kaynaklarda ayrışıyor (24 Mayıs; Sarımsak Tepe taarruzu için 27 Nisan da veriliyor). Karayılan tek başına bütün savunmanın kahramanı olarak sunulmaz.', sistem: ['silah', 'siper', 'dusman', 'yarali', 'kirsal'] },
    { id: 'b2s3', ad: 'Bombardıman Altında', tarih: '24 Mayıs 1920', mekan: 'Şehir içi mahalle', olay: 'Ağır topçu ateşi ve sivil kayıplar.', rol: 'yardimci', oynanis: ['kurtarma', 'yaralı taşıma'], hedefler: ['Aileleri mahzene indir', 'Enkaz altındaki kişiye ulaş', 'Yaralıları cephe gerisine taşı'],
      diyalog: [['Kadın', 'Çocuklar içeride kaldı!']], gecis: 'Karakter geçişi: savunmacı → gönüllü yardımcı', kaynak: [K.ana], guven: 'unverified', durum: 'kismi', sistem: ['bombardiman', 'yarali', 'gecis'] }
  ] },
  { id: 'b3', no: 3, ad: 'Kırılgan Ateşkes', donem: 'Haziran 1920', sahneler: [
    { id: 'b3s1', ad: 'Bekirbey Camii', tarih: '30 Mayıs – Haziran 1920', mekan: 'Bekirbey Camii (sağlık yeri olarak)', olay: 'Kısa süreli ateşkes; yaralıların bakımı.', rol: 'yardimci', oynanis: ['sargı', 'taşıma'], hedefler: ['Yaralıların yarasını sar', 'Temiz bez ve ilaç getir', 'Su dağıt'],
      diyalog: [['Sağlıkçı', 'Bezi kaynatmadan getirme.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'kismi',
      not: 'Ateşkes (30 Mayıs) kaynaklarla uyumlu. Bekirbey Camii\'nin sağlık yeri olarak kullanılması yönergeden; kaynakla doğrulanmadı. Cami haritada yok.', sistem: ['sargi', 'su'] },
    { id: 'b3s2', ad: 'Nefes', tarih: 'Haziran 1920', mekan: 'Mahalle', olay: 'Ateşkes sürerken hasarın görülmesi ve erzak sayımı.', rol: 'yardimci', oynanis: ['keşif', 'taşıma'], hedefler: ['Hasarlı evlerden aileleri çıkar', 'Erzak depolarını kontrol et'],
      diyalog: [['Komşu', 'Bitti mi dersin?'], ['Yardımcı', 'Bilmem. Bugün bitti.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'oyunda' },
    { id: 'b3s3', ad: 'Yeniden', tarih: 'Haziran 1920', mekan: 'Mahalleler arası', olay: 'Çatışmaların yeniden başlaması.', rol: 'haberci', oynanis: ['haber taşıma'], hedefler: ['Çatışmanın yeniden başladığı haberini üç mahalleye götür'],
      diyalog: [['Haberci', 'Ateşkes bozuldu! Herkes yerine!']], gecis: '—', kaynak: [K.ana], guven: 'disputed', durum: 'oyunda', not: 'Ana hikâyede Haziran başı; bir kaynakta 17 Haziran.' }
  ] },
  { id: 'b4', no: 4, ad: 'Mahallelerin Nöbeti', donem: 'Temmuz 1920', sahneler: [
    { id: 'b4s1', ad: 'Nöbet', tarih: 'Temmuz 1920', mekan: 'Mahalle siperi', olay: 'Mahalle savunma ekiplerinin nöbet düzeni.', rol: 'savunmaci', oynanis: ['siper', 'çatışma'], hedefler: ['Gece nöbetini tut', 'Sızma girişimini fark et ve haber ver', 'Siperi savun'],
      diyalog: [['Nöbetçi', 'Ses gelirse ateş etme; önce parola sor.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['silah', 'siper', 'dusman'] },
    { id: 'b4s2', ad: 'Taş ve Kereste', tarih: 'Temmuz 1920', mekan: 'Mahalle içi', olay: 'Tahkimat, iaşe, sağlık ve mühimmat işlerinin mahallece yürütülmesi.', rol: 'yardimci', oynanis: ['taşıma', 'tahkimat', 'sargı'], hedefler: ['Tahkimat için taş ve kereste taşı', 'Sağlık ekibine yardım et', 'Haberleşme zincirini koru'],
      diyalog: [['Kadın', 'Kapıyı söktük, barikata götür.']], gecis: '—', kaynak: [K.kure, K.ana], guven: 'unverified', durum: 'planli' }
  ] },
  { id: 'b5', no: 5, ad: 'Ya Hürriyet Ya Ölüm', donem: 'Ağustos 1920', sahneler: [
    { id: 'b5s1', ad: 'Yeni Komutan', tarih: '8 Ağustos 1920', mekan: 'Karargâh', olay: 'Özdemir Bey\'in cepheler komutanlığını üstlenmesi; savunmanın yeniden düzenlenmesi.', rol: 'haberci', oynanis: ['haber taşıma'], hedefler: ['Yeni komuta düzenini cephelere bildir'],
      diyalog: [['Özdemir Bey', 'Her cephe kime bağlı, bugün herkes bilecek.']], gecis: '—', kaynak: [K.zku], guven: 'verified', durum: 'planli' },
    { id: 'b5s2', ad: 'Karatarla Camii', tarih: '13 Ağustos 1920', mekan: 'Karatarla Camii ve çevresi', olay: 'Teslim talebinin halkın önünde görüşülmesi; teslim olmama iradesi; beyaz bayrak yerine Türk bayrağı anlatısı.', rol: 'haberci', oynanis: ['haber taşıma', 'tanıklık'],
      hedefler: ['Toplantı haberini mahallelere taşı', 'Cami çevresindeki halkı ve askerî hareketliliği gözle', 'Kararı halka duyur'], diyalog: [['Kalabalık', 'Teslim olmayız!']],
      gecis: 'Bayrak çekilir; kart: "Ya hürriyet ya ölüm."', kaynak: [K.ana], guven: 'unverified', durum: 'planli', not: 'Karatarla Camii haritada yok; konumu doğrulanmalı.' }
  ] },
  { id: 'b6', no: 6, ad: 'Yardım Bekleyen Şehir', donem: 'Eylül 1920', sahneler: [
    { id: 'b6s1', ad: 'Enkaz', tarih: '9–10 Eylül 1920', mekan: 'Bombalanan mahalle', olay: 'Ağır bombardıman; yıkılan yapılar ve sivil kayıplar.', rol: 'yardimci', oynanis: ['kurtarma', 'yaralı taşıma', 'sargı'], hedefler: ['Yıkılmış evlerden insanları çıkarmaya çalış', 'Yaralıları güvenli alana ulaştır', 'Sağlık yerine malzeme götür'],
      diyalog: [['Yardımcı', 'Ses ver! Neredesin?']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['bombardiman', 'yarali', 'sargi'], not: 'Herkes kurtarılamaz; oyuncuya her şeyi çözme gücü verilmez.' },
    { id: 'b6s2', ad: 'Mektup', tarih: 'Eylül 1920', mekan: 'Kuşatma hattı', olay: 'Şehirden dışarıya yardım çağrıları gönderilmesi.', rol: 'haberci', oynanis: ['gizlenme', 'haber taşıma'], hedefler: ['Yardım mektubunu kuşatma hattından dışarı çıkar'],
      diyalog: [['Komutan', 'Bu kâğıt çıkmazsa kimse geldiğimizi bilmeyecek.']], gecis: 'Gece; bahçelerden ve dere yatağından geçiş.', kaynak: [K.ana], guven: 'unverified', durum: 'planli' }
  ] },
  { id: 'b7', no: 7, ad: 'Çınarlı Cephesi', donem: 'Ekim 1920', sahneler: [
    { id: 'b7s1', ad: 'Sokak Sokak', tarih: '5 ve 14 Ekim 1920', mekan: 'Çınarlı çevresi', olay: 'Çatışmaların mahallelerin içine yayılması.', rol: 'savunmaci', oynanis: ['çatışma', 'siper', 'yaralı taşıma'], hedefler: ['Çınarlı\'daki savunmacılara haber ve fişek ulaştır', 'Evler arası geçitleri kullanarak yer değiştir', 'Sokağı savun', 'Yaralı ve sivilleri koru'],
      diyalog: [['Savunmacı', 'Duvarın deliğinden geç, sokağa çıkma!']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['silah', 'siper', 'dusman', 'yarali'], not: 'Görev yerleri özgün belgelerle doğrulanacak.' }
  ] },
  { id: 'b8', no: 8, ad: 'Çember Daralıyor', donem: 'Kasım 1920', sahneler: [
    { id: 'b8s1', ad: 'İkinci Kuşatma', tarih: '21 Kasım 1920', mekan: 'Kuşatma hattındaki mahalleler', olay: 'Fransız takviyeleriyle kuşatmanın yeniden sıkılaşması.', rol: 'haberci', oynanis: ['haber taşıma', 'gizlenme'], hedefler: ['Kuşatma hattındaki mahallelere haber ulaştır', 'Yardım kuvvetleriyle ilgili haberleri topla'],
      diyalog: [['Gözcü', 'Yeni çadırlar kurmuşlar. Saydım, bitmedi.']], gecis: '—', kaynak: [K.zku, K.pusula], guven: 'verified', durum: 'planli', not: 'Bir kaynak 20 Kasım der.' },
    { id: 'b8s2', ad: 'Tayın', tarih: '28 Kasım 1920', mekan: 'Erzak deposu, çarşı', olay: 'Erzakın kritik seviyeye inmesi; iaşe paylarının azaltılması.', rol: 'esnaf', oynanis: ['dağıtım'], hedefler: ['Depodaki erzakı say', 'Azaltılmış payları dağıt', 'İtiraz edenlere durumu anlat'],
      diyalog: [['Esnaf', 'Dün bir okkaydı, bugün yarım. Yarın ne olur bilmem.']], gecis: 'Karakter geçişi: haberci → esnaf', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['su', 'gecis'] }
  ] },
  { id: 'b9', no: 9, ad: 'Son Erzak', donem: 'Aralık 1920', sahneler: [
    { id: 'b9s1', ad: 'Ekmek', tarih: 'Aralık 1920', mekan: 'Fırın önü, mahalle', olay: 'Günlük hayatın mücadeleye dönüşmesi.', rol: 'esnaf', oynanis: ['dağıtım', 'taşıma'], hedefler: ['Ekmek ve un dağıtımına katıl', 'Yaşlılara ve çocuklara pay ulaştır', 'Kalan hayvanların yem durumuna bak'],
      diyalog: [['Yaşlı kadın', 'Benimkini torunuma ver.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['su', 'aclik'] },
    { id: 'b9s2', ad: 'Atölye', tarih: 'Aralık 1920', mekan: 'Mühimmat tamir atölyesi', olay: 'Gizli haberleşme (kuryeler, güvercinler) ve mühimmat atölyeleri.', rol: 'haberci', oynanis: ['taşıma', 'haber taşıma'], hedefler: ['Atölyeye malzeme taşı', 'Haberi gizlice ilet'],
      diyalog: [['Usta', 'Boş kovanı atma; dolduracağız.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'planli' }
  ] },
  { id: 'b10', no: 10, ad: 'Açlığın İçinde', donem: 'Ocak 1921', sahneler: [
    { id: 'b10s1', ad: 'Son Un', tarih: '1 Ocak 1921', mekan: 'Bir ev, komşu ev', olay: 'Ağır açlık, kar ve soğuk.', rol: 'yardimci', oynanis: ['taşıma', 'tanıklık'], hedefler: ['Ailenin kalan ununu ölçmesine yardım et', 'Bir avuç unu komşu eve götür'],
      diyalog: [['Anne', 'Yarısını onlara götür. Onların hiç yok.']], gecis: 'Kar; sessiz sokak.', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['aclik'] },
    { id: 'b10s2', ad: 'Zerdali Çekirdeği', tarih: '10–12 Ocak 1921', mekan: 'Avlu, sağlık yeri', olay: 'Acı zerdali çekirdeğinin öğütülüp una karıştırılması; zehirlenmeler (40–50 ölüm aktarımı).', rol: 'yardimci', oynanis: ['tanıklık', 'yaralı taşıma'], hedefler: ['Çekirdek kıran ve öğüten ailelere tanık ol', 'Zehirlenenleri sağlık yerine taşı'],
      diyalog: [['Kadın', 'Acı ama karın doyuruyor.']], gecis: '—', kaynak: [K.yakar, K.ana], guven: 'unverified', durum: 'planli', sistem: ['aclik', 'yarali'],
      kural: '"Şeftali" değil acı zerdali çekirdeği (ve acı badem). Ölüm sayısı tek kaynağa dayanır; kesin sayı gibi sunulmaz.' },
    { id: 'b10s3', ad: 'Hayvanların Sonu', tarih: 'Ocak 1921', mekan: 'Han avlusu', olay: 'Ölmüş at ve eşeklerin etine yönelinmesi; taşıma ve iş gücünün de yok olması.', rol: 'esnaf', oynanis: ['tanıklık'], hedefler: ['Han avlusundaki duruma tanık ol', 'Son hayvanın sahibiyle konuş'],
      diyalog: [['Hamal', 'Yirmi yıl yükümü taşıdı.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['aclik'], not: '"Atın önündeki yem" ifadesi doğrulanamadı; kullanılmaz.' },
    { id: 'b10s4', ad: 'Kar ve Yardım', tarih: '18–25 Ocak 1921', mekan: 'Şehir kenarı', olay: 'Başarısız yardım ve takviye girişimleri.', rol: 'haberci', oynanis: ['bekleme', 'haber taşıma'], hedefler: ['Karda haberciyi bekle', 'Gelen haberi şehre götür', 'Son haberleşme yolunu koru'],
      diyalog: [['Haberci', 'Gelemiyorlar. Yol kapalı.']], gecis: '—', kaynak: [K.ana], guven: 'unverified', durum: 'planli', sistem: ['aclik'] }
  ] },
  { id: 'b11', no: 11, ad: 'Son Gün', donem: 'Şubat 1921', sahneler: [
    { id: 'b11s1', ad: 'Huruç', tarih: '5–7 Şubat 1921', mekan: 'Kuşatma hattı', olay: 'Savunmacıların kuşatmayı yararak şehirden çıkma girişimi.', rol: 'savunmaci', oynanis: ['gizlenme', 'çatışma'], hedefler: ['Gece toplanma yerine ulaş', 'Hattı yarmaya çalışan kola katıl', 'Geride kalanlara veda et'],
      diyalog: [['Savunmacı', 'Çıkabilen çıksın. Kalan, şehri teslim edecek.']], gecis: 'Karakter geçişi: savunmacı → esnaf (savunmacıdan bir daha haber alınmaz)', kaynak: [K.kure, K.ana], guven: 'verified', sabit: 'Çıkışın sonucu ve şehrin teslimi.', durum: 'planli', sistem: ['silah', 'siper', 'dusman', 'gecis'] },
    { id: 'b11s2', ad: 'Teslim', tarih: '8–9 Şubat 1921', mekan: 'Şeyh Fethullah Camii çevresi', olay: 'Teslim meselesinin görüşülmesi; 9 Şubat sabahı protokolün imzalanması.', rol: 'esnaf', oynanis: ['tanıklık'], hedefler: ['Cami çevresindeki bekleyişe katıl', 'Protokolün imzalandığı haberini al', 'Dükkânının önüne dön'],
      diyalog: [['Esnaf', 'Aç kaldık, teslim olmadık. Bugün ekmek bitti.']], gecis: 'Kart: "9 Şubat 1921". Sessizlik; yıkılmış şehir.', kaynak: [K.kure, K.tuba, K.ana], guven: 'disputed', sabit: '9 Şubat 1921 teslimi değiştirilemez.', durum: 'planli',
      not: '8/9 Şubat ayrımı; "sabah 10.00" ve Şeyh Fethullah Camii yalnız ana hikâyede. Gazi unvanı: 6 Şubat kabul, 8 Şubat yürürlük.' }
  ] },

  /* =============================== EPİLOG =============================== */
  { id: 'epilog', no: 12, ad: 'Epilog — Bir Şehir Sustu', donem: 'Şubat – Aralık 1921', sahneler: [
    { id: 'e01', ad: 'İşgal Altında', tarih: 'Şubat – Ekim 1921', mekan: 'Çarşı', olay: 'Teslimden sonra Fransız idaresi; tutuklamalar; halkın Fransızlara tahıl ve kereste satmayı reddetmesi.', rol: 'esnaf', oynanis: ['tanıklık', 'konuşma'], hedefler: ['Dükkânı yeniden aç', 'Fransız satın alma memuruna mal satmayı reddet'],
      diyalog: [['Esnaf', 'Malım var. Sana yok.']], gecis: '—', kaynak: [K.tuba], guven: 'unverified', durum: 'planli', not: 'Bu dönem için bulunan bilgi az ve tek kaynağa dayanıyor.' },
    { id: 'e02', ad: 'Ankara Antlaşması', tarih: '20 Ekim 1921', mekan: 'Çarşı', olay: 'Antlaşma haberi şehre ulaşır; Güney Cephesi kapanır.', rol: 'esnaf', oynanis: ['tanıklık'], hedefler: ['Haberi getiren yolcuyu dinle'], diyalog: [['Yolcu', 'İmzalamışlar. Gidecekler.']],
      gecis: '—', kaynak: [K.tuba, K.kure], guven: 'verified', durum: 'planli' },
    { id: 'e03', ad: '25 Aralık 1921', tarih: '25 Aralık 1921', mekan: 'Prologdaki çarşı sokağı', olay: 'Son Fransız askerlerinin şehri terk etmesi.', rol: 'esnaf', oynanis: ['keşif', 'tanıklık'], hedefler: ['Prologda dolaştığın sokağı baştan sona yürü'],
      diyalog: [], gecis: 'Kapalı dükkânlar, hasarlı evler, dönmeyenler. Kart: "Bir şehir sustu. Ama unutmadı."', kaynak: [K.tuba, K.kure], guven: 'verified', sabit: '25 Aralık 1921 kurtuluşu.', durum: 'kismi', not: 'Tarih ve "Kurtuluş" dönemi oyunda; sahne ve hasarlı şehir yok.' }
  ] }
];

/** özet sayılar (Günlük ve belgeler için) */
export function ozet() { const S = BOLUMLER.flatMap(b => b.sahneler); const say = k => S.filter(s => s.durum === k).length; return { bolum: BOLUMLER.length, sahne: S.length, oyunda: say('oyunda'), kismi: say('kismi'), planli: say('planli') }; }
