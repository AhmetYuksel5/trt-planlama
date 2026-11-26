import { useState } from "react";
import { GERCEK, sunucuyaEsitMi, sunucuyaEsitOlunca } from "../kip";

/*
 * Kişinin yazdığı metni kaydeden iş (takip satırı, yeni takip, yazışma) kayıt
 * sunucuyla eşitlenmeden çalışırsa kaydet yazmıyor (veri.ts): muhabirin
 * telefonunda sekme yeniden yüklenince ya da bağlantı yavaşken bu süre
 * uzuyordu, metin silinip "eklendi" deniyordu (kullanıcı: muhabirler takipte
 * mesajı çoğu zaman kaydedemiyor). Eşit değilse iş bekletilir, eşitlenince
 * en taze kayıtla kendiliğinden yapılır; o arada metin yerinde kalır.
 */
export function useEsitYazis() {
  const [bekliyor, setBekliyor] = useState(false);
  const calistir = (f: () => void) => {
    if (!GERCEK || sunucuyaEsitMi()) return f();
    if (bekliyor) return;
    setBekliyor(true);
    sunucuyaEsitOlunca(() => {
      setBekliyor(false);
      f();
    });
  };
  return { bekliyor, calistir };
}
