// BÖLÜM 3 — HAZİRAN 1920 · "Kırılgan Ateşkes" (docs/hikaye-ana-dosya.md §6, src/data/scenes.js b3s1–b3s3).
// TARİHÎ DAYANAK: 30 Mayıs 1920'de kısa süreli ateşkes; uzun süreli barış getirmez, çatışmalar Haziran'da yeniden başlar
//   (ana hikâyede Haziran başı, bir kaynakta 17 Haziran).
// KURGU: sağlık yerindeki yaralılar, hasarlı evlerdeki aileler, depo sayımı ve bütün konuşmalar.
// EKSİK: yönergedeki Bekirbey Camii haritada yok ve sağlık yeri olarak kullanıldığı kaynakla doğrulanmadı; sahne şimdilik
//   bahçedeki sargı yerinde geçer ve camiye ad verilmez.
// Ateşkes sürerken uzaktan silah sesleri susar (prolog.quiet); haber sahnesiyle birlikte geri gelir.
import * as THREE from 'three';

const DATE = { y: 1920, m: 5, d: 30 };

export class Bolum3 {
  constructor({ world, npcs, prolog, story }) { Object.assign(this, { world, npcs, prolog, story }); }
  init() {
    const W = this.world, N = this.npcs, H = W.hero, P = N.heroPoint, c = this.story.place.center;
    const S = (def, tag, spot, grp, opt = {}) => spot ? N.addStory(def, tag, spot, { grp, ...opt }) : null;
    const mat = new THREE.MeshStandardMaterial({ color: '#cfc3a6', roughness: 1 }); N.onMaterial(mat); this.seats = new THREE.Group(); W.root.add(this.seats); const sg = new THREE.BoxGeometry(.5, .4, .5);
    [['K02', 2.0, .3, 2.3], ['K06', -1.9, .6, -2.2], ['K01', .4, 2.1, 3.0]].forEach(([d, dx, dz, yaw]) => { const s = { x: c.x + dx, z: c.z + dz, yaw }; if (W.collision.blocked(s.x, s.z, .3)) return; S(d, 'b3y', s, 'b3', { anim: 'sit', outfit: { prop: null } }); const m = new THREE.Mesh(sg, mat); m.position.set(s.x, W.groundAt(s.x, s.z) + .2, s.z); m.castShadow = m.receiveShadow = true; this.seats.add(m); });
    S('K03', 'aile1', P(H.xl(-36) + .8, -36, 1, 0), 'b3', { outfit: { prop: null } }); S('K12', 'aile2', P(H.xr(-70) - .8, -70, -1, 0), 'b3');
    const hp = (x, z) => { const [X, Z] = H.w(x, z); return { x: X, z: Z }; }; this.pt = { cesme: N.spot.fountain || hp(H.cx(-24), -24), depo: hp(H.cx(0), 2) };
    this.steps = this.build(); this.iBreak = this.steps.findIndex(s => s.id === 'break');
    this.prolog.addChapter('b3', DATE, this.steps, { groups: ['b3'], sync: i => this.sync(i), exit: () => this.sync(-1) });
    this.sync(-1); return this;
  }
  build() {
    const is = t => a => a.tag === t, usta = a => a === this.prolog.usta, pt = this.pt;
    return [
      { t: 'card', big: 'BÖLÜM 3 · HAZİRAN 1920', small: 'Kırılgan Ateşkes — 30 Mayıs 1920, silahlar sustu' }, { t: 'groups', on: ['b1', 'b3'] }, { t: 'role', role: 'yardimci' },
      { t: 'title', title: 'Sağlık Yeri' },
      { t: 'talk', who: is('sargici'), text: 'Bahçedeki sargıcı kadınla konuş', line: 'Silahlar sustu ama yaralar susmadı. Al şu bezleri; sırayla sar.', give: { bez: 3 } },
      { t: 'talkN', who: is('b3y'), n: 3, need: { bez: 1 }, fail: 'Bezin kalmadı; sargıcıdan iste.', text: 'Üç yaralının yarasını sar', line: 'Eline sağlık. Dün gece hiç uyuyamadım.', again: 'Sardın ya, sağ ol.' },
      { t: 'goto', p: pt.cesme, r: 3, text: 'Çeşmeden su doldur', label: 'Çeşme', give: { su: 3 } },
      { t: 'talkN', who: is('b3y'), n: 3, need: { su: 1 }, fail: 'Testin boş; önce çeşmeye git.', text: 'Yaralılara su ver', line: 'Su… Allah razı olsun.', again: 'İçtim, sağ ol.' },
      { t: 'title', title: 'Nefes' },
      { t: 'talk', who: is('aile1'), send: true, text: 'Hasarlı evdeki aileyi dışarı çıkar', line: 'Tavan çatladı diyorsun… Çıkıyoruz, komşuya geçeriz.' },
      { t: 'talk', who: is('aile2'), send: true, text: 'Öbür hasarlı evdeki yaşlı kadını çıkar', line: 'Elli yıllık evim… Peki evladım, çıkayım.' },
      { t: 'goto', p: pt.depo, r: 3.5, text: 'Sokağın başındaki erzak deposuna git', label: 'Erzak deposu' },
      { t: 'talk', who: usta, text: 'Depoda ne kaldığını ustaya sor', line: 'Bulgur var, un az, yağ hiç yok. Ateşkes uzarsa belki yol açılır.' },
      { t: 'card', big: 'ATEŞKES BOZULDU', small: 'Haziran 1920 · Çatışmalar yeniden başlıyor', id: 'break' }, { t: 'role', role: 'haberci' },
      { t: 'title', title: 'Yeniden' },
      { t: 'talkN', who: is('savunmaci'), n: 3, text: 'Haberi üç nöbet yerine ulaştır', line: 'Anlaşıldı. Herkes yerine!', again: 'Duydum, hazırız.' },
      { t: 'talk', who: is('komutan'), text: 'Mahalle komutanına bildir', line: 'Bir nefes aldık, o kadar. Şimdi yeniden.' },
      { t: 'card', big: 'Barış gelmemişti.', small: 'Bölüm 3 tamamlandı' }
    ];
  }
  sync(i) { const on = this.prolog.ch === 'b3'; this.seats.visible = on; if (on) this.prolog.quiet = i <= this.iBreak; else if (this.prolog.quiet && i === -1) this.prolog.quiet = false; }
}
