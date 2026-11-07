/*
 * Otomatik öneri çağrısı: Next Day her gün 09:00'da (ertesi günün planı),
 * haftalık her Cuma 10:00'da (8 gün sonra başlayan hafta; Perşembe
 * toplantısında görüşülen). Saatler İstanbul; Cloudflare zamanlayıcısı UTC
 * (wrangler.toml → [triggers]).
 *
 * Kapı veritabanını okuyamıyor (servis hesabı istemiyoruz). Gönderenin
 * tarayıcısı önümüzdeki iki haftanın çağrılarını hazır haliyle (konu, metin,
 * HTML) ve BCC listesini buraya bırakıyor; şablon tek yerde, istemcide
 * (src/eposta.ts) kalıyor. Kapı o saatte günün kalemini gönderenin kendi EWS
 * kimliğiyle gönderiyor ve sonucu geçmişe yazıyor; çağrının kaydını
 * (yanıtların ND-/HP- etiketiyle eşleşmesi için) uygulamayı açan tarayıcı
 * yazıyor (src/otoCagri.ts).
 */

export type OtoCagriTuru = "nextday" | "haftalik";

export interface OtoCagriKalem {
  etiket: string;
  tur: OtoCagriTuru;
  /** Planın günü; haftalıkta haftanın Cumartesi'si. */
  tarih: string;
  /** Gönderileceği gün (İstanbul). */
  gonderim: string;
  konu: string;
  metin: string;
  html: string;
  sonSaat: string;
}

export interface OtoCagriAyar {
  acik: boolean;
  /** Gönderen: posta kimliği bu uid'ninki. */
  uid: string;
  bcc: string[];
  /** BCC'deki muhabirlerin kişi kimliği: çağrı kaydına (yanıt eşleştirme) gidiyor. */
  bccIdler: string[];
  kalemler: OtoCagriKalem[];
  /** "Bunu gönderme" denen çağrılar. */
  atla: string[];
  /** Elle gönderilmiş (kayıtta çağrısı olan) etiketler: ikinci kez gitmesin. */
  gonderildi: string[];
  /** Tarayıcının listeyi son bıraktığı an (ISO). */
  guncelleme: string;
}

export interface OtoCagriKaydi {
  etiket: string;
  tur: OtoCagriTuru;
  tarih: string;
  zaman: string;
  uid: string;
  kime: string;
  bccIdler: string[];
  konu: string;
  metin: string;
  sonSaat: string;
  tamam: boolean;
  hata?: string;
}

export const bosOtoCagri = (): OtoCagriAyar => ({ acik: false, uid: "", bcc: [], bccIdler: [], kalemler: [], atla: [], gonderildi: [], guncelleme: "" });

const GUN = /^\d{4}-\d{2}-\d{2}$/;
const ETIKET = /^(ND|HP)-\d{8}$/;
const ADRES = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
/* Exchange'in alıcı sınırının altında; muhabir listesi 60 civarı. */
export const BCC_SINIRI = 300;
const metinMi = (x: unknown): x is string => typeof x === "string";

const kalemCoz = (x: unknown): OtoCagriKalem | null => {
  if (!x || typeof x !== "object") return null;
  const k = x as Record<string, unknown>;
  if (!metinMi(k.etiket) || !ETIKET.test(k.etiket)) return null;
  if (k.tur !== "nextday" && k.tur !== "haftalik") return null;
  if (!metinMi(k.tarih) || !GUN.test(k.tarih) || !metinMi(k.gonderim) || !GUN.test(k.gonderim)) return null;
  if (!metinMi(k.konu) || !k.konu.trim() || k.konu.length > 255) return null;
  if (!metinMi(k.metin) || !k.metin.trim() || k.metin.length > 20_000) return null;
  if (!metinMi(k.html) || k.html.length > 80_000) return null;
  const sonSaat = metinMi(k.sonSaat) && /^\d{2}:\d{2}$/.test(k.sonSaat) ? k.sonSaat : "";
  return { etiket: k.etiket, tur: k.tur, tarih: k.tarih, gonderim: k.gonderim, konu: k.konu, metin: k.metin, html: k.html, sonSaat };
};

const etiketler = (x: unknown) => (Array.isArray(x) ? [...new Set(x.filter((e): e is string => metinMi(e) && ETIKET.test(e)))].slice(0, 60) : null);

/*
 * Tarayıcının gönderdiğini birleştirir. Gönderen değişmesi (`devral`) açıkça
 * istenir: başka planlamacının tarayıcısı açılışta listeyi bırakırken
 * gönderen sessizce ona geçmesin, posta kimin hesabından gidiyorsa o bilsin.
 */
export const otoCagriBirlestir = (eski: OtoCagriAyar, gelen: unknown, uid: string, simdi: string): { ayar: OtoCagriAyar } | { hata: string } => {
  if (!gelen || typeof gelen !== "object") return { hata: "govde" };
  const g = gelen as Record<string, unknown>;
  const sahip = eski.uid || uid;
  if (sahip !== uid && g.devral !== true) return { hata: "baskasi" };
  const yeni: OtoCagriAyar = { ...eski, uid: g.devral === true ? uid : sahip };
  if (typeof g.acik === "boolean") yeni.acik = g.acik;
  if (g.bcc !== undefined) {
    if (!Array.isArray(g.bcc)) return { hata: "bcc" };
    const bcc = [...new Set(g.bcc.map((a) => String(a).trim().toLowerCase()).filter(Boolean))];
    if (bcc.length > BCC_SINIRI || !bcc.every((a) => ADRES.test(a))) return { hata: "bcc" };
    yeni.bcc = bcc;
  }
  if (g.bccIdler !== undefined) {
    if (!Array.isArray(g.bccIdler)) return { hata: "bcc" };
    yeni.bccIdler = g.bccIdler.filter(metinMi).slice(0, BCC_SINIRI);
  }
  if (g.kalemler !== undefined) {
    if (!Array.isArray(g.kalemler) || g.kalemler.length > 40) return { hata: "kalemler" };
    const kalemler = g.kalemler.map(kalemCoz);
    if (kalemler.some((k) => !k)) return { hata: "kalemler" };
    yeni.kalemler = kalemler as OtoCagriKalem[];
    yeni.guncelleme = simdi;
  }
  for (const alan of ["atla", "gonderildi"] as const) {
    if (g[alan] === undefined) continue;
    const e = etiketler(g[alan]);
    if (!e) return { hata: alan };
    yeni[alan] = e;
  }
  return { ayar: yeni };
};

/* Tarayıcıya giden hal: adres listesi yerine sayısı (BCC gizli kalsın, ekran yalnız sayıyı gösteriyor). */
export const otoCagriGorunur = (a: OtoCagriAyar, uid: string, gecmis: OtoCagriKaydi[]) => ({
  acik: a.acik,
  gonderen: a.uid,
  benim: !a.uid || a.uid === uid,
  bccSayi: a.bcc.length,
  guncelleme: a.guncelleme,
  atla: a.atla,
  kalemler: a.kalemler.map(({ etiket, tur, tarih, gonderim, konu }) => ({ etiket, tur, tarih, gonderim, konu })),
  gecmis,
});

/* Gün İstanbul saatiyle (UTC+3, yaz saati yok). */
export const istanbulGunu = (simdi: number) => new Date(simdi + 3 * 3600_000).toISOString().slice(0, 10);

/*
 * O gün o türden gönderilecek kalem; neden gönderilmeyeceği de döner (geçmişe
 * yazılsın, gönderen ekranda görsün). "liste": tarayıcı iki haftadır listeyi
 * bırakmadı, gönderilecek metin yok.
 */
export const gununKalemi = (a: OtoCagriAyar, tur: OtoCagriTuru, gun: string, gecmis: OtoCagriKaydi[]): { kalem: OtoCagriKalem } | { atla: "kapali" | "liste" | "atlandi" | "gonderildi" } => {
  if (!a.acik || !a.uid) return { atla: "kapali" };
  const kalem = a.kalemler.find((k) => k.tur === tur && k.gonderim === gun);
  if (!kalem) return { atla: "liste" };
  if (a.atla.includes(kalem.etiket)) return { atla: "atlandi" };
  if (a.gonderildi.includes(kalem.etiket) || gecmis.some((g) => g.etiket === kalem.etiket && g.tamam)) return { atla: "gonderildi" };
  return { kalem };
};

export const GECMIS_SINIRI = 40;
export const gecmiseEkle = (gecmis: OtoCagriKaydi[], k: OtoCagriKaydi) => [k, ...gecmis].slice(0, GECMIS_SINIRI);
