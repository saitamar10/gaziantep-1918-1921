// PROLOG — "Direnişten önce Antep" (docs/hikaye-ana-dosya.md §4): Görev 0.1–0.5.
// Oyuncu bir dükkân çırağıdır (kurmaca). Bölümler tarihe bağlıdır; Günlük'ten o güne geçmek bölümü açar, bölüm bitince tarih kendiliğinden ilerler:
//   17 Aralık 1918 → 0.1 Son Normal Gün, 0.2 Yabancı Askerler
//   25 Ekim 1919   → 0.3 Bayrak Değişiyor, 0.4 Gizli Haber
//   23 Kasım 1919  → 0.5 Halk Toplantısı   → ardından Kasım 1919 "Gizli Toplantı" (Story.js)
// TARİHÎ DAYANAK: işgal ve devir tarihleri, 23 Kasım 1919 toplantısı ve çağrıyı Cemiyet-i İslamiye'nin yapması (chronology.js).
// KURGU: çırak, usta, fırıncı, haber taşınan kişiler, bütün konuşmalar ve hatibin sözleri. Gerçek kişilere söz atfedilmez.
// VARSAYIM: İngiliz askerinin görünüşü (K15 yer tutucu) ve kontrol noktasının yeri.
import * as THREE from 'three';
import { L } from '../data/historicalReferences.js';
import { yolTarifi } from './hints.js';
import { KARAKTERLER } from '../data/scenes.js';

const key = d => d.y * 10000 + d.m * 100 + d.d;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const D = { a: { y: 1918, m: 12, d: 17 }, b: { y: 1919, m: 10, d: 25 }, c: { y: 1919, m: 11, d: 23 }, heyet: { y: 1919, m: 11, d: 30 } };

export class Prolog {
  constructor({ world, npcs, player, camera, story, setDate }) { Object.assign(this, { world, npcs, player, camera, story, setDate }); this.ch = null; this.prog = { a: 0, b: 0, c: 0 }; this.seen = new Set(); this.marks = []; this.v = new THREE.Vector3(); this.cards = []; this.cardT = 0; this.script = null; this.R = Math.random; this.meta = {}; this.groupsAll = ['p1', 'p2', 'p3', 'p4', 'p5']; this.inv = {}; this.role = null; this.combat = null; this.carrying = false; this.fadeT = 0; }
  /** Yeni bölüm ekler (ana oyun bölümleri bu motoru kullanır). hooks: { groups: [...], sync(i): adım ilerledikçe sahneyi güncelle, exit() } */
  addChapter(k, date, steps, hooks = {}) { this.chapters[k] = steps.filter(Boolean); this.prog[k] = 0; this.meta[k] = { date, ...hooks }; (hooks.groups || []).forEach(g => this.groupsAll.push(g)); }

  init() {
    const N = this.npcs, H = this.world.hero, P = N.heroPoint, C = this.world.collision, nav = N.nav, c = N.center;
    this.usta = N.agents.find(a => a.role === 'esnaf');
    const hp = (x, z) => { const [X, Z] = H.w(x, z); return { x: X, z: Z }; };
    // yerler
    const near = (l, maxR = 70) => { const n = nav.nearest(l.x, l.z, maxR); return n ? { x: n.x, z: n.z } : null; };
    this.pt = { cesme: N.spot.fountain || hp(H.cx(-24), -24), han: near(L.millet), cami: near(L.alauddevle), kontrol: hp(H.cx(0), 6), meydan: near({ x: 160, z: 368 }, 40) };
    // karakterler (gruplar bölüme göre açılır)
    const S = (def, tag, spot, grp, opt = {}) => spot ? N.addStory(def, tag, spot, { grp, ...opt }) : null;
    this.firinci = S('K02', 'firinci', P(H.xr(-10) - .8, -10, -1, 0), 'p1');
    const kp = [P(H.cx(8) - 1.7, 8, 0, -1), P(H.cx(8) + 1.7, 8, 0, -1)];
    kp.forEach(s => S('K15', 'ing', s, 'p2', { anim: 'guard' })); kp.forEach(s => S('K09', 'fr', s, 'p3', { anim: 'guard' }));
    const loop = [0, 1, 2, 3].map(() => nav.randomNode(Math.random, c.x, c.z, 130)); for (let i = 0; i < 3; i++) S('K15', 'ing', loop[0], 'p2', { role: 'devriye', loop, node: loop[0], lane: .4 + i * .55 });
    this.ileri1 = S('K01', 'ileri1', P(H.xr(-66) - .8, -66, -1, 0), 'p4'); this.ileri2 = S('K02', 'ileri2', this.story.place.lookout, 'p4');
    // meydan kalabalığı: hatip + yarım ay biçiminde dinleyiciler
    this.crowd = []; const m = this.pt.meydan;
    if (m) { const sp = { x: m.x, z: m.z, yaw: 0 }; for (let k = 0; k < 12 && C.blocked(sp.x, sp.z, .4); k++) { sp.x += 1; }
      this.hatip = S('K01', 'hatip', sp, 'p5', { anim: 'talk_a' }); const defs = ['K02', 'K01', 'K11', 'K02', 'K12', 'K02', 'K04', 'K01', 'K02', 'K11', 'K02', 'K06', 'K02', 'K05', 'K01', 'K02'];
      let i = 0; for (const r of [3.4, 4.9, 6.4]) for (let a = -1.0; a <= 1.01 && i < defs.length; a += r < 4 ? .5 : .4) { const x = sp.x + Math.sin(a) * r, z = sp.z + Math.cos(a) * r; if (C.blocked(x, z, .32)) continue; this.crowd.push(S(defs[i++], 'kalabalik', { x, z, yaw: Math.atan2(sp.x - x, sp.z - z) }, 'p5', { anim: 'idle' })); } }
    this.chapters = this.build();
    // arayüz
    this.elTitle = document.getElementById('objTitle'); this.elList = document.getElementById('objList'); this.idleHTML = this.story.idleHTML; this.idleTitle = this.story.idleTitle; this.elCard = document.getElementById('storyCard'); this.elPeriod = document.getElementById('hudPeriod');
    const box = document.getElementById('questMarks'); for (let i = 0; i < 4; i++) { const d = document.createElement('div'); d.className = 'qmark'; d.style.display = 'none'; d.innerHTML = '<i></i><span></span>'; box.appendChild(d); this.marks.push(d); }
    return this;
  }

  build() {
    const is = t => a => a.tag === t, gezen = a => a.role === 'gezen' && !a.story, usta = a => a === this.usta, pt = this.pt;
    const A = [
      { t: 'card', big: 'GAZİANTEP · 17 ARALIK 1918', small: 'Bir zamanlar bu şehirde hayat vardı…' }, { t: 'groups', on: ['p1'] },
      { t: 'title', title: 'Son Normal Gün' },
      { t: 'talk', who: usta, text: 'Ustanla konuş', line: 'Günaydın çırak. Fırından ekmeği al, sonra çeşmeden su getir.' },
      { t: 'talk', who: is('firinci'), text: 'Fırıncıdan ekmek al', line: 'Sıcak sıcak, daha yeni çıktı. Ustana selam söyle.' },
      { t: 'goto', p: pt.cesme, r: 3, text: 'Çeşmeden su doldur', label: 'Çeşme' },
      { t: 'talk', who: usta, text: 'Ekmeği ve suyu ustana götür', line: 'Aferin. Şu siparişi Millet Hanı\'na bırak; dönüşte Alaüddevle Camii\'nin önünden geç, çarşıyı tanı.' },
      pt.han && { t: 'goto', p: pt.han, r: 14, text: 'Siparişi Millet Hanı\'na götür', label: 'Millet Hanı' },
      pt.cami && { t: 'goto', p: pt.cami, r: 14, text: 'Alaüddevle Camii\'nin önünden geç', label: 'Alaüddevle Camii' },
      { t: 'talk', who: usta, text: 'Dükkâna dön', line: 'Geç kaldın. Sokakta bir hareket var, duydun mu?' },
      { t: 'card', big: 'İŞGAL BAŞLIYOR', small: '17 Aralık 1918 · İngiliz birlikleri şehre giriyor' }, { t: 'groups', on: ['p2'] },
      { t: 'title', title: 'Yabancı Askerler' },
      { t: 'goto', p: pt.kontrol, r: 7, text: 'Sokağın başındaki askerleri gör', label: 'Askerler' },
      { t: 'talkN', who: gezen, n: 2, text: 'İki kişiye ne olduğunu sor', line: 'Şehre asker girmiş diyorlar. Hayırlısı olsun…' },
      { t: 'talk', who: usta, text: 'Ustana haber ver', line: 'Kepengi indir. Bugün erken kapatıyoruz.' },
      { t: 'date', to: D.b }
    ];
    const B = [
      { t: 'card', big: 'BAYRAK DEĞİŞİYOR', small: '25 Ekim 1919 · Fransız kuvvetleri İngilizlerin yerini alıyor' }, { t: 'groups', on: ['p3'] },
      { t: 'title', title: 'Bayrak Değişiyor' },
      { t: 'goto', p: pt.kontrol, r: 7, text: 'Kontrol noktasındaki yeni askerleri gör', label: 'Kontrol noktası' },
      { t: 'talkN', who: gezen, n: 2, text: 'İki kişiyle konuş', line: 'İngiliz gitti, Fransız geldi. Dükkânlar yine erken kapanıyor.' },
      { t: 'talk', who: usta, text: 'Ustanla konuş', line: 'Değişen yalnız üniforma değil. Al şu kâğıdı; kimseye gösterme.' },
      { t: 'groups', on: ['p4'] }, { t: 'title', title: 'Gizli Haber' },
      { t: 'talk', who: is('ileri1'), text: 'Kâğıdı sokağın ilerisindeki ihtiyara götür', line: 'Okudum. Cevabı kâğıtla değil, sözle götüreceksin: "Pazar günü, meydanda."' },
      { t: 'talk', who: is('ileri2'), text: 'Cevabı bahçe kapısındaki adama ilet', line: 'Pazar günü, meydanda… Anlaşıldı. Sen bir şey görmedin.' },
      { t: 'talk', who: usta, text: 'Ustana dön', line: 'İyi iş çıkardın. Pazar günü sen de gel.' },
      { t: 'date', to: D.c }
    ];
    const h = this.hatip, k = this.crowd;
    const Cc = [
      { t: 'card', big: 'HALK TOPLANTISI', small: '23 Kasım 1919 · Cemiyet-i İslamiye\'nin çağrısıyla halk işgale karşı toplanıyor' }, { t: 'groups', on: ['p5'], off: ['p4'] },
      { t: 'title', title: 'Halk Toplantısı' },
      pt.meydan && { t: 'listen', p: pt.meydan, r: 12, text: 'Meydandaki toplantıya git ve dinle', label: 'Meydan',
        lines: [[h, 'Bu şehir bizimdir.'], [h, 'İşgali tanımıyoruz. Sesimizi dünyaya duyuracağız.'], [k[1], 'Tanımıyoruz!'], [k[4], 'Tanımıyoruz!'], [h, 'Dağılmayın. Birlik olursak ayakta kalırız.']] },
      { t: 'card', big: 'Şehir artık eskisi gibi olmayacaktı.', small: '' },
      { t: 'wait', dur: 6 }, { t: 'date', to: D.heyet }
    ];
    return { a: A.filter(Boolean), b: B.filter(Boolean), c: Cc.filter(Boolean) };
  }

  /** tarih değişti: o güne ait bölümü aç (yoksa görev motoru devre dışı) */
  onDate(d) {
    const k = key(d); const ch = k === key(D.a) ? 'a' : k === key(D.b) ? 'b' : k === key(D.c) ? 'c' : Object.keys(this.meta).find(m => key(this.meta[m].date) === k) || null;
    const prev = this.ch; this.ch = ch; this.script = null; this.seen = new Set(); if (prev && prev !== ch && this.meta[prev] && this.meta[prev].exit) this.meta[prev].exit();
    if (this.combat) this.combat.stop(); this.setRole(null); this.setCarry(false); this.inv = {};
    for (const g of this.groupsAll) this.npcs.setGroup(g, false);
    if (ch) { if (this.prog[ch] >= this.chapters[ch].length) this.prog[ch] = 0;   /* bitmiş bölüme yeniden gelindi: baştan */
      const S = this.chapters[ch]; let tp = null; S.forEach(s => { s._on = false; s._t = undefined; });
      for (let i = 0; i < this.prog[ch]; i++) { const s = S[i]; if (s.t === 'groups') this.applyGroups(s); else if (s.t === 'role') this.setRole(s); else if (s.t === 'tp') tp = s; this.applyItems(s, true); }
      if (tp && prev !== ch) this.player.place(tp.p.x, tp.p.z, tp.yaw || 0);
      if (this.meta[ch] && this.meta[ch].sync) this.meta[ch].sync(this.prog[ch]); }
    this.render(); this.renderInv();
  }
  applyGroups(s) { (s.on || []).forEach(g => this.npcs.setGroup(g, true)); (s.off || []).forEach(g => this.npcs.setGroup(g, false)); }
  /** adımın verdiği ve harcadığı eşyalar (bez, su, fişek sandığı…) */
  applyItems(s, replay = false) { if (s.give) for (const k in s.give) this.inv[k] = (this.inv[k] || 0) + s.give[k]; if (replay && s.need) { const n = s.t === 'talkN' ? s.n : 1; for (const k in s.need) this.inv[k] = Math.max(0, (this.inv[k] || 0) - s.need[k] * n); } if (s.take) for (const k of s.take) delete this.inv[k]; }
  /** oyuncunun karakteri (kurmaca): haberci | savunmaci | yardimci | esnaf. weapon: tüfek kuşanılır */
  setRole(s) { this.role = s ? s.role : null; if (this.combat) { this.combat.equip(!!(s && s.weapon)); if (s && s.weapon) this.combat.resupply(s.ammo || 25); } const el = document.getElementById('roleTag'); if (el) { const K = this.role && KARAKTERLER[this.role]; el.textContent = K ? K.ad : ''; el.style.display = K ? 'block' : 'none'; } }
  /** sırtta yaralı taşırken oyuncu yavaşlar */
  setCarry(on) { const c = this.player.cfg; if (!this.baseSpeed) this.baseSpeed = { walk: c.walk, run: c.run }; c.walk = this.baseSpeed.walk * (on ? .62 : 1); c.run = on ? c.walk : this.baseSpeed.run; this.carrying = on; this.renderInv(); }
  fade() { const f = document.getElementById('fade'); if (!f) return; f.classList.add('on'); this.fadeT = .7; }
  get step() { return this.ch ? this.chapters[this.ch][this.prog[this.ch]] : null; }
  next() { const s = this.step; if (s) this.applyItems(s); this.prog[this.ch]++; this.seen = new Set(); const m = this.meta[this.ch]; if (m && m.sync) m.sync(this.prog[this.ch]); this.render(); this.renderInv(); }
  /** kendiliğinden geçilen adımlar: kart, grup, başlık, karakter, ışınlama */
  auto() { for (let guard = 0; guard < 12; guard++) { const s = this.step; if (!s) return;
      if (s.t === 'card') { this.cards.push(s); this.next(); } else if (s.t === 'groups') { this.applyGroups(s); this.next(); } else if (s.t === 'title') this.next();
      else if (s.t === 'role') { this.setRole(s); this.next(); } else if (s.t === 'tp') { this.fade(); this.player.place(s.p.x, s.p.z, s.yaw || 0); this.player.pitch = 0; this.next(); } else return; } }

  onTalk(a) {
    if (!this.ch) return null; this.auto(); const s = this.step;
    if (s && (s.t === 'talk' || s.t === 'talkN') && s.who(a)) {
      if (s.t === 'talkN' && this.seen.has(a.id)) return s.again || 'Bildiğim bu kadar.';
      if (s.need) { for (const k in s.need) if ((this.inv[k] || 0) < s.need[k]) return s.fail || 'Elin boş gelmişsin.'; for (const k in s.need) this.inv[k] -= s.need[k]; this.renderInv(); }
      if (s.send) { a.tasks.length = 0; a.tasks.push({ t: 'stay', dur: 2, anim: 'talk_b', yaw: a.yaw, talk: true }, { t: 'hide', dur: 160 }); }   /* mahzene iner: sokaktan çekilir */
      if (s.t === 'talkN') { this.seen.add(a.id); if (this.seen.size < s.n) { this.render(); return s.line; } }
      this.next(); return s.line; }
    if (a.tag === 'ing') return 'Move along.  — «Yürü, durma.»'; if (a.tag === 'fr') return 'Circulez.  — «Dağılın.»'; if (a.tag === 'kalabalik') return 'Sus, dinleyelim.'; if (a.tag === 'hatip') return null;
    const m = this.meta[this.ch]; if (m && m.talk) { const r = m.talk(a); if (r) return r; }
    if (a === this.usta) return 'İşin bitmeden dönme.'; if (a.tag === 'firinci') return 'Ekmek taze, afiyet olsun.';
    if (a.kimlik && a.kimlik.ad && a.family !== 'child') return yolTarifi(this.targets(), a);   /* sıradan sakin: göreve eşlik eder, yol tarif eder */
    return null;
  }

  update(dt) {
    if (this.fadeT > 0) { this.fadeT -= dt; if (this.fadeT <= 0) document.getElementById('fade').classList.remove('on'); }
    // bölüm kartları
    if (this.cardT > 0) { this.cardT -= dt; if (this.cardT <= 0) this.elCard.classList.remove('show'); } else if (this.cards.length && this.player.enabled) { const c = this.cards.shift(); this.elCard.firstChild.textContent = c.big; this.elCard.lastChild.textContent = c.small || ''; this.elCard.classList.add('show'); this.cardT = c.dur || 5.5; }
    if (!this.ch || !this.player.enabled) { this.marks.forEach(m => m.style.display = 'none'); return; }
    this.auto(); let s = this.step; const P = this.player.pos, M = this.meta[this.ch];
    if (s && s.t === 'date') { this.prog[this.ch]++; this.setDate(s.to); return; }
    if (M && M.update) M.update(dt, this.prog[this.ch]);
    if (!s) { this.marks.forEach(m => m.style.display = 'none'); return; }
    if (s.t === 'goto' && dist(P, s.p) < s.r) this.next();
    else if (s.t === 'wait') { s._t = (s._t ?? s.dur) - dt; if (s._t <= 0) { s._t = undefined; this.next(); } }
    else if (s.t === 'listen') { if (!this.script && dist(P, s.p) < s.r) this.script = { i: -1, t: 1 }; if (this.script) { const sc = this.script; sc.t -= dt; if (sc.t <= 0) { sc.i++; if (sc.i >= s.lines.length) { this.script = null; this.next(); } else { const [who, text] = s.lines[sc.i]; if (who) this.npcs.say(who, text, 3.8); sc.t = who && who.tag === 'kalabalik' ? 1.4 : 4; } } } }
    else if (s.t === 'combat' && this.combat) { const cb = this.combat; if (!s._on) { cb.start(s.cfg()); s._on = true; }
      if (cb.result === 'won') { s._on = false; cb.stop(); this.next(); }
      else if (cb.result === 'lost') { cb.stop(); s._on = false; this.fade(); if (s.start) this.player.place(s.start.x, s.start.z, s.start.yaw || 0); this.cards.push({ big: 'Yaralandın', small: 'Siperin arkasında çömel (C); mekanizma kurulurken başını kaldırma.', dur: 4 }); } }
    this.drawMarks();
  }

  targets() { const s = this.step, T = []; if (!s) return T; const ag = a => { if (a && !a.benched && !a.hidden) T.push({ x: a.x, z: a.z, y: a.y + a.height + .55, label: '' }); };
    if (s.t === 'goto' || s.t === 'listen') T.push({ x: s.p.x, z: s.p.z, y: this.world.groundAt(s.p.x, s.p.z) + 2.4, label: s.label || '' });
    else if (s.t === 'talk' || s.t === 'talkN') this.npcs.agents.filter(a => s.who(a) && !this.seen.has(a.id) && !a.benched && !a.hidden).sort((a, b) => a.dist - b.dist).slice(0, 3).forEach(ag);
    return T; }
  drawMarks() { const T = this.targets(), P = this.player.pos, v = this.v;
    this.marks.forEach((m, i) => { const t = T[i]; if (!t) { m.style.display = 'none'; return; } v.set(t.x, t.y, t.z).project(this.camera); if (v.z > 1 || v.z < -1) { m.style.display = 'none'; return; }
      const x = Math.max(-.92, Math.min(.92, v.x)), y = Math.max(-.8, Math.min(.8, v.y)); m.style.display = 'block'; m.style.left = ((x * .5 + .5) * innerWidth).toFixed(0) + 'px'; m.style.top = ((-y * .5 + .5) * innerHeight).toFixed(0) + 'px';
      const txt = (t.label ? t.label + ' · ' : '') + Math.round(Math.hypot(t.x - P.x, t.z - P.z)) + ' m'; if (m._t !== txt) { m.lastChild.textContent = txt; m._t = txt; } }); }

  /** sol üstteki görev listesi: etkin görevin biten adımları + şimdiki adım */
  render() {
    if (!this.ch) { if (!this.story.active) { this.elTitle.textContent = this.idleTitle; this.elList.innerHTML = this.idleHTML; } return; }
    const S = this.chapters[this.ch], i = this.prog[this.ch]; let start = 0, title = 'Prolog'; for (let k = 0; k <= Math.min(i, S.length - 1); k++) if (S[k].t === 'title') { start = k; title = S[k].title; }
    let h = ''; for (let k = start; k < S.length && k <= i; k++) { const s = S[k]; if (!s.text) continue; h += `<li class="${k < i ? 'done' : ''}">${s.text}${s.t === 'talkN' && k === i ? ` (${this.seen.size}/${s.n})` : ''}.</li>`; }
    this.elTitle.textContent = title; this.elList.innerHTML = h || '<li>…</li>';
    if (this.ch === 'a' && this.elPeriod) { const occ = S.findIndex(s => s.t === 'card' && s.big === 'İŞGAL BAŞLIYOR'); if (i <= occ) this.elPeriod.textContent = 'İŞGALDEN ÖNCE'; else this.elPeriod.textContent = 'İNGİLİZ İŞGALİ'; }
  }
  /** taşınan eşyalar (sağ alt) */
  renderInv() { const el = document.getElementById('invTag'); if (!el) return; const AD = { bez: 'Temiz bez', su: 'Su', fisek: 'Fişek sandığı', ilac: 'İlaç' }; const p = Object.entries(this.inv || {}).filter(([, n]) => n > 0).map(([k, n]) => `${AD[k] || k} ${n}`); if (this.carrying) p.unshift('Sırtında yaralı var'); el.textContent = p.join(' · '); el.style.display = p.length ? 'block' : 'none'; }
}
