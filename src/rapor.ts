import { geciktiMi, paketSahibi } from "./akis";
import { olcumler, type Performans } from "./performans";
import { bugun, gunEkle, yerelGun } from "./tarih";
import type { Bicim, Birim, Durum, IcerikTuru, Kanal, Kisi } from "./veri";

/**
 * Raporlar.
 *
 * performans.ts gibi saklanmıyor, her açılışta kayıtlardan hesaplanıyor;
 * ölçüm tanımları da onunla aynı (olcumler). Dönem işin verildiği güne
 * göre: muhabire görev verildiği gün, henüz verilmediyse paketin açıldığı
 * gün; öneride geldiği gün. Kapsam kola göre: Input müdürü haber,
 * feature ve ekonomi kolunu, Program müdürü program kolunu görüyor.
 * Birimlerin iş yükü dönemden bağımsız, şu anki durum.
 */

export const DONEMLER = [1, 7, 30] as const;
export type Donem = (typeof DONEMLER)[number];

export const donemBasi = (gun: Donem) => gunEkle(bugun(), -(gun - 1));

export interface Rapor {
  ozet: Performans & { iptal: number };
  /** elle: Planlama'nın sistem dışından girdiği (muhabir adına ya da başka kaynaktan); çağrının ne kadarını kapsadığını gösteriyor. */
  oneriler: { gelen: number; planaEklenen: number; reddedilen: number; bekleyen: number; talimat: number; elle: number; kanallar: [Kanal, number][] };
  birimler: { birim: Birim; devamEden: number; geciken: number }[];
  bicimler: [Bicim, number][];
  muhabirler: { kisi: Kisi; p: Performans }[];
}

export const rapor = (d: Durum, gun: Donem, kollar: readonly IcerikTuru[]): Rapor => {
  const bas = donemBasi(gun);
  const donemde = (z?: string) => !!z && yerelGun(z) >= bas;
  const kolda = d.paketler.filter((p) => kollar.includes(p.tur));
  const isler = kolda.filter((p) => donemde(p.gorevZamani ?? p.olusturma));
  const oneriler = d.oneriler.filter((o) => kollar.includes(o.tur) && donemde(o.zaman));

  const kanallar = new Map<Kanal, number>();
  for (const o of oneriler) kanallar.set(o.kanal, (kanallar.get(o.kanal) ?? 0) + 1);

  const aktif = kolda.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal");
  const birimYuku = new Map<Birim, { devamEden: number; geciken: number }>();
  for (const p of aktif) {
    const b = paketSahibi(p);
    if (!b) continue;
    const s = birimYuku.get(b) ?? { devamEden: 0, geciken: 0 };
    s.devamEden++;
    if (geciktiMi(p)) s.geciken++;
    birimYuku.set(b, s);
  }

  const ozet = olcumler(isler, oneriler);
  const muhabirler = d.kisiler
    .filter((k) => k.birim === "muhabir")
    .map((kisi) => ({
      kisi,
      p: olcumler(
        isler.filter((p) => p.muhabirId === kisi.id),
        oneriler.filter((o) => o.muhabirId === kisi.id),
      ),
    }))
    .filter((m) => m.p.verilen > 0)
    .sort((a, b) => b.p.tamamlanan - a.p.tamamlanan || b.p.verilen - a.p.verilen);

  return {
    ozet: { ...ozet, iptal: isler.filter((p) => p.durum === "iptal").length },
    oneriler: {
      gelen: oneriler.length,
      planaEklenen: oneriler.filter((o) => o.durum === "planaEklendi").length,
      reddedilen: oneriler.filter((o) => o.durum === "reddedildi").length,
      bekleyen: oneriler.filter((o) => o.durum === "yeni" || o.durum === "degerlendiriliyor" || o.durum === "sonra").length,
      talimat: oneriler.filter((o) => o.talimatVeren).length,
      elle: oneriler.filter((o) => o.giren).length,
      kanallar: [...kanallar.entries()].sort((a, b) => b[1] - a[1]),
    },
    birimler: [...birimYuku.entries()].map(([birim, s]) => ({ birim, ...s })).sort((a, b) => b.devamEden - a.devamEden),
    bicimler: (Object.entries(ozet.bicimler) as [Bicim, number][]).sort((a, b) => b[1] - a[1]),
    muhabirler,
  };
};
