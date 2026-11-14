// Organizasyon › Kişiler "Yöneticiler" süzgeci (kullanıcı: kurumda yönetici yalnız koordinatör, müdürler ve tam
// yöneticinin yetki verdiği kişi): kademe dışındaki yöneticiler işaretli gelir, toplu personele çevrilir, "Geri al"
// geri getirir; kademedeki müdür ve tam yönetici işaretsiz.
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 800 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-tasarim", "yeni"); });
  await p.goto("about:blank");
  await p.goto(B + "#/organizasyon/kisiler");
  await p.waitForTimeout(800);
  const kayit = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  await p.click("[data-org-yoneticiler]");
  await p.waitForTimeout(200);
  const satirlar = await p.locator("[data-org-yonetici-listesi] [data-org-kisi]").count();
  const secimler = p.locator("[data-org-yonetici-sec]");
  const n = await secimler.count();
  ok(satirlar > 0 && n > 0 && n <= satirlar, `yöneticiler listede, kademe dışındakiler seçilebilir (${n}/${satirlar})`);
  const d0 = await kayit();
  const secilenler = await secimler.evaluateAll((l) => l.map((x) => x.getAttribute("data-org-yonetici-sec")));
  const tam = d0.kisiler.filter((k) => k.hesapYoneticisi).map((k) => k.id);
  ok(!secilenler.some((id) => tam.includes(id)), "tam yönetici seçilebilenlerde yok");
  ok((await secimler.evaluateAll((l) => l.every((x) => x.checked))), "kademe dışındakiler işaretli geliyor");
  // Birini işaretten çıkar: o yönetici kalmalı.
  const birak = secilenler[0];
  await p.locator(`[data-org-yonetici-sec="${birak}"]`).uncheck();
  await p.click("[data-org-personele-cevir]");
  await p.waitForTimeout(400);
  const d1 = await kayit();
  const cevrilen = secilenler.filter((x) => x !== birak);
  ok(cevrilen.every((id) => d1.kisiler.find((k) => k.id === id).rol === "personel"), "seçilenler personel");
  ok(d1.kisiler.find((k) => k.id === birak).rol === d0.kisiler.find((k) => k.id === birak).rol, "seçilmeyen yerinde");
  ok(cevrilen.every((id) => d1.kisiler.find((k) => k.id === id).birim === d0.kisiler.find((k) => k.id === id).birim), "birim değişmedi");
  await p.getByRole("button", { name: "Geri al" }).first().click();
  await p.waitForTimeout(300);
  const d2 = await kayit();
  ok(cevrilen.every((id) => { const a = d0.kisiler.find((k) => k.id === id), c = d2.kisiler.find((k) => k.id === id); return a.rol === c.rol && a.gorev === c.gorev; }), "Geri al eski hale döndürdü");

  // Telefonda Arapça taşma yok.
  const c = await b.newContext({ ...devices["iPhone 13"] });
  const t = await c.newPage();
  await t.goto(B);
  await t.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", "ar"); localStorage.setItem("trt-planlama-tasarim", "yeni"); });
  await t.goto("about:blank");
  await t.goto(B + "#/organizasyon/kisiler");
  await t.waitForTimeout(800);
  await t.click("[data-org-yoneticiler]");
  await t.waitForTimeout(300);
  ok((await t.locator("[data-org-yonetici-listesi] [data-org-kisi]").count()) > 0, "ar telefon: liste var");
  ok((await t.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "ar telefon: taşma yok");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
