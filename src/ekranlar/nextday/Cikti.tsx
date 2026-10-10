import { FilePen } from "lucide-react";
import { useRef } from "react";
import { ciktiTarihi, metin, useDil } from "../../dil";
import { useBen } from "../../oturum";
import type { NextDayPlan } from "../../veri";
import { planIcerikDuzenler, planOperasyonDuzenler } from "../../yetki";
import { NextDayBelgesi } from "../belge/NextDayBelge";
import { CiktiAraclari } from "../belge/Parcalar";

/**
 * Planın temiz çıktısı: akşam haber toplantısına götürülen belge. Belgenin
 * kendisi belge görünümüyle ortak (NextDayBelgesi); düzenleme yetkisi
 * olana "Belgede düzenle" aynı kağıdı düzenlenebilir açıyor. Yazdır (PDF
 * dahil), Word ve metni kopyala buradan.
 */
export default function Cikti({ plan }: { plan: NextDayPlan }) {
  const { t } = useDil();
  const ben = useBen();
  const belge = useRef<HTMLElement>(null);
  const duzenler = !!ben && (planIcerikDuzenler(ben, plan) || planOperasyonDuzenler(ben, plan));

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/nextday/${plan.id}`, metin: t("planaDon") }}
        belge={belge}
        word={{ ad: `nextday-plan-${plan.tarih}.doc`, baslik: `${metin("ciktiBaslik", "ar")} ${ciktiTarihi(plan.tarih, "ar")}` }}
        ek={
          duzenler && (
            <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/belge`}>
              <FilePen size={16} /> {t("belgedeDuzenle")}
            </a>
          )
        }
      />
      <div className="cikti-sarici">
        <NextDayBelgesi plan={plan} belgeRef={belge} />
      </div>
    </>
  );
}
