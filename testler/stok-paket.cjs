// PKG "Stok paket olarak ekle": beklenen paketlerden çıkıp planın hazır paketlerine geçer (başlığın altında kalsın mı sorusuna "hayır"); açıklama ve kod altında
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  let soru = 0; p.on("dialog", (x) => (soru++ === 0 ? x.accept() : x.dismiss()));
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
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  const kodPlanda = await p.locator("[data-paket-kodu]", { hasText: "TEST-STOK-PKG" }).count();
  const kart = p.locator(`.kayit:has(a[href="#/paketler/${id}"])`).first();
  await kart.locator('button[aria-label="Stok paket olarak ekle"]').click(); await p.waitForTimeout(500);
  const sonuc = await p.evaluate((id) => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const pk = d.paketler.find((x) => x.id === id);
    return { hazir: plan.hazirPaketler.includes(id), durum: pk.durum, stok: pk.stok, baslik: pk.planBaslikId ?? null, ad: pk.baslik };
  }, id);
  await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  const metin = await p.locator("article.cikti").first().innerText();
  const hazirBolum = metin.split("التقارير الجاهزة")[1] ?? "";
  console.log("kod planda", kodPlanda, JSON.stringify(sonuc), "hazırda açıklama", hazirBolum.includes("شرح التقرير الجاهز"), "hazırda kod", hazirBolum.includes("TEST-STOK-PKG"));
  const kez = metin.split(sonuc.ad).length - 1;
  console.log("çıktıda kaç kez", kez);
  const ok = kez === 1 && kodPlanda > 0 && sonuc.hazir && sonuc.durum === "tamamlandi" && sonuc.stok && sonuc.baslik === null && hazirBolum.includes("شرح التقرير الجاهز") && hazirBolum.includes("TEST-STOK-PKG");
  await b.close(); process.exit(ok ? 0 : 1);
})();
