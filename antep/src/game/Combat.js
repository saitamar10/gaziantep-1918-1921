// SAVAŞ MEKANİĞİ — birinci şahıs tüfek, sınırlı mühimmat, siper, düşman ve müttefik davranışı.
// Dönem: sürgülü mekanizmalı piyade tüfeği (5 fişeklik şarjör, her atıştan sonra mekanizma kurulur). Model ve ses yer tutucudur.
// Siper: çömelmiş (C) oyuncu ile atıcı arasında alçak bir siper (taş duvar, kaya, barikat) varsa isabet olasılığı çok düşer;
//        bina duvarları ve arazi görüşü tamamen keser.
// Tarihî sonuç sabittir: çatışmalar "kazanılmaz"; sahne bittiğinde hikâye kendi tarihî sonucuna ilerler (bkz. scenes.js 'sabit').
// Şiddet gösterimi sadedir: vurulan asker yere düşer; kan ve parçalanma yoktur.
import * as THREE from 'three';
import { rng } from '../core/MapCoordinates.js';

const CLIP = 5, BOLT = 1.25, RELOAD = 2.6, POOL = 9;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Combat {
  constructor({ world, npcs, player, camera, scene, sfx, getFov }) {
    Object.assign(this, { world, npcs, player, camera, scene, sfx, getFov }); this.R = rng(1920); this.covers = []; this.active = false; this.result = null; this.equipped = false;
    this.clip = CLIP; this.reserve = 25; this.cool = 0; this.reloadT = 0; this.ads = 0; this.adsOn = false; this.kick = 0; this.hp = 100; this.hurtT = 0; this.sinceHit = 99; this.enemies = []; this.allies = [];
    this.buildWeapon(); this.buildFx();
    // düşman havuzu (Fransız piyadesi; tüfek elde)
    this.pool = []; for (let i = 0; i < POOL; i++) { const a = npcs.addStory('K09', 'dusman', { x: 0, z: 0, yaw: 0 }, { grp: 'cmb', role: 'dusman', outfit: { prop: 'rifleh' } }); a.external = true; a.hidden = true; this.pool.push(a); }
    this.el = { ammo: document.getElementById('ammo'), vig: document.getElementById('hpVig') };
    addEventListener('mousedown', e => { if (!this.canAct()) return; if (e.button === 0) this.fire(); if (e.button === 2) this.adsOn = true; });
    addEventListener('mouseup', e => { if (e.button === 2) this.adsOn = false; });
    addEventListener('contextmenu', e => { if (this.equipped && document.pointerLockElement) e.preventDefault(); });
    addEventListener('keydown', e => { if (e.code === 'KeyR' && this.canAct()) this.reload(); });
    this.hud();
  }
  canAct() { return this.equipped && this.player.enabled && !!document.pointerLockElement && this.hp > 0; }

  /* ---------------- siper kaydı ---------------- */
  addCover(x, z, r = .7) { const c = { x, z, r, on: true }; this.covers.push(c); return c; }
  /** hedef ile atıcı arasında, hedefin hemen önünde alçak siper var mı */
  coverFactor(T, S, crouched) { const dx = S.x - T.x, dz = S.z - T.z, l = Math.hypot(dx, dz) || 1; for (const c of this.covers) { if (!c.on) continue; const cx = c.x - T.x, cz = c.z - T.z, d = Math.hypot(cx, cz); if (d > 1.9 + c.r || d < .05) continue; if ((cx * dx + cz * dz) / (d * l) > .35) return crouched ? .12 : .6; } return 1; }
  /** görüş: bina/duvar çokgenleri ve arazi keser */
  los(ax, ay, az, bx, by, bz) { if (this.world.collision.losBlocked(ax, az, bx, bz)) return false; const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 5); for (let i = 1; i < n; i++) { const t = i / n; if (ay + (by - ay) * t < this.world.groundAt(ax + (bx - ax) * t, az + (bz - az) * t) + .15) return false; } return true; }

  /* ---------------- oyuncunun tüfeği ---------------- */
  buildWeapon() {
    const g = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ color: '#5a3b22', roughness: .8 }), steel = new THREE.MeshStandardMaterial({ color: '#2b2c2e', roughness: .45, metalness: .8 }); this.npcs.onMaterial(wood); this.npcs.onMaterial(steel);
    const B = (m, sx, sy, sz, x, y, z, rx = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.rotation.x = rx; g.add(b); return b; };
    B(wood, .05, .07, .62, 0, 0, -.18); B(wood, .045, .11, .3, 0, -.035, .22, .12); B(steel, .022, .022, .78, 0, .04, -.3); B(steel, .03, .03, .14, 0, .045, .08); this.bolt = B(steel, .07, .02, .02, .045, .045, .1); B(steel, .008, .03, .008, 0, .07, -.66); B(steel, .02, .02, .02, 0, .065, .02);
    this.flash = new THREE.Object3D(); this.flash.intensity = 0; this.flash.position.set(0, .05, -.75); g.add(this.flash);   /* yalnız parlayan küre; sahneye ışık eklenmez */
    const fm = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: 0 })); fm.position.copy(this.flash.position); g.add(fm); this.flashMesh = fm;
    g.visible = false; this.gun = g; this.player.viewmodel.add(g);
  }
  buildFx() { this.tracers = []; for (let i = 0; i < 10; i++) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#fff2c2', transparent: true, opacity: 0, fog: false })); l.frustumCulled = false; l.visible = false; this.scene.add(l); this.tracers.push({ l, t: 0 }); } this.ti = 0; }
  tracer(ax, ay, az, bx, by, bz) { const t = this.tracers[this.ti++ % this.tracers.length], p = t.l.geometry.attributes.position; p.setXYZ(0, ax, ay, az); p.setXYZ(1, bx, by, bz); p.needsUpdate = true; t.l.visible = true; t.l.material.opacity = .8; t.t = .09; }
  equip(on) { this.equipped = on; this.gun.visible = on; if (!on) { this.adsOn = false; } this.hud(); }
  resupply(n = 25) { this.reserve = Math.max(this.reserve, n); this.clip = CLIP; this.hud(); }
  fire() {
    if (this.cool > 0 || this.reloadT > 0) return; if (this.clip <= 0) { this.sfx.click(); if (this.reserve > 0) this.reload(); return; }
    this.clip--; this.cool = BOLT; this.kick = 1; this.flash.intensity = 7; this.flashMesh.material.opacity = .9; this.sfx.shot(1); this.hud();
    const cam = this.camera, o = cam.getWorldPosition(new THREE.Vector3()), d = cam.getWorldDirection(new THREE.Vector3()); const sp = (this.ads > .7 ? .0025 : .012) + Math.min(.012, Math.hypot(this.player.vel.x, this.player.vel.y) * .002);
    d.x += (this.R() - .5) * sp * 2; d.y += (this.R() - .5) * sp * 2; d.z += (this.R() - .5) * sp * 2; d.normalize();
    // en yakın isabet: düşmanın dikey ekseni
    let best = null, bt = 260; const h2 = d.x * d.x + d.z * d.z;
    if (h2 > 1e-6) for (const e of this.enemies) { if (e.state === 'down' || e.a.hidden) continue; const a = e.a, t = ((a.x - o.x) * d.x + (a.z - o.z) * d.z) / h2; if (t <= 0 || t >= bt) continue; const mx = o.x + d.x * t - a.x, mz = o.z + d.z * t - a.z; if (mx * mx + mz * mz > .38 * .38) continue; const y = o.y + d.y * t, top = (e.kneel ? 1.25 : 1.82) * a.scale; if (y < a.y + .1 || y > a.y + top) continue; best = e; bt = t; }
    const end = o.clone().addScaledVector(d, best ? bt : 120);
    if (best && !this.los(o.x, o.y, o.z, end.x, end.y, end.z)) best = null;
    this.tracer(o.x + d.x * .9, o.y - .08 + d.y * .9, o.z + d.z * .9, end.x, end.y, end.z);
    if (best) this.down(best);
  }
  reload() { if (this.reloadT > 0 || this.clip >= CLIP || this.reserve <= 0) return; this.reloadT = RELOAD; this.sfx.reload(); this.hud(); }
  hud() { if (!this.el || !this.el.ammo) return; this.el.ammo.style.display = this.equipped ? 'block' : 'none'; this.el.ammo.innerHTML = this.reloadT > 0 ? '<i>dolduruluyor…</i>' : `<b>${this.clip}</b> / ${this.reserve}` + (this.clip === 0 ? ' <i>R: doldur</i>' : ''); }
  /** oyuncu hasarı (düşman atışı, şarapnel) */
  damage(n) { if (this.hp <= 0) return; this.hp = Math.max(0, this.hp - n); this.hurtT = 1; this.sinceHit = 0; this.sfx.hurt(); if (this.hp <= 0 && this.active) this.result = 'lost'; }

  /* ---------------- çatışma sahnesi ---------------- */
  /** cfg: { allies: [ajan], spawns: [{x,z}], lanes: [[{x,z}…]], waves: [{ n, gap }], limit: sn, onTick(t, combat), targetBias } */
  start(cfg) { this.stop(); this.cfg = cfg; this.active = true; this.result = null; this.t = 0; this.wave = -1; this.waveT = 2; this.spawned = 0; this.spawnT = 0; this.hp = 100; this.npcs.setGroup('cmb', true);
    this.allies = (cfg.allies || []).filter(Boolean).map(a => { a.external = true; a.anim = 'kneelaim'; return { a, hp: 2, fireT: 2 + this.R() * 3, down: false, safe: a.tag === 'karayilan' }; }); }
  stop() { this.active = false; for (const e of this.enemies) { e.a.hidden = true; e.a.anim = 'idle'; } this.enemies = []; for (const al of this.allies) { al.a.external = false; } this.allies = []; this.npcs.setGroup('cmb', false); if (this.result !== 'lost') this.hp = Math.max(this.hp, 60); }
  spawn() { const a = this.pool.find(p => p.hidden && !this.enemies.some(e => e.a === p)); if (!a) return false; const cfg = this.cfg, i = this.spawned, s = cfg.spawns[i % cfg.spawns.length], lane = cfg.lanes[(i + this.wave) % cfg.lanes.length];
    a.x = s.x + (this.R() - .5) * 6; a.z = s.z + (this.R() - .5) * 6; a.y = this.world.groundAt(a.x, a.z); a.hidden = false; a.anim = 'run'; a.benched = false;
    this.enemies.push({ a, lane, ci: 0, goal: lane[0], state: 'advance', t: 0, fireT: 1, aimT: 0, kneel: false, wave: this.wave }); return true; }
  down(e) { e.state = 'down'; e.a.anim = 'down'; e.a.animScale = 1; e.kneel = false; this.sfx.thud(); }
  update(dt) {
    // tüfek: geri tepme, nişan, doldurma
    this.cool = Math.max(0, this.cool - dt); this.kick = Math.max(0, this.kick - dt * 5); this.flash.intensity = Math.max(0, this.flash.intensity - dt * 90); this.flashMesh.material.opacity = Math.max(0, this.flashMesh.material.opacity - dt * 14);
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { const n = Math.min(CLIP - this.clip, this.reserve); this.clip += n; this.reserve -= n; this.hud(); } }
    this.ads += ((this.adsOn && this.equipped && this.reloadT <= 0 ? 1 : 0) - this.ads) * Math.min(1, dt * 10);
    if (this.equipped) { const a = this.ads, k = this.kick, low = this.reloadT > 0 ? Math.min(1, (RELOAD - Math.abs(this.reloadT - RELOAD / 2) * 2) / .6) : 0, bob = Math.sin(this.player.bob) * .006;
      this.gun.position.set(.2 * (1 - a), -.2 * (1 - a) - .112 * a - low * .16 + bob, -.42 + .06 * a + k * .07); this.gun.rotation.set(k * .09 - low * .5, low * .5, 0); this.bolt.position.z = .1 + (this.cool > BOLT - .7 && this.cool < BOLT - .15 ? .07 : 0);
      const base = this.getFov(), f = base - (base - 46) * a; if (Math.abs(this.camera.fov - f) > .05) { this.camera.fov = f; this.camera.updateProjectionMatrix(); } }
    for (const t of this.tracers) if (t.t > 0) { t.t -= dt; t.l.material.opacity = Math.max(0, t.t / .09) * .8; if (t.t <= 0) t.l.visible = false; }
    // sağlık: vurulmadan 6 sn geçince yavaşça toparlan
    this.sinceHit += dt; this.hurtT = Math.max(0, this.hurtT - dt * 1.6); if (this.hp > 0 && this.hp < 100 && this.sinceHit > 6) this.hp = Math.min(100, this.hp + dt * 7);
    if (this.el.vig) this.el.vig.style.opacity = (clamp((100 - this.hp) / 100, 0, 1) * .75 + this.hurtT * .35).toFixed(2);
    if (!this.active || this.result) return;
    const cfg = this.cfg, P = this.player.pos, R = this.R; this.t += dt; if (cfg.onTick) cfg.onTick(this.t, this);
    // dalgalar
    const alive = this.enemies.filter(e => e.state !== 'down' && e.state !== 'gone');
    if (this.wave < 0 || (this.spawned >= cfg.waves[this.wave].n && !alive.length)) { this.waveT -= dt; if (this.waveT <= 0) { if (this.wave + 1 >= cfg.waves.length) { this.result = 'won'; return; } this.wave++; this.spawned = 0; this.spawnT = 0; this.waveT = 5;
        this.enemies = this.enemies.filter(e => { if (e.wave < this.wave) { e.a.hidden = true; return false; } return true; }); }   /* önceki dalganın askerleri havuza döner */ }
    else if (this.spawned < cfg.waves[this.wave].n) { this.spawnT -= dt; if (this.spawnT <= 0 && this.spawn()) { this.spawned++; this.spawnT = cfg.waves[this.wave].gap || 2.5; } }
    if (cfg.limit && this.t > cfg.limit) { this.result = 'won'; return; }
    // kayıp çoğalınca kalanlar çekilir
    if (this.wave >= 0) { const W = this.enemies.filter(e => e.wave === this.wave), n = cfg.waves[this.wave].n, up = W.filter(e => e.state !== 'down' && e.state !== 'gone'); if (this.spawned >= n && n >= 3 && up.length <= Math.floor(n * .34)) up.forEach(e => { if (e.state !== 'retreat') { e.state = 'retreat'; e.kneel = false; } }); }
    const eye = this.player.cfg.eyeHeight - this.player.crouch * .55;
    for (const e of this.enemies) { const a = e.a; if (e.state === 'down' || e.state === 'gone') continue; a.y = this.world.groundAt(a.x, a.z);
      if (e.state === 'advance' || e.state === 'retreat') { const g = e.state === 'retreat' ? cfg.spawns[0] : e.goal, dx = g.x - a.x, dz = g.z - a.z, d = Math.hypot(dx, dz), sp = e.state === 'retreat' ? 4.2 : 3.3; e.kneel = false;
        if (d < .7) { if (e.state === 'retreat') { e.state = 'gone'; a.hidden = true; continue; } e.state = 'cover'; e.t = 2 + R() * 3.5; e.fireT = .6 + R() * 1.6; }
        else { a.x += dx / d * sp * dt; a.z += dz / d * sp * dt; a.yaw = Math.atan2(dx, dz); a.anim = 'run'; a.animScale = sp; } continue; }
      // siperde: çök, nişan al, ateş et
      e.kneel = true; e.aimT -= dt; e.fireT -= dt; e.t -= dt; a.anim = e.aimT > 0 ? 'kneelaim' : 'kneel'; a.animScale = 1;
      if (e.fireT <= 0) { e.fireT = 2.2 + R() * 2; e.aimT = 1.1; const ups = this.allies.filter(al => !al.down); const atPlayer = this.hp > 0 && (!ups.length || R() < (cfg.targetBias ?? .6)); const ty = a.y + 1.15;
        if (atPlayer) { const d = Math.hypot(P.x - a.x, P.z - a.z); if (d < 150 && this.los(a.x, ty, a.z, P.x, P.y + eye, P.z)) { a.yaw = Math.atan2(P.x - a.x, P.z - a.z); let p = clamp(.75 - d / 90, .08, .55) * this.coverFactor(P, a, this.player.crouch > .5); if (Math.hypot(this.player.vel.x, this.player.vel.y) > 4) p *= .7;
            const hit = R() < p, mx = hit ? 0 : (R() - .5) * 2.4, my = hit ? -.25 : (R() - .2) * 1.6; this.tracer(a.x, ty, a.z, P.x + mx, P.y + eye + my, P.z + mx); this.sfx.shot(clamp(1.1 - d / 120, .15, .8)); if (hit) this.damage(34); } }
        else if (ups.length) { const al = ups[Math.floor(R() * ups.length)], b = al.a; a.yaw = Math.atan2(b.x - a.x, b.z - a.z); this.tracer(a.x, ty, a.z, b.x + (R() - .5), b.y + 1.1 + (R() - .3), b.z + (R() - .5)); this.sfx.shot(clamp(1 - Math.hypot(P.x - a.x, P.z - a.z) / 130, .12, .6));
          if (!al.safe && R() < .07) { al.hp--; if (al.hp <= 0) { al.down = true; b.anim = 'down'; if (cfg.onAllyDown) cfg.onAllyDown(b); } } } }
      if (e.t <= 0 && e.ci < e.lane.length - 1) { e.ci++; e.goal = e.lane[e.ci]; e.state = 'advance'; } }
    // müttefikler
    for (const al of this.allies) { if (al.down) continue; const b = al.a; al.fireT -= dt; b.anim = 'kneelaim'; let tg = null, bd = 115; for (const e of this.enemies) { if (e.state === 'down' || e.state === 'gone') continue; const d = Math.hypot(e.a.x - b.x, e.a.z - b.z); if (d < bd) { bd = d; tg = e; } }
      if (tg) b.yaw = Math.atan2(tg.a.x - b.x, tg.a.z - b.z);
      if (al.fireT <= 0) { al.fireT = 3 + R() * 3.5; if (tg && this.los(b.x, b.y + 1.1, b.z, tg.a.x, tg.a.y + 1, tg.a.z)) { this.tracer(b.x, b.y + 1.15, b.z, tg.a.x + (R() - .5), tg.a.y + 1 + (R() - .5) * .8, tg.a.z + (R() - .5)); this.sfx.shot(clamp(.9 - Math.hypot(P.x - b.x, P.z - b.z) / 60, .25, .7)); if (R() < clamp(.09 - bd / 1500, .02, .07)) this.down(tg); } } }
  }
}
