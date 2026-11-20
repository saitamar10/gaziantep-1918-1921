// Birleştirilmiş (merged) geometri kurucu: malzeme anahtarı başına tek BufferGeometry.
// Dünya ölçekli UV: duvarlarda u = kenar boyu / uvScale, v = y / uvScale.
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _n = new THREE.Vector3();
const C = (h) => (h && h.isColor) ? h : new THREE.Color(h ?? '#ffffff');

export class Buffer {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; }
  tri(a, b, c, n, ua, ub, uc, ca, cb, cc) { const o = this.p.length / 3; this.i.push(o, o + 1, o + 2); this.p.push(...a, ...b, ...c); this.n.push(...n, ...n, ...n); this.u.push(...ua, ...ub, ...uc); this.c.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b); }
  quad(a, b, c, d, n, uvs, ca, cb = ca, cc = cb, cd = ca) { const o = this.p.length / 3; this.p.push(...a, ...b, ...c, ...d); this.n.push(...n, ...n, ...n, ...n); this.u.push(...uvs[0], ...uvs[1], ...uvs[2], ...uvs[3]); this.c.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b, cd.r, cd.g, cd.b); this.i.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  get count() { return this.p.length / 3; }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1)); g.computeBoundingSphere(); g.computeBoundingBox(); return g; }
}

export class GeoBuilder {
  constructor() { this.buf = new Map(); }
  b(key) { let x = this.buf.get(key); if (!x) this.buf.set(key, x = new Buffer()); return x; }
  /** dikey duvar şeridi a->b (2B noktalar [x,z]); dış normal = sağ taraf (CCW çokgen için dışa) */
  wall(key, a, b, y0, y1, col, { uvS = 3, uo = 0, grime = .68, grimeH = 1.4, y0b = null } = {}) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-3) return; const nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    const c = C(col); const top = c, bot = c.clone().multiplyScalar(grime); const H = y1 - y0; const mid = Math.min(1, grimeH / Math.max(H, .01));
    const yb0 = y0b ?? y0;
    const Bf = this.b(key); const U = (u, y) => [uo + u / uvS, y / uvS];
    const Q = (ya0, yb0_, ya1, yb1, cA0, cB0, cA1, cB1) => Bf.quad([b[0], yb0_, b[1]], [a[0], ya0, a[1]], [a[0], ya1, a[1]], [b[0], yb1, b[1]], [nx, 0, nz], [U(L, yb0_), U(0, ya0), U(0, ya1), U(L, yb1)], cB0, cA0, cA1, cB1);
    if (H > grimeH * 1.2) { const ym = y0 + grimeH; const cm = c.clone().multiplyScalar(.97); Q(yb0, y0, ym, ym, bot, bot, cm, cm); Q(ym, ym, y1, y1, cm, cm, top, top); }
    else Q(yb0, y0, y1, y1, bot, bot, top, top);
  }
  /** yatay çokgen yüzey (delikli olabilir), y sabit, yukarı bakar */
  cap(key, outer, holes, y, col, uvS = 3, down = false) {
    const contour = outer.map(p => new THREE.Vector2(p[0], p[1])); const hs = (holes || []).map(h => h.map(p => new THREE.Vector2(p[0], p[1])));
    const tris = THREE.ShapeUtils.triangulateShape(contour, hs); const all = contour.concat(...hs); const c = C(col); const B = this.b(key);
    for (const t of tris) { const [i, j, k] = down ? [t[0], t[1], t[2]] : [t[0], t[2], t[1]]; const P = q => [all[q].x, y, all[q].y]; const U = q => [all[q].x / uvS, all[q].y / uvS];
      // yönü normal +Y olacak şekilde düzelt
      const a = P(i), b2 = P(j), d = P(k); const cr = (b2[0] - a[0]) * (d[2] - a[2]) - (b2[2] - a[2]) * (d[0] - a[0]);
      if ((cr < 0) !== down) B.tri(a, b2, d, [0, down ? -1 : 1, 0], U(i), U(j), U(k), c, c, c); else B.tri(a, d, b2, [0, down ? -1 : 1, 0], U(i), U(k), U(j), c, c, c); }
  }
  /** çokgen prizma: yan duvarlar + üst */
  prism(key, poly, y0, y1, col, opts = {}) { for (let i = 0; i < poly.length; i++) this.wall(key, poly[i], poly[(i + 1) % poly.length], y0, y1, col, opts); if (opts.top !== false) this.cap(opts.topKey || key, poly, null, y1, opts.topCol || col, opts.uvS || 3); }
  /** dönüşüm matrisli kutu (merkez tabanda değil, ortada) */
  boxM(key, m, sx, sy, sz, col, { uvS = 1, faces = 63, colB = null } = {}) {
    const c = C(col), cb = colB ? C(colB) : c; const hx = sx / 2, hy = sy / 2, hz = sz / 2; const B = this.b(key);
    const V = (x, y, z) => { _v.set(x, y, z).applyMatrix4(m); return [_v.x, _v.y, _v.z]; };
    const N = (x, y, z) => { _n.set(x, y, z).transformDirection(m); return [_n.x, _n.y, _n.z]; };
    const F = (bit, pts, n, w, h, bottomFirst) => { if (!(faces & bit)) return; const [a, b2, c2, d] = pts.map(p => V(...p)); const uv = [[0, 0], [w / uvS, 0], [w / uvS, h / uvS], [0, h / uvS]]; B.quad(a, b2, c2, d, N(...n), uv, bottomFirst ? cb : c, bottomFirst ? cb : c, c, c); };
    F(1, [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], [0, 0, 1], sx, sy, true);
    F(2, [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], [0, 0, -1], sx, sy, true);
    F(4, [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], [1, 0, 0], sz, sy, true);
    F(8, [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], [-1, 0, 0], sz, sy, true);
    F(16, [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], [0, 1, 0], sx, sz, false);
    F(32, [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], [0, -1, 0], sx, sz, false);
  }
  /** Y ekseninde döndürülmüş kutu; (x,y0,z) taban merkezi */
  box(key, x, y0, z, sx, sy, sz, ry, col, o = {}) { _m.makeRotationY(ry); _m.setPosition(x, y0 + sy / 2, z); this.boxM(key, _m, sx, sy, sz, col, o); }
  /** Cephe çerçevesi: kenar a->b üzerinde t konumunda, dışa doğru 'out' metre; yerel eksenler: x=kenar boyunca, y=yukarı, z=dışa */
  frame(a, b, t, out, y) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L; const nx = tz, nz = -tx;
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(-tx, 0, -tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx, 0, nz)); m.setPosition(a[0] + tx * t + nx * out, y, a[1] + tz * t + nz * out); return m; }
  /** yerel matris içinde öteleme+dönüş (z ekseni etrafında) */
  static local(base, x, y, z, rz = 0) { const m = new THREE.Matrix4().makeRotationZ(rz); m.setPosition(x, y, z); return base.clone().multiply(m); }
  /** Kemer (taş kemer/voussoir dizisi). base: cephe matrisi (orijin = açıklık alt merkezi) */
  arch(key, base, w, springY, depth, colA, colB = null, n = 11, thick = .34, keyB = null) {
    if (this.autoFill !== false) this.archFill('dark', base, w + .02, springY, .012, '#ffffff');
    const r = w / 2 + thick / 2; for (let i = 0; i < n; i++) { const th = Math.PI - (i + .5) / n * Math.PI; const x = Math.cos(th) * r, y = springY + Math.sin(th) * r; const m = GeoBuilder.local(base, x, y, 0, th - Math.PI / 2);
      const k = (colB && i % 2) ? (keyB || key) : key; this.boxM(k, m, Math.PI * r / n * .985, thick, depth, (colB && i % 2) ? colB : colA, { uvS: 1.5 }); }
  }
  /** kemer alınlığını dolduran yarım daire (koyu boşluk) */
  archFill(key, base, w, springY, z = -.05, col = '#ffffff', seg = 12) { const B = this.b(key); const c = C(col); const r = w / 2; const P = (x, y) => { _v.set(x, y, z).applyMatrix4(base); return [_v.x, _v.y, _v.z]; }; const n = (() => { _n.set(0, 0, 1).transformDirection(base); return [_n.x, _n.y, _n.z]; })();
    for (let i = 0; i < seg; i++) { const a0 = Math.PI - i / seg * Math.PI, a1 = Math.PI - (i + 1) / seg * Math.PI; B.tri(P(0, springY), P(Math.cos(a1) * r, springY + Math.sin(a1) * r), P(Math.cos(a0) * r, springY + Math.sin(a0) * r), n, [.5, 0], [0, 1], [1, 1], c, c, c); } }
  /** kırma çatı (dikdörtgen); taban merkezi, uzunluk, genişlik, yükseklik, açı */
  hipRoof(key, cx, y, cz, len, wid, h, ang, col, eave = .45) { const L = len / 2 + eave, W = wid / 2 + eave, rl = Math.max(0, L - W); const c = Math.cos(ang), s = Math.sin(ang);
    const P = (u, v, yy) => [cx + u * c - v * s, yy, cz + u * s + v * c];
    const a = P(-L, -W, y), b = P(L, -W, y), cc = P(L, W, y), d = P(-L, W, y), e = P(-rl, 0, y + h), f = P(rl, 0, y + h); const B = this.b(key); const col_ = C(col);
    const nrm = (p, q, r) => { const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2], vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; };
    const sl = Math.hypot(W, h) / 1.0;
    let n1 = nrm(a, e, b); if (n1[1] < 0) n1 = n1.map(v => -v); B.quad(a, b, f, e, n1, [[0, 0], [2 * L, 0], [L + rl, sl], [L - rl, sl]], col_);
    let n2 = nrm(cc, f, d); if (n2[1] < 0) n2 = n2.map(v => -v); B.quad(cc, d, e, f, n2, [[0, 0], [2 * L, 0], [L + rl, sl], [L - rl, sl]], col_);
    let n3 = nrm(b, f, cc); if (n3[1] < 0) n3 = n3.map(v => -v); B.tri(b, cc, f, n3, [0, 0], [2 * W, 0], [W, sl], col_, col_, col_);
    let n4 = nrm(d, e, a); if (n4[1] < 0) n4 = n4.map(v => -v); B.tri(d, a, e, n4, [0, 0], [2 * W, 0], [W, sl], col_, col_, col_);
  }
  /** kubbe yarım küresi parçaları ekle */
  dome(key, cx, y, cz, r, col, seg = 18, ring = 8, squash = 1) { const B = this.b(key); const c = C(col);
    for (let j = 0; j < ring; j++) for (let i = 0; i < seg; i++) { const t0 = j / ring * Math.PI / 2, t1 = (j + 1) / ring * Math.PI / 2, p0 = i / seg * Math.PI * 2, p1 = (i + 1) / seg * Math.PI * 2;
      const P = (t, p) => [cx + Math.cos(t) * Math.cos(p) * r, y + Math.sin(t) * r * squash, cz + Math.cos(t) * Math.sin(p) * r]; const Nn = (t, p) => [Math.cos(t) * Math.cos(p), Math.sin(t), Math.cos(t) * Math.sin(p)];
      const a = P(t0, p0), b = P(t0, p1), d = P(t1, p0), e = P(t1, p1); const n = Nn((t0 + t1) / 2, (p0 + p1) / 2); B.quad(a, d, e, b, n, [[i / seg * 6, j / ring * 2], [i / seg * 6, (j + 1) / ring * 2], [(i + 1) / seg * 6, (j + 1) / ring * 2], [(i + 1) / seg * 6, j / ring * 2]], c); } }
  /** dikey silindir (minare gövdesi vb.) */
  cylinder(key, cx, y0, cz, r0, r1, h, col, seg = 16, cap = true, uvS = 3) { const B = this.b(key); const c = C(col); const circ = 2 * Math.PI * r0;
    for (let i = 0; i < seg; i++) { const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2; const P = (a, r, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      const n = [Math.cos((a0 + a1) / 2), (r0 - r1) / h, Math.sin((a0 + a1) / 2)]; const u0 = i / seg * circ / uvS, u1 = (i + 1) / seg * circ / uvS;
      B.quad(P(a1, r0, y0), P(a0, r0, y0), P(a0, r1, y0 + h), P(a1, r1, y0 + h), n, [[u1, y0 / uvS], [u0, y0 / uvS], [u0, (y0 + h) / uvS], [u1, (y0 + h) / uvS]], c);
      if (cap) B.tri(P(a1, r1, y0 + h), P(a0, r1, y0 + h), [cx, y0 + h, cz], [0, 1, 0], [0, 0], [1, 0], [.5, .5], c, c, c); } }
  cone(key, cx, y0, cz, r, h, col, seg = 12) { const B = this.b(key); const c = C(col); for (let i = 0; i < seg; i++) { const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2; const p0 = [cx + Math.cos(a0) * r, y0, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, y0, cz + Math.sin(a1) * r];
      const n = [Math.cos((a0 + a1) / 2) * h, r, Math.sin((a0 + a1) / 2) * h]; const l = Math.hypot(...n); B.tri(p1, p0, [cx, y0 + h, cz], n.map(v => v / l), [1, 0], [0, 0], [.5, 1], c, c, c); } }
  /** malzeme sözlüğüyle mesh dizisi üret */
  meshes(mats, { cast = true, receive = true } = {}) { const out = []; for (const [k, B] of this.buf) { if (!B.count) continue; const mat = mats[k]; if (!mat) { console.warn('malzeme yok', k); continue; } const m = new THREE.Mesh(B.geometry(), mat); m.castShadow = cast; m.receiveShadow = receive; m.name = k; out.push(m); } return out; }
}
