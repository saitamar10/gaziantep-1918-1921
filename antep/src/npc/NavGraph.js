// Yaya yol ağı: sokak segmentleri + ana akslar + kahraman sokak ekseninden düğüm/kenar grafiği.
// Her kenar çarpışma sistemiyle örneklenerek doğrulanır (bina içinden geçen kenar atılır). A* ile rota bulunur.
import { Poly, SpatialHash } from '../core/MapCoordinates.js';
import { AXES } from '../world/Streets.js';

export class NavGraph {
  constructor() { this.nodes = []; this.hash = new SpatialHash(20); }

  /** region: { x, z, r } — yalnız bu dairedeki sokaklar grafiğe girer */
  build(layout, collision, hero, region) {
    const inR = (p, pad = 0) => Math.hypot(p[0] - region.x, p[1] - region.z) < region.r + pad;
    // 1) ham çizgiler: [a, b, genişlik]
    const lines = [];
    for (const s of layout.segments) if (inR(s.a, 40) || inR(s.b, 40)) lines.push({ a: s.a, b: s.b, w: s.w });
    for (const ax of AXES) for (let i = 0; i < ax.pts.length - 1; i++) if (inR(ax.pts[i], 150) || inR(ax.pts[i + 1], 150)) lines.push({ a: ax.pts[i], b: ax.pts[i + 1], w: ax.w });
    // kahraman sokak ekseni (yerel z: +12 .. -112), 6 m aralıklı parçalar
    this.heroNodes = [];
    if (hero) { let prev = null; for (let z = 12; z >= -112; z -= 6) { const zc = Math.min(0, Math.max(-100, z)); const p = hero.w(hero.cx(zc), z); if (prev) lines.push({ a: prev, b: p, w: hero.wid(zc), hero: true }); prev = p; } }
    // 2) her çizgi üzerindeki kesim noktaları: uçlar + başka çizgilerle kesişimler + yakındaki uçların izdüşümleri (T kavşak)
    lines.forEach(l => { l.cuts = [0, 1]; l.len = Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]); });
    const lh = new SpatialHash(40); lines.forEach(l => lh.insert(l, Math.min(l.a[0], l.b[0]) - 10, Math.min(l.a[1], l.b[1]) - 10, Math.max(l.a[0], l.b[0]) + 10, Math.max(l.a[1], l.b[1]) + 10));
    for (const l of lines) { if (l.len < .5) continue;
      for (const end of [l.a, l.b]) for (const o of lh.query(end[0], end[1], 12)) { if (o === l || o.len < .5) continue; const [d, , , t] = Poly.distToSeg(end[0], end[1], o.a[0], o.a[1], o.b[0], o.b[1]); if (d < o.w / 2 + 3.5) { o.cuts.push(t); (l.links ||= []).push([end, [o.a[0] + (o.b[0] - o.a[0]) * t, o.a[1] + (o.b[1] - o.a[1]) * t], Math.min(l.w, o.w)]); } }
      for (const o of lh.query((l.a[0] + l.b[0]) / 2, (l.a[1] + l.b[1]) / 2, l.len / 2)) { if (o === l || o.len < .5 || o._done) continue; const t = segX(l, o); if (t) { l.cuts.push(t[0]); o.cuts.push(t[1]); } }
      l._done = true; }
    // 3) düğümler ve kenarlar
    const edge = (p, q, w) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < .05 || d > 90) return; if (!this.walkable(collision, p, q)) return; const a = this.node(p), b = this.node(q); if (a === b) return; if (!a.e.some(e => e.to === b)) { a.e.push({ to: b, d, w }); b.e.push({ to: a, d, w }); } };
    for (const l of lines) { if (l.len < .5) continue; const cs = [...new Set(l.cuts.map(t => +t.toFixed(4)))].sort((x, y) => x - y); const pt = t => [l.a[0] + (l.b[0] - l.a[0]) * t, l.a[1] + (l.b[1] - l.a[1]) * t];
      // uzun parçaları 14 m'de bir böl: rota daha esnek, engel yakınında kısmi kenarlar kalır
      for (let i = 0; i < cs.length - 1; i++) { const n = Math.max(1, Math.ceil((cs[i + 1] - cs[i]) * l.len / 14)); for (let k = 0; k < n; k++) edge(pt(cs[i] + (cs[i + 1] - cs[i]) * k / n), pt(cs[i] + (cs[i + 1] - cs[i]) * (k + 1) / n), l.w); }
      for (const [p, q, w] of l.links || []) edge(p, q, w); }
    // 4) kahraman sokak uçlarını ağa bağla + en büyük bağlı bileşeni tut
    if (hero) for (const z of [12, -112]) { const p = hero.w(hero.cx(Math.min(0, Math.max(-100, z))), z); const cand = this.nodes.filter(n => !n.hero).map(n => [Math.hypot(n.x - p[0], n.z - p[1]), n]).filter(c => c[0] < 45).sort((a, b) => a[0] - b[0]).slice(0, 8); for (const [, n] of cand) edge(p, [n.x, n.z], 3); }
    this.prune(); this.hash = new SpatialHash(20); this.nodes.forEach(n => this.hash.insert(n, n.x, n.z, n.x, n.z));
    return this;
  }
  node(p) { for (const n of this.hash.query(p[0], p[1], 1.2)) if (Math.hypot(n.x - p[0], n.z - p[1]) < 1.2) return n; const n = { id: this.nodes.length, x: p[0], z: p[1], e: [] }; this.nodes.push(n); this.hash.insert(n, n.x, n.z, n.x, n.z); return n; }
  walkable(col, p, q, r = .32) { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); const n = Math.max(1, Math.ceil(d / .9)); for (let i = 0; i <= n; i++) { const t = i / n; if (col.blocked(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, r)) return false; } return true; }
  prune() { const seen = new Set(); let best = []; for (const n of this.nodes) { if (seen.has(n)) continue; const comp = [], st = [n]; seen.add(n); while (st.length) { const c = st.pop(); comp.push(c); for (const e of c.e) if (!seen.has(e.to)) { seen.add(e.to); st.push(e.to); } } if (comp.length > best.length) best = comp; }
    const keep = new Set(best); this.nodes = best; this.nodes.forEach((n, i) => { n.id = i; n.e = n.e.filter(e => keep.has(e.to)); }); }
  nearest(x, z, maxR = 60) { let best = null, bd = 1e9; for (let r = 10; r <= maxR && !best; r += 15) for (const n of this.hash.query(x, z, r)) { const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = n; } } return best; }
  randomNode(R, x, z, rad) { const c = [...this.hash.query(x, z, rad)].filter(n => Math.hypot(n.x - x, n.z - z) < rad); return c.length ? c[Math.floor(R() * c.length)] : this.nodes[Math.floor(R() * this.nodes.length)]; }
  /** A*: düğüm listesi döner (bulunamazsa null) */
  path(a, b) { if (!a || !b) return null; if (a === b) return [a]; const g = new Map([[a, 0]]), from = new Map(), open = [[0, a]], closed = new Set(); const h = n => Math.hypot(n.x - b.x, n.z - b.z);
    while (open.length) { let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i; const [, cur] = open.splice(bi, 1)[0]; if (cur === b) { const out = [b]; let c = b; while (from.has(c)) { c = from.get(c); out.push(c); } return out.reverse(); }
      if (closed.has(cur)) continue; closed.add(cur);
      for (const e of cur.e) { if (closed.has(e.to)) continue; const ng = g.get(cur) + e.d * (e.w < 3 ? 1.25 : 1); if (ng < (g.get(e.to) ?? 1e9)) { g.set(e.to, ng); from.set(e.to, cur); open.push([ng + h(e.to), e.to]); } } }
    return null; }
  edgeWidth(a, b) { const e = a.e.find(e => e.to === b); return e ? e.w : 3; }
}
// iki doğru parçasının kesişimi -> [t1, t2] ya da null
function segX(l, o) { const x1 = l.a[0], y1 = l.a[1], x2 = l.b[0], y2 = l.b[1], x3 = o.a[0], y3 = o.a[1], x4 = o.b[0], y4 = o.b[1]; const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(den) < 1e-9) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den; return t > 0 && t < 1 && u > 0 && u < 1 ? [t, u] : null; }
