import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { useDil } from "../../dil";
import { useBen } from "../../oturum";
import { useYeniTasarim } from "../../tasarimSecimi";
import { useVeri } from "../../veri";
import { kisitliKisi } from "../../yetki";
import { OneriAyrinti } from "./OneriGovde";

/*
 * Plandaki kayıttan (gelişme, PKG, canlı) önerisine (yeni mimari, 2. aşama):
 * satırda öneri simgesi, basınca önerinin penceresi plan ekranının üstünde.
 * Önce önerinin hangi satıra dönüştüğü yalnız öneriden okunuyordu; planın
 * içinden muhabirin önerisine, yazışmasına ulaşmak için Öneriler'e gidip
 * aramak gerekiyordu. Yalnız yeni tasarımda, kısıtlı olmayan kişide.
 */
export function useOneriSimgesi(): boolean {
  const ben = useBen();
  const yeni = useYeniTasarim();
  return yeni && !!ben && !kisitliKisi(ben);
}

export function OneriyiAc({ oneriId }: { oneriId?: string }) {
  const { t } = useDil();
  const ben = useBen();
  const v = useVeri();
  const acilir = useOneriSimgesi();
  const [acik, setAcik] = useState(false);
  const o = acilir && oneriId ? v.oneriler.find((x) => x.id === oneriId) : undefined;
  if (!o || !ben) return null;
  return (
    <>
      <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAcik(true)} title={t("oneriyiAc")} aria-label={t("oneriyiAc")} data-plan-oneri={o.id}>
        <Lightbulb size={15} />
      </button>
      {acik && <OneriAyrinti key={o.id} ben={ben} oneri={o} kapat={() => setAcik(false)} />}
    </>
  );
}
