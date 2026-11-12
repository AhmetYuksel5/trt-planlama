import { OZEL_SIRASI, type AylikPlan, type BirimId, type Durum, type HaftalikPlan, type NextDayPlan, type OzelYayin, type Paket, type ProgramTanimi } from "./veri";
import { gunEkle, haftaBasi } from "./tarih";
import { paketinMasasi } from "./yetki";

/*
 * Programlar'ın sayfası (kullanıcı; saf kurallar, saklanmaz). Dört kutucuk:
 * Yayın planları (her planın son onaylanan çıktısı, salt okunur), İçerikler
 * (masanın paketleri dört alanda), Öneriler (Planlama'dan gelen, bizim, arşiv),
 * Programlar (programlar, yayın günleri, bölümlere aktarılan içerik).
 */

export const PROGRAM_BOLUMLERI = ["planlar", "icerikler", "oneriler", "programlar"] as const;
export type ProgramBolumu = (typeof PROGRAM_BOLUMLERI)[number];

/*
 * İçeriğin alanı. Planlamada: kararı ya da üretime alınması bekleyen (talep,
 * taslak, masanın üretime almadığı paket). Üretimde: üretim akışında ya da
 * muhabirde. Yayına hazır: teslim edilmiş ya da masanın akışında bitmiş, yayın
 * kararı bekleyen. Arşiv: yayınlanan, yayınlanmayan, iptal.
 */
export const ICERIK_ALANLARI = ["planlamada", "uretimde", "hazir", "arsiv"] as const;
export type IcerikAlani = (typeof ICERIK_ALANLARI)[number];

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
