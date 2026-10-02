import { BookOpen, LogOut, X } from "lucide-react";
import { useEffect } from "react";
import { useDil } from "../dil";
import { PlanKisayollari } from "../ekranlar/ana/Planlama";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { cikisYap } from "../oturum";
import type { Kisi } from "../veri";
import { sayfaGorebilir } from "../yetki";
import DilSecici from "./DilSecici";
import { Avatar } from "./Parcalar";
import { MENU } from "./SolMenu";

/**
 * Telefonda "Menü"nün açtığı panel: plan kısayolları, bütün sayfalar,
 * dil ve oturum. Masaüstünde bunlar sol menüye ve üst çubuğa dağılmış;
 * telefonda ikisine birden yer yok, tek panelde topluyoruz. Sayfa listesi
 * sol menünün `MENU` tablosundan geliyor: yeni sayfa oraya girince burada
 * da çıkıyor.
 */
export default function MobilMenu({ ben, acik, onKapat }: { ben: Kisi; acik: string; onKapat: () => void }) {
  const { t, ad } = useDil();
  const muhabir = ben.birim === "muhabir";

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
    <div className="mobil-menu" role="dialog" aria-modal="true" aria-label={t("abMenu")}>
      <div className="mobil-menu-ust">
        <strong>{t("abMenu")}</strong>
        <button type="button" className="ikon-dugme" onClick={onKapat} aria-label={t("kapat")}>
          <X size={20} />
        </button>
      </div>

      <div className="mobil-kisi">
        <a className="mobil-kisi-bag" href="#/profil" onClick={onKapat} aria-label={t("profilim")}>
          <Avatar kisi={ben} durum />
          <div>
            <b>{ad(ben)}</b>
            <small>
              {t(BIRIM_ADI[ben.birim])} · {t(GOREV_ADI[ben.gorev])}
            </small>
          </div>
        </a>
        <button
          type="button"
          className="dugme dugme-ikincil dugme-kucuk"
          onClick={() => {
            onKapat();
            cikisYap();
            location.hash = "#/";
          }}
        >
          <LogOut size={15} className="yon" /> {t("kisiDegistirKisa")}
        </button>
      </div>

      {sayfaGorebilir(ben, "nextday") && (
        <>
          <h3>{t("planlar")}</h3>
          <PlanKisayollari />
        </>
      )}

      {MENU.map((g, i) => {
        const maddeler = g.maddeler.filter((m) => sayfaGorebilir(ben, m.sayfa) && !(muhabir && m.muhabirGizle));
        if (!maddeler.length) return null;
        return (
          <section key={i}>
            {g.ad && <h3>{t(g.ad)}</h3>}
            <nav className="mobil-kayitlar">
              {maddeler.map((m) => {
                const Ikon = m.ikon;
                return (
                  <a key={m.sayfa} href={`#/${m.sayfa}`} className={acik === m.sayfa ? "acik" : ""}>
                    <Ikon size={18} />
                    {t(muhabir && m.adMuhabir ? m.adMuhabir : m.ad)}
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
