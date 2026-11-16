import { stokDurumu } from "./akis";
import { gunFarki } from "./tarih";
import type { Durum, NextDayPlan, Paket } from "./veri";

/*
 * Stok paketinin beş aşaması (kullanıcı: stok sorumlusu kararlaştırılan
 * paketleri muhabirlere süreyle görevlendiriyor, hazırlananları bir listede
 * tutup yayınlanmasını takip ediyor). Saklanmaz, kayıttan okunur;
 * akis.ts → stokDurumu'nun "bekliyor" ve "üretimde"si burada ikiye ayrılıyor:
 * görevi verilmemiş / muhabirde (görev verildi, teslim bekleniyor) / üretim
 * yolunda (balonla üretime alınmış).
 */
export const STOK_ASAMALARI = ["gorevlendirilecek", "muhabirde", "uretimde", "hazir", "yayinlandi"] as const;
export type StokAsamasi = (typeof STOK_ASAMALARI)[number];

export const stokAsamasi = (p: Paket): StokAsamasi | null => {
  const s = stokDurumu(p);
  if (!s) return null;
  if (s === "yayinlandi") return "yayinlandi";
  if (s === "stokta") return "hazir";
  if (p.durum === "uretimde") return "uretimde";
  // Özel yayının paketi kendi görevlendirmesiyle ilerliyor; plansız görev ve stok görevi muhabirde.
  return p.gorev || p.ozelId ? "muhabirde" : "gorevlendirilecek";
};

/*
 * Hazır paket bayatlar (kullanıcı: hazırlananların listesi takip ediliyor):
 * bittiği günden bu yana geçen gün. Bitiş anı muhabirin teslimi, yoksa son
 * değişiklik; günü geçen haber paketi yayına çıkmadan eskiyor.
 */
export const STOK_BAYAT_GUN = 21;
export const hazirYasi = (p: Paket, bugun: string): number => gunFarki((p.muhabirTeslimi ?? p.guncelleme).slice(0, 10), bugun);
export const bayatMi = (p: Paket, bugun: string) => stokAsamasi(p) === "hazir" && hazirYasi(p, bugun) >= STOK_BAYAT_GUN;

/** Muhabirdeki görevin son günü geçti. */
export const gorevGecikti = (p: Paket, bugun: string) => stokAsamasi(p) === "muhabirde" && !!p.sonTarih && p.sonTarih < bugun;

/** Hazır paket hangi açık Next Day planının hazır paketlerinde (yayına önerilmiş). */
export const onerildigiPlanlar = (d: Pick<Durum, "planlar">, p: Paket): NextDayPlan[] =>
  d.planlar.filter((x) => x.durum !== "devralindi" && x.hazirPaketler.includes(p.id));

/** Aşamanın listesi, aşamaya göre sıralı: görevde son günü yakın önce, hazırda en eski önce (bayatlayan), yayında en yeni önce. */
export const asamaPaketleri = (d: Pick<Durum, "paketler">, a: StokAsamasi): Paket[] => {
  const l = d.paketler.filter((p) => stokAsamasi(p) === a);
  if (a === "muhabirde") return l.sort((x, y) => (x.sonTarih ?? "9").localeCompare(y.sonTarih ?? "9"));
  if (a === "hazir") return l.sort((x, y) => (x.muhabirTeslimi ?? x.guncelleme).localeCompare(y.muhabirTeslimi ?? y.guncelleme));
  if (a === "yayinlandi") return l.sort((x, y) => (y.yayinlandi?.tarih ?? "").localeCompare(x.yayinlandi?.tarih ?? ""));
  return l.sort((x, y) => y.guncelleme.localeCompare(x.guncelleme));
};
