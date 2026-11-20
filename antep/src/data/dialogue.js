// NPC konuşma metinleri (yazılı; seslendirme yok). Gündelik, döneme aykırı düşmeyecek genel sözler — tarihî olay iddiası içermez.
// SOHBET: karşılaşan iki sakin arasında sırayla söylenir. SELAM: oyuncu E ile konuştuğunda role göre. SESLENME: esnafın müşteri çağırması.
export const SOHBET = [
  ['Selamünaleyküm.', 'Aleykümselam, hayırlı işler.', 'Çarşı bugün kalabalık.', 'Öyle, bereketli olsun.'],
  ['Hava da iyice ısındı.', 'Bahar geldi sayılır.', 'Bağlara çıkma vakti yakın.'],
  ['Çocuklar nasıl?', 'Şükür, iyiler. Seninkiler?', 'Onlar da iyi, ellerinden öperler.'],
  ['Un yine pahalanmış.', 'Her şey pahalı bu günlerde.', 'Allah sonumuzu hayır etsin.'],
  ['Çeşmenin suyu azalmış diyorlar.', 'Sabah erken gidince doluyor.', 'Yarın erkenden giderim öyleyse.'],
  ['Akşama bize buyurun.', 'Zahmet olmasın.', 'Ne zahmeti, bekleriz.'],
  { isgal: true, satirlar: ['Askerler yine devriyedeydi.', 'Gördüm. Sessiz olalım.', 'Haklısın, yürü gidelim.'] },   // yalnız işgal dönemlerinde
  ['Bakırcıdan kazanı aldın mı?', 'Kalayı bitmemiş, yarına kaldı.', 'İyi usta, acele ettirme.'],
  // kuşatma dönemi (1 Nisan 1920 – 9 Şubat 1921)
  { kusatma: true, satirlar: ['Yine silah sesi geliyor.', 'Kale tarafından.', 'Çocukları içeri al.'] },
  { kusatma: true, satirlar: ['Barikata taş lazımmış.', 'Avludaki yıkık duvarı sökelim.', 'Haydi, elbirliğiyle.'] },
  { kusatma: true, satirlar: ['Sokaktan geçme, görürler.', 'Bahçelerin içinden giderim.', 'Dikkat et.'] }
];
export const SELAM = {
  esnaf: ['Buyur ağam, ne lazımdı?', 'Hoş geldin. Mal taze, bak istersen.', 'Pazarlık sünnettir, gel konuşalım.', 'Bugün işler durgun, sen siftah ol.'],
  gezen: ['Selamünaleyküm.', 'Hayırlı günler.', 'Yabancı mısın buralarda?', 'Uzun Çarşı ileride, dümdüz git.'],
  sucu: ['Çeşmeden geliyorum, yol ver hele.', 'Su taşımakla gün bitiyor.', 'Hayırlı günler.'],
  evkadini: ['Bulguru eliyorum, tozu kaçmasın gözüne.', 'İşim başımdan aşkın evladım.', 'Hayırlı günler.'],
  cocuk: ['Amca, sen kimsin?', 'Bizimle oynar mısın?', 'Kaleye çıktın mı hiç?', 'Anam çağırır şimdi, gitmem lazım.'],
  yasli: ['Otur evladım, soluklan.', 'Biz bu sokakları başka türlü bilirdik.', 'Sabır evladım, her şeyin başı sabır.', 'Allah selamet versin.'],
  hamal: ['Yol ver, yük ağır!', 'Hana kadar taşıyacağım daha.', 'Destur!'],
  muzisyen: ['Bir taksim geçeyim mi?', 'Udun teli nazlıdır, soğukta bozulur.', 'Dinlersen çalarız.'],
  devriye: ['Circulez.  — «Dağılın.»', 'Halte !  — «Dur!»', 'Rien à signaler.  — «Bildirecek bir şey yok.»']
};
export const SESLENME = ['Buyurun, buyurun!', 'Taze geldi, taze!', 'Bakır kazan, kalaylı sahan!', 'Gel vatandaş, ucuz verdim!', 'Baharat, kırmızı biber!'];
