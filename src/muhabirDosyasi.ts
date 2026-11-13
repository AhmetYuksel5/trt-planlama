import { oneriArsivde } from "./oneriPlanlari";
import { oneriYolu, type OneriYolu } from "./oneriYolu";
import { paketSonucu } from "./paketSonucu";
import { bugun, gunEkle } from "./tarih";
import { gelismeMuhabirleri, type Durum, type Gorevlendirme, type NextDayPlan, type Oneri, type Paket } from "./veri";

/*
 * Muhabirin dosyası (yeni mimari, 2. aşama): profilin başındaki "Şimdi".
 * Planlamacı muhabirle konuşmadan önce bilmesi gerekenleri dört listeden
 * (öneriler, takipler, paketler, plan) topluyordu. Saf, saklanmaz.
 * - Sırası bizde: yolu Planlama'da ya da bir masada duran öneri ve paket
 *   (karar, onay bekleyen "Yapıldı").
 * - Sırası onda: teklif, düzeltme isteği, onaylı ama sonucu gelmemiş paket.
 * - Planda: bugünün ve yarının Next Day planında adı geçen satırlar.
 * - İzin: bugünü ya da önümüzdeki 7 günü kapsayan onaylı izin.
 */

export interface DosyaIsi {
  oneri?: Oneri;
  paket?: Paket;
  yol?: OneriYolu;
}

export interface PlandakiSatir {
  plan: NextDayPlan;
  planBaslikId?: string;
  tur: "baslik" | "gelisme" | "paket" | "canli";
  metin: string;
}

export interface MuhabirDosyasi {
  bizde: DosyaIsi[];
  onda: DosyaIsi[];
  planda: PlandakiSatir[];
  takipler: Oneri[];
  izin?: Gorevlendirme;
  /** Önerilerinin yazışmasındaki son mesaj. */
  sonTemas?: string;
}

export function muhabirDosyasi(d: Durum, kisiId: string, b: string = bugun()): MuhabirDosyasi {
  const bizde: DosyaIsi[] = [];
  const onda: DosyaIsi[] = [];
  const takipler: Oneri[] = [];
  const oneriPaketleri = new Set<string>();
  for (const o of d.oneriler) {
    if (o.muhabirId !== kisiId || o.durum === "reddedildi" || o.durum === "geriCekildi" || oneriArsivde(o, b)) continue;
    if (o.durum === "takip") {
      takipler.push(o);
      continue;
    }
    const yol = oneriYolu(d, o);
    if (yol.paket) oneriPaketleri.add(yol.paket.id);
    if (yol.bitti || !yol.kimde) continue;
    (yol.kimde.kisiId === kisiId ? onda : bizde).push({ oneri: o, yol, paket: yol.paket });
  }
  // Önerisiz paketler (plana doğrudan girmiş, görev): yolu öneriden okunamıyor.
  for (const p of d.paketler) {
    if (p.muhabirId !== kisiId || oneriPaketleri.has(p.id) || p.ozelGorevBekliyor) continue;
    if (paketSonucu(p) === "onayBekliyor") bizde.push({ paket: p });
    else if (p.durum === "onaylandi") onda.push({ paket: p });
  }
  const gunler = new Set([b, gunEkle(b, 1)]);
  const planlar = d.planlar.filter((p) => gunler.has(p.tarih));
  const planda: PlandakiSatir[] = [];
  const baslikAdi = (id?: string) => (id ? (d.basliklar.find((x) => x.id === id)?.ad ?? "") : "");
  for (const plan of planlar) {
    for (const pb of plan.basliklar)
      if (pb.muhabirler.some((m) => m.kisiId === kisiId)) planda.push({ plan, planBaslikId: pb.id, tur: "baslik", metin: baslikAdi(pb.baslikId) });
    const pbAdi = (id?: string) => baslikAdi(plan.basliklar.find((x) => x.id === id)?.baslikId);
    for (const g of d.gelismeler)
      if (g.planId === plan.id && gelismeMuhabirleri(g).some((m) => m.kisiId === kisiId)) planda.push({ plan, planBaslikId: g.planBaslikId, tur: "gelisme", metin: g.metin || pbAdi(g.planBaslikId) });
    for (const p of d.paketler)
      if (p.planId === plan.id && p.muhabirId === kisiId && p.durum !== "iptal") planda.push({ plan, planBaslikId: p.planBaslikId, tur: "paket", metin: p.baslik });
    for (const c of d.canliYayinlar)
      if (c.planId === plan.id && c.muhabirId === kisiId) planda.push({ plan, planBaslikId: c.planBaslikId, tur: "canli", metin: c.konu || pbAdi(c.planBaslikId) });
  }
  const ufuk = gunEkle(b, 7);
  const izin = d.gorevlendirmeler
    .filter((g) => g.kisiId === kisiId && g.tur === "izin" && g.durum !== "talep" && g.bitis.slice(0, 10) >= b && g.baslangic.slice(0, 10) <= ufuk)
    .sort((x, y) => x.baslangic.localeCompare(y.baslangic))[0];
  const oneriIdleri = new Set(d.oneriler.filter((o) => o.muhabirId === kisiId).map((o) => o.id));
  let sonTemas: string | undefined;
  for (const m of d.mesajlar) if (oneriIdleri.has(m.oneriId) && (!sonTemas || m.zaman > sonTemas)) sonTemas = m.zaman;
  return { bizde, onda, planda, takipler, izin, sonTemas };
}
