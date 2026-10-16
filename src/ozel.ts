import { gunAy, type Anahtar } from "./dil";
import { bugun } from "./tarih";
import { OZEL_SIRASI, type Durum, type Gorevlendirme, type Nafize, type OzelDurum, type OzelIz, type OzelPaketOnerisi, type OzelYayin, type Paket } from "./veri";

/**
 * Özel yayının okuma kuralları: aşamaların sırası, hangi kalem bitti,
 * hangisi bekliyor, hangisi gecikti. Saklanmıyor; ekran, yönetici paneli ve
 * ana sayfa aynı sayıyı kayıttan hesaplıyor. İptal edilen kalem ne yapılan
 * ne yapılacak.
 */

/*
 * Kontrol listesi: aşamalar sırayla işaretleniyor, durum son işaretlenen.
 * Yalnız sıradaki işaretlenir, yalnız sonuncu geri alınır: atlanan aşama
 * kimin yaptığını göstermezdi.
 */
export const isaretli = <T extends string>(sira: readonly T[], simdi: T, adim: T) => sira.indexOf(simdi) >= sira.indexOf(adim);
export const siradaki = <T extends string>(sira: readonly T[], simdi: T): T | undefined => sira[sira.indexOf(simdi) + 1];
/** İşaret kaldırılınca dönülen durum; yalnız son işaretlenen kaldırılabiliyor. */
export const oncesi = <T extends string>(sira: readonly T[], simdi: T, adim: T): T | undefined => (simdi === adim && sira.indexOf(adim) > 0 ? sira[sira.indexOf(adim) - 1] : undefined);
/** Aşamayı kim, ne zaman işaretledi: izdeki son "durum" kaydı. */
export const isaretIzi = (iz: OzelIz[] | undefined, adim: string) => [...(iz ?? [])].reverse().find((x) => x.olay === "durum" && x.durum === adim);
export const asamaNotlari = (iz: OzelIz[] | undefined, adim: string) => (iz ?? []).filter((x) => x.olay === "not" && x.asama === adim);

export type OzelKalemTuru = "nafize" | "paket" | "talep" | "gorev" | "hazirlik";
export const OZEL_KALEM_TURLERI: OzelKalemTuru[] = ["nafize", "paket", "talep", "gorev", "hazirlik"];

export interface OzelKalemi {
  tur: OzelKalemTuru;
  id: string;
  /** İçerik (Arapça): nafizenin başlığı, paketin başlığı, talebin metni… */
  ad: string;
  sonTarih?: string;
  bitti: boolean;
  /** İşi yapan kişi (muhabir, hazırlayan, görevli). */
  kisiId?: string;
}

/** Nafizenin başlığı kurumun yazımıyla, her arayüz dilinde Arapça: "25 أكتوبر - تل أبيب - 10G". */
export const nafizeBasligi = (n: Pick<Nafize, "tarih" | "yer" | "saat">) => {
  const saat = n.saat ? `${n.saat.endsWith(":00") ? String(Number(n.saat.slice(0, 2))) : n.saat}G` : "";
  return [gunAy(n.tarih, "ar"), n.yer, saat].filter(Boolean).join(" - ");
};

/*
 * Paketin aşamaları: önerildi (plan) → onaylandı → görevlendirildi
 * (muhabir ya da hazırlayan) → hazırlanıyor → hazır. Saklanmıyor; önerinin
 * durumundan ve paketin kendisinden.
 */
export const OZEL_PAKET_ASAMALARI = ["plan", "onayli", "gorevli", "hazirlaniyor", "hazir"] as const;
export type OzelPaketAsamasi = (typeof OZEL_PAKET_ASAMALARI)[number];
export const ozelPaketAsamasi = (p: Paket): OzelPaketAsamasi =>
  p.durum === "tamamlandi" ? "hazir" : p.durum === "taslak" ? "plan" : !(p.muhabirId ?? p.hazirlayanId) ? "onayli" : p.ozelBasladi ? "hazirlaniyor" : "gorevli";

/*
 * Özel yayının paket satırları: öneriler (onaylanınca paketiyle) ve
 * önerisiz paketler (öneri kaydından önce doğrudan açılmış olanlar).
 */
export interface OzelPaketSatiri {
  oneri?: OzelPaketOnerisi;
  paket?: Paket;
  id: string;
  baslik: string;
  kaynak: "inhouse" | "dis";
  muhabirId?: string;
  sonTarih?: string;
  asama: OzelPaketAsamasi;
  iz: OzelIz[];
}
export const ozelPaketSatirlari = (o: OzelYayin, d: Pick<Durum, "paketler">): OzelPaketSatiri[] => {
  const paketler = d.paketler.filter((p) => p.ozelId === o.id && p.durum !== "iptal");
  const oneriler = (o.paketOnerileri ?? []).map((x): OzelPaketSatiri => {
    const p = paketler.find((y) => y.id === x.paketId);
    return { oneri: x, paket: p, id: x.id, baslik: p?.baslik ?? x.baslik, kaynak: x.kaynak, muhabirId: p?.muhabirId ?? x.muhabirId, sonTarih: p?.sonTarih ?? x.sonTarih, asama: p ? ozelPaketAsamasi(p) : x.durum === "oneri" ? "plan" : "onayli", iz: x.iz };
  });
  const bagli = new Set((o.paketOnerileri ?? []).map((x) => x.paketId));
  const yalniz = paketler.filter((p) => !bagli.has(p.id)).map((p): OzelPaketSatiri => ({ paket: p, id: p.id, baslik: p.baslik, kaynak: p.ozelKaynak ?? "dis", muhabirId: p.muhabirId, sonTarih: p.sonTarih, asama: ozelPaketAsamasi(p), iz: [] }));
  return [...oneriler, ...yalniz];
};

export const ozelPaketleri = (d: Pick<Durum, "paketler">, id: string): Paket[] => d.paketler.filter((p) => p.ozelId === id && p.durum !== "iptal");
export const ozelGorevlendirmeleri = (d: Pick<Durum, "gorevlendirmeler">, id: string): Gorevlendirme[] => d.gorevlendirmeler.filter((g) => g.ozelId === id);

/** Görevlendirmenin genel aşaması: News Gathering onaylayana dek planlama, sonra hazır. */
export const gorevHazir = (g: Gorevlendirme) => g.durum !== "talep";

export const ozelKalemleri = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler">): OzelKalemi[] => [
  ...(o.nafizeler ?? []).filter((n) => n.durum !== "iptal").map((n) => ({ tur: "nafize" as const, id: n.id, ad: nafizeBasligi(n), sonTarih: n.tarih, bitti: n.durum === "hazir" || n.durum === "yapildi", kisiId: n.muhabirId })),
  ...ozelPaketSatirlari(o, d).map((p) => ({ tur: "paket" as const, id: p.id, ad: p.baslik, sonTarih: p.sonTarih, bitti: p.asama === "hazir", kisiId: p.muhabirId ?? p.paket?.hazirlayanId })),
  ...(o.talepler ?? []).filter((x) => x.durum !== "iptal").map((x) => ({ tur: "talep" as const, id: x.id, ad: x.metin, sonTarih: x.sonTarih, bitti: x.durum === "tamam" })),
  // Dış görevlendirme News Gathering'in onayından geçince hazır: iş artık sahada.
  ...ozelGorevlendirmeleri(d, o.id).map((g) => ({ tur: "gorev" as const, id: g.id, ad: g.yer, sonTarih: g.baslangic, bitti: gorevHazir(g), kisiId: g.kisiId })),
  ...o.hazirlik.map((h) => ({ tur: "hazirlik" as const, id: h.id, ad: h.metin, bitti: h.tamam })),
];

export const gecikti = (k: { bitti: boolean; sonTarih?: string }, gun = bugun()) => !k.bitti && !!k.sonTarih && k.sonTarih < gun;

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
 * Planın aşaması: işaretlenecek sıradaki adım, hepsi işaretliyse yayına
 * hazır. Saklanan durumdan (son işaretlenen) okunuyor.
 */
export const OZEL_ASAMALARI = ["planlama", "onay", "uygulama", "hazir"] as const;
export type OzelAsama = (typeof OZEL_ASAMALARI)[number];
export const OZEL_ASAMA_ADI: Record<OzelAsama | "tamam", Anahtar> = { planlama: "oyAsamaPlanlama", onay: "oyOnayBekliyor", uygulama: "oyAsamaUygulama", hazir: "oyAsamaHazir", tamam: "oyAsamaTamam" };
/** Kontrol listesinde her aşamanın tamamlandığı durum. */
export const OZEL_ASAMA_DURUMU: Record<OzelAsama, Exclude<OzelDurum, "hazirlik">> = { planlama: "onayda", onay: "onayli", uygulama: "uygulandi", hazir: "hazir" };
export const ozelDurum = (o: OzelYayin): OzelDurum => o.durum ?? "hazirlik";
export const ozelAsamasi = (o: OzelYayin): OzelAsama | "tamam" => {
  const s = OZEL_SIRASI.indexOf(ozelDurum(o));
  return s >= OZEL_SIRASI.length - 1 ? "tamam" : OZEL_ASAMALARI[s];
};
/** Plan onaylandı mı (onay ve sonrası). */
export const ozelOnayli = (o: OzelYayin) => isaretli(OZEL_SIRASI, ozelDurum(o), "onayli");

/** Yayın bitti mi: son günü geçmiş özel yayın listede arşive iniyor. */
export const ozelGecti = (o: OzelYayin, gun = bugun()) => (o.bitis ?? o.tarih) < gun;
