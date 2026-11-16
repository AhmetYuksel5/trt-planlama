import { gundemde } from "./haftalik";
import type { BirimId, Durum, HaftalikKalem, HaftalikPlan, Kisi, StokGorusu } from "./veri";
import { izinBirimi } from "./yapi";

/*
 * Stok önerilerinin toplantı öncesi hazırlığı (kullanıcı: stok sorumlusu
 * haftalık plan yapılırken stok/feature listesini, programlar için olanlar
 * dahil, hazırlıyor ve toplantıda sunuyor; öbür birimler toplantıdan önce
 * bilgi sahibi olsun, toplantı verimli geçsin). Saklanmaz, kayıttan okunur.
 *
 * Görüş verir: masalar (Newsdesk, Program, Ekonomi, Spor; "gibi" çalışan
 * birim de) ve kademedeki müdürler (kendi düğümüyle). Görüş tavsiye, kararı
 * toplantı verir; ön incelemenin reddi ayrı ve ondan bağımsız.
 */

export const GORUS_MASALARI: readonly BirimId[] = ["newsdesk", "program", "ekonomi", "spor"];

/** Kişinin görüşü hangi birim adına: masa izin birimiyle, müdür kendi kademe düğümüyle. */
export const gorusBirimi = (k: Kisi | undefined): BirimId | null => {
  // Tam yönetici planlamanın içinde (öneriyi o da hazırlıyor, kararı o veriyor): görüş istenen değil.
  if (!k || k.pasif || k.birim === "muhabir" || k.kontrolBekliyor || k.hesapYoneticisi) return null;
  const ib = izinBirimi(k.birim);
  if (GORUS_MASALARI.includes(ib)) return ib;
  if (ib === "yonetim") return k.birim;
  return null;
};

/** Haftanın görüşe açık stok önerileri: günü olmayan, ön incelemede düşmemiş, kararı verilmemiş. */
export const stokOnerileri = (h: HaftalikPlan): HaftalikKalem[] => h.kalemler.filter((k) => !k.tarih && gundemde(k) && k.karar === "bekliyor");

export const stokGorusAcik = (h: HaftalikPlan) => !!h.stokAcik && h.durum !== "kesinlesti";

export const kalemGorusleri = (d: Pick<Durum, "stokGorusleri">, kalemId: string): StokGorusu[] =>
  (d.stokGorusleri ?? []).filter((g) => g.kalemId === kalemId).sort((a, b) => a.zaman.localeCompare(b.zaman));

/** Kişinin biriminin görüşünü bekleyen stok önerileri (açık haftalarda). */
export const bekleyenStokGorusleri = (d: Durum, k: Kisi): { hafta: HaftalikPlan; kalem: HaftalikKalem; gorus?: StokGorusu }[] => {
  const b = gorusBirimi(k);
  if (!b) return [];
  return d.haftalik
    .filter(stokGorusAcik)
    .sort((x, y) => x.baslangic.localeCompare(y.baslangic))
    .flatMap((hafta) => stokOnerileri(hafta).map((kalem) => ({ hafta, kalem, gorus: (d.stokGorusleri ?? []).find((g) => g.kalemId === kalem.id && g.birim === b) })));
};

/* Toplantıdan önce görüşü sorulacak kişiler: bildirim onlara (birim adı değil kişi; "gibi" çalışan birim de alsın). */
export const gorusculer = (d: Pick<Durum, "kisiler">): string[] => d.kisiler.filter((k) => gorusBirimi(k)).map((k) => k.id);
