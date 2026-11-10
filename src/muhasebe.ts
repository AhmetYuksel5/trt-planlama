import type { Durum, Kisi, MuhasebeAnlasmasi, MuhasebeIs, MuhasebeKapanisi, MuhasebeTanimi } from "./veri";

/*
 * Muhasebe (News Gathering'in alt birimi) kuralları. Sayılar saklanmaz,
 * raporlar gibi kayıttan hesaplanır: muhabirin ay içindeki işi, anlaşmasına
 * göre ödemesi. Kayıtta yalnız muhasebenin girdiği tanımlar, anlaşmalar ve
 * ay kapanışları var (veri.ts → MuhasebeTanimi, MuhasebeAnlasmasi,
 * MuhasebeKapanisi).
 *
 * Ne sayılır: tamamlanmış paket (yapılmadı, reddedilen, iptal değil; türü
 * paketin haber türü), Newsdesk'in "yapıldı" işaretlediği canlı yayın, özel
 * yayında yayınlanmış nafize. Takip olarak plana giren iş sayılmaz.
 */

export interface MuhasebeIsi {
  id: string;
  /** Paket, canlı yayın ya da nafize: ayrıntıdan kaydına gitmek için. */
  kaynak: "paket" | "canli" | "nafize";
  tur: MuhasebeIs;
  tarih: string;
  baslik: string;
}

export const ay = (tarih: string) => tarih.slice(0, 7);

const planTarihi = (d: Durum, planId?: string) => (planId ? d.planlar.find((p) => p.id === planId)?.tarih : undefined);

/** Muhabirin bütün sayılan işleri, en yenisi sonda. */
export const muhabirIsleri = (d: Durum, kisiId: string): MuhasebeIsi[] => {
  const l: MuhasebeIsi[] = [];
  for (const p of d.paketler) {
    if (p.muhabirId !== kisiId || p.durum !== "tamamlandi" || p.yapilmadi || p.reddedildi) continue;
    const tarih = planTarihi(d, p.planId) ?? p.sonTarih ?? p.muhabirTeslimi?.slice(0, 10) ?? p.guncelleme?.slice(0, 10);
    if (tarih) l.push({ id: p.id, kaynak: "paket", tur: p.bicim ?? "pkg", tarih, baslik: p.baslik });
  }
  for (const c of d.canliYayinlar) {
    if (c.muhabirId !== kisiId || c.sonuc?.durum !== "yapildi") continue;
    l.push({ id: c.id, kaynak: "canli", tur: "canli", tarih: c.tarih || planTarihi(d, c.planId) || "", baslik: c.konu });
  }
  for (const o of d.ozel ?? [])
    for (const n of o.nafizeler ?? [])
      if (n.muhabirId === kisiId && n.durum === "yapildi") l.push({ id: n.id, kaynak: "nafize", tur: "canli", tarih: n.tarih, baslik: n.konu });
  return l.filter((x) => x.tarih).sort((a, b) => a.tarih.localeCompare(b.tarih));
};

/** Ay listesi için ayı kaydırır ("2026-01", -1 → "2025-12"). */
export const ayKaydir = (ayi: string, n: number) => {
  const [y, a] = ayi.split("-").map(Number);
  const t = new Date(Date.UTC(y, a - 1 + n, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Muhabir sayfasında geriye bakılan en çok ay: iki yıl ödeme geçmişi yeter, liste uzamasın. */
export const MUHABIR_AY_SINIRI = 24;

/**
 * Muhabir sayfasının ayları, en yenisi önce: ilk işinin ayından (ya da kaydı
 * kapanmış ilk aydan) bu aya. İşi hiç olmayan anlaşmalıda yalnız bu ay; boş
 * aylar da listede kalır, kota altında kalınan ay görünsün.
 */
export const muhabirAylari = (d: Durum, kisiId: string, buAy: string): string[] => {
  const ilkler = [...muhabirIsleri(d, kisiId).map((i) => ay(i.tarih)), ...(d.muhasebeKapanislari ?? []).filter((k) => k.kisiId === kisiId).map((k) => k.ay)].filter((a) => a <= buAy).sort();
  const sinir = ayKaydir(buAy, -(MUHABIR_AY_SINIRI - 1));
  let a = ilkler[0] && ilkler[0] > sinir ? ilkler[0] : ilkler[0] ? sinir : buAy;
  const l: string[] = [];
  while (a <= buAy) {
    l.push(a);
    a = ayKaydir(a, 1);
  }
  return l.reverse();
};

/** Yapılıp yapılmadığı işaretlenmemiş, günü geçmiş canlı (Newsdesk'i bekleyen): sayıma girmiyor, ekranda uyarı. */
export const isaretsizCanlilar = (d: Durum, kisiId: string, ayi: string, bugun: string) =>
  d.canliYayinlar.filter((c) => c.muhabirId === kisiId && !c.sonuc && c.tarih && ay(c.tarih) === ayi && c.tarih < bugun);

/** Muhasebenin listesi: dış muhabirler ve anlaşması olan herkes. */
export const muhasebeKisileri = (d: Durum): Kisi[] => {
  const anlasmali = new Set((d.muhasebeAnlasmalari ?? []).map((a) => a.id));
  return d.kisiler.filter((k) => !k.pasif && (k.birim === "muhabir" || anlasmali.has(k.id)));
};

export const anlasmaBul = (d: Durum, kisiId: string): MuhasebeAnlasmasi | undefined => (d.muhasebeAnlasmalari ?? []).find((a) => a.id === kisiId);
export const kapanisKimligi = (ayi: string, kisiId: string) => `${ayi}~${kisiId}`;
export const kapanisBul = (d: Durum, ayi: string, kisiId: string): MuhasebeKapanisi | undefined =>
  (d.muhasebeKapanislari ?? []).find((k) => k.id === kapanisKimligi(ayi, kisiId));
export const tanimlar = (d: Durum, tur: MuhasebeTanimi["tur"]) => (d.muhasebeTanimlari ?? []).filter((t) => t.tur === tur);

/** İşin fiyat türü: o türü kapsayan ilk fiyat türü; yoksa "canlı" dışı her iş paketlerinkine düşmez, fiyatsız kalır. */
export const fiyatTuru = (d: Durum, tur: MuhasebeIs): MuhasebeTanimi | undefined => tanimlar(d, "fiyat").find((f) => f.isler?.includes(tur));

export interface AylikDokum {
  kisi: Kisi;
  anlasma?: MuhasebeAnlasmasi;
  kapanis?: MuhasebeKapanisi;
  isler: MuhasebeIsi[];
  paket: number;
  canli: number;
  /** Türe göre sayı (PKG, Walk & Talk, canlı…). */
  turler: Partial<Record<MuhasebeIs, number>>;
  kotaPaket?: number;
  kotaCanli?: number;
  /** Sabit maaşta minimum kotanın altında kalan. */
  kotaAlti: boolean;
  /** Aylık anlaşmada kotayı aşan iş sayısı (ek ödeme bunlardan). */
  asanPaket: number;
  asanCanli: number;
  /** Fiyatı tanımlanmamış ama ücret gerektiren işler. */
  fiyatsiz: number;
  ekOdeme: number;
  odeme: number | null;
}

const fiyat = (d: Durum, a: MuhasebeAnlasmasi, i: MuhasebeIsi) => {
  const f = fiyatTuru(d, i.tur);
  return f ? a.fiyatlar?.[f.id] : undefined;
};

/*
 * Ödeme anlaşmaya göre:
 * - sabit: aylık tutar; minimum kota tutmazsa uyarı (ödeme değişmez);
 * - parça başı: her işin fiyatı;
 * - aylık: aylık tutar, kotayı aşan her işin fiyatı ek ödeme (iş tarih sırasıyla, kotadan sonrakiler).
 * Kota o ayın kapanışında değiştiyse o.
 */
export const aylikDokum = (d: Durum, kisi: Kisi, ayi: string): AylikDokum => {
  const anlasma = anlasmaBul(d, kisi.id);
  const kapanis = kapanisBul(d, ayi, kisi.id);
  const isler = muhabirIsleri(d, kisi.id).filter((i) => ay(i.tarih) === ayi);
  const paketler = isler.filter((i) => i.tur !== "canli");
  const canlilar = isler.filter((i) => i.tur === "canli");
  const turler: Partial<Record<MuhasebeIs, number>> = {};
  for (const i of isler) turler[i.tur] = (turler[i.tur] ?? 0) + 1;
  const kotaPaket = kapanis?.kotaPaket ?? anlasma?.kotaPaket;
  const kotaCanli = kapanis?.kotaCanli ?? anlasma?.kotaCanli;
  const sonuc: AylikDokum = { kisi, anlasma, kapanis, isler, paket: paketler.length, canli: canlilar.length, turler, kotaPaket, kotaCanli, kotaAlti: false, asanPaket: 0, asanCanli: 0, fiyatsiz: 0, ekOdeme: 0, odeme: null };
  if (!anlasma) return sonuc;
  const ucretli = (l: MuhasebeIsi[]) => {
    let toplam = 0;
    for (const i of l) {
      const f = fiyat(d, anlasma, i);
      if (f === undefined) sonuc.fiyatsiz++;
      else toplam += f;
    }
    return toplam;
  };
  if (anlasma.tur === "sabit") {
    sonuc.kotaAlti = (kotaPaket !== undefined && paketler.length < kotaPaket) || (kotaCanli !== undefined && canlilar.length < kotaCanli);
    sonuc.odeme = anlasma.tutar ?? null;
  } else if (anlasma.tur === "parca") {
    sonuc.odeme = ucretli(isler);
  } else {
    const asanP = kotaPaket === undefined ? [] : paketler.slice(kotaPaket);
    const asanC = kotaCanli === undefined ? [] : canlilar.slice(kotaCanli);
    sonuc.asanPaket = asanP.length;
    sonuc.asanCanli = asanC.length;
    sonuc.ekOdeme = ucretli([...asanP, ...asanC]);
    sonuc.odeme = anlasma.tutar === undefined ? null : anlasma.tutar + sonuc.ekOdeme;
  }
  return sonuc;
};

/* --- Excel'den ilk kurulum (iceAktar.ts okuyucusuyla) --- */

const sade = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}@.]+/gu, " ")
    .trim();

/* Başlık adıyla sütun: Türkçe, İngilizce, Arapça yazımlar. */
const SUTUNLAR: Record<string, string[]> = {
  ad: ["ad", "isim", "ad soyad", "adi soyadi", "muhabir", "name", "full name", "reporter", "الاسم", "اسم المراسل", "المراسل"],
  eposta: ["e posta", "eposta", "e mail", "email", "mail", "البريد", "البريد الالكتروني"],
  anlasma: ["anlasma", "anlasma sekli", "anlasma turu", "sozlesme", "contract", "agreement", "type", "نوع العقد", "العقد"],
  tutar: ["tutar", "ucret", "maas", "aylik", "amount", "salary", "fee", "المبلغ", "الراتب"],
  para: ["para", "para birimi", "doviz", "currency", "العمله"],
  odeme: ["odeme", "odeme araci", "odeme sekli", "payment", "payment method", "طريقه الدفع"],
  kotaPaket: ["kota paket", "paket kotasi", "paket", "package quota", "packages", "حصه التقارير"],
  kotaCanli: ["kota canli", "canli kotasi", "canli", "live quota", "lives", "حصه المباشر"],
};

export const anlasmaTuruOku = (s: string): MuhasebeAnlasmasi["tur"] | null => {
  const x = sade(s);
  if (!x) return null;
  if (/sabit|maas|retainer|salary|fixed|راتب|ثابت/.test(x)) return "sabit";
  if (/parca|freelance|piece|per|قطعه|بالقطعه/.test(x)) return "parca";
  if (/aylik|monthly|month|شهري/.test(x)) return "aylik";
  return null;
};

export interface AnlasmaSatiri {
  satir: number;
  ad: string;
  eposta: string;
  kisiId?: string;
  tur: MuhasebeAnlasmasi["tur"] | null;
  tutar?: number;
  para?: string;
  odeme?: string;
  kotaPaket?: number;
  kotaCanli?: number;
}

const sayi = (s?: string) => {
  if (!s) return undefined;
  const n = Number(s.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) && s.trim() ? n : undefined;
};

const adlar = (k: Kisi) => (typeof k.ad === "string" ? [k.ad] : [k.ad.ar, k.ad.tr, k.ad.en]).filter(Boolean).map(sade);

/** Excel satırlarından anlaşma taslakları; kişi e-postayla, yoksa Arapça ya da Latin adla eşlenir. */
export const anlasmaTaslaklari = (satirlar: string[][], kisiler: Kisi[]): AnlasmaSatiri[] => {
  const bi = satirlar.findIndex((s) => s.some((h) => SUTUNLAR.ad.includes(sade(h))));
  if (bi < 0) return [];
  const baslik = satirlar[bi].map(sade);
  const sutun = (k: string) => baslik.findIndex((h) => SUTUNLAR[k].includes(h));
  const yer = Object.fromEntries(Object.keys(SUTUNLAR).map((k) => [k, sutun(k)]));
  const al = (s: string[], k: string) => (yer[k] >= 0 ? (s[yer[k]] ?? "").trim() : "");
  return satirlar
    .slice(bi + 1)
    .map((s, i) => {
      const ad = al(s, "ad");
      const eposta = al(s, "eposta").toLowerCase();
      if (!ad && !eposta) return null;
      const kisi =
        (eposta && kisiler.find((k) => [k.eposta, k.kisiselEposta].some((e) => e?.toLowerCase() === eposta))) ||
        (ad && kisiler.find((k) => adlar(k).includes(sade(ad))));
      return {
        satir: bi + i + 2,
        ad,
        eposta,
        ...(kisi ? { kisiId: kisi.id } : {}),
        tur: anlasmaTuruOku(al(s, "anlasma")),
        tutar: sayi(al(s, "tutar")),
        para: al(s, "para") || undefined,
        odeme: al(s, "odeme") || undefined,
        kotaPaket: sayi(al(s, "kotaPaket")),
        kotaCanli: sayi(al(s, "kotaCanli")),
      } as AnlasmaSatiri;
    })
    .filter((x): x is AnlasmaSatiri => !!x);
};
