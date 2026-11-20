// Göreve eşlik eden konuşmalar: görevle doğrudan ilgisi olmayan bir sakine sorulduğunda, o anki hedefe yol tarif eder.
const YON = ['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'];   // x = doğu, z = güney
export function yon(dx, dz) { const a = Math.atan2(dx, -dz); return YON[Math.round(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8]; }

/** targets: [{x, z, label}] — Story/Prolog.targets() çıktısı. a: konuşulan sakin. */
export function yolTarifi(targets, a, stepText) {
  if (!targets || !targets.length) return null; let t = targets[0], bd = 1e9; for (const k of targets) { const d = Math.hypot(k.x - a.x, k.z - a.z); if (d < bd) { bd = d; t = k; } }
  const adim = Math.max(10, Math.round(bd * 1.3 / 10) * 10), y = yon(t.x - a.x, t.z - a.z); const R = a.R ? a.R() : Math.random();
  if (bd < 8) return t.label ? `${t.label} hemen şurası, gözünün önünde.` : 'Aradığın hemen şurada, dön bak.';
  if (t.label) return [`${t.label} mi? ${y[0].toUpperCase() + y.slice(1)} tarafında, ${adim} adım kadar.`, `${t.label} için ${y} yönüne yürü; ${adim} adım ya var ya yok.`, `Şaşırma: ${t.label} ${y} yönünde kalır, ${adim} adımlık yol.`][Math.floor(R * 3)];
  return [`Aradığın kişi ${y} tarafında, ${adim} adım kadar ileride.`, `${y[0].toUpperCase() + y.slice(1)} yönüne git; ${adim} adım sonra görürsün.`, `Az önce ${y} tarafında gördüm, ${adim} adım ötede.`][Math.floor(R * 3)];
}
