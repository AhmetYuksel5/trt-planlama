import { useCallback, useEffect, useState } from "react";
import AltCubuk from "./bilesenler/AltCubuk";
import AnaBasliklar from "./bilesenler/AnaBasliklar";
import MobilMenu from "./bilesenler/MobilMenu";
import SolMenu from "./bilesenler/SolMenu";
import UstCubuk from "./bilesenler/UstCubuk";
import { useDil, type Anahtar } from "./dil";
import AnaSayfa from "./ekranlar/AnaSayfa";
import Muhabirler, { MuhabirDetay } from "./ekranlar/Muhabirler";
import NextDay, { NextDayDetay } from "./ekranlar/NextDay";
import Oneriler from "./ekranlar/Oneriler";
import Paketler, { PaketDetay } from "./ekranlar/Paketler";
import SagSutun from "./ekranlar/SagSutun";
import Yakinda from "./ekranlar/Yakinda";
import { ROLLER, useVeri, type Rol } from "./veri";
import { useYol } from "./yol";

/**
 * İskelet: üst çubuk, beş ana başlık, sol menü, orta ve sağ sütun.
 *
 * Sağ sütun yalnız ana sayfada; iç sayfalar genişliği tabloya bırakıyor.
 * Rol üst çubuktan seçiliyor ve ana sayfadaki "senin sıran" kutusunu
 * belirliyor; giriş sistemi gelene kadar bu yeterli.
 */
const ROL_SAKLA = "trt-planlama-rol";

const YAKINDA: Record<string, Anahtar> = {
  haftalik: "haftalik",
  aylik: "aylik",
  ozel: "ozel",
  yurtdisi: "yurtdisi",
  toplantilar: "toplantilar",
  ekipler: "ekipler",
  program: "programBirimi",
  feature: "feature",
  arsiv: "arsiv",
  raporlar: "raporlar",
  ayarlar: "ayarlar",
};

export default function App() {
  const yol = useYol();
  const [, t] = useDil();
  const v = useVeri();
  const [rol, setRol] = useState<Rol>(() => {
    try {
      const k = localStorage.getItem(ROL_SAKLA) as Rol | null;
      return k && ROLLER.includes(k) ? k : "planlama";
    } catch {
      return "planlama";
    }
  });
  const rolDegistir = (r: Rol) => {
    setRol(r);
    try {
      localStorage.setItem(ROL_SAKLA, r);
    } catch {
      /* saklanamazsa oturumluk kalır */
    }
  };

  // Telefondaki menü paneli. Bir bağlantıya basılınca adres değişiyor;
  // o an paneli kapatmak, her bağlantıya ayrı ayrı "kapat" yazmaktan sağlam.
  const [menuAcik, setMenuAcik] = useState(false);
  const menuKapat = useCallback(() => setMenuAcik(false), []);
  useEffect(() => {
    setMenuAcik(false);
    window.scrollTo(0, 0);
  }, [yol.sayfa, yol.id]);

  const bekleyen = v.oneriler.filter((o) => o.durum === "bekliyor").length;
  const anaSayfa = yol.sayfa === "ana";

  let icerik;
  switch (yol.sayfa) {
    case "ana":
      icerik = <AnaSayfa rol={rol} />;
      break;
    case "nextday":
      icerik = yol.id && yol.id !== "yeni" ? <NextDayDetay tarih={yol.id} /> : <NextDay yeni={yol.id === "yeni"} />;
      break;
    case "muhabirler":
      icerik = yol.id ? <MuhabirDetay id={yol.id} /> : <Muhabirler />;
      break;
    case "paketler":
      icerik = yol.id ? <PaketDetay id={yol.id} /> : <Paketler />;
      break;
    case "oneriler":
      icerik = <Oneriler yeni={yol.id === "yeni"} />;
      break;
    default:
      icerik = <Yakinda baslik={t(YAKINDA[yol.sayfa] ?? "yakinda")} />;
  }

  return (
    <div className={`uygulama sayfa-${yol.sayfa}`}>
      <UstCubuk rol={rol} onRol={rolDegistir} bildirim={bekleyen} />
      <AnaBasliklar acik={yol.sayfa} />
      <div className={`govde ${anaSayfa ? "" : "dar"}`}>
        <SolMenu acik={yol.sayfa} />
        <main className="orta">{icerik}</main>
        {anaSayfa && (
          <aside className="sag">
            <SagSutun />
          </aside>
        )}
      </div>
      <AltCubuk acik={yol.sayfa} menuAcik={menuAcik} onMenu={() => setMenuAcik((a) => !a)} />
      {menuAcik && <MobilMenu acik={yol.sayfa} onKapat={menuKapat} rol={rol} onRol={rolDegistir} />}
    </div>
  );
}
