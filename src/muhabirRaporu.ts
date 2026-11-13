import { ay, ayKaydir, muhabirIsleri } from "./muhasebe";
import { oneriPlanKaydi, oneriPlansizKabul } from "./oneriPlanlari";
import { yerelGun } from "./tarih";
import type { Durum, Kisi } from "./veri";
import { disMuhabirMi, icMuhabirMi } from "./yapi";

/*
 * Muhabir raporu (yeni mimari, 3. aşama; belgeler/planlama-yeni-mimari.md):
 * ay ay, bir önceki ayla karşılaştırmalı. Eski rapor yalnız işi verilmiş dış
 * muhabiri gösteriyordu, kabul oranı ve çağrıya yanıt yoktu, canlı ve nafize
 * sayılmıyordu (Muhasebe sayıyordu, iki sayfa ayrışıyordu). Burada:
 * - biten iş Muhasebe'nin kuralıyla (`muhabirIsleri`): tamamlanan paket,
 *   "yapıldı" canlı, yayınlanmış nafize; ay işin gününe göre;
 * - öneri: ay içinde gelen (takip hariç), kabul oranı kabul / (kabul + ret);
 * - verilen: ay içinde görevi verilen paket (onaylı, üretimde, bitmiş ya da
 *   yapılmadı), yapılmayan: yapılmadı onaylanmış;
 * - çağrıya yanıt: ay içindeki çağrılardan alıcısı olduğu ve yanıtladığı;
 * - son iş günü: bütün zamanların son sayılan işi.
 * Dış ve iç muhabirler; işi olmayanlar da listede (ekranda soluk). Saklanmaz.
 */

export interface MuhabirAyi {
  oneri: number;
  kabul: number;
  ret: number;
  /** 0–1; karar verilmiş öneri yoksa null. */
  kabulOrani: number | null;
  verilen: number;
  biten: number;
  bitenPkg: number;
  bitenCanli: number;
  yapilmayan: number;
  cagri: number;
  yanit: number;
  /** 0–1; çağrı yoksa null. */
  yanitOrani: number | null;
}

export interface MuhabirRaporSatiri {
  kisi: Kisi;
  ic: boolean;
  bu: MuhabirAyi;
  onceki: MuhabirAyi;
  sonIs?: string;
  bos: boolean;
}

const ayGunu = (z?: string) => (z ? (z.length > 10 ? yerelGun(z) : z).slice(0, 7) : "");

function ayHesabi(d: Durum, k: Kisi, ayi: string, isler: ReturnType<typeof muhabirIsleri>): MuhabirAyi {
  let oneri = 0, kabul = 0, ret = 0;
  for (const o of d.oneriler) {
    if (o.muhabirId !== k.id || o.durum === "takip" || o.takipTuru || ayGunu(o.zaman) !== ayi) continue;
    oneri++;
    if (o.durum === "reddedildi") ret++;
    else if (o.durum === "planaEklendi" || oneriPlanKaydi(d, o) || oneriPlansizKabul(d, o)) kabul++;
  }
  let verilen = 0, yapilmayan = 0;
  for (const p of d.paketler) {
    if (p.muhabirId !== k.id || p.ozelGorevBekliyor) continue;
    if (ayGunu(p.gorevZamani ?? p.olusturma) === ayi && (["onaylandi", "uretimde", "tamamlandi"].includes(p.durum) || p.yapilmadi)) verilen++;
    if (p.yapilmadi && ayGunu(p.yapilmadi.zaman) === ayi) yapilmayan++;
  }
  const buAy = isler.filter((x) => ay(x.tarih) === ayi);
  const cagrilar = (d.cagrilar ?? []).filter((c) => c.bcc.includes(k.id) && ayGunu(c.tarih) === ayi);
  const yanitli = new Set((d.yanitlar ?? []).filter((y) => y.kisiId === k.id && y.cagriId).map((y) => y.cagriId!));
  const yanit = cagrilar.filter((c) => yanitli.has(c.id) || d.oneriler.some((o) => o.cagriId === c.id && o.muhabirId === k.id)).length;
  return {
    oneri,
    kabul,
    ret,
    kabulOrani: kabul + ret ? kabul / (kabul + ret) : null,
    verilen,
    biten: buAy.length,
    bitenPkg: buAy.filter((x) => x.kaynak === "paket").length,
    bitenCanli: buAy.filter((x) => x.kaynak !== "paket").length,
    yapilmayan,
    cagri: cagrilar.length,
    yanit,
    yanitOrani: cagrilar.length ? yanit / cagrilar.length : null,
  };
}

/** Raporun muhabirleri: dış muhabirler ve haber merkezindeki muhabir ünvanlılar (etkin olanlar). */
export const raporMuhabirleri = (d: Durum): Kisi[] => d.kisiler.filter((k) => !k.pasif && (disMuhabirMi(k) || icMuhabirMi(k)));

export function muhabirRaporu(d: Durum, ayi: string): MuhabirRaporSatiri[] {
  const onceki = ayKaydir(ayi, -1);
  return raporMuhabirleri(d).map((kisi) => {
    const isler = muhabirIsleri(d, kisi.id);
    const bu = ayHesabi(d, kisi, ayi, isler);
    const sonIs = isler.filter((x) => ay(x.tarih) <= ayi).at(-1)?.tarih;
    return { kisi, ic: !disMuhabirMi(kisi), bu, onceki: ayHesabi(d, kisi, onceki, isler), sonIs, bos: !bu.oneri && !bu.verilen && !bu.biten };
  });
}

export const RAPOR_SUTUNLARI = ["oneri", "kabulOrani", "verilen", "biten", "yapilmayan", "yanitOrani", "sonIs"] as const;
export type RaporSutunu = (typeof RAPOR_SUTUNLARI)[number];

/** Sıralama: sayılar büyükten küçüğe, boş (null) en sonda; eşitlikte ad. */
export const sutunDegeri = (s: MuhabirRaporSatiri, c: RaporSutunu): number | string | null => (c === "sonIs" ? (s.sonIs ?? null) : s.bu[c]);
