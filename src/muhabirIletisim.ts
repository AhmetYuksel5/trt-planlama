import { postaAdresi } from "./girisKodu";
import { oneriArsivde } from "./oneriPlanlari";
import { bugun } from "./tarih";
import type { Durum, Kisi, KisiDurum } from "./veri";

/*
 * Muhabire ulaşmanın ortak kuralları (yeni mimari; belgeler/planlama-yeni-mimari.md).
 * Saf, saklanmaz.
 */

/*
 * Muhabirin posta adresi: kurumsal, yoksa kişisel. Önce üç yerde üç kural
 * vardı (iş postası ve geri bildirim yalnız kurumsal, PKG geri bildirimi
 * kişisele de düşüyordu); Excel'den gelen muhabirin çoğunda yalnız biri var.
 */
export const muhabirAdresi = (k?: Pick<Kisi, "eposta" | "kurumEposta" | "kisiselEposta"> | null): string =>
  (postaAdresi(k) || k?.kisiselEposta || "").trim().toLowerCase();

/*
 * Bugünkü durum kayıttan: onaylı izin "izinli", sürmekte olan saha görevi
 * "sahada"; kayıt yoksa kişideki alan. Kişideki alanı hiçbir eylem
 * güncellemiyordu, izindeki muhabir "görevde" görünüyordu; kayıt önce gelir.
 */
export const kisiBugunDurumu = (d: Pick<Durum, "gorevlendirmeler">, k: Kisi, b: string = bugun()): KisiDurum => {
  const kayit = d.gorevlendirmeler.find((g) => g.kisiId === k.id && g.durum !== "talep" && g.baslangic.slice(0, 10) <= b && g.bitis.slice(0, 10) >= b);
  if (kayit) return kayit.tur === "izin" ? "izinli" : "sahada";
  return k.durum ?? "gorevde";
};

export interface KisiOzeti {
  /** Arşivde olmayan, reddedilmemiş, geri çekilmemiş önerileri (takip hariç). */
  oneri: number;
  takip: number;
  /** Onaylı ya da üretimdeki paketleri. */
  paket: number;
}

export const kisiOzeti = (d: Pick<Durum, "oneriler" | "paketler">, kisiId: string, b: string = bugun()): KisiOzeti => {
  let oneri = 0;
  let takip = 0;
  for (const o of d.oneriler) {
    if (o.muhabirId !== kisiId || o.durum === "reddedildi" || o.durum === "geriCekildi" || oneriArsivde(o, b)) continue;
    if (o.durum === "takip") takip++;
    else oneri++;
  }
  const paket = d.paketler.filter((p) => p.muhabirId === kisiId && (p.durum === "onaylandi" || p.durum === "uretimde")).length;
  return { oneri, takip, paket };
};
