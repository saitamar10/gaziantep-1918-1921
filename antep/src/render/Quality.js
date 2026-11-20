// Uyarlanabilir grafik sistemi: kalite kademeleri (ultra/high/medium/low) + dinamik FPS yöneticisi.
// Kademe; çözünürlük, MSAA, GTAO, ışık huzmeleri, gölge menzili/çözünürlüğü, detay ve çizim mesafesi, NPC yoğunluğunu birlikte ayarlar.
// 'auto' kipinde gerçek kare hızı ölçülür: önce iç çözünürlük kademeli düşürülür, yetmezse bir alt kademeye inilir;
// performans düzelince kontrollü biçimde geri çıkılır (yükseltme sonrası tekrar düşüş olursa bekleme süresi katlanır -> titreme olmaz).
import { CONFIG } from '../config.js';

export const TIER_ORDER = ['ultra', 'high', 'medium', 'low'];
export const TIER_NAMES = { ultra: 'Ultra', high: 'Yüksek', medium: 'Orta', low: 'Düşük' };
export const TIERS = {
  //        iç çöz. üst sınırı  MSAA   GTAO ölçeği/örnek      ışık huzmesi  gölge: açık, menzil (m), harita    yakın detay   şehir çizim mesafesi  NPC oranı ve LOD mesafeleri        sokak fenerleri
  ultra: { maxDpr: 2, msaa: 4, gtao: 1, gtaoSamples: 16, rays: true, shadows: true, shadowFar: 600, shadowSize: 2048, cascades: 4, shadowEvery: 1, pom: true, detailDist: 190, drawDist: Infinity, npc: 1, npcLod: [50, 110, 240], pointLights: true },
  high: { maxDpr: 1.5, msaa: 4, gtao: .5, gtaoSamples: 8, rays: true, shadows: true, shadowFar: 300, shadowSize: 2048, cascades: 4, shadowEvery: 1, pom: true, detailDist: 170, drawDist: Infinity, npc: 1, npcLod: [45, 95, 210], pointLights: true },
  medium: { maxDpr: 1.25, msaa: 2, gtao: 0, gtaoSamples: 8, rays: false, shadows: true, shadowFar: 200, shadowSize: 1024, cascades: 3, shadowEvery: 2, pom: false, detailDist: 130, drawDist: 800, npc: .75, npcLod: [35, 75, 170], pointLights: true },
  low: { maxDpr: 1, msaa: 0, gtao: 0, gtaoSamples: 8, rays: false, shadows: true, shadowFar: 120, shadowSize: 1024, cascades: 2, shadowEvery: 3, pom: false, detailDist: 95, drawDist: 420, npc: .5, npcLod: [28, 60, 140], pointLights: false }
};
const FPS_LOW = 30, FPS_HIGH = 52, WINDOW = 2;     // 2 sn'lik ölçüm pencereleri

export class QualityManager {
  constructor({ renderer, post, lighting, world, scene, npcs = null, onChange = () => { } }) {
    Object.assign(this, { renderer, post, lighting, world, scene, npcs, onChange });
    this.webgl2 = renderer.capabilities.isWebGL2; this.mode = 'auto'; this.tier = 'high'; this.scale = 1;
    this.acc = 0; this.n = 0; this.bad = 0; this.good = 0; this.lastChange = 0; this.lastUp = -1e9; this.hold = 30000; this.upAllowedAt = 0; this.fps = 0;
    this.pointLights = []; scene.traverse(o => { if (o.isPointLight) this.pointLights.push(o); });
  }
  /** donanıma göre başlangıç tahmini; gerçek ayarı FPS yöneticisi bulur */
  guess() {
    let name = ''; try { const gl = this.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); name = e ? String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)) : ''; } catch (e) { }
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 2; const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
    const integrated = /Intel|UHD|Iris|Radeon\(TM\) Graphics|Radeon Graphics|Vega|Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Microsoft Basic/i.test(name) && !/RTX|GTX|RX \d|Arc/i.test(name);
    if (!this.webgl2 || /SwiftShader|llvmpipe|Microsoft Basic/i.test(name)) return 'low';
    // Hafif başla: ilk izlenim akıcı olsun. Makine kaldırıyorsa FPS yöneticisi birkaç saniye içinde kademeyi yükseltir.
    if (mobile || mem <= 4 || cores <= 4 || integrated || !name) return 'low'; return 'medium';
  }
  /** mode: 'auto' | kademe adı */
  setMode(mode) { if (mode === 'auto') { this.mode = 'auto'; this.scale = 1; this.apply(this.guess()); } else if (TIERS[mode]) { this.mode = mode; this.scale = 1; this.apply(mode); } this.bad = this.good = 0; this.hold = 30000; this.upAllowedAt = 0; }
  apply(tier = this.tier) {
    const T = TIERS[tier], r = this.renderer, p = this.post, L = this.lighting; const tierChanged = tier !== this.applied; this.tier = tier;
    // çözünürlük
    this.resize();
    if (tierChanged) {
      // son işlem
      const samples = this.webgl2 ? T.msaa : 0; for (const rt of [p.composer.renderTarget1, p.composer.renderTarget2]) if (rt.samples !== samples) { rt.samples = samples; rt.dispose(); }
      p.gtao.enabled = T.gtao > 0 && this.webgl2; if (p.gtao.enabled) { try { p.gtao.updateGtaoMaterial({ samples: T.gtaoSamples }); } catch (e) { } } p.rays.enabled = T.rays && p.gtao.enabled;   // huzmeler GTAO'nun derinlik dokusunu kullanır; GTAO kapalıyken çalışamaz
      // gölgeler
      if (L.csm) { const c = L.csm; c.maxFar = T.shadowFar; c.shadowMapSize = T.shadowSize; c.lights.forEach((l, li) => { l.castShadow = T.shadows && li < T.cascades; if (l.shadow.mapSize.x !== T.shadowSize) { l.shadow.mapSize.set(T.shadowSize, T.shadowSize); if (l.shadow.map) { l.shadow.map.dispose(); l.shadow.map = null; } } }); c.updateFrustums(); }
      // dünya ve NPC
      CONFIG.detailDist = T.detailDist; this.world.drawDist = T.drawDist; if (this.npcs) this.npcs.setQuality(T.npc, T.npcLod);
      this.pointLights.forEach(l => { l.visible = T.pointLights; });   /* görünmez ışık shader'dan tamamen çıkar (şiddeti 0 yapmak hesabı kaldırmıyordu) */
      L.shadowEvery = T.shadowEvery;
      // parallax (POM) pahalıdır: düşük kademelerde kapat
      if (!this.pomMats) { this.pomMats = []; this.scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if (m.userData && m.userData.pom && !this.pomMats.includes(m)) { m.userData.pomBase = m.userData.pom.value.clone(); this.pomMats.push(m); } }); }); }
      this.pomMats.forEach(m => { if (T.pom) m.userData.pom.value.copy(m.userData.pomBase); else m.userData.pom.value.set(0, 0); });
      this.applied = tier;
    }
    this.lastChange = performance.now(); this.onChange(this);
  }
  resize() {
    const T = TIERS[this.tier], r = this.renderer, p = this.post; const pr = Math.min(devicePixelRatio || 1, T.maxDpr) * this.scale; this.pixelRatio = pr;
    r.setPixelRatio(pr); r.setSize(innerWidth, innerHeight, false); p.composer.setPixelRatio(pr); p.composer.setSize(innerWidth, innerHeight);
    const g = T.gtao || .5; p.gtao.setSize(Math.max(2, Math.round(innerWidth * pr * g)), Math.max(2, Math.round(innerHeight * pr * g)));
  }
  /** her karede ham dt (saniye) ile çağrılır */
  frame(dt) {
    if (document.hidden || dt > .25) { this.acc = this.n = 0; return; }   // arka plan sekmesi / takılma: ölçüme katma
    this.boot = (this.boot ?? 12) - dt; const fast = this.boot > 0;   /* ilk 12 sn: 1 sn'lik pencerelerle hızlı tepki */
    this.acc += dt; this.n++; if (this.acc < (fast ? 1 : WINDOW)) return; this.fps = this.n / this.acc; this.acc = this.n = 0;
    if (this.mode !== 'auto') return; const now = performance.now(); if (now - this.lastChange < (fast ? 1500 : 4000)) return;   // değişiklikten sonra oturma süresi (shader derlemeleri)
    if (this.fps < FPS_LOW) { this.bad += fast ? 2 : 1; this.good = 0; } else if (this.fps > FPS_HIGH) { this.good++; this.bad = 0; } else { this.good = 0; this.bad = Math.max(0, this.bad - 1); }
    const i = TIER_ORDER.indexOf(this.tier);
    if (this.bad >= 2) { this.bad = 0;   // ~4 sn hedefin altında
      if (now - this.lastUp < 20000) this.hold = Math.min(600000, this.hold * 2); this.upAllowedAt = now + this.hold;   // yeni yükseltilmişti: bir dahaki denemeyi ertele
      if (this.scale > .72) this.scale = Math.max(.7, this.scale - .15); else if (i < TIER_ORDER.length - 1) { this.scale = 1; return this.apply(TIER_ORDER[i + 1]); } else if (this.scale > .56) this.scale = Math.max(.55, this.scale - .15); else return;
      this.apply(); }
    else if (this.good >= 5 && now >= this.upAllowedAt) { this.good = 0;   // ~10 sn rahat
      if (this.scale < 1) this.scale = Math.min(1, this.scale + .15); else if (i > 0 && (TIER_ORDER[i - 1] !== 'ultra' || this.fps >= 57)) { this.lastUp = now; return this.apply(TIER_ORDER[i - 1]); } else return;
      this.lastUp = now; this.apply(); }
  }
  label() { return `${TIER_NAMES[this.tier]}${this.mode === 'auto' ? ' (oto)' : ''}${this.scale < 1 ? ' · %' + Math.round(this.scale * 100) : ''}`; }
}
