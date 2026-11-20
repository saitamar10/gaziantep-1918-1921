// Harita tasarım bölgeleri. Çokgenler yerel metre (x doğu, z güney).
// status: verified = bölgenin varlığı/çekirdeği kaynakla doğrulanmış yapılara dayanıyor; sınırlar her durumda tasarım varsayımıdır.
export const REGIONS = [
  { id: 'kale', no: 1, name: 'Gaziantep Kalesi ve çevresi', color: '#b5874a', status: 'verified',
    poly: [[-170, -150], [170, -150], [190, 60], [150, 150], [-150, 150], [-190, 60]] },
  { id: 'carsi', no: 2, name: 'Tarihî çarşı bölgesi', color: '#c0583a', status: 'verified',
    poly: [[40, 140], [200, 120], [380, 420], [380, 600], [250, 620], [60, 420]] },
  { id: 'konut', no: 3, name: 'Geleneksel konut mahalleleri', color: '#d9c38d', status: 'assumption',
    poly: [[-1300, 260], [-300, 160], [40, 620], [700, 520], [900, 820], [400, 1150], [-500, 1200], [-1250, 1100]] },
  { id: 'sokak', no: 4, name: 'Dar sokaklar ve geçitler', color: '#a9926b', status: 'assumption',
    poly: [[-1250, 380], [-380, 420], [-300, 900], [-1100, 1000]] },
  { id: 'han', no: 5, name: 'Hanlar ve ticaret alanları', color: '#9b4a2f', status: 'verified',
    poly: [[60, 150], [180, 140], [360, 470], [340, 560], [240, 560], [70, 300]] },
  { id: 'dini', no: 6, name: 'Camiler ve dinî yapılar (dağınık)', color: '#6d7f99', status: 'verified', poly: null },
  { id: 'kolej', no: 7, name: 'Central Turkey College çevresi', color: '#7a5aa0', status: 'assumption',
    poly: [[-1860, 1030], [-1540, 1030], [-1540, 1290], [-1860, 1290]] },
  { id: 'dis', no: 8, name: 'Dış mahalleler', color: '#8f9e6a', status: 'assumption',
    poly: [[-1450, 250], [-1050, 200], [-1100, 900], [-1450, 820]] },
  { id: 'tarim', no: 9, name: 'Tarımsal alanlar ve şehir girişleri', color: '#6f8b45', status: 'assumption', poly: null }
];
