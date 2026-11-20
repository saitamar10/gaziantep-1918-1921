// 2B çarpışma: çokgen ayak izleri + daireler (sütun, ağaç gövdesi, burç).
import { SpatialHash, Poly } from '../core/MapCoordinates.js';

export class Collision {
  constructor() { this.hash = new SpatialHash(16); this.count = 0; }
  addPoly(poly) { const xs = poly.map(p => p[0]), zs = poly.map(p => p[1]); this.hash.insert({ t: 'p', poly }, Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)); this.count++; }
  addCircle(x, z, r) { this.hash.insert({ t: 'c', x, z, r }, x - r, z - r, x + r, z + r); this.count++; }
  /** konumu engellerden dışarı iter; [x,z] döner */
  resolve(x, z, r) {
    for (let iter = 0; iter < 3; iter++) { let moved = false;
      for (const o of this.hash.query(x, z, r + 1)) { if (o.off) continue;
        if (o.t === 'c') { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), m = o.r + r; if (d < m && d > 1e-6) { x = o.x + dx / d * m; z = o.z + dz / d * m; moved = true; } continue; }
        const p = o.poly; const inside = Poly.contains(p, x, z); let best = 1e9, bx = 0, bz = 0;
        for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; const [d, cx, cz] = Poly.distToSeg(x, z, a[0], a[1], b[0], b[1]); if (d < best) { best = d; bx = cx; bz = cz; } }
        if (inside) { const dx = bx - x, dz = bz - z, d = Math.hypot(dx, dz) || 1; x = bx + dx / d * r; z = bz + dz / d * r; moved = true; }
        else if (best < r) { const dx = x - bx, dz = z - bz, d = best || 1; x = bx + dx / d * r; z = bz + dz / d * r; moved = true; }
      }
      if (!moved) break; }
    return [x, z];
  }
  /** iki nokta arasındaki görüşü bir yapı/duvar çokgeni kesiyor mu (daireler — ağaç, barikat taşı — görüşü kesmez) */
  losBlocked(ax, az, bx, bz) { const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / .7)); for (let i = 1; i < n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; for (const o of this.hash.query(x, z, 0)) if (o.t === 'p' && !o.off && Poly.contains(o.poly, x, z)) return true; } return false; }
  /** açılıp kapanabilen daire engeli; dönen nesnenin .off alanı true yapılırsa engel yok sayılır */
  addToggle(x, z, r) { const o = { t: 'c', x, z, r, off: true }; this.hash.insert(o, x - r, z - r, x + r, z + r); return o; }
  blocked(x, z, r = .1) { for (const o of this.hash.query(x, z, r + 1)) { if (o.off) continue; if (o.t === 'c') { if (Math.hypot(x - o.x, z - o.z) < o.r + r) return true; } else if (Poly.contains(o.poly, x, z)) return true; } return false; }
}
