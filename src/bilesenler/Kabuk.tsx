import { FlaskConical } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useDil } from "../dil";
import type { Kisi } from "../veri";
import AltCubuk from "./AltCubuk";
import MobilMenu from "./MobilMenu";
import { Bildiri } from "./Parcalar";
import SolMenu from "./SolMenu";
import UstCubuk from "./UstCubuk";

/**
 * Sayfa çerçevesi: sol menü, üst çubuk, demo şeridi ve içerik.
 *
 * Demo şeridi her sayfada duruyor; prompt örnek verinin gerçek kurum
 * verisi gibi görünmemesini ve kalıcılığın sınırının açıkça
 * söylenmesini istiyor.
 *
 * Üç genişlik: masaüstünde sol menü sabit; tablette kenardan açılan
 * çekmece; telefonda (760 px ve altı) ayrı düzen, sol menü yok, alta sekme
 * çubuğu ve "Menü" paneli. Çekmece ile panel aynı "menü açık" durumunu
 * paylaşıyor; hangisinin göründüğüne CSS karar veriyor. Sayfa değişince
 * ikisi de kapanıyor.
 */
export default function Kabuk({ ben, sayfa, children }: { ben: Kisi; sayfa: string; children: ReactNode }) {
  const { t } = useDil();
  const [menuAcik, setMenuAcik] = useState(false);
  const kapat = useCallback(() => setMenuAcik(false), []);
  useEffect(() => setMenuAcik(false), [sayfa]);
  return (
    <div className={`uygulama ${menuAcik ? "menu-acik" : ""}`}>
      <SolMenu ben={ben} acik={sayfa} />
      <div className="perde" onClick={kapat} />
      <div className="ana">
        <UstCubuk ben={ben} onMenu={() => setMenuAcik((a) => !a)} />
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
