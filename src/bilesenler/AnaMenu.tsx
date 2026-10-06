import {
  BookOpen,
  Calendar,
  CalendarClock,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  ChevronDown,
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
import { useEffect, useRef, useState } from "react";
import { useDil, type Anahtar } from "../dil";
import { useVeri, type Durum, type Kisi } from "../veri";
import { gorusBekleyenler } from "../haftalik";
import { bekleyenHatirlatmalar, gorunenFaaliyetler } from "../takvim";
import { paketGorebilir, sayfaGorebilir, siramMi, uretimeAlabilir, yapabilir } from "../yetki";

/**
 * Menünün tek tablosu. Masaüstünde üstteki şerit (AnaMenu), tablette ve
 * telefonda Menü paneli (MobilMenu) buradan çiziliyor; yeni sayfa yalnız
 * buraya girer. Gruplar ilk taslak promptunun 2. maddesindeki ana başlıklar:
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

/*
 * Bir madde: ikon, ad (muhabirde kendi adı), varsa önündeki iş sayısı,
 * yoksa taslak noktası. Şeritteki doğrudan bağlantı da açılır listedeki
 * madde de bu.
 */
function MenuBagi({ m, ben, acik, kapat }: { m: Madde; ben: Kisi; acik: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const sayi = m.say?.(v, ben) ?? 0;
  const Ikon = m.ikon;
  return (
    <a href={`#/${m.sayfa}`} className={acik === m.sayfa ? "acik" : ""} aria-current={acik === m.sayfa ? "page" : undefined} onClick={kapat}>
      <Ikon size={17} />
      {t(ben.birim === "muhabir" && m.adMuhabir ? m.adMuhabir : m.ad)}
      {sayi > 0 ? <span className="say">{sayi}</span> : m.taslak ? <span className="taslak-nokta" title={t("taslakAkis")} /> : null}
    </a>
  );
}

/**
 * Masaüstündeki menü şeridi: üst çubuğun altında, gruplar basınca açılıyor.
 *
 * Sol menü bütün maddeleri hep açık tutuyordu ve kalabalık görünüyordu;
 * şimdi yalnız grup adları duruyor, sayfalar basınca altında açılıyor.
 * Gruptaki iş sayıları grubun yanında toplanıyor ki kapalıyken de neyin
 * beklediği görünsün. Başlıksız grup (ana sayfa, panel) ve kişinin tek
 * maddesini gördüğü grup açılır değil, doğrudan bağlantı: tek seçenek için
 * liste açtırmak boşuna bir basış. Aynı anda tek liste açık; dışarı
 * basmak, Escape ve sayfa değişimi kapatıyor. Kapalı listenin bağlantıları
 * DOM'da `hidden` duruyor; ekran okuyucu ve sayfa içi arama için.
 */
export default function AnaMenu({ ben, acik }: { ben: Kisi; acik: string }) {
  const { t } = useDil();
  const v = useVeri();
  const [acikGrup, setAcikGrup] = useState<number | null>(null);
  const kap = useRef<HTMLElement>(null);
  const dugmeler = useRef<(HTMLButtonElement | null)[]>([]);
  const kapat = () => setAcikGrup(null);

  useEffect(() => setAcikGrup(null), [acik]);
  useEffect(() => {
    if (acikGrup === null) return;
    const disari = (e: MouseEvent) => {
      if (kap.current && !kap.current.contains(e.target as Node)) setAcikGrup(null);
    };
    const tus = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      dugmeler.current[acikGrup]?.focus();
      setAcikGrup(null);
    };
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", tus);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", tus);
    };
  }, [acikGrup]);

  return (
    <nav className="ana-menu" ref={kap} aria-label={t("anaMenu")}>
      {MENU.map((g, i) => {
        const maddeler = g.maddeler.filter((m) => maddeGorunur(ben, m));
        if (!maddeler.length) return null;
        if (!g.ad || maddeler.length === 1) return maddeler.map((m) => <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} kapat={kapat} />);
        const sayi = maddeler.reduce((s, m) => s + (m.say?.(v, ben) ?? 0), 0);
        const burada = maddeler.some((m) => m.sayfa === acik);
        const id = `ana-menu-${i}`;
        return (
          <div className="menu-grubu" key={i}>
            <button
              type="button"
              ref={(e) => {
                dugmeler.current[i] = e;
              }}
              className={`grup-dugme${burada ? " burada" : ""}`}
              aria-expanded={acikGrup === i}
              aria-controls={id}
              aria-current={burada ? "true" : undefined}
              onClick={() => setAcikGrup(acikGrup === i ? null : i)}
            >
              {t(g.ad)}
              {sayi > 0 && <span className="say">{sayi}</span>}
              <ChevronDown size={15} className="ok" aria-hidden="true" />
            </button>
            <div className="acilir-grup" id={id} hidden={acikGrup !== i}>
              {maddeler.map((m) => (
                <MenuBagi key={m.sayfa} m={m} ben={ben} acik={acik} kapat={kapat} />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
