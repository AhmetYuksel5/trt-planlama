import {
  BookOpen,
  Building,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChartColumn,
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
import { useDil, type Anahtar } from "../dil";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { useVeri, type Durum, type Kisi } from "../veri";
import { gorusBekleyenler } from "../haftalik";
import { paketGorebilir, sayfaGorebilir, siramMi, uretimeAlabilir } from "../yetki";
import Logo from "./Logo";

/**
 * Sol menü. Gruplar ilk taslak promptunun 2. maddesindeki ana başlıklar:
 * Planlama, Personel, İçerik ve haberler, Görevlendirmeler, İş akışları,
 * Raporlar. Her kişi yalnız yetkisi olan maddeleri görüyor; muhabirin
 * menüsü kendi işlerine daralıyor. Henüz yalnız taslağı olan sayfalar
 * gri bir noktayla işaretli.
 */

interface Madde {
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

export default function SolMenu({ ben, acik }: { ben: Kisi; acik: string }) {
  const { t } = useDil();
  const v = useVeri();
  const muhabir = ben.birim === "muhabir";
  return (
    <nav className="menu" aria-label={t("anaMenu")}>
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
        return (
          <div className="menu-grup" key={i}>
            {g.ad && <h3>{t(g.ad)}</h3>}
            {maddeler.map((m) => {
              const sayi = m.say?.(v, ben) ?? 0;
              const Ikon = m.ikon;
              return (
                <a key={m.sayfa} href={`#/${m.sayfa}`} className={acik === m.sayfa ? "acik" : ""} aria-current={acik === m.sayfa ? "page" : undefined}>
                  <Ikon size={18} />
                  {t(muhabir && m.adMuhabir ? m.adMuhabir : m.ad)}
                  {sayi > 0 ? <span className="say">{sayi}</span> : m.taslak ? <span className="taslak-nokta" title={t("taslakAkis")} /> : null}
                </a>
              );
            })}
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
