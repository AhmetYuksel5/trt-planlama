import {
  BookOpen,
  Building,
  Calendar,
  CalendarClock,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  ChevronDown,
  CircleUser,
  Clapperboard,
  Contact,
  Gauge,
  House,
  Inbox,
  Layers,
  Lightbulb,
  MapPinned,
  MonitorPlay,
  Newspaper,
  Package,
  Route,
  Settings,
  SpellCheck,
  TrendingUp,
  Tv,
  UserRound,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDil, type Anahtar } from "../dil";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { useVeri, type Durum, type Kisi } from "../veri";
import { gorusBekleyenler } from "../haftalik";
import { bolmeyeGirer } from "../ortam";
import { bekleyenHatirlatmalar, gorunenFaaliyetler } from "../takvim";
import { paketGorebilir, sayfaGorebilir, siramMi, uretimeAlabilir, yapabilir } from "../yetki";
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
        ikon: House,
        say: (d, ben) => d.paketler.filter((p) => p.durum === "uretimde" && siramMi(ben, p) && paketGorebilir(ben, p, d)).length,
      },
      // Yönetim biriminde panel zaten ana sayfa; birim yöneticisi ona buradan ulaşıyor.
      { sayfa: "panel", ad: "mPanel", ikon: Gauge, goster: (ben) => ben.birim !== "yonetim" },
    ],
  },
  {
    ad: "mgPlanlama",
    maddeler: [
      { sayfa: "nextday", ad: "mNextday", ikon: CalendarDays },
      // Sayı: kişinin önündeki ön inceleme (müdür, Ekonomi).
      { sayfa: "haftalik", ad: "mHaftalik", ikon: CalendarRange, say: (d, ben) => gorusBekleyenler(d, ben).length },
      { sayfa: "aylik", ad: "mAylik", ikon: Calendar, taslak: true },
      { sayfa: "ozel", ad: "mOzel", ikon: Tv, taslak: true },
      // Sayı: zamanı gelen hatırlatmalar; yalnız takvimi tutanlara ve muhabire (kendi faaliyeti), öbür masalara gürültü olmasın.
      {
        sayfa: "takvim",
        ad: "mTakvim",
        adMuhabir: "mTakvimim",
        ikon: CalendarCheck,
        say: (d, ben) => (yapabilir(ben, "takvimDuzenle") || ben.birim === "muhabir" ? bekleyenHatirlatmalar(gorunenFaaliyetler(d, ben)).length : 0),
      },
    ],
  },
  {
    ad: "mgPersonel",
    maddeler: [
      { sayfa: "muhabirler", ad: "mMuhabirler", ikon: Users },
      { sayfa: "editorler", ad: "mEditorler", ikon: UserRound },
      { sayfa: "personel", ad: "mPersonel", ikon: Contact },
      { sayfa: "izinler", ad: "mIzinler", ikon: CalendarClock },
    ],
  },
  {
    ad: "mgIcerik",
    maddeler: [
      {
        sayfa: "oneriler",
        ad: "mOneriler",
        adMuhabir: "mOnerilerim",
        ikon: Lightbulb,
        say: (d, ben) => (ben.birim === "muhabir" ? 0 : d.oneriler.filter((o) => o.durum === "yeni").length),
      },
      { sayfa: "basliklar", ad: "mBasliklar", ikon: Newspaper },
      { sayfa: "paketler", ad: "mPaketler", adMuhabir: "mPaketlerim", ikon: Package },
      { sayfa: "feature", ad: "mFeature", ikon: TrendingUp },
      { sayfa: "programlar", ad: "mProgramlar", ikon: Clapperboard },
      // Sayı: kişinin üretime alabileceği paketler (Planlama'da feature/stok ekibi).
      { sayfa: "stok", ad: "mStok", ikon: Layers, say: (d, ben) => d.paketler.filter((p) => uretimeAlabilir(ben, p)).length },
    ],
  },
  {
    ad: "mgGorevlendirme",
    maddeler: [
      { sayfa: "saha", ad: "mSaha", adMuhabir: "mGorevlerim", ikon: MapPinned },
      { sayfa: "seyahat", ad: "mSeyahat", ikon: Route },
      { sayfa: "talepler", ad: "mTalepler", ikon: Inbox },
    ],
  },
  {
    ad: "mgIsAkisi",
    maddeler: [
      { sayfa: "uretim", ad: "mUretim", ikon: Workflow },
      { sayfa: "metinkontrol", ad: "mMetinKontrol", ikon: SpellCheck },
      { sayfa: "video", ad: "mVideo", ikon: MonitorPlay },
    ],
  },
  {
    ad: "mgDiger",
    maddeler: [
      { sayfa: "ucretler", ad: "mUcretler", ikon: Wallet },
      { sayfa: "raporlar", ad: "mRaporlar", ikon: ChartColumn },
      { sayfa: "plan", ad: "mProjePlani", ikon: BookOpen },
      { sayfa: "ayarlar", ad: "mAyarlar", ikon: Settings },
    ],
  },
];

/** Maddenin kişiye göre adı: muhabirin menüsü kendi işine daralıyor ("İşlerim", "Önerilerim"). */
export const maddeAdi = (ben: Kisi, m: Madde): Anahtar => (ben.birim === "muhabir" && m.adMuhabir ? m.adMuhabir : m.ad);

/* Menüde olmayan ama adresle açılan sayfa; workspace bölmesinin başlığı onu da adlandırsın. */
const PROFIL: Madde = { sayfa: "profil", ad: "profilim", ikon: CircleUser };

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
  const sayi = m.say?.(v, ben) ?? 0;
  const Ikon = m.ikon;
  return (
    <a href={`#/${m.sayfa}`} className={acik === m.sayfa ? "acik" : ""} aria-current={acik === m.sayfa ? "page" : undefined}>
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
  const { t } = useDil();
  const v = useVeri();
  const [acikGruplar, setAcikGruplar] = useState<string[]>(acikGruplariOku);

  useEffect(() => {
    const g = sayfaGrubu(acik);
    if (g) setAcikGruplar((x) => (x.includes(g) ? x : [...x, g]));
  }, [acik]);
  useEffect(() => acikGruplariYaz(acikGruplar), [acikGruplar]);

  const degistir = (g: string) => setAcikGruplar((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g]));

  return (
    <nav className="menu" id="ana-menu" aria-label={t("anaMenu")}>
      <a className="marka" href="#/" aria-label={t("uygulama")}>
        <Logo levha />
      </a>
      <span className="marka-alt">{t("markaAlt")}</span>
      <div className="birim-kutusu">
        <Building size={20} />
        <div>
          {t(BIRIM_ADI[ben.birim])}
          <small>{t(GOREV_ADI[ben.gorev])}</small>
        </div>
      </div>
      {MENU.map((g, i) => {
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
        <b>TRT</b>
        {t("ornekVeriKisa")}
      </div>
    </nav>
  );
}
