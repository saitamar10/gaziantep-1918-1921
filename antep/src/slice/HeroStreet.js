// KAHRAMAN SOKAK — 100 m'lik kalite testi kesiti (vertical slice).
// Gerçek dünya koordinatında, Uzun Çarşı aksının batısında, kaleye bakan bir sokak (konum tasarım varsayımı).
// İçerik: 4 farklı ev ailesi (avlulu konak cephesi, moloz+kesme taş ev, ablaklı iki katlı ev, dış merdivenli ev),
// kabaltı, çeşme, 5 dükkân (bakırcı, kumaşçı, baharatçı, çömlekçi, marangoz), bahçe duvarı, tekrarsız taş döşeme.
import * as THREE from 'three';
import { Mesher, Facade, holedWall, voussoirs, doorLeaf, windowUnit, cumba, balcony, hipRoof, cornice, parapet, openingOutline } from './ArchKit.js';
import { facadeTexture, pavingTexture, tileStone, tileWood, tileRoof, tilePlaster, latticeTex, mulberry } from '../render/TexGen.js';
import { pbr, enablePOM } from '../render/POM.js';
import { heightAt } from '../world/Terrain.js';
import { Poly } from '../core/MapCoordinates.js';

export const HERO = { origin: [58, 302], target: [0, 0], length: 100 }; // VARSAYIM: konum temsilî

export class HeroStreet {
  constructor(mats) { this.mats = mats; const [ox, oz] = HERO.origin; const dx = HERO.target[0] - ox, dz = HERO.target[1] - oz, l = Math.hypot(dx, dz); this.dir = [dx / l, dz / l]; this.theta = Math.atan2(-this.dir[0], -this.dir[1]);
    this.group = new THREE.Group(); this.group.name = 'HeroStreet'; this.group.position.set(ox, 0, oz); this.group.rotation.y = this.theta; this.group.updateMatrixWorld(true); this.inv = this.group.matrixWorld.clone().invert(); this.M = new Mesher(); this.facadeMats = {}; this.extra = []; this.lights = []; }
  // yerel <-> dünya
  w(x, z) { const v = new THREE.Vector3(x, 0, z).applyMatrix4(this.group.matrixWorld); return [v.x, v.z]; }
  l(x, z) { const v = new THREE.Vector3(x, 0, z).applyMatrix4(this.inv); return [v.x, v.z]; }
  g(x, z) { const [X, Z] = this.w(x, z); return heightAt(X, Z); }
  // sokak ekseni ve genişlik
  cx(z) { return 1.6 * Math.sin(-z * .05); }
  wid(z) { const s = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t)); if (z > -26) return 6.2; if (z > -40) return s(6.2, 3.6, (-26 - z) / 14); if (z > -56) return 3.6; if (z > -68) return s(3.6, 5.0, (-56 - z) / 12); return 5.0; }
  xl(z) { return this.cx(z) - this.wid(z) / 2; } xr(z) { return this.cx(z) + this.wid(z) / 2; }
  excludes(X, Z) { const [x, z] = this.l(X, Z); return z < 14 && z > -116 && Math.abs(x - this.cx(Math.min(0, Math.max(-100, z)))) < 22; }
  spawn() { const [X, Z] = this.w(this.cx(-2), -2); return { x: X, z: Z, yaw: Math.atan2(-this.dir[0], -this.dir[1]) }; }

  build(collision, propList, progress = () => { }) {
    this.col = collision; this.props = propList; this.matsBase(); progress('Kahraman sokak: döşeme taşları…');
    this.paving();
    progress('Kahraman sokak: cepheler ve taş işçiliği…');
    const R = mulberry(1919);
    this.shops({ side: 'L', z0: 1, z1: -26, depth: 7.5 });
    this.houseA({ side: 'L', z0: -27.4, z1: -42.6 });
    this.kabalti(-43.5, -50);
    this.houseB({ side: 'L', z0: -50.6, z1: -69.2 });
    this.gardenWall({ side: 'L', z0: -69.6, z1: -100 });
    this.houseC({ side: 'R', z0: 1, z1: -18 });
    this.fountainWall({ side: 'R', z0: -18.4, z1: -30 });
    this.courtGate({ side: 'R', z0: -30.4, z1: -43 });
    this.houseD({ side: 'R', z0: -50.6, z1: -74 });
    this.workshop({ side: 'R', z0: -74.4, z1: -100 });
    this.streetProps();
    const mats = { ...this.base, ...this.facadeMats, ...this.paveMats };
    this.M.meshes(mats).forEach(m => this.group.add(m)); this.extra.forEach(o => this.group.add(o));
    return this.group;
  }
  matsBase() { const T = (s, o) => pbr(s, { vertexColors: true, ...o }); const mm = this.mats.m;
    this.base = { hStone: T(tileStone(5), { pom: [.012, .012], side: THREE.DoubleSide }), hBasalt: T(tileStone(8, true), { pom: [.01, .01] }), hWood: T(tileWood(7)), hWoodPaint: T(tileWood(17, 512, [.30, .42, .42])), hRoof: T(tileRoof(9), { pom: [.02, .02], side: THREE.DoubleSide }), hPlaster: T(tilePlaster(11), { side: THREE.DoubleSide }),
      hGlass: new THREE.MeshPhysicalMaterial({ color: '#2b3338', roughness: .06, metalness: 0, transparent: true, opacity: .55, envMapIntensity: 1.4, side: THREE.DoubleSide }), hIron: new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: .55, metalness: .8 }),
      hBrass: new THREE.MeshStandardMaterial({ color: '#b08a3e', roughness: .32, metalness: 1 }), hLattice: new THREE.MeshStandardMaterial({ map: latticeTex(), alphaTest: .5, side: THREE.DoubleSide, roughness: .85 }),
      hFabricIn: new THREE.MeshStandardMaterial({ color: '#d8c8a8', roughness: 1, side: THREE.DoubleSide, map: mm.fabB.map }), hWater: new THREE.MeshPhysicalMaterial({ color: '#33494a', roughness: .03, transmission: 0, transparent: true, opacity: .85, normalMap: mm.water.normalMap }),
      fabR: mm.fabR, fabG: mm.fabG, fabB: mm.fabB, copper: mm.copper };
    this.base.hPlaster.vertexColors = true;
    const cl = t => { const c = t.clone(); c.repeat.set(1 / 2.2, 1 / 2.2); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.needsUpdate = true; return c; }; const st = this.mats.tex.stone2;
    this.base.hAshlar = new THREE.MeshStandardMaterial({ map: cl(st.map), normalMap: cl(st.normalMap), roughnessMap: cl(st.roughnessMap), vertexColors: true, roughness: 1, side: THREE.DoubleSide, envMapIntensity: .55 }); }
  /** cephe dokusu + malzemesi (tekrarsız) */
  facadeMat(id, F, opts) { const tex = facadeTexture({ L: F.L, H: F.H, ppm: 68, seed: id.length * 97 + Math.round(F.L * 13), ...opts }); const m = pbr(tex, { pom: [.028 / F.L, .028 / F.H], vertexColors: true, normalScale: 1.1 }); this.facadeMats['f_' + id] = m; return 'f_' + id; }
  F(side, z0, z1, H) { const x = side === 'L' ? z => this.xl(z) : z => this.xr(z); const a = side === 'L' ? [x(z1), z1] : [x(z0), z0], b = side === 'L' ? [x(z0), z0] : [x(z1), z1];
    const yb = Math.min(this.g(...a), this.g(...b), this.g((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) - .12; return new Facade(a, b, yb, H); }
  /** kütle: cepheden içe doğru blok (yan duvarlar + dam), çarpışma */
  mass(F, depth, H, { top = true, key = 'hAshlar' } = {}) { const M = this.M; const a = F.P(0, 0), b = F.P(F.L, 0); const ia = F.P(0, 0, depth), ib = F.P(F.L, 0, depth); const Y = F.y0 - .4;
    const side = (p, q, nrm) => M.quad(key, V3(p.x, Y, p.z), V3(q.x, Y, q.z), V3(q.x, F.y0 + H, q.z), V3(p.x, F.y0 + H, p.z), nrm, [[0, 0], [depth, 0], [depth, H], [0, H]], '#cfc2a6');
    side(a, ia, F.dir.clone().negate()); side(b, ib, F.dir.clone()); M.quad(key, V3(ia.x, Y, ia.z), V3(ib.x, Y, ib.z), V3(ib.x, F.y0 + H, ib.z), V3(ia.x, F.y0 + H, ia.z), F.n.clone().negate(), [[0, 0], [F.L, 0], [F.L, H], [0, H]], '#cfc2a6');
    if (top) M.quad('hStone', V3(a.x, F.y0 + H, a.z), V3(b.x, F.y0 + H, b.z), V3(ib.x, F.y0 + H, ib.z), V3(ia.x, F.y0 + H, ia.z), V3(0, 1, 0), [[0, 0], [F.L / 2, 0], [F.L / 2, depth / 2], [0, depth / 2]], '#bfae8e');
    this.solid([[a.x, a.z], [b.x, b.z], [ib.x, ib.z], [ia.x, ia.z]]); }
  solid(polyLocal) { const w = polyLocal.map(([x, z]) => this.w(x, z)); this.col.addPoly(Poly.ensureCCW(w)); }
  circle(x, z, r) { const [X, Z] = this.w(x, z); this.col.addCircle(X, Z, r); }

  /* ---------------- ZEMİN ---------------- */
  paving() { this.paveMats = {}; const W = 12, TL = 20.8, N = 5; const M = this.M;
    for (let k = 0; k < N; k++) { const zTop = 4 - k * TL; // tile z: zTop .. zTop-TL
      const tex = pavingTexture({ W, Lz: TL, ppm: 58, seed: 100 + k, cobble: true, gutterX: (v) => this.cx(zTop - v) + W / 2, wallDist: (u, v) => { const z = zTop - v, x = u - W / 2; return Math.min(Math.abs(x - this.xl(z)), Math.abs(this.xr(z) - x)); } });
      const key = 'pave' + k; this.paveMats[key] = pbr(tex, { pom: [.035 / W, .035 / TL], vertexColors: true, normalScale: 1.1, envI: .22 });
      const nx = 24, nz = 42; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const u0 = i / nx, u1 = (i + 1) / nx, v0 = j / nz, v1 = (j + 1) / nz; const P = (u, v) => { const x = u * W - W / 2, z = zTop - v * TL; return V3(x, this.g(x, z) + .1, z); };
        // kenar tozu/AO: duvar diplerinde koyulaştır (köşe gölgesi)
        const cAt = (u, v) => { const x = u * W - W / 2, z = zTop - v * TL; const d = Math.min(Math.abs(x - this.xl(z)), Math.abs(this.xr(z) - x)); const s = .62 + .38 * Math.min(1, d / 1.4); return new THREE.Color(s, s, s); };
        const a = P(u0, v0), b = P(u1, v0), c = P(u1, v1), d = P(u0, v1); const B = M.buf(key); const n = [0, 1, 0]; const ca = cAt(u0, v0), cb = cAt(u1, v0), cc = cAt(u1, v1), cd = cAt(u0, v1);
        M.tri(key, a, b, c, V3(0, 1, 0), [u0, 1 - v0], [u1, 1 - v0], [u1, 1 - v1], ca, cb, cc); M.tri(key, a, c, d, V3(0, 1, 0), [u0, 1 - v0], [u1, 1 - v1], [u0, 1 - v1], ca, cc, cd); } }
    // sokak sonunda küçük meydan zemini ile birleşim yok — ana harita devralır
  }

  /* ---------------- DÜKKÂN SIRASI (5 farklı dükkân) ---------------- */
  shops({ side, z0, z1, depth }) { const H = 7.0; const F = this.F(side, z0, z1, H); const n = 4; const kinds = ['bakirci', 'kumasci', 'baharatci', 'comlekci']; const ops = [];
    for (let i = 0; i < n; i++) { const tc = F.L * (i + .5) / n; ops.push({ t0: tc - 1.4, t1: tc + 1.4, y0: .5, ys: 2.55, shape: 'pointed', depth: .7, kind: kinds[i] }); }
    const up = []; for (let i = 0; i < n; i++) { const tc = F.L * (i + .5) / n; up.push({ t0: tc - .45, t1: tc + .45, y0: 4.7, ys: 5.8, shape: i % 2 ? 'round' : 'rect', sill: 1, depth: .5, grille: i % 2 === 0 }); }
    const key = this.facadeMat('shops', F, { openings: [...ops, ...up], tint: [1, .98, .95], streakSources: ops.map(o => ({ x0: o.t0 - .3, x1: o.t1 + .3, y: 4.2, len: 1.4, k: .25 })) });
    holedWall(this.M, F, key, [...ops, ...up]); ops.forEach((o, i) => { voussoirs(this.M, F, o, { key: 'hStone', keyB: i % 2 ? 'hBasalt' : null, thick: .4 }); this.shopInterior(F, o, i); });
    up.forEach(o => { if (o.shape !== 'rect') voussoirs(this.M, F, o, { thick: .26, n: 7 }); windowUnit(this.M, F, o, { grille: o.grille, shutters: !o.grille }); });
    cornice(this.M, F, 4.15, { corbels: false }); cornice(this.M, F, H - .25, { corbels: true }); parapet(this.M, F, H, {});
    // yükseltilmiş taş kaldırım + bordür (çarşı önü)
    for (let t = .4; t < F.L - .3; t += 1.1) { const g = this.g(...xz(F.P(t, 0, -.9))) - F.y0; this.M.box('hStone', F.M(t + .55, g + .1, -.85), 1.08, .28, 1.5, '#d7ccb6', .8, 1 | 16); this.M.box('hBasalt', F.M(t + .55, g + .1, -1.66), 1.08, .3, .16, '#ffffff', .6); }
    // saçak: ahşap mertekli kiremit tente (dükkân önü)
    for (let t = .5; t < F.L; t += .62) this.M.box('hWood', F.M(t, 4.0, -.9), .09, .11, 1.9, '#9c8264', 1);
    { const a = F.P(0, 4.1, 0), b = F.P(F.L, 4.1, 0), c = F.P(F.L, 3.75, -1.95), d = F.P(0, 3.75, -1.95); this.M.quad('hRoof', d, c, b, a, V3(0, 1, 0).add(F.n.clone().multiplyScalar(.2)).normalize(), [[0, 0], [F.L / 2, 0], [F.L / 2, 1], [0, 1]]); this.M.quad('hWood', a, b, c, d, V3(0, -1, 0), [[0, 0], [F.L, 0], [F.L, 2], [0, 2]], '#9a8064'); }
    this.mass(F, depth, H, { top: true }); }
  shopInterior(F, o, i) { const M = this.M; const D = 3.6, d0 = o.depth; const w = o.t1 - o.t0 + .2, mid = (o.t0 + o.t1) / 2; const y0 = o.y0; const yv = 2.7, r = w / 2;
    const P = (t, y, d) => F.P(t, y, d); const dim = new THREE.Color('#c4b294'), dk = new THREE.Color('#8c7a62');
    // zemin (ahşap döşeme), yan duvarlar, arka duvar, beşik tonoz
    M.quad('hWood', P(o.t0 - .1, y0, d0), P(o.t1 + .1, y0, d0), P(o.t1 + .1, y0, d0 + D), P(o.t0 - .1, y0, d0 + D), V3(0, 1, 0), [[0, 0], [w, 0], [w, D], [0, D]], dim, dk);
    for (const sd of [-1, 1]) { const t = sd < 0 ? o.t0 - .1 : o.t1 + .1; M.quad('hPlaster', P(t, y0, d0), P(t, y0, d0 + D), P(t, yv, d0 + D), P(t, yv, d0), F.dir.clone().multiplyScalar(-sd), [[0, 0], [D, 0], [D, 1], [0, 1]], dim, dk); }
    M.quad('hPlaster', P(o.t1 + .1, y0, d0 + D), P(o.t0 - .1, y0, d0 + D), P(o.t0 - .1, yv + r, d0 + D), P(o.t1 + .1, yv + r, d0 + D), F.n.clone(), [[0, 0], [w, 0], [w, 1], [0, 1]], dk, dk);
    for (let k = 0; k < 10; k++) { const a0 = k / 10 * Math.PI, a1 = (k + 1) / 10 * Math.PI; const p = (a, d) => P(mid + Math.cos(a) * r, yv + Math.sin(a) * r, d); const am = (a0 + a1) / 2; const nIn = P(mid, yv, d0).sub(p(am, d0)).normalize(); M.quad('hStone', p(a0, d0), p(a1, d0), p(a1, d0 + D), p(a0, d0 + D), nIn, [[0, 0], [.3, 0], [.3, D], [0, D]], '#b3a284'); }
    // raflar
    for (const sh of [1.0, 1.65, 2.3]) M.box('hWood', F.M(mid, y0 + sh, d0 + D - .25), w - .3, .05, .42, '#d2bc9c'); for (const sd of [-1, 1]) M.box('hWood', F.M(mid + sd * (w / 2 - .2), y0 + 1.3, d0 + D - .25), .06, 2.3, .06, '#b49c7c');
    // tezgâh
    M.box('hWood', F.M(mid, y0 + .45, d0 + .55), w - .5, .9, .55, '#e0c9a8'); M.box('hWood', F.M(mid, y0 + .92, d0 + .55), w - .4, .05, .65, '#c9ad88');
    // Antep çarşı dükkânı: kemer kalkışında ahşap kayıt, üstte yelpaze demir parmaklıklı alınlık, altta katlanır ahşap kepenkler (açık)
    M.box('hWood', F.M(mid, o.ys - .05, .25), w, .16, .14, '#c2a27c'); const rr = (o.t1 - o.t0) / 2;
    for (let k = 1; k < 9; k++) { const a = k / 9 * Math.PI; const m = F.M(mid + Math.cos(a) * rr * .5, o.ys + Math.sin(a) * rr * .5, .3); m.multiply(new THREE.Matrix4().makeRotationZ(-(a - Math.PI / 2))); M.box('hIron', m, .025, rr * .95, .025, '#fff'); }
    for (const f of [.45, .75, .97]) for (let k = 0; k < 14; k++) { const a0 = k / 14 * Math.PI, a1 = (k + 1) / 14 * Math.PI, am = (a0 + a1) / 2; const m = F.M(mid + Math.cos(am) * rr * f, o.ys + Math.sin(am) * rr * f, .3); m.multiply(new THREE.Matrix4().makeRotationZ(-(am - Math.PI / 2) + Math.PI / 2)); M.box('hIron', m, .025, rr * f * Math.PI / 14, .025, '#fff'); }
    const hLeaf = o.ys - o.y0 - .15, wl = (o.t1 - o.t0) / 4; for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const tc = sd < 0 ? o.t0 - .12 - wl / 2 - k * .07 : o.t1 + .12 + wl / 2 + k * .07; const m = F.M(tc, o.y0 + hLeaf / 2 + .05, -.06 - k * .07); m.multiply(new THREE.Matrix4().makeRotationY(sd * (.12 + k * .35)));
      M.box('hWood', m, wl, hLeaf, .045, '#d9bf9a', 1); for (const fy of [-.36, 0, .36]) M.box('hWood', m.clone().multiply(new THREE.Matrix4().makeTranslation(0, fy * hLeaf, .035)), wl - .04, .09, .025, '#b8986f'); for (const fy of [-.3, .3]) M.box('hBrass', m.clone().multiply(new THREE.Matrix4().makeTranslation(-sd * wl / 2, fy * hLeaf, .03)), .05, .12, .02, '#fff'); }
    // eşyalar (dükkâna göre)
    const goods = new THREE.Group(); const R = mulberry(77 + i * 13); const put = (geo, mat, t, y, d, s = 1, rot = 0) => { const m = new THREE.Mesh(geo, mat); const pp = F.P(t, y, d); m.position.copy(pp); m.scale.setScalar(s); m.rotation.y = rot; m.castShadow = true; m.receiveShadow = true; goods.add(m); };
    const pot = LATHE.pot, cop = LATHE.copper, jar = LATHE.jar, plate = new THREE.CylinderGeometry(.16, .12, .03, 18); const clay = CLAY(), copper = this.base.copper;
    if (o.kind === 'bakirci') { for (const sh of [1.0, 1.65, 2.3]) for (let k = 0; k < 5; k++) put(cop, copper, o.t0 + .4 + k * .5, y0 + sh + .03, d0 + D - .25, .55 + R() * .35, R() * 6); for (let k = 0; k < 4; k++) put(cop, copper, o.t0 + .5 + k * .6, y0 + .95, d0 + .5, .7 + R() * .5, R() * 6); for (let k = 0; k < 4; k++) put(plate, copper, o.t0 + .6 + k * .5, y0 + 1.9, d0 + D - .05, 1.6); }
    if (o.kind === 'kumasci') { const cols = ['#8e2b20', '#2f4a63', '#b58a3a', '#4e6b3a', '#6e2f4c', '#d8c8a8']; for (const sh of [1.0, 1.65, 2.3]) for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .4, 12), new THREE.MeshStandardMaterial({ color: cols[(k + sh * 3 | 0) % 6], roughness: 1 })); c.rotation.z = Math.PI / 2; c.position.copy(F.P(o.t0 + .35 + k * .42, y0 + sh + .11, d0 + D - .25)); c.castShadow = true; goods.add(c); }
      const hang = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.8), this.base.fabR); hang.position.copy(F.P(o.t1 + .55, 2.0 + y0, -.08)); hang.lookAt(hang.position.clone().add(F.n)); goods.add(hang); }
    if (o.kind === 'baharatci') { const sp = ['#b8432a', '#7a2e2a', '#d9a520', '#6d7c34', '#c99a62']; for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(LATHE.sack, this.mats.m.sack); s.position.copy(F.P(o.t0 - .2 + k * .72, this.gF(F, o.t0 + k * .7) + .02 - F.y0 + F.y0, -.6)); s.position.y = this.g(...xz(F.P(o.t0 + k * .72, 0, -.6))); s.scale.setScalar(.9); s.castShadow = true; goods.add(s); const top = new THREE.Mesh(new THREE.CircleGeometry(.27, 16), new THREE.MeshStandardMaterial({ color: sp[k], roughness: 1 })); top.rotation.x = -Math.PI / 2; top.position.copy(s.position); top.position.y += .7; goods.add(top); }
      for (const sh of [1.0, 1.65, 2.3]) for (let k = 0; k < 6; k++) put(jar, clay, o.t0 + .35 + k * .42, y0 + sh + .03, d0 + D - .25, .5); const sc = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .02, 16), copper); sc.position.copy(F.P(mid, y0 + 1.15, d0 + .55)); goods.add(sc); }
    if (o.kind === 'comlekci') { for (let k = 0; k < 7; k++) put(pot, clay, o.t0 - .3 + k * .55, this.g(...xz(F.P(o.t0 - .3 + k * .55, 0, -.45))) - F.y0, -.45, .9 + R() * .5, R() * 6); for (const sh of [1.0, 1.65, 2.3]) for (let k = 0; k < 5; k++) put(jar, clay, o.t0 + .4 + k * .5, y0 + sh + .03, d0 + D - .25, .6); }
    this.extra.push(goods);
    // loş iç ışık (gaz lambası) — siyah boşluk yerine gerçek iç mekân aydınlatması
    const lp = F.P(mid, y0 + 2.2, d0 + 1.6); const L = new THREE.PointLight('#ffb36a', 5, 6, 2); L.position.copy(lp); this.extra.push(L);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd9a0' })); lamp.position.copy(lp); this.extra.push(lamp);
    // çarpışma: yan duvarlar + arka duvar + tezgâh
    const seg = (t0, d0_, t1, d1) => { const a = F.P(t0, 0, d0_), b = F.P(t1, 0, d1); const m = [(a.x + b.x) / 2, (a.z + b.z) / 2]; };
    this.solid([xz(F.P(o.t0 - .3, 0, d0 + .2)), xz(F.P(o.t1 + .3, 0, d0 + .2)), xz(F.P(o.t1 + .3, 0, d0 + .85)), xz(F.P(o.t0 - .3, 0, d0 + .85))]);
  }
  gF() { return 0; }

  /* ---------------- EV A: avlulu konağın sokak cephesi (taç kapı + cumba + kiremit çatı) ---------------- */
  houseA({ side, z0, z1 }) { const H = 7.8; const F = this.F(side, z0, z1, H); const L = F.L;
    const door = { t0: L * .6 - .85, t1: L * .6 + .85, y0: .12, ys: 2.55, shape: 'pointed', depth: .7 };
    const g1 = { t0: L * .18 - .32, t1: L * .18 + .32, y0: 2.1, ys: 2.9, shape: 'rect', sill: 1, grille: 1, depth: .6 };
    const g2 = { t0: L * .34 - .32, t1: L * .34 + .32, y0: 2.1, ys: 2.9, shape: 'rect', sill: 1, grille: 1, depth: .6 };
    const u1 = { t0: L * .85 - .5, t1: L * .85 + .5, y0: 4.7, ys: 6.0, shape: 'rect', sill: 1, depth: .55 };
    const ops = [door, g1, g2, u1]; const key = this.facadeMat('A', F, { openings: ops, tint: [1.02, 1, .96] });
    holedWall(this.M, F, key, ops); voussoirs(this.M, F, door, { key: 'hStone', keyB: 'hBasalt', thick: .48, n: 13 }); doorLeaf(this.M, F, door, { key: 'hWood' });
    // taç kapı çerçevesi: iki yanda pilastr + üstte kitabe taşı
    for (const sd of [-1, 1]) this.M.box('hStone', F.M((door.t0 + door.t1) / 2 + sd * 1.35, 1.9, -.1), .32, 3.8, .2, '#efe2c8', 1); this.M.box('hStone', F.M((door.t0 + door.t1) / 2, 4.0, -.12), 3.0, .3, .26, '#f2e6cc', 1); this.M.box('hBasalt', F.M((door.t0 + door.t1) / 2, 3.55, -.06), 1.1, .5, .08, '#ffffff', 1);
    [g1, g2].forEach(o => windowUnit(this.M, F, o, { grille: true })); windowUnit(this.M, F, u1, { shutters: 1 });
    const cb = cumba(this.M, F, L * .27, 4.25, 3.4, 2.5, .95); hipRoofOnFacade(this, F, cb.roof.t, cb.roof.y, cb.roof.w, cb.roof.d, .5, false, true);
    cornice(this.M, F, 4.1, {}); cornice(this.M, F, H - .3, { corbels: true });
    this.mass(F, 12, H, { top: true }); hipRoofOnFacade(this, F, L / 2, F.y0 + H, L + .2, 6.2, 2.3, true); this.chimney(F, L * .7, H + 1.2, 3); }
  /* ---------------- EV B: moloz taş zemin kat + kesme taş üst kat, ahşap balkon, düz dam ---------------- */
  houseB({ side, z0, z1 }) { const H = 7.3; const F = this.F(side, z0, z1, H); const L = F.L;
    const door = { t0: L * .22 - .55, t1: L * .22 + .55, y0: .1, ys: 2.25, shape: 'rect', depth: .55 };
    const w1 = { t0: L * .5 - .3, t1: L * .5 + .3, y0: 1.9, ys: 2.6, shape: 'rect', sill: 1, grille: 1, depth: .55 };
    const w2 = { t0: L * .78 - .3, t1: L * .78 + .3, y0: 1.9, ys: 2.6, shape: 'rect', sill: 1, grille: 1, depth: .55 };
    const bd = { t0: L * .55 - .55, t1: L * .55 + .55, y0: 3.95, ys: 6.0, shape: 'rect', depth: .55 };
    const u1 = { t0: L * .2 - .45, t1: L * .2 + .45, y0: 4.55, ys: 5.8, shape: 'round', sill: 1, depth: .5 };
    const u2 = { t0: L * .86 - .45, t1: L * .86 + .45, y0: 4.55, ys: 5.8, shape: 'round', sill: 1, depth: .5 };
    const ops = [door, w1, w2, bd, u1, u2]; const key = this.facadeMat('B', F, { openings: ops, rubbleBelow: 3.7, tint: [.97, .95, .9], damp: 1.3 });
    holedWall(this.M, F, key, ops); doorLeaf(this.M, F, door, { key: 'hWoodPaint', double: false }); this.M.box('hStone', F.M((door.t0 + door.t1) / 2, 2.45, -.06), 1.8, .38, .2, '#efe2c8', 1);
    [w1, w2].forEach(o => windowUnit(this.M, F, o, { grille: true })); [u1, u2].forEach(o => { voussoirs(this.M, F, o, { thick: .26, n: 9 }); windowUnit(this.M, F, o, { shutters: 1 }); });
    windowUnit(this.M, F, bd, {}); balcony(this.M, F, L * .55, 3.9, 2.6, 1.0);
    this.M.box('hStone', F.M(L / 2, 3.75, -.04), L, .14, .12, '#d8cab0', 1); // kat silmesi
    parapet(this.M, F, H, {}); this.mass(F, 10, H, { top: true }); this.chimney(F, L * .4, H + .9, 4);
    // ahşap merdiven (dama çıkış) duvara yaslı + odun yığını
    const lad = F.M(L * .95, 1.6, -.4); lad.multiply(new THREE.Matrix4().makeRotationX(.18)); for (const sx of [-.22, .22]) this.M.box('hWood', lad.clone().multiply(new THREE.Matrix4().makeTranslation(sx, 0, 0)), .06, 3.4, .06, '#a08466'); for (let k = -1.5; k < 1.6; k += .32) this.M.box('hWood', lad.clone().multiply(new THREE.Matrix4().makeTranslation(0, k, 0)), .46, .04, .04, '#a08466');
    for (let k = 0; k < 18; k++) { const m = F.M(L * .62 + (k % 6) * .12, .12 + Math.floor(k / 6) * .13, -.28); m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)); this.M.box('hWood', m, .1, .8, .1, '#8f7558'); }
    this.solid([xz(F.P(L * .6, 0, -.05)), xz(F.P(L * .68, 0, -.05)), xz(F.P(L * .68, 0, -.5)), xz(F.P(L * .6, 0, -.5))]); }
  /* ---------------- EV C: ablaklı iki katlı ev (siyah-beyaz taş bantlar, sivri kemerli üst pencereler) ---------------- */
  houseC({ side, z0, z1 }) { const H = 8.2; const F = this.F(side, z0, z1, H); const L = F.L;
    const door = { t0: L * .72 - .62, t1: L * .72 + .62, y0: .12, ys: 2.35, shape: 'round', depth: .6 };
    const g1 = { t0: L * .2 - .32, t1: L * .2 + .32, y0: 1.95, ys: 2.75, shape: 'rect', sill: 1, grille: 1, depth: .55 };
    const g2 = { t0: L * .44 - .32, t1: L * .44 + .32, y0: 1.95, ys: 2.75, shape: 'rect', sill: 1, grille: 1, depth: .55 };
    const ups = [.18, .45, .72].map(f => ({ t0: L * f - .5, t1: L * f + .5, y0: 4.9, ys: 6.2, shape: 'pointed', sill: 1, depth: .55 }));
    const ops = [door, g1, g2, ...ups]; const key = this.facadeMat('C', F, { openings: ops, ablakFrom: 3.7, ablakTo: 4.7, tint: [1.03, 1.0, .95] });
    holedWall(this.M, F, key, ops); voussoirs(this.M, F, door, { key: 'hBasalt', keyB: 'hStone', thick: .4 }); doorLeaf(this.M, F, door, { key: 'hWood' });
    [g1, g2].forEach(o => windowUnit(this.M, F, o, { grille: true })); ups.forEach(o => { voussoirs(this.M, F, o, { key: 'hBasalt', keyB: 'hStone', thick: .3, n: 9 }); windowUnit(this.M, F, o, { shutters: 0 }); });
    cornice(this.M, F, H - .3, { corbels: true }); this.mass(F, 11, H, { top: true }); hipRoofOnFacade(this, F, L / 2, F.y0 + H, L + .2, 10.6, 2.8, true); this.chimney(F, L * .25, H + 1.6, 6); }
  /* ---------------- EV D: dış merdivenli ev + dam çardağı ---------------- */
  houseD({ side, z0, z1 }) { const H = 6.9; const F = this.F(side, z0, z1, H); const L = F.L;
    const door = { t0: L * .45 - .55, t1: L * .45 + .55, y0: .1, ys: 2.2, shape: 'segment', depth: .55 };
    const updoor = { t0: L * .8 - .5, t1: L * .8 + .5, y0: 3.7, ys: 5.6, shape: 'rect', depth: .55 };
    const ws = [.15, .3, .62].map(f => ({ t0: L * f - .3, t1: L * f + .3, y0: 1.9, ys: 2.6, shape: 'rect', sill: 1, grille: 1, depth: .55 }));
    const us = [.2, .5].map(f => ({ t0: L * f - .45, t1: L * f + .45, y0: 4.3, ys: 5.6, shape: 'rect', sill: 1, depth: .55 }));
    const ops = [door, updoor, ...ws, ...us]; const key = this.facadeMat('D', F, { openings: ops, tint: [.99, .97, .93] });
    holedWall(this.M, F, key, ops); voussoirs(this.M, F, door, { thick: .32, n: 9 }); doorLeaf(this.M, F, door, { key: 'hWoodPaint' }); windowUnit(this.M, F, updoor, {}); ws.forEach(o => windowUnit(this.M, F, o, { grille: true })); us.forEach(o => windowUnit(this.M, F, o, { shutters: 1 }));
    // dış taş merdiven (cepheye paralel, üst kapıya)
    const steps = 12; for (let k = 0; k < steps; k++) { const t = L * .8 - 1.0 - (steps - k) * .32; const h = (k + 1) * (3.7 / steps); this.M.box('hStone', F.M(t, h / 2, -.55), .34, h, 1.0, '#e6d9be', .8); }
    this.M.box('hStone', F.M(L * .8, 3.6, -.6), 1.4, .2, 1.2, '#e6d9be', 1); for (let k = 0; k <= steps; k++) this.M.box('hIron', F.M(L * .8 - 1.0 - (steps - k) * .32, 3.7 * k / steps + .95, -1.02), .03, .9, .03, '#fff');
    this.solid([xz(F.P(L * .8 - 1.0 - steps * .32 - .2, 0, 0)), xz(F.P(L * .8 + .75, 0, 0)), xz(F.P(L * .8 + .75, 0, -1.25)), xz(F.P(L * .8 - 1.0 - steps * .32 - .2, 0, -1.25))]);
    cornice(this.M, F, H - .25, {}); parapet(this.M, F, H, {}); this.mass(F, 10, H, { top: true });
    // dam çardağı (ahşap direk + kiriş)
    for (const [t, d] of [[L * .2, 1.5], [L * .55, 1.5], [L * .2, 5], [L * .55, 5]]) this.M.box('hWood', F.M(t, H + 1.2, d), .12, 2.4, .12, '#8f7558'); for (const d of [1.5, 5]) this.M.box('hWood', F.M(L * .375, H + 2.4, d), L * .4, .12, .14, '#8f7558'); for (let t = L * .2; t <= L * .55; t += .5) this.M.box('hWood', F.M(t, H + 2.5, 3.25), .08, .08, 4, '#8f7558'); }
  /* ---------------- ÇEŞME DUVARI ---------------- */
  fountainWall({ side, z0, z1 }) { const H = 4.8; const F = this.F(side, z0, z1, H); const L = F.L; const mid = L / 2;
    const niche = { t0: mid - .8, t1: mid + .8, y0: .62, ys: 2.0, shape: 'pointed', depth: .42 };
    const key = this.facadeMat('Ceşme', F, { openings: [niche], damp: 1.6, streakSources: [{ x0: mid - .9, x1: mid + .9, y: .8, len: .8, k: .35 }] });
    holedWall(this.M, F, key, [niche]); voussoirs(this.M, F, niche, { key: 'hStone', keyB: 'hBasalt', thick: .32, n: 11 });
    const back = F.P; this.M.quad('hStone', F.P(niche.t1, niche.y0, .42), F.P(niche.t0, niche.y0, .42), F.P(niche.t0, 3.2, .42), F.P(niche.t1, 3.2, .42), F.n, [[0, 0], [1.6, 0], [1.6, 2.6], [0, 2.6]], '#cdbfa2');
    // kitabe levhası (yazı satırları kabartma)
    this.M.box('hStone', F.M(mid, 3.62, -.06), 1.9, .62, .12, '#f3ead6', 1); for (let k = 0; k < 2; k++) this.M.box('hBasalt', F.M(mid, 3.47 + k * .26, -.13), 1.6, .04, .015, '#ffffff', 1);
    // lüle (pirinç), yalak (taş tekne), su
    this.M.box('hBrass', F.M(mid, 1.25, -.05), .05, .05, .28, '#ffffff'); this.M.box('hStone', F.M(mid, .3, -.45), 1.9, .6, .9, '#e0d3b8', .8); this.M.box('hWater', F.M(mid, .56, -.45), 1.6, .02, .65, '#ffffff', 1, 16);
    // iki yanda taş seki (oturma)
    for (const sd of [-1, 1]) this.M.box('hStone', F.M(mid + sd * 2.6, .25, -.35), 2.4, .5, .7, '#e3d6bb', .8);
    cornice(this.M, F, H - .25, {}); this.M.box('hStone', F.M(L / 2, H + .1, .1), L, .2, .6, '#efe4cc', 1); this.mass(F, 4, H, { top: true });
    this.solid([xz(F.P(mid - 1, 0, 0)), xz(F.P(mid + 1, 0, 0)), xz(F.P(mid + 1, 0, -.95)), xz(F.P(mid - 1, 0, -.95))]);
    for (let k = 0; k < 3; k++) this.extra.push(meshAt(LATHE.jar, CLAY(), F.P(mid + 1.2 + k * .35, this.g(...xz(F.P(mid + 1.2, 0, -.5))) - F.y0, -.5), 1.4)); }
  /* ---------------- AVLU KAPISI DUVARI ---------------- */
  courtGate({ side, z0, z1 }) { const H = 6.2; const F = this.F(side, z0, z1, H); const L = F.L;
    const gate = { t0: L * .5 - 1.25, t1: L * .5 + 1.25, y0: .1, ys: 2.6, shape: 'round', depth: .7 };
    const hi = [.15, .85].map(f => ({ t0: L * f - .28, t1: L * f + .28, y0: 4.2, ys: 4.9, shape: 'rect', sill: 1, grille: 1, depth: .6 }));
    const key = this.facadeMat('Avlu', F, { openings: [gate, ...hi] });
    holedWall(this.M, F, key, [gate, ...hi]); voussoirs(this.M, F, gate, { key: 'hStone', thick: .45, n: 15 }); doorLeaf(this.M, F, gate, { key: 'hWood' }); hi.forEach(o => windowUnit(this.M, F, o, { grille: true }));
    cornice(this.M, F, H - .25, {}); this.M.box('hStone', F.M(L / 2, H + .1, .1), L, .2, .6, '#efe4cc', 1); this.mass(F, 9, H, { top: true });
    const [X, Z] = this.w(...xz(F.P(L * .5, 0, 5))); this.props.push(['agac', X, heightAt(X, Z) + 0, Z, 1, 1.9, 1]); }
  /* ---------------- BAHÇE DUVARI ---------------- */
  gardenWall({ side, z0, z1 }) { const H = 3.6; const F = this.F(side, z0, z1, H); const L = F.L; const gate = { t0: L * .4 - 1.0, t1: L * .4 + 1.0, y0: .1, ys: 2.2, shape: 'round', depth: .6 };
    const key = this.facadeMat('Bahce', F, { openings: [gate], rubbleBelow: 3.7, damp: 1.4 }); holedWall(this.M, F, key, [gate]); voussoirs(this.M, F, gate, { thick: .34, n: 11 }); doorLeaf(this.M, F, gate, { key: 'hWoodPaint' });
    this.M.box('hStone', F.M(L / 2, H + .1, .3), L, .2, .75, '#e6d9be', 1); this.mass(F, .6, H, { top: false });
    for (const f of [.15, .65, .85]) { const [X, Z] = this.w(...xz(F.P(L * f, 0, 3.2))); this.props.push(['agac', X, heightAt(X, Z), Z, f * 9, 1.7 + f * .6, f > .7 ? 3 : 1]); } }
  /* ---------------- MARANGOZ DÜKKÂNI + DUVAR ---------------- */
  workshop({ side, z0, z1 }) { const H = 5.4; const F = this.F(side, z0, z1, H); const L = F.L; const shop = { t0: L * .25 - 1.4, t1: L * .25 + 1.4, y0: .35, ys: 2.4, shape: 'segment', depth: .65, kind: 'comlekci' };
    const ni = { t0: L * .7 - .35, t1: L * .7 + .35, y0: 1.2, ys: 1.9, shape: 'pointed', depth: .3 };
    const key = this.facadeMat('Atolye', F, { openings: [shop, ni], rubbleBelow: 1.2 }); holedWall(this.M, F, key, [shop, ni]); voussoirs(this.M, F, shop, { thick: .36, n: 9 }); this.shopInterior(F, shop, 5);
    this.M.quad('hPlaster', F.P(ni.t1, ni.y0, .3), F.P(ni.t0, ni.y0, .3), F.P(ni.t0, 2.4, .3), F.P(ni.t1, 2.4, .3), F.n, undefined, '#6a5a48'); this.extra.push(meshAt(LATHE.lamp, this.base.copper, F.P((ni.t0 + ni.t1) / 2, ni.y0, .15), 1));
    cornice(this.M, F, H - .25, {}); parapet(this.M, F, H, {}); this.mass(F, 8, H, { top: true }); }
  /* ---------------- KABALTI (sokak üstü köprü oda + sivri tonozlu geçit) ---------------- */
  kabalti(zS, zN) { const M = this.M; const ext = 6; const xl = Math.min(this.xl(zS), this.xl(zN)), xr = Math.max(this.xr(zS), this.xr(zN)); const w = xr - xl, D = zS - zN; const H = 8.0;
    const yb = Math.min(this.g(this.cx(zS), zS), this.g(this.cx(zN), zN)) - .12;
    const S = new Facade([xr + ext, zS], [xl - ext, zS], yb, H), N = new Facade([xl - ext, zN], [xr + ext, zN], yb, H);
    const tunS = { t0: ext, t1: ext + w, y0: -.2, ys: 2.7, shape: 'pointed', depth: D, noVous: 0 }, tunN = { t0: ext, t1: ext + w, y0: -.2, ys: 2.7, shape: 'pointed', depth: .05 };
    const wS = [{ t0: ext + w / 2 - .45, t1: ext + w / 2 + .45, y0: 5.0, ys: 6.3, shape: 'round', sill: 1, depth: .5 }, { t0: 1.6, t1: 2.3, y0: 2.0, ys: 2.7, shape: 'rect', sill: 1, grille: 1, depth: .5 }];
    const wN = [{ t0: ext + w / 2 - .45, t1: ext + w / 2 + .45, y0: 5.0, ys: 6.3, shape: 'rect', sill: 1, depth: .5 }];
    const kS = this.facadeMat('KabaltiG', S, { openings: [tunS, ...wS] }), kN = this.facadeMat('KabaltiK', N, { openings: [tunN, ...wN] });
    holedWall(M, S, kS, [tunS, ...wS], { revealKey: 'hAshlar' }); holedWall(M, N, kN, [tunN, ...wN]); voussoirs(M, S, tunS, { key: 'hStone', keyB: 'hBasalt', thick: .5, n: 15 }); voussoirs(M, N, tunN, { thick: .5, n: 15 });
    wS.forEach(o => { if (o.shape !== 'rect') voussoirs(M, S, o, { thick: .26, n: 9 }); windowUnit(M, S, o, { grille: o.grille }); }); wN.forEach(o => windowUnit(M, N, o, { shutters: 1 }));
    const cb = cumba(M, S, ext + w / 2 + .1, 4.45, 2.6, 2.2, .8); hipRoofOnFacade(this, S, cb.roof.t, cb.roof.y, cb.roof.w, cb.roof.d, .45, false, true);
    cornice(M, S, H - .3, { corbels: true }); cornice(M, N, H - .3, {}); parapet(M, S, H, { spouts: true });
    // üst (dam) ve yan kütleler
    M.quad('hStone', V3(xl - ext, yb + H, zS), V3(xr + ext, yb + H, zS), V3(xr + ext, yb + H, zN), V3(xl - ext, yb + H, zN), V3(0, 1, 0), [[0, 0], [w + 2 * ext, 0], [w + 2 * ext, D], [0, D]].map(q => [q[0] / 2, q[1] / 2]), '#bfae8e');
    // tonoz içinde asılı fener
    const lp = V3(this.cx((zS + zN) / 2), yb + 3.6, (zS + zN) / 2); const lamp = meshAt(LATHE.lamp, this.base.copper, lp, 1.2); this.extra.push(lamp); const L = new THREE.PointLight('#ffbf80', 3, 7, 2); L.position.copy(lp).add(V3(0, -.2, 0)); this.extra.push(L);
    this.solid([[xl - ext, zS], [xl, zS], [xl, zN], [xl - ext, zN]]); this.solid([[xr, zS], [xr + ext, zS], [xr + ext, zN], [xr, zN]]); }
  chimney(F, t, y, d) { this.M.box('hStone', F.M(t, F.y0 + y - F.y0 - .2, d), .7, 1.6, .7, '#e3d6bb', .7); this.M.box('hStone', F.M(t, y + .7, d), .9, .12, .9, '#efe4cc', .7); }
  streetProps() { const put = (geo, mat, x, z, s = 1, r = 0) => { const p = V3(x, this.g(x, z) + .1, z); const m = meshAt(geo, mat, p, s); m.rotation.y = r; this.extra.push(m); };
    const clay = CLAY(); put(LATHE.jar, clay, this.xl(-24) + .35, -24.3, 1.3); put(LATHE.jar, clay, this.xl(-24) + .4, -24.9, 1.1, 1);
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(LATHE.sack, this.mats.m.sack); s.position.set(this.xr(-8) - .5 - (k % 2) * .5, this.g(this.xr(-8) - .5, -8 - k * .7) + .1, -8 - k * .7); s.castShadow = true; this.extra.push(s); }
    const basket = new THREE.CylinderGeometry(.28, .2, .32, 14, 1, true); const bm = new THREE.MeshStandardMaterial({ color: '#a7865a', roughness: 1, map: this.base.hWood.map, side: THREE.DoubleSide }); put(basket, bm, this.xl(-58) + .4, -58.5, 1); put(basket, bm, this.xl(-58) + .45, -59.2, .8);
    // binek taşı + halka
    const blk = new THREE.BoxGeometry(.7, .55, .5); const nv = this.base.hStone.clone(); nv.vertexColors = false; nv.userData = {}; enablePOM(nv, nv.roughnessMap, [.012, .012]); /* clone() userData'yı JSON ile kopyalar: yama işlevleri null olur, POM yeniden kurulmalı */ put(blk, nv, this.xr(-36) - .45, -36, 1); this.circle(this.xr(-36) - .45, -36, .4); }
}

/* ---------- yardımcılar ---------- */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const xz = v => [v.x, v.z];
let _clay; const CLAY = () => _clay || (_clay = new THREE.MeshStandardMaterial({ color: '#b06a40', roughness: .88 }));
const lathe = (pts, s = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), s);
const LATHE = {
  pot: lathe([[0, 0], [.14, .01], [.24, .16], [.27, .34], [.2, .54], [.11, .62], [.13, .68], [.1, .69]]),
  jar: lathe([[0, 0], [.09, 0], [.13, .1], [.15, .22], [.11, .33], [.05, .38], [.06, .44], [.04, .45]]),
  copper: lathe([[0, 0], [.17, 0], [.23, .08], [.25, .2], [.17, .3], [.1, .33], [.12, .4], [.1, .41]]),
  lamp: lathe([[0, 0], [.06, .02], [.09, .1], [.07, .22], [.03, .28], [.03, .5], [.01, .5]], 10),
  sack: (() => { const g = new THREE.SphereGeometry(.34, 14, 10); g.scale(1, 1.2, 1); g.translate(0, .38, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > .7) p.setY(i, .7); if (p.getY(i) < .04) p.setY(i, .04); p.setX(i, p.getX(i) * (1 + Math.sin(p.getY(i) * 9) * .03)); } g.computeVertexNormals(); return g; })()
};
function meshAt(geo, mat, pos, s = 1) { const m = new THREE.Mesh(geo, mat); m.position.copy(pos); m.scale.setScalar(s); m.castShadow = true; m.receiveShadow = true; return m; }
/** cephe dışına (sokağa doğru değil, içeri doğru) taşan kırma çatı: t merkez, y kot, w uzunluk, d derinlik */
function hipRoofOnFacade(self, F, t, y, w, d, h, rafters = true, out = false) { const c = F.P(t, 0, out ? -(d / 2 - .25) : d / 2 - .45); const ang = Math.atan2(F.dir.z, F.dir.x); hipRoof(self.M, c.x, y, c.z, w, d, ang, h, .55, rafters); }
