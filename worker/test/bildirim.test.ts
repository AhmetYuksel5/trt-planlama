import assert from "node:assert/strict";
import { test } from "node:test";
import { aboneEkle, aboneleriOku, b64uCoz, gonder, pushAdresiUygun, vapidAl, yeniOneriYuku, yukSifrele, type Abonelik } from "../src/bildirim.ts";

/* Web Push (worker/src/bildirim.ts): şifreleme alıcıda RFC 8291'e göre çözülüyor mu, VAPID imzası, abonelik kuralları. */

const kvYap = () => {
  const m = new Map<string, string>();
  return { m, get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => void m.set(k, v) };
};
const b64u = (b: ArrayBuffer | Uint8Array) => Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b)).toString("base64url");

const tarayici = async () => {
  const c = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return { c, p256dh: b64u(await crypto.subtle.exportKey("raw", c.publicKey)), auth: b64u(auth), authHam: auth };
};

const hkdf = async (tuz: Uint8Array, ikm: Uint8Array, bilgi: Uint8Array, n: number) =>
  new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: tuz, info: bilgi }, await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]), n * 8));
const yz = (s: string) => new TextEncoder().encode(s);

/* Tarayıcının yaptığı çözme (RFC 8291 §3.4), kapıdaki koddan bağımsız yazıldı. */
const coz = async (govde: Uint8Array, t: Awaited<ReturnType<typeof tarayici>>) => {
  const tuz = govde.slice(0, 16);
  const idlen = govde[20];
  const asAcik = govde.slice(21, 21 + idlen);
  const sifreli = govde.slice(21 + idlen);
  const asAnahtar = await crypto.subtle.importKey("raw", asAcik, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ortak = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asAnahtar }, t.c.privateKey, 256));
  const uaAcik = b64uCoz(t.p256dh);
  const bilgi = new Uint8Array([...yz("WebPush: info\0"), ...uaAcik, ...asAcik]);
  const ikm = await hkdf(t.authHam, ortak, bilgi, 32);
  const cek = await hkdf(tuz, ikm, yz("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(tuz, ikm, yz("Content-Encoding: nonce\0"), 12);
  const duz = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]), sifreli));
  assert.equal(duz[duz.length - 1], 2, "son kaydın ayracı");
  return new TextDecoder().decode(duz.slice(0, -1));
};

test("yük şifrelenip tarayıcıda çözülüyor", async () => {
  const t = await tarayici();
  const yuk = JSON.stringify({ baslik: "مقترح خبر جديد", metin: "عنوان" });
  const govde = await yukSifrele(yuk, t.p256dh, t.auth);
  assert.equal(new DataView(govde.buffer).getUint32(16), 4096);
  assert.equal(await coz(govde, t), yuk);
});

test("push adresi yalnız bilinen servisler", () => {
  assert.ok(pushAdresiUygun("https://fcm.googleapis.com/fcm/send/abc"));
  assert.ok(pushAdresiUygun("https://web.push.apple.com/QGx"));
  assert.ok(!pushAdresiUygun("http://fcm.googleapis.com/x"));
  assert.ok(!pushAdresiUygun("https://ornek.com/fcm.googleapis.com"));
  assert.ok(!pushAdresiUygun("https://169.254.169.254/"));
});

test("gönderim: VAPID imzası, 410 silinir, kısıtlıya öneri gitmez (çağıran süzer), kişi başına beş cihaz", async () => {
  const kv = kvYap();
  const t = await tarayici();
  const ab = (n: number, uid = "u1"): Abonelik => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${n}`, p256dh: t.p256dh, auth: t.auth, uid, kisitli: false, dil: "ar", zaman: n });
  for (let i = 1; i <= 6; i++) await aboneEkle(kv, ab(i));
  assert.equal((await aboneleriOku(kv)).length, 5, "en eski cihaz düştü");
  const v = await vapidAl(kv);
  const istekler: { url: string; basliklar: Record<string, string>; govde: Uint8Array }[] = [];
  const sahte = (async (url: string, o: RequestInit) => {
    istekler.push({ url, basliklar: o.headers as Record<string, string>, govde: o.body as Uint8Array });
    return new Response(null, { status: url.endsWith("/3") ? 410 : 201 });
  }) as typeof fetch;
  const r = await gonder(kv, undefined, await aboneleriOku(kv), (a) => yeniOneriYuku(a, "عنوان", "Planlama", "o1"), sahte, Date.now());
  assert.deepEqual(r, { giden: 4, hata: 0, silinen: 1 });
  assert.equal((await aboneleriOku(kv)).length, 4);
  const ilk = istekler[0];
  assert.equal(ilk.basliklar["content-encoding"], "aes128gcm");
  const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(ilk.basliklar.authorization)!;
  assert.equal(k, v.acik);
  const [b, g, imza] = jwt.split(".");
  const acik = await crypto.subtle.importKey("raw", b64uCoz(k), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  assert.ok(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, acik, b64uCoz(imza), yz(`${b}.${g}`)), "imza doğrulanıyor");
  assert.equal(JSON.parse(Buffer.from(g, "base64url").toString()).aud, "https://fcm.googleapis.com");
  const yuk = JSON.parse(await coz(ilk.govde, t));
  assert.equal(yuk.baslik, "مقترح خبر جديد");
  assert.equal(yuk.yol, "#/oneriler/o1");
  // Anahtar ikinci kez üretilmez.
  assert.equal((await vapidAl(kv)).acik, v.acik);
});
