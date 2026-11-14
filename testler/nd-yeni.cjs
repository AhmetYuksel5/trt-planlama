// Next Day yeni görünüm (deneme): geçiş hatırlanır, içindekiler, belge yerinde düzenlenir, ayrıntı yandan panelde, 390 pikselde taşma yok, klasiğe dönülür
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); });
  const B = "http://localhost:4173/", s = {};
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  // Klasikte görünüm seçimi ⋯ menüsünde.
  await p.locator('.pb-uc button[aria-haspopup]').click(); await p.waitForTimeout(200); s.klasikteSecim = await p.locator('[data-nd-gorunum="yeni"]').count() === 1;
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
  // Hızlı ekleme: "YER / metin" + Enter gelişme olur; "/" menüsü pencere açar
  const hz = p.locator("[data-hizli-ekle]").first();
  await hz.fill("بيروت / اختبار الإضافة السريعة"); await hz.press("Enter"); await p.waitForTimeout(500);
  s.hizliGelisme = (await p.locator(".yp-belge", { hasText: "اختبار الإضافة السريعة" }).count()) === 1 && (await hz.inputValue()) === "";
  await hz.fill("/"); await p.waitForTimeout(200);
  s.hizliMenu = (await p.locator("[data-hizli-secenek]").count()) >= 3;
  await p.locator('[data-hizli-secenek="paket"]').first().click(); await p.waitForTimeout(400);
  s.hizliPencere = (await p.locator(".yeni-plan dialog.pencere[open]").count()) === 1;
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  // Sürükle-bırak: öneri kartı başlığa bırakılınca Plana ekle o başlıkla açılır
  const kart = p.locator(".yp-yan [data-oneri][draggable]").first();
  if (await kart.count()) {
    const hedefPb = await p.locator(".yp-belge [data-nd-baslik]").nth(1).getAttribute("data-nd-baslik");
    await kart.dragTo(p.locator(".yp-belge [data-nd-baslik]").nth(1)); await p.waitForTimeout(500);
    const secilen = await p.locator("dialog.pencere[open] [data-pe-baslik]").inputValue().catch(() => "");
    const beklenen = await p.evaluate((id) => { const d = JSON.parse(localStorage.getItem("trt-planlama-v25")); for (const pl of d.planlar) for (const pb of pl.basliklar) if (pb.id === id) return pb.baslikId; }, hedefPb);
    s.birakma = !!secilen && secilen === beklenen;
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  } else s.birakma = "kart yok";
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 844 }); await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1000);
    s["tasma_" + dil] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) === 0;
  }
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "tr"));
  await p.setViewportSize({ width: 1440, height: 900 }); await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1000);
  // Sütunlu görünüm: başlıklar açık kutu, sabit bölümler dar sütunda
  await p.click('[data-nd-gorunum="sutunlu"]'); await p.waitForTimeout(500);
  s.sutunlu = (await p.locator(".yeni-plan.sutunlu .nd-yan").count()) === 1 && (await p.locator(".nd-ana [data-nd-baslik]").count()) > 0 && (await p.locator(".yp-icindekiler").count()) === 0;
  await p.screenshot({ path: process.env.EKRAN || "/tmp/sutunlu.png" });
  await p.click("[data-yp-cekmece]"); await p.waitForTimeout(300);
  s.cekmece = (await p.locator(".yp-cekmece [data-oneri]").count()) > 0;
  await p.screenshot({ path: (process.env.EKRAN || "/tmp/sutunlu.png").replace(".png", "-cekmece.png") });
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 844 }); await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1000);
    s["sutunluTasma_" + dil] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) === 0;
  }
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "tr"));
  await p.setViewportSize({ width: 1440, height: 900 }); await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1000);
  await p.click('[data-nd-gorunum="klasik"]'); await p.waitForTimeout(400);
  s.klasigeDondu = await p.locator("[data-yeni-plan]").count() === 0;
  console.log(s, "hata", hata);
  await b.close(); process.exit(Object.values(s).every(Boolean) && !hata ? 0 : 1);
})();
