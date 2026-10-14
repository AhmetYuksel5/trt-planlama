import { haftaSonu } from "./haftalik";
import { bugun } from "./tarih";
import type { Durum, HaftalikPlan, NextDayPlan, Oneri } from "./veri";

/*
 * Önerinin hangi planlara düştüğü (saf). Muhabir artık Next Day ya da
 * haftalık seçmiyor; önerinin günü (çok günlüyse aralığı) var. Öneri,
 * Planlama'nın üzerinde çalıştığı planlardan hangisinin günlerine
 * düşüyorsa o planın etiketini alıyor: açık Next Day planı, kesinleşmemiş
 * haftalık plan, özel yayın. Etiket saklanmıyor, her an kayıttan
 * hesaplanıyor: yarın açılan plan bugünkü öneriye de etiket verir.
 * Eski haftalık öneri (`hafta` dolu, günü yok) yalnız haftalık.
 */

export const ONERI_ETIKETLERI = ["nextday", "haftalik", "ozel"] as const;
export type OneriEtiketi = (typeof ONERI_ETIKETLERI)[number];

/** Önerinin gün aralığı (ilk ve son gün); günü yoksa null. */
export const oneriAraligi = (o: Oneri): [string, string] | null => {
  if (o.hedefTarih) return [o.hedefTarih, o.bitisTarih && o.bitisTarih > o.hedefTarih ? o.bitisTarih : o.hedefTarih];
  if (o.hafta) return o.haftaGunu ? [o.haftaGunu, o.haftaGunu] : [o.hafta, haftaSonu(o.hafta)];
  return null;
};

/** Next Day'in o gününe düşüyor mu: yalnız günü olan öneri (eski haftalık öneri Next Day'e karışmıyor). */
export const oneriGunde = (o: Oneri, tarih: string) => !!o.hedefTarih && o.hedefTarih <= tarih && tarih <= (oneriAraligi(o)?.[1] ?? o.hedefTarih);

/** Haftalık planın haftasına düşüyor mu (eski haftalık öneride haftası). */
export const oneriHaftada = (o: Oneri, h: HaftalikPlan) => {
  if (o.hafta) return o.hafta === h.baslangic;
  const a = oneriAraligi(o);
  return !!a && a[0] <= haftaSonu(h.baslangic) && a[1] >= h.baslangic;
};

/** Üzerinde çalışılan Next Day planları (Newsdesk'e devredilmemiş, geçmemiş). */
export const acikGunPlanlari = (d: Durum): NextDayPlan[] => d.planlar.filter((p) => p.durum !== "devralindi" && p.tarih >= bugun());

export const oneriEtiketleri = (d: Durum, o: Oneri): OneriEtiketi[] => {
  const e: OneriEtiketi[] = [];
  // Plana girmiş öneri girdiği planın etiketini taşır; girmemişse çalışılan planlara bakılır.
  const nd = !!o.planId || acikGunPlanlari(d).some((p) => oneriGunde(o, p.tarih));
  const hf = !!o.hafta || d.haftalik.some((h) => h.kalemler.some((k) => k.oneriId === o.id) || (h.durum !== "kesinlesti" && oneriHaftada(o, h)));
  const oz = d.ozel.some((x) => x.tarih >= bugun() && oneriGunde(o, x.tarih));
  if (nd) e.push("nextday");
  if (hf) e.push("haftalik");
  if (oz) e.push("ozel");
  return e;
};
