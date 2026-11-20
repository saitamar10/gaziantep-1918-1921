// BÖLÜM 1 — NİSAN 1920 · "Şehir Ayağa Kalkıyor" (docs/hikaye-ana-dosya.md §6).
// 1 Nisan 1920: şehir içi direniş başlar. Oyuncu artık haberci olan çıraktır (kurmaca).
// TARİHÎ DAYANAK: 1 Nisan 1920'de savaşın şehre taşınması; sokaklara barikat kurulması, evler arasında geçişler açılması,
//   yedi cephe ve 27 semt teşkilatı (ana hikâye dosyası; chronology.js 'direnis').
// KURGU: mahalle komutanı, savunmacılar, yaralılar, kılavuz ve bütün konuşmalar; barikatların ve nöbet yerlerinin konumu.
// SINIRLAR: çatışma oynatılmaz (yalnız uzaktan silah sesi). Mazgal ve duvar delikleri yok; "gizli geçit" bahçe kapısı ve kabaltıdır.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from '../core/MapCoordinates.js';

const DATE = { y: 1920, m: 4, d: 1 };

export class Bolum1 {
  constructor({ world, npcs, prolog, story }) { Object.assign(this, { world, npcs, prolog, story }); this.siege = false; this.bars = []; }

  init() {
    const W = this.world, N = this.npcs, H = W.hero, P = N.heroPoint, T = W.mats.tex;
    const M = (tex, color, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normalMap, roughnessMap: tex.roughnessMap, roughness: 1, metalness: 0, color, envMapIntensity: .5, ...o }); N.onMaterial(m); return m; };
    this.mat = { stone: M(T.stone2, '#d9cdb0'), wood: M(T.wood, '#8a6a48'), sack: M(T.flat, '#cbb995') };
    this.group = new THREE.Group(); this.group.name = 'Bolum1'; H.group.add(this.group);
    // barikatlar: çarşı ucu ve kabaltı önü hazır kurulu; kale ucundaki oyuncunun taşıdığı taşlarla yükselir
    this.bars.push(this.barricade(6.5, 11), this.barricade(-52.5, 12, { narrow: true }), this.barricade(-97, 13, { buildable: true }));
    this.build = this.bars[2];
    // taş yığını ve oturma taşları
    this.pile = this.rubble(H.xr(-82) - 1.3, -82, 14);
    const hp = (x, z) => { const [X, Z] = H.w(x, z); return { x: X, z: Z }; };
    this.pt = { yigin: hp(H.xr(-82) - 2.2, -82), barikat: hp(H.cx(-97) - 1.6, -95.4), carsi: hp(H.cx(4), 4.6), kabalti: hp(H.cx(-50), -50.4), kale: hp(H.cx(-97), -95), kapi: this.story.place.out, sargi: this.story.place.center };
    // kişiler
    const S = (def, tag, spot, grp, opt = {}) => spot ? N.addStory(def, tag, spot, { grp, ...opt }) : null; const tufek = { prop: 'rifle', bandolier: '#6a4a2c' };
    this.komutan = S('K08', 'komutan', P(H.xl(-92) + .9, -92, 1, 0), 'b1');
    S('K02', 'savunmaci', P(H.cx(4.8) - 1.9, 4.8, 0, 1), 'b1', { anim: 'guard', outfit: tufek }); S('K08', 'savunmaci', P(H.cx(4.8) + 1.9, 4.6, 0, 1), 'b1', { anim: 'guard' });
    S('K02', 'savunmaci', P(H.cx(-50.8) + 1.2, -50.8, 0, -1), 'b1', { anim: 'guard', outfit: tufek }); S('K01', 'savunmaci', P(H.cx(-95) + 1.8, -95, 0, -1), 'b1', { anim: 'guard', outfit: tufek });
    this.kilavuz = S('K02', 'kilavuz', this.story.place.lookout, 'b1');
    const y1 = P(H.xr(1.5) - .8, 1.5, -1, 0), y2 = P(H.xl(-41) + .8, -41, 1, 0); const c = this.pt.sargi;
    this.yarali = [{ a: S('K02', 'yarali1', y1, 'b1y1', { anim: 'sit' }), from: y1, to: { x: c.x + 1.4, z: c.z + .6, yaw: 2.2 } }, { a: S('K06', 'yarali2', y2, 'b1y2', { anim: 'sit', outfit: { prop: null } }), from: y2, to: { x: c.x - 1.3, z: c.z + .9, yaw: -2.2 } }];
    S('K12', 'sargici', { x: c.x, z: c.z - 1.2, yaw: 0 }, 'b1', { anim: 'interact' });
    // oturma taşları (yaralılar yere değil taşa oturur)
    const sg = new THREE.BoxGeometry(.5, .4, .5); this.seats = new THREE.Group(); W.root.add(this.seats);
    for (const y of this.yarali) for (const s of [y.from, y.to]) { if (!s) continue; const m = new THREE.Mesh(sg, this.mat.stone); m.position.set(s.x - Math.sin(s.yaw || 0) * .1, W.groundAt(s.x, s.z) + .2, s.z - Math.cos(s.yaw || 0) * .1); m.rotation.y = s.yaw || 0; m.castShadow = m.receiveShadow = true; this.seats.add(m); }
    this.prolog.addChapter('b1', DATE, this.steps(), { groups: ['b1', 'b1y1', 'b1y2'], sync: i => this.sync(i), exit: () => this.refresh() });
    this.refresh(); return this;
  }

  steps() {
    const is = t => a => a.tag === t, usta = a => a === this.prolog.usta, pt = this.pt; const tas = n => [
      { t: 'goto', p: pt.yigin, r: 2.6, text: `Yığından taş al (${n}/3)`, label: 'Taş yığını' }, { t: 'goto', p: pt.barikat, r: 3, text: `Taşı barikata götür (${n}/3)`, label: 'Barikat', fx: 'grow' }];
    return [
      { t: 'card', big: 'BÖLÜM 1 · NİSAN 1920', small: 'Şehir Ayağa Kalkıyor — 1 Nisan 1920, savaş şehrin içine taşınıyor' }, { t: 'groups', on: ['b1', 'b1y1', 'b1y2'] },
      { t: 'title', title: 'Şehir Ayağa Kalkıyor' },
      { t: 'talk', who: usta, text: 'Ustanla konuş', line: 'Dükkân kapalı artık, çırak. Bugünden sonra habercisin. Şu pusulayı kale ucundaki mahalle komutanına götür.' },
      { t: 'talk', who: is('komutan'), text: 'Pusulayı mahalle komutanına ulaştır', line: 'Heyetten mi? İyi. Bu ucu kapatacağız; elin boş durmasın, yığından taş taşı.' },
      { t: 'title', title: 'Barikat' }, ...tas(1), ...tas(2), ...tas(3),
      { t: 'talk', who: is('komutan'), text: 'Komutana haber ver', line: 'Oldu bu. Geçmek isteyen düşünsün.' },
      { t: 'title', title: 'Yaralılar' },
      { t: 'talk', who: is('yarali1'), text: 'Çarşı ucundaki yaralıyı sırtla', line: 'Bacağım… Beni burada bırakma.', fx: 'pick1' },
      { t: 'goto', p: pt.sargi, r: 3.2, text: 'Yaralıyı bahçedeki sargı yerine götür', label: 'Sargı yeri', fx: 'drop1' },
      { t: 'talk', who: is('yarali2'), text: 'Kabaltı yanındaki yaralıyı sırtla', line: 'Kolumdan vuruldum. Yürürüm ama düşerim.', fx: 'pick2' },
      { t: 'goto', p: pt.sargi, r: 3.2, text: 'Onu da sargı yerine götür', label: 'Sargı yeri', fx: 'drop2' },
      { t: 'title', title: 'Gizli Geçişler' },
      { t: 'talk', who: is('kilavuz'), text: 'Bahçe kapısındaki kılavuzla konuş', line: 'Sokaktan gidersen görürler. Bahçelerin içinden, kabaltının altından geçeceksin. Aklında tut.' },
      { t: 'goto', p: pt.sargi, r: 4, text: 'Bahçe geçidinden geç', label: 'Bahçe geçidi' },
      { t: 'goto', p: pt.kabalti, r: 3, text: 'Kabaltının altındaki geçidi öğren', label: 'Kabaltı' },
      { t: 'title', title: 'Savunma Hatları' },
      { t: 'goto', p: pt.carsi, r: 3.5, text: 'Çarşı ucundaki siperi gör', label: 'Çarşı ucu siperi' },
      { t: 'goto', p: pt.kabalti, r: 3, text: 'Kabaltı nöbetini gör', label: 'Kabaltı nöbeti' },
      { t: 'goto', p: pt.kale, r: 3.5, text: 'Kale ucundaki barikata dön', label: 'Kale ucu barikatı' },
      { t: 'talk', who: is('komutan'), text: 'Gördüklerini komutana bildir', line: 'Yedi cephe, yirmi yedi semt… Herkes kendi sokağını tutacak. Sen haberi taşıyacaksın.' },
      { t: 'card', big: 'Şehir ayağa kalktı.', small: 'Bölüm 1 tamamlandı' }
    ];
  }

  /** adım ilerledikçe sahneyi güncelle: barikatın yüksekliği, yaralıların yeri */
  sync(i) {
    const S = this.prolog.chapters.b1, done = fx => { const k = S.findIndex(s => s.fx === fx); return k >= 0 && k < i; };
    this.stage = S.slice(0, i).filter(s => s.fx === 'grow').length;
    this.yarali.forEach((y, n) => { if (!y.a) return; const picked = done('pick' + (n + 1)), dropped = done('drop' + (n + 1)); const spot = dropped ? y.to : y.from;
      if (y.a.o.spot !== spot) { y.a.o.spot = spot; y.a.x = spot.x; y.a.z = spot.z; y.a.yaw = spot.yaw || 0; y.a.tasks.length = 0; if (y.a.body) this.npcs.detach(y.a); }
      this.carry = (this.carry || [false, false]); this.carry[n] = picked && !dropped; });
    if (this.prolog.ch === 'b1') this.prolog.setCarry(this.carry.some(Boolean));
    this.refresh();
  }
  setSiege(on) { this.siege = on; this.refresh(); }
  /** görünürlük ve çarpışma: kuşatma boyunca barikatlar durur; Bölüm 1 oynanırken kale ucundaki barikat adım adım yükselir */
  refresh() {
    const inB1 = this.prolog.ch === 'b1', vis = this.siege || inB1; this.group.visible = vis; this.seats.visible = inB1;
    for (const b of this.bars) { const st = b.buildable && inB1 ? (this.stage || 0) : 3; b.layers.forEach((l, k) => l.visible = k < st); b.col.forEach(c => c.off = !(vis && st >= 2)); }
    this.pile.visible = inB1; this.pileCol.off = !inB1;
    if (inB1 && this.carry) this.carry.forEach((c, n) => this.npcs.setGroup('b1y' + (n + 1), !c));   // sırtlanan yaralı sokakta görünmez
  }

  /* ---------------- geometri ---------------- */
  /** kahraman sokak yerel z konumunda sokağı kapatan barikat (3 katman). Ortada dar bir geçit kalır: sakinler ve oyuncu oradan geçer. */
  barricade(z, seed, { narrow = false, buildable = false } = {}) {
    const H = this.world.hero, R = rng(seed), C = this.world.collision; const xl = H.xl(z) + .15, xr = H.xr(z) - .15, cx = H.cx(z), g = narrow ? 1.3 : 1.6;
    const y0 = (x, zz) => H.g(x, zz); const L = [{ stone: [], wood: [], sack: [] }, { stone: [], wood: [], sack: [] }, { stone: [], wood: [], sack: [] }];
    const box = (arr, sx, sy, sz, x, y, zz, ry = 0, rz = 0) => { const q = new THREE.BoxGeometry(sx, sy, sz); q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, zz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), new THREE.Vector3(1, 1, 1))); arr.push(q); };
    const blob = (arr, r, x, y, zz, sy = .6) => { const q = new THREE.SphereGeometry(r, 8, 6); q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, zz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R() * 3, 0)), new THREE.Vector3(1.35, sy, .85))); arr.push(q); };
    const col = [];
    for (const [x0, x1] of [[xl, cx - g / 2], [cx + g / 2, xr]]) { const w = x1 - x0; if (w < .5) continue;
      for (let x = x0 + .25; x < x1 - .1; x += .5 + R() * .12) { const gy = y0(x, z);
        box(L[0].stone, .46 + R() * .1, .34 + R() * .1, .42 + R() * .14, x, gy + .19, z + (R() - .5) * .16, (R() - .5) * .4); box(L[0].stone, .4 + R() * .12, .3, .4, x + .05, gy + .2, z + .46 + (R() - .5) * .1, (R() - .5) * .5);
        box(L[1].stone, .44 + R() * .1, .32 + R() * .08, .4 + R() * .1, Math.min(x1 - .25, x + .2), gy + .55, z + .12 + (R() - .5) * .14, (R() - .5) * .5);
        if (R() < .75) blob(L[2].sack, .26, x, gy + .93, z + .14 + (R() - .5) * .1); }
      const mid = (x0 + x1) / 2, gm = y0(mid, z);
      box(L[1].wood, w * .94, .14, .16, mid, gm + .78, z - .2, 0, (R() - .5) * .06); box(L[1].wood, .12, 1.25, .12, x0 + .2, gm + .62, z - .28, 0, .1); box(L[1].wood, .12, 1.25, .12, x1 - .2, gm + .62, z - .28, 0, -.1);
      box(L[2].wood, w * .7, .05, .8, mid, gm + 1.02, z - .3, (R() - .5) * .2, 0); box(L[2].stone, .46, .36, .42, mid + (R() - .5) * w * .4, gm + .98, z + .1, .4);
      for (let x = x0 + .3; x <= x1 - .15; x += .5) { const [X, Z] = H.w(x, z + .15); col.push(C.addToggle(X, Z, .45)); } }
    const group = new THREE.Group(); const layers = L.map(l => { const lg = new THREE.Group(); for (const k of ['stone', 'wood', 'sack']) { if (!l[k].length) continue; const geo = mergeGeometries(l[k]); l[k].forEach(q => q.dispose()); const m = new THREE.Mesh(geo, this.mat[k]); m.castShadow = m.receiveShadow = true; lg.add(m); } group.add(lg); return lg; });
    this.group.add(group);
    return { group, layers, col, buildable, z };
  }
  /** taş yığını */
  rubble(x, z, seed) { const H = this.world.hero, R = rng(seed), geos = []; for (let i = 0; i < 22; i++) { const a = R() * 6.28, r = R() * 1.0, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r * .8; const b = new THREE.BoxGeometry(.3 + R() * .3, .22 + R() * .2, .28 + R() * .25);
      b.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(px, H.g(px, pz) + .14 + (1 - r) * .5 * R(), pz), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - .5) * .5, R() * 3, (R() - .5) * .5)), new THREE.Vector3(1, 1, 1))); geos.push(b); }
    const m = new THREE.Mesh(mergeGeometries(geos), this.mat.stone); geos.forEach(q => q.dispose()); m.castShadow = m.receiveShadow = true; this.group.add(m); const [X, Z] = H.w(x, z); this.pileCol = this.world.collision.addToggle(X, Z, .9); return m; }
}
