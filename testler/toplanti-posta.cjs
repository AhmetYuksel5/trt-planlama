// Kesinleşmiş haftanın toplantı görünümünde kabul edilen paketin satırının solunda zarf: basınca onay sorulur,
// görevlendirme postası gider (demoda yalnız iz), zarf "gönderildi" işaretine döner. Bilgi kaleminde zarf yok.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  let soruldu = 0;
  p.on("dialog", (d) => (soruldu++, d.accept()));
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
    const m = d.kisiler.find((x) => x.birim === "muhabir" && x.eposta && !x.hesapsiz);
    const h = d.haftalik[0];
    h.durum = "kesinlesti";
    const temel = { tur: "feature", bicimler: ["pkg"], muhabirler: [m.id], metin: "تفاصيل التقرير", karar: "kabul" };
    h.kalemler = [
      { ...temel, id: "kl-zarf", paketBasligi: "تقرير الزرف" },
      { ...temel, id: "kl-bilgi", paketBasligi: "للعلم فقط", karar: "bilgi" },
    ];
    localStorage.setItem(k, JSON.stringify(d));
    return h.id;
  }, K);
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid + "/toplanti");
  await p.waitForTimeout(1200);
  const zarf = p.locator('[data-toplanti-kalem="kl-zarf"] [data-kalem-posta]');
  ok((await zarf.count()) === 1, "kabul kaleminde zarf");
  ok((await p.locator('[data-toplanti-kalem="kl-bilgi"] [data-kalem-posta]').count()) === 0, "bilgi kaleminde zarf yok");
  const kutu = await p.locator('[data-toplanti-kalem="kl-zarf"]').boundingBox();
  const z = await zarf.boundingBox();
  ok(z.x - kutu.x < kutu.width / 4, "zarf satırın solunda");
  // Toplantı görünümü ilk kalemi kendiliğinden seçiyor; zarf seçimi değiştirmemeli.
  await p.locator('[data-toplanti-kalem="kl-bilgi"]').click();
  await p.waitForTimeout(200);
  await zarf.click();
  await p.waitForTimeout(500);
  ok(soruldu === 1, "onay soruldu");
  ok((await p.locator('[data-toplanti-kalem="kl-zarf"] [data-kalem-posta-gitti]').count()) === 1, "gönderildi işareti");
  const iz = await p.evaluate((a) => !!JSON.parse(localStorage.getItem(a.k)).haftalik.find((h) => h.id === a.hid).kalemler.find((x) => x.id === "kl-zarf").takdirBildirimi, { k: K, hid });
  ok(iz, "kalemde iz");
  ok(!(await p.locator('[data-toplanti-kalem="kl-zarf"].secili').count()) && (await p.locator('[data-toplanti-kalem="kl-bilgi"].secili').count()) === 1, "zarfa basmak seçimi değiştirmedi");
  // Telefonda taşma yok.
  await p.setViewportSize({ width: 390, height: 800 });
  await p.waitForTimeout(400);
  ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "390 pikselde taşma yok");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
