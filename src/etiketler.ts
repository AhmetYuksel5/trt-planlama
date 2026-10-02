import { metin, yaz, type Anahtar, type Yazi } from "./dil";
import type {
  Bicim,
  Birim,
  CalismaBicimi,
  EkipGorevi,
  Gorev,
  GorevlendirmeDurum,
  HareketTuru,
  IcerikTuru,
  Kanal,
  KaynakTuru,
  KisiDurum,
  OneriDurum,
  PaketDurum,
  PlanDurum,
  Sehir,
  Ulke,
} from "./veri";

/*
 * Kayıtlardaki sabit değerlerin ekrandaki adları. Ekranlar değeri değil
 * buradaki anahtarı çeviriyor; böylece "değerlendiriliyor" her yerde aynı
 * sözcükle ve seçili dilde görünüyor.
 */

export const BIRIM_ADI: Record<Birim, Anahtar> = {
  planlama: "biPlanlama",
  newsdesk: "biNewsdesk",
  newsgathering: "biNewsgathering",
  program: "biProgram",
  output: "biOutput",
  media: "biMedia",
  muhabir: "biMuhabir",
  yonetim: "biYonetim",
};

export const GOREV_ADI: Record<Gorev, Anahtar> = {
  muhabir: "goMuhabir",
  editor: "goEditor",
  tercuman: "goTercuman",
  newsdesk: "goNewsdesk",
  programEditoru: "goProgramEditoru",
  sunucu: "goSunucu",
  planlamaci: "goPlanlamaci",
  dilDenetmeni: "goDilDenetmeni",
  mediaManager: "goMediaManager",
  koordinator: "goKoordinator",
  yonetici: "goYonetici",
};

export const EKIP_GOREV_ADI: Record<EkipGorevi, Anahtar> = {
  yapimciSef: "egYapimciSef",
  bultenYapimcisi: "egBultenYapimcisi",
  sunucu: "egSunucu",
  muhabirMasasi: "egMuhabirMasasi",
  roportajYapimcisi: "egRoportajYapimcisi",
  tercuman: "egTercuman",
  editor: "egEditor",
  diger: "egDiger",
};

/** Kişiyi ekibe eklerken önerilen görev; kullanıcı değiştirebiliyor. */
export const varsayilanEkipGorevi = (gorev: Gorev, birim: Birim): EkipGorevi => {
  if (gorev === "yonetici" && birim === "newsdesk") return "yapimciSef";
  if (gorev === "newsdesk") return "bultenYapimcisi";
  if (gorev === "sunucu") return "sunucu";
  if (gorev === "planlamaci") return "muhabirMasasi";
  if (gorev === "programEditoru") return "roportajYapimcisi";
  if (gorev === "tercuman") return "tercuman";
  if (gorev === "editor" || gorev === "dilDenetmeni") return "editor";
  return "diger";
};

export const TUR_ADI: Record<IcerikTuru, Anahtar> = {
  haber: "turHaber",
  feature: "turFeature",
  ekonomi: "turEkonomi",
  program: "turProgram",
};

export const BICIM_ADI = (b: Bicim): Anahtar => `bc_${b}`;
export const BICIM_ACIKLAMA = (b: Bicim): Anahtar => `bcA_${b}`;

export const CALISMA_ADI: Record<CalismaBicimi, Anahtar> = {
  kadrolu: "kadrolu",
  retainer: "retainer",
  serbest: "serbest",
};

export const PAKET_DURUM_ADI: Record<PaketDurum, Anahtar> = {
  taslak: "pdTaslak",
  degerlendiriliyor: "pdDegerlendiriliyor",
  onaylandi: "pdOnaylandi",
  uretimde: "pdUretimde",
  tamamlandi: "pdTamamlandi",
  iptal: "pdIptal",
};

export const ONERI_DURUM_ADI: Record<OneriDurum, Anahtar> = {
  yeni: "odYeni",
  degerlendiriliyor: "odDegerlendiriliyor",
  planaEklendi: "odPlanaEklendi",
  reddedildi: "odReddedildi",
  sonra: "odSonra",
};

export const ONERI_DURUM_TONU: Record<OneriDurum, string> = {
  yeni: "vurgu",
  degerlendiriliyor: "uyari",
  planaEklendi: "iyi",
  reddedildi: "kotu",
  sonra: "",
};

export const PLAN_DURUM_ADI: Record<PlanDurum, Anahtar> = {
  taslak: "plTaslak",
  toplantida: "plToplantida",
  onayli: "plOnayli",
  devralindi: "plDevralindi",
};

export const PLAN_DURUM_TONU: Record<PlanDurum, string> = {
  taslak: "",
  toplantida: "uyari",
  onayli: "vurgu",
  devralindi: "iyi",
};

export const KANAL_ADI: Record<Kanal, Anahtar> = {
  sistem: "knSistem",
  eposta: "knEposta",
  telefon: "knTelefon",
  mesaj: "knMesaj",
};

export const KAYNAK_ADI: Record<KaynakTuru, Anahtar> = {
  muhabir: "kyMuhabir",
  ajans: "kyAjans",
  resmi: "kyResmi",
  medya: "kyMedya",
  diger: "kyDiger",
};

export const HAREKET_TURU_ADI: Record<HareketTuru, Anahtar> = {
  gorevlendirme: "htGorevlendirme",
  seyahat: "htSeyahat",
  izin: "htIzin",
  diger: "htDiger",
};

export const GOREVLENDIRME_DURUM_ADI: Record<GorevlendirmeDurum, Anahtar> = {
  talep: "gdTalep",
  onayli: "gdOnayli",
  suruyor: "gdSuruyor",
  bitti: "gdBitti",
};

export const KISI_DURUM_ADI: Record<KisiDurum, Anahtar> = {
  gorevde: "kdGorevde",
  sahada: "kdSahada",
  yolda: "kdYolda",
  izinli: "kdIzinli",
};

export const sehirAdi = (s: Sehir): Anahtar => `s_${s}`;
export const ulkeAdi = (u: Ulke): Anahtar => `u_${u}`;

/*
 * Planın içerik satırı ("ŞEHİR / BAŞLIK / MUHABİR") kurumun çıktısındaki
 * gibi baştan sona Arapça; şehir ve kişi adı da. Satır sağdan sola tek
 * parça akıyor; araya arayüz dilinde bir ad girse sıra okuyana ters
 * görünürdü. Çıktı ve düzenleme ekranı satırı buradan kuruyor.
 */
export const sehirAr = (s?: Sehir) => (s ? metin(sehirAdi(s), "ar") : "");
export const kisiAr = (k?: { ad: Yazi }) => (k ? yaz(k.ad, "ar") : "");
export const satir = (...parcalar: (string | undefined)[]) => parcalar.filter(Boolean).join(" / ");
