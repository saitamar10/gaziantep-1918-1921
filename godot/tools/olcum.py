"""Kalite kontrol ölçümü: sabit kamera konumlarından ekran görüntüsü alır ve hız/yük değerlerini kaydeder.
   python godot/tools/olcum.py <etiket> [kalite]      ör.  python godot/tools/olcum.py asama1 dusuk
Çıktı: godot/olcum/<etiket>/<bölge>.png  ve  godot/olcum/olcum.csv (her çalıştırma satır ekler).
Her bölge aynı konumdan çekildiği için aşamalar yan yana karşılaştırılabilir."""
import csv, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GODOT = os.path.expandvars(r'%LOCALAPPDATA%\Microsoft\WinGet\Packages\GodotEngine.GodotEngine_Microsoft.Winget.Source_8wekyb3d8bbwe\Godot_v4.7.2-stable_win64_console.exe')
# bölge -> oyun argümanları (konumlar: x,z,bakış açısı)
TESTS = [
    ('01_kale_onu', ['--at', '-132,121,-0.83']),
    ('02_kale_girisi', ['--at', '40,112,0.84']),
    ('03_kale_cevresi', ['--at', '150,-40,1.83']),
    ('04_tarihi_carsi', []),
    ('05_dar_mahalle_sokagi', ['--at', '-149.3,482.3,1.53']),   # yol ağı düğümünden, sokak boyunca bakış
    ('06_antep_evi_avlusu', ['--at', '26.9,262.7,2.2']),
    ('08_cami_cevresi', ['--at', '140,360,0.59']),
    ('09_kirsal_yol', ['--at', '-1798,-374,-1.57']),
    ('10_kalabalik_meydan', ['--chapter', 'c', '--step', '3', '--pos', '164,375,0.55']),
]
# Kritik düzeltme yönergesinin sekiz sahnesi:  python godot/tools/olcum.py <etiket> <kalite> sahne
SCENES = [
    ('s1_1918_hareketli_carsi', ['--chapter', 'a', '--step', '3']),
    ('s2_1919_ingiliz_isgali', ['--chapter', 'a', '--step', '13', '--pos', '60.6,315.7,0.19']),
    ('s3_1919_fransiz_kontrol_noktasi', ['--chapter', 'b', '--step', '3', '--pos', '60.6,315.7,0.19']),
    ('s4_1920_catisma_mahallesi', ['--chapter', 'b7', '--step', '7']),
    ('s5_saglik_yeri_yarali_tedavi', ['--chapter', 'b3', '--step', '4', '--pos', '30,267,0.62']),
    ('s6_1920_bombardiman_altinda_sokak', ['--chapter', 'b2', '--step', '24']),
    ('s7_ocak_1921_aclik', ['--chapter', 'b10', '--step', '5']),
    ('s8_subat_1921_teslim_sonrasi', ['--chapter', 'ep', '--step', '4']),
]
# 07 büyük konak: haritada ayrı bir konak yapısı henüz yok (Aşama 3'te eklenecek)

def main():
    label = sys.argv[1] if len(sys.argv) > 1 else 'olcum'
    quality = sys.argv[2] if len(sys.argv) > 2 else 'dusuk'
    out = os.path.join(ROOT, 'olcum', label)
    os.makedirs(out, exist_ok=True)
    rows = []
    tests = SCENES if (len(sys.argv) > 3 and sys.argv[3] == 'sahne') else TESTS
    for name, args in tests:
        png = os.path.join(out, name + '.png').replace('\\', '/')
        r = subprocess.run([GODOT, '--path', ROOT, '--resolution', '1280x720', '--', '--bench', png, '--quality', quality] + args, capture_output=True, text=True, encoding='utf-8', errors='replace')
        txt = r.stdout + r.stderr
        m = re.search(r'BENCH (.*)', txt)
        d = dict(kv.split('=', 1) for kv in m.group(1).split()) if m else {}
        errs = len(re.findall(r'SCRIPT ERROR', txt))
        rows.append([time.strftime('%Y-%m-%d %H:%M'), label, quality, name, d.get('ortalama_fps', ''), d.get('en_dusuk_fps', ''), d.get('cizim_cagrisi', ''), d.get('ucgen', ''), d.get('bellek_mb', ''), d.get('doku_mb', ''), d.get('yukleme_sn', ''), errs])
        print(rows[-1][3:], flush=True)
    path = os.path.join(ROOT, 'olcum', 'olcum.csv')
    new = not os.path.exists(path)
    with open(path, 'a', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        if new:
            w.writerow(['zaman', 'etiket', 'kalite', 'bolge', 'ortalama_fps', 'en_dusuk_fps', 'cizim_cagrisi', 'ucgen', 'bellek_mb', 'doku_mb', 'yukleme_sn', 'betik_hatasi'])
        w.writerows(rows)

main()
