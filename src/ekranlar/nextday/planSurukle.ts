import type { DragEvent, PointerEvent } from "react";
import { canliBasligaBagla, gelismeSurukle, planMuhabirSurukle } from "../../eylemler";
import type { Kisi, NextDayPlan } from "../../veri";

/*
 * Next Day'de plan hazırlarken sürükle-bırak (kullanıcı: PKG'deki gibi öbür
 * işlemler de): gelişme başka başlığa, متابعات'e ya da başka gelişmenin yerine;
 * başlığın muhabiri başka başlığa ya da başka muhabirin yerine; canlı yayın
 * başlığa ya da "مباشر"a. Satırlar yalnız işaret taşır (`suruklenir`), karar
 * plan kabının tek dinleyicisinde (`planSurukleKabi`): klasik ekran ve belge
 * (Yeni, Sütunlu, belge sayfası) aynı kuralla. PKG kendi düzeneğinde
 * (paketSurukle.ts), başlık sıralaması başlık kartında.
 *
 * Hedefler DOM'dan: başlık `[data-plan-baslik]` (klasik) ya da
 * `[data-nd-baslik]` (belge), متابعات `[data-sur-takip]`, مباشر `[data-sur-canli]`.
 */
export type SurTuru = "gelisme" | "muhabir" | "canli";
export const OGE_TURU = "application/x-plan-oge";
interface Oge {
  tur: SurTuru;
  id: string;
  pb?: string;
}
let suruklenen: Oge | null = null;
// Yazı alanında (yer, metin yerinde yazılıyor) başlayan sürükleme metin seçimidir, satırı taşımaz.
let yazidan = false;

const VURGU = "sur-hedef";
const vurguKaldir = () => document.querySelectorAll(`.${VURGU}`).forEach((x) => x.classList.remove(VURGU));

/** Satıra: sürüklenebilir yapar (yalnız düzenleyende). */
export const suruklenir = (tur: SurTuru, id: string, pb: string | undefined, etkin: boolean) =>
  etkin ? { draggable: true, "data-sur": tur, "data-sur-id": id, "data-sur-pb": pb ?? "" } : {};

interface Hedef {
  el: HTMLElement;
  pb?: string;
  yerine?: string;
}

const baslikOf = (el: HTMLElement) => el.closest<HTMLElement>("[data-plan-baslik], [data-nd-baslik]");
const pbOf = (el: HTMLElement) => el.dataset.planBaslik ?? el.dataset.ndBaslik;

/* Bırakılan yer ve ne olacağı; boşsa bırakılmaz (kendi yeri, geçersiz hedef). */
const hedefBul = (hedef: HTMLElement, o: Oge): Hedef | null => {
  const ayni = hedef.closest<HTMLElement>(`[data-sur="${o.tur}"]`);
  if (ayni && o.tur !== "canli") {
    if (ayni.dataset.surId === o.id) return null;
    return { el: ayni, pb: ayni.dataset.surPb || undefined, yerine: ayni.dataset.surId };
  }
  const b = baslikOf(hedef);
  if (b) {
    const pb = pbOf(b);
    return pb && pb !== o.pb ? { el: b, pb } : null;
  }
  if (o.tur === "gelisme") {
    const tk = hedef.closest<HTMLElement>("[data-sur-takip]");
    return tk && o.pb ? { el: tk } : null;
  }
  if (o.tur === "canli") {
    const cn = hedef.closest<HTMLElement>("[data-sur-canli]");
    return cn && o.pb ? { el: cn } : null;
  }
  return null;
};

/** Plan kabına: sürüklemeyi başlatır, hedefi vurgular, bırakınca eylemi çağırır. */
export const planSurukleKabi = (ben: Kisi | null | undefined, plan: NextDayPlan) => ({
  onPointerDownCapture: (e: PointerEvent<HTMLElement>) => {
    yazidan = !!(e.target as HTMLElement).closest?.("input, textarea, select, [contenteditable='true']");
  },
  onDragStart: (e: DragEvent<HTMLElement>) => {
    const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-sur]");
    if (!el || !ben) return;
    if (yazidan) {
      e.preventDefault();
      return;
    }
    suruklenen = { tur: el.dataset.sur as SurTuru, id: el.dataset.surId ?? "", pb: el.dataset.surPb || undefined };
    e.dataTransfer.setData(OGE_TURU, suruklenen.id);
    e.dataTransfer.effectAllowed = "move";
    el.classList.add("suruklenen");
  },
  onDragEnd: () => {
    suruklenen = null;
    vurguKaldir();
    document.querySelectorAll(".suruklenen").forEach((x) => x.classList.remove("suruklenen"));
  },
  onDragOver: (e: DragEvent<HTMLElement>) => {
    if (!suruklenen || !e.dataTransfer.types.includes(OGE_TURU)) return;
    const h = hedefBul(e.target as HTMLElement, suruklenen);
    if (!h) return vurguKaldir();
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!h.el.classList.contains(VURGU)) {
      vurguKaldir();
      h.el.classList.add(VURGU);
    }
  },
  onDrop: (e: DragEvent<HTMLElement>) => {
    const o = suruklenen;
    if (!o || !ben || !e.dataTransfer.types.includes(OGE_TURU)) return;
    e.preventDefault();
    vurguKaldir();
    const h = hedefBul(e.target as HTMLElement, o);
    suruklenen = null;
    if (!h) return;
    if (o.tur === "gelisme") gelismeSurukle(ben, o.id, h.pb, h.yerine);
    else if (o.tur === "muhabir" && o.pb && h.pb) planMuhabirSurukle(ben, plan.id, o.id, o.pb, h.pb, h.yerine);
    else if (o.tur === "canli") canliBasligaBagla(ben, o.id, h.pb);
  },
});
