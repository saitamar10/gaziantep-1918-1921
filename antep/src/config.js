// Genel yapılandırma — tüm sistemler buradan okur.
export const CONFIG = {
  // Koordinat başlangıcı: Gaziantep Kalesi (Kültür Envanteri koordinatı)
  origin: { lat: 37.0664024, lon: 37.3835030 },
  // Dünya sınırları (metre; x = doğu, z = güney)
  bounds: { minX: -2100, maxX: 1400, minZ: -700, maxZ: 1500 },
  terrainStep: 5,          // arazi ızgarası (m)
  chunk: 100,              // bina parçası boyutu (m)
  detailDist: 190,         // yakın detay (LOD0) mesafesi
  detailBudgetMs: 10,      // kare başına detay inşa bütçesi
  seed: 19181921,
  player: { eyeHeight: 1.70, minEye: 1.65, maxEye: 1.75, radius: 0.32, walk: 3.4, run: 7.5, stepUp: 0.55 },
  // Başlangıç: prolog açılışı, 17 Aralık 1918 (Görev 0.1 "Son Normal Gün"), 14:00 yerel güneş saati.
  // Oyuncu Günlük [J] panelindeki kronolojiden başka bir güne geçebilir (src/data/chronology.js); arayüz ve devriyeler tarihe göre değişir.
  date: { y: 1918, m: 12, d: 17 },
  time: 14.0,
  quality: 'high',
  // NPC pilotu: karakter görünüşleri onaylanana kadar yalnız kahraman sokak çevresi (radius, m).
  // military: Fransız devriyesi (Kasım 1919 sonrası tarihler için). kuva: silahlı Kuvâ-yi Milliye devriyesi — işgal altındaki
  // çarşıda açıkta dolaşmaları uygun olmadığı için kapalı. lod: [tam animasyon, seyrek animasyon, siluet] mesafeleri
  npc: { enabled: true, radius: 260, military: true, kuva: false, lod: [45, 95, 210] }
};
