// Kişi silme kalıcı mı (kullanıcı: silinen muhabir sayfa yenilenince geri geliyordu). Eski başlık:
// Giriş kodu uçtan uca (src/girisKodu.ts): yönetici kod verir, kişi kodla girip şifresini belirler,
// kullanıcı adıyla yeniden girer; kullanılmış kod girmez; şifresini unutana yeni kod kaydı yeni hesaba taşır.
// Firebase emülatörüyle (auth + firestore, depodaki kurallar) ve önizlemeyle çalışır; çalıştırma
// belgeler/gercek-kip.md'de. Adlar kurgusal.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ADRES = process.env.ADRES ?? "http://localhost:4173/";
const AUTH = "http://127.0.0.1:9099";
const PROJE = "demo-trt";
const KURUCU = "adminplannersflow@gmail.com";
const SIFRE = "Deneme-12345";
const AYAR = { apiKey: "deneme", authDomain: "", projectId: PROJE, appId: "", emulator: { auth: AUTH, firestoreHost: "127.0.0.1", firestorePort: 8080 } };

let gec = 0;
let kal = 0;
const dogrula = (ad, kosul, ek = "") => {
  if (kosul) gec++;
  else {
    kal++;
    console.log("✗", ad, ek);
  }
};

// Kurucu hesabı (kural kurucuda doğrulanmış e-posta istiyor): emülatörün yönetici ucuyla doğrulanmış işaretleniyor.
const kayit = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=deneme`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: KURUCU, password: SIFRE, returnSecureToken: true }),
}).then((r) => r.json());
await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJE}/accounts:update`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: "Bearer owner" },
  body: JSON.stringify({ localId: kayit.localId, emailVerified: true }),
});

const tarayici = await chromium.launch();
const yeniSayfa = async () => {
  const c = await tarayici.newContext({ viewport: { width: 1280, height: 900 } });
  await c.addInitScript((a) => localStorage.setItem("trt-planlama-firebase", a), JSON.stringify(AYAR));
  const p = await c.newPage();
  p.on("dialog", (d) => d.accept());
  p.on("pageerror", (e) => console.log("sayfa hatası:", e.message));
  return p;
};
const gir = async (p, kim, sifre) => {
  await p.goto(ADRES + "#/gercek-giris");
  await p.fill("[data-gg-eposta]", kim);
  await p.fill("[data-gg-sifre]", sifre);
  await p.click("[data-gg-giris]");
};

// 1. Yönetici hesapsız bir dış muhabir ekler.
const yon = await yeniSayfa();
await gir(yon, KURUCU, SIFRE);
await yon.waitForSelector("header.ust", { timeout: 30000 });
await yon.goto(ADRES + "#/organizasyon/kisiler");
await yon.click("[data-kisi-ekle-ac]");
await yon.click("[data-tur-hesapsiz]");
await yon.selectOption("[data-davet-birim]", "muhabir");
await yon.fill("[data-davet-ad-ar]", "سامي نور");
await yon.fill("[data-davet-ad]", "Sami Nur");
await yon.click("[data-hesapsiz-ekle]");
await yon.waitForTimeout(2000);
const kisiSayisi = async (p) => {
  await p.goto(ADRES + "#/organizasyon/kisiler");
  await p.waitForTimeout(2500);
  await p.fill("[data-org-ara]", "Sami");
  await p.waitForTimeout(500);
  return p.locator("[data-org-kisi]").count();
};
dogrula("muhabir eklendi", (await kisiSayisi(yon)) === 1);

// 2. Siler; sayfa yenilenince ve başka tarayıcıda da yok.
await yon.locator("[data-org-kisi] button[aria-haspopup]").last().click();
await yon.click("[data-kisi-sil]");
await yon.waitForTimeout(2500);
dogrula("silindi (ekranda)", (await yon.locator("[data-org-kisi]").count()) === 0);
await yon.reload();
await yon.waitForSelector("header.ust", { timeout: 30000 });
const sonra = await kisiSayisi(yon);
dogrula("yenilenince geri gelmedi", sonra === 0, String(sonra));
const baska = await yeniSayfa();
await gir(baska, KURUCU, SIFRE);
await baska.waitForSelector("header.ust", { timeout: 30000 });
const baskada = await kisiSayisi(baska);
dogrula("başka tarayıcıda da yok", baskada === 0, String(baskada));

// 3. Hesaba kodla bağlanmış ama kodu kullanmamış hesapsız kişi silinince davet satırı ve kod da gider
// (kullanıcı: silinen muhabir "aktivasyon bekleniyor" diye geri geliyordu).
await yon.goto(ADRES + "#/organizasyon/kisiler");
await yon.click("[data-kisi-ekle-ac]");
await yon.click("[data-tur-hesapsiz]");
await yon.selectOption("[data-davet-birim]", "muhabir");
await yon.fill("[data-davet-ad-ar]", "رامي نور");
await yon.fill("[data-davet-ad]", "Rami Nur");
await yon.click("[data-hesapsiz-ekle]");
await yon.waitForTimeout(2000);
const ara = async (p, s) => {
  await p.goto(ADRES + "#/organizasyon/kisiler");
  await p.waitForTimeout(2500);
  await p.fill("[data-org-ara]", s);
  await p.waitForTimeout(500);
};
await ara(yon, "Rami");
await yon.locator("[data-org-kisi] button[aria-haspopup]").last().click();
await yon.click("[data-hesaba-bagla]");
await yon.click("[data-bagla-kod]");
await yon.fill("[data-bagla-kullanici]", "rami.nur");
await yon.click("[data-bagla-gonder]");
await yon.waitForSelector("[data-kod]", { timeout: 30000 });
const kod = await yon.getAttribute("[data-kod]", "data-kod");
await yon.keyboard.press("Escape");
await ara(yon, "Rami");
await yon.locator("[data-org-kisi] button[aria-haspopup]").last().click();
await yon.click("[data-kisi-sil]");
await yon.waitForTimeout(3000);
await yon.reload();
await yon.waitForSelector("header.ust", { timeout: 30000 });
await ara(yon, "Rami");
dogrula("bağlanan kişi geri gelmedi", (await yon.locator("[data-org-kisi]").count()) === 0);
await yon.fill("[data-org-ara]", "");
await yon.waitForTimeout(500);
dogrula("davet satırı da yok", (await yon.locator('[data-davet="rami.nur@giris.plannersflow.net"]').count()) === 0);
const rami = await yeniSayfa();
await rami.goto(ADRES + `#/kod/${kod}`);
await rami.click("[data-kod-devam]");
await rami.waitForSelector("[data-kod-hata]", { timeout: 30000 });
dogrula("kodu artık girmez", !!(await rami.getAttribute("[data-kod-hata]", "data-kod-hata")));

await tarayici.close();
console.log(`\n${gec} geçti, ${kal} kaldı`);
process.exit(kal ? 1 : 0);
