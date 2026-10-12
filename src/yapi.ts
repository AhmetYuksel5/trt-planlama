import type { Asama, UretimAdimi } from "./akis";
import { metin, yaz, type Yazi } from "./dil";
import { BIRIM_ADI, GOREV_ADI } from "./etiketler";
import { BIRIMLER, GOREVLER, anlik, type Birim, type BirimId, type Durum, type EkipGorevi, type Gorev, type GorevId, type IcerikTuru } from "./veri";

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
  /**
   * Yöneticinin açtığı birim hangi yerleşik birim gibi çalışıyor: sayfa ve
   * işlem izinleri, ana sayfanın varsayılanı ondan. Boşsa yalnız herkese
   * açık sayfalar ve akışta kendisine düşen duraklar.
   */
  ornek?: Birim;
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
  /** Sorumlu işi gerekçeyle geri gönderebiliyor (metin kontrolü, dil denetimi). */
  geriGonderir?: boolean;
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
  /** Yayınlayanın kısa notu: ne değişti. */
  not?: string;
}

/* --- Varsayılan: bugünkü sabitler (rapor bölüm 2 ve 4, notlardaki beş aşama) --- */

const VARSAYILAN_DURAKLAR: Durak[] = [
  { id: "gorevlendirme", tur: "gorevlendirme", sorumlu: { tur: "birim", birim: "newsgathering" }, kosul: "saha", asama: "newsgathering" },
  { id: "newsdesk", tur: "newsdesk", sorumlu: { tur: "kol" }, asama: "newsdesk" },
  { id: "metin", tur: "metin", sorumlu: { tur: "birim", birim: "muhabir" }, asama: "uretim" },
  // Belgede "Newsdesk / Output" metin kontrolünü birlikte yapıyor.
  { id: "kontrol", tur: "kontrol", sorumlu: { tur: "birim", birim: "output" }, yardimci: ["newsdesk"], geriGonderir: true, asama: "uretim" },
  { id: "dil", tur: "dil", sorumlu: { tur: "birim", birim: "output" }, geriGonderir: true, asama: "uretim" },
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

/**
 * İzinlerde birimin yerine geçen yerleşik birim: yerleşik birim kendisi,
 * yöneticinin açtığı birim örnek aldığı birim. Birime özel davranış
 * (Planlama planı yapar…) yine yalnız yerleşik birimde.
 */
export const izinBirimi = (id: BirimId, y: Yapi = yapi()): BirimId => (yerlesikBirim(id) ? id : (y.birimler.find((b) => b.id === id)?.ornek ?? id));

/* --- Düzenleme: saf, taslak üzerinde (eylemler.ts → yapiTaslagi) --- */

/** Değişikliğin dokunduğu kayıt: silmeden ve gizlemeden önce yöneticiye söyleniyor. */
export interface Etki {
  kisiler: number;
  duraklar: number;
}

const durakAdiGeciyor = (d: Durak, f: (s: Sorumlu) => boolean) => f(d.sorumlu);

export const birimEtkisi = (y: Yapi, kisiler: { birim: BirimId }[], id: BirimId): Etki => ({
  kisiler: kisiler.filter((k) => k.birim === id).length,
  duraklar:
    y.akislar.flatMap((a) => a.duraklar).filter((d) => d.yardimci?.includes(id) || durakAdiGeciyor(d, (s) => (s.tur === "birim" && s.birim === id) || (s.tur === "unvan" && s.birim === id))).length +
    Object.values(y.kolSahibi).filter((b) => b === id).length,
});

export const unvanEtkisi = (y: Yapi, kisiler: { gorev: GorevId }[], id: GorevId): Etki => ({
  kisiler: kisiler.filter((k) => k.gorev === id).length,
  duraklar: y.akislar.flatMap((a) => a.duraklar).filter((d) => d.sorumlu.tur === "unvan" && d.sorumlu.unvan === id).length,
});

/** Yerleşik olmayan, hiçbir kişinin ve durağın bağlı olmadığı birim silinebilir; öbürü gizlenir. */
export const silinebilir = (e: Etki) => e.kisiler === 0 && e.duraklar === 0;

export const birimGuncelle = (y: Yapi, id: BirimId, f: (b: BirimTanimi) => BirimTanimi): Yapi => ({ ...y, birimler: y.birimler.map((b) => (b.id === id ? f(b) : b)) });
export const unvanGuncelle = (y: Yapi, id: GorevId, f: (u: UnvanTanimi) => UnvanTanimi): Yapi => ({ ...y, unvanlar: y.unvanlar.map((u) => (u.id === id ? f(u) : u)) });

export const akisGuncelle = (y: Yapi, id: string, f: (a: Akis) => Akis): Yapi => ({ ...y, akislar: y.akislar.map((a) => (a.id === id ? f(a) : a)) });

/** İki yapı aynı mı (yayınlanacak bir şey var mı); sürüm bilgileri sayılmıyor. */
export const ayniYapi = (a: Yapi, b: Yapi) => {
  const govde = ({ birimler, unvanlar, akislar, kolSahibi }: Yapi) => JSON.stringify({ birimler, unvanlar, akislar, kolSahibi });
  return govde(a) === govde(b);
};

/** Taslak ile yayındaki arasındaki değişiklikler: yayınlamadan önce yöneticiye liste olarak gösteriliyor. */
export interface Degisiklik {
  tur: "birim" | "unvan" | "akis";
  id: string;
  islem: "eklendi" | "degisti" | "silindi";
}

export const yapiFarki = (yayindaki: Yapi, taslak: Yapi): Degisiklik[] => {
  const karsilastir = <T extends { id: string }>(tur: Degisiklik["tur"], a: T[], b: T[]): Degisiklik[] => {
    const eski = new Map(a.map((x) => [x.id, JSON.stringify(x)]));
    const yeni = new Map(b.map((x) => [x.id, JSON.stringify(x)]));
    return [
      ...b.filter((x) => !eski.has(x.id)).map((x) => ({ tur, id: x.id, islem: "eklendi" as const })),
      ...b.filter((x) => eski.has(x.id) && eski.get(x.id) !== yeni.get(x.id)).map((x) => ({ tur, id: x.id, islem: "degisti" as const })),
      ...a.filter((x) => !yeni.has(x.id)).map((x) => ({ tur, id: x.id, islem: "silindi" as const })),
    ];
  };
  return [
    ...karsilastir("birim", yayindaki.birimler, taslak.birimler),
    ...karsilastir("unvan", yayindaki.unvanlar, taslak.unvanlar),
    ...karsilastir("akis", yayindaki.akislar, taslak.akislar),
  ];
};
