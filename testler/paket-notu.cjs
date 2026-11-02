// Pakete eklenen not planda (plan ekranı ve çıktı) PKG satırının sonunda parantez içinde
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.evaluate(() => {
    const k = "trt-planlama-v23", d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const pk = d.paketler.find((x) => x.planId === plan.id && x.planBaslikId && x.durum !== "iptal");
    pk.notlar = [...(pk.notlar ?? []), { id: "n-test", kisiId: "pl2", zaman: new Date().toISOString(), metin: "الصور جاهزة" }];
    localStorage.setItem(k, JSON.stringify(d));
  });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  const planda = await p.locator("[data-paket-notu]", { hasText: "(الصور جاهزة)" }).count();
  await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  const ciktida = await p.locator("[data-paket-notu]", { hasText: "(الصور جاهزة)" }).count();
  console.log("planda", planda, "çıktıda", ciktida);
  await b.close(); process.exit(planda && ciktida ? 0 : 1);
})();
