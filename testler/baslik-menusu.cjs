// Telefonda Next Day başlığının "+" menüsü (kullanıcı: menü dar şeride sıkışıyor, yazılar kesiliyordu): başlık
// satırının düğmelerini 36 piksele sabitleyen kural menünün satırlarına da uyuyordu. Menü yazıları sığacak genişlikte.
const { chromium, devices } = require(process.env.PW || "playwright");
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  for (const dil of ["tr", "ar"]) {
    const c = await b.newContext({ ...devices["iPhone 13"] });
    const p = await c.newPage();
    await p.goto("http://localhost:4173/");
    await p.evaluate((x) => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-dil", x); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); }, dil);
    await p.goto("about:blank"); await p.goto("http://localhost:4173/#/nextday/yarin"); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelectorAll("details.bolum:not([open])").forEach((d) => (d.open = true)));
    await p.waitForTimeout(400);
    await p.evaluate(() => [...document.querySelectorAll(".baslik-karti > summary .sag-uc button[aria-haspopup=menu]")].filter((x) => x.offsetParent)[2]?.setAttribute("data-x", "1"));
    await p.locator("[data-x]").scrollIntoViewIfNeeded();
    await p.locator("[data-x]").click();
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const m = document.querySelector(".islem-menusu");
      const satir = [...m.querySelectorAll(".acilir-satir")].filter((x) => x.offsetParent);
      return { gen: m.getBoundingClientRect().width, tasan: satir.filter((x) => x.scrollWidth > x.clientWidth + 1 || x.getBoundingClientRect().height > 60).length, sag: m.getBoundingClientRect().right };
    });
    ok(r.gen >= 150, `${dil}: menü genişliği ${Math.round(r.gen)}`);
    ok(r.tasan === 0, `${dil}: satırlar tek satırda (${r.tasan})`);
    ok(r.sag <= 390, `${dil}: menü ekranda`);
    await c.close();
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
