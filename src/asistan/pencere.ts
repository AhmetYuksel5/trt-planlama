import { useEffect } from "react";

/*
 * Asistanın açtırdığı pencereler: planı postayla gönder, staffing önizlemesi, imla denetimi. Bu
 * işlerin kendi penceresi zaten bir onay ekranı (alıcılar, kişi eşlemesi, satır satır düzeltme);
 * asistan aynısını formda kurmak yerine sayfayı açar, pencere kendiliğinden açılır, kişi orada
 * karar verir. Sayfa gidişten sonra kurulduğu için istek bekler: bileşen kurulunca alır, kurulu
 * bileşene olayla gider.
 */
export type AsistanPenceresi = "planGonder" | "staffing" | "imla";

let bekleyen: { tur: AsistanPenceresi; id: string; zaman: number } | null = null;
const OLAY = "trt-asistan-pencere";
// Sayfa birkaç saniye içinde kurulmazsa istek düşer: sonradan açılan başka sayfada pencere çıkmasın.
const OMUR = 8000;

export const asistanPencereIste = (tur: AsistanPenceresi, id: string) => {
  bekleyen = { tur, id, zaman: Date.now() };
  window.dispatchEvent(new Event(OLAY));
};

/**
 * Bileşen kendi penceresinin isteğini dinler; istek bir kez alınır. `id` "*" ise her kayıt için
 * (asistan paneli imla ve plan postası pencerelerini kendisi açıyor: Yeni görünümde imla menüsü yok).
 */
export const useAsistanPenceresi = (tur: AsistanPenceresi, id: string | undefined, ac: (id: string) => void) =>
  useEffect(() => {
    if (!id) return;
    const al = () => {
      if (!bekleyen || bekleyen.tur !== tur || (id !== "*" && bekleyen.id !== id) || Date.now() - bekleyen.zaman > OMUR) return;
      const k = bekleyen.id;
      bekleyen = null;
      ac(k);
    };
    al();
    window.addEventListener(OLAY, al);
    return () => window.removeEventListener(OLAY, al);
    // ac her çizimde yeni işlev; dinleyici yalnız kimlik değişince kurulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tur, id]);
