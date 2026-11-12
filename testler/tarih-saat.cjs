// Tarih ve saat alanları (bilesenler/TarihSaat.tsx): tarayıcının dili Türkçe ya da İngilizce olsa da takvim
// arayüzün dilinde (Arapça), saat 24 saatlik; yazılan saat tamamlanır, geçersizi geri döner; 390px taşma yok.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, locale: "en-US" });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(800); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "mu1"); localStorage.setItem("trt-planlama-dil", "ar"); });
  await git("#/oneriler/yeni");
  const d = p.locator("[data-tarih-dugmesi]").first();
  ok(/[؀-ۿ]/.test(await d.innerText()), "öneri formunda tarih Arapça");
  await d.click();
  const kutu = p.locator("[data-tarih-kutusu]");
  ok((await kutu.count()) === 1, "takvim açıldı");
  ok(/نوفمبر|ديسمبر|يناير|أكتوبر|[؀-ۿ]/.test(await kutu.locator("b").innerText()), "ay adı Arapça");
  ok((await kutu.locator("[data-tarih-gun]:disabled").count()) > 0, "geçmiş günler seçilemez");
  const gun = await kutu.locator("[data-tarih-gun]:not([disabled])").nth(2).getAttribute("data-tarih-gun");
  await kutu.locator(`[data-tarih-gun="${gun}"]`).click();
  ok((await p.locator("[data-tarih-kutusu]").count()) === 0, "seçince kapandı");
  ok((await p.locator("[data-oneri-bitis]").count()) === 1, "data-* yerleşik alanda");
  ok((await p.locator(".tarih-girdisi input[type=date]").first().inputValue()) === gun, "seçilen gün değerde");

  // Saat: Next Day'de ekip vardiyası 24 saatlik yazı alanı.
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await git("#/nextday/yarin");
  await p.evaluate(() => document.querySelectorAll("details").forEach((x) => (x.open = true)));
  ok((await p.locator('input[type="time"]').count()) === 0, "yerleşik saat kutusu yok");
  const s = p.locator(".saat-girdisi:visible").first();
  await s.fill("2215");
  await s.blur();
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => [...document.querySelectorAll(".saat-girdisi")].some((x) => x.value === "22:15")), "2215 → 22:15");
  const s2 = p.locator(".saat-girdisi:visible").first();
  const once = await s2.inputValue();
  await s2.fill("31:99");
  await s2.blur();
  ok((await s2.inputValue()) === once, "geçersiz saat geri döndü");
  ok(!/\b(AM|PM)\b/.test(await p.locator("main").innerText()), "AM/PM yok");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => { localStorage.setItem("trt-planlama-oturum", "mu1"); localStorage.setItem("trt-planlama-dil", x); }, dil);
    await git("#/oneriler/yeni");
    await p.locator("[data-tarih-dugmesi]").first().click();
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${dil})`);
    const r = await p.locator("[data-tarih-kutusu]").boundingBox();
    ok(r && r.x >= 0 && r.x + r.width <= 390, `takvim ekranda (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
