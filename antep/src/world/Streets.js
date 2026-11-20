// Sokak ağı ve parsel üretimi.
// Yöntem: şehir sınırı çokgeni özyinelemeli olarak bölünür; her bölme çizgisi derinliğe göre
// cadde / sokak / dar geçit genişliğinde bir boşluk bırakır (sokak = bölmeler arası boşluk).
// Bloklar sonra boşluksuz bölünerek parsellere ayrılır. Ana akslar (tasarım varsayımı) doğrulanmış
// yapıları birbirine bağlar ve üzerlerine düşen parseller temizlenir.
import { CONFIG } from '../config.js';
import { Poly, rng, SpatialHash, fbm } from '../core/MapCoordinates.js';
import { L as LM } from '../data/historicalReferences.js';
import { moundFactor, riverDist, RAMP, CASTLE } from './Terrain.js';
import { TARIHI_MAHALLE as TM } from '../data/tarihiMahalle.js';

// Tarihî plandan kurulan batı mahalleleri (bkz. data/tarihiMahalle.js): bölgenin içindeki üretilmiş doku ve akslar atılır.
export const HIST_REGION = TM.region;
export const inHist = (x, z) => Poly.contains(HIST_REGION, x, z);
/** bölge (içbükey olabilir) dışında kalan parça(lar) [[a,b],...]: kenarlarla bütün kesişimler bulunur, aradaki aralıkların orta noktası sınanır */
export function clipOutsideHist(a, b) {
  const P = HIST_REGION, dx = b[0] - a[0], dz = b[1] - a[1], ts = [0, 1];
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], ex = q[0] - p[0], ez = q[1] - p[1]; const den = dx * ez - dz * ex; if (Math.abs(den) < 1e-12) continue;
    const t = ((p[0] - a[0]) * ez - (p[1] - a[1]) * ex) / den, u = ((p[0] - a[0]) * dz - (p[1] - a[1]) * dx) / den; if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t); }
  ts.sort((x, y) => x - y); const pt = t => [a[0] + dx * t, a[1] + dz * t]; const out = [];
  for (let i = 0; i < ts.length - 1; i++) { if (ts[i + 1] - ts[i] < 1e-4) continue; const m = pt((ts[i] + ts[i + 1]) / 2); if (inHist(m[0], m[1])) continue;
    const last = out[out.length - 1]; if (last && Math.abs(last[2] - ts[i]) < 1e-9) { last[1] = pt(ts[i + 1]); last[2] = ts[i + 1]; } else out.push([pt(ts[i]), pt(ts[i + 1]), ts[i + 1]]); }
  return out.map(([p, q]) => [p, q]);
}

// Plan dışı (doğu ve çevre) mahallelerin organikleştirilmesi — TAHMİN: kaynak yok. Özyinelemeli bölmenin düz çizgileri yumuşak bir
// gürültü alanıyla bükülür (dalga boyu ~160 m, genlik ~9 m); sokaklar 9 m'lik parçalara bölünür, parsel ve ada köşeleri aynı alanla
// taşınır, böylece komşu parseller ve sokaklar birbirine oturmaya devam eder.
const WARP = { amp: 9, wl: 160 };
export function organicWarp(x, z) { const u = x / WARP.wl, v = z / WARP.wl; return [x + WARP.amp * (fbm(u, v, 2, 91) - .365) / .2, z + WARP.amp * (fbm(u + 17.3, v - 4.1, 2, 137) - .365) / .2]; }   // fbm(2 oktav) ortanca .365, %5–95 ±.2
function densify(poly, step, closed) { const out = []; const n = closed ? poly.length : poly.length - 1; for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); } if (!closed) out.push(poly[poly.length - 1]); return out; }

// Kale giriş yolu (batıdaki sokaktan köprü başına, köprü, yamaç yolu): üzerine parsel düşmez. İlk noktası Alleben köprüsü aksı üzerinde.
export const RAMP_ACCESS = [...RAMP];

// Şehir sınırı (1918 civarı) — VARSAYIM
export const CITY_POLYS = [
  [[-1420, 250], [-1050, 200], [-640, 185], [-360, 150], [-230, 30], [-150, -150], [150, -170], [420, -110], [720, -95], [1010, -40], [1150, 260], [1110, 650], [950, 960], [600, 1130], [100, 1200], [-420, 1230], [-900, 1220], [-1250, 1120], [-1440, 820]],
  [[-560, -260], [-300, -300], [80, -330], [320, -270], [260, -215], [10, -205], [-140, -120], [-230, -20], [-420, 20], [-560, -20]] // Ali Nacar çevresi (kuzey yaka)
];
// Ana akslar — VARSAYIM (yalnız uçlardaki yapılar doğrulanmış)
export const AXES = [
  { id: 'uzuncarsi', name: 'Uzun Çarşı aksı', w: 9, pts: [[20, 128], [92, 205], [128, 300], [160, 368], [250, 452], [312, 515], [300, 640], [282, 900], [250, 1230]] },
  { id: 'bati', name: 'Batı yolu (Ömeriye–Kendirli)', w: 8, pts: [[-112, 98], [-298, 278], [-520, 355], [-692, 420], [-900, 560], [-1180, 760], [-1480, 1000], [-1560, 1090]] },
  { id: 'katedral', name: 'Kendirli–Katedral yolu', w: 6.5, pts: [[-692, 420], [-705, 670], [-660, 1000]] },
  { id: 'dogu', name: 'Şeyh Fethullah yolu', w: 7, pts: [[312, 515], [480, 640], [683, 760], [960, 960]] },
  { id: 'kuzey', name: 'Alleben köprüsü yolu', w: 6.5, pts: [[-70, 108], [-165, 40], [-212, -62], [-236, -140], [-300, -265]] },
  { id: 'carsibati', name: 'Çarşı–Katedral bağlantısı', w: 6, pts: [[160, 368], [-90, 520], [-300, 600], [-688, 690]] },
  { id: 'guneybati', name: 'Güneybatı yolu', w: 6, pts: [[-520, 355], [-450, 700], [-300, 1020]] },
  { id: 'dogukuzey', name: 'Doğu yolu', w: 6, pts: [[150, 120], [480, 170], [880, 250], [1160, 300]] }
];
// akslar deneme mahallesinin içinden geçmez (orada plandaki sokaklar geçerli): kırpılıp parçalara ayrılır
{ const out = []; for (const ax of AXES) { let cur = null, k = 0; for (let i = 0; i < ax.pts.length - 1; i++) { for (const [p, q] of clipOutsideHist(ax.pts[i], ax.pts[i + 1])) {
    if (cur && Math.hypot(cur.pts[cur.pts.length - 1][0] - p[0], cur.pts[cur.pts.length - 1][1] - p[1]) < 1e-3) cur.pts.push(q); else { cur = { ...ax, id: k ? ax.id + '_' + k : ax.id, pts: [p, q] }; k++; out.push(cur); } } }
  } AXES.splice(0, AXES.length, ...out); }
// Şehir dışı yollar (yön temsilî) — VARSAYIM
export const ROADS = [
  { name: 'Maraş yolu', pts: [[-300, -265], [-700, -480], [-1200, -700]] },
  { name: 'Kilis yolu', pts: [[250, 1230], [210, 1400]] },
  { name: 'Halep yolu', pts: [[960, 960], [1400, 1330]] },
  { name: 'Nizip yolu (doğu)', pts: [[1160, 300], [1400, 330]] }, { name: 'Acar köy yolu', pts: [[-1300, 60], [-1500, -150], [-1750, -380]] },
  { name: 'Kolej yolu', pts: [[-1480, 1000], [-1560, 1090]] }, { name: 'Bostan yolu', pts: [[-692, 420], [-760, 220], [-900, 120], [-1300, 60], [-2000, 40]] }
];

export class StreetLayout {
  constructor() { this.R = rng(CONFIG.seed); this.lots = []; this.segments = []; this.blocks = []; this.sabats = []; this.squares = []; this.lotHash = new SpatialHash(30); }

  urbanWeight(x, z) { for (const p of CITY_POLYS) if (Poly.contains(p, x, z)) return moundFactor(x, z) < CASTLE.moatOut ? 0 : 1; return 0; }
  roadWeight(x, z) { let d = 1e9; for (const r of ROADS) d = Math.min(d, Poly.distToPolyline(x, z, r.pts)); for (const a of AXES) d = Math.min(d, Poly.distToPolyline(x, z, a.pts) + (this.urbanWeight(x, z) ? 0 : 0)); return d < 5 ? 1 : d < 9 ? 1 - (d - 5) / 4 : 0; }

  /** bölgeye göre yoğunluk (çarşı merkezi en yoğun) */
  zoneAt(x, z) { const dc = Math.hypot(x - 200, z - 420); if (dc < 230 && x > 30 && x < 420) return 'carsi'; if (Math.hypot((x + 250) / 1.25, z - 560) < 820) return 'konut'; return 'dis'; }

  generate() {
    const R = this.R;
    for (const p of CITY_POLYS) this.split(Poly.ensureCCW(p), 0);
    // organikleştirme (TAHMİN, plan dışı doku): bölme çizgileri bükülür
    this.segments = this.segments.flatMap(sg => { const pts = densify([sg.a, sg.b], 9, false).map(([x, z]) => organicWarp(x, z)); const out = [];
      for (let i = 0; i < pts.length - 1; i++) out.push({ ...sg, a: pts[i], b: pts[i + 1], len: Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]), org: 1 }); return out; });
    for (const l of this.lots) { l.poly = Poly.ensureCCW(densify(l.poly, 14, true).map(([x, z]) => organicWarp(x, z))); l.area = Math.abs(Poly.area(l.poly)); l.c = Poly.centroid(l.poly); }
    for (const b of this.blocks) b.poly = densify(b.poly, 14, true).map(([x, z]) => organicWarp(x, z));
    // tarihî bölge: üretilmiş doku yerine plandan kurulan sokak, parsel ve bahçeler
    this.lots = this.lots.filter(l => !l.poly.some(([x, z], i) => { const [x2, z2] = l.poly[(i + 1) % l.poly.length]; return inHist(x, z) || inHist((x + x2) / 2, (z + z2) / 2) || clipOutsideHist([x, z], [x2, z2]).length !== 1; }) && !inHist(l.c[0], l.c[1]));   // köşesi, kenar ortası bölgede olan ya da kenarı bölge sınırını kesen parsel atılır
    this.blocks = this.blocks.filter(b => { const [x, z] = Poly.centroid(b.poly); return !inHist(x, z); });
    this.segments = this.segments.flatMap(sg => clipOutsideHist(sg.a, sg.b).map(([a, b]) => ({ ...sg, a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }))).filter(sg => sg.len > 1);
    for (const sg of TM.segments) this.segments.push({ ...sg });
    const addLot = (poly, garden) => { const P = Poly.ensureCCW(poly); const [cx, cz] = Poly.centroid(P); this.lots.push({ poly: P, area: Math.abs(Poly.area(P)), c: [cx, cz], zone: 'konut', garden, r: R(), hist: 1 }); };
    TM.lots.forEach(p => addLot(p, false)); TM.gardens.forEach(p => addLot(p, true));
    // ana aks ve özel alan temizliği
    const reserved = this.reservedAreas();
    // plandan gelen sokak bir yer işaretinin (cami, kilise) oturduğu alanın içinden geçmesin: orta noktası içerde kalan parça atılır
    const inRes = (x, z) => reserved.some(r => r.rect ? Math.abs(x - r.x) < r.rect[0] / 2 - 4 && Math.abs(z - r.z) < r.rect[1] / 2 - 4 : r.r > 0 && Math.hypot(x - r.x, z - r.z) < r.r - 6);
    this.segments = this.segments.filter(sg => !sg.hist || !inRes((sg.a[0] + sg.b[0]) / 2, (sg.a[1] + sg.b[1]) / 2));
    this.lots = this.lots.filter(l => {
      const [cx, cz] = l.c; if (moundFactor(cx, cz) < CASTLE.moatOut + .07) return false;   // höyük + hendek if (riverDist(cx, cz) < 22) return false;
      if (Poly.distToPolyline(cx, cz, RAMP_ACCESS) < 9 || l.poly.some(([x, z]) => Poly.distToPolyline(x, z, RAMP_ACCESS) < 5)) return false;
      for (const a of AXES) { const hw = a.w / 2 + 1.5; if (Poly.distToPolyline(cx, cz, a.pts) < hw + 3) return false; if (l.poly.some(([x, z]) => Poly.distToPolyline(x, z, a.pts) < hw)) return false; }
      for (const r of reserved) { if (Math.hypot(cx - r.x, cz - r.z) < r.r) return false; if (r.rect && Math.abs(cx - r.x) < r.rect[0] / 2 + 6 && Math.abs(cz - r.z) < r.rect[1] / 2 + 6) return false; }
      return true; });
    this.lots.forEach((l, i) => { l.id = i; const xs = l.poly.map(p => p[0]), zs = l.poly.map(p => p[1]); this.lotHash.insert(l, Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)); });
    // sokak cephesi tespiti
    this.lots.forEach(l => { l.front = l.poly.map((a, i) => { const b = l.poly[(i + 1) % l.poly.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2.5) return 0;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; let nx = b[1] - a[1], nz = -(b[0] - a[0]); nx /= L; nz /= L; // CCW -> dış normal
      const px = mx + nx * 1.6, pz = mz + nz * 1.6; for (const o of this.lotHash.query(px, pz, 0)) if (o !== l && Poly.contains(o.poly, px, pz)) return 0; return 1; }); l.isCorner = l.front.filter(f => f).length >= 2; });
    // dar geçitlerde kemerli geçit (sabat) adayları
    this.segments.filter(s => s.w < 3.6 && s.len > 18).forEach(s => { if (R() < .07) { const t = .3 + R() * .4; this.sabats.push({ x: s.a[0] + (s.b[0] - s.a[0]) * t, z: s.a[1] + (s.b[1] - s.a[1]) * t, ang: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]), w: s.w }); } });
    { const R3 = rng(771923); this.segments.filter(s => s.w < 3.6 && s.len > 22).forEach(s => { if (R3() < .07) { const t = .35 + R3() * .3; const x = s.a[0] + (s.b[0] - s.a[0]) * t, z = s.a[1] + (s.b[1] - s.a[1]) * t;
        if (!this.sabats.some(q => Math.hypot(q.x - x, q.z - z) < 45)) this.sabats.push({ x, z, ang: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]), w: s.w }); } }); }   /* ek kabaltılar (ayrı rastgele akış) */
    return this;
  }
  reservedAreas() {
    const out = [];
    const add = (id, r, rect) => { const l = LM[id]; if (l) out.push({ x: l.x, z: l.z, r, rect }); };
    add('millet', 0, [46, 50]); add('yuzukcu', 0, [38, 38]); add('tutun', 0, [36, 34]); add('zincirli', 0, [62, 62]); add('bakircilar', 0, [16, 90]);
    add('tahtani', 22); add('alauddevle', 24); add('omeriye', 22); add('alinacar', 24); add('seyhfethullah', 30); add('kendirli', 0, [60, 70]); add('meryemana', 0, [58, 64]);
    add('kolej', 0, [300, 240]); add('hastane', 0, [60, 50]); add('kozanli', 18); add('handaniye', 21);
    // küçük meydanlar (aks kesişimleri) — varsayım
    [[160, 368], [312, 515], [-692, 420], [-520, 355], [-298, 278]].forEach(([x, z]) => { out.push({ x, z, r: 18 }); this.squares.push({ x, z, r: 16 }); });
    return out;
  }
  split(poly, depth) {
    const R = this.R; const A = Math.abs(Poly.area(poly)); if (poly.length < 3 || A < 40) return;
    const [cx, cz] = Poly.centroid(poly); const zone = this.zoneAt(cx, cz);
    const blockTarget = zone === 'carsi' ? 1800 : zone === 'konut' ? 3400 : 7000;
    if (A < blockTarget * (0.7 + R() * 0.6) || depth > 22) { this.blocks.push({ poly, zone }); this.lotify(poly, zone, 0); return; }
    const o = Poly.obb(poly); const ang = o.ang + Math.PI / 2 + (R() - .5) * (depth < 3 ? .3 : .55);
    const nx = Math.cos(ang - Math.PI / 2 + Math.PI / 2), nz = Math.sin(ang - Math.PI / 2 + Math.PI / 2); // bölme çizgisinin normali = OBB uzun ekseni (± sapma)
    const n0 = [Math.cos(o.ang + (R() - .5) * (depth < 3 ? .3 : .55)), Math.sin(o.ang + (R() - .5) * (depth < 3 ? .3 : .55))];
    const t = .38 + R() * .24; const d = n0[0] * (cx + 0) + n0[1] * (cz + 0); // merkezden geçen çizgi
    const proj = poly.map(p => n0[0] * p[0] + n0[1] * p[1]); const mn = Math.min(...proj), mx = Math.max(...proj); const dd = mn + (mx - mn) * t;
    const w = depth < 2 ? 8 : depth < 4 ? 5.5 : depth < 7 ? 4 : 2.6 + R() * 1.1; // cadde > sokak > dar geçit
    const a = Poly.clip(poly, n0[0], n0[1], dd - w / 2), b = Poly.clip(poly, -n0[0], -n0[1], -(dd + w / 2));
    // sokak segmenti (harita ve detaylar için)
    const ln = Poly.clip(Poly.clip(poly, n0[0], n0[1], dd + .01), -n0[0], -n0[1], -(dd - .01));
    if (ln.length >= 2) { const pts = ln; let best = [pts[0], pts[1]], bl = 0; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const L = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (L > bl) { bl = L; best = [pts[i], pts[j]]; } } this.segments.push({ a: best[0], b: best[1], w, len: bl, depth }); }
    if (a.length >= 3) this.split(a, depth + 1); if (b.length >= 3) this.split(b, depth + 1);
  }
  lotify(poly, zone, depth) {
    const R = this.R; const A = Math.abs(Poly.area(poly)); const o = Poly.obb(poly);
    const target = zone === 'carsi' ? 120 : zone === 'konut' ? 290 : 480;
    if (A < target * (0.75 + R() * 0.7) || o.wid < 7 || depth > 10) {
      if (A < 30 || o.wid < 3.5) return;
      const [cx, cz] = Poly.centroid(poly);
      // dış mahallelerde bazı parseller bostan/bahçe olur
      const garden = zone === 'dis' ? R() < .35 : zone === 'konut' ? R() < .06 : false;
      this.lots.push({ poly: Poly.ensureCCW(poly), area: A, c: [cx, cz], zone, garden, r: R() }); return; }
    const n0 = [Math.cos(o.ang), Math.sin(o.ang)]; const proj = poly.map(p => n0[0] * p[0] + n0[1] * p[1]); const mn = Math.min(...proj), mx = Math.max(...proj); const dd = mn + (mx - mn) * (.4 + R() * .2);
    const a = Poly.clip(poly, n0[0], n0[1], dd), b = Poly.clip(poly, -n0[0], -n0[1], -dd);
    if (a.length >= 3) this.lotify(a, zone, depth + 1); if (b.length >= 3) this.lotify(b, zone, depth + 1);
  }
}
