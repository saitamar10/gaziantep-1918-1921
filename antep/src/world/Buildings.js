// Geleneksel Antep konutları, çarşı dükkânları ve cephe detayları.
// Her parsel için deterministik bir "reçete" üretilir (BuildingSpec); geometri parça (chunk) bazında
// iki seviyede kurulur: BASE (her mesafede: kütle, dam, kiremit) ve DETAIL (yakın: açıklıklar, cumba, tente, eşyalar).
import * as THREE from 'three';
import { GeoBuilder } from '../core/GeoBuilder.js';
import { Poly, rng } from '../core/MapCoordinates.js';
import { heightAt } from './Terrain.js';

const STONE_TINTS = ['#fff6e6', '#f6e7cb', '#efdcb6', '#e9d4a8', '#f9efdc', '#ead9b9', '#e2cda4'].map(h => new THREE.Color(h));
const BASALT = new THREE.Color('#d8d4d0'); const WHITE = new THREE.Color('#ffffff');
const WOODS = ['#9c7653', '#7d5a3c', '#a8835d', '#6e4f35', '#8a6a48', '#5d4632'].map(h => new THREE.Color(h));
const DOORS = ['#ffffff', '#cfd8d0', '#d8c9b0', '#b9c7cf', '#e0d0c0'].map(h => new THREE.Color(h));

/** Parsel -> yapı reçetesi */
export function specFor(lot) {
  const R = rng(lot.id * 7919 + 101); const P = Poly.inset(lot.poly, .05) || lot.poly; const o = Poly.obb(P);
  const ys = P.map(p => heightAt(p[0], p[1])); const gmin = Math.min(...ys), gmax = Math.max(...ys);
  const s = { lot, P, o, gmin, gmax, yb: gmin - .8, R, tint: STONE_TINTS[Math.floor(R() * STONE_TINTS.length)].clone().multiplyScalar(.94 + R() * .08), stoneKey: R() < .55 ? 'stone' : 'stone2', uo: R() * 10 };
  s.type = lot.garden ? 'bahce' : lot.zone === 'carsi' ? 'dukkan' : (lot.area > 150 && o.wid > 12.5 && R() < .82) ? 'avlulu' : 'kompakt';
  s.f1 = (lot.zone === 'carsi' ? 4.6 : 5.0) + R() * .9;   /* mahalle evi: yüksek, sağır sokak duvarı (arşiv fotoğrafındaki kesit) */ s.f2 = s.f1 + 3.4 + R() * .5;
  s.two = s.type === 'dukkan' ? R() < .45 : R() < (lot.zone === 'dis' ? .4 : .72);
  s.tileRoof = s.two && R() < .42; s.ablak = R() < .3; s.basaltPlinth = R() < .3; s.cumba = s.two && R() < .45; s.balkon = s.two && !s.cumba && R() < .12;
  s.yTop1 = gmax + s.f1; s.yTop2 = gmax + s.f2;
  // ön cepheler
  s.fronts = []; for (let i = 0; i < P.length; i++) if (lot.front[i]) s.fronts.push(i);
  // avlu
  if (s.type === 'avlulu') { const d = 3.6 + R() * 1.2; s.court = Poly.inset(P, d); if (!s.court || Math.abs(Poly.area(s.court)) < 22) { s.type = 'kompakt'; s.court = null; } else s.courtDepth = d; }
  // üst kat kanadı: en uzun ön cephe (yoksa en uzun kenar)
  let wi = -1, wl = 0; const cand = s.fronts.length ? s.fronts : P.map((_, i) => i); cand.forEach(i => { const a = P[i], b = P[(i + 1) % P.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > wl) { wl = L; wi = i; } });
  s.wingEdge = wi;
  if (s.two && wi >= 0 && s.type !== 'kompakt') { const a = P[wi], b = P[(wi + 1) % P.length]; const L = wl; const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L; const ix = -tz, iz = tx; // içe
    const d = s.court ? s.courtDepth : Math.min(5.5, o.wid * .5); let q = [a, b, [b[0] + ix * d, b[1] + iz * d], [a[0] + ix * d, a[1] + iz * d]]; q = Poly.clip(q, -tx, -tz, -(tx * a[0] + tz * a[1])); q = Poly.clip(q, tx, tz, tx * b[0] + tz * b[1]);
    s.wing = q.length >= 3 ? Poly.ensureCCW(q) : null; s.wingLen = L; s.wingDepth = d; s.wingAng = Math.atan2(tz, tx); s.wingA = a; s.wingB = b; s.wingIn = [ix, iz]; }
  return s;
}

/* ============================ BASE (kütle) ============================ */
/** Parselin çarpışma çokgenleri. Bahçede yalnız duvarlar katıdır; ön duvardaki kapı boşluğundan girilebilir. */
export function collisionFor(s) {
  if (s.type !== 'bahce') return [s.P];
  const P = s.P, out = []; const wall = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .2) return; const nx = -(b[1] - a[1]) / L * .28, nz = (b[0] - a[0]) / L * .28; out.push([[a[0] - nx, a[1] - nz], [b[0] - nx, b[1] - nz], [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]]); };
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s.lot.front[i] && L > 5) { const t0 = .5 - 1.2 / L, t1 = .5 + 1.2 / L; wall(a, [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]); wall([a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1], b); } else wall(a, b); }
  return out;
}
export function buildBase(G, s) {
  const { P, yb, tint, stoneKey: K, uo } = s;
  if (s.type === 'bahce') { // bahçe duvarı
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const front = s.lot.front[i];
      if (front && L > 5) { const t0 = .5 - 1.2 / L, t1 = .5 + 1.2 / L; const m0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], m1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]; seg(G, K, a, m0, yb, s.gmax + 3.3, tint, uo); seg(G, K, m1, b, yb, s.gmax + 3.3, tint, uo); }
      else seg(G, K, a, b, yb, s.gmax + 3.3, tint, uo); }
    return; }
  if (s.court) {
    const C = s.court, y1 = s.yTop1, yc = s.gmin + .15;
    for (let i = 0; i < P.length; i++) G.wall(K, P[i], P[(i + 1) % P.length], yb, y1, tint, { uo });
    // avlu iç duvarları (içe bakar: ters yön)
    for (let i = 0; i < C.length; i++) G.wall(K, C[(i + 1) % C.length], C[i], yc - .5, y1, tint, { uo: uo + 3 });
    G.cap('flat', P, [C.slice().reverse()], y1, tint.clone().multiplyScalar(.95));
    parapet(G, K, P, y1, .55, tint, false); parapet(G, K, C, y1, .4, tint, true);
    G.cap(s.stoneKey, C, null, yc, new THREE.Color('#e8dcc4'), 2.2); // avlu taş döşeme
  } else {
    const top = s.two && !s.wing ? s.yTop2 : s.yTop1;
    if (s.type === 'dukkan') { /* AŞAMA 6: dükkân ağzı siyah bir levha değil, gerçek bir boşluk; içi buildDetail/shopFront'ta döşenir */
      for (let i = 0; i < P.length; i++) { const a = P[i], q = P[(i + 1) % P.length]; const L = Math.hypot(q[0] - a[0], q[1] - a[1]); if (!s.lot.front[i] || L < 3.1) { G.wall(K, a, q, yb, top, tint, { uo }); continue; }
        const pt = t => [a[0] + (q[0] - a[0]) * t / L, a[1] + (q[1] - a[1]) * t / L]; let prev = 0;
        for (const op of shopOpenings(a, q, L)) { G.wall(K, pt(prev), pt(op.t - op.w / 2), yb, top, tint, { uo }); G.wall(K, pt(op.t - op.w / 2), pt(op.t + op.w / 2), op.gy + op.h, top, tint, { uo });
          const m = G.frame(a, q, op.t, 0, op.gy); G.boxM('dark', GeoBuilder.local(m, 0, (op.h + .05) / 2, -shopDepth(s)), op.w + 2.6, op.h + .05, .04, '#ffffff', { faces: 1 });   /* uzaktan: koyu arka yüz (2 üçgen) */
          prev = op.t + op.w / 2; }
        G.wall(K, pt(prev), q, yb, top, tint, { uo }); }
      G.cap('flat', P, null, top, tint.clone().multiplyScalar(.95), 3); }
    else G.prism(K, P, yb, top, tint, { uo, topKey: 'flat', topCol: tint.clone().multiplyScalar(.95) });
    if (!(s.tileRoof && !s.wing && s.P.length === 4)) parapet(G, K, P, top, .55, tint, false);
    if (s.tileRoof && !s.wing) roofOver(G, s, P, top);
  }
  if (s.wing) { const W = s.wing; G.prism(K, W, s.yTop1 - .01, s.yTop2, tint, { uo: uo + 7, topKey: 'flat', topCol: tint.clone().multiplyScalar(.95) });
    if (s.tileRoof) roofOver(G, s, W, s.yTop2); else parapet(G, K, W, s.yTop2, .55, tint, false); }
}
function seg(G, K, a, b, y0, y1, tint, uo) { G.wall(K, a, b, y0, y1, tint, { uo }); G.wall(K, b, a, y0, y1, tint, { uo }); const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > .1) G.box(K, (a[0] + b[0]) / 2, y1, (a[1] + b[1]) / 2, L, .18, .55, -Math.atan2(b[1] - a[1], b[0] - a[0]), tint.clone().multiplyScalar(.9), { uvS: 2 }); }
function parapet(G, K, poly, y, h, tint, inner) { const c = tint.clone().multiplyScalar(.93);
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .3) continue; const ang = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L; const off = inner ? .18 : -.18;
    G.box(K, (a[0] + b[0]) / 2 + nx * off, y, (a[1] + b[1]) / 2 + nz * off, L, h, .36, ang, c, { uvS: 3, faces: 1 | 2 | 16 }); } }
function roofOver(G, s, poly, y) { const o = Poly.obb(poly); const cu = (o.mnu + o.mxu) / 2, cv = (o.mnv + o.mxv) / 2; const cx = cu * o.c - cv * o.s, cz = cu * o.s + cv * o.c;
  G.hipRoof('tiles', cx, y, cz, o.len, o.wid, Math.min(2.6, o.wid * .32), o.ang, new THREE.Color('#ffffff').multiplyScalar(.85 + s.R() * .25), .5); }

/* ============================ DETAIL (yakın) ============================ */
export function buildDetail(G, s, props) {
  const R = rng(s.lot.id * 104729 + 7); const { P, tint } = s;
  if (s.type === 'bahce') { gardenDetail(G, s, R, props); return; }
  let doorPlaced = false; const ablakC = BASALT;
  for (const i of s.fronts) {
    const a = P[i], b = P[(i + 1) % P.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2.4) continue;
    const isWing = s.wing && i === s.wingEdge; const twoHere = (s.two && !s.wing) || isWing; const yg = s.gmax; const top = twoHere ? s.yTop2 : s.yTop1;
    const g0 = heightAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    // siyah bazalt subasman ve kat silmesi
    if (s.basaltPlinth) band(G, 'basalt', a, b, s.yb, g0 + .55, .06, BASALT);
    band(G, s.stoneKey, a, b, s.yTop1 - .25, s.yTop1 - .02, .09, tint.clone().multiplyScalar(.92));
    if (twoHere) band(G, s.stoneKey, a, b, top - .2, top + .02, .12, tint.clone().multiplyScalar(.9));
    if (s.type === 'dukkan') { shopFront(G, s, a, b, L, g0, R, props); continue; }
    // kapı
    const nSlots = Math.max(1, Math.floor(L / 2.8)); const doorSlot = !doorPlaced ? Math.floor(R() * nSlots) : -1;
    for (let k = 0; k < nSlots; k++) { const t = (k + .5) / nSlots * L; const gy = heightAt(a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L);
      if (k === doorSlot) { door(G, s, a, b, t, gy, R, ablakC, props); doorPlaced = true; }
      else if (R() < (s.type === 'dukkan' ? .75 : .18)) groundWindow(G, s, a, b, t, gy, R);
      if (twoHere) { if (s.cumba && isWing && k === Math.floor(nSlots / 2) && L > 6) { cumba(G, s, a, b, t, R); continue; }
        if (s.balkon && isWing && k === Math.floor(nSlots / 2)) balcony(G, s, a, b, t, R);
        upperWindow(G, s, a, b, t, s.yTop1 + .7, R, ablakC); }
    }
    // çörten (dam suyu oluğu) + duvar nişi + çeşme + fener
    if (!s.tileRoof || !twoHere) for (let t = 2.5; t < L - 1; t += 6 + R() * 3) G.boxM('stone2', G.frame(a, b, t, .35, top + .05), .22, .18, .9, tint, { uvS: 1 });
    if (R() < .08 && L > 6) niche(G, s, a, b, L * (.2 + R() * .6), g0, tint);
    if (s.lot.isCorner && R() < .06 && L > 6) fountain(G, s, a, b, L * .78, g0);
    if (R() < .07) { const m = G.frame(a, b, L * .5 + 1.4, .3, g0 + 2.9); G.boxM('iron', m, .05, .05, .55); G.boxM('iron', GeoBuilder.local(m, 0, -.25, .28), .18, .35, .18, '#3a2e22'); }
  }
  if (!doorPlaced && s.fronts.length === 0 && s.court) { /* iç parsel: çıkmaz erişimli varsayılır */ }
  if (s.court) courtyard(G, s, R, props);
  if (s.tileRoof) eaves(G, s);
  // dam üstü eşyaları
  if (!s.tileRoof && R() < .35) { const [cx, cz] = Poly.centroid(s.court ? [s.P[0], s.P[1], s.court[1], s.court[0]] : s.P); const y = (s.two && !s.wing) ? s.yTop2 : s.yTop1;
    if (R() < .5) for (let k = 0; k < 3; k++) props.push(['kup', cx + k * .7, y, cz, R() * 6, .8 + R() * .3]); else { G.box('wood', cx, y, cz, .08, 1.6, .08, 0, WOODS[1]); G.box('wood', cx + 2.6, y, cz, .08, 1.6, .08, 0, WOODS[1]); G.box('fabB', cx + 1.3, y + .55, cz, 2.4, 1.0, .02, 0, '#ffffff'); } }
}
function band(G, K, a, b, y0, y1, out, col) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); G.boxM(K, G.frame(a, b, L / 2, out / 2, (y0 + y1) / 2), L + out * 2, y1 - y0, out + .02, col, { uvS: 3 }); }
function door(G, s, a, b, t, gy, R, ablakC, props) {
  const w = 1.15 + R() * .35, h = 2.25 + R() * .35; const base = G.frame(a, b, t, 0, gy); const wood = WOODS[Math.floor(R() * WOODS.length)]; const dc = DOORS[Math.floor(R() * DOORS.length)];
  G.boxM('dark', GeoBuilder.local(base, 0, h / 2, .02), w + .1, h, .1, '#ffffff', { faces: 1 });
  G.boxM('planks', GeoBuilder.local(base, 0, h / 2, .05), w, h, .08, dc.clone().multiply(wood).multiplyScalar(1.6), { faces: 1 | 16 });
  // söve taşları
  const sc = s.tint.clone().multiplyScalar(.95); G.boxM(s.stoneKey, GeoBuilder.local(base, -w / 2 - .17, h / 2, .03), .34, h, .16, sc); G.boxM(s.stoneKey, GeoBuilder.local(base, w / 2 + .17, h / 2, .03), .34, h, .16, sc);
  if (R() < .55) { G.arch(s.ablak ? 'basalt' : s.stoneKey, GeoBuilder.local(base, 0, 0, .03), w + .02, h, .18, s.ablak ? ablakC : sc, s.ablak ? s.tint : null, 9, .32, s.stoneKey); G.boxM('dark', GeoBuilder.local(base, 0, h + .2, .02), w, .5, .05, '#fff', { faces: 1 }); }
  else G.boxM(s.stoneKey, GeoBuilder.local(base, 0, h + .2, .04), w + .8, .4, .18, sc);
  // eşik + basamak
  G.boxM('stone2', GeoBuilder.local(base, 0, .08, .25), w + .5, .16, .5, '#d9cdb5', { uvS: 1 });
  if (s.gmax - gy > .3) G.boxM('stone2', GeoBuilder.local(base, 0, -.1, .7), w + .6, .2, .5, '#cfc2a8');
  // halka tokmak
  G.boxM('iron', GeoBuilder.local(base, w * .25, 1.15, .0), .08, .1, .05, '#fff');
  if (R() < .07) props.push(['kup', ...xyzFrame(base, w / 2 + .7, 0, .3), 0, .8]);   /* kapı yanında küp: seyrek ve duvara yakın (dar sokakta yolu kapatmasın, her kapıda tekrar etmesin) */
}
function groundWindow(G, s, a, b, t, gy, R) { const base = G.frame(a, b, t, 0, gy); const w = .62 + R() * .2, h = .82 + R() * .2, y = 1.75 + R() * .3;
  G.boxM('dark', GeoBuilder.local(base, 0, y + h / 2, .02), w, h, .06, '#fff', { faces: 1 });
  G.boxM(s.stoneKey, GeoBuilder.local(base, 0, y - .07, .06), w + .3, .14, .2, s.tint.clone().multiplyScalar(.93));       // denizlik
  G.boxM(s.stoneKey, GeoBuilder.local(base, 0, y + h + .1, .04), w + .3, .2, .14, s.tint.clone().multiplyScalar(.93));  // lento
  for (let k = -1; k <= 1; k++) G.boxM('iron', GeoBuilder.local(base, k * w / 3.2, y + h / 2, .09), .035, h, .035, '#fff', { faces: 63 & ~2 & ~16 & ~32 });
  G.boxM('iron', GeoBuilder.local(base, 0, y + h * .5, .09), w, .035, .035, '#fff', { faces: 63 & ~2 & ~4 & ~8 }); }
function upperWindow(G, s, a, b, t, y, R, ablakC) { const base = G.frame(a, b, t, 0, y); const w = .85 + R() * .2, h = 1.55 + R() * .25; const arched = s.ablak || R() < .35;
  G.boxM('glass', GeoBuilder.local(base, 0, h / 2, .02), w, h + (arched ? w / 2 : 0), .04, '#fff', { faces: 1 });
  const wc = WOODS[s.lot.id % WOODS.length]; // pencere doğraması
  const NB = { faces: 63 & ~2 }; G.boxM('wood', GeoBuilder.local(base, 0, h / 2, .05), .06, h, .06, wc, NB); G.boxM('wood', GeoBuilder.local(base, 0, h * .62, .05), w, .06, .06, wc, NB);
  for (const sx of [-1, 1]) G.boxM('wood', GeoBuilder.local(base, sx * w / 2, h / 2, .05), .07, h, .07, wc, NB);
  const sc = s.tint.clone().multiplyScalar(.95); G.boxM(s.stoneKey, GeoBuilder.local(base, 0, -.06, .07), w + .34, .14, .22, sc);
  if (arched) G.arch(s.ablak ? 'basalt' : s.stoneKey, GeoBuilder.local(base, 0, 0, .03), w + .02, h, .16, s.ablak ? ablakC : sc, s.ablak ? s.tint : null, 7, .26, s.stoneKey);
  else G.boxM(s.stoneKey, GeoBuilder.local(base, 0, h + .14, .04), w + .4, .28, .16, sc);
  if (!arched && R() < .45) for (const sx of [-1, 1]) G.boxM('planks', GeoBuilder.local(base, sx * (w / 2 + .23), h / 2, .05), .44, h, .04, WOODS[(s.lot.id + 2) % WOODS.length].clone().multiplyScalar(1.3), { faces: 1 | 4 | 8 }); }
function cumba(G, s, a, b, t, R) { const y = s.yTop1 - .15; const base = G.frame(a, b, t, 0, y); const w = 2.8 + R() * .8, h = 2.6, d = .85; const wc = WOODS[(s.lot.id + 1) % WOODS.length];
  G.boxM('planks', GeoBuilder.local(base, 0, .25, d / 2), w, .5, d, wc.clone().multiplyScalar(1.2));            // taban
  G.boxM('kafes', GeoBuilder.local(base, 0, .5 + 1.0, d + .01), w - .2, 1.7, .02, '#fff', { faces: 1 | 2, uvS: 1.2 });
  for (const sx of [-1, 1]) G.boxM('kafes', GeoBuilder.local(base, sx * (w / 2 - .02), 1.5, d / 2), .02, 1.7, d - .1, '#fff', { faces: 4 | 8, uvS: 1.2 });
  G.boxM('glass', GeoBuilder.local(base, 0, 1.5, d - .1), w - .3, 1.6, .02, '#fff', { faces: 1 });
  for (const x of [-w / 2, -w / 6, w / 6, w / 2]) G.boxM('wood', GeoBuilder.local(base, x, 1.45, d), .09, 1.9, .09, wc);
  G.boxM('wood', GeoBuilder.local(base, 0, h - .15, d / 2 + .05), w + .3, .2, d + .25, wc);
  { const [hx, hz] = xz(base, 0, d / 2 + .05); G.hipRoof('tiles', hx, y + h - .05, hz, w + .1, d + .3, .55, angOf(a, b), '#fff', .15); }
  for (const x of [-w / 2 + .3, w / 2 - .3]) G.boxM('wood', GeoBuilder.local(base, x, -.35, d / 2 - .1, .0), .12, .12, d, wc);      // payandalar
  for (const x of [-w / 2 + .3, w / 2 - .3]) G.boxM('wood', GeoBuilder.local(base, x, -.55, .3, -.0), .1, .6, .1, wc); }
function balcony(G, s, a, b, t, R) { const base = G.frame(a, b, t, 0, s.yTop1 - .1); const w = 2.6, d = 1.0, wc = WOODS[2];
  G.boxM('planks', GeoBuilder.local(base, 0, 0, d / 2), w, .14, d, wc.clone().multiplyScalar(1.2)); for (let x = -w / 2; x <= w / 2 + .01; x += .16) G.boxM('wood', GeoBuilder.local(base, x, .5, d - .03), .04, .9, .04, wc);
  G.boxM('wood', GeoBuilder.local(base, 0, .97, d - .03), w, .07, .07, wc); for (const x of [-w / 2 + .2, w / 2 - .2]) G.boxM('wood', GeoBuilder.local(base, x, -.4, .4), .1, .7, .1, wc); }
function niche(G, s, a, b, t, g0, tint) { const base = G.frame(a, b, t, 0, g0 + 1.0); G.boxM('dark', GeoBuilder.local(base, 0, .45, .02), .6, .9, .04, '#2a2018', { faces: 1 }); G.arch(s.stoneKey, GeoBuilder.local(base, 0, 0, .02), .62, .9, .12, tint.clone().multiplyScalar(.9), null, 7, .18); G.boxM(s.stoneKey, GeoBuilder.local(base, 0, -.05, .06), .8, .1, .18, tint); }
function fountain(G, s, a, b, t, g0) { const base = G.frame(a, b, t, 0, g0); const sc = new THREE.Color('#efe3c9');
  G.boxM('stone2', GeoBuilder.local(base, 0, 1.4, .18), 1.9, 2.8, .36, sc); G.boxM('dark', GeoBuilder.local(base, 0, 1.25, .37), .95, 1.3, .02, '#3b3226', { faces: 1 });
  G.arch('basalt', GeoBuilder.local(base, 0, .6, .38), 1.0, .7, .14, BASALT, sc, 9, .22, 'stone2'); G.boxM('stone2', GeoBuilder.local(base, 0, .3, .6), 1.5, .6, .55, sc.clone().multiplyScalar(.9));
  G.boxM('iron', GeoBuilder.local(base, 0, .95, .5), .05, .05, .25, '#8a6a2a'); G.boxM('stone2', GeoBuilder.local(base, 0, 2.9, .26), 2.2, .25, .55, sc); G.boxM('water', GeoBuilder.local(base, 0, .58, .6), 1.3, .02, .4, '#fff', { faces: 16 }); }
/** Dükkân ağızlarının yeri ve ölçüsü (kütle ve ayrıntı aynı hesabı kullanır) */
function shopOpenings(a, b, L) { const n = Math.max(1, Math.floor(L / 3.1)); const out = []; for (let k = 0; k < n; k++) { const t = (k + .5) / n * L; const w = Math.min(2.5, L / n - .5);
    out.push({ t, w, h: 2.2 + w / 2, gy: heightAt(a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L) }); } return out; }
function shopDepth(s) { return Math.max(1.4, Math.min(2.6, s.o.wid * .4)); }
/** Dükkân içi (AŞAMA 6): arka duvarda raflar, depo kapısı ve işleve göre mal. İşlev rastgele seçilir (TEMSİLÎ):
    bakırcı · aktar/bakkal (çuval, kavanoz, terazi) · kumaşçı (top top kumaş) · çömlekçi. Döneme aykırı vitrin, cam, tabela yok. */
const SHOP_KINDS = ['bakirci', 'aktar', 'kumasci', 'comlekci'];
function shopInterior(G, s, base, w, k, props) { const Rs = rng(s.lot.id * 41 + k * 7 + 1); const dp = shopDepth(s);
  { const H = 2.25 + w / 2, dk = s.tint.clone().multiplyScalar(.5), K = s.stoneKey;   /* oda kabuğu (yalnız yakından çizilir) */
    G.boxM(K, GeoBuilder.local(base, 0, H / 2, -dp + .06), w + .5, H, .1, dk, { uvS: 3 }); for (const sx of [-1, 1]) G.boxM(K, GeoBuilder.local(base, sx * (w / 2 + .2), H / 2, -dp / 2), .1, H, dp, dk, { uvS: 3 });
    G.boxM(K, GeoBuilder.local(base, 0, H, -dp / 2), w + .5, .1, dp, dk.clone().multiplyScalar(.8), { uvS: 3 }); G.boxM('planks', GeoBuilder.local(base, 0, .03, -dp / 2), w + .5, .06, dp, '#6b5238'); } const kind = SHOP_KINDS[Math.floor(Rs() * SHOP_KINDS.length)]; const wood = '#7a5a3a';
  for (let j = 0; j < 3; j++) G.boxM('planks', GeoBuilder.local(base, -w * .12, .85 + j * .55, -dp + .26), w * .7, .05, .36, wood);                    /* raflar */
  for (const sx of [-1, 1]) G.boxM('planks', GeoBuilder.local(base, -w * .12 + sx * w * .35, 1.05, -dp + .26), .05, 2.0, .34, wood);
  G.boxM('dark', GeoBuilder.local(base, w * .36, 1.0, -dp + .07), .7, 2.0, .04, '#ffffff');                                                          /* depo kapısı */
  G.boxM('planks', GeoBuilder.local(base, w * .36, 2.05, -dp + .08), .86, .1, .06, wood);
  if (kind === 'bakirci') { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (Rs() < .8) props.push(['bakir', ...xyzFrame(base, -w * .12 - w * .25 + i * w * .25, .88 + j * .55, -dp + .26), Rs() * 6, .5 + Rs() * .35]);
    for (let i = 0; i < 2; i++) props.push(['bakir', ...xyzFrame(base, -w * .3 + i * .5, 0, -dp * .45), Rs() * 6, .9 + Rs() * .3]); }
  else if (kind === 'aktar') { for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) if (Rs() < .85) G.boxM(j === 1 ? 'spice' : 'pot', GeoBuilder.local(base, -w * .12 - w * .28 + i * w * .14, .96 + j * .55, -dp + .26), .13, .18, .13, ['#b5532a', '#c9a23a', '#6b7a3a', '#8a4a2a', '#d8c49a'][Math.floor(Rs() * 5)]);
    for (let i = 0; i < 3; i++) props.push(['cuval', ...xyzFrame(base, -w * .32 + i * .55, 0, -dp * .5 + (i % 2) * .3), Rs() * 6, .8 + Rs() * .2, Math.floor(Rs() * 5)]);
    /* terazi: tezgâhın üstünde */ G.boxM('iron', GeoBuilder.local(base, w * .22, 1.04, .5), .025, .4, .025, '#ffffff'); G.boxM('iron', GeoBuilder.local(base, w * .22, 1.23, .5), .46, .02, .02, '#ffffff');
    for (const sx of [-1, 1]) G.boxM('copper', GeoBuilder.local(base, w * .22 + sx * .21, 1.02, .5), .16, .025, .16, '#ffffff'); }
  else if (kind === 'kumasci') { const fabs = ['fabR', 'fabG', 'fabB']; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const nst = 1 + Math.floor(Rs() * 3); for (let q = 0; q < nst; q++) G.boxM(fabs[Math.floor(Rs() * 3)], GeoBuilder.local(base, -w * .12 - w * .24 + i * w * .24, .92 + j * .55 + q * .1, -dp + .26), w * .2, .09, .3, '#ffffff'); }
    G.boxM(fabs[Math.floor(Rs() * 3)], GeoBuilder.local(base, -w * .4, 1.5, -dp * .5), .03, 1.6, 1.0, '#ffffff', { faces: 1 | 2 | 4 | 8 }); }                 /* asılı kumaş */
  else { for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (Rs() < .8) G.boxM('pot', GeoBuilder.local(base, -w * .12 - w * .27 + i * w * .18, .98 + j * .55, -dp + .26), .16, .22, .16, ['#a05a34', '#8a4a2a', '#b56a3a'][Math.floor(Rs() * 3)]);
    for (let i = 0; i < 3; i++) props.push(['kup', ...xyzFrame(base, -w * .3 + i * .5, 0, -dp * .5 + (i % 2) * .35), Rs() * 6, .6 + Rs() * .3]); } }
function shopFront(G, s, a, b, L, g0, R, props) { const n = Math.max(1, Math.floor(L / 3.1)); const fab = ['fabR', 'fabG', 'fabB'][Math.floor(R() * 3)]; const wc = WOODS[Math.floor(R() * WOODS.length)];
  for (let k = 0; k < n; k++) { const t = (k + .5) / n * L; const gy = heightAt(a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L); const base = G.frame(a, b, t, 0, gy); const w = Math.min(2.5, L / n - .5);
    G.autoFill = false; shopInterior(G, s, base, w, k, props);   /* eski: ağzı kapatan koyu levha */
    G.arch(s.stoneKey, GeoBuilder.local(base, 0, 0, .02), w + .02, 2.2, .3, s.tint.clone().multiplyScalar(.9), s.ablak ? BASALT : null, 9, .3, 'basalt'); G.autoFill = true;
    G.boxM('planks', GeoBuilder.local(base, -w / 2 + .12, 1.2, .08), .2, 2.3, .5, wc.clone().multiplyScalar(1.3)); // katlanmış kepenk
    // tezgâh + mallar
    const goods = R(); G.boxM('planks', GeoBuilder.local(base, 0, .42, .55), w * .9, .84, .8, wc.clone().multiplyScalar(1.9));
    if (goods < .35) for (let j = 0; j < 4; j++) props.push(['bakir', ...xyzFrame(base, -w / 2 + .35 + j * w / 4.2, .86, .5 + (j % 2) * .2), R() * 6, .7 + R() * .5]);
    else if (goods < .7) for (let j = 0; j < 3; j++) props.push(['cuval', ...xyzFrame(base, -w / 2 + .4 + j * w / 3.2, 0, 1.25), R() * 6, .9 + R() * .3, Math.floor(R() * 5)]);
    else { G.boxM('fabR', GeoBuilder.local(base, w * .3, 1.6, .3, .0), .9, 1.8, .03, '#fff', { faces: 1 | 2 }); }  // asılı halı
  }
  // tente
  if (R() < .8) { const d = 2.2 + R() * .8; const base = G.frame(a, b, L / 2, 0, g0 + 3.2); const m = GeoBuilder.local(base, 0, -.35, d / 2); m.multiply(new THREE.Matrix4().makeRotationX(.32));
    G.boxM(fab, m, L - .6, .04, d, '#fff', { faces: 16 | 32, uvS: 2.5 });
    for (const x of [-(L - .8) / 2, (L - .8) / 2]) if (L > 3) G.boxM('wood', GeoBuilder.local(base, x, -1.6, d - .1), .1, 3.2, .1, wc); }
}
function courtyard(G, s, R, props) { const C = s.court, yc = s.gmin + .15; const [cx, cz] = Poly.centroid(C);
  // havuz / kuyu
  if (R() < .5) { G.box('stone2', cx, yc, cz, 1.8, .45, 1.8, R(), '#e6dbc4', { uvS: 1 }); G.box('water', cx, yc + .38, cz, 1.5, .02, 1.5, 0, '#fff', { faces: 16 }); }
  else G.cylinder('stone2', cx, yc, cz, .6, .6, .75, '#ddd0b6', 10, true, 1);
  R(); R(); R(); R();
  // avludan dama çıkan taş merdiven (bir iç duvar boyunca)
  const a = C[0], b = C[1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > 4) { const steps = Math.floor((s.yTop1 - yc) / .3); for (let k = 0; k < steps; k++) { const t = .8 + k * .3 * (L - 1.6) / (steps * .3); if (t > L - .5) break; G.boxM('stone2', G.frame(b, a, t, .45, yc + k * .3 + .15), .32, .3 + k * 0, .9, '#d8ccb2', { uvS: 1 }); } }
  // eyvan (kuzey kanadı / üst kat tarafı): avluya bakan büyük kemer
  const e0 = C[2 % C.length], e1 = C[3 % C.length]; const Le = Math.hypot(e1[0] - e0[0], e1[1] - e0[1]); if (Le > 4) { const base = G.frame(e0, e1, Le / 2, 0, yc); G.boxM('dark', GeoBuilder.local(base, 0, 1.6, .02), 2.6, 3.2, .05, '#2a2018', { faces: 1 }); G.arch(s.ablak ? 'basalt' : s.stoneKey, GeoBuilder.local(base, 0, 0, .02), 2.7, 2.2, .3, s.ablak ? BASALT : s.tint, s.ablak ? s.tint : null, 13, .38, s.stoneKey); }
  // saksılar
  for (let k = 0; k < 4; k++) props.push(['kup', cx - 2 + R() * 4, yc, cz - 2 + R() * 4, R() * 6, .6 + R() * .3]);
}
function eaves(G, s) { const poly = s.wing || s.P; const top = s.wing || s.two ? s.yTop2 : s.yTop1;
  /* mertek yalnız sokak cephesinde (bitişik evlerin arka kenarları görünmez), 1,1 m aralık, duvara gömülü yüz çizilmez */
  const fr = s.fronts.map(i => [s.P[i], s.P[(i + 1) % s.P.length]]);
  const onFront = (x, z) => fr.some(([p, q]) => Poly.distToSeg(x, z, p[0], p[1], q[0], q[1])[0] < .6);
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!onFront((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue;
    for (let t = .5; t < L; t += 1.1) G.boxM('wood', G.frame(a, b, t, .25, top - .12), .1, .14, .55, WOODS[3], { faces: 63 & ~2 }); } }
function gardenDetail(G, s, R, props) { const [cx, cz] = s.lot.c; for (let k = 0; k < 3; k++) { const x = cx + (R() - .5) * 6, z = cz + (R() - .5) * 6; if (Poly.contains(s.P, x, z)) props.push(['kup', x, heightAt(x, z), z, R() * 6, 1]); } }
/** Parsel ağaçları (taban seviyesinde belirlenir; uzakta basit taç, yakında ayrıntılı model) */
export function treesFor(s) { const R = rng(s.lot.id * 3571 + 9); const out = [];
  if (s.type === 'bahce') { const n = Math.min(10, Math.floor(s.lot.area / 60)); for (let k = 0; k < n; k++) { const x = s.lot.c[0] + (R() - .5) * Math.sqrt(s.lot.area) * .7, z = s.lot.c[1] + (R() - .5) * Math.sqrt(s.lot.area) * .7; if (Poly.contains(s.P, x, z)) out.push(['agac', x, heightAt(x, z), z, R() * 6, .8 + R() * .6, R() < .4 ? 3 : 1]); } }
  else if (s.court && R() < .7) { const [cx, cz] = Poly.centroid(s.court); out.push(['agac', cx + 2.2, s.gmin + .15, cz + 1.6, R() * 6, .7 + R() * .5, R() < .5 ? 1 : 2]); }
  return out; }
const _v = new THREE.Vector3(); function xyzFrame(m, x, y, z) { _v.set(x, y, z).applyMatrix4(m); return [_v.x, _v.y, _v.z]; }
function xz(m, x, z) { _v.set(x, 0, z).applyMatrix4(m); return [_v.x, _v.z]; }
function angOf(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]); }
