import { coz, sifrele } from "./gizli.ts";

/*
 * Haber merkezinin rota tablosu (Google Sheets, "Newsroom Rota"): Next Day ekibi
 * staffing postası yerine buradan da gelir (kullanıcı: staffing'i tablodan çeksin,
 * günde bir okuma). Tablo herkese açılmıyor: Google Cloud'daki yalnız okuma
 * yetkili hizmet hesabıyla paylaşılıyor; hesabın anahtarı tam yöneticinin
 * Ayarlar'da girdiği KV kaydında, özel anahtar şifreli (gizli.ts). Kapı yine
 * yazmıyor: günün satırlarını döndürüyor, ekip önizlemede onaylanıp tarayıcıdan
 * yazılıyor (staffing.ts → rotaKayitlari).
 *
 * Tablo düzeni: dört haftalık sekmeler ("2026: NOV16-DEC13"); 1. satır tarihler
 * ("16.11.2026"), 2. satır gün adları; A ünvan ya da grup başlığı, B vardiya
 * ("0700-1800"), her gün sütununda o vardiyadaki kişi. Kapı yalnız istenen günün
 * sütununu A ve B ile döndürür: tablonun gerisi tarayıcıya gitmez.
 */

export interface RotaAyar {
  tabloId: string;
  /** Sunucuların ayrı tablosu (kullanıcı: sunucular başka tablodan); boşsa yok. */
  sunucuTabloId: string;
  istemciEposta: string;
  /** Hizmet hesabının PEM özel anahtarı; KV'de şifreli. */
  ozelAnahtar: string;
}
export const ROTA_AYAR_ANAHTARI = "rota-ayar";
export const bosRotaAyar = (): RotaAyar => ({ tabloId: "", sunucuTabloId: "", istemciEposta: "", ozelAnahtar: "" });
export const rotaGorunur = (a: RotaAyar) => ({ tabloId: a.tabloId, sunucuTabloId: a.sunucuTabloId, istemciEposta: a.istemciEposta, anahtarVar: !!a.ozelAnahtar });
export type RotaTuru = "rota" | "sunucu";

/* Tablonun adresi ya da kimliği. */
export const tabloKimligi = (s: string): string => {
  const m = s.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/);
  const id = m ? m[1] : s.trim();
  return /^[A-Za-z0-9_-]{20,100}$/.test(id) ? id : "";
};

/*
 * Tam yöneticinin girdiği: tablo adresi ve Google'ın indirdiği hizmet hesabı JSON'u
 * (yalnız client_email ve private_key alınır). JSON gönderilmezse eskisi kalır, null siler.
 */
export const rotaAyarBirlestir = (eski: RotaAyar, gelen: unknown): { ayar: RotaAyar } | { hata: string } => {
  if (!gelen || typeof gelen !== "object") return { hata: "govde" };
  const g = gelen as Record<string, unknown>;
  let tabloId = eski.tabloId;
  if (typeof g.tablo === "string") {
    tabloId = g.tablo.trim() ? tabloKimligi(g.tablo) : "";
    if (g.tablo.trim() && !tabloId) return { hata: "tablo" };
  }
  let sunucuTabloId = eski.sunucuTabloId ?? "";
  if (typeof g.sunucuTablo === "string") {
    sunucuTabloId = g.sunucuTablo.trim() ? tabloKimligi(g.sunucuTablo) : "";
    if (g.sunucuTablo.trim() && !sunucuTabloId) return { hata: "tablo" };
  }
  let { istemciEposta, ozelAnahtar } = eski;
  if (g.hesap === null) [istemciEposta, ozelAnahtar] = ["", ""];
  else if (typeof g.hesap === "string" && g.hesap.trim()) {
    let j: { client_email?: unknown; private_key?: unknown };
    try {
      j = JSON.parse(g.hesap);
    } catch {
      return { hata: "hesap" };
    }
    if (typeof j.client_email !== "string" || !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(j.client_email)) return { hata: "hesap" };
    if (typeof j.private_key !== "string" || !j.private_key.includes("BEGIN PRIVATE KEY")) return { hata: "hesap" };
    [istemciEposta, ozelAnahtar] = [j.client_email, j.private_key];
  }
  return { ayar: { tabloId, sunucuTabloId, istemciEposta, ozelAnahtar } };
};

export const rotaAyarOku = async (kv: { get(k: string): Promise<string | null> }, anahtar?: string): Promise<RotaAyar> => {
  const ham = await kv.get(ROTA_AYAR_ANAHTARI);
  if (!ham) return bosRotaAyar();
  try {
    const a = { ...bosRotaAyar(), ...(JSON.parse(ham) as Partial<RotaAyar>) };
    return { ...a, ozelAnahtar: await coz(a.ozelAnahtar, anahtar) };
  } catch {
    return bosRotaAyar();
  }
};
export const rotaAyarYaz = async (kv: { put(k: string, v: string): Promise<void> }, a: RotaAyar, anahtar?: string) =>
  kv.put(ROTA_AYAR_ANAHTARI, JSON.stringify({ ...a, ozelAnahtar: await sifrele(a.ozelAnahtar, anahtar) }));

/* --- Google erişimi: hizmet hesabının JWT'si (RS256) ile kısa ömürlü erişim anahtarı --- */

const b64url = (b: Uint8Array | string) =>
  btoa(typeof b === "string" ? unescape(encodeURIComponent(b)) : String.fromCharCode(...b))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const pemCoz = (pem: string) => Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\\n/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));

export const KAPSAM = "https://www.googleapis.com/auth/spreadsheets.readonly";
const TOKEN_ADRESI = "https://oauth2.googleapis.com/token";

export const jwtKur = async (eposta: string, pem: string, simdi: number): Promise<string> => {
  const an = Math.floor(simdi / 1000);
  const govde = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({ iss: eposta, scope: KAPSAM, aud: TOKEN_ADRESI, iat: an, exp: an + 3600 }))}`;
  const anahtar = await crypto.subtle.importKey("pkcs8", pemCoz(pem), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const imza = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", anahtar, new TextEncoder().encode(govde)));
  return `${govde}.${b64url(imza)}`;
};

export const erisimAl = async (a: RotaAyar, f: typeof fetch, simdi: number): Promise<{ anahtar: string } | { hata: string; ayrinti?: string }> => {
  let jwt: string;
  try {
    jwt = await jwtKur(a.istemciEposta, a.ozelAnahtar, simdi);
  } catch {
    return { hata: "anahtar" };
  }
  const r = await f(TOKEN_ADRESI, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}` });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; error_description?: string; error?: string };
  return r.ok && j.access_token ? { anahtar: j.access_token } : { hata: "google", ayrinti: `${r.status} ${j.error_description ?? j.error ?? ""}`.trim().slice(0, 200) };
};

/* --- Sekme ve gün --- */

const AYLAR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const iki = (n: number) => String(n).padStart(2, "0");

/* "2026: NOV16-DEC13", "2026: DEC14-2027:JAN10", "2026:JUL27-AUG23" → başlangıç ve bitiş günü. */
export const sekmeAraligi = (ad: string): { bas: string; bit: string } | null => {
  const m = ad.toUpperCase().match(/(\d{4})\s*:\s*([A-Z]{3,})\s*(\d{1,2})\s*-\s*(?:(\d{4})\s*:\s*)?([A-Z]{3,})\s*(\d{1,2})/);
  if (!m) return null;
  const a1 = AYLAR.indexOf(m[2].slice(0, 3));
  const a2 = AYLAR.indexOf(m[5].slice(0, 3));
  if (a1 < 0 || a2 < 0) return null;
  const y1 = Number(m[1]);
  const y2 = m[4] ? Number(m[4]) : a2 < a1 ? y1 + 1 : y1;
  return { bas: `${y1}-${iki(a1 + 1)}-${iki(Number(m[3]))}`, bit: `${y2}-${iki(a2 + 1)}-${iki(Number(m[6]))}` };
};

export const sekmeSec = (adlar: string[], tarih: string): string | undefined =>
  adlar.find((ad) => {
    const r = sekmeAraligi(ad);
    return !!r && r.bas <= tarih && tarih <= r.bit;
  });

/*
 * Satırda günün sütunu: "16.11.2026", "16/11/2026", "2026-11-16" ya da sunucular
 * tablosundaki gibi yılsız "16 November" (yıl sekmeden belli).
 */
export const gunSutunu = (satir: string[], tarih: string): number => {
  const [y, a, g] = tarih.split("-").map(Number);
  return satir.findIndex((h) => {
    const t = String(h ?? "").trim();
    const m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) return Number(m[1]) === g && Number(m[2]) === a && Number(m[3]) === y;
    const n = t.toUpperCase().match(/^(\d{1,2})\s+([A-Z]{3,})$/);
    if (n) return Number(n[1]) === g && AYLAR.indexOf(n[2].slice(0, 3)) === a - 1;
    return t === tarih;
  });
};

/*
 * Günün satırları: [A, B, o günün hücresi]; tamamen boş satır atlanır. Tarih
 * satırı ilk on satırda aranır (Newsroom Rota'da 1., sunucularda 5. satır), altı
 * gün adları. Sunucular tablosunda B ilk günün sütunu: başka günün adı
 * tarayıcıya gitmesin diye boş döner.
 */
export const rotaGunu = (degerler: string[][], tarih: string, tur: RotaTuru = "rota"): [string, string, string][] | null => {
  const enAz = tur === "sunucu" ? 1 : 2;
  const r = degerler.slice(0, 10).findIndex((satir) => gunSutunu(satir ?? [], tarih) >= enAz);
  if (r < 0) return null;
  const s = gunSutunu(degerler[r], tarih);
  return degerler
    .slice(r + 2)
    .map((x) => [String(x[0] ?? "").trim(), tur === "sunucu" ? "" : String(x[1] ?? "").trim(), String(x[s] ?? "").trim()] as [string, string, string])
    .filter((x) => x[0] || x[1] || x[2]);
};

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";

export const rotaOku = async (a: RotaAyar, tarih: string, f: typeof fetch, simdi: number, tur: RotaTuru = "rota"): Promise<{ sekme: string; satirlar: [string, string, string][] } | { hata: string; ayrinti?: string }> => {
  const tabloId = tur === "sunucu" ? a.sunucuTabloId : a.tabloId;
  if (!tabloId || !a.istemciEposta || !a.ozelAnahtar) return { hata: "eksik" };
  const e = await erisimAl(a, f, simdi);
  if ("hata" in e) return e;
  const h = { authorization: `Bearer ${e.anahtar}` };
  const r = await f(`${SHEETS}/${tabloId}?fields=sheets.properties.title`, { headers: h });
  if (!r.ok) return { hata: r.status === 403 || r.status === 404 ? "paylasim" : "google", ayrinti: String(r.status) };
  const j = (await r.json().catch(() => ({}))) as { sheets?: { properties?: { title?: string } }[] };
  const adlar = (j.sheets ?? []).map((x) => x.properties?.title ?? "").filter(Boolean);
  /*
   * Sekme adı tarih aralığıysa o; değilse (kişinin kendi kopyası: IMPORTRANGE'li
   * "Bu dönem" / "Sonraki dönem" sekmeleri, asıl tabloyu paylaşamayan için) her
   * sekmede gün aranır, en çok dördünde.
   */
  const secilen = sekmeSec(adlar, tarih);
  const adaylar = secilen ? [secilen] : adlar.filter((ad) => !sekmeAraligi(ad)).slice(0, 4);
  if (!adaylar.length) return { hata: "sekme" };
  for (const sekme of adaylar) {
    const v = await f(`${SHEETS}/${tabloId}/values/${encodeURIComponent(`'${sekme.replace(/'/g, "''")}'!A1:AD400`)}?valueRenderOption=FORMATTED_VALUE`, { headers: h });
    if (!v.ok) return { hata: "google", ayrinti: String(v.status) };
    const d = (await v.json().catch(() => ({}))) as { values?: string[][] };
    const satirlar = rotaGunu(d.values ?? [], tarih, tur);
    if (satirlar) return { sekme, satirlar };
  }
  return { hata: secilen ? "gun" : "sekme" };
};
