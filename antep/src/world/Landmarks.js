// Doğrulanmış (ve varsayım olarak işaretli) simge yapılar.
// Ölçüler: kaynakta verilmeyen tüm boyutlar tasarım varsayımıdır (bkz. historicalReferences).
import * as THREE from 'three';
import { GeoBuilder } from '../core/GeoBuilder.js';
import { Poly } from '../core/MapCoordinates.js';
import { L } from '../data/historicalReferences.js';
import { heightAt, baseHeight, CASTLE, RAMP, RAMP_KEY, RAMP_S, RIVER, moundFactor } from './Terrain.js';
import { AXES, ROADS } from './Streets.js';

const STONE = new THREE.Color('#f2e4c6'), STONE_D = new THREE.Color('#d9c8a4'), BAS = new THREE.Color('#d8d4d0'), WHITE = new THREE.Color('#ffffff');
// Gaziantep için kıble yönü ~165° (kuzeyden saat yönü) — yaklaşık
const QIBLA = (165) * Math.PI / 180; const QDIR = [Math.sin(QIBLA), -Math.cos(QIBLA)]; // (x doğu, z güney)

/** yönlü dikdörtgen çokgen */
function rect(cx, cz, w, d, ang) { const c = Math.cos(ang), s = Math.sin(ang); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [cx + u * c - v * s, cz + u * s + v * c]); }
function footprintY(poly) { const ys = poly.map(p => heightAt(p[0], p[1])); return [Math.min(...ys), Math.max(...ys)]; }

export class Landmarks {
  constructor(collision) { this.col = collision; this.G = new GeoBuilder(); this.props = []; this.markers = [];
    /* tarihe göre değişen parçalar: sağlam minare tepesi (GA[kademe]) ve hasarlı hâli (GB[kademe]) */
    this.GA = [null, new GeoBuilder(), new GeoBuilder(), new GeoBuilder()]; this.GB = [null, new GeoBuilder(), new GeoBuilder(), new GeoBuilder()]; }
  build() {
    this.castle();
    // camiler (ölçüler varsayım; konumlar doğrulanmış)
    this.mosque(L.tahtani, { w: 18, d: 14, court: 14, dome: false, minH: 26, ablak: false });
    this.mosque(L.alauddevle, { w: 15, d: 15, court: 12, dome: true, minH: 28, ablak: true });
    this.mosque(L.omeriye, { w: 17, d: 13, court: 12, dome: false, minH: 24, ablak: false });
    this.mosque(L.alinacar, { w: 18, d: 14, court: 16, dome: false, minH: 22, ablak: false, sadirvan: true });
    this.mosque(L.seyhfethullah, { w: 20, d: 18, court: 18, dome: true, minH: 17, ablak: true, sadirvan: true });
    // Kozanlı: kısa, kalın, burmalı minare; 1920'de şerefesi parçalanmış (REF-A17). Handaniye: onikigen gövde; 1920'de külahı yok (REF-A18).
    this.mosque(L.kozanli, { w: 12, d: 10, court: 9, dome: false, minH: 17, ablak: true, minR: 1.25, minSeg: 16, hasar: { kademe: 2, tur: 'serefe' } });
    this.mosque(L.handaniye, { w: 16, d: 13, court: 12, dome: false, minH: 22, ablak: true, minR: 1.0, minSeg: 12, hasar: { kademe: 2, tur: 'kulah' } });
    // hanlar
    this.han(L.millet, { w: 42, d: 46, cw: 18, cd: 24, floors: 2 });
    this.han(L.yuzukcu, { w: 34, d: 34, cw: 14, cd: 14, floors: 2 });
    this.han(L.tutun, { w: 32, d: 30, cw: 14, cd: 12, floors: 2 });
    this.bedesten(L.zincirli); this.arasta(L.bakircilar);
    // kiliseler
    this.church(L.kendirli, { w: 20, d: 34, h: 12, hip: true, garden: [58, 66] });
    this.cathedral(L.meryemana);
    this.college(L.kolej); this.hospital(L.hastane);
    this.bridges();
    return this;
  }
  mark(l, x = l.x, z = l.z) { this.markers.push({ id: l.id, name: l.name, type: l.type, status: l.status, x, z, facts: l.facts, assumptions: l.assumptions }); }
  solid(poly) { this.col.addPoly(poly); }

  /* ---------------- KALE ---------------- */
  castle() {
    // Yeniden kurulum (20 Kasım 2026). Kaynaklar ve güven düzeyleri: godot/docs/kale-kaynaklar.md.
    // KAYNAK: 35 m höyük, 12 burç, 30 m x 10 m hendek, köprü ve iki yanındaki kuleler (1557), batı yamacında 150 m'lik mazgallı
    // savunma galerisi (Kurtuluş Savaşı'nda yıkıldı), kuzeybatı eteğinde iki tünel ağzı (1822 depreminden sonra dolduruldu),
    // doğu yamacında otuzdan fazla kaya oyma konut, 1822 depremi ve kuşatmadan kalma yıkık surlar.
    // OLASI: kapı ve köprünün batıda olması. TAHMİN: köprünün ölçüleri ve göz sayısı, yamaç yolunun güzergâhı, üst kapının yeri,
    // yıkık sur kesimleri, konut ağızlarının tek tek yeri, iç düzlükteki yıkıntıların yeri.
    const G = this.G; const l = L.kale; this.mark(l);
    const k = CASTLE.topK + .005, N = 96, rx = CASTLE.rx * k, rz = CASTLE.rz * k; const yTop = baseHeight(0, 0) + CASTLE.height;
    const P = i => { const a = i / N * Math.PI * 2; return [Math.cos(a) * rx, Math.sin(a) * rz]; };
    const H = {
      E: (a, kk) => [Math.cos(a) * CASTLE.rx * kk, Math.sin(a) * CASTLE.rz * kk],                               // höyük elipsinde nokta
      NRM: a => { const nx = Math.cos(a) * CASTLE.rz, nz = Math.sin(a) * CASTLE.rx, nl = Math.hypot(nx, nz); return [nx / nl, nz / nl]; },   // dış normal
      angOf: ([x, z], kk) => Math.atan2(z / (CASTLE.rz * kk), x / (CASTLE.rx * kk)),
      yaw: (dx, dz) => -Math.atan2(dz, dx),                                                                     // box(): yerel x -> (dx, dz)
      // yerel z = (zx, zz) yönünde, sağ elli taban (yerel x = z x yukarı); kemer ve yüzey çizimi için
      basisZ: (zx, zz, x, y, z) => new THREE.Matrix4().makeBasis(new THREE.Vector3(-zz, 0, zx), new THREE.Vector3(0, 1, 0), new THREE.Vector3(zx, 0, zz)).setPosition(x, y, z)
    };
    const { NRM, yaw, basisZ } = H;
    const gateA = H.angOf(RAMP[RAMP_KEY.top], CASTLE.topK); const wallH = 6.4, th = 2.4;
    const dAng = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    // yıkık / alçalmış sur kesimleri (açı, yarı genişlik) — TAHMİN (1890 fotoğrafı ve 1941 kartpostalında sur yer yer yıkık)
    const RUIN = [[3.95, .16], [5.55, .12], [.55, .09], [2.45, .13], [1.2, .08], [4.7, .07]];
    const ruinK = a => { let m = 1; for (const [c, w] of RUIN) { const d = dAng(a, c); if (d < w) m = Math.min(m, .22 + .5 * (d / w) * (d / w)); } return m; };
    for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, am = (a0 + a1) / 2; if (dAng(am, gateA) < .06) continue;
      const p0 = P(i), p1 = P(i + 1); const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2; const Lg = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + .3; const ang = -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const y0 = Math.min(heightAt(mx, mz), yTop) - 5; const rk = ruinK(am); const yr = yTop + wallH * rk * (.94 + .12 * Math.abs(Math.sin(i * 1.7)));
      G.box('stone', mx, y0, mz, Lg, yr - y0, th, ang, STONE_D.clone().multiplyScalar(.88 + .1 * Math.sin(i * 2.3)), { uvS: 3 });
      const [ux, uz] = NRM(am);
      if (rk > .95) { // sağlam kesim: dış kenarda alçak siper duvarı, seyrek mazgal dişleri
        G.box('stone', mx + ux * (th / 2 - .3), yr, mz + uz * (th / 2 - .3), Lg, .55, .6, ang, STONE_D, { uvS: 2 });
        if (i % 2 === 0) G.box('stone', mx + ux * (th / 2 - .3), yr + .55, mz + uz * (th / 2 - .3), Lg * .45, .75, .6, ang, STONE_D, { uvS: 2 });
      } else { // yıkık kesim: eteğe dökülmüş taş yığını
        for (let m = 0; m < 3; m++) { const q = Math.sin(i * 7.1 + m * 3.3), d = 2.2 + m * 1.9; const bx = mx + ux * d + q * 1.4, bz = mz + uz * d - q * 1.1; G.box('stone2', bx, heightAt(bx, bz) - .5, bz, 1.6 + (m % 2) * 1.1, 1.0 + .5 * Math.abs(q), 1.3, i + m, STONE_D.clone().multiplyScalar(.82), { uvS: 2 }); } }
      this.solidSeg(p0, p1, th);
    }
    // 12 burç: dikdörtgen, çokgen (beş köşeli) ve yarım yuvarlak — farklı biçim ve yükseklikte
    for (let i = 0; i < 12; i++) { const a = gateA + (i + .5) / 12 * Math.PI * 2; const cx = Math.cos(a) * rx, cz = Math.sin(a) * rz;
      const [nx, nz] = NRM(a); const tx = -nz, tz = nx;
      const W = (u, v) => [cx + tx * u + nx * v, cz + tz * u + nz * v];
      const kind = [0, 2, 1, 0, 2, 0, 1, 2, 0, 1, 2, 0][i]; const wT = 6 + (i * 7 % 3) * .5; const proj = 3 + (i * 5 % 3) * .5;
      const rk = ruinK(a) < .95 || i === 4 ? .6 : 1; const hT = (7.5 + (i * 11 % 6) * .5) * rk; // en çok 10 m
      const [ox, oz] = W(0, proj); const y0 = heightAt(ox, oz) - 6; const y1 = yTop + hT; const col = STONE_D.clone().multiplyScalar(.9 + .06 * Math.sin(i * 1.9));
      if (kind === 0) { const poly = [W(-wT / 2, -1.6), W(wT / 2, -1.6), W(wT / 2, proj), W(-wT / 2, proj)]; G.prism('stone', poly, y0, y1, col, { topKey: 'stone2' }); this.col.addPoly(poly);
        if (rk === 1) for (const u of [-wT / 2 + .7, 0, wT / 2 - .7]) { const [mx, mz] = W(u, proj - .35); G.box('stone', mx, y1, mz, 1.3, 1.0, .7, -Math.atan2(tz, tx), STONE_D, { uvS: 2 }); } }
      else if (kind === 1) { const poly = [W(-wT / 2, -1.6), W(wT / 2, -1.6), W(wT / 2, proj * .45), W(0, proj + .6), W(-wT / 2, proj * .45)]; G.prism('stone', poly, y0, y1, col, { topKey: 'stone2' }); this.col.addPoly(poly); }
      else { const r = wT / 2; const [qx, qz] = W(0, proj - r); G.cylinder('stone', qx, y0, qz, r + .35, r, y1 - y0, col, 18, true, 3); this.col.addCircle(qx, qz, r + .2);
        if (rk === 1) for (let m = 0; m < 5; m++) { const b = a + (m - 2) * .5; G.box('stone', qx + Math.cos(b) * (r - .35), y1, qz + Math.sin(b) * (r - .35), 1.2, 1.0, .7, -b + Math.PI / 2, STONE_D, { uvS: 2 }); } }
      const [sx, sz] = W(0, proj + (kind === 1 ? .62 : .03)); if (kind !== 2) G.boxM('dark', new THREE.Matrix4().makeRotationY(-a + Math.PI / 2).setPosition(sx, yTop + hT * .55, sz), .22, 1.3, .05, WHITE, { faces: 1 });
    }
    // ÜST KAPI (yamaç yolunun ucunda, yeri TAHMİN): iki payanda arasında kemerli geçit; bir payandanın üstü yıkık
    { const [gx, gz] = RAMP[RAMP_KEY.top]; const [nx, nz] = NRM(gateA); const tx = -nz, tz = nx;
      for (const sd of [-1, 1]) { const x = gx + tx * sd * 4.3 + nx * .6, z = gz + tz * sd * 4.3 + nz * .6; const hh = sd < 0 ? 5.6 : 9.2; G.box('stone', x, yTop - 8, z, 4.4, hh + 8, 7.5, yaw(tx, tz), STONE_D, { uvS: 3 }); this.col.addPoly(rect(x, z, 4.4, 7.5, Math.atan2(tz, tx))); }
      G.box('stone', gx + tx * 1.2 + nx * .6, yTop + 5.3, gz + tz * 1.2 + nz * .6, 6.6, 3.2, 7.5, yaw(tx, tz), STONE_D, { uvS: 3 });
      G.arch('basalt', basisZ(nx, nz, gx + nx * (th / 2 + .1), yTop - .2, gz + nz * (th / 2 + .1)), 4.0, 3.3, 1.1, BAS, STONE, 13, .5, 'stone');
      for (let m = 0; m < 5; m++) { const q = Math.sin(m * 4.7); const bx = gx - tx * (7.5 + m * 1.3) + nx * (3.5 + q), bz = gz - tz * (7.5 + m * 1.3) + nz * (3.5 + q); G.box('stone2', bx, heightAt(bx, bz) - .4, bz, 1.5 + (m % 2), 1.0 + .4 * Math.abs(q), 1.2, m * 1.3, STONE_D.clone().multiplyScalar(.82), { uvS: 2 }); } }
    this.castleBridge(H);
    this.castleGallery(H);
    this.castleUnderground(H);
    // yamaç yolu: aşağı (dış) yanda alçak istinat duvarı (TAHMİN); köprü kesiminde değil
    { const sG = RAMP_S[RAMP_KEY.gate] + 4, sT = RAMP_S[RAMP_KEY.top] - 3;
      for (let i = RAMP_KEY.gate; i < RAMP_KEY.top; i++) { const [ax, az] = RAMP[i], [bx, bz] = RAMP[i + 1]; const Ls = Math.hypot(bx - ax, bz - az); const tx = (bx - ax) / Ls, tz = (bz - az) / Ls;
        for (let t = 0; t < Ls; t += 2) { const sAt = RAMP_S[i] + t; if (sAt < sG || sAt > sT) continue; const x = ax + tx * t, z = az + tz * t; const y = heightAt(x, z);
          const nx = -tz, nz = tx; const sd = moundFactor(x + nx * 3, z + nz * 3) > moundFactor(x - nx * 3, z - nz * 3) ? 1 : -1;   // aşağı yan
          const px = x + nx * 3.6 * sd, pz = z + nz * 3.6 * sd; const yg = Math.min(heightAt(px, pz), y) - 1.2; G.box('stone2', px, yg, pz, 2.1, y + .95 - yg, .6, yaw(tx, tz), STONE_D, { uvS: 2 }); this.col.addCircle(px, pz, .5); } } }
    // iç düzlük (1822 depremi iç Osmanlı yapılarını yıktı — KAYNAK): yıkıntı izleri; Kanuni dönemi mescit ve sarnıç (KAYNAK: vardı;
    // yerleri TAHMİN — mescit, Kale Camii'nin bugünkü yerine kondu)
    for (let i = 0; i < 9; i++) { const a = i * 2.3, r = 12 + (i * 13) % 28; const x = Math.cos(a) * r * .9, z = Math.sin(a) * r * .75; G.box('stone2', x, yTop - .5, z, 5 + (i % 3) * 2.5, 1.4 + (i % 4) * .8, .8, a, STONE_D, { uvS: 2 }); }
    { const mx = -13.5, mz = 12.5, w = 9; const hs = [3.4, 2.1, 2.8, 1.6];
      const sides = [[mx, mz - w / 2, w, .8], [mx + w / 2, mz, .8, w], [mx + w * .2, mz + w / 2, w * .55, .8], [mx - w / 2, mz, .8, w]];   // güney duvarında kapı boşluğu
      sides.forEach(([x, z, sw, sd], i) => { G.box('stone', x, heightAt(x, z) - .5, z, sw, hs[i] + .5, sd, 0, STONE_D, { uvS: 2 }); this.col.addPoly(rect(x, z, sw, sd, 0)); });
      const sx = 20, sz = -8; const ys = heightAt(sx, sz); G.cylinder('stone', sx, ys - .3, sz, 2.4, 2.4, 1.0, STONE_D, 16, true, 2); G.cylinder('dark', sx, ys + .7, sz, 1.7, 1.7, .04, WHITE, 16, true, 1); this.col.addCircle(sx, sz, 2.5); }
  }

  /** Köprü başı (iki kule, 1557), hendeği aşan iki gözlü taş köprü + hareketli ahşap kısım, alt kapı. Ölçüler TAHMİN; biçim 1890 fotoğrafı. */
  castleBridge(H) {
    const G = this.G; const { yaw, basisZ } = H; const B = RAMP[RAMP_KEY.barbican], Gt = RAMP[RAMP_KEY.gate];
    const Lb = Math.hypot(Gt[0] - B[0], Gt[1] - B[1]); const ux = (Gt[0] - B[0]) / Lb, uz = (Gt[1] - B[1]) / Lb; const px = -uz, pz = ux;   // u: köprü ekseni (içeri), p: yan
    const at = (u, v) => [B[0] + ux * u + px * v, B[1] + uz * u + pz * v]; const ay = yaw(ux, uz); const ra = Math.atan2(uz, ux);
    const y0 = heightAt(B[0], B[1]), y1 = heightAt(Gt[0], Gt[1]); const deckY = u => y0 + (y1 - y0) * Math.max(0, Math.min(1, u / Lb));
    const floorY = u => Math.min(heightAt(...at(u, 0)), heightAt(...at(u, 2)), heightAt(...at(u, -2)));
    const BW = 4.2, MOV = 4.5;   // köprü genişliği, kapı ucundaki hareketli (ahşap) kısım
    // iki göz ve aradaki 3 m'lik ayak; gövde = baş/ayak dolguları + kemerler + kemer üstü dolgu
    const sw = (Lb - MOV - 2.5 - 3) / 2; const spans = [[2.5, sw], [2.5 + sw + 3, sw]];
    const solidRanges = [[0, 2.5], [2.5 + sw, 2.5 + sw + 3], [2.5 + 2 * sw + 3, Lb - MOV]];
    for (const [a, b] of solidRanges) for (let u = a; u < b - .01; u += 1.5) { const u2 = Math.min(b, u + 1.5), um = (u + u2) / 2; const [x, z] = at(um, 0); const fy = floorY(um) - .6; G.box('stone', x, fy, z, u2 - u + .02, deckY(um) - .2 - fy, BW, ay, STONE_D, { uvS: 3 }); }
    G.autoFill = false;
    for (const [s0, w] of spans) { const um = s0 + w / 2; const fy = Math.min(floorY(s0), floorY(s0 + w)) - .3; const spring = 2.6; const r = w / 2;
      const [x, z] = at(um, 0); G.arch('stone2', basisZ(px, pz, x, fy, z), w, spring, BW, STONE_D, null, 13, .55);
      for (let q = -r; q < r - .01; q += .6) { const q2 = Math.min(r, q + .6), qm = (q + q2) / 2; const top = fy + spring + Math.sqrt(Math.max(0, r * r - qm * qm)) + .45; const dy = deckY(um + qm) - .2 - top; if (dy <= .05) continue; const [bx, bz] = at(um + qm, 0); G.box('stone', bx, top, bz, q2 - q + .02, dy, BW, ay, STONE_D, { uvS: 3 }); } }
    G.autoFill = true;
    { const L2 = Lb - MOV; const [x0, z0] = at(0, 0), [x1, z1] = at(L2, 0); const ya = y0, yb = deckY(L2);
      const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(ux * L2, yb - ya, uz * L2).normalize(), new THREE.Vector3(-(yb - ya) / L2 * ux, 1, -(yb - ya) / L2 * uz).normalize(), new THREE.Vector3(px, 0, pz)).setPosition((x0 + x1) / 2, (ya + yb) / 2 - .14, (z0 + z1) / 2);
      G.boxM('stone2', m, Math.hypot(L2, yb - ya), .3, BW - .1, STONE, { uvS: 2 }); }   // eğimli döşeme taşı
    // hareketli kısım (Kültür Portalı: "hareketli köprü"): iki taş yanak arasında kirişli ahşap döşeme, altı boş
    for (const sd of [-1, 1]) { const [x, z] = at(Lb - MOV / 2, sd * (BW / 2 - .35)); const fy = floorY(Lb - MOV / 2) - .5; G.box('stone', x, fy, z, MOV, deckY(Lb - MOV) - .4 - fy, .7, ay, STONE_D, { uvS: 3 }); }
    for (let u = Lb - MOV; u < Lb - .01; u += .45) { const [x, z] = at(u + .22, 0); G.box('planks', x, deckY(u) - .18, z, .42, .18, BW - .3, ay, '#8a6a48'); }
    for (const sd of [-1, 1]) { const [x, z] = at(Lb - MOV / 2, sd * 1.2); G.box('wood', x, deckY(Lb - MOV) - .55, z, MOV, .35, .3, ay, '#4a3624'); }
    // korkuluk: alçak taş eşik + ahşap dikme ve tırabzan (1890 fotoğrafında ince korkuluk)
    for (const sd of [-1, 1]) {
      for (let u = 0; u < Lb - .01; u += 2) { const u2 = Math.min(Lb, u + 2), um = (u + u2) / 2; const [x, z] = at(um, sd * (BW / 2 - .2)); const y = deckY(um);
        G.box('stone2', x, y - .05, z, u2 - u + .02, .35, .4, ay, STONE_D, { uvS: 2 }); G.box('wood', x, y + .3, z, .12, .85, .12, ay, '#9a7a56'); }
      const [x0, z0] = at(0, sd * (BW / 2 - .2)), [x1, z1] = at(Lb, sd * (BW / 2 - .2));
      const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(ux * Lb, y1 - y0, uz * Lb).normalize(), new THREE.Vector3(0, 1, 0), new THREE.Vector3(px, 0, pz)).setPosition((x0 + x1) / 2, (y0 + y1) / 2 + 1.12, (z0 + z1) / 2);
      G.boxM('wood', m, Math.hypot(Lb, y1 - y0), .1, .1, '#9a7a56');
      this.col.addPoly(rect(...at(Lb / 2, sd * (BW / 2 + .05)), Lb, .3, ra)); }
    // yürüme yüzeyi: Godot ground() köprü döşemelerini okur (sabit yükseklikli dikdörtgenler); eğim 1 m'lik parçalarla
    this.bridgeDecks = this.bridgeDecks || []; for (let u = 0; u < Lb; u += 1) { const [x, z] = at(u + .5, 0); this.bridgeDecks.push({ x, z, ang: ay, len: 1.02, w: BW - .5, y: deckY(u + .5) }); }
    // KÖPRÜ BAŞI: iki kare kule (1557, KAYNAK). Kuzeydeki yüksek ve mazgallı (1890 fotoğrafı), güneydeki alçak, tepesi yıkık (TAHMİN)
    for (const sd of [-1, 1]) { const c = at(-2.2, sd * 5); const poly = rect(c[0], c[1], 6.4, 6.2, ra); const [gmin] = footprintY(poly); const north = (c[1] < B[1]); const hT = north ? 14 : 8.5;
      G.prism('stone', poly, gmin - .8, y0 + hT, STONE_D.clone().multiplyScalar(north ? .95 : .88), { topKey: 'stone2' }); this.col.addPoly(poly);
      if (north) for (const [mu, mv] of [[-2.6, -2.5], [0, -2.5], [2.6, -2.5], [-2.6, 2.5], [0, 2.5], [2.6, 2.5], [-2.6, 0], [2.6, 0]]) { const [mx, mz] = at(-2.2 + mu, sd * 5 + mv); G.box('stone', mx, y0 + hT, mz, 1.1, 1.0, 1.1, ay, STONE_D, { uvS: 2 }); }
      else for (let m = 0; m < 4; m++) { const [mx, mz] = at(-4 - m * 1.4, sd * (6 + m * .6)); G.box('stone2', mx, heightAt(mx, mz) - .4, mz, 1.6, .9 + (m % 2) * .5, 1.3, m, STONE_D.clone().multiplyScalar(.82), { uvS: 2 }); }
      for (const h of [.45, .7]) { const [mx, mz] = at(-5.42, sd * 5); G.boxM('dark', basisZ(-ux, -uz, mx, y0 + hT * h, mz), .2, 1.2, .02, WHITE, { faces: 1 }); } }
    { const [x, z] = at(-2.2, 0); G.box('stone', x, y0 + 4.6, z, 3.8, 3.4, 6.2, ay, STONE_D, { uvS: 3 });
      const [ax, az] = at(-4.0, 0); G.arch('basalt', basisZ(-ux, -uz, ax, y0 - .05, az), 3.6, 3.1, 1.0, BAS, STONE, 13, .45, 'stone'); }
    // ALT KAPI: savunma galerisinin içinde, köprünün iç ucunda (biçim TAHMİN)
    { const gy = y1;
      for (const sd of [-1, 1]) { const [x, z] = at(Lb + 2, sd * 3.9); const poly = rect(x, z, 4, 4.4, ra); const [gmin] = footprintY(poly); G.prism('stone', poly, gmin - 1, gy + 7.5, STONE_D.clone().multiplyScalar(.92), { topKey: 'stone2' }); this.col.addPoly(poly);
        for (const mv of [-1.2, 1.2]) { const [mx, mz] = at(Lb + 2 + mv, sd * 3.9); G.box('stone', mx, gy + 7.5, mz, 1.0, .9, 1.0, ay, STONE_D, { uvS: 2 }); } }
      { const [x, z] = at(Lb + 2, 0); G.box('stone', x, gy + 4.4, z, 4.4, 3.1, 3.8, ay, STONE_D, { uvS: 3 }); }
      const [ax, az] = at(Lb + .1, 0); G.arch('basalt', basisZ(-ux, -uz, ax, gy - .05, az), 3.6, 3.0, 1.0, BAS, STONE, 13, .45, 'stone'); }
  }

  /** Batı savunma galerisi: hendeğin başladığı ana kaya üstünde 150 m, mazgallı (KAYNAK: Yamaç 2023). Kurtuluş Savaşı'nda neredeyse
   *  tamamen yıkıldı → sağlam hâli GA[2], yıkık hâli GB[2] (kuşatmanın ortasından sonra yıkık görünür). Yükseklik ve kesit TAHMİN. */
  castleGallery(H) {
    const { E, NRM, yaw } = H; const aGate = H.angOf(RAMP[RAMP_KEY.gate], 1); const A0 = 3 * Math.PI / 4, A1 = 5 * Math.PI / 4; const n = 64;
    for (let i = 0; i < n; i++) { const a = A0 + (A1 - A0) * (i + .5) / n; if (Math.abs(a - aGate) < .045) continue;
      const p0 = E(A0 + (A1 - A0) * i / n, 1.005), p1 = E(A0 + (A1 - A0) * (i + 1) / n, 1.005); const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2; const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + .1; const ay = yaw(p1[0] - p0[0], p1[1] - p0[1]);
      const y = heightAt(mx, mz); const [nx, nz] = NRM(a);
      // sağlam: 3.8 m duvar, 1.3 kalınlık, dişler ve mazgal yarıkları
      this.GA[2].box('stone', mx, y - 1.5, mz, L, 5.3, 1.3, ay, STONE_D.clone().multiplyScalar(.9), { uvS: 3 });
      if (i % 2 === 0) this.GA[2].box('stone', mx + nx * .3, y + 3.8, mz + nz * .3, L * .5, .8, .7, ay, STONE_D, { uvS: 2 });
      if (i % 3 === 1) this.GA[2].boxM('dark', new THREE.Matrix4().makeRotationY(-a + Math.PI / 2).setPosition(mx + nx * .67, y + 1.9, mz + nz * .67), .18, 1.1, .05, WHITE, { faces: 1 });
      // yıkık: yer yer diz boyu kalıntı, önüne dökülmüş taş
      const rh = .4 + 1.6 * Math.abs(Math.sin(i * 2.7)) * (i % 5 === 0 ? 1.6 : 1); this.GB[2].box('stone', mx, y - 1.5, mz, L, 1.5 + rh, 1.3, ay, STONE_D.clone().multiplyScalar(.85), { uvS: 3 });
      if (i % 2) { const bx = mx + nx * (2 + (i % 3)), bz = mz + nz * (2 + (i % 3)); this.GB[2].box('stone2', bx, heightAt(bx, bz) - .5, bz, 1.5, 1.0, 1.2, i, STONE_D.clone().multiplyScalar(.8), { uvS: 2 }); }
      this.solidSeg(p0, p1, 1.3); }
  }

  /** Yeraltı ağızları. Kuzeybatı: zemine yakın iki tünel ağzı (4 m arayla), 1822'den sonra moloz dolu (KAYNAK: Yamaç 2023).
   *  Doğu yamacı: otuzdan fazla iç içe kaya oyma konut (KAYNAK); ağızların tek tek yeri ve biçimi TAHMİN. İçlerine girilmez. */
  castleUnderground(H) {
    const G = this.G; const { E, NRM, yaw, basisZ } = H; const ROCK = STONE_D.clone().multiplyScalar(.78);
    // kuzeybatı tünel ağızları: hendek tabanında, kayaya oyulmuş iki kemerli ağız (1.8 m geniş, ~2.5 m yüksek — ölçü TAHMİN),
    // alt yarıları 1822 sonrası dolgu molozuyla kapalı. Kaya yüzü düzensiz bloklardan.
    { const a = 1.24 * Math.PI; const [cx, cz] = E(a, 1.075); const [nx, nz] = NRM(a); const tx = -nz, tz = nx; const y = heightAt(...E(a, 1.13));
      for (let j = 0; j < 7; j++) { const u = -7 + j * 2.3 + Math.sin(j * 2.1) * .6; const hb = 4.5 + 3.2 * Math.abs(Math.sin(j * 1.7)) + (Math.abs(u) < 3.5 ? 2.5 : 0); const dd = .9 + .7 * Math.abs(Math.sin(j * 3.3));
        const bx = cx + tx * u - nx * dd, bz = cz + tz * u - nz * dd; G.box('stone2', bx, y - 1, bz, 2.8 + .6 * Math.sin(j), hb + 1, 2.2, yaw(tx, tz) + Math.sin(j * 4.1) * .18, ROCK.clone().multiplyScalar(.9 + .1 * Math.sin(j * 2.9)), { uvS: 4 }); }
      this.col.addPoly(rect(cx - nx * 1.2, cz - nz * 1.2, 15, 2.6, Math.atan2(tz, tx)));
      for (const sd of [-2, 2]) { const ox = cx + tx * sd + nx * .25, oz = cz + tz * sd + nz * .25;
        G.box('stone2', ox, y - 1, oz, 2.6, 4.6, 1.0, yaw(tx, tz), ROCK, { uvS: 3 });                                   // ağzın çevresindeki düzlenmiş kaya
        G.arch('stone2', basisZ(nx, nz, ox + nx * .52, y - .1, oz + nz * .52), 1.8, 1.6, .5, ROCK.clone().multiplyScalar(.85), null, 9, .35);
        G.boxM('dark', basisZ(nx, nz, ox + nx * .53, y - .1 + .8, oz + nz * .53), 1.8, 1.6, .02, WHITE, { faces: 1 });
        for (let m = 0; m < 4; m++) { const q = Math.sin(sd * 3.1 + m * 2.3); G.box('stone2', ox + tx * q * .45 + nx * (.8 + m * .35), y - .4, oz + tz * q * .45 + nz * (.8 + m * .35), .9 + .3 * (m % 2), 1.1 - m * .2, .7, m + sd, ROCK.clone().multiplyScalar(.75), { uvS: 2 }); } } }
    // doğu yamacı kaya konutları: ağız yamaçtan dışa taşan kısa bir kaya kütlesinin önünde (arazi ızgarası 5 m olduğu için yamaca gömülmesin)
    for (let i = 0; i < 32; i++) { const a = -0.95 + 1.9 * (i + .5) / 32 + Math.sin(i * 5.3) * .02; const kk = i % 2 ? .84 + .02 * Math.sin(i) : .93; const [cx0, cz0] = E(a, kk); const [nx, nz] = NRM(a); const tx = -nz, tz = nx;
      const fx = cx0 + nx * 1.6, fz = cz0 + nz * 1.6; const y = heightAt(fx + nx * .8, fz + nz * .8) - .2;    // ağız önündeki zemin
      const bx = fx - nx * 1.6, bz = fz - nz * 1.6; G.box('stone2', bx, y - 1.5, bz, 3.6, 5.2, 3.2, yaw(tx, tz), ROCK.clone().multiplyScalar(.95 + .08 * Math.sin(i * 1.3)), { uvS: 3 }); this.col.addCircle(bx, bz, 1.8);
      const ox = fx + nx * .02, oz = fz + nz * .02; const w = 1.2 + .2 * ((i * 7) % 3);
      G.arch('stone2', basisZ(nx, nz, ox, y, oz), w, 1.3, .35, ROCK, null, 9, .3);
      G.boxM(i % 4 === 0 ? 'wood' : 'dark', basisZ(nx, nz, ox, y + .65, oz), w, 1.3, .02, i % 4 === 0 ? '#5a4330' : WHITE, { faces: 1 }); }
  }
  solidSeg(p0, p1, th) { const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); const nx = (p1[1] - p0[1]) / L * th / 2, nz = -(p1[0] - p0[0]) / L * th / 2; this.col.addPoly([[p0[0] - nx, p0[1] - nz], [p1[0] - nx, p1[1] - nz], [p1[0] + nx, p1[1] + nz], [p0[0] + nx, p0[1] + nz]]); }

  /* ---------------- CAMİ ---------------- */
  mosque(l, o) {
    const G = this.G; this.mark(l); const ang = Math.atan2(QDIR[1], QDIR[0]) - Math.PI / 2; // yerel +z kıbleye
    const c = Math.cos(ang), s = Math.sin(ang); const W = (u, v) => [l.x + u * c - v * s, l.z + u * s + v * c];
    const hall = rect(...W(0, o.court / 2), o.w, o.d, ang); const court = rect(...W(0, -o.d / 2 + 0), o.w, o.court, ang);
    const [gmin, gmax] = footprintY([...hall, ...court]); const y0 = gmin - .5, yb = gmax;
    const H = o.dome ? 9 : 10.5; const col = STONE.clone().multiplyScalar(.97);
    G.prism('stone', hall, y0, yb + H, col, { topKey: 'flat' }); this.solid(hall);
    if (o.ablak) for (let k = 1; k < 7; k += 2) { for (let i = 0; i < 4; i++) { const a = hall[i], b = hall[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); G.boxM('basalt', G.frame(a, b, Ll / 2, .02, yb + k * 1.2), Ll + .05, .45, .05, BAS, { faces: 1 }); } }
    // korkuluk silmesi
    for (let i = 0; i < 4; i++) { const a = hall[i], b = hall[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); G.boxM('stone', G.frame(a, b, Ll / 2, .1, yb + H - .3), Ll + .4, .6, .3, STONE_D);
      // pencereler (kemerli, iki sıra)
      const n = Math.floor(Ll / 3.4); for (let k = 0; k < n; k++) { const t = (k + .5) / n * Ll; for (const [yy, hh] of [[1.4, 1.8], [5.0, 1.4]]) { const m = G.frame(a, b, t, 0, yb + yy); G.boxM('glass', GeoBuilder.local(m, 0, hh / 2, .02), .9, hh + .45, .04, WHITE, { faces: 1 }); G.arch(o.ablak ? 'basalt' : 'stone', GeoBuilder.local(m, 0, 0, .02), .92, hh, .14, o.ablak ? BAS : STONE_D, o.ablak ? STONE : null, 9, .24, 'stone');
          for (const sx of [-.15, .15]) G.boxM('iron', GeoBuilder.local(m, sx, hh / 2, .02), .04, hh, .04, WHITE); G.boxM('stone', GeoBuilder.local(m, 0, -.06, .08), 1.2, .12, .2, STONE_D); } } }
    // kubbe
    const [hx, hz] = W(0, o.court / 2); if (o.dome) { const r = Math.min(o.w, o.d) * .42; G.cylinder('stone', hx, yb + H, hz, r * .98, r * .98, 2.2, STONE_D, 24, false); G.dome('lead', hx, yb + H + 2.2, hz, r, '#ffffff', 24, 10, .92); G.cylinder('iron', hx, yb + H + 2.2 + r * .92, hz, .08, .08, 1.6, '#c9a24a', 6); G.cylinder('iron', hx, yb + H + 2.2 + r * .92 + .5, hz, .22, .22, .25, '#c9a24a', 8); }
    else { G.hipRoof('lead', hx, yb + H, hz, o.w, o.d, 1.8, ang, '#ffffff', .4); }
    // son cemaat yeri (revak) + küçük kubbeler
    const pv = -o.d / 2 + o.court / 2; const pr = rect(...W(0, pv - 2.6 + o.court / 2 - o.court / 2), o.w, 5.2, ang);
    for (let i = 0; i <= 4; i++) { const u = -o.w / 2 + .6 + i * (o.w - 1.2) / 4; const [px, pz] = W(u, o.court / 2 - o.d / 2 - 4.6); G.cylinder('stone', px, yb, pz, .35, .32, 4.4, STONE, 10, false); this.col.addCircle(px, pz, .4); }
    { const [px, pz] = W(0, o.court / 2 - o.d / 2 - 2.6); G.box('stone', px, yb + 4.4, pz, o.w, .8, 5.2, -ang, STONE_D); for (let i = 0; i < 3; i++) { const [qx, qz] = W(-o.w / 3 + i * o.w / 3, o.court / 2 - o.d / 2 - 2.6); G.dome('lead', qx, yb + 5.2, qz, 2.1, WHITE, 14, 6); } }
    // taç kapı (kıble karşısı: avluya bakan)
    { const a = hall[3], b = hall[0]; const a2 = hall[0], b2 = hall[1]; }
    // avlu duvarı + kapı
    const cy0 = gmin - .3; for (let i = 0; i < 4; i++) { if (i === 2) continue; const a = court[i], b = court[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const gap = i === 0 ? 3.2 : 0; const parts = gap ? [[0, Ll / 2 - gap / 2], [Ll / 2 + gap / 2, Ll]] : [[0, Ll]]; for (const [t0, t1] of parts) { const m = G.frame(a, b, (t0 + t1) / 2, -.35, yb); G.boxM('stone', GeoBuilder.local(m, 0, .9, 0), t1 - t0, 2.6, .7, STONE_D, { uvS: 3 }); const pa = [a[0] + (b[0] - a[0]) * t0 / Ll, a[1] + (b[1] - a[1]) * t0 / Ll], pb = [a[0] + (b[0] - a[0]) * t1 / Ll, a[1] + (b[1] - a[1]) * t1 / Ll]; this.solidSeg(pa, pb, .8); }
      if (gap) { const m = G.frame(a, b, Ll / 2, -.35, yb); G.arch('basalt', m, 3.2, 2.6, .9, BAS, STONE, 11, .4, 'stone'); G.boxM('stone', GeoBuilder.local(m, 0, 4.6, 0), 4.6, 1.2, .9, STONE_D); } }
    G.cap('stone2', court, null, yb + .05, new THREE.Color('#e9dfca'), 2);
    // şadırvan
    if (o.sadirvan || true) { const [sx, sz] = W(0, -o.d / 2 + 1); G.cylinder('stone2', sx, yb, sz, 2.2, 2.2, .7, STONE, 8, true, 1); G.box('water', sx, yb + .6, sz, 3, .02, 3, 0, WHITE, { faces: 16 }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; G.cylinder('stone', sx + Math.cos(a) * 2.6, yb, sz + Math.sin(a) * 2.6, .16, .16, 3.4, STONE, 8, false); } G.cone('lead', sx, yb + 3.4, sz, 3.6, 2.4, WHITE, 8); this.col.addCircle(sx, sz, 2.8); }
    // minare (köşede) — Şeyh Fethullah için kısa, tek şerefeli (kaynak)
    { const [mx, mz] = W(o.w / 2 + 1.6, o.court / 2 - o.d / 2 + 1.6); const h = o.minH; const kr = o.minR || 1.0, sg = o.minSeg || 16; G.box('stone', mx, y0, mz, 3.6, 7, 3.6, -ang, STONE_D); G.cylinder('stone', mx, yb + 6.5, mz, 1.35 * kr, 1.2 * kr, h - 6.5, STONE, sg, false, 2);
      if (o.ablak) for (let k = 0; k < 4; k++) { const yy = yb + 9 + k * 2.8; if (yy < yb + h - 4) G.cylinder('basalt', mx, yy, mz, 1.37 * kr, 1.37 * kr, .5, BAS, sg, false, 1); }
      /* tepe (şerefe, korkuluk, petek, külah): hasar tanımlıysa sağlam ve hasarlı hâli ayrı ağlara yazılır, oyun tarihe göre birini gösterir */
      const T = o.hasar ? this.GA[o.hasar.kademe] : G;
      T.cylinder('stone', mx, yb + h - 3.5, mz, 2.0 * kr, 1.4 * kr, .6, STONE_D, 16, true, 1); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; T.box('stone', mx + Math.cos(a) * 1.9 * kr, yb + h - 2.9, mz + Math.sin(a) * 1.9 * kr, .7, .9, .12, -a + Math.PI / 2, STONE); }
      T.cylinder('stone', mx, yb + h - 2.9, mz, 1.1 * kr, 1.0 * kr, 3.4, STONE, 14, false); T.cone('lead', mx, yb + h + .5, mz, 1.25 * kr, 4.2, WHITE, 14); T.cylinder('iron', mx, yb + h + 4.6, mz, .06, .06, 1.4, '#c9a24a', 6);
      if (o.hasar) { const D2 = this.GB[o.hasar.kademe]; const dk = STONE_D.clone().multiplyScalar(.8);
        if (o.hasar.tur === 'serefe') { /* şerefe parçalanmış: döşemenin yalnız bir yanı ve birkaç korkuluk taşı kalmış; petek ve külah duruyor */
          for (let i = 0; i < 16; i++) { if (i > 4 && i < 13) continue; const a = i / 16 * Math.PI * 2; D2.box('stone', mx + Math.cos(a) * 1.65 * kr, yb + h - 3.5, mz + Math.sin(a) * 1.65 * kr, .75, .6, .7, -a + Math.PI / 2, dk); if (i % 2 === 0) D2.box('stone', mx + Math.cos(a) * 1.9 * kr, yb + h - 2.9, mz + Math.sin(a) * 1.9 * kr, .7, .5 + (i % 3) * .2, .12, -a + Math.PI / 2, STONE); }
          D2.cylinder('stone', mx, yb + h - 2.9, mz, 1.1 * kr, 1.0 * kr, 3.4, STONE, 14, false); D2.cone('lead', mx, yb + h + .5, mz, 1.25 * kr, 4.2, WHITE, 14); }
        else { /* külah yok: şerefe yerinde, korkuluğun yarısı kırık, petek yarı boyda ve üstü tırtıklı */
          D2.cylinder('stone', mx, yb + h - 3.5, mz, 2.0 * kr, 1.4 * kr, .6, dk, 16, true, 1); for (let i = 0; i < 16; i++) { if (i % 3 === 0 || (i > 8 && i < 13)) continue; const a = i / 16 * Math.PI * 2; D2.box('stone', mx + Math.cos(a) * 1.9 * kr, yb + h - 2.9, mz + Math.sin(a) * 1.9 * kr, .7, .4 + (i % 4) * .15, .12, -a + Math.PI / 2, STONE); }
          D2.cylinder('stone', mx, yb + h - 2.9, mz, 1.1 * kr, 1.0 * kr, 1.5, STONE, 14, true); for (let i = 0; i < 5; i++) { const a = i * 1.3; D2.box('stone', mx + Math.cos(a) * .7 * kr, yb + h - 1.4, mz + Math.sin(a) * .7 * kr, .5, .4 + (i % 3) * .35, .4, a, dk); } }
        /* gövdede mermi delikleri (koyu oyuk) ve dipte dökülmüş taş */
        for (const [ha, hy] of [[.6, .55], [2.4, .7], [4.1, .42]]) { const yy = yb + 6.5 + (h - 10) * hy; D2.box('dark', mx + Math.cos(ha) * 1.27 * kr, yy, mz + Math.sin(ha) * 1.27 * kr, .55, .7, .16, -ha + Math.PI / 2, '#ffffff'); }
        for (let i = 0; i < 7; i++) { const a = i * .9 + .3, d = 2.8 + (i % 3) * .8; D2.box('stone2', mx + Math.cos(a) * d, yb - .2, mz + Math.sin(a) * d, .6 + (i % 2) * .5, .4 + (i % 3) * .2, .6, a, dk, { uvS: 2 }); } }
      this.col.addCircle(mx, mz, 2.3); }
  }
  /* ---------------- HAN ---------------- */
  han(l, o) {
    const G = this.G; this.mark(l); const ang = 0; const outer = rect(l.x, l.z, o.w, o.d, ang); const inner = rect(l.x, l.z, o.cw, o.cd, ang).reverse(); const [gmin, gmax] = footprintY(outer);
    const fh = 4.8, H = fh * o.floors + .6; const yb = gmax, y0 = gmin - .6;
    for (let i = 0; i < 4; i++) G.wall('stone', outer[i], outer[(i + 1) % 4], y0, yb + H, STONE);
    for (let i = 0; i < 4; i++) G.wall('stone', inner[i], inner[(i + 1) % 4], yb - .2, yb + H, STONE);
    G.cap('flat', outer, [inner], yb + H, STONE_D); for (let i = 0; i < 4; i++) { const a = outer[i], b = outer[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); G.boxM('stone', G.frame(a, b, Ll / 2, -.2, yb + H), Ll, .6, .4, STONE_D);
      // dış cephe: üst kat küçük pencereler
      for (let t = 3; t < Ll - 2; t += 4) { const m = G.frame(a, b, t, 0, yb + fh + 1.5); G.boxM('dark', GeoBuilder.local(m, 0, .5, .02), .6, 1, .04, WHITE, { faces: 1 }); G.boxM('iron', GeoBuilder.local(m, 0, .5, .02), .03, 1, .03, WHITE); } }
    G.cap('stone2', rect(l.x, l.z, o.cw, o.cd, ang), null, yb + .05, new THREE.Color('#e6dac0'), 2);
    // avlu revakları (iki kat kemer dizisi)
    const inn = rect(l.x, l.z, o.cw, o.cd, ang); for (let i = 0; i < 4; i++) { const a = inn[(i + 1) % 4], b = inn[i]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(2, Math.round(Ll / 3.6));
      for (let f = 0; f < o.floors; f++) for (let k = 0; k < n; k++) { const t = (k + .5) / n * Ll; const m = G.frame(a, b, t, 0, yb + f * fh); const w = Ll / n - .7; G.boxM('dark', GeoBuilder.local(m, 0, (fh - 1.2) / 2, -.5), w, fh - 1.2, .04, WHITE, { faces: 1 }); G.arch(f === 0 && k % 2 ? 'basalt' : 'stone', m, w, fh - 1.2 - w / 2, .5, f === 0 && k % 2 ? BAS : STONE_D, null, 11, .35); for (const sx of [-1, 1]) G.boxM('stone', GeoBuilder.local(m, sx * (Ll / n) / 2, (fh - .6) / 2, .05), .6, fh - .6, .6, STONE); }
      G.boxM('stone', G.frame(a, b, Ll / 2, .2, yb + fh - .3), Ll, .4, .8, STONE_D); }
    // havuz
    G.box('stone2', l.x, yb, l.z, 3.2, .5, 3.2, .785, STONE, { uvS: 1 }); G.box('water', l.x, yb + .45, l.z, 2.8, .02, 2.8, .785, WHITE, { faces: 16 });
    // taç kapı: en yakın ana aksa bakan kenar
    let best = 0, bd = 1e9; for (let i = 0; i < 4; i++) { const a = outer[i], b = outer[(i + 1) % 4]; const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; let d = 1e9; AXES.forEach(ax => d = Math.min(d, Poly.distToPolyline(mx, mz, ax.pts))); if (d < bd) { bd = d; best = i; } }
    const a = outer[best], b = outer[(best + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); const m = G.frame(a, b, Ll / 2, .4, yb);
    G.boxM('stone', GeoBuilder.local(m, 0, 4.2, 0), 7.5, 8.4, .8, STONE); G.arch('basalt', GeoBuilder.local(m, 0, 0, .3), 3.4, 3.6, .5, BAS, STONE, 13, .45, 'stone'); G.boxM('dark', GeoBuilder.local(m, 0, 2.6, .02), 3.4, 5.2, .05, WHITE, { faces: 1 });
    for (const sx of [-1, 1]) G.boxM('planks', GeoBuilder.local(m, sx * .85, 1.8, .45), 1.6, 3.6, .12, '#8a6a48', { faces: 1 }); G.boxM('stone', GeoBuilder.local(m, 0, 7.2, .5), 4.2, .9, .3, STONE_D); // kitabe
    this.solid(outer);
  }
  /* ---------------- BEDESTEN ---------------- */
  bedesten(l) { const G = this.G; this.mark(l); const arms = [rect(l.x, l.z, 12, 60, 0), rect(l.x, l.z, 60, 12, 0)]; const [gmin, gmax] = footprintY(arms[0].concat(arms[1]));
    arms.forEach((r, i) => { G.prism('stone', r, gmin - .6, gmax + 6.5, STONE, { topKey: 'stone' }); 
      // beşik tonoz örtü (yarım silindir)
      const B = G.b('stone2'); const segs = 12; const c = STONE_D; for (let s = 0; s < segs; s++) { const a0 = s / segs * Math.PI, a1 = (s + 1) / segs * Math.PI; const P = (a, u) => i === 0 ? [l.x + Math.cos(a) * 6, gmax + 6.5 + Math.sin(a) * 3.2, l.z + u] : [l.x + u, gmax + 6.5 + Math.sin(a) * 3.2, l.z + Math.cos(a) * 6]; const n = i === 0 ? [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0] : [0, Math.sin((a0 + a1) / 2), Math.cos((a0 + a1) / 2)];
        if (i === 0) B.quad(P(a0, -30), P(a1, -30), P(a1, 30), P(a0, 30), n, [[0, 0], [1, 0], [1, 20], [0, 20]], c); else B.quad(P(a1, -30), P(a0, -30), P(a0, 30), P(a1, 30), n, [[0, 0], [1, 0], [1, 20], [0, 20]], c); }
      this.solid(r); });
    // 5 kapı (dört kol ucu + bir yan) — kaynak: beş kapı
    const doors = [[0, -30, 2], [0, 30, 0], [-30, 0, 1], [30, 0, 3]]; doors.forEach(([dx, dz]) => { const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(dz !== 0 ? -Math.sign(dz) : 0, 0, dx !== 0 ? Math.sign(dx) : 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sign(dx), 0, Math.sign(dz))).setPosition(l.x + dx, gmax, l.z + dz);
      G.arch('basalt', m, 3, 2.8, .4, BAS, STONE, 11, .4, 'stone'); G.boxM('dark', GeoBuilder.local(m, 0, 2.2, .02), 3, 4.4, .04, WHITE, { faces: 1 }); G.boxM('stone', GeoBuilder.local(m, 0, 5.5, .1), 4.6, 1, .3, STONE_D); }); }
  /* ---------------- ARASTA ---------------- */
  arasta(l) { const G = this.G; this.mark(l); const [gmin, gmax] = footprintY(rect(l.x, l.z, 16, 90, 0)); const fabs = ['fabR', 'fabB', 'fabG'];
    for (const sx of [-1, 1]) { const r = rect(l.x + sx * 6, l.z, 6, 90, 0); G.prism('stone', r, gmin - .5, gmax + 4.4, STONE, { topKey: 'flat' }); this.solid(r);
      for (let k = 0; k < 28; k++) { const z = l.z - 43 + k * 3.15; const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, sx), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-sx, 0, 0)).setPosition(l.x + sx * 3, gmax, z);
        G.boxM('dark', GeoBuilder.local(m, 0, 1.3, .02), 2.4, 2.6, .04, WHITE, { faces: 1 }); G.arch('stone', m, 2.45, 2.1, .3, STONE_D, k % 3 === 0 ? BAS : null, 9, .3, 'basalt'); G.boxM('planks', GeoBuilder.local(m, 0, .45, .45), 2.2, .9, .7, '#e8c79a');
        for (let j = 0; j < 3; j++) this.props.push(['bakir', ...new THREE.Vector3(-.7 + j * .7, .9, .4).applyMatrix4(m).toArray(), j, .6 + (k * j % 5) * .12]);
        if (k % 4 === 0) for (let j = 0; j < 4; j++) this.props.push(['bakirAsili', ...new THREE.Vector3(-.9 + j * .6, 2.3, .15).applyMatrix4(m).toArray(), j, .8]); } }
    // çarşı örtüsü: ahşap kirişler + bez parçaları (örtü türü bilinmiyor — varsayım)
    for (let k = 0; k < 18; k++) { const z = l.z - 43 + k * 5; G.box('wood', l.x, gmax + 4.3, z, 7, .18, .18, 0, '#6e4f35'); if (k % 2 === 0) G.box(fabs[k % 3], l.x, gmax + 4.45, z + 2.5, 6.4, .03, 3.8, 0, WHITE, { faces: 48, uvS: 2.5 }); } }
  /* ---------------- KİLİSE ---------------- */
  church(l, o) { const G = this.G; this.mark(l); const ang = 0; const r = rect(l.x, l.z, o.w, o.d, ang); const [gmin, gmax] = footprintY(r);
    // bahçe duvarı
    const gr = rect(l.x, l.z, o.garden[0], o.garden[1], ang); for (let i = 0; i < 4; i++) { const a = gr[i], b = gr[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); const gap = i === 2 ? 4 : 0; const parts = gap ? [[0, Ll / 2 - 2], [Ll / 2 + 2, Ll]] : [[0, Ll]];
      for (const [t0, t1] of parts) { G.boxM('stone2', G.frame(a, b, (t0 + t1) / 2, -.3, heightAt(a[0], a[1]) + .9), t1 - t0, 2.4, .6, STONE_D); const pa = [a[0] + (b[0] - a[0]) * t0 / Ll, a[1] + (b[1] - a[1]) * t0 / Ll], pb = [a[0] + (b[0] - a[0]) * t1 / Ll, a[1] + (b[1] - a[1]) * t1 / Ll]; this.solidSeg(pa, pb, .7); } }
    // siyah kesme taş temel + beyaz kesme taş gövde (kaynak)
    G.prism('basalt', r, gmin - .6, gmax + 1.4, BAS, { top: false }); G.prism('stone', r, gmax + 1.4, gmax + o.h, new THREE.Color('#fbf5ea'), { topKey: 'flat' });
    G.hipRoof('tiles', l.x, gmax + o.h, l.z, o.d, o.w, 4.2, Math.PI / 2, '#fff', .6); this.solid(r);
    for (let i = 0; i < 4; i++) { const a = r[i], b = r[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.floor(Ll / 4.2); for (let k = 0; k < n; k++) { const m = G.frame(a, b, (k + .5) / n * Ll, 0, gmax + 3.2); G.boxM('glass', GeoBuilder.local(m, 0, 1.8, .02), 1.3, 4.2, .04, WHITE, { faces: 1 }); G.arch('stone', GeoBuilder.local(m, 0, 0, .02), 1.32, 3.6, .2, STONE_D, null, 11, .3); G.boxM('stone', GeoBuilder.local(m, 0, -.08, .1), 1.7, .16, .25, STONE_D); }
      G.boxM('stone', G.frame(a, b, Ll / 2, .08, gmax + o.h - .4), Ll + .3, .5, .2, STONE_D); }
    { const a = r[2], b = r[3]; const m = G.frame(a, b, o.w / 2, .2, gmax + 1.4); G.boxM('planks', GeoBuilder.local(m, 0, 1.9, .02), 2.2, 3.8, .1, '#7d5a3c', { faces: 1 }); G.arch('basalt', m, 2.3, 3.8, .45, BAS, STONE, 13, .4, 'stone'); for (let k = 0; k < 4; k++) G.boxM('stone2', GeoBuilder.local(m, 0, -.3 - k * .3 + .3, .6 + k * .4), 4 + k * .5, .3, .4, STONE_D); } }
  cathedral(l) { // Surp Asdvadzadzin — plan ve çan kulesi varsayım
    const G = this.G; this.mark(l); const r = rect(l.x, l.z, 24, 40, 0); const [gmin, gmax] = footprintY(r); const H = 14;
    G.prism('basalt', r, gmin - .6, gmax + 1.2, BAS, { top: false }); G.prism('stone', r, gmax + 1.2, gmax + H, STONE, { topKey: 'flat' }); this.solid(r);
    for (let i = 0; i < 4; i++) { const a = r[i], b = r[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); G.boxM('stone', G.frame(a, b, Ll / 2, .1, gmax + H - .4), Ll + .3, .6, .3, STONE_D); const n = Math.floor(Ll / 5); for (let k = 0; k < n; k++) { const m = G.frame(a, b, (k + .5) / n * Ll, 0, gmax + 4); G.boxM('glass', GeoBuilder.local(m, 0, 2, .02), 1.4, 4.6, .04, WHITE, { faces: 1 }); G.arch('basalt', GeoBuilder.local(m, 0, 0, .02), 1.42, 4, .2, BAS, STONE, 11, .3, 'stone'); } }
    G.cylinder('stone', l.x, gmax + H, l.z, 6.4, 6.4, 4, STONE_D, 24, false); G.dome('lead', l.x, gmax + H + 4, l.z, 6.6, WHITE, 24, 10, 1.0); G.cylinder('iron', l.x, gmax + H + 10.5, l.z, .1, .1, 2.4, '#3a2e22', 6); G.box('iron', l.x, gmax + H + 12, l.z, 1.2, .12, .12, 0, '#3a2e22');
    const t = rect(l.x, l.z + 23, 7, 7, 0); G.prism('stone', t, gmin - .5, gmax + 24, STONE, { topKey: 'stone' }); this.solid(t); for (let i = 0; i < 4; i++) { const a = t[i], b = t[(i + 1) % 4]; const m = G.frame(a, b, 3.5, 0, gmax + 18); G.boxM('dark', GeoBuilder.local(m, 0, 2, .02), 1.8, 3.6, .04, WHITE, { faces: 1 }); G.arch('basalt', GeoBuilder.local(m, 0, 0, .02), 1.82, 3, .3, BAS, STONE, 9, .32, 'stone'); }
    G.cone('lead', l.x, gmax + 24, l.z + 23, 5.2, 7, WHITE, 8); }
  /* ---------------- KOLEJ (parametrik — fotoğraf eşleştirmesi bekliyor) ---------------- */
  college(l) { const G = this.G; this.mark(l); const SPEC = Landmarks.COLLEGE_SPEC; const cx = l.x, cz = l.z;
    const wall = rect(cx, cz, SPEC.campus[0], SPEC.campus[1], 0); for (let i = 0; i < 4; i++) { const a = wall[i], b = wall[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); const gap = i === 1 ? 8 : 0; const parts = gap ? [[0, Ll / 2 - 4], [Ll / 2 + 4, Ll]] : [[0, Ll]];
      for (const [t0, t1] of parts) for (let t = t0; t < t1 - 1; t += 6) { const tt = Math.min(t + 6, t1); const pa = [a[0] + (b[0] - a[0]) * t / Ll, a[1] + (b[1] - a[1]) * t / Ll], pb = [a[0] + (b[0] - a[0]) * tt / Ll, a[1] + (b[1] - a[1]) * tt / Ll]; const mx = (pa[0] + pb[0]) / 2, mz = (pa[1] + pb[1]) / 2; G.box('stone2', mx, heightAt(mx, mz) - .5, mz, tt - t + .05, 2.6, .6, -Math.atan2(b[1] - a[1], b[0] - a[0]), STONE_D, { uvS: 3 }); this.solidSeg(pa, pb, .7); } }
    SPEC.buildings.forEach(b => { const x = cx + b.x, z = cz + b.z; const r = rect(x, z, b.w, b.d, 0); const [gmin, gmax] = footprintY(r); const H = b.floors * 3.9 + 1;
      G.prism('basalt', r, gmin - .6, gmax + 1, BAS, { top: false }); G.prism('stone', r, gmax + 1, gmax + H, STONE, { topKey: 'flat' }); G.hipRoof('tiles', x, gmax + H, z, b.w, b.d, b.d * .3, 0, '#fff', .7); this.solid(r);
      for (let i = 0; i < 4; i++) { const a = r[i], c = r[(i + 1) % 4]; const Ll = Math.hypot(c[0] - a[0], c[1] - a[1]); const n = Math.floor(Ll / 3); for (let f = 0; f < b.floors; f++) { G.boxM('stone', G.frame(a, c, Ll / 2, .06, gmax + 1 + f * 3.9), Ll + .2, .25, .14, STONE_D); for (let k = 0; k < n; k++) { const m = G.frame(a, c, (k + .5) / n * Ll, 0, gmax + 1.9 + f * 3.9); G.boxM('glass', GeoBuilder.local(m, 0, 1.0, .02), 1.0, 2.0, .04, WHITE, { faces: 1 }); G.boxM('wood', GeoBuilder.local(m, 0, 1.0, .05), .06, 2.0, .06, '#e8e2d6'); G.boxM('stone', GeoBuilder.local(m, 0, 2.15, .05), 1.4, .3, .16, STONE_D); G.boxM('stone', GeoBuilder.local(m, 0, -.06, .06), 1.3, .12, .2, STONE_D); } } }
      if (b.main) { const m = G.frame(r[2], r[3], b.w / 2, .5, gmax + 1); G.boxM('stone', GeoBuilder.local(m, 0, H / 2 - .5, .5), 9, H + 1, 1.2, STONE); G.boxM('planks', GeoBuilder.local(m, 0, 1.5, 1.12), 2, 3, .05, '#6e4f35', { faces: 1 }); G.arch('stone', GeoBuilder.local(m, 0, 0, 1.12), 2.1, 3, .3, STONE_D, null, 11, .35); const [px, pz] = [x, z + b.d / 2 + 1.1]; G.hipRoof('tiles', px, gmax + H + .5, pz, 9.6, 2.6, 2.4, 0, '#fff', .3); } });
    for (let i = 0; i < 40; i++) { const a = i * 2.4, rr = 30 + (i * 37) % 110; const x = cx + Math.cos(a) * rr * 1.1, z = cz + Math.sin(a) * rr * .8; if (Math.abs(x - cx) < SPEC.campus[0] / 2 - 4 && Math.abs(z - cz) < SPEC.campus[1] / 2 - 4) this.props.push(['agac', x, heightAt(x, z), z, i, .9 + (i % 5) * .15, i % 3 === 0 ? 2 : 1]); } }
  hospital(l) { const G = this.G; this.mark(l); const r = rect(l.x, l.z, 32, 14, 0); const [gmin, gmax] = footprintY(r); G.prism('stone', r, gmin - .6, gmax + 8.4, STONE, { topKey: 'flat' }); G.hipRoof('tiles', l.x, gmax + 8.4, l.z, 32, 14, 3.4, 0, '#fff', .6); this.solid(r);
    for (let i = 0; i < 4; i++) { const a = r[i], b = r[(i + 1) % 4]; const Ll = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let f = 0; f < 2; f++) for (let t = 2; t < Ll - 1; t += 3) { const m = G.frame(a, b, t, 0, gmax + 1.2 + f * 3.8); G.boxM('glass', GeoBuilder.local(m, 0, 1, .02), 1, 2, .04, WHITE, { faces: 1 }); G.boxM('stone', GeoBuilder.local(m, 0, 2.1, .05), 1.3, .25, .15, STONE_D); } } }
  /* ---------------- KÖPRÜLER ---------------- */
  bridges() { const G = this.G; const lines = [...AXES.map(a => a.pts), ...ROADS.map(r => r.pts)];
    for (const pts of lines) for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const Ls = Math.hypot(bx - ax, bz - az);
      for (let t = 0; t < Ls; t += 2) { const x = ax + (bx - ax) * t / Ls, z = az + (bz - az) * t / Ls; if (Poly.distToPolyline(x, z, RIVER) < 2) { const ang = -Math.atan2(bz - az, bx - ax); const y = baseHeight(x, z) + 7.5 * 0; const yd = heightAt(x + (bx - ax) / Ls * 20, z + (bz - az) / Ls * 20);
          const deck = Math.max(yd, baseHeight(x, z) + 3.2); G.box('stone', x, baseHeight(x, z) - 2, z, 26, deck - baseHeight(x, z) + 2, 7, ang, STONE_D, { uvS: 3 });
          const m = new THREE.Matrix4().makeRotationY(ang).setPosition(x, 0, z); for (const sd of [-1, 1]) { G.boxM('stone', GeoBuilder.local(m, 0, deck + .5, sd * 3.3), 26, 1, .5, STONE); const mm = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, sd).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang)).setPosition(x + Math.sin(ang) * 3.52 * sd * 0, baseHeight(x, z) - 1.2, z); }
          this.bridgeDecks = this.bridgeDecks || []; this.bridgeDecks.push({ x, z, ang, len: 26, w: 7, y: deck }); break; } } }
  }
}
Landmarks.COLLEGE_SPEC = { // VARSAYIM — tarihî fotoğraflara göre güncellenecek parametreler
  campus: [300, 240],
  buildings: [ { name: 'Ana bina (Kolej binası)', x: 0, z: -20, w: 46, d: 16, floors: 3, main: true }, { name: 'Yatakhane', x: -80, z: 40, w: 30, d: 13, floors: 2 }, { name: 'Öğretmen evi', x: 80, z: 50, w: 16, d: 12, floors: 2 }, { name: 'Öğretmen evi', x: 100, z: -60, w: 15, d: 12, floors: 2 }, { name: 'Şapel / salon', x: -70, z: -70, w: 22, d: 12, floors: 1 } ]
};
