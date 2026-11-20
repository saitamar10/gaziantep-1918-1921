// Dünya yöneticisi: tüm sistemleri kurar, parça (chunk) bazlı LOD akışını yönetir, zemin yüksekliği sorgusu sağlar.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { GeoBuilder } from '../core/GeoBuilder.js';
import { Poly, rng } from '../core/MapCoordinates.js';
import { Materials } from './Materials.js';
import { StreetLayout } from './Streets.js';
import { Terrain, heightAt } from './Terrain.js';
import { Collision } from './Collision.js';
import { Landmarks } from './Landmarks.js';
import { Props } from './Props.js';
import { specFor, buildBase, buildDetail, treesFor, collisionFor } from './Buildings.js';
import { HeroStreet } from '../slice/HeroStreet.js';

const tick = () => new Promise(r => setTimeout(r, 0));

export class WorldManager {
  constructor(renderer, scene) { this.r = renderer; this.scene = scene; this.root = new THREE.Group(); this.root.name = 'World'; scene.add(this.root); this.chunks = new Map(); this.stats = {}; }
  async init(progress) {
    const P = (v, t) => progress(v, t);
    P(.02, 'Taş, ahşap ve kiremit dokuları üretiliyor…'); await tick();
    this.mats = new Materials(this.r).build(v => P(.02 + v * .2, 'Dokular üretiliyor…')); await tick();
    // textures/ klasöründeki gerçek doku setleri (varsa) prosedürellerin yerine geçer
    P(.23, 'Dış dokular denetleniyor…'); const ext = await this.mats.loadExternal(); this.mats.applyExternal(); this.stats.textures = ext.length; if (ext.length) console.log('Dış doku setleri:', ext.map(x => x.key).join(', '));
    P(.24, 'Sokak ağı ve parseller çıkarılıyor…'); await tick();
    this.layout = new StreetLayout().generate();
    this.hero = new HeroStreet(this.mats); const ex = (x, z) => this.hero.excludes(x, z); this.layout.lots = this.layout.lots.filter(l => !ex(l.c[0], l.c[1])); this.layout.sabats = this.layout.sabats.filter(q => !ex(q.x, q.z)); this.layout.squares = this.layout.squares.filter(q => !ex(q.x, q.z));
    this.stats.lots = this.layout.lots.length;
    P(.32, 'Arazi, kale höyüğü ve Alleben vadisi…'); await tick();
    this.terrain = new Terrain(this.mats, this.layout); this.root.add(this.terrain.build());
    this.collision = new Collision();
    P(.40, 'Kale, camiler, hanlar, kiliseler, kolej…'); await tick();
    this.props = new Props(this.mats);
    this.landmarks = new Landmarks(this.collision).build(); const lmG = this.landmarks.G; lmG.meshes(this.mats.m).forEach(m => this.root.add(m));
    this.root.add(this.props.build(this.landmarks.props));
    this.extras();
    P(.42, 'Kahraman sokak: tekrarsız taş dokuları üretiliyor…'); await tick();
    const heroProps = []; this.root.add(this.hero.build(this.collision, heroProps)); this.root.add(this.props.build(heroProps));
    // parseller -> reçete -> çarpışma -> parça
    const C = CONFIG.chunk;
    for (const lot of this.layout.lots) { const s = specFor(lot); lot.spec = s; for (const cp of collisionFor(s)) this.collision.addPoly(cp);
      const key = Math.floor(lot.c[0] / C) + ',' + Math.floor(lot.c[1] / C); let ch = this.chunks.get(key); if (!ch) { ch = { key, cx: (Math.floor(lot.c[0] / C) + .5) * C, cz: (Math.floor(lot.c[1] / C) + .5) * C, lots: [], trees: [], base: null, detail: null }; this.chunks.set(key, ch); } ch.lots.push(lot); ch.trees.push(...treesFor(s)); }
    this.streetTrees();
    let i = 0; const n = this.chunks.size;
    for (const ch of this.chunks.values()) { this.buildBaseChunk(ch); if (++i % 12 === 0) { P(.45 + .45 * i / n, `Mahalleler inşa ediliyor… ${i}/${n}`); await tick(); } }
    this.stats.chunks = n; P(.94, 'Işık ve gölgeler…'); await tick();
    return this;
  }
  buildBaseChunk(ch) { const G = new GeoBuilder(); for (const lot of ch.lots) buildBase(G, lot.spec);
    const g = new THREE.Group(); g.name = 'chunk-base-' + ch.key; G.meshes(this.mats.m).forEach(m => g.add(m));
    // uzak ağaç taçları (LOD1)
    if (ch.trees.length) { const im = new THREE.InstancedMesh(this.farTreeGeo || (this.farTreeGeo = (() => { const s = new THREE.IcosahedronGeometry(1, 1); s.scale(2.6, 2.2, 2.6); s.translate(0, 3.6, 0); const t = new THREE.CylinderGeometry(.18, .25, 2.4, 5); t.translate(0, 1.2, 0); const a = s.toNonIndexed(), b = t.toNonIndexed(); const pos = [...a.attributes.position.array, ...b.attributes.position.array]; const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.computeVertexNormals(); return gg; })()),
        this.farTreeMat || (this.farTreeMat = new THREE.MeshStandardMaterial({ color: '#5f6b38', roughness: 1, flatShading: true })), ch.trees.length);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(); ch.trees.forEach((t, i) => { const sc = (t[5] || 1) * (t[6] === 3 ? .8 : 1); v.set(t[1], t[2], t[3]); s.set(sc, sc * (t[6] === 2 ? 1.4 : 1), sc); m4.compose(v, q, s); im.setMatrixAt(i, m4); }); im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im); ch.farTrees = im; }
    this.root.add(g); ch.base = g; }
  buildDetailChunk(ch) { const G = new GeoBuilder(); const props = []; for (const lot of ch.lots) buildDetail(G, lot.spec, props);
    const g = new THREE.Group(); g.name = 'chunk-detail-' + ch.key; G.meshes(this.mats.m).forEach(m => g.add(m)); g.add(this.props.build([...props, ...ch.trees])); this.root.add(g); ch.detail = g;
    if (this.onNewMaterials) g.traverse(o => o.material && this.onNewMaterials(o.material)); }
  disposeDetail(ch) { if (!ch.detail) return; ch.detail.traverse(o => { if (o.geometry && o.geometry !== this.farTreeGeo && !o.isInstancedMesh) o.geometry.dispose(); }); this.root.remove(ch.detail); ch.detail = null; }
  /** kamera konumuna göre yakın detay akışı (zaman bütçeli) */
  update(px, pz) { const t0 = performance.now(); const D = CONFIG.detailDist; const list = [...this.chunks.values()].map(c => [c, Math.hypot(c.cx - px, c.cz - pz)]).sort((a, b) => a[1] - b[1]);
    for (const [c, d] of list) { if (d < D && !c.detail) { if (performance.now() - t0 < CONFIG.detailBudgetMs || !this._warm) this.buildDetailChunk(c); }
      if (c.base) c.base.visible = d < (this.drawDist || Infinity);   // kalite kademesine göre şehir çizim mesafesi
      if (c.detail) c.detail.visible = d < D + 40; if (c.farTrees) c.farTrees.visible = !(c.detail && c.detail.visible); if (d > D * 2.4) this.disposeDetail(c); }
    this._warm = true; }
  /** zemin yüksekliği (köprü döşemeleri dahil) */
  groundAt(x, z) { let h = heightAt(x, z); for (const b of this.landmarks.bridgeDecks || []) { const a = -b.ang; const dx = x - b.x, dz = z - b.z; const u = dx * Math.cos(a) + dz * Math.sin(a), v = -dx * Math.sin(a) + dz * Math.cos(a); if (Math.abs(u) < b.len / 2 && Math.abs(v) < b.w / 2) h = Math.max(h, b.y); } return h; }
  /** kemerli geçitler (sabat), küçük meydan çeşmeleri */
  extras() { const G = new GeoBuilder(); const st = new THREE.Color('#efe1c2'), bas = new THREE.Color('#d8d4d0'); const props = [];
    for (const s of this.layout.sabats) { const y = heightAt(s.x, s.z); const across = new THREE.Vector3(-Math.sin(s.ang), 0, Math.cos(s.ang)), along = new THREE.Vector3(Math.cos(s.ang), 0, Math.sin(s.ang));
      const m = new THREE.Matrix4().makeBasis(across, new THREE.Vector3(0, 1, 0), along).setPosition(s.x, y, s.z); const w = s.w + .3;
      G.arch('stone2', m, w, 2.5, 3.4, st, Math.random() < .4 ? bas : null, 11, .35, 'basalt'); G.boxM('stone', GeoBuilder.local(m, 0, 2.5 + w / 2 + 2.0, 0), w + 1.2, 3.6, 3.6, st, { uvS: 3 }); G.boxM('dark', GeoBuilder.local(m, 0, 2.5 + w / 2 + 2.0, 1.81), .7, 1, .02, '#fff', { faces: 1 }); }
    for (const q of this.layout.squares) { const y = heightAt(q.x, q.z); G.box('stone2', q.x, y - .2, q.z, 2.4, 3.2, 1.2, .3, st, { uvS: 1 }); G.box('stone2', q.x + Math.cos(.3) * .0, y - .2, q.z + 1.1, 2.0, .8, 1.0, .3, st.clone().multiplyScalar(.9)); G.box('water', q.x, y + .55, q.z + 1.1, 1.7, .02, .7, .3, '#fff', { faces: 16 }); this.collision.addCircle(q.x, q.z, 1.6); props.push(['agac', q.x + 6, y, q.z + 4, 1, 1.8, 1]); this.collision.addCircle(q.x + 6, q.z + 4, .5); }
    G.meshes(this.mats.m).forEach(m => this.root.add(m)); this.root.add(this.props.build(props)); }
  streetTrees() { const R = rng(77); const C = CONFIG.chunk; for (const s of this.layout.segments) { if (s.w < 4 || s.len < 20) continue; const dx = (s.b[0] - s.a[0]) / s.len, dz = (s.b[1] - s.a[1]) / s.len;
      for (let t = 8; t < s.len - 8; t += 26 + R() * 30) { if (R() > .35) continue; const sd = R() < .5 ? -1 : 1; const x = s.a[0] + dx * t - dz * sd * (s.w / 2 - .9), z = s.a[1] + dz * t + dx * sd * (s.w / 2 - .9); if (this.collision.blocked(x, z, 1.2) || this.hero.excludes(x, z)) continue;
        const key = Math.floor(x / C) + ',' + Math.floor(z / C); const ch = this.chunks.get(key); if (!ch) continue; ch.trees.push(['agac', x, heightAt(x, z), z, R() * 6, 1 + R() * .5, R() < .3 ? 3 : 1]); this.collision.addCircle(x, z, .35); } } }
  allMaterials() { const set = new Set(this.mats.all()); if (this.farTreeMat) set.add(this.farTreeMat); set.add(this.terrain.material_); this.root.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => set.add(m)); }); return [...set]; }
}
