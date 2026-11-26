import { Send } from "lucide-react";
import { useState } from "react";
import { Pencere, bildir } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { masaOneriGonder, type OneriMasrafGirdisi } from "../../eylemler";
import { bugun, haftaBasi } from "../../tarih";
import { oneriSinirIcinde, type IcerikTuru, type Kisi, type Oneri, type OneriBicimi } from "../../veri";
import { masaBirimi } from "../../yetki";
import { BaglantiAlani, EkBilgiler, MasrafKalemleri, OneriZamani, ProgramAdaylari, ekOzeti, zamanBaslangic, zamanGecerli, zamanGirdisi, zamanModu } from "./OneriEkleri";
import { birimAdi } from "../../yapi";
import { MuhabirSecici, OneriBicimSecici } from "../nextday/Formlar";
import { OneriMetinAlanlari } from "./OneriFormu";

/*
 * Masanın önerisi (kullanıcı: Programlar'dan gelen öneri doğrudan görevlendirme
 * gibi geliyordu): muhabirin formundaki dört alan, gün, haber türü, isteğe bağlı
 * muhabir. Planlama'ya öneri olarak düşer, kararı orada.
 */
export function MasaOneriPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t } = useDil();
  // Masanın kendi türü: programda program adayları ve zaman sorusu, ekonomi ve sporda olaylı varsayılan.
  const masa = (masaBirimi(ben) ?? "program") as IcerikTuru;
  const [f, setF] = useState({ muhabirId: "", paketBasligi: "", gelisme: "", islemeFikri: "", gorselIsleme: "", bicim: "pkg" as OneriBicimi, masraflar: [] as OneriMasrafGirdisi[], baglantilar: [] as string[], programAdaylari: [] as string[] });
  const [z, setZ] = useState(() => zamanBaslangic(bugun()));
  const mod = zamanModu(z, masa, false);
  const hazir = !!f.paketBasligi.trim() && !!f.gelisme.trim() && zamanGecerli(z, mod) && oneriSinirIcinde(f);
  const gonder = () => {
    if (!hazir || !confirm(t("eminMisin"))) return;
    if (masaOneriGonder(ben, { ...f, ...zamanGirdisi(z, mod, haftaBasi), muhabirId: f.muhabirId || undefined })) {
      bildir(t("bOneriGitti"));
      kapat();
    }
  };
  return (
    <Pencere
      baslik={t("moBaslik")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" aria-disabled={!hazir} onClick={gonder} data-masa-oneri-gonder>
          <Send size={15} className="yon" /> {t("gonder")}
        </button>
      }
    >
      <div className="form" data-masa-oneri-formu>
        <div className="satir">
          <label>
            {t("muhabir")} <span className="ipucu">{t("varsa")}</span>
            <MuhabirSecici deger={f.muhabirId} degistir={(id) => setF({ ...f, muhabirId: id })} ic={false} />
          </label>
          <label>
            {t("haberTuru")}
            <OneriBicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} takipli={false} />
          </label>
        </div>
        {masa === "program" && <ProgramAdaylari secili={f.programAdaylari} degistir={(programAdaylari) => setF({ ...f, programAdaylari })} />}
        <OneriZamani z={z} setZ={setZ} tur={masa} takip={false} />
        <OneriMetinAlanlari f={f} setF={(x) => setF({ ...f, ...x })} strapli islemeli />
        <EkBilgiler ozet={ekOzeti(t, f)} dolu={f.masraflar.length > 0 || f.baglantilar.length > 0}>
          <MasrafKalemleri l={f.masraflar} degistir={(masraflar) => setF({ ...f, masraflar })} />
          <BaglantiAlani l={f.baglantilar} degistir={(baglantilar) => setF({ ...f, baglantilar })} />
        </EkBilgiler>
      </div>
    </Pencere>
  );
}

/* Önerinin hangi masadan geldiği: kartın bilgi satırında, masanın renginde. */
export function MasaEtiketi({ oneri }: { oneri: Pick<Oneri, "masa"> }) {
  if (!oneri.masa) return null;
  return (
    <span className={`masa-etiketi masa-${oneri.masa}`} data-oneri-masa={oneri.masa}>
      {birimAdi(oneri.masa)}
    </span>
  );
}
