// Onaylı Next Day planının onayı geri alınıyor: tam yönetici ve Planlama yöneticisi yapar, planlamacı yapamaz
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const B = "http://localhost:4173/"; let kal = 0;
  const dene = async (kim, bekle) => {
    await p.goto(B);
    await p.evaluate((k) => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", k); }, kim);
    await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
    await p.evaluate(() => {
      const k = "trt-planlama-v25", d = JSON.parse(localStorage.getItem(k));
      const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
      plan.durum = "onayli"; localStorage.setItem(k, JSON.stringify(d));
    });
    await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
    // "Onayı geri al" ⋯ menüsünde; menü yetkisi olmayanda da açılıyor.
    if (await p.locator(".pb-uc button[aria-haspopup]").count()) { await p.locator(".pb-uc button[aria-haspopup]").click(); await p.waitForTimeout(200); }
    const dugme = await p.locator("[data-onay-geri]").count();
    if (dugme) { await p.locator("[data-onay-geri]").click(); await p.waitForTimeout(400); }
    const durum = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem("trt-planlama-v25")); return [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0].durum; });
    const ok = bekle ? dugme && durum === "toplantida" : !dugme && durum === "onayli";
    console.log(kim, "düğme", dugme, "durum", durum, ok ? "✓" : "✗"); if (!ok) kal++;
  };
  await dene("yo3", true); await dene("pl1", true); await dene("pl2", false);
  await b.close(); process.exit(kal ? 1 : 0);
})();
