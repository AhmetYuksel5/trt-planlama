import { metin, type Anahtar, type Metin } from "./dil";
import type { BirimId, IcerikTuru, Paket } from "./veri";
import type { Akis, Durak } from "./yapi";

/*
 * Üretim balonu (kullanıcı: paketin onayından sonra üretimin her aşamasını
 * hangi masanın yapacağı tiklerle seçilsin; tekrarlanan düzen bir kez şablon
 * olsun, sonra doğrudan seçilsin; standart yollar da istisnalar da böyle
 * verilsin, "Newsdesk aktif değil" diye bütün düzeni dondurmaya gerek kalmasın).
 *
 * Aşamalar kullanıcının çiziminden: görevlendirme → editoryal kontrol (stand,
 * metin, gfx parçaları) → dil denetimi → (gfx varsa grafik ekibi, video
 * kontrolüyle yan yana) → video kontrolü → yükleme (grafik montajda eklenir)
 * → yayın kararı. Yol pakete yazılır (`Paket.uretim`); akış motoru onu
 * kolun akışı yerine okur (akis.ts → paketAkisi). Editoryal kontrol ve dil
 * denetimi parçalı metnin aşamaları, grafik yan iş (yükleme onu bekler).
 */
export const URETIM_ASAMALARI = ["gorev", "editoryal", "dil", "grafik", "video", "yukleme", "yayin"] as const;
export type UretimAsamasi = (typeof URETIM_ASAMALARI)[number];
/** Aşamayı yapan masa (birim) ya da aşama atlanıyor. */
export type UretimMasasi = BirimId | "atla";
export type UretimYolHaritasi = Record<UretimAsamasi, UretimMasasi>;

export const URETIM_PARCALARI = ["stand", "metin", "gfx"] as const;
export type UretimParcasi = (typeof URETIM_PARCALARI)[number];
/** Editoryal kontrolün parçaları: metin hep var, stand ve gfx varsa. */
export interface UretimParcalari {
  stand?: boolean;
  gfx?: boolean;
}

export interface UretimYolu {
  /** Seçilen şablon; tikler ondan farklıysa istisna. */
  sablon?: string;
  yol: UretimYolHaritasi;
  parca: UretimParcalari;
  /** Grafik ekibinin gfx'i bitirdiği an; yükleme bunu bekliyor. */
  gfxTamam?: { kisiId: string; zaman: string };
}

export interface UretimSablonu {
  id: string;
  /** Yöneticinin verdiği ad; yerleşik şablonda boşsa dil tablosundaki ad. */
  ad?: string;
  yol: UretimYolHaritasi;
  parca: UretimParcalari;
  /** Bu kolların paketinde balon bu şablonla açılır. */
  kollar?: IcerikTuru[];
  /** Stok paketinde balon bu şablonla açılır. */
  stok?: boolean;
  olusturan?: string;
  zaman?: string;
}

export const ASAMA_ADI: Record<UretimAsamasi, Anahtar> = {
  gorev: "urGorev",
  editoryal: "urEditoryal",
  dil: "urDil",
  grafik: "urGrafik",
  video: "urVideo",
  yukleme: "urYukleme",
  yayin: "urYayin",
};
export const PARCA_ADI: Record<UretimParcasi, Anahtar> = { stand: "urStand", metin: "urMetin", gfx: "urGfx" };

/** Balonun sütunları: aşamaları yapabilen masalar. */
export const URETIM_MASALARI: BirimId[] = ["planlama", "newsdesk", "program", "ekonomi", "spor", "scriptEditor", "grafik"];

const yol = (gorev: UretimMasasi, editoryal: UretimMasasi, video: UretimMasasi, yukleme: UretimMasasi, yayin: UretimMasasi, dil: UretimMasasi = "scriptEditor"): UretimYolHaritasi => ({
  gorev,
  editoryal,
  dil,
  grafik: "grafik",
  video,
  yukleme,
  yayin,
});

/*
 * Kurumun bugünkü yolları (kullanıcı): günlük haber Newsdesk'te, Newsdesk
 * yokken Planlama'da; stokta tetkik Newsdesk editöründe, yükleme Planlama'da;
 * masalar kendi paketlerini yürütüyor. Kayıtta şablon yoksa bunlar geçerli.
 */
const YERLESIK: (UretimSablonu & { anahtar: Anahtar })[] = [
  { id: "u-gunluk", anahtar: "urSbGunluk", yol: yol("newsdesk", "newsdesk", "newsdesk", "newsdesk", "newsdesk"), parca: {} },
  { id: "u-gunluk-pl", anahtar: "urSbGunlukPlanlama", yol: yol("planlama", "planlama", "atla", "planlama", "planlama"), parca: {}, kollar: ["haber"] },
  { id: "u-stok", anahtar: "urSbStok", yol: yol("planlama", "newsdesk", "planlama", "planlama", "planlama"), parca: {}, kollar: ["feature"], stok: true },
  { id: "u-ekonomi", anahtar: "urSbEkonomi", yol: yol("ekonomi", "ekonomi", "ekonomi", "ekonomi", "ekonomi"), parca: {}, kollar: ["ekonomi"] },
  { id: "u-program", anahtar: "urSbProgram", yol: yol("program", "program", "program", "program", "program"), parca: {}, kollar: ["program"] },
  { id: "u-spor", anahtar: "urSbSpor", yol: yol("spor", "spor", "spor", "spor", "spor"), parca: {}, kollar: ["spor"] },
];
export const VARSAYILAN_URETIM_SABLONLARI: UretimSablonu[] = YERLESIK.map(({ anahtar: _a, ...s }) => s);

/** Kayıttaki şablonlar; hiç kaydedilmemişse yerleşikler. */
export const uretimSablonlari = (d: { uretimSablonlari?: UretimSablonu[] }): UretimSablonu[] =>
  d.uretimSablonlari?.length ? d.uretimSablonlari : VARSAYILAN_URETIM_SABLONLARI;

export const sablonAdi = (s: UretimSablonu): string => s.ad || metin(YERLESIK.find((y) => y.id === s.id)?.anahtar ?? "urSbAdsiz");

/** Paketin balonu hangi şablonla açılır: stok paketi stok şablonuyla, öbürü kolunun şablonuyla. */
export const paketSablonu = (d: { uretimSablonlari?: UretimSablonu[] }, p: Pick<Paket, "tur" | "stok">): UretimSablonu => {
  const l = uretimSablonlari(d);
  return (p.stok && l.find((s) => s.stok)) || l.find((s) => s.kollar?.includes(p.tur)) || l[0];
};

/** Aşama bu yolda mı: atlanan ve gfx'siz paketin grafiği yolda değil. */
export const asamaYolda = (u: Pick<UretimYolu, "yol" | "parca">, a: UretimAsamasi) => u.yol[a] !== "atla" && (a !== "grafik" || !!u.parca.gfx);

/** Tikler şablondan farklı mı (aşamalar ya da parçalar). */
export const istisnaAsamalari = (u: Pick<UretimYolu, "yol" | "parca">, s: UretimSablonu | undefined): UretimAsamasi[] =>
  !s
    ? []
    : URETIM_ASAMALARI.filter(
        (a) => (a === "editoryal" && (!!u.parca.stand !== !!s.parca.stand || !!u.parca.gfx !== !!s.parca.gfx)) || (asamaYolda(u, a) && u.yol[a] !== s.yol[a]),
      );

const dilde = (k: Anahtar): Metin => ({ tr: metin(k, "tr"), ar: metin(k, "ar"), en: metin(k, "en") });

/*
 * Yolun akışı: motor durakları bilir (görev verme, parçalı metin, video
 * kontrolü, yükleme, genel iş). Editoryal kontrol ve dil denetimi parçalı
 * metnin içinde (yetki.ts → parcaYapabilir), grafik yan iş; ikisi durak değil.
 */
export const URETIM_AKISI = "balon";
export const uretimAkisi = (u: UretimYolu): Akis => {
  const birim = (a: UretimAsamasi) => ({ tur: "birim" as const, birim: u.yol[a] as BirimId });
  const duraklar: Durak[] = [
    ...(u.yol.gorev !== "atla" ? [{ id: "newsdesk", tur: "newsdesk" as const, ad: dilde("urGorev"), sorumlu: birim("gorev"), asama: "newsdesk" as const }] : []),
    { id: "metin", tur: "metin", ad: dilde("urMetinDuragi"), sorumlu: { tur: "birim", birim: "muhabir" }, parcali: true, asama: "uretim" },
    ...(u.yol.video !== "atla" ? [{ id: "videoKontrol", tur: "videoKontrol" as const, ad: dilde("urVideo"), sorumlu: birim("video"), geriGonderir: true, asama: "uretim" as const }] : []),
    ...(u.yol.yukleme !== "atla" ? [{ id: "inews", tur: "inews" as const, ad: dilde("urYuklemeDuragi"), sorumlu: birim("yukleme"), asama: "teknik" as const }] : []),
    ...(u.yol.yayin !== "atla" ? [{ id: "yayin", tur: "is" as const, ad: dilde("urYayin"), sorumlu: birim("yayin"), asama: "teknik" as const }] : []),
  ];
  return { id: URETIM_AKISI, kollar: [], duraklar };
};

/** Parçanın muhabirden sonra gideceği aşama: editoryal kontrol, o atlanıyorsa dil, o da atlanıyorsa hazır. */
export const parcaIlkAsama = (p: Pick<Paket, "uretim">): "newsdesk" | "dil" | "tamam" =>
  !p.uretim || p.uretim.yol.editoryal !== "atla" ? "newsdesk" : p.uretim.yol.dil !== "atla" ? "dil" : "tamam";
/** Editoryal kontrolden sonra: dil, atlanıyorsa hazır. */
export const parcaDilSonrasi = (p: Pick<Paket, "uretim">): "dil" | "tamam" => (!p.uretim || p.uretim.yol.dil !== "atla" ? "dil" : "tamam");

/** Gfx bekliyor mu: parça gfx'li, grafik atlanmıyor, henüz bitmedi. */
export const gfxBekliyor = (p: Pick<Paket, "uretim">): boolean => !!p.uretim && asamaYolda(p.uretim, "grafik") && !p.uretim.gfxTamam;

/*
 * Grafik ekibinin sırası: gfx dil denetiminden geçince (bütün parçalar hazır)
 * açılır, video kontrolüyle yan yana yürür. Paket üretimde, metin durağını
 * geçmiş ya da parçaları hazır.
 */
export const gfxAcik = (p: Paket): boolean =>
  p.durum === "uretimde" && gfxBekliyor(p) && (p.adim !== "metin" && p.adim !== "newsdesk" ? true : !!p.parcalar?.length && p.parcalar.every((x) => x.asama === "tamam"));

/* Durakların sırası; aşamanın geçip geçmediği paketin bulunduğu durağa göre. */
const DURAK_SIRASI = ["newsdesk", "metin", "videoKontrol", "inews", "yayin"];
const ASAMA_DURAGI: Record<Exclude<UretimAsamasi, "grafik">, string> = { gorev: "newsdesk", editoryal: "metin", dil: "metin", video: "videoKontrol", yukleme: "inews", yayin: "yayin" };

/**
 * Üretimdeki pakette geçmiş aşamalar (balonda kilitli, eylem de değiştirmez):
 * bulunduğu duraktan önceki duraklar; editoryal kontrol ve dil metin durağı
 * geçilince; grafik gfx bitince. Üretime girmemiş pakette hiçbiri.
 */
export const gecenAsamalar = (p: Pick<Paket, "durum" | "adim" | "uretim">): UretimAsamasi[] => {
  if (p.durum !== "uretimde" || !p.uretim) return [];
  const i = DURAK_SIRASI.indexOf(p.adim ?? "");
  return URETIM_ASAMALARI.filter((a) => (a === "grafik" ? !!p.uretim!.gfxTamam : DURAK_SIRASI.indexOf(ASAMA_DURAGI[a]) < i || (ASAMA_DURAGI[a] === "metin" && i > 1)));
};

/** Yol değişince paketin durağı: bulunduğu durak yolda kalıyorsa o, yoksa yolda kalan bir sonraki; hiçbiri yoksa bitti. */
export const yeniDurak = (p: Pick<Paket, "adim">, u: UretimYolu): string | undefined => {
  const duraklar = uretimAkisi(u).duraklar.map((x) => x.id);
  if (duraklar.includes(p.adim ?? "")) return p.adim;
  return DURAK_SIRASI.slice(DURAK_SIRASI.indexOf(p.adim ?? "") + 1).find((x) => duraklar.includes(x));
};
