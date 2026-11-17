import { paketGunu } from "./bitmisPaket";
import { adimYapabilir, paketGorebilir, paketTamamlayabilir } from "./yetki";
import { bugun, gunEkle } from "./tarih";
import type { Durum, Kisi, Paket } from "./veri";

/*
 * Muhabirin yapılacaklar listesi (kullanıcı: öneri paket görevine dönünce
 * muhabirin önüne iş olarak düşsün; bugün, yarın ve yakın gelecek için
 * verilen görevler; muhabir yapım aşamasındaki işlerini buradan izlesin).
 * Saklanmaz, kayıttan: muhabirin onaylı ya da üretimdeki paketleri (özel
 * yayın görevi dahil, görevi henüz verilmemişi değil). Biten paket
 * Haberlerim'de. Gün paketin günü (son tarih, yoksa planın günü).
 */
export type YapilacakGrubu = "geciken" | "bugun" | "yarin" | "yakinda" | "ileride";
export const YAPILACAK_GRUPLARI: YapilacakGrubu[] = ["geciken", "bugun", "yarin", "yakinda", "ileride"];
/* "Yakında": yarından sonraki bir hafta; ötesi "İleride". */
export const YAKIN_GUN = 7;

export const yapilacakGrubu = (gun: string, b: string = bugun()): YapilacakGrubu =>
  gun < b ? "geciken" : gun === b ? "bugun" : gun === gunEkle(b, 1) ? "yarin" : gun <= gunEkle(b, YAKIN_GUN) ? "yakinda" : "ileride";

export interface Yapilacak {
  paket: Paket;
  gun: string;
  grup: YapilacakGrubu;
  /* Sıra muhabirde mi (metin, video, sonuç bildirme) yoksa başka masada mı. */
  sirasi: boolean;
}

export const muhabirYapilacaklari = (d: Durum, ben: Kisi, b: string = bugun()): Yapilacak[] =>
  d.paketler
    .filter((p) => p.muhabirId === ben.id && (p.durum === "onaylandi" || p.durum === "uretimde") && !p.ozelGorevBekliyor && paketGorebilir(ben, p, d))
    .map((p) => {
      const gun = paketGunu(d, p);
      return { paket: p, gun, grup: yapilacakGrubu(gun, b), sirasi: adimYapabilir(ben, p) || paketTamamlayabilir(ben, p, d) };
    })
    .sort((x, y) => x.gun.localeCompare(y.gun) || Number(y.sirasi) - Number(x.sirasi));

/* Menü ve kutucuk sayısı: bugüne dek (geciken dahil) yapılacak, sırası muhabirde olan işler. */
export const bugunkuYapilacakSayisi = (d: Durum, ben: Kisi, b: string = bugun()) =>
  muhabirYapilacaklari(d, ben, b).filter((y) => y.sirasi && (y.grup === "geciken" || y.grup === "bugun")).length;
