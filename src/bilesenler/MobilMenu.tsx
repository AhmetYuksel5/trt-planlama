import { BookOpen, FlaskConical, LogOut, Plus, X } from "lucide-react";
import { useEffect } from "react";
import { useDil } from "../dil";
import { KisayolKutulari } from "../ekranlar/ortam/Kisayollar";
import { useOrtamEtiketi, useOrtamKapat, useYeniOrtam } from "../ekranlar/ortam/Sekmeler";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { kisininOrtamlari } from "../ortam";
import { cikisYap } from "../oturum";
import { useVeri, type Kisi } from "../veri";
import { useYol } from "../yol";
import { sayfaGorebilir } from "../yetki";
import DilSecici from "./DilSecici";
import { Avatar } from "./Parcalar";
import { MENU, maddeAdi, maddeGorunur } from "./AnaMenu";

/**
 * Telefonda "Menü"nün açtığı panel: kısayollar, workspace'ler, bütün
 * sayfalar, dil ve oturum. Masaüstünde bunlar sol menüye ve üst çubuğa
 * dağılmış; telefonun üst çubuğunda sekmelere ve kısayollara yer yok, tek
 * panelde topluyoruz. Sayfa listesi
 * sol menünün `MENU` tablosundan geliyor: yeni sayfa oraya girince burada
 * da çıkıyor.
 */
export default function MobilMenu({ ben, acik, onKapat }: { ben: Kisi; acik: string; onKapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const yol = useYol();
  const etiket = useOrtamEtiketi(ben);
  const kapat = useOrtamKapat(ben);
  const yeni = useYeniOrtam(ben);
  const ortamlar = kisininOrtamlari(v, ben.id);

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

      {/* Çubuktaki etiketin tam cümlesi; telefonda ipucu yok. */}
      <p className="mobil-prototip">
        <FlaskConical size={16} /> {t("demoSerit")}
      </p>

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

      <h3>{t("kisayollarim")}</h3>
      <KisayolKutulari ben={ben} sec={onKapat} />

      {sayfaGorebilir(ben, "ortam") && (
        <section className="mobil-ortamlar" aria-label={t("ortamlar")}>
          <h3>{t("ortamlar")}</h3>
          {ortamlar.map((o) => {
            const e = etiket(o);
            const etkin = yol.sayfa === "ortam" && yol.id === o.id;
            return (
              <div key={o.id} className={`mobil-ortam ${etkin ? "acik" : ""}`} data-ortam={o.id}>
                <a href={`#/ortam/${o.id}`} aria-current={etkin ? "page" : undefined} onClick={onKapat}>
                  <e.Ikon size={18} /> <span>{e.kisa}</span>
                </a>
                <button type="button" className="ikon-dugme" aria-label={t("ortamKapat", { ad: e.kisa })} title={t("ortamKapat", { ad: e.kisa })} data-ortam-kapat={o.id} onClick={() => kapat(o)}>
                  <X size={18} />
                </button>
              </div>
            );
          })}
          {/* Sınırda pasif ama odaklanabilir; nedeni yazılı. */}
          <button
            type="button"
            className={`mobil-ortam-yeni ${yeni.dolu ? "pasif" : ""}`}
            aria-disabled={yeni.dolu}
            data-yeni-ortam
            onClick={() => {
              if (yeni.dolu) return;
              onKapat();
              yeni.ac();
            }}
          >
            <Plus size={18} /> {yeni.ad}
          </button>
        </section>
      )}

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
                  <a key={m.sayfa} href={`#/${m.sayfa}`} className={acik === m.sayfa ? "acik" : ""}>
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
