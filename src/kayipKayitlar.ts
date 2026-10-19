import type { CanliYayin, Durum, Gelisme, NextDayPlan, Paket } from "./veri";

/*
 * Başlığı kaybolmuş kayıtlar (saf). Bayat önbellekli tarayıcı var olan planı
 * şablondan yeniden yazınca planın başlık listesi eskiye döndü; o gün eklenen
 * başlıkların gelişmeleri, PKG'leri ve canlıları ayrı belgelerde kaldı ama
 * bağlı oldukları başlık plandan düştüğü için ekranda görünmüyordu. Başlık
 * çıkarma altındaki gelişme ve canlıyı da siliyor, PKG'li başlık çıkmıyor;
 * yani böyle kayıt olağan akışta doğmuyor.
 */
export interface KayipGrup {
  /** Kaybolan plan başlığının kimliği: kayıtlar hâlâ onu gösteriyor. */
  pbId: string;
  gelismeler: Gelisme[];
  paketler: Paket[];
  canlilar: CanliYayin[];
  /** Kayıtlardan bilinebilen başlık: öneriden ya da Weekly kaleminden gelenin dosyası. */
  onerilen?: string;
}

export const kayipBasliklar = (d: Pick<Durum, "gelismeler" | "paketler" | "canliYayinlar" | "oneriler" | "haftalik">, plan: NextDayPlan): KayipGrup[] => {
  const var_ = new Set(plan.basliklar.map((b) => b.id));
  const kayip = (x: { planId?: string; planBaslikId?: string }) => x.planId === plan.id && !!x.planBaslikId && !var_.has(x.planBaslikId);
  const gruplar = new Map<string, KayipGrup>();
  const grup = (pbId: string) => {
    let g = gruplar.get(pbId);
    if (!g) gruplar.set(pbId, (g = { pbId, gelismeler: [], paketler: [], canlilar: [] }));
    return g;
  };
  for (const x of d.gelismeler) if (kayip(x)) grup(x.planBaslikId!).gelismeler.push(x);
  for (const x of d.paketler) if (kayip(x) && x.durum !== "iptal") grup(x.planBaslikId!).paketler.push(x);
  for (const x of d.canliYayinlar) if (kayip(x)) grup(x.planBaslikId!).canlilar.push(x);
  const kalemDosyasi = (id?: string) => (id ? d.haftalik.flatMap((h) => h.kalemler).find((k) => k.id === id)?.baslikId : undefined);
  const oneriDosyasi = (id?: string) => (id ? d.oneriler.find((o) => o.id === id)?.baslikId : undefined);
  for (const g of gruplar.values()) {
    const kaynaklar = [...g.gelismeler, ...g.paketler, ...g.canlilar];
    g.onerilen = kaynaklar.map((x) => oneriDosyasi(x.oneriId) ?? kalemDosyasi(x.haftalikKalemId)).find(Boolean);
  }
  return [...gruplar.values()];
};

/* Başlığa geri konunca başlığın muhabirleri: PKG'nin muhabiri ve öneriyle gelen gelişmenin muhabiri (öneri plana eklenirken öyle yazılıyor). */
export const kayipMuhabirleri = (g: KayipGrup) => [
  ...new Set([...g.paketler.map((p) => p.muhabirId), ...g.gelismeler.filter((x) => x.oneriId).map((x) => x.onerenId)].filter((x): x is string => !!x)),
];
