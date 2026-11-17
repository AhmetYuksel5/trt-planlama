import type { EkipGorevi, EkipUyesi, Kisi, PostaMesaji } from "./veri";

/*
 * Günlük "TRT Arabi News Staffing <gün> <17th Nov 2026>" postasından Next Day
 * ekibi (kullanıcı: Planlama'nın ekibini her gün elle girmek yerine düzenli
 * gelen postadan alsın). Saf: posta kayıtta (Posta'dan), okuma tarayıcıda;
 * gerçek adlar depoya girmez, testler kurgusal adla.
 *
 * Posta HTML tablolarından düz metne inmiş halde geliyor: her hücre bir
 * satır. Dört bölüm var, her biri başka düzende:
 * - PRESENTER: "05.00-15.00" saat, altında ad; program satırı
 *   ("20.00-20.25 - Program …") ve "SB" (yedek) ekibe girmez.
 * - NEWSROOM: grup başlığı ("EP TEAM", ardından tek başına "1"), sonra
 *   ünvan, saat ("0700-1800"), ad; saatsiz kişi de var ("Special", ad).
 * - NEWSGATHERING ve VISUAL TEAM: büyük harfli grup ("PLANNING"), sonra
 *   ünvan, ad, durum ("0900+", "A+0700", "OFF", "ANNUAL+", "COP31+");
 *   durumu yazılmamış satır da var.
 * Postada bütün personel yok, birimlerin üst kademesi var; ekibe yalnız
 * eşlemesi olan gruplar girer, öbür görevler plandaki gibi kalır.
 */

export type StaffingBolumu = "presenter" | "newsroom" | "newsgathering" | "visual";

export interface StaffingKaydi {
  bolum: StaffingBolumu;
  grup: string;
  unvan: string;
  ad: string;
  /** İşe başlama, İstanbul saati "SS:DD". */
  saat?: string;
  /** Postadaki durum hücresi ("0900+Office", "OFF"…), varsa. */
  durum?: string;
  /** O gün vardiyası var: saatli ve izinde, raporda, telafide değil. */
  calisiyor: boolean;
}

const AYLAR = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Konudan günün tarihi ("…Staffing Tuesday 17th Nov 2026" → 2026-11-17); staffing postası değilse yok. */
export const staffingTarihi = (konu: string): string | undefined => {
  const m = konu.match(/news\s+staffing\b.*?\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?,?\s+(\d{4})/i);
  if (!m) return undefined;
  const ay = AYLAR.indexOf(m[2].slice(0, 3).toLowerCase());
  const gun = Number(m[1]);
  if (ay < 0 || gun < 1 || gun > 31) return undefined;
  return `${m[3]}-${String(ay + 1).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
};

/** O günün en son staffing postası (düzeltilmiş liste sonradan gelebilir). */
export const staffingPostasi = (mesajlar: PostaMesaji[] | undefined, tarih: string): PostaMesaji | undefined =>
  (mesajlar ?? [])
    .filter((m) => !m.giden && staffingTarihi(m.konu) === tarih)
    .sort((a, b) => b.zaman.localeCompare(a.zaman))[0];

const saatYaz = (s: string, d: string) => `${s.padStart(2, "0")}:${d}`;
/* "05.00-15.00", "0700-1800", "1345-0045": başlangıç saati. */
const ARALIK = /^(\d{1,2})[.:]?(\d{2})\s*[-–]\s*\d{1,2}[.:]?\d{2}$/;
const PROGRAM = /^\d{1,2}[.:]?\d{2}\s*[-–]\s*\d{1,2}[.:]?\d{2}\s+[-–]\s+\S/;
const GUN_ADI = /^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?$/i;
const TARIH = /^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{1,2}[\s-]+[a-z]{3,9}\.?)$/i;
const IZINLI = /\b(off|comp|sick|annual)\b/i;
const sayiMi = (s: string) => /^\d+$/.test(s);
const durumMu = (s: string) => s.includes("+") || /^(off|comp|sick|annual)$/i.test(s) || /^\d{4}$/.test(s);
const buyukMu = (s: string) => /\p{L}/u.test(s) && s === s.toLocaleUpperCase("tr") && s === s.toUpperCase();

const ustBolum = (s: string, simdiki: StaffingBolumu | undefined): StaffingBolumu | undefined => {
  const u = s.toUpperCase();
  if (u === "PRESENTER" || u === "PRESENTERS") return "presenter";
  if (u === "NEWSROOM") return simdiki === "newsroom" ? undefined : "newsroom";
  // "NEWSGATHERING" bölümün içinde bir grubun da adı.
  if (u === "NEWSGATHERING") return simdiki === "newsgathering" ? undefined : "newsgathering";
  if (u === "VISUAL TEAM") return "visual";
  return undefined;
};

/** Postanın gövdesinden kişiler, postadaki sırasıyla. */
export const staffingCoz = (metin: string): StaffingKaydi[] => {
  const satirlar = metin
    .split(/\r?\n/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s && s !== "→" && !/^>+$/.test(s));
  const sonuc: StaffingKaydi[] = [];
  let bolum: StaffingBolumu | undefined;
  let grup = "";
  // Sıradaki hücrenin ne olduğu: ünvan mı, saat mi, ad mı, durum mu.
  let bekle: "unvan" | "saatYaAd" | "ad" | "durum" = "unvan";
  let unvan = "";
  let saat: string | undefined;
  let sonKayit: StaffingKaydi | undefined;

  const kaydet = (ad: string, s?: string) => {
    const k: StaffingKaydi = { bolum: bolum!, grup, unvan, ad, ...(s && { saat: s }), calisiyor: !!s };
    sonuc.push(k);
    sonKayit = k;
  };

  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    const yeni = ustBolum(s, bolum);
    if (yeni) {
      bolum = yeni;
      grup = yeni === "presenter" ? "PRESENTER" : "";
      bekle = "unvan";
      continue;
    }
    if (!bolum) continue;
    if (GUN_ADI.test(s) || TARIH.test(s) || /^(position|names)$/i.test(s)) continue;

    if (bolum === "presenter") {
      // Saat → ad; program satırı ve "SB"nin adı ekibe girmez ama sırayı bozmasın.
      if (bekle === "ad") {
        kaydet(s, saat);
        bekle = "unvan";
        continue;
      }
      if (PROGRAM.test(s)) {
        grup = "PROGRAM";
        unvan = s;
        saat = undefined;
        bekle = "ad";
        continue;
      }
      const a = s.match(ARALIK);
      if (a) {
        grup = "PRESENTER";
        unvan = "Presenter";
        saat = saatYaz(a[1], a[2]);
        bekle = "ad";
        continue;
      }
      if (/^sb$/i.test(s)) {
        grup = "SB";
        unvan = s;
        saat = undefined;
        bekle = "ad";
      }
      continue;
    }

    if (bolum === "newsroom") {
      // Bölüm adı postada iki kez yazılıyor ("NEWSROOM", "NEWSROOM").
      if (sayiMi(s) || s.toUpperCase() === "NEWSROOM") continue;
      if (bekle === "unvan") {
        // Grup başlığının ardından tek başına "1" geliyor ("EP TEAM", "1"); "EP" ünvanı da büyük harfli olduğu için başka işaret yok.
        if (sayiMi(satirlar[i + 1] ?? "")) {
          grup = s;
          continue;
        }
        unvan = s;
        bekle = "saatYaAd";
        continue;
      }
      if (bekle === "saatYaAd") {
        const a = s.match(ARALIK);
        if (a) {
          saat = saatYaz(a[1], a[2]);
          bekle = "ad";
          continue;
        }
        kaydet(s);
        bekle = "unvan";
        continue;
      }
      kaydet(s, saat);
      saat = undefined;
      bekle = "unvan";
      continue;
    }

    // Newsgathering ve görsel ekip: ünvan, ad, (durum).
    if (bekle === "durum") {
      bekle = "unvan";
      if (durumMu(s)) {
        if (sonKayit) {
          const m = s.match(/(\d{2})(\d{2})/);
          sonKayit.durum = s;
          sonKayit.calisiyor = !!m && !IZINLI.test(s);
          if (m && sonKayit.calisiyor) sonKayit.saat = saatYaz(m[1], m[2]);
        }
        continue;
      }
    }
    if (bekle === "ad") {
      kaydet(s);
      bekle = "durum";
      continue;
    }
    if (durumMu(s)) continue;
    if (buyukMu(s)) {
      grup = s;
      continue;
    }
    unvan = s;
    bekle = "ad";
  }
  return sonuc;
};

const sade = (s: string) => s.toUpperCase().replace(/\s+/g, " ").trim();

/*
 * Postanın grubu → Next Day ekibindeki görev. Kurumun Next Day çıktısındaki
 * ekip: منتج تنفيذي (EP), منتج نشرات (haber programı editörleri), مذيعون,
 * قسم المراسلين (planlama), منتج مقابلات, مترجم, محرر (script editor).
 * Programların (Political programs, Yeni Sabah…) ekibi Next Day'e girmiyor.
 */
export const staffingGorevi = (k: Pick<StaffingKaydi, "bolum" | "grup">): EkipGorevi | undefined => {
  const g = sade(k.grup);
  if (k.bolum === "presenter") return g === "PRESENTER" ? "sunucu" : undefined;
  if (k.bolum === "newsroom") {
    if (/^EP\b/.test(g)) return "yapimciSef";
    if (/^PE\b/.test(g) && !/POLITICAL|PROGRAM/.test(g)) return "bultenYapimcisi";
    if (/^INTERPRETER/.test(g)) return "tercuman";
    if (g === "INTERVIEW TEAM") return "roportajYapimcisi";
    if (/^SCRIPT EDITOR/.test(g)) return "editor";
    return undefined;
  }
  if (k.bolum === "newsgathering" && g === "PLANNING") return "muhabirMasasi";
  return undefined;
};

/* Next Day'de vardiya GMT başlangıcı ("04G"); postadaki saat İstanbul'un (yıl boyu UTC+3). */
export const gmtVardiya = (saat: string) => {
  const [s, d] = saat.split(":").map(Number);
  return `${String((s + 21) % 24).padStart(2, "0")}:${String(d).padStart(2, "0")}`;
};

/* Türkçe ve aksanlı harfler Latin'e; parantez içi (eski ad) de parça sayılır. */
const latin = (s: string) =>
  s
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const parcalar = (s: string) => latin(s).split(/[^a-z]+/).filter((p) => p.length >= 2);

const kisiParcalari = (k: Kisi) => {
  const adlar = typeof k.ad === "string" ? [k.ad] : [k.ad.tr, k.ad.en];
  return new Set(adlar.filter((x): x is string => !!x).flatMap(parcalar));
};

/**
 * Postadaki adı kayıtlı kişiyle eşleştirir (Latin yazım). En az iki parça
 * tutmalı (tek parçalı adda o parça) ve en iyisi tek olmalı; değilse
 * eşleşmez, önizlemede elle seçilir. Yanlış kişi sessizce ekibe girmesin.
 */
export const staffingKisisi = (ad: string, kisiler: Kisi[]): { kisiId?: string; adaylar: string[] } => {
  const p = [...new Set(parcalar(ad))];
  if (!p.length) return { adaylar: [] };
  const puanlar = kisiler
    .filter((k) => !k.pasif)
    .map((k) => {
      const kp = kisiParcalari(k);
      return { k, sayi: p.filter((x) => kp.has(x)).length, kalan: kp.size };
    })
    .filter((x) => x.sayi >= Math.min(2, p.length) && x.sayi >= Math.min(2, x.kalan))
    .sort((a, b) => b.sayi - a.sayi || a.kalan - b.kalan);
  const adaylar = puanlar.map((x) => x.k.id);
  if (!puanlar.length) return { adaylar };
  const [ilk, ikinci] = puanlar;
  if (ikinci && ikinci.sayi === ilk.sayi && ikinci.kalan === ilk.kalan) return { adaylar };
  return { kisiId: ilk.k.id, adaylar };
};

export interface StaffingOnerisi extends StaffingKaydi {
  gorev: EkipGorevi;
  kisiId?: string;
  adaylar: string[];
  /** Ekibe yazılacak GMT vardiya. */
  vardiya: string;
}

/** Ekibe girecek satırlar: eşlemesi olan grupta, o gün vardiyası olan kişiler. */
export const staffingOnerileri = (metin: string, kisiler: Kisi[]): StaffingOnerisi[] =>
  staffingCoz(metin).flatMap((k) => {
    const gorev = staffingGorevi(k);
    if (!gorev || !k.calisiyor || !k.saat) return [];
    return [{ ...k, gorev, vardiya: gmtVardiya(k.saat), ...staffingKisisi(k.ad, kisiler) }];
  });

/** Ekibe yazış: postadaki görevlerin ekibi postadakiyle değişir, öbür görevler kalır. */
export const staffingEkibi = (ekip: EkipUyesi[], yeni: EkipUyesi[]): EkipUyesi[] => {
  const gorevler = new Set(yeni.map((u) => u.gorev));
  const kalan = ekip.filter((e) => !gorevler.has(e.gorev) && !yeni.some((u) => u.kisiId === e.kisiId));
  const tekil = yeni.filter((u, i) => yeni.findIndex((x) => x.kisiId === u.kisiId) === i);
  return [...kalan, ...tekil];
};
