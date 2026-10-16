import { yaz } from "./dil";
import type { Kisi } from "./veri";

/**
 * Notta kişi anma (@ad): saf kurallar. Not düz metin kalıyor, adın kendisi
 * yazılı ("@محمد علي"); ayrı bir kimlik işareti yok, çünkü notlar her yerde
 * düz metin gösteriliyor ve yazıldığı gibi okunmalı. Kimin anıldığı
 * kaydederken metinden çıkıyor: her kişinin Arapça ve Latin adı aranıyor,
 * uzun ad önce (kısa ad uzun adın başı olabilir: "محمد" / "محمد علي").
 */

const HARF = /[\p{L}\p{N}]/u;

/** Kişinin anılabileceği adları: Arapça ve Latin yazımı. */
export const anmaAdlari = (k: Pick<Kisi, "ad">) => [...new Set([yaz(k.ad, "ar"), yaz(k.ad, "tr"), yaz(k.ad, "en")].map((a) => a.trim()).filter(Boolean))];

export const anilanlar = (metin: string, kisiler: Kisi[]): string[] => {
  if (!metin.includes("@")) return [];
  const adaylar = kisiler
    .filter((k) => !k.pasif)
    .flatMap((k) => anmaAdlari(k).map((a) => ({ id: k.id, a: `@${a}` })))
    .sort((x, y) => y.a.length - x.a.length);
  const bulunan = new Set<string>();
  let kalan = metin;
  for (const { id, a } of adaylar) {
    let i = kalan.indexOf(a);
    while (i >= 0) {
      const sonra = kalan[i + a.length];
      // Ad bir sözcüğün başı olmasın: "@Ali" "@Alican"ı anmaz.
      if (!sonra || !HARF.test(sonra)) {
        bulunan.add(id);
        // Bulunan yer siliniyor: kısa ad aynı yerde ikinci kez eşleşmesin.
        kalan = kalan.slice(0, i) + " ".repeat(a.length) + kalan.slice(i + a.length);
      }
      i = kalan.indexOf(a, i + 1);
    }
  }
  return [...bulunan];
};

/** Düzenlenen notta yalnız yeni anılanlar: aynı nota ikinci kayıtta yeniden bildirim gitmesin. */
export const yeniAnilanlar = (yeni: string, eski: string, kisiler: Kisi[]) => {
  const once = new Set(anilanlar(eski, kisiler));
  return anilanlar(yeni, kisiler).filter((id) => !once.has(id));
};

/** Yazılan sözcüğün sonundaki "@sorgu": öneri listesini açar. Ad boşluklu olabilir, iki sözcüğe kadar. */
export const anmaSorgusu = (metin: string, imlec: number): { bas: number; sorgu: string } | null => {
  const once = metin.slice(0, imlec);
  const m = /(^|\s)@([^@\n]{0,40})$/u.exec(once);
  if (!m || m[2].split(/\s+/).length > 3) return null;
  return { bas: once.length - m[2].length - 1, sorgu: m[2] };
};

/** Öneri listesi: sorgu adın herhangi bir sözcüğünün başıyla eşleşiyor. */
export const anmaAdaylari = (sorgu: string, kisiler: Kisi[], en = 6) => {
  const s = sorgu.trim().toLocaleLowerCase();
  return kisiler
    .filter((k) => !k.pasif && (!s || anmaAdlari(k).some((a) => a.toLocaleLowerCase().startsWith(s) || a.toLocaleLowerCase().split(/\s+/).some((p) => p.startsWith(s)))))
    .slice(0, en);
};
