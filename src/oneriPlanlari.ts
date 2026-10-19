import { haftaSonu } from "./haftalik";
import { bugun, yerelGun } from "./tarih";
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

/*
 * Özel yayın etiketi yok: günü özel yayın gününe denk gelen her öneri o
 * etiketi alıyordu. Özel yayının kendi önerileri (paket önerileri) yayının
 * içinde, genel öneri listesine girmiyor.
 */
export const ONERI_ETIKETLERI = ["nextday", "haftalik"] as const;
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
    .filter((o) => !!o.muhabirId && !o.talimatVeren && ["yeni", "degerlendiriliyor", "sonra"].includes(o.durum) && !(o.hafta && !o.hedefTarih) && !gundemde.has(o.id) && !oneriArsivde(o))
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
  if (nd) e.push("nextday");
  if (hf) e.push("haftalik");
  return e;
};

/*
 * Arşiv: uygulama günü geçmiş öneri Planlama'nın listelerinden kalkıyor,
 * eski öneriler birikmesin. Saklanmıyor, her an kayıttan: önerinin son
 * günü (çok günlüde bitişi, eski haftalık öneride haftanın sonu), plana
 * girdiyse planın günü, günü yoksa geldiği gün. E-posta takibi açık olan
 * öneri işi sürdüğü için arşive düşmüyor. Muhabirde "Geçmiş önerilerim".
 */
export const oneriSonGunu = (o: Oneri): string => {
  const g = oneriAraligi(o)?.[1] ?? yerelGun(o.zaman);
  return o.planTarihi && o.planTarihi > g ? o.planTarihi : g;
};
export const oneriArsivde = (o: Oneri, b: string = bugun()): boolean => o.takip !== "acik" && oneriSonGunu(o) < b;

/*
 * Plana eklenince doğacak PKG önerisinin başlığı: strap, yoksa muhabirin
 * kendi önerisinde Header. E-posta yanıtından düşen öneride strap yok;
 * paket hiç açılmıyordu, Planlama her birini elle ekliyordu. Planlama'nın
 * elle girdiği strap'siz öneri yalnız gelişme kalıyor. Live canlı yayın,
 * takip paket değil.
 */
export const oneriPaketBasligi = (o: Oneri): string | undefined => {
  if (o.bicim === "canli" || o.bicim === "takip") return undefined;
  if (o.paketBasligi?.trim()) return o.paketBasligi.trim();
  return o.muhabirId && !o.giren && !o.talimatVeren ? o.haberBasligi.trim() || undefined : undefined;
};
