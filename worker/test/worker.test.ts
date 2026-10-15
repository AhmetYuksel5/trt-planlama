import assert from "node:assert/strict";
import { test } from "node:test";
import { ayarBirlestir, bosAyar, type Ayar } from "../src/ayar.ts";
import { isle, type Bagimlilik, type Env } from "../src/index.ts";

/*
 * Worker'ın uçtan uca davranışı: gerçek RSA imzalı oturum belgesiyle,
 * Firestore, Claude ve OpenAI uyumlu uç sahte fetch'le. Ağa çıkılmıyor.
 */

const PROJE = "deneme-proje";
const KOKEN = "https://plannersflow.net";
const SIMDI = Date.UTC(2026, 9, 14, 9, 0, 0);

const ciftler = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const acik = { ...(await crypto.subtle.exportKey("jwk", ciftler.publicKey)), kid: "k1" };
const yabanci = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);

const b64u = (b: Uint8Array | string) => Buffer.from(b).toString("base64url");
const belge = async (uid: string, o: { anahtar?: CryptoKey; aud?: string; exp?: number } = {}) => {
  const bas = b64u(JSON.stringify({ alg: "RS256", kid: "k1", typ: "JWT" }));
  const s = Math.floor(SIMDI / 1000);
  const yuk = b64u(JSON.stringify({ sub: uid, aud: o.aud ?? PROJE, iss: `https://securetoken.google.com/${o.aud ?? PROJE}`, iat: s - 10, exp: o.exp ?? s + 3600, email: `${uid}@ornek.test` }));
  const imza = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", o.anahtar ?? ciftler.privateKey, new TextEncoder().encode(`${bas}.${yuk}`)));
  return `${bas}.${yuk}.${b64u(imza)}`;
};

const KISILER: Record<string, { birim: string; yonetici?: boolean; pasif?: boolean }> = {
  yon: { birim: "planlama", yonetici: true },
  pl: { birim: "planlama" },
  nd: { birim: "newsdesk" },
  pas: { birim: "planlama", pasif: true },
};

const kur = () => {
  const depo = new Map<string, string>();
  const env: Env = {
    YZ: { get: async (k) => depo.get(k) ?? null, put: async (k, v) => void depo.set(k, v) },
    FIREBASE_PROJE: PROJE,
    KOKENLER: KOKEN,
  };
  const istekler: { url: string; govde: any; basliklar: Record<string, string> }[] = [];
  let saglayiciYaniti: { durum: number; govde: unknown } = { durum: 200, govde: null };
  const sahteFetch = (async (girdi: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(girdi as RequestInfo, init);
    const url = req.url;
    if (url.startsWith("https://firestore.googleapis.com/")) {
      const uid = decodeURIComponent(url.split("/").pop()!);
      const k = KISILER[uid];
      if (!k) return new Response("{}", { status: 404 });
      return Response.json({ fields: { pasif: { booleanValue: !!k.pasif }, hesapYoneticisi: { booleanValue: !!k.yonetici }, j: { stringValue: JSON.stringify({ id: uid, birim: k.birim }) } } });
    }
    const govde = req.method === "POST" ? await req.json() : null;
    istekler.push({ url, govde, basliklar: Object.fromEntries(req.headers) });
    if (saglayiciYaniti.govde) return Response.json(saglayiciYaniti.govde, { status: saglayiciYaniti.durum });
    if (url === "https://api.anthropic.com/v1/messages?beta=true" || url === "https://api.anthropic.com/v1/messages")
      return Response.json({ id: "m1", type: "message", role: "assistant", model: govde.model, content: [{ type: "text", text: "  سطر قصير  " }], stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 } });
    if (url === "https://api.ornek.test/v1/chat/completions") return Response.json({ choices: [{ message: { content: "سطر من مزود آخر" } }] });
    // OpenAI'ın yeni modelleri gibi: max_tokens reddediliyor, max_completion_tokens isteniyor
    if (url === "https://api.yeni.test/v1/chat/completions")
      return "max_tokens" in govde
        ? Response.json({ error: { message: "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead." } }, { status: 400 })
        : Response.json({ choices: [{ message: { content: "سطر من نموذج جديد" } }] });
    if (url === "https://api.yok.test/v1/chat/completions") return Response.json({ error: { message: "The model `yok-model` does not exist" } }, { status: 404 });
    return new Response("yok", { status: 404 });
  }) as typeof fetch;
  const d: Bagimlilik = { fetch: sahteFetch, simdi: () => SIMDI, anahtarBul: async (kid) => (kid === "k1" ? acik : undefined) };
  const cagir = async (yol: string, uid: string | null, govde?: unknown, method = govde === undefined ? "GET" : "POST", b?: string) =>
    isle(
      new Request(`https://yz.plannersflow.net${yol}`, {
        method,
        headers: { origin: KOKEN, ...(uid || b ? { authorization: `Bearer ${b ?? (await belge(uid!))}` } : {}), "content-type": "application/json" },
        body: govde === undefined ? undefined : JSON.stringify(govde),
      }),
      env,
      d,
    );
  return { depo, env, d, cagir, istekler, saglayiciYaniti: (y: typeof saglayiciYaniti) => (saglayiciYaniti = y) };
};

const AYAR = {
  saglayicilar: [
    { id: "claude", ad: "Claude", tur: "anthropic", model: "claude-opus-5-5", anahtar: "sk-ant-gizli-1234" },
    { id: "diger", ad: "Diğer", tur: "openai", adres: "https://api.ornek.test/v1/", model: "ornek-model", anahtar: "sk-diger-5678" },
  ],
  ozellikler: { kisalt: { acik: true, saglayici: "claude", birimler: ["planlama"], gunlukSinir: 2 } },
};

test("oturum: imzasız, yabancı anahtarla, süresi geçmiş, başka proje reddedilir", async () => {
  const t = kur();
  assert.equal((await t.cagir("/durum", null)).status, 401);
  assert.equal((await t.cagir("/durum", null, undefined, "GET", await belge("pl", { anahtar: yabanci.privateKey }))).status, 401);
  assert.equal((await t.cagir("/durum", null, undefined, "GET", await belge("pl", { exp: Math.floor(SIMDI / 1000) - 3600 }))).status, 401);
  assert.equal((await t.cagir("/durum", null, undefined, "GET", await belge("pl", { aud: "baska-proje" }))).status, 401);
  assert.equal((await t.cagir("/durum", null, undefined, "GET", "a.b.c")).status, 401);
  // Kayıtsız ve pasif kişi
  assert.equal((await t.cagir("/durum", "yok")).status, 403);
  assert.equal((await t.cagir("/durum", "pas")).status, 403);
  assert.equal((await t.cagir("/durum", "pl")).status, 200);
});

test("CORS: izinli köken yanıtta, başkası ön istekte reddedilir", async () => {
  const t = kur();
  const r = await t.cagir("/durum", "pl");
  assert.equal(r.headers.get("access-control-allow-origin"), KOKEN);
  const on = await isle(new Request("https://yz.plannersflow.net/durum", { method: "OPTIONS", headers: { origin: "https://kotu.test" } }), t.env, t.d);
  assert.equal(on.status, 403);
});

test("ayar yalnız tam yöneticide; anahtar tarayıcıya gitmez, boş bırakılınca korunur", async () => {
  const t = kur();
  assert.equal((await t.cagir("/ayar", "pl")).status, 403);
  assert.equal((await t.cagir("/ayar", "pl", AYAR, "PUT")).status, 403);
  const yaz = await t.cagir("/ayar", "yon", AYAR, "PUT");
  assert.equal(yaz.status, 200);
  const oku = await (await t.cagir("/ayar", "yon")).json();
  assert.ok(!JSON.stringify(oku).includes("gizli"), "anahtar yanıtta yok");
  assert.equal(oku.saglayicilar[0].anahtarSonu, "1234");
  assert.equal(oku.saglayicilar[1].adres, "https://api.ornek.test/v1", "sondaki eğik çizgi kalkar");
  // Anahtarsız kayıt eskisini korur, boş metin siler
  const ikinci = structuredClone(AYAR) as any;
  delete ikinci.saglayicilar[0].anahtar;
  ikinci.saglayicilar[1].anahtar = "";
  await t.cagir("/ayar", "yon", ikinci, "PUT");
  const depodaki: Ayar = JSON.parse(t.depo.get("ayar")!);
  assert.equal(depodaki.saglayicilar[0].anahtar, "sk-ant-gizli-1234");
  assert.equal(depodaki.saglayicilar[1].anahtar, undefined);
});

test("ayar denetimi: http adres, bilinmeyen tür, olmayan sağlayıcı reddedilir", () => {
  const e = bosAyar();
  const k = (x: unknown) => ("hata" in ayarBirlestir(e, x) ? (ayarBirlestir(e, x) as { hata: string }).hata : "tamam");
  assert.equal(k({ saglayicilar: [{ id: "a", tur: "openai", adres: "http://ornek.test/v1", model: "m" }] }), "adres");
  assert.equal(k({ saglayicilar: [{ id: "a", tur: "baska", model: "m" }] }), "tur");
  assert.equal(k({ saglayicilar: [{ id: "a", tur: "anthropic", model: "" }] }), "model");
  assert.equal(k({ saglayicilar: [{ id: "A B", tur: "anthropic", model: "m" }] }), "kimlik");
  assert.equal(k({ saglayicilar: [], ozellikler: { kisalt: { acik: true, saglayici: "yok" } } }), "saglayici");
  assert.equal(k({ saglayicilar: [{ id: "a", tur: "anthropic", model: "m" }], ozellikler: { kisalt: { acik: true, saglayici: "a", gunlukSinir: 5 } } }), "tamam");
});

test("kısalt: Claude'a SDK ile gider, birim süzgeci ve günlük sınır işler", async () => {
  const t = kur();
  await t.cagir("/ayar", "yon", AYAR, "PUT");
  // Newsdesk listede değil
  const nd = await (await t.cagir("/durum", "nd")).json();
  assert.deepEqual(nd.ozellikler, {});
  assert.equal((await t.cagir("/calistir", "nd", { ozellik: "kisalt", girdi: { metin: "نص" } })).status, 403);
  const durum = await (await t.cagir("/durum", "pl")).json();
  assert.deepEqual(durum.ozellikler.kisalt, { sinir: 2, kalan: 2 });
  const r = await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص طويل عن التطورات في المنطقة" } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.sonuc, "سطر قصير");
  assert.equal(j.kalan, 1);
  const istek = t.istekler.at(-1)!;
  assert.match(istek.url, /^https:\/\/api\.anthropic\.com\/v1\/messages/);
  assert.equal(istek.basliklar["x-api-key"], "sk-ant-gizli-1234");
  assert.match(istek.basliklar["anthropic-beta"], /server-side-fallback-2026-07-01/);
  assert.equal(istek.govde.fallbacks, "default");
  assert.equal(istek.govde.model, "claude-opus-5-5");
  assert.deepEqual(istek.govde.output_config, { effort: "low" });
  assert.equal(istek.govde.messages[0].content, "نص طويل عن التطورات في المنطقة");
  await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } });
  const ucuncu = await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } });
  assert.equal(ucuncu.status, 429, "günlük sınır doldu");
  // Tam yönetici birim süzgecinden bağımsız; toplam kullanım ayarda
  assert.equal((await t.cagir("/calistir", "yon", { ozellik: "kisalt", girdi: { metin: "نص" } })).status, 200);
  const ayar = await (await t.cagir("/ayar", "yon")).json();
  assert.equal(ayar.kullanim.kisalt, 3);
});

test("OpenAI uyumlu sağlayıcı, red ve anahtar hatası", async () => {
  const t = kur();
  const a = structuredClone(AYAR) as any;
  a.ozellikler.kisalt.saglayici = "diger";
  a.ozellikler.kisalt.gunlukSinir = 10;
  await t.cagir("/ayar", "yon", a, "PUT");
  const r = await (await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } })).json();
  assert.equal(r.sonuc, "سطر من مزود آخر");
  const istek = t.istekler.at(-1)!;
  assert.equal(istek.url, "https://api.ornek.test/v1/chat/completions");
  assert.equal(istek.basliklar.authorization, "Bearer sk-diger-5678");
  assert.equal(istek.govde.messages[0].role, "system");
  t.saglayiciYaniti({ durum: 401, govde: { error: "bad key" } });
  const h = await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } });
  assert.equal(h.status, 502);
  assert.equal((await h.json()).hata, "anahtar");
  // Claude reddi
  a.ozellikler.kisalt.saglayici = "claude";
  t.saglayiciYaniti({ durum: 200, govde: null });
  await t.cagir("/ayar", "yon", a, "PUT");
  t.saglayiciYaniti({ durum: 200, govde: { id: "m", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: "refusal", stop_details: { type: "refusal", category: null, explanation: null }, usage: { input_tokens: 1, output_tokens: 0 } } });
  const red = await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } });
  assert.equal((await red.json()).hata, "red");
  // Başarısız çağrı hakkı yemez
  const durum = await (await t.cagir("/durum", "pl")).json();
  assert.equal(durum.ozellikler.kisalt.kalan, 9);
});

test("girdi denetimi ve kapalı özellik", async () => {
  const t = kur();
  assert.equal((await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } })).status, 403, "ayar yokken kapalı");
  await t.cagir("/ayar", "yon", AYAR, "PUT");
  assert.equal((await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "" } })).status, 400);
  assert.equal((await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "x".repeat(5000) } })).status, 400);
  assert.equal((await t.cagir("/calistir", "pl", { ozellik: "baska", girdi: { metin: "x" } })).status, 400);
  const kapali = structuredClone(AYAR) as any;
  kapali.saglayicilar[0].aktif = false;
  await t.cagir("/ayar", "yon", kapali, "PUT");
  assert.equal((await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } })).status, 403, "sağlayıcı kapalıyken");
});

test("OpenAI yeni model: max_tokens reddedilince max_completion_tokens; Dene sağlayıcının hata metnini döndürür", async () => {
  const t = kur();
  const a = {
    saglayicilar: [
      { id: "yeni", ad: "Yeni", tur: "openai", adres: "https://api.yeni.test/v1", model: "yeni-mini", anahtar: "sk-1" },
      { id: "yok", ad: "Yok", tur: "openai", adres: "https://api.yok.test/v1", model: "yok-model", anahtar: "sk-2" },
    ],
    ozellikler: { kisalt: { acik: true, saglayici: "yeni", birimler: [], gunlukSinir: 5 } },
  };
  await t.cagir("/ayar", "yon", a, "PUT");
  const r = await (await t.cagir("/calistir", "pl", { ozellik: "kisalt", girdi: { metin: "نص" } })).json();
  assert.equal(r.sonuc, "سطر من نموذج جديد");
  const son = t.istekler.filter((x) => x.url.includes("api.yeni.test"));
  assert.equal(son.length, 2, "bir kez max_tokens, bir kez max_completion_tokens");
  assert.ok("max_completion_tokens" in son[1].govde && !("max_tokens" in son[1].govde));
  assert.equal((await (await t.cagir("/dene", "yon", { saglayici: "yeni" })).json()).tamam, true);
  const h = await (await t.cagir("/dene", "yon", { saglayici: "yok" })).json();
  assert.equal(h.hata, "saglayici");
  assert.match(h.ayrinti, /404 The model `yok-model` does not exist/);
});
