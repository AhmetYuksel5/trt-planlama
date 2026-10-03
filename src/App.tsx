import { useEffect, type ReactNode } from "react";
import Kabuk from "./bilesenler/Kabuk";
import AnaSayfa from "./ekranlar/AnaSayfa";
import YoneticiPaneli from "./ekranlar/YoneticiPaneli";
import { Ayarlar, Yetkisiz } from "./ekranlar/Ayarlar";
import Raporlar from "./ekranlar/Raporlar";
import Basliklar from "./ekranlar/Basliklar";
import Giris from "./ekranlar/Giris";
import { IsAkisi, Paketler, StokHaberler, Ucretler } from "./ekranlar/Listeler";
import Cikti from "./ekranlar/nextday/Cikti";
import NextDayListe from "./ekranlar/nextday/Liste";
import PlanEkrani from "./ekranlar/nextday/Plan";
import { Cagri, Yanitlar } from "./ekranlar/oneri/Eposta";
import { OneriDetay, OnerilerListe, YeniOneri } from "./ekranlar/oneri/Oneriler";
import PaketDetay from "./ekranlar/PaketDetay";
import { Gorevlendirmeler, KisiDetay, PersonelListe } from "./ekranlar/Personel";
import { Aylik, Ozel } from "./ekranlar/Planlar";
import HaftalikCagri from "./ekranlar/haftalik/Cagri";
import HaftalikCikti from "./ekranlar/haftalik/Cikti";
import HaftalikListe from "./ekranlar/haftalik/Liste";
import HaftalikPlanEkrani from "./ekranlar/haftalik/Plan";
import ProjePlani from "./ekranlar/ProjePlani";
import { useBen } from "./oturum";
import { haftaBul, kisiBul, oneriBul, paketBul, planBul, useVeri, yarinPlani } from "./veri";
// veri.ts eylemler.ts'ten önce yüklenmeli: açılışta örnek veriyi kurarken eposta.ts'e dayanıyor (döngü).
import { yarinPlaniniAc } from "./eylemler";
import { oneriGorebilir, paketGorebilir, sayfaGorebilir, yapabilir } from "./yetki";
import { useYol } from "./yol";

/**
 * Uygulamanın girişi: oturum yoksa demo giriş, varsa kabuk ve sayfa.
 *
 * Proje planı girişsiz açılıyor; yöneticilere bağlantıyla gösterilecek.
 * Her sayfa önce birim iznine (yetki.ts → SAYFA_IZNI), kayıt sayfaları
 * ayrıca kaydın görünürlüğüne bakıyor: muhabir başka muhabirin paketinin
 * adresini elle yazsa da "yetkisiz" görüyor.
 */
/* Gün dönümünü yakalamak için arada bir: uygulama gece açık kalsa da sabah yarının planı hazır. */
const GUN_YOKLAMA = 10 * 60 * 1000;

export default function App() {
  const yol = useYol();
  const ben = useBen();
  const v = useVeri();
  // Next Day her gün sürüyor: yarının planı yoksa sistem önceki planın şablonuyla açıyor.
  useEffect(() => {
    yarinPlaniniAc();
    const z = setInterval(yarinPlaniniAc, GUN_YOKLAMA);
    return () => clearInterval(z);
  }, []);

  if (yol.sayfa === "plan") return <ProjePlani />;
  if (!ben) return <Giris />;

  const sayfa = yol.sayfa;
  let icerik: ReactNode;
  if (!sayfaGorebilir(ben, sayfa)) {
    icerik = <Yetkisiz />;
  } else {
    switch (sayfa) {
      case "ana":
        icerik = <AnaSayfa ben={ben} />;
        break;
      case "panel":
        icerik = <YoneticiPaneli ben={ben} birim={yol.id} />;
        break;
      case "nextday": {
        // "yarin": ana sayfadaki kısayol hangi kimlik olduğunu bilmeden yarının planına gidiyor.
        const plan = yol.id === "yarin" ? yarinPlani(v) : planBul(v, yol.id);
        if (yol.id && !plan) icerik = <Yetkisiz />;
        else if (plan && yol.alt === "cikti") icerik = <Cikti plan={plan} />;
        else if (plan) icerik = <PlanEkrani ben={ben} plan={plan} />;
        else icerik = <NextDayListe />;
        break;
      }
      case "haftalik": {
        const hafta = haftaBul(v, yol.id);
        if (yol.id && !hafta) icerik = <Yetkisiz />;
        else if (hafta && yol.alt === "cikti") icerik = <HaftalikCikti hafta={hafta} />;
        else if (hafta && yol.alt === "cagri") icerik = yapabilir(ben, "cagriHazirla") ? <HaftalikCagri ben={ben} hafta={hafta} /> : <Yetkisiz />;
        else if (hafta) icerik = <HaftalikPlanEkrani ben={ben} hafta={hafta} />;
        else icerik = <HaftalikListe ben={ben} />;
        break;
      }
      case "aylik":
        icerik = <Aylik />;
        break;
      case "ozel":
        icerik = <Ozel />;
        break;
      case "oneriler": {
        if (yol.id === "yeni") icerik = <YeniOneri ben={ben} haftalik={yol.alt === "haftalik"} />;
        else if (yol.id === "cagri") icerik = yapabilir(ben, "cagriHazirla") ? <Cagri ben={ben} tarih={yol.alt} /> : <Yetkisiz />;
        else if (yol.id === "yanitlar") icerik = yapabilir(ben, "cagriHazirla") ? <Yanitlar ben={ben} cagriId={yol.alt} /> : <Yetkisiz />;
        else if (yol.id) {
          const o = oneriBul(v, yol.id);
          icerik = o && oneriGorebilir(ben, o) ? <OneriDetay ben={ben} oneri={o} /> : <Yetkisiz />;
        } else icerik = <OnerilerListe ben={ben} />;
        break;
      }
      case "basliklar":
        icerik = <Basliklar ben={ben} />;
        break;
      case "paketler":
        if (yol.id) {
          const p = paketBul(v, yol.id);
          icerik = p && paketGorebilir(ben, p, v) ? <PaketDetay ben={ben} paket={p} /> : <Yetkisiz />;
        } else icerik = <Paketler ben={ben} sayfa="paketler" />;
        break;
      case "feature":
      case "programlar":
        icerik = <Paketler ben={ben} sayfa={sayfa} />;
        break;
      case "stok":
        icerik = <StokHaberler ben={ben} />;
        break;
      case "profil":
        icerik = <KisiDetay ben={ben} kisi={ben} />;
        break;
      case "muhabirler":
      case "editorler":
      case "personel":
        if (yol.id) {
          const k = kisiBul(v, yol.id);
          icerik = k ? <KisiDetay ben={ben} kisi={k} /> : <Yetkisiz />;
        } else icerik = <PersonelListe ben={ben} sayfa={sayfa} />;
        break;
      case "izinler":
      case "saha":
      case "seyahat":
      case "talepler":
        icerik = <Gorevlendirmeler ben={ben} sayfa={sayfa} />;
        break;
      case "uretim":
      case "metinkontrol":
      case "video":
        icerik = <IsAkisi sayfa={sayfa} />;
        break;
      case "ucretler":
        icerik = <Ucretler ben={ben} />;
        break;
      case "raporlar":
        icerik = <Raporlar ben={ben} />;
        break;
      case "ayarlar":
        icerik = <Ayarlar ben={ben} />;
        break;
      default:
        icerik = <Yetkisiz />;
    }
  }

  return (
    <Kabuk ben={ben} sayfa={sayfa}>
      {icerik}
    </Kabuk>
  );
}
