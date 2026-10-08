import type { Durum } from "../veri";

/**
 * Gerçek kipte kayıt Firestore'da kayıt kayıt duruyor: `Durum`'un her dizi
 * alanı bir koleksiyon, her öğe bir belge; kişiye bağlı haritalarda her
 * anahtar bir belge. Eylemler bugünkü gibi bütün `Durum`'u değiştirip
 * `kaydet`'e veriyor; buradaki saf fonksiyon eski ile yeni arasındaki farkı
 * çıkarıyor ve yalnız değişen belgeler yazılıyor. Böylece iki kişinin
 * farklı kayıtlardaki işi birbirini ezmiyor; çakışma yalnız aynı kayıtta
 * olur, son yazan kazanır.
 *
 * Eylemler değişmeyen öğenin nesnesine dokunmuyor (yeni dizi, aynı öğe);
 * değişiklik bu yüzden önce nesne kimliğiyle anlaşılıyor.
 */

export const DIZI_ALANLARI = [
  "kisiler",
  "basliklar",
  "planlar",
  "gelismeler",
  "canliYayinlar",
  "gorevlendirmeler",
  "oneriler",
  "cagrilar",
  "yanitlar",
  "paketler",
  "haftalik",
  "aylik",
  "ozel",
  "toplantilar",
  "faaliyetler",
  "dosyalar",
  "hareketler",
] as const satisfies readonly (keyof Durum)[];
export type DiziAlani = (typeof DIZI_ALANLARI)[number];

export const HARITA_ALANLARI = ["okundu", "anaSayfa", "oneriGorunumu", "ortamlar", "kisayollar"] as const satisfies readonly (keyof Durum)[];
export type HaritaAlani = (typeof HARITA_ALANLARI)[number];

/** Tekil değerler (paket kodu sayacı) tek belgede. */
export const GENEL = { koleksiyon: "ayar", id: "genel" } as const;

/** Belgedeki öğe: sıra ve JSON. Firestore iç içe diziyi ve `undefined`'ı saklamıyor; JSON ikisini de taşıyor. */
export interface OgeBelgesi {
  s: number;
  j: string;
  /* Kurallar kişi kaydında bunları okuyor (firestore.rules). */
  eposta?: string;
  pasif?: boolean;
  hesapYoneticisi?: boolean;
}

export type Islem =
  | { tur: "yaz"; koleksiyon: string; id: string; veri: Record<string, unknown> }
  | { tur: "sil"; koleksiyon: string; id: string };

/** Alan → öğe kimliği → sıra. Dizideki sıra ekrandaki sıra; belgelere sıra alanıyla taşınıyor. */
export type Siralar = Record<string, Map<string, number>>;

/* İki komşu sıra bu kadar yaklaşınca dizi baştan numaralanıyor (bütün belgeler bir kez yazılır). */
const EN_KUCUK_ARALIK = 1e-6;

/**
 * Yeni dizinin sıraları. Yerini koruyan öğeler eski sırasını alıyor
 * (en uzun artan alt dizi); yeni ya da taşınan öğeler komşularının arasına
 * giriyor. Başa eklenen hareket ya da sona eklenen plan yalnız kendi
 * belgesini yazdırıyor, bütün diziyi değil.
 */
export function sirala(eski: Map<string, number>, idler: string[]): Map<string, number> {
  const n = idler.length;
  const degerler = idler.map((id) => eski.get(id));
  // En uzun artan alt dizi (sabit kalanlar), O(n log n).
  const uclar: number[] = [];
  const onceki = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const d = degerler[i];
    if (d === undefined) continue;
    let alt = 0;
    let ust = uclar.length;
    while (alt < ust) {
      const orta = (alt + ust) >> 1;
      if ((degerler[uclar[orta]] as number) < d) alt = orta + 1;
      else ust = orta;
    }
    if (alt > 0) onceki[i] = uclar[alt - 1];
    uclar[alt] = i;
  }
  const sabit = new Set<number>();
  for (let i = uclar.length ? uclar[uclar.length - 1] : -1; i >= 0; i = onceki[i]) sabit.add(i);

  const sonuc = new Array<number>(n);
  let i = 0;
  while (i < n) {
    if (sabit.has(i)) {
      sonuc[i] = degerler[i] as number;
      i++;
      continue;
    }
    // Sabitler arasındaki boşluğu eşit aralıklarla doldur.
    let j = i;
    while (j < n && !sabit.has(j)) j++;
    const sol = i > 0 ? sonuc[i - 1] : undefined;
    const sag = j < n ? (degerler[j] as number) : undefined;
    const adet = j - i;
    for (let k = 0; k < adet; k++) {
      sonuc[i + k] =
        sol !== undefined && sag !== undefined ? sol + ((sag - sol) * (k + 1)) / (adet + 1) : sol !== undefined ? sol + k + 1 : sag !== undefined ? sag - (adet - k) : k;
    }
    i = j;
  }
  for (let k = 1; k < n; k++) if (!(sonuc[k] - sonuc[k - 1] > EN_KUCUK_ARALIK)) return new Map(idler.map((id, x) => [id, x]));
  return new Map(idler.map((id, x) => [id, sonuc[x]]));
}

type Oge = { id: string };

/** Kişi kaydına kuralların okuduğu düz alanlar eklenir. */
export const ogeBelgesi = (alan: string, oge: Oge, s: number): OgeBelgesi => {
  const b: OgeBelgesi = { s, j: JSON.stringify(oge) };
  if (alan === "kisiler") {
    const k = oge as Oge & { eposta?: string; pasif?: boolean; hesapYoneticisi?: boolean };
    b.eposta = (k.eposta ?? "").toLowerCase();
    b.pasif = !!k.pasif;
    b.hesapYoneticisi = !!k.hesapYoneticisi;
  }
  return b;
};

/* Firestore belge kimliğinde "/" olamıyor; harita anahtarları kişi kimliği, yine de korunsun. */
export const belgeKimligi = (anahtar: string) => anahtar.replace(/\//g, "%2F");
export const anahtarKimligi = (id: string) => id.replace(/%2F/g, "/");

/**
 * Eski ve yeni `Durum` arasındaki yazılacak belgeler. Sıralar yeni
 * durumunkiyle döner; bir sonraki farkın temeli o.
 */
export function farkCikar(eski: Durum, yeni: Durum, siralar: Siralar): { islemler: Islem[]; siralar: Siralar } {
  const islemler: Islem[] = [];
  const yeniSiralar: Siralar = { ...siralar };

  for (const alan of DIZI_ALANLARI) {
    const a = (eski[alan] ?? []) as Oge[];
    const b = (yeni[alan] ?? []) as Oge[];
    const eskiSira = siralar[alan] ?? new Map<string, number>();
    if (a === b && eskiSira.size === b.length) continue;
    const eskiOge = new Map(a.map((o) => [o.id, o]));
    const idler = b.map((o) => o.id);
    const sira = sirala(eskiSira, idler);
    yeniSiralar[alan] = sira;
    for (const o of b) {
      const s = sira.get(o.id) as number;
      if (eskiOge.get(o.id) === o && eskiSira.get(o.id) === s) continue;
      islemler.push({ tur: "yaz", koleksiyon: alan, id: belgeKimligi(o.id), veri: { ...ogeBelgesi(alan, o, s) } });
    }
    const kalan = new Set(idler);
    for (const o of a) if (!kalan.has(o.id)) islemler.push({ tur: "sil", koleksiyon: alan, id: belgeKimligi(o.id) });
  }

  for (const alan of HARITA_ALANLARI) {
    const a = (eski[alan] ?? {}) as Record<string, unknown>;
    const b = (yeni[alan] ?? {}) as Record<string, unknown>;
    if (a === b) continue;
    for (const [k, v] of Object.entries(b)) if (a[k] !== v) islemler.push({ tur: "yaz", koleksiyon: alan, id: belgeKimligi(k), veri: { j: JSON.stringify(v) } });
    for (const k of Object.keys(a)) if (!(k in b)) islemler.push({ tur: "sil", koleksiyon: alan, id: belgeKimligi(k) });
  }

  if (eski.sayac !== yeni.sayac) islemler.push({ tur: "yaz", koleksiyon: GENEL.koleksiyon, id: GENEL.id, veri: { sayac: yeni.sayac } });

  return { islemler, siralar: yeniSiralar };
}
