import { Redo2, Undo2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDil } from "../dil";
import { planGeriAl, planYinele } from "../eylemler";
import { adimOzeti, sonAdimaBak, sorulmali, useGeriAlKaydi, useGeriAlinabilir, useYinelenebilir } from "../geriAl";
import type { Kisi } from "../veri";
import { bildir } from "./Parcalar";

/* Yazı alanında Ctrl+Z yazının kendi geri almasıdır; planınki değil. */
const yaziAlani = (x: EventTarget | null) => x instanceof HTMLElement && (x.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(x.tagName));

/**
 * Plan ekranının geri alma düğmesi. Bağlandığı sayfa açıkken bu penceredeki
 * düzenlemeler planın yığınına giriyor (geriAl.ts); Ctrl/⌘+Z da aynısı,
 * Ctrl/⌘+Shift+Z ve Ctrl+Y yineler. Sayfada tek olmalı: kaydı açan da bu.
 * Kayıt silecek ya da paket/öneri/görevlendirmeye dokunacak geri alma önce
 * sorulur (kullanıcı: ↶ görevlendirdiği paketi sormadan silmişti).
 */
export default function GeriAlDugmesi({ ben, planId }: { ben: Kisi; planId: string }) {
  const { t } = useDil();
  useGeriAlKaydi(ben.id, planId);
  const var_ = useGeriAlinabilir(ben.id, planId);
  const ileri = useYinelenebilir(ben.id, planId);
  const yinele = () => {
    const s = planYinele(ben, planId);
    bildir(t(s === "tamam" ? "yinelendi" : s === "degisti" ? "yinelenemedi" : "yinelenecekYok"));
  };
  const al = () => {
    if (!var_) return;
    const adim = sonAdimaBak(ben.id, planId);
    if (adim) {
      const o = adimOzeti(adim);
      if (sorulmali(o) && !confirm(`${(o.silinecek ? t("planGeriAlOnay", { sil: o.silinecek }) : t("planGeriAlOnayDegis", { degis: o.degisecek }))}${o.disari ? `\n\n${t("geriAlOnayDisari")}` : ""}`)) return;
    }
    const s = planGeriAl(ben, planId);
    if (s === "tamam") bildir(t("geriAlindi"), { ad: t("yinele"), f: yinele });
    else bildir(t(s === "degisti" ? "geriAlinamadi" : "geriAlinacakYok"));
  };
  const son = useRef({ al, yinele });
  son.current = { al, yinele };
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || yaziAlani(e.target)) return;
      if (e.code === "KeyZ" && !e.shiftKey) {
        e.preventDefault();
        son.current.al();
      } else if ((e.code === "KeyZ" && e.shiftKey) || (e.code === "KeyY" && !e.shiftKey)) {
        e.preventDefault();
        son.current.yinele();
      }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, []);
  const ad = t(var_ ? "geriAl" : "geriAlinacakYok");
  return (
    <>
      <button type="button" className={`dugme dugme-ikincil dugme-ikon${var_ ? "" : " pasif"}`} aria-disabled={!var_} title={ad} aria-label={ad} onClick={al} data-geri-al>
        <Undo2 size={16} />
      </button>
      {/* Yalnız yinelenecek bir şey varken: üst satır kalabalıklaşmasın. */}
      {ileri && (
        <button type="button" className="dugme dugme-ikincil dugme-ikon" title={t("yinele")} aria-label={t("yinele")} onClick={yinele} data-yinele>
          <Redo2 size={16} />
        </button>
      )}
    </>
  );
}
