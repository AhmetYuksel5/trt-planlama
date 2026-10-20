import { ciktiTarihi } from "./dil";
import type { GidenEposta } from "./eposta";
import { kisiAr } from "./etiketler";
import { kisiBul, planBul, type Durum, type GeriBildirimAyari, type GeriBildirimKarari, type GeriBildirimSablonu, type Oneri } from "./veri";

/*
 * Muhabire geri bildirim e-postası ve deneme sürecindeki e-postayla takip.
 * Saf kurallar: şablonların varsayılanı, şablonun doldurulması, adreslerin
 * ayrılması. Kurum diğer birimleri devreye alınca takip ayarı kapatılıyor;
 * şablonlar yerinde kalıyor.
 */

/* Varsayılan şablonlar kurumun yazışma dili Arapça; Ayarlar'da değişiyor. */
export const VARSAYILAN_SABLONLAR: GeriBildirimSablonu[] = [
  {
    id: "gb-onay",
    ad: "Onaylandı",
    karar: "planaEklendi",
    konu: "تمت الموافقة على مقترحك: {header}",
    govde: "الزميل العزيز {muhabir}،\n\nتمت الموافقة على مقترحك «{header}» وأُدرج في خطة {plan}.\n\n{not}\n\nمع التحية،\nقسم التخطيط",
    cc: "",
    bcc: "",
  },
  {
    id: "gb-ret",
    ad: "Reddedildi",
    karar: "reddedildi",
    konu: "بشأن مقترحك: {header}",
    govde: "الزميل العزيز {muhabir}،\n\nنشكرك على مقترحك «{header}»، ونعتذر عن عدم اعتماده هذه المرة.\n{gerekce}\n\n{not}\n\nمع التحية،\nقسم التخطيط",
    cc: "",
    bcc: "",
  },
  {
    id: "gb-sonra",
    ad: "Daha sonra değerlendirilecek",
    karar: "sonra",
    konu: "مقترحك قيد الانتظار: {header}",
    govde: "الزميل العزيز {muhabir}،\n\nمقترحك «{header}» سيُقيَّم لاحقا، وسنعود إليك عند اتخاذ القرار.\n\n{not}\n\nمع التحية،\nقسم التخطيط",
    cc: "",
    bcc: "",
  },
];

export const VARSAYILAN_AYAR: GeriBildirimAyari = {
  epostaIleTakip: true,
  takipMesaji: "سيتم من الآن متابعة مرحلة تنفيذ هذا المقترح عبر البريد الإلكتروني، لأننا في مرحلة تجريبية.",
};

/** Kayıtta şablon yoksa (yeni kurulum, eski kayıt) varsayılanlar; hepsi silinirse de varsayılana dönülüyor. */
export const sablonlar = (d: Durum): GeriBildirimSablonu[] => (d.geriBildirimSablonlari?.length ? d.geriBildirimSablonlari : VARSAYILAN_SABLONLAR);
/*
 * Deneme sürecinin e-postayla takibi kalktı (tasarım belgesi, 9. bölüm):
 * yerini görev ve "yapıldı" akışı aldı. Kayıtta ayar açık kalmış olsa da
 * kapalı okunuyor; eski takip işaretleri bilgi olarak duruyor.
 */
export const geriBildirimAyari = (d: Durum): GeriBildirimAyari => ({ ...(d.geriBildirimAyari ?? VARSAYILAN_AYAR), epostaIleTakip: false });

/** Geri bildirim kararı verilmiş öneride ve muhabiri varsa (talimat, ajans önerisinde dönülecek muhabir yok). */
export const geriBildirimKarari = (o: Oneri): GeriBildirimKarari | undefined =>
  o.muhabirId && (o.durum === "planaEklendi" || o.durum === "reddedildi" || o.durum === "sonra") ? o.durum : undefined;

/** Karara uyan ilk şablon; yoksa ilk şablon. */
export const kararSablonu = (d: Durum, o: Oneri): GeriBildirimSablonu | undefined => {
  const l = sablonlar(d);
  return l.find((s) => s.karar && s.karar === o.durum) ?? l[0];
};

export const adresler = (metin: string) =>
  metin
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter((x) => x.includes("@"));

/** Şablondaki alanları önerinin bilgisiyle dolduruyor; boş kalan satırlar (not, gerekçe yoksa) metinde iz bırakmıyor. */
export const sablonDoldur = (metin: string, d: Durum, o: Oneri, not = "") => {
  const plan = planBul(d, o.planId);
  const alanlar: Record<string, string> = {
    muhabir: kisiAr(kisiBul(d, o.muhabirId)),
    header: o.haberBasligi,
    strap: o.paketBasligi ?? "",
    plan: plan ? ciktiTarihi(plan.tarih, "ar") : o.hedefTarih ? ciktiTarihi(o.hedefTarih, "ar") : "",
    gerekce: o.gerekce ?? "",
    not: not.trim(),
  };
  return metin
    .replace(/\{(\w+)\}/g, (tam, ad: string) => (ad in alanlar ? alanlar[ad] : tam))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const geriBildirimEpostasi = (s: GeriBildirimSablonu, d: Durum, o: Oneri, not = ""): GidenEposta => ({
  kime: kisiBul(d, o.muhabirId)?.eposta ?? "",
  cc: adresler(s.cc),
  bcc: adresler(s.bcc),
  konu: sablonDoldur(s.konu, d, o),
  govde: sablonDoldur(s.govde, d, o, not),
});
