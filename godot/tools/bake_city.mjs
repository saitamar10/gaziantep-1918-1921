// Şehir pişirme aracı: web oyununun (antep/src) şehir üreticisini Node'da çalıştırır,
// bütün geometriyi ve yerleşim verisini Godot'nun okuyacağı dosyalara yazar.
//   node godot/tools/bake_city.mjs      ->  godot/city_src/city.bin + city.json
// Sonra:  godot --headless --path godot --script res://tools/import_city.gd
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '../../antep');
const out = path.resolve(here, '../city_src');
const lib = pathToFileURL(path.join(web, 'lib')).href;
const hook = "export async function resolve(s, c, n) { if (s === 'three') return { url: '" + lib + "/three.module.js', shortCircuit: true }; if (s.startsWith('three/addons/')) return { url: '" + lib + "/jsm/' + s.slice(13), shortCircuit: true }; return n(s, c); }";
register('data:text/javascript,' + encodeURIComponent(hook));
const imp = p => import(pathToFileURL(path.join(web, 'src', p)).href);
const THREE = await import(lib + '/three.module.js');
const { CONFIG } = await imp('config.js');
const { GeoBuilder } = await imp('core/GeoBuilder.js');
const { rng, Poly } = await imp('core/MapCoordinates.js');
const { StreetLayout } = await imp('world/Streets.js');
const { Terrain, heightAt, RIVER, CASTLE, RAMP, HILLS, GULLIES, QUARRY } = await imp('world/Terrain.js');
const { Collision } = await imp('world/Collision.js');
const { Landmarks } = await imp('world/Landmarks.js');
const { Props } = await imp('world/Props.js');
const { specFor, buildBase, buildDetail, treesFor, collisionFor } = await imp('world/Buildings.js');
const { HeroStreet } = await imp('slice/HeroStreet.js');
const { NavGraph } = await imp('npc/NavGraph.js');
const { L } = await imp('data/historicalReferences.js');
const NAV_ONLY = process.argv.includes('--nav');   // yalnız yol ağı ve hikâye yerleri (city/nav.json); geometri yazılmaz

const names = new Proxy({}, { get: (_, k) => String(k) });   // malzeme yerine adı
const mats = { m: names, tex: names, size: {} };
const r3 = v => Math.round(v * 1000) / 1000;

/* ---- kayıt çıktısı ---- */
const blobs = []; let off = 0; const meshes = [];
function put(arr) { const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); blobs.push(b); const o = off; off += b.length; return o; }
function rgba(c) { const n = c.length / 3, o = new Float32Array(n * 4); for (let i = 0; i < n; i++) { o[i * 4] = c[i * 3]; o[i * 4 + 1] = c[i * 3 + 1]; o[i * 4 + 2] = c[i * 3 + 2]; o[i * 4 + 3] = 1; } return o; }
/* Godot farkları: ön yüz saat yönündedir (üçgen sırası çevrilir), dokuda v aşağı doğru artar (v = 1 - v) */
function flipI(idx) { const o = new Uint32Array(idx); for (let t = 0; t < o.length; t += 3) { const q = o[t + 1]; o[t + 1] = o[t + 2]; o[t + 2] = q; } return o; }
function flipV(u) { const o = new Float32Array(u); for (let t = 1; t < o.length; t += 2) o[t] = 1 - o[t]; return o; }
function emit(group, cell, mat, p, n, u, c, idx) { if (!idx.length) return;
  meshes.push({ g: group, c: cell, m: mat, v: p.length / 3, i: idx.length, p: put(new Float32Array(p)), n: put(new Float32Array(n)), u: put(flipV(u)), k: c ? put(rgba(c)) : -1, x: put(flipI(idx)) }); }
function emitG(group, cell, G) { for (const [k, B] of G.buf) if (B.count) emit(group, cell, k, B.p, B.n, B.u, B.c, B.i); }
/** büyük tek parça geometriyi 100 m hücrelere böler (görüş dışı kalan çizilmesin) */
function emitSplit(group, G) { const C = CONFIG.chunk;
  for (const [k, B] of G.buf) { const cells = new Map();
    for (let t = 0; t < B.i.length; t += 3) { const a = B.i[t], b = B.i[t + 1], c = B.i[t + 2]; const cx = (B.p[a * 3] + B.p[b * 3] + B.p[c * 3]) / 3, cz = (B.p[a * 3 + 2] + B.p[b * 3 + 2] + B.p[c * 3 + 2]) / 3; const key = Math.floor(cx / C) + ',' + Math.floor(cz / C);
      let o = cells.get(key); if (!o) cells.set(key, o = { p: [], n: [], u: [], c: [], i: [], map: new Map() });
      for (const v of [a, b, c]) { let q = o.map.get(v); if (q === undefined) { q = o.p.length / 3; o.map.set(v, q); o.p.push(B.p[v * 3], B.p[v * 3 + 1], B.p[v * 3 + 2]); o.n.push(B.n[v * 3], B.n[v * 3 + 1], B.n[v * 3 + 2]); o.u.push(B.u[v * 2], B.u[v * 2 + 1]); o.c.push(B.c[v * 3], B.c[v * 3 + 1], B.c[v * 3 + 2]); } o.i.push(q); } }
    for (const [key, o] of cells) emit(group, key, k, o.p, o.n, o.u, o.c, o.i); } }

console.time('bake');
const layout = new StreetLayout().generate();
const hero = new HeroStreet(mats); const ex = (x, z) => hero.excludes(x, z);
layout.lots = layout.lots.filter(l => !ex(l.c[0], l.c[1])); layout.sabats = layout.sabats.filter(q => !ex(q.x, q.z)); layout.squares = layout.squares.filter(q => !ex(q.x, q.z));
/* SOKAK GENİŞLETME (Godot): parselin YALNIZ SOKAĞA BAKAN kenarları geri çekilir; komşu parselle ortak kenarlara dokunulmaz
   (bitişik evler bitişik kalır). Sokak dokusu ve bağlantılar aynı kalır, her sokak 2 x GERI metre genişler.
   Oyun tasarım ölçüsüdür, tarihî ölçüm değildir. Çarşıda daha az (dükkân derinliği korunur).
   (İlk sürüm bütün kenarları küçültüyordu: evlerin arasında boşluk açılıyor, üst kat kanatları gövdeden kopuyordu.) */
const GERI = { carsi: 0.4, varsayilan: 0.55 }; let genisleyen = 0;
/* ARA SOKAKLAR DAR KALIR (19 Kasım 2026): geri çekme yalnız ana akslara (özgün genişliği >= 5,5 m) bakan cephelere uygulanır.
   Ara sokaklar üreticinin özgün genişliğinde (2,5–4 m) bırakılır: dar sokak + yüksek duvar, arşiv fotoğraflarındaki kesit. */
const SEGI = new Map(); { const cs = 40; layout.segments.forEach((sg, i) => { const x0 = Math.floor(Math.min(sg.a[0], sg.b[0]) / cs) - 1, x1 = Math.floor(Math.max(sg.a[0], sg.b[0]) / cs) + 1, z0 = Math.floor(Math.min(sg.a[1], sg.b[1]) / cs) - 1, z1 = Math.floor(Math.max(sg.a[1], sg.b[1]) / cs) + 1;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = x + ',' + z; let l = SEGI.get(k); if (!l) SEGI.set(k, l = []); l.push(i); } }); }
function sokakGen(mx, mz) { const l = SEGI.get(Math.floor(mx / 40) + ',' + Math.floor(mz / 40)); if (!l) return 0; let bd = 1e9, w = 0;
  for (const i of l) { const sg = layout.segments[i]; const d = Poly.distToSeg(mx, mz, sg.a[0], sg.a[1], sg.b[0], sg.b[1])[0]; if (d < bd) { bd = d; w = sg.w; } } return bd < 14 ? w : 0; }
function geriCek(lot, d) { const p = lot.poly, n = p.length; if (!lot.front || !lot.front.some(Boolean)) return false; const lines = [];
  for (let i = 0; i < n; i++) { const a = p[i], q = p[(i + 1) % n]; const L = Math.hypot(q[0] - a[0], q[1] - a[1]) || 1; let nx = -(q[1] - a[1]) / L, ny = (q[0] - a[0]) / L;
    if (!Poly.contains(p, (a[0] + q[0]) / 2 + nx * .2, (a[1] + q[1]) / 2 + ny * .2)) { nx = -nx; ny = -ny; }   /* içe bakan normal */
    const o = (lot.front[i] && sokakGen((a[0] + q[0]) / 2, (a[1] + q[1]) / 2) >= 5.5) ? d : 0; lines.push([a[0] + nx * o, a[1] + ny * o, q[0] - a[0], q[1] - a[1]]); }
  const out = []; for (let i = 0; i < n; i++) { const l1 = lines[(i - 1 + n) % n], l2 = lines[i]; const den = l1[2] * l2[3] - l1[3] * l2[2];
    if (Math.abs(den) < 1e-6) { out.push([l2[0], l2[1]]); continue; } const t = ((l2[0] - l1[0]) * l2[3] - (l2[1] - l1[1]) * l2[2]) / den; out.push([l1[0] + l1[2] * t, l1[1] + l1[3] * t]); }
  for (let i = 0; i < n; i++) if (Math.hypot(out[i][0] - p[i][0], out[i][1] - p[i][1]) > 3 * d + .5) return false;   /* sivri köşe: dokunma */
  if (Math.abs(Poly.area(out)) < .55 * Math.abs(Poly.area(p)) || Math.abs(Poly.area(out)) < 28) return false; lot.poly = out; return true; }
for (const lot of layout.lots) if (geriCek(lot, lot.zone === 'carsi' ? GERI.carsi : GERI.varsayilan)) genisleyen++;
for (const sg of layout.segments) if (sg.w >= 5.5) sg.w += 2 * GERI.carsi;
console.log('sokak genisletme: ' + genisleyen + '/' + layout.lots.length + ' parselin sokak cephesi geri cekildi');
const collision = new Collision(); const polys = [], circles = [];
const addPoly = collision.addPoly.bind(collision), addCircle = collision.addCircle.bind(collision);
collision.addPoly = p => { polys.push(p); addPoly(p); }; collision.addCircle = (x, z, r) => { circles.push([x, z, r]); addCircle(x, z, r); };

/* ---- arazi: yükseklik + zemin karışımı ızgarası ---- */
const { minX, maxX, minZ, maxZ } = CONFIG.bounds, st = CONFIG.terrainStep; const nx = Math.round((maxX - minX) / st) + 1, nz = Math.round((maxZ - minZ) / st) + 1;
const terr = new Terrain(mats, layout); const hgt = new Float32Array(nx * nz), spl = new Uint8Array(nx * nz * 4);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = minX + i * st, z = minZ + j * st, k = j * nx + i; hgt[k] = heightAt(x, z); const w = terr.splat(x, z); for (let q = 0; q < 4; q++) spl[k * 4 + q] = Math.round(w[q] * 255); }
const terrain = { nx, nz, step: st, minX, minZ, h: put(hgt), s: put(spl) };
terr.water(); { const g = terr.waterMesh.geometry; emit('water', '', 'water', g.attributes.position.array, g.attributes.normal.array, g.attributes.uv.array, null, g.index.array); }

/* ---- anıtlar ---- */
const lm = new Landmarks(collision).build(); emitSplit('lm', lm.G); for (let t = 1; t <= 3; t++) { emitSplit('sag' + t, lm.GA[t]); emitSplit('yik' + t, lm.GB[t]); }   /* tarihe göre değişen minare tepeleri */ const looseProps = [...lm.props];

/* ---- kemerli geçitler, meydan çeşmeleri (WorldManager.extras karşılığı) ---- */
{ const G = new GeoBuilder(); const GF = new GeoBuilder(); const R = rng(4242); const stc = new THREE.Color('#efe1c2'), bas = new THREE.Color('#d8d4d0');
  for (const s of layout.sabats) { const y = heightAt(s.x, s.z); const across = new THREE.Vector3(-Math.sin(s.ang), 0, Math.cos(s.ang)), along = new THREE.Vector3(Math.cos(s.ang), 0, Math.sin(s.ang));
    const m = new THREE.Matrix4().makeBasis(across, new THREE.Vector3(0, 1, 0), along).setPosition(s.x, y, s.z); const w = s.w + .3;
    /* KABALTI (arşiv fotoğrafındaki kesit): sokağın üstünden geçen oda. Altı 6 m derin, gölgeli bir tünel; kemerin üstü dolu duvar;
       üstte silmeli, düz damlı oda; odanın iki sokak yüzünde demir parmaklıklı kemerli pencereler. Ölçüler tasarım varsayımıdır. */
    const D = 6.0, sp = 2.6, r = w / 2, top = sp + r + .25, roomH = 4.2, dim = stc.clone().multiplyScalar(.82);
    G.autoFill = false; G.arch('stone2', m, w, sp, D, stc, R() < .4 ? bas : null, 11, .38, 'basalt'); G.autoFill = true;   /* tünel: kemer alınlığı dolgusu yok (içinden karşısı görünür) */
    for (const sx of [-1, 1]) for (const ad of [15, 40, 65]) { const a0 = ad * Math.PI / 180; const x0 = r * Math.cos(a0), y0 = sp + r * Math.sin(a0); if (r - x0 < .05) continue;
      G.boxM('stone', GeoBuilder.local(m, sx * (x0 + r) / 2, (y0 + top) / 2, 0), r - x0, top - y0, D, stc, { uvS: 3 }); }
    G.boxM('stone', GeoBuilder.local(m, 0, top + roomH / 2, 0), w + .9, roomH, D + .5, stc, { uvS: 3 });
    G.boxM('stone2', GeoBuilder.local(m, 0, top + .12, 0), w + 1.0, .28, D + .8, dim, { uvS: 2 });                 /* alt silme (çıkma) */
    G.boxM('stone2', GeoBuilder.local(m, 0, top + roomH + .2, 0), w + 1.0, .4, D + .7, dim, { uvS: 2 });           /* dam kenarı */
    for (const dir of [1, -1]) { const mf = new THREE.Matrix4().makeBasis(across.clone().multiplyScalar(dir), new THREE.Vector3(0, 1, 0), along.clone().multiplyScalar(dir)).setPosition(s.x, y, s.z);
      const xs = (w + .9) >= 3.3 ? [-.82, .82] : [0]; const hh = 1.45;
      for (const wx of xs) { const mw = GeoBuilder.local(mf, wx, top + 1.15, D / 2 + .25);
        G.boxM('dark', GeoBuilder.local(mw, 0, hh / 2 + .2, .01), .84, hh + .44, .06, '#fff');
        G.arch('stone', GeoBuilder.local(mw, 0, 0, .02), .86, hh, .16, dim, null, 9, .2, 'stone');
        G.boxM('stone', GeoBuilder.local(mw, 0, -.07, .1), 1.2, .13, .22, dim);
        for (const bx of [-.27, 0, .27]) G.boxM('iron', GeoBuilder.local(mw, bx, hh / 2 + .2, .09), .035, hh + .4, .035, '#fff');
        for (const by of [.35, .85, 1.35]) G.boxM('iron', GeoBuilder.local(mw, 0, by, .09), .84, .035, .035, '#fff'); } } }
  for (const q of layout.squares) { const y = heightAt(q.x, q.z); GF.box('stone2', q.x, y - .2, q.z, 2.4, 3.2, 1.2, .3, stc, { uvS: 1 }); GF.box('stone2', q.x, y - .2, q.z + 1.1, 2.0, .8, 1.0, .3, stc.clone().multiplyScalar(.9)); GF.box('water', q.x, y + .55, q.z + 1.1, 1.7, .02, .7, .3, '#fff', { faces: 16 }); collision.addCircle(q.x, q.z, 1.6); looseProps.push(['agac', q.x + 6, y, q.z + 4, 1, 1.8, 1]); collision.addCircle(q.x + 6, q.z + 4, .5); }
  emitSplit('kab', G); emitSplit('lm', GF); }

/* ---- parseller -> parçalar ---- */
const C = CONFIG.chunk; const chunks = new Map(); const aileler = {};
const LANDMARKS_XY = Object.values(L).filter(q => q && typeof q.x === 'number').map(q => [q.x, q.z]);
/** Yıkık ev kabuğu: yalnız dış duvarlar; üst kenarı tırtıklı, yer yer pencere boşluklu; içinde moloz ve devrilmiş kirişler. */
function ruinShell(G, s) { const Rr = rng(s.lot.id * 29 + 11); const P = s.P; const top = s.two ? s.yTop2 : s.yTop1; const K = s.stoneKey; const col = s.tint.clone().multiplyScalar(.8); const H = top - s.gmax;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L2 < .6) continue;
    const tx = (b[0] - a[0]) / L2, tz = (b[1] - a[1]) / L2; let nx = -tz, nz = tx; if (!Poly.contains(P, (a[0] + b[0]) / 2 + nx * .2, (a[1] + b[1]) / 2 + nz * .2)) { nx = -nx; nz = -nz; }   /* içe */
    const n = Math.max(1, Math.round(L2 / 1.7)); const ang = -Math.atan2(tz, tx); const pl = L2 / n;
    for (let k = 0; k < n; k++) { const t = (k + .5) / n * L2; const x = a[0] + tx * t + nx * .28, z = a[1] + tz * t + nz * .28; const corner = k === 0 || k === n - 1; const r1 = Rr(), r2 = Rr();
      let h = corner ? .7 + .3 * r1 : .22 + .78 * r1 * r1; if (!corner && r2 < .1) h = .12;                       /* gedik */
      const y1 = s.gmax + H * h; const y0 = s.yb;
      if (!corner && k % 2 === 1 && y1 > s.gmax + 3.0) { G.box(K, x, y0, z, pl + .02, s.gmax + 1.0 - y0, .56, ang, col, { uvS: 3 });    /* pencere boşluğu: denizlik + lento */
        G.box(K, x, s.gmax + 2.55, z, pl + .02, y1 - (s.gmax + 2.55), .56, ang, col, { uvS: 3 }); }
      else G.box(K, x, y0, z, pl + .02, y1 - y0, .56, ang, col, { uvS: 3 }); } }
  const c = Poly.centroid(P); const o = s.o; const rad = Math.max(1.5, Math.min(o.wid, 9) * .32);
  for (let i = 0; i < 10; i++) { const an = Rr() * 6.283, d = Rr() * rad; const x = c[0] + Math.cos(an) * d, z = c[1] + Math.sin(an) * d; if (!Poly.contains(P, x, z)) continue;
    G.box('stone2', x, s.gmax - .3, z, .8 + Rr() * 1.4, .5 + Rr() * 1.0, .7 + Rr() * 1.0, Rr() * 6.283, col.clone().multiplyScalar(.9), { uvS: 2 }); }
  for (let i = 0; i < 3; i++) { const an = Rr() * 6.283; const x = c[0] + Math.cos(an) * rad * .4, z = c[1] + Math.sin(an) * rad * .4; if (!Poly.contains(P, x, z)) continue;
    G.box('wood', x, s.gmax + .5 + Rr() * .8, z, 2.6 + Rr() * 1.6, .16, .16, Rr() * 6.283, '#3a2a1c'); } }
const chunkOf = (x, z, make) => { const key = Math.floor(x / C) + ',' + Math.floor(z / C); let ch = chunks.get(key); if (!ch && make) chunks.set(key, ch = { key, lots: [], trees: [], props: [] }); return ch; };
for (const lot of layout.lots) { const s = specFor(lot); lot.spec = s; if (s.type === 'bahce') s.stoneKey = 'rubble';   /* Godot: bahçe duvarı evlerden ayrı, moloz taş */
  /* AŞAMA 3 (ilk adım) — yapı aileleri ve yükseklik çeşitliliği: aynı tipteki evler aynı saçak hizasında durmasın.
     mütevazı tek katlı ev alçak, büyük avlulu konak yüksek tavanlı, diğerleri ±%8 oynar. Ölçüler tasarım varsayımıdır. */
  if (s.type !== 'bahce') { const R2 = rng(lot.id * 31 + 7); const k = R2(); let m = .94 + R2() * .16, aile = s.type === 'dukkan' ? 'dukkan' : s.type === 'avlulu' ? 'avlulu ev' : s.two ? 'iki katli ev' : 'tek katli ev';
    if (s.type === 'kompakt' && !s.two && k < .4) { m = .78 + R2() * .08; aile = 'mutevazi tek katli ev'; }
    else if (s.type === 'avlulu' && lot.area > 260) { m = 1.12 + R2() * .1; aile = 'buyuk avlulu konak'; }
    if (s.cumba) aile = 'cumbali ev';
    const d1 = s.f1 * (m - 1); s.f1 += d1; s.f2 += d1 + (R2() - .5) * .5; s.yTop1 = s.gmax + s.f1; s.yTop2 = s.gmax + s.f2; aileler[aile] = (aileler[aile] || 0) + 1; }
  else aileler['bahce'] = (aileler['bahce'] || 0) + 1; for (const cp of collisionFor(s)) collision.addPoly(cp); const ch = chunkOf(lot.c[0], lot.c[1], true); ch.lots.push(lot); ch.trees.push(...treesFor(s));
  /* YIKIK EV KABUĞU (REF-A04, REF-A16: çatısı ve döşemesi çökmüş taş ev kabukları). Seçilen evler iki sürümle pişirilir:
     sağlam (sag1..3) ve yıkık (yik1..3); oyun tarihe göre birini gösterir (city.gd set_damage). HANGİ evlerin yıkıldığı
     TEMSİLÎDİR: fotoğraflar adres vermez. İşaretli anıtların 45 m yakınındaki evler seçilmez. Çarpışma aynı kalır. */
  lot.ruin = 0; if (s.type !== 'bahce' && s.type !== 'dukkan') { const R5 = rng(lot.id * 17 + 3); const pick = R5(), tr = R5();
    if (pick < .035 && !LANDMARKS_XY.some(q => Math.hypot(q[0] - lot.c[0], q[1] - lot.c[1]) < 45)) lot.ruin = tr < .34 ? 1 : tr < .67 ? 2 : 3; }
  /* ASMA ve OT (arşiv fotoğrafındaki gibi): avlu/bahçe duvarlarının üstünden sokağa sarkan asma, duvar diplerinde ot.
     Yalnız sokağa bakan kenarlarda; yerler rastgeledir (ayrı akış: şehir dokusunu etkilemez). Kalıpları Godot kurar (city.gd). */
  { const R4 = rng(lot.id * 13 + 5); const P = s.P; for (let i = 0; i < P.length; i++) { if (!lot.front[i]) continue; const a = P[i], q = P[(i + 1) % P.length]; const L = Math.hypot(q[0] - a[0], q[1] - a[1]); if (L < 4) continue;
      let nx = -(q[1] - a[1]) / L, nz = (q[0] - a[0]) / L; if (Poly.contains(P, (a[0] + q[0]) / 2 + nx * .2, (a[1] + q[1]) / 2 + nz * .2)) { nx = -nx; nz = -nz; }   /* dışa bakan normal */
      const yaw = Math.atan2(nx, nz); const pv = s.type === 'bahce' ? .5 : s.type === 'avlulu' ? .2 : s.type === 'dukkan' ? 0 : .09; const r1 = R4(), r2 = R4(), r3 = R4(), r4 = R4(), r5 = R4();
      if (r1 < pv) { const t = .15 + r2 * .7; const x = a[0] + (q[0] - a[0]) * t, z = a[1] + (q[1] - a[1]) * t; const yT = s.type === 'bahce' ? s.gmax + 3.3 : s.yTop1;
        ch.props.push(['asma', x + nx * .12, yT, z + nz * .12, yaw, .8 + r3 * .7]); }
      if (r4 < (s.type === 'dukkan' ? .05 : .3)) { const n = 1 + Math.floor(r5 * 3); for (let k = 0; k < n; k++) { const t = R4(); const x = a[0] + (q[0] - a[0]) * t + nx * .18, z = a[1] + (q[1] - a[1]) * t + nz * .18;
          ch.props.push(['ot', x, heightAt(x, z), z, yaw + (R4() - .5), .7 + R4() * .8]); } } } } }
{ const R = rng(77); for (const s of layout.segments) { if (s.w < 4 || s.len < 20) continue; const dx = (s.b[0] - s.a[0]) / s.len, dz = (s.b[1] - s.a[1]) / s.len;
    for (let t = 8; t < s.len - 8; t += 26 + R() * 30) { if (R() > .35) continue; const sd = R() < .5 ? -1 : 1; const x = s.a[0] + dx * t - dz * sd * (s.w / 2 - .9), z = s.a[1] + dz * t + dx * sd * (s.w / 2 - .9); if (collision.blocked(x, z, 1.2) || ex(x, z)) continue;
      const ch = chunkOf(x, z, false); if (!ch) continue; ch.trees.push(['agac', x, heightAt(x, z), z, R() * 6, 1 + R() * .5, R() < .3 ? 3 : 1]); collision.addCircle(x, z, .35); } } }
for (const p of looseProps) { const ch = chunkOf(p[1], p[3], true); (p[0] === 'agac' ? ch.trees : ch.props).push(p); }
let nb = 0, nd = 0;
/* ---- TEST SOKAĞI: Blender cephe kiti (modeller/cephe/*.glb) bu yarıçaptaki evlere kuralla yerleşir; bu evlerde kodla üretilen
   ayrıntı (buildDetail) kapanır. Ölçü ve yerleşim kuralları YAKLAŞIK (Antep evi: sokağa sağır yüksek duvar, zemin katta yüksek
   küçük pencere, üst katta kepenkli pencere ve cumba). Kayıt: [parça, x, y, z, açı, x_ölçek] */
const TEST_SOKAK = { x: -700.4, z: 775.9, r: 45 };   /* plandan gelen 57 m sokağın ortası (şehir planı oturumu önerisi) */
const kit = [];
for (const lot of layout.lots) { const s = lot.spec; if (!s || s.type === 'bahce' || lot.ruin || Math.hypot(lot.c[0] - TEST_SOKAK.x, lot.c[1] - TEST_SOKAK.z) > TEST_SOKAK.r) continue;
  lot.kit = true; const R = rng(lot.id * 977 + 13); const P = s.P; let doorDone = false;
  const fronts = s.fronts.length ? s.fronts : [s.wingEdge >= 0 ? s.wingEdge : 0];
  for (const i of fronts) { const a = P[i], b = P[(i + 1) % P.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2.5) continue;
    const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, nx = tz, nz = -tx; const yaw = Math.atan2(nx, nz);
    const at = (t, out = 0) => [a[0] + tx * t + nx * out, a[1] + tz * t + nz * out];
    const upper = s.two && (s.type === 'kompakt' || i === s.wingEdge); const top = upper ? s.yTop2 : s.yTop1;
    const put = (name, t, y, sx = 1, out = 0.02) => { const [x, z] = at(t, out); kit.push([name, r3(x), r3(y), r3(z), r3(yaw), r3(sx)]); };
    const gAt = t => { const [x, z] = at(t); return heightAt(x, z); };
    // kapı: evin ilk uygun cephesinde
    const used = [];
    if (!doorDone && L > 3.2) { const t = L * (0.3 + R() * 0.4); put('kapi_kemerli', t, gAt(t)); used.push(t); doorDone = true;
      // kapı önü eşyaları
      const pool = ['testi', 'kup', 'sepet', 'sandik', 'cuval', 'sedir', 'kup_sehpa', 'kilim_yer', 'iskemle', 'kup_sehpa', 'kilim_yer'];
      for (let k = 0; k < 2 + Math.floor(R() * 3); k++) { const tt = t + (R() < .5 ? -1 : 1) * (1.1 + R() * 1.6); if (tt < .5 || tt > L - .5) continue; const nm = pool[Math.floor(R() * pool.length)];
        const out = nm === 'sedir' ? 0.32 : nm === 'kilim_yer' ? 0.7 : nm === 'kup_sehpa' ? 0.4 : 0.35 + R() * 0.25; const [x, z] = at(tt, out); kit.push([nm, r3(x), r3(heightAt(x, z)), r3(z), r3(yaw + (nm === 'sedir' ? 0 : (R() - .5) * 1.5)), 1]); if (nm !== 'kilim_yer') collision.addCircle(x, z, nm === 'sedir' ? .8 : .3); }
      if (R() < .2 && L > 6) { const tt = Math.min(L - 1.5, t + 3 + R() * 2); const [x, z] = at(tt, 0.6); if (sokakGen(x, z) >= 5) { kit.push(['el_arabasi', r3(x), r3(heightAt(x, z)), r3(z), r3(yaw + Math.PI / 2 + (R() - .5) * .3), 1]); collision.addCircle(x, z, .55); } }   /* el arabası yalnız 5 m ve üstü sokakta: dar sokakta yaya ağını kesmesin */ }
    // zemin katı: yüksek küçük pencereler
    for (let t = 1.2 + R() * 0.8; t < L - 0.9; t += 2.6 + R() * 1.6) { if (used.some(u => Math.abs(u - t) < 1.6)) continue; if (R() < .55) put('pencere_duz', t, gAt(t) + 2.1 + R() * 0.3); }
    // kat kuşağı ve üst kat
    if (upper) { put('kusak_1m', L / 2, s.yTop1, L);
      // cumba: sokağı daraltan çıkmalar (örnek görüntü); uzun cephede büyük çeşit, çok uzunda iki tane
      const cts = []; if (L > 4.5 && R() < .8) { if (L > 11) { cts.push([L * 0.3, L > 7 ? 'cumba_buyuk' : 'cumba'], [L * 0.72, 'cumba']); } else cts.push([L * (0.35 + R() * 0.3), L > 7 ? 'cumba_buyuk' : 'cumba']); }
      for (const [ct, nm] of cts) put(nm, ct, s.yTop1 + 0.25);
      for (let t = 1.0 + R() * 0.6; t < L - 0.8; t += 2.0 + R() * 0.9) { if (cts.some(([ct, nm]) => Math.abs(t - ct) < (nm === 'cumba_buyuk' ? 2.6 : 1.9))) continue; put(R() < .6 ? 'pencere_kemerli_kepenkli' : 'pencere_kemerli', t, s.yTop1 + 0.75); } }
    // tek katlı kesimde dam kirişi uçları (uzun gölge düşürür); iki katlıda saçak
    if (!upper && R() < .7) { for (let t = 0.5 + R() * 0.3; t < L - 0.4; t += 0.75 + R() * 0.25) put('kiris_ucu', t, top - 0.35); }
    // saçak ve çörten
    if (upper || R() < .4) put('sacak_1m', L / 2, top - 0.05, L + 0.3);
    for (let t = 1.5 + R() * 2; t < L - 1; t += 5 + R() * 3) put('corten', t, top - 0.3);
  } }
console.log('test sokagi kiti: ' + kit.length + ' parca');
let nruin = 0;
if (!NAV_ONLY) for (const ch of chunks.values()) { const G = new GeoBuilder(); const S = [null, new GeoBuilder(), new GeoBuilder(), new GeoBuilder()], Y = [null, new GeoBuilder(), new GeoBuilder(), new GeoBuilder()], SD = [null, new GeoBuilder(), new GeoBuilder(), new GeoBuilder()];
  for (const lot of ch.lots) { if (lot.ruin) { buildBase(S[lot.ruin], lot.spec); ruinShell(Y[lot.ruin], lot.spec); nruin++; } else buildBase(G, lot.spec); }
  emitG('base', ch.key, G); for (const B of G.buf.values()) nb += B.i.length / 3;
  const D = new GeoBuilder(); for (const lot of ch.lots) if (!lot.kit) buildDetail(lot.ruin ? SD[lot.ruin] : D, lot.spec, ch.props); emitG('detail', ch.key, D); for (const B of D.buf.values()) nd += B.i.length / 3;
  for (let t = 1; t <= 3; t++) { emitG('sag' + t, ch.key, S[t]); emitG('sad' + t, ch.key, SD[t]); emitG('yik' + t, ch.key, Y[t]); } }
console.log('yikik ev kabugu: ' + nruin + ' parsel');

/* ---- eşya ve ağaç kalıpları ---- */
const pr = new Props(mats);
for (const [k, parts] of Object.entries(pr.proto)) parts.forEach(pt => { const g = pt.geo.index ? pt.geo.toNonIndexed() : pt.geo; const a = g.attributes; const n = a.position.count; const idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i;
  const col = a.color ? a.color.array : null; emit('proto', k, pt.mat, a.position.array, a.normal.array, a.uv.array, col, idx); });

/* ---- yerleşim verisi ---- */
const P2 = p => p.map(q => [r3(q[0]), r3(q[1])]);
const json = { config: { chunk: C, bounds: CONFIG.bounds }, terrain, river: RIVER, castle: { rx: CASTLE.rx, rz: CASTLE.rz, topK: CASTLE.topK, ramp: RAMP }, rural: { hills: HILLS, gullies: GULLIES, quarry: QUARRY },
  hero: { origin: hero.w(0, 0), theta: hero.theta, dir: hero.dir, spawn: hero.spawn() },
  segments: layout.segments.map(s => [r3(s.a[0]), r3(s.a[1]), r3(s.b[0]), r3(s.b[1]), r3(s.w)]),
  squares: layout.squares.map(q => [r3(q.x), r3(q.z)]), markers: lm.markers, bridges: lm.bridgeDecks || [],
  polys: polys.map(P2), circles: circles.map(c => c.map(r3)), kit,
  chunks: [...chunks.values()].map(ch => ({ key: ch.key, trees: ch.trees.map(t => [r3(t[1]), r3(t[2]), r3(t[3]), r3(t[4] || 0), r3(t[5] || 1), t[6] || 1]), props: ch.props.map(p => [p[0], r3(p[1]), r3(p[2]), r3(p[3]), r3(p[4] || 0), r3(p[5] || 1), p[6] || 0]) })),
  meshes };
/* ---- yaya yol ağı + hikâye yerleri (toplantı bahçesi, han, cami, meydan) ---- */
{ const nav = new NavGraph().build(layout, collision, hero, { x: 0, z: 400, r: 6000 });
  const c = (() => { const q = hero.w(0, -50); return { x: q[0], z: q[1] }; })(); const from = nav.nearest(c.x, c.z, 90);
  let best = null, bd = 1e9;
  for (const l of layout.lots) { const sp = l.spec; if (!sp || sp.type !== 'bahce' || l.area < 90) continue; const d0 = Math.hypot(l.c[0] - c.x, l.c[1] - c.z); if (d0 > 230 || d0 >= bd) continue; const P = sp.P;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], Ln = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!l.front[i] || Ln <= 5) continue;
      const gx = (a[0] + b[0]) / 2, gz = (a[1] + b[1]) / 2; let nx = -(b[1] - a[1]) / Ln, nz = (b[0] - a[0]) / Ln; if ((l.c[0] - gx) * nx + (l.c[1] - gz) * nz > 0) { nx = -nx; nz = -nz; }
      const o = { x: gx + nx * 1.3, z: gz + nz * 1.3 }; if (collision.blocked(gx, gz, .32) || collision.blocked(o.x, o.z, .32) || collision.blocked(l.c[0], l.c[1], .4)) continue;
      const node = nav.nearest(o.x, o.z, 25); if (!node || !nav.path(from, node) || !nav.walkable(collision, [node.x, node.z], [o.x, o.z])) continue;
      const tx = -nz, tz = nx; const circle = []; for (let k = 0; k < 5; k++) { const ang = k / 5 * Math.PI * 2, x = l.c[0] + Math.cos(ang) * 1.5, z = l.c[1] + Math.sin(ang) * 1.5; if (!collision.blocked(x, z, .3)) circle.push({ x, z, yaw: Math.atan2(l.c[0] - x, l.c[1] - z) }); }
      if (circle.length < 3) continue;
      best = { gate: { x: gx, z: gz }, out: o, center: { x: l.c[0], z: l.c[1] }, lookout: { x: gx + nx * 1.0 + tx * 1.1, z: gz + nz * 1.0 + tz * 1.1, yaw: Math.atan2(nx, nz) }, circle }; bd = d0; break; } }
  if (!best) throw new Error('Toplantı için uygun bahçe bulunamadı');
  const mk = id => lm.markers.find(m => m.id === id);
  /* kaba kuvvet en yakin dugum (NavGraph.nearest buyuk aglarda karma cakismasi yuzunden uzak dugum donebiliyor) */
  const near = (l, maxR = 70) => { let n = null, bd = maxR; for (const q of nav.nodes) { const d = Math.hypot(q.x - l.x, q.z - l.z); if (d < bd) { bd = d; n = q; } } return n ? { x: r3(n.x), z: r3(n.z) } : null; };
  const nodes = [], edges = []; for (const n of nav.nodes) { nodes.push(r3(n.x), r3(n.z)); for (const e of n.e) if (e.to.id > n.id) edges.push(n.id, e.to.id, r3(e.w)); }
  const navOut = { nodes, edges, garden: best, han: near(mk('millet')), cami: near(mk('alauddevle')), meydan: near({ x: 160, z: 368 }, 40) };
  const dir = path.resolve(here, '../city'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'nav.json'), JSON.stringify(navOut));
  console.log('yol agi: dugum=' + nav.nodes.length + ' kenar=' + edges.length / 3 + ' bahce=' + JSON.stringify(best.center) + ' han=' + JSON.stringify(navOut.han) + ' cami=' + JSON.stringify(navOut.cami) + ' L.millet=' + L.millet.x + ',' + L.millet.z + ' meydan=' + JSON.stringify(navOut.meydan)); }
if (!NAV_ONLY) {
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'city.bin'), Buffer.concat(blobs));
fs.writeFileSync(path.join(out, 'city.json'), JSON.stringify(json));
}
console.timeEnd('bake');
const V = g => meshes.filter(m => m.g === g).reduce((a, m) => a + m.v, 0);
console.log('yapi aileleri: ' + JSON.stringify(aileler));
if (!NAV_ONLY) console.log('parsel=' + layout.lots.length + ' parca=' + chunks.size + ' kafes=' + meshes.length + ' taban_ucgen=' + nb + ' detay_ucgen=' + nd + ' kose: taban=' + V('base') + ' detay=' + V('detail') + ' anit=' + V('lm') + ' | bin=' + (off / 1048576).toFixed(1) + 'MB carpisma=' + polys.length + '+' + circles.length);
console.log('hero', JSON.stringify(json.hero), 'mats', [...new Set(meshes.map(m => m.m))].join(','));
