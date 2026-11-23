import { stokDurumu } from "./akis";
import { bitmisMi, bitmisTarihi, surenPaketGunu } from "./bitmisPaket";
import { oneriHaftada, oneriPlanGunu } from "./oneriPlanlari";
import { oneriSekmesi } from "./oneriSekmeleri";
import { gunEkle, gunFarki, haftaBasi, planlananHafta } from "./tarih";
import type { Durum, HaftalikKalem, Kisi, NextDayPlan, Oneri, Paket } from "./veri";
import { planIcerikDuzenler } from "./yetki";

/*
 * Stok haberler / Programlar sayfası (kullanıcı: Programlar'ın kutucuklu
 * tasarımı; orada çalışan bir yandan gelecek haftanın tekliflerini topluyor,
 * bir yandan daha önce planladığının üretimini izliyor, bir yandan stoktaki
 * paketleri kontrol edip planlara ekliyor; listeler tarihe ya da muhabire
 * göre). Saf kurallar, saklanmaz; ekran ekranlar/StokSayfasi.tsx.
 */

export const STOK_BOLUMLERI = ["teklifler", "uretim", "stokta", "programlar", "arsiv"] as const;
export type StokBolumu = (typeof STOK_BOLUMLERI)[number];

/* --- Teklifler: gelecek haftanın Weekly'si --- */

/*
 * Tekliflerin toplandığı hafta: Perşembe toplantısı gelecek haftayı (Cumartesi
 * başlar) kesinleştiriyor; o hafta kesinleştiyse toplama bir sonrakine geçer.
 */
export const teklifHaftasi = (d: Pick<Durum, "haftalik">, b: string): string => {
  const gelecek = planlananHafta(b);
  return d.haftalik.some((h) => h.baslangic === gelecek && h.durum === "kesinlesti") ? gunEkle(gelecek, 7) : gelecek;
};

/*
 * Stok ve programların teklifi: masası haber olmayan (feature, ekonomi,
 * program, spor) ya da günü olmayan (yalnız haftası, "zamana bağlı değil").
 * Weekly'de bunlar "Stok ve programlar"a girip toplantıda aynı kararlarla
 * değerlendiriliyor.
 */
export const stokTeklifiMi = (o: Oneri) => o.tur !== "haber" || (!o.hedefTarih && !o.haftaGunu);

/*
 * Haftaya gelen, kararı bekleyen teklifler: Öneriler'in "Karar bekleyen"
 * kuralı (gündeme ya da plana girmiş, sırası başkasında, arşivdeki değil;
 * oneriSekmeleri.ts). Gündeme eklenen teklif listeden düşer, gündemin
 * kalemlerinde görünür.
 */
export const haftaTeklifleri = (d: Durum, hafta: string, b: string): Oneri[] =>
  d.oneriler.filter((o) => oneriHaftada(o, { baslangic: hafta }) && oneriSekmesi(d, o, b) === "karar");

/** Haftanın "Stok ve programlar" bölümündeki kalemler (günü olmayan). */
export const haftaStokKalemleri = (d: Pick<Durum, "haftalik">, hafta: string): HaftalikKalem[] =>
  d.haftalik.find((h) => h.baslangic === hafta)?.kalemler.filter((k) => !k.tarih) ?? [];

/** Teklifin listedeki günü: plana girdiyse planın günü, yoksa ilk günü; yalnız haftası olan günsüz. */
export const teklifGunu = (o: Oneri): string | undefined => oneriPlanGunu(o) ?? o.haftaGunu;

/* --- Üretim: daha önce planlananın takibi --- */

/*
 * Üretime alınacak: onaylı, akışa girmemiş (stok ekibi "Üretime al"ı yapacak).
 * Üretimde: akışta, plansız görevde muhabirde, özel yayın dosyası
 * hazırlanırken. Kural stokDurumu'ndan (akis.ts), listeler ayrışmasın.
 */
export const URETIM_ALANLARI = ["alinacak", "uretimde"] as const;
export type UretimAlani = (typeof URETIM_ALANLARI)[number];
export const uretimAlani = (p: Paket): UretimAlani | null => {
  const s = stokDurumu(p);
  return s === "bekliyor" ? "alinacak" : s === "uretimde" ? "uretimde" : null;
};

/* --- Stokta: kontrol ve planlara ekleme --- */

/*
 * Stoktaki paketin seçildiği plan: Next Day'in hazır paketlerinde duruyor,
 * henüz yayına çıkmadı (plan onaylanınca ya da günü geçince yayınlandı olur,
 * eylemler.ts → hazirYayiniEsitle; paket o zaman arşive geçer).
 */
export const stokPlani = (d: Pick<Durum, "planlar">, p: Paket): NextDayPlan | undefined => d.planlar.find((x) => x.hazirPaketler.includes(p.id));

export const STOKTA_ALANLARI = ["bekleyen", "planda"] as const;
export type StoktaAlani = (typeof STOKTA_ALANLARI)[number];
export const stoktaAlani = (d: Pick<Durum, "planlar">, p: Paket): StoktaAlani | null =>
  stokDurumu(p) !== "stokta" ? null : stokPlani(d, p) ? "planda" : "bekleyen";

/** Stoka girdiği gün (bitişi) ve o günden bu yana geçen gün: uzun bekleyen gözden kaçmasın. */
export const stoktaGun = (p: Paket, b: string) => Math.max(0, gunFarki(bitmisTarihi(p), b));
/** Bu kadar gündür stokta bekleyen paket uyarı renginde (bayatlıyor). */
export const STOK_BAYAT_GUN = 14;

/*
 * Stoktaki paketin eklenebileceği Next Day planları: bugün ve sonrası,
 * içeriği düzenlenebilen (taslak, toplantıda; hazirPaketEkle de bunu sorar).
 */
export const eklenebilirPlanlar = (d: Pick<Durum, "planlar">, ben: Kisi, b: string): NextDayPlan[] =>
  d.planlar.filter((p) => p.tarih >= b && planIcerikDuzenler(ben, p)).sort((x, y) => x.tarih.localeCompare(y.tarih));

/* --- Arşiv: yayınlanan ve yapılmayan stok paketleri --- */

export const STOK_ARSIV_ALANLARI = ["yayinlandi", "yapilmadi"] as const;
export type StokArsivAlani = (typeof STOK_ARSIV_ALANLARI)[number];
export const stokArsivAlani = (p: Paket): StokArsivAlani | null =>
  stokDurumu(p) === "yayinlandi" ? "yayinlandi" : (p.stok || p.ozelId) && p.durum === "iptal" ? "yapilmadi" : null;
export const arsivTarihi = (p: Paket): string => (p.yayinlandi?.tarih ?? p.yapilmadi?.zaman ?? p.reddedildi?.zaman ?? p.guncelleme).slice(0, 10);

/* --- Sıralama: tarih ya da muhabir (kullanıcı) --- */

export const STOK_SIRALARI = ["tarih", "muhabir"] as const;
export type StokSirasi = (typeof STOK_SIRALARI)[number];
export type GrupBirimi = "gun" | "hafta" | "ay";

export interface StokGrubu<T> {
  /** Tarihte gün, haftanın Cumartesi'si ya da ay (YYYY-MM-DD / YYYY-MM), muhabirde kişinin kimliği; "" günsüz ya da muhabirsiz. */
  anahtar: string;
  liste: T[];
}

/*
 * Listeler gruplu: tarihte teklifler gün gün (tek haftanın içinde), paketler
 * hafta hafta (gün gün tek kartlık gruplar ekranın yarısını boş bırakıyordu),
 * arşiv ay ay; günsüz sonda, süren pakette (`bosOnce`) başta: teslim günü
 * belirlenmemiş paket iş bekliyor. İleriye bakan listede (teklif, üretim)
 * yakından uzağa, geriye bakanda (stok, arşiv) yeniden eskiye. Muhabirde adına
 * göre, her grubun içinde aynı tarih sırası; muhabirsiz (in-house) sonda.
 */
export const grupla = <T>(
  liste: T[],
  sira: StokSirasi,
  s: {
    tarih: (x: T) => string | undefined;
    kisi: (x: T) => string | undefined;
    ad: (id: string) => string;
    artan: boolean;
    birim?: GrupBirimi;
    dil?: string;
    bosOnce?: boolean;
  },
): StokGrubu<T>[] => {
  const tarihSirasi = (a: T, b: T) => {
    const x = s.tarih(a) ?? "";
    const y = s.tarih(b) ?? "";
    if (!x !== !y) return !x === !!s.bosOnce ? -1 : 1;
    return s.artan ? x.localeCompare(y) : y.localeCompare(x);
  };
  const gruplar = new Map<string, T[]>();
  for (const x of [...liste].sort(tarihSirasi)) {
    const g = s.tarih(x) ?? "";
    const k =
      sira === "muhabir" ? (s.kisi(x) ?? "") : !g ? "" : s.birim === "ay" ? g.slice(0, 7) : s.birim === "hafta" ? haftaBasi(g.slice(0, 10)) : g.slice(0, 10);
    gruplar.set(k, [...(gruplar.get(k) ?? []), x]);
  }
  const sonuc = [...gruplar.entries()].map(([anahtar, l]) => ({
    anahtar,
    liste: l,
  }));
  if (sira === "muhabir") sonuc.sort((a, b) => (!a.anahtar !== !b.anahtar ? (a.anahtar ? -1 : 1) : s.ad(a.anahtar).localeCompare(s.ad(b.anahtar), s.dil)));
  return sonuc;
};

/*
 * Paketin listedeki günü: bitmişte bittiği (stoka girdiği) gün; sürende teslim
 * günü (bitmisPaket.ts → surenPaketGunu); yoksa günsüz ("Teslim günü
 * belirlenmedi"). Önce son değişikliğin günü yazılıyordu: teslim günü olmayan
 * paket "20 Kas" gibi anlamsız bir günle duruyordu.
 */
export const stokPaketGunu = (d: Pick<Durum, "planlar">, p: Paket): string | undefined => (bitmisMi(p) ? bitmisTarihi(p) : surenPaketGunu(d, p));
/** Teslim gününe kalan gün (bugün 0, eksi gecikme). */
export const teslimeKalan = (gun: string, b: string) => gunFarki(b, gun);
/** Paketin muhabiri; in-house özel yayın paketinde hazırlayan. */
export const stokPaketKisisi = (p: Paket) => p.muhabirId ?? p.hazirlayanId;
