import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Kisi } from "../veri";
import AltCubuk from "./AltCubuk";
import MobilMenu from "./MobilMenu";
import { Bildiri } from "./Parcalar";
import AnaMenu from "./AnaMenu";
import UstCubuk from "./UstCubuk";

/**
 * Sayfa çerçevesi: sol menü, üst çubuk ve içerik.
 *
 * Prototip uyarısı (örnek veri gerçek kurum verisi gibi görünmesin,
 * kalıcılığın sınırı söylensin) ayrı bir satır değil, üst çubukta her
 * sayfada görünen etiket; satırı sayfaya kalıyor.
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
 *
 * Workspace üst çubuğun sekmesi (menüde ayrı madde yok): menüde vurgulu
 * madde kalmıyor, etkin olan sekme. Sayfa ekran boyunda duruyor ki
 * bölmeler kendi içinde kaysın.
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
export default function Kabuk({ ben, sayfa, ortamAcik = false, children }: { ben: Kisi; sayfa: string; ortamAcik?: boolean; children: ReactNode }) {
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
  const menuSayfasi = sayfa === "ortam" ? "" : sayfa;
  return (
    <div className={`uygulama ${menuAcik ? "menu-acik" : ""} ${menuGizli ? "menu-gizli" : ""} ${ortamAcik ? "ortam-acik" : ""}`}>
      <AnaMenu ben={ben} acik={menuSayfasi} />
      <div className="perde" onClick={kapat} />
      <div className="ana">
        <UstCubuk ben={ben} onMenu={menuDugmesi} masaustu={masaustu} menuGorunur={masaustu ? !menuGizli : menuAcik} />
        <main className="sayfa">{children}</main>
      </div>
      <AltCubuk ben={ben} acik={menuSayfasi} menuAcik={menuAcik} onMenu={() => setMenuAcik((a) => !a)} />
      {menuAcik && <MobilMenu ben={ben} acik={menuSayfasi} onKapat={kapat} />}
      <Bildiri />
    </div>
  );
}
