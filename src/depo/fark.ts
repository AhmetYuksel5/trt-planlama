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
  "mesajlar",
  "takipler",
  "geriBildirimSablonlari",
  "yzGorusleri",
  "sehirler",
  "gorevler",
  "isler",
  "bahsetmeler",
  "yapilar",
] as const satisfies readonly (keyof Durum)[];
export type DiziAlani = (typeof DIZI_ALANLARI)[number];

/*
 * Fark okunan koleksiyonlar: belgede sunucu zamanı (`z`) var, silinen belge
 * kalkmıyor, "silindi" işaretiyle yazılıyor. Bir cihazda bir kez tam
 * okunduktan sonra açılışta yalnız değişenler okunuyor (depo/firebase.ts);
 * ücretsiz planda günlük okuma sınırı her açılışta bütün kaydı okumakla
 * doluyordu. Kişiler hariç: kuralı yazılabilecek alanları tek tek sayıyor
 * (`z` onu bozardı), hem de küçük.
 */
export const farkAlaniMi = (alan: string) => alan !== "kisiler" && (DIZI_ALANLARI as readonly string[]).includes(alan);

/*
 * Kısıtlı kişi (dış muhabir; yönetici onayı bekleyen kayıt): Firestore
 * kuralları ona yalnız erişim listesinde (`m`) adı geçen belgeyi veriyor,
 * tarayıcısı da yalnız onları istiyor (depo/firebase.ts). Muhabir yalnız
 * kendi işini görsün diye; ekrandaki süzme tek başına yetmiyordu, kayıt
 * tarayıcıya bütünüyle iniyordu.
 *
 * Kural kişiyi kayıt metninden (j) tanıyor, aynı desenle: JSON'da başka
 * yerde aynı dizi geçemez (metin içindeki tırnak kaçışlı yazılıyor).
 */
const KISITLI_DESENLERI = [/"birim":"muhabir"[,}]/, /"kontrolBekliyor":true[,}]/];
export const kisitliJson = (j: string) => KISITLI_DESENLERI.some((d) => d.test(j));

/** Kısıtlı kişinin okuyabildiği koleksiyonlar (kendi belgeleri; kişiler ve yapı ayrıca). */
export const KISITLI_OKUR = ["oneriler", "paketler", "takipler", "gorevlendirmeler", "faaliyetler", "mesajlar", "yanitlar", "cagrilar", "hareketler", "bahsetmeler"] as const;

type Kayit = { id: string; muhabirId?: string; kisiId?: string; yazanId?: string; oneriId?: string; paketId?: string; bcc?: string[]; veri?: Record<string, string>; tur?: string; tarih?: string };
const bul = (d: Durum, alan: keyof Durum, id?: string) => (id ? ((d[alan] ?? []) as unknown as Kayit[]).find((x) => x.id === id) : undefined);

/**
 * Belgeyi görebilecek kişiler: muhabirin kendi işi ve ona bağlı olanlar
 * (önerisinin mesajı, paketinin hareketi, alıcısı olduğu çağrı). Listede
 * personel de olabilir; kural listeye yalnız kısıtlı kişide bakıyor.
 */
export const erisimListesi = (alan: string, oge: Oge, d: Durum): string[] => {
  const o = oge as Kayit;
  const oneriMuhabiri = (id?: string) => bul(d, "oneriler", id)?.muhabirId;
  const paketMuhabirleri = (id?: string) => {
    const p = bul(d, "paketler", id);
    return p ? [p.muhabirId, oneriMuhabiri(p.oneriId)] : [];
  };
  let l: (string | undefined)[] = [];
  if (alan === "oneriler" || alan === "takipler" || alan === "faaliyetler") l = [o.muhabirId];
  else if (alan === "paketler") l = [o.muhabirId, oneriMuhabiri(o.oneriId)];
  else if (alan === "gorevlendirmeler" || alan === "yanitlar") l = [o.kisiId];
  // Notta anma: anılan ve yazan (muhabir planlamacıyı da anabiliyor).
  else if (alan === "bahsetmeler") l = [o.kisiId, o.yazanId];
  else if (alan === "mesajlar") l = [oneriMuhabiri(o.oneriId)];
  else if (alan === "cagrilar") l = [...(o.bcc ?? [])];
  else if (alan === "hareketler") {
    const v = o.veri ?? {};
    // Çağrı hareketi çağrıyı tarih ve türle buluyor (yetki.ts → muhabirBildirimi).
    const cagri = (oge as { tip?: string }).tip === "cagriHazirlandi" ? ((d.cagrilar ?? []) as unknown as Kayit[]).find((c) => c.tarih === v.tarih && (c.tur === "haftalik") === !!v.hafta) : undefined;
    l = [
      o.kisiId,
      ...(v.kime ? v.kime.split(",") : []),
      oneriMuhabiri(o.oneriId),
      ...paketMuhabirleri(o.paketId),
      bul(d, "takipler", v.takipId)?.muhabirId,
      bul(d, "faaliyetler", v.faaliyetId)?.muhabirId,
      ...(cagri?.bcc ?? []),
    ];
  }
  return [...new Set(l.filter((x): x is string => !!x))].sort();
};

export const HARITA_ALANLARI = ["okundu", "anaSayfa", "oneriGorunumu", "ortamlar", "kisayollar", "yapiTaslaklari"] as const satisfies readonly (keyof Durum)[];
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
  kayitKodu?: string;
  hesapsiz?: boolean;
  oncekiKimlik?: string;
  yetkiler?: string[];
  yeniEposta?: string;
  /** Kişide: kural ona yalnız kendi belgelerini veriyor; kısıtlı kişi öbür kısıtlıları göremiyor. */
  kisitli?: boolean;
  /** Erişim listesi: kısıtlı kişilerden bu belgeyi görebilenler. */
  m?: string[];
}

export type Islem =
  | { tur: "yaz"; koleksiyon: string; id: string; veri: Record<string, unknown> }
  // Silinen belgenin erişim listesi "silindi" işaretinde kalıyor: kısıtlı kişi de silindiğini görsün.
  | { tur: "sil"; koleksiyon: string; id: string; m?: string[] };

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

/** Kişi kaydına kuralların okuduğu düz alanlar, kısıtlı kişinin okuduğu koleksiyonda erişim listesi eklenir. */
export const ogeBelgesi = (alan: string, oge: Oge, s: number, d?: Durum): OgeBelgesi => {
  const b: OgeBelgesi = { s, j: JSON.stringify(oge) };
  if (d && (KISITLI_OKUR as readonly string[]).includes(alan)) b.m = erisimListesi(alan, oge, d);
  if (alan === "kisiler") {
    b.kisitli = kisitliJson(b.j);
    const k = oge as Oge & { eposta?: string; pasif?: boolean; hesapYoneticisi?: boolean; kayitKodu?: string; hesapsiz?: boolean; oncekiKimlik?: string; yetkiler?: string[]; yeniEposta?: string };
    b.eposta = (k.eposta ?? "").toLowerCase();
    b.pasif = !!k.pasif;
    b.hesapYoneticisi = !!k.hesapYoneticisi;
    // Kayıt bağlantısıyla gelen kişide kural ilk yazışta bağlantıyı bu alandan buluyor.
    if (k.kayitKodu) b.kayitKodu = k.kayitKodu;
    /*
     * Yalnız doluyken yazılıyor: alanı olmayan eski kişi belgesine başkası
     * yazınca alan "eklenmiş" sayılmasın, kural yetki alanı değişti diye
     * reddetmesin.
     */
    if (k.hesapsiz) b.hesapsiz = true;
    if (k.oncekiKimlik) b.oncekiKimlik = k.oncekiKimlik;
    if (k.yetkiler?.length) b.yetkiler = [...k.yetkiler];
    if (k.yeniEposta) b.yeniEposta = k.yeniEposta.toLowerCase();
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
      islemler.push({ tur: "yaz", koleksiyon: alan, id: belgeKimligi(o.id), veri: { ...ogeBelgesi(alan, o, s, yeni) } });
    }
    const kalan = new Set(idler);
    const erisimli = (KISITLI_OKUR as readonly string[]).includes(alan);
    for (const o of a) if (!kalan.has(o.id)) islemler.push({ tur: "sil", koleksiyon: alan, id: belgeKimligi(o.id), ...(erisimli ? { m: erisimListesi(alan, o, eski) } : {}) });
  }

  for (const alan of HARITA_ALANLARI) {
    const a = (eski[alan] ?? {}) as Record<string, unknown>;
    const b = (yeni[alan] ?? {}) as Record<string, unknown>;
    if (a === b) continue;
    for (const [k, v] of Object.entries(b)) if (a[k] !== v) islemler.push({ tur: "yaz", koleksiyon: alan, id: belgeKimligi(k), veri: { j: JSON.stringify(v) } });
    for (const k of Object.keys(a)) if (!(k in b)) islemler.push({ tur: "sil", koleksiyon: alan, id: belgeKimligi(k) });
  }

  // Genel belge tek parça yazılıyor (set): değişen alan ötekini silmesin diye ikisi birlikte.
  if (eski.sayac !== yeni.sayac || eski.muhabireOneriBirimleri !== yeni.muhabireOneriBirimleri || eski.geriBildirimAyari !== yeni.geriBildirimAyari || eski.newsdeskDevrede !== yeni.newsdeskDevrede)
    islemler.push({
      tur: "yaz",
      koleksiyon: GENEL.koleksiyon,
      id: GENEL.id,
      veri: { sayac: yeni.sayac, ...(yeni.muhabireOneriBirimleri && { muhabireOneriBirimleri: yeni.muhabireOneriBirimleri }), ...(yeni.geriBildirimAyari && { geriBildirimAyari: yeni.geriBildirimAyari }), ...(yeni.newsdeskDevrede && { newsdeskDevrede: true }) },
    });

  return { islemler, siralar: yeniSiralar };
}
