import { birimAdi, gorevAdi } from "../yapi";
import { BookOpen, LogOut, X } from "lucide-react";
import { useEffect } from "react";
import { useDil } from "../dil";
import { KisayolKutulari } from "../ekranlar/ortam/Kisayollar";
import { GERCEK } from "../kip";
import { oturumdanCik } from "../oturum";
import type { Kisi } from "../veri";
import DilSecici from "./DilSecici";
import { Avatar } from "./Parcalar";
import { MENU, maddeAdi, maddeGorunur } from "./AnaMenu";

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
      className="mobil-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t("abMenu")}
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

      <h3>{t("kisayollarim")}</h3>
      <KisayolKutulari ben={ben} sec={onKapat} />

      {MENU.map((g, i) => {
        const maddeler = g.maddeler.filter((m) => maddeGorunur(ben, m));
        if (!maddeler.length) return null;
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
                    className={acik === m.sayfa ? "acik" : ""}
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

      <h3>{t("tercihler")}</h3>
      <div className="mobil-tercih">
        <span>{t("dilSec")}</span>
        <DilSecici />
      </div>
      <a className="dugme dugme-ikincil ara-ust-2 tam-genislik" href="#/plan">
        <BookOpen size={16} /> {t("mProjePlani")}
      </a>
    </div>
  );
}
