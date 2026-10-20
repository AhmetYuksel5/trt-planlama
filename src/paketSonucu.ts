import type { Paket } from "./veri";

/*
 * Paketin sonucu (saf, saklanmıyor): onay bekleyen işaret, yapıldı
 * (tamamlandı), yapılmadı (sebebiyle onaylı), toplantıda reddedildi.
 * Paketler sayfasının sonuç sekmeleri ve muhabirin işleri buradan okur.
 */
export const PAKET_SONUCLARI = ["onayBekliyor", "yapildi", "yapilmadi", "reddedildi"] as const;
export type PaketSonucu = (typeof PAKET_SONUCLARI)[number];

export const paketSonucu = (p: Paket): PaketSonucu | undefined => {
  if (p.isaret) return "onayBekliyor";
  if (p.durum === "tamamlandi") return "yapildi";
  if (p.durum === "iptal" && p.yapilmadi) return "yapilmadi";
  if (p.durum === "iptal" && p.reddedildi) return "reddedildi";
  return undefined;
};
