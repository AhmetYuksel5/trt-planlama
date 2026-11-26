// Gerçek kipte muhabirin takibi (kullanıcı: muhabirler takiplerde mesajı çoğu zaman kaydedemiyor): kodla açılan
// dış muhabir takip açar, takibe gelişme satırı ekler; ikisi de Firestore'a yazılmalı. Emülatörle ve
// önizlemeyle (belgeler/gercek-kip.md; giris-kodu.mjs gibi). Adlar kurgusal.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ADRES = process.env.ADRES ?? "http://localhost:4173/";
const AUTH = "http://127.0.0.1:9099";
const FS = "http://127.0.0.1:8080";
const PROJE = "demo-trt";
const KURUCU = "adminplannersflow@gmail.com";
const SIFRE = "Deneme-12345";
const AYAR = { apiKey: "deneme", authDomain: "", projectId: PROJE, appId: "", emulator: { auth: AUTH, firestoreHost: "127.0.0.1", firestorePort: 8080 } };

let gec = 0, kal = 0;
const dogrula = (ad, kosul, ek = "") => (kosul ? (gec++, console.log("✓", ad)) : (kal++, console.log("✗", ad, ek)));

const kayit = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=deneme`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: KURUCU, password: SIFRE, returnSecureToken: true }),
}).then((r) => r.json());
await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJE}/accounts:update`, {
  method: "POST", headers: { "content-type": "application/json", authorization: "Bearer owner" },
  body: JSON.stringify({ localId: kayit.localId, emailVerified: true }),
});
// Firestore'daki öneri belgeleri (emülatörün yönetici erişimi).
const oneriler = async () => {
  const r = await fetch(`${FS}/v1/projects/${PROJE}/databases/(default)/documents/oneriler?pageSize=300`, { headers: { authorization: "Bearer owner" } }).then((x) => x.json());
  return (r.documents ?? []).map((b) => JSON.parse(b.fields?.j?.stringValue ?? "{}"));
};

const tarayici = await chromium.launch();
const hatalar = [];
const yeniSayfa = async (genislik = 1280) => {
  const c = await tarayici.newContext({ viewport: { width: genislik, height: 900 } });
  await c.addInitScript((a) => localStorage.setItem("trt-planlama-firebase", a), JSON.stringify(AYAR));
  const p = await c.newPage();
  p.on("dialog", (d) => d.accept());
  p.on("pageerror", (e) => hatalar.push(e.message));
  p.on("console", (m) => m.type() === "error" && hatalar.push(m.text()));
  return p;
};
const gir = async (p, kim, sifre) => {
  await p.goto(ADRES + "#/gercek-giris");
  await p.fill("[data-gg-eposta]", kim);
  await p.fill("[data-gg-sifre]", sifre);
  await p.click("[data-gg-giris]");
  await p.waitForSelector("header.ust", { timeout: 30000 });
};

// Yönetici dış muhabire giriş kodu verir.
const yon = await yeniSayfa();
await gir(yon, KURUCU, SIFRE);
await yon.goto(ADRES + "#/organizasyon/kisiler");
await yon.click("[data-kisi-ekle-ac]");
await yon.click("[data-tur-kod]");
await yon.fill("[data-davet-ad-ar]", "سامي نور");
await yon.fill("[data-davet-ad]", "Sami Nur");
await yon.selectOption("[data-davet-birim]", "muhabir");
await yon.click("[data-kod-olustur]");
await yon.waitForSelector("[data-kod]", { timeout: 30000 });
const kod = await yon.getAttribute("[data-kod]", "data-kod");

const mh = await yeniSayfa(390);
await mh.goto(ADRES + `#/kod/${kod}`);
await mh.click("[data-kod-devam]");
await mh.waitForSelector("[data-kod-sifre-formu]", { timeout: 30000 });
await mh.fill("[data-kod-sifre]", "Sami-sifresi-1");
await mh.fill("[data-kod-sifre2]", "Sami-sifresi-1");
await mh.click("[data-kod-sifre-kaydet]");
await mh.waitForSelector("header.ust", { timeout: 30000 });
await mh.waitForTimeout(3000);

// Takip aç.
await mh.goto(ADRES + "#/takipler");
await mh.click("[data-takip-ekle]");
await mh.fill("[data-takip-konu]", "متابعة تجريبية للمفاوضات");
await mh.click("[data-takip-kaydet]");
await mh.waitForTimeout(3000);
let o = (await oneriler()).find((x) => x.haberBasligi === "متابعة تجريبية للمفاوضات");
dogrula("takip Firestore'a yazıldı", !!o, JSON.stringify(hatalar));

// Takibe gelişme satırı ekle (birkaç kez: "çoğu zaman" kaydedilmiyor).
for (let i = 1; i <= 3; i++) {
  await mh.goto(ADRES + `#/oneriler/${o?.id}`);
  const ac = mh.locator("[data-takip-satiri-ac]");
  await mh.waitForSelector("[data-takip-satiri-ac], [data-takip-satiri]", { timeout: 20000 });
  if (await ac.count()) await ac.click();
  await mh.fill("[data-takip-satiri]", `سطر تجريبي ${i}\nسطر ثان`);
  await mh.click("[data-takip-satiri-ekle]");
  await mh.waitForTimeout(2500);
  o = (await oneriler()).find((x) => x.id === o?.id);
  dogrula(`satır ${i} Firestore'a yazıldı`, (o?.satirlar ?? []).length === i, JSON.stringify(hatalar));
}

// Kötü bağlantı: sayfa yeniden yüklenip kayıt önbellekten kurulur, sunucu yanıtı gecikir. Eşitlenmeden basılan
// "Ekle" metni silmemeli, eşitlenince kaydetmeli (önce metin siliniyor, satır hiç yazılmıyordu).
await mh.route("**/google.firestore.v1.Firestore/Listen/**", async (r) => {
  await new Promise((x) => setTimeout(x, 6000));
  await r.continue().catch(() => {});
});
await mh.goto("about:blank");
await mh.goto(ADRES + `#/oneriler/${o?.id}`);
await mh.waitForSelector("[data-takip-satiri]", { timeout: 20000 });
await mh.fill("[data-takip-satiri]", "سطر قبل المزامنة");
await mh.click("[data-takip-satiri-ekle]");
await mh.waitForTimeout(300);
const yaziDurdu = (await mh.inputValue("[data-takip-satiri]")) === "سطر قبل المزامنة";
const kaydedilmisti = ((await oneriler()).find((x) => x.id === o?.id)?.satirlar ?? []).length;
dogrula("eşitlenmeden: metin yerinde", yaziDurdu || kaydedilmisti === 4, String(kaydedilmisti));
await mh.waitForFunction(() => !document.querySelector("[data-takip-satiri]")?.value, null, { timeout: 40000 }).catch(() => {});
await mh.waitForTimeout(2500);
o = (await oneriler()).find((x) => x.id === o?.id);
dogrula("eşitlenince satır yazıldı", (o?.satirlar ?? []).some((x) => x.metin === "سطر قبل المزامنة"), JSON.stringify(o?.satirlar?.map((x) => x.metin)));
await mh.unroute("**/google.firestore.v1.Firestore/Listen/**");

// Takibin yazışmasına mesaj.
const mesajlar = async () => {
  const r = await fetch(`${FS}/v1/projects/${PROJE}/databases/(default)/documents/mesajlar?pageSize=300`, { headers: { authorization: "Bearer owner" } }).then((x) => x.json());
  return (r.documents ?? []).map((b) => JSON.parse(b.fields?.j?.stringValue ?? "{}"));
};
for (let i = 1; i <= 2; i++) {
  await mh.goto(ADRES + `#/oneriler/${o?.id}`);
  await mh.waitForSelector("[data-mesaj-yazi]", { timeout: 20000 }).catch(() => {});
  if (!(await mh.locator("[data-mesaj-yazi]").count())) { dogrula("yazışma alanı var", false); break; }
  await mh.fill("[data-mesaj-yazi]", `رسالة ${i}`);
  await mh.click("[data-mesaj-gonder]");
  await mh.waitForTimeout(2500);
  dogrula(`mesaj ${i} Firestore'a yazıldı`, (await mesajlar()).filter((m) => m.oneriId === o?.id).length === i, JSON.stringify(hatalar));
}

await tarayici.close();
console.log(`\n${gec} geçti, ${kal} kaldı`);
process.exit(kal ? 1 : 0);
