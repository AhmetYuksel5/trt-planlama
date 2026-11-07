// Yeni tasarım (deneme): anahtar html sınıfını açıp kapatır, seçim hatırlanır, saat çubukta, menü açık zeminde, 390 pikselde taşma yok
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); });
  const B = "http://localhost:4173/", s = {}, E = process.env.EKRAN;
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/ayarlar"); await p.waitForTimeout(1000);
  s.eskiAcilis = !(await p.evaluate(() => document.documentElement.classList.contains("yeni-tasarim")));
  await p.evaluate(() => (document.querySelector("[data-tasarim-ayari]").closest("details").open = true)); await p.check("[data-tasarim-ayari]"); await p.waitForTimeout(300);
  s.acildi = await p.evaluate(() => document.documentElement.classList.contains("yeni-tasarim"));
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1000);
  s.hatirlandi = await p.evaluate(() => document.documentElement.classList.contains("yeni-tasarim"));
  s.saat = (await p.locator("[data-ust-saat]").count()) === 1;
  s.acikMenu = await p.evaluate(() => getComputedStyle(document.querySelector(".menu")).backgroundColor === "rgb(255, 255, 255)");
  if (E) for (const [ad, yol] of [["ana", "#/"], ["oneriler", "#/oneriler"], ["nextday", "#/nextday/yarin"], ["paketler", "#/paketler"]]) {
    await p.goto(B + yol); await p.waitForTimeout(900); await p.screenshot({ path: `${E}/yt-${ad}.png` });
  }
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 844 });
    for (const yol of ["#/", "#/oneriler", "#/nextday/yarin"]) {
      await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(800);
      s[`tasma_${dil}_${yol}`] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) === 0;
    }
  }
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "tr"));
  await p.setViewportSize({ width: 1440, height: 900 }); await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(800);
  await p.click(".ust [aria-haspopup], .ust .avatar-dugme, [data-kullanici-menu]").catch(() => {});
  await p.waitForTimeout(200);
  if (await p.locator("[data-tasarim-gecis]").count()) { await p.click("[data-tasarim-gecis]"); await p.waitForTimeout(200); }
  else await p.evaluate(() => localStorage.setItem("trt-planlama-tasarim", "eski"));
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(800);
  s.eskiyeDondu = !(await p.evaluate(() => document.documentElement.classList.contains("yeni-tasarim")));
  console.log(s, "hata", hata);
  await b.close(); process.exit(Object.values(s).every(Boolean) && !hata ? 0 : 1);
})();
