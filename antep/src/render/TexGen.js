// Prosedürel PBR doku üretimi (piksel düzeyinde).
// Çıktı: albedo (sRGB) + normal + ORM (R = AO, G = roughness, B = yükseklik/parallax).
// Kahraman sokakta her cephe ve her zemin parçası kendine özgü (tekrarsız) dokuya sahiptir.
import * as THREE from 'three';

/* ---------- hızlı gürültü ---------- */
export function makeNoise(seed = 1) {
  const p = new Uint8Array(512); const r = mulberry(seed); const a = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } for (let i = 0; i < 512; i++) p[i] = a[i & 255];
  const g = new Float32Array(256); for (let i = 0; i < 256; i++) g[i] = r();
  const n2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const X = xi & 255, Y = yi & 255; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const aa = g[p[p[X] + Y]], b = g[p[p[X + 1] + Y]], c = g[p[p[X] + Y + 1]], d = g[p[p[X + 1] + Y + 1]]; return aa + (b - aa) * u + (c - aa) * v + (aa - b - c + d) * u * v; };
  const fbm = (x, y, o = 4) => { let f = 0, am = .5, q = 1; for (let i = 0; i < o; i++) { f += am * n2(x * q + i * 17.3, y * q - i * 9.1); q *= 2.03; am *= .5; } return f / (1 - Math.pow(.5, o)); };
  return { n2, fbm, r };
}
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** Piksel tamponu: renk (lineer değil, 0..1 sRGB), yükseklik, pürüzlülük, AO ön değeri */
export class PBRCanvas {
  constructor(w, h) { this.w = w; this.h = h; const n = w * h; this.r = new Float32Array(n); this.g = new Float32Array(n); this.b = new Float32Array(n); this.H = new Float32Array(n); this.R = new Float32Array(n).fill(.85); this.A = new Float32Array(n).fill(1); }
  idx(x, y) { return y * this.w + x; }
  /** yükseklikten normal + boşluk (cavity) AO; dokular */
  finish({ normalStrength = 3, ao = .8, wrap = false, anisotropy = 8 } = {}) {
    const { w, h, H } = this; const nrm = new Uint8Array(w * h * 4), alb = new Uint8Array(w * h * 4), orm = new Uint8Array(w * h * 4);
    // bulanık yükseklik (boşluk AO için)
    const blur = boxBlur(H, w, h, Math.max(2, Math.round(Math.min(w, h) / 90)));
    const at = (x, y) => { if (wrap) { x = (x + w) % w; y = (y + h) % h; } else { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y)); } return H[y * w + x]; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x;
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      // canvas y aşağı -> doku v yukarı (flipY): normal y'yi ters çevir
      let nx = -dx * normalStrength, ny = dy * normalStrength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      nrm[i * 4] = (nx * .5 + .5) * 255; nrm[i * 4 + 1] = (ny * .5 + .5) * 255; nrm[i * 4 + 2] = (nz * .5 + .5) * 255; nrm[i * 4 + 3] = 255;
      const cav = Math.max(0, Math.min(1, 1 - (blur[i] - H[i]) * 4.5 * ao)); const occ = Math.max(.25, Math.min(1, cav * this.A[i]));
      alb[i * 4] = clamp255(this.r[i] * 255); alb[i * 4 + 1] = clamp255(this.g[i] * 255); alb[i * 4 + 2] = clamp255(this.b[i] * 255); alb[i * 4 + 3] = 255;
      orm[i * 4] = occ * 255; orm[i * 4 + 1] = clamp255(this.R[i] * 255); orm[i * 4 + 2] = clamp255(H[i] * 255); orm[i * 4 + 3] = 255; }
    const T = (data, srgb) => { const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat); t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = anisotropy; t.needsUpdate = true; return t; };
    return { map: T(alb, true), normalMap: T(nrm, false), orm: T(orm, false), w, h };
  }
}
const clamp255 = v => v < 0 ? 0 : v > 255 ? 255 : v;
function boxBlur(src, w, h, r) { const tmp = new Float32Array(w * h), out = new Float32Array(w * h); const k = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += src[y * w + Math.max(0, Math.min(w - 1, x))]; for (let x = 0; x < w; x++) { tmp[y * w + x] = s / k; s += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.max(0, Math.min(h - 1, y)) * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = s / k; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } } return out; }

/* ======================================================================
   CEPHE DUVARCILIĞI — Antep kesme kalker taşı, moloz taş, ablak (siyah bazalt) bantlar
   Koordinatlar metre; (0,0) = cephenin sol alt köşesi. Doku: u = x/L, v = y/H (v yukarı)
   ====================================================================== */
const LIME = [[.86, .74, .52], [.82, .70, .50], [.90, .80, .60], [.78, .66, .46], [.84, .76, .58], [.80, .72, .56], [.88, .78, .62]];
const BASALT = [[.34, .33, .31], [.38, .36, .34], [.30, .30, .29], [.41, .39, .36]];
export function facadeTexture(spec) {
  const { L, H, ppm = 96, seed = 1, style = 'ashlar', ablakFrom = 99, ablakTo = -1, rubbleBelow = 0, openings = [], tint = [1, 1, 1], plaster = 0, damp = 1, streakSources = [] } = spec;
  const W = Math.min(1536, Math.round(L * ppm)), Hh = Math.min(768, Math.round(H * ppm)); const sx = W / L, sy = Hh / H;
  const P = new PBRCanvas(W, Hh); const N = makeNoise(seed); const R = N.r;
  // 1) taş blok düzeni
  const blocks = []; // {x0,y0,x1,y1,col,rough,kind}
  let y = 0; let row = 0;
  while (y < H) { const ch = .34 + R() * .22; const y1 = Math.min(H, y + ch); const isAb = y >= ablakFrom && y < ablakTo && row % 2 === 0; const rubble = y < rubbleBelow;
    if (!rubble) { let x = -R() * .7; while (x < L) { const bl = isAb ? .5 + R() * .6 : .5 + R() * .9; const pal = isAb ? BASALT : LIME; const c = pal[Math.floor(R() * pal.length)]; const v = .94 + R() * .1;
        blocks.push({ x0: x, y0: y, x1: x + bl, y1, c: [c[0] * v * tint[0], c[1] * v * tint[1], c[2] * v * tint[2]], kind: isAb ? 'b' : 'a', dome: .005 + R() * .015, tool: R() }); x += bl; } }
    y = y1; row++; }
  // açıklık söveleri (dikey sıra taşlar) ve lentolar — doğrulanmış Antep işçiliği tipine uygun "dişli söve"
  for (const o of openings) { const jw = .26; let yy = o.y0; let k = 0; while (yy < o.y1) { const hh = .3 + R() * .12; const long = k % 2 === 0; const c = LIME[2];
      for (const side of [-1, 1]) { const x0 = side < 0 ? o.x0 - (long ? jw * 1.6 : jw) : o.x1, x1 = side < 0 ? o.x0 : o.x1 + (long ? jw * 1.6 : jw); blocks.push({ x0, y0: yy, x1, y1: Math.min(o.y1, yy + hh), c: [c[0] * 1.03, c[1] * 1.03, c[2] * 1.02], kind: 'j', dome: .015, tool: .2, over: 1 }); }
      yy += hh; k++; }
    if (!o.arch) blocks.push({ x0: o.x0 - .32, y0: o.y1, x1: o.x1 + .32, y1: o.y1 + .36, c: LIME[2], kind: 'j', dome: .02, tool: .3, over: 1 });
    if (o.sill) blocks.push({ x0: o.x0 - .12, y0: o.y0 - .14, x1: o.x1 + .12, y1: o.y0, c: LIME[6], kind: 'j', dome: .01, tool: .1, over: 1 }); }
  // 2) moloz taş (Voronoi) alt kat
  const rub = []; if (rubbleBelow > 0) { for (let yy = 0; yy < rubbleBelow + .3; yy += .24) for (let xx = -.2; xx < L + .3; xx += .3) rub.push([xx + (R() - .5) * .22, yy + (R() - .5) * .16, LIME[Math.floor(R() * LIME.length)], .85 + R() * .25]); }
  const rubGrid = new Map(); const rk = (i, j) => i * 10007 + j; rub.forEach((s, i) => { const gi = Math.floor(s[0] / .4), gj = Math.floor(s[1] / .4); const k = rk(gi, gj); if (!rubGrid.has(k)) rubGrid.set(k, []); rubGrid.get(k).push(i); });
  // raster: blok başına piksel boyama
  P.H.fill(.42); for (let i = 0; i < P.r.length; i++) { P.r[i] = .80; P.g[i] = .74; P.b[i] = .62; P.R[i] = .95; } // açık renkli ince harç
  const paint = (b) => { const px0 = Math.max(0, Math.floor(b.x0 * sx)), px1 = Math.min(W - 1, Math.ceil(b.x1 * sx)), py0 = Math.max(0, Math.floor(b.y0 * sy)), py1 = Math.min(Hh - 1, Math.ceil(b.y1 * sy)); const joint = Math.max(.9, (b.kind === 'j' ? .45 : .6) * ppm / 100);
    const bw = (b.x1 - b.x0) * sx, bh = (b.y1 - b.y0) * sy; const chip = R() * 6.28;
    for (let py = py0; py <= py1; py++) for (let px = px0; px <= px1; px++) { const lx = px - b.x0 * sx, ly = py - b.y0 * sy; const e = Math.min(lx, bw - lx, ly, bh - ly); // kenara uzaklık (px)
        const en = e + (N.n2(px * .09, py * .09) - .5) * 1.4; if (en < joint) continue; const i = (Hh - 1 - py) * W + px;
        const edge = Math.min(1, (en - joint) / (1.6 * ppm / 100)); const nx = lx / bw - .5, ny = ly / bh - .5;
        const tool = N.fbm(px * .25 + b.tool * 50, py * .6, 3); const grain = N.n2(px * .9, py * .9); const pv = N.n2(px * .45 + 300 + b.tool * 70, py * .45); const pit = pv > .9 ? -.16 * (pv - .9) * 10 : 0;
        const big = N.fbm(px * .012 + b.tool * 9, py * .012, 3);
        P.H[i] = .55 + .12 * edge + b.dome * (1 - (nx * nx + ny * ny) * 2.5) * 6 + (tool - .5) * .05 + (grain - .5) * .03 + pit;
        const v = .9 + big * .16 + (grain - .5) * .05 + pit * 2.2; const [cr, cg, cb] = b.c; P.r[i] = cr * v; P.g[i] = cg * v; P.b[i] = cb * v;
        P.R[i] = (b.kind === 'b' ? .7 : .82) + (grain - .5) * .1; } };
  blocks.filter(b => !b.over).forEach(paint); blocks.filter(b => b.over).forEach(paint);
  if (rub.length) { const ry = Math.ceil(rubbleBelow * sy); for (let py = 0; py < ry && py < Hh; py++) for (let px = 0; px < W; px++) { const x = px / sx, yy = py / sy; const gi = Math.floor(x / .4), gj = Math.floor(yy / .4); let d1 = 9, d2 = 9, best = -1;
      for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const lst = rubGrid.get(rk(gi + a, gj + c)); if (!lst) continue; for (const k of lst) { const s = rub[k]; const d = Math.hypot((x - s[0]) * 1.0, (yy - s[1]) * 1.25); if (d < d1) { d2 = d1; d1 = d; best = k; } else if (d < d2) d2 = d; } }
      const i = (Hh - 1 - py) * W + px; const gap = d2 - d1; const fade = yy > rubbleBelow - .05 ? 0 : 1; if (!fade) continue;
      if (gap < .035 + N.n2(px * .2, py * .2) * .02) { P.H[i] = .2 + gap * 3; P.r[i] = .74; P.g[i] = .68; P.b[i] = .58; P.R[i] = .97; continue; }
      const s = rub[best]; const g2 = Math.min(1, (gap - .035) / .06); const tool = N.fbm(px * .3, py * .3, 3); P.H[i] = .45 + .35 * Math.sqrt(g2) + (tool - .5) * .14; const v = s[3] * (.85 + tool * .3); P.r[i] = s[2][0] * v; P.g[i] = s[2][1] * v; P.b[i] = s[2][2] * v; P.R[i] = .88; } }
  // 3) kireç sıva kalıntıları
  for (let k = 0; k < 4 * plaster * (L * H / 40); k++) { const cx = R() * L, cy = R() * H, rr = .25 + R() * .7; const px0 = Math.floor((cx - rr) * sx), px1 = Math.ceil((cx + rr) * sx), py0 = Math.floor((cy - rr) * sy), py1 = Math.ceil((cy + rr) * sy);
    for (let py = Math.max(0, py0); py < Math.min(Hh, py1); py++) for (let px = Math.max(0, px0); px < Math.min(W, px1); px++) { const d = Math.hypot(px / sx - cx, (py / sy - cy) * 1.3) / rr + (N.fbm(px * .05, py * .05, 4) - .5) * .9; if (d > 1) continue; const i = (Hh - 1 - py) * W + px;
      P.H[i] = Math.max(P.H[i], .78 + N.n2(px * .4, py * .4) * .04); const t = .92 + N.n2(px * .1, py * .1) * .08; P.r[i] = .88 * t; P.g[i] = .81 * t; P.b[i] = .67 * t; P.R[i] = .92; } }
  // 4) aşınma katmanları: yükselen nem, tuz çiçeklenmesi, yağmur izleri, saçak altı kirlenme, çatlaklar
  for (let py = 0; py < Hh; py++) { const yy = py / sy; for (let px = 0; px < W; px++) { const i = (Hh - 1 - py) * W + px; const x = px / sx; const n = N.fbm(px * .02, py * .02, 4);
      const dampH = (.55 + n * .7) * damp; if (yy < dampH) { const t = 1 - yy / dampH; const k = 1 - .38 * t; P.r[i] *= k * .97; P.g[i] *= k; P.b[i] *= k * .92; P.R[i] = Math.max(.55, P.R[i] - .18 * t); P.A[i] *= 1 - .25 * t * t; }
      if (yy > dampH && yy < dampH + .4 && N.n2(px * .3, py * .3) > .82) { P.r[i] = P.r[i] * .6 + .36; P.g[i] = P.g[i] * .6 + .35; P.b[i] = P.b[i] * .6 + .33; }
      if (yy > H - .9) { const t = (yy - (H - .9)) / .9; P.r[i] *= 1 - .22 * t; P.g[i] *= 1 - .22 * t; P.b[i] *= 1 - .2 * t; P.A[i] *= 1 - .3 * t; }
      // genel yaşlanma lekeleri
      const st = N.fbm(px * .006 + 7, py * .004, 4); if (st > .62) { const k = 1 - (st - .62) * .9; P.r[i] *= k; P.g[i] *= k * .99; P.b[i] *= k * .95; } } }
  const streaks = [...streakSources, ...openings.filter(o => o.sill).map(o => ({ x0: o.x0, x1: o.x1, y: o.y0 - .14, len: 1.2 + R() * 1.5, k: .22 })), ...openings.filter(o => o.grille).map(o => ({ x0: o.x0 + .1, x1: o.x1 - .1, y: o.y0, len: .9, k: .3, rust: 1 }))];
  for (const s of streaks) for (let px = Math.floor(s.x0 * sx); px < Math.min(W, s.x1 * sx); px++) { const col = N.n2(px * .15, 3); if (col < .35) continue; const len = s.len * (.5 + col); for (let py = Math.floor((s.y - len) * sy); py < s.y * sy; py++) { if (py < 0 || px < 0) continue; const i = (Hh - 1 - py) * W + px; const t = (py / sy - (s.y - len)) / len; const k = 1 - s.k * t * (col - .3);
      if (s.rust) { P.r[i] = P.r[i] * k + .05 * (1 - k) * 4; P.g[i] *= k; P.b[i] *= k * .85; } else { P.r[i] *= k; P.g[i] *= k; P.b[i] *= k * .97; } P.R[i] = Math.max(.6, P.R[i] - .1 * t); } }
  for (let c = 0; c < Math.round(L * H / 40); c++) { let x = R() * L, yy = R() * H * .8 + .3; const steps = 40 + R() * 60; for (let s = 0; s < steps; s++) { x += (R() - .5) * .03; yy -= .006 + R() * .006; const px = Math.round(x * sx), py = Math.round(yy * sy); if (px < 0 || px >= W || py < 0 || py >= Hh) continue; const i = (Hh - 1 - py) * W + px; P.H[i] -= .12; P.r[i] *= .78; P.g[i] *= .78; P.b[i] *= .78; } }
  // renk tonu ve son
  return P.finish({ normalStrength: 1.7 * ppm / 96, ao: .45 });
}

/* ======================================================================
   SOKAK DÖŞEMESİ — düzensiz kesme taş, ortada bazalt ark (oluk), aşınma, toz, nem
   W: genişlik (m, x), Lz: uzunluk (m, z). Doku u = x/W, v = z/Lz.
   ====================================================================== */
export function pavingTexture(spec) {
  const { W, Lz, ppm = 64, seed = 3, gutterX = null, wallDist = null, tile = false, cobble = false } = spec; const w = Math.round(W * ppm), h = Math.round(Lz * ppm);
  const P = new PBRCanvas(w, h); const N = makeNoise(seed); const R = N.r;
  // taş merkezleri: enine sıralar, değişken boy
  const pts = []; let z = -.3; while (z < Lz + .4) { const rh = cobble ? .15 + R() * .07 : .28 + R() * .26; let x = -.3 - R() * .3; while (x < W + .4) { const sw = cobble ? .17 + R() * .13 : .3 + R() * .55; const inG = gutterX !== null && Math.abs(x + sw / 2 - gutterX(z)) < .35;
      const f = .82 + R() * .26, warm = (R() - .5) * .04; const c = inG ? BASALT[Math.floor(R() * 4)].map(v => v * 1.5) : [(.70 + warm) * f, .64 * f, (.53 - warm) * f]; pts.push([x + sw / 2 + (R() - .5) * .08, z + rh / 2 + (R() - .5) * .06, c, R(), sw, rh, inG]); x += sw; } z += rh; }
  if (tile) { const base = pts.filter(p => p[0] >= 0 && p[0] < W && p[1] >= 0 && p[1] < Lz); pts.length = 0; for (const p of base) for (const ox of [-W, 0, W]) for (const oz of [-Lz, 0, Lz]) pts.push([p[0] + ox, p[1] + oz, p[2], p[3], p[4], p[5], p[6]]); }
  const grid = new Map(); const gk = (i, j) => i * 10007 + j; pts.forEach((p, i) => { const k = gk(Math.floor(p[0] / .5), Math.floor(p[1] / .5)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) { const x = px / ppm, zz = py / ppm; const gi = Math.floor(x / .5), gj = Math.floor(zz / .5); let d1 = 9, d2 = 9, b = -1;
    for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const l = grid.get(gk(gi + a, gj + c)); if (!l) continue; for (const k of l) { const p = pts[k]; const dx = (x - p[0]) / p[4], dz = (zz - p[1]) / p[5]; const d = cobble ? Math.hypot(dx, dz) * .8 + Math.max(Math.abs(dx), Math.abs(dz)) * .2 : Math.max(Math.abs(dx), Math.abs(dz)) * .7 + Math.hypot(dx, dz) * .3; if (d < d1) { d2 = d1; d1 = d; b = k; } else if (d < d2) d2 = d; } }
    const i = (h - 1 - py) * w + px; const p = pts[b]; const gap = d2 - d1 + (N.n2(px * .12, py * .12) - .5) * .05;
    const wd = wallDist ? wallDist(x, zz) : 9; const dust = Math.max(0, 1 - wd / 1.1) * (.6 + N.fbm(px * .03, py * .03, 3) * .6);
    const wear = Math.exp(-Math.pow((x - W / 2) / (W * .28), 2)); // orta hat cilalı
    if (gap < .055) { const t = gap / .055; P.H[i] = .15 + t * .2; const dirt = N.fbm(px * .08, py * .08, 3); P.r[i] = .42 + dirt * .12; P.g[i] = .36 + dirt * .1; P.b[i] = .27 + dirt * .08; P.R[i] = .97;
      if (N.n2(px * .6, py * .6) > .9 && wd > 1) { P.g[i] += .1; P.r[i] -= .05; } continue; }
    const g2 = Math.min(1, (gap - .055) / .09); const tool = N.fbm(px * .18 + p[3] * 40, py * .18, 4); const grain = N.n2(px * .8, py * .8);
    P.H[i] = .45 + (cobble ? .5 : .4) * Math.sqrt(g2) * (1 - wear * .3) + (tool - .5) * .12 * (1 - wear * .6) + (grain - .5) * .02 - (N.n2(px * .4 + 99, py * .4) > .9 ? .08 : 0);
    const v = .8 + tool * .35 + wear * .08; const [cr, cg, cb] = p[2]; P.r[i] = cr * v; P.g[i] = cg * v; P.b[i] = cb * v; P.R[i] = .9 - wear * .12 + (grain - .5) * .06 - (p[6] ? .08 : 0);
    // toz birikimi duvar diplerinde
    if (dust > 0) { const k = Math.min(1, dust); P.r[i] = P.r[i] * (1 - k * .6) + .55 * k * .6; P.g[i] = P.g[i] * (1 - k * .6) + .47 * k * .6; P.b[i] = P.b[i] * (1 - k * .6) + .36 * k * .6; P.R[i] = Math.min(1, P.R[i] + .15 * k); P.H[i] = Math.max(P.H[i], .3 + k * .3); }
    // ark çevresi nem
    if (gutterX) { const dg = Math.abs(x - gutterX(zz)); if (dg < .7) { const k = (1 - dg / .7) * (.4 + N.fbm(px * .02, py * .02, 3) * .6); P.r[i] *= 1 - .3 * k; P.g[i] *= 1 - .3 * k; P.b[i] *= 1 - .28 * k; P.R[i] = Math.max(.3, P.R[i] - .35 * k); } }
    // çatlak
    if (N.n2(px * .05 + p[3] * 100, py * .05) > .7 && Math.abs(N.n2(px * .3, py * .3) - .5) < .02) { P.H[i] -= .2; P.r[i] *= .55; P.g[i] *= .55; P.b[i] *= .55; } }
  return P.finish({ normalStrength: 3.2, ao: 1.2, wrap: tile });
}

/* ---------- tekrar eden (döşenebilir) küçük dokular: söve/kemer taşı, bazalt, ahşap, kiremit, iç sıva ---------- */
export function tileStone(seed = 5, dark = false, size = 512) { const P = new PBRCanvas(size, size); const N = makeNoise(seed);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = y * size + x; const t = N.fbm(x * .03, y * .03, 4), g = N.n2(x * .6, y * .6), tool = N.fbm(x * .2, y * .7, 3); const c = dark ? [.36, .35, .33] : [.84, .73, .53]; const v = .85 + t * .25 + (g - .5) * .05;
    P.r[i] = c[0] * v; P.g[i] = c[1] * v; P.b[i] = c[2] * v; P.H[i] = .5 + (tool - .5) * .15 + (g - .5) * .04 - (N.n2(x * .4 + 50, y * .4) > .87 ? .08 : 0); P.R[i] = dark ? .68 : .84; }
  return P.finish({ normalStrength: 2.2, wrap: true }); }
export function tileWood(seed = 7, size = 512, paint = null) { const P = new PBRCanvas(size, size); const N = makeNoise(seed); const R = N.r; const planks = 5; const pw = size / planks; const base = [.50, .38, .27];
  const ptone = []; for (let k = 0; k < planks; k++) ptone.push(.75 + R() * .4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = y * size + x; const k = Math.floor(x / pw); const lx = x - k * pw; const ring = Math.sin((lx * .35 + N.fbm(x * .02, y * .004 + k, 3) * 12) * 1.7) * .5 + .5; const g = N.n2(x * .9, y * .05);
    const gap = lx < 2 || lx > pw - 2; let v = ptone[k] * (.82 + ring * .18 + (g - .5) * .12); let c = base;
    if (paint) { const pp = N.fbm(x * .015 + 5, y * .015, 4); if (pp > .42) { c = paint; v = .9 + (g - .5) * .1; } }
    P.r[i] = c[0] * v; P.g[i] = c[1] * v; P.b[i] = c[2] * v; P.H[i] = gap ? .15 : .55 + ring * .05 + (g - .5) * .08; P.R[i] = paint && c === paint ? .62 : .8; if (gap) { P.r[i] *= .4; P.g[i] *= .4; P.b[i] *= .4; } }
  // çiviler / demir kuşak
  for (const yy of [size * .12, size * .5, size * .88]) for (let x = 0; x < size; x++) for (let t = -5; t <= 5; t++) { const i = Math.round(yy + t) * size + x; P.r[i] = .16; P.g[i] = .14; P.b[i] = .12; P.H[i] = .8; P.R[i] = .5; }
  return P.finish({ normalStrength: 2.5, wrap: true }); }
export function tileRoof(seed = 9, size = 512) { const P = new PBRCanvas(size, size); const N = makeNoise(seed); const R = N.r; const cols = 6, rows = 7; const cw = size / cols, rh = size / rows;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = y * size + x; const row = Math.floor(y / rh); const off = (row % 2) * cw / 2; const col = Math.floor((x + off) / cw); const lx = ((x + off) % cw) / cw, ly = (y % rh) / rh;
    const prof = Math.sin(lx * Math.PI); const tone = N.n2(col * 3.1, row * 2.7); const lich = N.fbm(x * .03, y * .03, 4) > .66; const v = .7 + tone * .4;
    P.r[i] = (.62 * v) * (lich ? .7 : 1) + (lich ? .1 : 0); P.g[i] = (.30 * v) * (lich ? 1.2 : 1); P.b[i] = .2 * v; P.H[i] = .3 + prof * .5 - ly * .12; P.R[i] = .78; if (ly > .9) { P.H[i] *= .5; P.r[i] *= .5; P.g[i] *= .5; P.b[i] *= .5; } }
  return P.finish({ normalStrength: 3.5, wrap: true }); }
export function tilePlaster(seed = 11, size = 256, col = [.86, .80, .68]) { const P = new PBRCanvas(size, size); const N = makeNoise(seed); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = y * size + x; const t = N.fbm(x * .04, y * .04, 4); P.r[i] = col[0] * (.85 + t * .2); P.g[i] = col[1] * (.85 + t * .2); P.b[i] = col[2] * (.85 + t * .2); P.H[i] = .5 + (t - .5) * .1; P.R[i] = .92; } return P.finish({ normalStrength: 1.2, wrap: true }); }
export function latticeTex(size = 256) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.strokeStyle = '#5b3d24'; g.lineWidth = size / 34; for (let i = -size; i < size * 2; i += size / 9) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + size, size); g.stroke(); g.beginPath(); g.moveTo(i + size, 0); g.lineTo(i, size); g.stroke(); } g.lineWidth = size / 14; g.strokeRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
