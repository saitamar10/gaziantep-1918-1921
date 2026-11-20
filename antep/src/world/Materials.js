// Prosedürel PBR doku ve malzeme sistemi.
// Her doku üç kanal üretir: albedo (sRGB), normal (yükseklikten Sobel), roughness.
// Gerçek tarama dokuları geldiğinde aynı anahtarlarla değiştirilebilir (Materials.replace).
import * as THREE from 'three';
import { rng } from '../core/MapCoordinates.js';
import { pavingTexture } from '../render/TexGen.js';

function cv(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }

function heightToNormal(hc, strength = 2.5) {
  const n = hc.width, src = hc.getContext('2d').getImageData(0, 0, n, n).data;
  const out = cv(n), og = out.getContext('2d'), od = og.createImageData(n, n), d = od.data;
  const H = (x, y) => src[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1));
    const dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1));
    let nx = -dx * strength, ny = dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * n + x) * 4; d[i] = (nx * .5 + .5) * 255; d[i + 1] = (ny * .5 + .5) * 255; d[i + 2] = (nz * .5 + .5) * 255; d[i + 3] = 255;
  }
  og.putImageData(od, 0, 0); return out;
}
function noiseLayer(g, n, alpha, scale, seed, col = [0, 0, 0]) { // ince taneli gürültü
  const r = rng(seed), id = g.getImageData(0, 0, n, n), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = (r() - .5) * alpha * 255; d[i] = Math.max(0, Math.min(255, d[i] + v)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v)); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v)); }
  g.putImageData(id, 0, 0);
}
function blotches(g, n, count, rmin, rmax, colorFn, seed) { const r = rng(seed); for (let i = 0; i < count; i++) { const x = r() * n, y = r() * n, rad = rmin + r() * (rmax - rmin);
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); const c = colorFn(r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); } }

/** Bir dokuyu üç kanala boyar; painter(cg, hg, rg, n, r) */
function makeSet(n, painter, { normal = 2.5, rep = true, seed = 1 } = {}) {
  const c = cv(n), h = cv(n), ro = cv(n); const cg = c.getContext('2d'), hg = h.getContext('2d'), rg = ro.getContext('2d');
  hg.fillStyle = '#808080'; hg.fillRect(0, 0, n, n); rg.fillStyle = '#e0e0e0'; rg.fillRect(0, 0, n, n);
  painter(cg, hg, rg, n, rng(seed));
  const nm = heightToNormal(h, normal);
  const T = (canvas, srgb) => { const t = new THREE.CanvasTexture(canvas); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.generateMipmaps = true; return t; };
  return { map: T(c, true), normalMap: T(nm, false), roughnessMap: T(ro, false), canvas: c };
}

/* ======================= DOKU TARİFLERİ ======================= */
// Antep kesme kalker taşı: 1 doku = 3 m × 3 m
function ashlar(dark = false, seed = 3) {
  return makeSet(1024, (cg, hg, rg, n, r) => {
    const rows = 8; const base = dark ? [58, 56, 54] : [214, 194, 152];
    cg.fillStyle = dark ? '#3a3735' : '#bfae8a'; cg.fillRect(0, 0, n, n);             // harç
    hg.fillStyle = '#2a2a2a'; hg.fillRect(0, 0, n, n);
    let y = 0; for (let row = 0; row < rows; row++) {
      const rh = n / rows; let x = -r() * 120;
      while (x < n) { const bw = 120 + r() * 170; const v = (r() - .5) * (dark ? 18 : 34); const warm = (r() - .5) * 14;
        const col = `rgb(${base[0] + v + warm | 0},${base[1] + v | 0},${base[2] + v - warm | 0})`;
        const gx = 3, gy = 3; // derz
        for (const off of [0, n]) { if (x + bw - off < 0) continue;
          cg.fillStyle = col; cg.fillRect(x - off + gx, y + gy, bw - gx * 2, rh - gy * 2);
          // kenar pahları (yükseklik)
          const hv = 150 + r() * 50; const grd = hg.createLinearGradient(0, y, 0, y + rh); grd.addColorStop(0, '#606060'); grd.addColorStop(.08, `rgb(${hv},${hv},${hv})`); grd.addColorStop(.92, `rgb(${hv},${hv},${hv})`); grd.addColorStop(1, '#505050');
          hg.fillStyle = grd; hg.fillRect(x - off + gx, y + gy, bw - gx * 2, rh - gy * 2);
          // murç izleri (ince yatay çizgiler)
          for (let k = 0; k < 26; k++) { const yy = y + gy + r() * (rh - gy * 2); hg.fillStyle = `rgba(0,0,0,${.05 + r() * .08})`; hg.fillRect(x - off + gx + 4, yy, bw - 14, 1); }
          // köşe kırıkları
          if (r() < .35) { cg.fillStyle = dark ? 'rgba(20,20,20,.5)' : 'rgba(150,130,95,.55)'; const cx = x - off + (r() < .5 ? gx : bw - gx - 14), cy = y + (r() < .5 ? gy : rh - gy - 12); cg.beginPath(); cg.ellipse(cx + 7, cy + 6, 8 + r() * 10, 5 + r() * 6, r() * 3, 0, 7); cg.fill(); hg.fillStyle = '#3a3a3a'; hg.beginPath(); hg.ellipse(cx + 7, cy + 6, 7 + r() * 8, 4 + r() * 5, r() * 3, 0, 7); hg.fill(); }
          // pürüzlülük: blok başına
          rg.fillStyle = `rgb(${200 + r() * 40 | 0},${200 | 0},200)`; rg.fillRect(x - off, y, bw, rh);
        }
        x += bw; }
      y += rh; }
    // aşınma: koyu yağmur izleri, yosun/liken lekeleri, çatlaklar
    if (!dark) { for (let i = 0; i < 26; i++) { const x = r() * n, w = 6 + r() * 30; const grd = cg.createLinearGradient(0, 0, 0, n * (0.3 + r() * .7)); grd.addColorStop(0, `rgba(80,65,45,${.12 + r() * .12})`); grd.addColorStop(1, 'rgba(80,65,45,0)'); cg.fillStyle = grd; cg.fillRect(x, 0, w, n); }
      blotches(cg, n, 60, 6, 40, r => `rgba(${90 + r() * 30},${85 + r() * 20},${55},${.12 + r() * .15})`, 7);
      blotches(cg, n, 30, 10, 60, r => `rgba(255,245,220,${.08 + r() * .1})`, 8); }
    cg.strokeStyle = dark ? 'rgba(0,0,0,.6)' : 'rgba(70,55,35,.55)'; hg.strokeStyle = '#202020';
    for (let i = 0; i < 18; i++) { let x = r() * n, y = r() * n; cg.lineWidth = hg.lineWidth = 1 + r() * 1.2; cg.beginPath(); hg.beginPath(); cg.moveTo(x, y); hg.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 40; y += r() * 30; cg.lineTo(x, y); hg.lineTo(x, y); } cg.stroke(); hg.stroke(); }
    noiseLayer(cg, n, .07, 1, 11); noiseLayer(hg, n, .18, 1, 12);
  }, { normal: 3.2, seed });
}
// Arnavut kaldırımı: 1 doku = 4 m
function cobble() {
  return makeSet(1024, (cg, hg, rg, n, r) => {
    cg.fillStyle = '#8a7a60'; cg.fillRect(0, 0, n, n); hg.fillStyle = '#202020'; hg.fillRect(0, 0, n, n); rg.fillStyle = '#f0f0f0'; rg.fillRect(0, 0, n, n);
    const cell = 46; for (let gy = -1; gy < n / cell + 1; gy++) for (let gx = -1; gx < n / cell + 1; gx++) {
      const cx = gx * cell + cell / 2 + (r() - .5) * 14 + (gy % 2) * cell * .4, cy = gy * cell + cell / 2 + (r() - .5) * 12; const rx = cell * .44 + r() * 6, ry = cell * .4 + r() * 6, rot = r() * 3;
      const v = 125 + r() * 70, w = (r() - .5) * 20;
      for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { const X = cx + ox, Y = cy + oy; if (X < -cell || X > n + cell || Y < -cell || Y > n + cell) continue;
        cg.fillStyle = `rgb(${v + w | 0},${v - 6 | 0},${v - 22 - w | 0})`; cg.beginPath(); cg.ellipse(X, Y, rx, ry, rot, 0, 7); cg.fill();
        const gr = hg.createRadialGradient(X - rx * .2, Y - ry * .2, 1, X, Y, Math.max(rx, ry)); gr.addColorStop(0, '#f0f0f0'); gr.addColorStop(.7, '#a0a0a0'); gr.addColorStop(1, '#303030'); hg.fillStyle = gr; hg.beginPath(); hg.ellipse(X, Y, rx, ry, rot, 0, 7); hg.fill();
        rg.fillStyle = `rgb(${150 + r() * 60 | 0},0,0)`; rg.beginPath(); rg.ellipse(X, Y, rx * .8, ry * .8, rot, 0, 7); rg.fill();
        // cilalanmış üst yüzey parlaklığı
        cg.fillStyle = 'rgba(255,250,235,.08)'; cg.beginPath(); cg.ellipse(X - rx * .15, Y - ry * .2, rx * .5, ry * .4, rot, 0, 7); cg.fill(); } }
    blotches(cg, n, 30, 20, 90, r => `rgba(60,45,30,${.05 + r() * .08})`, 21);
    noiseLayer(cg, n, .06, 1, 22); noiseLayer(hg, n, .1, 1, 23);
  }, { normal: 4.0, seed: 5 });
}
function dirt() { return makeSet(512, (cg, hg, rg, n, r) => { cg.fillStyle = '#9a8158'; cg.fillRect(0, 0, n, n);
  blotches(cg, n, 120, 8, 60, r => `rgba(${100 + r() * 60},${80 + r() * 40},${50 + r() * 30},.35)`, 31);
  for (let i = 0; i < 1600; i++) { const x = r() * n, y = r() * n, s = 1 + r() * 3; const v = 120 + r() * 90; cg.fillStyle = `rgb(${v},${v - 15},${v - 40})`; cg.fillRect(x, y, s, s); hg.fillStyle = '#e0e0e0'; hg.fillRect(x, y, s, s); }
  noiseLayer(cg, n, .08, 1, 32); noiseLayer(hg, n, .3, 1, 33); }, { normal: 2.2, seed: 7 }); }
function grass() { return makeSet(512, (cg, hg, rg, n, r) => { cg.fillStyle = '#7c7c43'; cg.fillRect(0, 0, n, n);
  blotches(cg, n, 90, 10, 70, r => `rgba(${90 + r() * 50},${100 + r() * 40},${40 + r() * 20},.4)`, 41);
  for (let i = 0; i < 9000; i++) { const x = r() * n, y = r() * n, h = 3 + r() * 7; const g = 90 + r() * 70; cg.strokeStyle = `rgba(${g * .8},${g},${g * .4},.6)`; cg.lineWidth = 1; cg.beginPath(); cg.moveTo(x, y); cg.lineTo(x + (r() - .5) * 3, y - h); cg.stroke(); hg.strokeStyle = 'rgba(255,255,255,.3)'; hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x, y - h); hg.stroke(); }
  // kuru Mayıs otları
  for (let i = 0; i < 2500; i++) { const x = r() * n, y = r() * n; cg.fillStyle = `rgba(200,180,110,.5)`; cg.fillRect(x, y, 1, 4); } }, { normal: 1.5, seed: 9 }); }
function field() { return makeSet(512, (cg, hg, rg, n, r) => { cg.fillStyle = '#8a7a48'; cg.fillRect(0, 0, n, n);
  for (let y = 0; y < n; y += 16) { const grd = hg.createLinearGradient(0, y, 0, y + 16); grd.addColorStop(0, '#404040'); grd.addColorStop(.5, '#d0d0d0'); grd.addColorStop(1, '#404040'); hg.fillStyle = grd; hg.fillRect(0, y, n, 16);
    for (let x = 0; x < n; x += 3) { const g = 110 + r() * 60; cg.fillStyle = `rgba(${g * .85},${g},${g * .35},.75)`; cg.fillRect(x, y + 5 + r() * 4, 2, 3 + r() * 3); } }
  noiseLayer(cg, n, .08, 1, 51); }, { normal: 2, seed: 11 }); }
function woodPlanks() { return makeSet(512, (cg, hg, rg, n, r) => { const pw = n / 6;
  for (let i = 0; i < 6; i++) { const h = 22 + r() * 6, s = 30 + r() * 12, l = 20 + r() * 9; cg.fillStyle = `hsl(${h},${s}%,${l}%)`; cg.fillRect(i * pw, 0, pw, n);
    for (let k = 0; k < 70; k++) { cg.strokeStyle = `rgba(20,10,0,${.08 + r() * .15})`; cg.lineWidth = 1 + r() * 2; cg.beginPath(); const x = i * pw + r() * pw; cg.moveTo(x, 0); cg.bezierCurveTo(x + (r() - .5) * 10, n * .3, x + (r() - .5) * 10, n * .6, x + (r() - .5) * 8, n); cg.stroke(); }
    hg.fillStyle = '#c0c0c0'; hg.fillRect(i * pw + 2, 0, pw - 4, n); hg.fillStyle = '#202020'; hg.fillRect(i * pw, 0, 2, n);
    cg.fillStyle = 'rgba(0,0,0,.45)'; cg.fillRect(i * pw, 0, 2, n); }
  // demir kuşaklar ve çiviler
  for (const y of [n * .14, n * .5, n * .86]) { cg.fillStyle = '#2a2622'; cg.fillRect(0, y - 6, n, 12); hg.fillStyle = '#f0f0f0'; hg.fillRect(0, y - 6, n, 12); rg.fillStyle = '#707070'; rg.fillRect(0, y - 6, n, 12);
    for (let x = 12; x < n; x += 28) { cg.fillStyle = '#1a1714'; cg.beginPath(); cg.arc(x, y, 4, 0, 7); cg.fill(); hg.fillStyle = '#ffffff'; hg.beginPath(); hg.arc(x, y, 4, 0, 7); hg.fill(); } }
  blotches(cg, n, 30, 10, 60, r => `rgba(180,160,120,${.06 + r() * .08})`, 61); noiseLayer(cg, n, .05, 1, 62); }, { normal: 2.5, seed: 13 }); }
function woodGrain() { return makeSet(256, (cg, hg, rg, n, r) => { cg.fillStyle = '#5a3d24'; cg.fillRect(0, 0, n, n);
  for (let k = 0; k < 120; k++) { cg.strokeStyle = `rgba(${20 + r() * 40},${10 + r() * 20},0,${.15 + r() * .2})`; cg.lineWidth = 1 + r() * 2; const y = r() * n; cg.beginPath(); cg.moveTo(0, y); cg.bezierCurveTo(n * .3, y + (r() - .5) * 8, n * .6, y + (r() - .5) * 8, n, y); cg.stroke(); hg.strokeStyle = 'rgba(0,0,0,.2)'; hg.beginPath(); hg.moveTo(0, y); hg.lineTo(n, y); hg.stroke(); }
  noiseLayer(cg, n, .06, 1, 71); }, { normal: 1.8, seed: 15 }); }
function roofTiles() { return makeSet(512, (cg, hg, rg, n, r) => { cg.fillStyle = '#5d2f1d'; cg.fillRect(0, 0, n, n); hg.fillStyle = '#202020'; hg.fillRect(0, 0, n, n);
  const cw = n / 8, ch = n / 10; for (let row = 0; row < 11; row++) for (let c = 0; c < 9; c++) { const x = c * cw + (row % 2) * cw / 2, y = row * ch; const h = 12 + r() * 10, l = 30 + r() * 14;
    cg.fillStyle = `hsl(${h},${45 + r() * 15}%,${l}%)`; cg.beginPath(); cg.ellipse(x, y + ch * .6, cw * .48, ch * .75, 0, 0, Math.PI); cg.fill();
    const gr = hg.createLinearGradient(x - cw / 2, 0, x + cw / 2, 0); gr.addColorStop(0, '#404040'); gr.addColorStop(.5, '#f0f0f0'); gr.addColorStop(1, '#404040'); hg.fillStyle = gr; hg.beginPath(); hg.ellipse(x, y + ch * .6, cw * .48, ch * .75, 0, 0, Math.PI); hg.fill();
    if (r() < .25) { cg.fillStyle = 'rgba(70,80,40,.35)'; cg.beginPath(); cg.arc(x + (r() - .5) * 20, y + ch * .8, 6 + r() * 8, 0, 7); cg.fill(); } }
  noiseLayer(cg, n, .07, 1, 81); }, { normal: 3, seed: 17 }); }
function flatRoof() { return makeSet(512, (cg, hg, rg, n, r) => { cg.fillStyle = '#b9a47e'; cg.fillRect(0, 0, n, n);
  blotches(cg, n, 80, 10, 80, r => `rgba(${120 + r() * 60},${100 + r() * 50},${70 + r() * 30},.3)`, 91); for (let i = 0; i < 40; i++) { cg.strokeStyle = 'rgba(90,70,45,.35)'; cg.beginPath(); let x = r() * n, y = r() * n; cg.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - .5) * 50; y += (r() - .5) * 50; cg.lineTo(x, y); } cg.stroke(); }
  noiseLayer(cg, n, .1, 1, 92); noiseLayer(hg, n, .25, 1, 93); }, { normal: 1.6, seed: 19 }); }
function fabric(c1, c2, stripes = 10) { return makeSet(256, (cg, hg, rg, n, r) => { const w = n / stripes; for (let i = 0; i < stripes; i++) { cg.fillStyle = i % 2 ? c1 : c2; cg.fillRect(i * w, 0, w, n); }
  for (let y = 0; y < n; y += 2) { cg.fillStyle = 'rgba(0,0,0,.05)'; cg.fillRect(0, y, n, 1); } blotches(cg, n, 25, 10, 50, r => `rgba(60,40,20,${.1 + r() * .15})`, 101); noiseLayer(cg, n, .08, 1, 102); noiseLayer(hg, n, .3, 1, 103); }, { normal: 1.2, seed: 21 }); }
function leaves() { const n = 512, c = cv(n), g = c.getContext('2d'); const r = rng(111);
  for (let i = 0; i < 900; i++) { const x = r() * n, y = r() * n, s = 7 + r() * 9, a = r() * 6.28; const l = 18 + r() * 22; g.fillStyle = `hsl(${78 + r() * 30},${35 + r() * 25}%,${l}%)`; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, s, s * .45, 0, 0, 7); g.fill(); g.fillStyle = `rgba(255,255,220,${.06 + r() * .1})`; g.beginPath(); g.ellipse(-s * .2, -s * .1, s * .5, s * .15, 0, 0, 7); g.fill(); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function kafes() { const n = 256, c = cv(n), g = c.getContext('2d'); g.clearRect(0, 0, n, n); g.strokeStyle = '#6b4a2c'; g.lineWidth = 7; for (let i = -n; i < n * 2; i += 26) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + n, n); g.stroke(); g.beginPath(); g.moveTo(i + n, 0); g.lineTo(i, n); g.stroke(); } g.lineWidth = 18; g.strokeRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

/* ======================= DIŞ DOKULAR (/textures) ======================= */
// Prosedürel dokunun bir karosunun kapladığı gerçek genişlik (m). Dış doku 'size' metre kaplıyorsa tekrar = NOMINAL / size.
export const NOMINAL = { stone: 3, stone2: 3, basalt: 3, cobble: 4, dirt: 6, grass: 5, field: 9, planks: 1, wood: 1, tiles: 2, flat: 3 };
function flatTex(r, g, b) { const c = cv(2), x = c.getContext('2d'); x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, 2, 2); return c; }

/* ======================= MALZEMELER ======================= */
export class Materials {
  constructor(renderer) { this.renderer = renderer; this.m = {}; this.tex = {}; this.hooks = []; this.size = { ...NOMINAL }; this.external = []; }
  /**
   * textures/manifest.json'daki setleri yükler ve prosedürel dokuların İÇERİĞİNİ yerinde değiştirir (aynı doku nesnesi:
   * bina malzemeleri ve arazi shader'ı kendiliğinden yenisini kullanır). Dosya yoksa/bozuksa o set prosedürel kalır; oyun çökmez.
   * Set klasörü: color.jpg (zorunlu, sRGB) · normal.jpg (OpenGL, +Y) · roughness.jpg · ao.jpg (isteğe bağlı)
   */
  async loadExternal(base = './textures/') {
    let man; try { const r = await fetch(base + 'manifest.json', { cache: 'no-store' }); if (!r.ok) return this.external; man = await r.json(); } catch (e) { return this.external; }
    const loader = new THREE.TextureLoader(), maxA = this.renderer.capabilities.getMaxAnisotropy(); const load = url => new Promise(res => loader.load(url, t => res(t.image), undefined, () => res(null)));
    for (const [key, e] of Object.entries(man.sets || {})) { const T = this.tex[key]; if (!T || !e || e.enabled === false) continue; const dir = base + (e.dir || key) + '/';
      try { const color = await load(dir + (e.color || 'color.jpg')); if (!color) continue;   // renk dokusu yok: set yok say
        const [normal, rough, ao] = await Promise.all([load(dir + (e.normal || 'normal.jpg')), load(dir + (e.roughness || 'roughness.jpg')), e.ao === false ? null : load(dir + (e.ao || 'ao.jpg'))]);
        const size = +e.size > 0 ? +e.size : NOMINAL[key] || 1, rep = (NOMINAL[key] || 1) / size; this.size[key] = size;
        const put = (t, img, srgb) => { if (!t) return; t.image = img; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = maxA; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; };
        put(T.map, color, true); put(T.normalMap, normal || flatTex(128, 128, 255), false); put(T.roughnessMap, rough || flatTex(217, 217, 217), false);   // eksik kanal: düz yedek (eski desen yeni renkle çakışmasın)
        if (ao) { const at = new THREE.Texture(ao); put(at, ao, false); T.aoMap = at; }
        this.external.push({ key, size, normal: !!normal, roughness: !!rough, ao: !!ao });
      } catch (err) { console.warn('Doku seti yüklenemedi:', key, err); } }
    return this.external;
  }
  /** build() sonrası: AO dokusu gelen setleri kullanan malzemelere aoMap bağla */
  applyExternal() { for (const x of this.external) { const T = this.tex[x.key]; if (!T.aoMap) continue; for (const m of Object.values(this.m)) if (m.map === T.map) { m.aoMap = T.aoMap; m.aoMapIntensity = 1; m.needsUpdate = true; } } }
  /** onBeforeCompile zincirleme (CSM + özel yamalar birlikte çalışsın) */
  patch(mat, fn) { (mat.userData.patches = mat.userData.patches || []).push(fn); mat.onBeforeCompile = (s) => mat.userData.patches.forEach(f => f(s)); mat.customProgramCacheKey = () => mat.uuid; }
  /** CSM gibi başka bir onBeforeCompile kurulduktan sonra yamaları yeniden zincirle */
  rechain(mat) { if (!mat.userData.patches) return; const base = mat.onBeforeCompile; mat.onBeforeCompile = (s, r) => { base.call(mat, s, r); mat.userData.patches.forEach(f => f(s)); }; mat.needsUpdate = true; }
  build(progress = () => { }) {
    const steps = [
      ['stone', () => ashlar(false, 3)], ['stone2', () => ashlar(false, 29)], ['basalt', () => ashlar(true, 4)], ['cobble', () => { const t = pavingTexture({ W: 4, Lz: 4, ppm: 128, seed: 41, tile: true }); return { map: t.map, normalMap: t.normalMap, roughnessMap: t.orm }; }], ['dirt', dirt], ['grass', grass], ['field', field],
      ['planks', woodPlanks], ['wood', woodGrain], ['tiles', roofTiles], ['flat', flatRoof], ['fabR', () => fabric('#8e2a1e', '#d9ccb0')], ['fabG', () => fabric('#3d5b3d', '#d9ccb0', 8)], ['fabB', () => fabric('#a8743f', '#5a3a22', 14)]];
    steps.forEach(([k, f], i) => { this.tex[k] = f(); progress((i + 1) / (steps.length + 2)); });
    this.tex.leaves = leaves(); this.tex.kafes = kafes();
    const S = (k, o = {}) => new THREE.MeshStandardMaterial({ map: this.tex[k].map, normalMap: this.tex[k].normalMap, roughnessMap: this.tex[k].roughnessMap, roughness: 1, metalness: 0, ...o });
    const ns = (o) => { const m = S(o.k, o.opts); if (o.ns) m.normalScale.set(o.ns, o.ns); return m; };
    this.m.stone = ns({ k: 'stone', opts: { vertexColors: true }, ns: 1.1 });
    this.m.stone2 = ns({ k: 'stone2', opts: { vertexColors: true }, ns: 1.1 });
    this.m.basalt = ns({ k: 'basalt', opts: { vertexColors: true }, ns: 1 });
    this.m.planks = S('planks', { vertexColors: true });
    this.m.wood = S('wood', { vertexColors: true });
    this.m.tiles = S('tiles', { vertexColors: true, side: THREE.DoubleSide });
    this.m.flat = S('flat', { vertexColors: true });
    this.m.fabR = S('fabR', { side: THREE.DoubleSide }); this.m.fabG = S('fabG', { side: THREE.DoubleSide }); this.m.fabB = S('fabB', { side: THREE.DoubleSide });
    this.m.iron = new THREE.MeshStandardMaterial({ color: '#26231f', roughness: .55, metalness: .7 });
    this.m.glass = new THREE.MeshStandardMaterial({ color: '#1d2228', roughness: .12, metalness: .0, envMapIntensity: 1.2 });
    this.m.dark = new THREE.MeshStandardMaterial({ color: '#191410', roughness: 1 });
    this.m.copper = new THREE.MeshStandardMaterial({ color: '#b26a3a', roughness: .35, metalness: .9 });
    this.m.lead = new THREE.MeshStandardMaterial({ color: '#7f858a', roughness: .5, metalness: .55 });
    this.m.sack = new THREE.MeshStandardMaterial({ color: '#cbb995', roughness: 1, map: this.tex.flat.map });
    this.m.kafes = new THREE.MeshStandardMaterial({ map: this.tex.kafes, alphaTest: .5, side: THREE.DoubleSide, roughness: .9 });
    this.m.leaves = new THREE.MeshStandardMaterial({ map: this.tex.leaves, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, vertexColors: true });
    this.m.bark = S('wood', { color: '#8a7a68' });
    this.m.water = new THREE.MeshStandardMaterial({ color: '#4f6f72', roughness: .08, metalness: .1, normalMap: this.tex.dirt.normalMap, transparent: true, opacity: .92 });
    this.m.water.normalScale.set(.35, .35);
    this.m.spice = new THREE.MeshStandardMaterial({ roughness: 1 });
    this.m.pot = new THREE.MeshStandardMaterial({ color: '#a8603a', roughness: .9, map: this.tex.dirt.map });
    for (const m of Object.values(this.m)) m.envMapIntensity = .6;
    this.applyExternal();
    progress(1);
    return this;
  }
  all() { return Object.values(this.m); }
}
