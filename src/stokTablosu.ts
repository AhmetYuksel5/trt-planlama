import { stokDurumu } from "./akis";
import { metin } from "./dil";
import { TUR_ADI, kisiAr, sehirAr, sehirUlkesi, ulkeAdi } from "./etiketler";
import { masaEtiketi } from "./masaEtiketi";
import { oneriHaftada } from "./oneriPlanlari";
import { stokTeklifiMi } from "./stokSayfasi";
import { gunEkle } from "./tarih";
import { kisiBul, type Durum, type HaftalikKalem, type HaftalikPlan, type Oneri, type Paket } from "./veri";

/*
 * Rapor önerileri tablosu (kullanıcı: stok haberlerin sistemi kurumun Google
 * tablosu gibi, sanki Excel dosyasıymış gibi; aynı biçimde çıktı; haftalık için
 * gelen öneriler tabloya doğrudan düşsün). Saklanmaz: haftanın önerileri, Weekly
 * kalemleri ve doğan paketlerden her an kurulur; ikinci bir kayıt yok. Satır
 * tablodan düşmez, durumu ilerler (kurumun tablosunda da satır silinmiyordu).
 * Sütunlar kurumun tablosunun sırasıyla; ekran ekranlar/StokTablosu.tsx.
 */

export type TabloDurumu =
  | "yeni"
  | "duzeltme"
  | "baskasinda"
  | "gundemde"
  | "kabul"
  | "sartli"
  | "bilgi"
  | "nextday"
  | "planda"
  | "ret"
  | "alinacak"
  | "uretimde"
  | "stokta"
  | "yayinlandi";

export interface TabloSatiri {
  /** "o-<öneri>" ya da öneriden gelmeyen kalemde "k-<kalem>". */
  id: string;
  oneri?: Oneri;
  kalem?: HaftalikKalem;
  /** Kalemin durduğu Weekly (satırın düzeltmesi ve kararı onun); teslimi başka haftaya düşen kalem de olur. */
  haftaId?: string;
  paket?: Paket;
  muhabirId?: string;
  /* Sütunların metni, kurumun tablosundaki gibi her arayüz dilinde Arapça. */
  muhabir: string;
  ulke: string;
  strap: string;
  jiha: string;
  isleme: string;
  gorsel: string;
  /** YYYY-MM-DD; çıktıda 05.12.2026. */
  teslim?: string;
  masraf: string;
  durum: TabloDurumu;
  /** Kaldırılan ya da reddedilen: tabloda soluk ve çizili, çıktıya girmez. */
  dusuk: boolean;
}

/** Kurumun tablosundaki biçim: 05.12.2026. */
export const tabloTarihi = (g?: string) => (g ? g.split("-").reverse().join(".") : "");

/* Öneri tabloya aday: stok ve programlar teklifi; muhabire giden teklif, geri çekilen, takip ve kopya değil. Haftası aşağıda, tarihten. */
const tablodaMi = (o: Oneri, hepsi: boolean) =>
  (hepsi || stokTeklifiMi(o)) &&
  o.yon !== "muhabire" &&
  o.durum !== "teklif" &&
  o.durum !== "geriCekildi" &&
  o.durum !== "takip" &&
  !o.kopyaKaynagi;

const durumBul = (d: Durum, o: Oneri | undefined, k: HaftalikKalem | undefined, p: Paket | undefined): TabloDurumu => {
  if (p && p.durum !== "iptal") {
    const s = stokDurumu(p);
    if (s === "yayinlandi") return "yayinlandi";
    if (s === "stokta") return "stokta";
    if (s === "uretimde") return "uretimde";
    if (s === "bekliyor") return "alinacak";
    // Stok dışı (masa) paket: onaylıysa kabul, üretimdeyse üretimde.
    if (p.durum === "uretimde") return "uretimde";
    if (p.durum === "tamamlandi") return "stokta";
  }
  if (k) return k.karar === "bekliyor" ? "gundemde" : k.karar;
  if (o?.durum === "reddedildi") return "ret";
  if (o?.durum === "planaEklendi") return "planda";
  if (o?.durum === "duzeltme") return "duzeltme";
  if (o && (d.masaSorulari ?? []).some((s) => s.oneriId === o.id && !s.cevap)) return "baskasinda";
  return "yeni";
};

const masrafMetni = (o?: Oneri, p?: Paket) => {
  if (o?.ekMasraf) return o.ekMasraf;
  const m = p?.masraflar ?? [];
  if (!m.length) return "";
  const toplam = new Map<string, number>();
  for (const x of m) toplam.set(x.para, (toplam.get(x.para) ?? 0) + x.tutar);
  return [...toplam].map(([para, n]) => `${para} ${n}`).join(" · ");
};

const ulkeMetni = (d: Durum, o: Oneri | undefined, k: HaftalikKalem | undefined, muhabirId?: string) => {
  if (k?.yer?.trim()) return k.yer.trim();
  const kisi = kisiBul(d, muhabirId);
  const u = o?.ulke ?? (kisi ? sehirUlkesi(kisi.sehir, d) : undefined);
  if (!u) return "";
  const ulke = metin(ulkeAdi(u), "ar");
  // Muhabir o ülkedeyse şehri de (kurumun tablosunda "العراق - بغداد").
  return kisi && sehirUlkesi(kisi.sehir, d) === u ? `${ulke} - ${sehirAr(kisi.sehir)}` : ulke;
};

/* Önerilen yayın yeri: masanın Arapça adı (kolu, sorusu, önerisi), yoksa haber merkezi. */
const jihaMetni = (d: Durum, o: Oneri | undefined, k: HaftalikKalem | undefined) => {
  const program = o?.programId ? (d.programlar ?? []).find((p) => p.id === o.programId) : undefined;
  if (program) return program.ad;
  const tur = k?.tur ?? o?.tur ?? "haber";
  const masa = masaEtiketi(d, tur, o?.id ?? k?.oneriId);
  if (masa) return masa;
  return tur === "haber" ? "الأخبار" : metin(TUR_ADI[tur], "ar");
};

const satirKur = (d: Durum, o: Oneri | undefined, k: HaftalikKalem | undefined, haftaId?: string): TabloSatiri => {
  const pid = k?.aktarim?.paketId ?? o?.paketId;
  const p = pid ? d.paketler.find((x) => x.id === pid) : undefined;
  const muhabirId = k?.muhabirler[0] ?? o?.muhabirId ?? p?.muhabirId;
  const durum = durumBul(d, o, k, p);
  return {
    id: o ? `o-${o.id}` : `k-${k!.id}`,
    oneri: o,
    kalem: k,
    haftaId: k ? haftaId : undefined,
    paket: p,
    muhabirId,
    muhabir: muhabirId ? kisiAr(kisiBul(d, muhabirId)) : k?.muhabirTbc ? "TBC" : (o?.kaynakAdi ?? ""),
    ulke: ulkeMetni(d, o, k, muhabirId),
    // Kalem doğduktan sonra kalemin metni geçerli (Weekly ile tablo ayrışmasın).
    strap: (k?.paketBasligi || o?.paketBasligi || o?.haberBasligi || k?.metin || "").trim(),
    jiha: jihaMetni(d, o, k),
    isleme: (o?.islemeFikri || o?.gelisme || (o ? "" : k?.metin) || "").trim(),
    gorsel: (o?.gorselIsleme ?? "").trim(),
    teslim: (p && p.durum !== "iptal" ? p.sonTarih : undefined) ?? k?.teslimGunu ?? k?.tarih ?? o?.teslimTahmini ?? o?.hedefTarih,
    masraf: masrafMetni(o, p),
    durum,
    dusuk: durum === "ret",
  };
};

/*
 * Haftanın satırları (kullanıcı: tarih olarak o haftalık dilime giren işler
 * girsin, yalnız onlar): teslim günü (doğmuş paketin, kalemin, önerinin
 * tahmini; yoksa günü) haftanın içindeyse satır o haftanın, öneri başka haftaya
 * gönderilmiş olsa da. Tarihi hiç olmayan satır önerinin (ya da kalemin)
 * haftasında kalır, kaybolmasın. Muhabire göre gruplu (kurumun tablosunda her
 * muhabirin satırları bir arada, aynı tonda): grup sırası muhabirin Arapça adı,
 * muhabirsiz sonda; grup içinde teslim günü.
 */
export const tabloSatirlari = (d: Durum, hafta: string, hepsi = false): TabloSatiri[] => {
  const son = gunEkle(hafta, 6);
  const icinde = (g?: string) => !!g && g >= hafta && g <= son;
  // Önerinin kalemi hangi Weekly'de olursa olsun (teslimi başka haftaya düşebilir).
  const kalemi = new Map<string, { k: HaftalikKalem; h: HaftalikPlan }>();
  for (const h of d.haftalik) for (const k of h.kalemler) if (k.oneriId && !kalemi.has(k.oneriId)) kalemi.set(k.oneriId, { k, h });
  const satirlar: TabloSatiri[] = [];
  const goruldu = new Set<string>();
  for (const o of d.oneriler) {
    if (!tablodaMi(o, true)) continue;
    const bag = kalemi.get(o.id);
    if (!hepsi && !stokTeklifiMi(o) && !(bag && !bag.k.tarih)) continue;
    const s = satirKur(d, o, bag?.k, bag?.h.id);
    if (bag) goruldu.add(bag.k.id);
    if (s.teslim ? icinde(s.teslim) : oneriHaftada(o, { baslangic: hafta }) || bag?.h.baslangic === hafta) satirlar.push(s);
  }
  // Öneriden gelmeyen (Planlama'nın elle eklediği) kalem kendi satırı.
  for (const h of d.haftalik)
    for (const k of h.kalemler) {
      if (goruldu.has(k.id) || (k.oneriId && d.oneriler.some((o) => o.id === k.oneriId))) continue;
      if (!hepsi && k.tarih) continue;
      const s = satirKur(d, undefined, k, h.id);
      if (s.teslim ? icinde(s.teslim) : h.baslangic === hafta) satirlar.push(s);
    }
  return satirlar.sort(
    (a, b) =>
      Number(!a.muhabir) - Number(!b.muhabir) ||
      a.muhabir.localeCompare(b.muhabir, "ar") ||
      (a.teslim ?? "9").localeCompare(b.teslim ?? "9") ||
      a.strap.localeCompare(b.strap, "ar"),
  );
};

/** Satırın grup tonu (0–3): muhabir değiştikçe sırayla; aynı muhabirin satırları aynı ton. */
export const grupTonlari = (satirlar: TabloSatiri[]): number[] => {
  let ton = -1;
  let onceki: string | undefined = "\u0000";
  return satirlar.map((s) => {
    const anahtar = s.muhabirId ?? s.muhabir;
    if (anahtar !== onceki) {
      ton = (ton + 1) % 4;
      onceki = anahtar;
    }
    return ton;
  });
};

/** Grubun ilk satırı mı: muhabirin adı yalnız orada yazılır. */
export const grupBasiMi = (satirlar: TabloSatiri[], i: number) =>
  i === 0 || (satirlar[i].muhabirId ?? satirlar[i].muhabir) !== (satirlar[i - 1].muhabirId ?? satirlar[i - 1].muhabir);

/** Çıktıya giren satırlar: kaldırılan ve reddedilen girmez. */
export const ciktiSatirlari = (satirlar: TabloSatiri[]) => satirlar.filter((s) => !s.dusuk);

/* Kurumun tablosunun sütunları, sağdan sola sırasıyla; başlıklar her dilde Arapça. */
export const TABLO_SUTUNLARI = [
  ["n", "ن"],
  ["muhabir", "اسم المراسل"],
  ["ulke", "الدولة"],
  ["strap", "عنوان التقرير"],
  ["jiha", "جهة العرض المقترحة"],
  ["isleme", "زاوية المعالجة ومحاور التقرير"],
  ["gorsel", "المعادل البصري أو الخطة التصويرية"],
  ["teslim", "مدة التسليم المتوقعة"],
  ["masraf", "تكاليف إضافية"],
] as const;
export type TabloSutunu = (typeof TABLO_SUTUNLARI)[number][0];

const AYLAR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

/* Bandın başlığı, kurumunki gibi: "مقترحات تقارير 28 نوفمبر - 04 ديسمبر 2026". */
export const tabloBasligi = (hafta: string, son: string) => {
  const [y1, a1, g1] = hafta.split("-");
  const [y2, a2, g2] = son.split("-");
  const bas = a1 === a2 ? g1 : `${g1} ${AYLAR[+a1 - 1]}${y1 !== y2 ? ` ${y1}` : ""}`;
  return `مقترحات تقارير ${bas} - ${g2} ${AYLAR[+a2 - 1]} ${y2}`;
};

/** Hücrenin çıktıdaki metni (sıra no dışarıdan). */
export const hucreMetni = (s: TabloSatiri, c: TabloSutunu, n: number): string =>
  c === "n" ? String(n) : c === "teslim" ? tabloTarihi(s.teslim) : s[c];
