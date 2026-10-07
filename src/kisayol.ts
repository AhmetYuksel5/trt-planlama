import { yolSayfasi } from "./ortam";
import type { Durum, Kisi } from "./veri";
import { sayfaGorebilir } from "./yetki";

/**
 * Üst çubuktaki kısayollar: kişinin sık açtığı sayfalar, çubukta yalnız
 * ikon. Kısayolun kimliği açtığı yol ("haftalik", "nextday/yarin"); ad,
 * ikon ve renk menüden (ekranlar/ortam/Kisayollar.tsx). Kişi kendi
 * kısayollarını düzenliyor; kayıt ana sayfa düzeni gibi kişiye ait.
 */

/* Çubukta ilk altısı, hepsi ★ menüsünde; daha uzun listede aranan kısayol kayboluyor. */
export const KISAYOL_EN_COK = 10;

/* Planların beş ana başlığı ve takvim: Planlama'nın her gün açtıkları. Next Day doğrudan yarının planı. */
export const VARSAYILAN_KISAYOLLAR = ["nextday/yarin", "haftalik", "aylik", "ozel", "saha", "takvim"];

/* Muhabirin planı yok; kendi işine kısayol (önerilerim, görevlerim, takvimim, paketlerim). */
const MUHABIR_KISAYOLLARI = ["oneriler", "saha", "takvim", "paketler"];

/* Ana sayfa şeridin başında zaten; workspace kendi sekmesinde. */
const KISAYOL_OLMAZ = ["ana", "ortam"];

export const kisayolGorebilir = (ben: Kisi | undefined, kimlik: string) => {
  const sayfa = yolSayfasi(kimlik);
  return !KISAYOL_OLMAZ.includes(sayfa) && sayfaGorebilir(ben, sayfa);
};

/** Birimin varsayılanı, kişinin görebildikleriyle. */
export const varsayilanKisayollar = (ben: Kisi) => (ben.birim === "muhabir" ? MUHABIR_KISAYOLLARI : VARSAYILAN_KISAYOLLAR).filter((k) => kisayolGorebilir(ben, k));

export const kisininKisayollari = (d: Durum, ben: Kisi) => (d.kisayollar?.[ben.id] ?? varsayilanKisayollar(ben)).filter((k) => kisayolGorebilir(ben, k));
