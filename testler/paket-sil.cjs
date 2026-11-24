// Paketi plandan kaldırmanın tek kuralı (kullanıcı: ekleme, çıkarma ve silme karışmasın): karar verilmemiş PKG
// "Sil"le gider; onaylı PKG silinmez, "Plandan kaldır"la iptal edilir, kaydı kalır, muhabire `paketIptal`. Önerinin
// "Plandan çıkar"ı onaylı paketi aynı biçimde iptal eder.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const sorular = [];
  p.on("dialog", (d) => { sorular.push(d.message()); d.accept(); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/nextday/yarin");
  // Yarının planında kurgusal iki onaylı PKG: biri üretimde değil, öbürü üretim yolunda.
  const kur = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const pb = plan.basliklar[0];
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
    const temel = { sehir: mu.sehir || "istanbul", aciklama: "", tur: "haber", bicim: "pkg", durum: "onaylandi", sahaGerekli: false, planId: plan.id, planBaslikId: pb.id, muhabirId: mu.id, notlar: [], olusturma: new Date().toISOString(), guncelleme: new Date().toISOString() };
    d.paketler.push({ ...temel, id: "p-sil-1", kod: "S1", baslik: "تقرير معتمد" }, { ...temel, id: "p-sil-2", kod: "S2", baslik: "تقرير قيد الإنتاج", durum: "uretimde", uretim: { sablon: "x", yol: {}, parcalar: [] } },
      { ...temel, id: "p-sil-3", kod: "S3", baslik: "تقرير مقترح", durum: "degerlendiriliyor" });
    // Plana onaylı paketle girmiş öneri.
    const ornek = d.oneriler.find((x) => x.muhabirId && !x.kaynakTuru && !x.talimatVeren);
    d.oneriler.push({ ...ornek, id: "o-sil", haberBasligi: "خبر للإزالة", gelisme: "تفاصيل", muhabirId: mu.id, durum: "planaEklendi", hedefTarih: plan.tarih, bitisTarih: undefined, planId: plan.id, planTarihi: plan.tarih, paketId: "p-sil-4", baslikId: pb.baslikId, arsiv: undefined, gerekce: undefined });
    d.gelismeler.push({ id: "g-sil", planId: plan.id, planBaslikId: pb.id, metin: "تفاصيل", oneriId: "o-sil", kaynakTuru: "muhabir", tarih: plan.tarih });
    d.paketler.push({ ...temel, id: "p-sil-4", kod: "S4", baslik: "تقرير المقترح المعتمد", oneriId: "o-sil" });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
    return { plan: plan.id, mu: mu.id };
  }, K);
  await git("#/nextday/" + kur.plan);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click()));
  await p.waitForTimeout(300);
  const kart = (id) => p.locator(`.kayit:has(a[href="#/paketler/${id}"])`).first();
  ok((await kart("p-sil-1").locator('button[aria-label="Sil"]').count()) === 0, "onaylı PKG'de Sil yok");
  ok((await kart("p-sil-1").locator(`[data-paket-kaldir="p-sil-1"]`).count()) === 1, "onaylı PKG'de Plandan kaldır");
  ok((await kart("p-sil-3").locator('button[aria-label="Sil"]').count()) === 1, "kararsız PKG'de Sil");
  await kart("p-sil-1").locator(`[data-paket-kaldir="p-sil-1"] button`).click();
  await p.waitForTimeout(400);
  ok(sorular.some((x) => x.includes("muhabire bildirim")), "onay sorusu muhabire bildirimi söylüyor");
  await kart("p-sil-3").locator('button[aria-label="Sil"]').click();
  await p.waitForTimeout(400);
  let d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const p1 = d.paketler.find((x) => x.id === "p-sil-1");
  ok(p1?.durum === "iptal", "onaylı paket iptal, kaydı duruyor");
  ok(d.hareketler.some((h) => h.tip === "paketIptal" && h.paketId === "p-sil-1" && h.veri?.kime === kur.mu), "muhabire bildirim (paketIptal)");
  ok(!d.paketler.some((x) => x.id === "p-sil-3"), "kararsız paket silindi");
  ok((await p.locator(`[data-paket-kaldir="p-sil-1"]`).count()) === 0, "iptal edilen pakette kaldır düğmesi yok");

  // Önerinin "Plandan çıkar"ı: onaylı paket iptal edilir, öneri değerlendirmeye döner.
  await git("#/oneriler/o-sil");
  const cik = p.locator('[data-plandan-cikar="o-sil"]').first();
  ok((await cik.count()) === 1, "öneride Plandan çıkar");
  if (!(await cik.count())) console.log(await p.evaluate((k) => JSON.stringify(JSON.parse(localStorage.getItem(k)).oneriler.find((x) => x.id === "o-sil")), K));
  await cik.click({ timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(500);
  d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  ok(d.paketler.find((x) => x.id === "p-sil-4")?.durum === "iptal", "öneriyle plandan çıkan onaylı paket iptal, kaydı duruyor");
  ok(d.hareketler.some((h) => h.tip === "paketIptal" && h.paketId === "p-sil-4" && h.veri?.kime === kur.mu), "öneriden çıkan paket için muhabire bildirim");
  ok(d.oneriler.find((x) => x.id === "o-sil")?.durum === "degerlendiriliyor" && !d.gelismeler.some((g) => g.id === "g-sil"), "öneri değerlendirmeye döndü, gelişmesi gitti");
  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
