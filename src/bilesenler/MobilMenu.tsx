import { useEffect } from "react";
import { DILLER, dilAyarla, useDil, type Dil } from "../dil";
import { ROLLER, ROL_ADI, type Rol } from "../veri";
import { BASLIKLAR } from "./AnaBasliklar";
import { SimgeKapat } from "./Simgeler";
import { MADDELER } from "./SolMenu";

/**
 * Telefonda "Menü"nün açtığı panel: beş plan başlığı, bütün kayıt
 * defterleri, dil ve rol. Masaüstünde bunlar üst şerit, sol menü ve üst
 * çubuğa dağılmış durumda; telefonda üçüne birden yer yok, tek panelde
 * topluyoruz.
 */
export default function MobilMenu({ acik, onKapat, rol, onRol }: { acik: string; onKapat: () => void; rol: Rol; onRol: (r: Rol) => void }) {
  const [dil, t] = useDil();

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
    <div className="mobil-menu" role="dialog" aria-modal="true" aria-label={t("menu")}>
      <div className="mobil-menu-ust">
        <strong>{t("menu")}</strong>
        <button type="button" className="ikon-dugme" onClick={onKapat} aria-label={t("kapat")}>
          <SimgeKapat />
        </button>
      </div>

      <input className="ara" type="search" placeholder={t("ara")} aria-label={t("ara")} />

      <h3>{t("planlar")}</h3>
      <div className="mobil-planlar">
        {BASLIKLAR.map((b) => (
          <div key={b.yol} className={`baslik baslik-${b.yol} ${acik === b.yol ? "acik" : ""}`}>
            <a href={`#/${b.yol}`}>
              <strong>{t(b.ad)}</strong>
            </a>
            <a className="olustur" href={`#/${b.yol}/yeni`}>
              {t("olustur")}
            </a>
          </div>
        ))}
      </div>

      <h3>{t("kayitlar")}</h3>
      <nav className="mobil-kayitlar">
        {MADDELER.map((m) => (
          <a key={m.yol} href={m.yol === "ana" ? "#/" : `#/${m.yol}`} className={acik === m.yol ? "acik" : ""}>
            {t(m.ad)}
          </a>
        ))}
      </nav>

      <h3>{t("tercihler")}</h3>
      <div className="form">
        <label>
          {t("dil")}
          <select value={dil} onChange={(e) => dilAyarla(e.target.value as Dil)}>
            {DILLER.map((d) => (
              <option key={d} value={d}>
                {d.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("rol")}
          <select value={rol} onChange={(e) => onRol(e.target.value as Rol)}>
            {ROLLER.map((r) => (
              <option key={r} value={r}>
                {t(ROL_ADI[r])}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
