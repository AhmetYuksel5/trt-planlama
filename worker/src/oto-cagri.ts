/*
 * Otomatik öneri çağrısı: Next Day her gün (ertesi günün planı), haftalık
 * haftada bir (8 gün sonra başlayan hafta; Perşembe toplantısında görüşülen).
 * Saatler ve gün ayarda (varsayılan Next Day 09:00, haftalık Cuma 10:00),
 * İstanbul saatiyle; zamanlayıcı 15 dakikada bir bakıyor (wrangler.toml).
 * Gönderen o çağrının görevlisi (kullanıcı: ayrı gönderen takvimi çok karışıktı;
 * Görevler'de zaten Next Day ve Weekly görevlisi var): tarayıcı paketi kurarken
 * Görevler'den hesaplayıp kaleme yazıyor (`gorevli`). Görevli yalnız kendi
 * hesabından gönderilmesine izin vermişse (`gonderenler`, kişi kendini ekleyip
 * çıkarıyor) gider: kimsenin hesabı habersiz kullanılmasın. Görevlisi yazılmamış
 * eski pakette eski takvim (haftanın günü, istisna günler) geçerli.
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
  /** Gönderileceği gün ve saat (İstanbul). */
  gonderim: string;
  saat: string;
  konu: string;
  metin: string;
  html: string;
  sonSaat: string;
  /** Görevler'deki o günün görevlisi (uid; "" görevli yok). Yoksa eski paket: takvim geçerli. */
  gorevli?: string;
}

/* Gönderim zamanları; haftalığın günü 0 Pazar … 6 Cumartesi. */
export interface OtoZaman {
  nd: string;
  hpGun: number;
  hp: string;
  sonSaat: string;
}
export const VARSAYILAN_ZAMAN: OtoZaman = { nd: "09:00", hpGun: 5, hp: "10:00", sonSaat: "15:00" };

/* Kurumun metninden farklı yazılmış şablon; boşsa varsayılan (istemcide, src/eposta.ts). */
export interface OtoSablon {
  nd?: string;
  hp?: string;
}

export interface OtoCagriAyar {
  acik: boolean;
  /** Kendi hesabından gönderilmesine izin verenler (uid). */
  gonderenler: string[];
  /** Haftanın günü (0 Pazar … 6 Cumartesi) → gönderen. */
  haftalik: Record<string, string>;
  /** Belli gün → gönderen; haftanın gününü ezer. */
  istisna: Record<string, string>;
  zaman: OtoZaman;
  sablon: OtoSablon;
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
  /** İstek sunucuya yazıldıktan sonra hata geldi: posta gitmiş olabilir, yeniden denenmez. */
  belirsiz?: boolean;
}

export const bosOtoCagri = (): OtoCagriAyar => ({ acik: false, gonderenler: [], haftalik: {}, istisna: {}, zaman: { ...VARSAYILAN_ZAMAN }, sablon: {}, bcc: [], bccIdler: [], kalemler: [], atla: [], gonderildi: [], guncelleme: "" });

/* İlk sürümde tek gönderen (`uid`) vardı: o kişi her günün göndereni ve izin vermiş sayılır. */
export const otoCagriNormal = (ham: unknown): OtoCagriAyar => {
  const a = { ...bosOtoCagri(), ...(ham && typeof ham === "object" ? (ham as Partial<OtoCagriAyar> & { uid?: string }) : {}) };
  const eski = (ham as { uid?: string } | null)?.uid;
  if (eski && !a.gonderenler.length) {
    a.gonderenler = [eski];
    a.haftalik = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((g) => [String(g), eski]));
  }
  delete (a as { uid?: string }).uid;
  a.zaman = { ...VARSAYILAN_ZAMAN, ...a.zaman };
  a.kalemler = a.kalemler.map((k) => ({ ...k, saat: k.saat || (k.tur === "haftalik" ? a.zaman.hp : a.zaman.nd) }));
  return a;
};

const haftaninGunu = (g: string) => new Date(`${g}T12:00:00Z`).getUTCDay();

/** Kalemin göndereni: görevlisi, yoksa (eski paket) takvim; izin vermemiş kişi gönderen değil. */
export const gununGondereni = (a: OtoCagriAyar, gun: string, kalem?: Pick<OtoCagriKalem, "gorevli">): string => {
  const u = kalem?.gorevli !== undefined ? kalem.gorevli : (a.istisna[gun] ?? a.haftalik[String(haftaninGunu(gun))] ?? "");
  return u && a.gonderenler.includes(u) ? u : "";
};

const GUN = /^\d{4}-\d{2}-\d{2}$/;
const ETIKET = /^(ND|HP)-\d{8}$/;
const ADRES = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
/* Exchange'in alıcı sınırının altında; muhabir listesi 60 civarı. */
export const BCC_SINIRI = 300;
const metinMi = (x: unknown): x is string => typeof x === "string";
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;

const kalemCoz = (x: unknown): OtoCagriKalem | null => {
  if (!x || typeof x !== "object") return null;
  const k = x as Record<string, unknown>;
  if (!metinMi(k.etiket) || !ETIKET.test(k.etiket)) return null;
  if (k.tur !== "nextday" && k.tur !== "haftalik") return null;
  if (!metinMi(k.tarih) || !GUN.test(k.tarih) || !metinMi(k.gonderim) || !GUN.test(k.gonderim)) return null;
  if (!metinMi(k.saat) || !SAAT.test(k.saat)) return null;
  if (!metinMi(k.konu) || !k.konu.trim() || k.konu.length > 255) return null;
  if (!metinMi(k.metin) || !k.metin.trim() || k.metin.length > 20_000) return null;
  if (!metinMi(k.html) || k.html.length > 80_000) return null;
  const sonSaat = metinMi(k.sonSaat) && /^\d{2}:\d{2}$/.test(k.sonSaat) ? k.sonSaat : "";
  if (k.gorevli !== undefined && !(metinMi(k.gorevli) && /^[\w-]{0,128}$/.test(k.gorevli))) return null;
  return { etiket: k.etiket, tur: k.tur, tarih: k.tarih, gonderim: k.gonderim, saat: k.saat, konu: k.konu, metin: k.metin, html: k.html, sonSaat, ...(metinMi(k.gorevli) ? { gorevli: k.gorevli } : {}) };
};

const etiketler = (x: unknown) => (Array.isArray(x) ? [...new Set(x.filter((e): e is string => metinMi(e) && ETIKET.test(e)))].slice(0, 60) : null);

/*
 * Tarayıcının gönderdiğini birleştirir. İzin (`katil`) yalnız kişinin
 * kendisi için: başkası onu gönderen listesine ekleyemez; ayrılanın takvimdeki
 * günleri boşalır. Takvime yalnız izin vermiş kişi konur.
 */
export const otoCagriBirlestir = (eski: OtoCagriAyar, gelen: unknown, uid: string, simdi: string): { ayar: OtoCagriAyar } | { hata: string } => {
  if (!gelen || typeof gelen !== "object") return { hata: "govde" };
  const g = gelen as Record<string, unknown>;
  const yeni: OtoCagriAyar = { ...eski, haftalik: { ...eski.haftalik }, istisna: { ...eski.istisna } };
  if (typeof g.katil === "boolean") {
    yeni.gonderenler = g.katil ? [...new Set([...eski.gonderenler, uid])] : eski.gonderenler.filter((u) => u !== uid);
    if (!g.katil) {
      for (const m of [yeni.haftalik, yeni.istisna]) for (const [k, v] of Object.entries(m)) if (v === uid) delete m[k];
    }
  }
  if (typeof g.acik === "boolean") yeni.acik = g.acik;
  if (g.haftalik !== undefined) {
    if (!g.haftalik || typeof g.haftalik !== "object") return { hata: "takvim" };
    const h: Record<string, string> = {};
    for (const [k, v] of Object.entries(g.haftalik as Record<string, unknown>)) {
      if (!/^[0-6]$/.test(k) || !metinMi(v)) return { hata: "takvim" };
      if (!v) continue;
      if (!yeni.gonderenler.includes(v)) return { hata: "izinsiz" };
      h[k] = v;
    }
    yeni.haftalik = h;
  }
  if (g.istisna !== undefined) {
    if (!g.istisna || typeof g.istisna !== "object") return { hata: "takvim" };
    const gun = simdi.slice(0, 10);
    const h: Record<string, string> = {};
    for (const [k, v] of Object.entries(g.istisna as Record<string, unknown>)) {
      if (!GUN.test(k) || !metinMi(v)) return { hata: "takvim" };
      // Geçmiş günler birikmesin; boş metin "o gün kimse göndermesin".
      if (k < gun) continue;
      if (v && !yeni.gonderenler.includes(v)) return { hata: "izinsiz" };
      h[k] = v;
    }
    if (Object.keys(h).length > 60) return { hata: "takvim" };
    yeni.istisna = h;
  }
  if (g.zaman !== undefined) {
    const z = g.zaman as Partial<OtoZaman> | null;
    if (!z || typeof z !== "object") return { hata: "zaman" };
    const zaman = { ...yeni.zaman, ...z };
    if (![zaman.nd, zaman.hp, zaman.sonSaat].every((x) => metinMi(x) && SAAT.test(x)) || !Number.isInteger(zaman.hpGun) || zaman.hpGun < 0 || zaman.hpGun > 6) return { hata: "zaman" };
    yeni.zaman = { nd: zaman.nd, hpGun: zaman.hpGun, hp: zaman.hp, sonSaat: zaman.sonSaat };
  }
  if (g.sablon !== undefined) {
    const s = g.sablon as Record<string, unknown> | null;
    if (!s || typeof s !== "object") return { hata: "sablon" };
    const t: OtoSablon = {};
    for (const k of ["nd", "hp"] as const) {
      const v = s[k];
      if (v === undefined || v === "") continue;
      if (!metinMi(v) || v.length > 5000) return { hata: "sablon" };
      t[k] = v;
    }
    yeni.sablon = t;
  }
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
  gonderenler: a.gonderenler,
  izinli: a.gonderenler.includes(uid),
  haftalik: a.haftalik,
  istisna: a.istisna,
  zaman: a.zaman,
  sablon: a.sablon,
  bccSayi: a.bcc.length,
  guncelleme: a.guncelleme,
  atla: a.atla,
  kalemler: a.kalemler.map(({ etiket, tur, tarih, gonderim, saat, konu, gorevli }) => ({ etiket, tur, tarih, gonderim, saat, konu, gorevli, uid: gununGondereni(a, gonderim, { gorevli }) })),
  gecmis,
});

/* Gün ve saat İstanbul saatiyle (UTC+3, yaz saati yok). */
export const istanbulGunu = (simdi: number) => new Date(simdi + 3 * 3600_000).toISOString().slice(0, 10);
export const istanbulSaati = (simdi: number) => new Date(simdi + 3 * 3600_000).toISOString().slice(11, 16);

/* Başarısız gönderim üç kez denenir (zamanlayıcı 15 dakikada bir); sonra o gün bırakılır. */
export const DENEME_SINIRI = 3;

/*
 * Şu an gönderilecek kalem; neden gönderilmeyeceği de döner (geçmişe
 * yazılsın, gönderen ekranda görsün). Saati gelmemiş kalem beklenir.
 * "liste": tarayıcı iki haftadır listeyi bırakmadı, gönderilecek metin yok;
 * "gonderen": o günün görevlisi (ya da eski pakette takvimde biri) yok;
 * "izinsiz": görevli kendi hesabından gönderilmesine izin vermemiş.
 */
export const gununKalemi = (
  a: OtoCagriAyar,
  tur: OtoCagriTuru,
  gun: string,
  saat: string,
  gecmis: OtoCagriKaydi[],
): { kalem: OtoCagriKalem; uid: string } | { atla: "kapali" | "erken" | "liste" | "atlandi" | "gonderildi" | "gonderen" | "izinsiz" | "denendi" } => {
  if (!a.acik) return { atla: "kapali" };
  const kalem = a.kalemler.find((k) => k.tur === tur && k.gonderim === gun);
  if (!kalem) {
    // Haftalık yalnız ayardaki gününde beklenir; liste uyarısı günde bir kez.
    const vakit = tur === "haftalik" ? (haftaninGunu(gun) === a.zaman.hpGun ? a.zaman.hp : "") : a.zaman.nd;
    if (!vakit || saat < vakit || gecmis.some((g) => g.tur === tur && g.tarih === gun && g.hata === "liste")) return { atla: "erken" };
    return { atla: "liste" };
  }
  if (saat < kalem.saat) return { atla: "erken" };
  if (a.atla.includes(kalem.etiket)) return { atla: "atlandi" };
  const onceki = gecmis.filter((g) => g.etiket === kalem.etiket);
  if (a.gonderildi.includes(kalem.etiket) || onceki.some((g) => g.tamam)) return { atla: "gonderildi" };
  // Belirsiz biten deneme yinelenmez: çağrı bütün muhabirlere ikinci kez gidebilirdi.
  if (onceki.length >= DENEME_SINIRI || onceki.some((g) => g.belirsiz)) return { atla: "denendi" };
  const uid = gununGondereni(a, gun, kalem);
  if (!uid) {
    // Sebep geçmişe bir kez yazılır; görevli var ama izin vermemişse ayrı söylenir.
    const neden = kalem.gorevli ? "izinsiz" : "gonderen";
    return onceki.some((g) => g.hata === neden) ? { atla: "denendi" } : { atla: neden };
  }
  return { kalem, uid };
};

export const GECMIS_SINIRI = 40;
export const gecmiseEkle = (gecmis: OtoCagriKaydi[], k: OtoCagriKaydi) => [k, ...gecmis].slice(0, GECMIS_SINIRI);
