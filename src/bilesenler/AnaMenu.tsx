import { onayBekleyenler } from "./HesapOnayi";
import { useYeniTasarim } from "../tasarimSecimi";
import { birimAdi, gorevAdi } from "../yapi";
import { oneriArsivde } from "../oneriPlanlari";
import { Archive, FileText, Binoculars, Landmark, BookOpen, Globe, ClipboardList, Building, Building2, Calendar, CalendarCheck, CalendarClock, CalendarDays, CalendarRange, ChartColumn, ChevronDown, CircleUser, Clapperboard, Contact, Gauge, House, Inbox, Layers, Lightbulb, Mail, MapPinned, MonitorPlay, Newspaper, Package, Route, Send, Settings, SpellCheck, TrendingUp, Tv, Users, Calculator, Trophy, Workflow, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useDil, type Anahtar } from "../dil";
import { MASA_YOLU, masaKararlari, type MasaBirimi } from "../programMasasi";
import { kararlariGetir } from "../planlamaKararlari";
import { izinBirimi } from "../yapi";
import { kisininIsleri } from "../gorevler";
import { useVeri, type Durum, type Kisi } from "../veri";
import { gorusBekleyenler } from "../haftalik";
import { bolmeyeGirer } from "../ortam";
import { bekleyenHatirlatmalar, gorunenFaaliyetler } from "../takvim";
import { dilDenetmeniMi, kisitliKisi, masaBirimi, sadeEkranMi, dilParcaSirasi, dilSirasi, paketGorebilir, sayfaGorebilir, siramMi, uretimeAlabilir, yapabilir, yonetimdeMi } from "../yetki";
import { GERCEK } from "../kip";
import { okunmamisSayisi } from "../postaOkuma";
import Logo from "./Logo";

/**
 * Menünün tek tablosu: sol menü (AnaMenu) ve telefondaki Menü paneli
 * (MobilMenu) buradan çiziliyor; yeni sayfa yalnız buraya girer.
 * Gruplar ilk taslak promptunun 2. maddesindeki ana başlıklar:
 * Planlama, Personel, İçerik ve haberler, Görevlendirmeler, İş akışları,
 * Raporlar. Her kişi yalnız yetkisi olan maddeleri görüyor; muhabirin
 * menüsü kendi işlerine daralıyor. Henüz yalnız taslağı olan sayfalar
 * gri bir noktayla işaretli.
 */

export interface Madde {
  sayfa: string;
  ad: Anahtar;
  adMuhabir?: Anahtar;
  /* Kısa ad zorunlu: workspace sekmesi ve arama penceresi onu yazıyor; yeni sayfa kısa adsız derlenmesin. */
  kisa: Anahtar;
  kisaMuhabir?: Anahtar;
  ikon: LucideIcon;
  taslak?: boolean;
  /** Sayfa izninin üstüne kişiye göre ek koşul. */
  goster?: (ben: Kisi) => boolean;
  say?: (d: Durum, ben: Kisi) => number;
}

interface Grup {
  ad?: Anahtar;
  maddeler: Madde[];
}

/** Masaüstü menüsü ve telefondaki Menü paneli aynı kuralla süzüyor. */
export const maddeGorunur = (ben: Kisi, m: Madde) => sayfaGorebilir(ben, m.sayfa) && (m.goster?.(ben) ?? true);

export const MENU: Grup[] = [
  {
    maddeler: [
      {
        sayfa: "ana",
        ad: "mAna",
        adMuhabir: "mIslerim",
        kisa: "kaAna",
        kisaMuhabir: "kaIslerim",
        ikon: House,
        say: (d, ben) => d.paketler.filter((p) => p.durum === "uretimde" && siramMi(ben, p) && paketGorebilir(ben, p, d)).length,
      },
      // Yönetim biriminde panel zaten ana sayfa; birim yöneticisi ona buradan ulaşıyor.
      { sayfa: "panel", ad: "mPanel", kisa: "kaPanel", ikon: Gauge, goster: (ben) => !yonetimdeMi(ben) },
    ],
  },
  {
    ad: "mgPlanlama",
    maddeler: [
      { sayfa: "nextday", ad: "mNextday", kisa: "kaNextday", ikon: CalendarDays },
      // Sayı: kişinin önündeki ön inceleme (müdür, Ekonomi).
      { sayfa: "haftalik", ad: "mHaftalik", kisa: "kaHaftalik", ikon: CalendarRange, say: (d, ben) => gorusBekleyenler(d, ben).length },
      { sayfa: "aylik", ad: "mAylik", kisa: "kaAylik", ikon: Calendar },
      { sayfa: "ozel", ad: "mOzel", kisa: "kaOzel", ikon: Tv },
      // Sayı: zamanı gelen hatırlatmalar; yalnız takvimi tutanlara ve muhabire (kendi faaliyeti), öbür masalara gürültü olmasın.
      {
        sayfa: "takvim",
        ad: "mTakvim",
        adMuhabir: "mTakvimim",
        kisa: "kaTakvim",
        kisaMuhabir: "kaTakvimim",
        ikon: CalendarCheck,
        say: (d, ben) => (yapabilir(ben, "takvimDuzenle") || ben.birim === "muhabir" ? bekleyenHatirlatmalar(gorunenFaaliyetler(d, ben)).length : 0),
      },
      // Planlama görevleri ve iş taksimi; sayı kişinin açık işleri.
      { sayfa: "gorevler", ad: "mGorevler", kisa: "kaGorevler", ikon: ClipboardList, say: (d, ben) => kisininIsleri(d, ben.id).length },
      // Gündem takibi yalnız tam yöneticinin (yetki.ts → sayfaGorebilir).
      { sayfa: "gundem", ad: "mGundem", kisa: "kaGundem", ikon: Globe },
    ],
  },
  {
    ad: "mgPersonel",
    maddeler: [
      { sayfa: "muhabirler", ad: "mMuhabirler", kisa: "kaMuhabirler", ikon: Users },
      { sayfa: "personel", ad: "mPersonel", kisa: "kaPersonel", ikon: Contact },
      { sayfa: "izinler", ad: "mIzinler", kisa: "kaIzinler", ikon: CalendarClock },
    ],
  },
  {
    ad: "mgIcerik",
    maddeler: [
      {
        sayfa: "oneriler",
        ad: "mOneriler",
        adMuhabir: "mOnerilerim",
        kisa: "kaOneriler",
        kisaMuhabir: "kaOnerilerim",
        ikon: Lightbulb,
        // Muhabirin önerileri menüde değil, İşlerim'de "Yeni öneri gönder"in yanında; menüde yerine takipleri.
        goster: (ben) => ben.birim !== "muhabir",
        // Öneriler'in "Karar bekleyen" sekmesiyle aynı kural (planlamaKararlari.ts); önce yalnız "yeni"yi sayıyordu.
        say: (d, ben) => kararlariGetir(d, ben).oneri,
      },
      // Gelen posta sohbeti: planlama kutusuna düşen postalar (yetki.ts → SAYFA_IZNI.posta).
      { sayfa: "posta", ad: "mPosta", kisa: "kaPosta", ikon: Mail, say: (d, ben) => okunmamisSayisi(d, ben.id) },
      {
        sayfa: "takipler",
        ad: "mMuhabirTakipleri",
        adMuhabir: "mTakiplerim",
        kisa: "kaMuhabirTakipleri",
        kisaMuhabir: "kaTakiplerim",
        ikon: Binoculars,
      },
      { sayfa: "basliklar", ad: "mBasliklar", kisa: "kaBasliklar", ikon: Newspaper },
      { sayfa: "paketler", ad: "mPaketler", adMuhabir: "mPaketlerim", kisa: "kaPaketler", kisaMuhabir: "kaPaketlerim", ikon: Package },
      { sayfa: "feature", ad: "mFeature", kisa: "kaFeature", ikon: TrendingUp },
      { sayfa: "ekonomi", ad: "mEkonomi", kisa: "kaEkonomi", ikon: Landmark },
      { sayfa: "programlar", ad: "mProgramlar", kisa: "kaProgramlar", ikon: Clapperboard },
      { sayfa: "spor", ad: "mSpor", kisa: "kaSpor", ikon: Trophy },
      // Sayı: kişinin üretime alabileceği paketler (Planlama'da feature/stok ekibi).
      { sayfa: "stok", ad: "mStok", kisa: "kaStok", ikon: Layers, say: (d, ben) => d.paketler.filter((p) => uretimeAlabilir(ben, p)).length },
    ],
  },
  {
    ad: "mgGorevlendirme",
    maddeler: [
      { sayfa: "saha", ad: "mSaha", adMuhabir: "mGorevlerim", kisa: "kaSaha", kisaMuhabir: "kaGorevlerim", ikon: MapPinned },
      { sayfa: "seyahat", ad: "mSeyahat", kisa: "kaSeyahat", ikon: Route },
      { sayfa: "talepler", ad: "mTalepler", kisa: "kaTalepler", ikon: Inbox },
    ],
  },
  {
    ad: "mgIsAkisi",
    maddeler: [
      { sayfa: "uretim", ad: "mUretim", kisa: "kaUretim", ikon: Workflow },
      { sayfa: "metinkontrol", ad: "mMetinKontrol", kisa: "kaMetinKontrol", ikon: SpellCheck },
      { sayfa: "video", ad: "mVideo", kisa: "kaVideo", ikon: MonitorPlay },
    ],
  },
  {
    ad: "mgDiger",
    maddeler: [
      // Muhabir ücretleri örnek sayfası yerine Muhasebe (anlaşmalar, aylık döküm; gizli).
      { sayfa: "muhasebe", ad: "mMuhasebe", kisa: "kaMuhasebe", ikon: Calculator },
      { sayfa: "raporlar", ad: "mRaporlar", kisa: "kaRaporlar", ikon: ChartColumn },
      { sayfa: "plan", ad: "mProjePlani", kisa: "kaProjePlani", ikon: BookOpen },
      { sayfa: "organizasyon", ad: "mOrganizasyon", kisa: "kaOrganizasyon", ikon: Building2, say: (d, ben) => onayBekleyenler(d.kisiler, ben).length },
      { sayfa: "ayarlar", ad: "mAyarlar", kisa: "kaAyarlar", ikon: Settings },
    ],
  },
];

/*
 * Muhabirin menüsü: işi az, seçenekleri az. Gruplar (İçerik ve haberler,
 * Diğer) birer ikişer maddeyle katlanıp maddeleri saklıyordu; muhabire
 * başlıksız tek liste, kendi işlerinin sırasıyla. Ayarlar altta ayrık.
 * Telefondaki panel ve alt çubuk eski haliyle (orada beğenildi).
 */
/*
 * Muhabirin menüsü (kurum kararı, en sade hali): Öneri gönder, Önerilerim,
 * Takiplerim, Haberlerim, Görevlendirmelerim; Ayarlar altta. Ana sayfa
 * Önerilerim'in kendisi, ayrı madde değil; takvim muhabirde yok.
 */
const ONERI_GONDER: Madde = { sayfa: "oneriler/yeni", ad: "mOneriGonder", kisa: "kaOneriGonder", ikon: Send };
export const MUHABIR_MENUSU = ["oneriler/yeni", "oneriler", "takipler", "paketler", "saha"];
export const MUHABIR_ALT = ["ayarlar"];
export const muhabirMaddeleri = (ben: Kisi, sayfalar: string[]) =>
  sayfalar
    .map((s) => (s === ONERI_GONDER.sayfa ? ONERI_GONDER : MENU.flatMap((g) => g.maddeler).find((m) => m.sayfa === s)))
    .filter((m): m is Madde => !!m && sayfaGorebilir(ben, m.sayfa.split("/")[0]));
/* Muhabirde Önerilerim'in sayısı önündeki iş: düzeltme istenen ve Planlama'nın ona önerdiği. */
const muhabirOneriSayisi = (d: Durum, ben: Kisi) => d.oneriler.filter((o) => o.muhabirId === ben.id && (o.durum === "duzeltme" || o.durum === "teklif") && !oneriArsivde(o)).length;

/*
 * Masaların menüsü (Programlar, Ekonomi, Spor; kullanıcı: kendi çalışma
 * alanlarına ve görevlerine özel). Masam: masanın sayfasının bölümleri ve
 * Üretim panosu; Planlar: son onaylı planlar (salt okunur), takvim, Weekly
 * yalnız ön inceleme yapana (yönetici, Ekonomi); İletişim: posta ve izinler.
 * Muhabir listesi yok: işin muhabirine iş kartından ulaşılıyor. Sayılar
 * masanın önündeki karar (yayın kararı, yanıt bekleyen soru).
 */
export const masaMenusu = (ben: Kisi, birim: MasaBirimi): Grup[] => {
  const y = MASA_YOLU[birim];
  const tablodan = (s: string) => MENU.flatMap((g) => g.maddeler).find((m) => m.sayfa === s);
  const grup = (ad: Anahtar | undefined, maddeler: (Madde | false | undefined)[]): Grup => ({
    ad,
    maddeler: maddeler.filter((m): m is Madde => !!m && sayfaGorebilir(ben, m.sayfa.split("/")[0]) && (m.goster?.(ben) ?? true)),
  });
  return [
    grup(undefined, [tablodan("ana")]),
    grup("mgMasam", [
      { sayfa: `${y}/icerikler`, ad: "pmIcerikler", kisa: "pmIcerikler", ikon: Clapperboard, say: (d) => masaKararlari(d, birim).yayin },
      { sayfa: `${y}/oneriler`, ad: "pmOneriler", kisa: "pmOneriler", ikon: Lightbulb, say: (d) => masaKararlari(d, birim).soru },
      birim === "program" && { sayfa: `${y}/programlar`, ad: "kaProgramlar", kisa: "kaProgramlar", ikon: Tv },
      { sayfa: `${y}/arsiv`, ad: "pmArsiv", kisa: "pmArsiv", ikon: Archive },
      tablodan("uretim"),
    ]),
    grup("mgYayinPlanlari", [
      { sayfa: `${y}/planlar`, ad: "pmPlanlar", kisa: "pmPlanlar", ikon: FileText },
      (ben.rol === "yonetici" || birim === "ekonomi") && tablodan("haftalik"),
      tablodan("takvim"),
    ]),
    grup("mgIletisim", [tablodan("posta"), tablodan("izinler")]),
  ].filter((g) => g.maddeler.length > 0);
};

/*
 * Planlama'nın menüsü (yeni tasarımda; belgeler/planlama-yeni-mimari.md): 30
 * madde, 7 grup ve başka masaların sayfaları yerine planlamacının işinin
 * sırasıyla beş grup, katlanmaz. Sayı yalnız karar bekleyen işte ve hepsi tek
 * kaynaktan (planlamaKararlari.ts). Menüden kalkan sayfalar (Feature, Ekonomi,
 * Programlar, Spor, Başlıklar, Personel, Seyahat, Talepler, Metin kontrol,
 * Video, Proje planı) aramada ve adresle açılır; `MENU` katalog olarak kalır.
 */
export const planlamaMenusu = (ben: Kisi): Grup[] => {
  const tablodan = (s: string, ek: Partial<Madde> = {}): Madde | undefined => {
    const m = MENU.flatMap((g) => g.maddeler).find((x) => x.sayfa === s);
    return m && { ...m, say: undefined, ...ek };
  };
  const k = (f: (x: ReturnType<typeof kararlariGetir>) => number) => (d: Durum, b: Kisi) => f(kararlariGetir(d, b));
  const grup = (ad: Anahtar | undefined, maddeler: (Madde | false | undefined)[]): Grup => ({
    ad,
    maddeler: maddeler.filter((m): m is Madde => !!m && maddeGorunur(ben, m)),
  });
  const yonetici = ben.rol === "yonetici" || !!ben.hesapYoneticisi;
  const gruplar = [
    grup(undefined, [tablodan("ana"), yonetici && MENU[0].maddeler.find((m) => m.sayfa === "panel")]),
    grup("mgYayinPlanlari", [tablodan("nextday"), tablodan("haftalik"), tablodan("aylik"), tablodan("ozel"), tablodan("takvim")]),
    grup("mgGelenler", [tablodan("oneriler", { say: k((x) => x.oneri) }), tablodan("takipler"), tablodan("posta", { say: k((x) => x.posta) })]),
    grup("mgPaketlerGrubu", [
      tablodan("paketler", { say: k((x) => x.onay + x.sartli + x.gorevTalebi) }),
      tablodan("stok", { say: k((x) => x.uretim) }),
      (yonetici || ben.gorev === "stokTakip") && tablodan("uretim"),
      tablodan("saha"),
    ]),
    grup("mgEkip", [tablodan("gorevler", { say: k((x) => x.isler) }), tablodan("muhabirler"), tablodan("izinler")]),
    grup("mgYonetim", yonetici ? [tablodan("raporlar"), tablodan("gundem"), tablodan("organizasyon", { say: k((x) => x.hesapOnayi) })] : []),
  ];
  /*
   * Tam yönetici (kullanıcı: yeni düzen ona da açılsın) Planlama'nın menüsünde
   * kendi sayfalarını (Muhasebe, proje planı, masalar, başlıklar…) kaybetmesin:
   * eski menüde gördüğü, burada olmayan maddeler Yönetim grubunun sonunda.
   */
  if (ben.hesapYoneticisi) {
    const var_ = new Set(gruplar.flatMap((g) => g.maddeler.map((m) => m.sayfa)));
    const kalan = MENU.flatMap((g) => g.maddeler).filter((m) => !var_.has(m.sayfa) && !MUHABIR_ALT.includes(m.sayfa) && maddeGorunur(ben, m));
    const yon = gruplar.find((g) => g.ad === "mgYonetim");
    if (yon) yon.maddeler.push(...kalan);
  }
  return gruplar.filter((g) => g.maddeler.length > 0);
};

/* Yeni tasarımda Planlama'nın kendi menüsü ve ana sayfası: Planlama (ve onun "gibi" çalışan birim) ve tam yönetici (kullanıcı isteği; önce tam yönetici eski menüde kalıyordu). */
export const planlamaYeniMi = (ben: Kisi, yeni: boolean) => yeni && !kisitliKisi(ben) && (!!ben.hesapYoneticisi || izinBirimi(ben.birim) === "planlama");

/** Birime özel menü (masa ya da yeni tasarımda Planlama); yoksa tablonun kendisi. */
export const birimMenusu = (ben: Kisi, yeni: boolean): { tur: string; gruplar: Grup[] } | undefined => {
  const masa = masaBirimi(ben);
  if (masa) return { tur: masa, gruplar: masaMenusu(ben, masa) };
  if (planlamaYeniMi(ben, yeni)) return { tur: "planlama", gruplar: planlamaMenusu(ben) };
  return undefined;
};

/** Kişinin menü grupları: birime özel menü ya da tablonun görünür maddeleri (telefondaki panel de). */
export const menuGruplari = (ben: Kisi, yeni = false): Grup[] =>
  birimMenusu(ben, yeni)?.gruplar ?? MENU.map((g) => ({ ad: g.ad, maddeler: g.maddeler.filter((m) => maddeGorunur(ben, m)) })).filter((g) => g.maddeler.length > 0);

/** Maddenin kişiye göre adı: muhabirin menüsü kendi işine daralıyor ("İşlerim", "Önerilerim"). */
export const maddeAdi = (ben: Kisi, m: Madde): Anahtar => (ben.birim === "muhabir" && m.adMuhabir ? m.adMuhabir : m.ad);

/** Maddenin kısa adı (workspace sekmesi, arama penceresi); muhabirde kendi işi. */
export const kisaAdi = (ben: Kisi, m: Madde): Anahtar => (ben.birim === "muhabir" && m.kisaMuhabir ? m.kisaMuhabir : m.kisa);

/* Menüde olmayan ama adresle açılan sayfa; workspace bölmesinin başlığı onu da adlandırsın. */
const PROFIL: Madde = { sayfa: "profil", ad: "profilim", kisa: "kaProfil", ikon: CircleUser };

/** Sayfanın menü maddesi: workspace bölmesi adını ve ikonunu buradan alıyor. */
export const sayfaMaddesi = (sayfa: string): Madde | undefined =>
  sayfa === PROFIL.sayfa ? PROFIL : MENU.flatMap((g) => g.maddeler).find((m) => m.sayfa === sayfa);

/** Workspace'e eklenebilecek sayfalar, menünün gruplarıyla; kişi menüde ne görüyorsa o. */
export const bolmeModulleri = (ben: Kisi) =>
  MENU.map((g) => ({ ad: g.ad, maddeler: g.maddeler.filter((m) => maddeGorunur(ben, m) && bolmeyeGirer(ben, m.sayfa)) })).filter((g) => g.maddeler.length > 0);

/*
 * Açık gruplar tarayıcıda hatırlanıyor (dil seçimi gibi kişiye değil
 * tarayıcıya bağlı bir görünüm tercihi; kayıt şeması değişmiyor). Özel
 * pencerede saklanamazsa yalnız açık sayfanın grubu açık kalır.
 */
const GRUPLAR_SAKLA = "trt-planlama-menu-gruplar";
const acikGruplariOku = (): string[] => {
  try {
    const ham = localStorage.getItem(GRUPLAR_SAKLA);
    return ham ? (JSON.parse(ham) as string[]) : [];
  } catch {
    return [];
  }
};
const acikGruplariYaz = (gruplar: string[]) => {
  try {
    localStorage.setItem(GRUPLAR_SAKLA, JSON.stringify(gruplar));
  } catch {
    /* saklanamıyorsa yalnız bu oturumda geçerli */
  }
};

/** Sayfanın başlıklı grubu; ana sayfa ve panelin grubu yok. */
const sayfaGrubu = (sayfa: string) => MENU.find((g) => g.ad && g.maddeler.some((m) => m.sayfa === sayfa))?.ad;

function MenuBagi({ m, ben, acik }: { m: Madde; ben: Kisi; acik: string }) {
  const { t } = useDil();
  const v = useVeri();
  const sayi = ben.birim === "muhabir" && m.sayfa === "oneriler" ? muhabirOneriSayisi(v, ben) : dilDenetmeniMi(ben) && m.sayfa === "ana" ? dilSirasi(v, ben).length + dilParcaSirasi(v, ben).length : (m.say?.(v, ben) ?? 0);
  const Ikon = m.ikon;
  // "Öneri gönder" Önerilerim'in alt adresi: ikisi aynı anda vurgulanmasın.
  const yeni = typeof location !== "undefined" && location.hash.startsWith("#/oneriler/yeni");
  // Masanın bölümleri alt adres ("#/programlar/arsiv"); çıplak masa adresi İçerikler'i açıyor.
  const hash = typeof location !== "undefined" ? location.hash : "";
  const etkin =
    m.sayfa === ONERI_GONDER.sayfa ? yeni
    : m.sayfa.includes("/") ? hash.startsWith(`#/${m.sayfa}`) || (m.sayfa.endsWith("/icerikler") && hash === `#/${m.sayfa.split("/")[0]}`)
    : acik === m.sayfa && !(m.sayfa === "oneriler" && yeni);
  return (
    <a href={`#/${m.sayfa}`} className={etkin ? "acik" : ""} aria-current={etkin ? "page" : undefined}>
      <Ikon size={18} />
      {t(maddeAdi(ben, m))}
      {sayi > 0 ? <span className="say">{sayi}</span> : m.taslak ? <span className="taslak-nokta" title={t("taslakAkis")} /> : null}
    </a>
  );
}

/**
 * Sol menü. Bütün maddeler hep açık dururken kalabalık görünüyordu;
 * gruplar artık basınca açılıp kapanıyor ve kapalı grubun yanında
 * maddelerin iş sayıları toplanıyor ki neyin beklediği yine görünsün.
 * Açık sayfanın grubu her sayfa değişiminde kendiliğinden açılıyor.
 * Başlıksız grup (ana sayfa, panel) ve kişinin tek maddesini gördüğü grup
 * (muhabirde "Takvimim") katlanmıyor: tek seçenek için grup açtırmak
 * boşuna bir basış. Menünün tamamı üst çubuktaki düğmeyle gizleniyor
 * (Kabuk); `id` o düğmenin hedefi.
 */
export default function AnaMenu({ ben, acik }: { ben: Kisi; acik: string }) {
  const { t, ad } = useDil();
  // Yeni tasarımda menü açık zeminde: lacivert yazılı logo.
  const yeniTasarim = useYeniTasarim();
  const muhabir = ben.birim === "muhabir";
  // Sade ekranlılar (dil denetmeni, muhasebe): kendi sayfası ve Ayarlar.
  const dilci = sadeEkranMi(ben);
  const ozel = birimMenusu(ben, yeniTasarim);
  const masa = ozel?.tur;
  const v = useVeri();
  const [acikGruplar, setAcikGruplar] = useState<string[]>(acikGruplariOku);

  useEffect(() => {
    const g = sayfaGrubu(acik);
    if (g) setAcikGruplar((x) => (x.includes(g) ? x : [...x, g]));
  }, [acik]);
  useEffect(() => acikGruplariYaz(acikGruplar), [acikGruplar]);

  const degistir = (g: string) => setAcikGruplar((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g]));

  return (
    <nav className={`menu${masa ? ` masa-${masa}` : ""}`} id="ana-menu" aria-label={t("anaMenu")}>
      <a className="marka" href="#/" aria-label={t("uygulama")}>
        <Logo koyu={!yeniTasarim} />
      </a>
      <span className="marka-alt">{t("markaAlt")}</span>
      {/* Muhabirin adı sayfanın üstünde tek satırda (Kabuk); menüde ayrıca kutu yok. */}
      {!muhabir && <div className="birim-kutusu">
        <Building size={20} />
        <div>
          {muhabir ? ad(ben) : birimAdi(ben.birim)}
          <small>{gorevAdi(ben.gorev)}</small>
        </div>
      </div>}
      {muhabir && (
        <>
          <div className="menu-grup" data-muhabir-menusu>
            {muhabirMaddeleri(ben, MUHABIR_MENUSU).map((m) => (
              <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
            ))}
          </div>
          <div className="menu-grup menu-alta">
            {muhabirMaddeleri(ben, MUHABIR_ALT).map((m) => (
              <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
            ))}
          </div>
        </>
      )}
      {dilci && (
        <>
          <div className="menu-grup" data-dil-menusu>
            {muhabirMaddeleri(ben, dilDenetmeniMi(ben) ? ["ana"] : ["muhasebe"]).map((m) => (
              <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
            ))}
          </div>
          <div className="menu-grup menu-alta">
            {muhabirMaddeleri(ben, MUHABIR_ALT).map((m) => (
              <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
            ))}
          </div>
        </>
      )}
      {masa && (
        <>
          {ozel!.gruplar.map((g, i) => (
            <div className="menu-grup" key={i} data-masa-menusu={i === 0 ? masa : undefined} data-birim-menusu={i === 0 ? masa : undefined}>
              {g.ad && <div className="menu-grup-ad">{t(g.ad)}</div>}
              {g.maddeler.map((m) => (
                <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
              ))}
            </div>
          ))}
          <div className="menu-grup menu-alta">
            {muhabirMaddeleri(ben, MUHABIR_ALT).map((m) => (
              <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
            ))}
          </div>
        </>
      )}
      {!muhabir && !dilci && !masa && MENU.map((g, i) => {
        const maddeler = g.maddeler.filter((m) => maddeGorunur(ben, m));
        if (!maddeler.length) return null;
        if (!g.ad || maddeler.length === 1) {
          return (
            <div className="menu-grup" key={i}>
              {maddeler.map((m) => (
                <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
              ))}
            </div>
          );
        }
        const grupAcik = acikGruplar.includes(g.ad);
        const sayi = maddeler.reduce((s, m) => s + (m.say?.(v, ben) ?? 0), 0);
        const id = `menu-grup-${i}`;
        return (
          <div className="menu-grup" key={i}>
            <button type="button" className="menu-grup-bas" aria-expanded={grupAcik} aria-controls={id} onClick={() => degistir(g.ad!)}>
              {t(g.ad)}
              {!grupAcik && sayi > 0 && <span className="say">{sayi}</span>}
              <ChevronDown size={14} className="ok" aria-hidden="true" />
            </button>
            <div className="menu-grup-maddeler" id={id} hidden={!grupAcik}>
              {maddeler.map((m) => (
                <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} />
              ))}
            </div>
          </div>
        );
      })}
      <div className="menu-alt">
        {!GERCEK && t("ornekVeriKisa")}
      </div>
    </nav>
  );
}
