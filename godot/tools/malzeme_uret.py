"""Döşenebilir (seamless) PBR malzeme üretici — Antep kalker duvarı ve tarihî arnavut kaldırımı.
   python -I godot/tools/malzeme_uret.py <duvar|kaldirim> <cikti_klasoru> [boyut_px=2048] [tohum]
Çıktı: albedo.png, normal.png (OpenGL, +Y; Godot'nun beklediği), roughness.png, ao.png, height.png (16 bit), onizleme.png, OLCU.txt
Yöntem:
 - Yerleşim kodla: duvarda değişken yükseklikte sıralar (22–38 cm) ve değişken boylu taşlar (28–75 cm), eğri derzler;
   kaldırımda düzensiz Voronoi taşlar (≈10–18 cm), aralarında toprak.
 - Her taşın kendi rengi, kabarıklığı, kenar kırıkları ve yıpranması var.
 - Yüzey mikrodetayı: Poly Haven fotoğraf dokularının (CC0, godot/dokular) yüksek frekanslı kısmı, her taşa rastgele kaydırmayla.
 - Tüm gürültüler FFT ile üretilir: kendiliğinden döşenebilir. Etiket/mesafe işlemleri 3x3 döşenmiş tuval üzerinde yapılır."""
import sys, os
import numpy as np
import cv2

kind, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 2048
SEED = int(sys.argv[4]) if len(sys.argv) > 4 else 1918
rng = np.random.default_rng(SEED)
os.makedirs(out, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
DOK = os.path.join(HERE, '..', 'dokular')


def fnoise(n, beta, lo=0.0, hi=1.0, seed=None):
    """Döşenebilir 1/f^beta gürültü, [0,1]. lo/hi: bant (çevrim/doku, 0..n/2)."""
    r = np.random.default_rng(seed if seed is not None else rng.integers(1 << 30))
    fx = np.fft.fftfreq(n) * n
    f = np.sqrt(fx[None, :] ** 2 + fx[:, None] ** 2)
    f[0, 0] = 1
    amp = 1.0 / f ** beta
    if hi < n:
        amp *= np.exp(-(f / hi) ** 4)
    if lo > 0:
        amp *= 1 - np.exp(-(f / lo) ** 4)
    ph = r.uniform(0, 2 * np.pi, (n, n))
    z = np.real(np.fft.ifft2(amp * np.exp(1j * ph)))
    z -= z.min()
    return z / max(z.max(), 1e-9)


def tile3(a):
    return np.tile(a, (3, 3))


def center(a):
    return a[N:2 * N, N:2 * N]


def photo_detail(name, size_m, px_per_m):
    """Fotoğraf dokusundan yüksek frekanslı parlaklık ayrıntısı (ortalama 1) ve renk; hedef ölçeğe getirilir."""
    p = os.path.join(DOK, name, 'albedo.jpg')
    im = cv2.imread(p, cv2.IMREAD_COLOR).astype(np.float32) / 255.0
    s = size_m * px_per_m / im.shape[1]
    im = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC if s > 1 else cv2.INTER_AREA)
    lum = im.mean(axis=2)
    low = cv2.GaussianBlur(lum, (0, 0), 2.5 * s + 1.5)
    det = lum / np.maximum(low, 1e-3)
    return np.clip(det, 0.78, 1.22), im


def sample_wrap(src, oy, ox, H, W):
    """src'yi (H,W) tuvaline sarmal kaydırmayla döşeyerek örnekler."""
    ys = (np.arange(H)[:, None] + oy) % src.shape[0]
    xs = (np.arange(W)[None, :] + ox) % src.shape[1]
    return src[ys, xs]


def normal_from_height(h, strength):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * strength
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5 * strength
    n = np.dstack([-gx, gy, np.ones_like(h)])      # OpenGL: satır aşağı arttığı için y = +dh/dsatır
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)


def ao_from_height(h, radii):
    ao = np.zeros_like(h)
    for r in radii:
        b = cv2.GaussianBlur(tile3(h), (0, 0), r)[N:2 * N, N:2 * N]
        ao += np.clip((b - h) * 2.2, 0, 1)
    return np.clip(1 - ao / len(radii) * 1.1, 0.35, 1)


def save(alb, h, rough, ao, nstr, meta):
    cv2.imwrite(os.path.join(out, 'albedo.png'), cv2.cvtColor((np.clip(alb, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
    nm = normal_from_height(h, nstr)
    cv2.imwrite(os.path.join(out, 'normal.png'), cv2.cvtColor(nm, cv2.COLOR_RGB2BGR))
    cv2.imwrite(os.path.join(out, 'roughness.png'), (np.clip(rough, 0, 1) * 255).astype(np.uint8))
    cv2.imwrite(os.path.join(out, 'ao.png'), (np.clip(ao, 0, 1) * 255).astype(np.uint8))
    cv2.imwrite(os.path.join(out, 'height.png'), (np.clip(h, 0, 1) * 65535).astype(np.uint16))
    # önizleme: 2x2 döşeme, basit ışık
    L = np.array([-0.5, 0.6, 0.62]); L /= np.linalg.norm(L)
    nn = nm.astype(np.float32) / 127.5 - 1
    sh = np.clip((nn * L).sum(2), 0, 1)[..., None]
    pv = np.clip(alb * (0.35 + 0.75 * sh) * ao[..., None] ** 0.8, 0, 1)
    pv = np.tile(pv, (2, 2, 1))
    pv = cv2.resize(pv, (1600, 1600), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(out, 'onizleme.png'), cv2.cvtColor((pv * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
    open(os.path.join(out, 'OLCU.txt'), 'w', encoding='utf-8').write(meta)


def srgb2lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


# ------------------------------------------------------------------ ortak: sıralı yerleşim
def rows_layout(M, ppm, hmin, hmax, lmin, lmax, slab_p=0.0):
    """Toplamı tam M olan sıralar ve her sırada toplamı M olan taşlar -> etiket haritası (döşenebilir)."""
    def parts(lo, hi, total):
        while True:
            v = []
            while sum(v) < total - lo:
                v.append(rng.uniform(lo, hi))
            rest = total - sum(v)
            if lo * 0.9 <= rest <= hi * 1.05:
                v.append(rest)
                return v
    while True:
        hs = []
        while sum(hs) < M - hmin:
            hs.append(rng.uniform(0.05, 0.08) if rng.random() < slab_p else rng.uniform(hmin, hmax))
        rest = M - sum(hs)
        if hmin * 0.9 <= rest <= hmax:
            hs.append(rest)
            break
    ys = np.round(np.cumsum([0] + hs) * ppm).astype(int)
    lab = np.zeros((N, N), np.int32)
    n = 0
    slab = [False]
    for ci, hh in enumerate(hs):
        thin = hh < 0.09
        ls = parts(lmin * (0.6 if thin else 1), lmax * (0.8 if thin else 1), M)
        xs = (np.cumsum([0] + ls) + rng.uniform(0, M)) * ppm
        for si in range(len(ls)):
            n += 1
            slab.append(thin)
            cols = np.arange(int(np.floor(xs[si])), int(np.ceil(xs[si + 1]))) % N
            lab[ys[ci]:ys[ci + 1], cols] = n
    return lab, n + 1, hs, np.array(slab)


def warp_labels(lab, amp_px, hi):
    dx = (fnoise(N, 1.0, hi=hi) - 0.5) * 2 * amp_px
    dy = (fnoise(N, 1.0, hi=hi) - 0.5) * 2 * amp_px
    gy, gx = np.mgrid[0:N, 0:N].astype(np.float32)
    return lab[((gy + dy).astype(int)) % N, ((gx + dx).astype(int)) % N]


def edge_dist(lab):
    T = tile3(lab)
    edge = np.zeros_like(T, np.uint8)
    edge[:, 1:] |= (T[:, 1:] != T[:, :-1])
    edge[1:, :] |= (T[1:, :] != T[:-1, :])
    return center(cv2.distanceTransform((1 - edge).astype(np.uint8), cv2.DIST_L2, 5))


def per_stone_detail(lab, ns, srcs):
    offs = rng.integers(0, 8192, (ns, 2))
    pick = rng.integers(0, len(srcs), ns)
    Y, X = np.mgrid[0:N, 0:N]
    out = np.ones((N, N), np.float32)
    for i, src in enumerate(srcs):
        m = pick[lab] == i
        v = src[(Y + offs[lab, 0]) % src.shape[0], (X + offs[lab, 1]) % src.shape[1]]
        out = np.where(m, v, out)
    return out


# ------------------------------------------------------------------ DUVAR (örnek: pürüzlü sararmış kalker, derin derz, kama taşları)
def duvar():
    M = 2.0
    ppm = N / M
    mm = ppm / 1000
    lab, ns, hs, slab = rows_layout(M, ppm, 0.18, 0.46, 0.25, 0.90, slab_p=0.12)
    lab = warp_labels(lab, 10 * mm, 20)
    dt = edge_dist(lab)
    # derz: değişken genişlik + kırık kenar gürültüsü
    jw = rng.uniform(4, 13, ns)[lab] * mm
    edgen = fnoise(N, 1.3, lo=6, hi=260)
    rim = jw + (edgen - 0.35) * 26 * mm
    inner = np.clip(dt - rim, 0, None)
    stone = (dt > rim).astype(np.float32)
    # kama taşları: derz içinde yassı gri parçalar
    gapm = stone < 0.5
    shimn = fnoise(N, 1.1, lo=20, hi=200)
    shim = (gapm & (shimn > 0.62)).astype(np.float32)
    # yükseklik: pürüzlü, oyuklu yüz; kırık kenar; derin derz
    bevel = rng.uniform(6, 25, ns)[lab] * mm
    prof = 1 - np.exp(-inner / bevel)
    rough_s = fnoise(N, 1.35, hi=500) * 0.30 + fnoise(N, 0.8, lo=150) * 0.06
    pits = np.clip((fnoise(N, 0.5, lo=200, hi=900) - 0.74) * 6, 0, 1)
    vugs = np.clip((fnoise(N, 1.2, lo=30, hi=200) - 0.8) * 5, 0, 1)
    lift = rng.uniform(-0.08, 0.08, ns)[lab]
    mort = 0.16 + fnoise(N, 0.7, lo=120) * 0.12
    h = stone * (0.55 + lift + prof * 0.22 + rough_s - pits * 0.10 - vugs * 0.12) + (1 - stone) * (mort + shim * 0.25)
    h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), 0.7)
    h = (h - h.min()) / (h.max() - h.min())
    # renk: sarı-bal kalker, taş taş farklı; bir kısmı grimsi
    pal = np.array([[0.76, 0.62, 0.43], [0.70, 0.58, 0.42], [0.80, 0.70, 0.54], [0.66, 0.60, 0.52], [0.74, 0.64, 0.50], [0.62, 0.52, 0.38]])
    base = pal[rng.choice(6, ns, p=[0.25, 0.2, 0.18, 0.15, 0.12, 0.1])] * rng.uniform(0.88, 1.08, (ns, 1))
    alb = base[lab].astype(np.float32)
    det_r, _ = photo_detail('rock', 3.0, ppm)
    det_f, _ = photo_detail('flat', 2.0, ppm)
    alb *= (0.15 + 0.85 * per_stone_detail(lab, ns, [det_r, det_f]))[..., None]
    # benekli koyu lekeler (liken/kir), açık gri kireçlenme, aşı boyası lekeleri
    blot = fnoise(N, 1.25, lo=8, hi=300)
    dark = np.clip((blot - 0.58) * 4.5, 0, 1) * stone
    lightp = np.clip((fnoise(N, 1.25, lo=8, hi=200) - 0.64) * 4, 0, 1) * stone
    alb = alb * (1 - 0.45 * dark[..., None]) + np.array([0.27, 0.25, 0.22]) * 0.27 * dark[..., None]
    alb = alb * (1 - 0.35 * lightp[..., None]) + np.array([0.80, 0.79, 0.76]) * 0.35 * lightp[..., None]
    ochre = np.clip((fnoise(N, 1.1, lo=10, hi=120) - 0.66) * 4, 0, 1) * stone
    alb = alb * (1 - 0.3 * ochre[..., None]) + np.array([0.78, 0.52, 0.28]) * 0.3 * ochre[..., None]
    alb *= (1 - 0.35 * pits - 0.3 * vugs)[..., None]
    chipzone = np.clip(1 - inner / (14 * mm), 0, 1) * stone
    alb *= (1 - 0.12 * chipzone)[..., None]
    # derz: pembemsi kireç harcı (derinde koyu), kama taşı gri
    mcol = np.array([0.80, 0.72, 0.68]) * (0.75 + 0.3 * fnoise(N, 0.5, lo=300))[..., None]
    deep = np.clip((0.12 - mort) * 8, 0, 1)
    mcol = mcol * (1 - 0.3 * deep[..., None])
    scol = np.array([0.52, 0.53, 0.53]) * (0.85 + 0.25 * fnoise(N, 1.0, lo=50))[..., None]
    gcol = mcol * (1 - shim[..., None]) + scol * shim[..., None]
    alb = alb * stone[..., None] + gcol * (1 - stone)[..., None]
    ao = ao_from_height(h, [3, 10, 28])
    rough = stone * (0.86 + 0.1 * fnoise(N, 0.8, lo=100)) + (1 - stone) * 0.97
    save(alb, h, rough, ao, 30.0,
         'duvar: sararmış Antep kalkeri, pürüzlü yüz, derin derz, kama taşları; doku kenarı %.2f m (%d px, %.2f mm/px)\n'
         'sıra yükseklikleri (cm): %s\ntaş boyu 25–90 cm, derz 8–40 mm (kırık kenarlı)\nalt kısım nemi doku içinde değil: gölgelendiricide dünya yüksekliğine göre verilmeli\n'
         'tile_metres=%.2f\n' % (M, N, M / N * 1000, ', '.join('%.0f' % (x * 100) for x in hs), M))


# ------------------------------------------------------------------ KALDIRIM (örnek: gevşek sıralı köşeli taşlar, ince toprak aralık, ot)
def kaldirim():
    M = 2.4
    ppm = N / M
    mm = ppm / 1000
    lab, ns, hs, _ = rows_layout(M, ppm, 0.13, 0.24, 0.14, 0.30)
    lab = warp_labels(lab, 30 * mm, 10)      # bozuk sıra hizaları
    lab = warp_labels(lab, 8 * mm, 40)
    dt = edge_dist(lab)
    gapw = rng.uniform(3, 9, ns)[lab] * mm
    rim = gapw + (fnoise(N, 1.2, lo=8, hi=200) - 0.4) * 10 * mm
    stone = (dt > rim).astype(np.uint8)
    k = int(14 * mm) | 1
    stone = center(cv2.morphologyEx(tile3(stone), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))))
    inner = center(cv2.distanceTransform(tile3(stone), cv2.DIST_L2, 5))
    stone = stone.astype(np.float32)
    prof = 1 - np.exp(-inner / (rng.uniform(8, 20, ns)[lab] * mm))
    tilt = (fnoise(N, 1.0, hi=30) - 0.5) * 0.12
    surf = fnoise(N, 1.4, hi=300) * 0.14
    lift = rng.uniform(-0.1, 0.08, ns)[lab]
    soil = 0.08 + fnoise(N, 1.2, lo=30) * 0.12
    h = stone * (0.6 + lift + tilt + prof * 0.22 + surf) + (1 - stone) * soil
    h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), 0.8)
    h = (h - h.min()) / (h.max() - h.min())
    pal = np.array([[0.62, 0.62, 0.60], [0.56, 0.56, 0.55], [0.68, 0.66, 0.62], [0.60, 0.57, 0.52], [0.50, 0.50, 0.50]])
    base = pal[rng.choice(5, ns, p=[0.3, 0.25, 0.18, 0.15, 0.12])] * rng.uniform(0.9, 1.07, (ns, 1))
    det_c, _ = photo_detail('cobble', 2.0, ppm)
    det_r, _ = photo_detail('rock', 3.0, ppm)
    alb = base[lab].astype(np.float32) * (0.2 + 0.8 * per_stone_detail(lab, ns, [det_c, det_r]))[..., None]
    brown = np.clip((fnoise(N, 1.2, lo=10, hi=150) - 0.6) * 4, 0, 1) * stone
    alb = alb * (1 - 0.4 * brown[..., None]) + np.array([0.48, 0.40, 0.30]) * 0.4 * brown[..., None]
    spot = np.clip((fnoise(N, 1.4, lo=15, hi=100) - 0.8) * 6, 0, 1) * stone
    alb *= (1 - 0.5 * spot)[..., None]
    _, dirt_rgb = photo_detail('dirt', 1.3, ppm)
    srgb = sample_wrap(dirt_rgb[..., ::-1], 0, 0, N, N).astype(np.float32) * 0.6
    edge_dirt = np.clip(1 - inner / (10 * mm), 0, 1) * stone
    alb = alb * (1 - 0.45 * edge_dirt[..., None]) + np.array([0.33, 0.28, 0.22]) * 0.45 * edge_dirt[..., None]
    weed = np.clip((fnoise(N, 1.0, lo=40, hi=300) - 0.83) * 8, 0, 1)
    weed *= cv2.dilate((1 - stone).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(18 * mm) | 1,) * 2)).astype(np.float32)
    gap = 1 - stone
    alb = alb * stone[..., None] + srgb * gap[..., None]
    wcol = np.array([0.24, 0.36, 0.14]) * (0.7 + 0.6 * fnoise(N, 0.6, lo=300))[..., None]
    alb = alb * (1 - weed[..., None]) + wcol * weed[..., None]
    h = np.maximum(h, weed * 0.7 * (0.6 + 0.4 * fnoise(N, 0.6, lo=300)))
    ao = ao_from_height(h, [3, 9, 22])
    wornT = np.clip((prof - 0.9) * 10, 0, 1) * stone
    rough = stone * (0.84 - 0.18 * wornT + 0.08 * fnoise(N, 0.8, lo=80)) + gap * 0.97
    rough = np.clip(rough * (1 - weed) + weed * 0.9, 0, 1)
    save(alb, h, rough, ao, 28.0,
         'kaldırım: gevşek sıralı köşeli kalker taşlar, doku kenarı %.2f m (%d px, %.2f mm/px)\nsıra genişlikleri (cm): %s\ntaş boyu 14–30 cm, aralık 6–18 mm toprak, seyrek ot\n'
         'tile_metres=%.2f\n' % (M, N, M / N * 1000, ', '.join('%.0f' % (x * 100) for x in hs), M))


# ------------------------------------------------------------------ KESME (Antep evi kesme kalker duvarı: iri blok, ince derz)
def kesme():
    M = 3.0
    ppm = N / M
    mm = ppm / 1000
    lab, ns, hs, _ = rows_layout(M, ppm, 0.30, 0.55, 0.45, 1.20)
    lab = warp_labels(lab, 4 * mm, 16)
    dt = edge_dist(lab)
    # ince derz (yarı 1.5–4 mm) + hafif kırık kenar
    jw = rng.uniform(1.5, 4, ns)[lab] * mm
    edgen = fnoise(N, 1.3, lo=6, hi=300)
    chipm = np.clip((edgen - 0.6) * 3, 0, 1)
    rim = jw + chipm * 14 * mm
    inner = np.clip(dt - rim, 0, None)
    stone = (dt > rim).astype(np.float32)
    # yüz: kaba yonu (iri dalga + ince pürüz + oyuk), kenarda pah
    bevel = rng.uniform(4, 12, ns)[lab] * mm
    prof = 1 - np.exp(-inner / bevel)
    face = fnoise(N, 1.5, hi=400) * 0.22 + fnoise(N, 1.0, lo=60, hi=500) * 0.06
    pits = np.clip((fnoise(N, 0.4, lo=300, hi=1000) - 0.75) * 6, 0, 1)
    vugs = np.clip((fnoise(N, 1.2, lo=20, hi=160) - 0.82) * 5, 0, 1)
    lift = rng.uniform(-0.04, 0.04, ns)[lab]
    h = stone * (0.62 + lift + prof * 0.18 + face - pits * 0.08 - vugs * 0.1) + (1 - stone) * (0.32 + fnoise(N, 0.6, lo=200) * 0.06)
    h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), 0.7)
    h = (h - h.min()) / (h.max() - h.min())
    # renk: sararmış kalker, dar aralıkta taş taş fark (değer ±6%, ton hafif)
    basec = np.array([0.80, 0.70, 0.53])
    hue = rng.normal(0, 1, (ns, 1)) * np.array([[0.025, 0.02, 0.03]])
    val = rng.uniform(0.9, 1.06, (ns, 1))
    gray = rng.random((ns, 1)) < 0.12        # birkaç taş daha gri (farklı ocak)
    base = basec * val + hue
    base = np.where(gray, base * 0.6 + np.array([0.70, 0.68, 0.63]) * 0.4, base)
    alb = base[lab].astype(np.float32)
    det_r, _ = photo_detail('rock', 3.0, ppm)
    det_f, _ = photo_detail('flat', 2.0, ppm)
    alb *= (0.25 + 0.75 * per_stone_detail(lab, ns, [det_r, det_f]))[..., None]
    # yıpranma: iri lekeler, seyrek koyu liken, kırık ve oyuk içleri koyu
    alb *= (0.9 + 0.16 * fnoise(N, 1.4, hi=40))[..., None]
    lich = np.clip((fnoise(N, 1.3, lo=10, hi=250) - 0.7) * 4, 0, 1) * stone
    alb = alb * (1 - 0.35 * lich[..., None]) + np.array([0.30, 0.28, 0.24]) * 0.35 * lich[..., None] * 0.8
    alb *= (1 - 0.3 * pits - 0.3 * vugs - 0.18 * chipm * (1 - stone))[..., None]
    # derz: açık kireç harcı, yer yer koyu
    mcol = np.array([0.82, 0.77, 0.68]) * (0.78 + 0.25 * fnoise(N, 0.6, lo=200))[..., None]
    alb = alb * stone[..., None] + mcol * (1 - stone)[..., None]
    ao = ao_from_height(h, [2, 6, 18])
    rough = stone * (0.84 + 0.1 * fnoise(N, 0.8, lo=100)) + (1 - stone) * 0.95
    save(alb, h, rough, ao, 26.0,
         'kesme: Antep evi kesme kalker duvarı, doku kenarı %.2f m (%d px, %.2f mm/px)\nsıra yükseklikleri (cm): %s\ntaş boyu 45–120 cm, derz 3–8 mm açık kireç harcı\n'
         'tile_metres=%.2f\n' % (M, N, M / N * 1000, ', '.join('%.0f' % (x * 100) for x in hs), M))


{'duvar': duvar, 'kaldirim': kaldirim, 'kesme': kesme}[kind]()
print('URETILDI', kind, out)
