import { acikSoru } from "./masaSorusu";
import { oneriArsivde, oneriPlanGunu, oneriYeri } from "./oneriPlanlari";
import { bugun, gunEkle } from "./tarih";
import type { Durum, Oneri } from "./veri";

/*
 * Öneriler sayfasının sekmeleri (saf; saklanmaz). Kullanıcı: sayfa karışıktı,
 * plana girmiş öneri günü geçene dek "güncel"de duruyordu, on durum çipi vardı.
 * Planlamacının sorusu "neye karar vereceğim": varsayılan sekme karar bekleyen.
 * Sırası başkasında olan (muhabire teklif, düzeltme, birimin görüşü) ve plana ya
 * da gündeme girmiş olan ayrı sekmede; plana giren öneri karar listesinden hemen
 * kalkar (önerinin durumu değil kayıt: gündemdeki öneri durumda hâlâ
 * "değerlendiriliyor"). Arşiv kuralı değişmedi (`oneriArsivde`). Takip öneri
 * sayfasında değil, muhabir takiplerinde.
 */
export const ONERI_SEKMELERI = ["karar", "baskasinda", "planda", "arsiv"] as const;
export type OneriSekmesi = (typeof ONERI_SEKMELERI)[number];

export const oneriSekmesi = (d: Durum, o: Oneri, b: string = bugun()): OneriSekmesi | null => {
  if (oneriArsivde(o, b)) return "arsiv";
  if (o.durum === "takip") return null;
  if (o.durum === "planaEklendi" || oneriYeri(d, o)) return "planda";
  if (o.durum === "teklif" || o.durum === "duzeltme" || acikSoru(d, o.id)) return "baskasinda";
  return "karar";
};

/*
 * Listenin gün grupları: önce bugünün işi. Başlamış, bitmemiş çok günlü öneri
 * bugünün; günü olmayan (eski haftalık, gün seçilmemiş) sonda.
 */
export const GUN_GRUPLARI = ["bugun", "yarin", "ileri", "gunsuz"] as const;
export type GunGrubu = (typeof GUN_GRUPLARI)[number];

export const oneriGunGrubu = (o: Oneri, b: string = bugun()): GunGrubu => {
  const g = oneriPlanGunu(o);
  if (!g) return "gunsuz";
  if (g <= b) return "bugun";
  if (g === gunEkle(b, 1)) return "yarin";
  return "ileri";
};
