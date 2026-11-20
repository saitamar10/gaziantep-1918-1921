// Tarihî referans kaydı.
// status: 'verified'  -> konumu/özelliği kaynakla doğrulanmış
//         'assumption'-> tasarım varsayımı (kaynakla doğrulanmadı; haritada farklı işaretlenir)
import { MapCoordinates } from '../core/MapCoordinates.js';

export const SOURCES = {
  ke: { title: 'Kültür Envanteri (yapı koordinatları ve kısa bilgiler)', url: 'https://kulturenvanteri.com/bolge/turkiye/guneydogu-anadolu-bolgesi/gaziantep/' },
  kure: { title: 'Küre Ansiklopedi — Gaziantep Kalesi', url: 'https://kureansiklopedi.com/tr/detay/gaziantep-kalesi-2' },
  wikiCastle: { title: 'Wikipedia — Gaziantep Castle', url: 'https://en.wikipedia.org/wiki/Gaziantep_Castle' },
  wikiCTC: { title: 'Wikipedia — Central Turkey College', url: 'https://en.wikipedia.org/wiki/Central_Turkey_College' },
  hmMap: { title: 'Houshamadyan — Ayntab şehir planı (1919–1920 yaklaşık)', url: 'https://www.houshamadyan.org/tur/haritalar/halep-vilayeti/ayntab.html' },
  hmSchools: { title: 'Houshamadyan — Ayntab okulları VI (Azariah Smith Hastanesi)', url: 'https://www.houshamadyan.org/mapottomanempire/vilayetaleppo/ayntab/education/schools-vi.html' },
  ntvHan: { title: 'NTV — Gaziantep’in tarihî han ve bedestenleri', url: 'https://www.ntv.com.tr/seyahat/galeri-gaziantepin-tarihi-han-ve-bedestenleri,IUIZEsGx00i7wP72Ng9jYg' },
  tuba: { title: 'TÜBA — Millî Mücadele Yerel Tarihi c.4, Antep', url: 'https://tuba.gov.tr/en/publications/non-periodical-publications/history/local-history-of-the-national-struggle-1918-1923-vol-4-adana-kahramanmaras-sanliurfa-kilis-gaziantep-hatay-mersin-osmaniye/occupation-and-liberation-of-antep' }
};

// lat/lon değerleri Kültür Envanteri sayfalarındaki harita bağlantılarından alınmıştır (günümüz konumları).
const RAW = [
  { id: 'kale', name: 'Gaziantep Kalesi', type: 'kale', lat: 37.0664024, lon: 37.3835030, status: 'verified', src: ['ke', 'kure', 'wikiCastle'],
    facts: 'Höyük üzerinde, dairesel planlı; hendek ve köprüyle geçilir; bugün 12 burç (Evliya Çelebi 36 burç sayar); Alleben Deresi kıyısında.',
    assumptions: 'Ölçüler: höyük tabanı ~177×145 m, üst düzlük ~114×98 m, 12 burç (genişlik 6–7 m, çıkıntı 3–4 m, yükseklik ≤10 m). Höyük yüksekliği, kapının yönü (güney), burç biçimleri, yıkık kesimlerin yeri ve hendek ölçüleri tasarım varsayımı. Wikipedia çevreyi 1.200 m verir; bu, yakındaki doğrulanmış hanların konumuyla çelişir — rölöveyle kontrol edilmeli.' },
  { id: 'millet', name: 'Millet (Lala Mustafa Paşa) Hanı', type: 'han', lat: 37.0648133, lon: 37.3844388, status: 'verified', src: ['ke'],
    facts: '1571–72; 18×24 m avlu; iki katlı; zemin kat güneyi ahır.', dims: { w: 42, d: 46, court: [18, 24], floors: 2 } },
  { id: 'tahtani', name: 'Tahtani Camii', type: 'cami', lat: 37.0650558, lon: 37.3847351, status: 'verified', src: ['ke'],
    facts: '1557’de belgelenir; 1563 ve 1804 onarımları; taç kapı.' },
  { id: 'yuzukcu', name: 'Yüzükçü Hanı', type: 'han', lat: 37.0636902, lon: 37.3851051, status: 'verified', src: ['ke'],
    facts: '18. yy; taç kapı ve kitabe.', assumptions: 'Plan ve kat sayısı varsayım.', dims: { w: 34, d: 34, court: [14, 14], floors: 2 } },
  { id: 'alauddevle', name: 'Alaüddevle Camii', type: 'cami', lat: 37.0633736, lon: 37.3849030, status: 'verified', src: ['ke'],
    facts: '1515 öncesi; 1901–1903 tek kubbeli olarak yeniden inşa; siyah-beyaz taş cephe. 1919’da yeni hâliyle mevcut.', dome: 1, ablak: 1 },
  { id: 'zincirli', name: 'Zincirli Bedesten', type: 'bedesten', lat: 37.0629807, lon: 37.3854027, status: 'verified', src: ['ke', 'ntvHan'],
    facts: '18. yy ilk çeyreği; kuzey-güney ve doğu-batı kesişen iki kol; tek katlı; 5 kapı.', assumptions: 'Sonradan eklenen adliye katının tarihi bilinmiyor; 1919 için tek kat kabul edildi.' },
  { id: 'tutun', name: 'Tütün Hanı', type: 'han', lat: 37.0619621, lon: 37.3870964, status: 'verified', src: ['ke'],
    facts: '18. yy (1754 belgeleri).', assumptions: 'Plan varsayım.', dims: { w: 32, d: 30, court: [14, 12], floors: 2 } },
  { id: 'bakircilar', name: 'Bakırcılar Çarşısı (arasta)', type: 'carsi', lat: 37.0615224, lon: 37.3869672, status: 'verified', src: ['ke'],
    facts: '19. yy arasta.' },
  { id: 'omeriye', name: 'Ömeriye Camii', type: 'cami', lat: 37.0637283, lon: 37.3800926, status: 'verified', src: ['ke'], facts: 'Kitabesine göre Selçuklu dönemi; minare.' },
  { id: 'alinacar', name: 'Ali Nacar Camii', type: 'cami', lat: 37.0673939, lon: 37.3812243, status: 'verified', src: ['ke'], facts: '14. yy; şadırvan ve güneş saati.' },
  { id: 'seyhfethullah', name: 'Şeyh Fethullah Camii', type: 'cami', lat: 37.0593758, lon: 37.3911896, status: 'verified', src: ['ke'],
    facts: '1564; renkli taş işçiliği; kısa, tek şerefeli minare; külliye (medrese, hamam).', ablak: 1 },
  { id: 'kendirli', name: 'Kendirli Kilisesi', type: 'kilise', lat: 37.0627899, lon: 37.3756828, status: 'verified', src: ['ke'],
    facts: '1898’de başladı, 1902’de açıldı; dikdörtgen plan, kırma çatı; siyah kesme taş temel üzerinde beyaz kesme taş; geniş bahçe; 1919’da yeniden ibadete açıldı.' },
  { id: 'meryemana', name: 'Surp Asdvadzadzin (Meryem Ana) Katedrali', type: 'katedral', lat: 37.0602722, lon: 37.3757133, status: 'verified', src: ['ke'],
    facts: '19. yy Ermeni Apostolik katedrali (bugün Kurtuluş Camii); kubbeli.', assumptions: 'Çan kulesi ve cephe düzeni varsayım.' },
  // ---- 19 Kasım 2026: kullanıcının adres araştırması + Kültür Envanteri koordinatı (OpenStreetMap bina merkeziyle 4–7 m içinde tutuyor)
  { id: 'kozanli', name: 'Kozanlı Camii', type: 'cami', lat: 37.0577698, lon: 37.3763962, status: 'verified', src: ['ke'], ablak: 1,
    facts: '1647 ve 1654 sicillerinde mescit olarak geçer (Kültür Portalı); kalın, kısa, burmalı gövdeli, tek şerefeli minare; giriş siyah-beyaz taş. 1920 tarihli fotoğrafta minarenin şerefesi parçalanmış, gövdesinde delikler görülür (Millî Mücadele Albümü / TÜBA yayını EK 5; altyazı tahribatı Fransızlara atfeder).',
    assumptions: 'Yapının ölçüleri, avlu düzeni ve minarenin tam biçimi varsayım. Hasarın hangi ay oluştuğu bilinmiyor; oyunda Temmuz 1920 kademesine konuldu.' },
  { id: 'handaniye', name: 'Handaniye (Handan Bey) Camii', type: 'cami', lat: 37.0648575, lon: 37.3822632, status: 'verified', src: ['ke'], ablak: 1,
    facts: '16. yy, 1791’de yeniden yapıldı (Şahinbey Belediyesi); minare kübik altlıklı, onikigen gövdeli. Belediye: «Antep Savunması’nda cami ibadet yapılamayacak duruma gelmişti.» 1920 tarihli fotoğrafta minarenin külahı yok, şerefe korkuluğu kırık (Millî Mücadele Albümü / TÜBA yayını EK 6; altyazı tahribatı Fransızlara atfeder).',
    assumptions: 'Yapının ölçüleri ve avlu düzeni varsayım. Hasarın hangi ay oluştuğu bilinmiyor; oyunda Temmuz 1920 kademesine konuldu.' },
  // ---- konumu varsayım olanlar ----
  { id: 'kolej', name: 'Central Turkey College (Amerikan Koleji)', type: 'kolej', lat: null, lon: null, x: -1700, z: 1160, status: 'assumption', src: ['wikiCTC', 'hmMap'],
    facts: 'Şehrin batısında ayrı bir sahada (Wikipedia); 1891 yangınından sonra yeniden inşa edildi.', assumptions: 'Konum, Houshamadyan planındaki (61) yerinden iki çapalı ölçekle türetildi (bkz. PLAN_GEOREF). Bina sayısı, kat yükseklikleri ve çatı biçimi varsayım; tarihî fotoğraflarla eşleştirilecek parametrik yapı.' },
  { id: 'hastane', name: 'Azariah Smith Amerikan Hastanesi', type: 'hastane', lat: null, lon: null, x: -905, z: 729, status: 'assumption', src: ['hmSchools', 'hmMap'],
    facts: 'Eski şehrin hemen dışında, Hayik tepesinin Tepebaşı zirvesinde; iki katlı kalker taşı bina; şehrin batı sınırında.', assumptions: 'Konum Houshamadyan planındaki (30) yerinden türetildi; Tepebaşı/Meryem Ana yakınlığı kaynakla uyumlu.' }
];

export const LANDMARKS = RAW.map(l => { const p = l.lat ? MapCoordinates.toLocal(l.lat, l.lon) : { x: l.x, z: l.z }; return { ...l, x: p.x, z: p.z }; });
export const L = Object.fromEntries(LANDMARKS.map(l => [l.id, l]));

// Houshamadyan planının (1919–1920 yaklaşık, batı mahalleleri) yerel koordinata oturtulması — VARSAYIM
// Çapalar: (37) Meryem Ana Kilisesi = Surp Asdvadzadzin (doğrulanmış koordinat) ve (7) Latin Manastırı ≈ Kendirli Kilisesi çevresi (Katolik yapı; özdeşleştirme varsayım).
// Ölçek ≈ 1,64 m/piksel, döndürme yok. Plan piksel koordinatları houshamadyan.org'daki 1140 px genişlikteki plandan okunmuştur.
export const PLAN_GEOREF = { anchorPx: [785, 355], anchorXZ: [-692, 680], scale: 1.64 };
const fromPlan = (px, py) => ({ x: PLAN_GEOREF.anchorXZ[0] + (px - PLAN_GEOREF.anchorPx[0]) * PLAN_GEOREF.scale, z: PLAN_GEOREF.anchorXZ[1] + (py - PLAN_GEOREF.anchorPx[1]) * PLAN_GEOREF.scale });
export const NEIGHBORHOODS = [
  ['Kırkayak', 480, 215], ['Akyol', 540, 195], ['İncirlipınar', 700, 85], ['Ayn Leben', 530, 60], ['Bostan Arası', 690, 25], ['Çukur Bostan', 960, 270], ['Balıklı', 1015, 435], ['İbn Eyüp', 905, 315], ['Kürt Mahallesi', 740, 600], ['Musullu Sokağı', 1090, 600], ['Paşa Sokağı', 690, 560]
].map(([n, px, py]) => ({ name: n, ...fromPlan(px, py), status: 'assumption', src: 'hmMap' }));

// Varsayım olarak işaretlenen genel kararlar (harita lejantında gösterilir)
export const GLOBAL_ASSUMPTIONS = [
  'Sokak ağı: Ana akslar doğrulanmış yapıları birbirine bağlayan tasarım varsayımıdır; ara sokaklar prosedüreldir. Gerçek 1919 sokak dokusu, dönem haritalarıyla güncellenecek.',
  'Alleben Deresi’nin yatağı yaklaşık çizildi: batıda Houshamadyan planının üst kenarındaki dere çizgisi, doğuda kalenin kuzeyi (Ali Nacar Camii kuzey yakada kalır).',
  'Arazi yükseklikleri temsilîdir (kale höyüğü, dere vadisi, batıdaki Hayik/Tepebaşı yükseltisi).',
  'Şehir sınırı ve mahalle yayılımı varsayımdır; konut sayısı 1910’ların nüfus ölçeğine göre ayarlandı.',
  'Bölge dışı yollar (Maraş, Kilis, Halep yönleri) yön olarak temsilîdir.',
  'Doğrulanmış yapı koordinatları günümüz konumlarıdır; 1919’da var oldukları kaynaklarla kontrol edilmiştir.'
];
