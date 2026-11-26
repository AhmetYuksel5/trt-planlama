import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil } from "../dil";
import { gorselAdresiKaydet } from "../eylemler";
import { useVeri, type Kisi } from "../veri";

/* Öneri görsellerinin Drive'a yazıldığı Apps Script adresi (gorsel.ts); yalnız tam yönetici. */
export function GorselAyari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [adres, setAdres] = useState(v.gorselAdresi ?? "");
  return (
    <Kart baslik={t("grAyar")} ikon={<ImagePlus size={18} />}>
      <div className="form" data-gorsel-ayari>
        <label>
          {t("grAdres")}
          <input dir="ltr" value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" data-gorsel-adres />
        </label>
        <div className="form-alt">
          <button type="button" className="dugme" disabled={adres.trim() === (v.gorselAdresi ?? "")} onClick={() => bildir(t(gorselAdresiKaydet(ben, adres) ? "grKaydedildi" : "grAdresHatali"))} data-gorsel-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Kart>
  );
}
