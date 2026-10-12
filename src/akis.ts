import { metin, yaz, type Anahtar } from "./dil";
import { anlik, type Birim, type BirimId, type IcerikTuru, type Paket } from "./veri";
import { yapi, yapiSurumu, type Akis, type Durak, type Sorumlu, type Yapi } from "./yapi";

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
 * Adımların sahibi, sırası ve adı artık kurum yapısında (yapi.ts): yönetici
 * akışı düzenleyebiliyor. Buradaki işlevler paketin üretime girdiği
 * sürümün akışını okuyor; varsayılan yapı bugünkü sabitlerle aynı.
 * "kol" sorumlusu içerik türüne göre değişiyor (rapor bölüm 4): haber/güncel
 * Newsdesk'te, feature/ekonomi Planlama'nın takip biriminde, program
 * Program Birimi'nde.
 */

/** Varsayılan kol sahipleri; yapıda değiştirilebiliyor (`kolSahibi`). */
export const KOL_SAHIBI: Record<IcerikTuru, Birim> = {
  haber: "newsdesk",
  feature: "planlama",
  ekonomi: "planlama",
  program: "program",
};

export const kolSahibi = (tur: IcerikTuru, y: Yapi = yapi()): BirimId => y.kolSahibi[tur] ?? KOL_SAHIBI[tur];

type AkisPaketi = Pick<Paket, "tur" | "sahaGerekli"> & Partial<Pick<Paket, "akis">>;

/** Kolun yeni paketlerde izleyeceği akış. */
export const akisSec = (tur: IcerikTuru, y: Yapi = yapi()): Akis => y.akislar.find((a) => a.kollar.includes(tur)) ?? y.akislar[0];

/** Paketin akışı: üretime girdiği sürümdeki akış; girmemişse kolun bugünkü akışı. */
export const paketAkisi = (p: AkisPaketi): Akis => {
  if (!p.akis) return akisSec(p.tur);
  const y = yapiSurumu(p.akis.surum);
  return y.akislar.find((a) => a.id === p.akis!.id) ?? akisSec(p.tur, y);
};

/** Paketin akış damgası: üretime girerken yazılıyor. */
export const akisDamgasi = (p: Pick<Paket, "tur">): { id: string; surum: number } => {
  const y = yapi();
  return { id: akisSec(p.tur, y).id, surum: y.surum };
};

export const durakBul = (p: AkisPaketi, id: string | undefined): Durak | undefined => (id ? paketAkisi(p).duraklar.find((d) => d.id === id) : undefined);

/** Sorumlunun birimi: kol sahibi, birim, ünvanın birimi ya da sorumlu kişinin birimi. */
export const sorumluBirimi = (s: Sorumlu, tur: IcerikTuru, y: Yapi = yapi()): BirimId => {
  if (s.tur === "kol") return kolSahibi(tur, y);
  if (s.tur === "birim") return s.birim;
  if (s.tur === "unvan") return s.birim ?? y.unvanlar.find((u) => u.id === s.unvan)?.birimler[0] ?? "";
  return anlik()?.kisiler.find((k) => k.id === s.kisiler[0])?.birim ?? "";
};

/** Durağın sahibi birim; durak bulunamazsa (silinmiş akış) kol sahibi. */
export const durakSahibi = (p: AkisPaketi, id: string): BirimId => {
  const d = durakBul(p, id);
  return d ? sorumluBirimi(d.sorumlu, p.tur) : kolSahibi(p.tur);
};

/** Varsayılan akışta adımın sahibi (örnek veri, yetki tablosu). */
export const adimSahibi = (adim: string, tur: IcerikTuru): BirimId => durakSahibi({ tur, sahaGerekli: true }, adim);

/** Durakta sorumluyla birlikte çalışan birimler. */
export const yardimciBirimler = (p: AkisPaketi, id: string): BirimId[] => durakBul(p, id)?.yardimci ?? [];

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

/** Durağın ekrandaki adı: yöneticinin verdiği, yoksa türün adı (stok kolunda kolun adı). */
export const adimAdi = (adim: string | undefined, p: AkisPaketi): string => {
  if (!adim) return "";
  const d = durakBul(p, adim);
  if (d?.ad) return yaz(d.ad);
  const tur = (d?.tur ?? adim) as UretimAdimi | "is";
  if (tur === "is") return adim;
  const anahtar = (kolSahibi(p.tur) === "planlama" && d?.sorumlu.tur === "kol" && STOK_ADIM_ADI[tur]) || ADIM_ADI[tur];
  return anahtar ? metin(anahtar) : adim;
};

/** Raporun Next Day şemasındaki kutu numarası; yöneticinin eklediği genel durakta yok. */
const ADIM_KUTUSU: Record<UretimAdimi, number> = {
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
export const adimKutusu = (p: AkisPaketi, adim: string): number | undefined => {
  const tur = durakBul(p, adim)?.tur;
  return tur && tur !== "is" ? ADIM_KUTUSU[tur] : undefined;
};

/** Paketin üretimde izleyeceği duraklar; koşulu tutmayan (saha yokken görevlendirme) atlanıyor. */
export const uretimYolu = (p: AkisPaketi): string[] => paketAkisi(p).duraklar.filter((d) => d.kosul !== "saha" || p.sahaGerekli).map((d) => d.id);

export const ilkAdim = (p: AkisPaketi): string => uretimYolu(p)[0];

/** Sıradaki durak; son duraktan sonra paket tamamlanıyor (rapor 10. kutu). */
export const sonrakiAdim = (p: AkisPaketi & Pick<Paket, "adim">): string | "tamam" => {
  const yol = uretimYolu(p);
  const i = yol.indexOf(p.adim ?? "");
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


/** Paket hangi aşamada; iptal edilmişse null. Tamamlanan paket beşinci aşamanın sonunda sayılıyor. */
export const asamaBul = (p: Paket): number | null => {
  if (p.durum === "iptal") return null;
  if (p.durum === "uretimde" && p.adim) return ASAMALAR.indexOf(durakBul(p, p.adim)?.asama ?? "uretim");
  if (p.durum === "tamamlandi") return ASAMALAR.length;
  return 0;
};

/**
 * Şu an işi elinde tutan birim; bitmiş ya da iptal edilmiş pakette kimse.
 * Haftalık toplantıda kabul edilen, bir Next Day planına bağlı olmayan
 * paket kolun sahibinde bekliyor: feature/ekonomi Planlama'nın stok
 * ekibinde, program Program biriminde.
 */
export const paketSahibi = (p: Paket): BirimId | null => {
  if (p.durum === "uretimde" && p.adim) return durakSahibi(p, p.adim);
  if (p.durum === "onaylandi" && !p.planId) return kolSahibi(p.tur);
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
