// Şifre yenileme bağlantısı (kullanıcı: kullanıcılara şifre yenileme bağlantısı gönderebileyim): kişinin
// satırındaki ⋯'de "Şifre yenileme bağlantısı gönder"; Firebase'in şifre sıfırlama postası o adrese gider.
// Emülatörle (auth + firestore) ve önizlemeyle; çalıştırma giris-kodu.mjs gibi (belgeler/gercek-kip.md).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ADRES = process.env.ADRES ?? "http://localhost:4173/";
const AUTH = "http://127.0.0.1:9099";
const PROJE = "demo-trt";
const KURUCU = "adminplannersflow@gmail.com";
const SIFRE = "Deneme-12345";
const AYAR = { apiKey: "deneme", authDomain: "", projectId: PROJE, appId: "", emulator: { auth: AUTH, firestoreHost: "127.0.0.1", firestorePort: 8080 } };

let gec = 0, kal = 0;
const dogrula = (ad, kosul, ek = "") => (kosul ? (gec++, console.log("✓", ad)) : (kal++, console.log("✗", ad, ek)));

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
const sifirlamalar = async () =>
  ((await fetch(`${AUTH}/emulator/v1/projects/${PROJE}/oobCodes`).then((r) => r.json())).oobCodes ?? []).filter((o) => o.requestType === "PASSWORD_RESET" && o.email === KURUCU);

const tarayici = await chromium.launch();
const c = await tarayici.newContext({ viewport: { width: 1280, height: 900 } });
await c.addInitScript((a) => localStorage.setItem("trt-planlama-firebase", a), JSON.stringify(AYAR));
const p = await c.newPage();
p.on("dialog", (d) => d.accept());
p.on("pageerror", (e) => console.log("sayfa hatası:", e.message));
await p.goto(ADRES + "#/gercek-giris");
await p.fill("[data-gg-eposta]", KURUCU);
await p.fill("[data-gg-sifre]", SIFRE);
await p.click("[data-gg-giris]");
await p.waitForSelector("header.ust", { timeout: 30000 });
await p.goto(ADRES + "#/organizasyon/kisiler");
await p.fill("[data-org-ara]", "admin");
const satir = p.locator("[data-hesap]").first();
await satir.waitFor({ timeout: 30000 });
const once = (await sifirlamalar()).length;
await satir.locator("button[aria-haspopup]").last().click();
await p.locator("[data-sifre-yenile]").click();
await p.waitForTimeout(2500);
dogrula("şifre yenileme postası gitti", (await sifirlamalar()).length === once + 1);

await tarayici.close();
console.log(`\n${gec} geçti, ${kal} kaldı`);
process.exit(kal ? 1 : 0);
