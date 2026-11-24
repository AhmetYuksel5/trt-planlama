import { aralikYaz, ciktiTarihi, gunAdi, metin } from "./dil";
import { adresler } from "./geriBildirim";
import { haftaAraligiAr } from "./eposta";
import { gunEkle } from "./tarih";
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

/*
 * Weekly'nin metni kurumun postası (kullanıcının gönderdiği metin): iki dilde kısa
 * selam, plan ekte Word dosyası. Next Day plan postanın metninde.
 */
const HAFTALIK_METIN = [
  "الزملاء الأعزاء",
  "تحية طيبة",
  "مرفق لكم الخطة الإخبارية الأسبوعية لقناة TRT ARABI وذلك للفترة ما بين {aralik}",
  "",
  "Dear colleagues,",
  "Attached is the upcoming TRT ARABI weekly news plan for the period {aralikEn}",
  "",
  "Best regards",
].join("\n");

export const VARSAYILAN_PLAN_GONDER: Record<PlanGonderTuru, GeriBildirimSablonu> = {
  nextday: { id: PLAN_GONDER_SABLONU.nextday, ad: "Next Day", konu: "الأجندة الإخبارية - {tarih}", govde: "", kime: "", cc: "", bcc: "", ek: "metin" },
  haftalik: { id: PLAN_GONDER_SABLONU.haftalik, ad: "Weekly", konu: "الأجندة الأسبوعية {aralik}", govde: HAFTALIK_METIN, kime: "", cc: "", bcc: "", ek: "word" },
};

export const PLAN_GONDER_ALANLARI: Record<PlanGonderTuru, string[]> = { nextday: ["tarih", "gun"], haftalik: ["aralik", "aralikEn"] };

/** Haftanın İngilizce aralığı, kurumun yazımıyla büyük harf: "21 - 27 NOVEMBER". */
export const haftaAraligiEn = (bas: string) => aralikYaz(bas, gunEkle(bas, 6), "en").toUpperCase();

export const planGonderSablonu = (d: Pick<Durum, "geriBildirimSablonlari">, tur: PlanGonderTuru): GeriBildirimSablonu =>
  d.geriBildirimSablonlari?.find((s) => s.id === PLAN_GONDER_SABLONU[tur]) ?? VARSAYILAN_PLAN_GONDER[tur];

/** Şablondaki {tarih} {gun} (Next Day) ve {aralik} (Weekly) planın gününden; kurumun yazımıyla, Arapça. */
export const planGonderDoldur = (sablonMetni: string, tur: PlanGonderTuru, tarih: string) => {
  const alanlar: Record<string, string> =
    tur === "nextday" ? { tarih: ciktiTarihi(tarih, "ar"), gun: gunAdi(tarih, "ar") } : { aralik: haftaAraligiAr(tarih), aralikEn: haftaAraligiEn(tarih) };
  return sablonMetni.replace(/\{(\w+)\}/g, (tam, a: string) => alanlar[a] ?? tam).trim();
};

export interface PlanPostasi {
  /** Boşsa gönderenin kendi hesabı. */
  gonderen: string;
  kime: string[];
  cc: string[];
  bcc: string[];
  konu: string;
  govde: string;
  ek: "metin" | "word";
}
export const planPostasi = (d: Pick<Durum, "geriBildirimSablonlari">, tur: PlanGonderTuru, tarih: string): PlanPostasi => {
  const s = planGonderSablonu(d, tur);
  return {
    gonderen: adresler(s.gonderen ?? "")[0] ?? "",
    kime: adresler(s.kime ?? ""),
    cc: adresler(s.cc),
    bcc: adresler(s.bcc),
    konu: planGonderDoldur(s.konu, tur, tarih) || metin("ciktiBaslik", "ar"),
    govde: planGonderDoldur(s.govde, tur, tarih),
    ek: s.ek ?? VARSAYILAN_PLAN_GONDER[tur].ek ?? "metin",
  };
};

/*
 * Düz metin satırlarını planın üstüne koyar; HTML'e kaçışlı. Yön satır satır:
 * ilk güçlü harf Arapçaysa sağdan sola ve sağa yaslı, değilse soldan sağa
 * (kurumun metni iki dilli; "auto" Outlook'ta hizayı değiştirmiyordu). Boş satır
 * öncekinin yönünde.
 */
const kac = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const satirYonu = (x: string, onceki: "rtl" | "ltr"): "rtl" | "ltr" => {
  const m = x.match(/[\p{L}]/u);
  if (!m) return onceki;
  return /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(m[0]) ? "rtl" : "ltr";
};
export const govdeliHtml = (govde: string, planHtml: string) => {
  if (!govde.trim()) return planHtml;
  let yon: "rtl" | "ltr" = "rtl";
  const satirlar = govde.split("\n").map((x) => {
    yon = satirYonu(x, yon);
    return `<p dir="${yon}" style="margin:0;text-align:${yon === "rtl" ? "right" : "left"}">${x.trim() ? kac(x) : "&nbsp;"}</p>`;
  });
  return `<div style="font-family:Calibri,Arial,sans-serif;font-size:13pt">${satirlar.join("")}${planHtml ? `<p style="margin:0">&nbsp;</p>` : ""}</div>${planHtml}`;
};
