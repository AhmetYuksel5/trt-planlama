import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { iosMu } from "../iosSabit";
import { geriVarMi } from "../yol";

/*
 * iPhone'da ana ekrana eklenmiş uygulamada sayfalar arası geri hareketi
 * (kullanıcı: mobilde geri gitme düğmesi ya da hareketi yoktu). Safari'nin
 * kenardan kaydırma ile geri gitmesi ana ekran uygulamasında yok; Android'in
 * sistem geri hareketi zaten tarayıcı geçmişini kullanıyor, orada çalışmaz
 * (iki kez geri giderdi). Kenardan (sağdan sola dilde sağ kenardan) başlayan,
 * yatay, yeterince uzun kaydırma bir önceki sayfaya döner; açık pencere de
 * geçmiş adımı olduğu için önce o kapanır.
 */
const KENAR = 24;
const ESIK = 72;

const etkin = () => {
  if (typeof window === "undefined" || !iosMu()) return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || matchMedia("(display-mode: standalone)").matches || !!window.__geriKaydirmaDene;
};

declare global {
  interface Window {
    /* Test: masaüstü tarayıcıda da hareketi açar. */
    __geriKaydirmaDene?: boolean;
  }
}

export function GeriKaydirma() {
  const [dx, setDx] = useState(0);
  const bas = useRef<{ x: number; y: number; rtl: boolean; yatay: boolean | null } | null>(null);
  const [acik] = useState(etkin);

  useEffect(() => {
    if (!acik) return;
    const basla = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !geriVarMi()) return;
      const t = e.touches[0];
      const rtl = document.documentElement.dir === "rtl";
      const kenarda = rtl ? t.clientX >= innerWidth - KENAR : t.clientX <= KENAR;
      if (!kenarda || (e.target as Element).closest?.("input, textarea, [contenteditable]")) return;
      bas.current = { x: t.clientX, y: t.clientY, rtl, yatay: null };
    };
    const kay = (e: TouchEvent) => {
      const b = bas.current;
      if (!b) return;
      const t = e.touches[0];
      const x = (b.rtl ? b.x - t.clientX : t.clientX - b.x);
      const y = Math.abs(t.clientY - b.y);
      // İlk belirgin hareket dikeyse kaydırmadır, harekete karışılmaz.
      if (b.yatay === null && (Math.abs(x) > 8 || y > 8)) b.yatay = x > y;
      if (!b.yatay) return;
      e.preventDefault();
      setDx(Math.max(0, x));
    };
    const bit = () => {
      const b = bas.current;
      bas.current = null;
      setDx((son) => {
        if (b?.yatay && son >= ESIK && geriVarMi()) history.back();
        return 0;
      });
    };
    document.addEventListener("touchstart", basla, { passive: true });
    document.addEventListener("touchmove", kay, { passive: false });
    document.addEventListener("touchend", bit);
    document.addEventListener("touchcancel", bit);
    return () => {
      document.removeEventListener("touchstart", basla);
      document.removeEventListener("touchmove", kay);
      document.removeEventListener("touchend", bit);
      document.removeEventListener("touchcancel", bit);
    };
  }, [acik]);

  if (!acik || dx <= 0) return null;
  const oran = Math.min(1, dx / ESIK);
  return (
    <div className={`geri-kaydirma${oran >= 1 ? " hazir" : ""}`} style={{ ["--geri-oran" as string]: oran }} aria-hidden="true" data-geri-kaydirma>
      <ArrowLeft size={20} className="yon" />
    </div>
  );
}
