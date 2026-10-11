import { useEffect, useSyncExternalStore } from "react";

/**
 * Sayfanın adı üst çubuktaki sekmede yazıyor ("Next Day · 12 Eki Pzt");
 * sayfanın üstündeki büyük başlık masaüstünde aynı şeyi tekrarlıyordu ve
 * kalktı (telefonda sekme yok, orada başlık duruyor). Açık sayfa adını
 * buraya bildiriyor, sabit sekme okuyor; bildirmeyen sayfada menüdeki
 * kısa ad.
 */

let ad: string | null = null;
const dinleyiciler = new Set<() => void>();
const haber = () => {
  for (const f of dinleyiciler) f();
};

export const useSekmeAdi = (metin: string | undefined) => {
  useEffect(() => {
    if (!metin) return;
    ad = metin;
    haber();
    return () => {
      if (ad === metin) {
        ad = null;
        haber();
      }
    };
  }, [metin]);
};

export const useSekmeAdiOku = () =>
  useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => ad,
  );
