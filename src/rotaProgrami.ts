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

/*
 * Kuralın sürümü: 2'de vardiyanın bitişi de yazılıyor. Önceki sürümle aktarılmış dönemde
 * yalnız başlangıç saati var (kullanıcı: bitiş görünmüyordu); o dönem bir kez yeniden okunur.
 */
export const ROTA_SURUMU = 2;

/** Bugünü kapsayan, bu sürümle aktarılmış dönem kayıtta var mı (aktarım gerekmez). */
export const rotaGuncel = (d: Pick<Durum, "rotaProgramlari">, gun = bugun()) =>
  (d.rotaProgramlari ?? []).some((p) => p.bas <= gun && gun <= p.bit && (p.surum ?? 1) >= ROTA_SURUMU);

/*
 * Günlerden dönem: her günün rota ve sunucu kayıtları kişiye eşlenir (staffing şeridinin
 * kuralı ve öğrenilmiş eşleşmeler); yalnız kesin eşleşen yazılır, belirsiz ya da kayıtta
 * olmayan ad "eşleşmeyen"e. Kişi aynı gün iki satırdaysa erken saat. Değer vardiyanın
 * kendisi ("07:00-16:00"); bitişi okunmamışsa yalnız başlangıç. Başlangıç başta olduğu
 * için metin karşılaştırması erken vardiyayı seçer.
 */
export const rotaDonemiKur = (gunler: RotaGunu[], kisiler: Kisi[], ogrenilen: Record<string, string> = {}): Pick<RotaProgrami, "sekme" | "bas" | "bit" | "kisiler" | "eslesmeyen" | "surum"> => {
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
      const vardiya = k.bitis ? `${k.saat}-${k.bitis}` : k.saat;
      if (!gunleri[g.tarih] || vardiya < gunleri[g.tarih]) gunleri[g.tarih] = vardiya;
    }
  }
  return { sekme: gunler[0]?.sekme ?? "", bas: gunler[0]?.tarih ?? "", bit: gunler[gunler.length - 1]?.tarih ?? "", kisiler: harita, eslesmeyen: [...eslesmeyen].sort(), surum: ROTA_SURUMU };
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

/*
 * Profilin özeti (kullanıcı: izin günleri düzenli, gün gün cetvel gereksiz; izin günleri ve
 * çalışma saati yeter, öbür günler zaten çalışılan gün). Bugünü kapsayan dönem, yoksa en
 * yenisi. Haftanın bir günü, dönemdeki o günlerin yarısından azında çalışıyorsa izin günü.
 * Saat en sık vardiya; ondan farklı günler sayısıyla "farklı saatler"de.
 */
export interface CalismaOzeti {
  bas: string;
  bit: string;
  /** Haftanın günü, Cumartesi 0; örnek tarihle (gün adı dilde yazılsın). */
  izinGunleri: { gun: number; ornek: string }[];
  saat: string;
  farkli: { saat: string; n: number }[];
}

export const calismaOzeti = (d: Pick<Durum, "rotaProgramlari">, kisiId: string, gun = bugun()): CalismaOzeti | null => {
  const donemler = (d.rotaProgramlari ?? []).filter((p) => p.kisiler[kisiId] && Object.keys(p.kisiler[kisiId]).length);
  const yeni = [...donemler].sort((a, b) => b.zaman.localeCompare(a.zaman));
  const p = yeni.find((x) => x.bas <= gun && gun <= x.bit) ?? [...donemler].sort((a, b) => b.bas.localeCompare(a.bas))[0];
  if (!p) return null;
  const program = p.kisiler[kisiId];
  const toplam = new Map<number, number>();
  const calisan = new Map<number, number>();
  const ornek = new Map<number, string>();
  for (let t = p.bas; t <= p.bit; t = gunEkle(t, 1)) {
    const g = (new Date(`${t}T12:00:00Z`).getUTCDay() + 1) % 7;
    toplam.set(g, (toplam.get(g) ?? 0) + 1);
    if (program[t]) calisan.set(g, (calisan.get(g) ?? 0) + 1);
    if (!ornek.has(g)) ornek.set(g, t);
  }
  const izinGunleri = [...toplam.entries()]
    .filter(([g, n]) => (calisan.get(g) ?? 0) * 2 < n)
    .sort(([a], [b]) => a - b)
    .map(([g]) => ({ gun: g, ornek: ornek.get(g)! }));
  const sayim = new Map<string, number>();
  for (const s of Object.values(program)) sayim.set(s, (sayim.get(s) ?? 0) + 1);
  const sirali = [...sayim.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { bas: p.bas, bit: p.bit, izinGunleri, saat: sirali[0][0], farkli: sirali.slice(1).map(([saat, n]) => ({ saat, n })) };
};

/** Vardiya metni ekranda: "07:00-16:00" → "07:00–16:00". */
export const vardiyaMetni = (s: string) => s.replace("-", "–");
