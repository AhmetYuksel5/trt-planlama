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

/** Listede kalemin adı: olayın adı, yoksa "YER / metin". */
export const kalemAdi = (k: HaftalikKalem) => k.baslik?.trim() || satir(k.yer, k.metin);

export const gundemde = (k: HaftalikKalem) => k.onInceleme?.durum !== "reddedildi";

export const kararBekleyenler = (h: HaftalikPlan) => h.kalemler.filter((k) => gundemde(k) && k.karar === "bekliyor");

/** Çıktıya giren: kabul ve bilgi. */
export const ciktida = (k: HaftalikKalem) => gundemde(k) && (k.karar === "kabul" || k.karar === "bilgi");

export const nextDayeGider = (k: HaftalikKalem) => k.karar === "kabul" && k.tur === "haber" && !!k.tarih;

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
