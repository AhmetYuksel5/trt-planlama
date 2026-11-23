// Ana panonun zaman çizgisi GMT (kullanıcı: plana 16 GMT girilen canlı çizgide "19:00" görünüyordu;
// çizgi İstanbul'a çeviriyor, dilimini yazmıyordu). Canlı kayıttaki GMT saatiyle, başlıkta "GMT".
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1200);
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const gun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
    const plan = d.planlar[0];
    d.canliYayinlar.push({ id: "c-gmt", planId: plan.id, konu: "بث تجريبي للتوقيت", aciklama: "", tarih: gun, saatGmt: "16:00", yer: "انقرة", notlar: "" });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, K);
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1500);
  ok((await p.locator("[data-ap-cizgi]").count()) === 1, "zaman çizgisi var");
  ok((await p.locator("[data-ap-cizgi] .ap-dilim").innerText()).trim() === "GMT", "başlıkta GMT yazıyor");
  const canli = p.locator('[data-ap-olay="canli"]').filter({ hasText: "بث تجريبي للتوقيت" });
  ok((await canli.count()) === 1, "canlı çizgide");
  ok((await canli.locator("b").first().innerText()).trim() === "16:00", "canlı kayıttaki GMT saatiyle (19:00 değil)");
  ok(((await canli.getAttribute("title")) || "").startsWith("16:00 GMT"), "ipucunda 16:00 GMT");
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
