import type { Durum, HaftalikPlan, NextDayPlan } from "./veri";

/*
 * Plan metinlerinde imla denetimi (kullanıcı: imla düzeltilsin ama "tatsız
 * sürpriz" olmasın). Hiçbir şey kendiliğinden değişmez: kapı (worker/src/imla.ts)
 * yalnız harf düzeyinde öneri döndürür, kişi pencerede tek tek seçer, seçileni
 * eylem (eylemler.ts → imlaUygula) yazar. Uygulamadan önce aynı kural burada bir
 * kez daha sorulur (`sozcukDuzeltmesiMi`, kapınınkiyle aynı), satır o arada
 * değiştiyse öneri atlanır.
 */

export interface ImlaOnerisi {
  /** Satırın kimliği: "<tür>:<kayıt>" (`imlaSatirlari`). */
  id: string;
  /** Satırdaki sözcüğün sırası (boşlukla ayrılmış, 0'dan). */
  sira: number;
  eski: string;
  yeni: string;
}

/* Satır türleri: kaydın hangi alanı. */
export const IMLA_ALANLARI = {
  g: "gelisme",
  pb: "paketBaslik",
  pa: "paketAciklama",
  c: "canli",
  k: "kalem",
  kp: "kalemPaket",
  a: "anaKonu",
} as const;
export type ImlaTuru = keyof typeof IMLA_ALANLARI;

export interface ImlaSatiri {
  id: string;
  metin: string;
}

const satir = (tur: ImlaTuru, kayit: string, metin: string | undefined): ImlaSatiri[] => (metin?.trim() ? [{ id: `${tur}:${kayit}`, metin }] : []);

/** Next Day planının denetlenen satırları: gelişmeler, PKG başlığı ve açıklaması, canlıların konusu. Başlık adları havuzda ortak, girmez. */
export const ndImlaSatirlari = (d: Pick<Durum, "gelismeler" | "paketler" | "canliYayinlar">, plan: NextDayPlan): ImlaSatiri[] => [
  ...d.gelismeler.filter((g) => g.planId === plan.id).flatMap((g) => satir("g", g.id, g.metin)),
  ...d.paketler
    .filter((p) => p.planId === plan.id && p.durum !== "iptal")
    .flatMap((p) => [...satir("pb", p.id, p.baslik), ...satir("pa", p.id, p.aciklama)]),
  ...d.canliYayinlar.filter((c) => c.planId === plan.id).flatMap((c) => satir("c", c.id, c.konu)),
];

/** Weekly'nin satırları: kalemlerin metni ve Strap'i, ana dosyaların durum özeti. */
export const hfImlaSatirlari = (h: HaftalikPlan): ImlaSatiri[] => [
  ...h.anaKonular.flatMap((a) => satir("a", a.id, a.metin)),
  ...h.kalemler.flatMap((k) => [...satir("k", k.id, k.metin), ...satir("kp", k.id, k.paketBasligi)]),
];

export const imlaKimligi = (id: string): { tur: ImlaTuru; kayit: string } | null => {
  const i = id.indexOf(":");
  const tur = id.slice(0, i) as ImlaTuru;
  return i > 0 && tur in IMLA_ALANLARI ? { tur, kayit: id.slice(i + 1) } : null;
};

/* --- Kapıdakiyle aynı kural (worker/src/imla.ts); iki yerde de sorulur. --- */

const HAREKE = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const harekesiz = (s: string) => s.replace(HAREKE, "");
const yalin = (s: string) => s.replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ء/g, "");
const DOKUNULMAZ = /[A-Za-z0-9٠-٩۰-۹]/;
const uzaklik = (a: string, b: string) => {
  const x = [...a], y = [...b];
  let onceki = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    const simdi = [i];
    for (let j = 1; j <= y.length; j++) simdi[j] = Math.min(onceki[j] + 1, simdi[j - 1] + 1, onceki[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    onceki = simdi;
  }
  return onceki[y.length];
};
export const sozcukDuzeltmesiMi = (eski: string, yeni: string) => {
  if (!eski || !yeni || eski === yeni || /\s/.test(yeni)) return false;
  if (DOKUNULMAZ.test(eski) || DOKUNULMAZ.test(yeni)) return false;
  const a = harekesiz(eski), b = harekesiz(yeni);
  if (a === b || !a || !b) return false;
  const n = [...yalin(a)].length;
  const sinir = n < 4 ? 0 : n < 8 ? 1 : 2;
  return uzaklik(yalin(a), yalin(b)) <= sinir && uzaklik(a, b) <= 3;
};

/** Satırın `sira`'ıncı sözcüğü hâlâ `eski`yse yenisiyle değiştirilmiş metin; boşluklar yerinde kalır. Değilse null. */
export const sozcukDegistir = (metin: string, o: Pick<ImlaOnerisi, "sira" | "eski" | "yeni">): string | null => {
  if (!sozcukDuzeltmesiMi(o.eski, o.yeni)) return null;
  const parcalar = metin.split(/(\s+)/);
  let sira = -1;
  for (let i = 0; i < parcalar.length; i++) {
    if (!parcalar[i] || /^\s+$/.test(parcalar[i])) continue;
    if (++sira !== o.sira) continue;
    if (parcalar[i] !== o.eski) return null;
    parcalar[i] = o.yeni;
    return parcalar.join("");
  }
  return null;
};

/** Önerilerin satırdaki karşılığı: eski ve yeni hali, değişen sözcükler işaretli gösterilsin diye sözcük sözcük. */
export const satirOnizleme = (metin: string, oneriler: ImlaOnerisi[]) => {
  const bunlar = new Map(oneriler.map((o) => [o.sira, o]));
  return metin
    .trim()
    .split(/\s+/)
    .map((s, i) => ({ sozcuk: s, oneri: bunlar.get(i) }));
};

/*
 * Demoda kapıya gidilmez: Arapça haber metinlerinde sık görülen hemze hataları
 * sabit listeden. Gerçek kipte bunu model yapar, aynı süzgeçten geçer.
 */
const DEMO_SOZLUK: Record<string, string> = {
  الي: "إلى",
  اسرائيل: "إسرائيل",
  الامم: "الأمم",
  انقرة: "أنقرة",
  اسطنبول: "إسطنبول",
  ايران: "إيران",
  امريكا: "أمريكا",
  الاردن: "الأردن",
  اوروبا: "أوروبا",
  اثيوبيا: "إثيوبيا",
  الرئاسه: "الرئاسة",
  الحكومه: "الحكومة",
};
export const demoImla = (satirlar: ImlaSatiri[]): ImlaOnerisi[] =>
  satirlar.flatMap((s) =>
    s.metin
      .trim()
      .split(/\s+/)
      .flatMap((sozcuk, sira) => {
        const yeni = DEMO_SOZLUK[sozcuk];
        return yeni ? [{ id: s.id, sira, eski: sozcuk, yeni }] : [];
      }),
  );
