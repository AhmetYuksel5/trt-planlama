import { FilePen } from "lucide-react";
import { useRef } from "react";
import { ciktiTarihi, metin, useDil } from "../../dil";
import { useBen } from "../../oturum";
import type { NextDayPlan } from "../../veri";
import { planIcerikDuzenler, planOperasyonDuzenler } from "../../yetki";
import { BaskiOnizleme, BaskiSayfasi, BaskiSecimi, useBaski, useHemenYazdir } from "../belge/Baski";
import { NextDayBelgesi } from "../belge/NextDayBelge";
import { CiktiAraclari } from "../belge/Parcalar";

/* Baskı tasarımları ve önizleme ortak (belge/Baski.tsx); Word ve kopya kurumun düz kopyasından. */
export default function Cikti({ plan }: { plan: NextDayPlan }) {
  const { t } = useDil();
  const ben = useBen();
  const belge = useRef<HTMLElement>(null);
  const duzenler = !!ben && (planIcerikDuzenler(ben, plan) || planOperasyonDuzenler(ben, plan));
  const [baski, sec] = useBaski();
  useHemenYazdir(plan.id);

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/nextday/${plan.id}`, metin: t("planaDon") }}
        belge={belge}
        word={{ ad: `nextday-plan-${plan.tarih}.doc`, baslik: `${metin("ciktiBaslik", "ar")} ${ciktiTarihi(plan.tarih, "ar")}` }}
        ek={
          <>
            <BaskiSecimi baski={baski} sec={sec} />
            {duzenler && (
              <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/belge`}>
                <FilePen size={16} /> {t("belgedeDuzenle")}
              </a>
            )}
          </>
        }
      />
      <BaskiSayfasi baski={baski} />
      <div className={`cikti-sarici${baski ? " baski-sarici" : ""}`}>
        <NextDayBelgesi plan={plan} baski={baski} belgeRef={baski ? undefined : belge} />
      </div>
      {baski && (
        <div className="word-kaynagi" aria-hidden="true">
          <NextDayBelgesi plan={plan} belgeRef={belge} />
        </div>
      )}
    </>
  );
}

export function CiktiOnizleme({ plan, kapat }: { plan: NextDayPlan; kapat: () => void }) {
  return (
    <BaskiOnizleme
      id={plan.id}
      alt={ciktiTarihi(plan.tarih, "ar")}
      tamSayfa={`#/nextday/${plan.id}/cikti`}
      kapat={kapat}
      belge={(baski) => <NextDayBelgesi plan={plan} baski={baski} />}
    />
  );
}
