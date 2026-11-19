// Weekly'nin günsüz bölümü "Stok ve programlar" (kullanıcı): orada kabul edilen feature haber merkezinin stokunda,
// program paketi masanın takibinde; Stok sayfası "Haber merkezi / Programlar" diye ikiye ayrılıyor; kesinleşen
// haftanın görev postası penceresinde günlük haberler ve stok/programlar ayrı sekmede.
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
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await git("#/haftalik");

  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.filter((x) => x.durum !== "kesinlesti").sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0];
    h.durum = "toplantida";
    h.kalemler = [];
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
    const kalem = (id, tur, tarih, strap) => ({ id, karar: "kabul", tarih, tur, yer: "", metin: "متن " + id, bicimler: ["pkg"], muhabirler: [mu.id], paketBasligi: strap });
    h.kalemler.push(
      kalem("sp-gun", "haber", h.baslangic, "تقرير يومي اختباري"),
      kalem("sp-feature", "feature", undefined, "تقرير مخزن اختباري"),
      kalem("sp-program", "program", undefined, "حلقة برنامج اختبارية"),
    );
    localStorage.setItem(k, JSON.stringify(d));
    return { hid: h.id };
  }, K);

  // 1. Weekly'de bölümün yeni adı
  await git("#/haftalik/" + ids.hid);
  ok((await p.locator("main").innerText()).includes("Stok ve programlar"), "Weekly bölümünün adı Stok ve programlar");
  await git(`#/haftalik/${ids.hid}/cikti`);
  ok((await p.locator("article.cikti").first().innerText()).includes("التقارير المخزنة والبرامج"), "çıktıda bölümün Arapça adı");

  // 2. Kesinleştir: günsüz kalemler plansız paket olur
  await git("#/haftalik/" + ids.hid);
  await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
  await p.locator("[data-gozden-kesinlestir]").click(); await p.waitForTimeout(800);
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const fe = d.paketler.find((x) => x.haftalikKalemId === "sp-feature");
  const pr = d.paketler.find((x) => x.haftalikKalemId === "sp-program");
  ok(!!fe && fe.stok && !fe.planId, "feature haber merkezinin stokunda");
  ok(!!pr && pr.tur === "program" && !pr.stok, "program paketi masaya gitti");

  // 3. Stok sayfası: başlık ve iki alan
  await git("#/stok");
  ok((await p.locator("main").innerText()).includes("Stok haberler / Programlar"), "sayfanın yeni adı");
  ok((await p.locator(`a[href="#/paketler/${fe.id}"]`).count()) > 0 || (await p.locator("main").innerText()).includes("تقرير مخزن اختباري"), "Haber merkezinde feature paketi");
  await p.locator('[data-stok-alan="masa"]').click(); await p.waitForTimeout(300);
  ok((await p.locator('[data-stok-masa="program"]').count()) === 1 && (await p.locator('[data-stok-masa="ekonomi"]').count()) === 1, "Programlar alanında masa seçimi");
  await p.locator('[data-stok-masa="program"]').click(); await p.waitForTimeout(200);
  await p.locator('[data-stok-masa-alan="planlamada"]').click(); await p.waitForTimeout(200);
  ok((await p.locator("[data-stok-masa-liste]").innerText()).includes("حلقة برنامج اختبارية"), "program paketi Programlar alanında");
  ok(!(await p.locator("[data-stok-masa-liste]").innerText()).includes("تقرير مخزن اختباري"), "feature Programlar alanında değil");

  // 4. Görev postası penceresi iki sekmeli (menüsü haftalık düzenleyende: planlamacı)
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl1"));
  await git("#/haftalik/" + ids.hid);
  await p.locator(".plan-basi [aria-haspopup], .plan-basi .dugme-ikon").last().click();
  await p.locator('[data-arac="kabul-paketler"]').click(); await p.waitForTimeout(400);
  const satirlar = () => p.locator("dialog [data-takdir-paket]").evaluateAll((l) => l.map((e) => e.getAttribute("data-takdir-paket")));
  ok(JSON.stringify(await satirlar()) === JSON.stringify(["sp-gun"]), "Günlük sekmesinde yalnız günlü kalem: " + (await satirlar()));
  await p.locator('[data-takdir-sekme="stok"]').click(); await p.waitForTimeout(300);
  const s2 = await satirlar();
  ok(s2.length === 2 && s2.includes("sp-feature") && s2.includes("sp-program"), "Stok ve programlar sekmesinde günsüzler: " + s2);
  await p.keyboard.press("Escape");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/stok");
    await p.locator('[data-stok-alan="masa"]').click(); await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok, Programlar alanı (${dil}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
