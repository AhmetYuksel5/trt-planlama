// Plan belgesi kaybolup gelişme/paketleri kalınca: Next Day'de "kaydı kaybolmuş" şeridi, "Planı geri getir" aynı kimlikle açar, başlıksız kalan kayıtlar için şerit çıkar
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  const id = await p.evaluate(() => {
    const k = "trt-planlama-v23", d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    // Gerçek kipteki kimlik (nd-<tarih>): kayıtlar ona bağlı, plan belgesi gitmiş.
    const yeni = `nd-${plan.tarih}`;
    for (const l of [d.gelismeler, d.canliYayinlar, d.paketler]) for (const x of l) if (x.planId === plan.id) x.planId = yeni;
    d.planlar = d.planlar.filter((x) => x.id !== plan.id);
    localStorage.setItem(k, JSON.stringify(d)); return yeni;
  });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  const serit = await p.locator(`[data-kayip-plan="${id}"]`).count();
  await p.locator("[data-kayip-plan-getir]").first().click(); await p.waitForTimeout(800);
  const geri = await p.evaluate((id) => JSON.parse(localStorage.getItem("trt-planlama-v23")).planlar.some((x) => x.id === id), id);
  const baslikSeridi = await p.locator("[data-kayip-seridi]").count();
  console.log("şerit", serit, "geri", geri, "başlık şeridi", baslikSeridi);
  await b.close(); process.exit(serit && geri && baslikSeridi ? 0 : 1);
})();
