import { useDil, type Anahtar } from "../dil";
import { SimgeEv, SimgeKisiler, SimgeMenu, SimgePaket, SimgeTakvim } from "./Simgeler";

/**
 * Telefonda alttaki sekme çubuğu.
 *
 * Masaüstündeki sol menü telefonda yer kaplıyor ve başparmağın
 * ulaşamayacağı yerde kalıyordu. En sık açılan dört sayfa burada; geri
 * kalan her şey "Menü"nün açtığı panelde. Masaüstünde bu çubuk hiç
 * görünmüyor.
 */
const SEKMELER: { yol: string; ad: Anahtar; simge: () => React.ReactElement }[] = [
  { yol: "ana", ad: "anasayfa", simge: SimgeEv },
  { yol: "nextday", ad: "nextdayKisa", simge: SimgeTakvim },
  { yol: "paketler", ad: "paketlerKisa", simge: SimgePaket },
  { yol: "muhabirler", ad: "muhabirler", simge: SimgeKisiler },
];

export default function AltCubuk({ acik, menuAcik, onMenu }: { acik: string; menuAcik: boolean; onMenu: () => void }) {
  const [, t] = useDil();
  return (
    <nav className="alt-cubuk" aria-label={t("menu")}>
      {SEKMELER.map((s) => (
        <a key={s.yol} href={s.yol === "ana" ? "#/" : `#/${s.yol}`} className={!menuAcik && acik === s.yol ? "acik" : ""}>
          <span className="hap">
            <s.simge />
          </span>
          {t(s.ad)}
        </a>
      ))}
      <button type="button" className={menuAcik ? "acik" : ""} onClick={onMenu} aria-expanded={menuAcik}>
        <span className="hap">
          <SimgeMenu />
        </span>
        {t("menu")}
      </button>
    </nav>
  );
}
