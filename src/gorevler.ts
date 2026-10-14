import { gunFarki, haftaBasi } from "./tarih";
import { TEMEL_GOREVLER, type Durum, type GorevTanimi, type Is, type TemelGorev } from "./veri";

/*
 * Planlama görevleri ve iş taksimi: okuma kuralları (saf). Eylemler
 * eylemler.ts → gorevKaydet, gorevDonemSorumlusu, isKaydet, isDurumu.
 *
 * Temel görevler planların kendisi (Next Day, Weekly, Aylık, Özel yayın);
 * yan görevler onlarla ilişkili ama tam sınıflanamayan işler (Türkiye
 * ajandası, takvim taraması…), etiketlerle. Her görevin sorumlusu sabit
 * ya da sıralı: sıralıda kişi listesi dönem dönem (gün ya da Cumartesi
 * başlayan hafta) döner, izinli atlanır, dönemin sorumlusu elle de
 * değiştirilebilir. Sorumlu saklanmaz, her an kayıttan hesaplanır.
 */

/** Kayıtta görev yoksa (yeni kurulum, eski kayıt) dört temel görev, sorumlusuz. */
export const varsayilanGorevler = (): GorevTanimi[] =>
  TEMEL_GOREVLER.map((t) => ({ id: `gv-${t}`, tur: "temel", temel: t, ad: "", etiketler: [], dagilim: { tur: "sabit", kisiler: [] } }));

export const gorevListesi = (d: Durum): GorevTanimi[] => (d.gorevler?.length ? d.gorevler : varsayilanGorevler());
export const isListesi = (d: Durum): Is[] => d.isler ?? [];

/** Sıralı görevde dönemin anahtarı: gün ya da haftanın Cumartesi'si. */
export const donemAnahtari = (g: GorevTanimi, tarih: string) => (g.dagilim.tur === "sirali" && g.dagilim.periyot === "hafta" ? haftaBasi(tarih) : tarih);

/**
 * Görevin o tarihteki sorumluları. Sıralıda başlangıçtan beri geçen dönem
 * sayısı listede kaçıncı kişinin sırası olduğunu veriyor; sırası gelen
 * izinliyse sıradaki geliyor (hepsi izinliyse sıranın kendisi). Elle
 * değiştirilmiş dönem her şeyden önce.
 */
export const sorumlular = (d: Durum, g: GorevTanimi, tarih: string): string[] => {
  const elle = g.degisiklikler?.[donemAnahtari(g, tarih)];
  if (elle) return [elle];
  const l = g.dagilim.kisiler.filter((id) => d.kisiler.some((k) => k.id === id));
  if (g.dagilim.tur === "sabit" || l.length === 0) return l;
  const { periyot, baslangic } = g.dagilim;
  const fark = periyot === "hafta" ? Math.floor(gunFarki(haftaBasi(baslangic), haftaBasi(tarih)) / 7) : gunFarki(baslangic, tarih);
  const sira = ((fark % l.length) + l.length) % l.length;
  for (let i = 0; i < l.length; i++) {
    const id = l[(sira + i) % l.length];
    if (d.kisiler.find((k) => k.id === id)?.durum !== "izinli") return [id];
  }
  return [l[sira]];
};

/** Temel görevin (planın) o günkü sorumluları; Next Day ekranındaki "Bugünün sorumlusu". */
export const temelSorumlular = (d: Durum, t: TemelGorev, tarih: string) => {
  const g = gorevListesi(d).find((x) => x.tur === "temel" && x.temel === t && !x.pasif);
  return g ? sorumlular(d, g, tarih) : [];
};

/** Kişinin o günkü görevleri: önce temel, sonra yan görevler. */
export const kisininGorevleri = (d: Durum, kisiId: string, tarih: string) =>
  gorevListesi(d)
    .filter((g) => !g.pasif && sorumlular(d, g, tarih).includes(kisiId))
    .sort((a, b) => (a.tur === b.tur ? 0 : a.tur === "temel" ? -1 : 1));

/** Kişinin açık işleri (bitmemiş), son tarihe göre. */
export const kisininIsleri = (d: Durum, kisiId: string) =>
  isListesi(d)
    .filter((x) => x.durum !== "bitti" && x.kisiler.includes(kisiId))
    .sort((a, b) => (a.sonTarih ?? "9").localeCompare(b.sonTarih ?? "9"));

/** Görevlerde ve işlerde geçen bütün etiketler (süzgeç ve öneri için). */
export const etiketler = (d: Durum) => [...new Set([...gorevListesi(d).flatMap((g) => g.etiketler), ...isListesi(d).flatMap((x) => x.etiketler)])].sort((a, b) => a.localeCompare(b));

/** "a, b ; c" → temiz etiket listesi. */
export const etiketAyir = (metin: string) => [...new Set(metin.split(/[,;،]/).map((x) => x.trim()).filter(Boolean))];
