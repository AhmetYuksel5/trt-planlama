import { haftaSonu } from "./haftalik";
import { bugun } from "./tarih";
import type { Durum, HaftalikKalem, HaftalikPlan, NextDayPlan, Oneri } from "./veri";

/*
 * Önerinin hangi planlara düştüğü (saf). Muhabir artık Next Day ya da
 * haftalık seçmiyor; önerinin günü (çok günlüyse aralığı) var. Öneri,
 * Planlama'nın üzerinde çalıştığı planlardan hangisinin günlerine
 * düşüyorsa o planın etiketini alıyor: açık Next Day planı, kesinleşmemiş
 * haftalık plan, özel yayın. Etiket saklanmıyor, her an kayıttan
 * hesaplanıyor: yarın açılan plan bugünkü öneriye de etiket verir.
 * Eski haftalık öneri (`hafta` dolu, günü yok) yalnız haftalık.
 * Karar verilmiş öneri (plana ya da haftalık gündeme girmiş) yalnız girdiği
 * planın etiketini taşır: iki plana düşen öneri gündeme alınınca Next Day
 * etiketi de kalıyor, girdiği yer okunmuyordu.
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

/*
 * Başlığa gelişme eklerken seçilebilecek muhabir önerileri: karar bekleyen
 * (yeni, değerlendiriliyor, sonra), haftalık gündemde olmayan, yalnız
 * haftalık eski öneri olmayan. Önce bu planın gününe düşenler, sonra öbür
 * günlerinkiler (muhabir başka güne önermiş olabilir). Talimatta muhabir
 * yok, plana ekleme penceresinde atanıyor; burada yok.
 */
export const gelismeOneriAdaylari = (d: Pick<Durum, "oneriler" | "haftalik">, plan: Pick<NextDayPlan, "tarih">): { buGun: Oneri[]; digerleri: Oneri[] } => {
  const gundemde = new Set(d.haftalik.flatMap((h) => h.kalemler.map((k) => k.oneriId)));
  const adaylar = d.oneriler
    .filter((o) => !!o.muhabirId && !o.talimatVeren && ["yeni", "degerlendiriliyor", "sonra"].includes(o.durum) && !(o.hafta && !o.hedefTarih) && !gundemde.has(o.id))
    .sort((a, b) => b.zaman.localeCompare(a.zaman));
  return { buGun: adaylar.filter((o) => oneriGunde(o, plan.tarih)), digerleri: adaylar.filter((o) => !oneriGunde(o, plan.tarih)) };
};

/** Haftalık planın haftasına düşüyor mu (eski haftalık öneride haftası). */
export const oneriHaftada = (o: Oneri, h: HaftalikPlan) => {
  if (o.hafta) return o.hafta === h.baslangic;
  const a = oneriAraligi(o);
  return !!a && a[0] <= haftaSonu(h.baslangic) && a[1] >= h.baslangic;
};

/** Üzerinde çalışılan Next Day planları (Newsdesk'e devredilmemiş, geçmemiş). */
export const acikGunPlanlari = (d: Durum): NextDayPlan[] => d.planlar.filter((p) => p.durum !== "devralindi" && p.tarih >= bugun());

/** Önerinin girdiği yer: Next Day planı (plana eklendi) ve/veya haftalık gündemdeki kalemi. */
export interface OneriYeri {
  plan?: NextDayPlan;
  planda: boolean;
  hafta?: HaftalikPlan;
  kalem?: HaftalikKalem;
}

export const oneriYeri = (d: Durum, o: Oneri): OneriYeri | null => {
  const planda = o.durum === "planaEklendi" && !!o.planId;
  const hafta = d.haftalik.find((h) => h.kalemler.some((k) => k.oneriId === o.id));
  if (!planda && !hafta) return null;
  return {
    planda,
    plan: planda ? d.planlar.find((p) => p.id === o.planId) : undefined,
    hafta,
    kalem: hafta?.kalemler.find((k) => k.oneriId === o.id),
  };
};

export const oneriEtiketleri = (d: Durum, o: Oneri): OneriEtiketi[] => {
  const yer = oneriYeri(d, o);
  if (yer) return [...(yer.planda ? (["nextday"] as const) : []), ...(yer.hafta ? (["haftalik"] as const) : [])];
  const e: OneriEtiketi[] = [];
  const nd = acikGunPlanlari(d).some((p) => oneriGunde(o, p.tarih));
  const hf = !!o.hafta || d.haftalik.some((h) => h.durum !== "kesinlesti" && oneriHaftada(o, h));
  const oz = d.ozel.some((x) => x.tarih >= bugun() && oneriGunde(o, x.tarih));
  if (nd) e.push("nextday");
  if (hf) e.push("haftalik");
  if (oz) e.push("ozel");
  return e;
};
