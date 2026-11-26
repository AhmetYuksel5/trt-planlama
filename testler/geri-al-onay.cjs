// Plan ekranında ↶ (kullanıcı: Weekly'de paket ekleyip görevlendirdi, geri al sormadan hepsini sildi):
// kayıt silecek ya da paket/öneri/görevlendirmeye dokunacak geri alma sorulur; geri alınan "Yinele"yle döner.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  let sorular = [];
  let yanit = false;
  p.on("dialog", (d) => { sorular.push(d.message()); yanit ? d.accept() : d.dismiss(); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  const kalemler = () => p.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).haftalik.find((x) => x.id === id).kalemler, [K, hid]);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-tasarim", "eski"); });
  await git("#/haftalik");
  var hid = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.durum !== "kesinlesti") || d.haftalik[0];
    h.durum = "toplantida";
    const k1 = h.kalemler.find((x) => x.baslikId && x.tarih);
    h.kalemler = [{ ...k1, id: "ga-1", karar: "bekliyor" }];
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
    return h.id;
  }, K);
  await git("#/haftalik/" + hid);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));

  // Dosyaya PKG ekle
  const grup = p.locator(".dosya-grubu", { has: p.locator("[data-kalem='ga-1']") });
  await grup.locator("[data-dosya-pkg-ekle] button").click();
  await grup.locator(".form-kutu [data-kalem-strap]").fill("تقرير للتجربة");
  await grup.locator(".form-kutu button", { hasText: "Kaydet" }).click();
  await p.waitForTimeout(400);
  ok((await kalemler()).length === 2, "PKG kalemi eklendi");

  // ↶: soru çıkar, vazgeçilince bir şey olmaz
  await p.locator("[data-geri-al]").first().click();
  await p.waitForTimeout(300);
  ok(sorular.length === 1 && /1 kayıt silinecek/.test(sorular[0]), "silecek geri alma soruluyor: " + sorular[0]);
  ok((await kalemler()).length === 2, "vazgeçince kalem yerinde");

  // Onaylayınca silinir, Yinele geri getirir
  yanit = true;
  await p.locator("[data-geri-al]").first().click();
  await p.waitForTimeout(400);
  ok((await kalemler()).length === 1, "onaylayınca geri alındı");
  ok((await p.locator("[data-yinele]").count()) === 1, "Yinele düğmesi çıktı");
  await p.locator("[data-yinele]").first().click();
  await p.waitForTimeout(400);
  const ks = await kalemler();
  ok(ks.length === 2 && ks.some((k) => k.paketBasligi === "تقرير للتجربة"), "Yinele kalemi geri getirdi");
  ok((await p.locator("[data-yinele]").count()) === 0, "yinelenecek kalmayınca düğme yok");

  // Hiçbir şey silmeyen değişiklik (karar) sorulmadan geri alınır
  sorular = [];
  await p.evaluate(() => {});
  const kart = p.locator('[data-kalem="ga-1"]').first();
  await kart.locator("button", { hasText: "Kabul" }).first().click();
  await p.waitForTimeout(400);
  ok((await kalemler()).find((k) => k.id === "ga-1").karar === "kabul", "karar verildi");
  await p.locator("[data-geri-al]").first().click();
  await p.waitForTimeout(400);
  ok(sorular.length === 0, "silmeyen geri alma sorulmadı");
  ok((await kalemler()).find((k) => k.id === "ga-1").karar === "bekliyor", "karar geri alındı");

  // Ctrl+Shift+Z yineler
  await p.locator("body").click({ position: { x: 5, y: 300 } });
  await p.keyboard.press("Control+Shift+KeyZ");
  await p.waitForTimeout(400);
  ok((await kalemler()).find((k) => k.id === "ga-1").karar === "kabul", "Ctrl+Shift+Z yineledi");

  // Posta izi geri alınmaz (kullanıcı: geri alma görevlendirme postasının "gitti" işaretini de siliyordu)
  const postaIsle = (id) => p.evaluate(([k, hid, id]) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.haftalik.find((x) => x.id === hid).kalemler.find((x) => x.id === id).takdirBildirimi = { zaman: new Date().toISOString(), kisiId: "pl1" };
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
  }, [K, hid, id]);
  sorular = [];
  await kart.locator("button", { hasText: "Kabul" }).first().click(); // kabul → bekliyor (seçili karara basmak kaldırır)
  await p.waitForTimeout(400);
  await postaIsle("ga-1");
  await p.waitForTimeout(300);
  await p.locator("[data-geri-al]").first().click();
  await p.waitForTimeout(400);
  const ga = (await kalemler()).find((k) => k.id === "ga-1");
  ok(ga.karar === "kabul" && !!ga.takdirBildirimi, "karar geri alındı, posta izi kaldı: " + ga.karar);

  // Postası gitmiş kalemi silecek geri alma bunu söyler
  await grup.locator("[data-dosya-pkg-ekle] button").click();
  await grup.locator(".form-kutu [data-kalem-strap]").fill("تقرير ثان");
  await grup.locator(".form-kutu button", { hasText: "Kaydet" }).click();
  await p.waitForTimeout(400);
  const yeniId = (await kalemler()).find((k) => k.paketBasligi === "تقرير ثان").id;
  await postaIsle(yeniId);
  await p.waitForTimeout(300);
  sorular = [];
  yanit = false;
  await p.locator("[data-geri-al]").first().click();
  await p.waitForTimeout(300);
  ok(sorular.length === 1 && /postası gitmiş/.test(sorular[0]), "postası gitmiş kayıt soruda: " + sorular[0]);

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
