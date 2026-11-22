import type { DragEvent } from "react";
import { paketYerineTasi } from "../../eylemler";
import type { Kisi, Paket } from "../../veri";

/*
 * PKG'yi gelişmenin altı ile başlığın PKG bölümü arasında sürükleyip bırakma
 * (kullanıcı: formdaki "Planda yeri" seçimi yerine doğrudan; plan ekranı ve
 * belge aynı kuralı kullanıyor). Yalnız aynı başlığın içinde: dragover'da
 * veri okunamadığı için sürüklenen paket burada tutulur.
 */
export const PAKET_TURU = "application/x-plan-paket";
let suruklenen: { id: string; pbId?: string; gelismeId?: string } | null = null;

const VURGU = "pkg-birakilir";
const vurguKaldir = () => document.querySelectorAll(`.${VURGU}`).forEach((x) => x.classList.remove(VURGU));

/** Paket satırına: sürüklenebilir yapar (yalnız düzenleyende). */
export const paketSuruklenir = (p: Paket, etkin: boolean) =>
  etkin && p.durum !== "iptal"
    ? {
        draggable: true,
        "data-pkg-surukle": p.id,
        onDragStart: (e: DragEvent<HTMLElement>) => {
          // Başlık kartının kendi sürüklemesi (sıralama) tetiklenmesin.
          e.stopPropagation();
          // Satırdaki yazı alanında (belgede Strap yerinde yazılıyor) metin seçimi sürükleme olmasın.
          if ((e.target as HTMLElement).closest?.("input, textarea, [contenteditable='true']")) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.setData(PAKET_TURU, p.id);
          e.dataTransfer.effectAllowed = "move";
          suruklenen = { id: p.id, pbId: p.planBaslikId, gelismeId: p.gelismeId };
        },
        onDragEnd: () => {
          suruklenen = null;
          vurguKaldir();
        },
      }
    : {};

/** Bırakma alanı: gelismeId verilirse o gelişmenin altı, verilmezse başlığın PKG bölümü. */
export const paketHedefi = (ben: Kisi | undefined, pbId: string, gelismeId: string | undefined, etkin: boolean) => {
  const uyar = () => !!ben && etkin && !!suruklenen && suruklenen.pbId === pbId && (suruklenen.gelismeId ?? "") !== (gelismeId ?? "");
  return etkin
    ? {
        onDragOver: (e: DragEvent<HTMLElement>) => {
          if (!e.dataTransfer.types.includes(PAKET_TURU) || !suruklenen || suruklenen.pbId !== pbId) return;
          // İçteki (gelişmenin) alanı dıştakinden (başlığın) önce karar verir.
          e.stopPropagation();
          if (!uyar()) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!e.currentTarget.classList.contains(VURGU)) {
            vurguKaldir();
            e.currentTarget.classList.add(VURGU);
          }
        },
        onDragLeave: (e: DragEvent<HTMLElement>) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) e.currentTarget.classList.remove(VURGU);
        },
        onDrop: (e: DragEvent<HTMLElement>) => {
          if (!e.dataTransfer.types.includes(PAKET_TURU)) return;
          e.stopPropagation();
          e.preventDefault();
          vurguKaldir();
          const id = e.dataTransfer.getData(PAKET_TURU);
          if (ben && id && uyar()) paketYerineTasi(ben, id, gelismeId);
          suruklenen = null;
        },
      }
    : {};
};
