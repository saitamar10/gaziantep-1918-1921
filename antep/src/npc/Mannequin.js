// YER TUTUCU karakter: koddan üretilen rigli manken (tek SkinnedMesh, tek çizim çağrısı) + prosedürel animasyon klipleri.
// Amaç nihai görsel DEĞİL: NPC sistemini (AnimationMixer, LOD, gezinme) gerçek GLB modelleri gelmeden çalıştırıp sınamak.
// Gerçek modeller assets/characters/manifest.json ile bunun yerine geçer (bkz. NpcManager).
// Kurallar GLB şartnamesiyle aynı: 1 birim = 1 m, Y yukarı, pivot ayak tabanı, +Z'ye bakar.
import * as THREE from 'three';

/* ---------------- iskelet ---------------- */
// [ad, ebeveyn, yerel konum]
const BONES = [
  ['hips', null, [0, .95, 0]], ['spine', 'hips', [0, .12, 0]], ['chest', 'spine', [0, .20, 0]], ['neck', 'chest', [0, .22, 0]], ['head', 'neck', [0, .08, 0]],
  ['armL', 'chest', [.19, .17, 0]], ['foreL', 'armL', [0, -.28, 0]], ['handL', 'foreL', [0, -.26, 0]],
  ['armR', 'chest', [-.19, .17, 0]], ['foreR', 'armR', [0, -.28, 0]], ['handR', 'foreR', [0, -.26, 0]],
  ['legL', 'hips', [.09, -.03, 0]], ['shinL', 'legL', [0, -.44, 0]], ['footL', 'shinL', [0, -.42, 0]],
  ['legR', 'hips', [-.09, -.03, 0]], ['shinR', 'legR', [0, -.44, 0]], ['footR', 'shinR', [0, -.42, 0]]
];
const IDX = Object.fromEntries(BONES.map((b, i) => [b[0], i]));
export const HIP_Y = .95, LEG_LEN = .86;

function makeBones() {
  const bones = BONES.map(([name, , p]) => { const b = new THREE.Bone(); b.name = name; b.position.set(...p); return b; });
  BONES.forEach(([, parent], i) => { if (parent) bones[IDX[parent]].add(bones[i]); });
  return bones;
}
// bağlama (bind) pozunda kemiklerin dünya konumu ve ters matrisleri — tüm örnekler paylaşır
const BIND = (() => { const bones = makeBones(); bones[0].updateMatrixWorld(true); const pos = bones.map(b => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld)); const inv = bones.map(b => b.matrixWorld.clone().invert()); return { pos, inv }; })();

/* ---------------- geometri ---------------- */
class Parts {
  constructor() { this.p = []; this.n = []; this.c = []; this.si = []; }
  /** geo: kemik-yerel uzayda; bone: bağlanacağı kemik */
  add(bone, geo, color, { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1], stripes = null } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo; const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos).add(BIND.pos[IDX[bone]]), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
    g.applyMatrix4(m); g.computeVertexNormals(); const P = g.attributes.position.array, N = g.attributes.normal.array; const col = new THREE.Color(color), col2 = stripes ? new THREE.Color(stripes) : null;
    for (let i = 0; i < P.length; i += 3) { this.p.push(P[i], P[i + 1], P[i + 2]); this.n.push(N[i], N[i + 1], N[i + 2]);
      const k = col2 && (Math.floor(Math.atan2(P[i], P[i + 2]) * 9) & 1) ? col2 : col; this.c.push(k.r, k.g, k.b); this.si.push(IDX[bone], 0, 0, 0); }
    g.dispose(); return this;
  }
  geometry(skinned = true) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (skinned) { g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4)); const w = new Float32Array(this.si.length); for (let i = 0; i < w.length; i += 4) w[i] = 1; g.setAttribute('skinWeight', new THREE.BufferAttribute(w, 4)); }
    g.computeBoundingSphere(); return g; }
}
const cap = (r, len, seg = 8) => new THREE.CapsuleGeometry(r, len, 3, seg);
const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const cyl = (rt, rb, h, seg = 10, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);

/** Arketip kıyafetine göre manken geometrisi */
export function buildGeometry(o, build = 1, skinned = true) {
  const P = new Parts(); const B = build, skin = o.skin, top = o.topC, bot = o.botC, shirt = o.shirtC || top;
  const long = ['entari', 'aba', 'greatcoat'].includes(o.top) || o.bottom === 'skirt';   // bilek/diz hizasına inen giysi
  const salvar = o.bottom === 'salvar';
  // baş, boyun, yüz yönü
  P.add('head', sph(.1), skin, { pos: [0, .11, .005], scale: [.95, 1.15, 1.05] }); P.add('head', box(.03, .04, .04), skin, { pos: [0, .09, .105] }); P.add('neck', cyl(.05, .055, .12, 8), skin, { pos: [0, .03, 0] });
  if (o.moustache) P.add('head', box(.075, .016, .02), o.moustache, { pos: [0, .058, .1] });
  if (o.beard) P.add('head', sph(.075, 8, 6), o.beard, { pos: [0, .02, .06], scale: [1, 1.25, .8] });
  if (o.hair) P.add('head', sph(.103, 10, 8), o.hair, { pos: [0, .12, -.02], scale: [.97, 1.1, 1] });
  // gövde
  const open = ['cepken', 'suit', 'vest', 'aba'].includes(o.top);   // önü açık: altından gömlek görünür
  P.add('chest', sph(.17, 12, 8), open ? shirt : top, { pos: [0, .07, 0], scale: [1.08 * B, 1.0, .72 * B], stripes: open ? null : o.stripes });
  P.add('spine', sph(.15, 12, 8), open ? shirt : top, { pos: [0, .08, 0], scale: [1.02 * B, 1.05, .74 * B], stripes: open ? null : o.stripes });
  P.add('hips', sph(.16, 12, 8), long && !salvar ? (o.bottom === 'skirt' ? bot : top) : bot, { pos: [0, .01, 0], scale: [(salvar ? 1.2 : 1.05) * B, .8, (salvar ? .95 : .78) * B] });
  if (open || o.top === 'jacket') { // ceket: sırt ve yanlar kapalı, ön ortası açık (iki yarım silindir)
    for (const sd of [1, -1]) P.add('chest', new THREE.CylinderGeometry(.19, .185, .3, 8, 1, true, sd > 0 ? .25 : Math.PI, Math.PI - .25), top, { pos: [0, 0, 0], scale: [B, 1, .78 * B], stripes: o.stripes }); }
  if (o.strap) P.add('chest', box(.035, .5, .03), o.strap, { pos: [0, .0, .128 * B], rot: [0, 0, -.7] });
  if (o.pouches) for (const sx of [-.09, .09]) P.add('spine', box(.08, .07, .05), o.pouches, { pos: [sx, .0, .135 * B] });
  if (o.sash) P.add('spine', cyl(.165, .17, .1, 12), o.sashC, { pos: [0, .0, 0], scale: [1.02 * B, 1, .8 * B] });
  if (o.beltC) P.add('spine', cyl(.17, .17, .045, 12), o.beltC, { pos: [0, .01, 0], scale: [1.02 * B, 1, .8 * B] });
  if (o.bandolier) { P.add('chest', box(.05, .52, .03), o.bandolier, { pos: [0, .0, .125 * B], rot: [0, 0, .75] }); P.add('chest', box(.05, .52, .03), o.bandolier, { pos: [0, .0, .125 * B], rot: [0, 0, -.75] }); }
  // etek / entari / kaput: kalçaya bağlı kesik koni
  if (long) { const coat = o.top === 'greatcoat' || o.top === 'aba'; const len = o.top === 'greatcoat' ? .52 : o.top === 'aba' ? .6 : .8; const c = o.bottom === 'skirt' ? bot : top;
    if (coat) for (const sd of [1, -1]) P.add('hips', new THREE.CylinderGeometry(.18, .27, len, 8, 1, true, sd > 0 ? (o.top === 'aba' ? .3 : .02) : Math.PI, Math.PI - (o.top === 'aba' ? .3 : .02)), top, { pos: [0, -len / 2 + .05, 0], scale: [B, 1, .86 * B] });
    else P.add('hips', cyl(.17, .3, len, 14, true), c, { pos: [0, -len / 2 + .04, 0], scale: [B, 1, .86 * B], stripes: o.bottom === 'skirt' ? o.skirtStripes : o.stripes });
    if (o.apron) P.add('hips', box(.27, .56, .02), o.apronC, { pos: [0, -.27, .215 * B], rot: [-.15, 0, 0] }); }
  // kollar
  for (const s of ['L', 'R']) { const armC = o.armC || top;
    P.add('arm' + s, cap(.05 * B, .2), armC, { pos: [0, -.14, 0], stripes: o.armC ? null : o.stripes }); P.add('fore' + s, cap(.042 * B, .19), armC, { pos: [0, -.13, 0] }); P.add('hand' + s, sph(.043, 8, 6), skin, { pos: [0, -.04, 0], scale: [.8, 1.2, 1] }); }
  // bacaklar ve ayaklar
  for (const s of ['L', 'R']) { const breeches = o.bottom === 'breeches', shorts = o.bottom === 'shorts';
    P.add('leg' + s, cap((salvar ? .105 : breeches ? .09 : .075) * B, .3), bot, { pos: [0, -.22, 0] });
    if (salvar && !o.shinC) P.add('shin' + s, cap(.07 * B, .3), bot, { pos: [0, -.19, 0] });
    else { if (salvar) P.add('shin' + s, cap(.085 * B, .1), bot, { pos: [0, -.07, 0] });   // şalvar dizin altında büzülür, altı dolak
      P.add('shin' + s, cap(.05 * B, .32), o.tall ? '#1c1816' : o.shinC || (shorts ? skin : bot), { pos: [0, -.2, 0] }); }
    P.add('foot' + s, box(.09, .07, .25), o.barefoot ? skin : o.boots ? (o.tall ? '#1c1816' : '#3a2a1e') : '#4a3626', { pos: [0, -.025, .07] }); }
  // başlıklar
  const hc = o.headC;
  if (o.head === 'fes') P.add('head', cyl(.078, .09, .12, 12), hc, { pos: [0, .25, 0] });
  if (o.head === 'sarik') P.add('head', sph(.115, 12, 6), hc, { pos: [0, .2, 0], scale: [1.05, .55, 1.1] });
  if (o.head === 'sarikfes') { P.add('head', cyl(.075, .088, .12, 12), '#7d2420', { pos: [0, .26, 0] }); P.add('head', new THREE.TorusGeometry(.1, .04, 6, 14), hc, { pos: [0, .21, 0], rot: [Math.PI / 2, 0, 0] }); }
  if (o.head === 'takke') P.add('head', sph(.1, 10, 5), hc, { pos: [0, .16, 0], scale: [.98, .7, 1.05] });
  if (o.head === 'kalpak') P.add('head', cyl(.112, .108, .17, 12), hc, { pos: [0, .25, 0] });
  if (o.head === 'hair') P.add('head', sph(.104, 10, 8), hc, { pos: [0, .135, -.015], scale: [.98, 1.0, 1.02] });
  if (o.head === 'band') { P.add('head', sph(.104, 10, 8), o.hair || hc, { pos: [0, .135, -.015] }); P.add('head', cyl(.104, .104, .05, 12, true), hc, { pos: [0, .17, 0], scale: [1, 1, 1.08] }); }
  if (o.head === 'scarf') { P.add('head', sph(.112, 12, 8), hc, { pos: [0, .125, -.012], scale: [1, 1.15, 1.08] }); P.add('neck', cyl(.1, .15, .2, 10), hc, { pos: [0, -.02, -.03], scale: [1, 1, .8] }); P.add('head', sph(.098, 10, 8), skin, { pos: [0, .105, .03], scale: [.8, 1, .9] }); }
  if (o.head === 'adrian') { P.add('head', sph(.118, 12, 6), hc, { pos: [0, .19, 0], scale: [1, .62, 1.12] }); P.add('head', cyl(.15, .16, .015, 14), hc, { pos: [0, .16, .005], scale: [1, 1, 1.15] }); P.add('head', box(.012, .03, .2), hc, { pos: [0, .265, 0] }); }
  if (o.head === 'brodie') { P.add('head', sph(.112, 12, 6), hc, { pos: [0, .2, 0], scale: [1, .5, 1.05] }); P.add('head', cyl(.17, .175, .012, 16), hc, { pos: [0, .185, 0], scale: [1, 1, 1.08] }); }
  if (o.head === 'kepi') { P.add('head', cyl(.085, .092, .09, 12), hc, { pos: [0, .24, 0] }); P.add('head', box(.14, .01, .07), '#1c1a19', { pos: [0, .2, .11] }); }
  // eşyalar
  if (o.prop === 'sack') P.add('chest', sph(.24, 10, 8), '#a8946c', { pos: [-.12, .36, -.1], rot: [0, 0, .35], scale: [1.5, .85, .9] });   // omuzda çuval
  if (o.prop === 'oud') { P.add('spine', sph(.17, 12, 8), '#b98a4e', { pos: [-.06, .1, .2 * B], scale: [1.25, .95, .5] }); P.add('spine', box(.5, .045, .03), '#4a3222', { pos: [.3, .2, .2 * B], rot: [0, 0, .32] }); }
  if (o.prop === 'sieve') { P.add('handR', cyl(.2, .2, .06, 16, true), '#a8783e', { pos: [.19, -.06, .1] }); P.add('handR', cyl(.2, .2, .01, 16), '#d8c690', { pos: [.19, -.08, .1] }); }
  if (o.prop === 'lmg') { P.add('spine', box(.07, .09, .62), '#2a2826', { pos: [-.12, .1, .3 * B], rot: [0, .25, 0] }); P.add('spine', box(.04, .16, .1), '#3a2a1c', { pos: [-.16, .02, .12 * B] }); }
  if (o.prop === 'rifle') { P.add('chest', box(.035, 1.18, .045), '#3a2a1c', { pos: [.02, .06, -.14], rot: [0, 0, .5] }); P.add('chest', box(.03, .5, .03), '#4a3423', { pos: [0, .02, .13], rot: [0, 0, .5] }); }
  if (o.prop === 'rifleh') { P.add('foreR', box(.04, 1.12, .05), '#3a2a1c', { pos: [.03, -.42, .04] }); P.add('foreR', box(.02, .5, .02), '#2b2c2e', { pos: [.03, -.95, .05] }); }   // elde tüfek (ön kol yönünde)
  if (o.prop === 'horn') { P.add('handR', cyl(.012, .012, .3, 6), '#b99442', { pos: [0, -.06, .12], rot: [Math.PI / 2, 0, 0] }); P.add('handR', cyl(.06, .015, .1, 10, true), '#b99442', { pos: [0, -.06, .31], rot: [-Math.PI / 2, 0, 0] }); }
  if (o.prop === 'cane') P.add('handR', cyl(.012, .012, .82, 6), '#4a3423', { pos: [0, -.44, .03] });
  if (o.prop === 'jug') P.add('handR', sph(.11, 10, 8), '#a35f3c', { pos: [0, -.17, 0], scale: [1, 1.25, 1] });
  return P.geometry(skinned);
}

/** Yeni örnek: { root, mesh, bones } — root'a mixer bağlanır */
export function createInstance(geometry, material) {
  const bones = makeBones(); const skeleton = new THREE.Skeleton(bones, BIND.inv);
  const mesh = new THREE.SkinnedMesh(geometry, material); const root = new THREE.Group(); root.add(bones[0]); root.add(mesh); mesh.bind(skeleton, new THREE.Matrix4());
  mesh.frustumCulled = false; // görünürlüğü NpcManager yönetir (kemik animasyonu sınır küresini aşar)
  return { root, mesh, bones };
}

/* ---------------- prosedürel klipler ---------------- */
// Poz fonksiyonu: faz (0..1) -> { kemik: [x,y,z euler], hipsY, hipsX }
const TAU = Math.PI * 2;
function clip(name, dur, poseFn, speed = 0, n = 20) {
  const times = []; const rot = {}; const hip = [];
  for (let i = 0; i <= n; i++) { const p = i / n; times.push(p * dur); const pose = poseFn(p === 1 ? 0 : p); const q = new THREE.Quaternion(), e = new THREE.Euler();
    for (const [b] of BONES) { const r = pose[b] || [0, 0, 0]; e.set(r[0], r[1], r[2], 'YXZ'); q.setFromEuler(e); (rot[b] ||= []).push(q.x, q.y, q.z, q.w); }
    hip.push(pose.hipsX || 0, HIP_Y + (pose.hipsY || 0), 0); }
  const tracks = Object.entries(rot).map(([b, v]) => new THREE.QuaternionKeyframeTrack(b + '.quaternion', times, v)); tracks.push(new THREE.VectorKeyframeTrack('hips.position', times, hip));
  const c = new THREE.AnimationClip(name, dur, tracks); c.userData = { speed }; return c;
}
const walkPose = ({ A = .42, K = .85, arm = .34, fore = .22, lean = .05, sway = .05, bounce = .014, armFix = null, head = 0 }) => p => {
  const f = p * TAU, s = Math.sin(f), c = Math.cos(f); const kneeL = K * Math.max(0, c), kneeR = K * Math.max(0, -c);
  const pose = { hips: [0, sway * s, sway * .5 * s], spine: [lean, -sway * s, 0], chest: [lean * .4, -sway * 1.2 * s, 0], head: [head - lean * .6, 0, 0],
    legL: [-A * s, 0, 0], legR: [A * s, 0, 0], shinL: [kneeL, 0, 0], shinR: [kneeR, 0, 0], footL: [-.25 * Math.max(0, -s) + .15 * Math.max(0, s), 0, 0], footR: [-.25 * Math.max(0, s) + .15 * Math.max(0, -s), 0, 0],
    hipsY: -bounce + bounce * Math.cos(2 * f) - (1 - Math.cos(A)) * LEG_LEN * .5 };
  if (armFix) Object.assign(pose, armFix); else Object.assign(pose, { armL: [arm * s, 0, .06], armR: [-arm * s, 0, -.06], foreL: [-fore - fore * .6 * Math.max(0, -s), 0, 0], foreR: [-fore - fore * .6 * Math.max(0, s), 0, 0] });
  return pose; };
const stride = (A, dur) => 4 * LEG_LEN * Math.sin(A) * .92 / dur;   // çevrim başına iki adım

const FAMILY = {
  male: { walk: { A: .42 }, wDur: 1.08, run: { A: .78, K: 1.5, arm: .85, fore: 1.1, lean: .2, bounce: .04 }, rDur: .66, stoop: 0 },
  female: { walk: { A: .36, arm: .22, sway: .085 }, wDur: 1.02, run: { A: .68, K: 1.4, arm: .7, fore: 1.0, lean: .17, bounce: .035 }, rDur: .68, stoop: 0 },
  child: { walk: { A: .44, arm: .42, bounce: .022 }, wDur: .86, run: { A: .85, K: 1.6, arm: 1.0, fore: 1.1, lean: .18, bounce: .05 }, rDur: .52, stoop: 0 },
  elder: { walk: { A: .27, K: .5, arm: .15, lean: .2, head: .12 }, wDur: 1.34, run: { A: .4, K: .8, arm: .3, lean: .24 }, rDur: 1.0, stoop: .2 },
  soldier: { walk: { A: .44, arm: .5, fore: .05, lean: .0, sway: .02 }, wDur: 1.0, run: { A: .78, K: 1.5, arm: .8, fore: 1.2, lean: .2, bounce: .04 }, rDur: .64, stoop: -.02 }
};
const cache = new Map();
/** Aile başına klip seti (paylaşılır). userData.speed = klibin ayak kaymasız doğal hızı (1 m boy ölçeği için değil; 1.75 m manken) */
export function clipsFor(family) {
  if (cache.has(family)) return cache.get(family); const F = FAMILY[family] || FAMILY.male; const st = F.stoop; const S = Math.sin;
  const stand = (extra = {}) => ({ spine: [st, 0, 0], chest: [st * .4, 0, 0], head: [-st * .5, 0, 0], armL: [0, 0, .07], armR: [0, 0, -.07], foreL: [-.12, 0, 0], foreR: [-.12, 0, 0], ...extra });
  const carryArms = { armL: [-.55, 0, .1], armR: [-.55, 0, -.1], foreL: [-1.7, 0, 0], foreR: [-1.7, 0, 0] };
  const set = {
    idle: clip('idle', 4.2, p => { const f = p * TAU; return stand({ spine: [st + .012 * S(f), 0, .015 * S(f * .5 + 1)], chest: [st * .4 + .015 * S(f), 0, 0], head: [-st * .5, .16 * S(f * .5), 0], hips: [0, 0, .015 * S(f * .5)] }); }),
    walk: clip('walk', F.wDur, walkPose(F.walk), stride(F.walk.A, F.wDur)),
    run: clip('run', F.rDur, walkPose(F.run), stride(F.run.A, F.rDur) * 1.25),
    talk_a: clip('talk_a', 3.2, p => { const f = p * TAU; return stand({ armR: [-.55 - .15 * S(f), 0, -.15], foreR: [-1.15 + .35 * S(2 * f), 0, 0], head: [-st * .5 + .07 * S(2 * f), .08 * S(f), 0], spine: [st + .02 * S(f), .04 * S(f), 0] }); }),
    talk_b: clip('talk_b', 3.8, p => { const f = p * TAU; return stand({ armL: [-.4 - .1 * S(f), 0, .2], foreL: [-1.0 + .25 * S(2 * f + 1), 0, 0], armR: [-.2, 0, -.12], foreR: [-.9 + .2 * S(f), 0, 0], head: [-st * .5, .14 * S(f), .04 * S(2 * f)] }); }),
    sit: clip('sit', 5, p => { const f = p * TAU; return { hipsY: -.52, spine: [.16 + st + .012 * S(f), 0, 0], chest: [.06, 0, 0], head: [-.1, .12 * S(f), 0], legL: [-1.5, 0, .12], legR: [-1.5, 0, -.12], shinL: [1.5, 0, 0], shinR: [1.5, 0, 0], armL: [-.5, 0, .1], armR: [-.5, 0, -.1], foreL: [-.7, 0, 0], foreR: [-.7, 0, 0] }; }),
    carry_walk: clip('carry_walk', F.wDur * 1.2, walkPose({ ...F.walk, A: F.walk.A * .82, lean: .3, armFix: carryArms, head: .15 }), stride(F.walk.A * .82, F.wDur * 1.2)),
    carry_idle: clip('carry_idle', 4, p => stand({ spine: [.26 + .01 * S(p * TAU), 0, 0], ...carryArms })),
    work_a: clip('work_a', 1.1, p => { const h = p < .7 ? p / .7 : 1 - (p - .7) / .3; return stand({ spine: [.28, 0, 0], head: [.1, 0, 0], armR: [-.5 - .9 * h, 0, -.1], foreR: [-1.2 + .3 * h, 0, 0], armL: [-.5, 0, .15], foreL: [-.9, 0, 0] }); }),
    shop: clip('shop', 4.4, p => { const f = p * TAU, r = Math.max(0, S(f)); return stand({ spine: [st + .06 * r, .1 * S(f * .5), 0], head: [.1 * r, .2 * S(f * .5), 0], armR: [-.35 - .7 * r, 0, -.1], foreR: [-.5 - .3 * r, 0, 0] }); }),
    interact: clip('interact', 2.6, p => { const r = S(p * Math.PI); return stand({ spine: [st + .35 * r, 0, 0], armR: [-.9 * r, 0, -.1], armL: [-.9 * r, 0, .1], foreR: [-.5 * r, 0, 0], foreL: [-.5 * r, 0, 0] }); }),
    play: clip('play', 2.4, p => { const f = p * TAU; return stand({ armL: [-1.0, 0, .35], armR: [-1.05, 0, -.35], foreL: [-1.55 + .05 * S(4 * f), 0, 0], foreR: [-1.5 + .05 * S(4 * f + 1), 0, 0], spine: [st, .05 * S(f), .03 * S(f)], head: [-.05, 0, 0] }); }),
    sift: clip('sift', 1.3, p => { const f = p * TAU; return stand({ spine: [.5, .06 * S(f), 0], chest: [.15, 0, 0], head: [.1, 0, 0], armL: [-.75, 0, .12 + .08 * S(f)], armR: [-.75, 0, -.12 + .08 * S(f)], foreL: [-.45, 0, 0], foreR: [-.45, 0, 0], legL: [-.25, 0, 0], legR: [-.25, 0, 0], shinL: [.3, 0, 0], shinR: [.3, 0, 0], hipsY: -.03 }); }),
    // savaş pozları
    aim: clip('aim', 3, p => stand({ spine: [st + .05, .45, 0], chest: [0, .1, 0], head: [.02, -.45, 0], armR: [-1.3, 0, -.25], foreR: [-.3, 0, 0], armL: [-1.25, 0, .55], foreL: [-.5, 0, 0] })),
    kneel: clip('kneel', 3, p => ({ hipsY: -.44, spine: [.22 + .01 * S(p * TAU), 0, 0], head: [-.1, 0, 0], legL: [-1.5, 0, .05], shinL: [1.55, 0, 0], legR: [.12, 0, 0], shinR: [1.6, 0, 0], armR: [-.6, 0, -.1], foreR: [-1.2, 0, 0], armL: [-.5, 0, .2], foreL: [-1.0, 0, 0] })),
    kneelaim: clip('kneelaim', 3, p => ({ hipsY: -.44, spine: [.12, .45, 0], chest: [0, .1, 0], head: [.02, -.45, 0], legL: [-1.5, 0, .05], shinL: [1.55, 0, 0], legR: [.12, 0, 0], shinR: [1.6, 0, 0], armR: [-1.3, 0, -.25], foreR: [-.3, 0, 0], armL: [-1.25, 0, .55], foreL: [-.5, 0, 0] })),
    down: clip('down', 4, p => ({ hipsY: -.82, hips: [-1.5, 0, 0], spine: [.05, 0, 0], head: [.1, .3, 0], legL: [.1, 0, .12], legR: [.05, 0, -.1], shinL: [.15, 0, 0], shinR: [.05, 0, 0], armL: [-.2, 0, .9], armR: [.1, 0, -.5], foreL: [-.3, 0, 0], foreR: [-.2, 0, 0] })),
    guard: clip('guard', 6, p => stand({ head: [0, .35 * S(p * TAU), 0], armL: [0, 0, .04], armR: [0, 0, -.04], foreL: [0, 0, 0], foreR: [0, 0, 0] }))
  };
  cache.set(family, set); return set;
}
