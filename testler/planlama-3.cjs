// Planlama'nın yeni mimarisi, 3. aşama: muhabir raporu (ay, karşılaştırma, sıralama, CSV), toplu
// iletişim (seçilenlere BCC posta, WhatsApp metni), Aylık olaydan özel yayına kapsam satırları ve
// ekip, çok günlü olayın Weekly'de gün gün kalemi; 390px taşma yok (Türkçe, Arapça).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol, yeni = true) => {
    await p.evaluate(([k, y]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-tasarim", y ? "yeni" : "eski"); }, [kim, yeni]);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });

  // 1. Muhabir raporu
  await gir("pl1", "#/raporlar", false);
  ok((await p.locator("[data-muhabir-raporu]").count()) === 0, "anahtar kapalıyken eski rapor");
  await gir("pl1", "#/raporlar");
  const satir = await p.locator("[data-mr-satir]").count();
  const d = await veri();
  const disSayi = d.kisiler.filter((k) => k.birim === "muhabir" && !k.pasif).length;
  ok(satir >= disSayi, `bütün muhabirler listede, işsizler de (${satir}/${disSayi})`);
  ok((await p.locator("[data-mr-satir].soluk").count()) >= 1, "işi olmayan soluk");
  await p.click('[data-mr-sirala="oneri"]');
  await p.waitForTimeout(200);
  const oneriler = await p.locator('[data-mr-hucre="oneri"]').evaluateAll((e) => e.map((x) => parseInt(x.textContent)));
  ok(oneriler.every((x, i) => i === 0 || oneriler[i - 1] >= x), "öneriye göre sıralı");
  const ay1 = await p.locator("[data-mr-ay-adi]").getAttribute("data-mr-ay-adi");
  await p.click('[data-mr-ay="-1"]');
  await p.waitForTimeout(200);
  ok((await p.locator("[data-mr-ay-adi]").getAttribute("data-mr-ay-adi")) !== ay1, "önceki aya geçiliyor");
  const [ind] = await Promise.all([p.waitForEvent("download"), p.click("[data-mr-csv]")]);
  const csv = require("fs").readFileSync(await ind.path(), "utf8");
  ok(csv.charCodeAt(0) === 0xfeff && csv.split("\r\n")[0].includes(";"), "CSV: BOM ve Türkçede noktalı virgül");
  ok(csv.split("\r\n").length === satir + 1, "CSV ekrandaki tablonun satırları");
  await p.click('[data-rapor-sekme="genel"]');
  await p.waitForTimeout(200);
  ok((await p.locator(".rapor-ozet").count()) === 1, "Genel sekmesinde eski rapor");

  // 2. Toplu iletişim
  await gir("pl2", "#/muhabirler", false);
  ok((await p.locator("[data-toplu-sec]").count()) === 0, "anahtar kapalıyken seçim yok");
  await gir("pl2", "#/muhabirler");
  const idler = await p.locator("[data-toplu-sec]").evaluateAll((e) => e.slice(0, 3).map((x) => x.dataset.topluSec));
  for (const i of idler) await p.check(`[data-toplu-sec="${i}"]`);
  ok((await p.locator("[data-toplu-cubuk]").innerText()).includes("3"), "çubukta seçili sayısı");
  await p.click("[data-toplu-posta]");
  await p.waitForTimeout(400);
  const posta = await p.locator("dialog[open] [data-posta-yeni]").innerText();
  const adlar = idler.map((i) => d.kisiler.find((k) => k.id === i).ad.ar ?? d.kisiler.find((k) => k.id === i).ad);
  ok(adlar.every((a) => posta.includes(a)), "seçilenler postada BCC'de");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  await p.click("[data-toplu-whatsapp]");
  await p.waitForTimeout(300);
  await p.fill("[data-toplu-wa-metin]", "مرحبا");
  ok((await p.locator("dialog[open] [data-toplu-wa-kisi] [data-whatsapp]").first().getAttribute("href")).includes("text=%D9%85"), "WhatsApp bağlantısında metin");
  await p.keyboard.press("Escape");
  await p.click("[data-toplu-hepsi]");
  ok((await p.locator("[data-toplu-sec]:checked").count()) === (await p.locator("[data-toplu-sec]").count()), "hepsini seç");
  await p.click("[data-toplu-temizle]");
  ok((await p.locator("[data-toplu-cubuk]").count()) === 0, "seçim temizlenince çubuk kalkıyor");
  await gir("mu1", "#/muhabirler");
  ok((await p.locator("[data-toplu-sec], [data-muhabir-raporu]").count()) === 0, "muhabir toplu seçimi görmüyor");

  // 3. Aylık olaydan özel yayın: kapsam satırları, ekip ve görevlendirme gelir
  await p.evaluate(() => {
    const x = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    for (const a of x.aylik) for (const o of a.olaylar ?? []) if (o.id === "ao-zirve") o.etiketler.push("ozel");
    localStorage.setItem("trt-planlama-v24", JSON.stringify(x));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  });
  await gir("pl1", "#/ozel");
  await p.click('[data-aylik-ozel-ac="ao-zirve"]');
  await p.waitForTimeout(700);
  const d2 = await veri();
  const olay = d2.aylik.flatMap((a) => a.olaylar ?? []).find((o) => o.id === "ao-zirve");
  const oz = d2.ozel.find((o) => o.id === olay.ozelId);
  const pkgSay = olay.gunler.flatMap((g) => g.satirlar).filter((s) => s.tur === "pkg" || s.tur === "walktalk").length;
  const canliSay = olay.gunler.flatMap((g) => g.satirlar).filter((s) => s.tur === "live" || s.tur === "nafize").length;
  ok(oz && (oz.paketOnerileri ?? []).length === pkgSay && (oz.nafizeler ?? []).length === canliSay, `PKG paket önerisi, LIVE nafize oldu (${pkgSay}/${canliSay})`);
  ok(oz.nafizeler.every((n) => olay.gunler.some((g) => g.tarih === n.tarih)), "nafizeler kendi günlerinde");
  ok(oz.hazirlik.length >= olay.ekip.length + 1 && oz.hazirlik.some((h) => h.metin.startsWith("DEPLOYMENT")), "ekip ve görevlendirme hazırlıkta");
  ok(oz.paketOnerileri.every((x) => x.durum === "oneri"), "paket önerileri onaysız");

  // 4. Çok günlü olay Weekly'de gün gün
  const h = d2.haftalik.find((x) => x.durum !== "kesinlesti" && olay.gunler.filter((g) => g.tarih >= x.baslangic).length > 1);
  await gir("pl1", "#/haftalik/" + h.id);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  await p.click('[data-aylik-gundeme="ao-zirve"]');
  await p.waitForTimeout(500);
  const kalemler = (await veri()).haftalik.find((x) => x.id === h.id).kalemler.filter((k) => k.aylikOlayId === "ao-zirve");
  ok(kalemler.length === 2 && new Set(kalemler.map((k) => k.tarih)).size === 2, "iki kapsam günü iki kalem");
  ok(kalemler.find((k) => k.tarih === "2026-11-17")?.bicimler.join() === "canli", "ikinci günün kalemi yalnız kendi satırlarıyla");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const yol of ["#/raporlar", "#/muhabirler"]) {
      await gir("pl1", yol);
      ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok ${yol} (${dil})`);
    }
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
