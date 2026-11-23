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
 * قسم المراسلين (postanın NEWSDESK grubu; kullanıcı: PLANNING değil, Newsdesk
 * satırı), منتج مقابلات, مترجم, محرر (script editor).
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
    if (/^NEWS ?DESK\b/.test(g)) return "muhabirMasasi";
    return undefined;
  }
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
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const parcalar = (s: string) => latin(s).split(/[^a-z]+/).filter((p) => p.length >= 2);

/*
 * Ünsüz iskeleti: Latin ve Arapça yazım aynı biçime iner, kayıtta yalnız
 * Arapça adı olan kişi (geçmiş plan yüklemesi, hesapsız kişi) postanın Latin
 * adıyla da tutsun (kullanıcı: postadaki adlar plana ekli kişilerle
 * eşleşmiyordu). Ünlüler, و ve ي (ünlü de okunur) düşer; aynı sesin harfleri
 * birleşir (ج/c/g/غ, ح/خ/h, س/ص/ث/ش/sh, ق/ك/k…), çift harf teke iner.
 */
const AR_ISKELET: Record<string, string> = {
  ب: "b", ت: "t", ث: "s", ج: "j", ح: "h", خ: "h", د: "d", ذ: "z", ر: "r", ز: "z", س: "s", ش: "s", ص: "s", ض: "d",
  ط: "t", ظ: "z", غ: "j", ف: "f", ق: "k", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", پ: "b", چ: "j", گ: "j", ڤ: "f",
};
const iskelet = (s: string): string => {
  let x: string;
  if (/[\u0600-\u06ff]/.test(s)) x = [...s].map((h) => AR_ISKELET[h] ?? "").join("");
  else
    x = latin(s)
      .replace(/sh|ch/g, "s")
      .replace(/kh/g, "h")
      .replace(/gh|dj|dsch/g, "j")
      .replace(/ph/g, "f")
      .replace(/th/g, "s")
      .replace(/q/g, "k")
      .replace(/[cg]/g, "j")
      .replace(/x/g, "ks")
      .replace(/p/g, "b")
      .replace(/v/g, "f")
      .replace(/[^bdfhjklmnrstz]/g, "");
  return x.replace(/(.)\1+/g, "$1");
};
/* Arapça adın parçaları ve bileşik okunuşları: "عبد الرحمن" postada "Abdurrahman", "Abdulrahman" diye geçer. */
const arapcaIskeletleri = (ad: string): string[] => {
  const p = ad.split(/[\s\u200c-]+/).filter(Boolean);
  const sonuc = p.map(iskelet);
  for (let i = 0; i + 1 < p.length; i++) {
    const ikinci = p[i + 1].replace(/^ال/, "");
    sonuc.push(iskelet(p[i] + p[i + 1]), iskelet(p[i] + ikinci), iskelet(p[i]) + "l" + iskelet(ikinci));
    if (p[i + 1].startsWith("ال")) sonuc.push(iskelet(ikinci));
  }
  return sonuc;
};

interface KisiAdlari {
  /** Latin parçalar (Türkçe, İngilizce ad ve e-postaların yerel kısmı). */
  latin: Set<string>;
  /** Ünsüz iskeletleri (Latin ve Arapça). */
  iskelet: Set<string>;
  /** Adın kaç parçası var (tutması gereken sayı ondan). */
  uzunluk: number;
}
const kisiAdlari = (k: Kisi): KisiAdlari => {
  const latinAdlar = typeof k.ad === "string" ? (/[\u0600-\u06ff]/.test(k.ad) ? [] : [k.ad]) : [k.ad.tr, k.ad.en];
  const arapca = typeof k.ad === "string" ? (/[\u0600-\u06ff]/.test(k.ad) ? k.ad : "") : k.ad.ar || "";
  const adParca = latinAdlar.filter((x): x is string => !!x).flatMap(parcalar);
  const postaParca = [k.eposta, k.kurumEposta]
    .filter((x): x is string => !!x && !/@giris\./.test(x))
    .flatMap((e) => parcalar(e.split("@")[0]));
  const arParca = arapca ? arapca.split(/\s+/).filter(Boolean) : [];
  const latinSet = new Set([...adParca, ...postaParca]);
  const isk = new Set([...[...latinSet].map(iskelet), ...(arapca ? arapcaIskeletleri(arapca) : [])].filter((x) => x.length >= 2));
  return { latin: latinSet, iskelet: isk, uzunluk: Math.max(new Set(adParca).size, arParca.length, 1) };
};
const tutar = (parca: string, a: KisiAdlari) => {
  if (a.latin.has(parca)) return true;
  const i = iskelet(parca);
  return i.length >= 2 && a.iskelet.has(i);
};

/**
 * Postadaki adı kayıtlı kişiyle eşleştirir (Latin yazım; kişinin Latin adı,
 * e-postası ya da Arapça adının iskeleti). En az iki parça tutmalı (tek
 * parçalı adda o parça) ve en iyisi tek olmalı; değilse eşleşmez, önizlemede
 * elle seçilir. Yanlış kişi sessizce ekibe girmesin. Eşit adaylardan yalnız
 * biri planın ekibindeyse o seçilir (`oncelikli`).
 */
export const staffingKisisi = (
  ad: string,
  kisiler: Kisi[],
  oncelikli: ReadonlySet<string> = new Set(),
): { kisiId?: string; adaylar: string[] } => {
  const p = [...new Set(parcalar(ad))];
  if (!p.length) return { adaylar: [] };
  const puanlar = kisiler
    .filter((k) => !k.pasif)
    .map((k) => {
      const a = kisiAdlari(k);
      return { k, sayi: p.filter((x) => tutar(x, a)).length, kalan: a.uzunluk };
    })
    .filter((x) => x.sayi >= Math.min(2, p.length) && x.sayi >= Math.min(2, x.kalan))
    .sort((a, b) => b.sayi - a.sayi || a.kalan - b.kalan);
  const adaylar = puanlar.map((x) => x.k.id);
  if (!puanlar.length) return { adaylar };
  const ilk = puanlar[0];
  const esit = puanlar.filter((x) => x.sayi === ilk.sayi && x.kalan === ilk.kalan);
  if (esit.length === 1) return { kisiId: ilk.k.id, adaylar };
  const ekipte = esit.filter((x) => oncelikli.has(x.k.id));
  return ekipte.length === 1 ? { kisiId: ekipte[0].k.id, adaylar } : { adaylar };
};

export interface StaffingOnerisi extends StaffingKaydi {
  gorev: EkipGorevi;
  kisiId?: string;
  adaylar: string[];
  /** Ekibe yazılacak GMT vardiya. */
  vardiya: string;
}

/** Ekibe girecek satırlar: eşlemesi olan grupta, o gün vardiyası olan kişiler. */
export const staffingOnerileri = (metin: string, kisiler: Kisi[], ekip: EkipUyesi[] = []): StaffingOnerisi[] => {
  const oncelikli = new Set(ekip.map((e) => e.kisiId));
  return staffingCoz(metin).flatMap((k) => {
    const gorev = staffingGorevi(k);
    if (!gorev || !k.calisiyor || !k.saat) return [];
    return [{ ...k, gorev, vardiya: gmtVardiya(k.saat), ...staffingKisisi(k.ad, kisiler, oncelikli) }];
  });
};

/** Ekibe yazış: postadaki görevlerin ekibi postadakiyle değişir, öbür görevler kalır. */
export const staffingEkibi = (ekip: EkipUyesi[], yeni: EkipUyesi[]): EkipUyesi[] => {
  const gorevler = new Set(yeni.map((u) => u.gorev));
  const kalan = ekip.filter((e) => !gorevler.has(e.gorev) && !yeni.some((u) => u.kisiId === e.kisiId));
  const tekil = yeni.filter((u, i) => yeni.findIndex((x) => x.kisiId === u.kisiId) === i);
  return [...kalan, ...tekil];
};

/*
 * Kurumun günlük staffing postasının kurgusal benzeri (kurumunki adları
 * gerçek): yarının planına Next Day'de "Staffing postası" şeridi çıksın.
 * Adlar örnek kişilerin Latin yazımı; biri kayıtta yok, önizlemede elle seçilir.
 * PLANNING grubu ekibe girmez (قسم المراسلين NEWSDESK'ten).
 * Kimliği tarihten: eski demo kaydına açılış işi (demoStaffingPostasi) ekliyor.
 */
export const staffingOrnegi = (kisiler: Kisi[], an: string, tarih: string, P: string): PostaMesaji => {
  const ad = (id: string) => {
    const k = kisiler.find((x) => x.id === id);
    return k ? (typeof k.ad === "string" ? k.ad : k.ad.tr) : id;
  };
  const g = new Date(tarih + "T12:00:00");
  const gunAdi = g.toLocaleDateString("en-GB", { weekday: "long" });
  const ay = g.toLocaleDateString("en-GB", { month: "short" });
  const n = g.getDate();
  const ek = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  const govde = [
    `Here is the staff list for ${gunAdi.slice(0, 3)} ${n}${ek} ${ay} ${g.getFullYear()}`,
    "PRESENTER", `${n} ${ay}`, gunAdi.slice(0, 3),
    "06.00-15.00", ad("pr6"),
    "20.00-20.25 - Akşam programı (Live)", ad("pr6"),
    "NEWSROOM", "NEWSROOM", gunAdi,
    "EP TEAM", "1", "EP", "0700-1800", ad("nd1"),
    "PE EARLY TEAM", "1", "Programme Editor", "1100-2000", ad("nd4"), "Freelancer", "1300-2200", "Kerem Tunalı",
    "OP EARLY TEAM", "1", "Output Producer", "0700-1600", ad("ou1"),
    "Interpreter", "1", "Interpreter", "0900-1800", ad("ou6"),
    "NEWSDESK", "1", "News Editor", "0700-1815", ad("nd2"),
    "NEWSGATHERING", "POSITION", "NAMES", gunAdi.slice(0, 3).toUpperCase(),
    "PLANNING", "Planning Producer", ad("pl3").toLocaleUpperCase("tr"), "0700+", "Planning Producer", ad("pl2").toLocaleUpperCase("tr"), "OFF",
  ].join("\n\n");
  return {
    id: `pm-staffing-${tarih}`, konuKimligi: `ornek-staffing-${tarih}`, kimden: "coords@kurgu.example", kimdenAd: "Coordination", konu: `TRT Arabi News Staffing ${gunAdi} ${n}${ek} ${ay} ${g.getFullYear()}`,
    metin: govde, tamMetin: govde, zaman: an, ekler: [], kaynak: "posta", kime: [P], cc: [],
  };
};

