import { muhabirAdresi } from "./muhabirIletisim";
import { ciktiTarihi } from "./dil";
import { kisiAr, paketYeri, sehirAr } from "./etiketler";
import { OZEL_GOREV_SABLONU, TAKDIR_SABLONU, adresler } from "./geriBildirim";
import { baslikBul, kisiBul, oneriBul, planBul, type Durum, type GeriBildirimSablonu, type HaftalikKalem, type HaftalikPlan, type Kisi, type Paket } from "./veri";
import { gundemde } from "./haftalik";

/*
 * Takdir bildirimi (kullanıcı: plan onaylanınca kabul edilen paketin
 * muhabirine hazır şablonla e-posta). Onaydan sonra planın bildirim sayfası
 * açılıyor, planlamacı paketleri tek tek işaretleyip gönderiyor; kendiliğinden
 * gitmiyor. Şablon geri bildirim şablonlarının koleksiyonunda sabit kimlikle
 * duruyor (ayrı koleksiyon açmamak için); oradaki listeye karışmıyor.
 * Metin "sen" diliyle ama cinsiyetsiz: hitap "مرحبًا", emir kipi yok (اعمل /
 * اعملي ayrışıyor), "نرجو منك" + mastar; harekesiz "منك" ikisine de uyuyor.
 */
export { TAKDIR_SABLONU };

export const VARSAYILAN_TAKDIR: GeriBildirimSablonu = {
  id: TAKDIR_SABLONU,
  ad: "PKG geri bildirimi",
  konu: "تكليف تقرير من {sehir} | {strap}",
  govde:
    "مرحبًا {muhabir}،\n\nنرجو منك إعداد التقرير التالي ليوم {gun}، وشكرًا على جهودك.\n\nعنوان التقرير: {strap}\nالملف: {baslik}\nالتفاصيل: {aciklama}\nالمكان: {yer}\nموعد التسليم: {teslim}\nملاحظة: {not}\n\nنرجو منك البقاء على تواصل مع غرفة الأخبار خلال العمل على التقرير.\n\nمع التحية،\n{gonderen}\nقسم التخطيط",
  cc: "",
  bcc: "",
};

export const TAKDIR_ALANLARI = ["muhabir", "gun", "teslim", "sehir", "strap", "baslik", "aciklama", "yer", "not", "gonderen"] as const;

export const takdirSablonu = (d: Pick<Durum, "geriBildirimSablonlari">): GeriBildirimSablonu =>
  d.geriBildirimSablonlari?.find((s) => s.id === TAKDIR_SABLONU) ?? VARSAYILAN_TAKDIR;

/* Planda kabul edilmiş, muhabiri belli paket: taslak, karar bekleyen, iptal (ret dahil) ve özel yayın paketi değil. */
export const takdirPaketleri = (d: Pick<Durum, "paketler">, planId: string): Paket[] =>
  d.paketler.filter((p) => p.planId === planId && !p.ozelId && !!p.muhabirId && !p.muhabirTbc && (p.durum === "onaylandi" || p.durum === "uretimde"));

/* Muhabirin adresi: kurumsal, yoksa kişisel (Excel'den gelenin çoğunda yalnız biri var). */
export const takdirAdresi = (k?: Kisi) => muhabirAdresi(k);

/*
 * Teslim günü (kullanıcı: postada "bu teslim gününe kadar" densin): paketin
 * teslim günü, yoksa önerinin teslim tahmini. Yayın günüyle aynıysa yazılmaz,
 * satır düşer: "ليوم {gun}" zaten söylüyor.
 */
const teslimYaz = (teslim: string | undefined, gun: string | undefined) => (teslim && teslim !== gun ? ciktiTarihi(teslim, "ar") : "");

const alanlar = (d: Durum, p: Paket, gonderen?: Kisi): Record<string, string> => {
  const plan = planBul(d, p.planId);
  const pb = plan?.basliklar.find((b) => b.id === p.planBaslikId);
  return {
    muhabir: kisiAr(kisiBul(d, p.muhabirId)),
    gun: plan ? ciktiTarihi(plan.tarih, "ar") : "",
    teslim: teslimYaz(p.sonTarih ?? oneriBul(d, p.oneriId)?.teslimTahmini, plan?.tarih),
    sehir: paketYeri(p),
    strap: p.baslik.trim(),
    baslik: baslikBul(d, pb?.baslikId)?.ad ?? "",
    aciklama: p.aciklama.trim(),
    yer: paketYeri(p),
    not: (p.notlar ?? []).map((n) => n.metin.trim()).filter(Boolean).join(" - "),
    gonderen: kisiAr(gonderen),
  };
};

/*
 * Şablonu doldurur. Değeri boş alanın satırı ("ملاحظة: {not}") tümüyle düşer:
 * notsuz pakette boş "ملاحظة:" satırı gitmesin.
 */
export const takdirDoldur = (metin: string, a: Record<string, string>) =>
  metin
    .split("\n")
    .filter((satir) => ![...satir.matchAll(/\{(\w+)\}/g)].some((m) => m[1] in a && !a[m[1]]))
    .map((satir) => satir.replace(/\{(\w+)\}/g, (tam, ad: string) => (ad in a ? a[ad] : tam)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export interface TakdirEpostasi {
  kime: string[];
  cc: string[];
  bcc: string[];
  konu: string;
  metin: string;
}

export const takdirEpostasi = (d: Durum, p: Paket, gonderen?: Kisi, s: GeriBildirimSablonu = takdirSablonu(d)): TakdirEpostasi => {
  const a = alanlar(d, p, gonderen);
  const adres = takdirAdresi(kisiBul(d, p.muhabirId));
  return {
    kime: adres ? [adres] : [],
    cc: adresler(s.cc),
    bcc: adresler(s.bcc),
    konu: takdirDoldur(s.konu, a).replace(/\s*\n\s*/g, " "),
    metin: takdirDoldur(s.govde, a),
  };
};

/*
 * Weekly'nin kabul edilen paketleri (kullanıcı: kesinleşen haftanın ⋯ menüsünde
 * "Kabul edilen paketler", dilediğine posta; gönderilmeyen Next Day hazırlanırken
 * karşısına çıksın). Paket doğuracak kalem: kabul (şartlı değil), muhabiri belli,
 * yalnız canlı değil. Muhabir kalemin ilki: doğan paketin muhabiri de o.
 * Reddedilenlere posta yok; muhabir önerisinin sayfasında görüyor.
 */
export const haftalikTakdirKalemleri = (h: HaftalikPlan): HaftalikKalem[] =>
  h.durum !== "kesinlesti"
    ? []
    : h.kalemler.filter((k) => gundemde(k) && k.karar === "kabul" && !!k.muhabirler[0] && !k.muhabirTbc && (k.tur !== "haber" || !k.bicimler.length || k.bicimler.some((b) => b !== "canli")));

/** Postası gitti mi: kalemde ya da doğan pakette (Next Day'den gönderilmiş de olabilir). */
export const kalemBildirimi = (d: Pick<Durum, "paketler">, k: HaftalikKalem) =>
  k.takdirBildirimi ?? d.paketler.find((p) => p.haftalikKalemId === k.id && p.takdirBildirimi)?.takdirBildirimi;

const kalemStrapi = (d: Durum, k: HaftalikKalem) =>
  k.paketBasligi || oneriBul(d, k.oneriId)?.paketBasligi || k.baslik || (k.baslikId ? baslikBul(d, k.baslikId)?.ad : undefined) || k.metin;

const kalemAlanlari = (d: Durum, k: HaftalikKalem, gonderen?: Kisi): Record<string, string> => {
  const m = kisiBul(d, k.muhabirler[0]);
  const yer = k.yer?.trim() || sehirAr(m?.sehir);
  return {
    muhabir: kisiAr(m),
    gun: k.tarih ? ciktiTarihi(k.tarih, "ar") : "",
    teslim: teslimYaz(k.teslimGunu ?? oneriBul(d, k.oneriId)?.teslimTahmini, k.tarih),
    sehir: yer,
    strap: kalemStrapi(d, k).trim(),
    baslik: baslikBul(d, k.baslikId)?.ad ?? "",
    aciklama: k.metin.trim(),
    yer,
    not: [k.kararNotu, k.ekTalep, k.not].map((x) => x?.trim()).filter(Boolean).join(" - "),
    gonderen: kisiAr(gonderen),
  };
};

export const kalemTakdirEpostasi = (d: Durum, k: HaftalikKalem, gonderen?: Kisi, s: GeriBildirimSablonu = takdirSablonu(d)): TakdirEpostasi => {
  const a = kalemAlanlari(d, k, gonderen);
  const adres = takdirAdresi(kisiBul(d, k.muhabirler[0]));
  return {
    kime: adres ? [adres] : [],
    cc: adresler(s.cc),
    bcc: adresler(s.bcc),
    konu: takdirDoldur(s.konu, a).replace(/\s*\n\s*/g, " "),
    metin: takdirDoldur(s.govde, a),
  };
};

/** Next Day'de bu planın, postası gitmemiş Weekly paketleri (Sıradaki kartında hatırlatılıyor). */
export const bildirilmemisHaftalik = (d: Pick<Durum, "paketler">, planId: string) => takdirPaketleri(d, planId).filter((p) => p.haftalikKalemId && !p.takdirBildirimi);

/*
 * Özel yayın görevi (kullanıcı: içerik doğrudan muhabire görevlendirilir,
 * sistemin içinden belirlenen kalıp posta gider). Şablon PKG geri bildirimiyle
 * aynı koleksiyonda, sabit kimlikle; aynı dil kuralı (cinsiyetsiz, emir kipsiz).
 */
export { OZEL_GOREV_SABLONU };

export const VARSAYILAN_OZEL_GOREV: GeriBildirimSablonu = {
  id: OZEL_GOREV_SABLONU,
  ad: "Özel yayın görevi",
  konu: "تكليف تقرير للتغطية الخاصة | {yayin} | {strap}",
  govde:
    "مرحبًا {muhabir}،\n\nنرجو منك إعداد التقرير التالي ضمن التغطية الخاصة «{yayin}»، وشكرًا على جهودك.\n\nعنوان التقرير: {strap}\nالتفاصيل: {aciklama}\nالمكان: {yer}\nيوم البث: {gun}\nموعد التسليم: {teslim}\nملاحظة: {not}\n\nنرجو منك البقاء على تواصل مع قسم التخطيط خلال العمل على التقرير.\n\nمع التحية،\n{gonderen}\nقسم التخطيط",
  cc: "",
  bcc: "",
};

export const OZEL_GOREV_ALANLARI = ["muhabir", "yayin", "gun", "teslim", "strap", "aciklama", "yer", "not", "gonderen"] as const;

export const ozelGorevSablonu = (d: Pick<Durum, "geriBildirimSablonlari">): GeriBildirimSablonu =>
  d.geriBildirimSablonlari?.find((s) => s.id === OZEL_GOREV_SABLONU) ?? VARSAYILAN_OZEL_GOREV;

export const ozelGorevEpostasi = (d: Durum, p: Paket, gonderen?: Kisi, s: GeriBildirimSablonu = ozelGorevSablonu(d)): TakdirEpostasi => {
  const a: Record<string, string> = {
    muhabir: kisiAr(kisiBul(d, p.muhabirId)),
    yayin: (d.ozel.find((o) => o.id === p.ozelId)?.ad ?? p.ozelAd ?? "").trim(),
    gun: p.yayinGunu ? ciktiTarihi(p.yayinGunu, "ar") : "",
    // Teslim yayın günüyse ayrıca yazılmaz (aynı günü iki satırda okumasın).
    teslim: p.sonTarih && p.sonTarih !== p.yayinGunu ? ciktiTarihi(p.sonTarih, "ar") : "",
    strap: p.baslik.trim(),
    aciklama: p.aciklama.trim(),
    yer: paketYeri(p),
    not: (p.notlar ?? []).map((n) => n.metin.trim()).filter(Boolean).join(" - "),
    gonderen: kisiAr(gonderen),
  };
  const adres = takdirAdresi(kisiBul(d, p.muhabirId));
  return {
    kime: adres ? [adres] : [],
    cc: adresler(s.cc),
    bcc: adresler(s.bcc),
    konu: takdirDoldur(s.konu, a).replace(/\s*\n\s*/g, " "),
    metin: takdirDoldur(s.govde, a),
  };
};
