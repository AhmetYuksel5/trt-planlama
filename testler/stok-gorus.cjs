// Stok önerilerinin toplantı öncesi hazırlığı (stokHazirlik.ts): Planlama haftanın stok önerilerini birimlerin
// görüşüne açar; Newsdesk ve masalar ana sayfalarında görüş verir; görüş Weekly'de ve toplantıda kalemin altında.
// Günü olan kalem "Stoka al"la stok önerisine geçer, "Güne geri al"la eski gününe döner. 390 pikselde taşma yok.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  // Weekly'nin bölümleri katlı gelir.
  const ac = () => p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl2", "#/");
  // Baştan: hafta henüz açılmamış, görüş yok.
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.id === "hf-gelecek");
    delete h.stokAcik;
    d.stokGorusleri = [];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, K);

  await gir("nd3", "#/");
  ok((await p.locator("[data-stok-gorus-istegi]").count()) === 0, "açılmadan önce birimde görüş kartı yok");

  await gir("pl2", "#/haftalik/hf-gelecek");
  await ac();
  await p.click("[data-stok-birimlere-ac]");
  await p.waitForTimeout(400);
  ok((await p.locator("[data-stok-acik]").count()) === 1, "birimlere açıldı satırı");
  let d = await veri();
  ok(!!d.haftalik.find((x) => x.id === "hf-gelecek").stokAcik, "hafta açık işaretli");
  const acilis = d.hareketler.find((h) => h.tip === "stokBirimlereAcildi");
  ok(!!acilis && acilis.veri.kime.split(",").includes("nd3"), "Newsdesk'e bildirim");

  // Newsdesk ana sayfasında görüş verir.
  await gir("nd3", "#/");
  const kart = p.locator("[data-stok-gorus-istegi]");
  ok((await kart.count()) === 1, "Newsdesk'in ana sayfasında görüş kartı");
  const ilk = await kart.locator("[data-stok-gorus-kalem]").first().getAttribute("data-stok-gorus-kalem");
  const satir = kart.locator(`[data-stok-gorus-kalem="${ilk}"]`);
  await satir.locator("[data-stok-gorus-not-ac]").click();
  await satir.locator("[data-stok-gorus-not]").fill("Görüntü arşivimizde var");
  await satir.locator('[data-stok-gorus="bizAlalim"]').click();
  await p.waitForTimeout(400);
  d = await veri();
  const g = d.stokGorusleri.find((x) => x.id === `${ilk}:newsdesk`);
  ok(!!g && g.tur === "bizAlalim" && g.not === "Görüntü arşivimizde var", "görüş birim adına kaydedildi");
  // Görüşü değiştirir: birim başına tek kayıt.
  await p.locator(`[data-stok-gorus-kalem="${ilk}"] [data-stok-gorus="uygun"]`).click();
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.stokGorusleri.filter((x) => x.kalemId === ilk && x.birim === "newsdesk").length === 1 && d.stokGorusleri.find((x) => x.id === `${ilk}:newsdesk`).tur === "uygun", "yenisi eskisinin yerine");

  // Program masasının ana sayfasında da.
  await gir("pr2", "#/");
  ok((await p.locator("[data-stok-gorus-istegi]").count()) === 1, "Program masasında görüş kartı");

  // Weekly'de ve toplantı görünümünde kalemin altında.
  await gir("pl2", "#/haftalik/hf-gelecek");
  await ac();
  ok((await p.locator(`[data-stok-gorus-ozet="${ilk}"] [data-stok-gorus-birim="newsdesk"]`).count()) >= 1, "Weekly'de görüş özeti");
  ok((await p.locator("[data-stok-gorus-ver]").count()) === 0, "Planlama görüş vermiyor, yalnız görüyor");

  // Stoka al ve güne geri al.
  d = await veri();
  const gunlu = d.haftalik.find((x) => x.id === "hf-gelecek").kalemler.find((k) => k.tarih && k.karar === "bekliyor");
  await p.locator(`[data-kalem="${gunlu.id}"] [data-stoka-al]`).first().click();
  await p.waitForTimeout(400);
  await ac();
  d = await veri();
  let k2 = d.haftalik.find((x) => x.id === "hf-gelecek").kalemler.find((k) => k.id === gunlu.id);
  ok(!k2.tarih && k2.stokaAlindi?.tarih === gunlu.tarih, "stoka alındı, eski günü kalemde");
  ok(d.hareketler.some((h) => h.tip === "kalemStokaAlindi" && h.veri.kalem === gunlu.id), "stoka alma hareketi");
  ok((await p.locator(`[data-kalem="${gunlu.id}"] [data-stoka-alindi]`).count()) >= 1, "kalemde önceki günü yazıyor");
  await p.locator(`[data-kalem="${gunlu.id}"] [data-gune-geri-al]`).first().click();
  await p.waitForTimeout(400);
  d = await veri();
  k2 = d.haftalik.find((x) => x.id === "hf-gelecek").kalemler.find((k) => k.id === gunlu.id);
  ok(k2.tarih === gunlu.tarih && !k2.stokaAlindi, "güne geri alındı");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const [kim, yol] of [["nd3", "#/"], ["pr2", "#/"], ["pl2", "#/haftalik/hf-gelecek"]]) {
      await gir(kim, yol);
      ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${kim}, ${dil})`);
    }
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
