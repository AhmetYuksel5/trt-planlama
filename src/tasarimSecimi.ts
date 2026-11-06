import { useEffect, useState } from "react";

/*
 * "Yeni tasarım" denemesi (belgeler/kimlik.md; Linear görünüşü, Monday işlevi):
 * eski tasarım silinmeden yanında. Seçim kişiye değil tarayıcıya bağlı (dil gibi);
 * açıkken <html>'de `yeni-tasarim` sınıfı, bütün site token'larını oradan alıyor.
 * Beğenilirse eski tasarım silinip bu sınıf kalkacak.
 */
const ANAHTAR = "trt-planlama-tasarim";
const OLAY = "trt-tasarim";

export const yeniTasarimAcik = (): boolean => {
  try {
    return localStorage.getItem(ANAHTAR) === "yeni";
  } catch {
    return false;
  }
};

const uygula = (acik: boolean) => document.documentElement.classList.toggle("yeni-tasarim", acik);

export const yeniTasarimKaydet = (acik: boolean) => {
  try {
    localStorage.setItem(ANAHTAR, acik ? "yeni" : "eski");
  } catch {
    /* saklanamazsa yalnız bu açılışta */
  }
  uygula(acik);
  window.dispatchEvent(new Event(OLAY));
};

// Açılışta ilk çizimden önce: eski görünüş bir an yanıp sönmesin.
uygula(yeniTasarimAcik());
window.addEventListener("storage", (e) => e.key === ANAHTAR && (uygula(yeniTasarimAcik()), window.dispatchEvent(new Event(OLAY))));

export function useYeniTasarim(): boolean {
  const [acik, setAcik] = useState(yeniTasarimAcik);
  useEffect(() => {
    const yenile = () => setAcik(yeniTasarimAcik());
    window.addEventListener(OLAY, yenile);
    return () => window.removeEventListener(OLAY, yenile);
  }, []);
  return acik;
}
