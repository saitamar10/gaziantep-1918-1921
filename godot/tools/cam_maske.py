"""Tarama dokularında cam ardı yaprak ve gök maskesi.  python -I cam_maske.py <giris.jpg> <maske.png> [onizleme.png]"""
import sys, cv2, numpy as np
a = cv2.imread(sys.argv[1])
h = cv2.cvtColor(a, cv2.COLOR_BGR2HSV)
H, S, V = h[..., 0].astype(np.float32) * 2, h[..., 1].astype(np.float32), h[..., 2].astype(np.float32)
g = V / 255.0
mu = cv2.blur(g, (9, 9)); sd = np.sqrt(np.maximum(cv2.blur(g * g, (9, 9)) - mu * mu, 0))
leaf = (H >= 50) & (H <= 115) & (S > 62) & (sd > 0.085)
sky = (V > 212) & (S < 38) & (sd < 0.045)
m = (leaf | sky).astype(np.uint8) * 255
# küçük benekleri at, cam bölgelerini doldur
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
keep = np.zeros_like(m)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 900:
        keep[lab == i] = 255
cv2.imwrite(sys.argv[2], keep)
if len(sys.argv) > 3:
    v = a.copy(); v[keep > 0] = (v[keep > 0] * 0.3 + np.array([255, 0, 255]) * 0.7).astype(np.uint8)
    cv2.imwrite(sys.argv[3], cv2.resize(np.hstack([a, v]), (1600, 800)))
print('MASKE %.1f%%' % (keep.mean() / 2.55))
