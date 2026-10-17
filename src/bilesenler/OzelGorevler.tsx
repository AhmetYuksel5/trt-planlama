import { tarihYaz, useDil, type Anahtar } from "../dil";
import { ozelPaketAsamasi, type OzelPaketAsamasi } from "../ozel";
import type { Paket } from "../veri";
import { Icerik, Rozet } from "./Parcalar";

export const PAKET_ASAMA_ADI: Record<OzelPaketAsamasi, Anahtar> = {
  plan: "oyPkPlan",
  onayli: "oyPkOnayli",
  gorevli: "oyPkGorevli",
  hazirlaniyor: "oyHazirlaniyor",
  hazir: "oyPkHazir",
};

/* Görevlendirmeler listesinde özel yayın görevi: yayının adı ve son tarihiyle, paketine bağlı. */
export function OzelGorevSatirlari({ paketler }: { paketler: Paket[] }) {
  const { t, dil } = useDil();
  return (
    <>
      {paketler.map((p) => {
        const asama = ozelPaketAsamasi(p);
        return (
          <li key={p.id} data-ozel-gorev={p.id}>
            <div className="ad">
              <a href={`#/paketler/${p.id}`}>
                <Icerik blok>{p.baslik}</Icerik>
              </a>
              <small>
                {t("ozel")}
                {p.ozelAd && (
                  <>
                    {": "}
                    <Icerik>{p.ozelAd}</Icerik>
                  </>
                )}
                {p.sonTarih && ` · ${t("oySonTarih")}: ${tarihYaz(p.sonTarih, dil, "kisa")}`}
              </small>
            </div>
            <Rozet ton={asama === "hazir" ? "iyi" : "vurgu"}>{t(PAKET_ASAMA_ADI[asama])}</Rozet>
          </li>
        );
      })}
    </>
  );
}
