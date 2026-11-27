// Muhabiri sonra atanan olay önerisi (kullanıcı: öneriyi illa bir muhabir adına girmek zorunda kalmayalım,
// olay için girip muhabiri sonra atayalım): formda "Muhabir sonra", kayıt muhabirsiz ve kaynaksız,
// pencerenin ⋯'sinde "Muhabir ata"; atanınca muhabir önerisi gibi (doğrudan görev açılır), muhabire haber.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(700); };
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });

  await git("#/oneriler/yeni");
  await p.check("[data-oneri-muhabir-sonra]");
  const strap = "قمة المناخ في الرياض";
  await p.fill("[data-oneri-strap]", strap);
  await p.fill("[data-oneri-gelisme]", "تنطلق القمة بمشاركة واسعة من الدول العربية");
  const once = (await durum()).oneriler.length;
  await p.click("[data-oneri-gonder]");
  await p.waitForTimeout(700);
  const d1 = await durum();
  const o = d1.oneriler.find((x) => x.paketBasligi === strap || x.haberBasligi === strap);
  ok(d1.oneriler.length === once + 1 && !!o, "öneri kaydedildi");
  ok(o && !o.muhabirId && !o.kaynakTuru && o.giren === "pl1", "muhabirsiz ve kaynaksız");

  await git("#/oneriler/" + (o && o.id));
  const sayfa = await p.locator("main").innerText();
  ok(sayfa.includes("Atanmadı"), "atanmadı görünüyor");
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 0, "muhabirsizken doğrudan görev yok");
  await p.locator("[data-oneri-alt] button[aria-haspopup='menu']").first().click();
  await p.waitForTimeout(200);
  await p.click("[data-oneri-muhabir-ata]");
  const muhabir = d1.kisiler.find((k) => k.birim === "muhabir" && !k.pasif && !k.hesapsiz);
  await p.selectOption("[data-oneri-muhabir-formu] select", muhabir.id);
  await p.click("[data-oneri-muhabir-kaydet]");
  await p.waitForTimeout(500);
  const d2 = await durum();
  const o2 = d2.oneriler.find((x) => x.id === o.id);
  ok(o2.muhabirId === muhabir.id, "muhabir atandı");
  ok(d2.hareketler.some((h) => h.tip === "oneriMuhabirAtandi" && h.oneriId === o.id && h.veri?.kime === muhabir.id), "muhabire haber");
  await p.locator("[data-oneri-alt] button[aria-haspopup='menu']").first().click();
  await p.waitForTimeout(200);
  ok((await p.locator("[data-oneri-muhabir-ata]").count()) === 0, "atandıktan sonra menüde yok");
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 1, "atandıktan sonra doğrudan görev açık");

  // Muhabir kendi bildiriminde ve önerisinde görüyor.
  await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), muhabir.id);
  await git("#/oneriler/" + o.id);
  ok((await p.locator("main").innerText()).includes("الرياض"), "muhabir öneriyi görüyor");

  console.log(`oneri-muhabir-sonra: ${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
