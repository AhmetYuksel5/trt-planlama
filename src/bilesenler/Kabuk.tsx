import { FlaskConical } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useDil } from "../dil";
import type { Kisi } from "../veri";
import AltCubuk from "./AltCubuk";
import AnaMenu from "./AnaMenu";
import MobilMenu from "./MobilMenu";
import { Bildiri } from "./Parcalar";
import UstCubuk from "./UstCubuk";

/* Bu genişliğin üstünde menü şeridi sığıyor; altında Menü paneli. CSS'teki kırılımla aynı. */
const SERIT = "(min-width: 1101px)";

/**
 * Sayfa çerçevesi: üst çubuk, menü şeridi, demo şeridi ve içerik.
 *
 * Demo şeridi her sayfada duruyor; prompt örnek verinin gerçek kurum
 * verisi gibi görünmemesini ve kalıcılığın sınırının açıkça
 * söylenmesini istiyor.
 *
 * Üç genişlik: masaüstünde üst çubuğun altında menü şeridi (gruplar
 * basınca açılıyor), sayfa tam genişlik; tablette şerit sığmıyor, üst
 * çubuktaki düğme Menü panelini açıyor; telefonda (760 px ve altı) alta
 * sekme çubuğu, onun "Menü"sü de aynı paneli açıyor. Sayfa değişince ve
 * pencere şeridin sığdığı genişliğe büyüyünce panel kapanıyor; açık kalsa
 * görünmez ama sayfa kaydırması kilitli kalırdı.
 */
export default function Kabuk({ ben, sayfa, children }: { ben: Kisi; sayfa: string; children: ReactNode }) {
  const { t } = useDil();
  const [menuAcik, setMenuAcik] = useState(false);
  const kapat = useCallback(() => setMenuAcik(false), []);
  useEffect(() => setMenuAcik(false), [sayfa]);
  useEffect(() => {
    const m = matchMedia(SERIT);
    const dinle = () => m.matches && setMenuAcik(false);
    m.addEventListener("change", dinle);
    return () => m.removeEventListener("change", dinle);
  }, []);
  return (
    <div className="uygulama">
      <div className="ana">
        <div className="ust-kap">
          <UstCubuk ben={ben} onMenu={() => setMenuAcik((a) => !a)} />
          <AnaMenu ben={ben} acik={sayfa} />
        </div>
        <div className="demo-serit">
          <FlaskConical size={14} />
          {t("demoSerit")}
        </div>
        <main className="sayfa">{children}</main>
      </div>
      <AltCubuk ben={ben} acik={sayfa} menuAcik={menuAcik} onMenu={() => setMenuAcik((a) => !a)} />
      {menuAcik && <MobilMenu ben={ben} acik={sayfa} onKapat={kapat} />}
      <Bildiri />
    </div>
  );
}
