import { EKIP_GOREV_ADI } from "./etiketler";
import { metin, yaz, type Anahtar } from "./dil";
import { zipAc } from "./iceAktar";
import { EKIP_GOREVLERI, type Durum, type EkipGorevi } from "./veri";

/**
 * Geçmiş bir Next Day planını (kurumun الأجندة الإخبارية belgesi ya da
 * Plannersflow'un Word çıktısı) bugünün taslağına almak.
 *
 * Belge kurumun bölüm sırasını izliyor; satırlar bölüm başlığına göre
 * ayrılıyor: çalışma ekibi ("görev: ad 04G | ad 06G"), canlı yayınlar,
 * haber gelişmeleri (başlık, "ŞEHİR / gelişme", muhabirler) ve takipler.
 * Muhabir hareketleri ve paketler alınmıyor: hareket o günün gerçek kaydı,
 * paket önerisi şablonda da taşınmıyor. Kişiler kayıttaki Arapça adla
 * eşleşiyor; eşleşmeyen ad atlanıp önizlemede gösteriliyor.
 *
 * Saf: dosyayı satırlara çeviren okuyucu ve satırları taslağa çeviren
 * ayrıştırıcı; plana yazan eylemler.ts → planIceAktar.
 */

/* --- Dosya → satırlar --- */

export class DesteklenmeyenDosya extends Error {}

const xmlMetni = (s: string) => {
  const belge = new DOMParser().parseFromString(s, "application/xml");
  return [...belge.getElementsByTagName("w:p")].map((p) => {
    let metin = "";
    for (const x of p.getElementsByTagName("*")) {
      if (x.tagName === "w:t") metin += x.textContent ?? "";
      else if (x.tagName === "w:tab") metin += " ";
    }
    return metin;
  });
};

/* Yaprak blok öğeleri: başlık, paragraf, liste, hücre; iç içe olanın yalnız en içi. */
const htmlMetni = (s: string) => {
  const belge = new DOMParser().parseFromString(s, "text/html");
  const BLOK = "h1,h2,h3,h4,h5,h6,p,li,td,th,div";
  return [...belge.body.querySelectorAll(BLOK)].filter((x) => !x.querySelector(BLOK)).map((x) => x.textContent ?? "");
};

export const belgeSatirlari = async (dosya: File): Promise<string[]> => {
  const veri = await dosya.arrayBuffer();
  const b = new Uint8Array(veri.slice(0, 4));
  let satirlar: string[];
  if (b[0] === 0x50 && b[1] === 0x4b) {
    // .docx: zip içinde word/document.xml
    const zip = await zipAc(veri);
    const belge = zip.get("word/document.xml");
    if (!belge) throw new DesteklenmeyenDosya();
    satirlar = xmlMetni(await belge());
  } else if (b[0] === 0xd0 && b[1] === 0xcf) {
    // Eski ikili Word (.doc 97–2003): tarayıcıda okunmuyor; .docx olarak kaydedilmeli.
    throw new DesteklenmeyenDosya();
  } else {
    const yazi = new TextDecoder().decode(veri);
    satirlar = /<(html|body|p|div|h\d)[\s>]/i.test(yazi) ? htmlMetni(yazi) : yazi.split(/\r?\n/);
  }
  return satirlar.map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
};

/* --- Satırlar → taslak --- */

export interface AktarilanKisi {
  kisiId: string;
  yer?: string;
  saat?: string;
}
export interface PlanTaslagi {
  ekip: { kisiId: string; gorev: EkipGorevi; vardiya: string }[];
  canlilar: { yer: string; konu: string; aciklama: string; saatGmt: string; muhabirId?: string }[];
  basliklar: { ad: string; gelismeler: { yer?: string; metin: string }[]; muhabirler: AktarilanKisi[] }[];
  takipler: { yer?: string; metin: string }[];
  /** Kayıtta bulunamayan adlar. */
  bulunamayan: string[];
}

/* Harekeler, tatvil ve elif/te-marbuta/ye yazım farkları eşleşmeyi bozmasın. */
export const arSade = (s: string) =>
  s
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[:：]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

type Bolum = "ekip" | "hareket" | "canli" | "hazir" | "beklenen" | "olaylar" | "takip" | "kapak";
const BOLUMLER: [Bolum, Anahtar[]][] = [
  ["kapak", ["ciktiBaslik"]],
  ["ekip", ["calismaEkibi"]],
  ["hareket", ["muhabirHareketleri"]],
  ["canli", ["canliYayinlar", "ciktiCanli"]],
  ["hazir", ["hazirPaketler", "ciktiHazir"]],
  ["beklenen", ["ciktiBeklenen"]],
  ["olaylar", ["haberGundemi", "ciktiOlaylar"]],
  ["takip", ["takipler"]],
];

const bolumBul = (satir: string): Bolum | null => {
  if (satir.includes("/")) return null;
  const s = arSade(satir);
  for (const [b, anahtarlar] of BOLUMLER)
    for (const a of anahtarlar) {
      const ad = arSade(metin(a, "ar"));
      // Kısa bölüm adı ("مباشر") ancak tek başına bölüm; yoksa "مباشر من غزة" başlığı bölüm sanılır.
      if (s === ad || (ad.length >= 10 && s.startsWith(ad) && s.length <= ad.length + 25)) return b;
    }
  return null;
};

/** "06G", "1145G", "TBC" → "06:00", "11:45", "" */
export const saatOku = (s: string) => {
  const m = s.trim().match(/^(\d{1,2})(\d{2})?\s*G(MT)?$/i);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2] ?? "00"}`;
};

/* "ŞEHİR / geri kalanı": ilk eğik çizgiden bölünüyor (metinde başka çizgi olabilir). */
const yerAyir = (s: string) => {
  const i = s.indexOf("/");
  return i < 0 ? { metin: s.trim() } : { yer: s.slice(0, i).trim() || undefined, metin: s.slice(i + 1).trim() };
};

export const planTaslagi = (satirlar: string[], d: Durum): PlanTaslagi => {
  const kisiler = new Map<string, string>();
  for (const k of d.kisiler) {
    if (k.pasif) continue;
    for (const ad of [yaz(k.ad, "ar"), yaz(k.ad, "tr"), yaz(k.ad, "en")]) if (ad) kisiler.set(arSade(ad), k.id);
  }
  const t: PlanTaslagi = { ekip: [], canlilar: [], basliklar: [], takipler: [], bulunamayan: [] };
  const bulunamadi = (ad: string) => !t.bulunamayan.includes(ad) && t.bulunamayan.push(ad);
  /* "Ad 06G" → kişi ve saat */
  const kisiOku = (s: string) => {
    const m = s.trim().match(/^(.*?)\s*(\d{1,4}\s*G)?$/i);
    const ad = (m?.[1] ?? s).trim();
    const kisiId = kisiler.get(arSade(ad));
    if (!kisiId && ad) bulunamadi(ad);
    return { kisiId, saat: m?.[2] ? saatOku(m[2]) : "" };
  };
  const gorevler = EKIP_GOREVLERI.map((g) => [arSade(metin(EKIP_GOREV_ADI[g], "ar")), g] as const);
  const muhabirBasligi = new Set([arSade(metin("ciktiMuhabirler", "ar")), arSade(metin("ciktiMuhabir", "ar"))]);

  let bolum: Bolum | null = null;
  let alt: "gelisme" | "muhabir" | "paket" = "gelisme";
  for (const satir of satirlar) {
    const yeni = bolumBul(satir);
    if (yeni) {
      bolum = yeni;
      alt = "gelisme";
      continue;
    }
    if (bolum === "ekip") {
      const i = satir.indexOf(":");
      if (i < 0) continue;
      const rol = arSade(satir.slice(0, i));
      const gorev = gorevler.find(([ad]) => ad === rol)?.[1] ?? "diger";
      for (const parca of satir.slice(i + 1).split("|")) {
        const { kisiId, saat } = kisiOku(parca);
        if (kisiId && !t.ekip.some((e) => e.kisiId === kisiId)) t.ekip.push({ kisiId, gorev, vardiya: saat });
      }
    } else if (bolum === "canli") {
      // "YER / konu · açıklama / 07G / muhabir"
      const p = satir.split("/").map((x) => x.trim());
      if (p.length < 2) continue;
      const [konu, ...aciklama] = p[1].split(" · ");
      const saatGmt = p[2] ? saatOku(p[2]) : "";
      const ad = p.slice(saatGmt || /^TBC$/i.test(p[2] ?? "") ? 3 : 2).join(" / ");
      const muhabirId = ad ? kisiOku(ad).kisiId : undefined;
      t.canlilar.push({ yer: p[0], konu, aciklama: aciklama.join(" · "), saatGmt, muhabirId });
    } else if (bolum === "olaylar") {
      const s = arSade(satir);
      if (muhabirBasligi.has(s)) {
        alt = "muhabir";
        continue;
      }
      if (/^pkg$/i.test(s)) {
        alt = "paket";
        continue;
      }
      if (!satir.includes("/")) {
        t.basliklar.push({ ad: satir, gelismeler: [], muhabirler: [] });
        alt = "gelisme";
        continue;
      }
      const b = t.basliklar.at(-1);
      if (!b || alt === "paket") continue;
      const { yer, metin: m } = yerAyir(satir);
      if (alt === "muhabir") {
        const { kisiId, saat } = kisiOku(m);
        if (kisiId && !b.muhabirler.some((x) => x.kisiId === kisiId)) b.muhabirler.push({ kisiId, yer, saat: saat || undefined });
      } else if (m) b.gelismeler.push({ yer, metin: m });
    } else if (bolum === "takip") {
      const g = yerAyir(satir);
      if (g.metin) t.takipler.push(g);
    }
  }
  t.basliklar = t.basliklar.filter((b) => b.gelismeler.length || b.muhabirler.length);
  return t;
};

export const taslakBosMu = (t: PlanTaslagi) => !t.ekip.length && !t.canlilar.length && !t.basliklar.length && !t.takipler.length;
