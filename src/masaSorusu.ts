import type { BirimId, Durum, HareketTipi, MasaSorusu, Oneri } from "./veri";

/*
 * Önerinin masaya sorulması (kullanıcı: ekonomi ya da programla ilgili öneriyi
 * Planlama o birime iletir; "alırız" derlerse notlarıyla ya da öneriyi
 * düzenleyerek, muhabiri Planlama görevlendirir). Okuma kuralları; saklanmaz.
 */

/** Öneri sorulabilen masalar: kendi bülteni ya da programı olan birimler (veri.ts → MASA_KOLLARI ile aynı). */
export const SORU_MASALARI: readonly BirimId[] = ["ekonomi", "program", "spor"];

/** Planlama'nın karar vereceği aşamadaki öneri masaya sorulabilir. */
export const SORULABILIR_DURUM: readonly Oneri["durum"][] = ["yeni", "degerlendiriliyor", "sonra", "takip"];

/** Planlama ile masa arasındaki hareketler: muhabire görünmez (depo/fark.ts → erisimListesi de). */
export const MASA_HAREKETLERI: readonly HareketTipi[] = ["oneriMasayaIletildi", "masaOneriyiAldi", "masaOneriyiAlmadi"];

export const oneriSorulari = (d: Durum, oneriId: string): MasaSorusu[] =>
  (d.masaSorulari ?? []).filter((m) => m.oneriId === oneriId).sort((a, b) => a.zaman.localeCompare(b.zaman));

export const sonSoru = (d: Durum, oneriId: string): MasaSorusu | undefined => oneriSorulari(d, oneriId).at(-1);

/** Yanıt bekleyen soru (önerinin aynı anda tek açık sorusu olur). */
export const acikSoru = (d: Durum, oneriId: string) => {
  const s = sonSoru(d, oneriId);
  return s && !s.cevap ? s : undefined;
};

/** Masanın aldığı, Planlama'nın henüz görevlendirmediği öneri: son soru kabul. */
export const kabulSoru = (d: Durum, oneriId: string) => {
  const s = sonSoru(d, oneriId);
  return s?.cevap?.kabul ? s : undefined;
};

/** Önerinin görev paketi (görevlendirildi mi). */
export const oneriGorevPaketi = (d: Durum, oneriId: string) =>
  d.paketler.find((p) => p.oneriId === oneriId && !!p.gorev && p.durum !== "iptal");

/** Masanın listesi: kendisine sorulup yanıt bekleyenler ve aldığı, görevlendirme bekleyenler. */
export const masaninSorulari = (d: Durum, birim: BirimId) =>
  (d.masaSorulari ?? []).filter((m) => {
    if (m.birim !== birim || sonSoru(d, m.oneriId)?.id !== m.id) return false;
    const o = d.oneriler.find((x) => x.id === m.oneriId);
    if (!o) return false;
    return !m.cevap ? SORULABILIR_DURUM.includes(o.durum) : m.cevap.kabul && !oneriGorevPaketi(d, o.id);
  });
