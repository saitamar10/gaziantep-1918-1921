// Son işlem: MSAA + GTAO (ortam kapanması) + ton eşleme çıktısı. Kalite: 'high' | 'medium' | 'low'
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Ekran uzayı hacimsel ışık (god rays) + atmosferik ileri saçılma: gökyüzü maskesinden güneşe doğru radyal örnekleme
const GodRaysShader = { uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, sunPos: { value: new THREE.Vector2(.5, .5) }, sunVis: { value: 0 }, intensity: { value: .32 }, decay: { value: .955 }, density: { value: .9 }, weight: { value: .045 }, tint: { value: new THREE.Color('#fff2dc') } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform vec2 sunPos; uniform float sunVis, intensity, decay, density, weight; uniform vec3 tint; varying vec2 vUv;
  void main(){ vec4 base = texture2D(tDiffuse, vUv); if (sunVis <= 0.0) { gl_FragColor = base; return; }
    vec2 d = (vUv - sunPos) * density / 56.0; vec2 c = vUv; float il = 1.0; vec3 acc = vec3(0.0);
    for (int i = 0; i < 56; i++) { c -= d; if (c.x < 0.0 || c.y < 0.0 || c.x > 1.0 || c.y > 1.0) break; float sky = step(0.99995, texture2D(tDepth, c).x); vec3 s = min(texture2D(tDiffuse, c).rgb, vec3(4.0)) * sky; acc += s * il * weight; il *= decay; }
    float r = length((vUv - sunPos) * vec2(1.7, 1.0)); float halo = exp(-r * 3.0) * .08;
    gl_FragColor = vec4(base.rgb + (acc * intensity + halo) * tint * sunVis, base.a); }` };

// Sıcak, hafif sepya renk derecelendirmesi + hafif vinyet (ucuz: tek doku okuma)
const GradeShader = { uniforms: { tDiffuse: { value: null }, warmth: { value: .09 }, sepia: { value: .12 }, vignette: { value: .34 }, contrast: { value: 1.06 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float warmth, sepia, vignette, contrast; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(.2126, .7152, .0722));
    col = mix(col, l * vec3(1.12, 1.0, .82), sepia); col *= vec3(1.0 + warmth, 1.0 + warmth * .35, 1.0 - warmth);
    col = max(vec3(0.0), (col - .18) * contrast + .18);
    vec2 q = vUv - .5; float v = smoothstep(.85, .25, length(q * vec2(1.0, 1.15))); col *= mix(1.0 - vignette, 1.0, v);
    gl_FragColor = vec4(col, c.a); }` };

export class PostFX {
  constructor(renderer, scene, camera) { this.r = renderer; this.scene = scene; this.camera = camera; const s = renderer.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(s.x * renderer.getPixelRatio(), s.y * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, rt); this.composer.addPass(new RenderPass(scene, camera));
    this.gtao = new GTAOPass(scene, camera, s.x, s.y); this.gtao.output = GTAOPass.OUTPUT.Default; this.gtao.blendIntensity = .75;
    try { this.gtao.updateGtaoMaterial({ radius: .9, distanceExponent: 1.8, thickness: 1.5, scale: 1.15, samples: 16, distanceFallOff: 1, screenSpaceRadius: false }); this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 }); } catch (e) { }
    this.composer.addPass(this.gtao); this.rays = new ShaderPass(GodRaysShader); this.rays.uniforms.tDepth.value = this.gtao.depthTexture; this.composer.addPass(this.rays); this.grade = new ShaderPass(GradeShader); this.composer.addPass(this.grade); this.composer.addPass(new OutputPass()); this.setQuality('high'); }
  updateSun(dir, cam) { const p = cam.position.clone().add(dir.clone().multiplyScalar(2000)).project(cam); const vis = (p.z < 1 && dir.y > 0) ? Math.max(0, 1 - Math.max(Math.abs(p.x), Math.abs(p.y)) / 1.6) : 0; this.rays.uniforms.sunPos.value.set(p.x * .5 + .5, p.y * .5 + .5); this.rays.uniforms.sunVis.value = vis * Math.min(1, dir.y * 4); }
  setQuality(q) { this.quality = q; this.gtao.enabled = q === 'high'; if (this.rays) this.rays.enabled = q === 'high'; this.r.setPixelRatio(Math.min(devicePixelRatio, q === 'low' ? 1 : q === 'medium' ? 1.25 : 1.5)); }
  setSize(w, h) { this.composer.setSize(w, h); this.gtao.setSize(w, h); }
  render() { this.composer.render(); }
}
