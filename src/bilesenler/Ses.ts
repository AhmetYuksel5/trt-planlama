import { useEffect, useRef } from "react";

/*
 * Yeni bildirimde kısa ses (kurum isteği). Tercih tarayıcıda, kişiye değil
 * cihaza bağlı (dil gibi); varsayılan açık. Tarayıcı sesi ancak kişi sayfaya
 * bir kez dokunduktan sonra çalıyor; çalamazsa sessizce geçiyor. Site
 * kapalıyken uyarı (push) sunucu ister, burada yok.
 */
const ANAHTAR = "trt-planlama-ses";

export const sesAcik = (): boolean => {
  try {
    return localStorage.getItem(ANAHTAR) !== "kapali";
  } catch {
    return true;
  }
};

export const sesKaydet = (acik: boolean) => {
  try {
    localStorage.setItem(ANAHTAR, acik ? "acik" : "kapali");
  } catch {
    /* saklanamazsa yalnız bu açılışta */
  }
};

export const bipCal = () => {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const c = new Ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.35);
    o.onended = () => void c.close();
  } catch {
    /* ses çalınamadı */
  }
};

/** Okunmamış sayısı arttıkça (ilk çizimde değil) ses. */
export const useBildirimSesi = (okunmamis: number) => {
  const once = useRef<number | null>(null);
  useEffect(() => {
    if (once.current !== null && okunmamis > once.current && sesAcik()) bipCal();
    once.current = okunmamis;
  }, [okunmamis]);
};
