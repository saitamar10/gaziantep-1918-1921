// BÖLÜM 2 — MAYIS 1920 · "Ateş Çemberi" (docs/hikaye-ana-dosya.md §6, src/data/scenes.js b2s1–b2s3).
// Üç sahne, üç karakter (hepsi kurmaca):
//   1) Haberci: fişek sandığını şehirden çıkarır.
//   2) Mahalle savunmacısı: Sarımsak Tepe'de siperi savunur (çatışma), yaralı arkadaşını geri taşır.
//   3) Gönüllü yardımcı: bombardıman altındaki mahallede insanları mahzene yollar, enkazdan yaralı çıkarır, yara sarar, su dağıtır.
// TARİHÎ DAYANAK: Mayıs 1920'de tepeler için çatışmalar; 24 Mayıs bombardımanı; Karayılan'ın (Molla Mehmet) Sarımsak Tepe'de şehadeti.
// SABİT: Karayılan'ın şehadeti değiştirilemez; tepe "kazanılmaz", sahne çekilme emriyle biter.
// KURGU: konuşmalar (Karayılan'a yazılan sözler dahil), savunmacılar, yaralılar, sahnelerin ayrıntısı.
// VARSAYIM: Sarımsak Tepe'nin konumu ve siper düzeni; tarih kaynaklarda ayrışıyor (bkz. hikâye dosyası §11).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from '../core/MapCoordinates.js';
import { SARIMSAK } from '../world/Terrain.js';

const DATE = { y: 1920, m: 5, d: 24 };

export class Bolum2 {
  constructor({ world, npcs, prolog, story, combat, bolum1, sfx, camera }) { Object.assign(this, { world, npcs, prolog, story, combat, bolum1, sfx, camera }); this.shellT = 6; this.puffs = []; this.shake = 0; this.R = rng(2405); }

  init() {
    const W = this.world, N = this.npcs, H = W.hero, P = N.heroPoint, T = W.mats.tex, C = W.collision, CB = this.combat;
    const M = (tex, color) => { const m = new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normalMap, roughnessMap: tex.roughnessMap, roughness: 1, metalness: 0, color, envMapIntensity: .5 }); N.onMaterial(m); return m; };
    this.mat = { stone: M(T.stone2, '#cfc3a6'), rock: M(T.stone2, '#9a9282') };
    this.group = new THREE.Group(); this.group.name = 'Bolum2'; W.root.add(this.group); this.cityGroup = new THREE.Group(); W.root.add(this.cityGroup);
    /* ---------- Sarımsak Tepe: siper yayı kuzeydoğuya (şehrin aksi yönüne) bakar ---------- */
    // Siper tepenin doruğunda değil ön yamacında (R0 m aşağıda): dorukta durunca yamaç tümsekten görünmez, ateş hattı kesilir.
    const R0 = 62; const c = SARIMSAK, u = [.6, -.8], rot = (a, r) => { const cs = Math.cos(a), sn = Math.sin(a); return { x: c.x + (u[0] * cs - u[1] * sn) * r, z: c.z + (u[0] * sn + u[1] * cs) * r }; };
    const face = Math.atan2(u[0], u[1]), g = (p) => W.groundAt(p.x, p.z), R = this.R; const geos = [], rocks = [];
    const B = (arr, sx, sy, sz, x, y, z, ry) => { const b = new THREE.BoxGeometry(sx, sy, sz); b.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - .5) * .12, ry, (R() - .5) * .12)), new THREE.Vector3(1, 1, 1))); arr.push(b); };
    this.cols = [];
    for (let m = -14; m <= 14.01; m += .92) { const a = m / R0; const p = rot(a, R0), y = g(p); if (Math.abs(m) < .8) continue;   /* ortada dar geçit */
      B(geos, .9, .42, .5, p.x, y + .2, p.z, R() * 3); B(geos, .8, .36, .46, p.x + (R() - .5) * .2, y + .58, p.z + (R() - .5) * .2, R() * 3); if (R() < .6) B(geos, .6, .3, .4, p.x, y + .9, p.z, R() * 3);
      CB.addCover(p.x, p.z, .7); const t = C.addToggle(p.x, p.z, .5); this.cols.push(t); }
    const wall = new THREE.Mesh(mergeGeometries(geos), this.mat.stone); wall.castShadow = wall.receiveShadow = true; this.group.add(wall);
    // düşmanın sıçradığı kayalar (siper noktaları) ve çıkış noktaları
    this.lanes = [-.36, -.12, .12, .36].map(a => [R0 + 75, R0 + 47, R0 + 25].map(r => { const p = rot(a + (R() - .5) * .1, r + (R() - .5) * 6); const s = new THREE.DodecahedronGeometry(.75 + R() * .35, 0); s.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p.x, g(p) + .35, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(R(), R() * 3, R())), new THREE.Vector3(1.3, .8, 1))); rocks.push(s); const q = rot(a, r + 1.4); return { x: q.x, z: q.z }; }));
    const rk = new THREE.Mesh(mergeGeometries(rocks), this.mat.rock); rk.castShadow = rk.receiveShadow = true; this.group.add(rk);
    this.spawns = [-.32, 0, .32].map(a => rot(a, R0 + 112));
    const post = rot(2.6 / R0, R0 - 1.7), rear = rot(0, R0 - 28), yawOut = face;
    this.pt = { post: { ...post, yaw: Math.atan2(-u[0], -u[1]) + Math.PI }, rear, cikis: (() => { const [X, Z] = H.w(H.cx(-100), -106); return { x: X, z: Z }; })(), enkaz: (() => { const [X, Z] = H.w(H.xr(-60) - 1.8, -60); return { x: X, z: Z }; })(), sargi: this.story.place.center, cesme: N.spot.fountain || (() => { const [X, Z] = H.w(H.cx(-24), -24); return { x: X, z: Z }; })(), sokak: (() => { const [X, Z] = H.w(H.cx(-30), -30); return { x: X, z: Z, yaw: 0 }; })() };
    this.pt.post.yaw = Math.atan2(-u[0], -u[1]);   /* oyuncu kuzeydoğuya bakar (kamera -z'ye doğru bakar: yaw = atan2(-dx, -dz)) */
    // kişiler
    const S = (def, tag, spot, grp, opt = {}) => spot ? N.addStory(def, tag, spot, { grp, ...opt }) : null; const tufek = { prop: 'rifleh', bandolier: '#6a4a2c' };
    const at = (m, back) => ({ ...rot(m / R0, R0 - back), yaw: yawOut });
    this.karayilan = S('K08', 'karayilan', at(5.6, 1.6), 'b2h', { anim: 'aim', outfit: { prop: 'rifleh' }, kimlik: { ad: 'Karayılan', cemaat: 'Türk', meslek: 'Molla Mehmet', etiket: 'Karayılan (Molla Mehmet)' } });
    this.allies = [S('K02', 'b2a', at(-9.5, 1.5), 'b2h', { anim: 'kneelaim', outfit: tufek }), S('K01', 'b2a', at(-5.5, 1.5), 'b2h', { anim: 'kneelaim', outfit: tufek }), S('K08', 'b2a', at(9.5, 1.5), 'b2h', { anim: 'kneelaim', outfit: { prop: 'rifleh' } })];
    this.ally0 = S('K02', 'b2a0', at(-2.6, 1.5), 'b2ha0', { anim: 'kneelaim', outfit: tufek });
    this.yH = { a: S('K02', 'yaraliH', at(-2.6, 2.6), 'b2hy', { anim: 'sit' }), from: at(-2.6, 2.6), to: { x: rear.x + 1.2, z: rear.z, yaw: 0 } };
    const sc = this.pt.sargi, ek = this.pt.enkaz;
    this.yC = { a: S('K11', 'enkaz', { x: ek.x, z: ek.z, yaw: Math.atan2(sc.x - ek.x, sc.z - ek.z) }, 'b2cy', { anim: 'sit' }), from: { x: ek.x, z: ek.z, yaw: 0 }, to: { x: sc.x + 1.5, z: sc.z - .4, yaw: 2.4 } };
    S('K06', 'b2y2', { x: sc.x - 1.4, z: sc.z + .8, yaw: -2.2 }, 'b2c', { anim: 'sit', outfit: { prop: null } });
    // enkaz yığını ve oturma taşları
    { const gs = []; const [lx, lz] = [H.xr(-60) - 1.2, -60]; for (let i = 0; i < 30; i++) { const a = R() * 6.28, r = R() * 1.6, px = lx + Math.cos(a) * r * .7, pz = lz + Math.sin(a) * r; const [X, Z] = H.w(px, pz); const b = new THREE.BoxGeometry(.3 + R() * .5, .2 + R() * .35, .3 + R() * .4); b.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(X, W.groundAt(X, Z) + .15 + (1.6 - r) * .45 * R(), Z), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - .5), R() * 3, (R() - .5))), new THREE.Vector3(1, 1, 1))); gs.push(b); }
      const m = new THREE.Mesh(mergeGeometries(gs), this.mat.stone); m.castShadow = m.receiveShadow = true; this.cityGroup.add(m); const [X, Z] = H.w(lx + .5, lz); this.rubbleCol = C.addToggle(X, Z, 1.0);
      const sg = new THREE.BoxGeometry(.5, .4, .5); for (const s of [this.yH.to, this.yC.from, this.yC.to, { x: sc.x - 1.4, z: sc.z + .8 }]) { const st = new THREE.Mesh(sg, this.mat.stone); st.position.set(s.x, W.groundAt(s.x, s.z) + .2, s.z); st.castShadow = st.receiveShadow = true; (s === this.yH.to ? this.group : this.cityGroup).add(st); } }
    // patlama tozu
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: '#b8a98a', transparent: true, opacity: 0, depthWrite: false })); m.visible = false; W.root.add(m); this.puffs.push({ m, t: 0 }); }
    this.steps = this.build(); const ix = f => this.steps.findIndex(f); this.ix = { hill: ix(s => s.id === 'hill'), c1: ix(s => s.id === 'c1'), c2: ix(s => s.id === 'c2'), city: ix(s => s.id === 'city'), shell: ix(s => s.id === 'shell') };
    this.prolog.addChapter('b2', DATE, this.steps, { groups: ['b2h', 'b2ha0', 'b2hy', 'b2c', 'b2cy'], sync: i => this.sync(i), update: (dt, i) => this.update(dt, i), exit: () => this.refresh(-1), talk: a => this.talk(a) });
    this.refresh(-1); return this;
  }

  build() {
    const is = t => a => a.tag === t, pt = this.pt; const sivil = a => !a.story && a.kimlik && a.kimlik.ad && a.family !== 'child' && a.role !== 'esnaf';
    const cfg = (waves, extra = {}) => () => ({ allies: [...this.allies, this.karayilan, this.ally0].filter(a => a && !a.benched && a.anim !== 'down'), spawns: this.spawns, lanes: this.lanes, waves, targetBias: .6, ...extra });
    return [
      { t: 'card', big: 'BÖLÜM 2 · MAYIS 1920', small: 'Ateş Çemberi — tepeler için çatışma' }, { t: 'groups', on: ['b1'] }, { t: 'role', role: 'haberci' },
      { t: 'title', title: 'Sarımsak Tepe\'ye Haber' },
      { t: 'talk', who: is('komutan'), text: 'Kale ucundaki mahalle komutanıyla konuş', line: 'Sarımsak Tepe sıkışmış, fişekleri bitiyor. Bu sandığı şehirden çıkar; ötesini oradakiler taşır.', give: { fisek: 1 } },
      { t: 'goto', p: pt.cikis, r: 4, text: 'Fişek sandığını şehir çıkışına götür', label: 'Şehir çıkışı', take: ['fisek'] },
      { t: 'card', big: 'SARIMSAK TEPE', small: '24 Mayıs 1920 · Bir mahalle savunmacısının gözünden', id: 'hill' }, { t: 'groups', on: ['b2h'], off: ['b1'] }, { t: 'role', role: 'savunmaci', weapon: true, ammo: 30 }, { t: 'tp', p: pt.post, yaw: pt.post.yaw },
      { t: 'title', title: 'Sarımsak Tepe' },
      { t: 'talk', who: is('karayilan'), text: 'Karayılan\'la konuş', line: 'Tepeyi bırakırsak şehir açıkta kalır. Yerine geç; fişeğini sayarak at.' },
      { t: 'combat', id: 'c1', text: 'Siperi savun — ilk hücum (sol tık: ateş, sağ tık: nişan, C: çömel)', cfg: cfg([{ n: 5, gap: 2.6 }], { limit: 150 }), start: pt.post },
      { t: 'talk', who: is('yaraliH'), text: 'Vurulan arkadaşını sırtla', line: 'Omzum… Tüfeği tutamıyorum.', fx: 'pickH' },
      { t: 'goto', p: pt.rear, r: 4, text: 'Onu geriye, yamacın yukarısına taşı', label: 'Geri', fx: 'dropH' },
      { t: 'goto', p: pt.post, r: 3, text: 'Sipere dön', label: 'Siper' },
      { t: 'combat', id: 'c2', text: 'Siperi savun — ikinci hücum', cfg: cfg([{ n: 7, gap: 2.1 }], { limit: 95, onTick: (t) => { if (t > 42 && this.karayilan && this.karayilan.anim !== 'down') { this.karayilan.external = true; this.karayilan.anim = 'down'; this.fallen = true; const al = this.combat.allies.find(q => q.a === this.karayilan); if (al) al.down = true; this.sfx.thud(); } } }), start: pt.post },
      { t: 'card', big: '24 MAYIS 1920', small: 'Karayılan, Sarımsak Tepe\'de şehit düştü.', dur: 7 }, { t: 'wait', dur: 7 },
      { t: 'goto', p: pt.rear, r: 5, text: 'Çekilme emri geldi — tepeden in', label: 'Çekil' },
      { t: 'card', big: 'BOMBARDIMAN', small: 'Aynı gün, şehrin içinde · Bir gönüllü yardımcının gözünden', id: 'city' }, { t: 'groups', on: ['b2c', 'b1'], off: ['b2h'] }, { t: 'role', role: 'yardimci' }, { t: 'tp', p: pt.sokak, yaw: 0 },
      { t: 'title', title: 'Bombardıman Altında', id: 'shell' },
      { t: 'talkN', who: sivil, n: 3, send: true, text: 'Sokaktaki üç kişiyi mahzene yolla', line: 'Mahzene iniyorum. Allah razı olsun.', again: 'İniyorum, iniyorum!' },
      { t: 'goto', p: pt.enkaz, r: 3.5, text: 'Yıkılan evin enkazına git', label: 'Enkaz' },
      { t: 'talk', who: is('enkaz'), text: 'Enkazdaki kadını çıkar ve sırtla', line: 'Ayağım sıkıştı… Çek, ne olur!', fx: 'pickC' },
      { t: 'goto', p: pt.sargi, r: 3.2, text: 'Onu bahçedeki sargı yerine götür', label: 'Sargı yeri', fx: 'dropC' },
      { t: 'talk', who: is('sargici'), text: 'Sargıcı kadından temiz bez al', line: 'Kaynattım, kuruttum. İkisini al; boşa harcama.', give: { bez: 2 } },
      { t: 'talk', who: is('enkaz'), text: 'Kadının yarasını sar', need: { bez: 1 }, fail: 'Önce temiz bez bul.', line: 'Sıktın… ama kan durdu.' },
      { t: 'talk', who: is('b2y2'), text: 'Öbür yaralının yarasını sar', need: { bez: 1 }, fail: 'Önce temiz bez bul.', line: 'Eline sağlık, kardeş.' },
      { t: 'goto', p: pt.cesme, r: 3, text: 'Çeşmeden su doldur', label: 'Çeşme', give: { su: 3 } },
      { t: 'talkN', who: a => !!(a.kimlik && a.kimlik.ad) && a.family !== 'child', n: 3, need: { su: 1 }, fail: 'Testin boş; önce çeşmeye git.', text: 'Üç kişiye su ver', line: 'Bir yudum su… Allah senden razı olsun.', again: 'Sağ ol, içtim.' },
      { t: 'card', big: 'Ateş çemberi daralıyordu.', small: 'Bölüm 2 tamamlandı' }
    ];
  }

  talk(a) { if (a.tag === 'karayilan') return this.fallen ? null : 'Gözün ileride olsun.'; if (a.tag === 'b2a' || a.tag === 'b2a0') return 'Fişek az. Boşa atma.'; if (a.tag === 'sargici') return 'Bez az, su az. Elimizdekiyle idare edeceğiz.'; return null; }

  /** adım ilerledikçe sahneyi güncelle */
  sync(i) {
    const S = this.steps, done = fx => { const k = S.findIndex(s => s.fx === fx); return k >= 0 && k < i; }, X = this.ix; const inHill = i > X.hill && i <= X.city, inCity = i > X.city;
    const after1 = i > X.c1, carryH = done('pickH') && !done('dropH'), carryC = done('pickC') && !done('dropC');
    const mv = (y, dropped) => { if (!y.a) return; const spot = dropped ? y.to : y.from; if (y.a.o.spot !== spot) { y.a.o.spot = spot; y.a.x = spot.x; y.a.z = spot.z; y.a.yaw = spot.yaw || 0; y.a.tasks.length = 0; if (y.a.body) this.npcs.detach(y.a); } };
    mv(this.yH, done('dropH')); mv(this.yC, done('dropC'));
    this.npcs.setGroup('b2ha0', inHill && !after1); this.npcs.setGroup('b2hy', inHill && after1 && !carryH); this.npcs.setGroup('b2cy', inCity && !carryC);
    this.fallen = i > X.c2; if (this.karayilan) { this.karayilan.external = this.fallen; this.karayilan.anim = this.fallen ? 'down' : 'aim'; }
    this.prolog.setCarry(carryH || carryC); this.refresh(i);
  }
  refresh(i) { const X = this.ix || {}, on = this.prolog.ch === 'b2'; const hill = on && i > X.hill && i <= X.city, city = on && i > X.city; this.group.visible = on; this.cityGroup.visible = city; this.cols.forEach(c => c.off = !on); this.rubbleCol.off = !city; this.shelling = on && i >= X.shell && i < this.steps.length - 1; }

  /** bombardıman: rastgele bir noktaya top mermisi düşer (ıslık, patlama, toz, sarsıntı). Yakına düşerse oyuncu yaralanır. */
  update(dt, i) {
    for (const p of this.puffs) if (p.t > 0) { p.t -= dt; const k = 1 - p.t / 2.2; p.m.scale.setScalar(1.5 + k * 9); p.m.material.opacity = Math.max(0, .55 * (1 - k)); if (p.t <= 0) p.m.visible = false; }
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt * 1.4); const s = this.shake * this.shake * .12; this.camera.position.x += (Math.random() - .5) * s; this.camera.position.y += (Math.random() - .5) * s; }
    if (!this.shelling) return; this.shellT -= dt; if (this.pending) { this.pending.t -= dt; if (this.pending.t <= 0) { const q = this.pending; this.pending = null; const P = this.prolog.player.pos, d = Math.hypot(q.x - P.x, q.z - P.z); const pf = this.puffs.find(p => p.t <= 0) || this.puffs[0]; pf.m.position.set(q.x, this.world.groundAt(q.x, q.z) + 1.2, q.z); pf.m.visible = true; pf.t = 2.2; this.shake = Math.max(this.shake, Math.min(1, 26 / (d + 6))); if (d < 7) this.combat.damage(25); } }
    if (this.shellT <= 0 && !this.pending) { this.shellT = 6 + this.R() * 8; const P = this.prolog.player.pos, a = this.R() * 6.28, r = 16 + this.R() * 50; const q = { x: P.x + Math.cos(a) * r, z: P.z + Math.sin(a) * r, t: .95 }; this.pending = q; this.sfx.shell(Math.max(.15, Math.min(1, 22 / r))); }
  }
}
