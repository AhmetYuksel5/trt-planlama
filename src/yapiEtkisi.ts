import { altindaMi, ekipAdayi, ekipGorevleri, type Yapi } from "./yapi";
import type { BirimId, EkipGoreviId, GorevId, Kisi } from "./veri";

/*
 * Organizasyon'daki değişikliğin Plan ekibine etkisi (kullanıcı: burada
 * yapılan değişiklik plan ekibi gibi başka yerleri de etkileyebilir,
 * değişiklikten sonra sorup teyit al). Ekip görevinin kuralı birim + ünvan
 * seçimi: ünvan çıkarmak, birimi taşımak ya da gizlemek görevin kapsadığı
 * kişileri sessizce değiştiriyordu; birime yeni ünvan eklenince de o birimin
 * ünvanlarını tek tek seçmiş görev yeni ünvanı kapsamıyordu. Saklanmaz,
 * değişiklikten önceki ve sonraki taslaktan hesaplanır.
 */

export interface KapsamFarki {
  gorev: EkipGoreviId;
  eklenen: Kisi[];
  cikan: Kisi[];
}

export interface UnvanOnerisi {
  gorev: EkipGoreviId;
  unvan: GorevId;
  birim: BirimId;
}

export interface EkipEtkisi {
  kapsam: KapsamFarki[];
  yeniUnvan: UnvanOnerisi[];
}

export const ekipEtkisi = (once: Yapi, sonra: Yapi, kisiler: Kisi[]): EkipEtkisi => {
  const etkin = kisiler.filter((k) => !k.pasif);
  const kapsam: KapsamFarki[] = [];
  const yeniUnvan: UnvanOnerisi[] = [];
  const eskiBirimUnvanlari = new Map(once.birimler.map((b) => [b.id, new Set(b.unvanlar ?? [])]));
  for (const g of ekipGorevleri(sonra)) {
    if (g.gizli) continue;
    const onceki = new Set(etkin.filter((k) => ekipAdayi(k, g.id, once)).map((k) => k.id));
    const simdiki = new Set(etkin.filter((k) => ekipAdayi(k, g.id, sonra)).map((k) => k.id));
    const eklenen = etkin.filter((k) => simdiki.has(k.id) && !onceki.has(k.id));
    const cikan = etkin.filter((k) => onceki.has(k.id) && !simdiki.has(k.id));
    if (eklenen.length || cikan.length) kapsam.push({ gorev: g.id, eklenen, cikan });
    // Ünvanları seçilmiş kural, kapsadığı birime yeni giren ünvanı almıyor: sorulsun.
    if (!g.unvanlar.length || !g.birimler.length) continue;
    for (const b of sonra.birimler) {
      if (!g.birimler.some((rb) => altindaMi(b.id, rb, sonra))) continue;
      const eski = eskiBirimUnvanlari.get(b.id);
      for (const u of b.unvanlar ?? [])
        if (!eski?.has(u) && !g.unvanlar.includes(u) && !yeniUnvan.some((x) => x.gorev === g.id && x.unvan === u)) yeniUnvan.push({ gorev: g.id, unvan: u, birim: b.id });
    }
  }
  return { kapsam, yeniUnvan };
};

export const etkiVarMi = (e: EkipEtkisi) => e.kapsam.length > 0 || e.yeniUnvan.length > 0;

/** Seçilen önerileri uygular: ünvan görevin kuralına girer. */
export const unvanlariGoreveEkle = (y: Yapi, secilen: UnvanOnerisi[]): Yapi => {
  if (!secilen.length) return y;
  const gorevler = ekipGorevleri(y).map((g) => {
    const ekle = secilen.filter((s) => s.gorev === g.id && !g.unvanlar.includes(s.unvan)).map((s) => s.unvan);
    return ekle.length ? { ...g, unvanlar: [...g.unvanlar, ...ekle] } : g;
  });
  return { ...y, ekipGorevleri: gorevler };
};
