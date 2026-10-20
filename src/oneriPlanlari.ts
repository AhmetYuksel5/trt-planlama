import { haftaSonu } from "./haftalik";
import { bugun, gunEkle, yerelGun } from "./tarih";
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
 * (yeni, değerlendiriliyor, sonra, takip), haftalık gündemde olmayan, yalnız
 * haftalık eski öneri olmayan. Önce bu planın gününe düşenler, sonra öbür
 * günlerinkiler (muhabir başka güne önermiş olabilir). Talimatta muhabir
 * yok, plana ekleme penceresinde atanıyor; burada yok.
 */
export const gelismeOneriAdaylari = (d: Pick<Durum, "oneriler" | "haftalik" | "paketler">, plan: Pick<NextDayPlan, "tarih">): { buGun: Oneri[]; digerleri: Oneri[] } => {
  const gundemde = new Set(d.haftalik.flatMap((h) => h.kalemler.map((k) => k.oneriId)));
  const adaylar = d.oneriler
    .filter((o) => !!o.muhabirId && !o.talimatVeren && ["yeni", "degerlendiriliyor", "sonra", "takip"].includes(o.durum) && !(o.hafta && !o.hedefTarih) && !gundemde.has(o.id) && !oneriArsivde(o, bugun(), d))
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

// Next Day'deki yer önerinin kopyasından değil plandaki kayıttan (`oneriPlanKaydi`).
export const oneriYeri = (d: Durum, o: Oneri): OneriYeri | null => {
  const kayit = o.durum === "teklif" ? null : oneriPlanKaydi(d, o);
  const hafta = d.haftalik.find((h) => h.kalemler.some((k) => k.oneriId === o.id));
  if (!kayit && !hafta) return null;
  return {
    planda: !!kayit,
    plan: kayit?.plan,
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
 * Arşiv: tek kural. Günü 2 gün geçmiş ve açık işi kalmamış öneri arşive
 * düşer (günü 20'yse 22'sinde de güncel, 23'ünde arşivde); eskiden ertesi
 * gün düşüyordu, Planlama dünkü haberin geri bildirimini arıyordu. Gün:
 * plana girdiyse planın günü, girmediyse önerinin günü (çok günlüde
 * bitişi), günü yoksa geldiği gün. Reddedilen ve geri çekilen öneri günü
 * beklemez; planlamacının elle gönderdiği de. Açık iş: e-postayla takip
 * açık, ya da paketi henüz bitmemiş (toplantıda, onaylı, üretimde).
 * Arşivden çıkarılan öneri o andan yeniden sayılır. Saklanmıyor, her an
 * kayıttan; muhabirde "Geçmiş önerilerim".
 */
export const ARSIV_GUNU = 2;
const ACIK_PAKET = new Set(["taslak", "degerlendiriliyor", "onaylandi", "uretimde"]);

export const oneriSonGunu = (o: Oneri): string => {
  const g = oneriAraligi(o)?.[1] ?? yerelGun(o.zaman);
  // Takipte gün son gelişme satırının günü: muhabir yeni satır ekledikçe takip canlı kalıyor.
  const s = o.satirlar?.length ? yerelGun(o.satirlar[o.satirlar.length - 1].zaman) : "";
  const gs = s > g ? s : g;
  const p = o.planTarihi && o.planTarihi > gs ? o.planTarihi : gs;
  const c = o.arsivdenCikti && yerelGun(o.arsivdenCikti);
  return c && c > p ? c : p;
};

/** Önerinin bitmemiş işi var mı: varsa günü geçse de arşive düşmüyor. */
export const oneriAcikIsi = (o: Oneri, d?: Pick<Durum, "paketler">): boolean =>
  o.takip === "acik" || !!d?.paketler.some((p) => p.oneriId === o.id && ACIK_PAKET.has(p.durum));

export const oneriArsivde = (o: Oneri, b: string = bugun(), d?: Pick<Durum, "paketler">): boolean => {
  if (o.arsiv) return true;
  if (oneriAcikIsi(o, d)) return false;
  if (!o.arsivdenCikti && (o.durum === "reddedildi" || o.durum === "geriCekildi")) return true;
  return gunEkle(oneriSonGunu(o), ARSIV_GUNU) < b;
};

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

/*
 * Önerinin plandaki kaydı: "plana eklendi" bilgisinin tek doğru kaynağı.
 * Önerideki durum, plan ve gün bu kayıttan türeyen kopya; ekleme, çıkarma,
 * geri alma ve bayat yazışlar onu ayrı ayrı düzeltmek zorunda kalınca
 * planda duran öneri "değerlendiriliyor" görünebiliyordu (geri bildirim
 * gönderilemiyordu). Kayıt: önerinin gelişmesi, canlı yayını ya da iptal
 * edilmemiş paketi, var olan bir Next Day planında. Birden çok plandaysa
 * önerinin kendi planı, yoksa en geç günlü plan.
 */
export interface OneriPlanKaydi {
  plan: NextDayPlan;
  paketId?: string;
}

export const oneriPlanKaydi = (d: Pick<Durum, "planlar" | "gelismeler" | "paketler" | "canliYayinlar">, o: Oneri): OneriPlanKaydi | null => {
  const idler = new Set<string>();
  for (const x of d.gelismeler) if (x.oneriId === o.id && x.planId) idler.add(x.planId);
  for (const x of d.canliYayinlar) if (x.oneriId === o.id && x.planId) idler.add(x.planId);
  for (const x of d.paketler) if (x.oneriId === o.id && x.planId && x.durum !== "iptal") idler.add(x.planId);
  const planlar = d.planlar.filter((p) => idler.has(p.id));
  if (!planlar.length) return null;
  const plan = planlar.find((p) => p.id === o.planId) ?? planlar.reduce((a, b) => (b.tarih > a.tarih ? b : a));
  return { plan, paketId: d.paketler.find((x) => x.oneriId === o.id && x.planId === plan.id && x.durum !== "iptal")?.id };
};

/*
 * Next Day kaydı olmadan da plana girmiş sayılan öneri: kesinleşmiş haftada
 * kabul (ya da bilgi) kalemi, ya da plansız onaylı paketi (feature, ekonomi).
 * Bunlar Next Day'e hiç geçmeyebiliyor; "plana eklendi" kalmalı.
 */
export const oneriPlansizKabul = (d: Pick<Durum, "haftalik" | "paketler">, o: Oneri): boolean =>
  d.haftalik.some((h) => h.durum === "kesinlesti" && h.kalemler.some((k) => k.oneriId === o.id && k.karar !== "ret")) ||
  d.paketler.some((x) => x.oneriId === o.id && !x.planId && x.durum !== "iptal");

/*
 * Plandan çıkan öneri yeniden öneri olur: plan bağı silinir, durum
 * "değerlendiriliyor". Yalnız takip plan kararıydı, o da kalkar.
 */
export const plandanDonmus = (o: Oneri): Oneri => {
  const { planId: _p, planTarihi: _t, paketId: _k, ...x } = o;
  if (x.yalnizTakip) {
    const { yalnizTakip: _y, takip: _tk, takipBitis: _tb, takipBitiren: _tr, ...y } = x;
    return { ...y, durum: "degerlendiriliyor" };
  }
  return { ...x, durum: "degerlendiriliyor" };
};

/*
 * Önerinin plandaki kayda göre hali: planda kaydı olan "plana eklendi"
 * (planı, günü, paketi kayıttan); kaydı kalmamış ve plansız da kabul
 * edilmemiş "plana eklendi" değerlendirmeye döner. Değişmiyorsa aynı nesne
 * (fark nesne kimliğiyle çıkıyor). Teklif muhabirin kararında, dokunulmuyor.
 * Sistemin eşitleme işi ve "plana eklendi"ye bakan kararlar (geri bildirim)
 * bunu kullanıyor: kopya kaysa da karar kayda göre.
 */
export const oneriPlanaGore = (d: Pick<Durum, "planlar" | "gelismeler" | "paketler" | "canliYayinlar" | "haftalik">, o: Oneri): Oneri => {
  if (o.durum === "teklif") return o;
  const k = oneriPlanKaydi(d, o);
  if (k) {
    if (o.durum === "planaEklendi" && o.planId === k.plan.id && o.planTarihi === k.plan.tarih && (!k.paketId || o.paketId === k.paketId)) return o;
    return { ...o, durum: "planaEklendi", planId: k.plan.id, planTarihi: k.plan.tarih, ...(k.paketId && { paketId: k.paketId }) };
  }
  return o.durum !== "planaEklendi" || oneriPlansizKabul(d, o) ? o : plandanDonmus(o);
};

/*
 * Geri almada dönülebilecek aşamalar: yalnız geçerli önceki aşamalar.
 * Plandaki (ya da gündemdeki), reddedilen ve eski "sonra" öneri
 * değerlendirmeye ya da takibe; takipteki ve düzeltmedeki değerlendirmeye.
 * Takip muhabirsiz ve talimatta yok. Henüz karar verilmemiş öneride
 * (yeni, değerlendiriliyor, teklif) geri alınacak bir şey yok.
 */
export const ONERI_GERI_HEDEFLERI = ["degerlendiriliyor", "takip"] as const;
export type OneriGeriHedefi = (typeof ONERI_GERI_HEDEFLERI)[number];

export const oneriGeriHedefleri = (d: Durum, o: Oneri): OneriGeriHedefi[] => {
  const takipOlur = !!o.muhabirId && !o.talimatVeren;
  if (oneriYeri(d, o) || o.durum === "planaEklendi" || o.durum === "reddedildi" || o.durum === "sonra") return takipOlur ? ["degerlendiriliyor", "takip"] : ["degerlendiriliyor"];
  if (o.durum === "takip" || o.durum === "duzeltme") return ["degerlendiriliyor"];
  return [];
};
