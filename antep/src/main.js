// Giriş noktası: renderer, dünya, ışık, oyuncu, son işlem, arayüz.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { MapCoordinates } from './core/MapCoordinates.js';
import { WorldManager } from './world/WorldManager.js';
import { Lighting } from './world/Lighting.js';
import { FirstPersonController } from './player/FirstPersonController.js';
import { PostFX } from './render/PostFX.js';
import { renderAerial } from './render/AerialMap.js';
import { MapView } from './ui/MapView.js';
import { L } from './data/historicalReferences.js';
import { AssetManager } from './assets/AssetManager.js';
import { NpcManager } from './npc/NpcManager.js';
import { QualityManager } from './render/Quality.js';
import { KRONOLOJI, TESKILAT, KAYNAKLAR, donem, tarihYaz } from './data/chronology.js';
import { Story } from './game/Story.js';
import { Prolog } from './game/Prolog.js';
import { Bolum1 } from './game/Bolum1.js';
import { Bolum2 } from './game/Bolum2.js';
import { Bolum3 } from './game/Bolum3.js';
import { Combat } from './game/Combat.js';

const $ = id => document.getElementById(id);
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight, false); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .1, 3200); scene.add(camera);
const progress = (v, t) => { $('loadBar').style.width = (v * 100).toFixed(1) + '%'; if (t) $('loadText').textContent = t; };

// Oyun tarihi: arayüz yazıları, güneş ve sokaktaki işgal kuvveti tek kaynaktan (CONFIG.date) türetilir
const hhmm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round(h % 1 * 60)).padStart(2, '0')}`;
function applyDate(d = CONFIG.date) { CONFIG.date = { ...d }; const txt = tarihYaz(d), p = donem(d);
  $('dateTxt').textContent = txt; $('hudYear').textContent = d.y; $('hudPeriod').textContent = p.ad; $('todDate').textContent = txt;
  document.querySelectorAll('.timeline span').forEach(s => s.classList.toggle('now', s.textContent.trim() === String(d.y)));
  if (typeof lighting !== 'undefined' && lighting) { lighting.date = { ...d }; if (lighting.sun) lighting.set(lighting.time); } kusatma = p.kusatma; if (typeof npcs !== 'undefined' && npcs) { npcs.setPeriod(p.occupier, p.kusatma); npcs.dateText = txt; }
  if (typeof story !== 'undefined' && story) story.setActive(!!p.olay && p.olay.id === 'heyet');
  if (typeof prolog !== 'undefined' && prolog) prolog.onDate(d);
  if (typeof bolum1 !== 'undefined' && bolum1) bolum1.setSiege(p.kusatma);
  document.querySelectorAll('#chronoList .ev').forEach(el => el.classList.toggle('cur', el.dataset.id === (p.olay && p.olay.id))); }

const world = new WorldManager(renderer, scene);
const lighting = new Lighting(renderer, scene, camera);
let player, post, map, npcs, quality, story, prolog, bolum1, bolum2, bolum3, combat, kusatma = false, ready = false, ctxLost = false;
$('tod').value = CONFIG.time; $('todV').textContent = hhmm(CONFIG.time);

(async () => {
  await world.init(progress);
  lighting.set(CONFIG.time);
  progress(.96, 'Harita görüntüsü çiziliyor…'); await new Promise(r => setTimeout(r, 0));
  lighting.sky.userData.noAerial = true;
  const aerial = renderAerial(renderer, scene, lighting.sun.dir.clone(), { width: 4096, tiles: 2 });
  lighting.initShadows(); world.allMaterials().forEach(m => { lighting.setupMaterial(m); world.mats.rechain(m); });
  // harici .glb modeller (assets/manifest.json varsa)
  const assets = new AssetManager(world, m => { lighting.setupMaterial(m); world.mats.rechain(m); }); scene.add(assets.group); assets.loadManifest('./models/manifest.json').then(() => assets.loadManifest()).then(n => { if (n) console.log(n + ' harici model yüklendi'); });
  lighting.set(CONFIG.time);
  post = new PostFX(renderer, scene, camera);
  player = new FirstPersonController(camera, canvas, world);
  // başlangıç: Uzun Çarşı aksı, kaleye bakarak
  const sp = world.hero.spawn(); player.place(sp.x, sp.z, sp.yaw);
  player.onStep = sp => audio.step(sp);
  // NPC'ler (hava fotoğrafı çekildikten sonra eklenir; hata olursa şehir yine açılır)
  try { progress(.98, 'Sokak sakinleri yerleştiriliyor…'); npcs = await new NpcManager({ world, scene, camera, player, onMaterial: m => { lighting.setupMaterial(m); world.mats.rechain(m); } }).init(); } catch (e) { console.error('NPC sistemi başlatılamadı', e); npcs = null; }
  map = new MapView(aerial, player, (x, z) => { player.place(x, z, player.yaw); world.update(x, z); });
  map.quest = () => questInfo;
  // uyarlanabilir kalite: ?q=auto|ultra|high|medium|low (varsayılan: otomatik)
  quality = new QualityManager({ renderer, post, lighting, world, scene, npcs, onChange: q => { $('qualV').textContent = q.label(); lighting.resize(); } });
  { const qp = new URLSearchParams(location.search).get('q'); const m = qp === 'auto' || ['ultra', 'high', 'medium', 'low'].includes(qp) ? qp : 'auto'; quality.setMode(m); $('qual').value = m; }
  if (npcs) { try { story = new Story({ world, npcs, player, camera }).init(); } catch (e) { console.error('Görev sistemi başlatılamadı', e); story = null; } }
  if (story) { try { prolog = new Prolog({ world, npcs, player, camera, story, setDate: d => applyDate(d) }).init(); npcs.onTalk = a => prolog.onTalk(a) || story.onTalk(a); } catch (e) { console.error('Prolog başlatılamadı', e); prolog = null; } }
  if (prolog) { try { combat = new Combat({ world, npcs, player, camera, scene, sfx, getFov: () => +$('fov').value }); prolog.combat = combat; } catch (e) { console.error('Savaş mekaniği başlatılamadı', e); combat = null; } }
  if (prolog) { try { bolum1 = new Bolum1({ world, npcs, prolog, story }).init(); } catch (e) { console.error('Bölüm 1 başlatılamadı', e); bolum1 = null; } }
  if (prolog && combat && bolum1) { try { bolum2 = new Bolum2({ world, npcs, prolog, story, combat, bolum1, sfx, camera }).init(); } catch (e) { console.error('Bölüm 2 başlatılamadı', e); bolum2 = null; } }
  applyDate();   // NPC'ler hazır: devriyeleri ve görevleri döneme göre ayarla
  if (prolog && bolum1) { try { bolum3 = new Bolum3({ world, npcs, prolog, story }).init(); } catch (e) { console.error('Bölüm 3 başlatılamadı', e); bolum3 = null; } }
  window.__antep = { applyDate, story, prolog, bolum1, bolum2, bolum3, combat, quality, world, player, lighting, map, camera, renderer, scene, post, MapCoordinates, npcs };
  progress(1, 'Hazır'); $('loading').classList.add('done'); $('start').disabled = false; ready = true; resize();
  $('stats').textContent = `${world.stats.lots.toLocaleString('tr-TR')} parsel · ${world.stats.chunks} parça · ${world.collision.count.toLocaleString('tr-TR')} çarpışma nesnesi` + (npcs ? ` · ${npcs.stats.agents} sakin (pilot)` : '') + (npcs && npcs.templates.size ? ` · ${npcs.templates.size} karakter modeli` : '') + (world.stats.textures ? ` · ${world.stats.textures} dış doku seti` : '');
})().catch(e => { console.error(e); $('loadText').textContent = 'Hata: ' + e.message; });

/* ---------------- arayüz ---------------- */
$('start').onclick = () => { $('intro').classList.add('hide'); audio.init(); player.enabled = true; player.lock(); };
canvas.addEventListener('click', () => { if (ready && !map.isOpen && !$('settings').classList.contains('show') && !$('journal').classList.contains('show') && $('intro').classList.contains('hide')) player.lock(); });
document.addEventListener('pointerlockchange', () => { $('lockHint').style.display = document.pointerLockElement ? 'none' : (ready && $('intro').classList.contains('hide') ? 'block' : 'none'); });
const toggleMap = () => { if (!map) return; if (map.isOpen) { map.close(); player.lock(); } else { document.exitPointerLock(); map.open(); } };
/* ---------------- Günlük: kronoloji + direniş teşkilatı ---------------- */
{ const tag = s => s === 'verified' ? '<span class="tag ok">KAYNAKLA UYUMLU</span>' : s === 'disputed' ? '<span class="tag as">TARİH TARTIŞMALI</span>' : '<span class="tag as">ZAYIF KAYNAK</span>';
  let yil = 0; $('chronoList').innerHTML = KRONOLOJI.map(k => `${k.date.y !== yil ? `<h5>${yil = k.date.y}</h5>` : ''}<div class="ev" data-id="${k.id}"><div class="d">${k.etiket || tarihYaz(k.date)} ${tag(k.status)}</div><h4>${k.baslik}</h4><p>${k.metin}</p>${k.not ? `<p class="n">${k.not}</p>` : ''}<p class="g">Oyunda: ${k.oyun}</p>${k.id === 'heyet' ? '<p class="g">Görev: Gizli Toplantı ve komisyon işleri bu günde oynanır.</p>' : ''}<button data-date="${k.id}">Bu güne git</button></div>`).join('');
  $('orgBox').innerHTML = `<h4>${TESKILAT.ad} ${tag(TESKILAT.status)}</h4><p>${TESKILAT.metin}</p><div class="plan"><b>${TESKILAT.plan.semt}</b> semt × <b>${TESKILAT.plan.kadro}</b> kişi = <b>${TESKILAT.plan.toplam.toLocaleString('tr-TR')}</b> kişilik plan</div><h4>Komisyonlar ${tag(TESKILAT.komisyonStatus)}</h4><ul>${TESKILAT.komisyonlar.map(k => `<li id="kom-${k.id}">${k.ad}</li>`).join('')}</ul><p class="n">Kaynaklar: ${KAYNAKLAR.map(k => `<a href="${k.url}" target="_blank" rel="noopener">${k.ad}</a>`).join(' · ')}</p>`;
  $('chronoList').onclick = e => { const id = e.target.dataset && e.target.dataset.date; if (!id) return; applyDate(KRONOLOJI.find(k => k.id === id).date); };
  applyDate(); }
const renderMet = () => { const M = npcs ? [...npcs.met.values()] : []; $('metBox').innerHTML = M.length ? M.map(m => `<div class="met"><b>${m.ad}</b> <span class="tag ${m.cemaat === 'Türk' ? 'ok' : 'as'}">${m.cemaat.toLocaleUpperCase('tr-TR')}</span><br><span>${m.meslek} · ilk görüşme: ${m.ilk} · ${m.kez} kez</span><br><i>“${m.son}”</i></div>`).join('') : '<p class="n">Henüz kimseyle konuşmadın. Sokakta birine yaklaşıp E\'ye bas.</p>'; };
const toggleJournal = () => { const j = $('journal'); j.classList.toggle('show'); if (j.classList.contains('show')) { document.exitPointerLock(); renderMet(); } };
$('btnJournal').onclick = toggleJournal; $('journalClose').onclick = toggleJournal;
const toggleSettings = () => { const s = $('settings'); s.classList.toggle('show'); if (s.classList.contains('show')) document.exitPointerLock(); };
addEventListener('keydown', e => { if (!ready) return; if (e.code === 'KeyM') toggleMap(); if (e.code === 'Escape' && map.isOpen) { map.close(); } if (e.code === 'KeyO') toggleSettings(); if (e.code === 'KeyJ') toggleJournal(); if (e.code === 'Escape' && $('journal').classList.contains('show')) toggleJournal(); if (e.code === 'KeyH') $('hud').classList.toggle('hidden'); if (e.code === 'KeyE' && npcs && !map.isOpen && player.enabled) npcs.interact(); });
$('btnMap').onclick = toggleMap; $('btnSet').onclick = toggleSettings; $('mapClose').onclick = () => map.close();
document.querySelectorAll('.tabs button[data-off]').forEach(b => b.onclick = () => { const t = $('tabNote'); t.textContent = `“${b.textContent}” sekmesi bu aşamada kapalı: ilk teslimat yalnızca harita altyapısını kapsıyor.`; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); });
$('eye').oninput = e => { player.cfg.eyeHeight = +e.target.value; $('eyeV').textContent = (+e.target.value).toFixed(2) + ' m'; };
$('tod').oninput = e => { const h = +e.target.value; lighting.set(h); $('todV').textContent = hhmm(h); };
$('qual').onchange = e => quality.setMode(e.target.value);
$('fov').oninput = e => { camera.fov = +e.target.value; camera.updateProjectionMatrix(); $('fovV').textContent = e.target.value + '°'; };
$('sens').oninput = e => player.sens = +e.target.value / 10000;
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { if (b.dataset.go === 'hero') { const sp = world.hero.spawn(); player.place(sp.x, sp.z, sp.yaw); $('settings').classList.remove('show'); return; } const l = L[b.dataset.go]; const off = { kale: [40, 200], kolej: [170, 30] }[b.dataset.go] || [0, 30]; player.place(l.x + off[0], l.z + off[1], Math.atan2(off[0], off[1])); world.update(player.pos.x, player.pos.z); $('settings').classList.remove('show'); });

function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (quality) quality.resize(); else renderer.setSize(innerWidth, innerHeight, false); lighting.resize(); }
addEventListener('resize', resize);

/* ---------------- ses (prosedürel ortam) ---------------- */
const audio = (() => { let ac, master, noise; return { init() { if (ac) return; try { ac = new AudioContext(); master = ac.createGain(); master.gain.value = .45; master.connect(ac.destination);
    const len = ac.sampleRate * 3, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } noise = buf;
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = ac.createGain(); g.gain.value = .25; src.connect(f).connect(g).connect(master); src.start(); } catch (e) { } },
  /** uzaktan silah sesi: tüfek (kısa, tiz) ya da top (uzun, boğuk). Yalnız atmosfer; görünür bir çatışma yok. */
  gun(boom) { if (!ac) return; const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = boom ? 140 : 900 + Math.random() * 500; const g = ac.createGain(); const v = boom ? .5 : .1 + Math.random() * .1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0005, t + (boom ? 2.2 : .32)); s.connect(f).connect(g).connect(master); s.start(t, Math.random() * 2, boom ? 2.3 : .35);
    if (!boom && Math.random() < .5) setTimeout(() => this.gun(false), 180 + Math.random() * 500); },
  /** kısa gürültü patlaması: f = süzgeç frekansı, d = süre, v = şiddet */
  burst(type, f, d, v, at = 0) { if (!ac) return; const t = ac.currentTime + at, s = ac.createBufferSource(); s.buffer = noise; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.001, v), t + .006); g.gain.exponentialRampToValueAtTime(.0004, t + d); s.connect(fl).connect(g).connect(master); s.start(t, Math.random() * 2, d + .05); },
  shot(v = 1) { this.burst('highpass', 900, .16, .9 * v); this.burst('lowpass', 220, .5, 1.1 * v); this.burst('bandpass', 500, 1.1, .12 * v, .05); },
  click() { this.burst('highpass', 2500, .04, .25); },
  reload() { this.burst('highpass', 1800, .05, .3); this.burst('highpass', 1400, .06, .3, .9); this.burst('highpass', 2200, .05, .35, 1.9); },
  hurt() { this.burst('lowpass', 160, .35, 1.2); },
  thud() { this.burst('lowpass', 300, .2, .35, .12); },
  /** top mermisi: ıslık + patlama. v = yakınlık (0..1) */
  shell(v = .6) { if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(260, t + .9); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05 * v + .01, t + .5); g.gain.exponentialRampToValueAtTime(.0005, t + .95); o.connect(g).connect(master); o.start(t); o.stop(t + 1);
    this.burst('lowpass', 110, 2.6, 1.6 * v + .25, .95); this.burst('bandpass', 700, .5, .5 * v, .95); },
  step(sp) { if (!ac) return; const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700 + Math.random() * 500; f.Q.value = 1.2; const g = ac.createGain(); const v = Math.min(.5, .25 + sp * .05); g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .14); s.connect(f).connect(g).connect(master); s.start(0, Math.random() * 2, .16); } }; })();

const sfx = { shot: v => audio.shot(v), click: () => audio.click(), reload: () => audio.reload(), hurt: () => audio.hurt(), thud: () => audio.thud(), shell: v => audio.shell(v) };

/* ---------------- görev hedefi ve rota (harita + mini harita) ---------------- */
let questInfo = null;
function updateQuest() { const T = prolog && prolog.ch ? prolog.targets() : story && story.active ? story.targets() : []; if (!T.length || !npcs) { questInfo = null; return; }
  const P = player.pos; let t = T[0], bd = 1e9; for (const k of T) { const d = Math.hypot(k.x - P.x, k.z - P.z); if (d < bd) { bd = d; t = k; } }
  // rota: sokak ağı üzerinden (kahraman sokak çevresi, yoksa oyuncunun çevresindeki ağ); bulunamazsa düz çizgi
  let route = [[P.x, P.z], [t.x, t.z]]; for (const nav of [npcs.nav, npcs.amb.nav]) { if (!nav) continue; const a = nav.nearest(P.x, P.z, 45), b = nav.nearest(t.x, t.z, 45); const p = a && b ? nav.path(a, b) : null; if (p) { route = [[P.x, P.z], ...p.map(n => [n.x, n.z]), [t.x, t.z]]; break; } }
  const li = document.querySelector('#objList li:not(.done)'); questInfo = { target: t, route, text: t.label || (li ? li.textContent.replace(/\.$/, '') : '') }; }

/* ---------------- döngü ---------------- */
let last = performance.now(), acc = 0, frames = 0, fpsT = 0;
function loop(now) { requestAnimationFrame(loop); const raw = (now - last) / 1000, dt = Math.min(.05, raw); last = now; if (!ready || window.__pause || ctxLost) return; frame(dt, now); if (quality && $('intro').classList.contains('hide')) quality.frame(raw); }
function frame(dt, now = performance.now()) {
  if (!map.isOpen) player.update(dt); if (npcs && !map.isOpen) npcs.update(dt, lighting.time); if (story && !map.isOpen) story.update(dt); if (prolog && !map.isOpen) prolog.update(dt); if (combat && !map.isOpen) combat.update(dt);
  if ((frame.qn = (frame.qn || 0) + 1) % 30 === 1) updateQuest();
  if (kusatma && player.enabled && !map.isOpen && !(prolog && prolog.quiet)) { frame.gun = (frame.gun ?? 6) - dt; if (frame.gun <= 0) { frame.gun = 5 + Math.random() * 16; audio.gun(Math.random() < .22); } } /* kuşatma: uzaktan silah sesleri */
  world.update(player.pos.x, player.pos.z); lighting.update();
  if (world.terrain.waterMesh) world.terrain.waterMesh.material.normalMap.offset.set(now * .00002, now * .00004);
  { const f = npcs && npcs.focus && !map.isOpen ? npcs.focus.id : -1; if (f !== frame.hint) { frame.hint = f; $('talkHint').style.display = f >= 0 ? 'block' : 'none'; if (f >= 0) $('talkWho').textContent = npcs.focusLabel(); } }
  post.updateSun(lighting.sun.dir, camera); post.render(); if (!map.isOpen) map.drawMini();
  frames++; fpsT += dt; if (fpsT > .5) { $('fps').textContent = Math.round(frames / fpsT) + ' fps' + (quality ? ' · ' + quality.label() : ''); frames = 0; fpsT = 0; $('coord').textContent = MapCoordinates.format(player.pos.x, player.pos.z) + (player.noclip ? '  · SERBEST KAMERA' : ''); }
}
requestAnimationFrame(loop);
window.__renderOnce = (dt = .016) => { frame(dt); return renderer.info.render; };

/* ---------------- WebGL bağlam kaybı ---------------- */
// GPU belleği taşarsa ya da sürücü sıfırlanırsa tarayıcı bağlamı düşürür: döngüyü durdur, geri gelince bir kademe düşerek devam et.
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ctxLost = true; const n = $('ctxNote'); n.textContent = 'Grafik bağlamı kayboldu, geri yükleniyor…'; n.style.display = 'block';
  setTimeout(() => { if (ctxLost) n.innerHTML = 'Grafik bağlamı geri gelmedi. <a href="?q=low" style="color:#f0c77a">Düşük kalitede yeniden yükle</a>'; }, 6000); });
canvas.addEventListener('webglcontextrestored', () => { ctxLost = false; $('ctxNote').style.display = 'none'; if (quality) { const o = ['ultra', 'high', 'medium', 'low'], i = o.indexOf(quality.tier); quality.setMode(o[Math.min(o.length - 1, i + 1)]); $('qual').value = quality.mode; } lighting.set(lighting.time); });
