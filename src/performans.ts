import type { Bicim, Durum } from "./veri";

/**
 * Muhabir performans göstergeleri.
 *
 * Ayrıca saklanmıyor, her açılışta paket kayıtlarından hesaplanıyor; rapor
 * ile kayıt ayrışmasın diye. Ölçüm noktaları paketin kendisinde
 * (gorevZamani, muhabirTeslimi, duzeltmeSayisi, nitelik), sınırlı tutulan
 * hareket kaydında değil. Tanımlar taslak, birimle netleşecek:
 * - verilen: muhabire atanmış, onaylanmış ya da üretimde ya da bitmiş iş
 * - zamanında: muhabirin payı (video) teslim saatinden önce gelmiş
 * - teslim süresi: görev verildiğinden videonun geldiği ana
 * - ilk seferde kabul: metni kontrolden düzeltmeye hiç dönmemiş iş
 * - nitelik: Newsdesk'in tamamlanan pakete verdiği 1–5 puan
 */
export interface Performans {
  verilen: number;
  tamamlanan: number;
  devamEden: number;
  /** 0–1; ölçülecek iş yoksa null. */
  zamaninda: number | null;
  ortSaat: number | null;
  ilkSeferde: number | null;
  puan: number | null;
  puanSayisi: number;
  oneriKabul: number | null;
  bicimler: Partial<Record<Bicim, number>>;
}

const oran = (pay: number, payda: number) => (payda ? pay / payda : null);
const ms = (iso: string) => new Date(iso).getTime();

export const performans = (d: Durum, kisiId: string): Performans => {
  const isler = d.paketler.filter((p) => p.muhabirId === kisiId && ["onaylandi", "uretimde", "tamamlandi"].includes(p.durum));
  const biten = isler.filter((p) => p.durum === "tamamlandi");

  const teslimli = isler.filter((p) => p.muhabirTeslimi && p.teslim);
  const sureli = isler.filter((p) => p.muhabirTeslimi && p.gorevZamani);
  /* Metni kontrolden geçmiş iş: muhabirin payı bitmiş ya da paket tamamlanmış. */
  const kontrollu = isler.filter((p) => p.muhabirTeslimi || p.durum === "tamamlandi");
  const puanli = biten.filter((p) => p.nitelik);

  const oneriler = d.oneriler.filter((o) => o.muhabirId === kisiId && (o.durum === "planaEklendi" || o.durum === "reddedildi"));

  const bicimler: Partial<Record<Bicim, number>> = {};
  for (const p of biten) if (p.bicim) bicimler[p.bicim] = (bicimler[p.bicim] ?? 0) + 1;

  return {
    verilen: isler.length,
    tamamlanan: biten.length,
    devamEden: isler.length - biten.length,
    zamaninda: oran(teslimli.filter((p) => ms(p.muhabirTeslimi!) <= ms(p.teslim!)).length, teslimli.length),
    ortSaat: sureli.length ? sureli.reduce((t, p) => t + (ms(p.muhabirTeslimi!) - ms(p.gorevZamani!)), 0) / sureli.length / 3_600_000 : null,
    ilkSeferde: oran(kontrollu.filter((p) => !p.duzeltmeSayisi).length, kontrollu.length),
    puan: puanli.length ? puanli.reduce((t, p) => t + p.nitelik!, 0) / puanli.length : null,
    puanSayisi: puanli.length,
    oneriKabul: oran(oneriler.filter((o) => o.durum === "planaEklendi").length, oneriler.length),
    bicimler,
  };
};
