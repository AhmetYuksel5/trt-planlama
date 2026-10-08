import { useRef, type MouseEvent } from "react";
import { GERCEK } from "../kip";

/* Üç tık bu süre içinde gelmeli; daha yavaşı sıradan tıklama. */
const SURE = 1500;

/**
 * Gizli gerçek giriş: logoya art arda üç tık `#/gercek-giris`'i açıyor.
 * Demo gösterilirken gerçek kaydın girişi ekranda belirmesin diye düğme
 * yok. Tek ve çift tık bugünkü gibi (logo bağlantısıysa ana sayfa).
 * Gerçek kipte iş görmüyor; oradan çıkış kullanıcı menüsünde.
 */
export function useUcTik() {
  const tiklar = useRef<number[]>([]);
  return (e: MouseEvent) => {
    if (GERCEK) return;
    const simdi = Date.now();
    tiklar.current = [...tiklar.current.filter((z) => simdi - z < SURE), simdi];
    if (tiklar.current.length < 3) return;
    tiklar.current = [];
    e.preventDefault();
    location.hash = "#/gercek-giris";
  };
}
