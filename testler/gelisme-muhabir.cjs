// Gelişmeye özel muhabir: formda seçilen muhabir plan ekranında, belgede ve çıktıda paragrafın altında
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/"; await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  // İlk gelişmenin düzenle kalemi
  const kalem = p.locator("[data-gelisme] button[aria-label=\"Düzenle\"]").first(); console.log("kalem", await p.locator("[data-gelisme] button[aria-label=\"Düzenle\"]").count());
  await kalem.click(); await p.waitForTimeout(300);
  const sec = p.locator("[data-gelisme-muhabirleri]").locator("xpath=..").locator("select").last();
  const form = p.locator(".form-kutu", { hasText: "Bu gelişmeyi takip eden muhabirler" }).first();
  console.log("form", await form.count(), await p.locator(".form-kutu").count(), (await p.locator(".form-kutu").first().innerText().catch(()=>"")).slice(0,200));
  const secici = form.locator("span", { hasText: "Bu gelişmeyi takip eden muhabirler" }).locator("xpath=..").locator("select");
  const deger = await secici.locator("option").nth(1).getAttribute("value");
  await secici.selectOption(deger); await p.waitForTimeout(200);
  console.log("formda seçili", await form.locator("[data-gelisme-muhabirleri] button").count());
  await form.locator("> .form-alt button, button.dugme:not(.dugme-ikincil)").last().click(); await p.waitForTimeout(400);
  const e = await p.locator("[data-gelisme-muhabir]").count();
  await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  const c = await p.locator("[data-gelisme-muhabir]").count();
  console.log("plan ekranında", e, "çıktıda", c);
  await b.close(); process.exit(e && c ? 0 : 1);
})();
