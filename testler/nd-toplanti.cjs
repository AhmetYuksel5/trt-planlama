// Next Day toplantı görünümü (Weekly'dekinin karşılığı): belgede PKG seçilir, 1 kabul, 4 ret (onay sorularak), N karar
// notu; genel toplantı notu; "Planı onayla"; onaydan sonra kabul edilen paketin solunda zarf; notlar çıktıda yok.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/";
  const K = "trt-planlama-v24";
  let gec = 0;
  let kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("trt-planlama-oturum", "pl1");
  });
  await p.goto("about:blank");
  await p.goto(B + "#/nextday");
  await p.waitForTimeout(1200);
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.planlar.find((x) => x.id === "nd-yarin").durum = "toplantida";
    localStorage.setItem(k, JSON.stringify(d));
  }, K);
  await p.goto("about:blank");
  await p.goto(B + "#/nextday/nd-yarin");
  await p.waitForTimeout(1000);
  ok((await p.locator("[data-toplanti-ac]").count()) === 1, "Sıradaki kartında toplantı görünümü");
  await p.locator("[data-toplanti-ac]").click();
  await p.waitForTimeout(1200);
  const ilk = await p.locator("[data-toplanti-kalem]").evaluateAll((l) => l.map((e) => e.getAttribute("data-toplanti-kalem")));
  ok(ilk.length >= 2, "belgede seçilebilir PKG: " + ilk.length);
  const secili = () => p.locator("[data-toplanti-kalem].secili").getAttribute("data-toplanti-kalem");
  const a = await secili();
  await p.keyboard.press("1");
  await p.waitForTimeout(400);
  let d = await oku();
  ok(d.paketler.find((x) => x.id === a).durum === "onaylandi", "1 kabul etti");
  const bb = await secili();
  ok(bb && bb !== a, "kararla sonraki pakete geçti");
  await p.keyboard.press("4");
  await p.waitForTimeout(400);
  d = await oku();
  const r = d.paketler.find((x) => x.id === bb);
  ok(r.durum === "iptal" && !!r.reddedildi, "4 reddetti");
  ok((await p.locator(`[data-toplanti-kalem="${bb}"]`).count()) === 0, "reddedilen belgeden çıktı");
  // Karar notu: kabul edilen pakete.
  await p.locator(`[data-toplanti-kalem="${a}"]`).click();
  await p.keyboard.press("n");
  await p.locator("[data-karar-notu]").fill("ND-KARAR-NOTU");
  await p.locator("[data-ek-talep]").fill("ND-EK-TALEP");
  await p.locator("[data-karar-notu-formu] button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  d = await oku();
  ok(d.paketler.find((x) => x.id === a).kararNotu === "ND-KARAR-NOTU", "paketin karar notu");
  await p.locator("[data-toplanti-not-girdi]").fill("ND-GENEL-NOT");
  await p.locator("[data-toplanti-not-ekle]").click();
  await p.waitForTimeout(300);
  d = await oku();
  ok((d.toplantiNotlari ?? []).some((n) => n.planId === "nd-yarin" && n.metin === "ND-GENEL-NOT"), "genel toplantı notu");
  // Onay; onaydan sonra notlar düzenlenebilir, kabul edilen paketin solunda zarf.
  await p.locator("[data-nd-toplanti-onayla]").click();
  await p.waitForTimeout(800);
  d = await oku();
  ok(d.planlar.find((x) => x.id === "nd-yarin").durum === "onayli", "plan onaylandı");
  await p.goto(B + "#/nextday/nd-yarin/toplanti");
  await p.waitForTimeout(1200);
  const zarf = p.locator(`[data-toplanti-kalem="${a}"] [data-kalem-posta]`);
  ok((await zarf.count()) === 1, "kabul edilen pakette zarf");
  await zarf.click();
  await p.waitForTimeout(400);
  d = await oku();
  ok(!!d.paketler.find((x) => x.id === a).takdirBildirimi, "zarfla posta işaretlendi");
  await p.locator(`[data-toplanti-kalem="${a}"]`).click();
  ok((await p.locator("[data-toplanti-ayrinti] [data-karar-notu-ac]").count()) === 1, "onaydan sonra not düzenlenebilir");
  ok((await p.locator("[data-toplanti-ayrinti] [data-karar-dugme]").count()) === 0, "onaydan sonra karar düğmesi yok");
  // Notlar çıktıda yok.
  await p.goto(B + "#/nextday/nd-yarin/cikti");
  await p.waitForTimeout(1000);
  ok(!/ND-KARAR-NOTU|ND-EK-TALEP|ND-GENEL-NOT/.test(await p.locator("main").innerText()), "çıktıda notlar yok");
  // ⋯ menüsünde toplantı görünümü ve kabul edilen paketler.
  await p.goto(B + "#/nextday/nd-yarin");
  await p.waitForTimeout(800);
  await p.locator(".plan-basi .dugme-ikon[aria-haspopup], .plan-basi [aria-haspopup]").last().click();
  ok((await p.locator('[data-arac="toplanti"]').count()) === 1 && (await p.locator('[data-arac="kabul-paketler"]').count()) === 1, "⋯ menüsünde iki giriş");
  // Telefonda taşma yok.
  await p.goto(B + "#/nextday/nd-yarin/toplanti");
  await p.setViewportSize({ width: 390, height: 800 });
  await p.waitForTimeout(600);
  ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "390 pikselde taşma yok");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
