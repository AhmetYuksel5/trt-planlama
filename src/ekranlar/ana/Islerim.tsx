import { ClipboardList, Users } from "lucide-react";
import { Kart, Rozet } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { isDurumu } from "../../eylemler";
import { kisininIsleri } from "../../gorevler";
import { bugun } from "../../tarih";
import { useVeri, type Kisi } from "../../veri";
import { birimAdi } from "../../yapi";

/*
 * Planlama dışındaki birimlerde yöneticinin verdiği işler ("Bana verilen
 * işler"): adıyla ya da ekibine verilen açık işler; iş buradan bitiriliyor.
 * Planlama'da aynı işler "Bugünkü görevlerim"de. Açık iş yoksa kart hiç
 * çizilmiyor, ana sayfada yer kaplamasın.
 */
export function BanaVerilenIsler({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const isler = kisininIsleri(v, ben.id);
  if (!isler.length) return null;
  return (
    <Kart baslik={t("gvBanaVerilenler")} ikon={<ClipboardList size={18} />}>
      <ul className="liste" data-bana-verilenler>
        {isler.map((x) => (
          <li key={x.id} data-bana-verilen={x.id}>
            <label className="secim ad">
              <input type="checkbox" checked={false} onChange={() => isDurumu(ben, x.id, "bitti")} aria-label={t("gvBitti")} />
              <span>
                <span dir="auto">{x.baslik}</span>
                {x.aciklama && (
                  <small className="sonuk is-aciklama" dir="auto">
                    {x.aciklama}
                  </small>
                )}
                <small className="sonuk">
                  {ad(v.kisiler.find((k) => k.id === x.olusturan))}
                  {x.birimler?.includes(ben.birim as never) && (
                    <>
                      {" · "}
                      <Users size={12} /> {birimAdi(ben.birim)}
                    </>
                  )}
                </small>
              </span>
            </label>
            {x.sonTarih && <Rozet ton={x.sonTarih < bugun() ? "kotu" : undefined}>{tarihYaz(x.sonTarih, dil, "kisa")}</Rozet>}
          </li>
        ))}
      </ul>
    </Kart>
  );
}
