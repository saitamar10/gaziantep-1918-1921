// Coğrafi <-> yerel koordinat dönüşümü ve 2B geometri yardımcıları.
import { CONFIG } from '../config.js';

const R_LAT = 110950;                                   // m / derece enlem
const R_LON = 111320 * Math.cos(CONFIG.origin.lat * Math.PI / 180); // m / derece boylam

export const MapCoordinates = {
  /** enlem/boylam -> yerel (x doğu, z güney) metre */
  toLocal(lat, lon) { return { x: (lon - CONFIG.origin.lon) * R_LON, z: -(lat - CONFIG.origin.lat) * R_LAT }; },
  toGeo(x, z) { return { lat: CONFIG.origin.lat - z / R_LAT, lon: CONFIG.origin.lon + x / R_LON }; },
  format(x, z) { const g = this.toGeo(x, z); return `${g.lat.toFixed(5)}°K ${g.lon.toFixed(5)}°D  ·  x ${x.toFixed(0)} z ${z.toFixed(0)}`; }
};

/* ---------- rastgelelik & gürültü ---------- */
export function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function hash2(x, y, s = 0) { let h = (Math.floor(x) * 374761393 + Math.floor(y) * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function vnoise(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, o = 4, s = 0) { let f = 0, a = .5, q = 1; for (let i = 0; i < o; i++) { f += a * vnoise(x * q, y * q, s + i); q *= 2; a *= .5; } return f; }

/* ---------- çokgen yardımcıları (nokta: [x,z]) ---------- */
export const Poly = {
  area(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; },
  centroid(p) { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; },
  contains(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; },
  /** n·x <= d yarı düzlemine kırp */
  clip(p, nx, ny, d) { const out = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; const da = nx * a[0] + ny * a[1] - d, db = nx * b[0] + ny * b[1] - d;
      if (da <= 0) out.push(a); if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out; },
  /** en uzun kenar yönü ve genişlikler (yaklaşık OBB) */
  obb(p) { let best = 0, ang = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best) { best = L; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
    const c = Math.cos(ang), s = Math.sin(ang); let mnu = 1e9, mxu = -1e9, mnv = 1e9, mxv = -1e9; p.forEach(([x, y]) => { const u = x * c + y * s, v = -x * s + y * c; mnu = Math.min(mnu, u); mxu = Math.max(mxu, u); mnv = Math.min(mnv, v); mxv = Math.max(mxv, v); });
    return { ang, len: mxu - mnu, wid: mxv - mnv, c, s, mnu, mxu, mnv, mxv }; },
  /** içe öteleme (dışbükey çokgenler için; saat yönü bağımsız) */
  inset(p, d) { const ccw = this.area(p) > 0; let q = p; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L; if (!ccw) { nx = -nx; ny = -ny; }
      // (nx,ny) dışa dönük normal -> içe doğru d kadar kırp
      q = this.clip(q, nx, ny, nx * a[0] + ny * a[1] - d); if (q.length < 3) return null; } return q; },
  ensureCCW(p) { return this.area(p) > 0 ? p : p.slice().reverse(); },
  distToSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1))); const x = ax + dx * t, y = ay + dy * t; return [Math.hypot(px - x, py - y), x, y, t]; },
  distToPolyline(px, py, pts) { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const d = this.distToSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])[0]; if (d < best) best = d; } return best; }
};

/** Basit 2B uzamsal ızgara indeksi */
export class SpatialHash {
  constructor(cell = 24) { this.cell = cell; this.map = new Map(); }
  key(i, j) { return i * 73856093 ^ j * 19349663; }
  insert(item, minX, minZ, maxX, maxZ) { const c = this.cell; for (let i = Math.floor(minX / c); i <= Math.floor(maxX / c); i++) for (let j = Math.floor(minZ / c); j <= Math.floor(maxZ / c); j++) { const k = this.key(i, j); let a = this.map.get(k); if (!a) this.map.set(k, a = []); a.push(item); } }
  query(x, z, r = 0) { const c = this.cell, out = new Set(); for (let i = Math.floor((x - r) / c); i <= Math.floor((x + r) / c); i++) for (let j = Math.floor((z - r) / c); j <= Math.floor((z + r) / c); j++) { const a = this.map.get(this.key(i, j)); if (a) a.forEach(o => out.add(o)); } return out; }
}
