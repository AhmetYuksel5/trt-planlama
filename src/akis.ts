import type { Anahtar } from "./dil";
import type { Birim, IcerikTuru, Paket } from "./veri";

/**
 * İş akışı: bir paket önerisinin plandan yayına kadar izlediği yol.
 *
 * Dayanak üç belge:
 * - Rapor bölüm 2 (Next Day çalışma akışı, on kutu). 1-3. kutular planın
 *   kendisinde: öneri toplama, günlük plan, akşam toplantısı. 4-10.
 *   kutular paketin üretim adımları.
 * - Notlardaki beş aşama: Planlama, News Gathering, Newsdesk, Metin ve
 *   video, Teknik ve tamamlanma. Ekranda paketin "neresinde" sorusunun
 *   kaba cevabı bu; ince cevap üretim adımı.
 * - Promptun 4.4 maddesindeki paket önerisi durumları: Taslak,
 *   Değerlendiriliyor, Onaylandı, Üretimde, Tamamlandı, İptal edildi.
 *   "Üretimde" iken hangi kutuda olduğu `adim` alanında.
 *
 * News Gathering adımı yalnız saha gerekiyorsa yola giriyor. Metin
 * kontrolü belgede tek kutu ama iki elden geçiyor (Newsdesk/Output, sonra
 * dil denetmeni); ikisi ayrı adım, çünkü "kimde bekliyor" sorusu bunu
 * soruyor. Video linkini Media Manager'a iletmek de Newsdesk'in ayrı işi
 * (7. kutunun ikinci yarısı).
 */

export const URETIM_ADIMLARI = [
  "gorevlendirme",
  "newsdesk",
  "metin",
  "kontrol",
  "dil",
  "video",
  "iletim",
  "media",
  "inews",
] as const;
export type UretimAdimi = (typeof URETIM_ADIMLARI)[number];

/*
 * "kol" yazan adımların sahibi içerik türüne göre değişiyor (rapor bölüm 4):
 * haber/güncel Newsdesk'te, feature/ekonomi Planlama'nın takip biriminde,
 * program Program Birimi'nde. Ayrıntılı program akışı henüz tanımlanmadı;
 * şimdilik ortak adımlarda Program Birimi koordinatör olarak duruyor.
 */
const ADIM_SAHIBI: Record<UretimAdimi, Birim | "kol"> = {
  gorevlendirme: "newsgathering",
  newsdesk: "kol",
  metin: "muhabir",
  kontrol: "output",
  dil: "output",
  video: "muhabir",
  iletim: "kol",
  media: "media",
  inews: "kol",
};

export const KOL_SAHIBI: Record<IcerikTuru, Birim> = {
  haber: "newsdesk",
  feature: "planlama",
  ekonomi: "planlama",
  program: "program",
};

/* Belgede "Newsdesk / Output" metin kontrolünü birlikte yapıyor; düğme ikisine de görünsün. */
export const YARDIMCI_SAHIP: Partial<Record<UretimAdimi, Birim[]>> = {
  kontrol: ["newsdesk"],
};

export const adimSahibi = (adim: UretimAdimi, tur: IcerikTuru): Birim => {
  const s = ADIM_SAHIBI[adim];
  return s === "kol" ? KOL_SAHIBI[tur] : s;
};

export const ADIM_ADI: Record<UretimAdimi, Anahtar> = {
  gorevlendirme: "adGorevlendirme",
  newsdesk: "adNewsdesk",
  metin: "adMetin",
  kontrol: "adKontrol",
  dil: "adDil",
  video: "adVideo",
  iletim: "adIletim",
  media: "adMedia",
  inews: "adInews",
};

/*
 * Stok paketinde kolun adımları Planlama'nın feature/stok ekibinde ve
 * adları da onların işi: görev vermek, montajı kontrol edip sisteme
 * yüklemek. Ortak adımlar (metin, kontrol, dil, video, Media) aynı.
 */
const STOK_ADIM_ADI: Partial<Record<UretimAdimi, Anahtar>> = {
  newsdesk: "adStokGorev",
  inews: "adStokYukleme",
};

/** Adımın paketin koluna göre adı. */
export const adimAdi = (adim: UretimAdimi, p: Pick<Paket, "tur">): Anahtar =>
  (KOL_SAHIBI[p.tur] === "planlama" && STOK_ADIM_ADI[adim]) || ADIM_ADI[adim];

/** Raporun Next Day şemasındaki kutu numarası; detay ekranında "rapor adımı" diye görünüyor. */
export const ADIM_KUTUSU: Record<UretimAdimi, number> = {
  gorevlendirme: 4,
  newsdesk: 4,
  metin: 5,
  kontrol: 6,
  dil: 6,
  video: 7,
  iletim: 7,
  media: 8,
  inews: 9,
};

/** Paketin üretimde izleyeceği adımlar; saha yoksa News Gathering atlanıyor. */
export const uretimYolu = (p: Pick<Paket, "sahaGerekli">): UretimAdimi[] =>
  URETIM_ADIMLARI.filter((a) => a !== "gorevlendirme" || p.sahaGerekli);

export const ilkAdim = (p: Pick<Paket, "sahaGerekli">): UretimAdimi => uretimYolu(p)[0];

/** Sıradaki adım; son adımdan sonra paket tamamlanıyor (rapor 10. kutu). */
export const sonrakiAdim = (p: Paket): UretimAdimi | "tamam" => {
  const yol = uretimYolu(p);
  const i = yol.indexOf(p.adim as UretimAdimi);
  return i >= 0 && i < yol.length - 1 ? yol[i + 1] : "tamam";
};

/* --- Beş aşama --- */

export const ASAMALAR = ["planlama", "newsgathering", "newsdesk", "uretim", "teknik"] as const;
export type Asama = (typeof ASAMALAR)[number];

export const ASAMA_ADI: Record<Asama, Anahtar> = {
  planlama: "asPlanlama",
  newsgathering: "asNewsgathering",
  newsdesk: "asNewsdesk",
  uretim: "asUretim",
  teknik: "asTeknik",
};

const ADIM_ASAMASI: Record<UretimAdimi, Asama> = {
  gorevlendirme: "newsgathering",
  newsdesk: "newsdesk",
  metin: "uretim",
  kontrol: "uretim",
  dil: "uretim",
  video: "uretim",
  iletim: "teknik",
  media: "teknik",
  inews: "teknik",
};

/** Paket hangi aşamada; iptal edilmişse null. Tamamlanan paket beşinci aşamanın sonunda sayılıyor. */
export const asamaBul = (p: Paket): number | null => {
  if (p.durum === "iptal") return null;
  if (p.durum === "uretimde" && p.adim) return ASAMALAR.indexOf(ADIM_ASAMASI[p.adim as UretimAdimi]);
  if (p.durum === "tamamlandi") return ASAMALAR.length;
  return 0;
};

/**
 * Şu an işi elinde tutan birim; bitmiş ya da iptal edilmiş pakette kimse.
 * Haftalık toplantıda kabul edilen, bir Next Day planına bağlı olmayan
 * paket kolun sahibinde bekliyor: feature/ekonomi Planlama'nın stok
 * ekibinde, program Program biriminde.
 */
export const paketSahibi = (p: Paket): Birim | null => {
  if (p.durum === "uretimde" && p.adim) return adimSahibi(p.adim as UretimAdimi, p.tur);
  if (p.durum === "onaylandi" && !p.planId) return KOL_SAHIBI[p.tur];
  if (p.durum === "taslak" || p.durum === "degerlendiriliyor" || p.durum === "onaylandi") return "planlama";
  return null;
};

/* --- Stok haberleri --- */

/*
 * Stok paketinin yolu ayrıca saklanmıyor, kayıttan çıkıyor: onaylandı ama
 * üretime alınmadı (bekliyor), üretimde, bitti ve stokta, bir plana
 * seçilip plan devredilince yayınlandı.
 */
export const STOK_DURUMLARI = ["bekliyor", "uretimde", "stokta", "yayinlandi"] as const;
export type StokDurumu = (typeof STOK_DURUMLARI)[number];

export const stokDurumu = (p: Paket): StokDurumu | null => {
  if (!p.stok || p.durum === "iptal" || p.durum === "taslak" || p.durum === "degerlendiriliyor") return null;
  if (p.yayinlandi) return "yayinlandi";
  if (p.durum === "tamamlandi") return "stokta";
  return p.durum === "uretimde" ? "uretimde" : "bekliyor";
};

/** Teslim zamanı geçmiş ve henüz bitmemiş iş. */
export const geciktiMi = (p: Paket, an = Date.now()) =>
  p.durum === "uretimde" && !!p.teslim && new Date(p.teslim).getTime() < an;

/* --- Raporun Next Day şeması (proje planı sayfasında çiziliyor) --- */

export interface Kutu {
  no: number;
  baslik: Anahtar;
  aciklama: Anahtar;
  birimler: Birim[];
  vakit: Anahtar;
}

export const NEXTDAY_KUTULARI: Kutu[] = [
  { no: 1, baslik: "k1", aciklama: "k1a", birimler: ["planlama", "muhabir"], vakit: "vSabah" },
  { no: 2, baslik: "k2", aciklama: "k2a", birimler: ["planlama"], vakit: "vGunIci" },
  { no: 3, baslik: "k3", aciklama: "k3a", birimler: ["planlama"], vakit: "vAksam" },
  { no: 4, baslik: "k4", aciklama: "k4a", birimler: ["newsdesk"], vakit: "vErtesiGun" },
  { no: 5, baslik: "k5", aciklama: "k5a", birimler: ["muhabir"], vakit: "vErtesiGun" },
  { no: 6, baslik: "k6", aciklama: "k6a", birimler: ["output"], vakit: "vErtesiGun" },
  { no: 7, baslik: "k7", aciklama: "k7a", birimler: ["muhabir", "newsdesk"], vakit: "vErtesiGun" },
  { no: 8, baslik: "k8", aciklama: "k8a", birimler: ["media"], vakit: "vErtesiGun" },
  { no: 9, baslik: "k9", aciklama: "k9a", birimler: ["newsdesk"], vakit: "vErtesiGun" },
  { no: 10, baslik: "k10", aciklama: "k10a", birimler: ["newsdesk"], vakit: "vErtesiGun" },
];
