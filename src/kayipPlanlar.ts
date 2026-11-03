import type { Durum } from "./veri";

/*
 * Kaydı kaybolmuş Next Day planı: plan belgesi yok (silindi), ama ona bağlı
 * gelişme, canlı ya da paket ayrı belgelerde duruyor. Sistem böyle bir günün
 * planını yeniden açmıyor (yarinPlaniniAc izi görüp duruyor: dolu planı
 * şablonla ezmesin), bu yüzden o günün planı hiç görünmüyordu. Gün,
 * sistemin verdiği kimlikten (nd-<tarih>) ya da açılış hareketinden.
 */
export interface KayipPlan {
  id: string;
  tarih: string;
  sayi: number;
}

export const kayipPlanlar = (d: Durum): KayipPlan[] => {
  const var_ = new Set(d.planlar.map((p) => p.id));
  const sayi = new Map<string, number>();
  for (const x of [...d.gelismeler, ...d.canliYayinlar, ...d.paketler]) {
    const id = x.planId;
    if (id && !var_.has(id)) sayi.set(id, (sayi.get(id) ?? 0) + 1);
  }
  const sonuc: KayipPlan[] = [];
  for (const [id, n] of sayi) {
    const t = /^nd-(\d{4}-\d{2}-\d{2})$/.exec(id)?.[1] ?? d.hareketler.find((h) => h.planId === id && typeof h.veri?.tarih === "string")?.veri?.tarih;
    // Aynı güne başka plan açılmışsa o günün planı görünüyor; kayıtlar "Başlığı kaybolmuş"tan değil buradan dönmez.
    if (t && !d.planlar.some((p) => p.tarih === t)) sonuc.push({ id, tarih: t, sayi: n });
  }
  return sonuc.sort((a, b) => b.tarih.localeCompare(a.tarih));
};
