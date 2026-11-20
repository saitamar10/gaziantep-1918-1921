// Dinamik gün ışığı: güneş konumu (enlem 37.07°K, tarih, saat), fiziksel gökyüzü, CSM gölgeler, IBL ortam ışığı, sis.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSM } from 'three/addons/csm/CSM.js';
import { CONFIG } from '../config.js';

export function sunDirection(dateObj, hour, latDeg = CONFIG.origin.lat) {
  const start = Date.UTC(dateObj.y, 0, 0), now = Date.UTC(dateObj.y, dateObj.m - 1, dateObj.d); const N = (now - start) / 864e5;
  const decl = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + N) / 365); const lat = latDeg * Math.PI / 180; const H = (hour - 12) * 15 * Math.PI / 180;
  const el = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI; // kuzeyden saat yönü
  return { el, az, dir: new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize() };
}

export class Lighting {
  constructor(renderer, scene, camera) { this.r = renderer; this.scene = scene; this.camera = camera; this.time = CONFIG.time; this.date = { ...CONFIG.date };
    this.sky = new Sky(); this.sky.scale.setScalar(9000); scene.add(this.sky); const u = this.sky.material.uniforms; u.turbidity.value = 3.0; u.rayleigh.value = 1.05; u.mieCoefficient.value = .0035; u.mieDirectionalG.value = .86;
    const gain = (sky, g) => { sky.material.uniforms.skyGain = { value: g }; sky.material.fragmentShader = sky.material.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );', 'gl_FragColor = vec4( retColor * skyGain, 1.0 );').replace('void main() {', 'uniform float skyGain;\nvoid main() {'); sky.material.needsUpdate = true; };
    gain(this.sky, .62); this._gain = gain;
    this.hemi = new THREE.HemisphereLight('#bcd2ea', '#a08460', .5); scene.add(this.hemi);
    this.pmrem = new THREE.PMREMGenerator(renderer); this.skyScene = new THREE.Scene(); this.skyClone = new Sky(); this.skyClone.scale.setScalar(9000); this.skyScene.add(this.skyClone); this._gain(this.skyClone, .9);
    scene.fog = new THREE.FogExp2('#cfc3a8', .00065);
  }
  initShadows() {
    this.csm = new CSM({ maxFar: 750, cascades: 4, mode: 'practical', parent: this.scene, shadowMapSize: 2048, lightDirection: new THREE.Vector3(-1, -1, -1).normalize(), camera: this.camera, lightIntensity: 3.2, lightNear: 1, lightFar: 3000, lightMargin: 400, shadowBias: -.00025 });
    this.csm.fade = true; this.csm.lights.forEach(l => { l.shadow.normalBias = .035; });
  }
  setupMaterial(m) { if (this.csm) { this.csm.setupMaterial(m); m.needsUpdate = true; } }
  set(hour) { this.time = hour; const s = sunDirection(this.date, hour); this.sun = s;
    const u = this.sky.material.uniforms; u.sunPosition.value.copy(s.dir); this.skyClone.material.uniforms.sunPosition.value.copy(s.dir); for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) this.skyClone.material.uniforms[k].value = u[k].value;
    const el = Math.max(0, s.el); const warm = 1 - Math.min(1, el / .55); // alçak güneş = sıcak renk
    const col = new THREE.Color().setHSL(.1 - warm * .03, .3 + warm * .45, .8 + (1 - warm) * .12);
    const inten = s.el < 0 ? .05 : 1.2 + 2.6 * Math.min(1, el / .35);
    if (this.csm) { this.csm.lightDirection.copy(s.dir).negate(); this.csm.lights.forEach(l => { l.color.copy(col); l.intensity = inten; }); }
    this.hemi.intensity = .25 + .5 * Math.min(1, el / .4); this.hemi.color.setHSL(.58, .35, .74 - warm * .12); this.hemi.groundColor.setHSL(.09, .3, .42); // taş yüzeylerden sıcak sekme ışığı (yaklaşık GI)
    this.scene.fog.color.setHSL(.58 - warm * .45, .12 + warm * .1, .74 - warm * .1 - (s.el < .05 ? .25 : 0)); this.scene.fog.density = .00042 + warm * .0003;
    this.r.toneMappingExposure = s.el < .05 ? .45 : .5 + .12 * Math.min(1, el / .5);
    // IBL: gökyüzünden ortam haritası
    if (this.envRT) this.envRT.dispose(); this.envRT = this.pmrem.fromScene(this.skyScene, 0, .1, 10000); this.scene.environment = this.envRT.texture; this.scene.environmentIntensity = .55;
  }
  /** shadowEvery = n: gölge haritaları her n karede bir güncellenir (n > 1 iken ışık konumu da aynı karelerde ilerler; gölge titremez) */
  update() { if (!this.csm) return; const n = this.shadowEvery || 1; this.fc = (this.fc || 0) + 1; const upd = n <= 1 || this.fc % n === 0;
    for (const l of this.csm.lights) { l.shadow.autoUpdate = n <= 1; if (n > 1 && upd) l.shadow.needsUpdate = true; } if (upd) this.csm.update(); }
  resize() { if (this.csm) this.csm.updateFrustums(); }
}
