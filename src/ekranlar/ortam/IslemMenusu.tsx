import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Az kullanılan işlemleri bir düğmenin arkasına toplayan küçük menü
 * (bölme ve workspace işlemleri); şerit ve bölme başlığı dar kalsın.
 * Maddeye basınca kapanıyor. Workspace bölmesine (iframe) basmak bu
 * belgeye tıklama göndermediği için pencere odağı kaybedince de kapanıyor.
 */
export function IslemMenusu({ etiket, dugmeSinifi, children }: { etiket: string; dugmeSinifi: string; children: ReactNode }) {
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!acik) return;
    const disari = (e: MouseEvent) => kap.current && !kap.current.contains(e.target as Node) && setAcik(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAcik(false);
    const kapat = () => setAcik(false);
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    window.addEventListener("blur", kapat);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("blur", kapat);
    };
  }, [acik]);
  return (
    <div className="acilir-kap" ref={kap}>
      <button type="button" className={dugmeSinifi} aria-label={etiket} title={etiket} aria-haspopup="menu" aria-expanded={acik} onClick={() => setAcik((a) => !a)}>
        <Ellipsis size={16} />
      </button>
      {acik && (
        <div className="acilir islem-menusu" role="menu" onClick={() => setAcik(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
