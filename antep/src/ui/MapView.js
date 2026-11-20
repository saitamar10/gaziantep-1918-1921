// Tam ekran harita (M) + köşe mini haritası. Arka plan: gerçek sahneden üretilen tepeden görüntü.
// Doğrulanmış konumlar dolu, varsayımlar kesikli/italik gösterilir.
import { CONFIG } from '../config.js';
import { MapCoordinates } from '../core/MapCoordinates.js';
import { LANDMARKS, NEIGHBORHOODS, SOURCES, GLOBAL_ASSUMPTIONS } from '../data/historicalReferences.js';
import { REGIONS } from '../data/regions.js';
import { AXES, ROADS } from '../world/Streets.js';
import { RIVER } from '../world/Terrain.js';

const ICON = { kale: '♜', cami: '☾', kilise: '✝', katedral: '✝', han: '⌂', bedesten: '⌂', carsi: '⚖', kolej: '✎', hastane: '✚' };

export class MapView {
  constructor(aerial, player, onTeleport) { this.img = aerial; this.player = player; this.onTeleport = onTeleport; this.el = document.getElementById('mapScreen'); this.cv = document.getElementById('mapCanvas'); this.g = this.cv.getContext('2d');
    this.zoom = 1; this.cx = 0; this.cz = 380; this.quest = null; this.markers = []; this.showRegions = new Set(REGIONS.map(r => r.id)); this.hover = null; this.mouse = [0, 0];
    this.mini = document.getElementById('miniCanvas'); this.mg = this.mini.getContext('2d');
    this.buildPanel(); this.bind(); }
  get B() { return CONFIG.bounds; }
  w2s(x, z) { const s = this.scale(); return [this.cv.width / 2 + (x - this.cx) * s, this.cv.height / 2 + (z - this.cz) * s]; }
  s2w(px, py) { const s = this.scale(); return [this.cx + (px - this.cv.width / 2) / s, this.cz + (py - this.cv.height / 2) / s]; }
  scale() { return this.cv.width / 2400 * this.zoom; }
  open() { this.el.classList.add('show'); this.cx = this.player.pos.x; this.cz = this.player.pos.z; this.resize();
    const Q = this.quest ? this.quest() : null; if (Q && Q.target) { const P = this.player.pos; this.cx = (P.x + Q.target.x) / 2; this.cz = (P.z + Q.target.z) / 2; const span = Math.max(420, Math.hypot(Q.target.x - P.x, Q.target.z - P.z) * 3.2); this.zoom = Math.max(.4, Math.min(8, 2400 / span)); }
    this.draw(); }
  close() { this.el.classList.remove('show'); }
  get isOpen() { return this.el.classList.contains('show'); }
  resize() { const r = this.cv.getBoundingClientRect(); this.cv.width = r.width * devicePixelRatio; this.cv.height = r.height * devicePixelRatio; }
  bind() { let drag = null; const c = this.cv;
    c.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); this.mouse = [(e.clientX - r.left) * devicePixelRatio, (e.clientY - r.top) * devicePixelRatio]; if (drag) { const s = this.scale() / devicePixelRatio; this.cx -= (e.clientX - drag.x) / s; this.cz -= (e.clientY - drag.y) / s; drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; } this.draw(); });
    c.addEventListener('pointerup', e => { if (drag && drag.moved < 4) this.click(); drag = null; });
    c.addEventListener('wheel', e => { e.preventDefault(); const before = this.s2w(...this.mouse); this.zoom = Math.max(.4, Math.min(14, this.zoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18))); const after = this.s2w(...this.mouse); this.cx += before[0] - after[0]; this.cz += before[1] - after[1]; this.draw(); }, { passive: false });
    c.addEventListener('contextmenu', e => { e.preventDefault(); const [x, z] = this.s2w(...this.mouse); this.markers.push({ x, z }); this.draw(); });
    addEventListener('keydown', e => { if (!this.isOpen) return; if (e.code === 'KeyF') { const [x, z] = this.s2w(...this.mouse); this.onTeleport(x, z); this.close(); } if (e.code === 'KeyR') { this.zoom = Math.min(14, this.zoom * 1.3); this.draw(); } if (e.code === 'KeyT') { this.zoom = Math.max(.4, this.zoom / 1.3); this.draw(); } });
    addEventListener('resize', () => { if (this.isOpen) { this.resize(); this.draw(); } }); }
  click() { const h = this.pick(); const card = document.getElementById('mapCard'); if (!h) { card.classList.remove('show'); return; }
    const st = h.status === 'verified' ? '<span class="tag ok">Konum doğrulanmış</span>' : '<span class="tag as">Tasarım varsayımı</span>';
    card.innerHTML = `<h3>${h.name}</h3>${st}<p>${h.facts || ''}</p>${h.assumptions ? `<p class="as">Varsayım: ${h.assumptions}</p>` : ''}<p class="coord">${MapCoordinates.format(h.x, h.z)}</p>${(h.src || []).map(k => SOURCES[k] ? `<a href="${SOURCES[k].url}" target="_blank" rel="noopener">${SOURCES[k].title}</a>` : '').join('<br>')}`; card.classList.add('show'); }
  pick() { let best = null, bd = 26 * devicePixelRatio; for (const l of LANDMARKS) { const [px, py] = this.w2s(l.x, l.z); const d = Math.hypot(px - this.mouse[0], py - this.mouse[1]); if (d < bd) { bd = d; best = l; } } return best; }
  buildPanel() { const reg = document.getElementById('regionList'); reg.innerHTML = REGIONS.map(r => `<label><input type="checkbox" data-r="${r.id}" checked><i style="background:${r.color}"></i>${r.no}. ${r.name}${r.status === 'assumption' ? ' <em>(sınır varsayım)</em>' : ''}</label>`).join('');
    reg.querySelectorAll('input').forEach(i => i.onchange = () => { i.checked ? this.showRegions.add(i.dataset.r) : this.showRegions.delete(i.dataset.r); this.draw(); });
    document.getElementById('assumpList').innerHTML = GLOBAL_ASSUMPTIONS.map(a => `<li>${a}</li>`).join(''); }
  path(pts) { const g = this.g; g.beginPath(); pts.forEach(([x, z], i) => { const [px, py] = this.w2s(x, z); i ? g.lineTo(px, py) : g.moveTo(px, py); }); }
  plaque(text, px, py, { italic = false, dashed = false, big = false } = {}) { const g = this.g, d = devicePixelRatio; const fs = (big ? 17 : 14) * d; g.font = `${italic ? 'italic ' : ''}600 ${fs}px "Cormorant Garamond", Georgia, serif`; const w = g.measureText(text).width + 16 * d, h = fs + 10 * d;
    g.fillStyle = 'rgba(22,16,10,.82)'; g.strokeStyle = dashed ? 'rgba(201,162,74,.7)' : 'rgba(201,162,74,.95)'; g.lineWidth = 1.2 * d; g.setLineDash(dashed ? [4 * d, 3 * d] : []); const x = px - w / 2, y = py - h / 2; g.beginPath(); g.roundRect(x, y, w, h, 4 * d); g.fill(); g.stroke(); g.setLineDash([]);
    g.fillStyle = italic ? '#e8d9b8' : '#f6ead0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, px, py + 1 * d); }
  draw() { const g = this.g, d = devicePixelRatio, W = this.cv.width, H = this.cv.height; g.fillStyle = '#1b140d'; g.fillRect(0, 0, W, H);
    const [ax, ay] = this.w2s(this.B.minX, this.B.minZ), [bx, by] = this.w2s(this.B.maxX, this.B.maxZ); g.imageSmoothingQuality = 'high'; g.drawImage(this.img, ax, ay, bx - ax, by - ay);
    // bölgeler
    for (const r of REGIONS) { if (!r.poly || !this.showRegions.has(r.id)) continue; this.path(r.poly); g.closePath(); g.fillStyle = r.color + '22'; g.fill(); g.strokeStyle = r.color; g.lineWidth = 2 * d; g.setLineDash(r.status === 'assumption' ? [8 * d, 6 * d] : []); g.stroke(); g.setLineDash([]); }
    // akslar (varsayım) ve dere
    g.lineCap = 'round'; for (const a of AXES) { this.path(a.pts); g.strokeStyle = 'rgba(245,230,195,.35)'; g.lineWidth = Math.max(1.5, a.w * this.scale() * .5); g.stroke(); }
    this.path(RIVER); g.strokeStyle = 'rgba(70,120,140,.5)'; g.lineWidth = Math.max(1.5, 4 * this.scale()); g.stroke();
    // mahalle adları (plan türevli — varsayım)
    if (this.zoom > .8) for (const n of NEIGHBORHOODS) { const [px, py] = this.w2s(n.x, n.z); this.plaque(n.name, px, py, { italic: true, dashed: true }); }
    // simge yapılar
    for (const l of LANDMARKS) { const [px, py] = this.w2s(l.x, l.z); const ok = l.status === 'verified';
      g.beginPath(); g.arc(px, py, 11 * d, 0, 7); g.fillStyle = ok ? 'rgba(142,43,32,.95)' : 'rgba(60,45,30,.9)'; g.fill(); g.lineWidth = 2 * d; g.strokeStyle = '#e8c27a'; g.setLineDash(ok ? [] : [3 * d, 3 * d]); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#fff3d6'; g.font = `${13 * d}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ICON[l.type] || '•', px, py + 1);
      if (this.zoom > 1.6 || ['kale', 'kolej', 'zincirli', 'meryemana', 'kendirli'].includes(l.id)) this.plaque(l.name, px, py - 26 * d, { dashed: !ok, big: l.id === 'kale' }); }
    // görev: rota (kesikli altın çizgi) ve hedef
    { const Q = this.quest ? this.quest() : null; if (Q && Q.target) { if (Q.route && Q.route.length > 1) { this.path(Q.route); g.strokeStyle = 'rgba(18,13,8,.8)'; g.lineWidth = 6 * d; g.stroke(); this.path(Q.route); g.strokeStyle = '#f5c76f'; g.lineWidth = 3 * d; g.setLineDash([10 * d, 7 * d]); g.stroke(); g.setLineDash([]); }
      const [qx, qy] = this.w2s(Q.target.x, Q.target.z); g.save(); g.translate(qx, qy); g.rotate(Math.PI / 4); g.fillStyle = '#f5c76f'; g.strokeStyle = '#120d08'; g.lineWidth = 2 * d; g.fillRect(-8 * d, -8 * d, 16 * d, 16 * d); g.strokeRect(-8 * d, -8 * d, 16 * d, 16 * d); g.restore(); if (Q.text) this.plaque(Q.text, qx, qy - 28 * d, { big: true }); } }
    // kullanıcı işaretleri
    this.markers.forEach(m => { const [px, py] = this.w2s(m.x, m.z); g.fillStyle = '#e8b84a'; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 7 * d, py - 16 * d); g.lineTo(px + 7 * d, py - 16 * d); g.fill(); });
    // oyuncu
    const [px, py] = this.w2s(this.player.pos.x, this.player.pos.z); g.save(); g.translate(px, py); g.rotate(-this.player.yaw); g.fillStyle = '#ff5a3c'; g.strokeStyle = '#fff'; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(0, -13 * d); g.lineTo(8 * d, 9 * d); g.lineTo(0, 4 * d); g.lineTo(-8 * d, 9 * d); g.closePath(); g.fill(); g.stroke(); g.restore();
    // ölçek çubuğu
    const s = this.scale(); let len = 1000; while (len * s > W * .25) len /= 2; const x0 = W - 40 * d - len * s, y0 = H - 40 * d; g.strokeStyle = '#efe0bf'; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + len * s, y0); g.stroke(); for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(x0 + len * s * i / 4, y0); g.lineTo(x0 + len * s * i / 4, y0 - 6 * d); g.stroke(); }
    g.fillStyle = '#efe0bf'; g.font = `${12 * d}px "Cormorant Garamond", serif`; g.textAlign = 'center'; for (let i = 0; i <= 4; i++) g.fillText(Math.round(len * i / 4) + (i === 4 ? ' m' : ''), x0 + len * s * i / 4, y0 + 14 * d);
    const [mx, mz] = this.s2w(...this.mouse); document.getElementById('mapCoord').textContent = MapCoordinates.format(mx, mz);
    const h = this.pick(); this.cv.style.cursor = h ? 'pointer' : 'grab'; }
  /** sol alt yuvarlak mini harita */
  drawMini() { const g = this.mg, c = this.mini, d = devicePixelRatio; if (c.width !== c.clientWidth * d) { c.width = c.clientWidth * d; c.height = c.clientHeight * d; } const W = c.width, R = W / 2; const S = W / 380; // 380 m çap
    g.save(); g.clearRect(0, 0, W, W); g.beginPath(); g.arc(R, R, R - 2, 0, 7); g.clip(); g.translate(R, R); g.rotate(this.player.yaw); g.translate(-R, -R);
    const sx = this.img.width / (this.B.maxX - this.B.minX); const px = (this.player.pos.x - this.B.minX) * sx, pz = (this.player.pos.z - this.B.minZ) * sx; const half = W / 2 / S * sx;
    g.drawImage(this.img, px - half, pz - half, half * 2, half * 2, 0, 0, W, W);
    for (const l of LANDMARKS) { const x = R + (l.x - this.player.pos.x) * S, y = R + (l.z - this.player.pos.z) * S; if (Math.hypot(x - R, y - R) < R) { g.fillStyle = 'rgba(142,43,32,.95)'; g.beginPath(); g.arc(x, y, 7 * d, 0, 7); g.fill(); g.fillStyle = '#fff3d6'; g.font = `${10 * d}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ICON[l.type] || '•', x, y); } }
    { const Q = this.quest ? this.quest() : null; if (Q && Q.target) { const P = this.player.pos; if (Q.route && Q.route.length > 1) { g.beginPath(); Q.route.forEach(([x, z], i) => { const X = R + (x - P.x) * S, Y = R + (z - P.z) * S; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.strokeStyle = '#f5c76f'; g.lineWidth = 3 * d; g.setLineDash([6 * d, 4 * d]); g.stroke(); g.setLineDash([]); }
      let X = (Q.target.x - P.x) * S, Y = (Q.target.z - P.z) * S; const Ln = Math.hypot(X, Y), lim = R - 13 * d, out = Ln > lim; if (out) { X *= lim / Ln; Y *= lim / Ln; } g.save(); g.translate(R + X, R + Y); g.fillStyle = '#f5c76f'; g.strokeStyle = '#120d08'; g.lineWidth = 1.5 * d;
      if (out) { g.rotate(Math.atan2(Y, X)); g.beginPath(); g.moveTo(10 * d, 0); g.lineTo(-6 * d, -8 * d); g.lineTo(-6 * d, 8 * d); g.closePath(); g.fill(); g.stroke(); } else { g.rotate(Math.PI / 4); g.fillRect(-6 * d, -6 * d, 12 * d, 12 * d); g.strokeRect(-6 * d, -6 * d, 12 * d, 12 * d); } g.restore(); } }
    g.restore(); g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 1.5 * d; g.beginPath(); g.moveTo(R, R - 10 * d); g.lineTo(R + 7 * d, R + 8 * d); g.lineTo(R, R + 3 * d); g.lineTo(R - 7 * d, R + 8 * d); g.closePath(); g.fill(); g.stroke();
    const nx = R + Math.sin(this.player.yaw) * (R - 12 * d) * -1 * -1, ny = R - Math.cos(this.player.yaw) * (R - 12 * d); document.getElementById('miniN').style.transform = `translate(${(Math.sin(this.player.yaw) * (R - 11 * d)) / d}px, ${(-Math.cos(this.player.yaw) * (R - 11 * d)) / d}px)`; }
}
