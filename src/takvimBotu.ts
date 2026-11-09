import { benzer, haberSiniflandir, imza, konuBul, normal, type Haber } from "./gundem";
import { gunEkle, gunFarki, iso } from "./tarih";
import type { Faaliyet, FaaliyetTuru, Ulke } from "./veri";

/*
 * Takvim botu, ilk katman (yapay zekasız, ücretsiz). Kullanıcı: gündemde ne
 * var, hangi zirveler, faaliyetler olacak; bir yerde geçen olayları bulup
 * takvime eklesin. Gündem takibinin zaten taradığı haberlerde olay sözcüğüyle
 * birlikte ileri bir tarih geçenler aday olur. Takvime kendiliğinden girmez:
 * bot yanlış tarih ya da söylenti yakalayabilir, Planlama "Takvime ekle" ya da
 * "İlgisiz" der. Sonraki katmanda yapay zeka adayları ayıklayabilir.
 */

export interface TakvimAdayi {
  id: string;
  /** Haberin başlığı (içerik; Arapça ya da İngilizce, takvime eklerken düzeltilir). */
  baslik: string;
  tarih: string;
  tur: FaaliyetTuru;
  ulke?: Ulke;
  kaynak: string;
  baglanti: string;
  /** Aynı olayı veren kaç ayrı haber. */
  haberSayisi: number;
  bulundu: string;
  durum: "yeni" | "eklendi" | "ilgisiz";
  karar?: { kisiId: string; zaman: string };
  faaliyetId?: string;
  /** Bulan kuralın sürümü: kural düzelince eski kuralın bekleyen adayları listeden düşer. */
  kural?: number;
}

/*
 * 2: ilk sürüm geçmiş tarihi ("27 Ekim", Kasım'daki haberde) ertesi yıla
 * atıyordu, "seçim" geçen her siyasi yorum aday oluyordu; liste alakasız
 * 2027 tarihleriyle doldu.
 * 3: haber özetinin başındaki yayın tarihi ("Nov 9, 2026 —") olayın günü
 * sanılıyordu; liste bugünün tarihli alakasız haberleriyle doldu.
 */
export const KURAL_SURUMU = 3;

/* Olay sözcükleri ve türü; sıra önemli: "قمة" de "اجتماع" de geçen haber zirve. Sözcük yoksa tarih tek başına aday yapmaz. */
const OLAY_SOZLERI: [FaaliyetTuru, string[]][] = [
  ["secim", ["انتخابات", "الانتخابات", "استفتاء", "election", "elections", "referendum", "polls"]],
  ["zirve", ["قمة", "القمة", "summit"]],
  ["konferans", ["مؤتمر", "المؤتمر", "منتدى", "المنتدى", "conference", "forum"]],
  ["ziyaret", ["زيارة", "يزور", "سيزور", "visit", "visits", "to visit"]],
  ["parlamento", ["البرلمان", "مجلس النواب", "الكنيست", "parliament", "parliamentary"]],
  ["dava", ["محاكمة", "المحكمة", "جلسة استماع", "trial", "hearing", "court"]],
  ["toplanti", ["اجتماع", "الاجتماع", "محادثات", "مفاوضات", "جولة", "يجتمع", "meeting", "talks", "negotiations", "to meet", "convene"]],
];

/* Ay adları normalleştirilmiş yazımla (Mısır/Körfez, Levant, İngilizce). Desen uzun addan kısaya: "ابريل" "اب" (Ağustos) sanılmasın. */
const AY_ADLARI: Record<string, number> = {
  "كانون الثاني": 1, يناير: 1, january: 1, jan: 1,
  شباط: 2, فبراير: 2, february: 2, feb: 2,
  اذار: 3, مارس: 3, march: 3, mar: 3,
  نيسان: 4, ابريل: 4, april: 4, apr: 4,
  ايار: 5, مايو: 5, may: 5,
  حزيران: 6, يونيو: 6, يونيه: 6, june: 6, jun: 6,
  تموز: 7, يوليو: 7, يوليه: 7, july: 7, jul: 7,
  اب: 8, اغسطس: 8, august: 8, aug: 8,
  ايلول: 9, سبتمبر: 9, september: 9, sept: 9, sep: 9,
  "تشرين الاول": 10, اكتوبر: 10, october: 10, oct: 10,
  "تشرين الثاني": 11, نوفمبر: 11, november: 11, nov: 11,
  "كانون الاول": 12, ديسمبر: 12, december: 12, dec: 12,
};
const AY_DESENI = `(${Object.keys(AY_ADLARI).sort((a, b) => b.length - a.length).join("|")})(?![a-zء-ي])`;

/*
 * İleriye bakan ifade: olay sözcüğü ve tarih geçmesi yetmiyor, geçmiş olayı
 * anlatan ya da yorumlayan haber de ikisini taşıyor. "Yarın / gelecek pazar"
 * zaten ileriye bakıyor (tarihleriBul).
 */
const GELECEK = [
  "سيعقد", "ستعقد", "تعقد", "يعقد", "سيزور", "ستزور", "سيلتقي", "ستلتقي", "ستجري", "سيجري", "تجري", "ستنطلق", "ستبدا", "سيبدا", "ستستضيف", "تستضيف",
  "من المقرر", "المقرر", "المقبل", "المقبله", "القادم", "القادمه", "المرتقب", "المرتقبه", "يعتزم", "تعتزم", "قبيل", "استعدادا",
  "will", "to be held", "to convene", "to meet", "to visit", "to attend", "to vote", "to hold", "scheduled", "upcoming", "next", "ahead of", "set to", "to host", "plans to", "expected to", "due to",
];
export const ileriyeBakar = (metin: string) => {
  const m = normal(metin);
  return GELECEK.some((s) => (/[a-z]/.test(s) ? new RegExp(`\\b${s}\\b`).test(m) : m.includes(s)));
};

/* Haftanın günleri, JS sırasıyla (0 Pazar). */
const GUNLER: string[][] = [
  ["الاحد", "sunday"],
  ["الاثنين", "monday"],
  ["الثلاثاء", "tuesday"],
  ["الاربعاء", "wednesday"],
  ["الخميس", "thursday"],
  ["الجمعه", "friday"],
  ["السبت", "saturday"],
];

const rakam = (s: string) => s.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0));
const ayNo = (s: string) => AY_ADLARI[s];
const iki = (n: number) => String(n).padStart(2, "0");

/*
 * Metindeki ileri tarihler, haberin gününe göre. Ay adı + gün (yıl yoksa
 * haberin yılı; geçmişte kalıyorsa ertesi yıl, ama yalnız üç ay içindeyse:
 * Kasım'daki haberde "15 Ocak" gelecek yıl, "27 Ekim" geçmiş olay),
 * "yarın / öbür gün", "gelecek pazar / next Sunday" ("on Sunday" geçmiş haberde de geçiyor). Belirsiz "gelecek hafta",
 * "gelecek ay" alınmaz: tarih uydurmak yanlış kayıt doğururdu.
 */
/* Yıl yazılmamış tarih ertesi yıla en çok bu kadar gün ileri atılır. */
export const YIL_ATLAMA_GUNU = 90;

export const tarihleriBul = (metin: string, haberGunu: string): string[] => {
  const m = rakam(normal(metin));
  const bulunan = new Set<string>();
  const yil0 = Number(haberGunu.slice(0, 4));
  const ekle = (yil: number | undefined, ay: number, gun: number) => {
    if (!ay || gun < 1 || gun > 31) return;
    let y = yil ?? yil0;
    let t = `${y}-${iki(ay)}-${iki(gun)}`;
    if (!yil && gunFarki(haberGunu, t) < -7) {
      t = `${++y}-${iki(ay)}-${iki(gun)}`;
      if (gunFarki(haberGunu, t) > YIL_ATLAMA_GUNU) return;
    }
    // Geçersiz gün (31 Şubat) Date'te kayar; kaydıysa alınmaz.
    if (iso(new Date(t + "T12:00:00")) === t) bulunan.add(t);
  };
  for (const r of m.matchAll(new RegExp(`(?<![0-9])([0-9]{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+|من\\s*)?(?:شهر\\s*)?${AY_DESENI}(?:\\s*(?:عام|سنه)?\\s*(20[0-9]{2}))?`, "g")))
    ekle(r[3] ? Number(r[3]) : undefined, ayNo(r[2]) ?? 0, Number(r[1]));
  for (const r of m.matchAll(new RegExp(`(?<![a-z])${AY_DESENI}\\.?\\s+([0-9]{1,2})(?![0-9])(?:st|nd|rd|th)?(?:,?\\s*(20[0-9]{2}))?`, "g")))
    ekle(r[3] ? Number(r[3]) : undefined, ayNo(r[1]) ?? 0, Number(r[2]));
  if (/بعد غد|day after tomorrow/.test(m)) bulunan.add(gunEkle(haberGunu, 2));
  else if (/(?:^|[^ء-ي])غدا(?:$|[^ء-ي])|\btomorrow\b/.test(m)) bulunan.add(gunEkle(haberGunu, 1));
  const haftaGunu = new Date(haberGunu + "T12:00:00").getDay();
  GUNLER.forEach(([ar, en], i) => {
    if (new RegExp(`${ar}\\s+(?:المقبل|القادم)|\\bnext\\s+${en}\\b`).test(m)) bulunan.add(gunEkle(haberGunu, ((i - haftaGunu + 7) % 7) || 7));
  });
  return [...bulunan].sort();
};

export const olayTuru = (metin: string): FaaliyetTuru | null => {
  const m = normal(metin);
  for (const [tur, sozler] of OLAY_SOZLERI)
    if (sozler.some((s) => (/[a-z]/.test(s) ? new RegExp(`\\b${s}\\b`).test(m) : m.includes(normal(s))))) return tur;
  return null;
};

/** Haberin konusundan ülke: tek ülkeli tek konu varsa. */
const haberUlkesi = (h: Haber): Ulke | undefined => {
  const konular = haberSiniflandir(h).konular.map((k) => konuBul(k)).filter((k) => k?.ulkeler.length === 1);
  return konular.length === 1 ? konular[0]!.ulkeler[0] : undefined;
};

/* Aday ufku: uzak tarih çoğunlukla yanlış okuma, yıl dönümü ya da geçmiş olayın anılması. */
export const UFUK_GUNU = 180;

/* Göreli tarih ("yarın", "gelecek pazar") kendisi ileriye bakıyor; ay adlı tarihte ayrıca gelecek ifadesi aranır. */
const GORELI = /بعد غد|day after tomorrow|(?:^|[^ء-ي])غدا(?:$|[^ء-ي])|\btomorrow\b|المقبل|القادم|\bnext\s+(?:sun|mon|tues|wednes|thurs|fri|satur)day\b/;

/** Haberlerden bugünden sonraki olay adayları; aynı gün aynı olayı veren haberler tek aday. */
export function haberAdaylari(haberler: Haber[], bugun: string): Omit<TakvimAdayi, "id" | "bulundu" | "durum">[] {
  const adaylar: (Omit<TakvimAdayi, "id" | "bulundu" | "durum"> & { imza: Set<string>; kaynaklar: Set<string> })[] = [];
  for (const h of haberler) {
    const metin = `${h.baslik} ${h.ozet ?? ""}`;
    const tur = olayTuru(metin);
    if (!tur || !(ileriyeBakar(metin) || GORELI.test(normal(metin)))) continue;
    const haberGunu = iso(new Date(h.zaman));
    const i = imza(h.baslik);
    for (const tarih of tarihleriBul(metin, haberGunu)) {
      // Haberin kendi günü (özetin başındaki yayın tarihi) ve bugün olay değil: takvime bugün eklenecek iş yok.
      if (tarih <= bugun || tarih <= haberGunu || gunFarki(bugun, tarih) > UFUK_GUNU) continue;
      const var_ = adaylar.find((a) => a.tarih === tarih && benzer(a.imza, i));
      if (var_) {
        var_.kaynaklar.add(h.kaynak);
        var_.haberSayisi = var_.kaynaklar.size;
        continue;
      }
      adaylar.push({ kural: KURAL_SURUMU, baslik: h.baslik, tarih, tur, ulke: haberUlkesi(h), kaynak: h.kaynak, baglanti: h.baglanti, haberSayisi: 1, imza: i, kaynaklar: new Set([h.kaynak]) });
    }
  }
  return adaylar.map(({ imza: _i, kaynaklar: _k, ...a }) => a).sort((a, b) => b.haberSayisi - a.haberSayisi || a.tarih.localeCompare(b.tarih));
}

/* Aynı gün, benzer adlı: takvimde olan ya da daha önce önerilmiş (reddedilen geri gelmesin). */
const ayniOlay = (tarih: string, baslik: string, digerTarih: string, digerBitis: string, digerBaslik: string) =>
  tarih >= digerTarih && tarih <= digerBitis && benzer(imza(baslik), imza(digerBaslik));

export const takvimdeVar = (faaliyetler: Faaliyet[], a: Pick<TakvimAdayi, "tarih" | "baslik">) =>
  faaliyetler.some((f) => ayniOlay(a.tarih, a.baslik, f.baslangic, f.bitis, f.baslik));

/** Kayda yazılacak yeni adaylar: takvimde ya da aday listesinde (kararı ne olursa olsun) olanlar çıkar. */
export const yeniAdaylar = (
  bulunan: Omit<TakvimAdayi, "id" | "bulundu" | "durum">[],
  mevcut: TakvimAdayi[],
  faaliyetler: Faaliyet[],
) =>
  bulunan.filter(
    (a) => !takvimdeVar(faaliyetler, a) && !mevcut.some((m) => m.baglanti === a.baglanti && m.tarih === a.tarih) && !mevcut.some((m) => ayniOlay(a.tarih, a.baslik, m.tarih, m.tarih, m.baslik)),
  );

/** Planlama'nın bakacağı adaylar: karar bekleyen, günü geçmemiş, takvime başka yoldan girmemiş. */
export const bekleyenAdaylar = (adaylar: TakvimAdayi[], faaliyetler: Faaliyet[], bugun: string) =>
  adaylar.filter((a) => a.durum === "yeni" && a.kural === KURAL_SURUMU && a.tarih >= bugun && !takvimdeVar(faaliyetler, a)).sort((a, b) => a.tarih.localeCompare(b.tarih));

/* Kayıt şişmesin: günü bir aydan çok geçmiş adaylar atılır (ilgisiz denenler de; aynı olay o güne geri gelmez). */
export const ESKI_ADAY_GUNU = 30;
/* Eski kuralın karar bekleyen adayı da atılır: yeni kural haberi yeniden tararsa doğruysa geri bulur. Kararı verilmiş olan kalır (ilgisiz geri gelmesin). */
export const adayTemizligi = (adaylar: TakvimAdayi[], bugun: string) =>
  adaylar.filter((a) => gunFarki(a.tarih, bugun) <= ESKI_ADAY_GUNU && !(a.durum === "yeni" && a.kural !== KURAL_SURUMU));
