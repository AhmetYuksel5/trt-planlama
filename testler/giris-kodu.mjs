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

// 1. Yönetici (kurucu) girer, Hesaplar'da giriş kodu oluşturur.
const yon = await yeniSayfa();
await gir(yon, KURUCU, SIFRE);
await yon.waitForSelector("header.ust", { timeout: 30000 });
await yon.goto(ADRES + "#/organizasyon/hesaplar");
await yon.click("[data-tur-kod]");
await yon.fill("[data-davet-ad-ar]", "علي كايا");
await yon.fill("[data-davet-ad]", "Ali Kaya");
dogrula("kullanıcı adı önerisi", (await yon.getAttribute("[data-kod-kullanici-adi]", "placeholder")) === "ali.kaya");
await yon.click("[data-kod-olustur]");
await yon.waitForSelector("[data-kod]", { timeout: 30000 });
const kod = await yon.getAttribute("[data-kod]", "data-kod");
dogrula("kod biçimi", /^[A-Z2-9]{8}$/.test(kod ?? ""), kod);
dogrula("pencerede kullanıcı adı", (await yon.textContent("[data-kod-sonuc-kullanici]"))?.trim() === "ali.kaya");
await yon.keyboard.press("Escape");
await yon.waitForSelector('[data-davet="ali.kaya@giris.plannersflow.net"] [data-kod-hesap]');

// 2. Kişi bağlantıdaki kodla girer, şifresini belirler.
const ali = await yeniSayfa();
await ali.goto(ADRES + `#/kod/${kod}`);
dogrula("kod alanı dolu gelir", (await ali.inputValue("[data-kod-girdi]")) === `${kod.slice(0, 4)}-${kod.slice(4)}`);
await ali.click("[data-kod-devam]");
await ali.waitForSelector("[data-kod-sifre-formu]", { timeout: 30000 });
dogrula("şifre adımında kullanıcı adı", (await ali.textContent("[data-kod-kullanici]"))?.trim() === "ali.kaya");
await ali.fill("[data-kod-sifre]", "Ali-sifresi-1");
await ali.fill("[data-kod-sifre2]", "Ali-sifresi-1");
await ali.click("[data-kod-sifre-kaydet]");
await ali.waitForSelector("header.ust", { timeout: 30000 });
dogrula("kodla giren sisteme girdi", true);

// 3. Kullanılmış kod girmez; kullanıcı adı ve şifreyle girer.
const tekrar = await yeniSayfa();
await tekrar.goto(ADRES + `#/kod/${kod}`);
await tekrar.click("[data-kod-devam]");
await tekrar.waitForSelector("[data-kod-hata]", { timeout: 30000 });
dogrula("kullanılmış kod reddedilir", ["kodGecersiz", "kodKullanilmis"].includes((await tekrar.getAttribute("[data-kod-hata]", "data-kod-hata")) ?? ""));
await gir(tekrar, "ali.kaya", "Ali-sifresi-1");
await tekrar.waitForSelector("header.ust", { timeout: 30000 });
dogrula("kullanıcı adıyla giriş", true);

// 4. Şifremi unuttum: kullanıcı adıyla e-posta gitmez, neden yazılı.
const unutan = await yeniSayfa();
await unutan.goto(ADRES + "#/gercek-giris");
await unutan.fill("[data-gg-eposta]", "ali.kaya");
await unutan.getByText(/Şifremi unuttum|نسيت|Forgot/).click();
dogrula("kod hesabında şifre sıfırlama yok", (await unutan.getAttribute("[data-gg-hata]", "data-gg-hata")) === "ggKodHesabiSifre");

// 5. Yönetici şifresini unutana yeni kod verir; yeni hesapla giren kişinin kaydı taşınır.
await yon.goto(ADRES + "#/organizasyon/hesaplar");
const satir = yon.locator("[data-hesap]", { has: yon.locator("[data-kod-hesap]") }).first();
await satir.locator("[data-yeni-kod]").click();
dogrula("yeni kod önerisi", (await yon.getAttribute("[data-yeni-kod-kullanici]", "placeholder")) === "ali.kaya2");
await yon.click("[data-yeni-kod-olustur]");
await yon.waitForSelector("[data-kod]", { timeout: 30000 });
const kod2 = await yon.getAttribute("[data-kod]", "data-kod");
await yon.keyboard.press("Escape");
const ali2 = await yeniSayfa();
await ali2.goto(ADRES + `#/kod/${kod2}`);
await ali2.click("[data-kod-devam]");
await ali2.waitForSelector("[data-kod-sifre-formu]", { timeout: 30000 });
await ali2.fill("[data-kod-sifre]", "Ali-sifresi-2");
await ali2.fill("[data-kod-sifre2]", "Ali-sifresi-2");
await ali2.click("[data-kod-sifre-kaydet]");
await ali2.waitForSelector("header.ust", { timeout: 30000 });
// Geçişi kişinin kendi tarayıcısı ya da yöneticininki tamamlıyor: listede tek Ali, yeni kullanıcı adıyla.
await yon.goto(ADRES + "#/organizasyon/hesaplar");
await yon.waitForFunction(
  () => {
    const s = [...document.querySelectorAll("[data-hesap] [data-kod-hesap]")].map((e) => e.textContent?.trim());
    return s.includes("ali.kaya2") && !s.includes("ali.kaya");
  },
  null,
  { timeout: 30000 },
).then(
  () => dogrula("kayıt yeni hesaba taşındı", true),
  async () => dogrula("kayıt yeni hesaba taşındı", false, JSON.stringify(await yon.$$eval("[data-hesap] [data-kod-hesap]", (l) => l.map((e) => e.textContent)))),
);

await tarayici.close();
console.log(`\n${gec} geçti, ${kal} kaldı`);
process.exit(kal ? 1 : 0);
