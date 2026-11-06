// Next Day yeni görünüm (deneme): geçiş hatırlanır, içindekiler, belge yerinde düzenlenir, ayrıntı yandan panelde, 390 pikselde taşma yok, klasiğe dönülür
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); });
  const B = "http://localhost:4173/", s = {};
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  s.klasikteSecim = await p.locator('[data-nd-gorunum="yeni"]').count() === 1;
  await p.click('[data-nd-gorunum="yeni"]'); await p.waitForTimeout(500);
  s.yeniAcik = await p.locator("[data-yeni-plan]").count() === 1;
  s.icindekiler = await p.locator("[data-yp-icindekiler]").count() > 0;
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1000);
  s.hatirlandi = await p.locator("[data-yeni-plan]").count() === 1;
  await p.locator("[data-yp-icindekiler]").first().click(); await p.waitForTimeout(400);
  await p.locator(".yeni-plan .yp-belge button", { hasText: "Gelişme ekle" }).first().click(); await p.waitForTimeout(400);
  const kutu = await p.locator(".yeni-plan dialog.pencere[open]").boundingBox();
  s.yanPanel = !!kutu && kutu.height > 850 && kutu.x + kutu.width > 1430;
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  // Başlık işlemleri: klasiğin başlık kartı yan panelde, açık
  await p.locator("[data-yp-baslik-islem]").first().click(); await p.waitForTimeout(400);
  s.baslikPaneli = await p.locator(".yeni-plan dialog.pencere[open] details.baslik-karti[open]").count() === 1;
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  s.araclar = await p.locator('.yeni-plan [data-arac="aktar"]').count() === 1;
  for (const sekme of ["takip", "takvim", "durum", "oneri"]) { await p.click(`[data-yp-sekme="${sekme}"]`); await p.waitForTimeout(150); }
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 844 }); await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1000);
    s["tasma_" + dil] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) === 0;
  }
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "tr"));
  await p.setViewportSize({ width: 1440, height: 900 }); await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1000);
  await p.click('[data-nd-gorunum="klasik"]'); await p.waitForTimeout(400);
  s.klasigeDondu = await p.locator("[data-yeni-plan]").count() === 0;
  console.log(s, "hata", hata);
  await b.close(); process.exit(Object.values(s).every(Boolean) && !hata ? 0 : 1);
})();
