// Harita ekranı için dünyanın tepeden ortografik "uydu" görüntüsü (gerçek 3B sahneden, gölgeli).
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function renderAerial(renderer, scene, sunDir, { width = 4096, tiles = 2 } = {}) {
  const { minX, maxX, minZ, maxZ } = CONFIG.bounds; const Wm = maxX - minX, Hm = maxZ - minZ; const height = Math.round(width * Hm / Wm);
  const out = document.createElement('canvas'); out.width = width; out.height = height; const og = out.getContext('2d');
  const tw = width / tiles, th = height / tiles; const prevSize = renderer.getSize(new THREE.Vector2()), prevPR = renderer.getPixelRatio();
  const fog = scene.fog; scene.fog = null; const hidden = []; scene.traverse(o => { if (o.userData.noAerial && o.visible) { o.visible = false; hidden.push(o); } });
  const light = new THREE.DirectionalLight('#fff0dc', 3.4); light.castShadow = true; light.shadow.mapSize.set(4096, 4096); light.shadow.bias = -.0004; light.shadow.normalBias = .05; scene.add(light); scene.add(light.target);
  renderer.setPixelRatio(1); renderer.setSize(tw, th, false); renderer.shadowMap.needsUpdate = true;
  for (let j = 0; j < tiles; j++) for (let i = 0; i < tiles; i++) {
    const x0 = minX + Wm * i / tiles, x1 = minX + Wm * (i + 1) / tiles, z0 = minZ + Hm * j / tiles, z1 = minZ + Hm * (j + 1) / tiles; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hw = (x1 - x0) / 2, hh = (z1 - z0) / 2;
    const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 10, 3000); cam.position.set(cx, 1200, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz); cam.updateProjectionMatrix();
    light.position.set(cx + sunDir.x * 1500, sunDir.y * 1500, cz + sunDir.z * 1500); light.target.position.set(cx, 0, cz);
    const r = Math.max(hw, hh) * 1.25; Object.assign(light.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 10, far: 4000 }); light.shadow.camera.updateProjectionMatrix();
    renderer.render(scene, cam); og.drawImage(renderer.domElement, 0, 0, tw, th, i * tw, j * th, tw, th);
  }
  scene.remove(light); scene.remove(light.target); light.dispose(); scene.fog = fog; hidden.forEach(o => o.visible = true);
  renderer.setPixelRatio(prevPR); renderer.setSize(prevSize.x, prevSize.y, false);
  // hafif sepya/parşömen tonlama
  og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgba(255,236,200,.35)'; og.fillRect(0, 0, width, height); og.globalCompositeOperation = 'source-over';
  return out;
}
