"""Plan pikseli -> oyun dünyası (x doğu, z güney, metre).
   python -I godot/tools/tarihi_hizala.py <doku_px.json> <cikti.json>
Model: (1) bütün sabit noktalarla en küçük kareler benzerlik dönüşümü (ölçek + dönme + öteleme),
       (2) üstüne YEREL düzeltme: her sabit noktadaki artık, Gauss çekirdekli (sigma = SIGMA_PX) yumuşak bir alanla dağıtılır.
Sabit noktalarda plan artık oyundaki yapıya oturur; noktalardan uzaklaştıkça düzeltme sönerek benzerlik dönüşümüne döner.
Birini dışarıda bırakma (LOO) sınaması yazdırılır: noktalar ARASINDA kalan belirsizliğin ölçüsüdür (plan şematik, düzgün değil).
Koordinat kaynağı: Kültür Envanteri (kulturenvanteri.com), oyundaki yer işaretleri (historicalReferences.js) ile aynı."""
import sys, json
import numpy as np

# (ad, plan pikseli (simge ağırlık merkezi), dünya xz, güven)
ANCHORS = [
    ('Meryem Ana Kilisesi (37) = Kurtuluş Camii', (781.4, 356.5), (-691.9, 680.1), 'kesin'),
    ('Kozanlı Camii (50)', (811.0, 499.5), (-631.3, 957.8), 'kesin'),
    ('Şeyh Camii (51) ~ Şahveli (Yukarı Şeyh) Camii', (655.7, 482.6), (-916.9, 924.2), 'olası'),
    ('Çınarlı Camii (15)', (834.6, 169.5), (-567.8, 332.4), 'kesin'),
    ('Vartanyan Okulu (38)', (782.5, 378.7), (-681.3, 714.9), 'kesin'),
    ('Protestanların İkinci Kilisesi (40)', (797.8, 417.7), (-674.6, 794.9), 'kesin'),
    ('Protestanların Birinci Kilisesi (21)', (911.9, 243.4), (-465.2, 457.5), 'kesin'),
    ('İbn Eyüp Camii (43) = Eyüpoğlu Camii', (925.9, 321.9), (-476.1, 612.8), 'kesin'),
    ('Anglikan Kilisesi (46)', (904.3, 381.9), (-489.6, 700.5), 'kesin'),
    ('Nersesyan Okulu (24)', (1025.1, 235.9), (-264.8, 397.5), 'kesin'),
    ('Hallacyan Yetimhanesi (36)', (654.0, 436.5), (-896.8, 815.5), 'kesin'),
    ('Beyazın Oğlu Hanı (31) = Bayaz Han', (531.0, 268.0), (-1129.4, 525.7), 'olası'),
    # oyundaki yer işaretiyle tutarlılık için (oyun konumları): plandaki yapı oyundaki binanın üstüne gelsin
    ('Latin Manastırı (7) ~ Kendirli Kilisesi (oyundaki yer işareti)', (784.2, 195.5), (-694.6, 400.8), 'varsayım'),
    ('Amerikan Hastanesi (30) = oyundaki hastane yer işareti', (655.0, 388.0), (-905.0, 729.0), 'varsayım'),
]
SIGMA_PX = 70.0     # ~125 m: düzeltmenin etki yarıçapı
LAMBDA = 0.01        # yumuşatma (0: noktalardan tam geçer)
# genişletilmiş bölge (plan pikseli): planın yoğun yerleşimi, kuzeyde Akyol/Su Burcu, güneyde Paşa Sokağı'nın hemen altı
REGION_PX = [(488, 232), (640, 222), (700, 212), (790, 175), (815, 135), (1105, 135), (1105, 568), (488, 560)]


def fit_sim(S):
    M = []; B = []
    for _, (u, v), (x, z), _ in S:
        M += [[u, -v, 1, 0], [v, u, 0, 1]]; B += [x, z]
    return np.linalg.lstsq(np.array(M, float), np.array(B, float), rcond=None)[0]


def sim(t, u, v):
    a, b, tx, tz = t
    return a * u - b * v + tx, b * u + a * v + tz


def model(S, sigma=SIGMA_PX, lam=LAMBDA):
    t = fit_sim(S)
    P = np.array([p for _, p, _, _ in S], float)
    R = np.array([np.subtract(q, sim(t, *p)) for _, p, q, _ in S])
    K = np.exp(-((P[:, None] - P[None]) ** 2).sum(-1) / (2 * sigma * sigma))
    W = np.linalg.solve(K + lam * np.eye(len(P)), R)

    def f(u, v):
        k = np.exp(-((P - np.array([u, v])) ** 2).sum(-1) / (2 * sigma * sigma))
        x, z = sim(t, u, v); d = k @ W
        return float(x + d[0]), float(z + d[1])
    return f, t


f, t = model(ANCHORS)
print('BENZERLIK olcek m/px=%.3f donme=%.2f derece; yerel duzeltme sigma=%.0f px' % (np.hypot(t[0], t[1]), np.degrees(np.arctan2(t[1], t[0])), SIGMA_PX))
loo = []
for i, (n, p, q, g) in enumerate(ANCHORS):
    xs, zs = sim(t, *p); x, z = f(*p)
    fi, _ = model(ANCHORS[:i] + ANCHORS[i + 1:]); xl, zl = fi(*p)
    e = np.hypot(xl - q[0], zl - q[1]); loo.append(e)
    print('  %-62s yalniz_benzerlik=%5.1f m  yerel=%4.1f m  LOO=%5.1f m (%s)' % (n, np.hypot(xs - q[0], zs - q[1]), np.hypot(x - q[0], z - q[1]), e, g))
print('LOO ortalama %.1f m, ortanca %.1f m (sabit noktalar arasındaki belirsizlik)' % (np.mean(loo), np.median(loo)))
if len(sys.argv) > 2:
    d = json.load(open(sys.argv[1]))
    d['streets_xz'] = [[list(f(*pt)) for pt in s] for s in d['streets']]
    d['transform'] = {'similarity': [float(v) for v in t], 'sigma_px': SIGMA_PX, 'lambda': LAMBDA,
                      'anchors': [[n, p, q, g] for n, p, q, g in ANCHORS], 'loo_mean_m': float(np.mean(loo))}
    # bölge kenarı 10 px'te bir örneklenir (yerel düzeltme kenarı büker)
    ring = []
    for a, b in zip(REGION_PX, REGION_PX[1:] + REGION_PX[:1]):
        n = max(1, int(np.hypot(b[0] - a[0], b[1] - a[1]) / 10))
        ring += [f(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n)]
    d['region_px'] = REGION_PX
    d['box_xz'] = [list(p) for p in ring]
    d['anchors_xz'] = [[n, list(q)] for n, _, q, _ in ANCHORS]
    # plan görüntüsünün bükülmüş ızgarası (Blender plan düzlemi ve üstten karşılaştırma için): 10 px adım, bütün görüntü
    import cv2
    Hh, Ww = cv2.imread(d.get('plan_path', 'godot/docs/harita/houshamadyan_ayntab_plan_1919-1920.jpg')).shape[:2]
    us = list(range(0, Ww + 1, 10)); vs = list(range(0, Hh + 1, 10))
    d['plan_grid'] = {'w': Ww, 'h': Hh, 'us': us, 'vs': vs, 'xz': [[list(f(u, v)) for u in us] for v in vs]}
    json.dump(d, open(sys.argv[2], 'w'))
    xs = [p[0] for p in ring]; zs = [p[1] for p in ring]
    print('BOLGE x %.0f..%.0f z %.0f..%.0f, %d kenar noktasi' % (min(xs), max(xs), min(zs), max(zs), len(ring)))
