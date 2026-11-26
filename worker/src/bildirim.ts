import { coz, sifrele } from "./gizli.ts";

/*
 * Web Push bildirimleri (kullanıcı: bazı olaylarda telefona bildirim gitsin; ilk
 * deneme yeni haber önerisi; herkese gitsin ama varsayılan kapalı, tam yönetici
 * açar). Ücretli bir hizmet yok: tarayıcının kendi push servisi (Chrome'da FCM,
 * Safari'de Apple) ve standart VAPID + RFC 8291 şifrelemesi.
 *
 * - VAPID anahtarı kapı kendisi üretir, KV'de POSTA_ANAHTARI ile şifreli tutar;
 *   açık yarısını tarayıcı abone olurken alır.
 * - Abonelikler tek KV kaydında (KV yazışı yalnız abone olunca/bırakınca; ücretsiz
 *   planda günde 1000 yazma sınırı var, gönderim yazmaz).
 * - Gönderim istek başına en çok GONDERIM_SINIRI abonelik: ücretsiz planda bir
 *   istekte 50 dış çağrı.
 */

export interface KVBenzeri {
  get(k: string): Promise<string | null>;
  put(k: string, v: string, o?: { expirationTtl?: number }): Promise<void>;
}

export interface Abonelik {
  endpoint: string;
  p256dh: string;
  auth: string;
  uid: string;
  /** Kısıtlı kişi (dış muhabir, onay bekleyen) başkasının önerisini almaz. */
  kisitli: boolean;
  dil: "tr" | "ar" | "en";
  zaman: number;
}
export interface BildirimAyar {
  acik: boolean;
}

const AYAR = "bildirim:ayar";
const ABONELER = "bildirim:aboneler";
const VAPID = "bildirim:vapid";
export const GONDERIM_SINIRI = 45;

/* Yalnız bilinen push servisleri: kapı, istekteki adrese körlemesine istek atmasın. */
const PUSH_ALANLARI = [/\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.push\.apple\.com$/, /\.notify\.windows\.com$/];
export const pushAdresiUygun = (u: string) => {
  try {
    const a = new URL(u);
    return a.protocol === "https:" && PUSH_ALANLARI.some((r) => r.test(a.hostname));
  } catch {
    return false;
  }
};

const b64u = (b: ArrayBuffer | Uint8Array) => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const b64uCoz = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  const ham = atob(t + "=".repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(ham, (c) => c.charCodeAt(0));
};
const birlestir = (...p: Uint8Array[]) => {
  const out = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let i = 0;
  for (const x of p) (out.set(x, i), (i += x.length));
  return out;
};
const yazi = (s: string) => new TextEncoder().encode(s);

export const ayarOku = async (kv: KVBenzeri): Promise<BildirimAyar> => {
  const j = JSON.parse((await kv.get(AYAR)) ?? "{}") as Partial<BildirimAyar>;
  return { acik: j.acik === true };
};
export const ayarYaz = (kv: KVBenzeri, a: BildirimAyar) => kv.put(AYAR, JSON.stringify({ acik: a.acik === true }));

export const aboneleriOku = async (kv: KVBenzeri): Promise<Abonelik[]> => {
  try {
    const j = JSON.parse((await kv.get(ABONELER)) ?? "[]");
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
};
const aboneleriYaz = (kv: KVBenzeri, l: Abonelik[]) => kv.put(ABONELER, JSON.stringify(l));

export const aboneEkle = async (kv: KVBenzeri, a: Abonelik) => {
  const l = (await aboneleriOku(kv)).filter((x) => x.endpoint !== a.endpoint);
  l.push(a);
  // Kişi başına en çok beş cihaz; eskisi düşer.
  const kisinin = l.filter((x) => x.uid === a.uid).sort((x, y) => y.zaman - x.zaman);
  const dusen = new Set(kisinin.slice(5).map((x) => x.endpoint));
  await aboneleriYaz(kv, l.filter((x) => !dusen.has(x.endpoint)));
};
export const aboneCikar = async (kv: KVBenzeri, endpoint: string, uid: string) => {
  const l = await aboneleriOku(kv);
  const kalan = l.filter((x) => !(x.endpoint === endpoint && x.uid === uid));
  if (kalan.length !== l.length) await aboneleriYaz(kv, kalan);
};

/*
 * VAPID anahtarı: yoksa üretilir. Çözülemezse (POSTA_ANAHTARI değişmiş) yenisi
 * üretilir ve eski abonelikler silinir: eski anahtarla açılmış abonelik yeni
 * anahtarla gönderilemez, tarayıcı yeniden abone olur.
 */
export const vapidAl = async (kv: KVBenzeri, gizli?: string): Promise<{ acik: string; ozel: CryptoKey }> => {
  const kayit = JSON.parse((await kv.get(VAPID)) ?? "null") as { acik: string; jwk: string } | null;
  if (kayit) {
    const jwk = await coz(kayit.jwk, gizli);
    if (jwk) {
      const ozel = await crypto.subtle.importKey("jwk", JSON.parse(jwk), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
      return { acik: kayit.acik, ozel };
    }
  }
  const cift = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const acik = b64u((await crypto.subtle.exportKey("raw", cift.publicKey)) as ArrayBuffer);
  const jwk = JSON.stringify(await crypto.subtle.exportKey("jwk", cift.privateKey));
  await kv.put(VAPID, JSON.stringify({ acik, jwk: await sifrele(jwk, gizli) }));
  if (kayit) await aboneleriYaz(kv, []);
  return { acik, ozel: cift.privateKey };
};

const vapidBasligi = async (endpoint: string, v: { acik: string; ozel: CryptoKey }, simdi: number) => {
  const bas = b64u(yazi(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const govde = b64u(yazi(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(simdi / 1000) + 12 * 3600, sub: "https://plannersflow.net" })));
  // WebCrypto ECDSA imzası zaten JOSE'nin istediği 64 baytlık r||s.
  const imza = b64u(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, v.ozel, yazi(`${bas}.${govde}`)));
  return `vapid t=${bas}.${govde}.${imza}, k=${v.acik}`;
};

const hkdf = async (tuz: Uint8Array, ikm: Uint8Array, bilgi: Uint8Array, bayt: number) => {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: tuz, info: bilgi }, k, bayt * 8));
};

/** RFC 8291 (aes128gcm): yükü aboneliğin anahtarıyla şifreler. */
export const yukSifrele = async (yuk: string, p256dh: string, auth: string, tuz = crypto.getRandomValues(new Uint8Array(16))) => {
  const uaAcik = b64uCoz(p256dh);
  const gizliAuth = b64uCoz(auth);
  const as = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const asAcik = new Uint8Array((await crypto.subtle.exportKey("raw", as.publicKey)) as ArrayBuffer);
  const uaAnahtar = await crypto.subtle.importKey("raw", uaAcik, { name: "ECDH", namedCurve: "P-256" }, false, []);
  // Cloudflare'in tip tanımı alanı "$public" diye yazıyor; çalışma anı WebCrypto'nun "public"ini bekliyor.
  const ecdh = { name: "ECDH", public: uaAnahtar } as unknown as Parameters<typeof crypto.subtle.deriveBits>[0];
  const ortak = new Uint8Array(await crypto.subtle.deriveBits(ecdh, as.privateKey, 256));
  const ikm = await hkdf(gizliAuth, ortak, birlestir(yazi("WebPush: info\0"), uaAcik, asAcik), 32);
  const cek = await hkdf(tuz, ikm, yazi("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(tuz, ikm, yazi("Content-Encoding: nonce\0"), 12);
  const anahtar = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const sifreli = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, anahtar, birlestir(yazi(yuk), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return birlestir(tuz, rs, new Uint8Array([asAcik.length]), asAcik, sifreli);
};

export interface Yuk {
  baslik: string;
  metin: string;
  yol: string;
  etiket?: string;
}

/*
 * Aboneliklere gönderir; 404/410 dönen (tarayıcı aboneliği bırakmış) silinir.
 * Dönen sayılar ekranın bildirimi için.
 */
export const gonder = async (
  kv: KVBenzeri,
  gizli: string | undefined,
  hedefler: Abonelik[],
  yukKur: (a: Abonelik) => Yuk,
  getir: typeof fetch,
  simdi: number,
): Promise<{ giden: number; hata: number; silinen: number }> => {
  const v = await vapidAl(kv, gizli);
  const secilen = hedefler.filter((a) => pushAdresiUygun(a.endpoint)).slice(0, GONDERIM_SINIRI);
  const olu: string[] = [];
  let giden = 0;
  let hata = 0;
  await Promise.all(
    secilen.map(async (a) => {
      try {
        const govde = await yukSifrele(JSON.stringify(yukKur(a)), a.p256dh, a.auth);
        const r = await getir(a.endpoint, {
          method: "POST",
          headers: { authorization: await vapidBasligi(a.endpoint, v, simdi), "content-encoding": "aes128gcm", "content-type": "application/octet-stream", ttl: "86400", urgency: "high" },
          body: govde,
        });
        if (r.status === 404 || r.status === 410) olu.push(a.endpoint);
        else if (r.ok) giden++;
        else hata++;
      } catch {
        hata++;
      }
    }),
  );
  if (olu.length) {
    const l = await aboneleriOku(kv);
    await aboneleriYaz(kv, l.filter((x) => !olu.includes(x.endpoint)));
  }
  return { giden, hata, silinen: olu.length };
};

const YENI_ONERI = { tr: "Yeni haber önerisi", ar: "مقترح خبر جديد", en: "New story pitch" } as const;
const DENEME = { tr: "Plannersflow bildirimleri açık", ar: "إشعارات Plannersflow مفعّلة", en: "Plannersflow notifications are on" } as const;
export const yeniOneriYuku = (a: Abonelik, baslik: string, kaynak: string, oneriId: string): Yuk => ({
  baslik: YENI_ONERI[a.dil] ?? YENI_ONERI.tr,
  metin: [baslik, kaynak].filter(Boolean).join(" · ").slice(0, 180),
  yol: `#/oneriler/${encodeURIComponent(oneriId)}`,
  etiket: `oneri-${oneriId}`,
});
export const denemeYuku = (a: Abonelik): Yuk => ({ baslik: DENEME[a.dil] ?? DENEME.tr, metin: "✓", yol: "#/ayarlar", etiket: "deneme" });
