// Antep mimari kiti — kahraman sokak için gerçek geometri:
// açıklıklı duvar (derin söve yüzleri), gerçek kemer taşları (kama prizmalar), kapı kanatları, camlı pencere + iç oda,
// kepenkli dükkân iç mekânı, cumba, balkon, saçak/kırma çatı, korkuluklu dam, çeşme, kabaltı tonozu.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = h => (h && h.isColor) ? h : new THREE.Color(h ?? '#ffffff');

/** Basit üçgen tamponu (malzeme anahtarı başına), yön kontrolü otomatik */
export class Mesher {
  constructor() { this.b = new Map(); }
  buf(k) { let x = this.b.get(k); if (!x) this.b.set(k, x = { p: [], n: [], u: [], c: [] }); return x; }
  tri(k, a, b, c, n, ua, ub, uc, ca = WHITE, cb = ca, cc = ca) { const B = this.buf(k); const e1 = b.clone().sub(a), e2 = c.clone().sub(a); const fn = e1.cross(e2);
    if (fn.dot(n) < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; [cb, cc] = [cc, cb]; }
    B.p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); B.n.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z); B.u.push(...ua, ...ub, ...uc); B.c.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b); }
  quad(k, a, b, c, d, n, uv = [[0, 0], [1, 0], [1, 1], [0, 1]], col = WHITE, colTop = null) { col = C(col); const ct = colTop ? C(colTop) : col; this.tri(k, a, b, c, n, uv[0], uv[1], uv[2], col, col, ct); this.tri(k, a, c, d, n, uv[0], uv[2], uv[3], col, ct, ct); }
  /** dönüşümlü kutu, metre başına uvS */
  box(k, m, sx, sy, sz, col = WHITE, uvS = 1, faces = 63) { const hx = sx / 2, hy = sy / 2, hz = sz / 2; const P = (x, y, z) => V(x, y, z).applyMatrix4(m); const N = (x, y, z) => V(x, y, z).transformDirection(m); const c = C(col);
    const F = (bit, pts, n, w, h) => { if (faces & bit) this.quad(k, ...pts.map(p => P(...p)), N(...n), [[0, 0], [w / uvS, 0], [w / uvS, h / uvS], [0, h / uvS]], c); };
    F(1, [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], [0, 0, 1], sx, sy); F(2, [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], [0, 0, -1], sx, sy);
    F(4, [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], [1, 0, 0], sz, sy); F(8, [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], [-1, 0, 0], sz, sy);
    F(16, [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], [0, 1, 0], sx, sz); F(32, [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], [0, -1, 0], sx, sz); }
  meshes(mats, opt = {}) { const out = []; for (const [k, B] of this.b) { if (!B.p.length) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(B.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3)); g.computeBoundingSphere();
      const mat = mats[k]; if (!mat) { console.warn('ArchKit: malzeme yok', k); continue; } const m = new THREE.Mesh(g, mat); m.castShadow = opt.cast ?? true; m.receiveShadow = true; m.name = k; out.push(m); } return out; }
}
const WHITE = new THREE.Color('#ffffff');

/** Cephe çerçevesi: a,b dünya (yerel grup) 2B noktaları [x,z], dışa normal sokak yönü; ybase taban kotu */
export class Facade {
  constructor(a, b, ybase, H) { this.a = a; this.b = b; this.L = Math.hypot(b[0] - a[0], b[1] - a[1]); this.dir = V((b[0] - a[0]) / this.L, 0, (b[1] - a[1]) / this.L); this.n = V(this.dir.z, 0, -this.dir.x); this.y0 = ybase; this.H = H; }
  P(t, y, d = 0) { return V(this.a[0] + this.dir.x * t - this.n.x * d, this.y0 + y, this.a[1] + this.dir.z * t - this.n.z * d); }
  /** yerel matris: x = -dir (dışarıdan bakınca sağa), y = yukarı, z = dışa normal */
  M(t, y, d = 0) { const m = new THREE.Matrix4().makeBasis(this.dir.clone().negate(), V(0, 1, 0), this.n.clone()); const p = this.P(t, y, d); m.setPosition(p); return m; }
}

/** açıklık sınır çizgisi (t,y) — tip: rect | round | pointed | segment */
export function openingOutline(o, seg = 14) { const { t0, t1, y0, ys } = o; const w = t1 - t0, mid = (t0 + t1) / 2; const pts = [[t0, y0], [t1, y0], [t1, ys]];
  if (o.shape === 'round') { const r = w / 2; for (let i = 1; i < seg; i++) { const a = i / seg * Math.PI; pts.push([mid + Math.cos(a) * r, ys + Math.sin(a) * r]); } }
  else if (o.shape === 'pointed') { const k = .18, R = w * (1 - k); const cR = t0 + w * k, cL = t1 - w * k; const apexA = Math.acos((mid - cR) / R); const half = Math.ceil(seg / 2);
    for (let i = 1; i <= half; i++) { const a = apexA * i / half; pts.push([cR + Math.cos(a) * R, ys + Math.sin(a) * R]); } for (let i = half - 1; i >= 1; i--) { const a = apexA * i / half; pts.push([cL - Math.cos(a) * R, ys + Math.sin(a) * R]); } }
  else if (o.shape === 'segment') { const rise = w * .14; const R = (w * w / 4 + rise * rise) / (2 * rise); const cy = ys + rise - R; const a0 = Math.asin((w / 2) / R); for (let i = 1; i < seg; i++) { const a = -a0 + 2 * a0 * i / seg; pts.push([mid - Math.sin(a) * R * -1 * -1 * (1), 0]); pts[pts.length - 1] = [mid + Math.sin(a0 - 2 * a0 * i / seg) * R, cy + Math.cos(a0 - 2 * a0 * i / seg) * R]; } }
  pts.push([t0, ys]); return pts; }
export function outlineTop(o) { const p = openingOutline(o); return Math.max(...p.map(q => q[1])); }

/** Açıklıklı duvar ön yüzü + söve iç yüzleri. key: cephe malzemesi; revealKey: söve taşı */
export function holedWall(M, F, key, openings, { revealKey = 'hAshlar', depthDefault = .55, tUvL = null, x0 = 0, x1 = null, yTop = null } = {}) {
  const L = x1 ?? F.L, H = yTop ?? F.H; const outer = [new THREE.Vector2(x0, -.4), new THREE.Vector2(L, -.4), new THREE.Vector2(L, H), new THREE.Vector2(x0, H)];
  const holes = openings.filter(o => !o.noHole).map(o => openingOutline(o).map(p => new THREE.Vector2(p[0], p[1])));
  const tris = THREE.ShapeUtils.triangulateShape(outer, holes); const all = outer.concat(...holes); const uvL = tUvL ?? F.L;
  for (const t of tris) { const p = t.map(i => all[i]); M.tri(key, F.P(p[0].x, p[0].y), F.P(p[1].x, p[1].y), F.P(p[2].x, p[2].y), F.n, [p[0].x / uvL, p[0].y / F.H], [p[1].x / uvL, p[1].y / F.H], [p[2].x / uvL, p[2].y / F.H]); }
  // söve yüzleri
  openings.filter(o => !o.noHole).forEach(o => { const pts = openingOutline(o); const d = o.depth ?? depthDefault; const cx = (o.t0 + o.t1) / 2, cy = (o.y0 + outlineTop(o)) / 2; let acc = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; const sl = Math.hypot(q[0] - p[0], q[1] - p[1]); if (sl < 1e-4) continue; let px = -(q[1] - p[1]) / sl, py = (q[0] - p[0]) / sl; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (px * (cx - mx) + py * (cy - my) < 0) { px = -px; py = -py; }
      const n = F.dir.clone().multiplyScalar(px).add(V(0, py, 0)).normalize(); const shade = new THREE.Color().setScalar(.92);
      M.quad(revealKey, F.P(p[0], p[1]), F.P(q[0], q[1]), F.P(q[0], q[1], d), F.P(p[0], p[1], d), n, [[acc, 0], [acc + sl, 0], [acc + sl, d], [acc, d]], shade); acc += sl; } }); }

/** gerçek kemer taşları: açıklığın üst eğrisi boyunca kama prizmalar (ön + iki yan + dış), ablak için iki malzeme */
export function voussoirs(M, F, o, { key = 'hStone', keyB = null, thick = .36, proud = .025, n = 13, keystone = true } = {}) {
  const pts = openingOutline(o, n * 4); const curve = pts.slice(2); const cx = (o.t0 + o.t1) / 2, cy = o.ys;
  // eğri boyunca eşit yay uzunluğunda n taş
  const acc = [0]; for (let i = 1; i < curve.length; i++) acc.push(acc[i - 1] + Math.hypot(curve[i][0] - curve[i - 1][0], curve[i][1] - curve[i - 1][1])); const tot = acc[acc.length - 1];
  const at = s => { let i = 1; while (i < acc.length - 1 && acc[i] < s) i++; const f = (s - acc[i - 1]) / (acc[i] - acc[i - 1] || 1); return [curve[i - 1][0] + (curve[i][0] - curve[i - 1][0]) * f, curve[i - 1][1] + (curve[i][1] - curve[i - 1][1]) * f]; };
  const outP = (pt, th) => { const dx = pt[0] - cx, dy = pt[1] - cy; const l = Math.hypot(dx, dy) || 1; return [pt[0] + dx / l * th, pt[1] + dy / l * th]; };
  const mid = Math.floor(n / 2);
  for (let i = 0; i < n; i++) { const s0 = tot * i / n + tot * .006, s1 = tot * (i + 1) / n - tot * .006; const isKey = keystone && i === mid; const th = thick + (isKey ? .1 : 0) + ((i * 7) % 3) * .02;
    const P0 = at(s0), P1 = at(s1), Q1 = outP(P1, th), Q0 = outP(P0, th); const k = keyB && i % 2 ? keyB : key; const pr = proud + (isKey ? .03 : 0);
    const tone = new THREE.Color().setScalar(.94 + ((i * 37) % 9) / 100);
    M.quad(k, F.P(P0[0], P0[1], -pr), F.P(P1[0], P1[1], -pr), F.P(Q1[0], Q1[1], -pr), F.P(Q0[0], Q0[1], -pr), F.n, [[i * .3, 0], [i * .3 + .3, 0], [i * .3 + .3, th], [i * .3, th]], tone);
    // dış kenar (taş kalınlığı)
    const a = F.P(Q0[0], Q0[1], -pr), b2 = F.P(Q1[0], Q1[1], -pr), c = F.P(Q1[0], Q1[1], 0), d = F.P(Q0[0], Q0[1], 0); const nn = V((Q0[0] + Q1[0]) / 2 - cx, (Q0[1] + Q1[1]) / 2 - cy, 0); const wn = F.dir.clone().multiplyScalar(nn.x).add(V(0, nn.y, 0)).normalize();
    M.quad(k, a, b2, c, d, wn, [[0, 0], [.3, 0], [.3, .03], [0, .03]], tone.clone().multiplyScalar(.9)); }
}

/** ahşap kapı kanadı (açıklık şeklinde) + kabara çiviler + tokmak + eşik */
export function doorLeaf(M, F, o, { key = 'hWood', inset = .42, double = true, studs = true } = {}) {
  const pts = openingOutline(o).map(p => new THREE.Vector2(p[0], p[1])); const tris = THREE.ShapeUtils.triangulateShape(pts, []); const n = F.n;
  for (const t of tris) { const p = t.map(i => pts[i]); M.tri(key, ...p.map(q => F.P(q.x, q.y, inset)), n, ...p.map(q => [(q.x - o.t0) / 1.0, (q.y - o.y0) / 2.2])); }
  const mid = (o.t0 + o.t1) / 2; if (double) M.box('hIron', F.M(mid, o.y0 + (o.ys - o.y0) / 2, inset - .02), .03, o.ys - o.y0, .02, '#ffffff');
  // çerçeve kayıtları
  for (const yy of [.35, (o.ys - o.y0) * .5, o.ys - o.y0 - .25]) M.box(key, F.M(mid, o.y0 + yy, inset - .03), o.t1 - o.t0 - .06, .1, .05, '#d8c7b0', 1);
  if (studs) for (let yy = .3; yy < o.ys - o.y0 - .1; yy += .28) for (let tt = o.t0 + .14; tt < o.t1 - .1; tt += .22) M.box('hIron', F.M(tt, o.y0 + yy, inset - .04), .035, .035, .03, '#ffffff', 1, 1 | 16 | 4 | 8);
  M.box('hBrass', F.M(mid + (double ? .22 : .3), o.y0 + 1.15, inset - .06), .12, .16, .03, '#ffffff');
  M.box('hStone', F.M(mid, o.y0 - .06, -.12), o.t1 - o.t0 + .5, .14, .55 + inset, '#d6ccb8', 1, 1 | 16);
}
/** cam + ahşap doğrama + iç oda (siyah boşluk yerine loş bir iç mekân) */
export function windowUnit(M, F, o, { inset = .3, room = 2.2, grille = false, shutters = 0, frameKey = 'hWood' } = {}) {
  const top = outlineTop(o); const mid = (o.t0 + o.t1) / 2, w = o.t1 - o.t0, h = top - o.y0; const d = o.depth ?? .55;
  // iç oda: arka duvar, yanlar, tavan, taban (loş, AO tonlu)
  const back = d + room; const dim = new THREE.Color('#8c7a63'), dk = new THREE.Color('#5a4c3d');
  M.quad('hPlaster', F.P(o.t1 + .6, o.y0 - .2, back), F.P(o.t0 - .6, o.y0 - .2, back), F.P(o.t0 - .6, top + .4, back), F.P(o.t1 + .6, top + .4, back), F.n.clone(), [[0, 0], [1, 0], [1, 1], [0, 1]], dk, dim);
  M.quad('hPlaster', F.P(o.t0 - .6, top + .4, d), F.P(o.t1 + .6, top + .4, d), F.P(o.t1 + .6, top + .4, back), F.P(o.t0 - .6, top + .4, back), V(0, -1, 0), undefined, dk, dk);
  M.quad('hPlaster', F.P(o.t1 + .6, o.y0 - .2, d), F.P(o.t0 - .6, o.y0 - .2, d), F.P(o.t0 - .6, o.y0 - .2, back), F.P(o.t1 + .6, o.y0 - .2, back), V(0, 1, 0), undefined, dim, dk);
  // perde (bazı pencerelerde)
  if ((o.t0 * 7) % 1 > .5) M.quad('hFabricIn', F.P(o.t1 - w * .1, o.y0, d + .35), F.P(o.t0 + w * .4, o.y0, d + .35), F.P(o.t0 + w * .4, top, d + .35), F.P(o.t1 - w * .1, top, d + .35), F.n, [[0, 0], [1, 0], [1, 1], [0, 1]], '#c9b79a');
  // cam
  const pts = openingOutline(o).map(p => new THREE.Vector2(p[0], p[1])); THREE.ShapeUtils.triangulateShape(pts, []).forEach(t => { const p = t.map(i => pts[i]); M.tri('hGlass', ...p.map(q => F.P(q.x, q.y, inset + .02)), F.n, [0, 0], [1, 0], [1, 1]); });
  // doğrama: kasa + kayıt
  const fk = frameKey; M.box(fk, F.M(mid, o.y0 + .03, inset), w, .06, .08); M.box(fk, F.M(mid, o.ys - .03, inset), w, .06, .08); M.box(fk, F.M(o.t0 + .03, (o.y0 + o.ys) / 2, inset), .06, o.ys - o.y0, .08); M.box(fk, F.M(o.t1 - .03, (o.y0 + o.ys) / 2, inset), .06, o.ys - o.y0, .08);
  M.box(fk, F.M(mid, (o.y0 + o.ys) / 2, inset - .01), .05, o.ys - o.y0, .06); M.box(fk, F.M(mid, o.y0 + (o.ys - o.y0) * .62, inset - .01), w, .05, .06);
  if (grille) { for (let tt = o.t0 + w / 4; tt < o.t1 - .05; tt += w / 4) M.box('hIron', F.M(tt, (o.y0 + top) / 2, .08), .025, top - o.y0, .025); for (const fy of [.3, .7]) M.box('hIron', F.M(mid, o.y0 + h * fy, .08), w, .025, .025); }
  if (shutters) { for (const sd of [-1, 1]) { const tc = sd < 0 ? o.t0 - w / 4 - .04 : o.t1 + w / 4 + .04; const m = F.M(tc, (o.y0 + o.ys) / 2, -.05); m.multiply(new THREE.Matrix4().makeRotationY(sd * .18)); M.box('hWoodPaint', m, w / 2, o.ys - o.y0 - .04, .045, '#ffffff', 1); for (const fy of [-.3, .3]) M.box('hIron', F.M(tc + sd * -w / 4 * .8, (o.y0 + o.ys) / 2 + fy * (o.ys - o.y0), -.02), .14, .03, .02, '#fff'); } }
  // denizlik (dışa taşan)
  M.box('hStone', F.M(mid, o.y0 - .07, -.06), w + .3, .14, .2 + d * .3, '#e8dcc4', .6);
}

/** cumba: ahşap çıkma, kafes + cam, dirsekler, küçük kiremit çatı */
export function cumba(M, F, t, y, w = 3, h = 2.5, d = .9) { const m = (x, yy, z) => F.M(t + x, y + yy, -z);
  M.box('hWood', m(0, .12, d / 2), w + .1, .24, d + .05, '#c9b49a', 1);
  for (const x of [-w / 2 + .05, -w / 6, w / 6, w / 2 - .05]) M.box('hWood', m(x, h / 2 + .2, d), .1, h - .2, .1, '#b59c80', 1);
  for (const sx of [-1, 1]) M.box('hWood', m(sx * (w / 2), h / 2 + .2, d / 2), .1, h - .2, .1, '#b59c80', 1);
  M.box('hLattice', m(0, .25 + .55, d + .02), w - .1, 1.0, .02, '#ffffff', 1, 1 | 2); M.box('hGlass', m(0, 1.35 + .45, d - .04), w - .2, .9, .02, '#ffffff', 1, 1);
  for (const sx of [-1, 1]) M.box('hLattice', m(sx * (w / 2 - .01), .8, d / 2), .02, 1.0, d - .1, '#ffffff', 1, 4 | 8);
  M.box('hWood', m(0, h + .2, d / 2 + .1), w + .5, .14, d + .45, '#a68d70', 1);
  for (const x of [-w / 2 + .25, 0, w / 2 - .25]) { M.box('hWood', m(x, -.25, d / 2), .12, .14, d, '#a68d70', 1); M.box('hWood', m(x, -.65, .2), .1, .7, .1, '#a68d70', 1); }
  return { roof: { t, y: y + h + .27, w: w + .6, d: d + .55 } }; }
export function balcony(M, F, t, y, w = 2.6, d = 1.0) { const m = (x, yy, z) => F.M(t + x, y + yy, -z);
  M.box('hWood', m(0, 0, d / 2), w, .12, d, '#c2a888', 1); for (let x = -w / 2 + .08; x <= w / 2; x += .14) { M.box('hWood', m(x, .48, d - .04), .045, .84, .045, '#b39878', 1); }
  M.box('hWood', m(0, .94, d - .04), w + .04, .07, .08, '#b39878', 1); for (const sx of [-1, 1]) M.box('hWood', m(sx * (w / 2), .48, d / 2), .045, .84, d, '#b39878', 1, 4 | 8);
  for (const x of [-w / 2 + .25, w / 2 - .25]) { const br = F.M(t + x, y - .35, -.35); br.multiply(new THREE.Matrix4().makeRotationX(-.75)); M.box('hWood', br, .1, .9, .1, '#9c8264', 1); } }

/** kırma kiremit çatı + saçak altı ahşap mertek uçları */
export function hipRoof(M, cx, y, cz, len, wid, ang, h, eave = .55, rafters = true) { const L = len / 2 + eave, W = wid / 2 + eave, rl = Math.max(0, L - W); const c = Math.cos(ang), s = Math.sin(ang);
  const P = (u, v, yy) => V(cx + u * c - v * s, yy, cz + u * s + v * c); const a = P(-L, -W, y), b = P(L, -W, y), cc = P(L, W, y), d = P(-L, W, y), e = P(-rl, 0, y + h), f = P(rl, 0, y + h);
  const sl = Math.hypot(W, h); const up = (p, q, r) => { const n = q.clone().sub(p).cross(r.clone().sub(p)).normalize(); return n.y < 0 ? n.negate() : n; };
  M.quad('hRoof', a, b, f, e, up(a, b, f), [[0, 0], [2 * L / 2, 0], [(L + rl) / 2, sl / 2], [(L - rl) / 2, sl / 2]]); M.quad('hRoof', cc, d, e, f, up(cc, d, e), [[0, 0], [2 * L / 2, 0], [(L + rl) / 2, sl / 2], [(L - rl) / 2, sl / 2]]);
  M.tri('hRoof', b, cc, f, up(b, cc, f), [0, 0], [W, 0], [W / 2, sl / 2]); M.tri('hRoof', d, a, e, up(d, a, e), [0, 0], [W, 0], [W / 2, sl / 2]);
  // alt yüz (saçak altı) ahşap
  M.quad('hWood', a, d, cc, b, V(0, -1, 0), [[0, 0], [1, 0], [1, 1], [0, 1]], '#8a735a');
  // mahya kiremitleri
  if (rl > 0) { const m = new THREE.Matrix4().makeRotationY(-ang); m.setPosition(cx, y + h + .06, cz); M.box('hRoof', m, rl * 2 + .3, .14, .22, '#d9b8a0', .5); }
  if (rafters) for (const side of [-1, 1]) for (let u = -L + .3; u < L - .2; u += .55) { const p = P(u, side * (W - .18), y - .07); const m = new THREE.Matrix4().makeRotationY(-ang); m.setPosition(p); M.box('hWood', m, .09, .12, .42, '#7a6249', 1); } }

/** taş korniş (profil: iki kademeli) + konsollar */
export function cornice(M, F, y, { corbels = false, from = 0, to = null } = {}) { const L = (to ?? F.L) - from, mid = from + L / 2; M.box('hStone', F.M(mid, y, -.08), L + .1, .16, .22, '#efe4cc', 1); M.box('hStone', F.M(mid, y + .16, -.14), L + .2, .14, .32, '#f4ead4', 1);
  if (corbels) for (let t = from + .4; t < from + L - .2; t += .7) M.box('hStone', F.M(t, y - .18, -.1), .16, .2, .26, '#e6d9be', 1); }
/** dam korkuluğu + çörtenler */
export function parapet(M, F, y, { spouts = true } = {}) { M.box('hStone', F.M(F.L / 2, y + .32, .2), F.L, .64, .4, '#e9dcc0', 1); M.box('hStone', F.M(F.L / 2, y + .68, .2), F.L + .06, .08, .48, '#f2e8d2', 1);
  if (spouts) for (let t = 1.5; t < F.L - .8; t += 4.5) { M.box('hStone', F.M(t, y + .05, -.35), .2, .18, .9, '#e2d5b9', 1); } }
