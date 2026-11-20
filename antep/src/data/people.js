// Sokaktaki kişilerin kimliği: ad, cemaat, meslek. Hepsi KURMACA kişilerdir; adlar dönemde yaygın adlardan seçilmiştir.
// Cemaat (Türk / Ermeni) bir kimlik bilgisidir, tutum bilgisi DEĞİLDİR: kimin ne yaptığı kişiye bağlıdır, cemaate değil
// (bkz. docs/hikaye-ana-dosya.md §11). Antep Ermenilerinin büyük çoğunluğu gündelik hayatta Türkçe konuşurdu; bu yüzden
// sokaktaki konuşmalar ortaktır. ORAN VARSAYIMDIR: çarşı çevresinde yaklaşık yedide bir; mahalle bazlı nüfus verisi yok.
export const ADLAR = {
  turk: { e: ['Mehmet', 'Ali', 'Hasan', 'Hüseyin', 'Mustafa', 'Ahmet', 'İbrahim', 'Ökkeş', 'Kâmil', 'Sait', 'Bekir', 'Şakir', 'Abdullah', 'Memik', 'Halil', 'Ömer', 'Yusuf', 'Hamdi'],
    k: ['Ayşe', 'Fatma', 'Emine', 'Zeynep', 'Hatice', 'Elif', 'Döne', 'Zeliha', 'Havva', 'Meryem', 'Şerife', 'Hanife'] },
  ermeni: { e: ['Artin', 'Garabed', 'Hagop', 'Krikor', 'Sarkis', 'Nazaret', 'Bedros', 'Hovsep', 'Avedis', 'Kevork', 'Levon', 'Minas'],
    k: ['Mariam', 'Araksi', 'Siranuş', 'Hripsime', 'Azniv', 'Takuhi', 'Yeğsa', 'Verjin'] }
};
export const MESLEK = { esnaf: 'esnaf', gezen: 'çarşı ahalisi', ambient: 'mahalleli', sucu: 'su taşıyan', evkadini: 'ev kadını', cocuk: 'çocuk', yasli: 'mahalle büyüğü', hamal: 'hamal', muzisyen: 'udi', devriye: 'asker', sabit: 'mahalleli' };
export const UNVAN = { K01: ['Hacı', 'Usta'], K06: [''], K04: [''], K12: ['Nine'], K03: ['Hanım'], K05: ['Hanım'], K11: [''] };
export const ERMENI_ORANI = 1 / 7;

/** Bir sakin için kimlik üretir. story: hikâye karakteri (prologdaki usta, heyet üyeleri vb.) her zaman Türk yazılmıştır. */
export function kimlikUret(a, def, R) {
  if (def.family === 'soldier') { const k = a.def === 'K15' ? 'İngiliz' : 'Fransız'; return { ad: null, cemaat: k, meslek: a.def === 'K10' ? 'subay' : 'asker', etiket: k + (a.def === 'K10' ? ' subayı' : ' askeri') }; }
  const kadin = def.family === 'female' || a.def === 'K12', cocuk = def.family === 'child';
  const cemaat = (a.story || a.role === 'esnaf' && a.id === 0) ? 'turk' : (R() < ERMENI_ORANI ? 'ermeni' : 'turk');
  const havuz = ADLAR[cemaat][kadin ? 'k' : 'e']; let ad = havuz[Math.floor(R() * havuz.length)];
  if (cemaat === 'turk' && !cocuk) { const u = UNVAN[a.def]; if (u && u[0]) ad = kadin ? ad + ' ' + u[0] : (R() < .35 ? u[0] + ' ' + ad : ad + (a.role === 'esnaf' ? ' Usta' : ' Efendi')); else if (!kadin) ad += a.role === 'hamal' ? '' : ' Efendi'; }
  if (cemaat === 'ermeni' && !cocuk) ad = kadin ? ad + ' Hanım' : ad + (a.role === 'esnaf' ? ' Usta' : ' Efendi');
  const meslek = a.tag === 'firinci' ? 'fırıncı' : a.tag === 'demirci' ? 'demirci' : a.tag === 'gozcu' ? 'kapıdaki adam' : a.tag === 'hatip' ? 'hatip' : MESLEK[a.role] || 'mahalleli';
  const cAd = cemaat === 'turk' ? 'Türk' : 'Ermeni';
  return { ad, cemaat: cAd, meslek, etiket: `${ad} · ${meslek} · ${cAd}` };
}
