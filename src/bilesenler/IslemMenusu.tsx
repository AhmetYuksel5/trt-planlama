import { Ellipsis } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* Menü ile düğme ve ekran kenarı arasındaki boşluk (katmanda). */
const ARA = 6;

/**
 * Az kullanılan işlemleri bir düğmenin arkasına toplayan küçük menü
 * (bölme ve workspace işlemleri); çubuk ve bölme başlığı dar kalsın.
 * Maddeye basınca kapanıyor. Workspace bölmesine (iframe) basmak bu
 * belgeye tıklama göndermediği için pencere odağı kaybedince de kapanıyor.
 */
export function IslemMenusu({
  etiket,
  dugmeSinifi,
  ikon,
  menuSinifi = "",
  katman = false,
  children,
}: {
  etiket: string;
  dugmeSinifi: string;
  /** Varsayılan ⋯; workspace sekmesinde ▾. */
  ikon?: ReactNode;
  menuSinifi?: string;
  /**
   * Menü üst katmanda (popover): kayan bir şeridin içindeki düğmede menü
   * şeridin sınırında kırpılmasın (workspace sekmesinin ▾'ı). DOM'daki yeri
   * aynı; Tab sırası düğmenin hemen arkasından sürüyor.
   */
  katman?: boolean;
  children: ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  const dugme = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
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

  // Katmandaki menü sayfanın akışında değil: yeri düğmeden ölçülüyor, ekrandan taşmıyor.
  useLayoutEffect(() => {
    const m = menu.current;
    const d = dugme.current;
    if (!acik || !katman || !m || !d || !m.showPopover) return;
    m.showPopover();
    const yerlestir = () => {
      const r = d.getBoundingClientRect();
      const genislik = m.offsetWidth;
      // Arapçada menü düğmenin sağ kenarından sola açılıyor; ölçü ekran koordinatında olduğu için fiziksel.
      const bas = getComputedStyle(d).direction === "rtl" ? r.right - genislik : r.left;
      m.style.top = `${r.bottom + ARA}px`;
      m.style.left = `${Math.min(Math.max(bas, ARA), innerWidth - genislik - ARA)}px`;
    };
    yerlestir();
    window.addEventListener("resize", yerlestir);
    window.addEventListener("scroll", yerlestir, true);
    return () => {
      window.removeEventListener("resize", yerlestir);
      window.removeEventListener("scroll", yerlestir, true);
    };
  }, [acik, katman]);

  return (
    <div className="acilir-kap" ref={kap}>
      <button ref={dugme} type="button" className={dugmeSinifi} aria-label={etiket} title={etiket} aria-haspopup="menu" aria-expanded={acik} onClick={() => setAcik((a) => !a)}>
        {ikon ?? <Ellipsis size={16} />}
      </button>
      {acik && (
        <div ref={menu} className={`acilir islem-menusu ${menuSinifi}`} role="menu" popover={katman ? "manual" : undefined} onClick={() => setAcik(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
