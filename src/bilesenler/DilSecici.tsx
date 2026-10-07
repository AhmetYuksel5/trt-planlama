import { ChevronDown } from "lucide-react";
import { DILLER, dilAyarla, useDil, type Dil } from "../dil";
import { IslemMenusu } from "./IslemMenusu";

/* Her dil kendi adıyla yazılıyor ki dili bilmeyen de kendi dilini bulsun. */
const AD: Record<Dil, string> = { tr: "TR", ar: "عربي", en: "EN" };
const TAM_AD: Record<Dil, string> = { tr: "Türkçe", ar: "العربية", en: "English" };

/**
 * Dil seçimi. Üst çubukta kompakt ("TR ▾"): çubuk tek satır kalsın, yer
 * sekmelere ve kısayollara gitsin. Girişte ve telefonun Menü panelinde
 * üç düğme yan yana, yer var.
 */
export default function DilSecici({ kompakt = false }: { kompakt?: boolean }) {
  const { dil, t } = useDil();
  if (kompakt)
    return (
      <IslemMenusu
        etiket={t("dilSec")}
        dugmeSinifi="ikon-dugme dil-kompakt"
        menuSinifi="dil-menusu"
        ikon={
          <>
            <span lang={dil}>{AD[dil]}</span>
            <ChevronDown size={14} />
          </>
        }
      >
        {DILLER.map((d) => (
          <button key={d} type="button" role="menuitemradio" aria-checked={d === dil} className="acilir-satir" lang={d} onClick={() => dilAyarla(d)}>
            {TAM_AD[d]}
          </button>
        ))}
      </IslemMenusu>
    );
  return (
    <div className="dil-secici" role="group" aria-label={t("dilSec")}>
      {DILLER.map((d) => (
        <button key={d} type="button" className={d === dil ? "acik" : ""} lang={d} aria-pressed={d === dil} onClick={() => dilAyarla(d)}>
          {AD[d]}
        </button>
      ))}
    </div>
  );
}
