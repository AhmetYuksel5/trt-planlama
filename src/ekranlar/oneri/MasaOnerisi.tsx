import { Send } from "lucide-react";
import { useState } from "react";
import { Pencere, bildir } from "../../bilesenler/Parcalar";
import { TarihGirdisi } from "../../bilesenler/TarihSaat";
import { useDil } from "../../dil";
import { masaOneriGonder } from "../../eylemler";
import { bugun } from "../../tarih";
import { oneriSinirIcinde, type Kisi, type Oneri, type OneriBicimi } from "../../veri";
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
  const [f, setF] = useState({ muhabirId: "", paketBasligi: "", gelisme: "", islemeFikri: "", gorselIsleme: "", teslimTahmini: "", ekMasraf: "", programId: "", bicim: "pkg" as OneriBicimi, hedefTarih: bugun() });
  const hazir = !!f.paketBasligi.trim() && !!f.gelisme.trim() && !!f.hedefTarih && oneriSinirIcinde(f);
  const gonder = () => {
    if (!hazir || !confirm(t("eminMisin"))) return;
    if (masaOneriGonder(ben, { ...f, muhabirId: f.muhabirId || undefined })) {
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
            {t("gvGun")}
            <TarihGirdisi value={f.hedefTarih} min={bugun()} onChange={(e) => setF({ ...f, hedefTarih: e.target.value })} data-masa-oneri-gun />
          </label>
          <label>
            {t("haberTuru")}
            <OneriBicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} takipli={false} />
          </label>
        </div>
        <OneriMetinAlanlari f={f} setF={(x) => setF({ ...f, ...x })} strapli islemeli />
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
