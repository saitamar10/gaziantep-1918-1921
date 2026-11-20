"""Tarihî plandan (Houshamadyan, Ayntab 1919–1920) sokak orta çizgilerini ve yapı adalarını çıkarır.
   python -I godot/tools/tarihi_doku.py <plan.jpg> <x0,y0,x1,y1 piksel> <cikti_klasoru>
Plan çizimi: her sokak iki ince gri çizgi; aralarındaki dar kâğıt şeridi sokak, geniş beyaz alanlar ada. Yazılar siyah,
yapı simgeleri bordo, numara rozetleri pembe: bunlar çizgi sayılmaz.
Adımlar: çizgi maskesi -> çift çizgiyi tek banda kapama -> incelterek orta çizgi -> düğüm/kenar grafiği -> sadeleştirme.
Çıktı (piksel uzayında): <cikti>/doku_px.json {streets: [[ [x,y], ... ], ...], box}, <cikti>/doku_kaplama.png (planın üstüne çizim).
Dünya koordinatına dönüşüm ayrı adımdır (tarihi_hizala.py). Sokak genişliği plandan okunamaz (çizgi kalınlığı ölçekli değil)."""
import sys, json, os
import numpy as np
import cv2

src, box, out = sys.argv[1], [int(v) for v in sys.argv[2].split(',')], sys.argv[3]
os.makedirs(out, exist_ok=True)
x0, y0, x1, y1 = box
PAD = 12
img = cv2.imread(src)[:, :, ::-1].astype(np.int32)          # RGB
H0, W0 = img.shape[:2]
cx0, cy0, cx1, cy1 = max(0, x0 - PAD), max(0, y0 - PAD), min(W0, x1 + PAD), min(H0, y1 + PAD)
a = img[cy0:cy1, cx0:cx1]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
sat = a.max(axis=2) - a.min(axis=2)
text = lum < 95
text = cv2.dilate(text.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
icon = (r > 70) & (g < 90) & (b < 90) & (r - g > 35)
badge = (r > 215) & (g > 150) & (g < 225) & (b > 150) & (b < 225) & (r - g > 18)
ink = (lum < 205) & (sat < 45) & ~text
ink &= ~cv2.dilate((icon | badge).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
# dolu gri/mor lekeler (yapı adası dolguları, Çukur Bostan gibi alanlar) çizgi değildir: 4x4 açılmada kalan katı alanları at
solid = cv2.morphologyEx(((lum < 215) & ~text).astype(np.uint8), cv2.MORPH_OPEN, np.ones((4, 4), np.uint8))
ink &= ~(cv2.dilate(solid, np.ones((3, 3), np.uint8)) > 0)
# çift çizgiyi ve aradaki şeridi tek banda kapat
band = cv2.morphologyEx(ink.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
band = cv2.morphologyEx(band, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2)))
# küçük leke ve yazı kalıntılarını at
n, lab, st, _ = cv2.connectedComponentsWithStats(band, 8)
keep = np.zeros_like(band)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] >= 60:
        keep[lab == i] = 1
band = keep


def thin(m):
    """Zhang–Suen inceltme (numpy)."""
    m = m.copy().astype(np.uint8)
    while True:
        changed = False
        for step in (0, 1):
            p = np.pad(m, 1)
            P2, P3, P4, P5 = p[:-2, 1:-1], p[:-2, 2:], p[1:-1, 2:], p[2:, 2:]
            P6, P7, P8, P9 = p[2:, 1:-1], p[2:, :-2], p[1:-1, :-2], p[:-2, :-2]
            nb = [P2, P3, P4, P5, P6, P7, P8, P9]
            B = sum(x.astype(np.int32) for x in nb)
            A = sum(((nb[i] == 0) & (nb[(i + 1) % 8] == 1)).astype(np.int32) for i in range(8))
            if step == 0:
                c = (P2 * P4 * P6 == 0) & (P4 * P6 * P8 == 0)
            else:
                c = (P2 * P4 * P8 == 0) & (P2 * P6 * P8 == 0)
            rm = (m == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if rm.any():
                m[rm] = 0
                changed = True
        if not changed:
            return m


sk = thin(band)
H, W = sk.shape
# 8 komşu, saat yönünde (geçiş sayısı için sıra önemli)
RING = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
ys, xs = np.nonzero(sk)
pix = set(zip(ys.tolist(), xs.tolist()))


def nbrs(p):
    return [(p[0] + dy, p[1] + dx) for dy, dx in RING if (p[0] + dy, p[1] + dx) in pix]


def crossing(p):
    v = [((p[0] + dy, p[1] + dx) in pix) for dy, dx in RING]
    return sum((not v[i]) and v[(i + 1) % 8] for i in range(8))


# düğüm: uç (geçiş 1) ya da kavşak (geçiş >= 3); merdiven pikselleri düğüm sayılmaz
nodes = {p for p in pix if crossing(p) != 2 or len(nbrs(p)) == 1}
# bitişik kavşak piksellerini tek düğümde topla
cl = {}
for nd in nodes:
    if nd in cl:
        continue
    stack, grp = [nd], []
    cl[nd] = nd
    while stack:
        q = stack.pop()
        grp.append(q)
        for t in nbrs(q):
            if t in nodes and t not in cl:
                cl[t] = nd
                stack.append(t)
center = {}
for q, rep in cl.items():
    center.setdefault(rep, []).append(q)
center = {rep: (sum(t[0] for t in g) / len(g), sum(t[1] for t in g) / len(g)) for rep, g in center.items()}
visited = set()
edges = []
for nd in nodes:
    for q in nbrs(nd):
        if q in nodes or q in visited:
            continue
        path = [nd, q]
        visited.add(q)
        prev, cur = nd, q
        while True:
            cand = [t for t in nbrs(cur) if t != prev and t not in visited and t not in path]
            ends = [t for t in nbrs(cur) if t in nodes and t != path[0] or (t in nodes and len(path) > 3)]
            ends = [t for t in nbrs(cur) if t in nodes and t not in path[:1]] or [t for t in nbrs(cur) if t in nodes and len(path) > 3]
            if ends:
                path.append(ends[0])
                break
            # 4-komşuyu öne al (merdivende iki aday çıkar)
            cand.sort(key=lambda t: abs(t[0] - cur[0]) + abs(t[1] - cur[1]))
            if not cand:
                break
            prev, cur = cur, cand[0]
            visited.add(cur)
            path.append(cur)
        edges.append(path)
# düğüm pikselini kümesinin ortasına taşı
def nodept(p):
    if p in cl:
        c = center[cl[p]]
        return (c[0], c[1])
    return p
for e in edges:
    e[0] = nodept(e[0])
    e[-1] = nodept(e[-1])
deg = {}
for e in edges:
    for p in (e[0], e[-1]):
        deg[p] = deg.get(p, 0) + 1
def endfree(p):
    return deg.get(p, 0) == 1
def plen(e):
    return sum(((e[i][0] - e[i - 1][0]) ** 2 + (e[i][1] - e[i - 1][1]) ** 2) ** 0.5 for i in range(1, len(e)))
streets = []
for e in edges:
    if plen(e) < 7 and (endfree(e[0]) or endfree(e[-1])):
        continue
    if plen(e) < 2:
        continue
    pts = np.array([[p[1], p[0]] for p in e], np.float32).reshape(-1, 1, 2)
    simp = cv2.approxPolyDP(pts, 0.9, False).reshape(-1, 2)
    streets.append([[float(x + cx0), float(y + cy0)] for x, y in simp])
# yazı ve simge yüzünden kopan sokakları bağla: boşta kalan uç, kendi doğrultusunda 16 px içinde başka bir sokağa değiyorsa
def free_ends():
    cnt = {}
    for st_ in streets:
        for q in (tuple(st_[0]), tuple(st_[-1])):
            k = (round(q[0]), round(q[1]))
            cnt[k] = cnt.get(k, 0) + 1
    out_ = []
    for i, st_ in enumerate(streets):
        for end in (0, -1):
            q = st_[end]
            if cnt[(round(q[0]), round(q[1]))] == 1:
                r_ = st_[1] if end == 0 else st_[-2]
                d = np.array(q) - np.array(r_)
                n_ = np.linalg.norm(d)
                if n_ > 0:
                    out_.append((i, end, np.array(q), d / n_))
    return out_
bridges = 0
for i, end, q, d in free_ends():
    best = None
    for j, st_ in enumerate(streets):
        for k, v in enumerate(st_):
            if j == i and abs(k - (0 if end == 0 else len(st_) - 1)) < 3:
                continue
            w = np.array(v) - q
            L = np.linalg.norm(w)
            if 1.5 < L < 16 and np.dot(w / L, d) > 0.77:
                if best is None or L < best[0]:
                    best = (L, v)
    if best is not None:
        if end == 0:
            streets[i].insert(0, list(best[1]))
        else:
            streets[i].append(list(best[1]))
        bridges += 1
# hâlâ boşta kalan kısa uçları at (12 px altı)
fe = {(i, e) for i, e, _, _ in free_ends()}
def slen(st_):
    return sum(np.hypot(st_[k][0] - st_[k - 1][0], st_[k][1] - st_[k - 1][1]) for k in range(1, len(st_)))
streets = [st_ for i, st_ in enumerate(streets) if not (((i, 0) in fe or (i, -1) in fe) and slen(st_) < 12)]
print('KOPRU', bridges)
dt = cv2.distanceTransform(band, cv2.DIST_L2, 3)
def bandw(st_):
    v = []
    for k in range(1, len(st_)):
        for t in np.linspace(0, 1, 6):
            x = st_[k - 1][0] + (st_[k][0] - st_[k - 1][0]) * t - cx0; y = st_[k - 1][1] + (st_[k][1] - st_[k - 1][1]) * t - cy0
            if 0 <= int(y) < H and 0 <= int(x) < W:
                v.append(float(dt[int(y), int(x)]))
    return float(np.median(v)) if v else 0.0
json.dump({'box': box, 'streets': streets, 'band_px': [bandw(st_) for st_ in streets]}, open(os.path.join(out, 'doku_px.json'), 'w'))
# kaplama görüntüsü
vis = cv2.imread(src)[cy0:cy1, cx0:cx1].copy()
vis = cv2.resize(vis, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
over = vis.copy()
over[cv2.resize(band, None, fx=4, fy=4, interpolation=cv2.INTER_NEAREST) > 0] = (230, 200, 120)
vis = cv2.addWeighted(vis, 0.6, over, 0.4, 0)
for s in streets:
    pts = np.array([[(x - cx0) * 4, (y - cy0) * 4] for x, y in s], np.int32)
    cv2.polylines(vis, [pts], False, (40, 40, 220), 2)
cv2.rectangle(vis, ((x0 - cx0) * 4, (y0 - cy0) * 4), ((x1 - cx0) * 4, (y1 - cy0) * 4), (0, 140, 0), 2)
cv2.imwrite(os.path.join(out, 'doku_kaplama.png'), vis)
print('SOKAK parca=%d dugum=%d piksel=%d' % (len(streets), len(center), len(pix)))
