// Yeni sürüm (kullanıcı: kullanıcılar sayfayı yenilemiyor, güncel sürüm onlara da gitsin):
// surum.json farklıysa yarım iş yokken arka planda yenilenir; önündeyken ve yarım işte
// yenilenmez, çubukta "Yeni sürüm" çıkar; basınca yenilenir.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  // Aynı sürümde düğme yok.
  await p.goto("about:blank");
  await p.goto(B + "#/oneriler");
  await p.waitForTimeout(1200);
  ok((await p.locator("[data-yeni-surum]").count()) === 0, "aynı sürümde düğme yok");
  // Sunucuda yeni sürüm.
  await p.route("**/surum.json*", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ surum: "yeni-test" }) }));
  await p.goto("about:blank");
  await p.goto(B + "#/oneriler");
  await p.waitForTimeout(1200);
  ok((await p.locator("[data-yeni-surum]").count()) === 1, "önündeyken yenilenmez, düğme çıkar");
  const gizle = () => p.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  // Yarım iş: odakta yazı alanı varken arka plana gidince yenilenmez.
  await p.evaluate(() => { window.__isaret = 1; const i = document.createElement("textarea"); document.body.append(i); i.focus(); });
  await gizle();
  await p.waitForTimeout(800);
  ok(await p.evaluate(() => window.__isaret === 1), "yarım işte arka planda da yenilenmez");
  // Yarım iş yokken arka plana gidince yenilenir.
  await p.evaluate(() => { document.activeElement.blur(); document.querySelector("body > textarea").remove(); });
  // Son yazıdan bu yana süre yok sayılsın diye yeni bir sayfa: input olayı olmadı.
  await p.goto("about:blank");
  await p.goto(B + "#/oneriler");
  await p.waitForTimeout(1200);
  await p.evaluate(() => (window.__isaret = 1));
  await gizle();
  await p.waitForTimeout(1500);
  ok(await p.evaluate(() => window.__isaret === undefined), "arka plana gidince kendiliğinden yenilendi");
  // Düğmeye basınca yenilenir.
  await p.evaluate(() => (window.__isaret = 1));
  await p.locator("[data-yeni-surum]").click();
  await p.waitForTimeout(1500);
  ok(await p.evaluate(() => window.__isaret === undefined), "düğmeye basınca yenilendi");
  // Telefonda düğme sığıyor.
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(400);
  ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, "390px taşma yok");
  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
