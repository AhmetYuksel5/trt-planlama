import { FilePen } from "lucide-react";
import { useRef } from "react";
import { aralikYaz, metin, useDil } from "../../dil";
import { haftaSonu } from "../../haftalik";
import { useBen } from "../../oturum";
import type { HaftalikPlan } from "../../veri";
import { haftalikDuzenler } from "../../yetki";
import { HaftalikBelgesi } from "../belge/HaftalikBelge";
import { CiktiAraclari } from "../belge/Parcalar";

/**
 * Haftalık planın çıktısı: kurumun Google Drive'daki Word belgesinin
 * (الأجندة الأسبوعية) yerini alan standart belge. Belgenin kendisi belge
 * görünümüyle ortak (HaftalikBelgesi): yalnız toplantıda kabul edilen ve
 * bilgi olarak giren kalemler basılıyor. Planlamacı çıktıyı alıp
 * e-postayı kendisi gönderiyor: yazdır/PDF, metni kopyala ya da Word'ün
 * ve Google Docs'un açtığı .doc dosyası.
 */
export default function HaftalikCikti({ hafta }: { hafta: HaftalikPlan }) {
  const { t } = useDil();
  const ben = useBen();
  const belge = useRef<HTMLElement>(null);
  const bas = hafta.baslangic;
  const duzenler = !!ben && haftalikDuzenler(ben, hafta);

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/haftalik/${hafta.id}`, metin: t("haftalikPlanaDon") }}
        belge={belge}
        word={{ ad: `haftalik-plan-${bas}.doc`, baslik: `${metin("haftalikCiktiBaslik", "ar")} ${aralikYaz(bas, haftaSonu(bas), "ar")}` }}
        yazdirMetni="rpYazdir"
        ek={
          duzenler && (
            <a className="dugme dugme-ikincil" href={`#/haftalik/${hafta.id}/belge`}>
              <FilePen size={16} /> {t("belgedeDuzenle")}
            </a>
          )
        }
      />

      <div className="cikti-sarici">
        <HaftalikBelgesi hafta={hafta} belgeRef={belge} />
      </div>
    </>
  );
}
