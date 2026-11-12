// "Başlığın altında da kalsın" denince paket hazır paketlerde ve başlığın altında; Stok'ta da duruyor
const BASLIKTA = true;
const { chromium } = require(process.env.PW || "playwright");
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = []; p.on("pageerror", (e) => hatalar.push(String(e)));
  let soru = 0; p.on("dialog", (x) => (soru++ === 0 ? x.accept() : BASLIKTA ? x.accept() : x.dismiss()));
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  // İlk açık PKG'ye kod ve açıklama ver
  const id = await p.evaluate(() => {
    const k = "trt-planlama-v24", d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const pk = d.paketler.find((x) => x.planId === plan.id && x.planBaslikId && ["taslak", "degerlendiriliyor", "onaylandi"].includes(x.durum) && !x.ozelId);
    pk.slug = "TEST-STOK-PKG"; pk.aciklama = "شرح التقرير الجاهز"; localStorage.setItem(k, JSON.stringify(d)); return pk.id;
  });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  const ac = () => p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click()));
  await ac(); await p.waitForTimeout(300);
  ok((await p.locator("[data-paket-kodu]", { hasText: "TEST-STOK-PKG" }).count()) > 0, "kod planda görünüyor");
  const kart = p.locator(`.kayit:has(a[href="#/paketler/${id}"])`).first();
  await kart.locator('button[aria-label="Stok paket olarak ekle"]').click(); await p.waitForTimeout(500);
  const durum = () => p.evaluate((id) => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const pk = d.paketler.find((x) => x.id === id);
    return { hazir: plan.hazirPaketler.includes(id), durum: pk.durum, stok: pk.stok, baslik: pk.planBaslikId ?? null, ad: pk.baslik };
  }, id);
  const s1 = await durum();
  ok(s1.durum === "tamamlandi" && s1.stok, "stok paketi oldu, tamamlandı");
  // Kullanıcı: işaretlenen paket hazır paketlerde görünmeli; bir süre yalnız Stok'a gidip التقارير المتوقعة'da basılıyordu.
  ok(s1.hazir, "planın hazır paketlerine girdi");
  ok(BASLIKTA ? s1.baslik !== null : s1.baslik === null, BASLIKTA ? "başlığın altında kaldı" : "başlıktan ayrıldı");
  // Stok › Üretilmiş paketler
  await p.goto("about:blank"); await p.goto(B + "#/stok"); await p.waitForTimeout(800);
  ok((await p.locator('[role="tab"][aria-selected="true"]').innerText()).includes("Üretilmiş paketler"), "Stok'ta açık sekme Üretilmiş paketler");
  ok((await p.locator(`a[href="#/paketler/${id}"]`).count()) > 0, "paket Üretilmiş paketler'de");
  await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  const metin = await p.locator("article.cikti").first().innerText();
  const hazirBolum = metin.split("التقارير الجاهزة")[1] ?? "";
  ok(hazirBolum.includes("شرح التقرير الجاهز") && hazirBolum.includes("TEST-STOK-PKG"), "çıktının hazır bölümünde açıklama ve kod");
  const beklenenBolum = (metin.split("التقارير المتوقعة")[1] ?? "").split("الأحداث الإخبارية")[0];
  ok(!beklenenBolum.includes(s1.ad), "beklenen paketlerde basılmadı");
  const kez = metin.split(s1.ad).length - 1;
  ok(kez === (BASLIKTA ? 2 : 1), "çıktıda " + (BASLIKTA ? "iki" : "bir") + " kez: " + kez);
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
