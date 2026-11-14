// Kesinleşmiş haftada toplantı notları düzenlenebiliyor (kalemin karar notu ve ek talebi, genel not) ve toplantı
// görünümünde kalıyor; Weekly çıktısına girmiyor. Karar düğmeleri kesinleşince yok.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/";
  const K = "trt-planlama-v25";
  let gec = 0;
  let kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  await p.goto(B);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("trt-planlama-oturum", "pl1");
  });
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik");
  await p.waitForTimeout(1200);
  const hid = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const m = d.kisiler.find((x) => x.birim === "muhabir" && !x.hesapsiz);
    const h = d.haftalik[0];
    h.durum = "kesinlesti";
    h.kalemler = [{ id: "kl-not", tur: "feature", bicimler: ["pkg"], muhabirler: [m.id], metin: "تفاصيل", paketBasligi: "تقرير", karar: "kabul", kararNotu: "ESKI-NOT" }];
    d.toplantiNotlari = [{ id: "tn-1", planId: h.id, kisiId: "pl1", zaman: new Date().toISOString(), metin: "GENEL-ESKI" }];
    localStorage.setItem(k, JSON.stringify(d));
    return h.id;
  }, K);
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid + "/toplanti");
  await p.waitForTimeout(1200);
  await p.locator('[data-toplanti-kalem="kl-not"]').click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-toplanti-ayrinti] [data-karar-dugme]").count()) === 0, "kesinleşince karar düğmesi yok");
  await p.locator("[data-toplanti-ayrinti] [data-karar-notu-ac]").click();
  await p.locator("[data-karar-notu]").fill("YENI-KARAR-NOTU");
  await p.locator("[data-ek-talep]").fill("YENI-EK-TALEP");
  await p.locator("[data-karar-notu-formu] button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  // Genel not düzenlenir.
  await p.locator('[data-toplanti-notu="tn-1"] button[title="Düzenle"]').first().click();
  await p.locator("[data-toplanti-not-duzen-girdi]").fill("GENEL-YENI");
  await p.locator("[data-toplanti-not-kaydet]").click();
  await p.waitForTimeout(400);
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const k = d.haftalik.find((h) => h.id === hid).kalemler[0];
  ok(k.kararNotu === "YENI-KARAR-NOTU" && k.ekTalep === "YENI-EK-TALEP", "karar notu ve ek talep kaydedildi");
  ok(d.toplantiNotlari.find((n) => n.id === "tn-1").metin === "GENEL-YENI", "genel not düzenlendi");
  const metin = await p.locator("[data-toplanti]").innerText();
  ok(metin.includes("YENI-KARAR-NOTU") && metin.includes("GENEL-YENI"), "notlar toplantı görünümünde");
  await p.goto(B + "#/haftalik/" + hid + "/cikti");
  await p.waitForTimeout(1000);
  const cikti = await p.locator("main").innerText();
  ok(!/YENI-KARAR-NOTU|YENI-EK-TALEP|GENEL-YENI/.test(cikti), "çıktıda notlar yok");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
