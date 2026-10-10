import { ADIM_ADI, URETIM_ADIMLARI, YARDIMCI_SAHIP, adimSahibi, paketSahibi, type UretimAdimi } from "./akis";
import type { Anahtar } from "./dil";
import { GERCEK } from "./kip";
import {
  BIRIMLER,
  ICERIK_TURLERI,
  oneriBul,
  paketBul,
  type Birim,
  type Durum,
  type Faaliyet,
  type Gorev,
  type Gorevlendirme,
  type HaftalikKalem,
  type HaftalikPlan,
  type Hareket,
  type IcerikTuru,
  type Kisi,
  type NextDayPlan,
  type Oneri,
  type Paket,
} from "./veri";

/**
 * Yetki ve görünürlük, tek tabloda.
 *
 * Rapor bölüm 9'daki üç katman:
 * 1. Birim: kim hangi işi yapar (aşağıdaki IZINLER ve akış adımlarının
 *    sahipleri).
 * 2. Rol: yönetici ile personel aynı şeyi aynı öncelikle görmüyor; plan
 *    onayı gibi işler yöneticide.
 * 3. Alan: kaydı görmek mali alanları görmek demek değil; ücret ayrıca
 *    yetkilendiriliyor.
 *
 * Ekranlar düğme göstermeden önce buraya soruyor; eylemler de kaydı
 * değiştirmeden önce aynı soruyu yeniden soruyor ki adres çubuğundan ya
 * da eski bir sekmeden gelen istek de geri dönsün. Proje planı
 * sayfasındaki yetki matrisi de bu tablodan çiziliyor; belge ile kod
 * ayrışmasın diye.
 */

interface Izin {
  ad: Anahtar;
  birimler: Birim[];
  yalnizYonetici?: Birim[];
}

export const IZINLER = {
  oneriGonder: { ad: "yOneriGonder", birimler: ["muhabir", "planlama"] },
  cagriHazirla: { ad: "yCagriHazirla", birimler: ["planlama"] },
  oneriDegerlendir: { ad: "yOneriDegerlendir", birimler: ["planlama"] },
  baslikYonet: { ad: "yBaslikYonet", birimler: ["planlama"] },
  planDuzenle: { ad: "yPlanDuzenle", birimler: ["planlama"] },
  planOnayla: { ad: "yPlanOnayla", birimler: ["planlama", "yonetim"], yalnizYonetici: ["planlama"] },
  geriDonus: { ad: "yGeriDonus", birimler: ["planlama"] },
  planDevral: { ad: "yPlanDevral", birimler: ["newsdesk"] },
  operasyon: { ad: "yOperasyon", birimler: ["newsdesk"] },
  paketDegerlendir: { ad: "yPaketDegerlendir", birimler: ["planlama"] },
  ucretGor: { ad: "yUcretGor", birimler: ["newsdesk", "yonetim"] },
  nitelikPuanla: { ad: "yNitelikPuanla", birimler: ["newsdesk", "yonetim"] },
  profilDuzenle: { ad: "yProfilDuzenle", birimler: ["planlama", "newsgathering", "yonetim"] },
  /* Ayrıca kapsam soruluyor: talimatı yalnız Planlama'dan sorumlu müdür verir, müdahale yalnız kapsamdaki pakete. */
  talimatVer: { ad: "yTalimatVer", birimler: ["yonetim"] },
  mudahale: {
    ad: "yMudahale",
    birimler: ["planlama", "newsdesk", "newsgathering", "program", "ekonomi", "output", "media", "yonetim"],
    yalnizYonetici: ["planlama", "newsdesk", "newsgathering", "program", "ekonomi", "output", "media"],
  },
  /* Haftalık planı Planlama hazırlıyor; Perşembe toplantısının kararını Planlama yöneticisi ya da yönetim kesinleştiriyor. */
  haftalikDuzenle: { ad: "yHaftalikDuzenle", birimler: ["planlama"] },
  haftalikKesinlestir: { ad: "yHaftalikKesinlestir", birimler: ["planlama", "yonetim"], yalnizYonetici: ["planlama"] },
  /* Ayrıca kol soruluyor (onIncelemeci): müdür kendi kolunun, Ekonomi ekonomi kolunun önerisine bakıyor. */
  onInceleme: { ad: "yOnInceleme", birimler: ["yonetim", "ekonomi"] },
  /*
   * Planlama takvimi: Planlama ve üst yönetim kayıt tutuyor; öbür masalarda
   * yalnız birim yöneticisi (kendi biriminin yaklaşan işini girsin diye).
   * Plana aktarmak ayrıca o planın yetkisini istiyor.
   */
  takvimDuzenle: {
    ad: "yTakvimDuzenle",
    birimler: ["planlama", "newsdesk", "newsgathering", "program", "ekonomi", "output", "media", "yonetim"],
    yalnizYonetici: ["newsdesk", "newsgathering", "program", "ekonomi", "output", "media"],
  },
} satisfies Record<string, Izin>;
export type Eylem = keyof typeof IZINLER;

export const yapabilir = (k: Kisi | undefined, e: Eylem): boolean => {
  if (!k) return false;
  const iz: Izin = IZINLER[e];
  if (!iz.birimler.includes(k.birim)) return false;
  if (iz.yalnizYonetici?.includes(k.birim) && k.rol !== "yonetici") return false;
  return true;
};

/* --- Yöneticiler: kim hangi birimin işinden sorumlu --- */

/*
 * Müdürler yönetim biriminde ve birden fazla birimden sorumlu: Input
 * müdürü Planlama, Newsdesk, News Gathering ve muhabirlerden, Program
 * müdürü Program'dan. Paketlerde sorumluluk kola göre: haber kolu hangi
 * birimin masasında olursa olsun baştan sona Input'un. Birim yöneticisi
 * yalnız kendi biriminden, paketlerde yalnız şu an kendi masasında
 * olandan sorumlu. Unvanı tabloda olmayan yönetim üyesi her şeyi görür.
 */
export interface Kapsam {
  birimler: Birim[];
  kollar: IcerikTuru[];
  /** Birden fazla birimden sorumlu; birimlerin ekranına inebiliyor. */
  mudur: boolean;
  /** Paketlerde sorumluluk kola göre mi (müdür, Ekonomi), şu an kimin masasında olduğuna göre mi. */
  kolaGore: boolean;
}

/*
 * Üretimde masası olmayan, bir kolun içeriğinden sorumlu birim. Ekonomi
 * paketini Planlama'nın feature/stok ekibi yürütüyor; Ekonomi yöneticisi
 * masaya değil kola bakıyor.
 */
const KOL_BIRIMLERI: Partial<Record<Birim, IcerikTuru[]>> = { ekonomi: ["ekonomi"] };

export const MUDURLUKLER: Partial<Record<Gorev, Pick<Kapsam, "birimler" | "kollar">>> = {
  inputMuduru: { birimler: ["planlama", "newsdesk", "newsgathering", "muhabir"], kollar: ["haber", "feature", "ekonomi"] },
  programMuduru: { birimler: ["program"], kollar: ["program"] },
};

export const kapsam = (k: Kisi | undefined): Kapsam | null => {
  if (!k) return null;
  if (k.birim === "yonetim")
    return { ...(MUDURLUKLER[k.gorev] ?? { birimler: BIRIMLER.filter((b) => b !== "yonetim"), kollar: [...ICERIK_TURLERI] }), mudur: true, kolaGore: true };
  if (k.rol === "yonetici" && k.birim !== "muhabir") {
    const kol = KOL_BIRIMLERI[k.birim];
    return { birimler: [k.birim], kollar: kol ?? [...ICERIK_TURLERI], mudur: false, kolaGore: !!kol };
  }
  return null;
};

export const paketKapsamda = (k: Kisi | undefined, p: Paket): boolean => {
  const ks = kapsam(k);
  if (!k || !ks) return false;
  return ks.kolaGore ? ks.kollar.includes(p.tur) : paketSahibi(p) === k.birim;
};

export const talimatVerebilir = (k: Kisi | undefined): boolean => yapabilir(k, "talimatVer") && !!kapsam(k)?.birimler.includes("planlama");

/** Öncelik ve yönetici notu: kapsamdaki, henüz bitmemiş paket. */
export const mudahaleEdebilir = (k: Kisi | undefined, p: Paket): boolean =>
  yapabilir(k, "mudahale") && paketKapsamda(k, p) && p.durum !== "tamamlandi" && p.durum !== "iptal";

/* --- Plan düzenleme: içerik Planlama'nın, devirden sonra operasyon Newsdesk'in --- */

/*
 * Promptun 1. maddesi: planın asıl içeriği ile üretimdeki operasyonel
 * güncellemeler ayrılsın. Plan onaylanana kadar içeriği Planlama
 * düzenliyor; Newsdesk devraldıktan sonra yalnız gelişme ve canlı yayın
 * ekleyebiliyor, başlık sırası ve ekip artık kilitli.
 */
export const planIcerikDuzenler = (k: Kisi | undefined, p: NextDayPlan) =>
  yapabilir(k, "planDuzenle") && (p.durum === "taslak" || p.durum === "toplantida");

export const planOperasyonDuzenler = (k: Kisi | undefined, p: NextDayPlan) =>
  planIcerikDuzenler(k, p) || (yapabilir(k, "operasyon") && p.durum === "devralindi");

/* --- Haftalık plan --- */

/** Kesinleşen plan kilitli; o haftanın kararı artık Next Day'lere ve kollara dağıldı. */
export const haftalikDuzenler = (k: Kisi | undefined, h: HaftalikPlan) => yapabilir(k, "haftalikDuzenle") && h.durum !== "kesinlesti";

/** Toplantının kararı: planlamacı kaydediyor, toplantıyı yöneten yönetici de verebiliyor. */
export const kararVerebilir = (k: Kisi | undefined, h: HaftalikPlan) =>
  h.durum === "toplantida" && (yapabilir(k, "haftalikDuzenle") || yapabilir(k, "haftalikKesinlestir"));

/** Ön incelemeyi kim yapar: kolu kapsamında olan müdür; ekonomi kaleminde Ekonomi birimi de. */
export const onIncelemeci = (k: Kisi | undefined, kalem: Pick<HaftalikKalem, "tur">): boolean => {
  if (!k || !yapabilir(k, "onInceleme")) return false;
  if (KOL_BIRIMLERI[k.birim]) return KOL_BIRIMLERI[k.birim]!.includes(kalem.tur);
  const ks = kapsam(k);
  return !!ks?.mudur && ks.kollar.includes(kalem.tur);
};

/* --- Üretim adımları: sahibi akıştan --- */

/*
 * Planlama'ya düşen üretim adımı (feature ve ekonomi kolunda görev verme,
 * Media Manager'a iletme, montaj kontrolü ve yükleme) feature/stok
 * ekibinin işi; Planlama'nın kalanı izliyor, yönetici her zaman yapabiliyor.
 */
const ekipte = (k: Kisi) => k.birim !== "planlama" || k.gorev === "stokTakip" || k.rol === "yonetici";

export const adimYapabilir = (k: Kisi | undefined, p: Paket): boolean => {
  if (!k || p.durum !== "uretimde" || !p.adim) return false;
  const adim = p.adim as UretimAdimi;
  if (k.birim === "muhabir") return adimSahibi(adim, p.tur) === "muhabir" && p.muhabirId === k.id;
  if (adimSahibi(adim, p.tur) === k.birim) return ekipte(k);
  return !!YARDIMCI_SAHIP[adim]?.includes(k.birim);
};

/** Plansız onaylı paketi (haftalık toplantının kabulü) kolun sahibi üretime alıyor; Planlama'da stok ekibi. */
export const uretimeAlabilir = (k: Kisi | undefined, p: Paket): boolean =>
  !!k && p.durum === "onaylandi" && !p.planId && paketSahibi(p) === k.birim && ekipte(k);

/* --- Görünürlük --- */

/** Muhabir yalnız kendi işini görür; diğer birimler okur ama yalnız kendi eylemini yapar. */
export const paketGorebilir = (k: Kisi | undefined, p: Paket, d: Durum): boolean => {
  if (!k) return false;
  if (k.birim !== "muhabir") return true;
  return p.muhabirId === k.id || oneriBul(d, p.oneriId)?.muhabirId === k.id;
};

export const oneriGorebilir = (k: Kisi | undefined, o: Oneri): boolean =>
  !!k && (k.birim !== "muhabir" || o.muhabirId === k.id);

/*
 * Düzeltmeye gönderme yalnız muhabirin önerisinde: talimatı yönetici verdi,
 * ajansın ya da bakanlığın önerisini düzeltecek kimse yok. Elle girileni
 * (telefon, mesaj) muhabir uygulamadan düzeltip yeniden gönderebiliyor.
 */
export const oneriDuzeltmeyeGider = (k: Kisi | undefined, o: Oneri): boolean =>
  !!k && yapabilir(k, "oneriDegerlendir") && !!o.muhabirId && !o.talimatVeren && ["yeni", "degerlendiriliyor", "sonra"].includes(o.durum);

/** Düzeltme isteğini yalnız önerinin muhabiri karşılıyor. */
export const oneriYenidenGonderebilir = (k: Kisi | undefined, o: Oneri): boolean => !!k && o.durum === "duzeltme" && o.muhabirId === k.id;

/** Muhabir takvimi bütünüyle görmüyor: yalnız sorumlu muhabir olarak atandığı faaliyetleri. */
export const faaliyetGorebilir = (k: Kisi | undefined, f: Faaliyet): boolean => !!k && (k.birim !== "muhabir" || f.muhabirId === k.id);

export const gorevlendirmeGorebilir = (k: Kisi | undefined, g: Gorevlendirme): boolean =>
  !!k && (k.birim !== "muhabir" || g.kisiId === k.id);

/** Alan bazlı yetki: muhabir yalnız kendi ücretini, Newsdesk'te yetkili kişi ve yönetim hepsini görür. */
export const ucretGorebilir = (k: Kisi | undefined, p: Paket): boolean => {
  if (!k) return false;
  if (k.birim === "muhabir") return p.muhabirId === k.id;
  if (k.birim === "newsdesk") return !!k.ucretYetkisi || k.rol === "yonetici";
  return yapabilir(k, "ucretGor");
};

export const hareketGorebilir = (k: Kisi | undefined, h: Hareket, d: Durum): boolean => {
  if (!k) return false;
  if (k.birim !== "muhabir") return true;
  if (h.kisiId === k.id || h.tip === "cagriHazirlandi") return true;
  const p = paketBul(d, h.paketId);
  if (p) return paketGorebilir(k, p, d);
  const o = oneriBul(d, h.oneriId);
  return !!o && oneriGorebilir(k, o);
};

/**
 * Bildirim ayrıca saklanmıyor: hareket kaydı kimin önüne iş düşürdüyse
 * (veri.sahip) o birime, muhabirse kendi işindeki her harekete bildirim.
 * Kişilere özel olan (veri.kime, virgülle ayrılmış: talimatı veren
 * yönetici, ön incelemedeki müdürler) yalnız onlara; yanında birim de
 * yazılıysa (ön incelemede Ekonomi) o birime de.
 */
export const bildirimMi = (k: Kisi, h: Hareket, d: Durum): boolean => {
  if (h.kisiId === k.id) return false;
  const kime = h.veri?.kime ? h.veri.kime.split(",") : [];
  if (kime.includes(k.id)) return true;
  if (k.birim === "muhabir") return !kime.length && hareketGorebilir(k, h, d);
  return h.veri?.sahip === k.birim;
};

/** Profil: kişi kendi profilini, Planlama, News Gathering ve Yönetim herkesinkini düzenler. */
export const profilDuzenler = (k: Kisi | undefined, kisi: Kisi): boolean => !!k && (k.id === kisi.id || yapabilir(k, "profilDuzenle"));

/*
 * Performans göstergeleri alan bazlı: muhabir yalnız kendisininkini, işi
 * planlayan ve dağıtan birimler herkesinkini görür; Output ve Media
 * kayıtları işler ama kişi değerlendirmesi onların masası değil.
 */
export const performansGorebilir = (k: Kisi | undefined, kisi: Kisi): boolean =>
  !!k && (k.id === kisi.id || ["planlama", "newsdesk", "newsgathering", "yonetim"].includes(k.birim));

/* --- Sayfalar --- */

const MASA: Birim[] = BIRIMLER.filter((b) => b !== "muhabir");

export const SAYFA_IZNI: Record<string, readonly Birim[]> = {
  ana: BIRIMLER,
  nextday: MASA,
  haftalik: ["planlama", "newsdesk", "program", "ekonomi", "yonetim"],
  aylik: ["planlama", "program", "yonetim"],
  ozel: ["planlama", "newsdesk", "newsgathering", "program", "yonetim"],
  muhabirler: MASA,
  editorler: MASA,
  personel: MASA,
  izinler: ["planlama", "newsdesk", "newsgathering", "program", "yonetim"],
  oneriler: ["planlama", "yonetim", "muhabir"],
  basliklar: ["planlama", "newsdesk", "program", "yonetim"],
  paketler: BIRIMLER,
  feature: MASA,
  programlar: ["planlama", "program", "yonetim"],
  stok: ["planlama", "newsdesk", "program", "ekonomi", "yonetim"],
  saha: ["newsgathering", "planlama", "yonetim", "muhabir"],
  seyahat: ["newsgathering", "planlama", "yonetim"],
  talepler: ["newsgathering", "planlama", "yonetim"],
  uretim: ["newsdesk", "output", "media", "planlama", "program", "yonetim"],
  metinkontrol: ["output", "newsdesk", "planlama", "yonetim"],
  video: ["newsdesk", "media", "planlama", "yonetim"],
  ucretler: ["newsdesk", "yonetim"],
  raporlar: ["planlama", "newsdesk", "newsgathering", "program", "ekonomi", "yonetim"],
  ayarlar: BIRIMLER,
  profil: BIRIMLER,
  plan: BIRIMLER,
  takvim: BIRIMLER,
  ortam: BIRIMLER,
};

/* Yönetici paneli birime değil kişiye bağlı: müdürler ve birim yöneticileri. */
export const sayfaGorebilir = (k: Kisi | undefined, sayfa: string): boolean =>
  !!k &&
  (sayfa === "panel"
    ? !!kapsam(k)
    : // Hesaplar yalnız gerçek kipte ve hesap yöneticisinde: demoda davet edilecek kimse yok.
      sayfa === "kullanicilar"
      ? GERCEK && !!k.hesapYoneticisi
      : !!SAYFA_IZNI[sayfa]?.includes(k.birim));

/* --- Proje planı için matris: tablolardan üretiliyor, elle yazılmıyor --- */

export interface MatrisSatiri {
  ad: Anahtar;
  birimler: Birim[];
  yonetici: Birim[];
}

export const yetkiMatrisi = (): MatrisSatiri[] => [
  ...Object.values(IZINLER).map((iz: Izin) => ({ ad: iz.ad, birimler: iz.birimler, yonetici: iz.yalnizYonetici ?? [] })),
  ...URETIM_ADIMLARI.map((a) => ({
    ad: ADIM_ADI[a],
    birimler: [...new Set([adimSahibi(a, "haber"), ...(YARDIMCI_SAHIP[a] ?? [])])],
    yonetici: [],
  })),
];

/** Paketin şimdiki sahibi kişiye düşüyor mu ("Senin sıran" kutusu); plansız onaylı pakette üretime alacak olana. */
export const siramMi = (k: Kisi, p: Paket) =>
  p.durum === "uretimde"
    ? adimYapabilir(k, p)
    : p.durum === "onaylandi" && !p.planId
      ? uretimeAlabilir(k, p)
      : paketSahibi(p) === k.birim && k.birim === "planlama";
