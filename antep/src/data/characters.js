// Karakter arketipleri — KAYNAK: kullanıcının tasarım paftası (docs/ref/karakter-paftasi.webp, kırpımlar docs/ref/Kxx_*.png).
// Kıyafet, eşya ve renkler paftadan okunmuştur. status: 'design' = tasarım onaylı, 3B model bekleniyor
// (oyundaki figürler yer tutucu mankendir; gerçek GLB gelince assets/characters/manifest.json ile değişir).
// family -> hareket seti: male | female | child | elder | soldier
export const CHARACTERS = {
  K01: { name: 'Yaşlı esnaf', family: 'elder', height: 1.68, build: 1.08, status: 'design',
    outfit: { head: 'fes', headC: '#8a2a22', top: 'aba', topC: '#4a3226', shirtC: '#cdbf9f', bottom: 'salvar', botC: '#3b2a22', sash: true, sashC: '#8e2f25', boots: true, skin: '#b98a66', beard: '#dcd8cf', moustache: '#dcd8cf' } },
  K02: { name: 'Şehirli erkek', family: 'male', height: 1.74, build: 1.0, status: 'design',
    outfit: { head: 'fes', headC: '#8a2a22', top: 'suit', topC: '#2e2622', shirtC: '#3a302b', bottom: 'salvar', botC: '#2a2421', sash: true, sashC: '#b9ae98', skin: '#b88a66', moustache: '#2a2422', hair: '#2a2422' } },
  K03: { name: 'Ev kadını', family: 'female', height: 1.58, build: 1.0, status: 'design',
    outfit: { head: 'scarf', headC: '#d9cdc0', top: 'shirt', topC: '#cfc5b2', armC: '#cfc5b2', bottom: 'skirt', botC: '#c9bfae', apron: true, apronC: '#7a4a2c', skin: '#c09570', prop: 'sieve' } },
  K04: { name: 'Çocuk', family: 'child', height: 1.26, build: .9, status: 'design',
    outfit: { head: 'hair', headC: '#2a2320', top: 'jacket', topC: '#2f3a52', bottom: 'shorts', botC: '#9a8c6c', sash: true, sashC: '#a8683a', boots: true, skin: '#b98a64' } },
  K05: { name: 'Su taşıyan kadın', family: 'female', height: 1.60, build: .96, status: 'design',
    outfit: { head: 'scarf', headC: '#d6b8ae', top: 'jacket', topC: '#7a3a34', stripes: '#c9b9a4', bottom: 'skirt', botC: '#2e2a3a', apron: true, apronC: '#cfc6b6', skin: '#bf9470', prop: 'jug' } },
  K06: { name: 'Hamal', family: 'male', height: 1.76, build: 1.2, status: 'design',
    outfit: { head: 'band', headC: '#2c3038', top: 'shirt', topC: '#cdbfa3', armC: '#cdbfa3', bottom: 'salvar', botC: '#6f7582', sash: true, sashC: '#b8a888', shinC: '#a89878', skin: '#a87a56', hair: '#221d1a', moustache: '#221d1a', prop: 'sack' } },
  K07: { name: 'Müzisyen (udi)', family: 'male', height: 1.72, build: 1.0, status: 'design',
    outfit: { head: 'fes', headC: '#8a2a22', top: 'suit', topC: '#28221f', shirtC: '#c9bda6', bottom: 'salvar', botC: '#241f1d', boots: true, skin: '#b88a66', moustache: '#241f1d', beard: '#2a2421', prop: 'oud' } },
  K08: { name: 'Kuvâ-yi Milliye savaşçısı', family: 'male', height: 1.75, build: 1.05, status: 'design', military: true,
    outfit: { head: 'kalpak', headC: '#1a1716', top: 'jacket', topC: '#3a2a22', bottom: 'salvar', botC: '#33261f', beltC: '#2a1e16', shinC: '#a08a66', boots: true, skin: '#b08158', bandolier: '#6a4a2c', prop: 'rifle', moustache: '#1e1a18' } },
  K09: { name: 'Fransız piyade askeri', family: 'soldier', height: 1.72, build: 1.02, status: 'design', military: true,
    outfit: { head: 'adrian', headC: '#5f7388', top: 'greatcoat', topC: '#8497ac', bottom: 'trousers', botC: '#7f93a8', beltC: '#5a3c26', shinC: '#8d8f86', boots: true, skin: '#c99d7c', moustache: '#4a3a2c', prop: 'rifle', pouches: '#6a4528' } },
  K10: { name: 'Fransız subayı', family: 'soldier', height: 1.76, build: .98, status: 'design', military: true,
    outfit: { head: 'kepi', headC: '#b03a2c', top: 'tunic', topC: '#6f8298', bottom: 'breeches', botC: '#55647a', beltC: '#6a4528', strap: '#6a4528', boots: true, tall: true, skin: '#c99d7c', moustache: '#6a5238' } },
  K11: { name: 'Genç kadın', family: 'female', height: 1.60, build: .92, status: 'design',
    outfit: { head: 'scarf', headC: '#e2d9c6', top: 'jacket', topC: '#33291f', bottom: 'skirt', botC: '#8e97a4', sash: true, sashC: '#6a2f30', skin: '#c49a76' } },
  K12: { name: 'Yaşlı kadın', family: 'elder', height: 1.54, build: 1.1, status: 'design',
    outfit: { head: 'scarf', headC: '#1e1c22', top: 'jacket', topC: '#232028', bottom: 'skirt', botC: '#2a2630', apron: true, apronC: '#5a3540', sash: true, sashC: '#3a3040', skin: '#b78c6a' } },
  K13: { name: 'Fransız makineli tüfekçi', family: 'soldier', height: 1.72, build: 1.08, status: 'design', military: true,
    outfit: { head: 'adrian', headC: '#4f6072', top: 'tunic', topC: '#b3a27e', bottom: 'trousers', botC: '#8f8264', beltC: '#5a3c26', strap: '#5a3c26', shinC: '#9c8f70', boots: true, skin: '#c0926c', moustache: '#3a2c22', prop: 'lmg' } },
  K14: { name: 'Fransız yardımcı birliği (Ermeni Lejyonu)', family: 'male', height: 1.73, build: 1.02, status: 'design', military: true,
    outfit: { head: 'sarik', headC: '#c9bca8', top: 'vest', topC: '#33303a', armC: '#cfc4ae', shirtC: '#cfc4ae', bottom: 'salvar', botC: '#4a4a55', sash: true, sashC: '#6a2f2c', shinC: '#8a8676', boots: true, skin: '#b08660', bandolier: '#6a4a2c', moustache: '#221d1a' } },
  // PAFTADA YOK — yalnız yer tutucu. Prolog (Görev 0.2) İngiliz birliklerini gerektiriyor; üniforma ayrıntısı VARSAYIM (haki, düz miğfer), kaynakla doğrulanmadı.
  K15: { name: 'İngiliz askeri (yer tutucu)', family: 'soldier', height: 1.74, build: 1.0, status: 'placeholder', military: true,
    outfit: { head: 'brodie', headC: '#6b6a4e', top: 'tunic', topC: '#8a7f58', bottom: 'trousers', botC: '#8a7f58', beltC: '#6a5a3a', strap: '#6a5a3a', shinC: '#7d7350', boots: true, skin: '#c99d7c', prop: 'rifle' } }
};
