import { Undo2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDil } from "../dil";
import { planGeriAl } from "../eylemler";
import { useGeriAlKaydi, useGeriAlinabilir } from "../geriAl";
import type { Kisi } from "../veri";
import { bildir } from "./Parcalar";

/* Yazı alanında Ctrl+Z yazının kendi geri almasıdır; planınki değil. */
const yaziAlani = (x: EventTarget | null) => x instanceof HTMLElement && (x.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(x.tagName));

/**
 * Plan ekranının geri alma düğmesi. Bağlandığı sayfa açıkken bu penceredeki
 * düzenlemeler planın yığınına giriyor (geriAl.ts); Ctrl/⌘+Z da aynısı.
 * Sayfada tek olmalı: kaydı açan da bu.
 */
export default function GeriAlDugmesi({ ben, planId }: { ben: Kisi; planId: string }) {
  const { t } = useDil();
  useGeriAlKaydi(ben.id, planId);
  const var_ = useGeriAlinabilir(ben.id, planId);
  const al = () => {
    if (!var_) return;
    const s = planGeriAl(ben, planId);
    bildir(t(s === "tamam" ? "geriAlindi" : s === "degisti" ? "geriAlinamadi" : "geriAlinacakYok"));
  };
  const son = useRef(al);
  son.current = al;
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.code === "KeyZ" && !yaziAlani(e.target)) {
        e.preventDefault();
        son.current();
      }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, []);
  const ad = t(var_ ? "geriAl" : "geriAlinacakYok");
  return (
    <button type="button" className={`dugme dugme-ikincil dugme-ikon${var_ ? "" : " pasif"}`} aria-disabled={!var_} title={ad} aria-label={ad} onClick={al} data-geri-al>
      <Undo2 size={16} />
    </button>
  );
}
