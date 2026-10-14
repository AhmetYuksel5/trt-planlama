/*
 * Firebase oturum belgesinin (ID token) doğrulanması. Tarayıcı her isteğe
 * kişinin oturum belgesini koyuyor; Worker onu Google'ın açık anahtarlarıyla
 * doğruluyor. Firebase Admin kitaplığı Worker'da çalışmadığı için RS256
 * imzası doğrudan Web Crypto ile denetleniyor.
 */

export interface Kimlik {
  uid: string;
  eposta: string;
}

export type AnahtarBul = (kid: string) => Promise<JsonWebKey | undefined>;

const ANAHTAR_ADRESI = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const b64 = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(t + "=".repeat((4 - (t.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const jsonCoz = (s: string) => JSON.parse(new TextDecoder().decode(b64(s))) as Record<string, unknown>;

/*
 * Anahtarlar Google'da birkaç saatte bir dönüyor; yanıtın max-age'i kadar
 * bellekte tutuluyor. Bilinmeyen kid gelirse (yeni anahtar) bir kez yeniden
 * çekiliyor.
 */
let onbellek: { anahtarlar: Map<string, JsonWebKey>; bitis: number } | null = null;

export const googleAnahtarlari =
  (fetchFn: typeof fetch, simdi: () => number): AnahtarBul =>
  async (kid) => {
    const cek = async () => {
      const r = await fetchFn(ANAHTAR_ADRESI);
      if (!r.ok) throw new Error("anahtarlar alınamadı");
      const yas = Number(/max-age=(\d+)/.exec(r.headers.get("cache-control") ?? "")?.[1] ?? 3600);
      const j = (await r.json()) as { keys: (JsonWebKey & { kid: string })[] };
      onbellek = { anahtarlar: new Map(j.keys.map((k) => [k.kid, k])), bitis: simdi() + yas * 1000 };
    };
    if (!onbellek || onbellek.bitis < simdi()) await cek();
    if (!onbellek!.anahtarlar.has(kid)) await cek();
    return onbellek!.anahtarlar.get(kid);
  };

/** Belge geçerliyse kişinin kimliği, değilse null. Saat kayması için bir dakika pay. */
export const oturumuDogrula = async (belge: string, projeId: string, anahtarBul: AnahtarBul, simdi: number): Promise<Kimlik | null> => {
  const parca = belge.split(".");
  if (parca.length !== 3) return null;
  let bas: Record<string, unknown>, yuk: Record<string, unknown>;
  try {
    bas = jsonCoz(parca[0]);
    yuk = jsonCoz(parca[1]);
  } catch {
    return null;
  }
  if (bas.alg !== "RS256" || typeof bas.kid !== "string") return null;
  const jwk = await anahtarBul(bas.kid);
  if (!jwk) return null;
  const anahtar = await crypto.subtle.importKey("jwk", { ...jwk, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const imzaGecerli = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", anahtar, b64(parca[2]), new TextEncoder().encode(`${parca[0]}.${parca[1]}`));
  if (!imzaGecerli) return null;
  const saniye = Math.floor(simdi / 1000);
  const PAY = 60;
  if (typeof yuk.exp !== "number" || yuk.exp + PAY < saniye) return null;
  if (typeof yuk.iat !== "number" || yuk.iat - PAY > saniye) return null;
  if (yuk.aud !== projeId || yuk.iss !== `https://securetoken.google.com/${projeId}`) return null;
  if (typeof yuk.sub !== "string" || !yuk.sub) return null;
  return { uid: yuk.sub, eposta: typeof yuk.email === "string" ? yuk.email.toLowerCase() : "" };
};
