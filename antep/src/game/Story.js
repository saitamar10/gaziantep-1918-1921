// Görev sistemi — "Gizli Toplantı" bölümü (Kasım 1919) ve yedi komisyon görevi.
// TARİHÎ DAYANAK: Heyet-i Merkeziye'nin evlerde gizlice toplanması, 27 semt × 100 kişilik plan ve komisyonlar (src/data/chronology.js).
// KURGU: kişiler, konuşmalar, parola, toplantının yeri ve görevlerin ayrıntısı oyun için yazılmıştır; tarihî kayıt değildir.
// Toplantı bir bahçe/avluda geçer: oyunda bina içleri gezilemiyor.
import * as THREE from 'three';
import { TESKILAT } from '../data/chronology.js';
import { yolTarifi } from './hints.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export class Story {
  constructor({ world, npcs, player, camera }) { Object.assign(this, { world, npcs, player, camera }); this.active = false; this.stage = 0; this.done = new Set(); this.job = null; this.marks = []; this.v = new THREE.Vector3(); this.script = null; }

  init() {
    const N = this.npcs, H = this.world.hero, P = N.heroPoint; this.place = this.findGarden();
    const g = this.place;
    // hikâye karakterleri
    this.contact = N.agents.find(a => a.role === 'esnaf'); this.contact.tag = 'irtibat';
    this.lookout = N.addStory('K02', 'gozcu', g.lookout);
    this.members = g.circle.map((s, i) => N.addStory(['K01', 'K02', 'K02', 'K01', 'K02'][i], i === 0 ? 'lider' : 'uye', s, { anim: i % 2 ? 'idle' : 'talk_b' }));
    this.leader = this.members[0];
    const spots = { mali: P(H.xr(-12) - .8, -12, -1, 0), iase: P(H.xr(-3) - .8, -3, -1, 0), muhimmat: P(H.xr(-80) - .9, -80, -1, 0), saglik: P(H.xl(-34) + .8, -34, 1, 0), tahkimat: P(H.xl(-57) + .7, -57, 1, 0), yardim: P(H.xr(-66) - .8, -66, -1, 0), haber: P(H.xl(-95) + .8, -95, 1, 0) };
    this.heads = {}; const defs = { mali: 'K01', iase: 'K02', muhimmat: 'K02', saglik: 'K11', tahkimat: 'K02', yardim: 'K12', haber: 'K02' };
    for (const k of TESKILAT.komisyonlar) if (spots[k.id]) this.heads[k.id] = N.addStory(defs[k.id], 'kom:' + k.id, spots[k.id]);
    this.smith = N.addStory('K06', 'demirci', P(H.xr(-90) - 1.2, -90, -1, 0) || spots.muhimmat, { anim: 'work_a', outfit: { prop: null } });
    const hp = (x, z) => { const [X, Z] = H.w(x, z); return { x: X, z: Z }; };
    this.points = { depo: hp(H.cx(0), 9), ucKuzey: hp(H.cx(-100), -108), kabalti: hp(H.cx(-46), -46), ucGuney: hp(H.cx(0), 9) };
    this.jobs = this.buildJobs();
    N.onTalk = a => this.onTalk(a);
    // arayüz
    this.elTitle = document.getElementById('objTitle'); this.elList = document.getElementById('objList'); this.idleHTML = this.elList.innerHTML; this.idleTitle = this.elTitle.textContent;
    const box = document.getElementById('questMarks'); for (let i = 0; i < 8; i++) { const d = document.createElement('div'); d.className = 'qmark'; d.style.display = 'none'; d.innerHTML = '<i></i><span></span>'; box.appendChild(d); this.marks.push(d); }
    return this;
  }

  /** kahraman sokağa en yakın, kapısı açık ve yürüyerek ulaşılabilen bahçe */
  findGarden() {
    const W = this.world, C = W.collision, nav = this.npcs.nav, c = this.npcs.center; let best = null, bd = 1e9; const from = nav.nearest(c.x, c.z, 90);
    for (const l of W.layout.lots) { const s = l.spec; if (!s || s.type !== 'bahce' || l.area < 90) continue; const d0 = Math.hypot(l.c[0] - c.x, l.c[1] - c.z); if (d0 > 230 || d0 >= bd) continue; const P = s.P;
      for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!l.front[i] || L <= 5) continue;
        const gx = (a[0] + b[0]) / 2, gz = (a[1] + b[1]) / 2; let nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L; if ((l.c[0] - gx) * nx + (l.c[1] - gz) * nz > 0) { nx = -nx; nz = -nz; }   // (nx,nz) dışa bakar
        const out = { x: gx + nx * 1.3, z: gz + nz * 1.3 }; if (C.blocked(gx, gz, .32) || C.blocked(out.x, out.z, .32) || C.blocked(l.c[0], l.c[1], .4)) continue;
        const node = nav.nearest(out.x, out.z, 25); if (!node || !nav.path(from, node) || !nav.walkable(C, [node.x, node.z], [out.x, out.z])) continue;
        const tx = -nz, tz = nx; const circle = []; for (let k = 0; k < 5; k++) { const ang = k / 5 * Math.PI * 2, x = l.c[0] + Math.cos(ang) * 1.5, z = l.c[1] + Math.sin(ang) * 1.5; if (!C.blocked(x, z, .3)) circle.push({ x, z, yaw: Math.atan2(l.c[0] - x, l.c[1] - z) }); }
        if (circle.length < 3) continue;
        best = { lot: l, gate: { x: gx, z: gz }, out, center: { x: l.c[0], z: l.c[1] }, lookout: { x: gx + nx * 1.0 + tx * 1.1, z: gz + nz * 1.0 + tz * 1.1, yaw: Math.atan2(nx, nz) }, circle }; bd = d0; break; } }
    if (!best) throw new Error('Toplantı için uygun bahçe bulunamadı');
    return best;
  }

  buildJobs() {
    const N = this.npcs, pt = this.points, is = tag => a => a.tag === tag, role = r => a => a.role === r && !a.story;
    return {
      mali: { ad: 'Mali işler', giris: 'Savunma parasız olmaz. Çarşıdaki üç esnaftan iane topla.', steps: [
        { t: 'talkN', who: role('esnaf'), n: 3, text: 'Çarşıdaki üç esnaftan iane topla', line: 'Al kardeşim, hakkımız helal olsun.' },
        { t: 'talk', who: is('kom:mali'), text: 'Parayı sorumluya teslim et', line: 'Eline sağlık. Kuruşu kuruşuna deftere yazacağım.' }] },
      iase: { ad: 'Erzak ve iaşe', giris: 'Esnaftan bir çuval bulgur al, sokağın başındaki depoya bırak.', steps: [
        { t: 'talk', who: role('esnaf'), text: 'Bir esnaftan bulgur çuvalını al', line: 'Çuval ağırdır, belini incitme.' },
        { t: 'goto', p: pt.depo, r: 3, text: 'Çuvalı sokağın başındaki depoya götür' },
        { t: 'talk', who: is('kom:iase'), text: 'Sorumluya haber ver', line: 'İyi. Ambar doldukça içimiz rahat eder.' }] },
      muhimmat: { ad: 'Mühimmat ve silah tamiri', giris: 'Bu tüfeğin mekanizması tutukluk yapıyor. Demirciye götür, baksın.', steps: [
        { t: 'talk', who: is('demirci'), text: 'Tüfeği demirciye götür', line: 'Yayı yorulmuş. Değiştirdim, al götür.' },
        { t: 'talk', who: is('kom:muhimmat'), text: 'Tamir edilen tüfeği geri getir', line: 'Eyvallah. Her tüfek sayılıdır.' }] },
      saglik: { ad: 'Sağlık hizmetleri', giris: 'Sargı bezi lazım. Sokaktaki ev kadınlarından temiz bez iste.', steps: [
        { t: 'talk', who: role('evkadini'), text: 'Ev kadınından temiz bez al', line: 'Kaynatıp kuruttum, tertemizdir. Al götür.' },
        { t: 'talk', who: is('kom:saglik'), text: 'Bezleri sağlık sorumlusuna teslim et', line: 'Sağ ol. Yaralıya ilk bunlar lazım olur.' }] },
      tahkimat: { ad: 'Tahkimat ve mühendislik', giris: 'Sokağın iki ucuna ve kabaltıya bak; nereye siper kurulur, bana söyle.', steps: [
        { t: 'goto', p: pt.ucGuney, r: 3.5, text: 'Sokağın çarşı ucunu incele' }, { t: 'goto', p: pt.kabalti, r: 3, text: 'Kabaltıyı incele' }, { t: 'goto', p: pt.ucKuzey, r: 3.5, text: 'Sokağın kale ucunu incele' },
        { t: 'talk', who: is('kom:tahkimat'), text: 'Gördüklerini sorumluya anlat', line: 'Kabaltı dar, orası tutulur. Aklımda.' }] },
      yardim: { ad: 'Asker ailelerine yardım', giris: 'Şu çıkını duvar dibinde oturan yaşlı kadına götür. Oğlu cephede.', steps: [
        { t: 'talk', who: a => a.role === 'yasli' && a.def === 'K12', text: 'Çıkını yaşlı kadına götür', line: 'Allah razı olsun evladım. Unutulmadık demek.' },
        { t: 'talk', who: is('kom:yardim'), text: 'Sorumluya haber ver', line: 'İyi ettin. Kimse sahipsiz kalmayacak.' }] },
      haber: { ad: 'Haberleşme ve tedarik', giris: 'Bahçe kapısındaki arkadaşa söyle: yarın aynı saatte. Cevabını getir.', steps: [
        { t: 'talk', who: is('gozcu'), text: 'Haberi bahçe kapısındaki gözcüye ilet', line: 'Anlaşıldı. Yarın aynı saatte, de.' },
        { t: 'talk', who: is('kom:haber'), text: 'Cevabı geri getir', line: 'Tamam. Ağızdan ağıza, kâğıtsız; en sağlamı budur.' }] }
    };
  }

  setActive(on) { if (on === this.active) return; this.active = on; this.npcs.setStory(on); if (on && this.stage === 0) this.stage = 1; this.render(); }

  /* ---------------- oyuncu konuşmaları ---------------- */
  onTalk(a) {
    if (!this.active) return null;
    if (this.stage === 1 && a === this.contact) { this.stage = 2; this.render(); return 'Bu akşam bahçeli evde toplanılıyor. Kapıdakine "Hayırlı işler" de.'; }
    if (this.stage === 2 && a === this.lookout) { this.stage = 3; this.render(); return 'Hayırlı işler… Geç içeri, bekliyorlar.'; }
    if (this.stage === 2 && this.members.includes(a)) return 'Seni tanımıyorum. Kapıdaki arkadaşla konuş.';
    if (this.stage === 3 && this.members.includes(a)) return 'Sus, dinle.';
    if (this.stage >= 4) {
      const j = this.job;
      if (j) { const s = j.def.steps[j.i]; if ((s.t === 'talk' || s.t === 'talkN') && s.who(a)) { if (s.t === 'talkN') { if (j.seen.has(a.id)) return 'Ben verdim ya, öbür dükkânlara da uğra.'; j.seen.add(a.id); if (j.seen.size < s.n) { this.render(); return s.line; } } this.advance(); return s.line; }
        if (a.tag === 'kom:' + j.id) return 'Önce verdiğim işi bitir.'; }
      if (a.tag && a.tag.startsWith('kom:')) { const id = a.tag.slice(4); if (this.done.has(id)) return 'Senin işin burada tamam. Sağ ol.'; if (j) return 'Elindeki işi bitir, sonra gel.'; this.job = { id, def: this.jobs[id], i: 0, seen: new Set() }; this.render(); return this.jobs[id].giris; }
      if (a === this.leader) return this.done.size >= 7 ? 'Bütün kollar işliyor. Antep hazırlanıyor.' : 'Kollara git, ne iş verirlerse yap.';
    }
    if (!a.story && a.kimlik && a.kimlik.ad && a.family !== 'child' && this.stage < 5) return yolTarifi(this.targets(), a);   // sıradan sakin yol tarif eder
    return null;
  }
  advance() { const j = this.job; j.i++; j.seen = new Set(); if (j.i >= j.def.steps.length) { this.done.add(j.id); this.job = null; const li = document.getElementById('kom-' + j.id); if (li) li.classList.add('done'); if (this.done.size >= 7) this.stage = 5; } this.render(); }

  /* ---------------- her kare ---------------- */
  update(dt) {
    if (!this.active) { this.marks.forEach(m => m.style.display = 'none'); return; } const P = this.player.pos, N = this.npcs;
    // toplantı: oyuncu çembere yaklaşınca konuşma başlar
    if (this.stage === 3 && !this.script && dist(P, this.place.center) < 4.2) { const [l, a, b] = this.members;
      this.script = { i: -1, t: .5, lines: [[l, 'Şehri yirmi yedi semte ayıracağız.'], [l, 'Her semtten yüz kişi yazılacak.'], [a, 'Hepsine silah bulamayız.'], [l, 'Silah tutamayan siper kazar, erzak taşır, yaralıya bakar.'], [b, 'Para, erzak, mühimmat, sağlık, tahkimat, asker ailelerine yardım, haberleşme… Her işe bir kol kuralım.'], [l, 'Sen de boş durma. Kollardan birine git, ne iş verirlerse yap.']] }; }
    if (this.script) { const s = this.script; s.t -= dt; if (s.t <= 0) { s.i++; if (s.i >= s.lines.length) { this.script = null; this.stage = 4; this.render(); } else { const [who, text] = s.lines[s.i]; N.say(who, text, 4.2); s.t = 4.4; } } }
    // 'git' adımları
    const j = this.job; if (j) { const s = j.def.steps[j.i]; if (s.t === 'goto' && dist(P, s.p) < s.r) this.advance(); }
    this.drawMarks();
  }
  /** şu an gidilecek yerler / konuşulacak kişiler */
  targets() {
    const N = this.npcs, T = []; const ag = (a, label) => { if (a && !a.benched && !a.hidden) T.push({ x: a.x, z: a.z, y: a.y + a.height + .55, label }); };
    if (this.stage === 1) ag(this.contact, 'Esnaf'); else if (this.stage === 2) ag(this.lookout, 'Gözcü'); else if (this.stage === 3) T.push({ x: this.place.center.x, z: this.place.center.z, y: this.world.groundAt(this.place.center.x, this.place.center.z) + 2.4, label: 'Toplantı' });
    else if (this.stage === 4) { const j = this.job;
      if (!j) { for (const [id, a] of Object.entries(this.heads)) if (!this.done.has(id)) ag(a, this.jobs[id].ad); }
      else { const s = j.def.steps[j.i]; if (s.t === 'goto') T.push({ x: s.p.x, z: s.p.z, y: this.world.groundAt(s.p.x, s.p.z) + 2.2, label: '' }); else { const c = N.agents.filter(a => s.who(a) && !(s.t === 'talkN' && j.seen.has(a.id))).sort((a, b) => a.dist - b.dist).slice(0, 3); c.forEach(a => ag(a, '')); } } }
    return T;
  }
  drawMarks() { const T = this.targets(), P = this.player.pos, v = this.v;
    this.marks.forEach((m, i) => { const t = T[i]; if (!t) { m.style.display = 'none'; return; } v.set(t.x, t.y, t.z).project(this.camera); if (v.z > 1 || v.z < -1) { m.style.display = 'none'; return; }
      const x = Math.max(-.92, Math.min(.92, v.x)), y = Math.max(-.8, Math.min(.8, v.y)); m.style.display = 'block'; m.style.left = ((x * .5 + .5) * innerWidth).toFixed(0) + 'px'; m.style.top = ((-y * .5 + .5) * innerHeight).toFixed(0) + 'px';
      const d = Math.round(Math.hypot(t.x - P.x, t.z - P.z)); const txt = (t.label ? t.label + ' · ' : '') + d + ' m'; if (m._t !== txt) { m.lastChild.textContent = txt; m._t = txt; } }); }

  /* ---------------- görev listesi (sol üst) ---------------- */
  render() {
    if (!this.active) { this.elTitle.textContent = this.idleTitle; this.elList.innerHTML = this.idleHTML; return; }
    const li = (text, done, sub) => `<li class="${done ? 'done' : ''}${sub ? ' sub' : ''}">${text}</li>`; const s = this.stage; let h = '';
    this.elTitle.textContent = s >= 5 ? 'Teşkilat Kuruldu' : 'Gizli Toplantı';
    h += li('Çarşıdaki esnaftan haber al.', s > 1); if (s >= 2) h += li('Bahçe kapısındaki gözcüye parolayı söyle.', s > 2); if (s >= 3) h += li('Bahçeye gir, toplantıyı dinle.', s > 3);
    if (s >= 4) { h += li(`Komisyonlara yardım et (${this.done.size}/7).`, this.done.size >= 7); const j = this.job; if (j) { h += li(j.def.ad + ':', false, true); const st = j.def.steps[j.i]; h += li(st.text + (st.t === 'talkN' ? ` (${j.seen.size}/${st.n})` : '') + '.', false, true); } else if (this.done.size < 7) h += li('Bir komisyon sorumlusuyla konuş (E).', false, true); }
    this.elList.innerHTML = h;
  }
}
