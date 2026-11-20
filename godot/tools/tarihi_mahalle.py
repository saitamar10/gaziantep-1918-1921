"""Deneme mahallesi: plandan çıkan sokak orta çizgilerinden (dünya xz) yapı adalarını ve parselleri kurar, oyun verisi yazar.
   python -I godot/tools/tarihi_mahalle.py <doku_xz.json> <antep/src/data/tarihiMahalle.js> [onizleme.png]
Genişlikler TAHMİN: plan çizgi kalınlığı ölçekli değil. Geniş çizilen (bant ilk %15) sokak 5 m, ara sokak 3.4 m,
çıkmaz 2.4 m. Adalar = bölge - sokak tamponları; parseller adaların dışbükey parçalara bölünmesiyle (hedef 160-320 m²)."""
import sys, json, random
import numpy as np
from shapely.geometry import Polygon, LineString, MultiPolygon, box as sbox
from shapely.ops import unary_union, split
from shapely import affinity

src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
region = Polygon(d['box_xz'])
inner = region.buffer(-3.4, join_style=2)   # halka sokak (orta çizgi -1.4 m, 4 m) için boşluk
streets = [s for s in d['streets_xz'] if len(s) >= 2]
band = d['band_px']
q85 = float(np.percentile(band, 85))
# uç dereceleri (çıkmaz tespiti)
ends = {}
def key(p):
    return (round(p[0] / 2.0), round(p[1] / 2.0))
for s in streets:
    for p in (s[0], s[-1]):
        ends[key(p)] = ends.get(key(p), 0) + 1
segs = []
lines = []
for s, bw in zip(streets, band):
    ls = LineString(s).intersection(region)
    if ls.is_empty or ls.length < 2:
        continue
    dead = ends[key(s[0])] == 1 and not region.exterior.distance(LineString([s[0], s[0]]).centroid) < 6 or \
           ends[key(s[-1])] == 1 and not region.exterior.distance(LineString([s[-1], s[-1]]).centroid) < 6
    w = 5.0 if bw >= q85 else (2.4 if dead and ls.length < 45 else 3.4)
    parts = [ls] if ls.geom_type == 'LineString' else list(ls.geoms)
    for g in parts:
        if g.geom_type != 'LineString':
            continue
        lines.append((g, w))
        c = list(g.coords)
        for a, b in zip(c, c[1:]):
            L = float(np.hypot(b[0] - a[0], b[1] - a[1]))
            if L > 0.3:
                segs.append({'a': [round(a[0], 2), round(a[1], 2)], 'b': [round(b[0], 2), round(b[1], 2)], 'w': w, 'len': round(L, 2), 'depth': 9, 'hist': 1})
# bölge kenarı halka sokağı (dış dokuya bağlantı): orta çizgi kenardan 1.4 m içeride; dışarıdaki üretilmiş parseller kenara kadar
# gelebildiği için çizgi tam kenarda olursa yaya ağında tıkanıyordu
rc = list(region.buffer(-1.4, join_style=2).exterior.coords)
for a, b in zip(rc, rc[1:]):
    L = float(np.hypot(b[0] - a[0], b[1] - a[1]))
    segs.append({'a': [round(a[0], 2), round(a[1], 2)], 'b': [round(b[0], 2), round(b[1], 2)], 'w': 4.0, 'len': round(L, 2), 'depth': 9, 'hist': 2})
# kopuk parçaları bağla (TAHMİN, hist=4, 2.6 m): plandaki yazı ve simgeler sokakları böler.
# (1) boşta kalan uç (bölge kenarında değilse) kendi doğrultusunda (±60°) 22 m içindeki başka bir sokağa uzatılır;
# (2) iç sokak bileşenleri, halka SAYILMADAN, en kısa köprülerle (Kruskal, köprü <= 120 m, 25 m üstü hafif kırık) tek ağ yapılır.
#     Halka sayılsaydı bileşenler yalnız kenardan bağlanır, bölgenin içinden geçmek için çevresini dolanmak gerekirdi.
from shapely.ops import nearest_points
from shapely.geometry import Point
ring_line = LineString(rc)
n_bag = 0
def con_line(p, q):
    """25 m'den uzun bağlantı ortasından hafifçe kırılır (cetvel gibi düz durmasın)"""
    L = p.distance(q)
    if L <= 25:
        return LineString([p, q])
    dx, dz = (q.x - p.x) / L, (q.y - p.y) / L; Rc = random.Random(int(p.x * 7 + p.y * 13)); o = (Rc.random() - 0.5) * 0.24 * L; t = 0.4 + Rc.random() * 0.2
    return LineString([p, (p.x + dx * L * t - dz * o, p.y + dz * L * t + dx * o), q])
def add_con(p, q, ln=None):
    global n_bag
    L = p.distance(q)
    if L < 0.3:
        return
    ln = ln or LineString([p, q])
    lines.append((ln, 2.6)); n_bag += 1
    cc = list(ln.coords)
    for a_, b_ in zip(cc, cc[1:]):
        segs.append({'a': [round(a_[0], 2), round(a_[1], 2)], 'b': [round(b_[0], 2), round(b_[1], 2)], 'w': 2.6, 'len': round(float(np.hypot(b_[0] - a_[0], b_[1] - a_[1])), 2), 'depth': 9, 'hist': 4})
base = [g for g, _w in lines]
deg = {}
for g in base:
    for c in (g.coords[0], g.coords[-1]):
        k = (round(c[0], 1), round(c[1], 1)); deg[k] = deg.get(k, 0) + 1
for i, g in enumerate(base):
    cs = list(g.coords)
    for end, prev in ((cs[0], cs[1]), (cs[-1], cs[-2])):
        if deg[(round(end[0], 1), round(end[1], 1))] != 1 or region.exterior.distance(Point(end)) < 4:
            continue
        v = np.array(end) - np.array(prev); nv = np.linalg.norm(v)
        if nv < 1e-6:
            continue
        v /= nv
        pe = Point(end); best = None
        for j, o in enumerate(base):
            if j == i or o.distance(pe) > 22:
                continue
            q = nearest_points(pe, o)[1]
            w_ = np.array([q.x - end[0], q.y - end[1]]); L = np.linalg.norm(w_)
            if L < 1.0 or np.dot(w_ / L, v) < 0.5:
                continue
            if best is None or L < best[0]:
                best = (L, q)
        if best:
            add_con(pe, best[1])
for _ in range(200):
    geoms = [g for g, _w in lines]
    comps = unary_union([g.buffer(1.2) for g in geoms])
    comps = list(comps.geoms) if hasattr(comps, 'geoms') else [comps]
    if len(comps) <= 1:
        break
    cl = [unary_union([g for g in geoms if g.intersects(c)]) for c in comps]
    best = None
    big = max(range(len(comps)), key=lambda k: comps[k].area)
    for k in range(len(comps)):          # en büyüğe değil, en yakın herhangi bir bileşene (Kruskal adımı)
        if k == big:
            continue
        for m in range(len(comps)):
            if m == k or comps[k].distance(comps[m]) > 120:
                continue
            p_, q_ = nearest_points(cl[k], cl[m]); dd = p_.distance(q_)
            if best is None or dd < best[0]:
                best = (dd, p_, q_)
    if best is None:
        break
    add_con(best[1], best[2], con_line(best[1], best[2]))
# (3) döngü kapatma: plandaki yazılar sokakları kestiği için ağ ağaç gibi kalıyor, komşu noktalar arası 2–4 kat dolanılıyordu.
# Boşta kalan her uçtan 35 m içindeki sokak noktalarına bakılır; ağ üzerinden uzaklık düz uzaklığın 3 katını (+20 m) aşıyorsa
# en yakın böyle noktaya bağlantı açılır (TAHMİN).
import heapq
from shapely.strtree import STRtree
def build_graph():
    merged = unary_union([g for g, _w in lines] + [ring_line])
    pieces = [g for g in (merged.geoms if hasattr(merged, 'geoms') else [merged]) if g.geom_type == 'LineString' and g.length > 0.05]
    key_ = lambda c: (round(c[0], 1), round(c[1], 1))
    adj = {}
    for k, g in enumerate(pieces):
        a, b = key_(g.coords[0]), key_(g.coords[-1])
        adj.setdefault(a, []).append((b, g.length)); adj.setdefault(b, []).append((a, g.length))
    return pieces, adj, key_
pieces, adj, key_ = build_graph()
tree = STRtree(pieces)
n_dong = 0
for node, nb in list(adj.items()):
    if len(nb) != 1 or region.exterior.distance(Point(node)) < 4:
        continue
    dist = {node: 0.0}; h = [(0.0, node)]
    while h:
        dd, u = heapq.heappop(h)
        if dd > dist.get(u, 1e18) or dd > 600:
            continue
        for v, L in adj.get(u, []):
            if dd + L < dist.get(v, 1e18):
                dist[v] = dd + L; heapq.heappush(h, (dd + L, v))
    pe = Point(node); prev = nb[0][0]
    v0 = np.array(node) - np.array(prev); v0 = v0 / (np.linalg.norm(v0) or 1)
    best = None
    for k in tree.query(pe.buffer(35)):
        g = pieces[int(k)]
        if g.distance(pe) < 1.5:
            continue
        q = nearest_points(pe, g)[1]; st_ = pe.distance(q)
        if st_ > 35:
            continue
        w_ = np.array([q.x - node[0], q.y - node[1]]) / st_
        if np.dot(w_, v0) < -0.2:
            continue
        t = g.project(q)
        nd = min(dist.get(key_(g.coords[0]), 1e18) + t, dist.get(key_(g.coords[-1]), 1e18) + g.length - t)
        if nd > 3 * st_ + 20 and (best is None or st_ < best[0]):
            best = (st_, q)
    if best:
        add_con(pe, best[1]); n_dong += 1
        adj.setdefault(node, []).append((key_((best[1].x, best[1].y)), best[0]))   # aynı bölgede ikinci kez açılmasın diye yaklaşık
# (4) genel kısa yol: ağ üzerinde 25 m'de bir örnek nokta; 70 m içindeki bir sokak noktasına ağ üzerinden uzaklık
# 2 x düz + 30 m'yi (40 m üstünde 2.5 x) aşıyorsa ve aradaki çizgi başka sokağı kesmiyorsa, en çok kazandıran bağlantı açılır (TAHMİN).
pieces, adj, key_ = build_graph()
tree = STRtree(pieces)
def dijk(src, lim=500):
    dist = {src: 0.0}; h = [(0.0, src)]
    while h:
        dd, u = heapq.heappop(h)
        if dd > dist.get(u, 1e18) or dd > lim:
            continue
        for v, L in adj.get(u, []):
            if dd + L < dist.get(v, 1e18):
                dist[v] = dd + L; heapq.heappush(h, (dd + L, v))
    return dist
added = []
for i, g in enumerate(pieces):
    if g.length < 4:
        continue
    a, b = key_(g.coords[0]), key_(g.coords[-1])
    da, db = dijk(a), dijk(b)
    for t in np.arange(min(12.0, g.length / 2), g.length, 25.0):
        pa = g.interpolate(t)
        if any(pa.distance(x) < 30 for x in added):
            continue
        best = None
        for k in tree.query(pa.buffer(70)):
            k = int(k)
            if k == i:
                continue
            h_ = pieces[k]
            q = nearest_points(pa, h_)[1]; st_ = pa.distance(q)
            if st_ < 3 or st_ > 70:
                continue
            tq = h_.project(q); qa, qb = key_(h_.coords[0]), key_(h_.coords[-1])
            nd = 1e18
            for dd, off in ((da, t), (db, g.length - t)):
                nd = min(nd, off + dd.get(qa, 1e18) + tq, off + dd.get(qb, 1e18) + h_.length - tq)
            if nd <= (2 if st_ <= 40 else 2.5) * st_ + 30:
                continue
            con = con_line(pa, q)
            if any(con.crosses(pieces[int(m)]) or (int(m) not in (i, k) and con.intersects(pieces[int(m)])) for m in tree.query(con) if int(m) not in (i, k)):
                continue
            if not region.buffer(-3).contains(Point(con.coords[len(con.coords) // 2])):
                continue
            # en çok kazandıran (dolanma / düz) aday seçilir
            gain = nd / st_
            if best is None or gain > best[0]:
                best = (gain, q, k, con)
        if best:
            add_con(pa, best[1], best[3]); added.append(pa); n_dong += 1
            # grafiği yaklaşık güncelle: iki parçanın uçları birbirine bağlanır
            q = best[1]; h_ = pieces[best[2]]
            for e1, o1 in ((a, t), (b, g.length - t)):
                for e2, o2 in ((key_(h_.coords[0]), h_.project(q)), (key_(h_.coords[-1]), h_.length - h_.project(q))):
                    Lc = best[3].length; adj.setdefault(e1, []).append((e2, o1 + Lc + o2)); adj.setdefault(e2, []).append((e1, o1 + Lc + o2))
            da, db = dijk(a), dijk(b)
print('DONGU kapatma (TAHMIN) %d' % n_dong)
print('BAGLANTI sokagi (TAHMIN) %d' % n_bag)
roads = unary_union([g.buffer(w / 2, cap_style=1, join_style=1) for g, w in lines])
blocks = inner.difference(roads)
blocks = [g for g in (blocks.geoms if isinstance(blocks, MultiPolygon) else [blocks]) if g.area > 25]
# küçük kalan alanlar = meydancık (kayıt için)
small = [g for g in blocks if g.area < 90]
blocks = [g for g in blocks if g.area >= 90]
R = random.Random(19191920)


def obb_axis(g):
    r = g.minimum_rotated_rectangle
    c = list(r.exterior.coords)
    e = [(np.hypot(c[i + 1][0] - c[i][0], c[i + 1][1] - c[i][1]), i) for i in range(4)]
    L, i = max(e)
    ang = np.arctan2(c[i + 1][1] - c[i][1], c[i + 1][0] - c[i][0])
    W = min(x for x, _ in e)
    return ang, L, W


def convexity(g):
    return g.area / max(g.convex_hull.area, 1e-6)


lots = []


def cut(g, depth):
    g = g.simplify(0.35, preserve_topology=True)
    if g.is_empty or g.area < 28:
        return
    ang, L, W = obb_axis(g)
    target = 380
    convex = convexity(g) >= 0.86   # hafif kavisli şerit parçası da tek parsel sayılır
    if (g.area < target and convex) or depth > 12 or (W < 6.5 and convex):
        if convex and W >= 3.6:
            lots.append(g)
        return
    c = g.centroid
    t = (R.random() - 0.5) * 0.25 * L
    dx, dz = np.cos(ang), np.sin(ang)
    px, pz = c.x + dx * t, c.y + dz * t
    nx, nz = -dz, dx
    ln = LineString([(px - nx * 400, pz - nz * 400), (px + nx * 400, pz + nz * 400)])
    parts = split(g, ln)
    if len(parts.geoms) < 2:
        if convex and W >= 3.6:
            lots.append(g)
        return
    for p in parts.geoms:
        if p.geom_type == 'Polygon':
            cut(p, depth + 1)


# 1) büyük adalara çıkmaz sokak (TAHMİN): kenardan merkeze doğru kırık, 2.2–2.6 m
from shapely.geometry import Point, MultiLineString
cikmaz = []
# kenar boyunca 34–52 m'de bir, cepheye dik içeri giren kırık çıkmaz; uzunluk 22–60 m. Büyük adalarda (plan iç yolları
# göstermiyor) evlere erişim böyle sağlanır. Önceki çıkmazlara 9 m'den yakın ya da adadan taşan aday atılır.
for blk in blocks:
    if blk.area < 1700:
        continue
    inner_ok = blk.buffer(0.6)
    taken = []
    for ex in [blk.exterior] + list(blk.interiors):   # iç boşluklar = adanın içinde kalan kopuk plan sokakları
     t = R.random() * 20
     while t < ex.length:
         p0 = ex.interpolate(t)
         pa, pb = ex.interpolate(max(0, t - 1.5)), ex.interpolate(min(ex.length, t + 1.5))
         t += 34 + R.random() * 18
         tg = np.array([pb.x - pa.x, pb.y - pa.y]); n_ = np.linalg.norm(tg)
         if n_ < 1e-6:
             continue
         tg /= n_
         v = np.array([-tg[1], tg[0]])
         if not blk.contains(Point(p0.x + v[0] * 1.5, p0.y + v[1] * 1.5)):
             v = -v
         L = 22 + R.random() * 38
         pts = [(p0.x - v[0] * 2, p0.y - v[1] * 2)]
         cur = np.array([p0.x, p0.y])
         steps = 2 + int(R.random() * 3)
         dv = v.copy()
         for i in range(steps):
             ang = (R.random() - 0.5) * 0.8
             dv = np.array([dv[0] * np.cos(ang) - dv[1] * np.sin(ang), dv[0] * np.sin(ang) + dv[1] * np.cos(ang)])
             # sapma birikmesin: ilk doğrultuya doğru çek
             dv = dv * 0.7 + v * 0.3; dv /= np.linalg.norm(dv)
             nxt = cur + dv * (L / steps)
             if not inner_ok.contains(Point(*nxt)) or blk.boundary.distance(Point(*nxt)) < 5:
                 break
             cur = nxt
             pts.append((float(cur[0]), float(cur[1])))
         if len(pts) < 3:
             continue
         ln = LineString(pts)
         if ln.length < 15 or any(ln.distance(o) < 9 for o in taken):
             continue
         taken.append(ln)
         w = 2.2 + R.random() * 0.4
         cikmaz.append((ln.intersection(blk.buffer(1.0)), w))
for g, w in cikmaz:
    parts = [g] if g.geom_type == 'LineString' else [x for x in getattr(g, 'geoms', []) if x.geom_type == 'LineString']
    for gg in parts:
        lines.append((gg, w))
        cc = list(gg.coords)
        for a_, b_ in zip(cc, cc[1:]):
            L = float(np.hypot(b_[0] - a_[0], b_[1] - a_[1]))
            if L > 0.3:
                segs.append({'a': [round(a_[0], 2), round(a_[1], 2)], 'b': [round(b_[0], 2), round(b_[1], 2)], 'w': round(w, 2), 'len': round(L, 2), 'depth': 9, 'hist': 3})
if cikmaz:
    cz = unary_union([g.buffer(w / 2, cap_style=1, join_style=1) for g, w in cikmaz])
    nb = []
    for blk in blocks:
        r_ = blk.difference(cz)
        nb += [g for g in (r_.geoms if hasattr(r_, 'geoms') else [r_]) if g.geom_type == 'Polygon' and g.area > 25]
    blocks = nb
# 2) cepheye dik parseller: ada kenarından içe 15–19 m'lik şerit, kenar boyunca 12–18 m aralıkla dik kesilir
gardens = []
for blk in blocks:
    depth = 15 + R.random() * 4
    core = blk.buffer(-depth, join_style=2)
    ring = blk.difference(core) if not core.is_empty else blk
    ex = blk.exterior
    cuts = []
    t = R.random() * 6
    while t < ex.length:
        p0 = ex.interpolate(t)
        pa, pb = ex.interpolate(max(0, t - 0.8)), ex.interpolate(min(ex.length, t + 0.8))
        tg = np.array([pb.x - pa.x, pb.y - pa.y])
        if np.linalg.norm(tg) > 1e-6:
            tg /= np.linalg.norm(tg)
            nrm = np.array([-tg[1], tg[0]])
            if not blk.contains(Point(p0.x + nrm[0] * 0.6, p0.y + nrm[1] * 0.6)):
                nrm = -nrm
            cuts.append(LineString([(p0.x - nrm[0] * 1.5, p0.y - nrm[1] * 1.5), (p0.x + nrm[0] * (depth + 3), p0.y + nrm[1] * (depth + 3))]))
        t += 12 + R.random() * 6   # cephe aralığı 12–18 m (TAHMİN; avlulu ev)
    pieces = [ring]
    if cuts:
        try:
            pieces = list(split(ring, MultiLineString(cuts)).geoms)
        except Exception:
            pieces = [ring]
    for pc in pieces:
        if pc.geom_type == 'Polygon':
            cut(pc, 0)
    if not core.is_empty:
        for g in (core.geoms if hasattr(core, 'geoms') else [core]):
            if g.geom_type == 'Polygon' and g.area > 60:
                gardens.append(g)
lot_out = []
for g in lots:
    c = [[round(x, 2), round(z, 2)] for x, z in list(g.exterior.coords)[:-1]]
    lot_out.append(c)
garden_out = []
nlots = len(lots)
for g in gardens:
    before = len(lots)
    cut(g, 0)
    for gg in lots[before:]:
        garden_out.append([[round(x, 2), round(z, 2)] for x, z in list(gg.exterior.coords)[:-1]])
js = ['// ÜRETİLMİŞ DOSYA — godot/tools/tarihi_mahalle.py yazar; elle düzenleme.',
      '// Tarihî batı mahalleleri (Akyol – Su Burcu – Transversal – Paşa Sokağı – Sahag-Mesrop arası): sokak çizgileri Houshamadyan Ayntab planından',
      '// (1919–1920 yeniden kurulumu, yalnız referans) çıkarıldı. Sokak GENİŞLİKLERİ ve PARSEL bölümü TAHMİNdir.',
      '// Hizalama: benzerlik dönüşümü + sabit noktalarda yerel düzeltme (tarihi_hizala.py); noktalar arası belirsizlik ~%.0f m. Sabit noktalar: ' % d['transform'].get('loo_mean_m', 0) + json.dumps([a[0] for a in d['transform']['anchors']], ensure_ascii=False),
      'export const TARIHI_MAHALLE = ' + json.dumps({'region': [[round(x, 2), round(z, 2)] for x, z in d['box_xz']], 'segments': segs, 'lots': lot_out, 'gardens': garden_out,
                                                    'squares': [[round(g.centroid.x, 1), round(g.centroid.y, 1), round(g.area, 1)] for g in small]}, ensure_ascii=False) + ';', '']
open(out, 'w', encoding='utf-8').write('\n'.join(js))
print('ADA %d PARSEL %d BAHCE %d CIKMAZ %d SOKAK_PARCA %d MEYDANCIK %d ortalama_parsel %.0f m2' % (len(blocks), len(lot_out), len(garden_out), len(cikmaz), len(segs), len(small), np.mean([g.area for g in lots[:nlots]])))
if len(sys.argv) > 3:
    import cv2
    xs = [p[0] for p in d['box_xz']]; zs = [p[1] for p in d['box_xz']]
    x0, z0 = min(xs) - 10, min(zs) - 10
    S = 2.0
    Wd, Hd = int((max(xs) - x0 + 10) * S), int((max(zs) - z0 + 10) * S)
    im = np.full((Hd, Wd, 3), 242, np.uint8)
    P = lambda pts: np.array([[(x - x0) * S, (z - z0) * S] for x, z in pts], np.int32)
    cv2.fillPoly(im, [P(region.exterior.coords)], (200, 205, 210))
    for i, g in enumerate(lots):
        cv2.fillPoly(im, [P(g.exterior.coords)], (150, 170, 196) if i < nlots else (120, 175, 140))
        cv2.polylines(im, [P(g.exterior.coords)], True, (90, 100, 120), 1)
    for g, w in lines:
        cv2.polylines(im, [P(g.coords)], False, (40, 40, 200), 1)
    cv2.imwrite(sys.argv[3], im)
