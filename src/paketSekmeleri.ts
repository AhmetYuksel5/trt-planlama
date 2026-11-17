import { bitmisMi, paketGunu } from "./bitmisPaket";
import { paketSonucu } from "./paketSonucu";
import { gunEkle } from "./tarih";
import type { Durum, Paket } from "./veri";

/*
 * Paketler sayfasının sekmeleri (saf; saklanmaz). Kullanıcının çizdiği akışın
 * paket yarısı: karar bekleyen, görevlendirilmiş, arşiv. Önce on sekme vardı
 * (aktif, dört sonuç, altı durum, hepsi), üç ayrı mantıktan; ana sayfanın
 * "Görevlendirilmiş" ve "Arşiv · paket" kutuları hiçbirine denk gelmiyor, en
 * yakın sayfaya ("Aktif") gidiyordu. Kutu, sekme ve sayı bu tek kuraldan.
 */
export const PAKET_SEKMELERI = ["karar", "gorevli", "arsiv"] as const;
export type PaketSekmesi = (typeof PAKET_SEKMELERI)[number];

export const paketSekmesi = (p: Paket): PaketSekmesi => {
  if (p.durum === "tamamlandi" || p.durum === "iptal") return "arsiv";
  // Görevi verilmemiş özel yayın paketi muhabirde değil, Planlama'nın işaretini bekliyor.
  if ((p.durum === "onaylandi" || p.durum === "uretimde") && !p.ozelGorevBekliyor) return "gorevli";
  return "karar";
};

/* Arşivin içindeki süzgeç: sonucuna göre. "İptal" sonucu olmayan iptal (plan iptali, başka muhabire verilen). */
export const ARSIV_SONUCLARI = ["yapildi", "yapilmadi", "reddedildi", "iptal"] as const;
export type ArsivSonucu = (typeof ARSIV_SONUCLARI)[number];

export const arsivSonucu = (p: Paket): ArsivSonucu => {
  const s = paketSonucu(p);
  return s === "yapildi" || s === "yapilmadi" || s === "reddedildi" ? s : bitmisMi(p) ? "yapildi" : "iptal";
};

/*
 * Arşiv iki grupta: son 7 gün ve daha eski. Ana sayfanın arşiv kutusu ilk grubu
 * sayar (bütün zamanların sayısı her gün büyür, bir şey söylemez), açılan
 * sekmenin ilk grubu da aynı sayıyı gösterir.
 */
export const ARSIV_PENCERESI = 7;
export const arsivdeYeni = (gun: string, b: string) => gun >= gunEkle(b, -ARSIV_PENCERESI);
export const paketArsivGunu = (d: Pick<Durum, "planlar">, p: Paket) => paketGunu(d, p);
