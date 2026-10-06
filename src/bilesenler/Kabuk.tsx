import { FlaskConical } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useDil } from "../dil";
import type { Kisi } from "../veri";
import AltCubuk from "./AltCubuk";
import MobilMenu from "./MobilMenu";
import { Bildiri } from "./Parcalar";
import AnaMenu from "./AnaMenu";
import UstCubuk from "./UstCubuk";

/**
 * Sayfa çerçevesi: sol menü, üst çubuk, demo şeridi ve içerik.
 *
 * Demo şeridi her sayfada duruyor; prompt örnek verinin gerçek kurum
 * verisi gibi görünmemesini ve kalıcılığın sınırının açıkça
 * söylenmesini istiyor.
 *
 * Üç genişlik: masaüstünde sol menü; tablette kenardan açılan çekmece;
 * telefonda (760 px ve altı) ayrı düzen, sol menü yok, alta sekme çubuğu
 * ve "Menü" paneli. Çekmece ile panel aynı "menü açık" durumunu
 * paylaşıyor; hangisinin göründüğüne CSS karar veriyor. Sayfa değişince
 * ikisi de kapanıyor.
 *
 * Masaüstünde üst çubuktaki düğme menüyü tamamen gizliyor, sayfa tam
 * genişliğe geçiyor. Bu, kişiye değil tarayıcıya bağlı bir görünüm
 * tercihi (dil seçimi gibi): tarayıcıda saklanıyor, kayıt şeması
 * değişmiyor. Tablette aynı düğme çekmeceyi açıyor; gizleme tercihi
 * çekmeceyi etkilemiyor.
 */

/* CSS'teki kırılımla aynı: bunun üstünde menü sabit, altında çekmece. */
const MASAUSTU = "(min-width: 961px)";
const MENU_SAKLA = "trt-planlama-menu";

const gizliMi = () => {
  try {
    return localStorage.getItem(MENU_SAKLA) === "gizli";
  } catch {
    return false;
  }
};

function useMasaustu() {
  return useSyncExternalStore(
    (d) => {
      const m = matchMedia(MASAUSTU);
      m.addEventListener("change", d);
      return () => m.removeEventListener("change", d);
    },
    () => matchMedia(MASAUSTU).matches,
  );
}
export default function Kabuk({ ben, sayfa, children }: { ben: Kisi; sayfa: string; children: ReactNode }) {
  const { t } = useDil();
  const [menuAcik, setMenuAcik] = useState(false);
  const [menuGizli, setMenuGizli] = useState(gizliMi);
  const masaustu = useMasaustu();
  const kapat = useCallback(() => setMenuAcik(false), []);
  useEffect(() => setMenuAcik(false), [sayfa]);
  useEffect(() => {
    try {
      if (menuGizli) localStorage.setItem(MENU_SAKLA, "gizli");
      else localStorage.removeItem(MENU_SAKLA);
    } catch {
      /* özel pencerede saklanamaz; yalnız bu oturumda geçerli */
    }
  }, [menuGizli]);
  const menuDugmesi = () => (masaustu ? setMenuGizli((g) => !g) : setMenuAcik((a) => !a));
  return (
    <div className={`uygulama ${menuAcik ? "menu-acik" : ""} ${menuGizli ? "menu-gizli" : ""}`}>
      <AnaMenu ben={ben} acik={sayfa} />
      <div className="perde" onClick={kapat} />
      <div className="ana">
        <UstCubuk ben={ben} onMenu={menuDugmesi} masaustu={masaustu} menuGorunur={masaustu ? !menuGizli : menuAcik} />
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
