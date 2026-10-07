import type { ReactNode } from "react";
import { bolmeModulleri, maddeAdi } from "../../bilesenler/AnaMenu";
import { useDil } from "../../dil";
import { kisininKisayollari } from "../../kisayol";
import { bolmeyeGirer } from "../../ortam";
import { useVeri, type Kisi } from "../../veri";
import { KisayolKutusu, kisayolBilgisi } from "./Kisayollar";

/**
 * Workspace'e açılacak sayfaların kutucukları: önce kişinin kısayolları
 * (en sık açtıkları), sonra menünün grupları. Liste menü tablosundan
 * (AnaMenu → MENU) kuruluyor; kişi menüde ne görüyorsa onu seçebiliyor.
 *
 * İki kullanım:
 * - Yeni workspace sayfası çoklu seçiyor (`secili`): seçilen kutucuk sıra
 *   rozeti alıyor, sınırdaki kutucuk nedeniyle pasif.
 * - Bölmenin içindeki seçim tek tıkla açıyor (`kompakt`).
 */
export function ModulIzgarasi({
  ben,
  sec,
  secili,
  dolu = false,
  dolulukNedeni,
  kompakt = false,
}: {
  ben: Kisi;
  sec: (yol: string) => void;
  secili?: string[];
  /** Çoklu seçimde sınıra gelindi: seçili olmayan kutucuklar pasif. */
  dolu?: boolean;
  dolulukNedeni?: string;
  kompakt?: boolean;
}) {
  const { t } = useDil();
  const v = useVeri();
  const kisayollar = kisininKisayollari(v, ben).filter((k) => bolmeyeGirer(ben, k));

  const kutu = (yol: string, ikon: ReactNode, ad: string) => {
    const sira = secili ? secili.indexOf(yol) : -1;
    const pasif = !!secili && sira < 0 && dolu;
    return (
      <button
        key={yol}
        type="button"
        className={`modul-secenek ${sira >= 0 ? "secili" : ""} ${pasif ? "pasif" : ""}`}
        data-modul={yol}
        aria-pressed={secili ? sira >= 0 : undefined}
        aria-disabled={pasif || undefined}
        title={pasif ? dolulukNedeni : undefined}
        onClick={() => !pasif && sec(yol)}
      >
        {ikon}
        <span className="modul-adi">{ad}</span>
        {sira >= 0 && (
          <span className="sira-rozet" aria-hidden="true">
            {sira + 1}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`modul-secici ${kompakt ? "kompakt" : ""}`}>
      {kisayollar.length > 0 && (
        <section className="modul-grup">
          <h3>{t("kisayollarim")}</h3>
          <div className="modul-secenekler">
            {kisayollar.map((k) => {
              const b = kisayolBilgisi(ben, k);
              return b && kutu(k, <KisayolKutusu ben={ben} kimlik={k} bag={false} />, t(b.ad));
            })}
          </div>
        </section>
      )}
      {bolmeModulleri(ben).map((g, i) => (
        <section key={g.ad ?? i} className="modul-grup">
          {g.ad && <h3>{t(g.ad)}</h3>}
          <div className="modul-secenekler">
            {g.maddeler.map((m) => {
              const Ikon = m.ikon;
              return kutu(m.sayfa, <Ikon size={18} className="modul-ikon" />, t(maddeAdi(ben, m)));
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
