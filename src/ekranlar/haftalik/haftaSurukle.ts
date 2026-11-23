import type { DragEvent, PointerEvent } from "react";
import { anaKonuYerine, kalemSurukle } from "../../eylemler";
import type { HaftalikPlan, Kisi } from "../../veri";
import { ONERI_TURU } from "../oneri/OneriKarti";

/*
 * Weekly'de sürükle-bırak (kullanıcı: Next Day'deki gibi Weekly'de de): kalem
 * başka kalemin yerine, başka dosyaya, başka güne ya da "Stok ve programlar"a;
 * ana dosyalar kendi aralarında sıralanır; öneri kartı güne ya da dosyaya
 * bırakılınca "Gündeme ekle" o gün ve dosyayla açılır (kayıt formdan, onayla).
 * Kalıp nextday/planSurukle.ts'inki: satır yalnız işaret taşır, karar kabın
 * tek dinleyicisinde; plan ekranı ve belge aynı kuralla.
 *
 * Hedefler DOM'dan: dosya grubu `[data-hf-gun][data-hf-dosya]` (dosyasız
 * grubun dosyası ""), gün ya da "Stok ve programlar" yalnız `[data-hf-gun]`
 * (stokta "").
 */
type Tur = "kalem" | "ana";
const OGE_TURU = "application/x-hafta-oge";
let suruklenen: { tur: Tur; id: string } | null = null;
// Yazı alanında başlayan sürükleme metin seçimidir, satırı taşımaz.
let yazidan = false;

const VURGU = "sur-hedef";
const vurguKaldir = () => document.querySelectorAll(`.${VURGU}`).forEach((x) => x.classList.remove(VURGU));

/** Satıra: sürüklenebilir yapar (yalnız düzenleyende). */
export const haftaSuruklenir = (tur: Tur, id: string, etkin: boolean) => (etkin ? { draggable: true, "data-hf-sur": tur, "data-hf-sur-id": id } : {});

/** Dosya grubuna ya da güne: bırakılacak yerin işareti (her zaman; düzenlemeyen zaten sürükleyemiyor). */
export const hfYer = (tarih: string | undefined, dosya?: string) => ({ "data-hf-gun": tarih ?? "", ...(dosya !== undefined && { "data-hf-dosya": dosya }) });

interface Hedef {
  el: HTMLElement;
  tarih?: string;
  /** undefined: dosyası kalır; null: dosyasız. */
  baslikId?: string | null;
  yerine?: string;
}

const yerBul = (hedef: HTMLElement): Hedef | null => {
  const y = hedef.closest<HTMLElement>("[data-hf-gun]");
  if (!y) return null;
  const dosya = y.dataset.hfDosya;
  return { el: y, tarih: y.dataset.hfGun || undefined, baslikId: dosya === undefined ? undefined : dosya || null };
};

const hedefBul = (hedef: HTMLElement, o: { tur: Tur; id: string }): Hedef | null => {
  const ayni = hedef.closest<HTMLElement>(`[data-hf-sur="${o.tur}"]`);
  if (ayni) return ayni.dataset.hfSurId === o.id ? null : { el: ayni, yerine: ayni.dataset.hfSurId };
  return o.tur === "kalem" ? yerBul(hedef) : null;
};

/** Plan kabına; `oneriBirak` öneri kartı güne ya da dosyaya bırakılınca (Gündeme ekle'yi açar). */
export const haftaSurukleKabi = (ben: Kisi | null | undefined, hafta: HaftalikPlan, oneriBirak?: (oneriId: string, tarih: string, baslikId?: string) => void) => ({
  onPointerDownCapture: (e: PointerEvent<HTMLElement>) => {
    yazidan = !!(e.target as HTMLElement).closest?.("input, textarea, select, [contenteditable='true']");
  },
  onDragStart: (e: DragEvent<HTMLElement>) => {
    const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-hf-sur]");
    if (!el || !ben) return;
    if (yazidan) {
      e.preventDefault();
      return;
    }
    suruklenen = { tur: el.dataset.hfSur as Tur, id: el.dataset.hfSurId ?? "" };
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
    const oneri = !!oneriBirak && e.dataTransfer.types.includes(ONERI_TURU);
    if (!oneri && (!suruklenen || !e.dataTransfer.types.includes(OGE_TURU))) return;
    const h = oneri ? yerBul(e.target as HTMLElement) : hedefBul(e.target as HTMLElement, suruklenen!);
    if (!h) return vurguKaldir();
    e.preventDefault();
    e.dataTransfer.dropEffect = oneri ? "copy" : "move";
    if (!h.el.classList.contains(VURGU)) {
      vurguKaldir();
      h.el.classList.add(VURGU);
    }
  },
  onDrop: (e: DragEvent<HTMLElement>) => {
    if (oneriBirak && e.dataTransfer.types.includes(ONERI_TURU)) {
      const h = yerBul(e.target as HTMLElement);
      vurguKaldir();
      const id = e.dataTransfer.getData(ONERI_TURU);
      if (!h || !id) return;
      e.preventDefault();
      oneriBirak(id, h.tarih ?? "", h.baslikId || undefined);
      return;
    }
    const o = suruklenen;
    if (!o || !ben || !e.dataTransfer.types.includes(OGE_TURU)) return;
    e.preventDefault();
    vurguKaldir();
    const h = hedefBul(e.target as HTMLElement, o);
    suruklenen = null;
    if (!h) return;
    if (o.tur === "kalem") kalemSurukle(ben, hafta.id, o.id, { tarih: h.tarih, baslikId: h.baslikId, yerine: h.yerine });
    else if (h.yerine) anaKonuYerine(ben, hafta.id, o.id, h.yerine);
  },
});
