// Çevre eşyaları ve ağaçlar — InstancedMesh ile çizilir (yüksek tekrar, düşük çizim çağrısı).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from '../core/MapCoordinates.js';

function lathe(profile, seg = 14) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
function strip(g) { // yalnız konum/normal/uv bırak (birleştirme uyumu)
  const out = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(out.attributes)) if (!['position', 'normal', 'uv'].includes(k)) out.deleteAttribute(k); return out; }

function treeParts(type, seed) { const R = rng(seed); const bark = [], leaf = [];
  const trunkH = type === 2 ? 2.2 : type === 3 ? 1.6 : 2.6; const crownR = type === 2 ? 1.5 : type === 3 ? 2.6 : 3.2;
  const t = new THREE.CylinderGeometry(.13, .24, trunkH + .6, 7); t.translate(0, (trunkH + .6) / 2 - .3, 0); bark.push(strip(t));
  const clusters = type === 2 ? 4 : 7;
  for (let c = 0; c < clusters; c++) { const a = R() * Math.PI * 2, rr = R() * crownR * .55; const cx = Math.cos(a) * rr, cz = Math.sin(a) * rr, cy = trunkH + (type === 2 ? 1 + c * .7 : .8 + R() * crownR * .7);
    // dal
    const len = Math.hypot(cx, cy - trunkH, cz); const br = new THREE.CylinderGeometry(.04, .09, len, 5); br.translate(0, len / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(cx, cy - trunkH, cz).normalize()); br.applyQuaternion(q); br.translate(0, trunkH - .2, 0); bark.push(strip(br));
    const cr = (type === 2 ? .9 : 1.15) + R() * .6;
    for (let k = 0; k < 16; k++) { const p = new THREE.PlaneGeometry(1.5, 1.5); const e = new THREE.Euler(R() * Math.PI, R() * Math.PI, R() * Math.PI); p.applyQuaternion(new THREE.Quaternion().setFromEuler(e)); const u = R() * Math.PI * 2, v = Math.acos(2 * R() - 1), rad = cr * Math.cbrt(R());
      p.translate(cx + Math.sin(v) * Math.cos(u) * rad, cy + Math.cos(v) * rad * .75, cz + Math.sin(v) * Math.sin(u) * rad); const g = strip(p);
      // uç yapraklar daha aydınlık (sahte saçılma)
      const col = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < g.attributes.position.count; i++) { const y = g.attributes.position.getY(i); const s = .7 + Math.min(.45, (y - trunkH) / (crownR * 2.5)); col[i * 3] = s; col[i * 3 + 1] = s; col[i * 3 + 2] = s * .95; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); leaf.push(g); } }
  bark.forEach(g => { const col = new Float32Array(g.attributes.position.count * 3).fill(1); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); });
  return { bark: mergeGeometries(bark), leaf: mergeGeometries(leaf) };
}

export class Props {
  constructor(mats) { this.m = mats.m; this.proto = {};
    const pot = strip(lathe([[0, 0], [.16, .02], [.26, .2], [.28, .38], [.2, .58], [.12, .66], [.14, .72], [0, .72]]));
    const copper = strip(lathe([[0, 0], [.18, 0], [.24, .1], [.26, .22], [.18, .34], [.1, .38], [.12, .46], [0, .46]]));
    const ewer = strip(lathe([[0, 0], [.1, 0], [.14, .14], [.1, .3], [.05, .38], [.07, .48], [0, .48]], 10));
    const sackG = new THREE.SphereGeometry(.38, 12, 8); sackG.scale(1, 1.25, 1); sackG.translate(0, .42, 0); const pos = sackG.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > .78) pos.setY(i, .78); if (y < .05) pos.setY(i, .05); } sackG.computeVertexNormals();
    const spice = new THREE.CircleGeometry(.3, 12); spice.rotateX(-Math.PI / 2); spice.translate(0, .79, 0);
    const P = (geo, mat) => ({ geo, mat });
    this.proto.kup = [P(pot, this.m.pot)];
    this.proto.bakir = [P(copper, this.m.copper)]; this.proto.bakirAsili = [P(ewer, this.m.copper)];
    this.proto.cuval = [P(strip(sackG), this.m.sack), P(strip(spice), this.m.spice)];
    for (const t of [1, 2, 3]) { const { bark, leaf } = treeParts(t, t * 31); this.proto['agac' + t] = [P(bark, this.m.bark), P(leaf, this.m.leaves)]; }
    this.spiceColors = ['#b8432a', '#d9a520', '#7a3a1e', '#e0d2a0', '#5e7a2e'].map(c => new THREE.Color(c));
    this.leafTints = ['#ffffff', '#e8f0d0', '#d8e6c0', '#f2ead0'].map(c => new THREE.Color(c));
  }
  /** props: [tip, x, y, z, rot, scale, var] dizisi -> InstancedMesh grubu */
  build(list) { const groups = {}; for (const p of list) { const k = p[0] === 'agac' ? 'agac' + (p[6] || 1) : p[0]; (groups[k] = groups[k] || []).push(p); }
    const out = new THREE.Group(); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    for (const k in groups) { const parts = this.proto[k]; if (!parts) continue; const arr = groups[k];
      parts.forEach((pt, pi) => { const im = new THREE.InstancedMesh(pt.geo, pt.mat, arr.length); arr.forEach((p, i) => { q.setFromAxisAngle(Y, p[4] || 0); const sc = p[5] || 1; s.set(sc, sc, sc); v.set(p[1], p[2], p[3]); m4.compose(v, q, s); im.setMatrixAt(i, m4);
          if (k === 'cuval' && pi === 1) im.setColorAt(i, this.spiceColors[(p[6] || 0) % 5]); if (k.startsWith('agac') && pi === 1) im.setColorAt(i, this.leafTints[i % 4]); });
        im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); out.add(im); }); }
    return out; }
}
