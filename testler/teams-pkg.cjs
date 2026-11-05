// Gelişmenin Teams'i (kayıtlı kişi ve elle ad) plan ekranında ve çıktıda; karar bekleyen paket "PKG PROPOSAL", kabul edilen "PKG" altında
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); });
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  const ad = await p.evaluate(() => {
    const k = "trt-planlama-v24", d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const g = d.gelismeler.find((x) => x.planId === plan.id && x.planBaslikId);
    const kisi = d.kisiler.find((x) => x.birim === "planlama");
    g.teams = [{ kisiId: kisi.id }, { ad: "فريق التصوير الخارجي" }];
    const pb = g.planBaslikId, sablon = d.paketler.find((x) => x.planId === plan.id) || d.paketler[0];
    d.paketler.push({ ...sablon, id: "pk-t1", planId: plan.id, planBaslikId: pb, baslik: "تقرير مقترح للاختبار", durum: "degerlendiriliyor", slug: "" });
    d.paketler.push({ ...sablon, id: "pk-t2", planId: plan.id, planBaslikId: pb, baslik: "تقرير معتمد للاختبار", durum: "onaylandi", slug: "" });
    localStorage.setItem(k, JSON.stringify(d));
    return kisi.adAr || kisi.ad;
  });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  const ekran = await p.locator("[data-gelisme]:has([data-gelisme-teams])").first().innerText().catch(() => "");
  const ekranda = ekran.includes("TEAMS") && ekran.includes("فريق التصوير الخارجي");
  await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  const c = await p.locator("article.cikti").first().innerText();
  const teams = c.includes("TEAMS") && c.includes("فريق التصوير الخارجي");
  const oneri = c.indexOf("PKG PROPOSAL"), mt = c.lastIndexOf("تقرير مقترح للاختبار"), ot = c.lastIndexOf("تقرير معتمد للاختبار");
  const pkg = oneri > -1 && mt > oneri && ot > -1 && ot < oneri && c.lastIndexOf("\nPKG\n", ot) > -1;
  console.log("ekranda teams", ekranda, "çıktıda teams", teams, "pkg grupları", pkg, "ad", ad);
  await b.close(); process.exit(ekranda && teams && pkg && !hata ? 0 : 1);
})();
