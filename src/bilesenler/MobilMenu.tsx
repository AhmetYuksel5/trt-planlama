import { birimAdi, gorevAdi } from "../yapi";
import { BookOpen, FlaskConical, Info, LogIn, LogOut, Settings, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { katmanBaglantisi, useGeriKapatir } from "../yol";
import { useDil } from "../dil";
import { KisayolKutulari } from "../ekranlar/ortam/Kisayollar";
import { GERCEK, demoyuAc, girisiAc } from "../kip";
import { oturumdanCik } from "../oturum";
import type { Kisi } from "../veri";
import DilSecici from "./DilSecici";
import { Avatar } from "./Parcalar";
import { dilDenetmeniMi, masaBirimi, sadeEkranMi } from "../yetki";
import { MUHABIR_ALT, MUHABIR_MENUSU, maddeAdi, menuGruplari, muhabirMaddeleri, planlamaYeniMi } from "./AnaMenu";
import { useYeniTasarim } from "../tasarimSecimi";

/**
 * Telefonda "Menü"nün açtığı panel: kişi, kısayollar (renkli plan
 * kutuları), bütün sayfalar, dil ve oturum. Workspace telefonda yok:
 * dar ekranda birkaç sayfayı bir arada açmak işe yaramıyor. Sayfa listesi
 * sol menünün `MENU` tablosundan geliyor: yeni sayfa oraya girince burada
 * da çıkıyor.
 */
export default function MobilMenu({
  ben,
  acik,
  onKapat,
}: {
  ben: Kisi;
  acik: string;
  onKapat: () => void;
}) {
  const { t, ad } = useDil();
  // Dil denetmeni de muhabir gibi sade: tek sayfası ve Ayarlar.
  const dilci = sadeEkranMi(ben);
  const muhabir = ben.birim === "muhabir" || dilci;
  const yeniTasarim = useYeniTasarim();

  // Geri tuşu paneli kapatır (sayfadan çıkarıyordu); odak panele girer, arkadaki sayfa etkisiz.
  useGeriKapatir(true, onKapat);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ana = document.querySelector(".uygulama > .ana");
    ana?.setAttribute("inert", "");
    panel.current?.querySelector<HTMLElement>(".mobil-menu-ust button")?.focus({ preventScroll: true });
    return () => ana?.removeAttribute("inert");
  }, []);
  // Panel açıkken arkadaki sayfa kaymasın; Escape kapatsın.
  useEffect(() => {
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tus = (e: KeyboardEvent) => e.key === "Escape" && onKapat();
    window.addEventListener("keydown", tus);
    return () => {
      document.body.style.overflow = onceki;
      window.removeEventListener("keydown", tus);
    };
  }, [onKapat]);

  return (
    <div
      ref={panel}
      className="mobil-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t("abMenu")}
      onClick={(e) => katmanBaglantisi(e, onKapat)}
    >
      <div className="mobil-menu-ust">
        <strong>{t("abMenu")}</strong>
        <button
          type="button"
          className="ikon-dugme"
          onClick={onKapat}
          aria-label={t("kapat")}
        >
          <X size={20} />
        </button>
      </div>

      <div className="mobil-kisi">
        <a
          className="mobil-kisi-bag"
          href="#/profil"
          onClick={onKapat}
          aria-label={t("profilim")}
        >
          <Avatar kisi={ben} durum />
          <div>
            <b>{ad(ben)}</b>
            <small>
              {birimAdi(ben.birim)} · {gorevAdi(ben.gorev)}
            </small>
          </div>
        </a>
        <button
          type="button"
          className="dugme dugme-ikincil dugme-kucuk"
          onClick={() => {
            onKapat();
            oturumdanCik();
          }}
        >
          <LogOut size={15} className="yon" />{" "}
          {t(GERCEK ? "cikisYap" : "kisiDegistirKisa")}
        </button>
      </div>

      {/* Muhabirde menünün aynı altı maddesi; kısayol ve öbür sayfalar yok. */}
      {muhabir ? (
        <nav className="mobil-kayitlar" data-mobil-muhabir>
          {muhabirMaddeleri(ben, dilci ? [dilDenetmeniMi(ben) ? "ana" : "muhasebe", ...MUHABIR_ALT] : [...MUHABIR_MENUSU, ...MUHABIR_ALT]).map((m) => {
            const Ikon = m.ikon;
            return (
              <a key={m.sayfa} href={`#/${m.sayfa}`} onClick={onKapat}>
                <Ikon size={18} />
                {t(maddeAdi(ben, m))}
              </a>
            );
          })}
        </nav>
      ) : masaBirimi(ben) || planlamaYeniMi(ben, yeniTasarim) ? null : (
        <>
          <h3>{t("kisayollarim")}</h3>
          <KisayolKutulari ben={ben} sec={onKapat} />
        </>
      )}

      {/* Masada (Programlar, Ekonomi, Spor) kendi menüsü (AnaMenu → masaMenusu). */}
      {!muhabir && menuGruplari(ben, yeniTasarim).map((g, i) => {
        const maddeler = g.maddeler;
        return (
          <section key={i}>
            {g.ad && <h3>{t(g.ad)}</h3>}
            <nav className="mobil-kayitlar">
              {maddeler.map((m) => {
                const Ikon = m.ikon;
                return (
                  <a
                    key={m.sayfa}
                    href={`#/${m.sayfa}`}
                    className={acik === m.sayfa || (m.sayfa.includes("/") && location.hash.startsWith(`#/${m.sayfa}`)) ? "acik" : ""}
                  >
                    <Ikon size={18} />
                    {t(maddeAdi(ben, m))}
                  </a>
                );
              })}
            </nav>
          </section>
        );
      })}

      {/* Birimin menüsünde (yeni tasarımda Planlama, masa) Ayarlar menünün altındaki ayrı satırda; panelde hiç yoktu, yalnız avatar menüsündeydi. */}
      {!muhabir && !menuGruplari(ben, yeniTasarim).some((g) => g.maddeler.some((m) => m.sayfa === "ayarlar")) && (
        <nav className="mobil-kayitlar" data-mobil-ayarlar>
          <a href="#/ayarlar" className={acik === "ayarlar" ? "acik" : ""}>
            <Settings size={18} />
            {t("mAyarlar")}
          </a>
        </nav>
      )}

      <h3>{t("tercihler")}</h3>
      <div className="mobil-tercih">
        <span>{t("dilSec")}</span>
        <DilSecici />
      </div>
      {!muhabir && (
        <a className="dugme dugme-ikincil ara-ust-2 tam-genislik" href="#/plan">
          <BookOpen size={16} /> {t("mProjePlani")}
        </a>
      )}
      <a className="dugme dugme-ikincil ara-ust-2 tam-genislik" href="#/tanitim" onClick={onKapat}>
        <Info size={16} /> {t("tanitimSayfasi")}
      </a>
      {GERCEK ? (
        <button type="button" className="dugme dugme-ikincil ara-ust-2 tam-genislik" onClick={demoyuAc} data-mobil-demo>
          <FlaskConical size={16} /> {t("demoyuDene")}
        </button>
      ) : (
        <button type="button" className="dugme dugme-ikincil ara-ust-2 tam-genislik" onClick={girisiAc} data-mobil-giris>
          <LogIn size={16} className="yon" /> {t("ggBaslik")}
        </button>
      )}
    </div>
  );
}
