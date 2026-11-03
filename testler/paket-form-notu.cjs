// Paket formunda girilen not planda PKG satırının sonunda parantez içinde; düzenlemede değişir, boşaltınca kalkar
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Paket önerisi ekle/ }).first().click(); await p.waitForTimeout(300);
  const f = p.locator(".form-kutu:has([data-paket-form-notu])").first();
  await f.locator("input").first().fill("تقرير تجريبي للملاحظة");
  await f.locator("[data-paket-form-notu]").fill("الصور من الأرشيف");
  await f.getByRole("button", { name: /^Kaydet$/ }).click(); await p.waitForTimeout(500);
  await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  const cikti = await p.locator("article.cikti").first().innerText();
  const ok = cikti.includes("تقرير تجريبي للملاحظة") && cikti.includes("(الصور من الأرشيف)");
  console.log("çıktıda not", ok);
  await b.close(); process.exit(ok ? 0 : 1);
})();
