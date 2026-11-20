// Harici 3D model hattı (glTF 2.0 / .glb).
// assets/manifest.json örneği:
// { "models": [ { "id": "ev_avlulu_01", "url": "assets/models/ev_avlulu_01.glb", "x": 120, "z": 310, "rotY": 1.57, "scale": 1, "snapGround": true } ] }
// Kurallar: 1 birim = 1 m, Y yukarı, pivot = sokak cephesi ortası zemin; LOD adları *_LOD0/_LOD1/_LOD2; çarpışma: UCX_* nesneleri.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetManager {
  constructor(world, onMaterial) { this.world = world; this.onMaterial = onMaterial; this.loader = new GLTFLoader(); this.group = new THREE.Group(); this.group.name = 'ExternalAssets'; this.loaded = []; }
  async loadManifest(url = './assets/manifest.json') { let man; try { const r = await fetch(url); if (!r.ok) return 0; man = await r.json(); } catch (e) { return 0; }
    for (const e of man.models || []) { try { await this.place(e); } catch (err) { console.warn('Model yüklenemedi', e.url, err); } } return this.loaded.length; }
  async place(e) { const gltf = await this.loader.loadAsync(e.url); const root = gltf.scene; const lods = {}; const cols = [];
    root.traverse(o => { if (!o.isMesh) return; if (/^UCX_/i.test(o.name)) { cols.push(o); return; } const m = o.name.match(/_LOD(\d)$/i); if (m) (lods[o.parent.uuid + o.name.replace(/_LOD\d$/i, '')] ||= []).push([+m[1], o]);
      o.castShadow = o.receiveShadow = true; (Array.isArray(o.material) ? o.material : [o.material]).forEach(mt => { mt.envMapIntensity = .6; this.onMaterial && this.onMaterial(mt); }); });
    // LOD grupları
    for (const k in lods) { const arr = lods[k].sort((a, b) => a[0] - b[0]); const lod = new THREE.LOD(); const parent = arr[0][1].parent; arr.forEach(([lvl, mesh], i) => { parent.remove(mesh); lod.addLevel(mesh, [0, 60, 180, 400][lvl] ?? 400 * lvl); }); parent.add(lod); }
    const y = e.snapGround !== false ? this.world.groundAt(e.x, e.z) : (e.y || 0); root.position.set(e.x, y, e.z); root.rotation.y = e.rotY || 0; root.scale.setScalar(e.scale || 1); root.updateMatrixWorld(true);
    // çarpışma: UCX kutularının dünya izdüşümü (yoksa tüm modelin sınır kutusu)
    const addBox = (obj) => { const b = new THREE.Box3().setFromObject(obj); const pts = [[b.min.x, b.min.z], [b.max.x, b.min.z], [b.max.x, b.max.z], [b.min.x, b.max.z]]; this.world.collision.addPoly(pts); };
    if (cols.length) cols.forEach(c => { addBox(c); c.visible = false; }); else if (e.collision !== false) addBox(root);
    this.group.add(root); this.loaded.push({ id: e.id, root }); return root; }
}
