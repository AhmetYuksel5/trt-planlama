import { GOMULU } from "./yol";

/*
 * Eğitim sahnesinde basılacak düğmeyi bölmenin içinde parlatır
 * (ekranlar/Egitim.tsx): üst pencere seçiciyi gönderir, bölme eşleşen öğelere
 * sınıf koyar. Sayfa değişince ya da pencere açılınca düğme sonradan çıkıyor;
 * bu yüzden kısa aralıkla yeniden aranır, yeni çıkan ilk öğeye bir kez kayılır.
 */
export interface EgitimVurgusu {
  tur: "trt-egitim-vurgu";
  secici: string;
}

const SINIF = "egitim-vurgu";
let secici = "";
let kayilan: Element | null = null;

const uygula = () => {
  const eski = Array.from(document.getElementsByClassName(SINIF));
  let yeni: Element[] = [];
  try {
    yeni = secici ? Array.from(document.querySelectorAll(secici)) : [];
  } catch {
    yeni = [];
  }
  for (const e of eski) if (!yeni.includes(e)) e.classList.remove(SINIF);
  for (const e of yeni) e.classList.add(SINIF);
  const ilk = yeni.find((e) => (e as HTMLElement).offsetParent !== null);
  if (ilk && ilk !== kayilan) {
    kayilan = ilk;
    ilk.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
};

if (GOMULU) {
  window.addEventListener("message", (e: MessageEvent<EgitimVurgusu>) => {
    if (e.origin !== location.origin || e.source !== window.parent || e.data?.tur !== "trt-egitim-vurgu") return;
    if (e.data.secici !== secici) kayilan = null;
    secici = e.data.secici;
    uygula();
  });
  setInterval(() => secici && uygula(), 500);
}
