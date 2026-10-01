import { FlaskConical } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useDil } from "../dil";
import type { Kisi } from "../veri";
import { Bildiri } from "./Parcalar";
import SolMenu from "./SolMenu";
import UstCubuk from "./UstCubuk";

/**
 * Sayfa çerçevesi: sol menü, üst çubuk, demo şeridi ve içerik.
 *
 * Demo şeridi her sayfada duruyor; prompt örnek verinin gerçek kurum
 * verisi gibi görünmemesini ve kalıcılığın sınırının açıkça
 * söylenmesini istiyor. Dar ekranda menü kenardan açılan çekmeceye
 * dönüşüyor ve sayfa değişince kendiliğinden kapanıyor.
 */
export default function Kabuk({ ben, sayfa, children }: { ben: Kisi; sayfa: string; children: ReactNode }) {
  const { t } = useDil();
  const [menuAcik, setMenuAcik] = useState(false);
  useEffect(() => setMenuAcik(false), [sayfa]);
  return (
    <div className={`uygulama ${menuAcik ? "menu-acik" : ""}`}>
      <SolMenu ben={ben} acik={sayfa} />
      <div className="perde" onClick={() => setMenuAcik(false)} />
      <div className="ana">
        <UstCubuk ben={ben} onMenu={() => setMenuAcik((a) => !a)} />
        <div className="demo-serit">
          <FlaskConical size={14} />
          {t("demoSerit")}
        </div>
        <main className="sayfa">{children}</main>
      </div>
      <Bildiri />
    </div>
  );
}
