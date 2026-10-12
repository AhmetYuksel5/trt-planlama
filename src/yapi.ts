import type { Asama, UretimAdimi } from "./akis";
import { metin, yaz, type Yazi } from "./dil";
import { BIRIM_ADI, GOREV_ADI } from "./etiketler";
import { BIRIMLER, GOREVLER, anlik, type BirimId, type Durum, type EkipGorevi, type Gorev, type GorevId, type IcerikTuru } from "./veri";

/**
 * Kurumun yapısı veri olarak: birimler, ünvanlar ve haber üretim akışları.
 *
 * Bugüne kadar koda sabit yazılıydı; yönetici artık birimi, ünvanı ve
 * üretim yolunun duraklarını kendisi düzenliyor (Organizasyon). Varsayılan
 * yapı bugünkü sabitlerin birebir karşılığı: yönetici hiçbir şey
 * değiştirmezse program önceki gibi çalışıyor.
 *
 * Yapı sürümlü: yönetici taslakta çalışıyor, "Yayınla" yeni sürüm açıyor
 * (`Durum.yapilar`). Üretime giren paket o anki akışın sürümünü taşıyor
 * (`Paket.akis`), sonradan yayınlanan düzen yalnız yeni paketlere
 * uygulanıyor; yarım iş bozulmuyor.
 *
 * Yerleşik birim ve ünvanın programda özel davranışı var (Planlama planı
 * yapar, muhabir metin yazar…): adı değişir, gizlenir ama silinmez.
 * Yöneticinin açtığı birim ve ünvanın davranışı yetki matrisinden ve
 * akıştaki duraklardan geliyor.
 */

export interface BirimTanimi {
  id: BirimId;
  /** Yerleşikte boşsa dil tablosundaki ad. */
  ad?: Yazi;
  gizli?: boolean;
}

export interface UnvanTanimi {
  id: GorevId;
  ad?: Yazi;
  /** Hangi birimlerde seçilebilir; boşsa her birimde. */
  birimler: BirimId[];
  /** Plandaki çalışma ekibinde hangi görevin listesine düşüyor. */
  ekipGorevi?: EkipGorevi;
  gizli?: boolean;
}

/**
 * Durağın sorumlusu: kolun sahibi (haber Newsdesk, feature/ekonomi
 * Planlama'nın stok ekibi, program Program), bir birim, bir birimdeki
 * ünvan ya da belirli kişiler.
 */
export type Sorumlu =
  | { tur: "kol" }
  | { tur: "birim"; birim: BirimId }
  | { tur: "unvan"; unvan: GorevId; birim?: BirimId }
  | { tur: "kisi"; kisiler: string[] };

/**
 * Durağın türü programın bildiği davranışlardan biri (görevlendirme,
 * metin, kontrol…; ekranları ve eylemleri hazır) ya da genel "iş":
 * sorumlu işini yapıp "tamamla" diyor.
 */
export type DurakTuru = UretimAdimi | "is";

export interface Durak {
  id: string;
  tur: DurakTuru;
  /** Boşsa türün dil tablosundaki adı. */
  ad?: Yazi;
  sorumlu: Sorumlu;
  /** Düğmeyi sorumluyla birlikte gören birimler (metin kontrolünde Newsdesk/Output gibi). */
  yardimci?: BirimId[];
  /** "saha": yalnız sahada çekim gerekiyorsa yola giriyor. */
  kosul?: "saha";
  asama: Asama;
}

export interface Akis {
  id: string;
  ad?: Yazi;
  /** Bu akışı varsayılan alan kollar. */
  kollar: IcerikTuru[];
  duraklar: Durak[];
}

export interface Yapi {
  /** 0: koddaki varsayılan; yayınlanan her düzen bir artırıyor. */
  surum: number;
  id: string;
  zaman: string;
  yayinlayan: string;
  birimler: BirimTanimi[];
  unvanlar: UnvanTanimi[];
  akislar: Akis[];
  kolSahibi: Record<IcerikTuru, BirimId>;
}

/* --- Varsayılan: bugünkü sabitler (rapor bölüm 2 ve 4, notlardaki beş aşama) --- */

const VARSAYILAN_DURAKLAR: Durak[] = [
  { id: "gorevlendirme", tur: "gorevlendirme", sorumlu: { tur: "birim", birim: "newsgathering" }, kosul: "saha", asama: "newsgathering" },
  { id: "newsdesk", tur: "newsdesk", sorumlu: { tur: "kol" }, asama: "newsdesk" },
  { id: "metin", tur: "metin", sorumlu: { tur: "birim", birim: "muhabir" }, asama: "uretim" },
  // Belgede "Newsdesk / Output" metin kontrolünü birlikte yapıyor.
  { id: "kontrol", tur: "kontrol", sorumlu: { tur: "birim", birim: "output" }, yardimci: ["newsdesk"], asama: "uretim" },
  { id: "dil", tur: "dil", sorumlu: { tur: "birim", birim: "output" }, asama: "uretim" },
  { id: "video", tur: "video", sorumlu: { tur: "birim", birim: "muhabir" }, asama: "uretim" },
  { id: "iletim", tur: "iletim", sorumlu: { tur: "kol" }, asama: "teknik" },
  { id: "media", tur: "media", sorumlu: { tur: "birim", birim: "media" }, asama: "teknik" },
  { id: "inews", tur: "inews", sorumlu: { tur: "kol" }, asama: "teknik" },
];

/* Yerleşik ünvanların plandaki ekip görevi (etiketler.ts → varsayilanEkipGorevi'nin birime bakmayan kısmı). */
const ESKI_EKIP: Partial<Record<GorevId, EkipGorevi>> = {
  newsdesk: "bultenYapimcisi",
  sunucu: "sunucu",
  planlamaci: "muhabirMasasi",
  programEditoru: "roportajYapimcisi",
  tercuman: "tercuman",
  editor: "editor",
  dilDenetmeni: "editor",
};

let varsayilan: Yapi | null = null;
/* Tembel: veri.ts ile karşılıklı içe aktarma var, açılışta BIRIMLER henüz tanımsız olabilir. */
export const varsayilanYapi = (): Yapi =>
  (varsayilan ??= {
    surum: 0,
    id: "y0",
    zaman: "",
    yayinlayan: "",
    birimler: BIRIMLER.map((id) => ({ id })),
    unvanlar: GOREVLER.map((id) => ({ id, birimler: [], ...(ESKI_EKIP[id] && { ekipGorevi: ESKI_EKIP[id] }) })),
    akislar: [{ id: "uretim", kollar: ["haber", "feature", "ekonomi", "program"], duraklar: VARSAYILAN_DURAKLAR }],
    kolSahibi: { haber: "newsdesk", feature: "planlama", ekonomi: "planlama", program: "program" },
  });

/* --- Okuma --- */

/** Yayınlanmış en son yapı; yoksa varsayılan. */
export const guncelYapi = (d: Pick<Durum, "yapilar">): Yapi => {
  const y = d.yapilar ?? [];
  return y.length ? y.reduce((a, b) => (b.surum > a.surum ? b : a)) : varsayilanYapi();
};

/* Ekranlar her çizimde çok kez soruyor; kayıt değişmedikçe aynı nesne. */
let sonDizi: Durum["yapilar"] | undefined;
let sonYapi: Yapi | null = null;
export const yapi = (): Yapi => {
  const d = anlik();
  if (!d) return varsayilanYapi();
  if (!sonYapi || d.yapilar !== sonDizi) {
    sonDizi = d.yapilar;
    sonYapi = guncelYapi(d);
  }
  return sonYapi;
};

/** Belirli sürüm (paketin üretime girdiği düzen); bulunamazsa güncel. */
export const yapiSurumu = (surum: number | undefined): Yapi => {
  if (surum === undefined) return yapi();
  if (surum === 0) return varsayilanYapi();
  return anlik()?.yapilar?.find((y) => y.surum === surum) ?? yapi();
};

/* --- Adlar --- */


export const yerlesikBirim = (id: BirimId): id is (typeof BIRIMLER)[number] => (BIRIMLER as readonly string[]).includes(id);
export const yerlesikGorev = (id: GorevId): boolean => (GOREVLER as readonly string[]).includes(id);

/** Birimin ekrandaki adı: yöneticinin verdiği ad, yoksa dil tablosundaki. */
export const birimAdi = (id: BirimId | undefined, y: Yapi = yapi()): string => {
  if (!id) return "";
  const t = y.birimler.find((b) => b.id === id);
  if (t?.ad) return yaz(t.ad);
  return yerlesikBirim(id) ? metin(BIRIM_ADI[id]) : id;
};

export const gorevAdi = (id: GorevId | undefined, y: Yapi = yapi()): string => {
  if (!id) return "";
  const t = y.unvanlar.find((u) => u.id === id);
  if (t?.ad) return yaz(t.ad);
  return yerlesikGorev(id) ? metin(GOREV_ADI[id as Gorev]) : id;
};

/** Seçimlerde görünen birimler (gizli olmayanlar); `dahil` gizli de olsa listede kalsın (kişinin şimdiki birimi). */
export const birimListesi = (dahil?: BirimId, y: Yapi = yapi()): BirimId[] => y.birimler.filter((b) => !b.gizli || b.id === dahil).map((b) => b.id);

/** Birimde seçilebilen ünvanlar. */
export const unvanListesi = (birim?: BirimId, dahil?: GorevId, y: Yapi = yapi()): GorevId[] =>
  y.unvanlar.filter((u) => u.id === dahil || (!u.gizli && (!birim || !u.birimler.length || u.birimler.includes(birim)))).map((u) => u.id);

/** Ünvanın plandaki ekip görevi; tanımlı değilse undefined. */
export const unvanEkipGorevi = (id: GorevId, y: Yapi = yapi()): EkipGorevi | undefined => y.unvanlar.find((u) => u.id === id)?.ekipGorevi;
