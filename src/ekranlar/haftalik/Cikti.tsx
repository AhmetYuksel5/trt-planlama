import { FilePen } from "lucide-react";
import { useRef } from "react";
import { aralikYaz, metin, useDil } from "../../dil";
import { haftaSonu } from "../../haftalik";
import { useBen } from "../../oturum";
import type { HaftalikPlan } from "../../veri";
import { haftalikDuzenler } from "../../yetki";
import { BaskiOnizleme, BaskiSayfasi, BaskiSecimi, useBaski, useHemenYazdir } from "../belge/Baski";
import { HaftalikBelgesi } from "../belge/HaftalikBelge";
import { CiktiAraclari } from "../belge/Parcalar";

/**
 * Haftalık planın çıktısı: kurumun Google Drive'daki Word belgesinin
 * (الأجندة الأسبوعية) yerini alan standart belge. Belgenin kendisi belge
 * görünümüyle ortak (HaftalikBelgesi): yalnız toplantıda kabul edilen ve
 * bilgi olarak giren kalemler basılıyor. Baskı tasarımları Next Day'inkiler
 * (belge/Baski.tsx; kullanıcı: aynısı Weekly'de de olsun); Word ve kopya
 * her zaman kurumun düz kopyasından. E-postayı planlamacı kendisi gönderiyor.
 */
export default function HaftalikCikti({ hafta }: { hafta: HaftalikPlan }) {
  const { t } = useDil();
  const ben = useBen();
  const belge = useRef<HTMLElement>(null);
  const bas = hafta.baslangic;
  const duzenler = !!ben && haftalikDuzenler(ben, hafta);
  const [baski, sec] = useBaski();
  useHemenYazdir(hafta.id);

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/haftalik/${hafta.id}`, metin: t("haftalikPlanaDon") }}
        belge={belge}
        word={{ ad: `haftalik-plan-${bas}.doc`, baslik: `${metin("haftalikCiktiBaslik", "ar")} ${aralikYaz(bas, haftaSonu(bas), "ar")}` }}
        yazdirMetni="rpYazdir"
        ek={
          <>
            <BaskiSecimi baski={baski} sec={sec} />
            {duzenler && (
              <a className="dugme dugme-ikincil" href={`#/haftalik/${hafta.id}/belge`}>
                <FilePen size={16} /> {t("belgedeDuzenle")}
              </a>
            )}
          </>
        }
      />
      <BaskiSayfasi baski={baski} />
      <div className={`cikti-sarici${baski ? " baski-sarici" : ""}`}>
        <HaftalikBelgesi hafta={hafta} baski={baski} belgeRef={baski ? undefined : belge} />
      </div>
      {baski && (
        <div className="word-kaynagi" aria-hidden="true">
          <HaftalikBelgesi hafta={hafta} belgeRef={belge} />
        </div>
      )}
    </>
  );
}

export function HaftalikCiktiOnizleme({ hafta, kapat }: { hafta: HaftalikPlan; kapat: () => void }) {
  const bas = hafta.baslangic;
  return (
    <BaskiOnizleme
      id={hafta.id}
      alt={aralikYaz(bas, haftaSonu(bas), "ar")}
      tamSayfa={`#/haftalik/${hafta.id}/cikti`}
      kapat={kapat}
      belge={(baski) => <HaftalikBelgesi hafta={hafta} baski={baski} />}
    />
  );
}
