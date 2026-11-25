import { kayitlariBirlestir, rotaKayitlari, staffingKisisi, sunucuKayitlari } from "./staffing";
import { bugun, gunEkle } from "./tarih";
import type { Durum, Kisi, RotaProgrami } from "./veri";

/*
 * Rotadan çalışma programı (kullanıcı: kayıtlı haber merkezi personelinin hangi gün, hangi
 * saatte çalıştığı rotadan çekilsin; rota ayda bir ya da iki haftada bir değişiyor, her gün
 * okumaya gerek yok: dönemin ilk günü sistemi ilk açanın tarayıcısı doldursun). Kapı
 * veritabanına yazmıyor, yazış kişinin kendi oturumuyla (eylemler.ts → rotaProgramiKaydet).
 * Dönem, rotanın o günü bulduğu sekmeden: bugünden başlayıp sekme değişene dek gün gün
 * okunur. Bu dosya saf; okuma kapıdan (posta-kapi.ts → rotaGetir) çağıranın verdiğiyle.
 */

export interface RotaGunu {
  tarih: string;
  sekme: string;
  satirlar: [string, string, string][];
  sunucu?: [string, string, string][];
}

// Sekme adı tarih aralığı değilse ("Bu dönem") dönem uzar; yine de bir aydan uzun okunmaz.
export const EN_COK_GUN = 35;

/** Bugünü kapsayan dönem kayıtta var mı (aktarım gerekmez). */
export const rotaGuncel = (d: Pick<Durum, "rotaProgramlari">, gun = bugun()) => (d.rotaProgramlari ?? []).some((p) => p.bas <= gun && gun <= p.bit);

/*
 * Günlerden dönem: her günün rota ve sunucu kayıtları kişiye eşlenir (staffing şeridinin
 * kuralı ve öğrenilmiş eşleşmeler); yalnız kesin eşleşen yazılır, belirsiz ya da kayıtta
 * olmayan ad "eşleşmeyen"e. Kişi aynı gün iki satırdaysa erken saat.
 */
export const rotaDonemiKur = (gunler: RotaGunu[], kisiler: Kisi[], ogrenilen: Record<string, string> = {}): Pick<RotaProgrami, "sekme" | "bas" | "bit" | "kisiler" | "eslesmeyen"> => {
  const harita: Record<string, Record<string, string>> = {};
  const eslesmeyen = new Set<string>();
  const etkin = kisiler.filter((k) => !k.pasif);
  for (const g of gunler) {
    const kayitlar = kayitlariBirlestir(rotaKayitlari(g.satirlar), g.sunucu ? sunucuKayitlari(g.sunucu) : null);
    for (const k of kayitlar) {
      if (!k.calisiyor || !k.saat || !k.ad) continue;
      const { kisiId } = staffingKisisi(k.ad, etkin, new Set(), ogrenilen);
      if (!kisiId) {
        eslesmeyen.add(k.ad);
        continue;
      }
      const gunleri = (harita[kisiId] ??= {});
      if (!gunleri[g.tarih] || k.saat < gunleri[g.tarih]) gunleri[g.tarih] = k.saat;
    }
  }
  return { sekme: gunler[0]?.sekme ?? "", bas: gunler[0]?.tarih ?? "", bit: gunler[gunler.length - 1]?.tarih ?? "", kisiler: harita, eslesmeyen: [...eslesmeyen].sort() };
};

/*
 * Dönemi okur: bugünden başlayıp rotanın sekmesi değişene (ya da okunamayana) dek.
 * `oku` kapının günlük okuması; sunucu tablosu varsa onu da.
 */
export const rotaGunleriniOku = async (
  oku: (tarih: string, tur: "rota" | "sunucu") => Promise<{ sekme: string; satirlar: [string, string, string][] } | null>,
  sunucuVar: boolean,
  bas = bugun(),
): Promise<RotaGunu[]> => {
  const gunler: RotaGunu[] = [];
  for (let i = 0; i < EN_COK_GUN; i++) {
    const tarih = gunEkle(bas, i);
    const r = await oku(tarih, "rota");
    if (!r || (gunler.length && r.sekme !== gunler[0].sekme)) break;
    const s = sunucuVar ? await oku(tarih, "sunucu") : null;
    gunler.push({ tarih, sekme: r.sekme, satirlar: r.satirlar, ...(s ? { sunucu: s.satirlar } : {}) });
  }
  return gunler;
};

/** Kişinin programı: gün → saat, bütün dönemlerden (yenisi eskisinin üstüne). */
export const kisiProgrami = (d: Pick<Durum, "rotaProgramlari">, kisiId: string): Record<string, string> =>
  Object.assign({}, ...[...(d.rotaProgramlari ?? [])].sort((a, b) => a.zaman.localeCompare(b.zaman)).map((p) => p.kisiler[kisiId] ?? {}));

/** Önümüzdeki günler: çalıştığı gün saatiyle, öbürü boş (rotada var ama o gün yok). */
export const kisiYakinProgrami = (d: Pick<Durum, "rotaProgramlari">, kisiId: string, gun = bugun(), n = 14) => {
  const p = kisiProgrami(d, kisiId);
  const kapsanan = (t: string) => (d.rotaProgramlari ?? []).some((x) => x.bas <= t && t <= x.bit);
  return Array.from({ length: n }, (_, i) => gunEkle(gun, i))
    .filter(kapsanan)
    .map((tarih) => ({ tarih, saat: p[tarih] ?? "" }));
};

/** Haftalık özet: haftanın günü (Cumartesi 0) → en sık saat; programdaki günlerden. */
export const haftalikOzet = (program: Record<string, string>): { gun: number; saat: string }[] => {
  const sayim = new Map<number, Map<string, number>>();
  for (const [tarih, saat] of Object.entries(program)) {
    const g = (new Date(`${tarih}T12:00:00Z`).getUTCDay() + 1) % 7;
    const m = sayim.get(g) ?? new Map();
    m.set(saat, (m.get(saat) ?? 0) + 1);
    sayim.set(g, m);
  }
  return [...sayim.entries()].sort(([a], [b]) => a - b).map(([gun, m]) => ({ gun, saat: [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0] }));
};
