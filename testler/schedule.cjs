// Gelişmenin "Schedule"ı: saat sırasıyla plan ekranında ve çıktıda paragrafın altında; formda kutu işaretli gelir
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.evaluate(() => {
    const k = "trt-planlama-v25", d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const g = d.gelismeler.find((x) => x.planId === plan.id && x.planBaslikId);
    g.program = [{ saat: "14:00", olay: "مؤتمر صحفي مشترك" }, { saat: "10:30", olay: "وصول الرئيس إلى المطار" }];
    localStorage.setItem(k, JSON.stringify(d));
  });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  const ekran = await p.locator("[data-gelisme]:has([data-schedule])").first().innerText();
  const sira = ekran.indexOf("10:30") > -1 && ekran.indexOf("10:30") < ekran.indexOf("14:00");
  await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  const cikti = await p.locator("article.cikti").first().innerText();
  const ciktida = /SCHEDULE\s*\n?\s*10:30 \/ وصول الرئيس/.test(cikti) && cikti.includes("14:00 / مؤتمر صحفي مشترك");
  console.log("ekranda sıra", sira, "çıktıda", ciktida);
  await b.close(); process.exit(sira && ciktida ? 0 : 1);
})();
