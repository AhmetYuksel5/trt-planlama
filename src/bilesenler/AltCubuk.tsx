import { Binoculars, CalendarDays, ClipboardList, House, Lightbulb, MapPinned, Menu, Package, Send, Users, type LucideIcon } from "lucide-react";
import { useDil, type Anahtar } from "../dil";
import type { Kisi } from "../veri";
import { izinBirimi } from "../yapi";
import { sayfaGorebilir } from "../yetki";

/**
 * Telefonda alttaki sekme çubuğu.
 *
 * Masaüstündeki sol menü telefonda yer kaplıyor ve başparmağın
 * ulaşamayacağı yerde kalıyordu. Kişinin yetkili olduğu en sık dört sayfa
 * burada (muhabirde kendi işleri); geri kalan her şey "Menü"nün açtığı
 * panelde. Masaüstünde bu çubuk hiç görünmüyor.
 */
/* Muhabirde öneriler İşlerim'in içinde (düğme); sekmede onların yerine takipleri.
 * Planlama telefonda Next Day'i az açıyor, günün görevlerini çok: onun
 * sekmesinde Next Day yerine Görevler (Next Day Menü'de duruyor). */
const ADAYLAR: { yol: string; ad: Anahtar; adMuhabir?: Anahtar; ikon: LucideIcon; muhabir?: boolean; planlama?: boolean }[] = [
  { yol: "ana", ad: "abAna", adMuhabir: "abIslerim", ikon: House },
  { yol: "nextday", ad: "abNextday", ikon: CalendarDays, planlama: false },
  { yol: "gorevler", ad: "kaGorevler", ikon: ClipboardList, planlama: true },
  { yol: "oneriler", ad: "abOneriler", ikon: Lightbulb, muhabir: false },
  { yol: "takipler", ad: "abTakiplerim", ikon: Binoculars, muhabir: true },
  { yol: "paketler", ad: "abPaketler", adMuhabir: "abPaketlerim", ikon: Package },
  { yol: "muhabirler", ad: "abMuhabirler", ikon: Users },
  { yol: "saha", ad: "abGorevlerim", ikon: MapPinned },
];

/* Muhabirin dört sekmesi; Görevlendirmeler ve Ayarlar "Menü"de. */
const MUHABIR_SEKMELERI: { yol: string; ad: Anahtar; ikon: LucideIcon }[] = [
  { yol: "oneriler/yeni", ad: "kaOneriGonder", ikon: Send },
  { yol: "oneriler", ad: "kaOnerilerim", ikon: Lightbulb },
  { yol: "takipler", ad: "abTakiplerim", ikon: Binoculars },
  { yol: "paketler", ad: "abPaketlerim", ikon: Package },
];

export default function AltCubuk({ ben, acik, menuAcik, onMenu }: { ben: Kisi; acik: string; menuAcik: boolean; onMenu: () => void }) {
  const { t } = useDil();
  const muhabir = ben.birim === "muhabir";
  const planlama = izinBirimi(ben.birim) === "planlama";
  const yeni = typeof location !== "undefined" && location.hash.startsWith("#/oneriler/yeni");
  const sekmeler: { yol: string; ad: Anahtar; ikon: LucideIcon }[] = muhabir
    ? MUHABIR_SEKMELERI
    : ADAYLAR.map((s) => ({ ...s, ad: muhabir && s.adMuhabir ? s.adMuhabir : s.ad })).filter((s) => sayfaGorebilir(ben, s.yol) && (s.muhabir === undefined || s.muhabir === muhabir) && (s.planlama === undefined || s.planlama === planlama)).slice(0, 4);
  const etkin = (y: string) => (y === "oneriler/yeni" ? yeni : acik === y && !(y === "oneriler" && yeni));
  return (
    <nav className="alt-cubuk" aria-label={t("abMenu")}>
      {sekmeler.map((s) => {
        const Ikon = s.ikon;
        return (
          <a key={s.yol} href={s.yol === "ana" ? "#/" : `#/${s.yol}`} className={!menuAcik && etkin(s.yol) ? "acik" : ""}>
            <span className="hap">
              <Ikon size={21} />
            </span>
            {t(s.ad)}
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
