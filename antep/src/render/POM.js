// Parallax Occlusion Mapping — MeshStandardMaterial'e yama.
// Yükseklik: ORM dokusunun B kanalı. Teğet uzayı türevlerden hesaplanır (tangent attribute gerekmez).
// Tüm harita örneklemeleri (albedo, normal, roughness, AO) kaydırılmış UV ile yapılır -> taş derzlerinde gerçek derinlik hissi.
import * as THREE from 'three';

export function addPatch(mat, fn) { (mat.userData.patches = mat.userData.patches || []).push(fn); mat.onBeforeCompile = (s) => mat.userData.patches.forEach(f => f(s)); mat.customProgramCacheKey = () => mat.uuid; }

/** scale: UV birimi cinsinden derinlik (vec2: u ve v ekseni için ayrı, anizotropik eşleme için) */
export function enablePOM(mat, heightTex, scale = [.02, .02], steps = 18) {
  mat.userData.pom = { value: new THREE.Vector2(...scale) };
  addPatch(mat, (s) => {
    s.uniforms.pomMap = { value: heightTex }; s.uniforms.pomScale = mat.userData.pom;
    const C = THREE.ShaderChunk;
    const pom = `
  vec2 pomUv = vMapUv;
  {
    vec3 q0 = dFdx( -vViewPosition ), q1 = dFdy( -vViewPosition ); vec2 st0 = dFdx( vMapUv ), st1 = dFdy( vMapUv );
    vec3 Ng = normalize( vNormal ); vec3 q1p = cross( q1, Ng ), q0p = cross( Ng, q0 );
    vec3 T = q1p * st0.x + q0p * st1.x; vec3 B = q1p * st0.y + q0p * st1.y; float det = max( dot( T, T ), dot( B, B ) ); float sc = det == 0.0 ? 0.0 : inversesqrt( det ); T *= sc; B *= sc;
    vec3 V = normalize( vViewPosition ); vec3 Vt = vec3( dot( V, T ), dot( V, B ), dot( V, Ng ) );
    float dist = length( vViewPosition ); float fade = 1.0 - smoothstep( 14.0, 28.0, dist );
    if ( pomScale.x > 0.0 && fade > 0.0 && Vt.z > 0.05 ) {
      float n = mix( ${steps.toFixed(1)}, 6.0, Vt.z ); float layer = 1.0 / n; vec2 dUv = Vt.xy / Vt.z * pomScale * fade * layer;
      float cur = 0.0; vec2 uv = vMapUv; float h = 1.0 - texture2D( pomMap, uv ).b; float prevH = h; vec2 prevUv = uv;
      for ( int i = 0; i < ${steps}; i ++ ) { if ( cur >= h ) break; prevUv = uv; prevH = h; uv -= dUv; h = 1.0 - texture2D( pomMap, uv ).b; cur += layer; }
      float after = h - cur, before = prevH - ( cur - layer ); float w = after / ( after - before + 1e-5 ); pomUv = mix( uv, prevUv, w );
    }
  }`;
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D pomMap; uniform vec2 pomScale;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + pom)
      .replace('#include <map_fragment>', C.map_fragment.replace(/vMapUv/g, 'pomUv'))
      .replace('#include <roughnessmap_fragment>', C.roughnessmap_fragment.replace(/vRoughnessMapUv/g, 'pomUv'))
      .replace('#include <normal_fragment_maps>', C.normal_fragment_maps.replace(/vNormalMapUv/g, 'pomUv'))
      .replace('#include <aomap_fragment>', C.aomap_fragment.replace(/vAoMapUv/g, 'pomUv'));
  });
  return mat;
}

/** TexGen çıktısından PBR malzeme (+ isteğe bağlı POM) */
export function pbr(set, { pom = null, color = '#ffffff', normalScale = 1, envI = .55, side = THREE.FrontSide, vertexColors = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ map: set.map, normalMap: set.normalMap, roughnessMap: set.orm, aoMap: set.orm, aoMapIntensity: 1, roughness: 1, metalness: 0, color, side, vertexColors, envMapIntensity: envI });
  m.normalScale.set(normalScale, normalScale); if (pom) enablePOM(m, set.orm, pom); return m;
}
