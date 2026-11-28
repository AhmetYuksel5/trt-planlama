// Telefonda sayfalar arası geri (kullanıcı: mobil uygulamada geri düğmesi ya da hareketi yoktu):
// üst çubukta "←" uygulamanın içinden gelinince çıkar ve bir önceki sayfaya döner; iPhone ana
// ekran uygulamasında kenardan kaydırmak da geri gider (Arapçada sağ kenardan).
const { chromium, devices } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices["iPhone 13"] });
  await c.addInitScript(() => (window.__geriKaydirmaDene = true));
  const p = await c.newPage();
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const kaydir = async (x0, x1, y = 400) => {
    const s = await c.newCDPSession(p);
    await s.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
    for (let i = 1; i <= 8; i++) await s.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + ((x1 - x0) * i) / 8, y }] });
    await s.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await p.waitForTimeout(500);
  };
  for (const dil of ["tr", "ar"]) {
    await p.goto(B);
    await p.evaluate((dil) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", dil); localStorage.setItem("trt-planlama-oturum", "pl2"); }, dil);
    await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1200);
    ok((await p.locator("[data-ust-geri]").count()) === 0, dil + ": doğrudan açılan sayfada geri yok");
    await p.evaluate(() => (location.hash = "#/oneriler")); await p.waitForTimeout(600);
    ok(await p.locator("[data-ust-geri]").isVisible(), dil + ": sayfa değişince üst çubukta geri");
    await p.click("[data-ust-geri]"); await p.waitForTimeout(600);
    ok(p.url().endsWith("#/"), dil + ": geri ana sayfaya döndü");
    // Kenardan kaydırma: Türkçede sol, Arapçada sağ kenar.
    await p.evaluate(() => (location.hash = "#/paketler")); await p.waitForTimeout(600);
    const w = await p.evaluate(() => innerWidth);
    await kaydir(dil === "ar" ? 30 : w - 30, dil === "ar" ? 150 : w - 150);
    ok(p.url().endsWith("#/paketler"), dil + ": yanlış kenardan kaydırma geri gitmez");
    await kaydir(dil === "ar" ? w - 5 : 5, dil === "ar" ? w - 160 : 160);
    ok(p.url().endsWith("#/"), dil + ": kenardan kaydırma geri gider");
    await p.evaluate(() => (location.hash = "#/paketler")); await p.waitForTimeout(600);
    await kaydir(dil === "ar" ? w - 5 : 5, dil === "ar" ? w - 40 : 40);
    ok(p.url().endsWith("#/paketler"), dil + ": kısa kaydırma geri gitmez");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, dil + ": taşma yok");
  }
  // Masaüstünde düğme görünmez.
  const m = await b.newPage({ viewport: { width: 1300, height: 900 } });
  await m.goto(B); await m.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await m.goto(B + "#/"); await m.waitForTimeout(800);
  await m.evaluate(() => (location.hash = "#/oneriler")); await m.waitForTimeout(500);
  ok(!(await m.locator("[data-ust-geri]").isVisible()), "masaüstünde üst çubukta geri yok");
  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
