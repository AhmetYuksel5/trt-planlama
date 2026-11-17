import { useEffect, useState } from "react";
import type { Anahtar } from "./dil";

/*
 * Tema rengi (kullanıcı: Ayarlar'da tema rengini belirleme seçenekleri olsun). Renkli kabuğu olan
 * birimlerde (muhabir, masalar, Planlama) birimin rengi yerine seçilen renk: menünün etkin maddesi,
 * kutucuklar, seçimler. Seçim kişiye değil tarayıcıya bağlı (dil ve tasarım seçimi gibi); kayıt şeması
 * değişmez. Varsayılan birimin kendi rengi; kurumun renk anlamları (planlar, durumlar) değişmez.
 */
export interface Tema {
  id: string;
  ad: Anahtar;
  renk: string;
  sis: string;
  acik: string;
}
export const TEMALAR: Tema[] = [
  { id: "lacivert", ad: "temaLacivert", renk: "#1d3c78", sis: "#e4eaf5", acik: "#7c9fe0" },
  { id: "mavi", ad: "temaMavi", renk: "#1d5bd8", sis: "#e3ecfd", acik: "#78a3f2" },
  { id: "mor", ad: "temaMor", renk: "#6a42c9", sis: "#eee8fb", acik: "#a98bf0" },
  { id: "yesil", ad: "temaYesil", renk: "#1b8a4b", sis: "#e1f4e8", acik: "#4cc27f" },
  { id: "camgobegi", ad: "temaCamgobegi", renk: "#0e7490", sis: "#e0f2f5", acik: "#4fc3d9" },
  { id: "turuncu", ad: "temaTuruncu", renk: "#b45309", sis: "#fdf0e1", acik: "#f2a65a" },
  { id: "kirmizi", ad: "temaKirmizi", renk: "#b42318", sis: "#fdeceb", acik: "#f08a80" },
  { id: "pembe", ad: "temaPembe", renk: "#a83f73", sis: "#f9e7f0", acik: "#e48bb6" },
];

const ANAHTAR = "trt-planlama-tema";
const OLAY = "trt-tema";

export const temaOku = (): string => {
  try {
    const t = localStorage.getItem(ANAHTAR) ?? "";
    return TEMALAR.some((x) => x.id === t) ? t : "";
  } catch {
    return "";
  }
};

const uygula = (id: string) => {
  const html = document.documentElement;
  const t = TEMALAR.find((x) => x.id === id);
  if (!t) {
    delete html.dataset.tema;
    for (const k of ["--tema", "--tema-sis", "--tema-acik"]) html.style.removeProperty(k);
    return;
  }
  html.dataset.tema = t.id;
  html.style.setProperty("--tema", t.renk);
  html.style.setProperty("--tema-sis", t.sis);
  html.style.setProperty("--tema-acik", t.acik);
};

export const temaKaydet = (id: string) => {
  try {
    if (id) localStorage.setItem(ANAHTAR, id);
    else localStorage.removeItem(ANAHTAR);
  } catch {
    /* saklanamazsa yalnız bu açılışta */
  }
  uygula(id);
  window.dispatchEvent(new Event(OLAY));
};

// Açılışta ilk çizimden önce: birimin rengi bir an yanıp sönmesin.
uygula(temaOku());
window.addEventListener("storage", (e) => e.key === ANAHTAR && (uygula(temaOku()), window.dispatchEvent(new Event(OLAY))));

export function useTema(): string {
  const [t, setT] = useState(temaOku);
  useEffect(() => {
    const yenile = () => setT(temaOku());
    window.addEventListener(OLAY, yenile);
    return () => window.removeEventListener(OLAY, yenile);
  }, []);
  return t;
}
