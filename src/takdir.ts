import { ciktiTarihi } from "./dil";
import { kisiAr, paketYeri } from "./etiketler";
import { TAKDIR_SABLONU, adresler } from "./geriBildirim";
import { baslikBul, kisiBul, planBul, type Durum, type GeriBildirimSablonu, type Kisi, type Paket } from "./veri";

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
  ad: "Takdir bildirimi",
  konu: "تكليف تقرير من {sehir} | {strap}",
  govde:
    "مرحبًا {muhabir}،\n\nنرجو منك إعداد التقرير التالي ليوم {gun}، وشكرًا على جهودك.\n\nعنوان التقرير: {strap}\nالملف: {baslik}\nالتفاصيل: {aciklama}\nالمكان: {yer}\nملاحظة: {not}\n\nنرجو منك البقاء على تواصل مع غرفة الأخبار خلال العمل على التقرير.\n\nمع التحية،\n{gonderen}\nقسم التخطيط",
  cc: "",
  bcc: "",
};

export const TAKDIR_ALANLARI = ["muhabir", "gun", "sehir", "strap", "baslik", "aciklama", "yer", "not", "gonderen"] as const;

export const takdirSablonu = (d: Pick<Durum, "geriBildirimSablonlari">): GeriBildirimSablonu =>
  d.geriBildirimSablonlari?.find((s) => s.id === TAKDIR_SABLONU) ?? VARSAYILAN_TAKDIR;

/* Planda kabul edilmiş, muhabiri belli paket: taslak, karar bekleyen, iptal (ret dahil) ve özel yayın paketi değil. */
export const takdirPaketleri = (d: Pick<Durum, "paketler">, planId: string): Paket[] =>
  d.paketler.filter((p) => p.planId === planId && !p.ozelId && !!p.muhabirId && !p.muhabirTbc && (p.durum === "onaylandi" || p.durum === "uretimde"));

/* Muhabirin adresi: kurumsal, yoksa kişisel (Excel'den gelenin çoğunda yalnız biri var). */
export const takdirAdresi = (k?: Kisi) => (k?.eposta || k?.kisiselEposta || "").trim().toLowerCase();

const alanlar = (d: Durum, p: Paket, gonderen?: Kisi): Record<string, string> => {
  const plan = planBul(d, p.planId);
  const pb = plan?.basliklar.find((b) => b.id === p.planBaslikId);
  return {
    muhabir: kisiAr(kisiBul(d, p.muhabirId)),
    gun: plan ? ciktiTarihi(plan.tarih, "ar") : "",
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
