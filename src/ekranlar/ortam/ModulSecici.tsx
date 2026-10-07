import { bolmeModulleri, maddeAdi } from "../../bilesenler/AnaMenu";
import { Pencere } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import type { Kisi } from "../../veri";

/**
 * Bölmeye açılacak sayfanın seçimi: menünün grupları, kişinin menüde
 * gördükleri. Liste menü tablosundan (AnaMenu → MENU) kuruluyor; yeni
 * sayfa menüye girince burada da çıkıyor.
 */
export function ModulSecici({ ben, baslik, sec, kapat }: { ben: Kisi; baslik: string; sec: (sayfa: string) => void; kapat: () => void }) {
  const { t } = useDil();
  return (
    <Pencere baslik={baslik} alt={t("modulSecAlt")} kapat={kapat}>
      <div className="modul-secici">
        {bolmeModulleri(ben).map((g, i) => (
          <section key={g.ad ?? i} className="modul-grup">
            {g.ad && <h3>{t(g.ad)}</h3>}
            <div className="modul-secenekler">
              {g.maddeler.map((m) => {
                const Ikon = m.ikon;
                return (
                  <button key={m.sayfa} type="button" className="modul-secenek" data-modul={m.sayfa} onClick={() => sec(m.sayfa)}>
                    <Ikon size={18} /> {t(maddeAdi(ben, m))}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Pencere>
  );
}
