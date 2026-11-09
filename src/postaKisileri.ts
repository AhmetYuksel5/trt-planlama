import { metin, type Dil } from "./dil";
import { imzaBilgisi, imzaSatirlari } from "./eposta";
import { epostaListesiniEslestir, type EpostaAlani } from "./epostaEslestir";
import { BIRIM_ADI, GOREV_ADI } from "./etiketler";
import type { BirimId, GorevId, Kisi, PostaMesaji } from "./veri";
import { disMuhabirMi, grupMu, kisiBirimSecenekleri, unvanListesi, yapi, yerlesikBirim, yerlesikGorev, type Yapi } from "./yapi";

/*
 * Postadan kişiler (Organizasyon › Kişiler; kullanıcı: posta çoğunlukla haber
 * merkezi çalışanlarından geliyor, onları personele eklemek ya da kayıtlı
 * olanların eksiğini tamamlamak istiyor). Kayıtlı postalardaki kurum
 * adresleri (gönderen, Kime, CC) toplanır, kayıtlı kişiyle eşlenir; imzadan
 * ünvan, telefon ve Arapça ad okunur, ünvan ve birim Organizasyon'daki
 * adlarla eşlenip öneri olur. Hiçbiri kendiliğinden yazılmaz: yönetici görüp
 * seçer (eylemler.ts → postaKisileriUygula). Gerçek adresler depoya girmez:
 * burada yalnız kurallar.
 */

export const KURUM_ALANLARI = ["trt.net.tr", "trtarabi.com"];
// Demonun kurgusal adresleri; gerçek kipte yalnız kurumun alanları.
export const DEMO_ALANI = "ornek.local";

// Kişi olmayan otomatik adresler.
const OTOMATIK = /^(?:no-?reply|noreply|do-?not-?reply|postmaster|mailer-daemon|bounce|notification|notifications|alert|alerts)\b/i;

// Birim kutusu gibi duran adres (newsdesk@, planning@): kimsenin grup etiketi
// olmasa da (o birimden kimse posta çekmemişse) kişi değil. Noktalı yerel kısım ad.soyad sayılır.
const GRUP_ADRESI = /^(?:planning|planlama|newsdesk|news|desk|output|input|program|programs|programmes|media|economy|ekonomi|gathering|newsgathering|assignment|assignments|editorial|team|group|info|arabic|haber|haberler|production|producers|scripteditor|script)\d*@/i;

export const kurumAdresiMi = (adres: string, alanlar: string[]) => {
  const alan = adres.split("@")[1]?.toLowerCase() ?? "";
  return alanlar.some((a) => alan === a || alan.endsWith("." + a)) && !OTOMATIK.test(adres) && !GRUP_ADRESI.test(adres);
};

export type PostaKisiDurumu = "yeni" | "eslesti" | "belirsiz" | "kayitli";

export interface PostaKisisi {
  adres: string;
  /** Posta istemcisindeki görünen ad, yoksa adresin yerel kısmından. */
  adLatin: string;
  adAr?: string;
  telefon?: string;
  /** İmzadaki ünvan satırı (kurum adı ayıklanmış). */
  unvanMetni?: string;
  sayi: number;
  son: string;
  durum: PostaKisiDurumu;
  /** Kayıtlı ya da eşleşen kişi. */
  kisiId?: string;
  /** Seçilecekte uyan kişiler, en iyisi önce. */
  adaylar: string[];
  /** Eşleşen kişide adresin yazılacağı alan. */
  alan?: EpostaAlani;
  /** Kayıtlı kişide boş olup postadan dolacak alanlar. */
  eksik: ("eposta" | "telefon")[];
  /** İmzadan tahmin; boşsa yönetici seçer. */
  birim?: BirimId;
  gorev?: GorevId;
}

/* Arapça ve Latin karşılaştırma: hareke, hemze, ta marbuta, Türkçe harfler. */
const norm = (s: string) =>
  s
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const kac = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DILLER: Dil[] = ["tr", "ar", "en"];

const unvanAdlari = (id: GorevId, y: Yapi): string[] => {
  const t = y.unvanlar.find((u) => u.id === id);
  if (t?.ad) return typeof t.ad === "string" ? [t.ad] : DILLER.map((d) => (t.ad as Record<Dil, string>)[d]);
  return yerlesikGorev(id) ? DILLER.map((d) => metin(GOREV_ADI[id as keyof typeof GOREV_ADI], d)) : [];
};
const birimAdlari = (id: BirimId, y: Yapi): string[] => {
  const t = y.birimler.find((b) => b.id === id);
  if (t?.ad) return typeof t.ad === "string" ? [t.ad] : DILLER.map((d) => (t.ad as Record<Dil, string>)[d]);
  return yerlesikBirim(id) ? DILLER.map((d) => metin(BIRIM_ADI[id], d)) : [];
};

/* Metinde geçen en uzun ad: sözcük başında; Arapçada ek alabilir (مذيعة), Latin'de tam sözcük. */
const enUzunUyan = <T extends string>(metinN: string, adaylar: { id: T; adlar: string[] }[]): { id: T; ad: string } | undefined => {
  let en: { id: T; ad: string } | undefined;
  for (const a of adaylar)
    for (const ham of a.adlar) {
      const ad = norm(ham);
      if (ad.length < 3) continue;
      const arapca = /[؀-ۿ]/.test(ad);
      const r = new RegExp(`(?<![\\p{L}\\p{N}])${kac(ad)}${arapca ? "" : "(?![\\p{L}\\p{N}])"}`, "u");
      if (r.test(metinN) && (!en || ad.length > en.ad.length)) en = { id: a.id, ad };
    }
  return en;
};

/*
 * İmzanın metninden birim ve ünvan. Ünvan önce aranır, adı metinden atılır:
 * "Program Editor" Program birimini tutturmasın. Ünvan bulunup birim
 * bulunmazsa ünvanı taşıyan ilk haber merkezi birimi.
 */
export const birimUnvanTahmini = (imzaMetni: string, y: Yapi = yapi()): { birim?: BirimId; gorev?: GorevId } => {
  const metinN = ` ${norm(imzaMetni)} `;
  if (!metinN.trim()) return {};
  const secilebilir = kisiBirimSecenekleri(undefined, y).filter((s) => !s.grup && !disMuhabirMi({ birim: s.id }, y) && !y.birimler.find((b) => b.id === s.id)?.gizli);
  const unvanlar = y.unvanlar.filter((u) => !u.gizli).map((u) => ({ id: u.id, adlar: unvanAdlari(u.id, y) }));
  const u = enUzunUyan(metinN, unvanlar);
  const kalan = u ? metinN.replace(u.ad, " ") : metinN;
  const b = enUzunUyan(kalan, secilebilir.map((s) => ({ id: s.id, adlar: birimAdlari(s.id, y) })));
  if (b) {
    const l = unvanListesi(b.id, undefined, y);
    return { birim: b.id, gorev: u && l.includes(u.id) ? u.id : l[0] };
  }
  if (u) {
    const birim = secilebilir.find((s) => unvanListesi(s.id, undefined, y).includes(u.id))?.id;
    return birim ? { birim, gorev: u.id } : {};
  }
  return {};
};

/* Görünen adla kişinin Latin adının ortak sözcük sayısı. */
const ortakParca = (ad: string, k: Kisi) => {
  const p = (x: string) => norm(x).split(" ").filter((w) => w.length >= 3);
  const kisininki = new Set((typeof k.ad === "string" ? [k.ad] : [k.ad.tr, k.ad.en]).filter(Boolean).flatMap(p));
  return new Set(p(ad).filter((w) => kisininki.has(w))).size;
};

/* "ahmet.yilmaz2" → "Ahmet Yilmaz": görünen ad yoksa. */
const yereldenAd = (adres: string) =>
  adres
    .split("@")[0]
    .replace(/\d+/g, "")
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");

/**
 * Postalardaki kurum adresleri, kişi başına bir satır. `gruplar` grup kutusu
 * adresleri (planning@…): kişi değil. `kurumsalYazilir` kişinin kurumsal
 * adres alanı yazılabilir mi (hesapsız ya da demo; hesabı açık kişinin
 * kurumsal adresi giriş adresi).
 */
export const postaKisileri = (
  mesajlar: PostaMesaji[],
  kisiler: Kisi[],
  o: { alanlar: string[]; gruplar?: string[]; kurumsalYazilir: (k: Kisi) => boolean; y?: Yapi },
): PostaKisisi[] => {
  const y = o.y ?? yapi();
  const gruplar = new Set([...(o.gruplar ?? []), ...mesajlar.map((m) => m.grup ?? "")].map((g) => g.toLowerCase()).filter(Boolean));
  type Toplam = { adres: string; adLatin?: string; sayi: number; son: string; imzalar: { zaman: string; satirlar: string[] }[] };
  const toplam = new Map<string, Toplam>();
  const ekle = (ham: string, zaman: string, ad?: string, imza?: string[]) => {
    const adres = ham.trim().toLowerCase();
    if (!adres.includes("@") || gruplar.has(adres) || !kurumAdresiMi(adres, o.alanlar)) return;
    const t = toplam.get(adres) ?? { adres, sayi: 0, son: "", imzalar: [] };
    t.sayi++;
    if (zaman > t.son) {
      t.son = zaman;
      if (ad?.trim()) t.adLatin = ad.trim();
    } else if (!t.adLatin && ad?.trim()) t.adLatin = ad.trim();
    if (imza?.length) t.imzalar.push({ zaman, satirlar: imza });
    toplam.set(adres, t);
  };
  for (const m of mesajlar) {
    // Gidenin göndereni planlamacının kendisi; imzası alıntıda değil, kendi metninde.
    ekle(m.kimden, m.zaman, m.kimdenAd, imzaSatirlari(m.tamMetin || m.metin, m.kimdenAd ?? ""));
    for (const a of [...(m.kime ?? []), ...(m.cc ?? [])]) ekle(a, m.zaman);
  }
  const satirlar = [...toplam.values()];
  const eslesme = new Map(epostaListesiniEslestir(satirlar.map((s) => s.adres), kisiler, kisiler, o.kurumsalYazilir).map((e) => [e.adres, e]));
  return satirlar
    .map((t): PostaKisisi => {
      // Her alan en yeni imzadan: eski imzadaki ünvan değişmiş olabilir.
      const bilgiler = [...t.imzalar].sort((a, b) => b.zaman.localeCompare(a.zaman)).map((i) => imzaBilgisi(i.satirlar));
      const ilk = <K extends "telefon" | "unvan" | "adAr">(k: K) => bilgiler.find((b) => b[k])?.[k];
      const imzaMetni = bilgiler.find((b) => b.unvan)?.metin ?? bilgiler[0]?.metin ?? "";
      const e = eslesme.get(t.adres);
      const kisi = e?.kisiId ? kisiler.find((k) => k.id === e.kisiId) : undefined;
      const telefon = ilk("telefon");
      const adLatin = t.adLatin && !t.adLatin.includes("@") ? t.adLatin : yereldenAd(t.adres);
      // Adres eşleştirmesi tek sözcükte de "seçilecek" diyor (çağrı listesi için doğru);
      // burada yaygın bir ad (Selim, Ahmed) yeni kişiyi başkasına bağlatmasın: ad ve soyaddan
      // en az ikisi tutmayan aday yalnız öneri, satır yeni.
      const benzer = (e?.adaylar ?? []).filter((id) => {
        const k = kisiler.find((x) => x.id === id);
        return k && ortakParca(adLatin, k) >= 2;
      });
      const durum: PostaKisiDurumu =
        e?.durum === "kayitli" ? "kayitli" : e?.durum === "eslesti" || e?.durum === "dolu" ? "eslesti" : e?.durum === "belirsiz" && benzer.length ? "belirsiz" : "yeni";
      const eksik: PostaKisisi["eksik"] = [];
      if (durum === "eslesti" && e?.alan) eksik.push("eposta");
      if (kisi && !kisi.telefon?.trim() && telefon) eksik.push("telefon");
      const tahmin = birimUnvanTahmini(imzaMetni, y);
      return {
        adres: t.adres,
        adLatin,
        ...(ilk("adAr") ? { adAr: ilk("adAr") } : {}),
        ...(telefon ? { telefon } : {}),
        ...(ilk("unvan") ? { unvanMetni: ilk("unvan") } : {}),
        sayi: t.sayi,
        son: t.son,
        durum,
        ...(e?.kisiId ? { kisiId: e.kisiId } : {}),
        adaylar: e?.adaylar ?? [],
        ...(durum === "eslesti" && e?.alan ? { alan: e.alan } : {}),
        eksik,
        ...tahmin,
      };
    })
    .sort((a, b) => b.sayi - a.sayi || b.son.localeCompare(a.son));
};

/* Kişi formlarındaki gibi: grup düğümü ya da ünvansız seçim kaydedilmez. */
export const birimGecerli = (birim: BirimId | undefined, gorev: GorevId | undefined, y: Yapi = yapi()) =>
  !!birim && !grupMu(birim, y) && !!gorev && unvanListesi(birim, undefined, y).includes(gorev);
