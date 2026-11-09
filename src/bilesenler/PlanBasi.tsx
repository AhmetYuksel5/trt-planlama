import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useDil } from "../dil";

/*
 * Plan ekranlarının ortak üst kısmı (Next Day, Weekly, Aylık, Özel yayın;
 * kullanıcı: üstte gereksiz kalabalık vardı, üç tasarım önerisinin
 * birleşimi): tek satır başlık, sağda ↶ ve ⋯; altında "Sıradaki" kartı
 * (durum çizgisi ve planın o anki tek işi); altında künye ve araçlar.
 * Telefonda üç satır, masaüstünde kart başlık satırına geçer. Dolu düğme
 * yalnız gerçek kararda (onay, kesinleştirme); rutin iş `.dugme-yumusak`.
 */
export interface PlanAdimi {
  ad: string;
  /** Tam adı ipucunda (kartta kısa ad). */
  ipucu?: string;
  durum: "gecti" | "simdi" | "";
}

export function DurumAdimlari({ adimlar }: { adimlar: PlanAdimi[] }) {
  const { t } = useDil();
  return (
    <div className="durum-cizgisi" aria-label={t("planDurumu")}>
      {adimlar.map((a, i) => (
        <span key={i} className={a.durum} title={a.ipucu}>
          {i > 0 && <span className="ayrac" aria-hidden="true" />}
          <i>{a.durum === "gecti" ? <Check size={11} /> : i + 1}</i>
          {a.ad}
        </span>
      ))}
    </div>
  );
}

/* Sıradaki planın adımları: şimdiki adımdan öncesi geçti. */
export const adimlariKur = <T extends string>(sira: readonly T[], simdi: T, ad: (d: T) => { ad: string; ipucu?: string }): PlanAdimi[] => {
  const i = sira.indexOf(simdi);
  return sira.map((d, j) => ({ ...ad(d), durum: j < i ? "gecti" : j === i ? "simdi" : "" }));
};

export function PlanBasiKalibi({
  geri,
  baslik,
  baslikTekrar = true,
  uc,
  adimlar,
  metin,
  dugmeler,
  kunye,
  araclar,
  veri,
}: {
  /** Sol baştaki düğme (geri bağı ya da önceki dönem). */
  geri?: ReactNode;
  baslik: ReactNode;
  /** Başlık masaüstünde sekmede de yazıyorsa sayfada tekrar etmez (sayfa-adi-tekrar). */
  baslikTekrar?: boolean;
  uc?: ReactNode;
  adimlar: PlanAdimi[];
  metin?: ReactNode;
  dugmeler?: ReactNode;
  kunye?: ReactNode;
  araclar?: ReactNode;
  veri?: Record<string, string>;
}) {
  const { t } = useDil();
  return (
    <header className="sayfa-basi plan-basi" {...veri}>
      {geri}
      <h1 className={baslikTekrar ? "sayfa-adi-tekrar" : "pb-baslik-hep"}>{baslik}</h1>
      {uc && <span className="pb-uc">{uc}</span>}
      <section className="siradaki-karti" aria-label={t("pbSiradaki")}>
        <DurumAdimlari adimlar={adimlar} />
        {(metin || dugmeler) && (
          <div className="sk-is">
            <span className="sk-metin">{metin}</span>
            {dugmeler && <span className="sk-dugmeler">{dugmeler}</span>}
          </div>
        )}
      </section>
      {(kunye || araclar) && (
        <div className="pb-alt">
          {kunye && <p className="pb-kunye">{kunye}</p>}
          {araclar && (
            <nav className="pb-araclar" aria-label={t("planAraclari")}>
              {araclar}
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
