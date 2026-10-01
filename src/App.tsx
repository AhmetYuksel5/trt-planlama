import type { ReactNode } from "react";
import Kabuk from "./bilesenler/Kabuk";
import AnaSayfa from "./ekranlar/AnaSayfa";
import { Ayarlar, Raporlar, Yetkisiz } from "./ekranlar/Ayarlar";
import Basliklar from "./ekranlar/Basliklar";
import Giris from "./ekranlar/Giris";
import { HazirPaketler, IsAkisi, Paketler, Ucretler } from "./ekranlar/Listeler";
import Cikti from "./ekranlar/nextday/Cikti";
import NextDayListe from "./ekranlar/nextday/Liste";
import PlanEkrani from "./ekranlar/nextday/Plan";
import { Cagri, OneriDetay, OnerilerListe, YeniOneri } from "./ekranlar/oneri/Oneriler";
import PaketDetay from "./ekranlar/PaketDetay";
import { Gorevlendirmeler, KisiDetay, PersonelListe } from "./ekranlar/Personel";
import { Aylik, Haftalik, Ozel } from "./ekranlar/Planlar";
import ProjePlani from "./ekranlar/ProjePlani";
import { useBen } from "./oturum";
import { kisiBul, oneriBul, paketBul, planBul, useVeri } from "./veri";
import { oneriGorebilir, paketGorebilir, sayfaGorebilir } from "./yetki";
import { useYol } from "./yol";

/**
 * Uygulamanın girişi: oturum yoksa demo giriş, varsa kabuk ve sayfa.
 *
 * Proje planı girişsiz açılıyor; yöneticilere bağlantıyla gösterilecek.
 * Her sayfa önce birim iznine (yetki.ts → SAYFA_IZNI), kayıt sayfaları
 * ayrıca kaydın görünürlüğüne bakıyor: muhabir başka muhabirin paketinin
 * adresini elle yazsa da "yetkisiz" görüyor.
 */
export default function App() {
  const yol = useYol();
  const ben = useBen();
  const v = useVeri();

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
      case "nextday": {
        const plan = planBul(v, yol.id);
        if (yol.id && yol.id !== "yeni" && !plan) icerik = <Yetkisiz />;
        else if (plan && yol.alt === "cikti") icerik = <Cikti plan={plan} />;
        else if (plan) icerik = <PlanEkrani ben={ben} plan={plan} />;
        else icerik = <NextDayListe ben={ben} yeni={yol.id === "yeni"} />;
        break;
      }
      case "haftalik":
        icerik = <Haftalik />;
        break;
      case "aylik":
        icerik = <Aylik />;
        break;
      case "ozel":
        icerik = <Ozel />;
        break;
      case "oneriler": {
        if (yol.id === "yeni") icerik = <YeniOneri ben={ben} />;
        else if (yol.id === "cagri") icerik = sayfaGorebilir(ben, "nextday") ? <Cagri ben={ben} tarih={yol.alt} /> : <Yetkisiz />;
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
      case "hazirpaketler":
        icerik = <HazirPaketler />;
        break;
      case "muhabirler":
      case "editorler":
      case "personel":
        if (yol.id) {
          const k = kisiBul(v, yol.id);
          icerik = k ? <KisiDetay kisi={k} /> : <Yetkisiz />;
        } else icerik = <PersonelListe sayfa={sayfa} />;
        break;
      case "izinler":
      case "yurtdisi":
      case "yurtici":
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
        icerik = <Raporlar />;
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
