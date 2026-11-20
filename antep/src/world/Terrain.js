// Arazi: yükseklik alanı, karışım (splat) malzemesi, Alleben Deresi suyu, ufuk.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { fbm, Poly } from '../core/MapCoordinates.js';

// --- Tasarım varsayımı geometrileri (bkz. GLOBAL_ASSUMPTIONS) ---
export const RIVER = [[-2100, 200], [-1500, 172], [-1000, 150], [-620, 138], [-380, 112], [-260, 40], [-170, -60], [-110, -148], [0, -168], [130, -158], [300, -120], [520, -130], [800, -160], [1400, -120]];
// Kale höyüğü (20 Kasım 2026, bkz. godot/docs/kale-kaynaklar.md). Önceki ölçüler (Aşama 4, kullanıcının verdiği: taban 177 x 145 m,
// üst düzlük 114 x 98 m) kuzey-güneyde OSM sur çizgisinden ~33 m kısaydı. Yeni: taban 180 x 198 m, sur hattı ~117 x 129 m (OSM),
// yükseklik 35 m (Yamaç 2023), hendek ~27–30 m geniş, 10 m derin (Kültür Portalı; 1950'lerde dolduruldu, 1918'de vardı).
// Doğu yarıçapı 95 m yerine 90 m: merkez Kültür Envanteri noktasında kaldığı için tarihî Zeytin Han hendeğin içine düşmesin.
export const CASTLE = { rx: 90, rz: 99, topK: .65, height: 35, moatIn: 1.0, moatOut: 1.3, moatDepth: 10 };
// Giriş yolu (OLASI/TAHMİN): batıda sokaktan köprü başına (iki kule, 1557), hendeği aşan eğimli köprü, alt kapı (savunma galerisinde),
// güneybatı yamacı boyunca üst kapıya. RAMP_KEY: köprü başı ve alt kapının RAMP içindeki sırası.
export const RAMP = [[-150, 50.7], [-126, 14], [-116.6, 11.2], [-89.7, 8.6], [-84.2, 16.3], [-70.1, 44.6], [-48.6, 63.7], [-26, 70.7], [-11.1, 69.2], [-5.1, 64.1], [0, 49.5]];
export const RAMP_KEY = { barbican: 2, gate: 3, top: 9 };
const RAMP_CUM = (() => { const c = [0]; for (let i = 0; i < RAMP.length - 1; i++) c.push(c[i] + Math.hypot(RAMP[i + 1][0] - RAMP[i][0], RAMP[i + 1][1] - RAMP[i][1])); return c; })();
const RAMP_LEN = RAMP_CUM[RAMP_CUM.length - 1];
const BRIDGE_RISE = 4;   // köprü, köprü başından alt kapıya 4 m yükselir (1890 fotoğrafında eğimli) — ölçü TAHMİN
/** rampa üzerindeki yol boyu (m) -> zeminden yükseklik */
export function rampHeight(s) { const sB = RAMP_CUM[RAMP_KEY.barbican], sG = RAMP_CUM[RAMP_KEY.gate], sT = RAMP_CUM[RAMP_KEY.top];
  if (s <= sB) return 0; if (s <= sG) return BRIDGE_RISE * (s - sB) / (sG - sB);
  const t = Math.min(1, (s - sG) / (sT - sG)); return BRIDGE_RISE + (CASTLE.height - BRIDGE_RISE) * (.25 * t + .75 * sm(t)); }
// Sarımsak Tepe (Bölüm 2). KONUM VARSAYIM: gerçek yeri harita kaynağıyla doğrulanmadı; şehrin kuzeydoğusunda, derenin ötesinde temsilî bir tepe.
export const SARIMSAK = { x: 780, z: -450, h: 17, s: 60 };
// AŞAMA 5 — kırsal arazi. HEPSİ VARSAYIM: şehir dışının gerçek topoğrafyası işlenmedi; tepeler, kuru dere yatakları ve taş ocağı
// şehrin dışındaki boş düzlüğü kırmak için temsilî olarak yerleştirildi. [x, z, yükseklik, yayılım]
export const HILLS = [[-1900, 700, 22, 180], [-600, -560, 14, 110], [250, -600, 18, 120], [1250, -520, 20, 110], [-1300, -450, 16, 140], [1300, 1150, 12, 120], [-1950, -150, 15, 100]];
export const GULLIES = [[[-1300, -330], [-1250, -150], [-1180, 20], [-1100, 150]], [[250, -480], [330, -380], [420, -280], [520, -135]]];
export const QUARRY = [250, -505, 30];   // taş ocağı: tepenin güney yamacına açılmış kesik
export function gullyDist(x, z) { let d = 1e9; for (const g of GULLIES) d = Math.min(d, Poly.distToPolyline(x, z, g)); return d; }
const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

// Rampa üzerindeki ilerleme (0..1). Köşelerin iç tarafında bir nokta iki parçaya da izdüşer; yalnız "en yakın parça" alınırsa
// ilerleme (ve yükseklik) orada sıçrar -> yarım metrelik basamak oluşur ve rampaya çıkılamaz. Bu yüzden yakın parçalar
// mesafeye göre harmanlanır: yükseklik süreklidir.
function rampInfo(x, z) { let best = 1e9, acc = 0; const c = []; for (let i = 0; i < RAMP.length - 1; i++) { const [ax, az] = RAMP[i], [bx, bz] = RAMP[i + 1]; const L = Math.hypot(bx - ax, bz - az); const [d, , , t] = Poly.distToSeg(x, z, ax, az, bx, bz); c.push(d, acc + t * L); if (d < best) best = d; acc += L; }
  let sw = 0, at = 0; for (let i = 0; i < c.length; i += 2) { const w = Math.max(0, 1 - (c[i] - best) / 2.5); if (w > 0) { sw += w * w; at += w * w * c[i + 1]; } } return [best, at / sw]; }   // [uzaklık, yol boyu m]
export function rampS(x, z) { return rampInfo(x, z)[1]; }
export const RAMP_S = RAMP_CUM;

export function baseHeight(x, z) {
  let h = 0.0045 * z;                                                     // güneye doğru hafif yükselme
  const dw = Math.hypot(x + 880, z - 720); h += 16 * Math.exp(-(dw * dw) / (2 * 300 * 300)); // Hayik tepesi / Tepebaşı — varsayım
  const ds = Math.hypot(x + 1600, z - 1250); h += 14 * Math.exp(-(ds * ds) / (2 * 320 * 320)); // güneybatı sırtı (kolej) — varsayım
  { const dt = Math.hypot(x - SARIMSAK.x, z - SARIMSAK.z); h += SARIMSAK.h * Math.exp(-(dt * dt) / (2 * SARIMSAK.s * SARIMSAK.s)); }
  h += (fbm(x / 180, z / 180, 4, 3) - .5) * 4;
  { let hh = 0; for (const [hx, hz, ha, hs] of HILLS) { const d2 = (x - hx) * (x - hx) + (z - hz) * (z - hz); if (d2 < 12 * hs * hs) hh += ha * Math.exp(-d2 / (2 * hs * hs)); }
    if (hh > .05) { hh *= .82 + .36 * fbm(x / 55, z / 55, 3, 31); const dq = Math.hypot(x - QUARRY[0], z - QUARRY[1]); if (dq < QUARRY[2] + 8) hh *= sm((dq - QUARRY[2]) / 8); h += hh; }
    if (x < -1000 || z < -100) { const gd = gullyDist(x, z); if (gd < 16) h -= 2.4 * (1 - sm(gd / 16)); } }
  // dere vadisi
  const dr = Poly.distToPolyline(x, z, RIVER); h -= 7.5 * (1 - sm(dr / 90)); if (dr < 7) h -= 1.6 * (1 - dr / 7);
  return h;
}
export function moundFactor(x, z) { return Math.hypot(x / CASTLE.rx, z / CASTLE.rz); }
export function heightAt(x, z) {
  let h = baseHeight(x, z);
  const k = moundFactor(x, z);
  const base = baseHeight(0, 0) * 0 + h;
  if (k < 1.0) { const t = k < CASTLE.topK ? 1 : 1 - sm((k - CASTLE.topK) / (1 - CASTLE.topK)); h = base + CASTLE.height * t + (k < CASTLE.topK ? (fbm(x / 20, z / 20, 2, 9) - .5) * .8 : 0);
    if (k >= CASTLE.topK) { const tt = (k - CASTLE.topK) / (1 - CASTLE.topK); h += (fbm(x / 15, z / 15, 3, 21) - .5) * 3.4 * Math.sin(Math.PI * tt); } }   // yamaç engebesi: kaya sekileri
  else if (k < CASTLE.moatOut) { const t = (k - 1) / (CASTLE.moatOut - 1); h -= CASTLE.moatDepth * sm(Math.min(t, 1 - t) / .3); }   // hendek: düz tabanlı, şev kenarlı
  // rampa. Köprü kesiminde araziye dokunulmaz (hendek açık kalır); yürüme yüzeyi köprü döşemesidir (Landmarks.bridgeDecks).
  const [d, s] = rampInfo(x, z);
  if (d < 7 && !(s > RAMP_CUM[RAMP_KEY.barbican] + 2 && s < RAMP_CUM[RAMP_KEY.gate] - 1)) { const rh = baseHeight(x, z) + rampHeight(s); const w = d < 3.2 ? 1 : 1 - sm((d - 3.2) / 3.8); h = h * (1 - w) + rh * w; }
  return h;
}
export function isRamp(x, z) { return rampInfo(x, z)[0] < 3.2; }
export function riverDist(x, z) { return Poly.distToPolyline(x, z, RIVER); }

export class Terrain {
  constructor(materials, layout) { this.mats = materials; this.layout = layout; this.group = new THREE.Group(); this.group.name = 'Terrain'; }
  build() {
    const { minX, maxX, minZ, maxZ } = CONFIG.bounds, st = CONFIG.terrainStep;
    const nx = Math.round((maxX - minX) / st) + 1, nz = Math.round((maxZ - minZ) / st) + 1;
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), spl = new Float32Array(nx * nz * 4);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = minX + i * st, z = minZ + j * st, k = j * nx + i;
      pos[k * 3] = x; pos[k * 3 + 1] = heightAt(x, z); pos[k * 3 + 2] = z; uv[k * 2] = x; uv[k * 2 + 1] = z;
      const w = this.splat(x, z); spl.set(w, k * 4);
    }
    const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let p = 0;
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[p++] = a; idx[p++] = c; idx[p++] = b; idx[p++] = b; idx[p++] = c; idx[p++] = d; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('splat', new THREE.BufferAttribute(spl, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    // Tek parça arazi her karede bütünüyle çiziliyordu. Karolara bölünce kamera dışındaki karolar çizilmez (frustum culling).
    const mat = this.material(); const TILE = 48; let first = true;
    for (let tj = 0; tj < nz - 1; tj += TILE) for (let ti = 0; ti < nx - 1; ti += TILE) { const i1 = Math.min(nx - 1, ti + TILE), j1 = Math.min(nz - 1, tj + TILE); const ix = new Uint32Array((i1 - ti) * (j1 - tj) * 6); let q = 0, y0 = 1e9, y1 = -1e9;
      for (let j = tj; j < j1; j++) for (let i = ti; i < i1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; ix[q++] = a; ix[q++] = c; ix[q++] = b; ix[q++] = b; ix[q++] = c; ix[q++] = d; const h = pos[a * 3 + 1]; if (h < y0) y0 = h; if (h > y1) y1 = h; }
      const tg = new THREE.BufferGeometry(); for (const k of ['position', 'uv', 'splat', 'normal']) tg.setAttribute(k, g.attributes[k]); tg.setIndex(new THREE.BufferAttribute(ix, 1));
      const xa = minX + ti * st, xb = minX + i1 * st, za = minZ + tj * st, zb = minZ + j1 * st; tg.boundingSphere = new THREE.Sphere(new THREE.Vector3((xa + xb) / 2, (y0 + y1) / 2, (za + zb) / 2), Math.hypot(xb - xa, y1 - y0 + 4, zb - za) / 2);
      tg.boundingBox = new THREE.Box3(new THREE.Vector3(xa, y0 - 2, za), new THREE.Vector3(xb, y1 + 2, zb));
      const mesh = new THREE.Mesh(tg, mat); mesh.receiveShadow = true; mesh.name = first ? 'TerrainMesh' : 'TerrainTile'; first = false; this.group.add(mesh); }
    this.water(); this.horizon();
    return this.group;
  }
  splat(x, z) {
    const L = this.layout; const urb = L.urbanWeight(x, z); const road = L.roadWeight(x, z); const n = fbm(x / 60, z / 60, 3, 5);
    let cob = urb * (n > .32 ? 1 : .55), dirt = Math.max(road, urb * (1 - cob)), grass = 0, field = 0;
    const k = moundFactor(x, z); if (k < 1.18) { cob = isRamp(x, z) ? 1 : 0; dirt = k < CASTLE.topK ? .8 : .45; grass = 1 - dirt - cob; }
    if (urb < .5 && k >= 1.18) { const rd = riverDist(x, z); const f = fbm(x / 140, z / 140, 3, 8); if (rd < 120 || (f > .52 && z < 200)) { field = rd < 120 ? .25 : .9; grass = 1 - field; } else { grass = .75 + n * .2; dirt += .25; } }
    if (urb < .5 && k >= 1.18) { const gd = gullyDist(x, z), dq = Math.hypot(x - QUARRY[0], z - QUARRY[1]); if (gd < 9 || dq < QUARRY[2] + 4) { dirt = 1; grass = 0; field = 0; cob = 0; } }
    const s = cob + dirt + grass + field || 1; return [cob / s, dirt / s, grass / s, field / s];
  }
  material() {
    const T = this.mats.tex; const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0, envMapIntensity: .3 });
    mat.userData.uniforms = { tCob: { value: T.cobble.map }, tCobN: { value: T.cobble.normalMap }, tDirt: { value: T.dirt.map }, tDirtN: { value: T.dirt.normalMap }, tGrass: { value: T.grass.map }, tField: { value: T.field.map }, sCob: { value: this.mats.size.cobble }, sDirt: { value: this.mats.size.dirt }, sGrass: { value: this.mats.size.grass }, sField: { value: this.mats.size.field } };
    this.mats.patch(mat, (s) => {
      Object.assign(s.uniforms, mat.userData.uniforms);
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 splat; varying vec4 vSplat; varying vec2 vWorldXZ;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvSplat = splat; vWorldXZ = uv;');
      s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tCob, tCobN, tDirt, tDirtN, tGrass, tField; uniform float sCob, sDirt, sGrass, sField; varying vec4 vSplat; varying vec2 vWorldXZ;
vec3 sRGB2lin(vec3 c){ return pow(c, vec3(2.2)); }`)
        .replace('#include <map_fragment>', `
  vec2 wuv = vWorldXZ;
  vec3 cC = texture2D(tCob, wuv/sCob).rgb * mix(0.9, 1.1, texture2D(tDirt, wuv/31.0).r);
  vec3 cD = texture2D(tDirt, wuv/sDirt).rgb * mix(0.85, 1.1, texture2D(tDirt, wuv/53.0).r);
  vec3 cG = texture2D(tGrass, wuv/sGrass).rgb * mix(0.8, 1.15, texture2D(tGrass, wuv/71.0).g);
  vec3 cF = texture2D(tField, wuv/sField).rgb;
  vec4 w = vSplat;
  // kaldırım taşı aralarına toprak sızıntısı (kenar yumuşatma)
  float nn = texture2D(tDirt, wuv/17.0).r; w.x = smoothstep(0.25, 0.75, w.x + (nn-0.5)*0.5); w.y += (1.0 - w.x) * vSplat.x;
  w /= max(1e-3, w.x+w.y+w.z+w.w);
  diffuseColor.rgb *= cC*w.x + cD*w.y + cG*w.z + cF*w.w;`)
        .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness * mix(1.0, 0.93, w.x);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec3 nC = texture2D(tCobN, wuv/sCob).xyz*2.0-1.0; vec3 nD = texture2D(tDirtN, wuv/sDirt).xyz*2.0-1.0; vec3 tn = nC*w.x*0.8 + nD*(w.y+w.z+w.w)*0.6;
    vec3 wn = normalize(vec3(tn.x, 0.0, -tn.y)); normal = normalize(normal + (viewMatrix * vec4(wn*length(tn.xy), 0.0)).xyz); }`);
    });
    this.material_ = mat; return mat;
  }
  water() { // Alleben Deresi şeridi
    const pts = RIVER, w = 6.5, pos = [], uv = [], idx = []; let acc = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)]; let dx = q[0] - o[0], dz = q[1] - o[1]; const L = Math.hypot(dx, dz); dx /= L; dz /= L;
      const steps = i < pts.length - 1 ? Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 10) : 1;
      for (let s = 0; s < steps; s++) { const t = s / steps; const x = p[0] + (q[0] - p[0]) * t, z = p[1] + (q[1] - p[1]) * t; const y = baseHeight(x, z) + 1.0;
        pos.push(x - dz * w, y, z + dx * w, x + dz * w, y, z - dx * w); uv.push(0, acc / 8, 1, acc / 8); acc += Math.hypot(q[0] - p[0], q[1] - p[1]) / steps; } }
    const n = pos.length / 6; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, this.mats.m.water); m.name = 'Alleben'; m.receiveShadow = true; this.group.add(m); this.waterMesh = m;
  }
  horizon() {
    const m = new THREE.MeshStandardMaterial({ color: '#a69067', roughness: 1, flatShading: true });
    const cx = (CONFIG.bounds.minX + CONFIG.bounds.maxX) / 2, cz = (CONFIG.bounds.minZ + CONFIG.bounds.maxZ) / 2;
    const ring = new THREE.Group(); ring.name = 'Horizon';
    for (let i = 0; i < 70; i++) { const a = i / 70 * Math.PI * 2, r = 2300 + Math.sin(i * 7.1) * 300; const g = new THREE.ConeGeometry(260 + 180 * Math.abs(Math.sin(i * 3.3)), 60 + 70 * Math.abs(Math.sin(i * 1.7)), 7, 1); const c = new THREE.Mesh(g, m); c.position.set(cx + Math.cos(a) * r, 5, cz + Math.sin(a) * r); c.rotation.y = i; ring.add(c); }
    const plane = new THREE.Mesh(new THREE.CircleGeometry(4000, 48), new THREE.MeshStandardMaterial({ color: '#8d8355', roughness: 1 })); plane.rotation.x = -Math.PI / 2; plane.position.set(cx, -3, cz); ring.add(plane);
    this.group.add(ring);
  }
}
