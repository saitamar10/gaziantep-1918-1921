// Birinci şahıs denetleyici: işaretçi kilidi, WASD, koşma, çömelme, göz hizası 1.65–1.75 m, çarpışma,
// eğim sınırı, adım sesi olayı ve ileride el/silah eklemek için 'viewmodel' bağlama noktası.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class FirstPersonController {
  constructor(camera, dom, world) { this.cam = camera; this.dom = dom; this.world = world; this.cfg = { ...CONFIG.player };
    this.pos = new THREE.Vector3(); this.yaw = 0; this.pitch = 0; this.keys = {}; this.enabled = false; this.bob = 0; this.vel = new THREE.Vector2(); this.noclip = false; this.sens = .0021; this.crouch = 0;
    this.viewmodel = new THREE.Group(); this.viewmodel.name = 'Viewmodel'; camera.add(this.viewmodel); // eller / eşyalar buraya bağlanacak
    this.onStep = null;
    addEventListener('keydown', e => { this.keys[e.code] = true; if (e.code === 'KeyN' && this.enabled) this.noclip = !this.noclip; });
    addEventListener('keyup', e => this.keys[e.code] = false);
    addEventListener('mousemove', e => { if (document.pointerLockElement !== this.dom) return; this.yaw -= e.movementX * this.sens; this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - e.movementY * this.sens)); });
    // dokunmatik: sol yarı hareket, sağ yarı bakış
    this.touch = { move: null, look: null, mx: 0, mz: 0 };
    dom.addEventListener('touchstart', e => { for (const t of e.changedTouches) { if (t.clientX < innerWidth / 2 && !this.touch.move) this.touch.move = { id: t.identifier, x: t.clientX, y: t.clientY }; else if (!this.touch.look) this.touch.look = { id: t.identifier, x: t.clientX, y: t.clientY }; } }, { passive: true });
    dom.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (this.touch.move && t.identifier === this.touch.move.id) { this.touch.mx = Math.max(-1, Math.min(1, (t.clientX - this.touch.move.x) / 60)); this.touch.mz = Math.max(-1, Math.min(1, (t.clientY - this.touch.move.y) / 60)); }
      if (this.touch.look && t.identifier === this.touch.look.id) { this.yaw -= (t.clientX - this.touch.look.x) * .005; this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - (t.clientY - this.touch.look.y) * .005)); this.touch.look.x = t.clientX; this.touch.look.y = t.clientY; } } }, { passive: true });
    dom.addEventListener('touchend', e => { for (const t of e.changedTouches) { if (this.touch.move && t.identifier === this.touch.move.id) { this.touch.move = null; this.touch.mx = this.touch.mz = 0; } if (this.touch.look && t.identifier === this.touch.look.id) this.touch.look = null; } });
  }
  lock() { try { const p = this.dom.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
  place(x, z, yaw = 0) { const C = this.world.collision; if (C.blocked(x, z, this.cfg.radius)) { outer: for (let r = 1; r < 60; r += 1) for (let a = 0; a < 16; a++) { const nx = x + Math.cos(a / 16 * Math.PI * 2) * r, nz = z + Math.sin(a / 16 * Math.PI * 2) * r; if (!C.blocked(nx, nz, this.cfg.radius + .3)) { x = nx; z = nz; break outer; } } }
    this.pos.set(x, this.world.groundAt(x, z), z); this.yaw = yaw; this.pitch = 0; }
  update(dt) {
    if (!this.enabled) { this.apply(0, dt); return; }
    const k = this.keys; let ix = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), iz = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    ix += this.touch.mx; iz += this.touch.mz; const mag = Math.min(1, Math.hypot(ix, iz));
    this.crouch += ((k.ControlLeft || k.KeyC ? 1 : 0) - this.crouch) * Math.min(1, dt * 10);
    const run = (k.ShiftLeft || k.ShiftRight) && this.crouch < .3; let sp = (this.noclip ? (run ? 40 : 14) : run ? this.cfg.run : this.cfg.walk) * (1 - this.crouch * .5);
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let vx = 0, vz = 0; if (mag > .05) { const l = Math.hypot(ix, iz); vx = (fx * -iz + rx * ix) / l * mag; vz = (fz * -iz + rz * ix) / l * mag; }
    // yumuşak ivme
    this.vel.x += (vx * sp - this.vel.x) * Math.min(1, dt * 9); this.vel.y += (vz * sp - this.vel.y) * Math.min(1, dt * 9);
    if (this.noclip) { const up = (k.KeyE || k.Space ? 1 : 0) - (k.KeyQ ? 1 : 0); this.pos.x += this.vel.x * dt; this.pos.z += this.vel.y * dt; this.pos.y += up * sp * dt; this.pos.y += -Math.sin(this.pitch) * 0; this.apply(0, dt, true); return; }
    let nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.y * dt;
    [nx, nz] = this.world.collision.resolve(nx, nz, this.cfg.radius);
    const h0 = this.pos.y, h1 = this.world.groundAt(nx, nz); const dist = Math.hypot(nx - this.pos.x, nz - this.pos.z);
    if (dist > 1e-4 && (h1 - h0) / dist > .9 && h1 - h0 > .05) { /* çok dik: geçme */ }
    else { this.pos.x = nx; this.pos.z = nz; this.pos.y += (h1 - this.pos.y) * Math.min(1, dt * 14); }
    const speed = Math.hypot(this.vel.x, this.vel.y); this.apply(speed, dt);
  }
  apply(speed, dt, fly = false) { const eye = fly ? 0 : this.cfg.eyeHeight - this.crouch * .55; const prev = Math.sin(this.bob); this.bob += speed * dt * 2.1; const s = Math.sin(this.bob);
    if (speed > .3 && prev > -.98 && s <= -.98 && this.onStep) this.onStep(speed);
    const amp = Math.min(1, speed / 4) * .035; this.cam.position.set(this.pos.x, this.pos.y + eye + (fly ? 0 : s * amp), this.pos.z); this.cam.rotation.order = 'YXZ'; this.cam.rotation.set(this.pitch, this.yaw, Math.cos(this.bob * .5) * amp * .15); }
}
