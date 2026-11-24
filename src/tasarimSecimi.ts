import { useEffect, useState } from "react";

/*
 * Tasarım dili (belgeler/kimlik.md). Seçim kişiye değil tarayıcıya bağlı (dil gibi).
 * - "yeni" (varsayılan; Linear görünüşü, Monday işlevi): <html>'de `yeni-tasarim`.
 * - "eski": eski tasarım, silinmeden yanında.
 * - "paper" (kullanıcı: kendi öbür uygulamasının "kağıt" görünümünü gösterdi, renk değil
 *   tasarım dili istedi): yeni tasarımın düzeni üstüne `paper` sınıfı; zemin, yazı ailesi,
 *   köşe ve renk token'ları tasarim.css'in sonundaki `html.paper` bloğunda.
 * - "yesil" (kullanıcı: Plannersflow logosunun yeşiliyle, yeşile boğmadan, kararında): yeni tasarımın
 *   düzeni üstüne `yesil` sınıfı; logodan ölçülen yeşil, petrol ve lacivert (`html.yesil` bloğu).
 */
export type TasarimDili = "yeni" | "eski" | "paper" | "yesil";
export const TASARIM_DILLERI: TasarimDili[] = ["yeni", "yesil", "paper", "eski"];

const ANAHTAR = "trt-planlama-tasarim";
const OLAY = "trt-tasarim";

export const tasarimDiliOku = (): TasarimDili => {
  try {
    const d = localStorage.getItem(ANAHTAR);
    return d === "eski" || d === "paper" || d === "yesil" ? d : "yeni";
  } catch {
    return "yeni";
  }
};

export const yeniTasarimAcik = (): boolean => tasarimDiliOku() !== "eski";

const uygula = (d: TasarimDili) => {
  const html = document.documentElement;
  html.classList.toggle("yeni-tasarim", d !== "eski");
  html.classList.toggle("paper", d === "paper");
  html.classList.toggle("yesil", d === "yesil");
};

export const tasarimDiliKaydet = (d: TasarimDili) => {
  try {
    localStorage.setItem(ANAHTAR, d);
  } catch {
    /* saklanamazsa yalnız bu açılışta */
  }
  uygula(d);
  window.dispatchEvent(new Event(OLAY));
};

// Avatar menüsündeki eski/yeni geçişi: Paper da "yeni" sayılır, eskiden dönüş yeniye.
export const yeniTasarimKaydet = (acik: boolean) => tasarimDiliKaydet(acik ? "yeni" : "eski");

// Açılışta ilk çizimden önce: eski görünüş bir an yanıp sönmesin.
uygula(tasarimDiliOku());
window.addEventListener("storage", (e) => e.key === ANAHTAR && (uygula(tasarimDiliOku()), window.dispatchEvent(new Event(OLAY))));

export function useTasarimDili(): TasarimDili {
  const [d, setD] = useState(tasarimDiliOku);
  useEffect(() => {
    const yenile = () => setD(tasarimDiliOku());
    window.addEventListener(OLAY, yenile);
    return () => window.removeEventListener(OLAY, yenile);
  }, []);
  return d;
}

export const useYeniTasarim = (): boolean => useTasarimDili() !== "eski";
