import { Archive, Binoculars, CalendarDays, Clapperboard, Tv, ClipboardList, House, Lightbulb, Mail, MapPinned, Menu, Package, Send, Users, type LucideIcon } from "lucide-react";
import { useDil, type Anahtar } from "../dil";
import { useVeri, type Durum, type Kisi } from "../veri";
import { MASA_YOLU, masaKararlari, type MasaBirimi } from "../programMasasi";
import { izinBirimi } from "../yapi";
import { masaBirimi, sadeEkranMi, sayfaGorebilir } from "../yetki";
import { kararlariGetir } from "../planlamaKararlari";
import { okunmamisSayisi } from "../postaOkuma";
import { planlamaYeniMi } from "./AnaMenu";
import { useYeniTasarim } from "../tasarimSecimi";

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

/* Masanın sekmeleri (Programlar, Ekonomi, Spor): sayfanın bölümleri; programsız masada dördüncüsü Arşiv. */
const masaSekmeleri = (b: MasaBirimi): { yol: string; ad: Anahtar; ikon: LucideIcon; say?: (d: Durum) => number }[] => [
  { yol: "ana", ad: "abAna", ikon: House },
  { yol: `${MASA_YOLU[b]}/icerikler`, ad: "pmIcerikler", ikon: Clapperboard, say: (d) => masaKararlari(d, b).yayin },
  { yol: `${MASA_YOLU[b]}/oneriler`, ad: "pmOneriler", ikon: Lightbulb, say: (d) => masaKararlari(d, b).soru },
  b === "program" ? { yol: "programlar/programlar", ad: "pmProgramlar", ikon: Tv } : { yol: `${MASA_YOLU[b]}/arsiv`, ad: "pmArsiv", ikon: Archive },
];

/*
 * Yeni tasarımda Planlama: ana sayfa (kararlar orada), karar bekleyen
 * öneriler, Next Day, Posta. Posta gün içinde en sık dönülen yerdi ama iki
 * dokunma uzaktaydı (mobil denetim); muhabirler kişi çipinden ve aramadan
 * açılıyor, Menü'de de duruyor.
 */
const planlamaSekmeleri = (): { yol: string; ad: Anahtar; ikon: LucideIcon; say?: (d: Durum, ben: Kisi) => number }[] => [
  { yol: "ana", ad: "abAna", ikon: House },
  { yol: "oneriler", ad: "abOneriler", ikon: Lightbulb, say: (d, ben) => kararlariGetir(d, ben).oneri },
  { yol: "nextday", ad: "abNextday", ikon: CalendarDays },
  { yol: "posta", ad: "kaPosta", ikon: Mail, say: (d, ben) => okunmamisSayisi(d, ben.id) },
];

/* Next Day sekmesi doğrudan yarının planını açar: liste sayfasından 19 piksellik bağlantıya basmak gerekiyordu. */
const sekmeAdresi = (yol: string) => (yol === "ana" ? "#/" : yol === "nextday" ? "#/nextday/yarin" : `#/${yol}`);

export default function AltCubuk({ ben, acik, menuAcik, onMenu }: { ben: Kisi; acik: string; menuAcik: boolean; onMenu: () => void }) {
  const { t } = useDil();
  const muhabir = ben.birim === "muhabir";
  const planlama = izinBirimi(ben.birim) === "planlama";
  const yeni = typeof location !== "undefined" && location.hash.startsWith("#/oneriler/yeni");
  const v = useVeri();
  const masa = masaBirimi(ben);
  const yeniTasarim = useYeniTasarim();
  const sekmeler: { yol: string; ad: Anahtar; ikon: LucideIcon; say?: (d: Durum, ben: Kisi) => number }[] = sadeEkranMi(ben)
    ? []
    : muhabir
    ? MUHABIR_SEKMELERI
    : masa
    ? masaSekmeleri(masa)
    : planlamaYeniMi(ben, yeniTasarim)
    ? planlamaSekmeleri()
    : ADAYLAR.map((s) => ({ ...s, ad: muhabir && s.adMuhabir ? s.adMuhabir : s.ad })).filter((s) => sayfaGorebilir(ben, s.yol) && (s.muhabir === undefined || s.muhabir === muhabir) && (s.planlama === undefined || s.planlama === planlama)).slice(0, 4);
  const hash = typeof location !== "undefined" ? location.hash : "";
  const etkin = (y: string) => (y === "oneriler/yeni" ? yeni : y.includes("/") ? hash.startsWith(`#/${y}`) || (y.endsWith("/icerikler") && hash === `#/${y.split("/")[0]}`) : acik === y && !(y === "oneriler" && yeni));
  return (
    <nav className="alt-cubuk" aria-label={t("abMenu")}>
      {sekmeler.map((s) => {
        const Ikon = s.ikon;
        return (
          <a key={s.yol} href={sekmeAdresi(s.yol)} className={!menuAcik && etkin(s.yol) ? "acik" : ""}>
            <span className="hap">
              <Ikon size={21} />
              {!!s.say?.(v, ben) && <span className="say">{s.say(v, ben)}</span>}
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
