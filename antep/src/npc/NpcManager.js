// NPC sistemi: kadro (roster), günlük akış (rol -> görev kuyruğu), yol ağı üzerinde yürüme, kaçınma, mesafe bazlı LOD.
// Görsel: assets/characters/manifest.json'da model varsa GLB (GLTFLoader + AnimationMixer), yoksa Mannequin yer tutucusu.
// PİLOT: karakter görünüşleri onaylanana kadar yalnız kahraman sokak çevresinde çalışır (CONFIG.npc.radius).
//
// models/manifest.json örneği (ayrıntı: models/README.md):
// { "characters": [ { "id": "K01", "url": "models/characters/K01_yasli_esnaf.glb", "walkSpeed": 1.3,
//     "clips": { "idle": "Idle", "walk": "Walk", "talk_a": "Talk01" } } ] }
// Klip adları: idle walk run talk_a talk_b sit carry_walk carry_idle work_a shop interact play guard
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../config.js';
import { rng } from '../core/MapCoordinates.js';
import { CHARACTERS } from '../data/characters.js';
import { SOHBET, SELAM, SESLENME } from '../data/dialogue.js';
import { kimlikUret } from '../data/people.js';
import { NavGraph } from './NavGraph.js';
import { buildGeometry, createInstance, clipsFor } from './Mannequin.js';

const REF_H = 1.75;            // manken bağlama pozu boyu
const RADIUS = .28;            // NPC çarpışma yarıçapı
const angLerp = (a, b, t) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

export class NpcManager {
  constructor({ world, scene, camera, player, onMaterial }) {
    this.world = world; this.scene = scene; this.camera = camera; this.player = player; this.onMaterial = onMaterial || (() => { });
    this.cfg = { enabled: true, radius: 260, military: false, kuva: false, legion: false, lod: [45, 95, 210], ...(CONFIG.npc || {}) };
    this.group = new THREE.Group(); this.group.name = 'NPCs'; scene.add(this.group);
    this.agents = []; this.templates = new Map(); this.frame = 0; this.frustum = new THREE.Frustum(); this.pm = new THREE.Matrix4(); this.sphere = new THREE.Sphere(new THREE.Vector3(), 1.3);
    this.stats = { agents: 0, bodies: 0, impostors: 0, nodes: 0 };
    this.chats = []; this.occupier = 'french'; this.groups = new Set(); this.met = new Map(); this.amb = { nav: null, c: null, agents: [] }; this.ambOn = false; this.focus = null; this.bubbles = []; this.R = rng(4242);
  }

  async init() {
    if (!this.cfg.enabled) return this;
    const hero = this.world.hero; const c = hero.w(0, -50); this.center = { x: c[0], z: c[1] };
    this.nav = new NavGraph().build(this.world.layout, this.world.collision, hero, { x: c[0], z: c[1], r: this.cfg.radius }); this.stats.nodes = this.nav.nodes.length;
    this.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, envMapIntensity: .5 }); this.onMaterial(this.material);
    // uzak LOD: tek InstancedMesh (durağan siluet)
    const farGeo = buildGeometry({ skin: '#b58a66', topC: '#ffffff', botC: '#8a8178', top: 'entari', head: 'fes', headC: '#6a5a50' }, 1, false);
    this.farMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }); this.onMaterial(this.farMat);
    this.far = new THREE.InstancedMesh(farGeo, this.farMat, 256); this.far.count = 0; this.far.frustumCulled = false; this.far.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.far.setColorAt(0, new THREE.Color()); this.group.add(this.far);
    await this.loadManifest();
    this.spots(); this.roster();
    // şehir geneli sakinler: oyuncu pilot bölgeden uzaklaşınca çevresinde dolaşırlar (bkz. ambient())
    ['K02', 'K01', 'K11', 'K02', 'K12', 'K06', 'K04', 'K02', 'K05', 'K01', 'K04', 'K02', 'K11', 'K02', 'K03', 'K01', 'K02', 'K04', 'K12', 'K06', 'K02', 'K11'].forEach((d, i) => { const a = this.makeAgent(d, 'ambient', this.R, { node: this.nav.nodes[0] }); a.amb = true; a.ambIdx = i; this.agents.push(a); this.amb.agents.push(a); });
    this.agents.forEach(a => this.identify(a)); this.rebench();
    this.stats.agents = this.agents.length; return this;
  }

  /* ---------------- GLB modelleri (isteğe bağlı) ---------------- */
  async loadManifest(urls = ['./models/manifest.json', './assets/characters/manifest.json']) {
    let man; for (const url of urls) { try { const r = await fetch(url, { cache: 'no-store' }); if (r.ok) { man = await r.json(); break; } } catch (e) { } } if (!man) return;
    const loader = new GLTFLoader();
    for (const e of man.characters || []) { if (!e || !e.id || !e.url || e.enabled === false || !CHARACTERS[e.id]) continue; try { const head = await fetch(e.url, { method: 'HEAD', cache: 'no-store' }); if (!head.ok) continue;   // dosya henüz konmamış: yer tutucu kalır
      const g = await loader.loadAsync(e.url); const box = new THREE.Box3().setFromObject(g.scene); const h = (box.max.y - box.min.y) || 1.7;
      g.scene.traverse(o => { if (!o.isMesh) return; o.frustumCulled = false; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => this.onMaterial(m)); });
      this.templates.set(e.id, { scene: g.scene, clips: g.animations, height: h, map: e.clips || {}, walkSpeed: e.walkSpeed || 1.3 }); } catch (err) { console.warn('Karakter modeli yüklenemedi', e.url, err); } }
  }

  /* ---------------- sabit noktalar (kahraman sokak yerel koordinatı -> dünya) ---------------- */
  spots() {
    const H = this.world.hero, C = this.world.collision; const S = this.spot = {};
    // yerel (x,z) noktasını sokak eksenine doğru kaydırarak boş yer bulur; face: bakılacak yerel yön
    const P = (x, z, fx, fz) => { const cx = H.cx(Math.min(0, Math.max(-100, z))); for (let k = 0; k < 10; k++) { const lx = x + (cx - x) * k / 10; const [X, Z] = H.w(lx, z); if (!C.blocked(X, Z, RADIUS + .05)) { const [X2, Z2] = H.w(lx + fx, z + fz); return { x: X, z: Z, yaw: Math.atan2(X2 - X, Z2 - Z) }; } } return null; };
    this.heroPoint = P;
    S.shop = []; S.customer = [];
    for (let i = 0; i < 5; i++) { const z = -1.7 - i * 5.4; const a = P(H.xl(z) + .85, z, 1, 0), b = P(H.xl(z) + 2.1, z + .6, -1, 0); if (a) S.shop.push(a); if (b) S.customer.push(b); }
    S.fountain = P(H.xr(-24) - 1.1, -24, 1, 0);
    S.sit = [P(H.xr(-7.2) - .6, -7.2, -1, -.5), P(H.xr(-8.8) - .6, -8.8, -1, .5), P(H.xl(-88) + .6, -88, 1, -.5), P(H.xl(-89.6) + .6, -89.6, 1, .5)].filter(Boolean);
    S.work = [P(H.xl(-66) + .9, -66, 1, 0), P(H.xr(-46) - .8, -78, -1, 0)].filter(Boolean);   // ev kadını: kapı önünde tahıl eleme
    S.play = [P(0, -84, 0, 1), P(0, 5, 0, 1)].filter(Boolean);
    S.music = [-61, -62.3, -63.6].map(z => P(H.xr(z) - .8, z, -1, 0)).filter(Boolean);
    // oturma taşları
    const geo = new THREE.BoxGeometry(.42, .4, .42), mat = new THREE.MeshStandardMaterial({ color: '#c9b999', roughness: 1 }); this.onMaterial(mat);
    for (const s of S.sit) { const m = new THREE.Mesh(geo, mat); m.position.set(s.x - Math.sin(s.yaw) * .1, this.world.groundAt(s.x, s.z) + .2, s.z - Math.cos(s.yaw) * .1); m.rotation.y = s.yaw; m.castShadow = m.receiveShadow = true; this.group.add(m); }
  }

  /* ---------------- kadro ---------------- */
  roster() {
    const S = this.spot, nav = this.nav, c = this.center; const R = rng(CONFIG.seed + 77);
    const far = () => nav.randomNode(R, c.x, c.z, this.cfg.radius * .95), near = (r = 110) => nav.randomNode(R, c.x, c.z, r);
    const add = (def, role, opt = {}) => { const a = this.makeAgent(def, role, R, opt); this.agents.push(a); return a; };
    S.shop.forEach((s, i) => add(i % 2 ? 'K02' : 'K01', 'esnaf', { spot: s, home: far(), at: s }));
    ['K02', 'K11', 'K02', 'K12', 'K01', 'K11', 'K02', 'K12', 'K02', 'K11', 'K01', 'K02'].forEach(d => add(d, 'gezen', { home: far(), node: near() }));
    for (let i = 0; i < 5; i++) add('K05', 'sucu', { home: near(150), node: near() });
    S.work.forEach(s => add('K03', 'evkadini', { spot: s, at: s, home: near(80) }));
    for (let i = 0; i < 6; i++) add('K04', 'cocuk', { play: S.play[i % Math.max(1, S.play.length)], at: S.play[i % Math.max(1, S.play.length)], home: near(90) });
    S.sit.forEach((s, i) => add(i < 2 ? 'K01' : 'K12', 'yasli', { spot: s, at: s, home: near(120) }));
    for (let i = 0; i < 4; i++) add('K06', 'hamal', { a: far(), b: far(), node: near(160) });
    S.music.forEach(s => add('K07', 'muzisyen', { spot: s, at: s, home: far() }));
    if (this.cfg.kuva) for (let i = 0; i < 2; i++) add('K08', 'devriye', { loop: [near(), near(), near()], node: near() });
    if (this.cfg.legion) for (let i = 0; i < 2; i++) add('K14', 'devriye', { loop: [near(), near(), near()], node: near() });
    if (this.cfg.military) { // Fransız devriyesi: 2 piyade + 1 makineli tüfekçi + 1 subay
      const loop = [near(140), near(140), near(140), near(140)]; ['K09', 'K09', 'K13'].forEach((d, i) => add(d, 'devriye', { loop, node: loop[0], lane: .4 + i * .5 })); add('K10', 'devriye', { loop, node: loop[0], lane: 1.6 }); }
  }
  /** Hikâye karakteri: spot = { x, z, yaw }. tag ile görev sistemi tanır; yalnız story etkinken görünür. */
  identify(a) { a.kimlik = kimlikUret(a, CHARACTERS[a.def], rng(5000 + a.id * 31)); }
  /** şehir geneli sakinler: pilot bölgenin dışında oyuncunun çevresi için yol ağı kurar ve sakinleri oraya taşır */
  ambient() { const P = this.player.pos, A = this.amb; const far = Math.hypot(P.x - this.center.x, P.z - this.center.z) > this.cfg.radius * .7;
    if (!far) { if (this.ambOn) { this.ambOn = false; this.rebench(); } return; }
    if (!A.nav || Math.hypot(P.x - A.c.x, P.z - A.c.z) > 130) { const t0 = performance.now(); const nav = new NavGraph().build(this.world.layout, this.world.collision, null, { x: P.x, z: P.z, r: 230 }); A.ms = Math.round(performance.now() - t0);
      if (nav.nodes.length < 8) { A.nav = null; if (this.ambOn) { this.ambOn = false; this.rebench(); } return; } A.nav = nav; A.c = { x: P.x, z: P.z }; for (const a of A.agents) this.respawn(a); }
    if (!this.ambOn) { this.ambOn = true; this.rebench(); } }
  respawn(a) { const P = this.player.pos, n = this.amb.nav.randomNode(a.R, P.x + (a.R() - .5) * 170, P.z + (a.R() - .5) * 170, 55); a.x = n.x; a.z = n.z; a.y = this.world.groundAt(n.x, n.z); a.tasks.length = 0; a.stuck = 0; a.vx = a.vz = 0; if (a.body) this.detach(a); }
  addStory(defId, tag, spot, opt = {}) { const a = this.makeAgent(defId, opt.role || 'sabit', this.R, { spot, at: spot, ...opt }); a.tag = tag; a.story = true; a.grp = opt.grp || 'heyet'; this.identify(a); if (opt.kimlik) a.kimlik = opt.kimlik; this.agents.push(a); this.stats.agents = this.agents.length; this.rebench(); return a; }
  /** hikâye grupları: yalnız etkin gruptaki hikâye karakterleri sokakta görünür */
  setGroup(name, on) { if (on) this.groups.add(name); else this.groups.delete(name); this.rebench(); }
  setStory(on) { this.setGroup('heyet', on); }
  makeAgent(defId, role, R, opt) {
    const def = CHARACTERS[defId]; const o = { ...def.outfit, ...(opt.outfit || {}) };
    // kişiye özgü çeşitlilik: boy, yapı, ton (renkler varsayım)
    const jit = (hex, dl = .07, ds = .08, dh = .015) => { if (!hex) return hex; const col = new THREE.Color(hex), h = {}; col.getHSL(h); col.setHSL((h.h + (R() - .5) * dh + 1) % 1, Math.max(0, Math.min(1, h.s + (R() - .5) * ds)), Math.max(.04, Math.min(.95, h.l + (R() - .5) * dl))); return '#' + col.getHexString(); };
    // kişiden kişiye yalnız hafif ton farkı: kıyafet ve eşya paftadaki tasarımla aynı kalır (askerlerde üniforma rengi sabit)
    if (!def.military) for (const k of ['topC', 'botC', 'sashC', 'shirtC', 'armC', 'apronC', 'skin']) o[k] = jit(o[k], k === 'skin' ? .06 : .06, .05, .01);
    const height = def.height * (.96 + R() * .08), build = def.build * (.93 + R() * .14);
    const start = opt.at || opt.node || this.nav.nodes[0];
    const speeds = { male: 1.3, female: 1.15, child: 1.25, elder: .78, soldier: 1.35 };
    return { id: this.agents.length, def: defId, family: def.family, role, o: opt, outfit: o, height, build, scale: height / REF_H, R: rng(1000 + this.agents.length * 7919),
      x: start.x, z: start.z, y: 0, yaw: start.yaw || R() * 6.28, vx: 0, vz: 0, speed: speeds[def.family] * (.92 + R() * .16) * (role === 'hamal' ? .8 : 1), lane: opt.lane ?? .35 + R() * 1.1,
      tasks: [], anim: 'idle', animScale: 1, hidden: false, chatCd: R() * 20, stuck: 0, pt: 0, px: start.x, pz: start.z, body: null, acc: 0,
      color: new THREE.Color(o.topC) };
  }

  /* ---------------- günlük akış: rol -> görevler ---------------- */
  plan(a, hour) {
    const R = a.R, S = this.spot, o = a.o, T = a.tasks; const day = hour > 6 && hour < 19.6;
    const go = (p, extra = {}) => T.push({ t: 'go', x: p.x, z: p.z, node: p.e ? p : null, spot: !p.e, yaw: p.yaw, anim: 'walk', ...extra });
    const stay = (dur, anim = 'idle', yaw = null) => T.push({ t: 'stay', dur, anim, yaw });
    const home = () => { if (o.home) go(o.home); T.push({ t: 'hide', dur: 25 + R() * 30 }); };
    const rnd = (arr) => arr[Math.floor(R() * arr.length)];
    switch (a.role) {
      case 'esnaf': if (!day) return home(); if (Math.hypot(a.x - o.spot.x, a.z - o.spot.z) > .8) go(o.spot); stay(10 + R() * 18, R() < .55 ? 'shop' : R() < .5 ? 'idle' : 'talk_b', o.spot.yaw); break;
      case 'gezen': { if (!day) return home(); const k = R();
        if (k < .4 && S.customer.length) { const s = rnd(S.customer); go(s); stay(6 + R() * 9, R() < .5 ? 'shop' : 'talk_a', s.yaw); }
        else if (k < .5 && S.fountain) { go(S.fountain); stay(4 + R() * 4, 'interact', S.fountain.yaw); }
        else if (k < .62 && o.home) home();
        else { go(this.nav.randomNode(R, this.center.x, this.center.z, 150)); stay(2 + R() * 6); } break; }
      case 'sucu': if (!day) return home(); if (S.fountain) { go(S.fountain); stay(5 + R() * 4, 'interact', S.fountain.yaw); } go(o.home); T.push({ t: 'hide', dur: 15 + R() * 25 }); break;
      case 'evkadini': if (!day) return home(); if (Math.hypot(a.x - o.spot.x, a.z - o.spot.z) > .6) go(o.spot); stay(18 + R() * 20, 'sift', o.spot.yaw); stay(3 + R() * 4, 'idle', o.spot.yaw); if (R() < .2) home(); break;
      case 'cocuk': { if (!day) return home(); const p = o.play; if (!p) { go(this.nav.randomNode(R, a.x, a.z, 40), { anim: 'run' }); break; }
        if (Math.hypot(a.x - p.x, a.z - p.z) > 16) { go(this.nav.nearest(p.x, p.z), { anim: 'run' }); break; }
        for (let k = 0; k < 6; k++) { const ang = R() * 6.28, d = 2 + R() * 9; const q = [p.x + Math.cos(ang) * d, p.z + Math.sin(ang) * d]; if (this.nav.walkable(this.world.collision, [a.x, a.z], q)) { T.push({ t: 'go', x: q[0], z: q[1], direct: true, anim: R() < .75 ? 'run' : 'walk' }); break; } }
        stay(.6 + R() * 2.5, R() < .3 ? 'talk_a' : 'idle'); break; }
      case 'yasli': if (!day) return home(); if (Math.hypot(a.x - o.spot.x, a.z - o.spot.z) > .5) go(o.spot); stay(40 + R() * 60, 'sit', o.spot.yaw); if (R() < .25) { go(this.nav.randomNode(R, a.x, a.z, 45)); stay(3 + R() * 4); } break;
      case 'hamal': go(o.a, { anim: 'carry_walk' }); stay(4 + R() * 5, 'carry_idle'); go(o.b, { anim: 'carry_walk' }); stay(4 + R() * 5, 'carry_idle'); break;
      case 'muzisyen': if (hour < 9.5 || hour > 17.5) { if (!day) return home(); go(this.nav.randomNode(R, this.center.x, this.center.z, 120)); stay(4 + R() * 6); break; }
        if (Math.hypot(a.x - o.spot.x, a.z - o.spot.z) > .6) go(o.spot); stay(25 + R() * 30, 'play', o.spot.yaw); stay(4 + R() * 5, 'idle', o.spot.yaw); break;
      case 'devriye': for (const n of o.loop) { go(n); stay(5 + R() * 6, 'guard'); } break;
      case 'ambient': { const A = this.amb, P = this.player.pos; if (!A.nav) { stay(3); break; } if (a.dist > 185) this.respawn(a); const run = a.family === 'child' && R() < .6;
        go(A.nav.randomNode(R, P.x + (R() - .5) * 60, P.z + (R() - .5) * 60, 110), { anim: run ? 'run' : a.def === 'K06' ? 'carry_walk' : 'walk' }); stay(2 + R() * 7, a.def === 'K06' ? 'carry_idle' : 'idle'); break; }
      case 'dusman': stay(1e6, 'idle'); break;
      case 'sabit': if (Math.hypot(a.x - o.spot.x, a.z - o.spot.z) > .5) go(o.spot); stay(8 + R() * 8, o.anim || (R() < .6 ? 'idle' : 'talk_b'), o.spot.yaw); break;
    }
    if (!T.length) stay(3);
  }
  makePath(a, t) {
    const nav = a.amb ? this.amb.nav : this.nav, C = this.world.collision; if (t.direct) return [[t.x, t.z, true]]; if (!nav) return null;
    const from = nav.nearest(a.x, a.z, 90), to = t.node || nav.nearest(t.x, t.z, 90); const p = nav.path(from, to); if (!p) return null;
    const out = []; for (let i = 0; i < p.length; i++) { const n = p[i], pr = p[i - 1] || { x: a.x, z: a.z }, nx = p[i + 1] || n; let dx = nx.x - pr.x, dz = nx.z - pr.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const w = Math.min(i ? nav.edgeWidth(p[i - 1], n) : 9, p[i + 1] ? nav.edgeWidth(n, p[i + 1]) : 9); const off = Math.max(0, Math.min(w / 2 - .75, a.lane)) * (this.kusatma ? .3 : 1); /* kuşatmada sokak ortasından yürünür: barikatların geçidi ortadadır */ let x = n.x - dz * off, z = n.z + dx * off; if (C.blocked(x, z, RADIUS + .1)) { x = n.x; z = n.z; } out.push([x, z, false]); }
    if (out.length > 1 && Math.hypot(a.x - out[1][0], a.z - out[1][1]) < Math.hypot(out[0][0] - out[1][0], out[0][1] - out[1][1])) out.shift();   // ilk düğüm arkada kaldıysa atla
    if (t.spot) out.push([t.x, t.z, true]); else if (out.length) out[out.length - 1][2] = true;
    return out;
  }

  /** kalite kademesi: density (0..1) kadro oranı — sabit görevli esnaf dışındakiler seyreltilir; lod: mesafeler */
  setQuality(density, lod) { if (lod) this.cfg.lod = lod; this.density = density; this.rebench(); }
  /** tarihe göre dönem: occupier = none | british | french. Fransız devriyesi yalnız Fransız döneminde sokağa çıkar (İngiliz asker modeli yok). */
  setPeriod(occupier, kusatma = false) { this.occupier = occupier; this.kusatma = kusatma; this.rebench(); }
  rebench() { const d = this.density ?? 1; this.agents.forEach(a => { const soldier = CHARACTERS[a.def].family === 'soldier'; const fixed = a.role === 'esnaf' || a.role === 'evkadini' || a.role === 'yasli' || a.story;   // görevlerde rol alanlar seyreltilmez
      a.benched = (soldier && !a.story && (this.occupier !== 'french' || this.kusatma)) || /* kuşatmada Fransız devriyesi savunulan mahallede dolaşmaz */  (a.story && !this.groups.has(a.grp)) || (a.amb ? (!this.ambOn || a.ambIdx >= Math.ceil(this.amb.agents.length * Math.max(.6, d))) : (!fixed && ((a.id * 7) % 20) / 20 >= d)); if (a.benched && a.body) this.detach(a); if (a.benched) a.say = null; }); }

  /* ---------------- benzetim ---------------- */
  update(dt, hour) {
    if (!this.cfg.enabled || !this.nav) return; this.frame++; if (this.frame % 30 === 1) this.ambient();
    const P = this.player.pos, cam = this.camera; const live = this.agents.filter(a => !a.hidden && !a.benched);
    for (const a of this.agents) {
      if (a.benched) { a.dist = 1e9; continue; }
      const d = Math.hypot(a.x - P.x, a.z - P.z); a.dist = d;
      // uzaktakiler seyrek güncellenir
      if (d > 130) { a.acc += dt; if ((this.frame + a.id) % 4) continue; this.tick(a, a.acc, hour, live, false); a.acc = 0; }
      else this.tick(a, dt, hour, live, true);
    }
    this.social(); this.blockPlayer(live); this.speech(dt, live);
    // görseller
    cam.updateMatrixWorld(); this.pm.multiplyMatrices(cam.projectionMatrix, this.pm.copy(cam.matrixWorld).invert()); this.frustum.setFromProjectionMatrix(this.pm);
    const [L0, L1, L2] = this.cfg.lod; let nb = 0, ni = 0; const m4 = this._m4 || (this._m4 = new THREE.Matrix4()), q = this._q || (this._q = new THREE.Quaternion()), v = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const a of this.agents) {
      if (a.benched) continue;
      const d = a.dist; const want = !a.hidden && (d < L1 + (a.body ? 6 : 0) || (a.external && d < 190));
      if (want && !a.body) this.attach(a); if (!want && a.body) this.detach(a);
      if (a.body) { const b = a.body; this.sphere.center.set(a.x, a.y + .9, a.z); const vis = this.frustum.intersectsSphere(this.sphere); b.root.visible = vis; if (!vis) { b.skip += dt; continue; }
        b.root.position.set(a.x, a.y, a.z); b.root.rotation.y = a.yaw; this.setAnim(a); const near = d < L0; if (b.shadow !== near) { b.shadow = near; b.root.traverse(o => { if (o.isMesh) o.castShadow = near; }); }
        b.skip += dt; if (near || (this.frame + a.id) % 3 === 0) { b.mixer.update(b.skip); b.skip = 0; } nb++; }
      else if (!a.hidden && d < L2 && ni < 256) { v.set(a.x, a.y, a.z); q.setFromAxisAngle(up, a.yaw); s.setScalar(a.scale); m4.compose(v, q, s); this.far.setMatrixAt(ni, m4); this.far.setColorAt(ni, a.color); ni++; }
    }
    this.far.count = ni; this.far.instanceMatrix.needsUpdate = true; if (this.far.instanceColor) this.far.instanceColor.needsUpdate = true;
    this.stats.bodies = nb; this.stats.impostors = ni;
  }
  tick(a, dt, hour, live, precise) {
    if (a.external) { a.y = this.world.groundAt(a.x, a.z); return; }   /* savaş mekaniği yönetiyor (Combat.js): konum, yön ve animasyon dışarıdan verilir */
    if (!a.tasks.length) this.plan(a, hour); const t = a.tasks[0]; if (!t) return;
    if (t.t === 'hide') { a.hidden = true; a.vx = a.vz = 0; t.dur -= dt; if (t.dur <= 0) { a.hidden = false; a.tasks.shift(); } return; }
    if (t.t === 'stay') { a.vx = a.vz = 0; a.anim = t.anim; a.animScale = 1; if (t.yaw != null) a.yaw = angLerp(a.yaw, t.yaw, Math.min(1, dt * 5)); t.dur -= dt; if (t.dur <= 0) a.tasks.shift(); a.y = this.world.groundAt(a.x, a.z); return; }
    // 'go'
    if (!t.path) { t.path = this.makePath(a, t); t.i = 0; if (!t.path || !t.path.length) { a.tasks.length = 0; a.tasks.push({ t: 'stay', dur: 2 + a.R() * 3, anim: 'idle' }); return; } }
    const wp = t.path[t.i]; let dx = wp[0] - a.x, dz = wp[1] - a.z; const dist = Math.hypot(dx, dz); const last = t.i === t.path.length - 1;
    if (dist < (last ? .35 : 1.0)) { t.i++; if (t.i >= t.path.length) { a.tasks.shift(); a.stuck = 0; } return; }
    dx /= dist; dz /= dist; const run = t.anim === 'run'; let sp = a.speed * (run ? 2.3 : 1) * (last ? Math.min(1, .35 + dist / 1.5) : 1);
    // kaçınma: diğer NPC'ler ve oyuncu
    let ax = 0, az = 0, slow = 1;
    if (precise) {
      for (const b of live) { if (b === a) continue; const ex = a.x - b.x, ez = a.z - b.z; const d = Math.hypot(ex, ez); if (d > 1.5 || d < 1e-4) continue; const w = (1.5 - d) / 1.5; ax += ex / d * w * 1.6; az += ez / d * w * 1.6;
        const ahead = -(ex * dx + ez * dz) / d; if (ahead > .5) { ax += -dz * w * 1.2; az += dx * w * 1.2; if (d < .7) slow = Math.min(slow, .35); } }   // karşıdan gelen: sağa kır
      const P = this.player.pos, ex = a.x - P.x, ez = a.z - P.z, d = Math.hypot(ex, ez); if (d < 1.7 && d > 1e-4) { const w = (1.7 - d) / 1.7; ax += ex / d * w * 2; az += ez / d * w * 2; const ahead = -(ex * dx + ez * dz) / d; if (ahead > .6) { ax += -dz * w * 1.5; az += dx * w * 1.5; if (d < .9) slow = 0; } }
    }
    let tx = dx + ax, tz = dz + az; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; sp *= slow;
    const k = Math.min(1, dt * 6); a.vx += (tx * sp - a.vx) * k; a.vz += (tz * sp - a.vz) * k;
    let nx = a.x + a.vx * dt, nz = a.z + a.vz * dt; if (precise) [nx, nz] = this.world.collision.resolve(nx, nz, RADIUS);
    a.x = nx; a.z = nz; a.y = this.world.groundAt(nx, nz);
    const v = Math.hypot(a.vx, a.vz); if (v > .15) a.yaw = angLerp(a.yaw, Math.atan2(a.vx, a.vz), Math.min(1, dt * 7));
    if (v < .12) { a.anim = t.anim === 'carry_walk' ? 'carry_idle' : 'idle'; a.animScale = 1; } else { a.anim = t.anim; a.animScale = v; }
    // takılma denetimi
    a.pt += dt; if (a.pt > 2.5) { const moved = Math.hypot(a.x - a.px, a.z - a.pz); a.pt = 0; a.px = a.x; a.pz = a.z;
      if (moved < .3 && slow > 0) { a.stuck++; if (a.stuck >= 4) { const n = this.nav.nearest(a.x, a.z, 90); if (n) { a.x = n.x; a.z = n.z; } a.tasks.length = 0; a.stuck = 0; } else if (a.stuck >= 2) { if (t.direct) a.tasks.shift(); else t.path = null; } } else a.stuck = 0; }
  }
  /** karşılaşan iki gezen durup konuşur */
  social() {
    if (this.frame % 20) return; const C = this.agents.filter(a => !a.hidden && a.dist < 120 && (a.role === 'gezen' || a.role === 'sucu' || a.role === 'ambient') && a.tasks[0] && a.tasks[0].t === 'go');
    for (const a of this.agents) a.chatCd -= 20 / 60;
    for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) { const a = C[i], b = C[j]; if (a.chatCd > 0 || b.chatCd > 0) continue; const d = Math.hypot(a.x - b.x, a.z - b.z); if (d > 2 || d < .7 || a.R() > .5) continue;
      const pool = SOHBET.filter(s => Array.isArray(s) || (s.kusatma ? this.kusatma : !this.kusatma && (this.occupier === 'british' || this.occupier === 'french'))); const pick = pool[Math.floor(this.R() * pool.length)], lines = Array.isArray(pick) ? pick : pick.satirlar, dur = lines.length * 3 + 1; this.chats.push({ a, b, lines, i: -1, t: .6 }); a.tasks[0].path = null; b.tasks[0].path = null; a.tasks.unshift({ t: 'stay', dur, anim: 'talk_a', yaw: Math.atan2(b.x - a.x, b.z - a.z) }); b.tasks.unshift({ t: 'stay', dur, anim: 'talk_b', yaw: Math.atan2(a.x - b.x, a.z - b.z) }); a.chatCd = b.chatCd = 45 + a.R() * 60; }
  }
  /** oyuncu NPC'lerin içinden geçemez */
  blockPlayer(live) { const pl = this.player; if (pl.noclip || !pl.enabled) return; const P = pl.pos, m = RADIUS + pl.cfg.radius; let moved = false;
    for (const a of live) { if (a.dist > 2) continue; const dx = P.x - a.x, dz = P.z - a.z, d = Math.hypot(dx, dz); if (d < m && d > 1e-4) { P.x = a.x + dx / d * m; P.z = a.z + dz / d * m; moved = true; } }
    if (moved) { const [x, z] = this.world.collision.resolve(P.x, P.z, pl.cfg.radius); P.x = x; P.z = z; } }

  /* ---------------- konuşma (yazılı balonlar; seslendirme yok) ---------------- */
  say(a, text, dur = 3) { a.say = { text, t: dur }; }
  /** oyuncu E'ye bastığında: karşısındaki sakin durur, döner ve rolüne uygun bir söz söyler */
  interact() { const a = this.focus; if (!a) return null; const P = this.player.pos, t = a.tasks[0]; const sitting = t && t.t === 'stay' && (t.anim === 'sit' || t.anim === 'sift' || t.anim === 'play');
    if (t && t.t === 'go') t.path = null; if (!(t && t.talk)) a.tasks.unshift({ t: 'stay', dur: 4.5, anim: sitting ? t.anim : (a.role === 'hamal' ? 'carry_idle' : a.role === 'devriye' ? 'guard' : 'talk_a'), yaw: sitting ? null : Math.atan2(P.x - a.x, P.z - a.z), talk: true }); else t.dur = 4.5;
    const custom = this.onTalk ? this.onTalk(a) : null; const L = SELAM[a.role] || SELAM.gezen; let line = custom; if (!line) do { line = L[Math.floor(this.R() * L.length)]; } while (L.length > 1 && line === a.lastLine); a.lastLine = line; this.say(a, line, custom ? 5.5 : 4.2); if (custom) a.tasks[0].dur = 6;
    if (a.kimlik && a.kimlik.ad) { const m = this.met.get(a.id) || { ...a.kimlik, ilk: this.dateText || '', kez: 0 }; m.kez++; m.son = line; this.met.set(a.id, m); }
    return a; }
  /** odaktaki kişinin etiketi (E ipucu için) */
  focusLabel() { const a = this.focus; return a && a.kimlik ? a.kimlik.etiket : ''; }
  speech(dt, live) {
    // sohbet sıraları
    for (let k = this.chats.length - 1; k >= 0; k--) { const c = this.chats[k]; c.t -= dt; if (c.t > 0) continue; c.i++; if (c.i >= c.lines.length) { this.chats.splice(k, 1); continue; } this.say(c.i % 2 ? c.b : c.a, c.lines[c.i], 2.8); c.t = 3; }
    // esnaf seslenmesi + odak (oyuncunun karşısındaki en yakın sakin)
    const pl = this.player, P = pl.pos, fx = -Math.sin(pl.yaw), fz = -Math.cos(pl.yaw); let best = null, bd = 2.6;
    for (const a of live) { if (a.say) { a.say.t -= dt; if (a.say.t <= 0) a.say = null; } if (a.dist > 16) continue;
      if (a.role === 'esnaf' && !a.say && a.tasks[0] && a.tasks[0].t === 'stay') { a.callCd = (a.callCd ?? 4 + a.R() * 14) - dt; if (a.callCd <= 0) { this.say(a, SESLENME[Math.floor(a.R() * SESLENME.length)], 2.6); a.callCd = 12 + a.R() * 18; } }
      if (!a.external && a.dist < bd && ((a.x - P.x) * fx + (a.z - P.z) * fz) / (a.dist || 1) > .55) { bd = a.dist; best = a; } }
    this.focus = pl.noclip ? null : best;
    // balonlar: en yakın 6 konuşan
    if (!this.layer) { this.layer = document.createElement('div'); this.layer.id = 'npcSpeech'; (document.getElementById('hud') || document.body).appendChild(this.layer); for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = 'npcSay'; d.style.display = 'none'; this.layer.appendChild(d); this.bubbles.push(d); } }
    const talkers = live.filter(a => a.say && a.dist < 24).sort((a, b) => a.dist - b.dist).slice(0, 6); const v = this._sv || (this._sv = new THREE.Vector3());
    this.bubbles.forEach((d, i) => { const a = talkers[i]; if (!a) { d.style.display = 'none'; return; } const seated = a.anim === 'sit'; v.set(a.x, a.y + a.height * (seated ? .78 : 1) + .3, a.z).project(this.camera); if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.1) { d.style.display = 'none'; return; }
      if (d._t !== a.say.text || d._a !== a.id) { d.innerHTML = ''; if (a.kimlik && a.kimlik.ad) { const b = document.createElement('b'); b.textContent = a.kimlik.ad; d.appendChild(b); } d.appendChild(document.createTextNode(a.say.text)); d._t = a.say.text; d._a = a.id; } d.style.display = 'block'; d.style.left = ((v.x * .5 + .5) * innerWidth).toFixed(0) + 'px'; d.style.top = ((-v.y * .5 + .5) * innerHeight).toFixed(0) + 'px'; d.style.opacity = Math.min(1, a.say.t * 3, 1.4 - a.dist / 24).toFixed(2); });
  }

  /* ---------------- gövdeler ---------------- */
  attach(a) {
    const tpl = this.templates.get(a.def); let b;
    if (tpl) { const root = cloneSkinned(tpl.scene); root.scale.multiplyScalar(a.height / tpl.height); const clips = {}; for (const c of tpl.clips) clips[c.name] = c; b = { root, mixer: new THREE.AnimationMixer(root), clip: n => clips[tpl.map[n] || n] || clips[tpl.map.idle || 'idle'], glb: tpl }; }
    else { a.geo ||= buildGeometry(a.outfit, a.build); const inst = createInstance(a.geo, this.material); inst.root.scale.setScalar(a.scale); const set = clipsFor(a.family); b = { root: inst.root, mixer: new THREE.AnimationMixer(inst.root), clip: n => set[n] || set.idle }; inst.mesh.receiveShadow = true; }
    b.actions = {}; b.cur = null; b.skip = 0; b.shadow = null; this.group.add(b.root); a.body = b;
  }
  detach(a) { const b = a.body; b.mixer.stopAllAction(); this.group.remove(b.root); a.body = null; }
  setAnim(a) {
    const b = a.body, name = a.anim; if (b.name !== name) { const clip = b.clip(name); if (!clip) return; const act = b.actions[name] ||= b.mixer.clipAction(clip); act.reset().setEffectiveWeight(1).play(); if (!b.cur) act.time = a.R() * clip.duration; else if (b.cur !== act) b.cur.crossFadeTo(act, .3, false); b.cur = act; b.name = name; }
    if (b.cur) { const moving = name === 'walk' || name === 'run' || name === 'carry_walk'; const nat = b.glb ? b.glb.walkSpeed * (name === 'run' ? 2.4 : 1) : (b.cur.getClip().userData.speed || 1) * a.scale; b.cur.timeScale = moving ? Math.max(.55, Math.min(1.7, a.animScale / nat)) : 1; }
  }
}

/** SkinnedMesh içeren bir sahneyi, her kopyanın kendi iskeleti olacak şekilde çoğaltır */
function cloneSkinned(src) {
  const clone = src.clone(true); const map = new Map(); const walk = (a, b) => { map.set(a, b); for (let i = 0; i < a.children.length; i++) walk(a.children[i], b.children[i]); }; walk(src, clone);
  src.traverse(s => { if (!s.isSkinnedMesh) return; const c = map.get(s); c.skeleton = s.skeleton.clone(); c.skeleton.bones = s.skeleton.bones.map(bn => map.get(bn)); c.bind(c.skeleton, s.bindMatrix); });
  return clone;
}
