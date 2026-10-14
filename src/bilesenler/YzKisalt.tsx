import { Loader2, Sparkles, Undo2 } from "lucide-react";
import { useState } from "react";
import { useDil } from "../dil";
import { useYz, yzCalistir, yzHataMetni } from "../yz";
import { bildir } from "./Parcalar";

/*
 * Plan satırını kısaltan düğme (yapay zeka, "kisalt" özelliği). Sonuç
 * doğrudan kayda yazılmıyor, forma geliyor: producer bakıp kaydediyor.
 * Önceki metne bir dokunuşla dönülüyor. Özellik bu kişiye açık değilse
 * hiç çizilmiyor.
 */
export function YzKisalt({ metin, degistir }: { metin: string; degistir: (m: string) => void }) {
  const { t } = useDil();
  const ozellik = useYz("kisalt");
  const [bekliyor, setBekliyor] = useState(false);
  const [onceki, setOnceki] = useState<string | null>(null);
  if (!ozellik) return null;
  const bitti = ozellik.kalan <= 0;
  const kisalt = async () => {
    if (bekliyor || bitti || !metin.trim()) return;
    setBekliyor(true);
    const r = await yzCalistir("kisalt", metin);
    setBekliyor(false);
    if (!r.tamam) {
      bildir(yzHataMetni(t, r.hata));
      return;
    }
    setOnceki(metin);
    degistir(r.veri);
  };
  return (
    <div className="yz-satir" data-yz-kisalt>
      <button
        type="button"
        className="dugme dugme-sade dugme-kucuk"
        onClick={kisalt}
        aria-disabled={bekliyor || bitti || !metin.trim()}
        title={bitti ? t("yzSinirDoldu") : t("yzKisalt")}
        data-yz-kisalt-dugme
      >
        {bekliyor ? <Loader2 size={14} className="donen" /> : <Sparkles size={14} />} {t("yzKisalt")}
      </button>
      {onceki !== null && (
        <button
          type="button"
          className="dugme dugme-sade dugme-kucuk"
          onClick={() => {
            degistir(onceki);
            setOnceki(null);
          }}
          data-yz-geri
        >
          <Undo2 size={14} /> {t("yzOncekiMetin")}
        </button>
      )}
      {bitti && <small className="sonuk">{t("yzSinirDoldu")}</small>}
    </div>
  );
}
