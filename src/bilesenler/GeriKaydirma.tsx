import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { iosMu } from "../iosSabit";
import { geriVarMi } from "../yol";

/*
 * Telefonda sayfalar arası geri hareketi (kullanıcı: mobil uygulamada geri
 * gitmenin yolu yoktu; üstte geri düğmesi istenmedi, ekran kaydırılınca geri
 * gitsin). Ekranın sol ya da sağ kenarından içeri doğru yatay, yeterince uzun
 * kaydırma bir önceki sayfaya döner; açık pencere de geçmiş adımı olduğu için
 * önce o kapanır. Android'de her yerde (sistemin kenar hareketi açıksa
 * dokunuşu sistem alır, sayfaya gelmez; iki kez geri gidilmez). iPhone'da
 * yalnız ana ekran uygulamasında: Safari'nin sekmesinde kendi geri hareketi
 * var, ikisi birden geri götürürdü.
 */
const KENAR = 24;
const ESIK = 72;

const etkin = () => {
  if (typeof window === "undefined") return false;
  if (window.__geriKaydirmaDene) return true;
  if (/Android/i.test(navigator.userAgent)) return true;
  if (!iosMu()) return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || matchMedia("(display-mode: standalone)").matches;
};

declare global {
  interface Window {
    /* Test: masaüstü tarayıcıda da hareketi açar. */
    __geriKaydirmaDene?: boolean;
  }
}

export function GeriKaydirma() {
  const [dx, setDx] = useState(0);
  const [sag, setSag] = useState(false);
  const bas = useRef<{ x: number; y: number; sag: boolean; yatay: boolean | null } | null>(null);
  const [acik] = useState(etkin);

  useEffect(() => {
    if (!acik) return;
    const basla = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !geriVarMi()) return;
      const t = e.touches[0];
      // Hangi kenardan başladıysa ondan içeri: soldan sağa ya da sağdan sola.
      const soldan = t.clientX <= KENAR;
      const sagdan = t.clientX >= innerWidth - KENAR;
      if ((!soldan && !sagdan) || (e.target as Element).closest?.("input, textarea, [contenteditable]")) return;
      bas.current = { x: t.clientX, y: t.clientY, sag: sagdan, yatay: null };
      setSag(sagdan);
    };
    const kay = (e: TouchEvent) => {
      const b = bas.current;
      if (!b) return;
      const t = e.touches[0];
      const x = b.sag ? b.x - t.clientX : t.clientX - b.x;
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
    <div className={`geri-kaydirma${sag ? " sag" : ""}${oran >= 1 ? " hazir" : ""}`} style={{ ["--geri-oran" as string]: oran }} aria-hidden="true" data-geri-kaydirma>
      <ArrowLeft size={20} />
    </div>
  );
}
