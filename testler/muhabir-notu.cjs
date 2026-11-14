// Plandaki muhabire not: planlamacı yazar, plan onaylanınca muhabirin Takiplerim'inde başlık ve not; yeniden onayda tekrar gitmez
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const B = "http://localhost:4173/";
  const plan = () => p.evaluate(() => { const d = JSON.parse(localStorage.getItem("trt-planlama-v25")); return [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0]; });
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.evaluate(() => { const k = "trt-planlama-v25", d = JSON.parse(localStorage.getItem(k)); const pl = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0]; pl.durum = "toplantida"; localStorage.setItem(k, JSON.stringify(d)); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  await p.locator('[data-muhabir-not]').first().click(); await p.waitForTimeout(200);
  await p.locator("[data-muhabir-not-metni]").fill("تابع مؤتمر وزير الخارجية");
  await p.locator("[data-muhabir-not-kaydet]").click(); await p.waitForTimeout(300);
  const pl = await plan();
  const m = pl.basliklar.find((b) => b.muhabirler.some((x) => x.not))?.muhabirler.find((x) => x.not);
  console.log("not kayıtta", !!m, m?.not);
  await p.locator("button", { hasText: "Planı onayla" }).click(); await p.waitForTimeout(500);
  const say = () => p.evaluate((id) => JSON.parse(localStorage.getItem("trt-planlama-v25")).hareketler.filter((h) => h.tip === "planaMuhabirEklendi" && h.veri?.kime === id).length, m.kisiId);
  const ilk = await say();
  // Onayı geri al, yeniden onayla: aynı not tekrar gitmemeli
  // Onaydan sonra takdir bildirimi sayfası açılıyor (kabul edilen paket varsa); plana dön.
  if (p.url().endsWith("/takdir")) { await p.locator("[data-takdir-plana]").click(); await p.waitForTimeout(800); }
  await p.locator('.pb-uc button[aria-haspopup]').click(); await p.waitForTimeout(200); await p.locator("[data-onay-geri]").click(); await p.waitForTimeout(400);
  await p.locator("button", { hasText: "Planı onayla" }).click(); await p.waitForTimeout(500);
  const ikinci = await say();
  await p.evaluate((id) => localStorage.setItem("trt-planlama-oturum", id), m.kisiId);
  await p.goto("about:blank"); await p.goto(B + "#/takipler"); await p.waitForTimeout(1000);
  const kart = await p.locator("[data-plana-eklendin]", { hasText: "تابع مؤتمر وزير الخارجية" }).count();
  console.log("hareket", ilk, "yeniden onayda", ikinci, "Takiplerim'de", kart);
  await b.close(); process.exit(m && ilk > 0 && ikinci === ilk && kart > 0 ? 0 : 1);
})();
