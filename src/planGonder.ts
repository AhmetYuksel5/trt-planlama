import { ciktiTarihi, gunAdi, metin } from "./dil";
import { adresler } from "./geriBildirim";
import { haftaAraligiAr } from "./eposta";
import type { Durum, GeriBildirimSablonu } from "./veri";

/*
 * Planı gönder (kullanıcı: onaylanan Next Day ve kesinleşen Weekly üstteki zarfla
 * plan metnindeki biçimiyle postaya gitsin; Kime, CC, BCC ve başlık Ayarlar'da bir
 * kez belirlensin). Şablon geri bildirim şablonlarının koleksiyonunda sabit
 * kimlikle (PKG geri bildirimi gibi); oradaki listeye karışmaz. Gövde planın
 * kendisi (e-posta kopyasıyla aynı satır içi stilli HTML, indir.ts → epostaHtml);
 * şablonun metni varsa planın üstüne düz satırlar olarak girer.
 */
export type PlanGonderTuru = "nextday" | "haftalik";
export const PLAN_GONDER_SABLONU: Record<PlanGonderTuru, string> = { nextday: "plan-gonder-nd", haftalik: "plan-gonder-hf" };

export const VARSAYILAN_PLAN_GONDER: Record<PlanGonderTuru, GeriBildirimSablonu> = {
  nextday: { id: PLAN_GONDER_SABLONU.nextday, ad: "Next Day", konu: "الأجندة الإخبارية - {tarih}", govde: "", kime: "", cc: "", bcc: "" },
  haftalik: { id: PLAN_GONDER_SABLONU.haftalik, ad: "Weekly", konu: "الأجندة الأسبوعية {aralik}", govde: "", kime: "", cc: "", bcc: "" },
};

export const PLAN_GONDER_ALANLARI: Record<PlanGonderTuru, string[]> = { nextday: ["tarih", "gun"], haftalik: ["aralik"] };

export const planGonderSablonu = (d: Pick<Durum, "geriBildirimSablonlari">, tur: PlanGonderTuru): GeriBildirimSablonu =>
  d.geriBildirimSablonlari?.find((s) => s.id === PLAN_GONDER_SABLONU[tur]) ?? VARSAYILAN_PLAN_GONDER[tur];

/** Şablondaki {tarih} {gun} (Next Day) ve {aralik} (Weekly) planın gününden; kurumun yazımıyla, Arapça. */
export const planGonderDoldur = (sablonMetni: string, tur: PlanGonderTuru, tarih: string) => {
  const alanlar: Record<string, string> =
    tur === "nextday" ? { tarih: ciktiTarihi(tarih, "ar"), gun: gunAdi(tarih, "ar") } : { aralik: haftaAraligiAr(tarih) };
  return sablonMetni.replace(/\{(\w+)\}/g, (tam, a: string) => alanlar[a] ?? tam).trim();
};

export interface PlanPostasi {
  kime: string[];
  cc: string[];
  bcc: string[];
  konu: string;
  govde: string;
}
export const planPostasi = (d: Pick<Durum, "geriBildirimSablonlari">, tur: PlanGonderTuru, tarih: string): PlanPostasi => {
  const s = planGonderSablonu(d, tur);
  return {
    kime: adresler(s.kime ?? ""),
    cc: adresler(s.cc),
    bcc: adresler(s.bcc),
    konu: planGonderDoldur(s.konu, tur, tarih) || metin("ciktiBaslik", "ar"),
    govde: planGonderDoldur(s.govde, tur, tarih),
  };
};

/* Düz metin satırlarını planın üstüne koyar; HTML'e kaçışlı, sağdan sola. */
const kac = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const govdeliHtml = (govde: string, planHtml: string) =>
  govde.trim()
    ? `<div dir="rtl" style="font-family:Calibri,Arial,sans-serif;font-size:13pt;text-align:right">${govde
        .split("\n")
        .map((s) => `<p dir="auto" style="margin:0">${s.trim() ? kac(s) : "&nbsp;"}</p>`)
        .join("")}<p style="margin:0">&nbsp;</p></div>${planHtml}`
    : planHtml;
