import type { Anahtar } from "./dil";
import { bugun } from "./tarih";
import type { Durum, Gorevlendirme, OzelYayin, Paket } from "./veri";

/**
 * Özel yayının okuma kuralları: hangi kalem bitti, hangisi bekliyor,
 * hangisi gecikti. Saklanmıyor; ekran, yönetici paneli ve ana sayfa aynı
 * sayıyı kayıttan hesaplıyor. İptal edilen kalem ne yapılan ne yapılacak.
 */

export type OzelKalemTuru = "nafize" | "paket" | "talep" | "gorev" | "hazirlik";
export const OZEL_KALEM_TURLERI: OzelKalemTuru[] = ["nafize", "paket", "talep", "gorev", "hazirlik"];

export interface OzelKalemi {
  tur: OzelKalemTuru;
  id: string;
  /** İçerik (Arapça): nafizenin konusu, paketin başlığı, talebin metni… */
  ad: string;
  sonTarih?: string;
  bitti: boolean;
  /** İşi yapan kişi (muhabir, hazırlayan, görevli). */
  kisiId?: string;
}

export const ozelPaketleri = (d: Pick<Durum, "paketler">, id: string): Paket[] => d.paketler.filter((p) => p.ozelId === id && p.durum !== "iptal");
export const ozelGorevlendirmeleri = (d: Pick<Durum, "gorevlendirmeler">, id: string): Gorevlendirme[] => d.gorevlendirmeler.filter((g) => g.ozelId === id);

/*
 * Paketin aşamaları: plan (onay bekliyor) → onaylı (görev verilecek) →
 * görevlendirildi (muhabir ya da hazırlayan, son tarihli) → hazırlanıyor →
 * hazır. Saklanmıyor; paketin durumundan, işi yapandan ve başlama işaretinden.
 */
export const OZEL_PAKET_ASAMALARI = ["plan", "onayli", "gorevli", "hazirlaniyor", "hazir"] as const;
export type OzelPaketAsamasi = (typeof OZEL_PAKET_ASAMALARI)[number];
export const ozelPaketAsamasi = (p: Paket): OzelPaketAsamasi =>
  p.durum === "tamamlandi" ? "hazir" : p.durum === "taslak" ? "plan" : !(p.muhabirId ?? p.hazirlayanId) ? "onayli" : p.ozelBasladi ? "hazirlaniyor" : "gorevli";

/** Görevlendirmenin genel aşaması: News Gathering onaylayana dek planlama, sonra hazır. */
export const gorevHazir = (g: Gorevlendirme) => g.durum !== "talep";

export const ozelKalemleri = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler">): OzelKalemi[] => [
  ...(o.nafizeler ?? []).filter((n) => n.durum !== "iptal").map((n) => ({ tur: "nafize" as const, id: n.id, ad: n.konu, sonTarih: n.tarih, bitti: n.durum === "hazir" || n.durum === "yapildi", kisiId: n.muhabirId })),
  ...ozelPaketleri(d, o.id).map((p) => ({ tur: "paket" as const, id: p.id, ad: p.baslik, sonTarih: p.sonTarih, bitti: p.durum === "tamamlandi", kisiId: p.muhabirId ?? p.hazirlayanId })),
  ...(o.talepler ?? []).filter((x) => x.durum !== "iptal").map((x) => ({ tur: "talep" as const, id: x.id, ad: x.metin, sonTarih: x.sonTarih, bitti: x.durum === "tamam" })),
  // Dış görevlendirme News Gathering'in onayından geçince hazır: iş artık sahada.
  ...ozelGorevlendirmeleri(d, o.id).map((g) => ({ tur: "gorev" as const, id: g.id, ad: g.yer, sonTarih: g.baslangic, bitti: gorevHazir(g), kisiId: g.kisiId })),
  ...o.hazirlik.map((h) => ({ tur: "hazirlik" as const, id: h.id, ad: h.metin, bitti: h.tamam })),
];

export const gecikti = (k: OzelKalemi, gun = bugun()) => !k.bitti && !!k.sonTarih && k.sonTarih < gun;

export interface OzelOzeti {
  toplam: number;
  biten: number;
  geciken: number;
  tur: Record<OzelKalemTuru, { toplam: number; biten: number }>;
}

export const ozelOzeti = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler">): OzelOzeti => {
  const kalemler = ozelKalemleri(o, d);
  const tur = Object.fromEntries(OZEL_KALEM_TURLERI.map((t) => [t, { toplam: 0, biten: 0 }])) as OzelOzeti["tur"];
  for (const k of kalemler) {
    tur[k.tur].toplam++;
    if (k.bitti) tur[k.tur].biten++;
  }
  return { toplam: kalemler.length, biten: kalemler.filter((k) => k.bitti).length, geciken: kalemler.filter((k) => gecikti(k)).length, tur };
};

/** Yapılacaklar: son tarihi yakın olan önde, tarihsiz en sonda. */
export const yapilacaklar = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler">): OzelKalemi[] =>
  ozelKalemleri(o, d)
    .filter((k) => !k.bitti)
    .sort((a, b) => (a.sonTarih ?? "9999").localeCompare(b.sonTarih ?? "9999"));

/*
 * Planın aşaması: planlama → onay → uygulama → hazır. Onaydan sonra
 * rezervasyon, görev, konuk işleri sürüyor; hepsi hazır olunca (yerler
 * hazır, paketler teslim, talepler bitti) plan uygulamaya hazır.
 */
export const OZEL_ASAMALARI = ["planlama", "onay", "uygulama", "hazir"] as const;
export type OzelAsama = (typeof OZEL_ASAMALARI)[number];
export const OZEL_ASAMA_ADI: Record<OzelAsama, Anahtar> = { planlama: "oyAsamaPlanlama", onay: "oyAsamaOnay", uygulama: "oyAsamaUygulama", hazir: "oyAsamaHazir" };
export const ozelAsamasi = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler">): OzelAsama => {
  if (o.durum === "onayda") return "onay";
  if (o.durum !== "onayli") return "planlama";
  const k = ozelKalemleri(o, d);
  return k.length && k.every((x) => x.bitti) ? "hazir" : "uygulama";
};

/** Yayın bitti mi: son günü geçmiş özel yayın listede arşive iniyor. */
export const ozelGecti = (o: OzelYayin, gun = bugun()) => (o.bitis ?? o.tarih) < gun;
