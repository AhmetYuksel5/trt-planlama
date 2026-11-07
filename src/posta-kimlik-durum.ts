import { useEffect, useState } from "react";

/*
 * Posta kimliğinin (kullanıcı adı/parola) tarayıcıdaki durumu: kişi girdi mi
 * ("var"), "Sonra yap" mı dedi ("sonra"), yoksa belirsiz mi (""). Parolanın
 * kendisi burada değil (o kapının KV'sinde); bu yalnız zil hatırlatmasını
 * sürdürmek için. Tarayıcıya bağlı; kişi bilgisini girince "var"a döner.
 */
const ANAHTAR = "trt-planlama-posta-kimlik";
export type KimlikDurum = "" | "var" | "sonra";

export const kimlikDurumOku = (): KimlikDurum => {
  try {
    return (localStorage.getItem(ANAHTAR) as KimlikDurum) || "";
  } catch {
    return "";
  }
};

export const kimlikDurumYaz = (d: KimlikDurum) => {
  try {
    if (d) localStorage.setItem(ANAHTAR, d);
    else localStorage.removeItem(ANAHTAR);
  } catch {
    /* gizli pencere: yok say */
  }
  // Zil hemen güncellensin (aynı sekmede storage olayı tetiklenmez).
  try {
    window.dispatchEvent(new Event("trt-posta-kimlik"));
  } catch {
    /* yok */
  }
};

export const useKimlikDurum = (): KimlikDurum => {
  const [d, setD] = useState<KimlikDurum>(kimlikDurumOku);
  useEffect(() => {
    const f = () => setD(kimlikDurumOku());
    window.addEventListener("trt-posta-kimlik", f);
    window.addEventListener("storage", f);
    return () => {
      window.removeEventListener("trt-posta-kimlik", f);
      window.removeEventListener("storage", f);
    };
  }, []);
  return d;
};
