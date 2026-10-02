import { CalendarDays, House, Lightbulb, MapPinned, Menu, Package, Users, type LucideIcon } from "lucide-react";
import { useDil, type Anahtar } from "../dil";
import type { Kisi } from "../veri";
import { sayfaGorebilir } from "../yetki";

/**
 * Telefonda alttaki sekme çubuğu.
 *
 * Masaüstündeki sol menü telefonda yer kaplıyor ve başparmağın
 * ulaşamayacağı yerde kalıyordu. Kişinin yetkili olduğu en sık dört sayfa
 * burada (muhabirde kendi işleri); geri kalan her şey "Menü"nün açtığı
 * panelde. Masaüstünde bu çubuk hiç görünmüyor.
 */
const ADAYLAR: { yol: string; ad: Anahtar; adMuhabir?: Anahtar; ikon: LucideIcon }[] = [
  { yol: "ana", ad: "abAna", adMuhabir: "abIslerim", ikon: House },
  { yol: "nextday", ad: "abNextday", ikon: CalendarDays },
  { yol: "oneriler", ad: "abOneriler", adMuhabir: "abOnerilerim", ikon: Lightbulb },
  { yol: "paketler", ad: "abPaketler", adMuhabir: "abPaketlerim", ikon: Package },
  { yol: "muhabirler", ad: "abMuhabirler", ikon: Users },
  { yol: "saha", ad: "abGorevlerim", ikon: MapPinned },
];

export default function AltCubuk({ ben, acik, menuAcik, onMenu }: { ben: Kisi; acik: string; menuAcik: boolean; onMenu: () => void }) {
  const { t } = useDil();
  const muhabir = ben.birim === "muhabir";
  const sekmeler = ADAYLAR.filter((s) => sayfaGorebilir(ben, s.yol)).slice(0, 4);
  return (
    <nav className="alt-cubuk" aria-label={t("abMenu")}>
      {sekmeler.map((s) => {
        const Ikon = s.ikon;
        return (
          <a key={s.yol} href={s.yol === "ana" ? "#/" : `#/${s.yol}`} className={!menuAcik && acik === s.yol ? "acik" : ""}>
            <span className="hap">
              <Ikon size={21} />
            </span>
            {t(muhabir && s.adMuhabir ? s.adMuhabir : s.ad)}
          </a>
        );
      })}
      <button type="button" className={menuAcik ? "acik" : ""} onClick={onMenu} aria-expanded={menuAcik}>
        <span className="hap">
          <Menu size={21} />
        </span>
        {t("abMenu")}
      </button>
    </nav>
  );
}
