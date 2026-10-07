import { DILLER, metin, yaz, type Anahtar, type Dil } from "./dil";
import { BIRIM_ADI } from "./etiketler";
import type { Durum, Kisi } from "./veri";
import { oneriGorebilir, paketGorebilir } from "./yetki";

/**
 * Aramanın kuralları: arama penceresi (bilesenler/KomutPaleti.tsx) ve
 * takvimin süzgeci aynı normalleştirmeyi kullanıyor. Saf; ekran yalnız
 * sonucu çiziyor.
 */

/*
 * Arama dilden bağımsız: Arapçada hareke, hemze ve tatvil, Türkçede nokta
 * ve şapka fark etmiyor ("secim" "seçim"i, "انتخابات" "الإنتخابات"ı
 * buluyor).
 */
export const sade = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    // Kaçışla yazılı: birleşen işaretler düz yazılınca düzenleyicide yer değiştirip aralığı bozuyor (U+0300–U+064B bütün Arapça harfleri siliyordu).
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/ı/g, "i")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

/** Sorgunun her sözcüğü metinde geçiyor mu; boş sorgu her şeye uyar. */
export const sozcuklerUyar = (samanlik: string, sorgu: string) => {
  const sozcukler = sade(sorgu).split(/\s+/).filter(Boolean);
  const metinSade = sade(samanlik);
  return sozcukler.every((s) => metinSade.includes(s));
};

/* Arapça arayüzdeki kullanıcı "Weekly" de yazsa bulsun: adlar üç dilde aranıyor. */
export const ucDilde = (k: Anahtar) => DILLER.map((d) => metin(k, d)).join(" ");

/* Kayıt araması tek harfle bütün listeyi döker; sayfa adları için tek harf yeter. */
export const KAYIT_EN_AZ = 2;

export interface KayitSonucu {
  id: string;
  tur: "paket" | "oneri" | "kisi";
  ust: string;
  metin: string;
  /** Arapça içerik (başlık): ekranda <Icerik>; kişi adı içerik değil. */
  icerik: boolean;
  href: string;
}

/**
 * Paket, öneri ve kişi araması. Yalnız kişinin görebildikleri: muhabir
 * başka muhabirin paketini aramayla da bulamıyor, kişi listesini hiç
 * aramıyor.
 */
export function kayitAra(d: Durum, ben: Kisi, sorgu: string, dil: Dil): KayitSonucu[] {
  if (sade(sorgu).trim().length < KAYIT_EN_AZ) return [];
  const uyar = (...parcalar: (string | undefined)[]) => sozcuklerUyar(parcalar.filter(Boolean).join(" "), sorgu);
  const kisiAdlari = (k?: Kisi) => (k ? DILLER.map((x) => yaz(k.ad, x)).join(" ") : "");
  return [
    ...d.paketler
      .filter((p) => paketGorebilir(ben, p, d) && uyar(p.baslik, p.kod, kisiAdlari(d.kisiler.find((k) => k.id === p.muhabirId))))
      .slice(0, 6)
      .map((p): KayitSonucu => ({ id: p.id, tur: "paket", ust: p.kod, metin: p.baslik, icerik: true, href: `#/paketler/${p.id}` })),
    ...d.oneriler
      .filter((o) => oneriGorebilir(ben, o) && uyar(o.haberBasligi, o.paketBasligi, o.gelisme))
      .slice(0, 4)
      .map((o): KayitSonucu => ({ id: o.id, tur: "oneri", ust: metin("oneri", dil), metin: o.haberBasligi, icerik: true, href: `#/oneriler/${o.id}` })),
    ...(ben.birim === "muhabir"
      ? []
      : d.kisiler
          .filter((k) => uyar(kisiAdlari(k)))
          .slice(0, 4)
          .map((k): KayitSonucu => ({ id: k.id, tur: "kisi", ust: metin(BIRIM_ADI[k.birim], dil), metin: yaz(k.ad, dil), icerik: false, href: `#/muhabirler/${k.id}` }))),
  ];
}
