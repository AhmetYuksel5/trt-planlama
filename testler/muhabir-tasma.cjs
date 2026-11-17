// Muhabirin Önerilerim'i telefonda: uzun Arapça başlık satırı kartın dışına itmesin (kullanıcı: başlıklar görünmüyor,
// ekran yana taşıyordu; ızgara sütunu içeriğe göre açılıyordu).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await p.goto("about:blank");
  await p.goto(B + "#/oneriler");
  await p.waitForTimeout(1000);
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const uzun = "هدف توصل الطرفين الى آلية للتحقق من المناطق التي ينسحب منها الجيش وانتشار القوات الدولية في الجنوب";
    for (const o of d.oneriler) if (o.muhabirId === "mu1") (o.paketBasligi = uzun), (o.haberBasligi = uzun);
    for (const x of d.paketler) if (x.muhabirId === "mu1") x.baslik = uzun;
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, K);
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((x) => { localStorage.setItem("trt-planlama-dil", x); localStorage.setItem("trt-planlama-oturum", "mu1"); }, dil);
    await p.goto("about:blank");
    await p.goto(B + "#/oneriler");
    await p.waitForTimeout(1200);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `taşma yok (${dil})`);
    const tasan = await p.evaluate(() => {
      const kart = document.querySelector(".muhabir-gruplari").getBoundingClientRect();
      return [...document.querySelectorAll(".muhabir-gruplari li")].filter((li) => li.getBoundingClientRect().right > kart.right + 1).length;
    });
    ok((await p.locator(".muhabir-gruplari li").count()) > 0 && tasan === 0, `satırlar kartın içinde (${dil}, ${tasan})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
