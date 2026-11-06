// Çıktı baskı tasarımları: plan ekranındaki "Çıktı" önizlemesi, 1–4 seçimi, tam sayfa, Word'ün kurum kopyası, logo, 390 pikselde taşma yok
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); });
  const B = "http://localhost:4173/", s = {};
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.click('[data-arac="cikti"]'); await p.waitForTimeout(500);
  s.onizleme = (await p.locator("dialog[open] [data-onizleme] .cikti").count()) === 1;
  for (const n of [1, 2, 3, 4]) { await p.click(`dialog[open] [data-baski="${n}"]`); await p.waitForTimeout(200); s["baski" + n] = (await p.locator(`dialog[open] .cikti.baski-${n}`).count()) === 1; }
  s.logo = (await p.locator("dialog[open] .cikti.baski-4 .baski-logo img").count()) === 1;
  await p.click("[data-onizleme-tam]"); await p.waitForTimeout(900);
  s.tamSayfaSecimiHatirladi = (await p.locator(".cikti-sarici .cikti.baski-4").count()) === 1;
  s.wordKurumdan = (await p.locator(".word-kaynagi .cikti:not([class*='baski-'])").count()) === 1;
  await p.click('[data-baski="0"]'); await p.waitForTimeout(200);
  s.kurumaDondu = (await p.locator(".cikti-sarici .cikti[class*='baski-']").count()) === 0;
  await p.click('[data-baski="2"]');
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 844 }); await p.reload(); await p.waitForTimeout(900);
    s["tasma_" + dil] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) === 0;
  }
  console.log(s, "hata", hata);
  await b.close(); process.exit(Object.values(s).every(Boolean) && !hata ? 0 : 1);
})();
