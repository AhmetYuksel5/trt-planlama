import { OZEL_SIRASI, type AylikPlan, type BirimId, type Durum, type HaftalikPlan, type NextDayPlan, type OzelYayin, type Paket, type ProgramTanimi } from "./veri";
import { gunEkle, haftaBasi } from "./tarih";
import { paketinMasasi } from "./yetki";
import { masaninSorulari } from "./masaSorusu";

/*
 * Programlar'ın sayfası (kullanıcı; saf kurallar, saklanmaz). Dört kutucuk:
 * Yayın planları (her planın son onaylanan çıktısı, salt okunur), İçerikler
 * (masanın paketleri dört alanda), Öneriler (Planlama'dan gelen, bizim, arşiv),
 * Programlar (programlar, yayın günleri, bölümlere aktarılan içerik).
 */

export const PROGRAM_BOLUMLERI = ["planlar", "icerikler", "oneriler", "programlar", "arsiv"] as const;
export type ProgramBolumu = (typeof PROGRAM_BOLUMLERI)[number];

/*
 * Aynı sayfa üç masada (kullanıcı: Spor ve Ekonomi de Programlar'ın mantığıyla,
 * yalnız onlarda program tanımı yok; renkleri ayrı: program mor, spor yeşil,
 * ekonomi lacivert). Masanın adresi ve bölümleri buradan.
 */
export const MASA_BIRIMLERI = ["program", "ekonomi", "spor"] as const;
export type MasaBirimi = (typeof MASA_BIRIMLERI)[number];
export const MASA_YOLU: Record<MasaBirimi, string> = { program: "programlar", ekonomi: "ekonomi", spor: "spor" };
export const masaBolumleri = (b: MasaBirimi): ProgramBolumu[] => PROGRAM_BOLUMLERI.filter((x) => x !== "programlar" || b === "program");

/*
 * İçeriğin alanı. Planlamada: kararı ya da üretime alınması bekleyen (talep,
 * taslak, masanın üretime almadığı paket). Üretimde: üretim akışında ya da
 * muhabirde. Yayına hazır: teslim edilmiş ya da masanın akışında bitmiş, yayın
 * kararı bekleyen. Arşiv: yayınlanan, yayınlanmayan, iptal.
 */
export const ICERIK_ALANLARI = ["planlamada", "uretimde", "hazir", "arsiv"] as const;
export type IcerikAlani = (typeof ICERIK_ALANLARI)[number];
/* İçerikler'in alanları; kapananlar ayrı Arşiv bölümünde (aranır, süzülür). */
export const AKTIF_ALANLAR: IcerikAlani[] = ["planlamada", "uretimde", "hazir"];

export const icerikDurumAlani = (p: Paket): IcerikAlani => {
  if (p.durum === "iptal" || p.yayinlandi || p.yayinlanmadi) return "arsiv";
  if (p.durum === "tamamlandi") return "hazir";
  if (p.durum === "uretimde") return "uretimde";
  if (p.durum === "onaylandi" && (p.masaTakibi || p.gorev)) return p.isaret?.tur === "yapildi" ? "hazir" : "uretimde";
  return "planlamada";
};

/** Masanın içerikleri: takibindeki ve kolu masaya ait paketler (özel yayın paketi değil). */
/* Karar bekleyen görev talebi içerik değil, masanın önerisi (Öneriler › Bizim önerilerimiz). */
export const masaIcerikleri = (d: Pick<Durum, "paketler">, birim: BirimId): Paket[] =>
  d.paketler.filter((p) => !p.ozelId && paketinMasasi(p) === birim && !(p.gorevTalebi && !p.gorev));

/** Masanın kendi önerileri: görev talepleri; karar bekleyen ya da sonuçlanan (arşiv). */
export const masaTalepleri = (d: Pick<Durum, "paketler">, birim: BirimId) => d.paketler.filter((p) => p.gorevTalebi?.birim === birim);
export const talepBekliyor = (p: Paket) => !!p.gorevTalebi && !p.gorev && p.durum === "taslak";

/* --- Programlar ve bölümleri --- */

/** Günün haftadaki sırası, Cumartesi 0 (kurumun haftası). */
export const haftaSirasi = (tarih: string) => (new Date(tarih + "T12:00:00").getDay() + 1) % 7;
export const programGunuMu = (p: ProgramTanimi, tarih: string) => p.gunler.includes(haftaSirasi(tarih));

/** Haftanın (Cumartesi başlar) bu programa düşen bölüm günleri. */
export const haftaninBolumleri = (p: ProgramTanimi, hafta: string): string[] => {
  const bas = haftaBasi(hafta);
  return p.gunler.map((g) => gunEkle(bas, g)).sort();
};

export const bolumIcerikleri = (d: Pick<Durum, "paketler">, programId: string, tarih: string) =>
  d.paketler.filter((p) => p.programBolumu?.programId === programId && p.programBolumu.tarih === tarih && p.durum !== "iptal");

export const etkinProgramlar = (d: Pick<Durum, "programlar">) => (d.programlar ?? []).filter((p) => !p.pasif);

/** Bugün yayını olan programlar, saat sırasıyla. */
export const bugunkuProgramlar = (d: Pick<Durum, "programlar">, bugun: string) =>
  etkinProgramlar(d)
    .filter((p) => programGunuMu(p, bugun))
    .sort((a, b) => (a.saat ?? "~").localeCompare(b.saat ?? "~"));

/* --- Yayın planları: her planın son onaylanan hali --- */

export const sonNextDay = (d: Pick<Durum, "planlar">): NextDayPlan | undefined =>
  d.planlar.filter((p) => p.durum === "onayli" || p.durum === "devralindi").sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
export const sonWeekly = (d: Pick<Durum, "haftalik">): HaftalikPlan | undefined =>
  d.haftalik.filter((h) => h.durum === "kesinlesti").sort((a, b) => b.baslangic.localeCompare(a.baslangic))[0];
export const sonAylik = (d: Pick<Durum, "aylik">): AylikPlan | undefined =>
  d.aylik.filter((a) => a.durum === "onayli" && a.olaylar?.length).sort((a, b) => b.ay.localeCompare(a.ay))[0];
export const sonOzel = (d: Pick<Durum, "ozel">): OzelYayin | undefined =>
  d.ozel
    .filter((o) => OZEL_SIRASI.indexOf(o.durum ?? "hazirlik") >= OZEL_SIRASI.indexOf("onayli"))
    .sort((a, b) => b.tarih.localeCompare(a.tarih))[0];

/* --- Rozetler: masanın önündeki karar işleri --- */

/** Yayın kararı bekleyen (Yayına hazır alanı), yanıt bekleyen soru, programa konmamış hazır içerik. */
export const masaKararlari = (d: Durum, birim: BirimId) => {
  const hazir = masaIcerikleri(d, birim).filter((p) => icerikDurumAlani(p) === "hazir");
  return {
    yayin: hazir.length,
    soru: masaninSorulari(d, birim).filter((s) => !s.cevap).length,
    programsiz: birim === "program" ? hazir.filter((p) => !p.programBolumu).length : 0,
  };
};

/* --- Arşiv (kullanıcı: bilgi yığını değil kullanışlı; aranır) --- */

export type ArsivTuru = "yayinlandi" | "yayinlanmadi" | "iptal" | "soru" | "talep";
export interface ArsivKaydi {
  id: string;
  tur: ArsivTuru;
  /** Kaydın kapandığı gün (YYYY-MM-DD); aylara bölme ve sıra ondan. */
  tarih: string;
  baslik: string;
  muhabirId?: string;
  paket?: Paket;
  oneriId?: string;
  /** Soru: kabul mü; talep: Planlama reddetti mi geri çekildi mi. */
  kabul?: boolean;
  programId?: string;
}

/**
 * Masanın arşivi: kapanan içerikler (yayınlanan, yayınlanmayan, iptal), yanıtlanan
 * sorular, sonuçlanmış ama göreve dönmemiş talepler (dönen talep zaten içerik).
 * Saklanmaz; en yenisi önce.
 */
export const masaArsivi = (d: Durum, birim: BirimId): ArsivKaydi[] => {
  const gun = (z?: string) => (z ?? "").slice(0, 10);
  const icerik: ArsivKaydi[] = masaIcerikleri(d, birim)
    .filter((p) => icerikDurumAlani(p) === "arsiv")
    .map((p) => ({
      id: p.id,
      tur: p.yayinlandi ? "yayinlandi" : p.yayinlanmadi ? "yayinlanmadi" : "iptal",
      tarih: gun(p.yayinlandi?.tarih ?? p.programBolumu?.tarih ?? p.guncelleme),
      baslik: p.baslik,
      muhabirId: p.muhabirId,
      paket: p,
      programId: p.programBolumu?.programId,
    }));
  const sorular: ArsivKaydi[] = (d.masaSorulari ?? [])
    .filter((s) => s.birim === birim && s.cevap)
    .flatMap((s) => {
      const o = d.oneriler.find((x) => x.id === s.oneriId);
      return o ? [{ id: s.id, tur: "soru" as const, tarih: gun(s.cevap!.zaman), baslik: o.paketBasligi || o.haberBasligi, muhabirId: o.muhabirId, oneriId: o.id, kabul: s.cevap!.kabul }] : [];
    });
  const talepler: ArsivKaydi[] = masaTalepleri(d, birim)
    .filter((p) => !talepBekliyor(p) && !p.gorev)
    .map((p) => ({ id: p.id, tur: "talep" as const, tarih: gun(p.guncelleme), baslik: p.baslik, muhabirId: p.muhabirId, paket: p, kabul: false }));
  return [...icerik, ...sorular, ...talepler].sort((a, b) => b.tarih.localeCompare(a.tarih));
};

export const ARSIV_SUZGECLERI = ["hepsi", "yayinlandi", "yayinlanmadi", "oneri"] as const;
export type ArsivSuzgeci = (typeof ARSIV_SUZGECLERI)[number];
export const arsivSuzgeceUyar = (k: ArsivKaydi, s: ArsivSuzgeci) =>
  s === "hepsi" || (s === "yayinlandi" ? k.tur === "yayinlandi" : s === "yayinlanmadi" ? k.tur === "yayinlanmadi" || k.tur === "iptal" : k.tur === "soru" || k.tur === "talep");
