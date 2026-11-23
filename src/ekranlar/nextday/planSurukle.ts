import type { DragEvent, PointerEvent } from "react";
import { beklenenSiraKaydet, canliBasligaBagla, gelismeSurukle, planBaslikYerine, planMuhabirSurukle } from "../../eylemler";
import { yerineTasi } from "../../beklenenSira";
import type { Kisi, NextDayPlan } from "../../veri";

/*
 * Next Day'de plan hazırlarken sürükle-bırak (kullanıcı: PKG'deki gibi öbür
 * işlemler de): gelişme başka başlığa, متابعات'e ya da başka gelişmenin yerine;
 * başlığın muhabiri başka başlığa ya da başka muhabirin yerine; canlı yayın
 * başlığa ya da "مباشر"a. Satırlar yalnız işaret taşır (`suruklenir`), karar
 * plan kabının tek dinleyicisinde (`planSurukleKabi`): klasik ekran ve belge
 * (Yeni, Sütunlu, belge sayfası) aynı kuralla. PKG kendi düzeneğinde
 * (paketSurukle.ts), klasikte başlık sıralaması başlık kartında.
 *
 * Belgede başlık da sürüklenir (kullanıcı: başlıktan tutunca içeriğiyle bütün
 * bölgesi taşınsın, bunu belli eden işaret olsun; yalnız yeri değişsin, başka
 * başlığın içine girmesin): bölge çerçevelenir, sürüklenen görüntü bölgenin
 * kendisi; hedef başlığın içi değil kenarı vurgulanır (üstüne ya da altına
 * geçeceği yer), bırakınca `planBaslikYerine`.
 *
 * Beklenen paketler (التقارير المتوقعة) kendi aralarında sıralanır
 * (kullanıcı): varsayılan başlıkların sırası, sürükleyince planın elle sırası
 * (`beklenenSiraKaydet`); yalnız bölüm içinde, başka yere bırakılmaz.
 *
 * Hedefler DOM'dan: başlık `[data-plan-baslik]` (klasik) ya da
 * `[data-nd-baslik]` (belge), متابعات `[data-sur-takip]`, مباشر `[data-sur-canli]`.
 */
export type SurTuru = "gelisme" | "muhabir" | "canli" | "baslik" | "beklenen";
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
const ARA_UST = "sur-araya-ust";
const ARA_ALT = "sur-araya-alt";
const vurguKaldir = () =>
  document.querySelectorAll(`.${VURGU}, .${ARA_UST}, .${ARA_ALT}`).forEach((x) => x.classList.remove(VURGU, ARA_UST, ARA_ALT));

/** Satıra: sürüklenebilir yapar (yalnız düzenleyende). */
export const suruklenir = (tur: SurTuru, id: string, pb: string | undefined, etkin: boolean) =>
  etkin ? { draggable: true, "data-sur": tur, "data-sur-id": id, "data-sur-pb": pb ?? "" } : {};

interface Hedef {
  el: HTMLElement;
  pb?: string;
  yerine?: string;
  /** Başlık sıralamasında hedefin hangi kenarına geçeceği. */
  kenar?: string;
}

const baslikOf = (el: HTMLElement) => el.closest<HTMLElement>("[data-plan-baslik], [data-nd-baslik]");
const pbOf = (el: HTMLElement) => el.dataset.planBaslik ?? el.dataset.ndBaslik;

/* Bırakılan yer ve ne olacağı; boşsa bırakılmaz (kendi yeri, geçersiz hedef). */
/* Beklenen bölümündeki satırların ekrandaki sırası (elle sıra ya da varsayılan; DOM'dan, ikisini ayrıca hesaplamamak için). */
const beklenenIdleri = (el: HTMLElement) =>
  [...(el.closest("[data-beklenen]")?.querySelectorAll<HTMLElement>('[data-sur="beklenen"]') ?? [])].map((x) => x.dataset.surId ?? "");

const hedefBul = (hedef: HTMLElement, o: Oge, plan?: NextDayPlan): Hedef | null => {
  if (o.tur === "beklenen") {
    const s = hedef.closest<HTMLElement>('[data-sur="beklenen"]');
    if (!s || s.dataset.surId === o.id) return null;
    const ids = beklenenIdleri(s);
    const i = ids.indexOf(o.id);
    const j = ids.indexOf(s.dataset.surId ?? "");
    if (i < 0 || j < 0) return null;
    return { el: s, yerine: s.dataset.surId, kenar: i < j ? ARA_ALT : ARA_UST };
  }
  if (o.tur === "baslik") {
    // Yalnız sıralama: hedef başlığın yerine geçer; yukarıdan gelen altına, aşağıdan gelen üstüne.
    const b = hedef.closest<HTMLElement>("[data-nd-baslik]");
    const id = b?.dataset.ndBaslik;
    if (!b || !id || id === o.id || !plan) return null;
    const i = plan.basliklar.findIndex((x) => x.id === o.id);
    const j = plan.basliklar.findIndex((x) => x.id === id);
    if (i < 0 || j < 0) return null;
    return { el: b, yerine: id, kenar: i < j ? ARA_ALT : ARA_UST };
  }
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
    const bolge = suruklenen.tur === "baslik" ? el.closest<HTMLElement>("[data-nd-baslik]") : null;
    if (bolge) {
      // Başlığın bütün bölgesi taşınıyor: görüntü de işaret de bölgenin kendisi.
      const r = bolge.getBoundingClientRect();
      e.dataTransfer.setDragImage(bolge, Math.max(0, e.clientX - r.left), Math.max(0, e.clientY - r.top));
      // Görüntü alındıktan sonra işaretlensin (yarı saydam görüntü çıkmasın).
      requestAnimationFrame(() => bolge.classList.add("baslik-tasiniyor"));
    } else el.classList.add("suruklenen");
  },
  onDragEnd: () => {
    suruklenen = null;
    vurguKaldir();
    document.querySelectorAll(".suruklenen, .baslik-tasiniyor").forEach((x) => x.classList.remove("suruklenen", "baslik-tasiniyor"));
  },
  onDragOver: (e: DragEvent<HTMLElement>) => {
    if (!suruklenen || !e.dataTransfer.types.includes(OGE_TURU)) return;
    const h = hedefBul(e.target as HTMLElement, suruklenen, plan);
    if (!h) return vurguKaldir();
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const sinif = h.kenar ?? VURGU;
    if (!h.el.classList.contains(sinif)) {
      vurguKaldir();
      h.el.classList.add(sinif);
    }
  },
  onDrop: (e: DragEvent<HTMLElement>) => {
    const o = suruklenen;
    if (!o || !ben || !e.dataTransfer.types.includes(OGE_TURU)) return;
    e.preventDefault();
    vurguKaldir();
    const h = hedefBul(e.target as HTMLElement, o, plan);
    suruklenen = null;
    document.querySelectorAll(".baslik-tasiniyor").forEach((x) => x.classList.remove("baslik-tasiniyor"));
    if (!h) return;
    if (o.tur === "baslik") {
      if (h.yerine) planBaslikYerine(ben, plan.id, o.id, h.yerine);
    } else if (o.tur === "beklenen") {
      if (h.yerine) beklenenSiraKaydet(ben, plan.id, yerineTasi(beklenenIdleri(h.el), o.id, h.yerine));
    } else if (o.tur === "gelisme") gelismeSurukle(ben, o.id, h.pb, h.yerine);
    else if (o.tur === "muhabir" && o.pb && h.pb) planMuhabirSurukle(ben, plan.id, o.id, o.pb, h.pb, h.yerine);
    else if (o.tur === "canli") canliBasligaBagla(ben, o.id, h.pb);
  },
});
