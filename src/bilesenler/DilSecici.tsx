import { DILLER, dilAyarla, useDil, type Dil } from "../dil";

/* Her dil kendi adıyla yazılıyor ki dili bilmeyen de kendi dilini bulsun. */
const AD: Record<Dil, string> = { tr: "TR", ar: "عربي", en: "EN" };

export default function DilSecici() {
  const { dil, t } = useDil();
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
