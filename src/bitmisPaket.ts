import { stokDurumu } from "./akis";
import type { BirimId, Kisi, Paket } from "./veri";
import { izinBirimi } from "./yapi";
import { asamaNotuGorur, kisitliKisi, muhasebeciMi, yonetimdeMi } from "./yetki";

/*
 * Biten paket ince şerit olarak duruyor (kullanıcı: aşama bittikten sonra
 * yalnız başlık, muhabir ve tarih; basınca yapım aşamaları, ilgili birim ne
 * kadar görmesi gerekiyorsa o kadar). Kurallar saf; ekran
 * bilesenler/BitmisPaket.tsx.
 */

/** Yapım yolu kapanmış paket: tamamlandı ya da yapılmadı (onaylı sebepli iptal). Toplantıda reddedilen üretilmedi, şerit değil. */
export const bitmisMi = (p: Paket): boolean => p.durum === "tamamlandi" || (p.durum === "iptal" && !!p.yapilmadi);

export type BitmisSonuc = "yayin" | "stok" | "yapilmadi";
export const bitmisSonuc = (p: Paket): BitmisSonuc => (p.durum === "iptal" ? "yapilmadi" : stokDurumu(p) === "stokta" ? "stok" : "yayin");

/* Şeritteki tarih: yayınlandığı gün, yoksa yayın saati, teslim ya da son değişiklik. */
export const bitmisTarihi = (p: Paket): string => (p.yayinlandi?.tarih ?? p.yayin ?? p.muhabirTeslimi ?? p.guncelleme).slice(0, 10);

export interface BitmisGorunum {
  /** Aşamanın süresi ve geri gönderme sayısı bu masada görünür mü. */
  sure: (masa?: BirimId) => boolean;
  /** Ekibe özel aşama notları. */
  not: boolean;
  /** Son metin, video ve klip kodu. */
  cikti: boolean;
}

/*
 * Kim ne görür: Planlama ve yönetim her şeyi; masalar (Newsdesk, dil,
 * grafik…) bütün aşamaları ve yapanları, süreyi yalnız kendi aşamalarında;
 * muhabir yolu ve son metni (süre, iade ve ekip notu yok: değerlendirme
 * ekibin işi); Muhasebe yalnız künyeyi (kim, ne zaman).
 */
export const bitmisGorunum = (k: Kisi): BitmisGorunum => {
  if (muhasebeciMi(k)) return { sure: () => false, not: false, cikti: false };
  if (kisitliKisi(k)) return { sure: () => false, not: false, cikti: true };
  const tam = !!k.hesapYoneticisi || izinBirimi(k.birim) === "planlama" || yonetimdeMi(k);
  return {
    sure: (masa) => tam || (!!masa && (k.birim === masa || izinBirimi(k.birim) === masa)),
    not: asamaNotuGorur(k),
    cikti: true,
  };
};
