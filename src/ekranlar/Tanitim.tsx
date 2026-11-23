import {
  Archive,
  ArrowRight,
  Building2,
  Calculator,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Clapperboard,
  Database,
  FlaskConical,
  Gauge,
  Languages,
  LayoutGrid,
  Lightbulb,
  LogIn,
  Mail,
  ShieldCheck,
  Smartphone,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import DilSecici from "../bilesenler/DilSecici";
import Logo from "../bilesenler/Logo";
import { useDil, type Anahtar } from "../dil";
import { demoyuAc, girisiAc } from "../kip";
import { birimAdi, kisiBirimleri, varsayilanYapi } from "../yapi";

/**
 * Tanıtım sayfası: plannersflow.net çıplak açılınca (demoda) ya da `#/tanitim`.
 * Sistemi tanıtıyor, üstte "Demo" ve "Giriş"; kurum girişine artık buradan
 * gidiliyor (eskiden logoya üç tık). Ekranlarda kullanım anlatılmaz kuralının
 * tek istisnası: sayfanın işi anlatmak.
 *
 * Sayfa içi bağlantılar `#…` olamaz (adres hash yönlendirmesi); bölümlere
 * düğmeyle kayılıyor.
 */

/*
 * Bugünkü akış (kullanıcı: tanıtım eskimişti, eski beş sabit aşamayı ve Newsdesk'in
 * devrini anlatıyordu; paketin yolu artık üretim balonunda paket paket seçiliyor).
 */
const ADIMLAR: { baslik: Anahtar; metin: Anahtar }[] = [
  { baslik: "tnA1", metin: "tnA1Metin" },
  { baslik: "tnA2", metin: "tnA2Metin" },
  { baslik: "tnA3", metin: "tnA3Metin" },
  { baslik: "tnA4", metin: "tnA4Metin" },
  { baslik: "tnA5", metin: "tnA5Metin" },
];

/*
 * Renk yalnız planların ana başlıklarında (tasarım dili): Next Day ve haftalık kendi renginde, kalanı vurgu.
 * Metinler genel: sayfa girişsiz okunuyor, kurumun altyapısının adı (posta sunucusu, yayın sistemi) geçmez.
 */
const OZELLIKLER: { ikon: LucideIcon; baslik: Anahtar; metin: Anahtar; renk?: string }[] = [
  { ikon: CalendarDays, baslik: "tnOzNextday", metin: "tnOzNextdayMetin", renk: "nextday" },
  { ikon: CalendarRange, baslik: "tnOzHaftalik", metin: "tnOzHaftalikMetin", renk: "haftalik" },
  { ikon: Lightbulb, baslik: "tnOzOneri", metin: "tnOzOneriMetin" },
  { ikon: Workflow, baslik: "tnOzUretim", metin: "tnOzUretimMetin" },
  { ikon: Mail, baslik: "tnOzPosta", metin: "tnOzPostaMetin" },
  { ikon: Clapperboard, baslik: "tnOzMasalar", metin: "tnOzMasalarMetin" },
  { ikon: Archive, baslik: "tnOzStok", metin: "tnOzStokMetin" },
  { ikon: CalendarCheck, baslik: "tnOzTakvim", metin: "tnOzTakvimMetin" },
  { ikon: Calculator, baslik: "tnOzMuhasebe", metin: "tnOzMuhasebeMetin" },
  { ikon: Gauge, baslik: "tnOzPanel", metin: "tnOzPanelMetin" },
  { ikon: Building2, baslik: "tnOzOrganizasyon", metin: "tnOzOrganizasyonMetin" },
  { ikon: LayoutGrid, baslik: "tnOzOrtam", metin: "tnOzOrtamMetin" },
];

const ILKELER: { ikon: LucideIcon; baslik: Anahtar; metin: Anahtar }[] = [
  { ikon: Database, baslik: "tnIlkeKayit", metin: "tnIlkeKayitMetin" },
  { ikon: ShieldCheck, baslik: "tnIlkeYetki", metin: "tnIlkeYetkiMetin" },
  { ikon: Languages, baslik: "tnIlkeDil", metin: "tnIlkeDilMetin" },
  { ikon: Smartphone, baslik: "tnIlkeTelefon", metin: "tnIlkeTelefonMetin" },
];

function Dugmeler({ buyuk = false }: { buyuk?: boolean }) {
  const { t } = useDil();
  return (
    <div className="tanitim-dugmeler">
      <button type="button" className={`dugme${buyuk ? "" : " dugme-kucuk"}`} onClick={demoyuAc} data-tanitim-demo>
        <FlaskConical size={16} /> {t(buyuk ? "demoyuDene" : "demo")}
      </button>
      <button type="button" className={`dugme dugme-ikincil${buyuk ? "" : " dugme-kucuk"}`} onClick={girisiAc} data-tanitim-giris>
        <LogIn size={16} className="yon" /> {t("ggGirisYap")}
      </button>
    </div>
  );
}

export default function Tanitim() {
  const { t } = useDil();
  const nasil = useRef<HTMLElement>(null);
  const ozellikler = useRef<HTMLElement>(null);
  const birimler = useRef<HTMLElement>(null);
  // Uygulamanın içinden (#/tanitim) gelince sayfa başından açılsın.
  // Süslü parantez: yeni tarayıcılarda scrollTo Promise döndürüyor, React onu temizleyici sanıp çıkışta çöküyordu.
  useEffect(() => {
    scrollTo(0, 0);
  }, []);
  const kay = (r: RefObject<HTMLElement | null>) => r.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  // Kurumun kendi açtığı birimler değil, yerleşik yapı: sayfa girişsiz okunuyor.
  const yapi = varsayilanYapi();

  return (
    <div className="tanitim">
      <header className="tanitim-ust">
        <a className="tanitim-marka" href="#/tanitim" aria-label={t("uygulama")}>
          <Logo />
        </a>
        <nav className="tanitim-nav" aria-label={t("tanitimSayfasi")}>
          <button type="button" onClick={() => kay(nasil)}>
            {t("tnNasil")}
          </button>
          <button type="button" onClick={() => kay(ozellikler)}>
            {t("tnOzellikler")}
          </button>
          <button type="button" onClick={() => kay(birimler)}>
            {t("tnBirimler")}
          </button>
        </nav>
        <div className="tanitim-ust-sag">
          <DilSecici kompakt />
          <Dugmeler />
        </div>
      </header>

      <section className="tanitim-kahraman">
        <div className="tanitim-kahraman-ic">
          <div>
            <span className="tanitim-etiket">{t("tnEtiket")}</span>
            <h1>{t("tnBaslik")}</h1>
            <p>{t("tnAlt")}</p>
            <Dugmeler buyuk />
            <small>{t("tnDemoNotu")}</small>
          </div>
          {/* Süs: bir haberin akıştaki yeri; gerçek veri değil. */}
          <div className="tanitim-gorsel" aria-hidden="true">
            <div className="tanitim-kagit">
              <div className="tanitim-kagit-bas">
                <span className="renk-nextday" />
                <b>Next Day</b>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="tanitim-satir" />
              ))}
              <ol className="tanitim-iz">
                {ADIMLAR.map((a, i) => (
                  <li key={a.baslik} className={i < 3 ? "gecti" : i === 3 ? "simdi" : ""}>
                    <i />
                    <span>{t(a.baslik)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <main className="tanitim-govde">
        <section ref={nasil} className="tanitim-bolum" data-tanitim-nasil>
          <h2>{t("tnNasil")}</h2>
          <p className="tanitim-alt">{t("tnNasilAlt")}</p>
          <ol className="tanitim-adimlar">
            {ADIMLAR.map((a, i) => (
              <li key={a.baslik}>
                <span className="tanitim-sira">{i + 1}</span>
                <h3>{t(a.baslik)}</h3>
                <p>{t(a.metin)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section ref={ozellikler} className="tanitim-bolum" data-tanitim-ozellikler>
          <h2>{t("tnOzellikler")}</h2>
          <div className="tanitim-kartlar">
            {OZELLIKLER.map(({ ikon: Ikon, baslik, metin, renk }) => (
              <article key={baslik} className="tanitim-kart">
                <span className={`tanitim-ikon ${renk ? `renk-${renk}` : "renk-genel"}`}>
                  <Ikon size={20} />
                </span>
                <h3>{t(baslik)}</h3>
                <p>{t(metin)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="tanitim-ilkeler">
          {ILKELER.map(({ ikon: Ikon, baslik, metin }) => (
            <div key={baslik}>
              <Ikon size={22} />
              <h3>{t(baslik)}</h3>
              <p>{t(metin)}</p>
            </div>
          ))}
        </section>

        <section ref={birimler} className="tanitim-bolum" data-tanitim-birimler>
          <h2>{t("tnBirimler")}</h2>
          <p className="tanitim-alt">{t("tnBirimlerAlt")}</p>
          <ul className="tanitim-birimler">
            {kisiBirimleri(yapi).map((b) => (
              <li key={b}>{birimAdi(b, yapi)}</li>
            ))}
          </ul>
        </section>
      </main>

      <section className="tanitim-son">
        <h2>{t("tnSonBaslik")}</h2>
        <p>{t("tnSonAlt")}</p>
        <div className="tanitim-dugmeler">
          <button type="button" className="dugme" onClick={demoyuAc}>
            <FlaskConical size={16} /> {t("demoyuDene")} <ArrowRight size={16} className="yon" />
          </button>
          <button type="button" className="dugme dugme-ikincil" onClick={girisiAc}>
            <LogIn size={16} className="yon" /> {t("ggGirisYap")}
          </button>
        </div>
      </section>

      <footer className="tanitim-alt-bilgi">
        <Logo />
        <span>{t("uygulama")}</span>
      </footer>
    </div>
  );
}
