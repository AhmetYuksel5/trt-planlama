import { satir } from "./etiketler";
import { gunEkle } from "./tarih";
import type { Durum, HaftalikKalem, HaftalikPlan, Kisi } from "./veri";
import { onIncelemeci } from "./yetki";

/**
 * Haftalık planın okuma kuralları; kaydı değiştirenler eylemler.ts'te.
 *
 * Kalemin yolu kararından ve kolundan çıkıyor, ayrıca saklanmıyor:
 * - ön incelemede reddedilen gündemden düşüyor (karar beklemiyor, çıktıda yok);
 * - kabul edilen ve günü olan haber o günün Next Day planına gidiyor;
 * - kabul edilen feature, ekonomi, program ve günü olmayan haber plansız,
 *   onaylı paket oluyor; kolun sahibi üretime alıyor;
 * - "bilgi" çıktıda (لا نتابع) ama takip edilmiyor, iş doğurmuyor.
 */

export const haftaGunleri = (bas: string) => Array.from({ length: 7 }, (_, i) => gunEkle(bas, i));
export const haftaSonu = (bas: string) => gunEkle(bas, 6);

/** Haftanın dosya seçimlerinde çıkan başlıklar: bu haftaya eklenenler, kalemlerin ve ana dosyaların başlıkları. */
export const haftaninDosyalari = (h: HaftalikPlan): string[] => [
  ...new Set([...(h.dosyalar ?? []), ...h.kalemler.map((k) => k.baslikId), ...h.anaKonular.map((a) => a.baslikId)].filter((x): x is string => !!x)),
];

/** Listede kalemin adı: olayın adı, yoksa "YER / metin". */
export const kalemAdi = (k: HaftalikKalem) => k.baslik?.trim() || satir(k.yer, k.metin);

export const gundemde = (k: HaftalikKalem) => k.onInceleme?.durum !== "reddedildi";

/** Kesinleşmiş haftada Next Day'e geçmiş ya da paketi doğmuş kalem: değişikliği oraya gitmez, kilitli. */
export const kalemKilitli = (h: Pick<HaftalikPlan, "durum">, k: HaftalikKalem) => h.durum === "kesinlesti" && !!(k.aktarim?.planId || k.aktarim?.paketId);

/** Kesinleşince işe dönüşen karar: kabul ve şartlı kabul (paketi taslakta, koşulla). */
export const kabulMu = (k: HaftalikKalem) => k.karar === "kabul" || k.karar === "sartli";

export const kararBekleyenler = (h: HaftalikPlan) => h.kalemler.filter((k) => gundemde(k) && k.karar === "bekliyor");

/* "Kalanları kabul et" ön incelemedeki kalemi almaz: kararı inceleyenin görüşü gelince, tek tek verilir. */
export const topluKabulAdaylari = (h: HaftalikPlan) => kararBekleyenler(h).filter((k) => k.onInceleme?.durum !== "gonderildi");

/*
 * Kesinleştirmenin sonucu, onay penceresinde sayıyla: Next Day'e geçecek
 * haber, açılacak plansız paket, reddedilecek öneri ve gündeme hiç alınmamış
 * açık öneri. Önce sessizce oluyordu; muhabir düzeltme beklerken ret alıyordu.
 */
export const kesinlesmeOzeti = (d: Durum, h: HaftalikPlan) => {
  const kabul = h.kalemler.filter((k) => gundemde(k) && kabulMu(k));
  const kalemli = new Set(h.kalemler.map((k) => k.oneriId).filter(Boolean));
  return {
    nextDay: kabul.filter((k) => k.tur === "haber" && k.tarih).length,
    paket: kabul.filter((k) => !(k.tur === "haber" && k.tarih)).length,
    sartli: kabul.filter((k) => k.karar === "sartli").length,
    // Reddedilen kalem kesinleşince plandan çıkıyor (eylemler.ts → haftalikKesinlestir).
    ret: h.kalemler.filter((k) => k.karar === "ret").length,
    acik: d.oneriler.filter((o) => o.hafta === h.baslangic && !kalemli.has(o.id) && (o.durum === "yeni" || o.durum === "degerlendiriliyor" || o.durum === "duzeltme")).length,
  };
};

/** Çıktıya giren: kabul, şartlı kabul (koşul notuyla) ve bilgi. */
export const ciktida = (k: HaftalikKalem) => gundemde(k) && (kabulMu(k) || k.karar === "bilgi");

export const nextDayeGider = (k: HaftalikKalem) => kabulMu(k) && k.tur === "haber" && !!k.tarih;

/** Planlama'nın kararını bekleyen şartlı paket: taslakta, koşullu, iptal edilmemiş. */
export const sartliBekleyen = (p: { kosul?: string; durum: string }) => !!p.kosul && (p.durum === "taslak" || p.durum === "degerlendiriliyor");

/** Ön incelemeye gidebilen: günü olmayan (stok), henüz gönderilmemiş, karar verilmemiş kalem. */
export const onIncelemeyeGidebilir = (k: HaftalikKalem) => !k.tarih && !k.onInceleme && k.karar === "bekliyor";

/** Kişinin önündeki ön inceleme: gönderilmiş, haftası kesinleşmemiş, kolu kapsamında. */
export const onIncelemeBekleyenler = (d: Durum, k: Kisi) =>
  d.haftalik
    .filter((h) => h.durum !== "kesinlesti")
    .flatMap((h) =>
      h.kalemler.filter((x) => x.onInceleme?.durum === "gonderildi" && onIncelemeci(k, x)).map((kalem) => ({ hafta: h, kalem })),
    );

/** Henüz görüş yazmadığı: panelde sayı olarak. */
export const gorusBekleyenler = (d: Durum, k: Kisi) =>
  onIncelemeBekleyenler(d, k).filter(({ kalem }) => !kalem.onInceleme?.gorusler.some((g) => g.kisiId === k.id));
