import type { Asama, UretimAdimi } from "./akis";
import { metin, yaz, type Anahtar, type Dil, type Metin, type Yazi } from "./dil";
import { BIRIM_ADI, EKIP_GOREV_ADI, GOREV_ADI, sehirAdi } from "./etiketler";
import { BIRIMLER, EKIP_GOREVLERI, GOREVLER, anlik, type Birim, type BirimId, type Durum, type EkipGorevi, type EkipGoreviId, type Gorev, type GorevId, type IcerikTuru, type Rol, type Sehir, type Ulke } from "./veri";

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
  /**
   * Birimdeki ünvanlar, kıdem sırasıyla (en üstte en kıdemli): Newsdesk'te
   * Executive Producer, Program Editor, Senior Producer… Yönetici
   * Organizasyon'da ekler, sıralar, çıkarır. Boşsa (eski yayın) ünvanın
   * `birimler` alanından.
   */
  unvanlar?: GorevId[];
  /**
   * Üst birim: yapı serbest derinlikte bir ağaç (Haber Merkezi › Input ›
   * Planlama). Kökler kadro: haber merkezi personeli ve dış muhabirler.
   * Üst birim yalnız düzen ve süzgeç için; izinler birimin kendisinden.
   */
  ust?: BirimId;
}

export interface UnvanTanimi {
  id: GorevId;
  ad?: Yazi;
  /** Hangi birimlerde seçilebilir; boşsa her birimde. */
  birimler: BirimId[];
  /** Eski yayında plandaki ekip görevi; artık ekip görevlerinin kuralından (Yapi.ekipGorevleri), yalnız eski yayını tamamlarken okunuyor. */
  ekipGorevi?: EkipGorevi;
  gizli?: boolean;
  /**
   * Bu ünvandaki haber merkezi personeli muhabir seçimlerinde (paket,
   * başlık, canlı yayın) dış muhabirlerle birlikte çıkıyor: görevlere giden
   * iç muhabir. Boşsa yerleşik "muhabir" ünvanı işaretli sayılıyor.
   */
  muhabir?: boolean;
  /**
   * Bu ünvana tayin edilen yönetici rolü alıyor (birim yöneticisi yetkileri).
   * Rol formda ayrıca seçilmiyor, ünvandan geliyor. Boşsa yerleşik
   * yönetici ve müdür ünvanları işaretli sayılıyor.
   */
  yonetici?: boolean;
}

/**
 * Plandaki çalışma ekibinin görevi (منتج تنفيذي, بلتن…): adı çıktıdaki
 * Arapçasıyla, sırası plandaki sırası. Kural kime yazılabileceğini
 * söylüyor: birimler (alt birimleriyle) ve ünvanlar; boş liste "hepsi"
 * (birim boşsa haber merkezinin tamamı, dış muhabir değil).
 */
export interface EkipGorevTanimi {
  id: EkipGoreviId;
  ad?: Yazi;
  gizli?: boolean;
  birimler: BirimId[];
  unvanlar: GorevId[];
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
  /** Plandaki ekip görevleri sırasıyla; eski yayında yok, okurken ünvanların ekip görevinden tamamlanıyor. */
  ekipGorevleri?: EkipGorevTanimi[];
  /** Planların akış adımlarını kimin yaptığı; yoksa ya da adım eksikse varsayılan (bugünkü davranış). */
  planYetkileri?: Partial<Record<PlanAdimi, AdimYetkisi>>;
  /** Yayınlayanın kısa notu: ne değişti. */
  not?: string;
}

/*
 * Planların akış adımları ve yetkilileri: toplantıya kim götürür, kim
 * onaylar, kim kesinleştirir. Koddaki sabit tablodan (yetki.ts → IZINLER)
 * çıkıp yapıya girdi ki tam yönetici kurumdaki değişikliği programcıya
 * gitmeden işlesin. Kural satırlardan biri ya da adıyla yazılan kişi:
 * satırda birim (alt birimleriyle), istenirse ünvan ve "yalnız
 * yöneticiler"; birimi ve ünvanı boş satır haber merkezinin tamamı.
 */
export const PLAN_ADIMLARI = ["ndToplanti", "ndOnay", "ndDevral", "hfToplanti", "hfKarar", "hfKesinlestir", "ozOnay"] as const;
export type PlanAdimi = (typeof PLAN_ADIMLARI)[number];

export interface YetkiSatiri {
  birim?: BirimId;
  unvan?: GorevId;
  yonetici?: boolean;
}

export interface AdimYetkisi {
  satirlar: YetkiSatiri[];
  kisiler: string[];
}

/* Bugünkü davranışın birebir karşılığı: yayınlanmamış yapıda hiçbir şey değişmesin. */
export const VARSAYILAN_PLAN_YETKILERI: Record<PlanAdimi, AdimYetkisi> = {
  ndToplanti: { satirlar: [{ birim: "planlama" }], kisiler: [] },
  ndOnay: { satirlar: [{ birim: "planlama", yonetici: true }, { birim: "yonetim" }], kisiler: [] },
  ndDevral: { satirlar: [{ birim: "newsdesk" }], kisiler: [] },
  hfToplanti: { satirlar: [{ birim: "planlama" }], kisiler: [] },
  hfKarar: { satirlar: [{ birim: "planlama" }, { birim: "yonetim" }], kisiler: [] },
  hfKesinlestir: { satirlar: [{ birim: "planlama", yonetici: true }, { birim: "yonetim" }], kisiler: [] },
  // Özel yayının hazırlığı ve onayı Planlama'nın denetiminde.
  ozOnay: { satirlar: [{ birim: "planlama", yonetici: true }], kisiler: [] },
};

export const planYetkisi = (adim: PlanAdimi, y: Yapi = yapi()): AdimYetkisi => y.planYetkileri?.[adim] ?? VARSAYILAN_PLAN_YETKILERI[adim];

/* Yeni birim örnek aldığı yerleşik birim "gibi" sayılıyor (izinBirimi), ağaçta altında olan da. */
export const yetkiSatirinaUyar = (k: { birim: BirimId; gorev: GorevId; rol: string }, s: YetkiSatiri, y: Yapi = yapi()) =>
  (s.birim ? izinBirimi(k.birim, y) === s.birim || altindaMi(k.birim, s.birim, y) : !disMuhabirMi(k, y)) &&
  (!s.unvan || k.gorev === s.unvan) &&
  (!s.yonetici || k.rol === "yonetici");

export const adimYetkilisi = (k: { id: string; birim: BirimId; gorev: GorevId; rol: string }, a: AdimYetkisi, y: Yapi = yapi()) =>
  a.kisiler.includes(k.id) || a.satirlar.some((s) => yetkiSatirinaUyar(k, s, y));

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

/* Yerleşik birimlerin başlangıçtaki ünvanları, kıdem sırasıyla (bugün birimde kullanılanlar). */
const VARSAYILAN_UNVANLAR: Record<Birim, GorevId[]> = {
  planlama: ["yonetici", "planlamaci", "stokTakip"],
  newsdesk: ["yonetici", "newsdesk", "editor", "sunucu"],
  newsgathering: ["yonetici", "koordinator"],
  program: ["yonetici", "programEditoru", "sunucu"],
  ekonomi: ["yonetici", "editor"],
  output: ["yonetici", "dilDenetmeni", "editor", "tercuman"],
  media: ["yonetici", "mediaManager"],
  yonetim: ["inputMuduru", "programMuduru", "koordinator"],
  muhabir: ["muhabir"],
};

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

/*
 * Varsayılan ağaç: iki kadro (haber merkezi, dış muhabirler), haber
 * merkezinin içinde bölümler (Input, Output, Program). Gruplar yerleşik
 * değil: kurum adını değiştirir, taşır, siler; izinleri yok, yalnız düzen.
 */
export const KOK_MERKEZ = "kHaberMerkezi";
export const KOK_DIS = "kDisMuhabirler";
const VARSAYILAN_GRUPLAR: { id: BirimId; ad: Anahtar; ust?: BirimId }[] = [
  { id: KOK_MERKEZ, ad: "orgKokMerkez" },
  { id: "bInput", ad: "orgBolumInput", ust: KOK_MERKEZ },
  { id: "bOutput", ad: "orgBolumOutput", ust: KOK_MERKEZ },
  { id: "bProgram", ad: "orgBolumProgram", ust: KOK_MERKEZ },
  { id: KOK_DIS, ad: "orgKokDis" },
];
const VARSAYILAN_UST: Record<Birim, BirimId> = {
  planlama: "bInput",
  newsdesk: "bInput",
  newsgathering: "bInput",
  ekonomi: "bInput",
  output: "bOutput",
  media: "bOutput",
  program: "bProgram",
  yonetim: KOK_MERKEZ,
  muhabir: KOK_DIS,
};

const dilde = (k: Anahtar): Metin => ({ tr: metin(k, "tr"), ar: metin(k, "ar"), en: metin(k, "en") });

/* Ekip görevlerinin kuralı eski yayında ünvanın ekip görevinden; yapımcı şefi Newsdesk'in yöneticisi (etiketler.ts'teki eski özel durum). */
const ekipKurallari = (unvanlar: UnvanTanimi[]): EkipGorevTanimi[] =>
  EKIP_GOREVLERI.map((id) =>
    id === "yapimciSef"
      ? { id, birimler: ["newsdesk"], unvanlar: ["yonetici"] }
      : { id, birimler: [], unvanlar: id === "diger" ? [] : unvanlar.filter((u) => u.ekipGorevi === id).map((u) => u.id) },
  );

let varsayilan: Yapi | null = null;
/* Tembel: veri.ts ile karşılıklı içe aktarma var, açılışta BIRIMLER henüz tanımsız olabilir. */
export const varsayilanYapi = (): Yapi => {
  if (varsayilan) return varsayilan;
  const unvanlar: UnvanTanimi[] = GOREVLER.map((id) => ({ id, birimler: [], ...(ESKI_EKIP[id] && { ekipGorevi: ESKI_EKIP[id] }) }));
  return (varsayilan = {
    surum: 0,
    id: "y0",
    zaman: "",
    yayinlayan: "",
    birimler: [
      // Grubun kendi ünvanı yok (boş liste): yoksa eski yayınla uyum için bütün ünvanları alıyordu.
      ...VARSAYILAN_GRUPLAR.map((g) => ({ id: g.id, ad: dilde(g.ad), unvanlar: [], ...(g.ust && { ust: g.ust }) })),
      ...BIRIMLER.map((id) => ({ id, unvanlar: VARSAYILAN_UNVANLAR[id], ust: VARSAYILAN_UST[id] })),
    ],
    unvanlar,
    akislar: [{ id: "uretim", kollar: ["haber", "feature", "ekonomi", "program"], duraklar: VARSAYILAN_DURAKLAR }],
    kolSahibi: { haber: "newsdesk", feature: "planlama", ekonomi: "planlama", program: "program" },
    ekipGorevleri: ekipKurallari(unvanlar),
  });
};

/*
 * Ağaçtan ve ekip görevlerinden önce yayınlanmış yapı: okurken eksikler
 * varsayılandan tamamlanıyor (gruplar, üst birimler, ekip kuralları), kurum
 * hiçbir şey yapmadan yeni düzeni görüyor. Kayıttaki sürüm değişmiyor;
 * yönetici bir sonraki yayında tamamlanmış hali yayınlıyor.
 */
const tamamlanan = new WeakMap<Yapi, Yapi>();
export const tamamla = (y: Yapi): Yapi => {
  if (y.surum === 0 || (y.ekipGorevleri && y.birimler.some((b) => b.ust))) return y;
  const hazir = tamamlanan.get(y);
  if (hazir) return hazir;
  let birimler = y.birimler;
  if (!birimler.some((b) => b.ust)) {
    const v = varsayilanYapi();
    const gruplar = v.birimler.filter((b) => VARSAYILAN_GRUPLAR.some((g) => g.id === b.id) && !birimler.some((x) => x.id === b.id));
    // Kurumun eski yayında açtığı birim örnek aldığı birimin kadrosuna: muhabir gibi çalışan dış muhabirlere, öbürü haber merkezine.
    birimler = [...gruplar, ...birimler.map((b) => ({ ...b, ust: yerlesikBirim(b.id) ? VARSAYILAN_UST[b.id] : b.ornek === "muhabir" ? KOK_DIS : KOK_MERKEZ }))];
  }
  const t = { ...y, birimler, ekipGorevleri: y.ekipGorevleri ?? ekipKurallari(y.unvanlar) };
  tamamlanan.set(y, t);
  return t;
};

/* --- Okuma --- */

/** Yayınlanmış en son yapı; yoksa varsayılan. */
export const guncelYapi = (d: Pick<Durum, "yapilar">): Yapi => {
  const y = d.yapilar ?? [];
  return y.length ? tamamla(y.reduce((a, b) => (b.surum > a.surum ? b : a))) : varsayilanYapi();
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
  const y = anlik()?.yapilar?.find((x) => x.surum === surum);
  return y ? tamamla(y) : yapi();
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
  // Şehir ünvanının adı her an şehirden: şehir sonradan eklense ya da adı değişse de yapı yayınlamak gerekmesin.
  if (id.startsWith(SEHIR_UNVANI)) return metin("yerMuhabiri", undefined, { yer: sehirAdi(id.slice(SEHIR_UNVANI.length)) });
  const t = y.unvanlar.find((u) => u.id === id);
  if (t?.ad) return yaz(t.ad);
  return yerlesikGorev(id) ? metin(GOREV_ADI[id as Gorev]) : id;
};

/** Seçimlerde görünen birimler (gizli olmayanlar); `dahil` gizli de olsa listede kalsın (kişinin şimdiki birimi). */
export const birimListesi = (dahil?: BirimId, y: Yapi = yapi()): BirimId[] => y.birimler.filter((b) => !b.gizli || b.id === dahil).map((b) => b.id);

/** Birimin ünvanları kıdem sırasıyla (gizliler dahil). */
export const birimUnvanlari = (birim: BirimId, y: Yapi = yapi()): GorevId[] => {
  const b = y.birimler.find((x) => x.id === birim);
  if (b?.unvanlar) return b.unvanlar.filter((id) => y.unvanlar.some((u) => u.id === id));
  return y.unvanlar.filter((u) => !u.birimler.length || u.birimler.includes(birim)).map((u) => u.id);
};

/**
 * Seçimde görünen ünvanlar: birim verilirse onun ünvanları kıdem sırasıyla;
 * birimin henüz ünvanı yoksa hepsi (yeni birime tayin yarım kalmasın).
 * `dahil` gizli ya da birim dışı da olsa listede (kişinin şimdiki ünvanı).
 */
export const unvanListesi = (birim?: BirimId, dahil?: GorevId, y: Yapi = yapi()): GorevId[] => {
  const gorunur = (id: GorevId) => !y.unvanlar.find((u) => u.id === id)?.gizli;
  // Birim verilince yalnız onun ünvanları: grup düğümünde ya da ünvansız birimde bütün ünvanlara düşmek
  // kişiyi birimde olmayan görevle ("Input · Planlamacı") kaydettiriyordu.
  // Grup (iş akışında sorumlu olabiliyor) altındaki birimlerin ünvanlarını topluyor; kişi formlarında grup seçilemiyor.
  const kaynak = birim ? (grupMu(birim, y) ? y.birimler.filter((b) => altindaMi(b.id, birim, y) && b.id !== birim).flatMap((b) => birimUnvanlari(b.id, y)) : birimUnvanlari(birim, y)) : [];
  const l = birim ? [...new Set(kaynak)].filter(gorunur) : y.unvanlar.filter((u) => !u.gizli).map((u) => u.id);
  return dahil && !l.includes(dahil) ? [...l, dahil] : l;
};

/** Seçili görev birimde yoksa birimin ilk ünvanı (ünvansız birimde boş): form birim değişince eski görevle kalmasın. */
export const birimeUygunUnvan = (birim: BirimId, gorev: GorevId, y: Yapi = yapi()): GorevId => {
  const l = unvanListesi(birim, undefined, y);
  return l.includes(gorev) ? gorev : (l[0] ?? "");
};

/* --- Ağaç --- */

export const ustBirim = (id: BirimId, y: Yapi = yapi()): BirimId | undefined => y.birimler.find((b) => b.id === id)?.ust;

/** Birimin üstleri, yakından uzağa; bozuk (döngülü) kayıtta sonsuza gitmesin. */
export const ustBirimler = (id: BirimId, y: Yapi = yapi()): BirimId[] => {
  const l: BirimId[] = [];
  for (let u = ustBirim(id, y); u && !l.includes(u) && u !== id; u = ustBirim(u, y)) l.push(u);
  return l;
};

/** Birim `ata`nın kendisi ya da altında mı. */
export const altindaMi = (id: BirimId, ata: BirimId, y: Yapi = yapi()) => id === ata || ustBirimler(id, y).includes(ata);

export interface AgacSatiri {
  id: BirimId;
  derinlik: number;
}

/**
 * Birimler ağaç sırasıyla (her birimin altında alt birimleri, dizideki
 * sırayla) ve derinlikleriyle: seçimlerde girintili, Organizasyon'da iç içe.
 * Üstü bulunamayan birim kök sayılıyor.
 */
export const birimAgaci = (y: Yapi = yapi(), gizliDahil = true): AgacSatiri[] => {
  const ids = new Set(y.birimler.map((b) => b.id));
  const l: AgacSatiri[] = [];
  const gez = (ust: BirimId | undefined, derinlik: number) => {
    for (const b of y.birimler) {
      const kok = !b.ust || !ids.has(b.ust) || b.ust === b.id;
      if ((ust === undefined ? kok : b.ust === ust && !kok) && !l.some((x) => x.id === b.id) && (gizliDahil || !b.gizli)) {
        l.push({ id: b.id, derinlik });
        gez(b.id, derinlik + 1);
      }
    }
  };
  gez(undefined, 0);
  return l;
};

/** Grup düğümü (Haber merkezi, Input…): altında birim var, kendi ünvanı yok. Kişi gruba değil birime yazılır. */
export const grupMu = (id: BirimId, y: Yapi = yapi()): boolean => {
  const b = y.birimler.find((x) => x.id === id);
  return !!b && !b.unvanlar?.length && y.birimler.some((x) => x.ust === id && x.id !== id);
};

/** Kişinin yazılabileceği birimler (grup değil). */
export const kisiBirimleri = (y: Yapi = yapi()): BirimId[] => birimListesi(undefined, y).filter((b) => !grupMu(b, y));

/** Kişi formlarındaki birim seçimi: ağaç sırasıyla, gruplar başlık (seçilemez); `dahil` gizli de olsa listede. */
export const kisiBirimSecenekleri = (dahil?: BirimId, y: Yapi = yapi()): (AgacSatiri & { grup: boolean })[] => {
  const l = birimAgaci(y, false).map((s) => ({ ...s, grup: grupMu(s.id, y) }));
  if (dahil && !l.some((s) => s.id === dahil) && y.birimler.some((b) => b.id === dahil)) l.push({ id: dahil, derinlik: 0, grup: false });
  return l;
};

/** Seçimdeki girintili ad: alt birim üstünün altında okunsun. */
export const agacAdi = (s: AgacSatiri, y: Yapi = yapi()) => `${"\u00a0\u00a0".repeat(s.derinlik)}${s.derinlik ? "› " : ""}${birimAdi(s.id, y)}`;

/* --- Kadro: dış muhabir ve iç muhabir --- */

/** Dış muhabir: muhabir birimi ya da onun gibi çalışan birim (planlamanın iletişim kurduğu muhabirler). */
export const disMuhabirMi = (k: { birim: BirimId }, y: Yapi = yapi()) => izinBirimi(k.birim, y) === "muhabir";

/** Ünvan muhabir seçimlerinde çıkıyor mu (yönetici işaretler; yerleşik "muhabir" işaretli). */
export const unvanMuhabirMi = (id: GorevId, y: Yapi = yapi()) => y.unvanlar.find((u) => u.id === id)?.muhabir ?? id === "muhabir";

/*
 * Dış muhabirin ünvanı şehrinden: "Gazze muhabiri", "مراسل غزة" (kurumun
 * isteği; önce ülkede tek muhabir varsa ülke adı veriliyordu). Kimlik
 * şehirden (`muhabir-s-<şehir>`), adı `gorevAdi`'nda şehirden türüyor.
 * Eski ülke ünvanı (`muhabir-<ülke>`) okunur, yenisi verilmez.
 */
const SEHIR_UNVANI = "muhabir-s-";
export const ulkeMuhabirUnvaniId = (ulke: Ulke): GorevId => `muhabir-${ulke}`;
export const sehirMuhabirUnvaniId = (sehir: Sehir): GorevId => `${SEHIR_UNVANI}${sehir}`;

/* Yerin adı dile göre: eklenen şehrin adı dil tablosunda değil kayıtta. */
const yerUnvani = (id: GorevId, yer: (d: Dil) => string): UnvanTanimi => ({
  id,
  birimler: [],
  muhabir: true,
  ad: { tr: metin("yerMuhabiri", "tr", { yer: yer("tr") }), ar: metin("yerMuhabiri", "ar", { yer: yer("ar") }), en: metin("yerMuhabiri", "en", { yer: yer("en") }) },
});

/** Sistemin verdiği muhabir ünvanı (genel ya da yere göre): kurulum bunları yeniden hesaplıyor, elle verilene dokunmuyor. */
export const otomatikMuhabirUnvaniMi = (id: GorevId) => id === "muhabir" || id.startsWith("muhabir-");

/** Kişinin olması gereken yer ünvanı (şehrinden). */
export const muhabirYerUnvani = (k: { sehir: Sehir }): UnvanTanimi => yerUnvani(sehirMuhabirUnvaniId(k.sehir), (d) => sehirAdi(k.sehir, d));

/** Kişinin olması gereken ünvanı: dış muhabirde sistemin verdiği ünvan şehirden; elle verilene ve öbür birimlere dokunulmaz. */
export const yerUnvaniUygula = <K extends { birim: BirimId; gorev: GorevId; sehir: Sehir }>(k: K, y: Yapi = yapi()): K =>
  disMuhabirMi(k, y) && otomatikMuhabirUnvaniMi(k.gorev) && k.gorev !== sehirMuhabirUnvaniId(k.sehir) ? { ...k, gorev: sehirMuhabirUnvaniId(k.sehir) } : k;

const YONETICI_UNVANLARI: GorevId[] = ["yonetici", "inputMuduru", "programMuduru"];

/** Ünvan yönetici rolü veriyor mu (Organizasyon'da işaretlenir; yerleşik yönetici ve müdürler işaretli). */
export const unvanYoneticiMi = (id: GorevId, y: Yapi = yapi()) => y.unvanlar.find((u) => u.id === id)?.yonetici ?? YONETICI_UNVANLARI.includes(id);

/**
 * Rol ünvandan: yönetici ünvanına gelen yönetici, yönetici ünvanından ayrılan
 * personel olur; öbür tayinlerde rol değişmez (kurucu planlamacı ama yönetici).
 */
export const unvandanRol = (gorev: GorevId, eski?: { rol: Rol; gorev: GorevId }, y: Yapi = yapi()): Rol => {
  if (unvanYoneticiMi(gorev, y)) return "yonetici";
  if (!eski || unvanYoneticiMi(eski.gorev, y)) return "personel";
  return eski.rol;
};

/** Haber merkezinde çalışıp görevlere giden muhabir: dış muhabirlerle birlikte seçilebiliyor. */
export const icMuhabirMi = (k: { birim: BirimId; gorev: GorevId }, y: Yapi = yapi()) => !disMuhabirMi(k, y) && unvanMuhabirMi(k.gorev, y);

/* --- Plan ekibi görevleri --- */

export const ekipGorevleri = (y: Yapi = yapi()): EkipGorevTanimi[] => tamamla(y).ekipGorevleri ?? [];

export const yerlesikEkipGorevi = (id: EkipGoreviId) => (EKIP_GOREVLERI as readonly string[]).includes(id);

/** Seçimde görünen ekip görevleri sırasıyla; `dahil` gizli de olsa (üyenin şimdiki görevi). */
export const ekipGorevListesi = (dahil?: EkipGoreviId, y: Yapi = yapi()): EkipGoreviId[] =>
  ekipGorevleri(y)
    .filter((g) => !g.gizli || g.id === dahil)
    .map((g) => g.id);

/** Görevin adı: çıktıdaki gibi varsayılan Arapça; yöneticinin verdiği ad, yoksa dil tablosu. */
export const ekipGorevAdi = (id: EkipGoreviId, d: Dil = "ar", y: Yapi = yapi()): string => {
  const g = ekipGorevleri(y).find((x) => x.id === id);
  if (g?.ad) return yaz(g.ad, d);
  return yerlesikEkipGorevi(id) ? metin(EKIP_GOREV_ADI[id as EkipGorevi], d) : id;
};

/**
 * Kişi bu ekip görevine yazılabilir mi: kuraldaki birimlerden birinin
 * (alt birimleri dahil) ve kuraldaki ünvanlardan birinin içinde. Boş birim
 * listesi haber merkezinin tamamı: dış muhabir ancak birimi açıkça
 * yazılırsa ekibe girer.
 */
export const ekipAdayi = (k: { birim: BirimId; gorev: GorevId }, id: EkipGoreviId, y: Yapi = yapi()) => {
  const g = ekipGorevleri(y).find((x) => x.id === id);
  if (!g) return false;
  const birimde = g.birimler.length ? g.birimler.some((b) => altindaMi(k.birim, b, y)) : !disMuhabirMi(k, y);
  return birimde && (!g.unvanlar.length || g.unvanlar.includes(k.gorev));
};

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

/* Birimin ünvan listesi; düzenlemeden önce eski yayının (birimler alanı) listesi açıkça yazılıyor. */
const unvanlariYaz = (y: Yapi, birim: BirimId, f: (l: GorevId[]) => GorevId[]): Yapi => {
  const l = f(birimUnvanlari(birim, y));
  return birimGuncelle(y, birim, (b) => ({ ...b, unvanlar: l }));
};

/** Birime ünvan: yeni ünvan tanımıyla ya da başka birimde olan ünvanın kimliğiyle; listenin sonuna (en az kıdemli). */
export const birimeUnvanEkle = (y: Yapi, birim: BirimId, u: GorevId | UnvanTanimi): Yapi => {
  const id = typeof u === "string" ? u : u.id;
  const y2 = typeof u === "string" ? y : { ...y, unvanlar: [...y.unvanlar, u] };
  return unvanlariYaz(y2, birim, (l) => (l.includes(id) ? l : [...l, id]));
};

/** Ünvanı birimden çıkarıyor; yerleşik değilse ve başka birimde de yoksa tanımı da siliniyor. */
export const birimdenUnvanCikar = (y: Yapi, birim: BirimId, id: GorevId): Yapi => {
  const y2 = unvanlariYaz(y, birim, (l) => l.filter((x) => x !== id));
  const baskaYerde = y2.birimler.some((b) => b.id !== birim && birimUnvanlari(b.id, y2).includes(id));
  return baskaYerde || yerlesikGorev(id) ? y2 : { ...y2, unvanlar: y2.unvanlar.filter((u) => u.id !== id) };
};

export const unvanTasi = (y: Yapi, birim: BirimId, i: number, j: number): Yapi =>
  unvanlariYaz(y, birim, (l) => {
    const k = [...l];
    const [x] = k.splice(i, 1);
    k.splice(j, 0, x);
    return k;
  });

export const akisGuncelle = (y: Yapi, id: string, f: (a: Akis) => Akis): Yapi => ({ ...y, akislar: y.akislar.map((a) => (a.id === id ? f(a) : a)) });

/** Birimi başka birimin altına (ya da köke) taşıyor; kendi altına taşınamaz (döngü). */
export const birimTasi = (y: Yapi, id: BirimId, ust: BirimId | undefined): Yapi => {
  if (ust && (ust === id || altindaMi(ust, id, y))) return y;
  return birimGuncelle(y, id, (b) => {
    const { ust: _, ...kalan } = b;
    return ust ? { ...kalan, ust } : kalan;
  });
};

/** Birimi aynı üstün altındaki komşusuyla yer değiştiriyor (ağaçtaki sıra dizinin sırası). */
export const birimSiraTasi = (y: Yapi, id: BirimId, yon: -1 | 1): Yapi => {
  const b = y.birimler.find((x) => x.id === id);
  if (!b) return y;
  const kardesler = y.birimler.filter((x) => (x.ust ?? "") === (b.ust ?? ""));
  const i = kardesler.indexOf(b);
  const komsu = kardesler[i + yon];
  if (!komsu) return y;
  const l = [...y.birimler];
  const a = l.indexOf(b);
  const c = l.indexOf(komsu);
  [l[a], l[c]] = [l[c], l[a]];
  return { ...y, birimler: l };
};

const ekipYaz = (y: Yapi, f: (l: EkipGorevTanimi[]) => EkipGorevTanimi[]): Yapi => ({ ...y, ekipGorevleri: f(ekipGorevleri(y)) });

export const ekipGoreviGuncelle = (y: Yapi, id: EkipGoreviId, f: (g: EkipGorevTanimi) => EkipGorevTanimi): Yapi => ekipYaz(y, (l) => l.map((g) => (g.id === id ? f(g) : g)));
export const ekipGoreviEkle = (y: Yapi, g: EkipGorevTanimi): Yapi => ekipYaz(y, (l) => [...l, g]);
/** Yerleşik görev silinmez (gizlenir): eski planlar onu taşıyor. */
export const ekipGoreviSil = (y: Yapi, id: EkipGoreviId): Yapi => (yerlesikEkipGorevi(id) ? y : ekipYaz(y, (l) => l.filter((g) => g.id !== id)));
export const ekipGorevTasi = (y: Yapi, id: EkipGoreviId, yon: -1 | 1): Yapi =>
  ekipYaz(y, (l) => {
    const i = l.findIndex((g) => g.id === id);
    const j = i + yon;
    if (i < 0 || j < 0 || j >= l.length) return l;
    const k = [...l];
    [k[i], k[j]] = [k[j], k[i]];
    return k;
  });

/** İki yapı aynı mı (yayınlanacak bir şey var mı); sürüm bilgileri sayılmıyor. */
export const ayniYapi = (a: Yapi, b: Yapi) => {
  const govde = (y: Yapi) => {
    const t = tamamla(y);
    const { birimler, unvanlar, akislar, kolSahibi, ekipGorevleri } = t;
    // Plan yetkileri adım adım: kayıtta olmayan adımla varsayılanın aynısı yazılmış adım eşit.
    const planYetkileri = PLAN_ADIMLARI.map((a) => planYetkisi(a, t));
    return JSON.stringify({ birimler, unvanlar, akislar, kolSahibi, ekipGorevleri, planYetkileri });
  };
  return govde(a) === govde(b);
};

/** Taslak ile yayındaki arasındaki değişiklikler: yayınlamadan önce yöneticiye liste olarak gösteriliyor. */
export interface Degisiklik {
  tur: "birim" | "unvan" | "akis" | "ekip" | "plan";
  id: string;
  islem: "eklendi" | "degisti" | "silindi";
}

export const yapiFarki = (eski: Yapi, yeni: Yapi): Degisiklik[] => {
  const yayindaki = tamamla(eski);
  const taslak = tamamla(yeni);
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
    ...karsilastir("ekip", yayindaki.ekipGorevleri ?? [], taslak.ekipGorevleri ?? []),
    // Adım yoksa varsayılanı geçerli: varsayılanın aynısını yazmak değişiklik sayılmıyor.
    ...PLAN_ADIMLARI.filter((a) => JSON.stringify(planYetkisi(a, yayindaki)) !== JSON.stringify(planYetkisi(a, taslak))).map((id) => ({ tur: "plan" as const, id, islem: "degisti" as const })),
  ];
};
