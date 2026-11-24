/*
 * İmla denetimi (kullanıcı: plan metinlerinde imla düzeltilsin ama "tatsız
 * sürpriz" olmasın). Model satırın düzeltilmiş halini yazıyor; neyin öneri
 * olarak geçeceğine model değil bu süzgeç karar veriyor. Yönerge ne derse
 * desin: sözcük sayısı değişen satır (ekleme, silme, yeniden yazma) bütünüyle
 * atılır; sözcük başına yalnız birkaç harflik değişiklik geçer; rakam ve Latin
 * harf taşıyan sözcüğe (sayı, saat, NATO gibi ad) dokunulmaz; yalnız hareke
 * ekleyen değişiklik sayılmaz. Tarayıcı aynı kuralı uygulamadan önce bir kez
 * daha sorar (src/imla.ts → imlaGecerli).
 */

export interface ImlaDuzeltmesi {
  /** Satırın kimliği (tarayıcının verdiği). */
  id: string;
  /** Satırdaki sözcüğün sırası (boşlukla ayrılmış, 0'dan). */
  sira: number;
  eski: string;
  yeni: string;
}

const HAREKE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const harekesiz = (s: string) => s.replace(HAREKE, "");
/* İmla sınıfı harflerin ortak biçimi: aralarındaki fark yazım kuralı, anlam değil. */
const yalin = (s: string) => s.replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ء/g, "");
const DOKUNULMAZ = /[A-Za-z0-9\u0660-\u0669\u06F0-\u06F9]/;
/** Bir satırda bundan çok düzeltme önerilmişse model satırı yeniden yazıyor demektir. */
export const SATIR_BASINA_EN_COK = 4;

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

/** Tek sözcüğün değişikliği imla düzeltmesi sayılır mı. */
export const sozcukDuzeltmesiMi = (eski: string, yeni: string) => {
  if (!eski || !yeni || eski === yeni) return false;
  if (DOKUNULMAZ.test(eski) || DOKUNULMAZ.test(yeni)) return false;
  const a = harekesiz(eski), b = harekesiz(yeni);
  if (a === b || !a || !b) return false;
  // Hemze, ة/ه, ى/ي gibi imla sınıfı harfler kendi aralarında serbest; başka harf
  // değişikliği kısa sözcükte hiç, uzun sözcükte bir-iki harf (yazım hatası).
  const n = [...yalin(a)].length;
  const sinir = n < 4 ? 0 : n < 8 ? 1 : 2;
  return uzaklik(yalin(a), yalin(b)) <= sinir && uzaklik(a, b) <= 3;
};

/** Satırın asıl ve düzeltilmiş hali → geçen sözcük düzeltmeleri; satır yeniden yazılmışsa hiçbiri. */
export const satirDuzeltmeleri = (id: string, asil: string, duzeltilmis: string): ImlaDuzeltmesi[] => {
  const a = asil.trim().split(/\s+/), b = duzeltilmis.trim().split(/\s+/);
  if (!asil.trim() || a.length !== b.length) return [];
  const farklar = a.flatMap((x, i) => (x !== b[i] ? [i] : []));
  if (farklar.length > SATIR_BASINA_EN_COK) return [];
  return farklar.filter((i) => sozcukDuzeltmesiMi(a[i], b[i])).map((i) => ({ id, sira: i, eski: a[i], yeni: b[i] }));
};
